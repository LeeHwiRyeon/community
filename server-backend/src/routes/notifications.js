const express = require('express');
const { body, validationResult } = require('express-validator');
const { query } = require('../db.js');
const auth = require('../middleware/auth.js');

const router = express.Router();

// Get all notifications for a user
router.get('/', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 20, unread_only = false } = req.query;

        let whereClause = 'WHERE user_id = ?';
        let params = [userId];

        if (unread_only === 'true') {
            whereClause += ' AND is_read = 0';
        }

        const offset = (parseInt(page) - 1) * parseInt(limit);

        // Get notifications
        const notifications = await query(`
            SELECT 
                n.*,
                u.name as from_user_name,
                u.avatar as from_user_avatar
            FROM notifications n
            LEFT JOIN users u ON n.from_user_id = u.id
            ${whereClause}
            ORDER BY n.created_at DESC
            LIMIT ? OFFSET ?
        `, [...params, parseInt(limit), offset]);

        // Get total count
        const countResult = await query(`
            SELECT COUNT(*) as total
            FROM notifications
            ${whereClause}
        `, params);

        const total = countResult[0].total;

        res.json({
            success: true,
            data: notifications,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

// Mark notification as read
router.patch('/:id/read', auth, async (req, res) => {
    try {
        const notificationId = req.params.id;
        const userId = req.user.id;

        const result = await query(`
            UPDATE notifications 
            SET is_read = 1, read_at = NOW()
            WHERE id = ? AND user_id = ?
        `, [notificationId, userId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        res.json({ success: true, message: 'Notification marked as read' });
    } catch (error) {
        console.error('Mark notification read error:', error);
        res.status(500).json({ error: 'Failed to mark notification as read' });
    }
});

// Mark all notifications as read
router.patch('/read-all', auth, async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await query(`
            UPDATE notifications 
            SET is_read = 1, read_at = NOW()
            WHERE user_id = ? AND is_read = 0
        `, [userId]);

        res.json({
            success: true,
            message: 'All notifications marked as read',
            updated_count: result.affectedRows
        });
    } catch (error) {
        console.error('Mark all notifications read error:', error);
        res.status(500).json({ error: 'Failed to mark all notifications as read' });
    }
});

// Delete notification
router.delete('/:id', auth, async (req, res) => {
    try {
        const notificationId = req.params.id;
        const userId = req.user.id;

        const result = await query(`
            DELETE FROM notifications 
            WHERE id = ? AND user_id = ?
        `, [notificationId, userId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        res.json({ success: true, message: 'Notification deleted' });
    } catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({ error: 'Failed to delete notification' });
    }
});

// Create notification (internal use)
router.post('/', auth, [
    body('user_id').isInt().withMessage('User ID is required'),
    body('type').isIn(['todo_assigned', 'todo_completed', 'todo_updated', 'comment_added', 'mention']).withMessage('Invalid notification type'),
    body('title').notEmpty().withMessage('Title is required'),
    body('message').notEmpty().withMessage('Message is required'),
    body('related_id').optional().isInt(),
    body('from_user_id').optional().isInt()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const {
            user_id,
            type,
            title,
            message,
            related_id,
            from_user_id
        } = req.body;

        const result = await query(`
            INSERT INTO notifications (
                user_id, type, title, message, related_id, from_user_id, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, NOW())
        `, [user_id, type, title, message, related_id, from_user_id]);

        // Send real-time notification if WebSocket is available
        if (req.app.locals.sendNotification) {
            req.app.locals.sendNotification(user_id, {
                type: 'notification',
                data: {
                    id: result.insertId,
                    type,
                    title,
                    message,
                    created_at: new Date().toISOString()
                }
            });
        }

        res.status(201).json({
            success: true,
            data: {
                id: result.insertId,
                user_id,
                type,
                title,
                message,
                related_id,
                from_user_id,
                is_read: 0,
                created_at: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Create notification error:', error);
        res.status(500).json({ error: 'Failed to create notification' });
    }
});

// Get notification statistics
router.get('/stats', auth, async (req, res) => {
    try {
        const userId = req.user.id;

        const stats = await query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END) as unread,
                SUM(CASE WHEN is_read = 1 THEN 1 ELSE 0 END) as read,
                SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 ELSE 0 END) as last_24h
            FROM notifications
            WHERE user_id = ?
        `, [userId]);

        res.json({
            success: true,
            data: stats[0]
        });
    } catch (error) {
        console.error('Get notification stats error:', error);
        res.status(500).json({ error: 'Failed to fetch notification statistics' });
    }
});

module.exports = router;
