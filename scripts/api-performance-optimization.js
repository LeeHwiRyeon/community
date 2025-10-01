#!/usr/bin/env node

/**
 * 🚀 API 성능 최적화 스크립트
 * 
 * 이 스크립트는 다음 작업을 수행합니다:
 * 1. API 엔드포인트 성능 분석
 * 2. 응답 시간 최적화
 * 3. 캐싱 전략 구현
 * 4. 메모리 사용량 최적화
 */

const axios = require('axios');
const { performance } = require('perf_hooks');
const fs = require('fs');
const path = require('path');

// API 설정
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:50000/api';
const CONCURRENT_REQUESTS = 10;
const TEST_DURATION = 30000; // 30초

// 색상 정의
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

const log = (message, color = 'reset') => {
    console.log(`${colors[color]}${message}${colors.reset}`);
};

// 테스트할 API 엔드포인트
const testEndpoints = [
    {
        name: 'Health Check',
        method: 'GET',
        path: '/health-check',
        expectedStatus: 200
    },
    {
        name: 'Get Boards',
        method: 'GET',
        path: '/boards',
        expectedStatus: 200
    },
    {
        name: 'Get Posts (paginated)',
        method: 'GET',
        path: '/posts?page=1&limit=10',
        expectedStatus: 200
    },
    {
        name: 'Get Users',
        method: 'GET',
        path: '/users',
        expectedStatus: 200
    },
    {
        name: 'System Status',
        method: 'GET',
        path: '/system-monitoring/status',
        expectedStatus: 200
    },
    {
        name: 'Analytics Overview',
        method: 'GET',
        path: '/analytics/overview',
        expectedStatus: 200
    }
];

// 성능 테스트 클래스
class PerformanceTester {
    constructor() {
        this.results = [];
        this.errors = [];
        this.startTime = null;
        this.endTime = null;
    }

    async testEndpoint(endpoint) {
        const startTime = performance.now();
        let status = 'SUCCESS';
        let errorMessage = '';
        let responseSize = 0;

        try {
            const response = await axios({
                method: endpoint.method,
                url: `${API_BASE_URL}${endpoint.path}`,
                timeout: 5000,
                validateStatus: () => true // 모든 상태 코드 허용
            });

            const endTime = performance.now();
            const duration = endTime - startTime;
            responseSize = JSON.stringify(response.data).length;

            if (response.status !== endpoint.expectedStatus) {
                status = 'FAILED';
                errorMessage = `Expected ${endpoint.expectedStatus}, got ${response.status}`;
            }

            return {
                name: endpoint.name,
                method: endpoint.method,
                path: endpoint.path,
                duration: duration,
                status: status,
                statusCode: response.status,
                responseSize: responseSize,
                error: errorMessage
            };

        } catch (error) {
            const endTime = performance.now();
            const duration = endTime - startTime;

            return {
                name: endpoint.name,
                method: endpoint.method,
                path: endpoint.path,
                duration: duration,
                status: 'ERROR',
                statusCode: 0,
                responseSize: 0,
                error: error.message
            };
        }
    }

