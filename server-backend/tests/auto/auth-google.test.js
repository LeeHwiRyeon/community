import test from 'node:test';
import assert from 'assert';
import { post, get } from './helpers.js';

let access;

test('google id token test-mode login', async () => {
    const res = await post('/api/auth/google', { body: { idToken: 'test-google:sub123:sub123@test.local' }, expectStatus: 200 });
    assert.ok(res.json.access, 'missing access');
    access = res.json.access;
    assert.equal(res.json.provider, 'google');
    assert.ok(res.json.userId, 'no userId');
});

test('me after google login', async () => {
    const me = await get('/api/auth/me', { token: access, expectStatus: 200 });
    assert.ok(me.json.user.id, 'me user id');
});
