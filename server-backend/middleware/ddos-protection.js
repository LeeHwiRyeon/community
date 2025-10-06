// DDoS Protection Middleware
const rateLimit = require('express-rate-limit');

// IP별 요청 추적
const ipRequestTracker = new Map();
const ipBlockList = new Set();

// DDoS 보호 설정
const ddosConfig = {
    // 기본 Rate Limiting
    windowMs: 15 * 60 * 1000, // 15분
    maxRequests: 100, // 최대 100 요청

    // DDoS 감지 임계값
    burstThreshold: 20, // 1초 내 20개 요청
    sustainedThreshold: 200, // 5분 내 200개 요청
    suspiciousThreshold: 50, // 1분 내 50개 요청

    // 차단 설정
    blockDurationMs: 30 * 60 * 1000, // 30분 차단
    suspiciousDurationMs: 5 * 60 * 1000, // 5분 의심 상태

    // 정리 간격
    cleanupIntervalMs: 60 * 1000, // 1분마다 정리

    // 로그 레벨
    logLevel: process.env.DDOS_LOG_LEVEL || 'warn'
};

// IP 요청 데이터 구조
class IPRequestData {
    constructor() {
        this.requests = [];
        this.blockedUntil = null;
        this.suspiciousUntil = null;
        this.firstRequest = Date.now();
        this.lastRequest = Date.now();
    }

    addRequest() {
        const now = Date.now();
        this.requests.push(now);
        this.lastRequest = now;

        // 오래된 요청 제거 (1시간 이상)
        this.requests = this.requests.filter(time => now - time < 60 * 60 * 1000);
    }

    isBlocked() {
        return this.blockedUntil && Date.now() < this.blockedUntil;
    }

    isSuspicious() {
        return this.suspiciousUntil && Date.now() < this.suspiciousUntil;
    }

    getRequestCount(windowMs) {
        const now = Date.now();
        return this.requests.filter(time => now - time < windowMs).length;
    }

    getBurstCount() {
        const now = Date.now();
        return this.requests.filter(time => now - time < 1000).length; // 1초 내
    }
}

// IP 데이터 가져오기 또는 생성
function getIPData(ip) {
    if (!ipRequestTracker.has(ip)) {
        ipRequestTracker.set(ip, new IPRequestData());
    }
    return ipRequestTracker.get(ip);
}

// DDoS 패턴 감지
function detectDDoSPattern(ipData) {
    const now = Date.now();
    const burstCount = ipData.getBurstCount();
    const sustainedCount = ipData.getRequestCount(5 * 60 * 1000); // 5분
    const suspiciousCount = ipData.getRequestCount(60 * 1000); // 1분

    // 버스트 공격 감지
    if (burstCount >= ddosConfig.burstThreshold) {
        return {
            type: 'BURST_ATTACK',
            severity: 'HIGH',
            count: burstCount,
            threshold: ddosConfig.burstThreshold
        };
    }

    // 지속적 공격 감지
    if (sustainedCount >= ddosConfig.sustainedThreshold) {
        return {
            type: 'SUSTAINED_ATTACK',
            severity: 'HIGH',
            count: sustainedCount,
            threshold: ddosConfig.sustainedThreshold
        };
    }

    // 의심스러운 활동 감지
    if (suspiciousCount >= ddosConfig.suspiciousThreshold) {
        return {
            type: 'SUSPICIOUS_ACTIVITY',
            severity: 'MEDIUM',
            count: suspiciousCount,
            threshold: ddosConfig.suspiciousThreshold
        };
    }

    return null;
}

// DDoS 보호 미들웨어
function ddosProtectionMiddleware(req, res, next) {
    const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() ||
        req.socket.remoteAddress ||
        req.ip ||
        'unknown';

    // 블랙리스트 확인
    if (ipBlockList.has(ip)) {
        logDDoSEvent('BLOCKED_DDOS', { ip, reason: 'blacklisted' });
        return res.status(429).json({
            error: 'Too many requests',
            code: 'DDOS_BLOCKED',
            retryAfter: Math.ceil(ddosConfig.blockDurationMs / 1000)
        });
    }

    const ipData = getIPData(ip);

    // 차단된 IP 확인
    if (ipData.isBlocked()) {
        logDDoSEvent('BLOCKED_DDOS', { ip, reason: 'temporary_block' });
        return res.status(429).json({
            error: 'Too many requests',
            code: 'DDOS_BLOCKED',
            retryAfter: Math.ceil((ipData.blockedUntil - Date.now()) / 1000)
        });
    }

    // 요청 추가
    ipData.addRequest();

    // DDoS 패턴 감지
    const attackPattern = detectDDoSPattern(ipData);

    if (attackPattern) {
        handleDDoSAttack(ip, ipData, attackPattern);

        if (attackPattern.severity === 'HIGH') {
            return res.status(429).json({
                error: 'Too many requests',
                code: 'DDOS_DETECTED',
                retryAfter: Math.ceil(ddosConfig.blockDurationMs / 1000)
            });
        } else if (attackPattern.severity === 'MEDIUM') {
            // 의심스러운 활동 - 경고만
            res.setHeader('X-DDoS-Warning', 'Suspicious activity detected');
        }
    }

    next();
}

