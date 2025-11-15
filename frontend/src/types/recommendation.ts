/**
 * Recommendation Types
 * Type definitions for recommendation system
 */

export interface RecommendationItem {
    post_id?: number;
    user_id?: number;
    score: number;
}

export interface PostRecommendation {
    post_id: number;
    score: number;
    // Post details (populated from API)
    title?: string;
    content?: string;
    author_name?: string;
    category?: string;
    created_at?: string;
    like_count?: number;
    comment_count?: number;
    view_count?: number;
}

export interface UserRecommendation {
    user_id: number;
    score: number;
    // User details (populated from API)
    username?: string;
    bio?: string;
    post_count?: number;
    follower_count?: number;
}

export interface RecommendationsResponse {
    user_id?: number;
    post_id?: number;
    recommendations: RecommendationItem[];
    count: number;
}

export interface RecommendationStats {
    last_update: string | null;
    update_interval: number;
    min_interactions: number;
    similarity_threshold: number;
    use_hybrid: boolean;
    user_item_matrix_shape: [number, number] | null;
    num_posts: number;
    cache_enabled: boolean;
}

export interface RecommendationHealthStatus {
    status: 'online' | 'offline';
    service?: {
        status: string;
        service: string;
        version: string;
    };
    error?: string;
}
