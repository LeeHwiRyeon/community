import assert from 'assert';
import { j } from './helpers.js';

/**
 * Chat basic smoke test
 * Steps:
 * 1. POST a message to community 'test'
 * 2. GET messages and assert >=1 and that last matches content
 * 3. GET /api/chat/communities and ensure 'test' exists
 */

describe('chat: basic smoke', () => {
    const community = 'test';
    const content = 'smoke:' + Date.now();
    let postedId;

    it('POST message', async () => {
        const res = await j('POST', `/chat/${community}/messages`, {
            body: { content, author: 'SmokeTester' },
            expectStatus: 200
        });
        assert.ok(res.json?.message?.id, 'message id present');
        postedId = res.json.message.id;
    });

    it('GET messages contains posted', async () => {
        const res = await j('GET', `/chat/${community}/messages`, { expectStatus: 200 });
        const msgs = res.json?.messages || [];
        assert.ok(msgs.length > 0, 'non-empty messages');
        const found = msgs.find(m => m.id === postedId || m.content === content);
        assert.ok(found, 'posted message found');
    });

    it('GET communities list includes community', async () => {
        const res = await j('GET', '/chat/communities', { expectStatus: 200 });
        const list = res.json?.communities || res.json?.details?.map(d => d.community) || [];
        assert.ok(list.includes(community), 'community present in list');
    });
});
