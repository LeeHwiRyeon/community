import { multiModelManager } from '../ai/multi-model-manager';

// 사용자 세션 인터페이스
export interface UserSession {
    sessionId: string;
    userId?: string;
    startTime: Date;
    endTime?: Date;
    duration?: number;
    pageViews: PageView[];
    events: UserEvent[];
    device: DeviceInfo;
    location: LocationInfo;
    referrer?: string;
    utmParams?: UTMParams;
    isActive: boolean;
    lastActivity: Date;
}

// 페이지 뷰 인터페이스
export interface PageView {
    id: string;
    url: string;
    title: string;
    timestamp: Date;
    duration: number;
    scrollDepth: number;
    timeOnPage: number;
    exitPage: boolean;
    entryPage: boolean;
    referrer?: string;
    metadata: PageMetadata;
}

// 사용자 이벤트 인터페이스
export interface UserEvent {
    id: string;
    type: 'click' | 'scroll' | 'hover' | 'form_submit' | 'download' | 'video_play' | 'custom';
    element: string;
    value?: any;
    timestamp: Date;
    page: string;
    metadata: EventMetadata;
}

// 디바이스 정보 인터페이스
export interface DeviceInfo {
    userAgent: string;
    browser: string;
    browserVersion: string;
    os: string;
    osVersion: string;
    deviceType: 'desktop' | 'tablet' | 'mobile';
    screenResolution: string;
    viewportSize: string;
    language: string;
    timezone: string;
}

// 위치 정보 인터페이스
export interface LocationInfo {
    country: string;
    region: string;
    city: string;
    ip: string;
    coordinates?: {
        latitude: number;
        longitude: number;
    };
}

// UTM 파라미터 인터페이스
export interface UTMParams {
    source?: string;
    medium?: string;
    campaign?: string;
    term?: string;
    content?: string;
}

// 페이지 메타데이터 인터페이스
export interface PageMetadata {
    category: string;
    tags: string[];
    author?: string;
    publishDate?: Date;
    readingTime?: number;
    wordCount?: number;
    imageCount?: number;
    linkCount?: number;
}

// 이벤트 메타데이터 인터페이스
export interface EventMetadata {
    elementId?: string;
    elementClass?: string;
    elementText?: string;
    elementPosition?: {
        x: number;
        y: number;
    };
    elementSize?: {
        width: number;
        height: number;
    };
    customData?: any;
}

// 사용자 행동 분석 결과 인터페이스
export interface UserBehaviorAnalysis {
    sessionId: string;
    userId?: string;
    engagement: EngagementMetrics;
    journey: UserJourney;
    dropoffPoints: DropoffPoint[];
    recommendations: BehaviorRecommendation[];
    insights: BehaviorInsight[];
    score: BehaviorScore;
}

// 참여도 메트릭 인터페이스
export interface EngagementMetrics {
    totalTime: number;
    pageViews: number;
    events: number;
    scrollDepth: number;
    bounceRate: number;
    returnRate: number;
    conversionRate: number;
    engagementScore: number;
}

// 사용자 여정 인터페이스
export interface UserJourney {
    steps: JourneyStep[];
    path: string[];
    duration: number;
    completionRate: number;
    goalAchieved: boolean;
    frictionPoints: FrictionPoint[];
}

// 여정 단계 인터페이스
export interface JourneyStep {
    step: number;
    page: string;
    action: string;
    timestamp: Date;
    duration: number;
    success: boolean;
    metadata: any;
}

// 마찰점 인터페이스
export interface FrictionPoint {
    page: string;
    element: string;
    issue: string;
    severity: 'low' | 'medium' | 'high';
    frequency: number;
    impact: number;
}

// 이탈점 인터페이스
export interface DropoffPoint {
    page: string;
    dropoffRate: number;
    commonReasons: string[];
    suggestions: string[];
    priority: 'low' | 'medium' | 'high';
}

// 행동 권장사항 인터페이스
export interface BehaviorRecommendation {
    type: 'ui' | 'ux' | 'content' | 'performance' | 'conversion';
    priority: 'low' | 'medium' | 'high';
    title: string;
    description: string;
    impact: number;
    effort: 'low' | 'medium' | 'high';
    implementation: string;
}

