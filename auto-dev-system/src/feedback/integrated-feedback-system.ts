import { FeedbackCollector } from './feedback-collector';
import { FeedbackAnalyzer } from './feedback-analyzer';
import { FeedbackProcessor } from './feedback-processor';
import { CodeFile, UserFeedback, Issue } from '@/types';

export class IntegratedFeedbackSystem {
    private feedbackCollector: FeedbackCollector;
    private feedbackAnalyzer: FeedbackAnalyzer;
    private feedbackProcessor: FeedbackProcessor;
    private projectPath: string;

    constructor(openaiApiKey: string, projectPath: string = './generated-projects') {
        this.projectPath = projectPath;
        this.feedbackCollector = new FeedbackCollector(openaiApiKey, projectPath);
        this.feedbackAnalyzer = new FeedbackAnalyzer(openaiApiKey, projectPath);
        this.feedbackProcessor = new FeedbackProcessor(openaiApiKey, projectPath);
    }

    /**
     * 통합 피드백 시스템 실행
     */
    async runIntegratedFeedbackSystem(sourceFiles: CodeFile[]): Promise<IntegratedFeedbackResult> {
        console.log('🔄 통합 피드백 시스템 시작...');

        try {
            // 1. 피드백 수집
            console.log('📝 1단계: 피드백 수집');
            const collectionResult = await this.feedbackCollector.collectFeedback(sourceFiles);

            // 2. 피드백 분석
            console.log('🔍 2단계: 피드백 분석');
            const analysisResult = await this.feedbackAnalyzer.analyzeFeedback(collectionResult);

            // 3. 피드백 처리
            console.log('⚙️ 3단계: 피드백 처리');
            const processingResult = await this.feedbackProcessor.processFeedback(
                collectionResult,
                analysisResult
            );

            // 4. 통합 분석
            console.log('🔗 4단계: 통합 분석');
            const integratedAnalysis = await this.performIntegratedAnalysis(
                collectionResult,
                analysisResult,
                processingResult
            );

            // 5. 액션 계획 생성
            console.log('📋 5단계: 액션 계획 생성');
            const actionPlan = await this.generateActionPlan(integratedAnalysis);

            // 6. 성과 예측
            console.log('🔮 6단계: 성과 예측');
            const performancePrediction = await this.predictPerformance(integratedAnalysis);

            // 7. 통합 리포트 생성
            console.log('📊 7단계: 통합 리포트 생성');
            const report = await this.generateIntegratedReport(
                collectionResult,
                analysisResult,
                processingResult,
                integratedAnalysis,
                actionPlan,
                performancePrediction
            );

            console.log('✅ 통합 피드백 시스템 완료');

            return {
                collectionResult,
                analysisResult,
                processingResult,
                integratedAnalysis,
                actionPlan,
                performancePrediction,
                report,
                summary: this.generateIntegratedSummary(
                    integratedAnalysis,
                    actionPlan,
                    performancePrediction
                )
            };

        } catch (error) {
            console.error('❌ 통합 피드백 시스템 실패:', error);
            throw error;
        }
    }

    /**
     * 통합 분석 수행
     */
    private async performIntegratedAnalysis(
        collectionResult: any,
        analysisResult: any,
        processingResult: any
    ): Promise<IntegratedAnalysis> {
        console.log('🔍 통합 분석 수행 중...');

        const analysis: IntegratedAnalysis = {
            overallHealth: 0,
            feedbackQuality: {
                completeness: collectionResult.qualityValidation.completeness,
                accuracy: collectionResult.qualityValidation.accuracy,
                relevance: collectionResult.qualityValidation.relevance,
                timeliness: collectionResult.qualityValidation.timeliness
            },
            sentimentTrends: {
                current: analysisResult.sentimentAnalysis.overall.score,
                trend: this.calculateSentimentTrend(analysisResult.sentimentAnalysis.trends),
                prediction: this.predictSentimentTrend(analysisResult.sentimentAnalysis.trends)
            },
            priorityDistribution: {
                critical: processingResult.classification.priorities.critical || 0,
                high: processingResult.classification.priorities.high || 0,
                medium: processingResult.classification.priorities.medium || 0,
                low: processingResult.classification.priorities.low || 0
            },
            processingEfficiency: {
                autoResolutionRate: processingResult.autoResolution.autoResolutionRate,
                manualQueueSize: processingResult.manualQueue.highPriority.length +
                    processingResult.manualQueue.mediumPriority.length,
                averageResolutionTime: this.calculateAverageResolutionTime(processingResult),
                successRate: this.calculateSuccessRate(processingResult)
            },
            insights: [],
            recommendations: [],
            risks: [],
            opportunities: []
        };

        // 전체 건강도 계산
        analysis.overallHealth = this.calculateOverallHealth(analysis);

        // 인사이트 생성
        analysis.insights = await this.generateIntegratedInsights(analysis);

        // 권장사항 생성
        analysis.recommendations = await this.generateIntegratedRecommendations(analysis);

        // 위험 요소 식별
        analysis.risks = await this.identifyRisks(analysis);

        // 기회 요소 식별
        analysis.opportunities = await this.identifyOpportunities(analysis);

        return analysis;
    }

