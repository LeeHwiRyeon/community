/**
 * 사용자 프로필 v2 서비스
 * 프로필 관리, 통계, 배지, 업적 기능 제공
 */

import { getPool } from '../db.js';

const pool = getPool();

class ProfileService {
    /**
     * 전체 프로필 조회 (프로필 + 통계 + 배지 + 업적)
     */
    async getFullProfile(userId) {
        const connection = await pool.getConnection();
        try {
            // user_full_profile 뷰 사용
            const [profiles] = await connection.query(
                `SELECT * FROM user_full_profile WHERE id = ?`,
                [userId]
            );

            if (profiles.length === 0) {
                throw new Error('User not found');
            }

            const profile = profiles[0];

            // 배지 목록 조회
            const badges = await this.getUserBadges(userId, connection);

            // 최근 업적 조회 (최근 10개)
            const achievements = await this.getUserAchievements(userId, 10, connection);

            // 활동 로그 (최근 30일)
            const activityLog = await this.getActivityLog(userId, 30, connection);

            return {
                user: {
                    id: profile.id,
                    username: profile.username,
                    email: profile.email,
                    bio: profile.bio,
                    location: profile.location,
                    website: profile.website,
                    github_url: profile.github_url,
                    twitter_url: profile.twitter_url,
                    linkedin_url: profile.linkedin_url,
                    avatar_url: profile.avatar_url,
                    banner_image: profile.banner_image,
                    theme_preference: profile.theme_preference,
                    show_email: Boolean(profile.show_email),
                    show_location: Boolean(profile.show_location),
                    last_seen_at: profile.last_seen_at,
                    created_at: profile.created_at,
                },
                statistics: {
                    reputation_score: profile.reputation_score,
                    level: profile.level,
                    experience_points: profile.experience_points,
                    total_posts: profile.total_posts,
                    total_views: profile.total_views,
                    total_likes_received: profile.total_likes_received,
                    total_comments_received: profile.total_comments_received,
                    total_comments: profile.total_comments,
                    total_likes_given: profile.total_likes_given,
                    current_streak: profile.current_streak,
                    longest_streak: profile.longest_streak,
                    last_activity_date: profile.last_activity_date,
                    total_badges: profile.total_badges,
                    total_achievements: profile.total_achievements,
                },
                badges,
                achievements,
                activityLog,
            };
        } finally {
            connection.release();
        }
    }

    /**
     * 프로필 기본 정보 조회
     */
    async getProfile(userId) {
        const connection = await pool.getConnection();
        try {
            const [users] = await connection.query(
                `SELECT id, username, email, bio, location, website, 
                github_url, twitter_url, linkedin_url, 
                avatar_url, banner_image, theme_preference, 
                show_email, show_location, last_seen_at, created_at
         FROM users WHERE id = ?`,
                [userId]
            );

            if (users.length === 0) {
                throw new Error('User not found');
            }

            const user = users[0];
            return {
                ...user,
                show_email: Boolean(user.show_email),
                show_location: Boolean(user.show_location),
            };
        } finally {
            connection.release();
        }
    }

    /**
     * 프로필 업데이트
     */
    async updateProfile(userId, updates) {
        const connection = await pool.getConnection();
        try {
            const allowedFields = [
                'bio',
                'location',
                'website',
                'github_url',
                'twitter_url',
                'linkedin_url',
                'banner_image',
                'theme_preference',
                'show_email',
                'show_location',
            ];

            const updateData = {};
            for (const field of allowedFields) {
                if (updates[field] !== undefined) {
                    updateData[field] = updates[field];
                }
            }

            if (Object.keys(updateData).length === 0) {
                throw new Error('No valid fields to update');
            }

            // URL 검증
            const urlFields = ['website', 'github_url', 'twitter_url', 'linkedin_url'];
            for (const field of urlFields) {
                if (updateData[field]) {
                    try {
                        new URL(updateData[field]);
                    } catch {
                        throw new Error(`Invalid URL format for ${field}`);
                    }
                }
            }

            // theme_preference 검증
            if (updateData.theme_preference &&
                !['light', 'dark', 'auto'].includes(updateData.theme_preference)) {
                throw new Error('Invalid theme preference');
            }

            const setClause = Object.keys(updateData)
                .map(key => `${key} = ?`)
                .join(', ');
            const values = [...Object.values(updateData), userId];

            await connection.query(
                `UPDATE users SET ${setClause} WHERE id = ?`,
                values
            );

            return await this.getProfile(userId);
        } finally {
            connection.release();
        }
    }

