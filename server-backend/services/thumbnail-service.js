/**
 * Thumbnail Service
 * 이미지 썸네일 생성 및 캐싱 서비스
 */

import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 썸네일 크기 프리셋
 */
export const THUMBNAIL_SIZES = {
    small: { width: 150, height: 150, fit: 'cover' },
    medium: { width: 800, height: 600, fit: 'inside' },
    large: { width: 1920, height: 1080, fit: 'inside' }
};

/**
 * 썸네일 캐시 디렉토리
 */
const CACHE_DIR = path.join(__dirname, '../data/thumbnails');

/**
 * 캐시 디렉토리 초기화
 */
async function ensureCacheDir() {
    try {
        await fs.access(CACHE_DIR);
    } catch {
        await fs.mkdir(CACHE_DIR, { recursive: true });
    }
}

/**
 * 이미지 해시 생성
 */
function getImageHash(filePath, size) {
    return crypto
        .createHash('md5')
        .update(`${filePath}-${size}`)
        .digest('hex');
}

/**
 * 썸네일 캐시 경로 생성
 */
function getCachePath(hash, ext = 'jpg') {
    return path.join(CACHE_DIR, `${hash}.${ext}`);
}

/**
 * 썸네일 생성
 * @param {string} sourcePath - 원본 이미지 경로
 * @param {string} size - 썸네일 크기 ('small', 'medium', 'large')
 * @param {Object} options - 추가 옵션
 * @returns {Promise<Buffer>} 썸네일 이미지 버퍼
 */
export async function generateThumbnail(sourcePath, size = 'medium', options = {}) {
    await ensureCacheDir();

    const sizeConfig = THUMBNAIL_SIZES[size] || THUMBNAIL_SIZES.medium;
    const hash = getImageHash(sourcePath, size);
    const cachePath = getCachePath(hash);

    // 캐시 확인
    try {
        const cached = await fs.readFile(cachePath);
        return cached;
    } catch {
        // 캐시 없음 - 썸네일 생성
    }

    try {
        // 원본 이미지 읽기
        const imageBuffer = await fs.readFile(sourcePath);

        // Sharp 인스턴스 생성
        let sharpInstance = sharp(imageBuffer);

        // 메타데이터 가져오기
        const metadata = await sharpInstance.metadata();

        // EXIF 방향 자동 회전
        sharpInstance = sharpInstance.rotate();

        // 리사이즈
        sharpInstance = sharpInstance.resize({
            width: sizeConfig.width,
            height: sizeConfig.height,
            fit: sizeConfig.fit,
            withoutEnlargement: true, // 원본보다 크게 하지 않음
            ...options.resize
        });

        // 포맷 설정
        const format = options.format || 'jpeg';
        const quality = options.quality || 85;

        if (format === 'jpeg' || format === 'jpg') {
            sharpInstance = sharpInstance.jpeg({
                quality,
                progressive: true,
                mozjpeg: true
            });
        } else if (format === 'png') {
            sharpInstance = sharpInstance.png({
                quality,
                compressionLevel: 9
            });
        } else if (format === 'webp') {
            sharpInstance = sharpInstance.webp({
                quality,
                effort: 6
            });
        }

        // 썸네일 생성
        const thumbnailBuffer = await sharpInstance.toBuffer();

        // 캐시 저장
        try {
            await fs.writeFile(cachePath, thumbnailBuffer);
        } catch (err) {
            console.error('Failed to cache thumbnail:', err);
        }

        return thumbnailBuffer;
    } catch (err) {
        console.error('Failed to generate thumbnail:', err);
        throw new Error(`Thumbnail generation failed: ${err.message}`);
    }
}

/**
 * 여러 크기의 썸네일 생성
 * @param {string} sourcePath - 원본 이미지 경로
 * @param {string[]} sizes - 생성할 크기 배열
 * @returns {Promise<Object>} 크기별 썸네일 버퍼
 */
