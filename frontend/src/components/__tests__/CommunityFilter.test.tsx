import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import { vi } from 'vitest';
import CommunityFilter from '../CommunityFilter';

// Mock communities data
const mockCommunities = [
    {
        id: 'gaming',
        title: 'Gaming Community',
        description: 'Discuss your favorite games',
        boards: []
    },
    {
        id: 'cosplay',
        title: 'Cosplay Community',
        description: 'Showcase your cosplay creations',
        boards: []
    }
];

// Mock posts data
const mockPosts = [
    {
        id: 'post-1',
        title: 'Gaming Strategy Guide',
        content: 'Learn advanced gaming strategies',
        author: 'Gamer123',
        board_id: 'gaming',
        created_at: '2024-01-01T00:00:00Z',
        views: 100,
        likes: 10,
        comments_count: 5
    },
    {
        id: 'post-2',
        title: 'Cosplay Tutorial',
        content: 'Step-by-step cosplay guide',
        author: 'Cosplayer456',
        board_id: 'cosplay',
        created_at: '2024-01-02T00:00:00Z',
        views: 200,
        likes: 20,
        comments_count: 8
    }
];

const renderWithChakra = (component: React.ReactElement) => {
    return render(
        <ChakraProvider>
            {component}
        </ChakraProvider>
    );
};

