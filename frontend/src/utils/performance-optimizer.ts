/**
 * ⚡ 성능 최적화 유틸리티
 * 
 * 이미지 최적화, 캐싱, 번들 최적화, 성능 모니터링을 위한
 * 종합적인 성능 최적화 도구 모음
 * 
 * @author AUTOAGENTS Manager
 * @version 3.0.0
 * @created 2025-10-02
 */

import React, { ComponentType } from 'react';

// ============================================================================
// 1. 이미지 최적화
// ============================================================================

/**
 * 🖼️ 이미지 최적화 클래스
 */
export class ImageOptimizer {
    private static instance: ImageOptimizer;
    private imageCache = new Map<string, string>();
    private loadingImages = new Set<string>();

    static getInstance(): ImageOptimizer {
        if (!ImageOptimizer.instance) {
            ImageOptimizer.instance = new ImageOptimizer();
        }
        return ImageOptimizer.instance;
    }

    /**
     * WebP 지원 여부 확인
     */
    static supportsWebP(): Promise<boolean> {
        return new Promise((resolve) => {
            const webP = new Image();
            webP.onload = webP.onerror = () => {
                resolve(webP.height === 2);
            };
            webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
        });
    }

    /**
     * 이미지 URL 최적화
     */
    async optimizeImageUrl(
        originalUrl: string,
        options: {
            width?: number;
            height?: number;
            quality?: number;
            format?: 'webp' | 'jpeg' | 'png' | 'auto';
            lazy?: boolean;
        } = {}
    ): Promise<string> {
        const {
            width,
            height,
            quality = 80,
            format = 'auto',
            lazy = true
        } = options;

        // 캐시 확인
        const cacheKey = `${originalUrl}_${JSON.stringify(options)}`;
        if (this.imageCache.has(cacheKey)) {
            return this.imageCache.get(cacheKey)!;
        }

        let optimizedUrl = originalUrl;

        // WebP 지원 확인 및 포맷 결정
        if (format === 'auto') {
            const supportsWebP = await ImageOptimizer.supportsWebP();
            if (supportsWebP) {
                optimizedUrl = this.convertToWebP(originalUrl);
            }
        }

        // 크기 조정 파라미터 추가
        if (width || height) {
            optimizedUrl = this.addResizeParams(optimizedUrl, width, height);
        }

        // 품질 파라미터 추가
        if (quality < 100) {
            optimizedUrl = this.addQualityParam(optimizedUrl, quality);
        }

        // 캐시에 저장
        this.imageCache.set(cacheKey, optimizedUrl);

        return optimizedUrl;
    }

    /**
     * 지연 로딩 이미지 생성
     */
    createLazyImage(
        src: string,
        options: {
            placeholder?: string;
            className?: string;
            alt?: string;
            onLoad?: () => void;
            onError?: () => void;
        } = {}
    ): HTMLImageElement {
        const {
            placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PC9zdmc+',
            className = '',
            alt = '',
            onLoad,
            onError
        } = options;

        const img = new Image();
        img.className = className;
        img.alt = alt;
        img.src = placeholder;
        img.dataset.src = src;
        img.loading = 'lazy';

        // Intersection Observer로 지연 로딩 구현
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const lazyImg = entry.target as HTMLImageElement;
                        lazyImg.src = lazyImg.dataset.src!;
                        lazyImg.onload = () => {
                            lazyImg.classList.add('loaded');
                            onLoad?.();
                        };
                        lazyImg.onerror = () => {
                            lazyImg.classList.add('error');
                            onError?.();
                        };
                        observer.unobserve(lazyImg);
                    }
                });
            });

            observer.observe(img);
        } else {
            // Fallback for older browsers
            img.src = src;
        }

        return img;
    }

    /**
     * 이미지 프리로딩
     */
    async preloadImages(urls: string[]): Promise<void> {
        const promises = urls.map(url => this.preloadImage(url));
        await Promise.allSettled(promises);
    }

    private async preloadImage(url: string): Promise<void> {
        if (this.loadingImages.has(url)) return;

        this.loadingImages.add(url);

        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.loadingImages.delete(url);
                resolve();
            };
            img.onerror = () => {
                this.loadingImages.delete(url);
                reject(new Error(`Failed to load image: ${url}`));
            };
            img.src = url;
        });
    }

    private convertToWebP(url: string): string {
        // 실제 구현에서는 이미지 서버 API를 사용
        return url.replace(/\.(jpg|jpeg|png)$/i, '.webp');
    }

    private addResizeParams(url: string, width?: number, height?: number): string {
        const separator = url.includes('?') ? '&' : '?';
        const params = [];

        if (width) params.push(`w=${width}`);
        if (height) params.push(`h=${height}`);

        return params.length > 0 ? `${url}${separator}${params.join('&')}` : url;
    }

    private addQualityParam(url: string, quality: number): string {
        const separator = url.includes('?') ? '&' : '?';
        return `${url}${separator}q=${quality}`;
    }
}

