const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');
const { logger } = require('../utils/logger');

// 알림 전송
router.post('/send', authenticateToken, async (req, res) => {
    try {
        const { type, priority, title, message, channels, recipients, data } = req.body;

        // 알림 요청 검증
        if (!type || !title || !message) {
            return res.status(400).json({
                success: false,
                message: '필수 필드가 누락되었습니다.'
            });
        }

        // 알림 전송 로직 (실제로는 NotificationService 호출)
        const notificationResult = {
            success: true,
            message: '알림이 성공적으로 전송되었습니다.',
            notificationId: Date.now().toString(),
            timestamp: new Date().toISOString(),
            channels: channels || ['email', 'webpush'],
            recipients: recipients || [req.user.id.toString()]
        };

        logger.info(`알림 전송: ${type} - ${title}`, {
            userId: req.user.id,
            type,
            priority,
            channels,
            recipients
        });

        res.json({
            success: true,
            data: notificationResult
        });
    } catch (error) {
        logger.error('알림 전송 오류:', error);
        res.status(500).json({
            success: false,
            message: '알림 전송 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 시스템 상태 알림
router.post('/system-status', async (req, res) => {
    try {
        const { serviceName, isHealthy, message, details } = req.body;

        const systemStatus = {
            serviceName: serviceName || 'Community Platform',
            isHealthy: isHealthy !== false,
            message: message || (isHealthy ? '시스템이 정상 작동 중입니다.' : '시스템에 문제가 발생했습니다.'),
            timestamp: new Date().toISOString(),
            details: details || {}
        };

        // 시스템 상태에 따른 알림 전송
        const notification = {
            type: 'system',
            priority: systemStatus.isHealthy ? 'info' : 'critical',
            title: `시스템 상태 알림 - ${systemStatus.serviceName}`,
            message: systemStatus.isHealthy ?
                `✅ ${systemStatus.serviceName}이 정상적으로 작동 중입니다.` :
                `❌ ${systemStatus.serviceName}에 문제가 발생했습니다: ${systemStatus.message}`,
            channels: ['email', 'slack'],
            recipients: ['admin@example.com'],
            data: systemStatus
        };

        logger.info(`시스템 상태 알림: ${systemStatus.serviceName} - ${systemStatus.isHealthy ? '정상' : '오류'}`);

        res.json({
            success: true,
            data: {
                notification,
                systemStatus,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        logger.error('시스템 상태 알림 오류:', error);
        res.status(500).json({
            success: false,
            message: '시스템 상태 알림 처리 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 분석 결과 알림
router.post('/analytics-alerts', async (req, res) => {
    try {
        const analyticsData = req.body;

        // 분석 결과에서 중요한 인사이트 추출
        const alerts = [];

        // 사용자 성장률 체크
        if (analyticsData.trends?.userGrowth < 0.1) {
            alerts.push({
                type: 'warning',
                title: '사용자 성장률 저하',
                message: `사용자 성장률이 ${(analyticsData.trends.userGrowth * 100).toFixed(1)}%로 낮습니다.`,
                priority: 'medium'
            });
        }

        // 참여도 감소 체크
        if (analyticsData.trends?.engagementGrowth < 0) {
            alerts.push({
                type: 'warning',
                title: '참여도 감소',
                message: `사용자 참여도가 ${(analyticsData.trends.engagementGrowth * 100).toFixed(1)}% 감소했습니다.`,
                priority: 'high'
            });
        }

        // 새로운 트렌드 감지
        if (analyticsData.alerts?.length > 0) {
            analyticsData.alerts.forEach(alert => {
                alerts.push({
                    type: 'info',
                    title: '새로운 트렌드 감지',
                    message: alert.message,
                    priority: 'low'
                });
            });
        }

        // 알림 전송
        const notifications = alerts.map(alert => ({
            type: 'analytics',
            priority: alert.priority,
            title: alert.title,
            message: alert.message,
            channels: ['email', 'webpush'],
            recipients: alert.priority === 'high' ? ['admin@example.com', 'analyst@example.com'] : ['analyst@example.com'],
            data: {
                alertType: alert.type,
                analyticsData: analyticsData,
                timestamp: new Date().toISOString()
            }
        }));

        logger.info(`분석 결과 알림: ${alerts.length}개 알림 생성`);

        res.json({
            success: true,
            data: {
                alerts,
                notifications,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        logger.error('분석 결과 알림 오류:', error);
        res.status(500).json({
            success: false,
            message: '분석 결과 알림 처리 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 예약된 알림 조회
router.get('/scheduled', authenticateToken, requireRole(['admin', 'moderator']), async (req, res) => {
    try {
        const { limit = 50, offset = 0 } = req.query;

        // 예약된 알림 목록 (실제로는 데이터베이스에서 조회)
        const scheduledNotifications = [
            {
                id: 1,
                type: 'system',
                priority: 'high',
                title: '정기 시스템 점검 알림',
                message: '매주 일요일 새벽 2시에 정기 시스템 점검이 예정되어 있습니다.',
                scheduledTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                channels: ['email', 'slack'],
                recipients: ['admin@example.com'],
                status: 'pending'
            },
            {
                id: 2,
                type: 'analytics',
                priority: 'medium',
                title: '주간 분석 보고서',
                message: '주간 분석 보고서가 준비되었습니다.',
                scheduledTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                channels: ['email'],
                recipients: ['analyst@example.com'],
                status: 'pending'
            }
        ];

        res.json({
            success: true,
            data: {
                notifications: scheduledNotifications.slice(offset, offset + parseInt(limit)),
                total: scheduledNotifications.length,
                pagination: {
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    hasMore: offset + parseInt(limit) < scheduledNotifications.length
                }
            }
        });
    } catch (error) {
        logger.error('예약된 알림 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '예약된 알림 조회 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 예약된 알림 처리
router.post('/process-scheduled', async (req, res) => {
    try {
        const now = new Date();

        // 현재 시간에 실행되어야 할 예약된 알림들 처리
        const processedNotifications = [
            {
                id: 1,
                type: 'system',
                title: '시스템 상태 체크',
                message: '시스템이 정상적으로 작동 중입니다.',
                processedAt: now.toISOString(),
                status: 'completed'
            }
        ];

        logger.info(`예약된 알림 처리: ${processedNotifications.length}개 완료`);

        res.json({
            success: true,
            data: {
                processedCount: processedNotifications.length,
                processedNotifications,
                timestamp: now.toISOString()
            }
        });
    } catch (error) {
        logger.error('예약된 알림 처리 오류:', error);
        res.status(500).json({
            success: false,
            message: '예약된 알림 처리 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 알림 설정 조회
router.get('/settings', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        // 사용자별 알림 설정 (실제로는 데이터베이스에서 조회)
        const settings = {
            userId,
            email: {
                enabled: true,
                system: true,
                analytics: false,
                user: true
            },
            webpush: {
                enabled: true,
                system: true,
                analytics: true,
                user: true
            },
            slack: {
                enabled: false,
                webhook: null
            },
            discord: {
                enabled: false,
                webhook: null
            },
            frequency: {
                system: 'immediate',
                analytics: 'daily',
                user: 'immediate'
            }
        };

        res.json({
            success: true,
            data: settings
        });
    } catch (error) {
        logger.error('알림 설정 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '알림 설정 조회 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 알림 설정 업데이트
router.put('/settings', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { email, webpush, slack, discord, frequency } = req.body;

        // 알림 설정 업데이트 (실제로는 데이터베이스에 저장)
        const updatedSettings = {
            userId,
            email: email || {},
            webpush: webpush || {},
            slack: slack || {},
            discord: discord || {},
            frequency: frequency || {},
            updatedAt: new Date().toISOString()
        };

        logger.info(`알림 설정 업데이트: 사용자 ${userId}`);

        res.json({
            success: true,
            data: updatedSettings,
            message: '알림 설정이 성공적으로 업데이트되었습니다.'
        });
    } catch (error) {
        logger.error('알림 설정 업데이트 오류:', error);
        res.status(500).json({
            success: false,
            message: '알림 설정 업데이트 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 알림 이력 조회
router.get('/history', authenticateToken, requireRole(['admin', 'moderator']), async (req, res) => {
    try {
        const { type, limit = 50, offset = 0, startDate, endDate } = req.query;

        // 알림 이력 조회 (실제로는 데이터베이스에서 조회)
        const history = [
            {
                id: 1,
                type: 'system',
                priority: 'high',
                title: '시스템 상태 알림',
                message: '시스템이 정상적으로 작동 중입니다.',
                channels: ['email', 'slack'],
                success: true,
                sentAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
                recipients: ['admin@example.com']
            },
            {
                id: 2,
                type: 'analytics',
                priority: 'medium',
                title: '분석 결과 알림',
                message: '주간 분석 보고서가 준비되었습니다.',
                channels: ['email'],
                success: true,
                sentAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                recipients: ['analyst@example.com']
            }
        ];

        // 필터링
        let filteredHistory = history;
        if (type) {
            filteredHistory = filteredHistory.filter(h => h.type === type);
        }

        res.json({
            success: true,
            data: {
                history: filteredHistory.slice(offset, offset + parseInt(limit)),
                total: filteredHistory.length,
                pagination: {
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    hasMore: offset + parseInt(limit) < filteredHistory.length
                }
            }
        });
    } catch (error) {
        logger.error('알림 이력 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '알림 이력 조회 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 알림 템플릿 조회
router.get('/templates', authenticateToken, requireRole(['admin', 'moderator']), async (req, res) => {
    try {
        const templates = [
            {
                id: 1,
                type: 'system',
                name: '시스템 상태 알림',
                titleTemplate: '시스템 상태 알림 - {serviceName}',
                messageTemplate: '{isHealthy ? "✅" : "❌"} {serviceName}이 {isHealthy ? "정상적으로 작동 중" : "문제가 발생"}입니다.',
                variables: ['serviceName', 'isHealthy', 'message', 'timestamp']
            },
            {
                id: 2,
                type: 'analytics',
                name: '분석 결과 알림',
                titleTemplate: '분석 결과 알림 - {analysisType}',
                messageTemplate: '📊 {analysisType} 분석이 완료되었습니다.\n\n{summary}',
                variables: ['analysisType', 'summary', 'insights', 'timestamp']
            },
            {
                id: 3,
                type: 'user',
                name: '사용자 활동 알림',
                titleTemplate: '새로운 활동 알림',
                messageTemplate: '새로운 {activityType}이 있습니다.',
                variables: ['activityType', 'userId', 'timestamp', 'details']
            }
        ];

        res.json({
            success: true,
            data: templates
        });
    } catch (error) {
        logger.error('알림 템플릿 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '알림 템플릿 조회 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 알림 통계
router.get('/stats', authenticateToken, requireRole(['admin', 'moderator']), async (req, res) => {
    try {
        const { period = '7d' } = req.query;

        // 기간 계산
        const now = new Date();
        let startDate = new Date();

        switch (period) {
            case '1d':
                startDate.setDate(now.getDate() - 1);
                break;
            case '7d':
                startDate.setDate(now.getDate() - 7);
                break;
            case '30d':
                startDate.setDate(now.getDate() - 30);
                break;
        }

        const stats = {
            total: 1250,
            sent: 1180,
            failed: 70,
            successRate: 94.4,
            byType: {
                system: { total: 450, sent: 430, failed: 20 },
                analytics: { total: 300, sent: 290, failed: 10 },
                user: { total: 500, sent: 460, failed: 40 }
            },
            byChannel: {
                email: { total: 800, sent: 750, failed: 50 },
                webpush: { total: 300, sent: 280, failed: 20 },
                slack: { total: 150, sent: 150, failed: 0 }
            },
            period: {
                start: startDate.toISOString(),
                end: now.toISOString(),
                type: period
            }
        };

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        logger.error('알림 통계 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '알림 통계 조회 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

module.exports = router;
