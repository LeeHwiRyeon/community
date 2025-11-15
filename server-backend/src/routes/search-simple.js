/**
 * 통합 검색 API (SQLite 기반)
 * 게시글, 댓글, 사용자를 검색하는 간단한 검색 시스템
 */

import express from 'express';
import { query } from '../db.js';
import { buildAuthMiddleware } from '../auth/jwt.js';

const router = express.Router();
const authMiddleware = buildAuthMiddleware();

/**
 * GET /api/search-simple
 * 통합 검색 (게시글, 댓글, 사용자)
 */
router.get('/', async (req, res) => {
    try {
        const {
            q = '',
            type = 'all', // all, posts, comments, users
            limit = 20,
            offset = 0,
            sortBy = 'relevance', // relevance, date, popularity
        } = req.query;

        // 검색어 검증
        if (!q || q.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: '검색어를 입력해주세요',
            });
        }

        const searchTerm = `%${q.trim()}%`;
        const limitNum = Math.min(parseInt(limit) || 20, 100);
        const offsetNum = parseInt(offset) || 0;

        const results = {
            query: q,
            type,
            total: 0,
            posts: [],
            comments: [],
            users: [],
        };

        // 게시글 검색
        if (type === 'all' || type === 'posts') {
            let postQuery = `
                SELECT 
                    p.id,
                    p.title,
                    p.content,
                    p.view_count,
                    p.created_at,
                    p.updated_at,
                    u.id as author_id,
                    u.username as author_username,
                    u.display_name as author_display_name,
                    u.avatar_url as author_avatar_url,
                    (SELECT COUNT(*) FROM comments WHERE post_id = p.id AND deleted_at IS NULL) as comment_count,
                    (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) as like_count
                FROM posts p
                LEFT JOIN users u ON p.user_id = u.id
                WHERE (p.title LIKE ? OR p.content LIKE ?)
                    AND p.deleted_at IS NULL
            `;

            // 정렬
            if (sortBy === 'date') {
                postQuery += ' ORDER BY p.created_at DESC';
            } else if (sortBy === 'popularity') {
                postQuery += ' ORDER BY (p.view_count + (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) * 10) DESC';
            } else {
                // relevance: 제목에 포함된 것을 우선
                postQuery += ' ORDER BY (CASE WHEN p.title LIKE ? THEN 0 ELSE 1 END), p.created_at DESC';
            }

            postQuery += ' LIMIT ? OFFSET ?';

            const postParams = sortBy === 'relevance'
                ? [searchTerm, searchTerm, searchTerm, limitNum, offsetNum]
                : [searchTerm, searchTerm, limitNum, offsetNum];

            results.posts = await query(postQuery, postParams);

            // 게시글 카운트
            const postCountResult = await query(
                `SELECT COUNT(*) as count FROM posts 
                 WHERE (title LIKE ? OR content LIKE ?) AND deleted_at IS NULL`,
                [searchTerm, searchTerm]
            );
            results.total += postCountResult[0]?.count || 0;
        }

        // 댓글 검색
        if (type === 'all' || type === 'comments') {
            let commentQuery = `
                SELECT 
                    c.id,
                    c.content,
                    c.post_id,
                    c.parent_id,
                    c.created_at,
                    c.updated_at,
                    u.id as author_id,
                    u.username as author_username,
                    u.display_name as author_display_name,
                    u.avatar_url as author_avatar_url,
                    p.title as post_title,
                    (SELECT COUNT(*) FROM comment_likes WHERE comment_id = c.id) as like_count
                FROM comments c
                LEFT JOIN users u ON c.user_id = u.id
                LEFT JOIN posts p ON c.post_id = p.id
                WHERE c.content LIKE ?
                    AND c.deleted_at IS NULL
                    AND p.deleted_at IS NULL
            `;

            // 정렬
            if (sortBy === 'date') {
                commentQuery += ' ORDER BY c.created_at DESC';
            } else if (sortBy === 'popularity') {
                commentQuery += ' ORDER BY (SELECT COUNT(*) FROM comment_likes WHERE comment_id = c.id) DESC';
            } else {
                commentQuery += ' ORDER BY c.created_at DESC';
            }

            commentQuery += ' LIMIT ? OFFSET ?';

            results.comments = await query(commentQuery, [searchTerm, limitNum, offsetNum]);

            // 댓글 카운트
            const commentCountResult = await query(
                `SELECT COUNT(*) as count FROM comments c
                 LEFT JOIN posts p ON c.post_id = p.id
                 WHERE c.content LIKE ? AND c.deleted_at IS NULL AND p.deleted_at IS NULL`,
                [searchTerm]
            );
            results.total += commentCountResult[0]?.count || 0;
        }

        // 사용자 검색
        if (type === 'all' || type === 'users') {
            let userQuery = `
                SELECT 
                    u.id,
                    u.username,
                    u.display_name,
                    u.avatar_url,
                    u.bio,
                    u.created_at,
                    (SELECT COUNT(*) FROM posts WHERE user_id = u.id AND deleted_at IS NULL) as post_count,
                    (SELECT COUNT(*) FROM comments WHERE user_id = u.id AND deleted_at IS NULL) as comment_count,
                    (SELECT COUNT(*) FROM follows WHERE following_id = u.id) as follower_count
                FROM users u
                WHERE (u.username LIKE ? OR u.display_name LIKE ?)
                    AND u.deleted_at IS NULL
            `;

            // 정렬
            if (sortBy === 'popularity') {
                userQuery += ' ORDER BY follower_count DESC';
            } else {
                userQuery += ' ORDER BY (CASE WHEN u.username LIKE ? THEN 0 ELSE 1 END), u.created_at DESC';
            }

            userQuery += ' LIMIT ? OFFSET ?';

            const userParams = sortBy === 'popularity'
                ? [searchTerm, searchTerm, limitNum, offsetNum]
                : [searchTerm, searchTerm, searchTerm, limitNum, offsetNum];

            results.users = await query(userQuery, userParams);

            // 사용자 카운트
            const userCountResult = await query(
                `SELECT COUNT(*) as count FROM users 
                 WHERE (username LIKE ? OR display_name LIKE ?) AND deleted_at IS NULL`,
                [searchTerm, searchTerm]
            );
            results.total += userCountResult[0]?.count || 0;
        }

        res.json({
            success: true,
            results,
        });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({
            success: false,
            message: '검색 중 오류가 발생했습니다',
            error: error.message,
        });
    }
});

