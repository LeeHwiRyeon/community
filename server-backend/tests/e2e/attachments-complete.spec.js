process.env.USE_MOCK_DB = '1';
process.env.FEATURE_ATTACH_SIGNING = '1';
process.env.ATTACH_ALLOWED_TYPES = 'image/png,video/mp4';
process.env.ATTACH_MAX_SIZE_MB = '10';
process.env.ATTACH_QUEUE_ENABLED = '0';

import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';

const { createApp, __stopBackgroundTimersForTest } = await import('../../src/server.js');
const { resetAttachmentConfigCacheForTest } = await import('../../src/services/attachments/upload-signing-service.js');
const { resetAttachmentStoreForTest } = await import('../../src/services/attachments/attachments-service.js');

const app = createApp();

test.after(() => {
  __stopBackgroundTimersForTest();
  resetAttachmentConfigCacheForTest();
  resetAttachmentStoreForTest();
});

test('POST /api/attachments/complete requires auth', async () => {
  await request(app)
    .post('/api/attachments/complete')
    .send({ fileKey: 'attachments/1/demo.png', mimeType: 'image/png', size: 1024 })
    .expect(401);
});

test('POST complete + GET attachment lifecycle', async () => {
  const completeResponse = await request(app)
    .post('/api/attachments/complete')
    .set('x-mock-user-id', '77')
    .send({
      fileKey: 'attachments/77/20250926-demo.png',
      mimeType: 'image/png',
      size: 4096,
      originalName: 'My Banner.PNG',
      checksum: 'abc123',
      draftId: 'draft-xyz'
    })
    .expect(202);

  assert.equal(completeResponse.body.status, 'queued');
  assert.equal(completeResponse.body.queue.enqueued, false);
  const attachmentId = completeResponse.body.attachmentId;
  assert.ok(attachmentId, 'attachment id should be present');

  const fetchResponse = await request(app)
    .get(`/api/attachments/${attachmentId}`)
    .set('x-mock-user-id', '77')
    .expect(200);

  assert.equal(fetchResponse.body.attachmentId, attachmentId);
  assert.equal(fetchResponse.body.sourceType, 'draft');
  assert.equal(fetchResponse.body.sourceId, 'draft-xyz');
  assert(Array.isArray(fetchResponse.body.variants));
});

test('POST complete rejects invalid size', async () => {
  const response = await request(app)
    .post('/api/attachments/complete')
    .set('x-mock-user-id', '77')
    .send({
      fileKey: 'attachments/77/invalid.png',
      mimeType: 'image/png',
      size: 0,
      originalName: 'invalid.png'
    })
    .expect(400);
  assert.equal(response.body.error, 'invalid_size');
});

