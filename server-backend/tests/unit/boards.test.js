import request from 'supertest';
import { createApp } from '../../src/server.js';

describe('Boards API', () => {
    let app;

    beforeAll(async () => {
        app = createApp();
    });

    afterAll(async () => {
        // Clean up if needed
    });

    describe('GET /api/boards', () => {
        it('should return list of boards', async () => {
            const response = await request(app)
                .get('/api/boards')
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeGreaterThan(0);

            // Check structure of first board
            const firstBoard = response.body[0];
            expect(firstBoard).toHaveProperty('id');
            expect(firstBoard).toHaveProperty('name');
            expect(firstBoard).toHaveProperty('description');
            expect(firstBoard).toHaveProperty('postCount');
            expect(typeof firstBoard.postCount).toBe('number');
        });

        it('should have proper content type', async () => {
            const response = await request(app)
                .get('/api/boards')
                .expect(200);

            expect(response.headers['content-type']).toMatch(/application\/json/);
        });
    });

    describe('GET /api/boards/:id', () => {
        it('should return board details for valid id', async () => {
            const response = await request(app)
                .get('/api/boards/free')
                .expect(200);

            expect(response.body).toHaveProperty('id', 'free');
            expect(response.body).toHaveProperty('name');
            expect(response.body).toHaveProperty('description');
            expect(response.body).toHaveProperty('posts');
            expect(Array.isArray(response.body.posts)).toBe(true);
        });

        it('should return 404 for invalid board id', async () => {
            const response = await request(app)
                .get('/api/boards/nonexistent')
                .expect(404);

            expect(response.body).toHaveProperty('error');
        });
    });
});