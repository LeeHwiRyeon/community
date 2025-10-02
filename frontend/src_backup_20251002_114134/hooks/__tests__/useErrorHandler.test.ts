import { renderHook, act } from '@testing-library/react';
import { useErrorHandler, useAsyncOperation, useFormErrorHandler } from '../useErrorHandler';
import { ERROR_CODES } from '../../utils/apiErrorHandler';

// Mock useToast
jest.mock('@chakra-ui/react', () => ({
    useToast: () => jest.fn()
}));

// Mock console.error to avoid noise in tests
const originalConsoleError = console.error;
beforeAll(() => {
    console.error = jest.fn();
});

afterAll(() => {
    console.error = originalConsoleError;
});

describe('useErrorHandler', () => {
    it('should initialize with default values', () => {
        const { result } = renderHook(() => useErrorHandler());

        expect(result.current.error).toBe(null);
        expect(result.current.hasError).toBe(false);
        expect(result.current.isRetrying).toBe(false);
        expect(result.current.retryCount).toBe(0);
    });

    it('should handle error', async () => {
        const { result } = renderHook(() => useErrorHandler());

        const testError = {
            response: {
                status: 404,
                data: { message: 'Not found' }
            }
        };

        await act(async () => {
            result.current.handleError(testError);
        });

        expect(result.current.hasError).toBe(true);
        expect(result.current.error).toBeDefined();
        expect(result.current.error?.message).toBe('요청한 리소스를 찾을 수 없습니다.');
        expect(result.current.error?.code).toBe(ERROR_CODES.NOT_FOUND);
    });

    it('should clear error', () => {
        const { result } = renderHook(() => useErrorHandler());

        // First set an error
        act(() => {
            result.current.handleError({ response: { status: 404, data: {} } });
        });

        expect(result.current.hasError).toBe(true);

        // Then clear it
        act(() => {
            result.current.clearError();
        });

        expect(result.current.hasError).toBe(false);
        expect(result.current.error).toBe(null);
    });

    it('should execute operation with error handling', async () => {
        const { result } = renderHook(() => useErrorHandler());

        const successOperation = jest.fn().mockResolvedValue('success');
        const errorOperation = jest.fn().mockRejectedValue({ response: { status: 500, data: {} } });

        // Test successful operation
        let successResult;
        await act(async () => {
            successResult = await result.current.executeWithErrorHandling(successOperation);
        });

        expect(successResult).toBe('success');
        expect(successOperation).toHaveBeenCalled();

        // Test error operation
        let errorResult;
        await act(async () => {
            errorResult = await result.current.executeWithErrorHandling(errorOperation);
        });

        expect(errorResult).toBe(null);
        expect(result.current.hasError).toBe(true);
    });

    it('should check if error is retryable', () => {
        const { result } = renderHook(() => useErrorHandler());

        // Test with retryable error
        act(() => {
            result.current.handleError({ message: 'Network Error' });
        });

        expect(result.current.canRetry()).toBe(true);

        // Test with non-retryable error
        act(() => {
            result.current.handleError({ response: { status: 400, data: {} } });
        });

        expect(result.current.canRetry()).toBe(false);
    });

    it('should get error message', () => {
        const { result } = renderHook(() => useErrorHandler());

        act(() => {
            result.current.handleError({ response: { status: 404, data: {} } });
        });

        expect(result.current.getErrorMessage()).toBe('요청한 리소스를 찾을 수 없습니다.');
    });

    it('should get error details', () => {
        const { result } = renderHook(() => useErrorHandler());

        act(() => {
            result.current.handleError({ response: { status: 404, data: { details: 'test' } } });
        });

        const details = result.current.getErrorDetails();
        expect(details).toBeDefined();
        expect(details?.code).toBe(ERROR_CODES.NOT_FOUND);
        expect(details?.status).toBe(404);
    });
});

describe('useAsyncOperation', () => {
    it('should execute operation successfully', async () => {
        const operation = jest.fn().mockResolvedValue('success');
        const { result } = renderHook(() => useAsyncOperation(operation));

        expect(result.current.isLoading).toBe(false);
        expect(result.current.data).toBe(null);

        await act(async () => {
            await result.current.execute();
        });

        expect(result.current.isLoading).toBe(false);
        expect(result.current.data).toBe('success');
        expect(operation).toHaveBeenCalled();
    });

    it('should handle operation error', async () => {
        const operation = jest.fn().mockRejectedValue({ response: { status: 500, data: {} } });
        const { result } = renderHook(() => useAsyncOperation(operation));

        await act(async () => {
            await result.current.execute();
        });

        expect(result.current.isLoading).toBe(false);
        expect(result.current.data).toBe(null);
        expect(result.current.hasError).toBe(true);
    });

    it('should execute with retry', async () => {
        const operation = jest.fn()
            .mockRejectedValueOnce({ message: 'Network Error' })
            .mockResolvedValueOnce('success');

        const { result } = renderHook(() => useAsyncOperation(operation, { maxRetries: 1 }));

        await act(async () => {
            await result.current.executeWithRetry();
        });

        expect(result.current.data).toBe('success');
        expect(operation).toHaveBeenCalledTimes(2);
    });
});

describe('useFormErrorHandler', () => {
    it('should handle form errors', async () => {
        const { result } = renderHook(() => useFormErrorHandler());

        const formError = {
            response: {
                status: 422,
                data: {
                    errors: {
                        title: 'Title is required',
                        content: 'Content is required'
                    }
                }
            }
        };

        await act(async () => {
            result.current.handleFormError(formError);
        });

        expect(result.current.hasError).toBe(true);
        expect(result.current.getFieldError('title')).toBe('Title is required');
        expect(result.current.getFieldError('content')).toBe('Content is required');
        expect(result.current.hasFieldErrors()).toBe(true);
    });

    it('should clear field errors', () => {
        const { result } = renderHook(() => useFormErrorHandler());

        // Set field errors
        act(() => {
            result.current.handleFormError({
                response: {
                    status: 422,
                    data: { errors: { title: 'Title is required' } }
                }
            });
        });

        expect(result.current.hasFieldErrors()).toBe(true);

        // Clear field errors
        act(() => {
            result.current.clearFieldErrors();
        });

        expect(result.current.hasFieldErrors()).toBe(false);
    });

    it('should handle field-specific errors', async () => {
        const { result } = renderHook(() => useFormErrorHandler());

        const fieldError = {
            response: {
                status: 400,
                data: {
                    field: 'email',
                    message: 'Invalid email format'
                }
            }
        };

        await act(async () => {
            result.current.handleFormError(fieldError);
        });

        expect(result.current.getFieldError('email')).toBe('Invalid email format');
    });
});
