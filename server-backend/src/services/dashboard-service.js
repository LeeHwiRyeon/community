/**
 * Dashboard Service
 * 활동 분석 대시보드 데이터 집계 및 조회 서비스
 */

import { getPool } from '../db.js';

class DashboardService {
    /**
     * 대시보드 개요 데이터 조회
     * @returns {Object} 전체 통계 개요
     */
    async getOverview() {
        const pool = getPool();
        const connection = await pool.getConnection();

        try {
            // 오늘과 어제 통계 가져오기
            const [todayStats] = await connection.query(`
        SELECT 
          total_users,
          active_users,
          new_users,
          total_posts,
          new_posts,
          total_comments,
          new_comments,
          total_likes,
          new_likes,
          total_views,
          new_views
        FROM daily_stats
        WHERE stat_date = CURDATE()
      `);

            const [yesterdayStats] = await connection.query(`
        SELECT 
          total_users,
          active_users,
          new_users,
          total_posts,
          new_posts,
          total_comments,
          new_comments,
          total_likes,
          new_likes,
          total_views,
          new_views
        FROM daily_stats
        WHERE stat_date = DATE_SUB(CURDATE(), INTERVAL 1 DAY)
      `);

            // 실시간 통계 (오늘)
            const [realtime] = await connection.query(`
        SELECT 
          COUNT(DISTINCT CASE WHEN activity_type IN ('post_created', 'comment_created', 'like_added') 
            THEN user_id END) AS active_users_today,
          COUNT(CASE WHEN activity_type = 'post_created' THEN 1 END) AS posts_today,
          COUNT(CASE WHEN activity_type = 'comment_created' THEN 1 END) AS comments_today,
          COUNT(CASE WHEN activity_type = 'like_added' THEN 1 END) AS likes_today
        FROM user_activity_logs
        WHERE DATE(created_at) = CURDATE()
      `);

            const today = todayStats[0] || {};
            const yesterday = yesterdayStats[0] || {};
            const rt = realtime[0] || {};

            // 변화율 계산
            const calculateChange = (current, previous) => {
                if (!previous || previous === 0) return 0;
                return ((current - previous) / previous * 100).toFixed(1);
            };

            return {
                totalUsers: today.total_users || 0,
                totalUsersChange: calculateChange(today.total_users, yesterday.total_users),

                activeUsersToday: rt.active_users_today || 0,
                activeUsersChange: calculateChange(rt.active_users_today, yesterday.active_users),

                totalPosts: today.total_posts || 0,
                postsToday: rt.posts_today || 0,
                postsChange: calculateChange(rt.posts_today, yesterday.new_posts),

                totalComments: today.total_comments || 0,
                commentsToday: rt.comments_today || 0,
                commentsChange: calculateChange(rt.comments_today, yesterday.new_comments),

                totalLikes: today.total_likes || 0,
                likesToday: rt.likes_today || 0,
                likesChange: calculateChange(rt.likes_today, yesterday.new_likes),

                totalViews: today.total_views || 0,
                viewsToday: today.new_views || 0,
                viewsChange: calculateChange(today.new_views, yesterday.new_views)
            };

        } finally {
            connection.release();
        }
    }

    /**
     * 시계열 데이터 조회
     * @param {number} days - 조회 기간 (일)
     * @param {string} metric - 조회할 메트릭 (users, posts, comments, likes, views)
     * @returns {Array} 시계열 데이터 배열
     */
    async getTimeSeriesData(days = 30, metric = 'all') {
        const pool = getPool();
        const connection = await pool.getConnection();

        try {
            let selectFields = '';

            switch (metric) {
                case 'users':
                    selectFields = 'stat_date, active_users AS value, new_users AS new_value';
                    break;
                case 'posts':
                    selectFields = 'stat_date, total_posts AS value, new_posts AS new_value';
                    break;
                case 'comments':
                    selectFields = 'stat_date, total_comments AS value, new_comments AS new_value';
                    break;
                case 'likes':
                    selectFields = 'stat_date, total_likes AS value, new_likes AS new_value';
                    break;
                case 'views':
                    selectFields = 'stat_date, total_views AS value, new_views AS new_value';
                    break;
                default:
                    selectFields = `
            stat_date,
            active_users,
            new_posts,
            new_comments,
            new_likes,
            new_views
          `;
            }

            const [rows] = await connection.query(`
        SELECT ${selectFields}
        FROM daily_stats
        WHERE stat_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        ORDER BY stat_date ASC
      `, [days]);

            return rows;

        } finally {
            connection.release();
        }
    }

