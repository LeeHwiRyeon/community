process.env.USE_MOCK_DB = '1';
process.env.FEATURE_ATTACH_SIGNING = '1';
process.env.ATTACH_ALLOWED_TYPES = 'image/jpeg,image/png,video/mp4';
process.env.ATTACH_MAX_SIZE_MB = '5';
process.env.ATTACH_SIGN_RATE_LIMIT_PER_MIN = '1';
process.env.ATTACH_UPLOAD_BASE_URL = 'https://upload.dev/mock';

import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';

const { createApp, __stopBackgroundTimersForTest } = await import('../../src/server.js');
const { resetAttachmentConfigCacheForTest } = await import('../../src/services/attachments/upload-signing-service.js');

const app = createApp();

test.after(() => {
  __stopBackgroundTimersForTest();
  resetAttachmentConfigCacheForTest();
});

test('requires authentication', async () => {
  await request(app)
    .post('/api/attachments/sign')
    .send({ filename: 'demo.png', mimeType: 'image/png', size: 1024 })
    .expect(401);
});

test('returns signing payload for valid request', async () => {
  const response = await request(app)
    .post('/api/attachments/sign')
    .set('x-mock-user-id', '42')
    .send({ filename: 'My Picture.PNG', mimeType: 'image/png', size: 2048 })
    .expect(200);

  const body = response.body;
  assert.ok(body.uploadUrl.includes('https://upload.dev/mock'));
  assert.equal(body.contentType, 'image/png');
  assert.equal(body.method, 'PUT');
  assert.ok(body.fileKey.includes('42/'));
  assert.ok(body.fileKey.endsWith('.png'));
  assert.equal(typeof body.expiresAt, 'string');
  assert.equal(typeof body.headers['x-mock-signature'], 'string');
  assert.equal(body.bucket, 'community-attachments');
  assert.equal(body.region, 'local-dev-1');
  assert.equal(body.scanRequired, false);
  assert.ok(Array.isArray(body.policy.allowedTypes));
});

test('rejects unsupported mime types', async () => {
  const response = await request(app)
    .post('/api/attachments/sign')
    .set('x-mock-user-id', '43')
    .send({ filename: 'report.exe', mimeType: 'application/x-msdownload', size: 4096 })
    .expect(400);

  assert.equal(response.body.error, 'unsupported_type');
  assert.ok(Array.isArray(response.body.allowedTypes));
});

test('enforces size limits', async () => {
  const response = await request(app)
    .post('/api/attachments/sign')
    .set('x-mock-user-id', '44')
    .send({ filename: 'big-video.mp4', mimeType: 'video/mp4', size: 6 * 1024 * 1024 })
    .expect(400);
  assert.equal(response.body.error, 'size_exceeded');
});

test('rate limits repeated sign requests per user', async () => {
  await request(app)
    .post('/api/attachments/sign')
    .set('x-mock-user-id', '45')
    .send({ filename: 'clip.mp4', mimeType: 'video/mp4', size: 1024 })
    .expect(200);

  const second = await request(app)
    .post('/api/attachments/sign')
    .set('x-mock-user-id', '45')
    .send({ filename: 'clip-2.mp4', mimeType: 'video/mp4', size: 1024 })
    .expect(429);
  assert.equal(second.body.error, 'rate_limited');
});