    /**
     * 사용자 통계 조회
     */
    async getStatistics(userId) {
        const connection = await pool.getConnection();
        try {
            const [stats] = await connection.query(
                `SELECT * FROM user_statistics WHERE user_id = ?`,
                [userId]
            );

            if (stats.length === 0) {
                // 통계 레코드가 없으면 생성
                await connection.query(
                    `INSERT INTO user_statistics (user_id) VALUES (?)`,
                    [userId]
                );
                return await this.getStatistics(userId);
            }

            return stats[0];
        } finally {
            connection.release();
        }
    }

    /**
     * 사용자 배지 목록 조회
     */
    async getUserBadges(userId, connection = null) {
        const conn = connection || await pool.getConnection();
        try {
            const [badges] = await conn.query(
                `SELECT badge_type, badge_icon, badge_color, 
                earned_at, is_displayed, display_order
         FROM user_badges
         WHERE user_id = ?
         ORDER BY display_order ASC, earned_at DESC`,
                [userId]
            );

            return badges.map(badge => ({
                ...badge,
                is_displayed: Boolean(badge.is_displayed),
            }));
        } finally {
            if (!connection) conn.release();
        }
    }

    /**
     * 배지 수여
     */
    async awardBadge(userId, badgeType, badgeData = {}) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // 이미 배지가 있는지 확인
            const [existing] = await connection.query(
                `SELECT id FROM user_badges WHERE user_id = ? AND badge_type = ?`,
                [userId, badgeType]
            );

            if (existing.length > 0) {
                await connection.rollback();
                return { awarded: false, message: 'Badge already earned' };
            }

            // 배지 정보 (기본값 설정)
            const badgeIcons = {
                welcome: '👋',
                first_post: '✍️',
                verified: '✅',
                popular: '⭐',
                influencer: '🔥',
                commenter: '💬',
                helpful: '🤝',
                veteran: '🏆',
                consistent: '📅',
                early_bird: '🌅',
                moderator: '🛡️',
                contributor: '💎',
                supporter: '❤️',
            };

            const badgeColors = {
                welcome: '#4A90E2',
                first_post: '#7B68EE',
                verified: '#50C878',
                popular: '#FFD700',
                influencer: '#FF6347',
                commenter: '#87CEEB',
                helpful: '#98D8C8',
                veteran: '#DAA520',
                consistent: '#9370DB',
                early_bird: '#FFA07A',
                moderator: '#708090',
                contributor: '#4169E1',
                supporter: '#DC143C',
            };

            const badgeIcon = badgeData.icon || badgeIcons[badgeType] || '🏅';
            const badgeColor = badgeData.color || badgeColors[badgeType] || '#888888';

            // 배지 수여
            await connection.query(
                `INSERT INTO user_badges (user_id, badge_type, badge_icon, badge_color)
         VALUES (?, ?, ?, ?)`,
                [userId, badgeType, badgeIcon, badgeColor]
            );

            await connection.commit();
            return { awarded: true, badgeType, badgeIcon, badgeColor };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * 배지 표시 설정 변경
     */
    async updateBadgeDisplay(userId, badgeType, isDisplayed, displayOrder = null) {
        const connection = await pool.getConnection();
        try {
            const updates = { is_displayed: isDisplayed };
            if (displayOrder !== null) {
                updates.display_order = displayOrder;
            }

            const setClause = Object.keys(updates)
                .map(key => `${key} = ?`)
                .join(', ');
            const values = [...Object.values(updates), userId, badgeType];

            const [result] = await connection.query(
                `UPDATE user_badges SET ${setClause} 
         WHERE user_id = ? AND badge_type = ?`,
                values
            );

            if (result.affectedRows === 0) {
                throw new Error('Badge not found');
            }

            return await this.getUserBadges(userId);
        } finally {
            connection.release();
        }
    }

