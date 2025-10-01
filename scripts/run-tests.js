#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * 테스트 실행 및 커버리지 생성 스크립트
 */

class TestRunner {
    constructor() {
        this.testTypes = ['unit', 'integration', 'e2e'];
        this.coverageThreshold = 100;
        this.results = {
            unit: { passed: 0, failed: 0, coverage: 0 },
            integration: { passed: 0, failed: 0, coverage: 0 },
            e2e: { passed: 0, failed: 0, coverage: 0 }
        };
    }

    /**
     * 모든 테스트 실행
     */
    async runAllTests() {
        console.log('🧪 테스트 실행 시작...\n');

        try {
            // 1. 단위 테스트 실행
            await this.runUnitTests();

            // 2. 통합 테스트 실행
            await this.runIntegrationTests();

            // 3. E2E 테스트 실행
            await this.runE2ETests();

            // 4. 결과 요약
            this.printSummary();

            // 5. 커버리지 리포트 생성
            await this.generateCoverageReport();

        } catch (error) {
            console.error('❌ 테스트 실행 중 오류 발생:', error.message);
            process.exit(1);
        }
    }

    /**
     * 단위 테스트 실행
     */
    async runUnitTests() {
        console.log('📋 단위 테스트 실행 중...');

        try {
            const command = 'npm run test:unit -- --coverage --coverageReporters=text,json,html';
            const output = execSync(command, {
                encoding: 'utf8',
                cwd: process.cwd(),
                stdio: 'pipe'
            });

            console.log('✅ 단위 테스트 완료');
            this.parseTestResults('unit', output);

        } catch (error) {
            console.error('❌ 단위 테스트 실패:', error.message);
            this.results.unit.failed++;
        }
    }

    /**
     * 통합 테스트 실행
     */
    async runIntegrationTests() {
        console.log('🔗 통합 테스트 실행 중...');

        try {
            const command = 'npm run test:integration -- --coverage --coverageReporters=text,json,html';
            const output = execSync(command, {
                encoding: 'utf8',
                cwd: process.cwd(),
                stdio: 'pipe'
            });

            console.log('✅ 통합 테스트 완료');
            this.parseTestResults('integration', output);

        } catch (error) {
            console.error('❌ 통합 테스트 실패:', error.message);
            this.results.integration.failed++;
        }
    }

    /**
     * E2E 테스트 실행
     */
    async runE2ETests() {
        console.log('🌐 E2E 테스트 실행 중...');

        try {
            // E2E 테스트는 별도 프로세스로 실행
            const command = 'npm run test:e2e';
            const output = execSync(command, {
                encoding: 'utf8',
                cwd: process.cwd(),
                stdio: 'pipe'
            });

            console.log('✅ E2E 테스트 완료');
            this.parseTestResults('e2e', output);

        } catch (error) {
            console.error('❌ E2E 테스트 실패:', error.message);
            this.results.e2e.failed++;
        }
    }

    /**
     * 테스트 결과 파싱
     */
    parseTestResults(type, output) {
        // Jest 출력에서 결과 파싱
        const lines = output.split('\n');

        for (const line of lines) {
            // 통과한 테스트 수
            const passedMatch = line.match(/(\d+) passing/);
            if (passedMatch) {
                this.results[type].passed += parseInt(passedMatch[1]);
            }

            // 실패한 테스트 수
            const failedMatch = line.match(/(\d+) failing/);
            if (failedMatch) {
                this.results[type].failed += parseInt(failedMatch[1]);
            }

            // 커버리지 정보
            const coverageMatch = line.match(/All files\s+\|\s+(\d+(?:\.\d+)?)/);
            if (coverageMatch) {
                this.results[type].coverage = parseFloat(coverageMatch[1]);
            }
        }
    }

    /**
     * 결과 요약 출력
     */
    printSummary() {
        console.log('\n📊 테스트 결과 요약');
        console.log('='.repeat(50));

        let totalPassed = 0;
        let totalFailed = 0;
        let totalCoverage = 0;
        let testTypeCount = 0;

        for (const [type, result] of Object.entries(this.results)) {
            const status = result.failed === 0 ? '✅' : '❌';
            const coverageStatus = result.coverage >= this.coverageThreshold ? '✅' : '❌';

            console.log(`${status} ${type.toUpperCase()} 테스트:`);
            console.log(`   통과: ${result.passed}`);
            console.log(`   실패: ${result.failed}`);
            console.log(`   커버리지: ${result.coverage}% ${coverageStatus}`);
            console.log('');

            totalPassed += result.passed;
            totalFailed += result.failed;
            totalCoverage += result.coverage;
            testTypeCount++;
        }

        const avgCoverage = totalCoverage / testTypeCount;
        const overallStatus = totalFailed === 0 && avgCoverage >= this.coverageThreshold ? '✅' : '❌';

        console.log(`${overallStatus} 전체 결과:`);
        console.log(`   총 통과: ${totalPassed}`);
        console.log(`   총 실패: ${totalFailed}`);
        console.log(`   평균 커버리지: ${avgCoverage.toFixed(2)}%`);
        console.log(`   목표 커버리지: ${this.coverageThreshold}%`);

        if (totalFailed > 0) {
            console.log('\n❌ 일부 테스트가 실패했습니다.');
            process.exit(1);
        }

        if (avgCoverage < this.coverageThreshold) {
            console.log(`\n❌ 커버리지가 목표(${this.coverageThreshold}%)에 미달합니다.`);
            process.exit(1);
        }

        console.log('\n🎉 모든 테스트가 통과하고 커버리지 목표를 달성했습니다!');
    }