// 행동 인사이트 인터페이스
export interface BehaviorInsight {
    type: 'pattern' | 'anomaly' | 'trend' | 'correlation';
    title: string;
    description: string;
    confidence: number;
    data: any;
    actionable: boolean;
}

// 행동 점수 인터페이스
export interface BehaviorScore {
    overall: number;
    engagement: number;
    satisfaction: number;
    conversion: number;
    retention: number;
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
}

// 사용자 추적 시스템
export class UserTrackingSystem {
    private sessions: Map<string, UserSession> = new Map();
    private analytics: Map<string, UserBehaviorAnalysis> = new Map();
    private cache: Map<string, any> = new Map();
    private dbPath: string;

    constructor(dbPath: string = './data/analytics') {
        this.dbPath = dbPath;
        this.initializeDatabase();
    }

    // 데이터베이스 초기화
    private initializeDatabase(): void {
        // 외장 하드에 데이터베이스 설정
        const fs = require('fs');
        const path = require('path');

        if (!fs.existsSync(this.dbPath)) {
            fs.mkdirSync(this.dbPath, { recursive: true });
        }

        // 데이터베이스 스키마 생성
        this.createDatabaseSchema();
    }

    // 데이터베이스 스키마 생성
    private createDatabaseSchema(): void {
        const schema = {
            sessions: {
                sessionId: 'TEXT PRIMARY KEY',
                userId: 'TEXT',
                startTime: 'DATETIME',
                endTime: 'DATETIME',
                duration: 'INTEGER',
                deviceInfo: 'TEXT',
                locationInfo: 'TEXT',
                referrer: 'TEXT',
                utmParams: 'TEXT',
                isActive: 'BOOLEAN',
                lastActivity: 'DATETIME'
            },
            pageViews: {
                id: 'TEXT PRIMARY KEY',
                sessionId: 'TEXT',
                url: 'TEXT',
                title: 'TEXT',
                timestamp: 'DATETIME',
                duration: 'INTEGER',
                scrollDepth: 'REAL',
                timeOnPage: 'INTEGER',
                exitPage: 'BOOLEAN',
                entryPage: 'BOOLEAN',
                referrer: 'TEXT',
                metadata: 'TEXT'
            },
            events: {
                id: 'TEXT PRIMARY KEY',
                sessionId: 'TEXT',
                type: 'TEXT',
                element: 'TEXT',
                value: 'TEXT',
                timestamp: 'DATETIME',
                page: 'TEXT',
                metadata: 'TEXT'
            },
            analytics: {
                sessionId: 'TEXT PRIMARY KEY',
                userId: 'TEXT',
                engagement: 'TEXT',
                journey: 'TEXT',
                dropoffPoints: 'TEXT',
                recommendations: 'TEXT',
                insights: 'TEXT',
                score: 'TEXT',
                createdAt: 'DATETIME'
            }
        };

        // SQLite 데이터베이스 생성
        const sqlite3 = require('sqlite3').verbose();
        const db = new sqlite3.Database(`${this.dbPath}/analytics.db`);

        // 테이블 생성
        Object.entries(schema).forEach(([tableName, columns]) => {
            const columnDefs = Object.entries(columns)
                .map(([name, type]) => `${name} ${type}`)
                .join(', ');

            db.run(`CREATE TABLE IF NOT EXISTS ${tableName} (${columnDefs})`);
        });

        db.close();
    }

    // 세션 시작
    startSession(sessionData: Partial<UserSession>): UserSession {
        const sessionId = this.generateSessionId();
        const now = new Date();

        const session: UserSession = {
            sessionId,
            userId: sessionData.userId,
            startTime: now,
            pageViews: [],
            events: [],
            device: sessionData.device || this.extractDeviceInfo(),
            location: sessionData.location || await this.extractLocationInfo(),
            referrer: sessionData.referrer,
            utmParams: sessionData.utmParams,
            isActive: true,
            lastActivity: now
        };

        this.sessions.set(sessionId, session);
        this.saveSessionToDatabase(session);

        return session;
    }

