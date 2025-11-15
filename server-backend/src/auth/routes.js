// auth/routes.js - OAuth flow with Redis-backed session management
import express from 'express';
import jwt from 'jsonwebtoken';
import { createPublicKey } from 'crypto';
import { getEnabledProviders, buildMockAuthRedirect } from './providers.js';
import { query } from '../db.js';
import { issueTokens, verifyToken, rotateRefresh, getAccessTTL, getRefreshTTL } from './jwt.js';
import { OAuth2Client } from 'google-auth-library';
import { incMetric } from '../metrics-state.js';
import { generateCodeVerifier, codeChallengeS256, generateState, storeOAuthState, consumeOAuthState } from './pkce.js';
import { kvSet, kvGet, kvDel, isRedisEnabled } from '../redis.js';
import { blacklistAccessToken, blacklistRefreshToken } from '../services/token-blacklist.js';

// Redis-backed session management
const SESSION_PREFIX = 'session:';
const SESSION_TTL_MS = parseInt(process.env.SESSION_TTL_MS || '3600000', 10); // 1h default
const SESSION_CLEANUP_INTERVAL = 300000; // 5 minutes

const APPLE_KEYS_URL = 'https://appleid.apple.com/auth/keys';
const APPLE_ISSUER = 'https://appleid.apple.com';
let appleKeysCache = { keys: null, fetchedAt: 0 };

async function loadAppleKeys() {
    const now = Date.now();
    if (appleKeysCache.keys && (now - appleKeysCache.fetchedAt) < 60 * 60 * 1000) {
        return appleKeysCache.keys;
    }
    const resp = await fetch(APPLE_KEYS_URL);
    if (!resp.ok) throw new Error('apple_keys_fetch_failed');
    const data = await resp.json();
    appleKeysCache = { keys: Array.isArray(data?.keys) ? data.keys : [], fetchedAt: now };
    return appleKeysCache.keys;
}

function jwkToPem(jwk) {
    const keyObject = createPublicKey({ key: jwk, format: 'jwk' });
    return keyObject.export({ type: 'spki', format: 'pem' });
}

async function verifyAppleIdToken(idToken) {
    const decoded = jwt.decode(idToken, { complete: true });
    if (!decoded || typeof decoded !== 'object') throw new Error('invalid_token');
    const header = decoded.header || {};
    if (header.alg !== 'RS256') throw new Error('unsupported_algorithm');
    const keys = await loadAppleKeys();
    const match = keys.find(k => k.kid === header.kid);
    if (!match) throw new Error('apple_key_not_found');
    const pem = jwkToPem(match);
    const audience = process.env.OAUTH_APPLE_CLIENT_ID || process.env.APPLE_CLIENT_ID;
    const verifyOptions = { algorithms: ['RS256'], issuer: APPLE_ISSUER };
    if (audience) verifyOptions.audience = audience;
    return jwt.verify(idToken, pem, verifyOptions);
}

// Session management functions
async function storeSession(sessionId, sessionData) {
    const key = SESSION_PREFIX + sessionId;
    const ttlSec = Math.ceil(SESSION_TTL_MS / 1000);
    await kvSet(key, {
        ...sessionData,
        created: Date.now(),
        ttlMs: SESSION_TTL_MS
    }, ttlSec);
}

async function getSession(sessionId) {
    const key = SESSION_PREFIX + sessionId;
    const session = await kvGet(key);
    if (!session) return null;

    // Check if session is expired
    if (Date.now() - session.created > session.ttlMs) {
        await kvDel(key);
        return null;
    }

    return session;
}

async function deleteSession(sessionId) {
    const key = SESSION_PREFIX + sessionId;
    await kvDel(key);
}

