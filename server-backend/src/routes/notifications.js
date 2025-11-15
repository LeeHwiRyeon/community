/**
 * Notification Routes
 * 알림 관련 API 엔드포인트 (업데이트: WebSocket 통합)
 * 
 * @author AUTOAGENTS
 * @date 2025-11-09
 */

import express from 'express';
import { body, validationResult } from 'express-validator';
import notificationService from '../services/notification-service.js';
import notificationSocket from '../sockets/notification-socket.js';
import { authenticateToken } from '../auth/jwt.js';
import logger from '../logger.js';

const router = express.Router();

/**
 * GET /api/notifications
 * 알림 목록 조회
 */
router.get('/', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { page = 1, limit = 20, unreadOnly = false } = req.query;

        const notifications = await notificationService.getNotifications(userId, {
            page: parseInt(page),
            limit: parseInt(limit),
            unreadOnly: unreadOnly === 'true'
        });

        res.json({
            success: true,
            data: notifications,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        logger.error('Error fetching notifications:', error);
        res.status(500).json({
            success: false,
            message: '알림 조회 중 오류가 발생했습니다.'
        });
    }
});

/**
 * GET /api/notifications/count
 * 읽지 않은 알림 개수 조회
 */
router.get('/count', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const count = await notificationService.getUnreadCount(userId);

        res.json({
            success: true,
            count
        });
    } catch (error) {
        logger.error('Error fetching unread count:', error);
        res.status(500).json({
            success: false,
            message: '알림 개수 조회 중 오류가 발생했습니다.'
        });
    }
});

/**
 * GET /api/notifications/:id
 * 특정 알림 조회
 */
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const notificationId = req.params.id;
        const userId = req.user.userId;

        const notification = await notificationService.getNotificationById(notificationId);

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: '알림을 찾을 수 없습니다.'
            });
        }

        // 권한 확인
        if (notification.user_id !== userId) {
            return res.status(403).json({
                success: false,
                message: '알림에 접근할 권한이 없습니다.'
            });
        }

        res.json({
            success: true,
            data: notification
        });
    } catch (error) {
        logger.error('Error fetching notification:', error);
        res.status(500).json({
            success: false,
            message: '알림 조회 중 오류가 발생했습니다.'
        });
    }
});

/**
 * PUT /api/notifications/:id/read
 * 알림 읽음 처리
 */
router.put('/:id/read', authenticateToken, async (req, res) => {
    try {
        const notificationId = req.params.id;
        const userId = req.user.userId;

        const success = await notificationService.markAsRead(notificationId, userId);

        if (!success) {
            return res.status(404).json({
                success: false,
                message: '알림을 찾을 수 없습니다.'
            });
        }

        // 읽지 않은 알림 개수 업데이트
        const unreadCount = await notificationService.getUnreadCount(userId);
        notificationSocket.updateUnreadCount(userId, unreadCount);

        res.json({
            success: true,
            message: '알림을 읽음 처리했습니다.'
        });
    } catch (error) {
        logger.error('Error marking notification as read:', error);
        res.status(500).json({
            success: false,
            message: '알림 읽음 처리 중 오류가 발생했습니다.'
        });
    }
});

/**
 * PUT /api/notifications/read-all
 * 모든 알림 읽음 처리
 */
router.put('/read-all', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const count = await notificationService.markAllAsRead(userId);

        // 읽지 않은 알림 개수 업데이트
        notificationSocket.updateUnreadCount(userId, 0);

        res.json({
            success: true,
            message: `${count}개의 알림을 읽음 처리했습니다.`,
            count
        });
    } catch (error) {
        logger.error('Error marking all notifications as read:', error);
        res.status(500).json({
            success: false,
            message: '알림 읽음 처리 중 오류가 발생했습니다.'
        });
    }
});

/**
 * DELETE /api/notifications/:id
 * 알림 삭제
 */
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const notificationId = req.params.id;
        const userId = req.user.userId;

        const success = await notificationService.deleteNotification(notificationId, userId);

        if (!success) {
            return res.status(404).json({
                success: false,
                message: '알림을 찾을 수 없습니다.'
            });
        }

        res.json({
            success: true,
            message: '알림을 삭제했습니다.'
        });
    } catch (error) {
        logger.error('Error deleting notification:', error);
        res.status(500).json({
            success: false,
            message: '알림 삭제 중 오류가 발생했습니다.'
        });
    }
});

/**
 * GET /api/notifications/settings
 * 알림 설정 조회
 */
router.get('/settings/me', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const settings = await notificationService.getNotificationSettings(userId);

        res.json({
            success: true,
            data: settings
        });
    } catch (error) {
        logger.error('Error fetching notification settings:', error);
        res.status(500).json({
            success: false,
            message: '알림 설정 조회 중 오류가 발생했습니다.'
        });
    }
});

/**
 * PUT /api/notifications/settings
 * 알림 설정 업데이트
 */
router.put('/settings/me', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const settings = req.body;

        const updatedSettings = await notificationService.updateNotificationSettings(
            userId,
            settings
        );

        res.json({
            success: true,
            message: '알림 설정을 업데이트했습니다.',
            data: updatedSettings
        });
    } catch (error) {
        logger.error('Error updating notification settings:', error);
        res.status(500).json({
            success: false,
            message: '알림 설정 업데이트 중 오류가 발생했습니다.'
        });
    }
});

/**
 * POST /api/notifications/test
 * 테스트 알림 전송 (개발용)
 */
if (process.env.NODE_ENV === 'development') {
    router.post('/test', authenticateToken, async (req, res) => {
        try {
            const userId = req.user.userId;
            const { type = 'system', title, message } = req.body;

            const notification = await notificationService.createNotification({
                userId,
                type,
                title: title || '테스트 알림',
                message: message || '이것은 테스트 알림입니다.',
                link: null
            });

            // WebSocket으로 실시간 전송
            if (notification) {
                notificationSocket.sendNotificationToUser(userId, notification);
            }

            res.json({
                success: true,
                message: '테스트 알림을 전송했습니다.',
                data: notification
            });
        } catch (error) {
            logger.error('Error sending test notification:', error);
            res.status(500).json({
                success: false,
                message: '테스트 알림 전송 중 오류가 발생했습니다.'
            });
        }
    });
}

export default router;
