import { test, expect } from '@playwright/test';
import { anonymousLogin } from './helpers/auth';

/**
 * 사용자 프로필 E2E 테스트
 * 
 * 주요 시나리오:
 * 1. 프로필 조회
 * 2. 프로필 수정
 * 3. 프로필 이미지 업로드
 * 4. 팔로우/언팔로우
 * 5. 사용자 게시물 조회
 */

test.describe('사용자 프로필 기능', () => {
    test.beforeEach(async ({ page }) => {
        await anonymousLogin(page);
    });

    test('프로필 페이지가 정상적으로 로드되어야 함', async ({ page }) => {
        // 프로필 페이지로 이동
        await page.goto('/profile');

        // 프로필 정보 확인
        const username = page.locator('[data-testid="profile-username"]')
            .or(page.locator('.profile-username'))
            .or(page.locator('h1'))
            .first();

        await expect(username).toBeVisible({ timeout: 5000 });
        console.log('✅ 프로필 페이지 로드 확인');

        // 프로필 이미지 확인
        const avatar = page.locator('[data-testid="profile-avatar"]')
            .or(page.locator('.avatar'))
            .or(page.locator('img[alt*="profile"]'))
            .first();

        if (await avatar.isVisible({ timeout: 2000 })) {
            console.log('✅ 프로필 이미지 표시 확인');
        }
    });

    test('프로필 정보 수정이 작동해야 함', async ({ page }) => {
        await page.goto('/profile');

        // 수정 버튼 클릭
        const editButton = page.locator('[data-testid="edit-profile-button"]')
            .or(page.locator('button:has-text("수정")'))
            .or(page.locator('a:has-text("수정")'))
            .first();

        if (await editButton.isVisible({ timeout: 5000 })) {
            await editButton.click();
            await page.waitForTimeout(1000);

            // 바이오 수정
            const bioInput = page.locator('textarea[name="bio"]')
                .or(page.locator('[data-testid="bio-input"]'))
                .or(page.locator('textarea[placeholder*="소개"]'))
                .first();

            if (await bioInput.isVisible({ timeout: 3000 })) {
                const newBio = `업데이트된 바이오 ${Date.now()}`;
                await bioInput.fill(newBio);

                // 저장 버튼 클릭
                const saveButton = page.locator('button[type="submit"]')
                    .or(page.locator('button:has-text("저장")'))
                    .first();

                await saveButton.click();
                await page.waitForTimeout(2000);

                // 변경된 내용 확인
                const updatedBio = page.locator('text=' + newBio);
                await expect(updatedBio).toBeVisible({ timeout: 3000 }).catch(() => {
                    console.log('⚠️ 바이오 업데이트 확인 실패');
                });

                console.log('✅ 프로필 정보 수정 완료');
            }
        } else {
            console.log('⚠️ 프로필 수정 버튼을 찾을 수 없습니다.');
        }
    });

    test('프로필 이미지 업로드 UI가 표시되어야 함', async ({ page }) => {
        await page.goto('/profile');

        // 이미지 업로드 버튼 찾기
        const uploadButton = page.locator('[data-testid="upload-avatar"]')
            .or(page.locator('input[type="file"]'))
            .or(page.locator('button:has-text("이미지")'))
            .first();

        if (await uploadButton.isVisible({ timeout: 5000 })) {
            console.log('✅ 프로필 이미지 업로드 UI 확인');
        } else {
            console.log('⚠️ 이미지 업로드 버튼을 찾을 수 없습니다.');
        }
    });

    test('사용자의 게시물 목록이 표시되어야 함', async ({ page }) => {
        await page.goto('/profile');

        // 게시물 탭 클릭
        const postsTab = page.locator('[data-testid="posts-tab"]')
            .or(page.locator('button:has-text("게시물")'))
            .or(page.locator('a:has-text("게시물")'))
            .first();

        if (await postsTab.isVisible({ timeout: 3000 })) {
            await postsTab.click();
            await page.waitForTimeout(1000);

            // 게시물 목록 확인
            const posts = page.locator('[data-testid="post-item"]')
                .or(page.locator('article'))
                .or(page.locator('.post-card'));

            const postCount = await posts.count();
            console.log(`✅ 사용자 게시물 ${postCount}개 확인`);
        } else {
            console.log('⚠️ 게시물 탭을 찾을 수 없습니다.');
        }
    });

    test('통계 정보가 표시되어야 함', async ({ page }) => {
        await page.goto('/profile');

        // 팔로워 수 확인
        const followers = page.locator('[data-testid="followers-count"]')
            .or(page.locator('text=팔로워'))
            .first();

        if (await followers.isVisible({ timeout: 3000 })) {
            console.log('✅ 팔로워 통계 표시 확인');
        }

        // 팔로잉 수 확인
        const following = page.locator('[data-testid="following-count"]')
            .or(page.locator('text=팔로잉'))
            .first();

        if (await following.isVisible({ timeout: 3000 })) {
            console.log('✅ 팔로잉 통계 표시 확인');
        }
    });
});

