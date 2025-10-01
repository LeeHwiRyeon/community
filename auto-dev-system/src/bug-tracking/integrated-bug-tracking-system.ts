import { BugDetector } from './bug-detector';
import { AutoFixer } from './auto-fixer';
import { BugNotifier } from './bug-notifier';
import { CodeFile, Bug } from '@/types';

export class IntegratedBugTrackingSystem {
    private bugDetector: BugDetector;
    private autoFixer: AutoFixer;
    private bugNotifier: BugNotifier;
    private projectPath: string;

    constructor(openaiApiKey: string, projectPath: string = './generated-projects') {
        this.projectPath = projectPath;
        this.bugDetector = new BugDetector(openaiApiKey, projectPath);
        this.autoFixer = new AutoFixer(openaiApiKey, projectPath);
        this.bugNotifier = new BugNotifier(openaiApiKey, projectPath);
    }

    /**
     * 통합 버그 트래킹 시스템 실행
     */
    async runIntegratedBugTracking(sourceFiles: CodeFile[]): Promise<IntegratedBugTrackingResult> {
        console.log('🐛 통합 버그 트래킹 시스템 시작...');

        try {
            // 1. 버그 감지
            console.log('🔍 1단계: 버그 감지');
            const detectionResult = await this.bugDetector.detectBugs(sourceFiles);

            // 2. 자동 수정 시도
            console.log('🔧 2단계: 자동 수정 시도');
            const autoFixResult = await this.autoFixer.attemptAutoFix(detectionResult.prioritizedBugs);

            // 3. 수정되지 않은 버그에 대한 알림 전송
            console.log('📢 3단계: 알림 전송');
            const remainingBugs = this.getRemainingBugs(detectionResult.prioritizedBugs, autoFixResult);
            const notificationResult = await this.bugNotifier.sendBugNotifications(remainingBugs);

            // 4. 통합 분석
            console.log('🔗 4단계: 통합 분석');
            const integratedAnalysis = await this.performIntegratedAnalysis(
                detectionResult,
                autoFixResult,
                notificationResult
            );

            // 5. 버그 트렌드 분석
            console.log('📈 5단계: 버그 트렌드 분석');
            const trendAnalysis = await this.analyzeBugTrends(integratedAnalysis);

            // 6. 품질 지표 계산
            console.log('📊 6단계: 품질 지표 계산');
            const qualityMetrics = await this.calculateQualityMetrics(integratedAnalysis);

            // 7. 개선 권장사항 생성
            console.log('💡 7단계: 개선 권장사항 생성');
            const improvementRecommendations = await this.generateImprovementRecommendations(
                integratedAnalysis,
                trendAnalysis,
                qualityMetrics
            );

            // 8. 통합 리포트 생성
            console.log('📋 8단계: 통합 리포트 생성');
            const report = await this.generateIntegratedReport(
                detectionResult,
                autoFixResult,
                notificationResult,
                integratedAnalysis,
                trendAnalysis,
                qualityMetrics,
                improvementRecommendations
            );

            console.log('✅ 통합 버그 트래킹 시스템 완료');

            return {
                detectionResult,
                autoFixResult,
                notificationResult,
                integratedAnalysis,
                trendAnalysis,
                qualityMetrics,
                improvementRecommendations,
                report,
                summary: this.generateIntegratedSummary(
                    integratedAnalysis,
                    qualityMetrics,
                    improvementRecommendations
                )
            };

        } catch (error) {
            console.error('❌ 통합 버그 트래킹 시스템 실패:', error);
            throw error;
        }
    }

    /**
     * 수정되지 않은 버그 추출
     */
    private getRemainingBugs(originalBugs: Bug[], autoFixResult: any): Bug[] {
        const fixedBugIds = new Set(autoFixResult.fixedBugs.map((fix: any) => fix.bug.id));
        return originalBugs.filter(bug => !fixedBugIds.has(bug.id));
    }

