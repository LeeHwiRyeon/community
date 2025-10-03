/**
 * 🚀 성능 최적화 훅
 * 
 * 컴포넌트 레벨에서 성능 최적화를 위한 커스텀 훅 모음
 * 메모이제이션, 가상화, 지연 로딩, 성능 모니터링 등을 제공
 * 
 * @author AUTOAGENTS Manager
 * @version 3.0.0
 * @created 2025-10-02
 */

import {
    useState,
    useEffect,
    useCallback,
    useMemo,
    useRef,
    RefObject,
    ComponentType
} from 'react';

// ============================================================================
// 1. 메모이제이션 최적화 훅
// ============================================================================

/**
 * 🧠 고급 메모이제이션 훅
 */
export function useAdvancedMemo<T>(
    factory: () => T,
    deps: React.DependencyList,
    options: {
        maxSize?: number;
        ttl?: number;
        serialize?: (deps: React.DependencyList) => string;
    } = {}
): T {
    const {
        maxSize = 10,
        ttl = 5 * 60 * 1000, // 5분
        serialize = (deps) => JSON.stringify(deps)
    } = options;

    const cacheRef = useRef(new Map<string, { value: T; timestamp: number }>());

    return useMemo(() => {
        const cache = cacheRef.current;
        const key = serialize(deps);
        const now = Date.now();

        // 캐시 확인
        const cached = cache.get(key);
        if (cached && (now - cached.timestamp) < ttl) {
            return cached.value;
        }

        // 새 값 계산
        const value = factory();

        // 캐시 크기 제한
        if (cache.size >= maxSize) {
            const oldestKey = cache.keys().next().value;
            if (oldestKey !== undefined) {
                if (oldestKey) cache.delete(oldestKey);
            }
        }

        // 캐시에 저장
        cache.set(key, { value, timestamp: now });

        return value;
    }, deps);
}

/**
 * 🔄 스마트 콜백 훅 (의존성 최적화)
 */
export function useSmartCallback<T extends (...args: any[]) => any>(
    callback: T,
    deps: React.DependencyList,
    options: {
        debounce?: number;
        throttle?: number;
        maxCalls?: number;
    } = {}
): T {
    const { debounce, throttle, maxCalls } = options;
    const callCountRef = useRef(0);
    const lastCallRef = useRef(0);
    const timeoutRef = useRef<NodeJS.Timeout>();

    return useCallback((...args: Parameters<T>) => {
        const now = Date.now();

        // 최대 호출 횟수 제한
        if (maxCalls && callCountRef.current >= maxCalls) {
            return;
        }

        // 스로틀링
        if (throttle && (now - lastCallRef.current) < throttle) {
            return;
        }

        // 디바운싱
        if (debounce) {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            timeoutRef.current = setTimeout(() => {
                callCountRef.current++;
                lastCallRef.current = now;
                callback(...args);
            }, debounce);

            return;
        }

        // 일반 실행
        callCountRef.current++;
        lastCallRef.current = now;
        return callback(...args);
    }, deps) as T;
}

// ============================================================================
// 2. 가상화 및 무한 스크롤 훅
// ============================================================================

/**
 * 📜 무한 스크롤 훅
 */
export function useInfiniteScroll<T>(
    fetchMore: (page: number) => Promise<T[]>,
    options: {
        initialPage?: number;
        pageSize?: number;
        threshold?: number;
        enabled?: boolean;
    } = {}
) {
    const {
        initialPage = 1,
        pageSize = 20,
        threshold = 0.8,
        enabled = true
    } = options;

    const [items, setItems] = useState<T[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(initialPage);

    const loadMore = useCallback(async () => {
        if (loading || !hasMore || !enabled) return;

        setLoading(true);
        setError(null);

        try {
            const newItems = await fetchMore(page);

            if (newItems.length < pageSize) {
                setHasMore(false);
            }

            setItems(prev => [...prev, ...newItems]);
            setPage(prev => prev + 1);

        } catch (err) {
            setError(err instanceof Error ? err.message : '데이터 로딩 실패');
        } finally {
            setLoading(false);
        }
    }, [fetchMore, page, pageSize, loading, hasMore, enabled]);

    const reset = useCallback(() => {
        setItems([]);
        setPage(initialPage);
        setHasMore(true);
        setError(null);
        setLoading(false);
    }, [initialPage]);

    return {
        items,
        loading,
        hasMore,
        error,
        loadMore,
        reset
    };
}

/**
 * 👁️ 가시성 관찰 훅 (Intersection Observer)
 */
export function useIntersectionObserver(
    targetRef: RefObject<Element>,
    options: IntersectionObserverInit & {
        onIntersect?: (entry: IntersectionObserverEntry) => void;
        enabled?: boolean;
    } = {}
) {
    const { onIntersect, enabled = true, ...observerOptions } = options;
    const [isIntersecting, setIsIntersecting] = useState(false);
    const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);

    useEffect(() => {
        if (!enabled || !targetRef.current) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const [entry] = entries;
                setIsIntersecting(entry.isIntersecting);
                setEntry(entry);

                if (entry.isIntersecting && onIntersect) {
                    onIntersect(entry);
                }
            },
            {
                threshold: 0.1,
                ...observerOptions
            }
        );

        observer.observe(targetRef.current);

        return () => observer.disconnect();
    }, [targetRef, onIntersect, enabled, observerOptions]);

    return { isIntersecting, entry };
}