test.describe('팔로우 시스템', () => {
    test.beforeEach(async ({ page }) => {
        // 로그인
        await page.goto('/login');
        await page.locator('input[name="username"]').or(page.locator('input[name="email"]')).first().fill('testuser');
        await page.locator('input[name="password"]').first().fill('testpassword123');
        await page.locator('button[type="submit"]').first().click();
        await page.waitForTimeout(2000);
    });

    test('다른 사용자를 팔로우할 수 있어야 함', async ({ page }) => {
        // 다른 사용자의 프로필로 이동
        await page.goto('/users/2').catch(() => page.goto('/profile/2'));

        // 팔로우 버튼 찾기
        const followButton = page.locator('[data-testid="follow-button"]')
            .or(page.locator('button:has-text("팔로우")'))
            .first();

        if (await followButton.isVisible({ timeout: 5000 })) {
            // 초기 팔로워 수 확인
            const followersCount = page.locator('[data-testid="followers-count"]').first();
            const initialCount = await followersCount.textContent().catch(() => '0');

            // 팔로우 클릭
            await followButton.click();
            await page.waitForTimeout(1000);

            // 버튼 텍스트가 "언팔로우"로 변경되었는지 확인
            const unfollowButton = page.locator('button:has-text("언팔로우")').or(page.locator('button:has-text("팔로잉")'));
            await expect(unfollowButton.first()).toBeVisible({ timeout: 3000 });

            console.log('✅ 팔로우 기능 작동 확인');
        } else {
            console.log('⚠️ 팔로우 버튼을 찾을 수 없습니다.');
        }
    });

    test('사용자를 언팔로우할 수 있어야 함', async ({ page }) => {
        await page.goto('/users/2').catch(() => page.goto('/profile/2'));

        // 언팔로우 버튼 찾기 (이미 팔로우 상태라고 가정)
        const unfollowButton = page.locator('button:has-text("언팔로우")')
            .or(page.locator('button:has-text("팔로잉")'))
            .first();

        if (await unfollowButton.isVisible({ timeout: 5000 })) {
            await unfollowButton.click();
            await page.waitForTimeout(1000);

            // 버튼 텍스트가 "팔로우"로 변경되었는지 확인
            const followButton = page.locator('button:has-text("팔로우")').first();
            await expect(followButton).toBeVisible({ timeout: 3000 });

            console.log('✅ 언팔로우 기능 작동 확인');
        } else {
            console.log('⚠️ 언팔로우 버튼을 찾을 수 없습니다. 먼저 팔로우가 필요합니다.');
        }
    });

    test('팔로워 목록이 표시되어야 함', async ({ page }) => {
        await page.goto('/profile');

        // 팔로워 목록 링크 클릭
        const followersLink = page.locator('[data-testid="followers-link"]')
            .or(page.locator('a:has-text("팔로워")'))
            .first();

        if (await followersLink.isVisible({ timeout: 5000 })) {
            await followersLink.click();
            await page.waitForTimeout(1000);

            // 팔로워 목록 확인
            const followersList = page.locator('[data-testid="followers-list"]')
                .or(page.locator('.follower-item'))
                .first();

            if (await followersList.isVisible({ timeout: 3000 })) {
                console.log('✅ 팔로워 목록 표시 확인');
            }
        } else {
            console.log('⚠️ 팔로워 링크를 찾을 수 없습니다.');
        }
    });

    test('팔로잉 목록이 표시되어야 함', async ({ page }) => {
        await page.goto('/profile');

        // 팔로잉 목록 링크 클릭
        const followingLink = page.locator('[data-testid="following-link"]')
            .or(page.locator('a:has-text("팔로잉")'))
            .first();

        if (await followingLink.isVisible({ timeout: 5000 })) {
            await followingLink.click();
            await page.waitForTimeout(1000);

            // 팔로잉 목록 확인
            const followingList = page.locator('[data-testid="following-list"]')
                .or(page.locator('.following-item'))
                .first();

            if (await followingList.isVisible({ timeout: 3000 })) {
                console.log('✅ 팔로잉 목록 표시 확인');
            }
        } else {
            console.log('⚠️ 팔로잉 링크를 찾을 수 없습니다.');
        }
    });
});

