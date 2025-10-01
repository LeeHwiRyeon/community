// 보안 감사 스크립트
const fs = require('fs');
const { execSync } = require('child_process');

class SecurityAuditor {
    constructor() {
        this.results = {
            timestamp: new Date().toISOString(),
            vulnerabilities: [],
            summary: { total: 0, critical: 0, high: 0, medium: 0, low: 0 }
        };
    }

    async runAudit() {
        console.log('🔒 보안 감사 시작...');

        try {
            await this.auditDependencies();
            await this.auditCodeSecurity();
            await this.auditConfigurationFiles();
            this.analyzeResults();
            this.generateReport();
        } catch (error) {
            console.error('❌ 보안 감사 실패:', error);
        }
    }

    async auditDependencies() {
        console.log('📦 NPM 의존성 감사...');

        try {
            const auditResult = execSync('npm audit --json', {
                cwd: process.cwd(),
                encoding: 'utf8',
                stdio: 'pipe'
            });

            const auditData = JSON.parse(auditResult);

            if (auditData.vulnerabilities) {
                Object.entries(auditData.vulnerabilities).forEach(([name, vuln]) => {
                    this.addVulnerability({
                        type: 'dependency',
                        name: name,
                        severity: vuln.severity,
                        title: vuln.title || 'NPM 취약점',
                        description: vuln.overview || vuln.description,
                        recommendation: vuln.recommendation || '의존성 업데이트 필요',
                        source: 'npm audit'
                    });
                });
            }

            console.log('✅ NPM 의존성 감사 완료');
        } catch (error) {
            console.warn('⚠️ NPM 감사 실행 실패:', error.message);
        }
    }

    async auditCodeSecurity() {
        console.log('🔍 코드 보안 검사...');

        const securityPatterns = [
            {
                pattern: /eval\s*\(/g,
                severity: 'critical',
                title: 'eval() 사용',
                description: 'eval() 함수는 코드 인젝션 공격에 취약합니다.',
                recommendation: 'eval() 대신 JSON.parse() 또는 다른 안전한 방법을 사용하세요.'
            },
            {
                pattern: /innerHTML\s*=/g,
                severity: 'high',
                title: 'innerHTML 직접 할당',
                description: 'innerHTML 직접 할당은 XSS 공격에 취약합니다.',
                recommendation: 'textContent 또는 안전한 DOM 조작 방법을 사용하세요.'
            },
            {
                pattern: /password\s*:\s*['"][^'"]*['"]/gi,
                severity: 'critical',
                title: '하드코딩된 비밀번호',
                description: '소스코드에 비밀번호가 하드코딩되어 있습니다.',
                recommendation: '환경 변수나 안전한 설정 파일을 사용하세요.'
            }
        ];

        const jsFiles = this.findFiles(['**/*.js', '**/*.ts']);

        jsFiles.forEach(file => {
            try {
                const content = fs.readFileSync(file, 'utf8');

                securityPatterns.forEach(pattern => {
                    const matches = content.match(pattern.pattern);
                    if (matches) {
                        matches.forEach(match => {
                            this.addVulnerability({
                                type: 'code',
                                file: file,
                                severity: pattern.severity,
                                title: pattern.title,
                                description: pattern.description,
                                recommendation: pattern.recommendation,
                                code: match.trim(),
                                source: 'static analysis'
                            });
                        });
                    }
                });
            } catch (error) {
                console.warn(`⚠️ 파일 읽기 실패: ${file}`);
            }
        });

        console.log('✅ 코드 보안 검사 완료');
    }

    async auditConfigurationFiles() {
        console.log('⚙️ 설정 파일 보안 검사...');

        const configFiles = ['package.json', 'docker-compose.yml', 'Dockerfile'];

        configFiles.forEach(file => {
            if (fs.existsSync(file)) {
                try {
                    const content = fs.readFileSync(file, 'utf8');

                    if (content.includes('debug: true')) {
                        this.addVulnerability({
                            type: 'configuration',
                            file: file,
                            severity: 'medium',
                            title: '디버그 모드 활성화',
                            description: '프로덕션에서 디버그 모드가 활성화되어 있습니다.',
                            recommendation: '프로덕션에서는 디버그 모드를 비활성화하세요.',
                            source: 'config analysis'
                        });
                    }
                } catch (error) {
                    console.warn(`⚠️ 설정 파일 읽기 실패: ${file}`);
                }
            }
        });

        console.log('✅ 설정 파일 보안 검사 완료');
    }

    addVulnerability(vuln) {
        this.results.vulnerabilities.push({
            id: this.results.vulnerabilities.length + 1,
            ...vuln,
            timestamp: new Date().toISOString()
        });

        this.results.summary.total++;
        this.results.summary[vuln.severity]++;
    }

    analyzeResults() {
        console.log('\n📊 보안 감사 결과:');
        console.log(`  🔴 Critical: ${this.results.summary.critical}개`);
        console.log(`  🟠 High: ${this.results.summary.high}개`);
        console.log(`  🟡 Medium: ${this.results.summary.medium}개`);
        console.log(`  🟢 Low: ${this.results.summary.low}개`);
    }

    generateReport() {
        if (!fs.existsSync('reports')) {
            fs.mkdirSync('reports');
        }

        fs.writeFileSync('reports/security-audit-report.json',
            JSON.stringify(this.results, null, 2));

        console.log('\n📄 보안 감사 보고서 생성 완료: reports/security-audit-report.json');
    }

    findFiles(patterns) {
        const files = [];

        function walkDir(dir) {
            const items = fs.readdirSync(dir);

            items.forEach(item => {
                const fullPath = require('path').join(dir, item);
                const stat = fs.statSync(fullPath);

                if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
                    walkDir(fullPath);
                } else if (stat.isFile()) {
                    const ext = require('path').extname(item);
                    if (['.js', '.ts', '.jsx', '.tsx'].includes(ext)) {
                        files.push(fullPath);
                    }
                }
            });
        }

        walkDir('.');
        return files;
    }
}

// 스크립트 실행
async function runSecurityAudit() {
    const auditor = new SecurityAuditor();
    await auditor.runAudit();
}

if (require.main === module) {
    runSecurityAudit();
}

module.exports = { SecurityAuditor, runSecurityAudit };