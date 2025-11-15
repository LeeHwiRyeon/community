/**
 * 간단한 프로필 API (SQLite 기반)
 * 사용자 프로필 조회, 수정, 활동 기록 표시
 */

import express from 'express';
import { query } from '../db.js';
import { buildAuthMiddleware } from '../auth/jwt.js';

const router = express.Router();
const authMiddleware = buildAuthMiddleware();

/**
 * GET /api/profile-simple/:userId
 * 사용자 프로필 조회 (공개 정보)
 */
router.get('/:userId', async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);

        // 사용자 기본 정보
        const userResult = await query(
            `SELECT 
                id, username, display_name, bio, avatar_url, 
                role, created_at, last_seen
             FROM users 
             WHERE id = ? AND deleted_at IS NULL`,
            [userId]
        );

        if (!userResult || userResult.length === 0) {
            return res.status(404).json({
                success: false,
                message: '사용자를 찾을 수 없습니다',
            });
        }

        const user = userResult[0];

        // 통계 정보
        const [postCount] = await query(
            `SELECT COUNT(*) as count FROM posts WHERE user_id = ? AND deleted_at IS NULL`,
            [userId]
        );

        const [commentCount] = await query(
            `SELECT COUNT(*) as count FROM comments WHERE user_id = ? AND deleted_at IS NULL`,
            [userId]
        );

        const [followerCount] = await query(
            `SELECT COUNT(*) as count FROM follows WHERE following_id = ?`,
            [userId]
        );

        const [followingCount] = await query(
            `SELECT COUNT(*) as count FROM follows WHERE follower_id = ?`,
            [userId]
        );

        const [likeCount] = await query(
            `SELECT COUNT(*) as count FROM post_likes WHERE post_id IN 
             (SELECT id FROM posts WHERE user_id = ? AND deleted_at IS NULL)`,
            [userId]
        );

        res.json({
            success: true,
            profile: {
                user,
                stats: {
                    posts: postCount?.count || 0,
                    comments: commentCount?.count || 0,
                    followers: followerCount?.count || 0,
                    following: followingCount?.count || 0,
                    totalLikes: likeCount?.count || 0,
                },
            },
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: '프로필 조회 중 오류가 발생했습니다',
            error: error.message,
        });
    }
});

/**
 * PUT /api/profile-simple
 * 사용자 프로필 수정 (인증 필요)
 */
