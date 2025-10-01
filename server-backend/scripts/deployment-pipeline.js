const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const execAsync = promisify(exec);

// 배포 파이프라인 클래스
class DeploymentPipeline {
    constructor() {
        this.deployments = new Map();
        this.deploymentIdCounter = 1;
    }

    // 배포 시작
    async startDeployment(releaseId, environment, options = {}) {
        const deploymentId = `deploy_${this.deploymentIdCounter++}`;
        const deployment = {
            id: deploymentId,
            releaseId,
            environment,
            status: 'pending',
            startTime: new Date(),
            endTime: null,
            steps: [],
            logs: [],
            options: {
                autoRollback: true,
                healthCheck: true,
                notification: true,
                ...options
            }
        };

        this.deployments.set(deploymentId, deployment);

        try {
            // 1. 사전 검증
            await this.preDeploymentCheck(releaseId, environment);
            this.addStep(deploymentId, 'pre_check', 'success', '사전 검증 완료');

            // 2. 빌드
            await this.buildRelease(releaseId);
            this.addStep(deploymentId, 'build', 'success', '빌드 완료');

            // 3. 테스트
            await this.runTests(releaseId);
            this.addStep(deploymentId, 'test', 'success', '테스트 완료');

            // 4. 배포
            await this.deployToEnvironment(releaseId, environment);
            this.addStep(deploymentId, 'deploy', 'success', '배포 완료');

            // 5. 헬스 체크
            if (options.healthCheck) {
                await this.healthCheck(environment);
                this.addStep(deploymentId, 'health_check', 'success', '헬스 체크 완료');
            }

            // 6. 배포 완료
            deployment.status = 'success';
            deployment.endTime = new Date();
            this.addStep(deploymentId, 'complete', 'success', '배포 완료');

            // 알림 전송
            if (options.notification) {
                await this.sendNotification(deploymentId, 'success');
            }

            return deployment;

        } catch (error) {
            deployment.status = 'failed';
            deployment.endTime = new Date();
            this.addStep(deploymentId, 'error', 'failed', error.message);

            // 자동 롤백
            if (options.autoRollback) {
                await this.rollback(deploymentId);
            }

            // 알림 전송
            if (options.notification) {
                await this.sendNotification(deploymentId, 'failed');
            }

            throw error;
        }
    }

    // 사전 검증
    async preDeploymentCheck(releaseId, environment) {
        this.addLog(releaseId, '사전 검증 시작...');

        // 릴리즈 파일 존재 확인
        const releasePath = path.join(__dirname, '../../releases', releaseId);
        const releaseExists = await fs.access(releasePath).then(() => true).catch(() => false);

        if (!releaseExists) {
            throw new Error(`릴리즈 파일을 찾을 수 없습니다: ${releaseId}`);
        }

        // 환경별 설정 확인
        const envConfig = await this.getEnvironmentConfig(environment);
        if (!envConfig) {
            throw new Error(`환경 설정을 찾을 수 없습니다: ${environment}`);
        }

        // 의존성 확인
        await this.checkDependencies(envConfig);

        this.addLog(releaseId, '사전 검증 완료');
    }

    // 빌드
    async buildRelease(releaseId) {
        this.addLog(releaseId, '빌드 시작...');

        const buildCommands = [
            'npm ci',
            'npm run build',
            'npm run test:unit',
            'npm run lint'
        ];

        for (const command of buildCommands) {
            try {
                const { stdout, stderr } = await execAsync(command, {
                    cwd: path.join(__dirname, '../../'),
                    timeout: 300000 // 5분 타임아웃
                });

                this.addLog(releaseId, `명령 실행: ${command}`);
                if (stdout) this.addLog(releaseId, stdout);
                if (stderr) this.addLog(releaseId, stderr);
            } catch (error) {
                throw new Error(`빌드 실패: ${command} - ${error.message}`);
            }
        }

        this.addLog(releaseId, '빌드 완료');
    }

