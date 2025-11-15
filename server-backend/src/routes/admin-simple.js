/**
 * 관리자 대시보드 API (SQLite 기반)
 * 사용자 관리, 콘텐츠 모니터링, 통계 정보 제공
 */

import express from 'express';
import { query } from '../db.js';
import { buildAuthMiddleware } from '../auth/jwt.js';

const router = express.Router();
const authMiddleware = buildAuthMiddleware();

// 관리자 권한 확인 미들웨어
const requireAdmin = async (req, res, next) => {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: '관리자 권한이 필요합니다',
            });
        }
        next();
    } catch (error) {
        res.status(403).json({
            success: false,
            message: '권한 확인 중 오류가 발생했습니다',
        });
    }
};

/**
 * GET /api/admin-simple/stats
 * 전체 통계 조회
 */
router.get('/stats', authMiddleware, requireAdmin, async (req, res) => {
    try {
        // 전체 통계
        const [userCount] = await query(
            `SELECT COUNT(*) as total, 
                    SUM(CASE WHEN is_online = 1 THEN 1 ELSE 0 END) as online
             FROM users WHERE deleted_at IS NULL`
        );

        const [postCount] = await query(
            `SELECT COUNT(*) as total,
                    COUNT(CASE WHEN created_at >= datetime('now', '-1 day') THEN 1 END) as today
             FROM posts WHERE deleted_at IS NULL`
        );

        const [commentCount] = await query(
            `SELECT COUNT(*) as total,
                    COUNT(CASE WHEN created_at >= datetime('now', '-1 day') THEN 1 END) as today
             FROM comments WHERE deleted_at IS NULL`
        );

        const [postLikeCount] = await query(
            `SELECT COUNT(*) as total FROM post_likes`
        );

        // 최근 7일 활동 추세
        const recentActivity = await query(
            `SELECT 
                date(created_at) as date,
                COUNT(*) as count
             FROM posts
             WHERE created_at >= datetime('now', '-7 days') AND deleted_at IS NULL
             GROUP BY date(created_at)
             ORDER BY date DESC`
        );

        // 인기 게시글 (조회수 기준)
        const topPosts = await query(
            `SELECT 
                p.id, p.title, p.view_count, p.created_at,
                u.username, u.display_name
             FROM posts p
             LEFT JOIN users u ON p.user_id = u.id
             WHERE p.deleted_at IS NULL
             ORDER BY p.view_count DESC
             LIMIT 5`
        );

        // 활동적인 사용자
        const activeUsers = await query(
            `SELECT 
                u.id, u.username, u.display_name, u.avatar_url,
                COUNT(p.id) as post_count
             FROM users u
             LEFT JOIN posts p ON u.id = p.user_id AND p.deleted_at IS NULL
             WHERE u.deleted_at IS NULL
             GROUP BY u.id
             ORDER BY post_count DESC
             LIMIT 5`
        );

        res.json({
            success: true,
            stats: {
                users: {
                    total: userCount?.total || 0,
                    online: userCount?.online || 0,
                },
                posts: {
                    total: postCount?.total || 0,
                    today: postCount?.today || 0,
                },
                comments: {
                    total: commentCount?.total || 0,
                    today: commentCount?.today || 0,
                },
                likes: {
                    total: postLikeCount?.total || 0,
                },
                recentActivity,
                topPosts,
                activeUsers,
            },
        });
    } catch (error) {
        console.error('Get admin stats error:', error);
        res.status(500).json({
            success: false,
            message: '통계 조회 중 오류가 발생했습니다',
            error: error.message,
        });
    }
});

/**
 * GET /api/admin-simple/users
 * 사용자 목록 조회
 */
