const Redis = require('redis');
const NodeCache = require('node-cache');

// Redis 설정
const redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || null,
    db: process.env.REDIS_DB || 0,
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    connectTimeout: 10000,
    commandTimeout: 5000
};

// 메모리 캐시 설정
const memoryCacheConfig = {
    stdTTL: 600, // 10분
    checkperiod: 120, // 2분마다 체크
    useClones: false,
    deleteOnExpire: true,
    maxKeys: 1000
};

// 캐시 서비스 클래스
class CacheService {
    constructor() {
        this.redis = null;
        this.memoryCache = new NodeCache(memoryCacheConfig);
        this.isRedisConnected = false;
        this.initializeRedis();
    }

    // Redis 초기화
    async initializeRedis() {
        try {
            this.redis = Redis.createClient(redisConfig);

            this.redis.on('connect', () => {
                console.log('✅ Redis 연결 성공');
                this.isRedisConnected = true;
            });

            this.redis.on('error', (error) => {
                console.error('❌ Redis 연결 오류:', error.message);
                this.isRedisConnected = false;
            });

            this.redis.on('end', () => {
                console.log('🔌 Redis 연결 종료');
                this.isRedisConnected = false;
            });

            await this.redis.connect();
        } catch (error) {
            console.error('❌ Redis 초기화 실패:', error.message);
            this.isRedisConnected = false;
        }
    }

    // 캐시 설정
    getCacheConfig(key) {
        const configs = {
            // 사용자 관련 캐시
            'user:profile:': { ttl: 1800, level: 'redis' }, // 30분
            'user:settings:': { ttl: 3600, level: 'redis' }, // 1시간
            'user:permissions:': { ttl: 1800, level: 'redis' }, // 30분

            // 게시글 관련 캐시
            'posts:list:': { ttl: 600, level: 'redis' }, // 10분
            'posts:popular:': { ttl: 3600, level: 'redis' }, // 1시간
            'posts:trending:': { ttl: 1800, level: 'redis' }, // 30분
            'posts:detail:': { ttl: 1800, level: 'redis' }, // 30분

            // 댓글 관련 캐시
            'comments:list:': { ttl: 300, level: 'redis' }, // 5분
            'comments:count:': { ttl: 600, level: 'redis' }, // 10분

            // 게시판 관련 캐시
            'boards:list:': { ttl: 3600, level: 'redis' }, // 1시간
            'boards:stats:': { ttl: 1800, level: 'redis' }, // 30분

            // 통계 관련 캐시
            'stats:dashboard:': { ttl: 300, level: 'redis' }, // 5분
            'stats:user:': { ttl: 600, level: 'redis' }, // 10분
            'stats:content:': { ttl: 1800, level: 'redis' }, // 30분

            // 게임 관련 캐시
            'game:scores:': { ttl: 300, level: 'memory' }, // 5분
            'game:leaderboard:': { ttl: 600, level: 'redis' }, // 10분
            'game:achievements:': { ttl: 1800, level: 'redis' }, // 30분

            // VIP 관련 캐시
            'vip:users:': { ttl: 1800, level: 'redis' }, // 30분
            'vip:requirements:': { ttl: 600, level: 'redis' }, // 10분
            'vip:stats:': { ttl: 300, level: 'redis' }, // 5분

            // 채팅 관련 캐시
            'chat:rooms:': { ttl: 1800, level: 'memory' }, // 30분
            'chat:messages:': { ttl: 300, level: 'memory' }, // 5분
            'chat:online:': { ttl: 60, level: 'memory' } // 1분
        };

        for (const [pattern, config] of Object.entries(configs)) {
            if (key.startsWith(pattern)) {
                return config;
            }
        }

        // 기본 설정
        return { ttl: 600, level: 'memory' };
    }

    // 캐시에서 데이터 가져오기
    async get(key) {
        try {
            const config = this.getCacheConfig(key);

            if (config.level === 'redis' && this.isRedisConnected) {
                const value = await this.redis.get(key);
                return value ? JSON.parse(value) : null;
            } else {
                // Redis가 연결되지 않았거나 메모리 캐시 사용
                const value = this.memoryCache.get(key);
                return value;
            }
        } catch (error) {
            console.error('❌ 캐시 가져오기 오류:', error.message);
            return null;
        }
    }

