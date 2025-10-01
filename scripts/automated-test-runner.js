#!/usr/bin/env node

/**
 * 자동화 테스트 실행 시스템
 * 
 * 1. Jest/Cypress 환경 자동 설정
 * 2. 생성된 테스트 파일들 자동 실행
 * 3. 테스트 결과 분석 및 리포팅
 * 4. CI/CD 파이프라인 통합
 */

const fs = require('fs').promises
const path = require('path')
const { exec } = require('child_process')
const { promisify } = require('util')

const execAsync = promisify(exec)

class AutomatedTestRunner {
    constructor() {
        this.testResults = {
            unit: { passed: 0, failed: 0, total: 0, duration: 0, errors: [] },
            integration: { passed: 0, failed: 0, total: 0, duration: 0, errors: [] },
            e2e: { passed: 0, failed: 0, total: 0, duration: 0, errors: [] },
            performance: { passed: 0, failed: 0, total: 0, duration: 0, errors: [] },
            security: { passed: 0, failed: 0, total: 0, duration: 0, errors: [] }
        }

        this.config = {
            jest: {
                testEnvironment: 'node',
                collectCoverage: true,
                coverageDirectory: 'coverage',
                coverageReporters: ['text', 'lcov', 'html'],
                testMatch: ['**/*.test.js'],
                verbose: true
            },
            cypress: {
                baseUrl: 'http://localhost:3000',
                video: true,
                screenshot: true,
                viewportWidth: 1280,
                viewportHeight: 720
            }
        }
    }

    async runAutomatedTests() {
        console.log('🚀 자동화 테스트 실행 시작...')

        try {
            // 1. 환경 설정
            await this.setupTestEnvironment()

            // 2. 테스트 파일 준비
            await this.prepareTestFiles()

            // 3. 단위 테스트 실행
            await this.runUnitTests()

            // 4. 통합 테스트 실행
            await this.runIntegrationTests()

            // 5. E2E 테스트 실행
            await this.runE2ETests()

            // 6. 성능 테스트 실행
            await this.runPerformanceTests()

            // 7. 보안 테스트 실행
            await this.runSecurityTests()

            // 8. 결과 분석 및 리포팅
            await this.generateTestReport()

            // 9. CI/CD 통합
            await this.integrateWithCICD()

            console.log('\n✅ 자동화 테스트 완료!')

        } catch (error) {
            console.error('❌ 자동화 테스트 오류:', error.message)
            throw error
        }
    }

    async setupTestEnvironment() {
        console.log('🔧 테스트 환경 설정 중...')

        try {
            // 1. package.json 확인 및 업데이트
            await this.setupPackageJson()

            // 2. Jest 설정 파일 생성
            await this.createJestConfig()

            // 3. Cypress 설정 파일 생성
            await this.createCypressConfig()

            // 4. 테스트 디렉토리 생성
            await this.createTestDirectories()

            // 5. 의존성 설치
            await this.installDependencies()

            console.log('✅ 테스트 환경 설정 완료')

        } catch (error) {
            console.error('❌ 환경 설정 오류:', error.message)
            throw error
        }
    }

