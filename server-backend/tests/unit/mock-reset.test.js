import { test } from "node:test";
import assert from "node:assert/strict";

const providerModulePath = new URL("../../src/mock-data-provider.js", import.meta.url);

function loadProvider() {
  return import(providerModulePath);
}

test('mockResetPosts removes generated mock-tagged posts', async () => {
  const {
    mockGeneratePosts,
    mockResetPosts,
    mockStatus,
    getAllPostsPage
  } = await loadProvider();

  // Ensure we start from a clean slate by clearing any leftover mock posts
  mockResetPosts();

  const baselineStatus = mockStatus();
  const baselineCount = baselineStatus.count;

  const generateCount = 5;
  const generationResult = mockGeneratePosts({ count: generateCount, board: 'free' });
  assert.ok(generationResult?.ok, 'generation should succeed');
  assert.equal(generationResult.generated, generateCount, 'should generate requested number of posts');

  const afterGenerateStatus = mockStatus();
  assert.equal(
    afterGenerateStatus.count,
    baselineCount + generateCount,
    'mock post count should increase by generated amount'
  );

  const snapshotBeforeReset = getAllPostsPage({ limit: 5000, offset: 0 });
  assert.ok(
    snapshotBeforeReset.items.some((post) => post.tag === 'mock'),
    'mock posts should exist before reset'
  );

  const resetOutcome = mockResetPosts();
  assert.equal(
    resetOutcome.removed,
    generateCount,
    'reset should report removal of generated posts'
  );

  const afterResetStatus = mockStatus();
  assert.equal(afterResetStatus.count, baselineCount, 'mock count should return to baseline');

  const snapshotAfterReset = getAllPostsPage({ limit: 5000, offset: 0 });
  assert.ok(
    snapshotAfterReset.items.every((post) => post.tag !== 'mock'),
    'no mock-tagged posts should remain after reset'
  );
});
