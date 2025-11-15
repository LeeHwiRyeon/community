/**
 * Follow System Routes
 * 팔로우 시스템 REST API
 * 
 * @author AUTOAGENTS
 * @date 2025-11-11
 */

import express from 'express';
import { query } from '../db.js';
import { authenticateToken } from '../auth/jwt.js';
import logger from '../logger.js';

const router = express.Router();

// 모든 라우트에 인증 필요
router.use(authenticateToken);

/**
 * @route   POST /api/follow/:userId
 * @desc    사용자 팔로우
 * @access  Private
 */
router.post('/:userId', async (req, res) => {
    const followingId = req.params.userId;
    const followerId = req.user.id;

    try {
        // 자기 자신을 팔로우할 수 없음
        if (followerId === parseInt(followingId)) {
            return res.status(400).json({
                error: '자기 자신을 팔로우할 수 없습니다'
            });
        }

        // 팔로우 대상 사용자 존재 확인
        const targetUser = await query(
            'SELECT id, username FROM users WHERE id = ?',
            [followingId]
        );

        if (!targetUser || targetUser.length === 0) {
            return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
        }

        // 이미 팔로우 중인지 확인
        const existingFollow = await query(
            'SELECT id FROM follows WHERE follower_id = ? AND following_id = ?',
            [followerId, followingId]
        );

        if (existingFollow && existingFollow.length > 0) {
            return res.status(400).json({ error: '이미 팔로우 중입니다' });
        }

        // 팔로우 관계 생성
        await query(
            'INSERT INTO follows (follower_id, following_id) VALUES (?, ?)',
            [followerId, followingId]
        );

        // 팔로워/팔로잉 카운트 업데이트
        await query(
            'UPDATE users SET followers_count = followers_count + 1 WHERE id = ?',
            [followingId]
        );
        await query(
            'UPDATE users SET following_count = following_count + 1 WHERE id = ?',
            [followerId]
        );

        // 팔로우 알림 생성
        await query(
            `INSERT INTO follow_notifications (user_id, follower_id) 
             VALUES (?, ?)`,
            [followingId, followerId]
        );

        logger.info(`User ${followerId} followed user ${followingId}`);

        res.json({
            message: '팔로우 성공',
            followingId,
            followedUsername: targetUser[0].username
        });
    } catch (error) {
        logger.error('Follow error:', error);
        res.status(500).json({ error: '팔로우 처리 중 오류가 발생했습니다' });
    }
});

/**
 * @route   DELETE /api/follow/:userId
 * @desc    사용자 언팔로우
 * @access  Private
 */
router.delete('/:userId', async (req, res) => {
    const followingId = req.params.userId;
    const followerId = req.user.id;

    try {
        // 팔로우 관계 확인
        const existingFollow = await query(
            'SELECT id FROM follows WHERE follower_id = ? AND following_id = ?',
            [followerId, followingId]
        );

        if (!existingFollow || existingFollow.length === 0) {
            return res.status(404).json({ error: '팔로우 관계가 존재하지 않습니다' });
        }

        // 팔로우 관계 삭제
        await query(
            'DELETE FROM follows WHERE follower_id = ? AND following_id = ?',
            [followerId, followingId]
        );

        // 팔로워/팔로잉 카운트 업데이트
        await query(
            'UPDATE users SET followers_count = GREATEST(followers_count - 1, 0) WHERE id = ?',
            [followingId]
        );
        await query(
            'UPDATE users SET following_count = GREATEST(following_count - 1, 0) WHERE id = ?',
            [followerId]
        );

        logger.info(`User ${followerId} unfollowed user ${followingId}`);

        res.json({
            message: '언팔로우 성공',
            followingId
        });
    } catch (error) {
        logger.error('Unfollow error:', error);
        res.status(500).json({ error: '언팔로우 처리 중 오류가 발생했습니다' });
    }
});

