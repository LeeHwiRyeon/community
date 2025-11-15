/**
 * CSRF 보호 미들웨어
 * 
 * @module middleware/csrf
 * @description CSRF(Cross-Site Request Forgery) 공격 방지 미들웨어
 */

import {
    validateCSRFToken,
    generateCSRFToken,
    refreshCSRFToken,
    isTokenExpiring,
    getCSRFTokenInfo,
    CSRF_HEADER_NAME
} from '../utils/csrf.js';

/**
 * CSRF 검증을 건너뛸 메서드 목록
 * 안전한(safe) HTTP 메서드는 CSRF 검증 불필요
 */
const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

/**
 * CSRF 검증을 건너뛸 경로 패턴
 * 
 * @description
 * - 웹훅 엔드포인트 (외부 서비스에서 호출)
 * - 공개 API (인증 불필요)
 * - 헬스 체크 엔드포인트
 */
const EXEMPT_PATHS = [
    /^\/api\/webhooks\//,
    /^\/api\/public\//,
    /^\/health$/,
    /^\/api\/health$/,
    /^\/api\/auth\/csrf-token$/  // CSRF 토큰 발급 엔드포인트
];

/**
 * 경로가 CSRF 검증 예외인지 확인
 * 
 * @param {string} path - 요청 경로
 * @returns {boolean} 예외 여부
 */
function isExemptPath(path) {
    return EXEMPT_PATHS.some(pattern => pattern.test(path));
}

/**
 * CSRF 보호 미들웨어
 * 
 * @param {Object} options - 미들웨어 옵션
 * @param {boolean} [options.autoRefresh=true] - 만료 임박 시 자동 갱신
 * @param {number} [options.refreshThreshold=0.8] - 갱신 임계값 (0~1)
 * @param {Function} [options.onValidationFailed] - 검증 실패 콜백
 * @param {Function} [options.onTokenRefreshed] - 토큰 갱신 콜백
 * @returns {Function} Express 미들웨어
 * 
 * @example
 * // 기본 사용
 * app.use(csrfProtection());
 * 
 * @example
 * // 커스텀 설정
 * app.use(csrfProtection({
 *     autoRefresh: true,
 *     refreshThreshold: 0.75,
 *     onValidationFailed: (req, error) => {
 *         logger.warn(`CSRF validation failed: ${error}`);
 *     }
 * }));
 */
function csrfProtection(options = {}) {
    const {
        autoRefresh = true,
        refreshThreshold = 0.8,
        onValidationFailed = null,
        onTokenRefreshed = null
    } = options;

    return (req, res, next) => {
        // 1. Safe 메서드는 CSRF 검증 불필요
        if (SAFE_METHODS.includes(req.method)) {
            return next();
        }

        // 2. 예외 경로는 CSRF 검증 건너뛰기
        if (isExemptPath(req.path)) {
            return next();
        }

        // 3. CSRF 토큰 검증
        const validation = validateCSRFToken(req);

        if (!validation.valid) {
            // 검증 실패 로깅
            if (onValidationFailed) {
                onValidationFailed(req, validation.error);
            }

            console.warn(`[CSRF] Validation failed: ${validation.error}`, {
                method: req.method,
                path: req.path,
                ip: req.ip,
                userAgent: req.get('user-agent')
            });

            return res.status(403).json({
                error: 'CSRF validation failed',
                message: validation.error,
                code: 'CSRF_VALIDATION_FAILED'
            });
        }

        // 4. 토큰 자동 갱신 (옵션)
        if (autoRefresh && isTokenExpiring(req, refreshThreshold)) {
            try {
                const newToken = refreshCSRFToken(req, res);

                // 새 토큰을 응답 헤더에 포함
                res.setHeader('X-CSRF-Token-Refreshed', newToken);

                if (onTokenRefreshed) {
                    onTokenRefreshed(req, newToken);
                }

                console.info('[CSRF] Token auto-refreshed', {
                    path: req.path,
                    userId: req.user?.id
                });
            } catch (error) {
                console.error('[CSRF] Token refresh failed:', error);
                // 갱신 실패 시에도 요청 계속 진행 (기존 토큰은 유효)
            }
        }

        next();
    };
}

/**
 * CSRF 토큰 발급 미들웨어
 * 
 * @description
 * 자동으로 CSRF 토큰을 생성하여 응답에 포함
 * 주로 인증 성공 후 사용
 * 
 * @example
 * app.post('/api/auth/login', loginHandler, generateCSRFTokenMiddleware);
 * 
 * @example
 * // 응답에 토큰 자동 포함
 * app.get('/api/auth/csrf-token', generateCSRFTokenMiddleware, (req, res) => {
 *     // req.csrfToken이 이미 생성되어 있음
 *     res.json({ csrfToken: req.csrfToken });
 * });
 */
