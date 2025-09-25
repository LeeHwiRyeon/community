import { MouseEvent, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { apiService, Post, PostPreview } from '../api'
import { useAuth } from '../contexts/AuthContext'

type PostFormat = 'article' | 'broadcast' | 'gallery' | 'discussion'
type BroadcastPreview = Extract<PostPreview, { type: 'broadcast' }>
type DiscussionPreview = Extract<PostPreview, { type: 'discussion' }>
type GalleryPreview = Extract<PostPreview, { type: 'gallery' }>

const SUPPORTED_POST_FORMATS = new Set<PostFormat>(['article', 'broadcast', 'gallery', 'discussion'])

const formatNumber = (value?: number): string => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return '0'
  }

  return value.toLocaleString()
}

const safeDate = (value?: string | null): string => {
  if (!value) {
    return ''
  }

  const parsed = new Date(value)

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

const splitContent = (value?: string | null): string[] => {
  if (!value) {
    return []
  }

  return value
    .replace(/\r\n?/g, '\n')
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0)
}

const asBroadcastPreview = (preview?: PostPreview): BroadcastPreview | undefined =>
  preview && preview.type === 'broadcast' ? (preview as BroadcastPreview) : undefined

const asDiscussionPreview = (preview?: PostPreview): DiscussionPreview | undefined =>
  preview && preview.type === 'discussion' ? (preview as DiscussionPreview) : undefined

const asGalleryPreview = (preview?: PostPreview): GalleryPreview | undefined =>
  preview && preview.type === 'gallery' ? (preview as GalleryPreview) : undefined

