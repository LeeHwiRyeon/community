/**
 * Redis Service
 * 
 * Redis 캐싱 및 세션 관리 서비스
 * - 게시글/댓글 캐싱
 * - 실시간 통계 캐싱
 * - JWT 블랙리스트 관리
 * - 세션 데이터 관리
 * - 캐시 무효화 전략
 */

import redisClient from '../config/redisClient.js';

class RedisService {
    constructor() {
        this.defaultTTL = 3600; // 1 hour
        this.shortTTL = 300; // 5 minutes
        this.longTTL = 86400; // 24 hours
    }

    /**
     * 캐시 키 생성 헬퍼
     */
    generateKey(prefix, ...args) {
        return `${prefix}:${args.join(':')}`;
    }

    // ==================== 기본 캐시 작업 ====================

    /**
     * 캐시에서 데이터 가져오기
     */
    async get(key) {
        try {
            const client = redisClient.getClient();
            const data = await client.get(key);

            if (data) {
                return JSON.parse(data);
            }
            return null;
        } catch (error) {
            console.error(`❌ Redis GET error for key ${key}:`, error.message);
            return null;
        }
    }

    /**
     * 캐시에 데이터 저장
     */
    async set(key, value, ttl = this.defaultTTL) {
        try {
            const client = redisClient.getClient();
            const data = JSON.stringify(value);

            if (ttl > 0) {
                await client.setEx(key, ttl, data);
            } else {
                await client.set(key, data);
            }

            return true;
        } catch (error) {
            console.error(`❌ Redis SET error for key ${key}:`, error.message);
            return false;
        }
    }

    /**
     * 캐시 삭제
     */
    async delete(key) {
        try {
            const client = redisClient.getClient();
            await client.del(key);
            return true;
        } catch (error) {
            console.error(`❌ Redis DELETE error for key ${key}:`, error.message);
            return false;
        }
    }

    /**
     * 패턴으로 캐시 삭제
     */
    async deletePattern(pattern) {
        try {
            const client = redisClient.getClient();
            const keys = await client.keys(pattern);

            if (keys.length > 0) {
                await client.del(keys);
                console.log(`✅ Deleted ${keys.length} keys matching pattern: ${pattern}`);
            }

            return keys.length;
        } catch (error) {
            console.error(`❌ Redis DELETE PATTERN error for ${pattern}:`, error.message);
            return 0;
        }
    }

    /**
     * 캐시 존재 여부 확인
     */
    async exists(key) {
        try {
            const client = redisClient.getClient();
            const result = await client.exists(key);
            return result === 1;
        } catch (error) {
            console.error(`❌ Redis EXISTS error for key ${key}:`, error.message);
            return false;
        }
    }

    /**
     * TTL 조회
     */
    async getTTL(key) {
        try {
            const client = redisClient.getClient();
            return await client.ttl(key);
        } catch (error) {
            console.error(`❌ Redis TTL error for key ${key}:`, error.message);
            return -1;
        }
    }

    // ==================== 게시글 캐싱 ====================

    /**
     * 게시글 캐시 가져오기
     */
    async getPost(postId) {
        const key = this.generateKey('post', postId);
        return await this.get(key);
    }

    /**
     * 게시글 캐시 저장
     */
    async setPost(postId, postData, ttl = this.defaultTTL) {
        const key = this.generateKey('post', postId);
        return await this.set(key, postData, ttl);
    }

    /**
     * 게시글 캐시 삭제
     */
    async deletePost(postId) {
        const key = this.generateKey('post', postId);
        return await this.delete(key);
    }

    /**
     * 게시글 목록 캐시 가져오기
     */
    async getPostList(boardId, page, limit, sort) {
        const key = this.generateKey('posts', boardId, page, limit, sort);
        return await this.get(key);
    }

    /**
     * 게시글 목록 캐시 저장
     */
    async setPostList(boardId, page, limit, sort, data, ttl = this.shortTTL) {
        const key = this.generateKey('posts', boardId, page, limit, sort);
        return await this.set(key, data, ttl);
    }