// ============================================================================
// 2. 캐싱 시스템
// ============================================================================

/**
 * 💾 고급 캐싱 시스템
 */
export class AdvancedCache {
    private cache = new Map<string, any>();
    private timestamps = new Map<string, number>();
    private accessCount = new Map<string, number>();
    private maxSize: number;
    private defaultTTL: number;

    constructor(maxSize = 100, defaultTTL = 5 * 60 * 1000) {
        this.maxSize = maxSize;
        this.defaultTTL = defaultTTL;
    }

    /**
     * 데이터 저장
     */
    set(key: string, value: any, ttl = this.defaultTTL): void {
        // 캐시 크기 제한 확인
        if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
            this.evictLRU();
        }

        this.cache.set(key, value);
        this.timestamps.set(key, Date.now() + ttl);
        this.accessCount.set(key, 0);
    }

    /**
     * 데이터 조회
     */
    get(key: string): any | null {
        if (!this.cache.has(key)) {
            return null;
        }

        // TTL 확인
        const expiry = this.timestamps.get(key)!;
        if (Date.now() > expiry) {
            this.delete(key);
            return null;
        }

        // 접근 횟수 증가
        const count = this.accessCount.get(key) || 0;
        this.accessCount.set(key, count + 1);

        return this.cache.get(key);
    }

    /**
     * 데이터 삭제
     */
    delete(key: string): boolean {
        this.timestamps.delete(key);
        this.accessCount.delete(key);
        return this.cache.delete(key);
    }

    /**
     * 캐시 정리
     */
    clear(): void {
        this.cache.clear();
        this.timestamps.clear();
        this.accessCount.clear();
    }

    /**
     * LRU 방식으로 항목 제거
     */
    private evictLRU(): void {
        let lruKey = '';
        let minAccess = Infinity;

        for (const [key, count] of this.accessCount) {
            if (count < minAccess) {
                minAccess = count;
                lruKey = key;
            }
        }

        if (lruKey) {
            this.delete(lruKey);
        }
    }

    /**
     * 캐시 통계
     */
    getStats(): {
        size: number;
        hitRate: number;
        memoryUsage: number;
    } {
        const totalAccess = Array.from(this.accessCount.values())
            .reduce((sum, count) => sum + count, 0);

        return {
            size: this.cache.size,
            hitRate: totalAccess > 0 ? (totalAccess / (totalAccess + this.cache.size)) : 0,
            memoryUsage: this.estimateMemoryUsage()
        };
    }

    private estimateMemoryUsage(): number {
        // 간단한 메모리 사용량 추정
        let size = 0;
        for (const value of this.cache.values()) {
            size += JSON.stringify(value).length * 2; // UTF-16 기준
        }
        return size;
    }
}

// ============================================================================
// 3. 번들 최적화
// ============================================================================

/**
 * 📦 번들 최적화 유틸리티
 */
export class BundleOptimizer {
    /**
     * 동적 임포트 래퍼
     */
    static async dynamicImport<T>(
        importFn: () => Promise<T>,
        fallback?: T,
        timeout = 10000
    ): Promise<T> {
        try {
            const timeoutPromise = new Promise<never>((_, reject) => {
                setTimeout(() => reject(new Error('Import timeout')), timeout);
            });

            const result = await Promise.race([importFn(), timeoutPromise]);
            return result;
        } catch (error) {
            console.error('Dynamic import failed:', error);
            if (fallback) {
                return fallback;
            }
            throw error;
        }
    }

    /**
     * 컴포넌트 지연 로딩
     */
    static lazyComponent<T extends React.ComponentType<any>>(
        importFn: () => Promise<{ default: T }>,
        fallback?: React.ComponentType
    ) {
        return React.lazy(async () => {
            try {
                return await this.dynamicImport(importFn);
            } catch (error) {
                console.error('Lazy component loading failed:', error);
                // 에러 시 기본 컴포넌트 반환
                return {
                    default: (fallback || (() => React.createElement('div', null, 'Loading failed'))) as T
                };
            }
        });
    }

