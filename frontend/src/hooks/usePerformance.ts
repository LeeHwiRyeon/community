/**
 * React Performance Optimization Hooks
 * 컴포넌트 성능 최적화를 위한 커스텀 훅들
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/**
 * 디바운스 훅
 * 입력값이 변경될 때 일정 시간 후에 업데이트
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

/**
 * 쓰로틀 훅
 * 일정 시간 동안 한 번만 함수 실행
 */
export function useThrottle<T extends (...args: any[]) => any>(
    callback: T,
    delay: number = 500
): T {
    const lastRun = useRef(Date.now());

    return useCallback(
        (...args: Parameters<T>) => {
            const now = Date.now();
            if (now - lastRun.current >= delay) {
                lastRun.current = now;
                return callback(...args);
            }
        },
        [callback, delay]
    ) as T;
}

/**
 * 인터섹션 옵저버 훅
 * 무한 스크롤이나 지연 로딩에 사용
 */
export function useIntersectionObserver(
    ref: React.RefObject<Element>,
    options: IntersectionObserverInit = {}
) {
    const [isIntersecting, setIsIntersecting] = useState(false);
    const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        const observer = new IntersectionObserver(([entry]) => {
            setIsIntersecting(entry.isIntersecting);
            setEntry(entry);
        }, options);

        observer.observe(element);

        return () => {
            observer.disconnect();
        };
    }, [ref, options.threshold, options.root, options.rootMargin]);

    return { isIntersecting, entry };
}

/**
 * 무한 스크롤 훅
 */
export function useInfiniteScroll<T>(
    fetchMore: () => Promise<T[]>,
    options: {
        threshold?: number;
        hasMore?: boolean;
        initialData?: T[];
    } = {}
) {
    const { threshold = 0.8, hasMore = true, initialData = [] } = options;

    const [data, setData] = useState<T[]>(initialData);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const loadMoreRef = useRef<HTMLDivElement>(null);
    const { isIntersecting } = useIntersectionObserver(loadMoreRef, {
        threshold,
    });

    const loadMore = useCallback(async () => {
        if (loading || !hasMore) return;

        try {
            setLoading(true);
            setError(null);
            const newData = await fetchMore();
            setData((prev) => [...prev, ...newData]);
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    }, [fetchMore, loading, hasMore]);

    useEffect(() => {
        if (isIntersecting && hasMore && !loading) {
            loadMore();
        }
    }, [isIntersecting, hasMore, loading, loadMore]);

    return {
        data,
        loading,
        error,
        loadMoreRef,
        loadMore,
    };
}

/**
 * 로컬 스토리지 훅 (자동 직렬화/역직렬화)
 */
export function useLocalStorage<T>(
    key: string,
    initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return initialValue;
        }
    });

    const setValue = useCallback(
        (value: T | ((val: T) => T)) => {
            try {
                const valueToStore = value instanceof Function ? value(storedValue) : value;
                setStoredValue(valueToStore);
                window.localStorage.setItem(key, JSON.stringify(valueToStore));
            } catch (error) {
                console.error('Error writing to localStorage:', error);
            }
        },
        [key, storedValue]
    );

    return [storedValue, setValue];
}

/**
 * 이전 값 추적 훅
 */
export function usePrevious<T>(value: T): T | undefined {
    const ref = useRef<T>();

    useEffect(() => {
        ref.current = value;
    }, [value]);

    return ref.current;
}

/**
 * 마운트 상태 추적 훅
 */
export function useIsMounted(): () => boolean {
    const isMounted = useRef(false);

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    return useCallback(() => isMounted.current, []);
}

/**
 * 배열 페이지네이션 훅
 */
export function usePagination<T>(
    items: T[],
    itemsPerPage: number = 10
) {
    const [currentPage, setCurrentPage] = useState(1);

    const totalPages = Math.ceil(items.length / itemsPerPage);

    const currentItems = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        return items.slice(start, end);
    }, [items, currentPage, itemsPerPage]);

    const nextPage = useCallback(() => {
        setCurrentPage((prev) => Math.min(prev + 1, totalPages));
    }, [totalPages]);

    const prevPage = useCallback(() => {
        setCurrentPage((prev) => Math.max(prev - 1, 1));
    }, []);

    const goToPage = useCallback(
        (page: number) => {
            setCurrentPage(Math.max(1, Math.min(page, totalPages)));
        },
        [totalPages]
    );

    return {
        currentItems,
        currentPage,
        totalPages,
        nextPage,
        prevPage,
        goToPage,
        hasNextPage: currentPage < totalPages,
        hasPrevPage: currentPage > 1,
    };
}

/**
 * 미디어 쿼리 훅
 */
export function useMediaQuery(query: string): boolean {
    const [matches, setMatches] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.matchMedia(query).matches;
        }
        return false;
    });

    useEffect(() => {
        const mediaQuery = window.matchMedia(query);
        const handler = (event: MediaQueryListEvent) => setMatches(event.matches);

        // Modern browsers
        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', handler);
            return () => mediaQuery.removeEventListener('change', handler);
        }
        // Legacy browsers
        else {
            mediaQuery.addListener(handler);
            return () => mediaQuery.removeListener(handler);
        }
    }, [query]);

    return matches;
}

/**
 * 온라인 상태 훅
 */
export function useOnlineStatus(): boolean {
    const [isOnline, setIsOnline] = useState(
        typeof navigator !== 'undefined' ? navigator.onLine : true
    );

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return isOnline;
}

/**
 * 윈도우 사이즈 훅
 */
export function useWindowSize() {
    const [windowSize, setWindowSize] = useState({
        width: typeof window !== 'undefined' ? window.innerWidth : 0,
        height: typeof window !== 'undefined' ? window.innerHeight : 0,
    });

    useEffect(() => {
        const handleResize = () => {
            setWindowSize({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return windowSize;
}

/**
 * 이미지 지연 로딩 훅
 */
export function useLazyImage(src: string, placeholder: string = '') {
    const [imageSrc, setImageSrc] = useState(placeholder);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const img = new Image();

        img.onload = () => {
            setImageSrc(src);
            setIsLoading(false);
        };

        img.onerror = () => {
            setError(new Error('Failed to load image'));
            setIsLoading(false);
        };

        img.src = src;

        return () => {
            img.onload = null;
            img.onerror = null;
        };
    }, [src]);

    return { imageSrc, isLoading, error };
}

export default {
    useDebounce,
    useThrottle,
    useIntersectionObserver,
    useInfiniteScroll,
    useLocalStorage,
    usePrevious,
    useIsMounted,
    usePagination,
    useMediaQuery,
    useOnlineStatus,
    useWindowSize,
    useLazyImage,
};
