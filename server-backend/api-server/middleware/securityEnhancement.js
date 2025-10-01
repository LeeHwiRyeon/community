// 보안 강화 미들웨어
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const { body, validationResult } = require('express-validator');
const xss = require('xss');

// 고급 Rate Limiting
const createRateLimit = (windowMs, max, message) => {
    return rateLimit({
        windowMs,
        max,
        message: { error: message },
        standardHeaders: true,
        legacyHeaders: false,
        skip: (req) => {
            // 관리자 IP는 제외
            return req.ip === '127.0.0.1' || req.ip === '::1';
        }
    });
};

// API Rate Limiting
exports.apiLimiter = createRateLimit(
    15 * 60 * 1000, // 15분
    100, // 최대 100 요청
    'API 요청 한도를 초과했습니다. 15분 후 다시 시도해주세요.'
);

// 로그인 Rate Limiting
exports.loginLimiter = createRateLimit(
    15 * 60 * 1000, // 15분
    5, // 최대 5회 시도
    '로그인 시도가 너무 많습니다. 15분 후 다시 시도해주세요.'
);

// 회원가입 Rate Limiting
exports.registerLimiter = createRateLimit(
    60 * 60 * 1000, // 1시간
    3, // 최대 3회 시도
    '회원가입 시도가 너무 많습니다. 1시간 후 다시 시도해주세요.'
);

// 보안 헤더 설정
exports.securityHeaders = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "ws:", "wss:"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
            upgradeInsecureRequests: []
        }
    },
    crossOriginEmbedderPolicy: false,
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
});

// 입력 검증 및 Sanitization
exports.inputValidation = (req, res, next) => {
    // XSS 방지
    const sanitizeObject = (obj) => {
        for (const key in obj) {
            if (typeof obj[key] === 'string') {
                obj[key] = xss(obj[key]);
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                sanitizeObject(obj[key]);
            }
        }
    };

    if (req.body) sanitizeObject(req.body);
    if (req.query) sanitizeObject(req.query);
    if (req.params) sanitizeObject(req.params);

    next();
};

// SQL Injection 방지
exports.sqlInjectionProtection = (req, res, next) => {
    const sqlPatterns = [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
        /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi,
        /(\b(OR|AND)\s+['"]\s*=\s*['"])/gi,
        /(UNION\s+SELECT)/gi,
        /(DROP\s+TABLE)/gi,
        /(INSERT\s+INTO)/gi,
        /(DELETE\s+FROM)/gi
    ];

    const checkInput = (input) => {
        if (typeof input === 'string') {
            return sqlPatterns.some(pattern => pattern.test(input));
        } else if (typeof input === 'object' && input !== null) {
            return Object.values(input).some(value => checkInput(value));
        }
        return false;
    };

    const hasSqlInjection =
        checkInput(req.body) ||
        checkInput(req.query) ||
        checkInput(req.params);

    if (hasSqlInjection) {
        return res.status(400).json({
            error: '잘못된 요청입니다.',
            code: 'INVALID_INPUT'
        });
    }

    next();
};

// 파일 업로드 보안 검사
exports.fileUploadSecurity = (req, res, next) => {
    if (req.file || req.files) {
        const allowedTypes = [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'application/pdf',
            'text/plain'
        ];

        const maxSize = 5 * 1024 * 1024; // 5MB

        const files = req.files || [req.file];

        for (const file of files) {
            if (!allowedTypes.includes(file.mimetype)) {
                return res.status(400).json({
                    error: '허용되지 않는 파일 형식입니다.',
                    code: 'INVALID_FILE_TYPE'
                });
            }

            if (file.size > maxSize) {
                return res.status(400).json({
                    error: '파일 크기가 너무 큽니다. (최대 5MB)',
                    code: 'FILE_TOO_LARGE'
                });
            }

            // 파일명 검사
            if (!/^[a-zA-Z0-9._-]+$/.test(file.originalname)) {
                return res.status(400).json({
                    error: '잘못된 파일명입니다.',
                    code: 'INVALID_FILENAME'
                });
            }
        }
    }

    next();
};

// CORS 보안 설정
exports.corsSecurity = (req, res, next) => {
    const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:3001',
        'https://your-production-domain.com'
    ];

    const origin = req.headers.origin;

    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    next();
};

// 요청 로깅 (보안 이벤트)
exports.securityLogging = (req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;

        // 보안 관련 이벤트 로깅
        if (res.statusCode >= 400) {
            console.log(`🚨 Security Event: ${req.method} ${req.path} - ${res.statusCode} - ${req.ip} - ${duration}ms`);
        }

        // 의심스러운 활동 감지
        if (duration > 5000) { // 5초 이상
            console.log(`⚠️ Slow Request: ${req.method} ${req.path} - ${duration}ms - ${req.ip}`);
        }
    });

    next();
};

// 세션 보안
exports.sessionSecurity = (req, res, next) => {
    // 세션 하이재킹 방지
    if (req.session) {
        if (!req.session.regenerate) {
            req.session.regenerate((err) => {
                if (err) {
                    console.error('Session regeneration error:', err);
                }
            });
        }
    }

    next();
};

// 관리자 권한 검사
exports.adminOnly = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin' && req.user.role !== 'owner') {
        return res.status(403).json({
            error: '관리자 권한이 필요합니다.',
            code: 'INSUFFICIENT_PERMISSIONS'
        });
    }
    next();
};

// 소유자 권한 검사
exports.ownerOnly = (req, res, next) => {
    if (!req.user || req.user.role !== 'owner') {
        return res.status(403).json({
            error: '소유자 권한이 필요합니다.',
            code: 'INSUFFICIENT_PERMISSIONS'
        });
    }
    next();
};

module.exports = exports;
