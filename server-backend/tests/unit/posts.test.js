import request from 'supertest';
import { createApp } from '../../src/server.js';

describe('Posts API', () => {
    let app;

    beforeAll(async () => {
        app = createApp();
    });

    afterAll(async () => {
        // Clean up if needed
    });

    describe('GET /api/posts', () => {
        it('should return list of posts with pagination', async () => {
            const response = await request(app)
                .get('/api/posts?page=1&limit=10')
                .expect(200);

            expect(response.body).toHaveProperty('posts');
            expect(response.body).toHaveProperty('pagination');
            expect(Array.isArray(response.body.posts)).toBe(true);
            expect(response.body.pagination).toHaveProperty('page', 1);
            expect(response.body.pagination).toHaveProperty('limit', 10);
            expect(response.body.pagination).toHaveProperty('total');
        });

        it('should filter posts by board', async () => {
            const response = await request(app)
                .get('/api/posts?board=free&page=1&limit=5')
                .expect(200);

            expect(response.body.posts.length).toBeLessThanOrEqual(5);
            // All posts should be from the 'free' board
            response.body.posts.forEach(post => {
                expect(post.boardId).toBe('free');
            });
        });

        it('should search posts by query', async () => {
            const response = await request(app)
                .get('/api/posts?q=test&page=1&limit=10')
                .expect(200);

            expect(response.body).toHaveProperty('posts');
            expect(Array.isArray(response.body.posts)).toBe(true);
        });
    });

    describe('GET /api/posts/:id', () => {
        it('should return post details for valid id', async () => {
            // First get a post ID from the list
            const listResponse = await request(app)
                .get('/api/posts?page=1&limit=1')
                .expect(200);

            if (listResponse.body.posts.length > 0) {
                const postId = listResponse.body.posts[0].id;

                const response = await request(app)
                    .get(`/api/posts/${postId}`)
                    .expect(200);

                expect(response.body).toHaveProperty('id', postId);
                expect(response.body).toHaveProperty('title');
                expect(response.body).toHaveProperty('content');
                expect(response.body).toHaveProperty('author');
                expect(response.body).toHaveProperty('boardId');
                expect(response.body).toHaveProperty('createdAt');
            }
        });

        it('should return 404 for invalid post id', async () => {
            const response = await request(app)
                .get('/api/posts/999999')
                .expect(404);

            expect(response.body).toHaveProperty('error');
        });
    });
});