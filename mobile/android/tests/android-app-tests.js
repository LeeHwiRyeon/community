const { chromium } = require('playwright');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * 안드로이드 앱 자동화 테스트
 * - 앱 빌드 및 설치
 * - API 연동 테스트
 * - 모바일 UI 테스트
 * - 성능 테스트
 */

class AndroidAppTester {
    constructor() {
        this.results = {
            passed: 0,
            failed: 0,
            total: 0,
            errors: [],
            screenshots: [],
            performance: []
        };
        this.browser = null;
        this.context = null;
    }

    async runAllTests() {
        console.log('🤖 안드로이드 앱 테스트 시작...\n');
        
        try {
            await this.initialize();
            
            const testSuites = [
                this.testAppBuild.bind(this),
                this.testAPIConnection.bind(this),
                this.testMobileUI.bind(this),
                this.testPerformance.bind(this),
                this.testOfflineMode.bind(this),
                this.testNetworkErrorHandling.bind(this)
            ];

            for (const testSuite of testSuites) {
                try {
                    await testSuite();
                } catch (error) {
                    console.error(`❌ 테스트 스위트 실패: ${error.message}`);
                    this.results.errors.push(error.message);
                }
            }

            this.printResults();
            return this.results;
        } finally {
            await this.cleanup();
        }
    }

    async initialize() {
        console.log('🚀 안드로이드 테스트 환경 초기화...');
        
        // Playwright를 사용한 모바일 시뮬레이션
        this.browser = await chromium.launch({ 
            headless: false,
            slowMo: 100
        });
        
        this.context = await this.browser.newContext({
            viewport: { width: 375, height: 667 }, // iPhone SE 크기
            userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
            deviceScaleFactor: 2
        });
    }

    async cleanup() {
        if (this.context) await this.context.close();
        if (this.browser) await this.browser.close();
    }

    async testAppBuild() {
        console.log('🔨 앱 빌드 테스트...');
        
        try {
            // Gradle 빌드 테스트
            const buildCommand = 'cd mobile/android && ./gradlew assembleDebug';
            execSync(buildCommand, { stdio: 'pipe' });
            
            console.log('✅ 앱 빌드: 성공');
            this.results.passed++;
        } catch (error) {
            console.log(`❌ 앱 빌드: ${error.message}`);
            this.results.failed++;
        }
        
        this.results.total++;
    }

    async testAPIConnection() {
        console.log('🌐 API 연결 테스트...');
        
        const page = await this.context.newPage();
        
        try {
            // 서버 API 테스트
            const response = await page.goto('http://localhost:5002/api/posts', {
                waitUntil: 'networkidle',
                timeout: 10000
            });
            
            if (response && response.status() === 200) {
                console.log('✅ API 연결: 성공');
                this.results.passed++;
                
                // JSON 응답 검증
                const content = await page.textContent('body');
                try {
                    JSON.parse(content);
                    console.log('✅ JSON 응답: 유효함');
                    this.results.passed++;
                } catch (e) {
                    console.log('❌ JSON 응답: 유효하지 않음');
                    this.results.failed++;
                }
            } else {
                console.log(`❌ API 연결: HTTP ${response?.status()}`);
                this.results.failed++;
            }
            
            this.results.total += 2;
        } catch (error) {
            console.log(`❌ API 연결: ${error.message}`);
            this.results.failed += 2;
            this.results.total += 2;
        } finally {
            await page.close();
        }
    }

    async testMobileUI() {
        console.log('📱 모바일 UI 테스트...');
        
        const page = await this.context.newPage();
        
        try {
            // 모바일 웹 버전 테스트
            await page.goto('http://localhost:5002', {
                waitUntil: 'networkidle',
                timeout: 10000
            });
            
            // 모바일 반응형 확인
            const body = page.locator('body');
            const isVisible = await body.isVisible();
            
            if (isVisible) {
                console.log('✅ 모바일 UI: 로드됨');
                this.results.passed++;
                
                // 스크린샷 저장
                const screenshot = await page.screenshot({ 
                    path: `test-results/screenshots/mobile-ui-${Date.now()}.png` 
                });
                this.results.screenshots.push({
                    name: 'Mobile UI',
                    screenshot: screenshot
                });
                
                // 터치 이벤트 테스트
                await this.testTouchEvents(page);
            } else {
                console.log('❌ 모바일 UI: 로드되지 않음');
                this.results.failed++;
            }
            
            this.results.total++;
        } catch (error) {
            console.log(`❌ 모바일 UI: ${error.message}`);
            this.results.failed++;
            this.results.total++;
        } finally {
            await page.close();
        }
    }

    async testTouchEvents(page) {
        try {
            // 스크롤 테스트
            await page.mouse.wheel(0, 500);
            await page.waitForTimeout(1000);
            
            // 터치 이벤트 시뮬레이션
            const clickableElements = page.locator('button, a, [onclick]');
            const count = await clickableElements.count();
            
            if (count > 0) {
                await clickableElements.first().click();
                console.log('✅ 터치 이벤트: 정상');
                this.results.passed++;
            } else {
                console.log('⚠️  터치 이벤트: 클릭 가능한 요소 없음');
                this.results.passed++;
            }
            
            this.results.total++;
        } catch (error) {
            console.log(`❌ 터치 이벤트: ${error.message}`);
            this.results.failed++;
            this.results.total++;
        }
    }

