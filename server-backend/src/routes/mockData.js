import express from 'express';
import { authenticateToken } from '../auth/jwt.js';

const router = express.Router();

// Mock communities data
const mockCommunities = [
    {
        id: 'gaming',
        title: 'Gaming Community',
        description: 'Discuss your favorite games, share strategies, and connect with fellow gamers',
        boards: [
            {
                id: 'general-gaming',
                title: 'General Gaming',
                description: 'General gaming discussions',
                format: 'discussion',
                ordering: 1
            },
            {
                id: 'strategy-guides',
                title: 'Strategy Guides',
                description: 'Share and find game strategies',
                format: 'article',
                ordering: 2
            },
            {
                id: 'game-reviews',
                title: 'Game Reviews',
                description: 'Review and rate games',
                format: 'article',
                ordering: 3
            }
        ]
    },
    {
        id: 'cosplay',
        title: 'Cosplay Community',
        description: 'Showcase your cosplay creations and connect with other cosplayers',
        boards: [
            {
                id: 'cosplay-gallery',
                title: 'Cosplay Gallery',
                description: 'Share your cosplay photos',
                format: 'gallery',
                ordering: 1
            },
            {
                id: 'cosplay-tutorials',
                title: 'Tutorials & Tips',
                description: 'Learn cosplay techniques',
                format: 'article',
                ordering: 2
            },
            {
                id: 'cosplay-events',
                title: 'Events & Meetups',
                description: 'Find cosplay events near you',
                format: 'discussion',
                ordering: 3
            }
        ]
    },
    {
        id: 'broadcast',
        title: 'Broadcast Community',
        description: 'Live streaming and broadcast content',
        boards: [
            {
                id: 'live-streams',
                title: 'Live Streams',
                description: 'Currently live streams',
                format: 'broadcast',
                ordering: 1
            },
            {
                id: 'stream-schedule',
                title: 'Stream Schedule',
                description: 'Upcoming stream schedules',
                format: 'broadcast',
                ordering: 2
            }
        ]
    },
    {
        id: 'tech',
        title: 'Technology Community',
        description: 'Discuss the latest in technology and programming',
        boards: [
            {
                id: 'programming',
                title: 'Programming',
                description: 'Coding discussions and help',
                format: 'discussion',
                ordering: 1
            },
            {
                id: 'tech-news',
                title: 'Tech News',
                description: 'Latest technology news',
                format: 'article',
                ordering: 2
            }
        ]
    }
];

// Mock posts data
const generateMockPosts = (boardId, count = 10) => {
    const posts = [];
    const now = new Date();

    for (let i = 0; i < count; i++) {
        const createdDate = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000);
        const views = Math.floor(Math.random() * 1000) + 10;
        const likes = Math.floor(Math.random() * 100) + 1;
        const comments = Math.floor(Math.random() * 50);

        posts.push({
            id: `${boardId}-post-${i + 1}`,
            title: `Sample Post ${i + 1} for ${boardId}`,
            content: `This is sample content for post ${i + 1}. It contains some interesting information about the topic.`,
            author: `User${Math.floor(Math.random() * 1000)}`,
            board_id: boardId,
            created_at: createdDate.toISOString(),
            updated_at: createdDate.toISOString(),
            views: views,
            likes: likes,
            comments_count: comments,
            thumb: i % 3 === 0 ? `https://picsum.photos/300/200?random=${i}` : null,
            preview: {
                type: boardId.includes('gallery') ? 'gallery' :
                    boardId.includes('broadcast') ? 'broadcast' :
                        boardId.includes('discussion') ? 'discussion' : 'article'
            }
        });
    }

    return posts;
};

// Get all communities
router.get('/communities', (req, res) => {
    try {
        res.json({
            success: true,
            data: mockCommunities
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to fetch communities',
                code: 'COMMUNITIES_FETCH_ERROR'
            }
        });
    }
});

// Get posts for a specific community
router.get('/communities/:communityId/posts', (req, res) => {
    try {
        const { communityId } = req.params;
        const community = mockCommunities.find(c => c.id === communityId);

        if (!community) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'Community not found',
                    code: 'COMMUNITY_NOT_FOUND'
                }
            });
        }

        const allPosts = [];
        community.boards.forEach(board => {
            const posts = generateMockPosts(board.id, 5);
            allPosts.push(...posts);
        });

        res.json({
            success: true,
            data: allPosts
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to fetch community posts',
                code: 'COMMUNITY_POSTS_FETCH_ERROR'
            }
        });
    }
});

// Get posts for a specific board
router.get('/boards/:boardId/posts', (req, res) => {
    try {
        const { boardId } = req.params;
        const posts = generateMockPosts(boardId, 10);

        res.json({
            success: true,
            data: posts
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to fetch board posts',
                code: 'BOARD_POSTS_FETCH_ERROR'
            }
        });
    }
});

// Search posts
router.get('/search', (req, res) => {
    try {
        const { q, communityId } = req.query;

        if (!q) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Search query is required',
                    code: 'SEARCH_QUERY_REQUIRED'
                }
            });
        }

        // Generate mock search results
        const searchResults = [];
        const communities = communityId ?
            mockCommunities.filter(c => c.id === communityId) :
            mockCommunities;

        communities.forEach(community => {
            community.boards.forEach(board => {
                const posts = generateMockPosts(board.id, 3);
                posts.forEach(post => {
                    if (post.title.toLowerCase().includes(q.toLowerCase()) ||
                        post.content.toLowerCase().includes(q.toLowerCase())) {
                        searchResults.push({
                            ...post,
                            community: community.title,
                            board: board.title
                        });
                    }
                });
            });
        });

        res.json({
            success: true,
            data: searchResults
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: {
                message: 'Search failed',
                code: 'SEARCH_ERROR'
            }
        });
    }
});

// Get trending posts
router.get('/trending', (req, res) => {
    try {
        const { limit = 10 } = req.query;

        const trendingPosts = [];
        mockCommunities.forEach(community => {
            community.boards.forEach(board => {
                const posts = generateMockPosts(board.id, 2);
                posts.forEach(post => {
                    trendingPosts.push({
                        id: post.id,
                        title: post.title,
                        board: board.id,
                        views: post.views,
                        likes: post.likes,
                        rank: Math.floor(Math.random() * 20) + 1,
                        isRising: Math.random() > 0.5
                    });
                });
            });
        });

        // Sort by views and take top N
        trendingPosts.sort((a, b) => b.views - a.views);
        const topTrending = trendingPosts.slice(0, parseInt(limit));

        res.json({
            success: true,
            data: {
                items: topTrending
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to fetch trending posts',
                code: 'TRENDING_FETCH_ERROR'
            }
        });
    }
});

// Get news posts
router.get('/news', (req, res) => {
    try {
        const newsPosts = generateMockPosts('news', 5);
        newsPosts.forEach(post => {
            post.title = `Breaking News: ${post.title}`;
            post.author = 'News Desk';
            post.board_id = 'news';
        });

        res.json({
            success: true,
            data: newsPosts
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to fetch news posts',
                code: 'NEWS_FETCH_ERROR'
            }
        });
    }
});

export default router;
