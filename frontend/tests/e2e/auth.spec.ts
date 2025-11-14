import { test, expect } from '@playwright/test';

test.describe('사용자 인증 플로우', () => {
    test.beforeEach(async ({ page, context }) => {
        await page.goto('/login');
        await context.clearCookies();
    });

    test('익명 로그인 버튼이 표시되어야 함', async ({ page }) => {

        const anonymousButton = page.getByTestId('anonymous-login-button');
        await expect(anonymousButton).toBeVisible();
        await expect(anonymousButton).toContainText('익명으로 시작하기');

        console.log('익명 로그인 버튼 표시 확인');
    });

    test('구글 로그인 버튼이 표시되어야 함', async ({ page }) => {
        await page.goto('/login');

        const googleButton = page.getByTestId('google-login-button');
        await expect(googleButton).toBeVisible();
        await expect(googleButton).toContainText('Google로 로그인');

        console.log('구글 로그인 버튼 표시 확인');
    });

    test('로그인 페이지에 도움말 텍스트가 표시되어야 함', async ({ page }) => {
        await page.goto('/login');

        const helpText = page.locator('text=빠르게 시작하고 나중에 계정을 연결');
        await expect(helpText).toBeVisible();

        console.log('로그인 도움말 표시 확인');
    });
});

test.describe('UI 컴포넌트 검증', () => {
    test('로그인 카드가 올바른 스타일로 렌더링되어야 함', async ({ page }) => {
        await page.goto('/login');

        const loginContainer = page.locator('div').filter({ hasText: '로그인' }).first();
        await expect(loginContainer).toBeVisible();

        console.log('로그인 UI 렌더링 확인');
    });
});
