/**
 * Social Features Routes
 * 소셜 기능 API 엔드포인트 (팔로우, 멘션, 공유, 차단)
 * 
 * @module routes/social
 */

import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { authenticateToken } from '../auth/jwt.js';
import followService from '../services/follow-service.js';
import mentionService from '../services/mention-service.js';
import shareService from '../services/share-service.js';
import blockService from '../services/block-service.js';
import logger from '../logger.js';

const router = express.Router();

/**
 * 에러 핸들러 헬퍼
 */
function handleError(res, error, defaultMessage = '오류가 발생했습니다.') {
    logger.error(defaultMessage, error);
    const statusCode = error.message.includes('존재하지 않는') ? 404 :
        error.message.includes('이미') ? 409 :
            error.message.includes('권한') ? 403 : 500;
    res.status(statusCode).json({
        error: error.message || defaultMessage
    });
}

// ============================================
// FOLLOW ENDPOINTS (팔로우)
// ============================================

/**
 * POST /api/social/follow/:userId
 * 사용자 팔로우
 * 
 * @access Private (인증 필요)
 */
router.post('/follow/:userId',
    authenticateToken,
    param('userId').isInt().withMessage('유효하지 않은 사용자 ID'),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const followerId = req.user.id;
            const followingId = parseInt(req.params.userId);

            const result = await followService.followUser(followerId, followingId);
            res.json(result);
        } catch (error) {
            handleError(res, error, '팔로우 중 오류가 발생했습니다.');
        }
    }
);

/**
 * DELETE /api/social/follow/:userId
 * 사용자 언팔로우
 * 
 * @access Private (인증 필요)
 */
router.delete('/follow/:userId',
    authenticateToken,
    param('userId').isInt().withMessage('유효하지 않은 사용자 ID'),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const followerId = req.user.id;
            const followingId = parseInt(req.params.userId);

            const result = await followService.unfollowUser(followerId, followingId);
            res.json(result);
        } catch (error) {
            handleError(res, error, '언팔로우 중 오류가 발생했습니다.');
        }
    }
);

/**
 * GET /api/social/followers/:userId
 * 팔로워 목록 조회
 * 
 * @access Public
 * @query {number} limit - 조회 개수 (기본값: 20)
 * @query {number} offset - 시작 위치 (기본값: 0)
 */
router.get('/followers/:userId',
    param('userId').isInt().withMessage('유효하지 않은 사용자 ID'),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('offset').optional().isInt({ min: 0 }).toInt(),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const userId = parseInt(req.params.userId);
            const limit = req.query.limit || 20;
            const offset = req.query.offset || 0;

            const result = await followService.getFollowers(userId, limit, offset);
            res.json(result);
        } catch (error) {
            handleError(res, error, '팔로워 목록 조회 중 오류가 발생했습니다.');
        }
    }
);

/**
 * GET /api/social/following/:userId
 * 팔로잉 목록 조회
 * 
 * @access Public
 * @query {number} limit - 조회 개수 (기본값: 20)
 * @query {number} offset - 시작 위치 (기본값: 0)
 */
router.get('/following/:userId',
    param('userId').isInt().withMessage('유효하지 않은 사용자 ID'),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('offset').optional().isInt({ min: 0 }).toInt(),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const userId = parseInt(req.params.userId);
            const limit = req.query.limit || 20;
            const offset = req.query.offset || 0;

            const result = await followService.getFollowing(userId, limit, offset);
            res.json(result);
        } catch (error) {
            handleError(res, error, '팔로잉 목록 조회 중 오류가 발생했습니다.');
        }
    }
);

/**
 * GET /api/social/follow/status/:userId
 * 팔로우 상태 확인
 * 
 * @access Private (인증 필요)
 */
router.get('/follow/status/:userId',
    authenticateToken,
    param('userId').isInt().withMessage('유효하지 않은 사용자 ID'),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const followerId = req.user.id;
            const followingId = parseInt(req.params.userId);

            const isFollowing = await followService.isFollowing(followerId, followingId);
            const isMutual = await followService.isMutualFollow(followerId, followingId);

            res.json({
                isFollowing,
                isMutual,
                userId: followingId
            });
        } catch (error) {
            handleError(res, error, '팔로우 상태 확인 중 오류가 발생했습니다.');
        }
    }
);

/**
 * GET /api/social/follow/stats/:userId
 * 팔로우 통계 조회
 * 
 * @access Public
 */
