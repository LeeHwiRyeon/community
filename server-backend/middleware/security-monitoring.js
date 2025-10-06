// Security Monitoring and Alerting System
const EventEmitter = require('events');

// 보안 이벤트 타입
const SecurityEventTypes = {
    // 인증 관련
    LOGIN_SUCCESS: 'LOGIN_SUCCESS',
    LOGIN_FAILURE: 'LOGIN_FAILURE',
    LOGOUT: 'LOGOUT',
    PASSWORD_CHANGE: 'PASSWORD_CHANGE',
    ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',

    // 공격 관련
    SQL_INJECTION_ATTEMPT: 'SQL_INJECTION_ATTEMPT',
    XSS_ATTEMPT: 'XSS_ATTEMPT',
    PATH_TRAVERSAL_ATTEMPT: 'PATH_TRAVERSAL_ATTEMPT',
    COMMAND_INJECTION_ATTEMPT: 'COMMAND_INJECTION_ATTEMPT',
    DDOS_ATTACK: 'DDOS_ATTACK',
    BRUTE_FORCE_ATTACK: 'BRUTE_FORCE_ATTACK',

    // 시스템 관련
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    SUSPICIOUS_ACTIVITY: 'SUSPICIOUS_ACTIVITY',
    UNAUTHORIZED_ACCESS: 'UNAUTHORIZED_ACCESS',
    PRIVILEGE_ESCALATION: 'PRIVILEGE_ESCALATION',

    // 데이터 관련
    DATA_BREACH: 'DATA_BREACH',
    SENSITIVE_DATA_ACCESS: 'SENSITIVE_DATA_ACCESS',
    DATA_EXPORT: 'DATA_EXPORT',
    DATA_DELETION: 'DATA_DELETION'
};

// 보안 이벤트 심각도
const SecuritySeverity = {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
    CRITICAL: 'CRITICAL'
};

// 보안 모니터링 설정
const monitoringConfig = {
    // 알림 임계값
    thresholds: {
        loginFailures: 5, // 5회 실패 시 알림
        suspiciousIPs: 3, // 3개 IP에서 의심스러운 활동
        ddosRequests: 100, // 1분 내 100개 요청
        rateLimitExceeded: 10 // 10회 초과 시 알림
    },

    // 시간 윈도우
    timeWindows: {
        loginFailure: 15 * 60 * 1000, // 15분
        suspiciousActivity: 5 * 60 * 1000, // 5분
        ddosDetection: 60 * 1000, // 1분
        rateLimit: 60 * 1000 // 1분
    },

    // 알림 설정
    notifications: {
        enabled: true,
        channels: ['console', 'webhook'], // console, webhook, email, slack
        webhookUrl: process.env.SECURITY_WEBHOOK_URL,
        emailRecipients: process.env.SECURITY_EMAIL_RECIPIENTS?.split(',') || [],
        slackWebhook: process.env.SLACK_WEBHOOK_URL
    },

    // 로그 설정
    logging: {
        enabled: true,
        level: process.env.SECURITY_LOG_LEVEL || 'info',
        retentionDays: 30
    }
};

// 보안 이벤트 추적
const eventTracker = {
    loginFailures: new Map(), // IP -> { count, firstAttempt, lastAttempt }
    suspiciousIPs: new Map(), // IP -> { count, events, firstSeen }
    rateLimitViolations: new Map(), // IP -> { count, firstViolation }
    ddosAttacks: new Map() // IP -> { count, firstAttack }
};

// 보안 모니터링 클래스
class SecurityMonitor extends EventEmitter {
    constructor() {
        super();
        this.events = [];
        this.alerts = [];
        this.metrics = {
            totalEvents: 0,
            eventsByType: {},
            eventsBySeverity: {},
            blockedIPs: new Set(),
            suspiciousIPs: new Set()
        };
    }

    // 보안 이벤트 기록
    recordEvent(eventType, details, severity = SecuritySeverity.MEDIUM) {
        const event = {
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            type: eventType,
            severity,
            details,
            ip: details.ip || 'unknown',
            userAgent: details.userAgent || 'unknown',
            path: details.path || 'unknown',
            method: details.method || 'unknown'
        };

        this.events.push(event);
        this.metrics.totalEvents++;

        // 메트릭 업데이트
        this.metrics.eventsByType[eventType] = (this.metrics.eventsByType[eventType] || 0) + 1;
        this.metrics.eventsBySeverity[severity] = (this.metrics.eventsBySeverity[severity] || 0) + 1;

        // 로깅
        this.logEvent(event);

        // 패턴 분석
        this.analyzePatterns(event);

        // 알림 발송
        if (this.shouldSendAlert(event)) {
            this.sendAlert(event);
        }

        // 이벤트 발생
        this.emit('securityEvent', event);

        return event;
    }

