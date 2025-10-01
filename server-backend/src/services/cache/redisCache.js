import { createClient } from 'redis';
import logger from '../../logger.js';

/**
 * Redis Cache Service
 * Provides comprehensive caching functionality for the application
 */

class RedisCacheService {
    constructor() {
        this.client = null;
        this.isConnected = false;
        this.defaultTTL = 3600; // 1 hour
        this.maxRetries = 3;
        this.retryDelay = 1000; // 1 second
    }

    /**
     * Initialize Redis connection
     */
    async initialize() {
        try {
            this.client = createClient({
                host: process.env.REDIS_HOST || 'localhost',
                port: process.env.REDIS_PORT || 6379,
                password: process.env.REDIS_PASSWORD,
                retry_strategy: (options) => {
                    if (options.error && options.error.code === 'ECONNREFUSED') {
                        logger.error('Redis connection refused');
                        return new Error('Redis connection refused');
                    }
                    if (options.total_retry_time > 1000 * 60 * 60) {
                        logger.error('Redis retry time exhausted');
                        return new Error('Retry time exhausted');
                    }
                    if (options.attempt > this.maxRetries) {
                        logger.error('Redis max retries exceeded');
                        return undefined;
                    }
                    return Math.min(options.attempt * this.retryDelay, 3000);
                }
            });

            this.client.on('error', (err) => {
                logger.error('Redis client error:', err);
                this.isConnected = false;
            });

            this.client.on('connect', () => {
                logger.info('Redis client connected');
                this.isConnected = true;
            });

            this.client.on('ready', () => {
                logger.info('Redis client ready');
                this.isConnected = true;
            });

            this.client.on('end', () => {
                logger.warn('Redis client connection ended');
                this.isConnected = false;
            });

            await this.client.connect();
            return true;
        } catch (error) {
            logger.error('Failed to initialize Redis:', error);
            return false;
        }
    }

    /**
     * Check if Redis is connected
     */
    isReady() {
        return this.isConnected && this.client;
    }

    /**
     * Get value from cache
     * @param {string} key - Cache key
     * @returns {Promise<any>} - Cached value or null
     */
    async get(key) {
        if (!this.isReady()) {
            logger.warn('Redis not ready, skipping get operation');
            return null;
        }

        try {
            const value = await this.client.get(key);
            if (value) {
                logger.debug(`Cache hit for key: ${key}`);
                return JSON.parse(value);
            }
            logger.debug(`Cache miss for key: ${key}`);
            return null;
        } catch (error) {
            logger.error(`Error getting cache key ${key}:`, error);
            return null;
        }
    }

    /**
     * Set value in cache
     * @param {string} key - Cache key
     * @param {any} value - Value to cache
     * @param {number} ttl - Time to live in seconds
     * @returns {Promise<boolean>} - Success status
     */
    async set(key, value, ttl = this.defaultTTL) {
        if (!this.isReady()) {
            logger.warn('Redis not ready, skipping set operation');
            return false;
        }

        try {
            const serializedValue = JSON.stringify(value);
            await this.client.setEx(key, ttl, serializedValue);
            logger.debug(`Cache set for key: ${key}, TTL: ${ttl}s`);
            return true;
        } catch (error) {
            logger.error(`Error setting cache key ${key}:`, error);
            return false;
        }
    }

    /**
     * Delete value from cache
     * @param {string} key - Cache key
     * @returns {Promise<boolean>} - Success status
     */
    async del(key) {
        if (!this.isReady()) {
            logger.warn('Redis not ready, skipping delete operation');
            return false;
        }

        try {
            const result = await this.client.del(key);
            logger.debug(`Cache delete for key: ${key}, result: ${result}`);
            return result > 0;
        } catch (error) {
            logger.error(`Error deleting cache key ${key}:`, error);
            return false;
        }
    }

    /**
     * Delete multiple keys from cache
     * @param {string[]} keys - Array of cache keys
     * @returns {Promise<number>} - Number of keys deleted
     */
    async delMultiple(keys) {
        if (!this.isReady()) {
            logger.warn('Redis not ready, skipping delete multiple operation');
            return 0;
        }

        if (keys.length === 0) return 0;

        try {
            const result = await this.client.del(keys);
            logger.debug(`Cache delete multiple for ${keys.length} keys, result: ${result}`);
            return result;
        } catch (error) {
            logger.error(`Error deleting multiple cache keys:`, error);
            return 0;
        }
    }

    /**
     * Check if key exists in cache
     * @param {string} key - Cache key
     * @returns {Promise<boolean>} - Exists status
     */
    async exists(key) {
        if (!this.isReady()) {
            return false;
        }

        try {
            const result = await this.client.exists(key);
            return result === 1;
        } catch (error) {
            logger.error(`Error checking cache key existence ${key}:`, error);
            return false;
        }
    }

