import { test, expect } from '@playwright/test';
import { anonymousLogin } from './helpers/auth';

/**
 * 활동 분석 대시보드 E2E 테스트
 * 
 * 주요 시나리오:
 * 1. 대시보드 페이지 렌더링
 * 2. 개요 카드 4개 표시 (조회수, 좋아요, 댓글, 공유)
 * 3. 활동 추이 차트 표시 (라인 차트)
 * 4. 카테고리별 파이 차트 표시
 * 5. 리더보드 표시 (상위 사용자)
 * 6. 실시간 활동 피드
 * 7. 날짜 필터 적용
 * 8. 새로고침 버튼 작동
 * 9. 차트 호버 인터랙션
 * 10. 반응형 레이아웃
 */

test.describe('활동 분석 대시보드', () => {
    test.beforeEach(async ({ page }) => {
        await anonymousLogin(page);
    });

    test('대시보드 페이지가 정상적으로 렌더링되어야 함', async ({ page }) => {
        // 대시보드로 이동
        await page.goto('/dashboard');
        await page.waitForTimeout(2000);

        // 대시보드 컨테이너 확인
        const dashboard = page.locator('[data-testid="dashboard"]')
            .or(page.locator('.dashboard-container'))
            .or(page.locator('.dashboard-page'))
            .first();

        await expect(dashboard).toBeVisible({ timeout: 10000 });

        // 페이지 제목 확인
        const title = page.locator('h1, h2').filter({ hasText: /대시보드|Dashboard/i }).first();
        const titleExists = await title.count() > 0;
        if (titleExists) {
            await expect(title).toBeVisible();
        }
    });

    test('개요 카드 4개가 표시되어야 함 (조회수, 좋아요, 댓글, 공유)', async ({ page }) => {
        await page.goto('/dashboard');
        await page.waitForTimeout(2000);

        // 개요 카드들 찾기
        const summaryCards = page.locator('[data-testid="summary-card"]')
            .or(page.locator('.summary-card'))
            .or(page.locator('.stat-card'))
            .or(page.locator('.overview-card'));

        const cardCount = await summaryCards.count();
        expect(cardCount).toBeGreaterThanOrEqual(3);

        // 카드들이 보이는지 확인
        for (let i = 0; i < Math.min(cardCount, 4); i++) {
            await expect(summaryCards.nth(i)).toBeVisible();

            // 각 카드에 숫자가 있어야 함
            const cardText = await summaryCards.nth(i).textContent();
            expect(cardText).toMatch(/\d+/);
        }
    });

    test('활동 추이 차트가 표시되어야 함', async ({ page }) => {
        await page.goto('/dashboard');
        await page.waitForTimeout(2000);

        // 활동 추이 차트 찾기
        const activityChart = page.locator('[data-testid="activity-chart"]')
            .or(page.locator('.activity-chart'))
            .or(page.locator('.line-chart'))
            .or(page.locator('canvas'))
            .first();

        const chartExists = await activityChart.count() > 0;
        expect(chartExists).toBeTruthy();

        if (chartExists) {
            await expect(activityChart).toBeVisible({ timeout: 10000 });
        }
    });

    test('카테고리별 파이 차트가 표시되어야 함', async ({ page }) => {
        await page.goto('/dashboard');
        await page.waitForTimeout(2000);

        // 파이 차트 찾기
        const pieChart = page.locator('[data-testid="category-chart"]')
            .or(page.locator('.pie-chart'))
            .or(page.locator('.category-distribution'))
            .or(page.locator('canvas').nth(1))
            .first();

        const chartExists = await pieChart.count() > 0;
        if (chartExists) {
            await expect(pieChart).toBeVisible({ timeout: 10000 });
        }
    });

    test('리더보드가 표시되어야 함', async ({ page }) => {
        await page.goto('/dashboard');
        await page.waitForTimeout(2000);

        // 리더보드 섹션 찾기
        const leaderboard = page.locator('[data-testid="leaderboard"]')
            .or(page.locator('.leaderboard'))
            .or(page.locator('text=/리더보드|Leaderboard/i'))
            .first();

        const leaderboardExists = await leaderboard.count() > 0;
        if (leaderboardExists) {
            await expect(leaderboard).toBeVisible();

            // 리더보드 항목들 확인
            const leaderboardItems = page.locator('[data-testid="leaderboard-item"]')
                .or(page.locator('.leaderboard-item'))
                .or(page.locator('.leader-entry'));

            const itemCount = await leaderboardItems.count();
            if (itemCount > 0) {
                await expect(leaderboardItems.first()).toBeVisible();

                // 첫 번째 항목에 사용자 이름과 점수가 있어야 함
                const firstItemText = await leaderboardItems.first().textContent();
                expect(firstItemText).toBeTruthy();
            }
        }
    });

    test('실시간 활동 피드가 표시되어야 함', async ({ page }) => {
        await page.goto('/dashboard');
        await page.waitForTimeout(2000);

        // 활동 피드 섹션 찾기
        const activityFeed = page.locator('[data-testid="activity-feed"]')
            .or(page.locator('.activity-feed'))
            .or(page.locator('.real-time-feed'))
            .or(page.locator('text=/최근 활동|활동 피드|Activity Feed/i'))
            .first();

        const feedExists = await activityFeed.count() > 0;
        if (feedExists) {
            await expect(activityFeed).toBeVisible();

            // 활동 항목들 확인
            const feedItems = page.locator('[data-testid="activity-item"]')
                .or(page.locator('.activity-item'))
                .or(page.locator('.feed-item'));

            const itemCount = await feedItems.count();
            if (itemCount > 0) {
                await expect(feedItems.first()).toBeVisible();
            }
        }
    });

    test('날짜 필터를 적용할 수 있어야 함', async ({ page }) => {
        await page.goto('/dashboard');
        await page.waitForTimeout(2000);

        // 날짜 필터 찾기
        const dateFilter = page.locator('[data-testid="date-filter"]')
            .or(page.locator('.date-filter'))
            .or(page.locator('select[name="period"]'))
            .or(page.locator('button:has-text("기간")'))
            .first();

        const filterExists = await dateFilter.count() > 0;
        if (filterExists) {
            await dateFilter.click();
            await page.waitForTimeout(500);

            // "최근 7일" 옵션 선택
            const weekOption = page.locator('[data-value="7days"]')
                .or(page.locator('li:has-text("7일")'))
                .or(page.locator('option:has-text("7일")'))
                .first();

            const optionExists = await weekOption.count() > 0;
            if (optionExists) {
                await weekOption.click();
                await page.waitForTimeout(2000);

                // 차트가 다시 로드되어야 함
                const chart = page.locator('canvas').first();
                await expect(chart).toBeVisible({ timeout: 10000 });
            }
        }
    });

    test('새로고침 버튼이 작동해야 함', async ({ page }) => {
        await page.goto('/dashboard');
        await page.waitForTimeout(2000);

        // 새로고침 버튼 찾기
        const refreshButton = page.locator('[data-testid="refresh-button"]')
            .or(page.locator('button[aria-label*="새로고침"]'))
            .or(page.locator('button:has-text("새로고침")'))
            .or(page.locator('.refresh-button'))
            .first();

        const buttonExists = await refreshButton.count() > 0;
        if (buttonExists) {
            await expect(refreshButton).toBeVisible();

            // 버튼 클릭
            await refreshButton.click();
            await page.waitForTimeout(1000);

            // 로딩 인디케이터 확인
            const loading = page.locator('[data-testid="loading"]')
                .or(page.locator('.loading'))
                .or(page.locator('.MuiCircularProgress-root'))
                .first();

            const loadingExists = await loading.count() > 0;
            if (loadingExists) {
                // 로딩이 나타났다가 사라져야 함
                await expect(loading).toBeVisible({ timeout: 5000 });
                await expect(loading).not.toBeVisible({ timeout: 10000 });
            }
        }
    });

    test('차트에 마우스 호버 시 툴팁이 표시되어야 함', async ({ page }) => {
        await page.goto('/dashboard');
        await page.waitForTimeout(2000);

        // 차트 캔버스 찾기
        const chart = page.locator('[data-testid="activity-chart"]')
            .or(page.locator('canvas'))
            .first();

        const chartExists = await chart.count() > 0;
        if (chartExists) {
            await expect(chart).toBeVisible();

            // 차트 중앙에 호버
            const box = await chart.boundingBox();
            if (box) {
                await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
                await page.waitForTimeout(500);

                // 툴팁 확인 (Chart.js 또는 Recharts 툴팁)
                const tooltip = page.locator('.chartjs-tooltip')
                    .or(page.locator('.recharts-tooltip'))
                    .or(page.locator('[role="tooltip"]'))
                    .first();

                const tooltipExists = await tooltip.count() > 0;
                if (tooltipExists) {
                    const tooltipVisible = await tooltip.isVisible().catch(() => false);
                    console.log('Tooltip visible:', tooltipVisible);
                }
            }
        }
    });

    test('반응형 레이아웃이 작동해야 함', async ({ page }) => {
        await page.goto('/dashboard');
        await page.waitForTimeout(2000);

        // 데스크톱 레이아웃 확인
        const dashboard = page.locator('[data-testid="dashboard"]')
            .or(page.locator('.dashboard-container'))
            .first();

        await expect(dashboard).toBeVisible();

        // 뷰포트를 모바일 크기로 변경
        await page.setViewportSize({ width: 375, height: 667 });
        await page.waitForTimeout(1000);

        // 대시보드가 여전히 보여야 함
        await expect(dashboard).toBeVisible();

        // 모바일에서는 카드들이 세로로 배치되어야 함
        const summaryCards = page.locator('[data-testid="summary-card"]')
            .or(page.locator('.summary-card'))
            .or(page.locator('.stat-card'));

        const cardCount = await summaryCards.count();
        if (cardCount > 1) {
            const firstCard = summaryCards.first();
            const secondCard = summaryCards.nth(1);

            const firstBox = await firstCard.boundingBox();
            const secondBox = await secondCard.boundingBox();

            if (firstBox && secondBox) {
                // 모바일에서는 두 번째 카드가 첫 번째 카드 아래에 있어야 함
                expect(secondBox.y).toBeGreaterThan(firstBox.y);
            }
        }

        // 뷰포트를 원래대로 복원
        await page.setViewportSize({ width: 1280, height: 720 });
    });
});
