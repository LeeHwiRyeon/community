/**
 * Mention Service
 * 멘션 관련 비즈니스 로직 처리
 */

import { getPool } from '../db.js';
import logger from '../logger.js';

const pool = getPool();

/**
 * 텍스트에서 @username 멘션 추출
 * @param {string} text - 파싱할 텍스트
 * @returns {Array<string>} 추출된 사용자명 배열 (중복 제거)
 */
export function parseMentions(text) {
    if (!text || typeof text !== 'string') {
        return [];
    }

    // @username 패턴 매칭 (영문, 숫자, 언더스코어, 3-20자)
    const mentionRegex = /@([a-zA-Z0-9_]{3,20})/g;
    const matches = text.matchAll(mentionRegex);

    // 중복 제거
    const usernames = new Set();
    for (const match of matches) {
        usernames.add(match[1]);
    }

    return Array.from(usernames);
}

/**
 * 사용자명으로 사용자 ID 찾기
 * @param {Array<string>} usernames - 사용자명 배열
 * @returns {Promise<Map<string, number>>} username -> userId 매핑
 */
export async function getUserIdsByUsernames(usernames) {
    if (!usernames || usernames.length === 0) {
        return new Map();
    }

    try {
        const placeholders = usernames.map(() => '?').join(',');
        const query = `
            SELECT id, username
            FROM users
            WHERE username IN (${placeholders})
            AND deleted_at IS NULL
        `;

        const [rows] = await pool.query(query, usernames);

        const usernameMap = new Map();
        rows.forEach(row => {
            usernameMap.set(row.username, row.id);
        });

        return usernameMap;
    } catch (error) {
        logger.error('Error getting user IDs by usernames:', error);
        throw error;
    }
}

/**
 * 멘션 생성 (게시물)
 * @param {number} postId - 게시물 ID
 * @param {number} mentionedByUserId - 멘션을 생성한 사용자 ID
 * @param {string} content - 게시물 내용
 * @returns {Promise<Object>} 생성 결과
 */
export async function createPostMentions(postId, mentionedByUserId, content) {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // 멘션 파싱
        const usernames = parseMentions(content);

        if (usernames.length === 0) {
            await connection.commit();
            return {
                success: true,
                mentionsCreated: 0,
                message: 'No mentions found'
            };
        }

        // 사용자 ID 조회
        const usernameMap = await getUserIdsByUsernames(usernames);

        if (usernameMap.size === 0) {
            await connection.commit();
            return {
                success: true,
                mentionsCreated: 0,
                message: 'No valid users found'
            };
        }

        // 멘션 삽입
        const mentionValues = [];
        for (const [username, userId] of usernameMap) {
            // 자기 자신은 멘션하지 않음
            if (userId !== mentionedByUserId) {
                mentionValues.push([postId, null, userId, mentionedByUserId, content.substring(0, 100)]);
            }
        }

        if (mentionValues.length > 0) {
            const insertQuery = `
                INSERT INTO mentions (post_id, comment_id, mentioned_user_id, mentioned_by_user_id, context)
                VALUES ?
            `;

            await connection.query(insertQuery, [mentionValues]);
        }

        await connection.commit();

        return {
            success: true,
            mentionsCreated: mentionValues.length,
            mentionedUsers: Array.from(usernameMap.keys())
        };

    } catch (error) {
        await connection.rollback();
        logger.error('Error creating post mentions:', error);
        throw error;
    } finally {
        connection.release();
    }
}

/**
 * 멘션 생성 (댓글)
 * @param {number} commentId - 댓글 ID
 * @param {number} mentionedByUserId - 멘션을 생성한 사용자 ID
 * @param {string} content - 댓글 내용
 * @returns {Promise<Object>} 생성 결과
 */
