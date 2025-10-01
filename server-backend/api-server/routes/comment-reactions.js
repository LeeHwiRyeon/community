const express = require('express');
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const CommentReaction = require('../models/CommentReaction');
const Comment = require('../models/Comment');

const router = express.Router();

// 댓글 반응 추가/제거
router.post('/:commentId', async (req, res) => {
    try {
        const { commentId } = req.params;
        const { reactionType, emoji, userId, ipAddress } = req.body;

        if (!reactionType) {
            return res.status(400).json({
                success: false,
                message: 'Reaction type is required'
            });
        }

        // 유효한 반응 타입 확인
        const validReactions = ['like', 'dislike', 'love', 'laugh', 'angry', 'sad', 'wow'];
        if (!validReactions.includes(reactionType)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid reaction type'
            });
        }

        // 댓글 존재 확인
        const comment = await Comment.findOne({
            where: { id: commentId, isDeleted: false }
        });

        if (!comment) {
            return res.status(404).json({
                success: false,
                message: 'Comment not found'
            });
        }

        // 반응 토글
        const result = await CommentReaction.toggleReaction(
            commentId,
            userId,
            reactionType,
            emoji,
            ipAddress || req.ip
        );

        // 댓글의 반응 수 업데이트
        const stats = await CommentReaction.getReactionStats(commentId);
        await comment.update({
            likes: stats.reactions.like || 0,
            dislikes: stats.reactions.dislike || 0
        });

        res.json({
            success: true,
            data: {
                action: result.action,
                reaction: result.reaction,
                stats
            }
        });
    } catch (error) {
        console.error('Error toggling reaction:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to toggle reaction',
            error: error.message
        });
    }
});

// 댓글 반응 통계 조회
router.get('/:commentId/stats', async (req, res) => {
    try {
        const { commentId } = req.params;

        const comment = await Comment.findOne({
            where: { id: commentId, isDeleted: false }
        });

        if (!comment) {
            return res.status(404).json({
                success: false,
                message: 'Comment not found'
            });
        }

        const stats = await CommentReaction.getReactionStats(commentId);

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error fetching reaction stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch reaction stats',
            error: error.message
        });
    }
});

// 사용자 반응 조회
router.get('/:commentId/user-reactions', async (req, res) => {
    try {
        const { commentId } = req.params;
        const { userId, ipAddress } = req.query;

        if (!userId && !ipAddress) {
            return res.status(400).json({
                success: false,
                message: 'Either userId or ipAddress is required'
            });
        }

        const reactions = await CommentReaction.getUserReactions(commentId, userId, ipAddress);

        res.json({
            success: true,
            data: reactions
        });
    } catch (error) {
        console.error('Error fetching user reactions:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user reactions',
            error: error.message
        });
    }
});

// 댓글의 모든 반응 조회
router.get('/:commentId/all', async (req, res) => {
    try {
        const { commentId } = req.params;
        const { page = 1, limit = 20 } = req.query;

        const comment = await Comment.findOne({
            where: { id: commentId, isDeleted: false }
        });

        if (!comment) {
            return res.status(404).json({
                success: false,
                message: 'Comment not found'
            });
        }

        const reactions = await CommentReaction.findAll({
            where: { commentId },
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: (parseInt(page) - 1) * parseInt(limit)
        });

        res.json({
            success: true,
            data: {
                reactions,
                total: reactions.length,
                page: parseInt(page),
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Error fetching all reactions:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch reactions',
            error: error.message
        });
    }
});

// 반응 제거
router.delete('/:commentId/:reactionId', async (req, res) => {
    try {
        const { commentId, reactionId } = req.params;
        const { userId, isAdmin = false } = req.body;

        const reaction = await CommentReaction.findOne({
            where: { id: reactionId, commentId }
        });

        if (!reaction) {
            return res.status(404).json({
                success: false,
                message: 'Reaction not found'
            });
        }

        // 권한 확인
        if (reaction.userId !== userId && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this reaction'
            });
        }

        await reaction.destroy();

        // 댓글의 반응 수 업데이트
        const stats = await CommentReaction.getReactionStats(commentId);
        const comment = await Comment.findByPk(commentId);
        if (comment) {
            await comment.update({
                likes: stats.reactions.like || 0,
                dislikes: stats.reactions.dislike || 0
            });
        }

        res.json({
            success: true,
            message: 'Reaction deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting reaction:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete reaction',
            error: error.message
        });
    }
});

// 인기 반응 조회
router.get('/popular/:commentId', async (req, res) => {
    try {
        const { commentId } = req.params;
        const { limit = 5 } = req.query;

        const popularReactions = await CommentReaction.findAll({
            where: { commentId },
            attributes: [
                'reactionType',
                'emoji',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            group: ['reactionType', 'emoji'],
            order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
            limit: parseInt(limit),
            raw: true
        });

        res.json({
            success: true,
            data: popularReactions
        });
    } catch (error) {
        console.error('Error fetching popular reactions:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch popular reactions',
            error: error.message
        });
    }
});

module.exports = router;

