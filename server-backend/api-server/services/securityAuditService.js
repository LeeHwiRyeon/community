const logger = require('../utils/logger');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class SecurityAuditService {
    constructor() {
        this.auditLogs = new Map();
        this.vulnerabilityReports = new Map();
        this.securityMetrics = {
            totalScans: 0,
            vulnerabilitiesFound: 0,
            criticalIssues: 0,
            highIssues: 0,
            mediumIssues: 0,
            lowIssues: 0,
            lastScanTime: null,
            scanHistory: []
        };
        this.securityRules = this.initializeSecurityRules();
    }

    // 보안 규칙 초기화
    initializeSecurityRules() {
        return {
            // SQL Injection 검사 규칙
            sqlInjection: {
                patterns: [
                    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
                    /('|(\\')|(;)|(--)|(\/\*)|(\*\/))/gi,
                    /(\bOR\b|\bAND\b)\s+\d+\s*=\s*\d+/gi,
                    /(\bUNION\b.*\bSELECT\b)/gi
                ],
                severity: 'high',
                description: 'SQL Injection 취약점'
            },
            // XSS 검사 규칙
            xss: {
                patterns: [
                    /<script[^>]*>.*?<\/script>/gi,
                    /javascript:/gi,
                    /on\w+\s*=/gi,
                    /<iframe[^>]*>.*?<\/iframe>/gi,
                    /<object[^>]*>.*?<\/object>/gi,
                    /<embed[^>]*>.*?<\/embed>/gi,
                    /<link[^>]*>.*?<\/link>/gi,
                    /<meta[^>]*>.*?<\/meta>/gi
                ],
                severity: 'high',
                description: 'Cross-Site Scripting (XSS) 취약점'
            },
            // CSRF 검사 규칙
            csrf: {
                patterns: [
                    /<form[^>]*action[^>]*>/gi,
                    /<a[^>]*href[^>]*>/gi,
                    /<img[^>]*src[^>]*>/gi
                ],
                severity: 'medium',
                description: 'Cross-Site Request Forgery (CSRF) 취약점'
            },
            // 파일 업로드 검사 규칙
            fileUpload: {
                patterns: [
                    /\.(php|asp|jsp|py|rb|pl|sh|bat|cmd|exe|scr|pif|com)$/gi,
                    /<script[^>]*>.*?<\/script>/gi,
                    /javascript:/gi
                ],
                severity: 'high',
                description: '악성 파일 업로드 취약점'
            },
            // 인증 관련 검사 규칙
            authentication: {
                patterns: [
                    /password\s*=\s*['"]\s*['"]/gi,
                    /token\s*=\s*['"]\s*['"]/gi,
                    /api[_-]?key\s*=\s*['"]\s*['"]/gi
                ],
                severity: 'critical',
                description: '인증 정보 누출 취약점'
            },
            // 경로 조작 검사 규칙
            pathTraversal: {
                patterns: [
                    /\.\.\//gi,
                    /\.\.\\/gi,
                    /\.\.%2f/gi,
                    /\.\.%5c/gi,
                    /\.\.%252f/gi,
                    /\.\.%255c/gi
                ],
                severity: 'high',
                description: 'Path Traversal 취약점'
            },
            // LDAP Injection 검사 규칙
            ldapInjection: {
                patterns: [
                    /[()=*!&|]/gi,
                    /(\bOR\b|\bAND\b)\s*\(/gi,
                    /(\bOR\b|\bAND\b)\s*\(/gi
                ],
                severity: 'high',
                description: 'LDAP Injection 취약점'
            },
            // NoSQL Injection 검사 규칙
            nosqlInjection: {
                patterns: [
                    /\$where/gi,
                    /\$ne/gi,
                    /\$gt/gi,
                    /\$lt/gi,
                    /\$regex/gi,
                    /\$exists/gi,
                    /\$in/gi,
                    /\$nin/gi
                ],
                severity: 'high',
                description: 'NoSQL Injection 취약점'
            }
        };
    }

    // 종합 보안 감사 실행
    async performSecurityAudit(options = {}) {
        try {
            const {
                scanType = 'full', // 'full', 'quick', 'custom'
                targetFiles = [],
                includeDependencies = true,
                includeConfigs = true,
                includeLogs = true
            } = options;

            logger.info('Starting security audit...');
            this.securityMetrics.totalScans++;
            this.securityMetrics.lastScanTime = new Date().toISOString();

            const auditResults = {
                scanId: this.generateScanId(),
                timestamp: new Date().toISOString(),
                scanType,
                summary: {
                    totalFiles: 0,
                    vulnerabilitiesFound: 0,
                    criticalIssues: 0,
                    highIssues: 0,
                    mediumIssues: 0,
                    lowIssues: 0
                },
                vulnerabilities: [],
                recommendations: [],
                scanDuration: 0
            };

            const startTime = Date.now();

            // 1. 코드 스캔
            const codeScanResults = await this.scanCodeFiles(targetFiles);
            auditResults.vulnerabilities.push(...codeScanResults);

            // 2. 의존성 스캔
            if (includeDependencies) {
                const dependencyResults = await this.scanDependencies();
                auditResults.vulnerabilities.push(...dependencyResults);
            }

            // 3. 설정 파일 스캔
            if (includeConfigs) {
                const configResults = await this.scanConfigFiles();
                auditResults.vulnerabilities.push(...configResults);
            }

            // 4. 로그 파일 스캔
            if (includeLogs) {
                const logResults = await this.scanLogFiles();
                auditResults.vulnerabilities.push(...logResults);
            }

            // 5. 네트워크 보안 스캔
            const networkResults = await this.scanNetworkSecurity();
            auditResults.vulnerabilities.push(...networkResults);

            // 6. 결과 분석 및 요약
            this.analyzeAuditResults(auditResults);

            // 7. 권장사항 생성
            auditResults.recommendations = this.generateRecommendations(auditResults);

            auditResults.scanDuration = Date.now() - startTime;
            auditResults.summary.totalFiles = this.countScannedFiles(auditResults.vulnerabilities);

            // 결과 저장
            this.auditLogs.set(auditResults.scanId, auditResults);
            this.updateSecurityMetrics(auditResults);

            logger.info(`Security audit completed in ${auditResults.scanDuration}ms`);
            return auditResults;

        } catch (error) {
            logger.error('Security audit failed:', error);
            throw error;
        }
    }

    // 코드 파일 스캔
    async scanCodeFiles(targetFiles = []) {
        const vulnerabilities = [];
        const filesToScan = targetFiles.length > 0 ? targetFiles : await this.getCodeFiles();

        for (const filePath of filesToScan) {
            try {
                const content = await fs.readFile(filePath, 'utf8');
                const fileVulnerabilities = this.scanFileContent(content, filePath);
                vulnerabilities.push(...fileVulnerabilities);
            } catch (error) {
                logger.warn(`Failed to scan file ${filePath}:`, error.message);
            }
        }

        return vulnerabilities;
    }

    // 파일 내용 스캔
    scanFileContent(content, filePath) {
        const vulnerabilities = [];
        const lines = content.split('\n');

        for (let lineNumber = 0; lineNumber < lines.length; lineNumber++) {
            const line = lines[lineNumber];

            for (const [ruleName, rule] of Object.entries(this.securityRules)) {
                for (const pattern of rule.patterns) {
                    const matches = line.match(pattern);
                    if (matches) {
                        vulnerabilities.push({
                            id: this.generateVulnerabilityId(),
                            type: ruleName,
                            severity: rule.severity,
                            description: rule.description,
                            file: filePath,
                            line: lineNumber + 1,
                            code: line.trim(),
                            matches: matches,
                            recommendation: this.getRecommendation(ruleName),
                            timestamp: new Date().toISOString()
                        });
                    }
                }
            }
        }

        return vulnerabilities;
    }

    // 의존성 스캔
    async scanDependencies() {
        const vulnerabilities = [];

        try {
            // package.json 스캔
            const packageJsonPath = path.join(process.cwd(), 'package.json');
            const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));

            // 알려진 취약한 패키지 체크
            const vulnerablePackages = await this.checkVulnerablePackages(packageJson.dependencies || {});
            vulnerabilities.push(...vulnerablePackages);

            // 버전 취약점 체크
            const versionVulnerabilities = await this.checkVersionVulnerabilities(packageJson.dependencies || {});
            vulnerabilities.push(...versionVulnerabilities);

        } catch (error) {
            logger.warn('Dependency scan failed:', error.message);
        }

        return vulnerabilities;
    }

    // 알려진 취약한 패키지 체크
    async checkVulnerablePackages(dependencies) {
        const vulnerabilities = [];
        const knownVulnerablePackages = [
            'lodash', 'moment', 'jquery', 'express', 'mongoose',
            'request', 'axios', 'ws', 'socket.io', 'redis'
        ];

        for (const [packageName, version] of Object.entries(dependencies)) {
            if (knownVulnerablePackages.includes(packageName)) {
                vulnerabilities.push({
                    id: this.generateVulnerabilityId(),
                    type: 'vulnerable_package',
                    severity: 'medium',
                    description: `알려진 취약점이 있는 패키지: ${packageName}`,
                    package: packageName,
                    version: version,
                    recommendation: `패키지 ${packageName}을 최신 버전으로 업데이트하세요.`,
                    timestamp: new Date().toISOString()
                });
            }
        }

        return vulnerabilities;
    }

    // 버전 취약점 체크
    async checkVersionVulnerabilities(dependencies) {
        const vulnerabilities = [];

        for (const [packageName, version] of Object.entries(dependencies)) {
            // 간단한 버전 체크 (실제로는 더 정교한 로직 필요)
            if (version.includes('^') || version.includes('~')) {
                vulnerabilities.push({
                    id: this.generateVulnerabilityId(),
                    type: 'version_range',
                    severity: 'low',
                    description: `버전 범위 사용: ${packageName}@${version}`,
                    package: packageName,
                    version: version,
                    recommendation: '정확한 버전을 사용하여 예측 가능한 빌드를 유지하세요.',
                    timestamp: new Date().toISOString()
                });
            }
        }

        return vulnerabilities;
    }

    // 설정 파일 스캔
    async scanConfigFiles() {
        const vulnerabilities = [];
        const configFiles = [
            'package.json',
            'docker-compose.yml',
            'Dockerfile',
            '.env',
            'config/database.js',
            'config/redis.js'
        ];

        for (const configFile of configFiles) {
            try {
                const content = await fs.readFile(configFile, 'utf8');
                const fileVulnerabilities = this.scanFileContent(content, configFile);
                vulnerabilities.push(...fileVulnerabilities);
            } catch (error) {
                // 파일이 존재하지 않는 경우 무시
            }
        }

        return vulnerabilities;
    }

    // 로그 파일 스캔
    async scanLogFiles() {
        const vulnerabilities = [];
        const logDir = path.join(process.cwd(), 'logs');

        try {
            const logFiles = await fs.readdir(logDir);

            for (const logFile of logFiles) {
                if (logFile.endsWith('.log')) {
                    const content = await fs.readFile(path.join(logDir, logFile), 'utf8');
                    const fileVulnerabilities = this.scanFileContent(content, path.join(logDir, logFile));
                    vulnerabilities.push(...fileVulnerabilities);
                }
            }
        } catch (error) {
            logger.warn('Log scan failed:', error.message);
        }

        return vulnerabilities;
    }

    // 네트워크 보안 스캔
    async scanNetworkSecurity() {
        const vulnerabilities = [];

        // CORS 설정 체크
        vulnerabilities.push({
            id: this.generateVulnerabilityId(),
            type: 'cors_config',
            severity: 'medium',
            description: 'CORS 설정 검토 필요',
            recommendation: 'CORS 설정을 검토하고 필요한 경우에만 허용하세요.',
            timestamp: new Date().toISOString()
        });

        // HTTPS 강제 체크
        vulnerabilities.push({
            id: this.generateVulnerabilityId(),
            type: 'https_enforcement',
            severity: 'high',
            description: 'HTTPS 강제 설정 검토 필요',
            recommendation: '모든 통신에 HTTPS를 강제하세요.',
            timestamp: new Date().toISOString()
        });

        // Rate Limiting 체크
        vulnerabilities.push({
            id: this.generateVulnerabilityId(),
            type: 'rate_limiting',
            severity: 'medium',
            description: 'Rate Limiting 설정 검토 필요',
            recommendation: 'API 엔드포인트에 Rate Limiting을 적용하세요.',
            timestamp: new Date().toISOString()
        });

        return vulnerabilities;
    }

    // 감사 결과 분석
    analyzeAuditResults(auditResults) {
        const vulnerabilities = auditResults.vulnerabilities;

        auditResults.summary.vulnerabilitiesFound = vulnerabilities.length;
        auditResults.summary.criticalIssues = vulnerabilities.filter(v => v.severity === 'critical').length;
        auditResults.summary.highIssues = vulnerabilities.filter(v => v.severity === 'high').length;
        auditResults.summary.mediumIssues = vulnerabilities.filter(v => v.severity === 'medium').length;
        auditResults.summary.lowIssues = vulnerabilities.filter(v => v.severity === 'low').length;

        // 심각도별 통계 업데이트
        this.securityMetrics.vulnerabilitiesFound += vulnerabilities.length;
        this.securityMetrics.criticalIssues += auditResults.summary.criticalIssues;
        this.securityMetrics.highIssues += auditResults.summary.highIssues;
        this.securityMetrics.mediumIssues += auditResults.summary.mediumIssues;
        this.securityMetrics.lowIssues += auditResults.summary.lowIssues;
    }

    // 권장사항 생성
    generateRecommendations(auditResults) {
        const recommendations = [];

        if (auditResults.summary.criticalIssues > 0) {
            recommendations.push({
                priority: 'critical',
                title: '긴급 보안 패치 필요',
                description: `${auditResults.summary.criticalIssues}개의 심각한 보안 취약점이 발견되었습니다. 즉시 패치가 필요합니다.`,
                actions: [
                    '심각한 취약점을 우선적으로 수정하세요.',
                    '보안 패치를 즉시 적용하세요.',
                    '시스템을 재검토하세요.'
                ]
            });
        }

        if (auditResults.summary.highIssues > 0) {
            recommendations.push({
                priority: 'high',
                title: '높은 우선순위 보안 개선',
                description: `${auditResults.summary.highIssues}개의 높은 우선순위 보안 취약점이 발견되었습니다.`,
                actions: [
                    '높은 우선순위 취약점을 수정하세요.',
                    '보안 모니터링을 강화하세요.',
                    '정기적인 보안 감사를 실시하세요.'
                ]
            });
        }

        if (auditResults.summary.mediumIssues > 0) {
            recommendations.push({
                priority: 'medium',
                title: '보안 개선 권장',
                description: `${auditResults.summary.mediumIssues}개의 중간 우선순위 보안 취약점이 발견되었습니다.`,
                actions: [
                    '중간 우선순위 취약점을 점진적으로 수정하세요.',
                    '보안 가이드라인을 업데이트하세요.',
                    '개발자 교육을 실시하세요.'
                ]
            });
        }

        // 일반적인 보안 권장사항
        recommendations.push({
            priority: 'general',
            title: '일반적인 보안 강화',
            description: '전반적인 보안 수준을 향상시키기 위한 권장사항입니다.',
            actions: [
                '정기적인 보안 감사를 실시하세요.',
                '의존성을 최신 버전으로 유지하세요.',
                '보안 헤더를 설정하세요.',
                '입력 검증을 강화하세요.',
                '로그 모니터링을 활성화하세요.'
            ]
        });

        return recommendations;
    }

    // 취약점 ID 생성
    generateVulnerabilityId() {
        return 'VULN-' + crypto.randomBytes(8).toString('hex').toUpperCase();
    }

    // 스캔 ID 생성
    generateScanId() {
        return 'SCAN-' + crypto.randomBytes(8).toString('hex').toUpperCase();
    }

    // 코드 파일 목록 가져오기
    async getCodeFiles() {
        const codeFiles = [];
        const extensions = ['.js', '.ts', '.jsx', '.tsx', '.json', '.yml', '.yaml'];

        try {
            const files = await this.getAllFiles(process.cwd());
            for (const file of files) {
                const ext = path.extname(file);
                if (extensions.includes(ext) && !file.includes('node_modules')) {
                    codeFiles.push(file);
                }
            }
        } catch (error) {
            logger.warn('Failed to get code files:', error.message);
        }

        return codeFiles;
    }

    // 모든 파일 재귀적으로 가져오기
    async getAllFiles(dir) {
        const files = [];
        const items = await fs.readdir(dir);

        for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = await fs.stat(fullPath);

            if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
                const subFiles = await this.getAllFiles(fullPath);
                files.push(...subFiles);
            } else if (stat.isFile()) {
                files.push(fullPath);
            }
        }

        return files;
    }

    // 스캔된 파일 수 계산
    countScannedFiles(vulnerabilities) {
        const uniqueFiles = new Set();
        vulnerabilities.forEach(vuln => {
            if (vuln.file) {
                uniqueFiles.add(vuln.file);
            }
        });
        return uniqueFiles.size;
    }

    // 보안 메트릭 업데이트
    updateSecurityMetrics(auditResults) {
        this.securityMetrics.scanHistory.push({
            scanId: auditResults.scanId,
            timestamp: auditResults.timestamp,
            vulnerabilitiesFound: auditResults.summary.vulnerabilitiesFound,
            scanDuration: auditResults.scanDuration
        });

        // 최대 100개 스캔 기록만 유지
        if (this.securityMetrics.scanHistory.length > 100) {
            this.securityMetrics.scanHistory = this.securityMetrics.scanHistory.slice(-100);
        }
    }

    // 권장사항 가져오기
    getRecommendation(ruleName) {
        const recommendations = {
            sqlInjection: 'SQL 쿼리를 준비된 문(Prepared Statement)을 사용하여 작성하세요.',
            xss: '사용자 입력을 적절히 이스케이프하고 Content Security Policy를 설정하세요.',
            csrf: 'CSRF 토큰을 사용하여 요청을 검증하세요.',
            fileUpload: '업로드된 파일의 타입과 내용을 검증하고 안전한 위치에 저장하세요.',
            authentication: '인증 정보를 환경 변수에 저장하고 적절히 보호하세요.',
            pathTraversal: '사용자 입력을 검증하고 파일 경로를 제한하세요.',
            ldapInjection: 'LDAP 쿼리를 안전하게 구성하고 입력을 검증하세요.',
            nosqlInjection: 'NoSQL 쿼리를 안전하게 구성하고 입력을 검증하세요.'
        };

        return recommendations[ruleName] || '보안 취약점을 수정하세요.';
    }

    // 감사 로그 조회
    getAuditLogs(limit = 10) {
        const logs = Array.from(this.auditLogs.values())
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, limit);

        return logs;
    }

    // 특정 스캔 결과 조회
    getScanResult(scanId) {
        return this.auditLogs.get(scanId);
    }

    // 보안 메트릭 조회
    getSecurityMetrics() {
        return {
            ...this.securityMetrics,
            averageScanDuration: this.calculateAverageScanDuration(),
            vulnerabilityTrend: this.calculateVulnerabilityTrend()
        };
    }

    // 평균 스캔 시간 계산
    calculateAverageScanDuration() {
        if (this.securityMetrics.scanHistory.length === 0) return 0;

        const totalDuration = this.securityMetrics.scanHistory.reduce(
            (sum, scan) => sum + scan.scanDuration, 0
        );

        return totalDuration / this.securityMetrics.scanHistory.length;
    }

    // 취약점 트렌드 계산
    calculateVulnerabilityTrend() {
        const recentScans = this.securityMetrics.scanHistory.slice(-10);
        if (recentScans.length < 2) return 'stable';

        const first = recentScans[0].vulnerabilitiesFound;
        const last = recentScans[recentScans.length - 1].vulnerabilitiesFound;

        if (last > first * 1.1) return 'increasing';
        if (last < first * 0.9) return 'decreasing';
        return 'stable';
    }

    // 취약점 보고서 생성
    generateVulnerabilityReport(scanId) {
        const scanResult = this.getScanResult(scanId);
        if (!scanResult) {
            throw new Error('Scan result not found');
        }

        const report = {
            scanId: scanResult.scanId,
            timestamp: scanResult.timestamp,
            summary: scanResult.summary,
            vulnerabilities: scanResult.vulnerabilities,
            recommendations: scanResult.recommendations,
            generatedAt: new Date().toISOString()
        };

        this.vulnerabilityReports.set(scanId, report);
        return report;
    }

    // 취약점 보고서 조회
    getVulnerabilityReport(scanId) {
        return this.vulnerabilityReports.get(scanId);
    }

    // 모든 취약점 보고서 조회
    getAllVulnerabilityReports() {
        return Array.from(this.vulnerabilityReports.values());
    }
}

module.exports = new SecurityAuditService();

