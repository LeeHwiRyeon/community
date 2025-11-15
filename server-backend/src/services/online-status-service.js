import { getPool } from '../db.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('OnlineStatusService');

class OnlineStatusService {
    /**
     * 사용자 온라인 상태 업데이트
     */
    async updateOnlineStatus(userId, isOnline, status = 'online', deviceType = 'web') {
        const pool = getPool();

        try {
            const query = `
                INSERT INTO user_online_status 
                    (user_id, is_online, status, device_type, last_heartbeat, last_seen)
                VALUES (?, ?, ?, ?, NOW(), NOW())
                ON DUPLICATE KEY UPDATE
                    is_online = VALUES(is_online),
                    status = VALUES(status),
                    device_type = VALUES(device_type),
                    last_heartbeat = VALUES(last_heartbeat),
                    last_seen = VALUES(last_seen),
                    updated_at = NOW()
            `;

            await pool.query(query, [userId, isOnline, status, deviceType]);

            logger.info(`온라인 상태 업데이트: user_id=${userId}, status=${status}`);

            return {
                success: true,
                userId,
                isOnline,
                status,
                deviceType
            };
        } catch (error) {
            logger.error('온라인 상태 업데이트 실패:', error);
            throw error;
        }
    }

    /**
     * 하트비트 업데이트 (사용자가 활동 중임을 알림)
     */
    async updateHeartbeat(userId) {
        const pool = getPool();

        try {
            const query = `
                UPDATE user_online_status
                SET last_heartbeat = NOW(),
                    updated_at = NOW()
                WHERE user_id = ?
            `;

            await pool.query(query, [userId]);

            return { success: true };
        } catch (error) {
            logger.error('하트비트 업데이트 실패:', error);
            throw error;
        }
    }

    /**
     * 사용자 온라인 상태 조회
     */
    async getUserStatus(userId) {
        const pool = getPool();

        try {
            const [rows] = await pool.query(`
                SELECT 
                    uos.user_id,
                    uos.is_online,
                    uos.status,
                    uos.last_seen,
                    uos.last_heartbeat,
                    uos.device_type,
                    u.show_online_status
                FROM user_online_status uos
                INNER JOIN users u ON uos.user_id = u.id
                WHERE uos.user_id = ?
            `, [userId]);

            if (rows.length === 0) {
                return {
                    userId,
                    isOnline: false,
                    status: 'offline',
                    lastSeen: null,
                    showOnlineStatus: true
                };
            }

            const user = rows[0];

            // 프라이버시 설정 확인
            if (!user.show_online_status) {
                return {
                    userId,
                    isOnline: false,
                    status: 'offline',
                    lastSeen: null,
                    showOnlineStatus: false
                };
            }

            // 5분 이상 하트비트가 없으면 오프라인 처리
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
            const lastHeartbeat = new Date(user.last_heartbeat);
            const isActuallyOnline = user.is_online && lastHeartbeat > fiveMinutesAgo;

            return {
                userId: user.user_id,
                isOnline: isActuallyOnline,
                status: isActuallyOnline ? user.status : 'offline',
                lastSeen: user.last_seen,
                lastHeartbeat: user.last_heartbeat,
                deviceType: user.device_type,
                showOnlineStatus: user.show_online_status
            };
        } catch (error) {
            logger.error('사용자 상태 조회 실패:', error);
            throw error;
        }
    }

    /**
     * 여러 사용자의 온라인 상태 조회
     */
    async getBulkUserStatus(userIds) {
        const pool = getPool();

        if (!userIds || userIds.length === 0) {
            return [];
        }

        try {
            const placeholders = userIds.map(() => '?').join(',');
            const query = `
                SELECT 
                    uos.user_id,
                    uos.is_online,
                    uos.status,
                    uos.last_seen,
                    uos.last_heartbeat,
                    uos.device_type,
                    u.show_online_status
                FROM user_online_status uos
                INNER JOIN users u ON uos.user_id = u.id
                WHERE uos.user_id IN (${placeholders})
            `;

            const [rows] = await pool.query(query, userIds);

            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

            return rows.map(user => {
                // 프라이버시 설정 확인
                if (!user.show_online_status) {
                    return {
                        userId: user.user_id,
                        isOnline: false,
                        status: 'offline',
                        showOnlineStatus: false
                    };
                }

                const lastHeartbeat = new Date(user.last_heartbeat);
                const isActuallyOnline = user.is_online && lastHeartbeat > fiveMinutesAgo;

                return {
                    userId: user.user_id,
                    isOnline: isActuallyOnline,
                    status: isActuallyOnline ? user.status : 'offline',
                    lastSeen: user.last_seen,
                    deviceType: user.device_type,
                    showOnlineStatus: user.show_online_status
                };
            });
        } catch (error) {
            logger.error('벌크 상태 조회 실패:', error);
            throw error;
        }
    }

