// Supply Chain Security System (2025년 10월 기준)
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

// 공급망 보안 설정
const supplyChainConfig = {
    // 패키지 검증 설정
    packageVerification: {
        enabled: true,
        verifySignatures: true,
        verifyIntegrity: true,
        checkReputation: true,
        whitelistMode: false,
        blacklistMode: true
    },

    // 의존성 분석
    dependencyAnalysis: {
        enabled: true,
        maxDepth: 10,
        checkTransitive: true,
        analyzeLicenses: true,
        checkVulnerabilities: true
    },

    // 패키지 신뢰도 평가
    reputationSystem: {
        enabled: true,
        sources: [
            'npm-audit',
            'snyk',
            'github-security-advisories',
            'ossf-scorecard'
        ],
        minScore: 7.0,
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30일
    },

    // 자동 검사
    autoScan: {
        enabled: true,
        interval: 60 * 60 * 1000, // 1시간마다
        onInstall: true,
        onUpdate: true
    }
};

// 공급망 보안 클래스
class SupplyChainSecurity {
    constructor() {
        this.packageRegistry = new Map();
        this.trustedPackages = new Set();
        this.blockedPackages = new Set();
        this.suspiciousPackages = new Set();
        this.dependencyGraph = new Map();
        this.licenseRegistry = new Map();

        this.initializeSecurity();
    }

    // 보안 시스템 초기화
    async initializeSecurity() {
        console.log('[Supply Chain Security] Initializing security system...');

        try {
            // 1. 신뢰할 수 있는 패키지 목록 로드
            await this.loadTrustedPackages();

            // 2. 차단된 패키지 목록 로드
            await this.loadBlockedPackages();

            // 3. 의존성 그래프 구축
            await this.buildDependencyGraph();

            // 4. 라이선스 분석
            await this.analyzeLicenses();

            // 5. 자동 검사 시작
            this.startAutoScan();

            console.log('[Supply Chain Security] Security system initialized successfully');
        } catch (error) {
            console.error('[Supply Chain Security] Initialization failed:', error);
        }
    }

    // 신뢰할 수 있는 패키지 로드
    async loadTrustedPackages() {
        try {
            // 실제 구현에서는 신뢰할 수 있는 패키지 데이터베이스에서 로드
            const trustedPackages = [
                'express',
                'helmet',
                'cors',
                'dotenv',
                'bcrypt',
                'jsonwebtoken',
                'redis',
                'bullmq'
            ];

            for (const pkg of trustedPackages) {
                this.trustedPackages.add(pkg);
            }

            console.log(`[Supply Chain Security] Loaded ${trustedPackages.length} trusted packages`);
        } catch (error) {
            console.error('[Supply Chain Security] Failed to load trusted packages:', error);
        }
    }

    // 차단된 패키지 로드
    async loadBlockedPackages() {
        try {
            // 실제 구현에서는 악성 패키지 데이터베이스에서 로드
            const blockedPackages = [
                'malicious-package',
                'fake-express',
                'trojan-helmet',
                'backdoor-cors'
            ];

            for (const pkg of blockedPackages) {
                this.blockedPackages.add(pkg);
            }

            console.log(`[Supply Chain Security] Loaded ${blockedPackages.length} blocked packages`);
        } catch (error) {
            console.error('[Supply Chain Security] Failed to load blocked packages:', error);
        }
    }

    // 의존성 그래프 구축
    async buildDependencyGraph() {
        try {
            console.log('[Supply Chain Security] Building dependency graph...');

            const packageJson = require('../package.json');
            const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

            for (const [name, version] of Object.entries(dependencies)) {
                await this.analyzePackage(name, version);
            }

            console.log(`[Supply Chain Security] Dependency graph built with ${this.dependencyGraph.size} packages`);
        } catch (error) {
            console.error('[Supply Chain Security] Failed to build dependency graph:', error);
        }
    }

