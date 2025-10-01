const promClient = require('prom-client');
const { logger } = require('./logger');

// 모니터링 시스템 클래스
class MonitoringSystem {
    constructor() {
        this.metrics = {};
        this.alerts = [];
        this.notifications = [];
        this.initializeMetrics();
        this.startHealthChecks();
    }

    // 메트릭 초기화
    initializeMetrics() {
        // 시스템 메트릭
        this.metrics.system = {
            cpuUsage: new promClient.Gauge({
                name: 'system_cpu_usage_percent',
                help: 'System CPU usage percentage',
                labelNames: ['core']
            }),
            memoryUsage: new promClient.Gauge({
                name: 'system_memory_usage_bytes',
                help: 'System memory usage in bytes',
                labelNames: ['type']
            }),
            diskUsage: new promClient.Gauge({
                name: 'system_disk_usage_bytes',
                help: 'System disk usage in bytes',
                labelNames: ['device', 'mountpoint']
            }),
            networkUsage: new promClient.Gauge({
                name: 'system_network_usage_bytes',
                help: 'System network usage in bytes',
                labelNames: ['interface', 'direction']
            })
        };

        // 애플리케이션 메트릭
        this.metrics.application = {
            httpRequests: new promClient.Counter({
                name: 'http_requests_total',
                help: 'Total number of HTTP requests',
                labelNames: ['method', 'route', 'status_code']
            }),
            httpDuration: new promClient.Histogram({
                name: 'http_request_duration_seconds',
                help: 'Duration of HTTP requests in seconds',
                labelNames: ['method', 'route'],
                buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
            }),
            activeConnections: new promClient.Gauge({
                name: 'active_connections',
                help: 'Number of active connections'
            }),
            errorRate: new promClient.Gauge({
                name: 'error_rate_percent',
                help: 'Error rate percentage'
            })
        };

        // 데이터베이스 메트릭
        this.metrics.database = {
            connections: new promClient.Gauge({
                name: 'database_connections',
                help: 'Number of database connections',
                labelNames: ['state']
            }),
            queryDuration: new promClient.Histogram({
                name: 'database_query_duration_seconds',
                help: 'Duration of database queries in seconds',
                labelNames: ['query_type', 'table'],
                buckets: [0.01, 0.05, 0.1, 0.2, 0.5, 1, 2, 5]
            }),
            queryErrors: new promClient.Counter({
                name: 'database_query_errors_total',
                help: 'Total number of database query errors',
                labelNames: ['error_type']
            })
        };

        // 비즈니스 메트릭
        this.metrics.business = {
            userActivity: new promClient.Counter({
                name: 'user_activity_total',
                help: 'Total user activity events',
                labelNames: ['action', 'user_type']
            }),
            contentCreated: new promClient.Counter({
                name: 'content_created_total',
                help: 'Total content created',
                labelNames: ['content_type', 'user_type']
            }),
            userSessions: new promClient.Gauge({
                name: 'user_sessions_active',
                help: 'Number of active user sessions'
            })
        };

        // 캐시 메트릭
        this.metrics.cache = {
            hits: new promClient.Counter({
                name: 'cache_hits_total',
                help: 'Total cache hits',
                labelNames: ['cache_type']
            }),
            misses: new promClient.Counter({
                name: 'cache_misses_total',
                help: 'Total cache misses',
                labelNames: ['cache_type']
            }),
            size: new promClient.Gauge({
                name: 'cache_size_bytes',
                help: 'Cache size in bytes',
                labelNames: ['cache_type']
            })
        };
    }

    // 헬스 체크 시작
    startHealthChecks() {
        // 시스템 메트릭 수집 (5초마다)
        setInterval(() => {
            this.collectSystemMetrics();
        }, 5000);

        // 애플리케이션 메트릭 수집 (10초마다)
        setInterval(() => {
            this.collectApplicationMetrics();
        }, 10000);

        // 데이터베이스 메트릭 수집 (15초마다)
        setInterval(() => {
            this.collectDatabaseMetrics();
        }, 15000);

        // 비즈니스 메트릭 수집 (30초마다)
        setInterval(() => {
            this.collectBusinessMetrics();
        }, 30000);

        // 알림 체크 (1분마다)
        setInterval(() => {
            this.checkAlerts();
        }, 60000);
    }

    // 시스템 메트릭 수집
    collectSystemMetrics() {
        try {
            const os = require('os');

            // CPU 사용률
            const cpus = os.cpus();
            cpus.forEach((cpu, index) => {
                const total = Object.values(cpu.times).reduce((a, b) => a + b, 0);
                const idle = cpu.times.idle;
                const usage = ((total - idle) / total) * 100;
                this.metrics.system.cpuUsage.set({ core: `cpu${index}` }, usage);
            });

            // 메모리 사용률
            const memUsage = process.memoryUsage();
            this.metrics.system.memoryUsage.set({ type: 'rss' }, memUsage.rss);
            this.metrics.system.memoryUsage.set({ type: 'heapTotal' }, memUsage.heapTotal);
            this.metrics.system.memoryUsage.set({ type: 'heapUsed' }, memUsage.heapUsed);
            this.metrics.system.memoryUsage.set({ type: 'external' }, memUsage.external);

            // 디스크 사용률 (간단한 구현)
            const fs = require('fs');
            try {
                const stats = fs.statSync('.');
                this.metrics.system.diskUsage.set({ device: 'root', mountpoint: '/' }, stats.size);
            } catch (error) {
                // 디스크 정보 수집 실패 시 무시
            }

        } catch (error) {
            logger.error('시스템 메트릭 수집 오류:', error);
        }
    }

