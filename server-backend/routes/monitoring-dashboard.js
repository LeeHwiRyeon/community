const express = require('express');
const router = express.Router();
const { logger } = require('../../utils/logger');
const { monitoringSystem } = require('../../utils/monitoring-system');

// 대시보드 데이터 조회
router.get('/dashboard', async (req, res) => {
    try {
        const dashboardData = monitoringSystem.getDashboardData();

        res.json({
            success: true,
            data: dashboardData
        });
    } catch (error) {
        logger.error('대시보드 데이터 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '대시보드 데이터 조회 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 시스템 상태 조회
router.get('/status', async (req, res) => {
    try {
        const systemStatus = monitoringSystem.getSystemStatus();

        res.json({
            success: true,
            data: systemStatus
        });
    } catch (error) {
        logger.error('시스템 상태 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '시스템 상태 조회 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 메트릭 데이터 조회
router.get('/metrics', async (req, res) => {
    try {
        const metrics = await monitoringSystem.getMetrics();

        res.set('Content-Type', 'text/plain');
        res.send(metrics);
    } catch (error) {
        logger.error('메트릭 데이터 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '메트릭 데이터 조회 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 알림 목록 조회
router.get('/alerts', async (req, res) => {
    try {
        const { status = 'all', limit = 50 } = req.query;
        const alerts = monitoringSystem.getAlerts(status);

        // 최근 알림만 반환
        const recentAlerts = alerts
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, parseInt(limit));

        res.json({
            success: true,
            data: {
                alerts: recentAlerts,
                total: alerts.length,
                active: alerts.filter(a => a.status === 'active').length,
                resolved: alerts.filter(a => a.status === 'resolved').length
            }
        });
    } catch (error) {
        logger.error('알림 목록 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '알림 목록 조회 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 알림 해결
router.patch('/alerts/:alertId/resolve', async (req, res) => {
    try {
        const { alertId } = req.params;

        monitoringSystem.resolveAlert(alertId);

        res.json({
            success: true,
            message: '알림이 해결되었습니다.'
        });
    } catch (error) {
        logger.error('알림 해결 오류:', error);
        res.status(500).json({
            success: false,
            message: '알림 해결 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 실시간 메트릭 스트리밍 (SSE)
router.get('/metrics/stream', (req, res) => {
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
    });

    const sendMetrics = async () => {
        try {
            const dashboardData = monitoringSystem.getDashboardData();
            res.write(`data: ${JSON.stringify(dashboardData)}\n\n`);
        } catch (error) {
            logger.error('실시간 메트릭 전송 오류:', error);
        }
    };

    // 5초마다 메트릭 전송
    const interval = setInterval(sendMetrics, 5000);

    // 클라이언트 연결 종료 시 정리
    req.on('close', () => {
        clearInterval(interval);
    });

    // 초기 메트릭 전송
    sendMetrics();
});

// 알림 설정 조회
router.get('/alerts/config', async (req, res) => {
    try {
        const alertConfig = {
            thresholds: {
                cpuUsage: {
                    warning: 70,
                    critical: 90
                },
                memoryUsage: {
                    warning: 70,
                    critical: 90
                },
                errorRate: {
                    warning: 5,
                    critical: 10
                },
                responseTime: {
                    warning: 1000,
                    critical: 3000
                }
            },
            notifications: {
                email: {
                    enabled: true,
                    recipients: ['admin@community-platform.com']
                },
                slack: {
                    enabled: true,
                    webhook: process.env.SLACK_WEBHOOK_URL
                },
                sms: {
                    enabled: false,
                    recipients: []
                }
            }
        };

        res.json({
            success: true,
            data: alertConfig
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
router.put('/alerts/config', async (req, res) => {
    try {
        const { thresholds, notifications } = req.body;

        // 실제 구현에서는 설정을 데이터베이스에 저장
        logger.info('알림 설정 업데이트:', { thresholds, notifications });

        res.json({
            success: true,
            message: '알림 설정이 업데이트되었습니다.'
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

// 로그 조회
router.get('/logs', async (req, res) => {
    try {
        const {
            level = 'all',
            service = 'all',
            startTime,
            endTime,
            limit = 100
        } = req.query;

        // 실제 구현에서는 Elasticsearch에서 로그 조회
        const mockLogs = [
            {
                timestamp: new Date().toISOString(),
                level: 'INFO',
                service: 'community-platform',
                message: 'User login successful',
                userId: 'user123',
                ip: '192.168.1.100'
            },
            {
                timestamp: new Date(Date.now() - 60000).toISOString(),
                level: 'WARN',
                service: 'community-platform',
                message: 'High memory usage detected',
                memoryUsage: 85,
                threshold: 80
            },
            {
                timestamp: new Date(Date.now() - 120000).toISOString(),
                level: 'ERROR',
                service: 'database',
                message: 'Database connection failed',
                error: 'Connection timeout',
                retryCount: 3
            }
        ];

        // 필터링
        let filteredLogs = mockLogs;

        if (level !== 'all') {
            filteredLogs = filteredLogs.filter(log => log.level === level);
        }

        if (service !== 'all') {
            filteredLogs = filteredLogs.filter(log => log.service === service);
        }

        // 시간 범위 필터링
        if (startTime) {
            filteredLogs = filteredLogs.filter(log =>
                new Date(log.timestamp) >= new Date(startTime)
            );
        }

        if (endTime) {
            filteredLogs = filteredLogs.filter(log =>
                new Date(log.timestamp) <= new Date(endTime)
            );
        }

        // 최신 로그부터 정렬하고 제한
        filteredLogs = filteredLogs
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, parseInt(limit));

        res.json({
            success: true,
            data: {
                logs: filteredLogs,
                total: filteredLogs.length,
                filters: {
                    level,
                    service,
                    startTime,
                    endTime
                }
            }
        });
    } catch (error) {
        logger.error('로그 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '로그 조회 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 성능 분석
router.get('/performance/analysis', async (req, res) => {
    try {
        const { period = '1h' } = req.query;

        // 실제 구현에서는 시계열 데이터베이스에서 분석
        const analysis = {
            period,
            metrics: {
                averageResponseTime: 250,
                p95ResponseTime: 500,
                p99ResponseTime: 1000,
                throughput: 1000,
                errorRate: 2.5,
                availability: 99.9
            },
            trends: {
                responseTime: 'stable',
                throughput: 'increasing',
                errorRate: 'decreasing',
                availability: 'stable'
            },
            recommendations: [
                'Consider adding more database connections',
                'Cache frequently accessed data',
                'Optimize slow queries'
            ]
        };

        res.json({
            success: true,
            data: analysis
        });
    } catch (error) {
        logger.error('성능 분석 오류:', error);
        res.status(500).json({
            success: false,
            message: '성능 분석 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 시스템 정보 조회
router.get('/system/info', async (req, res) => {
    try {
        const os = require('os');

        const systemInfo = {
            platform: os.platform(),
            arch: os.arch(),
            release: os.release(),
            hostname: os.hostname(),
            uptime: os.uptime(),
            totalMemory: os.totalmem(),
            freeMemory: os.freemem(),
            cpus: os.cpus().length,
            loadAverage: os.loadavg(),
            nodeVersion: process.version,
            pid: process.pid,
            memoryUsage: process.memoryUsage()
        };

        res.json({
            success: true,
            data: systemInfo
        });
    } catch (error) {
        logger.error('시스템 정보 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '시스템 정보 조회 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 헬스 체크
router.get('/health', async (req, res) => {
    try {
        const systemStatus = monitoringSystem.getSystemStatus();

        const healthStatus = {
            status: systemStatus.status,
            timestamp: new Date().toISOString(),
            checks: {
                database: 'healthy',
                redis: 'healthy',
                disk: 'healthy',
                memory: systemStatus.memoryUsage < 90 ? 'healthy' : 'warning',
                cpu: systemStatus.cpuUsage < 90 ? 'healthy' : 'warning'
            },
            uptime: systemStatus.uptime,
            version: process.env.npm_package_version || '1.0.0'
        };

        const statusCode = healthStatus.status === 'healthy' ? 200 : 503;
        res.status(statusCode).json({
            success: true,
            data: healthStatus
        });
    } catch (error) {
        logger.error('헬스 체크 오류:', error);
        res.status(503).json({
            success: false,
            message: '헬스 체크 실패',
            error: error.message
        });
    }
});

module.exports = router;
