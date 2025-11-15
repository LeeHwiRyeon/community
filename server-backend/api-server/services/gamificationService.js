const logger = require('../utils/logger');

class GamificationService {
    constructor() {
        this.userProfiles = new Map();
        this.achievements = new Map();
        this.leaderboards = new Map();
        this.rewards = new Map();
        this.quests = new Map();
        this.badges = new Map();
        this.points = new Map();
        this.levels = new Map();
        this.streaks = new Map();
        this.activities = new Map();

        this.initializeDefaultData();
    }

    // 기본 데이터 초기화
    initializeDefaultData() {
        // 레벨 시스템 초기화
        this.initializeLevels();

        // 업적 시스템 초기화
        this.initializeAchievements();

        // 배지 시스템 초기화
        this.initializeBadges();

        // 리워드 시스템 초기화
        this.initializeRewards();

        // 퀘스트 시스템 초기화
        this.initializeQuests();
    }

    // 레벨 시스템 초기화
    initializeLevels() {
        const levelData = [
            { level: 1, name: '새싹', minExp: 0, maxExp: 100, color: 'green', benefits: ['기본 기능 사용'] },
            { level: 2, name: '새싹+', minExp: 100, maxExp: 300, color: 'green', benefits: ['프로필 커스터마이징'] },
            { level: 3, name: '잎새', minExp: 300, maxExp: 600, color: 'blue', benefits: ['고급 필터 사용'] },
            { level: 4, name: '잎새+', minExp: 600, maxExp: 1000, color: 'blue', benefits: ['우선 검색 결과'] },
            { level: 5, name: '가지', minExp: 1000, maxExp: 1500, color: 'purple', benefits: ['독점 콘텐츠 접근'] },
            { level: 6, name: '가지+', minExp: 1500, maxExp: 2200, color: 'purple', benefits: ['베타 기능 사용'] },
            { level: 7, name: '나무', minExp: 2200, maxExp: 3000, color: 'orange', benefits: ['커뮤니티 관리 권한'] },
            { level: 8, name: '나무+', minExp: 3000, maxExp: 4000, color: 'orange', benefits: ['특별 이벤트 참여'] },
            { level: 9, name: '숲', minExp: 4000, maxExp: 5500, color: 'red', benefits: ['VIP 혜택'] },
            { level: 10, name: '숲+', minExp: 5500, maxExp: 999999, color: 'red', benefits: ['모든 프리미엄 기능'] }
        ];

        levelData.forEach(level => {
            this.levels.set(level.level, level);
        });
    }

    // 업적 시스템 초기화
    initializeAchievements() {
        const achievementData = [
            {
                id: 'first_post',
                name: '첫 발걸음',
                description: '첫 번째 게시물을 작성하세요',
                icon: '👶',
                points: 50,
                category: 'content',
                requirement: { type: 'post_count', value: 1 },
                rarity: 'common'
            },
            {
                id: 'social_butterfly',
                name: '사회적 나비',
                description: '10명의 사용자를 팔로우하세요',
                icon: '🦋',
                points: 100,
                category: 'social',
                requirement: { type: 'follow_count', value: 10 },
                rarity: 'common'
            },
            {
                id: 'content_creator',
                name: '콘텐츠 크리에이터',
                description: '50개의 게시물을 작성하세요',
                icon: '✍️',
                points: 500,
                category: 'content',
                requirement: { type: 'post_count', value: 50 },
                rarity: 'uncommon'
            },
            {
                id: 'popular_author',
                name: '인기 작가',
                description: '게시물에 총 1000개의 좋아요를 받으세요',
                icon: '⭐',
                points: 1000,
                category: 'content',
                requirement: { type: 'total_likes', value: 1000 },
                rarity: 'rare'
            },
            {
                id: 'community_leader',
                name: '커뮤니티 리더',
                description: '100명의 팔로워를 확보하세요',
                icon: '👑',
                points: 2000,
                category: 'social',
                requirement: { type: 'follower_count', value: 100 },
                rarity: 'epic'
            },
            {
                id: 'early_bird',
                name: '일찍 일어나는 새',
                description: '연속 7일간 매일 로그인하세요',
                icon: '🐦',
                points: 300,
                category: 'engagement',
                requirement: { type: 'login_streak', value: 7 },
                rarity: 'uncommon'
            },
            {
                id: 'night_owl',
                name: '올빼미',
                description: '자정 이후에 10번 로그인하세요',
                icon: '🦉',
                points: 200,
                category: 'engagement',
                requirement: { type: 'late_night_logins', value: 10 },
                rarity: 'uncommon'
            },
            {
                id: 'helpful_soul',
                name: '도움이 되는 사람',
                description: '100개의 댓글을 작성하세요',
                icon: '💬',
                points: 400,
                category: 'engagement',
                requirement: { type: 'comment_count', value: 100 },
                rarity: 'uncommon'
            },
            {
                id: 'trendsetter',
                name: '트렌드세터',
                description: '게시물이 10번 이상 인기 게시물에 올라가세요',
                icon: '🔥',
                points: 1500,
                category: 'content',
                requirement: { type: 'trending_posts', value: 10 },
                rarity: 'rare'
            },
            {
                id: 'veteran',
                name: '베테랑',
                description: '플랫폼에 1년 이상 활동하세요',
                icon: '🏆',
                points: 5000,
                category: 'loyalty',
                requirement: { type: 'days_active', value: 365 },
                rarity: 'legendary'
            }
        ];

        achievementData.forEach(achievement => {
            this.achievements.set(achievement.id, achievement);
        });
    }

