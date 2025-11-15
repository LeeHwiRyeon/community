/**
 * CSRF 토큰 유틸리티
 * Double Submit Cookie 패턴 구현
 * 
 * @module csrf
 * @description CSRF(Cross-Site Request Forgery) 공격 방지를 위한 토큰 생성 및 검증 유틸리티
 */

import crypto from 'crypto';

/**
 * CSRF 토큰 설정
 */
const CSRF_CONFIG = {
    // 토큰 길이 (bytes)
    TOKEN_LENGTH: 32,

    // 토큰 만료 시간 (ms) - 1시간
    TOKEN_EXPIRY: 60 * 60 * 1000,

    // 쿠키 옵션
    COOKIE_OPTIONS: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 1000, // 1시간
        path: '/'
    },

    // 헤더 이름
    HEADER_NAME: 'x-csrf-token',
    COOKIE_NAME: 'csrf_token'
};

/**
 * 암호학적으로 안전한 랜덤 토큰 생성
 * 
 * @returns {string} Base64 인코딩된 토큰
 * 
 * @example
 * const token = generateSecureToken();
 * console.log(token); // "Xk7mP3vR9wA2bN5cQ8dT4eY6hU1jM0iO..."
 */
function generateSecureToken() {
    return crypto.randomBytes(CSRF_CONFIG.TOKEN_LENGTH).toString('base64');
}

/**
 * CSRF 토큰 생성 및 저장
 * Double Submit Cookie 패턴 사용
 * 
 * @param {Object} req - Express request 객체
 * @param {Object} res - Express response 객체
 * @returns {string} 생성된 CSRF 토큰
 * 
 * @description
 * 1. 새로운 토큰 생성
 * 2. 세션에 저장 (서버 측)
 * 3. 쿠키에 저장 (클라이언트 측)
 * 4. 토큰 반환 (응답 바디에 포함)
 * 
 * @example
 * app.get('/api/auth/csrf-token', (req, res) => {
 *     const token = generateCSRFToken(req, res);
 *     res.json({ csrfToken: token });
 * });
 */
function generateCSRFToken(req, res) {
    const token = generateSecureToken();
    const timestamp = Date.now();

    // 세션에 저장 (서버 측 검증용)
    if (req.session) {
        req.session.csrfToken = token;
        req.session.csrfTokenTimestamp = timestamp;
    }

    // 쿠키에 저장 (Double Submit Cookie 패턴)
    res.cookie(CSRF_CONFIG.COOKIE_NAME, token, CSRF_CONFIG.COOKIE_OPTIONS);

    return token;
}

/**
 * CSRF 토큰 검증
 * 
 * @param {Object} req - Express request 객체
 * @returns {Object} 검증 결과 { valid: boolean, error?: string }
 * 
 * @description
 * 검증 단계:
 * 1. 헤더에서 토큰 추출
 * 2. 쿠키에서 토큰 추출
 * 3. 세션에서 토큰 추출
 * 4. 세 값이 모두 일치하는지 확인
 * 5. 토큰 만료 시간 확인
 * 
 * @example
 * const validation = validateCSRFToken(req);
 * if (!validation.valid) {
 *     return res.status(403).json({ error: validation.error });
 * }
 */
function validateCSRFToken(req) {
    // 헤더에서 토큰 추출
    const headerToken = req.headers[CSRF_CONFIG.HEADER_NAME] ||
        req.headers[CSRF_CONFIG.HEADER_NAME.toLowerCase()];

    // 쿠키에서 토큰 추출
    const cookieToken = req.cookies?.[CSRF_CONFIG.COOKIE_NAME];

    // 세션에서 토큰 추출
    const sessionToken = req.session?.csrfToken;
    const tokenTimestamp = req.session?.csrfTokenTimestamp;

    // 1. 토큰 존재 확인
    if (!headerToken) {
        return {
            valid: false,
            error: 'CSRF token not found in request header'
        };
    }

    if (!cookieToken) {
        return {
            valid: false,
            error: 'CSRF token not found in cookie'
        };
    }

    if (!sessionToken) {
        return {
            valid: false,
            error: 'CSRF token not found in session'
        };
    }

    // 2. 토큰 일치 확인 (Double Submit Cookie)
    if (headerToken !== cookieToken || headerToken !== sessionToken) {
        return {
            valid: false,
            error: 'CSRF token mismatch'
        };
    }

    // 3. 토큰 만료 확인
    if (tokenTimestamp) {
        const now = Date.now();
        const elapsed = now - tokenTimestamp;

        if (elapsed > CSRF_CONFIG.TOKEN_EXPIRY) {
            return {
                valid: false,
                error: 'CSRF token expired'
            };
        }
    }

    return { valid: true };
}

