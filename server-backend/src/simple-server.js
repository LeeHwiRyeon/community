import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        message: 'Community Hub API is running'
    });
});

// Mock communities endpoint
app.get('/api/communities', (req, res) => {
    const communities = [
        {
            id: 'gaming',
            title: 'Gaming Community',
            description: 'Discuss your favorite games, share strategies, and connect with fellow gamers',
            boards: [
                { id: 'general-gaming', title: 'General Gaming', format: 'discussion' },
                { id: 'strategy-guides', title: 'Strategy Guides', format: 'article' },
                { id: 'game-reviews', title: 'Game Reviews', format: 'article' }
            ]
        },
        {
            id: 'cosplay',
            title: 'Cosplay Community',
            description: 'Showcase your cosplay creations and connect with other cosplayers',
            boards: [
                { id: 'cosplay-gallery', title: 'Cosplay Gallery', format: 'gallery' },
                { id: 'cosplay-tutorials', title: 'Tutorials & Tips', format: 'article' },
                { id: 'cosplay-events', title: 'Events & Meetups', format: 'discussion' }
            ]
        },
        {
            id: 'broadcast',
            title: 'Broadcast Community',
            description: 'Live streaming and broadcast content',
            boards: [
                { id: 'live-streams', title: 'Live Streams', format: 'broadcast' },
                { id: 'stream-schedule', title: 'Stream Schedule', format: 'broadcast' }
            ]
        },
        {
            id: 'tech',
            title: 'Technology Community',
            description: 'Discuss the latest in technology and programming',
            boards: [
                { id: 'programming', title: 'Programming', format: 'discussion' },
                { id: 'tech-news', title: 'Tech News', format: 'article' }
            ]
        }
    ];

    res.json({ success: true, data: communities });
});

// Mock posts endpoint
app.get('/api/boards/:boardId/posts', (req, res) => {
    const { boardId } = req.params;
    const posts = [];

    for (let i = 1; i <= 10; i++) {
        posts.push({
            id: `${boardId}-post-${i}`,
            title: `Sample Post ${i} for ${boardId}`,
            content: `This is sample content for post ${i}. It contains interesting information about the topic.`,
            author: `User${Math.floor(Math.random() * 1000)}`,
            board_id: boardId,
            created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
            views: Math.floor(Math.random() * 1000) + 10,
            likes: Math.floor(Math.random() * 100) + 1,
            comments_count: Math.floor(Math.random() * 50),
            thumb: i % 3 === 0 ? `https://picsum.photos/300/200?random=${i}` : null
        });
    }

    res.json({ success: true, data: posts });
});

// Mock trending endpoint
app.get('/api/trending', (req, res) => {
    const trending = [
        { id: 'trending-1', title: 'Amazing Cosplay Transformation', board: 'cosplay-gallery', views: 5000, likes: 250, rank: 1, isRising: true },
        { id: 'trending-2', title: 'Best Gaming Setup 2024', board: 'general-gaming', views: 4200, likes: 180, rank: 2, isRising: false },
        { id: 'trending-3', title: 'Live Stream Tips for Beginners', board: 'live-streams', views: 3800, likes: 150, rank: 3, isRising: true }
    ];

    res.json({ success: true, data: { items: trending } });
});

// Mock news endpoint
app.get('/api/news', (req, res) => {
    const news = [
        {
            id: 'news-1',
            title: 'Breaking: New Gaming Console Announced',
            content: 'A major gaming company has announced their latest console with revolutionary features...',
            author: 'News Desk',
            board_id: 'news',
            created_at: new Date().toISOString(),
            views: 1250,
            likes: 89,
            comments_count: 23,
            thumb: 'https://picsum.photos/400/250?random=news1'
        },
        {
            id: 'news-2',
            title: 'Cosplay Convention 2024 Details Released',
            content: 'The annual cosplay convention has released its schedule and featured guests...',
            author: 'News Desk',
            board_id: 'news',
            created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            views: 890,
            likes: 45,
            comments_count: 12,
            thumb: 'https://picsum.photos/400/250?random=news2'
        }
    ];

    res.json({ success: true, data: news });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Community Hub API server running on port ${PORT}`);
    console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
});
