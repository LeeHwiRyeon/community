// auth/pkce.js - PKCE & state management (Redis or memory fallback)
import crypto from 'crypto';
import { kvSet, kvGet, kvDel, isRedisEnabled } from '../redis.js';

const STATE_PREFIX = 'oauth_state:'; // oauth_state:<state>
const STATE_TTL_SEC = parseInt(process.env.OAUTH_STATE_TTL_SEC || '300', 10); // 5m default

// Memory fallback map (key-> {value, exp}) is handled implicitly by kvSet/kvGet provided by redis.js wrapper.

export function generateCodeVerifier(length = 64) {
    // RFC 7636: code_verifier length between 43 and 128
    const bytes = crypto.randomBytes(Math.ceil(length * 0.75));
    return base64url(bytes).slice(0, length);
}

export function codeChallengeS256(verifier) {
    return base64url(crypto.createHash('sha256').update(verifier).digest());
}

export function generateState() {
    return base64url(crypto.randomBytes(24));
}

export async function storeOAuthState(state, data) {
    await kvSet(STATE_PREFIX + state, data, STATE_TTL_SEC);
}

export async function consumeOAuthState(state) {
    const key = STATE_PREFIX + state;
    const data = await kvGet(key);
    if (data) await kvDel(key); // one-time use
    return data;
}

function base64url(buf) {
    return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