/**
 * @route   GET /api/follow/:userId/status
 * @desc    팔로우 상태 확인
 * @access  Private
 */
router.get('/:userId/status', async (req, res) => {
    const targetUserId = req.params.userId;
    const currentUserId = req.user.id;

    try {
        // 팔로우 여부 확인
        const isFollowing = await query(
            'SELECT id FROM follows WHERE follower_id = ? AND following_id = ?',
            [currentUserId, targetUserId]
        );

        // 상대방이 나를 팔로우하는지 확인
        const isFollower = await query(
            'SELECT id FROM follows WHERE follower_id = ? AND following_id = ?',
            [targetUserId, currentUserId]
        );

        res.json({
            isFollowing: isFollowing && isFollowing.length > 0,
            isFollower: isFollower && isFollower.length > 0,
            isMutual: (isFollowing && isFollowing.length > 0) && (isFollower && isFollower.length > 0)
        });
    } catch (error) {
        logger.error('Follow status check error:', error);
        res.status(500).json({ error: '팔로우 상태 확인 중 오류가 발생했습니다' });
    }
});

/**
 * @route   GET /api/follow/:userId/followers
 * @desc    사용자의 팔로워 목록 조회
 * @access  Private
 */
router.get('/:userId/followers', async (req, res) => {
    const userId = req.params.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const currentUserId = req.user.id;

    try {
        // 팔로워 목록 조회 (내가 팔로우하는지 여부 포함)
        const followers = await query(
            `SELECT 
                u.id,
                u.username,
                u.email,
                u.profile_image,
                u.bio,
                u.followers_count,
                u.following_count,
                f.created_at as followed_at,
                CASE WHEN f2.id IS NOT NULL THEN TRUE ELSE FALSE END as is_following_back
            FROM follows f
            JOIN users u ON f.follower_id = u.id
            LEFT JOIN follows f2 ON f2.follower_id = ? AND f2.following_id = u.id
            WHERE f.following_id = ?
            ORDER BY f.created_at DESC
            LIMIT ? OFFSET ?`,
            [currentUserId, userId, limit, offset]
        );

        // 전체 팔로워 수 조회
        const totalResult = await query(
            'SELECT COUNT(*) as total FROM follows WHERE following_id = ?',
            [userId]
        );
        const total = totalResult[0].total;

        res.json({
            followers,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        logger.error('Get followers error:', error);
        res.status(500).json({ error: '팔로워 목록 조회 중 오류가 발생했습니다' });
    }
});

/**
 * @route   GET /api/follow/:userId/following
 * @desc    사용자가 팔로우하는 목록 조회
 * @access  Private
 */
router.get('/:userId/following', async (req, res) => {
    const userId = req.params.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const currentUserId = req.user.id;

    try {
        // 팔로잉 목록 조회 (내가 팔로우하는지 여부 포함)
        const following = await query(
            `SELECT 
                u.id,
                u.username,
                u.email,
                u.profile_image,
                u.bio,
                u.followers_count,
                u.following_count,
                f.created_at as followed_at,
                CASE WHEN f2.id IS NOT NULL THEN TRUE ELSE FALSE END as is_following
            FROM follows f
            JOIN users u ON f.following_id = u.id
            LEFT JOIN follows f2 ON f2.follower_id = ? AND f2.following_id = u.id
            WHERE f.follower_id = ?
            ORDER BY f.created_at DESC
            LIMIT ? OFFSET ?`,
            [currentUserId, userId, limit, offset]
        );

        // 전체 팔로잉 수 조회
        const totalResult = await query(
            'SELECT COUNT(*) as total FROM follows WHERE follower_id = ?',
            [userId]
        );
        const total = totalResult[0].total;

        res.json({
            following,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        logger.error('Get following error:', error);
        res.status(500).json({ error: '팔로잉 목록 조회 중 오류가 발생했습니다' });
    }
});

/**
 * @route   GET /api/follow/suggestions
 * @desc    팔로우 추천 사용자 목록
 * @access  Private
 */
router.get('/suggestions', async (req, res) => {
    const currentUserId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;

    try {
        // 추천 로직: 내가 팔로우하는 사람들이 팔로우하는 사람 중
        // 내가 아직 팔로우하지 않은 사람
        const suggestions = await query(
            `SELECT 
                u.id,
                u.username,
                u.email,
                u.profile_image,
                u.bio,
                u.followers_count,
                u.following_count,
                COUNT(DISTINCT f2.follower_id) as mutual_connections
            FROM users u
            JOIN follows f2 ON f2.following_id = u.id
            WHERE f2.follower_id IN (
                SELECT following_id FROM follows WHERE follower_id = ?
            )
            AND u.id != ?
            AND u.id NOT IN (
                SELECT following_id FROM follows WHERE follower_id = ?
            )
            GROUP BY u.id, u.username, u.email, u.profile_image, u.bio, u.followers_count, u.following_count
            ORDER BY mutual_connections DESC, u.followers_count DESC
            LIMIT ?`,
            [currentUserId, currentUserId, currentUserId, limit]
        );

        // 추천 사용자가 부족하면 인기 사용자로 보충
        if (suggestions.length < limit) {
            const remaining = limit - suggestions.length;
            const excludeIds = suggestions.map(s => s.id).concat(currentUserId);

            const popularUsers = await query(
                `SELECT 
                    u.id,
                    u.username,
                    u.email,
                    u.profile_image,
                    u.bio,
                    u.followers_count,
                    u.following_count,
                    0 as mutual_connections
                FROM users u
                WHERE u.id NOT IN (?)
                AND u.id NOT IN (
                    SELECT following_id FROM follows WHERE follower_id = ?
                )
                ORDER BY u.followers_count DESC
                LIMIT ?`,
                [excludeIds, currentUserId, remaining]
            );

            suggestions.push(...popularUsers);
        }

        res.json({
            suggestions
        });
    } catch (error) {
        logger.error('Get suggestions error:', error);
        res.status(500).json({ error: '추천 사용자 조회 중 오류가 발생했습니다' });
    }
});

/**
 * @route   GET /api/follow/notifications
 * @desc    팔로우 알림 조회
 * @access  Private
 */
router.get('/notifications', async (req, res) => {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const unreadOnly = req.query.unreadOnly === 'true';

    try {
        let whereClause = 'WHERE fn.user_id = ?';
        const params = [userId];

        if (unreadOnly) {
            whereClause += ' AND fn.is_read = FALSE';
        }

        const notifications = await query(
            `SELECT 
                fn.id,
                fn.follower_id,
                u.username as follower_username,
                u.profile_image as follower_image,
                fn.is_read,
                fn.created_at,
                fn.read_at
            FROM follow_notifications fn
            JOIN users u ON fn.follower_id = u.id
            ${whereClause}
            ORDER BY fn.created_at DESC
            LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );

        // 전체 알림 수 및 읽지 않은 알림 수
        const countResult = await query(
            `SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN is_read = FALSE THEN 1 ELSE 0 END) as unread
            FROM follow_notifications
            WHERE user_id = ?`,
            [userId]
        );

        res.json({
            notifications,
            total: countResult[0].total,
            unread: countResult[0].unread,
            pagination: {
                page,
                limit,
                totalPages: Math.ceil(countResult[0].total / limit)
            }
        });
    } catch (error) {
        logger.error('Get follow notifications error:', error);
        res.status(500).json({ error: '알림 조회 중 오류가 발생했습니다' });
    }
});

/**
 * @route   PUT /api/follow/notifications/:id/read
 * @desc    팔로우 알림 읽음 처리
 * @access  Private
 */
router.put('/notifications/:id/read', async (req, res) => {
    const notificationId = req.params.id;
    const userId = req.user.id;

    try {
        // 알림 소유권 확인
        const notification = await query(
            'SELECT id FROM follow_notifications WHERE id = ? AND user_id = ?',
            [notificationId, userId]
        );

        if (!notification || notification.length === 0) {
            return res.status(404).json({ error: '알림을 찾을 수 없습니다' });
        }

        // 읽음 처리
        await query(
            'UPDATE follow_notifications SET is_read = TRUE, read_at = NOW() WHERE id = ?',
            [notificationId]
        );

        res.json({ message: '알림을 읽음 처리했습니다' });
    } catch (error) {
        logger.error('Mark notification as read error:', error);
        res.status(500).json({ error: '알림 처리 중 오류가 발생했습니다' });
    }
});

/**
 * @route   PUT /api/follow/notifications/read-all
 * @desc    모든 팔로우 알림 읽음 처리
 * @access  Private
 */
router.put('/notifications/read-all', async (req, res) => {
    const userId = req.user.id;

    try {
        const result = await query(
            'UPDATE follow_notifications SET is_read = TRUE, read_at = NOW() WHERE user_id = ? AND is_read = FALSE',
            [userId]
        );

        res.json({
            message: '모든 알림을 읽음 처리했습니다',
            updated: result.affectedRows
        });
    } catch (error) {
        logger.error('Mark all notifications as read error:', error);
        res.status(500).json({ error: '알림 처리 중 오류가 발생했습니다' });
    }
});

/**
 * @route   POST /api/follow/board/:boardId
 * @desc    게시판 팔로우
 * @access  Private
 */
router.post('/board/:boardId', async (req, res) => {
    const boardId = req.params.boardId;
    const userId = req.user.id;
    const { notificationEnabled = true } = req.body;

    try {
        // 게시판 존재 확인
        const board = await query(
            'SELECT id, name FROM boards WHERE id = ?',
            [boardId]
        );

        if (!board || board.length === 0) {
            return res.status(404).json({ error: '게시판을 찾을 수 없습니다' });
        }

        // 이미 팔로우 중인지 확인
        const existingFollow = await query(
            'SELECT id FROM board_follows WHERE user_id = ? AND board_id = ?',
            [userId, boardId]
        );

        if (existingFollow && existingFollow.length > 0) {
            return res.status(400).json({ error: '이미 팔로우 중인 게시판입니다' });
        }

        // 게시판 팔로우 생성
        await query(
            'INSERT INTO board_follows (user_id, board_id, notification_enabled) VALUES (?, ?, ?)',
            [userId, boardId, notificationEnabled]
        );

        logger.info(`User ${userId} followed board ${boardId}`);

        res.json({
            message: '게시판 팔로우 성공',
            boardId,
            boardName: board[0].name,
            notificationEnabled
        });
    } catch (error) {
        logger.error('Board follow error:', error);
        res.status(500).json({ error: '게시판 팔로우 처리 중 오류가 발생했습니다' });
    }
});

/**
 * @route   DELETE /api/follow/board/:boardId
 * @desc    게시판 언팔로우
 * @access  Private
 */
router.delete('/board/:boardId', async (req, res) => {
    const boardId = req.params.boardId;
    const userId = req.user.id;

    try {
        // 팔로우 관계 확인
        const existingFollow = await query(
            'SELECT id FROM board_follows WHERE user_id = ? AND board_id = ?',
            [userId, boardId]
        );

        if (!existingFollow || existingFollow.length === 0) {
            return res.status(404).json({ error: '팔로우 관계가 존재하지 않습니다' });
        }

        // 게시판 팔로우 삭제
        await query(
            'DELETE FROM board_follows WHERE user_id = ? AND board_id = ?',
            [userId, boardId]
        );

        logger.info(`User ${userId} unfollowed board ${boardId}`);

        res.json({
            message: '게시판 언팔로우 성공',
            boardId
        });
    } catch (error) {
        logger.error('Board unfollow error:', error);
        res.status(500).json({ error: '게시판 언팔로우 처리 중 오류가 발생했습니다' });
    }
});

/**
 * @route   PUT /api/follow/board/:boardId/notification
 * @desc    게시판 알림 설정 변경
 * @access  Private
 */
router.put('/board/:boardId/notification', async (req, res) => {
    const boardId = req.params.boardId;
    const userId = req.user.id;
    const { enabled } = req.body;

    if (typeof enabled !== 'boolean') {
        return res.status(400).json({ error: 'enabled 값이 필요합니다 (boolean)' });
    }

    try {
        // 팔로우 관계 확인
        const existingFollow = await query(
            'SELECT id FROM board_follows WHERE user_id = ? AND board_id = ?',
            [userId, boardId]
        );

        if (!existingFollow || existingFollow.length === 0) {
            return res.status(404).json({ error: '팔로우 관계가 존재하지 않습니다' });
        }

        // 알림 설정 변경
        await query(
            'UPDATE board_follows SET notification_enabled = ? WHERE user_id = ? AND board_id = ?',
            [enabled, userId, boardId]
        );

        logger.info(`User ${userId} updated board ${boardId} notification: ${enabled}`);

        res.json({
            message: `게시판 알림이 ${enabled ? '활성화' : '비활성화'}되었습니다`,
            boardId,
            notificationEnabled: enabled
        });
    } catch (error) {
        logger.error('Update board notification error:', error);
        res.status(500).json({ error: '알림 설정 변경 중 오류가 발생했습니다' });
    }
});

/**
 * @route   GET /api/follow/board/:boardId/status
 * @desc    게시판 팔로우 상태 확인
 * @access  Private
 */
router.get('/board/:boardId/status', async (req, res) => {
    const boardId = req.params.boardId;
    const userId = req.user.id;

    try {
        // 팔로우 여부 확인
        const follow = await query(
            'SELECT id, notification_enabled FROM board_follows WHERE user_id = ? AND board_id = ?',
            [userId, boardId]
        );

        res.json({
            isFollowing: follow && follow.length > 0,
            notificationEnabled: follow && follow.length > 0 ? follow[0].notification_enabled : false
        });
    } catch (error) {
        logger.error('Board follow status check error:', error);
        res.status(500).json({ error: '팔로우 상태 확인 중 오류가 발생했습니다' });
    }
});

/**
 * @route   GET /api/follow/boards
 * @desc    내가 팔로우하는 게시판 목록 조회
 * @access  Private
 */
router.get('/boards', async (req, res) => {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    try {
        // 팔로우한 게시판 목록 조회
        const boards = await query(
            `SELECT 
                b.id,
                b.name,
                b.description,
                bf.notification_enabled,
                bf.created_at as followed_at,
                (SELECT COUNT(*) FROM posts WHERE board_id = b.id AND deleted = 0) AS post_count,
                (SELECT COUNT(*) FROM board_follows WHERE board_id = b.id) AS follower_count
            FROM board_follows bf
            JOIN boards b ON bf.board_id = b.id
            WHERE bf.user_id = ?
            ORDER BY bf.created_at DESC
            LIMIT ? OFFSET ?`,
            [userId, limit, offset]
        );

        // 전체 팔로우 게시판 수
        const totalResult = await query(
            'SELECT COUNT(*) as total FROM board_follows WHERE user_id = ?',
            [userId]
        );
        const total = totalResult[0].total;

        res.json({
            boards,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        logger.error('Get followed boards error:', error);
        res.status(500).json({ error: '팔로우 게시판 목록 조회 중 오류가 발생했습니다' });
    }
});

/**
 * @route   GET /api/follow/boards/popular
 * @desc    인기 게시판 목록 조회 (팔로워 수 기준)
 * @access  Private
 */
router.get('/boards/popular', async (req, res) => {
    const limit = parseInt(req.query.limit) || 10;

    try {
        const popularBoards = await query(
            `SELECT 
                b.id,
                b.name,
                b.description,
                COUNT(bf.id) AS follower_count,
                (SELECT COUNT(*) FROM posts WHERE board_id = b.id AND deleted = 0) AS post_count
            FROM boards b
            LEFT JOIN board_follows bf ON b.id = bf.board_id
            GROUP BY b.id, b.name, b.description
            ORDER BY follower_count DESC, post_count DESC
            LIMIT ?`,
            [limit]
        );

        res.json({
            boards: popularBoards
        });
    } catch (error) {
        logger.error('Get popular boards error:', error);
        res.status(500).json({ error: '인기 게시판 조회 중 오류가 발생했습니다' });
    }
});

/**
 * @route   GET /api/follow/feed/users
 * @desc    팔로우한 사용자들의 최근 게시물 조회 (피드)
 * @access  Private
 */
router.get('/feed/users', async (req, res) => {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    try {
        const posts = await query(
            `SELECT 
                p.id,
                p.title,
                p.content,
                p.user_id AS author_id,
                u.username AS author_username,
                u.display_name AS author_display_name,
                u.profile_image AS author_avatar,
                p.board_id,
                b.name AS board_name,
                p.created_at,
                p.view_count,
                p.upvotes,
                p.downvotes,
                (SELECT COUNT(*) FROM comments WHERE post_id = p.id) AS comment_count
            FROM posts p
            JOIN users u ON p.user_id = u.id
            JOIN boards b ON p.board_id = b.id
            WHERE p.deleted = 0
              AND p.user_id IN (
                  SELECT following_id FROM follows WHERE follower_id = ?
              )
            ORDER BY p.created_at DESC
            LIMIT ? OFFSET ?`,
            [userId, limit, offset]
        );

        // 전체 게시물 수
        const countResult = await query(
            `SELECT COUNT(*) AS total FROM posts p
            WHERE p.deleted = 0
              AND p.user_id IN (
                  SELECT following_id FROM follows WHERE follower_id = ?
              )`,
            [userId]
        );
        const total = countResult[0].total;

        res.json({
            posts,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        logger.error('Get user follow feed error:', error);
        res.status(500).json({ error: '사용자 피드 조회 중 오류가 발생했습니다' });
    }
});

/**
 * @route   GET /api/follow/feed/boards
 * @desc    팔로우한 게시판들의 최근 게시물 조회 (피드)
 * @access  Private
 */
router.get('/feed/boards', async (req, res) => {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    try {
        const posts = await query(
            `SELECT 
                p.id,
                p.title,
                p.content,
                p.user_id AS author_id,
                u.username AS author_username,
                u.display_name AS author_display_name,
                u.profile_image AS author_avatar,
                p.board_id,
                b.name AS board_name,
                p.created_at,
                p.view_count,
                p.upvotes,
                p.downvotes,
                (SELECT COUNT(*) FROM comments WHERE post_id = p.id) AS comment_count
            FROM posts p
            JOIN users u ON p.user_id = u.id
            JOIN boards b ON p.board_id = b.id
            WHERE p.deleted = 0
              AND p.board_id IN (
                  SELECT board_id FROM board_follows WHERE user_id = ?
              )
            ORDER BY p.created_at DESC
            LIMIT ? OFFSET ?`,
            [userId, limit, offset]
        );

        // 전체 게시물 수
        const countResult = await query(
            `SELECT COUNT(*) AS total FROM posts p
            WHERE p.deleted = 0
              AND p.board_id IN (
                  SELECT board_id FROM board_follows WHERE user_id = ?
              )`,
            [userId]
        );
        const total = countResult[0].total;

        res.json({
            posts,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        logger.error('Get board follow feed error:', error);
        res.status(500).json({ error: '게시판 피드 조회 중 오류가 발생했습니다' });
    }
});

export default router;
