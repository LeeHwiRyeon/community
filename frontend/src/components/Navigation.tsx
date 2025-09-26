import React, { useCallback, useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { apiService, Board } from '../api'

const boardLabels: Record<string, string> = {
  news: 'News',
  free: 'Community',
  image: 'Media',
  qna: 'Q&A',
  game: 'Game Talk'
}

const resolveBoardLabel = (board: Board): string => {
  const manual = boardLabels[board.id]
  if (manual) {
    return manual
  }

  if (typeof board.title === 'string' && board.title.trim().length > 0) {
    return board.title.trim()
  }

  if (typeof board.community_title === 'string' && board.community_title.trim().length > 0) {
    return board.community_title.trim()
  }

  return board.id
}

const normalizeOrder = (board: Board): number => {
  if (typeof board.order === 'number') {
    return board.order
  }
  if (typeof board.ordering === 'number') {
    return board.ordering
  }
  if (typeof board.rank === 'number') {
    return board.rank
  }
  return 1000
}

const dedupeBoards = (boards: Board[]): Board[] => {
  const map = new Map<string, Board>()
  boards.forEach((board) => {
    if (!map.has(board.id)) {
      map.set(board.id, board)
    }
  })
  return Array.from(map.values())
}

const Navigation: React.FC = () => {
  const [boards, setBoards] = useState<Board[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const location = useLocation()

  const loadBoards = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await apiService.getBoards()
      const deduped = dedupeBoards(data)
      const sorted = deduped.sort((a, b) => normalizeOrder(a) - normalizeOrder(b))
      setBoards(sorted)
    } catch (err) {
      console.error('Failed to load boards', err)
      setError('Unable to load navigation boards. Please try again.')
      setBoards([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadBoards()
  }, [loadBoards])

  const boardItems = boards.map((board) => ({
    ...board,
    label: resolveBoardLabel(board)
  }))

  const isActivePath = (boardId: string): boolean => {
    if (!boardId) return false
    return location.pathname === `/board/${boardId}` || location.pathname.startsWith(`/board/${boardId}/`)
  }

  const hasBoards = boardItems.length > 0

  return (
    <nav className="subnav" aria-label="Board navigation" aria-busy={loading}>
      <div className="subnav__container">
        <Link to="/" className={`subnav__link${location.pathname === '/' ? ' is-active' : ''}`} aria-current={location.pathname === '/' ? 'page' : undefined}>
          Home
        </Link>
        {error ? (
          <div className="subnav__error" role="alert" aria-live="assertive">
            <span>{error}</span>
            <button type="button" className="subnav__retry" onClick={loadBoards}>
              Retry
            </button>
          </div>
        ) : loading && !hasBoards ? (
          <span className="subnav__loading" role="status" aria-live="polite">
            Loading boards...
          </span>
        ) : hasBoards ? (
          boardItems.map((board) => (
            <Link
              key={board.id}
              to={`/board/${board.id}`}
              className={`subnav__link${isActivePath(board.id) ? ' is-active' : ''}`}
              aria-current={isActivePath(board.id) ? 'page' : undefined}
            >
              {board.label}
            </Link>
          ))
        ) : (
          <span className="subnav__empty" role="status" aria-live="polite">
            No boards available.
          </span>
        )}
      </div>
    </nav>
  )
}

export default Navigation