export async function createCommentMentions(commentId, mentionedByUserId, content) {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // 멘션 파싱
        const usernames = parseMentions(content);

        if (usernames.length === 0) {
            await connection.commit();
            return {
                success: true,
                mentionsCreated: 0,
                message: 'No mentions found'
            };
        }

        // 사용자 ID 조회
        const usernameMap = await getUserIdsByUsernames(usernames);

        if (usernameMap.size === 0) {
            await connection.commit();
            return {
                success: true,
                mentionsCreated: 0,
                message: 'No valid users found'
            };
        }

        // 멘션 삽입
        const mentionValues = [];
        for (const [username, userId] of usernameMap) {
            // 자기 자신은 멘션하지 않음
            if (userId !== mentionedByUserId) {
                mentionValues.push([null, commentId, userId, mentionedByUserId, content.substring(0, 100)]);
            }
        }

        if (mentionValues.length > 0) {
            const insertQuery = `
                INSERT INTO mentions (post_id, comment_id, mentioned_user_id, mentioned_by_user_id, context)
                VALUES ?
            `;

            await connection.query(insertQuery, [mentionValues]);
        }

        await connection.commit();

        return {
            success: true,
            mentionsCreated: mentionValues.length,
            mentionedUsers: Array.from(usernameMap.keys())
        };

    } catch (error) {
        await connection.rollback();
        logger.error('Error creating comment mentions:', error);
        throw error;
    } finally {
        connection.release();
    }
}

/**
 * 사용자의 멘션 목록 조회
 * @param {number} userId - 사용자 ID
 * @param {number} limit - 페이지 크기
 * @param {number} offset - 오프셋
 * @returns {Promise<Object>} 멘션 목록 및 페이지네이션 정보
 */
export async function getUserMentions(userId, limit = 20, offset = 0) {
    try {
        const query = `
            SELECT 
                m.id,
                m.post_id,
                m.comment_id,
                m.mentioned_user_id,
                m.mentioned_by_user_id,
                m.context,
                m.created_at,
                m.is_read,
                u.username AS mentioned_by_username,
                u.display_name AS mentioned_by_display_name,
                u.profile_picture AS mentioned_by_profile_picture,
                p.title AS post_title,
                p.content AS post_content,
                c.content AS comment_content
            FROM mentions m
            JOIN users u ON m.mentioned_by_user_id = u.id
            LEFT JOIN posts p ON m.post_id = p.id
            LEFT JOIN comments c ON m.comment_id = c.id
            WHERE m.mentioned_user_id = ?
            AND u.deleted_at IS NULL
            ORDER BY m.created_at DESC
            LIMIT ? OFFSET ?
        `;

        const [mentions] = await pool.query(query, [userId, limit, offset]);

        // 총 개수 조회
        const countQuery = `
            SELECT COUNT(*) as total
            FROM mentions m
            JOIN users u ON m.mentioned_by_user_id = u.id
            WHERE m.mentioned_user_id = ?
            AND u.deleted_at IS NULL
        `;

        const [countResult] = await pool.query(countQuery, [userId]);
        const total = countResult[0].total;

        return {
            mentions,
            total,
            limit,
            offset,
            hasMore: offset + mentions.length < total
        };

    } catch (error) {
        logger.error('Error getting user mentions:', error);
        throw error;
    }
}

/**
 * 게시물의 멘션 목록 조회
 * @param {number} postId - 게시물 ID
 * @returns {Promise<Array>} 멘션 목록
 */
export async function getPostMentions(postId) {
    try {
        const query = `
            SELECT 
                m.id,
                m.mentioned_user_id,
                m.mentioned_by_user_id,
                m.context,
                m.created_at,
                u.username AS mentioned_username,
                u.display_name AS mentioned_display_name,
                u.profile_picture AS mentioned_profile_picture
            FROM mentions m
            JOIN users u ON m.mentioned_user_id = u.id
            WHERE m.post_id = ?
            AND u.deleted_at IS NULL
            ORDER BY m.created_at DESC
        `;

        const [mentions] = await pool.query(query, [postId]);
        return mentions;

    } catch (error) {
        logger.error('Error getting post mentions:', error);
        throw error;
    }
}

/**
 * 댓글의 멘션 목록 조회
 * @param {number} commentId - 댓글 ID
 * @returns {Promise<Array>} 멘션 목록
 */
