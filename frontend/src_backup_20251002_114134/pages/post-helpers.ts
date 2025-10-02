import type { Post, PostPreview, PostBlock, PostMedia } from '../api'

export type PostFormat = 'article' | 'broadcast' | 'gallery' | 'discussion'
export type BroadcastPreview = Extract<PostPreview, { type: 'broadcast' }>
export type DiscussionPreview = Extract<PostPreview, { type: 'discussion' }>
export type GalleryPreview = Extract<PostPreview, { type: 'gallery' }>

const SUPPORTED_POST_FORMATS = new Set<PostFormat>(['article', 'broadcast', 'gallery', 'discussion'])

export const formatNumber = (value?: number): string => {
  if (typeof value !== 'number') {
    return '0'
  }
  if (Number.isFinite(value) == false) {
    return '0'
  }
  return value.toLocaleString()
}

export const safeDate = (value?: string | null): string => {
  if (typeof value !== 'string') {
    return ''
  }
  const trimmed = value.trim()
  if (trimmed.length === 0) {
    return ''
  }
  const parsed = new Date(trimmed)
  if (Number.isNaN(parsed.getTime())) {
    return ''
  }
  return parsed.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short'
  })
}

export const splitContent = (value?: string | null): string[] => {
  if (typeof value !== 'string') {
    return []
  }
  const trimmed = value.trim()
  if (trimmed.length === 0) {
    return []
  }
  const normalised = trimmed.replace(/\r?\n/g, '\n')
  return normalised
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0)
}

export const asBroadcastPreview = (preview?: PostPreview): BroadcastPreview | undefined => {
  if (preview && preview.type === 'broadcast') {
    return preview as BroadcastPreview
  }
  return undefined
}

export const asDiscussionPreview = (preview?: PostPreview): DiscussionPreview | undefined => {
  if (preview && preview.type === 'discussion') {
    return preview as DiscussionPreview
  }
  return undefined
}

export const asGalleryPreview = (preview?: PostPreview): GalleryPreview | undefined => {
  if (preview && preview.type === 'gallery') {
    return preview as GalleryPreview
  }
  return undefined
}

export const derivePostFormat = (post: Post): PostFormat => {
  const preview = post.preview
  if (preview && typeof preview === 'object' && 'type' in preview) {
    const previewType = (preview as PostPreview).type
    if (SUPPORTED_POST_FORMATS.has(previewType as PostFormat)) {
      return previewType as PostFormat
    }
  }
  if (post.mediaType && SUPPORTED_POST_FORMATS.has(post.mediaType as PostFormat)) {
    return post.mediaType as PostFormat
  }
  if (typeof post.stream_url === 'string' && post.stream_url.length > 0) {
    return 'broadcast'
  }
  if (post.category === 'cosplay') {
    return 'gallery'
  }
  if (post.category === 'community') {
    return 'discussion'
  }
  return 'article'
}

export interface NormalizedBlockImage {
  url: string
  alt?: string | null
  caption?: string | null
  thumbnail?: string | null
  width?: number | null
  height?: number | null
}

export interface NormalizedBlock {
  key: string
  ordering: number
  type: 'paragraph' | 'image' | 'gallery' | 'quote' | 'embed' | 'list' | 'unknown'
  text?: string | null
  images?: NormalizedBlockImage[]
  items?: string[]
  embed?: {
    url?: string | null
    platform?: string | null
    title?: string | null
    isLive?: boolean
  }
  metadata?: Record<string, unknown> | null
  raw?: PostBlock
}

const collectBlockImages = (block: PostBlock, mediaLookup: Map<string, PostMedia>): NormalizedBlockImage[] => {
  const images: NormalizedBlockImage[] = []
  const pushMediaRecord = (media: PostMedia | undefined | null) => {
    if (media == null) {
      return
    }
    if (typeof media.url !== 'string' || media.url.length === 0) {
      return
    }
    const exists = images.some((candidate) => candidate.url === media.url)
    if (exists === true) {
      return
    }
    images.push({
      url: media.url,
      alt: media.alt_text ?? null,
      caption: media.caption ?? null,
      thumbnail: media.thumbnail_url ?? null,
      width: typeof media.width === 'number' ? media.width : null,
      height: typeof media.height === 'number' ? media.height : null
    })
  }

  const pushUrlRecord = (value: unknown, caption?: string | null) => {
    if (typeof value === 'string' && value.length > 0) {
      const exists = images.some((candidate) => candidate.url === value)
      if (exists === false) {
        images.push({ url: value, caption: caption ?? null })
      }
    }
  }

  const data = (block.data as Record<string, unknown> | null) ?? {}

  if ('mediaId' in data) {
    const key = data.mediaId
    const media = typeof key === 'string' ? mediaLookup.get(key) : mediaLookup.get(String(key))
    if (media) {
      pushMediaRecord(media)
    }
  }

  if ('mediaIds' in data && Array.isArray(data.mediaIds)) {
    data.mediaIds.forEach((key) => {
      const media = typeof key === 'string' ? mediaLookup.get(key) : mediaLookup.get(String(key))
      if (media) {
        pushMediaRecord(media)
      }
    })
  }

  if ('url' in data) {
    pushUrlRecord(data.url ?? null, typeof data.caption === 'string' ? data.caption : null)
  }

  if ('src' in data) {
    pushUrlRecord(data.src ?? null, typeof data.caption === 'string' ? data.caption : null)
  }

  if ('thumbnail' in data) {
    pushUrlRecord(data.thumbnail ?? null)
  }

  if ('images' in data && Array.isArray(data.images)) {
    data.images.forEach((item) => {
      if (typeof item === 'string') {
        pushUrlRecord(item)
      } else if (item && typeof item === 'object' && 'url' in item) {
        const urlValue = (item as Record<string, unknown>).url
        const captionValue = (item as Record<string, unknown>).caption
        pushUrlRecord(urlValue, typeof captionValue === 'string' ? captionValue : null)
      }
    })
  }

  return images
}

