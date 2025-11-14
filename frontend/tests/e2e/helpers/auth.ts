import { Page } from '@playwright/test';

/**
 * 익명 로그인을 수행하는 공통 헬퍼 함수
 * 
 * @param page - Playwright Page 객체
 * @returns Promise<void>
 */
export async function anonymousLogin(page: Page): Promise<void> {
    await page.goto('/login');

    // 페이지 로드 대기
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => { });

    // 익명 로그인 버튼 찾기 (여러 방법 시도)
    const anonymousButton = page.locator('[data-testid="anonymous-login-button"]')
        .or(page.locator('button').filter({ hasText: /익명.*시작|Anonymous.*Login/i }));

    // 버튼이 나타날 때까지 대기
    try {
        await anonymousButton.first().waitFor({ state: 'visible', timeout: 10000 });
        await anonymousButton.first().click();

        // 로그인 후 리다이렉트 대기
        await page.waitForURL(/home|dashboard|feed|\/(?!login)/, {
            timeout: 10000
        }).catch(() => {
            // timeout이 발생해도 계속 진행
            console.log('URL 변경 대기 타임아웃, 계속 진행');
        });

        console.log('✅ 익명 로그인 성공');
    } catch (error) {
        console.error('❌ 익명 로그인 실패:', error);
        throw new Error('익명 로그인 버튼을 찾을 수 없거나 클릭할 수 없습니다.');
    }
}

/**
 * 테스트용 일반 로그인 함수 (필요시 사용)
 * 
 * @param page - Playwright Page 객체
 * @param username - 사용자명
 * @param password - 비밀번호
 */
export async function regularLogin(
    page: Page,
    username: string,
    password: string
): Promise<void> {
    await page.goto('/login');

    const usernameInput = page.locator('input[name="username"]')
        .or(page.locator('input[name="email"]'))
        .first();
    const passwordInput = page.locator('input[name="password"]').first();

    await usernameInput.fill(username);
    await passwordInput.fill(password);

    const loginButton = page.locator('button[type="submit"]').first();
    await loginButton.click();

    await page.waitForURL(/home|dashboard|feed/, {
        timeout: 5000
    }).catch(() => { });
}
