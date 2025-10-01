import { useState, useEffect, useCallback, useRef } from 'react';

interface UXEvent {
    id: string;
    type: 'click' | 'scroll' | 'hover' | 'focus' | 'blur' | 'resize' | 'load' | 'unload' | 'error';
    element: string;
    selector: string;
    timestamp: number;
    url: string;
    viewport: {
        width: number;
        height: number;
    };
    position?: {
        x: number;
        y: number;
    };
    duration?: number;
    metadata?: Record<string, any>;
}

interface UXMetrics {
    pageLoadTime: number;
    timeToInteractive: number;
    firstContentfulPaint: number;
    largestContentfulPaint: number;
    cumulativeLayoutShift: number;
    firstInputDelay: number;
    totalBlockingTime: number;
    bounceRate: number;
    averageSessionDuration: number;
    clickThroughRate: number;
    scrollDepth: number;
    errorRate: number;
}

interface HeatmapData {
    x: number;
    y: number;
    value: number;
    element: string;
    type: 'click' | 'scroll' | 'hover';
}

interface UserJourney {
    sessionId: string;
    startTime: number;
    endTime: number;
    events: UXEvent[];
    pages: string[];
    duration: number;
    exitPage?: string;
    entryPage: string;
}

export const useUXAnalytics = () => {
    const [events, setEvents] = useState<UXEvent[]>([]);
    const [metrics, setMetrics] = useState<UXMetrics | null>(null);
    const [heatmapData, setHeatmapData] = useState<HeatmapData[]>([]);
    const [userJourney, setUserJourney] = useState<UserJourney | null>(null);
    const [isRecording, setIsRecording] = useState(false);

    const sessionId = useRef<string>(`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    const startTime = useRef<number>(Date.now());
    const eventListeners = useRef<Map<string, () => void>>(new Map());
    const performanceObserver = useRef<PerformanceObserver | null>(null);

    // UX 이벤트 기록
    const recordEvent = useCallback((event: Omit<UXEvent, 'id' | 'timestamp' | 'url' | 'viewport'>) => {
        if (!isRecording) return;

        const newEvent: UXEvent = {
            ...event,
            id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now(),
            url: window.location.href,
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            }
        };

        setEvents(prev => [...prev, newEvent]);

        // 히트맵 데이터 업데이트
        if (event.position) {
            setHeatmapData(prev => [...prev, {
                x: event.position!.x,
                y: event.position!.y,
                value: 1,
                element: event.element,
                type: event.type as 'click' | 'scroll' | 'hover'
            }]);
        }
    }, [isRecording]);

    // 클릭 이벤트 추적
    const trackClicks = useCallback(() => {
        const handleClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            recordEvent({
                type: 'click',
                element: target.tagName.toLowerCase(),
                selector: getElementSelector(target),
                position: {
                    x: e.clientX,
                    y: e.clientY
                }
            });
        };

        document.addEventListener('click', handleClick);
        eventListeners.current.set('click', () => {
            document.removeEventListener('click', handleClick);
        });
    }, [recordEvent]);

    // 스크롤 이벤트 추적
    const trackScrolls = useCallback(() => {
        let scrollTimeout: NodeJS.Timeout;

        const handleScroll = () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                const scrollDepth = Math.round(
                    (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
                );

                recordEvent({
                    type: 'scroll',
                    element: 'document',
                    selector: 'body',
                    metadata: { scrollDepth }
                });
            }, 100);
        };

        window.addEventListener('scroll', handleScroll);
        eventListeners.current.set('scroll', () => {
            window.removeEventListener('scroll', handleScroll);
            clearTimeout(scrollTimeout);
        });
    }, [recordEvent]);

    // 호버 이벤트 추적
    const trackHovers = useCallback(() => {
        const handleMouseEnter = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            recordEvent({
                type: 'hover',
                element: target.tagName.toLowerCase(),
                selector: getElementSelector(target),
                position: {
                    x: e.clientX,
                    y: e.clientY
                }
            });
        };

        document.addEventListener('mouseenter', handleMouseEnter, true);
        eventListeners.current.set('hover', () => {
            document.removeEventListener('mouseenter', handleMouseEnter, true);
        });
    }, [recordEvent]);

    // 포커스 이벤트 추적
    const trackFocus = useCallback(() => {
        const handleFocus = (e: FocusEvent) => {
            const target = e.target as HTMLElement;
            recordEvent({
                type: 'focus',
                element: target.tagName.toLowerCase(),
                selector: getElementSelector(target)
            });
        };

        const handleBlur = (e: FocusEvent) => {
            const target = e.target as HTMLElement;
            recordEvent({
                type: 'blur',
                element: target.tagName.toLowerCase(),
                selector: getElementSelector(target)
            });
        };

        document.addEventListener('focus', handleFocus, true);
        document.addEventListener('blur', handleBlur, true);
        eventListeners.current.set('focus', () => {
            document.removeEventListener('focus', handleFocus, true);
            document.removeEventListener('blur', handleBlur, true);
        });
    }, [recordEvent]);

    // 윈도우 리사이즈 추적
    const trackResize = useCallback(() => {
        let resizeTimeout: NodeJS.Timeout;

        const handleResize = () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                recordEvent({
                    type: 'resize',
                    element: 'window',
                    selector: 'window',
                    metadata: {
                        width: window.innerWidth,
                        height: window.innerHeight
                    }
                });
            }, 250);
        };

        window.addEventListener('resize', handleResize);
        eventListeners.current.set('resize', () => {
            window.removeEventListener('resize', handleResize);
            clearTimeout(resizeTimeout);
        });
    }, [recordEvent]);

    // 에러 추적
    const trackErrors = useCallback(() => {
        const handleError = (e: ErrorEvent) => {
            recordEvent({
                type: 'error',
                element: 'window',
                selector: 'window',
                metadata: {
                    message: e.message,
                    filename: e.filename,
                    lineno: e.lineno,
                    colno: e.colno,
                    error: e.error?.toString()
                }
            });
        };

        const handleUnhandledRejection = (e: PromiseRejectionEvent) => {
            recordEvent({
                type: 'error',
                element: 'promise',
                selector: 'promise',
                metadata: {
                    reason: e.reason?.toString()
                }
            });
        };

        window.addEventListener('error', handleError);
        window.addEventListener('unhandledrejection', handleUnhandledRejection);
        eventListeners.current.set('error', () => {
            window.removeEventListener('error', handleError);
            window.removeEventListener('unhandledrejection', handleUnhandledRejection);
        });
    }, [recordEvent]);

    // 성능 메트릭 수집
    const collectPerformanceMetrics = useCallback(() => {
        if (!('performance' in window)) return;

        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        const paint = performance.getEntriesByType('paint');
        const lcp = performance.getEntriesByType('largest-contentful-paint')[0];
        const cls = performance.getEntriesByType('layout-shift');
        const fid = performance.getEntriesByType('first-input')[0];

        const newMetrics: UXMetrics = {
            pageLoadTime: navigation.loadEventEnd - navigation.loadEventStart,
            timeToInteractive: navigation.domInteractive - navigation.navigationStart,
            firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
            largestContentfulPaint: lcp?.startTime || 0,
            cumulativeLayoutShift: cls.reduce((sum, entry) => sum + (entry as any).value, 0),
            firstInputDelay: fid?.processingStart ? fid.processingStart - fid.startTime : 0,
            totalBlockingTime: 0, // 계산 필요
            bounceRate: 0, // 세션 기반 계산
            averageSessionDuration: 0, // 세션 기반 계산
            clickThroughRate: 0, // 이벤트 기반 계산
            scrollDepth: 0, // 스크롤 이벤트 기반 계산
            errorRate: 0 // 에러 이벤트 기반 계산
        };

        setMetrics(newMetrics);
    }, []);

    // 사용자 여정 생성
    const generateUserJourney = useCallback(() => {
        const currentTime = Date.now();
        const sessionEvents = events.filter(e => e.timestamp >= startTime.current);
        const pages = [...new Set(sessionEvents.map(e => e.url))];

        const journey: UserJourney = {
            sessionId: sessionId.current,
            startTime: startTime.current,
            endTime: currentTime,
            events: sessionEvents,
            pages,
            duration: currentTime - startTime.current,
            entryPage: pages[0] || window.location.href,
            exitPage: pages[pages.length - 1]
        };

        setUserJourney(journey);
    }, [events]);

    // 분석 시작
    const startAnalytics = useCallback(() => {
        setIsRecording(true);
        startTime.current = Date.now();

        // 이벤트 리스너 등록
        trackClicks();
        trackScrolls();
        trackHovers();
        trackFocus();
        trackResize();
        trackErrors();

        // 성능 메트릭 수집
        collectPerformanceMetrics();

        // 페이지 로드 이벤트
        recordEvent({
            type: 'load',
            element: 'document',
            selector: 'body'
        });
    }, [trackClicks, trackScrolls, trackHovers, trackFocus, trackResize, trackErrors, collectPerformanceMetrics, recordEvent]);

    // 분석 중지
    const stopAnalytics = useCallback(() => {
        setIsRecording(false);

        // 이벤트 리스너 제거
        eventListeners.current.forEach(cleanup => cleanup());
        eventListeners.current.clear();

        // 사용자 여정 생성
        generateUserJourney();

        // 페이지 언로드 이벤트
        recordEvent({
            type: 'unload',
            element: 'document',
            selector: 'body'
        });
    }, [generateUserJourney, recordEvent]);

    // 히트맵 데이터 정리
    const getHeatmapData = useCallback((type?: 'click' | 'scroll' | 'hover') => {
        if (type) {
            return heatmapData.filter(d => d.type === type);
        }
        return heatmapData;
    }, [heatmapData]);

    // 이벤트 필터링
    const getFilteredEvents = useCallback((filters: {
        type?: string;
        element?: string;
        timeRange?: { start: number; end: number };
    }) => {
        return events.filter(event => {
            if (filters.type && event.type !== filters.type) return false;
            if (filters.element && event.element !== filters.element) return false;
            if (filters.timeRange) {
                const { start, end } = filters.timeRange;
                if (event.timestamp < start || event.timestamp > end) return false;
            }
            return true;
        });
    }, [events]);

    // 통계 계산
    const getStatistics = useCallback(() => {
        const totalEvents = events.length;
        const eventTypes = events.reduce((acc, event) => {
            acc[event.type] = (acc[event.type] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const averageScrollDepth = events
            .filter(e => e.metadata?.scrollDepth)
            .reduce((sum, e) => sum + (e.metadata?.scrollDepth || 0), 0) /
            events.filter(e => e.metadata?.scrollDepth).length || 0;

        const errorCount = events.filter(e => e.type === 'error').length;
        const errorRate = totalEvents > 0 ? (errorCount / totalEvents) * 100 : 0;

        return {
            totalEvents,
            eventTypes,
            averageScrollDepth,
            errorCount,
            errorRate,
            sessionDuration: userJourney?.duration || 0
        };
    }, [events, userJourney]);

    // 데이터 내보내기
    const exportData = useCallback(() => {
        const data = {
            sessionId: sessionId.current,
            startTime: startTime.current,
            endTime: Date.now(),
            events,
            metrics,
            heatmapData,
            userJourney,
            statistics: getStatistics()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ux-analytics-${sessionId.current}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }, [events, metrics, heatmapData, userJourney, getStatistics]);

    // 컴포넌트 언마운트 시 정리
    useEffect(() => {
        return () => {
            if (isRecording) {
                stopAnalytics();
            }
        };
    }, [isRecording, stopAnalytics]);

    return {
        events,
        metrics,
        heatmapData,
        userJourney,
        isRecording,
        startAnalytics,
        stopAnalytics,
        getHeatmapData,
        getFilteredEvents,
        getStatistics,
        exportData,
        recordEvent
    };
};

// 유틸리티 함수
function getElementSelector(element: HTMLElement): string {
    if (element.id) return `#${element.id}`;
    if (element.className) {
        const classes = element.className.split(' ').filter(c => c.trim());
        if (classes.length > 0) return `.${classes[0]}`;
    }
    return element.tagName.toLowerCase();
}
