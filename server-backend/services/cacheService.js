const Redis = require('redis');
const { logger } = require('../utils/logger');

/**
 * Redis 기반 캐싱 서비스
 * - 메모리 캐싱
 * - 분산 캐싱
 * - 캐시 무효화
 * - 성능 모니터링
 */

class CacheService {
    constructor() {
        this.redis = null;
        this.memoryCache = new Map();
        this.isConnected = false;
        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0,
            errors: 0
        };
    }

    /**
     * Redis 연결 초기화
     */
    async initialize() {
        try {
            this.redis = Redis.createClient({
                host: process.env.REDIS_HOST || 'localhost',
                port: process.env.REDIS_PORT || 6379,
                password: process.env.REDIS_PASSWORD || null,
                db: process.env.REDIS_DB || 0,
                retry_strategy: (options) => {
                    if (options.error && options.error.code === 'ECONNREFUSED') {
                        logger.error('Redis 서버 연결 실패, 메모리 캐시 사용');
                        return new Error('Redis 서버 연결 실패');
                    }
                    if (options.total_retry_time > 1000 * 60 * 60) {
                        return new Error('Redis 재시도 시간 초과');
                    }
                    if (options.attempt > 10) {
                        return undefined;
                    }
                    return Math.min(options.attempt * 100, 3000);
                }
            });

            this.redis.on('connect', () => {
                logger.info('Redis 연결 성공');
                this.isConnected = true;
            });

            this.redis.on('error', (error) => {
                logger.error('Redis 오류:', error);
                this.isConnected = false;
                this.stats.errors++;
            });

            this.redis.on('end', () => {
                logger.warning('Redis 연결 종료');
                this.isConnected = false;
            });

            await this.redis.connect();
            return true;
        } catch (error) {
            logger.error('Redis 초기화 실패, 메모리 캐시 사용:', error);
            this.isConnected = false;
            return false;
        }
    }

    /**
     * 캐시에서 값 조회
     */
    async get(key) {
        try {
            // Redis 사용 가능한 경우
            if (this.isConnected && this.redis) {
                const value = await this.redis.get(key);
                if (value !== null) {
                    this.stats.hits++;
                    logger.debug(`Redis 캐시 히트: ${key}`);
                    return JSON.parse(value);
                }
            }

            // 메모리 캐시에서 조회
            const memoryValue = this.memoryCache.get(key);
            if (memoryValue && memoryValue.expiry > Date.now()) {
                this.stats.hits++;
                logger.debug(`메모리 캐시 히트: ${key}`);
                return memoryValue.value;
            }

            // 만료된 메모리 캐시 삭제
            if (memoryValue) {
                this.memoryCache.delete(key);
            }

            this.stats.misses++;
            logger.debug(`캐시 미스: ${key}`);
            return null;
        } catch (error) {
            logger.error(`캐시 조회 오류: ${key}`, error);
            this.stats.errors++;
            return null;
        }
    }

    /**
     * 캐시에 값 저장
     */
    async set(key, value, ttl = 3600) {
        try {
            const serializedValue = JSON.stringify(value);
            const expiry = Date.now() + (ttl * 1000);

            // Redis 사용 가능한 경우
            if (this.isConnected && this.redis) {
                await this.redis.setex(key, ttl, serializedValue);
                logger.debug(`Redis 캐시 저장: ${key} (TTL: ${ttl}s)`);
            }

            // 메모리 캐시에도 저장 (백업용)
            this.memoryCache.set(key, {
                value: value,
                expiry: expiry
            });

            this.stats.sets++;
            return true;
        } catch (error) {
            logger.error(`캐시 저장 오류: ${key}`, error);
            this.stats.errors++;
            return false;
        }
    }

    /**
     * 캐시에서 값 삭제
     */
    async delete(key) {
        try {
            // Redis에서 삭제
            if (this.isConnected && this.redis) {
                await this.redis.del(key);
            }

            // 메모리 캐시에서도 삭제
            this.memoryCache.delete(key);

            this.stats.deletes++;
            logger.debug(`캐시 삭제: ${key}`);
            return true;
        } catch (error) {
            logger.error(`캐시 삭제 오류: ${key}`, error);
            this.stats.errors++;
            return false;
        }
    }

    /**
     * 패턴으로 캐시 삭제
     */
    async deletePattern(pattern) {
        try {
            if (this.isConnected && this.redis) {
                const keys = await this.redis.keys(pattern);
                if (keys.length > 0) {
                    await this.redis.del(...keys);
                    logger.info(`패턴 캐시 삭제: ${pattern} (${keys.length}개 키)`);
                }
            }

            // 메모리 캐시에서도 패턴 매칭 삭제
            const regex = new RegExp(pattern.replace(/\*/g, '.*'));
            for (const key of this.memoryCache.keys()) {
                if (regex.test(key)) {
                    this.memoryCache.delete(key);
                }
            }

            return true;
        } catch (error) {
            logger.error(`패턴 캐시 삭제 오류: ${pattern}`, error);
            return false;
        }
    }

    /**
     * 캐시 존재 여부 확인
     */
    async exists(key) {
        try {
            if (this.isConnected && this.redis) {
                const exists = await this.redis.exists(key);
                return exists === 1;
            }

            const memoryValue = this.memoryCache.get(key);
            return memoryValue && memoryValue.expiry > Date.now();
        } catch (error) {
            logger.error(`캐시 존재 확인 오류: ${key}`, error);
            return false;
        }
    }

    /**
     * 캐시 TTL 설정
     */
    async expire(key, ttl) {
        try {
            if (this.isConnected && this.redis) {
                await this.redis.expire(key, ttl);
            }

            // 메모리 캐시 TTL 업데이트
            const memoryValue = this.memoryCache.get(key);
            if (memoryValue) {
                memoryValue.expiry = Date.now() + (ttl * 1000);
            }

            return true;
        } catch (error) {
            logger.error(`캐시 TTL 설정 오류: ${key}`, error);
            return false;
        }
    }

    /**
     * 캐시 통계 조회
     */
    getStats() {
        const hitRate = this.stats.hits + this.stats.misses > 0
            ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2)
            : 0;

        return {
            ...this.stats,
            hitRate: `${hitRate}%`,
            memoryCacheSize: this.memoryCache.size,
            isConnected: this.isConnected
        };
    }

    /**
     * 캐시 초기화
     */
    async flush() {
        try {
            if (this.isConnected && this.redis) {
                await this.redis.flushdb();
            }

            this.memoryCache.clear();
            logger.info('캐시 초기화 완료');
            return true;
        } catch (error) {
            logger.error('캐시 초기화 오류:', error);
            return false;
        }
    }

    /**
     * 캐시 헬퍼 메서드들
     */

    // 사용자 정보 캐싱
    async cacheUser(userId, userData, ttl = 1800) {
        return await this.set(`user:${userId}`, userData, ttl);
    }

    async getCachedUser(userId) {
        return await this.get(`user:${userId}`);
    }

    // 게시글 캐싱
    async cachePost(postId, postData, ttl = 3600) {
        return await this.set(`post:${postId}`, postData, ttl);
    }

    async getCachedPost(postId) {
        return await this.get(`post:${postId}`);
    }

    // 게시글 목록 캐싱
    async cachePostList(query, posts, ttl = 600) {
        const key = `posts:${JSON.stringify(query)}`;
        return await this.set(key, posts, ttl);
    }

    async getCachedPostList(query) {
        const key = `posts:${JSON.stringify(query)}`;
        return await this.get(key);
    }

    // 세션 캐싱
    async cacheSession(sessionId, sessionData, ttl = 86400) {
        return await this.set(`session:${sessionId}`, sessionData, ttl);
    }

    async getCachedSession(sessionId) {
        return await this.get(`session:${sessionId}`);
    }

    // API 응답 캐싱
    async cacheApiResponse(endpoint, params, response, ttl = 300) {
        const key = `api:${endpoint}:${JSON.stringify(params)}`;
        return await this.set(key, response, ttl);
    }

    async getCachedApiResponse(endpoint, params) {
        const key = `api:${endpoint}:${JSON.stringify(params)}`;
        return await this.get(key);
    }

    // 캐시 무효화 헬퍼
    async invalidateUserCache(userId) {
        await this.delete(`user:${userId}`);
        await this.deletePattern(`posts:*author:${userId}*`);
    }

    async invalidatePostCache(postId) {
        await this.delete(`post:${postId}`);
        await this.deletePattern(`posts:*`);
    }

    async invalidateAllCaches() {
        await this.flush();
    }

    /**
     * 정기적인 캐시 정리
     */
    startCleanup() {
        setInterval(() => {
            this.cleanupMemoryCache();
        }, 300000); // 5분마다
    }

    cleanupMemoryCache() {
        const now = Date.now();
        let cleanedCount = 0;

        for (const [key, value] of this.memoryCache.entries()) {
            if (now > value.expiry) {
                this.memoryCache.delete(key);
                cleanedCount++;
            }
        }

        if (cleanedCount > 0) {
            logger.info(`메모리 캐시 정리 완료: ${cleanedCount}개 항목 삭제`);
        }
    }

    /**
     * 연결 종료
     */
    async close() {
        if (this.redis) {
            await this.redis.quit();
        }
        this.memoryCache.clear();
        logger.info('캐시 서비스 종료');
    }
}

// 싱글톤 인스턴스
const cacheService = new CacheService();

module.exports = cacheService;
