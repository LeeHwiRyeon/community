/**
 * Query Cache System
 * 자주 사용되는 쿼리의 결과를 메모리에 캐싱하여 성능 향상
 */

class QueryCache {
    constructor(ttl = 300000) { // 기본 5분 TTL
        this.cache = new Map();
        this.ttl = ttl;
    }

    /**
     * 캐시 키 생성
     */
    _generateKey(sql, params) {
        return `${sql}:${JSON.stringify(params)}`;
    }

    /**
     * 캐시에서 조회
     */
    get(sql, params = []) {
        const key = this._generateKey(sql, params);
        const cached = this.cache.get(key);

        if (!cached) {
            return null;
        }

        // TTL 체크
        if (Date.now() - cached.timestamp > this.ttl) {
            this.cache.delete(key);
            return null;
        }

        return cached.data;
    }

    /**
     * 캐시에 저장
     */
    set(sql, params = [], data) {
        const key = this._generateKey(sql, params);
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
        });
    }

    /**
     * 특정 패턴의 캐시 무효화
     */
    invalidate(pattern) {
        const keys = Array.from(this.cache.keys());
        for (const key of keys) {
            if (key.includes(pattern)) {
                this.cache.delete(key);
            }
        }
    }

    /**
     * 전체 캐시 초기화
     */
    clear() {
        this.cache.clear();
    }

    /**
     * 캐시 크기 확인
     */
    size() {
        return this.cache.size;
    }

    /**
     * 캐시 통계
     */
    getStats() {
        const now = Date.now();
        let validEntries = 0;
        let expiredEntries = 0;

        for (const [key, value] of this.cache.entries()) {
            if (now - value.timestamp > this.ttl) {
                expiredEntries++;
            } else {
                validEntries++;
            }
        }

        return {
            total: this.cache.size,
            valid: validEntries,
            expired: expiredEntries,
            ttl: this.ttl,
        };
    }

    /**
     * 만료된 캐시 정리
     */
    cleanup() {
        const now = Date.now();
        const keys = Array.from(this.cache.keys());

        for (const key of keys) {
            const cached = this.cache.get(key);
            if (cached && now - cached.timestamp > this.ttl) {
                this.cache.delete(key);
            }
        }
    }
}

// 전역 캐시 인스턴스 생성
const queryCache = new QueryCache(300000); // 5분 TTL

// 주기적으로 만료된 캐시 정리 (10분마다)
setInterval(() => {
    queryCache.cleanup();
}, 600000);

export default queryCache;