    async setupPackageJson() {
        console.log('  📦 package.json 설정 중...')

        const packageJsonPath = 'package.json'
        let packageJson = {}

        try {
            const content = await fs.readFile(packageJsonPath, 'utf8')
            packageJson = JSON.parse(content)
        } catch (error) {
            console.log('    package.json이 없습니다. 새로 생성합니다.')
        }

        // 테스트 스크립트 추가
        packageJson.scripts = packageJson.scripts || {}
        packageJson.scripts.test = 'jest'
        packageJson.scripts['test:unit'] = 'jest --testPathPattern=unit'
        packageJson.scripts['test:integration'] = 'jest --testPathPattern=integration'
        packageJson.scripts['test:e2e'] = 'cypress run'
        packageJson.scripts['test:performance'] = 'jest --testPathPattern=performance'
        packageJson.scripts['test:security'] = 'jest --testPathPattern=security'
        packageJson.scripts['test:all'] = 'npm run test:unit && npm run test:integration && npm run test:performance && npm run test:security'

        // 테스트 의존성 추가
        packageJson.devDependencies = packageJson.devDependencies || {}
        packageJson.devDependencies.jest = '^29.0.0'
        packageJson.devDependencies['@testing-library/react'] = '^13.0.0'
        packageJson.devDependencies['@testing-library/jest-dom'] = '^5.16.0'
        packageJson.devDependencies['@testing-library/user-event'] = '^14.0.0'
        packageJson.devDependencies.cypress = '^12.0.0'
        packageJson.devDependencies['cypress-real-events'] = '^1.7.0'

        await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf8')
        console.log('    ✅ package.json 설정 완료')
    }

    async createJestConfig() {
        console.log('  ⚙️ Jest 설정 파일 생성 중...')

        const jestConfig = {
            ...this.config.jest,
            setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
            moduleNameMapping: {
                '^@/(.*)$': '<rootDir>/src/$1'
            },
            collectCoverageFrom: [
                'src/**/*.{js,jsx}',
                '!src/**/*.test.{js,jsx}',
                '!src/**/*.spec.{js,jsx}',
                '!src/setupTests.js'
            ],
            coverageThreshold: {
                global: {
                    branches: 80,
                    functions: 80,
                    lines: 80,
                    statements: 80
                }
            }
        }

        await fs.writeFile('jest.config.js', `module.exports = ${JSON.stringify(jestConfig, null, 2)}`, 'utf8')
        console.log('    ✅ Jest 설정 완료')
    }

    async createCypressConfig() {
        console.log('  🌐 Cypress 설정 파일 생성 중...')

        const cypressConfig = {
            ...this.config.cypress,
            e2e: {
                baseUrl: this.config.cypress.baseUrl,
                specPattern: 'cypress/e2e/**/*.cy.js',
                supportFile: 'cypress/support/e2e.js'
            },
            component: {
                devServer: {
                    framework: 'create-react-app',
                    bundler: 'webpack'
                }
            }
        }

        await fs.writeFile('cypress.config.js', `module.exports = ${JSON.stringify(cypressConfig, null, 2)}`, 'utf8')
        console.log('    ✅ Cypress 설정 완료')
    }

    async createTestDirectories() {
        console.log('  📁 테스트 디렉토리 생성 중...')

        const directories = [
            'tests/unit',
            'tests/integration',
            'tests/e2e',
            'tests/performance',
            'tests/security',
            'cypress/e2e',
            'cypress/support',
            'cypress/fixtures',
            'coverage'
        ]

        for (const dir of directories) {
            await fs.mkdir(dir, { recursive: true })
        }

        // setupTests.js 생성
        const setupTestsContent = `import '@testing-library/jest-dom'

// Mock fetch
global.fetch = jest.fn()

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}
`

        await fs.writeFile('src/setupTests.js', setupTestsContent, 'utf8')
        console.log('    ✅ 테스트 디렉토리 생성 완료')
    }

    async installDependencies() {
        console.log('  📥 의존성 설치 중...')

        try {
            await execAsync('npm install', { stdio: 'inherit' })
            console.log('    ✅ 의존성 설치 완료')
        } catch (error) {
            console.log('    ⚠️ 의존성 설치 실패, 계속 진행합니다.')
        }
    }

