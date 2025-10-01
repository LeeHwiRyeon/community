import {
    parseApiError,
    createApiError,
    isRetryableError,
    getUserFriendlyMessage,
    logError,
    retryWithBackoff,
    ERROR_CODES,
    ERROR_MESSAGES,
    ApiError
} from '../apiErrorHandler';

// Mock console.error to avoid noise in tests
const originalConsoleError = console.error;
beforeAll(() => {
    console.error = jest.fn();
});

afterAll(() => {
    console.error = originalConsoleError;
});

describe('apiErrorHandler', () => {
    describe('parseApiError', () => {
        it('should parse network error', () => {
            const error = { message: 'Network Error' };
            const result = parseApiError(error);

            expect(result.message).toBe(ERROR_MESSAGES[ERROR_CODES.NETWORK_ERROR]);
            expect(result.code).toBe(ERROR_CODES.NETWORK_ERROR);
            expect(result.timestamp).toBeDefined();
        });

        it('should parse timeout error', () => {
            const error = { code: 'ECONNABORTED' };
            const result = parseApiError(error);

            expect(result.message).toBe(ERROR_MESSAGES[ERROR_CODES.TIMEOUT_ERROR]);
            expect(result.code).toBe(ERROR_CODES.TIMEOUT_ERROR);
        });

        it('should parse HTTP error response', () => {
            const error = {
                response: {
                    status: 404,
                    data: { message: 'Not found' }
                }
            };
            const result = parseApiError(error);

            expect(result.message).toBe(ERROR_MESSAGES[ERROR_CODES.NOT_FOUND]);
            expect(result.code).toBe(ERROR_CODES.NOT_FOUND);
            expect(result.status).toBe(404);
        });

        it('should parse server error with custom message', () => {
            const error = {
                response: {
                    status: 500,
                    data: {
                        error: {
                            message: 'Custom server error',
                            code: 'CUSTOM_ERROR'
                        }
                    }
                }
            };
            const result = parseApiError(error);

            expect(result.message).toBe('Custom server error');
            expect(result.code).toBe('CUSTOM_ERROR');
            expect(result.status).toBe(500);
        });

        it('should handle 400 Bad Request', () => {
            const error = { response: { status: 400, data: {} } };
            const result = parseApiError(error);

            expect(result.code).toBe(ERROR_CODES.BAD_REQUEST);
            expect(result.status).toBe(400);
        });

        it('should handle 401 Unauthorized', () => {
            const error = { response: { status: 401, data: {} } };
            const result = parseApiError(error);

            expect(result.code).toBe(ERROR_CODES.UNAUTHORIZED);
            expect(result.status).toBe(401);
        });

        it('should handle 403 Forbidden', () => {
            const error = { response: { status: 403, data: {} } };
            const result = parseApiError(error);

            expect(result.code).toBe(ERROR_CODES.FORBIDDEN);
            expect(result.status).toBe(403);
        });

        it('should handle 409 Conflict', () => {
            const error = { response: { status: 409, data: {} } };
            const result = parseApiError(error);

            expect(result.code).toBe(ERROR_CODES.CONFLICT);
            expect(result.status).toBe(409);
        });

        it('should handle 422 Validation Error', () => {
            const error = { response: { status: 422, data: {} } };
            const result = parseApiError(error);

            expect(result.code).toBe(ERROR_CODES.VALIDATION_ERROR);
            expect(result.status).toBe(422);
        });

        it('should handle 429 Rate Limit Exceeded', () => {
            const error = { response: { status: 429, data: {} } };
            const result = parseApiError(error);

            expect(result.code).toBe(ERROR_CODES.RATE_LIMIT_EXCEEDED);
            expect(result.status).toBe(429);
        });

        it('should handle 5xx Server Error', () => {
            const error = { response: { status: 502, data: {} } };
            const result = parseApiError(error);

            expect(result.code).toBe(ERROR_CODES.SERVER_ERROR);
            expect(result.status).toBe(502);
        });
    });

    describe('createApiError', () => {
        it('should create ApiErrorException from error', () => {
            const error = { response: { status: 404, data: {} } };
            const exception = createApiError(error);

            expect(exception.message).toBe(ERROR_MESSAGES[ERROR_CODES.NOT_FOUND]);
            expect(exception.status).toBe(404);
            expect(exception.code).toBe(ERROR_CODES.NOT_FOUND);
        });
    });

    describe('isRetryableError', () => {
        it('should return true for retryable errors', () => {
            const retryableErrors = [
                { code: ERROR_CODES.NETWORK_ERROR },
                { code: ERROR_CODES.TIMEOUT_ERROR },
                { code: ERROR_CODES.CONNECTION_ERROR },
                { code: ERROR_CODES.SERVER_ERROR }
            ];

            retryableErrors.forEach(error => {
                expect(isRetryableError(error as ApiError)).toBe(true);
            });
        });

        it('should return false for non-retryable errors', () => {
            const nonRetryableErrors = [
                { code: ERROR_CODES.BAD_REQUEST },
                { code: ERROR_CODES.UNAUTHORIZED },
                { code: ERROR_CODES.FORBIDDEN },
                { code: ERROR_CODES.NOT_FOUND },
                { code: ERROR_CODES.CONFLICT },
                { code: ERROR_CODES.VALIDATION_ERROR }
            ];

            nonRetryableErrors.forEach(error => {
                expect(isRetryableError(error as ApiError)).toBe(false);
            });
        });
    });

    describe('getUserFriendlyMessage', () => {
        it('should return error message if available', () => {
            const error = { message: 'Custom error message' } as ApiError;
            const result = getUserFriendlyMessage(error);

            expect(result).toBe('Custom error message');
        });

        it('should return default message if no message', () => {
            const error = {} as ApiError;
            const result = getUserFriendlyMessage(error);

            expect(result).toBe(ERROR_MESSAGES[ERROR_CODES.UNKNOWN_ERROR]);
        });
    });

    describe('logError', () => {
        it('should log error details', () => {
            const error = {
                message: 'Test error',
                code: 'TEST_ERROR',
                status: 500,
                details: { test: 'data' },
                timestamp: '2023-01-01T00:00:00.000Z'
            } as ApiError;

            logError(error, 'TestContext');

            expect(console.error).toHaveBeenCalledWith(
                '[TestContext] Error:',
                expect.objectContaining({
                    message: 'Test error',
                    code: 'TEST_ERROR',
                    status: 500,
                    details: { test: 'data' },
                    timestamp: '2023-01-01T00:00:00.000Z'
                })
            );
        });
    });

    describe('retryWithBackoff', () => {
        it('should retry operation on failure', async () => {
            let attemptCount = 0;
            const operation = jest.fn().mockImplementation(() => {
                attemptCount++;
                if (attemptCount < 3) {
                    throw { message: 'Network Error' };
                }
                return 'success';
            });

            const result = await retryWithBackoff(operation, 3, 10);

            expect(result).toBe('success');
            expect(operation).toHaveBeenCalledTimes(3);
        });

        it('should fail after max retries', async () => {
            const operation = jest.fn().mockRejectedValue({ message: 'Network Error' });

            await expect(retryWithBackoff(operation, 2, 10)).rejects.toThrow('Network Error');
            expect(operation).toHaveBeenCalledTimes(3); // Initial + 2 retries
        });

        it('should not retry non-retryable errors', async () => {
            const operation = jest.fn().mockRejectedValue({ response: { status: 400, data: {} } });

            await expect(retryWithBackoff(operation, 3, 10)).rejects.toThrow();
            expect(operation).toHaveBeenCalledTimes(1);
        });

        it('should succeed on first attempt', async () => {
            const operation = jest.fn().mockResolvedValue('success');

            const result = await retryWithBackoff(operation, 3, 10);

            expect(result).toBe('success');
            expect(operation).toHaveBeenCalledTimes(1);
        });
    });

    describe('ERROR_CODES', () => {
        it('should have all required error codes', () => {
            expect(ERROR_CODES.NETWORK_ERROR).toBe('NETWORK_ERROR');
            expect(ERROR_CODES.TIMEOUT_ERROR).toBe('TIMEOUT_ERROR');
            expect(ERROR_CODES.CONNECTION_ERROR).toBe('CONNECTION_ERROR');
            expect(ERROR_CODES.BAD_REQUEST).toBe('BAD_REQUEST');
            expect(ERROR_CODES.UNAUTHORIZED).toBe('UNAUTHORIZED');
            expect(ERROR_CODES.FORBIDDEN).toBe('FORBIDDEN');
            expect(ERROR_CODES.NOT_FOUND).toBe('NOT_FOUND');
            expect(ERROR_CODES.CONFLICT).toBe('CONFLICT');
            expect(ERROR_CODES.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
            expect(ERROR_CODES.RATE_LIMIT_EXCEEDED).toBe('RATE_LIMIT_EXCEEDED');
            expect(ERROR_CODES.SERVER_ERROR).toBe('SERVER_ERROR');
            expect(ERROR_CODES.UNKNOWN_ERROR).toBe('UNKNOWN_ERROR');
        });
    });

    describe('ERROR_MESSAGES', () => {
        it('should have messages for all error codes', () => {
            Object.values(ERROR_CODES).forEach(code => {
                expect(ERROR_MESSAGES[code]).toBeDefined();
                expect(typeof ERROR_MESSAGES[code]).toBe('string');
                expect(ERROR_MESSAGES[code].length).toBeGreaterThan(0);
            });
        });
    });
});
