// 테스트 자동화 스크립트
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class TestAutomation {
    constructor() {
        this.results = {
            timestamp: new Date().toISOString(),
            tests: {
                unit: { passed: 0, failed: 0, total: 0 },
                integration: { passed: 0, failed: 0, total: 0 },
                e2e: { passed: 0, failed: 0, total: 0 },
                performance: { passed: 0, failed: 0, total: 0 }
            },
            coverage: {
                backend: 0,
                frontend: 0,
                overall: 0
            },
            quality: {
                linting: { passed: false, errors: 0, warnings: 0 },
                typeCheck: { passed: false, errors: 0 },
                security: { passed: false, vulnerabilities: 0 }
            }
        };
    }

    // 메인 테스트 실행
    async runAllTests() {
        console.log('🚀 테스트 자동화 시작...');

        try {
            // 1. 코드 품질 검사
            await this.runQualityChecks();

            // 2. 단위 테스트
            await this.runUnitTests();

            // 3. 통합 테스트
            await this.runIntegrationTests();

            // 4. E2E 테스트
            await this.runE2ETests();

            // 5. 성능 테스트
            await this.runPerformanceTests();

            // 6. 결과 분석 및 보고서 생성
            this.analyzeResults();
            this.generateReport();

        } catch (error) {
            console.error('❌ 테스트 실행 실패:', error);
            process.exit(1);
        }
    }

    // 코드 품질 검사
    async runQualityChecks() {
        console.log('🔍 코드 품질 검사 시작...');

        try {
            // 백엔드 린팅
            console.log('  📝 백엔드 린팅...');
            const backendLint = this.runCommand('cd server-backend && npm run lint', false);
            this.results.quality.linting.errors += backendLint.errors;
            this.results.quality.linting.warnings += backendLint.warnings;

            // 프론트엔드 린팅
            console.log('  📝 프론트엔드 린팅...');
            const frontendLint = this.runCommand('cd frontend && npm run lint', false);
            this.results.quality.linting.errors += frontendLint.errors;
            this.results.quality.linting.warnings += frontendLint.warnings;

            // TypeScript 타입 검사
            console.log('  🔧 TypeScript 타입 검사...');
            const typeCheck = this.runCommand('cd frontend && npm run type-check', false);
            this.results.quality.typeCheck.errors += typeCheck.errors;

            // 보안 검사
            console.log('  🔒 보안 검사...');
            const securityCheck = this.runCommand('node scripts/security-audit.js', false);
            this.results.quality.security.vulnerabilities += securityCheck.vulnerabilities;

            // 품질 검사 결과 설정
            this.results.quality.linting.passed = this.results.quality.linting.errors === 0;
            this.results.quality.typeCheck.passed = this.results.quality.typeCheck.errors === 0;
            this.results.quality.security.passed = this.results.quality.security.vulnerabilities === 0;

            console.log('✅ 코드 품질 검사 완료');

        } catch (error) {
            console.error('❌ 코드 품질 검사 실패:', error);
            throw error;
        }
    }

    // 단위 테스트
    async runUnitTests() {
        console.log('🧪 단위 테스트 시작...');

        try {
            // 백엔드 단위 테스트
            console.log('  🔧 백엔드 단위 테스트...');
            const backendTests = this.runCommand('cd server-backend && npm run test:unit -- --coverage');
            this.results.tests.unit.passed += backendTests.passed;
            this.results.tests.unit.failed += backendTests.failed;
            this.results.tests.unit.total += backendTests.total;
            this.results.coverage.backend = backendTests.coverage;

            // 프론트엔드 단위 테스트
            console.log('  🎨 프론트엔드 단위 테스트...');
            const frontendTests = this.runCommand('cd frontend && npm run test:unit -- --coverage');
            this.results.tests.unit.passed += frontendTests.passed;
            this.results.tests.unit.failed += frontendTests.failed;
            this.results.tests.unit.total += frontendTests.total;
            this.results.coverage.frontend = frontendTests.coverage;

            console.log('✅ 단위 테스트 완료');

        } catch (error) {
            console.error('❌ 단위 테스트 실패:', error);
            throw error;
        }
    }

    // 통합 테스트
    async runIntegrationTests() {
        console.log('🔗 통합 테스트 시작...');

        try {
            // 백엔드 통합 테스트
            console.log('  🔧 백엔드 통합 테스트...');
            const backendTests = this.runCommand('cd server-backend && npm run test:integration');
            this.results.tests.integration.passed += backendTests.passed;
            this.results.tests.integration.failed += backendTests.failed;
            this.results.tests.integration.total += backendTests.total;

            // API 테스트
            console.log('  🌐 API 테스트...');
            const apiTests = this.runCommand('cd server-backend && npm run test:api');
            this.results.tests.integration.passed += apiTests.passed;
            this.results.tests.integration.failed += apiTests.failed;
            this.results.tests.integration.total += apiTests.total;

            console.log('✅ 통합 테스트 완료');

        } catch (error) {
            console.error('❌ 통합 테스트 실패:', error);
            throw error;
        }
    }

    // E2E 테스트
    async runE2ETests() {
        console.log('🎭 E2E 테스트 시작...');

        try {
            // 프론트엔드 E2E 테스트
            console.log('  🎨 프론트엔드 E2E 테스트...');
            const frontendTests = this.runCommand('cd frontend && npm run test:e2e');
            this.results.tests.e2e.passed += frontendTests.passed;
            this.results.tests.e2e.failed += frontendTests.failed;
            this.results.tests.e2e.total += frontendTests.total;

            console.log('✅ E2E 테스트 완료');

        } catch (error) {
            console.error('❌ E2E 테스트 실패:', error);
            throw error;
        }
    }

    // 성능 테스트
    async runPerformanceTests() {
        console.log('⚡ 성능 테스트 시작...');

        try {
            // 성능 테스트 실행
            const performanceTests = this.runCommand('node scripts/performance-test.js');
            this.results.tests.performance.passed += performanceTests.passed;
            this.results.tests.performance.failed += performanceTests.failed;
            this.results.tests.performance.total += performanceTests.total;

            console.log('✅ 성능 테스트 완료');

        } catch (error) {
            console.error('❌ 성능 테스트 실패:', error);
            throw error;
        }
    }

    // 명령어 실행
    runCommand(command, throwOnError = true) {
        try {
            const output = execSync(command, {
                encoding: 'utf8',
                stdio: 'pipe'
            });

            // 테스트 결과 파싱 (간단한 예시)
            const lines = output.split('\n');
            let passed = 0;
            let failed = 0;
            let total = 0;
            let coverage = 0;
            let errors = 0;
            let warnings = 0;
            let vulnerabilities = 0;

            // Jest 출력 파싱
            const jestMatch = output.match(/(\d+) passing.*?(\d+) failing/);
            if (jestMatch) {
                passed = parseInt(jestMatch[1]);
                failed = parseInt(jestMatch[2]);
                total = passed + failed;
            }

            // 커버리지 파싱
            const coverageMatch = output.match(/All files\s+\|\s+(\d+\.\d+)%/);
            if (coverageMatch) {
                coverage = parseFloat(coverageMatch[1]);
            }

            // 린팅 에러/경고 파싱
            const lintErrors = (output.match(/error/g) || []).length;
            const lintWarnings = (output.match(/warning/g) || []).length;
            errors += lintErrors;
            warnings += lintWarnings;

            // 보안 취약점 파싱
            const vulnMatch = output.match(/vulnerabilities found/);
            if (vulnMatch) {
                vulnerabilities = 1; // 간단한 예시
            }

            return {
                passed,
                failed,
                total,
                coverage,
                errors,
                warnings,
                vulnerabilities
            };

        } catch (error) {
            if (throwOnError) {
                throw error;
            }

            return {
                passed: 0,
                failed: 1,
                total: 1,
                coverage: 0,
                errors: 1,
                warnings: 0,
                vulnerabilities: 0
            };
        }
    }

    // 결과 분석
    analyzeResults() {
        console.log('\n📊 테스트 결과 분석...');

        const { tests, coverage, quality } = this.results;

        // 전체 테스트 통계
        const totalTests = tests.unit.total + tests.integration.total + tests.e2e.total + tests.performance.total;
        const totalPassed = tests.unit.passed + tests.integration.passed + tests.e2e.passed + tests.performance.passed;
        const totalFailed = tests.unit.failed + tests.integration.failed + tests.e2e.failed + tests.performance.failed;

        // 전체 커버리지 계산
        coverage.overall = (coverage.backend + coverage.frontend) / 2;

        console.log(`\n📈 테스트 통계:`);
        console.log(`  총 테스트: ${totalTests}`);
        console.log(`  통과: ${totalPassed}`);
        console.log(`  실패: ${totalFailed}`);
        console.log(`  성공률: ${totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(2) : 0}%`);

        console.log(`\n📊 커버리지:`);
        console.log(`  백엔드: ${coverage.backend.toFixed(2)}%`);
        console.log(`  프론트엔드: ${coverage.frontend.toFixed(2)}%`);
        console.log(`  전체: ${coverage.overall.toFixed(2)}%`);

        console.log(`\n🔍 코드 품질:`);
        console.log(`  린팅: ${quality.linting.passed ? '✅ 통과' : '❌ 실패'} (에러: ${quality.linting.errors}, 경고: ${quality.linting.warnings})`);
        console.log(`  타입 검사: ${quality.typeCheck.passed ? '✅ 통과' : '❌ 실패'} (에러: ${quality.typeCheck.errors})`);
        console.log(`  보안: ${quality.security.passed ? '✅ 통과' : '❌ 실패'} (취약점: ${quality.security.vulnerabilities})`);
    }

    // 보고서 생성
    generateReport() {
        console.log('\n📄 테스트 보고서 생성...');

        const reportDir = 'reports';
        if (!fs.existsSync(reportDir)) {
            fs.mkdirSync(reportDir, { recursive: true });
        }

        // JSON 보고서
        const jsonReport = JSON.stringify(this.results, null, 2);
        fs.writeFileSync(path.join(reportDir, 'test-automation-report.json'), jsonReport);

        // 마크다운 보고서
        const markdownReport = this.generateMarkdownReport();
        fs.writeFileSync(path.join(reportDir, 'test-automation-report.md'), markdownReport);

        console.log(`✅ 보고서 생성 완료: ${reportDir}/test-automation-report.*`);
    }

    // 마크다운 보고서 생성
    generateMarkdownReport() {
        const { tests, coverage, quality } = this.results;

        let report = `# 🧪 테스트 자동화 보고서\n\n`;
        report += `**생성 일시**: ${new Date().toLocaleString('ko-KR')}\n\n`;

        // 테스트 통계
        const totalTests = tests.unit.total + tests.integration.total + tests.e2e.total + tests.performance.total;
        const totalPassed = tests.unit.passed + tests.integration.passed + tests.e2e.passed + tests.performance.passed;
        const totalFailed = tests.unit.failed + tests.integration.failed + tests.e2e.failed + tests.performance.failed;

        report += `## 📊 테스트 통계\n\n`;
        report += `| 테스트 유형 | 통과 | 실패 | 총계 | 성공률 |\n`;
        report += `|-------------|------|------|------|--------|\n`;
        report += `| 단위 테스트 | ${tests.unit.passed} | ${tests.unit.failed} | ${tests.unit.total} | ${tests.unit.total > 0 ? ((tests.unit.passed / tests.unit.total) * 100).toFixed(2) : 0}% |\n`;
        report += `| 통합 테스트 | ${tests.integration.passed} | ${tests.integration.failed} | ${tests.integration.total} | ${tests.integration.total > 0 ? ((tests.integration.passed / tests.integration.total) * 100).toFixed(2) : 0}% |\n`;
        report += `| E2E 테스트 | ${tests.e2e.passed} | ${tests.e2e.failed} | ${tests.e2e.total} | ${tests.e2e.total > 0 ? ((tests.e2e.passed / tests.e2e.total) * 100).toFixed(2) : 0}% |\n`;
        report += `| 성능 테스트 | ${tests.performance.passed} | ${tests.performance.failed} | ${tests.performance.total} | ${tests.performance.total > 0 ? ((tests.performance.passed / tests.performance.total) * 100).toFixed(2) : 0}% |\n`;
        report += `| **전체** | **${totalPassed}** | **${totalFailed}** | **${totalTests}** | **${totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(2) : 0}%** |\n\n`;

        // 커버리지
        report += `## 📈 코드 커버리지\n\n`;
        report += `| 구분 | 커버리지 |\n`;
        report += `|------|----------|\n`;
        report += `| 백엔드 | ${coverage.backend.toFixed(2)}% |\n`;
        report += `| 프론트엔드 | ${coverage.frontend.toFixed(2)}% |\n`;
        report += `| 전체 | ${coverage.overall.toFixed(2)}% |\n\n`;

        // 코드 품질
        report += `## 🔍 코드 품질\n\n`;
        report += `| 검사 항목 | 상태 | 세부사항 |\n`;
        report += `|-----------|------|----------|\n`;
        report += `| 린팅 | ${quality.linting.passed ? '✅ 통과' : '❌ 실패'} | 에러: ${quality.linting.errors}, 경고: ${quality.linting.warnings} |\n`;
        report += `| 타입 검사 | ${quality.typeCheck.passed ? '✅ 통과' : '❌ 실패'} | 에러: ${quality.typeCheck.errors} |\n`;
        report += `| 보안 검사 | ${quality.security.passed ? '✅ 통과' : '❌ 실패'} | 취약점: ${quality.security.vulnerabilities} |\n\n`;

        // 권장사항
        report += `## 💡 권장사항\n\n`;

        if (totalFailed > 0) {
            report += `- ❌ **실패한 테스트 수정**: ${totalFailed}개의 테스트가 실패했습니다.\n`;
        }

        if (coverage.overall < 80) {
            report += `- 📈 **커버리지 향상**: 현재 커버리지가 ${coverage.overall.toFixed(2)}%입니다. 80% 이상을 목표로 하세요.\n`;
        }

        if (!quality.linting.passed) {
            report += `- 🔧 **린팅 오류 수정**: ${quality.linting.errors}개의 린팅 에러를 수정하세요.\n`;
        }

        if (!quality.typeCheck.passed) {
            report += `- 🔧 **타입 오류 수정**: ${quality.typeCheck.errors}개의 타입 에러를 수정하세요.\n`;
        }

        if (!quality.security.passed) {
            report += `- 🔒 **보안 취약점 수정**: ${quality.security.vulnerabilities}개의 보안 취약점을 수정하세요.\n`;
        }

        if (totalFailed === 0 && coverage.overall >= 80 && quality.linting.passed && quality.typeCheck.passed && quality.security.passed) {
            report += `- 🎉 **모든 검사 통과**: 코드 품질이 우수합니다!\n`;
        }

        report += `\n---\n\n`;
        report += `*이 보고서는 테스트 자동화 스크립트에 의해 생성되었습니다.*\n`;
        report += `*생성 시간: ${new Date().toISOString()}*\n`;

        return report;
    }
}

// 스크립트 실행
async function runTestAutomation() {
    const automation = new TestAutomation();
    await automation.runAllTests();
}

// 스크립트가 직접 실행된 경우
if (require.main === module) {
    runTestAutomation();
}

module.exports = { TestAutomation, runTestAutomation };
