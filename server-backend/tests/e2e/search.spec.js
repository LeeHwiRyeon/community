process.env.USE_MOCK_DB = '1'
process.env.NODE_ENV = 'test'

import { test } from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'

const { createApp, __stopBackgroundTimersForTest } = await import('../../src/server.js')

const app = createApp()

const KEYWORD = 'SearchTest'

async function resetMockData() {
  await request(app).post('/api/mock/reset').send({}).expect(200)
}

async function seedSearchFixtures() {
  await request(app)
    .post('/api/mock/generate')
    .send({
      count: 5,
      board: 'news',
      seed: 123,
      titlePrefix: ['SearchTest'],
      daysBack: 5,
      viewsMin: 10,
      viewsMax: 50
    })
    .expect(200)
}

test.beforeEach(async () => {
  await resetMockData()
})

test.after(() => {
  __stopBackgroundTimersForTest()
})
test('global search returns generated posts with metadata', async () => {
  await seedSearchFixtures()

  const response = await request(app)
    .get('/api/search')
    .query({ q: KEYWORD, limit: 3 })
    .expect(200)

  assert.equal(response.body.ok, true)
  assert.equal(response.body.query, KEYWORD)
  assert(response.body.count > 0, 'should return at least one result')
  assert(response.body.items.length <= 3, 'honors limit parameter')
  response.body.items.forEach((item) => {
    assert.equal(typeof item.id, 'string')
    assert.equal(typeof item.board, 'string')
    assert(item.title.includes(KEYWORD), 'title contains seeded keyword')
  })
})

test('blank queries resolve to empty payload', async () => {
  const response = await request(app)
    .get('/api/search')
    .query({ q: '   ' })
    .expect(200)

  assert.equal(response.body.count, 0)
  assert.equal(response.body.items.length, 0)
})

test('board scoped search filters within board', async () => {
  await seedSearchFixtures()

  const response = await request(app)
    .get('/api/boards/news/posts')
    .query({ q: KEYWORD })
    .expect(200)

  assert.equal(response.body.offset, 0)
  assert(response.body.items.length > 0)
  response.body.items.forEach((post) => {
    assert.equal(post.board, 'news')
    assert(post.title.includes(KEYWORD), 'post title includes keyword')
  })
})
