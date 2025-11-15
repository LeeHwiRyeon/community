import express from 'express';
import { buildAuthMiddleware } from '../auth/jwt.js';
import { query } from '../db.js';

const router = express.Router();
const authMiddleware = buildAuthMiddleware();

/**
 * POST /api/posts/drafts
 * 새 초안 생성
 */
router.post('/', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { board_id, title, content, category, tags, metadata } = req.body;

        // 태그와 메타데이터를 JSON 문자열로 변환
        const tagsJson = tags ? JSON.stringify(tags) : null;
        const metadataJson = metadata ? JSON.stringify(metadata) : null;

        const result = await query(
            `INSERT INTO post_drafts 
            (user_id, board_id, title, content, category, tags, metadata, version, expires_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, 1, DATE_ADD(NOW(), INTERVAL 30 DAY))`,
            [userId, board_id || null, title || '', content || '', category || null, tagsJson, metadataJson]
        );

        const draft = await query(
            'SELECT * FROM post_drafts WHERE id = ?',
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            message: '초안이 생성되었습니다.',
            draft: {
                ...draft[0],
                tags: draft[0].tags ? JSON.parse(draft[0].tags) : null,
                metadata: draft[0].metadata ? JSON.parse(draft[0].metadata) : null
            }
        });
    } catch (error) {
        console.error('Draft creation error:', error);
        res.status(500).json({
            success: false,
            message: '초안 생성 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

/**
 * GET /api/posts/drafts
 * 사용자의 모든 초안 조회 (만료되지 않은 것만)
 */
router.get('/', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 20, board_id } = req.query;
        const offset = (page - 1) * limit;

        let whereClause = 'WHERE d.user_id = ? AND d.expires_at > NOW()';
        const params = [userId];

        if (board_id) {
            whereClause += ' AND d.board_id = ?';
            params.push(board_id);
        }

        const drafts = await query(
            `SELECT 
                d.*,
                b.name AS board_name,
                TIMESTAMPDIFF(DAY, NOW(), d.expires_at) AS days_until_expiry
            FROM post_drafts d
            LEFT JOIN boards b ON d.board_id = b.id
            ${whereClause}
            ORDER BY d.last_saved_at DESC
            LIMIT ? OFFSET ?`,
            [...params, parseInt(limit), parseInt(offset)]
        );

        const countResult = await query(
            `SELECT COUNT(*) as total FROM post_drafts d ${whereClause}`,
            params
        );

        const total = countResult[0].total;

        res.json({
            success: true,
            drafts: drafts.map(draft => ({
                ...draft,
                tags: draft.tags ? JSON.parse(draft.tags) : null,
                metadata: draft.metadata ? JSON.parse(draft.metadata) : null
            })),
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Draft list error:', error);
        res.status(500).json({
            success: false,
            message: '초안 목록 조회 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

/**
 * GET /api/posts/drafts/:id
 * 특정 초안 조회
 */
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const draftId = req.params.id;

        const drafts = await query(
            `SELECT 
                d.*,
                b.name AS board_name,
                TIMESTAMPDIFF(DAY, NOW(), d.expires_at) AS days_until_expiry
            FROM post_drafts d
            LEFT JOIN boards b ON d.board_id = b.id
            WHERE d.id = ? AND d.user_id = ? AND d.expires_at > NOW()`,
            [draftId, userId]
        );

        if (drafts.length === 0) {
            return res.status(404).json({
                success: false,
                message: '초안을 찾을 수 없습니다.'
            });
        }

        const draft = drafts[0];
        res.json({
            success: true,
            draft: {
                ...draft,
                tags: draft.tags ? JSON.parse(draft.tags) : null,
                metadata: draft.metadata ? JSON.parse(draft.metadata) : null
            }
        });
    } catch (error) {
        console.error('Draft fetch error:', error);
        res.status(500).json({
            success: false,
            message: '초안 조회 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

/**
 * PUT /api/posts/drafts/:id
 * 초안 업데이트 (자동 저장)
 */
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const draftId = req.params.id;
        const { board_id, title, content, category, tags, metadata } = req.body;

        // 초안 소유권 확인
        const existing = await query(
            'SELECT * FROM post_drafts WHERE id = ? AND user_id = ?',
            [draftId, userId]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: '초안을 찾을 수 없거나 권한이 없습니다.'
            });
        }

        // 태그와 메타데이터를 JSON 문자열로 변환
        const tagsJson = tags ? JSON.stringify(tags) : existing[0].tags;
        const metadataJson = metadata ? JSON.stringify(metadata) : existing[0].metadata;

        // 버전 증가
        const newVersion = existing[0].version + 1;

        await query(
            `UPDATE post_drafts 
            SET board_id = ?, title = ?, content = ?, category = ?, 
                tags = ?, metadata = ?, version = ?, 
                last_saved_at = CURRENT_TIMESTAMP
            WHERE id = ? AND user_id = ?`,
            [
                board_id !== undefined ? board_id : existing[0].board_id,
                title !== undefined ? title : existing[0].title,
                content !== undefined ? content : existing[0].content,
                category !== undefined ? category : existing[0].category,
                tagsJson,
                metadataJson,
                newVersion,
                draftId,
                userId
            ]
        );

        const updated = await query(
            'SELECT * FROM post_drafts WHERE id = ?',
            [draftId]
        );

        res.json({
            success: true,
            message: '초안이 저장되었습니다.',
            draft: {
                ...updated[0],
                tags: updated[0].tags ? JSON.parse(updated[0].tags) : null,
                metadata: updated[0].metadata ? JSON.parse(updated[0].metadata) : null
            }
        });
    } catch (error) {
        console.error('Draft update error:', error);
        res.status(500).json({
            success: false,
            message: '초안 저장 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

/**
 * DELETE /api/posts/drafts/:id
 * 초안 삭제
 */
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const draftId = req.params.id;

        // 초안 소유권 확인
        const existing = await query(
            'SELECT * FROM post_drafts WHERE id = ? AND user_id = ?',
            [draftId, userId]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: '초안을 찾을 수 없거나 권한이 없습니다.'
            });
        }

        await query(
            'DELETE FROM post_drafts WHERE id = ? AND user_id = ?',
            [draftId, userId]
        );

        res.json({
            success: true,
            message: '초안이 삭제되었습니다.'
        });
    } catch (error) {
        console.error('Draft deletion error:', error);
        res.status(500).json({
            success: false,
            message: '초안 삭제 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

/**
 * GET /api/posts/drafts/stats/summary
 * 사용자의 초안 통계
 */
router.get('/stats/summary', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;

        const stats = await query(
            'SELECT * FROM draft_stats WHERE user_id = ?',
            [userId]
        );

        res.json({
            success: true,
            stats: stats[0] || {
                user_id: userId,
                total_drafts: 0,
                active_drafts: 0,
                expired_drafts: 0
            }
        });
    } catch (error) {
        console.error('Draft stats error:', error);
        res.status(500).json({
            success: false,
            message: '통계 조회 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

export default router;