    // 배지 시스템 초기화
    initializeBadges() {
        const badgeData = [
            {
                id: 'bronze_contributor',
                name: '브론즈 기여자',
                description: '기본 기여 활동',
                icon: '🥉',
                color: '#CD7F32',
                requirement: { type: 'total_points', value: 500 }
            },
            {
                id: 'silver_contributor',
                name: '실버 기여자',
                description: '중간 기여 활동',
                icon: '🥈',
                color: '#C0C0C0',
                requirement: { type: 'total_points', value: 1500 }
            },
            {
                id: 'gold_contributor',
                name: '골드 기여자',
                description: '높은 기여 활동',
                icon: '🥇',
                color: '#FFD700',
                requirement: { type: 'total_points', value: 3000 }
            },
            {
                id: 'platinum_contributor',
                name: '플래티넘 기여자',
                description: '최고 기여 활동',
                icon: '💎',
                color: '#E5E4E2',
                requirement: { type: 'total_points', value: 5000 }
            }
        ];

        badgeData.forEach(badge => {
            this.badges.set(badge.id, badge);
        });
    }

    // 리워드 시스템 초기화
    initializeRewards() {
        const rewardData = [
            {
                id: 'profile_customization',
                name: '프로필 커스터마이징',
                description: '프로필을 자유롭게 꾸밀 수 있습니다',
                cost: 100,
                type: 'unlock',
                category: 'customization'
            },
            {
                id: 'premium_filters',
                name: '프리미엄 필터',
                description: '고급 검색 필터를 사용할 수 있습니다',
                cost: 200,
                type: 'unlock',
                category: 'functionality'
            },
            {
                id: 'exclusive_emojis',
                name: '독점 이모지',
                description: '특별한 이모지를 사용할 수 있습니다',
                cost: 150,
                type: 'unlock',
                category: 'customization'
            },
            {
                id: 'priority_support',
                name: '우선 지원',
                description: '고객 지원에서 우선 처리됩니다',
                cost: 500,
                type: 'service',
                category: 'support'
            },
            {
                id: 'beta_access',
                name: '베타 기능 접근',
                description: '새로운 기능을 먼저 체험할 수 있습니다',
                cost: 1000,
                type: 'unlock',
                category: 'functionality'
            }
        ];

        rewardData.forEach(reward => {
            this.rewards.set(reward.id, reward);
        });
    }

    // 퀘스트 시스템 초기화
    initializeQuests() {
        const questData = [
            {
                id: 'daily_login',
                name: '일일 로그인',
                description: '오늘 로그인하여 10포인트를 획득하세요',
                type: 'daily',
                points: 10,
                requirement: { type: 'login', value: 1 },
                expiresIn: 24 * 60 * 60 * 1000 // 24시간
            },
            {
                id: 'weekly_posts',
                name: '주간 포스팅',
                description: '이번 주에 5개의 게시물을 작성하세요',
                type: 'weekly',
                points: 100,
                requirement: { type: 'post_count', value: 5 },
                expiresIn: 7 * 24 * 60 * 60 * 1000 // 7일
            },
            {
                id: 'social_engagement',
                name: '소셜 참여',
                description: '10개의 댓글을 작성하세요',
                type: 'daily',
                points: 50,
                requirement: { type: 'comment_count', value: 10 },
                expiresIn: 24 * 60 * 60 * 1000
            }
        ];

        questData.forEach(quest => {
            this.quests.set(quest.id, quest);
        });
    }

