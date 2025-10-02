// Page-Level Test Runner
// Comprehensive testing system for all action generator pages and components

import { PageTestSuite, TestResult, TestConfig, TestReport } from './types';
import { ActionTestPageTests } from './ActionTestPage.test';
import { AnalyticsDashboardTests } from './AnalyticsDashboard.test';
import { BulkActionsPanelTests } from './BulkActionsPanel.test';
import { SchedulerDashboardTests } from './SchedulerDashboard.test';
import { TemplateDashboardTests } from './TemplateDashboard.test';
import { AdvancedActionDashboardTests } from './AdvancedActionDashboard.test';
import { HomePageTests } from './HomePage.test';
import { HeaderTests } from './Header.test';
import { ActionButtonsTests } from './ActionButtons.test';
import { PaginationControlsTests } from './PaginationControls.test';

export class PageTestRunner {
    private testSuites: Map<string, PageTestSuite> = new Map();
    private results: Map<string, TestResult[]> = new Map();
    private config: TestConfig;
    private isRunning: boolean = false;

    constructor(config: TestConfig) {
        this.config = config;
        this.initializeTestSuites();
    }

    private initializeTestSuites() {
        // Register all test suites
        this.testSuites.set('ActionTestPage', ActionTestPageTests);
        this.testSuites.set('AnalyticsDashboard', AnalyticsDashboardTests);
        this.testSuites.set('BulkActionsPanel', BulkActionsPanelTests);
        this.testSuites.set('SchedulerDashboard', SchedulerDashboardTests);
        this.testSuites.set('TemplateDashboard', TemplateDashboardTests);
        this.testSuites.set('AdvancedActionDashboard', AdvancedActionDashboardTests);
        this.testSuites.set('HomePage', HomePageTests);
        this.testSuites.set('Header', HeaderTests);
        this.testSuites.set('ActionButtons', ActionButtonsTests);
        this.testSuites.set('PaginationControls', PaginationControlsTests);
    }

    async runAllTests(): Promise<TestReport> {
        if (this.isRunning) {
            throw new Error('Test runner is already running');
        }

        this.isRunning = true;
        const startTime = Date.now();
        const report: TestReport = {
            totalTests: 0,
            passedTests: 0,
            failedTests: 0,
            skippedTests: 0,
            duration: 0,
            suites: [],
            timestamp: new Date().toISOString(),
            version: '1.0.0'
        };

        try {
            console.log('🚀 Starting page-level test suite...');

            for (const [suiteName, testSuite] of this.testSuites) {
                if (this.config.suites && !this.config.suites.includes(suiteName)) {
                    continue;
                }

                console.log(`📋 Running test suite: ${suiteName}`);
                const suiteResult = await this.runTestSuite(suiteName, testSuite);
                report.suites.push(suiteResult);
                report.totalTests += suiteResult.totalTests;
                report.passedTests += suiteResult.passedTests;
                report.failedTests += suiteResult.failedTests;
                report.skippedTests += suiteResult.skippedTests;
            }

            report.duration = Date.now() - startTime;

            console.log('✅ Page-level test suite completed');
            console.log(`📊 Results: ${report.passedTests}/${report.totalTests} tests passed`);

            if (report.failedTests > 0) {
                console.log(`❌ ${report.failedTests} tests failed`);
            }

            return report;
        } finally {
            this.isRunning = false;
        }
    }

    async runTestSuite(suiteName: string, testSuite: PageTestSuite): Promise<TestResult> {
        const suiteResult: TestResult = {
            suiteName,
            totalTests: 0,
            passedTests: 0,
            failedTests: 0,
            skippedTests: 0,
            duration: 0,
            tests: [],
            timestamp: new Date().toISOString()
        };

        const startTime = Date.now();

        try {
            // Setup
            if (testSuite.setup) {
                await testSuite.setup();
            }

            // Run tests
            for (const test of testSuite.tests) {
                if (this.config.tests && !this.config.tests.includes(test.name)) {
                    continue;
                }

                const testResult = await this.runSingleTest(test);
                suiteResult.tests.push(testResult);
                suiteResult.totalTests++;

                if (testResult.status === 'passed') {
                    suiteResult.passedTests++;
                } else if (testResult.status === 'failed') {
                    suiteResult.failedTests++;
                } else {
                    suiteResult.skippedTests++;
                }
            }

            // Teardown
            if (testSuite.teardown) {
                await testSuite.teardown();
            }

        } catch (error) {
            console.error(`❌ Test suite ${suiteName} failed:`, error);
            suiteResult.error = error instanceof Error ? error.message : 'Unknown error';
        }

        suiteResult.duration = Date.now() - startTime;
        this.results.set(suiteName, suiteResult.tests);

        return suiteResult;
    }

    private async runSingleTest(test: any): Promise<any> {
        const testResult = {
            name: test.name,
            status: 'pending' as 'pending' | 'passed' | 'failed' | 'skipped',
            duration: 0,
            error: null as string | null,
            steps: [] as any[],
            timestamp: new Date().toISOString()
        };

        const startTime = Date.now();

        try {
            console.log(`  🔍 Running test: ${test.name}`);

            if (test.skip) {
                testResult.status = 'skipped';
                return testResult;
            }

            // Run test steps
            for (const step of test.steps) {
                const stepResult = await this.runTestStep(step);
                testResult.steps.push(stepResult);

                if (stepResult.status === 'failed') {
                    testResult.status = 'failed';
                    testResult.error = stepResult.error;
                    break;
                }
            }

            if (testResult.status === 'pending') {
                testResult.status = 'passed';
            }

        } catch (error) {
            testResult.status = 'failed';
            testResult.error = error instanceof Error ? error.message : 'Unknown error';
            console.error(`    ❌ Test failed: ${test.name}`, error);
        }

        testResult.duration = Date.now() - startTime;

        if (testResult.status === 'passed') {
            console.log(`    ✅ Test passed: ${test.name} (${testResult.duration}ms)`);
        } else if (testResult.status === 'failed') {
            console.log(`    ❌ Test failed: ${test.name} (${testResult.duration}ms)`);
        }

        return testResult;
    }

