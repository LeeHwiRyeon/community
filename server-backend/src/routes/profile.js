/**
 * 프로필 API 라우터
 * 사용자 프로필, 통계, 배지, 업적 관리
 */

import express from 'express';
import profileService from '../services/profile-service.js';
import { authenticateToken } from '../auth/jwt.js';

const router = express.Router();

// =============================================================================
// 프로필 조회 및 수정
// =============================================================================

/**
 * GET /api/users/:id/profile/full
 * 전체 프로필 조회 (프로필 + 통계 + 배지 + 업적 + 활동로그)
 */
router.get('/:id/profile/full', async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        if (isNaN(userId)) {
            return res.status(400).json({ error: 'Invalid user ID' });
        }

        const profile = await profileService.getFullProfile(userId);

        // 프라이버시 설정에 따라 이메일/위치 필터링
        const requestingUserId = req.user?.userId;
        if (requestingUserId !== userId) {
            if (!profile.user.show_email) {
                profile.user.email = null;
            }
            if (!profile.user.show_location) {
                profile.user.location = null;
            }
        }

        res.json(profile);
    } catch (error) {
        console.error('Error fetching full profile:', error);
        if (error.message === 'User not found') {
            res.status(404).json({ error: 'User not found' });
        } else {
            res.status(500).json({ error: 'Failed to fetch profile' });
        }
    }
});

/**
 * GET /api/users/:id/profile
 * 기본 프로필 조회
 */
router.get('/:id/profile', async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        if (isNaN(userId)) {
            return res.status(400).json({ error: 'Invalid user ID' });
        }

        const profile = await profileService.getProfile(userId);

        // 프라이버시 설정
        const requestingUserId = req.user?.userId;
        if (requestingUserId !== userId) {
            if (!profile.show_email) profile.email = null;
            if (!profile.show_location) profile.location = null;
        }

        res.json(profile);
    } catch (error) {
        console.error('Error fetching profile:', error);
        if (error.message === 'User not found') {
            res.status(404).json({ error: 'User not found' });
        } else {
            res.status(500).json({ error: 'Failed to fetch profile' });
        }
    }
});

/**
 * PUT /api/users/:id/profile
 * 프로필 수정 (인증 필요, 본인만 가능)
 */
router.put('/:id/profile', authenticateToken, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        if (isNaN(userId)) {
            return res.status(400).json({ error: 'Invalid user ID' });
        }

        // 본인만 수정 가능
        if (req.user.userId !== userId) {
            return res.status(403).json({ error: 'Forbidden: Can only update own profile' });
        }

        const updates = req.body;
        const updatedProfile = await profileService.updateProfile(userId, updates);

        // 마지막 활동 시간 업데이트
        await profileService.updateLastSeen(userId);

        res.json(updatedProfile);
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(400).json({ error: error.message });
    }
});

// =============================================================================
// 통계 조회
// =============================================================================

/**
 * GET /api/users/:id/statistics
 * 사용자 통계 조회
 */
router.get('/:id/statistics', async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        if (isNaN(userId)) {
            return res.status(400).json({ error: 'Invalid user ID' });
        }

        const statistics = await profileService.getStatistics(userId);
        res.json(statistics);
    } catch (error) {
        console.error('Error fetching statistics:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

/**
 * GET /api/users/:id/activity-log
 * 활동 로그 조회
 */
router.get('/:id/activity-log', async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        if (isNaN(userId)) {
            return res.status(400).json({ error: 'Invalid user ID' });
        }

        const days = parseInt(req.query.days) || 30;
        if (days < 1 || days > 365) {
            return res.status(400).json({ error: 'Days must be between 1 and 365' });
        }

        const activityLog = await profileService.getActivityLog(userId, days);
        res.json(activityLog);
    } catch (error) {
        console.error('Error fetching activity log:', error);
        res.status(500).json({ error: 'Failed to fetch activity log' });
    }
});

// =============================================================================
// 배지 관리
// =============================================================================

/**
 * GET /api/users/:id/badges
 * 사용자 배지 목록 조회
 */
