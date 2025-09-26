import React, { useEffect, useMemo } from 'react'
import { useParams, Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import type { Post, Board } from '../api'
import { useBoardPosts, useBoardsCatalog } from '../hooks/useBoardData'
import { gameCategories, type CategoryNode } from '../data/categories'
import { PostCardSkeleton } from '../components/Skeleton'

const filterKeys = ['platform', 'genre', 'series', 'resource'] as const

const findCategoryLabel = (node: CategoryNode, id: string): string | null => {
  if (node.id === id) {
    return node.label
  }
  if (!node.children) {
    return null
  }
  for (const child of node.children) {
    const result = findCategoryLabel(child, id)
    if (result) {
      return result
    }
  }
  return null
}

const formatFilterLabel = (boardId: string | undefined, key: string, value: string): string => {
  if (boardId === 'game') {
    const label = findCategoryLabel(gameCategories, value)
    if (label) {
      return label
    }
  }
  return value
}

type SearchFormValues = {
  q: string
}

interface BoardPageProps {
  boardId?: string
}

const BoardPage: React.FC<BoardPageProps> = ({ boardId: propBoardId }) => {
  const { boardId: paramBoardId } = useParams<{ boardId: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  const boardId = propBoardId || paramBoardId

  const paramsObject = useMemo(() => {
    const entries: Record<string, string> = {}
    searchParams.forEach((value, key) => {
      entries[key] = value
    })
    return entries
  }, [searchParams])

  const boardsQuery = useBoardsCatalog()
  const boardPostsQuery = useBoardPosts(boardId, paramsObject)

  const posts = boardPostsQuery.data ?? []
  const boards = boardsQuery.data ?? []

  const filteredPosts = useMemo(() => {
    const query = paramsObject.q?.toLowerCase()
    if (!query) {
      return posts
    }

    return posts.filter((post) =>
      post.title.toLowerCase().includes(query) || (post.content ?? '').toLowerCase().includes(query)
    )
  }, [posts, paramsObject])

  const currentBoard = useMemo(
    () => boards.find((candidate) => candidate.id === boardId),
    [boards, boardId]
  )

  const { register, handleSubmit, reset } = useForm<SearchFormValues>({
    defaultValues: { q: paramsObject.q ?? '' }
  })

  useEffect(() => {
    reset({ q: paramsObject.q ?? '' })
  }, [paramsObject.q, reset])

  const onSubmit = handleSubmit(({ q }) => {
    const trimmed = q.trim()
    const nextParams = new URLSearchParams(searchParams)

    if (trimmed) {
      nextParams.set('q', trimmed)
    } else {
      nextParams.delete('q')
    }

    setSearchParams(nextParams)
  })

  const handleClearFilter = (key: string) => {
    const nextParams = new URLSearchParams(searchParams)
    nextParams.delete(key)
    setSearchParams(nextParams)

    if (key === 'q') {
      reset({ q: '' })
    }
  }

  const activeFilters = useMemo(() => {
    const filters: Array<{ key: string; value: string; label: string }> = []
    searchParams.forEach((value, key) => {
      if (key === 'q') {
        return
      }
      filters.push({
        key,
        value,
        label: formatFilterLabel(boardId, key, value)
      })
    })
    return filters
  }, [searchParams, boardId])

  const isLoading = boardsQuery.isLoading || boardPostsQuery.isLoading
  const hasError = boardsQuery.isError || boardPostsQuery.isError
  const queryError = (boardsQuery.error || boardPostsQuery.error) as Error | undefined

  if (!boardId) {
    return <div className="error">유효하지 않은 게시판입니다.</div>
  }

  if (isLoading) {
    return (
      <div className="board-page">
        <div className="board-header">
          <div className="board-header-content">
            <div className="board-title-section">
              <div className="skeleton" style={{ height: '32px', width: '200px', marginBottom: '8px' }}></div>
              <div className="skeleton" style={{ height: '16px', width: '150px' }}></div>
            </div>
            <div className="board-actions">
              <div className="skeleton" style={{ height: '40px', width: '300px' }}></div>
              <div className="skeleton" style={{ height: '40px', width: '100px', marginLeft: '12px' }}></div>
            </div>
          </div>
        </div>
        <div className="posts-list">
          <div className="posts-cards">
            {Array.from({ length: 6 }).map((_, index) => (
              <PostCardSkeleton key={index} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (hasError) {
    return (
      <div className="error">게시판 데이터를 불러오지 못했습니다: {queryError?.message ?? "unknown error"}</div>
    )
  }

  if (!currentBoard) {
    return <div className="error">게시판을 찾을 수 없습니다.</div>
  }

  return (
    <div className="board-page">
      <div className="board-header">
        <div className="board-header-content">
          <div className="board-title-section">
            <h2>{currentBoard.title}</h2>
            <p className="board-subtitle">
              {filteredPosts.length}개의 게시물이 있습니다.
            </p>
          </div>
          <div className="board-actions">
            <form onSubmit={onSubmit} className="search-form">
              <input
                type="text"
                placeholder="게시물을 검색하세요..."
                className="search-input"
                {...register('q')}
              />
              <button type="submit" className="search-btn">검색</button>
            </form>
            <button className="write-btn" onClick={() => navigate(`/board/${boardId}/create`)}>글 작성</button>
          </div>
        </div>

        {activeFilters.length > 0 && (
          <div className="active-filters">
            <span className="active-filters__label">필터</span>
            <div className="active-filters__chips">
              {activeFilters.map((filter) => (
                <button
                  key={`${filter.key}-${filter.value}`}
                  type="button"
                  className="filter-chip"
                  onClick={() => handleClearFilter(filter.key)}
                >
                  {filter.label}
                  <span aria-hidden="true">×</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {boardId === 'news' && (
        <div className="news-features">
          <div className="game-search">
            <h3>게임 데이터베이스 검색</h3>
            <form onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.target as HTMLFormElement)
              const query = formData.get('gameQuery') as string
              if (query) {
                // 게임 검색 API 호출
                console.log('Searching for game:', query)
              }
            }}>
              <input
                type="text"
                name="gameQuery"
                placeholder="게임 이름을 입력하세요..."
                className="game-search-input"
              />
              <button type="submit" className="game-search-btn">검색</button>
            </form>
          </div>
        </div>
      )}

      <div className="posts-list">
        {filteredPosts.length === 0 ? (
          <div className="no-posts">게시물이 없습니다.</div>
        ) : (
          <div className="posts-cards">
            {filteredPosts.map((post, index) => (
              <Link
                key={post.id}
                to={`/board/${boardId}/post/${post.id}`}
                className="post-card card-enter"
              >
                <div className="post-card__header">
                  <h3 className="post-card__title">{post.title}</h3>
                  <div className="post-card__meta">
                    <span className="post-card__author">{post.author || "익명"}</span>
                    <span className="post-card__date">{new Date(post.created_at).toLocaleDateString()}</span>
                    <span className="post-card__views">조회 {post.views}</span>
                  </div>
                </div>
                {post.content && (
                  <div className="post-card__content">
                    {post.content.length > 150
                      ? `${post.content.substring(0, 150)}...`
                      : post.content}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default BoardPage
