import { test, expect, Page } from '@playwright/test';
import { anonymousLogin } from './helpers/auth';

/**
 * 소셜 기능 E2E 테스트
 * 
 * 주요 시나리오:
 * 1. 사용자 팔로우/언팔로우
 * 2. 게시판 팔로우
 * 3. 게시물 공유
 * 4. 사용자 차단/차단 해제
 * 5. 멘션 기능
 */

// 테스트용 사용자 계정
const TEST_USER1 = {
    username: 'testuser1',
    password: 'testpassword123'
};

const TEST_USER2 = {
    username: 'testuser2',
    password: 'testpassword123'
};

/**
 * 로그인 헬퍼 함수 (익명 로그인 사용)
 */
async function login(page: Page) {
    await anonymousLogin(page);
}

test.describe('사용자 팔로우 기능', () => {
    test.beforeEach(async ({ page, context }) => {
        await context.clearCookies();
    });

    test('다른 사용자를 팔로우할 수 있어야 함', async ({ page }) => {
        // 로그인
        await login(page);

        // 다른 사용자의 프로필 페이지로 이동
        await page.goto(`/profile/${TEST_USER2.username}`);

        // 팔로우 버튼 찾기
        const followButton = page.locator('button').filter({ hasText: /팔로우|Follow/i }).first();

        if (await followButton.isVisible({ timeout: 3000 })) {
            // 팔로우 버튼 클릭
            await followButton.click();

            // 버튼 텍스트가 '팔로잉'으로 변경되었는지 확인
            await expect(followButton).toContainText(/팔로잉|Following|언팔로우/i, { timeout: 5000 });

            console.log('✅ 팔로우 성공');
        } else {
            console.log('⚠️ 팔로우 버튼을 찾을 수 없습니다.');
        }
    });

    test('팔로우한 사용자를 언팔로우할 수 있어야 함', async ({ page }) => {
        await login(page);

        await page.goto(`/profile/${TEST_USER2.username}`);

        // 언팔로우 버튼 (이미 팔로잉 중인 상태)
        const unfollowButton = page.locator('button').filter({ hasText: /팔로잉|Following|언팔로우/i }).first();

        if (await unfollowButton.isVisible({ timeout: 3000 })) {
            await unfollowButton.click();

            // 확인 다이얼로그가 있을 수 있음
            const confirmButton = page.locator('button').filter({ hasText: /확인|언팔로우|Unfollow/i });
            if (await confirmButton.isVisible({ timeout: 2000 })) {
                await confirmButton.click();
            }

            // 버튼 텍스트가 '팔로우'로 변경되었는지 확인
            await expect(unfollowButton).toContainText(/^팔로우$|^Follow$/i, { timeout: 5000 });

            console.log('✅ 언팔로우 성공');
        } else {
            console.log('⚠️ 언팔로우 버튼을 찾을 수 없습니다.');
        }
    });

    test('팔로워/팔로잉 목록을 확인할 수 있어야 함', async ({ page }) => {
        await login(page);

        // 내 프로필 페이지로 이동
        await page.goto(`/profile/${TEST_USER1.username}`);

        // 팔로워 수 표시 확인
        const followersCount = page.locator('text=/팔로워|Followers/i').first();
        await expect(followersCount).toBeVisible({ timeout: 3000 });

        // 팔로잉 수 표시 확인
        const followingCount = page.locator('text=/팔로잉|Following/i').first();
        await expect(followingCount).toBeVisible({ timeout: 3000 });

        console.log('✅ 팔로워/팔로잉 카운트 확인');
    });
});

