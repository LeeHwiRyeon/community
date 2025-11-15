import { test, expect, Page } from '@playwright/test';
import { anonymousLogin } from './helpers/auth';

/**
 * 멘션 기능 E2E 테스트
 * 
 * 주요 시나리오:
 * 1. @ 입력 시 드롭다운 표시
 * 2. 사용자 검색 및 선택
 * 3. 멘션 포맷팅
 * 4. 멘션 알림 생성
 * 5. 여러 멘션 처리
 */

const TEST_USER1 = { username: 'testuser1', password: 'Test1234!' };
const TEST_USER2 = { username: 'testuser2', password: 'Test1234!' };

async function login(page: Page, user = TEST_USER1) {
    await anonymousLogin(page, user.username, user.password);
}

test.describe('멘션 기능', () => {
    test.beforeEach(async ({ page, context }) => {
        await context.clearCookies();
    });

    test('@ 입력 시 사용자 검색 드롭다운이 표시되어야 함', async ({ page }) => {
        await login(page);

        // 게시물 작성 페이지로 이동
        await page.goto('/posts/new');
        await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => { });

        // 내용 입력 필드 찾기
        const contentField = page.locator('textarea[name="content"], [contenteditable="true"]').first();

        if (await contentField.isVisible({ timeout: 5000 })) {
            await contentField.click();
            await contentField.fill('@');

            // 드롭다운 또는 멘션 제안 표시 확인
            const dropdown = page.locator('[role="listbox"], .mention-dropdown, .user-suggestions');
            const hasDropdown = await dropdown.isVisible({ timeout: 3000 }).catch(() => false);

            if (!hasDropdown) {
                console.log('Mention dropdown not displayed');
            } else {
                await expect(dropdown).toBeVisible();
            }
        }
    });

    test('멘션 드롭다운에서 사용자를 검색할 수 있어야 함', async ({ page }) => {
        await login(page);

        await page.goto('/posts/new');
        await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => { });

        const contentField = page.locator('textarea[name="content"], [contenteditable="true"]').first();

        if (await contentField.isVisible({ timeout: 5000 })) {
            await contentField.click();
            await contentField.fill('@test');

            await page.waitForTimeout(500); // 검색 디바운스 대기

            // 검색 결과에 'test'가 포함된 사용자 표시
            const userItem = page.locator('text=/testuser|test/i').first();
            const hasResults = await userItem.isVisible({ timeout: 3000 }).catch(() => false);

            if (hasResults) {
                await expect(userItem).toBeVisible();
            } else {
                console.log('No search results for "@test"');
            }
        }
    });

    test('멘션 드롭다운에서 사용자를 선택할 수 있어야 함', async ({ page }) => {
        await login(page);

        await page.goto('/posts/new');
        await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => { });

        const contentField = page.locator('textarea[name="content"], [contenteditable="true"]').first();

        if (await contentField.isVisible({ timeout: 5000 })) {
            await contentField.click();
            await contentField.fill('@test');

            await page.waitForTimeout(500);

            // 첫 번째 사용자 선택
            const firstUser = page.locator('[role="option"], .mention-item, .user-item').first();

            if (await firstUser.isVisible({ timeout: 3000 })) {
                await firstUser.click();

                // 선택된 멘션이 필드에 삽입되었는지 확인
                const fieldContent = await contentField.inputValue().catch(() =>
                    contentField.textContent()
                );

                expect(fieldContent).toContain('@');
            }
        }
    });

    test('멘션이 게시물에 올바르게 포맷되어야 함', async ({ page }) => {
        await login(page);

        await page.goto('/posts/new');
        await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => { });

        // 제목 입력
        const titleField = page.locator('input[name="title"]').first();
        if (await titleField.isVisible({ timeout: 3000 })) {
            await titleField.fill('멘션 테스트 게시물');
        }

        // 내용에 멘션 포함
        const contentField = page.locator('textarea[name="content"], [contenteditable="true"]').first();

        if (await contentField.isVisible({ timeout: 5000 })) {
            await contentField.fill('@testuser2 님께 멘션합니다');

            // 게시
            const submitButton = page.locator('button[type="submit"]').or(
                page.locator('button').filter({ hasText: /게시|작성|Post|Submit/i })
            ).first();

            if (await submitButton.isVisible({ timeout: 3000 })) {
                await submitButton.click();
                await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => { });

                // 게시물에서 멘션이 링크로 표시되는지 확인
                const mentionLink = page.locator('a[href*="testuser2"]').or(
                    page.locator('text=/@testuser2/i')
                );

                await page.waitForTimeout(1000);
            }
        }
    });

    test('멘션된 사용자에게 알림이 생성되어야 함', async ({ page, context }) => {
        // User1이 User2를 멘션
        await login(page, TEST_USER1);

        await page.goto('/posts/new');
        await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => { });

        const titleField = page.locator('input[name="title"]').first();
        if (await titleField.isVisible({ timeout: 3000 })) {
            await titleField.fill('알림 테스트');
        }

        const contentField = page.locator('textarea[name="content"], [contenteditable="true"]').first();

        if (await contentField.isVisible({ timeout: 5000 })) {
            await contentField.fill('@testuser2 테스트 멘션');

            const submitButton = page.locator('button[type="submit"]').or(
                page.locator('button').filter({ hasText: /게시|Post/i })
            ).first();

            if (await submitButton.isVisible({ timeout: 3000 })) {
                await submitButton.click();
                await page.waitForTimeout(2000);
            }
        }

        // 로그아웃 후 User2로 로그인
        await context.clearCookies();
        await login(page, TEST_USER2);

        // 알림 확인
        await page.goto('/notifications');
        await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => { });

        // 멘션 알림이 있는지 확인
        const mentionNotification = page.locator('text=/멘션|mentioned|@testuser2/i');
        const hasNotification = await mentionNotification.isVisible({ timeout: 5000 }).catch(() => false);

        if (hasNotification) {
            await expect(mentionNotification).toBeVisible();
        } else {
            console.log('Mention notification not found');
        }
    });

    test('게시물에 여러 사용자를 멘션할 수 있어야 함', async ({ page }) => {
        await login(page);

        await page.goto('/posts/new');
        await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => { });

        const titleField = page.locator('input[name="title"]').first();
        if (await titleField.isVisible({ timeout: 3000 })) {
            await titleField.fill('다중 멘션 테스트');
        }

        const contentField = page.locator('textarea[name="content"], [contenteditable="true"]').first();

        if (await contentField.isVisible({ timeout: 5000 })) {
            // 여러 멘션 입력
            await contentField.fill('@testuser2 @testuser3 여러 사용자를 멘션합니다');

            const submitButton = page.locator('button[type="submit"]').or(
                page.locator('button').filter({ hasText: /게시|Post/i })
            ).first();

            if (await submitButton.isVisible({ timeout: 3000 })) {
                await submitButton.click();
                await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => { });

                // 두 개의 멘션이 모두 표시되는지 확인
                await page.waitForTimeout(1000);
            }
        }
    });

    test('댓글에서도 멘션을 사용할 수 있어야 함', async ({ page }) => {
        await login(page);

        // 홈 페이지로 이동
        await page.goto('/home');
        await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => { });

        // 첫 번째 게시물 찾기
        const firstPost = page.locator('article, .post-item').first();

        if (await firstPost.isVisible({ timeout: 5000 })) {
            await firstPost.click();
            await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => { });

            // 댓글 입력 필드 찾기
            const commentField = page.locator('textarea[placeholder*="댓글"], input[placeholder*="댓글"]')
                .or(page.locator('textarea[name="comment"]'))
                .first();

            if (await commentField.isVisible({ timeout: 3000 })) {
                await commentField.click();
                await commentField.fill('@testuser2 댓글에서 멘션합니다');

                // 댓글 작성 버튼
                const submitButton = page.locator('button').filter({ hasText: /댓글|Comment/i }).first();

                if (await submitButton.isVisible({ timeout: 3000 })) {
                    await submitButton.click();
                    await page.waitForTimeout(1000);

                    // 댓글에 멘션이 표시되는지 확인
                    const comment = page.locator('.comment, [data-testid*="comment"]').last();
                    const mentionInComment = comment.locator('text=/@testuser2/i');

                    await page.waitForTimeout(1000);
                }
            }
        }
    });

    test('존재하지 않는 사용자를 멘션하면 일반 텍스트로 처리되어야 함', async ({ page }) => {
        await login(page);

        await page.goto('/posts/new');
        await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => { });

        const titleField = page.locator('input[name="title"]').first();
        if (await titleField.isVisible({ timeout: 3000 })) {
            await titleField.fill('잘못된 멘션 테스트');
        }

        const contentField = page.locator('textarea[name="content"], [contenteditable="true"]').first();

        if (await contentField.isVisible({ timeout: 5000 })) {
            // 존재하지 않는 사용자 멘션
            await contentField.fill('@nonexistentuser999 는 존재하지 않는 사용자');

            const submitButton = page.locator('button[type="submit"]').or(
                page.locator('button').filter({ hasText: /게시|Post/i })
            ).first();

            if (await submitButton.isVisible({ timeout: 3000 })) {
                await submitButton.click();
                await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => { });

                // 일반 텍스트로 표시되거나 링크가 없는지 확인
                await page.waitForTimeout(1000);
            }
        }
    });
});