    // 패키지 분석
    async analyzePackage(name, version) {
        const packageInfo = {
            name,
            version,
            dependencies: [],
            vulnerabilities: [],
            reputation: 0,
            license: null,
            integrity: null,
            signature: null,
            lastAnalyzed: Date.now()
        };

        try {
            // 1. 의존성 분석
            packageInfo.dependencies = await this.getPackageDependencies(name, version);

            // 2. 취약점 검사
            packageInfo.vulnerabilities = await this.checkVulnerabilities(name, version);

            // 3. 신뢰도 평가
            packageInfo.reputation = await this.evaluateReputation(name, version);

            // 4. 라이선스 분석
            packageInfo.license = await this.analyzeLicense(name, version);

            // 5. 무결성 검증
            packageInfo.integrity = await this.verifyIntegrity(name, version);

            // 6. 서명 검증
            packageInfo.signature = await this.verifySignature(name, version);

            this.dependencyGraph.set(name, packageInfo);

            // 보안 위험 평가
            this.evaluateSecurityRisk(packageInfo);

        } catch (error) {
            console.error(`[Supply Chain Security] Failed to analyze package ${name}:`, error);
        }
    }

    // 패키지 의존성 가져오기
    async getPackageDependencies(name, version) {
        try {
            // 실제 구현에서는 npm registry API 호출
            // 여기서는 모의 데이터 사용
            const mockDependencies = {
                'express': ['body-parser', 'cookie-parser', 'cors'],
                'helmet': ['express'],
                'cors': ['express'],
                'dotenv': [],
                'bcrypt': ['node-gyp'],
                'jsonwebtoken': ['jws', 'jwa'],
                'redis': ['redis-commands'],
                'bullmq': ['ioredis', 'redis']
            };

            return mockDependencies[name] || [];
        } catch (error) {
            console.error(`[Supply Chain Security] Failed to get dependencies for ${name}:`, error);
            return [];
        }
    }

    // 취약점 검사
    async checkVulnerabilities(name, version) {
        try {
            // 실제 구현에서는 취약점 데이터베이스 조회
            // 여기서는 모의 데이터 사용
            const mockVulnerabilities = [];

            // 예시: 특정 패키지의 취약점
            if (name === 'express' && version.includes('4.17')) {
                mockVulnerabilities.push({
                    id: 'CVE-2025-0001',
                    severity: 'HIGH',
                    score: 8.5,
                    description: 'Prototype pollution vulnerability'
                });
            }

            return mockVulnerabilities;
        } catch (error) {
            console.error(`[Supply Chain Security] Failed to check vulnerabilities for ${name}:`, error);
            return [];
        }
    }

    // 신뢰도 평가
    async evaluateReputation(name, version) {
        try {
            let score = 5.0; // 기본 점수

            // 1. 다운로드 수 기반 평가
            const downloadCount = await this.getDownloadCount(name);
            if (downloadCount > 1000000) score += 2.0;
            else if (downloadCount > 100000) score += 1.0;
            else if (downloadCount < 1000) score -= 1.0;

            // 2. 유지보수 상태 평가
            const maintenanceStatus = await this.getMaintenanceStatus(name);
            if (maintenanceStatus === 'active') score += 1.0;
            else if (maintenanceStatus === 'deprecated') score -= 2.0;

            // 3. 라이선스 호환성 평가
            const license = await this.analyzeLicense(name, version);
            if (license && this.isCompatibleLicense(license)) score += 0.5;
            else if (license && this.isIncompatibleLicense(license)) score -= 1.0;

            // 4. 보안 이력 평가
            const securityHistory = await this.getSecurityHistory(name);
            if (securityHistory.criticalIssues > 0) score -= 2.0;
            if (securityHistory.highIssues > 0) score -= 1.0;

            return Math.max(0, Math.min(10, score));
        } catch (error) {
            console.error(`[Supply Chain Security] Failed to evaluate reputation for ${name}:`, error);
            return 5.0;
        }
    }

    // 다운로드 수 가져오기
    async getDownloadCount(name) {
        try {
            // 실제 구현에서는 npm registry API 호출
            // 여기서는 모의 데이터 사용
            const mockDownloads = {
                'express': 50000000,
                'helmet': 20000000,
                'cors': 15000000,
                'dotenv': 10000000,
                'bcrypt': 8000000,
                'jsonwebtoken': 12000000,
                'redis': 5000000,
                'bullmq': 2000000
            };

            return mockDownloads[name] || 1000;
        } catch (error) {
            return 1000;
        }
    }

