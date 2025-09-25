import React, { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { apiService, SearchResultItem } from '../api'

interface SearchState {
  loading: boolean
  error: string | null
  items: SearchResultItem[]
  count: number
}

const initialState: SearchState = {
  loading: false,
  error: null,
  items: [],
  count: 0
}

const SearchPage: React.FC = () => {
  const [params] = useSearchParams()
  const query = params.get('q')?.trim() ?? ''
  const [state, setState] = useState<SearchState>(initialState)

  useEffect(() => {
    if (!query) {
      setState(initialState)
      return
    }

    let cancelled = false
    setState((prev) => ({ ...prev, loading: true, error: null }))

    apiService
      .searchPosts(query, 30)
      .then((response) => {
        if (cancelled) {
          return
        }
        setState({
          loading: false,
          error: null,
          items: response.items ?? [],
          count: response.count ?? response.items?.length ?? 0
        })
      })
      .catch((error) => {
        if (cancelled) {
          return
        }
        setState({ loading: false, error: error instanceof Error ? error.message : 'Unknown error', items: [], count: 0 })
      })

    return () => {
      cancelled = true
    }
  }, [query])

  const hasQuery = query.length > 0
  const hasResults = state.items.length > 0
  const title = useMemo(() => (hasQuery ? `Results for "${query}"` : 'Search'), [hasQuery, query])

  return (
    <section className="search-page">
      <div className="search-page__container">
        <header className="search-page__header">
          <h1>{title}</h1>
          {hasQuery && (
            <p className="search-page__summary">
              {state.loading
                ? 'Loading results...'
                : hasResults
                  ? `${state.count} matching posts`
                  : 'No matching posts yet. Try a different keyword.'}
            </p>
          )}
          {!hasQuery && <p className="search-page__summary">Enter a keyword in the search bar to get started.</p>}
        </header>

        {state.error && <p className="search-page__error">{state.error}</p>}

        {hasResults && (
          <ol className="search-results" aria-live="polite">
            {state.items.map((item) => (
              <li key={item.id} className="search-results__item">
                <Link to={`/board/${item.board}/post/${item.id}`} className="search-results__title">
                  {item.title}
                </Link>
                <div className="search-results__meta">
                  <span>{item.board}</span>
                  {item.author && <span>by {item.author}</span>}
                  <span>{new Date(item.created_at).toLocaleDateString()}</span>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  )
}

export default SearchPage