router.get('/users', authMiddleware, requireAdmin, async (req, res) => {
    try {
        const {
            limit = 20,
            offset = 0,
            search = '',
            sortBy = 'created_at',
            order = 'DESC',
        } = req.query;

        let whereClause = 'WHERE u.deleted_at IS NULL';
        const params = [];

        if (search) {
            whereClause += ' AND (u.username LIKE ? OR u.email LIKE ? OR u.display_name LIKE ?)';
            const searchPattern = `%${search}%`;
            params.push(searchPattern, searchPattern, searchPattern);
        }

        const orderClause = `ORDER BY u.${sortBy} ${order}`;

        const users = await query(
            `SELECT 
                u.id, u.username, u.email, u.display_name, u.avatar_url,
                u.role, u.is_online, u.created_at, u.last_seen,
                (SELECT COUNT(*) FROM posts WHERE user_id = u.id AND deleted_at IS NULL) as post_count,
                (SELECT COUNT(*) FROM comments WHERE user_id = u.id AND deleted_at IS NULL) as comment_count
             FROM users u
             ${whereClause}
             ${orderClause}
             LIMIT ? OFFSET ?`,
            [...params, parseInt(limit), parseInt(offset)]
        );

        const [countResult] = await query(
            `SELECT COUNT(*) as total FROM users u ${whereClause}`,
            params
        );

        res.json({
            success: true,
            users,
            total: countResult?.total || 0,
            hasMore: (countResult?.total || 0) > parseInt(offset) + users.length,
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            message: '사용자 목록 조회 중 오류가 발생했습니다',
            error: error.message,
        });
    }
});

/**
 * PUT /api/admin-simple/users/:userId/role
 * 사용자 역할 변경
 */
