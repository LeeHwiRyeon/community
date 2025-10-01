import fs from 'fs/promises';
import path from 'path';
import { TestResult, Issue } from '@/types';

export class CoverageAnalyzer {
    private projectPath: string;
    private coverageThresholds: CoverageThresholds;

    constructor(projectPath: string, thresholds?: Partial<CoverageThresholds>) {
        this.projectPath = projectPath;
        this.coverageThresholds = {
            lines: 80,
            functions: 80,
            branches: 80,
            statements: 80,
            ...thresholds
        };
    }

    /**
     * 커버리지 분석 실행
     */
    async analyzeCoverage(): Promise<CoverageAnalysis> {
        console.log('📊 커버리지 분석 중...');

        try {
            // 1. 커버리지 데이터 수집
            const coverageData = await this.collectCoverageData();

            // 2. 커버리지 메트릭 계산
            const metrics = this.calculateCoverageMetrics(coverageData);

            // 3. 커버리지 이슈 분석
            const issues = await this.analyzeCoverageIssues(coverageData);

            // 4. 커버리지 트렌드 분석
            const trends = await this.analyzeCoverageTrends();

            // 5. 개선 제안 생성
            const recommendations = this.generateCoverageRecommendations(metrics, issues);

            // 6. 커버리지 리포트 생성
            const report = await this.generateCoverageReport(metrics, issues, trends, recommendations);

            console.log('✅ 커버리지 분석 완료');

            return {
                metrics,
                issues,
                trends,
                recommendations,
                report,
                generatedAt: new Date()
            };

        } catch (error) {
            console.error('❌ 커버리지 분석 실패:', error);
            throw error;
        }
    }

    /**
     * 커버리지 데이터 수집
     */
    private async collectCoverageData(): Promise<CoverageData> {
        const coverageFile = path.join(this.projectPath, 'coverage', 'coverage-summary.json');

        try {
            const coverageContent = await fs.readFile(coverageFile, 'utf-8');
            const coverage = JSON.parse(coverageContent);

            return {
                summary: coverage.total || {},
                files: coverage || {},
                timestamp: new Date()
            };
        } catch (error) {
            console.warn('커버리지 파일을 찾을 수 없습니다. 기본값을 사용합니다.');
            return {
                summary: {},
                files: {},
                timestamp: new Date()
            };
        }
    }

    /**
     * 커버리지 메트릭 계산
     */
    private calculateCoverageMetrics(coverageData: CoverageData): CoverageMetrics {
        const summary = coverageData.summary;

        return {
            lines: {
                covered: summary.lines?.covered || 0,
                total: summary.lines?.total || 0,
                percentage: summary.lines?.pct || 0
            },
            functions: {
                covered: summary.functions?.covered || 0,
                total: summary.functions?.total || 0,
                percentage: summary.functions?.pct || 0
            },
            branches: {
                covered: summary.branches?.covered || 0,
                total: summary.branches?.total || 0,
                percentage: summary.branches?.pct || 0
            },
            statements: {
                covered: summary.statements?.covered || 0,
                total: summary.statements?.total || 0,
                percentage: summary.statements?.pct || 0
            },
            overall: this.calculateOverallCoverage(summary)
        };
    }

    /**
     * 전체 커버리지 계산
     */
    private calculateOverallCoverage(summary: any): number {
        const metrics = ['lines', 'functions', 'branches', 'statements'];
        const totalPercentage = metrics.reduce((sum, metric) => {
            return sum + (summary[metric]?.pct || 0);
        }, 0);

        return totalPercentage / metrics.length;
    }

    /**
     * 커버리지 이슈 분석
     */
    private async analyzeCoverageIssues(coverageData: CoverageData): Promise<Issue[]> {
        const issues: Issue[] = [];

        // 임계값 미달 이슈
        const thresholdIssues = this.analyzeThresholdIssues(coverageData.summary);
        issues.push(...thresholdIssues);

        // 파일별 커버리지 이슈
        const fileIssues = this.analyzeFileCoverageIssues(coverageData.files);
        issues.push(...fileIssues);

        // 커버리지 격차 이슈
        const gapIssues = this.analyzeCoverageGaps(coverageData);
        issues.push(...gapIssues);

        return issues;
    }