    // 사용자 프로필 생성/업데이트
    updateUserProfile(userId, userData) {
        const profile = {
            userId,
            level: userData.level || 1,
            experience: userData.experience || 0,
            points: userData.points || 0,
            badges: userData.badges || [],
            achievements: userData.achievements || [],
            rewards: userData.rewards || [],
            quests: userData.quests || [],
            streaks: userData.streaks || {},
            statistics: userData.statistics || {
                posts: 0,
                comments: 0,
                likes: 0,
                followers: 0,
                following: 0,
                loginDays: 0,
                totalPoints: 0
            },
            lastUpdated: new Date().toISOString()
        };

        this.userProfiles.set(userId, profile);
        logger.info(`User profile updated for user ${userId}`);
        return profile;
    }

    // 활동 기록 및 포인트 지급
    recordActivity(userId, activityType, metadata = {}) {
        const profile = this.userProfiles.get(userId) || this.updateUserProfile(userId, {});

        // 활동별 포인트 계산
        const points = this.calculateActivityPoints(activityType, metadata);

        // 포인트 추가
        profile.points += points;
        profile.statistics.totalPoints += points;

        // 경험치 추가
        const exp = Math.floor(points * 0.5);
        profile.experience += exp;

        // 레벨 업 체크
        const newLevel = this.calculateLevel(profile.experience);
        if (newLevel > profile.level) {
            profile.level = newLevel;
            this.triggerLevelUp(userId, newLevel);
        }

        // 업적 체크
        this.checkAchievements(userId, activityType, metadata);

        // 퀘스트 진행 체크
        this.updateQuests(userId, activityType, metadata);

        // 연속 기록 업데이트
        this.updateStreaks(userId, activityType);

        // 활동 기록 저장
        this.recordActivityLog(userId, activityType, points, metadata);

        this.userProfiles.set(userId, profile);

        return {
            points,
            experience: exp,
            newLevel: newLevel > profile.level ? newLevel : null,
            totalPoints: profile.points,
            totalExperience: profile.experience
        };
    }

    // 활동별 포인트 계산
    calculateActivityPoints(activityType, metadata) {
        const pointValues = {
            'post_create': 10,
            'post_like': 1,
            'comment_create': 5,
            'comment_like': 1,
            'follow_user': 3,
            'unfollow_user': -1,
            'login_daily': 5,
            'share_content': 2,
            'report_content': 1,
            'moderate_content': 5,
            'complete_profile': 20,
            'upload_avatar': 10,
            'join_community': 5,
            'leave_community': -2,
            'create_community': 50,
            'invite_friend': 15,
            'referral_signup': 100
        };

        let basePoints = pointValues[activityType] || 0;

        // 보너스 포인트 계산
        let bonusPoints = 0;

        // 연속 활동 보너스
        if (metadata.streak) {
            bonusPoints += Math.min(metadata.streak * 2, 50);
        }

        // 시간대 보너스
        const hour = new Date().getHours();
        if (hour >= 6 && hour <= 9) { // 아침 시간
            bonusPoints += Math.floor(basePoints * 0.5);
        }

        // 주말 보너스
        const day = new Date().getDay();
        if (day === 0 || day === 6) { // 주말
            bonusPoints += Math.floor(basePoints * 0.3);
        }

        return basePoints + bonusPoints;
    }

    // 레벨 계산
    calculateLevel(experience) {
        for (let level = 10; level >= 1; level--) {
            const levelData = this.levels.get(level);
            if (experience >= levelData.minExp) {
                return level;
            }
        }
        return 1;
    }

    // 레벨업 트리거
    triggerLevelUp(userId, newLevel) {
        const levelData = this.levels.get(newLevel);
        const profile = this.userProfiles.get(userId);

        // 레벨업 보너스 포인트
        const bonusPoints = newLevel * 100;
        profile.points += bonusPoints;
        profile.statistics.totalPoints += bonusPoints;

        // 레벨업 알림 (실제로는 알림 시스템에 전송)
        logger.info(`User ${userId} leveled up to level ${newLevel}!`);

        return {
            level: newLevel,
            levelName: levelData.name,
            bonusPoints,
            benefits: levelData.benefits
        };
    }

    // 업적 체크
    checkAchievements(userId, activityType, metadata) {
        const profile = this.userProfiles.get(userId);

        for (const [achievementId, achievement] of this.achievements) {
            if (profile.achievements.includes(achievementId)) {
                continue; // 이미 획득한 업적
            }

            if (this.isAchievementEarned(profile, achievement, activityType, metadata)) {
                this.grantAchievement(userId, achievementId);
            }
        }
    }

