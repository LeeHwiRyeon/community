const redis = require('redis');
const { promisify } = require('util');

// Redis 클라이언트 설정
const redisClient = redis.createClient({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    retry_strategy: (options) => {
        if (options.error && options.error.code === 'ECONNREFUSED') {
            return new Error('Redis 서버에 연결할 수 없습니다');
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
            return new Error('재시도 시간이 초과되었습니다');
        }
        if (options.attempt > 10) {
            return undefined;
        }
        return Math.min(options.attempt * 100, 3000);
    }
});

// Redis 명령어를 Promise로 변환
const getAsync = promisify(redisClient.get).bind(redisClient);
const setAsync = promisify(redisClient.set).bind(redisClient);
const delAsync = promisify(redisClient.del).bind(redisClient);
const existsAsync = promisify(redisClient.exists).bind(redisClient);
const expireAsync = promisify(redisClient.expire).bind(redisClient);

// 캐시 설정
const CACHE_CONFIG = {
    DEFAULT_TTL: 300, // 5분
    LONG_TTL: 3600,   // 1시간
    SHORT_TTL: 60,    // 1분
    MAX_KEYS: 10000,  // 최대 캐시 키 수
};

// 캐시 키 생성 함수
const generateCacheKey = (prefix, params = {}) => {
    const sortedParams = Object.keys(params)
        .sort()
        .map(key => `${key}:${params[key]}`)
        .join('|');

    return `${prefix}:${sortedParams}`;
};

// 캐시 미들웨어
const cacheMiddleware = (options = {}) => {
    const {
        ttl = CACHE_CONFIG.DEFAULT_TTL,
        keyGenerator = null,
        skipCache = false,
        tags = [],
    } = options;

    return async (req, res, next) => {
        // 캐시 건너뛰기 옵션 확인
        if (skipCache || req.query.skipCache === 'true') {
            return next();
        }

        try {
            // 캐시 키 생성
            const cacheKey = keyGenerator
                ? keyGenerator(req)
                : generateCacheKey(req.originalUrl, req.query);

            // 캐시에서 데이터 조회
            const cachedData = await getAsync(cacheKey);

            if (cachedData) {
                // 캐시 히트
                const data = JSON.parse(cachedData);

                // 캐시 메타데이터 추가
                res.set('X-Cache', 'HIT');
                res.set('X-Cache-Key', cacheKey);

                return res.json(data);
            }

            // 캐시 미스 - 원본 응답을 캐시에 저장
            const originalSend = res.json;
            res.json = function (data) {
                // 성공적인 응답만 캐시
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    cacheData(cacheKey, data, ttl, tags);
                }

                // 원본 응답 메타데이터 추가
                res.set('X-Cache', 'MISS');
                res.set('X-Cache-Key', cacheKey);

                return originalSend.call(this, data);
            };

            next();
        } catch (error) {
            console.error('캐시 미들웨어 오류:', error);
            next(); // 캐시 오류 시 원본 요청 계속 진행
        }
    };
};

// 데이터 캐시 저장
const cacheData = async (key, data, ttl, tags = []) => {
    try {
        const cacheValue = JSON.stringify({
            data,
            timestamp: Date.now(),
            tags,
        });

        await setAsync(key, cacheValue);
        await expireAsync(key, ttl);

        // 태그별 인덱스 생성
        if (tags.length > 0) {
            for (const tag of tags) {
                const tagKey = `tag:${tag}`;
                await redisClient.sadd(tagKey, key);
                await expireAsync(tagKey, ttl);
            }
        }

        console.log(`캐시 저장: ${key} (TTL: ${ttl}s)`);
    } catch (error) {
        console.error('캐시 저장 오류:', error);
    }
};

// 캐시 무효화
const invalidateCache = async (pattern) => {
    try {
        const keys = await redisClient.keys(pattern);
        if (keys.length > 0) {
            await delAsync(...keys);
            console.log(`캐시 무효화: ${keys.length}개 키 삭제`);
        }
    } catch (error) {
        console.error('캐시 무효화 오류:', error);
    }
};

