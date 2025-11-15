/**
 * Online Status Socket.IO Handler
 * 실시간 온라인 상태 관리를 위한 Socket.IO 이벤트 핸들러
 * 
 * @author AUTOAGENTS
 * @date 2025-11-11
 */

import logger from '../logger.js';
import { getRedisClient, isRedisEnabled } from '../redis.js';

/**
 * 온라인 상태 관리 클래스
 */
class OnlineStatusManager {
    constructor() {
        // 메모리 기반 상태 저장 (Redis 미사용 시)
        this.onlineUsers = new Map(); // userId -> { socketId, status, lastSeen, username, avatar }
        this.socketToUser = new Map(); // socketId -> userId
    }

    /**
     * Socket.IO 인스턴스와 연결
     * @param {Object} io - Socket.IO 서버 인스턴스
     */
    initialize(io) {
        this.io = io;
        logger.info('Online status manager initialized');
    }

    /**
     * 사용자 온라인 상태 설정
     * @param {string} socketId - Socket ID
     * @param {number} userId - 사용자 ID
     * @param {string} username - 사용자 이름
     * @param {string} status - 상태 (online, away, busy)
     * @param {string} avatar - 아바타 URL
     */
    async setUserOnline(socketId, userId, username, status = 'online', avatar = null) {
        try {
            const userData = {
                socketId,
                status,
                lastSeen: Date.now(),
                username,
                avatar
            };

            // 메모리에 저장
            this.onlineUsers.set(userId, userData);
            this.socketToUser.set(socketId, userId);

            // Redis에 저장 (TTL 30분)
            if (isRedisEnabled()) {
                const redis = getRedisClient();
                const key = `online:user:${userId}`;
                await redis.setEx(key, 1800, JSON.stringify(userData));
            }

            // 다른 클라이언트들에게 상태 변경 알림
            this.io.emit('user:status', {
                userId,
                username,
                status,
                timestamp: Date.now()
            });

            logger.debug(`User ${userId} (${username}) is now ${status}`);
        } catch (error) {
            logger.error('Error setting user online:', error);
        }
    }

    /**
     * 사용자 오프라인 처리
     * @param {string} socketId - Socket ID
     */
    async setUserOffline(socketId) {
        try {
            const userId = this.socketToUser.get(socketId);
            if (!userId) return;

            const userData = this.onlineUsers.get(userId);
            if (!userData) return;

            // 메모리에서 제거
            this.onlineUsers.delete(userId);
            this.socketToUser.delete(socketId);

            // Redis에서 제거
            if (isRedisEnabled()) {
                const redis = getRedisClient();
                await redis.del(`online:user:${userId}`);
            }

            // 오프라인 상태 브로드캐스트
            this.io.emit('user:status', {
                userId,
                username: userData.username,
                status: 'offline',
                lastSeen: Date.now(),
                timestamp: Date.now()
            });

            logger.debug(`User ${userId} (${userData.username}) is now offline`);
        } catch (error) {
            logger.error('Error setting user offline:', error);
        }
    }

    /**
     * 사용자 상태 업데이트
     * @param {number} userId - 사용자 ID
     * @param {string} status - 새 상태 (online, away, busy)
     */
    async updateUserStatus(userId, status) {
        try {
            const userData = this.onlineUsers.get(userId);
            if (!userData) {
                logger.warn(`Cannot update status for offline user ${userId}`);
                return;
            }

            userData.status = status;
            userData.lastSeen = Date.now();
            this.onlineUsers.set(userId, userData);

            // Redis 업데이트
            if (isRedisEnabled()) {
                const redis = getRedisClient();
                const key = `online:user:${userId}`;
                await redis.setEx(key, 1800, JSON.stringify(userData));
            }

            // 상태 변경 브로드캐스트
            this.io.emit('user:status', {
                userId,
                username: userData.username,
                status,
                timestamp: Date.now()
            });

            logger.debug(`User ${userId} status updated to ${status}`);
        } catch (error) {
            logger.error('Error updating user status:', error);
        }
    }

    /**
     * 온라인 사용자 목록 조회
     * @returns {Array} 온라인 사용자 목록
     */
    getOnlineUsers() {
        const users = [];
        for (const [userId, userData] of this.onlineUsers.entries()) {
            users.push({
                userId,
                username: userData.username,
                status: userData.status,
                avatar: userData.avatar,
                lastSeen: userData.lastSeen
            });
        }
        return users;
    }

