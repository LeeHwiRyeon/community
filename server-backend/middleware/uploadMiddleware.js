/**
 * Upload Middleware Configuration
 * Multer 파일 업로드 미들웨어 설정
 * 
 * Phase 3 - File Upload System
 * @author Phase 3 Development Team
 * @date 2025-11-12
 */

import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 업로드 디렉토리 생성
const uploadDir = path.join(__dirname, '../uploads');
const imagesDir = path.join(uploadDir, 'images');
const filesDir = path.join(uploadDir, 'files');
const thumbnailsDir = path.join(uploadDir, 'thumbnails');

// 디렉토리가 없으면 생성
[uploadDir, imagesDir, filesDir, thumbnailsDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// 파일 저장 설정 (디스크 스토리지)
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // 파일 타입에 따라 저장 경로 결정
        if (file.mimetype.startsWith('image/')) {
            cb(null, imagesDir);
        } else {
            cb(null, filesDir);
        }
    },
    filename: function (req, file, cb) {
        // 파일명 생성: timestamp-randomstring-originalname
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const nameWithoutExt = path.basename(file.originalname, ext);
        const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9가-힣]/g, '_');
        cb(null, `${sanitizedName}-${uniqueSuffix}${ext}`);
    }
});

// 파일 필터 (허용된 파일 타입만)
const fileFilter = (req, file, cb) => {
    // 허용된 MIME 타입
    const allowedImageTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml'
    ];

    const allowedFileTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        'application/zip',
        'application/x-zip-compressed'
    ];

    const allAllowedTypes = [...allowedImageTypes, ...allowedFileTypes];

    if (allAllowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`허용되지 않은 파일 형식입니다: ${file.mimetype}`), false);
    }
};

// Multer 업로드 인스턴스 생성
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB 제한
        files: 5 // 최대 5개 파일
    }
});

// 이미지 전용 업로드 (5MB 제한)
const imageUpload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const allowedImageTypes = [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/gif',
            'image/webp'
        ];

        if (allowedImageTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('이미지 파일만 업로드 가능합니다 (jpg, png, gif, webp)'), false);
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB 제한
        files: 10 // 최대 10개 이미지
    }
});

// 에러 핸들러
const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        // Multer 에러
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                error: '파일 크기가 제한을 초과했습니다 (최대 10MB)'
            });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                error: '파일 개수가 제한을 초과했습니다 (최대 5개)'
            });
        }
        return res.status(400).json({
            success: false,
            error: `파일 업로드 오류: ${err.message}`
        });
    } else if (err) {
        // 기타 에러
        return res.status(400).json({
            success: false,
            error: err.message || '파일 업로드 중 오류가 발생했습니다'
        });
    }
    next();
};

export {
    upload,
    imageUpload,
    handleUploadError,
    uploadDir,
    imagesDir,
    filesDir,
    thumbnailsDir
};

export default {
    upload,
    imageUpload,
    handleUploadError,
    uploadDir,
    imagesDir,
    filesDir,
    thumbnailsDir
};
