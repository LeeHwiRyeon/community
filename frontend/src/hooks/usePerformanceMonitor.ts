import { useEffect, useRef, useCallback } from 'react';

interface PerformanceMetrics {
    renderTime: number;
    componentMountTime: number;
    memoryUsage?: number;
    userTiming?: PerformanceEntry[];
}

interface PerformanceConfig {
    enableMemoryMonitoring?: boolean;
    enableUserTiming?: boolean;
    logToConsole?: boolean;
    sendToAnalytics?: boolean;
    threshold?: number; // Log if render time exceeds threshold (ms)
}

/**
 * Performance monitoring hook
 * Tracks component render times, memory usage, and user timing
 */
export const usePerformanceMonitor = (
    componentName: string,
    config: PerformanceConfig = {}
) => {
    const {
        enableMemoryMonitoring = false,
        enableUserTiming = false,
        logToConsole = true,
        sendToAnalytics = false,
        threshold = 16 // 16ms = 60fps
    } = config;

    const mountTimeRef = useRef<number>(0);
    const renderStartRef = useRef<number>(0);
    const renderCountRef = useRef<number>(0);

    // Start timing a render
    const startRender = useCallback(() => {
        renderStartRef.current = performance.now();
    }, []);

    // End timing a render
    const endRender = useCallback(() => {
        const renderTime = performance.now() - renderStartRef.current;
        renderCountRef.current += 1;

        const metrics: PerformanceMetrics = {
            renderTime,
            componentMountTime: mountTimeRef.current ? performance.now() - mountTimeRef.current : 0
        };

        // Memory monitoring
        if (enableMemoryMonitoring && 'memory' in performance) {
            const memory = (performance as any).memory;
            metrics.memoryUsage = memory.usedJSHeapSize;
        }

        // User timing
        if (enableUserTiming) {
            metrics.userTiming = performance.getEntriesByType('measure');
        }

        // Log to console if enabled and exceeds threshold
        if (logToConsole && renderTime > threshold) {
            console.warn(`[Performance] ${componentName} render took ${renderTime.toFixed(2)}ms`, {
                renderTime,
                renderCount: renderCountRef.current,
                memoryUsage: metrics.memoryUsage,
                componentName
            });
        }

        // Send to analytics
        if (sendToAnalytics) {
            // In a real app, you would send this to your analytics service
            // analytics.track('component_performance', {
            //   componentName,
            //   renderTime,
            //   renderCount: renderCountRef.current,
            //   memoryUsage: metrics.memoryUsage
            // });
        }

        return metrics;
    }, [componentName, enableMemoryMonitoring, enableUserTiming, logToConsole, sendToAnalytics, threshold]);

    // Mark component mount time
    useEffect(() => {
        mountTimeRef.current = performance.now();

        return () => {
            // Component unmount
            if (logToConsole) {
                console.log(`[Performance] ${componentName} unmounted after ${renderCountRef.current} renders`);
            }
        };
    }, [componentName, logToConsole]);

    return {
        startRender,
        endRender,
        renderCount: renderCountRef.current
    };
};

/**
 * Hook for measuring async operations
 */
export const useAsyncPerformanceMonitor = (
    operationName: string,
    config: PerformanceConfig = {}
) => {
    const {
        logToConsole = true,
        sendToAnalytics = false,
        threshold = 100 // 100ms threshold for async operations
    } = config;

    const measureAsync = useCallback(async <T>(
        operation: () => Promise<T>
    ): Promise<T> => {
        const startTime = performance.now();

        try {
            const result = await operation();
            const duration = performance.now() - startTime;

            if (logToConsole && duration > threshold) {
                console.warn(`[Performance] ${operationName} took ${duration.toFixed(2)}ms`);
            }

            if (sendToAnalytics) {
                // analytics.track('async_performance', {
                //   operationName,
                //   duration,
                //   success: true
                // });
            }

            return result;
        } catch (error) {
            const duration = performance.now() - startTime;

            if (logToConsole) {
                console.error(`[Performance] ${operationName} failed after ${duration.toFixed(2)}ms`, error);
            }

            if (sendToAnalytics) {
                // analytics.track('async_performance', {
                //   operationName,
                //   duration,
                //   success: false,
                //   error: error.message
                // });
            }

            throw error;
        }
    }, [operationName, logToConsole, sendToAnalytics, threshold]);

    return { measureAsync };
};

