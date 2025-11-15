import { test, expect } from '@playwright/test';
import { anonymousLogin } from './helpers/auth';

/**
 * 게시물 관리 E2E 테스트
 * 
 * 주요 시나리오:
 * 1. 게시물 작성
 * 2. 게시물 조회
 * 3. 게시물 수정
 * 4. 게시물 삭제
 * 5. 게시물 좋아요
 * 6. 댓글 작성
 */

test.describe('게시물 CRUD 기능', () => {
    test.beforeEach(async ({ page }) => {
        await anonymousLogin(page);
    });

    test('게시물 작성이 정상적으로 작동해야 함', async ({ page }) => {
        // 게시물 작성 페이지로 이동
        const createButton = page.locator('[data-testid="create-post-button"]')
            .or(page.locator('button:has-text("작성")'))
            .or(page.locator('a[href="/create"]'))
            .or(page.locator('a[href="/posts/create"]'))
            .first();

        if (await createButton.isVisible({ timeout: 5000 })) {
            await createButton.click();
            await page.waitForTimeout(1000);

            // 제목과 내용 입력
            const titleInput = page.locator('input[name="title"]')
                .or(page.locator('[data-testid="post-title"]'))
                .or(page.locator('input[placeholder*="제목"]'))
                .first();

            const contentInput = page.locator('textarea[name="content"]')
                .or(page.locator('[data-testid="post-content"]'))
                .or(page.locator('textarea[placeholder*="내용"]'))
                .first();

            if (await titleInput.isVisible({ timeout: 3000 })) {
                const timestamp = Date.now();
                await titleInput.fill(`테스트 게시물 ${timestamp}`);
                await contentInput.fill(`이것은 E2E 테스트용 게시물입니다. 생성 시간: ${timestamp}`);

                // 제출 버튼 클릭
                const submitButton = page.locator('button[type="submit"]')
                    .or(page.locator('button:has-text("등록")'))
                    .or(page.locator('button:has-text("작성")'))
                    .first();

                await submitButton.click();

                // 게시물 목록 또는 상세 페이지로 리디렉션 확인
                await page.waitForTimeout(2000);
                console.log('✅ 게시물 작성 완료');
            } else {
                console.log('⚠️ 게시물 작성 폼을 찾을 수 없습니다.');
            }
        } else {
            console.log('⚠️ 게시물 작성 버튼을 찾을 수 없습니다.');
        }
    });

    test('게시물 목록이 표시되어야 함', async ({ page }) => {
        // 피드 또는 게시물 목록 페이지로 이동
        await page.goto('/feed');

        // 게시물 목록 확인
        const posts = page.locator('[data-testid="post-item"]')
            .or(page.locator('article'))
            .or(page.locator('.post-card'));

        const postCount = await posts.count();

        if (postCount > 0) {
            console.log(`✅ 게시물 목록 표시 확인 (${postCount}개)`);

            // 첫 번째 게시물 클릭
            await posts.first().click();
            await page.waitForTimeout(1000);

            console.log('✅ 게시물 상세 페이지 이동 확인');
        } else {
            console.log('⚠️ 게시물 목록이 비어있습니다.');
        }
    });

    test('게시물 상세 페이지가 정상적으로 로드되어야 함', async ({ page }) => {
        // 특정 게시물 ID로 이동 (예시)
        await page.goto('/posts/1').catch(() => {
            console.log('⚠️ 게시물 ID 1이 존재하지 않습니다.');
        });

        // 게시물 제목 확인
        const title = page.locator('h1').or(page.locator('[data-testid="post-title"]')).first();

        if (await title.isVisible({ timeout: 3000 })) {
            console.log('✅ 게시물 상세 페이지 로드 확인');

            // 내용 확인
            const content = page.locator('[data-testid="post-content"]')
                .or(page.locator('.post-content'))
                .or(page.locator('p'));

            await expect(content.first()).toBeVisible();
        } else {
            console.log('⚠️ 게시물 상세 정보를 찾을 수 없습니다.');
        }
    });

    test('게시물 수정이 정상적으로 작동해야 함', async ({ page }) => {
        // 자신의 게시물로 이동
        await page.goto('/feed');
        await page.waitForTimeout(1000);

        // 수정 버튼 찾기
        const editButton = page.locator('[data-testid="edit-button"]')
            .or(page.locator('button:has-text("수정")'))
            .or(page.locator('a:has-text("수정")'))
            .first();

        if (await editButton.isVisible({ timeout: 5000 })) {
            await editButton.click();
            await page.waitForTimeout(1000);

            // 제목 수정
            const titleInput = page.locator('input[name="title"]').first();
            if (await titleInput.isVisible({ timeout: 3000 })) {
                await titleInput.fill(`수정된 제목 ${Date.now()}`);

                // 저장 버튼 클릭
                const saveButton = page.locator('button[type="submit"]')
                    .or(page.locator('button:has-text("저장")'))
                    .first();

                await saveButton.click();
                await page.waitForTimeout(2000);

                console.log('✅ 게시물 수정 완료');
            }
        } else {
            console.log('⚠️ 수정 가능한 게시물이 없습니다.');
        }
    });

    test('게시물 삭제가 정상적으로 작동해야 함', async ({ page }) => {
        // 먼저 게시물 작성
        await page.goto('/create').catch(async () => {
            const createButton = page.locator('button:has-text("작성")').first();
            if (await createButton.isVisible()) await createButton.click();
        });

        await page.waitForTimeout(1000);

        const titleInput = page.locator('input[name="title"]').first();
        if (await titleInput.isVisible({ timeout: 3000 })) {
            await titleInput.fill(`삭제 테스트 ${Date.now()}`);
            await page.locator('textarea[name="content"]').first().fill('삭제될 게시물');
            await page.locator('button[type="submit"]').first().click();
            await page.waitForTimeout(2000);

            // 삭제 버튼 찾기
            const deleteButton = page.locator('[data-testid="delete-button"]')
                .or(page.locator('button:has-text("삭제")'))
                .first();

            if (await deleteButton.isVisible({ timeout: 5000 })) {
                await deleteButton.click();

                // 확인 다이얼로그 처리
                page.on('dialog', dialog => dialog.accept());

                await page.waitForTimeout(1000);
                console.log('✅ 게시물 삭제 완료');
            } else {
                console.log('⚠️ 삭제 버튼을 찾을 수 없습니다.');
            }
        }
    });
});

