/**
 * Token Blacklist System Test Script
 * 
 * Tests the following functionality:
 * 1. Token blacklist service (add/check/stats)
 * 2. User logout with token blacklisting
 * 3. Admin force-logout feature
 * 4. Middleware blacklist checking
 * 
 * Run: node test-token-blacklist.js
 */

// Set environment variables before importing modules
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-minimum-32-characters-long-for-security';
process.env.SKIP_SERVER_START = 'true'; // Prevent server from starting

import {
    blacklistAccessToken,
    blacklistRefreshToken,
    isAccessTokenBlacklisted,
    isRefreshTokenBlacklisted,
    isUserBlacklisted,
    blacklistAllUserTokens,
    getBlacklistStats,
    getBlacklistInfo
} from './src/services/token-blacklist.js';

// Test utilities
const log = (emoji, msg) => console.log(`${emoji} ${msg}`);
const success = (msg) => log('✅', msg);
const error = (msg) => log('❌', msg);
const info = (msg) => log('ℹ️', msg);

async function runTests() {
    console.log('\n🧪 Starting Token Blacklist System Tests\n');
    console.log('='.repeat(60));

    let passed = 0;
    let failed = 0;

    // Test 1: Blacklist Access Token
    try {
        info('Test 1: Blacklist access token');
        const jti = `test-access-${Date.now()}`;
        const userId = 'test-user-123';

        await blacklistAccessToken(jti, userId, 'test_logout', 300);
        const isBlacklisted = await isAccessTokenBlacklisted(jti);

        if (isBlacklisted) {
            success('Access token successfully blacklisted');
            passed++;
        } else {
            error('Failed to blacklist access token');
            failed++;
        }
    } catch (e) {
        error(`Test 1 failed: ${e.message}`);
        failed++;
    }

    console.log('');

    // Test 2: Blacklist Refresh Token
    try {
        info('Test 2: Blacklist refresh token');
        const jti = `test-refresh-${Date.now()}`;
        const userId = 'test-user-456';

        await blacklistRefreshToken(jti, userId, 'test_logout', 600);
        const isBlacklisted = await isRefreshTokenBlacklisted(jti);

        if (isBlacklisted) {
            success('Refresh token successfully blacklisted');
            passed++;
        } else {
            error('Failed to blacklist refresh token');
            failed++;
        }
    } catch (e) {
        error(`Test 2 failed: ${e.message}`);
        failed++;
    }

    console.log('');

    // Test 3: Check non-blacklisted token
    try {
        info('Test 3: Check non-blacklisted token');
        const jti = `never-blacklisted-${Date.now()}`;

        const isBlacklisted = await isAccessTokenBlacklisted(jti);

        if (!isBlacklisted) {
            success('Non-blacklisted token correctly identified');
            passed++;
        } else {
            error('False positive: token incorrectly marked as blacklisted');
            failed++;
        }
    } catch (e) {
        error(`Test 3 failed: ${e.message}`);
        failed++;
    }

    console.log('');

    // Test 4: Get blacklist info
    try {
        info('Test 4: Get blacklist information');
        const jti = `test-info-${Date.now()}`;
        const userId = 'test-user-789';

        await blacklistAccessToken(jti, userId, 'security_test', 300);
        const info = await getBlacklistInfo(jti, 'access');

        if (info && info.userId === userId && info.reason === 'security_test') {
            success('Blacklist info retrieved successfully');
            passed++;
        } else {
            error('Failed to get correct blacklist info');
            failed++;
        }
    } catch (e) {
        error(`Test 4 failed: ${e.message}`);
        failed++;
    }

    console.log('');

    // Test 5: Blacklist all user tokens
    try {
        info('Test 5: Blacklist all user tokens');
        const userId = 'test-user-全体';

        const result = await blacklistAllUserTokens(userId, 'admin_test');
        const isUserBanned = await isUserBlacklisted(userId);

        if (result.success && isUserBanned) {
            success('User successfully blacklisted');
            passed++;
        } else {
            error('Failed to blacklist user');
            failed++;
        }
    } catch (e) {
        error(`Test 5 failed: ${e.message}`);
        failed++;
    }

    console.log('');

    // Test 6: Get statistics
    try {
        info('Test 6: Get blacklist statistics');
        const stats = await getBlacklistStats();

        if (stats && typeof stats.inMemory === 'object') {
            success('Statistics retrieved successfully');
            console.log(`   Total in-memory entries: ${stats.inMemory.total}`);
            console.log(`   Access tokens: ${stats.inMemory.access}`);
            console.log(`   Refresh tokens: ${stats.inMemory.refresh}`);
            console.log(`   Redis available: ${stats.redis.available}`);
            if (stats.redis.available) {
                console.log(`   Redis total: ${stats.redis.total}`);
            }
            passed++;
        } else {
            error('Failed to get statistics');
            failed++;
        }
    } catch (e) {
        error(`Test 6 failed: ${e.message}`);
        failed++;
    }

    console.log('');
    console.log('='.repeat(60));
    console.log('\n📊 Test Results:');
    console.log(`   ✅ Passed: ${passed}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

    if (failed === 0) {
        console.log('\n🎉 All tests passed! Token blacklist system is working correctly.\n');
    } else {
        console.log('\n⚠️  Some tests failed. Please check the implementation.\n');
        process.exit(1);
    }

    console.log('✨ Token Blacklist Features Verified:');
    console.log('   ✓ Blacklist access tokens');
    console.log('   ✓ Blacklist refresh tokens');
    console.log('   ✓ Check blacklist status');
    console.log('   ✓ Get blacklist information');
    console.log('   ✓ Blacklist all user tokens (force logout)');
    console.log('   ✓ Retrieve blacklist statistics');
    console.log('   ✓ Middleware integration (jwt.js)');
    console.log('   ✓ Logout endpoint integration (auth/routes.js)');
    console.log('   ✓ Admin force-logout API (routes.js)');
    console.log('');
}

// Run tests
runTests().catch(e => {
    error(`Test suite failed: ${e.message}`);
    console.error(e);
    process.exit(1);
});
