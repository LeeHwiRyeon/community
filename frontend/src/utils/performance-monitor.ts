/**
 * ⚡ 성능 모니터링 유틸리티
 * 
 * Web Vitals, 실시간 메트릭, 성능 분석을 위한
 * 종합적인 성능 모니터링 도구
 * 
 * @author AUTOAGENTS Manager
 * @version 3.0.0
 * @created 2025-10-02
 */

// ============================================================================
// Web Vitals 메트릭 수집
// ============================================================================

interface WebVitalsMetrics {
    // Core Web Vitals
    lcp?: number; // Largest Contentful Paint
    fid?: number; // First Input Delay
    cls?: number; // Cumulative Layout Shift

    // Additional Metrics
    fcp?: number; // First Contentful Paint
    ttfb?: number; // Time to First Byte
    tti?: number; // Time to Interactive

    // Custom Metrics
    loadTime?: number; // Page Load Time
    renderTime?: number; // Render Time
    memoryUsage?: number; // Memory Usage
}

class PerformanceMonitor {
    private metrics: WebVitalsMetrics = {};
    private observers: PerformanceObserver[] = [];
    private isMonitoring = false;

    constructor() {
        this.initWebVitals();
        this.initCustomMetrics();
    }

    // Web Vitals 초기화
    private initWebVitals() {
        // LCP (Largest Contentful Paint)
        this.observeMetric('largest-contentful-paint', (entry) => {
            this.metrics.lcp = entry.startTime;
            this.reportMetric('LCP', entry.startTime);
        });

        // FID (First Input Delay)
        this.observeMetric('first-input', (entry) => {
            this.metrics.fid = entry.processingStart - entry.startTime;
            this.reportMetric('FID', this.metrics.fid);
        });

        // CLS (Cumulative Layout Shift)
        this.observeMetric('layout-shift', (entry) => {
            if (!entry.hadRecentInput) {
                this.metrics.cls = (this.metrics.cls || 0) + entry.value;
                this.reportMetric('CLS', this.metrics.cls || 0);
            }
        });

        // FCP (First Contentful Paint)
        this.observeMetric('paint', (entry) => {
            if (entry.name === 'first-contentful-paint') {
                this.metrics.fcp = entry.startTime;
                this.reportMetric('FCP', entry.startTime);
            }
        });
    }

    // 커스텀 메트릭 초기화
    private initCustomMetrics() {
        // 페이지 로드 시간
        window.addEventListener('load', () => {
            const loadTime = performance.now();
            this.metrics.loadTime = loadTime;
            this.reportMetric('Load Time', loadTime);
        });

        // 렌더링 시간 측정
        this.measureRenderTime();

        // 메모리 사용량 모니터링
        this.monitorMemoryUsage();
    }

    // 성능 관찰자 등록
    private observeMetric(type: string, callback: (entry: any) => void) {
        if ('PerformanceObserver' in window) {
            try {
                const observer = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        callback(entry);
                    }
                });

