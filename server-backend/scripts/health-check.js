#!/usr/bin/env node
/**
 * 프로덕션 헬스체크 스크립트
 * 배포 후 시스템 상태 검증
 * 
 * @version 1.0.0
 * @date 2025-11-09
 */

import axios from 'axios';
import mysql from 'mysql2/promise';
import redis from 'redis';

// ANSI 색상 코드
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
};

const log = {
    title: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}`),
    success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
    warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
    error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
    info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
};

const results = {
    passed: 0,
    failed: 0,
    warnings: 0,
    details: []
};

/**
 * HTTP 엔드포인트 헬스체크
 */
async function checkHttpEndpoint(url, name, expectedStatus = 200) {
    try {
        const startTime = Date.now();
        const response = await axios.get(url, {
            timeout: 10000,
            validateStatus: () => true // 모든 상태 코드 허용
        });
        const responseTime = Date.now() - startTime;

        if (response.status === expectedStatus) {
            log.success(`${name}: ${response.status} (${responseTime}ms)`);
            results.passed++;
            results.details.push({
                check: name,
                status: 'passed',
                responseTime,
                statusCode: response.status
            });
            return true;
        } else {
            log.error(`${name}: 예상 ${expectedStatus}, 실제 ${response.status}`);
            results.failed++;
            results.details.push({
                check: name,
                status: 'failed',
                responseTime,
                statusCode: response.status,
                expected: expectedStatus
            });
            return false;
        }
    } catch (error) {
        log.error(`${name}: ${error.message}`);
        results.failed++;
        results.details.push({
            check: name,
            status: 'failed',
            error: error.message
        });
        return false;
    }
}

/**
 * 데이터베이스 헬스체크
 */
async function checkDatabase() {
    let connection;
    try {
        const startTime = Date.now();
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
        });

        // 간단한 쿼리 실행
        await connection.execute('SELECT 1');

        // 커넥션 수 확인
        const [rows] = await connection.execute('SHOW STATUS LIKE "Threads_connected"');
        const connections = parseInt(rows[0].Value);

        const responseTime = Date.now() - startTime;

        log.success(`Database: 연결 성공 (${responseTime}ms, ${connections} connections)`);
        results.passed++;
        results.details.push({
            check: 'Database',
            status: 'passed',
            responseTime,
            connections
        });

        return true;
    } catch (error) {
        log.error(`Database: ${error.message}`);
        results.failed++;
        results.details.push({
            check: 'Database',
            status: 'failed',
            error: error.message
        });
        return false;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

/**
 * Redis 헬스체크
 */
async function checkRedis() {
    let client;
    try {
        const startTime = Date.now();
        client = redis.createClient({
            url: process.env.REDIS_URL,
        });

        await client.connect();
        await client.ping();

        // Redis 정보 조회
        const info = await client.info('stats');
        const connections = info.match(/connected_clients:(\d+)/)?.[1] || 'unknown';

        const responseTime = Date.now() - startTime;

        log.success(`Redis: 연결 성공 (${responseTime}ms, ${connections} clients)`);
        results.passed++;
        results.details.push({
            check: 'Redis',
            status: 'passed',
            responseTime,
            clients: connections
        });

        return true;
    } catch (error) {
        log.error(`Redis: ${error.message}`);
        results.failed++;
        results.details.push({
            check: 'Redis',
            status: 'failed',
            error: error.message
        });
        return false;
    } finally {
        if (client) {
            await client.disconnect();
        }
    }
}

/**
 * API 엔드포인트 체크
 */
async function checkApiEndpoints(baseUrl) {
    log.title('🔌 API 엔드포인트 체크');

    const endpoints = [
        { path: '/health', name: 'Health Check', expectedStatus: 200 },
        { path: '/api/auth/csrf-token', name: 'CSRF Token', expectedStatus: 200 },
        { path: '/api/performance/health', name: 'Performance Health', expectedStatus: 200 },
        { path: '/api/users', name: 'Users List (should be 401)', expectedStatus: 401 },
    ];

    for (const endpoint of endpoints) {
        await checkHttpEndpoint(`${baseUrl}${endpoint.path}`, endpoint.name, endpoint.expectedStatus);
    }
}

/**
 * 보안 헤더 체크
 */
async function checkSecurityHeaders(baseUrl) {
    log.title('🛡️  보안 헤더 체크');

    try {
        const response = await axios.get(`${baseUrl}/health`, {
            timeout: 5000,
            validateStatus: () => true
        });

        const securityHeaders = {
            'x-content-type-options': 'nosniff',
            'x-frame-options': 'DENY',
            'x-xss-protection': '1; mode=block',
            'strict-transport-security': 'max-age=31536000',
        };

        for (const [header, expectedValue] of Object.entries(securityHeaders)) {
            const actualValue = response.headers[header];

            if (actualValue) {
                if (actualValue.toLowerCase().includes(expectedValue.toLowerCase())) {
                    log.success(`${header}: ${actualValue}`);
                    results.passed++;
                } else {
                    log.warning(`${header}: ${actualValue} (예상: ${expectedValue})`);
                    results.warnings++;
                }
            } else {
                log.warning(`${header}: 설정되지 않음`);
                results.warnings++;
            }
        }
    } catch (error) {
        log.error(`보안 헤더 체크 실패: ${error.message}`);
        results.failed++;
    }
}

/**
 * 성능 메트릭 체크
 */
async function checkPerformanceMetrics(baseUrl) {
    log.title('📊 성능 메트릭 체크');

    try {
        const response = await axios.get(`${baseUrl}/api/performance/stats`, {
            timeout: 5000,
            headers: {
                'Authorization': `Bearer ${process.env.ADMIN_TOKEN || ''}` // Admin 토큰 필요
            },
            validateStatus: () => true
        });

        if (response.status === 401) {
            log.warning('성능 메트릭: 인증 필요 (ADMIN_TOKEN 설정 필요)');
            results.warnings++;
            return;
        }

        if (response.status === 200 && response.data) {
            const stats = response.data;

            log.success(`총 요청 수: ${stats.totalRequests || 0}`);
            log.success(`평균 응답 시간: ${stats.averageResponseTime || 0}ms`);
            log.success(`활성 연결 수: ${stats.activeConnections || 0}`);

            // 응답 시간 경고
            if (stats.averageResponseTime > 1000) {
                log.warning('평균 응답 시간이 1초를 초과합니다.');
                results.warnings++;
            }

            results.passed++;
        }
    } catch (error) {
        log.warning(`성능 메트릭 체크 실패: ${error.message}`);
        results.warnings++;
    }
}

/**
 * SSL/TLS 체크 (프로덕션)
 */
async function checkSSL(baseUrl) {
    if (!baseUrl.startsWith('https://')) {
        log.warning('HTTPS가 아닙니다. 프로덕션에서는 HTTPS를 사용해야 합니다.');
        results.warnings++;
        return;
    }

    log.title('🔒 SSL/TLS 체크');

    try {
        const response = await axios.get(baseUrl, {
            timeout: 5000,
            validateStatus: () => true
        });

        log.success('HTTPS 연결 성공');
        results.passed++;
    } catch (error) {
        if (error.code === 'CERT_HAS_EXPIRED') {
            log.error('SSL 인증서가 만료되었습니다!');
            results.failed++;
        } else if (error.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE') {
            log.error('SSL 인증서 검증 실패!');
            results.failed++;
        } else {
            log.warning(`SSL 체크 경고: ${error.message}`);
            results.warnings++;
        }
    }
}

/**
 * 최종 결과 출력
 */
function printSummary() {
    log.title('📋 헬스체크 요약');

    const total = results.passed + results.failed + results.warnings;
    const successRate = total > 0 ? ((results.passed / total) * 100).toFixed(1) : 0;

    console.log(`\n${colors.bright}통과:${colors.reset} ${colors.green}${results.passed}${colors.reset}`);
    console.log(`${colors.bright}실패:${colors.reset} ${colors.red}${results.failed}${colors.reset}`);
    console.log(`${colors.bright}경고:${colors.reset} ${colors.yellow}${results.warnings}${colors.reset}`);
    console.log(`${colors.bright}성공률:${colors.reset} ${successRate}%\n`);

    if (results.failed > 0) {
        console.log(`${colors.bright}${colors.red}❌ 헬스체크 실패${colors.reset}`);
        console.log(`${colors.red}시스템이 정상 작동하지 않습니다. 로그를 확인하세요.${colors.reset}\n`);
        process.exit(1);
    } else if (results.warnings > 0) {
        console.log(`${colors.bright}${colors.yellow}⚠️  경고 있음${colors.reset}`);
        console.log(`${colors.yellow}일부 항목에 문제가 있을 수 있습니다.${colors.reset}\n`);
        process.exit(0);
    } else {
        console.log(`${colors.bright}${colors.green}✅ 모든 헬스체크 통과!${colors.reset}`);
        console.log(`${colors.green}시스템이 정상 작동 중입니다.${colors.reset}\n`);
        process.exit(0);
    }
}

/**
 * 메인 함수
 */
async function main() {
    console.log(`
${colors.bright}${colors.cyan}╔═══════════════════════════════════════════════════════╗
║         🏥 프로덕션 헬스체크 v1.0.0                  ║
╚═══════════════════════════════════════════════════════╝${colors.reset}
  `);

    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 50000}`;
    log.info(`Target: ${baseUrl}`);
    log.info(`Time: ${new Date().toISOString()}\n`);

    // 1. 데이터베이스 체크
    log.title('🗄️  데이터베이스 체크');
    await checkDatabase();

    // 2. Redis 체크
    log.title('📦 Redis 체크');
    await checkRedis();

    // 3. API 엔드포인트 체크
    await checkApiEndpoints(baseUrl);

    // 4. 보안 헤더 체크
    await checkSecurityHeaders(baseUrl);

    // 5. SSL/TLS 체크 (프로덕션)
    if (process.env.NODE_ENV === 'production') {
        await checkSSL(baseUrl);
    }

    // 6. 성능 메트릭 체크
    await checkPerformanceMetrics(baseUrl);

    // 7. 최종 결과
    printSummary();
}

// 스크립트 실행
main().catch(error => {
    log.error(`예기치 않은 오류: ${error.message}`);
    console.error(error);
    process.exit(1);
});