    /**
     * 특정 게시판의 모든 게시글 목록 캐시 삭제
     */
    async invalidatePostLists(boardId) {
        const pattern = this.generateKey('posts', boardId, '*');
        return await this.deletePattern(pattern);
    }

    // ==================== 댓글 캐싱 ====================

    /**
     * 댓글 목록 캐시 가져오기
     */
    async getComments(postId) {
        const key = this.generateKey('comments', postId);
        return await this.get(key);
    }

    /**
     * 댓글 목록 캐시 저장
     */
    async setComments(postId, commentsData, ttl = this.shortTTL) {
        const key = this.generateKey('comments', postId);
        return await this.set(key, commentsData, ttl);
    }

    /**
     * 댓글 캐시 삭제
     */
    async deleteComments(postId) {
        const key = this.generateKey('comments', postId);
        return await this.delete(key);
    }

    // ==================== 사용자 캐싱 ====================

    /**
     * 사용자 프로필 캐시 가져오기
     */
    async getUserProfile(userId) {
        const key = this.generateKey('user', userId);
        return await this.get(key);
    }

    /**
     * 사용자 프로필 캐시 저장
     */
    async setUserProfile(userId, userData, ttl = this.longTTL) {
        const key = this.generateKey('user', userId);
        return await this.set(key, userData, ttl);
    }

    /**
     * 사용자 프로필 캐시 삭제
     */
    async deleteUserProfile(userId) {
        const key = this.generateKey('user', userId);
        return await this.delete(key);
    }

    // ==================== 통계 캐싱 ====================

    /**
     * 게시판 통계 캐시 가져오기
     */
    async getBoardStats(boardId) {
        const key = this.generateKey('stats', 'board', boardId);
        return await this.get(key);
    }

    /**
     * 게시판 통계 캐시 저장
     */
    async setBoardStats(boardId, statsData, ttl = this.shortTTL) {
        const key = this.generateKey('stats', 'board', boardId);
        return await this.set(key, statsData, ttl);
    }

    /**
     * 전체 통계 캐시 가져오기
     */
    async getGlobalStats() {
        const key = this.generateKey('stats', 'global');
        return await this.get(key);
    }

    /**
     * 전체 통계 캐시 저장
     */
    async setGlobalStats(statsData, ttl = this.shortTTL) {
        const key = this.generateKey('stats', 'global');
        return await this.set(key, statsData, ttl);
    }

    // ==================== JWT 블랙리스트 ====================

    /**
     * JWT 토큰 블랙리스트에 추가
     */
    async blacklistToken(token, expiresIn) {
        const key = this.generateKey('blacklist', 'jwt', token);
        // expiresIn은 초 단위
        return await this.set(key, { blacklisted: true }, expiresIn);
    }

    /**
     * JWT 토큰이 블랙리스트에 있는지 확인
     */
    async isTokenBlacklisted(token) {
        const key = this.generateKey('blacklist', 'jwt', token);
        return await this.exists(key);
    }

    // ==================== 세션 관리 ====================

    /**
     * 세션 데이터 저장
     */
    async setSession(sessionId, sessionData, ttl = this.longTTL) {
        const key = this.generateKey('session', sessionId);
        return await this.set(key, sessionData, ttl);
    }

    /**
     * 세션 데이터 가져오기
     */
    async getSession(sessionId) {
        const key = this.generateKey('session', sessionId);
        return await this.get(key);
    }

    /**
     * 세션 삭제
     */
    async deleteSession(sessionId) {
        const key = this.generateKey('session', sessionId);
        return await this.delete(key);
    }

    /**
     * 사용자의 모든 세션 삭제
     */
    async deleteUserSessions(userId) {
        const pattern = this.generateKey('session', '*', userId, '*');
        return await this.deletePattern(pattern);
    }

    // ==================== 조회수 카운터 ====================

