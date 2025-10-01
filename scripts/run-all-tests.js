#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * 통합 테스트 자동화 파이프라인
 * - 서버 API 테스트
 * - 클라이언트 기능 테스트
 * - 안드로이드 앱 테스트
 * - 성능 테스트
 * - 부하 테스트
 */

class TestPipeline {
    constructor() {
        this.results = {
            server: { passed: 0, failed: 0, total: 0 },
            client: { passed: 0, failed: 0, total: 0 },
            android: { passed: 0, failed: 0, total: 0 },
            performance: { passed: 0, failed: 0, total: 0 },
            load: { passed: 0, failed: 0, total: 0 }
        };
        this.startTime = Date.now();
    }

    async runAllTests() {
        console.log('🚀 통합 테스트 파이프라인 시작...\n');
        
        try {
            // 테스트 결과 디렉토리 생성
            this.createTestDirectories();
            
            // 1. 서버 API 테스트
            await this.runServerTests();
            
            // 2. 클라이언트 기능 테스트
            await this.runClientTests();
            
            // 3. 안드로이드 앱 테스트
            await this.runAndroidTests();
            
            // 4. 성능 테스트
            await this.runPerformanceTests();
            
            // 5. 부하 테스트
            await this.runLoadTests();
            
            // 6. 결과 종합
            this.generateReport();
            
        } catch (error) {
            console.error('❌ 테스트 파이프라인 실패:', error);
            process.exit(1);
        }
    }

    createTestDirectories() {
        const dirs = [
            'test-results',
            'test-results/screenshots',
            'test-results/reports',
            'test-results/logs'
        ];
        
        dirs.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }

    async runServerTests() {
        console.log('🔧 서버 API 테스트 실행...');
        
        try {
            const result = await this.runTest('server-backend/tests/automation/server-api-tests.js');
            this.results.server = result;
            console.log(`✅ 서버 테스트 완료: ${result.passed}/${result.total} 성공\n`);
        } catch (error) {
            console.error('❌ 서버 테스트 실패:', error.message);
            this.results.server = { passed: 0, failed: 1, total: 1 };
        }
    }

    async runClientTests() {
        console.log('🌐 클라이언트 기능 테스트 실행...');
        
        try {
            const result = await this.runTest('frontend/tests/automation/client-functionality-tests.js');
            this.results.client = result;
            console.log(`✅ 클라이언트 테스트 완료: ${result.passed}/${result.total} 성공\n`);
        } catch (error) {
            console.error('❌ 클라이언트 테스트 실패:', error.message);
            this.results.client = { passed: 0, failed: 1, total: 1 };
        }
    }

    async runAndroidTests() {
        console.log('🤖 안드로이드 앱 테스트 실행...');
        
        try {
            const result = await this.runTest('mobile/android/tests/android-app-tests.js');
            this.results.android = result;
            console.log(`✅ 안드로이드 테스트 완료: ${result.passed}/${result.total} 성공\n`);
        } catch (error) {
            console.error('❌ 안드로이드 테스트 실패:', error.message);
            this.results.android = { passed: 0, failed: 1, total: 1 };
        }
    }

    async runPerformanceTests() {
        console.log('⚡ 성능 테스트 실행...');
        
        try {
            // 간단한 성능 테스트
            const result = await this.runTest('server-backend/tests/automation/server-api-tests.js', ['--performance']);
            this.results.performance = result;
            console.log(`✅ 성능 테스트 완료: ${result.passed}/${result.total} 성공\n`);
        } catch (error) {
            console.error('❌ 성능 테스트 실패:', error.message);
            this.results.performance = { passed: 0, failed: 1, total: 1 };
        }
    }

    async runLoadTests() {
        console.log('🔄 부하 테스트 실행...');
        
        try {
            const result = await this.runTest('server-backend/tests/automation/load-testing.js');
            this.results.load = result;
            console.log(`✅ 부하 테스트 완료: ${result.passed}/${result.total} 성공\n`);
        } catch (error) {
            console.error('❌ 부하 테스트 실패:', error.message);
            this.results.load = { passed: 0, failed: 1, total: 1 };
        }
    }

    async runTest(testPath, args = []) {
        return new Promise((resolve, reject) => {
            const testProcess = spawn('node', [testPath, ...args], {
                stdio: 'pipe',
                cwd: process.cwd()
            });

            let stdout = '';
            let stderr = '';

            testProcess.stdout.on('data', (data) => {
                stdout += data.toString();
                process.stdout.write(data);
            });

            testProcess.stderr.on('data', (data) => {
                stderr += data.toString();
                process.stderr.write(data);
            });

            testProcess.on('close', (code) => {
                if (code === 0) {
                    // 테스트 성공 - 결과 파싱 시도
                    try {
                        const result = this.parseTestOutput(stdout);
                        resolve(result);
                    } catch (e) {
                        resolve({ passed: 1, failed: 0, total: 1 });
                    }
                } else {
                    reject(new Error(`테스트 실패 (코드: ${code}): ${stderr}`));
                }
            });

            testProcess.on('error', (error) => {
                reject(error);
            });
        });
    }

