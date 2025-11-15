/**
 * Cache Middleware
 * 
 * Redis 기반 응답 캐싱 미들웨어
 * - GET 요청에 대한 자동 캐싱
 * - 캐시 히트/미스 헤더 추가
 * - 조건부 캐싱 (인증, 쿼리 파라미터 고려)
 */

import redisService from '../services/redisService.js';

/**
 * 캐시 미들웨어 생성
 * @param {number} ttl - 캐시 만료 시간 (초)
 * @param {object} options - 캐시 옵션
 */
export function cacheMiddleware(ttl = 300, options = {}) {
    const {
        includeQuery = true, // 쿼리 파라미터를 캐시 키에 포함
        includeUserId = false, // 사용자별 캐시 분리
        condition = null // 캐싱 조건 함수
    } = options;

    return async (req, res, next) => {
        // POST, PUT, DELETE 요청은 캐싱하지 않음
        if (req.method !== 'GET') {
            return next();
        }

        // 조건 함수가 있고 조건을 만족하지 않으면 스킵
        if (condition && !condition(req)) {
            return next();
        }

        try {
            // 캐시 키 생성
            let cacheKey = `cache:${req.path}`;

            // 쿼리 파라미터 포함
            if (includeQuery && Object.keys(req.query).length > 0) {
                const queryString = JSON.stringify(req.query);
                cacheKey += `:${Buffer.from(queryString).toString('base64')}`;
            }

            // 사용자 ID 포함
            if (includeUserId && req.user?.id) {
                cacheKey += `:user:${req.user.id}`;
            }

            // 캐시에서 데이터 조회
            const cachedData = await redisService.get(cacheKey);

            if (cachedData) {
                // 캐시 히트
                await redisService.trackCacheHit(cacheKey);
                res.set('X-Cache', 'HIT');
                res.set('X-Cache-Key', cacheKey);
                return res.json(cachedData);
            }

            // 캐시 미스 - 원본 응답 저장
            await redisService.trackCacheMiss(cacheKey);
            res.set('X-Cache', 'MISS');
            res.set('X-Cache-Key', cacheKey);

            // 원본 res.json 함수 저장
            const originalJson = res.json.bind(res);

            // res.json 오버라이드
            res.json = function (data) {
                // 성공 응답만 캐싱 (2xx)
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    // 비동기로 캐시 저장 (응답 속도에 영향 없음)
                    redisService.set(cacheKey, data, ttl).catch(err => {
                        console.error('❌ Cache save error:', err.message);
                    });
                }

                // 원본 응답 전송
                return originalJson(data);
            };

            next();
        } catch (error) {
            console.error('❌ Cache middleware error:', error.message);
            // 에러 발생 시 캐싱 없이 진행
            next();
        }
    };
}

/**
 * 캐시 무효화 미들웨어
 * POST, PUT, DELETE 요청 후 관련 캐시 삭제
 */
export function invalidateCacheMiddleware(patterns) {
    return async (req, res, next) => {
        // 원본 응답 함수 저장
        const originalJson = res.json.bind(res);
        const originalSend = res.send.bind(res);

        // 응답 후 캐시 무효화
        const invalidateCache = async () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                try {
                    for (const pattern of patterns) {
                        // 패턴이 함수인 경우 실행
                        const actualPattern = typeof pattern === 'function'
                            ? pattern(req)
                            : pattern;

                        await redisService.deletePattern(`cache:${actualPattern}`);
                    }
                } catch (error) {
                    console.error('❌ Cache invalidation error:', error.message);
                }
            }
        };

        // res.json 오버라이드
        res.json = function (data) {
            invalidateCache().catch(console.error);
            return originalJson(data);
        };

        // res.send 오버라이드
        res.send = function (data) {
            invalidateCache().catch(console.error);
            return originalSend(data);
        };

        next();
    };
}

/**
 * 세션 캐싱 미들웨어
 * 사용자 세션을 Redis에 저장
 */
export function sessionCacheMiddleware() {
    return async (req, res, next) => {
        if (req.user?.id) {
            const sessionKey = `session:${req.sessionID || req.user.id}`;

            // 세션 데이터 Redis에 저장
            await redisService.setSession(sessionKey, {
                userId: req.user.id,
                username: req.user.username,
                lastActivity: new Date().toISOString()
            }, 86400); // 24시간
        }

        next();
    };
}

/**
 * Rate Limiting 미들웨어
 */
export function rateLimitMiddleware(limit, windowSeconds = 60) {
    return async (req, res, next) => {
        const userId = req.user?.id || req.ip;
        const action = `${req.method}:${req.path}`;

        try {
            const result = await redisService.checkRateLimit(
                userId,
                action,
                limit,
                windowSeconds
            );

            // Rate limit 헤더 추가
            res.set('X-RateLimit-Limit', result.limit);
            res.set('X-RateLimit-Remaining', Math.max(0, result.limit - result.current));
            res.set('X-RateLimit-Reset', result.resetIn);

            if (!result.allowed) {
                return res.status(429).json({
                    error: 'Too many requests',
                    message: `Rate limit exceeded. Try again in ${result.resetIn} seconds.`,
                    retryAfter: result.resetIn
                });
            }

            next();
        } catch (error) {
            console.error('❌ Rate limit middleware error:', error.message);
            // 에러 발생 시 요청 허용 (안전장치)
            next();
        }
    };
}

export default {
    cacheMiddleware,
    invalidateCacheMiddleware,
    sessionCacheMiddleware,
    rateLimitMiddleware
};
