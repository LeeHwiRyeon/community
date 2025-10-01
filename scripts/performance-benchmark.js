#!/usr/bin/env node

/**
 * 성능 벤치마크 테스트 스크립트
 * 커뮤니티 시스템의 성능을 측정하고 분석합니다.
 */

const http = require('http');
const https = require('https');
const { performance } = require('perf_hooks');
const fs = require('fs');
const path = require('path');

// 설정
const CONFIG = {
    baseUrl: 'http://localhost:50001',
    testDuration: 30000, // 30초
    concurrentUsers: 10,
    endpoints: [
        { path: '/api/health', method: 'GET', weight: 20 },
        { path: '/api/boards', method: 'GET', weight: 30 },
        { path: '/api/posts', method: 'GET', weight: 25 },
        { path: '/api/users', method: 'GET', weight: 15 },
        { path: '/api/analytics/overview', method: 'GET', weight: 10 }
    ],
    performanceThresholds: {
        responseTime: 200, // ms
        throughput: 100, // requests per second
        errorRate: 1 // percentage
    }
};

// 성능 메트릭 수집
class PerformanceMetrics {
    constructor() {
        this.results = [];
        this.startTime = null;
        this.endTime = null;
        this.totalRequests = 0;
        this.successfulRequests = 0;
        this.failedRequests = 0;
        this.responseTimes = [];
    }

    start() {
        this.startTime = performance.now();
    }

    stop() {
        this.endTime = performance.now();
    }

    recordRequest(responseTime, success, statusCode) {
        this.totalRequests++;
        this.responseTimes.push(responseTime);

        if (success) {
            this.successfulRequests++;
        } else {
            this.failedRequests++;
        }

        this.results.push({
            timestamp: Date.now(),
            responseTime,
            success,
            statusCode
        });
    }

    getMetrics() {
        const duration = (this.endTime - this.startTime) / 1000; // seconds
        const throughput = this.totalRequests / duration;
        const errorRate = (this.failedRequests / this.totalRequests) * 100;

        const sortedResponseTimes = this.responseTimes.sort((a, b) => a - b);
        const p50 = this.percentile(sortedResponseTimes, 50);
        const p95 = this.percentile(sortedResponseTimes, 95);
        const p99 = this.percentile(sortedResponseTimes, 99);
        const avgResponseTime = this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length;

        return {
            duration,
            totalRequests: this.totalRequests,
            successfulRequests: this.successfulRequests,
            failedRequests: this.failedRequests,
            throughput: Math.round(throughput * 100) / 100,
            errorRate: Math.round(errorRate * 100) / 100,
            responseTime: {
                average: Math.round(avgResponseTime * 100) / 100,
                p50: Math.round(p50 * 100) / 100,
                p95: Math.round(p95 * 100) / 100,
                p99: Math.round(p99 * 100) / 100,
                min: Math.min(...this.responseTimes),
                max: Math.max(...this.responseTimes)
            }
        };
    }

    percentile(sortedArray, percentile) {
        const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
        return sortedArray[index] || 0;
    }
}

// HTTP 요청 실행
async function makeRequest(url, method = 'GET') {
    return new Promise((resolve) => {
        const startTime = performance.now();
        const protocol = url.startsWith('https') ? https : http;

        const options = {
            method,
            timeout: 5000
        };

        const req = protocol.request(url, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const endTime = performance.now();
                const responseTime = endTime - startTime;
                const success = res.statusCode >= 200 && res.statusCode < 300;

                resolve({
                    responseTime,
                    success,
                    statusCode: res.statusCode,
                    data: data.substring(0, 100) // 첫 100자만 저장
                });
            });
        });

        req.on('error', () => {
            const endTime = performance.now();
            const responseTime = endTime - startTime;
            resolve({
                responseTime,
                success: false,
                statusCode: 0,
                data: 'Connection error'
            });
        });

        req.on('timeout', () => {
            const endTime = performance.now();
            const responseTime = endTime - startTime;
            resolve({
                responseTime,
                success: false,
                statusCode: 408,
                data: 'Request timeout'
            });
        });

        req.end();
    });
}

