import assert from 'node:assert/strict'
import type { Post } from '../src/api.ts'
import {
  derivePostFormat,
  splitContent,
  safeDate,
  formatNumber,
  normalizePostBlocks,
  resolveHeroImageUrl
} from '../src/pages/post-helpers.ts'

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

const split = splitContent(basePost.content)
assert.equal(split.length, 2, 'content should split into two paragraphs')
assert.equal(split[0], 'First paragraph')
assert.equal(split[1], 'Second paragraph')

const validDate = safeDate(basePost.created_at)
assert.notEqual(validDate.length, 0, 'valid dates should render as localized strings')

const invalidDate = safeDate('invalid-date')
assert.equal(invalidDate, '', 'invalid dates should resolve to an empty string')

const broadcastFormat = derivePostFormat(broadcastPost)
assert.equal(broadcastFormat, 'broadcast', 'broadcast preview should produce broadcast format')

const cosplayFormat = derivePostFormat(cosplayPost)
assert.equal(cosplayFormat, 'gallery', 'cosplay category should map to gallery format')

const formattedNumber = formatNumber(1234567)
assert.equal(formattedNumber.includes('1'), true, 'formatted number should include digits')

const fallbackNumber = formatNumber(undefined)
assert.equal(fallbackNumber, '0', 'missing numbers should default to 0')

const blocks = normalizePostBlocks(richPost)
assert.equal(blocks.length >= 3, true, 'rich posts should normalize into multiple blocks')
assert.equal(blocks[0].type, 'paragraph', 'first block should remain a paragraph')
assert.equal(blocks[1].type === 'image' || blocks[1].type === 'gallery', true, 'image blocks should surface media')

const heroFromBlocks = resolveHeroImageUrl(richPost, blocks)
assert.equal(heroFromBlocks, 'https://example.com/hero.jpg', 'hero resolver should pick hero media url')

console.log('post-page.test.ts: post helper tests passed')
