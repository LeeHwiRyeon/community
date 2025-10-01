const promClient = require('prom-client');
const os = require('os');

// Prometheus 메트릭 등록
const register = new promClient.Registry();

// HTTP 요청 지속 시간 히스토그램
const httpRequestDuration = new promClient.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});

// 데이터베이스 쿼리 지속 시간 히스토그램
const databaseQueryDuration = new promClient.Histogram({
    name: 'database_query_duration_seconds',
    help: 'Duration of database queries in seconds',
    labelNames: ['query_type', 'table'],
    buckets: [0.01, 0.05, 0.1, 0.2, 0.5, 1, 2, 5]
});

// 메모리 사용량 게이지
const memoryUsage = new promClient.Gauge({
    name: 'nodejs_memory_usage_bytes',
    help: 'Node.js memory usage in bytes',
    labelNames: ['type']
});

// CPU 사용량 게이지
const cpuUsage = new promClient.Gauge({
    name: 'nodejs_cpu_usage_percent',
    help: 'Node.js CPU usage percentage'
});

// 활성 연결 수 게이지
const activeConnections = new promClient.Gauge({
    name: 'nodejs_active_connections',
    help: 'Number of active connections'
});

// 요청 수 카운터
const httpRequestsTotal = new promClient.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code']
});

// 에러 수 카운터
const httpErrorsTotal = new promClient.Counter({
    name: 'http_errors_total',
    help: 'Total number of HTTP errors',
    labelNames: ['method', 'route', 'error_type']
});

// 메트릭 등록
register.registerMetric(httpRequestDuration);
register.registerMetric(databaseQueryDuration);
register.registerMetric(memoryUsage);
register.registerMetric(cpuUsage);
register.registerMetric(activeConnections);
register.registerMetric(httpRequestsTotal);
register.registerMetric(httpErrorsTotal);

// 메모리 사용량 모니터링
setInterval(() => {
    const memUsage = process.memoryUsage();
    memoryUsage.set({ type: 'rss' }, memUsage.rss);
    memoryUsage.set({ type: 'heapTotal' }, memUsage.heapTotal);
    memoryUsage.set({ type: 'heapUsed' }, memUsage.heapUsed);
    memoryUsage.set({ type: 'external' }, memUsage.external);
    memoryUsage.set({ type: 'arrayBuffers' }, memUsage.arrayBuffers);
}, 5000);

// CPU 사용량 모니터링
let lastCpuUsage = process.cpuUsage();
setInterval(() => {
    const currentCpuUsage = process.cpuUsage(lastCpuUsage);
    const cpuPercent = (currentCpuUsage.user + currentCpuUsage.system) / 1000000; // 마이크로초를 초로 변환
    cpuUsage.set(cpuPercent);
    lastCpuUsage = process.cpuUsage();
}, 5000);

// 성능 모니터링 클래스
class PerformanceMonitor {
    constructor() {
        this.startTime = Date.now();
        this.requestCount = 0;
        this.errorCount = 0;
        this.activeConnections = 0;
    }

    // HTTP 요청 시작
    startRequest(req, res, next) {
        const startTime = Date.now();
        this.requestCount++;
        this.activeConnections++;

        // 응답 완료 시 메트릭 업데이트
        res.on('finish', () => {
            const duration = (Date.now() - startTime) / 1000;
            const route = req.route ? req.route.path : req.path;
            const method = req.method;
            const statusCode = res.statusCode;

            // 히스토그램 업데이트
            httpRequestDuration
                .labels(method, route, statusCode.toString())
                .observe(duration);

            // 카운터 업데이트
            httpRequestsTotal
                .labels(method, route, statusCode.toString())
                .inc();

            // 에러 카운터 업데이트
            if (statusCode >= 400) {
                this.errorCount++;
                httpErrorsTotal
                    .labels(method, route, this.getErrorType(statusCode))
                    .inc();
            }

            this.activeConnections--;
            activeConnections.set(this.activeConnections);
        });

        next();
    }

    // 데이터베이스 쿼리 시간 측정
    measureDatabaseQuery(queryType, table, queryFn) {
        const startTime = Date.now();

        return queryFn().then(result => {
            const duration = (Date.now() - startTime) / 1000;
            databaseQueryDuration
                .labels(queryType, table)
                .observe(duration);
            return result;
        }).catch(error => {
            const duration = (Date.now() - startTime) / 1000;
            databaseQueryDuration
                .labels(queryType, table)
                .observe(duration);
            throw error;
        });
    }

    // 에러 타입 분류
    getErrorType(statusCode) {
        if (statusCode >= 500) return 'server_error';
        if (statusCode >= 400) return 'client_error';
        return 'unknown';
    }

    // 성능 통계 가져오기
    getStats() {
        const uptime = Date.now() - this.startTime;
        const memUsage = process.memoryUsage();

        return {
            uptime: Math.floor(uptime / 1000), // 초 단위
            requestCount: this.requestCount,
            errorCount: this.errorCount,
            errorRate: this.requestCount > 0 ? (this.errorCount / this.requestCount) * 100 : 0,
            activeConnections: this.activeConnections,
            memoryUsage: {
                rss: Math.round(memUsage.rss / 1024 / 1024), // MB
                heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
                heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
                external: Math.round(memUsage.external / 1024 / 1024), // MB
            },
            cpuUsage: process.cpuUsage(),
            loadAverage: os.loadavg()
        };
    }

    // 메트릭 데이터 가져오기
    async getMetrics() {
        return register.metrics();
    }

    // 헬스 체크
    getHealthStatus() {
        const stats = this.getStats();
        const memUsagePercent = (stats.memoryUsage.heapUsed / stats.memoryUsage.heapTotal) * 100;

        let status = 'healthy';
        let issues = [];

        // 메모리 사용량 체크
        if (memUsagePercent > 80) {
            status = 'warning';
            issues.push(`High memory usage: ${memUsagePercent.toFixed(2)}%`);
        }

        // 에러율 체크
        if (stats.errorRate > 5) {
            status = 'warning';
            issues.push(`High error rate: ${stats.errorRate.toFixed(2)}%`);
        }

        // 활성 연결 수 체크
        if (stats.activeConnections > 1000) {
            status = 'warning';
            issues.push(`High active connections: ${stats.activeConnections}`);
        }

        return {
            status,
            issues,
            stats
        };
    }
}

// 싱글톤 인스턴스
const performanceMonitor = new PerformanceMonitor();

module.exports = {
    performanceMonitor,
    register,
    httpRequestDuration,
    databaseQueryDuration,
    memoryUsage,
    cpuUsage,
    activeConnections,
    httpRequestsTotal,
    httpErrorsTotal
};
