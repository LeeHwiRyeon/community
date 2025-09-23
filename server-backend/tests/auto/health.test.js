import test from 'node:test';
import assert from 'assert';
import { get } from './helpers.js';

// Basic health & metrics availability

test('health endpoint responds', async () => {
    const r = await get('/api/health');
    assert.equal(r.status, 200);
    assert.ok(r.json.ok === true || r.json.status === 'ok');
});

test('metrics endpoint responds', async () => {
    const r = await get('/api/metrics');
    assert.equal(r.status, 200);
    assert.ok(typeof r.json === 'object');
});
