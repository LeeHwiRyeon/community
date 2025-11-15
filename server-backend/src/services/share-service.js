/**
 * Share Service
 * 게시물 공유 관련 비즈니스 로직 처리
 */

import { getPool } from '../db.js';
import logger from '../logger.js';

const pool = getPool();

/**
 * 공유 기록 추가
 * @param {number} postId - 게시물 ID
 * @param {number} userId - 사용자 ID
 * @param {string} platform - 공유 플랫폼 (twitter, facebook, linkedin, clipboard)
 * @returns {Promise<Object>} 생성 결과
 */
export async function trackShare(postId, userId, platform) {
    try {
        // 게시물 존재 확인
        const [posts] = await pool.query(
            'SELECT id FROM posts WHERE id = ? AND deleted_at IS NULL',
            [postId]
        );

        if (posts.length === 0) {
            throw new Error('존재하지 않는 게시물입니다.');
        }

        // 플랫폼 검증
        const validPlatforms = ['twitter', 'facebook', 'linkedin', 'clipboard'];
        if (!validPlatforms.includes(platform)) {
            throw new Error('유효하지 않은 플랫폼입니다.');
        }

        // 공유 기록 추가
        const query = `
            INSERT INTO shares (post_id, user_id, platform)
            VALUES (?, ?, ?)
        `;

        const [result] = await pool.query(query, [postId, userId, platform]);

        logger.info(`Share tracked: post=${postId}, user=${userId}, platform=${platform}`);

        return {
            success: true,
            shareId: result.insertId,
            message: '공유가 기록되었습니다.'
        };

    } catch (error) {
        logger.error('Error tracking share:', error);
        throw error;
    }
}

/**
 * 게시물의 공유 통계 조회
 * @param {number} postId - 게시물 ID
 * @returns {Promise<Object>} 공유 통계
 */
export async function getShareStats(postId) {
    try {
        // post_share_stats view 사용
        const query = `
            SELECT 
                post_id,
                total_shares,
                twitter_shares,
                facebook_shares,
                linkedin_shares,
                clipboard_shares,
                last_shared_at
            FROM post_share_stats
            WHERE post_id = ?
        `;

        const [stats] = await pool.query(query, [postId]);

        if (stats.length === 0) {
            // 공유 기록이 없는 경우
            return {
                post_id: postId,
                total_shares: 0,
                twitter_shares: 0,
                facebook_shares: 0,
                linkedin_shares: 0,
                clipboard_shares: 0,
                last_shared_at: null
            };
        }

        return stats[0];

    } catch (error) {
        logger.error('Error getting share stats:', error);
        throw error;
    }
}

/**
 * 인기 공유 게시물 조회
 * @param {number} limit - 조회 개수
 * @param {number} days - 기간 (일)
 * @returns {Promise<Array>} 인기 게시물 목록
 */
export async function getTrendingShares(limit = 10, days = 7) {
    try {
        const query = `
            SELECT 
                s.post_id,
                COUNT(*) as share_count,
                COUNT(DISTINCT s.user_id) as unique_sharers,
                p.title,
                p.content,
                u.username as author_username,
                u.display_name as author_display_name
            FROM shares s
            JOIN posts p ON s.post_id = p.id
            JOIN users u ON p.user_id = u.id
            WHERE s.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
            AND p.deleted_at IS NULL
            AND u.deleted_at IS NULL
            GROUP BY s.post_id
            ORDER BY share_count DESC, unique_sharers DESC
            LIMIT ?
        `;

        const [shares] = await pool.query(query, [days, limit]);
        return shares;

    } catch (error) {
        logger.error('Error getting trending shares:', error);
        throw error;
    }
}

/**
 * 플랫폼별 공유 통계
 * @param {string} platform - 플랫폼
 * @param {number} limit - 조회 개수
 * @param {number} days - 기간 (일)
 * @returns {Promise<Array>} 플랫폼별 인기 게시물
 */
