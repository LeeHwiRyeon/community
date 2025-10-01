#!/usr/bin/env node

/**
 * Page-Level Test Runner Script
 * Executes comprehensive page-level tests for all action generator features
 */

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const config = {
    testDir: path.join(__dirname, '../src/tests/page-level'),
    timeout: 300000, // 5 minutes
    retries: 2
};

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(message) {
    log(`\n${'='.repeat(60)}`, 'cyan');
    log(message, 'bright');
    log('='.repeat(60), 'cyan');
}

function logSuccess(message) {
    log(`✅ ${message}`, 'green');
}

function logError(message) {
    log(`❌ ${message}`, 'red');
}

function logWarning(message) {
    log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
    log(`ℹ️  ${message}`, 'blue');
}

// Check if required dependencies are installed
function checkDependencies() {
    const packageJsonPath = path.join(config.testDir, 'package.json');

    if (!fs.existsSync(packageJsonPath)) {
        logError('Test package.json not found. Please run setup first.');
        return false;
    }

    const nodeModulesPath = path.join(config.testDir, 'node_modules');
    if (!fs.existsSync(nodeModulesPath)) {
        logWarning('Dependencies not installed. Installing...');
        return installDependencies();
    }

    return true;
}

// Install test dependencies
function installDependencies() {
    return new Promise((resolve, reject) => {
        logInfo('Installing test dependencies...');

        const install = spawn('npm', ['install'], {
            cwd: config.testDir,
            stdio: 'inherit',
            shell: true
        });

        install.on('close', (code) => {
            if (code === 0) {
                logSuccess('Dependencies installed successfully');
                resolve(true);
            } else {
                logError('Failed to install dependencies');
                reject(new Error('Dependency installation failed'));
            }
        });

        install.on('error', (error) => {
            logError(`Failed to install dependencies: ${error.message}`);
            reject(error);
        });
    });
}

// Run Playwright installation
function installPlaywright() {
    return new Promise((resolve, reject) => {
        logInfo('Installing Playwright browsers...');

        const install = spawn('npx', ['playwright', 'install'], {
            cwd: config.testDir,
            stdio: 'inherit',
            shell: true
        });

        install.on('close', (code) => {
            if (code === 0) {
                logSuccess('Playwright browsers installed successfully');
                resolve(true);
            } else {
                logError('Failed to install Playwright browsers');
                reject(new Error('Playwright installation failed'));
            }
        });

        install.on('error', (error) => {
            logError(`Failed to install Playwright: ${error.message}`);
            reject(error);
        });
    });
}

// Execute tests
function runTests(options = {}) {
    return new Promise((resolve, reject) => {
        const args = ['test'];

        // Add command line options
        if (options.suite) {
            args.push('--suite', options.suite);
        }

        if (options.test) {
            args.push('--test', options.test);
        }

        if (options.headed) {
            args.push('--headed');
        } else {
            args.push('--headless');
        }

        if (options.timeout) {
            args.push('--timeout', options.timeout.toString());
        }

        if (options.retries) {
            args.push('--retries', options.retries.toString());
        }

        if (options.verbose) {
            args.push('--verbose');
        } else {
            args.push('--quiet');
        }

        if (options.parallel) {
            args.push('--parallel');
        }

        if (options.baseUrl) {
            args.push('--base-url', options.baseUrl);
        }

        logInfo(`Running tests with args: ${args.join(' ')}`);

        const testProcess = spawn('npm', args, {
            cwd: config.testDir,
            stdio: 'inherit',
            shell: true,
            timeout: config.timeout
        });

        testProcess.on('close', (code) => {
            if (code === 0) {
                logSuccess('All tests passed!');
                resolve(true);
            } else {
                logError(`Tests failed with exit code ${code}`);
                reject(new Error(`Test execution failed with code ${code}`));
            }
        });

        testProcess.on('error', (error) => {
            logError(`Test execution failed: ${error.message}`);
            reject(error);
        });

        testProcess.on('timeout', () => {
            logError('Test execution timed out');
            testProcess.kill();
            reject(new Error('Test execution timed out'));
        });
    });
}

