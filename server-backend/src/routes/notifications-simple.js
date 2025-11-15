/**
 * Simple Notifications API Routes (SQLite)
 * Handles notification retrieval and management for comments system
 */

import express from 'express';
import db from '../config/sqlite-db.js';
import { buildAuthMiddleware } from '../auth/jwt.js';
const authMiddleware = buildAuthMiddleware();

const router = express.Router();

/**
 * GET /api/notifications-simple
 * Get all notifications for the current user
 */
router.get('/', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { limit = 20, offset = 0, unread_only = 'false' } = req.query;

        let query = `
      SELECT 
        n.id,
        n.user_id,
        n.type,
        n.title,
        n.content,
        n.related_id,
        n.related_type,
        n.actor_id,
        n.is_read,
        n.created_at,
        n.read_at,
        u.username as actor_username,
        u.display_name as actor_display_name,
        u.avatar_url as actor_avatar_url
      FROM notifications n
      LEFT JOIN users u ON n.actor_id = u.id
      WHERE n.user_id = ?
    `;

        const params = [userId];

        if (unread_only === 'true') {
            query += ' AND n.is_read = 0';
        }

        query += ' ORDER BY n.created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const [notifications] = db.query(query, params);

        // Get total count
        let countQuery = 'SELECT COUNT(*) as total FROM notifications WHERE user_id = ?';
        const countParams = [userId];

        if (unread_only === 'true') {
            countQuery += ' AND is_read = 0';
        }

        const [countResult] = db.query(countQuery, countParams);

        res.json({
            success: true,
            notifications,
            total: countResult[0].total,
            unread_count: notifications.filter(n => n.is_read === 0).length,
            hasMore: parseInt(offset) + notifications.length < countResult[0].total,
        });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({
            success: false,
            message: '알림 조회에 실패했습니다.',
            error: error.message,
        });
    }
});

/**
 * GET /api/notifications-simple/unread-count
 * Get unread notification count
 */
router.get('/unread-count', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;

        const [result] = db.query(
            'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
            [userId]
        );

        res.json({
            success: true,
            count: result[0].count,
        });
    } catch (error) {
        console.error('Get unread count error:', error);
        res.status(500).json({
            success: false,
            message: '읽지 않은 알림 수 조회에 실패했습니다.',
            error: error.message,
        });
    }
});

/**
 * PUT /api/notifications-simple/:notificationId/read
 * Mark a notification as read
 */
router.put('/:notificationId/read', authMiddleware, async (req, res) => {
    try {
        const { notificationId } = req.params;
        const userId = req.user.id;

        // Check if notification belongs to user
        const [notifications] = db.query(
            'SELECT id FROM notifications WHERE id = ? AND user_id = ?',
            [notificationId, userId]
        );

        if (notifications.length === 0) {
            return res.status(404).json({
                success: false,
                message: '알림을 찾을 수 없습니다.',
            });
        }

        // Mark as read
        db.execute(
            'UPDATE notifications SET is_read = 1, read_at = CURRENT_TIMESTAMP WHERE id = ?',
            [notificationId]
        );

        res.json({
            success: true,
            message: '알림을 읽음으로 표시했습니다.',
        });
    } catch (error) {
        console.error('Mark notification as read error:', error);
        res.status(500).json({
            success: false,
            message: '알림 읽음 처리에 실패했습니다.',
            error: error.message,
        });
    }
});

/**
 * PUT /api/notifications-simple/read-all
 * Mark all notifications as read
 */
router.put('/read-all', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;

        db.execute(
            'UPDATE notifications SET is_read = 1, read_at = CURRENT_TIMESTAMP WHERE user_id = ? AND is_read = 0',
            [userId]
        );

        res.json({
            success: true,
            message: '모든 알림을 읽음으로 표시했습니다.',
        });
    } catch (error) {
        console.error('Mark all as read error:', error);
        res.status(500).json({
            success: false,
            message: '알림 일괄 읽음 처리에 실패했습니다.',
            error: error.message,
        });
    }
});

/**
 * DELETE /api/notifications-simple/:notificationId
 * Delete a notification
 */
router.delete('/:notificationId', authMiddleware, async (req, res) => {
    try {
        const { notificationId } = req.params;
        const userId = req.user.id;

        // Check if notification belongs to user
        const [notifications] = db.query(
            'SELECT id FROM notifications WHERE id = ? AND user_id = ?',
            [notificationId, userId]
        );

        if (notifications.length === 0) {
            return res.status(404).json({
                success: false,
                message: '알림을 찾을 수 없습니다.',
            });
        }

        // Delete notification
        db.execute('DELETE FROM notifications WHERE id = ?', [notificationId]);

        res.json({
            success: true,
            message: '알림이 삭제되었습니다.',
        });
    } catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({
            success: false,
            message: '알림 삭제에 실패했습니다.',
            error: error.message,
        });
    }
});

/**
 * DELETE /api/notifications-simple
 * Delete all notifications (or all read notifications)
 */
router.delete('/', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { read_only = 'false' } = req.query;

        let query = 'DELETE FROM notifications WHERE user_id = ?';
        const params = [userId];

        if (read_only === 'true') {
            query += ' AND is_read = 1';
        }

        db.execute(query, params);

        res.json({
            success: true,
            message: read_only === 'true' ? '읽은 알림이 모두 삭제되었습니다.' : '모든 알림이 삭제되었습니다.',
        });
    } catch (error) {
        console.error('Delete notifications error:', error);
        res.status(500).json({
            success: false,
            message: '알림 삭제에 실패했습니다.',
            error: error.message,
        });
    }
});

export default router;
