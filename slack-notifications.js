/**
 * 📢 Slack 알림 시스템
 * 작업 완료 시 Slack으로 알림을 보내는 스크립트
 * 
 * @author AUTOAGENTS Manager
 * @version 1.0.0
 * @created 2025-01-02
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

class SlackNotifier {
    constructor() {
        this.webhookUrl = this.loadWebhookUrl();
    }

    /**
     * 웹훅 URL 로드
     */
    loadWebhookUrl() {
        // 환경변수에서 먼저 확인
        if (process.env.SLACK_WEBHOOK_URL) {
            return process.env.SLACK_WEBHOOK_URL;
        }
        
        try {
            const urlPath = path.join(__dirname, 'slack-webhook-url.txt');
            return fs.readFileSync(urlPath, 'utf8').trim();
        } catch (error) {
            console.warn('⚠️ Slack 웹훅 URL을 찾을 수 없습니다. 환경변수 SLACK_WEBHOOK_URL을 설정하거나 slack-webhook-url.txt 파일을 생성하세요.');
            return null;
        }
    }

    /**
     * Slack 메시지 전송
     */
    async sendMessage(message, options = {}) {
        if (!this.webhookUrl) {
            console.warn('⚠️ Slack 웹훅 URL이 설정되지 않았습니다.');
            return false;
        }

        const payload = {
            text: message,
            username: 'AUTOAGENTS Manager',
            icon_emoji: ':robot_face:',
            ...options
        };

        return new Promise((resolve, reject) => {
            const url = new URL(this.webhookUrl);
            const postData = JSON.stringify(payload);

            const options = {
                hostname: url.hostname,
                port: 443,
                path: url.pathname + url.search,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                }
            };

            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => {
                    data += chunk;
                });
                res.on('end', () => {
                    if (res.statusCode === 200) {
                        console.log('✅ Slack 알림 전송 성공');
                        resolve(true);
                    } else {
                        console.error('❌ Slack 알림 전송 실패:', res.statusCode, data);
                        reject(new Error(`HTTP ${res.statusCode}: ${data}`));
                    }
                });
            });

            req.on('error', (error) => {
                console.error('❌ Slack 알림 전송 중 오류:', error);
                reject(error);
            });

            req.write(postData);
            req.end();
        });
    }

    /**
     * 작업 완료 알림
     */
    async notifyTaskCompletion(taskName, details = {}) {
        const message = `🎉 *작업 완료 알림*\n\n*작업명:* ${taskName}\n*완료 시간:* ${new Date().toLocaleString('ko-KR')}`;
        
        const attachments = [];
        
        if (details.errorsFixed) {
            attachments.push({
                color: 'good',
                title: '🔧 수정된 에러 수',
                text: `${details.errorsFixed}개`,
                short: true
            });
        }

        if (details.errorReduction) {
            attachments.push({
                color: 'good',
                title: '📊 에러 감소율',
                text: `${details.errorReduction}%`,
                short: true
            });
        }

        if (details.filesChanged) {
            attachments.push({
                color: 'good',
                title: '📁 변경된 파일 수',
                text: `${details.filesChanged}개`,
                short: true
            });
        }

        if (details.buildStatus) {
            attachments.push({
                color: details.buildStatus === 'success' ? 'good' : 'danger',
                title: '🏗️ 빌드 상태',
                text: details.buildStatus === 'success' ? '성공' : '실패',
                short: true
            });
        }

        if (details.serverStatus) {
            attachments.push({
                color: details.serverStatus === 'running' ? 'good' : 'warning',
                title: '🚀 서버 상태',
                text: details.serverStatus === 'running' ? '실행 중' : '중지됨',
                short: true
            });
        }

        return this.sendMessage(message, { attachments });
    }

    /**
     * 에러 발생 알림
     */
    async notifyError(errorMessage, details = {}) {
        const message = `🚨 *에러 발생 알림*\n\n*에러:* ${errorMessage}\n*발생 시간:* ${new Date().toLocaleString('ko-KR')}`;
        
        const attachments = [];
        
        if (details.file) {
            attachments.push({
                color: 'danger',
                title: '📁 파일',
                text: details.file,
                short: true
            });
        }

        if (details.line) {
            attachments.push({
                color: 'danger',
                title: '📍 라인',
                text: details.line.toString(),
                short: true
            });
        }

        if (details.errorCount) {
            attachments.push({
                color: 'danger',
                title: '❌ 남은 에러 수',
                text: `${details.errorCount}개`,
                short: true
            });
        }

        return this.sendMessage(message, { attachments });
    }

    /**
     * 빌드 상태 알림
     */
    async notifyBuildStatus(status, details = {}) {
        const statusEmoji = status === 'success' ? '✅' : '❌';
        const statusText = status === 'success' ? '성공' : '실패';
        const color = status === 'success' ? 'good' : 'danger';
        
        const message = `${statusEmoji} *빌드 ${statusText}*\n\n*시간:* ${new Date().toLocaleString('ko-KR')}`;
        
        const attachments = [];
        
        if (details.buildTime) {
            attachments.push({
                color: color,
                title: '⏱️ 빌드 시간',
                text: `${details.buildTime}초`,
                short: true
            });
        }

        if (details.bundleSize) {
            attachments.push({
                color: color,
                title: '📦 번들 크기',
                text: details.bundleSize,
                short: true
            });
        }

        if (details.errors) {
            attachments.push({
                color: 'danger',
                title: '❌ 에러 수',
                text: `${details.errors}개`,
                short: true
            });
        }

        return this.sendMessage(message, { attachments });
    }

    /**
     * 배포 상태 알림
     */
    async notifyDeploymentStatus(status, details = {}) {
        const statusEmoji = status === 'success' ? '🚀' : '💥';
        const statusText = status === 'success' ? '성공' : '실패';
        const color = status === 'success' ? 'good' : 'danger';
        
        const message = `${statusEmoji} *배포 ${statusText}*\n\n*환경:* ${details.environment || 'production'}\n*시간:* ${new Date().toLocaleString('ko-KR')}`;
        
        const attachments = [];
        
        if (details.version) {
            attachments.push({
                color: color,
                title: '🏷️ 버전',
                text: details.version,
                short: true
            });
        }

        if (details.url) {
            attachments.push({
                color: color,
                title: '🌐 URL',
                text: details.url,
                short: false
            });
        }

        if (details.duration) {
            attachments.push({
                color: color,
                title: '⏱️ 배포 시간',
                text: `${details.duration}초`,
                short: true
            });
        }

        return this.sendMessage(message, { attachments });
    }
}

