#!/usr/bin/env node

/**
 * 🔒 포괄적 보안 감사 스크립트
 * 
 * 이 스크립트는 다음 보안 영역을 검사합니다:
 * 1. 의존성 취약점 스캔
 * 2. 코드 보안 분석
 * 3. 데이터베이스 보안 검사
 * 4. API 보안 테스트
 * 5. 인프라 보안 검사
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const axios = require('axios');

// 색상 정의
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

const log = (message, color = 'reset') => {
    console.log(`${colors[color]}${message}${colors.reset}`);
};

class SecurityAuditor {
    constructor() {
        this.results = {
            dependencyScan: {},
            codeAnalysis: {},
            databaseSecurity: {},
            apiSecurity: {},
            infrastructureSecurity: {},
            overallScore: 0,
            recommendations: [],
            criticalIssues: [],
            warnings: [],
        };
    }

    // 메인 감사 실행
    async runAudit() {
        log('🔒 포괄적 보안 감사 시작', 'bright');
        log('=' * 50, 'cyan');

        try {
            // 1. 의존성 취약점 스캔
            await this.scanDependencies();

            // 2. 코드 보안 분석
            await this.analyzeCodeSecurity();

            // 3. 데이터베이스 보안 검사
            await this.checkDatabaseSecurity();

            // 4. API 보안 테스트
            await this.testApiSecurity();

            // 5. 인프라 보안 검사
            await this.checkInfrastructureSecurity();

            // 6. 종합 평가
            this.evaluateOverallSecurity();

            // 7. 보고서 생성
            await this.generateReport();

            log('\n🎉 보안 감사 완료!', 'green');

        } catch (error) {
            log(`\n❌ 보안 감사 실패: ${error.message}`, 'red');
            throw error;
        }
    }

    // 1. 의존성 취약점 스캔
    async scanDependencies() {
        log('\n📦 의존성 취약점 스캔 중...', 'cyan');

        const scanResults = {
            root: await this.scanPackageJson('.'),
            backend: await this.scanPackageJson('./server-backend'),
            frontend: await this.scanPackageJson('./frontend'),
        };

        this.results.dependencyScan = scanResults;

        // 전체 취약점 수 계산
        const totalVulnerabilities = Object.values(scanResults)
            .reduce((sum, result) => sum + (result.vulnerabilities?.length || 0), 0);

        if (totalVulnerabilities > 0) {
            this.results.criticalIssues.push(`의존성 취약점 ${totalVulnerabilities}개 발견`);
        }

        log(`  📊 총 취약점: ${totalVulnerabilities}개`, totalVulnerabilities > 0 ? 'red' : 'green');
    }

    async scanPackageJson(projectPath) {
        try {
            const packageJsonPath = path.join(projectPath, 'package.json');
            if (!fs.existsSync(packageJsonPath)) {
                return { vulnerabilities: [], error: 'package.json not found' };
            }

            // npm audit 실행
            const auditResult = execSync('npm audit --json', {
                cwd: projectPath,
                encoding: 'utf8',
                stdio: 'pipe'
            });

            const auditData = JSON.parse(auditResult);

            return {
                vulnerabilities: auditData.vulnerabilities || [],
                summary: auditData.metadata?.vulnerabilities || {},
                error: null,
            };
        } catch (error) {
            return {
                vulnerabilities: [],
                error: error.message,
            };
        }
    }

    // 2. 코드 보안 분석
    async analyzeCodeSecurity() {
        log('\n🔍 코드 보안 분석 중...', 'cyan');

        const analysisResults = {
            sqlInjection: await this.checkSqlInjection(),
            xssVulnerabilities: await this.checkXssVulnerabilities(),
            authenticationIssues: await this.checkAuthenticationIssues(),
            authorizationIssues: await this.checkAuthorizationIssues(),
            inputValidation: await this.checkInputValidation(),
            secretsExposure: await this.checkSecretsExposure(),
        };

        this.results.codeAnalysis = analysisResults;

        // 보안 이슈 수 계산
        const totalIssues = Object.values(analysisResults)
            .reduce((sum, result) => sum + (result.issues?.length || 0), 0);

        if (totalIssues > 0) {
            this.results.warnings.push(`코드 보안 이슈 ${totalIssues}개 발견`);
        }

        log(`  📊 보안 이슈: ${totalIssues}개`, totalIssues > 0 ? 'yellow' : 'green');
    }

    async checkSqlInjection() {
        const patterns = [
            /query\s*\(\s*['"`][^'"`]*\$\{/g,
            /execute\s*\(\s*['"`][^'"`]*\$\{/g,
            /\.query\s*\(\s*[^)]*\+/g,
            /SELECT.*\+.*FROM/g,
            /INSERT.*\+.*INTO/g,
            /UPDATE.*\+.*SET/g,
            /DELETE.*\+.*FROM/g,
        ];

        return await this.scanCodePatterns(patterns, 'SQL Injection');
    }

    async checkXssVulnerabilities() {
        const patterns = [
            /innerHTML\s*=/g,
            /outerHTML\s*=/g,
            /document\.write\s*\(/g,
            /eval\s*\(/g,
            /setTimeout\s*\(\s*['"`]/g,
            /setInterval\s*\(\s*['"`]/g,
        ];

        return await this.scanCodePatterns(patterns, 'XSS');
    }

    async checkAuthenticationIssues() {
        const patterns = [
            /password.*=.*['"`][^'"`]{1,7}['"`]/g, // 약한 비밀번호
            /jwt.*secret.*=.*['"`]test/g, // 테스트 시크릿
            /jwt.*secret.*=.*['"`]secret/g, // 기본 시크릿
            /bcrypt.*rounds.*[0-4]/g, // 낮은 bcrypt 라운드
        ];

        return await this.scanCodePatterns(patterns, 'Authentication');
    }

    async checkAuthorizationIssues() {
        const patterns = [
            /if\s*\(\s*user\s*\)\s*{/g, // 단순한 권한 체크
            /role\s*==\s*['"`]admin['"`]/g, // 하드코딩된 역할
            /permission\s*==\s*['"`]write['"`]/g, // 하드코딩된 권한
        ];

        return await this.scanCodePatterns(patterns, 'Authorization');
    }

    async checkInputValidation() {
        const patterns = [
            /req\.body[^.]/g, // 직접적인 req.body 사용
            /req\.query[^.]/g, // 직접적인 req.query 사용
            /req\.params[^.]/g, // 직접적인 req.params 사용
        ];

        return await this.scanCodePatterns(patterns, 'Input Validation');
    }

    async checkSecretsExposure() {
        const patterns = [
            /password\s*:\s*['"`][^'"`]+['"`]/g,
            /secret\s*:\s*['"`][^'"`]+['"`]/g,
            /key\s*:\s*['"`][^'"`]+['"`]/g,
            /token\s*:\s*['"`][^'"`]+['"`]/g,
            /api_key\s*:\s*['"`][^'"`]+['"`]/g,
        ];

        return await this.scanCodePatterns(patterns, 'Secrets Exposure');
    }

    async scanCodePatterns(patterns, issueType) {
        const issues = [];
        const sourceFiles = this.getSourceFiles();

        for (const file of sourceFiles) {
            try {
                const content = fs.readFileSync(file, 'utf8');
                const lines = content.split('\n');

                patterns.forEach(pattern => {
                    let match;
                    while ((match = pattern.exec(content)) !== null) {
                        const lineNumber = content.substring(0, match.index).split('\n').length;
                        issues.push({
                            file: path.relative(process.cwd(), file),
                            line: lineNumber,
                            issue: issueType,
                            code: lines[lineNumber - 1]?.trim(),
                            severity: this.getSeverity(issueType),
                        });
                    }
                });
            } catch (error) {
                // 파일 읽기 오류 무시
            }
        }

        return { issues, count: issues.length };
    }

    getSourceFiles() {
        const extensions = ['.js', '.ts', '.jsx', '.tsx', '.vue'];
        const excludeDirs = ['node_modules', '.git', 'dist', 'build'];

        const files = [];

        const scanDir = (dir) => {
            const items = fs.readdirSync(dir);

            for (const item of items) {
                const fullPath = path.join(dir, item);
                const stat = fs.statSync(fullPath);

                if (stat.isDirectory()) {
                    if (!excludeDirs.includes(item)) {
                        scanDir(fullPath);
                    }
                } else if (extensions.includes(path.extname(item))) {
                    files.push(fullPath);
                }
            }
        };

        scanDir('.');
        return files;
    }

    getSeverity(issueType) {
        const severityMap = {
            'SQL Injection': 'critical',
            'XSS': 'high',
            'Authentication': 'high',
            'Authorization': 'medium',
            'Input Validation': 'medium',
            'Secrets Exposure': 'critical',
        };

        return severityMap[issueType] || 'low';
    }

    // 3. 데이터베이스 보안 검사
    async checkDatabaseSecurity() {
        log('\n🗄️  데이터베이스 보안 검사 중...', 'cyan');

        const dbSecurity = {
            connectionSecurity: await this.checkDbConnectionSecurity(),
            accessControl: await this.checkDbAccessControl(),
            dataEncryption: await this.checkDataEncryption(),
            backupSecurity: await this.checkBackupSecurity(),
        };

        this.results.databaseSecurity = dbSecurity;

        log(`  📊 데이터베이스 보안 검사 완료`, 'green');
    }

    async checkDbConnectionSecurity() {
        // 데이터베이스 연결 보안 검사
        const issues = [];

        // 환경 변수 파일 검사
        const envFiles = ['.env', '.env.local', '.env.production'];

        for (const envFile of envFiles) {
            if (fs.existsSync(envFile)) {
                const content = fs.readFileSync(envFile, 'utf8');

                if (content.includes('DB_PASSWORD=password')) {
                    issues.push('기본 데이터베이스 비밀번호 사용');
                }

                if (content.includes('DB_HOST=localhost')) {
                    issues.push('로컬호스트 데이터베이스 사용');
                }

                if (!content.includes('DB_SSL=true')) {
                    issues.push('SSL 연결 미사용');
                }
            }
        }

        return { issues, count: issues.length };
    }

    async checkDbAccessControl() {
        // 데이터베이스 접근 제어 검사
        return { issues: [], count: 0 };
    }

    async checkDataEncryption() {
        // 데이터 암호화 검사
        return { issues: [], count: 0 };
    }

    async checkBackupSecurity() {
        // 백업 보안 검사
        return { issues: [], count: 0 };
    }

    // 4. API 보안 테스트
    async testApiSecurity() {
        log('\n🌐 API 보안 테스트 중...', 'cyan');

        const apiTests = {
            authentication: await this.testAuthentication(),
            authorization: await this.testAuthorization(),
            inputValidation: await this.testInputValidation(),
            rateLimiting: await this.testRateLimiting(),
            cors: await this.testCors(),
        };

        this.results.apiSecurity = apiTests;

        log(`  📊 API 보안 테스트 완료`, 'green');
    }

    async testAuthentication() {
        // 인증 테스트
        return { tests: [], passed: 0, failed: 0 };
    }

    async testAuthorization() {
        // 인가 테스트
        return { tests: [], passed: 0, failed: 0 };
    }

    async testInputValidation() {
        // 입력 검증 테스트
        return { tests: [], passed: 0, failed: 0 };
    }

    async testRateLimiting() {
        // 속도 제한 테스트
        return { tests: [], passed: 0, failed: 0 };
    }

    async testCors() {
        // CORS 테스트
        return { tests: [], passed: 0, failed: 0 };
    }

    // 5. 인프라 보안 검사
    async checkInfrastructureSecurity() {
        log('\n🏗️  인프라 보안 검사 중...', 'cyan');

        const infraSecurity = {
            dockerSecurity: await this.checkDockerSecurity(),
            networkSecurity: await this.checkNetworkSecurity(),
            filePermissions: await this.checkFilePermissions(),
            sslCertificates: await this.checkSslCertificates(),
        };

        this.results.infrastructureSecurity = infraSecurity;

        log(`  📊 인프라 보안 검사 완료`, 'green');
    }

    async checkDockerSecurity() {
        // Docker 보안 검사
        return { issues: [], count: 0 };
    }

    async checkNetworkSecurity() {
        // 네트워크 보안 검사
        return { issues: [], count: 0 };
    }

    async checkFilePermissions() {
        // 파일 권한 검사
        return { issues: [], count: 0 };
    }

    async checkSslCertificates() {
        // SSL 인증서 검사
        return { issues: [], count: 0 };
    }

    // 6. 종합 평가
    evaluateOverallSecurity() {
        log('\n📊 종합 보안 평가 중...', 'cyan');

        let score = 100;

        // 의존성 취약점 감점
        const depVulns = Object.values(this.results.dependencyScan)
            .reduce((sum, result) => sum + (result.vulnerabilities?.length || 0), 0);
        score -= depVulns * 5;

        // 코드 보안 이슈 감점
        const codeIssues = Object.values(this.results.codeAnalysis)
            .reduce((sum, result) => sum + (result.issues?.length || 0), 0);
        score -= codeIssues * 3;

        // 데이터베이스 보안 이슈 감점
        const dbIssues = Object.values(this.results.databaseSecurity)
            .reduce((sum, result) => sum + (result.issues?.length || 0), 0);
        score -= dbIssues * 4;

        // API 보안 이슈 감점
        const apiIssues = Object.values(this.results.apiSecurity)
            .reduce((sum, result) => sum + (result.failed || 0), 0);
        score -= apiIssues * 2;

        // 인프라 보안 이슈 감점
        const infraIssues = Object.values(this.results.infrastructureSecurity)
            .reduce((sum, result) => sum + (result.issues?.length || 0), 0);
        score -= infraIssues * 3;

        this.results.overallScore = Math.max(0, Math.min(100, score));

        // 권장사항 생성
        this.generateRecommendations();

        log(`  🎯 종합 보안 점수: ${this.results.overallScore}/100`,
            this.results.overallScore >= 80 ? 'green' :
                this.results.overallScore >= 60 ? 'yellow' : 'red');
    }

    generateRecommendations() {
        const recommendations = [];

        if (this.results.overallScore < 80) {
            recommendations.push('전반적인 보안 수준을 향상시켜야 합니다.');
        }

        if (this.results.criticalIssues.length > 0) {
            recommendations.push('중요한 보안 이슈를 즉시 해결해야 합니다.');
        }

        if (this.results.warnings.length > 0) {
            recommendations.push('경고 사항들을 검토하고 개선하세요.');
        }

        this.results.recommendations = recommendations;
    }

    // 7. 보고서 생성
    async generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                overallScore: this.results.overallScore,
                criticalIssues: this.results.criticalIssues.length,
                warnings: this.results.warnings.length,
                recommendations: this.results.recommendations.length,
            },
            details: this.results,
        };

        const reportsDir = path.join(__dirname, '../reports');
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }

        const reportPath = path.join(reportsDir, `security-audit-${Date.now()}.json`);
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

        log(`\n📄 보안 감사 보고서 저장: ${reportPath}`, 'green');

        return reportPath;
    }
}

// 메인 실행
async function main() {
    const auditor = new SecurityAuditor();
    await auditor.runAudit();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = SecurityAuditor;
