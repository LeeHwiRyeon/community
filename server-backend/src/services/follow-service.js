/**
 * Follow Service
 * 팔로우/언팔로우 및 팔로워 관리 서비스
 * 
 * @module services/follow-service
 * @requires mysql2/promise
 */

import { getPool } from '../db.js';
import logger from '../logger.js';

const pool = getPool();

/**
 * 사용자 팔로우
 * @param {number} followerId - 팔로워 ID (following하는 사용자)
 * @param {number} followingId - 팔로잉 ID (followed되는 사용자)
 * @returns {Promise<Object>} 팔로우 결과
 */
export async function followUser(followerId, followingId) {
    const connection = await pool.getConnection();

    try {
        // 자기 자신 팔로우 방지
        if (followerId === followingId) {
            throw new Error('자기 자신을 팔로우할 수 없습니다.');
        }

        // 팔로우 대상 사용자 존재 확인
        const [targetUser] = await connection.query(
            'SELECT id, username FROM users WHERE id = ?',
            [followingId]
        );

        if (targetUser.length === 0) {
            throw new Error('존재하지 않는 사용자입니다.');
        }

        // 이미 팔로우 중인지 확인
        const [existing] = await connection.query(
            'SELECT id FROM follows WHERE follower_id = ? AND following_id = ?',
            [followerId, followingId]
        );

        if (existing.length > 0) {
            throw new Error('이미 팔로우 중입니다.');
        }

        // 팔로우 생성
        const [result] = await connection.query(
            'INSERT INTO follows (follower_id, following_id) VALUES (?, ?)',
            [followerId, followingId]
        );

        logger.info(`User ${followerId} followed user ${followingId}`);

        return {
            success: true,
            message: `${targetUser[0].username}님을 팔로우했습니다.`,
            followId: result.insertId,
            followedUser: {
                id: targetUser[0].id,
                username: targetUser[0].username
            }
        };
    } catch (error) {
        logger.error('Error following user:', error);
        throw error;
    } finally {
        connection.release();
    }
}

/**
 * 사용자 언팔로우
 * @param {number} followerId - 팔로워 ID
 * @param {number} followingId - 팔로잉 ID
 * @returns {Promise<Object>} 언팔로우 결과
 */
export async function unfollowUser(followerId, followingId) {
    const connection = await pool.getConnection();

    try {
        // 팔로우 관계 확인
        const [existing] = await connection.query(
            'SELECT id FROM follows WHERE follower_id = ? AND following_id = ?',
            [followerId, followingId]
        );

        if (existing.length === 0) {
            throw new Error('팔로우 관계가 존재하지 않습니다.');
        }

        // 팔로우 삭제
        await connection.query(
            'DELETE FROM follows WHERE follower_id = ? AND following_id = ?',
            [followerId, followingId]
        );

        // 대상 사용자 정보
        const [targetUser] = await connection.query(
            'SELECT username FROM users WHERE id = ?',
            [followingId]
        );

        logger.info(`User ${followerId} unfollowed user ${followingId}`);

        return {
            success: true,
            message: `${targetUser[0]?.username || '사용자'}님을 언팔로우했습니다.`
        };
    } catch (error) {
        logger.error('Error unfollowing user:', error);
        throw error;
    } finally {
        connection.release();
    }
}

/**
 * 팔로워 목록 조회
 * @param {number} userId - 사용자 ID
 * @param {number} limit - 조회 개수
 * @param {number} offset - 시작 위치
 * @returns {Promise<Array>} 팔로워 목록
 */
export async function getFollowers(userId, limit = 20, offset = 0) {
    try {
        const [followers] = await pool.query(
            `SELECT 
                u.id,
                u.username,
                u.display_name,
                u.profile_picture,
                u.bio,
                f.created_at AS followed_at,
                (SELECT COUNT(*) FROM follows WHERE following_id = u.id) AS followers_count,
                (SELECT COUNT(*) FROM follows WHERE follower_id = u.id) AS following_count
            FROM follows f
            JOIN users u ON f.follower_id = u.id
            WHERE f.following_id = ?
            ORDER BY f.created_at DESC
            LIMIT ? OFFSET ?`,
            [userId, limit, offset]
        );

        // 전체 팔로워 수
        const [countResult] = await pool.query(
            'SELECT COUNT(*) AS total FROM follows WHERE following_id = ?',
            [userId]
        );

        return {
            followers,
            total: countResult[0].total,
            limit,
            offset
        };
    } catch (error) {
        logger.error('Error getting followers:', error);
        throw error;
    }
}

