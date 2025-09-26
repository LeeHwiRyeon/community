import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import React from 'react'
import { render, screen, waitFor, cleanup } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { JSDOM } from 'jsdom'

import SearchPage from '../src/pages/SearchPage'
import { apiService, type SearchResponse } from '../src/api'

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/search?q=test' })
if (!globalThis.window) {
  globalThis.window = dom.window as unknown as typeof globalThis.window
}
if (!globalThis.document) {
  globalThis.document = dom.window.document
}
if (!globalThis.navigator) {
  globalThis.navigator = dom.window.navigator
}
if (!globalThis.HTMLElement) {
  globalThis.HTMLElement = dom.window.HTMLElement
}

const originalSearch = apiService.searchPosts

function withRouter(children: React.ReactNode) {
  return (
    <MemoryRouter initialEntries={['/search?q=test']}>
      <Routes>
        <Route path="/search" element={children} />
      </Routes>
    </MemoryRouter>
  )
}

type Deferred<T> = {
  resolve(value: T): void
  reject(reason?: unknown): void
  promise: Promise<T>
}

const createDeferred = <T,>(): Deferred<T> => {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { resolve, reject, promise }
}

describe('SearchPage', () => {
  beforeEach(() => {
    // Setup if needed
  })

  afterEach(() => {
    cleanup()
    apiService.searchPosts = originalSearch
  })

  it('should show loading state', async () => {
    const deferred = createDeferred<SearchResponse>()
    apiService.searchPosts = async () => deferred.promise

    render(withRouter(<SearchPage />))

    expect(screen.getByText('Loading results...')).toBeInTheDocument()

    deferred.resolve({
      query: 'test',
      count: 1,
      items: [
        {
          id: 'p-1',
          board: 'news',
          title: 'Sample search hit',
          author: 'Tester',
          category: 'news',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]
    })

    await waitFor(() => {
      expect(screen.getByText('1 matching posts')).toBeInTheDocument()
    })
  })

  it('should show error state', async () => {
    apiService.searchPosts = async () => {
      throw new Error('Search failed')
    }

    render(withRouter(<SearchPage />))

    await waitFor(() => {
      expect(screen.getByText('Search failed')).toBeInTheDocument()
    })
  })
})
