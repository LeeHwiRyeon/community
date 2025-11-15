/**
 * Block Service
 * 사용자 차단 관련 비즈니스 로직 처리
 */

import { getPool } from '../db.js';
import logger from '../logger.js';

const pool = getPool();

/**
 * 사용자 차단
 * @param {number} blockerId - 차단하는 사용자 ID
 * @param {number} blockedId - 차단당하는 사용자 ID
 * @param {string} reason - 차단 이유 (선택)
 * @returns {Promise<Object>} 차단 결과
 */
export async function blockUser(blockerId, blockedId, reason = null) {
    try {
        // 자기 자신 차단 방지
        if (blockerId === blockedId) {
            throw new Error('자기 자신을 차단할 수 없습니다.');
        }

        // 차단 대상 사용자 존재 확인
        const [users] = await pool.query(
            'SELECT id, username FROM users WHERE id = ? AND deleted_at IS NULL',
            [blockedId]
        );

        if (users.length === 0) {
            throw new Error('존재하지 않는 사용자입니다.');
        }

        // 이미 차단했는지 확인
        const [existing] = await pool.query(
            'SELECT id FROM blocked_users WHERE blocker_id = ? AND blocked_id = ?',
            [blockerId, blockedId]
        );

        if (existing.length > 0) {
            throw new Error('이미 차단한 사용자입니다.');
        }

        // 차단 추가
        const query = `
            INSERT INTO blocked_users (blocker_id, blocked_id, reason)
            VALUES (?, ?, ?)
        `;

        const [result] = await pool.query(query, [blockerId, blockedId, reason]);

        logger.info(`User blocked: blocker=${blockerId}, blocked=${blockedId}`);

        return {
            success: true,
            blockId: result.insertId,
            blockedUser: users[0],
            message: '사용자를 차단했습니다.'
        };

    } catch (error) {
        logger.error('Error blocking user:', error);
        throw error;
    }
}

/**
 * 사용자 차단 해제
 * @param {number} blockerId - 차단하는 사용자 ID
 * @param {number} blockedId - 차단당하는 사용자 ID
 * @returns {Promise<Object>} 차단 해제 결과
 */
export async function unblockUser(blockerId, blockedId) {
    try {
        // 차단 관계 확인
        const [blocks] = await pool.query(
            'SELECT id FROM blocked_users WHERE blocker_id = ? AND blocked_id = ?',
            [blockerId, blockedId]
        );

        if (blocks.length === 0) {
            throw new Error('차단하지 않은 사용자입니다.');
        }

        // 차단 해제
        const query = 'DELETE FROM blocked_users WHERE blocker_id = ? AND blocked_id = ?';
        await pool.query(query, [blockerId, blockedId]);

        logger.info(`User unblocked: blocker=${blockerId}, blocked=${blockedId}`);

        return {
            success: true,
            message: '차단을 해제했습니다.'
        };

    } catch (error) {
        logger.error('Error unblocking user:', error);
        throw error;
    }
}

/**
 * 차단한 사용자 목록 조회
 * @param {number} blockerId - 차단하는 사용자 ID
 * @param {number} limit - 페이지 크기
 * @param {number} offset - 오프셋
 * @returns {Promise<Object>} 차단 목록 및 페이지네이션 정보
 */
export async function getBlockedUsers(blockerId, limit = 20, offset = 0) {
    try {
        const query = `
            SELECT 
                b.id,
                b.blocker_id,
                b.blocked_id,
                b.reason,
                b.created_at,
                u.username,
                u.display_name,
                u.profile_picture,
                u.bio
            FROM blocked_users b
            JOIN users u ON b.blocked_id = u.id
            WHERE b.blocker_id = ?
            AND u.deleted_at IS NULL
            ORDER BY b.created_at DESC
            LIMIT ? OFFSET ?
        `;

        const [blocked] = await pool.query(query, [blockerId, limit, offset]);

        // 총 개수 조회
        const countQuery = `
            SELECT COUNT(*) as total
            FROM blocked_users b
            JOIN users u ON b.blocked_id = u.id
            WHERE b.blocker_id = ?
            AND u.deleted_at IS NULL
        `;

        const [countResult] = await pool.query(countQuery, [blockerId]);
        const total = countResult[0].total;

        return {
            blocked,
            total,
            limit,
            offset,
            hasMore: offset + blocked.length < total
        };

    } catch (error) {
        logger.error('Error getting blocked users:', error);
        throw error;
    }
}