    async prepareTestFiles() {
        console.log('📋 테스트 파일 준비 중...')

        try {
            // work-results에서 테스트 파일들을 tests 디렉토리로 복사
            const workResultsDir = 'work-results'
            const testsDir = 'tests'

            const files = await fs.readdir(workResultsDir)

            for (const file of files) {
                if (file.includes('unit-tests-') && file.endsWith('.test.js')) {
                    await this.copyTestFile(workResultsDir, file, 'tests/unit')
                } else if (file.includes('integration-tests-') && file.endsWith('.test.js')) {
                    await this.copyTestFile(workResultsDir, file, 'tests/integration')
                } else if (file.includes('e2e-tests-') && file.endsWith('.cy.js')) {
                    await this.copyTestFile(workResultsDir, file, 'cypress/e2e')
                } else if (file.includes('performance-tests-') && file.endsWith('.test.js')) {
                    await this.copyTestFile(workResultsDir, file, 'tests/performance')
                } else if (file.includes('security-tests-') && file.endsWith('.test.js')) {
                    await this.copyTestFile(workResultsDir, file, 'tests/security')
                }
            }

            console.log('✅ 테스트 파일 준비 완료')

        } catch (error) {
            console.error('❌ 테스트 파일 준비 오류:', error.message)
            throw error
        }
    }

    async copyTestFile(sourceDir, filename, targetDir) {
        const sourcePath = path.join(sourceDir, filename)
        const targetPath = path.join(targetDir, filename)

        const content = await fs.readFile(sourcePath, 'utf8')
        await fs.writeFile(targetPath, content, 'utf8')
    }

    async runUnitTests() {
        console.log('🧪 단위 테스트 실행 중...')

        try {
            const startTime = Date.now()

            const command = 'npm run test:unit'
            const { stdout, stderr } = await execAsync(command, {
                cwd: process.cwd(),
                timeout: 60000 // 60초 타임아웃
            })

            const duration = Date.now() - startTime

            // Jest 출력 파싱
            const results = this.parseJestOutput(stdout, stderr)

            this.testResults.unit = {
                ...results,
                duration: duration / 1000
            }

            console.log(`  ✅ 단위 테스트 완료: ${results.passed}/${results.total} (${duration}ms)`)

        } catch (error) {
            console.error('  ❌ 단위 테스트 실패:', error.message)
            this.testResults.unit.errors.push(error.message)
        }
    }

    async runIntegrationTests() {
        console.log('🎭 통합 테스트 실행 중...')

        try {
            const startTime = Date.now()

            const command = 'npm run test:integration'
            const { stdout, stderr } = await execAsync(command, {
                cwd: process.cwd(),
                timeout: 120000 // 120초 타임아웃
            })

            const duration = Date.now() - startTime

            const results = this.parseJestOutput(stdout, stderr)

            this.testResults.integration = {
                ...results,
                duration: duration / 1000
            }

            console.log(`  ✅ 통합 테스트 완료: ${results.passed}/${results.total} (${duration}ms)`)

        } catch (error) {
            console.error('  ❌ 통합 테스트 실패:', error.message)
            this.testResults.integration.errors.push(error.message)
        }
    }

    async runE2ETests() {
        console.log('🌐 E2E 테스트 실행 중...')

        try {
            const startTime = Date.now()

            // 먼저 개발 서버 시작 (백그라운드)
            const serverProcess = exec('npm start', { cwd: process.cwd() })

            // 서버 시작 대기
            await new Promise(resolve => setTimeout(resolve, 10000))

            const command = 'npm run test:e2e'
            const { stdout, stderr } = await execAsync(command, {
                cwd: process.cwd(),
                timeout: 300000 // 5분 타임아웃
            })

            const duration = Date.now() - startTime

            // Cypress 출력 파싱
            const results = this.parseCypressOutput(stdout, stderr)

            this.testResults.e2e = {
                ...results,
                duration: duration / 1000
            }

            // 서버 종료
            serverProcess.kill()

            console.log(`  ✅ E2E 테스트 완료: ${results.passed}/${results.total} (${duration}ms)`)

        } catch (error) {
            console.error('  ❌ E2E 테스트 실패:', error.message)
            this.testResults.e2e.errors.push(error.message)
        }
    }

