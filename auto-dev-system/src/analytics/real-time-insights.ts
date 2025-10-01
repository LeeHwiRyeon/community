import { EventEmitter } from 'events';
import { AdvancedEvent } from './advanced-event-logger';
import { Prediction, Recommendation, UserProfile } from './predictive-analytics';
import { multiModelManager } from '../ai/multi-model-manager';

// 인사이트 타입
export type InsightType =
    | 'trend' | 'anomaly' | 'opportunity' | 'risk' | 'performance'
    | 'user_behavior' | 'conversion' | 'engagement' | 'recommendation';

// 인사이트 우선순위
export type InsightPriority = 'low' | 'medium' | 'high' | 'critical';

// 인사이트 상태
export type InsightStatus = 'new' | 'acknowledged' | 'investigating' | 'resolved' | 'dismissed';

// 실시간 인사이트 인터페이스
export interface RealTimeInsight {
    id: string;
    type: InsightType;
    priority: InsightPriority;
    status: InsightStatus;
    title: string;
    description: string;
    summary: string;
    data: any;
    metrics: InsightMetrics;
    recommendations: string[];
    actions: InsightAction[];
    affectedUsers: string[];
    affectedSessions: string[];
    createdAt: Date;
    updatedAt: Date;
    expiresAt: Date;
    tags: string[];
    metadata: Record<string, any>;
}

// 인사이트 메트릭
export interface InsightMetrics {
    confidence: number;
    impact: number;
    urgency: number;
    frequency: number;
    trend: 'increasing' | 'decreasing' | 'stable' | 'volatile';
    baseline: number;
    current: number;
    change: number;
    changePercentage: number;
}

// 인사이트 액션
export interface InsightAction {
    id: string;
    type: 'notification' | 'alert' | 'automation' | 'investigation' | 'optimization';
    title: string;
    description: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    priority: InsightPriority;
    assignedTo?: string;
    dueDate?: Date;
    result?: any;
    createdAt: Date;
    completedAt?: Date;
}

// 알림 채널
export interface NotificationChannel {
    id: string;
    type: 'email' | 'slack' | 'webhook' | 'sms' | 'push' | 'dashboard';
    name: string;
    enabled: boolean;
    config: Record<string, any>;
    filters: NotificationFilter[];
}

// 알림 필터
export interface NotificationFilter {
    insightTypes: InsightType[];
    priorities: InsightPriority[];
    tags: string[];
    conditions: Record<string, any>;
}

// 실시간 인사이트 생성기
export class RealTimeInsightGenerator extends EventEmitter {
    private insights: Map<string, RealTimeInsight> = new Map();
    private channels: Map<string, NotificationChannel> = new Map();
    private subscriptions: Map<string, string[]> = new Map();
    private isEnabled: boolean = true;
    private processingInterval: NodeJS.Timeout | null = null;
    private lastProcessedTime: Date = new Date();

    constructor() {
        super();
        this.initializeDefaultChannels();
        this.startProcessing();
    }

    // 실시간 인사이트 생성
    async generateInsights(
        events: AdvancedEvent[],
        predictions: Prediction[],
        recommendations: Recommendation[],
        userProfiles: UserProfile[]
    ): Promise<RealTimeInsight[]> {
        if (!this.isEnabled) return [];

        const newInsights: RealTimeInsight[] = [];

        // 1. 트렌드 인사이트 생성
        const trendInsights = await this.generateTrendInsights(events, predictions);
        newInsights.push(...trendInsights);

        // 2. 이상 징후 인사이트 생성
        const anomalyInsights = await this.generateAnomalyInsights(events, predictions);
        newInsights.push(...anomalyInsights);

        // 3. 기회 인사이트 생성
        const opportunityInsights = await this.generateOpportunityInsights(events, recommendations, userProfiles);
        newInsights.push(...opportunityInsights);

        // 4. 위험 인사이트 생성
        const riskInsights = await this.generateRiskInsights(events, predictions, userProfiles);
        newInsights.push(...riskInsights);

        // 5. 성능 인사이트 생성
        const performanceInsights = await this.generatePerformanceInsights(events);
        newInsights.push(...performanceInsights);

        // 6. 사용자 행동 인사이트 생성
        const behaviorInsights = await this.generateBehaviorInsights(events, userProfiles);
        newInsights.push(...behaviorInsights);

        // 7. 전환 인사이트 생성
        const conversionInsights = await this.generateConversionInsights(events, predictions);
        newInsights.push(...conversionInsights);

        // 8. 참여도 인사이트 생성
        const engagementInsights = await this.generateEngagementInsights(events, userProfiles);
        newInsights.push(...engagementInsights);

        // 9. 추천 인사이트 생성
        const recommendationInsights = await this.generateRecommendationInsights(recommendations, userProfiles);
        newInsights.push(...recommendationInsights);

        // 인사이트 저장 및 알림 발송
        for (const insight of newInsights) {
            this.insights.set(insight.id, insight);
            await this.sendNotifications(insight);
            this.emit('insight', insight);
        }

        return newInsights;
    }

