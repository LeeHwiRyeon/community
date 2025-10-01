import { WorkflowEngine } from './workflow-engine';
import { WorkflowScheduler } from './workflow-scheduler';
import { WorkflowMonitor } from './workflow-monitor';
import { Goal, Workflow, WorkflowStep, CodeFile } from '@/types';

export class IntegratedOrchestrationSystem {
    private workflowEngine: WorkflowEngine;
    private workflowScheduler: WorkflowScheduler;
    private workflowMonitor: WorkflowMonitor;
    private projectPath: string;

    constructor(openaiApiKey: string, projectPath: string = './generated-projects') {
        this.projectPath = projectPath;
        this.workflowEngine = new WorkflowEngine(openaiApiKey, projectPath);
        this.workflowScheduler = new WorkflowScheduler(projectPath);
        this.workflowMonitor = new WorkflowMonitor(projectPath);
    }

    /**
     * 통합 오케스트레이션 시스템 실행
     */
    async runIntegratedOrchestration(goal: Goal): Promise<OrchestrationResult> {
        console.log('🎼 통합 오케스트레이션 시스템 시작...');

        try {
            // 1. 워크플로우 생성
            console.log('📋 1단계: 워크플로우 생성');
            const workflow = await this.createWorkflow(goal);

            // 2. 워크플로우 실행
            console.log('🚀 2단계: 워크플로우 실행');
            const executionResult = await this.executeWorkflow(workflow);

            // 3. 워크플로우 모니터링
            console.log('📊 3단계: 워크플로우 모니터링');
            const monitoringResult = await this.monitorWorkflow(workflow.id);

            // 4. 결과 분석
            console.log('🔍 4단계: 결과 분석');
            const analysisResult = await this.analyzeResults(executionResult, monitoringResult);

            // 5. 개선 권장사항 생성
            console.log('💡 5단계: 개선 권장사항 생성');
            const recommendations = await this.generateRecommendations(analysisResult);

            // 6. 통합 리포트 생성
            console.log('📋 6단계: 통합 리포트 생성');
            const report = await this.generateOrchestrationReport(
                workflow,
                executionResult,
                monitoringResult,
                analysisResult,
                recommendations
            );

            console.log('✅ 통합 오케스트레이션 시스템 완료');

            return {
                workflow,
                executionResult,
                monitoringResult,
                analysisResult,
                recommendations,
                report,
                summary: this.generateOrchestrationSummary(analysisResult, recommendations)
            };

        } catch (error) {
            console.error('❌ 통합 오케스트레이션 시스템 실패:', error);
            throw error;
        }
    }

    /**
     * 워크플로우 생성
     */
    private async createWorkflow(goal: Goal): Promise<Workflow> {
        console.log('📋 워크플로우 생성 중...');

        const steps: WorkflowStep[] = [
            {
                name: 'goal-analysis',
                description: '목표 분석 및 계획 수립',
                status: 'pending',
                startTime: new Date(),
                endTime: null
            },
            {
                name: 'project-generation',
                description: '프로젝트 구조 및 코드 생성',
                status: 'pending',
                startTime: new Date(),
                endTime: null
            },
            {
                name: 'testing',
                description: '자동화된 테스트 실행',
                status: 'pending',
                startTime: new Date(),
                endTime: null
            },
            {
                name: 'optimization',
                description: '코드 및 성능 최적화',
                status: 'pending',
                startTime: new Date(),
                endTime: null
            },
            {
                name: 'ux-analysis',
                description: 'UI/UX 분석 및 개선',
                status: 'pending',
                startTime: new Date(),
                endTime: null
            },
            {
                name: 'feedback-processing',
                description: '피드백 수집 및 처리',
                status: 'pending',
                startTime: new Date(),
                endTime: null
            },
            {
                name: 'bug-tracking',
                description: '버그 감지 및 수정',
                status: 'pending',
                startTime: new Date(),
                endTime: null
            },
            {
                name: 'final-validation',
                description: '최종 검증 및 배포 준비',
                status: 'pending',
                startTime: new Date(),
                endTime: null
            }
        ];

        const workflow = await this.workflowEngine.createWorkflow(goal, steps);

        console.log(`✅ 워크플로우 생성 완료: ${workflow.id}`);
        return workflow;
    }