    // 테스트 실행
    async runTests(releaseId) {
        this.addLog(releaseId, '테스트 실행...');

        const testCommands = [
            'npm run test:unit',
            'npm run test:integration',
            'npm run test:e2e'
        ];

        for (const command of testCommands) {
            try {
                const { stdout, stderr } = await execAsync(command, {
                    cwd: path.join(__dirname, '../../'),
                    timeout: 600000 // 10분 타임아웃
                });

                this.addLog(releaseId, `테스트 실행: ${command}`);
                if (stdout) this.addLog(releaseId, stdout);
                if (stderr) this.addLog(releaseId, stderr);
            } catch (error) {
                throw new Error(`테스트 실패: ${command} - ${error.message}`);
            }
        }

        this.addLog(releaseId, '테스트 완료');
    }

    // 환경별 배포
    async deployToEnvironment(releaseId, environment) {
        this.addLog(releaseId, `${environment} 환경에 배포 시작...`);

        const envConfig = await this.getEnvironmentConfig(environment);

        switch (environment) {
            case 'development':
                await this.deployToDevelopment(releaseId, envConfig);
                break;
            case 'staging':
                await this.deployToStaging(releaseId, envConfig);
                break;
            case 'production':
                await this.deployToProduction(releaseId, envConfig);
                break;
            default:
                throw new Error(`지원하지 않는 환경: ${environment}`);
        }

        this.addLog(releaseId, `${environment} 환경 배포 완료`);
    }

    // 개발 환경 배포
    async deployToDevelopment(releaseId, config) {
        this.addLog(releaseId, '개발 환경 배포...');

        // Docker 컨테이너 빌드
        await execAsync(`docker build -t app:${releaseId} .`, {
            cwd: path.join(__dirname, '../../')
        });

        // Docker Compose로 배포
        await execAsync(`docker-compose -f docker-compose.dev.yml up -d`, {
            cwd: path.join(__dirname, '../../')
        });

        this.addLog(releaseId, '개발 환경 배포 완료');
    }

    // 스테이징 환경 배포
    async deployToStaging(releaseId, config) {
        this.addLog(releaseId, '스테이징 환경 배포...');

        // Kubernetes 배포
        await execAsync(`kubectl apply -f k8s/staging/`, {
            cwd: path.join(__dirname, '../../')
        });

        // 배포 상태 확인
        await execAsync(`kubectl rollout status deployment/app-staging`);

        this.addLog(releaseId, '스테이징 환경 배포 완료');
    }

    // 프로덕션 환경 배포
    async deployToProduction(releaseId, config) {
        this.addLog(releaseId, '프로덕션 환경 배포...');

        // Blue-Green 배포
        await this.blueGreenDeployment(releaseId, config);

        this.addLog(releaseId, '프로덕션 환경 배포 완료');
    }

    // Blue-Green 배포
    async blueGreenDeployment(releaseId, config) {
        this.addLog(releaseId, 'Blue-Green 배포 시작...');

        // 현재 활성 환경 확인
        const currentEnv = await this.getCurrentActiveEnvironment();
        const newEnv = currentEnv === 'blue' ? 'green' : 'blue';

        // 새 환경에 배포
        await execAsync(`kubectl apply -f k8s/production/${newEnv}/`, {
            cwd: path.join(__dirname, '../../')
        });

        // 새 환경 헬스 체크
        await this.healthCheck(`production-${newEnv}`);

        // 트래픽 전환
        await this.switchTraffic(newEnv);

        // 이전 환경 정리
        await this.cleanupEnvironment(currentEnv);

        this.addLog(releaseId, 'Blue-Green 배포 완료');
    }

    // 헬스 체크
    async healthCheck(environment) {
        this.addLog(environment, '헬스 체크 시작...');

        const healthCheckUrl = await this.getHealthCheckUrl(environment);
        const maxRetries = 10;
        const retryInterval = 5000; // 5초

        for (let i = 0; i < maxRetries; i++) {
            try {
                const response = await fetch(healthCheckUrl);
                if (response.ok) {
                    this.addLog(environment, '헬스 체크 성공');
                    return;
                }
            } catch (error) {
                this.addLog(environment, `헬스 체크 실패 (${i + 1}/${maxRetries}): ${error.message}`);
            }

            if (i < maxRetries - 1) {
                await new Promise(resolve => setTimeout(resolve, retryInterval));
            }
        }

        throw new Error('헬스 체크 실패');
    }