    // 업적 획득 조건 체크
    isAchievementEarned(profile, achievement, activityType, metadata) {
        const { requirement } = achievement;

        switch (requirement.type) {
            case 'post_count':
                return profile.statistics.posts >= requirement.value;
            case 'comment_count':
                return profile.statistics.comments >= requirement.value;
            case 'follow_count':
                return profile.statistics.following >= requirement.value;
            case 'follower_count':
                return profile.statistics.followers >= requirement.value;
            case 'total_likes':
                return profile.statistics.likes >= requirement.value;
            case 'login_streak':
                return profile.streaks.login >= requirement.value;
            case 'late_night_logins':
                return profile.statistics.lateNightLogins >= requirement.value;
            case 'trending_posts':
                return profile.statistics.trendingPosts >= requirement.value;
            case 'days_active':
                return profile.statistics.daysActive >= requirement.value;
            default:
                return false;
        }
    }

    // 업적 부여
    grantAchievement(userId, achievementId) {
        const profile = this.userProfiles.get(userId);
        const achievement = this.achievements.get(achievementId);

        profile.achievements.push(achievementId);
        profile.points += achievement.points;
        profile.statistics.totalPoints += achievement.points;

        // 업적 알림 (실제로는 알림 시스템에 전송)
        logger.info(`User ${userId} earned achievement: ${achievement.name}`);

        this.userProfiles.set(userId, profile);

        return {
            achievementId,
            name: achievement.name,
            description: achievement.description,
            points: achievement.points,
            icon: achievement.icon
        };
    }

    // 퀘스트 업데이트
    updateQuests(userId, activityType, metadata) {
        const profile = this.userProfiles.get(userId);

        for (const [questId, quest] of this.quests) {
            if (profile.quests.includes(questId)) {
                continue; // 이미 완료한 퀘스트
            }

            if (this.isQuestCompleted(profile, quest, activityType, metadata)) {
                this.completeQuest(userId, questId);
            }
        }
    }

    // 퀘스트 완료 체크
    isQuestCompleted(profile, quest, activityType, metadata) {
        const { requirement } = quest;

        switch (requirement.type) {
            case 'login':
                return activityType === 'login_daily';
            case 'post_count':
                return profile.statistics.posts >= requirement.value;
            case 'comment_count':
                return profile.statistics.comments >= requirement.value;
            default:
                return false;
        }
    }

    // 퀘스트 완료
    completeQuest(userId, questId) {
        const profile = this.userProfiles.get(userId);
        const quest = this.quests.get(questId);

        profile.quests.push(questId);
        profile.points += quest.points;
        profile.statistics.totalPoints += quest.points;

        // 퀘스트 완료 알림
        logger.info(`User ${userId} completed quest: ${quest.name}`);

        this.userProfiles.set(userId, profile);

        return {
            questId,
            name: quest.name,
            points: quest.points
        };
    }

    // 연속 기록 업데이트
    updateStreaks(userId, activityType) {
        const profile = this.userProfiles.get(userId);
        const today = new Date().toISOString().split('T')[0];

        if (!profile.streaks[activityType]) {
            profile.streaks[activityType] = { count: 0, lastDate: null };
        }

        const streak = profile.streaks[activityType];

        if (streak.lastDate === today) {
            return; // 이미 오늘 활동함
        }

        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        if (streak.lastDate === yesterday) {
            streak.count += 1;
        } else {
            streak.count = 1;
        }

        streak.lastDate = today;

        this.userProfiles.set(userId, profile);
    }

    // 활동 로그 기록
    recordActivityLog(userId, activityType, points, metadata) {
        if (!this.activities.has(userId)) {
            this.activities.set(userId, []);
        }

        const activity = {
            userId,
            activityType,
            points,
            metadata,
            timestamp: new Date().toISOString()
        };

        this.activities.get(userId).push(activity);

        // 최대 1000개 활동만 유지
        const activities = this.activities.get(userId);
        if (activities.length > 1000) {
            activities.splice(0, activities.length - 1000);
        }
    }

    // 리워드 구매
    purchaseReward(userId, rewardId) {
        const profile = this.userProfiles.get(userId);
        const reward = this.rewards.get(rewardId);

        if (!reward) {
            throw new Error('Reward not found');
        }

        if (profile.points < reward.cost) {
            throw new Error('Insufficient points');
        }

        if (profile.rewards.includes(rewardId)) {
            throw new Error('Reward already purchased');
        }

        profile.points -= reward.cost;
        profile.rewards.push(rewardId);

        this.userProfiles.set(userId, profile);

        return {
            rewardId,
            name: reward.name,
            cost: reward.cost,
            remainingPoints: profile.points
        };
    }