// CLI 사용을 위한 메인 함수
async function main() {
    const notifier = new SlackNotifier();
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log(`
📢 Slack 알림 시스템 사용법:

1. 작업 완료 알림:
   node slack-notifications.js task "작업명" --errors=10 --reduction=73

2. 에러 발생 알림:
   node slack-notifications.js error "에러 메시지" --file=App.tsx --line=25

3. 빌드 상태 알림:
   node slack-notifications.js build success --time=45 --size=2.5MB

4. 배포 상태 알림:
   node slack-notifications.js deploy success --env=production --version=v1.3.0

예시:
   node slack-notifications.js task "TypeScript 에러 수정" --errors=220 --reduction=73
        `);
        return;
    }

    const command = args[0];
    const message = args[1] || '';

    try {
        switch (command) {
            case 'task':
                await notifier.notifyTaskCompletion(message, {
                    errorsFixed: parseInt(args.find(arg => arg.startsWith('--errors='))?.split('=')[1]) || 0,
                    errorReduction: parseInt(args.find(arg => arg.startsWith('--reduction='))?.split('=')[1]) || 0,
                    filesChanged: parseInt(args.find(arg => arg.startsWith('--files='))?.split('=')[1]) || 0,
                    buildStatus: args.find(arg => arg.startsWith('--build='))?.split('=')[1] || 'unknown',
                    serverStatus: args.find(arg => arg.startsWith('--server='))?.split('=')[1] || 'unknown'
                });
                break;
                
            case 'error':
                await notifier.notifyError(message, {
                    file: args.find(arg => arg.startsWith('--file='))?.split('=')[1],
                    line: parseInt(args.find(arg => arg.startsWith('--line='))?.split('=')[1]),
                    errorCount: parseInt(args.find(arg => arg.startsWith('--count='))?.split('=')[1])
                });
                break;
                
            case 'build':
                await notifier.notifyBuildStatus(message, {
                    buildTime: parseInt(args.find(arg => arg.startsWith('--time='))?.split('=')[1]),
                    bundleSize: args.find(arg => arg.startsWith('--size='))?.split('=')[1],
                    errors: parseInt(args.find(arg => arg.startsWith('--errors='))?.split('=')[1])
                });
                break;
                
            case 'deploy':
                await notifier.notifyDeploymentStatus(message, {
                    environment: args.find(arg => arg.startsWith('--env='))?.split('=')[1],
                    version: args.find(arg => arg.startsWith('--version='))?.split('=')[1],
                    url: args.find(arg => arg.startsWith('--url='))?.split('=')[1],
                    duration: parseInt(args.find(arg => arg.startsWith('--duration='))?.split('=')[1])
                });
                break;
                
            default:
                console.error('❌ 알 수 없는 명령어:', command);
                process.exit(1);
        }
    } catch (error) {
        console.error('❌ 알림 전송 실패:', error.message);
        process.exit(1);
    }
}

// 모듈로 사용할 때
module.exports = SlackNotifier;

// CLI로 실행할 때
if (require.main === module) {
    main();
}