/**
 * 팔로잉 목록 조회
 * @param {number} userId - 사용자 ID
 * @param {number} limit - 조회 개수
 * @param {number} offset - 시작 위치
 * @returns {Promise<Array>} 팔로잉 목록
 */
export async function getFollowing(userId, limit = 20, offset = 0) {
    try {
        const [following] = await pool.query(
            `SELECT 
                u.id,
                u.username,
                u.display_name,
                u.profile_picture,
                u.bio,
                f.created_at AS followed_at,
                (SELECT COUNT(*) FROM follows WHERE following_id = u.id) AS followers_count,
                (SELECT COUNT(*) FROM follows WHERE follower_id = u.id) AS following_count
            FROM follows f
            JOIN users u ON f.following_id = u.id
            WHERE f.follower_id = ?
            ORDER BY f.created_at DESC
            LIMIT ? OFFSET ?`,
            [userId, limit, offset]
        );

        // 전체 팔로잉 수
        const [countResult] = await pool.query(
            'SELECT COUNT(*) AS total FROM follows WHERE follower_id = ?',
            [userId]
        );

        return {
            following,
            total: countResult[0].total,
            limit,
            offset
        };
    } catch (error) {
        logger.error('Error getting following:', error);
        throw error;
    }
}

/**
 * 팔로우 관계 확인
 * @param {number} followerId - 팔로워 ID
 * @param {number} followingId - 팔로잉 ID
 * @returns {Promise<boolean>} 팔로우 여부
 */
export async function isFollowing(followerId, followingId) {
    try {
        const [result] = await pool.query(
            'SELECT id FROM follows WHERE follower_id = ? AND following_id = ?',
            [followerId, followingId]
        );

        return result.length > 0;
    } catch (error) {
        logger.error('Error checking follow status:', error);
        throw error;
    }
}

/**
 * 팔로우 통계 조회
 * @param {number} userId - 사용자 ID
 * @returns {Promise<Object>} 팔로우 통계
 */
export async function getFollowStats(userId) {
    try {
        const [stats] = await pool.query(
            `SELECT 
                user_id,
                username,
                followers_count,
                following_count
            FROM user_follow_stats
            WHERE user_id = ?`,
            [userId]
        );

        if (stats.length === 0) {
            return {
                user_id: userId,
                followers_count: 0,
                following_count: 0
            };
        }

        return stats[0];
    } catch (error) {
        logger.error('Error getting follow stats:', error);
        throw error;
    }
}

/**
 * 상호 팔로우 확인 (맞팔로우)
 * @param {number} userId1 - 사용자 1 ID
 * @param {number} userId2 - 사용자 2 ID
 * @returns {Promise<boolean>} 상호 팔로우 여부
 */
export async function isMutualFollow(userId1, userId2) {
    try {
        const [result] = await pool.query(
            `SELECT COUNT(*) AS count FROM follows
            WHERE (follower_id = ? AND following_id = ?)
               OR (follower_id = ? AND following_id = ?)`,
            [userId1, userId2, userId2, userId1]
        );

        return result[0].count === 2;
    } catch (error) {
        logger.error('Error checking mutual follow:', error);
        throw error;
    }
}

/**
 * 팔로우 추천 (공통 팔로우 기반)
 * @param {number} userId - 사용자 ID
 * @param {number} limit - 조회 개수
 * @returns {Promise<Array>} 추천 사용자 목록
 */
