#!/usr/bin/env node

/**
 * 🔥 Firebase App Hosting 자동 설정 스크립트
 * TheNewsPaper 프로젝트용 Firebase 서비스 자동 설정
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class FirebaseAutoSetup {
    constructor() {
        this.projectId = 'thenewspaper-platform';
        this.projectName = 'TheNewsPaper Platform';
        this.logFile = 'firebase-auto-setup.log';
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

    async checkFirebaseStatus() {
        this.log('🔍 Firebase 상태 확인 시작...');

        try {
            // Firebase CLI 버전 확인
            const firebaseVersion = await this.executeCommand('firebase --version');
            this.log(`✅ Firebase CLI: ${firebaseVersion}`, 'success');

            // 로그인 상태 확인
            try {
                const loginStatus = await this.executeCommand('firebase login:list');
                this.log('✅ Firebase 로그인 상태 확인', 'success');
            } catch (error) {
                this.log('⚠️ Firebase 로그인 필요', 'warning');
                await this.executeCommand('firebase login --no-localhost');
            }

            // 프로젝트 목록 확인
            const projects = await this.executeCommand('firebase projects:list');
            this.log('✅ Firebase 프로젝트 목록 확인', 'success');

            // 현재 프로젝트 설정
            await this.executeCommand(`firebase use ${this.projectId}`);
            this.log(`✅ 프로젝트 설정: ${this.projectId}`, 'success');

            this.log('✅ Firebase 상태 확인 완료', 'success');
            return true;

        } catch (error) {
            this.log(`❌ Firebase 상태 확인 실패: ${error.message}`, 'error');
            return false;
        }
    }

    async enableFirebaseServices() {
        this.log('🚀 Firebase 서비스 활성화 시작...');

        try {
            // Authentication 활성화
            this.log('Authentication 서비스 활성화 중...');
            await this.executeCommand('firebase auth:enable');

            // Firestore 활성화
            this.log('Firestore 서비스 활성화 중...');
            await this.executeCommand('firebase firestore:enable');

            // Storage 활성화
            this.log('Storage 서비스 활성화 중...');
            await this.executeCommand('firebase storage:enable');

            // Hosting 활성화
            this.log('Hosting 서비스 활성화 중...');
            await this.executeCommand('firebase hosting:enable');

            // App Hosting 활성화
            this.log('App Hosting 서비스 활성화 중...');
            await this.executeCommand('firebase apphosting:enable');

            this.log('✅ Firebase 서비스 활성화 완료', 'success');
            return true;

        } catch (error) {
            this.log(`❌ Firebase 서비스 활성화 실패: ${error.message}`, 'error');
            return false;
        }
    }

    async createFirebaseConfig() {
        this.log('⚙️ Firebase 설정 파일 생성...');

        try {
            // firebase.json 업데이트
            const firebaseConfig = {
                "hosting": {
                    "public": "build",
                    "ignore": [
                        "firebase.json",
                        "**/.*",
                        "**/node_modules/**"
                    ],
                    "rewrites": [
                        {
                            "source": "**",
                            "destination": "/index.html"
                        }
                    ]
                },
                "apphosting": {
                    "backend": {
                        "source": "server-backend",
                        "runtime": "nodejs18"
                    },
                    "frontend": {
                        "source": "frontend",
                        "framework": "react"
                    }
                },
                "firestore": {
                    "rules": "firestore.rules",
                    "indexes": "firestore.indexes.json"
                },
                "storage": {
                    "rules": "storage.rules"
                },
                "functions": {
                    "source": "functions",
                    "runtime": "nodejs18"
                }
            };

            fs.writeFileSync('firebase.json', JSON.stringify(firebaseConfig, null, 2));
            this.log('✅ firebase.json 업데이트 완료', 'success');

            // .firebaserc 확인
            const firebaserc = {
                "projects": {
                    "default": this.projectId
                }
            };

            fs.writeFileSync('.firebaserc', JSON.stringify(firebaserc, null, 2));
            this.log('✅ .firebaserc 업데이트 완료', 'success');

            this.log('✅ Firebase 설정 파일 생성 완료', 'success');
            return true;

        } catch (error) {
            this.log(`❌ Firebase 설정 파일 생성 실패: ${error.message}`, 'error');
            return false;
        }
    }

    async setupAuthentication() {
        this.log('🔐 Authentication 설정...');

        try {
            // 이메일/비밀번호 로그인 활성화
            await this.executeCommand('firebase auth:enable --provider email');

            // Google 로그인 활성화
            await this.executeCommand('firebase auth:enable --provider google');

            // 익명 로그인 활성화
            await this.executeCommand('firebase auth:enable --provider anonymous');

            this.log('✅ Authentication 설정 완료', 'success');
            return true;

        } catch (error) {
            this.log(`❌ Authentication 설정 실패: ${error.message}`, 'error');
            return false;
        }
    }

    async setupFirestore() {
        this.log('🗄️ Firestore 설정...');

        try {
            // Firestore 데이터베이스 생성
            await this.executeCommand('firebase firestore:create');

            // 보안 규칙 배포
            await this.executeCommand('firebase deploy --only firestore:rules');

            // 인덱스 배포
            await this.executeCommand('firebase deploy --only firestore:indexes');

            this.log('✅ Firestore 설정 완료', 'success');
            return true;

        } catch (error) {
            this.log(`❌ Firestore 설정 실패: ${error.message}`, 'error');
            return false;
        }
    }

    async setupStorage() {
        this.log('📁 Storage 설정...');

        try {
            // Storage 버킷 생성
            await this.executeCommand('firebase storage:create');

            // 보안 규칙 배포
            await this.executeCommand('firebase deploy --only storage:rules');

            this.log('✅ Storage 설정 완료', 'success');
            return true;

        } catch (error) {
            this.log(`❌ Storage 설정 실패: ${error.message}`, 'error');
            return false;
        }
    }

    async setupAppHosting() {
        this.log('🌐 App Hosting 설정...');

        try {
            // App Hosting 초기화
            await this.executeCommand('firebase apphosting:init');

            // 백엔드 설정
            await this.executeCommand('firebase apphosting:backend:init');

            // 프론트엔드 설정
            await this.executeCommand('firebase apphosting:frontend:init');

            this.log('✅ App Hosting 설정 완료', 'success');
            return true;

        } catch (error) {
            this.log(`❌ App Hosting 설정 실패: ${error.message}`, 'error');
            return false;
        }
    }

    async buildAndDeploy() {
        this.log('🚀 빌드 및 배포 시작...');

        try {
            // 프론트엔드 빌드
            this.log('프론트엔드 빌드 중...');
            await this.executeCommand('npm run build', { cwd: './frontend' });

            // 백엔드 빌드
            this.log('백엔드 빌드 중...');
            await this.executeCommand('npm run build', { cwd: './server-backend' });

            // Firebase 배포
            this.log('Firebase 배포 중...');
            await this.executeCommand('firebase deploy');

            this.log('✅ 빌드 및 배포 완료', 'success');
            return true;

        } catch (error) {
            this.log(`❌ 빌드 및 배포 실패: ${error.message}`, 'error');
            return false;
        }
    }

    async generateReport() {
        this.log('📋 Firebase 설정 보고서 생성...');

        const report = `# 🔥 Firebase App Hosting 자동 설정 보고서

## 📊 프로젝트 정보
- **프로젝트**: ${this.projectName}
- **프로젝트 ID**: ${this.projectId}
- **설정 일시**: ${new Date().toISOString()}
- **설정 방식**: 자동 설정

## 🚀 활성화된 서비스
- **Authentication**: 사용자 인증
- **Firestore**: 실시간 데이터베이스
- **Storage**: 파일 저장소
- **Hosting**: 웹 호스팅
- **App Hosting**: 풀스택 앱 호스팅

## 🌐 접속 정보
- **Firebase 콘솔**: https://console.firebase.google.com
- **프로젝트**: ${this.projectName}
- **호스팅 URL**: https://${this.projectId}.web.app
- **App Hosting URL**: https://${this.projectId}.apphosting.app

## 🔧 관리 명령어
- **상태 확인**: firebase projects:list
- **배포**: firebase deploy
- **로그 확인**: firebase logs
- **서비스 상태**: firebase service:list

## 💰 비용 정보
- **무료 플랜**: Authentication, Firestore, Storage, Hosting
- **App Hosting**: 사용량 기반 과금
- **예상 비용**: $0-50/월 (초기 단계)

## 🎯 다음 단계
1. **Firebase 콘솔**: 서비스 상태 확인
2. **애플리케이션 테스트**: 배포된 앱 테스트
3. **도메인 연결**: 커스텀 도메인 설정
4. **모니터링**: 사용량 및 성능 모니터링

---
*Firebase App Hosting 자동 설정 보고서*
`;

        fs.writeFileSync('FIREBASE_AUTO_SETUP_REPORT.md', report);
        this.log('✅ Firebase 설정 보고서 생성 완료', 'success');
    }

    async run() {
        this.log(`🤖 ${this.projectName} Firebase App Hosting 자동 설정 시작!`);

        try {
            // 1. Firebase 상태 확인
            const firebaseOk = await this.checkFirebaseStatus();
            if (!firebaseOk) {
                throw new Error('Firebase 상태 확인 실패');
            }

            // 2. Firebase 서비스 활성화
            const servicesOk = await this.enableFirebaseServices();
            if (!servicesOk) {
                throw new Error('Firebase 서비스 활성화 실패');
            }

            // 3. Firebase 설정 파일 생성
            const configOk = await this.createFirebaseConfig();
            if (!configOk) {
                throw new Error('Firebase 설정 파일 생성 실패');
            }

            // 4. Authentication 설정
            const authOk = await this.setupAuthentication();
            if (!authOk) {
                this.log('⚠️ Authentication 설정 실패, 수동으로 설정하세요', 'warning');
            }

            // 5. Firestore 설정
            const firestoreOk = await this.setupFirestore();
            if (!firestoreOk) {
                this.log('⚠️ Firestore 설정 실패, 수동으로 설정하세요', 'warning');
            }

            // 6. Storage 설정
            const storageOk = await this.setupStorage();
            if (!storageOk) {
                this.log('⚠️ Storage 설정 실패, 수동으로 설정하세요', 'warning');
            }

            // 7. App Hosting 설정
            const appHostingOk = await this.setupAppHosting();
            if (!appHostingOk) {
                this.log('⚠️ App Hosting 설정 실패, 수동으로 설정하세요', 'warning');
            }

            // 8. 빌드 및 배포
            const deployOk = await this.buildAndDeploy();
            if (!deployOk) {
                this.log('⚠️ 배포 실패, 수동으로 배포하세요', 'warning');
            }

            // 9. 보고서 생성
            await this.generateReport();

            this.log(`✅ ${this.projectName} Firebase App Hosting 자동 설정 완료!`, 'success');
            this.log('📋 보고서: FIREBASE_AUTO_SETUP_REPORT.md', 'info');
            this.log('🌐 Firebase 콘솔: https://console.firebase.google.com', 'info');

        } catch (error) {
            this.log(`❌ ${this.projectName} Firebase App Hosting 자동 설정 실패: ${error.message}`, 'error');
            process.exit(1);
        }
    }
}

// 스크립트 실행
if (require.main === module) {
    const setup = new FirebaseAutoSetup();
    setup.run().catch(console.error);
}

module.exports = FirebaseAutoSetup;
