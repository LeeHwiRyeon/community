/**
 * Moderator Tools Routes
 * 모더레이터 도구 - 게시물/댓글 관리, 사용자 제재, 신고 처리
 * 
 * @author AUTOAGENTS
 * @date 2025-11-11
 * @updated 2025-01-05 - 새로운 모더레이터 시스템 통합
 */

import express from 'express';
import { authenticateToken, requireModOrAdmin } from '../auth/jwt.js';
import { query } from '../db.js';
import logger from '../logger.js';
import moderatorService from '../services/moderator-service.js';

const router = express.Router();

// 모든 모더레이터 라우트는 인증 필요
router.use(authenticateToken);

/**
 * 모더레이터 권한 확인 미들웨어
 */
const checkModeratorPermission = (requiredPermission = null) => {
    return async (req, res, next) => {
        try {
            // 기존 권한 시스템 (requireModOrAdmin)과 호환
            if (req.user.role === 'admin' || req.user.role === 'moderator') {
                req.moderatorRole = req.user.role;
                return next();
            }

            // 새로운 권한 시스템 확인
            const { hasPermission, role } = await moderatorService.checkModeratorPermission(
                req.user.userId,
                req.body.boardId || req.query.boardId,
                requiredPermission
            );

            if (!hasPermission) {
                return res.status(403).json({
                    success: false,
                    error: '모더레이터 권한이 없습니다'
                });
            }

            req.moderatorRole = role;
            next();
        } catch (error) {
            logger.error('권한 확인 중 오류:', error);
            res.status(500).json({
                success: false,
                error: '권한 확인 실패'
            });
        }
    };
};

/**
 * GET /api/moderator/posts
 * 게시물 목록 조회 (신고된 게시물, 모든 게시물)
 */
router.get('/posts', checkModeratorPermission(), async (req, res) => {
    try {
        const {
            status = 'all', // all, reported, flagged, deleted
            page = 1,
            limit = 20,
            sortBy = 'created_at',
            order = 'DESC'
        } = req.query;

        const offset = (page - 1) * limit;
        let whereClause = '';
        const params = [];

        if (status === 'reported') {
            whereClause = 'WHERE p.id IN (SELECT DISTINCT post_id FROM reports WHERE target_type = "post")';
        } else if (status === 'flagged') {
            whereClause = 'WHERE p.is_flagged = 1';
        } else if (status === 'deleted') {
            whereClause = 'WHERE p.deleted = 1';
        } else if (status === 'active') {
            whereClause = 'WHERE p.deleted = 0';
        }

        const sql = `
            SELECT 
                p.*,
                u.username,
                u.display_name,
                (SELECT COUNT(*) FROM reports WHERE target_type = 'post' AND target_id = p.id) as report_count,
                (SELECT COUNT(*) FROM comments WHERE post_id = p.id AND deleted = 0) as comment_count
            FROM posts p
            LEFT JOIN users u ON p.user_id = u.id
            ${whereClause}
            ORDER BY p.${sortBy} ${order}
            LIMIT ? OFFSET ?
        `;

        params.push(parseInt(limit), parseInt(offset));
        const posts = await query(sql, params);

        // 총 개수 조회
        const countSql = `
            SELECT COUNT(*) as total
            FROM posts p
            ${whereClause}
        `;
        const [countResult] = await query(countSql);

        res.json({
            success: true,
            data: posts,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: countResult.total,
                totalPages: Math.ceil(countResult.total / parseInt(limit))
            }
        });
    } catch (error) {
        logger.error('Error fetching posts for moderation:', error);
        res.status(500).json({
            success: false,
            error: '게시물 목록을 불러오는데 실패했습니다.'
        });
    }
});

/**
 * GET /api/moderator/comments
 * 댓글 목록 조회
 */
