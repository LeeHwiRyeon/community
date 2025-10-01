import { EventEmitter } from 'events';
import { multiModelManager } from '../ai/multi-model-manager';

// 고급 이벤트 타입 정의
export type EventType =
    | 'page_view' | 'page_exit' | 'page_scroll' | 'page_resize'
    | 'click' | 'double_click' | 'right_click' | 'hover' | 'hover_exit'
    | 'form_focus' | 'form_blur' | 'form_input' | 'form_submit' | 'form_validation'
    | 'button_click' | 'link_click' | 'image_click' | 'video_play' | 'video_pause'
    | 'search_query' | 'search_result_click' | 'filter_applied' | 'sort_changed'
    | 'cart_add' | 'cart_remove' | 'checkout_start' | 'payment_complete'
    | 'login_attempt' | 'login_success' | 'login_failure' | 'logout'
    | 'signup_start' | 'signup_complete' | 'email_verification'
    | 'content_create' | 'content_edit' | 'content_delete' | 'content_share'
    | 'comment_add' | 'comment_edit' | 'comment_delete' | 'comment_like'
    | 'follow_user' | 'unfollow_user' | 'block_user' | 'report_content'
    | 'notification_received' | 'notification_clicked' | 'notification_dismissed'
    | 'error_occurred' | 'performance_issue' | 'security_alert'
    | 'custom_event' | 'agent_action' | 'content_generation' | 'ai_interaction';

// 이벤트 우선순위
export type EventPriority = 'critical' | 'high' | 'medium' | 'low' | 'debug';

// 이벤트 카테고리
export type EventCategory =
    | 'navigation' | 'interaction' | 'form' | 'media' | 'search' | 'commerce'
    | 'authentication' | 'content' | 'social' | 'notification' | 'system' | 'ai';

// 고급 이벤트 인터페이스
export interface AdvancedEvent {
    id: string;
    sessionId: string;
    userId?: string;
    type: EventType;
    category: EventCategory;
    priority: EventPriority;
    timestamp: Date;

    // 기본 정보
    page: PageContext;
    element: ElementContext;
    user: UserContext;
    device: DeviceContext;

    // 이벤트별 상세 정보
    data: EventData;
    metadata: EventMetadata;

    // AI 분석 정보
    aiAnalysis?: AIEventAnalysis;

    // 연관 이벤트
    relatedEvents: string[];
    parentEvent?: string;
    childEvents: string[];

    // 성능 정보
    performance: PerformanceContext;

    // 보안 정보
    security: SecurityContext;
}

// 페이지 컨텍스트
export interface PageContext {
    url: string;
    title: string;
    referrer?: string;
    path: string;
    query: Record<string, string>;
    hash: string;
    viewport: {
        width: number;
        height: number;
    };
    scroll: {
        x: number;
        y: number;
        maxY: number;
    };
    loadTime: number;
    domReadyTime: number;
    firstPaint: number;
    firstContentfulPaint: number;
    largestContentfulPaint: number;
    cumulativeLayoutShift: number;
}

// 요소 컨텍스트
export interface ElementContext {
    tagName: string;
    id?: string;
    className?: string;
    textContent?: string;
    position: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    attributes: Record<string, string>;
    parentElement?: {
        tagName: string;
        id?: string;
        className?: string;
    };
    isVisible: boolean;
    isInteractive: boolean;
    zIndex: number;
}

// 사용자 컨텍스트
export interface UserContext {
    id?: string;
    email?: string;
    role?: string;
    segment?: string;
    preferences: Record<string, any>;
    behavior: {
        isReturning: boolean;
        sessionCount: number;
        totalTimeSpent: number;
        averageSessionDuration: number;
        favoritePages: string[];
        commonActions: string[];
    };
    location: {
        country: string;
        region: string;
        city: string;
        timezone: string;
        language: string;
    };
}