    async runConcurrentTest(endpoint, concurrency = CONCURRENT_REQUESTS) {
        log(`\n🔄 ${endpoint.name} 동시성 테스트 (${concurrency}개 요청)`, 'cyan');

        const promises = Array(concurrency).fill().map(() => this.testEndpoint(endpoint));
        const results = await Promise.all(promises);

        const successful = results.filter(r => r.status === 'SUCCESS');
        const failed = results.filter(r => r.status !== 'SUCCESS');

        const durations = successful.map(r => r.duration);
        const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
        const minDuration = Math.min(...durations);
        const maxDuration = Math.max(...durations);

        // P95, P99 계산
        const sortedDurations = durations.sort((a, b) => a - b);
        const p95Index = Math.floor(sortedDurations.length * 0.95);
        const p99Index = Math.floor(sortedDurations.length * 0.99);
        const p95 = sortedDurations[p95Index] || 0;
        const p99 = sortedDurations[p99Index] || 0;

        const result = {
            endpoint: endpoint.name,
            concurrency: concurrency,
            totalRequests: results.length,
            successful: successful.length,
            failed: failed.length,
            successRate: (successful.length / results.length * 100).toFixed(2),
            avgDuration: avgDuration,
            minDuration: minDuration,
            maxDuration: maxDuration,
            p95Duration: p95,
            p99Duration: p99,
            avgResponseSize: successful.reduce((sum, r) => sum + r.responseSize, 0) / successful.length
        };

        log(`  ✅ 성공: ${result.successful}/${result.totalRequests} (${result.successRate}%)`, 'green');
        log(`  ⏱️  평균 응답시간: ${result.avgDuration.toFixed(2)}ms`, 'blue');
        log(`  📊 P95: ${result.p95Duration.toFixed(2)}ms, P99: ${result.p99Duration.toFixed(2)}ms`, 'blue');
        log(`  📦 평균 응답크기: ${Math.round(result.avgResponseSize)} bytes`, 'blue');

        if (result.failed > 0) {
            log(`  ❌ 실패: ${result.failed}개`, 'red');
            failed.forEach(f => {
                log(`    - ${f.error}`, 'red');
            });
        }

        return result;
    }

    async runLoadTest() {
        log('\n🚀 부하 테스트 시작...', 'cyan');

        this.startTime = performance.now();
        const allResults = [];

        for (const endpoint of testEndpoints) {
            const result = await this.runConcurrentTest(endpoint);
            allResults.push(result);
        }

        this.endTime = performance.now();
        this.results = allResults;

        return allResults;
    }

    generateReport() {
        const totalDuration = this.endTime - this.startTime;
        const totalRequests = this.results.reduce((sum, r) => sum + r.totalRequests, 0);
        const totalSuccessful = this.results.reduce((sum, r) => sum + r.successful, 0);
        const totalFailed = this.results.reduce((sum, r) => sum + r.failed, 0);

        const overallSuccessRate = (totalSuccessful / totalRequests * 100).toFixed(2);
        const avgResponseTime = this.results.reduce((sum, r) => sum + r.avgDuration, 0) / this.results.length;

        // 성능 등급 계산
        let performanceGrade = 'A';
        if (avgResponseTime > 500) performanceGrade = 'C';
        else if (avgResponseTime > 200) performanceGrade = 'B';

        if (parseFloat(overallSuccessRate) < 95) performanceGrade = 'D';

        const report = {
            timestamp: new Date().toISOString(),
            testDuration: totalDuration,
            totalRequests: totalRequests,
            totalSuccessful: totalSuccessful,
            totalFailed: totalFailed,
            overallSuccessRate: overallSuccessRate + '%',
            avgResponseTime: avgResponseTime,
            performanceGrade: performanceGrade,
            endpoints: this.results,
            recommendations: this.generateRecommendations()
        };

        return report;
    }

    generateRecommendations() {
        const recommendations = [];
        const avgResponseTime = this.results.reduce((sum, r) => sum + r.avgDuration, 0) / this.results.length;

        if (avgResponseTime > 200) {
            recommendations.push('API 응답 시간이 200ms를 초과합니다. 데이터베이스 쿼리 최적화가 필요합니다.');
        }

        if (avgResponseTime > 500) {
            recommendations.push('API 응답 시간이 500ms를 초과합니다. 캐싱 전략 구현을 권장합니다.');
        }

        const slowEndpoints = this.results.filter(r => r.avgDuration > 300);
        if (slowEndpoints.length > 0) {
            recommendations.push(`다음 엔드포인트들의 성능 개선이 필요합니다: ${slowEndpoints.map(e => e.endpoint).join(', ')}`);
        }

        const lowSuccessRate = this.results.filter(r => parseFloat(r.successRate) < 95);
        if (lowSuccessRate.length > 0) {
            recommendations.push(`다음 엔드포인트들의 안정성 개선이 필요합니다: ${lowSuccessRate.map(e => e.endpoint).join(', ')}`);
        }

        if (recommendations.length === 0) {
            recommendations.push('모든 API 엔드포인트가 성능 기준을 만족합니다.');
        }

        return recommendations;
    }