export async function getFollowSuggestions(userId, limit = 10) {
    try {
        // 사용자가 팔로우하는 사람들이 팔로우하는 사람들
        // (단, 이미 팔로우하지 않은 사람)
        const [suggestions] = await pool.query(
            `SELECT 
                u.id,
                u.username,
                u.display_name,
                u.profile_picture,
                u.bio,
                COUNT(DISTINCT f2.follower_id) AS mutual_friends,
                (SELECT COUNT(*) FROM follows WHERE following_id = u.id) AS followers_count
            FROM follows f1
            JOIN follows f2 ON f1.following_id = f2.follower_id
            JOIN users u ON f2.following_id = u.id
            WHERE f1.follower_id = ?
              AND f2.following_id != ?
              AND f2.following_id NOT IN (
                  SELECT following_id FROM follows WHERE follower_id = ?
              )
            GROUP BY u.id, u.username, u.display_name, u.profile_picture, u.bio
            ORDER BY mutual_friends DESC, followers_count DESC
            LIMIT ?`,
            [userId, userId, userId, limit]
        );

        return suggestions;
    } catch (error) {
        logger.error('Error getting follow suggestions:', error);
        throw error;
    }
}

/**
 * 최근 팔로워 조회
 * @param {number} userId - 사용자 ID
 * @param {number} limit - 조회 개수
 * @returns {Promise<Array>} 최근 팔로워 목록
 */
export async function getRecentFollowers(userId, limit = 5) {
    try {
        const [followers] = await pool.query(
            `SELECT 
                u.id,
                u.username,
                u.display_name,
                u.profile_picture,
                f.created_at AS followed_at
            FROM follows f
            JOIN users u ON f.follower_id = u.id
            WHERE f.following_id = ?
            ORDER BY f.created_at DESC
            LIMIT ?`,
            [userId, limit]
        );

        return followers;
    } catch (error) {
        logger.error('Error getting recent followers:', error);
        throw error;
    }
}

/**
 * 게시판 팔로우
 * @param {number} userId - 사용자 ID
 * @param {number} boardId - 게시판 ID
 * @param {boolean} notificationEnabled - 알림 활성화 여부
 * @returns {Promise<Object>} 팔로우 결과
 */
export async function followBoard(userId, boardId, notificationEnabled = true) {
    const connection = await pool.getConnection();

    try {
        // 게시판 존재 확인
        const [board] = await connection.query(
            'SELECT id, name FROM boards WHERE id = ?',
            [boardId]
        );

        if (board.length === 0) {
            throw new Error('존재하지 않는 게시판입니다.');
        }

        // 이미 팔로우 중인지 확인
        const [existing] = await connection.query(
            'SELECT id FROM board_follows WHERE user_id = ? AND board_id = ?',
            [userId, boardId]
        );

        if (existing.length > 0) {
            throw new Error('이미 팔로우 중인 게시판입니다.');
        }

        // 팔로우 생성
        const [result] = await connection.query(
            'INSERT INTO board_follows (user_id, board_id, notification_enabled) VALUES (?, ?, ?)',
            [userId, boardId, notificationEnabled]
        );

        logger.info(`User ${userId} followed board ${boardId}`);

        return {
            success: true,
            message: `${board[0].name} 게시판을 팔로우했습니다.`,
            followId: result.insertId,
            board: {
                id: board[0].id,
                name: board[0].name
            }
        };
    } catch (error) {
        logger.error('Error following board:', error);
        throw error;
    } finally {
        connection.release();
    }
}

/**
 * 게시판 언팔로우
 * @param {number} userId - 사용자 ID
 * @param {number} boardId - 게시판 ID
 * @returns {Promise<Object>} 언팔로우 결과
 */
export async function unfollowBoard(userId, boardId) {
    const connection = await pool.getConnection();

    try {
        // 팔로우 관계 확인
        const [existing] = await connection.query(
            'SELECT id FROM board_follows WHERE user_id = ? AND board_id = ?',
            [userId, boardId]
        );

        if (existing.length === 0) {
            throw new Error('팔로우 관계가 존재하지 않습니다.');
        }

        // 팔로우 삭제
        await connection.query(
            'DELETE FROM board_follows WHERE user_id = ? AND board_id = ?',
            [userId, boardId]
        );

        // 게시판 정보
        const [board] = await connection.query(
            'SELECT name FROM boards WHERE id = ?',
            [boardId]
        );

        logger.info(`User ${userId} unfollowed board ${boardId}`);

        return {
            success: true,
            message: `${board[0]?.name || '게시판'} 팔로우를 취소했습니다.`
        };
    } catch (error) {
        logger.error('Error unfollowing board:', error);
        throw error;
    } finally {
        connection.release();
    }
}