// 디바이스 컨텍스트
export interface DeviceContext {
    type: 'desktop' | 'tablet' | 'mobile' | 'tv' | 'watch' | 'other';
    os: {
        name: string;
        version: string;
        architecture: string;
    };
    browser: {
        name: string;
        version: string;
        engine: string;
    };
    screen: {
        width: number;
        height: number;
        colorDepth: number;
        pixelRatio: number;
    };
    connection: {
        type: string;
        effectiveType: string;
        downlink: number;
        rtt: number;
    };
    capabilities: {
        touch: boolean;
        geolocation: boolean;
        camera: boolean;
        microphone: boolean;
        notifications: boolean;
    };
}

// 이벤트 데이터 (타입별 상세 정보)
export interface EventData {
    // 공통 데이터
    value?: any;
    text?: string;
    url?: string;

    // 페이지 뷰 데이터
    pageView?: {
        duration: number;
        scrollDepth: number;
        timeOnPage: number;
        exitPage: boolean;
        entryPage: boolean;
    };

    // 클릭 데이터
    click?: {
        button: number;
        ctrlKey: boolean;
        shiftKey: boolean;
        altKey: boolean;
        metaKey: boolean;
        targetText: string;
        targetUrl?: string;
    };

    // 폼 데이터
    form?: {
        formId: string;
        fieldName: string;
        fieldType: string;
        fieldValue: any;
        validationErrors: string[];
        completionRate: number;
    };

    // 검색 데이터
    search?: {
        query: string;
        filters: Record<string, any>;
        resultsCount: number;
        selectedResult?: number;
        searchTime: number;
    };

    // 미디어 데이터
    media?: {
        mediaType: 'image' | 'video' | 'audio';
        mediaUrl: string;
        duration?: number;
        currentTime?: number;
        volume?: number;
        playbackRate?: number;
        quality?: string;
    };

    // 상거래 데이터
    commerce?: {
        productId: string;
        productName: string;
        category: string;
        price: number;
        currency: string;
        quantity: number;
        discount?: number;
    };

    // 인증 데이터
    auth?: {
        method: string;
        provider?: string;
        success: boolean;
        errorCode?: string;
        errorMessage?: string;
    };

    // 콘텐츠 데이터
    content?: {
        contentId: string;
        contentType: string;
        contentTitle: string;
        action: 'create' | 'edit' | 'delete' | 'view' | 'share' | 'like';
        changes?: Record<string, any>;
    };

    // AI 에이전트 데이터
    aiAgent?: {
        agentId: string;
        action: string;
        input: any;
        output: any;
        confidence: number;
        processingTime: number;
        model: string;
    };

    // 에러 데이터
    error?: {
        errorType: string;
        errorMessage: string;
        stackTrace?: string;
        component: string;
        severity: 'low' | 'medium' | 'high' | 'critical';
    };
}

// 이벤트 메타데이터
export interface EventMetadata {
    source: string;
    version: string;
    environment: 'development' | 'staging' | 'production';
    build: string;
    feature: string;
    experiment?: {
        id: string;
        variant: string;
        group: string;
    };
    campaign?: {
        id: string;
        name: string;
        source: string;
        medium: string;
        content: string;
    };
    custom: Record<string, any>;
}

// AI 이벤트 분석
export interface AIEventAnalysis {
    intent: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    confidence: number;
    patterns: string[];
    anomalies: string[];
    recommendations: string[];
    predictions: {
        nextAction: string;
        probability: number;
        timeToAction?: number;
    };
    insights: {
        type: 'behavior' | 'preference' | 'issue' | 'opportunity';
        description: string;
        impact: number;
        actionable: boolean;
    }[];
}

// 성능 컨텍스트
export interface PerformanceContext {
    eventDuration: number;
    memoryUsage: number;
    cpuUsage: number;
    networkLatency: number;
    renderTime: number;
    jsHeapSize: number;
    domNodes: number;
    eventLoopDelay: number;
}