    // 애플리케이션 메트릭 수집
    collectApplicationMetrics() {
        try {
            // 활성 연결 수 (간단한 구현)
            const activeConnections = process._getActiveHandles().length;
            this.metrics.application.activeConnections.set(activeConnections);

            // 에러율 계산 (간단한 구현)
            const errorRate = this.calculateErrorRate();
            this.metrics.application.errorRate.set(errorRate);

        } catch (error) {
            logger.error('애플리케이션 메트릭 수집 오류:', error);
        }
    }

    // 데이터베이스 메트릭 수집
    async collectDatabaseMetrics() {
        try {
            // 데이터베이스 연결 상태 확인
            const { pool } = require('./database-optimizer');
            if (pool) {
                const status = await pool.getPoolStatus();
                this.metrics.database.connections.set({ state: 'active' }, status.totalConnections);
                this.metrics.database.connections.set({ state: 'free' }, status.freeConnections);
            }
        } catch (error) {
            logger.error('데이터베이스 메트릭 수집 오류:', error);
        }
    }

    // 비즈니스 메트릭 수집
    collectBusinessMetrics() {
        try {
            // 활성 사용자 세션 수 (간단한 구현)
            const activeSessions = this.getActiveSessions();
            this.metrics.business.userSessions.set(activeSessions);

        } catch (error) {
            logger.error('비즈니스 메트릭 수집 오류:', error);
        }
    }

    // HTTP 요청 메트릭 기록
    recordHttpRequest(method, route, statusCode, duration) {
        this.metrics.application.httpRequests.inc({ method, route, status_code: statusCode });
        this.metrics.application.httpDuration.observe({ method, route }, duration);
    }

    // 사용자 활동 메트릭 기록
    recordUserActivity(action, userType) {
        this.metrics.business.userActivity.inc({ action, user_type: userType });
    }

    // 콘텐츠 생성 메트릭 기록
    recordContentCreated(contentType, userType) {
        this.metrics.business.contentCreated.inc({ content_type: contentType, user_type: userType });
    }

    // 캐시 메트릭 기록
    recordCacheHit(cacheType) {
        this.metrics.cache.hits.inc({ cache_type: cacheType });
    }

    recordCacheMiss(cacheType) {
        this.metrics.cache.misses.inc({ cache_type: cacheType });
    }

    // 데이터베이스 쿼리 메트릭 기록
    recordDatabaseQuery(queryType, table, duration) {
        this.metrics.database.queryDuration.observe({ query_type: queryType, table }, duration);
    }

    recordDatabaseError(errorType) {
        this.metrics.database.queryErrors.inc({ error_type: errorType });
    }

    // 에러율 계산
    calculateErrorRate() {
        // 간단한 에러율 계산 (실제로는 더 복잡한 로직 필요)
        const totalRequests = this.metrics.application.httpRequests._value || 0;
        const errorRequests = this.metrics.application.httpRequests._value || 0;
        return totalRequests > 0 ? (errorRequests / totalRequests) * 100 : 0;
    }

    // 활성 세션 수 가져오기
    getActiveSessions() {
        // 간단한 구현 (실제로는 세션 저장소에서 가져와야 함)
        return Math.floor(Math.random() * 100) + 50;
    }

    // 알림 체크
    checkAlerts() {
        try {
            // CPU 사용률 체크
            const cpuUsage = this.getCurrentCpuUsage();
            if (cpuUsage > 80) {
                this.triggerAlert('HIGH_CPU_USAGE', {
                    severity: 'warning',
                    message: `High CPU usage detected: ${cpuUsage}%`,
                    value: cpuUsage,
                    threshold: 80
                });
            }

            // 메모리 사용률 체크
            const memoryUsage = this.getCurrentMemoryUsage();
            if (memoryUsage > 80) {
                this.triggerAlert('HIGH_MEMORY_USAGE', {
                    severity: 'warning',
                    message: `High memory usage detected: ${memoryUsage}%`,
                    value: memoryUsage,
                    threshold: 80
                });
            }

            // 에러율 체크
            const errorRate = this.calculateErrorRate();
            if (errorRate > 5) {
                this.triggerAlert('HIGH_ERROR_RATE', {
                    severity: 'critical',
                    message: `High error rate detected: ${errorRate}%`,
                    value: errorRate,
                    threshold: 5
                });
            }

        } catch (error) {
            logger.error('알림 체크 오류:', error);
        }
    }

