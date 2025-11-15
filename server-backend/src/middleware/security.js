import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import validator from 'validator';
import xss from 'xss';
import mongoSanitize from 'express-mongo-sanitize';
import { body, validationResult } from 'express-validator';

// Security configuration
const SECURITY_CONFIG = {
    JWT_SECRET: process.env.JWT_SECRET, // No fallback - must be set in .env
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
    REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
    BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS) || 12,
    MAX_LOGIN_ATTEMPTS: parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5,
    LOCKOUT_TIME: parseInt(process.env.LOCKOUT_TIME) || 15 * 60 * 1000, // 15 minutes
    PASSWORD_MIN_LENGTH: parseInt(process.env.PASSWORD_MIN_LENGTH) || 8,
    SESSION_TIMEOUT: parseInt(process.env.SESSION_TIMEOUT) || 30 * 60 * 1000 // 30 minutes
};

// Validate JWT_SECRET is set
if (!SECURITY_CONFIG.JWT_SECRET) {
    console.error('❌ FATAL: JWT_SECRET not set in environment variables');
    process.exit(1);
}

// Rate limiting for different endpoints
const createRateLimit = (windowMs, max, message) => {
    return rateLimit({
        windowMs,
        max,
        message: { error: message },
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res) => {
            res.status(429).json({
                error: message,
                retryAfter: Math.round(windowMs / 1000)
            });
        }
    });
};

// Security rate limits
const securityRateLimits = {
    // General API rate limiting
    api: createRateLimit(
        15 * 60 * 1000, // 15 minutes
        1000, // 1000 requests per window
        'Too many requests from this IP, please try again later'
    ),

    // Authentication rate limiting
    auth: createRateLimit(
        15 * 60 * 1000, // 15 minutes
        5, // 5 attempts per window
        'Too many authentication attempts, please try again later'
    ),

    // Password reset rate limiting
    passwordReset: createRateLimit(
        60 * 60 * 1000, // 1 hour
        3, // 3 attempts per hour
        'Too many password reset attempts, please try again later'
    ),

    // File upload rate limiting
    upload: createRateLimit(
        60 * 60 * 1000, // 1 hour
        50, // 50 uploads per hour
        'Too many file uploads, please try again later'
    ),

    // TODO operations rate limiting
    todo: createRateLimit(
        15 * 60 * 1000, // 15 minutes
        500, // 500 operations per window
        'Too many TODO operations, please try again later'
    )
};

// Input validation middleware
const inputValidation = {
    // Email validation
    email: body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),

    // Password validation
    password: body('password')
        .isLength({ min: SECURITY_CONFIG.PASSWORD_MIN_LENGTH })
        .withMessage(`Password must be at least ${SECURITY_CONFIG.PASSWORD_MIN_LENGTH} characters long`)
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),

    // TODO title validation
    todoTitle: body('title')
        .trim()
        .isLength({ min: 1, max: 200 })
        .withMessage('Title must be between 1 and 200 characters')
        .escape(),

    // TODO description validation
    todoDescription: body('description')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Description must not exceed 1000 characters')
        .escape(),

    // Priority validation
    priority: body('priority')
        .isInt({ min: 1, max: 5 })
        .withMessage('Priority must be between 1 and 5'),

    // Status validation
    status: body('status')
        .isIn(['pending', 'in_progress', 'completed', 'cancelled', 'on_hold'])
        .withMessage('Invalid status value'),

    // Category validation
    category: body('category')
        .isIn(['feature', 'bug', 'improvement', 'documentation', 'testing', 'refactoring', 'deployment'])
        .withMessage('Invalid category value')
};

// XSS protection middleware
const xssProtection = (req, res, next) => {
    // Sanitize request body
    if (req.body) {
        req.body = sanitizeObject(req.body);
    }

    // Sanitize query parameters
    if (req.query) {
        req.query = sanitizeObject(req.query);
    }

    next();
};

// Recursive object sanitization
const sanitizeObject = (obj) => {
    if (typeof obj === 'string') {
        return xss(obj);
    }

    if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
    }

    if (obj && typeof obj === 'object') {
        const sanitized = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                sanitized[key] = sanitizeObject(obj[key]);
            }
        }
        return sanitized;
    }

    return obj;
};

// SQL injection protection
const sqlInjectionProtection = mongoSanitize({
    replaceWith: '_',
    onSanitize: ({ req, key }) => {
        console.warn(`SQL injection attempt detected: ${key} in ${req.originalUrl}`);
    }
});

// CSRF protection
const csrfProtection = (req, res, next) => {
    // Skip CSRF for GET requests
    if (req.method === 'GET') {
        return next();
    }

    // Check CSRF token
    const csrfToken = req.headers['x-csrf-token'];
    const sessionToken = req.session?.csrfToken;

    if (!csrfToken || !sessionToken || csrfToken !== sessionToken) {
        return res.status(403).json({
            error: 'Invalid CSRF token'
        });
    }

    next();
};

// Session security
const sessionSecurity = (req, res, next) => {
    // Regenerate session ID on login
    if (req.path === '/api/auth/login' && req.method === 'POST') {
        req.session.regenerate((err) => {
            if (err) {
                return res.status(500).json({ error: 'Session error' });
            }
            next();
        });
    } else {
        next();
    }
};

