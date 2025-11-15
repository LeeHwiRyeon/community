/**
 * Bookmark System Routes
 * 북마크 시스템 REST API
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
 * @route   GET /api/bookmarks/folders
 * @desc    사용자의 북마크 폴더 목록 조회
 * @access  Private
 */
router.get('/folders', async (req, res) => {
    const userId = req.user.id;

    try {
        const folders = await query(
            `SELECT 
                bf.*,
                COUNT(b.id) as bookmark_count
            FROM bookmark_folders bf
            LEFT JOIN bookmarks b ON bf.id = b.folder_id
            WHERE bf.user_id = ?
            GROUP BY bf.id
            ORDER BY bf.display_order ASC, bf.created_at ASC`,
            [userId]
        );

        res.json({
            folders: folders.map(folder => ({
                ...folder,
                bookmark_count: parseInt(folder.bookmark_count) || 0
            }))
        });
    } catch (error) {
        logger.error('Get folders error:', error);
        res.status(500).json({ error: '폴더 목록 조회 중 오류가 발생했습니다' });
    }
});

/**
 * @route   POST /api/bookmarks/folders
 * @desc    새 북마크 폴더 생성
 * @access  Private
 */
router.post('/folders', async (req, res) => {
    const userId = req.user.id;
    const { name, description, color, icon } = req.body;

    try {
        // 이름 필수 검증
        if (!name || name.trim().length === 0) {
            return res.status(400).json({ error: '폴더 이름을 입력해주세요' });
        }

        // 중복 이름 확인
        const existingFolder = await query(
            'SELECT id FROM bookmark_folders WHERE user_id = ? AND name = ?',
            [userId, name.trim()]
        );

        if (existingFolder && existingFolder.length > 0) {
            return res.status(400).json({ error: '이미 같은 이름의 폴더가 존재합니다' });
        }

        // 현재 폴더 수 확인 (최대 50개 제한)
        const [countResult] = await query(
            'SELECT COUNT(*) as count FROM bookmark_folders WHERE user_id = ?',
            [userId]
        );

        if (countResult.count >= 50) {
            return res.status(400).json({ error: '폴더는 최대 50개까지 생성할 수 있습니다' });
        }

        // 폴더 생성
        const result = await query(
            `INSERT INTO bookmark_folders 
             (user_id, name, description, color, icon) 
             VALUES (?, ?, ?, ?, ?)`,
            [
                userId,
                name.trim(),
                description || null,
                color || '#1976d2',
                icon || '📁'
            ]
        );

        const newFolder = await query(
            'SELECT * FROM bookmark_folders WHERE id = ?',
            [result.insertId]
        );

        logger.info(`User ${userId} created folder: ${name}`);

        res.status(201).json({
            message: '폴더가 생성되었습니다',
            folder: newFolder[0]
        });
    } catch (error) {
        logger.error('Create folder error:', error);
        res.status(500).json({ error: '폴더 생성 중 오류가 발생했습니다' });
    }
});

/**
 * @route   PUT /api/bookmarks/folders/:folderId
 * @desc    북마크 폴더 수정
 * @access  Private
 */
router.put('/folders/:folderId', async (req, res) => {
    const userId = req.user.id;
    const folderId = req.params.folderId;
    const { name, description, color, icon } = req.body;

    try {
        // 폴더 소유권 확인
        const folder = await query(
            'SELECT * FROM bookmark_folders WHERE id = ? AND user_id = ?',
            [folderId, userId]
        );

        if (!folder || folder.length === 0) {
            return res.status(404).json({ error: '폴더를 찾을 수 없습니다' });
        }

        // 기본 폴더는 이름 변경 불가
        if (folder[0].is_default && name && name !== folder[0].name) {
            return res.status(400).json({ error: '기본 폴더의 이름은 변경할 수 없습니다' });
        }

        // 업데이트
        const updates = [];
        const values = [];

        if (name) {
            updates.push('name = ?');
            values.push(name.trim());
        }
        if (description !== undefined) {
            updates.push('description = ?');
            values.push(description);
        }
        if (color) {
            updates.push('color = ?');
            values.push(color);
        }
        if (icon) {
            updates.push('icon = ?');
            values.push(icon);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: '수정할 내용이 없습니다' });
        }

        values.push(folderId);

        await query(
            `UPDATE bookmark_folders SET ${updates.join(', ')} WHERE id = ?`,
            values
        );

        const updatedFolder = await query(
            'SELECT * FROM bookmark_folders WHERE id = ?',
            [folderId]
        );

        logger.info(`User ${userId} updated folder ${folderId}`);

        res.json({
            message: '폴더가 수정되었습니다',
            folder: updatedFolder[0]
        });
    } catch (error) {
        logger.error('Update folder error:', error);
        res.status(500).json({ error: '폴더 수정 중 오류가 발생했습니다' });
    }
});

