/**
 * Database Performance Optimization
 * 성능 최적화된 쿼리 헬퍼 함수들
 */

import { query } from '../db.js';
import queryCache from './query-cache.js';

/**
 * 캐시된 쿼리 실행
 */
export async function cachedQuery(sql, params = [], options = {}) {
    const { cache = true, ttl } = options;

    // 캐시 비활성화 시 직접 쿼리 실행
    if (!cache) {
        return await query(sql, params);
    }

    // 캐시 조회
    const cached = queryCache.get(sql, params);
    if (cached) {
        return cached;
    }

    // 쿼리 실행 및 캐시 저장
    const result = await query(sql, params);
    queryCache.set(sql, params, result);

    return result;
}

/**
 * 페이지네이션 쿼리 최적화
 */
export async function paginatedQuery(baseQuery, params = [], options = {}) {
    const {
        limit = 20,
        offset = 0,
        orderBy = 'created_at',
        order = 'DESC',
        cache = true,
    } = options;

    const paginatedSql = `
        ${baseQuery}
        ORDER BY ${orderBy} ${order}
        LIMIT ? OFFSET ?
    `;

    const result = await cachedQuery(
        paginatedSql,
        [...params, limit, offset],
        { cache }
    );

    return result;
}

/**
 * 총 개수 조회 (캐시 지원)
 */
export async function countQuery(tableName, whereClause = '', params = []) {
    const sql = whereClause
        ? `SELECT COUNT(*) as total FROM ${tableName} WHERE ${whereClause}`
        : `SELECT COUNT(*) as total FROM ${tableName}`;

    const result = await cachedQuery(sql, params);
    return result[0]?.total || 0;
}

/**
 * 배치 삽입 최적화
 */
export async function batchInsert(tableName, records) {
    if (!records || records.length === 0) {
        return { insertedCount: 0 };
    }

    const keys = Object.keys(records[0]);
    const placeholders = keys.map(() => '?').join(', ');
    const sql = `INSERT INTO ${tableName} (${keys.join(', ')}) VALUES (${placeholders})`;

    let insertedCount = 0;

    for (const record of records) {
        const values = keys.map((key) => record[key]);
        await query(sql, values);
        insertedCount++;
    }

    // 해당 테이블 관련 캐시 무효화
    queryCache.invalidate(tableName);

    return { insertedCount };
}

/**
 * 조건부 업데이트 (변경사항이 있을 때만 실행)
 */
export async function conditionalUpdate(tableName, updates, whereClause, params) {
    const setClause = Object.keys(updates)
        .map((key) => `${key} = ?`)
        .join(', ');

    const sql = `UPDATE ${tableName} SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE ${whereClause}`;
    const values = [...Object.values(updates), ...params];

    const result = await query(sql, values);

    // 해당 테이블 관련 캐시 무효화
    queryCache.invalidate(tableName);

    return result;
}

/**
 * 소프트 삭제 최적화
 */
export async function softDelete(tableName, id) {
    const sql = `UPDATE ${tableName} SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?`;
    const result = await query(sql, [id]);

    // 해당 테이블 관련 캐시 무효화
    queryCache.invalidate(tableName);

    return result;
}

/**
 * 통계 쿼리 최적화 (집계 함수 사용)
 */
export async function getStats(options = {}) {
    const { cache = true, ttl = 300000 } = options;

    const statsQuery = `
        SELECT 
            (SELECT COUNT(*) FROM users WHERE deleted_at IS NULL) as total_users,
            (SELECT COUNT(*) FROM posts WHERE deleted_at IS NULL) as total_posts,
            (SELECT COUNT(*) FROM comments WHERE deleted_at IS NULL) as total_comments,
            (SELECT COUNT(*) FROM post_reactions WHERE deleted_at IS NULL) as total_reactions
    `;

    return await cachedQuery(statsQuery, [], { cache, ttl });
}

/**
 * 검색 최적화 (LIKE 쿼리)
 */
export async function searchQuery(tableName, searchFields, searchTerm, options = {}) {
    const {
        limit = 20,
        offset = 0,
        whereClause = '',
        params = [],
        cache = false, // 검색은 기본적으로 캐시 비활성화
    } = options;

    const searchConditions = searchFields
        .map((field) => `${field} LIKE ?`)
        .join(' OR ');

    const searchParams = searchFields.map(() => `%${searchTerm}%`);

    const sql = whereClause
        ? `SELECT * FROM ${tableName} WHERE (${searchConditions}) AND ${whereClause} LIMIT ? OFFSET ?`
        : `SELECT * FROM ${tableName} WHERE ${searchConditions} LIMIT ? OFFSET ?`;

    return await cachedQuery(
        sql,
        [...searchParams, ...params, limit, offset],
        { cache }
    );
}

/**
 * 트랜잭션 헬퍼
 */
export async function transaction(callback) {
    const pool = getPool();
    if (!pool) throw new Error('Database pool not available');

    try {
        pool.beginTransaction();
        const result = await callback();
        pool.commit();
        return result;
    } catch (error) {
        pool.rollback();
        throw error;
    }
}

/**
 * 캐시 무효화 헬퍼
 */
export function invalidateCache(pattern) {
    queryCache.invalidate(pattern);
}

/**
 * 캐시 통계 조회
 */
export function getCacheStats() {
    return queryCache.getStats();
}

export default {
    cachedQuery,
    paginatedQuery,
    countQuery,
    batchInsert,
    conditionalUpdate,
    softDelete,
    getStats,
    searchQuery,
    transaction,
    invalidateCache,
    getCacheStats,
};