// Periodic cleanup for memory store (when Redis is not available)
let cleanupTimer = null;
function startSessionCleanup() {
    if (cleanupTimer) return;

    cleanupTimer = setInterval(async () => {
        if (isRedisEnabled()) {
            // Redis handles TTL automatically
            return;
        }

        // Memory store cleanup (rarely needed due to TTL in kvSet)
        // This is just a safety net
        try {
            // In a real implementation, you might want to scan and clean expired keys
            // For now, we'll rely on TTL expiration in kvGet
        } catch (e) {
            console.warn('[auth] session cleanup error', e.message);
        }
    }, SESSION_CLEANUP_INTERVAL);
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
        router.post('/apple', express.json(), async (req, res) => {
            try {
                const { idToken } = req.body || {};
                if (!idToken) return res.status(400).json({ error: 'idToken_required' });
                const allowTestMode = (process.env.NODE_ENV !== 'production') || process.env.ENABLE_TEST_APPLE === '1';
                let sub = null; let email = null; let name = null;
                if (allowTestMode && typeof idToken === 'string' && idToken.startsWith('test-apple:')) {
                    const parts = idToken.split(':');
                    sub = parts[1] || 'test_sub';
                    email = parts[2] || (sub + '@test.local');
                    name = 'apple_' + sub.slice(0, 8);
                } else {
                    const payload = await verifyAppleIdToken(idToken);
                    sub = payload.sub;
                    email = payload.email || null;
                    name = payload.name || (payload.email ? payload.email.split('@')[0] : null);
                }
                if (!sub) return res.status(401).json({ error: 'invalid_token' });
                let rows = await query('SELECT u.id,u.role,u.display_name FROM user_social_identities si JOIN users u ON u.id=si.user_id WHERE si.provider=? AND si.provider_user_id=? LIMIT 1', ['apple', sub]);
                let userId;
                if (!rows.length) {
                    const countRows = await query('SELECT COUNT(*) as c FROM users');
                    const isFirst = (countRows[0]?.c || 0) === 0;
                    const displayName = name || ('apple_' + sub.slice(0, 10));
                    await query('INSERT INTO users(display_name, role, email) VALUES(?,?,?)', [displayName, isFirst ? 'admin' : 'user', email || null]);
                    const newRow = await query('SELECT id,role FROM users WHERE display_name=? ORDER BY id DESC LIMIT 1', [displayName]);
                    userId = newRow[0].id;
                    await query('INSERT INTO user_social_identities(user_id,provider,provider_user_id,email_at_provider) VALUES(?,?,?,?)', [userId, 'apple', sub, email || null]);
                } else {
                    userId = rows[0].id;
                }
                await query('UPDATE users SET last_login_at=NOW(), primary_provider=?, primary_provider_user_id=? WHERE id=?', ['google', sub, userId]);
                const [u] = await query('SELECT id, role, display_name, email FROM users WHERE id=?', [userId]);
                const jwtPair = await issueTokens({ id: u.id, role: u.role });
                const identities = await query('SELECT provider, provider_user_id, email_at_provider FROM user_social_identities WHERE user_id=?', [userId]);
                incMetric('authAppleLogin');
                res.json({ provider: 'apple', userId: u.id, display_name: u.display_name, email: u.email || email || null, identities, ...jwtPair });
            } catch (e) {
                console.error('[auth.apple.error]', e.message);
                res.status(500).json({ error: 'apple_auth_failed' });
            }
        });

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
        await query('UPDATE users SET last_login_at=NOW(), primary_provider=?, primary_provider_user_id=? WHERE id=?', ['apple', sub, userId]);
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

async function buildAuthRedirectResponse(req, provider) {
    const enabled = getEnabledProviders();
    if (!enabled.includes(provider)) {
        const err = new Error('provider_disabled');
        err.statusCode = 404;
        throw err;
    }
    const isGoogle = provider === 'google' && process.env.OAUTH_GOOGLE_CLIENT_ID && process.env.OAUTH_GOOGLE_CLIENT_SECRET;
    const baseOrigin = process.env.PUBLIC_ORIGIN || `http://localhost:${process.env.PORT || 50000}`;
    const callbackUrl = `${baseOrigin}/api/auth/callback/${provider}`;
    const link = req.query.link === '1';
    if (isGoogle) {
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
        return {
            provider,
            authorize: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
            state,
            pkce: true,
            link,
            callback: callbackUrl
        };
    }
    const base = process.env.OAUTH_CALLBACK_BASE_URL || baseOrigin;
    const redirect = buildMockAuthRedirect(provider, base);
    if (!redirect) {
        const err = new Error('redirect_unavailable');
        err.statusCode = 400;
        throw err;
    }
    return {
        provider,
        redirect,
        mock: true,
        callback: `${base}/api/auth/callback/${provider}`,
        link: link || undefined
    };
}

async function handleAuthRedirect(req, res, provider) {
    try {
        const payload = await buildAuthRedirectResponse(req, provider);
        res.json(payload);
    } catch (e) {
        const status = e?.statusCode || 500;
        res.status(status).json({ error: e?.message || 'redirect_failed' });
    }
}

router.get('/login/:provider', async (req, res) => {
    await handleAuthRedirect(req, res, req.params.provider);
});

router.get('/redirect/:provider', async (req, res) => {
    await handleAuthRedirect(req, res, req.params.provider);
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
        await query('UPDATE users SET last_login_at=NOW(), primary_provider=?, primary_provider_user_id=? WHERE id=?', [provider, providerUserId, userId]);
        startSessionCleanup();
        const legacyToken = randomToken();
        await storeSession(legacyToken, { userId, provider });
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
    const s = await getSession(token);
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

/**
 * Logout endpoint - Blacklists both access and refresh tokens
 * 
 * Request:
 * POST /api/auth/logout
 * Headers:
 *   Authorization: Bearer <access_token>
 * Body:
 *   { "refresh": "<refresh_token>" }
 * 
 * Response:
 *   { "success": true, "message": "Logged out successfully" }
 */
router.post('/logout', express.json(), async (req, res) => {
    try {
        const authHeader = req.headers.authorization || '';
        const accessMatch = authHeader.match(/^Bearer (.+)$/);
        const accessToken = accessMatch ? accessMatch[1] : null;
        const refreshToken = req.body?.refresh || null;

        let accessBlacklisted = false;
        let refreshBlacklisted = false;

        // Blacklist access token if provided
        if (accessToken) {
            const accessPayload = verifyToken(accessToken, 'access');
            if (accessPayload && accessPayload.jti) {
                await blacklistAccessToken(
                    accessPayload.jti,
                    accessPayload.sub,
                    'user_logout',
                    getAccessTTL()
                );
                accessBlacklisted = true;
                console.log(`✅ User ${accessPayload.sub} logged out - Access token blacklisted`);
            }
        }

        // Blacklist refresh token if provided
        if (refreshToken) {
            const refreshPayload = verifyToken(refreshToken, 'refresh');
            if (refreshPayload && refreshPayload.jti) {
                await blacklistRefreshToken(
                    refreshPayload.jti,
                    refreshPayload.sub,
                    'user_logout',
                    getRefreshTTL()
                );
                refreshBlacklisted = true;
            }
        }

        // Clear refresh token cookie if present
        if (process.env.REFRESH_COOKIE === '1') {
            res.clearCookie('refresh_token', {
                httpOnly: true,
                secure: process.env.COOKIE_SECURE === '1',
                sameSite: 'Lax',
                path: '/api/auth'
            });
        }

        incMetric('authLogout');

        res.json({
            success: true,
            message: 'Logged out successfully',
            details: {
                accessTokenBlacklisted: accessBlacklisted,
                refreshTokenBlacklisted: refreshBlacklisted
            }
        });

    } catch (error) {
        console.error('❌ Logout error:', error);
        res.status(500).json({
            error: 'logout_failed',
            message: 'Failed to logout'
        });
    }
});

export default router;
