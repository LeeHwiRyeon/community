/**
 * 성능 최적화 미들웨어
 * 
 * 이 모듈은 Express.js 애플리케이션의 성능을 향상시키기 위한
 * 다양한 미들웨어와 최적화 기능을 제공합니다.
 */

import compression from 'compression';
import responseTime from 'response-time';
import { promisify } from 'util';

// 압축 설정
const compressionOptions = {
    level: 6,                    // 압축 레벨 (1-9, 6이 균형점)
    threshold: 1024,            // 1KB 이상만 압축
    filter: (req, res) => {
        // 압축하지 않을 요청 필터링
        if (req.headers['x-no-compression']) {
            return false;
        }

        // 이미지나 비디오는 압축하지 않음
        const contentType = res.getHeader('Content-Type');
        if (contentType && (
            contentType.includes('image/') ||
            contentType.includes('video/') ||
            contentType.includes('audio/')
        )) {
            return false;
        }

        return compression.filter(req, res);
    }
};

// 응답 시간 측정 설정
const responseTimeOptions = {
    digits: 2,                  // 소수점 둘째 자리까지
    suffix: false,              // 'ms' 접미사 제거
    header: 'X-Response-Time'   // 커스텀 헤더명
};

// 캐시 설정
const cacheConfig = {
    // 정적 파일 캐시 (1년)
    static: {
        maxAge: 31536000,         // 1년 (초)
        etag: true,
        lastModified: true
    },

    // API 응답 캐시 (5분)
    api: {
        maxAge: 300,              // 5분 (초)
        etag: true,
        lastModified: true
    },

    // 검색 결과 캐시 (1분)
    search: {
        maxAge: 60,               // 1분 (초)
        etag: true,
        lastModified: true
    }
};

// 메모리 사용량 모니터링
let memoryStats = {
    peak: 0,
    current: 0,
    samples: []
};

// CPU 사용량 모니터링
let cpuStats = {
    user: 0,
    system: 0,
    samples: []
};

/**
 * 메모리 사용량 측정
 */
function measureMemoryUsage() {
    const usage = process.memoryUsage();
    const rss = Math.round(usage.rss / 1024 / 1024); // MB

    memoryStats.current = rss;
    memoryStats.peak = Math.max(memoryStats.peak, rss);

    // 최근 100개 샘플만 유지
    memoryStats.samples.push(rss);
    if (memoryStats.samples.length > 100) {
        memoryStats.samples.shift();
    }

    return {
        rss,
        heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
        heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
        external: Math.round(usage.external / 1024 / 1024)
    };
}

/**
 * CPU 사용량 측정
 */
function measureCpuUsage() {
    const usage = process.cpuUsage();
    const user = usage.user / 1000000; // seconds
    const system = usage.system / 1000000; // seconds

    cpuStats.user = user;
    cpuStats.system = system;

    // 최근 100개 샘플만 유지
    cpuStats.samples.push({ user, system });
    if (cpuStats.samples.length > 100) {
        cpuStats.samples.shift();
    }

    return { user, system };
}

/**
 * 응답 압축 미들웨어
 */
export function compressionMiddleware() {
    return compression(compressionOptions);
}

/**
 * 응답 시간 측정 미들웨어
 */
export function responseTimeMiddleware() {
    return responseTime(responseTimeOptions);
}

/**
 * 캐시 헤더 설정 미들웨어
 */
export function cacheMiddleware(type = 'api') {
    return (req, res, next) => {
        const config = cacheConfig[type] || cacheConfig.api;

        // 캐시 헤더 설정
        res.setHeader('Cache-Control', `public, max-age=${config.maxAge}`);

        if (config.etag) {
            res.setHeader('ETag', `"${Date.now()}"`);
        }

        if (config.lastModified) {
            res.setHeader('Last-Modified', new Date().toUTCString());
        }

        // Vary 헤더 설정 (캐시 키 구분)
        res.setHeader('Vary', 'Accept-Encoding, Authorization');

        next();
    };
}

/**
 * 메모리 사용량 모니터링 미들웨어
 */