    // 패턴 분석
    analyzePatterns(event) {
        const ip = event.details.ip;
        if (!ip || ip === 'unknown') return;

        switch (event.type) {
            case SecurityEventTypes.LOGIN_FAILURE:
                this.trackLoginFailure(ip, event);
                break;
            case SecurityEventTypes.SUSPICIOUS_ACTIVITY:
                this.trackSuspiciousActivity(ip, event);
                break;
            case SecurityEventTypes.RATE_LIMIT_EXCEEDED:
                this.trackRateLimitViolation(ip, event);
                break;
            case SecurityEventTypes.DDOS_ATTACK:
                this.trackDDoSAttack(ip, event);
                break;
        }
    }

    // 로그인 실패 추적
    trackLoginFailure(ip, event) {
        const now = Date.now();
        const data = eventTracker.loginFailures.get(ip) || { count: 0, firstAttempt: now, lastAttempt: now };

        data.count++;
        data.lastAttempt = now;

        eventTracker.loginFailures.set(ip, data);

        // 임계값 초과 시 알림
        if (data.count >= monitoringConfig.thresholds.loginFailures) {
            this.recordEvent(SecurityEventTypes.BRUTE_FORCE_ATTACK, {
                ip,
                failureCount: data.count,
                timeWindow: now - data.firstAttempt
            }, SecuritySeverity.HIGH);
        }
    }

    // 의심스러운 활동 추적
    trackSuspiciousActivity(ip, event) {
        const now = Date.now();
        const data = eventTracker.suspiciousIPs.get(ip) || { count: 0, events: [], firstSeen: now };

        data.count++;
        data.events.push(event);
        data.firstSeen = data.firstSeen || now;

        eventTracker.suspiciousIPs.set(ip, data);
        this.metrics.suspiciousIPs.add(ip);

        // 임계값 초과 시 알림
        if (data.count >= monitoringConfig.thresholds.suspiciousIPs) {
            this.recordEvent(SecurityEventTypes.SUSPICIOUS_ACTIVITY, {
                ip,
                activityCount: data.count,
                events: data.events.slice(-5) // 최근 5개 이벤트
            }, SecuritySeverity.MEDIUM);
        }
    }

    // Rate Limit 위반 추적
    trackRateLimitViolation(ip, event) {
        const now = Date.now();
        const data = eventTracker.rateLimitViolations.get(ip) || { count: 0, firstViolation: now };

        data.count++;
        eventTracker.rateLimitViolations.set(ip, data);

        // 임계값 초과 시 알림
        if (data.count >= monitoringConfig.thresholds.rateLimitExceeded) {
            this.recordEvent(SecurityEventTypes.RATE_LIMIT_EXCEEDED, {
                ip,
                violationCount: data.count,
                timeWindow: now - data.firstViolation
            }, SecuritySeverity.MEDIUM);
        }
    }

    // DDoS 공격 추적
    trackDDoSAttack(ip, event) {
        const now = Date.now();
        const data = eventTracker.ddosAttacks.get(ip) || { count: 0, firstAttack: now };

        data.count++;
        eventTracker.ddosAttacks.set(ip, data);

        // 임계값 초과 시 알림
        if (data.count >= monitoringConfig.thresholds.ddosRequests) {
            this.recordEvent(SecurityEventTypes.DDOS_ATTACK, {
                ip,
                attackCount: data.count,
                timeWindow: now - data.firstAttack
            }, SecuritySeverity.HIGH);
        }
    }

    // 알림 발송 여부 결정
    shouldSendAlert(event) {
        if (!monitoringConfig.notifications.enabled) return false;

        // 심각도가 높은 경우 항상 알림
        if (event.severity === SecuritySeverity.CRITICAL || event.severity === SecuritySeverity.HIGH) {
            return true;
        }

        // 특정 이벤트 타입은 항상 알림
        const alwaysAlertTypes = [
            SecurityEventTypes.DATA_BREACH,
            SecurityEventTypes.ACCOUNT_LOCKED,
            SecurityEventTypes.PRIVILEGE_ESCALATION
        ];

        return alwaysAlertTypes.includes(event.type);
    }

    // 알림 발송
    async sendAlert(event) {
        const alert = {
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            event,
            channels: monitoringConfig.notifications.channels
        };

        this.alerts.push(alert);

        // 콘솔 알림
        if (monitoringConfig.notifications.channels.includes('console')) {
            console.log(`🚨 SECURITY ALERT: ${event.type} - ${event.severity}`);
            console.log(`IP: ${event.details.ip}`);
            console.log(`Details: ${JSON.stringify(event.details)}`);
        }

        // 웹훅 알림
        if (monitoringConfig.notifications.channels.includes('webhook') && monitoringConfig.notifications.webhookUrl) {
            try {
                await this.sendWebhookAlert(alert);
            } catch (error) {
                console.error('Failed to send webhook alert:', error);
            }
        }

        // 슬랙 알림
        if (monitoringConfig.notifications.channels.includes('slack') && monitoringConfig.notifications.slackWebhook) {
            try {
                await this.sendSlackAlert(alert);
            } catch (error) {
                console.error('Failed to send Slack alert:', error);
            }
        }

        this.emit('alert', alert);
    }

