/**
 * Redis 연결 설정
 * 
 * @author AUTOAGENTS
 * @version 1.0.0
 * @created 2025-11-14
 */

import { createClient } from 'redis';

// Redis 클라이언트 설정
const redisClient = createClient({
    socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        // 재연결 전략
        reconnectStrategy: (retries) => {
            if (retries > 10) {
                console.error('❌ Redis 재연결 시도 초과');
                return new Error('Redis 재연결 실패');
            }
            console.log(`🔄 Redis 재연결 시도 ${retries}/10`);
            return retries * 100; // 재연결 대기 시간 (ms)
        }
    },
    password: process.env.REDIS_PASSWORD || undefined,
    database: parseInt(process.env.REDIS_DB || '0', 10)
});

// Redis 이벤트 핸들러
redisClient.on('connect', () => {
    console.log('🔗 Redis 연결 시도 중...');
});

redisClient.on('ready', () => {
    console.log('✅ Redis 연결 성공!');
});

redisClient.on('error', (err) => {
    console.error('❌ Redis 에러:', err.message);
});

redisClient.on('end', () => {
    console.log('🔌 Redis 연결 종료');
});

// Redis 연결 초기화
let isConnecting = false;

async function connectRedis() {
    if (isConnecting) {
        console.log('⏳ Redis 연결 중...');
        return;
    }

    try {
        isConnecting = true;
        await redisClient.connect();
        console.log('🎯 Redis 연결 완료');
    } catch (error) {
        console.error('💥 Redis 연결 실패:', error.message);
        throw error;
    } finally {
        isConnecting = false;
    }
}

// Graceful shutdown
async function disconnectRedis() {
    try {
        await redisClient.quit();
        console.log('👋 Redis 정상 종료');
    } catch (error) {
        console.error('❌ Redis 종료 실패:', error.message);
        await redisClient.disconnect();
    }
}

export { redisClient, connectRedis, disconnectRedis };
export default redisClient;
