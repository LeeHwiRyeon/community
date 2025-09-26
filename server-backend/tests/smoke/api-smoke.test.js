import { before, beforeEach, after, test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';

import { listBoards, mockGeneratePosts, mockResetPosts, BOARD_ICON_MAP } from '../../src/mock-data-provider.js';
import { SUPPORTED_PROVIDERS } from '../../src/auth/providers.js';

process.env.USE_MOCK_DB = '1';
process.env.ENV_ALLOW_MOCK = '1';
process.env.AUTH_ENABLE_ALL = '1';
delete process.env.REDIS_URL;
process.env.NODE_ENV = process.env.NODE_ENV || 'test';

let app;
let agent;
let stopTimers;

before(async () => {
  const serverModule = await import('../../src/server.js');
  app = serverModule.createApp();
  agent = request(app);
  stopTimers = serverModule.__stopBackgroundTimersForTest;
});

beforeEach(() => {
  mockResetPosts();
});

after(() => {
  if (typeof stopTimers === 'function') {
    stopTimers();
  }
});

test('search endpoint returns board metadata for generated posts', async () => {
  const boards = listBoards();
  assert.ok(boards.length > 0, 'expected at least one board');
  const targetBoard = boards.find((board) => BOARD_ICON_MAP[board.id]) ?? boards[0];

  const generation = mockGeneratePosts({ count: 1, board: targetBoard.id, titlePrefix: 'integration-check' });
  assert.equal(generation.ok, true);
  assert.equal(generation.generated, 1);
  const created = generation.items[0];

  const response = await agent
    .get('/api/search')
    .query({ q: 'integration-check' })
    .expect(200);

  assert.equal(response.body.ok, true);
  assert.equal(response.body.query, 'integration-check');
  assert.ok(Array.isArray(response.body.items));
  assert.ok(response.body.items.length >= 1);

  const match = response.body.items.find((item) => item.id === created.id);
  assert.ok(match, 'expected generated post to appear in search results');
  assert.equal(match.board, created.board);
  assert.equal(match.board_icon, BOARD_ICON_MAP[created.board]);
  assert.ok(typeof match.board_title === 'string' && match.board_title.length > 0);
});

test('auth providers endpoint lists all supported providers', async () => {
  const response = await agent.get('/api/auth/providers').expect(200);

  assert.ok(response.body);
  assert.ok(Array.isArray(response.body.providers));
  const providers = response.body.providers.map((entry) => entry.provider).sort();
  const expected = [...SUPPORTED_PROVIDERS].sort();
  assert.deepEqual(providers, expected);
});
