// =====================================================
// Socket.io Server Configuration
// Phase 3: Real-time Notification System
// =====================================================

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

/**
 * Socket.io 서버 초기화
 * @param {Object} httpServer - HTTP 서버 인스턴스
 * @returns {Object} Socket.io 서버 인스턴스
 */
function initializeSocketServer(httpServer) {
    const io = new Server(httpServer, {
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:3000',
            credentials: true,
            methods: ['GET', 'POST']
        },
        pingTimeout: 60000,
        pingInterval: 25000
    });

    // JWT 인증 미들웨어
    io.use((socket, next) => {
        try {
            const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

            if (!token) {
                return next(new Error('Authentication token required'));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.userId = decoded.userId;
            socket.username = decoded.username;

            console.log(`[Socket.io] User authenticated: ${socket.username} (ID: ${socket.userId})`);
            next();
        } catch (err) {
            console.error('[Socket.io] Authentication error:', err.message);
            next(new Error('Authentication failed'));
        }
    });

    // 연결된 사용자 추적
    const connectedUsers = new Map();

    // 연결 이벤트
    io.on('connection', (socket) => {
        const userId = socket.userId;
        const username = socket.username;

        console.log(`[Socket.io] User connected: ${username} (Socket ID: ${socket.id})`);

        // 사용자별 룸 참가 (개인 알림용)
        socket.join(`user:${userId}`);

        // 연결된 사용자 추가
        connectedUsers.set(userId, {
            socketId: socket.id,
            username,
            connectedAt: new Date()
        });

        // 온라인 상태 브로드캐스트
        io.emit('user:online', {
            userId,
            username,
            timestamp: new Date()
        });

        // 연결 확인 응답
        socket.emit('connected', {
            userId,
            username,
            message: 'Successfully connected to notification server'
        });

        // 하트비트 이벤트 (클라이언트가 주기적으로 보냄)
        socket.on('heartbeat', () => {
            socket.emit('heartbeat:ack', { timestamp: new Date() });
        });

        // 알림 읽음 처리 (실시간 UI 업데이트용)
        socket.on('notification:read', (data) => {
            console.log(`[Socket.io] Notification read by ${username}:`, data.notificationId);
            socket.emit('notification:read:ack', {
                notificationId: data.notificationId,
                timestamp: new Date()
            });
        });

        // ===================================
        // Phase 3: Chat System Events
        // ===================================

        // DM 대화방 참가
        socket.on('dm:join', (data) => {
            const roomName = `dm_${data.conversationId}`;
            socket.join(roomName);
            console.log(`[Socket.io] ${username} joined DM room: ${roomName}`);
        });

        // DM 대화방 나가기
        socket.on('dm:leave', (data) => {
            const roomName = `dm_${data.conversationId}`;
            socket.leave(roomName);
            console.log(`[Socket.io] ${username} left DM room: ${roomName}`);
        });

        // DM 메시지 전송 (실시간)
        socket.on('dm:send_message', (data) => {
            const roomName = `dm_${data.conversationId}`;
            // 같은 대화방의 다른 사용자에게만 전송
            socket.to(roomName).emit('dm:new_message', {
                ...data,
                sentAt: new Date()
            });
            console.log(`[Socket.io] DM message sent in room ${roomName}`);
        });

        // DM 타이핑 인디케이터
        socket.on('dm:typing', (data) => {
            const roomName = `dm_${data.conversationId}`;
            socket.to(roomName).emit('dm:user_typing', {
                userId,
                username,
                conversationId: data.conversationId
            });
        });

        // DM 타이핑 중지
        socket.on('dm:stop_typing', (data) => {
            const roomName = `dm_${data.conversationId}`;
            socket.to(roomName).emit('dm:user_stop_typing', {
                userId,
                conversationId: data.conversationId
            });
        });

        // 그룹 채팅방 참가
        socket.on('group:join', (data) => {
            const roomName = `group_${data.groupId}`;
            socket.join(roomName);
            socket.to(roomName).emit('group:user_joined', {
                userId,
                username,
                groupId: data.groupId,
                joinedAt: new Date()
            });
            console.log(`[Socket.io] ${username} joined group room: ${roomName}`);
        });

        // 그룹 채팅방 나가기
        socket.on('group:leave', (data) => {
            const roomName = `group_${data.groupId}`;
            socket.to(roomName).emit('group:user_left', {
                userId,
                username,
                groupId: data.groupId,
                leftAt: new Date()
            });
            socket.leave(roomName);
            console.log(`[Socket.io] ${username} left group room: ${roomName}`);
        });

        // 그룹 메시지 전송 (실시간)
        socket.on('group:send_message', (data) => {
            const roomName = `group_${data.groupId}`;
            socket.to(roomName).emit('group:new_message', {
                ...data,
                sentAt: new Date()
            });
            console.log(`[Socket.io] Group message sent in room ${roomName}`);
        });

        // 그룹 타이핑 인디케이터
        socket.on('group:typing', (data) => {
            const roomName = `group_${data.groupId}`;
            socket.to(roomName).emit('group:user_typing', {
                userId,
                username,
                groupId: data.groupId
            });
        });

        // 그룹 타이핑 중지
        socket.on('group:stop_typing', (data) => {
            const roomName = `group_${data.groupId}`;
            socket.to(roomName).emit('group:user_stop_typing', {
                userId,
                groupId: data.groupId
            });
        });

        // 연결 해제 이벤트
        socket.on('disconnect', (reason) => {
            console.log(`[Socket.io] User disconnected: ${username} (Reason: ${reason})`);

            // 연결된 사용자 목록에서 제거
            connectedUsers.delete(userId);

            // 오프라인 상태 브로드캐스트
            io.emit('user:offline', {
                userId,
                username,
                timestamp: new Date()
            });
        });

        // 에러 핸들링
        socket.on('error', (error) => {
            console.error(`[Socket.io] Socket error for ${username}:`, error);
        });
    });

    // io 객체에 헬퍼 메서드 추가
    io.sendNotificationToUser = (userId, notification) => {
        io.to(`user:${userId}`).emit('notification', notification);
        console.log(`[Socket.io] Notification sent to user ${userId}:`, notification.title);
    };

    io.sendNotificationToMultipleUsers = (userIds, notification) => {
        userIds.forEach(userId => {
            io.to(`user:${userId}`).emit('notification', notification);
        });
        console.log(`[Socket.io] Notification sent to ${userIds.length} users:`, notification.title);
    };

    io.broadcastNotification = (notification) => {
        io.emit('notification:broadcast', notification);
        console.log('[Socket.io] Broadcast notification sent:', notification.title);
    };

    io.getConnectedUsers = () => {
        return Array.from(connectedUsers.entries()).map(([userId, data]) => ({
            userId,
            ...data
        }));
    };

    io.isUserConnected = (userId) => {
        return connectedUsers.has(userId);
    };

    console.log('[Socket.io] Server initialized successfully');

    return io;
}

module.exports = { initializeSocketServer };
