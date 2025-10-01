import redisCache from '../services/cache/redisCache.js';
import { createHash } from 'crypto';
import logger from '../logger.js';

/**
 * Cache middleware for Express routes
 * Provides intelligent caching for API responses
 */

/**
 * Generate cache key from request
 * @param {Object} req - Express request object
 * @param {string} prefix - Cache key prefix
 * @returns {string} - Generated cache key
 */
const generateCacheKey = (req, prefix = 'api') => {
    const { method, url, query, body, user } = req;

    // Create hash of request data
    const requestData = {
        method,
        url,
        query,
        body: method === 'GET' ? null : body, // Only include body for non-GET requests
        userId: user?.id || 'anonymous'
    };

    const hash = createHash('md5')
        .update(JSON.stringify(requestData))
        .digest('hex');

    return `${prefix}:${method.toLowerCase()}:${hash}`;
};

/**
 * Cache middleware factory
 * @param {Object} options - Cache options
 * @returns {Function} - Express middleware function
 */
export const createCacheMiddleware = (options = {}) => {
    const {
        ttl = 300, // 5 minutes default
        skipCache = false,
        keyGenerator = generateCacheKey,
        condition = (req, res) => res.statusCode === 200,
        skipIf = (req, res) => false,
        varyBy = ['user', 'query'], // What to vary cache by
        tags = [] // Cache tags for invalidation
    } = options;

    return async (req, res, next) => {
        // Skip cache if disabled
        if (skipCache || !redisCache.isReady()) {
            return next();
        }

        // Skip cache based on condition
        if (skipIf(req, res)) {
            return next();
        }

        // Only cache GET requests by default
        if (req.method !== 'GET') {
            return next();
        }

        const cacheKey = keyGenerator(req, 'api');

        try {
            // Try to get from cache
            const cachedResponse = await redisCache.get(cacheKey);

            if (cachedResponse) {
                logger.debug(`Cache hit for ${req.method} ${req.url}`);

                // Set response headers
                res.set('X-Cache', 'HIT');
                res.set('X-Cache-Key', cacheKey);

                // Return cached response
                return res.json(cachedResponse);
            }

            // Cache miss - intercept response
            const originalJson = res.json;
            const originalSend = res.send;

            res.json = function (data) {
                // Only cache successful responses
                if (condition(req, res)) {
                    // Add cache metadata
                    const responseData = {
                        ...data,
                        _cache: {
                            key: cacheKey,
                            timestamp: new Date().toISOString(),
                            ttl
                        }
                    };

                    // Store in cache
                    redisCache.set(cacheKey, responseData, ttl).catch(error => {
                        logger.error('Error storing response in cache:', error);
                    });

                    // Add cache tags if provided
                    if (tags.length > 0) {
                        tags.forEach(tag => {
                            redisCache.set(`${tag}:${cacheKey}`, true, ttl).catch(error => {
                                logger.error('Error storing cache tag:', error);
                            });
                        });
                    }

                    logger.debug(`Cache stored for ${req.method} ${req.url}`);
                }

                // Set response headers
                res.set('X-Cache', 'MISS');
                res.set('X-Cache-Key', cacheKey);

                // Call original json method
                return originalJson.call(this, data);
            };

            res.send = function (data) {
                // Only cache successful responses
                if (condition(req, res)) {
                    // Store in cache
                    redisCache.set(cacheKey, data, ttl).catch(error => {
                        logger.error('Error storing response in cache:', error);
                    });

                    logger.debug(`Cache stored for ${req.method} ${req.url}`);
                }

                // Set response headers
                res.set('X-Cache', 'MISS');
                res.set('X-Cache-Key', cacheKey);

                // Call original send method
                return originalSend.call(this, data);
            };

            next();
        } catch (error) {
            logger.error('Cache middleware error:', error);
            next();
        }
    };
};

/**
 * Cache invalidation middleware
 * @param {Object} options - Invalidation options
 * @returns {Function} - Express middleware function
 */
