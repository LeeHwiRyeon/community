/**
 * API Error Handler
 * Provides consistent error handling for API requests
 */

export interface ApiError {
    message: string;
    status?: number;
    code?: string;
    details?: Record<string, unknown>;
    timestamp: string;
}

export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: ApiError;
    message?: string;
}

/**
 * Custom error class for API errors
 */
export class ApiErrorException extends Error {
    public status: number;
    public code: string;
    public details: Record<string, unknown> | null;

    constructor(message: string, status: number = 500, code: string = 'UNKNOWN_ERROR', details: Record<string, unknown> | null = null) {
        super(message);
        this.name = 'ApiErrorException';
        this.status = status;
        this.code = code;
        this.details = details;
    }
}

/**
 * Error codes mapping
 */
export const ERROR_CODES = {
    // Network errors
    NETWORK_ERROR: 'NETWORK_ERROR',
    TIMEOUT_ERROR: 'TIMEOUT_ERROR',
    CONNECTION_ERROR: 'CONNECTION_ERROR',

    // HTTP status errors
    BAD_REQUEST: 'BAD_REQUEST',
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    NOT_FOUND: 'NOT_FOUND',
    CONFLICT: 'CONFLICT',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    SERVER_ERROR: 'SERVER_ERROR',

    // Authentication errors
    TOKEN_EXPIRED: 'TOKEN_EXPIRED',
    INVALID_TOKEN: 'INVALID_TOKEN',
    LOGIN_REQUIRED: 'LOGIN_REQUIRED',

    // Business logic errors
    POST_NOT_FOUND: 'POST_NOT_FOUND',
    COMMENT_NOT_FOUND: 'COMMENT_NOT_FOUND',
    USER_NOT_FOUND: 'USER_NOT_FOUND',
    PERMISSION_DENIED: 'PERMISSION_DENIED',
    DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',

    // Translation errors
    TRANSLATION_FAILED: 'TRANSLATION_FAILED',
    LANGUAGE_DETECTION_FAILED: 'LANGUAGE_DETECTION_FAILED',

    // File upload errors
    FILE_TOO_LARGE: 'FILE_TOO_LARGE',
    INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
    UPLOAD_FAILED: 'UPLOAD_FAILED',

    // Unknown error
    UNKNOWN_ERROR: 'UNKNOWN_ERROR'
} as const;

/**
 * User-friendly error messages
 */
export const ERROR_MESSAGES: Record<string, string> = {
    [ERROR_CODES.NETWORK_ERROR]: '네트워크 연결을 확인해주세요.',
    [ERROR_CODES.TIMEOUT_ERROR]: '요청 시간이 초과되었습니다. 다시 시도해주세요.',
    [ERROR_CODES.CONNECTION_ERROR]: '서버에 연결할 수 없습니다.',

    [ERROR_CODES.BAD_REQUEST]: '잘못된 요청입니다.',
    [ERROR_CODES.UNAUTHORIZED]: '로그인이 필요합니다.',
    [ERROR_CODES.FORBIDDEN]: '접근 권한이 없습니다.',
    [ERROR_CODES.NOT_FOUND]: '요청한 리소스를 찾을 수 없습니다.',
    [ERROR_CODES.CONFLICT]: '이미 존재하는 데이터입니다.',
    [ERROR_CODES.VALIDATION_ERROR]: '입력 데이터를 확인해주세요.',
    [ERROR_CODES.RATE_LIMIT_EXCEEDED]: '요청 횟수를 초과했습니다. 잠시 후 다시 시도해주세요.',
    [ERROR_CODES.SERVER_ERROR]: '서버 오류가 발생했습니다.',

    [ERROR_CODES.TOKEN_EXPIRED]: '로그인이 만료되었습니다. 다시 로그인해주세요.',
    [ERROR_CODES.INVALID_TOKEN]: '유효하지 않은 토큰입니다.',
    [ERROR_CODES.LOGIN_REQUIRED]: '로그인이 필요합니다.',

    [ERROR_CODES.POST_NOT_FOUND]: '게시글을 찾을 수 없습니다.',
    [ERROR_CODES.COMMENT_NOT_FOUND]: '댓글을 찾을 수 없습니다.',
    [ERROR_CODES.USER_NOT_FOUND]: '사용자를 찾을 수 없습니다.',
    [ERROR_CODES.PERMISSION_DENIED]: '권한이 없습니다.',
    [ERROR_CODES.DUPLICATE_ENTRY]: '이미 존재하는 데이터입니다.',

    [ERROR_CODES.TRANSLATION_FAILED]: '번역에 실패했습니다.',
    [ERROR_CODES.LANGUAGE_DETECTION_FAILED]: '언어 감지에 실패했습니다.',

    [ERROR_CODES.FILE_TOO_LARGE]: '파일 크기가 너무 큽니다.',
    [ERROR_CODES.INVALID_FILE_TYPE]: '지원하지 않는 파일 형식입니다.',
    [ERROR_CODES.UPLOAD_FAILED]: '파일 업로드에 실패했습니다.',

    [ERROR_CODES.UNKNOWN_ERROR]: '알 수 없는 오류가 발생했습니다.'
};

/**
 * Parse API error from response
 */