router.get('/comments', async (req, res) => {
    try {
        const {
            status = 'all',
            page = 1,
            limit = 20,
            sortBy = 'created_at',
            order = 'DESC'
        } = req.query;

        const offset = (page - 1) * limit;
        let whereClause = '';
        const params = [];

        if (status === 'reported') {
            whereClause = 'WHERE c.id IN (SELECT DISTINCT comment_id FROM reports WHERE target_type = "comment")';
        } else if (status === 'deleted') {
            whereClause = 'WHERE c.deleted = 1';
        } else if (status === 'active') {
            whereClause = 'WHERE c.deleted = 0';
        }

        const sql = `
            SELECT 
                c.*,
                u.username,
                u.display_name,
                p.title as post_title,
                (SELECT COUNT(*) FROM reports WHERE target_type = 'comment' AND target_id = c.id) as report_count
            FROM comments c
            LEFT JOIN users u ON c.user_id = u.id
            LEFT JOIN posts p ON c.post_id = p.id
            ${whereClause}
            ORDER BY c.${sortBy} ${order}
            LIMIT ? OFFSET ?
        `;

        params.push(parseInt(limit), parseInt(offset));
        const comments = await query(sql, params);

        const countSql = `
            SELECT COUNT(*) as total
            FROM comments c
            ${whereClause}
        `;
        const [countResult] = await query(countSql);

        res.json({
            success: true,
            data: comments,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: countResult.total,
                totalPages: Math.ceil(countResult.total / parseInt(limit))
            }
        });
    } catch (error) {
        logger.error('Error fetching comments for moderation:', error);
        res.status(500).json({
            success: false,
            error: '댓글 목록을 불러오는데 실패했습니다.'
        });
    }
});

/**
 * POST /api/moderator/posts/:id/delete
 * 게시물 삭제
 */
router.post('/posts/:id/delete', async (req, res) => {
    try {
        const { id } = req.params;
        const { reason, permanent = false } = req.body;
        const moderatorId = req.user.userId;

        // 게시물 조회
        const [post] = await query('SELECT * FROM posts WHERE id = ?', [id]);
        if (!post) {
            return res.status(404).json({
                success: false,
                error: '게시물을 찾을 수 없습니다.'
            });
        }

        if (permanent) {
            // 영구 삭제 (관리자만)
            if (req.user.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    error: '영구 삭제는 관리자만 가능합니다.'
                });
            }
            await query('DELETE FROM posts WHERE id = ?', [id]);
        } else {
            // 소프트 삭제
            await query('UPDATE posts SET deleted = 1, deleted_at = NOW() WHERE id = ?', [id]);
        }

        // 모더레이션 로그 기록
        await query(`
            INSERT INTO moderation_logs (
                moderator_id, action_type, target_type, target_id, reason, created_at
            ) VALUES (?, ?, ?, ?, ?, NOW())
        `, [moderatorId, permanent ? 'delete_permanent' : 'delete', 'post', id, reason || null]);

        logger.info(`Post ${id} deleted by moderator ${moderatorId}`);

        res.json({
            success: true,
            message: permanent ? '게시물이 영구 삭제되었습니다.' : '게시물이 삭제되었습니다.'
        });
    } catch (error) {
        logger.error('Error deleting post:', error);
        res.status(500).json({
            success: false,
            error: '게시물 삭제에 실패했습니다.'
        });
    }
});

/**
 * POST /api/moderator/posts/:id/restore
 * 게시물 복구
 */
router.post('/posts/:id/restore', async (req, res) => {
    try {
        const { id } = req.params;
        const moderatorId = req.user.userId;

        const [post] = await query('SELECT * FROM posts WHERE id = ?', [id]);
        if (!post) {
            return res.status(404).json({
                success: false,
                error: '게시물을 찾을 수 없습니다.'
            });
        }

        await query('UPDATE posts SET deleted = 0, deleted_at = NULL WHERE id = ?', [id]);

        // 모더레이션 로그
        await query(`
            INSERT INTO moderation_logs (
                moderator_id, action_type, target_type, target_id, created_at
            ) VALUES (?, ?, ?, ?, NOW())
        `, [moderatorId, 'restore', 'post', id]);

        logger.info(`Post ${id} restored by moderator ${moderatorId}`);

        res.json({
            success: true,
            message: '게시물이 복구되었습니다.'
        });
    } catch (error) {
        logger.error('Error restoring post:', error);
        res.status(500).json({
            success: false,
            error: '게시물 복구에 실패했습니다.'
        });
    }
});

