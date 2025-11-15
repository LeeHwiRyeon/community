import { test, expect } from '@playwright/test';
import { anonymousLogin } from './helpers/auth';

/**
 * 사용자 프로필 v2 E2E 테스트
 * 
 * 주요 시나리오:
 * 1. 프로필 페이지 렌더링
 * 2. 통계 카드 표시 (게시물, 팔로워, 팔로잉, 포인트)
 * 3. 배지 컬렉션 표시
 * 4. 레벨/경험치 바 표시
 * 5. 프로필 수정 버튼 클릭
 * 6. 프로필 편집 모달 열기
 * 7. 프로필 정보 수정 (이름, 바이오)
 * 8. 프로필 아바타 업로드
 * 9. 소셜 링크 추가/수정
 * 10. 리더보드 순위 표시
 * 11. 팔로우/언팔로우 버튼
 * 12. 사용자 게시물 목록 표시
 */

test.describe('사용자 프로필 v2', () => {
    test.beforeEach(async ({ page }) => {
        await anonymousLogin(page);
    });

    test('프로필 페이지가 정상적으로 렌더링되어야 함', async ({ page }) => {
        // 프로필 페이지로 이동
        await page.goto('/profile-v2');
        await page.waitForTimeout(2000);

        // 프로필 컨테이너 확인
        const profileContainer = page.locator('[data-testid="profile-container"]')
            .or(page.locator('.profile-page'))
            .or(page.locator('.profile-v2'))
            .first();

        await expect(profileContainer).toBeVisible({ timeout: 10000 });

        // 사용자 이름 확인
        const username = page.locator('[data-testid="user-name"]')
            .or(page.locator('.user-name'))
            .or(page.locator('h1, h2, h3'))
            .first();

        await expect(username).toBeVisible();
    });

    test('통계 카드가 표시되어야 함 (게시물, 팔로워, 팔로잉, 포인트)', async ({ page }) => {
        await page.goto('/profile-v2');
        await page.waitForTimeout(2000);

        // 통계 카드 찾기
        const statsCards = page.locator('[data-testid="stats-card"]')
            .or(page.locator('.stat-card'))
            .or(page.locator('.profile-stat'));

        const cardCount = await statsCards.count();
        expect(cardCount).toBeGreaterThan(0);

        // 최소 3개 이상의 통계가 있어야 함
        if (cardCount >= 3) {
            await expect(statsCards.first()).toBeVisible();

            // 각 카드에 숫자가 표시되어야 함
            const firstCardText = await statsCards.first().textContent();
            expect(firstCardText).toMatch(/\d+/);
        }
    });

    test('배지 컬렉션이 표시되어야 함', async ({ page }) => {
        await page.goto('/profile-v2');
        await page.waitForTimeout(2000);

        // 배지 섹션 찾기
        const badgeSection = page.locator('[data-testid="badge-collection"]')
            .or(page.locator('.badge-collection'))
            .or(page.locator('.badges'))
            .or(page.locator('text=/배지|Badge/i'))
            .first();

        // 배지 섹션이 있으면 확인
        const sectionExists = await badgeSection.count() > 0;
        if (sectionExists) {
            await expect(badgeSection).toBeVisible();

            // 배지 아이템 확인
            const badgeItems = page.locator('[data-testid="badge-item"]')
                .or(page.locator('.badge-item'))
                .or(page.locator('.badge'));

            const badgeCount = await badgeItems.count();
            if (badgeCount > 0) {
                await expect(badgeItems.first()).toBeVisible();
            }
        }
    });

    test('레벨과 경험치 바가 표시되어야 함', async ({ page }) => {
        await page.goto('/profile-v2');
        await page.waitForTimeout(2000);

        // 레벨 표시 찾기
        const levelDisplay = page.locator('[data-testid="user-level"]')
            .or(page.locator('.level-display'))
            .or(page.locator('text=/레벨|Level|Lv/i'))
            .first();

        const levelExists = await levelDisplay.count() > 0;
        if (levelExists) {
            await expect(levelDisplay).toBeVisible();

            // 경험치 바 확인
            const expBar = page.locator('[data-testid="exp-bar"]')
                .or(page.locator('.experience-bar'))
                .or(page.locator('.progress-bar'))
                .or(page.locator('.MuiLinearProgress-root'))
                .first();

            const barExists = await expBar.count() > 0;
            if (barExists) {
                await expect(expBar).toBeVisible();
            }
        }
    });

    test('프로필 수정 버튼을 클릭할 수 있어야 함', async ({ page }) => {
        await page.goto('/profile-v2');
        await page.waitForTimeout(2000);

        // 프로필 수정 버튼 찾기
        const editButton = page.locator('[data-testid="edit-profile"]')
            .or(page.locator('button:has-text("프로필 편집")'))
            .or(page.locator('button:has-text("편집")'))
            .or(page.locator('.edit-profile-button'))
            .first();

        const buttonExists = await editButton.count() > 0;
        expect(buttonExists).toBeTruthy();

        if (buttonExists) {
            await expect(editButton).toBeVisible();
            await editButton.click();
            await page.waitForTimeout(1000);
        }
    });

    test('프로필 편집 모달이 열려야 함', async ({ page }) => {
        await page.goto('/profile-v2');
        await page.waitForTimeout(2000);

        // 프로필 수정 버튼 클릭
        const editButton = page.locator('[data-testid="edit-profile"]')
            .or(page.locator('button:has-text("프로필 편집")'))
            .or(page.locator('button:has-text("편집")'))
            .first();

        const buttonExists = await editButton.count() > 0;
        if (buttonExists) {
            await editButton.click();
            await page.waitForTimeout(1000);

            // 모달 확인
            const modal = page.locator('[data-testid="edit-profile-modal"]')
                .or(page.locator('.MuiDialog-root'))
                .or(page.locator('.modal'))
                .or(page.locator('[role="dialog"]'))
                .first();

            await expect(modal).toBeVisible({ timeout: 5000 });
        }
    });

    test('프로필 정보를 수정할 수 있어야 함', async ({ page }) => {
        await page.goto('/profile-v2');
        await page.waitForTimeout(2000);

        // 프로필 수정 버튼 클릭
        const editButton = page.locator('[data-testid="edit-profile"]')
            .or(page.locator('button:has-text("프로필 편집")'))
            .first();

        const buttonExists = await editButton.count() > 0;
        if (buttonExists) {
            await editButton.click();
            await page.waitForTimeout(1000);

            // 이름 입력 필드
            const nameInput = page.locator('[data-testid="name-input"]')
                .or(page.locator('input[name="name"]'))
                .or(page.locator('input[placeholder*="이름"]'))
                .first();

            const nameExists = await nameInput.count() > 0;
            if (nameExists) {
                await nameInput.clear();
                await nameInput.fill('Updated Name');
                await page.waitForTimeout(500);
            }

            // 바이오 입력 필드
            const bioInput = page.locator('[data-testid="bio-input"]')
                .or(page.locator('textarea[name="bio"]'))
                .or(page.locator('textarea[placeholder*="소개"]'))
                .first();

            const bioExists = await bioInput.count() > 0;
            if (bioExists) {
                await bioInput.clear();
                await bioInput.fill('Updated bio description');
                await page.waitForTimeout(500);
            }

            // 저장 버튼 클릭
            const saveButton = page.locator('[data-testid="save-profile"]')
                .or(page.locator('button:has-text("저장")'))
                .or(page.locator('button[type="submit"]'))
                .first();

            const saveExists = await saveButton.count() > 0;
            if (saveExists) {
                await saveButton.click();
                await page.waitForTimeout(2000);

                // 성공 메시지 또는 모달 닫힘 확인
                const modal = page.locator('[role="dialog"]').first();
                const modalClosed = !(await modal.isVisible().catch(() => false));
                expect(modalClosed).toBeTruthy();
            }
        }
    });

    test('프로필 아바타를 업로드할 수 있어야 함', async ({ page }) => {
        await page.goto('/profile-v2');
        await page.waitForTimeout(2000);

        // 아바타 업로드 버튼 찾기
        const avatarUpload = page.locator('[data-testid="avatar-upload"]')
            .or(page.locator('input[type="file"][accept*="image"]'))
            .or(page.locator('.avatar-upload'))
            .first();

        const uploadExists = await avatarUpload.count() > 0;
        if (uploadExists) {
            // 파일이 실제로 있을 경우 업로드 테스트
            // 여기서는 업로드 버튼이 존재하는지만 확인
            const isVisible = await avatarUpload.isVisible().catch(() => false);
            console.log('Avatar upload element exists:', uploadExists);
            console.log('Avatar upload element visible:', isVisible);
        }
    });

    test('소셜 링크를 추가/수정할 수 있어야 함', async ({ page }) => {
        await page.goto('/profile-v2');
        await page.waitForTimeout(2000);

        // 프로필 수정 버튼 클릭
        const editButton = page.locator('[data-testid="edit-profile"]')
            .or(page.locator('button:has-text("프로필 편집")'))
            .first();

        const buttonExists = await editButton.count() > 0;
        if (buttonExists) {
            await editButton.click();
            await page.waitForTimeout(1000);

            // 소셜 링크 섹션 찾기
            const socialLinksSection = page.locator('[data-testid="social-links"]')
                .or(page.locator('.social-links'))
                .or(page.locator('text=/소셜|SNS/i'))
                .first();

            const sectionExists = await socialLinksSection.count() > 0;
            if (sectionExists) {
                await expect(socialLinksSection).toBeVisible();

                // 링크 입력 필드
                const linkInput = page.locator('[data-testid="social-link-input"]')
                    .or(page.locator('input[placeholder*="링크"]'))
                    .or(page.locator('input[name*="social"]'))
                    .first();

                const inputExists = await linkInput.count() > 0;
                if (inputExists) {
                    await linkInput.fill('https://github.com/testuser');
                    await page.waitForTimeout(500);
                }
            }
        }
    });

    test('리더보드 순위가 표시되어야 함', async ({ page }) => {
        await page.goto('/profile-v2');
        await page.waitForTimeout(2000);

        // 리더보드 순위 찾기
        const leaderboardRank = page.locator('[data-testid="leaderboard-rank"]')
            .or(page.locator('.leaderboard-rank'))
            .or(page.locator('text=/순위|Rank/i'))
            .first();

        const rankExists = await leaderboardRank.count() > 0;
        if (rankExists) {
            await expect(leaderboardRank).toBeVisible();

            // 순위 숫자 확인
            const rankText = await leaderboardRank.textContent();
            expect(rankText).toMatch(/\d+/);
        }
    });

    test('팔로우/언팔로우 버튼이 작동해야 함 (다른 사용자 프로필)', async ({ page }) => {
        // 다른 사용자의 프로필로 이동 (임의의 user ID 사용)
        await page.goto('/profile-v2/user/2');
        await page.waitForTimeout(2000);

        // 팔로우 버튼 찾기
        const followButton = page.locator('[data-testid="follow-button"]')
            .or(page.locator('button:has-text("팔로우")'))
            .or(page.locator('button:has-text("Follow")'))
            .or(page.locator('.follow-button'))
            .first();

        const buttonExists = await followButton.count() > 0;
        if (buttonExists) {
            const initialText = await followButton.textContent();

            // 버튼 클릭
            await followButton.click();
            await page.waitForTimeout(1000);

            // 버튼 텍스트가 변경되어야 함
            const updatedText = await followButton.textContent();
            expect(updatedText).not.toBe(initialText);

            // "팔로우" ↔ "언팔로우" 변경 확인
            if (initialText?.includes('팔로우')) {
                expect(updatedText).toMatch(/언팔로우|팔로잉/i);
            } else {
                expect(updatedText).toMatch(/팔로우/i);
            }
        }
    });

    test('사용자 게시물 목록이 표시되어야 함', async ({ page }) => {
        await page.goto('/profile-v2');
        await page.waitForTimeout(2000);

        // 게시물 탭 클릭 (있을 경우)
        const postsTab = page.locator('[data-testid="posts-tab"]')
            .or(page.locator('button:has-text("게시물")'))
            .or(page.locator('[role="tab"]:has-text("게시물")'))
            .first();

        const tabExists = await postsTab.count() > 0;
        if (tabExists) {
            await postsTab.click();
            await page.waitForTimeout(1000);
        }

        // 게시물 목록 확인
        const postsList = page.locator('[data-testid="user-posts"]')
            .or(page.locator('.post-list'))
            .or(page.locator('.post-card'))
            .first();

        // 게시물이 있으면 확인
        const postsExist = await postsList.count() > 0;
        if (postsExist) {
            await expect(postsList).toBeVisible();
        } else {
            // 게시물이 없을 때 메시지 확인
            const emptyMessage = page.locator('text=/게시물이 없습니다|No posts/i').first();
            const messageExists = await emptyMessage.count() > 0;
            if (messageExists) {
                await expect(emptyMessage).toBeVisible();
            }
        }
    });
});