// DDoS 공격 처리
function handleDDoSAttack(ip, ipData, attackPattern) {
    const now = Date.now();

    logDDoSEvent('DDOS_DETECTED', {
        ip,
        pattern: attackPattern,
        requestCount: ipData.requests.length,
        timeWindow: '5min'
    });

    if (attackPattern.severity === 'HIGH') {
        // 고위험 공격 - 즉시 차단
        ipData.blockedUntil = now + ddosConfig.blockDurationMs;
        ipBlockList.add(ip);

        // 30분 후 자동 해제
        setTimeout(() => {
            ipBlockList.delete(ip);
            ipData.blockedUntil = null;
            logDDoSEvent('DDOS_UNBLOCKED', { ip, reason: 'automatic' });
        }, ddosConfig.blockDurationMs);

    } else if (attackPattern.severity === 'MEDIUM') {
        // 중위험 공격 - 의심 상태로 설정
        ipData.suspiciousUntil = now + ddosConfig.suspiciousDurationMs;
    }
}

// DDoS 이벤트 로깅
function logDDoSEvent(event, details) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        event,
        details,
        severity: event.includes('BLOCKED') || event.includes('DDOS_DETECTED') ? 'HIGH' : 'MEDIUM'
    };

    if (ddosConfig.logLevel === 'debug' || ddosConfig.logLevel === 'info') {
        console.log(`[DDoS] ${JSON.stringify(logEntry)}`);
    }

    // 실제 환경에서는 보안 모니터링 시스템에 전송
    // 예: SIEM, 보안 로그 수집기 등
}

// 정기 정리 작업
setInterval(() => {
    const now = Date.now();
    const expiredIPs = [];

    for (const [ip, ipData] of ipRequestTracker.entries()) {
        // 1시간 이상 비활성 IP 제거
        if (now - ipData.lastRequest > 60 * 60 * 1000) {
            expiredIPs.push(ip);
        }
    }

    expiredIPs.forEach(ip => {
        ipRequestTracker.delete(ip);
        ipBlockList.delete(ip);
    });

    if (expiredIPs.length > 0 && ddosConfig.logLevel === 'debug') {
        console.log(`[DDoS] Cleaned up ${expiredIPs.length} inactive IPs`);
    }
}, ddosConfig.cleanupIntervalMs);

// 고급 Rate Limiting (IP별 동적 조정)
function createDynamicRateLimit() {
    return (req, res, next) => {
        const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() ||
            req.socket.remoteAddress ||
            req.ip ||
            'unknown';

        const ipData = getIPData(ip);

        // 의심스러운 IP는 더 엄격한 제한
        if (ipData.isSuspicious()) {
            const strictLimiter = rateLimit({
                windowMs: 5 * 60 * 1000, // 5분
                max: 20, // 최대 20 요청
                message: {
                    error: 'Rate limit exceeded',
                    code: 'RATE_LIMIT_EXCEEDED',
                    retryAfter: '5 minutes'
                }
            });
            return strictLimiter(req, res, next);
        }

        // 일반 Rate Limiting
        const normalLimiter = rateLimit({
            windowMs: ddosConfig.windowMs,
            max: ddosConfig.maxRequests,
            message: {
                error: 'Rate limit exceeded',
                code: 'RATE_LIMIT_EXCEEDED',
                retryAfter: '15 minutes'
            }
        });

        normalLimiter(req, res, next);
    };
}

// 통계 API
function getDDoSStats(req, res) {
    const now = Date.now();
    const stats = {
        totalTrackedIPs: ipRequestTracker.size,
        blockedIPs: Array.from(ipBlockList),
        suspiciousIPs: [],
        activeIPs: 0,
        config: ddosConfig
    };

    for (const [ip, ipData] of ipRequestTracker.entries()) {
        if (ipData.isSuspicious()) {
            stats.suspiciousIPs.push({
                ip,
                requestCount: ipData.requests.length,
                suspiciousUntil: ipData.suspiciousUntil
            });
        }

        if (now - ipData.lastRequest < 5 * 60 * 1000) { // 5분 내 활동
            stats.activeIPs++;
        }
    }

    res.json(stats);
}

module.exports = {
    ddosProtectionMiddleware,
    createDynamicRateLimit,
    getDDoSStats,
    ddosConfig
};
