/**
 * 파일 업로드 미들웨어
 * Multer + Sharp를 사용한 이미지 업로드 및 처리
 */

import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 업로드 디렉토리 경로
const UPLOAD_DIR = path.join(__dirname, '../../uploads');
const AVATAR_DIR = path.join(UPLOAD_DIR, 'avatars');
const POST_IMAGES_DIR = path.join(UPLOAD_DIR, 'posts');
const THUMBNAILS_DIR = path.join(UPLOAD_DIR, 'thumbnails');

// 디렉토리 생성 (없으면)
async function ensureDirectories() {
    const dirs = [UPLOAD_DIR, AVATAR_DIR, POST_IMAGES_DIR, THUMBNAILS_DIR];
    for (const dir of dirs) {
        try {
            await fs.mkdir(dir, { recursive: true });
        } catch (error) {
            console.error(`Failed to create directory ${dir}:`, error);
        }
    }
}

ensureDirectories();

// Multer 설정 (메모리 저장소 사용)
const storage = multer.memoryStorage();

// 파일 필터 (이미지만 허용)
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('지원하지 않는 파일 형식입니다. JPEG, PNG, WebP, GIF만 허용됩니다.'), false);
    }
};

// Multer 인스턴스
export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
        files: 5
    }
});

/**
 * 아바타 이미지 처리
 * @param {Object} file - Multer file object
 * @param {number} userId - 사용자 ID
 * @returns {Promise<Object>} - 처리된 파일 정보
 */
export async function processAvatar(file, userId) {
    try {
        const filename = `avatar_${userId}_${Date.now()}.webp`;
        const filepath = path.join(AVATAR_DIR, filename);

        // 이미지 리사이징 (200x200, WebP 형식)
        await sharp(file.buffer)
            .resize(200, 200, {
                fit: 'cover',
                position: 'center'
            })
            .webp({ quality: 85 })
            .toFile(filepath);

        return {
            filename,
            url: `/uploads/avatars/${filename}`,
            size: (await fs.stat(filepath)).size
        };
    } catch (error) {
        console.error('Avatar processing error:', error);
        throw new Error('아바타 이미지 처리 중 오류가 발생했습니다.');
    }
}

/**
 * 게시물 이미지 처리
 * @param {Object} file - Multer file object
 * @param {number} postId - 게시물 ID
 * @returns {Promise<Object>} - 처리된 파일 정보 (원본 + 썸네일)
 */
export async function processPostImage(file, postId) {
    try {
        const timestamp = Date.now();
        const originalFilename = `post_${postId}_${timestamp}.webp`;
        const thumbnailFilename = `thumb_${postId}_${timestamp}.webp`;

        const originalPath = path.join(POST_IMAGES_DIR, originalFilename);
        const thumbnailPath = path.join(THUMBNAILS_DIR, thumbnailFilename);

        // 원본 이미지 (최대 1920px, 품질 90%)
        await sharp(file.buffer)
            .resize(1920, 1920, {
                fit: 'inside',
                withoutEnlargement: true
            })
            .webp({ quality: 90 })
            .toFile(originalPath);

        // 썸네일 (300x300, 품질 80%)
        await sharp(file.buffer)
            .resize(300, 300, {
                fit: 'cover',
                position: 'center'
            })
            .webp({ quality: 80 })
            .toFile(thumbnailPath);

        return {
            original: {
                filename: originalFilename,
                url: `/uploads/posts/${originalFilename}`,
                size: (await fs.stat(originalPath)).size
            },
            thumbnail: {
                filename: thumbnailFilename,
                url: `/uploads/thumbnails/${thumbnailFilename}`,
                size: (await fs.stat(thumbnailPath)).size
            }
        };
    } catch (error) {
        console.error('Post image processing error:', error);
        throw new Error('게시물 이미지 처리 중 오류가 발생했습니다.');
    }
}

/**
 * 파일 삭제
 * @param {string} filepath - 삭제할 파일 경로
 */
export async function deleteFile(filepath) {
    try {
        await fs.unlink(filepath);
    } catch (error) {
        console.error('File deletion error:', error);
    }
}

/**
 * 여러 파일 삭제
 * @param {Array<string>} filepaths - 삭제할 파일 경로 배열
 */
export async function deleteFiles(filepaths) {
    for (const filepath of filepaths) {
        await deleteFile(filepath);
    }
}
