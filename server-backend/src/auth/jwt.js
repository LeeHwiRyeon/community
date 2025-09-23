import jwt from 'jsonwebtoken';
import { storeRefresh, loadRefresh, deleteRefresh, isRedisEnabled } from '../redis.js';

const ACCESS_TTL_SEC = parseInt(process.env.JWT_ACCESS_TTL_SEC || '900', 10); // 15m
const REFRESH_TTL_SEC = parseInt(process.env.JWT_REFRESH_TTL_SEC || '1209600', 10); // 14d
const SECRET = process.env.JWT_SECRET || 'dev_insecure_secret_change_me';

// In-memory fallback refresh store when Redis disabled
const refreshStore = new Map(); // jti -> { userId, exp }

export async function issueTokens(user) {
    const now = Math.floor(Date.now() / 1000);
    const jti = 'r_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    const access = jwt.sign({ sub: String(user.id), role: user.role, typ: 'access' }, SECRET, { algorithm: 'HS256', expiresIn: ACCESS_TTL_SEC });
    const refresh = jwt.sign({ sub: String(user.id), jti, typ: 'refresh' }, SECRET, { algorithm: 'HS256', expiresIn: REFRESH_TTL_SEC });
    if (isRedisEnabled()) {
        await storeRefresh(jti, { userId: user.id }, REFRESH_TTL_SEC);
    } else {
        refreshStore.set(jti, { userId: user.id, exp: now + REFRESH_TTL_SEC });
    }
    return { access, refresh, access_expires_in: ACCESS_TTL_SEC, refresh_expires_in: REFRESH_TTL_SEC };
}

export function verifyToken(token, expectedTyp = 'access') {
    try {
        const payload = jwt.verify(token, SECRET, { algorithms: ['HS256'] });
        if (expectedTyp && payload.typ !== expectedTyp) return null;
        return payload;
    } catch { return null; }
}

export async function rotateRefresh(oldRefresh) {
    const payload = verifyToken(oldRefresh, 'refresh');
    if (!payload) return null;
    let rec;
    if (isRedisEnabled()) rec = await loadRefresh(payload.jti);
    else rec = refreshStore.get(payload.jti);
    if (!rec || rec.userId != payload.sub) return null;
    // revoke old
    if (isRedisEnabled()) await deleteRefresh(payload.jti); else refreshStore.delete(payload.jti);
    // issue new tokens (role lookup skipped -> assume user unless upgraded; caller can refresh /me for role)
    const pair = await issueTokens({ id: payload.sub, role: 'user' });
    return { userId: payload.sub, ...pair };
}

function purgeExpiredRefresh() {
    if (isRedisEnabled()) return; // Redis handles TTL
    const now = Math.floor(Date.now() / 1000);
    let removed = 0;
    for (const [jti, rec] of refreshStore.entries()) {
        if (rec.exp < now) { refreshStore.delete(jti); removed++; }
    }
    if (removed) console.log('[auth.jwt] purged refresh tokens', removed);
}
setInterval(purgeExpiredRefresh, 5 * 60 * 1000).unref();

export function getAccessTTL() { return ACCESS_TTL_SEC; }
export function getRefreshTTL() { return REFRESH_TTL_SEC; }

// Middleware helpers
export function buildAuthMiddleware(dbQuery) {
    return async function authAttach(req, res, next) {
        try {
            const auth = req.headers.authorization || '';
            const m = auth.match(/^Bearer (.+)$/);
            if (!m) return next();
            const token = m[1];
            const payload = verifyToken(token, 'access');
            if (!payload) return next();
            const rows = await dbQuery('SELECT id, display_name, role FROM users WHERE id=? LIMIT 1', [payload.sub]);
            if (rows.length) req.user = rows[0];
        } catch (e) { /* ignore */ }
        next();
    };
}

export function requireAdmin(req, res, next) {
    if (!req.user || req.user.role !== 'admin') return res.status(403).json({ error: 'admin_required' });
    next();
}

export function requireModOrAdmin(req, res, next) {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'moderator')) {
        return res.status(403).json({ error: 'moderator_or_admin_required' });
    }
    next();
}
