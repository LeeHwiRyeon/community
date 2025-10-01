import { AdvancedTestRunner } from './advanced-test-runner';
import { TestGenerator } from './test-generator';
import { CoverageAnalyzer } from './coverage-analyzer';
import { IntelligentTestGenerator, TestGenerationRequest, TestGenerationResult } from './intelligent-test-generator';
import { TestResult, CodeFile, Goal, TechStack } from '@/types';

export class AutomatedTestingSystem {
    private testRunner: AdvancedTestRunner;
    private testGenerator: TestGenerator;
    private intelligentTestGenerator: IntelligentTestGenerator;
    private coverageAnalyzer: CoverageAnalyzer;
    private projectPath: string;

    constructor(openaiApiKey: string, projectPath: string) {
        this.projectPath = projectPath;
        this.testRunner = new AdvancedTestRunner(projectPath);
        this.testGenerator = new TestGenerator(openaiApiKey, projectPath);
        this.intelligentTestGenerator = new IntelligentTestGenerator();
        this.coverageAnalyzer = new CoverageAnalyzer(projectPath);
    }

    /**
     * 완전 자동화된 테스트 시스템 실행
     */
    async runAutomatedTesting(
        goal: Goal,
        techStack: TechStack,
        sourceFiles: CodeFile[]
    ): Promise<AutomatedTestingResult> {
        console.log('🤖 자동화된 테스트 시스템 시작...');

        try {
            // 1. 테스트 자동 생성
            console.log('📝 테스트 자동 생성 중...');
            const generatedTests = await this.testGenerator.generateTests(goal, techStack, sourceFiles);

            // 2. 생성된 테스트 파일 저장
            await this.saveTestFiles(generatedTests);

            // 3. 고급 테스트 실행
            console.log('🧪 고급 테스트 실행 중...');
            const testResults = await this.testRunner.runAdvancedTests();

            // 4. 커버리지 분석
            console.log('📊 커버리지 분석 중...');
            const coverageAnalysis = await this.coverageAnalyzer.analyzeCoverage();

            // 5. 테스트 품질 평가
            console.log('🔍 테스트 품질 평가 중...');
            const qualityAssessment = await this.assessTestQuality(testResults, coverageAnalysis);

            // 6. 개선 제안 생성
            console.log('💡 개선 제안 생성 중...');
            const improvements = await this.generateImprovementSuggestions(
                testResults,
                coverageAnalysis,
                qualityAssessment
            );

            // 7. 최종 리포트 생성
            console.log('📋 최종 리포트 생성 중...');
            const finalReport = await this.generateFinalReport(
                testResults,
                coverageAnalysis,
                qualityAssessment,
                improvements
            );

            console.log('✅ 자동화된 테스트 시스템 완료');

            return {
                generatedTests,
                testResults,
                coverageAnalysis,
                qualityAssessment,
                improvements,
                finalReport,
                summary: this.generateSummary(testResults, coverageAnalysis, qualityAssessment)
            };

        } catch (error) {
            console.error('❌ 자동화된 테스트 시스템 실패:', error);
            throw error;
        }
    }

    /**
     * 테스트 파일 저장
     */
    private async saveTestFiles(testFiles: CodeFile[]): Promise<void> {
        const fs = await import('fs/promises');
        const path = await import('path');

        for (const testFile of testFiles) {
            const filePath = path.join(this.projectPath, testFile.path);
            const dirPath = path.dirname(filePath);

            // 디렉토리 생성
            await fs.mkdir(dirPath, { recursive: true });

            // 파일 쓰기
            await fs.writeFile(filePath, testFile.content, 'utf-8');
        }
    }

    /**
     * 테스트 품질 평가
     */
    private async assessTestQuality(
        testResults: TestResult[],
        coverageAnalysis: any
    ): Promise<TestQualityAssessment> {
        const assessment: TestQualityAssessment = {
            overallScore: 0,
            testCoverage: {
                score: coverageAnalysis.metrics.overall,
                grade: this.getCoverageGrade(coverageAnalysis.metrics.overall)
            },
            testReliability: {
                score: this.calculateReliabilityScore(testResults),
                grade: this.getReliabilityGrade(testResults)
            },
            testMaintainability: {
                score: this.calculateMaintainabilityScore(testResults),
                grade: this.getMaintainabilityGrade(testResults)
            },
            testPerformance: {
                score: this.calculatePerformanceScore(testResults),
                grade: this.getPerformanceGrade(testResults)
            },
            recommendations: []
        };

        // 전체 점수 계산
        assessment.overallScore = (
            assessment.testCoverage.score +
            assessment.testReliability.score +
            assessment.testMaintainability.score +
            assessment.testPerformance.score
        ) / 4;

        return assessment;
    }

