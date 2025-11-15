/**
 * Image Processing Service
 * Sharp를 이용한 이미지 리사이징 및 썸네일 생성
 * 
 * Phase 3 - File Upload System
 * @author Phase 3 Development Team
 * @date 2025-11-12
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

class ImageService {
    /**
     * 이미지 리사이징
     * @param {string} inputPath - 원본 이미지 경로
     * @param {string} outputPath - 출력 이미지 경로
     * @param {number} width - 너비
     * @param {number} height - 높이 (선택)
     * @param {object} options - 추가 옵션
     */
    static async resizeImage(inputPath, outputPath, width, height = null, options = {}) {
        try {
            const sharpInstance = sharp(inputPath);

            // 리사이징 옵션
            const resizeOptions = {
                width,
                fit: options.fit || 'cover', // cover, contain, fill, inside, outside
                withoutEnlargement: options.withoutEnlargement || false
            };

            if (height) {
                resizeOptions.height = height;
            }

            // 이미지 처리
            await sharpInstance
                .resize(resizeOptions)
                .jpeg({ quality: options.quality || 80 })
                .toFile(outputPath);

            return {
                success: true,
                path: outputPath
            };
        } catch (error) {
            console.error('Image resize error:', error);
            throw new Error(`이미지 리사이징 실패: ${error.message}`);
        }
    }

    /**
     * 썸네일 생성
     * @param {string} inputPath - 원본 이미지 경로
     * @param {string} thumbnailDir - 썸네일 저장 디렉토리
     * @param {object} sizes - 썸네일 크기 { small: 150, medium: 300, large: 600 }
     */
    static async createThumbnails(inputPath, thumbnailDir, sizes = {}) {
        const defaultSizes = {
            small: 150,
            medium: 300,
            large: 600
        };

        const thumbnailSizes = { ...defaultSizes, ...sizes };
        const filename = path.basename(inputPath, path.extname(inputPath));
        const ext = path.extname(inputPath);

        const thumbnails = {};

        try {
            // 썸네일 디렉토리 생성
            if (!fs.existsSync(thumbnailDir)) {
                fs.mkdirSync(thumbnailDir, { recursive: true });
            }

            // 각 크기별 썸네일 생성
            for (const [sizeName, width] of Object.entries(thumbnailSizes)) {
                const thumbnailFilename = `${filename}_${sizeName}${ext}`;
                const thumbnailPath = path.join(thumbnailDir, thumbnailFilename);

                await sharp(inputPath)
                    .resize(width, width, {
                        fit: 'cover',
                        position: 'center'
                    })
                    .jpeg({ quality: 80 })
                    .toFile(thumbnailPath);

                thumbnails[sizeName] = {
                    path: thumbnailPath,
                    filename: thumbnailFilename,
                    width: width
                };
            }

            return {
                success: true,
                thumbnails
            };
        } catch (error) {
            console.error('Thumbnail creation error:', error);
            throw new Error(`썸네일 생성 실패: ${error.message}`);
        }
    }

    /**
     * 이미지 메타데이터 조회
     * @param {string} imagePath - 이미지 경로
     */
    static async getImageMetadata(imagePath) {
        try {
            const metadata = await sharp(imagePath).metadata();

            return {
                success: true,
                metadata: {
                    width: metadata.width,
                    height: metadata.height,
                    format: metadata.format,
                    size: metadata.size,
                    space: metadata.space,
                    channels: metadata.channels,
                    hasAlpha: metadata.hasAlpha
                }
            };
        } catch (error) {
            console.error('Get metadata error:', error);
            throw new Error(`메타데이터 조회 실패: ${error.message}`);
        }
    }

    /**
     * 이미지 최적화
     * @param {string} inputPath - 원본 이미지 경로
     * @param {string} outputPath - 출력 이미지 경로 (선택, 없으면 원본 덮어쓰기)
     * @param {object} options - 최적화 옵션
     */
    static async optimizeImage(inputPath, outputPath = null, options = {}) {
        try {
            const output = outputPath || inputPath;
            const sharpInstance = sharp(inputPath);

            // 포맷별 최적화
            const metadata = await sharpInstance.metadata();

            switch (metadata.format) {
                case 'jpeg':
                case 'jpg':
                    await sharpInstance
                        .jpeg({
                            quality: options.quality || 80,
                            progressive: true,
                            mozjpeg: true
                        })
                        .toFile(output);
                    break;

                case 'png':
                    await sharpInstance
                        .png({
                            quality: options.quality || 80,
                            compressionLevel: 9,
                            adaptiveFiltering: true
                        })
                        .toFile(output);
                    break;

                case 'webp':
                    await sharpInstance
                        .webp({
                            quality: options.quality || 80
                        })
                        .toFile(output);
                    break;

                default:
                    await sharpInstance.toFile(output);
            }

            return {
                success: true,
                path: output
            };
        } catch (error) {
            console.error('Image optimization error:', error);
            throw new Error(`이미지 최적화 실패: ${error.message}`);
        }
    }

    /**
     * WebP 변환
     * @param {string} inputPath - 원본 이미지 경로
     * @param {string} outputPath - WebP 출력 경로
     * @param {number} quality - 품질 (0-100)
     */
    static async convertToWebP(inputPath, outputPath, quality = 80) {
        try {
            await sharp(inputPath)
                .webp({ quality })
                .toFile(outputPath);

            return {
                success: true,
                path: outputPath
            };
        } catch (error) {
            console.error('WebP conversion error:', error);
            throw new Error(`WebP 변환 실패: ${error.message}`);
        }
    }

    /**
     * 이미지 크롭
     * @param {string} inputPath - 원본 이미지 경로
     * @param {string} outputPath - 출력 이미지 경로
     * @param {object} cropData - 크롭 데이터 { left, top, width, height }
     */
    static async cropImage(inputPath, outputPath, cropData) {
        try {
            await sharp(inputPath)
                .extract({
                    left: cropData.left,
                    top: cropData.top,
                    width: cropData.width,
                    height: cropData.height
                })
                .toFile(outputPath);

            return {
                success: true,
                path: outputPath
            };
        } catch (error) {
            console.error('Image crop error:', error);
            throw new Error(`이미지 크롭 실패: ${error.message}`);
        }
    }

    /**
     * 이미지 회전
     * @param {string} inputPath - 원본 이미지 경로
     * @param {string} outputPath - 출력 이미지 경로
     * @param {number} angle - 회전 각도 (90, 180, 270)
     */
    static async rotateImage(inputPath, outputPath, angle) {
        try {
            await sharp(inputPath)
                .rotate(angle)
                .toFile(outputPath);

            return {
                success: true,
                path: outputPath
            };
        } catch (error) {
            console.error('Image rotation error:', error);
            throw new Error(`이미지 회전 실패: ${error.message}`);
        }
    }

    /**
     * 파일 삭제
     * @param {string} filePath - 삭제할 파일 경로
     */
    static deleteFile(filePath) {
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                return { success: true };
            }
            return { success: false, message: '파일이 존재하지 않습니다' };
        } catch (error) {
            console.error('File deletion error:', error);
            throw new Error(`파일 삭제 실패: ${error.message}`);
        }
    }
}

module.exports = ImageService;
