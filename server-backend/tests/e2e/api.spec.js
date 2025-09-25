import { test, expect } from '@playwright/test';

test.describe('API Endpoints', () => {
    test('should return health status', async ({ request }) => {
        const response = await request.get('/api/health');

        expect(response.status()).toBe(200);

        const data = await response.json();
        expect(data).toHaveProperty('ok', true);
        expect(data).toHaveProperty('ts');
        expect(typeof data.ts).toBe('number');
    });

    test('should return verbose health status', async ({ request }) => {
        const response = await request.get('/api/health?verbose=1');

        expect(response.status()).toBe(200);

        const data = await response.json();
        expect(data).toHaveProperty('ok', true);
        expect(data).toHaveProperty('ts');
        expect(data).toHaveProperty('dbLatencyMs');
        expect(data).toHaveProperty('counts');
    });

    test('should return boards list', async ({ request }) => {
        const response = await request.get('/api/boards');

        expect(response.status()).toBe(200);

        const data = await response.json();
        expect(Array.isArray(data)).toBe(true);
    });

    test('should return posts with pagination', async ({ request }) => {
        const response = await request.get('/api/posts?page=1&limit=10');

        expect(response.status()).toBe(200);

        const data = await response.json();
        expect(data).toHaveProperty('posts');
        expect(data).toHaveProperty('pagination');
        expect(Array.isArray(data.posts)).toBe(true);
        expect(data.pagination).toHaveProperty('page', 1);
        expect(data.pagination).toHaveProperty('limit', 10);
    });

    test('should handle invalid board requests', async ({ request }) => {
        const response = await request.get('/api/boards/nonexistent');

        expect(response.status()).toBe(404);

        const data = await response.json();
        expect(data).toHaveProperty('error');
    });

    test('should handle invalid post requests', async ({ request }) => {
        const response = await request.get('/api/posts/999999');

        expect(response.status()).toBe(404);

        const data = await response.json();
        expect(data).toHaveProperty('error');
    });
});