    // 트렌드 인사이트 생성
    private async generateTrendInsights(events: AdvancedEvent[], predictions: Prediction[]): Promise<RealTimeInsight[]> {
        const insights: RealTimeInsight[] = [];

        // AI 기반 트렌드 분석
        const trendAnalysis = await this.analyzeTrendsWithAI(events, predictions);

        for (const trend of trendAnalysis) {
            const insight: RealTimeInsight = {
                id: `trend_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                type: 'trend',
                priority: this.calculatePriority(trend.impact, trend.urgency),
                status: 'new',
                title: trend.title,
                description: trend.description,
                summary: trend.summary,
                data: trend.data,
                metrics: {
                    confidence: trend.confidence,
                    impact: trend.impact,
                    urgency: trend.urgency,
                    frequency: trend.frequency,
                    trend: trend.direction,
                    baseline: trend.baseline,
                    current: trend.current,
                    change: trend.change,
                    changePercentage: trend.changePercentage
                },
                recommendations: trend.recommendations,
                actions: this.generateActions(trend),
                affectedUsers: trend.affectedUsers,
                affectedSessions: trend.affectedSessions,
                createdAt: new Date(),
                updatedAt: new Date(),
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24시간 후 만료
                tags: ['trend', trend.category],
                metadata: { source: 'ai_analysis', category: trend.category }
            };

            insights.push(insight);
        }

        return insights;
    }

    // 이상 징후 인사이트 생성
    private async generateAnomalyInsights(events: AdvancedEvent[], predictions: Prediction[]): Promise<RealTimeInsight[]> {
        const insights: RealTimeInsight[] = [];

        // 이상 징후 탐지
        const anomalies = this.detectAnomalies(events, predictions);

        for (const anomaly of anomalies) {
            const insight: RealTimeInsight = {
                id: `anomaly_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                type: 'anomaly',
                priority: anomaly.severity === 'critical' ? 'critical' :
                    anomaly.severity === 'high' ? 'high' :
                        anomaly.severity === 'medium' ? 'medium' : 'low',
                status: 'new',
                title: `이상 징후 감지: ${anomaly.type}`,
                description: anomaly.description,
                summary: `시스템에서 ${anomaly.type} 이상 징후가 감지되었습니다.`,
                data: anomaly.data,
                metrics: {
                    confidence: anomaly.confidence,
                    impact: anomaly.impact,
                    urgency: anomaly.urgency,
                    frequency: anomaly.frequency,
                    trend: 'volatile',
                    baseline: anomaly.baseline,
                    current: anomaly.current,
                    change: anomaly.change,
                    changePercentage: anomaly.changePercentage
                },
                recommendations: anomaly.recommendations,
                actions: this.generateAnomalyActions(anomaly),
                affectedUsers: anomaly.affectedUsers,
                affectedSessions: anomaly.affectedSessions,
                createdAt: new Date(),
                updatedAt: new Date(),
                expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12시간 후 만료
                tags: ['anomaly', anomaly.type, anomaly.severity],
                metadata: { source: 'anomaly_detection', severity: anomaly.severity }
            };

            insights.push(insight);
        }

        return insights;
    }

