// 배포 자동화 스크립트
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class DeployAutomation {
    constructor(environment = 'staging') {
        this.environment = environment;
        this.config = this.loadConfig();
        this.results = {
            timestamp: new Date().toISOString(),
            environment: environment,
            steps: [],
            success: false,
            error: null
        };
    }

    // 설정 로드
    loadConfig() {
        const configPath = path.join(__dirname, `../config/deploy-${this.environment}.json`);

        if (fs.existsSync(configPath)) {
            return JSON.parse(fs.readFileSync(configPath, 'utf8'));
        }

        // 기본 설정
        return {
            environment: this.environment,
            docker: {
                registry: 'ghcr.io',
                imageName: 'community-platform',
                tag: this.environment === 'production' ? 'latest' : 'staging'
            },
            services: {
                backend: {
                    port: 50000,
                    healthCheck: '/api/health'
                },
                frontend: {
                    port: 3000,
                    healthCheck: '/'
                }
            },
            database: {
                host: 'localhost',
                port: 3306,
                name: `community_${this.environment}`
            },
            redis: {
                host: 'localhost',
                port: 6379
            }
        };
    }

    // 메인 배포 실행
    async deploy() {
        console.log(`🚀 ${this.environment} 환경 배포 시작...`);

        try {
            // 1. 사전 검사
            await this.preDeploymentChecks();

            // 2. 빌드
            await this.build();

            // 3. 테스트
            await this.runTests();

            // 4. 배포
            await this.deployServices();

            // 5. 검증
            await this.verifyDeployment();

            // 6. 정리
            await this.cleanup();

            this.results.success = true;
            console.log(`✅ ${this.environment} 환경 배포 완료!`);

        } catch (error) {
            this.results.error = error.message;
            console.error(`❌ ${this.environment} 환경 배포 실패:`, error);

            // 롤백 시도
            await this.rollback();
            throw error;
        }
    }

    // 사전 배포 검사
    async preDeploymentChecks() {
        console.log('🔍 사전 배포 검사...');

        const checks = [
            {
                name: 'Git 상태 확인',
                command: 'git status --porcelain',
                expected: ''
            },
            {
                name: 'Docker 설치 확인',
                command: 'docker --version',
                expected: 'Docker version'
            },
            {
                name: 'Node.js 버전 확인',
                command: 'node --version',
                expected: 'v18'
            },
            {
                name: '환경 변수 확인',
                command: 'echo $NODE_ENV',
                expected: this.environment
            }
        ];

        for (const check of checks) {
            try {
                const result = execSync(check.command, { encoding: 'utf8' }).trim();

                if (check.expected && !result.includes(check.expected)) {
                    throw new Error(`${check.name} 실패: 예상값 "${check.expected}"과 다름`);
                }

                this.addStep(check.name, 'success', result);
                console.log(`  ✅ ${check.name}`);

            } catch (error) {
                this.addStep(check.name, 'error', error.message);
                console.log(`  ❌ ${check.name}: ${error.message}`);
                throw error;
            }
        }
    }

    // 빌드
    async build() {
        console.log('🔨 애플리케이션 빌드...');

        try {
            // 백엔드 빌드
            console.log('  📦 백엔드 빌드...');
            execSync('cd server-backend && npm run build', { stdio: 'inherit' });
            this.addStep('백엔드 빌드', 'success', '빌드 완료');

            // 프론트엔드 빌드
            console.log('  🎨 프론트엔드 빌드...');
            execSync('cd frontend && npm run build', { stdio: 'inherit' });
            this.addStep('프론트엔드 빌드', 'success', '빌드 완료');

            // Docker 이미지 빌드
            console.log('  🐳 Docker 이미지 빌드...');
            const imageTag = `${this.config.docker.registry}/${this.config.docker.imageName}:${this.config.docker.tag}`;
            execSync(`docker build -t ${imageTag} .`, { stdio: 'inherit' });
            this.addStep('Docker 이미지 빌드', 'success', `이미지: ${imageTag}`);

        } catch (error) {
            this.addStep('빌드', 'error', error.message);
            throw error;
        }
    }

    // 테스트 실행
    async runTests() {
        console.log('🧪 배포 전 테스트...');

        try {
            // 단위 테스트
            console.log('  🔬 단위 테스트...');
            execSync('cd server-backend && npm run test:unit', { stdio: 'inherit' });
            this.addStep('단위 테스트', 'success', '모든 테스트 통과');

            // 통합 테스트
            console.log('  🔗 통합 테스트...');
            execSync('cd server-backend && npm run test:integration', { stdio: 'inherit' });
            this.addStep('통합 테스트', 'success', '모든 테스트 통과');

            // 보안 테스트
            console.log('  🔒 보안 테스트...');
            execSync('node scripts/security-audit.js', { stdio: 'inherit' });
            this.addStep('보안 테스트', 'success', '보안 검사 통과');

        } catch (error) {
            this.addStep('테스트', 'error', error.message);
            throw error;
        }
    }

    // 서비스 배포
    async deployServices() {
        console.log('🚀 서비스 배포...');

        try {
            // 기존 서비스 중지
            console.log('  ⏹️ 기존 서비스 중지...');
            this.stopServices();

            // 데이터베이스 마이그레이션
            console.log('  🗄️ 데이터베이스 마이그레이션...');
            execSync('cd server-backend && npm run migrate', { stdio: 'inherit' });
            this.addStep('데이터베이스 마이그레이션', 'success', '마이그레이션 완료');

            // 서비스 시작
            console.log('  ▶️ 서비스 시작...');
            this.startServices();

            // 로드 밸런서 설정
            console.log('  ⚖️ 로드 밸런서 설정...');
            this.configureLoadBalancer();

        } catch (error) {
            this.addStep('서비스 배포', 'error', error.message);
            throw error;
        }
    }

    // 서비스 중지
    stopServices() {
        try {
            // Docker Compose를 사용한 중지
            if (fs.existsSync('docker-compose.yml')) {
                execSync('docker-compose down', { stdio: 'inherit' });
            }

            // 개별 서비스 중지
            execSync('pkill -f "node.*server.js" || true', { stdio: 'inherit' });
            execSync('pkill -f "npm.*start" || true', { stdio: 'inherit' });

            this.addStep('서비스 중지', 'success', '모든 서비스 중지 완료');

        } catch (error) {
            this.addStep('서비스 중지', 'warning', error.message);
        }
    }

    // 서비스 시작
    startServices() {
        try {
            // Docker Compose를 사용한 시작
            if (fs.existsSync('docker-compose.yml')) {
                execSync('docker-compose up -d', { stdio: 'inherit' });
            } else {
                // 개별 서비스 시작
                execSync('cd server-backend && npm start &', { stdio: 'inherit' });
                execSync('cd frontend && npm start &', { stdio: 'inherit' });
            }

            this.addStep('서비스 시작', 'success', '모든 서비스 시작 완료');

        } catch (error) {
            this.addStep('서비스 시작', 'error', error.message);
            throw error;
        }
    }

    // 로드 밸런서 설정
    configureLoadBalancer() {
        try {
            // Nginx 설정 업데이트
            if (fs.existsSync('nginx/nginx.conf')) {
                execSync('sudo nginx -t', { stdio: 'inherit' });
                execSync('sudo systemctl reload nginx', { stdio: 'inherit' });
                this.addStep('로드 밸런서 설정', 'success', 'Nginx 설정 완료');
            }

        } catch (error) {
            this.addStep('로드 밸런서 설정', 'warning', error.message);
        }
    }

    // 배포 검증
    async verifyDeployment() {
        console.log('✅ 배포 검증...');

        const healthChecks = [
            {
                name: '백엔드 헬스 체크',
                url: `http://localhost:${this.config.services.backend.port}${this.config.services.backend.healthCheck}`,
                timeout: 30000
            },
            {
                name: '프론트엔드 헬스 체크',
                url: `http://localhost:${this.config.services.frontend.port}${this.config.services.frontend.healthCheck}`,
                timeout: 30000
            }
        ];

        for (const check of healthChecks) {
            try {
                console.log(`  🔍 ${check.name}...`);

                // 헬스 체크 실행
                const startTime = Date.now();
                let success = false;

                while (Date.now() - startTime < check.timeout) {
                    try {
                        execSync(`curl -f ${check.url}`, { stdio: 'pipe' });
                        success = true;
                        break;
                    } catch (error) {
                        // 아직 준비되지 않음, 잠시 대기
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                }

                if (success) {
                    this.addStep(check.name, 'success', '헬스 체크 통과');
                    console.log(`    ✅ ${check.name} 통과`);
                } else {
                    throw new Error('헬스 체크 시간 초과');
                }

            } catch (error) {
                this.addStep(check.name, 'error', error.message);
                console.log(`    ❌ ${check.name} 실패: ${error.message}`);
                throw error;
            }
        }
    }

    // 정리 작업
    async cleanup() {
        console.log('🧹 정리 작업...');

        try {
            // 오래된 Docker 이미지 정리
            execSync('docker image prune -f', { stdio: 'inherit' });

            // 로그 파일 정리
            execSync('find logs -name "*.log" -mtime +7 -delete || true', { stdio: 'inherit' });

            this.addStep('정리 작업', 'success', '정리 완료');

        } catch (error) {
            this.addStep('정리 작업', 'warning', error.message);
        }
    }

    // 롤백
    async rollback() {
        console.log('🔄 롤백 실행...');

        try {
            // 이전 버전으로 롤백
            execSync('git checkout HEAD~1', { stdio: 'inherit' });

            // 서비스 재시작
            this.stopServices();
            this.startServices();

            this.addStep('롤백', 'success', '이전 버전으로 롤백 완료');

        } catch (error) {
            this.addStep('롤백', 'error', error.message);
            console.error('❌ 롤백 실패:', error);
        }
    }

    // 단계 추가
    addStep(name, status, message) {
        this.results.steps.push({
            name,
            status,
            message,
            timestamp: new Date().toISOString()
        });
    }

    // 배포 보고서 생성
    generateReport() {
        const reportDir = 'reports';
        if (!fs.existsSync(reportDir)) {
            fs.mkdirSync(reportDir, { recursive: true });
        }

        // JSON 보고서
        const jsonReport = JSON.stringify(this.results, null, 2);
        fs.writeFileSync(
            path.join(reportDir, `deploy-${this.environment}-report.json`),
            jsonReport
        );

        // 마크다운 보고서
        const markdownReport = this.generateMarkdownReport();
        fs.writeFileSync(
            path.join(reportDir, `deploy-${this.environment}-report.md`),
            markdownReport
        );

        console.log(`📄 배포 보고서 생성: ${reportDir}/deploy-${this.environment}-report.*`);
    }

    // 마크다운 보고서 생성
    generateMarkdownReport() {
        let report = `# 🚀 배포 보고서\n\n`;
        report += `**환경**: ${this.environment}\n`;
        report += `**일시**: ${new Date().toLocaleString('ko-KR')}\n`;
        report += `**상태**: ${this.results.success ? '✅ 성공' : '❌ 실패'}\n\n`;

        if (this.results.error) {
            report += `## ❌ 오류\n\n`;
            report += `\`\`\`\n${this.results.error}\n\`\`\`\n\n`;
        }

        report += `## 📋 배포 단계\n\n`;
        report += `| 단계 | 상태 | 메시지 | 시간 |\n`;
        report += `|------|------|--------|------|\n`;

        this.results.steps.forEach(step => {
            const status = step.status === 'success' ? '✅' : step.status === 'error' ? '❌' : '⚠️';
            const time = new Date(step.timestamp).toLocaleTimeString('ko-KR');
            report += `| ${step.name} | ${status} | ${step.message} | ${time} |\n`;
        });

        report += `\n---\n\n`;
        report += `*이 보고서는 배포 자동화 스크립트에 의해 생성되었습니다.*\n`;

        return report;
    }
}

// 스크립트 실행
async function runDeployAutomation() {
    const environment = process.argv[2] || 'staging';
    const automation = new DeployAutomation(environment);

    try {
        await automation.deploy();
        automation.generateReport();
        process.exit(0);
    } catch (error) {
        automation.generateReport();
        process.exit(1);
    }
}

// 스크립트가 직접 실행된 경우
if (require.main === module) {
    runDeployAutomation();
}

module.exports = { DeployAutomation, runDeployAutomation };
