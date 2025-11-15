/**
 * Gallery API
 * 이미지 갤러리 관련 API 함수
 */

import axios from 'axios';
import { GalleryImage } from '../components/gallery/ImageGallery';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
});

// 요청 인터셉터 - JWT 토큰 자동 추가
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

/**
 * 이미지 목록 조회
 */
export async function getImages(params?: {
    page?: number;
    limit?: number;
    tags?: string[];
    author?: string;
}): Promise<{ images: GalleryImage[]; total: number }> {
    const response = await apiClient.get('/api/images', { params });
    return response.data;
}

/**
 * 이미지 상세 조회
 */
export async function getImage(imageId: number): Promise<GalleryImage> {
    const response = await apiClient.get(`/api/images/${imageId}`);
    return response.data;
}

/**
 * 이미지 업로드
 */
export async function uploadImage(file: File, metadata?: {
    title?: string;
    description?: string;
    tags?: string[];
}): Promise<GalleryImage> {
    const formData = new FormData();
    formData.append('image', file);

    if (metadata) {
        if (metadata.title) formData.append('title', metadata.title);
        if (metadata.description) formData.append('description', metadata.description);
        if (metadata.tags) formData.append('tags', JSON.stringify(metadata.tags));
    }

    const response = await apiClient.post('/api/images', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
}

/**
 * 이미지 삭제
 */
export async function deleteImage(imageId: number): Promise<void> {
    await apiClient.delete(`/api/images/${imageId}`);
}

/**
 * 이미지 좋아요
 */
export async function likeImage(imageId: number): Promise<{ likes: number }> {
    const response = await apiClient.post(`/api/images/${imageId}/like`);
    return response.data;
}

/**
 * 이미지 좋아요 취소
 */
export async function unlikeImage(imageId: number): Promise<{ likes: number }> {
    const response = await apiClient.delete(`/api/images/${imageId}/like`);
    return response.data;
}

/**
 * 썸네일 URL 생성
 */
export function getThumbnailUrl(filename: string, size: 'small' | 'medium' | 'large' = 'medium'): string {
    return `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/thumbnails/${filename}?size=${size}`;
}

/**
 * 이미지 메타데이터 조회
 */
export async function getImageMetadata(filename: string): Promise<{
    format: string;
    width: number;
    height: number;
    size: number;
}> {
    const response = await apiClient.get(`/api/thumbnails/metadata/${filename}`);
    return response.data.metadata;
}

/**
 * 썸네일 캐시 통계 조회
 */
export async function getCacheStats(): Promise<{
    files: number;
    size: number;
    sizeInMB: string;
}> {
    const response = await apiClient.get('/api/thumbnails/cache/stats');
    return response.data.cache;
}

/**
 * 썸네일 캐시 정리 (관리자 전용)
 */
export async function cleanupCache(maxAgeDays?: number): Promise<{ deletedCount: number }> {
    const response = await apiClient.delete('/api/thumbnails/cache/cleanup', {
        params: { maxAge: maxAgeDays }
    });
    return response.data;
}