function generateCSRFTokenMiddleware(req, res, next) {
    try {
        const token = generateCSRFToken(req, res);

        // 요청 객체에 토큰 첨부 (다음 미들웨어에서 사용 가능)
        req.csrfToken = token;

        // 응답 헤더에도 포함
        res.setHeader('X-CSRF-Token', token);

        console.info('[CSRF] Token generated', {
            path: req.path,
            userId: req.user?.id
        });

        next();
    } catch (error) {
        console.error('[CSRF] Token generation failed:', error);

        return res.status(500).json({
            error: 'CSRF token generation failed',
            code: 'CSRF_GENERATION_FAILED'
        });
    }
}

/**
 * CSRF 토큰 정보 조회 미들웨어
 * 
 * @description
 * 현재 CSRF 토큰의 상태 정보를 응답에 포함
 * 디버깅 및 모니터링 용도
 * 
 * @example
 * app.get('/api/auth/csrf-info', csrfTokenInfoMiddleware);
 */
function csrfTokenInfoMiddleware(req, res) {
    const info = getCSRFTokenInfo(req);

    res.json({
        csrf: {
            ...info,
            headerName: CSRF_HEADER_NAME
        }
    });
}

/**
 * 조건부 CSRF 보호 미들웨어
 * 
 * @param {Function} condition - CSRF 검증이 필요한지 판단하는 함수
 * @param {Object} [options] - csrfProtection 옵션
 * @returns {Function} Express 미들웨어
 * 
 * @description
 * 특정 조건에서만 CSRF 보호 적용
 * 
 * @example
 * // 인증된 사용자에게만 CSRF 보호 적용
 * app.use(conditionalCSRFProtection(
 *     (req) => req.isAuthenticated(),
 *     { autoRefresh: true }
 * ));
 * 
 * @example
 * // 특정 경로에만 적용
 * app.use(conditionalCSRFProtection(
 *     (req) => req.path.startsWith('/api/admin')
 * ));
 */
function conditionalCSRFProtection(condition, options = {}) {
    const csrfMiddleware = csrfProtection(options);

    return (req, res, next) => {
        if (condition(req)) {
            return csrfMiddleware(req, res, next);
        }
        next();
    };
}

/**
 * CSRF 보호 에러 핸들러
 * 
 * @description
 * CSRF 검증 실패 시 커스텀 에러 처리
 * 
 * @example
 * app.use(csrfProtection());
 * app.use(csrfErrorHandler);
 */
function csrfErrorHandler(err, req, res, next) {
    if (err.code === 'CSRF_VALIDATION_FAILED') {
        return res.status(403).json({
            error: 'CSRF validation failed',
            message: 'Invalid or missing CSRF token',
            code: err.code
        });
    }

    next(err);
}

/**
 * CSRF 토큰 갱신 전용 엔드포인트 핸들러
 * 
 * @description
 * 클라이언트가 명시적으로 토큰 갱신 요청 시 사용
 * 
 * @example
 * app.post('/api/auth/csrf-refresh', requireAuth, csrfRefreshHandler);
 */
function csrfRefreshHandler(req, res) {
    try {
        const newToken = refreshCSRFToken(req, res);

        res.json({
            success: true,
            csrfToken: newToken,
            message: 'CSRF token refreshed successfully'
        });
    } catch (error) {
        console.error('[CSRF] Token refresh failed:', error);

        res.status(500).json({
            error: 'CSRF token refresh failed',
            code: 'CSRF_REFRESH_FAILED'
        });
    }
}

/**
 * CSRF 통계 수집 미들웨어
 * 
 * @description
 * CSRF 검증 성공/실패 통계 수집
 * 보안 모니터링 및 감사용
 * 
 * @example
 * const csrfStats = createCSRFStatsCollector();
 * app.use(csrfStats.middleware);
 * 
 * // 통계 조회
 * console.log(csrfStats.getStats());
 */
function createCSRFStatsCollector() {
    const stats = {
        validationAttempts: 0,
        validationSuccess: 0,
        validationFailed: 0,
        tokensGenerated: 0,
        tokensRefreshed: 0,
        lastValidationFailed: null
    };

    return {
        middleware: csrfProtection({
            onValidationFailed: (req, error) => {
                stats.validationAttempts++;
                stats.validationFailed++;
                stats.lastValidationFailed = {
                    timestamp: new Date(),
                    path: req.path,
                    error: error,
                    ip: req.ip
                };
            },
            onTokenRefreshed: () => {
                stats.tokensRefreshed++;
            }
        }),

        getStats: () => ({ ...stats }),

        resetStats: () => {
            Object.assign(stats, {
                validationAttempts: 0,
                validationSuccess: 0,
                validationFailed: 0,
                tokensGenerated: 0,
                tokensRefreshed: 0,
                lastValidationFailed: null
            });
        }
    };
}

export {
    // 주요 미들웨어
    csrfProtection,
    generateCSRFTokenMiddleware,
    csrfTokenInfoMiddleware,

    // 고급 기능
    conditionalCSRFProtection,
    csrfErrorHandler,
    csrfRefreshHandler,
    createCSRFStatsCollector,

    // 유틸리티
    isExemptPath,

    // 상수
    SAFE_METHODS,
    EXEMPT_PATHS
};