    /**
     * 사용자 업적 목록 조회
     */
    async getUserAchievements(userId, limit = 50, connection = null) {
        const conn = connection || await pool.getConnection();
        try {
            const [achievements] = await conn.query(
                `SELECT achievement_type, milestone_value, title, description, 
                icon, achieved_at, is_notified
         FROM user_achievements
         WHERE user_id = ?
         ORDER BY achieved_at DESC
         LIMIT ?`,
                [userId, limit]
            );

            return achievements.map(achievement => ({
                ...achievement,
                is_notified: Boolean(achievement.is_notified),
            }));
        } finally {
            if (!connection) conn.release();
        }
    }

    /**
     * 업적 기록
     */
    async recordAchievement(userId, achievementType, milestoneValue, metadata = {}) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // 중복 확인
            const [existing] = await connection.query(
                `SELECT id FROM user_achievements 
         WHERE user_id = ? AND achievement_type = ? AND milestone_value = ?`,
                [userId, achievementType, milestoneValue]
            );

            if (existing.length > 0) {
                await connection.rollback();
                return { recorded: false, message: 'Achievement already recorded' };
            }

            // 업적 정보 생성
            const achievementTitles = {
                post_milestone: `게시글 ${milestoneValue}개 작성`,
                like_milestone: `좋아요 ${milestoneValue}개 받음`,
                comment_milestone: `댓글 ${milestoneValue}개 작성`,
                view_milestone: `조회수 ${milestoneValue}회 달성`,
                streak_milestone: `${milestoneValue}일 연속 활동`,
                reputation_milestone: `평판 점수 ${milestoneValue}점 달성`,
                level_milestone: `레벨 ${milestoneValue} 달성`,
            };

            const achievementIcons = {
                post_milestone: '📝',
                like_milestone: '👍',
                comment_milestone: '💬',
                view_milestone: '👀',
                streak_milestone: '🔥',
                reputation_milestone: '⭐',
                level_milestone: '🎖️',
            };

            const title = metadata.title || achievementTitles[achievementType] || '업적 달성';
            const description = metadata.description || `${achievementType} 달성`;
            const icon = metadata.icon || achievementIcons[achievementType] || '🏅';

            // 업적 기록
            await connection.query(
                `INSERT INTO user_achievements 
         (user_id, achievement_type, milestone_value, title, description, icon)
         VALUES (?, ?, ?, ?, ?, ?)`,
                [userId, achievementType, milestoneValue, title, description, icon]
            );

            // 경험치 추가 (업적당 50 XP)
            await this.addExperience(userId, 50, connection);

            await connection.commit();
            return { recorded: true, title, description, icon };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * 활동 로그 조회
     */
    async getActivityLog(userId, days = 30, connection = null) {
        const conn = connection || await pool.getConnection();
        try {
            const [logs] = await conn.query(
                `SELECT activity_date, posts_count, comments_count, 
                likes_count, views_received, was_active
         FROM user_activity_log
         WHERE user_id = ? AND activity_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
         ORDER BY activity_date DESC`,
                [userId, days]
            );

            return logs.map(log => ({
                ...log,
                was_active: Boolean(log.was_active),
            }));
        } finally {
            if (!connection) conn.release();
        }
    }

    /**
     * 경험치 추가 및 레벨 업데이트
     */
    async addExperience(userId, xpAmount, connection = null) {
        const conn = connection || await pool.getConnection();
        const shouldRelease = !connection;

        try {
            if (shouldRelease) await conn.beginTransaction();

            // 현재 XP 조회
            const [stats] = await conn.query(
                `SELECT experience_points FROM user_statistics WHERE user_id = ?`,
                [userId]
            );

            if (stats.length === 0) {
                // 통계 레코드 생성
                await conn.query(
                    `INSERT INTO user_statistics (user_id, experience_points) VALUES (?, ?)`,
                    [userId, xpAmount]
                );
            } else {
                // XP 추가
                await conn.query(
                    `UPDATE user_statistics 
           SET experience_points = experience_points + ? 
           WHERE user_id = ?`,
                    [xpAmount, userId]
                );
            }

            // 레벨 재계산
            await conn.query(
                `UPDATE user_statistics 
         SET level = calculate_level(experience_points)
         WHERE user_id = ?`,
                [userId]
            );

            // 새 레벨 조회
            const [newStats] = await conn.query(
                `SELECT level, experience_points FROM user_statistics WHERE user_id = ?`,
                [userId]
            );

            if (shouldRelease) await conn.commit();

            return {
                level: newStats[0].level,
                experience_points: newStats[0].experience_points,
                xp_added: xpAmount,
            };
        } catch (error) {
            if (shouldRelease) await conn.rollback();
            throw error;
        } finally {
            if (shouldRelease) conn.release();
        }
    }