    /**
     * 조회수 증가 (중복 방지)
     */
    async incrementViewCount(postId, userId) {
        const key = this.generateKey('views', postId, userId);
        const client = redisClient.getClient();

        try {
            // 이미 조회했는지 확인
            const viewed = await client.exists(key);
            if (viewed) {
                return false; // 이미 조회함
            }

            // 24시간 동안 중복 조회 방지
            await client.setEx(key, 86400, '1');
            return true; // 새로운 조회
        } catch (error) {
            console.error(`❌ Redis view count error:`, error.message);
            return true; // 에러 시 조회 허용 (안전장치)
        }
    }

    // ==================== 실시간 카운터 ====================

    /**
     * 카운터 증가
     */
    async incrementCounter(key, amount = 1) {
        try {
            const client = redisClient.getClient();
            return await client.incrBy(key, amount);
        } catch (error) {
            console.error(`❌ Redis increment error for ${key}:`, error.message);
            return null;
        }
    }

    /**
     * 카운터 감소
     */
    async decrementCounter(key, amount = 1) {
        try {
            const client = redisClient.getClient();
            return await client.decrBy(key, amount);
        } catch (error) {
            console.error(`❌ Redis decrement error for ${key}:`, error.message);
            return null;
        }
    }

    /**
     * 카운터 값 가져오기
     */
    async getCounter(key) {
        try {
            const client = redisClient.getClient();
            const value = await client.get(key);
            return value ? parseInt(value) : 0;
        } catch (error) {
            console.error(`❌ Redis get counter error for ${key}:`, error.message);
            return 0;
        }
    }

    // ==================== Rate Limiting ====================

    /**
     * Rate Limit 체크 (슬라이딩 윈도우)
     */
    async checkRateLimit(userId, action, limit, windowSeconds) {
        const key = this.generateKey('ratelimit', action, userId);
        const client = redisClient.getClient();

        try {
            const current = await client.incr(key);

            if (current === 1) {
                // 첫 요청이면 TTL 설정
                await client.expire(key, windowSeconds);
            }

            return {
                allowed: current <= limit,
                current,
                limit,
                resetIn: await client.ttl(key)
            };
        } catch (error) {
            console.error(`❌ Redis rate limit error:`, error.message);
            return { allowed: true, current: 0, limit, resetIn: windowSeconds };
        }
    }

    // ==================== 캐시 워밍업 ====================

    /**
     * 인기 게시글 캐시 워밍업
     */
    async warmupPopularPosts(posts) {
        const promises = posts.map(post =>
            this.setPost(post.id, post, this.longTTL)
        );

        await Promise.all(promises);
        console.log(`✅ Warmed up ${posts.length} popular posts`);
    }

    // ==================== 캐시 통계 ====================

    /**
     * 캐시 히트율 추적
     */
    async trackCacheHit(key) {
        const hitKey = this.generateKey('cache-stats', 'hits');
        await this.incrementCounter(hitKey);
    }

    async trackCacheMiss(key) {
        const missKey = this.generateKey('cache-stats', 'misses');
        await this.incrementCounter(missKey);
    }

    async getCacheStats() {
        const hitKey = this.generateKey('cache-stats', 'hits');
        const missKey = this.generateKey('cache-stats', 'misses');

        const hits = await this.getCounter(hitKey);
        const misses = await this.getCounter(missKey);
        const total = hits + misses;
        const hitRate = total > 0 ? (hits / total * 100).toFixed(2) : 0;

        return { hits, misses, total, hitRate: `${hitRate}%` };
    }

    // ==================== 헬스체크 ====================

    /**
     * Redis 헬스체크
     */
    async healthCheck() {
        try {
            const client = redisClient.getClient();
            const start = Date.now();
            await client.ping();
            const latency = Date.now() - start;

            const info = await redisClient.getStats();

            return {
                status: 'healthy',
                latency: `${latency}ms`,
                connected: redisClient.isReady(),
                dbSize: info?.dbSize || 0
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                error: error.message,
                connected: false
            };
        }
    }
}

// 싱글톤 인스턴스 생성
const redisService = new RedisService();

export default redisService;
