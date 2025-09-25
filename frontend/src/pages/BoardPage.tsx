import React, { useEffect, useMemo } from 'react'
import { useParams, Link, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import type { Post, Board } from '../api'
import { useBoardPosts, useBoardsCatalog } from '../hooks/useBoardData'
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

type SearchFormValues = {
  q: string
}

const BoardPage: React.FC = () => {
  const { boardId } = useParams<{ boardId: string }>()
  const [searchParams, setSearchParams] = useSearchParams()

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
    return <div className="error">��ȿ���� ���� �Խ����Դϴ�.</div>
  }

  if (isLoading) {
    return <div className="loading">�ε� ��...</div>
  }

  if (hasError) {
    return (
      <div className="error">�����͸� �ҷ����� ���߽��ϴ�: {queryError?.message ?? 'unknown error'}</div>
    )
  }

  if (!currentBoard) {
    return <div className="error">�Խ����� ã�� �� �����ϴ�.</div>
  }

  return (
    <div className="board-page">
      <div className="board-header">
        <div className="board-header-content">
          <div className="board-title-section">
            <h2>{currentBoard.title}</h2>
            <p className="board-subtitle">
              {filteredPosts.length}���� �Խñ��� �ֽ��ϴ�.
            </p>
          </div>
          <div className="board-actions">
            <form onSubmit={onSubmit} className="search-form">
              <input
                type="text"
                placeholder="�Խñ��� �˻��غ�����..."
                className="search-input"
                {...register('q')}
              />
              <button type="submit" className="search-btn">�˻�</button>
            </form>
            <button className="write-btn">�� �ۼ�</button>
          </div>
        </div>

        {activeFilters.length > 0 && (
          <div className="active-filters">
            <span className="active-filters__label">����</span>
            <div className="active-filters__chips">
              {activeFilters.map((filter) => (
                <button
                  key={`${filter.key}-${filter.value}`}
                  type="button"
                  className="filter-chip"
                  onClick={() => handleClearFilter(filter.key)}
                >
                  {filter.label}
                  <span aria-hidden="true">��</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="posts-list">
        {filteredPosts.length === 0 ? (
          <div className="no-posts">�Խù��� �����ϴ�.</div>
        ) : (
          <div className="posts-table">
            <div className="posts-header">
              <div className="col-title">����</div>
              <div className="col-author">�ۼ���</div>
              <div className="col-date">�ۼ���</div>
              <div className="col-views">��ȸ��</div>
            </div>
            {filteredPosts.map((post) => (
              <Link
                key={post.id}
                to={`/board/${boardId}/post/${post.id}`}
                className="post-row"
              >
                <div className="col-title">{post.title}</div>
                <div className="col-author">{post.author || '�͸�'}</div>
                <div className="col-date">{new Date(post.created_at).toLocaleDateString()}</div>
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
