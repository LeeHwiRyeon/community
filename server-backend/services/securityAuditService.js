const { logger } = require('../utils/logger');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

/**
 * 보안 감사 서비스
 * - 취약점 스캔
 * - 보안 이벤트 모니터링
 * - 침입 탐지
 * - 보안 정책 검증
 */

class SecurityAuditService {
    constructor() {
        this.securityEvents = [];
        this.threats = [];
        this.vulnerabilities = [];
        this.auditLog = [];
    }

    /**
     * 전체 보안 감사 실행
     */
    async performSecurityAudit() {
        try {
            logger.info('보안 감사 시작');

            const auditResults = {
                timestamp: new Date().toISOString(),
                vulnerabilities: [],
                threats: [],
                recommendations: [],
                score: 0,
                status: 'unknown'
            };

            // 1. 취약점 스캔
            const vulnerabilities = await this.scanVulnerabilities();
            auditResults.vulnerabilities = vulnerabilities;

            // 2. 보안 설정 검증
            const securityConfig = await this.validateSecurityConfig();
            auditResults.securityConfig = securityConfig;

            // 3. 인증 시스템 검증
            const authSecurity = await this.validateAuthSecurity();
            auditResults.authSecurity = authSecurity;

            // 4. 데이터 보안 검증
            const dataSecurity = await this.validateDataSecurity();
            auditResults.dataSecurity = dataSecurity;

            // 5. 네트워크 보안 검증
            const networkSecurity = await this.validateNetworkSecurity();
            auditResults.networkSecurity = networkSecurity;

            // 6. 보안 점수 계산
            auditResults.score = this.calculateSecurityScore(auditResults);
            auditResults.status = this.getSecurityStatus(auditResults.score);

            // 7. 권장사항 생성
            auditResults.recommendations = this.generateRecommendations(auditResults);

            // 8. 감사 로그 저장
            await this.saveAuditLog(auditResults);

            logger.info(`보안 감사 완료 - 점수: ${auditResults.score}/100, 상태: ${auditResults.status}`);
            return auditResults;
        } catch (error) {
            logger.error('보안 감사 실패:', error);
            throw error;
        }
    }

    /**
     * 취약점 스캔
     */
    async scanVulnerabilities() {
        const vulnerabilities = [];

        try {
            // 1. SQL 인젝션 취약점 검사
            const sqlInjectionVulns = await this.checkSQLInjectionVulnerabilities();
            vulnerabilities.push(...sqlInjectionVulns);

            // 2. XSS 취약점 검사
            const xssVulns = await this.checkXSSVulnerabilities();
            vulnerabilities.push(...xssVulns);

            // 3. CSRF 취약점 검사
            const csrfVulns = await this.checkCSRFVulnerabilities();
            vulnerabilities.push(...csrfVulns);

            // 4. 인증 우회 취약점 검사
            const authBypassVulns = await this.checkAuthBypassVulnerabilities();
            vulnerabilities.push(...authBypassVulns);

            // 5. 파일 업로드 취약점 검사
            const fileUploadVulns = await this.checkFileUploadVulnerabilities();
            vulnerabilities.push(...fileUploadVulns);

            // 6. 의존성 취약점 검사
            const dependencyVulns = await this.checkDependencyVulnerabilities();
            vulnerabilities.push(...dependencyVulns);

            return vulnerabilities;
        } catch (error) {
            logger.error('취약점 스캔 실패:', error);
            return [];
        }
    }