    // 기회 인사이트 생성
    private async generateOpportunityInsights(
        events: AdvancedEvent[],
        recommendations: Recommendation[],
        userProfiles: UserProfile[]
    ): Promise<RealTimeInsight[]> {
        const insights: RealTimeInsight[] = [];

        // AI 기반 기회 분석
        const opportunities = await this.analyzeOpportunitiesWithAI(events, recommendations, userProfiles);

        for (const opportunity of opportunities) {
            const insight: RealTimeInsight = {
                id: `opportunity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                type: 'opportunity',
                priority: opportunity.potential > 0.8 ? 'high' : opportunity.potential > 0.5 ? 'medium' : 'low',
                status: 'new',
                title: `기회 발견: ${opportunity.title}`,
                description: opportunity.description,
                summary: `새로운 ${opportunity.type} 기회가 발견되었습니다.`,
                data: opportunity.data,
                metrics: {
                    confidence: opportunity.confidence,
                    impact: opportunity.potential,
                    urgency: opportunity.urgency,
                    frequency: opportunity.frequency,
                    trend: 'increasing',
                    baseline: opportunity.baseline,
                    current: opportunity.current,
                    change: opportunity.change,
                    changePercentage: opportunity.changePercentage
                },
                recommendations: opportunity.recommendations,
                actions: this.generateOpportunityActions(opportunity),
                affectedUsers: opportunity.affectedUsers,
                affectedSessions: opportunity.affectedSessions,
                createdAt: new Date(),
                updatedAt: new Date(),
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7일 후 만료
                tags: ['opportunity', opportunity.type],
                metadata: { source: 'opportunity_analysis', type: opportunity.type }
            };

            insights.push(insight);
        }

        return insights;
    }

    // 위험 인사이트 생성
    private async generateRiskInsights(
        events: AdvancedEvent[],
        predictions: Prediction[],
        userProfiles: UserProfile[]
    ): Promise<RealTimeInsight[]> {
        const insights: RealTimeInsight[] = [];

        // 위험 분석
        const risks = await this.analyzeRisksWithAI(events, predictions, userProfiles);

        for (const risk of risks) {
            const insight: RealTimeInsight = {
                id: `risk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                type: 'risk',
                priority: risk.severity === 'critical' ? 'critical' :
                    risk.severity === 'high' ? 'high' :
                        risk.severity === 'medium' ? 'medium' : 'low',
                status: 'new',
                title: `위험 감지: ${risk.title}`,
                description: risk.description,
                summary: `${risk.type} 위험이 감지되었습니다.`,
                data: risk.data,
                metrics: {
                    confidence: risk.confidence,
                    impact: risk.impact,
                    urgency: risk.urgency,
                    frequency: risk.frequency,
                    trend: 'increasing',
                    baseline: risk.baseline,
                    current: risk.current,
                    change: risk.change,
                    changePercentage: risk.changePercentage
                },
                recommendations: risk.recommendations,
                actions: this.generateRiskActions(risk),
                affectedUsers: risk.affectedUsers,
                affectedSessions: risk.affectedSessions,
                createdAt: new Date(),
                updatedAt: new Date(),
                expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6시간 후 만료
                tags: ['risk', risk.type, risk.severity],
                metadata: { source: 'risk_analysis', severity: risk.severity }
            };

            insights.push(insight);
        }

        return insights;
    }

