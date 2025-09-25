import request from 'supertest';
import { createApp } from '../../src/server.js';

describe('Health API', () => {
    let app;

    beforeAll(async () => {
        // Create app instance for testing
        app = createApp();
    });

    afterAll(async () => {
        // Clean up if needed
    });

    describe('GET /api/health', () => {
        it('should return basic health status', async () => {
            const response = await request(app)
                .get('/api/health')
                .expect(200);

            expect(response.body).toHaveProperty('ok', true);
            expect(response.body).toHaveProperty('ts');
            expect(typeof response.body.ts).toBe('number');
        });

        it('should return verbose health status when requested', async () => {
            const response = await request(app)
                .get('/api/health?verbose=1')
                .expect(200);

            expect(response.body).toHaveProperty('ok', true);
            expect(response.body).toHaveProperty('ts');
            expect(response.body).toHaveProperty('dbLatencyMs');
            expect(response.body).toHaveProperty('counts');
            expect(response.body.counts).toHaveProperty('boards');
            expect(response.body.counts).toHaveProperty('posts');
        });

        it('should have proper content type', async () => {
            const response = await request(app)
                .get('/api/health')
                .expect(200);

            expect(response.headers['content-type']).toMatch(/application\/json/);
        });
    });
});