    // 세션 종료
    endSession(sessionId: string): UserSession | null {
        const session = this.sessions.get(sessionId);
        if (!session) return null;

        const now = new Date();
        session.endTime = now;
        session.duration = now.getTime() - session.startTime.getTime();
        session.isActive = false;

        this.sessions.set(sessionId, session);
        this.saveSessionToDatabase(session);

        // 세션 분석 수행
        this.analyzeSession(sessionId);

        return session;
    }

    // 페이지 뷰 추적
    trackPageView(sessionId: string, pageData: Partial<PageView>): PageView {
        const session = this.sessions.get(sessionId);
        if (!session) throw new Error('Session not found');

        const pageView: PageView = {
            id: this.generateEventId(),
            url: pageData.url || '',
            title: pageData.title || '',
            timestamp: new Date(),
            duration: 0,
            scrollDepth: 0,
            timeOnPage: 0,
            exitPage: false,
            entryPage: session.pageViews.length === 0,
            referrer: pageData.referrer,
            metadata: pageData.metadata || { category: '', tags: [] }
        };

        session.pageViews.push(pageView);
        session.lastActivity = new Date();

        this.sessions.set(sessionId, session);
        this.savePageViewToDatabase(pageView);

        return pageView;
    }

    // 이벤트 추적
    trackEvent(sessionId: string, eventData: Partial<UserEvent>): UserEvent {
        const session = this.sessions.get(sessionId);
        if (!session) throw new Error('Session not found');

        const event: UserEvent = {
            id: this.generateEventId(),
            type: eventData.type || 'custom',
            element: eventData.element || '',
            value: eventData.value,
            timestamp: new Date(),
            page: eventData.page || session.pageViews[session.pageViews.length - 1]?.url || '',
            metadata: eventData.metadata || {}
        };

        session.events.push(event);
        session.lastActivity = new Date();

        this.sessions.set(sessionId, session);
        this.saveEventToDatabase(event);

        return event;
    }

