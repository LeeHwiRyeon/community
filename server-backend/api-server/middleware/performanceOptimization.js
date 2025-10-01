const compression = require('compression');
const logger = require('../utils/logger');

// Gzip 압축 설정
const compressionMiddleware = compression({
    level: 6, // 압축 레벨 (1-9)
    threshold: 1024, // 1KB 이상의 응답만 압축
    filter: (req, res) => {
        // 이미 압축된 응답은 제외
        if (req.headers['x-no-compression']) {
            return false;
        }

        // JSON, HTML, CSS, JS, XML만 압축
        const contentType = res.getHeader('content-type') || '';
        return /text|application\/(json|javascript|css|xml)/.test(contentType);
    }
});

// 캐시 헤더 설정
const cacheHeaders = (req, res, next) => {
    const path = req.path;

    // 정적 리소스는 1년 캐시
    if (path.match(/\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        res.setHeader('Expires', new Date(Date.now() + 31536000000).toUTCString());
    }
    // API 응답은 5분 캐시
    else if (path.startsWith('/api/') && req.method === 'GET') {
        res.setHeader('Cache-Control', 'private, max-age=300');
        res.setHeader('ETag', `"${Date.now()}"`);
    }
    // HTML은 캐시하지 않음
    else {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
    }

    next();
};

// 응답 크기 최적화
const responseOptimization = (req, res, next) => {
    const originalSend = res.send;

    res.send = function (data) {
        // JSON 응답 최적화
        if (res.getHeader('content-type')?.includes('application/json')) {
            try {
                const parsed = JSON.parse(data);

                // 불필요한 필드 제거
                if (parsed.data && Array.isArray(parsed.data)) {
                    parsed.data = parsed.data.map(item => {
                        // 민감한 정보 제거
                        delete item.password;
                        delete item.twoFactorSecret;
                        delete item.emailVerificationToken;
                        delete item.passwordResetToken;

                        return item;
                    });
                }

                data = JSON.stringify(parsed);
            } catch (error) {
                // JSON 파싱 실패 시 원본 데이터 사용
            }
        }

        // 응답 크기 로깅
        const size = Buffer.byteLength(data, 'utf8');
        if (size > 1024 * 1024) { // 1MB 이상
            logger.warn('Large response detected', {
                reqId: res.locals.reqId,
                size: `${(size / 1024 / 1024).toFixed(2)}MB`,
                path: req.path,
                method: req.method
            });
        }

        return originalSend.call(this, data);
    };

    next();
};

// 데이터베이스 연결 풀 최적화
const dbConnectionOptimization = (req, res, next) => {
    // 요청당 최대 연결 시간 설정
    const startTime = Date.now();
    const maxConnectionTime = 30000; // 30초

    res.on('close', () => {
        const duration = Date.now() - startTime;
        if (duration > maxConnectionTime) {
            logger.warn('Long database connection detected', {
                reqId: res.locals.reqId,
                duration: `${duration}ms`,
                path: req.path
            });
        }
    });

    next();
};

// 메모리 사용량 모니터링
const memoryMonitoring = (req, res, next) => {
    const startMemory = process.memoryUsage();

    res.on('finish', () => {
        const endMemory = process.memoryUsage();
        const memoryDelta = endMemory.heapUsed - startMemory.heapUsed;

        // 메모리 사용량이 10MB 이상 증가한 경우 로깅
        if (memoryDelta > 10 * 1024 * 1024) {
            logger.warn('High memory usage detected', {
                reqId: res.locals.reqId,
                memoryDelta: `${(memoryDelta / 1024 / 1024).toFixed(2)}MB`,
                path: req.path,
                method: req.method
            });
        }
    });

    next();
};

// 쿼리 최적화 힌트
const queryOptimization = (req, res, next) => {
    // 페이지네이션 기본값 설정
    if (req.query.page && (!req.query.limit || req.query.limit > 100)) {
        req.query.limit = 20; // 기본 페이지 크기
    }

    // 정렬 최적화
    if (req.query.sort && !req.query.sort.match(/^[a-zA-Z_][a-zA-Z0-9_]*$/)) {
        req.query.sort = 'createdAt'; // 기본 정렬
    }

    // 검색어 길이 제한
    if (req.query.q && req.query.q.length > 100) {
        req.query.q = req.query.q.substring(0, 100);
    }

    next();
};

// 실시간 성능 메트릭
const performanceMetrics = (req, res, next) => {
    const startTime = Date.now();
    const startMemory = process.memoryUsage();

    res.on('finish', () => {
        const duration = Date.now() - startTime;
        const endMemory = process.memoryUsage();

        // 성능 메트릭 로깅
        const metrics = {
            reqId: res.locals.reqId,
            duration: duration,
            memoryUsed: endMemory.heapUsed - startMemory.heapUsed,
            status: res.statusCode,
            path: req.path,
            method: req.method,
            timestamp: new Date().toISOString()
        };

        // 느린 요청 감지
        if (duration > 1000) { // 1초 이상
            logger.warn('Slow request detected', metrics);
        }

        // 메모리 누수 감지
        if (metrics.memoryUsed > 50 * 1024 * 1024) { // 50MB 이상
            logger.warn('High memory usage detected', metrics);
        }

        // 성공적인 요청 로깅
        if (res.statusCode < 400) {
            logger.info('Request completed', metrics);
        }
    });

    next();
};

// 리소스 정리
const resourceCleanup = (req, res, next) => {
    // 요청 완료 후 정리할 리소스들
    const cleanupTasks = [];

    res.on('close', () => {
        // 정리 작업 실행
        cleanupTasks.forEach(task => {
            try {
                task();
            } catch (error) {
                logger.error('Cleanup task failed', { error: error.message, reqId: res.locals.reqId });
            }
        });
    });

    // 정리 작업 추가 함수
    req.addCleanupTask = (task) => {
        cleanupTasks.push(task);
    };

    next();
};

// 동시 요청 제한
const concurrencyLimit = (maxConcurrent = 100) => {
    let currentRequests = 0;

    return (req, res, next) => {
        if (currentRequests >= maxConcurrent) {
            return res.status(503).json({
                success: false,
                message: 'Server is busy, please try again later',
                code: 'SERVER_BUSY'
            });
        }

        currentRequests++;

        res.on('finish', () => {
            currentRequests--;
        });

        res.on('close', () => {
            currentRequests--;
        });

        next();
    };
};

module.exports = {
    compressionMiddleware,
    cacheHeaders,
    responseOptimization,
    dbConnectionOptimization,
    memoryMonitoring,
    queryOptimization,
    performanceMetrics,
    resourceCleanup,
    concurrencyLimit
};