    /**
     * 커버리지 리포트 생성
     */
    async generateCoverageReport() {
        console.log('\n📈 커버리지 리포트 생성 중...');

        try {
            // HTML 커버리지 리포트 생성
            const command = 'npm run test:coverage:html';
            execSync(command, {
                encoding: 'utf8',
                cwd: process.cwd(),
                stdio: 'pipe'
            });

            // 커버리지 데이터 수집
            const coverageData = this.collectCoverageData();

            // 커버리지 리포트 파일 생성
            this.generateCoverageReportFile(coverageData);

            console.log('✅ 커버리지 리포트 생성 완료');
            console.log('📁 리포트 위치: coverage/index.html');

        } catch (error) {
            console.error('❌ 커버리지 리포트 생성 실패:', error.message);
        }
    }

    /**
     * 커버리지 데이터 수집
     */
    collectCoverageData() {
        const coveragePath = path.join(process.cwd(), 'coverage', 'coverage-summary.json');

        if (fs.existsSync(coveragePath)) {
            const coverageData = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
            return coverageData;
        }

        return null;
    }

    /**
     * 커버리지 리포트 파일 생성
     */
    generateCoverageReportFile(coverageData) {
        const reportPath = path.join(process.cwd(), 'coverage', 'test-report.md');

        let report = '# 테스트 커버리지 리포트\n\n';
        report += `생성일: ${new Date().toLocaleString()}\n\n`;

        if (coverageData) {
            report += '## 전체 커버리지\n\n';
            report += '| 메트릭 | 값 | 목표 | 상태 |\n';
            report += '|--------|-----|------|------|\n';

            const total = coverageData.total;
            const metrics = ['lines', 'statements', 'functions', 'branches'];

            for (const metric of metrics) {
                const value = total[metric].pct;
                const status = value >= this.coverageThreshold ? '✅' : '❌';
                report += `| ${metric} | ${value}% | ${this.coverageThreshold}% | ${status} |\n`;
            }

            report += '\n## 파일별 커버리지\n\n';
            report += '| 파일 | 라인 | 구문 | 함수 | 분기 |\n';
            report += '|------|------|------|------|------|\n';

            for (const [file, data] of Object.entries(coverageData)) {
                if (file !== 'total') {
                    const relativePath = file.replace(process.cwd(), '');
                    report += `| ${relativePath} | ${data.lines.pct}% | ${data.statements.pct}% | ${data.functions.pct}% | ${data.branches.pct}% |\n`;
                }
            }
        }

        report += '\n## 테스트 결과\n\n';
        for (const [type, result] of Object.entries(this.results)) {
            report += `### ${type.toUpperCase()} 테스트\n`;
            report += `- 통과: ${result.passed}\n`;
            report += `- 실패: ${result.failed}\n`;
            report += `- 커버리지: ${result.coverage}%\n\n`;
        }

        fs.writeFileSync(reportPath, report);
        console.log(`📄 상세 리포트: ${reportPath}`);
    }

    /**
     * 특정 테스트 타입만 실행
     */
    async runSpecificTest(type) {
        if (!this.testTypes.includes(type)) {
            console.error(`❌ 지원하지 않는 테스트 타입: ${type}`);
            process.exit(1);
        }

        console.log(`🧪 ${type} 테스트 실행 중...`);

        switch (type) {
            case 'unit':
                await this.runUnitTests();
                break;
            case 'integration':
                await this.runIntegrationTests();
                break;
            case 'e2e':
                await this.runE2ETests();
                break;
        }
    }

    /**
     * 감시 모드로 테스트 실행
     */
    async runTestsInWatchMode() {
        console.log('👀 감시 모드로 테스트 실행 중...');

        try {
            const command = 'npm run test:watch';
            execSync(command, {
                encoding: 'utf8',
                cwd: process.cwd(),
                stdio: 'inherit'
            });
        } catch (error) {
            console.error('❌ 감시 모드 테스트 실행 실패:', error.message);
            process.exit(1);
        }
    }
}

// CLI 실행
if (require.main === module) {
    const args = process.argv.slice(2);
    const runner = new TestRunner();

    if (args.length === 0) {
        // 모든 테스트 실행
        runner.runAllTests();
    } else if (args[0] === '--watch') {
        // 감시 모드
        runner.runTestsInWatchMode();
    } else if (args[0] === '--type') {
        // 특정 타입만 실행
        const type = args[1];
        runner.runSpecificTest(type);
    } else {
        console.log('사용법:');
        console.log('  node scripts/run-tests.js              # 모든 테스트 실행');
        console.log('  node scripts/run-tests.js --watch      # 감시 모드');
        console.log('  node scripts/run-tests.js --type unit  # 단위 테스트만');
        process.exit(1);
    }
}

module.exports = TestRunner;
