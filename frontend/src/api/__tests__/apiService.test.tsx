import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { apiService } from '../../api'

// Mock fetch globally
const fetchMock = vi.fn()
global.fetch = fetchMock

describe('ApiService', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        fetchMock.mockClear()
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    describe('getBoards', () => {
        it('should fetch boards successfully', async () => {
            const mockBoards = [
                { id: 'news', title: 'News', order: 1 },
                { id: 'community', title: 'Community', order: 2 }
            ]

            fetchMock.mockResolvedValueOnce({
                ok: true,
                text: () => Promise.resolve(JSON.stringify(mockBoards))
            })

            const result = await apiService.getBoards()

            expect(fetchMock).toHaveBeenCalledWith(
                'http://localhost:50001/api/boards',
                expect.objectContaining({
                    headers: { 'Content-Type': 'application/json' },
                    signal: expect.any(AbortSignal)
                })
            )
            expect(result).toEqual(mockBoards)
        })

        it('should return fallback boards when API fails', async () => {
            fetchMock.mockRejectedValueOnce(new Error('Network error'))

            const result = await apiService.getBoards()

            expect(result).toBeDefined()
            expect(Array.isArray(result)).toBe(true)
            expect(result.length).toBeGreaterThan(0)
            expect(result[0]).toHaveProperty('id', 'news')
        })

        it('should return fallback boards when API returns empty array', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: true,
                text: () => Promise.resolve(JSON.stringify([]))
            })

            const result = await apiService.getBoards()

            expect(result).toBeDefined()
            expect(Array.isArray(result)).toBe(true)
            expect(result.length).toBeGreaterThan(0)
        })
    })

    describe('getCommunities', () => {
        it('should fetch communities successfully', async () => {
            const mockCommunities = [
                {
                    id: '1',
                    title: 'Community 1',
                    boards: []
                }
            ]

            fetchMock.mockResolvedValueOnce({
                ok: true,
                text: () => Promise.resolve(JSON.stringify(mockCommunities))
            })

            const result = await apiService.getCommunities()

            expect(fetchMock).toHaveBeenCalledWith(
                'http://localhost:50001/api/communities',
                expect.objectContaining({
                    headers: { 'Content-Type': 'application/json' },
                    signal: expect.any(AbortSignal)
                })
            )
            expect(result).toEqual(mockCommunities)
        })

        it('should return fallback communities when API fails', async () => {
            fetchMock.mockRejectedValueOnce(new Error('Network error'))

            const result = await apiService.getCommunities()

            expect(result).toBeDefined()
            expect(Array.isArray(result)).toBe(true)
            expect(result.length).toBeGreaterThan(0)
            expect(result[0]).toHaveProperty('id', 'global-community')
        })
    })

    describe('getPosts', () => {
        it('should fetch posts successfully', async () => {
            const mockPosts = [
                { id: '1', board_id: 'news', title: 'Post 1', created_at: '2023-01-01', updated_at: '2023-01-01', views: 100 },
                { id: '2', board_id: 'news', title: 'Post 2', created_at: '2023-01-01', updated_at: '2023-01-01', views: 50 }
            ]

            fetchMock.mockResolvedValueOnce({
                ok: true,
                text: () => Promise.resolve(JSON.stringify(mockPosts))
            })

            const result = await apiService.getPosts('news')

            expect(fetchMock).toHaveBeenCalledWith(
                'http://localhost:50001/api/boards/news/posts',
                expect.objectContaining({
                    headers: { 'Content-Type': 'application/json' },
                    signal: expect.any(AbortSignal)
                })
            )
            expect(result).toEqual(mockPosts)
        })

        it('should handle posts wrapped in response object', async () => {
            const mockResponse = {
                posts: [
                    { id: '1', board_id: 'news', title: 'Post 1', created_at: '2023-01-01', updated_at: '2023-01-01', views: 100 }
                ]
            }

            fetchMock.mockResolvedValueOnce({
                ok: true,
                text: () => Promise.resolve(JSON.stringify(mockResponse))
            })

            const result = await apiService.getPosts('news')

            expect(result).toEqual(mockResponse.posts)
        })

        it('should include query parameters when provided', async () => {
            const mockPosts = [{ id: '1', board_id: 'news', title: 'Post 1', created_at: '2023-01-01', updated_at: '2023-01-01', views: 100 }]

            fetchMock.mockResolvedValueOnce({
                ok: true,
                text: () => Promise.resolve(JSON.stringify(mockPosts))
            })

            await apiService.getPosts('news', { limit: '10', offset: '0' })

            expect(fetchMock).toHaveBeenCalledWith(
                'http://localhost:50001/api/boards/news/posts?limit=10&offset=0',
                expect.any(Object)
            )
        })

        it('should return fallback posts when API fails', async () => {
            fetchMock.mockRejectedValueOnce(new Error('Network error'))

            const result = await apiService.getPosts('news')

            expect(result).toBeDefined()
            expect(Array.isArray(result)).toBe(true)
            expect(result.length).toBeGreaterThan(0)
            expect(result[0]).toHaveProperty('board_id', 'news')
        })
    })

    describe('getPost', () => {
        it('should fetch single post successfully', async () => {
            const mockPost = { id: '1', board_id: 'news', title: 'Post 1', created_at: '2023-01-01', updated_at: '2023-01-01', views: 100 }

            fetchMock.mockResolvedValueOnce({
                ok: true,
                text: () => Promise.resolve(JSON.stringify(mockPost))
            })

            const result = await apiService.getPost('1')

            expect(fetchMock).toHaveBeenCalledWith(
                'http://localhost:50001/api/posts/1',
                expect.objectContaining({
                    headers: { 'Content-Type': 'application/json' },
                    signal: expect.any(AbortSignal)
                })
            )
            expect(result).toEqual(mockPost)
        })

        it('should return fallback post when API fails and post exists in fallback data', async () => {
            fetchMock.mockRejectedValueOnce(new Error('Network error'))

            const result = await apiService.getPost('news-fallback-1')

            expect(result).toBeDefined()
            expect(result).toHaveProperty('id', 'news-fallback-1')
            expect(result).toHaveProperty('board_id', 'news')
        })

        it('should throw error when API fails and post not found in fallback data', async () => {
            fetchMock.mockRejectedValueOnce(new Error('Network error'))

            await expect(apiService.getPost('nonexistent')).rejects.toThrow('Post not found')
        })
    })

    describe('searchPosts', () => {
        it('should search posts successfully', async () => {
            const mockResponse = {
                query: 'test',
                count: 2,
                total: 2,
                offset: 0,
                limit: 20,
                items: [
                    { id: '1', board: 'news', title: 'Test Post 1', created_at: '2023-01-01', updated_at: '2023-01-01' },
                    { id: '2', board: 'news', title: 'Test Post 2', created_at: '2023-01-01', updated_at: '2023-01-01' }
                ]
            }

            fetchMock.mockResolvedValueOnce({
                ok: true,
                text: () => Promise.resolve(JSON.stringify(mockResponse))
            })

            const result = await apiService.searchPosts('test')

            expect(fetchMock).toHaveBeenCalledWith(
                'http://localhost:50001/api/search?q=test&limit=20&offset=0',
                expect.any(Object)
            )
            expect(result).toEqual(mockResponse)
        })

        it('should handle search failure gracefully', async () => {
            fetchMock.mockRejectedValueOnce(new Error('Network error'))

            const result = await apiService.searchPosts('test')

            expect(result).toEqual({
                ok: false,
                query: 'test',
                count: 0,
                total: 0,
                offset: 0,
                limit: 20,
                items: []
            })
        })

        it('should use custom limit and offset', async () => {
            const mockResponse = {
                query: 'test',
                count: 1,
                total: 1,
                offset: 10,
                limit: 5,
                items: []
            }

            fetchMock.mockResolvedValueOnce({
                ok: true,
                text: () => Promise.resolve(JSON.stringify(mockResponse))
            })

            await apiService.searchPosts('test', 5, 10)

            expect(fetchMock).toHaveBeenCalledWith(
                'http://localhost:50001/api/search?q=test&limit=5&offset=10',
                expect.any(Object)
            )
        })
    })

    describe('getTrending', () => {
        it('should fetch trending posts successfully', async () => {
            const mockResponse = {
                items: [
                    { id: '1', board: 'news', title: 'Trending 1', rank: 1, isRising: true, created_at: '2023-01-01', updated_at: '2023-01-01', views: 100 }
                ],
                periodDays: 7,
                limit: 10
            }

            fetchMock.mockResolvedValueOnce({
                ok: true,
                text: () => Promise.resolve(JSON.stringify(mockResponse))
            })

            const result = await apiService.getTrending(10, 7)

            expect(fetchMock).toHaveBeenCalledWith(
                'http://localhost:50001/api/trending?limit=10&period=7d',
                expect.any(Object)
            )
            expect(result).toEqual(mockResponse)
        })

        it('should return fallback trending data when API fails', async () => {
            fetchMock.mockRejectedValueOnce(new Error('Network error'))

            const result = await apiService.getTrending(5, 7)

            expect(result).toBeDefined()
            expect(result).toHaveProperty('items')
            expect(result).toHaveProperty('periodDays', 7)
            expect(result).toHaveProperty('limit', 5)
            expect(Array.isArray(result.items)).toBe(true)
            expect(result.items.length).toBeLessThanOrEqual(5)
        })

        it('should use default parameters', async () => {
            const mockResponse = {
                items: [],
                periodDays: 7,
                limit: 5
            }

            fetchMock.mockResolvedValueOnce({
                ok: true,
                text: () => Promise.resolve(JSON.stringify(mockResponse))
            })

            await apiService.getTrending()

            expect(fetchMock).toHaveBeenCalledWith(
                'http://localhost:50001/api/trending?limit=5&period=7d',
                expect.any(Object)
            )
        })
    })

    describe('createPost', () => {
        it('should create post successfully', async () => {
            const newPost = {
                title: 'New Post',
                content: 'Post content'
            }
            const createdPost = {
                id: '3',
                board_id: 'news',
                title: 'New Post',
                content: 'Post content',
                created_at: '2023-01-01',
                updated_at: '2023-01-01',
                views: 0
            }

            fetchMock.mockResolvedValueOnce({
                ok: true,
                text: () => Promise.resolve(JSON.stringify(createdPost))
            })

            const result = await apiService.createPost('news', newPost)

            expect(fetchMock).toHaveBeenCalledWith(
                'http://localhost:50001/api/boards/news/posts',
                expect.objectContaining({
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newPost)
                })
            )
            expect(result).toEqual(createdPost)
        })
    })

    describe('timeout handling', () => {
        it('should timeout after REQUEST_TIMEOUT_MS', async () => {
            // Mock fetch to delay longer than timeout
            fetchMock.mockImplementation(() =>
                new Promise(resolve => setTimeout(() => resolve({
                    ok: true,
                    text: () => Promise.resolve(JSON.stringify([]))
                }), 2000)) // Delay longer than 1500ms timeout
            )

            const startTime = Date.now()

            const result = await apiService.getBoards() // Should fallback due to timeout

            const elapsed = Date.now() - startTime
            // Should have timed out and used fallback
            expect(elapsed).toBeGreaterThan(1400)
            expect(result).toBeDefined()
            expect(Array.isArray(result)).toBe(true)
            expect(result.length).toBeGreaterThan(0)
        })
    })

    describe('error handling', () => {
        it('should handle non-ok responses with fallback', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: false,
                status: 404,
                text: () => Promise.resolve('')
            })

            const result = await apiService.getBoards()

            // Should return fallback data instead of throwing
            expect(result).toBeDefined()
            expect(Array.isArray(result)).toBe(true)
            expect(result.length).toBeGreaterThan(0)
        })

        it('should handle network errors with fallback', async () => {
            fetchMock.mockRejectedValueOnce(new Error('Network failure'))

            const result = await apiService.getBoards()

            // Should return fallback data instead of throwing
            expect(result).toBeDefined()
            expect(Array.isArray(result)).toBe(true)
            expect(result.length).toBeGreaterThan(0)
        })

        it('should handle aborted requests with fallback', async () => {
            // Mock fetch to simulate abort
            fetchMock.mockRejectedValueOnce(new DOMException('The operation was aborted', 'AbortError'))

            const result = await apiService.getBoards()

            // Should return fallback data instead of throwing
            expect(result).toBeDefined()
            expect(Array.isArray(result)).toBe(true)
            expect(result.length).toBeGreaterThan(0)
        })
    })
})
