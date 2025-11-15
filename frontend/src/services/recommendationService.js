/**
 * API Service for Recommendations
 * 추천 시스템 API 호출 유틸리티
 */

import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

/**
 * 사용자 맞춤 게시물 추천 가져오기
 */
export const getRecommendedPosts = async (limit = 10, type = 'hybrid') => {
    try {
        const token = localStorage.getItem('token');

        const response = await axios.get(`${API_BASE_URL}/api/recommendations/posts`, {
            params: { limit, type },
            headers: token ? { Authorization: `Bearer ${token}` } : {}
        });

        return {
            success: true,
            data: response.data.recommendations || [],
            cached: response.data.cached || false
        };
    } catch (error) {
        console.error('getRecommendedPosts error:', error);
        return {
            success: false,
            error: error.response?.data?.error || '추천을 불러올 수 없습니다.'
        };
    }
};

/**
 * 유사 게시물 추천 가져오기
 */
export const getSimilarPosts = async (postId, limit = 10) => {
    try {
        const response = await axios.get(
            `${API_BASE_URL}/api/recommendations/similar/${postId}`,
            { params: { limit } }
        );

        return {
            success: true,
            data: response.data.similar_posts || []
        };
    } catch (error) {
        console.error('getSimilarPosts error:', error);
        return {
            success: false,
            error: error.response?.data?.error || '유사 게시물을 불러올 수 없습니다.'
        };
    }
};

/**
 * 트렌딩 게시물 가져오기
 */
export const getTrendingPosts = async (limit = 10, days = 7) => {
    try {
        const response = await axios.post(
            `${API_BASE_URL}/api/recommendations/trending`,
            null,
            { params: { limit, days } }
        );

        return {
            success: true,
            data: response.data.trending || []
        };
    } catch (error) {
        console.error('getTrendingPosts error:', error);
        return {
            success: false,
            error: error.response?.data?.error || '트렌딩 게시물을 불러올 수 없습니다.'
        };
    }
};

/**
 * 사용자 선호도 분석 가져오기
 */
export const getUserPreferences = async (userId) => {
    try {
        const token = localStorage.getItem('token');

        const response = await axios.get(
            `${API_BASE_URL}/api/recommendations/user/${userId}/preferences`,
            {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            }
        );

        return {
            success: true,
            data: response.data.preferences || []
        };
    } catch (error) {
        console.error('getUserPreferences error:', error);
        return {
            success: false,
            error: error.response?.data?.error || '사용자 선호도를 불러올 수 없습니다.'
        };
    }
};

/**
 * ML 서비스 헬스 체크
 */
export const checkMLServiceHealth = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/api/recommendations/health`);
        return {
            success: true,
            data: response.data
        };
    } catch (error) {
        console.error('checkMLServiceHealth error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * 추천 데이터 리프레시 (관리자 전용)
 */
export const refreshRecommendations = async () => {
    try {
        const token = localStorage.getItem('token');

        const response = await axios.post(
            `${API_BASE_URL}/api/recommendations/refresh`,
            {},
            {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            }
        );

        return {
            success: true,
            message: response.data.message
        };
    } catch (error) {
        console.error('refreshRecommendations error:', error);
        return {
            success: false,
            error: error.response?.data?.error || '리프레시 실패'
        };
    }
};

/**
 * 추천 캐시 클리어 (관리자 전용)
 */
export const clearRecommendationCache = async (pattern = 'recommendations:*') => {
    try {
        const token = localStorage.getItem('token');

        const response = await axios.delete(
            `${API_BASE_URL}/api/recommendations/cache`,
            {
                params: { pattern },
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            }
        );

        return {
            success: true,
            message: response.data.message,
            clearedKeys: response.data.cleared_keys
        };
    } catch (error) {
        console.error('clearRecommendationCache error:', error);
        return {
            success: false,
            error: error.response?.data?.error || '캐시 클리어 실패'
        };
    }
};