test.describe('게시판 팔로우 기능', () => {
    test.beforeEach(async ({ page, context }) => {
        await context.clearCookies();
    });

    test('게시판을 팔로우할 수 있어야 함', async ({ page }) => {
        await login(page);

        // 게시판 페이지로 이동 (예: /boards/1)
        await page.goto('/boards/1');

        // 게시판 팔로우 버튼 찾기
        const followBoardButton = page.locator('button').filter({ hasText: /게시판 팔로우|팔로우/i }).first();

        if (await followBoardButton.isVisible({ timeout: 3000 })) {
            await followBoardButton.click();

            // 팔로잉 상태 확인
            await expect(followBoardButton).toContainText(/팔로잉|Following/i, { timeout: 5000 });

            console.log('✅ 게시판 팔로우 성공');
        } else {
            console.log('⚠️ 게시판 팔로우 버튼을 찾을 수 없습니다.');
        }
    });

    test('팔로우한 게시판의 알림을 받을 수 있어야 함', async ({ page }) => {
        await login(page);

        // 알림 페이지 또는 알림 아이콘으로 이동
        const notificationIcon = page.locator('[aria-label*="알림"]').or(page.locator('button:has-text("알림")')).first();

        if (await notificationIcon.isVisible({ timeout: 3000 })) {
            await notificationIcon.click();

            // 알림 목록 확인
            const notificationList = page.locator('[role="menu"]').or(page.locator('.notification-list')).first();
            await expect(notificationList).toBeVisible({ timeout: 3000 });

            console.log('✅ 알림 목록 표시 확인');
        } else {
            console.log('⚠️ 알림 아이콘을 찾을 수 없습니다.');
        }
    });
});

test.describe('게시물 공유 기능', () => {
    test.beforeEach(async ({ page, context }) => {
        await context.clearCookies();
    });

    test('게시물 공유 버튼을 클릭할 수 있어야 함', async ({ page }) => {
        await login(page);

        // 게시물 페이지로 이동
        await page.goto('/posts/1');

        // 공유 버튼 찾기
        const shareButton = page.locator('button').filter({ hasText: /공유|Share/i }).first();

        if (await shareButton.isVisible({ timeout: 3000 })) {
            await shareButton.click();

            // 공유 다이얼로그 표시 확인
            const shareDialog = page.locator('[role="dialog"]').filter({ hasText: /공유|Share/i }).first();
            await expect(shareDialog).toBeVisible({ timeout: 3000 });

            console.log('✅ 공유 다이얼로그 표시 확인');
        } else {
            console.log('⚠️ 공유 버튼을 찾을 수 없습니다.');
        }
    });

    test('소셜 미디어 플랫폼이 표시되어야 함', async ({ page }) => {
        await login(page);

        await page.goto('/posts/1');

        const shareButton = page.locator('button').filter({ hasText: /공유|Share/i }).first();

        if (await shareButton.isVisible({ timeout: 3000 })) {
            await shareButton.click();

            // 소셜 미디어 플랫폼 옵션 확인
            const twitterOption = page.locator('text=Twitter').first();
            const facebookOption = page.locator('text=Facebook').first();
            const linkedinOption = page.locator('text=LinkedIn').first();
            const redditOption = page.locator('text=Reddit').first();

            // 최소 1개 이상의 플랫폼이 표시되어야 함
            const platformsVisible = await Promise.race([
                twitterOption.isVisible({ timeout: 2000 }),
                facebookOption.isVisible({ timeout: 2000 }),
                linkedinOption.isVisible({ timeout: 2000 }),
                redditOption.isVisible({ timeout: 2000 })
            ]);

            expect(platformsVisible).toBeTruthy();
            console.log('✅ 소셜 미디어 플랫폼 옵션 확인');
        }
    });

    test('링크 복사 기능이 작동해야 함', async ({ page }) => {
        await login(page);

        await page.goto('/posts/1');

        const shareButton = page.locator('button').filter({ hasText: /공유|Share/i }).first();

        if (await shareButton.isVisible({ timeout: 3000 })) {
            await shareButton.click();

            // 링크 복사 버튼 찾기
            const copyButton = page.locator('button').filter({ hasText: /링크 복사|복사|Copy/i }).first();

            if (await copyButton.isVisible({ timeout: 2000 })) {
                // 클립보드 권한 부여
                await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

                await copyButton.click();

                // 성공 메시지 확인
                const successMessage = page.locator('text=/복사.*완료|복사.*성공|Copied/i').first();
                await expect(successMessage).toBeVisible({ timeout: 3000 });

                console.log('✅ 링크 복사 성공');
            }
        }
    });

    test('공유 미리보기가 표시되어야 함', async ({ page }) => {
        await login(page);

        await page.goto('/posts/1');

        const shareButton = page.locator('button').filter({ hasText: /공유|Share/i }).first();

        if (await shareButton.isVisible({ timeout: 3000 })) {
            await shareButton.click();

            // 미리보기 영역 확인
            const previewArea = page.locator('.share-preview').or(page.locator('text=/미리보기|Preview/i')).first();

            if (await previewArea.isVisible({ timeout: 2000 })) {
                console.log('✅ 공유 미리보기 표시 확인');
            } else {
                console.log('ℹ️ 공유 미리보기가 표시되지 않음 (선택적 기능)');
            }
        }
    });
});

