import express from 'express';
import { upload, processAvatar, processPostImage, deleteFile } from '../middleware/upload.js';
import { buildAuthMiddleware } from '../auth/jwt.js';
import { query } from '../db.js';

const router = express.Router();
const authMiddleware = buildAuthMiddleware();

router.post('/avatar', authMiddleware, upload.single('avatar'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: '파일이 업로드되지 않았습니다.' });
        }

        const userId = req.user.id;
        const result = await processAvatar(req.file, userId);

        await query(
            'UPDATE users SET avatar_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [result.url, userId]
        );

        res.json({ success: true, url: result.url, message: '아바타 업로드 성공' });

    } catch (error) {
        console.error('Avatar upload error:', error);
        if (req.file) await deleteFile(req.file.path).catch(console.error);
        res.status(500).json({ success: false, message: '아바타 업로드 중 오류가 발생했습니다.', error: error.message });
    }
});

router.post('/post-image', authMiddleware, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: '파일이 업로드되지 않았습니다.' });
        }

        const postId = req.body.postId || Date.now();
        const result = await processPostImage(req.file, postId);

        res.json({ success: true, original: result.original, thumbnail: result.thumbnail, message: '이미지 업로드 성공' });

    } catch (error) {
        console.error('Post image upload error:', error);
        if (req.file) await deleteFile(req.file.path).catch(console.error);
        res.status(500).json({ success: false, message: '이미지 업로드 중 오류가 발생했습니다.', error: error.message });
    }
});

router.post('/post-images', authMiddleware, upload.array('images', 5), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ success: false, message: '파일이 업로드되지 않았습니다.' });
        }

        const postId = req.body.postId || Date.now();
        const results = [];

        for (const file of req.files) {
            try {
                const result = await processPostImage(file, postId);
                results.push(result);
            } catch (error) {
                console.error(`Failed to process ${file.originalname}:`, error);
                await deleteFile(file.path).catch(console.error);
            }
        }

        if (results.length === 0) {
            return res.status(500).json({ success: false, message: '모든 이미지 처리에 실패했습니다.' });
        }

        res.json({ success: true, images: results, message: `${results.length}개의 이미지 업로드 성공` });

    } catch (error) {
        console.error('Multiple images upload error:', error);
        if (req.files) {
            for (const file of req.files) await deleteFile(file.path).catch(console.error);
        }
        res.status(500).json({ success: false, message: '이미지 업로드 중 오류가 발생했습니다.', error: error.message });
    }
});

router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'Upload system is working',
        config: {
            maxFileSize: '10MB',
            allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
            maxFilesPerRequest: 5,
            endpoints: {
                avatar: '/api/upload/avatar',
                postImage: '/api/upload/post-image',
                postImages: '/api/upload/post-images'
            }
        }
    });
});

export default router;
