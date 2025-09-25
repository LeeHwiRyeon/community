import { Fragment, MouseEvent, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Center,
  Flex,
  Heading,
  Image,
  Spinner,
  Stack,
  Text
} from '@chakra-ui/react'
import type { Post } from '../api'
import { apiService } from '../api'
import { usePostDetail } from '../hooks/usePostData'
import { useAuth } from '../contexts/AuthContext'
import {
  PostFormat,
  BroadcastPreview,
  DiscussionPreview,
  GalleryPreview,
  asBroadcastPreview,
  asDiscussionPreview,
  asGalleryPreview,
  derivePostFormat,
  formatNumber,
  safeDate,
  normalizePostBlocks,
  resolveHeroImageUrl,
  type NormalizedBlock
} from './post-helpers'

const PostBroadcastPanel = ({
  preview,
  post,
  onOpenStream
}: {
  preview: BroadcastPreview
  post: Post
  onOpenStream: () => void
}) => (
  <Stack className="post-broadcast" spacing={3}>
    <Stack className="post-broadcast__summary" spacing={1} fontSize="sm">
      <Text as="span">{preview.streamer ?? post.author ?? 'Live host'}</Text>
      <Text as="span">{preview.platform}</Text>
      {preview.scheduleLabel ? <Text as="span">{preview.scheduleLabel}</Text> : null}
    </Stack>
    {preview.tags && preview.tags.length > 0 ? (
      <Flex className="post-tags" wrap="wrap" gap={2} aria-label="Broadcast tags">
        {preview.tags.map((tag) => (
          <Badge key={tag} colorScheme="purple">
            #{tag}
          </Badge>
        ))}
      </Flex>
    ) : null}
    {preview.streamUrl || post.stream_url ? (
      <button type="button" className="post-broadcast__button" onClick={onOpenStream}>
        Watch Stream
      </button>
    ) : null}
  </Stack>
)

const PostGalleryPanel = ({ preview }: { preview: GalleryPreview }) => (
  <Stack className="post-gallery__summary" spacing={1} fontSize="sm">
    <Text as="span" className="post-gallery__label">
      Featured Cosplayer
    </Text>
    {preview.featuredCosplayer ? <Text as="span" fontWeight="semibold">{preview.featuredCosplayer}</Text> : null}
    {typeof preview.likes === 'number' ? <Text as="span">{formatNumber(preview.likes)} likes</Text> : null}
  </Stack>
)

const PostGalleryGrid = ({
  images,
  title
}: {
  images: string[]
  title: string
}) => (
  <section className="post-gallery" aria-label="Gallery preview">
    <ul className="post-gallery__grid">
      {images.map((image, index) => (
        <li key={`${image}-${index}`} className="post-gallery__item">
          <Image src={image} alt={`${title} gallery image ${index + 1}`} loading="lazy" />
        </li>
      ))}
    </ul>
  </section>
)

const PostDiscussionHighlight = ({ highlight }: { highlight: string }) => (
  <blockquote className="post-quote">{highlight}</blockquote>
)

const PostImageBlock = ({
  image,
  title
}: {
  image: { url: string; alt?: string | null; caption?: string | null }
  title: string
}) => (
  <figure className="post-inline-image">
    <Image src={image.url} alt={image.alt ?? title} loading="lazy" />
    {image.caption ? <figcaption>{image.caption}</figcaption> : null}
  </figure>
)

const PostListBlock = ({ items }: { items: string[] }) => (
  <ul className="post-block-list">
    {items.map((item) => (
      <li key={item}>{item}</li>
    ))}
  </ul>
)

const PostEmbedBlock = ({ label, onOpen }: { label: string; onOpen: () => void }) => (
  <Box className="post-embed">
    <button type="button" className="post-embed__button" onClick={onOpen}>
      {label}
    </button>
  </Box>
)

