import assert from 'assert';
import { makeFetch } from './helpers.js';

/**
 * Chat basic smoke test
 * Steps:
 * 1. POST a message to community 'test'
 * 2. GET messages and assert >=1 and that last matches content
 * 3. GET /api/chat/communities and ensure 'test' exists
 */

describe('chat: basic smoke', () => {
    const fetcher = makeFetch();
    const community = 'test';
    const content = 'smoke:' + Date.now();
    let postedId;

    it('POST message', async () => {
        const res = await fetcher(`/chat/${community}/messages`, {
            method: 'POST',
            body: JSON.stringify({ content, author: 'SmokeTester' })
        });
        assert.equal(res.status, 200, 'POST status 200');
        assert.ok(res.data?.message?.id, 'message id present');
        postedId = res.data.message.id;
    });

    it('GET messages contains posted', async () => {
        const res = await fetcher(`/chat/${community}/messages`);
        assert.equal(res.status, 200);
        const msgs = res.data?.messages || [];
        assert.ok(msgs.length > 0, 'non-empty messages');
        const found = msgs.find(m => m.id === postedId || m.content === content);
        assert.ok(found, 'posted message found');
    });

    it('GET communities list includes community', async () => {
        const res = await fetcher('/chat/communities');
        assert.equal(res.status, 200);
        const list = res.data?.communities || res.data?.details?.map(d => d.community) || [];
        assert.ok(list.includes(community), 'community present in list');
    });
});
