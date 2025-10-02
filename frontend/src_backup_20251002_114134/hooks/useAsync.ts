/**
 * Custom hook for async operations
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export interface UseAsyncState<T> {
    data: T | null;
    loading: boolean;
    error: Error | null;
    success: boolean;
}

export function useAsync<T = any>(
    asyncFunction: () => Promise<T>,
    immediate: boolean = true
): UseAsyncState<T> & {
    execute: () => Promise<T | null>;
    reset: () => void;
} {
    const [state, setState] = useState<UseAsyncState<T>>({
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

    const execute = useCallback(async (): Promise<T | null> => {
        if (!isMountedRef.current) return null;

        setState(prev => ({ ...prev, loading: true, error: null, success: false }));

        try {
            const result = await asyncFunction();

            if (isMountedRef.current) {
                setState(prev => ({
                    ...prev,
                    data: result,
                    loading: false,
                    error: null,
                    success: true,
                }));
            }

            return result;
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
            }
            return null;
        }
    }, [asyncFunction]);

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

export default useAsync;
