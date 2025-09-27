import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { useNewsPosts, useTrendingList, useCommunities, useCommunityBoardPosts } from '../useCommunityData'
import { apiService } from '../../api'

// Mock API service
vi.mock('../../api', () => ({
    apiService: {
        getPosts: vi.fn(),
        getTrending: vi.fn(),
        getCommunities: vi.fn()
    }
}))

// Mock data with correct types
const mockPosts: any[] = [
    { id: '1', board_id: 'news', title: 'Post 1', views: 100, content: 'Content 1', created_at: '2023-01-01', updated_at: '2023-01-01' },
    { id: '2', board_id: 'news', title: 'Post 2', views: 50, content: 'Content 2', created_at: '2023-01-01', updated_at: '2023-01-01' },
    { id: '3', board_id: 'news', title: 'Post 3', views: 200, content: 'Content 3', created_at: '2023-01-01', updated_at: '2023-01-01' }
]

const mockTrendingResponse: any = {
    items: [
        { id: '1', title: 'Trending 1', rank: 2 },
        { id: '2', title: 'Trending 2', rank: 1 },
        { id: '3', title: 'Trending 3', rank: 3 }
    ],
    total: 3,
    periodDays: 7,
    limit: 10
}

const mockCommunities: any[] = [
    {
        id: '1',
        title: 'Community 1',
        boards: [
            {
                id: 'board1',
                title: 'Board 1',
                posts: [
                    { id: '1', board_id: 'board1', title: 'Post 1', views: 100, created_at: '2023-01-01', updated_at: '2023-01-01' },
                    { id: '2', board_id: 'board1', title: 'Post 2', views: 50, created_at: '2023-01-01', updated_at: '2023-01-01' }
                ]
            }
        ]
    }
]

const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
        },
    })

    return ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    )
}