const derivePostFormat = (post: Post): PostFormat => {
  if (post.preview && typeof post.preview === 'object' && 'type' in post.preview) {
    const previewType = (post.preview as PostPreview).type

    if (SUPPORTED_POST_FORMATS.has(previewType as PostFormat)) {
      return previewType as PostFormat
    }
  }

  if (post.mediaType && SUPPORTED_POST_FORMATS.has(post.mediaType as PostFormat)) {
    return post.mediaType as PostFormat
  }

  if (post.stream_url) {
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

export default function PostPage(): JSX.Element {
  const { boardId, postId } = useParams<{ boardId: string; postId: string }>()
  const navigate = useNavigate()
  const { isLoggedIn } = useAuth()

  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const fetchPost = async () => {
      if (!postId) {
        setError('게시글을 찾을 수 없습니다.')
        setLoading(false)
        return
      }

      try {
        const postData = await apiService.getPost(postId)

        if (!cancelled) {
          setPost(postData)
          setError(null)
        }

        apiService.incrementViews(postId).catch(() => undefined)
      } catch (err) {
        console.error('Failed to fetch post:', err)
        if (!cancelled) {
          setError('게시글을 불러오지 못했습니다.')
          setPost(null)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchPost()

    return () => {
      cancelled = true
    }
  }, [postId])

  const handleGoBack = () => {
    if (boardId) {
      navigate(`/board/${boardId}`)
    } else {
      navigate('/')
    }
  }

  if (loading) {
    return <div className="loading">로딩 중...</div>
  }

  if (!post) {
    return (
      <div className="error">
        <p>{error ?? '게시글을 찾을 수 없습니다.'}</p>
        <button onClick={handleGoBack} className="go-back-btn">
          목록으로 돌아가기
        </button>
      </div>
    )
  }

  const displayFormat = derivePostFormat(post)
  const preview = post.preview
  const broadcastPreview = asBroadcastPreview(preview)
  const discussionPreview = asDiscussionPreview(preview)
  const galleryPreview = asGalleryPreview(preview)

  const baseGalleryImages = galleryPreview?.images?.filter(Boolean) ?? []

  let heroImage: string | null = null
  let galleryImages: string[] = []

  if (displayFormat === 'gallery') {
    heroImage = post.thumb ?? baseGalleryImages[0] ?? null
    const heroIndex = heroImage ? baseGalleryImages.indexOf(heroImage) : -1
    galleryImages = heroIndex >= 0 ? baseGalleryImages.filter((_, index) => index !== heroIndex) : baseGalleryImages
  } else if (displayFormat === 'broadcast') {
    heroImage = broadcastPreview?.thumbnail ?? post.thumb ?? null
  } else {
    heroImage = post.thumb ?? null
  }

  const streamUrl = broadcastPreview?.streamUrl ?? post.stream_url ?? null
  const viewLabel = `${formatNumber(post.views)} views`
  const commentsLabel = typeof post.comments_count === 'number' ? `${formatNumber(post.comments_count)} comments` : null
  const createdDate = safeDate(post.created_at) || safeDate(post.updated_at)
  const paragraphs = useMemo(() => splitContent(post.content), [post.content])

  const handleStreamClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()

    if (streamUrl && typeof window !== 'undefined') {
      window.open(streamUrl, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <div className="post-page">
      <div className="post-header">
        <div className="post-navigation">
          <button onClick={handleGoBack} className="go-back-btn">
            ← 목록으로
          </button>
        </div>
        <h1>{post.title}</h1>
        <div className="post-meta">
          <span className="author">{post.author ?? 'Anonymous'}</span>
          {createdDate ? <span className="date">{createdDate}</span> : null}
          <span className="views">{viewLabel}</span>
          {commentsLabel ? <span className="comments">{commentsLabel}</span> : null}
        </div>
      </div>

      {heroImage ? (
        <figure className={`post-hero post-hero--${displayFormat}`}>
          <img src={heroImage} alt={`Preview for ${post.title}`} loading="lazy" />
          {displayFormat === 'broadcast' && broadcastPreview ? (
            <figcaption>
              <span className={`post-hero__badge${broadcastPreview.isLive ? ' is-live' : ''}`}>
                {broadcastPreview.isLive ? 'LIVE' : broadcastPreview.scheduleLabel ?? 'Scheduled'}
              </span>
            </figcaption>
          ) : null}
        </figure>
      ) : null}

      <div className="post-content">
        {displayFormat === 'broadcast' && broadcastPreview ? (
          <aside className="post-broadcast">
            <div className="post-broadcast__summary">
              <span>{broadcastPreview.streamer ?? post.author ?? 'Live host'}</span>
              <span>{broadcastPreview.platform}</span>
              {broadcastPreview.scheduleLabel ? <span>{broadcastPreview.scheduleLabel}</span> : null}
            </div>
            {broadcastPreview.tags?.length ? (
              <div className="post-tags" aria-label="방송 태그">
                {broadcastPreview.tags.map((tag) => (
                  <span className="post-tag" key={tag}>
                    #{tag}
                  </span>
                ))}
              </div>
            ) : null}
            {streamUrl ? (
              <button type="button" className="post-broadcast__button" onClick={handleStreamClick}>
                방송 보기
              </button>
            ) : null}
          </aside>
        ) : null}

        {displayFormat === 'gallery' && galleryPreview?.featuredCosplayer ? (
          <div className="post-gallery__summary">
            <span className="post-gallery__label">Featured Cosplayer</span>
            <strong>{galleryPreview.featuredCosplayer}</strong>
            {galleryPreview.likes ? <span>{formatNumber(galleryPreview.likes)} likes</span> : null}
          </div>
        ) : null}

        {displayFormat === 'gallery' && galleryImages.length ? (
          <section className="post-gallery" aria-label="이미지 갤러리">
            <ul className="post-gallery__grid">
              {galleryImages.map((image, index) => (
                <li key={`${image}-${index}`} className="post-gallery__item">
                  <img src={image} alt={`${post.title} 이미지 ${index + 1}`} loading="lazy" />
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {discussionPreview?.highlight ? (
          <blockquote className="post-quote">{discussionPreview.highlight}</blockquote>
        ) : null}

        {paragraphs.length ? (
          <div className="content">
            {paragraphs.map((paragraph, index) => (
              <p key={`paragraph-${index}`}>{paragraph}</p>
            ))}
          </div>
        ) : (
          <div className="no-content">게시글에 내용이 없습니다.</div>
        )}
      </div>

      <div className="post-actions">
        {isLoggedIn ? (
          <>
            <button className="edit-btn">수정</button>
            <button className="delete-btn">삭제</button>
          </>
        ) : null}
        <button onClick={handleGoBack} className="list-btn">
          목록
        </button>
      </div>

      <div className="comments-section">
        <h3>댓글</h3>
        <div className="comments-placeholder">댓글 기능을 준비 중입니다.</div>
      </div>
    </div>
  )
}