    /**
     * 리더보드 조회
     * @param {string} type - 리더보드 타입 (posts, comments, likes, reputation)
     * @param {number} limit - 조회할 사용자 수
     * @param {number} days - 기간 (일, 0이면 전체)
     * @returns {Array} 리더보드 데이터
     */
    async getLeaderboard(type = 'posts', limit = 10, days = 0) {
        const pool = getPool();
        const connection = await pool.getConnection();

        try {
            let query = '';
            let params = [limit];

            const dateCondition = days > 0
                ? `AND DATE(p.created_at) >= DATE_SUB(CURDATE(), INTERVAL ? DAY)`
                : '';

            if (days > 0) params.unshift(days);

            switch (type) {
                case 'posts':
                    query = `
            SELECT 
              u.user_id,
              u.username,
              u.email,
              u.avatar_url,
              COUNT(p.post_id) AS count,
              SUM(p.views_count) AS total_views,
              SUM(p.likes_count) AS total_likes
            FROM users u
            LEFT JOIN posts p ON u.user_id = p.user_id ${dateCondition}
            GROUP BY u.user_id
            HAVING count > 0
            ORDER BY count DESC, total_likes DESC
            LIMIT ?
          `;
                    break;

                case 'comments':
                    query = `
            SELECT 
              u.user_id,
              u.username,
              u.email,
              u.avatar_url,
              COUNT(c.comment_id) AS count,
              COUNT(DISTINCT c.post_id) AS posts_commented
            FROM users u
            LEFT JOIN comments c ON u.user_id = c.user_id ${dateCondition}
            GROUP BY u.user_id
            HAVING count > 0
            ORDER BY count DESC
            LIMIT ?
          `;
                    break;

                case 'likes':
                    query = `
            SELECT 
              u.user_id,
              u.username,
              u.email,
              u.avatar_url,
              COUNT(l.like_id) AS count,
              COUNT(DISTINCT l.post_id) AS posts_liked
            FROM users u
            LEFT JOIN likes l ON u.user_id = l.user_id ${dateCondition}
            GROUP BY u.user_id
            HAVING count > 0
            ORDER BY count DESC
            LIMIT ?
          `;
                    break;

                case 'reputation':
                    query = `
            SELECT 
              u.user_id,
              u.username,
              u.email,
              u.avatar_url,
              COALESCE(up.points, 0) AS points,
              COALESCE(up.level, 1) AS level,
              (
                SELECT COUNT(*) FROM posts WHERE user_id = u.user_id ${dateCondition}
              ) AS post_count,
              (
                SELECT COUNT(*) FROM comments WHERE user_id = u.user_id ${dateCondition}
              ) AS comment_count,
              (
                SELECT SUM(likes_count) FROM posts WHERE user_id = u.user_id
              ) AS total_likes_received
            FROM users u
            LEFT JOIN user_profiles up ON u.user_id = up.user_id
            ORDER BY points DESC, level DESC
            LIMIT ?
          `;
                    break;

                default:
                    throw new Error(`Invalid leaderboard type: ${type}`);
            }

            const [rows] = await connection.query(query, params);

            return rows.map((row, index) => ({
                rank: index + 1,
                ...row
            }));

        } finally {
            connection.release();
        }
    }

    /**
     * 카테고리별 통계 조회
     * @param {number} days - 조회 기간 (일)
     * @returns {Array} 카테고리별 통계
     */
    async getCategoryStats(days = 30) {
        const pool = getPool();
        const connection = await pool.getConnection();

        try {
            const [rows] = await connection.query(`
        SELECT 
          c.category_id,
          c.name AS category_name,
          c.description,
          SUM(cs.post_count) AS total_posts,
          SUM(cs.comment_count) AS total_comments,
          SUM(cs.like_count) AS total_likes,
          SUM(cs.view_count) AS total_views,
          AVG(cs.active_users) AS avg_active_users
        FROM categories c
        LEFT JOIN category_stats cs ON c.category_id = cs.category_id
          AND cs.stat_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        GROUP BY c.category_id
        ORDER BY total_posts DESC
      `, [days]);

            // 전체 합계 계산
            const totalPosts = rows.reduce((sum, row) => sum + (row.total_posts || 0), 0);

            return rows.map(row => ({
                ...row,
                total_posts: row.total_posts || 0,
                total_comments: row.total_comments || 0,
                total_likes: row.total_likes || 0,
                total_views: row.total_views || 0,
                avg_active_users: Math.round(row.avg_active_users || 0),
                percentage: totalPosts > 0
                    ? ((row.total_posts || 0) / totalPosts * 100).toFixed(1)
                    : 0
            }));

        } finally {
            connection.release();
        }
    }

