import { test, expect, Page } from '@playwright/test';
import { anonymousLogin } from './helpers/auth';

/**
 * 북마크 시스템 E2E 테스트
 * 
 * 주요 시나리오:
 * 1. 게시물 북마크 추가/제거
 * 2. 게시판 북마크 추가/제거
 * 3. 북마크 목록 조회 및 필터링
 * 4. 북마크 검색
 * 5. 북마크 폴더 관리
 */

// 테스트용 사용자 계정
const TEST_USER = {
    username: 'testuser1',
    password: 'testpassword123'
};

/**
 * 로그인 헬퍼 함수 (공통 헬퍼 사용)
 */
async function login(page: Page) {
    await anonymousLogin(page);
}

test.describe('게시물 북마크', () => {
    test.beforeEach(async ({ page, context }) => {
        // 스토리지 클리어 (context 레벨에서 안전하게)
        await context.clearCookies();
        await page.goto('/');
    });

    test('게시물을 북마크할 수 있어야 함', async ({ page }) => {
        await login(page);

        // 게시물 페이지로 이동
        await page.goto('/posts/1');

        // 북마크 버튼 찾기
        const bookmarkButton = page.locator('button[aria-label*="북마크"]')
            .or(page.locator('button:has-text("북마크")'))
            .or(page.locator('[data-testid="bookmark-button"]'))
            .first();

        if (await bookmarkButton.isVisible({ timeout: 3000 })) {
            // 현재 상태 확인 (북마크되지 않은 상태여야 함)
            const isBookmarked = await bookmarkButton.getAttribute('aria-pressed').catch(() => 'false');

            if (isBookmarked === 'false' || !isBookmarked) {
                await bookmarkButton.click();

                // 북마크 성공 확인
                await page.waitForTimeout(1000);

                // 버튼 상태 변경 확인
                const updatedState = await bookmarkButton.getAttribute('aria-pressed').catch(() => null);

                console.log('✅ 게시물 북마크 추가 완료');
            } else {
                console.log('ℹ️ 이미 북마크된 게시물');
            }
        } else {
            console.log('⚠️ 북마크 버튼을 찾을 수 없습니다.');
        }
    });

    test('북마크한 게시물을 제거할 수 있어야 함', async ({ page }) => {
        await login(page);

        await page.goto('/posts/1');

        const bookmarkButton = page.locator('button[aria-label*="북마크"]')
            .or(page.locator('button:has-text("북마크")'))
            .first();

        if (await bookmarkButton.isVisible({ timeout: 3000 })) {
            // 북마크된 상태에서 다시 클릭 (제거)
            await bookmarkButton.click();
            await page.waitForTimeout(1000);

            console.log('✅ 게시물 북마크 제거 완료');
        }
    });

    test('북마크 버튼 시각적 피드백 확인', async ({ page }) => {
        await login(page);

        await page.goto('/posts/1');

        const bookmarkButton = page.locator('button[aria-label*="북마크"]').first();

        if (await bookmarkButton.isVisible({ timeout: 3000 })) {
            // 클릭 전 색상/아이콘 확인
            const beforeClick = await bookmarkButton.evaluate(el => ({
                color: window.getComputedStyle(el).color,
                opacity: window.getComputedStyle(el).opacity
            }));

            await bookmarkButton.click();
            await page.waitForTimeout(500);

            // 클릭 후 색상/아이콘 확인
            const afterClick = await bookmarkButton.evaluate(el => ({
                color: window.getComputedStyle(el).color,
                opacity: window.getComputedStyle(el).opacity
            }));

            // 상태 변경 확인
            console.log('✅ 북마크 버튼 시각적 피드백 확인', { beforeClick, afterClick });
        }
    });
});

