// 프론트엔드 성능 최적화 유틸리티

// 디바운스 함수
export const debounce = <T extends (...args: any[]) => any>(
    func: T,
    wait: number
): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
};

// 쓰로틀 함수
export const throttle = <T extends (...args: any[]) => any>(
    func: T,
    limit: number
): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => (inThrottle = false), limit);
        }
    };
};

// 이미지 지연 로딩
export const lazyLoadImage = (img: HTMLImageElement, src: string) => {
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    img.src = src;
                    observer.unobserve(img);
                }
            });
        },
        { threshold: 0.1 }
    );
    observer.observe(img);
};

// 가상 스크롤링
export class VirtualScroll {
    private container: HTMLElement;
    private itemHeight: number;
    private visibleItems: number;
    private totalItems: number;
    private scrollTop: number = 0;
    private startIndex: number = 0;
    private endIndex: number = 0;

    constructor(
        container: HTMLElement,
        itemHeight: number,
        visibleItems: number,
        totalItems: number
    ) {
        this.container = container;
        this.itemHeight = itemHeight;
        this.visibleItems = visibleItems;
        this.totalItems = totalItems;
        this.init();
    }

    private init() {
        this.container.style.height = `${this.visibleItems * this.itemHeight}px`;
        this.container.style.overflowY = 'auto';
        this.container.addEventListener('scroll', this.handleScroll.bind(this));
        this.updateVisibleItems();
    }

    private handleScroll() {
        this.scrollTop = this.container.scrollTop;
        this.updateVisibleItems();
    }

    private updateVisibleItems() {
        this.startIndex = Math.floor(this.scrollTop / this.itemHeight);
        this.endIndex = Math.min(
            this.startIndex + this.visibleItems + 1,
            this.totalItems
        );
    }

    getVisibleRange() {
        return { start: this.startIndex, end: this.endIndex };
    }
}

// 메모이제이션
export const memoize = <T extends (...args: any[]) => any>(
    func: T,
    keyGenerator?: (...args: Parameters<T>) => string
): T => {
    const cache = new Map<string, ReturnType<T>>();

    return ((...args: Parameters<T>) => {
        const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);

        if (cache.has(key)) {
            return cache.get(key);
        }

        const result = func(...args);
        cache.set(key, result);

        // 캐시 크기 제한 (100개 항목)
        if (cache.size > 100) {
            const firstKey = cache.keys().next().value;
            cache.delete(firstKey);
        }

        return result;
    }) as T;
};

// 리소스 프리로딩
export const preloadResource = (url: string, type: 'image' | 'script' | 'style' | 'font') => {
    return new Promise((resolve, reject) => {
        let element: HTMLElement;

        switch (type) {
            case 'image':
                element = new Image();
                element.onload = () => resolve(element);
                element.onerror = reject;
                (element as HTMLImageElement).src = url;
                break;
            case 'script':
                element = document.createElement('script');
                element.onload = () => resolve(element);
                element.onerror = reject;
                (element as HTMLScriptElement).src = url;
                document.head.appendChild(element);
                break;
            case 'style':
                element = document.createElement('link');
                element.onload = () => resolve(element);
                element.onerror = reject;
                (element as HTMLLinkElement).rel = 'stylesheet';
                (element as HTMLLinkElement).href = url;
                document.head.appendChild(element);
                break;
            case 'font':
                element = document.createElement('link');
                element.onload = () => resolve(element);
                element.onerror = reject;
                (element as HTMLLinkElement).rel = 'preload';
                (element as HTMLLinkElement).as = 'font';
                (element as HTMLLinkElement).href = url;
                (element as HTMLLinkElement).crossOrigin = 'anonymous';
                document.head.appendChild(element);
                break;
        }
    });
};

// 번들 크기 분석
export const analyzeBundleSize = () => {
    if (process.env.NODE_ENV === 'development') {
        const scripts = document.querySelectorAll('script[src]');
        const styles = document.querySelectorAll('link[rel="stylesheet"]');

        console.group('Bundle Analysis');
        console.log('Scripts:', scripts.length);
        console.log('Stylesheets:', styles.length);

        scripts.forEach((script, index) => {
            const src = (script as HTMLScriptElement).src;
            console.log(`Script ${index + 1}:`, src);
        });

        styles.forEach((style, index) => {
            const href = (style as HTMLLinkElement).href;
            console.log(`Style ${index + 1}:`, href);
        });

        console.groupEnd();
    }
};

// 성능 메트릭 수집
export const collectPerformanceMetrics = () => {
    if ('performance' in window) {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        const paint = performance.getEntriesByType('paint');

        const metrics = {
            // 페이지 로드 시간
            loadTime: navigation.loadEventEnd - navigation.loadEventStart,
            // DOM 준비 시간
            domReady: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
            // 첫 번째 페인트
            firstPaint: paint.find(entry => entry.name === 'first-paint')?.startTime || 0,
            // 첫 번째 콘텐츠풀 페인트
            firstContentfulPaint: paint.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0,
            // 타임 투 인터랙티브
            timeToInteractive: navigation.domInteractive - navigation.navigationStart
        };

        console.log('Performance Metrics:', metrics);
        return metrics;
    }

    return null;
};

// 웹 바이탈 측정
export const measureWebVitals = () => {
    // LCP (Largest Contentful Paint)
    if ('PerformanceObserver' in window) {
        const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            console.log('LCP:', lastEntry.startTime);
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

        // FID (First Input Delay)
        const fidObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach((entry) => {
                console.log('FID:', entry.processingStart - entry.startTime);
            });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });

        // CLS (Cumulative Layout Shift)
        const clsObserver = new PerformanceObserver((list) => {
            let clsValue = 0;
            const entries = list.getEntries();
            entries.forEach((entry) => {
                if (!(entry as any).hadRecentInput) {
                    clsValue += (entry as any).value;
                }
            });
            console.log('CLS:', clsValue);
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
    }
};
