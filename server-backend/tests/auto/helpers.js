// Shared test helpers (fetch wrapper, auth, etc.)
import assert from 'assert';

const BASE = process.env.TEST_BASE || `http://localhost:${process.env.PORT || 50000}`;

export async function j(method, path, { token, body, expectStatus } = {}) {
    const res = await fetch(BASE + path, {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: 'Bearer ' + token } : {})
        },
        body: body ? JSON.stringify(body) : undefined
    });
    const text = await res.text();
    let json; try { json = text ? JSON.parse(text) : null; } catch { json = null; }
    if (expectStatus && res.status !== expectStatus) {
        throw new Error(`Expected ${expectStatus} got ${res.status} body=${text}`);
    }
    return { status: res.status, json, text };
}

export async function get(path, opts) { return j('GET', path, opts); }
export async function post(path, opts) { return j('POST', path, opts); }
export async function patch(path, opts) { return j('PATCH', path, opts); }
export async function del(path, opts) { return j('DELETE', path, opts); }

export async function loginFirstProvider() {
    const prov = await get('/api/auth/providers', { expectStatus: 200 });
    assert(prov.json.providers.length > 0, 'No provider enabled');
    const provider = prov.json.providers[0].provider || prov.json.providers[0];
    const cb = await get(`/api/auth/callback/${provider}?code=test-code`, { expectStatus: 200 });
    assert(cb.json.access, 'No access token in callback');
    return cb.json;
}

export async function ensureAdminAccess() {
    const login = await loginFirstProvider();
    // first user becomes admin by design; verify role
    const me = await get('/api/auth/me', { token: login.access, expectStatus: 200 });
    assert(me.json.user.role === 'admin', 'First user not admin');
    return { access: login.access };
}

export function randomTitle(prefix = 'T') { return prefix + '_' + Math.random().toString(36).slice(2, 8); }
