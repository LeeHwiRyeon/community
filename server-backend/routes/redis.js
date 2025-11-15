/**
 * Redis Management Routes
 * 
 * Redis 캐시 관리 및 모니터링 API
 * - 캐시 통계 조회
 * - 캐시 무효화
 * - Redis 헬스체크
 */

import express from 'express';
import redisService from '../services/redisService.js';
import redisClient from '../config/redisClient.js';

const router = express.Router();

/**
 * @route   GET /api/redis/health
 * @desc    Redis 헬스체크
 * @access  Public
 */
router.get('/health', async (req, res) => {
    try {
        const health = await redisService.healthCheck();
        const statusCode = health.status === 'healthy' ? 200 : 503;

        res.status(statusCode).json({
            success: health.status === 'healthy',
            ...health
        });
    } catch (error) {
        res.status(503).json({
            success: false,
            status: 'unhealthy',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/redis/stats
 * @desc    Redis 통계 조회
 * @access  Private (Admin)
 */
router.get('/stats', async (req, res) => {
    try {
        // 캐시 히트율
        const cacheStats = await redisService.getCacheStats();

        // Redis 서버 통계
        const redisStats = await redisClient.getStats();

        res.json({
            success: true,
            cache: cacheStats,
            redis: {
                dbSize: redisStats?.dbSize || 0,
                memory: redisStats?.info?.used_memory_human || 'N/A',
                connectedClients: redisStats?.info?.connected_clients || 'N/A',
                uptime: redisStats?.info?.uptime_in_seconds || 'N/A'
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * @route   POST /api/redis/invalidate
 * @desc    캐시 무효화 (특정 패턴)
 * @access  Private (Admin)
 */
router.post('/invalidate', async (req, res) => {
    try {
        const { pattern } = req.body;

        if (!pattern) {
            return res.status(400).json({
                success: false,
                error: 'Pattern is required'
            });
        }

        const deletedCount = await redisService.deletePattern(pattern);

        res.json({
            success: true,
            message: `Invalidated ${deletedCount} cache entries`,
            deletedCount,
            pattern
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * @route   POST /api/redis/invalidate/post/:postId
 * @desc    게시글 관련 캐시 무효화
 * @access  Private
 */
router.post('/invalidate/post/:postId', async (req, res) => {
    try {
        const { postId } = req.params;

        // 게시글 캐시 삭제
        await redisService.deletePost(postId);

        // 댓글 캐시 삭제
        await redisService.deleteComments(postId);

        res.json({
            success: true,
            message: `Post ${postId} cache invalidated`
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * @route   POST /api/redis/invalidate/board/:boardId
 * @desc    게시판 관련 캐시 무효화
 * @access  Private
 */
router.post('/invalidate/board/:boardId', async (req, res) => {
    try {
        const { boardId } = req.params;

        // 게시판 게시글 목록 캐시 삭제
        const deletedCount = await redisService.invalidatePostLists(boardId);

        res.json({
            success: true,
            message: `Board ${boardId} cache invalidated`,
            deletedCount
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * @route   POST /api/redis/invalidate/user/:userId
 * @desc    사용자 관련 캐시 무효화
 * @access  Private
 */
router.post('/invalidate/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        // 사용자 프로필 캐시 삭제
        await redisService.deleteUserProfile(userId);

        // 사용자 세션 삭제
        await redisService.deleteUserSessions(userId);

        res.json({
            success: true,
            message: `User ${userId} cache invalidated`
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * @route   DELETE /api/redis/cache
 * @desc    전체 캐시 삭제 (개발 환경만)
 * @access  Private (Admin)
 */
router.delete('/cache', async (req, res) => {
    try {
        if (process.env.NODE_ENV === 'production') {
            return res.status(403).json({
                success: false,
                error: 'Cannot flush cache in production'
            });
        }

        await redisClient.flushAll();

        res.json({
            success: true,
            message: 'All cache cleared'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * @route   GET /api/redis/info
 * @desc    Redis 서버 정보 조회
 * @access  Private (Admin)
 */
router.get('/info', async (req, res) => {
    try {
        const info = await redisClient.getInfo();

        res.json({
            success: true,
            info
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export default router;