    // 웹훅 알림 발송
    async sendWebhookAlert(alert) {
        const response = await fetch(monitoringConfig.notifications.webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Security-Alert': 'true'
            },
            body: JSON.stringify(alert)
        });

        if (!response.ok) {
            throw new Error(`Webhook alert failed: ${response.status}`);
        }
    }

    // 슬랙 알림 발송
    async sendSlackAlert(alert) {
        const slackMessage = {
            text: `🚨 Security Alert: ${alert.event.type}`,
            attachments: [{
                color: this.getSeverityColor(alert.event.severity),
                fields: [
                    { title: 'Severity', value: alert.event.severity, short: true },
                    { title: 'IP', value: alert.event.details.ip, short: true },
                    { title: 'Path', value: alert.event.details.path, short: true },
                    { title: 'Method', value: alert.event.details.method, short: true },
                    { title: 'Details', value: JSON.stringify(alert.event.details, null, 2), short: false }
                ],
                timestamp: Math.floor(new Date(alert.timestamp).getTime() / 1000)
            }]
        };

        const response = await fetch(monitoringConfig.notifications.slackWebhook, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(slackMessage)
        });

        if (!response.ok) {
            throw new Error(`Slack alert failed: ${response.status}`);
        }
    }

    // 심각도별 색상
    getSeverityColor(severity) {
        const colors = {
            [SecuritySeverity.LOW]: '#36a64f',
            [SecuritySeverity.MEDIUM]: '#ff9500',
            [SecuritySeverity.HIGH]: '#ff0000',
            [SecuritySeverity.CRITICAL]: '#8b0000'
        };
        return colors[severity] || '#36a64f';
    }

    // 이벤트 로깅
    logEvent(event) {
        if (!monitoringConfig.logging.enabled) return;

        const logLevel = monitoringConfig.logging.level;
        const shouldLog = this.shouldLogEvent(event, logLevel);

        if (shouldLog) {
            console.log(`[SECURITY] ${event.severity} - ${event.type}: ${JSON.stringify(event.details)}`);
        }
    }

    // 로그 레벨 확인
    shouldLogEvent(event, logLevel) {
        const levels = { debug: 0, info: 1, warn: 2, error: 3 };
        const eventLevel = levels[event.severity.toLowerCase()] || 1;
        const configLevel = levels[logLevel] || 1;

        return eventLevel >= configLevel;
    }

    // 통계 조회
    getStats() {
        return {
            metrics: this.metrics,
            recentEvents: this.events.slice(-100), // 최근 100개 이벤트
            recentAlerts: this.alerts.slice(-50), // 최근 50개 알림
            trackerStats: {
                loginFailures: Object.fromEntries(eventTracker.loginFailures),
                suspiciousIPs: Object.fromEntries(eventTracker.suspiciousIPs),
                rateLimitViolations: Object.fromEntries(eventTracker.rateLimitViolations),
                ddosAttacks: Object.fromEntries(eventTracker.ddosAttacks)
            }
        };
    }

    // 이벤트 정리 (오래된 이벤트 제거)
    cleanupEvents() {
        const cutoffTime = Date.now() - (monitoringConfig.logging.retentionDays * 24 * 60 * 60 * 1000);

        this.events = this.events.filter(event =>
            new Date(event.timestamp).getTime() > cutoffTime
        );

        this.alerts = this.alerts.filter(alert =>
            new Date(alert.timestamp).getTime() > cutoffTime
        );
    }
}

// 전역 보안 모니터 인스턴스
const securityMonitor = new SecurityMonitor();

// 정기 정리 작업
setInterval(() => {
    securityMonitor.cleanupEvents();
}, 24 * 60 * 60 * 1000); // 24시간마다

// 보안 이벤트 미들웨어
function securityEventMiddleware(req, res, next) {
    const originalSend = res.send;

    // 응답 인터셉트
    res.send = function (data) {
        // 보안 관련 응답 코드 로깅
        if (res.statusCode >= 400) {
            securityMonitor.recordEvent(SecurityEventTypes.UNAUTHORIZED_ACCESS, {
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                path: req.path,
                method: req.method,
                statusCode: res.statusCode,
                response: typeof data === 'string' ? data.substring(0, 200) : JSON.stringify(data).substring(0, 200)
            }, res.statusCode >= 500 ? SecuritySeverity.HIGH : SecuritySeverity.MEDIUM);
        }

        return originalSend.call(this, data);
    };

    next();
}

module.exports = {
    SecurityMonitor,
    securityMonitor,
    SecurityEventTypes,
    SecuritySeverity,
    securityEventMiddleware,
    monitoringConfig
};
