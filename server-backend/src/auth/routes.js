// auth/routes.js - placeholder OAuth-like flow & session issuance (in-memory)
import express from 'express';
import { getEnabledProviders, buildMockAuthRedirect } from './providers.js';
import { query } from '../db.js';
import { issueTokens, verifyToken, rotateRefresh } from './jwt.js';
import { OAuth2Client } from 'google-auth-library';
import { incMetric } from '../metrics-state.js';
import { generateCodeVerifier, codeChallengeS256, generateState, storeOAuthState, consumeOAuthState } from './pkce.js';

const sessions = new Map(); // token -> { userId, provider, created, ttlMs }
const SESSION_TTL_MS = parseInt(process.env.SESSION_TTL_MS || '3600000', 10); // 1h default
let lastCleanup = 0;
function cleanupSessions() {
    const now = Date.now();
    if (now - lastCleanup < 60000) return; // run at most once per minute
    lastCleanup = now;
    let removed = 0;
    for (const [tok, s] of sessions.entries()) {
        if (now - s.created > (s.ttlMs || SESSION_TTL_MS)) { sessions.delete(tok); removed++; }
    }
    if (removed) console.log('[auth] cleaned expired sessions', removed);
}
const router = express.Router();

// Google OAuth2 client (lazy)
let googleClient = null;
function getGoogleClient() {
    if (!googleClient) {
        const cid = process.env.GOOGLE_CLIENT_ID || process.env.OAUTH_GOOGLE_CLIENT_ID;
        if (cid) googleClient = new OAuth2Client(cid);
    }
    return googleClient;
}

function randomToken() { return 'tok_' + Math.random().toString(36).slice(2) + Date.now().toString(36); }

router.get('/providers', (req, res) => {
    const list = getEnabledProviders();
    const providers = list.map(p => (typeof p === 'string' ? { provider: p } : p));
    res.json({ providers });
});

// POST /api/auth/google  { idToken }  -> verify Google ID token, upsert user, issue JWT
// Test shortcut: when NODE_ENV=test and idToken starts with 'test-google:' treat suffix as sub/email local
router.post('/google', express.json(), async (req, res) => {
    try {
        const { idToken } = req.body || {};
        if (!idToken) return res.status(400).json({ error: 'idToken_required' });
        let sub = null; let email = null; let name = null; let testMode = false;
        const allowTestMode = (process.env.NODE_ENV !== 'production') || process.env.ENABLE_TEST_GOOGLE === '1';
        if (allowTestMode && idToken.startsWith('test-google:')) {
            testMode = true;
            const parts = idToken.split(':');
            sub = parts[1] || 'test_sub';
            email = parts[2] || (sub + '@test.local');
            name = 'g_' + sub.slice(0, 8);
        } else {
            const client = getGoogleClient();
            if (!client) return res.status(500).json({ error: 'google_client_not_configured' });
            const ticket = await client.verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT_ID || process.env.OAUTH_GOOGLE_CLIENT_ID });
            const payload = ticket.getPayload();
            sub = payload.sub; email = payload.email; name = payload.name || payload.email?.split('@')[0];
        }
        if (!sub) return res.status(401).json({ error: 'invalid_token' });
        let rows = await query('SELECT u.id,u.role,u.display_name FROM user_social_identities si JOIN users u ON u.id=si.user_id WHERE si.provider=? AND si.provider_user_id=? LIMIT 1', ['google', sub]);
        let userId;
        if (!rows.length) {
            const countRows = await query('SELECT COUNT(*) as c FROM users');
            const isFirst = (countRows[0]?.c || 0) === 0;
            const displayName = name || ('google_' + sub.slice(0, 10));
            await query('INSERT INTO users(display_name, role, email) VALUES(?,?,?)', [displayName, isFirst ? 'admin' : 'user', email || null]);
            const newRow = await query('SELECT id,role FROM users WHERE display_name=? ORDER BY id DESC LIMIT 1', [displayName]);
            userId = newRow[0].id;
            await query('INSERT INTO user_social_identities(user_id,provider,provider_user_id,email_at_provider) VALUES(?,?,?,?)', [userId, 'google', sub, email || null]);
        } else {
            userId = rows[0].id;
        }
        const [u] = await query('SELECT id, role, display_name, email FROM users WHERE id=?', [userId]);
        const jwtPair = await issueTokens({ id: u.id, role: u.role });
        // identities 포함
        const identities = await query('SELECT provider, provider_user_id, email_at_provider FROM user_social_identities WHERE user_id=?', [userId]);
        res.json({ provider: 'google', userId: u.id, display_name: u.display_name, email: u.email || email || null, identities, testMode, ...jwtPair });
    } catch (e) {
        console.error('[auth.google.error]', e.message);
        res.status(500).json({ error: 'google_auth_failed' });
    }
});

