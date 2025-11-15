/**
 * Simple Search Service (MySQL Full-Text Search)
 * Elasticsearch 없이 MySQL만으로 검색 기능 제공
 * Redis 캐싱 지원
 * 
 * @author AUTOAGENTS
 * @date 2025-11-11
 * @version 1.0
 */

import { getPool } from '../db.js';
import { getRedisClient } from '../redis.js';
import logger from '../logger.js';

class SimpleSearchService {
    constructor() {
        this.getDb = () => getPool();
        this.redisClient = null;
        this.isRedisEnabled = false;
        this.cachePrefix = 'search:';
        this.cacheTTL = 300; // 5분

        // Redis 초기화
        this.initializeRedis();
    }

    /**
     * Redis 클라이언트 초기화
     */
    async initializeRedis() {
        try {
            this.redisClient = await getRedisClient();
            if (this.redisClient) {
                this.isRedisEnabled = true;
                logger.info('SimpleSearchService: Redis caching enabled');
            }
        } catch (error) {
            logger.warn('SimpleSearchService: Redis caching disabled:', error.message);
            this.isRedisEnabled = false;
        }
    }

    /**
     * 캐시 키 생성
     */
    getCacheKey(type, params) {
        const paramString = JSON.stringify(params);
        return `${this.cachePrefix}${type}:${paramString}`;
    }

    /**
     * 캐시에서 데이터 가져오기
     */
    async getFromCache(key) {
        if (!this.isRedisEnabled || !this.redisClient) return null;

        try {
            const cached = await this.redisClient.get(key);
            if (cached) {
                logger.debug(`Cache hit: ${key}`);
                return JSON.parse(cached);
            }
        } catch (error) {
            logger.error('Error getting from cache:', error);
        }
        return null;
    }

    /**
     * 캐시에 데이터 저장
     */
    async setToCache(key, data, ttl = this.cacheTTL) {
        if (!this.isRedisEnabled || !this.redisClient) return;

        try {
            await this.redisClient.setEx(key, ttl, JSON.stringify(data));
            logger.debug(`Cache set: ${key}`);
        } catch (error) {
            logger.error('Error setting to cache:', error);
        }
    }