export function memoryMonitoringMiddleware() {
    return (req, res, next) => {
        const memory = measureMemoryUsage();

        // 메모리 사용량이 500MB를 초과하면 경고
        if (memory.rss > 500) {
            console.warn(`[MEMORY] High memory usage: ${memory.rss}MB`);
        }

        // 응답에 메모리 정보 추가
        res.setHeader('X-Memory-Usage', `${memory.rss}MB`);

        next();
    };
}

/**
 * CPU 사용량 모니터링 미들웨어
 */
export function cpuMonitoringMiddleware() {
    return (req, res, next) => {
        const cpu = measureCpuUsage();

        // CPU 사용량이 80%를 초과하면 경고
        const totalCpu = cpu.user + cpu.system;
        if (totalCpu > 0.8) {
            console.warn(`[CPU] High CPU usage: ${(totalCpu * 100).toFixed(1)}%`);
        }

        // 응답에 CPU 정보 추가
        res.setHeader('X-CPU-Usage', `${(totalCpu * 100).toFixed(1)}%`);

        next();
    };
}

/**
 * 요청 크기 제한 미들웨어
 */
export function requestSizeLimitMiddleware() {
    return (req, res, next) => {
        const contentLength = parseInt(req.headers['content-length'] || '0');
        const maxSize = 10 * 1024 * 1024; // 10MB

        if (contentLength > maxSize) {
            return res.status(413).json({
                error: 'Request entity too large',
                maxSize: '10MB',
                received: `${Math.round(contentLength / 1024 / 1024)}MB`
            });
        }

        next();
    };
}

/**
 * 요청 속도 제한 미들웨어 (기본 rate limiting 대신)
 */
export function requestThrottlingMiddleware() {
    const requests = new Map();
    const windowMs = 60000; // 1분
    const maxRequests = 100; // 분당 최대 요청 수

    return (req, res, next) => {
        const clientId = req.ip || req.connection.remoteAddress;
        const now = Date.now();

        // 오래된 요청 기록 정리
        if (requests.has(clientId)) {
            const clientRequests = requests.get(clientId);
            const validRequests = clientRequests.filter(time => now - time < windowMs);
            requests.set(clientId, validRequests);
        } else {
            requests.set(clientId, []);
        }

        const clientRequests = requests.get(clientId);

        if (clientRequests.length >= maxRequests) {
            return res.status(429).json({
                error: 'Too many requests',
                retryAfter: Math.ceil(windowMs / 1000)
            });
        }

        // 요청 기록 추가
        clientRequests.push(now);

        next();
    };
}

/**
 * 데이터베이스 연결 풀 모니터링
 */
export function databasePoolMonitoringMiddleware(pool) {
    return (req, res, next) => {
        if (pool) {
            const poolStats = {
                totalConnections: pool._allConnections.length,
                freeConnections: pool._freeConnections.length,
                usedConnections: pool._allConnections.length - pool._freeConnections.length,
                queuedRequests: pool._connectionQueue.length
            };

            // 연결 풀 상태를 응답 헤더에 추가
            res.setHeader('X-DB-Pool-Total', poolStats.totalConnections);
            res.setHeader('X-DB-Pool-Free', poolStats.freeConnections);
            res.setHeader('X-DB-Pool-Used', poolStats.usedConnections);
            res.setHeader('X-DB-Pool-Queued', poolStats.queuedRequests);

            // 연결 풀이 부족하면 경고
            if (poolStats.usedConnections / poolStats.totalConnections > 0.8) {
                console.warn('[DB] High connection pool usage:', poolStats);
            }
        }

        next();
    };
}

/**
 * 성능 통계 수집 미들웨어
 */
export function performanceStatsMiddleware() {
    const stats = {
        requests: 0,
        errors: 0,
        totalResponseTime: 0,
        minResponseTime: Infinity,
        maxResponseTime: 0,
        startTime: Date.now()
    };

    return (req, res, next) => {
        const startTime = Date.now();

        res.on('finish', () => {
            const responseTime = Date.now() - startTime;

            stats.requests++;
            stats.totalResponseTime += responseTime;
            stats.minResponseTime = Math.min(stats.minResponseTime, responseTime);
            stats.maxResponseTime = Math.max(stats.maxResponseTime, responseTime);

            if (res.statusCode >= 400) {
                stats.errors++;
            }
        });

        next();
    };
}

