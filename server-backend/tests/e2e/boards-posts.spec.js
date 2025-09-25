import { test, expect } from '@playwright/test';

test.describe('Board and Post Interactions', () => {
    test('should display boards on frontend', async ({ page }) => {
        await page.goto('http://localhost:5173');

        // Look for board navigation or links
        const boardLinks = page.locator('a[href*="/boards"], nav a');
        await expect(boardLinks.first()).toBeVisible();
    });

    test('should navigate to board pages', async ({ page }) => {
        // First get available boards from API
        const apiResponse = await page.request.get('/api/boards');
        const boards = await apiResponse.json();

        if (boards.length > 0) {
            const firstBoard = boards[0];

            // Navigate to board page
            await page.goto(`http://localhost:5173/boards/${firstBoard.id}`);

            // Check if board content loads
            const boardTitle = page.locator('h1, .board-title');
            await expect(boardTitle).toBeVisible();
        }
    });

    test('should display posts in board', async ({ page }) => {
        // Get posts from API first
        const apiResponse = await page.request.get('/api/posts?page=1&limit=5');
        const data = await apiResponse.json();

        if (data.posts && data.posts.length > 0) {
            const firstPost = data.posts[0];

            // Navigate to post page
            await page.goto(`http://localhost:5173/posts/${firstPost.id}`);

            // Check if post content loads
            const postTitle = page.locator('h1, .post-title');
            const postContent = page.locator('.post-content, article');

            await expect(postTitle.or(postContent).first()).toBeVisible();
        }
    });

    test('should handle post search', async ({ page }) => {
        await page.goto('http://localhost:5173');

        // Look for search input
        const searchInput = page.locator('input[type="search"], input[placeholder*="검색"]');
        if (await searchInput.isVisible()) {
            await searchInput.fill('test');
            await searchInput.press('Enter');

            // Check if search results appear
            const searchResults = page.locator('.search-results, .posts-list');
            await expect(searchResults).toBeVisible();
        }
    });

    test('should handle pagination', async ({ page }) => {
        await page.goto('http://localhost:5173/posts');

        // Look for pagination controls
        const pagination = page.locator('.pagination, nav[aria-label*="페이지"]');
        if (await pagination.isVisible()) {
            // Check if pagination buttons exist
            const pageButtons = pagination.locator('button, a');
            await expect(pageButtons.first()).toBeVisible();
        }
    });
});