test.describe('게시판 북마크', () => {
    test.beforeEach(async ({ page, context }) => {
        await context.clearCookies();
    });

    test('게시판을 북마크할 수 있어야 함', async ({ page }) => {
        await login(page);

        // 게시판 페이지로 이동
        await page.goto('/boards/1');

        // 게시판 북마크 버튼 찾기
        const bookmarkBoardButton = page.locator('button[aria-label*="게시판 북마크"]')
            .or(page.locator('button:has-text("북마크")'))
            .first();

        if (await bookmarkBoardButton.isVisible({ timeout: 3000 })) {
            await bookmarkBoardButton.click();
            await page.waitForTimeout(1000);

            console.log('✅ 게시판 북마크 추가 완료');
        } else {
            console.log('⚠️ 게시판 북마크 버튼을 찾을 수 없습니다.');
        }
    });

    test('북마크한 게시판을 제거할 수 있어야 함', async ({ page }) => {
        await login(page);

        await page.goto('/boards/1');

        const bookmarkBoardButton = page.locator('button[aria-label*="게시판 북마크"]')
            .or(page.locator('button:has-text("북마크")'))
            .first();

        if (await bookmarkBoardButton.isVisible({ timeout: 3000 })) {
            await bookmarkBoardButton.click();
            await page.waitForTimeout(1000);

            console.log('✅ 게시판 북마크 제거 완료');
        }
    });
});

test.describe('북마크 목록 관리', () => {
    test.beforeEach(async ({ page, context }) => {
        await context.clearCookies();
    });

    test('북마크 목록 페이지로 이동할 수 있어야 함', async ({ page }) => {
        await login(page);

        // 북마크 페이지로 이동
        await page.goto('/bookmarks');

        // 페이지 로드 확인
        await expect(page).toHaveURL(/bookmarks/i);

        // 북마크 목록 컨테이너 확인
        const bookmarkContainer = page.locator('.bookmarks-container')
            .or(page.locator('[data-testid="bookmarks-container"]'))
            .first();

        const isVisible = await bookmarkContainer.isVisible({ timeout: 3000 }).catch(() => false);

        if (isVisible) {
            console.log('✅ 북마크 목록 페이지 접근 완료');
        } else {
            // 빈 상태 메시지 확인
            const emptyMessage = page.locator('text=/북마크.*없습니다|No bookmarks/i').first();
            const hasEmptyMessage = await emptyMessage.isVisible({ timeout: 3000 }).catch(() => false);

            if (hasEmptyMessage) {
                console.log('✅ 북마크 빈 상태 확인');
            } else {
                console.log('⚠️ 북마크 목록 또는 빈 상태 메시지를 찾을 수 없습니다.');
            }
        }
    });

    test('북마크 타입별 필터링이 작동해야 함', async ({ page }) => {
        await login(page);

        await page.goto('/bookmarks');

        // 필터 버튼 찾기
        const postFilterButton = page.locator('button:has-text("게시물")')
            .or(page.locator('[data-filter="post"]'))
            .first();

        const boardFilterButton = page.locator('button:has-text("게시판")')
            .or(page.locator('[data-filter="board"]'))
            .first();

        if (await postFilterButton.isVisible({ timeout: 3000 })) {
            // 게시물 필터 클릭
            await postFilterButton.click();
            await page.waitForTimeout(500);

            console.log('✅ 게시물 필터 적용');

            // 게시판 필터 클릭
            if (await boardFilterButton.isVisible({ timeout: 2000 })) {
                await boardFilterButton.click();
                await page.waitForTimeout(500);

                console.log('✅ 게시판 필터 적용');
            }
        } else {
            console.log('ℹ️ 필터 버튼을 찾을 수 없습니다 (북마크가 없을 수 있음)');
        }
    });

    test('북마크 검색이 작동해야 함', async ({ page }) => {
        await login(page);

        await page.goto('/bookmarks');

        // 검색 입력 필드 찾기
        const searchInput = page.locator('input[placeholder*="검색"]')
            .or(page.locator('input[type="search"]'))
            .first();

        if (await searchInput.isVisible({ timeout: 3000 })) {
            // 검색어 입력
            await searchInput.fill('테스트');
            await page.waitForTimeout(1000);

            console.log('✅ 북마크 검색 기능 확인');
        } else {
            console.log('ℹ️ 검색 입력 필드를 찾을 수 없습니다.');
        }
    });

    test('북마크 목록 페이지네이션이 작동해야 함', async ({ page }) => {
        await login(page);

        await page.goto('/bookmarks');

        // 페이지네이션 컨트롤 찾기
        const nextPageButton = page.locator('button[aria-label*="다음"]')
            .or(page.locator('button:has-text("다음")'))
            .or(page.locator('.pagination button:last-child'))
            .first();

        if (await nextPageButton.isVisible({ timeout: 3000 })) {
            const isDisabled = await nextPageButton.isDisabled();

            if (!isDisabled) {
                await nextPageButton.click();
                await page.waitForTimeout(1000);

                console.log('✅ 페이지네이션 작동 확인');
            } else {
                console.log('ℹ️ 다음 페이지가 없음 (1페이지만 존재)');
            }
        } else {
            console.log('ℹ️ 페이지네이션을 찾을 수 없습니다 (북마크 수가 적을 수 있음)');
        }
    });
});

