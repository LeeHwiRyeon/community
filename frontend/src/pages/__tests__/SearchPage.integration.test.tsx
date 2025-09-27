import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import SearchPage from '../SearchPage'
import { apiService } from '../../api'

// Mock API service
vi.mock('../../api', () => ({
    apiService: {
        searchPosts: vi.fn()
    }
}))

// Mock react-router-dom's useSearchParams
const mockSearchParams = vi.fn()
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom')
    return {
        ...actual,
        useSearchParams: () => [mockSearchParams()]
    }
})

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false }
        }
    })

    return (
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                {children}
            </BrowserRouter>
        </QueryClientProvider>
    )
}

describe('SearchPage Integration', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockSearchParams.mockReturnValue(new URLSearchParams())
    })

    describe('Initial state', () => {
        it('should show empty state when no query', () => {
            render(
                <TestWrapper>
                    <SearchPage />
                </TestWrapper>
            )

            expect(screen.getByText('Enter a keyword in the search bar to get started.')).toBeInTheDocument()
        })

        it('should show search prompt', () => {
            render(
                <TestWrapper>
                    <SearchPage />
                </TestWrapper>
            )

            expect(screen.getByText('Search')).toBeInTheDocument()
        })
    })

    describe('Search execution', () => {
        it('should execute search when query parameter exists', async () => {
            const mockResponse = {
                query: 'test',
                items: [
                    {
                        id: '1',
                        title: 'Test Post',
                        content: 'Test content',
                        board_id: 'news',
                        board: 'news',
                        created_at: '2023-01-01',
                        updated_at: '2023-01-01',
                        author: 'testuser'
                    }
                ],
                count: 1
            }

            mockSearchParams.mockReturnValue(new URLSearchParams('q=test'))
            vi.mocked(apiService.searchPosts).mockResolvedValue(mockResponse)

            render(
                <TestWrapper>
                    <SearchPage />
                </TestWrapper>
            )

            await waitFor(() => {
                expect(apiService.searchPosts).toHaveBeenCalledWith('test', 30)
            })

            await waitFor(() => {
                expect(screen.getByText('Test Post')).toBeInTheDocument()
            })
        })

        it('should display loading state during search', async () => {
            let resolveSearch: (value: any) => void
            const searchPromise = new Promise((resolve) => {
                resolveSearch = resolve
            })

            mockSearchParams.mockReturnValue(new URLSearchParams('q=test'))
            vi.mocked(apiService.searchPosts).mockReturnValue(searchPromise as any)

            render(
                <TestWrapper>
                    <SearchPage />
                </TestWrapper>
            )

            expect(screen.getByText('Loading results...')).toBeInTheDocument()

            // Resolve the search
            resolveSearch({
                query: 'test',
                items: [],
                count: 0
            })

            await waitFor(() => {
                expect(screen.queryByText('검색 중...')).not.toBeInTheDocument()
            })
        })

        it('should handle search errors gracefully', async () => {
            mockSearchParams.mockReturnValue(new URLSearchParams('q=test'))
            vi.mocked(apiService.searchPosts).mockRejectedValue(new Error('Search failed'))

            render(
                <TestWrapper>
                    <SearchPage />
                </TestWrapper>
            )

            await waitFor(() => {
                expect(screen.getByText('Search failed')).toBeInTheDocument()
            })
        })

        it('should display search results correctly', async () => {
            const mockResponse = {
                query: 'test',
                items: [
                    {
                        id: '1',
                        title: 'First Post',
                        content: 'Content of first post',
                        board_id: 'news',
                        board: 'news',
                        created_at: '2023-01-01T10:00:00Z',
                        updated_at: '2023-01-01T10:00:00Z',
                        author: 'user1'
                    },
                    {
                        id: '2',
                        title: 'Second Post',
                        content: 'Content of second post',
                        board_id: 'community',
                        board: 'community',
                        created_at: '2023-01-02T10:00:00Z',
                        updated_at: '2023-01-02T10:00:00Z',
                        author: 'user2'
                    }
                ],
                count: 2
            }

            mockSearchParams.mockReturnValue(new URLSearchParams('q=test'))
            vi.mocked(apiService.searchPosts).mockResolvedValue(mockResponse)

            render(
                <TestWrapper>
                    <SearchPage />
                </TestWrapper>
            )

            await waitFor(() => {
                expect(screen.getByText('First Post')).toBeInTheDocument()
                expect(screen.getByText('Second Post')).toBeInTheDocument()
                expect(screen.getByText('2 matching posts')).toBeInTheDocument()
            })
        })

        it('should show no results message when search returns empty', async () => {
            mockSearchParams.mockReturnValue(new URLSearchParams('q=nonexistent'))
            vi.mocked(apiService.searchPosts).mockResolvedValue({
                query: 'nonexistent',
                items: [],
                count: 0
            })

            render(
                <TestWrapper>
                    <SearchPage />
                </TestWrapper>
            )

            await waitFor(() => {
                expect(screen.getByText(/No matching posts yet/)).toBeInTheDocument()
            })
        })
    })

    describe('Query parameter handling', () => {
        it('should handle empty query parameter', () => {
            mockSearchParams.mockReturnValue(new URLSearchParams('q='))

            render(
                <TestWrapper>
                    <SearchPage />
                </TestWrapper>
            )

            expect(screen.getByText('Enter a keyword in the search bar to get started.')).toBeInTheDocument()
            expect(apiService.searchPosts).not.toHaveBeenCalled()
        })

        it('should handle whitespace-only query', () => {
            mockSearchParams.mockReturnValue(new URLSearchParams('q=   '))

            render(
                <TestWrapper>
                    <SearchPage />
                </TestWrapper>
            )

            expect(screen.getByText('Enter a keyword in the search bar to get started.')).toBeInTheDocument()
            expect(apiService.searchPosts).not.toHaveBeenCalled()
        })

        it('should trim whitespace from query', async () => {
            const mockResponse = {
                query: 'test',
                items: [],
                count: 0
            }

            mockSearchParams.mockReturnValue(new URLSearchParams('q=  test  '))
            vi.mocked(apiService.searchPosts).mockResolvedValue(mockResponse)

            render(
                <TestWrapper>
                    <SearchPage />
                </TestWrapper>
            )

            await waitFor(() => {
                expect(apiService.searchPosts).toHaveBeenCalledWith('test', 30)
            })
        })
    })
})