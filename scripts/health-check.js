#!/usr/bin/env node

/**
 * Community Platform 2.0 헬스 체크 스크립트
 * 사용법: node scripts/health-check.js [environment] [port]
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');

// 색상 정의
const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
};

// 로그 함수
const log = (message, color = 'blue') => {
    const timestamp = new Date().toISOString();
    console.log(`${colors[color]}[${timestamp}]${colors.reset} ${message}`);
};

const success = (message) => log(`✅ ${message}`, 'green');
const warning = (message) => log(`⚠️ ${message}`, 'yellow');
const error = (message) => log(`❌ ${message}`, 'red');

// 환경 변수
const environment = process.argv[2] || 'dev';
const port = process.argv[3] || (environment === 'prod' ? 3000 : 3001);
const baseUrl = `http://localhost:${port}`;

// 헬스 체크 결과
const healthCheckResults = {
    overall: 'unknown',
    checks: [],
    timestamp: new Date().toISOString(),
    environment,
    port
};

// HTTP 요청 헬퍼
function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const client = urlObj.protocol === 'https:' ? https : http;

        const req = client.request(url, {
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Health-Check-Script',
                ...options.headers
            },
            timeout: options.timeout || 5000
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve({
                        statusCode: res.statusCode,
                        data: jsonData,
                        headers: res.headers
                    });
                } catch (e) {
                    resolve({
                        statusCode: res.statusCode,
                        data: data,
                        headers: res.headers
                    });
                }
            });
        });

        req.on('error', reject);
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });

        if (options.body) {
            req.write(JSON.stringify(options.body));
        }

        req.end();
    });
}

// 개별 헬스 체크 함수들
async function checkBasicHealth() {
    try {
        const response = await makeRequest(`${baseUrl}/api/health`);

        if (response.statusCode === 200) {
            success('기본 헬스 체크 통과');
            healthCheckResults.checks.push({
                name: 'basic_health',
                status: 'pass',
                responseTime: Date.now(),
                details: response.data
            });
            return true;
        } else {
            error(`기본 헬스 체크 실패: ${response.statusCode}`);
            healthCheckResults.checks.push({
                name: 'basic_health',
                status: 'fail',
                statusCode: response.statusCode,
                details: response.data
            });
            return false;
        }
    } catch (err) {
        error(`기본 헬스 체크 오류: ${err.message}`);
        healthCheckResults.checks.push({
            name: 'basic_health',
            status: 'error',
            error: err.message
        });
        return false;
    }
}

async function checkDatabase() {
    try {
        const response = await makeRequest(`${baseUrl}/api/health/database`);

        if (response.statusCode === 200 && response.data.success) {
            success('데이터베이스 연결 확인');
            healthCheckResults.checks.push({
                name: 'database',
                status: 'pass',
                details: response.data
            });
            return true;
        } else {
            error('데이터베이스 연결 실패');
            healthCheckResults.checks.push({
                name: 'database',
                status: 'fail',
                details: response.data
            });
            return false;
        }
    } catch (err) {
        error(`데이터베이스 체크 오류: ${err.message}`);
        healthCheckResults.checks.push({
            name: 'database',
            status: 'error',
            error: err.message
        });
        return false;
    }
}

async function checkRedis() {
    try {
        const response = await makeRequest(`${baseUrl}/api/health/redis`);

        if (response.statusCode === 200 && response.data.success) {
            success('Redis 연결 확인');
            healthCheckResults.checks.push({
                name: 'redis',
                status: 'pass',
                details: response.data
            });
            return true;
        } else {
            error('Redis 연결 실패');
            healthCheckResults.checks.push({
                name: 'redis',
                status: 'fail',
                details: response.data
            });
            return false;
        }
    } catch (err) {
        error(`Redis 체크 오류: ${err.message}`);
        healthCheckResults.checks.push({
            name: 'redis',
            status: 'error',
            error: err.message
        });
        return false;
    }
}

async function checkAPIEndpoints() {
    const endpoints = [
        { path: '/api/posts', method: 'GET', name: 'Posts API' },
        { path: '/api/users', method: 'GET', name: 'Users API' },
        { path: '/api/communities', method: 'GET', name: 'Communities API' }
    ];

    let passedChecks = 0;

    for (const endpoint of endpoints) {
        try {
            const response = await makeRequest(`${baseUrl}${endpoint.path}`, {
                method: endpoint.method
            });

            if (response.statusCode < 500) {
                success(`${endpoint.name} 응답 확인`);
                healthCheckResults.checks.push({
                    name: `api_${endpoint.path.replace(/\//g, '_')}`,
                    status: 'pass',
                    statusCode: response.statusCode
                });
                passedChecks++;
            } else {
                error(`${endpoint.name} 서버 오류: ${response.statusCode}`);
                healthCheckResults.checks.push({
                    name: `api_${endpoint.path.replace(/\//g, '_')}`,
                    status: 'fail',
                    statusCode: response.statusCode
                });
            }
        } catch (err) {
            error(`${endpoint.name} 체크 오류: ${err.message}`);
            healthCheckResults.checks.push({
                name: `api_${endpoint.path.replace(/\//g, '_')}`,
                status: 'error',
                error: err.message
            });
        }
    }

    return passedChecks === endpoints.length;
}

async function checkPerformance() {
    try {
        const startTime = Date.now();
        const response = await makeRequest(`${baseUrl}/api/health/performance`);
        const responseTime = Date.now() - startTime;

        if (response.statusCode === 200 && response.data.success) {
            const performanceData = response.data.data;

            // 성능 임계값 체크
            const checks = [
                { name: 'response_time', value: responseTime, threshold: 1000, unit: 'ms' },
                { name: 'memory_usage', value: performanceData.memoryUsage, threshold: 80, unit: '%' },
                { name: 'cpu_usage', value: performanceData.cpuUsage, threshold: 80, unit: '%' }
            ];

            let allPassed = true;

            checks.forEach(check => {
                if (check.value <= check.threshold) {
                    success(`${check.name}: ${check.value}${check.unit} (임계값: ${check.threshold}${check.unit})`);
                } else {
                    warning(`${check.name}: ${check.value}${check.unit} (임계값 초과: ${check.threshold}${check.unit})`);
                    allPassed = false;
                }
            });

            healthCheckResults.checks.push({
                name: 'performance',
                status: allPassed ? 'pass' : 'warning',
                responseTime,
                details: performanceData
            });

            return allPassed;
        } else {
            error('성능 체크 실패');
            healthCheckResults.checks.push({
                name: 'performance',
                status: 'fail',
                details: response.data
            });
            return false;
        }
    } catch (err) {
        error(`성능 체크 오류: ${err.message}`);
        healthCheckResults.checks.push({
            name: 'performance',
            status: 'error',
            error: err.message
        });
        return false;
    }
}

// 메인 헬스 체크 실행
async function runHealthCheck() {
    log(`🏥 Community Platform 2.0 헬스 체크 시작`);
    log(`환경: ${environment}`);
    log(`포트: ${port}`);
    log(`URL: ${baseUrl}`);

    const startTime = Date.now();

    // 각 체크 실행
    const checks = [
        { name: '기본 헬스', fn: checkBasicHealth },
        { name: '데이터베이스', fn: checkDatabase },
        { name: 'Redis', fn: checkRedis },
        { name: 'API 엔드포인트', fn: checkAPIEndpoints },
        { name: '성능', fn: checkPerformance }
    ];

    let passedChecks = 0;

    for (const check of checks) {
        log(`\n📋 ${check.name} 체크 중...`);
        try {
            const result = await check.fn();
            if (result) {
                passedChecks++;
            }
        } catch (err) {
            error(`${check.name} 체크 중 오류 발생: ${err.message}`);
        }
    }

    const totalTime = Date.now() - startTime;
    const passRate = (passedChecks / checks.length) * 100;

    // 전체 결과 결정
    if (passRate === 100) {
        healthCheckResults.overall = 'healthy';
        success(`\n🎉 모든 헬스 체크 통과! (${passedChecks}/${checks.length})`);
    } else if (passRate >= 80) {
        healthCheckResults.overall = 'warning';
        warning(`\n⚠️ 일부 헬스 체크 실패 (${passedChecks}/${checks.length})`);
    } else {
        healthCheckResults.overall = 'unhealthy';
        error(`\n❌ 헬스 체크 실패 (${passedChecks}/${checks.length})`);
    }

    // 결과 요약
    log(`\n📊 헬스 체크 결과 요약:`);
    log(`전체 상태: ${healthCheckResults.overall}`);
    log(`통과율: ${passRate.toFixed(1)}%`);
    log(`소요 시간: ${totalTime}ms`);

    // 상세 결과 출력
    log(`\n📋 상세 결과:`);
    healthCheckResults.checks.forEach(check => {
        const status = check.status === 'pass' ? '✅' :
            check.status === 'warning' ? '⚠️' : '❌';
        log(`${status} ${check.name}: ${check.status}`);
    });

    // 결과 파일 저장
    const fs = require('fs');
    const resultFile = `health-check-${environment}-${Date.now()}.json`;
    fs.writeFileSync(resultFile, JSON.stringify(healthCheckResults, null, 2));
    log(`\n📄 결과가 ${resultFile}에 저장되었습니다.`);

    // 종료 코드 설정
    process.exit(healthCheckResults.overall === 'healthy' ? 0 : 1);
}

// 스크립트 실행
if (require.main === module) {
    runHealthCheck().catch(err => {
        error(`헬스 체크 실행 중 오류 발생: ${err.message}`);
        process.exit(1);
    });
}

module.exports = {
    runHealthCheck,
    healthCheckResults
};