/**
 * GET /api/search-simple/posts
 * 게시글 검색 (필터링 지원)
 */
router.get('/posts', async (req, res) => {
    try {
        const {
            q = '',
            board_id,
            user_id,
            from_date,
            to_date,
            min_likes,
            min_views,
            limit = 20,
            offset = 0,
            sortBy = 'date', // date, popularity, relevance
        } = req.query;

        if (!q || q.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: '검색어를 입력해주세요',
            });
        }

        const searchTerm = `%${q.trim()}%`;
        const params = [searchTerm, searchTerm];
        let conditions = [];

        // 필터 조건 추가
        if (board_id) {
            conditions.push('p.board_id = ?');
            params.push(board_id);
        }
        if (user_id) {
            conditions.push('p.user_id = ?');
            params.push(user_id);
        }
        if (from_date) {
            conditions.push('p.created_at >= ?');
            params.push(from_date);
        }
        if (to_date) {
            conditions.push('p.created_at <= ?');
            params.push(to_date);
        }
        if (min_likes) {
            conditions.push('(SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) >= ?');
            params.push(min_likes);
        }
        if (min_views) {
            conditions.push('p.view_count >= ?');
            params.push(min_views);
        }

        const whereClause = conditions.length > 0
            ? 'AND ' + conditions.join(' AND ')
            : '';

        let orderClause = '';
        if (sortBy === 'popularity') {
            orderClause = 'ORDER BY (p.view_count + (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) * 10) DESC';
        } else if (sortBy === 'relevance') {
            orderClause = 'ORDER BY (CASE WHEN p.title LIKE ? THEN 0 ELSE 1 END), p.created_at DESC';
            params.push(searchTerm);
        } else {
            orderClause = 'ORDER BY p.created_at DESC';
        }

        const postQuery = `
            SELECT 
                p.id,
                p.title,
                p.content,
                p.board_id,
                p.view_count,
                p.created_at,
                p.updated_at,
                u.id as author_id,
                u.username as author_username,
                u.display_name as author_display_name,
                u.avatar_url as author_avatar_url,
                b.name as board_name,
                (SELECT COUNT(*) FROM comments WHERE post_id = p.id AND deleted_at IS NULL) as comment_count,
                (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) as like_count
            FROM posts p
            LEFT JOIN users u ON p.user_id = u.id
            LEFT JOIN boards b ON p.board_id = b.id
            WHERE (p.title LIKE ? OR p.content LIKE ?)
                AND p.deleted_at IS NULL
                ${whereClause}
            ${orderClause}
            LIMIT ? OFFSET ?
        `;

        params.push(parseInt(limit) || 20, parseInt(offset) || 0);
        const posts = await query(postQuery, params);

        // 전체 개수
        const countParams = [searchTerm, searchTerm];
        if (board_id) countParams.push(board_id);
        if (user_id) countParams.push(user_id);
        if (from_date) countParams.push(from_date);
        if (to_date) countParams.push(to_date);
        if (min_likes) countParams.push(min_likes);
        if (min_views) countParams.push(min_views);

        const countQuery = `
            SELECT COUNT(*) as total
            FROM posts p
            WHERE (p.title LIKE ? OR p.content LIKE ?)
                AND p.deleted_at IS NULL
                ${whereClause}
        `;

        const countResult = await query(countQuery, countParams);
        const total = countResult[0]?.total || 0;

        res.json({
            success: true,
            query: q,
            total,
            posts,
            hasMore: total > parseInt(offset) + posts.length,
        });
    } catch (error) {
        console.error('Post search error:', error);
        res.status(500).json({
            success: false,
            message: '게시글 검색 중 오류가 발생했습니다',
            error: error.message,
        });
    }
});

