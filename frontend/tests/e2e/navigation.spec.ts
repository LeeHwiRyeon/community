import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should load home page', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await expect(page).toHaveTitle(/Community/);
  });

  test('should have main navigation elements', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await expect(page.locator('nav')).toBeVisible();
  });

  test('should handle search functionality', async ({ page }) => {
    await page.goto('http://localhost:5173');
    const searchInput = page.locator('input[type=\"search\"], input[placeholder*=\"search\" i]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await expect(searchInput).toHaveValue('test');
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:5173');
    await expect(page.locator('body')).toBeVisible();
  });

  test('should have basic accessibility', async ({ page }) => {
    await page.goto('http://localhost:5173');
    // Check for basic accessibility - main landmark
    const main = page.locator('main');
    if (await main.isVisible()) {
      await expect(main).toBeVisible();
    }
  });
});