    /**
     * 현재 온라인 사용자 목록 조회
     */
    async getOnlineUsers(limit = 100, offset = 0) {
        const pool = getPool();

        try {
            const [rows] = await pool.query(`
                SELECT 
                    uos.user_id,
                    u.username,
                    u.display_name,
                    u.avatar_url,
                    uos.status,
                    uos.last_heartbeat,
                    uos.device_type
                FROM user_online_status uos
                INNER JOIN users u ON uos.user_id = u.id
                WHERE uos.is_online = TRUE
                    AND uos.last_heartbeat > DATE_SUB(NOW(), INTERVAL 5 MINUTE)
                    AND u.show_online_status = TRUE
                ORDER BY uos.last_heartbeat DESC
                LIMIT ? OFFSET ?
            `, [limit, offset]);

            const [countResult] = await pool.query(`
                SELECT COUNT(*) as total
                FROM user_online_status uos
                INNER JOIN users u ON uos.user_id = u.id
                WHERE uos.is_online = TRUE
                    AND uos.last_heartbeat > DATE_SUB(NOW(), INTERVAL 5 MINUTE)
                    AND u.show_online_status = TRUE
            `);

            return {
                users: rows,
                total: countResult[0].total,
                limit,
                offset
            };
        } catch (error) {
            logger.error('온라인 사용자 목록 조회 실패:', error);
            throw error;
        }
    }

    /**
     * 온라인 사용자 통계 조회
     */
    async getOnlineStatistics() {
        const pool = getPool();

        try {
            const [stats] = await pool.query(`
                SELECT * FROM online_users_summary
            `);

            return stats[0] || {
                total_online: 0,
                actively_online: 0,
                away: 0,
                busy: 0,
                mobile_users: 0,
                desktop_users: 0
            };
        } catch (error) {
            logger.error('온라인 통계 조회 실패:', error);
            throw error;
        }
    }

    /**
     * 사용자 상태 변경 (online, away, busy, offline)
     */
    async changeUserStatus(userId, status) {
        const validStatuses = ['online', 'away', 'busy', 'offline'];

        if (!validStatuses.includes(status)) {
            throw new Error(`Invalid status: ${status}`);
        }

        const isOnline = status !== 'offline';
        return await this.updateOnlineStatus(userId, isOnline, status);
    }

    /**
     * 사용자 오프라인 처리
     */
    async setUserOffline(userId) {
        return await this.updateOnlineStatus(userId, false, 'offline');
    }

    /**
     * 오래된 온라인 상태 정리 (크론 작업용)
     */
    async cleanupStaleOnlineStatus() {
        const pool = getPool();

        try {
            const [result] = await pool.query(`
                UPDATE user_online_status
                SET is_online = FALSE, status = 'offline'
                WHERE is_online = TRUE
                AND last_heartbeat < DATE_SUB(NOW(), INTERVAL 5 MINUTE)
            `);

            logger.info(`오래된 온라인 상태 정리: ${result.affectedRows}명 오프라인 처리`);

            return {
                success: true,
                affectedRows: result.affectedRows
            };
        } catch (error) {
            logger.error('온라인 상태 정리 실패:', error);
            throw error;
        }
    }

    /**
     * 사용자 온라인 상태 공개 설정 변경
     */
    async updateStatusVisibility(userId, showOnlineStatus) {
        const pool = getPool();

        try {
            await pool.query(`
                UPDATE users
                SET show_online_status = ?
                WHERE id = ?
            `, [showOnlineStatus, userId]);

            logger.info(`온라인 상태 공개 설정 변경: user_id=${userId}, show=${showOnlineStatus}`);

            return { success: true };
        } catch (error) {
            logger.error('상태 공개 설정 변경 실패:', error);
            throw error;
        }
    }
}

export default new OnlineStatusService();