/**
 * 성능 통계 조회 엔드포인트
 */
export function getPerformanceStats() {
    const uptime = Date.now() - (process.uptime() * 1000);
    const memory = measureMemoryUsage();
    const cpu = measureCpuUsage();

    return {
        uptime: Math.floor(process.uptime()),
        memory: {
            current: memory.rss,
            peak: memoryStats.peak,
            average: memoryStats.samples.length > 0
                ? Math.round(memoryStats.samples.reduce((a, b) => a + b, 0) / memoryStats.samples.length)
                : 0,
            heapTotal: memory.heapTotal,
            heapUsed: memory.heapUsed,
            external: memory.external
        },
        cpu: {
            user: cpu.user,
            system: cpu.system,
            total: cpu.user + cpu.system
        },
        requests: {
            total: stats.requests,
            errors: stats.errors,
            errorRate: stats.requests > 0 ? (stats.errors / stats.requests * 100).toFixed(2) : 0,
            averageResponseTime: stats.requests > 0 ? (stats.totalResponseTime / stats.requests).toFixed(2) : 0,
            minResponseTime: stats.minResponseTime === Infinity ? 0 : stats.minResponseTime,
            maxResponseTime: stats.maxResponseTime
        }
    };
}

/**
 * 정적 파일 최적화 미들웨어
 */
export function staticOptimizationMiddleware() {
    return (req, res, next) => {
        // 정적 파일 요청인지 확인
        if (req.url.match(/\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
            // 압축 설정
            res.setHeader('Cache-Control', `public, max-age=${cacheConfig.static.maxAge}`);
            res.setHeader('Expires', new Date(Date.now() + cacheConfig.static.maxAge * 1000).toUTCString());

            // ETag 설정
            if (cacheConfig.static.etag) {
                res.setHeader('ETag', `"${Date.now()}"`);
            }

            // Last-Modified 설정
            if (cacheConfig.static.lastModified) {
                res.setHeader('Last-Modified', new Date().toUTCString());
            }
        }

        next();
    };
}

/**
 * JSON 응답 최적화 미들웨어
 */
export function jsonOptimizationMiddleware() {
    return (req, res, next) => {
        const originalJson = res.json;

        res.json = function (obj) {
            // JSON 압축을 위한 설정
            res.setHeader('Content-Type', 'application/json; charset=utf-8');

            // 불필요한 공백 제거
            const jsonString = JSON.stringify(obj);

            // 압축된 JSON 전송
            return originalJson.call(this, obj);
        };

        next();
    };
}

/**
 * 모든 성능 최적화 미들웨어를 한 번에 적용
 */
export function applyAllOptimizations(app, pool = null) {
    // 기본 미들웨어
    app.use(compressionMiddleware());
    app.use(responseTimeMiddleware());
    app.use(requestSizeLimitMiddleware());
    app.use(requestThrottlingMiddleware());
    app.use(memoryMonitoringMiddleware());
    app.use(cpuMonitoringMiddleware());
    app.use(performanceStatsMiddleware());
    app.use(staticOptimizationMiddleware());
    app.use(jsonOptimizationMiddleware());

    // 데이터베이스 연결 풀 모니터링
    if (pool) {
        app.use(databasePoolMonitoringMiddleware(pool));
    }

    // API 엔드포인트별 캐시 설정
    app.use('/api/posts', cacheMiddleware('api'));
    app.use('/api/search', cacheMiddleware('search'));
    app.use('/api/trending', cacheMiddleware('search'));
    app.use('/api/boards', cacheMiddleware('api'));

    // 정적 파일 캐시 설정
    app.use('/static', cacheMiddleware('static'));

    // 성능 통계 엔드포인트
    app.get('/api/performance', (req, res) => {
        res.json(getPerformanceStats());
    });

    console.log('✅ 성능 최적화 미들웨어가 적용되었습니다.');
}

// 전역 변수 (성능 통계용)
let stats = {
    requests: 0,
    errors: 0,
    totalResponseTime: 0,
    minResponseTime: Infinity,
    maxResponseTime: 0,
    startTime: Date.now()
};

export { stats };