router.get('/follow/stats/:userId',
    param('userId').isInt().withMessage('유효하지 않은 사용자 ID'),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const userId = parseInt(req.params.userId);
            const stats = await followService.getFollowStats(userId);
            res.json(stats);
        } catch (error) {
            handleError(res, error, '팔로우 통계 조회 중 오류가 발생했습니다.');
        }
    }
);

/**
 * GET /api/social/follow/suggestions
 * 팔로우 추천
 * 
 * @access Private (인증 필요)
 * @query {number} limit - 조회 개수 (기본값: 10)
 */
router.get('/follow/suggestions',
    authenticateToken,
    query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const userId = req.user.id;
            const limit = req.query.limit || 10;

            const suggestions = await followService.getFollowSuggestions(userId, limit);
            res.json({ suggestions });
        } catch (error) {
            handleError(res, error, '팔로우 추천 조회 중 오류가 발생했습니다.');
        }
    }
);

/**
 * GET /api/social/follow/recent/:userId
 * 최근 팔로워 조회
 * 
 * @access Public
 * @query {number} limit - 조회 개수 (기본값: 5)
 */
router.get('/follow/recent/:userId',
    param('userId').isInt().withMessage('유효하지 않은 사용자 ID'),
    query('limit').optional().isInt({ min: 1, max: 20 }).toInt(),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const userId = parseInt(req.params.userId);
            const limit = req.query.limit || 5;

            const followers = await followService.getRecentFollowers(userId, limit);
            res.json({ followers });
        } catch (error) {
            handleError(res, error, '최근 팔로워 조회 중 오류가 발생했습니다.');
        }
    }
);

// ============================================
// MENTION ENDPOINTS (멘션)
// ============================================

/**
 * GET /api/social/mentions
 * 나를 멘션한 목록 조회
 * 
 * @access Private (인증 필요)
 * @query {number} limit - 페이지 크기 (1-100, 기본값: 20)
 * @query {number} offset - 오프셋 (기본값: 0)
 */
router.get('/mentions',
    authenticateToken,
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('offset').optional().isInt({ min: 0 }).toInt(),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const userId = req.user.id;
            const limit = req.query.limit || 20;
            const offset = req.query.offset || 0;

            const result = await mentionService.getUserMentions(userId, limit, offset);
            res.json(result);
        } catch (error) {
            handleError(res, error, '멘션 목록 조회 중 오류가 발생했습니다.');
        }
    }
);

/**
 * GET /api/social/mentions/post/:postId
 * 게시물의 멘션 목록 조회
 * 
 * @access Public
 */
router.get('/mentions/post/:postId',
    param('postId').isInt().withMessage('유효하지 않은 게시물 ID'),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const postId = parseInt(req.params.postId);
            const mentions = await mentionService.getPostMentions(postId);
            res.json({ mentions });
        } catch (error) {
            handleError(res, error, '게시물 멘션 조회 중 오류가 발생했습니다.');
        }
    }
);

/**
 * GET /api/social/mentions/comment/:commentId
 * 댓글의 멘션 목록 조회
 * 
 * @access Public
 */
router.get('/mentions/comment/:commentId',
    param('commentId').isInt().withMessage('유효하지 않은 댓글 ID'),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const commentId = parseInt(req.params.commentId);
            const mentions = await mentionService.getCommentMentions(commentId);
            res.json({ mentions });
        } catch (error) {
            handleError(res, error, '댓글 멘션 조회 중 오류가 발생했습니다.');
        }
    }
);

/**
 * PUT /api/social/mentions/:mentionId/read
 * 멘션 읽음 처리
 * 
 * @access Private (인증 필요)
 */
router.put('/mentions/:mentionId/read',
    authenticateToken,
    param('mentionId').isInt().withMessage('유효하지 않은 멘션 ID'),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const mentionId = parseInt(req.params.mentionId);
            const userId = req.user.id;

            const result = await mentionService.markMentionAsRead(mentionId, userId);
            res.json(result);
        } catch (error) {
            handleError(res, error, '멘션 읽음 처리 중 오류가 발생했습니다.');
        }
    }
);

/**
 * PUT /api/social/mentions/read-all
 * 모든 멘션 읽음 처리
 * 
 * @access Private (인증 필요)
 */
