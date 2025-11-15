// =====================================================
// Notification Routes
// Phase 3: Real-time Notification System
// =====================================================

const express = require('express');
const router = express.Router();
const notificationService = require('../services/notificationService');
const { authenticateToken } = require('../middleware/auth');

// =====================================================
// 알림 조회
// =====================================================

/**
 * GET /api/notifications
 * 알림 목록 조회
 */
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { page, limit, unreadOnly } = req.query;

        const result = await notificationService.getNotifications(req.user.userId, {
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 20,
            unreadOnly: unreadOnly === 'true'
        });

        res.json(result);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

/**
 * GET /api/notifications/unread-count
 * 읽지 않은 알림 개수
 */
router.get('/unread-count', authenticateToken, async (req, res) => {
    try {
        const count = await notificationService.getUnreadCount(req.user.userId);
        res.json({ count });
    } catch (error) {
        console.error('Error getting unread count:', error);
        res.status(500).json({ error: 'Failed to get unread count' });
    }
});

/**
 * GET /api/notifications/statistics
 * 알림 통계
 */
router.get('/statistics', authenticateToken, async (req, res) => {
    try {
        const stats = await notificationService.getStatistics(req.user.userId);
        res.json(stats);
    } catch (error) {
        console.error('Error getting notification statistics:', error);
        res.status(500).json({ error: 'Failed to get statistics' });
    }
});

/**
 * GET /api/notifications/:id
 * 특정 알림 조회
 */
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const [notifications] = await notificationService.getNotifications(req.user.userId, {
            page: 1,
            limit: 1,
            notificationId: req.params.id
        });

        if (!notifications || notifications.notifications.length === 0) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        res.json(notifications.notifications[0]);
    } catch (error) {
        console.error('Error fetching notification:', error);
        res.status(500).json({ error: 'Failed to fetch notification' });
    }
});

// =====================================================
// 알림 상태 변경
// =====================================================

/**
 * PUT /api/notifications/:id/read
 * 알림 읽음 처리
 */
router.put('/:id/read', authenticateToken, async (req, res) => {
    try {
        await notificationService.markAsRead(req.params.id, req.user.userId);
        res.json({ success: true, message: 'Notification marked as read' });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ error: 'Failed to mark as read' });
    }
});

/**
 * PUT /api/notifications/read-all
 * 모든 알림 읽음 처리
 */
router.put('/read-all', authenticateToken, async (req, res) => {
    try {
        await notificationService.markAllAsRead(req.user.userId);
        res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Error marking all as read:', error);
        res.status(500).json({ error: 'Failed to mark all as read' });
    }
});

/**
 * DELETE /api/notifications/:id
 * 알림 삭제
 */
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        await notificationService.deleteNotification(req.params.id, req.user.userId);
        res.json({ success: true, message: 'Notification deleted' });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({ error: 'Failed to delete notification' });
    }
});

// =====================================================
// 알림 설정
// =====================================================

/**
 * GET /api/notifications/settings
 * 알림 설정 조회
 */
router.get('/settings/current', authenticateToken, async (req, res) => {
    try {
        const settings = await notificationService.getSettings(req.user.userId);
        res.json(settings);
    } catch (error) {
        console.error('Error getting notification settings:', error);
        res.status(500).json({ error: 'Failed to get settings' });
    }
});

/**
 * PUT /api/notifications/settings
 * 알림 설정 업데이트
 */
router.put('/settings', authenticateToken, async (req, res) => {
    try {
        const allowedFields = [
            'email_enabled', 'push_enabled', 'sound_enabled',
            'new_follower_enabled', 'new_comment_enabled', 'comment_reply_enabled',
            'post_like_enabled', 'comment_like_enabled', 'mention_enabled',
            'moderator_warning_enabled', 'moderator_ban_enabled', 'moderator_action_enabled',
            'system_enabled', 'board_follow_enabled', 'user_follow_enabled', 'bookmark_enabled',
            'quiet_hours_enabled', 'quiet_hours_start', 'quiet_hours_end'
        ];

        const updates = {};
        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ error: 'No valid fields to update' });
        }

        const settings = await notificationService.updateSettings(req.user.userId, updates);
        res.json({ success: true, settings });
    } catch (error) {
        console.error('Error updating notification settings:', error);
        res.status(500).json({ error: 'Failed to update settings' });
    }
});

// =====================================================
// 테스트용 엔드포인트 (개발 환경에서만)
// =====================================================

if (process.env.NODE_ENV === 'development') {
    /**
     * POST /api/notifications/test
     * 테스트 알림 생성
     */
    router.post('/test', authenticateToken, async (req, res) => {
        try {
            const notification = await notificationService.createNotification({
                userId: req.user.userId,
                typeName: 'system',
                title: '테스트 알림',
                message: '이것은 테스트 알림입니다.',
                link: '/notifications',
                senderId: null,
                metadata: { test: true }
            });

            res.json({ success: true, notification });
        } catch (error) {
            console.error('Error creating test notification:', error);
            res.status(500).json({ error: 'Failed to create test notification' });
        }
    });
}

module.exports = router;
