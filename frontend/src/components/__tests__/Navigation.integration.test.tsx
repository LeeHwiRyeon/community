import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Navigation from '../Navigation'
import { apiService } from '../../api'

// Mock API service
vi.mock('../../api', () => ({
    apiService: {
        getBoards: vi.fn()
    }
}))

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

describe('Navigation Integration', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('Initial loading state', () => {
        it('should show loading state initially', () => {
            // Mock API to never resolve (loading state)
            const mockGetBoards = vi.fn().mockImplementation(() => new Promise(() => { }))
            vi.mocked(apiService.getBoards).mockImplementation(mockGetBoards)

            render(
                <TestWrapper>
                    <Navigation />
                </TestWrapper>
            )

            expect(screen.getByRole('navigation', { busy: true })).toBeInTheDocument()
        })

        it('should show home link immediately', () => {
            const mockGetBoards = vi.fn().mockImplementation(() => new Promise(() => { }))
            vi.mocked(apiService.getBoards).mockImplementation(mockGetBoards)

            render(
                <TestWrapper>
                    <Navigation />
                </TestWrapper>
            )

            expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument()
        })
    })

    describe('Successful board loading', () => {
        it('should display boards after successful API call', async () => {
            const mockBoards = [
                {
                    id: 'news',
                    title: 'News Board',
                    order: 1
                },
                {
                    id: 'free',
                    title: 'Community Board',
                    order: 2
                }
            ]

            vi.mocked(apiService.getBoards).mockResolvedValue(mockBoards)

            render(
                <TestWrapper>
                    <Navigation />
                </TestWrapper>
            )

            await waitFor(() => {
                expect(screen.getByRole('link', { name: 'News' })).toBeInTheDocument()
                expect(screen.getByRole('link', { name: 'Community' })).toBeInTheDocument()
            })

            expect(apiService.getBoards).toHaveBeenCalledTimes(1)
        })

        it('should sort boards by ordering', async () => {
            const mockBoards = [
                {
                    id: 'third',
                    title: 'Third Board',
                    order: 3
                },
                {
                    id: 'first',
                    title: 'First Board',
                    order: 1
                },
                {
                    id: 'second',
                    title: 'Second Board',
                    order: 2
                }
            ]

            vi.mocked(apiService.getBoards).mockResolvedValue(mockBoards)

            render(
                <TestWrapper>
                    <Navigation />
                </TestWrapper>
            )

            await waitFor(() => {
                const links = screen.getAllByRole('link')
                const boardLinks = links.filter(link => link.textContent !== 'Home')
                expect(boardLinks).toHaveLength(3)
                expect(boardLinks[0]).toHaveTextContent('First')
                expect(boardLinks[1]).toHaveTextContent('Second')
                expect(boardLinks[2]).toHaveTextContent('Third')
            })
        })

        it('should use manual labels for known boards', async () => {
            const mockBoards = [
                {
                    id: 'news',
                    title: 'Some News Title',
                    order: 1
                },
                {
                    id: 'free',
                    title: 'Some Community Title',
                    order: 2
                }
            ]

            vi.mocked(apiService.getBoards).mockResolvedValue(mockBoards)

            render(
                <TestWrapper>
                    <Navigation />
                </TestWrapper>
            )

            await waitFor(() => {
                expect(screen.getByRole('link', { name: 'News' })).toBeInTheDocument()
                expect(screen.getByRole('link', { name: 'Community' })).toBeInTheDocument()
            })
        })

        it('should deduplicate boards with same id', async () => {
            const mockBoards = [
                {
                    id: 'news',
                    title: 'News Board 1',
                    order: 1
                },
                {
                    id: 'news',
                    title: 'News Board 2',
                    order: 2
                }
            ]

            vi.mocked(apiService.getBoards).mockResolvedValue(mockBoards)

            render(
                <TestWrapper>
                    <Navigation />
                </TestWrapper>
            )

            await waitFor(() => {
                expect(screen.getAllByRole('link', { name: 'News' })).toHaveLength(1)
            })
        })
    })

    describe('Error handling', () => {
        it('should display error message when API fails', async () => {
            vi.mocked(apiService.getBoards).mockRejectedValue(new Error('Network error'))

            render(
                <TestWrapper>
                    <Navigation />
                </TestWrapper>
            )

            await waitFor(() => {
                expect(screen.getByRole('alert')).toHaveTextContent('Unable to load navigation boards. Please try again.')
            })
        })

        it('should not display board links when error occurs', async () => {
            vi.mocked(apiService.getBoards).mockRejectedValue(new Error('Network error'))

            render(
                <TestWrapper>
                    <Navigation />
                </TestWrapper>
            )

            await waitFor(() => {
                expect(screen.queryByRole('link', { name: 'News' })).not.toBeInTheDocument()
                expect(screen.queryByRole('link', { name: 'Community' })).not.toBeInTheDocument()
            })
        })
    })

    describe('Active state handling', () => {
        it('should mark home link as active on home page', async () => {
            const mockBoards = [
                {
                    id: 'news',
                    title: 'News',
                    order: 1
                }
            ]

            vi.mocked(apiService.getBoards).mockResolvedValue(mockBoards)

            render(
                <TestWrapper>
                    <Navigation />
                </TestWrapper>
            )

            await waitFor(() => {
                const homeLink = screen.getByRole('link', { name: 'Home' })
                expect(homeLink).toHaveAttribute('aria-current', 'page')
            })
        })

        it('should mark board link as active when on board page', async () => {
            const mockBoards = [
                {
                    id: 'news',
                    title: 'News',
                    order: 1
                },
                {
                    id: 'free',
                    title: 'Community',
                    order: 2
                }
            ]

            vi.mocked(apiService.getBoards).mockResolvedValue(mockBoards)

            // Mock window.location.pathname
            delete (window as any).location
            window.location = { pathname: '/board/news' } as any

            render(
                <TestWrapper>
                    <Navigation />
                </TestWrapper>
            )

            await waitFor(() => {
                const newsLink = screen.getByRole('link', { name: 'News' })
                expect(newsLink).toHaveClass('is-active')
            })
        })
    })
})