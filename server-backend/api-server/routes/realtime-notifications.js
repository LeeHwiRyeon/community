const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// 알림 스키마
const notificationSchema = {
    id: String,
    userId: String,
    type: String, // 'message', 'mention', 'like', 'comment', 'follow', 'system', 'announcement'
    title: String,
    content: String,
    data: Object, // 추가 데이터 (링크, 이미지 등)
    isRead: Boolean,
    isPinned: Boolean,
    priority: String, // 'low', 'normal', 'high', 'urgent'
    category: String, // 'social', 'system', 'marketing', 'security'
    expiresAt: Date,
    createdAt: Date,
    updatedAt: Date
};

// 알림 설정 스키마
const notificationSettingsSchema = {
    userId: String,
    email: {
        enabled: Boolean,
        message: Boolean,
        mention: Boolean,
        like: Boolean,
        comment: Boolean,
        follow: Boolean,
        system: Boolean,
        marketing: Boolean
    },
    push: {
        enabled: Boolean,
        message: Boolean,
        mention: Boolean,
        like: Boolean,
        comment: Boolean,
        follow: Boolean,
        system: Boolean,
        marketing: Boolean
    },
    inApp: {
        enabled: Boolean,
        message: Boolean,
        mention: Boolean,
        like: Boolean,
        comment: Boolean,
        follow: Boolean,
        system: Boolean,
        marketing: Boolean
    },
    quietHours: {
        enabled: Boolean,
        start: String, // "22:00"
        end: String, // "08:00"
        timezone: String
    },
    frequency: String, // 'instant', 'hourly', 'daily', 'weekly'
    createdAt: Date,
    updatedAt: Date
};

// 임시 저장소 (실제로는 데이터베이스 사용)
let notificationStore = new Map();
let notificationSettingsStore = new Map();
let notificationIdCounter = 1;

// 미들웨어: 인증 확인
const authenticateUser = (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ success: false, message: '인증이 필요합니다.' });
    }
    // 실제로는 JWT 토큰 검증
    req.user = { id: 'user1', role: 'admin' };
    next();
};

// 알림 생성
const createNotification = async (notificationData) => {
    const {
        userId,
        type,
        title,
        content,
        data = {},
        priority = 'normal',
        category = 'social',
        expiresAt
    } = notificationData;

    const notification = {
        id: `notification_${notificationIdCounter++}`,
        userId,
        type,
        title,
        content,
        data,
        isRead: false,
        isPinned: false,
        priority,
        category,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        createdAt: new Date(),
        updatedAt: new Date()
    };

    notificationStore.set(notification.id, notification);

    // 실시간 알림 전송 (Socket.IO)
    if (global.io) {
        global.io.to(`user_${userId}`).emit('new_notification', notification);
    }

    // 푸시 알림 전송
    await sendPushNotification(userId, notification);

    // 이메일 알림 전송 (설정에 따라)
    const settings = notificationSettingsStore.get(userId);
    if (settings?.email.enabled && settings.email[type]) {
        await sendEmailNotification(userId, notification);
    }

    return notification;
};

// 사용자 알림 목록 조회
router.get('/', authenticateUser, async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            type,
            category,
            isRead,
            priority,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        let notifications = Array.from(notificationStore.values())
            .filter(notification => notification.userId === req.user.id);

        // 필터링
        if (type) notifications = notifications.filter(n => n.type === type);
        if (category) notifications = notifications.filter(n => n.category === category);
        if (isRead !== undefined) notifications = notifications.filter(n => n.isRead === (isRead === 'true'));
        if (priority) notifications = notifications.filter(n => n.priority === priority);

        // 정렬
        notifications.sort((a, b) => {
            const aVal = a[sortBy];
            const bVal = b[sortBy];
            if (sortOrder === 'asc') {
                return aVal > bVal ? 1 : -1;
            } else {
                return aVal < bVal ? 1 : -1;
            }
        });

        // 페이지네이션
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + parseInt(limit);
        const paginatedNotifications = notifications.slice(startIndex, endIndex);

        // 읽지 않은 알림 수
        const unreadCount = notifications.filter(n => !n.isRead).length;

        res.json({
            success: true,
            data: {
                notifications: paginatedNotifications,
                unreadCount,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: notifications.length,
                    pages: Math.ceil(notifications.length / limit)
                }
            }
        });
    } catch (error) {
        console.error('알림 목록 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '알림 목록 조회 중 오류가 발생했습니다.'
        });
    }
});

// 알림 읽음 처리
router.patch('/:id/read', authenticateUser, async (req, res) => {
    try {
        const { id } = req.params;
        const notification = notificationStore.get(id);

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: '알림을 찾을 수 없습니다.'
            });
        }

        if (notification.userId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: '알림 읽기 권한이 없습니다.'
            });
        }

        notification.isRead = true;
        notification.updatedAt = new Date();
        notificationStore.set(id, notification);

        res.json({
            success: true,
            message: '알림이 읽음 처리되었습니다.',
            data: notification
        });
    } catch (error) {
        console.error('알림 읽음 처리 오류:', error);
        res.status(500).json({
            success: false,
            message: '알림 읽음 처리 중 오류가 발생했습니다.'
        });
    }
});

// 모든 알림 읽음 처리
router.patch('/read-all', authenticateUser, async (req, res) => {
    try {
        const notifications = Array.from(notificationStore.values())
            .filter(notification => notification.userId === req.user.id && !notification.isRead);

        notifications.forEach(notification => {
            notification.isRead = true;
            notification.updatedAt = new Date();
            notificationStore.set(notification.id, notification);
        });

        res.json({
            success: true,
            message: `${notifications.length}개의 알림이 읽음 처리되었습니다.`
        });
    } catch (error) {
        console.error('전체 알림 읽음 처리 오류:', error);
        res.status(500).json({
            success: false,
            message: '전체 알림 읽음 처리 중 오류가 발생했습니다.'
        });
    }
});

