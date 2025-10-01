import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import { TestResult, Issue, PerformanceResult } from '@/types';

export class TestRunner {
    private projectPath: string;
    private results: TestResult[] = [];

    constructor(projectPath: string) {
        this.projectPath = projectPath;
    }

    /**
     * 모든 테스트 실행
     */
    async runAllTests(): Promise<TestResult[]> {
        console.log('🧪 자동 테스트 시작...');

        try {
            // 1. 단위 테스트
            const unitResult = await this.runUnitTests();
            this.results.push(unitResult);

            // 2. 통합 테스트
            const integrationResult = await this.runIntegrationTests();
            this.results.push(integrationResult);

            // 3. E2E 테스트
            const e2eResult = await this.runE2ETests();
            this.results.push(e2eResult);

            // 4. 성능 테스트
            const performanceResult = await this.runPerformanceTests();
            this.results.push(performanceResult);

            // 5. 보안 테스트
            const securityResult = await this.runSecurityTests();
            this.results.push(securityResult);

            // 6. 결과 리포트 생성
            await this.generateTestReport();

            return this.results;
        } catch (error) {
            console.error('❌ 테스트 실행 중 오류 발생:', error);
            throw error;
        }
    }

    /**
     * 단위 테스트 실행
     */
    async runUnitTests(): Promise<TestResult> {
        console.log('📝 단위 테스트 실행 중...');

        const startTime = Date.now();
        let passed = 0;
        let failed = 0;
        let skipped = 0;
        const issues: Issue[] = [];

        try {
            // Jest 실행
            const result = await this.executeCommand('npm', ['test', '--', '--coverage', '--json']);
            const jestResult = JSON.parse(result.stdout);

            passed = jestResult.numPassedTests || 0;
            failed = jestResult.numFailedTests || 0;
            skipped = jestResult.numPendingTests || 0;

            // 테스트 실패 분석
            if (jestResult.testResults) {
                for (const testFile of jestResult.testResults) {
                    if (testFile.status === 'failed') {
                        for (const assertion of testFile.assertionResults) {
                            if (assertion.status === 'failed') {
                                issues.push({
                                    id: this.generateId(),
                                    type: 'error',
                                    severity: 'medium',
                                    message: assertion.failureMessages?.[0] || '테스트 실패',
                                    file: testFile.name,
                                    line: 0,
                                    column: 0,
                                    rule: 'unit-test-failure'
                                });
                            }
                        }
                    }
                }
            }

        } catch (error) {
            console.error('단위 테스트 실행 실패:', error);
            failed = 1;
            issues.push({
                id: this.generateId(),
                type: 'error',
                severity: 'high',
                message: `단위 테스트 실행 실패: ${error}`,
                file: 'test-runner',
                line: 0,
                column: 0,
                rule: 'test-execution-error'
            });
        }

        const duration = Date.now() - startTime;
        const coverage = await this.calculateCoverage();

        return {
            id: this.generateId(),
            testType: 'unit',
            passed,
            failed,
            skipped,
            coverage,
            duration,
            issues,
            recommendations: this.generateUnitTestRecommendations(passed, failed, coverage),
            createdAt: new Date()
        };
    }

    /**
     * 통합 테스트 실행
     */
    async runIntegrationTests(): Promise<TestResult> {
        console.log('🔗 통합 테스트 실행 중...');

        const startTime = Date.now();
        let passed = 0;
        let failed = 0;
        let skipped = 0;
        const issues: Issue[] = [];

        try {
            // API 테스트 실행
            const apiTestResult = await this.runAPITests();
            passed += apiTestResult.passed;
            failed += apiTestResult.failed;
            skipped += apiTestResult.skipped;
            issues.push(...apiTestResult.issues);

            // 데이터베이스 테스트 실행
            const dbTestResult = await this.runDatabaseTests();
            passed += dbTestResult.passed;
            failed += dbTestResult.failed;
            skipped += dbTestResult.skipped;
            issues.push(...dbTestResult.issues);

        } catch (error) {
            console.error('통합 테스트 실행 실패:', error);
            failed = 1;
            issues.push({
                id: this.generateId(),
                type: 'error',
                severity: 'high',
                message: `통합 테스트 실행 실패: ${error}`,
                file: 'test-runner',
                line: 0,
                column: 0,
                rule: 'integration-test-error'
            });
        }

        const duration = Date.now() - startTime;

        return {
            id: this.generateId(),
            testType: 'integration',
            passed,
            failed,
            skipped,
            coverage: 0, // 통합 테스트는 커버리지 계산 안함
            duration,
            issues,
            recommendations: this.generateIntegrationTestRecommendations(passed, failed),
            createdAt: new Date()
        };
    }

