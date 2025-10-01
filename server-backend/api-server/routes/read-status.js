const express = require('express');
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const ReadStatus = require('../models/ReadStatus');
const Post = require('../models/Post');

const router = express.Router();

// 읽음 상태 업데이트/생성
router.post('/', async (req, res) => {
    try {
        const {
            postId,
            boardId,
            communityId,
            userId,
            readDuration,
            scrollPosition,
            ipAddress,
            userAgent,
            deviceType
        } = req.body;

        if (!postId || !boardId) {
            return res.status(400).json({
                success: false,
                message: 'postId and boardId are required'
            });
        }

        // 게시물 존재 확인
        const post = await Post.findOne({
            where: { id: postId, deleted: false }
        });

        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Post not found'
            });
        }

        const readStatus = await ReadStatus.updateReadStatus(
            postId,
            boardId,
            communityId,
            userId,
            readDuration,
            scrollPosition,
            ipAddress || req.ip,
            userAgent || req.get('User-Agent'),
            deviceType
        );

        res.json({
            success: true,
            data: readStatus
        });
    } catch (error) {
        console.error('Error updating read status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update read status',
            error: error.message
        });
    }
});

// 사용자 읽음 상태 조회
router.get('/user', async (req, res) => {
    try {
        const { userId, ipAddress } = req.query;

        if (!userId && !ipAddress) {
            return res.status(400).json({
                success: false,
                message: 'Either userId or ipAddress is required'
            });
        }

        const readStatuses = await ReadStatus.getUserReadStatus(userId, ipAddress);

        res.json({
            success: true,
            data: readStatuses
        });
    } catch (error) {
        console.error('Error fetching user read status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user read status',
            error: error.message
        });
    }
});

// 특정 게시물의 읽음 상태 조회
router.get('/post/:postId', async (req, res) => {
    try {
        const { postId } = req.params;
        const { userId, ipAddress } = req.query;

        if (!userId && !ipAddress) {
            return res.status(400).json({
                success: false,
                message: 'Either userId or ipAddress is required'
            });
        }

        const readStatus = await ReadStatus.getPostReadStatus(postId, userId, ipAddress);

        res.json({
            success: true,
            data: readStatus
        });
    } catch (error) {
        console.error('Error fetching post read status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch post read status',
            error: error.message
        });
    }
});

// 읽지 않은 게시물 조회
router.get('/unread', async (req, res) => {
    try {
        const { boardId, communityId, userId, ipAddress, limit = 20 } = req.query;

        if (!boardId) {
            return res.status(400).json({
                success: false,
                message: 'boardId is required'
            });
        }

        if (!userId && !ipAddress) {
            return res.status(400).json({
                success: false,
                message: 'Either userId or ipAddress is required'
            });
        }

        const unreadPosts = await ReadStatus.getUnreadPosts(
            boardId,
            communityId,
            userId,
            ipAddress
        );

        // 제한된 수만큼 반환
        const limitedPosts = unreadPosts.slice(0, parseInt(limit));

        res.json({
            success: true,
            data: {
                posts: limitedPosts,
                total: unreadPosts.length,
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Error fetching unread posts:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch unread posts',
            error: error.message
        });
    }
});

// 읽음 통계 조회
router.get('/stats', async (req, res) => {
    try {
        const { boardId, communityId, userId } = req.query;

        const stats = await ReadStatus.getReadStats(boardId, communityId, userId);

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error fetching read stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch read stats',
            error: error.message
        });
    }
});

// 읽음 상태 삭제
router.delete('/:postId', async (req, res) => {
    try {
        const { postId } = req.params;
        const { userId, ipAddress } = req.body;

        if (!userId && !ipAddress) {
            return res.status(400).json({
                success: false,
                message: 'Either userId or ipAddress is required'
            });
        }

        const whereClause = { postId };
        if (userId) {
            whereClause.userId = userId;
        } else if (ipAddress) {
            whereClause.ipAddress = ipAddress;
            whereClause.isAnonymous = true;
        }

        const deletedCount = await ReadStatus.destroy({
            where: whereClause
        });

        res.json({
            success: true,
            message: `Deleted ${deletedCount} read status records`
        });
    } catch (error) {
        console.error('Error deleting read status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete read status',
            error: error.message
        });
    }
});

// 게시물별 읽음 사용자 목록 (관리자용)
router.get('/post/:postId/users', async (req, res) => {
    try {
        const { postId } = req.params;
        const { page = 1, limit = 20 } = req.query;

        const readStatuses = await ReadStatus.findAll({
            where: { postId },
            order: [['readAt', 'DESC']],
            limit: parseInt(limit),
            offset: (parseInt(page) - 1) * parseInt(limit)
        });

        res.json({
            success: true,
            data: {
                readStatuses,
                total: readStatuses.length,
                page: parseInt(page),
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Error fetching post readers:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch post readers',
            error: error.message
        });
    }
});

module.exports = router;