    /**
     * 워크플로우 실행
     */
    private async executeWorkflow(workflow: Workflow): Promise<any> {
        console.log(`🚀 워크플로우 실행: ${workflow.id}`);

        // 모니터링 시작
        await this.workflowMonitor.startMonitoring(workflow);

        // 워크플로우 실행
        const executionResult = await this.workflowEngine.executeWorkflow(workflow);

        console.log(`✅ 워크플로우 실행 완료: ${workflow.id}`);
        return executionResult;
    }

    /**
     * 워크플로우 모니터링
     */
    private async monitorWorkflow(workflowId: string): Promise<any> {
        console.log(`📊 워크플로우 모니터링: ${workflowId}`);

        // 모니터링 데이터 수집
        const status = this.workflowMonitor.getWorkflowStatus(workflowId);
        const metrics = this.workflowMonitor.getRealTimeMetrics(workflowId);
        const alerts = this.workflowMonitor.getAlerts(workflowId);
        const logs = this.workflowMonitor.getWorkflowLogs(workflowId);

        return {
            status,
            metrics,
            alerts,
            logs,
            overallMetrics: this.workflowMonitor.getOverallMetrics()
        };
    }

    /**
     * 결과 분석
     */
    private async analyzeResults(executionResult: any, monitoringResult: any): Promise<AnalysisResult> {
        console.log('🔍 결과 분석 중...');

        const analysis: AnalysisResult = {
            executionAnalysis: {
                success: executionResult.status === 'completed',
                totalSteps: executionResult.metrics.totalSteps,
                completedSteps: executionResult.metrics.completedSteps,
                failedSteps: executionResult.metrics.failedSteps,
                successRate: executionResult.metrics.successRate,
                executionTime: executionResult.metrics.executionTime
            },
            performanceAnalysis: {
                averageStepTime: executionResult.metrics.executionTime / executionResult.metrics.totalSteps,
                memoryUsage: monitoringResult.metrics?.memoryUsage || 0,
                cpuUsage: monitoringResult.metrics?.cpuUsage || 0,
                resourceEfficiency: this.calculateResourceEfficiency(monitoringResult),
                bottlenecks: this.identifyBottlenecks(executionResult, monitoringResult)
            },
            qualityAnalysis: {
                errorRate: executionResult.metrics.failedSteps / executionResult.metrics.totalSteps,
                warningCount: executionResult.warnings.length,
                alertCount: monitoringResult.alerts?.length || 0,
                stabilityScore: this.calculateStabilityScore(executionResult, monitoringResult)
            },
            recommendations: [],
            insights: []
        };

        // 권장사항 생성
        analysis.recommendations = this.generateAnalysisRecommendations(analysis);

        // 인사이트 생성
        analysis.insights = this.generateAnalysisInsights(analysis);

        return analysis;
    }

