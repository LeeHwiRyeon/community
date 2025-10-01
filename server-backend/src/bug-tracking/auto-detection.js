/**
 * 자동 버그 감지 시스템
 * 
 * 이 모듈은 로그 분석, 성능 모니터링, 에러 패턴 감지를 통해
 * 버그를 자동으로 감지하고 보고하는 시스템입니다.
 */

import { createBug } from './bug-tracker.js';
import fs from 'fs';
import path from 'path';

// 에러 패턴 정의
const ERROR_PATTERNS = [
    {
        pattern: /500 Internal Server Error/,
        severity: 'High',
        category: 'Backend',
        title: '서버 내부 오류 발생',
        description: '500 Internal Server Error가 감지되었습니다.'
    },
    {
        pattern: /Database connection failed/,
        severity: 'Critical',
        category: 'Database',
        title: '데이터베이스 연결 실패',
        description: '데이터베이스 연결에 실패했습니다.'
    },
    {
        pattern: /Memory leak detected/,
        severity: 'High',
        category: 'Performance',
        title: '메모리 누수 감지',
        description: '메모리 누수가 감지되었습니다.'
    },
    {
        pattern: /SQL injection attempt/,
        severity: 'Critical',
        category: 'Security',
        title: 'SQL 인젝션 시도 감지',
        description: 'SQL 인젝션 공격이 감지되었습니다.'
    },
    {
        pattern: /Rate limit exceeded/,
        severity: 'Medium',
        category: 'Backend',
        title: '요청 제한 초과',
        description: 'API 요청 제한을 초과했습니다.'
    },
    {
        pattern: /Authentication failed/,
        severity: 'Medium',
        category: 'Security',
        title: '인증 실패',
        description: '사용자 인증에 실패했습니다.'
    },
    {
        pattern: /File upload failed/,
        severity: 'Medium',
        category: 'Backend',
        title: '파일 업로드 실패',
        description: '파일 업로드 중 오류가 발생했습니다.'
    },
    {
        pattern: /Redis connection failed/,
        severity: 'High',
        category: 'Infrastructure',
        title: 'Redis 연결 실패',
        description: 'Redis 서버 연결에 실패했습니다.'
    },
    {
        pattern: /Out of memory/,
        severity: 'Critical',
        category: 'Performance',
        title: '메모리 부족',
        description: '시스템 메모리가 부족합니다.'
    },
    {
        pattern: /Timeout error/,
        severity: 'Medium',
        category: 'Performance',
        title: '타임아웃 오류',
        description: '요청 처리 시간이 초과되었습니다.'
    }
];

// 성능 임계값 정의
const PERFORMANCE_THRESHOLDS = {
    memory: {
        warning: 400 * 1024 * 1024, // 400MB
        critical: 500 * 1024 * 1024  // 500MB
    },
    cpu: {
        warning: 0.7,  // 70%
        critical: 0.8  // 80%
    },
    responseTime: {
        warning: 2000, // 2초
        critical: 5000 // 5초
    }
};

// 중복 버그 감지용 캐시
const duplicateCache = new Map();
const CACHE_TTL = 300000; // 5분

/**
 * 로그 파일 모니터링 시작
 */
export function startLogMonitoring() {
    const logFiles = [
        'logs/error.log',
        'logs/app.log',
        'logs/access.log'
    ];

    logFiles.forEach(logFile => {
        if (fs.existsSync(logFile)) {
            monitorLogFile(logFile);
        }
    });

    console.log('✅ 로그 모니터링이 시작되었습니다.');
}

/**
 * 개별 로그 파일 모니터링
 */
function monitorLogFile(logPath) {
    let lastSize = 0;

    try {
        if (fs.existsSync(logPath)) {
            lastSize = fs.statSync(logPath).size;
        }
    } catch (error) {
        console.error(`로그 파일 크기 확인 실패: ${logPath}`, error);
        return;
    }

    // 파일 변경 감지
    fs.watchFile(logPath, { interval: 1000 }, (curr, prev) => {
        if (curr.mtime > prev.mtime && curr.size > lastSize) {
            const newContent = readNewLogContent(logPath, lastSize, curr.size);
            lastSize = curr.size;

            if (newContent) {
                analyzeLogContent(newContent, logPath);
            }
        }
    });
}

/**
 * 새로운 로그 내용 읽기
 */
function readNewLogContent(logPath, startSize, endSize) {
    try {
        const fd = fs.openSync(logPath, 'r');
        const buffer = Buffer.alloc(endSize - startSize);
        fs.readSync(fd, buffer, 0, buffer.length, startSize);
        fs.closeSync(fd);

        return buffer.toString('utf8');
    } catch (error) {
        console.error('새 로그 내용 읽기 실패:', error);
        return null;
    }
}

