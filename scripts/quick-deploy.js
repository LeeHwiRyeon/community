#!/usr/bin/env node

/**
 * ⚡ 빠른 배포 스크립트
 * GitHub Actions + Firebase + GitHub Pages 동시 배포
 */

const { execSync } = require('child_process');
const fs = require('fs');

class QuickDeploy {
    constructor() {
        this.startTime = Date.now();
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);
        console.log(`[${elapsed}s] [${type.toUpperCase()}] ${message}`);
    }

    async executeCommand(command, options = {}) {
        try {
            this.log(`실행: ${command}`);
            const result = execSync(command, { 
                encoding: 'utf8', 
                stdio: 'pipe',
                ...options 
            });
            return result.trim();
        } catch (error) {
            this.log(`실패: ${command} - ${error.message}`, 'error');
            throw error;
        }
    }

    async quickDeploy() {
        this.log('⚡ 빠른 배포 시작!');
        
        try {
            // 1. 변경사항 확인 (5초)
            this.log('📋 변경사항 확인...');
            const status = await this.executeCommand('git status --porcelain');
            if (!status) {
                this.log('변경사항 없음 - 배포 건너뜀', 'warning');
                return;
            }

            // 2. 파일 추가 (3초)
            this.log('📁 파일 추가...');
            await this.executeCommand('git add -A');

            // 3. 커밋 생성 (2초)
            this.log('💾 커밋 생성...');
            const commitMessage = `⚡ 빠른 배포 - ${new Date().toLocaleString('ko-KR')}`;
            await this.executeCommand(`git commit -m "${commitMessage}"`);

            // 4. GitHub 푸시 (10초)
            this.log('🚀 GitHub 푸시...');
            await this.executeCommand('git push origin main');

            // 5. 배포 완료 알림
            this.log('✅ 배포 완료!', 'success');
            this.log('🔗 GitHub Actions: https://github.com/LeeHwiRyeon/community/actions', 'info');
            this.log('🌐 Firebase: https://thenewspaper-platform.web.app', 'info');
            this.log('📄 GitHub Pages: https://leehwiryeon.github.io/community', 'info');

            const totalTime = ((Date.now() - this.startTime) / 1000).toFixed(1);
            this.log(`⏱️ 총 소요시간: ${totalTime}초`, 'success');

        } catch (error) {
            this.log(`❌ 배포 실패: ${error.message}`, 'error');
            process.exit(1);
        }
    }
}

// 스크립트 실행
if (require.main === module) {
    const deploy = new QuickDeploy();
    deploy.quickDeploy().catch(console.error);
}

module.exports = QuickDeploy;