    /**
     * 액션 계획 생성
     */
    private async generateActionPlan(analysis: IntegratedAnalysis): Promise<ActionPlan> {
        console.log('📋 액션 계획 생성 중...');

        const plan: ActionPlan = {
            phases: [],
            timeline: 0,
            resources: {
                teamMembers: 0,
                budget: 0,
                tools: []
            },
            successMetrics: [],
            risks: [],
            dependencies: []
        };

        // 단계별 계획 생성
        const phases = this.createActionPhases(analysis);
        plan.phases = phases;

        // 전체 타임라인 계산
        plan.timeline = phases.reduce((sum, phase) => sum + phase.duration, 0);

        // 리소스 계산
        plan.resources = this.calculateRequiredResources(phases);

        // 성공 지표 설정
        plan.successMetrics = this.defineSuccessMetrics(analysis);

        // 위험 요소 식별
        plan.risks = analysis.risks;

        // 의존성 식별
        plan.dependencies = this.identifyDependencies(phases);

        return plan;
    }

    /**
     * 성과 예측
     */
    private async predictPerformance(analysis: IntegratedAnalysis): Promise<PerformancePrediction> {
        console.log('🔮 성과 예측 중...');

        const prediction: PerformancePrediction = {
            current: {
                health: analysis.overallHealth,
                satisfaction: analysis.sentimentTrends.current,
                efficiency: analysis.processingEfficiency.autoResolutionRate,
                quality: analysis.feedbackQuality.completeness
            },
            predicted: {
                health: 0,
                satisfaction: 0,
                efficiency: 0,
                quality: 0
            },
            improvements: {
                health: 0,
                satisfaction: 0,
                efficiency: 0,
                quality: 0
            },
            confidence: 0,
            timeframe: 'next_30_days',
            recommendations: []
        };

        // 예측 계산
        prediction.predicted.health = Math.min(10, analysis.overallHealth + 1.5);
        prediction.predicted.satisfaction = Math.min(10, analysis.sentimentTrends.current + 0.8);
        prediction.predicted.efficiency = Math.min(1, analysis.processingEfficiency.autoResolutionRate + 0.2);
        prediction.predicted.quality = Math.min(10, analysis.feedbackQuality.completeness + 1.2);

        // 개선도 계산
        prediction.improvements.health = prediction.predicted.health - prediction.current.health;
        prediction.improvements.satisfaction = prediction.predicted.satisfaction - prediction.current.satisfaction;
        prediction.improvements.efficiency = prediction.predicted.efficiency - prediction.current.efficiency;
        prediction.improvements.quality = prediction.predicted.quality - prediction.current.quality;

        // 신뢰도 계산
        prediction.confidence = this.calculatePredictionConfidence(analysis);

        // 권장사항 생성
        prediction.recommendations = this.generatePredictionRecommendations(prediction);

        return prediction;
    }

    // 헬퍼 메서드들
    private calculateSentimentTrend(trends: any[]): 'up' | 'down' | 'stable' {
        if (trends.length === 0) return 'stable';

        const positiveTrends = trends.filter(t => t.name.includes('positive') && t.direction === 'up');
        const negativeTrends = trends.filter(t => t.name.includes('negative') && t.direction === 'up');

        if (positiveTrends.length > negativeTrends.length) return 'up';
        if (negativeTrends.length > positiveTrends.length) return 'down';
        return 'stable';
    }

    private predictSentimentTrend(trends: any[]): number {
        // 실제 구현에서는 트렌드 예측
        return 0.6;
    }

    private calculateAverageResolutionTime(processingResult: any): number {
        // 실제 구현에서는 평균 해결 시간 계산
        return 2.5; // 일
    }