    // 캐시에 데이터 저장
    async set(key, value, ttl = null) {
        try {
            const config = this.getCacheConfig(key);
            const cacheTTL = ttl || config.ttl;

            if (config.level === 'redis' && this.isRedisConnected) {
                await this.redis.setEx(key, cacheTTL, JSON.stringify(value));
            } else {
                // Redis가 연결되지 않았거나 메모리 캐시 사용
                this.memoryCache.set(key, value, cacheTTL);
            }

            return true;
        } catch (error) {
            console.error('❌ 캐시 저장 오류:', error.message);
            return false;
        }
    }

    // 캐시에서 데이터 삭제
    async del(key) {
        try {
            if (this.isRedisConnected) {
                await this.redis.del(key);
            }
            this.memoryCache.del(key);
            return true;
        } catch (error) {
            console.error('❌ 캐시 삭제 오류:', error.message);
            return false;
        }
    }

    // 패턴으로 캐시 삭제
    async delPattern(pattern) {
        try {
            if (this.isRedisConnected) {
                const keys = await this.redis.keys(pattern);
                if (keys.length > 0) {
                    await this.redis.del(keys);
                }
            }

            // 메모리 캐시에서도 삭제
            const memoryKeys = this.memoryCache.keys();
            const regex = new RegExp(pattern.replace(/\*/g, '.*'));
            memoryKeys.forEach(key => {
                if (regex.test(key)) {
                    this.memoryCache.del(key);
                }
            });

            return true;
        } catch (error) {
            console.error('❌ 패턴 캐시 삭제 오류:', error.message);
            return false;
        }
    }

    // 캐시 무효화
    async invalidate(key) {
        try {
            // 특정 키 삭제
            await this.del(key);

            // 관련 키들도 삭제
            const relatedPatterns = [
                `${key}:*`,
                `*:${key}`,
                `*:${key}:*`
            ];

            for (const pattern of relatedPatterns) {
                await this.delPattern(pattern);
            }

            return true;
        } catch (error) {
            console.error('❌ 캐시 무효화 오류:', error.message);
            return false;
        }
    }

    // 캐시 상태 확인
    getStatus() {
        return {
            redis: {
                connected: this.isRedisConnected,
                host: redisConfig.host,
                port: redisConfig.port
            },
            memory: {
                keys: this.memoryCache.keys().length,
                stats: this.memoryCache.getStats()
            }
        };
    }

    // 캐시 통계
    getStats() {
        const memoryStats = this.memoryCache.getStats();

        return {
            memory: {
                keys: memoryStats.keys,
                hits: memoryStats.hits,
                misses: memoryStats.misses,
                hitRate: memoryStats.hits / (memoryStats.hits + memoryStats.misses) * 100
            },
            redis: {
                connected: this.isRedisConnected
            }
        };
    }

    // 캐시 정리
    async cleanup() {
        try {
            // 메모리 캐시 정리
            this.memoryCache.flushAll();

            // Redis 캐시 정리 (선택적)
            if (this.isRedisConnected) {
                await this.redis.flushDb();
            }

            return true;
        } catch (error) {
            console.error('❌ 캐시 정리 오류:', error.message);
            return false;
        }
    }

    // 캐시 미들웨어
    cacheMiddleware(ttl = 600) {
        return (req, res, next) => {
            const key = `api:${req.method}:${req.originalUrl}`;

            // GET 요청만 캐시
            if (req.method !== 'GET') {
                return next();
            }

            // 캐시에서 데이터 가져오기
            this.get(key).then(cached => {
                if (cached) {
                    return res.json(cached);
                }

                // 원본 응답 함수 저장
                const originalSend = res.json;
                res.json = function (data) {
                    // 캐시에 저장
                    cacheService.set(key, data, ttl);
                    originalSend.call(this, data);
                };

                next();
            }).catch(error => {
                console.error('❌ 캐시 미들웨어 오류:', error.message);
                next();
            });
        };
    }

    // Redis 연결 종료
    async close() {
        if (this.redis) {
            await this.redis.quit();
        }
    }
}

// 싱글톤 인스턴스
const cacheService = new CacheService();

module.exports = {
    cacheService,
    CacheService
};