    /**
     * 리소스 프리로딩
     */
    static preloadResource(href: string, as: string): void {
        if (typeof document === 'undefined') return;

        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = href;
        link.as = as;
        document.head.appendChild(link);
    }

    /**
     * 중요 CSS 인라인화
     */
    static inlineCriticalCSS(css: string): void {
        if (typeof document === 'undefined') return;

        const style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);
    }
}

// ============================================================================
// 4. 성능 모니터링
// ============================================================================

/**
 * 📊 성능 모니터링 시스템
 */
export class PerformanceMonitor {
    private static instance: PerformanceMonitor;
    private metrics: Map<string, number[]> = new Map();
    private observers: PerformanceObserver[] = [];

    static getInstance(): PerformanceMonitor {
        if (!PerformanceMonitor.instance) {
            PerformanceMonitor.instance = new PerformanceMonitor();
        }
        return PerformanceMonitor.instance;
    }

    /**
     * 성능 모니터링 시작
     */
    startMonitoring(): void {
        this.monitorWebVitals();
        this.monitorResourceTiming();
        this.monitorUserTiming();
        this.monitorMemoryUsage();
    }

    /**
     * Web Vitals 모니터링
     */
    private monitorWebVitals(): void {
        // LCP (Largest Contentful Paint)
        this.observePerformance('largest-contentful-paint', (entries) => {
            entries.forEach((entry: any) => {
                this.recordMetric('LCP', entry.startTime);
            });
        });

        // FID (First Input Delay)
        this.observePerformance('first-input', (entries) => {
            entries.forEach((entry: any) => {
                this.recordMetric('FID', entry.processingStart - entry.startTime);
            });
        });

        // CLS (Cumulative Layout Shift)
        this.observePerformance('layout-shift', (entries) => {
            entries.forEach((entry: any) => {
                if (!entry.hadRecentInput) {
                    this.recordMetric('CLS', entry.value);
                }
            });
        });
    }

    /**
     * 리소스 타이밍 모니터링
     */
    private monitorResourceTiming(): void {
        this.observePerformance('resource', (entries) => {
            entries.forEach((entry: any) => {
                const duration = entry.responseEnd - entry.startTime;
                this.recordMetric(`Resource_${entry.initiatorType}`, duration);
            });
        });
    }

    /**
     * 사용자 타이밍 모니터링
     */
    private monitorUserTiming(): void {
        this.observePerformance('measure', (entries) => {
            entries.forEach((entry: any) => {
                this.recordMetric(`UserTiming_${entry.name}`, entry.duration);
            });
        });
    }

    /**
     * 메모리 사용량 모니터링
     */
    private monitorMemoryUsage(): void {
        if ('memory' in performance) {
            setInterval(() => {
                const memory = (performance as any).memory;
                this.recordMetric('MemoryUsed', memory.usedJSHeapSize);
                this.recordMetric('MemoryTotal', memory.totalJSHeapSize);
                this.recordMetric('MemoryLimit', memory.jsHeapSizeLimit);
            }, 5000);
        }
    }

    /**
     * Performance Observer 등록
     */
    private observePerformance(
        entryType: string,
        callback: (entries: PerformanceEntryList) => void
    ): void {
        try {
            const observer = new PerformanceObserver((list) => {
                callback(list.getEntries());
            });

            observer.observe({ entryTypes: [entryType] });
            this.observers.push(observer);
        } catch (error) {
            console.warn(`Performance observer for ${entryType} not supported:`, error);
        }
    }

    /**
     * 메트릭 기록
     */
    recordMetric(name: string, value: number): void {
        if (!this.metrics.has(name)) {
            this.metrics.set(name, []);
        }

        const values = this.metrics.get(name)!;
        values.push(value);

        // 최대 100개 값만 유지
        if (values.length > 100) {
            values.shift();
        }
    }

    /**
     * 메트릭 조회
     */
    getMetrics(): Record<string, {
        current: number;
        average: number;
        min: number;
        max: number;
        count: number;
    }> {
        const result: any = {};

        for (const [name, values] of this.metrics) {
            if (values.length > 0) {
                result[name] = {
                    current: values[values.length - 1],
                    average: values.reduce((sum, val) => sum + val, 0) / values.length,
                    min: Math.min(...values),
                    max: Math.max(...values),
                    count: values.length
                };
            }
        }

        return result;
    }