    /**
     * 개선 제안 생성
     */
    private async generateImprovementSuggestions(
        testResults: TestResult[],
        coverageAnalysis: any,
        qualityAssessment: TestQualityAssessment
    ): Promise<ImprovementSuggestion[]> {
        const suggestions: ImprovementSuggestion[] = [];

        // 커버리지 기반 제안
        if (coverageAnalysis.metrics.overall < 80) {
            suggestions.push({
                category: 'coverage',
                priority: 'high',
                title: '테스트 커버리지 향상',
                description: '전체 테스트 커버리지를 80% 이상으로 향상시키세요.',
                action: '추가 테스트 작성',
                impact: 'high',
                effort: 'medium'
            });
        }

        // 신뢰성 기반 제안
        const failedTests = testResults.reduce((sum, result) => sum + result.failed, 0);
        if (failedTests > 0) {
            suggestions.push({
                category: 'reliability',
                priority: 'high',
                title: '실패한 테스트 수정',
                description: `${failedTests}개의 실패한 테스트를 수정하세요.`,
                action: '테스트 디버깅 및 수정',
                impact: 'high',
                effort: 'medium'
            });
        }

        // 성능 기반 제안
        const slowTests = testResults.filter(result => result.duration > 5000);
        if (slowTests.length > 0) {
            suggestions.push({
                category: 'performance',
                priority: 'medium',
                title: '느린 테스트 최적화',
                description: `${slowTests.length}개의 느린 테스트를 최적화하세요.`,
                action: '테스트 성능 개선',
                impact: 'medium',
                effort: 'low'
            });
        }

        // 유지보수성 기반 제안
        if (qualityAssessment.testMaintainability.score < 70) {
            suggestions.push({
                category: 'maintainability',
                priority: 'medium',
                title: '테스트 코드 리팩토링',
                description: '테스트 코드의 가독성과 유지보수성을 개선하세요.',
                action: '테스트 코드 리팩토링',
                impact: 'medium',
                effort: 'high'
            });
        }

        return suggestions;
    }

    /**
     * 최종 리포트 생성
     */
    private async generateFinalReport(
        testResults: TestResult[],
        coverageAnalysis: any,
        qualityAssessment: TestQualityAssessment,
        improvements: ImprovementSuggestion[]
    ): Promise<string> {
        const report = {
            summary: this.generateSummary(testResults, coverageAnalysis, qualityAssessment),
            testResults: {
                total: testResults.length,
                passed: testResults.reduce((sum, r) => sum + r.passed, 0),
                failed: testResults.reduce((sum, r) => sum + r.failed, 0),
                skipped: testResults.reduce((sum, r) => sum + r.skipped, 0),
                duration: testResults.reduce((sum, r) => sum + r.duration, 0)
            },
            coverage: {
                overall: coverageAnalysis.metrics.overall,
                lines: coverageAnalysis.metrics.lines.percentage,
                functions: coverageAnalysis.metrics.functions.percentage,
                branches: coverageAnalysis.metrics.branches.percentage,
                statements: coverageAnalysis.metrics.statements.percentage
            },
            quality: qualityAssessment,
            improvements,
            generatedAt: new Date().toISOString()
        };

        const fs = await import('fs/promises');
        const path = await import('path');

        const reportPath = path.join(this.projectPath, 'automated-testing-report.json');
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

        return reportPath;
    }

    /**
     * 요약 생성
     */
    private generateSummary(
        testResults: TestResult[],
        coverageAnalysis: any,
        qualityAssessment: TestQualityAssessment
    ): TestingSummary {
        const totalTests = testResults.reduce((sum, r) => sum + r.passed + r.failed + r.skipped, 0);
        const passedTests = testResults.reduce((sum, r) => sum + r.passed, 0);
        const failedTests = testResults.reduce((sum, r) => sum + r.failed, 0);

        return {
            totalTests,
            passedTests,
            failedTests,
            skippedTests: totalTests - passedTests - failedTests,
            passRate: totalTests > 0 ? (passedTests / totalTests) * 100 : 0,
            coverage: coverageAnalysis.metrics.overall,
            qualityScore: qualityAssessment.overallScore,
            status: this.determineOverallStatus(passedTests, failedTests, coverageAnalysis.metrics.overall),
            duration: testResults.reduce((sum, r) => sum + r.duration, 0)
        };
    }

    // 헬퍼 메서드들
    private getCoverageGrade(score: number): string {
        if (score >= 90) return 'A';
        if (score >= 80) return 'B';
        if (score >= 70) return 'C';
        if (score >= 60) return 'D';
        return 'F';
    }

    private calculateReliabilityScore(testResults: TestResult[]): number {
        const totalTests = testResults.reduce((sum, r) => sum + r.passed + r.failed, 0);
        const passedTests = testResults.reduce((sum, r) => sum + r.passed, 0);
        return totalTests > 0 ? (passedTests / totalTests) * 100 : 0;
    }