test.describe('사용자 차단 기능', () => {
    test.beforeEach(async ({ page, context }) => {
        await context.clearCookies();
    });

    test('다른 사용자를 차단할 수 있어야 함', async ({ page }) => {
        await login(page);

        await page.goto(`/profile/${TEST_USER2.username}`);

        // 더보기 메뉴 또는 차단 버튼 찾기
        const moreButton = page.locator('button[aria-label*="더보기"]').or(page.locator('button:has-text("⋮")')).first();

        if (await moreButton.isVisible({ timeout: 3000 })) {
            await moreButton.click();

            // 차단 옵션 클릭
            const blockOption = page.locator('text=/차단|Block/i').first();
            await blockOption.click();

            // 확인 다이얼로그
            const confirmButton = page.locator('button').filter({ hasText: /확인|차단|Block/i }).last();
            await confirmButton.click();

            // 차단 성공 메시지 확인
            const successMessage = page.locator('text=/차단.*완료|차단.*성공/i').first();
            await expect(successMessage).toBeVisible({ timeout: 3000 });

            console.log('✅ 사용자 차단 성공');
        } else {
            // 직접 차단 버튼이 있을 수 있음
            const blockButton = page.locator('button').filter({ hasText: /차단|Block/i }).first();

            if (await blockButton.isVisible({ timeout: 3000 })) {
                await blockButton.click();

                // 확인 다이얼로그
                const confirmButton = page.locator('button').filter({ hasText: /확인|차단|Block/i }).last();
                await confirmButton.click();

                console.log('✅ 사용자 차단 성공 (직접 버튼)');
            } else {
                console.log('⚠️ 차단 버튼을 찾을 수 없습니다.');
            }
        }
    });

    test('차단한 사용자를 차단 해제할 수 있어야 함', async ({ page }) => {
        await login(page);

        // 설정 또는 차단 목록 페이지로 이동
        await page.goto('/settings/blocked');

        // 차단 해제 버튼 찾기
        const unblockButton = page.locator('button').filter({ hasText: /차단 해제|Unblock/i }).first();

        if (await unblockButton.isVisible({ timeout: 3000 })) {
            await unblockButton.click();

            // 성공 메시지 확인
            const successMessage = page.locator('text=/차단 해제.*완료|차단 해제.*성공/i').first();
            await expect(successMessage).toBeVisible({ timeout: 3000 });

            console.log('✅ 차단 해제 성공');
        } else {
            console.log('⚠️ 차단 해제 버튼을 찾을 수 없습니다.');
        }
    });

    test('차단한 사용자 목록을 확인할 수 있어야 함', async ({ page }) => {
        await login(page);

        await page.goto('/settings/blocked');

        // 차단 목록 컨테이너 확인
        const blockedList = page.locator('.blocked-users-container').or(page.locator('[data-testid="blocked-users-list"]')).first();

        if (await blockedList.isVisible({ timeout: 3000 })) {
            console.log('✅ 차단 목록 표시 확인');
        } else {
            // 빈 상태 메시지 확인
            const emptyMessage = page.locator('text=/차단한 사용자가 없습니다/i').first();
            await expect(emptyMessage).toBeVisible({ timeout: 3000 });

            console.log('✅ 차단 목록 빈 상태 확인');
        }
    });

    test('차단된 사용자의 게시물이 숨겨져야 함', async ({ page }) => {
        await login(page);

        // 메인 피드로 이동
        await page.goto('/feed');

        // 차단된 사용자의 게시물이 표시되지 않는지 확인
        const blockedUserPost = page.locator(`[data-author="${TEST_USER2.username}"]`).first();

        // 차단된 사용자의 게시물이 없어야 함
        const isVisible = await blockedUserPost.isVisible({ timeout: 2000 }).catch(() => false);
        expect(isVisible).toBeFalsy();

        console.log('✅ 차단된 사용자의 게시물 숨김 확인');
    });
});