    /**
     * 통합 분석 수행
     */
    private async performIntegratedAnalysis(
        detectionResult: any,
        autoFixResult: any,
        notificationResult: any
    ): Promise<IntegratedAnalysis> {
        console.log('🔍 통합 분석 수행 중...');

        const analysis: IntegratedAnalysis = {
            overallHealth: 0,
            bugDistribution: {
                total: detectionResult.summary.totalBugs,
                critical: detectionResult.summary.criticalBugs,
                high: detectionResult.summary.highBugs,
                medium: detectionResult.summary.mediumBugs,
                low: detectionResult.summary.lowBugs
            },
            autoFixPerformance: {
                totalAttempted: autoFixResult.fixedBugs.length + autoFixResult.partiallyFixedBugs.length + autoFixResult.failedBugs.length,
                successfullyFixed: autoFixResult.fixedBugs.length,
                partiallyFixed: autoFixResult.partiallyFixedBugs.length,
                failed: autoFixResult.failedBugs.length,
                autoFixRate: autoFixResult.autoFixRate
            },
            notificationPerformance: {
                totalSent: notificationResult.sentNotifications.length,
                successful: notificationResult.sentNotifications.filter((n: any) => n.success).length,
                failed: notificationResult.failedNotifications.length,
                successRate: notificationResult.successRate
            },
            bugCategories: this.analyzeBugCategories(detectionResult.prioritizedBugs),
            bugSeverityTrends: this.analyzeBugSeverityTrends(detectionResult.prioritizedBugs),
            codeQuality: this.assessCodeQuality(detectionResult.prioritizedBugs),
            recommendations: [],
            risks: [],
            opportunities: []
        };

        // 전체 건강도 계산
        analysis.overallHealth = this.calculateOverallHealth(analysis);

        // 권장사항 생성
        analysis.recommendations = this.generateAnalysisRecommendations(analysis);

        // 위험 요소 식별
        analysis.risks = this.identifyRisks(analysis);

        // 기회 요소 식별
        analysis.opportunities = this.identifyOpportunities(analysis);

        return analysis;
    }

    /**
     * 버그 트렌드 분석
     */
    private async analyzeBugTrends(analysis: IntegratedAnalysis): Promise<BugTrendAnalysis> {
        console.log('📈 버그 트렌드 분석 중...');

        const trendAnalysis: BugTrendAnalysis = {
            trends: [],
            patterns: [],
            predictions: [],
            seasonality: [],
            anomalies: []
        };

        // 버그 발생 트렌드
        trendAnalysis.trends = this.analyzeBugOccurrenceTrends(analysis);

        // 버그 패턴 분석
        trendAnalysis.patterns = this.analyzeBugPatterns(analysis);

        // 버그 예측
        trendAnalysis.predictions = this.predictFutureBugs(analysis);

        // 계절성 분석
        trendAnalysis.seasonality = this.analyzeSeasonality(analysis);

        // 이상치 탐지
        trendAnalysis.anomalies = this.detectAnomalies(analysis);

        return trendAnalysis;
    }

    /**
     * 품질 지표 계산
     */
    private async calculateQualityMetrics(analysis: IntegratedAnalysis): Promise<QualityMetrics> {
        console.log('📊 품질 지표 계산 중...');

        const metrics: QualityMetrics = {
            codeQuality: {
                overall: analysis.overallHealth,
                maintainability: this.calculateMaintainabilityScore(analysis),
                reliability: this.calculateReliabilityScore(analysis),
                security: this.calculateSecurityScore(analysis),
                performance: this.calculatePerformanceScore(analysis)
            },
            bugMetrics: {
                bugDensity: this.calculateBugDensity(analysis),
                bugResolutionTime: this.calculateBugResolutionTime(analysis),
                bugReopenRate: this.calculateBugReopenRate(analysis),
                criticalBugRate: this.calculateCriticalBugRate(analysis)
            },
            processMetrics: {
                autoFixRate: analysis.autoFixPerformance.autoFixRate,
                notificationSuccessRate: analysis.notificationPerformance.successRate,
                detectionAccuracy: this.calculateDetectionAccuracy(analysis),
                falsePositiveRate: this.calculateFalsePositiveRate(analysis)
            },
            trends: {
                qualityImprovement: this.calculateQualityImprovementTrend(analysis),
                bugReduction: this.calculateBugReductionTrend(analysis),
                processEfficiency: this.calculateProcessEfficiencyTrend(analysis)
            }
        };

        return metrics;
    }

