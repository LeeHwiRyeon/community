/**
 * Recommendations API Router
 * 추천 시스템 API 엔드포인트
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const recommendationService = require('../services/recommendation-service');
const db = require('../config/database');
const logger = require('../utils/logger');

/**
 * GET /api/recommendations/health
 * ML 서비스 헬스 체크
 */
router.get('/health', async (req, res) => {
    try {
        const health = await recommendationService.checkMLServiceHealth();

        res.json({
            express: 'healthy',
            mlService: health
        });
    } catch (error) {
        logger.error('Health check error:', error);
        res.status(500).json({
            error: 'Health check failed',
            express: 'healthy',
            mlService: { healthy: false, error: error.message }
        });
    }
});

/**
 * GET /api/recommendations/posts
 * 사용자 맞춤 게시물 추천
 * 
 * Query Parameters:
 * - limit: 추천 개수 (기본값: 10, 최대: 50)
 * - type: 추천 타입 (hybrid, collaborative, content)
 */
router.get('/posts', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.user_id;
        const limit = Math.min(parseInt(req.query.limit) || 10, 50);
        const recommendationType = req.query.type || 'hybrid';

        // 유효성 검사
        if (!['hybrid', 'collaborative', 'content'].includes(recommendationType)) {
            return res.status(400).json({
                error: 'Invalid recommendation type',
                validTypes: ['hybrid', 'collaborative', 'content']
            });
        }

        // ML 서비스 호출
        const result = await recommendationService.getRecommendedPosts(
            userId,
            limit,
            recommendationType
        );

        if (result.success) {
            res.json({
                success: true,
                recommendations: result.data,
                cached: result.cached || false,
                count: result.data.length
            });
        } else {
            // ML 서비스 실패 시 fallback
            logger.warn(`ML service failed for user ${userId}, using fallback`);

            const fallback = await recommendationService.getFallbackPopularPosts(db, limit);

            if (fallback.success) {
                res.json({
                    success: true,
                    recommendations: fallback.data,
                    fallback: true,
                    count: fallback.data.length
                });
            } else {
                res.status(503).json({
                    error: 'Recommendation service unavailable',
                    details: result.error
                });
            }
        }
    } catch (error) {
        logger.error('Get recommendations error:', error);
        res.status(500).json({
            error: 'Failed to get recommendations',
            details: error.message
        });
    }
});

/**
 * GET /api/recommendations/similar/:postId
 * 유사 게시물 추천
 * 
 * Path Parameters:
 * - postId: 게시물 ID
 * 
 * Query Parameters:
 * - limit: 추천 개수 (기본값: 10, 최대: 20)
 */
router.get('/similar/:postId', async (req, res) => {
    try {
        const postId = parseInt(req.params.postId);
        const limit = Math.min(parseInt(req.query.limit) || 10, 20);

        if (isNaN(postId) || postId <= 0) {
            return res.status(400).json({
                error: 'Invalid post ID'
            });
        }

        // 게시물 존재 확인
        const [posts] = await db.execute(
            'SELECT post_id FROM posts WHERE post_id = ? AND deleted_at IS NULL',
            [postId]
        );

        if (posts.length === 0) {
            return res.status(404).json({
                error: 'Post not found'
            });
        }

        // ML 서비스 호출
        const result = await recommendationService.getSimilarPosts(postId, limit);

        if (result.success) {
            res.json({
                success: true,
                post_id: postId,
                similar_posts: result.data,
                cached: result.cached || false,
                count: result.data.length
            });
        } else {
            // ML 서비스 실패 시 같은 카테고리 게시물 반환
            const [similarPosts] = await db.execute(`
                SELECT 
                    p.post_id,
                    p.title,
                    p.category_id,
                    p.created_at,
                    COUNT(DISTINCT l.like_id) as likes_count,
                    p.views_count,
                    0.5 as similarity_score
                FROM posts p
                LEFT JOIN likes l ON p.post_id = l.post_id
                WHERE p.category_id = (
                    SELECT category_id FROM posts WHERE post_id = ?
                )
                AND p.post_id != ?
                AND p.deleted_at IS NULL
                GROUP BY p.post_id
                ORDER BY p.created_at DESC
                LIMIT ?
            `, [postId, postId, limit]);

            res.json({
                success: true,
                post_id: postId,
                similar_posts: similarPosts,
                fallback: true,
                count: similarPosts.length
            });
        }
    } catch (error) {
        logger.error('Get similar posts error:', error);
        res.status(500).json({
            error: 'Failed to get similar posts',
            details: error.message
        });
    }
});

