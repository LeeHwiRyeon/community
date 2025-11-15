/**
 * Recommendation Service - Python ML 서비스 브리지
 * Express 백엔드와 Python FastAPI 추천 서비스 간의 통신 담당
 */

const axios = require('axios');
const redis = require('redis');
const logger = require('../utils/logger');

// Python ML 서비스 설정
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';
const ML_API_KEY = process.env.ML_API_KEY || '';
const CACHE_TTL = parseInt(process.env.RECOMMENDATION_CACHE_TTL) || 3600; // 1시간
const REQUEST_TIMEOUT = parseInt(process.env.ML_REQUEST_TIMEOUT) || 5000; // 5초

// Redis 클라이언트 (캐싱용)
let redisClient = null;
let isRedisConnected = false;

/**
 * Redis 클라이언트 초기화
 */
async function initializeRedis() {
    try {
        if (process.env.REDIS_HOST) {
            redisClient = redis.createClient({
                host: process.env.REDIS_HOST || 'localhost',
                port: parseInt(process.env.REDIS_PORT) || 6379,
                password: process.env.REDIS_PASSWORD || undefined,
                db: parseInt(process.env.REDIS_DB) || 0
            });

            redisClient.on('error', (err) => {
                logger.error('Redis Client Error:', err);
                isRedisConnected = false;
            });

            redisClient.on('connect', () => {
                logger.info('Redis connected for recommendation caching');
                isRedisConnected = true;
            });

            await redisClient.connect();
        } else {
            logger.info('Redis not configured, caching disabled');
        }
    } catch (error) {
        logger.error('Failed to initialize Redis:', error);
        redisClient = null;
        isRedisConnected = false;
    }
}

/**
 * ML 서비스 헬스 체크
 */
async function checkMLServiceHealth() {
    try {
        const response = await axios.get(`${ML_SERVICE_URL}/health`, {
            timeout: 3000
        });

        return {
            healthy: response.data.status === 'healthy',
            data: response.data
        };
    } catch (error) {
        logger.error('ML Service health check failed:', error.message);
        return {
            healthy: false,
            error: error.message
        };
    }
}

/**
 * 캐시에서 데이터 가져오기
 */
async function getFromCache(key) {
    if (!isRedisConnected || !redisClient) {
        return null;
    }

    try {
        const cached = await redisClient.get(key);
        if (cached) {
            logger.debug(`Cache hit: ${key}`);
            return JSON.parse(cached);
        }
    } catch (error) {
        logger.error('Cache get error:', error);
    }
    return null;
}

/**
 * 캐시에 데이터 저장
 */
async function saveToCache(key, data, ttl = CACHE_TTL) {
    if (!isRedisConnected || !redisClient) {
        return;
    }

    try {
        await redisClient.setEx(key, ttl, JSON.stringify(data));
        logger.debug(`Cache saved: ${key}`);
    } catch (error) {
        logger.error('Cache save error:', error);
    }
}

/**
 * Python ML 서비스 API 호출
 */
async function callMLService(endpoint, method = 'POST', data = null, params = null) {
    try {
        const config = {
            method,
            url: `${ML_SERVICE_URL}${endpoint}`,
            timeout: REQUEST_TIMEOUT,
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': ML_API_KEY
            }
        };

        if (data) {
            config.data = data;
        }

        if (params) {
            config.params = params;
        }

        const response = await axios(config);
        return {
            success: true,
            data: response.data
        };
    } catch (error) {
        logger.error(`ML Service API call failed [${endpoint}]:`, error.message);

        if (error.response) {
            // ML 서비스에서 반환한 에러
            return {
                success: false,
                error: error.response.data.detail || error.response.data,
                status: error.response.status
            };
        } else if (error.request) {
            // 요청은 보냈지만 응답 없음
            return {
                success: false,
                error: 'ML service not responding',
                status: 503
            };
        } else {
            // 요청 생성 중 에러
            return {
                success: false,
                error: error.message,
                status: 500
            };
        }
    }
}

/**
 * 사용자 맞춤 게시물 추천
 */