// 엔드포인트 선택 (가중치 기반)
function selectEndpoint() {
    const totalWeight = CONFIG.endpoints.reduce((sum, ep) => sum + ep.weight, 0);
    let random = Math.random() * totalWeight;

    for (const endpoint of CONFIG.endpoints) {
        random -= endpoint.weight;
        if (random <= 0) {
            return endpoint;
        }
    }

    return CONFIG.endpoints[0];
}

// 단일 사용자 시뮬레이션
async function simulateUser(metrics, duration) {
    const endTime = Date.now() + duration;

    while (Date.now() < endTime) {
        const endpoint = selectEndpoint();
        const url = `${CONFIG.baseUrl}${endpoint.path}`;

        const result = await makeRequest(url, endpoint.method);
        metrics.recordRequest(result.responseTime, result.success, result.statusCode);

        // 요청 간 간격 (100-500ms)
        const delay = Math.random() * 400 + 100;
        await new Promise(resolve => setTimeout(resolve, delay));
    }
}

// 메모리 사용량 측정
function getMemoryUsage() {
    const usage = process.memoryUsage();
    return {
        rss: Math.round(usage.rss / 1024 / 1024), // MB
        heapTotal: Math.round(usage.heapTotal / 1024 / 1024), // MB
        heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
        external: Math.round(usage.external / 1024 / 1024) // MB
    };
}

// CPU 사용률 측정 (간단한 방법)
function measureCPUUsage() {
    const startUsage = process.cpuUsage();
    const startTime = Date.now();

    return new Promise((resolve) => {
        setTimeout(() => {
            const endUsage = process.cpuUsage(startUsage);
            const endTime = Date.now();
            const duration = (endTime - startTime) * 1000; // microseconds

            const cpuPercent = ((endUsage.user + endUsage.system) / duration) * 100;
            resolve(Math.round(cpuPercent * 100) / 100);
        }, 1000);
    });
}

// 성능 보고서 생성
function generateReport(metrics, memoryUsage, cpuUsage) {
    const report = {
        timestamp: new Date().toISOString(),
        testConfig: CONFIG,
        systemInfo: {
            nodeVersion: process.version,
            platform: process.platform,
            arch: process.arch,
            memory: memoryUsage,
            cpu: cpuUsage
        },
        performance: metrics.getMetrics(),
        thresholds: CONFIG.performanceThresholds,
        status: 'UNKNOWN'
    };

    // 성능 상태 평가
    const perf = report.performance;
    const thresholds = CONFIG.performanceThresholds;

    let status = 'PASS';
    const issues = [];

    if (perf.responseTime.average > thresholds.responseTime) {
        status = 'FAIL';
        issues.push(`평균 응답 시간 초과: ${perf.responseTime.average}ms > ${thresholds.responseTime}ms`);
    }

    if (perf.throughput < thresholds.throughput) {
        status = 'FAIL';
        issues.push(`처리량 부족: ${perf.throughput} req/s < ${thresholds.throughput} req/s`);
    }

    if (perf.errorRate > thresholds.errorRate) {
        status = 'FAIL';
        issues.push(`오류율 초과: ${perf.errorRate}% > ${thresholds.errorRate}%`);
    }

    report.status = status;
    report.issues = issues;

    return report;
}

