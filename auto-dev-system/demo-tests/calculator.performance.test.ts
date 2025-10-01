import { test, expect } from '@playwright/test';

test.describe('Calculator Performance Tests', () => {
  test('should perform calculations within acceptable time', async ({ page }) => {
    await page.goto('/calculator');
    
    const startTime = Date.now();
    
    // Perform multiple calculations
    for (let i = 0; i < 1000; i++) {
      await page.fill('[data-testid="input-a"]', i.toString());
      await page.fill('[data-testid="input-b"]', (i + 1).toString());
      await page.click('[data-testid="add-button"]');
    }
    
    const endTime = Date.now();
    const executionTime = endTime - startTime;
    
    // Should complete within 5 seconds
    expect(executionTime).toBeLessThan(5000);
  });

  test('should handle concurrent calculations', async ({ browser }) => {
    const contexts = await Promise.all([
      browser.newContext(),
      browser.newContext(),
      browser.newContext()
    ]);
    
    const pages = await Promise.all(contexts.map(ctx => ctx.newPage()));
    
    const startTime = Date.now();
    
    // Perform calculations concurrently
    await Promise.all(pages.map(async (page, index) => {
      await page.goto('/calculator');
      await page.fill('[data-testid="input-a"]', (index * 100).toString());
      await page.fill('[data-testid="input-b"]', '50');
      await page.click('[data-testid="add-button"]');
    }));
    
    const endTime = Date.now();
    const executionTime = endTime - startTime;
    
    // Should complete within 3 seconds
    expect(executionTime).toBeLessThan(3000);
    
    // Cleanup
    await Promise.all(contexts.map(ctx => ctx.close()));
  });
});
