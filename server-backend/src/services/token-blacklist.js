/**
 * Token Blacklist Service
 * 
 * Manages blacklisted JWT tokens (both access and refresh tokens).
 * Supports both Redis (preferred) and in-memory fallback.
 * 
 * Use cases:
 * - User logout (blacklist both access and refresh tokens)
 * - Security incident (force logout specific user)
 * - Token revocation after password change
 */

import { isRedisEnabled, getRedisClient } from '../redis.js';

// In-memory fallback when Redis is not available
const inMemoryBlacklist = new Map(); // Key: 'access:{jti}' or 'refresh:{jti}', Value: { userId, reason, exp }

/**
 * Add Access Token to blacklist
 * 
 * @param {string} jti - JWT ID (unique token identifier)
 * @param {string} userId - User ID who owns the token
 * @param {string} reason - Reason for blacklisting (e.g., 'logout', 'security_event')
 * @param {number} ttlSec - Time to live in seconds (should match token expiration)
 */
export async function blacklistAccessToken(jti, userId, reason = 'logout', ttlSec = 900) {
    const data = {
        userId,
        reason,
        exp: Math.floor(Date.now() / 1000) + ttlSec,
        blacklistedAt: new Date().toISOString()
    };

    if (isRedisEnabled()) {
        const redis = getRedisClient();
        const key = `blacklist:access:${jti}`;

        try {
            await redis.setex(key, ttlSec, JSON.stringify(data));
            console.log(`✅ Access token blacklisted (Redis): ${jti} - Reason: ${reason}`);
        } catch (error) {
            console.error(`❌ Failed to blacklist access token in Redis: ${error.message}`);
            // Fallback to in-memory
            inMemoryBlacklist.set(`access:${jti}`, data);
            setTimeout(() => {
                inMemoryBlacklist.delete(`access:${jti}`);
            }, ttlSec * 1000);
        }
    } else {
        // Use in-memory storage
        inMemoryBlacklist.set(`access:${jti}`, data);

        // TTL emulation: delete after expiration
        setTimeout(() => {
            inMemoryBlacklist.delete(`access:${jti}`);
        }, ttlSec * 1000);

        console.log(`✅ Access token blacklisted (In-memory): ${jti} - Reason: ${reason}`);
    }
}

/**
 * Add Refresh Token to blacklist
 * 
 * @param {string} jti - JWT ID (unique token identifier)
 * @param {string} userId - User ID who owns the token
 * @param {string} reason - Reason for blacklisting
 * @param {number} ttlSec - Time to live in seconds (default: 14 days)
 */
export async function blacklistRefreshToken(jti, userId, reason = 'logout', ttlSec = 1209600) {
    const data = {
        userId,
        reason,
        exp: Math.floor(Date.now() / 1000) + ttlSec,
        blacklistedAt: new Date().toISOString()
    };

    if (isRedisEnabled()) {
        const redis = getRedisClient();
        const key = `blacklist:refresh:${jti}`;

        try {
            await redis.setex(key, ttlSec, JSON.stringify(data));
            console.log(`✅ Refresh token blacklisted (Redis): ${jti} - Reason: ${reason}`);
        } catch (error) {
            console.error(`❌ Failed to blacklist refresh token in Redis: ${error.message}`);
            // Fallback to in-memory
            inMemoryBlacklist.set(`refresh:${jti}`, data);
            setTimeout(() => {
                inMemoryBlacklist.delete(`refresh:${jti}`);
            }, ttlSec * 1000);
        }
    } else {
        // Use in-memory storage
        inMemoryBlacklist.set(`refresh:${jti}`, data);

        // TTL emulation
        setTimeout(() => {
            inMemoryBlacklist.delete(`refresh:${jti}`);
        }, ttlSec * 1000);

        console.log(`✅ Refresh token blacklisted (In-memory): ${jti} - Reason: ${reason}`);
    }
}

/**
 * Check if Access Token is blacklisted
 * 
 * @param {string} jti - JWT ID to check
 * @returns {Promise<boolean>} - True if blacklisted
 */
export async function isAccessTokenBlacklisted(jti) {
    if (!jti) return false;

    if (isRedisEnabled()) {
        const redis = getRedisClient();
        const key = `blacklist:access:${jti}`;

        try {
            const data = await redis.get(key);
            return !!data;
        } catch (error) {
            console.error(`❌ Failed to check access token blacklist in Redis: ${error.message}`);
            // Fallback to in-memory
            const data = inMemoryBlacklist.get(`access:${jti}`);
            if (!data) return false;

            // Check expiration
            const now = Math.floor(Date.now() / 1000);
            if (now >= data.exp) {
                inMemoryBlacklist.delete(`access:${jti}`);
                return false;
            }

            return true;
        }
    } else {
        // Check in-memory storage
        const data = inMemoryBlacklist.get(`access:${jti}`);
        if (!data) return false;

        // Check expiration
        const now = Math.floor(Date.now() / 1000);
        if (now >= data.exp) {
            inMemoryBlacklist.delete(`access:${jti}`);
            return false;
        }

        return true;
    }
}

/**
 * Check if Refresh Token is blacklisted
 * 
 * @param {string} jti - JWT ID to check
 * @returns {Promise<boolean>} - True if blacklisted
 */
