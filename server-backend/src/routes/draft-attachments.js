/**
 * Draft Attachments Router
 * 초안 첨부파일 업로드 및 관리 API
 */

import express from 'express';
import { upload, processPostImage, deleteFile } from '../middleware/upload.js';
import { buildAuthMiddleware } from '../auth/jwt.js';
import db from '../config/sqlite-db.js';

const router = express.Router();
const authMiddleware = buildAuthMiddleware();

/**
 * POST /api/drafts/attachments
 * 초안에 첨부파일 업로드
 */
router.post('/attachments', authMiddleware, upload.array('files', 5), async (req, res) => {
    
    const userId = req.user.id;
    const { draftId } = req.body;

    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: '업로드할 파일이 없습니다.'
            });
        }

        // draft_id가 제공된 경우 draft 소유권 확인
        if (draftId) {
            const draft = db.prepare('SELECT user_id FROM post_drafts WHERE id = ?').get(draftId);

            if (!draft) {
                return res.status(404).json({
                    success: false,
                    message: '초안을 찾을 수 없습니다.'
                });
            }

            if (draft.user_id !== userId) {
                return res.status(403).json({
                    success: false,
                    message: '이 초안에 대한 권한이 없습니다.'
                });
            }
        }

        const attachments = [];
        const errors = [];

        // 각 파일 처리
        for (const file of req.files) {
            try {
                // postId 대신 임시 ID 사용 (draft_id 또는 timestamp)
                const tempId = draftId || `temp_${Date.now()}`;
                const result = await processPostImage(file, tempId);

                // 메타데이터 추출
                let width = null;
                let height = null;

                if (file.mimetype.startsWith('image/')) {
                    const sharp = (await import('sharp')).default;
                    const metadata = await sharp(file.buffer).metadata();
                    width = metadata.width;
                    height = metadata.height;
                }

                // DB에 첨부파일 정보 저장
                const insertStmt = db.prepare(`
                    INSERT INTO draft_attachments (
                        draft_id, user_id, filename, original_filename,
                        file_path, file_type, file_size, mime_type,
                        width, height, thumbnail_path, upload_status
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `);

                const info = insertStmt.run(
                    draftId || null,
                    userId,
                    result.original.filename,
                    file.originalname,
                    result.original.url,
                    file.mimetype.startsWith('image/') ? 'image' : 'file',
                    result.original.size,
                    file.mimetype,
                    width,
                    height,
                    result.thumbnail?.url || null,
                    'completed'
                );

                attachments.push({
                    id: info.lastInsertRowid,
                    filename: result.original.filename,
                    originalFilename: file.originalname,
                    url: result.original.url,
                    thumbnailUrl: result.thumbnail?.url,
                    fileType: file.mimetype.startsWith('image/') ? 'image' : 'file',
                    size: result.original.size,
                    mimeType: file.mimetype,
                    width,
                    height
                });

            } catch (error) {
                console.error(`Failed to process ${file.originalname}:`, error);
                errors.push({
                    filename: file.originalname,
                    error: error.message
                });
            }
        }

        if (attachments.length === 0) {
            return res.status(500).json({
                success: false,
                message: '모든 파일 처리에 실패했습니다.',
                errors
            });
        }

        res.json({
            success: true,
            message: `${attachments.length}개의 파일이 업로드되었습니다.`,
            attachments,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (error) {
        console.error('Attachment upload error:', error);

        // 업로드 실패 시 파일 삭제
        if (req.files) {
            for (const file of req.files) {
                await deleteFile(file.path).catch(console.error);
            }
        }

        res.status(500).json({
            success: false,
            message: '파일 업로드 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

/**
 * GET /api/drafts/:draftId/attachments
 * 초안의 첨부파일 목록 조회
 */
router.get('/:draftId/attachments', authMiddleware, async (req, res) => {
    
    const userId = req.user.id;
    const { draftId } = req.params;

    try {
        // draft 소유권 확인
        const draft = db.prepare('SELECT user_id FROM post_drafts WHERE id = ?').get(draftId);

        if (!draft) {
            return res.status(404).json({
                success: false,
                message: '초안을 찾을 수 없습니다.'
            });
        }

        if (draft.user_id !== userId) {
            return res.status(403).json({
                success: false,
                message: '이 초안에 대한 권한이 없습니다.'
            });
        }

        // 첨부파일 목록 조회
        const attachments = db.prepare(`
            SELECT 
                id, filename, original_filename, file_path, file_type,
                file_size, mime_type, width, height, thumbnail_path,
                upload_status, created_at
            FROM draft_attachments
            WHERE draft_id = ?
            ORDER BY created_at ASC
        `).all(draftId);

        res.json({
            success: true,
            count: attachments.length,
            attachments: attachments.map(att => ({
                id: att.id,
                filename: att.filename,
                originalFilename: att.original_filename,
                url: att.file_path,
                thumbnailUrl: att.thumbnail_path,
                fileType: att.file_type,
                size: att.file_size,
                mimeType: att.mime_type,
                width: att.width,
                height: att.height,
                uploadStatus: att.upload_status,
                createdAt: att.created_at
            }))
        });

    } catch (error) {
        console.error('Fetch attachments error:', error);
        res.status(500).json({
            success: false,
            message: '첨부파일 목록 조회 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

/**
 * DELETE /api/drafts/attachments/:attachmentId
 * 첨부파일 삭제
 */
router.delete('/attachments/:attachmentId', authMiddleware, async (req, res) => {
    
    const userId = req.user.id;
    const { attachmentId } = req.params;

    try {
        // 첨부파일 정보 조회 및 소유권 확인
        const attachment = db.prepare(`
            SELECT da.*, pd.user_id as draft_user_id
            FROM draft_attachments da
            LEFT JOIN post_drafts pd ON da.draft_id = pd.id
            WHERE da.id = ?
        `).get(attachmentId);

        if (!attachment) {
            return res.status(404).json({
                success: false,
                message: '첨부파일을 찾을 수 없습니다.'
            });
        }

        // 소유권 확인 (draft의 소유자이거나 직접 업로드한 사용자)
        if (attachment.user_id !== userId && attachment.draft_user_id !== userId) {
            return res.status(403).json({
                success: false,
                message: '이 첨부파일에 대한 권한이 없습니다.'
            });
        }

        // 파일 삭제 (물리적)
        const fs = await import('fs/promises');
        const path = await import('path');

        try {
            // 원본 파일 삭제
            if (attachment.file_path) {
                const fullPath = path.join(process.cwd(), 'uploads',
                    attachment.file_path.replace('/uploads/', ''));
                await fs.unlink(fullPath).catch(() => { });
            }

            // 썸네일 삭제
            if (attachment.thumbnail_path) {
                const thumbPath = path.join(process.cwd(), 'uploads',
                    attachment.thumbnail_path.replace('/uploads/', ''));
                await fs.unlink(thumbPath).catch(() => { });
            }
        } catch (fileError) {
            console.error('File deletion error:', fileError);
            // 파일 삭제 실패해도 DB 레코드는 삭제 진행
        }

        // DB에서 삭제
        db.prepare('DELETE FROM draft_attachments WHERE id = ?').run(attachmentId);

        res.json({
            success: true,
            message: '첨부파일이 삭제되었습니다.'
        });

    } catch (error) {
        console.error('Delete attachment error:', error);
        res.status(500).json({
            success: false,
            message: '첨부파일 삭제 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

/**
 * POST /api/drafts/:draftId/attachments/:attachmentId/link
 * 첨부파일을 게시글에 연결 (초안 게시 시)
 */
router.post('/:draftId/attachments/:attachmentId/link', authMiddleware, async (req, res) => {
    
    const userId = req.user.id;
    const { draftId, attachmentId } = req.params;
    const { postId } = req.body;

    try {
        if (!postId) {
            return res.status(400).json({
                success: false,
                message: 'postId가 필요합니다.'
            });
        }

        // draft 소유권 확인
        const draft = db.prepare('SELECT user_id FROM post_drafts WHERE id = ?').get(draftId);

        if (!draft || draft.user_id !== userId) {
            return res.status(403).json({
                success: false,
                message: '권한이 없습니다.'
            });
        }

        // 첨부파일 post_id 업데이트
        db.prepare(`
            UPDATE draft_attachments 
            SET post_id = ?
            WHERE id = ? AND draft_id = ?
        `).run(postId, attachmentId, draftId);

        res.json({
            success: true,
            message: '첨부파일이 게시글에 연결되었습니다.'
        });

    } catch (error) {
        console.error('Link attachment error:', error);
        res.status(500).json({
            success: false,
            message: '첨부파일 연결 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

export default router;
