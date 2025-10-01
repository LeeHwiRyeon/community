const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { logger } = require('../utils/logger');
const { sequelize } = require('../config/database');
const { DataTypes } = require('sequelize');

const router = express.Router();

// 게시판 모델 정의
const Board = sequelize.define('Board', {
    id: {
        type: DataTypes.STRING(64),
        primaryKey: true
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

const Post = sequelize.define('Post', {
    id: {
        type: DataTypes.STRING(64),
        primaryKey: true
    },
    board_id: {
        type: DataTypes.STRING(64),
        allowNull: false,
        references: {
            model: Board,
            key: 'id'
        }
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

// 게시판 목록 조회
router.get('/', asyncHandler(async (req, res) => {
    try {
        const boards = await Board.findAll({
            where: { deleted: false },
            order: [['order', 'ASC'], ['createdAt', 'DESC']]
        });

        res.json({
            success: true,
            data: boards
        });
    } catch (error) {
        logger.error('게시판 목록 조회 실패:', error);
        res.status(500).json({
            success: false,
            error: '게시판 목록을 불러올 수 없습니다.'
        });
    }
}));

// 특정 게시판 조회
router.get('/:boardId', asyncHandler(async (req, res) => {
    try {
        const { boardId } = req.params;

        const board = await Board.findOne({
            where: { id: boardId, deleted: false }
        });

        if (!board) {
            return res.status(404).json({
                success: false,
                error: '게시판을 찾을 수 없습니다.'
            });
        }

        res.json({
            success: true,
            data: board
        });
    } catch (error) {
        logger.error('게시판 조회 실패:', error);
        res.status(500).json({
            success: false,
            error: '게시판을 불러올 수 없습니다.'
        });
    }
}));

// 게시판의 게시물 목록 조회
router.get('/:boardId/posts', asyncHandler(async (req, res) => {
    try {
        const { boardId } = req.params;
        const { page = 1, limit = 20, q, category, sort = 'createdAt' } = req.query;

        // 게시판 존재 확인
        const board = await Board.findOne({
            where: { id: boardId, deleted: false }
        });

        if (!board) {
            return res.status(404).json({
                success: false,
                error: '게시판을 찾을 수 없습니다.'
            });
        }

        // 검색 조건 구성
        const whereClause = {
            board_id: boardId,
            deleted: false
        };

        if (q) {
            whereClause[sequelize.Op.or] = [
                { title: { [sequelize.Op.like]: `%${q}%` } },
                { content: { [sequelize.Op.like]: `%${q}%` } }
            ];
        }

        if (category) {
            whereClause.category = category;
        }

        // 정렬 옵션
        let orderClause = [];
        switch (sort) {
            case 'views':
                orderClause = [['views', 'DESC'], ['createdAt', 'DESC']];
                break;
            case 'title':
                orderClause = [['title', 'ASC']];
                break;
            case 'comments':
                orderClause = [['comments_count', 'DESC'], ['createdAt', 'DESC']];
                break;
            default:
                orderClause = [['createdAt', 'DESC']];
        }

        const offset = (parseInt(page) - 1) * parseInt(limit);

        const { count, rows: posts } = await Post.findAndCountAll({
            where: whereClause,
            order: orderClause,
            limit: parseInt(limit),
            offset: offset
        });

        res.json({
            success: true,
            data: {
                posts,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(count / limit),
                    totalItems: count,
                    itemsPerPage: parseInt(limit)
                }
            }
        });
    } catch (error) {
        logger.error('게시물 목록 조회 실패:', error);
        res.status(500).json({
            success: false,
            error: '게시물 목록을 불러올 수 없습니다.'
        });
    }
}));

// 특정 게시물 조회
router.get('/:boardId/posts/:postId', asyncHandler(async (req, res) => {
    try {
        const { boardId, postId } = req.params;

        const post = await Post.findOne({
            where: {
                id: postId,
                board_id: boardId,
                deleted: false
            }
        });

        if (!post) {
            return res.status(404).json({
                success: false,
                error: '게시물을 찾을 수 없습니다.'
            });
        }

        // 조회수 증가
        await post.increment('views');

        res.json({
            success: true,
            data: post
        });
    } catch (error) {
        logger.error('게시물 조회 실패:', error);
        res.status(500).json({
            success: false,
            error: '게시물을 불러올 수 없습니다.'
        });
    }
}));

// 게시물 생성
router.post('/:boardId/posts', asyncHandler(async (req, res) => {
    try {
        const { boardId } = req.params;
        const { title, content, author, author_id, category, thumb, mediaType, stream_url, preview } = req.body;

        // 게시판 존재 확인
        const board = await Board.findOne({
            where: { id: boardId, deleted: false }
        });

        if (!board) {
            return res.status(404).json({
                success: false,
                error: '게시판을 찾을 수 없습니다.'
            });
        }

        const post = await Post.create({
            id: `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            board_id: boardId,
            title,
            content,
            author: author || '익명',
            author_id: author_id || null,
            category,
            thumb,
            mediaType,
            stream_url,
            preview: preview ? JSON.stringify(preview) : null,
            date: new Date().toISOString().split('T')[0]
        });

        res.status(201).json({
            success: true,
            data: post
        });
    } catch (error) {
        logger.error('게시물 생성 실패:', error);
        res.status(500).json({
            success: false,
            error: '게시물 생성에 실패했습니다.'
        });
    }
}));

// 게시물 수정
router.put('/:boardId/posts/:postId', asyncHandler(async (req, res) => {
    try {
        const { boardId, postId } = req.params;
        const { title, content, category, thumb, mediaType, stream_url, preview } = req.body;

        const post = await Post.findOne({
            where: {
                id: postId,
                board_id: boardId,
                deleted: false
            }
        });

        if (!post) {
            return res.status(404).json({
                success: false,
                error: '게시물을 찾을 수 없습니다.'
            });
        }

        await post.update({
            title: title || post.title,
            content: content || post.content,
            category: category || post.category,
            thumb: thumb || post.thumb,
            mediaType: mediaType || post.mediaType,
            stream_url: stream_url || post.stream_url,
            preview: preview ? JSON.stringify(preview) : post.preview
        });

        res.json({
            success: true,
            data: post
        });
    } catch (error) {
        logger.error('게시물 수정 실패:', error);
        res.status(500).json({
            success: false,
            error: '게시물 수정에 실패했습니다.'
        });
    }
}));

// 게시물 삭제
router.delete('/:boardId/posts/:postId', asyncHandler(async (req, res) => {
    try {
        const { boardId, postId } = req.params;

        const post = await Post.findOne({
            where: {
                id: postId,
                board_id: boardId,
                deleted: false
            }
        });

        if (!post) {
            return res.status(404).json({
                success: false,
                error: '게시물을 찾을 수 없습니다.'
            });
        }

        await post.update({ deleted: true });

        res.json({
            success: true,
            message: '게시물이 삭제되었습니다.'
        });
    } catch (error) {
        logger.error('게시물 삭제 실패:', error);
        res.status(500).json({
            success: false,
            error: '게시물 삭제에 실패했습니다.'
        });
    }
}));

// 조회수 증가
router.post('/:boardId/posts/:postId/views', asyncHandler(async (req, res) => {
    try {
        const { boardId, postId } = req.params;

        const post = await Post.findOne({
            where: {
                id: postId,
                board_id: boardId,
                deleted: false
            }
        });

        if (!post) {
            return res.status(404).json({
                success: false,
                error: '게시물을 찾을 수 없습니다.'
            });
        }

        await post.increment('views');

        res.json({
            success: true,
            data: { views: post.views + 1 }
        });
    } catch (error) {
        logger.error('조회수 증가 실패:', error);
        res.status(500).json({
            success: false,
            error: '조회수 증가에 실패했습니다.'
        });
    }
}));

module.exports = router;
