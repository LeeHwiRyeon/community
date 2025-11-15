/**
 * Profile Service
 * 
 * 사용자 프로필 관리 서비스
 * - 프로필 조회 및 수정
 * - 활동 통계
 * - 배지 관리
 * - 프로필 조회 기록
 */

class ProfileService {
    constructor(db) {
        this.db = db;
    }

    // ==================== 프로필 조회 ====================

    /**
     * 사용자 프로필 조회 (완전한 정보)
     */
    async getUserProfile(userId, viewerId = null) {
        try {
            // 프로필 조회 기록
            if (viewerId && viewerId !== userId) {
                await this.recordProfileView(userId, viewerId);
            }

            const [profiles] = await this.db.query(
                `SELECT * FROM v_user_profiles WHERE id = ?`,
                [userId]
            );

            if (profiles.length === 0) {
                return null;
            }

            const profile = profiles[0];

            // JSON 파싱
            if (profile.interests && typeof profile.interests === 'string') {
                profile.interests = JSON.parse(profile.interests);
            }

            // 배지 조회
            const badges = await this.getUserBadges(userId);
            profile.badges = badges;

            return profile;
        } catch (error) {
            console.error('Get user profile error:', error);
            throw error;
        }
    }

    /**
     * 사용자 기본 정보만 조회
     */
    async getUserBasicInfo(userId) {
        try {
            const [users] = await this.db.query(
                `SELECT 
          id, username, display_name, 
          avatar_url, profile_image_url, 
          badge_level, is_active, created_at
        FROM users 
        WHERE id = ?`,
                [userId]
            );

            return users[0] || null;
        } catch (error) {
            console.error('Get user basic info error:', error);
            throw error;
        }
    }

    /**
     * 프로필 조회 기록
     */
    async recordProfileView(profileUserId, viewerUserId = null, viewerIp = null) {
        try {
            await this.db.query(
                `INSERT INTO user_profile_views (profile_user_id, viewer_user_id, viewer_ip)
        VALUES (?, ?, ?)`,
                [profileUserId, viewerUserId, viewerIp]
            );
        } catch (error) {
            // 조회 기록 실패는 무시
            console.error('Record profile view error:', error);
        }
    }

    // ==================== 프로필 수정 ====================

    /**
     * 프로필 업데이트
     */
    async updateProfile(userId, updates) {
        try {
            const allowedFields = [
                'display_name',
                'bio',
                'location',
                'website',
                'twitter_handle',
                'github_username',
                'linkedin_url',
                'interests',
                'is_profile_public'
            ];

            const updateData = {};
            for (const field of allowedFields) {
                if (updates[field] !== undefined) {
                    // JSON 필드는 stringify
                    if (field === 'interests' && Array.isArray(updates[field])) {
                        updateData[field] = JSON.stringify(updates[field]);
                    } else {
                        updateData[field] = updates[field];
                    }
                }
            }

            if (Object.keys(updateData).length === 0) {
                throw new Error('업데이트할 필드가 없습니다');
            }

            const setClause = Object.keys(updateData)
                .map(key => `${key} = ?`)
                .join(', ');

            const values = Object.values(updateData);
            values.push(userId);

            await this.db.query(
                `UPDATE users SET ${setClause}, updated_at = NOW() WHERE id = ?`,
                values
            );

            return await this.getUserProfile(userId);
        } catch (error) {
            console.error('Update profile error:', error);
            throw error;
        }
    }

    /**
     * 프로필 이미지 업데이트
     */
    async updateProfileImage(userId, imageUrl) {
        try {
            await this.db.query(
                `UPDATE users SET profile_image_url = ?, updated_at = NOW() WHERE id = ?`,
                [imageUrl, userId]
            );

            return { success: true, imageUrl };
        } catch (error) {
            console.error('Update profile image error:', error);
            throw error;
        }
    }