    private calculateSuccessRate(processingResult: any): number {
        const total = processingResult.autoResolution.resolvedItems.length +
            processingResult.autoResolution.failedItems.length;

        if (total === 0) return 0;

        return processingResult.autoResolution.resolvedItems.length / total;
    }

    private calculateOverallHealth(analysis: IntegratedAnalysis): number {
        const healthFactors = [
            analysis.feedbackQuality.completeness,
            analysis.feedbackQuality.accuracy,
            analysis.feedbackQuality.relevance,
            analysis.feedbackQuality.timeliness,
            analysis.sentimentTrends.current,
            analysis.processingEfficiency.autoResolutionRate * 10,
            analysis.processingEfficiency.successRate * 10
        ];

        return healthFactors.reduce((sum, factor) => sum + factor, 0) / healthFactors.length;
    }

    private async generateIntegratedInsights(analysis: IntegratedAnalysis): Promise<Insight[]> {
        const insights: Insight[] = [];

        // 피드백 품질 인사이트
        if (analysis.feedbackQuality.completeness < 7) {
            insights.push({
                id: this.generateId(),
                type: 'quality',
                title: '피드백 품질 개선 필요',
                description: '피드백 수집의 완전성이 낮습니다.',
                impact: 'medium',
                confidence: 0.8,
                recommendations: ['피드백 수집 프로세스 개선', '사용자 참여도 향상']
            });
        }

        // 감정 트렌드 인사이트
        if (analysis.sentimentTrends.trend === 'down') {
            insights.push({
                id: this.generateId(),
                type: 'sentiment',
                title: '사용자 만족도 하락',
                description: '사용자 만족도가 하락하는 추세입니다.',
                impact: 'high',
                confidence: 0.7,
                recommendations: ['사용자 경험 개선', '문제 해결 우선순위 조정']
            });
        }

        // 처리 효율성 인사이트
        if (analysis.processingEfficiency.autoResolutionRate < 0.5) {
            insights.push({
                id: this.generateId(),
                type: 'efficiency',
                title: '자동 해결률 개선 필요',
                description: '자동 해결률이 낮습니다.',
                impact: 'medium',
                confidence: 0.6,
                recommendations: ['자동화 규칙 개선', 'AI 모델 업데이트']
            });
        }

        return insights;
    }

    private async generateIntegratedRecommendations(analysis: IntegratedAnalysis): Promise<string[]> {
        const recommendations: string[] = [];

        if (analysis.overallHealth < 6) {
            recommendations.push('전체적인 피드백 시스템 건강도를 개선하세요.');
        }

        if (analysis.sentimentTrends.current < 5) {
            recommendations.push('사용자 만족도를 높이기 위한 조치를 취하세요.');
        }

        if (analysis.processingEfficiency.autoResolutionRate < 0.3) {
            recommendations.push('자동 해결 시스템을 개선하세요.');
        }

        return recommendations;
    }

    private async identifyRisks(analysis: IntegratedAnalysis): Promise<Risk[]> {
        const risks: Risk[] = [];

        if (analysis.sentimentTrends.trend === 'down') {
            risks.push({
                id: this.generateId(),
                type: 'sentiment_decline',
                severity: 'high',
                probability: 0.7,
                impact: '사용자 이탈 증가',
                mitigation: '즉시 사용자 경험 개선 조치'
            });
        }

        if (analysis.processingEfficiency.manualQueueSize > 20) {
            risks.push({
                id: this.generateId(),
                type: 'queue_overflow',
                severity: 'medium',
                probability: 0.6,
                impact: '처리 지연 및 사용자 불만',
                mitigation: '리소스 추가 배정 또는 우선순위 조정'
            });
        }

        return risks;
    }

    private async identifyOpportunities(analysis: IntegratedAnalysis): Promise<Opportunity[]> {
        const opportunities: Opportunity[] = [];

        if (analysis.processingEfficiency.autoResolutionRate > 0.7) {
            opportunities.push({
                id: this.generateId(),
                type: 'automation_expansion',
                description: '자동화를 더 많은 영역으로 확장할 수 있습니다.',
                potential: 'high',
                effort: 'medium',
                impact: '효율성 대폭 향상'
            });
        }

        if (analysis.sentimentTrends.current > 7) {
            opportunities.push({
                id: this.generateId(),
                type: 'user_advocacy',
                description: '만족도가 높은 사용자들을 활용한 마케팅 기회',
                potential: 'medium',
                effort: 'low',
                impact: '브랜드 인지도 향상'
            });
        }

        return opportunities;
    }