    private async runTestStep(step: any): Promise<any> {
        const stepResult = {
            name: step.name,
            status: 'pending' as 'pending' | 'passed' | 'failed',
            duration: 0,
            error: null as string | null,
            timestamp: new Date().toISOString()
        };

        const startTime = Date.now();

        try {
            await step.action();
            stepResult.status = 'passed';
        } catch (error) {
            stepResult.status = 'failed';
            stepResult.error = error instanceof Error ? error.message : 'Unknown error';
        }

        stepResult.duration = Date.now() - startTime;
        return stepResult;
    }

    // Get test results for a specific suite
    getSuiteResults(suiteName: string): TestResult[] | undefined {
        return this.results.get(suiteName);
    }

    // Get all test results
    getAllResults(): Map<string, TestResult[]> {
        return new Map(this.results);
    }

    // Generate test report
    generateReport(): TestReport {
        const suites = Array.from(this.results.entries()).map(([suiteName, tests]) => ({
            suiteName,
            totalTests: tests.length,
            passedTests: tests.filter(t => t.status === 'passed').length,
            failedTests: tests.filter(t => t.status === 'failed').length,
            skippedTests: tests.filter(t => t.status === 'skipped').length,
            duration: tests.reduce((sum, t) => sum + t.duration, 0),
            tests,
            timestamp: new Date().toISOString()
        }));

        const totalTests = suites.reduce((sum, s) => sum + s.totalTests, 0);
        const passedTests = suites.reduce((sum, s) => sum + s.passedTests, 0);
        const failedTests = suites.reduce((sum, s) => sum + s.failedTests, 0);
        const skippedTests = suites.reduce((sum, s) => sum + s.skippedTests, 0);

        return {
            totalTests,
            passedTests,
            failedTests,
            skippedTests,
            duration: suites.reduce((sum, s) => sum + s.duration, 0),
            suites,
            timestamp: new Date().toISOString(),
            version: '1.0.0'
        };
    }

    // Export test results
    exportResults(format: 'json' | 'csv' | 'html'): string {
        const report = this.generateReport();

        switch (format) {
            case 'json':
                return JSON.stringify(report, null, 2);
            case 'csv':
                return this.generateCSVReport(report);
            case 'html':
                return this.generateHTMLReport(report);
            default:
                throw new Error(`Unsupported format: ${format}`);
        }
    }

    private generateCSVReport(report: TestReport): string {
        const headers = ['Suite', 'Test', 'Status', 'Duration (ms)', 'Error'];
        const rows = [headers];

        for (const suite of report.suites) {
            for (const test of suite.tests) {
                rows.push([
                    suite.suiteName,
                    test.name,
                    test.status,
                    test.duration.toString(),
                    test.error || ''
                ]);
            }
        }

        return rows.map(row => row.map(field => `"${field}"`).join(',')).join('\n');
    }

    private generateHTMLReport(report: TestReport): string {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>Page-Level Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 5px; }
        .summary { display: flex; gap: 20px; margin: 20px 0; }
        .stat { text-align: center; padding: 10px; border: 1px solid #ddd; border-radius: 5px; }
        .passed { color: green; }
        .failed { color: red; }
        .skipped { color: orange; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .error { color: red; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Page-Level Test Report</h1>
        <p>Generated: ${report.timestamp}</p>
        <p>Version: ${report.version}</p>
    </div>
    
    <div class="summary">
        <div class="stat">
            <h3>Total Tests</h3>
            <p>${report.totalTests}</p>
        </div>
        <div class="stat">
            <h3 class="passed">Passed</h3>
            <p>${report.passedTests}</p>
        </div>
        <div class="stat">
            <h3 class="failed">Failed</h3>
            <p>${report.failedTests}</p>
        </div>
        <div class="stat">
            <h3 class="skipped">Skipped</h3>
            <p>${report.skippedTests}</p>
        </div>
    </div>
    
    <h2>Test Results</h2>
    <table>
        <thead>
            <tr>
                <th>Suite</th>
                <th>Test</th>
                <th>Status</th>
                <th>Duration (ms)</th>
                <th>Error</th>
            </tr>
        </thead>
        <tbody>
            ${report.suites.map(suite =>
            suite.tests.map(test => `
                <tr>
                    <td>${suite.suiteName}</td>
                    <td>${test.name}</td>
                    <td class="${test.status}">${test.status}</td>
                    <td>${test.duration}</td>
                    <td class="error">${test.error || ''}</td>
                </tr>
              `).join('')
        ).join('')}
        </tbody>
    </table>
</body>
</html>`;
    }

    // Clear all results
    clearResults(): void {
        this.results.clear();
    }

    // Get test configuration
    getConfig(): TestConfig {
        return { ...this.config };
    }

    // Update test configuration
    updateConfig(config: Partial<TestConfig>): void {
        this.config = { ...this.config, ...config };
    }
}

// Default test configuration
export const defaultTestConfig: TestConfig = {
    suites: undefined, // Run all suites
    tests: undefined, // Run all tests
    timeout: 30000, // 30 seconds per test
    retries: 2,
    parallel: false,
    verbose: true,
    headless: true,
    baseUrl: 'http://localhost:5002'
};

// Create default test runner instance
export const pageTestRunner = new PageTestRunner(defaultTestConfig);
