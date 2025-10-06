/**
 * 🌐 실제 브라우저 테스트 실행기
 * 
 * 실제 홈페이지에서 버튼을 누르고 결과를 확인하는 테스트
 * 
 * @author AUTOAGENTS Manager
 * @version 3.0.0
 * @created 2025-01-02
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class RealBrowserTestRunner {
    constructor() {
        this.browser = null;
        this.page = null;
        this.baseUrl = 'http://localhost:3000';
        this.screenshotsDir = 'reports/dev-v1.0.0/test-v1.0.0/screenshots';
        this.logsDir = 'reports/dev-v1.0.0/test-v1.0.0/logs';
        this.testResults = [];
        this.currentTest = null;
    }

    // 브라우저 초기화
    async initBrowser() {
        console.log('🌐 브라우저 초기화 중...');
        this.browser = await puppeteer.launch({
            headless: false, // 실제 브라우저 창을 띄워서 확인
            defaultViewport: { width: 1920, height: 1080 },
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
        });
        this.page = await this.browser.newPage();

        // 디렉토리 생성
        if (!fs.existsSync(this.screenshotsDir)) {
            fs.mkdirSync(this.screenshotsDir, { recursive: true });
        }
        if (!fs.existsSync(this.logsDir)) {
            fs.mkdirSync(this.logsDir, { recursive: true });
        }

        console.log('✅ 브라우저 초기화 완료');
    }

    // 스크린샷 촬영
    async takeScreenshot(name, description = '') {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `${name}-${timestamp}.png`;
        const filepath = path.join(this.screenshotsDir, filename);

        await this.page.screenshot({
            path: filepath,
            fullPage: true
        });

        console.log(`📸 스크린샷 촬영: ${filename} - ${description}`);
        return filename;
    }

    // 로그 기록
    log(level, message, data = {}) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            level: level,
            message: message,
            data: data,
            test: this.currentTest
        };

        console.log(`📝 [${level.toUpperCase()}] ${message}`);
        return logEntry;
    }

    // 페이지 로딩 대기
    async waitForPageLoad(timeout = 10000) {
        try {
            await this.page.waitForLoadState('networkidle', { timeout });
            await new Promise(resolve => setTimeout(resolve, 2000)); // 추가 대기
        } catch (error) {
            console.log('페이지 로딩 대기 중 타임아웃, 계속 진행...');
        }
    }

    // 실제 기능 테스트 실행
    async runRealFeatureTest(featureName, testSteps) {
        console.log(`\n🧪 ${featureName} 실제 테스트 시작...`);
        this.currentTest = featureName;

        const testStartTime = new Date();
        const logs = [];
        const screenshots = [];
        let testResult = {
            success: false,
            issues: [],
            recommendations: []
        };

        try {
            // 테스트 시작 로그
            logs.push(this.log('info', `${featureName} 테스트 시작`));

            // 각 테스트 단계 실행
            for (const step of testSteps) {
                console.log(`\n📋 단계: ${step.name}`);
                logs.push(this.log('info', `테스트 단계 시작: ${step.name}`));

                // 페이지 이동
                if (step.url) {
                    console.log(`🔗 페이지 이동: ${this.baseUrl}${step.url}`);
                    await this.page.goto(`${this.baseUrl}${step.url}`, {
                        waitUntil: 'networkidle0',
                        timeout: 30000
                    });
                    await this.waitForPageLoad();

                    // 페이지 로딩 후 스크린샷
                    const screenshot = await this.takeScreenshot(
                        `${featureName.toLowerCase().replace(/\s+/g, '-')}-${step.name.toLowerCase().replace(/\s+/g, '-')}`,
                        `페이지 로딩 후: ${step.name}`
                    );
                    screenshots.push(screenshot);
                }

                // 요소 확인
                if (step.checkElements) {
                    for (const element of step.checkElements) {
                        try {
                            const elementHandle = await this.page.waitForSelector(element.selector, { timeout: 10000 });
                            if (elementHandle) {
                                console.log(`✅ 요소 확인: ${element.name}`);
                                logs.push(this.log('success', `요소 확인 성공: ${element.name}`));
                            }
                        } catch (error) {
                            console.log(`❌ 요소 확인 실패: ${element.name}`);
                            logs.push(this.log('error', `요소 확인 실패: ${element.name}`, { error: error.message }));
                            testResult.issues.push({
                                type: 'element_not_found',
                                description: `${element.name} 요소를 찾을 수 없습니다`
                            });
                        }
                    }
                }

                // 버튼 클릭
                if (step.clickButtons) {
                    for (const button of step.clickButtons) {
                        try {
                            console.log(`🖱️ 버튼 클릭: ${button.name}`);
                            const buttonHandle = await this.page.waitForSelector(button.selector, { timeout: 10000 });

                            if (buttonHandle) {
                                await buttonHandle.click();
                                await new Promise(resolve => setTimeout(resolve, 2000)); // 클릭 후 대기

                                // 클릭 후 스크린샷
                                const screenshot = await this.takeScreenshot(
                                    `${featureName.toLowerCase().replace(/\s+/g, '-')}-${button.name.toLowerCase().replace(/\s+/g, '-')}-clicked`,
                                    `버튼 클릭 후: ${button.name}`
                                );
                                screenshots.push(screenshot);

                                logs.push(this.log('success', `버튼 클릭 성공: ${button.name}`));

                                // 결과 확인
                                if (button.expectedResult) {
                                    await this.checkExpectedResult(button.expectedResult, logs, testResult);
                                }
                            }
                        } catch (error) {
                            console.log(`❌ 버튼 클릭 실패: ${button.name}`);
                            logs.push(this.log('error', `버튼 클릭 실패: ${button.name}`, { error: error.message }));
                            testResult.issues.push({
                                type: 'button_click_failed',
                                description: `${button.name} 버튼 클릭에 실패했습니다`
                            });
                        }
                    }
                }

                // 폼 입력
                if (step.fillForms) {
                    for (const form of step.fillForms) {
                        try {
                            console.log(`📝 폼 입력: ${form.name}`);
                            const inputHandle = await this.page.waitForSelector(form.selector, { timeout: 10000 });

                            if (inputHandle) {
                                await inputHandle.type(form.value);
                                await new Promise(resolve => setTimeout(resolve, 1000));

                                logs.push(this.log('success', `폼 입력 성공: ${form.name}`));
                            }
                        } catch (error) {
                            console.log(`❌ 폼 입력 실패: ${form.name}`);
                            logs.push(this.log('error', `폼 입력 실패: ${form.name}`, { error: error.message }));
                            testResult.issues.push({
                                type: 'form_input_failed',
                                description: `${form.name} 폼 입력에 실패했습니다`
                            });
                        }
                    }
                }

                // 네비게이션 확인
                if (step.navigation) {
                    try {
                        console.log(`🧭 네비게이션 확인: ${step.navigation.expectedUrl}`);
                        const currentUrl = this.page.url();

                        if (currentUrl.includes(step.navigation.expectedUrl)) {
                            console.log(`✅ 네비게이션 성공: ${currentUrl}`);
                            logs.push(this.log('success', `네비게이션 성공: ${currentUrl}`));
                        } else {
                            console.log(`❌ 네비게이션 실패: 예상 ${step.navigation.expectedUrl}, 실제 ${currentUrl}`);
                            logs.push(this.log('error', `네비게이션 실패: 예상 ${step.navigation.expectedUrl}, 실제 ${currentUrl}`));
                            testResult.issues.push({
                                type: 'navigation_failed',
                                description: `예상 URL로 이동하지 않았습니다. 예상: ${step.navigation.expectedUrl}, 실제: ${currentUrl}`
                            });
                        }
                    } catch (error) {
                        logs.push(this.log('error', `네비게이션 확인 실패`, { error: error.message }));
                    }
                }
            }

            // 테스트 완료
            const testEndTime = new Date();
            const duration = testEndTime - testStartTime;

            testResult.success = testResult.issues.length === 0;
            testResult.duration = duration;
            testResult.screenshots = screenshots;
            testResult.logs = logs;

            logs.push(this.log('info', `${featureName} 테스트 완료`, {
                success: testResult.success,
                duration: duration,
                issues: testResult.issues.length
            }));

            console.log(`✅ ${featureName} 테스트 완료: ${testResult.success ? '성공' : '실패'}`);
            if (testResult.issues.length > 0) {
                console.log(`   ⚠️ 발견된 문제: ${testResult.issues.length}개`);
            }

            return {
                feature: featureName,
                success: testResult.success,
                duration: duration,
                screenshots: screenshots,
                logs: logs,
                issues: testResult.issues,
                recommendations: testResult.recommendations
            };

        } catch (error) {
            console.error(`❌ ${featureName} 테스트 중 오류 발생:`, error.message);
            logs.push(this.log('error', `테스트 중 오류 발생: ${error.message}`));

            return {
                feature: featureName,
                success: false,
                duration: new Date() - testStartTime,
                screenshots: screenshots,
                logs: logs,
                issues: [{
                    type: 'test_error',
                    description: error.message
                }],
                recommendations: [{
                    priority: 'high',
                    description: '테스트 오류 수정이 필요합니다'
                }]
            };
        }
    }

    // 예상 결과 확인
    async checkExpectedResult(expectedResult, logs, testResult) {
        try {
            if (expectedResult.element) {
                const element = await this.page.waitForSelector(expectedResult.element.selector, { timeout: 5000 });
                if (element) {
                    console.log(`✅ 예상 결과 확인: ${expectedResult.element.name}`);
                    logs.push(this.log('success', `예상 결과 확인 성공: ${expectedResult.element.name}`));
                } else {
                    console.log(`❌ 예상 결과 확인 실패: ${expectedResult.element.name}`);
                    logs.push(this.log('error', `예상 결과 확인 실패: ${expectedResult.element.name}`));
                    testResult.issues.push({
                        type: 'expected_result_not_found',
                        description: `예상 결과 요소를 찾을 수 없습니다: ${expectedResult.element.name}`
                    });
                }
            }

            if (expectedResult.text) {
                const pageContent = await this.page.content();
                if (pageContent.includes(expectedResult.text)) {
                    console.log(`✅ 예상 텍스트 확인: ${expectedResult.text}`);
                    logs.push(this.log('success', `예상 텍스트 확인 성공: ${expectedResult.text}`));
                } else {
                    console.log(`❌ 예상 텍스트 확인 실패: ${expectedResult.text}`);
                    logs.push(this.log('error', `예상 텍스트 확인 실패: ${expectedResult.text}`));
                    testResult.issues.push({
                        type: 'expected_text_not_found',
                        description: `예상 텍스트를 찾을 수 없습니다: ${expectedResult.text}`
                    });
                }
            }
        } catch (error) {
            logs.push(this.log('error', `예상 결과 확인 중 오류`, { error: error.message }));
        }
    }

    // 전체 실제 테스트 실행
    async runAllRealTests() {
        console.log('🚀 실제 브라우저 테스트 시작!');
        console.log('='.repeat(60));

        await this.initBrowser();

        const testStartTime = new Date();
        const testResults = [];

        // 실제 테스트 시나리오 정의
        const testScenarios = [
            {
                name: '메인 페이지',
                steps: [
                    {
                        name: '메인 페이지 로딩',
                        url: '/',
                        checkElements: [
                            { name: '히어로 섹션', selector: '[data-testid="hero-section"], h1, .hero, .main-title' },
                            { name: '통계 카드', selector: '[data-testid="stats-card"], .stats, .metric-card' },
                            { name: '기능 그리드', selector: '[data-testid="feature-grid"], .features, .grid' }
                        ]
                    },
                    {
                        name: '버튼 클릭 테스트',
                        clickButtons: [
                            {
                                name: '시작하기 버튼',
                                selector: 'button:contains("시작"), button:contains("Start"), .btn-primary, .start-btn',
                                expectedResult: {
                                    element: { name: '로그인 페이지', selector: '.login, .auth, [data-testid="login"]' }
                                }
                            }
                        ]
                    }
                ]
            },
            {
                name: '로그인 시스템',
                steps: [
                    {
                        name: '로그인 페이지 로딩',
                        url: '/login',
                        checkElements: [
                            { name: '로그인 폼', selector: '.login-form, form, .auth-form' },
                            { name: '익명 로그인 버튼', selector: 'button:contains("익명"), button:contains("Anonymous")' },
                            { name: '구글 로그인 버튼', selector: 'button:contains("Google"), button:contains("구글")' }
                        ]
                    },
                    {
                        name: '익명 로그인 테스트',
                        clickButtons: [
                            {
                                name: '익명 로그인',
                                selector: 'button:contains("익명"), button:contains("Anonymous")',
                                expectedResult: {
                                    text: '로그인 성공',
                                    element: { name: '프로필 페이지', selector: '.profile, .user-profile' }
                                }
                            }
                        ]
                    }
                ]
            },
            {
                name: '사용자 프로필',
                steps: [
                    {
                        name: '프로필 페이지 로딩',
                        url: '/profile',
                        checkElements: [
                            { name: '프로필 정보', selector: '.profile-info, .user-info, .profile-card' },
                            { name: '편집 버튼', selector: 'button:contains("편집"), button:contains("Edit")' }
                        ]
                    },
                    {
                        name: '프로필 편집 테스트',
                        clickButtons: [
                            {
                                name: '프로필 편집',
                                selector: 'button:contains("편집"), button:contains("Edit")',
                                expectedResult: {
                                    element: { name: '편집 폼', selector: '.edit-form, .profile-form' }
                                }
                            }
                        ]
                    }
                ]
            },
            {
                name: '성능 대시보드',
                steps: [
                    {
                        name: '성능 대시보드 로딩',
                        url: '/performance-dashboard',
                        checkElements: [
                            { name: '성능 메트릭', selector: '.metrics, .performance-metrics, [data-testid="performance-metric"]' },
                            { name: '차트', selector: '.chart, .graph, canvas, svg' }
                        ]
                    }
                ]
            },
            {
                name: '커뮤니티 게임',
                steps: [
                    {
                        name: '커뮤니티 게임 페이지 로딩',
                        url: '/community-game',
                        checkElements: [
                            { name: '게임 목록', selector: '.game-list, .games, [data-testid="game-list"]' },
                            { name: '리더보드', selector: '.leaderboard, .ranking, [data-testid="leaderboard"]' }
                        ]
                    }
                ]
            },
            {
                name: '다국어 지원',
                steps: [
                    {
                        name: '다국어 지원 페이지 로딩',
                        url: '/internationalization',
                        checkElements: [
                            { name: '언어 선택기', selector: '.language-selector, select, [data-testid="language-selector"]' },
                            { name: '번역된 텍스트', selector: '.translated-content, [data-testid="translated-content"]' }
                        ]
                    }
                ]
            },
            {
                name: '분석 대시보드',
                steps: [
                    {
                        name: '분석 대시보드 로딩',
                        url: '/analytics',
                        checkElements: [
                            { name: '분석 차트', selector: '.analytics-chart, .chart, [data-testid="analytics-chart"]' },
                            { name: '사용자 행동 분석', selector: '.behavior-analysis, [data-testid="behavior-analysis"]' }
                        ]
                    }
                ]
            },
            {
                name: '스팸 방지',
                steps: [
                    {
                        name: '스팸 방지 페이지 로딩',
                        url: '/spam-prevention',
                        checkElements: [
                            { name: '스팸 감지 설정', selector: '.spam-settings, [data-testid="spam-settings"]' },
                            { name: '자동 모더레이션', selector: '.auto-moderation, [data-testid="auto-moderation"]' }
                        ]
                    }
                ]
            }
        ];

        // 각 테스트 시나리오 실행
        for (const scenario of testScenarios) {
            const result = await this.runRealFeatureTest(scenario.name, scenario.steps);
            testResults.push(result);
        }

        const testEndTime = new Date();
        const totalDuration = testEndTime - testStartTime;

        // 결과 리포트 생성
        await this.generateRealTestReport(testResults, totalDuration);

        await this.browser.close();

        // 최종 요약
        const successfulTests = testResults.filter(r => r.success).length;
        const failedTests = testResults.length - successfulTests;
        const successRate = Math.round((successfulTests / testResults.length) * 100);

        console.log('\n🎉 실제 브라우저 테스트 완료!');
        console.log(`📊 성공률: ${successRate}% (${successfulTests}/${testResults.length})`);
        console.log(`⏱️ 총 소요 시간: ${Math.round(totalDuration / 1000)}초`);
        console.log(`📁 스크린샷 위치: ${this.screenshotsDir}`);
        console.log(`📁 로그 위치: ${this.logsDir}`);

        return {
            totalTests: testResults.length,
            successfulTests: successfulTests,
            failedTests: failedTests,
            successRate: successRate,
            totalDuration: totalDuration,
            testResults: testResults
        };
    }

    // 실제 테스트 리포트 생성
    async generateRealTestReport(testResults, totalDuration) {
        const reportData = {
            version: '1.0.0',
            timestamp: new Date().toISOString(),
            type: 'real_browser_test',
            totalDuration: totalDuration,
            results: testResults,
            summary: {
                total: testResults.length,
                passed: testResults.filter(r => r.success).length,
                failed: testResults.filter(r => !r.success).length,
                successRate: Math.round((testResults.filter(r => r.success).length / testResults.length) * 100)
            }
        };

        const reportPath = path.join('reports/dev-v1.0.0/test-v1.0.0', 'real-browser-test-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));

        console.log(`📄 실제 테스트 리포트 생성: ${reportPath}`);
        return reportPath;
    }
}

// 실행
if (require.main === module) {
    const runner = new RealBrowserTestRunner();
    runner.runAllRealTests().catch(console.error);
}

module.exports = RealBrowserTestRunner;
