/**
 * 🤖 자동 테스트 스케줄러
 * 
 * 백그라운드에서 자동으로 테스트를 실행하고, 작업 요청 시 포그라운드로 전환
 * 
 * @author AUTOAGENTS Manager
 * @version 1.0.0
 * @created 2025-10-05
 */

const FeatureTester = require('./test-all-features');
const fs = require('fs').promises;
const path = require('path');

class AutoTestScheduler {
    constructor(options = {}) {
        this.isRunning = false;
        this.isBackgroundMode = true;
        this.testInterval = options.testInterval || 300000; // 5분마다 자동 테스트
        this.backgroundTestInterval = null;
        this.lastTestResult = null;
        this.testHistory = [];
        this.maxHistorySize = 100;
        this.logFile = options.logFile || './test-logs/auto-test.log';
        this.resultsDir = options.resultsDir || './test-results';

        this.initializeDirectories();
    }

    /**
     * 📁 디렉토리 초기화
     */
    async initializeDirectories() {
        try {
            await fs.mkdir(path.dirname(this.logFile), { recursive: true });
            await fs.mkdir(this.resultsDir, { recursive: true });
            console.log('📁 자동 테스트 디렉토리 초기화 완료');
        } catch (error) {
            console.error('❌ 디렉토리 초기화 실패:', error.message);
        }
    }

