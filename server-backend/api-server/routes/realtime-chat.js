const express = require('express');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// 채팅 메시지 스키마
const messageSchema = {
    id: String,
    communityId: String,
    channelId: String,
    userId: String,
    username: String,
    avatar: String,
    content: String,
    type: String, // 'text', 'image', 'file', 'system', 'announcement'
    metadata: Object, // 파일 정보, 이미지 정보 등
    replyTo: String, // 답글 대상 메시지 ID
    mentions: [String], // 멘션된 사용자 ID
    reactions: Object, // { emoji: [userId] }
    isEdited: Boolean,
    editedAt: Date,
    isDeleted: Boolean,
    deletedAt: Date,
    createdAt: Date,
    updatedAt: Date
};

// 채팅 채널 스키마
const channelSchema = {
    id: String,
    communityId: String,
    name: String,
    description: String,
    type: String, // 'general', 'announcements', 'voice', 'private', 'dm'
    isPrivate: Boolean,
    members: [String], // 사용자 ID 목록
    moderators: [String], // 모더레이터 ID 목록
    permissions: Object, // 채널별 권한 설정
    settings: {
        allowFileUpload: Boolean,
        allowReactions: Boolean,
        allowMentions: Boolean,
        slowMode: Number, // 초 단위
        maxMessageLength: Number,
        autoDelete: Number // 분 단위
    },
    createdAt: Date,
    createdBy: String
};

// 임시 저장소 (실제로는 데이터베이스 사용)
let messageStore = new Map();
let channelStore = new Map();
let userSessions = new Map(); // { userId: { socketId, status, lastSeen } }

// Socket.IO 초기화
let io;