/**
 * GET /api/recommendations/trending
 * 트렌딩 게시물 추천
 * 
 * Query Parameters:
 * - limit: 추천 개수 (기본값: 10, 최대: 50)
 * - days: 기간 (기본값: 7일)
 */
router.get('/trending', async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 10, 50);
        const days = Math.min(parseInt(req.query.days) || 7, 30);

        // ML 서비스 호출
        const result = await recommendationService.getTrendingPosts(limit, days);

        if (result.success) {
            res.json({
                success: true,
                trending: result.data,
                cached: result.cached || false,
                period_days: days,
                count: result.data.length
            });
        } else {
            // ML 서비스 실패 시 fallback
            const fallback = await recommendationService.getFallbackPopularPosts(db, limit);

            if (fallback.success) {
                res.json({
                    success: true,
                    trending: fallback.data,
                    fallback: true,
                    period_days: days,
                    count: fallback.data.length
                });
            } else {
                res.status(503).json({
                    error: 'Trending service unavailable',
                    details: result.error
                });
            }
        }
    } catch (error) {
        logger.error('Get trending posts error:', error);
        res.status(500).json({
            error: 'Failed to get trending posts',
            details: error.message
        });
    }
});

/**
 * POST /api/recommendations/refresh
 * ML 서비스 데이터 리프레시 (관리자 전용)
 */
router.post('/refresh', authenticateToken, async (req, res) => {
    try {
        // 관리자 권한 확인
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                error: 'Admin access required'
            });
        }

        const result = await recommendationService.refreshMLServiceData();

        if (result.success) {
            res.json({
                success: true,
                message: 'ML service data refreshed',
                timestamp: result.data?.timestamp
            });
        } else {
            res.status(500).json({
                success: false,
                error: 'Failed to refresh data',
                details: result.error
            });
        }
    } catch (error) {
        logger.error('Refresh ML data error:', error);
        res.status(500).json({
            error: 'Failed to refresh ML data',
            details: error.message
        });
    }
});

/**
 * DELETE /api/recommendations/cache
 * 추천 캐시 클리어 (관리자 전용)
 */
router.delete('/cache', authenticateToken, async (req, res) => {
    try {
        // 관리자 권한 확인
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                error: 'Admin access required'
            });
        }

        const pattern = req.query.pattern || 'recommendations:*';
        const result = await recommendationService.clearRecommendationCache(pattern);

        if (result.success) {
            res.json({
                success: true,
                message: 'Cache cleared',
                cleared_keys: result.cleared
            });
        } else {
            res.status(500).json({
                success: false,
                error: 'Failed to clear cache',
                details: result.error
            });
        }
    } catch (error) {
        logger.error('Clear cache error:', error);
        res.status(500).json({
            error: 'Failed to clear cache',
            details: error.message
        });
    }
});

/**
 * GET /api/recommendations/user/:userId/preferences
 * 사용자 선호도 분석 (선택적 기능)
 */
router.get('/user/:userId/preferences', authenticateToken, async (req, res) => {
    try {
        const targetUserId = parseInt(req.params.userId);
        const requestUserId = req.user.user_id;

        // 본인 또는 관리자만 조회 가능
        if (targetUserId !== requestUserId && req.user.role !== 'admin') {
            return res.status(403).json({
                error: 'Access denied'
            });
        }

        // 사용자 상호작용 데이터 분석
        const [interactions] = await db.execute(`
            SELECT 
                c.category_id,
                c.category_name,
                COUNT(*) as interaction_count
            FROM (
                SELECT post_id FROM user_activity_logs 
                WHERE user_id = ? AND viewed_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                UNION ALL
                SELECT post_id FROM likes 
                WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                UNION ALL
                SELECT post_id FROM comments 
                WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            ) as user_interactions
            JOIN posts p ON user_interactions.post_id = p.post_id
            JOIN categories c ON p.category_id = c.category_id
            GROUP BY c.category_id
            ORDER BY interaction_count DESC
        `, [targetUserId, targetUserId, targetUserId]);

        res.json({
            success: true,
            user_id: targetUserId,
            preferences: interactions,
            period_days: 30
        });
    } catch (error) {
        logger.error('Get user preferences error:', error);
        res.status(500).json({
            error: 'Failed to get user preferences',
            details: error.message
        });
    }
});

module.exports = router;