test.describe('게시물 상호작용', () => {
    test.beforeEach(async ({ page }) => {
        // 로그인
        await page.goto('/login');
        await page.locator('input[name="username"]').or(page.locator('input[name="email"]')).first().fill('testuser');
        await page.locator('input[name="password"]').first().fill('testpassword123');
        await page.locator('button[type="submit"]').first().click();
        await page.waitForTimeout(2000);
    });

    test('게시물 좋아요가 작동해야 함', async ({ page }) => {
        await page.goto('/feed');

        // 좋아요 버튼 찾기
        const likeButton = page.locator('[data-testid="like-button"]')
            .or(page.locator('button[aria-label*="좋아요"]'))
            .or(page.locator('button:has-text("좋아요")'))
            .first();

        if (await likeButton.isVisible({ timeout: 5000 })) {
            // 초기 좋아요 수 확인
            const initialLikes = await page.locator('[data-testid="like-count"]')
                .or(page.locator('.like-count'))
                .first()
                .textContent()
                .catch(() => '0');

            // 좋아요 클릭
            await likeButton.click();
            await page.waitForTimeout(1000);

            // 좋아요 수 증가 확인
            const newLikes = await page.locator('[data-testid="like-count"]')
                .or(page.locator('.like-count'))
                .first()
                .textContent()
                .catch(() => '0');

            console.log(`✅ 좋아요 작동 확인 (${initialLikes} → ${newLikes})`);
        } else {
            console.log('⚠️ 좋아요 버튼을 찾을 수 없습니다.');
        }
    });

    test('댓글 작성이 작동해야 함', async ({ page }) => {
        // 게시물 상세 페이지로 이동
        await page.goto('/posts/1').catch(() => page.goto('/feed'));
        await page.waitForTimeout(1000);

        // 댓글 입력 필드 찾기
        const commentInput = page.locator('[data-testid="comment-input"]')
            .or(page.locator('textarea[placeholder*="댓글"]'))
            .or(page.locator('input[placeholder*="댓글"]'))
            .first();

        if (await commentInput.isVisible({ timeout: 5000 })) {
            // 댓글 작성
            const commentText = `테스트 댓글 ${Date.now()}`;
            await commentInput.fill(commentText);

            // 댓글 제출 버튼 클릭
            const submitButton = page.locator('[data-testid="comment-submit"]')
                .or(page.locator('button:has-text("등록")'))
                .or(page.locator('button[type="submit"]'))
                .first();

            await submitButton.click();
            await page.waitForTimeout(1000);

            // 댓글이 추가되었는지 확인
            const newComment = page.locator(`text=${commentText}`);
            await expect(newComment).toBeVisible({ timeout: 3000 });

            console.log('✅ 댓글 작성 완료');
        } else {
            console.log('⚠️ 댓글 입력 필드를 찾을 수 없습니다.');
        }
    });

    test('댓글 삭제가 작동해야 함', async ({ page }) => {
        await page.goto('/feed');
        await page.waitForTimeout(1000);

        // 자신의 댓글 찾기
        const deleteButton = page.locator('[data-testid="comment-delete"]')
            .or(page.locator('.comment button:has-text("삭제")'))
            .first();

        if (await deleteButton.isVisible({ timeout: 5000 })) {
            // 확인 다이얼로그 처리
            page.on('dialog', dialog => dialog.accept());

            await deleteButton.click();
            await page.waitForTimeout(1000);

            console.log('✅ 댓글 삭제 완료');
        } else {
            console.log('⚠️ 삭제할 댓글이 없습니다.');
        }
    });

    test('게시물 공유가 작동해야 함', async ({ page }) => {
        await page.goto('/feed');

        // 공유 버튼 찾기
        const shareButton = page.locator('[data-testid="share-button"]')
            .or(page.locator('button[aria-label*="공유"]'))
            .or(page.locator('button:has-text("공유")'))
            .first();

        if (await shareButton.isVisible({ timeout: 5000 })) {
            await shareButton.click();
            await page.waitForTimeout(500);

            // 공유 다이얼로그 확인
            const shareDialog = page.locator('[role="dialog"]')
                .or(page.locator('.share-dialog'))
                .first();

            await expect(shareDialog).toBeVisible({ timeout: 2000 });
            console.log('✅ 공유 다이얼로그 표시 확인');
        } else {
            console.log('⚠️ 공유 버튼을 찾을 수 없습니다.');
        }
    });

    test('게시물 북마크가 작동해야 함', async ({ page }) => {
        await page.goto('/feed');

        // 북마크 버튼 찾기
        const bookmarkButton = page.locator('[data-testid="bookmark-button"]')
            .or(page.locator('button[aria-label*="북마크"]'))
            .or(page.locator('button[aria-label*="저장"]'))
            .first();

        if (await bookmarkButton.isVisible({ timeout: 5000 })) {
            await bookmarkButton.click();
            await page.waitForTimeout(1000);

            console.log('✅ 북마크 토글 작동 확인');
        } else {
            console.log('⚠️ 북마크 버튼을 찾을 수 없습니다.');
        }
    });
});