    /**
     * 개선 권장사항 생성
     */
    private async generateImprovementRecommendations(
        analysis: IntegratedAnalysis,
        trendAnalysis: BugTrendAnalysis,
        qualityMetrics: QualityMetrics
    ): Promise<ImprovementRecommendation[]> {
        console.log('💡 개선 권장사항 생성 중...');

        const recommendations: ImprovementRecommendation[] = [];

        // 코드 품질 개선 권장사항
        if (qualityMetrics.codeQuality.overall < 7) {
            recommendations.push({
                id: this.generateId(),
                type: 'code_quality',
                priority: 'high',
                title: '코드 품질 개선',
                description: '전체적인 코드 품질을 개선하여 버그 발생을 줄이세요.',
                impact: 'high',
                effort: 'medium',
                timeline: '2-4 weeks',
                actions: [
                    '코드 리뷰 프로세스 강화',
                    '정적 분석 도구 도입',
                    '단위 테스트 커버리지 향상',
                    '코딩 표준 준수'
                ],
                expectedOutcome: '버그 발생률 30% 감소'
            });
        }

        // 자동 수정 시스템 개선 권장사항
        if (analysis.autoFixPerformance.autoFixRate < 0.5) {
            recommendations.push({
                id: this.generateId(),
                type: 'automation',
                priority: 'medium',
                title: '자동 수정 시스템 개선',
                description: '자동 수정률을 높여 개발 생산성을 향상시키세요.',
                impact: 'medium',
                effort: 'high',
                timeline: '4-6 weeks',
                actions: [
                    '수정 규칙 데이터베이스 확장',
                    'AI 모델 재훈련',
                    '수정 전략 다양화',
                    '검증 프로세스 개선'
                ],
                expectedOutcome: '자동 수정률 70% 달성'
            });
        }

        // 알림 시스템 개선 권장사항
        if (analysis.notificationPerformance.successRate < 0.8) {
            recommendations.push({
                id: this.generateId(),
                type: 'notification',
                priority: 'low',
                title: '알림 시스템 개선',
                description: '알림 전송 성공률을 높여 버그 대응 시간을 단축하세요.',
                impact: 'low',
                effort: 'low',
                timeline: '1-2 weeks',
                actions: [
                    '알림 서비스 설정 점검',
                    '대체 채널 추가',
                    '재시도 로직 구현',
                    '모니터링 강화'
                ],
                expectedOutcome: '알림 성공률 95% 달성'
            });
        }

        // 보안 강화 권장사항
        if (qualityMetrics.codeQuality.security < 6) {
            recommendations.push({
                id: this.generateId(),
                type: 'security',
                priority: 'high',
                title: '보안 강화',
                description: '보안 취약점을 줄여 시스템 안정성을 높이세요.',
                impact: 'high',
                effort: 'high',
                timeline: '6-8 weeks',
                actions: [
                    '보안 코드 리뷰 강화',
                    '정적 보안 분석 도구 도입',
                    '보안 테스트 자동화',
                    '개발자 보안 교육'
                ],
                expectedOutcome: '보안 취약점 50% 감소'
            });
        }

        return recommendations;
    }

    // 헬퍼 메서드들
    private analyzeBugCategories(bugs: Bug[]): Record<string, number> {
        const categories: Record<string, number> = {};

        for (const bug of bugs) {
            categories[bug.category] = (categories[bug.category] || 0) + 1;
        }

        return categories;
    }

    private analyzeBugSeverityTrends(bugs: Bug[]): Record<string, number> {
        const severities: Record<string, number> = {};

        for (const bug of bugs) {
            severities[bug.severity] = (severities[bug.severity] || 0) + 1;
        }

        return severities;
    }