    /**
     * 특정 사용자 상태 조회
     * @param {number} userId - 사용자 ID
     * @returns {Object|null} 사용자 상태 정보
     */
    getUserStatus(userId) {
        const userData = this.onlineUsers.get(userId);
        if (!userData) return null;

        return {
            userId,
            username: userData.username,
            status: userData.status,
            avatar: userData.avatar,
            lastSeen: userData.lastSeen
        };
    }

    /**
     * 하트비트 업데이트 (연결 유지)
     * @param {number} userId - 사용자 ID
     */
    async updateHeartbeat(userId) {
        try {
            const userData = this.onlineUsers.get(userId);
            if (!userData) return;

            userData.lastSeen = Date.now();
            this.onlineUsers.set(userId, userData);

            // Redis TTL 갱신
            if (isRedisEnabled()) {
                const redis = getRedisClient();
                const key = `online:user:${userId}`;
                await redis.expire(key, 1800);
            }
        } catch (error) {
            logger.error('Error updating heartbeat:', error);
        }
    }

    /**
     * 비활성 사용자 정리 (30분 이상 하트비트 없음)
     */
    async cleanupInactiveUsers() {
        try {
            const now = Date.now();
            const timeout = 30 * 60 * 1000; // 30분

            for (const [userId, userData] of this.onlineUsers.entries()) {
                if (now - userData.lastSeen > timeout) {
                    logger.info(`Cleaning up inactive user ${userId}`);
                    await this.setUserOffline(userData.socketId);
                }
            }
        } catch (error) {
            logger.error('Error cleaning up inactive users:', error);
        }
    }
}

// Singleton 인스턴스
const onlineStatusManager = new OnlineStatusManager();

/**
 * Socket.IO를 위한 온라인 상태 이벤트 핸들러 초기화
 * @param {Object} io - Socket.IO 서버 인스턴스
 */
export function initOnlineStatusSocket(io) {
    try {
        onlineStatusManager.initialize(io);

        // 연결 이벤트 리스너
        io.on('connection', (socket) => {
            const userId = socket.userId;
            const username = socket.username;

            if (!userId || !username) {
                logger.warn(`Socket ${socket.id} connected without user info`);
                return;
            }

            logger.info(`Setting user ${userId} (${username}) online via socket ${socket.id}`);

            // 온라인 상태 설정
            onlineStatusManager.setUserOnline(
                socket.id,
                userId,
                username,
                'online',
                socket.avatar || null
            );

            // 현재 온라인 사용자 목록 전송
            socket.emit('online:users', {
                users: onlineStatusManager.getOnlineUsers()
            });

            // 상태 변경 요청
            socket.on('status:update', async (data) => {
                try {
                    const { status } = data;
                    const validStatuses = ['online', 'away', 'busy'];

                    if (!validStatuses.includes(status)) {
                        socket.emit('status:error', {
                            message: '유효하지 않은 상태입니다.'
                        });
                        return;
                    }

                    await onlineStatusManager.updateUserStatus(userId, status);
                    socket.emit('status:updated', { status });
                } catch (error) {
                    logger.error('Error handling status update:', error);
                    socket.emit('status:error', {
                        message: '상태 업데이트 실패'
                    });
                }
            });

            // 온라인 사용자 목록 요청
            socket.on('online:list', () => {
                socket.emit('online:users', {
                    users: onlineStatusManager.getOnlineUsers()
                });
            });

            // 특정 사용자 상태 조회
            socket.on('status:query', (data) => {
                const { targetUserId } = data;
                const status = onlineStatusManager.getUserStatus(targetUserId);
                socket.emit('status:result', {
                    targetUserId,
                    status
                });
            });

            // 하트비트
            socket.on('heartbeat', async () => {
                await onlineStatusManager.updateHeartbeat(userId);
                socket.emit('heartbeat:ack', {
                    timestamp: Date.now()
                });
            });

            // 연결 해제
            socket.on('disconnect', async (reason) => {
                logger.info(`User ${userId} disconnected: ${reason}`);
                await onlineStatusManager.setUserOffline(socket.id);
            });
        });

        // 주기적으로 비활성 사용자 정리 (5분마다)
        setInterval(() => {
            onlineStatusManager.cleanupInactiveUsers();
        }, 5 * 60 * 1000);

        logger.info('Online status socket handlers registered');
    } catch (error) {
        logger.error('Failed to initialize online status socket:', error);
        throw error;
    }
}

export { onlineStatusManager };
