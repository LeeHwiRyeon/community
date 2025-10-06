/**
 * 📊 사용자 행동 분석 훅
 * 
 * 사용자의 행동 패턴, 선호도, 참여도를 분석하는 커스텀 훅
 * 
 * @author AUTOAGENTS Manager
 * @version 2.0.0
 * @created 2025-01-02
 */

import { useState, useEffect, useCallback } from 'react';

// 타입 정의
interface UserBehavior {
    userId: string;
    sessionId: string;
    timestamp: Date;
    action: string;
    category: string;
    metadata: Record<string, any>;
}

interface BehaviorAnalytics {
    pageViews: number;
    sessionDuration: number;
    bounceRate: number;
    clickThroughRate: number;
    scrollDepth: number;
    timeOnPage: number;
    interactions: InteractionData[];
    preferences: UserPreferences;
    engagementScore: number;
}

interface InteractionData {
    element: string;
    type: 'click' | 'hover' | 'scroll' | 'focus' | 'blur';
    timestamp: Date;
    duration?: number;
    metadata?: Record<string, any>;
}

interface UserPreferences {
    preferredCategories: string[];
    preferredContentTypes: string[];
    activeHours: number[];
    deviceType: 'mobile' | 'tablet' | 'desktop';
    language: string;
    timezone: string;
}

interface BehaviorInsights {
    patterns: BehaviorPattern[];
    recommendations: string[];
    anomalies: AnomalyData[];
    trends: TrendData[];
}

interface BehaviorPattern {
    type: 'daily' | 'weekly' | 'monthly';
    pattern: string;
    confidence: number;
    description: string;
}

interface AnomalyData {
    type: 'unusual_activity' | 'drop_in_engagement' | 'spike_in_usage';
    severity: 'low' | 'medium' | 'high';
    description: string;
    timestamp: Date;
    metrics: Record<string, number>;
}

interface TrendData {
    metric: string;
    direction: 'up' | 'down' | 'stable';
    change: number;
    period: string;
    significance: number;
}