const buildMediaLookup = (media?: PostMedia[] | null): Map<string, PostMedia> => {
  const lookup = new Map<string, PostMedia>()
  if (Array.isArray(media) === false) {
    return lookup
  }
  media?.forEach((item) => {
    if (item == null) {
      return
    }
    if (typeof item.id === 'number') {
      lookup.set(String(item.id), item)
    }
    if (typeof item.file_key === 'string' && item.file_key.length > 0) {
      lookup.set(item.file_key, item)
    }
  })
  return lookup
}

export const normalizePostBlocks = (post: Post): NormalizedBlock[] => {
  const rawBlocks = Array.isArray(post.blocks) ? post.blocks : []
  const mediaLookup = buildMediaLookup(post.media ?? null)

  if (rawBlocks.length === 0) {
    const fallbackParagraphs = splitContent(post.content)
    return fallbackParagraphs.map((paragraph, index) => ({
      key: `${post.id}-paragraph-${index}`,
      ordering: (index + 1) * 10,
      type: 'paragraph',
      text: paragraph,
      metadata: null
    }))
  }

  return rawBlocks
    .map((block, index) => {
      const ordering = typeof block.ordering === 'number' ? block.ordering : (index + 1) * 10
      const rawType = typeof block.type === 'string' ? block.type.toLowerCase() : 'unknown'
      const images = collectBlockImages(block, mediaLookup)
      const data = (block.data as Record<string, unknown> | null) ?? {}

      const normalized: NormalizedBlock = {
        key: block.id ? String(block.id) : `${post.id}-block-${index}`,
        ordering,
        type: 'unknown',
        metadata: block.metadata ?? null,
        raw: block
      }

      if (rawType === 'text' || rawType === 'paragraph' || rawType === 'callout') {
        normalized.type = 'paragraph'
        normalized.text = block.text_content ?? (typeof data.text === 'string' ? data.text : null)
        return normalized
      }

      if (rawType === 'quote' || rawType === 'pull_quote') {
        normalized.type = 'quote'
        normalized.text = block.text_content ?? (typeof data.quote === 'string' ? data.quote : null)
        return normalized
      }

      if (rawType === 'image' || rawType === 'media') {
        normalized.type = 'image'
        normalized.images = images
        if (normalized.images == null || normalized.images.length === 0) {
          normalized.images = images
        }
        return normalized
      }

      if (rawType === 'gallery') {
        normalized.type = 'gallery'
        normalized.images = images
        return normalized
      }

      if (rawType === 'list') {
        normalized.type = 'list'
        if (Array.isArray(data.items)) {
          normalized.items = data.items.filter((item) => typeof item === 'string') as string[]
        }
        return normalized
      }

      if (rawType === 'embed' || rawType === 'video' || rawType === 'broadcast') {
        normalized.type = 'embed'
        normalized.embed = {
          url: typeof data.url === 'string' ? data.url : block.text_content ?? null,
          platform: typeof data.platform === 'string' ? data.platform : null,
          title: typeof data.title === 'string' ? data.title : post.title,
          isLive: typeof data.isLive === 'boolean' ? data.isLive : undefined
        }
        return normalized
      }

      if (images.length > 0) {
        normalized.type = 'image'
        normalized.images = images
        return normalized
      }

      normalized.type = 'unknown'
      normalized.text = block.text_content ?? null
      return normalized
    })
    .sort((a, b) => a.ordering - b.ordering)
}

export const resolveHeroImageUrl = (post: Post, blocks: NormalizedBlock[]): string | null => {
  if (post.hero_media && typeof post.hero_media.url === 'string' && post.hero_media.url.length > 0) {
    return post.hero_media.url
  }
  if (typeof post.thumb === 'string' && post.thumb.length > 0) {
    return post.thumb
  }
  if (Array.isArray(post.media)) {
    for (const media of post.media) {
      if (media && typeof media.url === 'string' && media.url.length > 0) {
        return media.url
      }
    }
  }
  for (const block of blocks) {
    if ((block.type === 'image' || block.type === 'gallery') && Array.isArray(block.images) && block.images.length > 0) {
      const candidate = block.images.find((image) => typeof image.url === 'string' && image.url.length > 0)
      if (candidate && typeof candidate.url === 'string') {
        return candidate.url
      }
    }
  }
  const preview = post.preview as PostPreview | undefined
  if (preview && preview.type === 'broadcast' && 'thumbnail' in preview && typeof preview.thumbnail === 'string' && preview.thumbnail.length > 0) {
    return preview.thumbnail
  }
  if (preview && preview.type === 'gallery' && Array.isArray(preview.images)) {
    const first = preview.images.find((image) => typeof image === 'string' && image.length > 0)
    if (typeof first === 'string') {
      return first
    }
  }
  return null
}
