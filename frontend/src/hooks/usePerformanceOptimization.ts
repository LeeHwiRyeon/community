import { useEffect, useMemo, useCallback, useRef, useState } from 'react';
import { performanceOptimizer } from '../utils/PerformanceOptimizer';

/**
 * ⚡ 성능 최적화 훅
 * 
 * 컴포넌트별 성능 최적화를 위한 커스텀 훅
 * 
 * @author AUTOAGENTS Manager
 * @version 3.0.0
 * @created 2025-01-02
 */

export const usePerformanceOptimization = (componentName: string) => {
    const renderCount = useRef(0);
    const startTime = useRef(performance.now());

    // 렌더링 횟수 추적
    useEffect(() => {
        renderCount.current += 1;
        console.log(`${componentName} 렌더링 횟수: ${renderCount.current}`);
    });

    // 컴포넌트 마운트 시간 측정
    useEffect(() => {
        const mountTime = performance.now() - startTime.current;
        console.log(`${componentName} 마운트 시간: ${mountTime}ms`);

        // 성능 메트릭 기록
        performanceOptimizer.collectMetrics();
    }, [componentName]);

    return {
        renderCount: renderCount.current,
        optimize: () => performanceOptimizer.optimizeComponent(componentName)
    };
};

/**
 * 🖼️ 이미지 지연 로딩 훅
 */
export const useLazyImage = (src: string, placeholder?: string) => {
    const [imageSrc, setImageSrc] = useState(placeholder || '');
    const [isLoaded, setIsLoaded] = useState(false);
    const [isInView, setIsInView] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsInView(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.1 }
        );

        if (imgRef.current) {
            observer.observe(imgRef.current);
        }

        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (isInView && src) {
            const img = new Image();
            img.onload = () => {
                setImageSrc(src);
                setIsLoaded(true);
            };
            img.src = src;
        }
    }, [isInView, src]);

    return {
        ref: imgRef,
        src: imageSrc,
        isLoaded,
        isInView
    };
};

/**
 * 📊 가상화 훅
 */
export const useVirtualization = <T>(
    items: T[],
    itemHeight: number,
    containerHeight: number
) => {
    const [scrollTop, setScrollTop] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    const visibleItems = useMemo(() => {
        const startIndex = Math.floor(scrollTop / itemHeight);
        const endIndex = Math.min(
            startIndex + Math.ceil(containerHeight / itemHeight) + 1,
            items.length
        );

        return items.slice(startIndex, endIndex).map((item, index) => ({
            item,
            index: startIndex + index,
            top: (startIndex + index) * itemHeight
        }));
    }, [items, itemHeight, containerHeight, scrollTop]);

    const totalHeight = items.length * itemHeight;

    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        setScrollTop(e.currentTarget.scrollTop);
    }, []);

    return {
        containerRef,
        visibleItems,
        totalHeight,
        handleScroll
    };
};

/**
 * 🔄 디바운스 훅
 */
export const useDebounce = <T>(value: T, delay: number): T => {
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
};

/**
 * 🎯 쓰로틀 훅
 */
export const useThrottle = <T>(value: T, limit: number): T => {
    const [throttledValue, setThrottledValue] = useState<T>(value);
    const lastRan = useRef<number>(Date.now());

    useEffect(() => {
        const handler = setTimeout(() => {
            if (Date.now() - lastRan.current >= limit) {
                setThrottledValue(value);
                lastRan.current = Date.now();
            }
        }, limit - (Date.now() - lastRan.current));

        return () => {
            clearTimeout(handler);
        };
    }, [value, limit]);

    return throttledValue;
};

/**
 * 💾 메모이제이션 훅
 */
export const useMemoizedCallback = <T extends (...args: any[]) => any>(
    callback: T,
    deps: React.DependencyList
): T => {
    return useCallback(callback, deps);
};

/**
 * 📱 리소스 프리로딩 훅
 */
export const usePreload = (resources: string[]) => {
    const [loadedResources, setLoadedResources] = useState<Set<string>>(new Set());

    useEffect(() => {
        resources.forEach(resource => {
            if (!loadedResources.has(resource)) {
                const link = document.createElement('link');
                link.rel = 'preload';
                link.href = resource;
                link.as = resource.endsWith('.css') ? 'style' :
                    resource.endsWith('.js') ? 'script' : 'fetch';

                link.onload = () => {
                    setLoadedResources(prev => new Set(prev).add(resource));
                };

                document.head.appendChild(link);
            }
        });
    }, [resources, loadedResources]);

    return {
        isLoaded: (resource: string) => loadedResources.has(resource),
        loadedCount: loadedResources.size,
        totalCount: resources.length
    };
};

/**
 * 🎨 애니메이션 최적화 훅
 */
export const useOptimizedAnimation = () => {
    const animationRef = useRef<number>();

    const startAnimation = useCallback((callback: () => void) => {
        const animate = () => {
            callback();
            animationRef.current = requestAnimationFrame(animate);
        };
        animationRef.current = requestAnimationFrame(animate);
    }, []);

    const stopAnimation = useCallback(() => {
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
            animationRef.current = undefined;
        }
    }, []);

    useEffect(() => {
        return () => {
            stopAnimation();
        };
    }, [stopAnimation]);

    return {
        startAnimation,
        stopAnimation
    };
};

/**
 * 🔍 성능 모니터링 훅
 */
export const usePerformanceMonitoring = (componentName: string) => {
    const [metrics, setMetrics] = useState<any>({});

    useEffect(() => {
        const interval = setInterval(() => {
            const currentMetrics = performanceOptimizer.generateReport();
            setMetrics(currentMetrics);
        }, 10000); // 10초마다 업데이트

        return () => clearInterval(interval);
    }, []);

    const logPerformance = useCallback(() => {
        console.log(`${componentName} 성능 메트릭:`, metrics);
    }, [componentName, metrics]);

    return {
        metrics,
        logPerformance
    };
};