import { test } from 'node:test';
import assert from 'node:assert/strict';

import { buildMockHierarchy } from '../../random-data.js';

test('mock hierarchy data exposes populated communities and boards', () => {
  const hierarchy = buildMockHierarchy();
  assert.ok(hierarchy, 'hierarchy should be defined');
  assert.ok(Array.isArray(hierarchy.communities), 'communities should be an array');

  hierarchy.communities.forEach((community) => {
    assert.ok(Array.isArray(community.boards), 'community.boards should be an array');
    assert.ok(community.boards.length >= 3, 'expect at least three boards per community');

    community.boards.forEach((board) => {
      assert.ok(Array.isArray(board.posts), 'board.posts should be an array');
      assert.ok(board.posts.length >= 30, 'each board should have at least thirty posts');

      board.posts.forEach((post, index) => {
        if (index > 0) {
          assert.ok(
            post.views <= board.posts[index - 1].views,
            'post views should be sorted in descending order'
          );
        }

        assert.ok(post.hero_media, 'hero_media should be present');
        assert.equal(typeof post.hero_media.url, 'string', 'hero_media.url should be a string');
        assert.ok(post.hero_media.url.length > 0, 'hero_media.url should not be empty');

        assert.ok(Array.isArray(post.media), 'post.media should be an array');
        assert.ok(post.media.length > 0, 'post.media should include at least one item');
        assert.ok('url' in post.media[0], 'first media item should include a url');

        assert.ok(Array.isArray(post.blocks), 'post.blocks should be an array');
        assert.ok(post.blocks.length > 0, 'post.blocks should include at least one block');

        const ordering = post.blocks.map((block) => block.ordering);
        const sortedOrdering = [...ordering].sort((a, b) => a - b);
        assert.deepEqual(ordering, sortedOrdering, 'block ordering should be ascending');
      });
    });
  });
});