    // 리더보드 생성
    generateLeaderboard(type = 'points', limit = 10) {
        const users = Array.from(this.userProfiles.values());

        let sortedUsers;

        switch (type) {
            case 'points':
                sortedUsers = users.sort((a, b) => b.points - a.points);
                break;
            case 'level':
                sortedUsers = users.sort((a, b) => b.level - a.level);
                break;
            case 'experience':
                sortedUsers = users.sort((a, b) => b.experience - a.experience);
                break;
            case 'posts':
                sortedUsers = users.sort((a, b) => b.statistics.posts - a.statistics.posts);
                break;
            case 'followers':
                sortedUsers = users.sort((a, b) => b.statistics.followers - a.statistics.followers);
                break;
            default:
                sortedUsers = users.sort((a, b) => b.points - a.points);
        }

        return sortedUsers.slice(0, limit).map((user, index) => ({
            rank: index + 1,
            userId: user.userId,
            level: user.level,
            points: user.points,
            experience: user.experience,
            statistics: user.statistics
        }));
    }

    // 사용자 통계 조회
    getUserStats(userId) {
        const profile = this.userProfiles.get(userId);
        if (!profile) {
            return null;
        }

        const levelData = this.levels.get(profile.level);
        const nextLevelData = this.levels.get(profile.level + 1);

        return {
            userId: profile.userId,
            level: profile.level,
            levelName: levelData.name,
            experience: profile.experience,
            points: profile.points,
            badges: profile.badges,
            achievements: profile.achievements,
            rewards: profile.rewards,
            quests: profile.quests,
            streaks: profile.streaks,
            statistics: profile.statistics,
            progress: {
                currentLevel: {
                    name: levelData.name,
                    minExp: levelData.minExp,
                    maxExp: levelData.maxExp,
                    progress: ((profile.experience - levelData.minExp) / (levelData.maxExp - levelData.minExp)) * 100
                },
                nextLevel: nextLevelData ? {
                    name: nextLevelData.name,
                    minExp: nextLevelData.minExp,
                    requiredExp: nextLevelData.minExp - profile.experience
                } : null
            }
        };
    }

    // 배지 부여
    grantBadge(userId, badgeId) {
        const profile = this.userProfiles.get(userId);
        const badge = this.badges.get(badgeId);

        if (!badge) {
            throw new Error('Badge not found');
        }

        if (profile.badges.includes(badgeId)) {
            throw new Error('Badge already earned');
        }

        profile.badges.push(badgeId);
        this.userProfiles.set(userId, profile);

        return {
            badgeId,
            name: badge.name,
            description: badge.description,
            icon: badge.icon,
            color: badge.color
        };
    }

    // 배지 자동 부여 체크
    checkBadges(userId) {
        const profile = this.userProfiles.get(userId);

        for (const [badgeId, badge] of this.badges) {
            if (profile.badges.includes(badgeId)) {
                continue; // 이미 획득한 배지
            }

            if (profile.points >= badge.requirement.value) {
                this.grantBadge(userId, badgeId);
            }
        }
    }

    // 게임화 데이터 초기화
    resetUserGamification(userId) {
        this.userProfiles.set(userId, {
            userId,
            level: 1,
            experience: 0,
            points: 0,
            badges: [],
            achievements: [],
            rewards: [],
            quests: [],
            streaks: {},
            statistics: {
                posts: 0,
                comments: 0,
                likes: 0,
                followers: 0,
                following: 0,
                loginDays: 0,
                totalPoints: 0
            },
            lastUpdated: new Date().toISOString()
        });
    }

    // 전체 통계 조회
    getGlobalStats() {
        const users = Array.from(this.userProfiles.values());

        return {
            totalUsers: users.length,
            totalPoints: users.reduce((sum, user) => sum + user.points, 0),
            averageLevel: users.reduce((sum, user) => sum + user.level, 0) / users.length,
            totalAchievements: users.reduce((sum, user) => sum + user.achievements.length, 0),
            totalBadges: users.reduce((sum, user) => sum + user.badges.length, 0),
            activeUsers: users.filter(user => {
                const lastActivity = new Date(user.lastUpdated);
                const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                return lastActivity > oneWeekAgo;
            }).length
        };
    }
}

module.exports = new GamificationService();
