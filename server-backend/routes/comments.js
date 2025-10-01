const express = require('express');
const { v4: uuidv4 } = require('uuid');

/**
 * 댓글 라우트
 */
module.exports = (db, redis) => {
    const router = express.Router();

    /**
     * 댓글 목록 조회
     */
    router.get('/', async (req, res) => {
        try {
            const { postId, page = 1, limit = 50, parentId = null } = req.query;

            if (!postId) {
                return res.status(400).json({
                    success: false,
                    message: 'postId는 필수입니다.'
                });
            }

            const offset = (page - 1) * limit;
            let query = `
                SELECT 
                    c.*,
                    u.username,
                    u.display_name
                FROM comments c
                LEFT JOIN users u ON c.user_id = u.id
                WHERE c.post_id = ? AND c.is_deleted = false
            `;
            const params = [postId];

            if (parentId !== undefined) {
                if (parentId === null) {
                    query += ' AND c.parent_id IS NULL';
                } else {
                    query += ' AND c.parent_id = ?';
                    params.push(parentId);
                }
            }

            query += ' ORDER BY c.created_at ASC';
            query += ' LIMIT ? OFFSET ?';
            params.push(parseInt(limit), parseInt(offset));

            const [comments] = await db.execute(query, params);

            // 전체 개수 조회
            let countQuery = 'SELECT COUNT(*) as total FROM comments c WHERE c.post_id = ? AND c.is_deleted = false';
            const countParams = [postId];

            if (parentId !== undefined) {
                if (parentId === null) {
                    countQuery += ' AND c.parent_id IS NULL';
                } else {
                    countQuery += ' AND c.parent_id = ?';
                    countParams.push(parentId);
                }
            }

            const [countResult] = await db.execute(countQuery, countParams);
            const total = countResult[0].total;

            res.json({
                success: true,
                data: {
                    comments,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total,
                        totalPages: Math.ceil(total / limit)
                    }
                }
            });

        } catch (error) {
            console.error('댓글 목록 조회 오류:', error);
            res.status(500).json({
                success: false,
                message: '서버 오류가 발생했습니다.'
            });
        }
    });

    /**
     * 특정 댓글 조회
     */
    router.get('/:commentId', async (req, res) => {
        try {
            const { commentId } = req.params;

            const [comments] = await db.execute(`
                SELECT 
                    c.*,
                    u.username,
                    u.display_name
                FROM comments c
                LEFT JOIN users u ON c.user_id = u.id
                WHERE c.id = ? AND c.is_deleted = false
            `, [commentId]);

            if (comments.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: '댓글을 찾을 수 없습니다.'
                });
            }

            res.json({
                success: true,
                data: comments[0]
            });

        } catch (error) {
            console.error('댓글 조회 오류:', error);
            res.status(500).json({
                success: false,
                message: '서버 오류가 발생했습니다.'
            });
        }
    });

    /**
     * 댓글 생성
     */
    router.post('/', async (req, res) => {
        try {
            const { postId, content, userId, parentId } = req.body;

            // 입력 검증
            if (!postId || !content || !userId) {
                return res.status(400).json({
                    success: false,
                    message: '필수 필드가 누락되었습니다.'
                });
            }

            // 게시글 존재 확인
            const [posts] = await db.execute(
                'SELECT id FROM posts WHERE id = ? AND is_published = true',
                [postId]
            );

            if (posts.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: '존재하지 않는 게시글입니다.'
                });
            }

            // 사용자 존재 확인
            const [users] = await db.execute(
                'SELECT id FROM users WHERE id = ? AND is_active = true',
                [userId]
            );

            if (users.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: '존재하지 않는 사용자입니다.'
                });
            }

            // 부모 댓글 확인 (대댓글인 경우)
            if (parentId) {
                const [parentComments] = await db.execute(
                    'SELECT id FROM comments WHERE id = ? AND post_id = ? AND is_deleted = false',
                    [parentId, postId]
                );

                if (parentComments.length === 0) {
                    return res.status(404).json({
                        success: false,
                        message: '존재하지 않는 부모 댓글입니다.'
                    });
                }
            }

            // 댓글 생성
            const commentId = uuidv4();
            await db.execute(
                'INSERT INTO comments (id, post_id, user_id, parent_id, content) VALUES (?, ?, ?, ?, ?)',
                [commentId, postId, userId, parentId || null, content]
            );

            // 게시글 댓글 수 증가
            await db.execute(
                'UPDATE posts SET comment_count = comment_count + 1 WHERE id = ?',
                [postId]
            );

            res.status(201).json({
                success: true,
                message: '댓글이 생성되었습니다.',
                data: { commentId, postId, content, userId, parentId }
            });

        } catch (error) {
            console.error('댓글 생성 오류:', error);
            res.status(500).json({
                success: false,
                message: '서버 오류가 발생했습니다.'
            });
        }
    });

    /**
     * 댓글 수정
     */
    router.put('/:commentId', async (req, res) => {
        try {
            const { commentId } = req.params;
            const { content } = req.body;

            if (!content) {
                return res.status(400).json({
                    success: false,
                    message: '댓글 내용은 필수입니다.'
                });
            }

            // 댓글 존재 확인
            const [existing] = await db.execute(
                'SELECT id FROM comments WHERE id = ? AND is_deleted = false',
                [commentId]
            );

            if (existing.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: '댓글을 찾을 수 없습니다.'
                });
            }

            // 댓글 수정
            await db.execute(
                'UPDATE comments SET content = ? WHERE id = ?',
                [content, commentId]
            );

            res.json({
                success: true,
                message: '댓글이 수정되었습니다.'
            });

        } catch (error) {
            console.error('댓글 수정 오류:', error);
            res.status(500).json({
                success: false,
                message: '서버 오류가 발생했습니다.'
            });
        }
    });

    /**
     * 댓글 삭제 (소프트 삭제)
     */
    router.delete('/:commentId', async (req, res) => {
        try {
            const { commentId } = req.params;

            // 댓글 존재 확인
            const [existing] = await db.execute(
                'SELECT id, post_id FROM comments WHERE id = ? AND is_deleted = false',
                [commentId]
            );

            if (existing.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: '댓글을 찾을 수 없습니다.'
                });
            }

            // 댓글 소프트 삭제
            await db.execute(
                'UPDATE comments SET is_deleted = true WHERE id = ?',
                [commentId]
            );

            // 게시글 댓글 수 감소
            await db.execute(
                'UPDATE posts SET comment_count = comment_count - 1 WHERE id = ?',
                [existing[0].post_id]
            );

            res.json({
                success: true,
                message: '댓글이 삭제되었습니다.'
            });

        } catch (error) {
            console.error('댓글 삭제 오류:', error);
            res.status(500).json({
                success: false,
                message: '서버 오류가 발생했습니다.'
            });
        }
    });

    return router;
};