/**
 * Hook for measuring API calls
 */
export const useApiPerformanceMonitor = (
    endpoint: string,
    config: PerformanceConfig = {}
) => {
    const { measureAsync } = useAsyncPerformanceMonitor(`API: ${endpoint}`, config);

    const measureApiCall = useCallback(async <T>(
        apiCall: () => Promise<T>
    ): Promise<T> => {
        return measureAsync(apiCall);
    }, [measureAsync]);

    return { measureApiCall };
};

/**
 * Hook for measuring user interactions
 */
export const useInteractionPerformanceMonitor = (
    interactionName: string,
    config: PerformanceConfig = {}
) => {
    const {
        logToConsole = true,
        sendToAnalytics = false,
        threshold = 50 // 50ms threshold for interactions
    } = config;

    const measureInteraction = useCallback(async <T>(
        interaction: () => T | Promise<T>
    ): Promise<T> => {
        const startTime = performance.now();

        try {
            const result = await interaction();
            const duration = performance.now() - startTime;

            if (logToConsole && duration > threshold) {
                console.warn(`[Performance] ${interactionName} took ${duration.toFixed(2)}ms`);
            }

            if (sendToAnalytics) {
                // analytics.track('interaction_performance', {
                //   interactionName,
                //   duration,
                //   success: true
                // });
            }

            return result;
        } catch (error) {
            const duration = performance.now() - startTime;

            if (logToConsole) {
                console.error(`[Performance] ${interactionName} failed after ${duration.toFixed(2)}ms`, error);
            }

            if (sendToAnalytics) {
                // analytics.track('interaction_performance', {
                //   interactionName,
                //   duration,
                //   success: false,
                //   error: error.message
                // });
            }

            throw error;
        }
    }, [interactionName, logToConsole, sendToAnalytics, threshold]);

    return { measureInteraction };
};

/**
 * Hook for measuring bundle size and loading performance
 */
export const useBundlePerformanceMonitor = () => {
    const measureBundleSize = useCallback(() => {
        if ('performance' in window && 'getEntriesByType' in performance) {
            const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
            const scripts = resources.filter(resource =>
                resource.name.includes('.js') &&
                !resource.name.includes('node_modules')
            );

            const totalSize = scripts.reduce((total, script) => {
                return total + (script.transferSize || 0);
            }, 0);

            const loadTime = Math.max(...scripts.map(script => script.loadEventEnd - script.startTime));

            console.log('[Performance] Bundle Analysis:', {
                totalScripts: scripts.length,
                totalSize: `${(totalSize / 1024).toFixed(2)} KB`,
                averageLoadTime: `${(loadTime / scripts.length).toFixed(2)} ms`,
                scripts: scripts.map(script => ({
                    name: script.name.split('/').pop(),
                    size: `${((script.transferSize || 0) / 1024).toFixed(2)} KB`,
                    loadTime: `${(script.loadEventEnd - script.startTime).toFixed(2)} ms`
                }))
            });

            return {
                totalScripts: scripts.length,
                totalSize,
                averageLoadTime: loadTime / scripts.length,
                scripts
            };
        }
        return null;
    }, []);

    useEffect(() => {
        // Measure bundle size after component mount
        const timer = setTimeout(measureBundleSize, 1000);
        return () => clearTimeout(timer);
    }, [measureBundleSize]);

    return { measureBundleSize };
};

export default usePerformanceMonitor;