/**
 * 사용자가 팔로우하는 게시판 목록 조회
 * @param {number} userId - 사용자 ID
 * @param {number} limit - 조회 개수
 * @param {number} offset - 시작 위치
 * @returns {Promise<Object>} 게시판 목록
 */
export async function getFollowedBoards(userId, limit = 20, offset = 0) {
    try {
        const [boards] = await pool.query(
            `SELECT 
                b.id,
                b.name,
                b.description,
                bf.notification_enabled,
                bf.created_at AS followed_at,
                (SELECT COUNT(*) FROM posts WHERE board_id = b.id AND deleted = 0) AS post_count,
                (SELECT COUNT(*) FROM board_follows WHERE board_id = b.id) AS follower_count
            FROM board_follows bf
            JOIN boards b ON bf.board_id = b.id
            WHERE bf.user_id = ?
            ORDER BY bf.created_at DESC
            LIMIT ? OFFSET ?`,
            [userId, limit, offset]
        );

        // 전체 팔로우 게시판 수
        const [countResult] = await pool.query(
            'SELECT COUNT(*) AS total FROM board_follows WHERE user_id = ?',
            [userId]
        );

        return {
            boards,
            total: countResult[0].total,
            limit,
            offset
        };
    } catch (error) {
        logger.error('Error getting followed boards:', error);
        throw error;
    }
}

/**
 * 게시판 팔로우 여부 확인
 * @param {number} userId - 사용자 ID
 * @param {number} boardId - 게시판 ID
 * @returns {Promise<boolean>} 팔로우 여부
 */
export async function isBoardFollowing(userId, boardId) {
    try {
        const [result] = await pool.query(
            'SELECT id FROM board_follows WHERE user_id = ? AND board_id = ?',
            [userId, boardId]
        );

        return result.length > 0;
    } catch (error) {
        logger.error('Error checking board follow status:', error);
        throw error;
    }
}

/**
 * 게시판 알림 설정 변경
 * @param {number} userId - 사용자 ID
 * @param {number} boardId - 게시판 ID
 * @param {boolean} enabled - 알림 활성화 여부
 * @returns {Promise<Object>} 변경 결과
 */
export async function updateBoardNotification(userId, boardId, enabled) {
    const connection = await pool.getConnection();

    try {
        // 팔로우 관계 확인
        const [existing] = await connection.query(
            'SELECT id FROM board_follows WHERE user_id = ? AND board_id = ?',
            [userId, boardId]
        );

        if (existing.length === 0) {
            throw new Error('팔로우 관계가 존재하지 않습니다.');
        }

        // 알림 설정 변경
        await connection.query(
            'UPDATE board_follows SET notification_enabled = ? WHERE user_id = ? AND board_id = ?',
            [enabled, userId, boardId]
        );

        logger.info(`User ${userId} updated board ${boardId} notification: ${enabled}`);

        return {
            success: true,
            message: `게시판 알림이 ${enabled ? '활성화' : '비활성화'}되었습니다.`
        };
    } catch (error) {
        logger.error('Error updating board notification:', error);
        throw error;
    } finally {
        connection.release();
    }
}

/**
 * 인기 게시판 목록 조회 (팔로워 수 기준)
 * @param {number} limit - 조회 개수
 * @returns {Promise<Array>} 인기 게시판 목록
 */
export async function getPopularBoards(limit = 10) {
    try {
        const [boards] = await pool.query(
            `SELECT 
                b.id,
                b.name,
                b.description,
                COUNT(bf.id) AS follower_count,
                (SELECT COUNT(*) FROM posts WHERE board_id = b.id AND deleted = 0) AS post_count
            FROM boards b
            LEFT JOIN board_follows bf ON b.id = bf.board_id
            GROUP BY b.id, b.name, b.description
            ORDER BY follower_count DESC, post_count DESC
            LIMIT ?`,
            [limit]
        );

        return boards;
    } catch (error) {
        logger.error('Error getting popular boards:', error);
        throw error;
    }
}