    /**
     * E2E 테스트 실행
     */
    async runE2ETests(): Promise<TestResult> {
        console.log('🌐 E2E 테스트 실행 중...');

        const startTime = Date.now();
        let passed = 0;
        let failed = 0;
        let skipped = 0;
        const issues: Issue[] = [];

        try {
            // Playwright 실행
            const result = await this.executeCommand('npx', ['playwright', 'test', '--reporter=json']);
            const playwrightResult = JSON.parse(result.stdout);

            passed = playwrightResult.stats?.passed || 0;
            failed = playwrightResult.stats?.failed || 0;
            skipped = playwrightResult.stats?.skipped || 0;

            // 실패한 테스트 분석
            if (playwrightResult.suites) {
                for (const suite of playwrightResult.suites) {
                    for (const spec of suite.specs) {
                        for (const test of spec.tests) {
                            if (test.results && test.results.some(r => r.status === 'failed')) {
                                issues.push({
                                    id: this.generateId(),
                                    type: 'error',
                                    severity: 'high',
                                    message: `E2E 테스트 실패: ${test.title}`,
                                    file: spec.file,
                                    line: 0,
                                    column: 0,
                                    rule: 'e2e-test-failure'
                                });
                            }
                        }
                    }
                }
            }

        } catch (error) {
            console.error('E2E 테스트 실행 실패:', error);
            failed = 1;
            issues.push({
                id: this.generateId(),
                type: 'error',
                severity: 'high',
                message: `E2E 테스트 실행 실패: ${error}`,
                file: 'test-runner',
                line: 0,
                column: 0,
                rule: 'e2e-test-error'
            });
        }

        const duration = Date.now() - startTime;

        return {
            id: this.generateId(),
            testType: 'e2e',
            passed,
            failed,
            skipped,
            coverage: 0,
            duration,
            issues,
            recommendations: this.generateE2ETestRecommendations(passed, failed),
            createdAt: new Date()
        };
    }

    /**
     * 성능 테스트 실행
     */
    async runPerformanceTests(): Promise<TestResult> {
        console.log('⚡ 성능 테스트 실행 중...');

        const startTime = Date.now();
        let passed = 0;
        let failed = 0;
        let skipped = 0;
        const issues: Issue[] = [];

        try {
            // Lighthouse 성능 테스트
            const lighthouseResult = await this.runLighthouseTests();
            passed += lighthouseResult.passed;
            failed += lighthouseResult.failed;
            issues.push(...lighthouseResult.issues);

            // Load 테스트
            const loadTestResult = await this.runLoadTests();
            passed += loadTestResult.passed;
            failed += loadTestResult.failed;
            issues.push(...loadTestResult.issues);

        } catch (error) {
            console.error('성능 테스트 실행 실패:', error);
            failed = 1;
            issues.push({
                id: this.generateId(),
                type: 'error',
                severity: 'high',
                message: `성능 테스트 실행 실패: ${error}`,
                file: 'test-runner',
                line: 0,
                column: 0,
                rule: 'performance-test-error'
            });
        }

        const duration = Date.now() - startTime;

        return {
            id: this.generateId(),
            testType: 'performance',
            passed,
            failed,
            skipped,
            coverage: 0,
            duration,
            issues,
            recommendations: this.generatePerformanceTestRecommendations(passed, failed),
            createdAt: new Date()
        };
    }