    // 현재 CPU 사용률 가져오기
    getCurrentCpuUsage() {
        const os = require('os');
        const cpus = os.cpus();
        const total = cpus.reduce((sum, cpu) => {
            return sum + Object.values(cpu.times).reduce((a, b) => a + b, 0);
        }, 0);
        const idle = cpus.reduce((sum, cpu) => sum + cpu.times.idle, 0);
        return ((total - idle) / total) * 100;
    }

    // 현재 메모리 사용률 가져오기
    getCurrentMemoryUsage() {
        const memUsage = process.memoryUsage();
        return (memUsage.heapUsed / memUsage.heapTotal) * 100;
    }

    // 알림 트리거
    triggerAlert(alertType, alertData) {
        const alert = {
            id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: alertType,
            severity: alertData.severity,
            message: alertData.message,
            value: alertData.value,
            threshold: alertData.threshold,
            timestamp: new Date().toISOString(),
            status: 'active'
        };

        this.alerts.push(alert);
        this.sendNotification(alert);

        logger.warn(`알림 트리거: ${alertType}`, alert);
    }

    // 알림 전송
    async sendNotification(alert) {
        try {
            // 이메일 알림 (간단한 구현)
            if (alert.severity === 'critical') {
                await this.sendEmailNotification(alert);
            }

            // Slack 알림 (간단한 구현)
            if (alert.severity === 'warning' || alert.severity === 'critical') {
                await this.sendSlackNotification(alert);
            }

            // 내부 알림 저장
            this.notifications.push({
                ...alert,
                sentAt: new Date().toISOString()
            });

        } catch (error) {
            logger.error('알림 전송 오류:', error);
        }
    }

    // 이메일 알림 전송
    async sendEmailNotification(alert) {
        // 실제 구현에서는 이메일 서비스 사용
        logger.info(`이메일 알림 전송: ${alert.message}`);
    }

    // Slack 알림 전송
    async sendSlackNotification(alert) {
        // 실제 구현에서는 Slack API 사용
        logger.info(`Slack 알림 전송: ${alert.message}`);
    }

    // 메트릭 데이터 가져오기
    async getMetrics() {
        try {
            const register = new promClient.Register();

            // 모든 메트릭 등록
            Object.values(this.metrics).forEach(metricGroup => {
                Object.values(metricGroup).forEach(metric => {
                    register.registerMetric(metric);
                });
            });

            return await register.metrics();
        } catch (error) {
            logger.error('메트릭 데이터 가져오기 오류:', error);
            return '';
        }
    }

    // 알림 목록 가져오기
    getAlerts(status = 'all') {
        if (status === 'all') {
            return this.alerts;
        }
        return this.alerts.filter(alert => alert.status === status);
    }

    // 알림 해결
    resolveAlert(alertId) {
        const alert = this.alerts.find(a => a.id === alertId);
        if (alert) {
            alert.status = 'resolved';
            alert.resolvedAt = new Date().toISOString();
            logger.info(`알림 해결: ${alertId}`);
        }
    }

    // 시스템 상태 가져오기
    getSystemStatus() {
        const cpuUsage = this.getCurrentCpuUsage();
        const memoryUsage = this.getCurrentMemoryUsage();
        const errorRate = this.calculateErrorRate();
        const activeAlerts = this.alerts.filter(a => a.status === 'active').length;

        let status = 'healthy';
        if (activeAlerts > 0 || cpuUsage > 90 || memoryUsage > 90 || errorRate > 10) {
            status = 'critical';
        } else if (cpuUsage > 70 || memoryUsage > 70 || errorRate > 5) {
            status = 'warning';
        }

        return {
            status,
            cpuUsage: Math.round(cpuUsage),
            memoryUsage: Math.round(memoryUsage),
            errorRate: Math.round(errorRate * 100) / 100,
            activeAlerts,
            uptime: process.uptime(),
            timestamp: new Date().toISOString()
        };
    }

    // 대시보드 데이터 가져오기
    getDashboardData() {
        return {
            system: {
                cpuUsage: this.getCurrentCpuUsage(),
                memoryUsage: this.getCurrentMemoryUsage(),
                diskUsage: 0, // 실제 구현 필요
                networkUsage: 0 // 실제 구현 필요
            },
            application: {
                httpRequests: this.metrics.application.httpRequests._value || 0,
                activeConnections: this.metrics.application.activeConnections._value || 0,
                errorRate: this.calculateErrorRate()
            },
            database: {
                connections: this.metrics.database.connections._value || 0,
                queryDuration: 0 // 실제 구현 필요
            },
            business: {
                userSessions: this.metrics.business.userSessions._value || 0,
                contentCreated: this.metrics.business.contentCreated._value || 0
            },
            alerts: this.alerts.slice(-10), // 최근 10개 알림
            notifications: this.notifications.slice(-10) // 최근 10개 알림
        };
    }
}

// 싱글톤 인스턴스
const monitoringSystem = new MonitoringSystem();

module.exports = {
    monitoringSystem,
    MonitoringSystem
};
