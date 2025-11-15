/**
 * WebSocket Server with Socket.IO
 * 실시간 알림을 위한 WebSocket 서버
 * 
 * @author AUTOAGENTS
 * @date 2025-11-09
 */

import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { verifyToken } from '../auth/jwt.js';
import logger from '../logger.js';

class NotificationSocket {
    constructor() {
        this.io = null;
        this.redisClient = null;
        this.redisPubClient = null;
        this.redisSubClient = null;
    }

    /**
     * Socket.IO 서버 초기화
     * @param {Object} server - HTTP 서버 인스턴스
     */
    async initialize(server) {
        try {
            // Socket.IO 서버 생성
            this.io = new Server(server, {
                cors: {
                    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
                    credentials: true
                },
                path: '/socket.io/',
                transports: ['websocket', 'polling']
            });

            // Redis Adapter 설정 (멀티 서버 지원)
            if (process.env.REDIS_URL || process.env.REDIS_HOST) {
                await this.setupRedisAdapter();
            }

            // 인증 미들웨어
            this.io.use(this.authMiddleware.bind(this));

            // 연결 이벤트 핸들러
            this.io.on('connection', this.handleConnection.bind(this));

            logger.info('Socket.IO server initialized successfully');
        } catch (error) {
            logger.error('Failed to initialize Socket.IO server:', error);
            throw error;
        }
    }

    /**
     * Redis Adapter 설정
     */
    async setupRedisAdapter() {
        try {
            const redisUrl = process.env.REDIS_URL ||
                `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`;

            // Pub/Sub용 Redis 클라이언트 생성
            this.redisPubClient = createClient({ url: redisUrl });
            this.redisSubClient = this.redisPubClient.duplicate();

            // 연결
            await this.redisPubClient.connect();
            await this.redisSubClient.connect();

            // Adapter 설정
            this.io.adapter(createAdapter(this.redisPubClient, this.redisSubClient));

            // Redis Pub/Sub 구독 설정
            await this.setupRedisPubSub();

            logger.info('Redis adapter configured for Socket.IO');
        } catch (error) {
            logger.warn('Failed to setup Redis adapter, using in-memory adapter:', error);
        }
    }

    /**
     * Redis Pub/Sub 구독 설정
     */
    async setupRedisPubSub() {
        try {
            // 별도의 구독 전용 클라이언트 생성
            const redisUrl = process.env.REDIS_URL ||
                `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`;

            const subscriberClient = createClient({ url: redisUrl });
            await subscriberClient.connect();

            // 패턴 매칭으로 모든 사용자 알림 채널 구독
            await subscriberClient.pSubscribe('notification:user:*', (message, channel) => {
                try {
                    const notification = JSON.parse(message);
                    const userId = channel.split(':')[2]; // notification:user:{userId}

                    // Socket.IO를 통해 실시간 전송
                    this.sendNotificationToUser(parseInt(userId), notification);

                    logger.debug(`Notification delivered via Redis Pub/Sub to user ${userId}`);
                } catch (error) {
                    logger.error('Error handling Redis notification:', error);
                }
            });

            logger.info('Redis Pub/Sub subscription configured');
        } catch (error) {
            logger.warn('Failed to setup Redis Pub/Sub subscription:', error);
        }
    }

    /**
     * JWT 인증 미들웨어
     */
    async authMiddleware(socket, next) {
        try {
            const token = socket.handshake.auth.token || socket.handshake.query.token;

            if (!token) {
                return next(new Error('Authentication token required'));
            }

            // JWT 검증
            const decoded = verifyToken(token);

            if (!decoded) {
                return next(new Error('Invalid token'));
            }

            // 사용자 정보를 socket에 저장
            socket.userId = decoded.userId;
            socket.username = decoded.username;

            logger.debug(`Socket authenticated: User ${decoded.userId} (${decoded.username})`);

            next();
        } catch (error) {
            logger.error('Socket authentication error:', error);
            next(new Error('Authentication failed'));
        }
    }

