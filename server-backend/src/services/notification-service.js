/**
 * Notification Service
 * 알림 생성, 조회, 읽음 처리, 삭제 등을 관리하는 서비스
 * Redis Pub/Sub를 통한 실시간 알림 전송 지원
 * 
 * @author AUTOAGENTS
 * @date 2025-11-11
 * @version 2.0
 */

import { getPool } from '../db.js';
import logger from '../logger.js';
import { getRedisClient } from '../redis.js';

class NotificationService {
    constructor() {
        this.getDb = () => getPool();
        this.redisClient = null;
        this.isRedisEnabled = false;

        // Redis 초기화
        this.initializeRedis();
    }

    /**
     * Redis 클라이언트 초기화
     */
    async initializeRedis() {
        try {
            this.redisClient = await getRedisClient();
            if (this.redisClient) {
                this.isRedisEnabled = true;
                logger.info('NotificationService: Redis Pub/Sub enabled');
            }
        } catch (error) {
            logger.warn('NotificationService: Redis Pub/Sub disabled:', error.message);
            this.isRedisEnabled = false;
        }
    }

    /**
     * Redis Pub/Sub를 통해 실시간 알림 발행
     * @param {Object} notification - 알림 데이터
     */
    async publishNotification(notification) {
        if (!this.isRedisEnabled || !this.redisClient) {
            logger.debug('Redis not available, skipping real-time notification');
            return;
        }

        try {
            const channel = `notification:user:${notification.user_id}`;
            await this.redisClient.publish(channel, JSON.stringify(notification));

            // 글로벌 알림 채널에도 발행 (모니터링용)
            await this.redisClient.publish('notification:all', JSON.stringify(notification));

            logger.debug(`Published notification to Redis channel: ${channel}`);
        } catch (error) {
            logger.error('Error publishing notification to Redis:', error);
        }
    }

    /**
     * 알림 생성
     * @param {Object} notification - 알림 정보
     * @param {number} notification.userId - 수신자 ID
     * @param {string} notification.type - 알림 타입 (comment, like, mention, follow, reply, system)
     * @param {string} notification.title - 알림 제목
     * @param {string} notification.message - 알림 메시지
     * @param {string} notification.link - 알림 링크 (선택)
     * @returns {Promise<Object>} 생성된 알림
     */
    async createNotification({ userId, type, title, message, link = null }) {
        const db = this.getDb();
        try {
            // 알림 설정 확인
            const settings = await this.getNotificationSettings(userId);
            const enableKey = `enable_${type}`;

            if (settings && !settings[enableKey]) {
                logger.info(`Notification disabled for user ${userId}, type ${type}`);
                return null;
            }

            const query = `
        INSERT INTO notifications (user_id, type, title, message, link)
        VALUES (?, ?, ?, ?, ?)
      `;

            const [result] = await db.execute(query, [userId, type, title, message, link]);

            // 생성된 알림 조회
            const notification = await this.getNotificationById(result.insertId);

            logger.info(`Notification created: ID ${result.insertId} for user ${userId}`);

            // Redis Pub/Sub를 통한 실시간 알림 발행
            await this.publishNotification(notification);

            return notification;
        } catch (error) {
            logger.error('Error creating notification:', error);
            throw error;
        }
    }

    /**
     * 특정 알림 조회
     * @param {number} id - 알림 ID
     * @returns {Promise<Object>} 알림 정보
     */
    async getNotificationById(id) {
        const db = this.getDb();
        try {
            const query = 'SELECT * FROM notifications WHERE id = ?';
            const [rows] = await db.execute(query, [id]);
            return rows[0] || null;
        } catch (error) {
            logger.error('Error getting notification by id:', error);
            throw error;
        }
    }