    /**
     * 평판 점수 업데이트
     */
    async updateReputation(userId, change, connection = null) {
        const conn = connection || await pool.getConnection();
        const shouldRelease = !connection;

        try {
            if (shouldRelease) await conn.beginTransaction();

            await conn.query(
                `UPDATE user_statistics 
         SET reputation_score = GREATEST(0, reputation_score + ?)
         WHERE user_id = ?`,
                [change, userId]
            );

            // 평판 마일스톤 체크 (100, 500, 1000, 5000, 10000)
            const [stats] = await conn.query(
                `SELECT reputation_score FROM user_statistics WHERE user_id = ?`,
                [userId]
            );

            const reputation = stats[0].reputation_score;
            const milestones = [100, 500, 1000, 5000, 10000];

            for (const milestone of milestones) {
                if (reputation >= milestone) {
                    await this.recordAchievement(
                        userId,
                        'reputation_milestone',
                        milestone,
                        { title: `평판 ${milestone}점 달성` }
                    );
                }
            }

            if (shouldRelease) await conn.commit();

            return { reputation, change };
        } catch (error) {
            if (shouldRelease) await conn.rollback();
            throw error;
        } finally {
            if (shouldRelease) conn.release();
        }
    }

    /**
     * 활동 마일스톤 자동 체크 및 배지/업적 부여
     */
    async checkMilestones(userId) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const [stats] = await connection.query(
                `SELECT * FROM user_statistics WHERE user_id = ?`,
                [userId]
            );

            if (stats.length === 0) return;

            const userStats = stats[0];

            // 배지 체크
            const badgeChecks = [
                { type: 'popular', condition: userStats.total_likes_received >= 100 },
                { type: 'influencer', condition: userStats.total_likes_received >= 1000 },
                { type: 'commenter', condition: userStats.total_comments >= 100 },
                { type: 'veteran', condition: await this.isVeteran(userId, connection) },
                { type: 'consistent', condition: userStats.current_streak >= 30 },
            ];

            for (const check of badgeChecks) {
                if (check.condition) {
                    await this.awardBadge(userId, check.type);
                }
            }

            // 업적 체크
            const achievementChecks = [
                { type: 'post_milestone', values: [10, 50, 100, 500, 1000], current: userStats.total_posts },
                { type: 'like_milestone', values: [50, 100, 500, 1000, 5000], current: userStats.total_likes_received },
                { type: 'comment_milestone', values: [50, 100, 500, 1000], current: userStats.total_comments },
                { type: 'view_milestone', values: [1000, 5000, 10000, 50000, 100000], current: userStats.total_views },
                { type: 'streak_milestone', values: [7, 30, 100, 365], current: userStats.current_streak },
                { type: 'level_milestone', values: [5, 10, 20, 50, 100], current: userStats.level },
            ];

            for (const check of achievementChecks) {
                for (const value of check.values) {
                    if (check.current >= value) {
                        await this.recordAchievement(userId, check.type, value);
                    }
                }
            }

            await connection.commit();
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * 베테랑 여부 확인 (가입 1년 이상)
     */
    async isVeteran(userId, connection = null) {
        const conn = connection || await pool.getConnection();
        try {
            const [users] = await conn.query(
                `SELECT DATEDIFF(NOW(), created_at) as days FROM users WHERE id = ?`,
                [userId]
            );
            return users.length > 0 && users[0].days >= 365;
        } finally {
            if (!connection) conn.release();
        }
    }

