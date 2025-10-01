const { logger } = require('../utils/logger');
const { cacheService } = require('./cacheService');

/**
 * 침입 탐지 시스템 (IDS)
 * - 실시간 위협 탐지
 * - 이상 행동 분석
 * - 자동 차단 시스템
 * - 보안 이벤트 로깅
 */

class IntrusionDetectionService {
    constructor() {
        this.threatPatterns = new Map();
        this.suspiciousActivities = new Map();
        this.blockedIPs = new Set();
        this.rateLimits = new Map();
        this.anomalyThresholds = {
            loginAttempts: 5, // 5분 내 5회 이상
            apiRequests: 100, // 1분 내 100회 이상
            failedLogins: 3, // 5분 내 3회 이상
            suspiciousPatterns: 3 // 10분 내 3회 이상
        };

        this.initializeThreatPatterns();
        this.startMonitoring();
    }

    /**
     * 위협 패턴 초기화
     */
    initializeThreatPatterns() {
        // SQL 인젝션 패턴
        this.threatPatterns.set('sql_injection', [
            /('|(\\')|(;)|(\\;)|(\\*)|(\\*)|(\\-\\-)|(\\-\\-)|(\\|\\|)|(\\|\\|))/i,
            /(union|select|insert|update|delete|drop|create|alter|exec|execute)/i,
            /(or|and)\\s+\\d+\\s*=\\s*\\d+/i,
            /(\\'|\\")\\s*(or|and)\\s*(\\'|\\")\\s*=\\s*(\\'|\\")/i
        ]);

        // XSS 패턴
        this.threatPatterns.set('xss', [
            /<script[^>]*>.*?<\\/script >/gi,
            / <iframe[^>] *>.*?<\\/iframe>/gi,
            /<object[^>]*>.*?<\\/object >/gi,
            / <embed[^>] *>.*?<\\/embed>/gi,
            /javascript:/gi,
            /on\\w+\\s*=/gi,
            /<img[^>]*onerror[^>]*>/gi,
            /<svg[^>]*onload[^>]*>/gi
        ]);

        // 경로 탐색 패턴
        this.threatPatterns.set('path_traversal', [
            /\\.\\.\\/ / g,
            /\\.\\.\\\\/g,
            /%2e%2e%2f/gi,
            /%2e%2e%5c/gi,
            /\\.\\.%2f/gi,
            /\\.\\.%5c/gi
        ]);

