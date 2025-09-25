import assert from 'node:assert/strict'
import { buildPostLink, resolveBoardRouteId } from '../src/utils/routes.ts'

const canonicalRoute = resolveBoardRouteId('news')
assert.equal(canonicalRoute, 'news', 'news should remain unchanged')

const communityRoute = resolveBoardRouteId('global-community-lounge')
assert.equal(communityRoute, 'community', 'global-community-lounge should map to community')

const cosplayRoute = resolveBoardRouteId('global_cosplay_gallery')
assert.equal(cosplayRoute, 'cosplay', 'underscored ids should normalize to cosplay')

const linkCases = [
  {
    boardId: 'news',
    postId: 'hero-01',
    expected: '/board/news/post/hero-01'
  },
  {
    boardId: 'global-news',
    postId: 'hero-02',
    expected: '/board/news/post/hero-02'
  },
  {
    boardId: 'global-community-lounge',
    postId: 'comm-03',
    expected: '/board/community/post/comm-03'
  },
  {
    boardId: 'global/broadcast-stage',
    postId: 'bcast-04',
    expected: '/board/broadcast/post/bcast-04'
  },
  {
    boardId: 'global-cosplay-gallery',
    postId: 'cosplay deck',
    expected: '/board/cosplay/post/cosplay%20deck'
  },
]

linkCases.forEach((scenario) => {
  const link = buildPostLink(scenario.boardId, scenario.postId)
  const message = 'link for ' + scenario.boardId + ' should match'
  assert.equal(link, scenario.expected, message)
})

console.log('routes.test.ts: all route tests passed')
