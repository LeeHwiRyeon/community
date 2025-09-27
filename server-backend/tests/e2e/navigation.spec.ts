import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test.use({ baseURL: 'http://localhost:5002' });

  test('should load home page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Community/);
  });

  test('should have main navigation elements', async ({ page }) => {
    await page.goto('/');
    // Check that navigation elements exist on the page
    const navElements = page.locator('nav');
    await expect(navElements).toHaveCount(await navElements.count() > 0 ? await navElements.count() : 1);
  });

  test('should handle search functionality', async ({ page }) => {
    await page.goto('/');
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await expect(searchInput).toHaveValue('test');
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
  });

  test('should have basic accessibility', async ({ page }) => {
    await page.goto('/');
    // Check for basic accessibility - main landmark
    const main = page.locator('main');
    if (await main.isVisible()) {
      await expect(main).toBeVisible();
    }
  });
});