interface ErrorWithResponse {
    response?: {
        status: number;
        data?: {
            error?: Record<string, unknown>;
            message?: string;
            code?: string;
            details?: Record<string, unknown>;
        };
    };
    code?: string;
    message?: string;
}

export const parseApiError = (error: unknown): ApiError => {
    const timestamp = new Date().toISOString();
    const errorWithResponse = error as ErrorWithResponse;

    // Network error
    if (!errorWithResponse.response) {
        if (errorWithResponse.code === 'ECONNABORTED') {
            return {
                message: ERROR_MESSAGES[ERROR_CODES.TIMEOUT_ERROR],
                code: ERROR_CODES.TIMEOUT_ERROR,
                timestamp
            };
        }

        if (errorWithResponse.message === 'Network Error') {
            return {
                message: ERROR_MESSAGES[ERROR_CODES.NETWORK_ERROR],
                code: ERROR_CODES.NETWORK_ERROR,
                timestamp
            };
        }

        return {
            message: ERROR_MESSAGES[ERROR_CODES.CONNECTION_ERROR],
            code: ERROR_CODES.CONNECTION_ERROR,
            timestamp
        };
    }

    // HTTP error response
    const { status, data } = errorWithResponse.response;
    const errorData = data?.error || data;

    let code = ERROR_CODES.UNKNOWN_ERROR;
    let message = ERROR_MESSAGES[ERROR_CODES.UNKNOWN_ERROR];

    // Map HTTP status codes to error codes
    switch (status) {
        case 400:
            code = ERROR_CODES.BAD_REQUEST;
            message = ERROR_MESSAGES[ERROR_CODES.BAD_REQUEST];
            break;
        case 401:
            code = ERROR_CODES.UNAUTHORIZED;
            message = ERROR_MESSAGES[ERROR_CODES.UNAUTHORIZED];
            break;
        case 403:
            code = ERROR_CODES.FORBIDDEN;
            message = ERROR_MESSAGES[ERROR_CODES.FORBIDDEN];
            break;
        case 404:
            code = ERROR_CODES.NOT_FOUND;
            message = ERROR_MESSAGES[ERROR_CODES.NOT_FOUND];
            break;
        case 409:
            code = ERROR_CODES.CONFLICT;
            message = ERROR_MESSAGES[ERROR_CODES.CONFLICT];
            break;
        case 422:
            code = ERROR_CODES.VALIDATION_ERROR;
            message = ERROR_MESSAGES[ERROR_CODES.VALIDATION_ERROR];
            break;
        case 429:
            code = ERROR_CODES.RATE_LIMIT_EXCEEDED;
            message = ERROR_MESSAGES[ERROR_CODES.RATE_LIMIT_EXCEEDED];
            break;
        case 500:
        case 502:
        case 503:
        case 504:
            code = ERROR_CODES.SERVER_ERROR;
            message = ERROR_MESSAGES[ERROR_CODES.SERVER_ERROR];
            break;
    }

    // Override with server-provided error information
    if (errorData) {
        if (errorData.code) {
            code = errorData.code;
        }
        if (errorData.message) {
            message = errorData.message;
        }
    }

    return {
        message,
        status,
        code,
        details: errorData?.details || null,
        timestamp
    };
};

/**
 * Create API error exception
 */
export const createApiError = (error: unknown): ApiErrorException => {
    const apiError = parseApiError(error);
    return new ApiErrorException(
        apiError.message,
        apiError.status,
        apiError.code,
        apiError.details
    );
};

/**
 * Check if error is retryable
 */
export const isRetryableError = (error: ApiError): boolean => {
    const retryableCodes = [
        ERROR_CODES.NETWORK_ERROR,
        ERROR_CODES.TIMEOUT_ERROR,
        ERROR_CODES.CONNECTION_ERROR,
        ERROR_CODES.SERVER_ERROR
    ];

    return retryableCodes.includes(error.code as keyof typeof ERROR_CODES);
};

/**
 * Get user-friendly error message
 */
export const getUserFriendlyMessage = (error: ApiError): string => {
    return error.message || ERROR_MESSAGES[ERROR_CODES.UNKNOWN_ERROR];
};

/**
 * Log error for debugging
 */
export const logError = (error: ApiError, context?: string) => {
    console.error(`[${context || 'API'}] Error:`, {
        message: error.message,
        code: error.code,
        status: error.status,
        details: error.details,
        timestamp: error.timestamp
    });

    // In production, send to error tracking service
    if (process.env.NODE_ENV === 'production') {
        // errorTrackingService.captureException(error, { extra: { context } });
    }
};

/**
 * Retry function with exponential backoff
 */
export const retryWithBackoff = async <T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
): Promise<T> => {
    let lastError: unknown;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;

            if (attempt === maxRetries) {
                throw error;
            }

            const apiError = parseApiError(error);
            if (!isRetryableError(apiError)) {
                throw error;
            }

            const delay = baseDelay * Math.pow(2, attempt);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    throw lastError;
};

export default {
    parseApiError,
    createApiError,
    isRetryableError,
    getUserFriendlyMessage,
    logError,
    retryWithBackoff,
    ERROR_CODES,
    ERROR_MESSAGES
};