router.put('/mentions/read-all',
    authenticateToken,
    async (req, res) => {
        try {
            const userId = req.user.id;
            const result = await mentionService.markAllMentionsAsRead(userId);
            res.json(result);
        } catch (error) {
            handleError(res, error, '모든 멘션 읽음 처리 중 오류가 발생했습니다.');
        }
    }
);

/**
 * GET /api/social/mentions/unread-count
 * 읽지 않은 멘션 개수 조회
 * 
 * @access Private (인증 필요)
 */
router.get('/mentions/unread-count',
    authenticateToken,
    async (req, res) => {
        try {
            const userId = req.user.id;
            const count = await mentionService.getUnreadMentionCount(userId);
            res.json({ count });
        } catch (error) {
            handleError(res, error, '읽지 않은 멘션 개수 조회 중 오류가 발생했습니다.');
        }
    }
);

/**
 * GET /api/social/mentions/search-users
 * 사용자명 검색 (자동완성용)
 * 
 * @access Private (인증 필요)
 * @query {string} q - 검색어
 * @query {number} limit - 결과 개수 (1-20, 기본값: 10)
 */
router.get('/mentions/search-users',
    authenticateToken,
    query('q').notEmpty().withMessage('검색어를 입력하세요'),
    query('limit').optional().isInt({ min: 1, max: 20 }).toInt(),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const searchTerm = req.query.q;
            const limit = req.query.limit || 10;

            const users = await mentionService.searchUsernames(searchTerm, limit);
            res.json({ users });
        } catch (error) {
            handleError(res, error, '사용자 검색 중 오류가 발생했습니다.');
        }
    }
);

// ============================================
// SHARE ENDPOINTS (공유)
// ============================================

/**
 * POST /api/social/share/:postId
 * 게시물 공유 추적
 * 
 * @access Public (비로그인 사용자도 가능)
 * @body {string} platform - 공유 플랫폼 (twitter, facebook, linkedin, clipboard)
 */
router.post('/share/:postId',
    param('postId').isInt().withMessage('유효하지 않은 게시물 ID'),
    body('platform').isIn(['twitter', 'facebook', 'linkedin', 'clipboard']).withMessage('유효하지 않은 플랫폼'),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const postId = parseInt(req.params.postId);
            const { platform } = req.body;

            // 로그인한 사용자 ID 또는 0 (비로그인)
            const userId = req.user?.id || 0;

            const result = await shareService.trackShare(postId, userId, platform);
            res.json(result);
        } catch (error) {
            handleError(res, error, '공유 추적 중 오류가 발생했습니다.');
        }
    }
);

/**
 * GET /api/social/share/stats/:postId
 * 게시물 공유 통계 조회
 * 
 * @access Public
 */
router.get('/share/stats/:postId',
    param('postId').isInt().withMessage('유효하지 않은 게시물 ID'),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const postId = parseInt(req.params.postId);
            const stats = await shareService.getShareStats(postId);
            res.json(stats);
        } catch (error) {
            handleError(res, error, '공유 통계 조회 중 오류가 발생했습니다.');
        }
    }
);

/**
 * GET /api/social/share/trending
 * 인기 공유 게시물 조회
 * 
 * @access Public
 * @query {number} limit - 조회 개수 (1-50, 기본값: 10)
 * @query {number} days - 기간 (1-30일, 기본값: 7)
 */
router.get('/share/trending',
    query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
    query('days').optional().isInt({ min: 1, max: 30 }).toInt(),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const limit = req.query.limit || 10;
            const days = req.query.days || 7;

            const shares = await shareService.getTrendingShares(limit, days);
            res.json({ shares, limit, days });
        } catch (error) {
            handleError(res, error, '인기 공유 게시물 조회 중 오류가 발생했습니다.');
        }
    }
);

/**
 * GET /api/social/share/by-platform/:platform
 * 플랫폼별 인기 공유 게시물
 * 
 * @access Public
 * @param {string} platform - 플랫폼 (twitter, facebook, linkedin, clipboard)
 * @query {number} limit - 조회 개수 (1-50, 기본값: 10)
 * @query {number} days - 기간 (1-30일, 기본값: 7)
 */
router.get('/share/by-platform/:platform',
    param('platform').isIn(['twitter', 'facebook', 'linkedin', 'clipboard']).withMessage('유효하지 않은 플랫폼'),
    query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
    query('days').optional().isInt({ min: 1, max: 30 }).toInt(),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { platform } = req.params;
            const limit = req.query.limit || 10;
            const days = req.query.days || 7;

            const shares = await shareService.getSharesByPlatform(platform, limit, days);
            res.json({ shares, platform, limit, days });
        } catch (error) {
            handleError(res, error, '플랫폼별 공유 게시물 조회 중 오류가 발생했습니다.');
        }
    }
);