    private assessCodeQuality(bugs: Bug[]): number {
        const totalBugs = bugs.length;
        const criticalBugs = bugs.filter(b => b.severity === 'critical').length;
        const highBugs = bugs.filter(b => b.severity === 'high').length;

        // 버그가 적을수록, 심각한 버그가 적을수록 높은 점수
        let score = 10;
        score -= totalBugs * 0.1;
        score -= criticalBugs * 2;
        score -= highBugs * 1;

        return Math.max(0, Math.min(10, score));
    }

    private calculateOverallHealth(analysis: IntegratedAnalysis): number {
        const factors = [
            analysis.codeQuality,
            analysis.autoFixPerformance.autoFixRate * 10,
            analysis.notificationPerformance.successRate * 10,
            10 - (analysis.bugDistribution.critical * 2),
            10 - (analysis.bugDistribution.high * 1)
        ];

        return factors.reduce((sum, factor) => sum + factor, 0) / factors.length;
    }

    private generateAnalysisRecommendations(analysis: IntegratedAnalysis): string[] {
        const recommendations: string[] = [];

        if (analysis.bugDistribution.critical > 5) {
            recommendations.push('긴급 버그가 많습니다. 즉시 대응이 필요합니다.');
        }

        if (analysis.autoFixPerformance.autoFixRate < 0.3) {
            recommendations.push('자동 수정률이 낮습니다. 수정 규칙을 개선하세요.');
        }

        if (analysis.notificationPerformance.successRate < 0.8) {
            recommendations.push('알림 성공률이 낮습니다. 알림 시스템을 점검하세요.');
        }

        return recommendations;
    }

    private identifyRisks(analysis: IntegratedAnalysis): Risk[] {
        const risks: Risk[] = [];

        if (analysis.bugDistribution.critical > 10) {
            risks.push({
                id: this.generateId(),
                type: 'critical_bug_overflow',
                severity: 'high',
                probability: 0.8,
                impact: '시스템 안정성 저하',
                mitigation: '긴급 버그 처리 팀 구성 및 우선순위 조정'
            });
        }

        if (analysis.autoFixPerformance.autoFixRate < 0.2) {
            risks.push({
                id: this.generateId(),
                type: 'low_automation',
                severity: 'medium',
                probability: 0.6,
                impact: '개발 생산성 저하',
                mitigation: '자동화 시스템 개선 및 수동 프로세스 최적화'
            });
        }

        return risks;
    }

    private identifyOpportunities(analysis: IntegratedAnalysis): Opportunity[] {
        const opportunities: Opportunity[] = [];

        if (analysis.autoFixPerformance.autoFixRate > 0.7) {
            opportunities.push({
                id: this.generateId(),
                type: 'automation_expansion',
                description: '자동화를 더 많은 영역으로 확장할 수 있습니다.',
                potential: 'high',
                effort: 'medium',
                impact: '개발 효율성 대폭 향상'
            });
        }

        if (analysis.bugDistribution.low > analysis.bugDistribution.critical + analysis.bugDistribution.high) {
            opportunities.push({
                id: this.generateId(),
                type: 'quality_focus',
                description: '전반적인 코드 품질이 양호합니다. 프로세스 개선에 집중할 수 있습니다.',
                potential: 'medium',
                effort: 'low',
                impact: '지속적인 품질 향상'
            });
        }

        return opportunities;
    }

    private analyzeBugOccurrenceTrends(analysis: IntegratedAnalysis): Trend[] {
        // 실제 구현에서는 버그 발생 트렌드 분석
        return [
            {
                name: 'bug_occurrence',
                direction: 'down',
                change: -0.15,
                period: 'last_30_days'
            }
        ];
    }

    private analyzeBugPatterns(analysis: IntegratedAnalysis): Pattern[] {
        // 실제 구현에서는 버그 패턴 분석
        return [
            {
                name: 'security_bugs',
                frequency: 5,
                description: '보안 관련 버그가 주로 발생',
                confidence: 0.8
            }
        ];
    }

    private predictFutureBugs(analysis: IntegratedAnalysis): Prediction[] {
        // 실제 구현에서는 버그 예측
        return [
            {
                metric: 'bug_count',
                current: analysis.bugDistribution.total,
                predicted: Math.max(0, analysis.bugDistribution.total - 2),
                timeframe: 'next_30_days',
                confidence: 0.7
            }
        ];
    }

