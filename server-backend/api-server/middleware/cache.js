const { redisClient } = require('../config/redis');
const logger = require('../utils/logger');

// Redis 캐시 미들웨어
const cache = (duration = 300) => {
    return async (req, res, next) => {
        try {
            const key = `cache:${req.originalUrl}`;

            // 캐시에서 데이터 조회
            const cachedData = await redisClient.get(key);

            if (cachedData) {
                logger.debug(`Cache hit for ${key}`);
                return res.json(JSON.parse(cachedData));
            }

            // 원본 응답 함수 저장
            const originalSend = res.json;
            res.json = function (data) {
                // 성공적인 응답만 캐시
                if (res.statusCode === 200) {
                    redisClient.setex(key, duration, JSON.stringify(data));
                    logger.debug(`Cached data for ${key}`);
                }
                return originalSend.call(this, data);
            };

            next();
        } catch (error) {
            logger.error('Cache middleware error:', error);
            next();
        }
    };
};

// 캐시 무효화
const invalidateCache = async (pattern) => {
    try {
        const keys = await redisClient.keys(pattern);
        if (keys.length > 0) {
            await redisClient.del(keys);
            logger.info(`Invalidated ${keys.length} cache entries`);
        }
    } catch (error) {
        logger.error('Cache invalidation error:', error);
    }
};

// 메모리 캐시 (Redis가 없을 때 사용)
const memoryCache = new Map();

const memoryCacheMiddleware = (duration = 300) => {
    return (req, res, next) => {
        const key = `memory:${req.originalUrl}`;
        const now = Date.now();

        // 캐시에서 데이터 조회
        const cached = memoryCache.get(key);
        if (cached && (now - cached.timestamp) < duration * 1000) {
            logger.debug(`Memory cache hit for ${key}`);
            return res.json(cached.data);
        }

        // 원본 응답 함수 저장
        const originalSend = res.json;
        res.json = function (data) {
            if (res.statusCode === 200) {
                memoryCache.set(key, {
                    data,
                    timestamp: now
                });
                logger.debug(`Memory cached data for ${key}`);
            }
            return originalSend.call(this, data);
        };

        next();
    };
};

module.exports = {
    cache,
    invalidateCache,
    memoryCacheMiddleware
};
