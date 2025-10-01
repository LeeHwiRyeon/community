const { logger } = require('../utils/logger');

// 에러 핸들러 미들웨어
const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // 로그에 에러 기록
    logger.error(`Error: ${err.message}`, {
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent')
    });

    // Sequelize 에러 처리
    if (err.name === 'SequelizeValidationError') {
        const message = err.errors.map(error => error.message).join(', ');
        error = {
            message: `Validation Error: ${message}`,
            statusCode: 400
        };
    }

    // Sequelize 고유 제약 조건 에러
    if (err.name === 'SequelizeUniqueConstraintError') {
        const message = 'Duplicate field value entered';
        error = {
            message,
            statusCode: 400
        };
    }

    // Sequelize 외래 키 에러
    if (err.name === 'SequelizeForeignKeyConstraintError') {
        const message = 'Resource not found';
        error = {
            message,
            statusCode: 404
        };
    }

    // JWT 에러 처리
    if (err.name === 'JsonWebTokenError') {
        const message = 'Invalid token';
        error = {
            message,
            statusCode: 401
        };
    }

    if (err.name === 'TokenExpiredError') {
        const message = 'Token expired';
        error = {
            message,
            statusCode: 401
        };
    }

    // Multer 에러 처리 (파일 업로드)
    if (err.code === 'LIMIT_FILE_SIZE') {
        const message = 'File too large';
        error = {
            message,
            statusCode: 400
        };
    }

    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        const message = 'Too many files uploaded';
        error = {
            message,
            statusCode: 400
        };
    }

    // Rate limit 에러
    if (err.status === 429) {
        const message = 'Too many requests, please try again later';
        error = {
            message,
            statusCode: 429
        };
    }

    // 기본 에러 응답
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';

    // 에러 응답 객체
    const errorResponse = {
        success: false,
        error: {
            message,
            status: statusCode,
            timestamp: new Date().toISOString(),
            path: req.originalUrl,
            method: req.method
        }
    };

    // 개발 환경에서는 스택 트레이스 포함
    if (process.env.NODE_ENV === 'development') {
        errorResponse.error.stack = err.stack;
        errorResponse.error.details = err;
    }

    // 프로덕션 환경에서는 민감한 정보 제거
    if (process.env.NODE_ENV === 'production') {
        if (statusCode === 500) {
            errorResponse.error.message = 'Internal Server Error';
        }
    }

    res.status(statusCode).json(errorResponse);
};

// 404 에러 핸들러
const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    error.statusCode = 404;
    next(error);
};

// 비동기 에러 래퍼
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// 에러 클래스들
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

class ValidationError extends AppError {
    constructor(message, field) {
        super(message, 400);
        this.field = field;
    }
}

class AuthenticationError extends AppError {
    constructor(message = 'Authentication failed') {
        super(message, 401);
    }
}

class AuthorizationError extends AppError {
    constructor(message = 'Access denied') {
        super(message, 403);
    }
}

class NotFoundError extends AppError {
    constructor(message = 'Resource not found') {
        super(message, 404);
    }
}

class ConflictError extends AppError {
    constructor(message = 'Resource conflict') {
        super(message, 409);
    }
}

class RateLimitError extends AppError {
    constructor(message = 'Too many requests') {
        super(message, 429);
    }
}

module.exports = {
    errorHandler,
    notFound,
    asyncHandler,
    AppError,
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    NotFoundError,
    ConflictError,
    RateLimitError
};