export async function getCommentMentions(commentId) {
    try {
        const query = `
            SELECT 
                m.id,
                m.mentioned_user_id,
                m.mentioned_by_user_id,
                m.context,
                m.created_at,
                u.username AS mentioned_username,
                u.display_name AS mentioned_display_name,
                u.profile_picture AS mentioned_profile_picture
            FROM mentions m
            JOIN users u ON m.mentioned_user_id = u.id
            WHERE m.comment_id = ?
            AND u.deleted_at IS NULL
            ORDER BY m.created_at DESC
        `;

        const [mentions] = await pool.query(query, [commentId]);
        return mentions;

    } catch (error) {
        logger.error('Error getting comment mentions:', error);
        throw error;
    }
}

/**
 * 멘션 읽음 처리
 * @param {number} mentionId - 멘션 ID
 * @param {number} userId - 사용자 ID (권한 확인용)
 * @returns {Promise<Object>} 결과
 */
export async function markMentionAsRead(mentionId, userId) {
    try {
        // 권한 확인
        const checkQuery = `
            SELECT id 
            FROM mentions 
            WHERE id = ? AND mentioned_user_id = ?
        `;

        const [mentions] = await pool.query(checkQuery, [mentionId, userId]);

        if (mentions.length === 0) {
            throw new Error('Mention not found or unauthorized');
        }

        // 읽음 처리
        const updateQuery = `
            UPDATE mentions 
            SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;

        await pool.query(updateQuery, [mentionId]);

        return {
            success: true,
            message: 'Mention marked as read'
        };

    } catch (error) {
        logger.error('Error marking mention as read:', error);
        throw error;
    }
}

/**
 * 모든 멘션 읽음 처리
 * @param {number} userId - 사용자 ID
 * @returns {Promise<Object>} 결과
 */
export async function markAllMentionsAsRead(userId) {
    try {
        const query = `
            UPDATE mentions 
            SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
            WHERE mentioned_user_id = ? AND is_read = FALSE
        `;

        const [result] = await pool.query(query, [userId]);

        return {
            success: true,
            markedCount: result.affectedRows,
            message: `${result.affectedRows} mentions marked as read`
        };

    } catch (error) {
        logger.error('Error marking all mentions as read:', error);
        throw error;
    }
}

/**
 * 읽지 않은 멘션 개수 조회
 * @param {number} userId - 사용자 ID
 * @returns {Promise<number>} 읽지 않은 멘션 개수
 */
export async function getUnreadMentionCount(userId) {
    try {
        const query = `
            SELECT COUNT(*) as count
            FROM mentions m
            JOIN users u ON m.mentioned_by_user_id = u.id
            WHERE m.mentioned_user_id = ?
            AND m.is_read = FALSE
            AND u.deleted_at IS NULL
        `;

        const [result] = await pool.query(query, [userId]);
        return result[0].count;

    } catch (error) {
        logger.error('Error getting unread mention count:', error);
        throw error;
    }
}

/**
 * 사용자명 검색 (자동완성용)
 * @param {string} searchTerm - 검색어
 * @param {number} limit - 결과 개수 제한
 * @returns {Promise<Array>} 사용자 목록
 */
export async function searchUsernames(searchTerm, limit = 10) {
    try {
        if (!searchTerm || searchTerm.length < 2) {
            return [];
        }

        const query = `
            SELECT 
                id,
                username,
                display_name,
                profile_picture,
                reputation
            FROM users
            WHERE username LIKE ?
            AND deleted_at IS NULL
            ORDER BY reputation DESC, username ASC
            LIMIT ?
        `;

        const [users] = await pool.query(query, [`${searchTerm}%`, limit]);
        return users;

    } catch (error) {
        logger.error('Error searching usernames:', error);
        throw error;
    }
}

export default {
    parseMentions,
    getUserIdsByUsernames,
    createPostMentions,
    createCommentMentions,
    getUserMentions,
    getPostMentions,
    getCommentMentions,
    markMentionAsRead,
    markAllMentionsAsRead,
    getUnreadMentionCount,
    searchUsernames
};
