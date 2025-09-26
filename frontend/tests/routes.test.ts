import { describe, it, expect } from 'vitest'
import { buildPostLink, resolveBoardRouteId } from '../src/utils/routes'

describe('routes', () => {
  it('should resolve news route', () => {
    const canonicalRoute = resolveBoardRouteId('news')
    expect(canonicalRoute).toBe('news')
  })

  it('should resolve community route', () => {
    const communityRoute = resolveBoardRouteId('global-community-lounge')
    expect(communityRoute).toBe('community')
  })

  it('should resolve cosplay route', () => {
    const cosplayRoute = resolveBoardRouteId('global_cosplay_gallery')
    expect(cosplayRoute).toBe('cosplay')
  })

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
    it(`should build link for ${scenario.boardId}`, () => {
      const link = buildPostLink(scenario.boardId, scenario.postId)
      expect(link).toBe(scenario.expected)
    })
  })
})
