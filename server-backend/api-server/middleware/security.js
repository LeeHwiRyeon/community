const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const logger = require('../utils/logger');

// 기본 보안 헤더 설정
const securityHeaders = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "ws:", "wss:"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
    crossOriginEmbedderPolicy: false,
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
});

// API 요청 제한
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15분
    max: 100, // 최대 100 요청
    message: {
        success: false,
        message: '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// 로그인 시도 제한
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15분
    max: 5, // 최대 5번 시도
    message: {
        success: false,
        message: '로그인 시도가 너무 많습니다. 15분 후 다시 시도해주세요.'
    },
    skipSuccessfulRequests: true,
});

// 회원가입 제한
const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1시간
    max: 3, // 최대 3번 시도
    message: {
        success: false,
        message: '회원가입 시도가 너무 많습니다. 1시간 후 다시 시도해주세요.'
    },
});

// IP 화이트리스트 체크
const ipWhitelist = (req, res, next) => {
    const allowedIPs = process.env.ALLOWED_IPS ? process.env.ALLOWED_IPS.split(',') : [];

    if (allowedIPs.length > 0) {
        const clientIP = req.ip || req.connection.remoteAddress;
        if (!allowedIPs.includes(clientIP)) {
            logger.warn(`Blocked request from unauthorized IP: ${clientIP}`);
            return res.status(403).json({
                success: false,
                message: '접근이 거부되었습니다.'
            });
        }
    }

    next();
};

// 요청 로깅
const requestLogger = (req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        const logData = {
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            timestamp: new Date().toISOString()
        };

        if (res.statusCode >= 400) {
            logger.warn('HTTP Request', logData);
        } else {
            logger.info('HTTP Request', logData);
        }
    });

    next();
};

// SQL 인젝션 방지
const sqlInjectionProtection = (req, res, next) => {
    const sqlPatterns = [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
        /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi,
        /(\b(OR|AND)\s+['"]\s*=\s*['"])/gi,
        /(\b(OR|AND)\s+['"]\s*LIKE\s*['"])/gi
    ];

    const checkString = JSON.stringify(req.body) + JSON.stringify(req.query) + JSON.stringify(req.params);

    for (const pattern of sqlPatterns) {
        if (pattern.test(checkString)) {
            logger.warn(`SQL injection attempt detected from IP: ${req.ip}`);
            return res.status(400).json({
                success: false,
                message: '잘못된 요청입니다.'
            });
        }
    }

    next();
};

// XSS 방지
const xssProtection = (req, res, next) => {
    const xssPatterns = [
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi
    ];

    const checkString = JSON.stringify(req.body) + JSON.stringify(req.query) + JSON.stringify(req.params);

    for (const pattern of xssPatterns) {
        if (pattern.test(checkString)) {
            logger.warn(`XSS attempt detected from IP: ${req.ip}`);
            return res.status(400).json({
                success: false,
                message: '잘못된 요청입니다.'
            });
        }
    }

    next();
};

module.exports = {
    securityHeaders,
    apiLimiter,
    loginLimiter,
    registerLimiter,
    ipWhitelist,
    requestLogger,
    sqlInjectionProtection,
    xssProtection
};