    // 성능 인사이트 생성
    private async generatePerformanceInsights(events: AdvancedEvent[]): Promise<RealTimeInsight[]> {
        const insights: RealTimeInsight[] = [];

        // 성능 분석
        const performanceIssues = this.analyzePerformance(events);

        for (const issue of performanceIssues) {
            const insight: RealTimeInsight = {
                id: `performance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                type: 'performance',
                priority: issue.severity === 'critical' ? 'critical' :
                    issue.severity === 'high' ? 'high' :
                        issue.severity === 'medium' ? 'medium' : 'low',
                status: 'new',
                title: `성능 이슈: ${issue.title}`,
                description: issue.description,
                summary: `성능 문제가 감지되었습니다: ${issue.metric}`,
                data: issue.data,
                metrics: {
                    confidence: issue.confidence,
                    impact: issue.impact,
                    urgency: issue.urgency,
                    frequency: issue.frequency,
                    trend: issue.trend,
                    baseline: issue.baseline,
                    current: issue.current,
                    change: issue.change,
                    changePercentage: issue.changePercentage
                },
                recommendations: issue.recommendations,
                actions: this.generatePerformanceActions(issue),
                affectedUsers: issue.affectedUsers,
                affectedSessions: issue.affectedSessions,
                createdAt: new Date(),
                updatedAt: new Date(),
                expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4시간 후 만료
                tags: ['performance', issue.metric, issue.severity],
                metadata: { source: 'performance_analysis', metric: issue.metric }
            };

            insights.push(insight);
        }

        return insights;
    }

    // 사용자 행동 인사이트 생성
    private async generateBehaviorInsights(events: AdvancedEvent[], userProfiles: UserProfile[]): Promise<RealTimeInsight[]> {
        const insights: RealTimeInsight[] = [];

        // 행동 패턴 분석
        const behaviorPatterns = this.analyzeBehaviorPatterns(events, userProfiles);

        for (const pattern of behaviorPatterns) {
            const insight: RealTimeInsight = {
                id: `behavior_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                type: 'user_behavior',
                priority: pattern.significance > 0.8 ? 'high' : pattern.significance > 0.5 ? 'medium' : 'low',
                status: 'new',
                title: `행동 패턴: ${pattern.title}`,
                description: pattern.description,
                summary: `새로운 사용자 행동 패턴이 발견되었습니다.`,
                data: pattern.data,
                metrics: {
                    confidence: pattern.confidence,
                    impact: pattern.significance,
                    urgency: pattern.urgency,
                    frequency: pattern.frequency,
                    trend: pattern.trend,
                    baseline: pattern.baseline,
                    current: pattern.current,
                    change: pattern.change,
                    changePercentage: pattern.changePercentage
                },
                recommendations: pattern.recommendations,
                actions: this.generateBehaviorActions(pattern),
                affectedUsers: pattern.affectedUsers,
                affectedSessions: pattern.affectedSessions,
                createdAt: new Date(),
                updatedAt: new Date(),
                expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3일 후 만료
                tags: ['behavior', pattern.type],
                metadata: { source: 'behavior_analysis', pattern: pattern.type }
            };

            insights.push(insight);
        }

        return insights;
    }

