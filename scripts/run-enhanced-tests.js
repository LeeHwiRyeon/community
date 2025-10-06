/**
 * 🚀 향상된 테스트 실행 스크립트
 * 
 * 팝업 처리, 타임아웃 개선, 백그라운드/포그라운드 모드 지원
 * 
 * @author AUTOAGENTS Manager
 * @version 2.0.0
 * @created 2025-10-05
 */

const AutoTestScheduler = require('./auto-test-scheduler');
const FeatureTester = require('./test-all-features');
const EnhancedTestRunner = require('./enhanced-test-runner-with-popup-handling');

class EnhancedTestManager {
    constructor() {
        this.scheduler = new AutoTestScheduler({
            testInterval: 300000, // 5분
            logFile: './test-logs/enhanced-test.log',
            resultsDir: './test-results/enhanced'
        });
    }

    /**
     * 🎯 포그라운드 테스트 실행 (작업 요청 시)
     */
    async runForegroundTests() {
        console.log('🎯 포그라운드 테스트 실행 시작...');
        console.log('='.repeat(60));

        try {
            // 향상된 테스트 러너 사용
            const runner = new EnhancedTestRunner({
                baseUrl: 'http://localhost:3000',
                backgroundMode: false,
                testTimeout: 30000,
                actionTimeout: 5000,
                popupHandlingEnabled: true,
                screenshotsDir: './test-screenshots/enhanced-foreground'
            });

            const result = await runner.runForegroundTests();

            console.log('\n📊 포그라운드 테스트 결과:');
            console.log(`✅ 성공: ${result.summary?.passed || 0}개`);
            console.log(`❌ 실패: ${result.summary?.failed || 0}개`);
            console.log(`📈 성공률: ${result.summary?.successRate || 0}%`);

            return result;

        } catch (error) {
            console.error('❌ 포그라운드 테스트 실행 실패:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * 🔄 백그라운드 테스트 시작
     */
    async startBackgroundTests() {
        console.log('🔄 백그라운드 자동 테스트 시작...');

        try {
            await this.scheduler.startBackgroundTesting();
            console.log('✅ 백그라운드 자동 테스트가 시작되었습니다.');
            console.log('💡 테스트 요청 시 포그라운드 모드로 전환됩니다.');

            return { success: true, message: '백그라운드 테스트 시작됨' };
        } catch (error) {
            console.error('❌ 백그라운드 테스트 시작 실패:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * ⏸️ 백그라운드 테스트 중지
     */
    async stopBackgroundTests() {
        console.log('⏸️ 백그라운드 자동 테스트 중지...');

        try {
            await this.scheduler.stopBackgroundTesting();
            console.log('✅ 백그라운드 자동 테스트가 중지되었습니다.');

            return { success: true, message: '백그라운드 테스트 중지됨' };
        } catch (error) {
            console.error('❌ 백그라운드 테스트 중지 실패:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * 📊 테스트 통계 조회
     */
    async getTestStatistics() {
        const stats = this.scheduler.getTestStatistics();

        console.log('\n📊 테스트 통계:');
        console.log('='.repeat(40));
        console.log(`총 테스트 수: ${stats.total}개`);
        console.log(`백그라운드 테스트: ${stats.background}개`);
        console.log(`포그라운드 테스트: ${stats.foreground}개`);
        console.log(`성공한 테스트: ${stats.successful}개`);
        console.log(`실패한 테스트: ${stats.failed}개`);
        console.log(`성공률: ${stats.successRate}%`);
        console.log(`현재 상태: ${stats.isRunning ? '실행 중' : '중지됨'}`);
        console.log(`현재 모드: ${stats.mode}`);

        return stats;
    }

    /**
     * 📄 테스트 리포트 생성
     */
    async generateTestReport() {
        console.log('📄 테스트 리포트 생성 중...');

        try {
            const reportPath = await this.scheduler.generateTestReport();
            console.log(`✅ 테스트 리포트 생성 완료: ${reportPath}`);

            return { success: true, reportPath };
        } catch (error) {
            console.error('❌ 테스트 리포트 생성 실패:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * 🧹 오래된 결과 정리
     */
    async cleanupOldResults() {
        console.log('🧹 오래된 테스트 결과 정리 중...');

        try {
            await this.scheduler.cleanupOldResults(7); // 7일 이상 된 파일 삭제
            console.log('✅ 오래된 테스트 결과 정리 완료');

            return { success: true, message: '정리 완료' };
        } catch (error) {
            console.error('❌ 결과 정리 실패:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * 🔍 테스트 상태 모니터링
     */
    async monitorTestStatus() {
        console.log('🔍 테스트 상태 모니터링 시작...');

        const monitorInterval = setInterval(async () => {
            const stats = this.scheduler.getTestStatistics();

            console.log(`\n[${new Date().toLocaleTimeString()}] 테스트 상태:`);
            console.log(`  상태: ${stats.isRunning ? '🔄 실행 중' : '⏸️ 중지됨'}`);
            console.log(`  모드: ${stats.mode}`);
            console.log(`  성공률: ${stats.successRate}%`);

            if (stats.lastTest) {
                console.log(`  마지막 테스트: ${stats.lastTest.success ? '✅ 성공' : '❌ 실패'}`);
            }
        }, 30000); // 30초마다 상태 출력

        // 5분 후 모니터링 중지
        setTimeout(() => {
            clearInterval(monitorInterval);
            console.log('🔍 테스트 상태 모니터링 중지');
        }, 300000);
    }
}

// 명령행 인터페이스
async function main() {
    const runner = new EnhancedTestManager();
    const command = process.argv[2];
    const subCommand = process.argv[3];

    console.log('🚀 향상된 테스트 실행기 v2.0.0');
    console.log('='.repeat(50));

    try {
        switch (command) {
            case 'foreground':
            case 'fg':
                await runner.runForegroundTests();
                break;

            case 'background':
            case 'bg':
                if (subCommand === 'start') {
                    await runner.startBackgroundTests();
                } else if (subCommand === 'stop') {
                    await runner.stopBackgroundTests();
                } else {
                    console.log('사용법: node run-enhanced-tests.js background [start|stop]');
                }
                break;

            case 'stats':
                await runner.getTestStatistics();
                break;

            case 'report':
                await runner.generateTestReport();
                break;

            case 'cleanup':
                await runner.cleanupOldResults();
                break;

            case 'monitor':
                await runner.monitorTestStatus();
                break;

            case 'help':
            default:
                console.log(`
🤖 향상된 테스트 실행기 사용법:

기본 명령어:
  foreground, fg     - 포그라운드 테스트 실행 (작업 요청 시)
  background, bg     - 백그라운드 테스트 관리
    start           - 백그라운드 자동 테스트 시작
    stop            - 백그라운드 자동 테스트 중지
  stats             - 테스트 통계 조회
  report            - 테스트 리포트 생성
  cleanup           - 오래된 결과 파일 정리
  monitor           - 테스트 상태 모니터링 (5분간)
  help              - 도움말 표시

예시:
  node scripts/run-enhanced-tests.js foreground
  node scripts/run-enhanced-tests.js background start
  node scripts/run-enhanced-tests.js background stop
  node scripts/run-enhanced-tests.js stats
  node scripts/run-enhanced-tests.js monitor

특징:
  ✅ 팝업 자동 처리 (alert, confirm, prompt)
  ✅ 타임아웃 개선 (5초 액션 타임아웃, 30초 테스트 타임아웃)
  ✅ 백그라운드/포그라운드 모드 지원
  ✅ 상세한 로깅 및 에러 처리
  ✅ 자동 결과 저장 및 통계
                `);
                break;
        }
    } catch (error) {
        console.error('❌ 명령 실행 실패:', error.message);
        process.exit(1);
    }
}

// 스크립트 실행
if (require.main === module) {
    main().catch(error => {
        console.error('❌ 스크립트 실행 실패:', error.message);
        process.exit(1);
    });
}

module.exports = EnhancedTestManager;