    /**
     * 실시간 활동 피드 조회
     * @param {number} limit - 조회할 활동 수
     * @param {number} hours - 조회 기간 (시간)
     * @returns {Array} 활동 피드
     */
    async getActivityFeed(limit = 50, hours = 24) {
        const pool = getPool();
        const connection = await pool.getConnection();

        try {
            const [rows] = await connection.query(`
        SELECT 
          ual.id,
          ual.user_id,
          u.username,
          u.avatar_url,
          ual.activity_type,
          ual.target_type,
          ual.target_id,
          CASE 
            WHEN ual.target_type = 'post' THEN p.title
            WHEN ual.target_type = 'comment' THEN 
              CONCAT(SUBSTRING(c.content, 1, 100), '...')
            ELSE NULL
          END AS target_title,
          ual.created_at
        FROM user_activity_logs ual
        JOIN users u ON ual.user_id = u.user_id
        LEFT JOIN posts p ON ual.target_type = 'post' AND ual.target_id = p.post_id
        LEFT JOIN comments c ON ual.target_type = 'comment' AND ual.target_id = c.comment_id
        WHERE ual.created_at >= DATE_SUB(NOW(), INTERVAL ? HOUR)
        ORDER BY ual.created_at DESC
        LIMIT ?
      `, [hours, limit]);

            return rows.map(row => ({
                ...row,
                activity_description: this.getActivityDescription(row)
            }));

        } finally {
            connection.release();
        }
    }

    /**
     * 활동 설명 생성
     * @param {Object} activity - 활동 데이터
     * @returns {string} 활동 설명
     */
    getActivityDescription(activity) {
        const { username, activity_type, target_type, target_title } = activity;

        switch (activity_type) {
            case 'post_created':
                return `${username}님이 새 게시물을 작성했습니다: ${target_title}`;
            case 'comment_created':
                return `${username}님이 댓글을 작성했습니다: ${target_title}`;
            case 'like_added':
                return `${username}님이 게시물을 좋아합니다: ${target_title}`;
            case 'post_viewed':
                return `${username}님이 게시물을 조회했습니다: ${target_title}`;
            case 'login':
                return `${username}님이 로그인했습니다`;
            case 'logout':
                return `${username}님이 로그아웃했습니다`;
            default:
                return `${username}님의 활동`;
        }
    }

    /**
     * 활동 로그 기록
     * @param {number} userId - 사용자 ID
     * @param {string} activityType - 활동 타입
     * @param {string} targetType - 대상 타입
     * @param {number} targetId - 대상 ID
     * @param {Object} metadata - 추가 메타데이터
     */
    async logActivity(userId, activityType, targetType = null, targetId = null, metadata = null) {
        const pool = getPool();
        const connection = await pool.getConnection();

        try {
            await connection.query(`
        INSERT INTO user_activity_logs 
        (user_id, activity_type, target_type, target_id, metadata)
        VALUES (?, ?, ?, ?, ?)
      `, [
                userId,
                activityType,
                targetType,
                targetId,
                metadata ? JSON.stringify(metadata) : null
            ]);

        } finally {
            connection.release();
        }
    }

    /**
     * 일별 통계 수동 업데이트
     * @param {Date} date - 업데이트할 날짜
     */
    async updateDailyStats(date = new Date()) {
        const pool = getPool();
        const connection = await pool.getConnection();

        try {
            const dateStr = date.toISOString().split('T')[0];

            await connection.query(`
        INSERT INTO daily_stats (
          stat_date,
          total_users,
          active_users,
          new_users,
          total_posts,
          new_posts,
          total_comments,
          new_comments,
          total_likes,
          new_likes,
          total_views,
          new_views
        )
        SELECT 
          ?,
          (SELECT COUNT(*) FROM users WHERE created_at <= ?),
          (SELECT COUNT(DISTINCT user_id) FROM user_activity_logs WHERE DATE(created_at) = ?),
          (SELECT COUNT(*) FROM users WHERE DATE(created_at) = ?),
          (SELECT COUNT(*) FROM posts WHERE created_at <= ?),
          (SELECT COUNT(*) FROM posts WHERE DATE(created_at) = ?),
          (SELECT COUNT(*) FROM comments WHERE created_at <= ?),
          (SELECT COUNT(*) FROM comments WHERE DATE(created_at) = ?),
          (SELECT COUNT(*) FROM likes WHERE created_at <= ?),
          (SELECT COUNT(*) FROM likes WHERE DATE(created_at) = ?),
          (SELECT COUNT(*) FROM post_views WHERE created_at <= ?),
          (SELECT COUNT(*) FROM post_views WHERE DATE(created_at) = ?)
        ON DUPLICATE KEY UPDATE
          total_users = VALUES(total_users),
          active_users = VALUES(active_users),
          new_users = VALUES(new_users),
          total_posts = VALUES(total_posts),
          new_posts = VALUES(new_posts),
          total_comments = VALUES(total_comments),
          new_comments = VALUES(new_comments),
          total_likes = VALUES(total_likes),
          new_likes = VALUES(new_likes),
          total_views = VALUES(total_views),
          new_views = VALUES(new_views),
          updated_at = CURRENT_TIMESTAMP
      `, Array(12).fill(dateStr));

        } finally {
            connection.release();
        }
    }
}

const dashboardService = new DashboardService();
export default dashboardService;