    /**
     * 마지막 활동 시간 업데이트
     */
    async updateLastSeen(userId) {
        const connection = await pool.getConnection();
        try {
            await connection.query(
                `UPDATE users SET last_seen_at = NOW() WHERE id = ?`,
                [userId]
            );
        } finally {
            connection.release();
        }
    }

    /**
     * 리더보드 조회
     */
    async getLeaderboard(type = 'reputation', limit = 50) {
        const connection = await pool.getConnection();
        try {
            const orderByMap = {
                reputation: 'us.reputation_score DESC',
                level: 'us.level DESC, us.experience_points DESC',
                posts: 'us.total_posts DESC',
                likes: 'us.total_likes_received DESC',
            };

            const orderBy = orderByMap[type] || orderByMap.reputation;

            const [users] = await connection.query(
                `SELECT u.id, u.username, u.avatar_url,
                us.reputation_score, us.level, us.experience_points,
                us.total_posts, us.total_likes_received,
                us.total_badges, us.total_achievements
         FROM users u
         INNER JOIN user_statistics us ON u.id = us.user_id
         ORDER BY ${orderBy}
         LIMIT ?`,
                [limit]
            );

            return users;
        } finally {
            connection.release();
        }
    }

    /**
     * 팔로워 목록 조회
     */
    async getFollowers(userId, page = 1, limit = 20) {
        const connection = await pool.getConnection();
        try {
            const offset = (page - 1) * limit;

            // 팔로워 목록 조회
            const [followers] = await connection.query(
                `SELECT 
                    u.id,
                    u.username,
                    u.display_name,
                    u.avatar_url,
                    u.bio,
                    f.created_at as followed_at,
                    us.reputation_score,
                    us.level,
                    us.total_posts
                FROM follows f
                INNER JOIN users u ON f.follower_id = u.id
                LEFT JOIN user_statistics us ON u.id = us.user_id
                WHERE f.following_id = ?
                ORDER BY f.created_at DESC
                LIMIT ? OFFSET ?`,
                [userId, limit, offset]
            );

            // 전체 팔로워 수 조회
            const [countResult] = await connection.query(
                `SELECT COUNT(*) as total FROM follows WHERE following_id = ?`,
                [userId]
            );

            const total = countResult[0].total;
            const totalPages = Math.ceil(total / limit);

            return {
                followers,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages
                }
            };
        } finally {
            connection.release();
        }
    }

    /**
     * 팔로잉 목록 조회
     */
    async getFollowing(userId, page = 1, limit = 20) {
        const connection = await pool.getConnection();
        try {
            const offset = (page - 1) * limit;

            // 팔로잉 목록 조회
            const [following] = await connection.query(
                `SELECT 
                    u.id,
                    u.username,
                    u.display_name,
                    u.avatar_url,
                    u.bio,
                    f.created_at as followed_at,
                    us.reputation_score,
                    us.level,
                    us.total_posts
                FROM follows f
                INNER JOIN users u ON f.following_id = u.id
                LEFT JOIN user_statistics us ON u.id = us.user_id
                WHERE f.follower_id = ?
                ORDER BY f.created_at DESC
                LIMIT ? OFFSET ?`,
                [userId, limit, offset]
            );

            // 전체 팔로잉 수 조회
            const [countResult] = await connection.query(
                `SELECT COUNT(*) as total FROM follows WHERE follower_id = ?`,
                [userId]
            );

            const total = countResult[0].total;
            const totalPages = Math.ceil(total / limit);

            return {
                following,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages
                }
            };
        } finally {
            connection.release();
        }
    }

    /**
     * 팔로우 통계 조회
     */
    async getFollowStats(userId) {
        const connection = await pool.getConnection();
        try {
            // 팔로워 수
            const [followersResult] = await connection.query(
                `SELECT COUNT(*) as count FROM follows WHERE following_id = ?`,
                [userId]
            );

            // 팔로잉 수
            const [followingResult] = await connection.query(
                `SELECT COUNT(*) as count FROM follows WHERE follower_id = ?`,
                [userId]
            );

            return {
                followers_count: followersResult[0].count,
                following_count: followingResult[0].count
            };
        } finally {
            connection.release();
        }
    }
}

const profileService = new ProfileService();
export default profileService;