const initializeSocketIO = (server) => {
    io = new Server(server, {
        cors: {
            origin: process.env.FRONTEND_URL || "http://localhost:3000",
            methods: ["GET", "POST"]
        }
    });

    io.on('connection', (socket) => {
        console.log(`사용자 연결: ${socket.id}`);

        // 사용자 인증 및 세션 등록
        socket.on('authenticate', (data) => {
            const { userId, username, avatar } = data;
            userSessions.set(userId, {
                socketId: socket.id,
                status: 'online',
                lastSeen: new Date(),
                username,
                avatar
            });
            socket.userId = userId;
            socket.username = username;
            socket.avatar = avatar;

            // 사용자 온라인 상태 브로드캐스트
            socket.broadcast.emit('user_status_change', {
                userId,
                status: 'online',
                username,
                avatar
            });
        });

        // 커뮤니티 참여
        socket.on('join_community', (data) => {
            const { communityId } = data;
            socket.join(`community_${communityId}`);
            console.log(`사용자 ${socket.userId}가 커뮤니티 ${communityId}에 참여했습니다.`);
        });

        // 채널 참여
        socket.on('join_channel', (data) => {
            const { channelId } = data;
            socket.join(`channel_${channelId}`);
            console.log(`사용자 ${socket.userId}가 채널 ${channelId}에 참여했습니다.`);
        });

        // 메시지 전송
        socket.on('send_message', async (data) => {
            try {
                const { communityId, channelId, content, type = 'text', metadata = {}, replyTo, mentions = [] } = data;

                // 권한 확인
                if (!hasChannelPermission(socket.userId, channelId, 'send_message')) {
                    socket.emit('error', { message: '메시지 전송 권한이 없습니다.' });
                    return;
                }

                // 슬로우 모드 확인
                if (isSlowModeActive(socket.userId, channelId)) {
                    socket.emit('error', { message: '슬로우 모드가 활성화되어 있습니다. 잠시 후 다시 시도해주세요.' });
                    return;
                }

                const message = {
                    id: uuidv4(),
                    communityId,
                    channelId,
                    userId: socket.userId,
                    username: socket.username,
                    avatar: socket.avatar,
                    content,
                    type,
                    metadata,
                    replyTo,
                    mentions,
                    reactions: {},
                    isEdited: false,
                    editedAt: null,
                    isDeleted: false,
                    deletedAt: null,
                    createdAt: new Date(),
                    updatedAt: new Date()
                };

                // 메시지 저장
                messageStore.set(message.id, message);

                // 채널에 메시지 브로드캐스트
                io.to(`channel_${channelId}`).emit('new_message', message);

                // 멘션된 사용자에게 알림
                if (mentions.length > 0) {
                    mentions.forEach(mentionedUserId => {
                        const mentionedUser = userSessions.get(mentionedUserId);
                        if (mentionedUser) {
                            io.to(mentionedUser.socketId).emit('mention_notification', {
                                messageId: message.id,
                                channelId,
                                communityId,
                                fromUser: socket.username,
                                content: content.substring(0, 100)
                            });
                        }
                    });
                }

                // 자동 삭제 설정 확인
                const channel = channelStore.get(channelId);
                if (channel?.settings.autoDelete) {
                    setTimeout(() => {
                        deleteMessage(message.id);
                    }, channel.settings.autoDelete * 60 * 1000);
                }

            } catch (error) {
                console.error('메시지 전송 오류:', error);
                socket.emit('error', { message: '메시지 전송에 실패했습니다.' });
            }
        });

        // 메시지 수정
        socket.on('edit_message', (data) => {
            const { messageId, content } = data;
            const message = messageStore.get(messageId);

            if (!message) {
                socket.emit('error', { message: '메시지를 찾을 수 없습니다.' });
                return;
            }

            if (message.userId !== socket.userId) {
                socket.emit('error', { message: '메시지 수정 권한이 없습니다.' });
                return;
            }

            message.content = content;
            message.isEdited = true;
            message.editedAt = new Date();
            message.updatedAt = new Date();

            messageStore.set(messageId, message);
            io.to(`channel_${message.channelId}`).emit('message_updated', message);
        });

        // 메시지 삭제
        socket.on('delete_message', (data) => {
            const { messageId } = data;
            const message = messageStore.get(messageId);

            if (!message) {
                socket.emit('error', { message: '메시지를 찾을 수 없습니다.' });
                return;
            }

            if (message.userId !== socket.userId && !hasChannelPermission(socket.userId, message.channelId, 'moderate')) {
                socket.emit('error', { message: '메시지 삭제 권한이 없습니다.' });
                return;
            }

            message.isDeleted = true;
            message.deletedAt = new Date();
            message.updatedAt = new Date();

            messageStore.set(messageId, message);
            io.to(`channel_${message.channelId}`).emit('message_deleted', { messageId });
        });

        // 반응 추가/제거
        socket.on('toggle_reaction', (data) => {
            const { messageId, emoji } = data;
            const message = messageStore.get(messageId);

            if (!message) {
                socket.emit('error', { message: '메시지를 찾을 수 없습니다.' });
                return;
            }

            if (!message.reactions[emoji]) {
                message.reactions[emoji] = [];
            }

            const userIndex = message.reactions[emoji].indexOf(socket.userId);
            if (userIndex > -1) {
                message.reactions[emoji].splice(userIndex, 1);
            } else {
                message.reactions[emoji].push(socket.userId);
            }

            messageStore.set(messageId, message);
            io.to(`channel_${message.channelId}`).emit('reaction_updated', { messageId, reactions: message.reactions });
        });

        // 타이핑 상태
        socket.on('typing_start', (data) => {
            const { channelId } = data;
            socket.to(`channel_${channelId}`).emit('user_typing', {
                userId: socket.userId,
                username: socket.username,
                channelId
            });
        });

        socket.on('typing_stop', (data) => {
            const { channelId } = data;
            socket.to(`channel_${channelId}`).emit('user_stopped_typing', {
                userId: socket.userId,
                channelId
            });
        });

        // 연결 해제
        socket.on('disconnect', () => {
            if (socket.userId) {
                const userSession = userSessions.get(socket.userId);
                if (userSession) {
                    userSession.status = 'offline';
                    userSession.lastSeen = new Date();
                    userSessions.set(socket.userId, userSession);

                    // 사용자 오프라인 상태 브로드캐스트
                    socket.broadcast.emit('user_status_change', {
                        userId: socket.userId,
                        status: 'offline',
                        lastSeen: userSession.lastSeen
                    });
                }
            }
            console.log(`사용자 연결 해제: ${socket.id}`);
        });
    });
};