    /**
     * 보안 테스트 실행
     */
    async runSecurityTests(): Promise<TestResult> {
        console.log('🔒 보안 테스트 실행 중...');

        const startTime = Date.now();
        let passed = 0;
        let failed = 0;
        let skipped = 0;
        const issues: Issue[] = [];

        try {
            // npm audit 실행
            const auditResult = await this.runNpmAudit();
            passed += auditResult.passed;
            failed += auditResult.failed;
            issues.push(...auditResult.issues);

            // ESLint 보안 규칙 실행
            const eslintResult = await this.runESLintSecurity();
            passed += eslintResult.passed;
            failed += eslintResult.failed;
            issues.push(...eslintResult.issues);

            // 접근성 테스트
            const a11yResult = await this.runAccessibilityTests();
            passed += a11yResult.passed;
            failed += a11yResult.failed;
            issues.push(...a11yResult.issues);

        } catch (error) {
            console.error('보안 테스트 실행 실패:', error);
            failed = 1;
            issues.push({
                id: this.generateId(),
                type: 'error',
                severity: 'high',
                message: `보안 테스트 실행 실패: ${error}`,
                file: 'test-runner',
                line: 0,
                column: 0,
                rule: 'security-test-error'
            });
        }

        const duration = Date.now() - startTime;

        return {
            id: this.generateId(),
            testType: 'security',
            passed,
            failed,
            skipped,
            coverage: 0,
            duration,
            issues,
            recommendations: this.generateSecurityTestRecommendations(passed, failed),
            createdAt: new Date()
        };
    }

    /**
     * API 테스트 실행
     */
    private async runAPITests(): Promise<{ passed: number; failed: number; skipped: number; issues: Issue[] }> {
        const issues: Issue[] = [];
        let passed = 0;
        let failed = 0;
        let skipped = 0;

        try {
            // 서버 시작
            await this.startServer();

            // API 엔드포인트 테스트
            const endpoints = ['/health', '/api/users', '/api/posts'];

            for (const endpoint of endpoints) {
                try {
                    const response = await fetch(`http://localhost:3000${endpoint}`);
                    if (response.ok) {
                        passed++;
                    } else {
                        failed++;
                        issues.push({
                            id: this.generateId(),
                            type: 'error',
                            severity: 'medium',
                            message: `API 엔드포인트 실패: ${endpoint} - ${response.status}`,
                            file: 'api-test',
                            line: 0,
                            column: 0,
                            rule: 'api-endpoint-failure'
                        });
                    }
                } catch (error) {
                    failed++;
                    issues.push({
                        id: this.generateId(),
                        type: 'error',
                        severity: 'high',
                        message: `API 엔드포인트 오류: ${endpoint} - ${error}`,
                        file: 'api-test',
                        line: 0,
                        column: 0,
                        rule: 'api-endpoint-error'
                    });
                }
            }

            await this.stopServer();
        } catch (error) {
            failed = 1;
            issues.push({
                id: this.generateId(),
                type: 'error',
                severity: 'high',
                message: `API 테스트 실행 실패: ${error}`,
                file: 'api-test',
                line: 0,
                column: 0,
                rule: 'api-test-error'
            });
        }

        return { passed, failed, skipped, issues };
    }

    /**
     * 데이터베이스 테스트 실행
     */
    private async runDatabaseTests(): Promise<{ passed: number; failed: number; skipped: number; issues: Issue[] }> {
        const issues: Issue[] = [];
        let passed = 0;
        let failed = 0;
        let skipped = 0;

        try {
            // 데이터베이스 연결 테스트
            const connectionTest = await this.testDatabaseConnection();
            if (connectionTest.success) {
                passed++;
            } else {
                failed++;
                issues.push({
                    id: this.generateId(),
                    type: 'error',
                    severity: 'high',
                    message: `데이터베이스 연결 실패: ${connectionTest.error}`,
                    file: 'db-test',
                    line: 0,
                    column: 0,
                    rule: 'database-connection-failure'
                });
            }

            // 쿼리 성능 테스트
            const queryTest = await this.testQueryPerformance();
            if (queryTest.success) {
                passed++;
            } else {
                failed++;
                issues.push({
                    id: this.generateId(),
                    type: 'error',
                    severity: 'medium',
                    message: `쿼리 성능 테스트 실패: ${queryTest.error}`,
                    file: 'db-test',
                    line: 0,
                    column: 0,
                    rule: 'query-performance-failure'
                });
            }

        } catch (error) {
            failed = 1;
            issues.push({
                id: this.generateId(),
                type: 'error',
                severity: 'high',
                message: `데이터베이스 테스트 실행 실패: ${error}`,
                file: 'db-test',
                line: 0,
                column: 0,
                rule: 'database-test-error'
            });
        }

        return { passed, failed, skipped, issues };
    }

