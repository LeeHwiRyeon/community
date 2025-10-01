import logger from '../logger.js';

/**
 * Global error handler middleware
 * Handles all unhandled errors in the application
 */
export const globalErrorHandler = (err, req, res, next) => {
    // Log error details
    logger.error('Global error handler caught error:', {
        message: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
    });

    // Don't leak error details in production
    const isDevelopment = process.env.NODE_ENV === 'development';

    // Default error response
    let statusCode = err.statusCode || err.status || 500;
    let message = err.message || 'Internal Server Error';
    let code = err.code || 'INTERNAL_ERROR';

    // Handle specific error types
    if (err.name === 'ValidationError') {
        statusCode = 400;
        code = 'VALIDATION_ERROR';
        message = 'Validation failed';
    } else if (err.name === 'CastError') {
        statusCode = 400;
        code = 'INVALID_ID';
        message = 'Invalid ID format';
    } else if (err.name === 'MongoError' && err.code === 11000) {
        statusCode = 409;
        code = 'DUPLICATE_ENTRY';
        message = 'Duplicate entry found';
    } else if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        code = 'INVALID_TOKEN';
        message = 'Invalid token';
    } else if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        code = 'TOKEN_EXPIRED';
        message = 'Token has expired';
    } else if (err.name === 'MulterError') {
        statusCode = 400;
        code = 'FILE_UPLOAD_ERROR';
        message = 'File upload error';
    }

    // Prepare error response
    const errorResponse = {
        success: false,
        error: {
            message: isDevelopment ? message : 'An error occurred',
            code,
            status: statusCode,
            timestamp: new Date().toISOString()
        }
    };

    // Add stack trace in development
    if (isDevelopment) {
        errorResponse.error.stack = err.stack;
        errorResponse.error.details = err.details || null;
    }

    // Add validation errors if present
    if (err.errors) {
        errorResponse.error.validation = err.errors;
    }

    res.status(statusCode).json(errorResponse);
};

/**
 * 404 handler for undefined routes
 */
export const notFoundHandler = (req, res) => {
    logger.warn('Route not found:', {
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent')
    });

    res.status(404).json({
        success: false,
        error: {
            message: 'Route not found',
            code: 'NOT_FOUND',
            status: 404,
            timestamp: new Date().toISOString()
        }
    });
};

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors
 */
export const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

/**
 * Custom error classes
 */
export class AppError extends Error {
    constructor(message, statusCode = 500, code = 'APP_ERROR') {
        super(message);
        this.name = 'AppError';
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

export class ValidationError extends AppError {
    constructor(message = 'Validation failed', errors = null) {
        super(message, 400, 'VALIDATION_ERROR');
        this.name = 'ValidationError';
        this.errors = errors;
    }
}

export class AuthenticationError extends AppError {
    constructor(message = 'Authentication required') {
        super(message, 401, 'AUTHENTICATION_ERROR');
        this.name = 'AuthenticationError';
    }
}

export class AuthorizationError extends AppError {
    constructor(message = 'Insufficient permissions') {
        super(message, 403, 'AUTHORIZATION_ERROR');
        this.name = 'AuthorizationError';
    }
}

export class NotFoundError extends AppError {
    constructor(message = 'Resource not found') {
        super(message, 404, 'NOT_FOUND');
        this.name = 'NotFoundError';
    }
}

export class ConflictError extends AppError {
    constructor(message = 'Resource conflict') {
        super(message, 409, 'CONFLICT');
        this.name = 'ConflictError';
    }
}

export class RateLimitError extends AppError {
    constructor(message = 'Rate limit exceeded') {
        super(message, 429, 'RATE_LIMIT_EXCEEDED');
        this.name = 'RateLimitError';
    }
}

export class TranslationError extends AppError {
    constructor(message = 'Translation failed') {
        super(message, 500, 'TRANSLATION_ERROR');
        this.name = 'TranslationError';
    }
}

/**
 * Error response formatter
 */
export const formatErrorResponse = (error, req) => {
    const isDevelopment = process.env.NODE_ENV === 'development';

    return {
        success: false,
        error: {
            message: error.message || 'An error occurred',
            code: error.code || 'UNKNOWN_ERROR',
            status: error.statusCode || error.status || 500,
            timestamp: new Date().toISOString(),
            ...(isDevelopment && {
                stack: error.stack,
                details: error.details,
                url: req.url,
                method: req.method
            })
        }
    };
};

/**
 * Validation error formatter
 */
export const formatValidationError = (errors) => {
    const formattedErrors = {};

    if (Array.isArray(errors)) {
        errors.forEach(error => {
            if (error.path) {
                formattedErrors[error.path] = error.message;
            }
        });
    } else if (typeof errors === 'object') {
        Object.keys(errors).forEach(key => {
            formattedErrors[key] = errors[key].message || errors[key];
        });
    }

    return formattedErrors;
};

/**
 * Database error handler
 */
export const handleDatabaseError = (error) => {
    if (error.code === 'ER_DUP_ENTRY') {
        throw new ConflictError('Duplicate entry found');
    } else if (error.code === 'ER_NO_REFERENCED_ROW_2') {
        throw new ValidationError('Referenced record not found');
    } else if (error.code === 'ER_ROW_IS_REFERENCED_2') {
        throw new ConflictError('Cannot delete referenced record');
    } else if (error.code === 'ER_DATA_TOO_LONG') {
        throw new ValidationError('Data too long for column');
    } else if (error.code === 'ER_BAD_NULL_ERROR') {
        throw new ValidationError('Required field cannot be null');
    } else {
        throw new AppError('Database operation failed', 500, 'DATABASE_ERROR');
    }
};

/**
 * Translation error handler
 */
export const handleTranslationError = (error) => {
    if (error.message.includes('quota')) {
        throw new TranslationError('Translation quota exceeded');
    } else if (error.message.includes('invalid')) {
        throw new ValidationError('Invalid text for translation');
    } else if (error.message.includes('timeout')) {
        throw new TranslationError('Translation service timeout');
    } else {
        throw new TranslationError('Translation service unavailable');
    }
};

export default {
    globalErrorHandler,
    notFoundHandler,
    asyncHandler,
    AppError,
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    NotFoundError,
    ConflictError,
    RateLimitError,
    TranslationError,
    formatErrorResponse,
    formatValidationError,
    handleDatabaseError,
    handleTranslationError
};