export const createCacheInvalidationMiddleware = (options = {}) => {
    const {
        patterns = [],
        tags = [],
        skipIf = (req, res) => false
    } = options;

    return async (req, res, next) => {
        // Skip invalidation based on condition
        if (skipIf(req, res)) {
            return next();
        }

        try {
            // Invalidate by patterns
            for (const pattern of patterns) {
                await redisCache.invalidatePattern(pattern);
            }

            // Invalidate by tags
            for (const tag of tags) {
                await redisCache.invalidatePattern(`${tag}:*`);
            }

            logger.info(`Cache invalidated for ${req.method} ${req.url}`);
        } catch (error) {
            logger.error('Cache invalidation error:', error);
        }

        next();
    };
};

/**
 * Cache warming middleware
 * @param {Object} options - Warming options
 * @returns {Function} - Express middleware function
 */
export const createCacheWarmingMiddleware = (options = {}) => {
    const {
        warmupFunction,
        ttl = 300,
        keyGenerator = generateCacheKey
    } = options;

    return async (req, res, next) => {
        if (!warmupFunction || !redisCache.isReady()) {
            return next();
        }

        try {
            const cacheKey = keyGenerator(req, 'warmup');

            // Check if already warmed
            const exists = await redisCache.exists(cacheKey);
            if (exists) {
                return next();
            }

            // Warm up cache
            const data = await warmupFunction(req);
            if (data) {
                await redisCache.set(cacheKey, data, ttl);
                logger.info(`Cache warmed for ${req.method} ${req.url}`);
            }
        } catch (error) {
            logger.error('Cache warming error:', error);
        }

        next();
    };
};

/**
 * Cache statistics middleware
 * @returns {Function} - Express middleware function
 */
export const cacheStatsMiddleware = async (req, res, next) => {
    if (req.path === '/api/cache/stats') {
        try {
            const stats = await redisCache.getStats();
            return res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            logger.error('Error getting cache stats:', error);
            return res.status(500).json({
                success: false,
                error: {
                    message: 'Failed to get cache statistics',
                    code: 'CACHE_STATS_ERROR'
                }
            });
        }
    }

    next();
};

/**
 * Cache health check middleware
 * @returns {Function} - Express middleware function
 */
export const cacheHealthMiddleware = async (req, res, next) => {
    if (req.path === '/api/cache/health') {
        try {
            const isReady = redisCache.isReady();
            const stats = await redisCache.getStats();

            return res.json({
                success: true,
                data: {
                    ready: isReady,
                    connected: stats.connected,
                    memory: stats.memory,
                    keys: stats.keys,
                    hitRate: stats.hitRate
                }
            });
        } catch (error) {
            logger.error('Error checking cache health:', error);
            return res.status(500).json({
                success: false,
                error: {
                    message: 'Failed to check cache health',
                    code: 'CACHE_HEALTH_ERROR'
                }
            });
        }
    }

    next();
};

/**
 * Predefined cache configurations
 */
export const cacheConfigs = {
    // Posts cache - 1 hour
    posts: {
        ttl: 3600,
        patterns: ['api:get:*posts*'],
        tags: ['posts']
    },

    // User cache - 30 minutes
    users: {
        ttl: 1800,
        patterns: ['api:get:*users*', 'api:get:*profile*'],
        tags: ['users']
    },

    // Comments cache - 15 minutes
    comments: {
        ttl: 900,
        patterns: ['api:get:*comments*'],
        tags: ['comments']
    },

    // Boards cache - 2 hours
    boards: {
        ttl: 7200,
        patterns: ['api:get:*boards*'],
        tags: ['boards']
    },

    // Search cache - 5 minutes
    search: {
        ttl: 300,
        patterns: ['api:get:*search*'],
        tags: ['search']
    },

    // Translation cache - 24 hours
    translation: {
        ttl: 86400,
        patterns: ['api:post:*translate*'],
        tags: ['translation']
    }
};

export default {
    createCacheMiddleware,
    createCacheInvalidationMiddleware,
    createCacheWarmingMiddleware,
    cacheStatsMiddleware,
    cacheHealthMiddleware,
    cacheConfigs
};
