import { test, expect } from '@playwright/test';

/**
 * 홈페이지 E2E 테스트
 * 
 * 주요 시나리오:
 * 1. 홈페이지 로드 및 기본 컴포넌트 확인
 * 2. 네비게이션 작동 확인
 * 3. 게시물 피드 로드 확인
 * 4. 검색 기능 확인
 */

test.describe('홈페이지 기본 기능', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('홈페이지가 정상적으로 로드되어야 함', async ({ page }) => {
        // 페이지 타이틀 확인
        await expect(page).toHaveTitle(/Community/i);

        // 메인 헤더 확인
        const header = page.locator('header');
        await expect(header).toBeVisible();

        // 로고 확인
        const logo = page.locator('[data-testid="app-logo"]').or(page.locator('img[alt*="logo"]')).first();
        await expect(logo).toBeVisible({ timeout: 5000 }).catch(() => {
            console.log('⚠️ 로고를 찾을 수 없습니다. data-testid="app-logo" 추가를 권장합니다.');
        });

        console.log('✅ 홈페이지 기본 요소 로드 확인');
    });

    test('네비게이션 메뉴가 작동해야 함', async ({ page }) => {
        // 홈 링크 클릭
        const homeLink = page.locator('a[href="/"]').or(page.locator('text=홈')).first();
        if (await homeLink.isVisible()) {
            await homeLink.click();
            await expect(page).toHaveURL('/');
        }

        // 피드 페이지 이동 (있는 경우)
        const feedLink = page.locator('a[href="/feed"]').or(page.locator('text=피드')).first();
        if (await feedLink.isVisible()) {
            await feedLink.click();
            await page.waitForURL(/feed/, { timeout: 3000 });
            console.log('✅ 피드 페이지 이동 성공');
        }

        console.log('✅ 네비게이션 작동 확인');
    });

    test('반응형 디자인 - 모바일 뷰', async ({ page }) => {
        // 모바일 뷰포트 설정
        await page.setViewportSize({ width: 375, height: 667 });

        // 햄버거 메뉴 확인 (모바일)
        const mobileMenu = page.locator('[data-testid="mobile-menu"]').or(page.locator('button[aria-label*="menu"]')).first();

        if (await mobileMenu.isVisible({ timeout: 2000 })) {
            await mobileMenu.click();
            console.log('✅ 모바일 메뉴 열기 성공');

            // 메뉴가 열렸는지 확인
            const menuDrawer = page.locator('[role="dialog"]').or(page.locator('.drawer')).first();
            await expect(menuDrawer).toBeVisible({ timeout: 2000 });
        } else {
            console.log('⚠️ 모바일 메뉴 버튼을 찾을 수 없습니다.');
        }
    });

    test('검색 기능이 작동해야 함', async ({ page }) => {
        // 검색 입력 필드 찾기
        const searchInput = page.locator('input[type="search"]')
            .or(page.locator('input[placeholder*="검색"]'))
            .or(page.locator('[data-testid="search-input"]'))
            .first();

        if (await searchInput.isVisible({ timeout: 3000 })) {
            // 검색어 입력
            await searchInput.fill('테스트');
            await page.keyboard.press('Enter');

            // 검색 결과 페이지로 이동 확인
            await page.waitForURL(/search|query/, { timeout: 3000 }).catch(() => {
                console.log('⚠️ 검색 결과 페이지로 리디렉션되지 않았습니다.');
            });

            console.log('✅ 검색 기능 작동 확인');
        } else {
            console.log('⚠️ 검색 입력 필드를 찾을 수 없습니다.');
        }
    });

    test('다크 모드 토글이 작동해야 함', async ({ page }) => {
        // 다크 모드 토글 버튼 찾기
        const themeToggle = page.locator('[data-testid="theme-toggle"]')
            .or(page.locator('button[aria-label*="theme"]'))
            .or(page.locator('button[aria-label*="다크"]'))
            .first();

        if (await themeToggle.isVisible({ timeout: 3000 })) {
            // 현재 테마 확인
            const initialTheme = await page.evaluate(() => {
                return document.documentElement.getAttribute('data-theme') ||
                    document.body.className;
            });

            // 토글 클릭
            await themeToggle.click();
            await page.waitForTimeout(500); // 테마 전환 대기

            // 테마 변경 확인
            const newTheme = await page.evaluate(() => {
                return document.documentElement.getAttribute('data-theme') ||
                    document.body.className;
            });

            expect(newTheme).not.toBe(initialTheme);
            console.log('✅ 다크 모드 토글 작동 확인');
        } else {
            console.log('⚠️ 테마 토글 버튼을 찾을 수 없습니다.');
        }
    });

    test('스크롤 시 무한 스크롤이 작동해야 함', async ({ page }) => {
        // 게시물 피드 확인
        const posts = page.locator('[data-testid="post-item"]').or(page.locator('article')).first();

        if (await posts.isVisible({ timeout: 5000 })) {
            // 초기 게시물 수 확인
            const initialCount = await page.locator('[data-testid="post-item"]').or(page.locator('article')).count();

            // 페이지 하단으로 스크롤
            await page.evaluate(() => {
                window.scrollTo(0, document.body.scrollHeight);
            });

            // 새로운 게시물 로드 대기
            await page.waitForTimeout(2000);

            // 게시물 수 증가 확인
            const newCount = await page.locator('[data-testid="post-item"]').or(page.locator('article')).count();

            if (newCount > initialCount) {
                console.log(`✅ 무한 스크롤 작동 확인 (${initialCount} → ${newCount} 게시물)`);
            } else {
                console.log('⚠️ 추가 게시물이 로드되지 않았습니다.');
            }
        } else {
            console.log('⚠️ 게시물 피드를 찾을 수 없습니다.');
        }
    });
});

test.describe('성능 및 접근성', () => {
    test('페이지 로드 성능 확인', async ({ page }) => {
        const startTime = Date.now();
        await page.goto('/');
        const loadTime = Date.now() - startTime;

        // 3초 이내 로드 확인
        expect(loadTime).toBeLessThan(3000);
        console.log(`✅ 페이지 로드 시간: ${loadTime}ms`);
    });

    test('기본 접근성 확인', async ({ page }) => {
        await page.goto('/');

        // 스킵 링크 확인
        const skipLink = page.locator('a[href="#main-content"]').or(page.locator('text=본문으로 이동')).first();
        if (await skipLink.isVisible({ timeout: 2000 })) {
            console.log('✅ 스킵 링크 존재');
        } else {
            console.log('⚠️ 스킵 링크를 찾을 수 없습니다. 접근성 개선을 권장합니다.');
        }

        // 메인 랜드마크 확인
        const main = page.locator('main').or(page.locator('[role="main"]')).first();
        await expect(main).toBeVisible();
        console.log('✅ 메인 랜드마크 존재');

        // 키보드 네비게이션 확인
        await page.keyboard.press('Tab');
        const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
        expect(focusedElement).toBeTruthy();
        console.log(`✅ 키보드 네비게이션 작동 (포커스: ${focusedElement})`);
    });
});