/**
 * POST /api/moderator/comments/:id/delete
 * 댓글 삭제
 */
router.post('/comments/:id/delete', async (req, res) => {
    try {
        const { id } = req.params;
        const { reason, permanent = false } = req.body;
        const moderatorId = req.user.userId;

        const [comment] = await query('SELECT * FROM comments WHERE id = ?', [id]);
        if (!comment) {
            return res.status(404).json({
                success: false,
                error: '댓글을 찾을 수 없습니다.'
            });
        }

        if (permanent) {
            if (req.user.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    error: '영구 삭제는 관리자만 가능합니다.'
                });
            }
            await query('DELETE FROM comments WHERE id = ?', [id]);
        } else {
            await query('UPDATE comments SET deleted = 1 WHERE id = ?', [id]);
        }

        // 모더레이션 로그
        await query(`
            INSERT INTO moderation_logs (
                moderator_id, action_type, target_type, target_id, reason, created_at
            ) VALUES (?, ?, ?, ?, ?, NOW())
        `, [moderatorId, permanent ? 'delete_permanent' : 'delete', 'comment', id, reason || null]);

        logger.info(`Comment ${id} deleted by moderator ${moderatorId}`);

        res.json({
            success: true,
            message: permanent ? '댓글이 영구 삭제되었습니다.' : '댓글이 삭제되었습니다.'
        });
    } catch (error) {
        logger.error('Error deleting comment:', error);
        res.status(500).json({
            success: false,
            error: '댓글 삭제에 실패했습니다.'
        });
    }
});

/**
 * POST /api/moderator/comments/:id/restore
 * 댓글 복구
 */
router.post('/comments/:id/restore', async (req, res) => {
    try {
        const { id } = req.params;
        const moderatorId = req.user.userId;

        const [comment] = await query('SELECT * FROM comments WHERE id = ?', [id]);
        if (!comment) {
            return res.status(404).json({
                success: false,
                error: '댓글을 찾을 수 없습니다.'
            });
        }

        await query('UPDATE comments SET deleted = 0 WHERE id = ?', [id]);

        // 모더레이션 로그
        await query(`
            INSERT INTO moderation_logs (
                moderator_id, action_type, target_type, target_id, created_at
            ) VALUES (?, ?, ?, ?, NOW())
        `, [moderatorId, 'restore', 'comment', id]);

        logger.info(`Comment ${id} restored by moderator ${moderatorId}`);

        res.json({
            success: true,
            message: '댓글이 복구되었습니다.'
        });
    } catch (error) {
        logger.error('Error restoring comment:', error);
        res.status(500).json({
            success: false,
            error: '댓글 복구에 실패했습니다.'
        });
    }
});

/**
 * GET /api/moderator/users
 * 사용자 목록 조회
 */
router.get('/users', async (req, res) => {
    try {
        const {
            status = 'all', // all, active, banned, restricted
            page = 1,
            limit = 20,
            search = ''
        } = req.query;

        const offset = (page - 1) * limit;
        let whereClause = 'WHERE 1=1';
        const params = [];

        if (status === 'banned') {
            whereClause += ' AND u.is_banned = 1';
        } else if (status === 'restricted') {
            whereClause += ' AND u.is_restricted = 1';
        } else if (status === 'active') {
            whereClause += ' AND u.is_banned = 0 AND u.is_restricted = 0';
        }

        if (search) {
            whereClause += ' AND (u.username LIKE ? OR u.email LIKE ? OR u.display_name LIKE ?)';
            const searchPattern = `%${search}%`;
            params.push(searchPattern, searchPattern, searchPattern);
        }

        const sql = `
            SELECT 
                u.id,
                u.username,
                u.email,
                u.display_name,
                u.role,
                u.is_banned,
                u.is_restricted,
                u.created_at,
                (SELECT COUNT(*) FROM posts WHERE user_id = u.id AND deleted = 0) as post_count,
                (SELECT COUNT(*) FROM comments WHERE user_id = u.id AND deleted = 0) as comment_count,
                (SELECT COUNT(*) FROM reports WHERE reported_user_id = u.id) as report_count
            FROM users u
            ${whereClause}
            ORDER BY u.created_at DESC
            LIMIT ? OFFSET ?
        `;

        params.push(parseInt(limit), parseInt(offset));
        const users = await query(sql, params);

        const countSql = `
            SELECT COUNT(*) as total
            FROM users u
            ${whereClause.replace(/\?/g, () => params.shift())}
        `;
        const [countResult] = await query(countSql);

        res.json({
            success: true,
            data: users,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: countResult.total,
                totalPages: Math.ceil(countResult.total / parseInt(limit))
            }
        });
    } catch (error) {
        logger.error('Error fetching users:', error);
        res.status(500).json({
            success: false,
            error: '사용자 목록을 불러오는데 실패했습니다.'
        });
    }
});