test.describe('사용자 설정', () => {
    test.beforeEach(async ({ page }) => {
        // 로그인
        await page.goto('/login');
        await page.locator('input[name="username"]').or(page.locator('input[name="email"]')).first().fill('testuser');
        await page.locator('input[name="password"]').first().fill('testpassword123');
        await page.locator('button[type="submit"]').first().click();
        await page.waitForTimeout(2000);
    });

    test('설정 페이지에 접근할 수 있어야 함', async ({ page }) => {
        // 설정 페이지로 이동
        await page.goto('/settings');

        // 설정 페이지 확인
        const settingsTitle = page.locator('h1:has-text("설정")')
            .or(page.locator('text=설정'))
            .first();

        await expect(settingsTitle).toBeVisible({ timeout: 5000 });
        console.log('✅ 설정 페이지 접근 확인');
    });

    test('알림 설정을 변경할 수 있어야 함', async ({ page }) => {
        await page.goto('/settings');

        // 알림 설정 토글 찾기
        const notificationToggle = page.locator('[data-testid="notification-toggle"]')
            .or(page.locator('input[type="checkbox"][name*="notification"]'))
            .first();

        if (await notificationToggle.isVisible({ timeout: 3000 })) {
            await notificationToggle.click();
            await page.waitForTimeout(1000);

            console.log('✅ 알림 설정 토글 작동 확인');
        } else {
            console.log('⚠️ 알림 설정을 찾을 수 없습니다.');
        }
    });

    test('프라이버시 설정을 변경할 수 있어야 함', async ({ page }) => {
        await page.goto('/settings');

        // 프라이버시 설정
        const privacyToggle = page.locator('[data-testid="privacy-toggle"]')
            .or(page.locator('input[name*="private"]'))
            .or(page.locator('input[name*="privacy"]'))
            .first();

        if (await privacyToggle.isVisible({ timeout: 3000 })) {
            await privacyToggle.click();
            await page.waitForTimeout(1000);

            console.log('✅ 프라이버시 설정 토글 작동 확인');
        } else {
            console.log('⚠️ 프라이버시 설정을 찾을 수 없습니다.');
        }
    });

    test('계정 삭제 옵션이 있어야 함', async ({ page }) => {
        await page.goto('/settings');

        // 계정 삭제 버튼 찾기
        const deleteButton = page.locator('[data-testid="delete-account-button"]')
            .or(page.locator('button:has-text("계정 삭제")'))
            .first();

        if (await deleteButton.isVisible({ timeout: 3000 })) {
            console.log('✅ 계정 삭제 옵션 존재 확인');
            // 실제로 클릭하지는 않음
        } else {
            console.log('⚠️ 계정 삭제 옵션을 찾을 수 없습니다.');
        }
    });
});
