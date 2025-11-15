const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');

// 고급 보안 미들웨어 클래스
class AdvancedSecurity {
    constructor() {
        this.failedAttempts = new Map();
        this.blockedIPs = new Set();
        this.suspiciousActivities = new Map();
    }

    // 헬멧 보안 헤더 설정
    getHelmetConfig() {
        return helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
                    scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
                    imgSrc: ["'self'", "data:", "https:"],
                    connectSrc: ["'self'"],
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
                preload: true,
            },
        });
    }

    // CORS 설정
    getCorsConfig() {
        return cors({
            origin: (origin, callback) => {
                const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];

                if (!origin || allowedOrigins.includes(origin)) {
                    callback(null, true);
                } else {
                    callback(new Error('CORS 정책에 의해 차단되었습니다.'));
                }
            },
            credentials: true,
            optionsSuccessStatus: 200,
        });
    }

    // 속도 제한 설정
    getRateLimitConfig() {
        return rateLimit({
            windowMs: 15 * 60 * 1000, // 15분
            max: 100, // 최대 100 요청
            message: {
                error: '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.',
                retryAfter: '15분',
            },
            standardHeaders: true,
            legacyHeaders: false,
            handler: (req, res) => {
                this.logSuspiciousActivity(req, 'RATE_LIMIT_EXCEEDED');
                res.status(429).json({
                    error: '너무 많은 요청이 발생했습니다.',
                    retryAfter: '15분',
                });
            },
        });
    }

    // 엄격한 속도 제한 (로그인, 회원가입 등)
    getStrictRateLimitConfig() {
        return rateLimit({
            windowMs: 15 * 60 * 1000, // 15분
            max: 5, // 최대 5 요청
            message: {
                error: '너무 많은 시도가 발생했습니다. 15분 후 다시 시도해주세요.',
            },
            skipSuccessfulRequests: true,
            handler: (req, res) => {
                this.logSuspiciousActivity(req, 'STRICT_RATE_LIMIT_EXCEEDED');
                res.status(429).json({
                    error: '너무 많은 시도가 발생했습니다. 15분 후 다시 시도해주세요.',
                });
            },
        });
    }

    // JWT 검증 미들웨어
    jwtValidation(req, res, next) {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ error: '액세스 토큰이 필요합니다.' });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
    next();
        } catch (error) {
            this.logSuspiciousActivity(req, 'INVALID_JWT');
            return res.status(401).json({ error: '유효하지 않은 토큰입니다.' });
        }
    }

    // 역할 기반 접근 제어
    roleBasedAccess(roles) {
        return (req, res, next) => {
            if (!req.user) {
                return res.status(401).json({ error: '인증이 필요합니다.' });
            }

            if (!roles.includes(req.user.role)) {
                this.logSuspiciousActivity(req, 'UNAUTHORIZED_ACCESS');
                return res.status(403).json({ error: '접근 권한이 없습니다.' });
            }

            next();
        };
    }

    // 고급 입력 검증
    advancedInputValidation() {
        return [
            body('email').isEmail().normalizeEmail().withMessage('유효한 이메일을 입력하세요.'),
            body('password')
                .isLength({ min: 8 })
                .withMessage('비밀번호는 최소 8자 이상이어야 합니다.')
                .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
                .withMessage('비밀번호는 대문자, 소문자, 숫자, 특수문자를 포함해야 합니다.'),
            body('username')
                .isLength({ min: 3, max: 20 })
                .withMessage('사용자명은 3-20자 사이여야 합니다.')
                .matches(/^[a-zA-Z0-9_]+$/)
                .withMessage('사용자명은 영문, 숫자, 언더스코어만 사용 가능합니다.'),
            body('title')
                .isLength({ min: 1, max: 200 })
                .withMessage('제목은 1-200자 사이여야 합니다.')
                .escape(),
            body('content')
                .isLength({ min: 1, max: 10000 })
                .withMessage('내용은 1-10000자 사이여야 합니다.')
                .escape(),
            (req, res, next) => {
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    this.logSuspiciousActivity(req, 'INVALID_INPUT');
                    return res.status(400).json({
                        error: '입력 데이터가 유효하지 않습니다.',
                        details: errors.array(),
                    });
                }
                next();
            },
        ];
    }

    // SQL 인젝션 방지
    sqlInjectionPrevention(req, res, next) {
    const sqlPatterns = [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
        /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi,
        /(\b(OR|AND)\s+['"]\s*=\s*['"])/gi,
        /(\b(OR|AND)\s+['"]\s*LIKE\s*['"])/gi,
            /(\b(OR|AND)\s+['"]\s*IN\s*\(/gi,
            /(\b(OR|AND)\s+['"]\s*BETWEEN\s+)/gi,
            /(\b(OR|AND)\s+['"]\s*EXISTS\s*\(/gi,
            /(\b(OR|AND)\s+['"]\s*NOT\s+EXISTS\s*\(/gi,
            /(\b(OR|AND)\s+['"]\s*IS\s+NULL)/gi,
            /(\b(OR|AND)\s+['"]\s*IS\s+NOT\s+NULL)/gi,
        ];

        const checkForSQLInjection = (obj) => {
            for (const key in obj) {
                if (typeof obj[key] === 'string') {
    for (const pattern of sqlPatterns) {
                        if (pattern.test(obj[key])) {
                            this.logSuspiciousActivity(req, 'SQL_INJECTION_ATTEMPT');
                            return res.status(400).json({
                                error: '잘못된 입력이 감지되었습니다.',
                            });
                        }
                    }
                } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                    if (checkForSQLInjection(obj[key])) {
                        return true;
                    }
                }
            }
            return false;
        };

        if (checkForSQLInjection(req.body) || checkForSQLInjection(req.query) || checkForSQLInjection(req.params)) {
            return;
        }

        next();
    }

    // XSS 방지
    xssPrevention(req, res, next) {
    const xssPatterns = [
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
            /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
            /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
            /<link\b[^<]*(?:(?!<\/link>)<[^<]*)*<\/link>/gi,
            /<meta\b[^<]*(?:(?!<\/meta>)<[^<]*)*<\/meta>/gi,
            /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi,
        /javascript:/gi,
            /vbscript:/gi,
            /onload\s*=/gi,
            /onerror\s*=/gi,
            /onclick\s*=/gi,
            /onmouseover\s*=/gi,
        ];

        const checkForXSS = (obj) => {
            for (const key in obj) {
                if (typeof obj[key] === 'string') {
    for (const pattern of xssPatterns) {
                        if (pattern.test(obj[key])) {
                            this.logSuspiciousActivity(req, 'XSS_ATTEMPT');
                            return res.status(400).json({
                                error: '잘못된 입력이 감지되었습니다.',
                            });
                        }
                    }
                } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                    if (checkForXSS(obj[key])) {
                        return true;
                    }
                }
            }
            return false;
        };

        if (checkForXSS(req.body) || checkForXSS(req.query) || checkForXSS(req.params)) {
            return;
    }

    next();
    }

    // 의심스러운 활동 로깅
    logSuspiciousActivity(req, activityType) {
        const clientIP = req.ip || req.connection.remoteAddress;
        const userAgent = req.get('User-Agent');
        const timestamp = new Date().toISOString();

        const activity = {
            type: activityType,
            ip: clientIP,
            userAgent,
            timestamp,
            url: req.originalUrl,
            method: req.method,
            userId: req.user?.id || null,
        };

        // 메모리에 저장 (실제 구현에서는 데이터베이스 사용)
        if (!this.suspiciousActivities.has(clientIP)) {
            this.suspiciousActivities.set(clientIP, []);
        }

        this.suspiciousActivities.get(clientIP).push(activity);

        // 로그 출력
        console.warn(`🚨 의심스러운 활동 감지: ${activityType}`, {
            ip: clientIP,
            userAgent,
            url: req.originalUrl,
            userId: req.user?.id,
        });

        // 특정 활동이 많이 발생하면 IP 차단
        this.checkForBlocking(clientIP, activityType);
    }

    // IP 차단 검사
    checkForBlocking(ip, activityType) {
        const activities = this.suspiciousActivities.get(ip) || [];
        const recentActivities = activities.filter(
            activity => Date.now() - new Date(activity.timestamp).getTime() < 3600000 // 1시간
        );

        // 1시간 내에 10번 이상 의심스러운 활동이 발생하면 차단
        if (recentActivities.length >= 10) {
            this.blockedIPs.add(ip);
            console.error(`🚫 IP 차단: ${ip} (의심스러운 활동 ${recentActivities.length}회)`);
        }
    }

    // 차단된 IP 확인
    checkBlockedIP(req, res, next) {
        const clientIP = req.ip || req.connection.remoteAddress;

        if (this.blockedIPs.has(clientIP)) {
            return res.status(403).json({
                error: '접근이 차단되었습니다.',
                reason: '의심스러운 활동이 감지되었습니다.',
        });
    }

    next();
    }

    // 실패한 로그인 시도 추적
    trackFailedLogin(ip, username) {
        const key = `${ip}:${username}`;
        const attempts = this.failedAttempts.get(key) || 0;
        this.failedAttempts.set(key, attempts + 1);

        // 5번 이상 실패하면 계정 잠금
        if (attempts >= 4) {
            console.warn(`🔒 계정 잠금: ${username} (IP: ${ip})`);
            return true; // 계정 잠금됨
        }

        return false;
    }

    // 성공한 로그인 시 실패 카운터 리셋
    resetFailedLogin(ip, username) {
        const key = `${ip}:${username}`;
        this.failedAttempts.delete(key);
    }

    // 보안 헤더 추가
    securityHeaders(req, res, next) {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

        next();
    }

    // 요청 크기 제한
    requestSizeLimit(sizeLimit = '10mb') {
    return (req, res, next) => {
            const contentLength = parseInt(req.get('content-length') || '0');
            const maxSize = this.parseSize(sizeLimit);

            if (contentLength > maxSize) {
                this.logSuspiciousActivity(req, 'REQUEST_SIZE_EXCEEDED');
                return res.status(413).json({
                    error: '요청 크기가 너무 큽니다.',
                    maxSize: sizeLimit,
            });
        }

        next();
    };
    }

    // 크기 파싱 헬퍼
    parseSize(size) {
        const units = { b: 1, kb: 1024, mb: 1024 * 1024, gb: 1024 * 1024 * 1024 };
        const match = size.match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)$/i);

        if (!match) return 10 * 1024 * 1024; // 기본 10MB

        const value = parseFloat(match[1]);
        const unit = match[2].toLowerCase();

        return value * units[unit];
    }

    // 감사 로그
    auditLogger(req, res, next) {
    const startTime = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - startTime;
            const logData = {
                timestamp: new Date().toISOString(),
                method: req.method,
                url: req.originalUrl,
                statusCode: res.statusCode,
                duration: duration,
                ip: req.ip || req.connection.remoteAddress,
                userAgent: req.get('User-Agent'),
                userId: req.user?.id || null,
                contentLength: res.get('content-length') || 0,
            };

            // 중요한 작업만 로깅
            if (this.shouldLogRequest(req)) {
                console.log('📝 감사 로그:', logData);
        }
    });

    next();
    }

    // 로깅할 요청인지 확인
    shouldLogRequest(req) {
        const sensitivePaths = ['/api/auth', '/api/admin', '/api/users'];
        const sensitiveMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];

        return sensitivePaths.some(path => req.originalUrl.startsWith(path)) ||
            sensitiveMethods.includes(req.method);
    }

    // 관리자 토큰 인증
    adminTokenAuth(req, res, next) {
        const adminToken = req.header('X-Admin-Token');

        if (!adminToken) {
            return res.status(401).json({ error: '관리자 토큰이 필요합니다.' });
        }

        if (adminToken !== process.env.ADMIN_TOKEN) {
            this.logSuspiciousActivity(req, 'INVALID_ADMIN_TOKEN');
            return res.status(403).json({ error: '유효하지 않은 관리자 토큰입니다.' });
        }

        next();
    }

    // 보안 통계 조회
    getSecurityStats() {
        return {
            blockedIPs: this.blockedIPs.size,
            suspiciousActivities: this.suspiciousActivities.size,
            failedAttempts: this.failedAttempts.size,
            timestamp: new Date().toISOString(),
        };
    }

    // 보안 상태 초기화 (관리자용)
    resetSecurityState() {
        this.blockedIPs.clear();
        this.suspiciousActivities.clear();
        this.failedAttempts.clear();
        console.log('🔄 보안 상태가 초기화되었습니다.');
    }
}

// 싱글톤 인스턴스
const advancedSecurity = new AdvancedSecurity();

module.exports = advancedSecurity;
