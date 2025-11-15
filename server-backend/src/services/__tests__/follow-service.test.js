/**
 * Follow Service Unit Tests
 * 팔로우 서비스 단위 테스트
 */

const followService = require('../../src/services/follow-service');
const pool = require('../../src/database/database');

describe('Follow Service Unit Tests', () => {
    let testUserId1;
    let testUserId2;
    let testUserId3;

    // 테스트 전 설정
    beforeAll(async () => {
        // 테스트 사용자 생성
        const [user1Result] = await pool.query(
            'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
            ['followtest1', 'followtest1@example.com', 'password123']
        );
        testUserId1 = user1Result.insertId;

        const [user2Result] = await pool.query(
            'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
            ['followtest2', 'followtest2@example.com', 'password123']
        );
        testUserId2 = user2Result.insertId;

        const [user3Result] = await pool.query(
            'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
            ['followtest3', 'followtest3@example.com', 'password123']
        );
        testUserId3 = user3Result.insertId;
    });

    // 테스트 후 정리
    afterAll(async () => {
        await pool.query('DELETE FROM follows WHERE follower_id IN (?, ?, ?) OR following_id IN (?, ?, ?)',
            [testUserId1, testUserId2, testUserId3, testUserId1, testUserId2, testUserId3]);
        await pool.query('DELETE FROM users WHERE id IN (?, ?, ?)', [testUserId1, testUserId2, testUserId3]);
        await pool.end();
    });

    // 각 테스트 후 팔로우 데이터 정리
    afterEach(async () => {
        await pool.query('DELETE FROM follows WHERE follower_id IN (?, ?, ?) OR following_id IN (?, ?, ?)',
            [testUserId1, testUserId2, testUserId3, testUserId1, testUserId2, testUserId3]);
    });

    describe('followUser()', () => {
        test('should follow user successfully', async () => {
            const result = await followService.followUser(testUserId1, testUserId2);

            expect(result.success).toBe(true);
            expect(result.followId).toBeDefined();
            expect(result.followedUser).toBeDefined();
            expect(result.followedUser.id).toBe(testUserId2);
        });

        test('should throw error when following self', async () => {
            await expect(
                followService.followUser(testUserId1, testUserId1)
            ).rejects.toThrow('자기 자신을 팔로우할 수 없습니다');
        });

        test('should throw error on duplicate follow', async () => {
            // 첫 번째 팔로우
            await followService.followUser(testUserId1, testUserId2);

            // 중복 팔로우 시도
            await expect(
                followService.followUser(testUserId1, testUserId2)
            ).rejects.toThrow('이미 팔로우한 사용자입니다');
        });

        test('should throw error when following non-existent user', async () => {
            await expect(
                followService.followUser(testUserId1, 999999)
            ).rejects.toThrow('존재하지 않거나 삭제된 사용자입니다');
        });
    });

    describe('unfollowUser()', () => {
        test('should unfollow user successfully', async () => {
            // 먼저 팔로우
            await followService.followUser(testUserId1, testUserId2);

            // 언팔로우
            const result = await followService.unfollowUser(testUserId1, testUserId2);

            expect(result.success).toBe(true);
            expect(result.message).toContain('언팔로우');
        });

        test('should throw error when unfollowing non-followed user', async () => {
            await expect(
                followService.unfollowUser(testUserId1, testUserId2)
            ).rejects.toThrow('팔로우하지 않은 사용자입니다');
        });
    });

    describe('getFollowers()', () => {
        test('should return empty list when no followers', async () => {
            const result = await followService.getFollowers(testUserId1);

            expect(result.followers).toEqual([]);
            expect(result.total).toBe(0);
        });

        test('should return followers list', async () => {
            // testUserId2가 testUserId1을 팔로우
            await followService.followUser(testUserId2, testUserId1);

            const result = await followService.getFollowers(testUserId1, 10, 0);

            expect(result.followers.length).toBe(1);
            expect(result.followers[0].id).toBe(testUserId2);
            expect(result.total).toBe(1);
        });

        test('should support pagination', async () => {
            // 여러 사용자가 팔로우
            await followService.followUser(testUserId2, testUserId1);
            await followService.followUser(testUserId3, testUserId1);

            const result = await followService.getFollowers(testUserId1, 1, 0);

            expect(result.followers.length).toBe(1);
            expect(result.limit).toBe(1);
            expect(result.offset).toBe(0);
            expect(result.total).toBe(2);
        });
    });

    describe('getFollowing()', () => {
        test('should return empty list when not following anyone', async () => {
            const result = await followService.getFollowing(testUserId1);

            expect(result.following).toEqual([]);
            expect(result.total).toBe(0);
        });

        test('should return following list', async () => {
            // testUserId1이 testUserId2를 팔로우
            await followService.followUser(testUserId1, testUserId2);

            const result = await followService.getFollowing(testUserId1, 10, 0);

            expect(result.following.length).toBe(1);
            expect(result.following[0].id).toBe(testUserId2);
            expect(result.total).toBe(1);
        });
    });

    describe('checkFollowStatus()', () => {
        test('should return false when not following', async () => {
            const result = await followService.checkFollowStatus(testUserId1, testUserId2);

            expect(result.isFollowing).toBe(false);
            expect(result.isFollowingBack).toBe(false);
            expect(result.isMutualFollow).toBe(false);
        });

        test('should detect one-way follow', async () => {
            await followService.followUser(testUserId1, testUserId2);

            const result = await followService.checkFollowStatus(testUserId1, testUserId2);

            expect(result.isFollowing).toBe(true);
            expect(result.isFollowingBack).toBe(false);
            expect(result.isMutualFollow).toBe(false);
        });

        test('should detect reverse follow', async () => {
            await followService.followUser(testUserId2, testUserId1);

            const result = await followService.checkFollowStatus(testUserId1, testUserId2);

            expect(result.isFollowing).toBe(false);
            expect(result.isFollowingBack).toBe(true);
            expect(result.isMutualFollow).toBe(false);
        });

        test('should detect mutual follow', async () => {
            await followService.followUser(testUserId1, testUserId2);
            await followService.followUser(testUserId2, testUserId1);

            const result = await followService.checkFollowStatus(testUserId1, testUserId2);

            expect(result.isFollowing).toBe(true);
            expect(result.isFollowingBack).toBe(true);
            expect(result.isMutualFollow).toBe(true);
        });
    });

    describe('getFollowStats()', () => {
        test('should return zero stats when no follows', async () => {
            const result = await followService.getFollowStats(testUserId1);

            expect(result.followers_count).toBe(0);
            expect(result.following_count).toBe(0);
        });

        test('should return correct follower count', async () => {
            await followService.followUser(testUserId2, testUserId1);
            await followService.followUser(testUserId3, testUserId1);

            const result = await followService.getFollowStats(testUserId1);

            expect(result.followers_count).toBe(2);
            expect(result.following_count).toBe(0);
        });

        test('should return correct following count', async () => {
            await followService.followUser(testUserId1, testUserId2);
            await followService.followUser(testUserId1, testUserId3);

            const result = await followService.getFollowStats(testUserId1);

            expect(result.followers_count).toBe(0);
            expect(result.following_count).toBe(2);
        });
    });

    describe('getFollowSuggestions()', () => {
        test('should return user suggestions', async () => {
            const result = await followService.getFollowSuggestions(testUserId1, 5);

            expect(Array.isArray(result.suggestions)).toBe(true);
            expect(result.suggestions.length).toBeGreaterThanOrEqual(0);
        });

        test('should exclude already followed users', async () => {
            await followService.followUser(testUserId1, testUserId2);

            const result = await followService.getFollowSuggestions(testUserId1, 5);

            const suggestedIds = result.suggestions.map(u => u.id);
            expect(suggestedIds).not.toContain(testUserId2);
        });

        test('should exclude self from suggestions', async () => {
            const result = await followService.getFollowSuggestions(testUserId1, 5);

            const suggestedIds = result.suggestions.map(u => u.id);
            expect(suggestedIds).not.toContain(testUserId1);
        });
    });

    describe('getRecentFollowers()', () => {
        test('should return recent followers', async () => {
            await followService.followUser(testUserId2, testUserId1);
            await followService.followUser(testUserId3, testUserId1);

            const result = await followService.getRecentFollowers(testUserId1, 5);

            expect(result.followers.length).toBe(2);
            expect(result.followers[0].id).toBe(testUserId3); // 최근 팔로워가 먼저
        });

        test('should respect limit parameter', async () => {
            await followService.followUser(testUserId2, testUserId1);
            await followService.followUser(testUserId3, testUserId1);

            const result = await followService.getRecentFollowers(testUserId1, 1);

            expect(result.followers.length).toBe(1);
        });
    });
});