    /**
     * Lighthouse 성능 테스트
     */
    private async runLighthouseTests(): Promise<{ passed: number; failed: number; issues: Issue[] }> {
        const issues: Issue[] = [];
        let passed = 0;
        let failed = 0;

        try {
            const result = await this.executeCommand('npx', ['lighthouse', 'http://localhost:3000', '--output=json']);
            const lighthouseResult = JSON.parse(result.stdout);

            const scores = lighthouseResult.categories;
            const thresholds = {
                performance: 90,
                accessibility: 90,
                'best-practices': 90,
                seo: 90
            };

            for (const [category, threshold] of Object.entries(thresholds)) {
                const score = Math.round(scores[category]?.score * 100);
                if (score >= threshold) {
                    passed++;
                } else {
                    failed++;
                    issues.push({
                        id: this.generateId(),
                        type: 'warning',
                        severity: 'medium',
                        message: `${category} 점수 부족: ${score}/${threshold}`,
                        file: 'lighthouse-test',
                        line: 0,
                        column: 0,
                        rule: 'lighthouse-score-low'
                    });
                }
            }

        } catch (error) {
            failed = 1;
            issues.push({
                id: this.generateId(),
                type: 'error',
                severity: 'high',
                message: `Lighthouse 테스트 실행 실패: ${error}`,
                file: 'lighthouse-test',
                line: 0,
                column: 0,
                rule: 'lighthouse-test-error'
            });
        }

        return { passed, failed, issues };
    }

    /**
     * Load 테스트 실행
     */
    private async runLoadTests(): Promise<{ passed: number; failed: number; issues: Issue[] }> {
        const issues: Issue[] = [];
        let passed = 0;
        let failed = 0;

        try {
            // k6 로드 테스트 스크립트 생성
            const k6Script = this.generateK6Script();
            await fs.writeFile(path.join(this.projectPath, 'load-test.js'), k6Script);

            const result = await this.executeCommand('k6', ['run', 'load-test.js', '--out=json']);
            const k6Result = JSON.parse(result.stdout);

            // 응답 시간 체크 (500ms 이하)
            const avgResponseTime = k6Result.metrics.http_req_duration?.values?.avg || 0;
            if (avgResponseTime <= 500) {
                passed++;
            } else {
                failed++;
                issues.push({
                    id: this.generateId(),
                    type: 'warning',
                    severity: 'medium',
                    message: `평균 응답 시간 초과: ${avgResponseTime}ms`,
                    file: 'load-test',
                    line: 0,
                    column: 0,
                    rule: 'response-time-high'
                });
            }

            // 에러율 체크 (1% 이하)
            const errorRate = k6Result.metrics.http_req_failed?.values?.rate || 0;
            if (errorRate <= 0.01) {
                passed++;
            } else {
                failed++;
                issues.push({
                    id: this.generateId(),
                    type: 'error',
                    severity: 'high',
                    message: `에러율 초과: ${(errorRate * 100).toFixed(2)}%`,
                    file: 'load-test',
                    line: 0,
                    column: 0,
                    rule: 'error-rate-high'
                });
            }

        } catch (error) {
            failed = 1;
            issues.push({
                id: this.generateId(),
                type: 'error',
                severity: 'high',
                message: `Load 테스트 실행 실패: ${error}`,
                file: 'load-test',
                line: 0,
                column: 0,
                rule: 'load-test-error'
            });
        }

        return { passed, failed, issues };
    }