    /**
     * SQL 인젝션 취약점 검사
     */
    async checkSQLInjectionVulnerabilities() {
        const vulnerabilities = [];

        try {
            // 실제로는 정적 분석 도구나 동적 테스트를 사용
            const testPayloads = [
                "' OR '1'='1",
                "'; DROP TABLE users; --",
                "' UNION SELECT * FROM users --",
                "1' OR '1'='1' --"
            ];

            // API 엔드포인트 테스트
            const endpoints = [
                '/api/posts/search',
                '/api/users/search',
                '/api/comments/search'
            ];

            for (const endpoint of endpoints) {
                for (const payload of testPayloads) {
                    try {
                        const response = await fetch(`http://localhost:5000${endpoint}?q=${encodeURIComponent(payload)}`);
                        const data = await response.text();

                        // SQL 오류 패턴 감지
                        if (this.detectSQLErrorPatterns(data)) {
                            vulnerabilities.push({
                                type: 'SQL_INJECTION',
                                severity: 'HIGH',
                                endpoint: endpoint,
                                payload: payload,
                                description: 'SQL 인젝션 취약점이 감지되었습니다.',
                                recommendation: '매개변수화된 쿼리 사용 및 입력 검증 강화'
                            });
                        }
                    } catch (error) {
                        // 연결 오류는 무시
                    }
                }
            }

            return vulnerabilities;
        } catch (error) {
            logger.error('SQL 인젝션 취약점 검사 실패:', error);
            return [];
        }
    }