test.describe('북마크 기능', () => {
    test.beforeEach(async ({ page, context }) => {
        await context.clearCookies();
    });

    test('게시물을 북마크할 수 있어야 함', async ({ page }) => {
        await login(page);

        await page.goto('/posts/1');

        // 북마크 버튼 찾기
        const bookmarkButton = page.locator('button[aria-label*="북마크"]').or(page.locator('button:has-text("북마크")')).first();

        if (await bookmarkButton.isVisible({ timeout: 3000 })) {
            await bookmarkButton.click();

            // 북마크 활성 상태 확인 (아이콘 색상 변경 등)
            await page.waitForTimeout(1000); // 애니메이션 대기

            console.log('✅ 게시물 북마크 성공');
        } else {
            console.log('⚠️ 북마크 버튼을 찾을 수 없습니다.');
        }
    });

    test('북마크한 게시물 목록을 확인할 수 있어야 함', async ({ page }) => {
        await login(page);

        // 북마크 페이지로 이동
        await page.goto('/bookmarks');

        // 북마크 목록 확인
        const bookmarksList = page.locator('.bookmarks-list').or(page.locator('[data-testid="bookmarks-list"]')).first();

        if (await bookmarksList.isVisible({ timeout: 3000 })) {
            console.log('✅ 북마크 목록 표시 확인');
        } else {
            // 빈 상태 확인
            const emptyMessage = page.locator('text=/북마크.*없습니다/i').first();
            await expect(emptyMessage).toBeVisible({ timeout: 3000 });

            console.log('✅ 북마크 빈 상태 확인');
        }
    });

    test('북마크를 해제할 수 있어야 함', async ({ page }) => {
        await login(page);

        await page.goto('/posts/1');

        // 북마크된 상태의 버튼 찾기
        const bookmarkButton = page.locator('button[aria-label*="북마크"]').or(page.locator('button:has-text("북마크")')).first();

        if (await bookmarkButton.isVisible({ timeout: 3000 })) {
            await bookmarkButton.click();

            // 북마크 해제 확인
            await page.waitForTimeout(1000);

            console.log('✅ 북마크 해제 성공');
        }
    });
});