    private createActionPhases(analysis: IntegratedAnalysis): ActionPhase[] {
        const phases: ActionPhase[] = [];

        // 긴급 대응 단계
        if (analysis.priorityDistribution.critical > 0) {
            phases.push({
                phase: 1,
                name: '긴급 대응',
                description: '긴급한 피드백 처리',
                duration: 1, // 주
                priority: 'critical',
                tasks: ['긴급 피드백 검토', '즉시 해결 가능한 문제 처리'],
                resources: ['전체 팀'],
                dependencies: []
            });
        }

        // 고우선순위 개선 단계
        if (analysis.priorityDistribution.high > 5) {
            phases.push({
                phase: 2,
                name: '고우선순위 개선',
                description: '고우선순위 피드백 처리',
                duration: 2, // 주
                priority: 'high',
                tasks: ['고우선순위 피드백 분석', '개선 방안 구현'],
                resources: ['개발팀', '디자인팀'],
                dependencies: ['긴급 대응 완료']
            });
        }

        // 시스템 개선 단계
        if (analysis.processingEfficiency.autoResolutionRate < 0.5) {
            phases.push({
                phase: 3,
                name: '시스템 개선',
                description: '피드백 처리 시스템 개선',
                duration: 4, // 주
                priority: 'medium',
                tasks: ['자동화 규칙 개선', 'AI 모델 업데이트', '프로세스 최적화'],
                resources: ['개발팀', 'AI팀'],
                dependencies: ['고우선순위 개선 완료']
            });
        }

        return phases;
    }

    private calculateRequiredResources(phases: ActionPhase[]): ResourceRequirement {
        const teamMembers = phases.reduce((sum, phase) => {
            return sum + (phase.resources.includes('전체 팀') ? 10 :
                phase.resources.includes('개발팀') ? 5 :
                    phase.resources.includes('디자인팀') ? 3 : 2);
        }, 0);

        const budget = phases.length * 10000; // 단계당 10,000

        const tools = ['피드백 분석 도구', '자동화 플랫폼', '모니터링 시스템'];

        return {
            teamMembers,
            budget,
            tools
        };
    }

    private defineSuccessMetrics(analysis: IntegratedAnalysis): SuccessMetric[] {
        return [
            {
                name: '전체 건강도',
                current: analysis.overallHealth,
                target: 8.0,
                unit: 'score'
            },
            {
                name: '사용자 만족도',
                current: analysis.sentimentTrends.current,
                target: 8.0,
                unit: 'score'
            },
            {
                name: '자동 해결률',
                current: analysis.processingEfficiency.autoResolutionRate,
                target: 0.8,
                unit: 'ratio'
            },
            {
                name: '처리 시간',
                current: analysis.processingEfficiency.averageResolutionTime,
                target: 1.0,
                unit: 'days'
            }
        ];
    }

    private identifyDependencies(phases: ActionPhase[]): string[] {
        const dependencies: string[] = [];

        for (const phase of phases) {
            dependencies.push(...phase.dependencies);
        }

        return [...new Set(dependencies)];
    }

    private calculatePredictionConfidence(analysis: IntegratedAnalysis): number {
        let confidence = 0.5; // 기본 신뢰도

        // 데이터 품질이 좋을수록 신뢰도 증가
        if (analysis.feedbackQuality.completeness > 8) confidence += 0.2;
        if (analysis.feedbackQuality.accuracy > 8) confidence += 0.2;

        // 트렌드가 명확할수록 신뢰도 증가
        if (analysis.sentimentTrends.trend !== 'stable') confidence += 0.1;

        return Math.min(1.0, confidence);
    }

    private generatePredictionRecommendations(prediction: PerformancePrediction): string[] {
        const recommendations: string[] = [];

        if (prediction.confidence < 0.7) {
            recommendations.push('예측 신뢰도가 낮습니다. 더 많은 데이터를 수집하세요.');
        }

        if (prediction.improvements.health < 1) {
            recommendations.push('전체적인 개선이 필요합니다.');
        }

        return recommendations;
    }

