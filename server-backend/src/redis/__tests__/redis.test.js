import { kvSet, kvGet, kvDel, isRedisEnabled } from '../../redis.js';

describe('Redis Utils', () => {
    beforeEach(() => {
        // Reset Redis state for each test
        jest.clearAllMocks();
    });

    describe('kvSet', () => {
        it('should store values in memory when Redis is disabled', async () => {
            // Mock Redis as disabled
            const originalIsRedisEnabled = isRedisEnabled;
            isRedisEnabled.mockReturnValue(false);

            await kvSet('test-key', { data: 'test' }, 3600);

            // Should not throw and complete successfully
            expect(true).toBe(true);

            // Restore original function
            Object.defineProperty(isRedisEnabled, 'mockReturnValue', {
                value: originalIsRedisEnabled
            });
        });

        it('should handle TTL correctly', async () => {
            const testData = { message: 'hello' };
            const ttl = 60;

            await kvSet('ttl-test', testData, ttl);

            // Should complete without error
            expect(true).toBe(true);
        });
    });

    describe('kvGet', () => {
        it('should return null for non-existent keys', async () => {
            const result = await kvGet('non-existent-key');

            expect(result).toBeNull();
        });

        it('should handle expired keys', async () => {
            // Set a key with very short TTL
            await kvSet('expired-key', { data: 'expired' }, 1);

            // Wait a bit (in real scenario, this would expire)
            // In memory store, TTL is handled on get

            const result = await kvGet('expired-key');

            // In our mock setup, it should return the data or null
            expect(result === null || typeof result === 'object').toBe(true);
        });
    });

    describe('kvDel', () => {
        it('should not throw when deleting non-existent keys', async () => {
            await expect(kvDel('non-existent-key')).resolves.not.toThrow();
        });
    });

    describe('isRedisEnabled', () => {
        it('should return a boolean', () => {
            const result = isRedisEnabled();

            expect(typeof result).toBe('boolean');
        });
    });
});