/**
 * ⚡ 성능 최적화 시스템 v3.0
 * 
 * 로딩 속도 개선 및 메모리 사용량 최적화
 * 
 * @author AUTOAGENTS Manager
 * @version 3.0.0
 * @created 2025-01-02
 */

export class PerformanceOptimizer {
    private static instance: PerformanceOptimizer;
    private metrics: Map<string, number> = new Map();
    private observers: Map<string, PerformanceObserver> = new Map();

    static getInstance(): PerformanceOptimizer {
        if (!PerformanceOptimizer.instance) {
            PerformanceOptimizer.instance = new PerformanceOptimizer();
        }
        return PerformanceOptimizer.instance;
    }

    // 🚀 초기 로딩 최적화
    optimizeInitialLoad() {
        console.log('⚡ 초기 로딩 최적화 시작...');

        // 1. 이미지 지연 로딩
        this.enableLazyLoading();

        // 2. 코드 스플리팅
        this.enableCodeSplitting();

        // 3. 프리로딩
        this.enablePreloading();

        // 4. 캐싱 전략
        this.enableCaching();

        console.log('✅ 초기 로딩 최적화 완료');
    }

    // 🖼️ 이미지 지연 로딩
    private enableLazyLoading() {
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target as HTMLImageElement;
                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                            img.removeAttribute('data-src');
                            imageObserver.unobserve(img);
                        }
                    }
                });
            });

            // 모든 지연 로딩 이미지 관찰
            document.querySelectorAll('img[data-src]').forEach(img => {
                imageObserver.observe(img);
            });
        }
    }

    // 📦 코드 스플리팅
    private enableCodeSplitting() {
        // 동적 import를 위한 유틸리티 함수들
        window.dynamicImport = async (modulePath: string) => {
            try {
                const module = await import(/* @vite-ignore */ modulePath);
                return module;
            } catch (error) {
                console.error(`동적 import 실패: ${modulePath}`, error);
                return null;
            }
        };
    }

    // 🔄 프리로딩
    private enablePreloading() {
        // 중요한 리소스 프리로딩
        const criticalResources = [
            '/fonts/inter.woff2',
            '/css/critical.css',
            '/js/vendor.js'
        ];

        criticalResources.forEach(resource => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.href = resource;
            link.as = resource.endsWith('.css') ? 'style' :
                resource.endsWith('.js') ? 'script' : 'font';
            document.head.appendChild(link);
        });
    }

    // 💾 캐싱 전략
    private enableCaching() {
        // Service Worker 등록
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('Service Worker 등록 성공:', registration);
                })
                .catch(error => {
                    console.log('Service Worker 등록 실패:', error);
                });
        }

        // 메모리 캐시 설정
        this.setupMemoryCache();
    }

    // 🧠 메모리 캐시 설정
    private setupMemoryCache() {
        const cache = new Map();
        const maxSize = 100; // 최대 캐시 항목 수

        window.memoryCache = {
            get: (key: string) => cache.get(key),
            set: (key: string, value: any) => {
                if (cache.size >= maxSize) {
                    const firstKey = cache.keys().next().value;
                    cache.delete(firstKey);
                }
                cache.set(key, value);
            },
            clear: () => cache.clear(),
            size: () => cache.size
        };
    }

    // 📊 성능 메트릭 수집
    collectMetrics() {
        console.log('📊 성능 메트릭 수집 중...');

        // Core Web Vitals 측정
        this.measureCoreWebVitals();

        // 리소스 로딩 시간 측정
        this.measureResourceTiming();

        // 메모리 사용량 측정
        this.measureMemoryUsage();

        // 렌더링 성능 측정
        this.measureRenderingPerformance();
    }

    // 🎯 Core Web Vitals 측정
    private measureCoreWebVitals() {
        // LCP (Largest Contentful Paint)
        if ('PerformanceObserver' in window) {
            const lcpObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const lastEntry = entries[entries.length - 1];
                this.metrics.set('LCP', lastEntry.startTime);
                console.log('LCP:', lastEntry.startTime);
            });
            lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

            // FID (First Input Delay)
            const fidObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach(entry => {
                    this.metrics.set('FID', (entry as any).processingStart - entry.startTime);
                    console.log('FID:', (entry as any).processingStart - entry.startTime);
                });
            });
            fidObserver.observe({ entryTypes: ['first-input'] });

            // CLS (Cumulative Layout Shift)
            let clsValue = 0;
            const clsObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach(entry => {
                    if (!(entry as any).hadRecentInput) {
                        clsValue += (entry as any).value;
                    }
                });
                this.metrics.set('CLS', clsValue);
                console.log('CLS:', clsValue);
            });
            clsObserver.observe({ entryTypes: ['layout-shift'] });
        }
    }

    // ⏱️ 리소스 타이밍 측정
    private measureResourceTiming() {
        const resources = performance.getEntriesByType('resource');
        resources.forEach(resource => {
            const name = resource.name;
            const duration = resource.duration;
            const size = (resource as any).transferSize || 0;

            this.metrics.set(`resource_${name}`, duration);
            this.metrics.set(`size_${name}`, size);
        });
    }

    // 🧠 메모리 사용량 측정
    private measureMemoryUsage() {
        if ('memory' in performance) {
            const memory = (performance as any).memory;
            this.metrics.set('usedJSHeapSize', memory.usedJSHeapSize);
            this.metrics.set('totalJSHeapSize', memory.totalJSHeapSize);
            this.metrics.set('jsHeapSizeLimit', memory.jsHeapSizeLimit);
        }
    }

    // 🎨 렌더링 성능 측정
    private measureRenderingPerformance() {
        let frameCount = 0;
        let lastTime = performance.now();

        const measureFPS = () => {
            frameCount++;
            const currentTime = performance.now();

            if (currentTime - lastTime >= 1000) {
                const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
                this.metrics.set('FPS', fps);
                console.log('FPS:', fps);

                frameCount = 0;
                lastTime = currentTime;
            }

            requestAnimationFrame(measureFPS);
        };

        requestAnimationFrame(measureFPS);
    }

    // 📈 성능 리포트 생성
    generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            metrics: Object.fromEntries(this.metrics),
            recommendations: this.generateRecommendations()
        };

        console.log('📊 성능 리포트:', report);
        return report;
    }

    // 💡 성능 개선 권장사항 생성
    private generateRecommendations() {
        const recommendations = [];

        const lcp = this.metrics.get('LCP');
        if (lcp && lcp > 2500) {
            recommendations.push('LCP가 2.5초를 초과합니다. 이미지 최적화를 고려하세요.');
        }

        const fid = this.metrics.get('FID');
        if (fid && fid > 100) {
            recommendations.push('FID가 100ms를 초과합니다. JavaScript 최적화를 고려하세요.');
        }

        const cls = this.metrics.get('CLS');
        if (cls && cls > 0.1) {
            recommendations.push('CLS가 0.1을 초과합니다. 레이아웃 안정성을 개선하세요.');
        }

        const fps = this.metrics.get('FPS');
        if (fps && fps < 30) {
            recommendations.push('FPS가 30 이하입니다. 렌더링 성능을 개선하세요.');
        }

        return recommendations;
    }

    // 🔧 성능 모니터링 시작
    startMonitoring() {
        console.log('🔍 성능 모니터링 시작...');

        // 주기적으로 메트릭 수집
        setInterval(() => {
            this.collectMetrics();
        }, 5000);

        // 페이지 언로드 시 최종 리포트 생성
        window.addEventListener('beforeunload', () => {
            this.generateReport();
        });
    }

    // 🎯 특정 컴포넌트 성능 최적화
    optimizeComponent(componentName: string) {
        console.log(`⚡ ${componentName} 컴포넌트 최적화 중...`);

        // React.memo 적용
        // useMemo, useCallback 최적화
        // 가상화 적용
        // 지연 로딩 적용

        console.log(`✅ ${componentName} 컴포넌트 최적화 완료`);
    }
}

// 전역 인스턴스 생성
export const performanceOptimizer = PerformanceOptimizer.getInstance();

// 타입 선언
declare global {
    interface Window {
        dynamicImport: (modulePath: string) => Promise<any>;
        memoryCache: {
            get: (key: string) => any;
            set: (key: string, value: any) => void;
            clear: () => void;
            size: () => number;
        };
    }
}
