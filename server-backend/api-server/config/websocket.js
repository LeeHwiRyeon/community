const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { User } = require('../models/User');
const logger = require('../utils/logger');

// Validate JWT_SECRET
if (!process.env.JWT_SECRET) {
    console.error('❌ FATAL: JWT_SECRET not set in environment variables');
    process.exit(1);
}

let io;

// WebSocket 서버 초기화
const initializeWebSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: process.env.FRONTEND_URL || "http://localhost:3000",
            methods: ["GET", "POST"]
        }
    });

    // 인증 미들웨어
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) {
                return next(new Error('Authentication error'));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findByPk(decoded.userId);

            if (!user) {
                return next(new Error('User not found'));
            }

            socket.userId = user.id;
            socket.user = user;
            next();
        } catch (error) {
            next(new Error('Authentication error'));
        }
    });

    // 연결 처리
    io.on('connection', (socket) => {
        logger.info(`User ${socket.userId} connected via WebSocket`);

        // 사용자별 방 참여
        socket.join(`user_${socket.userId}`);

        // 실시간 알림 전송
        socket.on('join_notifications', () => {
            socket.join('notifications');
        });

        // 대시보드 업데이트 구독
        socket.on('join_dashboard', () => {
            socket.join('dashboard');
        });

        // 채팅방 참여
        socket.on('join_room', (data) => {
            const { roomId } = data;
            socket.join(`room_${roomId}`);
            socket.to(`room_${roomId}`).emit('user_joined', {
                userId: socket.userId,
                userName: socket.user.username || 'Unknown'
            });
            logger.info(`User ${socket.userId} joined room ${roomId}`);
        });

        // 채팅방 나가기
        socket.on('leave_room', (data) => {
            const { roomId } = data;
            socket.leave(`room_${roomId}`);
            socket.to(`room_${roomId}`).emit('user_left', {
                userId: socket.userId
            });
            logger.info(`User ${socket.userId} left room ${roomId}`);
        });

        // 메시지 전송
        socket.on('send_message', async (data) => {
            try {
                const { roomId, content, messageType = 'text', replyToId } = data;

                // 메시지 저장 (실제 구현에서는 데이터베이스에 저장)
                const message = {
                    id: Date.now(),
                    roomId,
                    userId: socket.userId,
                    userName: socket.user.username || 'Unknown',
                    content,
                    messageType,
                    replyToId,
                    timestamp: new Date().toISOString()
                };

                // 같은 방의 모든 사용자에게 메시지 전송
                io.to(`room_${roomId}`).emit('new_message', message);

                logger.info(`Message sent in room ${roomId} by user ${socket.userId}`);
            } catch (error) {
                logger.error('Error sending message:', error);
                socket.emit('error', { message: '메시지 전송에 실패했습니다.' });
            }
        });

        // 타이핑 상태 전송
        socket.on('typing_start', (data) => {
            const { roomId } = data;
            socket.to(`room_${roomId}`).emit('user_typing', {
                userId: socket.userId,
                userName: socket.user.username || 'Unknown',
                isTyping: true
            });
        });

        socket.on('typing_stop', (data) => {
            const { roomId } = data;
            socket.to(`room_${roomId}`).emit('user_typing', {
                userId: socket.userId,
                userName: socket.user.username || 'Unknown',
                isTyping: false
            });
        });

        // 연결 해제
        socket.on('disconnect', () => {
            logger.info(`User ${socket.userId} disconnected from WebSocket`);
        });
    });

    return io;
};

// 실시간 알림 전송
const sendNotification = (userId, notification) => {
    if (io) {
        io.to(`user_${userId}`).emit('notification', notification);
    }
};

// 대시보드 업데이트 전송
const sendDashboardUpdate = (update) => {
    if (io) {
        io.to('dashboard').emit('dashboard_update', update);
    }
};

// 전체 사용자에게 브로드캐스트
const broadcastToAll = (event, data) => {
    if (io) {
        io.emit(event, data);
    }
};

module.exports = {
    initializeWebSocket,
    sendNotification,
    sendDashboardUpdate,
    broadcastToAll
};
