const { test, expect } = require('@playwright/test');

test.describe('User Journey E2E Tests', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to the home page before each test
        await page.goto('http://localhost:3000');
    });

    test('Complete user registration and login flow', async ({ page }) => {
        // 1. Navigate to registration page
        await page.click('[data-testid="register-link"]');
        await expect(page).toHaveURL(/.*\/register/);

        // 2. Fill registration form
        await page.fill('[data-testid="username-input"]', 'testuser123');
        await page.fill('[data-testid="email-input"]', 'testuser123@example.com');
        await page.fill('[data-testid="password-input"]', 'Password123!');
        await page.fill('[data-testid="confirm-password-input"]', 'Password123!');

        // 3. Submit registration
        await page.click('[data-testid="register-button"]');

        // 4. Wait for success message
        await expect(page.locator('[data-testid="success-message"]')).toContainText('회원가입이 완료되었습니다');

        // 5. Navigate to login page
        await page.click('[data-testid="login-link"]');
        await expect(page).toHaveURL(/.*\/login/);

        // 6. Fill login form
        await page.fill('[data-testid="email-input"]', 'testuser123@example.com');
        await page.fill('[data-testid="password-input"]', 'Password123!');

        // 7. Submit login
        await page.click('[data-testid="login-button"]');

        // 8. Verify successful login
        await expect(page).toHaveURL(/.*\/dashboard/);
        await expect(page.locator('[data-testid="user-menu"]')).toContainText('testuser123');
    });

    test('Create and manage a post', async ({ page }) => {
        // Login first (assuming user is already registered)
        await page.goto('http://localhost:3000/login');
        await page.fill('[data-testid="email-input"]', 'testuser@example.com');
        await page.fill('[data-testid="password-input"]', 'password123');
        await page.click('[data-testid="login-button"]');

        // 1. Navigate to create post page
        await page.click('[data-testid="create-post-button"]');
        await expect(page).toHaveURL(/.*\/posts\/new/);

        // 2. Fill post form
        await page.fill('[data-testid="post-title-input"]', 'E2E Test Post');
        await page.selectOption('[data-testid="board-select"]', 'general');
        await page.fill('[data-testid="post-content-textarea"]', 'This is a test post created during E2E testing.');
        await page.fill('[data-testid="tags-input"]', 'e2e, testing, automation');

        // 3. Submit post
        await page.click('[data-testid="submit-post-button"]');

        // 4. Verify post creation
        await expect(page).toHaveURL(/.*\/posts\/\d+/);
        await expect(page.locator('[data-testid="post-title"]')).toContainText('E2E Test Post');
        await expect(page.locator('[data-testid="post-content"]')).toContainText('This is a test post created during E2E testing.');

        // 5. Edit the post
        await page.click('[data-testid="edit-post-button"]');
        await page.fill('[data-testid="post-title-input"]', 'Updated E2E Test Post');
        await page.fill('[data-testid="post-content-textarea"]', 'This is an updated test post.');
        await page.click('[data-testid="save-post-button"]');

        // 6. Verify post update
        await expect(page.locator('[data-testid="post-title"]')).toContainText('Updated E2E Test Post');
        await expect(page.locator('[data-testid="post-content"]')).toContainText('This is an updated test post.');

        // 7. Delete the post
        await page.click('[data-testid="delete-post-button"]');
        await page.click('[data-testid="confirm-delete-button"]');

        // 8. Verify post deletion
        await expect(page).toHaveURL(/.*\/dashboard/);
        await expect(page.locator('[data-testid="success-message"]')).toContainText('게시글이 삭제되었습니다');
    });

    test('Comment on a post', async ({ page }) => {
        // Login first
        await page.goto('http://localhost:3000/login');
        await page.fill('[data-testid="email-input"]', 'testuser@example.com');
        await page.fill('[data-testid="password-input"]', 'password123');
        await page.click('[data-testid="login-button"]');

        // 1. Navigate to a post
        await page.click('[data-testid="post-link"]');
        await expect(page).toHaveURL(/.*\/posts\/\d+/);

        // 2. Add a comment
        await page.fill('[data-testid="comment-input"]', 'This is a test comment.');
        await page.click('[data-testid="submit-comment-button"]');

        // 3. Verify comment appears
        await expect(page.locator('[data-testid="comment-list"]')).toContainText('This is a test comment.');

        // 4. Edit the comment
        await page.click('[data-testid="edit-comment-button"]');
        await page.fill('[data-testid="comment-edit-input"]', 'This is an updated test comment.');
        await page.click('[data-testid="save-comment-button"]');

        // 5. Verify comment update
        await expect(page.locator('[data-testid="comment-list"]')).toContainText('This is an updated test comment.');

        // 6. Delete the comment
        await page.click('[data-testid="delete-comment-button"]');
        await page.click('[data-testid="confirm-delete-button"]');

        // 7. Verify comment deletion
        await expect(page.locator('[data-testid="comment-list"]')).not.toContainText('This is an updated test comment.');
    });

    test('Search functionality', async ({ page }) => {
        // 1. Use search bar
        await page.fill('[data-testid="search-input"]', 'test');
        await page.click('[data-testid="search-button"]');

        // 2. Verify search results
        await expect(page).toHaveURL(/.*\/search/);
        await expect(page.locator('[data-testid="search-results"]')).toBeVisible();

        // 3. Filter by category
        await page.selectOption('[data-testid="category-filter"]', 'tech');
        await page.click('[data-testid="apply-filters-button"]');

        // 4. Verify filtered results
        await expect(page.locator('[data-testid="search-results"]')).toBeVisible();

        // 5. Clear search
        await page.click('[data-testid="clear-search-button"]');
        await expect(page.locator('[data-testid="search-input"]')).toHaveValue('');
    });

    test('Real-time chat functionality', async ({ page, context }) => {
        // Login first
        await page.goto('http://localhost:3000/login');
        await page.fill('[data-testid="email-input"]', 'testuser@example.com');
        await page.fill('[data-testid="password-input"]', 'password123');
        await page.click('[data-testid="login-button"]');

        // 1. Navigate to chat
        await page.click('[data-testid="chat-link"]');
        await expect(page).toHaveURL(/.*\/chat/);

        // 2. Join a chat room
        await page.click('[data-testid="join-room-button"]');
        await expect(page.locator('[data-testid="chat-room"]')).toBeVisible();

        // 3. Send a message
        await page.fill('[data-testid="message-input"]', 'Hello from E2E test!');
        await page.click('[data-testid="send-message-button"]');

        // 4. Verify message appears
        await expect(page.locator('[data-testid="message-list"]')).toContainText('Hello from E2E test!');

        // 5. Open second browser context to simulate another user
        const secondPage = await context.newPage();
        await secondPage.goto('http://localhost:3000/login');
        await secondPage.fill('[data-testid="email-input"]', 'testuser2@example.com');
        await secondPage.fill('[data-testid="password-input"]', 'password123');
        await secondPage.click('[data-testid="login-button"]');

        // 6. Second user joins same chat room
        await secondPage.click('[data-testid="chat-link"]');
        await secondPage.click('[data-testid="join-room-button"]');

        // 7. Second user sends a message
        await secondPage.fill('[data-testid="message-input"]', 'Hello from second user!');
        await secondPage.click('[data-testid="send-message-button"]');

        // 8. Verify first user sees the message
        await expect(page.locator('[data-testid="message-list"]')).toContainText('Hello from second user!');

        // 9. Clean up
        await secondPage.close();
    });

    test('User profile management', async ({ page }) => {
        // Login first
        await page.goto('http://localhost:3000/login');
        await page.fill('[data-testid="email-input"]', 'testuser@example.com');
        await page.fill('[data-testid="password-input"]', 'password123');
        await page.click('[data-testid="login-button"]');

        // 1. Navigate to profile
        await page.click('[data-testid="user-menu"]');
        await page.click('[data-testid="profile-link"]');
        await expect(page).toHaveURL(/.*\/profile/);

        // 2. Edit profile information
        await page.click('[data-testid="edit-profile-button"]');
        await page.fill('[data-testid="bio-textarea"]', 'This is my updated bio for E2E testing.');
        await page.fill('[data-testid="location-input"]', 'Seoul, South Korea');
        await page.click('[data-testid="save-profile-button"]');

        // 3. Verify profile update
        await expect(page.locator('[data-testid="bio-display"]')).toContainText('This is my updated bio for E2E testing.');
        await expect(page.locator('[data-testid="location-display"]')).toContainText('Seoul, South Korea');

        // 4. Change password
        await page.click('[data-testid="change-password-button"]');
        await page.fill('[data-testid="current-password-input"]', 'password123');
        await page.fill('[data-testid="new-password-input"]', 'NewPassword123!');
        await page.fill('[data-testid="confirm-password-input"]', 'NewPassword123!');
        await page.click('[data-testid="save-password-button"]');

        // 5. Verify password change
        await expect(page.locator('[data-testid="success-message"]')).toContainText('비밀번호가 변경되었습니다');
    });

    test('Notification system', async ({ page }) => {
        // Login first
        await page.goto('http://localhost:3000/login');
        await page.fill('[data-testid="email-input"]', 'testuser@example.com');
        await page.fill('[data-testid="password-input"]', 'password123');
        await page.click('[data-testid="login-button"]');

        // 1. Navigate to notifications
        await page.click('[data-testid="notifications-link"]');
        await expect(page).toHaveURL(/.*\/notifications/);

        // 2. Check notification list
        await expect(page.locator('[data-testid="notification-list"]')).toBeVisible();

        // 3. Mark notification as read
        await page.click('[data-testid="mark-read-button"]');
        await expect(page.locator('[data-testid="notification-item"]')).toHaveClass(/read/);

        // 4. Mark all notifications as read
        await page.click('[data-testid="mark-all-read-button"]');
        await expect(page.locator('[data-testid="unread-count"]')).toContainText('0');

        // 5. Delete notification
        await page.click('[data-testid="delete-notification-button"]');
        await page.click('[data-testid="confirm-delete-button"]');
        await expect(page.locator('[data-testid="notification-item"]')).not.toBeVisible();
    });

    test('Mobile responsive design', async ({ page }) => {
        // Set mobile viewport
        await page.setViewportSize({ width: 375, height: 667 });

        // 1. Check mobile navigation
        await page.goto('http://localhost:3000');
        await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();

        // 2. Open mobile menu
        await page.click('[data-testid="mobile-menu-button"]');
        await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();

        // 3. Navigate using mobile menu
        await page.click('[data-testid="mobile-home-link"]');
        await expect(page).toHaveURL(/.*\/$/);

        // 4. Test mobile post creation
        await page.click('[data-testid="mobile-create-post-button"]');
        await expect(page).toHaveURL(/.*\/posts\/new/);

        // 5. Check mobile form layout
        await expect(page.locator('[data-testid="post-title-input"]')).toBeVisible();
        await expect(page.locator('[data-testid="post-content-textarea"]')).toBeVisible();

        // 6. Test mobile search
        await page.fill('[data-testid="mobile-search-input"]', 'test');
        await page.click('[data-testid="mobile-search-button"]');
        await expect(page).toHaveURL(/.*\/search/);
    });

    test('Error handling and edge cases', async ({ page }) => {
        // 1. Test 404 page
        await page.goto('http://localhost:3000/non-existent-page');
        await expect(page.locator('[data-testid="404-title"]')).toContainText('페이지를 찾을 수 없습니다');

        // 2. Test network error handling
        await page.route('**/api/posts', route => route.abort());
        await page.goto('http://localhost:3000/posts');
        await expect(page.locator('[data-testid="error-message"]')).toContainText('네트워크 오류');

        // 3. Test form validation
        await page.goto('http://localhost:3000/register');
        await page.click('[data-testid="register-button"]');
        await expect(page.locator('[data-testid="validation-error"]')).toBeVisible();

        // 4. Test unauthorized access
        await page.goto('http://localhost:3000/admin');
        await expect(page.locator('[data-testid="unauthorized-message"]')).toContainText('접근 권한이 없습니다');
    });

    test('Performance and accessibility', async ({ page }) => {
        // 1. Check page load time
        const startTime = Date.now();
        await page.goto('http://localhost:3000');
        const loadTime = Date.now() - startTime;
        expect(loadTime).toBeLessThan(3000); // Should load within 3 seconds

        // 2. Check keyboard navigation
        await page.keyboard.press('Tab');
        await expect(page.locator(':focus')).toBeVisible();

        // 3. Check ARIA labels
        await expect(page.locator('[data-testid="search-input"]')).toHaveAttribute('aria-label');

        // 4. Check color contrast (basic check)
        const searchInput = page.locator('[data-testid="search-input"]');
        const backgroundColor = await searchInput.evaluate(el =>
            window.getComputedStyle(el).backgroundColor
        );
        const color = await searchInput.evaluate(el =>
            window.getComputedStyle(el).color
        );
        // This is a basic check - in a real test, you'd use a proper contrast checking library
        expect(backgroundColor).toBeDefined();
        expect(color).toBeDefined();
    });
});
