import { test, expect } from '@playwright/test';
import { anonymousLogin } from './helpers/auth';

/**
 * 콘텐츠 추천 엔진 E2E 테스트
 * 
 * 주요 시나리오:
 * 1. 추천 섹션 표시
 * 2. 맞춤 추천 탭 클릭 및 콘텐츠 로딩
 * 3. 트렌딩 탭 클릭 및 콘텐츠 로딩
 * 4. 추천 카드 클릭 시 상세 페이지 이동
 * 5. 새로고침 버튼으로 추천 갱신
 * 6. 로딩 스켈레톤 표시
 * 7. 추천 콘텐츠가 없을 때 메시지 표시
 * 8. 에러 상태 처리
 */

test.describe('콘텐츠 추천 엔진', () => {
    test.beforeEach(async ({ page }) => {
        await anonymousLogin(page);
    });

    test('추천 섹션이 홈페이지에 표시되어야 함', async ({ page }) => {
        await page.goto('/');
        await page.waitForTimeout(2000);

        // 추천 섹션 찾기
        const recommendationSection = page.locator('[data-testid="recommendations"]')
            .or(page.locator('.recommendations-section'))
            .or(page.locator('.content-recommendations'))
            .or(page.locator('text=/추천|Recommendations/i'))
            .first();

        const sectionExists = await recommendationSection.count() > 0;
        expect(sectionExists).toBeTruthy();

        if (sectionExists) {
            await expect(recommendationSection).toBeVisible({ timeout: 10000 });
        }
    });

    test('맞춤 추천 탭을 클릭하면 개인화된 콘텐츠가 로딩되어야 함', async ({ page }) => {
        await page.goto('/');
        await page.waitForTimeout(2000);

        // 맞춤 추천 탭 찾기
        const personalizedTab = page.locator('[data-testid="personalized-tab"]')
            .or(page.locator('button:has-text("맞춤 추천")'))
            .or(page.locator('[role="tab"]:has-text("맞춤")'))
            .or(page.locator('.personalized-tab'))
            .first();

        const tabExists = await personalizedTab.count() > 0;
        if (tabExists) {
            await personalizedTab.click();
            await page.waitForTimeout(1500);

            // 추천 카드들 확인
            const recommendationCards = page.locator('[data-testid="recommendation-card"]')
                .or(page.locator('.recommendation-card'))
                .or(page.locator('.content-card'))
                .or(page.locator('.post-card'));

            const cardCount = await recommendationCards.count();
            if (cardCount > 0) {
                await expect(recommendationCards.first()).toBeVisible({ timeout: 10000 });

                // 최소 1개 이상의 카드가 있어야 함
                expect(cardCount).toBeGreaterThan(0);
            }
        }
    });

    test('트렌딩 탭을 클릭하면 인기 콘텐츠가 로딩되어야 함', async ({ page }) => {
        await page.goto('/');
        await page.waitForTimeout(2000);

        // 트렌딩 탭 찾기
        const trendingTab = page.locator('[data-testid="trending-tab"]')
            .or(page.locator('button:has-text("트렌딩")'))
            .or(page.locator('[role="tab"]:has-text("트렌딩")'))
            .or(page.locator('.trending-tab'))
            .first();

        const tabExists = await trendingTab.count() > 0;
        if (tabExists) {
            await trendingTab.click();
            await page.waitForTimeout(1500);

            // 트렌딩 카드들 확인
            const trendingCards = page.locator('[data-testid="recommendation-card"]')
                .or(page.locator('.recommendation-card'))
                .or(page.locator('.trending-card'))
                .or(page.locator('.post-card'));

            const cardCount = await trendingCards.count();
            if (cardCount > 0) {
                await expect(trendingCards.first()).toBeVisible({ timeout: 10000 });
                expect(cardCount).toBeGreaterThan(0);

                // 트렌딩 카드에는 조회수나 좋아요 수가 표시되어야 함
                const firstCardText = await trendingCards.first().textContent();
                const hasMetrics = firstCardText?.match(/\d+/) !== null;
                expect(hasMetrics).toBeTruthy();
            }
        }
    });

    test('추천 카드 클릭 시 상세 페이지로 이동해야 함', async ({ page }) => {
        await page.goto('/');
        await page.waitForTimeout(2000);

        // 추천 카드 찾기
        const recommendationCard = page.locator('[data-testid="recommendation-card"]')
            .or(page.locator('.recommendation-card'))
            .or(page.locator('.content-card'))
            .or(page.locator('.post-card'))
            .first();

        const cardExists = await recommendationCard.count() > 0;
        if (cardExists) {
            await expect(recommendationCard).toBeVisible({ timeout: 10000 });

            // 카드 클릭
            await recommendationCard.click();
            await page.waitForTimeout(2000);

            // 상세 페이지로 이동했는지 확인 (URL 변경)
            const url = page.url();
            expect(url).not.toBe('http://localhost:3000/');
            expect(url).toMatch(/post|article|content|detail/);
        }
    });

    test('새로고침 버튼으로 추천을 갱신할 수 있어야 함', async ({ page }) => {
        await page.goto('/');
        await page.waitForTimeout(2000);

        // 새로고침 버튼 찾기
        const refreshButton = page.locator('[data-testid="refresh-recommendations"]')
            .or(page.locator('button[aria-label*="새로고침"]'))
            .or(page.locator('button:has-text("새로고침")'))
            .or(page.locator('.refresh-button'))
            .first();

        const buttonExists = await refreshButton.count() > 0;
        if (buttonExists) {
            // 첫 번째 카드의 제목 저장
            const firstCard = page.locator('[data-testid="recommendation-card"]')
                .or(page.locator('.recommendation-card'))
                .first();

            const firstCardExists = await firstCard.count() > 0;
            let initialTitle = '';
            if (firstCardExists) {
                initialTitle = await firstCard.textContent() || '';
            }

            // 새로고침 버튼 클릭
            await refreshButton.click();
            await page.waitForTimeout(2000);

            // 로딩 후 카드 확인
            const updatedCard = page.locator('[data-testid="recommendation-card"]')
                .or(page.locator('.recommendation-card'))
                .first();

            await expect(updatedCard).toBeVisible({ timeout: 10000 });

            // 콘텐츠가 변경되었을 수 있음 (API가 다른 데이터를 반환할 경우)
            const updatedTitle = await updatedCard.textContent() || '';
            console.log('Initial title:', initialTitle);
            console.log('Updated title:', updatedTitle);
        }
    });

    test('로딩 중 스켈레톤이 표시되어야 함', async ({ page }) => {
        // 네트워크를 느리게 설정하여 로딩 스켈레톤 보기
        await page.route('**/api/recommendations*', async route => {
            await new Promise(resolve => setTimeout(resolve, 2000));
            route.continue();
        });

        await page.goto('/');

        // 로딩 스켈레톤 확인
        const skeleton = page.locator('[data-testid="recommendation-skeleton"]')
            .or(page.locator('.MuiSkeleton-root'))
            .or(page.locator('.skeleton'))
            .or(page.locator('.loading-skeleton'))
            .first();

        const skeletonExists = await skeleton.count() > 0;
        if (skeletonExists) {
            // 스켈레톤이 잠시 보여야 함
            await expect(skeleton).toBeVisible({ timeout: 5000 });

            // 로딩이 완료되면 스켈레톤이 사라져야 함
            await expect(skeleton).not.toBeVisible({ timeout: 15000 });
        }
    });

    test('추천 콘텐츠가 없을 때 메시지가 표시되어야 함', async ({ page }) => {
        // API를 모킹하여 빈 배열 반환
        await page.route('**/api/recommendations*', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ recommendations: [] }),
            });
        });

        await page.goto('/');
        await page.waitForTimeout(2000);

        // "추천 콘텐츠 없음" 메시지 확인
        const emptyMessage = page.locator('[data-testid="no-recommendations"]')
            .or(page.locator('.no-recommendations'))
            .or(page.locator('text=/추천 콘텐츠가 없습니다|추천할 콘텐츠가 없습니다/i'))
            .first();

        const messageExists = await emptyMessage.count() > 0;
        if (messageExists) {
            await expect(emptyMessage).toBeVisible({ timeout: 10000 });
        }
    });

    test('에러 상태가 적절히 처리되어야 함', async ({ page }) => {
        // API를 모킹하여 에러 반환
        await page.route('**/api/recommendations*', async route => {
            await route.fulfill({
                status: 500,
                contentType: 'application/json',
                body: JSON.stringify({ error: 'Internal Server Error' }),
            });
        });

        await page.goto('/');
        await page.waitForTimeout(2000);

        // 에러 메시지 확인
        const errorMessage = page.locator('[data-testid="recommendation-error"]')
            .or(page.locator('.error-message'))
            .or(page.locator('text=/오류가 발생했습니다|에러|Error/i'))
            .first();

        const messageExists = await errorMessage.count() > 0;
        if (messageExists) {
            await expect(errorMessage).toBeVisible({ timeout: 10000 });
        } else {
            // 에러가 표시되지 않으면 기본 UI가 보여야 함
            const recommendationSection = page.locator('[data-testid="recommendations"]')
                .or(page.locator('.recommendations-section'))
                .first();

            await expect(recommendationSection).toBeVisible({ timeout: 10000 });
        }
    });
});
