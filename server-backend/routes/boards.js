const express = require('express');

/**
 * 게시판 라우트
 */
module.exports = (db, redis) => {
    const router = express.Router();

    /**
     * 게시판 목록 조회
     */
    router.get('/', async (req, res) => {
        try {
            const { category, active } = req.query;

            let query = 'SELECT * FROM boards WHERE 1=1';
            const params = [];

            if (category) {
                query += ' AND category = ?';
                params.push(category);
            }

            if (active !== undefined) {
                query += ' AND is_active = ?';
                params.push(active === 'true');
            }

            query += ' ORDER BY sort_order ASC, created_at ASC';

            const [boards] = await db.execute(query, params);

            res.json({
                success: true,
                data: boards
            });

        } catch (error) {
            console.error('게시판 목록 조회 오류:', error);
            res.status(500).json({
                success: false,
                message: '서버 오류가 발생했습니다.'
            });
        }
    });

    /**
     * 특정 게시판 조회
     */
    router.get('/:boardId', async (req, res) => {
        try {
            const { boardId } = req.params;

            const [boards] = await db.execute(
                'SELECT * FROM boards WHERE id = ?',
                [boardId]
            );

            if (boards.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: '게시판을 찾을 수 없습니다.'
                });
            }

            res.json({
                success: true,
                data: boards[0]
            });

        } catch (error) {
            console.error('게시판 조회 오류:', error);
            res.status(500).json({
                success: false,
                message: '서버 오류가 발생했습니다.'
            });
        }
    });

    /**
     * 게시판 생성 (관리자만)
     */
    router.post('/', async (req, res) => {
        try {
            const { id, name, description, category, sortOrder } = req.body;

            // 입력 검증
            if (!id || !name) {
                return res.status(400).json({
                    success: false,
                    message: '게시판 ID와 이름은 필수입니다.'
                });
            }

            // 중복 확인
            const [existing] = await db.execute(
                'SELECT id FROM boards WHERE id = ?',
                [id]
            );

            if (existing.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: '이미 존재하는 게시판 ID입니다.'
                });
            }

            // 게시판 생성
            await db.execute(
                'INSERT INTO boards (id, name, description, category, sort_order) VALUES (?, ?, ?, ?, ?)',
                [id, name, description || '', category || 'general', sortOrder || 0]
            );

            res.status(201).json({
                success: true,
                message: '게시판이 생성되었습니다.',
                data: { id, name, description, category, sortOrder }
            });

        } catch (error) {
            console.error('게시판 생성 오류:', error);
            res.status(500).json({
                success: false,
                message: '서버 오류가 발생했습니다.'
            });
        }
    });

    /**
     * 게시판 수정 (관리자만)
     */
    router.put('/:boardId', async (req, res) => {
        try {
            const { boardId } = req.params;
            const { name, description, category, sortOrder, isActive } = req.body;

            // 게시판 존재 확인
            const [existing] = await db.execute(
                'SELECT id FROM boards WHERE id = ?',
                [boardId]
            );

            if (existing.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: '게시판을 찾을 수 없습니다.'
                });
            }

            // 업데이트할 필드 구성
            const updateFields = [];
            const params = [];

            if (name !== undefined) {
                updateFields.push('name = ?');
                params.push(name);
            }
            if (description !== undefined) {
                updateFields.push('description = ?');
                params.push(description);
            }
            if (category !== undefined) {
                updateFields.push('category = ?');
                params.push(category);
            }
            if (sortOrder !== undefined) {
                updateFields.push('sort_order = ?');
                params.push(sortOrder);
            }
            if (isActive !== undefined) {
                updateFields.push('is_active = ?');
                params.push(isActive);
            }

            if (updateFields.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: '수정할 데이터가 없습니다.'
                });
            }

            params.push(boardId);

            await db.execute(
                `UPDATE boards SET ${updateFields.join(', ')} WHERE id = ?`,
                params
            );

            res.json({
                success: true,
                message: '게시판이 수정되었습니다.'
            });

        } catch (error) {
            console.error('게시판 수정 오류:', error);
            res.status(500).json({
                success: false,
                message: '서버 오류가 발생했습니다.'
            });
        }
    });

    /**
     * 게시판 삭제 (관리자만)
     */
    router.delete('/:boardId', async (req, res) => {
        try {
            const { boardId } = req.params;

            // 게시판 존재 확인
            const [existing] = await db.execute(
                'SELECT id FROM boards WHERE id = ?',
                [boardId]
            );

            if (existing.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: '게시판을 찾을 수 없습니다.'
                });
            }

            // 게시판 삭제 (CASCADE로 관련 데이터도 함께 삭제됨)
            await db.execute(
                'DELETE FROM boards WHERE id = ?',
                [boardId]
            );

            res.json({
                success: true,
                message: '게시판이 삭제되었습니다.'
            });

        } catch (error) {
            console.error('게시판 삭제 오류:', error);
            res.status(500).json({
                success: false,
                message: '서버 오류가 발생했습니다.'
            });
        }
    });

    return router;
};
