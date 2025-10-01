const { performance } = require('perf_hooks');
const fs = require('fs');
const path = require('path');

// 성능 메트릭 수집
class PerformanceCollector {
    constructor() {
        this.metrics = {
            requests: [],
            responseTimes: [],
            memoryUsage: [],
            errors: [],
            slowQueries: [],
        };
        this.startTime = Date.now();
    }

    // 요청 시작 시간 기록
    startRequest(req) {
        req.startTime = performance.now();
        req.memoryStart = process.memoryUsage();
    }

    // 요청 완료 시간 기록
    endRequest(req, res) {
        const endTime = performance.now();
        const duration = endTime - req.startTime;
        const memoryEnd = process.memoryUsage();

        const requestMetric = {
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode,
            duration: duration,
            memoryDelta: {
                rss: memoryEnd.rss - req.memoryStart.rss,
                heapUsed: memoryEnd.heapUsed - req.memoryStart.heapUsed,
            },
            timestamp: new Date().toISOString(),
            userAgent: req.get('User-Agent'),
            ip: req.ip,
        };

        this.metrics.requests.push(requestMetric);
        this.metrics.responseTimes.push(duration);

        // 느린 요청 기록 (1초 이상)
        if (duration > 1000) {
            this.metrics.slowQueries.push(requestMetric);
        }

        // 에러 기록
        if (res.statusCode >= 400) {
            this.metrics.errors.push(requestMetric);
        }

        // 메모리 사용량 기록
        this.metrics.memoryUsage.push({
            rss: memoryEnd.rss,
            heapTotal: memoryEnd.heapTotal,
            heapUsed: memoryEnd.heapUsed,
            external: memoryEnd.external,
            timestamp: new Date().toISOString(),
        });

        // 메트릭 정리 (최대 1000개 유지)
        if (this.metrics.requests.length > 1000) {
            this.metrics.requests = this.metrics.requests.slice(-500);
        }
        if (this.metrics.responseTimes.length > 1000) {
            this.metrics.responseTimes = this.metrics.responseTimes.slice(-500);
        }
        if (this.metrics.memoryUsage.length > 1000) {
            this.metrics.memoryUsage = this.metrics.memoryUsage.slice(-500);
        }
    }

    // 통계 계산
    getStats() {
        const now = Date.now();
        const uptime = now - this.startTime;

        const responseTimes = this.metrics.responseTimes;
        const avgResponseTime = responseTimes.length > 0
            ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
            : 0;

        const sortedResponseTimes = [...responseTimes].sort((a, b) => a - b);
        const p95 = sortedResponseTimes[Math.floor(sortedResponseTimes.length * 0.95)] || 0;
        const p99 = sortedResponseTimes[Math.floor(sortedResponseTimes.length * 0.99)] || 0;

        const errorRate = this.metrics.requests.length > 0
            ? (this.metrics.errors.length / this.metrics.requests.length) * 100
            : 0;

        const slowQueryRate = this.metrics.requests.length > 0
            ? (this.metrics.slowQueries.length / this.metrics.requests.length) * 100
            : 0;

        return {
            uptime: uptime,
            totalRequests: this.metrics.requests.length,
            avgResponseTime: Math.round(avgResponseTime * 100) / 100,
            p95ResponseTime: Math.round(p95 * 100) / 100,
            p99ResponseTime: Math.round(p99 * 100) / 100,
            errorRate: Math.round(errorRate * 100) / 100,
            slowQueryRate: Math.round(slowQueryRate * 100) / 100,
            totalErrors: this.metrics.errors.length,
            totalSlowQueries: this.metrics.slowQueries.length,
            memoryUsage: this.getCurrentMemoryUsage(),
        };
    }

    // 현재 메모리 사용량
    getCurrentMemoryUsage() {
        const memUsage = process.memoryUsage();
        return {
            rss: Math.round(memUsage.rss / 1024 / 1024), // MB
            heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
            heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
            external: Math.round(memUsage.external / 1024 / 1024), // MB
        };
    }

    // 메트릭 내보내기
    exportMetrics() {
        const stats = this.getStats();
        const report = {
            timestamp: new Date().toISOString(),
            stats: stats,
            recentRequests: this.metrics.requests.slice(-10),
            recentErrors: this.metrics.errors.slice(-10),
            recentSlowQueries: this.metrics.slowQueries.slice(-10),
        };

        return report;
    }

    // 메트릭 초기화
    reset() {
        this.metrics = {
            requests: [],
            responseTimes: [],
            memoryUsage: [],
            errors: [],
            slowQueries: [],
        };
        this.startTime = Date.now();
    }
}

// 전역 성능 수집기 인스턴스
const performanceCollector = new PerformanceCollector();