    private getReliabilityGrade(testResults: TestResult[]): string {
        const score = this.calculateReliabilityScore(testResults);
        if (score >= 95) return 'A';
        if (score >= 90) return 'B';
        if (score >= 80) return 'C';
        if (score >= 70) return 'D';
        return 'F';
    }

    private calculateMaintainabilityScore(testResults: TestResult[]): number {
        // 테스트 구조, 명명 규칙, 문서화 등을 기반으로 계산
        let score = 80; // 기본 점수

        // 테스트 이름 품질
        const testNameQuality = this.assessTestNameQuality(testResults);
        score += testNameQuality * 0.2;

        // 테스트 구조 품질
        const testStructureQuality = this.assessTestStructureQuality(testResults);
        score += testStructureQuality * 0.3;

        // 문서화 품질
        const documentationQuality = this.assessDocumentationQuality(testResults);
        score += documentationQuality * 0.1;

        return Math.min(100, Math.max(0, score));
    }

    private getMaintainabilityGrade(testResults: TestResult[]): string {
        const score = this.calculateMaintainabilityScore(testResults);
        if (score >= 85) return 'A';
        if (score >= 75) return 'B';
        if (score >= 65) return 'C';
        if (score >= 55) return 'D';
        return 'F';
    }

    private calculatePerformanceScore(testResults: TestResult[]): number {
        const avgDuration = testResults.reduce((sum, r) => sum + r.duration, 0) / testResults.length;

        // 평균 실행 시간이 1초 이하면 100점, 5초 이하면 80점, 10초 이하면 60점
        if (avgDuration <= 1000) return 100;
        if (avgDuration <= 5000) return 80;
        if (avgDuration <= 10000) return 60;
        return 40;
    }

    private getPerformanceGrade(testResults: TestResult[]): string {
        const score = this.calculatePerformanceScore(testResults);
        if (score >= 90) return 'A';
        if (score >= 80) return 'B';
        if (score >= 70) return 'C';
        if (score >= 60) return 'D';
        return 'F';
    }

    private assessTestNameQuality(testResults: TestResult[]): number {
        // 테스트 이름 품질 평가 로직
        return 80; // 임시 값
    }

    private assessTestStructureQuality(testResults: TestResult[]): number {
        // 테스트 구조 품질 평가 로직
        return 75; // 임시 값
    }

    private assessDocumentationQuality(testResults: TestResult[]): number {
        // 문서화 품질 평가 로직
        return 70; // 임시 값
    }

    /**
     * 지능형 테스트 생성
     */
    async generateIntelligentTests(
        filePath: string,
        codeContent: string,
        options: {
            language?: 'typescript' | 'javascript' | 'python' | 'java' | 'csharp';
            testType?: 'unit' | 'integration' | 'e2e' | 'performance' | 'security';
            framework?: 'jest' | 'vitest' | 'playwright' | 'k6' | 'lighthouse' | 'cypress';
            complexity?: 'low' | 'medium' | 'high';
            coverage?: number;
            customRequirements?: string[];
        } = {}
    ): Promise<TestGenerationResult> {
        const request: TestGenerationRequest = {
            filePath,
            codeContent,
            language: options.language || 'typescript',
            testType: options.testType || 'unit',
            framework: options.framework || 'jest',
            complexity: options.complexity || 'medium',
            coverage: options.coverage || 80,
            customRequirements: options.customRequirements || []
        };

        return await this.intelligentTestGenerator.generateTests(request);
    }

    private determineOverallStatus(
        passedTests: number,
        failedTests: number,
        coverage: number
    ): 'excellent' | 'good' | 'fair' | 'poor' {
        if (failedTests === 0 && coverage >= 90) return 'excellent';
        if (failedTests === 0 && coverage >= 80) return 'good';
        if (failedTests <= 2 && coverage >= 70) return 'fair';
        return 'poor';
    }
}

// 타입 정의
interface AutomatedTestingResult {
    generatedTests: CodeFile[];
    testResults: TestResult[];
    coverageAnalysis: any;
    qualityAssessment: TestQualityAssessment;
    improvements: ImprovementSuggestion[];
    finalReport: string;
    summary: TestingSummary;
}

interface TestQualityAssessment {
    overallScore: number;
    testCoverage: QualityMetric;
    testReliability: QualityMetric;
    testMaintainability: QualityMetric;
    testPerformance: QualityMetric;
    recommendations: string[];
}

interface QualityMetric {
    score: number;
    grade: string;
}

interface ImprovementSuggestion {
    category: 'coverage' | 'reliability' | 'performance' | 'maintainability';
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    action: string;
    impact: 'high' | 'medium' | 'low';
    effort: 'high' | 'medium' | 'low';
}

interface TestingSummary {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    skippedTests: number;
    passRate: number;
    coverage: number;
    qualityScore: number;
    status: 'excellent' | 'good' | 'fair' | 'poor';
    duration: number;
}