/**
 * POST /api/moderator/users/:id/ban
 * 사용자 차단
 */
router.post('/users/:id/ban', async (req, res) => {
    try {
        const { id } = req.params;
        const { reason, duration } = req.body; // duration in days, null for permanent
        const moderatorId = req.user.userId;

        const [user] = await query('SELECT * FROM users WHERE id = ?', [id]);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: '사용자를 찾을 수 없습니다.'
            });
        }

        // 관리자는 차단할 수 없음
        if (user.role === 'admin') {
            return res.status(403).json({
                success: false,
                error: '관리자는 차단할 수 없습니다.'
            });
        }

        // 모더레이터는 다른 모더레이터를 차단할 수 없음
        if (user.role === 'moderator' && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: '모더레이터는 다른 모더레이터를 차단할 수 없습니다.'
            });
        }

        const bannedUntil = duration ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000) : null;

        await query(`
            UPDATE users 
            SET is_banned = 1, 
                banned_until = ?,
                banned_reason = ?
            WHERE id = ?
        `, [bannedUntil, reason || null, id]);

        // 모더레이션 로그
        await query(`
            INSERT INTO moderation_logs (
                moderator_id, action_type, target_type, target_id, reason, metadata, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, NOW())
        `, [moderatorId, 'ban', 'user', id, reason || null, JSON.stringify({ duration, banned_until: bannedUntil })]);

        logger.info(`User ${id} banned by moderator ${moderatorId}`);

        res.json({
            success: true,
            message: duration ? `사용자가 ${duration}일간 차단되었습니다.` : '사용자가 영구 차단되었습니다.'
        });
    } catch (error) {
        logger.error('Error banning user:', error);
        res.status(500).json({
            success: false,
            error: '사용자 차단에 실패했습니다.'
        });
    }
});

/**
 * POST /api/moderator/users/:id/unban
 * 사용자 차단 해제
 */
router.post('/users/:id/unban', async (req, res) => {
    try {
        const { id } = req.params;
        const moderatorId = req.user.userId;

        const [user] = await query('SELECT * FROM users WHERE id = ?', [id]);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: '사용자를 찾을 수 없습니다.'
            });
        }

        await query(`
            UPDATE users 
            SET is_banned = 0, 
                banned_until = NULL,
                banned_reason = NULL
            WHERE id = ?
        `, [id]);

        // 모더레이션 로그
        await query(`
            INSERT INTO moderation_logs (
                moderator_id, action_type, target_type, target_id, created_at
            ) VALUES (?, ?, ?, ?, NOW())
        `, [moderatorId, 'unban', 'user', id]);

        logger.info(`User ${id} unbanned by moderator ${moderatorId}`);

        res.json({
            success: true,
            message: '사용자 차단이 해제되었습니다.'
        });
    } catch (error) {
        logger.error('Error unbanning user:', error);
        res.status(500).json({
            success: false,
            error: '차단 해제에 실패했습니다.'
        });
    }
});

/**
 * POST /api/moderator/users/:id/restrict
 * 사용자 제한 (글쓰기/댓글 제한)
 */
