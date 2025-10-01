/**
 * Custom hook for making API calls with loading states and error handling
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { apiService } from '../utils/apiService';

export interface UseApiOptions {
    immediate?: boolean;
    onSuccess?: (data: any) => void;
    onError?: (error: Error) => void;
    onFinally?: () => void;
}

export interface UseApiState<T> {
    data: T | null;
    loading: boolean;
    error: Error | null;
    success: boolean;
}

export function useApi<T = any>(
    endpoint: string,
    options: UseApiOptions = {}
): UseApiState<T> & {
    execute: (data?: any) => Promise<T | null>;
    reset: () => void;
} {
    const { immediate = false, onSuccess, onError, onFinally } = options;
    const [state, setState] = useState<UseApiState<T>>({
        data: null,
        loading: false,
        error: null,
        success: false,
    });

    const isMountedRef = useRef(true);

    useEffect(() => {
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    const execute = useCallback(
        async (data?: any): Promise<T | null> => {
            if (!isMountedRef.current) return null;

            setState(prev => ({ ...prev, loading: true, error: null, success: false }));

            try {
                const response = await apiService.post<T>(endpoint, data);

                if (isMountedRef.current) {
                    setState(prev => ({
                        ...prev,
                        data: response,
                        loading: false,
                        error: null,
                        success: true,
                    }));

                    onSuccess?.(response);
                }

                return response;
            } catch (error) {
                if (isMountedRef.current) {
                    const errorObj = error instanceof Error ? error : new Error(String(error));
                    setState(prev => ({
                        ...prev,
                        data: null,
                        loading: false,
                        error: errorObj,
                        success: false,
                    }));

                    onError?.(errorObj);
                }
                return null;
            } finally {
                if (isMountedRef.current) {
                    onFinally?.();
                }
            }
        },
        [endpoint, onSuccess, onError, onFinally]
    );

    const reset = useCallback(() => {
        if (isMountedRef.current) {
            setState({
                data: null,
                loading: false,
                error: null,
                success: false,
            });
        }
    }, []);

    useEffect(() => {
        if (immediate) {
            execute();
        }
    }, [immediate, execute]);

    return {
        ...state,
        execute,
        reset,
    };
}

export default useApi;