    // 전환 인사이트 생성
    private async generateConversionInsights(events: AdvancedEvent[], predictions: Prediction[]): Promise<RealTimeInsight[]> {
        const insights: RealTimeInsight[] = [];

        // 전환 분석
        const conversionAnalysis = this.analyzeConversion(events, predictions);

        for (const analysis of conversionAnalysis) {
            const insight: RealTimeInsight = {
                id: `conversion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                type: 'conversion',
                priority: analysis.impact > 0.8 ? 'high' : analysis.impact > 0.5 ? 'medium' : 'low',
                status: 'new',
                title: `전환 분석: ${analysis.title}`,
                description: analysis.description,
                summary: `전환율 ${analysis.trend === 'increasing' ? '향상' : '저하'}가 감지되었습니다.`,
                data: analysis.data,
                metrics: {
                    confidence: analysis.confidence,
                    impact: analysis.impact,
                    urgency: analysis.urgency,
                    frequency: analysis.frequency,
                    trend: analysis.trend,
                    baseline: analysis.baseline,
                    current: analysis.current,
                    change: analysis.change,
                    changePercentage: analysis.changePercentage
                },
                recommendations: analysis.recommendations,
                actions: this.generateConversionActions(analysis),
                affectedUsers: analysis.affectedUsers,
                affectedSessions: analysis.affectedSessions,
                createdAt: new Date(),
                updatedAt: new Date(),
                expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2일 후 만료
                tags: ['conversion', analysis.funnel],
                metadata: { source: 'conversion_analysis', funnel: analysis.funnel }
            };

            insights.push(insight);
        }

        return insights;
    }

    // 참여도 인사이트 생성
    private async generateEngagementInsights(events: AdvancedEvent[], userProfiles: UserProfile[]): Promise<RealTimeInsight[]> {
        const insights: RealTimeInsight[] = [];

        // 참여도 분석
        const engagementAnalysis = this.analyzeEngagement(events, userProfiles);

        for (const analysis of engagementAnalysis) {
            const insight: RealTimeInsight = {
                id: `engagement_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                type: 'engagement',
                priority: analysis.impact > 0.8 ? 'high' : analysis.impact > 0.5 ? 'medium' : 'low',
                status: 'new',
                title: `참여도 분석: ${analysis.title}`,
                description: analysis.description,
                summary: `사용자 참여도 ${analysis.trend === 'increasing' ? '향상' : '저하'}가 감지되었습니다.`,
                data: analysis.data,
                metrics: {
                    confidence: analysis.confidence,
                    impact: analysis.impact,
                    urgency: analysis.urgency,
                    frequency: analysis.frequency,
                    trend: analysis.trend,
                    baseline: analysis.baseline,
                    current: analysis.current,
                    change: analysis.change,
                    changePercentage: analysis.changePercentage
                },
                recommendations: analysis.recommendations,
                actions: this.generateEngagementActions(analysis),
                affectedUsers: analysis.affectedUsers,
                affectedSessions: analysis.affectedSessions,
                createdAt: new Date(),
                updatedAt: new Date(),
                expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5일 후 만료
                tags: ['engagement', analysis.segment],
                metadata: { source: 'engagement_analysis', segment: analysis.segment }
            };

            insights.push(insight);
        }

        return insights;
    }

