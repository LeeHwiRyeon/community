/**
 * Social API Service
 * 소셜 기능 API 클라이언트
 */

import { apiClient } from '../utils/apiClient';
import type {
    FollowResponse,
    UnfollowResponse,
    FollowersResponse,
    FollowingResponse,
    FollowStats,
    FollowStatus,
    FollowSuggestionsResponse,
    FollowerUser,
    MentionsResponse,
    MentionCreateResponse,
    UserSearchResponse,
    SharePlatform,
    ShareResponse,
    ShareStats,
    TrendingSharesResponse,
    UserSharesResponse,
    GlobalShareStats,
    BlockResponse,
    UnblockResponse,
    BlockedUsersResponse,
    BlockStatus,
    BlockStats
} from '../types/social';

const BASE_URL = '/api/social';

// ============================================
// Follow API
// ============================================

/**
 * 사용자 팔로우
 */
export async function followUser(userId: number): Promise<FollowResponse> {
    const response = await apiClient.post(`${BASE_URL}/follow/${userId}`);
    return response.data as FollowResponse;
}

/**
 * 사용자 언팔로우
 */
export async function unfollowUser(userId: number): Promise<UnfollowResponse> {
    const response = await apiClient.delete(`${BASE_URL}/follow/${userId}`);
    return response.data as UnfollowResponse;
}

/**
 * 팔로워 목록 조회
 */
export async function getFollowers(
    userId: number,
    limit: number = 20,
    offset: number = 0
): Promise<FollowersResponse> {
    const response = await apiClient.get(
        `${BASE_URL}/followers/${userId}`,
        { params: { limit, offset } }
    );
    return response.data as FollowersResponse;
}

/**
 * 팔로잉 목록 조회
 */
export async function getFollowing(
    userId: number,
    limit: number = 20,
    offset: number = 0
): Promise<FollowingResponse> {
    const response = await apiClient.get(
        `${BASE_URL}/following/${userId}`,
        { params: { limit, offset } }
    );
    return response.data as FollowingResponse;
}

/**
 * 팔로우 상태 확인
 */
export async function checkFollowStatus(userId: number): Promise<FollowStatus> {
    const response = await apiClient.get(`${BASE_URL}/follow/status/${userId}`);
    return response.data as FollowStatus;
}

/**
 * 팔로우 통계 조회
 */
export async function getFollowStats(userId: number): Promise<FollowStats> {
    const response = await apiClient.get(`${BASE_URL}/follow/stats/${userId}`);
    return response.data as FollowStats;
}

/**
 * 팔로우 추천 목록 조회
 */
export async function getFollowSuggestions(limit: number = 10): Promise<FollowSuggestionsResponse> {
    const response = await apiClient.get(
        `${BASE_URL}/follow/suggestions`,
        { params: { limit } }
    );
    return response.data as FollowSuggestionsResponse;
}

/**
 * 최근 팔로워 조회
 */
export async function getRecentFollowers(userId: number, limit: number = 5): Promise<{ followers: FollowerUser[] }> {
    const response = await apiClient.get(
        `${BASE_URL}/follow/recent/${userId}`,
        { params: { limit } }
    );
    return response.data as { followers: FollowerUser[] };
}

// ============================================
// Mention API
// ============================================

/**
 * 내 멘션 목록 조회
 */
export async function getMentions(
    limit: number = 20,
    offset: number = 0
): Promise<MentionsResponse> {
    const response = await apiClient.get(
        `${BASE_URL}/mentions`,
        { params: { limit, offset } }
    );
    return response.data as MentionsResponse;
}

/**
 * 게시물의 멘션 목록 조회
 */
export async function getPostMentions(postId: number): Promise<{ mentions: any[] }> {
    const response = await apiClient.get(`${BASE_URL}/mentions/post/${postId}`);
    return response.data as { mentions: any[] };
}

/**
 * 댓글의 멘션 목록 조회
 */
export async function getCommentMentions(commentId: number): Promise<{ mentions: any[] }> {
    const response = await apiClient.get(`${BASE_URL}/mentions/comment/${commentId}`);
    return response.data as { mentions: any[] };
}

/**
 * 멘션 읽음 처리
 */
export async function markMentionAsRead(mentionId: number): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.put(`${BASE_URL}/mentions/${mentionId}/read`);
    return response.data as { success: boolean; message: string };
}

/**
 * 모든 멘션 읽음 처리
 */
export async function markAllMentionsAsRead(): Promise<{ success: boolean; markedCount: number; message: string }> {
    const response = await apiClient.put(`${BASE_URL}/mentions/read-all`);
    return response.data as { success: boolean; markedCount: number; message: string };
}