/**
 * 팔로우한 사용자들의 최근 게시물 조회 (피드)
 * @param {number} userId - 사용자 ID
 * @param {number} limit - 조회 개수
 * @param {number} offset - 시작 위치
 * @returns {Promise<Object>} 게시물 목록
 */
export async function getUserFollowFeed(userId, limit = 20, offset = 0) {
    try {
        const [posts] = await pool.query(
            `SELECT 
                p.id,
                p.title,
                p.content,
                p.user_id AS author_id,
                u.username AS author_username,
                u.display_name AS author_display_name,
                u.profile_picture AS author_avatar,
                p.board_id,
                b.name AS board_name,
                p.created_at,
                p.view_count,
                p.upvotes,
                p.downvotes,
                (SELECT COUNT(*) FROM comments WHERE post_id = p.id) AS comment_count
            FROM posts p
            JOIN users u ON p.user_id = u.id
            JOIN boards b ON p.board_id = b.id
            WHERE p.deleted = 0
              AND p.user_id IN (
                  SELECT following_id FROM follows WHERE follower_id = ?
              )
            ORDER BY p.created_at DESC
            LIMIT ? OFFSET ?`,
            [userId, limit, offset]
        );

        // 전체 게시물 수
        const [countResult] = await pool.query(
            `SELECT COUNT(*) AS total FROM posts p
            WHERE p.deleted = 0
              AND p.user_id IN (
                  SELECT following_id FROM follows WHERE follower_id = ?
              )`,
            [userId]
        );

        return {
            posts,
            total: countResult[0].total,
            limit,
            offset
        };
    } catch (error) {
        logger.error('Error getting user follow feed:', error);
        throw error;
    }
}

/**
 * 팔로우한 게시판들의 최근 게시물 조회 (피드)
 * @param {number} userId - 사용자 ID
 * @param {number} limit - 조회 개수
 * @param {number} offset - 시작 위치
 * @returns {Promise<Object>} 게시물 목록
 */
export async function getBoardFollowFeed(userId, limit = 20, offset = 0) {
    try {
        const [posts] = await pool.query(
            `SELECT 
                p.id,
                p.title,
                p.content,
                p.user_id AS author_id,
                u.username AS author_username,
                u.display_name AS author_display_name,
                u.profile_picture AS author_avatar,
                p.board_id,
                b.name AS board_name,
                p.created_at,
                p.view_count,
                p.upvotes,
                p.downvotes,
                (SELECT COUNT(*) FROM comments WHERE post_id = p.id) AS comment_count
            FROM posts p
            JOIN users u ON p.user_id = u.id
            JOIN boards b ON p.board_id = b.id
            WHERE p.deleted = 0
              AND p.board_id IN (
                  SELECT board_id FROM board_follows WHERE user_id = ?
              )
            ORDER BY p.created_at DESC
            LIMIT ? OFFSET ?`,
            [userId, limit, offset]
        );

        // 전체 게시물 수
        const [countResult] = await pool.query(
            `SELECT COUNT(*) AS total FROM posts p
            WHERE p.deleted = 0
              AND p.board_id IN (
                  SELECT board_id FROM board_follows WHERE user_id = ?
              )`,
            [userId]
        );

        return {
            posts,
            total: countResult[0].total,
            limit,
            offset
        };
    } catch (error) {
        logger.error('Error getting board follow feed:', error);
        throw error;
    }
}

export default {
    followUser,
    unfollowUser,
    getFollowers,
    getFollowing,
    isFollowing,
    getFollowStats,
    isMutualFollow,
    getFollowSuggestions,
    getRecentFollowers,
    followBoard,
    unfollowBoard,
    getFollowedBoards,
    isBoardFollowing,
    updateBoardNotification,
    getPopularBoards,
    getUserFollowFeed,
    getBoardFollowFeed
};
