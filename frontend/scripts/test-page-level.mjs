#!/usr/bin/env node

/**
 * Simple Page-Level Test Runner
 * Executes page-level tests for action generator features
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
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

function logInfo(message) {
    log(`ℹ️  ${message}`, 'blue');
}

// Check if frontend server is running
async function checkServer(baseUrl = 'http://localhost:5002') {
    try {
        const http = await import('http');
        const url = new URL(baseUrl);

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
                logError(`Frontend server is not running at ${baseUrl}`);
                logInfo('Please start the frontend server first: npm run dev');
                reject(error);
            });

            req.on('timeout', () => {
                logError('Frontend server check timed out');
                reject(new Error('Server check timeout'));
            });
        });
    } catch (error) {
        throw error;
    }
}

// Run a simple test
async function runSimpleTest() {
    logHeader('Running Simple Page-Level Test');

    try {
        // Check if server is running
        await checkServer();

        // Run a simple test using Playwright
        const testScript = `
      import { chromium } from 'playwright';
      
      async function runTest() {
        const browser = await chromium.launch({ headless: true });
        const context = await browser.newContext();
        const page = await context.newPage();
        
        try {
          console.log('🔍 Testing Action Test Page...');
          await page.goto('http://localhost:5002/action-test');
          await page.waitForLoadState('networkidle');
          
          const title = await page.title();
          console.log('📄 Page title:', title);
          
          const heading = await page.textContent('h1, h2');
          console.log('📝 Main heading:', heading);
          
          const buttons = await page.locator('button').count();
          console.log('🔘 Number of buttons found:', buttons);
          
          console.log('✅ Basic page test completed successfully!');
          
        } catch (error) {
          console.error('❌ Test failed:', error.message);
          process.exit(1);
        } finally {
          await browser.close();
        }
      }
      
      runTest();
    `;

        // Write test script to temporary file
        const fs = await import('fs');
        const testFile = path.join(__dirname, '../temp-test.mjs');
        fs.writeFileSync(testFile, testScript);

        // Run the test
        const testProcess = spawn('node', [testFile], {
            stdio: 'inherit',
            shell: true
        });

        await new Promise((resolve, reject) => {
            testProcess.on('close', (code) => {
                // Clean up
                try {
                    fs.unlinkSync(testFile);
                } catch (e) {
                    // Ignore cleanup errors
                }

                if (code === 0) {
                    resolve(true);
                } else {
                    reject(new Error(`Test failed with code ${code}`));
                }
            });

            testProcess.on('error', (error) => {
                reject(error);
            });
        });

    } catch (error) {
        logError(`Test execution failed: ${error.message}`);
        process.exit(1);
    }
}

// Main execution
async function main() {
    try {
        logHeader('Page-Level Test Runner');
        logInfo('This is a simple test runner for demonstration purposes');
        logInfo('For full testing capabilities, use the comprehensive test suite');

        await runSimpleTest();

        logHeader('Test Complete');
        logSuccess('Simple page-level test completed successfully!');
        logInfo('For comprehensive testing, install Playwright and use the full test suite');

    } catch (error) {
        logError(`Test execution failed: ${error.message}`);
        process.exit(1);
    }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export { main, runSimpleTest, checkServer };