router.put('/users/:userId/role', authMiddleware, requireAdmin, async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        const { role } = req.body;

        if (!['user', 'admin', 'moderator'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: '유효하지 않은 역할입니다',
            });
        }

        await query(
            `UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            [role, userId]
        );

        res.json({
            success: true,
            message: '사용자 역할이 변경되었습니다',
        });
    } catch (error) {
        console.error('Update user role error:', error);
        res.status(500).json({
            success: false,
            message: '사용자 역할 변경 중 오류가 발생했습니다',
            error: error.message,
        });
    }
});

/**
 * DELETE /api/admin-simple/users/:userId
 * 사용자 삭제 (soft delete)
 */
router.delete('/users/:userId', authMiddleware, requireAdmin, async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);

        // 자기 자신은 삭제할 수 없음
        if (userId === req.user.id) {
            return res.status(400).json({
                success: false,
                message: '자기 자신은 삭제할 수 없습니다',
            });
        }

        await query(
            `UPDATE users SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?`,
            [userId]
        );

        res.json({
            success: true,
            message: '사용자가 삭제되었습니다',
        });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({
            success: false,
            message: '사용자 삭제 중 오류가 발생했습니다',
            error: error.message,
        });
    }
});

/**
 * GET /api/admin-simple/posts
 * 게시글 목록 조회 (관리자용)
 */
router.get('/posts', authMiddleware, requireAdmin, async (req, res) => {
    try {
        const {
            limit = 20,
            offset = 0,
            search = '',
            sortBy = 'created_at',
            order = 'DESC',
        } = req.query;

        let whereClause = 'WHERE p.deleted_at IS NULL';
        const params = [];

        if (search) {
            whereClause += ' AND (p.title LIKE ? OR p.content LIKE ?)';
            const searchPattern = `%${search}%`;
            params.push(searchPattern, searchPattern);
        }

        const orderClause = `ORDER BY p.${sortBy} ${order}`;

        const posts = await query(
            `SELECT 
                p.id, p.title, p.content, p.view_count, p.created_at, p.updated_at,
                u.id as author_id, u.username as author_username, u.display_name as author_display_name,
                (SELECT COUNT(*) FROM comments WHERE post_id = p.id AND deleted_at IS NULL) as comment_count,
                (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) as like_count
             FROM posts p
             LEFT JOIN users u ON p.user_id = u.id
             ${whereClause}
             ${orderClause}
             LIMIT ? OFFSET ?`,
            [...params, parseInt(limit), parseInt(offset)]
        );

        const [countResult] = await query(
            `SELECT COUNT(*) as total FROM posts p ${whereClause}`,
            params
        );

        res.json({
            success: true,
            posts,
            total: countResult?.total || 0,
            hasMore: (countResult?.total || 0) > parseInt(offset) + posts.length,
        });
    } catch (error) {
        console.error('Get posts error:', error);
        res.status(500).json({
            success: false,
            message: '게시글 목록 조회 중 오류가 발생했습니다',
            error: error.message,
        });
    }
});

/**
 * DELETE /api/admin-simple/posts/:postId
 * 게시글 삭제 (관리자)
 */
router.delete('/posts/:postId', authMiddleware, requireAdmin, async (req, res) => {
    try {
        const postId = parseInt(req.params.postId);

        await query(
            `UPDATE posts SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?`,
            [postId]
        );

        res.json({
            success: true,
            message: '게시글이 삭제되었습니다',
        });
    } catch (error) {
        console.error('Delete post error:', error);
        res.status(500).json({
            success: false,
            message: '게시글 삭제 중 오류가 발생했습니다',
            error: error.message,
        });
    }
});

/**
 * GET /api/admin-simple/comments
 * 댓글 목록 조회 (관리자용)
 */
router.get('/comments', authMiddleware, requireAdmin, async (req, res) => {
    try {
        const {
            limit = 20,
            offset = 0,
            search = '',
        } = req.query;

        let whereClause = 'WHERE c.deleted_at IS NULL';
        const params = [];

        if (search) {
            whereClause += ' AND c.content LIKE ?';
            params.push(`%${search}%`);
        }

        const comments = await query(
            `SELECT 
                c.id, c.content, c.post_id, c.created_at,
                u.id as author_id, u.username as author_username, u.display_name as author_display_name,
                p.title as post_title,
                (SELECT COUNT(*) FROM comment_likes WHERE comment_id = c.id) as like_count
             FROM comments c
             LEFT JOIN users u ON c.user_id = u.id
             LEFT JOIN posts p ON c.post_id = p.id
             ${whereClause}
             ORDER BY c.created_at DESC
             LIMIT ? OFFSET ?`,
            [...params, parseInt(limit), parseInt(offset)]
        );

        const [countResult] = await query(
            `SELECT COUNT(*) as total FROM comments c ${whereClause}`,
            params
        );

        res.json({
            success: true,
            comments,
            total: countResult?.total || 0,
            hasMore: (countResult?.total || 0) > parseInt(offset) + comments.length,
        });
    } catch (error) {
        console.error('Get comments error:', error);
        res.status(500).json({
            success: false,
            message: '댓글 목록 조회 중 오류가 발생했습니다',
            error: error.message,
        });
    }
});

/**
 * DELETE /api/admin-simple/comments/:commentId
 * 댓글 삭제 (관리자)
 */
router.delete('/comments/:commentId', authMiddleware, requireAdmin, async (req, res) => {
    try {
        const commentId = parseInt(req.params.commentId);

        await query(
            `UPDATE comments SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?`,
            [commentId]
        );

        res.json({
            success: true,
            message: '댓글이 삭제되었습니다',
        });
    } catch (error) {
        console.error('Delete comment error:', error);
        res.status(500).json({
            success: false,
            message: '댓글 삭제 중 오류가 발생했습니다',
            error: error.message,
        });
    }
});

/**
 * GET /api/admin-simple/activity
 * 최근 활동 로그
 */
router.get('/activity', authMiddleware, requireAdmin, async (req, res) => {
    try {
        const { limit = 50 } = req.query;

        // 최근 게시글
        const recentPosts = await query(
            `SELECT 
                'post' as type,
                p.id,
                p.title as content,
                p.created_at,
                u.username, u.display_name
             FROM posts p
             LEFT JOIN users u ON p.user_id = u.id
             WHERE p.deleted_at IS NULL
             ORDER BY p.created_at DESC
             LIMIT ?`,
            [parseInt(limit) / 2]
        );

        // 최근 댓글
        const recentComments = await query(
            `SELECT 
                'comment' as type,
                c.id,
                c.content,
                c.created_at,
                u.username, u.display_name
             FROM comments c
             LEFT JOIN users u ON c.user_id = u.id
             WHERE c.deleted_at IS NULL
             ORDER BY c.created_at DESC
             LIMIT ?`,
            [parseInt(limit) / 2]
        );

        // 합치고 정렬
        const activities = [...recentPosts, ...recentComments]
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, parseInt(limit));

        res.json({
            success: true,
            activities,
        });
    } catch (error) {
        console.error('Get activity error:', error);
        res.status(500).json({
            success: false,
            message: '활동 로그 조회 중 오류가 발생했습니다',
            error: error.message,
        });
    }
});

export default router;