    // 유지보수 상태 가져오기
    async getMaintenanceStatus(name) {
        try {
            // 실제 구현에서는 GitHub API 호출
            // 여기서는 모의 데이터 사용
            const mockStatus = {
                'express': 'active',
                'helmet': 'active',
                'cors': 'active',
                'dotenv': 'active',
                'bcrypt': 'active',
                'jsonwebtoken': 'active',
                'redis': 'active',
                'bullmq': 'active'
            };

            return mockStatus[name] || 'unknown';
        } catch (error) {
            return 'unknown';
        }
    }

    // 라이선스 분석
    async analyzeLicense(name, version) {
        try {
            // 실제 구현에서는 package.json에서 라이선스 정보 추출
            // 여기서는 모의 데이터 사용
            const mockLicenses = {
                'express': 'MIT',
                'helmet': 'MIT',
                'cors': 'MIT',
                'dotenv': 'BSD-2-Clause',
                'bcrypt': 'MIT',
                'jsonwebtoken': 'MIT',
                'redis': 'MIT',
                'bullmq': 'MIT'
            };

            return mockLicenses[name] || 'UNKNOWN';
        } catch (error) {
            return 'UNKNOWN';
        }
    }

    // 라이선스 호환성 확인
    isCompatibleLicense(license) {
        const compatibleLicenses = ['MIT', 'BSD-2-Clause', 'BSD-3-Clause', 'Apache-2.0', 'ISC'];
        return compatibleLicenses.includes(license);
    }

    // 라이선스 비호환성 확인
    isIncompatibleLicense(license) {
        const incompatibleLicenses = ['GPL-2.0', 'GPL-3.0', 'AGPL-3.0', 'Copyleft'];
        return incompatibleLicenses.includes(license);
    }

    // 보안 이력 가져오기
    async getSecurityHistory(name) {
        try {
            // 실제 구현에서는 보안 데이터베이스 조회
            // 여기서는 모의 데이터 사용
            return {
                criticalIssues: 0,
                highIssues: 0,
                mediumIssues: 0,
                lowIssues: 0,
                lastIssue: null
            };
        } catch (error) {
            return { criticalIssues: 0, highIssues: 0, mediumIssues: 0, lowIssues: 0, lastIssue: null };
        }
    }

    // 무결성 검증
    async verifyIntegrity(name, version) {
        try {
            // 실제 구현에서는 패키지 해시 검증
            // 여기서는 모의 검증
            return {
                verified: true,
                algorithm: 'sha256',
                hash: crypto.createHash('sha256').update(`${name}@${version}`).digest('hex'),
                timestamp: Date.now()
            };
        } catch (error) {
            return { verified: false, error: error.message };
        }
    }

    // 서명 검증
    async verifySignature(name, version) {
        try {
            // 실제 구현에서는 패키지 서명 검증
            // 여기서는 모의 검증
            return {
                verified: true,
                signer: 'npm',
                algorithm: 'RSA-SHA256',
                timestamp: Date.now()
            };
        } catch (error) {
            return { verified: false, error: error.message };
        }
    }

    // 보안 위험 평가
    evaluateSecurityRisk(packageInfo) {
        let riskScore = 0;
        let riskLevel = 'LOW';

        // 1. 취약점 기반 위험도
        for (const vuln of packageInfo.vulnerabilities) {
            switch (vuln.severity) {
                case 'CRITICAL': riskScore += 10; break;
                case 'HIGH': riskScore += 7; break;
                case 'MEDIUM': riskScore += 4; break;
                case 'LOW': riskScore += 1; break;
            }
        }

        // 2. 신뢰도 기반 위험도
        if (packageInfo.reputation < 3) riskScore += 5;
        else if (packageInfo.reputation < 5) riskScore += 2;

        // 3. 라이선스 기반 위험도
        if (this.isIncompatibleLicense(packageInfo.license)) riskScore += 3;

        // 4. 무결성 기반 위험도
        if (!packageInfo.integrity?.verified) riskScore += 5;

        // 5. 서명 기반 위험도
        if (!packageInfo.signature?.verified) riskScore += 3;

        // 위험도 분류
        if (riskScore >= 15) riskLevel = 'CRITICAL';
        else if (riskScore >= 10) riskLevel = 'HIGH';
        else if (riskScore >= 5) riskLevel = 'MEDIUM';
        else riskLevel = 'LOW';

        packageInfo.riskScore = riskScore;
        packageInfo.riskLevel = riskLevel;

        // 위험도에 따른 조치
        this.handleSecurityRisk(packageInfo);
    }