// ============================================================================
// 3. 지연 로딩 훅
// ============================================================================

/**
 * 🖼️ 이미지 지연 로딩 훅
 */
export function useLazyImage(
    src: string,
    options: {
        placeholder?: string;
        threshold?: number;
        rootMargin?: string;
    } = {}
) {
    const {
        placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PC9zdmc+',
        threshold = 0.1,
        rootMargin = '50px'
    } = options;

    const [imageSrc, setImageSrc] = useState(placeholder);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isError, setIsError] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);

    const { isIntersecting } = useIntersectionObserver(imgRef, {
        threshold,
        rootMargin,
        enabled: !isLoaded && !isError
    });

    useEffect(() => {
        if (isIntersecting && !isLoaded && !isError) {
            const img = new Image();

            img.onload = () => {
                setImageSrc(src);
                setIsLoaded(true);
            };

            img.onerror = () => {
                setIsError(true);
            };

            img.src = src;
        }
    }, [isIntersecting, src, isLoaded, isError]);

    return {
        imgRef,
        imageSrc,
        isLoaded,
        isError
    };
}

/**
 * 📦 컴포넌트 지연 로딩 훅
 */
export function useLazyComponent<T>(
    importFn: () => Promise<{ default: React.ComponentType<T> }>,
    fallback?: React.ComponentType
) {
    const [Component, setComponent] = useState<React.ComponentType<T> | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const loadComponent = useCallback(async () => {
        if (Component || loading) return;

        setLoading(true);
        setError(null);

        try {
            const module = await importFn();
            setComponent(() => module.default as ComponentType<T>);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Component loading failed'));
            if (fallback) {
                setComponent(fallback as ComponentType<T>);
            }
        } finally {
            setLoading(false);
        }
    }, [importFn, Component, loading, fallback]);

    return {
        Component,
        loading,
        error,
        loadComponent
    };
}

// ============================================================================
// 4. 성능 모니터링 훅
// ============================================================================

/**
 * 📊 렌더링 성능 모니터링 훅
 */
export function useRenderPerformance(componentName: string) {
    const renderCountRef = useRef(0);
    const renderTimesRef = useRef<number[]>([]);
    const startTimeRef = useRef<number>(0);

    // 렌더링 시작 시간 기록
    startTimeRef.current = performance.now();

    useEffect(() => {
        // 렌더링 완료 시간 기록
        const endTime = performance.now();
        const renderTime = endTime - startTimeRef.current;

        renderCountRef.current++;
        renderTimesRef.current.push(renderTime);

        // 최대 100개 기록만 유지
        if (renderTimesRef.current.length > 100) {
            renderTimesRef.current.shift();
        }

        // 개발 환경에서만 로깅
        if (process.env.NODE_ENV === 'development') {
            console.log(`🎭 ${componentName} 렌더링 #${renderCountRef.current}: ${renderTime.toFixed(2)}ms`);
        }
    });

    const getStats = useCallback(() => {
        const times = renderTimesRef.current;
        if (times.length === 0) return null;

        const avg = times.reduce((sum, time) => sum + time, 0) / times.length;
        const min = Math.min(...times);
        const max = Math.max(...times);

        return {
            renderCount: renderCountRef.current,
            averageTime: avg,
            minTime: min,
            maxTime: max,
            lastTime: times[times.length - 1]
        };
    }, []);

    return { getStats };
}

/**
 * 💾 메모리 사용량 모니터링 훅
 */
export function useMemoryMonitoring(interval = 5000) {
    const [memoryInfo, setMemoryInfo] = useState<{
        used: number;
        total: number;
        limit: number;
        percentage: number;
    } | null>(null);

    useEffect(() => {
        if (!('memory' in performance)) {
            return;
        }

        const updateMemoryInfo = () => {
            const memory = (performance as any).memory;
            setMemoryInfo({
                used: memory.usedJSHeapSize,
                total: memory.totalJSHeapSize,
                limit: memory.jsHeapSizeLimit,
                percentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
            });
        };

        updateMemoryInfo();
        const intervalId = setInterval(updateMemoryInfo, interval);

        return () => clearInterval(intervalId);
    }, [interval]);

    return memoryInfo;
}

