/**
 * Block Service Unit Tests
 * 차단 서비스 단위 테스트
 */

const blockService = require('../../src/services/block-service');
const pool = require('../../src/database/database');

describe('Block Service Unit Tests', () => {
    let testUserId1;
    let testUserId2;
    let blockId;

    // 테스트 전 설정
    beforeAll(async () => {
        // 테스트 사용자 생성
        const [user1Result] = await pool.query(
            'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
            ['blocktest1', 'blocktest1@example.com', 'password123']
        );
        testUserId1 = user1Result.insertId;

        const [user2Result] = await pool.query(
            'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
            ['blocktest2', 'blocktest2@example.com', 'password123']
        );
        testUserId2 = user2Result.insertId;
    });

    // 테스트 후 정리
    afterAll(async () => {
        await pool.query('DELETE FROM blocked_users WHERE blocker_id = ? OR blocked_id = ?', [testUserId1, testUserId2]);
        await pool.query('DELETE FROM users WHERE id IN (?, ?)', [testUserId1, testUserId2]);
        await pool.end();
    });

    // 각 테스트 후 차단 데이터 정리
    afterEach(async () => {
        await pool.query('DELETE FROM blocked_users WHERE blocker_id = ? OR blocked_id = ?', [testUserId1, testUserId2]);
    });

    describe('blockUser()', () => {
        test('should block user successfully', async () => {
            const result = await blockService.blockUser(testUserId1, testUserId2, 'Test reason');

            expect(result.success).toBe(true);
            expect(result.blockId).toBeDefined();
            expect(result.blockedUser).toBeDefined();
            expect(result.blockedUser.id).toBe(testUserId2);
            expect(result.message).toContain('차단');

            blockId = result.blockId;
        });

        test('should block user without reason', async () => {
            const result = await blockService.blockUser(testUserId1, testUserId2);

            expect(result.success).toBe(true);
            expect(result.blockId).toBeDefined();
        });

        test('should throw error when blocking self', async () => {
            await expect(
                blockService.blockUser(testUserId1, testUserId1)
            ).rejects.toThrow('자기 자신을 차단할 수 없습니다');
        });

        test('should throw error on duplicate block', async () => {
            // 첫 번째 차단
            await blockService.blockUser(testUserId1, testUserId2);

            // 중복 차단 시도
            await expect(
                blockService.blockUser(testUserId1, testUserId2)
            ).rejects.toThrow('이미 차단한 사용자입니다');
        });

        test('should throw error when blocking non-existent user', async () => {
            await expect(
                blockService.blockUser(testUserId1, 999999)
            ).rejects.toThrow('존재하지 않거나 삭제된 사용자입니다');
        });
    });

    describe('unblockUser()', () => {
        test('should unblock user successfully', async () => {
            // 먼저 차단
            await blockService.blockUser(testUserId1, testUserId2);

            // 차단 해제
            const result = await blockService.unblockUser(testUserId1, testUserId2);

            expect(result.success).toBe(true);
            expect(result.message).toContain('차단 해제');
        });

        test('should throw error when unblocking non-blocked user', async () => {
            await expect(
                blockService.unblockUser(testUserId1, testUserId2)
            ).rejects.toThrow('차단하지 않은 사용자입니다');
        });
    });

    describe('getBlockedUsers()', () => {
        test('should return empty list when no blocks', async () => {
            const result = await blockService.getBlockedUsers(testUserId1);

            expect(result.blocked).toEqual([]);
            expect(result.total).toBe(0);
            expect(result.hasMore).toBe(false);
        });

        test('should return blocked users list', async () => {
            // 차단 추가
            await blockService.blockUser(testUserId1, testUserId2, 'Test reason');

            const result = await blockService.getBlockedUsers(testUserId1, 10, 0);

            expect(result.blocked.length).toBe(1);
            expect(result.blocked[0].blocked_id).toBe(testUserId2);
            expect(result.blocked[0].reason).toBe('Test reason');
            expect(result.total).toBe(1);
        });

        test('should support pagination', async () => {
            // 여러 사용자 차단 (실제로는 1명만 테스트)
            await blockService.blockUser(testUserId1, testUserId2);

            const result = await blockService.getBlockedUsers(testUserId1, 1, 0);

            expect(result.limit).toBe(1);
            expect(result.offset).toBe(0);
        });
    });

    describe('isBlocked()', () => {
        test('should return false when not blocked', async () => {
            const result = await blockService.isBlocked(testUserId1, testUserId2);

            expect(result).toBe(false);
        });

        test('should return true when blocked', async () => {
            await blockService.blockUser(testUserId1, testUserId2);

            const result = await blockService.isBlocked(testUserId1, testUserId2);

            expect(result).toBe(true);
        });
    });

    describe('checkBlockStatus()', () => {
        test('should return no blocks when users not blocked', async () => {
            const result = await blockService.checkBlockStatus(testUserId1, testUserId2);

            expect(result.isBlocked).toBe(false);
            expect(result.iBlockedThem).toBe(false);
            expect(result.theyBlockedMe).toBe(false);
        });

        test('should detect one-way block', async () => {
            await blockService.blockUser(testUserId1, testUserId2);

            const result = await blockService.checkBlockStatus(testUserId1, testUserId2);

            expect(result.isBlocked).toBe(true);
            expect(result.iBlockedThem).toBe(true);
            expect(result.theyBlockedMe).toBe(false);
        });

        test('should detect reverse block', async () => {
            await blockService.blockUser(testUserId2, testUserId1);

            const result = await blockService.checkBlockStatus(testUserId1, testUserId2);

            expect(result.isBlocked).toBe(true);
            expect(result.iBlockedThem).toBe(false);
            expect(result.theyBlockedMe).toBe(true);
        });

        test('should detect mutual blocks', async () => {
            await blockService.blockUser(testUserId1, testUserId2);
            await blockService.blockUser(testUserId2, testUserId1);

            const result = await blockService.checkBlockStatus(testUserId1, testUserId2);

            expect(result.isBlocked).toBe(true);
            expect(result.iBlockedThem).toBe(true);
            expect(result.theyBlockedMe).toBe(true);
        });
    });

    describe('getBlockStats()', () => {
        test('should return zero stats when no blocks', async () => {
            const result = await blockService.getBlockStats(testUserId1);

            expect(result.blocked_count).toBe(0);
            expect(result.blocked_by_count).toBe(0);
        });

        test('should return correct blocked count', async () => {
            await blockService.blockUser(testUserId1, testUserId2);

            const result = await blockService.getBlockStats(testUserId1);

            expect(result.blocked_count).toBe(1);
            expect(result.blocked_by_count).toBe(0);
        });

        test('should return correct blocked_by count', async () => {
            await blockService.blockUser(testUserId2, testUserId1);

            const result = await blockService.getBlockStats(testUserId1);

            expect(result.blocked_count).toBe(0);
            expect(result.blocked_by_count).toBe(1);
        });
    });

    describe('getBlockedUserIds()', () => {
        test('should return empty array when no blocks', async () => {
            const result = await blockService.getBlockedUserIds(testUserId1);

            expect(result).toEqual([]);
        });

        test('should return array of blocked user IDs', async () => {
            await blockService.blockUser(testUserId1, testUserId2);

            const result = await blockService.getBlockedUserIds(testUserId1);

            expect(result).toContain(testUserId2);
            expect(result.length).toBe(1);
        });
    });

    describe('getBlockers()', () => {
        test('should return users who blocked me', async () => {
            await blockService.blockUser(testUserId2, testUserId1);

            const result = await blockService.getBlockers(testUserId1, 10, 0);

            expect(result.blockers.length).toBe(1);
            expect(result.blockers[0].blocker_id).toBe(testUserId2);
            expect(result.total).toBe(1);
        });

        test('should return empty list when no blockers', async () => {
            const result = await blockService.getBlockers(testUserId1);

            expect(result.blockers).toEqual([]);
            expect(result.total).toBe(0);
        });
    });
});
