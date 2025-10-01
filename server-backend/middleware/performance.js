const { logger } = require('../utils/logger');

/**
 * API 성능 최적화 미들웨어
 * - 응답 시간 측정
 * - 캐싱 헬퍼
 * - 요청 제한
 * - 압축
 */

// 응답 시간 측정 미들웨어
const responseTimeMiddleware = (req, res, next) => {
    const startTime = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - startTime;
        const logData = {
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            userAgent: req.get('User-Agent'),
            ip: req.ip
        };

        // 성능 로깅
        if (duration > 1000) {
            logger.warning('느린 API 응답 감지:', logData);
        } else if (duration > 500) {
            logger.info('API 응답 시간:', logData);
        }

        // 메트릭 수집 (실제로는 Prometheus 등에 전송)
        collectAPIMetrics(logData);
    });

    next();
};

// 캐싱 헬퍼
class CacheHelper {
    constructor() {
        this.cache = new Map();
        this.defaultTTL = 300000; // 5분
    }

    set(key, value, ttl = this.defaultTTL) {
        const expiry = Date.now() + ttl;
        this.cache.set(key, { value, expiry });
    }

    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;

        if (Date.now() > item.expiry) {
            this.cache.delete(key);
            return null;
        }

        return item.value;
    }

    delete(key) {
        this.cache.delete(key);
    }

    clear() {
        this.cache.clear();
    }

    // 정기적으로 만료된 캐시 정리
    cleanup() {
        const now = Date.now();
        for (const [key, item] of this.cache.entries()) {
            if (now > item.expiry) {
                this.cache.delete(key);
            }
        }
    }
}

const cacheHelper = new CacheHelper();

// 캐시 미들웨어
const cacheMiddleware = (ttl = 300000) => {
    return (req, res, next) => {
        // GET 요청만 캐싱
        if (req.method !== 'GET') {
            return next();
        }

        const cacheKey = `${req.method}:${req.originalUrl}:${JSON.stringify(req.query)}`;
        const cached = cacheHelper.get(cacheKey);

        if (cached) {
            logger.info(`캐시 히트: ${cacheKey}`);
            return res.json(cached);
        }

        // 원본 응답 함수 저장
        const originalJson = res.json;
        res.json = function (data) {
            // 성공 응답만 캐싱
            if (res.statusCode >= 200 && res.statusCode < 300) {
                cacheHelper.set(cacheKey, data, ttl);
                logger.info(`캐시 저장: ${cacheKey}`);
            }
            return originalJson.call(this, data);
        };

        next();
    };
};

// 요청 제한 미들웨어
const rateLimitMiddleware = (windowMs = 60000, maxRequests = 100) => {
    const requests = new Map();

    return (req, res, next) => {
        const clientId = req.ip;
        const now = Date.now();
        const windowStart = now - windowMs;

        // 클라이언트별 요청 기록 정리
        if (!requests.has(clientId)) {
            requests.set(clientId, []);
        }

        const clientRequests = requests.get(clientId);
        const recentRequests = clientRequests.filter(time => time > windowStart);
        requests.set(clientId, recentRequests);

        // 요청 수 확인
        if (recentRequests.length >= maxRequests) {
            logger.warning(`요청 제한 초과: ${clientId}`, {
                ip: clientId,
                requests: recentRequests.length,
                limit: maxRequests
            });

            return res.status(429).json({
                success: false,
                message: '요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.',
                retryAfter: Math.ceil(windowMs / 1000)
            });
        }

        // 요청 기록 추가
        recentRequests.push(now);
        requests.set(clientId, recentRequests);

        next();
    };
};

// 압축 미들웨어 설정
const compressionMiddleware = (req, res, next) => {
    const acceptEncoding = req.headers['accept-encoding'] || '';

    if (acceptEncoding.includes('gzip')) {
        res.setHeader('Content-Encoding', 'gzip');
        res.setHeader('Vary', 'Accept-Encoding');
    } else if (acceptEncoding.includes('deflate')) {
        res.setHeader('Content-Encoding', 'deflate');
        res.setHeader('Vary', 'Accept-Encoding');
    }

    next();
};

// 페이지네이션 헬퍼
const paginationHelper = (req, defaultLimit = 20, maxLimit = 100) => {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(maxLimit, Math.max(1, parseInt(req.query.limit) || defaultLimit));
    const offset = (page - 1) * limit;

    return {
        page,
        limit,
        offset,
        pagination: {
            page,
            limit,
            total: 0, // 실제 구현에서는 total count 설정
            totalPages: 0,
            hasNext: false,
            hasPrev: page > 1
        }
    };
};

// 배치 처리 헬퍼
const batchProcessor = (items, batchSize = 100, processor) => {
    return new Promise(async (resolve, reject) => {
        try {
            const results = [];

            for (let i = 0; i < items.length; i += batchSize) {
                const batch = items.slice(i, i + batchSize);
                const batchResult = await processor(batch);
                results.push(...batchResult);

                // 배치 간 짧은 지연 (DB 부하 방지)
                if (i + batchSize < items.length) {
                    await new Promise(resolve => setTimeout(resolve, 10));
                }
            }

            resolve(results);
        } catch (error) {
            reject(error);
        }
    });
};

// 메트릭 수집 함수
const collectAPIMetrics = (logData) => {
    // 실제로는 Prometheus, InfluxDB 등에 메트릭 전송
    const metrics = {
        api_requests_total: 1,
        api_request_duration_ms: parseInt(logData.duration),
        api_requests_by_status: {
            [logData.statusCode]: 1
        }
    };

    // 메모리 기반 간단한 통계 (실제로는 Redis 등 사용)
    if (!global.apiMetrics) {
        global.apiMetrics = {
            totalRequests: 0,
            totalDuration: 0,
            statusCodes: {},
            slowRequests: 0
        };
    }

    global.apiMetrics.totalRequests++;
    global.apiMetrics.totalDuration += parseInt(logData.duration);
    global.apiMetrics.statusCodes[logData.statusCode] = (global.apiMetrics.statusCodes[logData.statusCode] || 0) + 1;

    if (parseInt(logData.duration) > 1000) {
        global.apiMetrics.slowRequests++;
    }
};

// 성능 통계 조회
const getPerformanceStats = () => {
    if (!global.apiMetrics) {
        return {
            totalRequests: 0,
            averageResponseTime: 0,
            statusCodes: {},
            slowRequestRate: 0
        };
    }

    const { totalRequests, totalDuration, statusCodes, slowRequests } = global.apiMetrics;

    return {
        totalRequests,
        averageResponseTime: totalRequests > 0 ? Math.round(totalDuration / totalRequests) : 0,
        statusCodes,
        slowRequestRate: totalRequests > 0 ? (slowRequests / totalRequests * 100).toFixed(2) : 0
    };
};

// 정기적인 캐시 정리
setInterval(() => {
    cacheHelper.cleanup();
}, 300000); // 5분마다

module.exports = {
    responseTimeMiddleware,
    cacheMiddleware,
    rateLimitMiddleware,
    compressionMiddleware,
    paginationHelper,
    batchProcessor,
    cacheHelper,
    getPerformanceStats
};
