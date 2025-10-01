const express = require('express');
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { logger } = require('../utils/logger');

const router = express.Router();

// Community 모델 정의
const Community = sequelize.define('Community', {
    id: {
        type: DataTypes.STRING(64),
        primaryKey: true
    },
    title: {
        type: DataTypes.STRING(200),
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    rank: {
        type: DataTypes.INTEGER,
        defaultValue: 1000
    },
    totalViews: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    deleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'communities',
    timestamps: true
});

// Board 모델 정의 (기존과 동일)
const Board = sequelize.define('Board', {
    id: {
        type: DataTypes.STRING(64),
        primaryKey: true
    },
    community_id: {
        type: DataTypes.STRING(64),
        allowNull: true
    },
    title: {
        type: DataTypes.STRING(200),
        allowNull: false
    },
    summary: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    category: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    order: {
        type: DataTypes.INTEGER,
        defaultValue: 1000
    },
    format: {
        type: DataTypes.STRING(50),
        defaultValue: 'discussion'
    },
    preview_format: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    deleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'boards',
    timestamps: true
});

// Post 모델 정의 (기존과 동일)
const Post = sequelize.define('Post', {
    id: {
        type: DataTypes.STRING(64),
        primaryKey: true
    },
    board_id: {
        type: DataTypes.STRING(64),
        allowNull: false
    },
    title: {
        type: DataTypes.STRING(500),
        allowNull: false
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    author: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    author_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    views: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    deleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    category: {
        type: DataTypes.STRING(200),
        allowNull: true
    },
    thumb: {
        type: DataTypes.STRING(500),
        allowNull: true
    },
    mediaType: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    stream_url: {
        type: DataTypes.STRING(500),
        allowNull: true
    },
    comments_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    preview: {
        type: DataTypes.JSON,
        allowNull: true
    }
}, {
    tableName: 'posts',
    timestamps: true
});

// 관계 설정
Community.hasMany(Board, { foreignKey: 'community_id', as: 'boards' });
Board.belongsTo(Community, { foreignKey: 'community_id', as: 'community' });
Board.hasMany(Post, { foreignKey: 'board_id', as: 'posts' });
Post.belongsTo(Board, { foreignKey: 'board_id', as: 'board' });

// 커뮤니티 타입별 설정 함수
function getCommunityTypeConfig(type) {
    const configs = {
        'general': {
            theme: {
                primaryColor: '#3b82f6',
                secondaryColor: '#64748b',
                backgroundColor: '#ffffff',
                textColor: '#1e293b',
                accentColor: '#06b6d4',
                fontFamily: 'Inter, sans-serif',
                borderRadius: '8px',
                shadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            },
            layout: {
                headerStyle: 'detailed',
                sidebarPosition: 'left',
                contentLayout: 'list',
                cardStyle: 'default',
                navigationStyle: 'tabs'
            },
            features: [
                { id: 'recent-posts', name: '최신 게시글', enabled: true, position: 1, config: {} },
                { id: 'popular-posts', name: '인기 게시글', enabled: true, position: 2, config: {} },
                { id: 'categories', name: '카테고리', enabled: true, position: 3, config: {} },
                { id: 'members', name: '멤버', enabled: true, position: 4, config: {} }
            ],
            rules: [
                {
                    id: 'rule-1',
                    title: '기본 규칙',
                    description: '서로를 존중하고 건전한 소통을 유지하세요.',
                    type: 'required',
                    category: 'behavior'
                }
            ],
            topCategories: [
                { name: '일반', count: 100, percentage: 30 },
                { name: '공지사항', count: 50, percentage: 15 },
                { name: '자유게시판', count: 80, percentage: 24 }
            ]
        },
        'tech': {
            theme: {
                primaryColor: '#10b981',
                secondaryColor: '#6b7280',
                backgroundColor: '#f8fafc',
                textColor: '#111827',
                accentColor: '#3b82f6',
                fontFamily: 'JetBrains Mono, monospace',
                borderRadius: '6px',
                shadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
            },
            layout: {
                headerStyle: 'minimal',
                sidebarPosition: 'right',
                contentLayout: 'grid',
                cardStyle: 'detailed',
                navigationStyle: 'sidebar'
            },
            features: [
                { id: 'code-snippets', name: '코드 스니펫', enabled: true, position: 1, config: {} },
                { id: 'tech-news', name: '기술 뉴스', enabled: true, position: 2, config: {} },
                { id: 'tutorials', name: '튜토리얼', enabled: true, position: 3, config: {} },
                { id: 'qna', name: 'Q&A', enabled: true, position: 4, config: {} }
            ],
            rules: [
                {
                    id: 'rule-1',
                    title: '코드 리뷰 가이드라인',
                    description: '코드 리뷰 시 건설적인 피드백을 제공하세요.',
                    type: 'required',
                    category: 'content'
                }
            ],
            topCategories: [
                { name: 'React', count: 1200, percentage: 35 },
                { name: 'JavaScript', count: 800, percentage: 23 },
                { name: 'TypeScript', count: 600, percentage: 17 }
            ]
        },
        'gaming': {
            theme: {
                primaryColor: '#8b5cf6',
                secondaryColor: '#a78bfa',
                backgroundColor: '#0f0f23',
                textColor: '#e2e8f0',
                accentColor: '#f59e0b',
                fontFamily: 'Orbitron, sans-serif',
                borderRadius: '12px',
                shadow: '0 8px 32px rgba(139, 92, 246, 0.3)'
            },
            layout: {
                headerStyle: 'hero',
                sidebarPosition: 'left',
                contentLayout: 'magazine',
                cardStyle: 'detailed',
                navigationStyle: 'floating'
            },
            features: [
                { id: 'game-reviews', name: '게임 리뷰', enabled: true, position: 1, config: {} },
                { id: 'gaming-news', name: '게임 뉴스', enabled: true, position: 2, config: {} },
                { id: 'tournaments', name: '토너먼트', enabled: true, position: 3, config: {} },
                { id: 'guilds', name: '길드', enabled: true, position: 4, config: {} }
            ],
            rules: [
                {
                    id: 'rule-1',
                    title: '게임 관련 콘텐츠만',
                    description: '게임 개발과 관련된 내용만 게시하세요.',
                    type: 'required',
                    category: 'content'
                }
            ],
            topCategories: [
                { name: 'Unity', count: 800, percentage: 38 },
                { name: 'Unreal Engine', count: 500, percentage: 24 },
                { name: 'Game Design', count: 400, percentage: 19 }
            ]
        }
    };

    return configs[type] || configs['general'];
}

// 모든 커뮤니티 조회
router.get('/', async (req, res) => {
    try {
        const { type, search, sortBy = 'name', page = 1, limit = 20 } = req.query;
        console.log('Fetching communities...');

        // 커뮤니티와 관련 게시판, 게시글을 함께 조회
        const communities = await Community.findAll({
            where: { deleted: false },
            include: [{
                model: Board,
                as: 'boards',
                where: { deleted: false },
                required: false,
                include: [{
                    model: Post,
                    as: 'posts',
                    where: { deleted: false },
                    required: false,
                    limit: 5, // 각 게시판당 최대 5개 게시글
                    order: [['created_at', 'DESC']]
                }],
                order: [['order', 'ASC']]
            }],
            order: [['rank', 'ASC']]
        });

        // 각 커뮤니티의 총 조회수 계산
        const communitiesWithStats = await Promise.all(communities.map(async (community) => {
            const totalViews = await Post.sum('views', {
                include: [{
                    model: Board,
                    as: 'board',
                    where: {
                        community_id: community.id,
                        deleted: false
                    }
                }],
                where: { deleted: false }
            });

            // 커뮤니티 타입별 기본 설정 추가
            const communityType = community.category || 'general';
            const typeConfig = getCommunityTypeConfig(communityType);

            return {
                id: community.id,
                name: community.title,
                title: community.title,
                description: community.description,
                type: communityType,
                theme: typeConfig.theme,
                layout: typeConfig.layout,
                features: typeConfig.features,
                rules: typeConfig.rules,
                statistics: {
                    totalMembers: Math.floor(Math.random() * 2000) + 100,
                    activeMembers: Math.floor(Math.random() * 200) + 10,
                    totalPosts: community.boards.reduce((sum, board) => sum + (board.posts?.length || 0), 0),
                    totalComments: Math.floor(Math.random() * 5000) + 100,
                    postsToday: Math.floor(Math.random() * 50) + 1,
                    commentsToday: Math.floor(Math.random() * 200) + 10,
                    topCategories: typeConfig.topCategories || [],
                    memberGrowth: [],
                    activityTrend: []
                },
                createdAt: community.created_at,
                updatedAt: community.updated_at,
                memberCount: Math.floor(Math.random() * 2000) + 100,
                isActive: true,
                rank: community.rank,
                totalViews: totalViews || 0,
                boards: community.boards.map(board => ({
                    id: board.id,
                    title: board.title,
                    summary: board.summary,
                    category: board.category,
                    rank: board.order,
                    ordering: board.order,
                    format: board.format,
                    preview_format: board.preview_format,
                    posts: board.posts || []
                }))
            };
        }));

        // 필터링
        let filteredCommunities = communitiesWithStats;

        if (type && type !== 'all') {
            filteredCommunities = filteredCommunities.filter(community => community.type === type);
        }

        if (search) {
            const searchLower = search.toLowerCase();
            filteredCommunities = filteredCommunities.filter(community =>
                community.name.toLowerCase().includes(searchLower) ||
                community.description.toLowerCase().includes(searchLower)
            );
        }

        // 정렬
        filteredCommunities.sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'members':
                    return b.memberCount - a.memberCount;
                case 'posts':
                    return b.statistics.totalPosts - a.statistics.totalPosts;
                case 'created':
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                default:
                    return 0;
            }
        });

        // 페이지네이션
        const startIndex = (parseInt(page) - 1) * parseInt(limit);
        const endIndex = startIndex + parseInt(limit);
        const paginatedCommunities = filteredCommunities.slice(startIndex, endIndex);

        console.log(`Found ${filteredCommunities.length} communities`);

        res.json({
            success: true,
            data: paginatedCommunities,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(filteredCommunities.length / parseInt(limit)),
                totalItems: filteredCommunities.length,
                itemsPerPage: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Error fetching communities:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch communities',
            error: error.message
        });
    }
});