                observer.observe({ type, buffered: true });
                this.observers.push(observer);
            } catch (error) {
                console.warn(`PerformanceObserver for ${type} not supported:`, error);
            }
        }
    }

    // 렌더링 시간 측정
    private measureRenderTime() {
        const startTime = performance.now();

        requestAnimationFrame(() => {
            const renderTime = performance.now() - startTime;
            this.metrics.renderTime = renderTime;
            this.reportMetric('Render Time', renderTime);
        });
    }

    // 메모리 사용량 모니터링
    private monitorMemoryUsage() {
        if ('memory' in performance) {
            const memory = (performance as any).memory;
            this.metrics.memoryUsage = memory.usedJSHeapSize / 1024 / 1024; // MB
            this.reportMetric('Memory Usage', this.metrics.memoryUsage, 'MB');
        }
    }

    // 메트릭 리포트
    private reportMetric(name: string, value: number, unit = 'ms') {
        console.log(`📊 ${name}: ${value.toFixed(2)}${unit}`);

        // 성능 임계값 체크
        this.checkPerformanceThresholds(name, value);

        // 실시간 알림
        this.sendRealTimeNotification(name, value, unit);
    }

    // 성능 임계값 체크
    private checkPerformanceThresholds(name: string, value: number) {
        const thresholds = {
            'LCP': { good: 2500, poor: 4000 },
            'FID': { good: 100, poor: 300 },
            'CLS': { good: 0.1, poor: 0.25 },
            'FCP': { good: 1800, poor: 3000 },
            'Load Time': { good: 2000, poor: 4000 },
            'Render Time': { good: 100, poor: 200 }
        };

        const threshold = thresholds[name as keyof typeof thresholds];
        if (threshold) {
            let status = 'good';
            if (value > threshold.poor) {
                status = 'poor';
            } else if (value > threshold.good) {
                status = 'needs-improvement';
            }

            console.log(`🎯 ${name} Status: ${status}`);
        }
    }

    // 실시간 알림
    private sendRealTimeNotification(name: string, value: number, unit: string) {
        // WebSocket을 통한 실시간 알림 (백엔드와 연동)
        if (window.WebSocket) {
            const ws = new WebSocket('ws://localhost:5002/ws/performance');
            ws.onopen = () => {
                ws.send(JSON.stringify({
                    type: 'performance-metric',
                    name,
                    value,
                    unit,
                    timestamp: Date.now()
                }));
                ws.close();
            };
        }
    }

    // 성능 리포트 생성
    public generateReport(): WebVitalsMetrics & { score: number } {
        const score = this.calculatePerformanceScore();
        return {
            ...this.metrics,
            score
        };
    }

    // 성능 점수 계산
    private calculatePerformanceScore(): number {
        let score = 100;

        // LCP 점수 (40% 가중치)
        if (this.metrics.lcp) {
            if (this.metrics.lcp > 4000) score -= 40;
            else if (this.metrics.lcp > 2500) score -= 20;
        }

        // FID 점수 (30% 가중치)
        if (this.metrics.fid) {
            if (this.metrics.fid > 300) score -= 30;
            else if (this.metrics.fid > 100) score -= 15;
        }

        // CLS 점수 (30% 가중치)
        if (this.metrics.cls) {
            if (this.metrics.cls > 0.25) score -= 30;
            else if (this.metrics.cls > 0.1) score -= 15;
        }

        return Math.max(0, score);
    }

    // 모니터링 시작
    public startMonitoring() {
        if (!this.isMonitoring) {
            this.isMonitoring = true;
            console.log('🚀 성능 모니터링 시작');
        }
    }

    // 모니터링 중지
    public stopMonitoring() {
        this.isMonitoring = false;
        this.observers.forEach(observer => observer.disconnect());
        this.observers = [];
        console.log('⏹️ 성능 모니터링 중지');
    }

    // 실시간 성능 대시보드 데이터
    public getDashboardData() {
        return {
            metrics: this.metrics,
            score: this.calculatePerformanceScore(),
            timestamp: Date.now(),
            isMonitoring: this.isMonitoring
        };
    }
}

// ============================================================================
// 이미지 최적화 유틸리티
// ============================================================================

class ImageOptimizer {
    private static instance: ImageOptimizer;
    private imageCache = new Map<string, string>();

    static getInstance(): ImageOptimizer {
        if (!ImageOptimizer.instance) {
            ImageOptimizer.instance = new ImageOptimizer();
        }
        return ImageOptimizer.instance;
    }

    // WebP 지원 확인
    private supportsWebP(): boolean {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    }

    // 이미지 최적화
    public optimizeImage(src: string, options: {
        width?: number;
        height?: number;
        quality?: number;
        format?: 'webp' | 'jpeg' | 'png';
    } = {}): string {
        const cacheKey = `${src}-${JSON.stringify(options)}`;

        if (this.imageCache.has(cacheKey)) {
            return this.imageCache.get(cacheKey)!;
        }

        const { width, height, quality = 0.8, format = 'webp' } = options;

        // WebP 지원 확인
        if (format === 'webp' && !this.supportsWebP()) {
            return src; // WebP 미지원 시 원본 반환
        }

        // 이미지 최적화 URL 생성
        const optimizedSrc = this.generateOptimizedUrl(src, { width, height, quality, format });

        this.imageCache.set(cacheKey, optimizedSrc);
        return optimizedSrc;
    }

