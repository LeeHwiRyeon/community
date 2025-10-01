const logger = require('../utils/logger');

// 알림 조회
const getNotifications = async (req, res) => {
    try {
        const { page = 1, limit = 20, isRead } = req.query;
        const offset = (page - 1) * limit;

        // 임시 데이터 (실제로는 데이터베이스에서 조회)
        const notifications = [
            {
                id: 1,
                title: '새로운 사용자 가입',
                message: '새로운 사용자가 가입했습니다.',
                type: 'info',
                isRead: false,
                createdAt: new Date()
            },
            {
                id: 2,
                title: '시스템 업데이트',
                message: '시스템이 업데이트되었습니다.',
                type: 'success',
                isRead: true,
                createdAt: new Date()
            }
        ];

        res.json({
            success: true,
            data: {
                notifications,
                pagination: {
                    total: notifications.length,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    pages: Math.ceil(notifications.length / limit)
                }
            }
        });
    } catch (error) {
        logger.error('Get notifications error:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
};

// 알림 읽음 처리
const markNotificationAsRead = async (req, res) => {
    try {
        const { id } = req.params;

        // 실제로는 데이터베이스에서 업데이트
        res.json({
            success: true,
            message: '알림이 읽음 처리되었습니다.'
        });
    } catch (error) {
        logger.error('Mark notification as read error:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
};

// 모든 알림 읽음 처리
const markAllNotificationsAsRead = async (req, res) => {
    try {
        // 실제로는 데이터베이스에서 업데이트
        res.json({
            success: true,
            message: '모든 알림이 읽음 처리되었습니다.'
        });
    } catch (error) {
        logger.error('Mark all notifications as read error:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
};

// 알림 삭제
const deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;

        // 실제로는 데이터베이스에서 삭제
        res.json({
            success: true,
            message: '알림이 삭제되었습니다.'
        });
    } catch (error) {
        logger.error('Delete notification error:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
};

// 알림 설정 조회
const getNotificationSettings = async (req, res) => {
    try {
        const settings = {
            email: true,
            push: true,
            sms: false,
            categories: {
                system: true,
                user: true,
                content: false,
                billing: true
            }
        };

        res.json({
            success: true,
            data: { settings }
        });
    } catch (error) {
        logger.error('Get notification settings error:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
};

// 알림 설정 업데이트
const updateNotificationSettings = async (req, res) => {
    try {
        const settings = req.body;

        // 실제로는 데이터베이스에서 업데이트
        res.json({
            success: true,
            message: '알림 설정이 업데이트되었습니다.',
            data: { settings }
        });
    } catch (error) {
        logger.error('Update notification settings error:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
};

module.exports = {
    getNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    getNotificationSettings,
    updateNotificationSettings
};