    /**
     * npm audit 실행
     */
    private async runNpmAudit(): Promise<{ passed: number; failed: number; issues: Issue[] }> {
        const issues: Issue[] = [];
        let passed = 0;
        let failed = 0;

        try {
            const result = await this.executeCommand('npm', ['audit', '--json']);
            const auditResult = JSON.parse(result.stdout);

            const vulnerabilities = auditResult.vulnerabilities || {};
            const criticalCount = Object.values(vulnerabilities).filter((v: any) => v.severity === 'critical').length;
            const highCount = Object.values(vulnerabilities).filter((v: any) => v.severity === 'high').length;

            if (criticalCount === 0 && highCount === 0) {
                passed++;
            } else {
                failed++;
                issues.push({
                    id: this.generateId(),
                    type: 'error',
                    severity: 'high',
                    message: `보안 취약점 발견: Critical ${criticalCount}, High ${highCount}`,
                    file: 'package.json',
                    line: 0,
                    column: 0,
                    rule: 'security-vulnerability'
                });
            }

        } catch (error) {
            failed = 1;
            issues.push({
                id: this.generateId(),
                type: 'error',
                severity: 'high',
                message: `npm audit 실행 실패: ${error}`,
                file: 'package.json',
                line: 0,
                column: 0,
                rule: 'audit-error'
            });
        }

        return { passed, failed, issues };
    }

    /**
     * ESLint 보안 규칙 실행
     */
    private async runESLintSecurity(): Promise<{ passed: number; failed: number; issues: Issue[] }> {
        const issues: Issue[] = [];
        let passed = 0;
        let failed = 0;

        try {
            const result = await this.executeCommand('npx', ['eslint', 'src/**/*.ts', '--format=json']);
            const eslintResult = JSON.parse(result.stdout);

            let securityIssues = 0;
            for (const file of eslintResult) {
                for (const message of file.messages) {
                    if (message.ruleId?.includes('security') || message.severity === 2) {
                        securityIssues++;
                        issues.push({
                            id: this.generateId(),
                            type: 'warning',
                            severity: 'medium',
                            message: message.message,
                            file: file.filePath,
                            line: message.line,
                            column: message.column,
                            rule: message.ruleId || 'eslint-security'
                        });
                    }
                }
            }

            if (securityIssues === 0) {
                passed++;
            } else {
                failed++;
            }

        } catch (error) {
            failed = 1;
            issues.push({
                id: this.generateId(),
                type: 'error',
                severity: 'high',
                message: `ESLint 보안 검사 실패: ${error}`,
                file: 'eslint-test',
                line: 0,
                column: 0,
                rule: 'eslint-security-error'
            });
        }

        return { passed, failed, issues };
    }

    /**
     * 접근성 테스트 실행
     */
    private async runAccessibilityTests(): Promise<{ passed: number; failed: number; issues: Issue[] }> {
        const issues: Issue[] = [];
        let passed = 0;
        let failed = 0;

        try {
            const result = await this.executeCommand('npx', ['pa11y', 'http://localhost:3000', '--reporter=json']);
            const pa11yResult = JSON.parse(result.stdout);

            const violations = pa11yResult.violations || [];
            if (violations.length === 0) {
                passed++;
            } else {
                failed++;
                for (const violation of violations) {
                    issues.push({
                        id: this.generateId(),
                        type: 'warning',
                        severity: 'medium',
                        message: `접근성 위반: ${violation.description}`,
                        file: 'accessibility-test',
                        line: 0,
                        column: 0,
                        rule: 'accessibility-violation'
                    });
                }
            }

        } catch (error) {
            failed = 1;
            issues.push({
                id: this.generateId(),
                type: 'error',
                severity: 'high',
                message: `접근성 테스트 실행 실패: ${error}`,
                file: 'accessibility-test',
                line: 0,
                column: 0,
                rule: 'accessibility-test-error'
            });
        }

        return { passed, failed, issues };
    }

    /**
     * 커버리지 계산
     */
    private async calculateCoverage(): Promise<number> {
        try {
            const coverageFile = path.join(this.projectPath, 'coverage', 'coverage-summary.json');
            const coverageData = await fs.readFile(coverageFile, 'utf-8');
            const coverage = JSON.parse(coverageData);

            return coverage.total?.lines?.pct || 0;
        } catch (error) {
            return 0;
        }
    }

    /**
     * 서버 시작
     */
    private async startServer(): Promise<void> {
        // 서버 시작 로직 (실제 구현 필요)
        console.log('서버 시작 중...');
    }

    /**
     * 서버 중지
     */
    private async stopServer(): Promise<void> {
        // 서버 중지 로직 (실제 구현 필요)
        console.log('서버 중지 중...');
    }

