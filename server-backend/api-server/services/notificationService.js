const mysql = require('mysql2/promise');
const { EventEmitter } = require('events');

class NotificationService extends EventEmitter {
    constructor(dbConnection) {
        super();
        this.db = dbConnection;
        this.activeConnections = new Map(); // userId -> socket connection
    }

    // 알림 생성
    async createNotification(notificationData) {
        const {
            userId,
            type, // 'post_like', 'comment', 'mention', 'system', 'chat'
            title,
            message,
            data = {},
            priority = 'normal', // 'low', 'normal', 'high', 'urgent'
            expiresAt = null,
        } = notificationData;

        try {
            const [result] = await this.db.execute(`
        INSERT INTO notifications (
          user_id, type, title, message, data, priority, expires_at, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
      `, [
                userId,
                type,
                title,
                message,
                JSON.stringify(data),
                priority,
                expiresAt,
            ]);

            const notificationId = result.insertId;

            // 실시간 알림 전송
            await this.sendRealtimeNotification(userId, {
                id: notificationId,
                type,
                title,
                message,
                data,
                priority,
                createdAt: new Date(),
                isRead: false,
            });

            // 이벤트 발생
            this.emit('notificationCreated', {
                id: notificationId,
                userId,
                type,
                title,
                message,
                data,
                priority,
            });

            return {
                success: true,
                notificationId,
            };
        } catch (error) {
            console.error('알림 생성 실패:', error);
            throw error;
        }
    }

    // 실시간 알림 전송
    async sendRealtimeNotification(userId, notification) {
        const connection = this.activeConnections.get(userId);

        if (connection) {
            try {
                connection.emit('notification', notification);
                return true;
            } catch (error) {
                console.error('실시간 알림 전송 실패:', error);
                return false;
            }
        }

        return false;
    }

    // 사용자 연결 등록
    registerConnection(userId, socket) {
        this.activeConnections.set(userId, socket);

        socket.on('disconnect', () => {
            this.activeConnections.delete(userId);
        });
    }

    // 알림 목록 조회
    async getNotifications(userId, options = {}) {
        const {
            limit = 20,
            offset = 0,
            type = null,
            isRead = null,
            priority = null,
        } = options;

        try {
            let query = `
        SELECT 
          id, type, title, message, data, priority, is_read, created_at, expires_at
        FROM notifications
        WHERE user_id = ? AND (expires_at IS NULL OR expires_at > NOW())
      `;

            const params = [userId];

            if (type) {
                query += ' AND type = ?';
                params.push(type);
            }

            if (isRead !== null) {
                query += ' AND is_read = ?';
                params.push(isRead);
            }

            if (priority) {
                query += ' AND priority = ?';
                params.push(priority);
            }

            query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
            params.push(limit, offset);

            const [notifications] = await this.db.execute(query, params);

            // 데이터 파싱
            const parsedNotifications = notifications.map(notification => ({
                ...notification,
                data: JSON.parse(notification.data || '{}'),
            }));

            return {
                success: true,
                data: parsedNotifications,
            };
        } catch (error) {
            console.error('알림 목록 조회 실패:', error);
            throw error;
        }
    }

    // 알림 읽음 처리
    async markAsRead(notificationId, userId) {
        try {
            await this.db.execute(`
        UPDATE notifications 
        SET is_read = 1, read_at = NOW()
        WHERE id = ? AND user_id = ?
      `, [notificationId, userId]);

            return { success: true };
        } catch (error) {
            console.error('알림 읽음 처리 실패:', error);
            throw error;
        }
    }

    // 모든 알림 읽음 처리
    async markAllAsRead(userId) {
        try {
            await this.db.execute(`
        UPDATE notifications 
        SET is_read = 1, read_at = NOW()
        WHERE user_id = ? AND is_read = 0
      `, [userId]);

            return { success: true };
        } catch (error) {
            console.error('모든 알림 읽음 처리 실패:', error);
            throw error;
        }
    }

    // 알림 삭제
    async deleteNotification(notificationId, userId) {
        try {
            await this.db.execute(`
        DELETE FROM notifications 
        WHERE id = ? AND user_id = ?
      `, [notificationId, userId]);

            return { success: true };
        } catch (error) {
            console.error('알림 삭제 실패:', error);
            throw error;
        }
    }

    // 읽지 않은 알림 수 조회
    async getUnreadCount(userId) {
        try {
            const [result] = await this.db.execute(`
        SELECT COUNT(*) as count
        FROM notifications
        WHERE user_id = ? AND is_read = 0 AND (expires_at IS NULL OR expires_at > NOW())
      `, [userId]);

            return result[0].count;
        } catch (error) {
            console.error('읽지 않은 알림 수 조회 실패:', error);
            return 0;
        }
    }

    // 알림 설정 조회
    async getNotificationSettings(userId) {
        try {
            const [result] = await this.db.execute(`
        SELECT settings
        FROM user_notification_settings
        WHERE user_id = ?
      `, [userId]);

            if (result.length > 0) {
                return JSON.parse(result[0].settings);
            }

            // 기본 설정 반환
            return {
                email: true,
                push: true,
                inApp: true,
                types: {
                    post_like: true,
                    comment: true,
                    mention: true,
                    system: true,
                    chat: true,
                },
            };
        } catch (error) {
            console.error('알림 설정 조회 실패:', error);
            return null;
        }
    }

