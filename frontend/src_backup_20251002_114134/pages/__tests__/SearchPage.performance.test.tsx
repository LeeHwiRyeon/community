import { render, screen, waitFor } from '@testing-library/react'
import { expect, describe, it, beforeEach, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import SearchPage from '../../pages/SearchPage'

// Mock the API calls
vi.mock('../../api', () => ({
    apiService: {
        searchPosts: vi.fn().mockResolvedValue({
            items: [
                {
                    id: 1,
                    title: 'Test Post 1',
                    content: 'Content 1',
                    author: 'Author 1',
                    created_at: '2024-01-01T00:00:00Z',
                    board: 'test-board',
                    board_title: 'Test Board'
                },
                {
                    id: 2,
                    title: 'Test Post 2',
                    content: 'Content 2',
                    author: 'Author 2',
                    created_at: '2024-01-02T00:00:00Z',
                    board: 'test-board-2',
                    board_title: 'Test Board 2'
                }
            ],
            count: 2
        })
    }
}))

// Mock useSearchParams
const mockSearchParams = vi.fn()

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom')
    return {
        ...actual,
        useSearchParams: () => [mockSearchParams(), vi.fn()]
    }
})

describe('SearchPage Performance', () => {
    let queryClient: QueryClient

    beforeEach(() => {
        queryClient = new QueryClient({
            defaultOptions: {
                queries: {
                    retry: false,
                    staleTime: 0
                }
            }
        })
    })

    it('renders SearchPage component without query within performance budget', async () => {
        // Mock no search params
        mockSearchParams.mockReturnValue({
            get: (key: string) => null
        })

        const startTime = performance.now()

        render(
            <QueryClientProvider client={queryClient}>
                <BrowserRouter>
                    <SearchPage />
                </BrowserRouter>
            </QueryClientProvider>
        )

        // Wait for component to mount
        await screen.findByText('Search')

        const endTime = performance.now()
        const renderTime = endTime - startTime

        // Performance budget: should render within 100ms
        expect(renderTime).toBeLessThan(100)

        console.log(`SearchPage render time (no query): ${renderTime.toFixed(2)}ms`)
    })

    it('renders SearchPage component with search results within performance budget', async () => {
        // Mock search params to return a query
        mockSearchParams.mockReturnValue({
            get: (key: string) => key === 'q' ? 'test' : null
        })

        const startTime = performance.now()

        render(
            <QueryClientProvider client={queryClient}>
                <BrowserRouter>
                    <SearchPage />
                </BrowserRouter>
            </QueryClientProvider>
        )

        // Wait for search results to load
        await waitFor(() => {
            expect(screen.getByText('Test Post 1')).toBeInTheDocument()
        })

        const endTime = performance.now()
        const renderTime = endTime - startTime

        // Performance budget: should render within 200ms (including API call)
        expect(renderTime).toBeLessThan(200)

        console.log(`SearchPage render time (with results): ${renderTime.toFixed(2)}ms`)
    })

    it('re-renders SearchPage efficiently when query changes', async () => {
        // Start with no query
        mockSearchParams.mockReturnValue({
            get: (key: string) => null
        })

        const { rerender } = render(
            <QueryClientProvider client={queryClient}>
                <BrowserRouter>
                    <SearchPage />
                </BrowserRouter>
            </QueryClientProvider>
        )

        // Wait for initial render
        await screen.findByText('Search')

        // Change to search query
        mockSearchParams.mockReturnValue({
            get: (key: string) => key === 'q' ? 'test' : null
        })

        const startTime = performance.now()

        rerender(
            <QueryClientProvider client={queryClient}>
                <BrowserRouter>
                    <SearchPage />
                </BrowserRouter>
            </QueryClientProvider>
        )

        // Wait for results
        await waitFor(() => {
            expect(screen.getByText('Test Post 1')).toBeInTheDocument()
        })

        const endTime = performance.now()
        const rerenderTime = endTime - startTime

        // Re-render should complete within 150ms
        expect(rerenderTime).toBeLessThan(150)

        console.log(`SearchPage re-render time: ${rerenderTime.toFixed(2)}ms`)
    })
})
