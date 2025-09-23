import test from 'node:test';
import assert from 'assert';
import { post, get } from './helpers.js';

let access;
let userDisplay;
let createdPostId;

// 1. Google test-mode login
test('google test-mode login for post create', async () => {
    const res = await post('/api/auth/google', { body: { idToken: 'test-google:postsub:postsub@test.local' }, expectStatus: 200 });
    assert.ok(res.json.access, 'missing access');
    access = res.json.access;
    userDisplay = res.json.display_name;
    assert.ok(userDisplay, 'display_name missing');
});

// 2. /me returns identities and email
test('me includes identities & email', async () => {
    const me = await get('/api/auth/me', { token: access, expectStatus: 200 });
    assert.equal(me.json.user.display_name, userDisplay);
    assert.ok(Array.isArray(me.json.user.identities), 'identities not array');
});

// 3. Create post without author field (should auto-fill)
test('create post auto author', async () => {
    const res = await post('/api/boards/free/posts', { token: access, body: { title: '작성 테스트 ' + Date.now(), content: '본문' }, expectStatus: 201 });
    createdPostId = res.json.id;
    assert.ok(createdPostId, 'no post id');
    assert.equal(res.json.author, userDisplay, 'author not auto-filled');
});

// 4. Fetch post detail
test('fetch created post detail', async () => {
    const detail = await get(`/api/posts/${createdPostId}`, { expectStatus: 200 });
    assert.equal(detail.json.author, userDisplay);
});