/**
 * GET /api/social/share/my-shares
 * 내 공유 기록 조회
 * 
 * @access Private (인증 필요)
 * @query {number} limit - 페이지 크기 (1-100, 기본값: 20)
 * @query {number} offset - 오프셋 (기본값: 0)
 */
router.get('/share/my-shares',
    authenticateToken,
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('offset').optional().isInt({ min: 0 }).toInt(),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const userId = req.user.id;
            const limit = req.query.limit || 20;
            const offset = req.query.offset || 0;

            const result = await shareService.getUserShares(userId, limit, offset);
            res.json(result);
        } catch (error) {
            handleError(res, error, '공유 기록 조회 중 오류가 발생했습니다.');
        }
    }
);

/**
 * GET /api/social/share/global-stats
 * 전체 공유 통계
 * 
 * @access Public
 */
router.get('/share/global-stats',
    async (req, res) => {
        try {
            const stats = await shareService.getGlobalShareStats();
            res.json(stats);
        } catch (error) {
            handleError(res, error, '전체 공유 통계 조회 중 오류가 발생했습니다.');
        }
    }
);

// ============================================
// BLOCK ENDPOINTS (차단)
// ============================================

/**
 * POST /api/social/block/:userId
 * 사용자 차단
 * 
 * @access Private (인증 필요)
 * @body {string} reason - 차단 이유 (선택)
 */
router.post('/block/:userId',
    authenticateToken,
    param('userId').isInt().withMessage('유효하지 않은 사용자 ID'),
    body('reason').optional().isString().isLength({ max: 255 }),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const blockerId = req.user.id;
            const blockedId = parseInt(req.params.userId);
            const { reason } = req.body;

            const result = await blockService.blockUser(blockerId, blockedId, reason);
            res.json(result);
        } catch (error) {
            handleError(res, error, '사용자 차단 중 오류가 발생했습니다.');
        }
    }
);

/**
 * DELETE /api/social/block/:userId
 * 사용자 차단 해제
 * 
 * @access Private (인증 필요)
 */
router.delete('/block/:userId',
    authenticateToken,
    param('userId').isInt().withMessage('유효하지 않은 사용자 ID'),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const blockerId = req.user.id;
            const blockedId = parseInt(req.params.userId);

            const result = await blockService.unblockUser(blockerId, blockedId);
            res.json(result);
        } catch (error) {
            handleError(res, error, '차단 해제 중 오류가 발생했습니다.');
        }
    }
);

/**
 * GET /api/social/blocked
 * 차단한 사용자 목록 조회
 * 
 * @access Private (인증 필요)
 * @query {number} limit - 페이지 크기 (1-100, 기본값: 20)
 * @query {number} offset - 오프셋 (기본값: 0)
 */
router.get('/blocked',
    authenticateToken,
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('offset').optional().isInt({ min: 0 }).toInt(),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const userId = req.user.id;
            const limit = req.query.limit || 20;
            const offset = req.query.offset || 0;

            const result = await blockService.getBlockedUsers(userId, limit, offset);
            res.json(result);
        } catch (error) {
            handleError(res, error, '차단 목록 조회 중 오류가 발생했습니다.');
        }
    }
);

/**
 * GET /api/social/block/status/:userId
 * 차단 상태 확인
 * 
 * @access Private (인증 필요)
 */
router.get('/block/status/:userId',
    authenticateToken,
    param('userId').isInt().withMessage('유효하지 않은 사용자 ID'),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const userId = req.user.id;
            const targetUserId = parseInt(req.params.userId);

            const status = await blockService.checkBlockStatus(userId, targetUserId);
            res.json(status);
        } catch (error) {
            handleError(res, error, '차단 상태 확인 중 오류가 발생했습니다.');
        }
    }
);

/**
 * GET /api/social/block/stats
 * 차단 통계 조회
 * 
 * @access Private (인증 필요)
 */
router.get('/block/stats',
    authenticateToken,
    async (req, res) => {
        try {
            const userId = req.user.id;
            const stats = await blockService.getBlockStats(userId);
            res.json(stats);
        } catch (error) {
            handleError(res, error, '차단 통계 조회 중 오류가 발생했습니다.');
        }
    }
);

export default router;