// 보안 컨텍스트
export interface SecurityContext {
    ipAddress: string;
    userAgent: string;
    fingerprint: string;
    isBot: boolean;
    isSuspicious: boolean;
    riskScore: number;
    threats: string[];
    encryption: boolean;
    secureConnection: boolean;
}

// 이벤트 필터
export interface EventFilter {
    types?: EventType[];
    categories?: EventCategory[];
    priorities?: EventPriority[];
    userId?: string;
    sessionId?: string;
    dateRange?: {
        start: Date;
        end: Date;
    };
    page?: string;
    element?: string;
    custom?: Record<string, any>;
}

// 이벤트 집계
export interface EventAggregation {
    totalEvents: number;
    uniqueUsers: number;
    uniqueSessions: number;
    averagePerSession: number;
    topEvents: Array<{
        type: EventType;
        count: number;
        percentage: number;
    }>;
    topPages: Array<{
        page: string;
        count: number;
        percentage: number;
    }>;
    topElements: Array<{
        element: string;
        count: number;
        percentage: number;
    }>;
    timeDistribution: Array<{
        hour: number;
        count: number;
    }>;
}

// 고급 이벤트 로거
export class AdvancedEventLogger extends EventEmitter {
    private events: Map<string, AdvancedEvent> = new Map();
    private sessions: Map<string, string[]> = new Map();
    private users: Map<string, string[]> = new Map();
    private filters: EventFilter[] = [];
    private batchSize: number = 100;
    private flushInterval: number = 5000;
    private flushTimer: NodeJS.Timeout | null = null;
    private isEnabled: boolean = true;

    constructor() {
        super();
        this.startFlushTimer();
    }

    // 이벤트 로깅
    async logEvent(
        sessionId: string,
        type: EventType,
        data: Partial<EventData> = {},
        options: {
            userId?: string;
            priority?: EventPriority;
            category?: EventCategory;
            page?: Partial<PageContext>;
            element?: Partial<ElementContext>;
            metadata?: Partial<EventMetadata>;
            parentEvent?: string;
        } = {}
    ): Promise<string> {
        if (!this.isEnabled) return '';

        const eventId = this.generateEventId();
        const timestamp = new Date();

        // 기본 컨텍스트 수집
        const pageContext = this.collectPageContext(options.page);
        const elementContext = this.collectElementContext(options.element);
        const userContext = await this.collectUserContext(options.userId);
        const deviceContext = this.collectDeviceContext();
        const performanceContext = this.collectPerformanceContext();
        const securityContext = this.collectSecurityContext();

        // 이벤트 생성
        const event: AdvancedEvent = {
            id: eventId,
            sessionId,
            userId: options.userId,
            type,
            category: options.category || this.inferCategory(type),
            priority: options.priority || this.inferPriority(type),
            timestamp,
            page: pageContext,
            element: elementContext,
            user: userContext,
            device: deviceContext,
            data: data as EventData,
            metadata: {
                source: 'advanced-event-logger',
                version: '1.0.0',
                environment: process.env.NODE_ENV as any || 'development',
                build: process.env.BUILD_VERSION || 'unknown',
                feature: options.metadata?.feature || 'unknown',
                ...options.metadata
            },
            relatedEvents: [],
            parentEvent: options.parentEvent,
            childEvents: [],
            performance: performanceContext,
            security: securityContext
        };

        // AI 분석 수행
        if (this.shouldAnalyzeEvent(event)) {
            event.aiAnalysis = await this.analyzeEvent(event);
        }

        // 이벤트 저장
        this.events.set(eventId, event);
        this.addToSession(sessionId, eventId);
        if (options.userId) {
            this.addToUser(options.userId, eventId);
        }

        // 연관 이벤트 처리
        if (options.parentEvent) {
            this.linkEvents(options.parentEvent, eventId);
        }

        // 필터 적용
        if (this.matchesFilters(event)) {
            this.emit('event', event);
        }

        // 배치 처리
        if (this.events.size >= this.batchSize) {
            await this.flushEvents();
        }

        return eventId;
    }

