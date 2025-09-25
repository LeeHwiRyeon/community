import React, { useEffect, useState, useMemo } from 'react'
import { useParams, Link, useSearchParams } from 'react-router-dom'
import { apiService, Post, Board } from '../api'
import { gameCategories, type CategoryNode } from '../data/categories'

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

const BoardPage: React.FC = () => {
  const { boardId } = useParams<{ boardId: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const [posts, setPosts] = useState<Post[]>([])
  const [boards, setBoards] = useState<Board[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') ?? '')

  const paramsObject = useMemo(() => {
    const entries: Record<string, string> = {}
    searchParams.forEach((value, key) => {
      entries[key] = value
    })
    return entries
  }, [searchParams])

  const currentBoard = boards.find((b) => b.id === boardId)

  useEffect(() => {
    if (!boardId) {
      return
    }

    let isMounted = true

    const fetchData = async () => {
      try {
        setLoading(true)
        const [postsData, boardsData] = await Promise.all([
          apiService.getPosts(boardId, paramsObject),
          apiService.getBoards()
        ])

        if (!isMounted) {
          return
        }

        let filteredPosts = postsData

        const query = paramsObject.q?.toLowerCase()
        if (query) {
          filteredPosts = filteredPosts.filter((post) =>
            post.title.toLowerCase().includes(query) ||
            (post.content ?? '').toLowerCase().includes(query)
          )
        }

        setPosts(filteredPosts)
        setBoards(boardsData)
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      isMounted = false
    }
  }, [boardId, paramsObject])

  useEffect(() => {
    const currentQ = searchParams.get('q') ?? ''
    setSearchQuery(currentQ)
  }, [searchParams])

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = searchQuery.trim()
    const nextParams = new URLSearchParams(searchParams)
    if (trimmed) {
      nextParams.set('q', trimmed)
    } else {
      nextParams.delete('q')
    }
    setSearchParams(nextParams)
  }

  const handleClearFilter = (key: string) => {
    const nextParams = new URLSearchParams(searchParams)
    nextParams.delete(key)
    setSearchParams(nextParams)
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

  if (loading) {
    return <div className="loading">로딩 중...</div>
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
              {posts.length}개의 게시글 · 최신순 정렬
            </p>
          </div>
          <div className="board-actions">
            <form onSubmit={handleSearch} className="search-form">
              <input
                type="text"
                placeholder="게시글을 검색해보세요..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="search-input"
              />
              <button type="submit" className="search-btn">🔍</button>
            </form>
            <button className="write-btn">📝 글쓰기</button>
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
                  <span aria-hidden="true">✕</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="posts-list">
        {posts.length === 0 ? (
          <div className="no-posts">게시글이 없습니다.</div>
        ) : (
          <div className="posts-table">
            <div className="posts-header">
              <div className="col-title">제목</div>
              <div className="col-author">작성자</div>
              <div className="col-date">작성일</div>
              <div className="col-views">조회수</div>
            </div>
            {posts.map((post) => (
              <Link
                key={post.id}
                to={`/board/${boardId}/post/${post.id}`}
                className="post-row"
              >
                <div className="col-title">{post.title}</div>
                <div className="col-author">{post.author || '익명'}</div>
                <div className="col-date">
                  {new Date(post.created_at).toLocaleDateString()}
                </div>
                <div className="col-views">{post.views}</div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default BoardPage