export const useUserBehaviorAnalytics = (userId?: string) => {
    const [behaviorData, setBehaviorData] = useState<BehaviorAnalytics | null>(null);
    const [insights, setInsights] = useState<BehaviorInsights | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 행동 데이터 수집
    const trackBehavior = useCallback((behavior: Partial<UserBehavior>) => {
        const behaviorData: UserBehavior = {
            userId: userId || 'anonymous',
            sessionId: getSessionId(),
            timestamp: new Date(),
            action: behavior.action || 'unknown',
            category: behavior.category || 'general',
            metadata: behavior.metadata || {}
        };

        // 로컬 스토리지에 저장 (실제로는 API로 전송)
        const existingData = JSON.parse(localStorage.getItem('userBehavior') || '[]');
        existingData.push(behaviorData);

        // 최근 1000개 행동만 유지
        if (existingData.length > 1000) {
            existingData.splice(0, existingData.length - 1000);
        }

        localStorage.setItem('userBehavior', JSON.stringify(existingData));

        // 실시간 분석 업데이트
        updateAnalytics();
    }, [userId]);

    // 페이지 뷰 추적
    const trackPageView = useCallback((page: string, metadata?: Record<string, any>) => {
        trackBehavior({
            action: 'page_view',
            category: 'navigation',
            metadata: {
                page,
                referrer: document.referrer,
                userAgent: navigator.userAgent,
                ...metadata
            }
        });
    }, [trackBehavior]);

    // 클릭 이벤트 추적
    const trackClick = useCallback((element: string, metadata?: Record<string, any>) => {
        trackBehavior({
            action: 'click',
            category: 'interaction',
            metadata: {
                element,
                ...metadata
            }
        });
    }, [trackBehavior]);

    // 스크롤 깊이 추적
    const trackScrollDepth = useCallback((depth: number, page: string) => {
        trackBehavior({
            action: 'scroll',
            category: 'engagement',
            metadata: {
                depth,
                page,
                maxDepth: document.body.scrollHeight
            }
        });
    }, [trackBehavior]);

    // 시간 추적
    const trackTimeOnPage = useCallback((timeSpent: number, page: string) => {
        trackBehavior({
            action: 'time_on_page',
            category: 'engagement',
            metadata: {
                timeSpent,
                page
            }
        });
    }, [trackBehavior]);

    // 분석 데이터 업데이트
    const updateAnalytics = useCallback(() => {
        try {
            const behaviorHistory = JSON.parse(localStorage.getItem('userBehavior') || '[]');

            if (behaviorHistory.length === 0) return;

            const analytics = calculateBehaviorAnalytics(behaviorHistory);
            setBehaviorData(analytics);

            // 인사이트 생성
            const behaviorInsights = generateBehaviorInsights(behaviorHistory, analytics);
            setInsights(behaviorInsights);
        } catch (err) {
            console.error('Analytics update error:', err);
        }
    }, []);

    // 분석 데이터 가져오기
    const fetchAnalytics = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            // 실제 API 호출 시뮬레이션
            await new Promise(resolve => setTimeout(resolve, 500));

            updateAnalytics();
        } catch (err) {
            setError('분석 데이터를 불러오는 중 오류가 발생했습니다.');
            console.error('Analytics fetch error:', err);
        } finally {
            setLoading(false);
        }
    }, [updateAnalytics]);

    // 초기화
    useEffect(() => {
        fetchAnalytics();

        // 주기적 업데이트 (5분마다)
        const interval = setInterval(updateAnalytics, 5 * 60 * 1000);

        return () => clearInterval(interval);
    }, [fetchAnalytics, updateAnalytics]);

    // 행동 분석 계산
    const calculateBehaviorAnalytics = (behaviors: UserBehavior[]): BehaviorAnalytics => {
        const userBehaviors = userId ? behaviors.filter(b => b.userId === userId) : behaviors;

        const pageViews = userBehaviors.filter(b => b.action === 'page_view').length;
        const clicks = userBehaviors.filter(b => b.action === 'click').length;
        const scrolls = userBehaviors.filter(b => b.action === 'scroll');

        // 세션 지속 시간 계산
        const sessions = getSessions(userBehaviors);
        const avgSessionDuration = sessions.length > 0
            ? sessions.reduce((sum, session) => sum + session.duration, 0) / sessions.length
            : 0;

        // 이탈률 계산
        const singlePageSessions = sessions.filter(s => s.pageViews === 1).length;
        const bounceRate = sessions.length > 0 ? (singlePageSessions / sessions.length) * 100 : 0;

        // 클릭률 계산
        const clickThroughRate = pageViews > 0 ? (clicks / pageViews) * 100 : 0;

        // 평균 스크롤 깊이
        const avgScrollDepth = scrolls.length > 0
            ? scrolls.reduce((sum, scroll) => sum + (scroll.metadata.depth || 0), 0) / scrolls.length
            : 0;

        // 평균 페이지 체류 시간
        const timeOnPageEvents = userBehaviors.filter(b => b.action === 'time_on_page');
        const avgTimeOnPage = timeOnPageEvents.length > 0
            ? timeOnPageEvents.reduce((sum, event) => sum + (event.metadata.timeSpent || 0), 0) / timeOnPageEvents.length
            : 0;

        // 상호작용 데이터
        const interactions: InteractionData[] = userBehaviors
            .filter(b => ['click', 'hover', 'scroll', 'focus'].includes(b.action))
            .map(b => ({
                element: b.metadata.element || 'unknown',
                type: b.action as any,
                timestamp: new Date(b.timestamp),
                duration: b.metadata.duration,
                metadata: b.metadata
            }));

        // 사용자 선호도 분석
        const preferences = analyzeUserPreferences(userBehaviors);

        // 참여도 점수 계산
        const engagementScore = calculateEngagementScore({
            pageViews,
            sessionDuration: avgSessionDuration,
            clickThroughRate,
            scrollDepth: avgScrollDepth,
            timeOnPage: avgTimeOnPage
        });

        return {
            pageViews,
            sessionDuration: avgSessionDuration,
            bounceRate,
            clickThroughRate,
            scrollDepth: avgScrollDepth,
            timeOnPage: avgTimeOnPage,
            interactions,
            preferences,
            engagementScore
        };
    };

    // 세션 분석
    const getSessions = (behaviors: UserBehavior[]) => {
        const sessions: Array<{
            sessionId: string;
            startTime: Date;
            endTime: Date;
            duration: number;
            pageViews: number;
        }> = [];

        const sessionMap = new Map<string, UserBehavior[]>();

        behaviors.forEach(behavior => {
            if (!sessionMap.has(behavior.sessionId)) {
                sessionMap.set(behavior.sessionId, []);
            }
            sessionMap.get(behavior.sessionId)!.push(behavior);
        });

        sessionMap.forEach((sessionBehaviors, sessionId) => {
            const sortedBehaviors = sessionBehaviors.sort((a, b) =>
                new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            );

            const startTime = new Date(sortedBehaviors[0].timestamp);
            const endTime = new Date(sortedBehaviors[sortedBehaviors.length - 1].timestamp);
            const duration = endTime.getTime() - startTime.getTime();
            const pageViews = sessionBehaviors.filter(b => b.action === 'page_view').length;

            sessions.push({
                sessionId,
                startTime,
                endTime,
                duration,
                pageViews
            });
        });

        return sessions;
    };

    // 사용자 선호도 분석
    const analyzeUserPreferences = (behaviors: UserBehavior[]): UserPreferences => {
        const categories = behaviors
            .filter(b => b.category && b.category !== 'general')
            .map(b => b.category);

        const categoryCounts = categories.reduce((acc, category) => {
            acc[category] = (acc[category] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const preferredCategories = Object.entries(categoryCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([category]) => category);

        // 활성 시간 분석
        const hours = behaviors.map(b => new Date(b.timestamp).getHours());
        const hourCounts = hours.reduce((acc, hour) => {
            acc[hour] = (acc[hour] || 0) + 1;
            return acc;
        }, {} as Record<number, number>);

        const activeHours = Object.entries(hourCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([hour]) => parseInt(hour));

        return {
            preferredCategories,
            preferredContentTypes: ['text', 'image', 'video'], // 기본값
            activeHours,
            deviceType: detectDeviceType(),
            language: navigator.language,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        };
    };

    // 참여도 점수 계산
    const calculateEngagementScore = (metrics: {
        pageViews: number;
        sessionDuration: number;
        clickThroughRate: number;
        scrollDepth: number;
        timeOnPage: number;
    }): number => {
        const weights = {
            pageViews: 0.2,
            sessionDuration: 0.25,
            clickThroughRate: 0.2,
            scrollDepth: 0.2,
            timeOnPage: 0.15
        };

        const normalizedMetrics = {
            pageViews: Math.min(metrics.pageViews / 10, 1), // 최대 10페이지
            sessionDuration: Math.min(metrics.sessionDuration / (5 * 60 * 1000), 1), // 최대 5분
            clickThroughRate: Math.min(metrics.clickThroughRate / 20, 1), // 최대 20%
            scrollDepth: Math.min(metrics.scrollDepth / 100, 1), // 최대 100%
            timeOnPage: Math.min(metrics.timeOnPage / (2 * 60 * 1000), 1) // 최대 2분
        };

        const score = Object.entries(weights).reduce((sum, [metric, weight]) => {
            return sum + (normalizedMetrics[metric as keyof typeof normalizedMetrics] * weight);
        }, 0);

        return Math.round(score * 100);
    };

    // 행동 인사이트 생성
    const generateBehaviorInsights = (
        behaviors: UserBehavior[],
        analytics: BehaviorAnalytics
    ): BehaviorInsights => {
        const patterns = generateBehaviorPatterns(behaviors);
        const recommendations = generateRecommendations(analytics);
        const anomalies = detectAnomalies(behaviors, analytics);
        const trends = analyzeTrends(behaviors);

        return {
            patterns,
            recommendations,
            anomalies,
            trends
        };
    };

    // 행동 패턴 생성
    const generateBehaviorPatterns = (behaviors: UserBehavior[]): BehaviorPattern[] => {
        const patterns: BehaviorPattern[] = [];

        // 일일 패턴 분석
        const dailyPattern = analyzeDailyPattern(behaviors);
        if (dailyPattern.confidence > 0.7) {
            patterns.push(dailyPattern);
        }

        // 주간 패턴 분석
        const weeklyPattern = analyzeWeeklyPattern(behaviors);
        if (weeklyPattern.confidence > 0.7) {
            patterns.push(weeklyPattern);
        }

        return patterns;
    };

    // 일일 패턴 분석
    const analyzeDailyPattern = (behaviors: UserBehavior[]): BehaviorPattern => {
        const hours = behaviors.map(b => new Date(b.timestamp).getHours());
        const hourCounts = hours.reduce((acc, hour) => {
            acc[hour] = (acc[hour] || 0) + 1;
            return acc;
        }, {} as Record<number, number>);

        const peakHour = Object.entries(hourCounts)
            .sort(([, a], [, b]) => b - a)[0];

        const confidence = peakHour ? peakHour[1] / behaviors.length : 0;
        const description = peakHour
            ? `${peakHour[0]}시에 가장 활발한 활동을 보입니다.`
            : '명확한 일일 패턴이 없습니다.';

        return {
            type: 'daily',
            pattern: `peak_hour_${peakHour?.[0] || 'unknown'}`,
            confidence,
            description
        };
    };

    // 주간 패턴 분석
    const analyzeWeeklyPattern = (behaviors: UserBehavior[]): BehaviorPattern => {
        const days = behaviors.map(b => new Date(b.timestamp).getDay());
        const dayCounts = days.reduce((acc, day) => {
            acc[day] = (acc[day] || 0) + 1;
            return acc;
        }, {} as Record<number, number>);

        const peakDay = Object.entries(dayCounts)
            .sort(([, a], [, b]) => b - a)[0];

        const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
        const confidence = peakDay ? peakDay[1] / behaviors.length : 0;
        const description = peakDay
            ? `${dayNames[parseInt(peakDay[0])]}요일에 가장 활발한 활동을 보입니다.`
            : '명확한 주간 패턴이 없습니다.';

        return {
            type: 'weekly',
            pattern: `peak_day_${peakDay?.[0] || 'unknown'}`,
            confidence,
            description
        };
    };

    // 추천사항 생성
    const generateRecommendations = (analytics: BehaviorAnalytics): string[] => {
        const recommendations: string[] = [];

        if (analytics.bounceRate > 70) {
            recommendations.push('이탈률이 높습니다. 콘텐츠 품질을 개선하고 로딩 속도를 최적화하세요.');
        }

        if (analytics.clickThroughRate < 5) {
            recommendations.push('클릭률이 낮습니다. 더 매력적인 버튼과 링크를 사용하세요.');
        }

        if (analytics.scrollDepth < 30) {
            recommendations.push('스크롤 깊이가 낮습니다. 콘텐츠를 더 흥미롭게 만들어보세요.');
        }

        if (analytics.sessionDuration < 60000) { // 1분 미만
            recommendations.push('세션 지속 시간이 짧습니다. 사용자 참여를 높이는 기능을 추가하세요.');
        }

        if (analytics.engagementScore < 50) {
            recommendations.push('전반적인 참여도가 낮습니다. 사용자 경험을 개선하세요.');
        }

        return recommendations;
    };

    // 이상 행동 감지
    const detectAnomalies = (
        behaviors: UserBehavior[],
        analytics: BehaviorAnalytics
    ): AnomalyData[] => {
        const anomalies: AnomalyData[] = [];

        // 비정상적인 활동량 감지
        const recentBehaviors = behaviors.filter(b =>
            new Date(b.timestamp).getTime() > Date.now() - 24 * 60 * 60 * 1000
        );

        if (recentBehaviors.length > 1000) {
            anomalies.push({
                type: 'spike_in_usage',
                severity: 'high',
                description: '최근 24시간 동안 비정상적으로 높은 활동량이 감지되었습니다.',
                timestamp: new Date(),
                metrics: { activityCount: recentBehaviors.length }
            });
        }

        // 참여도 급감 감지
        if (analytics.engagementScore < 20) {
            anomalies.push({
                type: 'drop_in_engagement',
                severity: 'medium',
                description: '사용자 참여도가 크게 감소했습니다.',
                timestamp: new Date(),
                metrics: { engagementScore: analytics.engagementScore }
            });
        }

        return anomalies;
    };

    // 트렌드 분석
    const analyzeTrends = (behaviors: UserBehavior[]): TrendData[] => {
        const trends: TrendData[] = [];

        // 최근 7일 vs 이전 7일 비교
        const now = new Date();
        const recentWeek = behaviors.filter(b =>
            new Date(b.timestamp).getTime() > now.getTime() - 7 * 24 * 60 * 60 * 1000
        );
        const previousWeek = behaviors.filter(b => {
            const time = new Date(b.timestamp).getTime();
            return time > now.getTime() - 14 * 24 * 60 * 60 * 1000 &&
                time <= now.getTime() - 7 * 24 * 60 * 60 * 1000;
        });

        const recentActivity = recentWeek.length;
        const previousActivity = previousWeek.length;
        const change = previousActivity > 0
            ? ((recentActivity - previousActivity) / previousActivity) * 100
            : 0;

        trends.push({
            metric: '활동량',
            direction: change > 5 ? 'up' : change < -5 ? 'down' : 'stable',
            change: Math.abs(change),
            period: '7일',
            significance: Math.abs(change) / 100
        });

        return trends;
    };

    // 디바이스 타입 감지
    const detectDeviceType = (): 'mobile' | 'tablet' | 'desktop' => {
        const userAgent = navigator.userAgent.toLowerCase();
        if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent)) {
            return 'mobile';
        } else if (/tablet|ipad/i.test(userAgent)) {
            return 'tablet';
        } else {
            return 'desktop';
        }
    };

    // 세션 ID 생성
    const getSessionId = (): string => {
        let sessionId = sessionStorage.getItem('sessionId');
        if (!sessionId) {
            sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            sessionStorage.setItem('sessionId', sessionId);
        }
        return sessionId;
    };

    return {
        behaviorData,
        insights,
        loading,
        error,
        trackBehavior,
        trackPageView,
        trackClick,
        trackScrollDepth,
        trackTimeOnPage,
        fetchAnalytics,
        updateAnalytics
    };
};