// Account lockout protection
const accountLockout = async (req, res, next) => {
    const { email } = req.body;
    const clientIP = req.ip;

    if (!email) {
        return next();
    }

    try {
        // Check if account is locked
        const lockoutKey = `lockout:${email}:${clientIP}`;
        const lockoutData = await getLockoutData(lockoutKey);

        if (lockoutData && lockoutData.attempts >= SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS) {
            const timeRemaining = SECURITY_CONFIG.LOCKOUT_TIME - (Date.now() - lockoutData.lastAttempt);

            if (timeRemaining > 0) {
                return res.status(429).json({
                    error: 'Account temporarily locked due to too many failed attempts',
                    retryAfter: Math.ceil(timeRemaining / 1000)
                });
            } else {
                // Reset lockout after timeout
                await clearLockoutData(lockoutKey);
            }
        }

        next();
    } catch (error) {
        console.error('Account lockout error:', error);
        next();
    }
};

// Track failed login attempts
const trackFailedAttempts = async (req, res, next) => {
    const { email } = req.body;
    const clientIP = req.ip;

    if (!email) {
        return next();
    }

    try {
        const lockoutKey = `lockout:${email}:${clientIP}`;
        const lockoutData = await getLockoutData(lockoutKey) || { attempts: 0, lastAttempt: 0 };

        // Increment attempts
        lockoutData.attempts += 1;
        lockoutData.lastAttempt = Date.now();

        await setLockoutData(lockoutKey, lockoutData);

        next();
    } catch (error) {
        console.error('Failed attempt tracking error:', error);
        next();
    }
};

// Clear failed attempts on successful login
const clearFailedAttempts = async (req, res, next) => {
    const { email } = req.body;
    const clientIP = req.ip;

    if (!email) {
        return next();
    }

    try {
        const lockoutKey = `lockout:${email}:${clientIP}`;
        await clearLockoutData(lockoutKey);
        next();
    } catch (error) {
        console.error('Clear failed attempts error:', error);
        next();
    }
};

// JWT token validation
const validateToken = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, SECURITY_CONFIG.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired' });
        }
        return res.status(401).json({ error: 'Invalid token' });
    }
};

// Role-based access control
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        next();
    };
};

// Resource ownership validation
const requireOwnership = (resourceModel, resourceIdParam = 'id') => {
    return async (req, res, next) => {
        try {
            const resourceId = req.params[resourceIdParam];
            const resource = await resourceModel.findById(resourceId);

            if (!resource) {
                return res.status(404).json({ error: 'Resource not found' });
            }

            // Check if user owns the resource or is admin
            if (resource.creator.toString() !== req.user.id && req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Access denied. You can only access your own resources.' });
            }

            req.resource = resource;
            next();
        } catch (error) {
            res.status(500).json({ error: 'Server error' });
        }
    };
};

// Security headers
const securityHeaders = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"]
        }
    },
    crossOriginEmbedderPolicy: false,
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
});

// Request logging for security monitoring
const securityLogging = (req, res, next) => {
    const startTime = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - startTime;
        const logData = {
            timestamp: new Date().toISOString(),
            method: req.method,
            url: req.originalUrl,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            statusCode: res.statusCode,
            duration: duration,
            userId: req.user?.id || 'anonymous'
        };

        // Log suspicious activities
        if (res.statusCode >= 400) {
            console.warn('Security event:', logData);
        }

        // Log slow requests
        if (duration > 5000) {
            console.warn('Slow request detected:', logData);
        }
    });

    next();
};

// Helper functions for lockout data (using Redis or memory)
const getLockoutData = async (key) => {
    // Implementation depends on your caching solution
    // This is a placeholder
    return null;
};

const setLockoutData = async (key, data) => {
    // Implementation depends on your caching solution
    // This is a placeholder
};

const clearLockoutData = async (key) => {
    // Implementation depends on your caching solution
    // This is a placeholder
};

// Password strength validation
const validatePasswordStrength = (password) => {
    const minLength = SECURITY_CONFIG.PASSWORD_MIN_LENGTH;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[@$!%*?&]/.test(password);

    const errors = [];

    if (password.length < minLength) {
        errors.push(`Password must be at least ${minLength} characters long`);
    }
    if (!hasUpperCase) {
        errors.push('Password must contain at least one uppercase letter');
    }
    if (!hasLowerCase) {
        errors.push('Password must contain at least one lowercase letter');
    }
    if (!hasNumbers) {
        errors.push('Password must contain at least one number');
    }
    if (!hasSpecialChar) {
        errors.push('Password must contain at least one special character');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

export {
    SECURITY_CONFIG,
    securityRateLimits,
    inputValidation,
    xssProtection,
    sqlInjectionProtection,
    csrfProtection,
    sessionSecurity,
    accountLockout,
    trackFailedAttempts,
    clearFailedAttempts,
    validateToken,
    requireRole,
    requireOwnership,
    securityHeaders,
    securityLogging,
    validatePasswordStrength
};