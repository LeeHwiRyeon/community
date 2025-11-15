// =====================================================
// Notification Service
// Phase 3: Real-time Notification System
// =====================================================

const db = require('../config/database');

class NotificationService {
    constructor() {
        this.io = null; // Socket.io 인스턴스는 나중에 설정
    }

    // Socket.io 인스턴스 설정
    setSocketIO(io) {
        this.io = io;
        console.log('[NotificationService] Socket.io instance set');
    }

    // =====================================================
    // 알림 생성
    // =====================================================

    /**
     * 단일 알림 생성
     */
    async createNotification(data) {
        const { userId, typeName, title, message, link, senderId, metadata } = data;

        try {
            // 타입 ID 조회
            const [typeResult] = await db.query(
                'SELECT id FROM notification_types WHERE type_name = ?',
                [typeName]
            );

            if (!typeResult || typeResult.length === 0) {
                throw new Error(`Invalid notification type: ${typeName}`);
            }

            const typeId = typeResult[0].id;

            // 알림 설정 확인 (사용자가 해당 타입의 알림을 받기를 원하는지)
            const enabledField = `${typeName}_enabled`;
            const [settingsResult] = await db.query(
                `SELECT ${enabledField} as enabled, quiet_hours_enabled, quiet_hours_start, quiet_hours_end 
         FROM notification_settings WHERE user_id = ?`,
                [userId]
            );

            if (settingsResult && settingsResult.length > 0) {
                const settings = settingsResult[0];

                // 해당 타입 알림이 비활성화되어 있으면 생성하지 않음
                if (settings.enabled === false) {
                    console.log(`[NotificationService] Notification type ${typeName} disabled for user ${userId}`);
                    return null;
                }

                // 조용한 시간 체크
                if (settings.quiet_hours_enabled) {
                    const now = new Date();
                    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:00`;

                    if (this.isQuietHour(currentTime, settings.quiet_hours_start, settings.quiet_hours_end)) {
                        console.log(`[NotificationService] Quiet hours active for user ${userId}, notification queued`);
                        // 조용한 시간 동안에는 알림을 생성하지만 실시간 전송은 하지 않음
                    }
                }
            }

            // 알림 생성
            const [result] = await db.query(
                `INSERT INTO notifications 
         (user_id, type_id, title, message, link, sender_id, metadata)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [userId, typeId, title, message, link, senderId, JSON.stringify(metadata || {})]
            );

            const notificationId = result.insertId;

            // 생성된 알림 조회 (전체 정보)
            const [notification] = await db.query(
                `SELECT n.*, nt.type_name, nt.icon, nt.color,
                COALESCE(n.sender_name, u.username) as sender_name,
                COALESCE(n.sender_avatar, u.avatar_url) as sender_avatar
         FROM notifications n
         JOIN notification_types nt ON n.type_id = nt.id
         LEFT JOIN users u ON n.sender_id = u.id
         WHERE n.id = ?`,
                [notificationId]
            );

            if (notification && notification.length > 0) {
                const notificationData = notification[0];

                // 실시간 전송 (Socket.io)
                if (this.io) {
                    this.io.sendNotificationToUser(userId, notificationData);
                }

                return notificationData;
            }

            return null;
        } catch (error) {
            console.error('[NotificationService] Error creating notification:', error);
            throw error;
        }
    }

    /**
     * 대량 알림 생성 (팔로워들에게)
     */
    async notifyFollowers(userId, notification) {
        try {
            const [followers] = await db.query(
                'SELECT follower_id FROM user_follows WHERE following_id = ?',
                [userId]
            );

            const notificationPromises = followers.map(follower =>
                this.createNotification({
                    ...notification,
                    userId: follower.follower_id
                })
            );

            await Promise.all(notificationPromises);
            console.log(`[NotificationService] Notified ${followers.length} followers of user ${userId}`);
        } catch (error) {
            console.error('[NotificationService] Error notifying followers:', error);
            throw error;
        }
    }

    /**
     * 게시판 팔로워에게 알림
     */
    async notifyBoardFollowers(boardId, notification) {
        try {
            const [followers] = await db.query(
                'SELECT user_id FROM board_follows WHERE board_id = ? AND notifications_enabled = TRUE',
                [boardId]
            );

            const notificationPromises = followers.map(follower =>
                this.createNotification({
                    ...notification,
                    userId: follower.user_id
                })
            );

            await Promise.all(notificationPromises);
            console.log(`[NotificationService] Notified ${followers.length} board followers of board ${boardId}`);
        } catch (error) {
            console.error('[NotificationService] Error notifying board followers:', error);
            throw error;
        }
    }

    // =====================================================
    // 알림 조회
    // =====================================================

    /**
     * 알림 목록 조회
     */
    async getNotifications(userId, { page = 1, limit = 20, unreadOnly = false }) {
        try {
            const offset = (page - 1) * limit;

            let query = `
        SELECT n.*, nt.type_name, nt.icon, nt.color,
               COALESCE(n.sender_name, u.username) as sender_name,
               COALESCE(n.sender_avatar, u.avatar_url) as sender_avatar
        FROM notifications n
        JOIN notification_types nt ON n.type_id = nt.id
        LEFT JOIN users u ON n.sender_id = u.id
        WHERE n.user_id = ? AND n.is_deleted = FALSE
      `;

            const params = [userId];

            if (unreadOnly) {
                query += ' AND n.is_read = FALSE';
            }

            query += ' ORDER BY n.created_at DESC LIMIT ? OFFSET ?';
            params.push(limit, offset);

            const [notifications] = await db.query(query, params);

            // 총 개수 조회
            let countQuery = 'SELECT COUNT(*) as total FROM notifications WHERE user_id = ? AND is_deleted = FALSE';
            const countParams = [userId];

            if (unreadOnly) {
                countQuery += ' AND is_read = FALSE';
            }

            const [countResult] = await db.query(countQuery, countParams);
            const total = countResult[0].total;

            return {
                notifications,
                pagination: {
                    total,
                    page,
                    limit,
                    pages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            console.error('[NotificationService] Error fetching notifications:', error);
            throw error;
        }
    }

    /**
     * 읽지 않은 알림 개수
     */
    async getUnreadCount(userId) {
        try {
            const [result] = await db.query(
                'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE AND is_deleted = FALSE',
                [userId]
            );
            return result[0].count;
        } catch (error) {
            console.error('[NotificationService] Error getting unread count:', error);
            throw error;
        }
    }

    // =====================================================
    // 알림 상태 변경
    // =====================================================

    /**
     * 알림 읽음 처리
     */
    async markAsRead(notificationId, userId) {
        try {
            await db.query(
                'UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE id = ? AND user_id = ?',
                [notificationId, userId]
            );
        } catch (error) {
            console.error('[NotificationService] Error marking as read:', error);
            throw error;
        }
    }

    /**
     * 모든 알림 읽음 처리
     */
    async markAllAsRead(userId) {
        try {
            await db.query(
                'UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE user_id = ? AND is_read = FALSE',
                [userId]
            );
        } catch (error) {
            console.error('[NotificationService] Error marking all as read:', error);
            throw error;
        }
    }

    /**
     * 알림 삭제 (소프트 삭제)
     */
    async deleteNotification(notificationId, userId) {
        try {
            await db.query(
                'UPDATE notifications SET is_deleted = TRUE WHERE id = ? AND user_id = ?',
                [notificationId, userId]
            );
        } catch (error) {
            console.error('[NotificationService] Error deleting notification:', error);
            throw error;
        }
    }

    // =====================================================
    // 알림 설정
    // =====================================================

    /**
     * 알림 설정 조회
     */
    async getSettings(userId) {
        try {
            const [settings] = await db.query(
                'SELECT * FROM notification_settings WHERE user_id = ?',
                [userId]
            );

            if (!settings || settings.length === 0) {
                // 설정이 없으면 기본 설정 생성
                await db.query('INSERT INTO notification_settings (user_id) VALUES (?)', [userId]);
                return this.getSettings(userId);
            }

            return settings[0];
        } catch (error) {
            console.error('[NotificationService] Error getting settings:', error);
            throw error;
        }
    }

    /**
     * 알림 설정 업데이트
     */
    async updateSettings(userId, settings) {
        try {
            const fields = Object.keys(settings).map(key => `${key} = ?`).join(', ');
            const values = Object.values(settings);
            values.push(userId);

            await db.query(
                `UPDATE notification_settings SET ${fields} WHERE user_id = ?`,
                values
            );

            return this.getSettings(userId);
        } catch (error) {
            console.error('[NotificationService] Error updating settings:', error);
            throw error;
        }
    }

    // =====================================================
    // 유틸리티 메서드
    // =====================================================

    /**
     * 조용한 시간 체크
     */
    isQuietHour(currentTime, startTime, endTime) {
        if (!startTime || !endTime) return false;

        // 시간 비교 로직 (예: 22:00 ~ 08:00)
        if (startTime > endTime) {
            // 자정을 넘어가는 경우
            return currentTime >= startTime || currentTime <= endTime;
        } else {
            return currentTime >= startTime && currentTime <= endTime;
        }
    }

    /**
     * 알림 통계
     */
    async getStatistics(userId) {
        try {
            const [stats] = await db.query(
                'SELECT * FROM v_notification_stats WHERE user_id = ?',
                [userId]
            );

            return stats[0] || {
                user_id: userId,
                total_notifications: 0,
                unread_count: 0,
                deleted_count: 0
            };
        } catch (error) {
            console.error('[NotificationService] Error getting statistics:', error);
            throw error;
        }
    }
}

module.exports = new NotificationService();
