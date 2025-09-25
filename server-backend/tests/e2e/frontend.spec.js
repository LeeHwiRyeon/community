import { test, expect } from '@playwright/test';

test.describe('Frontend Application', () => {
    test('should load the main page', async ({ page }) => {
        // Navigate to the frontend
        await page.goto('http://localhost:5173');

        // Check if the page loads without errors
        await expect(page).toHaveTitle(/Community/);

        // Check for basic elements
        const body = page.locator('body');
        await expect(body).toBeVisible();
    });

    test('should handle 404 for non-existent pages', async ({ page }) => {
        // Navigate to a non-existent page
        const response = await page.goto('http://localhost:5173/non-existent-page');

        // Should get a 404 response
        expect(response?.status()).toBe(404);
    });

    test('should serve static files', async ({ page }) => {
        // Test if static files are served correctly
        const response = await page.goto('http://localhost:5173/index.html');
        expect(response?.status()).toBe(200);
    });
});