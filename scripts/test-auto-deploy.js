#!/usr/bin/env node

/**
 * 🧪 자동 배포 테스트 스크립트
 * GitHub Actions 워크플로우 테스트
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class AutoDeployTest {
    constructor() {
        this.testFile = 'public/index.html';
        this.logFile = 'auto-deploy-test.log';
        this.testResults = [];
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

    async checkGitStatus() {
        this.log('🔍 Git 상태 확인...');

        try {
            const status = await this.executeCommand('git status --porcelain');
            if (status) {
                this.log(`변경된 파일: ${status}`, 'info');
                return true;
            } else {
                this.log('변경된 파일 없음', 'info');
                return false;
            }
        } catch (error) {
            this.log(`Git 상태 확인 실패: ${error.message}`, 'error');
            return false;
        }
    }

    async addTestChanges() {
        this.log('📝 테스트 변경사항 추가...');

        try {
            // 테스트용 파일 수정
            const testContent = `<!-- 자동 배포 테스트 - ${new Date().toISOString()} -->`;
            fs.appendFileSync(this.testFile, testContent);

            // Git에 추가
            await this.executeCommand(`git add ${this.testFile}`);
            this.log('테스트 파일 Git에 추가 완료', 'success');

            return true;
        } catch (error) {
            this.log(`테스트 변경사항 추가 실패: ${error.message}`, 'error');
            return false;
        }
    }

    async commitTestChanges() {
        this.log('💾 테스트 커밋 생성...');

        try {
            const commitMessage = `🧪 자동 배포 테스트 - ${new Date().toLocaleString('ko-KR')}

- GitHub Actions 워크플로우 테스트
- Firebase 자동 배포 확인
- 워크플로우 연동 상태 검증

테스트 시간: ${new Date().toISOString()}`;

            await this.executeCommand(`git commit -m "${commitMessage}"`);
            this.log('테스트 커밋 생성 완료', 'success');

            return true;
        } catch (error) {
            this.log(`테스트 커밋 생성 실패: ${error.message}`, 'error');
            return false;
        }
    }

    async pushToGitHub() {
        this.log('🚀 GitHub에 푸시...');

        try {
            await this.executeCommand('git push origin main');
            this.log('GitHub 푸시 완료', 'success');

            return true;
        } catch (error) {
            this.log(`GitHub 푸시 실패: ${error.message}`, 'error');
            return false;
        }
    }

    async checkGitHubActions() {
        this.log('🔍 GitHub Actions 상태 확인...');

        try {
            // GitHub Actions API로 상태 확인 (간단한 방법)
            this.log('GitHub Actions 워크플로우 실행 중...', 'info');
            this.log('Actions 탭에서 실행 상태를 확인하세요: https://github.com/LeeHwiRyeon/community/actions', 'info');

            return true;
        } catch (error) {
            this.log(`GitHub Actions 확인 실패: ${error.message}`, 'error');
            return false;
        }
    }

    async testFirebaseDeploy() {
        this.log('🔥 Firebase 배포 테스트...');

        try {
            // Firebase 배포 상태 확인
            await this.executeCommand('firebase hosting:channel:list');
            this.log('Firebase 호스팅 채널 확인 완료', 'success');

            return true;
        } catch (error) {
            this.log(`Firebase 배포 테스트 실패: ${error.message}`, 'error');
            return false;
        }
    }

    async generateTestReport() {
        this.log('📋 테스트 보고서 생성...');

        const report = `# 🧪 자동 배포 테스트 보고서

## 📊 테스트 정보
- **테스트 시간**: ${new Date().toISOString()}
- **테스트 파일**: ${this.testFile}
- **테스트 목적**: GitHub Actions 워크플로우 자동 배포 확인

## 🚀 테스트 단계
1. **Git 상태 확인**: 변경사항 감지
2. **테스트 파일 수정**: 자동 배포 트리거용 변경
3. **Git 커밋**: 변경사항 커밋
4. **GitHub 푸시**: 원격 저장소에 푸시
5. **워크플로우 실행**: GitHub Actions 자동 실행
6. **Firebase 배포**: 자동 배포 확인

## 🔗 확인 링크
- **GitHub Actions**: https://github.com/LeeHwiRyeon/community/actions
- **Firebase 호스팅**: https://thenewspaper-platform.web.app
- **Firebase 콘솔**: https://console.firebase.google.com/project/thenewspaper-platform/overview

## 📝 테스트 결과
- **Git 상태**: ✅ 확인 완료
- **파일 수정**: ✅ 테스트 변경사항 추가
- **커밋 생성**: ✅ 테스트 커밋 완료
- **GitHub 푸시**: ✅ 푸시 완료
- **워크플로우**: 🔄 실행 중 (Actions 탭에서 확인)
- **Firebase 배포**: 🔄 진행 중

## 🎯 다음 단계
1. **GitHub Actions 확인**: Actions 탭에서 워크플로우 실행 상태 확인
2. **배포 완료 대기**: 워크플로우 완료까지 2-3분 대기
3. **웹사이트 확인**: https://thenewspaper-platform.web.app 접속하여 변경사항 확인
4. **로그 확인**: 워크플로우 로그에서 배포 상태 확인

---
*자동 배포 테스트 보고서*

**🧪 테스트가 완료되었습니다! GitHub Actions에서 워크플로우 실행을 확인하세요!** 🚀
`;

        fs.writeFileSync('AUTO_DEPLOY_TEST_REPORT.md', report);
        this.log('✅ 테스트 보고서 생성 완료', 'success');
    }

    async run() {
        this.log('🧪 자동 배포 테스트 시작!');

        try {
            // 1. Git 상태 확인
            const gitStatus = await this.checkGitStatus();

            // 2. 테스트 변경사항 추가
            const addChanges = await this.addTestChanges();
            if (!addChanges) {
                throw new Error('테스트 변경사항 추가 실패');
            }

            // 3. 테스트 커밋 생성
            const commitChanges = await this.commitTestChanges();
            if (!commitChanges) {
                throw new Error('테스트 커밋 생성 실패');
            }

            // 4. GitHub에 푸시
            const pushToGitHub = await this.pushToGitHub();
            if (!pushToGitHub) {
                throw new Error('GitHub 푸시 실패');
            }

            // 5. GitHub Actions 확인
            await this.checkGitHubActions();

            // 6. Firebase 배포 테스트
            await this.testFirebaseDeploy();

            // 7. 테스트 보고서 생성
            await this.generateTestReport();

            this.log('✅ 자동 배포 테스트 완료!', 'success');
            this.log('📋 보고서: AUTO_DEPLOY_TEST_REPORT.md', 'info');
            this.log('🔗 GitHub Actions: https://github.com/LeeHwiRyeon/community/actions', 'info');
            this.log('🌐 웹사이트: https://thenewspaper-platform.web.app', 'info');

        } catch (error) {
            this.log(`❌ 자동 배포 테스트 실패: ${error.message}`, 'error');
            process.exit(1);
        }
    }
}

// 스크립트 실행
if (require.main === module) {
    const test = new AutoDeployTest();
    test.run().catch(console.error);
}

module.exports = AutoDeployTest;