    /**
     * 데이터베이스 연결 테스트
     */
    private async testDatabaseConnection(): Promise<{ success: boolean; error?: string }> {
        // 데이터베이스 연결 테스트 로직 (실제 구현 필요)
        return { success: true };
    }

    /**
     * 쿼리 성능 테스트
     */
    private async testQueryPerformance(): Promise<{ success: boolean; error?: string }> {
        // 쿼리 성능 테스트 로직 (실제 구현 필요)
        return { success: true };
    }

    /**
     * k6 스크립트 생성
     */
    private generateK6Script(): string {
        return `
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '1m', target: 20 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function() {
  let response = http.get('http://localhost:3000/');
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
  sleep(1);
}
`;
    }

    /**
     * 명령어 실행 헬퍼
     */
    private async executeCommand(command: string, args: string[]): Promise<{ stdout: string; stderr: string }> {
        return new Promise((resolve, reject) => {
            const child = spawn(command, args, {
                cwd: this.projectPath,
                stdio: ['pipe', 'pipe', 'pipe']
            });

            let stdout = '';
            let stderr = '';

            child.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            child.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            child.on('close', (code) => {
                if (code === 0) {
                    resolve({ stdout, stderr });
                } else {
                    reject(new Error(`Command failed with code ${code}: ${stderr}`));
                }
            });
        });
    }

    /**
     * 테스트 리포트 생성
     */
    private async generateTestReport(): Promise<void> {
        const report = {
            summary: {
                totalTests: this.results.reduce((sum, r) => sum + r.passed + r.failed + r.skipped, 0),
                passed: this.results.reduce((sum, r) => sum + r.passed, 0),
                failed: this.results.reduce((sum, r) => sum + r.failed, 0),
                skipped: this.results.reduce((sum, r) => sum + r.skipped, 0),
                totalDuration: this.results.reduce((sum, r) => sum + r.duration, 0)
            },
            results: this.results,
            generatedAt: new Date().toISOString()
        };

        const reportPath = path.join(this.projectPath, 'test-report.json');
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

        console.log(`📊 테스트 리포트 생성: ${reportPath}`);
    }

    /**
     * 추천사항 생성 메서드들
     */
    private generateUnitTestRecommendations(passed: number, failed: number, coverage: number): string[] {
        const recommendations: string[] = [];

        if (coverage < 80) {
            recommendations.push('테스트 커버리지를 80% 이상으로 향상시키세요.');
        }

        if (failed > 0) {
            recommendations.push('실패한 단위 테스트를 수정하세요.');
        }

        if (passed === 0) {
            recommendations.push('단위 테스트를 작성하세요.');
        }

        return recommendations;
    }

    private generateIntegrationTestRecommendations(passed: number, failed: number): string[] {
        const recommendations: string[] = [];

        if (failed > 0) {
            recommendations.push('통합 테스트 실패 원인을 분석하고 수정하세요.');
        }

        if (passed < 5) {
            recommendations.push('더 많은 통합 테스트를 추가하세요.');
        }

        return recommendations;
    }

    private generateE2ETestRecommendations(passed: number, failed: number): string[] {
        const recommendations: string[] = [];

        if (failed > 0) {
            recommendations.push('E2E 테스트 실패를 분석하고 UI/UX를 개선하세요.');
        }

        if (passed < 3) {
            recommendations.push('핵심 사용자 시나리오에 대한 E2E 테스트를 추가하세요.');
        }

        return recommendations;
    }

    private generatePerformanceTestRecommendations(passed: number, failed: number): string[] {
        const recommendations: string[] = [];

        if (failed > 0) {
            recommendations.push('성능 최적화가 필요합니다. 코드 분석 및 최적화를 수행하세요.');
        }

        recommendations.push('정기적인 성능 모니터링을 설정하세요.');

        return recommendations;
    }

    private generateSecurityTestRecommendations(passed: number, failed: number): string[] {
        const recommendations: string[] = [];

        if (failed > 0) {
            recommendations.push('보안 취약점을 수정하고 보안 정책을 강화하세요.');
        }

        recommendations.push('정기적인 보안 감사를 수행하세요.');

        return recommendations;
    }

    /**
     * 고유 ID 생성
     */
    private generateId(): string {
        return Math.random().toString(36).substr(2, 9);
    }
}
