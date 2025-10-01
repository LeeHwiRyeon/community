import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

interface PerformanceMetrics {
    renderTime: number;
    memoryUsage: number;
    componentCount: number;
    reRenderCount: number;
}

interface OptimizationOptions {
    enableVirtualScrolling?: boolean;
    enableMemoization?: boolean;
    enableDebouncing?: boolean;
    enableThrottling?: boolean;
    batchSize?: number;
    debounceDelay?: number;
    throttleDelay?: number;
}

/**
 * 성능 최적화 훅
 * 메모이제이션, 디바운싱, 쓰로틀링, 가상 스크롤링 등을 제공합니다.
 */
export const usePerformanceOptimization = (options: OptimizationOptions = {}) => {
    const {
        enableVirtualScrolling = false,
        enableMemoization = true,
        enableDebouncing = true,
        enableThrottling = true,
        batchSize = 50,
        debounceDelay = 300,
        throttleDelay = 100,
    } = options;

    const [metrics, setMetrics] = useState<PerformanceMetrics>({
        renderTime: 0,
        memoryUsage: 0,
        componentCount: 0,
        reRenderCount: 0,
    });

    const renderCountRef = useRef(0);
    const startTimeRef = useRef(0);

    // 렌더링 시작 시간 기록
    useEffect(() => {
        startTimeRef.current = performance.now();
    });

    // 렌더링 완료 시간 기록
    useEffect(() => {
        const endTime = performance.now();
        const renderTime = endTime - startTimeRef.current;

        renderCountRef.current += 1;

        setMetrics(prev => ({
            ...prev,
            renderTime,
            memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
            componentCount: document.querySelectorAll('[data-component]').length,
            reRenderCount: renderCountRef.current,
        }));
    });

    // 디바운싱 훅
    const useDebounce = useCallback(<T>(value: T, delay: number = debounceDelay): T => {
        const [debouncedValue, setDebouncedValue] = useState<T>(value);

        useEffect(() => {
            if (!enableDebouncing) {
                setDebouncedValue(value);
                return;
            }

            const handler = setTimeout(() => {
                setDebouncedValue(value);
            }, delay);

            return () => {
                clearTimeout(handler);
            };
        }, [value, delay, enableDebouncing]);

        return debouncedValue;
    }, [debounceDelay, enableDebouncing]);

    // 쓰로틀링 훅
    const useThrottle = useCallback(<T extends (...args: any[]) => any>(
        func: T,
        delay: number = throttleDelay
    ): T => {
        const lastCallRef = useRef<number>(0);
        const timeoutRef = useRef<NodeJS.Timeout>();

        return useCallback((...args: Parameters<T>) => {
            if (!enableThrottling) {
                return func(...args);
            }

            const now = Date.now();

            if (now - lastCallRef.current >= delay) {
                lastCallRef.current = now;
                return func(...args);
            } else {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = setTimeout(() => {
                    lastCallRef.current = Date.now();
                    func(...args);
                }, delay - (now - lastCallRef.current));
            }
        }, [func, delay, enableThrottling]) as T;
    }, [throttleDelay, enableThrottling]);

    // 메모이제이션 훅
    const useMemoizedCallback = useCallback(<T extends (...args: any[]) => any>(
        callback: T,
        deps: React.DependencyList
    ): T => {
        if (!enableMemoization) {
            return callback;
        }

        return useCallback(callback, deps);
    }, [enableMemoization]);

    const useMemoizedValue = useCallback(<T>(
        factory: () => T,
        deps: React.DependencyList
    ): T => {
        if (!enableMemoization) {
            return factory();
        }

        return useMemo(factory, deps);
    }, [enableMemoization]);

    // 가상 스크롤링 훅
    const useVirtualScrolling = useCallback((
        items: any[],
        itemHeight: number,
        containerHeight: number,
        overscan: number = 5
    ) => {
        const [scrollTop, setScrollTop] = useState(0);

        const visibleRange = useMemo(() => {
            if (!enableVirtualScrolling) {
                return { start: 0, end: items.length };
            }

            const startIndex = Math.floor(scrollTop / itemHeight);
            const endIndex = Math.min(
                startIndex + Math.ceil(containerHeight / itemHeight) + overscan,
                items.length
            );

            return {
                start: Math.max(0, startIndex - overscan),
                end: endIndex,
            };
        }, [scrollTop, itemHeight, containerHeight, overscan, items.length, enableVirtualScrolling]);

        const visibleItems = useMemo(() => {
            return items.slice(visibleRange.start, visibleRange.end);
        }, [items, visibleRange]);

        const totalHeight = items.length * itemHeight;
        const offsetY = visibleRange.start * itemHeight;

        const handleScroll = useThrottle((e: React.UIEvent<HTMLDivElement>) => {
            setScrollTop(e.currentTarget.scrollTop);
        });

        return {
            visibleItems,
            totalHeight,
            offsetY,
            handleScroll,
            visibleRange,
        };
    }, [enableVirtualScrolling, useThrottle]);

    // 배치 처리 훅
    const useBatchProcessing = useCallback(<T>(
        items: T[],
        processFn: (batch: T[]) => void,
        batchSize: number = batchSize
    ) => {
        const [processedCount, setProcessedCount] = useState(0);
        const [isProcessing, setIsProcessing] = useState(false);

        const processBatch = useCallback(async () => {
            if (isProcessing) return;

            setIsProcessing(true);

            for (let i = 0; i < items.length; i += batchSize) {
                const batch = items.slice(i, i + batchSize);
                await new Promise(resolve => {
                    setTimeout(() => {
                        processFn(batch);
                        setProcessedCount(i + batch.length);
                        resolve(undefined);
                    }, 0);
                });
            }

            setIsProcessing(false);
        }, [items, processFn, batchSize, isProcessing]);

        return {
            processedCount,
            isProcessing,
            processBatch,
            progress: items.length > 0 ? (processedCount / items.length) * 100 : 0,
        };
    }, [batchSize]);

    // 지연 로딩 훅
    const useLazyLoading = useCallback(<T>(
        items: T[],
        loadMore: () => Promise<T[]>,
        hasMore: boolean = true
    ) => {
        const [loadedItems, setLoadedItems] = useState<T[]>(items);
        const [isLoading, setIsLoading] = useState(false);
        const [hasMoreItems, setHasMoreItems] = useState(hasMore);

        const loadMoreItems = useCallback(async () => {
            if (isLoading || !hasMoreItems) return;

            setIsLoading(true);
            try {
                const newItems = await loadMore();
                setLoadedItems(prev => [...prev, ...newItems]);
                setHasMoreItems(newItems.length > 0);
            } catch (error) {
                console.error('Failed to load more items:', error);
            } finally {
                setIsLoading(false);
            }
        }, [isLoading, hasMoreItems, loadMore]);

        return {
            loadedItems,
            isLoading,
            hasMoreItems,
            loadMoreItems,
        };
    }, []);

    // 성능 모니터링
    const startPerformanceMonitoring = useCallback(() => {
        const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach((entry) => {
                if (entry.entryType === 'measure') {
                    console.log(`Performance: ${entry.name} - ${entry.duration}ms`);
                }
            });
        });

        observer.observe({ entryTypes: ['measure'] });
        return () => observer.disconnect();
    }, []);

    // 메모리 사용량 모니터링
    const getMemoryUsage = useCallback(() => {
        if ('memory' in performance) {
            const memory = (performance as any).memory;
            return {
                used: Math.round(memory.usedJSHeapSize / 1024 / 1024), // MB
                total: Math.round(memory.totalJSHeapSize / 1024 / 1024), // MB
                limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024), // MB
            };
        }
        return null;
    }, []);

    // 성능 최적화 권장사항
    const getOptimizationRecommendations = useCallback(() => {
        const recommendations: string[] = [];

        if (metrics.renderTime > 16) {
            recommendations.push('렌더링 시간이 16ms를 초과합니다. 컴포넌트 최적화가 필요합니다.');
        }

        if (metrics.reRenderCount > 10) {
            recommendations.push('리렌더링이 너무 자주 발생합니다. 메모이제이션을 적용하세요.');
        }

        if (metrics.componentCount > 100) {
            recommendations.push('컴포넌트 수가 많습니다. 가상 스크롤링을 고려하세요.');
        }

        const memoryUsage = getMemoryUsage();
        if (memoryUsage && memoryUsage.used > 50) {
            recommendations.push('메모리 사용량이 높습니다. 메모리 누수를 확인하세요.');
        }

        return recommendations;
    }, [metrics, getMemoryUsage]);

    return {
        metrics,
        useDebounce,
        useThrottle,
        useMemoizedCallback,
        useMemoizedValue,
        useVirtualScrolling,
        useBatchProcessing,
        useLazyLoading,
        startPerformanceMonitoring,
        getMemoryUsage,
        getOptimizationRecommendations,
    };
};

export default usePerformanceOptimization;
