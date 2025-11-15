#!/usr/bin/env node
/**
 * 환경변수 검증 스크립트
 * 프로덕션 배포 전 필수 환경변수 및 보안 설정 검증
 * 
 * @version 1.0.0
 * @date 2025-11-09
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ANSI 색상 코드
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
};

// 검증 결과
const results = {
    passed: [],
    warnings: [],
    errors: [],
    critical: []
};

/**
 * 로깅 유틸리티
 */
const log = {
    title: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}`),
    success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
    warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
    error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
    critical: (msg) => console.log(`${colors.bright}${colors.red}✗ [CRITICAL]${colors.reset} ${msg}`),
    info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
};

/**
 * 환경변수 필수 항목 정의
 */
const REQUIRED_VARS = {
    // 애플리케이션 설정
    NODE_ENV: {
        required: true,
        validValues: ['development', 'production', 'test'],
        description: '실행 환경'
    },
    PORT: {
        required: true,
        type: 'number',
        min: 1,
        max: 65535,
        description: '서버 포트'
    },

    // JWT 보안
    JWT_SECRET: {
        required: true,
        minLength: 64,
        type: 'hex',
        description: 'JWT 서명 시크릿 (256-bit 이상)',
        critical: true
    },
    JWT_EXPIRES_IN: {
        required: true,
        pattern: /^\d+[smhd]$/,
        description: 'Access Token 만료 시간'
    },
    REFRESH_TOKEN_EXPIRES_IN: {
        required: true,
        pattern: /^\d+[smhd]$/,
        description: 'Refresh Token 만료 시간'
    },

    // 세션 보안
    SESSION_SECRET: {
        required: true,
        minLength: 64,
        type: 'hex',
        description: '세션 서명 시크릿 (256-bit 이상)',
        critical: true
    },

    // 데이터베이스
    DB_HOST: {
        required: true,
        description: 'MySQL 호스트'
    },
    DB_PORT: {
        required: true,
        type: 'number',
        description: 'MySQL 포트'
    },
    DB_NAME: {
        required: true,
        description: '데이터베이스 이름'
    },
    DB_USER: {
        required: true,
        description: '데이터베이스 사용자'
    },
    DB_PASSWORD: {
        required: true,
        minLength: 12,
        description: '데이터베이스 비밀번호',
        critical: true
    },

    // Redis
    REDIS_URL: {
        required: true,
        pattern: /^redis(s)?:\/\/.+/,
        description: 'Redis 연결 URL'
    },

    // CORS
    CORS_ORIGIN: {
        required: true,
        description: '허용할 프론트엔드 URL'
    }
};

/**
 * 환경변수 값 검증
 */
function validateEnvVar(name, config, value) {
    const prefix = config.critical ? 'critical' : 'errors';

    // 필수 변수 존재 확인
    if (config.required && !value) {
        results[prefix].push(`${name}: 필수 환경변수가 설정되지 않았습니다.`);
        return false;
    }

    if (!value) return true; // 선택적 변수이고 값이 없으면 통과

    // 타입 검증
    if (config.type === 'number') {
        const num = parseInt(value);
        if (isNaN(num)) {
            results.errors.push(`${name}: 숫자 형식이 아닙니다. (입력값: ${value})`);
            return false;
        }
        if (config.min !== undefined && num < config.min) {
            results.errors.push(`${name}: 최소값 ${config.min}보다 작습니다. (입력값: ${num})`);
            return false;
        }
        if (config.max !== undefined && num > config.max) {
            results.errors.push(`${name}: 최대값 ${config.max}보다 큽니다. (입력값: ${num})`);
            return false;
        }
    }

    // 길이 검증
    if (config.minLength && value.length < config.minLength) {
        results[prefix].push(
            `${name}: 최소 길이 ${config.minLength}자 이상이어야 합니다. (현재: ${value.length}자)`
        );
        return false;
    }

    // Hex 형식 검증
    if (config.type === 'hex' && !/^[0-9a-f]+$/i.test(value)) {
        results[prefix].push(`${name}: Hex 형식이 아닙니다.`);
        return false;
    }

    // 패턴 검증
    if (config.pattern && !config.pattern.test(value)) {
        results.errors.push(
            `${name}: 올바른 형식이 아닙니다. (예: ${config.pattern.source})`
        );
        return false;
    }

    // 유효한 값 검증
    if (config.validValues && !config.validValues.includes(value)) {
        results.errors.push(
            `${name}: 유효하지 않은 값입니다. (허용: ${config.validValues.join(', ')})`
        );
        return false;
    }

    // 엔트로피 검증 (시크릿용)
    if (config.type === 'hex' && config.minLength >= 64) {
        const entropy = calculateEntropy(value);
        if (entropy < 4.5) {
            results.warnings.push(
                `${name}: 엔트로피가 낮습니다 (${entropy.toFixed(2)}/8.0). 더 무작위적인 값을 사용하세요.`
            );
        }
    }

    results.passed.push(`${name}: ✓`);
    return true;
}

/**
 * 엔트로피 계산 (Shannon Entropy)
 */
function calculateEntropy(str) {
    const freq = {};
    for (const char of str) {
        freq[char] = (freq[char] || 0) + 1;
    }

    let entropy = 0;
    const len = str.length;
    for (const count of Object.values(freq)) {
        const p = count / len;
        entropy -= p * Math.log2(p);
    }

    return entropy;
}

/**
 * HTTPS 설정 검증 (프로덕션)
 */
function validateHttpsConfig() {
    if (process.env.NODE_ENV !== 'production') {
        return;
    }

    log.title('🔒 HTTPS 설정 검증');

    // CORS_ORIGIN이 HTTPS인지 확인
    const corsOrigin = process.env.CORS_ORIGIN;
    if (corsOrigin && !corsOrigin.startsWith('https://') && corsOrigin !== 'http://localhost:3000') {
        results.errors.push('CORS_ORIGIN: 프로덕션에서는 HTTPS를 사용해야 합니다.');
        log.error('CORS_ORIGIN이 HTTPS가 아닙니다.');
    } else {
        log.success('CORS_ORIGIN이 HTTPS를 사용합니다.');
    }

    // Redis URL이 rediss:// (TLS)인지 확인
    const redisUrl = process.env.REDIS_URL;
    if (redisUrl && redisUrl.startsWith('redis://') && !redisUrl.includes('localhost')) {
        results.warnings.push('REDIS_URL: 프로덕션에서는 TLS(rediss://)를 사용하는 것이 권장됩니다.');
        log.warning('Redis TLS를 사용하지 않습니다.');
    } else {
        log.success('Redis 연결이 안전합니다.');
    }
}

/**
 * 데이터베이스 연결 테스트
 */
async function testDatabaseConnection() {
    log.title('🗄️  데이터베이스 연결 테스트');

    try {
        const mysql = await import('mysql2/promise');
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
        });

        await connection.execute('SELECT 1');
        await connection.end();

        log.success('데이터베이스 연결 성공');
        results.passed.push('Database connection: ✓');
    } catch (error) {
        log.error(`데이터베이스 연결 실패: ${error.message}`);
        results.errors.push(`Database connection: ${error.message}`);
    }
}

/**
 * Redis 연결 테스트
 */
async function testRedisConnection() {
    log.title('📦 Redis 연결 테스트');

    try {
        const redis = await import('redis');
        const client = redis.createClient({
            url: process.env.REDIS_URL,
        });

        await client.connect();
        await client.ping();
        await client.disconnect();

        log.success('Redis 연결 성공');
        results.passed.push('Redis connection: ✓');
    } catch (error) {
        log.error(`Redis 연결 실패: ${error.message}`);
        results.errors.push(`Redis connection: ${error.message}`);
    }
}

/**
 * 보안 헤더 검증
 */
function validateSecurityHeaders() {
    log.title('🛡️  보안 설정 검증');

    // JWT 알고리즘 확인
    const jwtAlgorithm = process.env.JWT_ALGORITHM || 'HS256';
    if (jwtAlgorithm === 'HS256') {
        results.warnings.push('JWT_ALGORITHM: RS256 사용을 권장합니다 (공개키 기반).');
        log.warning('JWT_ALGORITHM이 HS256입니다. RS256 권장.');
    } else {
        log.success(`JWT 알고리즘: ${jwtAlgorithm}`);
    }

    // 토큰 만료 시간 확인
    const accessTokenExpiry = process.env.JWT_EXPIRES_IN || '15m';
    const refreshTokenExpiry = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

    if (parseInt(accessTokenExpiry) > 3600) {
        results.warnings.push('JWT_EXPIRES_IN: Access Token 만료 시간이 너무 깁니다 (권장: 15m).');
        log.warning('Access Token 만료 시간이 너무 깁니다.');
    } else {
        log.success(`Access Token 만료: ${accessTokenExpiry}`);
    }

    log.success(`Refresh Token 만료: ${refreshTokenExpiry}`);
}

/**
 * 파일 권한 검증
 */
function validateFilePermissions() {
    log.title('📁 파일 권한 검증');

    const envFile = path.join(__dirname, '../../.env');

    try {
        if (fs.existsSync(envFile)) {
            const stats = fs.statSync(envFile);
            const mode = (stats.mode & parseInt('777', 8)).toString(8);

            if (mode !== '600') {
                results.warnings.push(`.env 파일 권한이 ${mode}입니다. 600으로 변경하세요: chmod 600 .env`);
                log.warning(`.env 파일 권한: ${mode} (권장: 600)`);
            } else {
                log.success('.env 파일 권한이 올바릅니다 (600).');
            }
        } else {
            log.info('.env 파일이 없습니다 (환경변수가 다른 방식으로 주입될 수 있습니다).');
        }
    } catch (error) {
        log.warning(`파일 권한 확인 실패: ${error.message}`);
    }
}

/**
 * 최종 결과 출력
 */
function printResults() {
    log.title('📊 검증 결과 요약');

    console.log(`\n${colors.bright}통과:${colors.reset} ${colors.green}${results.passed.length}${colors.reset}`);
    console.log(`${colors.bright}경고:${colors.reset} ${colors.yellow}${results.warnings.length}${colors.reset}`);
    console.log(`${colors.bright}오류:${colors.reset} ${colors.red}${results.errors.length}${colors.reset}`);
    console.log(`${colors.bright}치명적:${colors.reset} ${colors.bright}${colors.red}${results.critical.length}${colors.reset}\n`);

    if (results.critical.length > 0) {
        log.title('❌ 치명적 오류');
        results.critical.forEach(msg => log.critical(msg));
    }

    if (results.errors.length > 0) {
        log.title('⚠️  오류');
        results.errors.forEach(msg => log.error(msg));
    }

    if (results.warnings.length > 0) {
        log.title('💡 경고');
        results.warnings.forEach(msg => log.warning(msg));
    }

    // 종료 코드 결정
    if (results.critical.length > 0 || results.errors.length > 0) {
        console.log(`\n${colors.bright}${colors.red}❌ 검증 실패${colors.reset}`);
        console.log(`${colors.red}배포 전 위 문제들을 해결해주세요.${colors.reset}\n`);
        process.exit(1);
    } else if (results.warnings.length > 0) {
        console.log(`\n${colors.bright}${colors.yellow}⚠️  경고 있음${colors.reset}`);
        console.log(`${colors.yellow}경고를 확인하고 필요시 수정해주세요.${colors.reset}\n`);
        process.exit(0);
    } else {
        console.log(`\n${colors.bright}${colors.green}✅ 모든 검증 통과!${colors.reset}`);
        console.log(`${colors.green}배포를 진행할 수 있습니다.${colors.reset}\n`);
        process.exit(0);
    }
}

/**
 * 메인 검증 프로세스
 */
async function main() {
    console.log(`
${colors.bright}${colors.cyan}╔═══════════════════════════════════════════════════════╗
║         🔍 환경변수 검증 스크립트 v1.0.0            ║
╚═══════════════════════════════════════════════════════╝${colors.reset}
  `);

    log.info(`NODE_ENV: ${process.env.NODE_ENV || '(설정 안됨)'}`);
    log.info(`검증 시작 시간: ${new Date().toISOString()}\n`);

    // 1. 환경변수 검증
    log.title('🔧 환경변수 검증');
    for (const [name, config] of Object.entries(REQUIRED_VARS)) {
        const value = process.env[name];
        validateEnvVar(name, config, value);
    }

    // 2. HTTPS 설정 검증
    validateHttpsConfig();

    // 3. 보안 설정 검증
    validateSecurityHeaders();

    // 4. 파일 권한 검증
    validateFilePermissions();

    // 5. 데이터베이스 연결 테스트
    await testDatabaseConnection();

    // 6. Redis 연결 테스트
    await testRedisConnection();

    // 7. 최종 결과 출력
    printResults();
}

// 스크립트 실행
main().catch(error => {
    log.critical(`예기치 않은 오류: ${error.message}`);
    console.error(error);
    process.exit(1);
});
