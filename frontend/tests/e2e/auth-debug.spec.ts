import { test, expect } from '@playwright/test';

test.describe('디버깅: 로그인 페이지', () => {
    test('페이지가 로드되는지 확인', async ({ page }) => {
        // 콘솔 에러 캡처
        const consoleMessages: string[] = [];
        page.on('console', msg => {
            consoleMessages.push(`${msg.type()}: ${msg.text()}`);
        });

        // 페이지 에러 캡처
        const pageErrors: string[] = [];
        page.on('pageerror', error => {
            pageErrors.push(error.message);
        });

        await page.goto('/login');
        await page.waitForTimeout(3000);

        // 에러 출력
        console.log('\n=== Console Messages ===');
        consoleMessages.forEach(msg => console.log(msg));

        console.log('\n=== Page Errors ===');
        pageErrors.forEach(err => console.log(err));

        // HTML 확인
        const bodyHTML = await page.locator('body').innerHTML();
        console.log('\n=== Body HTML ===');
        console.log(bodyHTML.substring(0, 500));
    });
});