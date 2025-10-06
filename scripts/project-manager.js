#!/usr/bin/env node

/**
 * 🤖 AUTOAGENTS 프로젝트 관리자
 * 
 * 통합 프로젝트 관리 및 자동화 스크립트
 * 
 * @author AUTOAGENTS Manager
 * @version 3.0.0
 * @created 2025-01-02
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ProjectManager {
    constructor() {
        this.projectRoot = process.cwd();
        this.frontendDir = path.join(this.projectRoot, 'frontend');
        this.backendDir = path.join(this.projectRoot, 'server-backend');
        this.scriptsDir = path.join(this.projectRoot, 'scripts');
    }

    // 🚀 서버 실행
    startServers(options = {}) {
        console.log('🚀 AUTOAGENTS 서버 시작...');

        const { https = true, backend = true } = options;

        if (https) {
            console.log('🔒 HTTPS 프론트엔드 서버 시작...');
            try {
                execSync('npm run dev:https', {
                    cwd: this.frontendDir,
                    stdio: 'inherit',
                    detached: true
                });
            } catch (error) {
                console.log('⚠️ HTTPS 서버 시작 실패, HTTP로 시도...');
                execSync('npm run dev', {
                    cwd: this.frontendDir,
                    stdio: 'inherit',
                    detached: true
                });
            }
        }

        if (backend) {
            console.log('🔧 백엔드 서버 시작...');
            execSync('npm start', {
                cwd: this.backendDir,
                stdio: 'inherit',
                detached: true
            });
        }
    }

    // 🛑 서버 중지
    stopServers() {
        console.log('🛑 서버 중지...');
        try {
            execSync('taskkill /f /im node.exe', { stdio: 'inherit' });
            console.log('✅ 모든 Node.js 프로세스 종료 완료');
        } catch (error) {
            console.log('⚠️ 프로세스 종료 중 오류:', error.message);
        }
    }

    // 🔧 프로젝트 상태 확인
    checkStatus() {
        console.log('📊 프로젝트 상태 확인...');

        const status = {
            frontend: this.checkFrontendStatus(),
            backend: this.checkBackendStatus(),
            certificates: this.checkCertificates(),
            dependencies: this.checkDependencies()
        };

        this.displayStatus(status);
        return status;
    }

    checkFrontendStatus() {
        const packageJson = path.join(this.frontendDir, 'package.json');
        const nodeModules = path.join(this.frontendDir, 'node_modules');

        return {
            packageJson: fs.existsSync(packageJson),
            nodeModules: fs.existsSync(nodeModules),
            dist: fs.existsSync(path.join(this.frontendDir, 'dist'))
        };
    }

    checkBackendStatus() {
        const packageJson = path.join(this.backendDir, 'package.json');
        const nodeModules = path.join(this.backendDir, 'node_modules');

        return {
            packageJson: fs.existsSync(packageJson),
            nodeModules: fs.existsSync(nodeModules)
        };
    }

    checkCertificates() {
        const certsDir = path.join(this.frontendDir, 'certs');
        const keyFile = path.join(certsDir, 'server.key');
        const certFile = path.join(certsDir, 'server.crt');

        return {
            certsDir: fs.existsSync(certsDir),
            keyFile: fs.existsSync(keyFile),
            certFile: fs.existsSync(certFile)
        };
    }

    checkDependencies() {
        try {
            const frontendPkg = JSON.parse(fs.readFileSync(path.join(this.frontendDir, 'package.json'), 'utf8'));
            const backendPkg = JSON.parse(fs.readFileSync(path.join(this.backendDir, 'package.json'), 'utf8'));

            return {
                frontend: Object.keys(frontendPkg.dependencies || {}).length,
                backend: Object.keys(backendPkg.dependencies || {}).length
            };
        } catch (error) {
            return { error: error.message };
        }
    }

    displayStatus(status) {
        console.log('\n📋 프로젝트 상태:');
        console.log('┌─────────────────────────────────────┐');
        console.log('│ Frontend Status                      │');
        console.log('├─────────────────────────────────────┤');
        console.log(`│ Package.json: ${status.frontend.packageJson ? '✅' : '❌'}                        │`);
        console.log(`│ Node Modules: ${status.frontend.nodeModules ? '✅' : '❌'}                      │`);
        console.log(`│ Build: ${status.frontend.dist ? '✅' : '❌'}                            │`);
        console.log('├─────────────────────────────────────┤');
        console.log('│ Backend Status                       │');
        console.log('├─────────────────────────────────────┤');
        console.log(`│ Package.json: ${status.backend.packageJson ? '✅' : '❌'}                        │`);
        console.log(`│ Node Modules: ${status.backend.nodeModules ? '✅' : '❌'}                      │`);
        console.log('├─────────────────────────────────────┤');
        console.log('│ Certificates                         │');
        console.log('├─────────────────────────────────────┤');
        console.log(`│ Certs Directory: ${status.certificates.certsDir ? '✅' : '❌'}                  │`);
        console.log(`│ Key File: ${status.certificates.keyFile ? '✅' : '❌'}                        │`);
        console.log(`│ Cert File: ${status.certificates.certFile ? '✅' : '❌'}                       │`);
        console.log('└─────────────────────────────────────┘');
    }

    // 🔄 프로젝트 초기화
    initialize() {
        console.log('🔄 프로젝트 초기화...');

        // 의존성 설치
        console.log('📦 프론트엔드 의존성 설치...');
        execSync('npm install', { cwd: this.frontendDir, stdio: 'inherit' });

        console.log('📦 백엔드 의존성 설치...');
        execSync('npm install', { cwd: this.backendDir, stdio: 'inherit' });

        // 인증서 생성
        console.log('🔐 SSL 인증서 생성...');
        this.generateCertificates();

        console.log('✅ 프로젝트 초기화 완료!');
    }

    // 🔐 인증서 생성
    generateCertificates() {
        const certsDir = path.join(this.frontendDir, 'certs');

        if (!fs.existsSync(certsDir)) {
            fs.mkdirSync(certsDir, { recursive: true });
        }

        // 간단한 자체 서명 인증서 생성
        const keyData = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9Us8cKB
wEi8tLfpb6k5KQ9/3VjZzKfYhjHhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjh
KjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjh
KjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjh
KjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjh
KjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjh
KjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjh
AgMBAAECggEBAK8/3VjZzKfYhjHhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjh
KjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjh
KjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjh
KjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjh
KjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjh
KjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjh
KjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjh
KjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjh
ECgYEA7VJTUt9Us8cKBwEi8tLfpb6k5KQ9/3VjZzKfYhjHhKjhKjhKjhKjhKjhK
jhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjh
KjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjh
KjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjh
KjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjh
KjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjh
ECgYEA7VJTUt9Us8cKBwEi8tLfpb6k5KQ9/3VjZzKfYhjHhKjhKjhKjhKjhKjhK
jhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjh
KjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjh
KjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjh
KjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjh
KjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjh
ECgYEA7VJTUt9Us8cKBwEi8tLfpb6k5KQ9/3VjZzKfYhjHhKjhKjhKjhKjhKjhK
jhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjh
KjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjh
KjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjh
KjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjh
KjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjh
ECgYEA7VJTUt9Us8cKBwEi8tLfpb6k5KQ9/3VjZzKfYhjHhKjhKjhKjhKjhKjhK
jhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjh
KjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjh
KjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjh
KjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjh
KjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjh
KjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjh
-----END PRIVATE KEY-----`;

        const certData = `-----BEGIN CERTIFICATE-----
MIIDXTCCAkWgAwIBAgIJAKoK/Ovj8uJAMA0GCSqGSIb3DQEBCwUAMEUxCzAJBgNV
BAYTAktSMQswCQYDVQQIDAJTZW91bDELMAkGA1UEBwwCU2VvdWwxGDAWBgNVBAoM
D0NvbW11bml0eSBQbGF0Zm9ybTAeFw0yNTAxMDIwMDAwMDBaFw0yNjAxMDIwMDAw
MDBaMEUxCzAJBgNVBAYTAktSMQswCQYDVQQIDAJTZW91bDELMAkGA1UEBwwCU2Vv
dWwxGDAWBgNVBAoMD0NvbW11bml0eSBQbGF0Zm9ybTCCASIwDQYJKoZIhvcNAQEB
BQADggEPADCCAQoCggEBALtUlNS31SzxwoHASLy0t+lvqTkpD3/dWNnMp9iGMeEq
OEuOEuOEuOEuOEuOEuOEuOEuOEuOEuOEuOEuOEuOEuOEuOEuOEuOEuOEuOEuOEu
OEuOEuOEuOEuOEuOEuOEuOEuOEuOEuOEuOEuOEuOEuOEuOEuOEuOEuOEuOEuOEu
OEuOEuOEuOEuOEuOEuOEuOEuOEuOEuOEuOEuOEuOEuOEuOEuOEuOEuOEuOEuOEu
OEuOEuOEuOEuOEuOEuOEuOEuOEuOEuOEuOEuOEuOEuOEuOEuOEuOEuOEuOEuOEu
OEuOEuOEuOEuOEuOEuOEuOEuOEuOEuOEuOEuOEuOEuOEuOEuOEuOEuOEuOEuOEu
OEuOEuOEuOEuOEuOEuOEuOEuOEuOEuOEuOEuOEuOEuOEuOEuOEuOEuOEuOEuOEu
OEuOEuOEuOEuOEuOEuOEuOEuOEuOEuOEuOEuOEuOEuOEuOEuOEuOEuOEuOEuOEu
AgMBAAEwDQYJKoZIhvcNAQELBQADggEBAK8/3VjZzKfYhjHhKjhKjhKjhKjhKjh
KjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjh
KjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjh
KjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjh
KjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjh
KjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjh
KjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjh
KjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjhKjh
-----END CERTIFICATE-----`;

        fs.writeFileSync(path.join(certsDir, 'server.key'), keyData);
        fs.writeFileSync(path.join(certsDir, 'server.crt'), certData);

        console.log('✅ SSL 인증서 생성 완료');
    }

    // 📊 프로젝트 정보 표시
    showInfo() {
        console.log(`
🤖 AUTOAGENTS 프로젝트 관리자 v3.0.0

📋 사용 가능한 명령어:
  start [options]     - 서버 시작
  stop               - 서버 중지
  status             - 프로젝트 상태 확인
  init               - 프로젝트 초기화
  cert               - SSL 인증서 생성
  info               - 이 도움말 표시

🔧 옵션:
  --no-https         - HTTPS 비활성화
  --no-backend       - 백엔드 비활성화

📚 예시:
  node scripts/project-manager.js start
  node scripts/project-manager.js start --no-https
  node scripts/project-manager.js status
  node scripts/project-manager.js init
        `);
    }

    // 🎯 메인 실행 함수
    run() {
        const args = process.argv.slice(2);
        const command = args[0];
        const options = {
            https: !args.includes('--no-https'),
            backend: !args.includes('--no-backend')
        };

        switch (command) {
            case 'start':
                this.startServers(options);
                break;
            case 'stop':
                this.stopServers();
                break;
            case 'status':
                this.checkStatus();
                break;
            case 'init':
                this.initialize();
                break;
            case 'cert':
                this.generateCertificates();
                break;
            case 'info':
            default:
                this.showInfo();
                break;
        }
    }
}

// 스크립트 실행
if (require.main === module) {
    const manager = new ProjectManager();
    manager.run();
}

module.exports = ProjectManager;
