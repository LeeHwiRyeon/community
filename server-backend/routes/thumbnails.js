/**
 * Thumbnail Routes
 * 이미지 썸네일 생성 및 관리 API
 */

import express from 'express';
import path from 'path';
import fs from 'fs/promises';
import {
    generateThumbnail,
    getImageMetadata,
    getCacheSize,
    cleanupCache
} from '../services/thumbnail-service.js';
import { authenticateToken } from '../src/auth/jwt.js';

const router = express.Router();

/**
 * POST /api/thumbnails/generate
 * 썸네일 생성
 */
router.post('/generate', authenticateToken, async (req, res) => {
    try {
        const { filePath, size = 'medium', format = 'jpeg', quality = 85 } = req.body;

        if (!filePath) {
            return res.status(400).json({
                success: false,
                error: 'filePath is required'
            });
        }

        // 파일 존재 확인
        try {
            await fs.access(filePath);
        } catch {
            return res.status(404).json({
                success: false,
                error: 'File not found'
            });
        }

        // 썸네일 생성
        const thumbnail = await generateThumbnail(filePath, size, { format, quality });

        // 응답
        res.set('Content-Type', `image/${format}`);
        res.set('Cache-Control', 'public, max-age=31536000'); // 1년 캐시
        res.send(thumbnail);
    } catch (err) {
        console.error('Thumbnail generation error:', err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

/**
 * GET /api/thumbnails/:filename
 * 썸네일 조회 (URL 파라미터)
 */
router.get('/:filename', async (req, res) => {
    try {
        const { filename } = req.params;
        const { size = 'medium' } = req.query;

        // 업로드 디렉토리 경로
        const uploadsDir = path.join(process.cwd(), 'uploads');
        const filePath = path.join(uploadsDir, filename);

        // 파일 존재 확인
        try {
            await fs.access(filePath);
        } catch {
            return res.status(404).json({
                success: false,
                error: 'Image not found'
            });
        }

        // 썸네일 생성
        const thumbnail = await generateThumbnail(filePath, size);

        // 응답
        res.set('Content-Type', 'image/jpeg');
        res.set('Cache-Control', 'public, max-age=31536000');
        res.send(thumbnail);
    } catch (err) {
        console.error('Thumbnail retrieval error:', err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

/**
 * GET /api/thumbnails/metadata/:filename
 * 이미지 메타데이터 조회
 */
router.get('/metadata/:filename', async (req, res) => {
    try {
        const { filename } = req.params;

        const uploadsDir = path.join(process.cwd(), 'uploads');
        const filePath = path.join(uploadsDir, filename);

        // 파일 존재 확인
        try {
            await fs.access(filePath);
        } catch {
            return res.status(404).json({
                success: false,
                error: 'Image not found'
            });
        }

        // 메타데이터 추출
        const metadata = await getImageMetadata(filePath);

        res.json({
            success: true,
            metadata
        });
    } catch (err) {
        console.error('Metadata retrieval error:', err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

/**
 * GET /api/thumbnails/cache/stats
 * 캐시 통계 조회
 */
router.get('/cache/stats', authenticateToken, async (req, res) => {
    try {
        const cacheStats = await getCacheSize();

        res.json({
            success: true,
            cache: cacheStats
        });
    } catch (err) {
        console.error('Cache stats error:', err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

/**
 * DELETE /api/thumbnails/cache/cleanup
 * 캐시 정리 (관리자 전용)
 */
router.delete('/cache/cleanup', authenticateToken, async (req, res) => {
    try {
        // 관리자 권한 확인
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Admin access required'
            });
        }

        const { maxAge } = req.query;
        const maxAgeMs = maxAge ? parseInt(maxAge) * 24 * 60 * 60 * 1000 : undefined;

        const deletedCount = await cleanupCache(maxAgeMs);

        res.json({
            success: true,
            message: `Cleaned up ${deletedCount} cached thumbnails`
        });
    } catch (err) {
        console.error('Cache cleanup error:', err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

export default router;
