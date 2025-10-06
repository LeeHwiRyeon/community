const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');

// Enhanced rate limiting
const createRateLimit = (windowMs, max, message) => {
    return rateLimit({
        windowMs,
        max,
        message: { error: message },
        standardHeaders: true,
        legacyHeaders: false,
        skipSuccessfulRequests: false,
        skipFailedRequests: false,
        keyGenerator: (req) => {
            return req.headers['x-forwarded-for']?.split(',')[0].trim() ||
                req.socket.remoteAddress ||
                req.ip ||
                'unknown';
        }
    });
};

// Input sanitization middleware
const sanitizeInput = (req, res, next) => {
    const sanitize = (obj) => {
        if (typeof obj === 'string') {
            return obj
                .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                .replace(/javascript:/gi, '')
                .replace(/on\w+\s*=/gi, '');
        }
        if (typeof obj === 'object' && obj !== null) {
            for (const key in obj) {
                obj[key] = sanitize(obj[key]);
            }
        }
        return obj;
    };

    if (req.body) req.body = sanitize(req.body);
    if (req.query) req.query = sanitize(req.query);
    if (req.params) req.params = sanitize(req.params);

    next();
};

// SQL injection prevention
const preventSQLInjection = (req, res, next) => {
    const sqlPatterns = [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
        /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi,
        /(\b(OR|AND)\s+['"]\s*=\s*['"])/gi,
        /(\bUNION\s+SELECT\b)/gi,
        /(\bDROP\s+TABLE\b)/gi,
        /(\bINSERT\s+INTO\b)/gi,
        /(\bDELETE\s+FROM\b)/gi,
        /(\bUPDATE\s+.*\s+SET\b)/gi,
        /(\bCREATE\s+TABLE\b)/gi,
        /(\bALTER\s+TABLE\b)/gi
    ];

    const checkForSQLInjection = (obj) => {
        if (typeof obj === 'string') {
            for (const pattern of sqlPatterns) {
                if (pattern.test(obj)) {
                    return true;
                }
            }
        }
        if (typeof obj === 'object' && obj !== null) {
            for (const key in obj) {
                if (checkForSQLInjection(obj[key])) {
                    return true;
                }
            }
        }
        return false;
    };

    if (checkForSQLInjection(req.body) ||
        checkForSQLInjection(req.query) ||
        checkForSQLInjection(req.params)) {
        return res.status(400).json({
            error: 'Invalid input detected',
            code: 'INVALID_INPUT'
        });
    }

    next();
};

// XSS prevention
const preventXSS = (req, res, next) => {
    const xssPatterns = [
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi,
        /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
        /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
        /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
        /<link\b[^<]*(?:(?!<\/link>)<[^<]*)*<\/link>/gi,
        /<meta\b[^<]*(?:(?!<\/meta>)<[^<]*)*<\/meta>/gi
    ];

    const checkForXSS = (obj) => {
        if (typeof obj === 'string') {
            for (const pattern of xssPatterns) {
                if (pattern.test(obj)) {
                    return true;
                }
            }
        }
        if (typeof obj === 'object' && obj !== null) {
            for (const key in obj) {
                if (checkForXSS(obj[key])) {
                    return true;
                }
            }
        }
        return false;
    };

    if (checkForXSS(req.body) ||
        checkForXSS(req.query) ||
        checkForXSS(req.params)) {
        return res.status(400).json({
            error: 'XSS attempt detected',
            code: 'XSS_DETECTED'
        });
    }

    next();
};

// Request size limiter
const requestSizeLimiter = (maxSize = '10mb') => {
    return (req, res, next) => {
        const contentLength = parseInt(req.headers['content-length'] || '0');
        const maxBytes = parseInt(maxSize) * 1024 * 1024; // Convert MB to bytes

        if (contentLength > maxBytes) {
            return res.status(413).json({
                error: 'Request too large',
                code: 'REQUEST_TOO_LARGE',
                maxSize: maxSize
            });
        }

        next();
    };
};

// Security headers middleware
const securityHeaders = (req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), payment=(), usb=()');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

    next();
};

// Validation error handler
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            code: 'VALIDATION_ERROR',
            details: errors.array()
        });
    }
    next();
};

// Common validation rules
const commonValidationRules = {
    email: body('email').isEmail().normalizeEmail(),
    password: body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/),
    username: body('username').isLength({ min: 3, max: 30 }).matches(/^[a-zA-Z0-9_-]+$/),
    id: body('id').isInt({ min: 1 }),
    text: body('text').isLength({ min: 1, max: 1000 }).trim().escape()
};

module.exports = {
    createRateLimit,
    sanitizeInput,
    preventSQLInjection,
    preventXSS,
    requestSizeLimiter,
    securityHeaders,
    handleValidationErrors,
    commonValidationRules
};