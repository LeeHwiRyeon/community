import React, { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { apiService, Board } from '../api'

const boardLabels: Record<string, string> = {
  news: 'News',
  free: 'Community',
  image: 'Media',
  qna: 'Q&A',
  game: 'Game Talk'
}

const Navigation: React.FC = () => {
  const [boards, setBoards] = useState<Board[]>([])
  const [loading, setLoading] = useState(true)
  const location = useLocation()

  useEffect(() => {
    let isMounted = true

    apiService
      .getBoards()
      .then((data) => {
        if (isMounted) {
          setBoards([...data].sort((a, b) => a.order - b.order))
        }
      })
      .catch((error) => {
        console.error('Failed to load boards', error)
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  const boardItems = boards.map((board) => {
    const sanitizedTitle = board.title.replace(/[^\x20-\x7E]+/g, '').trim()
    return {
      ...board,
      label: boardLabels[board.id] ?? (sanitizedTitle || board.id)
    }
  })

  return (
    <nav className="subnav" aria-label="Board navigation">
      <div className="subnav__container">
        <Link to="/" className={`subnav__link${location.pathname === '/' ? ' is-active' : ''}`}>
          Home
        </Link>
        {loading && boardItems.length === 0 ? (
          <span className="subnav__loading">Loading boards...</span>
        ) : (
          boardItems.map((board) => (
            <Link
              key={board.id}
              to={`/board/${board.id}`}
              className={`subnav__link${location.pathname.includes(board.id) ? ' is-active' : ''}`}
            >
              {board.label}
            </Link>
          ))
        )}
      </div>
    </nav>
  )
}

export default Navigation