    /**
     * 📝 로그 기록
     */
    async log(level, message, data = {}) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level,
            message,
            data
        };

        console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);

        try {
            await fs.appendFile(this.logFile, JSON.stringify(logEntry) + '\n');
        } catch (error) {
            console.error('❌ 로그 기록 실패:', error.message);
        }
    }

    /**
     * 🔄 백그라운드 자동 테스트 시작
     */
    async startBackgroundTesting() {
        if (this.isRunning) {
            console.log('⚠️ 자동 테스트가 이미 실행 중입니다.');
            return;
        }

        this.isRunning = true;
        this.isBackgroundMode = true;

        await this.log('info', '🔄 백그라운드 자동 테스트 시작', {
            interval: this.testInterval,
            mode: 'background'
        });

        // 즉시 첫 번째 테스트 실행
        await this.runBackgroundTest();

        // 주기적 테스트 실행
        this.backgroundTestInterval = setInterval(async () => {
            await this.runBackgroundTest();
        }, this.testInterval);

        console.log(`🔄 백그라운드 자동 테스트 시작됨 (${this.testInterval / 1000}초 간격)`);
    }

    /**
     * ⏸️ 백그라운드 자동 테스트 중지
     */
    async stopBackgroundTesting() {
        if (!this.isRunning) {
            console.log('⚠️ 자동 테스트가 실행 중이 아닙니다.');
            return;
        }

        this.isRunning = false;

        if (this.backgroundTestInterval) {
            clearInterval(this.backgroundTestInterval);
            this.backgroundTestInterval = null;
        }

        await this.log('info', '⏸️ 백그라운드 자동 테스트 중지');
        console.log('⏸️ 백그라운드 자동 테스트 중지됨');
    }

    /**
     * 🔄 백그라운드 테스트 실행
     */
    async runBackgroundTest() {
        try {
            await this.log('info', '🧪 백그라운드 테스트 실행 시작');

            const tester = new FeatureTester({
                baseUrl: 'http://localhost:3000',
                backgroundMode: true,
                testTimeout: 30000,
                actionTimeout: 5000,
                popupHandlingEnabled: true,
                screenshotsDir: path.join(this.resultsDir, 'background')
            });

            const result = await tester.runBackgroundTests();

            this.lastTestResult = result;
            this.addToHistory({
                type: 'background',
                timestamp: new Date().toISOString(),
                result: result
            });

            await this.log('info', '🧪 백그라운드 테스트 완료', {
                success: result.success,
                total: result.summary?.total || 0,
                passed: result.summary?.passed || 0,
                failed: result.summary?.failed || 0
            });

            // 결과 저장
            await this.saveTestResult('background', result);

            return result;

        } catch (error) {
            await this.log('error', '❌ 백그라운드 테스트 실행 실패', { error: error.message });
            console.error('❌ 백그라운드 테스트 실행 실패:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * 🎯 포그라운드 테스트 실행 (작업 요청 시)
     */
    async runForegroundTest() {
        try {
            await this.log('info', '🎯 포그라운드 테스트 실행 시작');

            const tester = new FeatureTester({
                baseUrl: 'http://localhost:3000',
                backgroundMode: false,
                testTimeout: 30000,
                actionTimeout: 5000,
                popupHandlingEnabled: true,
                screenshotsDir: path.join(this.resultsDir, 'foreground')
            });

            const result = await tester.runForegroundTests();

            this.lastTestResult = result;
            this.addToHistory({
                type: 'foreground',
                timestamp: new Date().toISOString(),
                result: result
            });

            await this.log('info', '🎯 포그라운드 테스트 완료', {
                success: result.success,
                total: result.summary?.total || 0,
                passed: result.summary?.passed || 0,
                failed: result.summary?.failed || 0
            });

            // 결과 저장
            await this.saveTestResult('foreground', result);

            return result;

        } catch (error) {
            await this.log('error', '❌ 포그라운드 테스트 실행 실패', { error: error.message });
            console.error('❌ 포그라운드 테스트 실행 실패:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * 📊 테스트 결과 저장
     */
    async saveTestResult(type, result) {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `${type}-test-${timestamp}.json`;
            const filepath = path.join(this.resultsDir, filename);

            const testData = {
                type,
                timestamp: new Date().toISOString(),
                result,
                summary: result.summary || {}
            };

            await fs.writeFile(filepath, JSON.stringify(testData, null, 2));
            console.log(`📊 테스트 결과 저장: ${filename}`);
        } catch (error) {
            console.error('❌ 테스트 결과 저장 실패:', error.message);
        }
    }

    /**
     * 📚 테스트 히스토리에 추가
     */
    addToHistory(entry) {
        this.testHistory.push(entry);

        // 히스토리 크기 제한
        if (this.testHistory.length > this.maxHistorySize) {
            this.testHistory = this.testHistory.slice(-this.maxHistorySize);
        }
    }

    /**
     * 📈 테스트 통계 조회
     */
    getTestStatistics() {
        const totalTests = this.testHistory.length;
        const backgroundTests = this.testHistory.filter(h => h.type === 'background').length;
        const foregroundTests = this.testHistory.filter(h => h.type === 'foreground').length;
        const successfulTests = this.testHistory.filter(h => h.result?.success).length;
        const failedTests = totalTests - successfulTests;

        return {
            total: totalTests,
            background: backgroundTests,
            foreground: foregroundTests,
            successful: successfulTests,
            failed: failedTests,
            successRate: totalTests > 0 ? Math.round((successfulTests / totalTests) * 100) : 0,
            lastTest: this.lastTestResult,
            isRunning: this.isRunning,
            mode: this.isBackgroundMode ? 'background' : 'foreground'
        };
    }

    /**
     * 📄 테스트 리포트 생성
     */
    async generateTestReport() {
        const stats = this.getTestStatistics();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const reportPath = path.join(this.resultsDir, `test-report-${timestamp}.json`);

        const report = {
            generatedAt: new Date().toISOString(),
            statistics: stats,
            recentTests: this.testHistory.slice(-10), // 최근 10개 테스트
            configuration: {
                testInterval: this.testInterval,
                maxHistorySize: this.maxHistorySize,
                logFile: this.logFile,
                resultsDir: this.resultsDir
            }
        };

        try {
            await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
            console.log(`📄 테스트 리포트 생성: ${reportPath}`);
            return reportPath;
        } catch (error) {
            console.error('❌ 테스트 리포트 생성 실패:', error.message);
            return null;
        }
    }

    /**
     * 🧹 오래된 결과 파일 정리
     */
    async cleanupOldResults(daysToKeep = 7) {
        try {
            const files = await fs.readdir(this.resultsDir);
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

            let cleanedCount = 0;
            for (const file of files) {
                const filePath = path.join(this.resultsDir, file);
                const stats = await fs.stat(filePath);

                if (stats.mtime < cutoffDate) {
                    await fs.unlink(filePath);
                    cleanedCount++;
                }
            }

            await this.log('info', `🧹 오래된 결과 파일 정리 완료`, {
                cleanedCount,
                daysToKeep
            });

            console.log(`🧹 ${cleanedCount}개의 오래된 결과 파일 정리 완료`);
        } catch (error) {
            console.error('❌ 결과 파일 정리 실패:', error.message);
        }
    }
}

// 모듈 내보내기
module.exports = AutoTestScheduler;

// 직접 실행 시
if (require.main === module) {
    const scheduler = new AutoTestScheduler({
        testInterval: 300000, // 5분
        logFile: './test-logs/auto-test.log',
        resultsDir: './test-results'
    });

    // 명령행 인수 처리
    const command = process.argv[2];

    switch (command) {
        case 'start':
            scheduler.startBackgroundTesting();
            break;
        case 'stop':
            scheduler.stopBackgroundTesting();
            break;
        case 'foreground':
            scheduler.runForegroundTest().then(result => {
                console.log('🎯 포그라운드 테스트 완료:', result);
                process.exit(result.success ? 0 : 1);
            });
            break;
        case 'stats':
            console.log('📊 테스트 통계:', scheduler.getTestStatistics());
            break;
        case 'report':
            scheduler.generateTestReport().then(path => {
                console.log('📄 리포트 생성 완료:', path);
            });
            break;
        case 'cleanup':
            scheduler.cleanupOldResults();
            break;
        default:
            console.log(`
🤖 자동 테스트 스케줄러 사용법:

node scripts/auto-test-scheduler.js <command>

명령어:
  start      - 백그라운드 자동 테스트 시작
  stop       - 백그라운드 자동 테스트 중지
  foreground - 포그라운드 테스트 실행 (작업 요청 시)
  stats      - 테스트 통계 조회
  report     - 테스트 리포트 생성
  cleanup    - 오래된 결과 파일 정리

예시:
  node scripts/auto-test-scheduler.js start
  node scripts/auto-test-scheduler.js foreground
  node scripts/auto-test-scheduler.js stats
            `);
    }
}