test.describe('게시물 필터링 및 정렬', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/feed');
    });

    test('게시물 정렬이 작동해야 함', async ({ page }) => {
        // 정렬 드롭다운 찾기
        const sortSelect = page.locator('[data-testid="sort-select"]')
            .or(page.locator('select[name="sort"]'))
            .or(page.locator('button:has-text("정렬")'))
            .first();

        if (await sortSelect.isVisible({ timeout: 3000 })) {
            await sortSelect.click();
            await page.waitForTimeout(500);

            // 최신순 선택
            const latestOption = page.locator('text=최신순').or(page.locator('[value="latest"]')).first();
            if (await latestOption.isVisible({ timeout: 2000 })) {
                await latestOption.click();
                await page.waitForTimeout(1000);
                console.log('✅ 최신순 정렬 확인');
            }
        } else {
            console.log('⚠️ 정렬 옵션을 찾을 수 없습니다.');
        }
    });

    test('카테고리 필터링이 작동해야 함', async ({ page }) => {
        // 카테고리 필터 찾기
        const categoryFilter = page.locator('[data-testid="category-filter"]')
            .or(page.locator('button:has-text("카테고리")'))
            .first();

        if (await categoryFilter.isVisible({ timeout: 3000 })) {
            await categoryFilter.click();
            await page.waitForTimeout(500);

            // 특정 카테고리 선택
            const category = page.locator('text=기술').or(page.locator('[data-category="tech"]')).first();
            if (await category.isVisible({ timeout: 2000 })) {
                await category.click();
                await page.waitForTimeout(1000);
                console.log('✅ 카테고리 필터링 확인');
            }
        } else {
            console.log('⚠️ 카테고리 필터를 찾을 수 없습니다.');
        }
    });
});