    /**
     * 개선 권장사항 생성
     */
    private async generateRecommendations(analysisResult: AnalysisResult): Promise<Recommendation[]> {
        console.log('💡 개선 권장사항 생성 중...');

        const recommendations: Recommendation[] = [];

        // 실행 성능 개선 권장사항
        if (analysisResult.executionAnalysis.successRate < 0.8) {
            recommendations.push({
                id: this.generateId(),
                type: 'execution',
                priority: 'high',
                title: '워크플로우 실행 성공률 개선',
                description: '워크플로우 실행 성공률이 낮습니다. 실패 원인을 분석하고 개선하세요.',
                impact: 'high',
                effort: 'medium',
                timeline: '2-4 weeks',
                actions: [
                    '실패한 단계 분석',
                    '에러 처리 개선',
                    '재시도 로직 추가',
                    '의존성 검증 강화'
                ],
                expectedOutcome: '실행 성공률 95% 달성'
            });
        }

        // 성능 최적화 권장사항
        if (analysisResult.performanceAnalysis.resourceEfficiency < 0.7) {
            recommendations.push({
                id: this.generateId(),
                type: 'performance',
                priority: 'medium',
                title: '리소스 효율성 개선',
                description: '리소스 사용 효율성이 낮습니다. 최적화를 통해 성능을 개선하세요.',
                impact: 'medium',
                effort: 'high',
                timeline: '4-6 weeks',
                actions: [
                    '메모리 사용량 최적화',
                    'CPU 사용량 최적화',
                    '병렬 처리 도입',
                    '캐싱 전략 개선'
                ],
                expectedOutcome: '리소스 효율성 30% 향상'
            });
        }

        // 품질 개선 권장사항
        if (analysisResult.qualityAnalysis.stabilityScore < 0.8) {
            recommendations.push({
                id: this.generateId(),
                type: 'quality',
                priority: 'high',
                title: '시스템 안정성 개선',
                description: '시스템 안정성이 낮습니다. 에러 처리 및 모니터링을 강화하세요.',
                impact: 'high',
                effort: 'medium',
                timeline: '3-5 weeks',
                actions: [
                    '에러 처리 로직 개선',
                    '모니터링 강화',
                    '알림 시스템 개선',
                    '로깅 시스템 강화'
                ],
                expectedOutcome: '안정성 점수 90% 달성'
            });
        }

        return recommendations;
    }

    /**
     * 통합 리포트 생성
     */
    private async generateOrchestrationReport(
        workflow: Workflow,
        executionResult: any,
        monitoringResult: any,
        analysisResult: AnalysisResult,
        recommendations: Recommendation[]
    ): Promise<string> {
        const report = {
            summary: this.generateOrchestrationSummary(analysisResult, recommendations),
            workflow,
            executionResult,
            monitoringResult,
            analysisResult,
            recommendations,
            generatedAt: new Date().toISOString()
        };

        const reportPath = path.join(this.projectPath, 'orchestration-report.json');
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

        return reportPath;
    }

    /**
     * 통합 요약 생성
     */
    private generateOrchestrationSummary(
        analysisResult: AnalysisResult,
        recommendations: Recommendation[]
    ): OrchestrationSummary {
        return {
            overallSuccess: analysisResult.executionAnalysis.success,
            successRate: analysisResult.executionAnalysis.successRate,
            executionTime: analysisResult.executionAnalysis.executionTime,
            resourceEfficiency: analysisResult.performanceAnalysis.resourceEfficiency,
            stabilityScore: analysisResult.qualityAnalysis.stabilityScore,
            recommendationsCount: recommendations.length,
            highPriorityRecommendations: recommendations.filter(r => r.priority === 'high').length,
            status: this.determineOrchestrationStatus(analysisResult)
        };
    }

    // 헬퍼 메서드들
    private calculateResourceEfficiency(monitoringResult: any): number {
        const memoryUsage = monitoringResult.metrics?.memoryUsage || 0;
        const cpuUsage = monitoringResult.metrics?.cpuUsage || 0;

        // 리소스 사용량이 적을수록 높은 효율성
        const memoryEfficiency = Math.max(0, 1 - (memoryUsage / 1000)); // 1GB 기준
        const cpuEfficiency = Math.max(0, 1 - (cpuUsage / 100)); // 100% 기준

        return (memoryEfficiency + cpuEfficiency) / 2;
    }

    private identifyBottlenecks(executionResult: any, monitoringResult: any): string[] {
        const bottlenecks: string[] = [];

        if (executionResult.metrics.executionTime > 300000) { // 5분
            bottlenecks.push('긴 실행 시간');
        }

        if (monitoringResult.metrics?.memoryUsage > 500) { // 500MB
            bottlenecks.push('높은 메모리 사용량');
        }

        if (monitoringResult.metrics?.cpuUsage > 80) { // 80%
            bottlenecks.push('높은 CPU 사용량');
        }

        return bottlenecks;
    }