async function getRecommendedPosts(userId, limit = 10, recommendationType = 'hybrid') {
    try {
        // 캐시 키 생성
        const cacheKey = `recommendations:posts:${userId}:${limit}:${recommendationType}`;

        // 캐시 확인
        const cached = await getFromCache(cacheKey);
        if (cached) {
            return {
                success: true,
                data: cached,
                cached: true
            };
        }

        // ML 서비스 호출
        const result = await callMLService('/recommend/posts', 'POST', {
            user_id: userId,
            limit: limit,
            recommendation_type: recommendationType
        });

        if (result.success) {
            // 캐시 저장
            await saveToCache(cacheKey, result.data);

            return {
                success: true,
                data: result.data,
                cached: false
            };
        }

        return result;
    } catch (error) {
        logger.error('getRecommendedPosts error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * 유사 게시물 추천
 */
async function getSimilarPosts(postId, limit = 10) {
    try {
        // 캐시 키 생성
        const cacheKey = `recommendations:similar:${postId}:${limit}`;

        // 캐시 확인
        const cached = await getFromCache(cacheKey);
        if (cached) {
            return {
                success: true,
                data: cached,
                cached: true
            };
        }

        // ML 서비스 호출
        const result = await callMLService(
            `/recommend/similar/${postId}`,
            'POST',
            null,
            { limit }
        );

        if (result.success) {
            // 캐시 저장
            await saveToCache(cacheKey, result.data);

            return {
                success: true,
                data: result.data,
                cached: false
            };
        }

        return result;
    } catch (error) {
        logger.error('getSimilarPosts error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * 트렌딩 게시물 추천
 */
async function getTrendingPosts(limit = 10, days = 7) {
    try {
        // 캐시 키 생성
        const cacheKey = `recommendations:trending:${limit}:${days}`;

        // 캐시 확인
        const cached = await getFromCache(cacheKey);
        if (cached) {
            return {
                success: true,
                data: cached,
                cached: true
            };
        }

        // ML 서비스 호출
        const result = await callMLService(
            '/recommend/trending',
            'POST',
            null,
            { limit, days }
        );

        if (result.success) {
            // 캐시 저장 (10분만 유지 - 트렌딩은 자주 변경)
            await saveToCache(cacheKey, result.data, 600);

            return {
                success: true,
                data: result.data,
                cached: false
            };
        }

        return result;
    } catch (error) {
        logger.error('getTrendingPosts error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * 추천 캐시 클리어
 */
async function clearRecommendationCache(pattern = 'recommendations:*') {
    if (!isRedisConnected || !redisClient) {
        return {
            success: false,
            error: 'Redis not connected'
        };
    }

    try {
        const keys = await redisClient.keys(pattern);
        if (keys.length > 0) {
            await redisClient.del(keys);
            logger.info(`Cleared ${keys.length} cache keys matching: ${pattern}`);
        }

        return {
            success: true,
            cleared: keys.length
        };
    } catch (error) {
        logger.error('clearRecommendationCache error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * ML 서비스 데이터 리프레시 요청
 */
async function refreshMLServiceData() {
    try {
        const result = await callMLService('/data/refresh', 'POST');

        if (result.success) {
            // Express 캐시도 클리어
            await clearRecommendationCache();

            logger.info('ML Service data refreshed successfully');
        }

        return result;
    } catch (error) {
        logger.error('refreshMLServiceData error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Fallback: 데이터베이스에서 직접 인기 게시물 가져오기
 * (ML 서비스 장애 시 사용)
 */
async function getFallbackPopularPosts(db, limit = 10) {
    try {
        const [posts] = await db.execute(`
            SELECT 
                p.post_id,
                p.title,
                p.category_id,
                p.created_at,
                COUNT(DISTINCT l.like_id) as likes_count,
                COUNT(DISTINCT c.comment_id) as comments_count,
                p.views_count,
                (COUNT(DISTINCT l.like_id) * 3 + 
                 COUNT(DISTINCT c.comment_id) * 2 + 
                 p.views_count * 0.5) as score
            FROM posts p
            LEFT JOIN likes l ON p.post_id = l.post_id 
                AND l.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            LEFT JOIN comments c ON p.post_id = c.post_id 
                AND c.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            WHERE p.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                AND p.deleted_at IS NULL
            GROUP BY p.post_id
            ORDER BY score DESC
            LIMIT ?
        `, [limit]);

        return {
            success: true,
            data: posts,
            fallback: true
        };
    } catch (error) {
        logger.error('getFallbackPopularPosts error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

module.exports = {
    initializeRedis,
    checkMLServiceHealth,
    getRecommendedPosts,
    getSimilarPosts,
    getTrendingPosts,
    clearRecommendationCache,
    refreshMLServiceData,
    getFallbackPopularPosts
};