    private analyzeSeasonality(analysis: IntegratedAnalysis): SeasonalPattern[] {
        // 실제 구현에서는 계절성 분석
        return [];
    }

    private detectAnomalies(analysis: IntegratedAnalysis): Anomaly[] {
        // 실제 구현에서는 이상치 탐지
        return [];
    }

    private calculateMaintainabilityScore(analysis: IntegratedAnalysis): number {
        // 실제 구현에서는 유지보수성 점수 계산
        return 7.5;
    }

    private calculateReliabilityScore(analysis: IntegratedAnalysis): number {
        // 실제 구현에서는 신뢰성 점수 계산
        return 8.0;
    }

    private calculateSecurityScore(analysis: IntegratedAnalysis): number {
        // 실제 구현에서는 보안 점수 계산
        return 6.5;
    }

    private calculatePerformanceScore(analysis: IntegratedAnalysis): number {
        // 실제 구현에서는 성능 점수 계산
        return 7.8;
    }

    private calculateBugDensity(analysis: IntegratedAnalysis): number {
        // 실제 구현에서는 버그 밀도 계산
        return analysis.bugDistribution.total / 1000; // 1000줄당 버그 수
    }

    private calculateBugResolutionTime(analysis: IntegratedAnalysis): number {
        // 실제 구현에서는 버그 해결 시간 계산
        return 2.5; // 일
    }

    private calculateBugReopenRate(analysis: IntegratedAnalysis): number {
        // 실제 구현에서는 버그 재오픈률 계산
        return 0.1; // 10%
    }

    private calculateCriticalBugRate(analysis: IntegratedAnalysis): number {
        // 실제 구현에서는 긴급 버그 비율 계산
        return analysis.bugDistribution.critical / analysis.bugDistribution.total;
    }

    private calculateDetectionAccuracy(analysis: IntegratedAnalysis): number {
        // 실제 구현에서는 감지 정확도 계산
        return 0.85; // 85%
    }

    private calculateFalsePositiveRate(analysis: IntegratedAnalysis): number {
        // 실제 구현에서는 거짓 양성률 계산
        return 0.05; // 5%
    }

    private calculateQualityImprovementTrend(analysis: IntegratedAnalysis): number {
        // 실제 구현에서는 품질 개선 트렌드 계산
        return 0.1; // 10% 개선
    }

    private calculateBugReductionTrend(analysis: IntegratedAnalysis): number {
        // 실제 구현에서는 버그 감소 트렌드 계산
        return -0.15; // 15% 감소
    }

    private calculateProcessEfficiencyTrend(analysis: IntegratedAnalysis): number {
        // 실제 구현에서는 프로세스 효율성 트렌드 계산
        return 0.2; // 20% 개선
    }

    private async generateIntegratedReport(
        detectionResult: any,
        autoFixResult: any,
        notificationResult: any,
        integratedAnalysis: IntegratedAnalysis,
        trendAnalysis: BugTrendAnalysis,
        qualityMetrics: QualityMetrics,
        improvementRecommendations: ImprovementRecommendation[]
    ): Promise<string> {
        const report = {
            summary: this.generateIntegratedSummary(integratedAnalysis, qualityMetrics, improvementRecommendations),
            detectionResult,
            autoFixResult,
            notificationResult,
            integratedAnalysis,
            trendAnalysis,
            qualityMetrics,
            improvementRecommendations,
            generatedAt: new Date().toISOString()
        };

        const reportPath = path.join(this.projectPath, 'integrated-bug-tracking-report.json');
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

        return reportPath;
    }

    private generateIntegratedSummary(
        analysis: IntegratedAnalysis,
        qualityMetrics: QualityMetrics,
        recommendations: ImprovementRecommendation[]
    ): IntegratedBugTrackingSummary {
        return {
            overallHealth: analysis.overallHealth,
            totalBugs: analysis.bugDistribution.total,
            criticalBugs: analysis.bugDistribution.critical,
            autoFixRate: analysis.autoFixPerformance.autoFixRate,
            notificationSuccessRate: analysis.notificationPerformance.successRate,
            codeQuality: qualityMetrics.codeQuality.overall,
            recommendationsCount: recommendations.length,
            risksCount: analysis.risks.length,
            opportunitiesCount: analysis.opportunities.length,
            status: this.determineIntegratedStatus(analysis, qualityMetrics)
        };
    }

