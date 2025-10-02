// Page-Level Test Runner Script
// Executable script to run all page-level tests

import { PageTestRunner, defaultTestConfig } from './PageTestRunner';
import { TestConfig } from './types';

// Test configuration
const testConfig: TestConfig = {
    ...defaultTestConfig,
    suites: undefined, // Run all suites
    tests: undefined, // Run all tests
    timeout: 30000,
    retries: 2,
    parallel: false,
    verbose: true,
    headless: true,
    baseUrl: 'http://localhost:5002'
};

// Create test runner instance
const testRunner = new PageTestRunner(testConfig);

// Main test execution function
async function runTests() {
    console.log('🚀 Starting Page-Level Test Suite');
    console.log('=====================================');
    console.log(`Base URL: ${testConfig.baseUrl}`);
    console.log(`Timeout: ${testConfig.timeout}ms`);
    console.log(`Retries: ${testConfig.retries}`);
    console.log(`Headless: ${testConfig.headless}`);
    console.log('=====================================\n');

    try {
        // Run all tests
        const report = await testRunner.runAllTests();

        // Display results
        console.log('\n📊 Test Results Summary');
        console.log('========================');
        console.log(`Total Tests: ${report.totalTests}`);
        console.log(`✅ Passed: ${report.passedTests}`);
        console.log(`❌ Failed: ${report.failedTests}`);
        console.log(`⏭️  Skipped: ${report.skippedTests}`);
        console.log(`⏱️  Duration: ${(report.duration / 1000).toFixed(2)}s`);
        console.log(`📈 Success Rate: ${((report.passedTests / report.totalTests) * 100).toFixed(1)}%`);

        // Display suite results
        console.log('\n📋 Suite Results');
        console.log('==================');
        for (const suite of report.suites) {
            const status = suite.failedTests > 0 ? '❌' : suite.passedTests > 0 ? '✅' : '⏭️';
            console.log(`${status} ${suite.suiteName}: ${suite.passedTests}/${suite.totalTests} passed (${(suite.duration / 1000).toFixed(2)}s)`);

            if (suite.failedTests > 0) {
                console.log('   Failed Tests:');
                for (const test of suite.tests) {
                    if (test.status === 'failed') {
                        console.log(`     ❌ ${test.name}: ${test.error}`);
                    }
                }
            }
        }

        // Export results
        console.log('\n💾 Exporting Results');
        console.log('====================');

        try {
            const jsonReport = testRunner.exportResults('json');
            const fs = require('fs');
            const path = require('path');

            const reportsDir = path.join(__dirname, 'reports');
            if (!fs.existsSync(reportsDir)) {
                fs.mkdirSync(reportsDir, { recursive: true });
            }

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const jsonPath = path.join(reportsDir, `test-report-${timestamp}.json`);
            const htmlPath = path.join(reportsDir, `test-report-${timestamp}.html`);

            fs.writeFileSync(jsonPath, jsonReport);
            console.log(`📄 JSON Report: ${jsonPath}`);

            const htmlReport = testRunner.exportResults('html');
            fs.writeFileSync(htmlPath, htmlReport);
            console.log(`🌐 HTML Report: ${htmlPath}`);

        } catch (error) {
            console.warn('⚠️  Failed to export results:', error);
        }

        // Exit with appropriate code
        if (report.failedTests > 0) {
            console.log('\n❌ Some tests failed. Exiting with code 1.');
            process.exit(1);
        } else {
            console.log('\n✅ All tests passed! Exiting with code 0.');
            process.exit(0);
        }

    } catch (error) {
        console.error('\n💥 Test execution failed:', error);
        process.exit(1);
    }
}

// Handle command line arguments
function parseArgs() {
    const args = process.argv.slice(2);

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];

        switch (arg) {
            case '--help':
            case '-h':
                console.log(`
Page-Level Test Runner

Usage: npm run test:page-level [options]

Options:
  --help, -h              Show this help message
  --suite <name>          Run specific test suite
  --test <name>           Run specific test
  --timeout <ms>          Set test timeout (default: 30000)
  --retries <count>       Set retry count (default: 2)
  --headless              Run in headless mode (default: true)
  --headed                Run with browser UI
  --base-url <url>        Set base URL (default: http://localhost:5002)
  --verbose               Enable verbose output (default: true)
  --quiet                 Disable verbose output
  --parallel              Run tests in parallel
  --export <format>       Export format (json, csv, html)
  --output <path>         Output file path

Examples:
  npm run test:page-level
  npm run test:page-level --suite ActionTestPage
  npm run test:page-level --test "Page Loads Successfully"
  npm run test:page-level --timeout 60000 --retries 3
  npm run test:page-level --headed --base-url http://localhost:3000
        `);
                process.exit(0);
                break;

            case '--suite':
                testConfig.suites = [args[++i]];
                break;

            case '--test':
                testConfig.tests = [args[++i]];
                break;

            case '--timeout':
                testConfig.timeout = parseInt(args[++i]);
                break;

            case '--retries':
                testConfig.retries = parseInt(args[++i]);
                break;

            case '--headless':
                testConfig.headless = true;
                break;

            case '--headed':
                testConfig.headless = false;
                break;

            case '--base-url':
                testConfig.baseUrl = args[++i];
                break;

            case '--verbose':
                testConfig.verbose = true;
                break;

            case '--quiet':
                testConfig.verbose = false;
                break;

            case '--parallel':
                testConfig.parallel = true;
                break;

            case '--export':
                const format = args[++i];
                if (!['json', 'csv', 'html'].includes(format)) {
                    console.error(`Invalid export format: ${format}`);
                    process.exit(1);
                }
                break;

            case '--output':
                const outputPath = args[++i];
                // Handle output path if needed
                break;

            default:
                console.warn(`Unknown argument: ${arg}`);
                break;
        }
    }
}

// Initialize Playwright if not already done
async function initializePlaywright() {
    if (typeof global.page === 'undefined') {
        try {
            const { chromium } = require('playwright');

            console.log('🔧 Initializing Playwright...');
            const browser = await chromium.launch({
                headless: testConfig.headless,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            const context = await browser.newContext({
                viewport: { width: 1920, height: 1080 }
            });
            const page = await context.newPage();

            // Set global variables for test access
            global.browser = browser;
            global.context = context;
            global.page = page;

            console.log('✅ Playwright initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize Playwright:', error);
            console.log('Please install Playwright: npm install playwright');
            process.exit(1);
        }
    }
}

// Cleanup function
async function cleanup() {
    if (global.browser) {
        await global.browser.close();
    }
}

// Handle process termination
process.on('SIGINT', async () => {
    console.log('\n🛑 Test execution interrupted');
    await cleanup();
    process.exit(1);
});

process.on('SIGTERM', async () => {
    console.log('\n🛑 Test execution terminated');
    await cleanup();
    process.exit(1);
});

// Main execution
async function main() {
    try {
        parseArgs();
        await initializePlaywright();
        await runTests();
    } catch (error) {
        console.error('💥 Fatal error:', error);
        await cleanup();
        process.exit(1);
    } finally {
        await cleanup();
    }
}

// Run if this file is executed directly
if (require.main === module) {
    main();
}

export { runTests, testRunner, testConfig };