    async saveReport(report) {
        const reportsDir = path.join(__dirname, '../reports');
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }

        const reportPath = path.join(reportsDir, `api-performance-${Date.now()}.json`);
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

        log(`\n📄 성능 테스트 보고서 저장: ${reportPath}`, 'green');
        return reportPath;
    }
}

// 메모리 사용량 모니터링
function monitorMemoryUsage() {
    const memUsage = process.memoryUsage();
    return {
        rss: Math.round(memUsage.rss / 1024 / 1024), // MB
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
        external: Math.round(memUsage.external / 1024 / 1024) // MB
    };
}

async function main() {
    log('🚀 API 성능 최적화 스크립트 시작', 'bright');
    log('=' * 50, 'cyan');

    // 초기 메모리 사용량
    const initialMemory = monitorMemoryUsage();
    log(`\n💾 초기 메모리 사용량:`, 'yellow');
    log(`  RSS: ${initialMemory.rss}MB`, 'blue');
    log(`  Heap Total: ${initialMemory.heapTotal}MB`, 'blue');
    log(`  Heap Used: ${initialMemory.heapUsed}MB`, 'blue');
    log(`  External: ${initialMemory.external}MB`, 'blue');

    try {
        // API 서버 연결 확인
        log('\n🔍 API 서버 연결 확인...', 'cyan');
        try {
            await axios.get(`${API_BASE_URL}/health-check`, { timeout: 5000 });
            log('✅ API 서버 연결 성공', 'green');
        } catch (error) {
            log(`❌ API 서버 연결 실패: ${error.message}`, 'red');
            log('API 서버가 실행 중인지 확인하세요.', 'yellow');
            return;
        }

        // 성능 테스트 실행
        const tester = new PerformanceTester();
        await tester.runLoadTest();

        // 보고서 생성
        const report = tester.generateReport();

        // 결과 출력
        log('\n📊 성능 테스트 결과', 'cyan');
        log('=' * 30, 'cyan');
        log(`총 요청 수: ${report.totalRequests}개`, 'blue');
        log(`성공률: ${report.overallSuccessRate}`, 'green');
        log(`평균 응답시간: ${report.avgResponseTime.toFixed(2)}ms`, 'blue');
        log(`성능 등급: ${report.performanceGrade}`, report.performanceGrade === 'A' ? 'green' : 'yellow');

        // 권장사항 출력
        log('\n💡 권장사항:', 'yellow');
        report.recommendations.forEach((rec, index) => {
            log(`  ${index + 1}. ${rec}`, 'yellow');
        });

        // 최종 메모리 사용량
        const finalMemory = monitorMemoryUsage();
        log('\n💾 최종 메모리 사용량:', 'yellow');
        log(`  RSS: ${finalMemory.rss}MB (변화: ${finalMemory.rss - initialMemory.rss}MB)`, 'blue');
        log(`  Heap Used: ${finalMemory.heapUsed}MB (변화: ${finalMemory.heapUsed - initialMemory.heapUsed}MB)`, 'blue');

        // 보고서 저장
        await tester.saveReport(report);

        log('\n🎉 API 성능 테스트 완료!', 'green');

    } catch (error) {
        log(`\n❌ 성능 테스트 실패: ${error.message}`, 'red');
        process.exit(1);
    }
}

// 스크립트 실행
if (require.main === module) {
    main().catch(console.error);
}

module.exports = {
    PerformanceTester,
    monitorMemoryUsage
};