    // 세션 분석
    async analyzeSession(sessionId: string): Promise<UserBehaviorAnalysis> {
        const session = this.sessions.get(sessionId);
        if (!session) throw new Error('Session not found');

        // 캐시 확인
        const cacheKey = `analysis_${sessionId}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        // AI 기반 분석 수행
        const analysis = await this.performAIBehaviorAnalysis(session);

        // 결과 캐싱
        this.cache.set(cacheKey, analysis);
        this.analytics.set(sessionId, analysis);

        // 데이터베이스에 저장
        this.saveAnalysisToDatabase(analysis);

        return analysis;
    }

    // AI 기반 행동 분석
    private async performAIBehaviorAnalysis(session: UserSession): Promise<UserBehaviorAnalysis> {
        const analysisPrompt = this.buildBehaviorAnalysisPrompt(session);

        const response = await multiModelManager.executeRequest(
            analysisPrompt,
            'analysis',
            'high'
        );

        const aiAnalysis = this.parseBehaviorAnalysisResponse(response.content);

        // 기본 분석 수행
        const engagement = this.calculateEngagementMetrics(session);
        const journey = this.analyzeUserJourney(session);
        const dropoffPoints = this.identifyDropoffPoints(session);
        const recommendations = this.generateBehaviorRecommendations(session, aiAnalysis);
        const insights = this.generateBehaviorInsights(session, aiAnalysis);
        const score = this.calculateBehaviorScore(engagement, journey);

        return {
            sessionId: session.sessionId,
            userId: session.userId,
            engagement,
            journey,
            dropoffPoints,
            recommendations,
            insights,
            score
        };
    }

    // 행동 분석 프롬프트 구성
    private buildBehaviorAnalysisPrompt(session: UserSession): string {
        return `
사용자 행동 데이터를 분석하여 인사이트를 제공해주세요.

세션 정보:
- 세션 ID: ${session.sessionId}
- 사용자 ID: ${session.userId || 'Anonymous'}
- 세션 시간: ${session.startTime.toISOString()} - ${session.endTime?.toISOString() || 'Active'}
- 페이지 뷰 수: ${session.pageViews.length}
- 이벤트 수: ${session.events.length}

페이지 뷰 데이터:
${session.pageViews.map(pv => `
- URL: ${pv.url}
- 제목: ${pv.title}
- 시간: ${pv.timestamp.toISOString()}
- 체류 시간: ${pv.timeOnPage}ms
- 스크롤 깊이: ${pv.scrollDepth}%
- 이탈 페이지: ${pv.exitPage}
`).join('\n')}

이벤트 데이터:
${session.events.map(event => `
- 타입: ${event.type}
- 요소: ${event.element}
- 페이지: ${event.page}
- 시간: ${event.timestamp.toISOString()}
- 값: ${event.value || 'N/A'}
`).join('\n')}

다음 정보를 JSON 형태로 제공해주세요:
1. 사용자 행동 패턴 분석
2. 이탈 가능성이 높은 지점 식별
3. 사용자 경험 개선 제안
4. 전환율 향상 방안
5. 콘텐츠 최적화 제안
6. 기술적 개선 사항
7. 사용자 세그먼트 특성
8. 예측적 인사이트
`;
    }

    // 행동 분석 응답 파싱
    private parseBehaviorAnalysisResponse(content: string): any {
        try {
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            return this.createFallbackAnalysis();
        } catch (error) {
            console.warn('Failed to parse behavior analysis response, using fallback');
            return this.createFallbackAnalysis();
        }
    }

    // 폴백 분석 생성
    private createFallbackAnalysis(): any {
        return {
            patterns: ['일반적인 탐색 패턴'],
            dropoffPoints: ['메인 페이지', '상품 페이지'],
            improvements: ['로딩 속도 개선', '네비게이션 개선'],
            conversion: ['CTA 버튼 강화', '신뢰도 요소 추가']
        };
    }

    // 참여도 메트릭 계산
    private calculateEngagementMetrics(session: UserSession): EngagementMetrics {
        const totalTime = session.duration || 0;
        const pageViews = session.pageViews.length;
        const events = session.events.length;

        const scrollDepth = session.pageViews.reduce((sum, pv) => sum + pv.scrollDepth, 0) / pageViews || 0;
        const bounceRate = pageViews === 1 ? 1 : 0;
        const returnRate = 0; // 추후 계산
        const conversionRate = 0; // 추후 계산

        const engagementScore = Math.min(100, (totalTime / 1000) * 0.1 + pageViews * 10 + events * 5 + scrollDepth * 0.5);

        return {
            totalTime,
            pageViews,
            events,
            scrollDepth,
            bounceRate,
            returnRate,
            conversionRate,
            engagementScore
        };
    }

    // 사용자 여정 분석
    private analyzeUserJourney(session: UserSession): UserJourney {
        const steps: JourneyStep[] = session.pageViews.map((pv, index) => ({
            step: index + 1,
            page: pv.url,
            action: 'page_view',
            timestamp: pv.timestamp,
            duration: pv.timeOnPage,
            success: pv.scrollDepth > 50,
            metadata: { title: pv.title, scrollDepth: pv.scrollDepth }
        }));

        const path = session.pageViews.map(pv => pv.url);
        const duration = session.duration || 0;
        const completionRate = steps.filter(s => s.success).length / steps.length || 0;
        const goalAchieved = completionRate > 0.7;

        const frictionPoints = this.identifyFrictionPoints(steps);

        return {
            steps,
            path,
            duration,
            completionRate,
            goalAchieved,
            frictionPoints
        };
    }

    // 마찰점 식별
    private identifyFrictionPoints(steps: JourneyStep[]): FrictionPoint[] {
        const frictionPoints: FrictionPoint[] = [];

        // 짧은 체류 시간 페이지 식별
        const shortDurationPages = steps.filter(s => s.duration < 5000);
        if (shortDurationPages.length > 0) {
            frictionPoints.push({
                page: shortDurationPages[0].page,
                element: 'page',
                issue: '짧은 체류 시간',
                severity: 'medium',
                frequency: shortDurationPages.length,
                impact: 0.3
            });
        }

        // 실패한 단계 식별
        const failedSteps = steps.filter(s => !s.success);
        if (failedSteps.length > 0) {
            frictionPoints.push({
                page: failedSteps[0].page,
                element: 'content',
                issue: '낮은 참여도',
                severity: 'high',
                frequency: failedSteps.length,
                impact: 0.7
            });
        }

        return frictionPoints;
    }

    // 이탈점 식별
    private identifyDropoffPoints(session: UserSession): DropoffPoint[] {
        const dropoffPoints: DropoffPoint[] = [];

        // 이탈 페이지 식별
        const exitPages = session.pageViews.filter(pv => pv.exitPage);
        exitPages.forEach(page => {
            dropoffPoints.push({
                page: page.url,
                dropoffRate: 1.0,
                commonReasons: ['콘텐츠 부족', '로딩 속도', '네비게이션 문제'],
                suggestions: ['콘텐츠 개선', '성능 최적화', 'UX 개선'],
                priority: 'high'
            });
        });

        return dropoffPoints;
    }

    // 행동 권장사항 생성
    private generateBehaviorRecommendations(session: UserSession, aiAnalysis: any): BehaviorRecommendation[] {
        const recommendations: BehaviorRecommendation[] = [];

        // AI 분석 기반 권장사항
        if (aiAnalysis.improvements) {
            aiAnalysis.improvements.forEach((improvement: string) => {
                recommendations.push({
                    type: 'ux',
                    priority: 'medium',
                    title: improvement,
                    description: `AI 분석 결과: ${improvement}`,
                    impact: 0.5,
                    effort: 'medium',
                    implementation: 'UX 디자인 개선'
                });
            });
        }

        // 기본 권장사항
        if (session.pageViews.length === 1) {
            recommendations.push({
                type: 'content',
                priority: 'high',
                title: '바운스율 감소',
                description: '단일 페이지 방문으로 인한 높은 바운스율',
                impact: 0.8,
                effort: 'high',
                implementation: '콘텐츠 품질 향상 및 내부 링크 추가'
            });
        }

        return recommendations;
    }

    // 행동 인사이트 생성
    private generateBehaviorInsights(session: UserSession, aiAnalysis: any): BehaviorInsight[] {
        const insights: BehaviorInsight[] = [];

        // AI 분석 기반 인사이트
        if (aiAnalysis.patterns) {
            insights.push({
                type: 'pattern',
                title: '사용자 행동 패턴',
                description: aiAnalysis.patterns.join(', '),
                confidence: 0.8,
                data: aiAnalysis.patterns,
                actionable: true
            });
        }

        // 기본 인사이트
        if (session.events.length > session.pageViews.length * 2) {
            insights.push({
                type: 'pattern',
                title: '높은 참여도',
                description: '페이지당 평균 이벤트 수가 높음',
                confidence: 0.9,
                data: { eventRatio: session.events.length / session.pageViews.length },
                actionable: true
            });
        }

        return insights;
    }

    // 행동 점수 계산
    private calculateBehaviorScore(engagement: EngagementMetrics, journey: UserJourney): BehaviorScore {
        const overall = (engagement.engagementScore + journey.completionRate * 100) / 2;
        const grade = overall >= 80 ? 'A' : overall >= 60 ? 'B' : overall >= 40 ? 'C' : overall >= 20 ? 'D' : 'F';

        return {
            overall,
            engagement: engagement.engagementScore,
            satisfaction: journey.completionRate * 100,
            conversion: engagement.conversionRate * 100,
            retention: engagement.returnRate * 100,
            grade
        };
    }

    // 데이터베이스 저장 메서드들
    private saveSessionToDatabase(session: UserSession): void {
        // SQLite에 세션 저장
        const sqlite3 = require('sqlite3').verbose();
        const db = new sqlite3.Database(`${this.dbPath}/analytics.db`);

        db.run(`
      INSERT OR REPLACE INTO sessions 
      (sessionId, userId, startTime, endTime, duration, deviceInfo, locationInfo, referrer, utmParams, isActive, lastActivity)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
            session.sessionId,
            session.userId,
            session.startTime.toISOString(),
            session.endTime?.toISOString(),
            session.duration,
            JSON.stringify(session.device),
            JSON.stringify(session.location),
            session.referrer,
            JSON.stringify(session.utmParams),
            session.isActive,
            session.lastActivity.toISOString()
        ]);

        db.close();
    }

    private savePageViewToDatabase(pageView: PageView): void {
        const sqlite3 = require('sqlite3').verbose();
        const db = new sqlite3.Database(`${this.dbPath}/analytics.db`);

        db.run(`
      INSERT INTO pageViews 
      (id, sessionId, url, title, timestamp, duration, scrollDepth, timeOnPage, exitPage, entryPage, referrer, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
            pageView.id,
            pageView.sessionId,
            pageView.url,
            pageView.title,
            pageView.timestamp.toISOString(),
            pageView.duration,
            pageView.scrollDepth,
            pageView.timeOnPage,
            pageView.exitPage,
            pageView.entryPage,
            pageView.referrer,
            JSON.stringify(pageView.metadata)
        ]);

        db.close();
    }

    private saveEventToDatabase(event: UserEvent): void {
        const sqlite3 = require('sqlite3').verbose();
        const db = new sqlite3.Database(`${this.dbPath}/analytics.db`);

        db.run(`
      INSERT INTO events 
      (id, sessionId, type, element, value, timestamp, page, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
            event.id,
            event.sessionId,
            event.type,
            event.element,
            JSON.stringify(event.value),
            event.timestamp.toISOString(),
            event.page,
            JSON.stringify(event.metadata)
        ]);

        db.close();
    }

    private saveAnalysisToDatabase(analysis: UserBehaviorAnalysis): void {
        const sqlite3 = require('sqlite3').verbose();
        const db = new sqlite3.Database(`${this.dbPath}/analytics.db`);

        db.run(`
      INSERT OR REPLACE INTO analytics 
      (sessionId, userId, engagement, journey, dropoffPoints, recommendations, insights, score, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
            analysis.sessionId,
            analysis.userId,
            JSON.stringify(analysis.engagement),
            JSON.stringify(analysis.journey),
            JSON.stringify(analysis.dropoffPoints),
            JSON.stringify(analysis.recommendations),
            JSON.stringify(analysis.insights),
            JSON.stringify(analysis.score),
            new Date().toISOString()
        ]);

        db.close();
    }

    // 유틸리티 메서드들
    private generateSessionId(): string {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private generateEventId(): string {
        return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private extractDeviceInfo(): DeviceInfo {
        // 실제 구현에서는 User-Agent 파싱
        return {
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            browser: 'Chrome',
            browserVersion: '91.0.4472.124',
            os: 'Windows',
            osVersion: '10.0',
            deviceType: 'desktop',
            screenResolution: '1920x1080',
            viewportSize: '1920x1080',
            language: 'ko-KR',
            timezone: 'Asia/Seoul'
        };
    }

    private async extractLocationInfo(): Promise<LocationInfo> {
        // 실제 구현에서는 IP 기반 위치 추출
        return {
            country: 'South Korea',
            region: 'Seoul',
            city: 'Seoul',
            ip: '127.0.0.1',
            coordinates: {
                latitude: 37.5665,
                longitude: 126.9780
            }
        };
    }

    // 캐시 관리
    clearCache(): void {
        this.cache.clear();
    }

    getCacheStats(): any {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }

    // 분석 결과 조회
    getAnalysis(sessionId: string): UserBehaviorAnalysis | null {
        return this.analytics.get(sessionId) || null;
    }

    getAllAnalytics(): UserBehaviorAnalysis[] {
        return Array.from(this.analytics.values());
    }

    // 통계 조회
    getAnalyticsStats(): any {
        const sessions = Array.from(this.sessions.values());
        const analytics = Array.from(this.analytics.values());

        return {
            totalSessions: sessions.length,
            activeSessions: sessions.filter(s => s.isActive).length,
            totalPageViews: sessions.reduce((sum, s) => sum + s.pageViews.length, 0),
            totalEvents: sessions.reduce((sum, s) => sum + s.events.length, 0),
            averageEngagement: analytics.reduce((sum, a) => sum + a.engagement.engagementScore, 0) / analytics.length || 0,
            averageSessionDuration: sessions.reduce((sum, s) => sum + (s.duration || 0), 0) / sessions.length || 0
        };
    }
}

// 싱글톤 인스턴스
export const userTrackingSystem = new UserTrackingSystem();