    // 롤백
    async rollback(deploymentId) {
        const deployment = this.deployments.get(deploymentId);
        if (!deployment) {
            throw new Error('배포 정보를 찾을 수 없습니다.');
        }

        this.addLog(deploymentId, '롤백 시작...');

        try {
            // 이전 버전으로 롤백
            await execAsync(`kubectl rollout undo deployment/app-${deployment.environment}`);

            // 롤백 상태 확인
            await execAsync(`kubectl rollout status deployment/app-${deployment.environment}`);

            this.addLog(deploymentId, '롤백 완료');
        } catch (error) {
            this.addLog(deploymentId, `롤백 실패: ${error.message}`);
            throw error;
        }
    }

    // 환경 설정 가져오기
    async getEnvironmentConfig(environment) {
        const configPath = path.join(__dirname, `../../config/${environment}.json`);
        try {
            const configData = await fs.readFile(configPath, 'utf8');
            return JSON.parse(configData);
        } catch (error) {
            return null;
        }
    }

    // 의존성 확인
    async checkDependencies(config) {
        // 필요한 서비스들이 실행 중인지 확인
        const requiredServices = config.requiredServices || [];

        for (const service of requiredServices) {
            try {
                await execAsync(`kubectl get service ${service}`);
            } catch (error) {
                throw new Error(`필수 서비스가 실행되지 않음: ${service}`);
            }
        }
    }

    // 현재 활성 환경 확인
    async getCurrentActiveEnvironment() {
        try {
            const { stdout } = await execAsync('kubectl get service app-lb -o jsonpath="{.spec.selector.environment}"');
            return stdout.trim();
        } catch (error) {
            return 'blue'; // 기본값
        }
    }

    // 트래픽 전환
    async switchTraffic(environment) {
        await execAsync(`kubectl patch service app-lb -p '{"spec":{"selector":{"environment":"${environment}"}}}'`);
    }

    // 환경 정리
    async cleanupEnvironment(environment) {
        await execAsync(`kubectl delete deployment app-${environment}`);
    }

    // 헬스 체크 URL 가져오기
    async getHealthCheckUrl(environment) {
        const config = await this.getEnvironmentConfig(environment);
        return config?.healthCheckUrl || `http://app-${environment}.local/health`;
    }

    // 알림 전송
    async sendNotification(deploymentId, status) {
        const deployment = this.deployments.get(deploymentId);
        if (!deployment) return;

        const message = {
            deploymentId,
            releaseId: deployment.releaseId,
            environment: deployment.environment,
            status,
            startTime: deployment.startTime,
            endTime: deployment.endTime,
            duration: deployment.endTime ? deployment.endTime - deployment.startTime : null
        };

        // Slack 알림
        if (process.env.SLACK_WEBHOOK_URL) {
            await this.sendSlackNotification(message);
        }

        // 이메일 알림
        if (process.env.EMAIL_SERVICE) {
            await this.sendEmailNotification(message);
        }
    }

    // Slack 알림
    async sendSlackNotification(message) {
        const slackMessage = {
            text: `배포 ${message.status}: ${message.releaseId}`,
            attachments: [{
                color: message.status === 'success' ? 'good' : 'danger',
                fields: [
                    { title: '환경', value: message.environment, short: true },
                    { title: '상태', value: message.status, short: true },
                    { title: '시작 시간', value: message.startTime.toISOString(), short: true },
                    { title: '종료 시간', value: message.endTime?.toISOString() || 'N/A', short: true }
                ]
            }]
        };

        await fetch(process.env.SLACK_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(slackMessage)
        });
    }

    // 이메일 알림
    async sendEmailNotification(message) {
        // 실제로는 이메일 서비스 사용
        console.log('이메일 알림:', message);
    }

    // 단계 추가
    addStep(deploymentId, step, status, message) {
        const deployment = this.deployments.get(deploymentId);
        if (deployment) {
            deployment.steps.push({
                step,
                status,
                message,
                timestamp: new Date()
            });
        }
    }

    // 로그 추가
    addLog(deploymentId, message) {
        const deployment = this.deployments.get(deploymentId);
        if (deployment) {
            deployment.logs.push({
                message,
                timestamp: new Date()
            });
        }
    }

    // 배포 상태 조회
    getDeploymentStatus(deploymentId) {
        return this.deployments.get(deploymentId);
    }

    // 모든 배포 조회
    getAllDeployments() {
        return Array.from(this.deployments.values());
    }
}

module.exports = DeploymentPipeline;
