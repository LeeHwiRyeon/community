// Web Application Firewall (WAF) Middleware
const rateLimit = require('express-rate-limit');

// 공격 패턴 데이터베이스
const attackPatterns = {
    // SQL 인젝션 패턴
    sqlInjection: [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
        /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi,
        /(\b(OR|AND)\s+['"]\s*=\s*['"])/gi,
        /(\bUNION\s+SELECT\b)/gi,
        /(\bDROP\s+TABLE\b)/gi,
        /(\bINSERT\s+INTO\b)/gi,
        /(\bDELETE\s+FROM\b)/gi,
        /(\bUPDATE\s+.*\s+SET\b)/gi,
        /(\bCREATE\s+TABLE\b)/gi,
        /(\bALTER\s+TABLE\b)/gi,
        /(\bEXEC\s+\w+)/gi,
        /(\bUNION\s+ALL\s+SELECT\b)/gi,
        /(\bOR\s+1\s*=\s*1)/gi,
        /(\bAND\s+1\s*=\s*1)/gi
    ],

    // XSS 공격 패턴
    xss: [
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi,
        /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
        /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
        /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
        /<link\b[^<]*(?:(?!<\/link>)<[^<]*)*<\/link>/gi,
        /<meta\b[^<]*(?:(?!<\/meta>)<[^<]*)*<\/meta>/gi,
        /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi,
        /<link\s+rel\s*=\s*["']stylesheet["']/gi,
        /<script[^>]*>[\s\S]*?<\/script>/gi,
        /onload\s*=/gi,
        /onerror\s*=/gi,
        /onclick\s*=/gi,
        /onmouseover\s*=/gi
    ],

    // 경로 탐색 공격 패턴
    pathTraversal: [
        /\.\.\//g,
        /\.\.\\/g,
        /\.\.%2f/gi,
        /\.\.%5c/gi,
        /\.\.%252f/gi,
        /\.\.%255c/gi,
        /\.\.%c0%af/gi,
        /\.\.%c1%9c/gi,
        /\.\.%c0%2f/gi,
        /\.\.%c1%af/gi
    ],

    // 명령 인젝션 패턴
    commandInjection: [
        /;\s*(rm|del|mkdir|copy|move|dir|ls|cat|type|echo|ping|nslookup|tracert|netstat|tasklist|ps|kill|chmod|chown)\b/gi,
        /\|\s*(rm|del|mkdir|copy|move|dir|ls|cat|type|echo|ping|nslookup|tracert|netstat|tasklist|ps|kill|chmod|chown)\b/gi,
        /&&\s*(rm|del|mkdir|copy|move|dir|ls|cat|type|echo|ping|nslookup|tracert|netstat|tasklist|ps|kill|chmod|chown)\b/gi,
        /`[^`]*`/g,
        /\$\([^)]*\)/g
    ],

    // NoSQL 인젝션 패턴
    nosqlInjection: [
        /\$where/gi,
        /\$ne/gi,
        /\$gt/gi,
        /\$lt/gi,
        /\$regex/gi,
        /\$exists/gi,
        /\$in/gi,
        /\$nin/gi,
        /\$or/gi,
        /\$and/gi,
        /\$not/gi,
        /\$nor/gi,
        /\$all/gi,
        /\$elemMatch/gi
    ]
};

// IP 블랙리스트 (메모리 기반)
const blacklistedIPs = new Set();
const suspiciousIPs = new Map(); // IP -> { count, firstSeen, lastSeen }

// WAF 설정
const wafConfig = {
    maxSuspiciousAttempts: 5,
    suspiciousWindowMs: 15 * 60 * 1000, // 15분
    blacklistDurationMs: 60 * 60 * 1000, // 1시간
    logLevel: process.env.WAF_LOG_LEVEL || 'warn'
};

// 공격 패턴 감지 함수
function detectAttackPattern(input, patternType) {
    if (!attackPatterns[patternType]) return false;

    for (const pattern of attackPatterns[patternType]) {
        if (pattern.test(input)) {
            return {
                detected: true,
                pattern: pattern.toString(),
                type: patternType
            };
        }
    }
    return { detected: false };
}

// 입력 검사 함수
function scanInput(obj, path = '') {
    const results = [];

    if (typeof obj === 'string') {
        for (const patternType of Object.keys(attackPatterns)) {
            const result = detectAttackPattern(obj, patternType);
            if (result.detected) {
                results.push({
                    ...result,
                    path: path,
                    value: obj.substring(0, 100) // 처음 100자만 로그
                });
            }
        }
    } else if (typeof obj === 'object' && obj !== null) {
        for (const key in obj) {
            const newPath = path ? `${path}.${key}` : key;
            results.push(...scanInput(obj[key], newPath));
        }
    }

    return results;
}

// IP 위험도 평가
function evaluateIPRisk(ip) {
    const now = Date.now();
    const ipData = suspiciousIPs.get(ip);

    if (!ipData) {
        suspiciousIPs.set(ip, {
            count: 1,
            firstSeen: now,
            lastSeen: now
        });
        return 'low';
    }

    // 시간 윈도우 내에서의 시도 횟수 확인
    if (now - ipData.firstSeen > wafConfig.suspiciousWindowMs) {
        // 윈도우 초기화
        suspiciousIPs.set(ip, {
            count: 1,
            firstSeen: now,
            lastSeen: now
        });
        return 'low';
    }

    ipData.count++;
    ipData.lastSeen = now;

    if (ipData.count >= wafConfig.maxSuspiciousAttempts) {
        blacklistedIPs.add(ip);
        return 'blacklisted';
    } else if (ipData.count >= 3) {
        return 'high';
    } else if (ipData.count >= 2) {
        return 'medium';
    }

    return 'low';
}

// WAF 미들웨어
function wafMiddleware(req, res, next) {
    const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() ||
        req.socket.remoteAddress ||
        req.ip ||
        'unknown';

    // 블랙리스트 확인
    if (blacklistedIPs.has(ip)) {
        logSecurityEvent('BLOCKED_BLACKLIST', { ip, path: req.path });
        return res.status(403).json({
            error: 'Access denied',
            code: 'BLACKLISTED_IP',
            retryAfter: Math.ceil(wafConfig.blacklistDurationMs / 1000)
        });
    }

    // 입력 스캔
    const scanResults = [
        ...scanInput(req.body, 'body'),
        ...scanInput(req.query, 'query'),
        ...scanInput(req.params, 'params')
    ];

    if (scanResults.length > 0) {
        // 공격 패턴 감지됨
        const riskLevel = evaluateIPRisk(ip);

        logSecurityEvent('ATTACK_DETECTED', {
            ip,
            path: req.path,
            method: req.method,
            patterns: scanResults,
            riskLevel
        });

        if (riskLevel === 'blacklisted') {
            return res.status(403).json({
                error: 'Access denied',
                code: 'BLACKLISTED_IP',
                retryAfter: Math.ceil(wafConfig.blacklistDurationMs / 1000)
            });
        }

        return res.status(400).json({
            error: 'Malicious input detected',
            code: 'MALICIOUS_INPUT',
            details: scanResults.map(r => ({
                type: r.type,
                path: r.path
            }))
        });
    }

    next();
}

// 보안 이벤트 로깅
function logSecurityEvent(event, details) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        event,
        details,
        severity: event.includes('BLOCKED') ? 'HIGH' : 'MEDIUM'
    };

    if (wafConfig.logLevel === 'debug' || wafConfig.logLevel === 'info') {
        console.log(`[WAF] ${JSON.stringify(logEntry)}`);
    }

    // 실제 환경에서는 보안 로그 저장소에 저장
    // 예: Elasticsearch, Splunk, 또는 전용 보안 로그 시스템
}

// IP 블랙리스트 정리 (정기적으로 실행)
setInterval(() => {
    const now = Date.now();
    const expiredIPs = [];

    for (const ip of blacklistedIPs) {
        // 1시간 후 자동 해제 (실제로는 더 정교한 로직 필요)
        if (now - Date.now() > wafConfig.blacklistDurationMs) {
            expiredIPs.push(ip);
        }
    }

    expiredIPs.forEach(ip => blacklistedIPs.delete(ip));

    if (expiredIPs.length > 0) {
        console.log(`[WAF] Unblocked ${expiredIPs.length} IPs`);
    }
}, 5 * 60 * 1000); // 5분마다 실행

// 관리자용 API (실제 환경에서는 인증 필요)
function getWAFStats(req, res) {
    res.json({
        blacklistedIPs: Array.from(blacklistedIPs),
        suspiciousIPs: Object.fromEntries(suspiciousIPs),
        config: wafConfig
    });
}

module.exports = {
    wafMiddleware,
    getWAFStats,
    attackPatterns,
    wafConfig
};