        // 명령 인젝션 패턴
        this.threatPatterns.set('command_injection', [
            /[;&|`$()]/g,
            /(rm|del|format|shutdown|reboot|halt)/i,
            /(cat|type|more|less|head|tail)\\s+\\/etc\\/passwd/i,
            /(wget|curl|nc|netcat)\\s+/i
        ]);

        // 디렉토리 브루트포스 패턴
        this.threatPatterns.set('directory_bruteforce', [
            /(admin|administrator|login|wp-admin|phpmyadmin|manager)/i,
            /(backup|old|test|dev|staging|beta)/i,
            /(config|conf|settings|setup|install)/i
        ]);

        // 파일 업로드 악용 패턴
        this.threatPatterns.set('malicious_upload', [
            /\\.(php|jsp|asp|aspx|sh|bat|cmd|exe|scr|pif)$/i,
            /<\\?php/i,
            /<\\%\\s*@\\s*page/i,
            /<\\%\\s*@\\s*import/i,
            /#!/bin / bash / i,
            /MZ/ // PE 헤더
        ]);
    }

    /**
     * 모니터링 시작
     */
    startMonitoring() {
        // 1분마다 의심스러운 활동 분석
        setInterval(() => {
            this.analyzeSuspiciousActivities();
        }, 60000);

        // 5분마다 차단된 IP 정리
        setInterval(() => {
            this.cleanupBlockedIPs();
        }, 300000);

        // 10분마다 위협 패턴 업데이트
        setInterval(() => {
            this.updateThreatPatterns();
        }, 600000);

        logger.info('침입 탐지 시스템 모니터링 시작');
    }

    /**
     * 실시간 위협 탐지
     */
    async detectThreats(req, res, next) {
        try {
            const clientIP = this.getClientIP(req);
            const userAgent = req.get('User-Agent') || '';
            const requestData = {
                ip: clientIP,
                userAgent: userAgent,
                method: req.method,
                url: req.url,
                headers: req.headers,
                body: req.body,
                query: req.query,
                params: req.params,
                timestamp: new Date()
            };

            // 1. 차단된 IP 확인
            if (this.isIPBlocked(clientIP)) {
                logger.warning(`차단된 IP 접근 시도: ${clientIP}`);
                return res.status(403).json({
                    success: false,
                    message: '접근이 차단되었습니다.',
                    code: 'IP_BLOCKED'
                });
            }

            // 2. 위협 패턴 검사
            const threats = this.scanForThreats(requestData);
            if (threats.length > 0) {
                await this.handleThreats(clientIP, threats, requestData);
                return res.status(400).json({
                    success: false,
                    message: '악성 요청이 감지되었습니다.',
                    code: 'THREAT_DETECTED',
                    threats: threats
                });
            }

            // 3. 이상 행동 분석
            const anomalies = await this.detectAnomalies(requestData);
            if (anomalies.length > 0) {
                await this.handleAnomalies(clientIP, anomalies, requestData);
            }

            // 4. 요청 로깅
            await this.logRequest(requestData);

            next();
        } catch (error) {
            logger.error('위협 탐지 중 오류:', error);
            next();
        }
    }

    /**
     * 위협 패턴 스캔
     */
    scanForThreats(requestData) {
        const threats = [];
        const { url, body, query, headers } = requestData;

        // 모든 입력 데이터를 하나의 문자열로 결합
        const inputData = [
            url,
            JSON.stringify(body || {}),
            JSON.stringify(query || {}),
            JSON.stringify(headers || {})
        ].join(' ');

        // 각 위협 패턴 검사
        for (const [threatType, patterns] of this.threatPatterns) {
            for (const pattern of patterns) {
                if (pattern.test(inputData)) {
                    threats.push({
                        type: threatType,
                        pattern: pattern.toString(),
                        severity: this.getThreatSeverity(threatType),
                        description: this.getThreatDescription(threatType)
                    });
                }
            }
        }

        return threats;
    }

    /**
     * 이상 행동 탐지
     */
    async detectAnomalies(requestData) {
        const anomalies = [];
        const { ip, url, method, timestamp } = requestData;

        // 1. 비정상적인 요청 빈도
        const requestCount = await this.getRequestCount(ip, 60000); // 1분
        if (requestCount > this.anomalyThresholds.apiRequests) {
            anomalies.push({
                type: 'HIGH_REQUEST_RATE',
                severity: 'MEDIUM',
                description: `높은 요청 빈도: ${requestCount}회/분`,
                threshold: this.anomalyThresholds.apiRequests
            });
        }

        // 2. 비정상적인 로그인 시도
        const loginAttempts = await this.getLoginAttempts(ip, 300000); // 5분
        if (loginAttempts > this.anomalyThresholds.loginAttempts) {
            anomalies.push({
                type: 'HIGH_LOGIN_ATTEMPTS',
                severity: 'HIGH',
                description: `높은 로그인 시도: ${loginAttempts}회/5분`,
                threshold: this.anomalyThresholds.loginAttempts
            });
        }

        // 3. 실패한 로그인 시도
        const failedLogins = await this.getFailedLogins(ip, 300000); // 5분
        if (failedLogins > this.anomalyThresholds.failedLogins) {
            anomalies.push({
                type: 'HIGH_FAILED_LOGINS',
                severity: 'HIGH',
                description: `높은 실패 로그인: ${failedLogins}회/5분`,
                threshold: this.anomalyThresholds.failedLogins
            });
        }

        // 4. 비정상적인 URL 패턴
        if (this.isSuspiciousURL(url)) {
            anomalies.push({
                type: 'SUSPICIOUS_URL',
                severity: 'MEDIUM',
                description: `의심스러운 URL 패턴: ${url}`
            });
        }

        // 5. 비정상적인 User-Agent
        if (this.isSuspiciousUserAgent(requestData.userAgent)) {
            anomalies.push({
                type: 'SUSPICIOUS_USER_AGENT',
                severity: 'LOW',
                description: `의심스러운 User-Agent: ${requestData.userAgent}`
            });
        }

        return anomalies;
    }

    /**
     * 위협 처리
     */
    async handleThreats(ip, threats, requestData) {
        try {
            // 위협 로깅
            logger.warning(`위협 탐지: ${ip}`, {
                threats: threats,
                request: requestData
            });

            // 보안 이벤트 저장
            await this.saveSecurityEvent({
                type: 'THREAT_DETECTED',
                ip: ip,
                threats: threats,
                request: requestData,
                timestamp: new Date()
            });

            // 자동 차단 (심각한 위협)
            const criticalThreats = threats.filter(t => t.severity === 'CRITICAL' || t.severity === 'HIGH');
            if (criticalThreats.length > 0) {
                await this.blockIP(ip, 3600000); // 1시간 차단
                logger.warning(`IP 자동 차단: ${ip} (${criticalThreats.length}개 심각한 위협)`);
            }

            // 알림 전송
            await this.sendSecurityAlert({
                type: 'THREAT_DETECTED',
                ip: ip,
                threats: threats,
                severity: this.getHighestSeverity(threats)
            });
        } catch (error) {
            logger.error('위협 처리 실패:', error);
        }
    }

    /**
     * 이상 행동 처리
     */
    async handleAnomalies(ip, anomalies, requestData) {
        try {
            // 이상 행동 로깅
            logger.info(`이상 행동 탐지: ${ip}`, {
                anomalies: anomalies,
                request: requestData
            });

            // 보안 이벤트 저장
            await this.saveSecurityEvent({
                type: 'ANOMALY_DETECTED',
                ip: ip,
                anomalies: anomalies,
                request: requestData,
                timestamp: new Date()
            });

            // 심각한 이상 행동의 경우 임시 차단
            const criticalAnomalies = anomalies.filter(a => a.severity === 'HIGH');
            if (criticalAnomalies.length >= 3) {
                await this.blockIP(ip, 1800000); // 30분 차단
                logger.warning(`IP 임시 차단: ${ip} (${criticalAnomalies.length}개 심각한 이상 행동)`);
            }

            // 알림 전송
            await this.sendSecurityAlert({
                type: 'ANOMALY_DETECTED',
                ip: ip,
                anomalies: anomalies,
                severity: this.getHighestSeverity(anomalies)
            });
        } catch (error) {
            logger.error('이상 행동 처리 실패:', error);
        }
    }

    /**
     * IP 차단
     */
    async blockIP(ip, duration = 3600000) {
        try {
            this.blockedIPs.add(ip);

            // 캐시에 차단 정보 저장
            await cacheService.set(`blocked_ip:${ip}`, {
                ip: ip,
                blockedAt: new Date(),
                duration: duration,
                reason: 'AUTOMATIC_BLOCK'
            }, Math.ceil(duration / 1000));

            logger.warning(`IP 차단: ${ip} (${duration}ms)`);
        } catch (error) {
            logger.error('IP 차단 실패:', error);
        }
    }

    /**
     * IP 차단 해제
     */
    async unblockIP(ip) {
        try {
            this.blockedIPs.delete(ip);
            await cacheService.delete(`blocked_ip:${ip}`);
            logger.info(`IP 차단 해제: ${ip}`);
        } catch (error) {
            logger.error('IP 차단 해제 실패:', error);
        }
    }

    /**
     * 차단된 IP 확인
     */
    isIPBlocked(ip) {
        return this.blockedIPs.has(ip);
    }

    /**
     * 요청 로깅
     */
    async logRequest(requestData) {
        try {
            const logEntry = {
                timestamp: requestData.timestamp,
                ip: requestData.ip,
                method: requestData.method,
                url: requestData.url,
                userAgent: requestData.userAgent,
                responseTime: Date.now() - requestData.timestamp.getTime()
            };

            // 실제로는 데이터베이스나 로그 파일에 저장
            logger.info('요청 로그:', logEntry);
        } catch (error) {
            logger.error('요청 로깅 실패:', error);
        }
    }

    /**
     * 보안 이벤트 저장
     */
    async saveSecurityEvent(event) {
        try {
            // 실제로는 보안 이벤트 데이터베이스에 저장
            logger.warning('보안 이벤트:', event);
        } catch (error) {
            logger.error('보안 이벤트 저장 실패:', error);
        }
    }

    /**
     * 보안 알림 전송
     */
    async sendSecurityAlert(alert) {
        try {
            // 실제로는 알림 시스템으로 전송
            logger.warning('보안 알림:', alert);
        } catch (error) {
            logger.error('보안 알림 전송 실패:', error);
        }
    }

    /**
     * 헬퍼 메서드들
     */
    getClientIP(req) {
        return req.ip ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
            req.headers['x-forwarded-for']?.split(',')[0] ||
            'unknown';
    }

    getThreatSeverity(threatType) {
        const severityMap = {
            'sql_injection': 'CRITICAL',
            'xss': 'HIGH',
            'path_traversal': 'HIGH',
            'command_injection': 'CRITICAL',
            'directory_bruteforce': 'MEDIUM',
            'malicious_upload': 'HIGH'
        };
        return severityMap[threatType] || 'MEDIUM';
    }

    getThreatDescription(threatType) {
        const descriptionMap = {
            'sql_injection': 'SQL 인젝션 공격 시도',
            'xss': 'XSS 공격 시도',
            'path_traversal': '경로 탐색 공격 시도',
            'command_injection': '명령 인젝션 공격 시도',
            'directory_bruteforce': '디렉토리 브루트포스 공격 시도',
            'malicious_upload': '악성 파일 업로드 시도'
        };
        return descriptionMap[threatType] || '알 수 없는 위협';
    }

    getHighestSeverity(items) {
        const severityOrder = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
        let highest = 'LOW';

        for (const item of items) {
            const index = severityOrder.indexOf(item.severity);
            if (index !== -1 && index < severityOrder.indexOf(highest)) {
                highest = item.severity;
            }
        }

        return highest;
    }

    isSuspiciousURL(url) {
        const suspiciousPatterns = [
            /\\/admin\\/.*\\.php/i,
            /\\/wp - admin / i,
            /\\/phpmyadmin / i,
            /\\/backup / i,
            /\\/old / i,
            /\\/test / i,
            /\\/dev / i,
            /\\/staging / i,
            /\\/beta / i,
            /\\/config / i,
            /\\/conf / i,
            /\\/settings / i,
            /\\/setup / i,
            /\\/install / i
        ];

        return suspiciousPatterns.some(pattern => pattern.test(url));
    }

    isSuspiciousUserAgent(userAgent) {
        const suspiciousPatterns = [
            /bot/i,
            /crawler/i,
            /spider/i,
            /scraper/i,
            /curl/i,
            /wget/i,
            /python/i,
            /java/i,
            /php/i,
            /perl/i,
            /ruby/i,
            /go-http/i,
            /okhttp/i,
            /apache/i,
            /nginx/i
        ];

        return suspiciousPatterns.some(pattern => pattern.test(userAgent));
    }

    async getRequestCount(ip, timeWindow) {
        // 실제로는 Redis나 데이터베이스에서 조회
        return 0;
    }

    async getLoginAttempts(ip, timeWindow) {
        // 실제로는 Redis나 데이터베이스에서 조회
        return 0;
    }

    async getFailedLogins(ip, timeWindow) {
        // 실제로는 Redis나 데이터베이스에서 조회
        return 0;
    }

    async analyzeSuspiciousActivities() {
        // 실제로는 의심스러운 활동 분석 로직
        logger.debug('의심스러운 활동 분석 중...');
    }

    async cleanupBlockedIPs() {
        // 실제로는 만료된 차단 IP 정리 로직
        logger.debug('차단된 IP 정리 중...');
    }

    async updateThreatPatterns() {
        // 실제로는 위협 패턴 업데이트 로직
        logger.debug('위협 패턴 업데이트 중...');
    }

    /**
     * 통계 조회
     */
    getStats() {
        return {
            blockedIPs: this.blockedIPs.size,
            threatPatterns: this.threatPatterns.size,
            anomalyThresholds: this.anomalyThresholds,
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = new IntrusionDetectionService();