export default function PostPage(): JSX.Element {
  const { boardId, postId } = useParams<{ boardId?: string; postId?: string }>()
  const navigate = useNavigate()
  const { isLoggedIn } = useAuth()

  const { data: post, isLoading, error } = usePostDetail(postId)

  useEffect(() => {
    if (typeof postId === 'string' && postId.length > 0) {
      apiService.incrementViews(postId).catch(() => undefined)
    }
  }, [postId])

  const handleGoBack = () => {
    if (typeof boardId === 'string' && boardId.length > 0) {
      navigate(/board/)
      return
    }
    navigate('/')
  }

  if (isLoading) {
    return (
      <Center className="post-page__loading">
        <Spinner size="lg" thickness="4px" />
      </Center>
    )
  }

  if (error || post == null) {
    const message = error instanceof Error ? error.message : 'Unable to load this post.'
    return (
      <Box className="post-page__error">
        <Alert status="error" variant="subtle">
          <AlertIcon />
          {message}
        </Alert>
        <button type="button" onClick={handleGoBack} className="go-back-btn">
          Return to list
        </button>
      </Box>
    )
  }

  const displayFormat: PostFormat = derivePostFormat(post)
  const preview = post.preview
  const broadcastPreview = asBroadcastPreview(preview)
  const discussionPreview = asDiscussionPreview(preview)
  const galleryPreview = asGalleryPreview(preview)

  const normalizedBlocks = useMemo(() => normalizePostBlocks(post), [post])
  const heroImage = useMemo(() => resolveHeroImageUrl(post, normalizedBlocks), [post, normalizedBlocks])

  const bodyBlocks = useMemo(() => {
    if (normalizedBlocks.length === 0) {
      return normalizedBlocks
    }
    if (typeof heroImage !== 'string' || heroImage.length === 0) {
      return normalizedBlocks
    }
    let heroRemoved = false
    const filtered: NormalizedBlock[] = []
    normalizedBlocks.forEach((block) => {
      let shouldInclude = true
      if (heroRemoved === false && (block.type === 'image' || block.type === 'gallery')) {
        const matchesHero = (block.images ?? []).some((image) => image.url === heroImage)
        if (matchesHero === true) {
          shouldInclude = false
          heroRemoved = true
        }
      }
      if (shouldInclude) {
        filtered.push(block)
      }
    })
    return filtered
  }, [normalizedBlocks, heroImage])

  const streamUrl = broadcastPreview?.streamUrl ?? post.stream_url ?? null
  const viewLabel = `${formatNumber(post.views)} views`
  const commentsLabel = typeof post.comments_count === 'number' ? `${formatNumber(post.comments_count)} comments` : null
  const createdDate = safeDate(post.created_at) || safeDate(post.updated_at)

  const openExternalUrl = (targetUrl?: string | null) => {
    if (typeof targetUrl === 'string' && targetUrl.length > 0 && typeof window !== 'undefined') {
      window.open(targetUrl, '_blank', 'noopener,noreferrer')
    }
  }

  const handleStreamClick = (event?: MouseEvent<HTMLButtonElement>) => {
    if (event) {
      event.preventDefault()
      event.stopPropagation()
    }
    openExternalUrl(streamUrl)
  }

  const renderBlock = (block: NormalizedBlock) => {
    if (block.type === 'paragraph' && block.text && block.text.length > 0) {
      return (
        <p key={block.key} className="post-body__paragraph">
          {block.text}
        </p>
      )
    }

    if (block.type === 'quote' && block.text && block.text.length > 0) {
      return <PostDiscussionHighlight key={block.key} highlight={block.text} />
    }

    if (block.type === 'list' && Array.isArray(block.items) && block.items.length > 0) {
      return <PostListBlock key={block.key} items={block.items} />
    }

    if ((block.type === 'image' || block.type === 'gallery') && Array.isArray(block.images) && block.images.length > 0) {
      const imageUrls = block.images
        .map((image) => image.url)
        .filter((value) => typeof value === 'string' && value.length > 0)

      if (block.type === 'gallery' || imageUrls.length > 1) {
        return <PostGalleryGrid key={block.key} images={imageUrls} title={post.title} />
      }

      const image = block.images[0]
      if (image && typeof image.url === 'string' && image.url.length > 0) {
        return <PostImageBlock key={block.key} image={image} title={post.title} />
      }
    }

    if (block.type === 'embed' && block.embed && typeof block.embed.url === 'string' && block.embed.url.length > 0) {
      const label = block.embed.title ?? 'Open resource'
      return <PostEmbedBlock key={block.key} label={label} onOpen={() => openExternalUrl(block.embed?.url)} />
    }

    if (block.text && block.text.length > 0) {
      return (
        <p key={block.key} className="post-body__paragraph">
          {block.text}
        </p>
      )
    }

    return null
  }

  const renderedBlocks = bodyBlocks.map((block) => renderBlock(block)).filter((element) => element !== null)
  const hasBodyContent = renderedBlocks.length > 0

  return (
    <Box className="post-page">
      <Stack className="post-header" spacing={4}>
        <Flex className="post-navigation" justify="space-between">
          <button type="button" onClick={handleGoBack} className="go-back-btn">
            Back to list
          </button>
          <Badge colorScheme="purple" textTransform="uppercase">
            {displayFormat}
          </Badge>
        </Flex>
        <Heading as="h1" size="lg">
          {post.title}
        </Heading>
        <Stack className="post-meta" direction="row" spacing={4} fontSize="sm">
          <Text as="span" className="author">
            {post.author ?? 'Anonymous'}
          </Text>
          {createdDate ? (
            <Text as="span" className="date">
              {createdDate}
            </Text>
          ) : null}
          <Text as="span" className="views">
            {viewLabel}
          </Text>
          {commentsLabel ? (
            <Text as="span" className="comments">
              {commentsLabel}
            </Text>
          ) : null}
        </Stack>
      </Stack>

      {heroImage ? (
        <figure className={`post-hero post-hero--${displayFormat}`}>
          <Image src={heroImage} alt={`${post.title} hero image`} loading="lazy" />
          {displayFormat === 'broadcast' && broadcastPreview ? (
            <figcaption>
              <span className="post-hero__badge">
                {broadcastPreview.isLive ? 'LIVE' : broadcastPreview.scheduleLabel ?? 'Scheduled'}
              </span>
            </figcaption>
          ) : null}
        </figure>
      ) : null}

      <Stack className="post-content" spacing={6}>
        {displayFormat === 'broadcast' && broadcastPreview ? (
          <PostBroadcastPanel preview={broadcastPreview} post={post} onOpenStream={() => handleStreamClick()} />
        ) : null}

        {displayFormat === 'gallery' && galleryPreview ? (
          <PostGalleryPanel preview={galleryPreview} />
        ) : null}

        {displayFormat === 'discussion' && discussionPreview?.highlight ? (
          <PostDiscussionHighlight highlight={discussionPreview.highlight} />
        ) : null}

        {hasBodyContent ? renderedBlocks : <Box className="no-content">This post does not include body content yet.</Box>}
      </Stack>

      <Stack className="post-actions" direction="row" spacing={3}>
        {isLoggedIn ? (
          <Fragment>
            <button type="button" className="edit-btn">
              Edit
            </button>
            <button type="button" className="delete-btn">
              Delete
            </button>
          </Fragment>
        ) : null}
        <button type="button" onClick={handleGoBack} className="list-btn">
          Back to list
        </button>
      </Stack>

      <Box className="comments-section">
        <Heading as="h3" size="md">
          Comments
        </Heading>
        <Box className="comments-placeholder">Comments will be available soon.</Box>
      </Box>
    </Box>
  )
}