    // 콘텐츠 작업 이벤트 로깅
    async logContentEvent(
        sessionId: string,
        action: 'create' | 'edit' | 'delete' | 'view' | 'share',
        contentData: {
            contentId: string;
            contentType: string;
            contentTitle: string;
            changes?: Record<string, any>;
        },
        options: {
            userId?: string;
            agentId?: string;
            processingTime?: number;
        } = {}
    ): Promise<string> {
        const eventData: EventData = {
            content: {
                contentId: contentData.contentId,
                contentType: contentData.contentType,
                contentTitle: contentData.contentTitle,
                action,
                changes: contentData.changes
            }
        };

        // AI 에이전트 정보 추가
        if (options.agentId) {
            eventData.aiAgent = {
                agentId: options.agentId,
                action: `content_${action}`,
                input: contentData,
                output: { success: true },
                confidence: 0.9,
                processingTime: options.processingTime || 0,
                model: 'content-generator'
            };
        }

        return this.logEvent(
            sessionId,
            `content_${action}` as EventType,
            eventData,
            {
                userId: options.userId,
                priority: 'high',
                category: 'content',
                metadata: {
                    feature: 'content-management',
                    experiment: {
                        id: 'content-ai-integration',
                        variant: 'ai-assisted',
                        group: 'treatment'
                    }
                }
            }
        );
    }

    // AI 에이전트 이벤트 로깅
    async logAgentEvent(
        sessionId: string,
        agentId: string,
        action: string,
        input: any,
        output: any,
        options: {
            userId?: string;
            confidence?: number;
            processingTime?: number;
            model?: string;
        } = {}
    ): Promise<string> {
        const eventData: EventData = {
            aiAgent: {
                agentId,
                action,
                input,
                output,
                confidence: options.confidence || 0.8,
                processingTime: options.processingTime || 0,
                model: options.model || 'unknown'
            }
        };

        return this.logEvent(
            sessionId,
            'agent_action',
            eventData,
            {
                userId: options.userId,
                priority: 'medium',
                category: 'ai',
                metadata: {
                    feature: 'ai-agent',
                    custom: {
                        agentId,
                        model: options.model
                    }
                }
            }
        );
    }

    // 페이지 컨텍스트 수집
    private collectPageContext(override?: Partial<PageContext>): PageContext {
        if (typeof window === 'undefined') {
            return {
                url: '',
                title: '',
                path: '',
                query: {},
                hash: '',
                viewport: { width: 0, height: 0 },
                scroll: { x: 0, y: 0, maxY: 0 },
                loadTime: 0,
                domReadyTime: 0,
                firstPaint: 0,
                firstContentfulPaint: 0,
                largestContentfulPaint: 0,
                cumulativeLayoutShift: 0,
                ...override
            };
        }

        return {
            url: window.location.href,
            title: document.title,
            referrer: document.referrer,
            path: window.location.pathname,
            query: Object.fromEntries(new URLSearchParams(window.location.search)),
            hash: window.location.hash,
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            scroll: {
                x: window.scrollX,
                y: window.scrollY,
                maxY: Math.max(document.body.scrollHeight, document.documentElement.scrollHeight)
            },
            loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart,
            domReadyTime: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
            firstPaint: 0, // performance.getEntriesByType('paint')[0]?.startTime || 0,
            firstContentfulPaint: 0, // performance.getEntriesByType('paint')[1]?.startTime || 0,
            largestContentfulPaint: 0,
            cumulativeLayoutShift: 0,
            ...override
        };
    }

    // 요소 컨텍스트 수집
    private collectElementContext(override?: Partial<ElementContext>): ElementContext {
        return {
            tagName: '',
            id: '',
            className: '',
            textContent: '',
            position: { x: 0, y: 0, width: 0, height: 0 },
            attributes: {},
            isVisible: false,
            isInteractive: false,
            zIndex: 0,
            ...override
        };
    }