    private determineIntegratedStatus(
        analysis: IntegratedAnalysis,
        qualityMetrics: QualityMetrics
    ): 'excellent' | 'good' | 'fair' | 'poor' {
        const health = analysis.overallHealth;
        const criticalBugs = analysis.bugDistribution.critical;
        const codeQuality = qualityMetrics.codeQuality.overall;

        if (health >= 8 && criticalBugs <= 2 && codeQuality >= 8) return 'excellent';
        if (health >= 6 && criticalBugs <= 5 && codeQuality >= 6) return 'good';
        if (health >= 4 && criticalBugs <= 10 && codeQuality >= 4) return 'fair';
        return 'poor';
    }

    private generateId(): string {
        return Math.random().toString(36).substr(2, 9);
    }
}

// 타입 정의
interface IntegratedBugTrackingResult {
    detectionResult: any;
    autoFixResult: any;
    notificationResult: any;
    integratedAnalysis: IntegratedAnalysis;
    trendAnalysis: BugTrendAnalysis;
    qualityMetrics: QualityMetrics;
    improvementRecommendations: ImprovementRecommendation[];
    report: string;
    summary: IntegratedBugTrackingSummary;
}

interface IntegratedAnalysis {
    overallHealth: number;
    bugDistribution: {
        total: number;
        critical: number;
        high: number;
        medium: number;
        low: number;
    };
    autoFixPerformance: {
        totalAttempted: number;
        successfullyFixed: number;
        partiallyFixed: number;
        failed: number;
        autoFixRate: number;
    };
    notificationPerformance: {
        totalSent: number;
        successful: number;
        failed: number;
        successRate: number;
    };
    bugCategories: Record<string, number>;
    bugSeverityTrends: Record<string, number>;
    codeQuality: number;
    recommendations: string[];
    risks: Risk[];
    opportunities: Opportunity[];
}

interface BugTrendAnalysis {
    trends: Trend[];
    patterns: Pattern[];
    predictions: Prediction[];
    seasonality: SeasonalPattern[];
    anomalies: Anomaly[];
}

interface Trend {
    name: string;
    direction: 'up' | 'down' | 'stable';
    change: number;
    period: string;
}

interface Pattern {
    name: string;
    frequency: number;
    description: string;
    confidence: number;
}

interface Prediction {
    metric: string;
    current: number;
    predicted: number;
    timeframe: string;
    confidence: number;
}

interface SeasonalPattern {
    name: string;
    period: string;
    strength: number;
}

interface Anomaly {
    id: string;
    type: string;
    description: string;
    severity: 'high' | 'medium' | 'low';
    timestamp: Date;
}

interface QualityMetrics {
    codeQuality: {
        overall: number;
        maintainability: number;
        reliability: number;
        security: number;
        performance: number;
    };
    bugMetrics: {
        bugDensity: number;
        bugResolutionTime: number;
        bugReopenRate: number;
        criticalBugRate: number;
    };
    processMetrics: {
        autoFixRate: number;
        notificationSuccessRate: number;
        detectionAccuracy: number;
        falsePositiveRate: number;
    };
    trends: {
        qualityImprovement: number;
        bugReduction: number;
        processEfficiency: number;
    };
}

interface ImprovementRecommendation {
    id: string;
    type: string;
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    effort: 'high' | 'medium' | 'low';
    timeline: string;
    actions: string[];
    expectedOutcome: string;
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

interface IntegratedBugTrackingSummary {
    overallHealth: number;
    totalBugs: number;
    criticalBugs: number;
    autoFixRate: number;
    notificationSuccessRate: number;
    codeQuality: number;
    recommendationsCount: number;
    risksCount: number;
    opportunitiesCount: number;
    status: 'excellent' | 'good' | 'fair' | 'poor';
}