    // 추천 인사이트 생성
    private async generateRecommendationInsights(
        recommendations: Recommendation[],
        userProfiles: UserProfile[]
    ): Promise<RealTimeInsight[]> {
        const insights: RealTimeInsight[] = [];

        // 추천 성능 분석
        const recommendationAnalysis = this.analyzeRecommendations(recommendations, userProfiles);

        for (const analysis of recommendationAnalysis) {
            const insight: RealTimeInsight = {
                id: `recommendation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                type: 'recommendation',
                priority: analysis.impact > 0.8 ? 'high' : analysis.impact > 0.5 ? 'medium' : 'low',
                status: 'new',
                title: `추천 분석: ${analysis.title}`,
                description: analysis.description,
                summary: `추천 시스템 ${analysis.trend === 'increasing' ? '성능 향상' : '성능 저하'}가 감지되었습니다.`,
                data: analysis.data,
                metrics: {
                    confidence: analysis.confidence,
                    impact: analysis.impact,
                    urgency: analysis.urgency,
                    frequency: analysis.frequency,
                    trend: analysis.trend,
                    baseline: analysis.baseline,
                    current: analysis.current,
                    change: analysis.change,
                    changePercentage: analysis.changePercentage
                },
                recommendations: analysis.recommendations,
                actions: this.generateRecommendationActions(analysis),
                affectedUsers: analysis.affectedUsers,
                affectedSessions: analysis.affectedSessions,
                createdAt: new Date(),
                updatedAt: new Date(),
                expiresAt: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // 6일 후 만료
                tags: ['recommendation', analysis.engine],
                metadata: { source: 'recommendation_analysis', engine: analysis.engine }
            };

            insights.push(insight);
        }

        return insights;
    }

    // 알림 발송
    private async sendNotifications(insight: RealTimeInsight): Promise<void> {
        for (const channel of this.channels.values()) {
            if (!channel.enabled) continue;

            if (this.shouldSendNotification(insight, channel)) {
                try {
                    await this.sendToChannel(insight, channel);
                } catch (error) {
                    console.warn(`Failed to send notification to channel ${channel.id}:`, error);
                }
            }
        }
    }

    // 채널별 알림 발송
    private async sendToChannel(insight: RealTimeInsight, channel: NotificationChannel): Promise<void> {
        switch (channel.type) {
            case 'email':
                await this.sendEmailNotification(insight, channel);
                break;
            case 'slack':
                await this.sendSlackNotification(insight, channel);
                break;
            case 'webhook':
                await this.sendWebhookNotification(insight, channel);
                break;
            case 'sms':
                await this.sendSMSNotification(insight, channel);
                break;
            case 'push':
                await this.sendPushNotification(insight, channel);
                break;
            case 'dashboard':
                await this.sendDashboardNotification(insight, channel);
                break;
        }
    }

    // 이메일 알림 발송
    private async sendEmailNotification(insight: RealTimeInsight, channel: NotificationChannel): Promise<void> {
        // 이메일 발송 로직
        console.log(`Sending email notification for insight ${insight.id}`);
    }

    // Slack 알림 발송
    private async sendSlackNotification(insight: RealTimeInsight, channel: NotificationChannel): Promise<void> {
        // Slack 발송 로직
        console.log(`Sending Slack notification for insight ${insight.id}`);
    }

    // 웹훅 알림 발송
    private async sendWebhookNotification(insight: RealTimeInsight, channel: NotificationChannel): Promise<void> {
        // 웹훅 발송 로직
        console.log(`Sending webhook notification for insight ${insight.id}`);
    }

    // SMS 알림 발송
    private async sendSMSNotification(insight: RealTimeInsight, channel: NotificationChannel): Promise<void> {
        // SMS 발송 로직
        console.log(`Sending SMS notification for insight ${insight.id}`);
    }

    // 푸시 알림 발송
    private async sendPushNotification(insight: RealTimeInsight, channel: NotificationChannel): Promise<void> {
        // 푸시 발송 로직
        console.log(`Sending push notification for insight ${insight.id}`);
    }

    // 대시보드 알림 발송
    private async sendDashboardNotification(insight: RealTimeInsight, channel: NotificationChannel): Promise<void> {
        // 대시보드 알림 로직
        console.log(`Sending dashboard notification for insight ${insight.id}`);
    }

    // 알림 발송 여부 확인
    private shouldSendNotification(insight: RealTimeInsight, channel: NotificationChannel): boolean {
        for (const filter of channel.filters) {
            if (filter.insightTypes.includes(insight.type) &&
                filter.priorities.includes(insight.priority)) {
                return true;
            }
        }
        return false;
    }

    // AI 기반 트렌드 분석
    private async analyzeTrendsWithAI(events: AdvancedEvent[], predictions: Prediction[]): Promise<any[]> {
        const prompt = this.buildTrendAnalysisPrompt(events, predictions);

        try {
            const response = await multiModelManager.executeRequest(
                prompt,
                'analysis',
                'high'
            );

            return this.parseTrendAnalysisResponse(response.content);
        } catch (error) {
            console.warn('AI trend analysis failed:', error);
            return [];
        }
    }

    // AI 기반 기회 분석
    private async analyzeOpportunitiesWithAI(
        events: AdvancedEvent[],
        recommendations: Recommendation[],
        userProfiles: UserProfile[]
    ): Promise<any[]> {
        const prompt = this.buildOpportunityAnalysisPrompt(events, recommendations, userProfiles);

        try {
            const response = await multiModelManager.executeRequest(
                prompt,
                'analysis',
                'high'
            );

            return this.parseOpportunityAnalysisResponse(response.content);
        } catch (error) {
            console.warn('AI opportunity analysis failed:', error);
            return [];
        }
    }

    // AI 기반 위험 분석
    private async analyzeRisksWithAI(
        events: AdvancedEvent[],
        predictions: Prediction[],
        userProfiles: UserProfile[]
    ): Promise<any[]> {
        const prompt = this.buildRiskAnalysisPrompt(events, predictions, userProfiles);

        try {
            const response = await multiModelManager.executeRequest(
                prompt,
                'analysis',
                'high'
            );

            return this.parseRiskAnalysisResponse(response.content);
        } catch (error) {
            console.warn('AI risk analysis failed:', error);
            return [];
        }
    }

    // 헬퍼 메서드들
    private calculatePriority(impact: number, urgency: number): InsightPriority {
        const score = impact * 0.6 + urgency * 0.4;
        if (score > 0.8) return 'critical';
        if (score > 0.6) return 'high';
        if (score > 0.4) return 'medium';
        return 'low';
    }

    private generateActions(data: any): InsightAction[] {
        return [
            {
                id: `action_${Date.now()}`,
                type: 'investigation',
                title: '상세 조사',
                description: '인사이트에 대한 상세 조사를 수행합니다.',
                status: 'pending',
                priority: 'medium',
                createdAt: new Date()
            }
        ];
    }

    private generateAnomalyActions(anomaly: any): InsightAction[] {
        return [
            {
                id: `anomaly_action_${Date.now()}`,
                type: 'alert',
                title: '이상 징후 알림',
                description: '관련 팀에 이상 징후를 알립니다.',
                status: 'pending',
                priority: 'high',
                createdAt: new Date()
            }
        ];
    }

    private generateOpportunityActions(opportunity: any): InsightAction[] {
        return [
            {
                id: `opportunity_action_${Date.now()}`,
                type: 'optimization',
                title: '기회 활용',
                description: '발견된 기회를 활용합니다.',
                status: 'pending',
                priority: 'medium',
                createdAt: new Date()
            }
        ];
    }

    private generateRiskActions(risk: any): InsightAction[] {
        return [
            {
                id: `risk_action_${Date.now()}`,
                type: 'alert',
                title: '위험 대응',
                description: '위험에 대한 대응 조치를 취합니다.',
                status: 'pending',
                priority: 'high',
                createdAt: new Date()
            }
        ];
    }

    private generatePerformanceActions(issue: any): InsightAction[] {
        return [
            {
                id: `performance_action_${Date.now()}`,
                type: 'optimization',
                title: '성능 최적화',
                description: '성능 문제를 해결합니다.',
                status: 'pending',
                priority: 'medium',
                createdAt: new Date()
            }
        ];
    }

    private generateBehaviorActions(pattern: any): InsightAction[] {
        return [
            {
                id: `behavior_action_${Date.now()}`,
                type: 'investigation',
                title: '행동 패턴 분석',
                description: '행동 패턴을 상세히 분석합니다.',
                status: 'pending',
                priority: 'low',
                createdAt: new Date()
            }
        ];
    }

    private generateConversionActions(analysis: any): InsightAction[] {
        return [
            {
                id: `conversion_action_${Date.now()}`,
                type: 'optimization',
                title: '전환 최적화',
                description: '전환율을 개선합니다.',
                status: 'pending',
                priority: 'medium',
                createdAt: new Date()
            }
        ];
    }

    private generateEngagementActions(analysis: any): InsightAction[] {
        return [
            {
                id: `engagement_action_${Date.now()}`,
                type: 'optimization',
                title: '참여도 향상',
                description: '사용자 참여도를 향상시킵니다.',
                status: 'pending',
                priority: 'medium',
                createdAt: new Date()
            }
        ];
    }

    private generateRecommendationActions(analysis: any): InsightAction[] {
        return [
            {
                id: `recommendation_action_${Date.now()}`,
                type: 'optimization',
                title: '추천 시스템 개선',
                description: '추천 시스템을 개선합니다.',
                status: 'pending',
                priority: 'medium',
                createdAt: new Date()
            }
        ];
    }

    // 분석 메서드들 (구현 생략)
    private detectAnomalies(events: AdvancedEvent[], predictions: Prediction[]): any[] { return []; }
    private analyzePerformance(events: AdvancedEvent[]): any[] { return []; }
    private analyzeBehaviorPatterns(events: AdvancedEvent[], userProfiles: UserProfile[]): any[] { return []; }
    private analyzeConversion(events: AdvancedEvent[], predictions: Prediction[]): any[] { return []; }
    private analyzeEngagement(events: AdvancedEvent[], userProfiles: UserProfile[]): any[] { return []; }
    private analyzeRecommendations(recommendations: Recommendation[], userProfiles: UserProfile[]): any[] { return []; }

    // 프롬프트 구성 메서드들
    private buildTrendAnalysisPrompt(events: AdvancedEvent[], predictions: Prediction[]): string {
        return `Analyze trends in events and predictions: ${JSON.stringify(events.slice(0, 10))}`;
    }

    private buildOpportunityAnalysisPrompt(events: AdvancedEvent[], recommendations: Recommendation[], userProfiles: UserProfile[]): string {
        return `Analyze opportunities from events, recommendations, and user profiles`;
    }

    private buildRiskAnalysisPrompt(events: AdvancedEvent[], predictions: Prediction[], userProfiles: UserProfile[]): string {
        return `Analyze risks from events, predictions, and user profiles`;
    }

    // 응답 파싱 메서드들
    private parseTrendAnalysisResponse(content: string): any[] {
        try {
            const jsonMatch = content.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            return [];
        } catch (error) {
            return [];
        }
    }

    private parseOpportunityAnalysisResponse(content: string): any[] {
        try {
            const jsonMatch = content.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            return [];
        } catch (error) {
            return [];
        }
    }

    private parseRiskAnalysisResponse(content: string): any[] {
        try {
            const jsonMatch = content.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            return [];
        } catch (error) {
            return [];
        }
    }

    // 기본 채널 초기화
    private initializeDefaultChannels(): void {
        const channels: NotificationChannel[] = [
            {
                id: 'email_alerts',
                type: 'email',
                name: 'Email Alerts',
                enabled: true,
                config: { smtp: 'smtp.example.com', port: 587 },
                filters: [
                    {
                        insightTypes: ['anomaly', 'risk', 'performance'],
                        priorities: ['critical', 'high'],
                        tags: [],
                        conditions: {}
                    }
                ]
            },
            {
                id: 'slack_notifications',
                type: 'slack',
                name: 'Slack Notifications',
                enabled: true,
                config: { webhook: 'https://hooks.slack.com/...' },
                filters: [
                    {
                        insightTypes: ['trend', 'opportunity', 'conversion'],
                        priorities: ['high', 'medium'],
                        tags: [],
                        conditions: {}
                    }
                ]
            },
            {
                id: 'dashboard_alerts',
                type: 'dashboard',
                name: 'Dashboard Alerts',
                enabled: true,
                config: {},
                filters: [
                    {
                        insightTypes: ['trend', 'anomaly', 'opportunity', 'risk', 'performance'],
                        priorities: ['critical', 'high', 'medium'],
                        tags: [],
                        conditions: {}
                    }
                ]
            }
        ];

        channels.forEach(channel => this.channels.set(channel.id, channel));
    }

    // 처리 시작
    private startProcessing(): void {
        this.processingInterval = setInterval(() => {
            this.processInsights();
        }, 30000); // 30초마다 처리
    }

    // 인사이트 처리
    private processInsights(): void {
        // 만료된 인사이트 정리
        const now = new Date();
        for (const [id, insight] of this.insights.entries()) {
            if (insight.expiresAt < now) {
                this.insights.delete(id);
            }
        }
    }

    // 공개 메서드들
    getInsights(type?: InsightType, priority?: InsightPriority): RealTimeInsight[] {
        let insights = Array.from(this.insights.values());

        if (type) {
            insights = insights.filter(i => i.type === type);
        }

        if (priority) {
            insights = insights.filter(i => i.priority === priority);
        }

        return insights.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    getInsight(id: string): RealTimeInsight | undefined {
        return this.insights.get(id);
    }

    updateInsightStatus(id: string, status: InsightStatus): boolean {
        const insight = this.insights.get(id);
        if (insight) {
            insight.status = status;
            insight.updatedAt = new Date();
            return true;
        }
        return false;
    }

    addChannel(channel: NotificationChannel): void {
        this.channels.set(channel.id, channel);
    }

    removeChannel(channelId: string): boolean {
        return this.channels.delete(channelId);
    }

    enable(): void {
        this.isEnabled = true;
    }

    disable(): void {
        this.isEnabled = false;
    }

    destroy(): void {
        if (this.processingInterval) {
            clearInterval(this.processingInterval);
        }
        this.removeAllListeners();
    }
}

// 싱글톤 인스턴스
export const realTimeInsightGenerator = new RealTimeInsightGenerator();