// 성능 미들웨어
const performanceMiddleware = (req, res, next) => {
    // 요청 시작 시간 기록
    performanceCollector.startRequest(req);

    // 응답 완료 시 메트릭 기록
    res.on('finish', () => {
        performanceCollector.endRequest(req, res);
    });

    next();
};

// 데이터베이스 쿼리 성능 모니터링
const queryPerformanceMiddleware = (req, res, next) => {
    const originalQuery = req.db?.query;

    if (originalQuery) {
        req.db.query = function (sql, params) {
            const startTime = performance.now();

            return originalQuery.call(this, sql, params)
                .then(result => {
                    const duration = performance.now() - startTime;

                    // 느린 쿼리 기록 (100ms 이상)
                    if (duration > 100) {
                        performanceCollector.metrics.slowQueries.push({
                            type: 'database',
                            query: sql,
                            duration: duration,
                            timestamp: new Date().toISOString(),
                        });
                    }

                    return result;
                })
                .catch(error => {
                    const duration = performance.now() - startTime;

                    performanceCollector.metrics.errors.push({
                        type: 'database',
                        query: sql,
                        error: error.message,
                        duration: duration,
                        timestamp: new Date().toISOString(),
                    });

                    throw error;
                });
        };
    }

    next();
};

// 메모리 사용량 모니터링
const memoryMonitoringMiddleware = (req, res, next) => {
    const memUsage = process.memoryUsage();

    // 메모리 사용량이 높은 경우 경고
    if (memUsage.heapUsed > 100 * 1024 * 1024) { // 100MB 이상
        console.warn(`높은 메모리 사용량: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`);
    }

    // 메모리 누수 감지
    if (global.gc) {
        const beforeGC = memUsage.heapUsed;
        global.gc();
        const afterGC = process.memoryUsage().heapUsed;
        const freed = beforeGC - afterGC;

        if (freed > 10 * 1024 * 1024) { // 10MB 이상 해제
            console.log(`가비지 컬렉션: ${Math.round(freed / 1024 / 1024)}MB 해제`);
        }
    }

    next();
};

// 응답 시간 제한 미들웨어
const responseTimeLimitMiddleware = (maxTime = 5000) => {
    return (req, res, next) => {
        const startTime = performance.now();

        // 응답 시간 제한 설정
        const timeout = setTimeout(() => {
            if (!res.headersSent) {
                res.status(504).json({
                    error: 'Gateway Timeout',
                    message: '요청 처리 시간이 초과되었습니다.',
                    timeout: maxTime,
                });
            }
        }, maxTime);

        // 응답 완료 시 타이머 해제
        res.on('finish', () => {
            clearTimeout(timeout);
        });

        res.on('close', () => {
            clearTimeout(timeout);
        });

        next();
    };
};

// 성능 보고서 생성
const generatePerformanceReport = () => {
    const report = performanceCollector.exportMetrics();

    // 보고서 파일 저장
    const reportsDir = path.join(__dirname, '../../reports');
    if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
    }

    const reportPath = path.join(reportsDir, `performance-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    return report;
};

// 성능 최적화 권장사항
const getOptimizationRecommendations = () => {
    const stats = performanceCollector.getStats();
    const recommendations = [];

    if (stats.avgResponseTime > 200) {
        recommendations.push('평균 응답 시간이 200ms를 초과합니다. 데이터베이스 쿼리 최적화가 필요합니다.');
    }

    if (stats.p95ResponseTime > 500) {
        recommendations.push('95% 응답 시간이 500ms를 초과합니다. 캐싱 전략을 구현하세요.');
    }

    if (stats.errorRate > 1) {
        recommendations.push('에러율이 1%를 초과합니다. 에러 처리 로직을 검토하세요.');
    }

    if (stats.slowQueryRate > 5) {
        recommendations.push('느린 쿼리 비율이 5%를 초과합니다. 데이터베이스 인덱스를 최적화하세요.');
    }

    if (stats.memoryUsage.heapUsed > 100) {
        recommendations.push('힙 메모리 사용량이 100MB를 초과합니다. 메모리 누수를 확인하세요.');
    }

    return recommendations;
};

// 성능 모니터링 시작
const startPerformanceMonitoring = () => {
    // 5분마다 성능 보고서 생성
    setInterval(() => {
        const report = generatePerformanceReport();
        console.log('성능 보고서 생성:', report.stats);
    }, 5 * 60 * 1000);

    // 1시간마다 메트릭 초기화
    setInterval(() => {
        performanceCollector.reset();
        console.log('성능 메트릭 초기화');
    }, 60 * 60 * 1000);
};

module.exports = {
    performanceMiddleware,
    queryPerformanceMiddleware,
    memoryMonitoringMiddleware,
    responseTimeLimitMiddleware,
    generatePerformanceReport,
    getOptimizationRecommendations,
    startPerformanceMonitoring,
    performanceCollector,
};
