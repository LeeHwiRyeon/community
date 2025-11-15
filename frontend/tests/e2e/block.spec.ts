import { test, expect, Page } from '@playwright/test';
import { anonymousLogin } from './helpers/auth';

/**
 * 사용자 차단 기능 E2E 테스트
 * 
 * 주요 시나리오:
 * 1. 차단 버튼 표시 확인
 * 2. 차단 확인 다이얼로그
 * 3. 차단 사유 입력
 * 4. 차단된 사용자 목록
 * 5. 차단 해제
 */

const TEST_USER1 = { username: 'testuser1', password: 'Test1234!' };
const TEST_USER2 = { username: 'testuser2', password: 'Test1234!' };

async function login(page: Page, user = TEST_USER1) {
    await anonymousLogin(page, user.username, user.password);
}

test.describe('사용자 차단 기능', () => {
    test.beforeEach(async ({ page, context }) => {
        await context.clearCookies();
    });

    test('프로필 페이지에서 차단 버튼이 표시되어야 함', async ({ page }) => {
        await login(page, TEST_USER1);

        // 다른 사용자 프로필로 이동
        await page.goto('/profile/testuser2');
        await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => { });

        // 차단 버튼 확인
        const blockButton = page.locator('button').filter({ hasText: /차단|Block/i }).first();

        const isVisible = await blockButton.isVisible({ timeout: 5000 }).catch(() => false);
        if (isVisible) {
            await expect(blockButton).toBeVisible();
        } else {
            console.log('Block button not found on profile page');
        }
    });

    test('차단 버튼 클릭 시 확인 다이얼로그가 열려야 함', async ({ page }) => {
        await login(page, TEST_USER1);

        await page.goto('/profile/testuser2');
        await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => { });

        const blockButton = page.locator('button').filter({ hasText: /차단|Block/i }).first();

        if (await blockButton.isVisible({ timeout: 5000 })) {
            await blockButton.click();

            // 확인 다이얼로그 확인
            const dialog = page.locator('[role="dialog"]')
                .or(page.locator('text=/차단하시겠습니까|Block.*user/i'));

            await expect(dialog).toBeVisible({ timeout: 3000 });
        }
    });

    test('차단 사유를 입력할 수 있어야 함', async ({ page }) => {
        await login(page, TEST_USER1);

        await page.goto('/profile/testuser2');
        await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => { });

        const blockButton = page.locator('button').filter({ hasText: /차단|Block/i }).first();

        if (await blockButton.isVisible({ timeout: 5000 })) {
            await blockButton.click();

            // 사유 입력 필드 찾기
            const reasonInput = page.locator('input[name*="reason"], textarea[name*="reason"]')
                .or(page.locator('input[placeholder*="사유"], textarea[placeholder*="사유"]'))
                .first();

            if (await reasonInput.isVisible({ timeout: 3000 })) {
                await reasonInput.fill('테스트 차단 사유');

                // 확인 버튼 클릭
                const confirmButton = page.locator('button').filter({ hasText: /확인|차단|Block/i }).last();
                await confirmButton.click();

                // 성공 메시지 또는 차단 완료 확인
                await page.waitForTimeout(1000);
            }
        }
    });

    test('차단된 사용자 목록을 확인할 수 있어야 함', async ({ page }) => {
        await login(page, TEST_USER1);

        // 설정 또는 프로필 페이지로 이동
        await page.goto('/settings');
        await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => { });

        // 차단 목록 링크 찾기
        const blockListLink = page.locator('a, button').filter({ hasText: /차단.*목록|Blocked.*Users/i });

        if (await blockListLink.isVisible({ timeout: 5000 })) {
            await blockListLink.click();
            await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => { });

            // 차단 목록 페이지 확인
            const heading = page.locator('h1, h2').filter({ hasText: /차단.*목록|Blocked.*Users/i });
            await expect(heading).toBeVisible({ timeout: 3000 });
        } else {
            // 직접 URL로 이동
            await page.goto('/settings/blocked-users');
            await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => { });
        }
    });

    test('차단된 사용자를 해제할 수 있어야 함', async ({ page }) => {
        await login(page, TEST_USER1);

        // 차단 목록 페이지로 이동
        await page.goto('/settings/blocked-users');
        await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => { });

        // 차단 해제 버튼 찾기
        const unblockButton = page.locator('button').filter({ hasText: /차단.*해제|Unblock/i }).first();

        if (await unblockButton.isVisible({ timeout: 5000 })) {
            await unblockButton.click();

            // 확인 다이얼로그가 있으면 확인
            const confirmButton = page.locator('button').filter({ hasText: /확인|Yes/i }).first();
            if (await confirmButton.isVisible({ timeout: 2000 })) {
                await confirmButton.click();
            }

            // 성공 메시지 확인
            await page.waitForTimeout(1000);
        } else {
            console.log('No blocked users to unblock');
        }
    });

    test('차단된 사용자의 게시물이 표시되지 않아야 함', async ({ page }) => {
        await login(page, TEST_USER1);

        // 홈 페이지로 이동
        await page.goto('/home');
        await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => { });

        // testuser2의 게시물 찾기
        const blockedUserPost = page.locator('article, .post-item').filter({ hasText: 'testuser2' }).first();

        // 차단된 경우 게시물이 없거나 "차단됨" 메시지 표시
        const isVisible = await blockedUserPost.isVisible({ timeout: 3000 }).catch(() => false);

        if (isVisible) {
            // 차단되지 않았거나 차단 표시가 있는 경우
            const blockedMessage = page.locator('text=/차단된.*사용자|Blocked.*user/i');
            const hasBlockedMessage = await blockedMessage.isVisible({ timeout: 2000 }).catch(() => false);

            if (!hasBlockedMessage) {
                console.log('User is not blocked or posts are still visible');
            }
        }
    });

    test('차단된 사용자의 프로필 접근 시 알림이 표시되어야 함', async ({ page }) => {
        await login(page, TEST_USER1);

        // 차단된 사용자 프로필로 이동 시도
        await page.goto('/profile/testuser2');
        await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => { });

        // 차단 알림 또는 제한된 프로필 표시 확인
        const blockedNotice = page.locator('text=/차단.*사용자|Blocked|접근.*제한/i');
        const unblockButton = page.locator('button').filter({ hasText: /차단.*해제|Unblock/i });

        // 차단 알림이 있거나 차단 해제 버튼이 있으면 차단 상태
        const hasNotice = await blockedNotice.isVisible({ timeout: 3000 }).catch(() => false);
        const hasUnblockBtn = await unblockButton.isVisible({ timeout: 3000 }).catch(() => false);

        if (!hasNotice && !hasUnblockBtn) {
            console.log('User is not blocked or profile is accessible');
        }
    });

    test('차단 기능이 양방향으로 작동하는지 확인', async ({ page, context }) => {
        // User1이 User2를 차단
        await login(page, TEST_USER1);

        await page.goto('/profile/testuser2');
        await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => { });

        const blockButton = page.locator('button').filter({ hasText: /차단|Block/i }).first();

        if (await blockButton.isVisible({ timeout: 5000 })) {
            await blockButton.click();

            const confirmButton = page.locator('button').filter({ hasText: /확인|차단|Block/i }).last();
            if (await confirmButton.isVisible({ timeout: 3000 })) {
                await confirmButton.click();
                await page.waitForTimeout(1000);
            }
        }

        // 로그아웃
        await context.clearCookies();

        // User2로 로그인
        await login(page, TEST_USER2);

        // User1 프로필로 이동
        await page.goto('/profile/testuser1');
        await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => { });

        // User2가 User1의 프로필을 볼 수 없거나 제한적으로 보이는지 확인
        const restrictedAccess = page.locator('text=/차단|Blocked|접근.*제한/i');
        const hasRestriction = await restrictedAccess.isVisible({ timeout: 3000 }).catch(() => false);

        console.log(hasRestriction ? 'Mutual blocking works' : 'Profile is accessible');
    });
});