router.post('/users/:id/restrict', async (req, res) => {
    try {
        const { id } = req.params;
        const { reason, restrictions } = req.body; // restrictions: { posting: boolean, commenting: boolean }
        const moderatorId = req.user.userId;

        const [user] = await query('SELECT * FROM users WHERE id = ?', [id]);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: '사용자를 찾을 수 없습니다.'
            });
        }

        if (user.role === 'admin' || (user.role === 'moderator' && req.user.role !== 'admin')) {
            return res.status(403).json({
                success: false,
                error: '권한이 없습니다.'
            });
        }

        await query(`
            UPDATE users 
            SET is_restricted = 1,
                restriction_settings = ?
            WHERE id = ?
        `, [JSON.stringify(restrictions), id]);

        // 모더레이션 로그
        await query(`
            INSERT INTO moderation_logs (
                moderator_id, action_type, target_type, target_id, reason, metadata, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, NOW())
        `, [moderatorId, 'restrict', 'user', id, reason || null, JSON.stringify(restrictions)]);

        logger.info(`User ${id} restricted by moderator ${moderatorId}`);

        res.json({
            success: true,
            message: '사용자가 제한되었습니다.'
        });
    } catch (error) {
        logger.error('Error restricting user:', error);
        res.status(500).json({
            success: false,
            error: '사용자 제한에 실패했습니다.'
        });
    }
});

/**
 * POST /api/moderator/users/:id/unrestrict
 * 사용자 제한 해제
 */
router.post('/users/:id/unrestrict', async (req, res) => {
    try {
        const { id } = req.params;
        const moderatorId = req.user.userId;

        const [user] = await query('SELECT * FROM users WHERE id = ?', [id]);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: '사용자를 찾을 수 없습니다.'
            });
        }

        await query(`
            UPDATE users 
            SET is_restricted = 0,
                restriction_settings = NULL
            WHERE id = ?
        `, [id]);

        // 모더레이션 로그
        await query(`
            INSERT INTO moderation_logs (
                moderator_id, action_type, target_type, target_id, created_at
            ) VALUES (?, ?, ?, ?, NOW())
        `, [moderatorId, 'unrestrict', 'user', id]);

        logger.info(`User ${id} unrestricted by moderator ${moderatorId}`);

        res.json({
            success: true,
            message: '사용자 제한이 해제되었습니다.'
        });
    } catch (error) {
        logger.error('Error unrestricting user:', error);
        res.status(500).json({
            success: false,
            error: '제한 해제에 실패했습니다.'
        });
    }
});

/**
 * GET /api/moderator/logs
 * 모더레이션 로그 조회
 */
router.get('/logs', async (req, res) => {
    try {
        const {
            page = 1,
            limit = 50,
            action_type = '',
            target_type = '',
            moderator_id = ''
        } = req.query;

        const offset = (page - 1) * limit;
        let whereClause = 'WHERE 1=1';
        const params = [];

        if (action_type) {
            whereClause += ' AND ml.action_type = ?';
            params.push(action_type);
        }

        if (target_type) {
            whereClause += ' AND ml.target_type = ?';
            params.push(target_type);
        }

        if (moderator_id) {
            whereClause += ' AND ml.moderator_id = ?';
            params.push(moderator_id);
        }

        const sql = `
            SELECT 
                ml.*,
                u.username as moderator_username,
                u.display_name as moderator_display_name
            FROM moderation_logs ml
            LEFT JOIN users u ON ml.moderator_id = u.id
            ${whereClause}
            ORDER BY ml.created_at DESC
            LIMIT ? OFFSET ?
        `;

        params.push(parseInt(limit), parseInt(offset));
        const logs = await query(sql, params);

        const countSql = `
            SELECT COUNT(*) as total
            FROM moderation_logs ml
            ${whereClause}
        `;
        const [countResult] = await query(countSql, params.slice(0, -2));

        res.json({
            success: true,
            data: logs,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: countResult.total,
                totalPages: Math.ceil(countResult.total / parseInt(limit))
            }
        });
    } catch (error) {
        logger.error('Error fetching moderation logs:', error);
        res.status(500).json({
            success: false,
            error: '모더레이션 로그를 불러오는데 실패했습니다.'
        });
    }
});

/**
 * GET /api/moderator/stats
 * 모더레이션 통계
 */