    /**
     * 게시물 검색 (MySQL Full-Text Search)
     * @param {Object} options - 검색 옵션
     * @returns {Promise<Object>} 검색 결과
     */
    async searchPosts({
        query = '',
        category = null,
        tags = [],
        author = null,
        dateFrom = null,
        dateTo = null,
        sortBy = 'relevance', // relevance, date, views, likes
        page = 1,
        limit = 20
    }) {
        const db = this.getDb();

        try {
            // 캐시 확인
            const cacheKey = this.getCacheKey('posts', {
                query, category, tags, author, dateFrom, dateTo, sortBy, page, limit
            });
            const cached = await this.getFromCache(cacheKey);
            if (cached) return cached;

            const offset = (page - 1) * limit;
            const conditions = [];
            const params = [];

            // Full-Text Search (제목 + 내용)
            if (query && query.trim()) {
                conditions.push(`MATCH(p.title, p.content) AGAINST (? IN NATURAL LANGUAGE MODE)`);
                params.push(query);
            }

            // 카테고리 필터
            if (category) {
                conditions.push('p.category = ?');
                params.push(category);
            }

            // 태그 필터
            if (tags && tags.length > 0) {
                const tagConditions = tags.map(() => 'p.tag LIKE ?').join(' OR ');
                conditions.push(`(${tagConditions})`);
                tags.forEach(tag => params.push(`%${tag}%`));
            }

            // 작성자 필터
            if (author) {
                conditions.push('p.author LIKE ?');
                params.push(`%${author}%`);
            }

            // 날짜 필터
            if (dateFrom) {
                conditions.push('p.created_at >= ?');
                params.push(dateFrom);
            }
            if (dateTo) {
                conditions.push('p.created_at <= ?');
                params.push(dateTo);
            }

            // 삭제되지 않은 게시물만
            conditions.push('p.deleted = 0');

            // WHERE 절 구성
            const whereClause = conditions.length > 0
                ? `WHERE ${conditions.join(' AND ')}`
                : '';

            // ORDER BY 절
            let orderBy = 'p.created_at DESC';
            if (sortBy === 'relevance' && query) {
                orderBy = 'MATCH(p.title, p.content) AGAINST (? IN NATURAL LANGUAGE MODE) DESC, p.created_at DESC';
                params.push(query);
            } else if (sortBy === 'views') {
                orderBy = 'pv.views DESC, p.created_at DESC';
            } else if (sortBy === 'likes') {
                // 좋아요 수로 정렬 (서브쿼리 사용)
                orderBy = `(
                    SELECT COALESCE(COUNT(*), 0) 
                    FROM post_reactions pr 
                    WHERE pr.post_id = p.id 
                    AND pr.reaction_type = 'like'
                    AND pr.deleted_at IS NULL
                ) DESC, p.created_at DESC`;
            } else if (sortBy === 'date') {
                orderBy = 'p.created_at DESC';
            }

            // 검색 쿼리
            const searchQuery = `
                SELECT 
                    p.id,
                    p.board_id,
                    p.title,
                    SUBSTRING(p.content, 1, 200) as excerpt,
                    p.category,
                    p.tag,
                    p.author,
                    p.thumb,
                    p.created_at,
                    p.updated_at,
                    COALESCE(pv.views, 0) as views
                FROM posts p
                LEFT JOIN post_views pv ON p.id = pv.post_id
                ${whereClause}
                ORDER BY ${orderBy}
                LIMIT ? OFFSET ?
            `;

            params.push(limit, offset);

            const [posts] = await db.execute(searchQuery, params);

            // 전체 개수 조회
            const countQuery = `
                SELECT COUNT(*) as total
                FROM posts p
                ${whereClause}
            `;

            const countParams = params.slice(0, -2); // LIMIT, OFFSET 제외
            const [countResult] = await db.execute(countQuery, countParams);
            const total = countResult[0].total;

            const result = {
                posts,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            };

            // 캐시에 저장
            await this.setToCache(cacheKey, result);

            // 검색 히스토리 저장
            if (query) {
                await this.saveSearchHistory(query);
            }

            logger.info(`Search completed: "${query}" - ${total} results`);
            return result;

        } catch (error) {
            logger.error('Error searching posts:', error);
            throw error;
        }
    }

    /**
     * 자동완성 검색
     * @param {string} query - 검색어
     * @param {number} limit - 결과 개수
     * @returns {Promise<Array>} 자동완성 결과
     */
    async autocomplete(query, limit = 5) {
        const db = this.getDb();

        try {
            // 캐시 확인
            const cacheKey = this.getCacheKey('autocomplete', { query, limit });
            const cached = await this.getFromCache(cacheKey);
            if (cached) return cached;

            const searchQuery = `
                SELECT DISTINCT 
                    p.title,
                    COALESCE(pv.views, 0) as views
                FROM posts p
                LEFT JOIN post_views pv ON p.id = pv.post_id
                WHERE p.title LIKE ? 
                AND p.deleted = 0
                ORDER BY pv.views DESC, p.created_at DESC
                LIMIT ?
            `;

            const [results] = await db.execute(searchQuery, [`%${query}%`, limit]);

            const suggestions = results.map(row => row.title);

            // 캐시에 저장 (짧은 TTL)
            await this.setToCache(cacheKey, suggestions, 60);

            return suggestions;

        } catch (error) {
            logger.error('Error in autocomplete:', error);
            throw error;
        }
    }

    /**
     * 검색 히스토리 저장
     * @param {string} query - 검색어
     */
    async saveSearchHistory(query) {
        if (!this.isRedisEnabled || !this.redisClient) return;

        try {
            const key = `${this.cachePrefix}history`;
            const timestamp = Date.now();

            // Redis Sorted Set에 저장 (score: timestamp)
            await this.redisClient.zAdd(key, {
                score: timestamp,
                value: query
            });

            // 최근 1000개만 유지
            await this.redisClient.zRemRangeByRank(key, 0, -1001);

            logger.debug(`Search history saved: ${query}`);
        } catch (error) {
            logger.error('Error saving search history:', error);
        }
    }