    /**
     * 사용자의 알림 목록 조회
     * @param {number} userId - 사용자 ID
     * @param {Object} options - 조회 옵션
     * @param {number} options.page - 페이지 번호 (기본: 1)
     * @param {number} options.limit - 페이지당 개수 (기본: 20)
     * @param {boolean} options.unreadOnly - 읽지 않은 것만 조회 (기본: false)
     * @returns {Promise<Array>} 알림 목록
     */
    async getNotifications(userId, { page = 1, limit = 20, unreadOnly = false } = {}) {
        const db = this.getDb();
        try {
            const offset = (page - 1) * limit;

            let query = `
        SELECT * FROM notifications 
        WHERE user_id = ?
      `;

            const params = [userId];

            if (unreadOnly) {
                query += ' AND is_read = FALSE';
            }

            query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
            params.push(limit, offset);

            const [rows] = await db.execute(query, params);

            return rows;
        } catch (error) {
            logger.error('Error getting notifications:', error);
            throw error;
        }
    }

    /**
     * 읽지 않은 알림 개수 조회
     * @param {number} userId - 사용자 ID
     * @returns {Promise<number>} 읽지 않은 알림 수
     */
    async getUnreadCount(userId) {
        const db = this.getDb();
        try {
            const query = `
        SELECT COUNT(*) as count 
        FROM notifications 
        WHERE user_id = ? AND is_read = FALSE
      `;

            const [rows] = await db.execute(query, [userId]);

            return rows[0].count;
        } catch (error) {
            logger.error('Error getting unread count:', error);
            throw error;
        }
    }

    /**
     * 알림을 읽음으로 표시
     * @param {number} notificationId - 알림 ID
     * @param {number} userId - 사용자 ID
     * @returns {Promise<boolean>} 성공 여부
     */
    async markAsRead(notificationId, userId) {
        const db = this.getDb();
        try {
            const query = `
        UPDATE notifications 
        SET is_read = TRUE, read_at = NOW()
        WHERE id = ? AND user_id = ?
      `;

            const [result] = await db.execute(query, [notificationId, userId]);

            return result.affectedRows > 0;
        } catch (error) {
            logger.error('Error marking notification as read:', error);
            throw error;
        }
    }

    /**
     * 모든 알림 읽음 처리
     * @param {number} userId - 사용자 ID
     * @returns {Promise<number>} 업데이트된 알림 개수
     */
    async markAllAsRead(userId) {
        const db = this.getDb();
        try {
            const query = `
        UPDATE notifications 
        SET is_read = TRUE, read_at = NOW()
        WHERE user_id = ? AND is_read = FALSE
      `;

            const [result] = await db.execute(query, [userId]);

            logger.info(`Marked ${result.affectedRows} notifications as read for user ${userId}`);

            return result.affectedRows;
        } catch (error) {
            logger.error('Error marking all notifications as read:', error);
            throw error;
        }
    }

    /**
     * 알림 삭제
     * @param {number} notificationId - 알림 ID
     * @param {number} userId - 사용자 ID
     * @returns {Promise<boolean>} 성공 여부
     */
    async deleteNotification(notificationId, userId) {
        const db = this.getDb();
        try {
            const query = 'DELETE FROM notifications WHERE id = ? AND user_id = ?';
            const [result] = await db.execute(query, [notificationId, userId]);

            return result.affectedRows > 0;
        } catch (error) {
            logger.error('Error deleting notification:', error);
            throw error;
        }
    }

    /**
     * 오래된 알림 삭제 (30일 이상)
     * @returns {Promise<number>} 삭제된 알림 수
     */
    async deleteOldNotifications() {
        const db = this.getDb();
        try {
            const query = `
        DELETE FROM notifications 
        WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY)
      `;

            const [result] = await db.execute(query);

            logger.info(`Deleted ${result.affectedRows} old notifications`);

            return result.affectedRows;
        } catch (error) {
            logger.error('Error deleting old notifications:', error);
            throw error;
        }
    }

    /**
     * 사용자의 알림 설정 조회
     * @param {number} userId - 사용자 ID
     * @returns {Promise<Object>} 알림 설정
     */
    async getNotificationSettings(userId) {
        const db = this.getDb();
        try {
            const query = 'SELECT * FROM notification_settings WHERE user_id = ?';
            const [rows] = await db.execute(query, [userId]);

            // 설정이 없으면 기본 설정 생성
            if (rows.length === 0) {
                await this.createDefaultSettings(userId);
                return await this.getNotificationSettings(userId);
            }

            return rows[0];
        } catch (error) {
            logger.error('Error getting notification settings:', error);
            throw error;
        }
    }

