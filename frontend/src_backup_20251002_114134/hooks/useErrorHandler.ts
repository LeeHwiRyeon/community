import { useState, useCallback, useRef } from 'react';
import { useToast } from '@chakra-ui/react';
import {
    parseApiError,
    createApiError,
    isRetryableError,
    getUserFriendlyMessage,
    logError,
    retryWithBackoff,
    ApiError,
    ApiErrorException
} from '../utils/apiErrorHandler';

interface UseErrorHandlerOptions {
    showToast?: boolean;
    logErrors?: boolean;
    context?: string;
    maxRetries?: number;
    retryDelay?: number;
}

interface ErrorState {
    error: ApiError | null;
    isRetrying: boolean;
    retryCount: number;
}

/**
 * Custom hook for handling errors in React components
 * Provides consistent error handling, retry logic, and user feedback
 */
export const useErrorHandler = (options: UseErrorHandlerOptions = {}) => {
    const {
        showToast = true,
        logErrors = true,
        context = 'Component',
        maxRetries = 3,
        retryDelay = 1000
    } = options;

    const toast = useToast();
    const [errorState, setErrorState] = useState<ErrorState>({
        error: null,
        isRetrying: false,
        retryCount: 0
    });

    const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    /**
     * Handle error with consistent processing
     */
    const handleError = useCallback((error: unknown, customContext?: string) => {
        const apiError = parseApiError(error);
        const errorContext = customContext || context;

        // Log error if enabled
        if (logErrors) {
            logError(apiError, errorContext);
        }

        // Update error state
        setErrorState(prev => ({
            ...prev,
            error: apiError,
            isRetrying: false,
            retryCount: 0
        }));

        // Show toast notification if enabled
        if (showToast) {
            toast({
                title: 'Error',
                description: getUserFriendlyMessage(apiError),
                status: 'error',
                duration: 5000,
                isClosable: true,
                position: 'top-right'
            });
        }

        return apiError;
    }, [showToast, logErrors, context, toast]);

    /**
     * Clear current error
     */
    const clearError = useCallback(() => {
        setErrorState({
            error: null,
            isRetrying: false,
            retryCount: 0
        });

        // Clear any pending retry timeout
        if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
            retryTimeoutRef.current = null;
        }
    }, []);

    /**
     * Retry failed operation
     */
    const retry = useCallback(async (operation: () => Promise<any>) => {
        if (!errorState.error || !isRetryableError(errorState.error)) {
            return;
        }

        setErrorState(prev => ({
            ...prev,
            isRetrying: true,
            retryCount: prev.retryCount + 1
        }));

        try {
            const result = await retryWithBackoff(
                operation,
                maxRetries - errorState.retryCount,
                retryDelay
            );

            // Success - clear error state
            clearError();
            return result;
        } catch (error) {
            // Retry failed - handle the new error
            handleError(error, `${context} (Retry ${errorState.retryCount + 1})`);
        }
    }, [errorState.error, errorState.retryCount, maxRetries, retryDelay, context, handleError, clearError]);

    /**
     * Execute operation with error handling and retry logic
     */
    const executeWithErrorHandling = useCallback(async <T>(
        operation: () => Promise<T>,
        operationContext?: string
    ): Promise<T | null> => {
        try {
            clearError();
            return await operation();
        } catch (error) {
            handleError(error, operationContext);
            return null;
        }
    }, [handleError, clearError]);

    /**
     * Execute operation with automatic retry
     */
    const executeWithRetry = useCallback(async <T>(
        operation: () => Promise<T>,
        operationContext?: string
    ): Promise<T | null> => {
        try {
            clearError();
            return await retryWithBackoff(operation, maxRetries, retryDelay);
        } catch (error) {
            handleError(error, operationContext);
            return null;
        }
    }, [maxRetries, retryDelay, handleError, clearError]);

    /**
     * Check if error is retryable
     */
    const canRetry = useCallback(() => {
        return errorState.error && isRetryableError(errorState.error) && errorState.retryCount < maxRetries;
    }, [errorState.error, errorState.retryCount, maxRetries]);

    /**
     * Get error message for display
     */
    const getErrorMessage = useCallback(() => {
        if (!errorState.error) return null;
        return getUserFriendlyMessage(errorState.error);
    }, [errorState.error]);

    /**
     * Get error details for debugging
     */
    const getErrorDetails = useCallback(() => {
        if (!errorState.error) return null;
        return {
            message: errorState.error.message,
            code: errorState.error.code,
            status: errorState.error.status,
            details: errorState.error.details,
            timestamp: errorState.error.timestamp
        };
    }, [errorState.error]);

    return {
        // Error state
        error: errorState.error,
        hasError: !!errorState.error,
        isRetrying: errorState.isRetrying,
        retryCount: errorState.retryCount,

        // Error handling functions
        handleError,
        clearError,
        retry,
        executeWithErrorHandling,
        executeWithRetry,

        // Utility functions
        canRetry,
        getErrorMessage,
        getErrorDetails
    };
};

/**
 * Hook for handling async operations with error handling
 */
export const useAsyncOperation = <T = any>(
    operation: () => Promise<T>,
    options: UseErrorHandlerOptions = {}
) => {
    const errorHandler = useErrorHandler(options);
    const [isLoading, setIsLoading] = useState(false);
    const [data, setData] = useState<T | null>(null);

    const execute = useCallback(async () => {
        setIsLoading(true);
        try {
            const result = await operation();
            setData(result);
            errorHandler.clearError();
            return result;
        } catch (error) {
            errorHandler.handleError(error);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [operation, errorHandler]);

    const executeWithRetry = useCallback(async () => {
        setIsLoading(true);
        try {
            const result = await errorHandler.executeWithRetry(operation);
            if (result) {
                setData(result);
            }
            return result;
        } finally {
            setIsLoading(false);
        }
    }, [operation, errorHandler]);

    return {
        ...errorHandler,
        isLoading,
        data,
        execute,
        executeWithRetry
    };
};

/**
 * Hook for handling form submission errors
 */
export const useFormErrorHandler = (options: UseErrorHandlerOptions = {}) => {
    const errorHandler = useErrorHandler(options);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const handleFormError = useCallback((error: unknown) => {
        const apiError = errorHandler.handleError(error);

        // Extract field-specific errors
        if (apiError.details && typeof apiError.details === 'object') {
            const fieldErrors: Record<string, string> = {};

            // Handle validation errors
            if (apiError.details.errors) {
                Object.entries(apiError.details.errors).forEach(([field, message]) => {
                    fieldErrors[field] = Array.isArray(message) ? message[0] : message;
                });
            }

            // Handle field-specific errors
            if (apiError.details.field) {
                fieldErrors[apiError.details.field] = apiError.message;
            }

            setFieldErrors(fieldErrors);
        }

        return apiError;
    }, [errorHandler]);

    const clearFieldErrors = useCallback(() => {
        setFieldErrors({});
    }, []);

    const getFieldError = useCallback((fieldName: string) => {
        return fieldErrors[fieldName] || null;
    }, [fieldErrors]);

    const hasFieldErrors = useCallback(() => {
        return Object.keys(fieldErrors).length > 0;
    }, [fieldErrors]);

    return {
        ...errorHandler,
        fieldErrors,
        handleFormError,
        clearFieldErrors,
        getFieldError,
        hasFieldErrors
    };
};

export default useErrorHandler;