    parseTestOutput(output) {
        // 간단한 결과 파싱
        const lines = output.split('\n');
        let passed = 0;
        let failed = 0;
        let total = 0;

        lines.forEach(line => {
            if (line.includes('✅')) passed++;
            if (line.includes('❌')) failed++;
            if (line.includes('총 테스트:')) {
                const match = line.match(/총 테스트:\s*(\d+)/);
                if (match) total = parseInt(match[1]);
            }
        });

        return { passed, failed, total: total || (passed + failed) };
    }

    generateReport() {
        const endTime = Date.now();
        const totalTime = endTime - this.startTime;
        
        const report = {
            timestamp: new Date().toISOString(),
            totalTime: totalTime,
            results: this.results,
            summary: this.calculateSummary()
        };

        // JSON 리포트 저장
        const reportPath = 'test-results/reports/test-report.json';
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

        // HTML 리포트 생성
        this.generateHTMLReport(report);

        // 콘솔 출력
        this.printSummary(report);
    }

    calculateSummary() {
        const allResults = Object.values(this.results);
        const totalPassed = allResults.reduce((sum, result) => sum + result.passed, 0);
        const totalFailed = allResults.reduce((sum, result) => sum + result.failed, 0);
        const totalTests = allResults.reduce((sum, result) => sum + result.total, 0);

        return {
            totalPassed,
            totalFailed,
            totalTests,
            successRate: totalTests > 0 ? (totalPassed / totalTests * 100).toFixed(1) : 0,
            status: totalFailed === 0 ? 'PASS' : 'FAIL'
        };
    }

    generateHTMLReport(report) {
        const html = `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>테스트 리포트 - ${new Date().toLocaleDateString()}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 5px; }
        .summary { display: flex; gap: 20px; margin: 20px 0; }
        .card { background: white; border: 1px solid #ddd; padding: 15px; border-radius: 5px; flex: 1; }
        .pass { color: #28a745; }
        .fail { color: #dc3545; }
        .results { margin: 20px 0; }
        .test-suite { margin: 10px 0; padding: 10px; border: 1px solid #eee; border-radius: 3px; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🧪 통합 테스트 리포트</h1>
        <p>생성 시간: ${new Date().toLocaleString()}</p>
        <p>총 실행 시간: ${Math.round(report.totalTime / 1000)}초</p>
    </div>

    <div class="summary">
        <div class="card">
            <h3>전체 결과</h3>
            <p class="${report.summary.status === 'PASS' ? 'pass' : 'fail'}">
                ${report.summary.status} (${report.summary.successRate}%)
            </p>
            <p>성공: ${report.summary.totalPassed}</p>
            <p>실패: ${report.summary.totalFailed}</p>
            <p>총 테스트: ${report.summary.totalTests}</p>
        </div>
    </div>

    <div class="results">
        <h2>테스트 스위트별 결과</h2>
        ${Object.entries(report.results).map(([suite, result]) => `
            <div class="test-suite">
                <h3>${this.getSuiteName(suite)}</h3>
                <table>
                    <tr>
                        <th>항목</th>
                        <th>값</th>
                    </tr>
                    <tr>
                        <td>성공</td>
                        <td class="pass">${result.passed}</td>
                    </tr>
                    <tr>
                        <td>실패</td>
                        <td class="fail">${result.failed}</td>
                    </tr>
                    <tr>
                        <td>총 테스트</td>
                        <td>${result.total}</td>
                    </tr>
                    <tr>
                        <td>성공률</td>
                        <td>${result.total > 0 ? (result.passed / result.total * 100).toFixed(1) : 0}%</td>
                    </tr>
                </table>
            </div>
        `).join('')}
    </div>
</body>
</html>`;

        fs.writeFileSync('test-results/reports/test-report.html', html);
    }

    getSuiteName(suite) {
        const names = {
            server: '🔧 서버 API 테스트',
            client: '🌐 클라이언트 기능 테스트',
            android: '🤖 안드로이드 앱 테스트',
            performance: '⚡ 성능 테스트',
            load: '🔄 부하 테스트'
        };
        return names[suite] || suite;
    }

    printSummary(report) {
        console.log('\n📊 통합 테스트 결과 요약');
        console.log('='.repeat(60));
        console.log(`총 실행 시간: ${Math.round(report.totalTime / 1000)}초`);
        console.log(`전체 결과: ${report.summary.status} (${report.summary.successRate}%)`);
        console.log(`성공: ${report.summary.totalPassed}`);
        console.log(`실패: ${report.summary.totalFailed}`);
        console.log(`총 테스트: ${report.summary.totalTests}`);
        
        console.log('\n📋 테스트 스위트별 결과');
        console.log('-'.repeat(40));
        Object.entries(report.results).forEach(([suite, result]) => {
            const successRate = result.total > 0 ? (result.passed / result.total * 100).toFixed(1) : 0;
            console.log(`${this.getSuiteName(suite)}: ${result.passed}/${result.total} (${successRate}%)`);
        });
        
        console.log('\n📄 리포트 저장됨:');
        console.log('- JSON: test-results/reports/test-report.json');
        console.log('- HTML: test-results/reports/test-report.html');
    }
}

// 테스트 실행
if (require.main === module) {
    const pipeline = new TestPipeline();
    pipeline.runAllTests().then(() => {
        process.exit(0);
    }).catch(error => {
        console.error('❌ 테스트 파이프라인 실패:', error);
        process.exit(1);
    });
}

module.exports = TestPipeline;

