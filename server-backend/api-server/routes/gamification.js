const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const gamificationService = require('../services/gamificationService');

// 사용자 프로필 조회
router.get('/profile/:userId', (req, res) => {
    try {
        const { userId } = req.params;
        const stats = gamificationService.getUserStats(userId);

        if (!stats) {
            return res.status(404).json({
                success: false,
                message: 'User profile not found'
            });
        }

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        logger.error('Get user profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get user profile',
            error: error.message
        });
    }
});

// 활동 기록 및 포인트 지급
router.post('/activity', (req, res) => {
    try {
        const { userId, activityType, metadata = {} } = req.body;

        if (!userId || !activityType) {
            return res.status(400).json({
                success: false,
                message: 'User ID and activity type are required'
            });
        }

        const result = gamificationService.recordActivity(userId, activityType, metadata);

        res.json({
            success: true,
            message: 'Activity recorded successfully',
            data: result
        });
    } catch (error) {
        logger.error('Record activity error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to record activity',
            error: error.message
        });
    }
});

// 리워드 구매
router.post('/purchase-reward', (req, res) => {
    try {
        const { userId, rewardId } = req.body;

        if (!userId || !rewardId) {
            return res.status(400).json({
                success: false,
                message: 'User ID and reward ID are required'
            });
        }

        const result = gamificationService.purchaseReward(userId, rewardId);

        res.json({
            success: true,
            message: 'Reward purchased successfully',
            data: result
        });
    } catch (error) {
        logger.error('Purchase reward error:', error);
        res.status(400).json({
            success: false,
            message: error.message,
            error: error.message
        });
    }
});

// 리워드 목록 조회
router.get('/rewards', (req, res) => {
    try {
        const rewards = Array.from(gamificationService.rewards.values());

        res.json({
            success: true,
            data: rewards
        });
    } catch (error) {
        logger.error('Get rewards error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get rewards',
            error: error.message
        });
    }
});

// 업적 목록 조회
router.get('/achievements', (req, res) => {
    try {
        const achievements = Array.from(gamificationService.achievements.values());

        res.json({
            success: true,
            data: achievements
        });
    } catch (error) {
        logger.error('Get achievements error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get achievements',
            error: error.message
        });
    }
});

// 배지 목록 조회
router.get('/badges', (req, res) => {
    try {
        const badges = Array.from(gamificationService.badges.values());

        res.json({
            success: true,
            data: badges
        });
    } catch (error) {
        logger.error('Get badges error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get badges',
            error: error.message
        });
    }
});

// 퀘스트 목록 조회
router.get('/quests', (req, res) => {
    try {
        const quests = Array.from(gamificationService.quests.values());

        res.json({
            success: true,
            data: quests
        });
    } catch (error) {
        logger.error('Get quests error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get quests',
            error: error.message
        });
    }
});

// 레벨 목록 조회
router.get('/levels', (req, res) => {
    try {
        const levels = Array.from(gamificationService.levels.values());

        res.json({
            success: true,
            data: levels
        });
    } catch (error) {
        logger.error('Get levels error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get levels',
            error: error.message
        });
    }
});

// 리더보드 조회
router.get('/leaderboard', (req, res) => {
    try {
        const { type = 'points', limit = 10 } = req.query;

        const leaderboard = gamificationService.generateLeaderboard(type, parseInt(limit));

        res.json({
            success: true,
            data: {
                type,
                leaderboard
            }
        });
    } catch (error) {
        logger.error('Get leaderboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get leaderboard',
            error: error.message
        });
    }
});

// 사용자 활동 기록 조회
router.get('/activities/:userId', (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 50, offset = 0 } = req.query;

        const activities = gamificationService.activities.get(userId) || [];
        const paginatedActivities = activities
            .slice(parseInt(offset), parseInt(offset) + parseInt(limit))
            .reverse(); // 최신순으로 정렬

        res.json({
            success: true,
            data: {
                activities: paginatedActivities,
                total: activities.length,
                limit: parseInt(limit),
                offset: parseInt(offset)
            }
        });
    } catch (error) {
        logger.error('Get user activities error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get user activities',
            error: error.message
        });
    }
});

// 배지 부여
router.post('/grant-badge', (req, res) => {
    try {
        const { userId, badgeId } = req.body;

        if (!userId || !badgeId) {
            return res.status(400).json({
                success: false,
                message: 'User ID and badge ID are required'
            });
        }

        const result = gamificationService.grantBadge(userId, badgeId);

        res.json({
            success: true,
            message: 'Badge granted successfully',
            data: result
        });
    } catch (error) {
        logger.error('Grant badge error:', error);
        res.status(400).json({
            success: false,
            message: error.message,
            error: error.message
        });
    }
});

// 배지 자동 부여 체크
router.post('/check-badges/:userId', (req, res) => {
    try {
        const { userId } = req.params;

        gamificationService.checkBadges(userId);

        res.json({
            success: true,
            message: 'Badge check completed'
        });
    } catch (error) {
        logger.error('Check badges error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check badges',
            error: error.message
        });
    }
});

