#!/usr/bin/env node

/**
 * 간단한 성능 테스트 스크립트
 * 서버 없이도 실행 가능한 기본 성능 측정
 */

const { performance } = require('perf_hooks');
const fs = require('fs');
const path = require('path');

// 성능 메트릭 클래스
class SimplePerformanceMetrics {
    constructor() {
        this.results = [];
        this.startTime = null;
        this.endTime = null;
    }

    start() {
        this.startTime = performance.now();
    }

    stop() {
        this.endTime = performance.now();
    }

    measureFunction(name, fn) {
        const start = performance.now();
        const result = fn();
        const end = performance.now();
        const duration = end - start;

        this.results.push({
            name,
            duration,
            result: typeof result === 'object' ? 'object' : result
        });

        return result;
    }

    measureAsync(name, asyncFn) {
        return new Promise(async (resolve) => {
            const start = performance.now();
            const result = await asyncFn();
            const end = performance.now();
            const duration = end - start;

            this.results.push({
                name,
                duration,
                result: typeof result === 'object' ? 'object' : result
            });

            resolve(result);
        });
    }

    getMetrics() {
        const totalDuration = this.endTime - this.startTime;
        const sortedDurations = this.results.map(r => r.duration).sort((a, b) => a - b);

        return {
            totalDuration: Math.round(totalDuration * 100) / 100,
            totalTests: this.results.length,
            averageDuration: Math.round((totalDuration / this.results.length) * 100) / 100,
            minDuration: Math.min(...sortedDurations),
            maxDuration: Math.max(...sortedDurations),
            p50: this.percentile(sortedDurations, 50),
            p95: this.percentile(sortedDurations, 95),
            p99: this.percentile(sortedDurations, 99),
            results: this.results
        };
    }

    percentile(sortedArray, percentile) {
        const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
        return sortedArray[index] || 0;
    }
}

// 테스트 함수들
function testStringOperations() {
    const strings = [];
    for (let i = 0; i < 10000; i++) {
        strings.push(`Test string ${i}`);
    }
    return strings.join(', ');
}

function testArrayOperations() {
    const arr = [];
    for (let i = 0; i < 10000; i++) {
        arr.push(i);
    }
    return arr.filter(x => x % 2 === 0).map(x => x * 2).reduce((a, b) => a + b, 0);
}

function testObjectOperations() {
    const obj = {};
    for (let i = 0; i < 10000; i++) {
        obj[`key${i}`] = `value${i}`;
    }
    return Object.keys(obj).length;
}

function testMathOperations() {
    let result = 0;
    for (let i = 0; i < 100000; i++) {
        result += Math.sqrt(i) * Math.sin(i) + Math.cos(i);
    }
    return result;
}

function testJSONOperations() {
    const data = {
        users: [],
        posts: [],
        comments: []
    };

    for (let i = 0; i < 1000; i++) {
        data.users.push({
            id: i,
            name: `User ${i}`,
            email: `user${i}@example.com`,
            createdAt: new Date().toISOString()
        });
    }

    const jsonString = JSON.stringify(data);
    const parsed = JSON.parse(jsonString);
    return parsed.users.length;
}

function testRegexOperations() {
    const text = 'The quick brown fox jumps over the lazy dog. '.repeat(1000);
    const patterns = [
        /the/gi,
        /quick/gi,
        /brown/gi,
        /fox/gi,
        /jumps/gi
    ];

    let matches = 0;
    patterns.forEach(pattern => {
        matches += (text.match(pattern) || []).length;
    });

    return matches;
}

function testFileOperations() {
    const tempFile = path.join(__dirname, '..', 'temp-performance-test.txt');
    const content = 'Performance test data\n'.repeat(1000);

    try {
        fs.writeFileSync(tempFile, content);
        const readContent = fs.readFileSync(tempFile, 'utf8');
        fs.unlinkSync(tempFile);
        return readContent.length;
    } catch (error) {
        return 0;
    }
}