// ============================================================================
// 5. 네트워크 최적화 훅
// ============================================================================

/**
 * 🌐 네트워크 상태 모니터링 훅
 */
export function useNetworkStatus() {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [connectionType, setConnectionType] = useState<string>('unknown');
    const [effectiveType, setEffectiveType] = useState<string>('unknown');

    useEffect(() => {
        const updateOnlineStatus = () => setIsOnline(navigator.onLine);

        const updateConnectionInfo = () => {
            const connection = (navigator as any).connection
                || (navigator as any).mozConnection
                || (navigator as any).webkitConnection;

            if (connection) {
                setConnectionType(connection.type || 'unknown');
                setEffectiveType(connection.effectiveType || 'unknown');
            }
        };

        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);

        updateConnectionInfo();

        const connection = (navigator as any).connection;
        if (connection) {
            connection.addEventListener('change', updateConnectionInfo);
        }

        return () => {
            window.removeEventListener('online', updateOnlineStatus);
            window.removeEventListener('offline', updateOnlineStatus);

            if (connection) {
                connection.removeEventListener('change', updateConnectionInfo);
            }
        };
    }, []);

    return {
        isOnline,
        connectionType,
        effectiveType,
        isSlowConnection: effectiveType === 'slow-2g' || effectiveType === '2g'
    };
}

/**
 * 📡 적응형 데이터 로딩 훅
 */
export function useAdaptiveLoading<T>(
    fetchFn: (quality: 'low' | 'medium' | 'high') => Promise<T>,
    options: {
        autoAdjust?: boolean;
        defaultQuality?: 'low' | 'medium' | 'high';
    } = {}
) {
    const { autoAdjust = true, defaultQuality = 'medium' } = options;
    const { isSlowConnection, effectiveType } = useNetworkStatus();

    const [quality, setQuality] = useState<'low' | 'medium' | 'high'>(defaultQuality);
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    // 네트워크 상태에 따른 품질 자동 조정
    useEffect(() => {
        if (!autoAdjust) return;

        if (isSlowConnection) {
            setQuality('low');
        } else if (effectiveType === '3g') {
            setQuality('medium');
        } else if (effectiveType === '4g') {
            setQuality('high');
        }
    }, [isSlowConnection, effectiveType, autoAdjust]);

    const loadData = useCallback(async (overrideQuality?: 'low' | 'medium' | 'high') => {
        setLoading(true);
        setError(null);

        try {
            const result = await fetchFn(overrideQuality || quality);
            setData(result);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Data loading failed'));
        } finally {
            setLoading(false);
        }
    }, [fetchFn, quality]);

    return {
        data,
        loading,
        error,
        quality,
        setQuality,
        loadData,
        isSlowConnection
    };
}

// ============================================================================
// 6. 통합 성능 최적화 훅
// ============================================================================

/**
 * 🚀 통합 성능 최적화 훅
 */
export function usePerformanceOptimization(componentName: string) {
    const renderPerf = useRenderPerformance(componentName);
    const memoryInfo = useMemoryMonitoring();
    const networkStatus = useNetworkStatus();

    const getOptimizationReport = useCallback(() => {
        return {
            component: componentName,
            render: renderPerf.getStats(),
            memory: memoryInfo,
            network: networkStatus,
            timestamp: new Date().toISOString(),
            recommendations: generateRecommendations(renderPerf.getStats(), memoryInfo, networkStatus)
        };
    }, [componentName, renderPerf, memoryInfo, networkStatus]);

    return {
        renderPerformance: renderPerf,
        memoryInfo,
        networkStatus,
        getOptimizationReport
    };
}

/**
 * 💡 성능 개선 권장사항 생성
 */
function generateRecommendations(
    renderStats: any,
    memoryInfo: any,
    networkStatus: any
): string[] {
    const recommendations: string[] = [];

    // 렌더링 성능 권장사항
    if (renderStats && renderStats.averageTime > 16.67) {
        recommendations.push('렌더링 시간이 16.67ms를 초과합니다. React.memo나 useMemo 사용을 고려하세요.');
    }

    // 메모리 사용량 권장사항
    if (memoryInfo && memoryInfo.percentage > 80) {
        recommendations.push('메모리 사용량이 높습니다. 메모리 누수를 확인하세요.');
    }

    // 네트워크 상태 권장사항
    if (networkStatus.isSlowConnection) {
        recommendations.push('느린 네트워크가 감지되었습니다. 이미지 품질을 낮추거나 지연 로딩을 사용하세요.');
    }

    return recommendations;
}