// 메인 실행 함수
async function runBenchmark() {
    console.log('🚀 성능 벤치마크 테스트 시작...\n');

    // 서버 연결 테스트
    console.log('📡 서버 연결 테스트 중...');
    const healthCheck = await makeRequest(`${CONFIG.baseUrl}/api/health`);

    if (!healthCheck.success) {
        console.log('❌ 서버 연결 실패. 서버가 실행 중인지 확인하세요.');
        console.log(`   URL: ${CONFIG.baseUrl}`);
        console.log(`   상태 코드: ${healthCheck.statusCode}`);
        return;
    }

    console.log('✅ 서버 연결 성공\n');

    // 메트릭 초기화
    const metrics = new PerformanceMetrics();
    metrics.start();

    // 메모리 사용량 측정 시작
    const initialMemory = getMemoryUsage();
    console.log(`💾 초기 메모리 사용량: ${JSON.stringify(initialMemory, null, 2)} MB\n`);

    // CPU 사용률 측정 시작
    console.log('⚡ CPU 사용률 측정 중...');
    const cpuUsage = await measureCPUUsage();
    console.log(`💻 CPU 사용률: ${cpuUsage}%\n`);

    // 동시 사용자 시뮬레이션
    console.log(`👥 ${CONFIG.concurrentUsers}명의 동시 사용자 시뮬레이션 시작...`);
    console.log(`⏱️  테스트 지속 시간: ${CONFIG.testDuration / 1000}초\n`);

    const userPromises = [];
    for (let i = 0; i < CONFIG.concurrentUsers; i++) {
        userPromises.push(simulateUser(metrics, CONFIG.testDuration));
    }

    // 진행 상황 표시
    const progressInterval = setInterval(() => {
        const elapsed = (Date.now() - (metrics.startTime + Date.now() - CONFIG.testDuration)) / 1000;
        const progress = Math.min((elapsed / (CONFIG.testDuration / 1000)) * 100, 100);
        process.stdout.write(`\r📊 진행률: ${Math.round(progress)}% (${metrics.totalRequests} 요청 완료)`);
    }, 1000);

    // 모든 사용자 시뮬레이션 완료 대기
    await Promise.all(userPromises);

    clearInterval(progressInterval);
    console.log('\n');

    // 테스트 완료
    metrics.stop();

    // 최종 메모리 사용량
    const finalMemory = getMemoryUsage();
    const memoryDiff = {
        rss: finalMemory.rss - initialMemory.rss,
        heapUsed: finalMemory.heapUsed - initialMemory.heapUsed
    };

    // 보고서 생성
    const report = generateReport(metrics, finalMemory, cpuUsage);

    // 결과 출력
    console.log('📊 성능 벤치마크 결과\n');
    console.log('=' * 50);

    const perf = report.performance;
    console.log(`📈 처리량: ${perf.throughput} req/s`);
    console.log(`⏱️  평균 응답 시간: ${perf.responseTime.average}ms`);
    console.log(`📊 응답 시간 분포:`);
    console.log(`   - P50: ${perf.responseTime.p50}ms`);
    console.log(`   - P95: ${perf.responseTime.p95}ms`);
    console.log(`   - P99: ${perf.responseTime.p99}ms`);
    console.log(`   - 최소: ${perf.responseTime.min}ms`);
    console.log(`   - 최대: ${perf.responseTime.max}ms`);
    console.log(`✅ 성공 요청: ${perf.successfulRequests}/${perf.totalRequests}`);
    console.log(`❌ 실패 요청: ${perf.failedRequests} (${perf.errorRate}%)`);
    console.log(`💾 메모리 사용량: ${finalMemory.heapUsed}MB (변화: ${memoryDiff.heapUsed > 0 ? '+' : ''}${memoryDiff.heapUsed}MB)`);
    console.log(`💻 CPU 사용률: ${cpuUsage}%`);

    console.log('\n🎯 성능 평가:');
    console.log(`상태: ${report.status === 'PASS' ? '✅ 통과' : '❌ 실패'}`);

    if (report.issues.length > 0) {
        console.log('\n⚠️  발견된 문제:');
        report.issues.forEach(issue => console.log(`   - ${issue}`));
    }

    // 보고서 저장
    const reportPath = path.join(__dirname, '..', 'reports', 'performance-benchmark.json');
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
    runBenchmark().catch(console.error);
}

module.exports = { runBenchmark, PerformanceMetrics };