/**
 * 읽지 않은 멘션 개수 조회
 */
export async function getUnreadMentionCount(): Promise<{ count: number }> {
    const response = await apiClient.get(`${BASE_URL}/mentions/unread-count`);
    return response.data as { count: number };
}

/**
 * 사용자명 검색 (자동완성용)
 */
export async function searchUsernames(query: string, limit: number = 10): Promise<UserSearchResponse> {
    const response = await apiClient.get(
        `${BASE_URL}/mentions/search-users`,
        { params: { q: query, limit } }
    );
    return response.data as UserSearchResponse;
}

// ============================================
// Share API
// ============================================

/**
 * 게시물 공유 추적
 */
export async function trackShare(postId: number, platform: SharePlatform): Promise<ShareResponse> {
    const response = await apiClient.post(`${BASE_URL}/share/${postId}`, { platform });
    return response.data as ShareResponse;
}

/**
 * 게시물 공유 통계 조회
 */
export async function getShareStats(postId: number): Promise<ShareStats> {
    const response = await apiClient.get(`${BASE_URL}/share/stats/${postId}`);
    return response.data as ShareStats;
}

/**
 * 인기 공유 게시물 조회
 */
export async function getTrendingShares(
    limit: number = 10,
    days: number = 7
): Promise<TrendingSharesResponse> {
    const response = await apiClient.get(
        `${BASE_URL}/share/trending`,
        { params: { limit, days } }
    );
    return response.data as TrendingSharesResponse;
}

/**
 * 플랫폼별 인기 공유 게시물
 */
export async function getSharesByPlatform(
    platform: SharePlatform,
    limit: number = 10,
    days: number = 7
): Promise<TrendingSharesResponse> {
    const response = await apiClient.get(
        `${BASE_URL}/share/by-platform/${platform}`,
        { params: { limit, days } }
    );
    return response.data as TrendingSharesResponse;
}

/**
 * 내 공유 기록 조회
 */
export async function getMyShares(
    limit: number = 20,
    offset: number = 0
): Promise<UserSharesResponse> {
    const response = await apiClient.get(
        `${BASE_URL}/share/my-shares`,
        { params: { limit, offset } }
    );
    return response.data as UserSharesResponse;
}

/**
 * 전체 공유 통계
 */
export async function getGlobalShareStats(): Promise<GlobalShareStats> {
    const response = await apiClient.get(`${BASE_URL}/share/global-stats`);
    return response.data as GlobalShareStats;
}

// ============================================
// Block API
// ============================================

/**
 * 사용자 차단
 */
export async function blockUser(userId: number, reason?: string): Promise<BlockResponse> {
    const response = await apiClient.post(`${BASE_URL}/block/${userId}`, { reason });
    return response.data as BlockResponse;
}

/**
 * 사용자 차단 해제
 */
export async function unblockUser(userId: number): Promise<UnblockResponse> {
    const response = await apiClient.delete(`${BASE_URL}/block/${userId}`);
    return response.data as UnblockResponse;
}

/**
 * 차단한 사용자 목록 조회
 */
export async function getBlockedUsers(limit: number = 20, offset: number = 0): Promise<BlockedUsersResponse> {
    const response = await apiClient.get(`${BASE_URL}/blocked`, {
        params: { limit, offset }
    });
    return response.data as BlockedUsersResponse;
}

/**
 * 차단 상태 확인
 */
export async function checkBlockStatus(userId: number): Promise<BlockStatus> {
    const response = await apiClient.get(`${BASE_URL}/block/status/${userId}`);
    return response.data as BlockStatus;
}

/**
 * 차단 통계 조회
 */
export async function getBlockStats(): Promise<BlockStats> {
    const response = await apiClient.get(`${BASE_URL}/block/stats`);
    return response.data as BlockStats;
}

// ============================================
// Export all
// ============================================

export default {
    followUser,
    unfollowUser,
    getFollowers,
    getFollowing,
    checkFollowStatus,
    getFollowStats,
    getFollowSuggestions,
    getRecentFollowers,
    getMentions,
    getPostMentions,
    getCommentMentions,
    markMentionAsRead,
    markAllMentionsAsRead,
    getUnreadMentionCount,
    searchUsernames,
    trackShare,
    getShareStats,
    getTrendingShares,
    getSharesByPlatform,
    getMyShares,
    getGlobalShareStats,
    blockUser,
    unblockUser,
    getBlockedUsers,
    checkBlockStatus,
    getBlockStats
};
