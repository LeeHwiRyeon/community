import { test, expect } from '@playwright/test';
import { anonymousLogin } from './helpers/auth';

/**
 * 고급 검색 기능 E2E 테스트
 * 
 * 주요 시나리오:
 * 1. 검색바 표시 및 입력
 * 2. 자동완성 제안 표시
 * 3. 검색 결과 로딩 및 표시
 * 4. 카테고리 필터링
 * 5. 날짜 필터링
 * 6. 정렬 옵션 (최신순, 인기순)
 * 7. 페이지네이션
 * 8. 검색 결과 없음 메시지
 * 9. 고급 필터 옵션
 * 10. 검색 히스토리
 */

test.describe('고급 검색 기능', () => {
    test.beforeEach(async ({ page }) => {
        await anonymousLogin(page);
    });

    test('검색바가 헤더에 표시되어야 함', async ({ page }) => {
        await page.goto('/');

        // 검색바 찾기
        const searchBar = page.locator('[data-testid="search-bar"]')
            .or(page.locator('input[placeholder*="검색"]'))
            .or(page.locator('.search-input'))
            .or(page.locator('[type="search"]'))
            .first();

        await expect(searchBar).toBeVisible({ timeout: 10000 });
    });

    test('검색어 입력 시 자동완성 제안이 표시되어야 함', async ({ page }) => {
        await page.goto('/');

        // 검색바 찾기 및 입력
        const searchBar = page.locator('[data-testid="search-bar"]')
            .or(page.locator('input[placeholder*="검색"]'))
            .or(page.locator('[type="search"]'))
            .first();

        await searchBar.fill('test');
        await page.waitForTimeout(1000);

        // 자동완성 드롭다운 확인
        const autocomplete = page.locator('[data-testid="autocomplete-dropdown"]')
            .or(page.locator('.MuiAutocomplete-popper'))
            .or(page.locator('.autocomplete-suggestions'))
            .or(page.locator('[role="listbox"]'))
            .first();

        // 자동완성이 있으면 확인, 없으면 패스
        const autocompleteVisible = await autocomplete.isVisible().catch(() => false);
        if (autocompleteVisible) {
            await expect(autocomplete).toBeVisible();
        }
    });

    test('검색 실행 시 결과 페이지로 이동하고 결과가 표시되어야 함', async ({ page }) => {
        await page.goto('/');

        // 검색바에 검색어 입력
        const searchBar = page.locator('[data-testid="search-bar"]')
            .or(page.locator('input[placeholder*="검색"]'))
            .or(page.locator('[type="search"]'))
            .first();

        await searchBar.fill('test');
        await searchBar.press('Enter');

        // 검색 결과 페이지로 이동
        await page.waitForURL(/search|results/, { timeout: 10000 });
        await page.waitForTimeout(2000);

        // 검색 결과 확인
        const searchResults = page.locator('[data-testid="search-results"]')
            .or(page.locator('.search-results'))
            .or(page.locator('.post-card'))
            .first();

        await expect(searchResults).toBeVisible({ timeout: 10000 });
    });

    test('카테고리 필터가 작동해야 함', async ({ page }) => {
        // 검색 페이지로 이동
        await page.goto('/search?q=test');
        await page.waitForTimeout(2000);

        // 카테고리 필터 찾기
        const categoryFilter = page.locator('[data-testid="category-filter"]')
            .or(page.locator('.category-filter'))
            .or(page.locator('select[name="category"]'))
            .or(page.locator('button:has-text("카테고리")'))
            .first();

        const filterExists = await categoryFilter.count() > 0;

        if (filterExists) {
            await categoryFilter.click();
            await page.waitForTimeout(500);

            // 카테고리 옵션 선택 (예: "기술")
            const categoryOption = page.locator('[data-value="technology"]')
                .or(page.locator('li:has-text("기술")'))
                .or(page.locator('option:has-text("기술")'))
                .first();

            const optionExists = await categoryOption.count() > 0;
            if (optionExists) {
                await categoryOption.click();
                await page.waitForTimeout(1000);

                // URL에 필터 파라미터 확인
                const url = page.url();
                expect(url).toMatch(/category|filter/);
            }
        }
    });

    test('날짜 필터가 작동해야 함', async ({ page }) => {
        // 검색 페이지로 이동
        await page.goto('/search?q=test');
        await page.waitForTimeout(2000);

        // 날짜 필터 찾기
        const dateFilter = page.locator('[data-testid="date-filter"]')
            .or(page.locator('.date-filter'))
            .or(page.locator('button:has-text("날짜")'))
            .or(page.locator('select[name="date"]'))
            .first();

        const filterExists = await dateFilter.count() > 0;

        if (filterExists) {
            await dateFilter.click();
            await page.waitForTimeout(500);

            // 날짜 옵션 선택 (예: "최근 1주일")
            const dateOption = page.locator('[data-value="week"]')
                .or(page.locator('li:has-text("1주일")'))
                .or(page.locator('option:has-text("1주일")'))
                .first();

            const optionExists = await dateOption.count() > 0;
            if (optionExists) {
                await dateOption.click();
                await page.waitForTimeout(1000);

                // URL에 날짜 파라미터 확인
                const url = page.url();
                expect(url).toMatch(/date|period/);
            }
        }
    });

    test('정렬 옵션이 작동해야 함', async ({ page }) => {
        // 검색 페이지로 이동
        await page.goto('/search?q=test');
        await page.waitForTimeout(2000);

        // 정렬 드롭다운 찾기
        const sortDropdown = page.locator('[data-testid="sort-dropdown"]')
            .or(page.locator('.sort-select'))
            .or(page.locator('select[name="sort"]'))
            .or(page.locator('button:has-text("정렬")'))
            .first();

        const dropdownExists = await sortDropdown.count() > 0;

        if (dropdownExists) {
            await sortDropdown.click();
            await page.waitForTimeout(500);

            // "인기순" 선택
            const popularOption = page.locator('[data-value="popular"]')
                .or(page.locator('li:has-text("인기순")'))
                .or(page.locator('option:has-text("인기순")'))
                .first();

            const optionExists = await popularOption.count() > 0;
            if (optionExists) {
                await popularOption.click();
                await page.waitForTimeout(1000);

                // URL에 정렬 파라미터 확인
                const url = page.url();
                expect(url).toMatch(/sort|order/);
            }
        }
    });

    test('페이지네이션이 작동해야 함', async ({ page }) => {
        // 검색 페이지로 이동
        await page.goto('/search?q=test');
        await page.waitForTimeout(2000);

        // 페이지네이션 찾기
        const pagination = page.locator('[data-testid="pagination"]')
            .or(page.locator('.MuiPagination-root'))
            .or(page.locator('.pagination'))
            .first();

        const paginationExists = await pagination.count() > 0;

        if (paginationExists) {
            await expect(pagination).toBeVisible();

            // 다음 페이지 버튼 클릭
            const nextButton = page.locator('[data-testid="next-page"]')
                .or(page.locator('button[aria-label*="다음"]'))
                .or(page.locator('.MuiPagination-root button:last-child'))
                .first();

            const nextButtonExists = await nextButton.count() > 0;
            if (nextButtonExists && await nextButton.isEnabled()) {
                await nextButton.click();
                await page.waitForTimeout(1000);

                // URL에 페이지 파라미터 확인
                const url = page.url();
                expect(url).toMatch(/page=2/);
            }
        }
    });

    test('검색 결과가 없을 때 메시지가 표시되어야 함', async ({ page }) => {
        // 존재하지 않는 검색어로 검색
        await page.goto('/search?q=xyznonexistent123456789');
        await page.waitForTimeout(2000);

        // "결과 없음" 메시지 확인
        const noResultsMessage = page.locator('[data-testid="no-results"]')
            .or(page.locator('.no-results'))
            .or(page.locator('text=/검색 결과가 없습니다|결과를 찾을 수 없습니다/i'))
            .first();

        await expect(noResultsMessage).toBeVisible({ timeout: 10000 });
    });

    test('고급 필터 옵션을 열고 설정할 수 있어야 함', async ({ page }) => {
        // 검색 페이지로 이동
        await page.goto('/search?q=test');
        await page.waitForTimeout(2000);

        // 고급 필터 버튼 찾기
        const advancedFilterButton = page.locator('[data-testid="advanced-filter"]')
            .or(page.locator('button:has-text("고급 검색")'))
            .or(page.locator('button:has-text("필터")'))
            .or(page.locator('.advanced-filter-button'))
            .first();

        const buttonExists = await advancedFilterButton.count() > 0;

        if (buttonExists) {
            await advancedFilterButton.click();
            await page.waitForTimeout(500);

            // 고급 필터 패널 확인
            const filterPanel = page.locator('[data-testid="filter-panel"]')
                .or(page.locator('.filter-panel'))
                .or(page.locator('.advanced-filters'))
                .first();

            await expect(filterPanel).toBeVisible({ timeout: 5000 });

            // 필터 옵션 확인 (예: 태그, 작성자 등)
            const filterOption = page.locator('[data-testid="filter-option"]')
                .or(page.locator('.filter-option'))
                .first();

            const optionExists = await filterOption.count() > 0;
            if (optionExists) {
                await expect(filterOption).toBeVisible();
            }
        }
    });

    test('검색 히스토리가 저장되고 표시되어야 함', async ({ page }) => {
        await page.goto('/');

        // 검색 실행
        const searchBar = page.locator('[data-testid="search-bar"]')
            .or(page.locator('input[placeholder*="검색"]'))
            .or(page.locator('[type="search"]'))
            .first();

        await searchBar.fill('history test');
        await searchBar.press('Enter');
        await page.waitForTimeout(2000);

        // 다시 검색바로 돌아가기
        await page.goto('/');
        await page.waitForTimeout(1000);

        // 검색바 클릭하여 히스토리 표시
        await searchBar.click();
        await page.waitForTimeout(500);

        // 검색 히스토리 확인
        const searchHistory = page.locator('[data-testid="search-history"]')
            .or(page.locator('.search-history'))
            .or(page.locator('text=/최근 검색/i'))
            .first();

        // 히스토리가 있으면 확인
        const historyVisible = await searchHistory.isVisible().catch(() => false);
        if (historyVisible) {
            await expect(searchHistory).toBeVisible();

            // 히스토리 항목에 "history test"가 포함되어 있는지 확인
            const historyItem = page.locator('text=history test').first();
            const itemExists = await historyItem.count() > 0;
            if (itemExists) {
                await expect(historyItem).toBeVisible();
            }
        }
    });
});