/**
 * CSRF 토큰 갱신
 * 
 * @param {Object} req - Express request 객체
 * @param {Object} res - Express response 객체
 * @returns {string} 새로운 CSRF 토큰
 * 
 * @description
 * 토큰 갱신 시나리오:
 * - 토큰 만료 임박
 * - 민감한 작업 후
 * - 세션 갱신 시
 * 
 * @example
 * // 토큰 만료 임박 시 자동 갱신
 * if (isTokenExpiringSoon(req)) {
 *     const newToken = refreshCSRFToken(req, res);
 *     res.setHeader('X-CSRF-Token-Refreshed', newToken);
 * }
 */
function refreshCSRFToken(req, res) {
    // 기존 토큰 무효화
    if (req.session) {
        delete req.session.csrfToken;
        delete req.session.csrfTokenTimestamp;
    }

    // 새 토큰 생성
    return generateCSRFToken(req, res);
}

/**
 * CSRF 토큰 만료 확인
 * 
 * @param {Object} req - Express request 객체
 * @param {number} [threshold=0.8] - 만료 임계값 (0~1, 기본: 80%)
 * @returns {boolean} 만료 임박 여부
 * 
 * @description
 * 토큰의 80% 이상 시간이 경과했는지 확인
 * 
 * @example
 * if (isTokenExpiring(req, 0.75)) {
 *     // 75% 경과 시 갱신
 *     refreshCSRFToken(req, res);
 * }
 */
function isTokenExpiring(req, threshold = 0.8) {
    const tokenTimestamp = req.session?.csrfTokenTimestamp;

    if (!tokenTimestamp) {
        return true; // 타임스탬프 없으면 만료로 간주
    }

    const now = Date.now();
    const elapsed = now - tokenTimestamp;
    const expiryThreshold = CSRF_CONFIG.TOKEN_EXPIRY * threshold;

    return elapsed >= expiryThreshold;
}

/**
 * CSRF 토큰 제거
 * 
 * @param {Object} req - Express request 객체
 * @param {Object} res - Express response 객체
 * 
 * @description
 * 로그아웃 시 토큰 정리
 * 
 * @example
 * app.post('/api/auth/logout', (req, res) => {
 *     clearCSRFToken(req, res);
 *     req.session.destroy();
 *     res.json({ message: 'Logged out' });
 * });
 */
function clearCSRFToken(req, res) {
    // 세션에서 제거
    if (req.session) {
        delete req.session.csrfToken;
        delete req.session.csrfTokenTimestamp;
    }

    // 쿠키 제거
    res.clearCookie(CSRF_CONFIG.COOKIE_NAME);
}

/**
 * CSRF 토큰 정보 조회
 * 
 * @param {Object} req - Express request 객체
 * @returns {Object} 토큰 정보
 * 
 * @example
 * const info = getCSRFTokenInfo(req);
 * console.log(info);
 * // {
 * //   exists: true,
 * //   createdAt: 1699500000000,
 * //   expiresAt: 1699503600000,
 * //   remainingTime: 3600000,
 * //   isExpiring: false
 * // }
 */
function getCSRFTokenInfo(req) {
    const token = req.session?.csrfToken;
    const timestamp = req.session?.csrfTokenTimestamp;

    if (!token || !timestamp) {
        return {
            exists: false
        };
    }

    const now = Date.now();
    const expiresAt = timestamp + CSRF_CONFIG.TOKEN_EXPIRY;
    const remainingTime = expiresAt - now;

    return {
        exists: true,
        createdAt: timestamp,
        expiresAt: expiresAt,
        remainingTime: remainingTime,
        isExpiring: isTokenExpiring(req),
        isExpired: remainingTime <= 0
    };
}

/**
 * CSRF 설정 조회 (읽기 전용)
 * 
 * @returns {Object} CSRF 설정
 * 
 * @example
 * const config = getCSRFConfig();
 * console.log(`Token expiry: ${config.TOKEN_EXPIRY}ms`);
 */
function getCSRFConfig() {
    return {
        TOKEN_LENGTH: CSRF_CONFIG.TOKEN_LENGTH,
        TOKEN_EXPIRY: CSRF_CONFIG.TOKEN_EXPIRY,
        HEADER_NAME: CSRF_CONFIG.HEADER_NAME,
        COOKIE_NAME: CSRF_CONFIG.COOKIE_NAME,
        COOKIE_OPTIONS: { ...CSRF_CONFIG.COOKIE_OPTIONS }
    };
}

export {
    // 토큰 생성 및 관리
    generateCSRFToken,
    validateCSRFToken,
    refreshCSRFToken,
    clearCSRFToken,

    // 토큰 상태 확인
    isTokenExpiring,
    getCSRFTokenInfo,

    // 설정
    getCSRFConfig,

    // 상수 (외부에서 참조용)
    CSRF_CONFIG
};

export const CSRF_HEADER_NAME = CSRF_CONFIG.HEADER_NAME;
export const CSRF_COOKIE_NAME = CSRF_CONFIG.COOKIE_NAME;