router.get('/login/:provider', async (req, res) => {
    const { provider } = req.params;
    const enabled = getEnabledProviders();
    if (!enabled.includes(provider)) return res.status(404).json({ error: 'provider_disabled' });
    const isGoogle = provider === 'google' && process.env.OAUTH_GOOGLE_CLIENT_ID && process.env.OAUTH_GOOGLE_CLIENT_SECRET;
    const baseOrigin = process.env.PUBLIC_ORIGIN || `http://localhost:${process.env.PORT || 50000}`;
    const callbackUrl = `${baseOrigin}/api/auth/callback/${provider}`;
    const link = req.query.link === '1';
    if (isGoogle) {
        // Real authorize URL with PKCE + state
        const verifier = generateCodeVerifier();
        const challenge = codeChallengeS256(verifier);
        const state = generateState();
        await storeOAuthState(state, { provider, verifier, callbackUrl, link });
        const params = new URLSearchParams({
            client_id: process.env.OAUTH_GOOGLE_CLIENT_ID,
            redirect_uri: callbackUrl,
            response_type: 'code',
            scope: 'openid email profile',
            code_challenge: challenge,
            code_challenge_method: 'S256',
            state
        });
        return res.json({ provider, authorize: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`, state, pkce: true, link });
    }
    // fallback mock
    const base = process.env.OAUTH_CALLBACK_BASE_URL || baseOrigin;
    const redirect = buildMockAuthRedirect(provider, base);
    res.json({ provider, redirect, mock: true });
});

// Mock callback: exchanges ?code= for a fake user/session. Real flow would fetch provider token & profile.
async function logAuthEvent(event, { userId = null, provider = null, detail = null, req }) {
    try {
        const ip = req?.headers['x-forwarded-for']?.split(',')[0].trim() || req?.socket?.remoteAddress || null;
        const ua = (req?.headers['user-agent'] || '').slice(0, 250);
        await query('INSERT INTO auth_audit(user_id,provider,event,ip,user_agent,detail_json) VALUES(?,?,?,?,?,?)', [userId, provider, event, ip, ua, detail ? JSON.stringify(detail).slice(0, 5000) : null]);
    } catch (e) { /* swallow */ }
}

router.get('/callback/:provider', async (req, res) => {
    const { provider } = req.params;
    const enabled = getEnabledProviders();
    if (!enabled.includes(provider)) return res.status(404).json({ error: 'provider_disabled' });
    const code = req.query.code;
    const stateParam = req.query.state;
    const isGoogle = provider === 'google' && process.env.OAUTH_GOOGLE_CLIENT_ID && process.env.OAUTH_GOOGLE_CLIENT_SECRET;
    const linkFlag = req.query.link === '1';
    try {
        let providerUserId;
        let email;
        if (isGoogle && code) {
            const st = await consumeOAuthState(stateParam);
            if (!st) return res.status(400).json({ error: 'invalid_state' });
            const verifier = st.verifier;
            // Exchange code
            const tokenResp = await fetch('https://oauth2.googleapis.com/token', {
                method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    client_id: process.env.OAUTH_GOOGLE_CLIENT_ID,
                    client_secret: process.env.OAUTH_GOOGLE_CLIENT_SECRET,
                    code,
                    grant_type: 'authorization_code',
                    redirect_uri: st.callbackUrl,
                    code_verifier: verifier
                })
            });
            if (!tokenResp.ok) {
                const text = await tokenResp.text();
                return res.status(502).json({ error: 'token_exchange_failed', detail: text.slice(0, 500) });
            }
            const tokenJson = await tokenResp.json();
            // If id_token present decode (without verification for now - TODO: verify signature via jwks)
            if (tokenJson.id_token) {
                const payloadBase = tokenJson.id_token.split('.')[1];
                const payload = JSON.parse(Buffer.from(payloadBase, 'base64').toString('utf8'));
                providerUserId = payload.sub;
                email = payload.email;
            } else {
                // fallback: call userinfo
                if (tokenJson.access_token) {
                    const uiResp = await fetch('https://openidconnect.googleapis.com/v1/userinfo', { headers: { Authorization: 'Bearer ' + tokenJson.access_token } });
                    const ui = await uiResp.json();
                    providerUserId = ui.sub; email = ui.email;
                }
            }
        }
        if (!providerUserId) {
            // mock fallback
            providerUserId = 'demo_' + provider;
        }
        // Linking: if Authorization bearer access token present -> attach identity to that user
        let linkUserId = null;
        const auth = req.headers.authorization || '';
        const m = auth.match(/^Bearer (.+)$/);
        if (m) {
            const payload = verifyToken(m[1], 'access');
            if (payload) {
                const n = parseInt(payload.sub, 10);
                linkUserId = Number.isFinite(n) ? n : null;
            }
        }
        // Find existing identity
        let identity = await query('SELECT u.id as user_id,u.role,u.display_name FROM user_social_identities si JOIN users u ON u.id=si.user_id WHERE si.provider=? AND si.provider_user_id=? LIMIT 1', [provider, providerUserId]);
        let userId;
        let linked = false;
        if (identity.length) {
            userId = identity[0].user_id;
            // If this callback was a linking attempt (Authorization present or link=1) and identity already points to same user, treat as idempotent link
            if (linkUserId && Number(userId) === Number(linkUserId)) linked = true;
            else if (linkFlag && !linkUserId) linked = true; // soft: link=1 without auth, identity exists -> consider linked (no-op)
        } else if (linkUserId) {
            // Attach new identity to existing user
            await query('INSERT INTO user_social_identities(user_id,provider,provider_user_id,email_at_provider) VALUES(?,?,?,?)', [linkUserId, provider, providerUserId, email || null]);
            userId = linkUserId;
            linked = true;
        } else {
            // Create new user then identity
            const countRows = await query('SELECT COUNT(*) as c FROM users');
            const isFirst = (countRows[0]?.c || 0) === 0;
            const displayName = provider + '_' + providerUserId.slice(0, 10);
            await query('INSERT INTO users(display_name, role, email) VALUES(?,?,?)', [displayName, isFirst ? 'admin' : 'user', email || null]);
            const newRow = await query('SELECT id, role FROM users WHERE display_name=? ORDER BY id DESC LIMIT 1', [displayName]);
            userId = newRow[0].id;
            await query('INSERT INTO user_social_identities(user_id,provider,provider_user_id,email_at_provider) VALUES(?,?,?,?)', [userId, provider, providerUserId, email || null]);
        }
        cleanupSessions();
        const legacyToken = randomToken();
        sessions.set(legacyToken, { userId, provider, created: Date.now(), ttlMs: SESSION_TTL_MS });
        const [urow] = await query('SELECT id, role, display_name FROM users WHERE id=?', [userId]);
        const jwtPair = await issueTokens({ id: urow.id, role: urow.role });
        // Optional: set refresh cookie when REFRESH_COOKIE=1
        if (process.env.REFRESH_COOKIE === '1') {
            try {
                const secure = process.env.COOKIE_SECURE === '1';
                res.cookie('refresh_token', jwtPair.refresh, {
                    httpOnly: true,
                    secure,
                    sameSite: 'Lax',
                    path: '/api/auth',
                    maxAge: jwtPair.refresh_expires_in * 1000
                });
            } catch { /* ignore cookie set failure */ }
        }
        incMetric('authLoginSuccess');
        if (linked) incMetric('authLink');
        logAuthEvent(linked ? 'login_link_success' : 'login_success', { userId, provider, req, detail: { linked } });
        // Normalize userId to number for consistency across flows
        const uidNum = typeof userId === 'string' ? parseInt(userId, 10) : userId;
        res.json({ provider, userId: uidNum, legacyToken, linked, ...jwtPair });
    } catch (e) {
        console.error('[auth.callback.error]', e.message);
        incMetric('authLoginFail');
        logAuthEvent('login_fail', { provider: req.params.provider, req, detail: { error: e.message.slice(0, 200) } });
        res.status(500).json({ error: 'auth_callback_failed' });
    }
});

// /api/auth/me 확장 (email, identities)
router.get('/me', async (req, res) => {
    const auth = req.headers.authorization || '';
    const m = auth.match(/^Bearer (.+)$/);
    if (!m) return res.status(401).json({ error: 'no_token' });
    const token = m[1];
    const payload = verifyToken(token, 'access');
    if (payload) {
        try {
            const [u] = await query('SELECT id, display_name, role, email FROM users WHERE id=? LIMIT 1', [payload.sub]);
            if (!u) return res.status(404).json({ error: 'user_not_found' });
            const identities = await query('SELECT provider, provider_user_id, email_at_provider FROM user_social_identities WHERE user_id=?', [u.id]);
            return res.json({ user: { id: u.id, display_name: u.display_name, role: u.role, email: u.email, identities }, tokenType: 'jwt', exp: payload.exp });
        } catch (e) { return res.status(500).json({ error: 'user_lookup_failed' }); }
    }
    // Legacy fallback
    cleanupSessions();
    const s = sessions.get(token);
    if (!s) return res.status(401).json({ error: 'invalid_token' });
    try {
        const rows = await query('SELECT id, display_name, role, email FROM users WHERE id=? LIMIT 1', [s.userId]);
        const u = rows[0] || { id: s.userId, display_name: 'unknown', role: 'user', email: null };
        const identities = await query('SELECT provider, provider_user_id, email_at_provider FROM user_social_identities WHERE user_id=?', [u.id]);
        res.json({ user: { id: u.id, display_name: u.display_name, role: u.role, email: u.email, identities, provider: s.provider }, tokenType: 'legacy', issuedAt: s.created });
    } catch { res.json({ user: { id: s.userId, provider: s.provider }, tokenType: 'legacy', issuedAt: s.created }); }
});

// 신규: /api/auth/identities (JWT 필요)
router.get('/identities', async (req, res) => {
    try {
        const auth = req.headers.authorization || '';
        const m = auth.match(/^Bearer (.+)$/);
        if (!m) return res.status(401).json({ error: 'no_token' });
        const payload = verifyToken(m[1], 'access');
        if (!payload) return res.status(401).json({ error: 'invalid_token' });
        const identities = await query('SELECT provider, provider_user_id, email_at_provider, created_at FROM user_social_identities WHERE user_id=?', [payload.sub]);
        res.json({ userId: payload.sub, identities });
    } catch (e) {
        res.status(500).json({ error: 'identities_lookup_failed' });
    }
});

// Refresh endpoint (POST with JSON {refresh})
router.post('/refresh', express.json(), async (req, res) => {
    const { refresh } = req.body || {};
    if (!refresh) return res.status(400).json({ error: 'refresh_required' });
    const rotated = await rotateRefresh(refresh);
    if (!rotated) return res.status(401).json({ error: 'invalid_refresh' });
    incMetric('authRefresh');
    logAuthEvent('refresh_success', { userId: rotated.userId, req, provider: null });
    if (process.env.REFRESH_COOKIE === '1') {
        try {
            const secure = process.env.COOKIE_SECURE === '1';
            res.cookie('refresh_token', rotated.refresh, {
                httpOnly: true,
                secure,
                sameSite: 'Lax',
                path: '/api/auth',
                maxAge: rotated.refresh_expires_in * 1000
            });
        } catch { }
    }
    res.json(rotated);
});

// Cookie based refresh (no body). Reads refresh_token cookie.
router.post('/refresh-cookie', async (req, res) => {
    const cookieHeader = req.headers.cookie || '';
    const map = Object.fromEntries(cookieHeader.split(/;\s*/).filter(Boolean).map(kv => {
        const idx = kv.indexOf('=');
        if (idx === -1) return [kv, ''];
        return [decodeURIComponent(kv.slice(0, idx)), decodeURIComponent(kv.slice(idx + 1))];
    }));
    const refresh = map['refresh_token'];
    if (!refresh) return res.status(400).json({ error: 'refresh_cookie_missing' });
    const rotated = await rotateRefresh(refresh);
    if (!rotated) return res.status(401).json({ error: 'invalid_refresh' });
    // rotate cookie
    try {
        const secure = process.env.COOKIE_SECURE === '1';
        res.cookie('refresh_token', rotated.refresh, {
            httpOnly: true,
            secure,
            sameSite: 'Lax',
            path: '/api/auth',
            maxAge: rotated.refresh_expires_in * 1000
        });
    } catch { }
    incMetric('authRefresh');
    logAuthEvent('refresh_cookie_success', { userId: rotated.userId, req });
    res.json(rotated);
});

export default router;
