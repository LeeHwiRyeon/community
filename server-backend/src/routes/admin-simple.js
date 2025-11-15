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

/**
 * GET /api/admin-simple/realtime-stats
 * 실시간 통계 조회 (최근 1시간)
 */
router.get('/realtime-stats', authMiddleware, requireAdmin, async (req, res) => {
    try {
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        // 최근 1시간 활동
        const [recentPosts] = await query(
            `SELECT COUNT(*) as count FROM posts 
             WHERE created_at >= datetime('now', '-1 hour') AND deleted_at IS NULL`
        );

        const [recentComments] = await query(
            `SELECT COUNT(*) as count FROM comments 
             WHERE created_at >= datetime('now', '-1 hour') AND deleted_at IS NULL`
        );

        const [recentUsers] = await query(
            `SELECT COUNT(*) as count FROM users 
             WHERE created_at >= datetime('now', '-1 hour') AND deleted_at IS NULL`
        );

        // 현재 온라인 사용자
        const [onlineUsers] = await query(
            `SELECT COUNT(*) as count FROM users 
             WHERE is_online = 1 AND deleted_at IS NULL`
        );

        // 최근 24시간 추이 (시간별)
        const hourlyActivity = await query(
            `SELECT 
                strftime('%H', created_at) as hour,
                COUNT(*) as count,
                'post' as type
             FROM posts 
             WHERE created_at >= datetime('now', '-24 hours') AND deleted_at IS NULL
             GROUP BY hour
             UNION ALL
             SELECT 
                strftime('%H', created_at) as hour,
                COUNT(*) as count,
                'comment' as type
             FROM comments 
             WHERE created_at >= datetime('now', '-24 hours') AND deleted_at IS NULL
             GROUP BY hour
             ORDER BY hour DESC`
        );

        // 시스템 부하 (간단한 메트릭)
        const [totalRecords] = await query(
            `SELECT 
                (SELECT COUNT(*) FROM users WHERE deleted_at IS NULL) as users,
                (SELECT COUNT(*) FROM posts WHERE deleted_at IS NULL) as posts,
                (SELECT COUNT(*) FROM comments WHERE deleted_at IS NULL) as comments`
        );

        res.json({
            success: true,
            stats: {
                lastHour: {
                    posts: recentPosts?.count || 0,
                    comments: recentComments?.count || 0,
                    newUsers: recentUsers?.count || 0,
                },
                current: {
                    onlineUsers: onlineUsers?.count || 0,
                },
                hourlyActivity: hourlyActivity || [],
                system: {
                    totalRecords: (totalRecords?.users || 0) +
                        (totalRecords?.posts || 0) +
                        (totalRecords?.comments || 0),
                    dbSize: 'N/A', // SQLite에서는 계산 복잡
                },
            },
        });
    } catch (error) {
        console.error('Get realtime stats error:', error);
        res.status(500).json({
            success: false,
            message: '실시간 통계 조회 중 오류가 발생했습니다',
            error: error.message,
        });
    }
});

/**
 * GET /api/admin-simple/activity-log
 * 상세 활동 로그 조회
 */
