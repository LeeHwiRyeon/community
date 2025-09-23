// redis.js - thin wrapper with graceful fallback to in-memory store
import { createClient } from 'redis';

let redisClient = null;
let memoryStore = new Map();
let redisEnabled = false;

export async function initRedis() {
    const url = process.env.REDIS_URL;
    if (!url) {
        console.log('[redis] REDIS_URL not set -> using in-memory fallback');
        return { enabled: false };
    }
    try {
        redisClient = createClient({ url });
        redisClient.on('error', err => { console.warn('[redis] error', err.message); });
        await redisClient.connect();
        redisEnabled = true;
        console.log('[redis] connected');
        return { enabled: true };
    } catch (e) {
        console.warn('[redis] connect failed -> fallback memory', e.message);
        redisClient = null; redisEnabled = false;
        return { enabled: false };
    }
}

export function isRedisEnabled() { return redisEnabled; }

// Generic helpers ---------------------------------
export async function kvSet(key, value, ttlSec) {
    if (redisEnabled) {
        if (ttlSec) await redisClient.set(key, JSON.stringify(value), { EX: ttlSec });
        else await redisClient.set(key, JSON.stringify(value));
    } else {
        memoryStore.set(key, { value, exp: ttlSec ? Date.now() + ttlSec * 1000 : null });
    }
}
export async function kvGet(key) {
    if (redisEnabled) {
        const v = await redisClient.get(key); return v ? JSON.parse(v) : null;
    } else {
        const rec = memoryStore.get(key);
        if (!rec) return null;
        if (rec.exp && rec.exp < Date.now()) { memoryStore.delete(key); return null; }
        return rec.value;
    }
}
export async function kvDel(key) {
    if (redisEnabled) { await redisClient.del(key); }
    else memoryStore.delete(key);
}
export async function kvScan(prefix) {
    if (redisEnabled) {
        const keys = [];
        for await (const k of redisClient.scanIterator({ MATCH: prefix + '*' })) keys.push(k);
        return keys;
    } else {
        return Array.from(memoryStore.keys()).filter(k => k.startsWith(prefix));
    }
}

// Specialized refresh token operations -------------
const REF_PREFIX = 'rt:'; // rt:<jti>
export async function storeRefresh(jti, payload, ttlSec) {
    await kvSet(REF_PREFIX + jti, payload, ttlSec);
}
export async function loadRefresh(jti) {
    return kvGet(REF_PREFIX + jti);
}
export async function deleteRefresh(jti) {
    return kvDel(REF_PREFIX + jti);
}
export async function purgeExpiredMemory() {
    if (redisEnabled) return 0;
    let removed = 0; const now = Date.now();
    for (const [k, v] of memoryStore.entries()) {
        if (v.exp && v.exp < now) { memoryStore.delete(k); removed++; }
    }
    if (removed) console.log('[redis-fallback] purged', removed);
    return removed;
}
setInterval(purgeExpiredMemory, 300000).unref();

// Client getter for direct access when needed
export function getRedisClient() { return redisClient; }

// Sorted Set operations for trending/ranking ------------------
export async function zIncrBy(key, member, increment) {
    if (redisEnabled) {
        return await redisClient.zIncrBy(key, increment, member);
    } else {
        // In-memory fallback for sorted set
        let zset = memoryStore.get(key);
        if (!zset || !zset.value || typeof zset.value !== 'object') {
            zset = { value: {}, exp: null };
            memoryStore.set(key, zset);
        }
        const current = zset.value[member] || 0;
        zset.value[member] = current + increment;
        return zset.value[member];
    }
}

export async function zRevRange(key, start, stop, withScores = false) {
    if (redisEnabled) {
        if (withScores) {
            return await redisClient.zRangeWithScores(key, start, stop, { REV: true });
        } else {
            return await redisClient.zRange(key, start, stop, { REV: true });
        }
    } else {
        // In-memory fallback
        const zset = memoryStore.get(key);
        if (!zset || !zset.value || typeof zset.value !== 'object') return [];

        const sorted = Object.entries(zset.value)
            .sort(([, a], [, b]) => b - a)  // descending by score
            .slice(start, stop + 1);

        if (withScores) {
            return sorted.map(([member, score]) => ({ value: member, score: score }));
        } else {
            return sorted.map(([member]) => member);
        }
    }
}

export async function zCard(key) {
    if (redisEnabled) {
        return await redisClient.zCard(key);
    } else {
        const zset = memoryStore.get(key);
        if (!zset || !zset.value || typeof zset.value !== 'object') return 0;
        return Object.keys(zset.value).length;
    }
}

// List operations for chat history ---------------------------
export async function lPush(key, ...values) {
    if (redisEnabled) {
        return await redisClient.lPush(key, values);
    } else {
        let list = memoryStore.get(key);
        if (!list || !Array.isArray(list.value)) {
            list = { value: [], exp: null };
            memoryStore.set(key, list);
        }
        list.value.unshift(...values);
        return list.value.length;
    }
}

export async function lRange(key, start, stop) {
    if (redisEnabled) {
        return await redisClient.lRange(key, start, stop);
    } else {
        const list = memoryStore.get(key);
        if (!list || !Array.isArray(list.value)) return [];
        return list.value.slice(start, stop === -1 ? undefined : stop + 1);
    }
}

export async function lTrim(key, start, stop) {
    if (redisEnabled) {
        return await redisClient.lTrim(key, start, stop);
    } else {
        const list = memoryStore.get(key);
        if (list && Array.isArray(list.value)) {
            list.value = list.value.slice(start, stop === -1 ? undefined : stop + 1);
        }
        return 'OK';
    }
}

// Pub/Sub operations for real-time chat ----------------------
export async function publish(channel, message) {
    if (redisEnabled) {
        return await redisClient.publish(channel, message);
    } else {
        // In-memory pub/sub simulation (limited to single process)
        const subscribers = memoryStore.get('__pubsub_' + channel);
        if (subscribers && Array.isArray(subscribers.value)) {
            subscribers.value.forEach(callback => {
                try { callback(message); } catch (e) { /* ignore */ }
            });
            return subscribers.value.length;
        }
        return 0;
    }
}

export function subscribe(channel, callback) {
    if (redisEnabled) {
        // For real Redis, this would need a separate subscriber client
        // This is a simplified implementation
        const subscriber = redisClient.duplicate();
        subscriber.connect();
        subscriber.subscribe(channel, callback);
        return subscriber;
    } else {
        // In-memory subscription
        let subscribers = memoryStore.get('__pubsub_' + channel);
        if (!subscribers || !Array.isArray(subscribers.value)) {
            subscribers = { value: [], exp: null };
            memoryStore.set('__pubsub_' + channel, subscribers);
        }
        subscribers.value.push(callback);
        return {
            unsubscribe: () => {
                const idx = subscribers.value.indexOf(callback);
                if (idx >= 0) subscribers.value.splice(idx, 1);
            }
        };
    }
}
