const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const { Sequelize, DataTypes } = require('sequelize');
const Redis = require('redis');
const winston = require('winston');
const consul = require('consul');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// 로거 설정
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' }),
        new winston.transports.Console({
            format: winston.format.simple()
        })
    ]
});

// Express 앱 생성
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 5001;

// 미들웨어 설정
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15분
    max: 1000, // 15분 동안 1000개 요청
    message: '너무 많은 요청을 하셨습니다. 잠시 후 다시 시도해주세요.'
});
app.use('/api', limiter);

// Redis 연결
const redis = Redis.createClient({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || null
});

redis.on('error', (err) => {
    logger.error('Redis Client Error:', err);
});

redis.connect();

// 데이터베이스 연결
const sequelize = new Sequelize(
    process.env.DB_NAME || 'community_chat',
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || '',
    {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        dialect: 'mysql',
        logging: false,
        pool: {
            max: 10,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    }
);

// 모델 정의
const ChatRoom = sequelize.define('ChatRoom', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    type: {
        type: DataTypes.ENUM('public', 'private', 'direct'),
        defaultValue: 'public'
    },
    maxMembers: {
        type: DataTypes.INTEGER,
        defaultValue: 100
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    createdBy: {
        type: DataTypes.UUID,
        allowNull: false
    }
}, {
    tableName: 'chat_rooms',
    timestamps: true
});

const ChatMessage = sequelize.define('ChatMessage', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    roomId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: ChatRoom,
            key: 'id'
        }
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false
    },
    username: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    messageType: {
        type: DataTypes.ENUM('text', 'image', 'file', 'emoji', 'system'),
        defaultValue: 'text'
    },
    replyTo: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: ChatMessage,
            key: 'id'
        }
    },
    isEdited: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    editedAt: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'chat_messages',
    timestamps: true,
    indexes: [
        { fields: ['roomId'] },
        { fields: ['userId'] },
        { fields: ['createdAt'] }
    ]
});

const ChatMember = sequelize.define('ChatMember', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    roomId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: ChatRoom,
            key: 'id'
        }
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false
    },
    role: {
        type: DataTypes.ENUM('member', 'moderator', 'admin'),
        defaultValue: 'member'
    },
    joinedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    lastReadAt: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'chat_members',
    timestamps: true,
    indexes: [
        { fields: ['roomId', 'userId'], unique: true },
        { fields: ['userId'] }
    ]
});

// JWT 토큰 검증
const verifyToken = (socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
        return next(new Error('인증 토큰이 없습니다.'));
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        socket.userId = decoded.userId;
        next();
    } catch (error) {
        next(new Error('유효하지 않은 토큰입니다.'));
    }
};

// 사용자 정보 조회
const getUserInfo = async (userId) => {
    try {
        // Redis에서 사용자 정보 조회
        const cachedUser = await redis.get(`user:${userId}`);
        if (cachedUser) {
            return JSON.parse(cachedUser);
        }

        // 사용자 서비스에서 사용자 정보 조회
        const response = await axios.get(`${process.env.USER_SERVICE_URL || 'http://localhost:5003'}/api/users/profile`, {
            headers: {
                'Authorization': `Bearer ${jwt.sign({ userId }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '1h' })}`
            }
        });

        const user = response.data.user;

        // Redis에 캐시
        await redis.setEx(`user:${userId}`, 3600, JSON.stringify(user));

        return user;
    } catch (error) {
        logger.error('Get user info error:', error);
        return null;
    }
};

// 연결된 사용자 관리
const connectedUsers = new Map();

// Socket.IO 연결 처리
io.use(verifyToken);