    async runPerformanceTests() {
        console.log('⚡ 성능 테스트 실행 중...')

        try {
            const startTime = Date.now()

            const command = 'npm run test:performance'
            const { stdout, stderr } = await execAsync(command, {
                cwd: process.cwd(),
                timeout: 180000 // 3분 타임아웃
            })

            const duration = Date.now() - startTime

            const results = this.parseJestOutput(stdout, stderr)

            this.testResults.performance = {
                ...results,
                duration: duration / 1000
            }

            console.log(`  ✅ 성능 테스트 완료: ${results.passed}/${results.total} (${duration}ms)`)

        } catch (error) {
            console.error('  ❌ 성능 테스트 실패:', error.message)
            this.testResults.performance.errors.push(error.message)
        }
    }

    async runSecurityTests() {
        console.log('🔒 보안 테스트 실행 중...')

        try {
            const startTime = Date.now()

            const command = 'npm run test:security'
            const { stdout, stderr } = await execAsync(command, {
                cwd: process.cwd(),
                timeout: 120000 // 2분 타임아웃
            })

            const duration = Date.now() - startTime

            const results = this.parseJestOutput(stdout, stderr)

            this.testResults.security = {
                ...results,
                duration: duration / 1000
            }

            console.log(`  ✅ 보안 테스트 완료: ${results.passed}/${results.total} (${duration}ms)`)

        } catch (error) {
            console.error('  ❌ 보안 테스트 실패:', error.message)
            this.testResults.security.errors.push(error.message)
        }
    }

    parseJestOutput(stdout, stderr) {
        // Jest 출력에서 테스트 결과 파싱
        const lines = stdout.split('\n')
        let passed = 0
        let failed = 0
        let total = 0

        for (const line of lines) {
            if (line.includes('Tests:')) {
                const match = line.match(/(\d+) passed|(\d+) failed|(\d+) total/)
                if (match) {
                    passed = parseInt(match[1]) || 0
                    failed = parseInt(match[2]) || 0
                    total = parseInt(match[3]) || 0
                }
            }
        }

        return { passed, failed, total, errors: stderr ? [stderr] : [] }
    }

    parseCypressOutput(stdout, stderr) {
        // Cypress 출력에서 테스트 결과 파싱
        const lines = stdout.split('\n')
        let passed = 0
        let failed = 0
        let total = 0

        for (const line of lines) {
            if (line.includes('passing') || line.includes('failing')) {
                const passingMatch = line.match(/(\d+) passing/)
                const failingMatch = line.match(/(\d+) failing/)

                if (passingMatch) passed = parseInt(passingMatch[1])
                if (failingMatch) failed = parseInt(failingMatch[1])
            }
        }

        total = passed + failed

        return { passed, failed, total, errors: stderr ? [stderr] : [] }
    }