    /**
     * 검색 히스토리 조회
     * @param {number} limit - 결과 개수
     * @returns {Promise<Array>} 최근 검색어
     */
    async getSearchHistory(limit = 10) {
        if (!this.isRedisEnabled || !this.redisClient) return [];

        try {
            const key = `${this.cachePrefix}history`;

            // 최근 검색어 (역순)
            const history = await this.redisClient.zRange(key, -limit, -1, { REV: true });

            return history || [];
        } catch (error) {
            logger.error('Error getting search history:', error);
            return [];
        }
    }

    /**
     * 인기 검색어 조회
     * @param {number} limit - 결과 개수
     * @returns {Promise<Array>} 인기 검색어
     */
    async getPopularSearchTerms(limit = 10) {
        if (!this.isRedisEnabled || !this.redisClient) {
            // Redis 없을 경우 DB에서 조회
            return await this.getPopularSearchTermsFromDB(limit);
        }

        try {
            const key = `${this.cachePrefix}popular`;

            // Sorted Set에서 인기 검색어 가져오기 (score: 검색 횟수)
            const popular = await this.redisClient.zRange(key, -limit, -1, {
                REV: true,
                WITHSCORES: true
            });

            // { value, score } 형태로 변환
            const terms = [];
            for (let i = 0; i < popular.length; i += 2) {
                terms.push({
                    term: popular[i],
                    count: parseInt(popular[i + 1])
                });
            }

            return terms;

        } catch (error) {
            logger.error('Error getting popular search terms:', error);
            return [];
        }
    }

    /**
     * 인기 검색어 조회 (DB)
     */
    async getPopularSearchTermsFromDB(limit = 10) {
        const db = this.getDb();

        try {
            // 최근 1주일 내 가장 많이 검색된 키워드
            const query = `
                SELECT 
                    p.title as term,
                    COUNT(*) as count
                FROM posts p
                WHERE p.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                AND p.deleted = 0
                GROUP BY p.title
                ORDER BY count DESC
                LIMIT ?
            `;

            const [results] = await db.execute(query, [limit]);
            return results;

        } catch (error) {
            logger.error('Error getting popular terms from DB:', error);
            return [];
        }
    }

    /**
     * 인기 검색어 증가
     * @param {string} query - 검색어
     */
    async incrementPopularTerm(query) {
        if (!this.isRedisEnabled || !this.redisClient) return;

        try {
            const key = `${this.cachePrefix}popular`;

            // Sorted Set score 증가
            await this.redisClient.zIncrBy(key, 1, query);

            logger.debug(`Popular term incremented: ${query}`);
        } catch (error) {
            logger.error('Error incrementing popular term:', error);
        }
    }

    /**
     * 사용자 검색
     * @param {string} query - 검색어
     * @param {number} limit - 결과 개수
     * @returns {Promise<Array>} 사용자 목록
     */
    async searchUsers(query, limit = 10) {
        const db = this.getDb();

        try {
            // 캐시 확인
            const cacheKey = this.getCacheKey('users', { query, limit });
            const cached = await this.getFromCache(cacheKey);
            if (cached) return cached;

            const searchQuery = `
                SELECT 
                    u.id,
                    u.display_name,
                    u.email,
                    u.role,
                    u.created_at
                FROM users u
                WHERE (u.display_name LIKE ? OR u.email LIKE ?)
                AND u.status = 'active'
                ORDER BY u.created_at DESC
                LIMIT ?
            `;

            const searchPattern = `%${query}%`;
            const [users] = await db.execute(searchQuery, [searchPattern, searchPattern, limit]);

            // 캐시에 저장
            await this.setToCache(cacheKey, users, 120);

            return users;

        } catch (error) {
            logger.error('Error searching users:', error);
            throw error;
        }
    }

    /**
     * 캐시 무효화
     * @param {string} pattern - 캐시 키 패턴
     */
    async invalidateCache(pattern = '*') {
        if (!this.isRedisEnabled || !this.redisClient) return;

        try {
            const keys = await this.redisClient.keys(`${this.cachePrefix}${pattern}`);
            if (keys && keys.length > 0) {
                await this.redisClient.del(keys);
                logger.info(`Cache invalidated: ${keys.length} keys`);
            }
        } catch (error) {
            logger.error('Error invalidating cache:', error);
        }
    }
}

const simpleSearchService = new SimpleSearchService();
export default simpleSearchService;