export async function getSharesByPlatform(platform, limit = 10, days = 7) {
    try {
        // 플랫폼 검증
        const validPlatforms = ['twitter', 'facebook', 'linkedin', 'clipboard'];
        if (!validPlatforms.includes(platform)) {
            throw new Error('유효하지 않은 플랫폼입니다.');
        }

        const query = `
            SELECT 
                s.post_id,
                COUNT(*) as share_count,
                p.title,
                p.content,
                u.username as author_username,
                u.display_name as author_display_name
            FROM shares s
            JOIN posts p ON s.post_id = p.id
            JOIN users u ON p.user_id = u.id
            WHERE s.platform = ?
            AND s.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
            AND p.deleted_at IS NULL
            AND u.deleted_at IS NULL
            GROUP BY s.post_id
            ORDER BY share_count DESC
            LIMIT ?
        `;

        const [shares] = await pool.query(query, [platform, days, limit]);
        return shares;

    } catch (error) {
        logger.error('Error getting shares by platform:', error);
        throw error;
    }
}

/**
 * 사용자의 공유 기록 조회
 * @param {number} userId - 사용자 ID
 * @param {number} limit - 페이지 크기
 * @param {number} offset - 오프셋
 * @returns {Promise<Object>} 공유 기록 목록
 */
export async function getUserShares(userId, limit = 20, offset = 0) {
    try {
        const query = `
            SELECT 
                s.id,
                s.post_id,
                s.platform,
                s.created_at,
                p.title as post_title,
                p.content as post_content,
                u.username as post_author_username
            FROM shares s
            JOIN posts p ON s.post_id = p.id
            JOIN users u ON p.user_id = u.id
            WHERE s.user_id = ?
            AND p.deleted_at IS NULL
            ORDER BY s.created_at DESC
            LIMIT ? OFFSET ?
        `;

        const [shares] = await pool.query(query, [userId, limit, offset]);

        // 총 개수 조회
        const countQuery = `
            SELECT COUNT(*) as total
            FROM shares s
            JOIN posts p ON s.post_id = p.id
            WHERE s.user_id = ?
            AND p.deleted_at IS NULL
        `;

        const [countResult] = await pool.query(countQuery, [userId]);
        const total = countResult[0].total;

        return {
            shares,
            total,
            limit,
            offset,
            hasMore: offset + shares.length < total
        };

    } catch (error) {
        logger.error('Error getting user shares:', error);
        throw error;
    }
}

/**
 * 게시물 공유 여부 확인
 * @param {number} postId - 게시물 ID
 * @param {number} userId - 사용자 ID
 * @returns {Promise<boolean>} 공유 여부
 */
export async function hasShared(postId, userId) {
    try {
        const query = `
            SELECT COUNT(*) as count
            FROM shares
            WHERE post_id = ? AND user_id = ?
        `;

        const [result] = await pool.query(query, [postId, userId]);
        return result[0].count > 0;

    } catch (error) {
        logger.error('Error checking if shared:', error);
        throw error;
    }
}

/**
 * 전체 공유 통계 조회
 * @returns {Promise<Object>} 전체 통계
 */
export async function getGlobalShareStats() {
    try {
        const query = `
            SELECT 
                COUNT(*) as total_shares,
                COUNT(DISTINCT post_id) as unique_posts_shared,
                COUNT(DISTINCT user_id) as unique_sharers,
                SUM(CASE WHEN platform = 'twitter' THEN 1 ELSE 0 END) as twitter_total,
                SUM(CASE WHEN platform = 'facebook' THEN 1 ELSE 0 END) as facebook_total,
                SUM(CASE WHEN platform = 'linkedin' THEN 1 ELSE 0 END) as linkedin_total,
                SUM(CASE WHEN platform = 'clipboard' THEN 1 ELSE 0 END) as clipboard_total
            FROM shares
        `;

        const [stats] = await pool.query(query);
        return stats[0];

    } catch (error) {
        logger.error('Error getting global share stats:', error);
        throw error;
    }
}

export default {
    trackShare,
    getShareStats,
    getTrendingShares,
    getSharesByPlatform,
    getUserShares,
    hasShared,
    getGlobalShareStats
};