router.get('/stats', checkModeratorPermission(), async (req, res) => {
    try {
        const [stats] = await query(`
            SELECT 
                (SELECT COUNT(*) FROM posts WHERE deleted = 0) as active_posts,
                (SELECT COUNT(*) FROM posts WHERE deleted = 1) as deleted_posts,
                (SELECT COUNT(*) FROM comments WHERE deleted = 0) as active_comments,
                (SELECT COUNT(*) FROM comments WHERE deleted = 1) as deleted_comments,
                (SELECT COUNT(*) FROM users WHERE is_banned = 1) as banned_users,
                (SELECT COUNT(*) FROM users WHERE is_restricted = 1) as restricted_users,
                (SELECT COUNT(*) FROM reports WHERE status = 'pending') as pending_reports,
                (SELECT COUNT(*) FROM moderation_logs WHERE DATE(created_at) = CURDATE()) as actions_today
        `);

        res.json({
            success: true,
            stats
        });
    } catch (error) {
        logger.error('Error fetching moderation stats:', error);
        res.status(500).json({
            success: false,
            error: '통계를 불러오는데 실패했습니다.'
        });
    }
});

// ==================== 새로운 모더레이터 시스템 라우트 ====================

/**
 * POST /api/moderator/roles
 * 모더레이터 권한 부여
 */
router.post('/roles', checkModeratorPermission('manage_moderators'), async (req, res) => {
    try {
        const { userId, boardId, role, permissions, expiresAt } = req.body;

        if (!userId || !role) {
            return res.status(400).json({
                success: false,
                error: '필수 정보가 누락되었습니다'
            });
        }

        const result = await moderatorService.assignModeratorRole(
            userId,
            req.user.userId,
            boardId,
            role,
            permissions,
            expiresAt
        );

        res.json(result);
    } catch (error) {
        logger.error('모더레이터 권한 부여 실패:', error);
        res.status(500).json({
            success: false,
            error: error.message || '모더레이터 권한 부여 실패'
        });
    }
});

/**
 * POST /api/moderator/warnings
 * 사용자 경고 발행
 */
router.post('/warnings', checkModeratorPermission('warn_users'), async (req, res) => {
    try {
        const { userId, reason, severity, postId, commentId, expiresAt } = req.body;

        if (!userId || !reason) {
            return res.status(400).json({
                success: false,
                error: '필수 정보가 누락되었습니다'
            });
        }

        const result = await moderatorService.issueWarning(
            userId,
            req.user.userId,
            reason,
            severity,
            postId,
            commentId,
            expiresAt
        );

        res.json(result);
    } catch (error) {
        logger.error('경고 발행 실패:', error);
        res.status(500).json({
            success: false,
            error: error.message || '경고 발행 실패'
        });
    }
});

/**
 * POST /api/moderator/bans-v2
 * 사용자 차단 (새 시스템)
 */
router.post('/bans-v2', checkModeratorPermission('ban_users'), async (req, res) => {
    try {
        const { userId, reason, banType, endTime, boardId } = req.body;

        if (!userId || !reason || !banType) {
            return res.status(400).json({
                success: false,
                error: '필수 정보가 누락되었습니다'
            });
        }

        const result = await moderatorService.banUser(
            userId,
            req.user.userId,
            reason,
            banType,
            endTime,
            boardId
        );

        await moderatorService.logModeratorAction(
            req.user.userId,
            'ban',
            'user',
            userId,
            reason,
            { banType, endTime, boardId },
            req.ip,
            req.headers['user-agent']
        );

        res.json(result);
    } catch (error) {
        logger.error('사용자 차단 실패:', error);
        res.status(500).json({
            success: false,
            error: error.message || '사용자 차단 실패'
        });
    }
});

/**
 * DELETE /api/moderator/bans-v2/:userId
 * 사용자 차단 해제 (새 시스템)
 */
router.delete('/bans-v2/:userId', checkModeratorPermission('ban_users'), async (req, res) => {
    try {
        const { userId } = req.params;
        const { reason } = req.body;

        if (!reason) {
            return res.status(400).json({
                success: false,
                error: '해제 사유를 입력해주세요'
            });
        }

        const result = await moderatorService.unbanUser(
            parseInt(userId),
            req.user.userId,
            reason
        );

        res.json(result);
    } catch (error) {
        logger.error('차단 해제 실패:', error);
        res.status(500).json({
            success: false,
            error: error.message || '차단 해제 실패'
        });
    }
});