    /**
     * Get TTL for a key
     * @param {string} key - Cache key
     * @returns {Promise<number>} - TTL in seconds, -1 if no TTL, -2 if key doesn't exist
     */
    async ttl(key) {
        if (!this.isReady()) {
            return -2;
        }

        try {
            return await this.client.ttl(key);
        } catch (error) {
            logger.error(`Error getting TTL for cache key ${key}:`, error);
            return -2;
        }
    }

    /**
     * Set TTL for a key
     * @param {string} key - Cache key
     * @param {number} ttl - Time to live in seconds
     * @returns {Promise<boolean>} - Success status
     */
    async expire(key, ttl) {
        if (!this.isReady()) {
            return false;
        }

        try {
            const result = await this.client.expire(key, ttl);
            logger.debug(`Cache expire for key: ${key}, TTL: ${ttl}s, result: ${result}`);
            return result === 1;
        } catch (error) {
            logger.error(`Error setting TTL for cache key ${key}:`, error);
            return false;
        }
    }

    /**
     * Get or set pattern (cache-aside pattern)
     * @param {string} key - Cache key
     * @param {Function} fetchFunction - Function to fetch data if not in cache
     * @param {number} ttl - Time to live in seconds
     * @returns {Promise<any>} - Cached or fetched value
     */
    async getOrSet(key, fetchFunction, ttl = this.defaultTTL) {
        try {
            // Try to get from cache first
            let value = await this.get(key);

            if (value !== null) {
                return value;
            }

            // If not in cache, fetch from source
            value = await fetchFunction();

            if (value !== null && value !== undefined) {
                // Store in cache
                await this.set(key, value, ttl);
            }

            return value;
        } catch (error) {
            logger.error(`Error in getOrSet for key ${key}:`, error);
            // If cache fails, try to fetch directly
            try {
                return await fetchFunction();
            } catch (fetchError) {
                logger.error(`Error fetching data for key ${key}:`, fetchError);
                throw fetchError;
            }
        }
    }

    /**
     * Invalidate cache by pattern
     * @param {string} pattern - Pattern to match keys
     * @returns {Promise<number>} - Number of keys deleted
     */
    async invalidatePattern(pattern) {
        if (!this.isReady()) {
            return 0;
        }

        try {
            const keys = await this.client.keys(pattern);
            if (keys.length === 0) {
                return 0;
            }

            const result = await this.delMultiple(keys);
            logger.info(`Cache invalidated pattern: ${pattern}, keys deleted: ${result}`);
            return result;
        } catch (error) {
            logger.error(`Error invalidating cache pattern ${pattern}:`, error);
            return 0;
        }
    }

    /**
     * Get cache statistics
     * @returns {Promise<Object>} - Cache statistics
     */
    async getStats() {
        if (!this.isReady()) {
            return {
                connected: false,
                memory: null,
                keys: 0,
                hitRate: 0
            };
        }

        try {
            const info = await this.client.info('memory');
            const keyspace = await this.client.info('keyspace');
            const stats = await this.client.info('stats');

            // Parse memory info
            const memoryMatch = info.match(/used_memory_human:([^\r\n]+)/);
            const memory = memoryMatch ? memoryMatch[1].trim() : null;

            // Parse keyspace info
            const keyspaceMatch = keyspace.match(/db0:keys=(\d+)/);
            const keys = keyspaceMatch ? parseInt(keyspaceMatch[1]) : 0;

            // Parse stats info
            const hitsMatch = stats.match(/keyspace_hits:(\d+)/);
            const missesMatch = stats.match(/keyspace_misses:(\d+)/);
            const hits = hitsMatch ? parseInt(hitsMatch[1]) : 0;
            const misses = missesMatch ? parseInt(missesMatch[1]) : 0;
            const hitRate = hits + misses > 0 ? (hits / (hits + misses)) * 100 : 0;

            return {
                connected: true,
                memory,
                keys,
                hitRate: Math.round(hitRate * 100) / 100
            };
        } catch (error) {
            logger.error('Error getting cache stats:', error);
            return {
                connected: false,
                memory: null,
                keys: 0,
                hitRate: 0
            };
        }
    }

    /**
     * Clear all cache
     * @returns {Promise<boolean>} - Success status
     */
    async clear() {
        if (!this.isReady()) {
            return false;
        }

        try {
            await this.client.flushAll();
            logger.info('Cache cleared');
            return true;
        } catch (error) {
            logger.error('Error clearing cache:', error);
            return false;
        }
    }

    /**
     * Close Redis connection
     */
    async close() {
        if (this.client) {
            try {
                await this.client.quit();
                this.isConnected = false;
                logger.info('Redis connection closed');
            } catch (error) {
                logger.error('Error closing Redis connection:', error);
            }
        }
    }
}

// Create singleton instance
const redisCache = new RedisCacheService();

export default redisCache;