    /**
     * 기본 알림 설정 생성
     * @param {number} userId - 사용자 ID
     * @returns {Promise<Object>} 생성된 설정
     */
    async createDefaultSettings(userId) {
        try {
            const query = 'INSERT INTO notification_settings (user_id) VALUES (?)';
            await db.execute(query, [userId]);

            logger.info(`Created default notification settings for user ${userId}`);
        } catch (error) {
            logger.error('Error creating default settings:', error);
            throw error;
        }
    }

    /**
     * 알림 설정 업데이트
     * @param {number} userId - 사용자 ID
     * @param {Object} settings - 업데이트할 설정
     * @returns {Promise<Object>} 업데이트된 설정
     */
    async updateNotificationSettings(userId, settings) {
        const db = this.getDb();
        try {
            const allowedFields = [
                'enable_comment',
                'enable_like',
                'enable_mention',
                'enable_follow',
                'enable_reply',
                'enable_system',
                'enable_push'
            ];

            const updates = [];
            const values = [];

            for (const [key, value] of Object.entries(settings)) {
                if (allowedFields.includes(key)) {
                    updates.push(`${key} = ?`);
                    values.push(value);
                }
            }

            if (updates.length === 0) {
                throw new Error('No valid settings to update');
            }

            values.push(userId);

            const query = `
        UPDATE notification_settings 
        SET ${updates.join(', ')}
        WHERE user_id = ?
      `;

            await db.execute(query, values);

            return await this.getNotificationSettings(userId);
        } catch (error) {
            logger.error('Error updating notification settings:', error);
            throw error;
        }
    }

    /**
     * 댓글 알림 생성
     */
    async notifyComment(postAuthorId, commenterName, postTitle, postId) {
        return await this.createNotification({
            userId: postAuthorId,
            type: 'comment',
            title: '새로운 댓글',
            message: `${commenterName}님이 "${postTitle}" 게시물에 댓글을 남겼습니다.`,
            link: `/posts/${postId}`
        });
    }

    /**
     * 좋아요 알림 생성
     */
    async notifyLike(postAuthorId, likerName, postTitle, postId) {
        return await this.createNotification({
            userId: postAuthorId,
            type: 'like',
            title: '좋아요',
            message: `${likerName}님이 "${postTitle}" 게시물을 좋아합니다.`,
            link: `/posts/${postId}`
        });
    }

    /**
     * 멘션 알림 생성
     */
    async notifyMention(mentionedUserId, mentionerName, content, postId) {
        return await this.createNotification({
            userId: mentionedUserId,
            type: 'mention',
            title: '멘션',
            message: `${mentionerName}님이 회원님을 언급했습니다: "${content}"`,
            link: `/posts/${postId}`
        });
    }

    /**
     * 팔로우 알림 생성
     */
    async notifyFollow(followedUserId, followerName) {
        return await this.createNotification({
            userId: followedUserId,
            type: 'follow',
            title: '새 팔로워',
            message: `${followerName}님이 회원님을 팔로우하기 시작했습니다.`,
            link: `/profile/${followerName}`
        });
    }

    /**
     * 답글 알림 생성
     */
    async notifyReply(commentAuthorId, replierName, postTitle, postId) {
        return await this.createNotification({
            userId: commentAuthorId,
            type: 'reply',
            title: '새로운 답글',
            message: `${replierName}님이 회원님의 댓글에 답글을 남겼습니다.`,
            link: `/posts/${postId}`
        });
    }

    /**
     * 시스템 알림 생성
     */
    async notifySystem(userId, title, message, link = null) {
        return await this.createNotification({
            userId,
            type: 'system',
            title,
            message,
            link
        });
    }
}

const notificationService = new NotificationService();
export default notificationService;
