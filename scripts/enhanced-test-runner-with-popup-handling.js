/**
 * 🚀 향상된 테스트 러너 - 팝업 처리 및 타임아웃 개선
 * 
 * 확인팝업 자동 처리, 타임아웃 개선, 백그라운드/포그라운드 테스트 지원
 * 
 * @author AUTOAGENTS Manager
 * @version 2.0.0
 * @created 2025-10-05
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

class EnhancedTestRunnerWithPopupHandling {
    constructor(options = {}) {
        this.browser = null;
        this.page = null;
        this.context = null;
        this.baseUrl = options.baseUrl || 'http://localhost:3000';
        this.screenshotsDir = options.screenshotsDir || './test-screenshots';
        this.results = [];
        this.isBackgroundMode = options.backgroundMode || false;
        this.testTimeout = options.testTimeout || 30000; // 30초 기본 타임아웃
        this.actionTimeout = options.actionTimeout || 5000; // 5초 액션 타임아웃
        this.popupHandlingEnabled = options.popupHandlingEnabled !== false;

        // 팝업 처리 설정
        this.popupHandlers = {
            alert: 'accept', // alert 자동 수락
            confirm: 'accept', // confirm 자동 수락
            prompt: 'accept' // prompt 자동 수락
        };

        this.initializeDirectories();
    }

    /**
     * 📁 디렉토리 초기화
     */
    async initializeDirectories() {
        try {
            await fs.mkdir(this.screenshotsDir, { recursive: true });
            console.log(`📁 스크린샷 디렉토리 준비: ${this.screenshotsDir}`);
        } catch (error) {
            console.error('❌ 디렉토리 생성 실패:', error.message);
        }
    }

    /**
     * 🚀 브라우저 초기화
     */
    async init() {
        try {
            console.log('🌐 브라우저 초기화 중...');

            this.browser = await puppeteer.launch({
                headless: this.isBackgroundMode, // 백그라운드 모드에서는 headless
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--disable-gpu',
                    '--disable-web-security',
                    '--disable-features=VizDisplayCompositor'
                ]
            });

            this.page = await this.browser.newPage();
            await this.page.setViewport({ width: 1280, height: 720 });
            await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

            // 팝업 처리 설정
            if (this.popupHandlingEnabled) {
                await this.setupPopupHandling();
            }

            // 타임아웃 설정
            this.page.setDefaultTimeout(this.testTimeout);
            this.page.setDefaultNavigationTimeout(this.testTimeout);

            console.log('✅ 브라우저 초기화 완료');
            return true;

        } catch (error) {
            console.error('❌ 브라우저 초기화 실패:', error.message);
            return false;
        }
    }

    /**
     * 🎭 팝업 처리 설정
     */
    async setupPopupHandling() {
        console.log('🎭 팝업 자동 처리 설정 중...');

        // alert, confirm, prompt 자동 처리
        this.page.on('dialog', async (dialog) => {
            const dialogType = dialog.type();
            const handler = this.popupHandlers[dialogType];

            console.log(`🎭 팝업 감지: ${dialogType} - ${dialog.message()}`);

            try {
                if (handler === 'accept') {
                    await dialog.accept();
                    console.log(`✅ 팝업 자동 수락: ${dialogType}`);
                } else if (handler === 'dismiss') {
                    await dialog.dismiss();
                    console.log(`❌ 팝업 자동 거부: ${dialogType}`);
                } else if (typeof handler === 'function') {
                    const result = await handler(dialog);
                    if (result === 'accept') {
                        await dialog.accept();
                    } else {
                        await dialog.dismiss();
                    }
                }
            } catch (error) {
                console.error(`❌ 팝업 처리 실패: ${error.message}`);
                try {
                    await dialog.dismiss();
                } catch (dismissError) {
                    console.error(`❌ 팝업 거부도 실패: ${dismissError.message}`);
                }
            }
        });

        // 새 창/탭 팝업 처리
        this.page.on('popup', async (popup) => {
            console.log('🪟 새 창 팝업 감지, 자동으로 닫기');
            try {
                await popup.close();
            } catch (error) {
                console.error('❌ 팝업 창 닫기 실패:', error.message);
            }
        });

        console.log('✅ 팝업 자동 처리 설정 완료');
    }

    /**
     * ⏱️ 타임아웃이 있는 액션 실행
     */
    async executeWithTimeout(action, timeout = this.actionTimeout, description = '') {
        return new Promise(async (resolve) => {
            const timer = setTimeout(() => {
                console.log(`⏰ 타임아웃 발생: ${description} (${timeout}ms)`);
                resolve({ success: false, error: 'TIMEOUT', message: `액션이 ${timeout}ms 내에 완료되지 않았습니다` });
            }, timeout);

            try {
                const result = await action();
                clearTimeout(timer);
                resolve({ success: true, result });
            } catch (error) {
                clearTimeout(timer);
                resolve({ success: false, error: error.message, message: `액션 실행 중 오류: ${error.message}` });
            }
        });
    }

    /**
     * 🔗 안전한 페이지 이동 (타임아웃 처리 포함)
     */
    async safeNavigate(url, description = '') {
        console.log(`🔗 페이지 이동: ${url} - ${description}`);

        const result = await this.executeWithTimeout(async () => {
            await this.page.goto(url, {
                waitUntil: 'networkidle0',
                timeout: this.testTimeout
            });
            await this.waitForPageStable();
            return true;
        }, this.testTimeout, `페이지 이동: ${url}`);

        if (result.success) {
            console.log(`✅ 페이지 이동 성공: ${url}`);
        } else {
            console.error(`❌ 페이지 이동 실패: ${url} - ${result.message}`);
        }

        return result.success;
    }

    /**
     * 🖱️ 안전한 요소 클릭 (타임아웃 처리 포함)
     */
    async safeClick(selector, description = '') {
        console.log(`🖱️ 요소 클릭: ${selector} - ${description}`);

        const result = await this.executeWithTimeout(async () => {
            // 요소가 존재하는지 먼저 확인
            const element = await this.page.waitForSelector(selector, { timeout: 5000 });
            if (!element) {
                throw new Error(`요소를 찾을 수 없습니다: ${selector}`);
            }

            // 요소가 클릭 가능한 상태인지 확인
            await this.page.waitForFunction(
                (sel) => {
                    const el = document.querySelector(sel);
                    return el && !el.disabled && el.offsetParent !== null;
                },
                selector,
                { timeout: 5000 }
            );

            await element.click();
            await this.waitForPageStable();
            return true;
        }, this.actionTimeout, `요소 클릭: ${selector}`);

        if (result.success) {
            console.log(`✅ 요소 클릭 성공: ${selector}`);
        } else {
            console.error(`❌ 요소 클릭 실패: ${selector} - ${result.message}`);
        }

        return result.success;
    }

    /**
     * ⌨️ 안전한 텍스트 입력 (타임아웃 처리 포함)
     */
    async safeType(selector, text, description = '') {
        console.log(`⌨️ 텍스트 입력: ${selector} - ${description}`);

        const result = await this.executeWithTimeout(async () => {
            const element = await this.page.waitForSelector(selector, { timeout: 5000 });
            if (!element) {
                throw new Error(`입력 요소를 찾을 수 없습니다: ${selector}`);
            }

            // 기존 텍스트 지우기
            await element.fill('');
            await element.type(text, { delay: 100 });
            await this.waitForPageStable();
            return true;
        }, this.actionTimeout, `텍스트 입력: ${selector}`);

        if (result.success) {
            console.log(`✅ 텍스트 입력 성공: ${selector}`);
        } else {
            console.error(`❌ 텍스트 입력 실패: ${selector} - ${result.message}`);
        }

        return result.success;
    }

    /**
     * 📸 스크린샷 촬영
     */
    async takeScreenshot(name, description = '') {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `${name}-${timestamp}.png`;
            const filepath = path.join(this.screenshotsDir, filename);

            await this.page.screenshot({
                path: filepath,
                fullPage: true
            });

            console.log(`📸 스크린샷 저장: ${filename} - ${description}`);
            return filepath;
        } catch (error) {
            console.error(`❌ 스크린샷 촬영 실패: ${error.message}`);
            return null;
        }
    }

    /**
     * ⏳ 페이지 안정화 대기
     */
    async waitForPageStable(timeout = 3000) {
        try {
            // 네트워크 활동이 없을 때까지 대기
            await this.page.waitForLoadState('networkidle0', { timeout: 2000 });

            // 추가 안정화 대기
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
            // 타임아웃이어도 계속 진행
            console.log('⏳ 페이지 안정화 대기 중 타임아웃, 계속 진행...');
        }
    }

    /**
     * 🧪 테스트 실행 (타임아웃 처리 포함)
     */
    async runTest(testName, testFunction, timeout = this.testTimeout) {
        console.log(`\n🧪 ${testName} 테스트 시작...`);

        const startTime = Date.now();
        const result = await this.executeWithTimeout(async () => {
            return await testFunction();
        }, timeout, testName);

        const duration = Date.now() - startTime;

        const testResult = {
            name: testName,
            success: result.success,
            duration: duration,
            timestamp: new Date().toISOString(),
            error: result.error || null,
            message: result.message || (result.success ? '테스트 성공' : '테스트 실패')
        };

        this.results.push(testResult);

        if (result.success) {
            console.log(`✅ ${testName} 테스트 완료 (${duration}ms)`);
        } else {
            console.error(`❌ ${testName} 테스트 실패 (${duration}ms): ${result.message}`);
        }

        return testResult;
    }

    /**
     * 🔄 백그라운드 테스트 실행
     */
    async runBackgroundTests() {
        console.log('🔄 백그라운드 테스트 모드로 실행 중...');
        this.isBackgroundMode = true;

        // 기존 브라우저 종료 후 백그라운드 모드로 재시작
        if (this.browser) {
            await this.cleanup();
        }

        await this.init();
        return await this.runAllTests();
    }

    /**
     * 🎯 포그라운드 테스트 실행
     */
    async runForegroundTests() {
        console.log('🎯 포그라운드 테스트 모드로 실행 중...');
        this.isBackgroundMode = false;

        // 기존 브라우저 종료 후 포그라운드 모드로 재시작
        if (this.browser) {
            await this.cleanup();
        }

        await this.init();
        return await this.runAllTests();
    }

    /**
     * 🧪 모든 테스트 실행
     */
    async runAllTests() {
        console.log('🚀 향상된 테스트 러너 시작!');

        if (!await this.init()) {
            console.error('❌ 브라우저 초기화 실패');
            return { success: false, results: [] };
        }

        try {
            // 기본 페이지 테스트
            await this.runTest('메인 페이지 로딩', async () => {
                const success = await this.safeNavigate(this.baseUrl, '메인 페이지 로딩');
                if (success) {
                    await this.takeScreenshot('main-page', '메인 페이지');
                }
                return { success };
            });

            // 로그인 테스트
            await this.runTest('로그인 기능', async () => {
                const loginSuccess = await this.safeClick('#login-button', '로그인 버튼 클릭');
                if (loginSuccess) {
                    await this.takeScreenshot('login-page', '로그인 페이지');

                    // 로그인 폼 입력
                    await this.safeType('#username', 'testuser', '사용자명 입력');
                    await this.safeType('#password', 'testpass', '비밀번호 입력');
                    await this.safeClick('#submit-login', '로그인 제출');

                    await this.takeScreenshot('login-submitted', '로그인 제출');
                }
                return { success: loginSuccess };
            });

            // 팝업 테스트
            await this.runTest('팝업 처리 테스트', async () => {
                // 팝업을 발생시키는 버튼 클릭
                const popupSuccess = await this.safeClick('#popup-trigger', '팝업 트리거 버튼');
                if (popupSuccess) {
                    await this.takeScreenshot('popup-handled', '팝업 처리됨');
                }
                return { success: popupSuccess };
            });

            // 폼 제출 테스트
            await this.runTest('폼 제출 테스트', async () => {
                const formSuccess = await this.safeClick('#form-submit', '폼 제출 버튼');
                if (formSuccess) {
                    await this.takeScreenshot('form-submitted', '폼 제출됨');
                }
                return { success: formSuccess };
            });

            console.log('\n📊 테스트 결과 요약:');
            this.results.forEach(result => {
                const status = result.success ? '✅' : '❌';
                console.log(`${status} ${result.name}: ${result.message} (${result.duration}ms)`);
            });

            const successCount = this.results.filter(r => r.success).length;
            const totalCount = this.results.length;

            console.log(`\n🎯 테스트 완료: ${successCount}/${totalCount} 성공`);

            return {
                success: successCount === totalCount,
                results: this.results,
                summary: {
                    total: totalCount,
                    passed: successCount,
                    failed: totalCount - successCount,
                    successRate: Math.round((successCount / totalCount) * 100)
                }
            };

        } catch (error) {
            console.error('❌ 테스트 실행 중 오류:', error.message);
            return { success: false, error: error.message, results: this.results };
        } finally {
            await this.cleanup();
        }
    }

    /**
     * 🧹 리소스 정리
     */
    async cleanup() {
        try {
            if (this.browser) {
                await this.browser.close();
            }
            console.log('🧹 브라우저 리소스 정리 완료');
        } catch (error) {
            console.error('❌ 리소스 정리 중 오류:', error.message);
        }
    }

    /**
     * 📄 테스트 리포트 생성
     */
    async generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                total: this.results.length,
                passed: this.results.filter(r => r.success).length,
                failed: this.results.filter(r => !r.success).length
            },
            results: this.results,
            configuration: {
                baseUrl: this.baseUrl,
                testTimeout: this.testTimeout,
                actionTimeout: this.actionTimeout,
                popupHandlingEnabled: this.popupHandlingEnabled,
                backgroundMode: this.isBackgroundMode
            }
        };

        const reportPath = path.join(this.screenshotsDir, 'test-report.json');
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
        console.log(`📄 테스트 리포트 저장: ${reportPath}`);

        return report;
    }
}

// 모듈 내보내기
module.exports = EnhancedTestRunnerWithPopupHandling;

// 직접 실행 시
if (require.main === module) {
    const runner = new EnhancedTestRunnerWithPopupHandling({
        baseUrl: 'http://localhost:3000',
        backgroundMode: process.argv.includes('--background'),
        testTimeout: 30000,
        actionTimeout: 5000,
        popupHandlingEnabled: true
    });

    // 백그라운드 모드 확인
    if (process.argv.includes('--background')) {
        runner.runBackgroundTests().then(result => {
            console.log('🔄 백그라운드 테스트 완료:', result);
            process.exit(result.success ? 0 : 1);
        });
    } else {
        runner.runForegroundTests().then(result => {
            console.log('🎯 포그라운드 테스트 완료:', result);
            process.exit(result.success ? 0 : 1);
        });
    }
}