    async generateTestReport() {
        console.log('📊 테스트 결과 분석 및 리포팅 중...')

        const totalTests = Object.values(this.testResults).reduce((sum, result) => sum + result.total, 0)
        const totalPassed = Object.values(this.testResults).reduce((sum, result) => sum + result.passed, 0)
        const totalFailed = Object.values(this.testResults).reduce((sum, result) => sum + result.failed, 0)
        const totalDuration = Object.values(this.testResults).reduce((sum, result) => sum + result.duration, 0)

        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalTests,
                totalPassed,
                totalFailed,
                successRate: totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : 0,
                totalDuration: totalDuration.toFixed(2)
            },
            testResults: this.testResults,
            recommendations: this.generateRecommendations()
        }

        // JSON 리포트 저장
        const jsonReportPath = 'test-results.json'
        await fs.writeFile(jsonReportPath, JSON.stringify(report, null, 2), 'utf8')

        // HTML 리포트 생성
        await this.generateHTMLReport(report)

        // 콘솔 출력
        this.printTestSummary(report)

        console.log('✅ 테스트 리포트 생성 완료')
    }

    async generateHTMLReport(report) {
        const htmlContent = `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>자동화 테스트 결과</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f4f4f4; padding: 20px; border-radius: 5px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .card { background: white; border: 1px solid #ddd; padding: 20px; border-radius: 5px; }
        .success { border-left: 5px solid #4CAF50; }
        .warning { border-left: 5px solid #FF9800; }
        .error { border-left: 5px solid #F44336; }
        .test-type { margin: 20px 0; }
        .test-type h3 { color: #333; }
        .progress-bar { background: #e0e0e0; height: 20px; border-radius: 10px; overflow: hidden; }
        .progress-fill { height: 100%; background: #4CAF50; transition: width 0.3s; }
        .recommendations { background: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 자동화 테스트 결과</h1>
        <p>생성일: ${report.timestamp}</p>
    </div>
    
    <div class="summary">
        <div class="card ${report.summary.successRate >= 80 ? 'success' : report.summary.successRate >= 60 ? 'warning' : 'error'}">
            <h3>전체 통계</h3>
            <p><strong>총 테스트:</strong> ${report.summary.totalTests}개</p>
            <p><strong>통과:</strong> ${report.summary.totalPassed}개</p>
            <p><strong>실패:</strong> ${report.summary.totalFailed}개</p>
            <p><strong>성공률:</strong> ${report.summary.successRate}%</p>
            <p><strong>총 소요시간:</strong> ${report.summary.totalDuration}초</p>
        </div>
    </div>
    
    ${Object.entries(report.testResults).map(([type, result]) => `
    <div class="test-type">
        <h3>${type.toUpperCase()} 테스트</h3>
        <div class="card ${result.passed === result.total ? 'success' : result.passed > 0 ? 'warning' : 'error'}">
            <p><strong>통과:</strong> ${result.passed}/${result.total} (${result.total > 0 ? ((result.passed / result.total) * 100).toFixed(1) : 0}%)</p>
            <p><strong>소요시간:</strong> ${result.duration}초</p>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${result.total > 0 ? (result.passed / result.total) * 100 : 0}%"></div>
            </div>
            ${result.errors.length > 0 ? `<p><strong>오류:</strong> ${result.errors.join(', ')}</p>` : ''}
        </div>
    </div>
    `).join('')}
    
    <div class="recommendations">
        <h3>💡 권장사항</h3>
        <ul>
            ${report.recommendations.map(rec => `<li>${rec}</li>`).join('')}
        </ul>
    </div>
</body>
</html>
        `

        await fs.writeFile('test-results.html', htmlContent, 'utf8')
    }

    printTestSummary(report) {
        console.log('\n📊 자동화 테스트 결과 요약')
        console.log('='.repeat(50))

        console.log(`\n📈 전체 통계:`)
        console.log(`  총 테스트: ${report.summary.totalTests}개`)
        console.log(`  통과: ${report.summary.totalPassed}개`)
        console.log(`  실패: ${report.summary.totalFailed}개`)
        console.log(`  성공률: ${report.summary.successRate}%`)
        console.log(`  총 소요시간: ${report.summary.totalDuration}초`)

        console.log(`\n📋 테스트 타입별 결과:`)
        Object.entries(report.testResults).forEach(([type, result]) => {
            const successRate = result.total > 0 ? ((result.passed / result.total) * 100).toFixed(1) : 0
            console.log(`  ${type.toUpperCase()}: ${result.passed}/${result.total} (${successRate}%) - ${result.duration}초`)
        })

        console.log(`\n💡 권장사항:`)
        report.recommendations.forEach(rec => {
            console.log(`  - ${rec}`)
        })
    }

    generateRecommendations() {
        const recommendations = []

        Object.entries(this.testResults).forEach(([type, result]) => {
            if (result.failed > 0) {
                recommendations.push(`${type} 테스트 ${result.failed}개 실패 - 테스트 코드를 검토하고 수정하세요`)
            }

            if (result.duration > 60) {
                recommendations.push(`${type} 테스트가 ${result.duration}초 소요 - 성능 최적화를 고려하세요`)
            }
        })

        const totalSuccessRate = this.testResults.unit.total + this.testResults.integration.total + this.testResults.e2e.total + this.testResults.performance.total + this.testResults.security.total
        const totalPassed = this.testResults.unit.passed + this.testResults.integration.passed + this.testResults.e2e.passed + this.testResults.performance.passed + this.testResults.security.passed

        if (totalSuccessRate > 0) {
            const overallSuccessRate = (totalPassed / totalSuccessRate) * 100

            if (overallSuccessRate < 60) {
                recommendations.push('전체 성공률이 60% 미만입니다 - 테스트 전략을 재검토하세요')
            } else if (overallSuccessRate < 80) {
                recommendations.push('전체 성공률이 80% 미만입니다 - 테스트 품질을 개선하세요')
            } else {
                recommendations.push('훌륭한 테스트 성공률입니다! CI/CD 파이프라인에 통합하세요')
            }
        }

        if (recommendations.length === 0) {
            recommendations.push('모든 테스트가 성공적으로 완료되었습니다!')
        }

        return recommendations
    }

    async integrateWithCICD() {
        console.log('🔄 CI/CD 파이프라인 통합 중...')

        try {
            // GitHub Actions 워크플로우 생성
            await this.createGitHubActionsWorkflow()

            // Docker 설정 생성
            await this.createDockerConfig()

            // 환경 변수 설정
            await this.createEnvironmentConfig()

            console.log('✅ CI/CD 통합 완료')

        } catch (error) {
            console.error('❌ CI/CD 통합 오류:', error.message)
        }
    }

    async createGitHubActionsWorkflow() {
        const workflowContent = `name: 자동화 테스트

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [16.x, 18.x, 20.x]
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Node.js \${{\ matrix.node-version }} 설정
      uses: actions/setup-node@v3
      with:
        node-version: \${{\ matrix.node-version }}
        cache: 'npm'
    
    - name: 의존성 설치
      run: npm ci
    
    - name: 단위 테스트 실행
      run: npm run test:unit
    
    - name: 통합 테스트 실행
      run: npm run test:integration
    
    - name: 성능 테스트 실행
      run: npm run test:performance
    
    - name: 보안 테스트 실행
      run: npm run test:security
    
    - name: E2E 테스트 실행
      run: npm run test:e2e
      env:
        CYPRESS_RECORD_KEY: \${{ secrets.CYPRESS_RECORD_KEY }}
    
    - name: 테스트 결과 업로드
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: test-results
        path: |
          test-results.json
          test-results.html
          coverage/
`

        await fs.mkdir('.github/workflows', { recursive: true })
        await fs.writeFile('.github/workflows/automated-tests.yml', workflowContent, 'utf8')
        console.log('  ✅ GitHub Actions 워크플로우 생성 완료')
    }

    async createDockerConfig() {
        const dockerfileContent = `FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
`

        await fs.writeFile('Dockerfile', dockerfileContent, 'utf8')
        console.log('  ✅ Docker 설정 생성 완료')
    }

    async createEnvironmentConfig() {
        const envContent = `# 테스트 환경 변수
NODE_ENV=test
REACT_APP_API_URL=http://localhost:3001
CYPRESS_BASE_URL=http://localhost:3000
JEST_TIMEOUT=30000
`

        await fs.writeFile('.env.test', envContent, 'utf8')
        console.log('  ✅ 환경 변수 설정 완료')
    }
}

// CLI 실행
if (require.main === module) {
    const runner = new AutomatedTestRunner()

    runner.runAutomatedTests()
        .then(() => {
            console.log('\n🎉 자동화 테스트 시스템 구축 완료!')
            process.exit(0)
        })
        .catch(error => {
            console.error('❌ 자동화 테스트 실패:', error.message)
            process.exit(1)
        })
}

module.exports = AutomatedTestRunner
