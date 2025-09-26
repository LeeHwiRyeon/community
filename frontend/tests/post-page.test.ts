import { describe, it, expect } from 'vitest'
import type { Post } from '../src/api'
import {
  derivePostFormat,
  splitContent,
  safeDate,
  formatNumber,
  normalizePostBlocks,
  resolveHeroImageUrl
} from '../src/pages/post-helpers'

const basePost: Post = {
  id: 'test-post',
  board_id: 'news',
  title: 'Sample Post',
  content: 'First paragraph\n\nSecond paragraph',
  author: 'Author',
  created_at: '2024-09-01T10:00:00Z',
  updated_at: '2024-09-01T10:00:00Z',
  views: 1280,
  category: 'news',
  thumb: null,
  mediaType: 'article',
  preview: {
    type: 'article',
    tag: 'Notice',
    excerpt: 'Sample excerpt'
  },
  stream_url: null,
  comments_count: 12,
  date: '2024-09-01'
}

const broadcastPost: Post = {
  ...basePost,
  id: 'broadcast-post',
  mediaType: 'broadcast',
  preview: {
    type: 'broadcast',
    streamer: 'MetaCoach',
    platform: 'Twitch',
    streamUrl: 'https://www.twitch.tv/metacoach',
    scheduledFor: '2024-09-01T12:00:00Z',
    isLive: true
  }
}

const cosplayPost: Post = {
  ...basePost,
  id: 'gallery-post',
  category: 'cosplay',
  mediaType: undefined,
  preview: {
    type: 'gallery',
    images: ['https://example.com/img-1.jpg', 'https://example.com/img-2.jpg']
  }
}

const richPost: Post = {
  ...basePost,
  id: 'rich-post',
  hero_media: {
    id: 1,
    post_id: 'rich-post',
    media_type: 'image',
    file_key: 'hero',
    url: 'https://example.com/hero.jpg',
    thumbnail_url: 'https://example.com/hero-thumb.jpg'
  },
  media: [
    {
      id: 1,
      post_id: 'rich-post',
      media_type: 'image',
      file_key: 'hero',
      url: 'https://example.com/hero.jpg',
      thumbnail_url: 'https://example.com/hero-thumb.jpg'
    },
    {
      id: 2,
      post_id: 'rich-post',
      media_type: 'image',
      file_key: 'gallery-1',
      url: 'https://example.com/gallery-1.jpg',
      thumbnail_url: 'https://example.com/gallery-1-thumb.jpg'
    }
  ],
  blocks: [
    {
      id: 1,
      ordering: 10,
      type: 'paragraph',
      text_content: 'Block paragraph'
    },
    {
      id: 2,
      ordering: 20,
      type: 'image',
      data: {
        url: 'https://example.com/hero.jpg',
        caption: 'Inline image'
      }
    },
    {
      id: 3,
      ordering: 30,
      type: 'list',
      data: {
        items: ['Tag A', 'Tag B']
      }
    }
  ]
}

describe('post helpers', () => {
  it('should split content into paragraphs', () => {
    const split = splitContent(basePost.content)
    expect(split).toHaveLength(2)
    expect(split[0]).toBe('First paragraph')
    expect(split[1]).toBe('Second paragraph')
  })

  it('should format valid dates', () => {
    const validDate = safeDate(basePost.created_at)
    expect(validDate).not.toBe('')
  })

  it('should handle invalid dates', () => {
    const invalidDate = safeDate('invalid-date')
    expect(invalidDate).toBe('')
  })

  it('should derive broadcast format', () => {
    const broadcastFormat = derivePostFormat(broadcastPost)
    expect(broadcastFormat).toBe('broadcast')
  })

  it('should derive gallery format for cosplay', () => {
    const cosplayFormat = derivePostFormat(cosplayPost)
    expect(cosplayFormat).toBe('gallery')
  })

  it('should format numbers', () => {
    const formattedNumber = formatNumber(1234567)
    expect(formattedNumber).toContain('1')
  })

  it('should handle missing numbers', () => {
    const fallbackNumber = formatNumber(undefined)
    expect(fallbackNumber).toBe('0')
  })

  it('should normalize post blocks', () => {
    const blocks = normalizePostBlocks(richPost)
    expect(blocks.length).toBeGreaterThanOrEqual(3)
    expect(blocks[0].type).toBe('paragraph')
    expect(['image', 'gallery']).toContain(blocks[1].type)
  })

  it('should resolve hero image url', () => {
    const blocks = normalizePostBlocks(richPost)
    const heroFromBlocks = resolveHeroImageUrl(richPost, blocks)
    expect(heroFromBlocks).toBe('https://example.com/hero.jpg')
  })
})
