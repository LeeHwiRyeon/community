const express = require('express');
const { v4: uuidv4 } = require('uuid');

/**
 * 게시글 라우트
 */
module.exports = (db, redis) => {
    const router = express.Router();

    /**
     * 게시글 목록 조회
     */
    router.get('/', async (req, res) => {
        try {
            const {
                boardId,
                page = 1,
                limit = 20,
                sort = 'created_at',
                order = 'DESC',
                search,
                isPublished = true
            } = req.query;

            const offset = (page - 1) * limit;
            let query = `
                SELECT 
                    p.*,
                    u.username,
                    u.display_name,
                    b.name as board_name
                FROM posts p
                LEFT JOIN users u ON p.user_id = u.id
                LEFT JOIN boards b ON p.board_id = b.id
                WHERE 1=1
            `;
            const params = [];

            if (boardId) {
                query += ' AND p.board_id = ?';
                params.push(boardId);
            }

            if (isPublished !== undefined) {
                query += ' AND p.is_published = ?';
                params.push(isPublished === 'true');
            }

            if (search) {
                query += ' AND (p.title LIKE ? OR p.content LIKE ?)';
                params.push(`%${search}%`, `%${search}%`);
            }

            // 정렬
            const allowedSortFields = ['created_at', 'updated_at', 'view_count', 'like_count', 'comment_count'];
            const sortField = allowedSortFields.includes(sort) ? sort : 'created_at';
            const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

            query += ` ORDER BY p.${sortField} ${sortOrder}`;
            query += ' LIMIT ? OFFSET ?';
            params.push(parseInt(limit), parseInt(offset));

            const [posts] = await db.execute(query, params);

            // 전체 개수 조회
            let countQuery = 'SELECT COUNT(*) as total FROM posts p WHERE 1=1';
            const countParams = [];

            if (boardId) {
                countQuery += ' AND p.board_id = ?';
                countParams.push(boardId);
            }

            if (isPublished !== undefined) {
                countQuery += ' AND p.is_published = ?';
                countParams.push(isPublished === 'true');
            }

            if (search) {
                countQuery += ' AND (p.title LIKE ? OR p.content LIKE ?)';
                countParams.push(`%${search}%`, `%${search}%`);
            }

            const [countResult] = await db.execute(countQuery, countParams);
            const total = countResult[0].total;

            res.json({
                success: true,
                data: {
                    posts,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total,
                        totalPages: Math.ceil(total / limit)
                    }
                }
            });

        } catch (error) {
            console.error('게시글 목록 조회 오류:', error);
            res.status(500).json({
                success: false,
                message: '서버 오류가 발생했습니다.'
            });
        }
    });

    /**
     * 특정 게시글 조회
     */
    router.get('/:postId', async (req, res) => {
        try {
            const { postId } = req.params;

            const [posts] = await db.execute(`
                SELECT 
                    p.*,
                    u.username,
                    u.display_name,
                    b.name as board_name
                FROM posts p
                LEFT JOIN users u ON p.user_id = u.id
                LEFT JOIN boards b ON p.board_id = b.id
                WHERE p.id = ?
            `, [postId]);

            if (posts.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: '게시글을 찾을 수 없습니다.'
                });
            }

            const post = posts[0];

            // 조회수 증가
            await db.execute(
                'UPDATE posts SET view_count = view_count + 1 WHERE id = ?',
                [postId]
            );

            post.view_count += 1;

            res.json({
                success: true,
                data: post
            });

        } catch (error) {
            console.error('게시글 조회 오류:', error);
            res.status(500).json({
                success: false,
                message: '서버 오류가 발생했습니다.'
            });
        }
    });

    /**
     * 게시글 생성
     */
    router.post('/', async (req, res) => {
        try {
            const { boardId, title, content, contentType = 'text', userId } = req.body;

            // 입력 검증
            if (!boardId || !title || !content || !userId) {
                return res.status(400).json({
                    success: false,
                    message: '필수 필드가 누락되었습니다.'
                });
            }

            // 게시판 존재 확인
            const [boards] = await db.execute(
                'SELECT id FROM boards WHERE id = ? AND is_active = true',
                [boardId]
            );

            if (boards.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: '존재하지 않는 게시판입니다.'
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

            // 게시글 생성
            const postId = uuidv4();
            await db.execute(
                'INSERT INTO posts (id, board_id, user_id, title, content, content_type) VALUES (?, ?, ?, ?, ?, ?)',
                [postId, boardId, userId, title, content, contentType]
            );

            res.status(201).json({
                success: true,
                message: '게시글이 생성되었습니다.',
                data: { postId, boardId, title, content, contentType }
            });

        } catch (error) {
            console.error('게시글 생성 오류:', error);
            res.status(500).json({
                success: false,
                message: '서버 오류가 발생했습니다.'
            });
        }
    });

    /**
     * 게시글 수정
     */
    router.put('/:postId', async (req, res) => {
        try {
            const { postId } = req.params;
            const { title, content, contentType, isPublished, isPinned } = req.body;

            // 게시글 존재 확인
            const [existing] = await db.execute(
                'SELECT id FROM posts WHERE id = ?',
                [postId]
            );

            if (existing.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: '게시글을 찾을 수 없습니다.'
                });
            }

            // 업데이트할 필드 구성
            const updateFields = [];
            const params = [];

            if (title !== undefined) {
                updateFields.push('title = ?');
                params.push(title);
            }
            if (content !== undefined) {
                updateFields.push('content = ?');
                params.push(content);
            }
            if (contentType !== undefined) {
                updateFields.push('content_type = ?');
                params.push(contentType);
            }
            if (isPublished !== undefined) {
                updateFields.push('is_published = ?');
                params.push(isPublished);
            }
            if (isPinned !== undefined) {
                updateFields.push('is_pinned = ?');
                params.push(isPinned);
            }

            if (updateFields.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: '수정할 데이터가 없습니다.'
                });
            }

            params.push(postId);

            await db.execute(
                `UPDATE posts SET ${updateFields.join(', ')} WHERE id = ?`,
                params
            );

            res.json({
                success: true,
                message: '게시글이 수정되었습니다.'
            });

        } catch (error) {
            console.error('게시글 수정 오류:', error);
            res.status(500).json({
                success: false,
                message: '서버 오류가 발생했습니다.'
            });
        }
    });

    /**
     * 게시글 삭제
     */
    router.delete('/:postId', async (req, res) => {
        try {
            const { postId } = req.params;

            // 게시글 존재 확인
            const [existing] = await db.execute(
                'SELECT id FROM posts WHERE id = ?',
                [postId]
            );

            if (existing.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: '게시글을 찾을 수 없습니다.'
                });
            }

            // 게시글 삭제 (CASCADE로 관련 데이터도 함께 삭제됨)
            await db.execute(
                'DELETE FROM posts WHERE id = ?',
                [postId]
            );

            res.json({
                success: true,
                message: '게시글이 삭제되었습니다.'
            });

        } catch (error) {
            console.error('게시글 삭제 오류:', error);
            res.status(500).json({
                success: false,
                message: '서버 오류가 발생했습니다.'
            });
        }
    });

    return router;
};