/**
 * 로그 내용 분석
 */
function analyzeLogContent(content, logPath) {
    const lines = content.split('\n').filter(line => line.trim());

    lines.forEach(line => {
        ERROR_PATTERNS.forEach(({ pattern, severity, category, title, description }) => {
            if (pattern.test(line)) {
                const bugData = {
                    title: `${title} (자동 감지)`,
                    description: `${description}\n\n로그 내용:\n${line}`,
                    severity,
                    category,
                    environment: 'production',
                    source: 'auto-detection',
                    log_file: logPath,
                    log_line: line
                };

                // 중복 확인
                if (!isDuplicateBug(bugData)) {
                    createAutoBug(bugData);
                }
            }
        });
    });
}

/**
 * 성능 모니터링 시작
 */
export function startPerformanceMonitoring() {
    // 메모리 사용량 모니터링
    setInterval(monitorMemoryUsage, 60000); // 1분마다

    // CPU 사용량 모니터링
    setInterval(monitorCpuUsage, 60000); // 1분마다

    // 응답 시간 모니터링
    setInterval(monitorResponseTime, 30000); // 30초마다

    console.log('✅ 성능 모니터링이 시작되었습니다.');
}

/**
 * 메모리 사용량 모니터링
 */
function monitorMemoryUsage() {
    const usage = process.memoryUsage();
    const rss = usage.rss;

    if (rss > PERFORMANCE_THRESHOLDS.memory.critical) {
        createAutoBug({
            title: '메모리 사용량 위험 수준 (자동 감지)',
            description: `현재 메모리 사용량: ${Math.round(rss / 1024 / 1024)}MB\n임계값: ${Math.round(PERFORMANCE_THRESHOLDS.memory.critical / 1024 / 1024)}MB`,
            severity: 'Critical',
            category: 'Performance',
            environment: 'production',
            source: 'performance-monitoring',
            memory_usage: rss,
            threshold: PERFORMANCE_THRESHOLDS.memory.critical
        });
    } else if (rss > PERFORMANCE_THRESHOLDS.memory.warning) {
        createAutoBug({
            title: '메모리 사용량 경고 수준 (자동 감지)',
            description: `현재 메모리 사용량: ${Math.round(rss / 1024 / 1024)}MB\n경고 임계값: ${Math.round(PERFORMANCE_THRESHOLDS.memory.warning / 1024 / 1024)}MB`,
            severity: 'High',
            category: 'Performance',
            environment: 'production',
            source: 'performance-monitoring',
            memory_usage: rss,
            threshold: PERFORMANCE_THRESHOLDS.memory.warning
        });
    }
}

/**
 * CPU 사용량 모니터링
 */
function monitorCpuUsage() {
    const usage = process.cpuUsage();
    const totalCpu = (usage.user + usage.system) / 1000000; // 초 단위

    if (totalCpu > PERFORMANCE_THRESHOLDS.cpu.critical) {
        createAutoBug({
            title: 'CPU 사용량 위험 수준 (자동 감지)',
            description: `현재 CPU 사용량: ${(totalCpu * 100).toFixed(1)}%\n임계값: ${(PERFORMANCE_THRESHOLDS.cpu.critical * 100).toFixed(1)}%`,
            severity: 'Critical',
            category: 'Performance',
            environment: 'production',
            source: 'performance-monitoring',
            cpu_usage: totalCpu,
            threshold: PERFORMANCE_THRESHOLDS.cpu.critical
        });
    } else if (totalCpu > PERFORMANCE_THRESHOLDS.cpu.warning) {
        createAutoBug({
            title: 'CPU 사용량 경고 수준 (자동 감지)',
            description: `현재 CPU 사용량: ${(totalCpu * 100).toFixed(1)}%\n경고 임계값: ${(PERFORMANCE_THRESHOLDS.cpu.warning * 100).toFixed(1)}%`,
            severity: 'High',
            category: 'Performance',
            environment: 'production',
            source: 'performance-monitoring',
            cpu_usage: totalCpu,
            threshold: PERFORMANCE_THRESHOLDS.cpu.warning
        });
    }
}

/**
 * 응답 시간 모니터링
 */
function monitorResponseTime() {
    // 실제 API 엔드포인트 테스트
    testApiEndpoints();
}

/**
 * API 엔드포인트 테스트
 */