    private async generateIntegratedReport(
        collectionResult: any,
        analysisResult: any,
        processingResult: any,
        integratedAnalysis: IntegratedAnalysis,
        actionPlan: ActionPlan,
        performancePrediction: PerformancePrediction
    ): Promise<string> {
        const report = {
            summary: this.generateIntegratedSummary(integratedAnalysis, actionPlan, performancePrediction),
            collectionResult,
            analysisResult,
            processingResult,
            integratedAnalysis,
            actionPlan,
            performancePrediction,
            generatedAt: new Date().toISOString()
        };

        const reportPath = path.join(this.projectPath, 'integrated-feedback-report.json');
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

        return reportPath;
    }

    private generateIntegratedSummary(
        analysis: IntegratedAnalysis,
        actionPlan: ActionPlan,
        prediction: PerformancePrediction
    ): IntegratedFeedbackSummary {
        return {
            overallHealth: analysis.overallHealth,
            sentimentScore: analysis.sentimentTrends.current,
            autoResolutionRate: analysis.processingEfficiency.autoResolutionRate,
            totalInsights: analysis.insights.length,
            totalRecommendations: analysis.recommendations.length,
            actionPhases: actionPlan.phases.length,
            predictedImprovement: prediction.improvements.health,
            confidence: prediction.confidence,
            status: this.determineIntegratedStatus(analysis, prediction)
        };
    }

    private determineIntegratedStatus(
        analysis: IntegratedAnalysis,
        prediction: PerformancePrediction
    ): 'excellent' | 'good' | 'fair' | 'poor' {
        const currentScore = analysis.overallHealth;
        const predictedScore = prediction.predicted.health;
        const avgScore = (currentScore + predictedScore) / 2;

        if (avgScore >= 8) return 'excellent';
        if (avgScore >= 6) return 'good';
        if (avgScore >= 4) return 'fair';
        return 'poor';
    }

    private generateId(): string {
        return Math.random().toString(36).substr(2, 9);
    }
}

// 타입 정의
interface IntegratedFeedbackResult {
    collectionResult: any;
    analysisResult: any;
    processingResult: any;
    integratedAnalysis: IntegratedAnalysis;
    actionPlan: ActionPlan;
    performancePrediction: PerformancePrediction;
    report: string;
    summary: IntegratedFeedbackSummary;
}

interface IntegratedAnalysis {
    overallHealth: number;
    feedbackQuality: {
        completeness: number;
        accuracy: number;
        relevance: number;
        timeliness: number;
    };
    sentimentTrends: {
        current: number;
        trend: 'up' | 'down' | 'stable';
        prediction: number;
    };
    priorityDistribution: {
        critical: number;
        high: number;
        medium: number;
        low: number;
    };
    processingEfficiency: {
        autoResolutionRate: number;
        manualQueueSize: number;
        averageResolutionTime: number;
        successRate: number;
    };
    insights: Insight[];
    recommendations: string[];
    risks: Risk[];
    opportunities: Opportunity[];
}

interface Insight {
    id: string;
    type: string;
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    confidence: number;
    recommendations: string[];
}

interface Risk {
    id: string;
    type: string;
    severity: 'high' | 'medium' | 'low';
    probability: number;
    impact: string;
    mitigation: string;
}

interface Opportunity {
    id: string;
    type: string;
    description: string;
    potential: 'high' | 'medium' | 'low';
    effort: 'high' | 'medium' | 'low';
    impact: string;
}

interface ActionPlan {
    phases: ActionPhase[];
    timeline: number;
    resources: ResourceRequirement;
    successMetrics: SuccessMetric[];
    risks: Risk[];
    dependencies: string[];
}

interface ActionPhase {
    phase: number;
    name: string;
    description: string;
    duration: number;
    priority: string;
    tasks: string[];
    resources: string[];
    dependencies: string[];
}

interface ResourceRequirement {
    teamMembers: number;
    budget: number;
    tools: string[];
}

interface SuccessMetric {
    name: string;
    current: number;
    target: number;
    unit: string;
}

interface PerformancePrediction {
    current: {
        health: number;
        satisfaction: number;
        efficiency: number;
        quality: number;
    };
    predicted: {
        health: number;
        satisfaction: number;
        efficiency: number;
        quality: number;
    };
    improvements: {
        health: number;
        satisfaction: number;
        efficiency: number;
        quality: number;
    };
    confidence: number;
    timeframe: string;
    recommendations: string[];
}

interface IntegratedFeedbackSummary {
    overallHealth: number;
    sentimentScore: number;
    autoResolutionRate: number;
    totalInsights: number;
    totalRecommendations: number;
    actionPhases: number;
    predictedImprovement: number;
    confidence: number;
    status: 'excellent' | 'good' | 'fair' | 'poor';
}
