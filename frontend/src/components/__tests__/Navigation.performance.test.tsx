import { render, screen } from '@testing-library/react'
import { expect, describe, it, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import Navigation from '../Navigation'
import { vi } from 'vitest'

// Mock the API calls
vi.mock('../services/api', () => ({
    api: {
        getBoards: vi.fn().mockResolvedValue([
            { id: 'news', title: 'News Board', description: 'Description 1', category: 'Category 1' },
            { id: 'free', title: 'Free Board', description: 'Description 2', category: 'Category 2' },
            { id: 'image', title: 'Image Board', description: 'Description 3', category: 'Category 1' }
        ]),
        getCategories: vi.fn().mockResolvedValue([
            { id: 1, name: 'Category 1' },
            { id: 2, name: 'Category 2' }
        ])
    }
}))

describe('Navigation Performance', () => {
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

    it('renders Navigation component within performance budget', async () => {
        const startTime = performance.now()

        render(
            <QueryClientProvider client={queryClient}>
                <BrowserRouter>
                    <Navigation />
                </BrowserRouter>
            </QueryClientProvider>
        )

        // Wait for data to load
        await screen.findByText('News')

        const endTime = performance.now()
        const renderTime = endTime - startTime

        // Performance budget: should render within 120ms
        expect(renderTime).toBeLessThan(120)

        console.log(`Navigation render time: ${renderTime.toFixed(2)}ms`)
    })

    it('re-renders Navigation component efficiently on prop changes', async () => {
        const { rerender } = render(
            <QueryClientProvider client={queryClient}>
                <BrowserRouter>
                    <Navigation />
                </BrowserRouter>
            </QueryClientProvider>
        )

        // Wait for initial render
        await screen.findByText('News')

        const startTime = performance.now()

        // Re-render with same props (simulating state update)
        rerender(
            <QueryClientProvider client={queryClient}>
                <BrowserRouter>
                    <Navigation />
                </BrowserRouter>
            </QueryClientProvider>
        )

        const endTime = performance.now()
        const rerenderTime = endTime - startTime

        // Re-render should be very fast (< 10ms)
        expect(rerenderTime).toBeLessThan(10)

        console.log(`Navigation re-render time: ${rerenderTime.toFixed(2)}ms`)
    })
})