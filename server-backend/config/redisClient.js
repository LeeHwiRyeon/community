/**
 * Redis Client Configuration
 * 
 * Redis 연결 설정 및 클라이언트 관리
 * - 싱글톤 패턴으로 Redis 연결 관리
 * - 자동 재연결 및 에러 핸들링
 * - 개발/프로덕션 환경 설정 분리
 */

import { createClient } from 'redis';

class RedisClient {
    constructor() {
        this.client = null;
        this.isConnected = false;
    }

    /**
     * Redis 클라이언트 초기화 및 연결
     */
    async connect() {
        if (this.isConnected && this.client) {
            console.log('✅ Redis already connected');
            return this.client;
        }

        try {
            // Redis 연결 설정
            const redisConfig = {
                socket: {
                    host: process.env.REDIS_HOST || 'localhost',
                    port: parseInt(process.env.REDIS_PORT) || 6379,
                    reconnectStrategy: (retries) => {
                        if (retries > 10) {
                            console.error('❌ Redis max reconnection attempts reached');
                            return new Error('Max reconnection attempts reached');
                        }
                        const delay = Math.min(retries * 100, 3000);
                        console.log(`🔄 Redis reconnecting in ${delay}ms (attempt ${retries})`);
                        return delay;
                    }
                },
                password: process.env.REDIS_PASSWORD || undefined,
                database: parseInt(process.env.REDIS_DB) || 0,
            };

            // Redis 클라이언트 생성
            this.client = createClient(redisConfig);

            // 이벤트 리스너 설정
            this.client.on('error', (err) => {
                console.error('❌ Redis Client Error:', err.message);
                this.isConnected = false;
            });

            this.client.on('connect', () => {
                console.log('🔗 Redis connecting...');
            });

            this.client.on('ready', () => {
                console.log('✅ Redis client ready');
                this.isConnected = true;
            });

            this.client.on('reconnecting', () => {
                console.log('🔄 Redis reconnecting...');
                this.isConnected = false;
            });

            this.client.on('end', () => {
                console.log('🔌 Redis connection closed');
                this.isConnected = false;
            });

            // Redis 연결
            await this.client.connect();

            // 연결 테스트
            const pingResult = await this.client.ping();
            if (pingResult === 'PONG') {
                console.log('✅ Redis connection successful');
                this.isConnected = true;
            }

            return this.client;
        } catch (error) {
            console.error('❌ Redis connection failed:', error.message);
            this.isConnected = false;
            throw error;
        }
    }

    /**
     * Redis 클라이언트 가져오기
     */
    getClient() {
        if (!this.client || !this.isConnected) {
            throw new Error('Redis client not connected. Call connect() first.');
        }
        return this.client;
    }

    /**
     * Redis 연결 종료
     */
    async disconnect() {
        if (this.client && this.isConnected) {
            try {
                await this.client.quit();
                console.log('✅ Redis connection closed gracefully');
                this.isConnected = false;
                this.client = null;
            } catch (error) {
                console.error('❌ Error closing Redis connection:', error.message);
                // Force disconnect
                if (this.client) {
                    await this.client.disconnect();
                }
                this.isConnected = false;
                this.client = null;
            }
        }
    }

    /**
     * Redis 연결 상태 확인
     */
    isReady() {
        return this.isConnected && this.client !== null;
    }

    /**
     * Redis 서버 정보 가져오기
     */
    async getInfo() {
        try {
            const client = this.getClient();
            const info = await client.info();
            return info;
        } catch (error) {
            console.error('❌ Error getting Redis info:', error.message);
            return null;
        }
    }

    /**
     * Redis 통계 가져오기
     */
    async getStats() {
        try {
            const client = this.getClient();
            const dbSize = await client.dbSize();
            const info = await client.info('stats');

            return {
                dbSize,
                info: this.parseRedisInfo(info)
            };
        } catch (error) {
            console.error('❌ Error getting Redis stats:', error.message);
            return null;
        }
    }

    /**
     * Redis INFO 문자열 파싱
     */
    parseRedisInfo(infoString) {
        const lines = infoString.split('\r\n');
        const info = {};

        lines.forEach(line => {
            if (line && !line.startsWith('#')) {
                const [key, value] = line.split(':');
                if (key && value) {
                    info[key.trim()] = value.trim();
                }
            }
        });

        return info;
    }

    /**
     * 캐시 플러시 (개발 환경에서만 사용)
     */
    async flushAll() {
        if (process.env.NODE_ENV === 'production') {
            throw new Error('Cannot flush cache in production');
        }

        try {
            const client = this.getClient();
            await client.flushAll();
            console.log('✅ Redis cache flushed');
        } catch (error) {
            console.error('❌ Error flushing Redis cache:', error.message);
            throw error;
        }
    }
}

// 싱글톤 인스턴스 생성
const redisClient = new RedisClient();

export default redisClient;
