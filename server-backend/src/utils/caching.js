/**
 * Redis 캐싱 전략 및 최적화
 */

import { getRedisClient } from '../redis.js';

/**
 * 캐시 키 생성
 */
function generateCacheKey(prefix, ...params) {
    return `cache:${prefix}:${params.join(':')}`;
}

/**
 * 캐시 데이터 가져오기
 */
async function getCache(key) {
    try {
        const client = getRedisClient();
        if (!client) return null;

        const data = await client.get(key);
        if (data) {
            return JSON.parse(data);
        }
        return null;
    } catch (error) {
        console.error('캐시 조회 실패:', error);
        return null;
    }
}

/**
 * 캐시 데이터 저장
 */
async function setCache(key, data, ttl = 300) {
    try {
        const client = getRedisClient();
        if (!client) return false;

        await client.setEx(key, ttl, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error('캐시 저장 실패:', error);
        return false;
    }
}

/**
 * 캐시 삭제
 */
async function deleteCache(key) {
    try {
        const client = getRedisClient();
        if (!client) return false;

        await client.del(key);
        return true;
    } catch (error) {
        console.error('캐시 삭제 실패:', error);
        return false;
    }
}

/**
 * 패턴으로 캐시 삭제
 */
async function deleteCachePattern(pattern) {
    try {
        const client = getRedisClient();
        if (!client) return false;

        const keys = await client.keys(pattern);
        if (keys.length > 0) {
            await client.del(keys);
        }
        return true;
    } catch (error) {
        console.error('패턴 캐시 삭제 실패:', error);
        return false;
    }
}

/**
 * 공개키 캐싱 (자주 조회되는 데이터)
 */
export async function cachePublicKey(userId, publicKey, ttl = 3600) {
    const key = generateCacheKey('publickey', userId);
    return await setCache(key, publicKey, ttl);
}

export async function getCachedPublicKey(userId) {
    const key = generateCacheKey('publickey', userId);
    return await getCache(key);
}

export async function invalidatePublicKeyCache(userId) {
    const key = generateCacheKey('publickey', userId);
    return await deleteCache(key);
}

/**
 * 사용자 정보 캐싱
 */
export async function cacheUserInfo(userId, userInfo, ttl = 600) {
    const key = generateCacheKey('user', userId);
    return await setCache(key, userInfo, ttl);
}

export async function getCachedUserInfo(userId) {
    const key = generateCacheKey('user', userId);
    return await getCache(key);
}

export async function invalidateUserCache(userId) {
    const key = generateCacheKey('user', userId);
    return await deleteCache(key);
}

/**
 * 메시지 목록 캐싱 (페이지네이션)
 */
export async function cacheMessageList(roomId, page, limit, messages, ttl = 60) {
    const key = generateCacheKey('messages', roomId, page, limit);
    return await setCache(key, messages, ttl);
}

export async function getCachedMessageList(roomId, page, limit) {
    const key = generateCacheKey('messages', roomId, page, limit);
    return await getCache(key);
}

export async function invalidateMessageCache(roomId) {
    const pattern = `cache:messages:${roomId}:*`;
    return await deleteCachePattern(pattern);
}

/**
 * 통계 데이터 캐싱 (느리게 변하는 데이터)
 */
export async function cacheStats(type, data, ttl = 3600) {
    const key = generateCacheKey('stats', type);
    return await setCache(key, data, ttl);
}

export async function getCachedStats(type) {
    const key = generateCacheKey('stats', type);
    return await getCache(key);
}

/**
 * 배치 공개키 조회 캐싱
 */
export async function cacheBatchPublicKeys(userIds, publicKeys, ttl = 3600) {
    try {
        const client = getRedisClient();
        if (!client) return false;

        const pipeline = client.multi();

        userIds.forEach((userId, index) => {
            const key = generateCacheKey('publickey', userId);
            pipeline.setEx(key, ttl, JSON.stringify(publicKeys[index]));
        });

        await pipeline.exec();
        return true;
    } catch (error) {
        console.error('배치 캐시 저장 실패:', error);
        return false;
    }
}

export async function getCachedBatchPublicKeys(userIds) {
    try {
        const client = getRedisClient();
        if (!client) return null;

        const keys = userIds.map(id => generateCacheKey('publickey', id));
        const results = await client.mGet(keys);

        return results.map(data => data ? JSON.parse(data) : null);
    } catch (error) {
        console.error('배치 캐시 조회 실패:', error);
        return null;
    }
}

/**
 * 캐시 통계
 */
export async function getCacheStats() {
    try {
        const client = getRedisClient();
        if (!client) return null;

        const info = await client.info('stats');
        const lines = info.split('\r\n');
        const stats = {};

        lines.forEach(line => {
            const [key, value] = line.split(':');
            if (key && value) {
                stats[key.trim()] = value.trim();
            }
        });

        return {
            totalKeys: await client.dbSize(),
            hitRate: stats.keyspace_hits && stats.keyspace_misses
                ? ((parseInt(stats.keyspace_hits) /
                    (parseInt(stats.keyspace_hits) + parseInt(stats.keyspace_misses))) * 100).toFixed(2) + '%'
                : 'N/A',
            connectedClients: stats.connected_clients,
            usedMemory: stats.used_memory_human
        };
    } catch (error) {
        console.error('캐시 통계 조회 실패:', error);
        return null;
    }
}

/**
 * 캐시 미들웨어 생성
 */
export function createCacheMiddleware(keyGenerator, ttl = 300) {
    return async (req, res, next) => {
        try {
            const cacheKey = keyGenerator(req);
            const cached = await getCache(cacheKey);

            if (cached) {
                // 캐시 히트
                res.set('X-Cache', 'HIT');
                return res.json(cached);
            }

            // 캐시 미스
            res.set('X-Cache', 'MISS');

            // 원본 res.json 저장
            const originalJson = res.json.bind(res);

            // res.json 오버라이드
            res.json = function (data) {
                // 캐시에 저장
                setCache(cacheKey, data, ttl).catch(err => {
                    console.error('캐시 저장 실패:', err);
                });

                // 원본 함수 호출
                return originalJson(data);
            };

            next();
        } catch (error) {
            console.error('캐시 미들웨어 오류:', error);
            next();
        }
    };
}

export default {
    generateCacheKey,
    getCache,
    setCache,
    deleteCache,
    deleteCachePattern,
    cachePublicKey,
    getCachedPublicKey,
    invalidatePublicKeyCache,
    cacheUserInfo,
    getCachedUserInfo,
    invalidateUserCache,
    cacheMessageList,
    getCachedMessageList,
    invalidateMessageCache,
    cacheStats,
    getCachedStats,
    cacheBatchPublicKeys,
    getCachedBatchPublicKeys,
    getCacheStats,
    createCacheMiddleware
};