// 특정 커뮤니티 조회
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const community = await Community.findOne({
            where: { id, deleted: false },
            include: [{
                model: Board,
                as: 'boards',
                where: { deleted: false },
                required: false,
                include: [{
                    model: Post,
                    as: 'posts',
                    where: { deleted: false },
                    required: false,
                    limit: 10,
                    order: [['created_at', 'DESC']]
                }],
                order: [['order', 'ASC']]
            }]
        });

        if (!community) {
            return res.status(404).json({
                success: false,
                message: 'Community not found'
            });
        }

        // 총 조회수 계산
        const totalViews = await Post.sum('views', {
            include: [{
                model: Board,
                as: 'board',
                where: {
                    community_id: community.id,
                    deleted: false
                }
            }],
            where: { deleted: false }
        });

        const communityData = {
            id: community.id,
            title: community.title,
            description: community.description,
            rank: community.rank,
            totalViews: totalViews || 0,
            boards: community.boards.map(board => ({
                id: board.id,
                title: board.title,
                summary: board.summary,
                category: board.category,
                rank: board.order,
                ordering: board.order,
                format: board.format,
                preview_format: board.preview_format,
                posts: board.posts || []
            }))
        };

        res.json({
            success: true,
            data: communityData
        });
    } catch (error) {
        console.error('Error fetching community:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch community',
            error: error.message
        });
    }
});

