const { EventEmitter } = require('events');
const { performance } = require('perf_hooks');
const os = require('os');
const fs = require('fs');
const path = require('path');

class AdvancedMonitoringService extends EventEmitter {
    constructor() {
        super();
        this.metrics = {
            system: {},
            application: {},
            business: {},
            custom: {},
        };
        this.alerts = [];
        this.thresholds = {
            cpu: 80,
            memory: 85,
            disk: 90,
            responseTime: 1000,
            errorRate: 5,
            requestRate: 1000,
        };
        this.isMonitoring = false;
        this.monitoringInterval = null;
    }

    // 모니터링 시작
    startMonitoring(interval = 5000) {
        if (this.isMonitoring) {
            console.log('모니터링이 이미 실행 중입니다.');
            return;
        }

        this.isMonitoring = true;
        this.monitoringInterval = setInterval(() => {
            this.collectMetrics();
            this.checkThresholds();
            this.emit('metricsCollected', this.metrics);
        }, interval);

        console.log(`고급 모니터링이 시작되었습니다. (${interval}ms 간격)`);
    }

    // 모니터링 중지
    stopMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
        this.isMonitoring = false;
        console.log('모니터링이 중지되었습니다.');
    }

    // 메트릭 수집
    collectMetrics() {
        this.collectSystemMetrics();
        this.collectApplicationMetrics();
        this.collectBusinessMetrics();
    }

    // 시스템 메트릭 수집
    collectSystemMetrics() {
        const cpus = os.cpus();
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMem = totalMem - freeMem;

        // CPU 사용률 계산
        let cpuUsage = 0;
        if (this.metrics.system.cpu) {
            const prevCpu = this.metrics.system.cpu;
            const currentCpu = cpus.reduce((acc, cpu) => {
                const total = Object.values(cpu.times).reduce((a, b) => a + b, 0);
                const idle = cpu.times.idle;
                return acc + (total - idle) / total;
            }, 0) / cpus.length;

            cpuUsage = ((currentCpu - prevCpu) * 100).toFixed(2);
        }

        // 디스크 사용률 계산
        const diskUsage = this.getDiskUsage();

        this.metrics.system = {
            cpu: {
                usage: parseFloat(cpuUsage),
                cores: cpus.length,
                model: cpus[0].model,
            },
            memory: {
                total: totalMem,
                used: usedMem,
                free: freeMem,
                usage: ((usedMem / totalMem) * 100).toFixed(2),
            },
            disk: {
                usage: diskUsage,
                free: this.getFreeDiskSpace(),
            },
            uptime: os.uptime(),
            loadAverage: os.loadavg(),
            platform: os.platform(),
            arch: os.arch(),
            hostname: os.hostname(),
        };
    }

    // 애플리케이션 메트릭 수집
    collectApplicationMetrics() {
        const memUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();

        this.metrics.application = {
            memory: {
                rss: memUsage.rss,
                heapTotal: memUsage.heapTotal,
                heapUsed: memUsage.heapUsed,
                external: memUsage.external,
                arrayBuffers: memUsage.arrayBuffers,
            },
            cpu: {
                user: cpuUsage.user,
                system: cpuUsage.system,
            },
            uptime: process.uptime(),
            pid: process.pid,
            version: process.version,
            platform: process.platform,
            nodeVersion: process.versions.node,
            v8Version: process.versions.v8,
        };
    }

    // 비즈니스 메트릭 수집
    collectBusinessMetrics() {
        // 이 메트릭들은 실제 애플리케이션에서 수집되어야 함
        this.metrics.business = {
            activeUsers: this.getActiveUsers(),
            totalPosts: this.getTotalPosts(),
            totalComments: this.getTotalComments(),
            newUsersToday: this.getNewUsersToday(),
            postsToday: this.getPostsToday(),
            commentsToday: this.getCommentsToday(),
            averageSessionDuration: this.getAverageSessionDuration(),
            conversionRate: this.getConversionRate(),
        };
    }

    // 커스텀 메트릭 추가
    addCustomMetric(name, value, tags = {}) {
        if (!this.metrics.custom[name]) {
            this.metrics.custom[name] = [];
        }

        this.metrics.custom[name].push({
            value,
            tags,
            timestamp: new Date().toISOString(),
        });

        // 최대 1000개 항목만 유지
        if (this.metrics.custom[name].length > 1000) {
            this.metrics.custom[name] = this.metrics.custom[name].slice(-1000);
        }
    }

    // 임계값 확인
    checkThresholds() {
        const alerts = [];

        // CPU 사용률 확인
        if (this.metrics.system.cpu.usage > this.thresholds.cpu) {
            alerts.push({
                type: 'cpu',
                severity: 'warning',
                message: `CPU 사용률이 ${this.metrics.system.cpu.usage}%로 임계값 ${this.thresholds.cpu}%를 초과했습니다.`,
                value: this.metrics.system.cpu.usage,
                threshold: this.thresholds.cpu,
                timestamp: new Date().toISOString(),
            });
        }

        // 메모리 사용률 확인
        if (parseFloat(this.metrics.system.memory.usage) > this.thresholds.memory) {
            alerts.push({
                type: 'memory',
                severity: 'warning',
                message: `메모리 사용률이 ${this.metrics.system.memory.usage}%로 임계값 ${this.thresholds.memory}%를 초과했습니다.`,
                value: parseFloat(this.metrics.system.memory.usage),
                threshold: this.thresholds.memory,
                timestamp: new Date().toISOString(),
            });
        }

        // 디스크 사용률 확인
        if (this.metrics.system.disk.usage > this.thresholds.disk) {
            alerts.push({
                type: 'disk',
                severity: 'critical',
                message: `디스크 사용률이 ${this.metrics.system.disk.usage}%로 임계값 ${this.thresholds.disk}%를 초과했습니다.`,
                value: this.metrics.system.disk.usage,
                threshold: this.thresholds.disk,
                timestamp: new Date().toISOString(),
            });
        }

        // 알림 발송
        alerts.forEach(alert => {
            this.emit('alert', alert);
            this.alerts.push(alert);
        });

        // 최대 1000개 알림만 유지
        if (this.alerts.length > 1000) {
            this.alerts = this.alerts.slice(-1000);
        }
    }

    // 디스크 사용률 계산
    getDiskUsage() {
        try {
            const stats = fs.statSync(process.cwd());
            // 실제 구현에서는 더 정확한 디스크 사용률 계산 필요
            return Math.random() * 100; // 임시 값
        } catch (error) {
            return 0;
        }
    }

    // 사용 가능한 디스크 공간 계산
    getFreeDiskSpace() {
        try {
            const stats = fs.statSync(process.cwd());
            // 실제 구현에서는 더 정확한 디스크 공간 계산 필요
            return 1000000000; // 임시 값 (1GB)
        } catch (error) {
            return 0;
        }
    }

    // 활성 사용자 수 (실제 구현 필요)
    getActiveUsers() {
        return Math.floor(Math.random() * 1000) + 100; // 임시 값
    }

    // 총 게시글 수 (실제 구현 필요)
    getTotalPosts() {
        return Math.floor(Math.random() * 10000) + 1000; // 임시 값
    }

    // 총 댓글 수 (실제 구현 필요)
    getTotalComments() {
        return Math.floor(Math.random() * 50000) + 5000; // 임시 값
    }

    // 오늘 신규 사용자 수 (실제 구현 필요)
    getNewUsersToday() {
        return Math.floor(Math.random() * 50) + 5; // 임시 값
    }

    // 오늘 게시글 수 (실제 구현 필요)
    getPostsToday() {
        return Math.floor(Math.random() * 100) + 10; // 임시 값
    }

    // 오늘 댓글 수 (실제 구현 필요)
    getCommentsToday() {
        return Math.floor(Math.random() * 500) + 50; // 임시 값
    }

    // 평균 세션 지속 시간 (실제 구현 필요)
    getAverageSessionDuration() {
        return Math.floor(Math.random() * 1800) + 300; // 5-35분 (초 단위)
    }

    // 전환율 (실제 구현 필요)
    getConversionRate() {
        return (Math.random() * 10 + 2).toFixed(2); // 2-12%
    }

    // 성능 메트릭 추가
    addPerformanceMetric(name, duration, metadata = {}) {
        this.addCustomMetric(`performance.${name}`, duration, {
            ...metadata,
            type: 'performance',
        });
    }

    // 비즈니스 메트릭 추가
    addBusinessMetric(name, value, metadata = {}) {
        this.addCustomMetric(`business.${name}`, value, {
            ...metadata,
            type: 'business',
        });
    }

    // 에러 메트릭 추가
    addErrorMetric(error, context = {}) {
        this.addCustomMetric('errors', 1, {
            message: error.message,
            stack: error.stack,
            ...context,
            type: 'error',
        });
    }

    // 메트릭 내보내기
    exportMetrics() {
        return {
            timestamp: new Date().toISOString(),
            metrics: this.metrics,
            alerts: this.alerts.slice(-100), // 최근 100개 알림만
            thresholds: this.thresholds,
            isMonitoring: this.isMonitoring,
        };
    }

    // 메트릭 히스토리 가져오기
    getMetricHistory(metricName, hours = 24) {
        const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);

        if (this.metrics.custom[metricName]) {
            return this.metrics.custom[metricName].filter(
                metric => new Date(metric.timestamp) > cutoff
            );
        }

        return [];
    }

    // 알림 히스토리 가져오기
    getAlertHistory(hours = 24) {
        const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
        return this.alerts.filter(alert => new Date(alert.timestamp) > cutoff);
    }

    // 임계값 설정
    setThreshold(type, value) {
        if (this.thresholds.hasOwnProperty(type)) {
            this.thresholds[type] = value;
            console.log(`${type} 임계값이 ${value}로 설정되었습니다.`);
        } else {
            console.error(`알 수 없는 임계값 타입: ${type}`);
        }
    }

    // 임계값 가져오기
    getThresholds() {
        return { ...this.thresholds };
    }

    // 메트릭 초기화
    resetMetrics() {
        this.metrics = {
            system: {},
            application: {},
            business: {},
            custom: {},
        };
        this.alerts = [];
        console.log('메트릭이 초기화되었습니다.');
    }

    // 상태 확인
    getStatus() {
        return {
            isMonitoring: this.isMonitoring,
            metricsCount: Object.keys(this.metrics.custom).length,
            alertsCount: this.alerts.length,
            uptime: process.uptime(),
            lastUpdate: new Date().toISOString(),
        };
    }

    // 헬스 체크
    healthCheck() {
        const health = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            checks: {},
        };

        // CPU 체크
        if (this.metrics.system.cpu && this.metrics.system.cpu.usage > 90) {
            health.checks.cpu = { status: 'critical', value: this.metrics.system.cpu.usage };
            health.status = 'critical';
        } else if (this.metrics.system.cpu && this.metrics.system.cpu.usage > 80) {
            health.checks.cpu = { status: 'warning', value: this.metrics.system.cpu.usage };
            if (health.status === 'healthy') health.status = 'warning';
        } else {
            health.checks.cpu = { status: 'ok', value: this.metrics.system.cpu?.usage || 0 };
        }

        // 메모리 체크
        if (this.metrics.system.memory && parseFloat(this.metrics.system.memory.usage) > 90) {
            health.checks.memory = { status: 'critical', value: this.metrics.system.memory.usage };
            health.status = 'critical';
        } else if (this.metrics.system.memory && parseFloat(this.metrics.system.memory.usage) > 80) {
            health.checks.memory = { status: 'warning', value: this.metrics.system.memory.usage };
            if (health.status === 'healthy') health.status = 'warning';
        } else {
            health.checks.memory = { status: 'ok', value: this.metrics.system.memory?.usage || 0 };
        }

        // 디스크 체크
        if (this.metrics.system.disk && this.metrics.system.disk.usage > 95) {
            health.checks.disk = { status: 'critical', value: this.metrics.system.disk.usage };
            health.status = 'critical';
        } else if (this.metrics.system.disk && this.metrics.system.disk.usage > 85) {
            health.checks.disk = { status: 'warning', value: this.metrics.system.disk.usage };
            if (health.status === 'healthy') health.status = 'warning';
        } else {
            health.checks.disk = { status: 'ok', value: this.metrics.system.disk?.usage || 0 };
        }

        return health;
    }
}

module.exports = AdvancedMonitoringService;