    private calculateStabilityScore(executionResult: any, monitoringResult: any): number {
        let score = 1.0;

        // 에러 수에 따른 감점
        const errorRate = executionResult.metrics.failedSteps / executionResult.metrics.totalSteps;
        score -= errorRate * 0.5;

        // 경고 수에 따른 감점
        const warningRate = executionResult.warnings.length / executionResult.metrics.totalSteps;
        score -= warningRate * 0.1;

        // 알림 수에 따른 감점
        const alertRate = (monitoringResult.alerts?.length || 0) / executionResult.metrics.totalSteps;
        score -= alertRate * 0.2;

        return Math.max(0, Math.min(1, score));
    }

    private generateAnalysisRecommendations(analysis: AnalysisResult): string[] {
        const recommendations: string[] = [];

        if (analysis.executionAnalysis.successRate < 0.8) {
            recommendations.push('워크플로우 실행 성공률을 개선하세요.');
        }

        if (analysis.performanceAnalysis.resourceEfficiency < 0.7) {
            recommendations.push('리소스 사용 효율성을 개선하세요.');
        }

        if (analysis.qualityAnalysis.stabilityScore < 0.8) {
            recommendations.push('시스템 안정성을 개선하세요.');
        }

        return recommendations;
    }

    private generateAnalysisInsights(analysis: AnalysisResult): string[] {
        const insights: string[] = [];

        if (analysis.executionAnalysis.successRate > 0.9) {
            insights.push('워크플로우 실행이 매우 안정적입니다.');
        }

        if (analysis.performanceAnalysis.resourceEfficiency > 0.8) {
            insights.push('리소스 사용이 효율적입니다.');
        }

        if (analysis.qualityAnalysis.stabilityScore > 0.9) {
            insights.push('시스템이 매우 안정적입니다.');
        }

        return insights;
    }

    private determineOrchestrationStatus(analysis: AnalysisResult): 'excellent' | 'good' | 'fair' | 'poor' {
        const successRate = analysis.executionAnalysis.successRate;
        const resourceEfficiency = analysis.performanceAnalysis.resourceEfficiency;
        const stabilityScore = analysis.qualityAnalysis.stabilityScore;

        const overallScore = (successRate + resourceEfficiency + stabilityScore) / 3;

        if (overallScore >= 0.9) return 'excellent';
        if (overallScore >= 0.7) return 'good';
        if (overallScore >= 0.5) return 'fair';
        return 'poor';
    }

    private generateId(): string {
        return Math.random().toString(36).substr(2, 9);
    }
}

// 타입 정의
interface OrchestrationResult {
    workflow: Workflow;
    executionResult: any;
    monitoringResult: any;
    analysisResult: AnalysisResult;
    recommendations: Recommendation[];
    report: string;
    summary: OrchestrationSummary;
}

interface AnalysisResult {
    executionAnalysis: {
        success: boolean;
        totalSteps: number;
        completedSteps: number;
        failedSteps: number;
        successRate: number;
        executionTime: number;
    };
    performanceAnalysis: {
        averageStepTime: number;
        memoryUsage: number;
        cpuUsage: number;
        resourceEfficiency: number;
        bottlenecks: string[];
    };
    qualityAnalysis: {
        errorRate: number;
        warningCount: number;
        alertCount: number;
        stabilityScore: number;
    };
    recommendations: string[];
    insights: string[];
}

interface Recommendation {
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

interface OrchestrationSummary {
    overallSuccess: boolean;
    successRate: number;
    executionTime: number;
    resourceEfficiency: number;
    stabilityScore: number;
    recommendationsCount: number;
    highPriorityRecommendations: number;
    status: 'excellent' | 'good' | 'fair' | 'poor';
}