// 알림 삭제
router.delete('/:id', authenticateUser, async (req, res) => {
    try {
        const { id } = req.params;
        const notification = notificationStore.get(id);

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: '알림을 찾을 수 없습니다.'
            });
        }

        if (notification.userId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: '알림 삭제 권한이 없습니다.'
            });
        }

        notificationStore.delete(id);

        res.json({
            success: true,
            message: '알림이 삭제되었습니다.'
        });
    } catch (error) {
        console.error('알림 삭제 오류:', error);
        res.status(500).json({
            success: false,
            message: '알림 삭제 중 오류가 발생했습니다.'
        });
    }
});

// 알림 고정/고정 해제
router.patch('/:id/pin', authenticateUser, async (req, res) => {
    try {
        const { id } = req.params;
        const { pinned } = req.body;
        const notification = notificationStore.get(id);

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: '알림을 찾을 수 없습니다.'
            });
        }

        if (notification.userId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: '알림 고정 권한이 없습니다.'
            });
        }

        notification.isPinned = pinned;
        notification.updatedAt = new Date();
        notificationStore.set(id, notification);

        res.json({
            success: true,
            message: `알림이 ${pinned ? '고정' : '고정 해제'}되었습니다.`,
            data: notification
        });
    } catch (error) {
        console.error('알림 고정 처리 오류:', error);
        res.status(500).json({
            success: false,
            message: '알림 고정 처리 중 오류가 발생했습니다.'
        });
    }
});

// 알림 설정 조회
router.get('/settings', authenticateUser, async (req, res) => {
    try {
        const settings = notificationSettingsStore.get(req.user.id) || getDefaultNotificationSettings(req.user.id);

        res.json({
            success: true,
            data: settings
        });
    } catch (error) {
        console.error('알림 설정 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '알림 설정 조회 중 오류가 발생했습니다.'
        });
    }
});

// 알림 설정 업데이트
router.put('/settings', authenticateUser, async (req, res) => {
    try {
        const settings = {
            ...req.body,
            userId: req.user.id,
            updatedAt: new Date()
        };

        notificationSettingsStore.set(req.user.id, settings);

        res.json({
            success: true,
            message: '알림 설정이 업데이트되었습니다.',
            data: settings
        });
    } catch (error) {
        console.error('알림 설정 업데이트 오류:', error);
        res.status(500).json({
            success: false,
            message: '알림 설정 업데이트 중 오류가 발생했습니다.'
        });
    }
});

// 알림 통계
router.get('/stats', authenticateUser, async (req, res) => {
    try {
        const notifications = Array.from(notificationStore.values())
            .filter(notification => notification.userId === req.user.id);

        const stats = {
            total: notifications.length,
            unread: notifications.filter(n => !n.isRead).length,
            read: notifications.filter(n => n.isRead).length,
            pinned: notifications.filter(n => n.isPinned).length,
            byType: notifications.reduce((acc, n) => {
                acc[n.type] = (acc[n.type] || 0) + 1;
                return acc;
            }, {}),
            byPriority: notifications.reduce((acc, n) => {
                acc[n.priority] = (acc[n.priority] || 0) + 1;
                return acc;
            }, {}),
            byCategory: notifications.reduce((acc, n) => {
                acc[n.category] = (acc[n.category] || 0) + 1;
                return acc;
            }, {}),
            recentActivity: notifications
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .slice(0, 10)
        };

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('알림 통계 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '알림 통계 조회 중 오류가 발생했습니다.'
        });
    }
});

// 시스템 알림 전송
router.post('/system', async (req, res) => {
    try {
        const {
            userIds,
            type,
            title,
            content,
            data = {},
            priority = 'normal',
            category = 'system'
        } = req.body;

        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: '사용자 ID 목록이 필요합니다.'
            });
        }

        const notifications = [];
        for (const userId of userIds) {
            const notification = await createNotification({
                userId,
                type,
                title,
                content,
                data,
                priority,
                category
            });
            notifications.push(notification);
        }

        res.json({
            success: true,
            message: `${notifications.length}명에게 알림이 전송되었습니다.`,
            data: notifications
        });
    } catch (error) {
        console.error('시스템 알림 전송 오류:', error);
        res.status(500).json({
            success: false,
            message: '시스템 알림 전송 중 오류가 발생했습니다.'
        });
    }
});

// 헬퍼 함수들
function getDefaultNotificationSettings(userId) {
    return {
        userId,
        email: {
            enabled: true,
            message: true,
            mention: true,
            like: false,
            comment: true,
            follow: true,
            system: true,
            marketing: false
        },
        push: {
            enabled: true,
            message: true,
            mention: true,
            like: false,
            comment: true,
            follow: true,
            system: true,
            marketing: false
        },
        inApp: {
            enabled: true,
            message: true,
            mention: true,
            like: true,
            comment: true,
            follow: true,
            system: true,
            marketing: true
        },
        quietHours: {
            enabled: false,
            start: "22:00",
            end: "08:00",
            timezone: "Asia/Seoul"
        },
        frequency: 'instant',
        createdAt: new Date(),
        updatedAt: new Date()
    };
}

async function sendPushNotification(userId, notification) {
    // 실제로는 FCM, APNS 등을 사용
    console.log(`푸시 알림 전송: ${userId} - ${notification.title}`);
}

async function sendEmailNotification(userId, notification) {
    // 실제로는 이메일 서비스 사용
    console.log(`이메일 알림 전송: ${userId} - ${notification.title}`);
}

module.exports = { router, createNotification };