describe('useCommunityData', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('useNewsPosts', () => {
        it('should fetch and sort news posts by views', async () => {
            vi.mocked(apiService.getPosts).mockResolvedValue(mockPosts)

            const { result } = renderHook(() => useNewsPosts(), {
                wrapper: createWrapper()
            })

            expect(result.current.isLoading).toBe(true)

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true)
            })

            expect(apiService.getPosts).toHaveBeenCalledWith('news')
            expect(result.current.data).toEqual([
                { id: '3', board_id: 'news', title: 'Post 3', views: 200, content: 'Content 3', created_at: '2023-01-01', updated_at: '2023-01-01' }, // Highest views first
                { id: '1', board_id: 'news', title: 'Post 1', views: 100, content: 'Content 1', created_at: '2023-01-01', updated_at: '2023-01-01' },
                { id: '2', board_id: 'news', title: 'Post 2', views: 50, content: 'Content 2', created_at: '2023-01-01', updated_at: '2023-01-01' }
            ])
        })

        it('should handle API errors', async () => {
            const error = new Error('API Error')
            vi.mocked(apiService.getPosts).mockRejectedValue(error)

            const { result } = renderHook(() => useNewsPosts(), {
                wrapper: createWrapper()
            })

            await waitFor(() => {
                expect(result.current.isError).toBe(true)
            })

            expect(result.current.error).toBe(error)
        })
    })

    describe('useTrendingList', () => {
        it('should fetch and sort trending items by rank', async () => {
            vi.mocked(apiService.getTrending).mockResolvedValue(mockTrendingResponse)

            const { result } = renderHook(() => useTrendingList(10, 7), {
                wrapper: createWrapper()
            })

            expect(result.current.isLoading).toBe(true)

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true)
            })

            expect(apiService.getTrending).toHaveBeenCalledWith(10, 7)
            expect(result.current.data?.items).toEqual([
                { id: '2', title: 'Trending 2', rank: 1 }, // Lowest rank first (best)
                { id: '1', title: 'Trending 1', rank: 2 },
                { id: '3', title: 'Trending 3', rank: 3 }
            ])
        })

        it('should use default parameters when not provided', async () => {
            vi.mocked(apiService.getTrending).mockResolvedValue(mockTrendingResponse)

            const { result } = renderHook(() => useTrendingList(), {
                wrapper: createWrapper()
            })

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true)
            })

            expect(apiService.getTrending).toHaveBeenCalledWith(10, 7)
        })
    })

    describe('useCommunities', () => {
        it('should fetch and normalize communities', async () => {
            vi.mocked(apiService.getCommunities).mockResolvedValue(mockCommunities)

            const { result } = renderHook(() => useCommunities(), {
                wrapper: createWrapper()
            })

            expect(result.current.isLoading).toBe(true)

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true)
            })

            expect(apiService.getCommunities).toHaveBeenCalled()
            expect(result.current.data).toEqual([
                {
                    id: '1',
                    title: 'Community 1',
                    boards: [
                        {
                            id: 'board1',
                            title: 'Board 1',
                            posts: [
                                { id: '1', board_id: 'board1', title: 'Post 1', views: 100, created_at: '2023-01-01', updated_at: '2023-01-01' }, // Should be sorted by views
                                { id: '2', board_id: 'board1', title: 'Post 2', views: 50, created_at: '2023-01-01', updated_at: '2023-01-01' }
                            ]
                        }
                    ]
                }
            ])
        })

        it('should handle empty communities', async () => {
            vi.mocked(apiService.getCommunities).mockResolvedValue([])

            const { result } = renderHook(() => useCommunities(), {
                wrapper: createWrapper()
            })

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true)
            })

            expect(result.current.data).toEqual([])
        })
    })

    describe('useCommunityBoardPosts', () => {
        const mockBoards: any[] = [
            {
                id: 'board1',
                title: 'Board 1',
                posts: [
                    { id: '1', board_id: 'board1', title: 'Post 1', views: 50, created_at: '2023-01-01', updated_at: '2023-01-01' },
                    { id: '2', board_id: 'board1', title: 'Post 2', views: 100, created_at: '2023-01-01', updated_at: '2023-01-01' }
                ]
            },
            {
                id: 'board2',
                title: 'Board 2',
                posts: []
            }
        ]

        it('should aggregate posts by board ID', async () => {
            vi.mocked(apiService.getPosts).mockResolvedValue([])

            const { result } = renderHook(() => useCommunityBoardPosts(mockBoards), {
                wrapper: createWrapper()
            })

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false)
            })

            expect(result.current.postsByBoardId).toEqual({
                board1: [
                    { id: '2', board_id: 'board1', title: 'Post 2', views: 100, created_at: '2023-01-01', updated_at: '2023-01-01' }, // Sorted by views
                    { id: '1', board_id: 'board1', title: 'Post 1', views: 50, created_at: '2023-01-01', updated_at: '2023-01-01' }
                ],
                board2: []
            })
        })

        it('should handle loading states', () => {
            vi.mocked(apiService.getPosts).mockImplementation(() => new Promise(() => { })) // Never resolves

            const { result } = renderHook(() => useCommunityBoardPosts(mockBoards), {
                wrapper: createWrapper()
            })

            expect(result.current.isLoading).toBe(true)
            expect(result.current.isFetching).toBe(true)
        })

        it('should handle errors', async () => {
            const error = new Error('API Error')
            vi.mocked(apiService.getPosts).mockRejectedValue(error)

            const { result } = renderHook(() => useCommunityBoardPosts(mockBoards), {
                wrapper: createWrapper()
            })

            await waitFor(() => {
                expect(result.current.isError).toBe(true)
            })

            expect(result.current.errors).toContain(error)
        })

        it('should use initial data when available', () => {
            const { result } = renderHook(() => useCommunityBoardPosts(mockBoards), {
                wrapper: createWrapper()
            })

            expect(result.current.postsByBoardId.board1).toEqual([
                { id: '2', board_id: 'board1', title: 'Post 2', views: 100, created_at: '2023-01-01', updated_at: '2023-01-01' },
                { id: '1', board_id: 'board1', title: 'Post 1', views: 50, created_at: '2023-01-01', updated_at: '2023-01-01' }
            ])
        })

        it('should skip queries for empty board IDs', () => {
            const boardsWithEmptyId = [
                { id: '', title: 'Empty Board', posts: [] }
            ]

            const { result } = renderHook(() => useCommunityBoardPosts(boardsWithEmptyId), {
                wrapper: createWrapper()
            })

            expect(result.current.queries[0].isFetching).toBe(false)
        })
    })
})