io.on('connection', async (socket) => {
    try {
        const user = await getUserInfo(socket.userId);
        if (!user) {
            socket.disconnect();
            return;
        }

        connectedUsers.set(socket.id, {
            userId: socket.userId,
            username: user.username,
            socket: socket
        });

        logger.info(`User connected: ${user.username} (${socket.id})`);

        // 사용자가 참여한 채팅방 조회
        const userRooms = await ChatMember.findAll({
            where: { userId: socket.userId },
            include: [{
                model: ChatRoom,
                where: { isActive: true }
            }]
        });

        // 채팅방에 참여
        for (const member of userRooms) {
            socket.join(member.roomId);
        }

        // 온라인 상태 브로드캐스트
        socket.broadcast.emit('user_online', {
            userId: socket.userId,
            username: user.username
        });

        // 채팅방 생성
        socket.on('create_room', async (data) => {
            try {
                const { name, description, type = 'public', maxMembers = 100 } = data;

                const room = await ChatRoom.create({
                    name,
                    description,
                    type,
                    maxMembers,
                    createdBy: socket.userId
                });

                // 생성자를 관리자로 추가
                await ChatMember.create({
                    roomId: room.id,
                    userId: socket.userId,
                    role: 'admin'
                });

                socket.join(room.id);

                io.emit('room_created', {
                    room: {
                        id: room.id,
                        name: room.name,
                        description: room.description,
                        type: room.type,
                        maxMembers: room.maxMembers,
                        createdBy: room.createdBy
                    }
                });

                logger.info(`Room created: ${room.name} by ${user.username}`);
            } catch (error) {
                logger.error('Create room error:', error);
                socket.emit('error', { message: '채팅방 생성에 실패했습니다.' });
            }
        });

        // 채팅방 참여
        socket.on('join_room', async (data) => {
            try {
                const { roomId } = data;

                const room = await ChatRoom.findByPk(roomId);
                if (!room || !room.isActive) {
                    socket.emit('error', { message: '채팅방을 찾을 수 없습니다.' });
                    return;
                }

                // 이미 참여한 채팅방인지 확인
                const existingMember = await ChatMember.findOne({
                    where: { roomId, userId: socket.userId }
                });

                if (!existingMember) {
                    // 최대 인원 확인
                    const memberCount = await ChatMember.count({ where: { roomId } });
                    if (memberCount >= room.maxMembers) {
                        socket.emit('error', { message: '채팅방이 가득 찼습니다.' });
                        return;
                    }

                    // 채팅방 참여
                    await ChatMember.create({
                        roomId,
                        userId: socket.userId,
                        role: 'member'
                    });
                }

                socket.join(roomId);

                // 채팅방 참여 알림
                socket.to(roomId).emit('user_joined', {
                    userId: socket.userId,
                    username: user.username,
                    roomId
                });

                // 채팅방 정보 전송
                socket.emit('room_joined', {
                    room: {
                        id: room.id,
                        name: room.name,
                        description: room.description,
                        type: room.type,
                        maxMembers: room.maxMembers
                    }
                });

                logger.info(`User joined room: ${user.username} -> ${room.name}`);
            } catch (error) {
                logger.error('Join room error:', error);
                socket.emit('error', { message: '채팅방 참여에 실패했습니다.' });
            }
        });

        // 채팅방 나가기
        socket.on('leave_room', async (data) => {
            try {
                const { roomId } = data;

                await ChatMember.destroy({
                    where: { roomId, userId: socket.userId }
                });

                socket.leave(roomId);

                // 채팅방 나가기 알림
                socket.to(roomId).emit('user_left', {
                    userId: socket.userId,
                    username: user.username,
                    roomId
                });

                logger.info(`User left room: ${user.username} -> ${roomId}`);
            } catch (error) {
                logger.error('Leave room error:', error);
                socket.emit('error', { message: '채팅방 나가기에 실패했습니다.' });
            }
        });

        // 메시지 전송
        socket.on('send_message', async (data) => {
            try {
                const { roomId, message, messageType = 'text', replyTo } = data;

                // 채팅방 참여 확인
                const member = await ChatMember.findOne({
                    where: { roomId, userId: socket.userId }
                });

                if (!member) {
                    socket.emit('error', { message: '채팅방에 참여하지 않았습니다.' });
                    return;
                }

                // 메시지 저장
                const chatMessage = await ChatMessage.create({
                    roomId,
                    userId: socket.userId,
                    username: user.username,
                    message,
                    messageType,
                    replyTo
                });

                // 메시지 전송
                io.to(roomId).emit('new_message', {
                    id: chatMessage.id,
                    roomId,
                    userId: socket.userId,
                    username: user.username,
                    message,
                    messageType,
                    replyTo,
                    createdAt: chatMessage.createdAt
                });

                // Redis에 최근 메시지 캐시
                await redis.lpush(`room:${roomId}:messages`, JSON.stringify({
                    id: chatMessage.id,
                    userId: socket.userId,
                    username: user.username,
                    message,
                    messageType,
                    replyTo,
                    createdAt: chatMessage.createdAt
                }));

                // 최근 메시지 개수 제한 (100개)
                await redis.ltrim(`room:${roomId}:messages`, 0, 99);

                logger.info(`Message sent: ${user.username} -> ${roomId}`);
            } catch (error) {
                logger.error('Send message error:', error);
                socket.emit('error', { message: '메시지 전송에 실패했습니다.' });
            }
        });

        // 메시지 수정
        socket.on('edit_message', async (data) => {
            try {
                const { messageId, newMessage } = data;

                const chatMessage = await ChatMessage.findOne({
                    where: { id: messageId, userId: socket.userId }
                });

                if (!chatMessage) {
                    socket.emit('error', { message: '메시지를 찾을 수 없습니다.' });
                    return;
                }

                await chatMessage.update({
                    message: newMessage,
                    isEdited: true,
                    editedAt: new Date()
                });

                // 수정된 메시지 브로드캐스트
                io.to(chatMessage.roomId).emit('message_edited', {
                    messageId,
                    newMessage,
                    editedAt: chatMessage.editedAt
                });

                logger.info(`Message edited: ${messageId} by ${user.username}`);
            } catch (error) {
                logger.error('Edit message error:', error);
                socket.emit('error', { message: '메시지 수정에 실패했습니다.' });
            }
        });

        // 메시지 삭제
        socket.on('delete_message', async (data) => {
            try {
                const { messageId } = data;

                const chatMessage = await ChatMessage.findOne({
                    where: { id: messageId, userId: socket.userId }
                });

                if (!chatMessage) {
                    socket.emit('error', { message: '메시지를 찾을 수 없습니다.' });
                    return;
                }

                await chatMessage.destroy();

                // 메시지 삭제 브로드캐스트
                io.to(chatMessage.roomId).emit('message_deleted', {
                    messageId,
                    roomId: chatMessage.roomId
                });

                logger.info(`Message deleted: ${messageId} by ${user.username}`);
            } catch (error) {
                logger.error('Delete message error:', error);
                socket.emit('error', { message: '메시지 삭제에 실패했습니다.' });
            }
        });

        // 연결 해제
        socket.on('disconnect', () => {
            connectedUsers.delete(socket.id);

            // 오프라인 상태 브로드캐스트
            socket.broadcast.emit('user_offline', {
                userId: socket.userId,
                username: user.username
            });

            logger.info(`User disconnected: ${user.username} (${socket.id})`);
        });

    } catch (error) {
        logger.error('Socket connection error:', error);
        socket.disconnect();
    }
});

