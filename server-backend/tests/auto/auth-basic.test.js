import test from 'node:test';
import assert from 'assert';
import { loginFirstProvider, get } from './helpers.js';

// Assumes AUTH_ENABLED=1 server already running (port inferred)

let access;

test('login via callback yields tokens', async () => {
    const login = await loginFirstProvider();
    access = login.access;
    assert.ok(access && access.length > 20, 'access token too short');
});

test('me returns user with role', async () => {
    const me = await get('/api/auth/me', { token: access });
    assert.equal(me.status, 200);
    assert.ok(me.json.user.id, 'missing user id');
    assert.ok(me.json.user.role, 'missing user role');
});