router.put('/', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { display_name, bio, avatar_url } = req.body;

        // 입력 검증
        if (display_name && display_name.length > 50) {
            return res.status(400).json({
                success: false,
                message: '표시 이름은 50자를 초과할 수 없습니다',
            });
        }

        if (bio && bio.length > 500) {
            return res.status(400).json({
                success: false,
                message: '자기소개는 500자를 초과할 수 없습니다',
            });
        }

        // 업데이트할 필드 준비
        const updates = [];
        const params = [];

        if (display_name !== undefined) {
            updates.push('display_name = ?');
            params.push(display_name);
        }

        if (bio !== undefined) {
            updates.push('bio = ?');
            params.push(bio);
        }

        if (avatar_url !== undefined) {
            updates.push('avatar_url = ?');
            params.push(avatar_url);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: '업데이트할 정보가 없습니다',
            });
        }

        updates.push('updated_at = CURRENT_TIMESTAMP');
        params.push(userId);

        // 프로필 업데이트
        await query(
            `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
            params
        );

        // 업데이트된 프로필 조회
        const [updatedUser] = await query(
            `SELECT id, username, display_name, bio, avatar_url, created_at, updated_at
             FROM users WHERE id = ?`,
            [userId]
        );

        res.json({
            success: true,
            message: '프로필이 업데이트되었습니다',
            profile: updatedUser,
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: '프로필 업데이트 중 오류가 발생했습니다',
            error: error.message,
        });
    }
});

/**
 * GET /api/profile-simple/:userId/activity
 * 사용자 활동 기록 조회
 */
router.get('/:userId/activity', async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        const { limit = 20, offset = 0, type = 'all' } = req.query;

        const activities = [];

        // 게시글 활동
        if (type === 'all' || type === 'posts') {
            const posts = await query(
                `SELECT 
                    'post' as type,
                    p.id,
                    p.title,
                    p.content,
                    p.view_count,
                    p.created_at,
                    (SELECT COUNT(*) FROM comments WHERE post_id = p.id AND deleted_at IS NULL) as comment_count,
                    (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) as like_count
                 FROM posts p
                 WHERE p.user_id = ? AND p.deleted_at IS NULL
                 ORDER BY p.created_at DESC
                 LIMIT ? OFFSET ?`,
                [userId, parseInt(limit), parseInt(offset)]
            );
            activities.push(...posts);
        }

        // 댓글 활동
        if (type === 'all' || type === 'comments') {
            const comments = await query(
                `SELECT 
                    'comment' as type,
                    c.id,
                    c.content,
                    c.post_id,
                    c.created_at,
                    p.title as post_title,
                    (SELECT COUNT(*) FROM comment_likes WHERE comment_id = c.id) as like_count
                 FROM comments c
                 LEFT JOIN posts p ON c.post_id = p.id
                 WHERE c.user_id = ? AND c.deleted_at IS NULL AND p.deleted_at IS NULL
                 ORDER BY c.created_at DESC
                 LIMIT ? OFFSET ?`,
                [userId, parseInt(limit), parseInt(offset)]
            );
            activities.push(...comments);
        }

        // 최신순 정렬
        activities.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        // limit 적용
        const limitedActivities = activities.slice(0, parseInt(limit));

        // 전체 개수
        const [postCountResult] = await query(
            `SELECT COUNT(*) as count FROM posts WHERE user_id = ? AND deleted_at IS NULL`,
            [userId]
        );
        const [commentCountResult] = await query(
            `SELECT COUNT(*) as count FROM comments WHERE user_id = ? AND deleted_at IS NULL`,
            [userId]
        );

        const totalCount =
            type === 'posts'
                ? postCountResult?.count || 0
                : type === 'comments'
                    ? commentCountResult?.count || 0
                    : (postCountResult?.count || 0) + (commentCountResult?.count || 0);

        res.json({
            success: true,
            activities: limitedActivities,
            total: totalCount,
            hasMore: totalCount > parseInt(offset) + limitedActivities.length,
        });
    } catch (error) {
        console.error('Get activity error:', error);
        res.status(500).json({
            success: false,
            message: '활동 기록 조회 중 오류가 발생했습니다',
            error: error.message,
        });
    }
});

/**
 * GET /api/profile-simple/:userId/posts
 * 사용자 게시글 목록
 */
router.get('/:userId/posts', async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        const { limit = 20, offset = 0, sortBy = 'date' } = req.query;

        let orderClause = 'p.created_at DESC';
        if (sortBy === 'popular') {
            orderClause = '(p.view_count + like_count * 10) DESC';
        } else if (sortBy === 'views') {
            orderClause = 'p.view_count DESC';
        }

        const posts = await query(
            `SELECT 
                p.id,
                p.title,
                p.content,
                p.view_count,
                p.created_at,
                p.updated_at,
                (SELECT COUNT(*) FROM comments WHERE post_id = p.id AND deleted_at IS NULL) as comment_count,
                (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) as like_count
             FROM posts p
             WHERE p.user_id = ? AND p.deleted_at IS NULL
             ORDER BY ${orderClause}
             LIMIT ? OFFSET ?`,
            [userId, parseInt(limit), parseInt(offset)]
        );

        const [countResult] = await query(
            `SELECT COUNT(*) as total FROM posts WHERE user_id = ? AND deleted_at IS NULL`,
            [userId]
        );

        res.json({
            success: true,
            posts,
            total: countResult?.total || 0,
            hasMore: (countResult?.total || 0) > parseInt(offset) + posts.length,
        });
    } catch (error) {
        console.error('Get user posts error:', error);
        res.status(500).json({
            success: false,
            message: '게시글 조회 중 오류가 발생했습니다',
            error: error.message,
        });
    }
});

/**
 * GET /api/profile-simple/:userId/comments
 * 사용자 댓글 목록
 */
router.get('/:userId/comments', async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        const { limit = 20, offset = 0 } = req.query;

        const comments = await query(
            `SELECT 
                c.id,
                c.content,
                c.post_id,
                c.parent_id,
                c.created_at,
                c.updated_at,
                p.title as post_title,
                (SELECT COUNT(*) FROM comment_likes WHERE comment_id = c.id) as like_count
             FROM comments c
             LEFT JOIN posts p ON c.post_id = p.id
             WHERE c.user_id = ? AND c.deleted_at IS NULL AND p.deleted_at IS NULL
             ORDER BY c.created_at DESC
             LIMIT ? OFFSET ?`,
            [userId, parseInt(limit), parseInt(offset)]
        );

        const [countResult] = await query(
            `SELECT COUNT(*) as total FROM comments c
             LEFT JOIN posts p ON c.post_id = p.id
             WHERE c.user_id = ? AND c.deleted_at IS NULL AND p.deleted_at IS NULL`,
            [userId]
        );

        res.json({
            success: true,
            comments,
            total: countResult?.total || 0,
            hasMore: (countResult?.total || 0) > parseInt(offset) + comments.length,
        });
    } catch (error) {
        console.error('Get user comments error:', error);
        res.status(500).json({
            success: false,
            message: '댓글 조회 중 오류가 발생했습니다',
            error: error.message,
        });
    }
});

/**
 * GET /api/profile-simple/me
 * 내 프로필 조회 (인증 필요)
 */
router.get('/me/profile', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;

        // 사용자 정보 (비공개 정보 포함)
        const [user] = await query(
            `SELECT 
                id, username, email, display_name, bio, avatar_url, 
                role, is_online, last_seen, created_at, updated_at
             FROM users 
             WHERE id = ? AND deleted_at IS NULL`,
            [userId]
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: '사용자를 찾을 수 없습니다',
            });
        }

        // 통계
        const [postCount] = await query(
            `SELECT COUNT(*) as count FROM posts WHERE user_id = ? AND deleted_at IS NULL`,
            [userId]
        );

        const [commentCount] = await query(
            `SELECT COUNT(*) as count FROM comments WHERE user_id = ? AND deleted_at IS NULL`,
            [userId]
        );

        const [followerCount] = await query(
            `SELECT COUNT(*) as count FROM follows WHERE following_id = ?`,
            [userId]
        );

        const [followingCount] = await query(
            `SELECT COUNT(*) as count FROM follows WHERE follower_id = ?`,
            [userId]
        );

        const [bookmarkCount] = await query(
            `SELECT COUNT(*) as count FROM bookmarks WHERE user_id = ?`,
            [userId]
        );

        res.json({
            success: true,
            profile: {
                user,
                stats: {
                    posts: postCount?.count || 0,
                    comments: commentCount?.count || 0,
                    followers: followerCount?.count || 0,
                    following: followingCount?.count || 0,
                    bookmarks: bookmarkCount?.count || 0,
                },
            },
        });
    } catch (error) {
        console.error('Get my profile error:', error);
        res.status(500).json({
            success: false,
            message: '프로필 조회 중 오류가 발생했습니다',
            error: error.message,
        });
    }
});

export default router;
