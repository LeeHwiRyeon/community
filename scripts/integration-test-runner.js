/**
 * 🔍 AUTOAGENTS 통합 테스트 실행기 (Node.js)
 * 
 * PowerShell 대신 Node.js로 통합 테스트를 실행하고 결과를 분석합니다.
 * 
 * @author AUTOAGENTS Manager
 * @version 2.0.0
 * @created 2025-10-02
 */

const fs = require('fs').promises;
const path = require('path');
const { spawn, exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

class IntegrationTestRunner {
    constructor() {
        this.startTime = new Date();
        this.results = {
            environment: {},
            tests: {},
            performance: {},
            summary: {}
        };
    }

    /**
     * 🚀 통합 테스트 실행 메인 함수
     */
    async run() {
        console.log('🔍 AUTOAGENTS 전체 시스템 통합 테스트 시작!');
        console.log('');

        try {
            // 1. 환경 준비
            await this.prepareEnvironment();

            // 2. 서버 상태 확인
            await this.checkServerStatus();

            // 3. 의존성 확인
            await this.checkDependencies();

            // 4. 통합 테스트 실행
            await this.executeIntegrationTests();

            // 5. 성능 메트릭 수집
            await this.collectPerformanceMetrics();

            // 6. 결과 분석 및 보고서 생성
            await this.generateReport();

            console.log('✅ 통합 테스트 완료!');

        } catch (error) {
            console.error('❌ 통합 테스트 실행 실패:', error.message);
            this.results.error = error.message;
            await this.generateErrorReport();
            process.exit(1);
        }
    }

    /**
     * 🏗️ 환경 준비
     */
    async prepareEnvironment() {
        console.log('🏗️ 1단계: 테스트 환경 준비...');

        // Node.js 환경 확인
        const nodeVersion = process.version;
        const npmVersion = await this.getNpmVersion();

        console.log(`  ✅ Node.js: ${nodeVersion}`);
        console.log(`  ✅ npm: ${npmVersion}`);

        this.results.environment = {
            nodeVersion: nodeVersion,
            npmVersion: npmVersion,
            platform: process.platform,
            arch: process.arch,
            cwd: process.cwd()
        };

        // 필요한 디렉토리 생성
        const dirs = ['reports', 'logs', 'temp'];
        for (const dir of dirs) {
            try {
                await fs.mkdir(dir, { recursive: true });
            } catch (error) {
                // 이미 존재하는 경우 무시
            }
        }

        console.log('  ✅ 테스트 디렉토리 준비 완료');
    }

    /**
     * 🌐 서버 상태 확인
     */
    async checkServerStatus() {
        console.log('🌐 2단계: 서버 상태 확인...');

        try {
            // 백엔드 서버 확인 (간단한 HTTP 요청)
            const http = require('http');

            const checkServer = (port) => {
                return new Promise((resolve, reject) => {
                    const req = http.get(`http://localhost:${port}/health`, (res) => {
                        resolve(res.statusCode === 200);
                    });

                    req.on('error', () => {
                        resolve(false);
                    });

                    req.setTimeout(5000, () => {
                        req.destroy();
                        resolve(false);
                    });
                });
            };

            const backendRunning = await checkServer(5001);
            const frontendRunning = await checkServer(3000);

            this.results.environment.servers = {
                backend: backendRunning,
                frontend: frontendRunning
            };

            if (backendRunning) {
                console.log('  ✅ 백엔드 서버 정상 (포트 5001)');
            } else {
                console.log('  ⚠️ 백엔드 서버 미실행 (포트 5001)');
            }

            if (frontendRunning) {
                console.log('  ✅ 프론트엔드 서버 정상 (포트 3000)');
            } else {
                console.log('  ⚠️ 프론트엔드 서버 미실행 (포트 3000)');
            }

        } catch (error) {
            console.log('  ⚠️ 서버 상태 확인 중 오류:', error.message);
        }
    }

    /**
     * 📦 의존성 확인
     */
    async checkDependencies() {
        console.log('📦 3단계: 의존성 확인...');

        try {
            // package.json 확인
            const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'));

            // node_modules 확인
            const nodeModulesExists = await this.fileExists('node_modules');

            if (!nodeModulesExists) {
                console.log('  📥 의존성 설치 중...');
                await execAsync('npm install');
                console.log('  ✅ 의존성 설치 완료');
            } else {
                console.log('  ✅ 의존성 확인 완료');
            }

            this.results.environment.dependencies = {
                packageJsonExists: true,
                nodeModulesExists: nodeModulesExists,
                devDependencies: Object.keys(packageJson.devDependencies || {}).length,
                dependencies: Object.keys(packageJson.dependencies || {}).length
            };

        } catch (error) {
            console.log('  ⚠️ 의존성 확인 중 오류:', error.message);
        }
    }

    /**
     * 🧪 통합 테스트 실행
     */
    async executeIntegrationTests() {
        console.log('🧪 4단계: 통합 테스트 실행...');

        try {
            // 통합 테스트 파일 존재 확인
            const testFile = 'server-backend/tests/integration/system-integration-test.js';
            const testExists = await this.fileExists(testFile);

            if (!testExists) {
                throw new Error(`통합 테스트 파일을 찾을 수 없습니다: ${testFile}`);
            }

            console.log('  🚀 통합 테스트 실행 중...');

            // 테스트 실행 (Mocha 사용)
            const testCommand = 'npx mocha server-backend/tests/integration/system-integration-test.js --timeout 300000 --reporter json';

            const { stdout, stderr } = await execAsync(testCommand);

            let testResults;
            try {
                testResults = JSON.parse(stdout);
            } catch (parseError) {
                // JSON 파싱 실패 시 텍스트 결과 사용
                testResults = {
                    stats: { tests: 0, passes: 0, failures: 0 },
                    tests: [],
                    failures: [],
                    output: stdout
                };
            }

            this.results.tests = {
                executed: true,
                totalTests: testResults.stats?.tests || 0,
                passed: testResults.stats?.passes || 0,
                failed: testResults.stats?.failures || 0,
                duration: testResults.stats?.duration || 0,
                success: (testResults.stats?.failures || 0) === 0,
                details: testResults
            };

            if (stderr) {
                this.results.tests.errors = stderr;
            }

            console.log(`  ✅ 테스트 실행 완료 - ${this.results.tests.passed}/${this.results.tests.totalTests} 통과`);

        } catch (error) {
            console.log('  ❌ 통합 테스트 실행 실패:', error.message);

            this.results.tests = {
                executed: false,
                error: error.message,
                success: false
            };
        }
    }

    /**
     * 📈 성능 메트릭 수집
     */
    async collectPerformanceMetrics() {
        console.log('📈 5단계: 성능 메트릭 수집...');

        try {
            const memoryUsage = process.memoryUsage();
            const cpuUsage = process.cpuUsage();

            this.results.performance = {
                memory: {
                    heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
                    heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
                    external: Math.round(memoryUsage.external / 1024 / 1024), // MB
                    rss: Math.round(memoryUsage.rss / 1024 / 1024) // MB
                },
                cpu: {
                    user: cpuUsage.user,
                    system: cpuUsage.system
                },
                uptime: Math.round(process.uptime()),
                testDuration: Math.round((new Date() - this.startTime) / 1000) // 초
            };

            console.log(`  ✅ 성능 메트릭 수집 완료`);
            console.log(`    • 메모리 사용량: ${this.results.performance.memory.heapUsed} MB`);
            console.log(`    • 테스트 실행 시간: ${this.results.performance.testDuration}초`);

        } catch (error) {
            console.log('  ⚠️ 성능 메트릭 수집 중 오류:', error.message);
        }
    }

    /**
     * 📋 결과 보고서 생성
     */
    async generateReport() {
        console.log('📋 6단계: 통합 테스트 보고서 생성...');

        try {
            // 요약 정보 생성
            this.results.summary = {
                timestamp: new Date().toISOString(),
                duration: Math.round((new Date() - this.startTime) / 1000),
                success: this.results.tests.success || false,
                totalTests: this.results.tests.totalTests || 0,
                passedTests: this.results.tests.passed || 0,
                failedTests: this.results.tests.failed || 0,
                environmentHealthy: this.checkEnvironmentHealth(),
                recommendations: this.generateRecommendations()
            };

            // JSON 보고서 저장
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const jsonReportPath = path.join('reports', `integration-test-report-${timestamp}.json`);

            await fs.writeFile(jsonReportPath, JSON.stringify(this.results, null, 2));

            // HTML 보고서 생성
            const htmlReportPath = path.join('reports', `integration-test-report-${timestamp}.html`);
            const htmlContent = this.generateHTMLReport();

            await fs.writeFile(htmlReportPath, htmlContent);

            console.log('  ✅ 보고서 생성 완료');
            console.log(`    • JSON 보고서: ${jsonReportPath}`);
            console.log(`    • HTML 보고서: ${htmlReportPath}`);

            // 콘솔 요약 출력
            this.printSummary();

        } catch (error) {
            console.log('  ⚠️ 보고서 생성 중 오류:', error.message);
        }
    }

    /**
     * 📊 결과 요약 출력
     */
    printSummary() {
        console.log('');
        console.log('🎉 AUTOAGENTS 통합 테스트 완료!');
        console.log('');
        console.log('📊 최종 결과 요약:');
        console.log(`  • 테스트 기간: ${this.results.summary.duration}초`);
        console.log(`  • 전체 테스트: ${this.results.summary.totalTests}개`);
        console.log(`  • 통과: ${this.results.summary.passedTests}개`);
        console.log(`  • 실패: ${this.results.summary.failedTests}개`);
        console.log(`  • 성공률: ${this.results.summary.totalTests > 0 ? Math.round((this.results.summary.passedTests / this.results.summary.totalTests) * 100) : 0}%`);
        console.log(`  • 결과: ${this.results.summary.success ? '✅ 성공' : '❌ 실패'}`);

        if (this.results.summary.recommendations.length > 0) {
            console.log('');
            console.log('💡 권장사항:');
            this.results.summary.recommendations.forEach(rec => {
                console.log(`  • ${rec}`);
            });
        }

        if (this.results.summary.success) {
            console.log('');
            console.log('🌟 모든 AUTOAGENTS 시스템이 정상적으로 통합되어 작동하고 있습니다!');
            console.log('🚀 완전 자동화 생태계가 성공적으로 검증되었습니다!');
        }
    }

    /**
     * ❌ 오류 보고서 생성
     */
    async generateErrorReport() {
        try {
            const errorReport = {
                timestamp: new Date().toISOString(),
                error: this.results.error,
                environment: this.results.environment,
                partialResults: this.results
            };

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const errorReportPath = path.join('reports', `integration-test-error-${timestamp}.json`);

            await fs.writeFile(errorReportPath, JSON.stringify(errorReport, null, 2));

            console.log(`오류 보고서 저장: ${errorReportPath}`);

        } catch (saveError) {
            console.error('오류 보고서 저장 실패:', saveError.message);
        }
    }

    // 헬퍼 메서드들
    async getNpmVersion() {
        try {
            const { stdout } = await execAsync('npm --version');
            return stdout.trim();
        } catch (error) {
            return 'unknown';
        }
    }

    async fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        } catch (error) {
            return false;
        }
    }

    checkEnvironmentHealth() {
        const env = this.results.environment;
        return env.nodeVersion && env.npmVersion && env.dependencies;
    }

    generateRecommendations() {
        const recommendations = [];

        if (!this.results.tests.success) {
            recommendations.push('실패한 테스트를 검토하고 수정하세요.');
        }

        if (this.results.performance?.memory?.heapUsed > 500) {
            recommendations.push('메모리 사용량이 높습니다. 메모리 최적화를 고려하세요.');
        }

        if (!this.results.environment.servers?.backend) {
            recommendations.push('백엔드 서버가 실행되지 않았습니다. 서버를 시작하세요.');
        }

        if (recommendations.length === 0) {
            recommendations.push('모든 시스템이 정상적으로 작동하고 있습니다.');
        }

        return recommendations;
    }

    generateHTMLReport() {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>AUTOAGENTS 통합 테스트 보고서</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f0f0f0; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .success { color: green; }
        .warning { color: orange; }
        .error { color: red; }
        .section { margin: 20px 0; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .metric { margin: 10px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔍 AUTOAGENTS 통합 테스트 보고서</h1>
        <p><strong>생성 시간:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>테스트 기간:</strong> ${this.results.summary.duration}초</p>
        <p><strong>결과:</strong> ${this.results.summary.success ? '<span class="success">✅ 성공</span>' : '<span class="error">❌ 실패</span>'}</p>
    </div>
    
    <div class="section">
        <h2>📊 테스트 결과</h2>
        <table>
            <tr><th>항목</th><th>값</th></tr>
            <tr><td>전체 테스트</td><td>${this.results.summary.totalTests}</td></tr>
            <tr><td>통과</td><td class="success">${this.results.summary.passedTests}</td></tr>
            <tr><td>실패</td><td class="error">${this.results.summary.failedTests}</td></tr>
            <tr><td>성공률</td><td>${this.results.summary.totalTests > 0 ? Math.round((this.results.summary.passedTests / this.results.summary.totalTests) * 100) : 0}%</td></tr>
        </table>
    </div>
    
    <div class="section">
        <h2>🏗️ 환경 정보</h2>
        <table>
            <tr><th>항목</th><th>값</th></tr>
            <tr><td>Node.js 버전</td><td>${this.results.environment.nodeVersion}</td></tr>
            <tr><td>npm 버전</td><td>${this.results.environment.npmVersion}</td></tr>
            <tr><td>플랫폼</td><td>${this.results.environment.platform}</td></tr>
            <tr><td>아키텍처</td><td>${this.results.environment.arch}</td></tr>
        </table>
    </div>
    
    <div class="section">
        <h2>📈 성능 메트릭</h2>
        <div class="metric">메모리 사용량: ${this.results.performance?.memory?.heapUsed || 0} MB</div>
        <div class="metric">테스트 실행 시간: ${this.results.performance?.testDuration || 0}초</div>
        <div class="metric">시스템 업타임: ${this.results.performance?.uptime || 0}초</div>
    </div>
    
    <div class="section">
        <h2>💡 권장사항</h2>
        <ul>
            ${this.results.summary.recommendations.map(rec => `<li>${rec}</li>`).join('')}
        </ul>
    </div>
</body>
</html>
        `;
    }
}

// 스크립트 실행
if (require.main === module) {
    const runner = new IntegrationTestRunner();
    runner.run().catch(error => {
        console.error('통합 테스트 실행기 오류:', error.message);
        process.exit(1);
    });
}

module.exports = IntegrationTestRunner;
