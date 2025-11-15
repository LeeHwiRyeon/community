import { test, expect } from '@playwright/test';

test('기본 테스트 - 페이지 로드', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await expect(page).toHaveTitle(/Community|thenewspaper/i);
    console.log('✅ 페이지가 정상적으로 로드되었습니다.');
});