async function testApiEndpoints() {
    const endpoints = [
        '/api/health',
        '/api/posts',
        '/api/boards',
        '/api/search?q=test'
    ];

    for (const endpoint of endpoints) {
        try {
            const startTime = Date.now();
            const response = await fetch(`http://localhost:50000${endpoint}`);
            const responseTime = Date.now() - startTime;

            if (responseTime > PERFORMANCE_THRESHOLDS.responseTime.critical) {
                createAutoBug({
                    title: `API 응답 시간 위험 수준 (자동 감지)`,
                    description: `엔드포인트: ${endpoint}\n응답 시간: ${responseTime}ms\n임계값: ${PERFORMANCE_THRESHOLDS.responseTime.critical}ms`,
                    severity: 'Critical',
                    category: 'Performance',
                    environment: 'production',
                    source: 'performance-monitoring',
                    endpoint,
                    response_time: responseTime,
                    threshold: PERFORMANCE_THRESHOLDS.responseTime.critical
                });
            } else if (responseTime > PERFORMANCE_THRESHOLDS.responseTime.warning) {
                createAutoBug({
                    title: `API 응답 시간 경고 수준 (자동 감지)`,
                    description: `엔드포인트: ${endpoint}\n응답 시간: ${responseTime}ms\n경고 임계값: ${PERFORMANCE_THRESHOLDS.responseTime.warning}ms`,
                    severity: 'High',
                    category: 'Performance',
                    environment: 'production',
                    source: 'performance-monitoring',
                    endpoint,
                    response_time: responseTime,
                    threshold: PERFORMANCE_THRESHOLDS.responseTime.warning
                });
            }
        } catch (error) {
            createAutoBug({
                title: `API 엔드포인트 오류 (자동 감지)`,
                description: `엔드포인트: ${endpoint}\n오류: ${error.message}`,
                severity: 'High',
                category: 'Backend',
                environment: 'production',
                source: 'performance-monitoring',
                endpoint,
                error: error.message
            });
        }
    }
}

/**
 * 자동 버그 생성
 */
async function createAutoBug(bugData) {
    try {
        const result = await createBug(bugData, 1); // 시스템 사용자 ID

        console.log(`🐛 자동 감지된 버그 생성됨: ${result.id} - ${result.title}`);

        // 중복 캐시에 추가
        addToDuplicateCache(bugData);

        return result;
    } catch (error) {
        console.error('자동 버그 생성 실패:', error);
    }
}

/**
 * 중복 버그 확인
 */
function isDuplicateBug(bugData) {
    const key = generateBugKey(bugData);
    const cached = duplicateCache.get(key);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return true;
    }

    return false;
}

/**
 * 중복 캐시에 추가
 */
function addToDuplicateCache(bugData) {
    const key = generateBugKey(bugData);
    duplicateCache.set(key, {
        timestamp: Date.now(),
        bugData
    });

    // 캐시 크기 제한
    if (duplicateCache.size > 1000) {
        const firstKey = duplicateCache.keys().next().value;
        duplicateCache.delete(firstKey);
    }
}

/**
 * 버그 키 생성 (중복 확인용)
 */
function generateBugKey(bugData) {
    const keyData = {
        title: bugData.title,
        severity: bugData.severity,
        category: bugData.category,
        source: bugData.source
    };

    return JSON.stringify(keyData);
}

/**
 * 에러 패턴 추가
 */
export function addErrorPattern(pattern) {
    ERROR_PATTERNS.push(pattern);
}

/**
 * 성능 임계값 업데이트
 */
export function updatePerformanceThresholds(thresholds) {
    Object.assign(PERFORMANCE_THRESHOLDS, thresholds);
}

/**
 * 모니터링 상태 조회
 */
export function getMonitoringStatus() {
    return {
        logMonitoring: true,
        performanceMonitoring: true,
        errorPatterns: ERROR_PATTERNS.length,
        performanceThresholds: PERFORMANCE_THRESHOLDS,
        duplicateCacheSize: duplicateCache.size
    };
}

/**
 * 중복 캐시 초기화
 */
export function clearDuplicateCache() {
    duplicateCache.clear();
}

/**
 * 모든 모니터링 시작
 */
export function startAllMonitoring() {
    startLogMonitoring();
    startPerformanceMonitoring();
    console.log('🚀 모든 자동 감지 시스템이 시작되었습니다.');
}

export default {
    startLogMonitoring,
    startPerformanceMonitoring,
    startAllMonitoring,
    addErrorPattern,
    updatePerformanceThresholds,
    getMonitoringStatus,
    clearDuplicateCache
};