    // 보안 위험 처리
    handleSecurityRisk(packageInfo) {
        switch (packageInfo.riskLevel) {
            case 'CRITICAL':
                this.blockedPackages.add(packageInfo.name);
                console.log(`🚨 [Supply Chain Security] BLOCKED PACKAGE: ${packageInfo.name} (CRITICAL RISK)`);
                break;
            case 'HIGH':
                this.suspiciousPackages.add(packageInfo.name);
                console.log(`⚠️ [Supply Chain Security] SUSPICIOUS PACKAGE: ${packageInfo.name} (HIGH RISK)`);
                break;
            case 'MEDIUM':
                console.log(`⚠️ [Supply Chain Security] MONITORING PACKAGE: ${packageInfo.name} (MEDIUM RISK)`);
                break;
        }
    }

    // 라이선스 분석
    async analyzeLicenses() {
        console.log('[Supply Chain Security] Analyzing licenses...');

        const licenseStats = {
            total: 0,
            compatible: 0,
            incompatible: 0,
            unknown: 0,
            licenses: new Map()
        };

        for (const [name, packageInfo] of this.dependencyGraph.entries()) {
            licenseStats.total++;

            const license = packageInfo.license;
            if (!license || license === 'UNKNOWN') {
                licenseStats.unknown++;
            } else if (this.isCompatibleLicense(license)) {
                licenseStats.compatible++;
            } else if (this.isIncompatibleLicense(license)) {
                licenseStats.incompatible++;
            }

            // 라이선스별 통계
            const count = licenseStats.licenses.get(license) || 0;
            licenseStats.licenses.set(license, count + 1);
        }

        this.licenseRegistry = licenseStats;
        console.log(`[Supply Chain Security] License analysis completed: ${licenseStats.compatible} compatible, ${licenseStats.incompatible} incompatible, ${licenseStats.unknown} unknown`);
    }

    // 자동 검사 시작
    startAutoScan() {
        if (!supplyChainConfig.autoScan.enabled) return;

        setInterval(async () => {
            await this.performSecurityScan();
        }, supplyChainConfig.autoScan.interval);

        console.log('[Supply Chain Security] Auto-scan started');
    }

    // 보안 검사 수행
    async performSecurityScan() {
        console.log('[Supply Chain Security] Performing security scan...');

        try {
            // 1. 새로운 패키지 검사
            await this.scanNewPackages();

            // 2. 의존성 업데이트 검사
            await this.scanDependencyUpdates();

            // 3. 취약점 재검사
            await this.rescanVulnerabilities();

            // 4. 신뢰도 재평가
            await this.reevaluateReputation();

            console.log('[Supply Chain Security] Security scan completed');
        } catch (error) {
            console.error('[Supply Chain Security] Security scan failed:', error);
        }
    }

    // 새로운 패키지 검사
    async scanNewPackages() {
        // 실제 구현에서는 새로 설치된 패키지 감지
        console.log('[Supply Chain Security] Scanning for new packages...');
    }

    // 의존성 업데이트 검사
    async scanDependencyUpdates() {
        // 실제 구현에서는 업데이트된 의존성 감지
        console.log('[Supply Chain Security] Scanning for dependency updates...');
    }

    // 취약점 재검사
    async rescanVulnerabilities() {
        for (const [name, packageInfo] of this.dependencyGraph.entries()) {
            const vulnerabilities = await this.checkVulnerabilities(name, packageInfo.version);
            packageInfo.vulnerabilities = vulnerabilities;
            this.dependencyGraph.set(name, packageInfo);
        }
    }