// 채널 생성
router.post('/channels', async (req, res) => {
    try {
        const {
            communityId,
            name,
            description,
            type = 'general',
            isPrivate = false,
            members = [],
            settings = {}
        } = req.body;

        if (!communityId || !name) {
            return res.status(400).json({
                success: false,
                message: '커뮤니티 ID와 채널 이름은 필수입니다.'
            });
        }

        const channel = {
            id: uuidv4(),
            communityId,
            name,
            description,
            type,
            isPrivate,
            members: [...members, req.user.id],
            moderators: [req.user.id],
            permissions: {
                send_message: ['member', 'moderator', 'admin'],
                manage_messages: ['moderator', 'admin'],
                manage_channel: ['admin']
            },
            settings: {
                allowFileUpload: true,
                allowReactions: true,
                allowMentions: true,
                slowMode: 0,
                maxMessageLength: 2000,
                autoDelete: 0,
                ...settings
            },
            createdAt: new Date(),
            createdBy: req.user.id
        };

        channelStore.set(channel.id, channel);

        res.status(201).json({
            success: true,
            message: '채널이 생성되었습니다.',
            data: channel
        });
    } catch (error) {
        console.error('채널 생성 오류:', error);
        res.status(500).json({
            success: false,
            message: '채널 생성 중 오류가 발생했습니다.'
        });
    }
});

// 채널 목록 조회
router.get('/channels/:communityId', async (req, res) => {
    try {
        const { communityId } = req.params;
        const channels = Array.from(channelStore.values())
            .filter(channel => channel.communityId === communityId);

        res.json({
            success: true,
            data: channels
        });
    } catch (error) {
        console.error('채널 목록 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '채널 목록 조회 중 오류가 발생했습니다.'
        });
    }
});

// 메시지 히스토리 조회
router.get('/messages/:channelId', async (req, res) => {
    try {
        const { channelId } = req.params;
        const { page = 1, limit = 50, before } = req.query;

        let messages = Array.from(messageStore.values())
            .filter(message => message.channelId === channelId && !message.isDeleted)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        if (before) {
            const beforeDate = new Date(before);
            messages = messages.filter(message => new Date(message.createdAt) < beforeDate);
        }

        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + parseInt(limit);
        const paginatedMessages = messages.slice(startIndex, endIndex);

        res.json({
            success: true,
            data: {
                messages: paginatedMessages,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: messages.length,
                    hasMore: endIndex < messages.length
                }
            }
        });
    } catch (error) {
        console.error('메시지 히스토리 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '메시지 히스토리 조회 중 오류가 발생했습니다.'
        });
    }
});

// 온라인 사용자 목록 조회
router.get('/online-users/:communityId', async (req, res) => {
    try {
        const { communityId } = req.params;
        const onlineUsers = Array.from(userSessions.values())
            .filter(user => user.status === 'online')
            .map(user => ({
                userId: user.userId,
                username: user.username,
                avatar: user.avatar,
                status: user.status,
                lastSeen: user.lastSeen
            }));

        res.json({
            success: true,
            data: onlineUsers
        });
    } catch (error) {
        console.error('온라인 사용자 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '온라인 사용자 조회 중 오류가 발생했습니다.'
        });
    }
});

// 헬퍼 함수들
function hasChannelPermission(userId, channelId, permission) {
    const channel = channelStore.get(channelId);
    if (!channel) return false;

    // 채널 멤버 확인
    if (!channel.members.includes(userId)) return false;

    // 권한 확인
    const userRole = channel.members.includes(userId) ? 'member' : 'guest';
    const allowedRoles = channel.permissions[permission] || [];

    return allowedRoles.includes(userRole) || allowedRoles.includes('*');
}

function isSlowModeActive(userId, channelId) {
    const channel = channelStore.get(channelId);
    if (!channel || channel.settings.slowMode === 0) return false;

    // 실제로는 사용자별 마지막 메시지 시간을 확인
    // 여기서는 간단히 false 반환
    return false;
}

function deleteMessage(messageId) {
    const message = messageStore.get(messageId);
    if (message) {
        message.isDeleted = true;
        message.deletedAt = new Date();
        messageStore.set(messageId, message);
    }
}

module.exports = { router, initializeSocketIO };