/**
 * @route   DELETE /api/bookmarks/folders/:folderId
 * @desc    북마크 폴더 삭제
 * @access  Private
 */
router.delete('/folders/:folderId', async (req, res) => {
    const userId = req.user.id;
    const folderId = req.params.folderId;

    try {
        // 폴더 소유권 및 기본 폴더 확인
        const folder = await query(
            'SELECT * FROM bookmark_folders WHERE id = ? AND user_id = ?',
            [folderId, userId]
        );

        if (!folder || folder.length === 0) {
            return res.status(404).json({ error: '폴더를 찾을 수 없습니다' });
        }

        if (folder[0].is_default) {
            return res.status(400).json({ error: '기본 폴더는 삭제할 수 없습니다' });
        }

        // 폴더 내 북마크를 기본 폴더로 이동
        const defaultFolder = await query(
            'SELECT id FROM bookmark_folders WHERE user_id = ? AND is_default = TRUE',
            [userId]
        );

        if (defaultFolder && defaultFolder.length > 0) {
            await query(
                'UPDATE bookmarks SET folder_id = ? WHERE folder_id = ?',
                [defaultFolder[0].id, folderId]
            );
        }

        // 폴더 삭제
        await query('DELETE FROM bookmark_folders WHERE id = ?', [folderId]);

        logger.info(`User ${userId} deleted folder ${folderId}`);

        res.json({ message: '폴더가 삭제되었습니다' });
    } catch (error) {
        logger.error('Delete folder error:', error);
        res.status(500).json({ error: '폴더 삭제 중 오류가 발생했습니다' });
    }
});

/**
 * @route   POST /api/bookmarks
 * @desc    북마크 추가
 * @access  Private
 */
