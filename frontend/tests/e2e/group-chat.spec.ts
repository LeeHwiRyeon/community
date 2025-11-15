import { test, expect } from '@playwright/test';

/**
 * Group Chat System E2E Tests
 * 
 * 테스트 시나리오:
 * 1. 그룹 생성 및 초대
 * 2. 그룹 채팅 메시지 전송/수신
 * 3. 멤버 관리 (추방, 권한 변경)
 * 4. 그룹 설정 변경
 * 5. 그룹 검색 및 참여
 */

test.describe('Group Chat System', () => {
    const user1 = {
        email: 'user1@test.com',
        password: 'Test1234!',
        username: 'user1'
    };

    const user2 = {
        email: 'user2@test.com',
        password: 'Test1234!',
        username: 'user2'
    };

    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('GC-01: 그룹 생성 성공', async ({ page }) => {
        // User1 로그인
        await page.click('text=로그인');
        await page.fill('input[name="email"]', user1.email);
        await page.fill('input[name="password"]', user1.password);
        await page.click('button[type="submit"]');
        await page.waitForLoadState('networkidle');

        // 그룹 채팅 페이지로 이동
        await page.click('[data-testid="group-chat-menu"]');
        await expect(page.locator('h1:has-text("그룹 채팅")')).toBeVisible();

        // 그룹 생성 버튼 클릭
        await page.click('button:has-text("그룹 만들기")');
        await expect(page.locator('[data-testid="create-group-dialog"]')).toBeVisible();

        // 그룹 정보 입력
        await page.fill('[data-testid="group-name-input"]', 'E2E 테스트 그룹');
        await page.fill('[data-testid="group-description-input"]', '자동화 테스트를 위한 그룹입니다.');

        // 멤버 초대
        await page.click('[data-testid="add-member-button"]');
        await page.fill('[data-testid="search-user-input"]', user2.username);
        await page.click(`[data-testid="user-item-${user2.username}"]`);

        // 그룹 생성
        await page.click('button:has-text("그룹 만들기")');
        await page.waitForLoadState('networkidle');

        // 그룹이 목록에 나타나는지 확인
        await expect(page.locator('text=E2E 테스트 그룹')).toBeVisible();
    });

    test('GC-02: 그룹 채팅 메시지 전송 및 수신', async ({ browser }) => {
        // 두 개의 브라우저 컨텍스트 생성
        const context1 = await browser.newContext();
        const page1 = await context1.newPage();

        const context2 = await browser.newContext();
        const page2 = await context2.newPage();

        // User1 로그인 및 그룹 입장
        await page1.goto('/');
        await page1.click('text=로그인');
        await page1.fill('input[name="email"]', user1.email);
        await page1.fill('input[name="password"]', user1.password);
        await page1.click('button[type="submit"]');
        await page1.waitForLoadState('networkidle');
        await page1.click('[data-testid="group-chat-menu"]');
        await page1.click('text=E2E 테스트 그룹');

        // User2 로그인 및 그룹 입장
        await page2.goto('/');
        await page2.click('text=로그인');
        await page2.fill('input[name="email"]', user2.email);
        await page2.fill('input[name="password"]', user2.password);
        await page2.click('button[type="submit"]');
        await page2.waitForLoadState('networkidle');
        await page2.click('[data-testid="group-chat-menu"]');
        await page2.click('text=E2E 테스트 그룹');

        // User1: 메시지 전송
        const testMessage = '안녕하세요, 여러분!';
        await page1.fill('[data-testid="group-message-input"]', testMessage);
        await page1.click('button:has-text("전송")');

        // User2: 메시지 수신 확인
        await expect(page2.locator(`text=${testMessage}`)).toBeVisible({ timeout: 5000 });
        await expect(page2.locator(`text=${user1.username}`)).toBeVisible();

        // Context 정리
        await context1.close();
        await context2.close();
    });

    test('GC-03: 멤버 추방 기능', async ({ page }) => {
        // User1 (그룹 관리자) 로그인
        await page.click('text=로그인');
        await page.fill('input[name="email"]', user1.email);
        await page.fill('input[name="password"]', user1.password);
        await page.click('button[type="submit"]');
        await page.waitForLoadState('networkidle');

        // 그룹 입장
        await page.click('[data-testid="group-chat-menu"]');
        await page.click('text=E2E 테스트 그룹');

        // 멤버 목록 열기
        await page.click('[data-testid="group-members-button"]');
        await expect(page.locator('[data-testid="members-list"]')).toBeVisible();

        // User2 추방
        await page.click(`[data-testid="member-menu-${user2.username}"]`);
        await page.click('text=멤버 추방');
        await page.click('button:has-text("확인")');

        // User2가 멤버 목록에서 사라졌는지 확인
        await expect(page.locator(`[data-testid="member-${user2.username}"]`)).not.toBeVisible();
    });

    test('GC-04: 멤버 권한 변경', async ({ page }) => {
        // User1 (관리자) 로그인
        await page.click('text=로그인');
        await page.fill('input[name="email"]', user1.email);
        await page.fill('input[name="password"]', user1.password);
        await page.click('button[type="submit"]');
        await page.waitForLoadState('networkidle');

        // 그룹 입장 및 멤버 목록 열기
        await page.click('[data-testid="group-chat-menu"]');
        await page.click('text=E2E 테스트 그룹');
        await page.click('[data-testid="group-members-button"]');

        // User2를 관리자로 승격
        await page.click(`[data-testid="member-menu-${user2.username}"]`);
        await page.click('text=관리자로 승격');
        await page.click('button:has-text("확인")');

        // User2의 권한이 "관리자"로 표시되는지 확인
        await expect(page.locator(`[data-testid="member-role-${user2.username}"]`)).toHaveText('관리자');
    });

    test('GC-05: 그룹 설정 변경', async ({ page }) => {
        // User1 로그인
        await page.click('text=로그인');
        await page.fill('input[name="email"]', user1.email);
        await page.fill('input[name="password"]', user1.password);
        await page.click('button[type="submit"]');
        await page.waitForLoadState('networkidle');

        // 그룹 입장 및 설정 열기
        await page.click('[data-testid="group-chat-menu"]');
        await page.click('text=E2E 테스트 그룹');
        await page.click('[data-testid="group-settings-button"]');

        // 그룹 이름 변경
        await page.fill('[data-testid="group-name-input"]', 'E2E 테스트 그룹 (수정됨)');

        // 공개/비공개 설정
        await page.click('[data-testid="group-privacy-toggle"]');

        // 초대 권한 설정
        await page.selectOption('[data-testid="invite-permission-select"]', 'members');

        // 저장
        await page.click('button:has-text("저장")');

        // 설정이 적용되었는지 확인
        await expect(page.locator('h2:has-text("E2E 테스트 그룹 (수정됨)")')).toBeVisible();
    });

    test('GC-06: 공개 그룹 검색 및 참여', async ({ page }) => {
        // User2 로그인
        await page.click('text=로그인');
        await page.fill('input[name="email"]', user2.email);
        await page.fill('input[name="password"]', user2.password);
        await page.click('button[type="submit"]');
        await page.waitForLoadState('networkidle');

        // 그룹 검색
        await page.click('[data-testid="group-chat-menu"]');
        await page.click('button:has-text("그룹 검색")');
        await page.fill('[data-testid="group-search-input"]', 'E2E 테스트');
        await page.press('[data-testid="group-search-input"]', 'Enter');

        // 검색 결과 확인
        await expect(page.locator('text=E2E 테스트 그룹')).toBeVisible();

        // 그룹 참여
        await page.click('[data-testid="join-group-button"]');
        await page.waitForLoadState('networkidle');

        // 그룹 채팅방에 입장했는지 확인
        await expect(page.locator('h2:has-text("E2E 테스트 그룹")')).toBeVisible();
        await expect(page.locator('text=그룹에 참여했습니다')).toBeVisible();
    });

    test('GC-07: 타이핑 인디케이터 (그룹)', async ({ browser }) => {
        // 두 개의 브라우저 컨텍스트 생성
        const context1 = await browser.newContext();
        const page1 = await context1.newPage();

        const context2 = await browser.newContext();
        const page2 = await context2.newPage();

        // User1, User2 로그인 및 그룹 입장
        // ... (로그인 코드 생략)

        // User1: 메시지 입력 시작
        await page1.fill('[data-testid="group-message-input"]', '입력 중...');

        // User2: 타이핑 인디케이터 표시 확인
        await expect(page2.locator('[data-testid="typing-indicator"]')).toBeVisible({ timeout: 2000 });
        await expect(page2.locator('text=user1님이 입력 중...')).toBeVisible();

        // Context 정리
        await context1.close();
        await context2.close();
    });

    test('GC-08: 그룹 나가기', async ({ page }) => {
        // User2 로그인
        await page.click('text=로그인');
        await page.fill('input[name="email"]', user2.email);
        await page.fill('input[name="password"]', user2.password);
        await page.click('button[type="submit"]');
        await page.waitForLoadState('networkidle');

        // 그룹 입장
        await page.click('[data-testid="group-chat-menu"]');
        await page.click('text=E2E 테스트 그룹');

        // 그룹 나가기
        await page.click('[data-testid="group-settings-button"]');
        await page.click('text=그룹 나가기');
        await page.click('button:has-text("확인")');

        // 그룹 목록에서 사라졌는지 확인
        await expect(page.locator('text=E2E 테스트 그룹')).not.toBeVisible();
    });

    test('GC-09: 파일 첨부 (그룹)', async ({ page }) => {
        // User1 로그인 및 그룹 입장
        await page.click('text=로그인');
        await page.fill('input[name="email"]', user1.email);
        await page.fill('input[name="password"]', user1.password);
        await page.click('button[type="submit"]');
        await page.waitForLoadState('networkidle');
        await page.click('[data-testid="group-chat-menu"]');
        await page.click('text=E2E 테스트 그룹');

        // 파일 첨부
        await page.click('[data-testid="attach-file-button"]');
        const fileInput = await page.locator('input[type="file"]');
        await fileInput.setInputFiles('./tests/fixtures/test-document.pdf');

        // 파일 미리보기 확인
        await expect(page.locator('[data-testid="file-preview"]')).toBeVisible();

        // 메시지와 함께 전송
        await page.fill('[data-testid="group-message-input"]', '문서를 첨부합니다.');
        await page.click('button:has-text("전송")');

        // 전송된 파일 확인
        await expect(page.locator('[data-testid="attached-file"]')).toBeVisible();
    });
});

/**
 * 그룹 채팅 권한 테스트
 */
test.describe('Group Chat Permissions', () => {
    test('GCP-01: 일반 멤버는 다른 멤버를 추방할 수 없음', async ({ page }) => {
        // User2 (일반 멤버) 로그인
        // ... (로그인 코드)

        // 멤버 목록 열기
        await page.click('[data-testid="group-members-button"]');

        // 추방 버튼이 비활성화되어 있는지 확인
        await expect(page.locator('[data-testid="kick-member-button"]')).toBeDisabled();
    });

    test('GCP-02: 관리자만 그룹 설정 변경 가능', async ({ page }) => {
        // User2 (일반 멤버) 로그인
        // ... (로그인 코드)

        // 그룹 설정 버튼 클릭
        await page.click('[data-testid="group-settings-button"]');

        // 설정 편집 UI가 비활성화되어 있는지 확인
        await expect(page.locator('[data-testid="group-name-input"]')).toBeDisabled();
    });
});