    /**
     * 임계값 미달 이슈 분석
     */
    private analyzeThresholdIssues(summary: any): Issue[] {
        const issues: Issue[] = [];
        const metrics = ['lines', 'functions', 'branches', 'statements'];

        for (const metric of metrics) {
            const percentage = summary[metric]?.pct || 0;
            const threshold = this.coverageThresholds[metric as keyof CoverageThresholds];

            if (percentage < threshold) {
                issues.push({
                    id: this.generateId(),
                    type: 'warning',
                    severity: 'medium',
                    message: `${metric} 커버리지가 ${percentage.toFixed(2)}%로 임계값 ${threshold}% 미만입니다.`,
                    file: 'coverage-summary',
                    line: 0,
                    column: 0,
                    rule: 'coverage-threshold',
                    fix: `테스트를 추가하여 ${metric} 커버리지를 ${threshold}% 이상으로 향상시키세요.`
                });
            }
        }

        return issues;
    }

    /**
     * 파일별 커버리지 이슈 분석
     */
    private analyzeFileCoverageIssues(files: any): Issue[] {
        const issues: Issue[] = [];

        for (const [filePath, fileCoverage] of Object.entries(files)) {
            if (typeof fileCoverage === 'object' && fileCoverage !== null) {
                const coverage = fileCoverage as any;

                // 낮은 커버리지 파일 식별
                const overallCoverage = this.calculateOverallCoverage(coverage);
                if (overallCoverage < 50) {
                    issues.push({
                        id: this.generateId(),
                        type: 'warning',
                        severity: 'high',
                        message: `파일 ${filePath}의 커버리지가 ${overallCoverage.toFixed(2)}%로 매우 낮습니다.`,
                        file: filePath,
                        line: 0,
                        column: 0,
                        rule: 'low-file-coverage',
                        fix: '이 파일에 대한 테스트를 추가하세요.'
                    });
                }

                // 미커버된 함수 식별
                const uncoveredFunctions = this.findUncoveredFunctions(coverage);
                for (const func of uncoveredFunctions) {
                    issues.push({
                        id: this.generateId(),
                        type: 'info',
                        severity: 'low',
                        message: `함수 ${func.name}이 테스트되지 않았습니다.`,
                        file: filePath,
                        line: func.line,
                        column: func.column,
                        rule: 'uncovered-function',
                        fix: `${func.name} 함수에 대한 테스트를 작성하세요.`
                    });
                }
            }
        }

        return issues;
    }

    /**
     * 커버리지 격차 분석
     */
    private analyzeCoverageGaps(coverageData: CoverageData): Issue[] {
        const issues: Issue[] = [];

        // 브랜치 커버리지와 라인 커버리지 간의 격차
        const lineCoverage = coverageData.summary.lines?.pct || 0;
        const branchCoverage = coverageData.summary.branches?.pct || 0;
        const gap = lineCoverage - branchCoverage;

        if (gap > 20) {
            issues.push({
                id: this.generateId(),
                type: 'warning',
                severity: 'medium',
                message: `브랜치 커버리지와 라인 커버리지 간의 격차가 ${gap.toFixed(2)}%입니다.`,
                file: 'coverage-summary',
                line: 0,
                column: 0,
                rule: 'coverage-gap',
                fix: '조건문과 분기문에 대한 테스트를 추가하세요.'
            });
        }

        return issues;
    }

    /**
     * 커버리지 트렌드 분석
     */
    private async analyzeCoverageTrends(): Promise<CoverageTrends> {
        try {
            // 이전 커버리지 데이터 로드
            const previousCoverage = await this.loadPreviousCoverage();

            if (!previousCoverage) {
                return {
                    trend: 'stable',
                    change: 0,
                    direction: 'none'
                };
            }

            const currentCoverage = await this.collectCoverageData();
            const currentOverall = this.calculateOverallCoverage(currentCoverage.summary);
            const previousOverall = this.calculateOverallCoverage(previousCoverage.summary);

            const change = currentOverall - previousOverall;
            const direction = change > 0 ? 'up' : change < 0 ? 'down' : 'none';
            const trend = Math.abs(change) > 5 ? (change > 0 ? 'improving' : 'declining') : 'stable';

            return {
                trend,
                change: Math.abs(change),
                direction
            };
        } catch (error) {
            console.warn('이전 커버리지 데이터를 로드할 수 없습니다.');
            return {
                trend: 'stable',
                change: 0,
                direction: 'none'
            };
        }
    }