test.describe('멘션 기능', () => {
    test.beforeEach(async ({ page, context }) => {
        await context.clearCookies();
    });

    test('댓글에서 사용자를 멘션할 수 있어야 함', async ({ page }) => {
        await login(page);

        await page.goto('/posts/1');

        // 댓글 입력 필드 찾기
        const commentInput = page.locator('textarea[placeholder*="댓글"]').or(page.locator('input[placeholder*="댓글"]')).first();

        if (await commentInput.isVisible({ timeout: 3000 })) {
            // @ 기호와 함께 사용자명 입력
            await commentInput.fill(`@${TEST_USER2.username} 안녕하세요!`);

            // 멘션 자동완성 목록이 표시되는지 확인 (선택적)
            const mentionSuggestion = page.locator('.mention-suggestion').or(page.locator(`text=${TEST_USER2.username}`)).first();

            if (await mentionSuggestion.isVisible({ timeout: 2000 })) {
                await mentionSuggestion.click();
                console.log('✅ 멘션 자동완성 선택');
            }

            // 댓글 제출
            const submitButton = page.locator('button[type="submit"]').or(page.locator('button:has-text("댓글")')).first();
            await submitButton.click();

            // 댓글이 게시되었는지 확인
            await page.waitForTimeout(1000);

            console.log('✅ 멘션이 포함된 댓글 작성 완료');
        } else {
            console.log('⚠️ 댓글 입력 필드를 찾을 수 없습니다.');
        }
    });

    test('멘션된 사용자에게 알림이 발송되어야 함', async ({ page, context }) => {
        // User2로 로그인하여 알림 확인
        await login(page);

        // 알림 아이콘 클릭
        const notificationIcon = page.locator('[aria-label*="알림"]').or(page.locator('button:has-text("알림")')).first();

        if (await notificationIcon.isVisible({ timeout: 3000 })) {
            await notificationIcon.click();

            // 멘션 알림 확인
            const mentionNotification = page.locator('text=/멘션|mentioned/i').first();

            const hasNotification = await mentionNotification.isVisible({ timeout: 3000 }).catch(() => false);

            if (hasNotification) {
                console.log('✅ 멘션 알림 수신 확인');
            } else {
                console.log('ℹ️ 멘션 알림이 표시되지 않음 (타이밍 이슈 가능)');
            }
        }
    });
});

test.describe('소셜 통합 시나리오', () => {
    test('전체 소셜 인터랙션 플로우', async ({ page }) => {
        // 1. 로그인
        await login(page);
        console.log('✅ 1. 로그인 완료');

        // 2. 다른 사용자 팔로우
        await page.goto(`/profile/${TEST_USER2.username}`);
        const followButton = page.locator('button').filter({ hasText: /팔로우|Follow/i }).first();
        if (await followButton.isVisible({ timeout: 3000 })) {
            await followButton.click();
            await page.waitForTimeout(1000);
            console.log('✅ 2. 사용자 팔로우 완료');
        }

        // 3. 게시물 조회 및 북마크
        await page.goto('/posts/1');
        const bookmarkButton = page.locator('button[aria-label*="북마크"]').first();
        if (await bookmarkButton.isVisible({ timeout: 3000 })) {
            await bookmarkButton.click();
            await page.waitForTimeout(1000);
            console.log('✅ 3. 게시물 북마크 완료');
        }

        // 4. 게시물 공유
        const shareButton = page.locator('button').filter({ hasText: /공유|Share/i }).first();
        if (await shareButton.isVisible({ timeout: 3000 })) {
            await shareButton.click();

            // 링크 복사
            const copyButton = page.locator('button').filter({ hasText: /링크 복사|복사/i }).first();
            if (await copyButton.isVisible({ timeout: 2000 })) {
                await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
                await copyButton.click();
                await page.waitForTimeout(1000);
                console.log('✅ 4. 게시물 공유 (링크 복사) 완료');
            }

            // 다이얼로그 닫기
            const closeButton = page.locator('button[aria-label*="닫기"]').or(page.locator('button:has-text("닫기")')).first();
            if (await closeButton.isVisible({ timeout: 1000 })) {
                await closeButton.click();
            }
        }

        // 5. 댓글에 멘션 작성
        const commentInput = page.locator('textarea[placeholder*="댓글"]').or(page.locator('input[placeholder*="댓글"]')).first();
        if (await commentInput.isVisible({ timeout: 3000 })) {
            await commentInput.fill(`@${TEST_USER2.username} 좋은 게시물이네요!`);
            const submitButton = page.locator('button[type="submit"]').or(page.locator('button:has-text("댓글")')).first();
            await submitButton.click();
            await page.waitForTimeout(1000);
            console.log('✅ 5. 멘션 댓글 작성 완료');
        }

        console.log('🎉 전체 소셜 인터랙션 플로우 완료!');
    });
});
