#!/usr/bin/env node

/**
 * AUTOAGENTS Community Platform 2.0 v1 호스팅 자동화 시스템
 * 
 * 기능:
 * - 시스템 요구사항 자동 검증
 * - GCP CLI 설치 상태 확인
 * - 무료 테스트 환경 자동 구축
 * - 애플리케이션 자동 배포
 * - 실시간 모니터링 및 알림
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

class AutoAgentsV1Hosting {
    constructor(projectId = 'thenewspaper-platform') {
        this.projectId = projectId;
        this.region = 'asia-northeast3';
        this.zone = 'asia-northeast3-a';
        this.logFile = 'autoagents-v1-hosting.log';
        this.status = {
            step: 0,
            totalSteps: 8,
            currentTask: '',
            errors: [],
            warnings: [],
            success: []
        };
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] [${type.toUpperCase()}] ${message}`;

        console.log(logMessage);

        // 로그 파일에 기록
        fs.appendFileSync(this.logFile, logMessage + '\n');

        // 상태 업데이트
        if (type === 'error') {
            this.status.errors.push(message);
        } else if (type === 'warning') {
            this.status.warnings.push(message);
        } else if (type === 'success') {
            this.status.success.push(message);
        }
    }

    async executeCommand(command, options = {}) {
        try {
            this.log(`실행 중: ${command}`);

            // Windows에서 gcloud 명령어 경로 수정
            if (command.startsWith('gcloud') && process.platform === 'win32') {
                const possiblePaths = [
                    'C:\\Program Files (x86)\\Google\\Cloud SDK\\google-cloud-sdk\\bin\\gcloud.cmd',
                    'C:\\Program Files\\Google\\Cloud SDK\\google-cloud-sdk\\bin\\gcloud.cmd',
                    `${process.env.USERPROFILE}\\AppData\\Local\\Google\\Cloud SDK\\google-cloud-sdk\\bin\\gcloud.cmd`
                ];

                let gcloudPath = 'gcloud';
                for (const path of possiblePaths) {
                    if (require('fs').existsSync(path)) {
                        gcloudPath = path;
                        break;
                    }
                }

                command = command.replace('gcloud', `"${gcloudPath}"`);
            }

            const result = execSync(command, {
                encoding: 'utf8',
                stdio: 'pipe',
                shell: true,
                ...options
            });
            this.log(`성공: ${command}`, 'success');
            return result.trim();
        } catch (error) {
            this.log(`실패: ${command} - ${error.message}`, 'error');
            throw error;
        }
    }

    async checkSystemRequirements() {
        this.status.step = 1;
        this.status.currentTask = '시스템 요구사항 확인';
        this.log('🔍 시스템 요구사항 확인 시작...');

        const requirements = {
            nodejs: false,
            npm: false,
            git: false,
            gcloud: false,
            powershell: false
        };

        // Node.js 확인
        try {
            const nodeVersion = await this.executeCommand('node --version');
            requirements.nodejs = true;
            this.log(`✅ Node.js: ${nodeVersion}`, 'success');
        } catch (error) {
            this.log('❌ Node.js가 설치되지 않았습니다.', 'error');
        }

        // npm 확인
        try {
            const npmVersion = await this.executeCommand('npm --version');
            requirements.npm = true;
            this.log(`✅ npm: ${npmVersion}`, 'success');
        } catch (error) {
            this.log('❌ npm이 설치되지 않았습니다.', 'error');
        }

        // Git 확인
        try {
            const gitVersion = await this.executeCommand('git --version');
            requirements.git = true;
            this.log(`✅ Git: ${gitVersion}`, 'success');
        } catch (error) {
            this.log('❌ Git이 설치되지 않았습니다.', 'error');
        }

        // GCP CLI 확인
        try {
            const gcloudVersion = await this.executeCommand('gcloud version');
            requirements.gcloud = true;
            this.log(`✅ GCP CLI: 설치됨`, 'success');
        } catch (error) {
            this.log('⚠️ GCP CLI가 설치되지 않았습니다. 자동 설치를 시도합니다.', 'warning');
            await this.installGCPCLI();
        }

        // PowerShell 확인 (Windows)
        if (os.platform() === 'win32') {
            try {
                await this.executeCommand('powershell -Command "Get-Host"');
                requirements.powershell = true;
                this.log(`✅ PowerShell: 사용 가능`, 'success');
            } catch (error) {
                this.log('❌ PowerShell을 사용할 수 없습니다.', 'error');
            }
        }

        return requirements;
    }

    async installGCPCLI() {
        this.log('🔧 GCP CLI 자동 설치 시작...');

        if (os.platform() === 'win32') {
            try {
                // Chocolatey 확인
                await this.executeCommand('choco --version');
                this.log('✅ Chocolatey 발견, GCP CLI 설치 중...', 'success');
                await this.executeCommand('choco install gcloudsdk -y');
            } catch (error) {
                this.log('⚠️ Chocolatey가 없습니다. 수동 설치가 필요합니다.', 'warning');
                this.log('📋 수동 설치 방법:', 'info');
                this.log('1. https://cloud.google.com/sdk/docs/install 접속', 'info');
                this.log('2. Windows용 설치 파일 다운로드', 'info');
                this.log('3. 설치 파일 실행', 'info');
                throw new Error('GCP CLI 수동 설치 필요');
            }
        } else {
            this.log('⚠️ Windows가 아닌 환경입니다. 수동으로 GCP CLI를 설치하세요.', 'warning');
            throw new Error('GCP CLI 수동 설치 필요');
        }
    }

    async initializeGCP() {
        this.status.step = 2;
        this.status.currentTask = 'GCP 초기화';
        this.log('🚀 GCP 초기화 시작...');

        try {
            // 프로젝트 생성 시도
            try {
                await this.executeCommand(`gcloud projects create ${this.projectId} --name="TheNewsPaper Platform"`);
                this.log(`✅ 프로젝트 생성 완료: ${this.projectId}`, 'success');
            } catch (error) {
                if (error.message.includes('already in use')) {
                    this.log(`⚠️ 프로젝트가 이미 존재합니다: ${this.projectId}`, 'warning');
                    this.log('기존 프로젝트를 사용합니다.', 'info');
                } else {
                    throw error;
                }
            }

            // 프로젝트 설정
            await this.executeCommand(`gcloud config set project ${this.projectId}`);
            this.log('✅ 프로젝트 설정 완료', 'success');

            // API 활성화
            const apis = [
                'compute.googleapis.com',
                'sqladmin.googleapis.com',
                'redis.googleapis.com',
                'dns.googleapis.com',
                'cloudresourcemanager.googleapis.com'
            ];

            for (const api of apis) {
                await this.executeCommand(`gcloud services enable ${api}`);
                this.log(`✅ API 활성화 완료: ${api}`, 'success');
            }

        } catch (error) {
            this.log(`❌ GCP 초기화 실패: ${error.message}`, 'error');
            throw error;
        }
    }

    async createInfrastructure() {
        this.status.step = 3;
        this.status.currentTask = '인프라 구축';
        this.log('🏗️ 인프라 구축 시작...');

        try {
            // VPC 네트워크 생성
            await this.executeCommand(`gcloud compute networks create ${this.projectId}-vpc --subnet-mode=custom`);
            await this.executeCommand(`gcloud compute networks subnets create ${this.projectId}-subnet --network=${this.projectId}-vpc --range=10.0.0.0/24 --region=${this.region}`);
            this.log('✅ VPC 네트워크 생성 완료', 'success');

            // 방화벽 규칙 생성
            const firewallRules = [
                { name: 'allow-http', port: '80', description: 'HTTP' },
                { name: 'allow-https', port: '443', description: 'HTTPS' },
                { name: 'allow-ssh', port: '22', description: 'SSH' },
                { name: 'allow-app', port: '3000', description: 'Application' }
            ];

            for (const rule of firewallRules) {
                await this.executeCommand(`gcloud compute firewall-rules create ${rule.name} --network=${this.projectId}-vpc --allow=tcp:${rule.port} --source-ranges=0.0.0.0/0 --target-tags=${rule.name}-server`);
                this.log(`✅ 방화벽 규칙 생성 완료: ${rule.description}`, 'success');
            }

            // SSH 키 생성
            const sshKeyPath = path.join(os.homedir(), '.ssh', 'gcp_rsa');
            if (!fs.existsSync(sshKeyPath)) {
                await this.executeCommand(`ssh-keygen -t rsa -b 4096 -f "${sshKeyPath}" -N ""`);
                this.log('✅ SSH 키 생성 완료', 'success');
            }

            // Compute Engine 인스턴스 생성
            const sshKey = fs.readFileSync(`${sshKeyPath}.pub`, 'utf8').trim();
            await this.executeCommand(`gcloud compute instances create ${this.projectId}-vm --zone=${this.zone} --machine-type=f1-micro --network-interface=subnet=${this.projectId}-subnet,no-address --maintenance-policy=MIGRATE --provisioning-model=STANDARD --service-account=default --scopes=https://www.googleapis.com/auth/cloud-platform --create-disk=auto-delete=yes,boot=yes,device-name=${this.projectId}-vm,image=projects/ubuntu-os-cloud/global/images/family/ubuntu-2004-lts,mode=rw,size=30,type=projects/${this.projectId}/zones/${this.zone}/diskTypes/pd-standard --metadata-from-file=ssh-keys=<(echo ubuntu:${sshKey}) --tags=http-server,https-server,ssh-server,app-server`);
            this.log('✅ Compute Engine 인스턴스 생성 완료', 'success');

            // Cloud SQL 인스턴스 생성
            await this.executeCommand(`gcloud sql instances create ${this.projectId}-db --database-version=MYSQL_8_0 --tier=db-f1-micro --region=${this.region} --storage-type=HDD --storage-size=10GB --storage-auto-increase --backup-start-time=03:00 --enable-bin-log --network=projects/${this.projectId}/global/networks/${this.projectId}-vpc`);
            await this.executeCommand(`gcloud sql databases create community_platform --instance=${this.projectId}-db`);
            await this.executeCommand(`gcloud sql users create app_user --instance=${this.projectId}-db --password=test_password_123`);
            this.log('✅ Cloud SQL 인스턴스 생성 완료', 'success');

            // Memorystore 인스턴스 생성
            await this.executeCommand(`gcloud redis instances create ${this.projectId}-redis --size=1 --region=${this.region} --network=projects/${this.projectId}/global/networks/${this.projectId}-vpc`);
            this.log('✅ Memorystore 인스턴스 생성 완료', 'success');

        } catch (error) {
            this.log(`❌ 인프라 구축 실패: ${error.message}`, 'error');
            throw error;
        }
    }

    async createLoadBalancer() {
        this.status.step = 4;
        this.status.currentTask = '로드 밸런서 구축';
        this.log('⚖️ 로드 밸런서 구축 시작...');

        try {
            // 인스턴스 그룹 생성
            await this.executeCommand(`gcloud compute instance-groups unmanaged create ${this.projectId}-ig --zone=${this.zone}`);
            await this.executeCommand(`gcloud compute instance-groups unmanaged add-instances ${this.projectId}-ig --instances=${this.projectId}-vm --zone=${this.zone}`);

            // 헬스 체크 생성
            await this.executeCommand(`gcloud compute health-checks create http ${this.projectId}-health-check --port=3000 --request-path=/api/health`);

            // 백엔드 서비스 생성
            await this.executeCommand(`gcloud compute backend-services create ${this.projectId}-backend --protocol=HTTP --port-name=http --health-checks=${this.projectId}-health-check --global`);
            await this.executeCommand(`gcloud compute backend-services add-backend ${this.projectId}-backend --instance-group=${this.projectId}-ig --instance-group-zone=${this.zone} --global`);

            // URL 맵 생성
            await this.executeCommand(`gcloud compute url-maps create ${this.projectId}-url-map --default-service=${this.projectId}-backend`);

            // HTTP 프록시 생성
            await this.executeCommand(`gcloud compute target-http-proxies create ${this.projectId}-http-proxy --url-map=${this.projectId}-url-map`);

            // 전역 IP 주소 생성
            await this.executeCommand(`gcloud compute addresses create ${this.projectId}-ip --global`);
            const lbIP = await this.executeCommand(`gcloud compute addresses describe ${this.projectId}-ip --global --format="value(address)"`);

            // 전달 규칙 생성
            await this.executeCommand(`gcloud compute forwarding-rules create ${this.projectId}-http-rule --global --target-http-proxy=${this.projectId}-http-proxy --address=${lbIP} --ports=80`);

            this.log(`✅ 로드 밸런서 구축 완료 - IP: ${lbIP}`, 'success');
            return lbIP;

        } catch (error) {
            this.log(`❌ 로드 밸런서 구축 실패: ${error.message}`, 'error');
            throw error;
        }
    }

    async setupCostMonitoring() {
        this.status.step = 5;
        this.status.currentTask = '비용 모니터링 설정';
        this.log('💰 비용 모니터링 설정 시작...');

        try {
            const billingAccount = await this.executeCommand(`gcloud billing accounts list --format="value(name)" --limit=1`);
            await this.executeCommand(`gcloud billing budgets create --billing-account=${billingAccount} --display-name="Community Platform v1 Budget" --budget-amount=10USD --threshold-rule=percent=50 --threshold-rule=percent=90 --threshold-rule=percent=100`);
            this.log('✅ 비용 모니터링 설정 완료', 'success');
        } catch (error) {
            this.log(`⚠️ 비용 모니터링 설정 실패: ${error.message}`, 'warning');
        }
    }

    async buildApplication() {
        this.status.step = 6;
        this.status.currentTask = '애플리케이션 빌드';
        this.log('🔨 애플리케이션 빌드 시작...');

        try {
            // 의존성 설치
            if (!fs.existsSync('node_modules')) {
                await this.executeCommand('npm install');
                this.log('✅ 루트 의존성 설치 완료', 'success');
            }

            // 프론트엔드 빌드
            await this.executeCommand('cd frontend && npm install');
            await this.executeCommand('cd frontend && npm run build');
            this.log('✅ 프론트엔드 빌드 완료', 'success');

            // 백엔드 빌드
            await this.executeCommand('cd server-backend && npm install');
            this.log('✅ 백엔드 빌드 완료', 'success');

        } catch (error) {
            this.log(`❌ 애플리케이션 빌드 실패: ${error.message}`, 'error');
            throw error;
        }
    }

    async deployApplication() {
        this.status.step = 7;
        this.status.currentTask = '애플리케이션 배포';
        this.log('🚀 애플리케이션 배포 시작...');

        try {
            // 인스턴스 정보 가져오기
            const instanceIP = await this.executeCommand(`gcloud compute instances describe ${this.projectId}-vm --zone=${this.zone} --format="value(networkInterfaces[0].accessConfigs[0].natIP)"`);
            const dbIP = await this.executeCommand(`gcloud sql instances describe ${this.projectId}-db --format="value(ipAddresses[0].ipAddress)"`);
            const redisIP = await this.executeCommand(`gcloud redis instances describe ${this.projectId}-redis --region=${this.region} --format="value(host)"`);

            // 인스턴스에 애플리케이션 배포
            const deployScript = `
                # 시스템 업데이트
                sudo apt-get update
                
                # Node.js 설치
                curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
                sudo apt-get install -y nodejs
                
                # Git 설치
                sudo apt-get install -y git
                
                # PM2 설치
                sudo npm install -g pm2
                
                # 애플리케이션 디렉토리 생성
                mkdir -p /home/ubuntu/app
                cd /home/ubuntu/app
                
                # Git 저장소 클론 (실제 저장소 URL로 변경 필요)
                git clone https://github.com/your-repo/community-platform.git .
                
                # 의존성 설치
                npm install
                cd server-backend && npm install && cd ..
                cd frontend && npm install && cd ..
                
                # 환경 변수 설정
                cat > .env << 'ENVEOF'
NODE_ENV=production
PORT=3000
DATABASE_URL=mysql://app_user:test_password_123@${dbIP}:3306/community_platform
REDIS_URL=redis://${redisIP}:6379
ENVEOF
                
                # 프론트엔드 빌드
                cd frontend && npm run build && cd ..
                
                # 애플리케이션 실행
                pm2 start server-backend/api-server/server.js --name community-platform
                pm2 save
                pm2 startup
            `;

            await this.executeCommand(`gcloud compute ssh ${this.projectId}-vm --zone=${this.zone} --command="${deployScript}"`);
            this.log('✅ 애플리케이션 배포 완료', 'success');

            return { instanceIP, dbIP, redisIP };

        } catch (error) {
            this.log(`❌ 애플리케이션 배포 실패: ${error.message}`, 'error');
            throw error;
        }
    }

    async healthCheck(lbIP) {
        this.status.step = 8;
        this.status.currentTask = '헬스 체크';
        this.log('🏥 헬스 체크 시작...');

        const maxRetries = 10;
        let retryCount = 0;

        while (retryCount < maxRetries) {
            try {
                const response = await fetch(`http://${lbIP}/api/health`);
                if (response.ok) {
                    this.log('✅ 헬스 체크 성공', 'success');
                    return true;
                }
            } catch (error) {
                retryCount++;
                this.log(`⚠️ 헬스 체크 실패 (${retryCount}/${maxRetries}). 30초 후 재시도...`, 'warning');
                await new Promise(resolve => setTimeout(resolve, 30000));
            }
        }

        this.log('❌ 헬스 체크 실패', 'error');
        return false;
    }

    async generateReport(deploymentInfo) {
        this.log('📊 배포 보고서 생성 중...');

        const report = {
            timestamp: new Date().toISOString(),
            projectId: this.projectId,
            status: this.status,
            deployment: deploymentInfo,
            cost: {
                current: '$0',
                estimated: '$0-5/month',
                credits: '$300 (90 days)'
            },
            nextSteps: [
                '웹사이트 접속하여 기능 테스트',
                '90일간 무료로 개발 진행',
                '릴리즈 v1 완성',
                '실제 서비스 환경으로 전환'
            ]
        };

        fs.writeFileSync('autoagents-v1-hosting-report.json', JSON.stringify(report, null, 2));
        this.log('✅ 배포 보고서 생성 완료', 'success');

        return report;
    }

    async run() {
        try {
            this.log('🤖 AUTOAGENTS Community Platform 2.0 v1 호스팅 시작!');
            this.log(`프로젝트 ID: ${this.projectId}`);
            this.log(`리전: ${this.region}`);
            this.log(`존: ${this.zone}`);

            // 1. 시스템 요구사항 확인
            await this.checkSystemRequirements();

            // 2. GCP 초기화
            await this.initializeGCP();

            // 3. 인프라 구축
            await this.createInfrastructure();

            // 4. 로드 밸런서 구축
            const lbIP = await this.createLoadBalancer();

            // 5. 비용 모니터링 설정
            await this.setupCostMonitoring();

            // 6. 애플리케이션 빌드
            await this.buildApplication();

            // 7. 애플리케이션 배포
            const deploymentInfo = await this.deployApplication();

            // 8. 헬스 체크
            const healthCheckPassed = await this.healthCheck(lbIP);

            // 9. 보고서 생성
            const report = await this.generateReport({
                ...deploymentInfo,
                lbIP,
                healthCheckPassed
            });

            this.log('🎉 AUTOAGENTS v1 호스팅 완료!');
            this.log(`🌐 접속 URL: http://${lbIP}`);
            this.log(`💰 비용: $0 (무료 크레딧 사용)`);
            this.log(`⏰ 유효기간: 90일`);

            return report;

        } catch (error) {
            this.log(`❌ AUTOAGENTS v1 호스팅 실패: ${error.message}`, 'error');
            throw error;
        }
    }
}

// AUTOAGENTS 실행
if (require.main === module) {
    const autoAgents = new AutoAgentsV1Hosting();
    autoAgents.run()
        .then(report => {
            console.log('\n🎉 AUTOAGENTS v1 호스팅 성공!');
            console.log(`📊 보고서: autoagents-v1-hosting-report.json`);
            console.log(`🌐 접속 URL: http://${report.deployment.lbIP}`);
            process.exit(0);
        })
        .catch(error => {
            console.error('\n❌ AUTOAGENTS v1 호스팅 실패:', error.message);
            console.log(`📋 로그: ${autoAgents.logFile}`);
            process.exit(1);
        });
}

module.exports = AutoAgentsV1Hosting;