// 태그별 캐시 무효화
const invalidateCacheByTag = async (tag) => {
    try {
        const tagKey = `tag:${tag}`;
        const keys = await redisClient.smembers(tagKey);

        if (keys.length > 0) {
            await delAsync(...keys);
            await delAsync(tagKey);
            console.log(`태그 캐시 무효화: ${tag} (${keys.length}개 키)`);
        }
    } catch (error) {
        console.error('태그 캐시 무효화 오류:', error);
    }
};

// 캐시 통계
const getCacheStats = async () => {
    try {
        const info = await redisClient.info('memory');
        const keyspace = await redisClient.info('keyspace');

        return {
            memory: info,
            keyspace: keyspace,
            timestamp: new Date().toISOString(),
        };
    } catch (error) {
        console.error('캐시 통계 조회 오류:', error);
        return null;
    }
};

// 캐시 정리
const cleanupCache = async () => {
    try {
        const allKeys = await redisClient.keys('*');
        const now = Date.now();
        let cleanedCount = 0;

        for (const key of allKeys) {
            const data = await getAsync(key);
            if (data) {
                const parsed = JSON.parse(data);
                const age = now - parsed.timestamp;

                // 24시간 이상 된 캐시 삭제
                if (age > 24 * 60 * 60 * 1000) {
                    await delAsync(key);
                    cleanedCount++;
                }
            }
        }

        console.log(`캐시 정리 완료: ${cleanedCount}개 키 삭제`);
        return cleanedCount;
    } catch (error) {
        console.error('캐시 정리 오류:', error);
        return 0;
    }
};

// 특정 엔드포인트용 캐시 설정
const cacheConfigs = {
    // 게시글 목록 캐시 (5분)
    postsList: {
        ttl: CACHE_CONFIG.DEFAULT_TTL,
        keyGenerator: (req) => generateCacheKey('posts:list', {
            page: req.query.page || 1,
            limit: req.query.limit || 10,
            boardId: req.params.boardId,
            search: req.query.search,
            category: req.query.category,
        }),
        tags: ['posts'],
    },

    // 게시글 상세 캐시 (1시간)
    postDetail: {
        ttl: CACHE_CONFIG.LONG_TTL,
        keyGenerator: (req) => generateCacheKey('post:detail', {
            id: req.params.id,
        }),
        tags: ['posts', 'post-detail'],
    },

    // 사용자 정보 캐시 (30분)
    userInfo: {
        ttl: 1800,
        keyGenerator: (req) => generateCacheKey('user:info', {
            id: req.params.id || req.user?.id,
        }),
        tags: ['users'],
    },

    // 통계 데이터 캐시 (10분)
    analytics: {
        ttl: 600,
        keyGenerator: (req) => generateCacheKey('analytics', {
            type: req.query.type || 'overview',
            period: req.query.period || '7d',
        }),
        tags: ['analytics'],
    },

    // 시스템 상태 캐시 (1분)
    systemStatus: {
        ttl: CACHE_CONFIG.SHORT_TTL,
        keyGenerator: () => 'system:status',
        tags: ['system'],
    },
};

// Redis 연결 상태 확인
const checkRedisConnection = async () => {
    try {
        await redisClient.ping();
        return true;
    } catch (error) {
        console.error('Redis 연결 실패:', error);
        return false;
    }
};

// Redis 연결 이벤트 처리
redisClient.on('connect', () => {
    console.log('✅ Redis 연결 성공');
});

redisClient.on('error', (error) => {
    console.error('❌ Redis 연결 오류:', error);
});

redisClient.on('ready', () => {
    console.log('🚀 Redis 준비 완료');
});

module.exports = {
    cacheMiddleware,
    cacheData,
    invalidateCache,
    invalidateCacheByTag,
    getCacheStats,
    cleanupCache,
    cacheConfigs,
    checkRedisConnection,
    CACHE_CONFIG,
};