router.post('/', async (req, res) => {
    const userId = req.user.id;
    const { itemType, itemId, folderId, note, tags } = req.body;

    try {
        // 입력 검증
        if (!itemType || !itemId) {
            return res.status(400).json({ error: '북마크할 항목을 지정해주세요' });
        }

        if (!['post', 'comment'].includes(itemType)) {
            return res.status(400).json({ error: '잘못된 항목 타입입니다' });
        }

        // 이미 북마크했는지 확인
        const existing = await query(
            'SELECT id FROM bookmarks WHERE user_id = ? AND item_type = ? AND item_id = ?',
            [userId, itemType, itemId]
        );

        if (existing && existing.length > 0) {
            return res.status(400).json({ error: '이미 북마크한 항목입니다' });
        }

        // 폴더 확인 (지정하지 않으면 기본 폴더)
        let targetFolderId = folderId;
        if (!targetFolderId) {
            const defaultFolder = await query(
                'SELECT id FROM bookmark_folders WHERE user_id = ? AND is_default = TRUE',
                [userId]
            );
            if (defaultFolder && defaultFolder.length > 0) {
                targetFolderId = defaultFolder[0].id;
            }
        } else {
            // 폴더 소유권 확인
            const folder = await query(
                'SELECT id FROM bookmark_folders WHERE id = ? AND user_id = ?',
                [targetFolderId, userId]
            );
            if (!folder || folder.length === 0) {
                return res.status(404).json({ error: '폴더를 찾을 수 없습니다' });
            }
        }

        // 북마크 추가
        await query(
            `INSERT INTO bookmarks 
             (user_id, folder_id, item_type, item_id, note, tags) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                userId,
                targetFolderId,
                itemType,
                itemId,
                note || null,
                tags ? JSON.stringify(tags) : null
            ]
        );

        // 북마크 카운트 업데이트
        const table = itemType === 'post' ? 'posts' : 'comments';
        await query(
            `UPDATE ${table} SET bookmark_count = bookmark_count + 1 WHERE id = ?`,
            [itemId]
        );

        logger.info(`User ${userId} bookmarked ${itemType} ${itemId}`);

        res.status(201).json({
            message: '북마크에 추가되었습니다',
            itemType,
            itemId
        });
    } catch (error) {
        logger.error('Add bookmark error:', error);
        res.status(500).json({ error: '북마크 추가 중 오류가 발생했습니다' });
    }
});

/**
 * @route   DELETE /api/bookmarks/:itemType/:itemId
 * @desc    북마크 삭제
 * @access  Private
 */
router.delete('/:itemType/:itemId', async (req, res) => {
    const userId = req.user.id;
    const { itemType, itemId } = req.params;

    try {
        if (!['post', 'comment'].includes(itemType)) {
            return res.status(400).json({ error: '잘못된 항목 타입입니다' });
        }

        // 북마크 확인
        const bookmark = await query(
            'SELECT id FROM bookmarks WHERE user_id = ? AND item_type = ? AND item_id = ?',
            [userId, itemType, itemId]
        );

        if (!bookmark || bookmark.length === 0) {
            return res.status(404).json({ error: '북마크를 찾을 수 없습니다' });
        }

        // 북마크 삭제
        await query(
            'DELETE FROM bookmarks WHERE user_id = ? AND item_type = ? AND item_id = ?',
            [userId, itemType, itemId]
        );

        // 북마크 카운트 업데이트
        const table = itemType === 'post' ? 'posts' : 'comments';
        await query(
            `UPDATE ${table} SET bookmark_count = GREATEST(bookmark_count - 1, 0) WHERE id = ?`,
            [itemId]
        );

        logger.info(`User ${userId} removed bookmark ${itemType} ${itemId}`);

        res.json({
            message: '북마크가 삭제되었습니다',
            itemType,
            itemId
        });
    } catch (error) {
        logger.error('Delete bookmark error:', error);
        res.status(500).json({ error: '북마크 삭제 중 오류가 발생했습니다' });
    }
});

/**
 * @route   GET /api/bookmarks
 * @desc    북마크 목록 조회
 * @access  Private
 */
router.get('/', async (req, res) => {
    const userId = req.user.id;
    const folderId = req.query.folderId;
    const itemType = req.query.itemType;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const search = req.query.search;

    try {
        let whereConditions = ['b.user_id = ?'];
        let params = [userId];

        if (folderId) {
            whereConditions.push('b.folder_id = ?');
            params.push(folderId);
        }

        if (itemType && ['post', 'comment'].includes(itemType)) {
            whereConditions.push('b.item_type = ?');
            params.push(itemType);
        }

        if (search) {
            whereConditions.push('(b.note LIKE ? OR b.tags LIKE ?)');
            const searchPattern = `%${search}%`;
            params.push(searchPattern, searchPattern);
        }

        const whereClause = whereConditions.join(' AND ');

        // 북마크 목록 조회
        params.push(limit, offset);
        const bookmarks = await query(
            `SELECT 
                b.*,
                bf.name as folder_name,
                bf.color as folder_color,
                CASE 
                    WHEN b.item_type = 'post' THEN p.title
                    ELSE NULL
                END as item_title,
                CASE 
                    WHEN b.item_type = 'post' THEN p.content
                    ELSE NULL
                END as item_content,
                CASE 
                    WHEN b.item_type = 'post' THEN u.username
                    ELSE NULL
                END as item_author
            FROM bookmarks b
            LEFT JOIN bookmark_folders bf ON b.folder_id = bf.id
            LEFT JOIN posts p ON b.item_type = 'post' AND b.item_id = p.id
            LEFT JOIN users u ON p.author_id = u.id
            WHERE ${whereClause}
            ORDER BY b.created_at DESC
            LIMIT ? OFFSET ?`,
            params
        );

        // 전체 개수
        const countParams = whereConditions.map((_, index) => params[index]);
        const [countResult] = await query(
            `SELECT COUNT(*) as total FROM bookmarks b WHERE ${whereClause}`,
            countParams
        );

        res.json({
            bookmarks: bookmarks.map(bookmark => ({
                ...bookmark,
                tags: bookmark.tags ? JSON.parse(bookmark.tags) : []
            })),
            pagination: {
                page,
                limit,
                total: countResult.total,
                totalPages: Math.ceil(countResult.total / limit)
            }
        });
    } catch (error) {
        logger.error('Get bookmarks error:', error);
        res.status(500).json({ error: '북마크 목록 조회 중 오류가 발생했습니다' });
    }
});

/**
 * @route   PUT /api/bookmarks/:bookmarkId
 * @desc    북마크 수정 (폴더 이동, 메모, 태그)
 * @access  Private
 */
router.put('/:bookmarkId', async (req, res) => {
    const userId = req.user.id;
    const bookmarkId = req.params.bookmarkId;
    const { folderId, note, tags } = req.body;

    try {
        // 북마크 소유권 확인
        const bookmark = await query(
            'SELECT * FROM bookmarks WHERE id = ? AND user_id = ?',
            [bookmarkId, userId]
        );

        if (!bookmark || bookmark.length === 0) {
            return res.status(404).json({ error: '북마크를 찾을 수 없습니다' });
        }

        // 업데이트
        const updates = [];
        const values = [];

        if (folderId !== undefined) {
            // 폴더 소유권 확인
            const folder = await query(
                'SELECT id FROM bookmark_folders WHERE id = ? AND user_id = ?',
                [folderId, userId]
            );
            if (!folder || folder.length === 0) {
                return res.status(404).json({ error: '폴더를 찾을 수 없습니다' });
            }
            updates.push('folder_id = ?');
            values.push(folderId);
        }

        if (note !== undefined) {
            updates.push('note = ?');
            values.push(note);
        }

        if (tags !== undefined) {
            updates.push('tags = ?');
            values.push(JSON.stringify(tags));
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: '수정할 내용이 없습니다' });
        }

        values.push(bookmarkId);

        await query(
            `UPDATE bookmarks SET ${updates.join(', ')} WHERE id = ?`,
            values
        );

        const updatedBookmark = await query(
            'SELECT * FROM bookmarks WHERE id = ?',
            [bookmarkId]
        );

        logger.info(`User ${userId} updated bookmark ${bookmarkId}`);

        res.json({
            message: '북마크가 수정되었습니다',
            bookmark: {
                ...updatedBookmark[0],
                tags: updatedBookmark[0].tags ? JSON.parse(updatedBookmark[0].tags) : []
            }
        });
    } catch (error) {
        logger.error('Update bookmark error:', error);
        res.status(500).json({ error: '북마크 수정 중 오류가 발생했습니다' });
    }
});

/**
 * @route   GET /api/bookmarks/check/:itemType/:itemId
 * @desc    북마크 여부 확인
 * @access  Private
 */
router.get('/check/:itemType/:itemId', async (req, res) => {
    const userId = req.user.id;
    const { itemType, itemId } = req.params;

    try {
        if (!['post', 'comment'].includes(itemType)) {
            return res.status(400).json({ error: '잘못된 항목 타입입니다' });
        }

        const bookmark = await query(
            'SELECT id, folder_id FROM bookmarks WHERE user_id = ? AND item_type = ? AND item_id = ?',
            [userId, itemType, itemId]
        );

        res.json({
            isBookmarked: bookmark && bookmark.length > 0,
            folderId: bookmark && bookmark.length > 0 ? bookmark[0].folder_id : null
        });
    } catch (error) {
        logger.error('Check bookmark error:', error);
        res.status(500).json({ error: '북마크 확인 중 오류가 발생했습니다' });
    }
});

export default router;