// API 라우트

// 채팅방 목록 조회
app.get('/api/chat/rooms', async (req, res) => {
    try {
        const { page = 1, limit = 10, type, search } = req.query;
        const offset = (page - 1) * limit;

        const where = { isActive: true };
        if (type) where.type = type;
        if (search) {
            where.name = { [Sequelize.Op.like]: `%${search}%` };
        }

        const { count, rows: rooms } = await ChatRoom.findAndCountAll({
            where,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['createdAt', 'DESC']]
        });

        res.json({
            rooms,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count,
                pages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        logger.error('Get rooms error:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

// 채팅방 메시지 조회
app.get('/api/chat/rooms/:roomId/messages', async (req, res) => {
    try {
        const { roomId } = req.params;
        const { page = 1, limit = 50 } = req.query;
        const offset = (page - 1) * limit;

        // Redis에서 최근 메시지 조회
        const cachedMessages = await redis.lrange(`room:${roomId}:messages`, offset, offset + limit - 1);

        if (cachedMessages.length > 0) {
            const messages = cachedMessages.map(msg => JSON.parse(msg));
            return res.json({
                messages,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: await redis.llen(`room:${roomId}:messages`),
                    pages: Math.ceil(await redis.llen(`room:${roomId}:messages`) / limit)
                }
            });
        }

        // 데이터베이스에서 메시지 조회
        const { count, rows: messages } = await ChatMessage.findAndCountAll({
            where: { roomId },
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['createdAt', 'DESC']]
        });

        res.json({
            messages,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count,
                pages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        logger.error('Get messages error:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

// 온라인 사용자 조회
app.get('/api/chat/online-users', (req, res) => {
    const onlineUsers = Array.from(connectedUsers.values()).map(user => ({
        userId: user.userId,
        username: user.username
    }));

    res.json({ onlineUsers });
});

// 헬스 체크
app.get('/health', async (req, res) => {
    try {
        // 데이터베이스 연결 확인
        await sequelize.authenticate();

        // Redis 연결 확인
        await redis.ping();

        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            services: {
                database: 'connected',
                redis: 'connected',
                websocket: 'connected'
            },
            connectedUsers: connectedUsers.size
        });
    } catch (error) {
        logger.error('Health check error:', error);
        res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
});

// 서버 시작
const startServer = async () => {
    try {
        // 데이터베이스 연결
        await sequelize.authenticate();
        logger.info('Database connected successfully');

        // 데이터베이스 동기화
        await sequelize.sync({ alter: true });
        logger.info('Database synchronized');

        // 서버 시작
        server.listen(PORT, () => {
            logger.info(`Chat service running on port ${PORT}`);
        });
    } catch (error) {
        logger.error('Server start error:', error);
        process.exit(1);
    }
};

startServer();

module.exports = { app, server, io };
