import { test, expect } from '@playwright/test';
import { anonymousLogin } from './helpers/auth';

/**
 * 보안 통합 E2E 테스트
 * 
 * 테스트 시나리오:
 * 1. JWT 인증 (로그인 → 토큰 발급)
 * 2. CSRF 토큰 자동 처리
 * 3. 채팅 메시지 암호화/복호화
 * 4. 로그아웃 (토큰 블랙리스트)
 * 5. 401 자동 로그아웃
 */

test.describe('보안 기능 통합 테스트', () => {
    test.beforeEach(async ({ page, context }) => {
        // 테스트 전 쿠키 초기화
        await context.clearCookies();
    });

    test('전체 시나리오: 로그인 → 채팅 → 암호화 → 로그아웃', async ({ page }) => {
        // 1. 로그인 페이지로 이동
        await page.goto('/login');
        await expect(page).toHaveURL(/.*login/);

        // 2. 로그인 (테스트 계정)
        await page.fill('input[name="username"]', 'testuser');
        await page.fill('input[name="password"]', 'testpassword123');
        await page.click('button[type="submit"]');

        // 3. 로그인 성공 확인 (홈 페이지 리디렉션)
        await page.waitForURL('/home', { timeout: 5000 });

        // 4. Access Token 확인
        const accessToken = await page.evaluate(() => {
            return localStorage.getItem('access_token');
        });
        expect(accessToken).toBeTruthy();
        console.log('✅ JWT Access Token 발급 확인');

        // 5. 채팅방 입장
        await page.click('button:has-text("채팅")');
        await page.waitForSelector('[data-testid="chat-system"]', { timeout: 3000 });

        // 6. 암호화 토글 활성화
        const encryptionToggle = page.locator('[data-testid="encryption-toggle"]');
        if (await encryptionToggle.isVisible()) {
            await encryptionToggle.click();
            console.log('✅ 암호화 활성화');

            // 7. 키 교환 다이얼로그 확인
            const keyExchangeDialog = page.locator('[data-testid="key-exchange-dialog"]');
            if (await keyExchangeDialog.isVisible()) {
                await page.waitForSelector('[data-testid="key-exchange-success"]', { timeout: 5000 });
                console.log('✅ 키 교환 완료');
            }
        }

        // 8. 채팅 메시지 전송
        await page.fill('[data-testid="message-input"]', '테스트 메시지입니다');
        await page.click('[data-testid="send-button"]');

        // 9. 메시지 전송 확인
        await page.waitForSelector('text=테스트 메시지입니다', { timeout: 3000 });
        console.log('✅ 메시지 전송 성공');

        // 10. 로그아웃
        await page.click('[data-testid="logout-button"]');

        // 11. 로그아웃 후 로그인 페이지 리디렉션 확인
        await page.waitForURL('/login', { timeout: 3000 });

        // 12. 토큰 삭제 확인
        const tokenAfterLogout = await page.evaluate(() => {
            return localStorage.getItem('access_token');
        });
        expect(tokenAfterLogout).toBeNull();
        console.log('✅ 로그아웃 성공 (토큰 삭제 확인)');
    });

    test('CSRF 토큰 자동 처리 검증', async ({ page }) => {
        // 1. 로그인
        await page.goto('/login');
        await page.fill('input[name="username"]', 'testuser');
        await page.fill('input[name="password"]', 'testpassword123');
        await page.click('button[type="submit"]');
        await page.waitForURL('/home', { timeout: 5000 });

        // 2. 네트워크 요청 감시
        const requests: any[] = [];
        page.on('request', request => {
            if (request.method() === 'POST' || request.method() === 'PUT' || request.method() === 'DELETE') {
                requests.push({
                    url: request.url(),
                    headers: request.headers(),
                    method: request.method(),
                });
            }
        });

        // 3. 채팅 메시지 전송 (POST 요청 발생)
        await page.click('button:has-text("채팅")');
        await page.waitForSelector('[data-testid="chat-system"]', { timeout: 3000 });
        await page.fill('[data-testid="message-input"]', 'CSRF 테스트');
        await page.click('[data-testid="send-button"]');

        // 4. CSRF 토큰 헤더 확인
        await page.waitForTimeout(1000);
        const postRequests = requests.filter(req => req.method === 'POST');

        if (postRequests.length > 0) {
            const hasCSRFToken = postRequests.some(req =>
                req.headers['x-csrf-token'] !== undefined
            );
            expect(hasCSRFToken).toBeTruthy();
            console.log('✅ CSRF 토큰 자동 포함 확인');
        }
    });

    test('401 자동 로그아웃 검증', async ({ page, context }) => {
        // 1. 로그인
        await page.goto('/login');
        await page.fill('input[name="username"]', 'testuser');
        await page.fill('input[name="password"]', 'testpassword123');
        await page.click('button[type="submit"]');
        await page.waitForURL('/home', { timeout: 5000 });

        // 2. Access Token을 만료된 토큰으로 변경
        await page.evaluate(() => {
            localStorage.setItem('access_token', 'expired.jwt.token');
        });

        // 3. 다이얼로그 핸들러 설정 (401 에러 알림)
        page.on('dialog', async dialog => {
            console.log('✅ 401 에러 알림:', dialog.message());
            expect(dialog.message()).toContain('인증이 만료되었습니다');
            await dialog.accept();
        });

        // 4. API 요청 시도 (401 발생 예상)
        await page.click('button:has-text("프로필")');

        // 5. 로그인 페이지로 리디렉션 확인
        await page.waitForURL('/login', { timeout: 5000 });
        console.log('✅ 401 에러 시 자동 로그아웃 확인');
    });

    test('암호화된 메시지 전송 및 복호화', async ({ page }) => {
        // 1. 로그인
        await page.goto('/login');
        await page.fill('input[name="username"]', 'testuser');
        await page.fill('input[name="password"]', 'testpassword123');
        await page.click('button[type="submit"]');
        await page.waitForURL('/home', { timeout: 5000 });

        // 2. 채팅방 입장
        await page.click('button:has-text("채팅")');
        await page.waitForSelector('[data-testid="chat-system"]', { timeout: 3000 });

        // 3. 암호화 활성화
        const encryptionToggle = page.locator('[data-testid="encryption-toggle"]');
        if (await encryptionToggle.isVisible()) {
            await encryptionToggle.click();

            // 4. 키 교환 대기
            const keyExchangeDialog = page.locator('[data-testid="key-exchange-dialog"]');
            if (await keyExchangeDialog.isVisible()) {
                await page.waitForSelector('[data-testid="key-exchange-success"]', { timeout: 5000 });
            }

            // 5. 암호화 아이콘 확인
            await expect(page.locator('[data-testid="encryption-status"]')).toContainText('🔒');
            console.log('✅ 암호화 활성화 상태 확인');

            // 6. 암호화된 메시지 전송
            await page.fill('[data-testid="message-input"]', '기밀 메시지');
            await page.click('[data-testid="send-button"]');

            // 7. 메시지 표시 확인 (복호화된 상태)
            await page.waitForSelector('text=기밀 메시지', { timeout: 3000 });
            console.log('✅ 암호화된 메시지 전송 및 복호화 확인');
        } else {
            console.log('⚠️ 암호화 토글을 찾을 수 없습니다. 테스트 스킵');
        }
    });

    test('토큰 블랙리스트 검증', async ({ page }) => {
        // 1. 로그인
        await page.goto('/login');
        await page.fill('input[name="username"]', 'testuser');
        await page.fill('input[name="password"]', 'testpassword123');
        await page.click('button[type="submit"]');
        await page.waitForURL('/home', { timeout: 5000 });

        // 2. Access Token 저장
        const accessToken = await page.evaluate(() => {
            return localStorage.getItem('access_token');
        });

        // 3. 로그아웃
        await page.click('[data-testid="logout-button"]');
        await page.waitForURL('/login', { timeout: 3000 });

        // 4. 로그아웃된 토큰으로 API 요청 시도
        await page.evaluate((token) => {
            localStorage.setItem('access_token', token!);
        }, accessToken);

        await page.goto('/home');

        // 5. 401 에러 발생 확인 (블랙리스트된 토큰)
        page.on('dialog', async dialog => {
            console.log('✅ 블랙리스트 토큰 사용 시도:', dialog.message());
            expect(dialog.message()).toContain('로그아웃되었습니다');
            await dialog.accept();
        });

        // 6. 로그인 페이지로 리디렉션 확인
        await page.waitForURL('/login', { timeout: 5000 });
        console.log('✅ 블랙리스트 토큰 차단 확인');
    });

    test('CSRF 토큰 캐싱 검증', async ({ page }) => {
        // 1. 로그인
        await page.goto('/login');
        await page.fill('input[name="username"]', 'testuser');
        await page.fill('input[name="password"]', 'testpassword123');
        await page.click('button[type="submit"]');
        await page.waitForURL('/home', { timeout: 5000 });

        // 2. 네트워크 요청 감시
        const csrfRequests: string[] = [];
        page.on('request', request => {
            if (request.url().includes('/api/auth/csrf')) {
                csrfRequests.push(request.url());
            }
        });

        // 3. 여러 POST 요청 실행
        await page.click('button:has-text("채팅")');
        await page.waitForSelector('[data-testid="chat-system"]', { timeout: 3000 });

        for (let i = 0; i < 3; i++) {
            await page.fill('[data-testid="message-input"]', `메시지 ${i + 1}`);
            await page.click('[data-testid="send-button"]');
            await page.waitForTimeout(500);
        }

        // 4. CSRF 토큰 요청이 1번만 발생했는지 확인 (캐싱)
        expect(csrfRequests.length).toBeLessThanOrEqual(1);
        console.log('✅ CSRF 토큰 캐싱 확인:', csrfRequests.length, '번 요청');
    });
});
