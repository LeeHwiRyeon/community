/**
 * 프로필 API 서비스
 */

import { apiClient } from '../utils/apiClient';
import type {
    FullProfile,
    UserProfile,
    UserStatistics,
    UserBadge,
    UserAchievement,
    ActivityLog,
    ProfileUpdateData,
    LeaderboardUser,
} from '../types/profile';

/**
 * 전체 프로필 조회
 */
export const getFullProfile = async (userId: number): Promise<FullProfile> => {
    const response = await apiClient.get(`/users/${userId}/profile/full`);
    return response.data;
};

/**
 * 기본 프로필 조회
 */
export const getProfile = async (userId: number): Promise<UserProfile> => {
    const response = await apiClient.get(`/users/${userId}/profile`);
    return response.data;
};

/**
 * 프로필 업데이트
 */
export const updateProfile = async (
    userId: number,
    updates: ProfileUpdateData
): Promise<UserProfile> => {
    const response = await apiClient.put(`/users/${userId}/profile`, updates);
    return response.data;
};

/**
 * 통계 조회
 */
export const getStatistics = async (userId: number): Promise<UserStatistics> => {
    const response = await apiClient.get(`/users/${userId}/statistics`);
    return response.data;
};

/**
 * 활동 로그 조회
 */
export const getActivityLog = async (
    userId: number,
    days: number = 30
): Promise<ActivityLog[]> => {
    const response = await apiClient.get(`/users/${userId}/activity-log`, {
        params: { days },
    });
    return response.data;
};

/**
 * 배지 목록 조회
 */
export const getUserBadges = async (userId: number): Promise<UserBadge[]> => {
    const response = await apiClient.get(`/users/${userId}/badges`);
    return response.data;
};

/**
 * 배지 표시 설정 변경
 */
export const updateBadgeDisplay = async (
    userId: number,
    badgeType: string,
    isDisplayed: boolean,
    displayOrder?: number
): Promise<UserBadge[]> => {
    const response = await apiClient.put(`/users/${userId}/badges/${badgeType}`, {
        isDisplayed,
        displayOrder,
    });
    return response.data;
};

/**
 * 업적 목록 조회
 */
export const getUserAchievements = async (
    userId: number,
    limit: number = 50
): Promise<UserAchievement[]> => {
    const response = await apiClient.get(`/users/${userId}/achievements`, {
        params: { limit },
    });
    return response.data;
};

/**
 * 리더보드 조회
 */
export const getLeaderboard = async (
    type: 'reputation' | 'level' | 'posts' | 'likes' = 'reputation',
    limit: number = 50
): Promise<LeaderboardUser[]> => {
    const response = await apiClient.get('/users/leaderboard', {
        params: { type, limit },
    });
    return response.data;
};

/**
 * 마지막 활동 시간 업데이트
 */
export const updateLastSeen = async (userId: number): Promise<void> => {
    await apiClient.post(`/users/${userId}/last-seen`);
};

/**
 * 경험치 추가 (내부 API)
 */
export const addExperience = async (
    userId: number,
    amount: number
): Promise<{ level: number; experience_points: number; xp_added: number }> => {
    const response = await apiClient.post(`/users/${userId}/experience`, { amount });
    return response.data;
};

/**
 * 평판 업데이트 (내부 API)
 */
export const updateReputation = async (
    userId: number,
    change: number
): Promise<{ reputation: number; change: number }> => {
    const response = await apiClient.post(`/users/${userId}/reputation`, { change });
    return response.data;
};

/**
 * 마일스톤 체크 (내부 API)
 */
export const checkMilestones = async (userId: number): Promise<void> => {
    await apiClient.post(`/users/${userId}/check-milestones`);
};

// Default export
const profileService = {
    getFullProfile,
    getProfile,
    updateProfile,
    getStatistics,
    getUserBadges,
    getUserAchievements,
    getActivityLog,
    getLeaderboard,
    updateReputation,
    checkMilestones
};

export { profileService };
export default profileService;
