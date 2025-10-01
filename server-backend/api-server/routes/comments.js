const express = require('express');
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Comment = require('../models/Comment');

const router = express.Router();

// 댓글 목록 조회 (트리 구조)
router.get('/posts/:postId', async (req, res) => {
    try {
        const { postId } = req.params;
        const { page = 1, limit = 50, sort = 'newest' } = req.query;

        const whereClause = {
            postId,
            isDeleted: false
        };

        let orderClause;
        switch (sort) {
            case 'oldest':
                orderClause = [['createdAt', 'ASC']];
                break;
            case 'popular':
                orderClause = [['likes', 'DESC'], ['createdAt', 'ASC']];
                break;
            case 'newest':
            default:
                orderClause = [['createdAt', 'DESC']];
                break;
        }

        const comments = await Comment.findAll({
            where: whereClause,
            order: orderClause,
            limit: parseInt(limit),
            offset: (parseInt(page) - 1) * parseInt(limit)
        });

        // 댓글 트리 구조 생성
        const commentTree = await Comment.buildCommentTree(comments);

        res.json({
            success: true,
            data: {
                comments: commentTree,
                total: comments.length,
                page: parseInt(page),
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch comments',
            error: error.message
        });
    }
});

// 특정 댓글 조회
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const comment = await Comment.findOne({
            where: { id, isDeleted: false },
            include: [{
                model: Comment,
                as: 'replies',
                where: { isDeleted: false },
                required: false,
                order: [['createdAt', 'ASC']]
            }]
        });

        if (!comment) {
            return res.status(404).json({
                success: false,
                message: 'Comment not found'
            });
        }

        res.json({
            success: true,
            data: comment
        });
    } catch (error) {
        console.error('Error fetching comment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch comment',
            error: error.message
        });
    }
});

// 댓글 작성
router.post('/', async (req, res) => {
    try {
        const {
            postId,
            parentId,
            authorId,
            authorName,
            content,
            ipAddress,
            userAgent,
            metadata
        } = req.body;

        if (!postId || !authorId || !authorName || !content) {
            return res.status(400).json({
                success: false,
                message: 'Required fields: postId, authorId, authorName, content'
            });
        }

        const commentId = `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // 댓글 생성
        const comment = await Comment.create({
            id: commentId,
            postId,
            parentId: parentId || null,
            authorId,
            authorName,
            content,
            ipAddress: ipAddress || req.ip,
            userAgent: userAgent || req.get('User-Agent'),
            metadata: metadata || null
        });

        // 댓글 경로 및 깊이 업데이트
        await comment.updatePath();
        await comment.updateDepth();

        // 부모 댓글의 답글 수 업데이트
        if (parentId) {
            await Comment.updateCommentStats(parentId);
        }

        res.status(201).json({
            success: true,
            data: comment
        });
    } catch (error) {
        console.error('Error creating comment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create comment',
            error: error.message
        });
    }
});

// 댓글 수정
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { content, authorId } = req.body;

        if (!content) {
            return res.status(400).json({
                success: false,
                message: 'Content is required'
            });
        }

        const comment = await Comment.findOne({
            where: { id, isDeleted: false }
        });

        if (!comment) {
            return res.status(404).json({
                success: false,
                message: 'Comment not found'
            });
        }

        // 작성자 확인
        if (comment.authorId !== authorId) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to edit this comment'
            });
        }

        await comment.update({
            content,
            isEdited: true,
            editedAt: new Date()
        });

        res.json({
            success: true,
            data: comment
        });
    } catch (error) {
        console.error('Error updating comment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update comment',
            error: error.message
        });
    }
});

// 댓글 삭제 (소프트 삭제)
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { authorId, isAdmin = false } = req.body;

        const comment = await Comment.findOne({
            where: { id, isDeleted: false }
        });

        if (!comment) {
            return res.status(404).json({
                success: false,
                message: 'Comment not found'
            });
        }

        // 작성자 또는 관리자 확인
        if (comment.authorId !== authorId && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this comment'
            });
        }

        await comment.update({
            isDeleted: true,
            deletedAt: new Date(),
            deletedBy: authorId
        });

        // 부모 댓글의 답글 수 업데이트
        if (comment.parentId) {
            await Comment.updateCommentStats(comment.parentId);
        }

        res.json({
            success: true,
            message: 'Comment deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting comment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete comment',
            error: error.message
        });
    }
});

// 댓글 좋아요/싫어요
router.post('/:id/reaction', async (req, res) => {
    try {
        const { id } = req.params;
        const { type, userId } = req.body; // type: 'like' or 'dislike'

        if (!['like', 'dislike'].includes(type)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid reaction type. Must be "like" or "dislike"'
            });
        }

        const comment = await Comment.findOne({
            where: { id, isDeleted: false }
        });

        if (!comment) {
            return res.status(404).json({
                success: false,
                message: 'Comment not found'
            });
        }

        // TODO: 사용자별 반응 기록을 위한 별도 테이블 필요
        // 현재는 단순히 카운트만 증가
        const updateField = type === 'like' ? 'likes' : 'dislikes';
        await comment.increment(updateField);

        res.json({
            success: true,
            message: 'Reaction recorded successfully'
        });
    } catch (error) {
        console.error('Error recording reaction:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to record reaction',
            error: error.message
        });
    }
});

// 댓글 신고
router.post('/:id/report', async (req, res) => {
    try {
        const { id } = req.params;
        const { reason, reporterId, description } = req.body;

        const comment = await Comment.findOne({
            where: { id, isDeleted: false }
        });

        if (!comment) {
            return res.status(404).json({
                success: false,
                message: 'Comment not found'
            });
        }

        // TODO: 신고 테이블에 기록 저장
        console.log(`Comment ${id} reported by ${reporterId}: ${reason} - ${description}`);

        res.json({
            success: true,
            message: 'Report submitted successfully'
        });
    } catch (error) {
        console.error('Error reporting comment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit report',
            error: error.message
        });
    }
});

// 댓글 통계 조회
router.get('/posts/:postId/stats', async (req, res) => {
    try {
        const { postId } = req.params;

        const stats = await Comment.findAll({
            where: { postId, isDeleted: false },
            attributes: [
                [sequelize.fn('COUNT', sequelize.col('id')), 'totalComments'],
                [sequelize.fn('COUNT', sequelize.col('parentId')), 'totalReplies'],
                [sequelize.fn('SUM', sequelize.col('likes')), 'totalLikes'],
                [sequelize.fn('SUM', sequelize.col('dislikes')), 'totalDislikes'],
                [sequelize.fn('MAX', sequelize.col('createdAt')), 'lastCommentAt']
            ],
            raw: true
        });

        res.json({
            success: true,
            data: stats[0] || {
                totalComments: 0,
                totalReplies: 0,
                totalLikes: 0,
                totalDislikes: 0,
                lastCommentAt: null
            }
        });
    } catch (error) {
        console.error('Error fetching comment stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch comment stats',
            error: error.message
        });
    }
});

module.exports = router;