    /**
     * 클라이언트 연결 핸들러
     */
    handleConnection(socket) {
        const userId = socket.userId;
        const username = socket.username;

        logger.info(`Client connected: ${socket.id} - User ${userId} (${username})`);

        // 사용자별 room에 join
        socket.join(`user:${userId}`);

        // 연결 확인 이벤트
        socket.emit('connected', {
            message: '알림 서버에 연결되었습니다.',
            userId,
            username
        });

        // 클라이언트 이벤트 리스너
        socket.on('ping', () => {
            socket.emit('pong', { timestamp: Date.now() });
        });

        // 연결 해제 핸들러
        socket.on('disconnect', (reason) => {
            logger.info(`Client disconnected: ${socket.id} - Reason: ${reason}`);
        });

        // 에러 핸들러
        socket.on('error', (error) => {
            logger.error(`Socket error for ${socket.id}:`, error);
        });
    }

    /**
     * 특정 사용자에게 알림 전송
     * @param {number} userId - 사용자 ID
     * @param {Object} notification - 알림 데이터
     */
    sendNotificationToUser(userId, notification) {
        try {
            this.io.to(`user:${userId}`).emit('notification', notification);
            logger.debug(`Notification sent to user ${userId}`);
        } catch (error) {
            logger.error('Error sending notification:', error);
        }
    }

    /**
     * 여러 사용자에게 알림 전송
     * @param {Array<number>} userIds - 사용자 ID 배열
     * @param {Object} notification - 알림 데이터
     */
    sendNotificationToUsers(userIds, notification) {
        try {
            userIds.forEach(userId => {
                this.sendNotificationToUser(userId, notification);
            });
            logger.debug(`Notification sent to ${userIds.length} users`);
        } catch (error) {
            logger.error('Error sending notifications to users:', error);
        }
    }

    /**
     * 모든 사용자에게 브로드캐스트
     * @param {Object} notification - 알림 데이터
     */
    broadcast(notification) {
        try {
            this.io.emit('notification', notification);
            logger.debug('Notification broadcasted to all users');
        } catch (error) {
            logger.error('Error broadcasting notification:', error);
        }
    }

    /**
     * 특정 사용자의 읽지 않은 알림 개수 업데이트
     * @param {number} userId - 사용자 ID
     * @param {number} count - 읽지 않은 알림 개수
     */
    updateUnreadCount(userId, count) {
        try {
            this.io.to(`user:${userId}`).emit('unread-count', { count });
            logger.debug(`Unread count updated for user ${userId}: ${count}`);
        } catch (error) {
            logger.error('Error updating unread count:', error);
        }
    }

    /**
     * 연결된 클라이언트 수 조회
     * @returns {Promise<number>}
     */
    async getConnectedCount() {
        try {
            const sockets = await this.io.fetchSockets();
            return sockets.length;
        } catch (error) {
            logger.error('Error getting connected count:', error);
            return 0;
        }
    }

    /**
     * 특정 사용자의 연결 상태 확인
     * @param {number} userId - 사용자 ID
     * @returns {Promise<boolean>}
     */
    async isUserConnected(userId) {
        try {
            const sockets = await this.io.in(`user:${userId}`).fetchSockets();
            return sockets.length > 0;
        } catch (error) {
            logger.error('Error checking user connection:', error);
            return false;
        }
    }

    /**
     * Socket.IO 서버 종료
     */
    async close() {
        try {
            if (this.io) {
                this.io.close();
            }

            if (this.redisPubClient) {
                await this.redisPubClient.quit();
            }

            if (this.redisSubClient) {
                await this.redisSubClient.quit();
            }

            logger.info('Socket.IO server closed');
        } catch (error) {
            logger.error('Error closing Socket.IO server:', error);
        }
    }

    /**
     * Socket.IO 인스턴스 반환
     * @returns {Object} Socket.IO 서버 인스턴스
     */
    getIO() {
        return this.io;
    }
}

// Singleton 인스턴스 export
const notificationSocket = new NotificationSocket();
export default notificationSocket;
export { NotificationSocket };