    // 신뢰도 재평가
    async reevaluateReputation() {
        for (const [name, packageInfo] of this.dependencyGraph.entries()) {
            const reputation = await this.evaluateReputation(name, packageInfo.version);
            packageInfo.reputation = reputation;
            this.dependencyGraph.set(name, packageInfo);
        }
    }

    // 패키지 검증 미들웨어
    verifyPackage(name, version) {
        // 1. 차단된 패키지 확인
        if (this.blockedPackages.has(name)) {
            return {
                allowed: false,
                reason: 'Package is blocked due to security risk',
                riskLevel: 'CRITICAL'
            };
        }

        // 2. 의심스러운 패키지 확인
        if (this.suspiciousPackages.has(name)) {
            return {
                allowed: true,
                reason: 'Package is suspicious but allowed',
                riskLevel: 'HIGH',
                warning: true
            };
        }

        // 3. 신뢰할 수 있는 패키지 확인
        if (this.trustedPackages.has(name)) {
            return {
                allowed: true,
                reason: 'Package is trusted',
                riskLevel: 'LOW'
            };
        }

        // 4. 패키지 정보 확인
        const packageInfo = this.dependencyGraph.get(name);
        if (packageInfo) {
            return {
                allowed: packageInfo.riskLevel !== 'CRITICAL',
                reason: `Package risk level: ${packageInfo.riskLevel}`,
                riskLevel: packageInfo.riskLevel,
                reputation: packageInfo.reputation,
                vulnerabilities: packageInfo.vulnerabilities.length
            };
        }

        // 5. 알 수 없는 패키지
        return {
            allowed: false,
            reason: 'Unknown package - requires manual verification',
            riskLevel: 'UNKNOWN'
        };
    }

    // 통계 조회
    getStats() {
        const stats = {
            packages: {
                total: this.dependencyGraph.size,
                trusted: this.trustedPackages.size,
                blocked: this.blockedPackages.size,
                suspicious: this.suspiciousPackages.size
            },
            risks: {
                critical: 0,
                high: 0,
                medium: 0,
                low: 0
            },
            vulnerabilities: {
                total: 0,
                critical: 0,
                high: 0,
                medium: 0,
                low: 0
            },
            licenses: this.licenseRegistry
        };

        for (const [name, packageInfo] of this.dependencyGraph.entries()) {
            // 위험도 통계
            stats.risks[packageInfo.riskLevel.toLowerCase()]++;

            // 취약점 통계
            for (const vuln of packageInfo.vulnerabilities) {
                stats.vulnerabilities.total++;
                stats.vulnerabilities[vuln.severity.toLowerCase()]++;
            }
        }

        return stats;
    }
}

// 전역 공급망 보안 인스턴스
const supplyChainSecurity = new SupplyChainSecurity();

// 공급망 보안 미들웨어
function supplyChainSecurityMiddleware(req, res, next) {
    // 요청에서 패키지 정보 추출
    const packageInfo = extractPackageFromRequest(req);

    if (packageInfo) {
        const verification = supplyChainSecurity.verifyPackage(packageInfo.name, packageInfo.version);

        if (!verification.allowed) {
            return res.status(403).json({
                error: 'Package blocked by supply chain security',
                package: packageInfo.name,
                reason: verification.reason,
                riskLevel: verification.riskLevel
            });
        }

        if (verification.warning) {
            res.set('X-Supply-Chain-Warning', verification.reason);
        }
    }

    next();
}

// 요청에서 패키지 정보 추출
function extractPackageFromRequest(req) {
    // 실제 구현에서는 요청에서 패키지 정보를 추출
    // 여기서는 간단한 예시
    const userAgent = req.get('User-Agent') || '';

    if (userAgent.includes('express')) {
        return { name: 'express', version: 'unknown' };
    }

    return null;
}

module.exports = {
    SupplyChainSecurity,
    supplyChainSecurity,
    supplyChainSecurityMiddleware,
    supplyChainConfig
};