/**
 * GET /api/search-simple/autocomplete
 * 자동완성 (최근 검색어, 인기 검색어)
 */
router.get('/autocomplete', async (req, res) => {
    try {
        const { q = '', limit = 5 } = req.query;

        if (!q || q.trim().length < 2) {
            return res.json({
                success: true,
                suggestions: [],
            });
        }

        const searchTerm = `${q.trim()}%`;
        const limitNum = Math.min(parseInt(limit) || 5, 10);

        // 게시글 제목에서 자동완성
        const postTitles = await query(
            `SELECT DISTINCT title as suggestion, view_count
             FROM posts
             WHERE title LIKE ? AND deleted_at IS NULL
             ORDER BY view_count DESC
             LIMIT ?`,
            [searchTerm, limitNum]
        );

        // 사용자 이름에서 자동완성
        const usernames = await query(
            `SELECT DISTINCT username as suggestion, 
                    (SELECT COUNT(*) FROM follows WHERE following_id = u.id) as follower_count
             FROM users u
             WHERE username LIKE ? AND deleted_at IS NULL
             ORDER BY follower_count DESC
             LIMIT ?`,
            [searchTerm, limitNum]
        );

        // 결합 및 중복 제거
        const suggestions = [
            ...postTitles.map(p => ({ text: p.suggestion, type: 'post', score: p.view_count })),
            ...usernames.map(u => ({ text: u.suggestion, type: 'user', score: u.follower_count })),
        ]
            .sort((a, b) => b.score - a.score)
            .slice(0, limitNum)
            .map(s => ({ text: s.text, type: s.type }));

        res.json({
            success: true,
            query: q,
            suggestions,
        });
    } catch (error) {
        console.error('Autocomplete error:', error);
        res.status(500).json({
            success: false,
            message: '자동완성 중 오류가 발생했습니다',
            error: error.message,
        });
    }
});

/**
 * GET /api/search-simple/trending
 * 인기 검색어 (최근 조회수가 높은 게시글 기반)
 */
router.get('/trending', async (req, res) => {
    try {
        const { limit = 10 } = req.query;

        // 최근 7일간 인기 게시글의 주요 키워드
        const trendingPosts = await query(
            `SELECT title, view_count
             FROM posts
             WHERE deleted_at IS NULL
                 AND created_at >= datetime('now', '-7 days')
             ORDER BY view_count DESC
             LIMIT ?`,
            [parseInt(limit) || 10]
        );

        // 간단한 키워드 추출 (공백으로 분리)
        const keywords = {};
        trendingPosts.forEach(post => {
            const words = post.title.split(/\s+/).filter(w => w.length > 2);
            words.forEach(word => {
                keywords[word] = (keywords[word] || 0) + post.view_count;
            });
        });

        const trending = Object.entries(keywords)
            .sort((a, b) => b[1] - a[1])
            .slice(0, parseInt(limit) || 10)
            .map(([keyword, score]) => ({ keyword, score }));

        res.json({
            success: true,
            trending,
        });
    } catch (error) {
        console.error('Trending error:', error);
        res.status(500).json({
            success: false,
            message: '인기 검색어 조회 중 오류가 발생했습니다',
            error: error.message,
        });
    }
});

export default router;