    // 사용자 컨텍스트 수집
    private async collectUserContext(userId?: string): Promise<UserContext> {
        // 실제 구현에서는 사용자 데이터베이스에서 조회
        return {
            id: userId,
            email: userId ? `${userId}@example.com` : undefined,
            role: 'user',
            segment: 'general',
            preferences: {},
            behavior: {
                isReturning: false,
                sessionCount: 1,
                totalTimeSpent: 0,
                averageSessionDuration: 0,
                favoritePages: [],
                commonActions: []
            },
            location: {
                country: 'South Korea',
                region: 'Seoul',
                city: 'Seoul',
                timezone: 'Asia/Seoul',
                language: 'ko-KR'
            }
        };
    }

    // 디바이스 컨텍스트 수집
    private collectDeviceContext(): DeviceContext {
        if (typeof window === 'undefined') {
            return {
                type: 'desktop',
                os: { name: 'Unknown', version: '0.0.0', architecture: 'x64' },
                browser: { name: 'Unknown', version: '0.0.0', engine: 'Unknown' },
                screen: { width: 1920, height: 1080, colorDepth: 24, pixelRatio: 1 },
                connection: { type: 'unknown', effectiveType: '4g', downlink: 10, rtt: 50 },
                capabilities: { touch: false, geolocation: false, camera: false, microphone: false, notifications: false }
            };
        }

        const userAgent = navigator.userAgent;
        const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent);
        const isTablet = /iPad|Tablet/.test(userAgent);