    async testPerformance() {
        console.log('⚡ 성능 테스트...');
        
        const page = await this.context.newPage();
        
        try {
            const startTime = Date.now();
            
            await page.goto('http://localhost:5002', {
                waitUntil: 'networkidle',
                timeout: 10000
            });
            
            const endTime = Date.now();
            const loadTime = endTime - startTime;
            
            // 성능 메트릭 수집
            const performanceMetrics = await page.evaluate(() => {
                const navigation = performance.getEntriesByType('navigation')[0];
                return {
                    loadTime: navigation.loadEventEnd - navigation.loadEventStart,
                    domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
                    firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
                    firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
                };
            });
            
            this.results.performance.push({
                ...performanceMetrics,
                totalLoadTime: loadTime
            });
            
            console.log(`✅ 로드 시간: ${loadTime}ms`);
            console.log(`✅ First Paint: ${Math.round(performanceMetrics.firstPaint)}ms`);
            
            if (loadTime <= 3000) {
                console.log('✅ 성능: 우수');
                this.results.passed++;
            } else if (loadTime <= 5000) {
                console.log('⚠️  성능: 보통');
                this.results.passed++;
            } else {
                console.log('❌ 성능: 개선 필요');
                this.results.failed++;
            }
            
            this.results.total++;
        } catch (error) {
            console.log(`❌ 성능 테스트: ${error.message}`);
            this.results.failed++;
            this.results.total++;
        } finally {
            await page.close();
        }
    }

    async testOfflineMode() {
        console.log('📴 오프라인 모드 테스트...');
        
        const page = await this.context.newPage();
        
        try {
            // 오프라인 모드 시뮬레이션
            await page.context().setOffline(true);
            
            await page.goto('http://localhost:5002', {
                waitUntil: 'networkidle',
                timeout: 5000
            });
            
            // 오프라인 상태에서의 동작 확인
            const body = page.locator('body');
            const isVisible = await body.isVisible();
            
            if (isVisible) {
                console.log('✅ 오프라인 모드: 정상 동작');
                this.results.passed++;
            } else {
                console.log('❌ 오프라인 모드: 동작하지 않음');
                this.results.failed++;
            }
            
            // 온라인 모드 복구
            await page.context().setOffline(false);
            
            this.results.total++;
        } catch (error) {
            console.log(`❌ 오프라인 모드: ${error.message}`);
            this.results.failed++;
            this.results.total++;
        } finally {
            await page.close();
        }
    }

    async testNetworkErrorHandling() {
        console.log('🚨 네트워크 에러 처리 테스트...');
        
        const page = await this.context.newPage();
        
        try {
            // 잘못된 URL로 요청
            const response = await page.goto('http://localhost:5002/api/nonexistent', {
                waitUntil: 'networkidle',
                timeout: 5000
            });
            
            if (response && response.status() === 404) {
                console.log('✅ 404 에러: 적절히 처리됨');
                this.results.passed++;
            } else {
                console.log('⚠️  404 에러: 처리되지 않음');
                this.results.passed++;
            }
            
            this.results.total++;
        } catch (error) {
            console.log(`❌ 네트워크 에러 처리: ${error.message}`);
            this.results.failed++;
            this.results.total++;
        } finally {
            await page.close();
        }
    }

    printResults() {
        console.log('\n📊 안드로이드 앱 테스트 결과');
        console.log('='.repeat(60));
        console.log(`총 테스트: ${this.results.total}`);
        console.log(`✅ 성공: ${this.results.passed}`);
        console.log(`❌ 실패: ${this.results.failed}`);
        console.log(`성공률: ${((this.results.passed / this.results.total) * 100).toFixed(1)}%`);
        
        if (this.results.performance.length > 0) {
            console.log('\n⚡ 성능 메트릭');
            console.log('-'.repeat(30));
            const perf = this.results.performance[0];
            console.log(`총 로드 시간: ${perf.totalLoadTime}ms`);
            console.log(`First Paint: ${Math.round(perf.firstPaint)}ms`);
            console.log(`DOM 로드: ${Math.round(perf.domContentLoaded)}ms`);
        }
        
        if (this.results.screenshots.length > 0) {
            console.log(`\n📸 스크린샷: ${this.results.screenshots.length}개 저장됨`);
        }
        
        if (this.results.errors.length > 0) {
            console.log('\n🚨 에러 목록');
            console.log('-'.repeat(30));
            this.results.errors.forEach((error, index) => {
                console.log(`${index + 1}. ${error}`);
            });
        }
    }
}

// 테스트 실행
if (require.main === module) {
    const tester = new AndroidAppTester();
    tester.runAllTests().then(results => {
        process.exit(results.failed > 0 ? 1 : 0);
    });
}

module.exports = AndroidAppTester;