export async function generateMultipleThumbnails(sourcePath, sizes = ['small', 'medium']) {
    const thumbnails = {};

    for (const size of sizes) {
        try {
            thumbnails[size] = await generateThumbnail(sourcePath, size);
        } catch (err) {
            console.error(`Failed to generate ${size} thumbnail:`, err);
            thumbnails[size] = null;
        }
    }

    return thumbnails;
}

/**
 * 이미지 메타데이터 추출
 * @param {string} filePath - 이미지 파일 경로
 * @returns {Promise<Object>} 이미지 메타데이터
 */
export async function getImageMetadata(filePath) {
    try {
        const metadata = await sharp(filePath).metadata();

        return {
            format: metadata.format,
            width: metadata.width,
            height: metadata.height,
            space: metadata.space,
            channels: metadata.channels,
            depth: metadata.depth,
            density: metadata.density,
            hasAlpha: metadata.hasAlpha,
            orientation: metadata.orientation,
            size: metadata.size
        };
    } catch (err) {
        console.error('Failed to get image metadata:', err);
        throw new Error(`Metadata extraction failed: ${err.message}`);
    }
}

/**
 * 이미지 최적화
 * @param {string} sourcePath - 원본 이미지 경로
 * @param {string} outputPath - 출력 경로
 * @param {Object} options - 최적화 옵션
 */
export async function optimizeImage(sourcePath, outputPath, options = {}) {
    try {
        let sharpInstance = sharp(sourcePath);

        // 자동 회전
        sharpInstance = sharpInstance.rotate();

        // 포맷 설정
        const format = options.format || 'jpeg';
        const quality = options.quality || 85;

        if (format === 'jpeg' || format === 'jpg') {
            sharpInstance = sharpInstance.jpeg({
                quality,
                progressive: true,
                mozjpeg: true
            });
        } else if (format === 'png') {
            sharpInstance = sharpInstance.png({
                quality,
                compressionLevel: 9,
                adaptiveFiltering: true
            });
        } else if (format === 'webp') {
            sharpInstance = sharpInstance.webp({
                quality,
                effort: 6
            });
        }

        // 저장
        await sharpInstance.toFile(outputPath);

        return true;
    } catch (err) {
        console.error('Failed to optimize image:', err);
        throw new Error(`Image optimization failed: ${err.message}`);
    }
}

/**
 * 썸네일 캐시 정리
 * @param {number} maxAge - 최대 보관 기간 (밀리초)
 */
export async function cleanupCache(maxAge = 7 * 24 * 60 * 60 * 1000) { // 기본 7일
    try {
        await ensureCacheDir();
        const files = await fs.readdir(CACHE_DIR);
        const now = Date.now();
        let deletedCount = 0;

        for (const file of files) {
            const filePath = path.join(CACHE_DIR, file);
            const stats = await fs.stat(filePath);

            if (now - stats.mtimeMs > maxAge) {
                await fs.unlink(filePath);
                deletedCount++;
            }
        }

        console.log(`Cleaned up ${deletedCount} cached thumbnails`);
        return deletedCount;
    } catch (err) {
        console.error('Failed to cleanup cache:', err);
        throw new Error(`Cache cleanup failed: ${err.message}`);
    }
}

/**
 * 썸네일 캐시 크기 확인
 */
export async function getCacheSize() {
    try {
        await ensureCacheDir();
        const files = await fs.readdir(CACHE_DIR);
        let totalSize = 0;

        for (const file of files) {
            const stats = await fs.stat(path.join(CACHE_DIR, file));
            totalSize += stats.size;
        }

        return {
            files: files.length,
            size: totalSize,
            sizeInMB: (totalSize / (1024 * 1024)).toFixed(2)
        };
    } catch (err) {
        console.error('Failed to get cache size:', err);
        return { files: 0, size: 0, sizeInMB: '0.00' };
    }
}

export default {
    generateThumbnail,
    generateMultipleThumbnails,
    getImageMetadata,
    optimizeImage,
    cleanupCache,
    getCacheSize,
    THUMBNAIL_SIZES
};