// 커뮤니티 생성
router.post('/', async (req, res) => {
    try {
        const { title, description, rank } = req.body;

        if (!title) {
            return res.status(400).json({
                success: false,
                message: 'Title is required'
            });
        }

        const community = await Community.create({
            id: `community_${Date.now()}`,
            title,
            description,
            rank: rank || 1000
        });

        res.status(201).json({
            success: true,
            data: community
        });
    } catch (error) {
        console.error('Error creating community:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create community',
            error: error.message
        });
    }
});

// 커뮤니티 수정
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, rank } = req.body;

        const community = await Community.findOne({
            where: { id, deleted: false }
        });

        if (!community) {
            return res.status(404).json({
                success: false,
                message: 'Community not found'
            });
        }

        await community.update({
            title: title || community.title,
            description: description !== undefined ? description : community.description,
            rank: rank !== undefined ? rank : community.rank
        });

        res.json({
            success: true,
            data: community
        });
    } catch (error) {
        console.error('Error updating community:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update community',
            error: error.message
        });
    }
});

// 커뮤니티 삭제 (소프트 삭제)
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const community = await Community.findOne({
            where: { id, deleted: false }
        });

        if (!community) {
            return res.status(404).json({
                success: false,
                message: 'Community not found'
            });
        }

        await community.update({ deleted: true });

        res.json({
            success: true,
            message: 'Community deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting community:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete community',
            error: error.message
        });
    }
});

module.exports = router;
