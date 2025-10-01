#!/usr/bin/env node

/**
 * 🖥️ 로컬 PC 호스팅 설정 스크립트
 * TheNewsPaper 프로젝트용 로컬 개발 환경 구축
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class LocalHostingSetup {
    constructor() {
        this.projectName = 'TheNewsPaper';
        this.ports = {
            frontend: 3000,
            backend: 5000,
            database: 3306,
            redis: 6379,
            admin: 8080,
            monitoring: 9090
        };
        this.services = [];
        this.logFile = 'local-hosting.log';
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
        console.log(logMessage);

        // 로그 파일에 기록
        fs.appendFileSync(this.logFile, logMessage + '\n');
    }

    async executeCommand(command, options = {}) {
        try {
            this.log(`실행 중: ${command}`);
            const result = execSync(command, {
                encoding: 'utf8',
                stdio: 'pipe',
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
        this.log('🔍 시스템 요구사항 확인 시작...');

        try {
            // Node.js 버전 확인
            const nodeVersion = await this.executeCommand('node --version');
            this.log(`✅ Node.js: ${nodeVersion}`, 'success');

            // npm 버전 확인
            const npmVersion = await this.executeCommand('npm --version');
            this.log(`✅ npm: ${npmVersion}`, 'success');

            // Git 버전 확인
            const gitVersion = await this.executeCommand('git --version');
            this.log(`✅ Git: ${gitVersion}`, 'success');

            // Docker 확인 (선택사항)
            try {
                const dockerVersion = await this.executeCommand('docker --version');
                this.log(`✅ Docker: ${dockerVersion}`, 'success');
            } catch (error) {
                this.log(`⚠️ Docker: 설치되지 않음 (선택사항)`, 'warning');
            }

            // PM2 확인 (선택사항)
            try {
                const pm2Version = await this.executeCommand('pm2 --version');
                this.log(`✅ PM2: ${pm2Version}`, 'success');
            } catch (error) {
                this.log(`⚠️ PM2: 설치되지 않음 (선택사항)`, 'warning');
            }

            this.log('✅ 시스템 요구사항 확인 완료', 'success');
            return true;

        } catch (error) {
            this.log(`❌ 시스템 요구사항 확인 실패: ${error.message}`, 'error');
            return false;
        }
    }

    async installDependencies() {
        this.log('📦 의존성 설치 시작...');

        try {
            // 백엔드 의존성 설치
            this.log('백엔드 의존성 설치 중...');
            await this.executeCommand('npm install', { cwd: './server-backend' });

            // 프론트엔드 의존성 설치
            this.log('프론트엔드 의존성 설치 중...');
            await this.executeCommand('npm install', { cwd: './frontend' });

            // PM2 설치 (프로세스 관리용)
            try {
                await this.executeCommand('npm install -g pm2');
                this.log('✅ PM2 설치 완료', 'success');
            } catch (error) {
                this.log('⚠️ PM2 설치 실패 (선택사항)', 'warning');
            }

            this.log('✅ 의존성 설치 완료', 'success');
            return true;

        } catch (error) {
            this.log(`❌ 의존성 설치 실패: ${error.message}`, 'error');
            return false;
        }
    }

    async createPM2Config() {
        this.log('⚙️ PM2 설정 파일 생성...');

        const pm2Config = {
            apps: [
                {
                    name: 'thenewspaper-backend',
                    script: './server-backend/api-server/server.js',
                    cwd: process.cwd(),
                    instances: 2,
                    exec_mode: 'cluster',
                    env: {
                        NODE_ENV: 'development',
                        PORT: this.ports.backend,
                        DB_HOST: 'localhost',
                        DB_PORT: this.ports.database,
                        REDIS_HOST: 'localhost',
                        REDIS_PORT: this.ports.redis
                    },
                    watch: true,
                    ignore_watch: ['node_modules', 'logs'],
                    max_memory_restart: '2G',
                    error_file: './logs/backend-error.log',
                    out_file: './logs/backend-out.log',
                    log_file: './logs/backend-combined.log',
                    time: true
                },
                {
                    name: 'thenewspaper-frontend',
                    script: 'npm',
                    args: 'start',
                    cwd: './frontend',
                    instances: 1,
                    env: {
                        NODE_ENV: 'development',
                        PORT: this.ports.frontend,
                        REACT_APP_API_URL: `http://localhost:${this.ports.backend}`
                    },
                    watch: true,
                    ignore_watch: ['node_modules', 'build'],
                    max_memory_restart: '1G',
                    error_file: './logs/frontend-error.log',
                    out_file: './logs/frontend-out.log',
                    log_file: './logs/frontend-combined.log',
                    time: true
                }
            ]
        };

        fs.writeFileSync('ecosystem.config.js', `module.exports = ${JSON.stringify(pm2Config, null, 2)};`);
        this.log('✅ PM2 설정 파일 생성 완료', 'success');
    }

    async createDockerCompose() {
        this.log('🐳 Docker Compose 설정 생성...');

        const dockerCompose = `version: '3.8'

services:
  # 데이터베이스
  database:
    image: mariadb:10.6
    container_name: thenewspaper-db
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: thenewspaper
      MYSQL_USER: thenewspaper
      MYSQL_PASSWORD: thenewspaper123
    ports:
      - "${this.ports.database}:3306"
    volumes:
      - db_data:/var/lib/mysql
      - ./database_schema.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - thenewspaper-network

  # Redis 캐시
  redis:
    image: redis:7-alpine
    container_name: thenewspaper-redis
    restart: unless-stopped
    ports:
      - "${this.ports.redis}:6379"
    volumes:
      - redis_data:/data
    networks:
      - thenewspaper-network

  # 백엔드 API
  backend:
    build: ./server-backend
    container_name: thenewspaper-backend
    restart: unless-stopped
    ports:
      - "${this.ports.backend}:5000"
    environment:
      NODE_ENV: development
      DB_HOST: database
      DB_PORT: 3306
      DB_NAME: thenewspaper
      DB_USER: thenewspaper
      DB_PASSWORD: thenewspaper123
      REDIS_HOST: redis
      REDIS_PORT: 6379
    depends_on:
      - database
      - redis
    volumes:
      - ./server-backend:/app
      - /app/node_modules
    networks:
      - thenewspaper-network

  # 프론트엔드
  frontend:
    build: ./frontend
    container_name: thenewspaper-frontend
    restart: unless-stopped
    ports:
      - "${this.ports.frontend}:3000"
    environment:
      NODE_ENV: development
      REACT_APP_API_URL: http://localhost:${this.ports.backend}
    depends_on:
      - backend
    volumes:
      - ./frontend:/app
      - /app/node_modules
    networks:
      - thenewspaper-network

  # Nginx 리버스 프록시
  nginx:
    image: nginx:alpine
    container_name: thenewspaper-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - backend
    networks:
      - thenewspaper-network

volumes:
  db_data:
  redis_data:

networks:
  thenewspaper-network:
    driver: bridge
`;

        fs.writeFileSync('docker-compose.local.yml', dockerCompose);
        this.log('✅ Docker Compose 설정 생성 완료', 'success');
    }

    async createNginxConfig() {
        this.log('🌐 Nginx 설정 생성...');

        const nginxConfig = `events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:5000;
    }
    
    upstream frontend {
        server frontend:3000;
    }
    
    server {
        listen 80;
        server_name localhost;
        
        # 프론트엔드 프록시
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
        
        # 백엔드 API 프록시
        location /api {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
        
        # WebSocket 프록시
        location /socket.io {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}`;

        fs.writeFileSync('nginx.conf', nginxConfig);
        this.log('✅ Nginx 설정 생성 완료', 'success');
    }

    async createStartScripts() {
        this.log('📜 시작 스크립트 생성...');

        // Windows 배치 파일
        const startScript = `@echo off
echo 🚀 TheNewsPaper 로컬 호스팅 시작...

REM 로그 디렉토리 생성
if not exist logs mkdir logs

REM PM2로 서비스 시작
echo 📦 PM2로 서비스 시작...
pm2 start ecosystem.config.js

REM 상태 확인
echo 📊 서비스 상태 확인...
pm2 status

echo ✅ TheNewsPaper 로컬 호스팅 완료!
echo 🌐 프론트엔드: http://localhost:${this.ports.frontend}
echo 🔧 백엔드 API: http://localhost:${this.ports.backend}
echo 📊 PM2 모니터링: pm2 monit
echo 🛑 서비스 중지: pm2 stop all
pause`;

        fs.writeFileSync('start-local-hosting.bat', startScript);

        // PowerShell 스크립트
        const startScriptPS = `# TheNewsPaper 로컬 호스팅 시작
Write-Host "🚀 TheNewsPaper 로컬 호스팅 시작..." -ForegroundColor Green

# 로그 디렉토리 생성
if (!(Test-Path "logs")) {
    New-Item -ItemType Directory -Path "logs"
}

# PM2로 서비스 시작
Write-Host "📦 PM2로 서비스 시작..." -ForegroundColor Yellow
pm2 start ecosystem.config.js

# 상태 확인
Write-Host "📊 서비스 상태 확인..." -ForegroundColor Yellow
pm2 status

Write-Host "✅ TheNewsPaper 로컬 호스팅 완료!" -ForegroundColor Green
Write-Host "🌐 프론트엔드: http://localhost:${this.ports.frontend}" -ForegroundColor Cyan
Write-Host "🔧 백엔드 API: http://localhost:${this.ports.backend}" -ForegroundColor Cyan
Write-Host "📊 PM2 모니터링: pm2 monit" -ForegroundColor Cyan
Write-Host "🛑 서비스 중지: pm2 stop all" -ForegroundColor Cyan

Read-Host "Press Enter to continue"`;

        fs.writeFileSync('start-local-hosting.ps1', startScriptPS);

        this.log('✅ 시작 스크립트 생성 완료', 'success');
    }

    async startServices() {
        this.log('🚀 서비스 시작...');

        try {
            // PM2로 서비스 시작
            await this.executeCommand('pm2 start ecosystem.config.js');

            // 상태 확인
            await this.executeCommand('pm2 status');

            this.log('✅ 서비스 시작 완료', 'success');
            this.log(`🌐 프론트엔드: http://localhost:${this.ports.frontend}`, 'info');
            this.log(`🔧 백엔드 API: http://localhost:${this.ports.backend}`, 'info');
            this.log(`📊 PM2 모니터링: pm2 monit`, 'info');

            return true;

        } catch (error) {
            this.log(`❌ 서비스 시작 실패: ${error.message}`, 'error');
            return false;
        }
    }

    async generateReport() {
        this.log('📋 호스팅 보고서 생성...');

        const report = `# 🖥️ TheNewsPaper 로컬 호스팅 보고서

## 📊 시스템 정보
- **프로젝트**: ${this.projectName}
- **설정 일시**: ${new Date().toISOString()}
- **호스팅 방식**: 로컬 PC (PM2 + Docker)

## 🚀 서비스 구성
- **프론트엔드**: http://localhost:${this.ports.frontend}
- **백엔드 API**: http://localhost:${this.ports.backend}
- **데이터베이스**: localhost:${this.ports.database}
- **Redis 캐시**: localhost:${this.ports.redis}
- **관리자 대시보드**: http://localhost:${this.ports.admin}

## 📦 설치된 구성요소
- **PM2**: 프로세스 관리
- **Docker Compose**: 컨테이너 오케스트레이션
- **Nginx**: 리버스 프록시
- **MariaDB**: 데이터베이스
- **Redis**: 캐시 서버

## 🛠️ 관리 명령어
- **서비스 시작**: pm2 start ecosystem.config.js
- **상태 확인**: pm2 status
- **모니터링**: pm2 monit
- **로그 확인**: pm2 logs
- **서비스 중지**: pm2 stop all
- **서비스 재시작**: pm2 restart all

## 💰 비용 정보
- **현재 비용**: $0/월 (로컬 PC)
- **예상 비용**: $0/월 (무료 테스트)
- **실제 서비스**: $56-200/월 (클라우드)

## 🎯 다음 단계
1. **로컬 개발**: 기능 개발 및 테스트
2. **무료 클라우드**: GCP/AWS 무료 티어
3. **유료 호스팅**: 실제 서비스 운영

---
*TheNewsPaper 로컬 호스팅 보고서*
`;

        fs.writeFileSync('LOCAL_HOSTING_REPORT.md', report);
        this.log('✅ 호스팅 보고서 생성 완료', 'success');
    }

    async run() {
        this.log(`🤖 ${this.projectName} 로컬 호스팅 설정 시작!`);

        try {
            // 1. 시스템 요구사항 확인
            const requirementsOk = await this.checkSystemRequirements();
            if (!requirementsOk) {
                throw new Error('시스템 요구사항 확인 실패');
            }

            // 2. 의존성 설치
            const dependenciesOk = await this.installDependencies();
            if (!dependenciesOk) {
                throw new Error('의존성 설치 실패');
            }

            // 3. PM2 설정 생성
            await this.createPM2Config();

            // 4. Docker Compose 설정 생성
            await this.createDockerCompose();

            // 5. Nginx 설정 생성
            await this.createNginxConfig();

            // 6. 시작 스크립트 생성
            await this.createStartScripts();

            // 7. 서비스 시작
            const servicesOk = await this.startServices();
            if (!servicesOk) {
                this.log('⚠️ 서비스 시작 실패, 수동으로 시작하세요', 'warning');
            }

            // 8. 보고서 생성
            await this.generateReport();

            this.log(`✅ ${this.projectName} 로컬 호스팅 설정 완료!`, 'success');
            this.log('📋 보고서: LOCAL_HOSTING_REPORT.md', 'info');
            this.log('🚀 시작 스크립트: start-local-hosting.bat', 'info');

        } catch (error) {
            this.log(`❌ ${this.projectName} 로컬 호스팅 설정 실패: ${error.message}`, 'error');
            process.exit(1);
        }
    }
}

// 스크립트 실행
if (require.main === module) {
    const setup = new LocalHostingSetup();
    setup.run().catch(console.error);
}

module.exports = LocalHostingSetup;
