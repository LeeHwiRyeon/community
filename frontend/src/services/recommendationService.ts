/**
 * Recommendation API Service
 * Client for interacting with recommendation endpoints
 */

import { apiClient } from '../utils/apiClient';
import type {
    RecommendationsResponse,
    RecommendationStats,
    RecommendationHealthStatus,
    PostRecommendation,
    UserRecommendation,
    RecommendationItem
} from '../types/recommendation';

/**
 * Get personalized post recommendations for a user
 */
export async function getPostRecommendations(
    userId: number,
    limit: number = 10,
    excludeViewed: boolean = true
): Promise<PostRecommendation[]> {
    const response = await apiClient.get(
        `/api/recommendations/posts/${userId}`,
        {
            params: { limit, exclude_viewed: excludeViewed }
        }
    );

    const data = response.data as RecommendationsResponse;

    // Enrich recommendations with post details
    const enrichedRecommendations = await Promise.all(
        data.recommendations.map(async (rec: RecommendationItem) => {
            try {
                const postResponse = await apiClient.get(`/api/posts/${rec.post_id}`);
                return {
                    ...rec,
                    ...postResponse.data
                };
            } catch (error) {
                console.error(`Failed to fetch post ${rec.post_id}:`, error);
                return rec;
            }
        })
    );

    return enrichedRecommendations;
}

/**
 * Get user recommendations (similar users to follow)
 */
export async function getUserRecommendations(
    userId: number,
    limit: number = 10
): Promise<UserRecommendation[]> {
    const response = await apiClient.get(
        `/api/recommendations/users/${userId}`,
        {
            params: { limit }
        }
    );

    const data = response.data as RecommendationsResponse;

    // Enrich recommendations with user details
    const enrichedRecommendations = await Promise.all(
        response.data.recommendations.map(async (rec: RecommendationItem) => {
            try {
                const userResponse = await apiClient.get(`/api/users/${rec.user_id}`);
                return {
                    ...rec,
                    ...userResponse.data
                };
            } catch (error) {
                console.error(`Failed to fetch user ${rec.user_id}:`, error);
                return rec;
            }
        })
    );

    return enrichedRecommendations;
}

/**
 * Get similar posts based on content
 */
export async function getSimilarPosts(
    postId: number,
    limit: number = 10
): Promise<PostRecommendation[]> {
    const response = await apiClient.get(
        `/api/recommendations/similar/${postId}`,
        {
            params: { limit }
        }
    );

    const data = response.data as RecommendationsResponse;

    // Enrich recommendations with post details
    const enrichedRecommendations = await Promise.all(
        response.data.recommendations.map(async (rec: RecommendationItem) => {
            try {
                const postResponse = await apiClient.get(`/api/posts/${rec.post_id}`);
                return {
                    ...rec,
                    ...postResponse.data
                };
            } catch (error) {
                console.error(`Failed to fetch post ${rec.post_id}:`, error);
                return rec;
            }
        })
    );

    return enrichedRecommendations;
}

/**
 * Manually trigger model refresh (admin only)
 */
export async function refreshRecommendationModel(): Promise<{ status: string; message: string }> {
    const response = await apiClient.post('/api/recommendations/refresh');
    return response.data;
}

/**
 * Get recommendation engine statistics (admin only)
 */
export async function getRecommendationStats(): Promise<RecommendationStats> {
    const response = await apiClient.get('/api/recommendations/stats');
    return response.data as RecommendationStats;
}

/**
 * Check if recommendation service is available
 */
export async function checkRecommendationHealth(): Promise<RecommendationHealthStatus> {
    try {
        const response = await apiClient.get('/api/recommendations/health');
        return response.data as RecommendationHealthStatus;
    } catch (error) {
        return {
            status: 'offline',
            error: 'Service unavailable'
        };
    }
}
