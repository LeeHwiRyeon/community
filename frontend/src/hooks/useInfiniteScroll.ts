import { useEffect, useRef, useState, useCallback } from 'react';

interface UseInfiniteScrollOptions {
    /**
     * 다음 페이지를 로드하는 함수
     */
    loadMore: () => Promise<void>;

    /**
     * 더 많은 데이터가 있는지 여부
     */
    hasMore: boolean;

    /**
     * 로딩 중인지 여부
     */
    isLoading: boolean;

    /**
     * 교차점 감지 임계값 (0.0 ~ 1.0)
     * @default 0.1
     */
    threshold?: number;

    /**
     * 교차점 감지 마진 (px)
     * @default '100px'
     */
    rootMargin?: string;
}

interface UseInfiniteScrollReturn {
    /**
     * 감시할 요소에 연결할 ref
     */
    observerRef: (node: HTMLElement | null) => void;

    /**
     * 로딩 중인지 여부
     */
    isLoading: boolean;

    /**
     * 더 많은 데이터가 있는지 여부
     */
    hasMore: boolean;
}

/**
 * 무한 스크롤 구현을 위한 커스텀 훅
 * Intersection Observer API를 사용하여 스크롤 위치를 감지합니다.
 * 
 * @example
 * ```tsx
 * const { observerRef, isLoading, hasMore } = useInfiniteScroll({
 *   loadMore: fetchNextPage,
 *   hasMore: hasNextPage,
 *   isLoading: isFetchingNextPage
 * });
 * 
 * return (
 *   <div>
 *     {items.map(item => <Item key={item.id} {...item} />)}
 *     {hasMore && <div ref={observerRef} />}
 *     {isLoading && <Loading />}
 *   </div>
 * );
 * ```
 */
export function useInfiniteScroll({
    loadMore,
    hasMore,
    isLoading,
    threshold = 0.1,
    rootMargin = '100px'
}: UseInfiniteScrollOptions): UseInfiniteScrollReturn {
    const observer = useRef<IntersectionObserver | null>(null);

    const observerRef = useCallback(
        (node: HTMLElement | null) => {
            // 로딩 중이면 감시하지 않음
            if (isLoading) return;

            // 기존 observer 정리
            if (observer.current) {
                observer.current.disconnect();
            }

            // 더 이상 데이터가 없으면 감시하지 않음
            if (!hasMore) return;

            // 새로운 observer 생성
            observer.current = new IntersectionObserver(
                (entries) => {
                    // 요소가 화면에 보이면 다음 페이지 로드
                    if (entries[0].isIntersecting && hasMore && !isLoading) {
                        loadMore();
                    }
                },
                {
                    threshold,
                    rootMargin
                }
            );

            // 노드가 있으면 감시 시작
            if (node) {
                observer.current.observe(node);
            }
        },
        [isLoading, hasMore, loadMore, threshold, rootMargin]
    );

    // 컴포넌트 언마운트 시 observer 정리
    useEffect(() => {
        return () => {
            if (observer.current) {
                observer.current.disconnect();
            }
        };
    }, []);

    return {
        observerRef,
        isLoading,
        hasMore
    };
}

/**
 * 페이지 기반 무한 스크롤 상태 관리 훅
 * 
 * @example
 * ```tsx
 * const {
 *   data,
 *   isLoading,
 *   hasMore,
 *   loadMore,
 *   reset
 * } = useInfiniteScrollPagination({
 *   fetchPage: (page) => api.getPosts({ page, limit: 20 }),
 *   limit: 20
 * });
 * 
 * const { observerRef } = useInfiniteScroll({
 *   loadMore,
 *   hasMore,
 *   isLoading
 * });
 * ```
 */
export function useInfiniteScrollPagination<T>({
    fetchPage,
    limit = 20,
    initialPage = 1
}: {
    fetchPage: (page: number) => Promise<{ items: T[]; total: number }>;
    limit?: number;
    initialPage?: number;
}) {
    const [data, setData] = useState<T[]>([]);
    const [page, setPage] = useState(initialPage);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const hasMore = data.length < total;

    const loadMore = useCallback(async () => {
        if (isLoading || !hasMore) return;

        try {
            setIsLoading(true);
            setError(null);

            const result = await fetchPage(page);

            setData((prev) => [...prev, ...result.items]);
            setTotal(result.total);
            setPage((prev) => prev + 1);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to fetch data'));
        } finally {
            setIsLoading(false);
        }
    }, [page, isLoading, hasMore, fetchPage]);

    const reset = useCallback(() => {
        setData([]);
        setPage(initialPage);
        setTotal(0);
        setIsLoading(false);
        setError(null);
    }, [initialPage]);

    // 초기 로드
    useEffect(() => {
        loadMore();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return {
        data,
        isLoading,
        error,
        hasMore,
        page,
        total,
        loadMore,
        reset
    };
}
