// Mock data for testing Community Hub functionality
export interface MockCommunity {
    id: string;
    title: string;
    description?: string;
    boards: Array<{
        id: string;
        title: string;
        description?: string;
        format?: string;
        ordering?: number;
    }>;
}

export interface MockPost {
    id: string;
    title: string;
    content: string;
    author: string;
    board_id: string;
    created_at: string;
    updated_at: string;
    views: number;
    likes: number;
    comments_count: number;
    thumb?: string;
    preview?: {
        type: 'article' | 'discussion' | 'broadcast' | 'gallery';
    };
}

export const mockCommunities: MockCommunity[] = [
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

export const generateMockPosts = (boardId: string, count: number = 10): MockPost[] => {
    const posts: MockPost[] = [];
    const now = new Date();

    for (let i = 0; i < count; i++) {
        const createdDate = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000);
        const views = Math.floor(Math.random() * 1000) + 10;
        const likes = Math.floor(Math.random() * 100) + 1;
        const comments = Math.floor(Math.random() * 50);

        posts.push({
            id: `${boardId}-post-${i + 1}`,
            title: `Sample Post ${i + 1} for ${boardId}`,
            content: `This is sample content for post ${i + 1}. It contains some interesting information about the topic and provides useful details for users.`,
            author: `User${Math.floor(Math.random() * 1000)}`,
            board_id: boardId,
            created_at: createdDate.toISOString(),
            updated_at: createdDate.toISOString(),
            views: views,
            likes: likes,
            comments_count: comments,
            thumb: i % 3 === 0 ? `https://picsum.photos/300/200?random=${i}` : undefined,
            preview: {
                type: boardId.includes('gallery') ? 'gallery' :
                    boardId.includes('broadcast') ? 'broadcast' :
                        boardId.includes('discussion') ? 'discussion' : 'article'
            }
        });
    }

    return posts;
};

export const mockNewsPosts: MockPost[] = [
    {
        id: 'news-1',
        title: 'Breaking: New Gaming Console Announced',
        content: 'A major gaming company has announced their latest console with revolutionary features...',
        author: 'News Desk',
        board_id: 'news',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        views: 1250,
        likes: 89,
        comments_count: 23,
        thumb: 'https://picsum.photos/400/250?random=news1',
        preview: { type: 'article' }
    },
    {
        id: 'news-2',
        title: 'Cosplay Convention 2024 Details Released',
        content: 'The annual cosplay convention has released its schedule and featured guests...',
        author: 'News Desk',
        board_id: 'news',
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        views: 890,
        likes: 45,
        comments_count: 12,
        thumb: 'https://picsum.photos/400/250?random=news2',
        preview: { type: 'article' }
    },
    {
        id: 'news-3',
        title: 'Live Stream Event This Weekend',
        content: 'Join us for an exciting live stream event featuring top content creators...',
        author: 'News Desk',
        board_id: 'news',
        created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        views: 650,
        likes: 32,
        comments_count: 8,
        thumb: 'https://picsum.photos/400/250?random=news3',
        preview: { type: 'broadcast' }
    }
];

export const mockTrendingPosts = [
    {
        id: 'trending-1',
        title: 'Amazing Cosplay Transformation',
        board: 'cosplay-gallery',
        views: 5000,
        likes: 250,
        rank: 1,
        isRising: true
    },
    {
        id: 'trending-2',
        title: 'Best Gaming Setup 2024',
        board: 'general-gaming',
        views: 4200,
        likes: 180,
        rank: 2,
        isRising: false
    },
    {
        id: 'trending-3',
        title: 'Live Stream Tips for Beginners',
        board: 'live-streams',
        views: 3800,
        likes: 150,
        rank: 3,
        isRising: true
    }
];