    /**
     * 성능 보고서 생성
     */
    generateReport(): {
        webVitals: any;
        resources: any;
        memory: any;
        recommendations: string[];
    } {
        const metrics = this.getMetrics();

        return {
            webVitals: {
                LCP: metrics.LCP,
                FID: metrics.FID,
                CLS: metrics.CLS
            },
            resources: Object.keys(metrics)
                .filter(key => key.startsWith('Resource_'))
                .reduce((acc, key) => {
                    acc[key] = metrics[key];
                    return acc;
                }, {} as any),
            memory: {
                used: metrics.MemoryUsed,
                total: metrics.MemoryTotal,
                limit: metrics.MemoryLimit
            },
            recommendations: this.generateRecommendations(metrics)
        };
    }

    /**
     * 성능 개선 권장사항 생성
     */
    private generateRecommendations(metrics: any): string[] {
        const recommendations: string[] = [];

        // LCP 권장사항
        if (metrics.LCP?.average > 2500) {
            recommendations.push('LCP가 느립니다. 이미지 최적화나 서버 응답 시간 개선을 고려하세요.');
        }

        // FID 권장사항
        if (metrics.FID?.average > 100) {
            recommendations.push('FID가 높습니다. JavaScript 실행 시간을 줄이거나 코드 스플리팅을 고려하세요.');
        }

        // CLS 권장사항
        if (metrics.CLS?.average > 0.1) {
            recommendations.push('CLS가 높습니다. 이미지나 광고의 크기를 미리 지정하세요.');
        }

        // 메모리 권장사항
        if (metrics.MemoryUsed?.current > metrics.MemoryLimit?.current * 0.8) {
            recommendations.push('메모리 사용량이 높습니다. 메모리 누수를 확인하세요.');
        }

        return recommendations;
    }

    /**
     * 모니터링 중지
     */
    stopMonitoring(): void {
        this.observers.forEach(observer => observer.disconnect());
        this.observers = [];
        this.metrics.clear();
    }
}

// ============================================================================
// 5. 통합 성능 최적화 매니저
// ============================================================================

/**
 * 🚀 통합 성능 최적화 매니저
 */
export class PerformanceOptimizationManager {
    private imageOptimizer: ImageOptimizer;
    private cache: AdvancedCache;
    private monitor: PerformanceMonitor;

    constructor() {
        this.imageOptimizer = ImageOptimizer.getInstance();
        this.cache = new AdvancedCache();
        this.monitor = PerformanceMonitor.getInstance();
    }

    /**
     * 최적화 시스템 초기화
     */
    initialize(): void {
        console.log('🚀 Performance Optimization Manager 초기화 중...');

        // 성능 모니터링 시작
        this.monitor.startMonitoring();

        // Service Worker 등록
        this.registerServiceWorker();

        // 중요 리소스 프리로딩
        this.preloadCriticalResources();

        console.log('✅ Performance Optimization Manager 초기화 완료');
    }

    /**
     * Service Worker 등록
     */
    private async registerServiceWorker(): Promise<void> {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('Service Worker 등록 성공:', registration);
            } catch (error) {
                console.error('Service Worker 등록 실패:', error);
            }
        }
    }

    /**
     * 중요 리소스 프리로딩
     */
    private preloadCriticalResources(): void {
        // 중요 CSS 프리로딩
        BundleOptimizer.preloadResource('/css/critical.css', 'style');

        // 중요 JavaScript 프리로딩
        BundleOptimizer.preloadResource('/js/main.js', 'script');

        // 중요 이미지 프리로딩
        const criticalImages = [
            '/images/logo.webp',
            '/images/hero-bg.webp'
        ];
        this.imageOptimizer.preloadImages(criticalImages);
    }

    /**
     * 성능 보고서 조회
     */
    getPerformanceReport(): any {
        return {
            monitor: this.monitor.generateReport(),
            cache: this.cache.getStats(),
            timestamp: new Date().toISOString()
        };
    }

    /**
     * 최적화 시스템 정리
     */
    cleanup(): void {
        this.monitor.stopMonitoring();
        this.cache.clear();
    }
}

// 전역 인스턴스 생성
export const performanceManager = new PerformanceOptimizationManager();

// 자동 초기화 (브라우저 환경에서만)
if (typeof window !== 'undefined') {
    // DOM 로드 완료 후 초기화
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            performanceManager.initialize();
        });
    } else {
        performanceManager.initialize();
    }
}
