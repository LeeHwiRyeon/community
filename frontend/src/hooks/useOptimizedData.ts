import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

// 데이터 타입 정의
interface DataItem {
    id: number;
    [key: string]: any;
}

interface UseOptimizedDataOptions {
    pageSize?: number;
    cacheSize?: number;
    debounceMs?: number;
    enableVirtualization?: boolean;
}

interface UseOptimizedDataReturn<T extends DataItem> {
    data: T[];
    loading: boolean;
    hasMore: boolean;
    error: string | null;
    loadMore: () => Promise<void>;
    refresh: () => Promise<void>;
    totalCount: number;
    currentPage: number;
}

// 캐시 관리 클래스
class DataCache<T extends DataItem> {
    private cache = new Map<string, T[]>();
    private maxSize: number;

    constructor(maxSize: number = 100) {
        this.maxSize = maxSize;
    }

    set(key: string, data: T[]): void {
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            if (firstKey) {
                this.cache.delete(firstKey);
            }
        }
        this.cache.set(key, data);
    }

    get(key: string): T[] | undefined {
        return this.cache.get(key);
    }

    clear(): void {
        this.cache.clear();
    }

    has(key: string): boolean {
        return this.cache.has(key);
    }
}

// 메인 훅
function useOptimizedData<T extends DataItem>(
    fetchFunction: (page: number, pageSize: number) => Promise<{ data: T[]; total: number }>,
    dependencies: any[] = [],
    options: UseOptimizedDataOptions = {}
): UseOptimizedDataReturn<T> {
    const {
        pageSize = 20,
        cacheSize = 100,
        debounceMs = 300,
        enableVirtualization = true
    } = options;

    // 상태 관리
    const [data, setData] = useState<T[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    // 레퍼런스
    const cacheRef = useRef(new DataCache<T>(cacheSize));
    const loadingRef = useRef(false);
    const abortControllerRef = useRef<AbortController | null>(null);
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    // 캐시 키 생성
    const getCacheKey = useCallback((page: number, size: number) => {
        return `${JSON.stringify(dependencies)}_${page}_${size}`;
    }, [dependencies]);

    // 데이터 로드 함수
    const loadData = useCallback(async (page: number, append: boolean = false) => {
        if (loadingRef.current) return;

        const cacheKey = getCacheKey(page, pageSize);

        // 캐시에서 확인
        if (cacheRef.current.has(cacheKey) && !append) {
            const cachedData = cacheRef.current.get(cacheKey)!;
            setData(prev => append ? [...prev, ...cachedData] : cachedData);
            return;
        }

        loadingRef.current = true;
        setLoading(true);
        setError(null);

        // 이전 요청 취소
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        try {
            const result = await fetchFunction(page, pageSize);

            // 요청이 취소되지 않았다면 데이터 업데이트
            if (!abortControllerRef.current.signal.aborted) {
                const newData = result.data;

                // 캐시에 저장
                cacheRef.current.set(cacheKey, newData);

                // 상태 업데이트
                setData(prev => {
                    if (append) {
                        // 중복 제거
                        const existingIds = new Set(prev.map(item => item.id));
                        const uniqueNewData = newData.filter(item => !existingIds.has(item.id));
                        return [...prev, ...uniqueNewData];
                    } else {
                        return newData;
                    }
                });

                setTotalCount(result.total);
                setCurrentPage(page);
                setHasMore(data.length + newData.length < result.total);
            }
        } catch (err) {
            if (!abortControllerRef.current?.signal.aborted) {
                setError(err instanceof Error ? err.message : 'Unknown error occurred');
                console.error('Data loading error:', err);
            }
        } finally {
            if (!abortControllerRef.current?.signal.aborted) {
                setLoading(false);
                loadingRef.current = false;
            }
        }
    }, [fetchFunction, pageSize, getCacheKey, data.length]);

    // 디바운싱된 로드 함수
    const debouncedLoadData = useCallback((page: number, append: boolean = false) => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = setTimeout(() => {
            loadData(page, append);
        }, debounceMs);
    }, [loadData, debounceMs]);

    // 더 많은 데이터 로드
    const loadMore = useCallback(async () => {
        if (!hasMore || loading) return;
        await loadData(currentPage + 1, true);
    }, [hasMore, loading, currentPage, loadData]);

    // 데이터 새로고침
    const refresh = useCallback(async () => {
        cacheRef.current.clear();
        setData([]);
        setCurrentPage(1);
        setHasMore(true);
        await loadData(1, false);
    }, [loadData]);

    // 초기 데이터 로드
    useEffect(() => {
        debouncedLoadData(1, false);

        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, dependencies);

    // 메모이제이션된 반환값
    const returnValue = useMemo(() => ({
        data,
        loading,
        hasMore,
        error,
        loadMore,
        refresh,
        totalCount,
        currentPage
    }), [data, loading, hasMore, error, loadMore, refresh, totalCount, currentPage]);

    return returnValue;
}

export default useOptimizedData;
export type { DataItem, UseOptimizedDataOptions, UseOptimizedDataReturn };