export async function isRefreshTokenBlacklisted(jti) {
    if (!jti) return false;

    if (isRedisEnabled()) {
        const redis = getRedisClient();
        const key = `blacklist:refresh:${jti}`;

        try {
            const data = await redis.get(key);
            return !!data;
        } catch (error) {
            console.error(`❌ Failed to check refresh token blacklist in Redis: ${error.message}`);
            // Fallback to in-memory
            const data = inMemoryBlacklist.get(`refresh:${jti}`);
            if (!data) return false;

            const now = Math.floor(Date.now() / 1000);
            if (now >= data.exp) {
                inMemoryBlacklist.delete(`refresh:${jti}`);
                return false;
            }

            return true;
        }
    } else {
        // Check in-memory storage
        const data = inMemoryBlacklist.get(`refresh:${jti}`);
        if (!data) return false;

        const now = Math.floor(Date.now() / 1000);
        if (now >= data.exp) {
            inMemoryBlacklist.delete(`refresh:${jti}`);
            return false;
        }

        return true;
    }
}

/**
 * Get blacklist information for a token
 * 
 * @param {string} jti - JWT ID
 * @param {string} type - Token type ('access' or 'refresh')
 * @returns {Promise<Object|null>} - Blacklist data or null
 */
export async function getBlacklistInfo(jti, type = 'access') {
    if (!jti) return null;

    if (isRedisEnabled()) {
        const redis = getRedisClient();
        const key = `blacklist:${type}:${jti}`;

        try {
            const data = await redis.get(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error(`❌ Failed to get blacklist info from Redis: ${error.message}`);
            const data = inMemoryBlacklist.get(`${type}:${jti}`);
            return data || null;
        }
    } else {
        const data = inMemoryBlacklist.get(`${type}:${jti}`);
        return data || null;
    }
}

/**
 * Blacklist all tokens for a specific user (security event)
 * 
 * Note: This requires tracking active user sessions separately.
 * For now, this is a placeholder that logs the event.
 * 
 * @param {string} userId - User ID
 * @param {string} reason - Reason for blacklisting all tokens
 */
export async function blacklistAllUserTokens(userId, reason = 'security_event') {
    console.warn(`⚠️  Blacklisting all tokens for user ${userId}: ${reason}`);
    console.warn(`⚠️  Note: This requires session tracking to be fully implemented`);

    // TODO: Implement user session tracking
    // For now, we'll just log the event
    // In a full implementation:
    // 1. Query Redis/DB for all active sessions for this user
    // 2. Blacklist each token found
    // 3. Clear user's refresh token store

    if (isRedisEnabled()) {
        const redis = getRedisClient();
        // Store a marker that all tokens for this user should be rejected
        // This can be checked in the auth middleware
        const key = `blacklist:user:${userId}`;
        const data = {
            userId,
            reason,
            blacklistedAt: new Date().toISOString()
        };

        try {
            // Set with 14 days TTL (max refresh token lifetime)
            await redis.setex(key, 1209600, JSON.stringify(data));
            console.log(`✅ User ${userId} marked for full token blacklist`);
        } catch (error) {
            console.error(`❌ Failed to blacklist user tokens: ${error.message}`);
        }
    }

    return {
        success: true,
        userId,
        reason,
        note: 'Session tracking not yet fully implemented'
    };
}

/**
 * Check if all tokens for a user are blacklisted
 * 
 * @param {string} userId - User ID to check
 * @returns {Promise<boolean>} - True if user is fully blacklisted
 */
export async function isUserBlacklisted(userId) {
    if (!userId) return false;

    if (isRedisEnabled()) {
        const redis = getRedisClient();
        const key = `blacklist:user:${userId}`;

        try {
            const data = await redis.get(key);
            return !!data;
        } catch (error) {
            console.error(`❌ Failed to check user blacklist: ${error.message}`);
            return false;
        }
    }

    return false;
}

/**
 * Get blacklist statistics
 * 
 * @returns {Promise<Object>} - Blacklist statistics
 */
export async function getBlacklistStats() {
    const stats = {
        inMemory: {
            total: inMemoryBlacklist.size,
            access: 0,
            refresh: 0
        },
        redis: {
            available: isRedisEnabled(),
            total: 0
        }
    };

    // Count in-memory entries
    for (const key of inMemoryBlacklist.keys()) {
        if (key.startsWith('access:')) {
            stats.inMemory.access++;
        } else if (key.startsWith('refresh:')) {
            stats.inMemory.refresh++;
        }
    }

    // Count Redis entries (if available)
    if (isRedisEnabled()) {
        const redis = getRedisClient();
        try {
            const accessKeys = await redis.keys('blacklist:access:*');
            const refreshKeys = await redis.keys('blacklist:refresh:*');
            stats.redis.total = accessKeys.length + refreshKeys.length;
            stats.redis.access = accessKeys.length;
            stats.redis.refresh = refreshKeys.length;
        } catch (error) {
            console.error(`❌ Failed to get Redis blacklist stats: ${error.message}`);
        }
    }

    return stats;
}

/**
 * Clear expired entries from in-memory blacklist (maintenance)
 * This is called automatically via setTimeout, but can be called manually
 */
export function cleanupExpiredBlacklist() {
    const now = Math.floor(Date.now() / 1000);
    let cleaned = 0;

    for (const [key, data] of inMemoryBlacklist.entries()) {
        if (now >= data.exp) {
            inMemoryBlacklist.delete(key);
            cleaned++;
        }
    }

    if (cleaned > 0) {
        console.log(`🧹 Cleaned up ${cleaned} expired blacklist entries from memory`);
    }

    return cleaned;
}

// Run cleanup every 5 minutes
setInterval(cleanupExpiredBlacklist, 5 * 60 * 1000);