router.get('/activity-log', authMiddleware, requireAdmin, async (req, res) => {
    try {
        const {
            limit = 50,
            offset = 0,
            type = 'all', // all, user, post, comment, like, report
            userId,
            startDate,
            endDate,
        } = req.query;

        let activities = [];

        // 사용자 활동
        if (type === 'all' || type === 'user') {
            const users = await query(
                `SELECT id, username, display_name, created_at, 
                        'user_created' as action_type
                 FROM users 
                 WHERE deleted_at IS NULL
                 ${userId ? 'AND id = ?' : ''}
                 ${startDate ? `AND created_at >= '${startDate}'` : ''}
                 ${endDate ? `AND created_at <= '${endDate}'` : ''}
                 ORDER BY created_at DESC
                 LIMIT ?`,
                userId ? [userId, parseInt(limit)] : [parseInt(limit)]
            );
            activities.push(...users.map(u => ({
                ...u,
                entity_type: 'user',
                entity_id: u.id,
                user_display_name: u.display_name || u.username,
            })));
        }

        // 게시글 활동
        if (type === 'all' || type === 'post') {
            const posts = await query(
                `SELECT p.id, p.title, p.user_id, p.created_at,
                        u.username, u.display_name,
                        'post_created' as action_type
                 FROM posts p
                 LEFT JOIN users u ON p.user_id = u.id
                 WHERE p.deleted_at IS NULL
                 ${userId ? 'AND p.user_id = ?' : ''}
                 ${startDate ? `AND p.created_at >= '${startDate}'` : ''}
                 ${endDate ? `AND p.created_at <= '${endDate}'` : ''}
                 ORDER BY p.created_at DESC
                 LIMIT ?`,
                userId ? [userId, parseInt(limit)] : [parseInt(limit)]
            );
            activities.push(...posts.map(p => ({
                ...p,
                entity_type: 'post',
                entity_id: p.id,
                user_display_name: p.display_name || p.username,
            })));
        }

        // 댓글 활동
        if (type === 'all' || type === 'comment') {
            const comments = await query(
                `SELECT c.id, c.content, c.user_id, c.post_id, c.created_at,
                        u.username, u.display_name, p.title as post_title,
                        'comment_created' as action_type
                 FROM comments c
                 LEFT JOIN users u ON c.user_id = u.id
                 LEFT JOIN posts p ON c.post_id = p.id
                 WHERE c.deleted_at IS NULL
                 ${userId ? 'AND c.user_id = ?' : ''}
                 ${startDate ? `AND c.created_at >= '${startDate}'` : ''}
                 ${endDate ? `AND c.created_at <= '${endDate}'` : ''}
                 ORDER BY c.created_at DESC
                 LIMIT ?`,
                userId ? [userId, parseInt(limit)] : [parseInt(limit)]
            );
            activities.push(...comments.map(c => ({
                ...c,
                entity_type: 'comment',
                entity_id: c.id,
                user_display_name: c.display_name || c.username,
            })));
        }

        // 시간순 정렬
        activities.sort((a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        res.json({
            success: true,
            activities: activities.slice(parseInt(offset), parseInt(offset) + parseInt(limit)),
            total: activities.length,
        });
    } catch (error) {
        console.error('Get activity log error:', error);
        res.status(500).json({
            success: false,
            message: '활동 로그 조회 중 오류가 발생했습니다',
            error: error.message,
        });
    }
});

/**
 * GET /api/admin-simple/reports
 * 신고 목록 조회
 */
router.get('/reports', authMiddleware, requireAdmin, async (req, res) => {
    try {
        const {
            limit = 20,
            offset = 0,
            status = 'all', // all, pending, resolved, rejected
            type = 'all', // all, post, comment, user
        } = req.query;

        // reports 테이블이 없을 수 있으므로 임시 데이터 반환
        // 실제로는 reports 테이블을 생성해야 함
        const mockReports = [
            {
                id: 1,
                type: 'post',
                target_id: 1,
                target_title: '부적절한 게시글',
                reporter_id: 2,
                reporter_name: 'user2',
                reason: '스팸',
                status: 'pending',
                created_at: new Date().toISOString(),
            },
        ];

        res.json({
            success: true,
            reports: mockReports,
            total: mockReports.length,
            message: 'Reports 테이블이 아직 생성되지 않았습니다.',
        });
    } catch (error) {
        console.error('Get reports error:', error);
        res.status(500).json({
            success: false,
            message: '신고 목록 조회 중 오류가 발생했습니다',
            error: error.message,
        });
    }
});

/**
 * PUT /api/admin-simple/reports/:id
 * 신고 처리
 */
router.put('/reports/:id', authMiddleware, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { status, action, note } = req.body;

        // 실제로는 reports 테이블에 업데이트
        res.json({
            success: true,
            message: '신고가 처리되었습니다.',
            data: {
                id: parseInt(id),
                status,
                action,
                note,
                processed_by: req.user.id,
                processed_at: new Date().toISOString(),
            },
        });
    } catch (error) {
        console.error('Update report error:', error);
        res.status(500).json({
            success: false,
            message: '신고 처리 중 오류가 발생했습니다',
            error: error.message,
        });
    }
});

/**
 * POST /api/admin-simple/moderate
 * AI 모더레이션 분석
 */
router.post('/moderate', authMiddleware, requireAdmin, async (req, res) => {
    try {
        const { content, type } = req.body;

        // 간단한 키워드 기반 모더레이션 (실제로는 AI API 호출)
        const badKeywords = ['스팸', '광고', '욕설', '비방'];
        const containsBadWord = badKeywords.some(keyword =>
            content.toLowerCase().includes(keyword)
        );

        const toxicityScore = containsBadWord ? 0.8 : 0.1;
        const categories = containsBadWord ? ['spam', 'toxic'] : [];

        res.json({
            success: true,
            analysis: {
                toxicityScore,
                categories,
                shouldFlag: toxicityScore > 0.7,
                confidence: 0.85,
                suggestedAction: toxicityScore > 0.7 ? 'remove' : 'approve',
            },
        });
    } catch (error) {
        console.error('Moderate content error:', error);
        res.status(500).json({
            success: false,
            message: '콘텐츠 분석 중 오류가 발생했습니다',
            error: error.message,
        });
    }
});

export default router;
