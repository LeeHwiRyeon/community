import React, { MouseEvent, useEffect, useMemo, useState } from 'react'
import { Alert, AlertIcon, Box, Center, Spinner, Stack, Text } from '@chakra-ui/react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Post,
  PostPreview
} from '../api'
import { buildPostLink } from '../utils/routes'
import {
  useCommunities,
  useCommunityBoardPosts,
  useNewsPosts,
  useTrendingList
} from '../hooks/useCommunityData'
import { BoardCardSkeleton } from '../components/Skeleton'

type SupportedPostFormat = 'article' | 'discussion' | 'broadcast' | 'gallery'
type BroadcastPreview = Extract<PostPreview, { type: 'broadcast' }>
type DiscussionPreview = Extract<PostPreview, { type: 'discussion' }>
type GalleryPreview = Extract<PostPreview, { type: 'gallery' }>

const NEWS_BOARD_ID = 'news'
const SUPPORTED_POST_FORMATS = new Set<SupportedPostFormat>([
  'article',
  'discussion',
  'broadcast',
  'gallery'
])

const BOARD_LABELS: Record<string, string> = {
  news: 'News',
  ranking: 'Ranking',
  community: 'Community',
  broadcast: 'Broadcast',
  cosplay: 'Cosplay',
  game: 'Game',
  free: 'Community',
  hot: 'Hot Topics'
}

const sortPostsByViews = <T extends Post>(posts: T[]): T[] =>
  [...posts].sort((a, b) => (b.views ?? 0) - (a.views ?? 0))

const formatNumber = (value?: number): string => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return '0'
  }

  return value.toLocaleString()
}

