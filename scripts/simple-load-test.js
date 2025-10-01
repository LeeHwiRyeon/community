#!/usr/bin/env node

/**
 * 간단한 부하 테스트 스크립트
 */

const { performance } = require('perf_hooks');
const fs = require('fs');
const path = require('path');

// 부하 테스트 실행
async function runSimpleLoadTest() {
    console.log('🚀 간단한 부하 테스트 시작...\n');

    const results = [];
    const startTime = performance.now();

    // 시뮬레이션된 API 요청
    async function simulateRequest() {
        const requestStart = performance.now();
        const processingTime = Math.random() * 100 + 50; // 50-150ms
        const success = Math.random() > 0.05; // 95% 성공률

        await new Promise(resolve => setTimeout(resolve, processingTime));

        const requestEnd = performance.now();
        return {
            responseTime: requestEnd - requestStart,
            success,
            statusCode: success ? 200 : 500
        };
    }

    // 경량 부하 테스트 (10명, 5초)
    console.log('📊 경량 부하 테스트 (10명, 5초)...');
    const lightLoadStart = performance.now();
    const lightLoadPromises = [];

    for (let i = 0; i < 10; i++) {
        lightLoadPromises.push(
            new Promise(async (resolve) => {
                const userResults = [];
                const userEndTime = Date.now() + 5000; // 5초

                while (Date.now() < userEndTime) {
                    const result = await simulateRequest();
                    userResults.push(result);
                    await new Promise(r => setTimeout(r, 1000)); // 1초 간격
                }

                resolve(userResults);
            })
        );
    }

    const lightLoadResults = await Promise.all(lightLoadPromises);
    const lightLoadEnd = performance.now();

    // 결과 집계
    const allResults = lightLoadResults.flat();
    const successfulRequests = allResults.filter(r => r.success).length;
    const failedRequests = allResults.filter(r => !r.success).length;
    const responseTimes = allResults.map(r => r.responseTime).sort((a, b) => a - b);

    const metrics = {
        totalRequests: allResults.length,
        successfulRequests,
        failedRequests,
        errorRate: (failedRequests / allResults.length) * 100,
        avgResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
        p95ResponseTime: responseTimes[Math.floor(responseTimes.length * 0.95)],
        p99ResponseTime: responseTimes[Math.floor(responseTimes.length * 0.99)],
        minResponseTime: Math.min(...responseTimes),
        maxResponseTime: Math.max(...responseTimes),
        throughput: allResults.length / ((lightLoadEnd - lightLoadStart) / 1000)
    };

    // 결과 출력
    console.log('\n📊 부하 테스트 결과:');
    console.log(`   총 요청: ${metrics.totalRequests}개`);
    console.log(`   성공: ${metrics.successfulRequests}개`);
    console.log(`   실패: ${metrics.failedRequests}개`);
    console.log(`   오류율: ${metrics.errorRate.toFixed(2)}%`);
    console.log(`   평균 응답 시간: ${metrics.avgResponseTime.toFixed(2)}ms`);
    console.log(`   P95 응답 시간: ${metrics.p95ResponseTime.toFixed(2)}ms`);
    console.log(`   P99 응답 시간: ${metrics.p99ResponseTime.toFixed(2)}ms`);
    console.log(`   최소 응답 시간: ${metrics.minResponseTime.toFixed(2)}ms`);
    console.log(`   최대 응답 시간: ${metrics.maxResponseTime.toFixed(2)}ms`);
    console.log(`   처리량: ${metrics.throughput.toFixed(2)} req/s`);

    // 성능 평가
    console.log('\n🎯 성능 평가:');
    const issues = [];

    if (metrics.errorRate > 5) {
        issues.push(`오류율이 5%를 초과합니다: ${metrics.errorRate.toFixed(2)}%`);
    }

    if (metrics.p95ResponseTime > 500) {
        issues.push(`P95 응답 시간이 500ms를 초과합니다: ${metrics.p95ResponseTime.toFixed(2)}ms`);
    }

    if (metrics.throughput < 10) {
        issues.push(`처리량이 10 req/s 미만입니다: ${metrics.throughput.toFixed(2)} req/s`);
    }

    if (issues.length === 0) {
        console.log('✅ 모든 성능 지표가 기준을 만족합니다.');
    } else {
        console.log('⚠️  발견된 성능 문제:');
        issues.forEach(issue => console.log(`   - ${issue}`));
    }

    // 보고서 생성
    const report = {
        timestamp: new Date().toISOString(),
        testType: 'Simple Load Test',
        duration: (lightLoadEnd - lightLoadStart) / 1000,
        metrics,
        issues,
        status: issues.length === 0 ? 'PASS' : 'FAIL'
    };

    // 보고서 저장
    const reportPath = path.join(__dirname, '..', 'reports', 'simple-load-test.json');
    const reportDir = path.dirname(reportPath);

    if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir, { recursive: true });
    }

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 상세 보고서 저장: ${reportPath}`);

    return report;
}

// 스크립트 실행
if (require.main === module) {
    runSimpleLoadTest().catch(console.error);
}

module.exports = { runSimpleLoadTest };