// Main execution function
async function main() {
    try {
        logHeader('Page-Level Test Runner');

        // Parse command line arguments
        const args = process.argv.slice(2);
        const options = {
            suite: null,
            test: null,
            headed: false,
            timeout: 30000,
            retries: 2,
            verbose: true,
            parallel: false,
            baseUrl: 'http://localhost:5002'
        };

        for (let i = 0; i < args.length; i++) {
            const arg = args[i];

            switch (arg) {
                case '--help':
                case '-h':
                    showHelp();
                    process.exit(0);
                    break;

                case '--suite':
                    options.suite = args[++i];
                    break;

                case '--test':
                    options.test = args[++i];
                    break;

                case '--headed':
                    options.headed = true;
                    break;

                case '--timeout':
                    options.timeout = parseInt(args[++i]);
                    break;

                case '--retries':
                    options.retries = parseInt(args[++i]);
                    break;

                case '--verbose':
                    options.verbose = true;
                    break;

                case '--quiet':
                    options.verbose = false;
                    break;

                case '--parallel':
                    options.parallel = true;
                    break;

                case '--base-url':
                    options.baseUrl = args[++i];
                    break;

                case '--setup':
                    await setup();
                    process.exit(0);
                    break;

                default:
                    logWarning(`Unknown argument: ${arg}`);
                    break;
            }
        }

        // Check if frontend server is running
        logInfo('Checking if frontend server is running...');
        try {
            const http = await import('http');
            const url = new URL(options.baseUrl);

            await new Promise((resolve, reject) => {
                const req = http.default.get({
                    hostname: url.hostname,
                    port: url.port,
                    path: '/',
                    timeout: 5000
                }, (res) => {
                    logSuccess('Frontend server is running');
                    resolve(true);
                });

                req.on('error', (error) => {
                    logError(`Frontend server is not running at ${options.baseUrl}`);
                    logInfo('Please start the frontend server first: npm run dev');
                    reject(error);
                });

                req.on('timeout', () => {
                    logError('Frontend server check timed out');
                    reject(new Error('Server check timeout'));
                });
            });
        } catch (error) {
            process.exit(1);
        }

        // Check dependencies
        if (!checkDependencies()) {
            process.exit(1);
        }

        // Run tests
        logHeader('Executing Page-Level Tests');
        await runTests(options);

        logHeader('Test Execution Complete');
        logSuccess('All tests completed successfully!');

    } catch (error) {
        logError(`Test execution failed: ${error.message}`);
        process.exit(1);
    }
}

// Setup function
async function setup() {
    try {
        logHeader('Setting Up Page-Level Tests');

        // Check if test directory exists
        if (!fs.existsSync(config.testDir)) {
            logError('Test directory not found');
            process.exit(1);
        }

        // Install dependencies
        await installDependencies();

        // Install Playwright browsers
        await installPlaywright();

        logSuccess('Setup completed successfully!');
        logInfo('You can now run tests with: npm run test:page-level');

    } catch (error) {
        logError(`Setup failed: ${error.message}`);
        process.exit(1);
    }
}

// Help function
function showHelp() {
    logHeader('Page-Level Test Runner Help');
    console.log(`
Usage: node run-page-tests.js [options]

Options:
  --help, -h              Show this help message
  --setup                 Setup test environment and dependencies
  --suite <name>          Run specific test suite
  --test <name>           Run specific test
  --headed                Run with browser UI (default: headless)
  --timeout <ms>          Set test timeout (default: 30000)
  --retries <count>       Set retry count (default: 2)
  --verbose               Enable verbose output (default: true)
  --quiet                 Disable verbose output
  --parallel              Run tests in parallel
  --base-url <url>        Set base URL (default: http://localhost:5002)

Examples:
  node run-page-tests.js --setup
  node run-page-tests.js
  node run-page-tests.js --suite ActionTestPage
  node run-page-tests.js --test "Page Loads Successfully"
  node run-page-tests.js --headed --timeout 60000
  node run-page-tests.js --parallel --quiet

Test Suites:
  - ActionTestPage
  - AnalyticsDashboard
  - BulkActionsPanel
  - SchedulerDashboard
  - TemplateDashboard
  - AdvancedActionDashboard
  - HomePage
  - Header
  - ActionButtons
  - PaginationControls
  `);
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export { main, setup, runTests };