async function testAsyncOperations() {
    const promises = [];
    for (let i = 0; i < 100; i++) {
        promises.push(new Promise(resolve => {
            setTimeout(() => resolve(i), Math.random() * 10);
        }));
    }

    const results = await Promise.all(promises);
    return results.reduce((a, b) => a + b, 0);
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

// CPU 사용률 측정
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

// 메인 테스트 실행
async function runPerformanceTest() {
    console.log('🚀 간단한 성능 테스트 시작...\n');

    const metrics = new SimplePerformanceMetrics();
    metrics.start();

    // 초기 메모리 사용량
    const initialMemory = getMemoryUsage();
    console.log(`💾 초기 메모리 사용량: ${JSON.stringify(initialMemory, null, 2)} MB\n`);

    // CPU 사용률 측정
    console.log('⚡ CPU 사용률 측정 중...');
    const cpuUsage = await measureCPUUsage();
    console.log(`💻 CPU 사용률: ${cpuUsage}%\n`);

    // 동기 함수 테스트
    console.log('🔄 동기 함수 성능 테스트...');
    metrics.measureFunction('String Operations', testStringOperations);
    metrics.measureFunction('Array Operations', testArrayOperations);
    metrics.measureFunction('Object Operations', testObjectOperations);
    metrics.measureFunction('Math Operations', testMathOperations);
    metrics.measureFunction('JSON Operations', testJSONOperations);
    metrics.measureFunction('Regex Operations', testRegexOperations);
    metrics.measureFunction('File Operations', testFileOperations);

    // 비동기 함수 테스트
    console.log('🔄 비동기 함수 성능 테스트...');
    await metrics.measureAsync('Async Operations', testAsyncOperations);

    // 테스트 완료
    metrics.stop();

    // 최종 메모리 사용량
    const finalMemory = getMemoryUsage();
    const memoryDiff = {
        rss: finalMemory.rss - initialMemory.rss,
        heapUsed: finalMemory.heapUsed - initialMemory.heapUsed
    };

    // 결과 출력
    console.log('\n📊 성능 테스트 결과\n');
    console.log('='.repeat(50));

    const perf = metrics.getMetrics();
    console.log(`⏱️  총 실행 시간: ${perf.totalDuration}ms`);
    console.log(`🧪 총 테스트 수: ${perf.totalTests}개`);
    console.log(`📊 평균 실행 시간: ${perf.averageDuration}ms`);
    console.log(`⚡ 최소 실행 시간: ${perf.minDuration}ms`);
    console.log(`🐌 최대 실행 시간: ${perf.maxDuration}ms`);
    console.log(`📈 P50: ${perf.p50}ms`);
    console.log(`📈 P95: ${perf.p95}ms`);
    console.log(`📈 P99: ${perf.p99}ms`);
    console.log(`💾 최종 메모리 사용량: ${finalMemory.heapUsed}MB (변화: ${memoryDiff.heapUsed > 0 ? '+' : ''}${memoryDiff.heapUsed}MB)`);
    console.log(`💻 CPU 사용률: ${cpuUsage}%`);

    console.log('\n📋 개별 테스트 결과:');
    perf.results.forEach(result => {
        console.log(`   ${result.name}: ${result.duration}ms`);
    });

    // 성능 평가
    console.log('\n🎯 성능 평가:');
    const slowTests = perf.results.filter(r => r.duration > 100);
    if (slowTests.length === 0) {
        console.log('✅ 모든 테스트가 100ms 이내에 완료되었습니다.');
    } else {
        console.log(`⚠️  ${slowTests.length}개의 테스트가 100ms를 초과했습니다:`);
        slowTests.forEach(test => {
            console.log(`   - ${test.name}: ${test.duration}ms`);
        });
    }

    // 보고서 생성
    const report = {
        timestamp: new Date().toISOString(),
        systemInfo: {
            nodeVersion: process.version,
            platform: process.platform,
            arch: process.arch,
            memory: finalMemory,
            cpu: cpuUsage
        },
        performance: perf,
        memoryDiff: memoryDiff
    };

    // 보고서 저장
    const reportPath = path.join(__dirname, '..', 'reports', 'simple-performance-test.json');
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
    runPerformanceTest().catch(console.error);
}

module.exports = { runPerformanceTest, SimplePerformanceMetrics };
