import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { ContentTester } from '../ContentTester'
import { apiService } from '../../api'

// Mock the apiService
vi.mock('../../api', () => ({
    apiService: {
        getBoards: vi.fn(),
        getPost: vi.fn(),
        searchPosts: vi.fn(),
        getCommunities: vi.fn()
    }
}))

describe('ContentTester Integration', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    afterEach(() => {
        vi.clearAllTimers()
    })

    describe('Component Rendering', () => {
        it('should render ContentTester component', () => {
            render(<ContentTester />)

            expect(screen.getByText('콘텐츠 테스터')).toBeInTheDocument()
            expect(screen.getByText('콘텐츠 테스트 실행')).toBeInTheDocument()
        })

        it('should show initial empty state', () => {
            render(<ContentTester />)

            expect(screen.getByText('테스트를 실행하려면 위 버튼을 클릭하세요')).toBeInTheDocument()
        })
    })

    describe('Test Execution', () => {
        it('should execute all content tests when button is clicked', async () => {
            const user = userEvent.setup()

            // Mock successful API responses
            vi.mocked(apiService.getBoards).mockResolvedValue([
                { id: 'news', title: 'News', order: 1, category: 'news' },
                { id: 'community', title: 'Community', order: 2, category: 'community' }
            ])
            vi.mocked(apiService.getPost).mockResolvedValue({
                id: 'news-fallback-1',
                board_id: 'news',
                title: 'Test News Post',
                content: 'Test content',
                created_at: '2023-01-01',
                updated_at: '2023-01-01',
                views: 100
            })
            vi.mocked(apiService.searchPosts).mockResolvedValue({
                query: 'test',
                count: 2,
                total: 2,
                offset: 0,
                limit: 20,
                items: [
                    { id: '1', board: 'news', title: 'Test Post 1', created_at: '2023-01-01', updated_at: '2023-01-01' },
                    { id: '2', board: 'news', title: 'Test Post 2', created_at: '2023-01-01', updated_at: '2023-01-01' }
                ]
            })
            vi.mocked(apiService.getCommunities).mockResolvedValue([
                { id: 'global-community', title: 'Global Community', boards: [] }
            ])

            render(<ContentTester />)

            const runButton = screen.getByText('콘텐츠 테스트 실행')
            await user.click(runButton)

            // Wait for all tests to complete
            await waitFor(() => {
                expect(screen.getByText('2 boards loaded')).toBeInTheDocument()
                expect(screen.getByText('News post "Test News Post" loaded')).toBeInTheDocument()
                expect(screen.getByText('2 search results found')).toBeInTheDocument()
                expect(screen.getByText('1 communities loaded')).toBeInTheDocument()
            })

            // Verify API calls were made
            expect(apiService.getBoards).toHaveBeenCalledTimes(1)
            expect(apiService.getPost).toHaveBeenCalledWith('news-fallback-1')
            expect(apiService.searchPosts).toHaveBeenCalledWith('test')
            expect(apiService.getCommunities).toHaveBeenCalledTimes(1)
        })

        it('should display successful test results', async () => {
            const user = userEvent.setup()

            // Mock successful API responses
            vi.mocked(apiService.getBoards).mockResolvedValue([
                { id: 'news', title: 'News', order: 1, category: 'news' }
            ])
            vi.mocked(apiService.getPost).mockResolvedValue({
                id: 'news-fallback-1',
                board_id: 'news',
                title: 'Test News Post',
                content: 'Test content',
                created_at: '2023-01-01',
                updated_at: '2023-01-01',
                views: 100
            })
            vi.mocked(apiService.searchPosts).mockResolvedValue({
                query: 'test',
                count: 1,
                total: 1,
                offset: 0,
                limit: 20,
                items: [{ id: '1', board: 'news', title: 'Test Post 1', created_at: '2023-01-01', updated_at: '2023-01-01' }]
            })
            vi.mocked(apiService.getCommunities).mockResolvedValue([
                { id: 'global-community', title: 'Global Community', boards: [] }
            ])

            render(<ContentTester />)

            await user.click(screen.getByText('콘텐츠 테스트 실행'))

            await waitFor(() => {
                // Check for success indicators
                expect(screen.getByText('1 boards loaded')).toBeInTheDocument()
                expect(screen.getByText('News post "Test News Post" loaded')).toBeInTheDocument()
                expect(screen.getByText('1 search results found')).toBeInTheDocument()
                expect(screen.getByText('1 communities loaded')).toBeInTheDocument()
            })
        })

        it('should handle API errors gracefully', async () => {
            const user = userEvent.setup()

            // Mock API failures
            vi.mocked(apiService.getBoards).mockRejectedValue(new Error('Network error'))
            vi.mocked(apiService.getPost).mockRejectedValue(new Error('Post not found'))
            vi.mocked(apiService.searchPosts).mockRejectedValue(new Error('Search failed'))
            vi.mocked(apiService.getCommunities).mockRejectedValue(new Error('Communities error'))

            render(<ContentTester />)

            await user.click(screen.getByText('콘텐츠 테스트 실행'))

            await waitFor(() => {
                // Check for error messages
                expect(screen.getByText('Failed to load boards: Error: Network error')).toBeInTheDocument()
                expect(screen.getByText('Failed to load news post: Error: Post not found')).toBeInTheDocument()
                expect(screen.getByText('Search failed: Error: Search failed')).toBeInTheDocument()
                expect(screen.getByText('Communities loading failed: Error: Communities error')).toBeInTheDocument()
            })
        })

        it('should handle mixed success and failure results', async () => {
            const user = userEvent.setup()

            // Mock mixed responses
            vi.mocked(apiService.getBoards).mockResolvedValue([
                { id: 'news', title: 'News', order: 1, category: 'news' }
            ])
            vi.mocked(apiService.getPost).mockRejectedValue(new Error('Post not found'))
            vi.mocked(apiService.searchPosts).mockResolvedValue({
                query: 'test',
                count: 0,
                total: 0,
                offset: 0,
                limit: 20,
                items: []
            })
            vi.mocked(apiService.getCommunities).mockRejectedValue(new Error('Communities error'))

            render(<ContentTester />)

            await user.click(screen.getByText('콘텐츠 테스트 실행'))

            await waitFor(() => {
                // Check for mixed results
                expect(screen.getByText('1 boards loaded')).toBeInTheDocument()
                expect(screen.getByText('Failed to load news post: Error: Post not found')).toBeInTheDocument()
                expect(screen.getByText('0 search results found')).toBeInTheDocument()
                expect(screen.getByText('Communities loading failed: Error: Communities error')).toBeInTheDocument()
            })
        })

        it('should disable button while tests are running', async () => {
            const user = userEvent.setup()

            // Mock slow API responses
            vi.mocked(apiService.getBoards).mockImplementation(() => new Promise(resolve => setTimeout(() => resolve([]), 100)))
            vi.mocked(apiService.getPost).mockResolvedValue({} as any)
            vi.mocked(apiService.searchPosts).mockResolvedValue({} as any)
            vi.mocked(apiService.getCommunities).mockResolvedValue([])

            render(<ContentTester />)

            const runButton = screen.getByText('콘텐츠 테스트 실행')
            await user.click(runButton)

            // Button should be disabled during execution
            expect(runButton).toBeDisabled()
            expect(screen.getByText('테스트 실행 중...')).toBeInTheDocument()

            // Wait for completion
            await waitFor(() => {
                expect(runButton).not.toBeDisabled()
                expect(screen.queryByText('?�스???�행 �?..')).not.toBeInTheDocument()
            })
        })

        it('should clear previous results when running tests again', async () => {
            const user = userEvent.setup()

            // First run with success
            vi.mocked(apiService.getBoards).mockResolvedValue([{ id: 'news', title: 'News', order: 1, category: 'news' }])
            vi.mocked(apiService.getPost).mockResolvedValue({ id: '1', title: 'Post' } as any)
            vi.mocked(apiService.searchPosts).mockResolvedValue({ items: [] } as any)
            vi.mocked(apiService.getCommunities).mockResolvedValue([])

            render(<ContentTester />)

            await user.click(screen.getByText('콘텐츠 테스트 실행'))

            await waitFor(() => {
                expect(screen.getByText('1 boards loaded')).toBeInTheDocument()
            })

            // Second run with different results
            vi.mocked(apiService.getBoards).mockRejectedValue(new Error('Second run error'))

            await user.click(screen.getByText('콘텐츠 테스트 실행'))

            await waitFor(() => {
                expect(screen.queryByText('1 boards loaded')).not.toBeInTheDocument()
                expect(screen.getByText('Failed to load boards: Error: Second run error')).toBeInTheDocument()
            })
        })
    })

    describe('UI Updates', () => {
        it('should update test results in real-time', async () => {
            const user = userEvent.setup()

            // Mock staggered responses
            vi.mocked(apiService.getBoards).mockImplementation(() =>
                new Promise(resolve => setTimeout(() => resolve([{ id: 'news', title: 'News', order: 1 }]), 50))
            )
            vi.mocked(apiService.getPost).mockImplementation(() =>
                new Promise(resolve => setTimeout(() => resolve({
                    id: '1',
                    board_id: 'news',
                    title: 'Post',
                    created_at: '2023-01-01',
                    updated_at: '2023-01-01',
                    views: 100
                }), 100))
            )
            vi.mocked(apiService.searchPosts).mockResolvedValue({ items: [] } as any)
            vi.mocked(apiService.getCommunities).mockResolvedValue([])

            render(<ContentTester />)

            await user.click(screen.getByText('콘텐츠 테스트 실행'))

            // Check intermediate state
            await waitFor(() => {
                expect(screen.getByText('1 boards loaded')).toBeInTheDocument()
            })

            // Check final state
            await waitFor(() => {
                expect(screen.getByText('News post "Post" loaded')).toBeInTheDocument()
            })
        })
    })
})
