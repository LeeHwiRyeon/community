/**
 * 📰👥 뉴스 & 커뮤니티 실제 테스트 실행기
 * 
 * 뉴스 관리자와 커뮤니티 관리자 기능 테스트
 * 
 * @author AUTOAGENTS Manager
 * @version 3.0.0
 * @created 2025-01-02
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class NewsCommunityTestRunner {
    constructor() {
        this.browser = null;
        this.page = null;
        this.baseUrl = 'http://localhost:3000';
        this.screenshotsDir = 'reports/dev-v1.0.0/test-v1.0.0/screenshots';
        this.testResults = [];
    }

    // 브라우저 초기화
    async initBrowser() {
        console.log('🌐 브라우저 초기화 중...');
        this.browser = await puppeteer.launch({
            headless: false, // 실제 브라우저 창을 띄워서 확인
            defaultViewport: { width: 1920, height: 1080 },
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        this.page = await this.browser.newPage();

        // 디렉토리 생성
        if (!fs.existsSync(this.screenshotsDir)) {
            fs.mkdirSync(this.screenshotsDir, { recursive: true });
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

    // 페이지 로딩 대기
    async waitForPageLoad(timeout = 10000) {
        try {
            await this.page.waitForLoadState('networkidle', { timeout });
            await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
            console.log('페이지 로딩 대기 중 타임아웃, 계속 진행...');
        }
    }

    // 뉴스 관리자 테스트
    async testNewsManager() {
        console.log('\n📰 뉴스 관리자 테스트 시작...');

        try {
            // 뉴스 관리자 페이지 이동
            console.log('🔗 뉴스 관리자 페이지 이동...');
            await this.page.goto(`${this.baseUrl}/news-manager`, {
                waitUntil: 'networkidle0',
                timeout: 30000
            });
            await this.waitForPageLoad();

            // 페이지 로딩 후 스크린샷
            await this.takeScreenshot('news-manager-loaded', '뉴스 관리자 페이지 로딩 완료');

            // 새 뉴스 작성 버튼 클릭
            const newNewsButton = await this.page.$('button:has-text("새 뉴스 작성")');
            if (newNewsButton) {
                console.log('🖱️ 새 뉴스 작성 버튼 클릭...');
                await newNewsButton.click();
                await new Promise(resolve => setTimeout(resolve, 2000));

                // 다이얼로그 열린 후 스크린샷
                await this.takeScreenshot('news-create-dialog-opened', '새 뉴스 작성 다이얼로그 열림');

                // 폼 입력
                console.log('📝 뉴스 폼 입력...');
                await this.page.type('input[placeholder*="제목"], input[label*="제목"]', '테스트 뉴스 제목');
                await this.page.type('textarea[placeholder*="내용"], textarea[label*="내용"]', '테스트 뉴스 내용입니다. 실제 뉴스 관리 기능을 테스트하고 있습니다.');

                // 카테고리 선택
                const categorySelect = await this.page.$('div[role="combobox"], select');
                if (categorySelect) {
                    await categorySelect.click();
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    const gameCategory = await this.page.$('li:has-text("게임 뉴스"), option:has-text("게임 뉴스")');
                    if (gameCategory) {
                        await gameCategory.click();
                    }
                }

                // 폼 입력 후 스크린샷
                await this.takeScreenshot('news-form-filled', '뉴스 폼 입력 완료');

                // 저장 버튼 클릭
                const saveButton = await this.page.$('button:has-text("저장")');
                if (saveButton) {
                    console.log('💾 뉴스 저장 버튼 클릭...');
                    await saveButton.click();
                    await new Promise(resolve => setTimeout(resolve, 3000));

                    // 저장 후 스크린샷
                    await this.takeScreenshot('news-saved', '뉴스 저장 완료');
                }

                // 취소 버튼으로 다이얼로그 닫기
                const cancelButton = await this.page.$('button:has-text("취소")');
                if (cancelButton) {
                    await cancelButton.click();
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }

            // 뉴스 카드 확인
            const newsCards = await this.page.$$('[data-testid="news-card"], .MuiCard-root');
            console.log(`📰 발견된 뉴스 카드: ${newsCards.length}개`);

            // 첫 번째 뉴스 카드의 편집 버튼 클릭
            if (newsCards.length > 0) {
                const editButton = await newsCards[0].$('button:has-text("편집")');
                if (editButton) {
                    console.log('✏️ 뉴스 편집 버튼 클릭...');
                    await editButton.click();
                    await new Promise(resolve => setTimeout(resolve, 2000));

                    // 편집 다이얼로그 스크린샷
                    await this.takeScreenshot('news-edit-dialog', '뉴스 편집 다이얼로그');

                    // 취소 버튼으로 닫기
                    const cancelButton = await this.page.$('button:has-text("취소")');
                    if (cancelButton) {
                        await cancelButton.click();
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                }
            }

            // 탭 전환 테스트
            const tabs = await this.page.$$('[role="tab"]');
            if (tabs.length > 1) {
                console.log('📊 통계 탭 클릭...');
                await tabs[2].click(); // 통계 탭
                await new Promise(resolve => setTimeout(resolve, 2000));

                // 통계 탭 스크린샷
                await this.takeScreenshot('news-stats-tab', '뉴스 통계 탭');

                // 카테고리 관리 탭 클릭
                console.log('📂 카테고리 관리 탭 클릭...');
                await tabs[1].click();
                await new Promise(resolve => setTimeout(resolve, 2000));

                // 카테고리 관리 탭 스크린샷
                await this.takeScreenshot('news-categories-tab', '뉴스 카테고리 관리 탭');
            }

            console.log('✅ 뉴스 관리자 테스트 완료');
            return { success: true, message: '뉴스 관리자 테스트 성공' };

        } catch (error) {
            console.error('❌ 뉴스 관리자 테스트 실패:', error.message);
            return { success: false, message: error.message };
        }
    }

    // 커뮤니티 관리자 테스트
    async testCommunityManager() {
        console.log('\n👥 커뮤니티 관리자 테스트 시작...');

        try {
            // 커뮤니티 관리자 페이지 이동
            console.log('🔗 커뮤니티 관리자 페이지 이동...');
            await this.page.goto(`${this.baseUrl}/community-manager`, {
                waitUntil: 'networkidle0',
                timeout: 30000
            });
            await this.waitForPageLoad();

            // 페이지 로딩 후 스크린샷
            await this.takeScreenshot('community-manager-loaded', '커뮤니티 관리자 페이지 로딩 완료');

            // 새 커뮤니티 생성 버튼 클릭
            const newCommunityButton = await this.page.$('button:has-text("새 커뮤니티 생성")');
            if (newCommunityButton) {
                console.log('🖱️ 새 커뮤니티 생성 버튼 클릭...');
                await newCommunityButton.click();
                await new Promise(resolve => setTimeout(resolve, 2000));

                // 다이얼로그 열린 후 스크린샷
                await this.takeScreenshot('community-create-dialog-opened', '새 커뮤니티 생성 다이얼로그 열림');

                // 폼 입력
                console.log('📝 커뮤니티 폼 입력...');
                await this.page.type('input[placeholder*="커뮤니티 이름"], input[label*="커뮤니티 이름"]', '테스트 커뮤니티');
                await this.page.type('textarea[placeholder*="설명"], textarea[label*="설명"]', '테스트 커뮤니티 설명입니다. 실제 커뮤니티 관리 기능을 테스트하고 있습니다.');

                // 카테고리 선택
                const categorySelect = await this.page.$('div[role="combobox"], select');
                if (categorySelect) {
                    await categorySelect.click();
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    const devCategory = await this.page.$('li:has-text("개발"), option:has-text("개발")');
                    if (devCategory) {
                        await devCategory.click();
                    }
                }

                // 폼 입력 후 스크린샷
                await this.takeScreenshot('community-form-filled', '커뮤니티 폼 입력 완료');

                // 저장 버튼 클릭
                const saveButton = await this.page.$('button:has-text("저장")');
                if (saveButton) {
                    console.log('💾 커뮤니티 저장 버튼 클릭...');
                    await saveButton.click();
                    await new Promise(resolve => setTimeout(resolve, 3000));

                    // 저장 후 스크린샷
                    await this.takeScreenshot('community-saved', '커뮤니티 저장 완료');
                }

                // 취소 버튼으로 다이얼로그 닫기
                const cancelButton = await this.page.$('button:has-text("취소")');
                if (cancelButton) {
                    await cancelButton.click();
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }

            // 커뮤니티 카드 확인
            const communityCards = await this.page.$$('[data-testid="community-card"], .MuiCard-root');
            console.log(`👥 발견된 커뮤니티 카드: ${communityCards.length}개`);

            // 첫 번째 커뮤니티 카드의 편집 버튼 클릭
            if (communityCards.length > 0) {
                const editButton = await communityCards[0].$('button:has-text("편집")');
                if (editButton) {
                    console.log('✏️ 커뮤니티 편집 버튼 클릭...');
                    await editButton.click();
                    await new Promise(resolve => setTimeout(resolve, 2000));

                    // 편집 다이얼로그 스크린샷
                    await this.takeScreenshot('community-edit-dialog', '커뮤니티 편집 다이얼로그');

                    // 취소 버튼으로 닫기
                    const cancelButton = await this.page.$('button:has-text("취소")');
                    if (cancelButton) {
                        await cancelButton.click();
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                }
            }

            // 탭 전환 테스트
            const tabs = await this.page.$$('[role="tab"]');
            if (tabs.length > 1) {
                // 멤버 관리 탭 클릭
                console.log('👤 멤버 관리 탭 클릭...');
                await tabs[1].click();
                await new Promise(resolve => setTimeout(resolve, 2000));

                // 멤버 관리 탭 스크린샷
                await this.takeScreenshot('community-members-tab', '커뮤니티 멤버 관리 탭');

                // 활동 모니터링 탭 클릭
                console.log('📊 활동 모니터링 탭 클릭...');
                await tabs[2].click();
                await new Promise(resolve => setTimeout(resolve, 2000));

                // 활동 모니터링 탭 스크린샷
                await this.takeScreenshot('community-activities-tab', '커뮤니티 활동 모니터링 탭');

                // 통계 탭 클릭
                console.log('📈 통계 탭 클릭...');
                await tabs[3].click();
                await new Promise(resolve => setTimeout(resolve, 2000));

                // 통계 탭 스크린샷
                await this.takeScreenshot('community-stats-tab', '커뮤니티 통계 탭');
            }

            console.log('✅ 커뮤니티 관리자 테스트 완료');
            return { success: true, message: '커뮤니티 관리자 테스트 성공' };

        } catch (error) {
            console.error('❌ 커뮤니티 관리자 테스트 실패:', error.message);
            return { success: false, message: error.message };
        }
    }

    // 전체 테스트 실행
    async runAllTests() {
        console.log('🚀 뉴스 & 커뮤니티 실제 테스트 시작!');
        console.log('='.repeat(60));

        await this.initBrowser();

        const testStartTime = new Date();
        const testResults = [];

        // 뉴스 관리자 테스트
        const newsResult = await this.testNewsManager();
        testResults.push({
            name: '뉴스 관리자',
            success: newsResult.success,
            message: newsResult.message
        });

        // 커뮤니티 관리자 테스트
        const communityResult = await this.testCommunityManager();
        testResults.push({
            name: '커뮤니티 관리자',
            success: communityResult.success,
            message: communityResult.message
        });

        await this.browser.close();

        const testEndTime = new Date();
        const totalDuration = testEndTime - testStartTime;

        // 결과 리포트 생성
        await this.generateTestReport(testResults, totalDuration);

        // 최종 요약
        const successfulTests = testResults.filter(r => r.success).length;
        const failedTests = testResults.length - successfulTests;
        const successRate = Math.round((successfulTests / testResults.length) * 100);

        console.log('\n🎉 뉴스 & 커뮤니티 테스트 완료!');
        console.log(`📊 성공률: ${successRate}% (${successfulTests}/${testResults.length})`);
        console.log(`⏱️ 총 소요 시간: ${Math.round(totalDuration / 1000)}초`);
        console.log(`📁 스크린샷 위치: ${this.screenshotsDir}`);

        return {
            totalTests: testResults.length,
            successfulTests: successfulTests,
            failedTests: failedTests,
            successRate: successRate,
            totalDuration: totalDuration,
            testResults: testResults
        };
    }

    // 테스트 리포트 생성
    async generateTestReport(testResults, totalDuration) {
        const reportData = {
            version: '1.0.0',
            timestamp: new Date().toISOString(),
            type: 'news_community_test',
            totalDuration: totalDuration,
            results: testResults,
            summary: {
                total: testResults.length,
                passed: testResults.filter(r => r.success).length,
                failed: testResults.filter(r => !r.success).length,
                successRate: Math.round((testResults.filter(r => r.success).length / testResults.length) * 100)
            }
        };

        const reportPath = path.join('reports/dev-v1.0.0/test-v1.0.0', 'news-community-test-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));

        console.log(`📄 뉴스 & 커뮤니티 테스트 리포트 생성: ${reportPath}`);
        return reportPath;
    }
}

// 실행
if (require.main === module) {
    const runner = new NewsCommunityTestRunner();
    runner.runAllTests().catch(console.error);
}

module.exports = NewsCommunityTestRunner;