router.get('/:id/badges', async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        if (isNaN(userId)) {
            return res.status(400).json({ error: 'Invalid user ID' });
        }

        const badges = await profileService.getUserBadges(userId);
        res.json(badges);
    } catch (error) {
        console.error('Error fetching badges:', error);
        res.status(500).json({ error: 'Failed to fetch badges' });
    }
});

/**
 * POST /api/users/:id/badges
 * 배지 수여 (관리자 전용)
 */
router.post('/:id/badges', authenticateToken, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        if (isNaN(userId)) {
            return res.status(400).json({ error: 'Invalid user ID' });
        }

        // TODO: 관리자 권한 체크 필요
        // if (!req.user.isAdmin) {
        //   return res.status(403).json({ error: 'Admin only' });
        // }

        const { badgeType, icon, color } = req.body;
        if (!badgeType) {
            return res.status(400).json({ error: 'badgeType is required' });
        }

        const result = await profileService.awardBadge(userId, badgeType, { icon, color });

        if (result.awarded) {
            res.status(201).json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        console.error('Error awarding badge:', error);
        res.status(500).json({ error: 'Failed to award badge' });
    }
});

/**
 * PUT /api/users/:id/badges/:badgeType
 * 배지 표시 설정 변경 (본인만 가능)
 */
router.put('/:id/badges/:badgeType', authenticateToken, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const badgeType = req.params.badgeType;

        if (isNaN(userId)) {
            return res.status(400).json({ error: 'Invalid user ID' });
        }

        // 본인만 수정 가능
        if (req.user.userId !== userId) {
            return res.status(403).json({ error: 'Forbidden: Can only update own badges' });
        }

        const { isDisplayed, displayOrder } = req.body;
        if (isDisplayed === undefined) {
            return res.status(400).json({ error: 'isDisplayed is required' });
        }

        const badges = await profileService.updateBadgeDisplay(
            userId,
            badgeType,
            isDisplayed,
            displayOrder
        );

        res.json(badges);
    } catch (error) {
        console.error('Error updating badge display:', error);
        res.status(400).json({ error: error.message });
    }
});

// =============================================================================
// 업적 관리
// =============================================================================

/**
 * GET /api/users/:id/achievements
 * 사용자 업적 목록 조회
 */
router.get('/:id/achievements', async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        if (isNaN(userId)) {
            return res.status(400).json({ error: 'Invalid user ID' });
        }

        const limit = parseInt(req.query.limit) || 50;
        if (limit < 1 || limit > 200) {
            return res.status(400).json({ error: 'Limit must be between 1 and 200' });
        }

        const achievements = await profileService.getUserAchievements(userId, limit);
        res.json(achievements);
    } catch (error) {
        console.error('Error fetching achievements:', error);
        res.status(500).json({ error: 'Failed to fetch achievements' });
    }
});

/**
 * POST /api/users/:id/achievements
 * 업적 기록 (내부 API, 인증 필요)
 */
router.post('/:id/achievements', authenticateToken, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        if (isNaN(userId)) {
            return res.status(400).json({ error: 'Invalid user ID' });
        }

        const { achievementType, milestoneValue, title, description, icon } = req.body;

        if (!achievementType || !milestoneValue) {
            return res.status(400).json({
                error: 'achievementType and milestoneValue are required'
            });
        }

        const result = await profileService.recordAchievement(
            userId,
            achievementType,
            milestoneValue,
            { title, description, icon }
        );

        if (result.recorded) {
            res.status(201).json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        console.error('Error recording achievement:', error);
        res.status(500).json({ error: 'Failed to record achievement' });
    }
});

// =============================================================================
// 경험치 및 평판
// =============================================================================

/**
 * POST /api/users/:id/experience
 * 경험치 추가 (내부 API, 인증 필요)
 */
router.post('/:id/experience', authenticateToken, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        if (isNaN(userId)) {
            return res.status(400).json({ error: 'Invalid user ID' });
        }

        const { amount } = req.body;
        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Valid amount is required' });
        }

        const result = await profileService.addExperience(userId, amount);
        res.json(result);
    } catch (error) {
        console.error('Error adding experience:', error);
        res.status(500).json({ error: 'Failed to add experience' });
    }
});

/**
 * POST /api/users/:id/reputation
 * 평판 점수 업데이트 (내부 API, 인증 필요)
 */
