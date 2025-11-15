/**
 * Social Features Integration Tests
 * Follow, Mention, Share, Block 기능 API 테스트
 */

const request = require('supertest');
const app = require('../../app'); // Express app
const pool = require('../../src/database/database');

describe('Social Features API Integration Tests', () => {
    let authToken;
    let testUserId1;
    let testUserId2;
    let testPostId;

    // 테스트 전 설정
    beforeAll(async () => {
        // 테스트 사용자 생성
        const [user1Result] = await pool.query(
            'INSERT INTO users (username, email, password, display_name) VALUES (?, ?, ?, ?)',
            ['testuser1', 'test1@example.com', 'password123', 'Test User 1']
        );
        testUserId1 = user1Result.insertId;

        const [user2Result] = await pool.query(
            'INSERT INTO users (username, email, password, display_name) VALUES (?, ?, ?, ?)',
            ['testuser2', 'test2@example.com', 'password123', 'Test User 2']
        );
        testUserId2 = user2Result.insertId;

        // 테스트 게시물 생성
        const [postResult] = await pool.query(
            'INSERT INTO posts (user_id, title, content) VALUES (?, ?, ?)',
            [testUserId1, 'Test Post', 'Test Content']
        );
        testPostId = postResult.insertId;

        // 인증 토큰 생성 (실제 구현에 따라 수정 필요)
        const loginResponse = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'test1@example.com',
                password: 'password123'
            });

        authToken = loginResponse.body.token;
    });

    // 테스트 후 정리
    afterAll(async () => {
        // 테스트 데이터 정리
        await pool.query('DELETE FROM blocked_users WHERE blocker_id = ? OR blocked_id = ?', [testUserId1, testUserId2]);
        await pool.query('DELETE FROM post_shares WHERE user_id IN (?, ?)', [testUserId1, testUserId2]);
        await pool.query('DELETE FROM mentions WHERE mentioner_id IN (?, ?) OR mentioned_user_id IN (?, ?)', [testUserId1, testUserId2, testUserId1, testUserId2]);
        await pool.query('DELETE FROM follows WHERE follower_id IN (?, ?) OR following_id IN (?, ?)', [testUserId1, testUserId2, testUserId1, testUserId2]);
        await pool.query('DELETE FROM posts WHERE id = ?', [testPostId]);
        await pool.query('DELETE FROM users WHERE id IN (?, ?)', [testUserId1, testUserId2]);

        await pool.end();
    });

    // ============================================
    // Follow System Tests
    // ============================================
    describe('Follow System', () => {
        test('POST /api/social/follow/:userId - should follow user successfully', async () => {
            const response = await request(app)
                .post(`/api/social/follow/${testUserId2}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.followId).toBeDefined();
            expect(response.body.followedUser).toBeDefined();
            expect(response.body.followedUser.id).toBe(testUserId2);
        });

        test('POST /api/social/follow/:userId - should prevent duplicate follow', async () => {
            // 첫 번째 팔로우
            await request(app)
                .post(`/api/social/follow/${testUserId2}`)
                .set('Authorization', `Bearer ${authToken}`);

            // 중복 팔로우 시도
            const response = await request(app)
                .post(`/api/social/follow/${testUserId2}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(400);

            expect(response.body.error).toContain('이미 팔로우');
        });

        test('POST /api/social/follow/:userId - should prevent self-follow', async () => {
            const response = await request(app)
                .post(`/api/social/follow/${testUserId1}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(400);

            expect(response.body.error).toContain('자기 자신');
        });

        test('GET /api/social/follow/status/:userId - should check follow status', async () => {
            const response = await request(app)
                .get(`/api/social/follow/status/${testUserId2}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('isFollowing');
            expect(response.body).toHaveProperty('isFollowingBack');
            expect(response.body).toHaveProperty('isMutualFollow');
        });

        test('GET /api/social/followers/:userId - should get followers list', async () => {
            const response = await request(app)
                .get(`/api/social/followers/${testUserId2}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.followers).toBeDefined();
            expect(Array.isArray(response.body.followers)).toBe(true);
            expect(response.body.total).toBeGreaterThanOrEqual(0);
        });

        test('DELETE /api/social/follow/:userId - should unfollow user successfully', async () => {
            // 먼저 팔로우
            await request(app)
                .post(`/api/social/follow/${testUserId2}`)
                .set('Authorization', `Bearer ${authToken}`);

            // 언팔로우
            const response = await request(app)
                .delete(`/api/social/follow/${testUserId2}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
        });
    });

    // ============================================
    // Mention System Tests
    // ============================================
    describe('Mention System', () => {
        test('GET /api/social/mentions/search - should search usernames', async () => {
            const response = await request(app)
                .get('/api/social/mentions/search')
                .query({ q: 'test' })
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.users).toBeDefined();
            expect(Array.isArray(response.body.users)).toBe(true);
        });

        test('GET /api/social/mentions - should get user mentions', async () => {
            const response = await request(app)
                .get('/api/social/mentions')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.mentions).toBeDefined();
            expect(Array.isArray(response.body.mentions)).toBe(true);
            expect(response.body.total).toBeGreaterThanOrEqual(0);
        });

        test('GET /api/social/mentions/unread-count - should get unread count', async () => {
            const response = await request(app)
                .get('/api/social/mentions/unread-count')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.count).toBeGreaterThanOrEqual(0);
        });
    });

    // ============================================
    // Share System Tests
    // ============================================
    describe('Share System', () => {
        test('POST /api/social/share/:postId - should track share successfully', async () => {
            const response = await request(app)
                .post(`/api/social/share/${testPostId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ platform: 'twitter' })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.shareId).toBeDefined();
        });

        test('GET /api/social/share/stats/:postId - should get share statistics', async () => {
            const response = await request(app)
                .get(`/api/social/share/stats/${testPostId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.total_shares).toBeGreaterThanOrEqual(0);
            expect(response.body).toHaveProperty('twitter_shares');
            expect(response.body).toHaveProperty('facebook_shares');
            expect(response.body).toHaveProperty('linkedin_shares');
        });

        test('GET /api/social/share/trending - should get trending shares', async () => {
            const response = await request(app)
                .get('/api/social/share/trending')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.posts).toBeDefined();
            expect(Array.isArray(response.body.posts)).toBe(true);
        });

        test('GET /api/social/share/my-shares - should get user shares', async () => {
            const response = await request(app)
                .get('/api/social/share/my-shares')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.shares).toBeDefined();
            expect(Array.isArray(response.body.shares)).toBe(true);
        });
    });

    // ============================================
    // Block System Tests
    // ============================================
    describe('Block System', () => {
        test('POST /api/social/block/:userId - should block user successfully', async () => {
            const response = await request(app)
                .post(`/api/social/block/${testUserId2}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ reason: 'Spam' })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.blockId).toBeDefined();
            expect(response.body.blockedUser).toBeDefined();
        });

        test('POST /api/social/block/:userId - should prevent duplicate block', async () => {
            // 첫 번째 차단
            await request(app)
                .post(`/api/social/block/${testUserId2}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ reason: 'Spam' });

            // 중복 차단 시도
            const response = await request(app)
                .post(`/api/social/block/${testUserId2}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(400);

            expect(response.body.error).toContain('이미 차단');
        });

        test('POST /api/social/block/:userId - should prevent self-block', async () => {
            const response = await request(app)
                .post(`/api/social/block/${testUserId1}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(400);

            expect(response.body.error).toContain('자기 자신');
        });

        test('GET /api/social/block/status/:userId - should check block status', async () => {
            const response = await request(app)
                .get(`/api/social/block/status/${testUserId2}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('isBlocked');
            expect(response.body).toHaveProperty('iBlockedThem');
            expect(response.body).toHaveProperty('theyBlockedMe');
        });

        test('GET /api/social/blocked - should get blocked users list', async () => {
            const response = await request(app)
                .get('/api/social/blocked')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.blocked).toBeDefined();
            expect(Array.isArray(response.body.blocked)).toBe(true);
            expect(response.body.total).toBeGreaterThanOrEqual(0);
        });

        test('GET /api/social/block/stats - should get block statistics', async () => {
            const response = await request(app)
                .get('/api/social/block/stats')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.blocked_count).toBeGreaterThanOrEqual(0);
            expect(response.body.blocked_by_count).toBeGreaterThanOrEqual(0);
        });

        test('DELETE /api/social/block/:userId - should unblock user successfully', async () => {
            // 먼저 차단
            await request(app)
                .post(`/api/social/block/${testUserId2}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ reason: 'Test' });

            // 차단 해제
            const response = await request(app)
                .delete(`/api/social/block/${testUserId2}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
        });
    });

    // ============================================
    // Authentication Tests
    // ============================================
    describe('Authentication', () => {
        test('should reject requests without token', async () => {
            await request(app)
                .post(`/api/social/follow/${testUserId2}`)
                .expect(401);
        });

        test('should reject requests with invalid token', async () => {
            await request(app)
                .post(`/api/social/follow/${testUserId2}`)
                .set('Authorization', 'Bearer invalid_token')
                .expect(401);
        });
    });

    // ============================================
    // Validation Tests
    // ============================================
    describe('Input Validation', () => {
        test('should reject invalid user ID', async () => {
            await request(app)
                .post('/api/social/follow/invalid')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(400);
        });

        test('should reject non-existent user', async () => {
            await request(app)
                .post('/api/social/follow/999999')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(404);
        });

        test('should validate pagination parameters', async () => {
            const response = await request(app)
                .get('/api/social/blocked')
                .query({ limit: -1 })
                .set('Authorization', `Bearer ${authToken}`)
                .expect(400);

            expect(response.body.errors).toBeDefined();
        });
    });

    // ============================================
    // Edge Cases
    // ============================================
    describe('Edge Cases', () => {
        test('should handle large pagination offset', async () => {
            const response = await request(app)
                .get('/api/social/blocked')
                .query({ limit: 20, offset: 1000 })
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.blocked).toBeDefined();
        });

        test('should handle reason with max length', async () => {
            const longReason = 'A'.repeat(255);
            const response = await request(app)
                .post(`/api/social/block/${testUserId2}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ reason: longReason })
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        test('should reject reason exceeding max length', async () => {
            const tooLongReason = 'A'.repeat(256);
            await request(app)
                .post(`/api/social/block/${testUserId2}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ reason: tooLongReason })
                .expect(400);
        });
    });
});