const toExcerpt = (value?: string, length = 140): string => {
  if (!value) {
    return ''
  }

  const normalized = value.replace(/\s+/g, ' ').trim()

  if (normalized.length <= length) {
    return normalized
  }

  return `${normalized.slice(0, length).trimEnd()}...`
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

const toDateValue = (value?: string | null): number => {
  if (!value) {
    return 0
  }

  const timestamp = new Date(value).getTime()
  return Number.isFinite(timestamp) ? timestamp : 0
}


const toErrorMessage = (error: unknown): string => {
  if (!error) {
    return ''
  }

  if (error instanceof Error) {
    return error.message
  }

  return String(error)
}

const resolveBoardLabel = (boardId: string): string => {
  if (BOARD_LABELS[boardId]) {
    return BOARD_LABELS[boardId]
  }

  const normalized = boardId.toLowerCase()

  if (normalized.includes('broadcast')) {
    return 'Broadcast'
  }

  if (normalized.includes('cosplay')) {
    return 'Cosplay'
  }

  if (normalized.includes('community')) {
    return 'Community'
  }

  if (normalized.includes('news')) {
    return 'News'
  }

  if (normalized.includes('rank')) {
    return 'Ranking'
  }

  if (normalized.includes('game')) {
    return 'Game'
  }

  return boardId
}

const asBroadcastPreview = (preview?: PostPreview): BroadcastPreview | undefined =>
  preview && preview.type === 'broadcast' ? (preview as BroadcastPreview) : undefined

const asDiscussionPreview = (preview?: PostPreview): DiscussionPreview | undefined =>
  preview && preview.type === 'discussion' ? (preview as DiscussionPreview) : undefined

const asGalleryPreview = (preview?: PostPreview): GalleryPreview | undefined =>
  preview && preview.type === 'gallery' ? (preview as GalleryPreview) : undefined

const getPostFormat = (post: Post, fallbackFormat?: string | null): string => {
  if (post.preview && typeof post.preview === 'object' && 'type' in post.preview) {
    const previewType = (post.preview as PostPreview).type

    if (typeof previewType === 'string' && previewType.trim()) {
      return previewType
    }
  }

  if (post.mediaType && post.mediaType.trim()) {
    return post.mediaType
  }

  if (fallbackFormat && fallbackFormat.trim()) {
    return fallbackFormat
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

function HomePage(): React.ReactElement {
  const [selectedCommunityId, setSelectedCommunityId] = useState<string | null>(null)
  const navigate = useNavigate()

  const newsQuery = useNewsPosts()
  const trendingQuery = useTrendingList(10, 7)
  const communitiesQuery = useCommunities()

  const newsPosts = newsQuery.data ?? []
  const trendingItems = trendingQuery.data?.items ?? []
  const communities = communitiesQuery.data ?? []

  useEffect(() => {
    if (communities.length === 0) {
      return
    }

    setSelectedCommunityId((current) => current ?? communities[0].id)
  }, [communities, selectedCommunityId])

  const selectedCommunity = useMemo(() => {
    if (communities.length === 0) {
      return null
    }

    if (selectedCommunityId) {
      const match = communities.find((community) => community.id === selectedCommunityId)

      if (match) {
        return match
      }
    }

    return communities[0]
  }, [communities, selectedCommunityId])

  const communityBoards = useMemo(() => {
    if (!selectedCommunity) {
      return []
    }

    return [...selectedCommunity.boards].sort((a, b) => {
      const orderA = typeof a.ordering === 'number' ? a.ordering : typeof a.rank === 'number' ? a.rank : 0
      const orderB = typeof b.ordering === 'number' ? b.ordering : typeof b.rank === 'number' ? b.rank : 0

      return orderA - orderB
    })
  }, [selectedCommunity])

  const {
    postsByBoardId,
    isLoading: boardPostsLoading,
    isFetching: boardPostsFetching,
    errors: boardPostsErrors
  } = useCommunityBoardPosts(communityBoards)

  const communityLoading = communitiesQuery.isFetching || boardPostsLoading || boardPostsFetching
  const isCommunitiesLoading = communitiesQuery.isLoading && communities.length === 0
  const communitiesErrorMessage = toErrorMessage(communitiesQuery.error)
  const hasCommunitiesError = communitiesErrorMessage.length > 0
  const boardPostsErrorMessage = boardPostsErrors
    .filter((error) => Boolean(error))
    .map((error) => toErrorMessage(error))
    .filter((message) => message.length > 0)
    .join(' ')
  const hasBoardPostsError = boardPostsErrorMessage.length > 0
  const combinedCommunityErrorMessage = [communitiesErrorMessage, boardPostsErrorMessage]
    .filter((message) => message.length > 0)
    .join(' ')
  const trendingLoading = trendingQuery.isLoading
  const trendingErrorMessage = toErrorMessage(trendingQuery.error)
  const hasTrendingError = trendingErrorMessage.length > 0
  const initializing =
    (newsQuery.isLoading && newsPosts.length === 0) ||
    (communitiesQuery.isLoading && communities.length === 0) ||
    (newsQuery.isError && newsPosts.length === 0) ||
    (communitiesQuery.isError && communities.length === 0)

  const communityPosts = useMemo(() => {
    if (!selectedCommunity) {
      return []
    }

    const aggregated = communityBoards.flatMap((board) => {
      const posts = postsByBoardId[board.id] ?? board.posts ?? []
      return posts.map((post) => ({
        boardId: board.id,
        boardTitle: board.title,
        boardFormat: board.preview_format ?? board.format ?? null,
        post
      }))
    })

    return aggregated.sort((a, b) => {
      const left = toDateValue(a.post.created_at ?? a.post.updated_at ?? a.post.date)
      const right = toDateValue(b.post.created_at ?? b.post.updated_at ?? b.post.date)
      return right - left
    })
  }, [selectedCommunity, communityBoards, postsByBoardId])


  const boardSummaries = useMemo(() => {
    if (communityBoards.length === 0) {
      return []
    }

    return communityBoards.map((board) => {
      const posts = postsByBoardId[board.id] ?? board.posts ?? []
      const latestPost = posts[0]
      const latestDateLabel = latestPost
        ? safeDate(latestPost.created_at) || safeDate(latestPost.updated_at)
        : ''

      return {
        id: board.id,
        title: board.title,
        summary: board.summary ?? '',
        format: board.preview_format ?? board.format ?? null,
        postCount: posts.length,
        latestDateLabel,
        views: posts.reduce((sum, post) => sum + (post.views ?? 0), 0)
      }
    })
  }, [communityBoards, postsByBoardId])

  const heroPost = newsPosts[0] ?? null
  const newsSubPosts = newsPosts.slice(1, 4)
  const trendingCount = trendingItems.length

  const renderPostMeta = (items: Array<string | undefined | null>) => {
    const compact = items
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter((value) => value.length > 0)

    if (!compact.length) {
      return null
    }

    return (
      <footer className="community-hub__post-meta">
        {compact.map((item) => (
          <span key={item}>{item}</span>
        ))}
      </footer>
    )
  }

  const renderPostCard = (
    post: Post,
    boardContext?: { id: string; title?: string; format?: string | null }
  ) => {
    const preview = post.preview
    const format = getPostFormat(post, boardContext?.format ?? null)
    const normalizedFormat = typeof format === 'string' ? format.toLowerCase() : 'article'
    const candidate = normalizedFormat as SupportedPostFormat

    let displayFormat: SupportedPostFormat = SUPPORTED_POST_FORMATS.has(candidate)
      ? candidate
      : 'article'

    const broadcastPreview = asBroadcastPreview(preview)
    const discussionPreview = asDiscussionPreview(preview)
    const galleryPreview = asGalleryPreview(preview)

    if (displayFormat === 'broadcast' && !broadcastPreview) {
      displayFormat = 'article'
    } else if (displayFormat === 'gallery' && !galleryPreview) {
      displayFormat = 'article'
    } else if (displayFormat === 'discussion' && !discussionPreview) {
      displayFormat = 'article'
    }

    const linkTargetBoard = boardContext?.id ?? post.board_id
    const boardLabel = boardContext?.title ?? resolveBoardLabel(linkTargetBoard)
    const cardClassName = `community-hub__post-card community-hub__post-card--${displayFormat}`
    const defaultExcerpt = toExcerpt(post.content, displayFormat === 'article' ? 140 : 120)

    if (displayFormat === 'broadcast' && broadcastPreview) {
      const streamUrl = broadcastPreview.streamUrl ?? post.stream_url ?? ''
      const badgeLabel = broadcastPreview.isLive
        ? 'LIVE'
        : broadcastPreview.scheduleLabel ?? 'On Air'

      const handleStreamClick = (event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault()
        event.stopPropagation()

        const targetUrl = broadcastPreview.streamUrl ?? post.stream_url

        if (targetUrl && typeof window !== 'undefined') {
          window.open(targetUrl, '_blank', 'noopener,noreferrer')
        }
      }

      return (
        <li key={post.id}>
          <Link
            to={buildPostLink(linkTargetBoard, post.id)}
            className={cardClassName}
            aria-label={`Open broadcast post ${post.title}`}
          >
            <div className="community-hub__post-broadcast">
              <div className="community-hub__post-broadcast-media">
                {broadcastPreview.thumbnail || post.thumb ? (
                  <img
                    src={broadcastPreview.thumbnail ?? post.thumb ?? ''}
                    alt={`Preview for ${post.title}`}
                    loading="lazy"
                  />
                ) : (
                  <div className="community-hub__post-broadcast-placeholder" aria-hidden="true" />
                )}
                <span className={`community-hub__post-broadcast-badge${broadcastPreview.isLive ? ' is-live' : ''}`}>
                  {badgeLabel}
                </span>
              </div>
              <div className="community-hub__post-broadcast-body">
                <h4>{post.title}</h4>
                <p>{toExcerpt(post.content, 120)}</p>
                {broadcastPreview.tags?.length ? (
                  <div className="community-hub__post-broadcast-tags">
                    {broadcastPreview.tags.slice(0, 3).map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                ) : null}
                {renderPostMeta([
                  boardLabel,
                  broadcastPreview.streamer ?? post.author ?? undefined,
                  broadcastPreview.platform,
                  `${formatNumber(post.views)} views`
                ])}
                {streamUrl ? (
                  <button
                    type="button"
                    className="community-hub__post-broadcast-button"
                    onClick={handleStreamClick}
                  >
                    Watch stream
                  </button>
                ) : null}
              </div>
            </div>
          </Link>
        </li>
      )
    }

    if (displayFormat === 'gallery' && galleryPreview) {
      const galleryMeta = [
        galleryPreview.featuredCosplayer ? `By ${galleryPreview.featuredCosplayer}` : post.author,
        `${formatNumber(galleryPreview.likes ?? post.views)} likes`
      ]

      return (
        <li key={post.id}>
          <Link
            to={buildPostLink(linkTargetBoard, post.id)}
            className={cardClassName}
            aria-label={`Open gallery post ${post.title}`}
          >
            <div className="community-hub__post-gallery">
              {galleryPreview.images?.length ? (
                <div className="community-hub__post-gallery-strip">
                  {galleryPreview.images.slice(0, 3).map((image, index) => (
                    <img
                      key={image ?? `gallery-${post.id}-${index}`}
                      src={image}
                      alt={`${post.title} preview ${index + 1}`}
                      loading="lazy"
                    />
                  ))}
                </div>
              ) : null}
              <div className="community-hub__post-gallery-details">
                <h4>{post.title}</h4>
                <p>{toExcerpt(post.content, 120)}</p>
                {renderPostMeta(galleryMeta)}
              </div>
            </div>
            {renderPostMeta([
              boardLabel,
              post.date ?? (post.created_at ? post.created_at.slice(0, 10) : undefined),
              `${formatNumber(post.views)} views`,
              typeof post.comments_count === 'number' ? `${formatNumber(post.comments_count)} comments` : undefined
            ])}
          </Link>
        </li>
      )
    }

    if (displayFormat === 'discussion') {
      const discussionDetails = [
        boardLabel,
        discussionPreview?.mood,
        discussionPreview?.replies ? `${formatNumber(discussionPreview.replies)} replies` : undefined,
        typeof post.comments_count === 'number' ? `${formatNumber(post.comments_count)} comments` : undefined,
        post.author ?? undefined,
        post.date ?? (post.created_at ? post.created_at.slice(0, 10) : undefined)
      ]

      return (
        <li key={post.id}>
          <Link
            to={buildPostLink(linkTargetBoard, post.id)}
            className={cardClassName}
            aria-label={`Open discussion post ${post.title}`}
          >
            <div className="community-hub__post-content">
              <h4>{post.title}</h4>
              <p>{discussionPreview?.snippet ?? defaultExcerpt}</p>
            </div>
            {discussionPreview?.highlight ? (
              <blockquote className="community-hub__post-quote">{discussionPreview.highlight}</blockquote>
            ) : null}
            {renderPostMeta(discussionDetails)}
          </Link>
        </li>
      )
    }

    return (
      <li key={post.id}>
        <Link
          to={buildPostLink(linkTargetBoard, post.id)}
          className={cardClassName}
          aria-label={`Open article post ${post.title}`}
        >
          <div className="community-hub__post-content">
            <h4>{post.title}</h4>
            <p>{defaultExcerpt}</p>
          </div>
          {renderPostMeta([
            boardLabel,
            post.author ?? undefined,
            post.date ?? (post.created_at ? post.created_at.slice(0, 10) : undefined),
            `${formatNumber(post.views)} views`,
            typeof post.comments_count === 'number' ? `${formatNumber(post.comments_count)} comments` : undefined
          ])}
        </Link>
      </li>
    )
  }

  if (initializing && !heroPost) {
    return (
      <Box className="home">
        <Stack as="header" className="home__section-header" spacing={3}>
          <div>
            <div className="skeleton" style={{ height: '40px', width: '300px', marginBottom: '8px' }}></div>
            <div className="skeleton" style={{ height: '20px', width: '500px' }}></div>
          </div>
        </Stack>

        <section className="home__layout">
          <div className="home__news-column">
            <div className="skeleton" style={{ height: '300px', width: '100%', marginBottom: '20px' }}></div>
            <div className="skeleton" style={{ height: '200px', width: '100%', marginBottom: '20px' }}></div>
            <div className="skeleton" style={{ height: '150px', width: '100%' }}></div>
          </div>

          <div className="home__community-column">
            <div className="skeleton" style={{ height: '40px', width: '200px', marginBottom: '16px' }}></div>
            <div className="community-hub__board-cards">
              {Array.from({ length: 6 }).map((_, index) => (
                <BoardCardSkeleton key={index} />
              ))}
            </div>
          </div>
        </section>
      </Box>
    )
  }

  const heroMetaDate = heroPost ? safeDate(heroPost.created_at) || safeDate(heroPost.updated_at) : ''
  const communityPostLimit = 12

  return (
    <Box className="home">
      <Stack as="header" className="home__section-header" spacing={3}>
        <div>
          <h1>Community Dashboard</h1>
          <p>Stay on top of live game news, broadcasts, and cosplay highlights in one view.</p>
        </div>
      </Stack>

      <section className="home__layout">
        <div className="home__news-column">
          {heroPost ? (
            <Link
              to={buildPostLink(heroPost.board_id, heroPost.id)}
              className="hero-card-link"
              aria-label={`Read feature article ${heroPost.title}`}
            >
              <article className="hero-card">
                <div className="hero-card__media">
                  {heroPost.thumb ? (
                    <img src={heroPost.thumb} alt={heroPost.title} loading="lazy" />
                  ) : (
                    <div className="hero-card__media-placeholder" aria-hidden="true" />
                  )}
                </div>
                <div className="hero-card__content">
                  <span className="hero-card__badge">Featured Story</span>
                  <h2 className="hero-card__title">{heroPost.title}</h2>
                  <p className="hero-card__summary">{toExcerpt(heroPost.content, 240)}</p>
                  <footer className="hero-card__footer">
                    <div className="hero-card__meta">
                      <span>{heroPost.author ?? 'News Desk'}</span>
                      {heroMetaDate ? <span>{heroMetaDate}</span> : null}
                    </div>
                    <ul className="hero-card__stats">
                      <li>{formatNumber(heroPost.views)} views</li>
                      {typeof heroPost.comments_count === 'number' ? (
                        <li>{formatNumber(heroPost.comments_count)} comments</li>
                      ) : null}
                    </ul>
                  </footer>
                </div>
              </article>
            </Link>
          ) : null}

          {newsSubPosts.length ? (
            <ul className="news-grid" aria-label="Latest news">
              {newsSubPosts.map((post) => {
                const metaDate = safeDate(post.created_at) || safeDate(post.updated_at)

                return (
                  <li key={post.id}>
                    <Link
                      to={buildPostLink(post.board_id, post.id)}
                      className="news-card-link"
                      aria-label={`Read article ${post.title}`}
                    >
                      <article className="news-card">
                        <div className="news-card__media">
                          {post.thumb ? (
                            <img src={post.thumb} alt={post.title} loading="lazy" />
                          ) : (
                            <div className="news-card__media-placeholder" aria-hidden="true" />
                          )}
                        </div>
                        <div className="news-card__body">
                          <h3 className="news-card__title">{post.title}</h3>
                          <p className="news-card__summary">{toExcerpt(post.content, 160)}</p>
                          <div className="news-card__meta">
                            <span>{post.author ?? 'News Desk'}</span>
                            {metaDate ? <span>{metaDate}</span> : null}
                          </div>
                        </div>
                      </article>
                    </Link>
                  </li>
                )
              })}
            </ul>
          ) : null}


          <section className="community-hub" aria-labelledby="community-hub-title">
            <header className="community-hub__header">
              <div>
                <h2 id="community-hub-title">Community Hub</h2>
                <p>Select a community to browse the latest posts from its boards.</p>
              </div>
              <span className="community-hub__counter">{formatNumber(communities.length)} communities</span>
            </header>

            {isCommunitiesLoading ? (
              <Center py={10}>
                <Spinner size="lg" thickness="4px" />
              </Center>
            ) : (
              <>
                {hasCommunitiesError ? (
                  <Alert status="error" variant="subtle">
                    <AlertIcon />
                    {combinedCommunityErrorMessage || 'Unable to load community data. Please try again in a moment.'}
                  </Alert>
                ) : null}

                {communities.length ? (
                  <>
                    <div className="community-leaderboard" role="tablist" aria-label="커뮤니티 리더보드 선택">
                      {communities.map((community, index) => {
                        const isActive = (selectedCommunity?.id ?? '') === community.id
                        const rank = index + 1

                        return (
                          <div
                            key={community.id}
                            className={`community-leaderboard__item${isActive ? ' is-active' : ''}`}
                            onClick={() => setSelectedCommunityId(community.id)}
                            style={{ cursor: 'pointer' }}
                          >
                            <div className="community-leaderboard__rank">
                              <span className="community-leaderboard__rank-number">#{rank}</span>
                            </div>
                            <div className="community-leaderboard__content">
                              <div className="community-leaderboard__title-section">
                                <span className="community-leaderboard__title">{community.title}</span>
                                {community.description && (
                                  <span className="community-leaderboard__description">{community.description}</span>
                                )}
                              </div>
                              <div className="community-leaderboard__stats">
                                {typeof community.totalViews === 'number' && (
                                  <span className="community-leaderboard__views">
                                    {formatNumber(community.totalViews)} 조회
                                  </span>
                                )}
                                <span className="community-leaderboard__boards">
                                  {community.boards?.length || 0} 게시판
                                </span>
                              </div>
                            </div>
                            {isActive && (
                              <div className="community-leaderboard__indicator" aria-hidden="true">
                                <span>선택됨</span>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    {selectedCommunity ? (
                      <div className="community-hub__posts">
                        <header className="community-hub__posts-header">
                          <div>
                            <h3>{selectedCommunity.title}</h3>
                            <p>{selectedCommunity.description ?? 'Recent posts from every board in this community.'}</p>
                          </div>
                          <span className="community-hub__counter">{formatNumber(communityPosts.length)} posts</span>
                        </header>

                        {boardSummaries.length ? (
                          <div className="community-hub__board-cards">
                            {boardSummaries.map((board, index) => (
                              <div
                                key={board.id}
                                className="board-card card-enter"
                                onClick={() => navigate(`/board/${board.id}`)}
                                style={{ cursor: 'pointer' }}
                              >
                                <div className="board-card__header">
                                  <div className="board-card__title-section">
                                    <span className="board-card__title">{board.title}</span>
                                    {board.format ? (
                                      <span className="board-card__badge">{board.format}</span>
                                    ) : null}
                                  </div>
                                  <span className="board-card__summary">
                                    {board.summary || '게시판 설명이 없습니다.'}
                                  </span>
                                </div>
                                <div className="board-card__body">
                                  <span>게시물: {formatNumber(board.postCount)}</span>
                                  <span>조회수: {formatNumber(board.views)}</span>
                                  {board.latestDateLabel ? (
                                    <span>최신: {board.latestDateLabel}</span>
                                  ) : null}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : null}

                        {hasBoardPostsError ? (
                          <Alert status="error" variant="subtle">
                            <AlertIcon />
                            {boardPostsErrorMessage || 'Unable to load posts for this community.'}
                          </Alert>
                        ) : communityLoading ? (
                          <Center py={8}>
                            <Spinner size="md" thickness="3px" />
                          </Center>
                        ) : communityPosts.length ? (
                          <ul className="community-hub__post-list">
                            {communityPosts.slice(0, communityPostLimit).map((entry) =>
                              renderPostCard(entry.post, {
                                id: entry.boardId,
                                title: entry.boardTitle,
                                format: entry.boardFormat
                              })
                            )}
                          </ul>
                        ) : (
                          <Text className="community-hub__feedback">No posts available for this community yet.</Text>
                        )}
                      </div>
                    ) : null}
                  </>
                ) : (
                  <Text className="community-hub__feedback">No communities available.</Text>
                )}
              </>
            )}
          </section>
        </div>

        <aside className="home__sidebar">

          <section className="trending" aria-labelledby="trending-title">
            <Stack as="header" className="trending__header" spacing={3}>
              <div>
                <h2 id="trending-title">Trending Now</h2>
                <p>Top viewed posts from the last seven days.</p>
              </div>
              <span className="trending__count">{formatNumber(trendingCount)}</span>
            </Stack>

            {trendingLoading ? (
              <Center py={6}>
                <Spinner size="sm" thickness="3px" />
              </Center>
            ) : hasTrendingError ? (
              <Alert status="error" variant="subtle">
                <AlertIcon />
                {trendingErrorMessage || 'Unable to load trending posts right now.'}
              </Alert>
            ) : trendingItems.length ? (
              <ol className="trending__list">
                {trendingItems.slice(0, 10).map((item) => (
                  <li key={`${item.board}-${item.id}`} className="trending__item">
                    <div className={`trending__rank${item.rank <= 3 ? ' is-top' : ''}`}>{item.rank}</div>
                    <div className="trending__details">
                      <Link
                        to={buildPostLink(item.board, item.id)}
                        className="trending__title"
                        aria-label={`Open trending post ${item.title}`}
                      >
                        {item.title}
                      </Link>
                      <div className="trending__meta">
                        {item.isRising ? <span className="trend-indicator" aria-label="Rising" /> : null}
                        <span>{resolveBoardLabel(item.board)}</span>
                        <span className="trending__views">{formatNumber(item.views)} views</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <Text className="trending__loading">No trending posts found right now.</Text>
            )}

            <Link to="/board/ranking" className="trending__more">
              View ranking board
            </Link>
          </section>
        </aside>
      </section>
    </Box>
  )
}

export default HomePage