router.post('/:id/reputation', authenticateToken, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        if (isNaN(userId)) {
            return res.status(400).json({ error: 'Invalid user ID' });
        }

        const { change } = req.body;
        if (change === undefined || change === 0) {
            return res.status(400).json({ error: 'Valid change value is required' });
        }

        const result = await profileService.updateReputation(userId, change);
        res.json(result);
    } catch (error) {
        console.error('Error updating reputation:', error);
        res.status(500).json({ error: 'Failed to update reputation' });
    }
});

/**
 * POST /api/users/:id/check-milestones
 * 마일스톤 체크 및 배지/업적 자동 부여 (내부 API)
 */
router.post('/:id/check-milestones', authenticateToken, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        if (isNaN(userId)) {
            return res.status(400).json({ error: 'Invalid user ID' });
        }

        await profileService.checkMilestones(userId);
        res.json({ success: true, message: 'Milestones checked' });
    } catch (error) {
        console.error('Error checking milestones:', error);
        res.status(500).json({ error: 'Failed to check milestones' });
    }
});

// =============================================================================
// 리더보드
// =============================================================================

/**
 * GET /api/leaderboard
 * 리더보드 조회
 * Query params: type (reputation|level|posts|likes), limit (default: 50)
 */
router.get('/leaderboard', async (req, res) => {
    try {
        const type = req.query.type || 'reputation';
        const limit = parseInt(req.query.limit) || 50;

        if (!['reputation', 'level', 'posts', 'likes'].includes(type)) {
            return res.status(400).json({
                error: 'Invalid type. Must be: reputation, level, posts, or likes'
            });
        }

        if (limit < 1 || limit > 100) {
            return res.status(400).json({ error: 'Limit must be between 1 and 100' });
        }

        const leaderboard = await profileService.getLeaderboard(type, limit);
        res.json(leaderboard);
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
});

/**
 * POST /api/users/:id/last-seen
 * 마지막 활동 시간 업데이트 (내부 API, 인증 필요)
 */
router.post('/:id/last-seen', authenticateToken, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        if (isNaN(userId)) {
            return res.status(400).json({ error: 'Invalid user ID' });
        }

        // 본인만 업데이트 가능
        if (req.user.userId !== userId) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        await profileService.updateLastSeen(userId);
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating last seen:', error);
        res.status(500).json({ error: 'Failed to update last seen' });
    }
});

// =============================================================================
// 팔로우/팔로워 관리
// =============================================================================

/**
 * GET /api/users/:id/followers
 * 팔로워 목록 조회
 */
router.get('/:id/followers', async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        if (isNaN(userId)) {
            return res.status(400).json({ error: 'Invalid user ID' });
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;

        if (page < 1) {
            return res.status(400).json({ error: 'Page must be >= 1' });
        }
        if (limit < 1 || limit > 100) {
            return res.status(400).json({ error: 'Limit must be between 1 and 100' });
        }

        const result = await profileService.getFollowers(userId, page, limit);
        res.json(result);
    } catch (error) {
        console.error('Error fetching followers:', error);
        res.status(500).json({ error: 'Failed to fetch followers' });
    }
});

/**
 * GET /api/users/:id/following
 * 팔로잉 목록 조회
 */
router.get('/:id/following', async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        if (isNaN(userId)) {
            return res.status(400).json({ error: 'Invalid user ID' });
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;

        if (page < 1) {
            return res.status(400).json({ error: 'Page must be >= 1' });
        }
        if (limit < 1 || limit > 100) {
            return res.status(400).json({ error: 'Limit must be between 1 and 100' });
        }

        const result = await profileService.getFollowing(userId, page, limit);
        res.json(result);
    } catch (error) {
        console.error('Error fetching following:', error);
        res.status(500).json({ error: 'Failed to fetch following' });
    }
});

/**
 * GET /api/users/:id/follow-stats
 * 팔로우 통계 조회
 */
router.get('/:id/follow-stats', async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        if (isNaN(userId)) {
            return res.status(400).json({ error: 'Invalid user ID' });
        }

        const stats = await profileService.getFollowStats(userId);
        res.json(stats);
    } catch (error) {
        console.error('Error fetching follow stats:', error);
        res.status(500).json({ error: 'Failed to fetch follow stats' });
    }
});

export default router;
