import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";

let app;
let stopTimers;

describe('Post Draft API', () => {
    before(async () => {
        process.env.USE_MOCK_DB = '1';
        process.env.ENV_ALLOW_MOCK = '1';
        process.env.DRAFT_RATE_LIMIT_PER_MIN = '10';
        const mod = await import("../../src/server.js");
        app = mod.createApp();
        stopTimers = mod.__stopBackgroundTimersForTest;
    });

    after(() => {
        if (typeof stopTimers === 'function') {
            stopTimers();
        }
    });

    it('rejects unauthenticated access', async () => {
        const res = await request(app).get('/api/posts/drafts');
        assert.strictEqual(res.status, 401);
        assert.strictEqual(res.body.error, 'auth_required');
    });

    it('supports creating, retrieving, updating, and deleting drafts with optimistic locking', async () => {
        const headers = { 'X-Mock-User-Id': '501', 'X-Mock-User-Name': 'draft-tester' };
        const createPayload = { title: 'First draft', content: 'Initial body', metadata: { scope: 'test' } };

        const createRes = await request(app)
            .post('/api/posts/drafts')
            .set(headers)
            .send(createPayload);
        assert.strictEqual(createRes.status, 201);
        assert.ok(createRes.body.id, 'draft id missing');
        assert.ok(createRes.body.updated_at, 'updated_at missing');
        const draftId = createRes.body.id;
        const firstUpdatedAt = createRes.body.updated_at;

        const listRes = await request(app)
            .get('/api/posts/drafts')
            .set(headers);
        assert.strictEqual(listRes.status, 200);
        assert.ok(Array.isArray(listRes.body.drafts), 'draft list missing');
        assert.ok(listRes.body.drafts.some((draft) => draft.id === draftId));

        const getRes = await request(app)
            .get(`/api/posts/drafts/${draftId}`)
            .set(headers);
        assert.strictEqual(getRes.status, 200);
        const secondUpdatedAt = getRes.body.updated_at;
        assert.ok(new Date(secondUpdatedAt).getTime() >= new Date(firstUpdatedAt).getTime());

        const updateRes = await request(app)
            .put(`/api/posts/drafts/${draftId}`)
            .set(headers)
            .set('If-Unmodified-Since', secondUpdatedAt)
            .send({ title: 'Updated draft title', content: 'Revised body copy' });
        assert.strictEqual(updateRes.status, 200);
        assert.strictEqual(updateRes.body.title, 'Updated draft title');
        const updatedAt = updateRes.body.updated_at;
        assert.ok(new Date(updatedAt).getTime() > new Date(secondUpdatedAt).getTime());

        const conflictRes = await request(app)
            .put(`/api/posts/drafts/${draftId}`)
            .set(headers)
            .set('If-Unmodified-Since', secondUpdatedAt)
            .send({ title: 'Stale attempt' });
        assert.strictEqual(conflictRes.status, 409);
        assert.strictEqual(conflictRes.body.error, 'draft_conflict');

        const deleteRes = await request(app)
            .delete(`/api/posts/drafts/${draftId}`)
            .set(headers);
        assert.strictEqual(deleteRes.status, 204);

        const afterDelete = await request(app)
            .get(`/api/posts/drafts/${draftId}`)
            .set(headers);
        assert.strictEqual(afterDelete.status, 404);
    });

    it('enforces per-user rate limiting', async () => {
        const headers = { 'X-Mock-User-Id': '777' };
        for (let i = 0; i < 10; i += 1) {
            const res = await request(app)
                .get('/api/posts/drafts')
                .set(headers);
            assert.strictEqual(res.status, 200);
        }

        const rateLimited = await request(app)
            .get('/api/posts/drafts')
            .set(headers);
        assert.strictEqual(rateLimited.status, 429);
        assert.strictEqual(rateLimited.body.error, 'rate_limited_drafts');
    });
});