/**
 * 차단 여부 확인
 * @param {number} blockerId - 차단하는 사용자 ID
 * @param {number} blockedId - 차단당하는 사용자 ID
 * @returns {Promise<boolean>} 차단 여부
 */
export async function isBlocked(blockerId, blockedId) {
    try {
        const query = `
            SELECT COUNT(*) as count
            FROM blocked_users
            WHERE blocker_id = ? AND blocked_id = ?
        `;

        const [result] = await pool.query(query, [blockerId, blockedId]);
        return result[0].count > 0;

    } catch (error) {
        logger.error('Error checking if blocked:', error);
        throw error;
    }
}

/**
 * 양방향 차단 여부 확인 (A가 B를 차단했거나 B가 A를 차단했는지)
 * @param {number} userId1 - 사용자 ID 1
 * @param {number} userId2 - 사용자 ID 2
 * @returns {Promise<Object>} 차단 상태
 */
export async function checkBlockStatus(userId1, userId2) {
    try {
        const query = `
            SELECT 
                blocker_id,
                blocked_id
            FROM blocked_users
            WHERE (blocker_id = ? AND blocked_id = ?)
               OR (blocker_id = ? AND blocked_id = ?)
        `;

        const [blocks] = await pool.query(query, [userId1, userId2, userId2, userId1]);

        const status = {
            isBlocked: blocks.length > 0,
            iBlockedThem: blocks.some(b => b.blocker_id === userId1 && b.blocked_id === userId2),
            theyBlockedMe: blocks.some(b => b.blocker_id === userId2 && b.blocked_id === userId1)
        };

        return status;

    } catch (error) {
        logger.error('Error checking block status:', error);
        throw error;
    }
}

/**
 * 나를 차단한 사용자 목록 조회
 * @param {number} blockedId - 차단당한 사용자 ID
 * @param {number} limit - 페이지 크기
 * @param {number} offset - 오프셋
 * @returns {Promise<Object>} 차단한 사용자 목록
 */
export async function getBlockers(blockedId, limit = 20, offset = 0) {
    try {
        const query = `
            SELECT 
                b.id,
                b.blocker_id,
                b.blocked_id,
                b.created_at,
                u.username,
                u.display_name,
                u.profile_picture
            FROM blocked_users b
            JOIN users u ON b.blocker_id = u.id
            WHERE b.blocked_id = ?
            AND u.deleted_at IS NULL
            ORDER BY b.created_at DESC
            LIMIT ? OFFSET ?
        `;

        const [blockers] = await pool.query(query, [blockedId, limit, offset]);

        // 총 개수 조회
        const countQuery = `
            SELECT COUNT(*) as total
            FROM blocked_users b
            JOIN users u ON b.blocker_id = u.id
            WHERE b.blocked_id = ?
            AND u.deleted_at IS NULL
        `;

        const [countResult] = await pool.query(countQuery, [blockedId]);
        const total = countResult[0].total;

        return {
            blockers,
            total,
            limit,
            offset,
            hasMore: offset + blockers.length < total
        };

    } catch (error) {
        logger.error('Error getting blockers:', error);
        throw error;
    }
}

/**
 * 차단 통계 조회
 * @param {number} userId - 사용자 ID
 * @returns {Promise<Object>} 차단 통계
 */
export async function getBlockStats(userId) {
    try {
        const query = `
            SELECT 
                (SELECT COUNT(*) FROM blocked_users WHERE blocker_id = ?) as blocked_count,
                (SELECT COUNT(*) FROM blocked_users WHERE blocked_id = ?) as blocked_by_count
        `;

        const [stats] = await pool.query(query, [userId, userId]);
        return stats[0];

    } catch (error) {
        logger.error('Error getting block stats:', error);
        throw error;
    }
}

/**
 * 차단된 사용자의 게시물 필터링용 ID 목록
 * @param {number} userId - 사용자 ID
 * @returns {Promise<Array<number>>} 차단된 사용자 ID 배열
 */
export async function getBlockedUserIds(userId) {
    try {
        const query = `
            SELECT blocked_id
            FROM blocked_users
            WHERE blocker_id = ?
        `;

        const [blocks] = await pool.query(query, [userId]);
        return blocks.map(b => b.blocked_id);

    } catch (error) {
        logger.error('Error getting blocked user IDs:', error);
        throw error;
    }
}

export default {
    blockUser,
    unblockUser,
    getBlockedUsers,
    isBlocked,
    checkBlockStatus,
    getBlockers,
    getBlockStats,
    getBlockedUserIds
};
