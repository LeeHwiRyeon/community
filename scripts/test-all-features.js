/**
 * 🧪 전체 기능 테스트 및 스크린샷 생성
 * 
 * 모든 기능을 테스트하고 스크린샷/GIF를 생성합니다.
 * 
 * @author AUTOAGENTS Manager
 * @version 3.0.0
 * @created 2025-01-02
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class FeatureTester {
    constructor(options = {}) {
        this.browser = null;
        this.page = null;
        this.baseUrl = options.baseUrl || 'http://localhost:3000';
        this.screenshotsDir = options.screenshotsDir || 'feature-screenshots';
        this.results = [];
        this.isBackgroundMode = options.backgroundMode || false;
        this.testTimeout = options.testTimeout || 30000; // 30초 기본 타임아웃
        this.actionTimeout = options.actionTimeout || 5000; // 5초 액션 타임아웃
        this.popupHandlingEnabled = options.popupHandlingEnabled !== false;
    }

    async init() {
        console.log('🚀 브라우저 초기화 중...');
        this.browser = await puppeteer.launch({
            headless: this.isBackgroundMode, // 백그라운드 모드에서는 headless
            defaultViewport: { width: 1920, height: 1080 },
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

        // 팝업 처리 설정
        if (this.popupHandlingEnabled) {
            await this.setupPopupHandling();
        }

        // 타임아웃 설정
        this.page.setDefaultTimeout(this.testTimeout);
        this.page.setDefaultNavigationTimeout(this.testTimeout);

        // 스크린샷 디렉토리 생성
        if (!fs.existsSync(this.screenshotsDir)) {
            fs.mkdirSync(this.screenshotsDir, { recursive: true });
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
            console.log(`🎭 팝업 감지: ${dialogType} - ${dialog.message()}`);

            try {
                await dialog.accept();
                console.log(`✅ 팝업 자동 수락: ${dialogType}`);
            } catch (error) {
                console.error(`❌ 팝업 처리 실패: ${error.message}`);
                try {
                    await dialog.dismiss();
                } catch (dismissError) {
                    console.error(`❌ 팝업 거부도 실패: ${dismissError.message}`);
                }
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

    async testFeature(name, url, description, testFunction) {
        console.log(`\n🧪 ${name} 테스트 시작...`);

        const startTime = Date.now();

        try {
            // 페이지 이동 (타임아웃 처리)
            const navigateResult = await this.executeWithTimeout(async () => {
                await this.page.goto(`${this.baseUrl}${url}`, {
                    waitUntil: 'networkidle0',
                    timeout: this.testTimeout
                });
                return true;
            }, this.testTimeout, `페이지 이동: ${url}`);

            if (!navigateResult.success) {
                throw new Error(`페이지 이동 실패: ${navigateResult.message}`);
            }

            // 페이지 안정화 대기
            await this.waitForPageStable();

            // 스크린샷 촬영
            const screenshotPath = path.join(this.screenshotsDir, `${name.toLowerCase().replace(/\s+/g, '-')}.png`);
            await this.page.screenshot({
                path: screenshotPath,
                fullPage: true
            });

            // 기능 테스트 실행 (타임아웃 처리)
            const testResult = await this.executeWithTimeout(async () => {
                return await testFunction(this.page);
            }, this.testTimeout, `기능 테스트: ${name}`);

            const duration = Date.now() - startTime;

            this.results.push({
                name,
                url,
                description,
                screenshot: screenshotPath,
                status: testResult.success ? '✅ 성공' : '❌ 실패',
                details: testResult.success ? testResult.result?.details : testResult.message,
                duration: duration,
                timestamp: new Date().toISOString()
            });

            console.log(`✅ ${name} 테스트 완료: ${testResult.success ? '성공' : '실패'} (${duration}ms)`);
            if (testResult.success && testResult.result?.details) {
                console.log(`   📝 ${testResult.result.details}`);
            } else if (!testResult.success) {
                console.log(`   ❌ ${testResult.message}`);
            }

        } catch (error) {
            const duration = Date.now() - startTime;
            console.error(`❌ ${name} 테스트 실패:`, error.message);
            this.results.push({
                name,
                url,
                description,
                screenshot: null,
                status: '❌ 오류',
                details: error.message,
                duration: duration,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * ⏳ 페이지 안정화 대기
     */
    async waitForPageStable(timeout = 3000) {
        try {
            // 네트워크 활동이 없을 때까지 대기
            await this.page.waitForLoadState('networkidle', { timeout: 2000 });

            // 추가 안정화 대기
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
            // 타임아웃이어도 계속 진행
            console.log('⏳ 페이지 안정화 대기 중 타임아웃, 계속 진행...');
        }
    }

    // 🏠 메인 페이지 테스트
    async testMainPage(page) {
        try {
            // 페이지 제목 확인
            const title = await page.title();
            if (!title.includes('Community Platform')) {
                throw new Error('페이지 제목이 올바르지 않습니다.');
            }

            // 주요 요소 확인
            const heroSection = await page.$('[data-testid="hero-section"]');
            if (!heroSection) {
                throw new Error('히어로 섹션을 찾을 수 없습니다.');
            }

            // 통계 카드 확인
            const statsCards = await page.$$('[data-testid="stats-card"]');
            if (statsCards.length === 0) {
                throw new Error('통계 카드를 찾을 수 없습니다.');
            }

            // 기능 그리드 확인
            const featureGrid = await page.$('[data-testid="feature-grid"]');
            if (!featureGrid) {
                throw new Error('기능 그리드를 찾을 수 없습니다.');
            }

            return { success: true, details: '모든 주요 요소가 정상적으로 로드되었습니다.' };
        } catch (error) {
            return { success: false, details: error.message };
        }
    }

    // 🔐 로그인 페이지 테스트
    async testLoginPage(page) {
        try {
            // 로그인 폼 확인
            const loginForm = await page.$('[data-testid="login-form"]');
            if (!loginForm) {
                throw new Error('로그인 폼을 찾을 수 없습니다.');
            }

            // 익명 로그인 버튼 확인
            const anonymousBtn = await page.$('button:has-text("익명으로 시작하기")');
            if (!anonymousBtn) {
                throw new Error('익명 로그인 버튼을 찾을 수 없습니다.');
            }

            // 구글 로그인 버튼 확인
            const googleBtn = await page.$('button:has-text("Google로 로그인")');
            if (!googleBtn) {
                throw new Error('구글 로그인 버튼을 찾을 수 없습니다.');
            }

            return { success: true, details: '로그인 폼과 버튼들이 정상적으로 표시됩니다.' };
        } catch (error) {
            return { success: false, details: error.message };
        }
    }

    // 👤 프로필 페이지 테스트
    async testProfilePage(page) {
        try {
            // 프로필 정보 카드 확인
            const profileCard = await page.$('[data-testid="profile-card"]');
            if (!profileCard) {
                throw new Error('프로필 정보 카드를 찾을 수 없습니다.');
            }

            // 계정 상태 확인
            const accountStatus = await page.$('[data-testid="account-status"]');
            if (!accountStatus) {
                throw new Error('계정 상태 섹션을 찾을 수 없습니다.');
            }

            return { success: true, details: '프로필 페이지가 정상적으로 로드되었습니다.' };
        } catch (error) {
            return { success: false, details: error.message };
        }
    }

    // 📊 성능 대시보드 테스트
    async testPerformanceDashboard(page) {
        try {
            // 성능 메트릭 확인
            const metrics = await page.$$('[data-testid="performance-metric"]');
            if (metrics.length === 0) {
                throw new Error('성능 메트릭을 찾을 수 없습니다.');
            }

            // 차트 확인
            const charts = await page.$$('[data-testid="performance-chart"]');
            if (charts.length === 0) {
                throw new Error('성능 차트를 찾을 수 없습니다.');
            }

            return { success: true, details: '성능 대시보드가 정상적으로 로드되었습니다.' };
        } catch (error) {
            return { success: false, details: error.message };
        }
    }

    // 🎮 커뮤니티 게임 시스템 테스트
    async testCommunityGameSystem(page) {
        try {
            // 게임 목록 확인
            const gameList = await page.$('[data-testid="game-list"]');
            if (!gameList) {
                throw new Error('게임 목록을 찾을 수 없습니다.');
            }

            // 리더보드 확인
            const leaderboard = await page.$('[data-testid="leaderboard"]');
            if (!leaderboard) {
                throw new Error('리더보드를 찾을 수 없습니다.');
            }

            return { success: true, details: '커뮤니티 게임 시스템이 정상적으로 로드되었습니다.' };
        } catch (error) {
            return { success: false, details: error.message };
        }
    }

    // 🌐 다국어 지원 테스트
    async testInternationalization(page) {
        try {
            // 언어 선택기 확인
            const languageSelector = await page.$('[data-testid="language-selector"]');
            if (!languageSelector) {
                throw new Error('언어 선택기를 찾을 수 없습니다.');
            }

            // 번역된 텍스트 확인
            const translatedText = await page.$('[data-testid="translated-content"]');
            if (!translatedText) {
                throw new Error('번역된 콘텐츠를 찾을 수 없습니다.');
            }

            return { success: true, details: '다국어 지원 시스템이 정상적으로 작동합니다.' };
        } catch (error) {
            return { success: false, details: error.message };
        }
    }

    // 📈 분석 대시보드 테스트
    async testAnalyticsDashboard(page) {
        try {
            // 분석 차트 확인
            const charts = await page.$$('[data-testid="analytics-chart"]');
            if (charts.length === 0) {
                throw new Error('분석 차트를 찾을 수 없습니다.');
            }

            // 사용자 행동 분석 확인
            const behaviorAnalysis = await page.$('[data-testid="behavior-analysis"]');
            if (!behaviorAnalysis) {
                throw new Error('사용자 행동 분석을 찾을 수 없습니다.');
            }

            return { success: true, details: '분석 대시보드가 정상적으로 로드되었습니다.' };
        } catch (error) {
            return { success: false, details: error.message };
        }
    }

    // 🛡️ 스팸 방지 시스템 테스트
    async testSpamPrevention(page) {
        try {
            // 스팸 감지 설정 확인
            const spamSettings = await page.$('[data-testid="spam-settings"]');
            if (!spamSettings) {
                throw new Error('스팸 감지 설정을 찾을 수 없습니다.');
            }

            // 자동 모더레이션 확인
            const autoModeration = await page.$('[data-testid="auto-moderation"]');
            if (!autoModeration) {
                throw new Error('자동 모더레이션을 찾을 수 없습니다.');
            }

            return { success: true, details: '스팸 방지 시스템이 정상적으로 작동합니다.' };
        } catch (error) {
            return { success: false, details: error.message };
        }
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

        return await this.runAllTests();
    }

    async runAllTests() {
        console.log('🚀 전체 기능 테스트 시작!');
        console.log('='.repeat(50));

        await this.init();

        // 테스트 목록
        const tests = [
            {
                name: '메인 페이지',
                url: '/',
                description: '현대적인 메인 페이지와 실시간 통계',
                testFunction: this.testMainPage.bind(this)
            },
            {
                name: '로그인 페이지',
                url: '/login',
                description: 'Firebase 익명/구글 로그인 시스템',
                testFunction: this.testLoginPage.bind(this)
            },
            {
                name: '프로필 페이지',
                url: '/profile',
                description: '사용자 프로필 관리 및 계정 설정',
                testFunction: this.testProfilePage.bind(this)
            },
            {
                name: '성능 대시보드',
                url: '/performance-dashboard',
                description: '실시간 성능 모니터링 및 최적화',
                testFunction: this.testPerformanceDashboard.bind(this)
            },
            {
                name: '커뮤니티 게임',
                url: '/community-game',
                description: '멀티플레이어 게임 및 리더보드',
                testFunction: this.testCommunityGameSystem.bind(this)
            },
            {
                name: '다국어 지원',
                url: '/internationalization',
                description: '25개 언어 지원 및 RTL 언어',
                testFunction: this.testInternationalization.bind(this)
            },
            {
                name: '분석 대시보드',
                url: '/analytics',
                description: '사용자 행동 분석 및 트렌드',
                testFunction: this.testAnalyticsDashboard.bind(this)
            },
            {
                name: '스팸 방지',
                url: '/spam-prevention',
                description: 'AI 기반 스팸 감지 및 자동 모더레이션',
                testFunction: this.testSpamPrevention.bind(this)
            }
        ];

        // 모든 테스트 실행
        for (const test of tests) {
            await this.testFeature(test.name, test.url, test.description, test.testFunction);
        }

        // 결과 리포트 생성
        await this.generateReport();

        await this.cleanup();
        console.log('\n🎉 전체 테스트 완료!');

        return {
            success: this.results.filter(r => r.status.includes('✅')).length === this.results.length,
            results: this.results,
            summary: {
                total: this.results.length,
                passed: this.results.filter(r => r.status.includes('✅')).length,
                failed: this.results.filter(r => r.status.includes('❌')).length
            }
        };
    }

    /**
     * 🧹 리소스 정리
     */
    async cleanup() {
        try {
            if (this.browser) {
                await this.browser.close();
                console.log('🧹 브라우저 리소스 정리 완료');
            }
        } catch (error) {
            console.error('❌ 리소스 정리 중 오류:', error.message);
        }
    }

    async generateReport() {
        console.log('\n📊 테스트 결과 리포트 생성 중...');

        const reportPath = path.join(this.screenshotsDir, 'test-report.html');
        const successCount = this.results.filter(r => r.status.includes('✅')).length;
        const totalCount = this.results.length;

        const html = `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Community Platform v3.0 - 기능 테스트 리포트</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: rgba(255, 255, 255, 0.95);
            border-radius: 20px;
            padding: 30px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
        }
        .header h1 {
            color: #2d3748;
            font-size: 2.5rem;
            margin-bottom: 10px;
        }
        .header p {
            color: #718096;
            font-size: 1.1rem;
        }
        .summary {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 20px;
            border-radius: 15px;
            margin-bottom: 30px;
            text-align: center;
        }
        .summary h2 {
            margin: 0 0 10px 0;
            font-size: 1.8rem;
        }
        .summary p {
            margin: 0;
            font-size: 1.1rem;
            opacity: 0.9;
        }
        .test-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .test-card {
            background: white;
            border-radius: 15px;
            padding: 20px;
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
            border-left: 5px solid #10b981;
        }
        .test-card.failed {
            border-left-color: #ef4444;
        }
        .test-card h3 {
            margin: 0 0 10px 0;
            color: #2d3748;
            font-size: 1.3rem;
        }
        .test-card .status {
            font-weight: bold;
            margin-bottom: 10px;
        }
        .test-card .description {
            color: #718096;
            margin-bottom: 15px;
            font-size: 0.9rem;
        }
        .test-card .details {
            background: #f7fafc;
            padding: 10px;
            border-radius: 8px;
            font-size: 0.85rem;
            color: #4a5568;
        }
        .screenshot {
            margin-top: 15px;
            text-align: center;
        }
        .screenshot img {
            max-width: 100%;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e2e8f0;
            color: #718096;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Community Platform v3.0</h1>
            <p>기능 테스트 및 스크린샷 리포트</p>
        </div>

        <div class="summary">
            <h2>📊 테스트 결과 요약</h2>
            <p>총 ${totalCount}개 기능 중 ${successCount}개 성공 (${Math.round(successCount / totalCount * 100)}%)</p>
        </div>

        <div class="test-grid">
            ${this.results.map(result => `
                <div class="test-card ${result.status.includes('❌') ? 'failed' : ''}">
                    <h3>${result.name}</h3>
                    <div class="status">${result.status}</div>
                    <div class="description">${result.description}</div>
                    <div class="details">
                        <strong>URL:</strong> ${result.url}<br>
                        <strong>테스트 시간:</strong> ${new Date(result.timestamp).toLocaleString('ko-KR')}<br>
                        ${result.details ? `<strong>상세:</strong> ${result.details}` : ''}
                    </div>
                    ${result.screenshot ? `
                        <div class="screenshot">
                            <img src="${path.basename(result.screenshot)}" alt="${result.name} 스크린샷">
                        </div>
                    ` : ''}
                </div>
            `).join('')}
        </div>

        <div class="footer">
            <p>🤖 AUTOAGENTS Manager가 생성한 테스트 리포트</p>
            <p>생성 시간: ${new Date().toLocaleString('ko-KR')}</p>
        </div>
    </div>
</body>
</html>
        `;

        fs.writeFileSync(reportPath, html);
        console.log(`📄 리포트 생성 완료: ${reportPath}`);
    }
}

// 테스트 실행
async function runTests() {
    const tester = new FeatureTester({
        baseUrl: 'http://localhost:3000',
        backgroundMode: process.argv.includes('--background'),
        testTimeout: 30000,
        actionTimeout: 5000,
        popupHandlingEnabled: true
    });

    // 백그라운드 모드 확인
    if (process.argv.includes('--background')) {
        return await tester.runBackgroundTests();
    } else {
        return await tester.runForegroundTests();
    }
}

// 스크립트 실행
if (require.main === module) {
    runTests()
        .then(result => {
            console.log('🎯 테스트 완료:', result);
            process.exit(result.success ? 0 : 1);
        })
        .catch(error => {
            console.error('❌ 테스트 실행 중 오류:', error);
            process.exit(1);
        });
}

module.exports = FeatureTester;
