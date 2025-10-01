import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { expect, describe, it, beforeEach, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import CommentSection from '../CommentSection'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock react-router-dom useParams
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom')
    return {
        ...actual,
        useParams: () => ({ postId: '123' })
    }
})

describe('CommentSection Integration', () => {
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
        mockFetch.mockClear()
    })

    it('renders CommentSection component with loading state initially', async () => {
        // Mock fetch for comments
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => []
        })

        render(
            <QueryClientProvider client={queryClient}>
                <BrowserRouter>
                    <CommentSection />
                </BrowserRouter>
            </QueryClientProvider>
        )

        // Check for comment form elements
        expect(screen.getByPlaceholderText(/댓글을 입력하세요/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /게시/i })).toBeInTheDocument()
    })

    it('loads and displays comments', async () => {
        const mockComments = [
            {
                id: 1,
                content: '�?번째 ?��??�니??',
                author: 'user1',
                created_at: '2024-01-01T10:00:00Z',
                parent_id: null,
                replies: []
            }
        ]

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockComments
        })

        render(
            <QueryClientProvider client={queryClient}>
                <BrowserRouter>
                    <CommentSection />
                </BrowserRouter>
            </QueryClientProvider>
        )

        await waitFor(() => {
            expect(screen.getByText('�?번째 ?��??�니??')).toBeInTheDocument()
        })

        expect(screen.getByText('user1')).toBeInTheDocument()
    })
})
