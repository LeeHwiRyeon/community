const redis = require('redis');

let redisClient = null;

// Redis 클라이언트 초기화
async function initializeRedis() {
    try {
        redisClient = redis.createClient({
            host: process.env.REDIS_HOST || 'localhost',
            port: process.env.REDIS_PORT || 6379,
            password: process.env.REDIS_PASSWORD || undefined,
            db: process.env.REDIS_DB || 0,
            retry_strategy: (options) => {
                if (options.error && options.error.code === 'ECONNREFUSED') {
                    console.error('Redis server connection refused');
                    return new Error('Redis server connection refused');
                }
                if (options.total_retry_time > 1000 * 60 * 60) {
                    console.error('Redis retry time exhausted');
                    return new Error('Retry time exhausted');
                }
                if (options.attempt > 10) {
                    console.error('Redis max retry attempts reached');
                    return undefined;
                }
                return Math.min(options.attempt * 100, 3000);
            }
        });

        redisClient.on('connect', () => {
            console.log('🔗 Redis client connected');
        });

        redisClient.on('ready', () => {
            console.log('✅ Redis client ready');
        });

        redisClient.on('error', (err) => {
            console.error('❌ Redis client error:', err);
        });

        redisClient.on('end', () => {
            console.log('🔌 Redis client connection ended');
        });

        await redisClient.connect();
        return redisClient;
    } catch (error) {
        console.error('❌ Failed to initialize Redis:', error);
        throw error;
    }
}

// Redis 클라이언트 가져오기
function getRedisClient() {
    if (!redisClient) {
        throw new Error('Redis client not initialized');
    }
    return redisClient;
}

// Redis 연결 종료
async function closeRedis() {
    try {
        if (redisClient) {
            await redisClient.quit();
            console.log('🔌 Redis connection closed');
        }
    } catch (error) {
        console.error('❌ Error closing Redis connection:', error);
        throw error;
    }
}

// 캐시 헬퍼 함수들
const cache = {
    // 값 설정
    async set(key, value, ttl = 3600) {
        try {
            const client = getRedisClient();
            const serializedValue = JSON.stringify(value);
            await client.setEx(key, ttl, serializedValue);
            return true;
        } catch (error) {
            console.error('Cache set error:', error);
            return false;
        }
    },

    // 값 가져오기
    async get(key) {
        try {
            const client = getRedisClient();
            const value = await client.get(key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            console.error('Cache get error:', error);
            return null;
        }
    },

    // 값 삭제
    async del(key) {
        try {
            const client = getRedisClient();
            await client.del(key);
            return true;
        } catch (error) {
            console.error('Cache delete error:', error);
            return false;
        }
    },

    // 패턴으로 키 삭제
    async delPattern(pattern) {
        try {
            const client = getRedisClient();
            const keys = await client.keys(pattern);
            if (keys.length > 0) {
                await client.del(keys);
            }
            return true;
        } catch (error) {
            console.error('Cache delete pattern error:', error);
            return false;
        }
    },

    // TTL 설정
    async expire(key, ttl) {
        try {
            const client = getRedisClient();
            await client.expire(key, ttl);
            return true;
        } catch (error) {
            console.error('Cache expire error:', error);
            return false;
        }
    }
};

module.exports = {
    initializeRedis,
    getRedisClient,
    closeRedis,
    cache
};