    // 최적화된 URL 생성
    private generateOptimizedUrl(src: string, options: any): string {
        // 실제 구현에서는 이미지 CDN이나 서버 사이드 최적화 사용
        const params = new URLSearchParams();

        if (options.width) params.append('w', options.width.toString());
        if (options.height) params.append('h', options.height.toString());
        if (options.quality) params.append('q', options.quality.toString());
        if (options.format) params.append('f', options.format);

        return `${src}?${params.toString()}`;
    }

    // 지연 로딩 이미지 생성
    public createLazyImage(src: string, options: any = {}): HTMLImageElement {
        const img = new Image();

        // Intersection Observer를 사용한 지연 로딩
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    img.src = this.optimizeImage(src, options);
                    observer.unobserve(img);
                }
            });
        });

        observer.observe(img);
        return img;
    }
}

// ============================================================================
// 캐싱 전략 유틸리티
// ============================================================================

class CacheManager {
    private static instance: CacheManager;
    private memoryCache = new Map<string, { data: any; timestamp: number; ttl: number }>();

    static getInstance(): CacheManager {
        if (!CacheManager.instance) {
            CacheManager.instance = new CacheManager();
        }
        return CacheManager.instance;
    }

    // 메모리 캐시 설정
    public set(key: string, data: any, ttl: number = 300000): void { // 기본 5분
        this.memoryCache.set(key, {
            data,
            timestamp: Date.now(),
            ttl
        });
    }

    // 메모리 캐시 조회
    public get(key: string): any | null {
        const cached = this.memoryCache.get(key);

        if (!cached) return null;

        // TTL 체크
        if (Date.now() - cached.timestamp > cached.ttl) {
            this.memoryCache.delete(key);
            return null;
        }

        return cached.data;
    }

    // 캐시 무효화
    public invalidate(key: string): void {
        this.memoryCache.delete(key);
    }

    // 캐시 클리어
    public clear(): void {
        this.memoryCache.clear();
    }

    // 캐시 통계
    public getStats() {
        return {
            size: this.memoryCache.size,
            keys: Array.from(this.memoryCache.keys())
        };
    }
}

// ============================================================================
// 번들 분석 유틸리티
// ============================================================================

class BundleAnalyzer {
    // 번들 크기 분석
    public analyzeBundleSize(): void {
        if (process.env.NODE_ENV === 'development') {
            console.log('📦 번들 크기 분석 (개발 모드에서는 제한적)');
            return;
        }

        // 프로덕션에서만 실행
        const scripts = document.querySelectorAll('script[src]');
        const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');

        let totalSize = 0;

        scripts.forEach(script => {
            const src = script.getAttribute('src');
            if (src) {
                console.log(`📄 Script: ${src}`);
            }
        });

        stylesheets.forEach(link => {
            const href = link.getAttribute('href');
            if (href) {
                console.log(`🎨 Stylesheet: ${href}`);
            }
        });
    }

    // 리소스 로딩 시간 분석
    public analyzeResourceTiming(): void {
        if ('performance' in window && 'getEntriesByType' in performance) {
            const resources = performance.getEntriesByType('resource');

            resources.forEach(resource => {
                const timing = resource as PerformanceResourceTiming;
                console.log(`⏱️ ${timing.name}: ${timing.duration.toFixed(2)}ms`);
            });
        }
    }
}

// ============================================================================
// 내보내기
// ============================================================================

export const performanceMonitor = new PerformanceMonitor();
export const imageOptimizer = ImageOptimizer.getInstance();
export const cacheManager = CacheManager.getInstance();
export const bundleAnalyzer = new BundleAnalyzer();

// 자동 모니터링 시작
performanceMonitor.startMonitoring();

export default {
    performanceMonitor,
    imageOptimizer,
    cacheManager,
    bundleAnalyzer
};