    /**
     * 커버 이미지 업데이트
     */
    async updateCoverImage(userId, imageUrl) {
        try {
            await this.db.query(
                `UPDATE users SET cover_image_url = ?, updated_at = NOW() WHERE id = ?`,
                [imageUrl, userId]
            );

            return { success: true, imageUrl };
        } catch (error) {
            console.error('Update cover image error:', error);
            throw error;
        }
    }

    // ==================== 활동 통계 ====================

    /**
     * 사용자 활동 통계 조회
     */
    async getUserStats(userId) {
        try {
            const [stats] = await this.db.query(
                `SELECT * FROM user_activity_stats WHERE user_id = ?`,
                [userId]
            );

            if (stats.length === 0) {
                return {
                    post_count: 0,
                    comment_count: 0,
                    received_likes: 0,
                    follower_count: 0,
                    following_count: 0,
                    bookmark_count: 0,
                    reputation_score: 0
                };
            }

            return stats[0];
        } catch (error) {
            console.error('Get user stats error:', error);
            throw error;
        }
    }

    /**
     * 평판 점수 재계산
     */
    async recalculateReputation(userId) {
        try {
            await this.db.query('CALL sp_recalculate_reputation(?)', [userId]);

            const stats = await this.getUserStats(userId);
            return stats.reputation_score;
        } catch (error) {
            console.error('Recalculate reputation error:', error);
            throw error;
        }
    }

    /**
     * 사용자 최근 활동 조회
     */
    async getUserRecentActivity(userId, limit = 10) {
        try {
            // 최근 게시글
            const [posts] = await this.db.query(
                `SELECT 
          'post' AS type,
          id,
          title,
          board_id,
          created_at,
          view_count,
          like_count,
          comment_count
        FROM posts
        WHERE user_id = ? AND is_published = TRUE
        ORDER BY created_at DESC
        LIMIT ?`,
                [userId, limit]
            );

            // 최근 댓글
            const [comments] = await this.db.query(
                `SELECT 
          'comment' AS type,
          c.id,
          c.content,
          c.post_id,
          p.title AS post_title,
          c.created_at
        FROM comments c
        JOIN posts p ON c.post_id = p.id
        WHERE c.user_id = ?
        ORDER BY c.created_at DESC
        LIMIT ?`,
                [userId, limit]
            );

            // 활동 합치기 및 정렬
            const activities = [...posts, ...comments]
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .slice(0, limit);

            return activities;
        } catch (error) {
            console.error('Get user recent activity error:', error);
            throw error;
        }
    }

    // ==================== 배지 관리 ====================

    /**
     * 사용자 배지 조회
     */
    async getUserBadges(userId) {
        try {
            const [badges] = await this.db.query(
                `SELECT 
          badge_type,
          badge_name,
          description,
          icon_url,
          earned_at,
          is_visible
        FROM user_badges
        WHERE user_id = ?
        ORDER BY earned_at DESC`,
                [userId]
            );

            return badges;
        } catch (error) {
            console.error('Get user badges error:', error);
            throw error;
        }
    }

    /**
     * 배지 부여
     */
    async awardBadge(userId, badgeType, badgeName, description = null) {
        try {
            await this.db.query(
                `INSERT INTO user_badges (user_id, badge_type, badge_name, description)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE earned_at = NOW()`,
                [userId, badgeType, badgeName, description]
            );

            return { success: true, badgeType };
        } catch (error) {
            console.error('Award badge error:', error);
            throw error;
        }
    }

    /**
     * 배지 표시 토글
     */
    async toggleBadgeVisibility(userId, badgeType) {
        try {
            await this.db.query(
                `UPDATE user_badges 
        SET is_visible = NOT is_visible
        WHERE user_id = ? AND badge_type = ?`,
                [userId, badgeType]
            );

            return { success: true };
        } catch (error) {
            console.error('Toggle badge visibility error:', error);
            throw error;
        }
    }

    // ==================== 검색 및 목록 ====================