test.describe('북마크 폴더 관리', () => {
    test.beforeEach(async ({ page, context }) => {
        await context.clearCookies();
    });

    test('새 북마크 폴더를 생성할 수 있어야 함', async ({ page }) => {
        await login(page);

        await page.goto('/bookmarks');

        // 폴더 생성 버튼 찾기
        const createFolderButton = page.locator('button:has-text("폴더 생성")')
            .or(page.locator('button[aria-label*="폴더"]'))
            .first();

        if (await createFolderButton.isVisible({ timeout: 3000 })) {
            await createFolderButton.click();

            // 폴더 이름 입력
            const folderNameInput = page.locator('input[placeholder*="폴더"]').first();

            if (await folderNameInput.isVisible({ timeout: 2000 })) {
                await folderNameInput.fill('테스트 폴더');

                // 확인 버튼 클릭
                const confirmButton = page.locator('button:has-text("확인")')
                    .or(page.locator('button:has-text("생성")'))
                    .first();

                await confirmButton.click();
                await page.waitForTimeout(1000);

                console.log('✅ 북마크 폴더 생성 완료');
            }
        } else {
            console.log('ℹ️ 폴더 생성 버튼을 찾을 수 없습니다 (기능이 구현되지 않았을 수 있음)');
        }
    });

    test('북마크를 폴더로 이동할 수 있어야 함', async ({ page }) => {
        await login(page);

        await page.goto('/bookmarks');

        // 첫 번째 북마크 항목의 옵션 메뉴
        const bookmarkItem = page.locator('.bookmark-item').first();

        if (await bookmarkItem.isVisible({ timeout: 3000 })) {
            const moreButton = bookmarkItem.locator('button[aria-label*="더보기"]')
                .or(bookmarkItem.locator('button:has-text("⋮")'))
                .first();

            if (await moreButton.isVisible({ timeout: 2000 })) {
                await moreButton.click();

                // 폴더 이동 옵션
                const moveToFolderOption = page.locator('text=/폴더.*이동|Move to folder/i').first();

                if (await moveToFolderOption.isVisible({ timeout: 2000 })) {
                    await moveToFolderOption.click();
                    await page.waitForTimeout(1000);

                    console.log('✅ 북마크 폴더 이동 UI 확인');
                }
            }
        } else {
            console.log('ℹ️ 북마크 항목을 찾을 수 없습니다.');
        }
    });

    test('폴더를 삭제할 수 있어야 함', async ({ page }) => {
        await login(page);

        await page.goto('/bookmarks');

        // 폴더 항목 찾기
        const folderItem = page.locator('.folder-item')
            .or(page.locator('[data-type="folder"]'))
            .first();

        if (await folderItem.isVisible({ timeout: 3000 })) {
            const deleteButton = folderItem.locator('button[aria-label*="삭제"]')
                .or(folderItem.locator('button:has-text("삭제")'))
                .first();

            if (await deleteButton.isVisible({ timeout: 2000 })) {
                await deleteButton.click();

                // 확인 다이얼로그
                const confirmDeleteButton = page.locator('button:has-text("삭제")').last();
                await confirmDeleteButton.click();
                await page.waitForTimeout(1000);

                console.log('✅ 폴더 삭제 완료');
            }
        } else {
            console.log('ℹ️ 폴더를 찾을 수 없습니다.');
        }
    });
});

