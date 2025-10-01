/**
 * Custom hook for infinite scroll functionality
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useIntersectionObserver } from './useIntersectionObserver';

export interface UseInfiniteScrollOptions<T> {
    data: T[];
    pageSize?: number;
    initialPage?: number;
    hasMore?: boolean;
    loadMore?: () => Promise<void>;
    threshold?: number;
    rootMargin?: string;
    reverse?: boolean;
}

export function useInfiniteScroll<T>(
    options: UseInfiniteScrollOptions<T>
): {
    data: T[];
    currentPage: number;
    hasMore: boolean;
    isLoading: boolean;
    error: Error | null;
    loadMore: () => Promise<void>;
    reset: () => void;
    setData: (data: T[]) => void;
    setHasMore: (hasMore: boolean) => void;
    setError: (error: Error | null) => void;
    loadMoreRef: React.RefObject<HTMLElement>;
} {
    const {
        data,
        pageSize = 10,
        initialPage = 1,
        hasMore: initialHasMore = true,
        loadMore: loadMoreFn,
        threshold = 0.1,
        rootMargin = '0px',
        reverse = false,
    } = options;

    const [currentPage, setCurrentPage] = useState(initialPage);
    const [hasMore, setHasMore] = useState(initialHasMore);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [allData, setAllData] = useState<T[]>(data);

    const loadMoreRef = useRef<HTMLElement>(null);

    const [isIntersecting] = useIntersectionObserver({
        threshold,
        rootMargin,
    });

    const loadMore = useCallback(async () => {
        if (isLoading || !hasMore) return;

        setIsLoading(true);
        setError(null);

        try {
            if (loadMoreFn) {
                await loadMoreFn();
            } else {
                // Simulate loading more data
                const startIndex = currentPage * pageSize;
                const endIndex = startIndex + pageSize;
                const newData = data.slice(startIndex, endIndex);

                if (newData.length === 0) {
                    setHasMore(false);
                } else {
                    setAllData(prev => reverse ? [...newData, ...prev] : [...prev, ...newData]);
                    setCurrentPage(prev => prev + 1);
                }
            }
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            setError(error);
        } finally {
            setIsLoading(false);
        }
    }, [isLoading, hasMore, loadMoreFn, currentPage, pageSize, data, reverse]);

    const reset = useCallback(() => {
        setCurrentPage(initialPage);
        setHasMore(initialHasMore);
        setIsLoading(false);
        setError(null);
        setAllData(data);
    }, [initialPage, initialHasMore, data]);

    const setData = useCallback((newData: T[]) => {
        setAllData(newData);
    }, []);

    const setHasMoreCallback = useCallback((newHasMore: boolean) => {
        setHasMore(newHasMore);
    }, []);

    const setErrorCallback = useCallback((newError: Error | null) => {
        setError(newError);
    }, []);

    // Load more when intersection observer triggers
    useEffect(() => {
        if (isIntersecting && hasMore && !isLoading) {
            loadMore();
        }
    }, [isIntersecting, hasMore, isLoading, loadMore]);

    // Update data when prop changes
    useEffect(() => {
        setAllData(data);
    }, [data]);

    return {
        data: allData,
        currentPage,
        hasMore,
        isLoading,
        error,
        loadMore,
        reset,
        setData,
        setHasMore: setHasMoreCallback,
        setError: setErrorCallback,
        loadMoreRef,
    };
}

export default useInfiniteScroll;