    /**
     * 사용자 검색
     */
    async searchUsers(query, options = {}) {
        try {
            const {
                page = 1,
                limit = 20,
                sortBy = 'reputation' // reputation, posts, followers, recent
            } = options;

            const offset = (page - 1) * limit;

            let orderBy = 'reputation_score DESC';
            switch (sortBy) {
                case 'posts':
                    orderBy = 'post_count DESC';
                    break;
                case 'followers':
                    orderBy = 'follower_count DESC';
                    break;
                case 'recent':
                    orderBy = 'joined_at DESC';
                    break;
            }

            const [users] = await this.db.query(
                `SELECT 
          id, username, display_name,
          avatar_url, profile_image_url,
          bio, badge_level,
          post_count, follower_count, reputation_score
        FROM v_user_profiles
        WHERE is_active = TRUE
        AND (username LIKE ? OR display_name LIKE ? OR bio LIKE ?)
        ORDER BY ${orderBy}
        LIMIT ? OFFSET ?`,
                [`%${query}%`, `%${query}%`, `%${query}%`, limit, offset]
            );

            // 전체 개수
            const [[{ total }]] = await this.db.query(
                `SELECT COUNT(*) AS total
        FROM users
        WHERE is_active = TRUE
        AND (username LIKE ? OR display_name LIKE ? OR bio LIKE ?)`,
                [`%${query}%`, `%${query}%`, `%${query}%`]
            );

            return {
                users,
                pagination: {
                    total,
                    page,
                    limit,
                    pages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            console.error('Search users error:', error);
            throw error;
        }
    }

    /**
     * 상위 기여자 목록
     */
    async getTopContributors(limit = 10) {
        try {
            const [contributors] = await this.db.query(
                `SELECT * FROM v_top_contributors LIMIT ?`,
                [limit]
            );

            return contributors;
        } catch (error) {
            console.error('Get top contributors error:', error);
            throw error;
        }
    }

    /**
     * 신규 회원 목록
     */
    async getNewMembers(limit = 10) {
        try {
            const [members] = await this.db.query(
                `SELECT 
          id, username, display_name,
          avatar_url, profile_image_url,
          badge_level, joined_at
        FROM v_user_profiles
        WHERE is_active = TRUE
        ORDER BY joined_at DESC
        LIMIT ?`,
                [limit]
            );

            return members;
        } catch (error) {
            console.error('Get new members error:', error);
            throw error;
        }
    }

    // ==================== 프로필 통계 ====================

    /**
     * 프로필 조회수 통계
     */
    async getProfileViewStats(userId, days = 30) {
        try {
            const [stats] = await this.db.query(
                `SELECT 
          DATE(viewed_at) AS date,
          COUNT(*) AS views,
          COUNT(DISTINCT viewer_ip) AS unique_views
        FROM user_profile_views
        WHERE profile_user_id = ?
        AND viewed_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        GROUP BY DATE(viewed_at)
        ORDER BY date DESC`,
                [userId, days]
            );

            return stats;
        } catch (error) {
            console.error('Get profile view stats error:', error);
            throw error;
        }
    }

    /**
     * 사용자 성장 추이
     */
    async getUserGrowthTrend(userId, days = 30) {
        try {
            // 게시글 추이
            const [postTrend] = await this.db.query(
                `SELECT 
          DATE(created_at) AS date,
          COUNT(*) AS count
        FROM posts
        WHERE user_id = ?
        AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        GROUP BY DATE(created_at)
        ORDER BY date`,
                [userId, days]
            );

            // 댓글 추이
            const [commentTrend] = await this.db.query(
                `SELECT 
          DATE(created_at) AS date,
          COUNT(*) AS count
        FROM comments
        WHERE user_id = ?
        AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        GROUP BY DATE(created_at)
        ORDER BY date`,
                [userId, days]
            );

            return {
                posts: postTrend,
                comments: commentTrend
            };
        } catch (error) {
            console.error('Get user growth trend error:', error);
            throw error;
        }
    }

    // ==================== 헬스 체크 ====================

    async healthCheck() {
        try {
            await this.db.query('SELECT 1');
            return { status: 'healthy' };
        } catch (error) {
            return { status: 'unhealthy', error: error.message };
        }
    }
}

module.exports = ProfileService;