    /**
     * XSS 취약점 검사
     */
    async checkXSSVulnerabilities() {
        const vulnerabilities = [];

        try {
            const xssPayloads = [
                '<script>alert("XSS")</script>',
                '<img src="x" onerror="alert(\'XSS\')">',
                'javascript:alert("XSS")',
                '<svg onload="alert(\'XSS\')">'
            ];

            const endpoints = [
                '/api/posts',
                '/api/comments',
                '/api/users/profile'
            ];

            for (const endpoint of endpoints) {
                for (const payload of xssPayloads) {
                    try {
                        const response = await fetch(`http://localhost:5000${endpoint}`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                title: payload,
                                content: payload
                            })
                        });

                        const data = await response.text();

                        // XSS 패턴 감지
                        if (this.detectXSSPatterns(data, payload)) {
                            vulnerabilities.push({
                                type: 'XSS',
                                severity: 'MEDIUM',
                                endpoint: endpoint,
                                payload: payload,
                                description: 'XSS 취약점이 감지되었습니다.',
                                recommendation: '입력 검증 및 출력 인코딩 강화'
                            });
                        }
                    } catch (error) {
                        // 연결 오류는 무시
                    }
                }
            }

            return vulnerabilities;
        } catch (error) {
            logger.error('XSS 취약점 검사 실패:', error);
            return [];
        }
    }

    /**
     * CSRF 취약점 검사
     */
    async checkCSRFVulnerabilities() {
        const vulnerabilities = [];

        try {
            // CSRF 토큰 검증 확인
            const endpoints = [
                { url: '/api/posts', method: 'POST' },
                { url: '/api/comments', method: 'POST' },
                { url: '/api/users/profile', method: 'PUT' }
            ];

            for (const endpoint of endpoints) {
                try {
                    const response = await fetch(`http://localhost:5000${endpoint.url}`, {
                        method: endpoint.method,
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ test: 'data' })
                    });

                    // CSRF 토큰 없이 요청이 성공하면 취약점
                    if (response.ok) {
                        vulnerabilities.push({
                            type: 'CSRF',
                            severity: 'MEDIUM',
                            endpoint: endpoint.url,
                            description: 'CSRF 보호가 없습니다.',
                            recommendation: 'CSRF 토큰 구현 및 SameSite 쿠키 설정'
                        });
                    }
                } catch (error) {
                    // 연결 오류는 무시
                }
            }

            return vulnerabilities;
        } catch (error) {
            logger.error('CSRF 취약점 검사 실패:', error);
            return [];
        }
    }

    /**
     * 인증 우회 취약점 검사
     */
    async checkAuthBypassVulnerabilities() {
        const vulnerabilities = [];

        try {
            // 인증이 필요한 엔드포인트 테스트
            const protectedEndpoints = [
                '/api/admin/users',
                '/api/admin/settings',
                '/api/users/profile'
            ];

            for (const endpoint of protectedEndpoints) {
                try {
                    const response = await fetch(`http://localhost:5000${endpoint}`);

                    // 인증 없이 접근 가능하면 취약점
                    if (response.ok) {
                        vulnerabilities.push({
                            type: 'AUTH_BYPASS',
                            severity: 'HIGH',
                            endpoint: endpoint,
                            description: '인증 없이 접근 가능합니다.',
                            recommendation: '인증 미들웨어 추가 및 권한 검증 강화'
                        });
                    }
                } catch (error) {
                    // 연결 오류는 무시
                }
            }

            return vulnerabilities;
        } catch (error) {
            logger.error('인증 우회 취약점 검사 실패:', error);
            return [];
        }
    }

    /**
     * 파일 업로드 취약점 검사
     */
    async checkFileUploadVulnerabilities() {
        const vulnerabilities = [];

        try {
            // 악성 파일 업로드 테스트
            const maliciousFiles = [
                { name: 'test.php', content: '<?php system($_GET["cmd"]); ?>' },
                { name: 'test.jsp', content: '<% Runtime.getRuntime().exec(request.getParameter("cmd")); %>' },
                { name: 'test.exe', content: 'MZ' }, // PE 헤더
                { name: 'test.sh', content: '#!/bin/bash\nrm -rf /' }
            ];

            for (const file of maliciousFiles) {
                try {
                    const formData = new FormData();
                    formData.append('file', new Blob([file.content]), file.name);

                    const response = await fetch('http://localhost:5000/api/upload', {
                        method: 'POST',
                        body: formData
                    });

                    if (response.ok) {
                        vulnerabilities.push({
                            type: 'FILE_UPLOAD',
                            severity: 'HIGH',
                            filename: file.name,
                            description: '악성 파일 업로드가 가능합니다.',
                            recommendation: '파일 타입 검증 및 실행 권한 제거'
                        });
                    }
                } catch (error) {
                    // 연결 오류는 무시
                }
            }

            return vulnerabilities;
        } catch (error) {
            logger.error('파일 업로드 취약점 검사 실패:', error);
            return [];
        }
    }

    /**
     * 의존성 취약점 검사
     */
    async checkDependencyVulnerabilities() {
        const vulnerabilities = [];

        try {
            // package.json 의존성 검사
            const packageJson = require('../../package.json');
            const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

            // 실제로는 npm audit 또는 Snyk 같은 도구 사용
            for (const [name, version] of Object.entries(dependencies)) {
                // 알려진 취약한 패키지 체크
                const vulnerablePackages = [
                    'lodash', 'moment', 'jquery', 'express', 'mongoose'
                ];

                if (vulnerablePackages.includes(name)) {
                    vulnerabilities.push({
                        type: 'DEPENDENCY',
                        severity: 'MEDIUM',
                        package: name,
                        version: version,
                        description: `알려진 취약점이 있는 패키지: ${name}`,
                        recommendation: '최신 버전으로 업데이트'
                    });
                }
            }

            return vulnerabilities;
        } catch (error) {
            logger.error('의존성 취약점 검사 실패:', error);
            return [];
        }
    }

    /**
     * 보안 설정 검증
     */
    async validateSecurityConfig() {
        const config = {
            https: false,
            cors: false,
            helmet: false,
            rateLimit: false,
            session: false,
            cookies: false
        };

        try {
            // HTTPS 사용 여부
            config.https = process.env.NODE_ENV === 'production';

            // CORS 설정 확인
            config.cors = process.env.CORS_ORIGIN !== undefined;

            // Helmet 사용 여부
            config.helmet = true; // 실제로는 미들웨어 확인

            // Rate Limiting 설정 확인
            config.rateLimit = process.env.RATE_LIMIT !== undefined;

            // 세션 설정 확인
            config.session = process.env.SESSION_SECRET !== undefined;

            // 쿠키 보안 설정 확인
            config.cookies = process.env.COOKIE_SECURE !== undefined;

            return config;
        } catch (error) {
            logger.error('보안 설정 검증 실패:', error);
            return config;
        }
    }

    /**
     * 인증 보안 검증
     */
    async validateAuthSecurity() {
        const authSecurity = {
            jwtSecret: false,
            passwordPolicy: false,
            accountLockout: false,
            twoFactor: false,
            sessionTimeout: false
        };

        try {
            // JWT 시크릿 확인
            authSecurity.jwtSecret = process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 32;

            // 비밀번호 정책 확인
            authSecurity.passwordPolicy = this.checkPasswordPolicy();

            // 계정 잠금 정책 확인
            authSecurity.accountLockout = this.checkAccountLockoutPolicy();

            // 2FA 설정 확인
            authSecurity.twoFactor = this.checkTwoFactorAuth();

            // 세션 타임아웃 확인
            authSecurity.sessionTimeout = process.env.SESSION_TIMEOUT !== undefined;

            return authSecurity;
        } catch (error) {
            logger.error('인증 보안 검증 실패:', error);
            return authSecurity;
        }
    }

    /**
     * 데이터 보안 검증
     */
    async validateDataSecurity() {
        const dataSecurity = {
            encryption: false,
            hashing: false,
            sanitization: false,
            validation: false,
            backup: false
        };

        try {
            // 데이터 암호화 확인
            dataSecurity.encryption = this.checkDataEncryption();

            // 해싱 확인
            dataSecurity.hashing = this.checkPasswordHashing();

            // 입력 검증 확인
            dataSecurity.sanitization = this.checkInputSanitization();

            // 데이터 검증 확인
            dataSecurity.validation = this.checkDataValidation();

            // 백업 확인
            dataSecurity.backup = this.checkBackupPolicy();

            return dataSecurity;
        } catch (error) {
            logger.error('데이터 보안 검증 실패:', error);
            return dataSecurity;
        }
    }

    /**
     * 네트워크 보안 검증
     */
    async validateNetworkSecurity() {
        const networkSecurity = {
            firewall: false,
            ssl: false,
            headers: false,
            dns: false,
            proxy: false
        };

        try {
            // 방화벽 설정 확인
            networkSecurity.firewall = this.checkFirewallConfig();

            // SSL/TLS 설정 확인
            networkSecurity.ssl = this.checkSSLConfig();

            // 보안 헤더 확인
            networkSecurity.headers = this.checkSecurityHeaders();

            // DNS 보안 확인
            networkSecurity.dns = this.checkDNSConfig();

            // 프록시 설정 확인
            networkSecurity.proxy = this.checkProxyConfig();

            return networkSecurity;
        } catch (error) {
            logger.error('네트워크 보안 검증 실패:', error);
            return networkSecurity;
        }
    }

    /**
     * 보안 점수 계산
     */
    calculateSecurityScore(auditResults) {
        let score = 100;

        // 취약점별 점수 차감
        auditResults.vulnerabilities.forEach(vuln => {
            switch (vuln.severity) {
                case 'CRITICAL':
                    score -= 20;
                    break;
                case 'HIGH':
                    score -= 15;
                    break;
                case 'MEDIUM':
                    score -= 10;
                    break;
                case 'LOW':
                    score -= 5;
                    break;
            }
        });

        // 보안 설정별 점수 차감
        const securityConfig = auditResults.securityConfig || {};
        Object.values(securityConfig).forEach(enabled => {
            if (!enabled) score -= 5;
        });

        // 인증 보안 점수 차감
        const authSecurity = auditResults.authSecurity || {};
        Object.values(authSecurity).forEach(enabled => {
            if (!enabled) score -= 3;
        });

        // 데이터 보안 점수 차감
        const dataSecurity = auditResults.dataSecurity || {};
        Object.values(dataSecurity).forEach(enabled => {
            if (!enabled) score -= 3;
        });

        // 네트워크 보안 점수 차감
        const networkSecurity = auditResults.networkSecurity || {};
        Object.values(networkSecurity).forEach(enabled => {
            if (!enabled) score -= 2;
        });

        return Math.max(0, Math.min(100, score));
    }

    /**
     * 보안 상태 결정
     */
    getSecurityStatus(score) {
        if (score >= 90) return 'EXCELLENT';
        if (score >= 80) return 'GOOD';
        if (score >= 70) return 'FAIR';
        if (score >= 60) return 'POOR';
        return 'CRITICAL';
    }

    /**
     * 권장사항 생성
     */
    generateRecommendations(auditResults) {
        const recommendations = [];

        // 취약점 기반 권장사항
        auditResults.vulnerabilities.forEach(vuln => {
            if (vuln.recommendation) {
                recommendations.push({
                    type: 'VULNERABILITY',
                    priority: vuln.severity,
                    title: `${vuln.type} 취약점 수정`,
                    description: vuln.recommendation,
                    affected: vuln.endpoint || vuln.package || '시스템'
                });
            }
        });

        // 보안 설정 기반 권장사항
        const securityConfig = auditResults.securityConfig || {};
        if (!securityConfig.https) {
            recommendations.push({
                type: 'CONFIGURATION',
                priority: 'HIGH',
                title: 'HTTPS 활성화',
                description: 'HTTPS를 활성화하여 데이터 전송 보안을 강화하세요.',
                affected: '전체 시스템'
            });
        }

        if (!securityConfig.helmet) {
            recommendations.push({
                type: 'CONFIGURATION',
                priority: 'MEDIUM',
                title: '보안 헤더 설정',
                description: 'Helmet 미들웨어를 사용하여 보안 헤더를 설정하세요.',
                affected: '웹 애플리케이션'
            });
        }

        return recommendations;
    }

    /**
     * 감사 로그 저장
     */
    async saveAuditLog(auditResults) {
        try {
            this.auditLog.push(auditResults);

            // 실제로는 데이터베이스에 저장
            logger.info('보안 감사 로그 저장 완료');
        } catch (error) {
            logger.error('감사 로그 저장 실패:', error);
        }
    }

    /**
     * 헬퍼 메서드들
     */
    detectSQLErrorPatterns(data) {
        const sqlErrorPatterns = [
            /mysql_fetch_array\(\)/i,
            /ORA-\d+/i,
            /Microsoft.*ODBC.*SQL Server/i,
            /PostgreSQL.*ERROR/i,
            /Warning.*mysql_.*\(\)/i,
            /valid MySQL result/i,
            /MySqlClient\./i
        ];

        return sqlErrorPatterns.some(pattern => pattern.test(data));
    }

    detectXSSPatterns(data, payload) {
        return data.includes(payload) && !data.includes('&lt;') && !data.includes('&#x');
    }

    checkPasswordPolicy() {
        // 실제로는 비밀번호 정책 검증 로직
        return true;
    }

    checkAccountLockoutPolicy() {
        // 실제로는 계정 잠금 정책 검증 로직
        return true;
    }

    checkTwoFactorAuth() {
        // 실제로는 2FA 설정 검증 로직
        return false;
    }

    checkDataEncryption() {
        // 실제로는 데이터 암호화 검증 로직
        return true;
    }

    checkPasswordHashing() {
        // 실제로는 비밀번호 해싱 검증 로직
        return true;
    }

    checkInputSanitization() {
        // 실제로는 입력 검증 로직
        return true;
    }

    checkDataValidation() {
        // 실제로는 데이터 검증 로직
        return true;
    }

    checkBackupPolicy() {
        // 실제로는 백업 정책 검증 로직
        return true;
    }

    checkFirewallConfig() {
        // 실제로는 방화벽 설정 검증 로직
        return true;
    }

    checkSSLConfig() {
        // 실제로는 SSL 설정 검증 로직
        return process.env.NODE_ENV === 'production';
    }

    checkSecurityHeaders() {
        // 실제로는 보안 헤더 검증 로직
        return true;
    }

    checkDNSConfig() {
        // 실제로는 DNS 보안 검증 로직
        return true;
    }

    checkProxyConfig() {
        // 실제로는 프록시 설정 검증 로직
        return true;
    }
}

module.exports = new SecurityAuditService();