        return {
            type: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop',
            os: this.parseOS(userAgent),
            browser: this.parseBrowser(userAgent),
            screen: {
                width: screen.width,
                height: screen.height,
                colorDepth: screen.colorDepth,
                pixelRatio: window.devicePixelRatio
            },
            connection: this.getConnectionInfo(),
            capabilities: {
                touch: 'ontouchstart' in window,
                geolocation: 'geolocation' in navigator,
                camera: 'mediaDevices' in navigator,
                microphone: 'mediaDevices' in navigator,
                notifications: 'Notification' in window
            }
        };
    }

    // 성능 컨텍스트 수집
    private collectPerformanceContext(): PerformanceContext {
        if (typeof window === 'undefined') {
            return {
                eventDuration: 0,
                memoryUsage: 0,
                cpuUsage: 0,
                networkLatency: 0,
                renderTime: 0,
                jsHeapSize: 0,
                domNodes: 0,
                eventLoopDelay: 0
            };
        }

        const memory = (performance as any).memory;
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

        return {
            eventDuration: 0, // 계산 필요
            memoryUsage: memory ? memory.usedJSHeapSize : 0,
            cpuUsage: 0, // 계산 필요
            networkLatency: navigation ? navigation.responseEnd - navigation.requestStart : 0,
            renderTime: navigation ? navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart : 0,
            jsHeapSize: memory ? memory.totalJSHeapSize : 0,
            domNodes: document.querySelectorAll('*').length,
            eventLoopDelay: 0 // 계산 필요
        };
    }

    // 보안 컨텍스트 수집
    private collectSecurityContext(): SecurityContext {
        return {
            ipAddress: '127.0.0.1', // 서버에서 설정
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
            fingerprint: this.generateFingerprint(),
            isBot: this.detectBot(),
            isSuspicious: false,
            riskScore: 0,
            threats: [],
            encryption: typeof location !== 'undefined' ? location.protocol === 'https:' : false,
            secureConnection: typeof location !== 'undefined' ? location.protocol === 'https:' : false
        };
    }

    // AI 이벤트 분석
    private async analyzeEvent(event: AdvancedEvent): Promise<AIEventAnalysis> {
        const analysisPrompt = this.buildAnalysisPrompt(event);

        try {
            const response = await multiModelManager.executeRequest(
                analysisPrompt,
                'analysis',
                'high'
            );

            return this.parseAnalysisResponse(response.content);
        } catch (error) {
            console.warn('AI analysis failed:', error);
            return this.createFallbackAnalysis();
        }
    }

    // 분석 프롬프트 구성
    private buildAnalysisPrompt(event: AdvancedEvent): string {
        return `
사용자 이벤트를 분석하여 인사이트를 제공해주세요.

이벤트 정보:
- 타입: ${event.type}
- 카테고리: ${event.category}
- 페이지: ${event.page.url}
- 요소: ${event.element.tagName}${event.element.id ? `#${event.element.id}` : ''}
- 사용자: ${event.user.id || 'Anonymous'}
- 시간: ${event.timestamp.toISOString()}

이벤트 데이터:
${JSON.stringify(event.data, null, 2)}

다음 정보를 JSON 형태로 제공해주세요:
1. 사용자 의도 분석
2. 감정 상태 (positive/negative/neutral)
3. 행동 패턴 식별
4. 이상 징후 감지
5. 개선 제안
6. 다음 행동 예측
7. 인사이트 생성
`;
    }

    // 분석 응답 파싱
    private parseAnalysisResponse(content: string): AIEventAnalysis {
        try {
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            return this.createFallbackAnalysis();
        } catch (error) {
            console.warn('Failed to parse AI analysis response, using fallback');
            return this.createFallbackAnalysis();
        }
    }

    // 폴백 분석 생성
    private createFallbackAnalysis(): AIEventAnalysis {
        return {
            intent: 'unknown',
            sentiment: 'neutral',
            confidence: 0.5,
            patterns: [],
            anomalies: [],
            recommendations: [],
            predictions: {
                nextAction: 'unknown',
                probability: 0.5
            },
            insights: []
        };
    }

    // 유틸리티 메서드들
    private generateEventId(): string {
        return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private inferCategory(type: EventType): EventCategory {
        const categoryMap: Record<EventType, EventCategory> = {
            'page_view': 'navigation',
            'page_exit': 'navigation',
            'page_scroll': 'navigation',
            'page_resize': 'navigation',
            'click': 'interaction',
            'double_click': 'interaction',
            'right_click': 'interaction',
            'hover': 'interaction',
            'hover_exit': 'interaction',
            'form_focus': 'form',
            'form_blur': 'form',
            'form_input': 'form',
            'form_submit': 'form',
            'form_validation': 'form',
            'button_click': 'interaction',
            'link_click': 'interaction',
            'image_click': 'interaction',
            'video_play': 'media',
            'video_pause': 'media',
            'search_query': 'search',
            'search_result_click': 'search',
            'filter_applied': 'search',
            'sort_changed': 'search',
            'cart_add': 'commerce',
            'cart_remove': 'commerce',
            'checkout_start': 'commerce',
            'payment_complete': 'commerce',
            'login_attempt': 'authentication',
            'login_success': 'authentication',
            'login_failure': 'authentication',
            'logout': 'authentication',
            'signup_start': 'authentication',
            'signup_complete': 'authentication',
            'email_verification': 'authentication',
            'content_create': 'content',
            'content_edit': 'content',
            'content_delete': 'content',
            'content_share': 'content',
            'comment_add': 'social',
            'comment_edit': 'social',
            'comment_delete': 'social',
            'comment_like': 'social',
            'follow_user': 'social',
            'unfollow_user': 'social',
            'block_user': 'social',
            'report_content': 'social',
            'notification_received': 'notification',
            'notification_clicked': 'notification',
            'notification_dismissed': 'notification',
            'error_occurred': 'system',
            'performance_issue': 'system',
            'security_alert': 'system',
            'custom_event': 'interaction',
            'agent_action': 'ai',
            'content_generation': 'ai',
            'ai_interaction': 'ai'
        };

        return categoryMap[type] || 'interaction';
    }

    private inferPriority(type: EventType): EventPriority {
        const priorityMap: Record<EventType, EventPriority> = {
            'error_occurred': 'critical',
            'security_alert': 'critical',
            'performance_issue': 'high',
            'login_failure': 'high',
            'payment_complete': 'high',
            'content_create': 'medium',
            'content_edit': 'medium',
            'form_submit': 'medium',
            'page_view': 'low',
            'hover': 'low',
            'page_scroll': 'low'
        };

        return priorityMap[type] || 'medium';
    }

    private shouldAnalyzeEvent(event: AdvancedEvent): boolean {
        return event.priority === 'high' || event.priority === 'critical' || event.category === 'ai';
    }

    private matchesFilters(event: AdvancedEvent): boolean {
        if (this.filters.length === 0) return true;

        return this.filters.some(filter => {
            if (filter.types && !filter.types.includes(event.type)) return false;
            if (filter.categories && !filter.categories.includes(event.category)) return false;
            if (filter.priorities && !filter.priorities.includes(event.priority)) return false;
            if (filter.userId && event.userId !== filter.userId) return false;
            if (filter.sessionId && event.sessionId !== filter.sessionId) return false;
            if (filter.page && !event.page.url.includes(filter.page)) return false;
            if (filter.element && !event.element.tagName.includes(filter.element)) return false;
            return true;
        });
    }

    private addToSession(sessionId: string, eventId: string): void {
        if (!this.sessions.has(sessionId)) {
            this.sessions.set(sessionId, []);
        }
        this.sessions.get(sessionId)!.push(eventId);
    }

    private addToUser(userId: string, eventId: string): void {
        if (!this.users.has(userId)) {
            this.users.set(userId, []);
        }
        this.users.get(userId)!.push(eventId);
    }

    private linkEvents(parentId: string, childId: string): void {
        const parentEvent = this.events.get(parentId);
        const childEvent = this.events.get(childId);

        if (parentEvent && childEvent) {
            parentEvent.childEvents.push(childId);
            childEvent.relatedEvents.push(parentId);
        }
    }

    private startFlushTimer(): void {
        this.flushTimer = setInterval(() => {
            this.flushEvents();
        }, this.flushInterval);
    }

    private async flushEvents(): Promise<void> {
        if (this.events.size === 0) return;

        const eventsToFlush = Array.from(this.events.values());
        this.events.clear();

        // 실제 구현에서는 데이터베이스에 저장
        console.log(`Flushing ${eventsToFlush.length} events to database`);

        this.emit('flush', eventsToFlush);
    }

    // 공개 메서드들
    getEvent(eventId: string): AdvancedEvent | undefined {
        return this.events.get(eventId);
    }

    getSessionEvents(sessionId: string): AdvancedEvent[] {
        const eventIds = this.sessions.get(sessionId) || [];
        return eventIds.map(id => this.events.get(id)).filter(Boolean) as AdvancedEvent[];
    }

    getUserEvents(userId: string): AdvancedEvent[] {
        const eventIds = this.users.get(userId) || [];
        return eventIds.map(id => this.events.get(id)).filter(Boolean) as AdvancedEvent[];
    }

    addFilter(filter: EventFilter): void {
        this.filters.push(filter);
    }

    removeFilter(filter: EventFilter): void {
        const index = this.filters.indexOf(filter);
        if (index > -1) {
            this.filters.splice(index, 1);
        }
    }

    getAggregation(filter?: EventFilter): EventAggregation {
        const events = filter ? this.getFilteredEvents(filter) : Array.from(this.events.values());

        const totalEvents = events.length;
        const uniqueUsers = new Set(events.map(e => e.userId).filter(Boolean)).size;
        const uniqueSessions = new Set(events.map(e => e.sessionId)).size;

        const eventCounts = new Map<EventType, number>();
        const pageCounts = new Map<string, number>();
        const elementCounts = new Map<string, number>();
        const hourCounts = new Map<number, number>();

        events.forEach(event => {
            eventCounts.set(event.type, (eventCounts.get(event.type) || 0) + 1);
            pageCounts.set(event.page.url, (pageCounts.get(event.page.url) || 0) + 1);
            elementCounts.set(event.element.tagName, (elementCounts.get(event.element.tagName) || 0) + 1);

            const hour = event.timestamp.getHours();
            hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
        });

        return {
            totalEvents,
            uniqueUsers,
            uniqueSessions,
            averagePerSession: uniqueSessions > 0 ? totalEvents / uniqueSessions : 0,
            topEvents: Array.from(eventCounts.entries())
                .map(([type, count]) => ({ type, count, percentage: (count / totalEvents) * 100 }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 10),
            topPages: Array.from(pageCounts.entries())
                .map(([page, count]) => ({ page, count, percentage: (count / totalEvents) * 100 }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 10),
            topElements: Array.from(elementCounts.entries())
                .map(([element, count]) => ({ element, count, percentage: (count / totalEvents) * 100 }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 10),
            timeDistribution: Array.from(hourCounts.entries())
                .map(([hour, count]) => ({ hour, count }))
                .sort((a, b) => a.hour - b.hour)
        };
    }

    private getFilteredEvents(filter: EventFilter): AdvancedEvent[] {
        return Array.from(this.events.values()).filter(event => {
            if (filter.types && !filter.types.includes(event.type)) return false;
            if (filter.categories && !filter.categories.includes(event.category)) return false;
            if (filter.priorities && !filter.priorities.includes(event.priority)) return false;
            if (filter.userId && event.userId !== filter.userId) return false;
            if (filter.sessionId && event.sessionId !== filter.sessionId) return false;
            if (filter.page && !event.page.url.includes(filter.page)) return false;
            if (filter.element && !event.element.tagName.includes(filter.element)) return false;
            return true;
        });
    }

    enable(): void {
        this.isEnabled = true;
    }

    disable(): void {
        this.isEnabled = false;
    }

    destroy(): void {
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
        }
        this.flushEvents();
        this.removeAllListeners();
    }

    // 헬퍼 메서드들
    private parseOS(userAgent: string): { name: string; version: string; architecture: string } {
        // OS 파싱 로직
        if (/Windows/.test(userAgent)) {
            return { name: 'Windows', version: '10', architecture: 'x64' };
        } else if (/Mac/.test(userAgent)) {
            return { name: 'macOS', version: '12', architecture: 'x64' };
        } else if (/Linux/.test(userAgent)) {
            return { name: 'Linux', version: '5.0', architecture: 'x64' };
        }
        return { name: 'Unknown', version: '0.0.0', architecture: 'x64' };
    }

    private parseBrowser(userAgent: string): { name: string; version: string; engine: string } {
        // 브라우저 파싱 로직
        if (/Chrome/.test(userAgent)) {
            return { name: 'Chrome', version: '91.0', engine: 'Blink' };
        } else if (/Firefox/.test(userAgent)) {
            return { name: 'Firefox', version: '89.0', engine: 'Gecko' };
        } else if (/Safari/.test(userAgent)) {
            return { name: 'Safari', version: '14.0', engine: 'WebKit' };
        }
        return { name: 'Unknown', version: '0.0.0', engine: 'Unknown' };
    }

    private getConnectionInfo(): { type: string; effectiveType: string; downlink: number; rtt: number } {
        if ('connection' in navigator) {
            const conn = (navigator as any).connection;
            return {
                type: conn.type || 'unknown',
                effectiveType: conn.effectiveType || '4g',
                downlink: conn.downlink || 10,
                rtt: conn.rtt || 50
            };
        }
        return { type: 'unknown', effectiveType: '4g', downlink: 10, rtt: 50 };
    }

    private generateFingerprint(): string {
        // 간단한 핑거프린트 생성
        return btoa(navigator.userAgent + screen.width + screen.height + navigator.language);
    }

    private detectBot(): boolean {
        const userAgent = navigator.userAgent.toLowerCase();
        const botPatterns = ['bot', 'crawler', 'spider', 'scraper'];
        return botPatterns.some(pattern => userAgent.includes(pattern));
    }
}

// 싱글톤 인스턴스
export const advancedEventLogger = new AdvancedEventLogger();