    // 알림 설정 업데이트
    async updateNotificationSettings(userId, settings) {
        try {
            await this.db.execute(`
        INSERT INTO user_notification_settings (user_id, settings, updated_at)
        VALUES (?, ?, NOW())
        ON DUPLICATE KEY UPDATE
        settings = VALUES(settings),
        updated_at = NOW()
      `, [userId, JSON.stringify(settings)]);

            return { success: true };
        } catch (error) {
            console.error('알림 설정 업데이트 실패:', error);
            throw error;
        }
    }

    // 이메일 알림 전송
    async sendEmailNotification(userId, notification) {
        try {
            // 사용자 이메일 조회
            const [users] = await this.db.execute(`
        SELECT email, username
        FROM users
        WHERE id = ? AND status = 'active'
      `, [userId]);

            if (users.length === 0) {
                return { success: false, message: '사용자를 찾을 수 없습니다.' };
            }

            const user = users[0];

            // 이메일 전송 로직 (실제 구현에서는 이메일 서비스 사용)
            console.log(`이메일 알림 전송: ${user.email} - ${notification.title}`);

            // TODO: 실제 이메일 전송 구현
            // await emailService.send({
            //   to: user.email,
            //   subject: notification.title,
            //   html: this.generateEmailTemplate(notification, user),
            // });

            return { success: true };
        } catch (error) {
            console.error('이메일 알림 전송 실패:', error);
            throw error;
        }
    }

    // 푸시 알림 전송
    async sendPushNotification(userId, notification) {
        try {
            // 사용자 디바이스 토큰 조회
            const [devices] = await this.db.execute(`
        SELECT device_token, platform
        FROM user_devices
        WHERE user_id = ? AND is_active = 1
      `, [userId]);

            if (devices.length === 0) {
                return { success: false, message: '등록된 디바이스가 없습니다.' };
            }

            // 푸시 알림 전송 (실제 구현에서는 FCM, APNS 등 사용)
            for (const device of devices) {
                console.log(`푸시 알림 전송: ${device.device_token} - ${notification.title}`);

                // TODO: 실제 푸시 알림 전송 구현
                // await pushService.send({
                //   token: device.device_token,
                //   platform: device.platform,
                //   title: notification.title,
                //   body: notification.message,
                //   data: notification.data,
                // });
            }

            return { success: true };
        } catch (error) {
            console.error('푸시 알림 전송 실패:', error);
            throw error;
        }
    }

    // 알림 템플릿 생성
    generateNotificationTemplate(type, data) {
        const templates = {
            post_like: {
                title: '게시글에 좋아요가 달렸습니다',
                message: `${data.author}님이 "${data.postTitle}"에 좋아요를 눌렀습니다.`,
            },
            comment: {
                title: '새로운 댓글이 달렸습니다',
                message: `${data.author}님이 "${data.postTitle}"에 댓글을 남겼습니다.`,
            },
            mention: {
                title: '댓글에서 언급되었습니다',
                message: `${data.author}님이 댓글에서 당신을 언급했습니다.`,
            },
            system: {
                title: data.title || '시스템 알림',
                message: data.message || '새로운 시스템 알림이 있습니다.',
            },
            chat: {
                title: '새로운 채팅 메시지',
                message: `${data.author}님이 "${data.roomName}"에서 메시지를 보냈습니다.`,
            },
        };

        return templates[type] || {
            title: '알림',
            message: '새로운 알림이 있습니다.',
        };
    }

    // 이메일 템플릿 생성
    generateEmailTemplate(notification, user) {
        return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>${notification.title}</h2>
        <p>안녕하세요, ${user.username}님!</p>
        <p>${notification.message}</p>
        <p>자세한 내용은 커뮤니티 사이트에서 확인하세요.</p>
        <hr>
        <p style="color: #666; font-size: 12px;">
          이 알림을 받지 않으려면 알림 설정을 변경하세요.
        </p>
      </div>
    `;
    }

    // 만료된 알림 정리
    async cleanupExpiredNotifications() {
        try {
            const [result] = await this.db.execute(`
        DELETE FROM notifications
        WHERE expires_at IS NOT NULL AND expires_at < NOW()
      `);

            console.log(`만료된 알림 ${result.affectedRows}개 정리 완료`);
            return result.affectedRows;
        } catch (error) {
            console.error('만료된 알림 정리 실패:', error);
            return 0;
        }
    }

    // 알림 통계
    async getNotificationStats(userId) {
        try {
            const [stats] = await this.db.execute(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END) as unread,
          SUM(CASE WHEN priority = 'urgent' THEN 1 ELSE 0 END) as urgent,
          SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 ELSE 0 END) as today
        FROM notifications
        WHERE user_id = ? AND (expires_at IS NULL OR expires_at > NOW())
      `, [userId]);

            return stats[0];
        } catch (error) {
            console.error('알림 통계 조회 실패:', error);
            return null;
        }
    }
}

module.exports = NotificationService;