// 전체 통계 조회
router.get('/stats', (req, res) => {
    try {
        const stats = gamificationService.getGlobalStats();

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        logger.error('Get global stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get global stats',
            error: error.message
        });
    }
});

// 사용자 프로필 초기화
router.post('/reset/:userId', (req, res) => {
    try {
        const { userId } = req.params;

        gamificationService.resetUserGamification(userId);

        res.json({
            success: true,
            message: 'User gamification data reset successfully'
        });
    } catch (error) {
        logger.error('Reset user gamification error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reset user gamification',
            error: error.message
        });
    }
});

// 일일 퀘스트 조회
router.get('/daily-quests/:userId', (req, res) => {
    try {
        const { userId } = req.params;
        const profile = gamificationService.userProfiles.get(userId);

        if (!profile) {
            return res.status(404).json({
                success: false,
                message: 'User profile not found'
            });
        }

        const dailyQuests = Array.from(gamificationService.quests.values())
            .filter(quest => quest.type === 'daily')
            .map(quest => ({
                ...quest,
                completed: profile.quests.includes(quest.id),
                progress: gamificationService.calculateQuestProgress(profile, quest)
            }));

        res.json({
            success: true,
            data: dailyQuests
        });
    } catch (error) {
        logger.error('Get daily quests error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get daily quests',
            error: error.message
        });
    }
});

// 주간 퀘스트 조회
router.get('/weekly-quests/:userId', (req, res) => {
    try {
        const { userId } = req.params;
        const profile = gamificationService.userProfiles.get(userId);

        if (!profile) {
            return res.status(404).json({
                success: false,
                message: 'User profile not found'
            });
        }

        const weeklyQuests = Array.from(gamificationService.quests.values())
            .filter(quest => quest.type === 'weekly')
            .map(quest => ({
                ...quest,
                completed: profile.quests.includes(quest.id),
                progress: gamificationService.calculateQuestProgress(profile, quest)
            }));

        res.json({
            success: true,
            data: weeklyQuests
        });
    } catch (error) {
        logger.error('Get weekly quests error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get weekly quests',
            error: error.message
        });
    }
});

// 연속 기록 조회
router.get('/streaks/:userId', (req, res) => {
    try {
        const { userId } = req.params;
        const profile = gamificationService.userProfiles.get(userId);

        if (!profile) {
            return res.status(404).json({
                success: false,
                message: 'User profile not found'
            });
        }

        res.json({
            success: true,
            data: profile.streaks
        });
    } catch (error) {
        logger.error('Get streaks error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get streaks',
            error: error.message
        });
    }
});

// 포인트 이력 조회
router.get('/points-history/:userId', (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 20, offset = 0 } = req.query;

        const activities = gamificationService.activities.get(userId) || [];
        const pointActivities = activities
            .filter(activity => activity.points > 0)
            .slice(parseInt(offset), parseInt(offset) + parseInt(limit))
            .reverse();

        res.json({
            success: true,
            data: {
                activities: pointActivities,
                total: activities.filter(a => a.points > 0).length,
                limit: parseInt(limit),
                offset: parseInt(offset)
            }
        });
    } catch (error) {
        logger.error('Get points history error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get points history',
            error: error.message
        });
    }
});

// 레벨업 알림 조회
router.get('/level-up-notifications/:userId', (req, res) => {
    try {
        const { userId } = req.params;
        const profile = gamificationService.userProfiles.get(userId);

        if (!profile) {
            return res.status(404).json({
                success: false,
                message: 'User profile not found'
            });
        }

        // 실제로는 알림 시스템에서 가져옴
        const notifications = [];

        res.json({
            success: true,
            data: notifications
        });
    } catch (error) {
        logger.error('Get level up notifications error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get level up notifications',
            error: error.message
        });
    }
});

// 게임화 설정 조회
router.get('/settings', (req, res) => {
    try {
        const settings = {
            pointValues: {
                post_create: 10,
                post_like: 1,
                comment_create: 5,
                comment_like: 1,
                follow_user: 3,
                login_daily: 5,
                share_content: 2,
                complete_profile: 20,
                upload_avatar: 10,
                join_community: 5,
                create_community: 50,
                invite_friend: 15,
                referral_signup: 100
            },
            bonusMultipliers: {
                morning_bonus: 1.5,
                weekend_bonus: 1.3,
                streak_bonus: 2.0
            },
            levelBenefits: Array.from(gamificationService.levels.values()),
            achievementCategories: ['content', 'social', 'engagement', 'loyalty'],
            badgeRarities: ['common', 'uncommon', 'rare', 'epic', 'legendary']
        };

        res.json({
            success: true,
            data: settings
        });
    } catch (error) {
        logger.error('Get gamification settings error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get gamification settings',
            error: error.message
        });
    }
});

// 게임화 설정 업데이트
router.put('/settings', (req, res) => {
    try {
        const { pointValues, bonusMultipliers } = req.body;

        // 실제로는 설정을 데이터베이스에 저장
        logger.info('Gamification settings updated');

        res.json({
            success: true,
            message: 'Settings updated successfully'
        });
    } catch (error) {
        logger.error('Update gamification settings error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update settings',
            error: error.message
        });
    }
});

module.exports = router;