describe('CommunityFilter', () => {
    const defaultProps = {
        communities: mockCommunities,
        selectedCommunityId: 'gaming',
        onCommunitySelect: vi.fn(),
        posts: mockPosts,
        onFilteredPostsChange: vi.fn()
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Rendering', () => {
        it('should render community selection dropdown', () => {
            renderWithChakra(<CommunityFilter {...defaultProps} />);

            expect(screen.getByText('Community Selection')).toBeInTheDocument();
            expect(screen.getByDisplayValue('Gaming Community')).toBeInTheDocument();
        });

        it('should render search input', () => {
            renderWithChakra(<CommunityFilter {...defaultProps} />);

            expect(screen.getByPlaceholderText(/Search posts by title, content, or author/)).toBeInTheDocument();
        });

        it('should render sort options', () => {
            renderWithChakra(<CommunityFilter {...defaultProps} />);

            expect(screen.getByText('Sort by:')).toBeInTheDocument();
            expect(screen.getByDisplayValue('Most Recent')).toBeInTheDocument();
        });

        it('should show filter results summary', () => {
            renderWithChakra(<CommunityFilter {...defaultProps} />);

            expect(screen.getByText('2 posts')).toBeInTheDocument();
        });
    });

    describe('Community Selection', () => {
        it('should call onCommunitySelect when community changes', () => {
            const onCommunitySelect = vi.fn();
            renderWithChakra(
                <CommunityFilter {...defaultProps} onCommunitySelect={onCommunitySelect} />
            );

            const select = screen.getByDisplayValue('Gaming Community');
            fireEvent.change(select, { target: { value: 'cosplay' } });

            expect(onCommunitySelect).toHaveBeenCalledWith('cosplay');
        });

        it('should show selected community description', () => {
            renderWithChakra(<CommunityFilter {...defaultProps} />);

            expect(screen.getByText('Discuss your favorite games')).toBeInTheDocument();
        });
    });

    describe('Search Functionality', () => {
        it('should filter posts by title', async () => {
            const onFilteredPostsChange = vi.fn();
            renderWithChakra(
                <CommunityFilter {...defaultProps} onFilteredPostsChange={onFilteredPostsChange} />
            );

            const searchInput = screen.getByPlaceholderText(/Search posts by title, content, or author/);
            fireEvent.change(searchInput, { target: { value: 'Gaming' } });

            await waitFor(() => {
                expect(onFilteredPostsChange).toHaveBeenCalled();
            });
        });

        it('should filter posts by content', async () => {
            const onFilteredPostsChange = vi.fn();
            renderWithChakra(
                <CommunityFilter {...defaultProps} onFilteredPostsChange={onFilteredPostsChange} />
            );

            const searchInput = screen.getByPlaceholderText(/Search posts by title, content, or author/);
            fireEvent.change(searchInput, { target: { value: 'strategy' } });

            await waitFor(() => {
                expect(onFilteredPostsChange).toHaveBeenCalled();
            });
        });

        it('should filter posts by author', async () => {
            const onFilteredPostsChange = vi.fn();
            renderWithChakra(
                <CommunityFilter {...defaultProps} onFilteredPostsChange={onFilteredPostsChange} />
            );

            const searchInput = screen.getByPlaceholderText(/Search posts by title, content, or author/);
            fireEvent.change(searchInput, { target: { value: 'Gamer123' } });

            await waitFor(() => {
                expect(onFilteredPostsChange).toHaveBeenCalled();
            });
        });

        it('should clear search when clear button is clicked', () => {
            renderWithChakra(<CommunityFilter {...defaultProps} />);

            const searchInput = screen.getByPlaceholderText(/Search posts by title, content, or author/);
            fireEvent.change(searchInput, { target: { value: 'test' } });

            const clearButton = screen.getByLabelText('Clear search');
            fireEvent.click(clearButton);

            expect(searchInput).toHaveValue('');
        });
    });

    describe('Sorting Functionality', () => {
        it('should sort by most recent', async () => {
            const onFilteredPostsChange = vi.fn();
            renderWithChakra(
                <CommunityFilter {...defaultProps} onFilteredPostsChange={onFilteredPostsChange} />
            );

            const sortSelect = screen.getByDisplayValue('Most Recent');
            fireEvent.change(sortSelect, { target: { value: 'recent' } });

            await waitFor(() => {
                expect(onFilteredPostsChange).toHaveBeenCalled();
            });
        });

        it('should sort by most popular', async () => {
            const onFilteredPostsChange = vi.fn();
            renderWithChakra(
                <CommunityFilter {...defaultProps} onFilteredPostsChange={onFilteredPostsChange} />
            );

            const sortSelect = screen.getByDisplayValue('Most Recent');
            fireEvent.change(sortSelect, { target: { value: 'popular' } });

            await waitFor(() => {
                expect(onFilteredPostsChange).toHaveBeenCalled();
            });
        });

        it('should sort by most views', async () => {
            const onFilteredPostsChange = vi.fn();
            renderWithChakra(
                <CommunityFilter {...defaultProps} onFilteredPostsChange={onFilteredPostsChange} />
            );

            const sortSelect = screen.getByDisplayValue('Most Recent');
            fireEvent.change(sortSelect, { target: { value: 'views' } });

            await waitFor(() => {
                expect(onFilteredPostsChange).toHaveBeenCalled();
            });
        });
    });

    describe('Filter Results Display', () => {
        it('should show total post count', () => {
            renderWithChakra(<CommunityFilter {...defaultProps} />);

            expect(screen.getByText('2 posts')).toBeInTheDocument();
        });

        it('should show filtered count when searching', async () => {
            renderWithChakra(<CommunityFilter {...defaultProps} />);

            const searchInput = screen.getByPlaceholderText(/Search posts by title, content, or author/);
            fireEvent.change(searchInput, { target: { value: 'Gaming' } });

            await waitFor(() => {
                expect(screen.getByText(/Showing \d+ of 2 posts/)).toBeInTheDocument();
            });
        });

        it('should show search query in badge', async () => {
            renderWithChakra(<CommunityFilter {...defaultProps} />);

            const searchInput = screen.getByPlaceholderText(/Search posts by title, content, or author/);
            fireEvent.change(searchInput, { target: { value: 'test query' } });

            await waitFor(() => {
                expect(screen.getByText('Filtered by: "test query"')).toBeInTheDocument();
            });
        });

        it('should show sort method in badge', () => {
            renderWithChakra(<CommunityFilter {...defaultProps} />);

            expect(screen.getByText('Sorted by: Recent')).toBeInTheDocument();
        });
    });

    describe('Accessibility', () => {
        it('should have proper form labels', () => {
            renderWithChakra(<CommunityFilter {...defaultProps} />);

            expect(screen.getByPlaceholderText(/Search posts by title, content, or author/)).toBeInTheDocument();
            expect(screen.getByText('Sort by:')).toBeInTheDocument();
        });

        it('should be keyboard navigable', () => {
            renderWithChakra(<CommunityFilter {...defaultProps} />);

            const searchInput = screen.getByPlaceholderText(/Search posts by title, content, or author/);
            searchInput.focus();
            expect(searchInput).toHaveFocus();
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty posts array', () => {
            renderWithChakra(
                <CommunityFilter {...defaultProps} posts={[]} />
            );

            expect(screen.getByText('0 posts')).toBeInTheDocument();
        });

        it('should handle undefined posts', () => {
            renderWithChakra(
                <CommunityFilter {...defaultProps} posts={undefined as any} />
            );

            expect(screen.getByText('0 posts')).toBeInTheDocument();
        });

        it('should handle empty search query', async () => {
            const onFilteredPostsChange = vi.fn();
            renderWithChakra(
                <CommunityFilter {...defaultProps} onFilteredPostsChange={onFilteredPostsChange} />
            );

            const searchInput = screen.getByPlaceholderText(/Search posts by title, content, or author/);
            fireEvent.change(searchInput, { target: { value: '' } });

            await waitFor(() => {
                expect(onFilteredPostsChange).toHaveBeenCalled();
            });
        });
    });
});