    /**
     * 커버리지 개선 제안 생성
     */
    private generateCoverageRecommendations(metrics: CoverageMetrics, issues: Issue[]): string[] {
        const recommendations: string[] = [];

        // 전체 커버리지 기반 제안
        if (metrics.overall < 70) {
            recommendations.push('전체 테스트 커버리지를 70% 이상으로 향상시키세요.');
        } else if (metrics.overall < 80) {
            recommendations.push('전체 테스트 커버리지를 80% 이상으로 향상시키세요.');
        } else if (metrics.overall < 90) {
            recommendations.push('전체 테스트 커버리지를 90% 이상으로 향상시키세요.');
        }

        // 메트릭별 제안
        if (metrics.branches.percentage < 70) {
            recommendations.push('조건문과 분기문에 대한 테스트를 추가하여 브랜치 커버리지를 향상시키세요.');
        }

        if (metrics.functions.percentage < 80) {
            recommendations.push('모든 함수에 대한 테스트를 작성하여 함수 커버리지를 향상시키세요.');
        }

        // 이슈 기반 제안
        const uncoveredFunctions = issues.filter(issue => issue.rule === 'uncovered-function');
        if (uncoveredFunctions.length > 0) {
            recommendations.push(`${uncoveredFunctions.length}개의 미테스트 함수에 대한 테스트를 작성하세요.`);
        }

        const lowCoverageFiles = issues.filter(issue => issue.rule === 'low-file-coverage');
        if (lowCoverageFiles.length > 0) {
            recommendations.push(`${lowCoverageFiles.length}개의 낮은 커버리지 파일에 대한 테스트를 추가하세요.`);
        }

        return recommendations;
    }

    /**
     * 커버리지 리포트 생성
     */
    private async generateCoverageReport(
        metrics: CoverageMetrics,
        issues: Issue[],
        trends: CoverageTrends,
        recommendations: string[]
    ): Promise<string> {
        const report = {
            summary: {
                overall: metrics.overall,
                lines: metrics.lines.percentage,
                functions: metrics.functions.percentage,
                branches: metrics.branches.percentage,
                statements: metrics.statements.percentage
            },
            metrics,
            issues: {
                total: issues.length,
                bySeverity: this.groupIssuesBySeverity(issues),
                byRule: this.groupIssuesByRule(issues)
            },
            trends,
            recommendations,
            generatedAt: new Date().toISOString()
        };

        const reportPath = path.join(this.projectPath, 'coverage-analysis-report.json');
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

        return reportPath;
    }

    // 헬퍼 메서드들
    private findUncoveredFunctions(coverage: any): Array<{ name: string; line: number; column: number }> {
        const uncovered: Array<{ name: string; line: number; column: number }> = [];

        if (coverage.functions) {
            for (const func of coverage.functions) {
                if (func.hits === 0) {
                    uncovered.push({
                        name: func.name || 'anonymous',
                        line: func.line || 0,
                        column: func.column || 0
                    });
                }
            }
        }

        return uncovered;
    }

    private groupIssuesBySeverity(issues: Issue[]): Record<string, number> {
        return issues.reduce((acc, issue) => {
            acc[issue.severity] = (acc[issue.severity] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
    }

    private groupIssuesByRule(issues: Issue[]): Record<string, number> {
        return issues.reduce((acc, issue) => {
            acc[issue.rule] = (acc[issue.rule] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
    }

    private async loadPreviousCoverage(): Promise<any> {
        try {
            const previousFile = path.join(this.projectPath, 'coverage', 'previous-coverage.json');
            const content = await fs.readFile(previousFile, 'utf-8');
            return JSON.parse(content);
        } catch (error) {
            return null;
        }
    }

    /**
     * 고유 ID 생성
     */
    private generateId(): string {
        return Math.random().toString(36).substr(2, 9);
    }
}

// 타입 정의
interface CoverageThresholds {
    lines: number;
    functions: number;
    branches: number;
    statements: number;
}

interface CoverageData {
    summary: any;
    files: any;
    timestamp: Date;
}

interface CoverageMetrics {
    lines: CoverageMetric;
    functions: CoverageMetric;
    branches: CoverageMetric;
    statements: CoverageMetric;
    overall: number;
}

interface CoverageMetric {
    covered: number;
    total: number;
    percentage: number;
}

interface CoverageTrends {
    trend: 'improving' | 'declining' | 'stable';
    change: number;
    direction: 'up' | 'down' | 'none';
}

interface CoverageAnalysis {
    metrics: CoverageMetrics;
    issues: Issue[];
    trends: CoverageTrends;
    recommendations: string[];
    report: string;
    generatedAt: Date;
}