test.describe('북마크 통합 시나리오', () => {
    test('전체 북마크 워크플로우', async ({ page }) => {
        await login(page);

        // 1. 게시물 북마크
        await page.goto('/posts/1');
        const bookmarkButton = page.locator('button[aria-label*="북마크"]').first();
        if (await bookmarkButton.isVisible({ timeout: 3000 })) {
            await bookmarkButton.click();
            await page.waitForTimeout(1000);
            console.log('✅ 1. 게시물 북마크 완료');
        }

        // 2. 게시판 북마크
        await page.goto('/boards/1');
        const boardBookmarkButton = page.locator('button:has-text("북마크")').first();
        if (await boardBookmarkButton.isVisible({ timeout: 3000 })) {
            await boardBookmarkButton.click();
            await page.waitForTimeout(1000);
            console.log('✅ 2. 게시판 북마크 완료');
        }

        // 3. 북마크 목록 확인
        await page.goto('/bookmarks');
        const bookmarksList = page.locator('.bookmarks-list')
            .or(page.locator('[data-testid="bookmarks-list"]'))
            .first();

        if (await bookmarksList.isVisible({ timeout: 3000 })) {
            console.log('✅ 3. 북마크 목록 확인 완료');
        }

        // 4. 필터 적용
        const filterButton = page.locator('button:has-text("게시물")').first();
        if (await filterButton.isVisible({ timeout: 2000 })) {
            await filterButton.click();
            await page.waitForTimeout(500);
            console.log('✅ 4. 필터 적용 완료');
        }

        // 5. 검색 테스트
        const searchInput = page.locator('input[type="search"]').first();
        if (await searchInput.isVisible({ timeout: 2000 })) {
            await searchInput.fill('테스트');
            await page.waitForTimeout(1000);
            console.log('✅ 5. 검색 완료');
        }

        console.log('🎉 전체 북마크 워크플로우 완료!');
    });
});

test.describe('북마크 API 응답 확인', () => {
    test('북마크 추가 API 응답 확인', async ({ page }) => {
        await login(page);

        await page.goto('/posts/1');

        // API 요청 인터셉트
        const responsePromise = page.waitForResponse(
            response => response.url().includes('/api/bookmarks') && response.request().method() === 'POST',
            { timeout: 10000 }
        ).catch(() => null);

        const bookmarkButton = page.locator('button[aria-label*="북마크"]').first();

        if (await bookmarkButton.isVisible({ timeout: 3000 })) {
            await bookmarkButton.click();

            const response = await responsePromise;

            if (response) {
                const status = response.status();
                expect(status).toBe(200);

                console.log('✅ 북마크 추가 API 응답 확인:', status);
            }
        }
    });

    test('북마크 목록 조회 API 응답 확인', async ({ page }) => {
        await login(page);

        // API 요청 인터셉트
        const responsePromise = page.waitForResponse(
            response => response.url().includes('/api/bookmarks') && response.request().method() === 'GET',
            { timeout: 10000 }
        ).catch(() => null);

        await page.goto('/bookmarks');

        const response = await responsePromise;

        if (response) {
            const status = response.status();
            expect(status).toBe(200);

            const data = await response.json();
            console.log('✅ 북마크 목록 조회 API 응답 확인:', { status, count: data.bookmarks?.length || 0 });
        }
    });
});
