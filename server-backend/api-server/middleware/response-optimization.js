const compression = require('compression');
const logger = require('../utils/logger');

// 응답 압축 최적화
const optimizedCompression = compression({
    level: 6,                    // 압축 레벨 (1-9, 6이 균형점)
    threshold: 1024,             // 1KB 이상만 압축
    filter: (req, res) => {
        // 이미 압축된 응답은 제외
        if (req.headers['x-no-compression']) {
            return false;
        }

        // JSON, HTML, CSS, JS만 압축
        const contentType = res.getHeader('content-type');
        return /json|html|css|javascript|text/.test(contentType);
    }
});

// 응답 크기 최적화
const optimizeResponse = (req, res, next) => {
    const originalJson = res.json;

    res.json = function (data) {
        // 불필요한 데이터 제거
        if (data && typeof data === 'object') {
            data = removeUnnecessaryData(data);
        }

        // 응답 크기 로깅
        const responseSize = JSON.stringify(data).length;
        if (responseSize > 100000) { // 100KB 이상
            logger.warn(`Large response detected: ${responseSize} bytes for ${req.originalUrl}`);
        }

        return originalJson.call(this, data);
    };

    next();
};

// 불필요한 데이터 제거
const removeUnnecessaryData = (obj) => {
    if (Array.isArray(obj)) {
        return obj.map(removeUnnecessaryData);
    }

    if (obj && typeof obj === 'object') {
        const cleaned = {};
        for (const [key, value] of Object.entries(obj)) {
            // null, undefined, 빈 문자열 제거
            if (value !== null && value !== undefined && value !== '') {
                // 중첩된 객체 재귀 처리
                if (typeof value === 'object') {
                    cleaned[key] = removeUnnecessaryData(value);
                } else {
                    cleaned[key] = value;
                }
            }
        }
        return cleaned;
    }

    return obj;
};

// 페이지네이션 최적화
const optimizePagination = (req, res, next) => {
    // 기본 페이지 크기 제한
    const maxLimit = 100;
    const defaultLimit = 20;

    if (req.query.limit) {
        const limit = parseInt(req.query.limit);
        if (limit > maxLimit) {
            req.query.limit = maxLimit;
        }
    } else {
        req.query.limit = defaultLimit;
    }

    next();
};

// 쿼리 최적화
const optimizeQueries = (req, res, next) => {
    // N+1 쿼리 방지를 위한 include 최적화
    if (req.query.include) {
        const includes = req.query.include.split(',');
        req.optimizedIncludes = includes.map(include => ({
            association: include.trim(),
            required: false
        }));
    }

    next();
};

// 응답 캐싱 헤더 설정
const setCacheHeaders = (req, res, next) => {
    // 정적 리소스는 1시간 캐시
    if (req.path.startsWith('/static/') || req.path.startsWith('/assets/')) {
        res.setHeader('Cache-Control', 'public, max-age=3600');
    }
    // API 응답은 5분 캐시
    else if (req.path.startsWith('/api/')) {
        res.setHeader('Cache-Control', 'private, max-age=300');
    }
    // HTML은 캐시하지 않음
    else {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }

    next();
};

// ETag 생성 및 검증
const etagMiddleware = (req, res, next) => {
    const originalJson = res.json;

    res.json = function (data) {
        // ETag 생성
        const etag = generateETag(data);
        res.setHeader('ETag', etag);

        // 클라이언트 ETag와 비교
        if (req.headers['if-none-match'] === etag) {
            return res.status(304).end();
        }

        return originalJson.call(this, data);
    };

    next();
};

// ETag 생성 함수
const generateETag = (data) => {
    const crypto = require('crypto');
    const str = JSON.stringify(data);
    return crypto.createHash('md5').update(str).digest('hex');
};

module.exports = {
    optimizedCompression,
    optimizeResponse,
    optimizePagination,
    optimizeQueries,
    setCacheHeaders,
    etagMiddleware
};