/**
 * POST /api/moderator/reports-v2
 * 콘텐츠 신고 (일반 사용자 + 새 시스템)
 */
router.post('/reports-v2', async (req, res) => {
    try {
        const { reportedUserId, contentType, contentId, reason, description } = req.body;

        if (!reportedUserId || !contentType || !contentId || !reason) {
            return res.status(400).json({
                success: false,
                error: '필수 정보가 누락되었습니다'
            });
        }

        const result = await moderatorService.reportContent(
            req.user.userId,
            reportedUserId,
            contentType,
            contentId,
            reason,
            description
        );

        res.json(result);
    } catch (error) {
        logger.error('콘텐츠 신고 실패:', error);
        res.status(500).json({
            success: false,
            error: error.message || '신고 접수 실패'
        });
    }
});

/**
 * GET /api/moderator/reports-v2
 * 신고 목록 조회 (새 시스템)
 */
router.get('/reports-v2', checkModeratorPermission('view_reports'), async (req, res) => {
    try {
        const { status, priority, contentType, limit = 50, offset = 0 } = req.query;

        const result = await moderatorService.getReports(
            status,
            priority,
            contentType,
            parseInt(limit),
            parseInt(offset)
        );

        res.json(result);
    } catch (error) {
        logger.error('신고 목록 조회 실패:', error);
        res.status(500).json({
            success: false,
            error: '신고 목록 조회 실패'
        });
    }
});

/**
 * PUT /api/moderator/reports-v2/:reportId/resolve
 * 신고 처리
 */
router.put('/reports-v2/:reportId/resolve', checkModeratorPermission('resolve_reports'), async (req, res) => {
    try {
        const { reportId } = req.params;
        const { action, note } = req.body;

        if (!action) {
            return res.status(400).json({
                success: false,
                error: '처리 결과를 선택해주세요'
            });
        }

        const result = await moderatorService.resolveReport(
            parseInt(reportId),
            req.user.userId,
            action,
            note
        );

        await moderatorService.logModeratorAction(
            req.user.userId,
            'resolve_report',
            'report',
            parseInt(reportId),
            action,
            { note },
            req.ip,
            req.headers['user-agent']
        );

        res.json(result);
    } catch (error) {
        logger.error('신고 처리 실패:', error);
        res.status(500).json({
            success: false,
            error: '신고 처리 실패'
        });
    }
});

/**
 * GET /api/moderator/reports-v2/pending/summary
 * 미처리 신고 요약
 */
router.get('/reports-v2/pending/summary', checkModeratorPermission('view_reports'), async (req, res) => {
    try {
        const summary = await moderatorService.getPendingReportsSummary();

        res.json({
            success: true,
            summary
        });
    } catch (error) {
        logger.error('미처리 신고 요약 조회 실패:', error);
        res.status(500).json({
            success: false,
            error: '요약 정보 조회 실패'
        });
    }
});

/**
 * GET /api/moderator/bans-v2/check/:userId
 * 사용자 차단 상태 확인
 */
router.get('/bans-v2/check/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { boardId } = req.query;

        const banStatus = await moderatorService.checkUserBanStatus(
            parseInt(userId),
            boardId ? parseInt(boardId) : null
        );

        res.json({
            success: true,
            ...banStatus
        });
    } catch (error) {
        logger.error('차단 상태 확인 실패:', error);
        res.status(500).json({
            success: false,
            error: '차단 상태 확인 실패'
        });
    }
});

/**
 * GET /api/moderator/statistics-v2
 * 모더레이터 통계 (새 시스템)
 */
router.get('/statistics-v2', checkModeratorPermission(), async (req, res) => {
    try {
        const { moderatorId } = req.query;

        const stats = await moderatorService.getModeratorStatistics(
            moderatorId ? parseInt(moderatorId) : null
        );

        res.json({
            success: true,
            statistics: stats
        });
    } catch (error) {
        logger.error('모더레이터 통계 조회 실패:', error);
        res.status(500).json({
            success: false,
            error: '통계 조회 실패'
        });
    }
});

export default router;
