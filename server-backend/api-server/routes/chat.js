const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { sequelize } = require('../config/database');
const { DataTypes } = require('sequelize');
const { logger } = require('../utils/logger');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// 채팅방 모델 정의
const ChatRoom = sequelize.define('ChatRoom', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
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
        type: DataTypes.STRING(50),
        defaultValue: 'public'
    },
    color: {
        type: DataTypes.STRING(7),
        allowNull: true
    },
    avatar_url: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    created_by: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    max_members: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
}, {
    tableName: 'chat_rooms',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

const ChatMessage = sequelize.define('ChatMessage', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    room_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: ChatRoom,
            key: 'id'
        }
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    message_type: {
        type: DataTypes.STRING(50),
        defaultValue: 'text'
    },
    file_url: {
        type: DataTypes.STRING(500),
        allowNull: true
    },
    file_name: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    file_size: {
        type: DataTypes.BIGINT,
        allowNull: true
    },
    mime_type: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    reply_to_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    is_edited: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    is_deleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    reaction_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
}, {
    tableName: 'chat_messages',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

const ChatRoomMember = sequelize.define('ChatRoomMember', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    room_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: ChatRoom,
            key: 'id'
        }
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    role: {
        type: DataTypes.STRING(50),
        defaultValue: 'member'
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    last_read_at: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'chat_room_members',
    timestamps: true,
    createdAt: 'joined_at',
    updatedAt: 'updated_at'
});

// 채팅방 목록 조회
router.get('/rooms', protect, asyncHandler(async (req, res) => {
    try {
        const { type = 'all', page = 1, limit = 20 } = req.query;
        const userId = req.user.id;

        const whereClause = { is_active: true };
        if (type !== 'all') {
            whereClause.type = type;
        }

        const offset = (parseInt(page) - 1) * parseInt(limit);

        const { count, rows: rooms } = await ChatRoom.findAndCountAll({
            where: whereClause,
            include: [{
                model: ChatRoomMember,
                where: { user_id: userId, is_active: true },
                required: true
            }],
            order: [['updated_at', 'DESC']],
            limit: parseInt(limit),
            offset: offset
        });

        res.json({
            success: true,
            data: {
                rooms,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(count / limit),
                    totalItems: count,
                    itemsPerPage: parseInt(limit)
                }
            }
        });
    } catch (error) {
        logger.error('채팅방 목록 조회 실패:', error);
        res.status(500).json({
            success: false,
            error: '채팅방 목록을 불러올 수 없습니다.'
        });
    }
}));

// 채팅방 생성
router.post('/rooms', protect, asyncHandler(async (req, res) => {
    try {
        const { name, description, type = 'public', color, avatar_url, max_members = 0 } = req.body;
        const userId = req.user.id;

        if (!name || name.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: '채팅방 이름은 필수입니다.'
            });
        }

        const room = await ChatRoom.create({
            name: name.trim(),
            description: description?.trim(),
            type,
            color,
            avatar_url,
            created_by: userId,
            max_members: parseInt(max_members)
        });

        // 생성자를 방 관리자로 추가
        await ChatRoomMember.create({
            room_id: room.id,
            user_id: userId,
            role: 'admin',
            is_active: true
        });

        res.status(201).json({
            success: true,
            data: room
        });
    } catch (error) {
        logger.error('채팅방 생성 실패:', error);
        res.status(500).json({
            success: false,
            error: '채팅방 생성에 실패했습니다.'
        });
    }
}));

// 특정 채팅방 조회
router.get('/rooms/:roomId', protect, asyncHandler(async (req, res) => {
    try {
        const { roomId } = req.params;
        const userId = req.user.id;

        const room = await ChatRoom.findOne({
            where: { id: roomId, is_active: true },
            include: [{
                model: ChatRoomMember,
                where: { user_id: userId, is_active: true },
                required: true
            }]
        });

        if (!room) {
            return res.status(404).json({
                success: false,
                error: '채팅방을 찾을 수 없습니다.'
            });
        }

        res.json({
            success: true,
            data: room
        });
    } catch (error) {
        logger.error('채팅방 조회 실패:', error);
        res.status(500).json({
            success: false,
            error: '채팅방을 불러올 수 없습니다.'
        });
    }
}));

// 채팅방 수정
router.put('/rooms/:roomId', protect, asyncHandler(async (req, res) => {
    try {
        const { roomId } = req.params;
        const { name, description, color, avatar_url, max_members } = req.body;
        const userId = req.user.id;

        const room = await ChatRoom.findOne({
            where: { id: roomId, is_active: true },
            include: [{
                model: ChatRoomMember,
                where: { user_id: userId, is_active: true },
                required: true
            }]
        });

        if (!room) {
            return res.status(404).json({
                success: false,
                error: '채팅방을 찾을 수 없습니다.'
            });
        }

        // 관리자 권한 확인
        const member = room.ChatRoomMembers[0];
        if (member.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: '채팅방 수정 권한이 없습니다.'
            });
        }

        await room.update({
            name: name || room.name,
            description: description !== undefined ? description : room.description,
            color: color || room.color,
            avatar_url: avatar_url || room.avatar_url,
            max_members: max_members !== undefined ? parseInt(max_members) : room.max_members
        });

        res.json({
            success: true,
            data: room
        });
    } catch (error) {
        logger.error('채팅방 수정 실패:', error);
        res.status(500).json({
            success: false,
            error: '채팅방 수정에 실패했습니다.'
        });
    }
}));

// 채팅방 삭제
router.delete('/rooms/:roomId', protect, asyncHandler(async (req, res) => {
    try {
        const { roomId } = req.params;
        const userId = req.user.id;

        const room = await ChatRoom.findOne({
            where: { id: roomId, is_active: true },
            include: [{
                model: ChatRoomMember,
                where: { user_id: userId, is_active: true },
                required: true
            }]
        });

        if (!room) {
            return res.status(404).json({
                success: false,
                error: '채팅방을 찾을 수 없습니다.'
            });
        }

        // 관리자 권한 확인
        const member = room.ChatRoomMembers[0];
        if (member.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: '채팅방 삭제 권한이 없습니다.'
            });
        }

        await room.update({ is_active: false });

        res.json({
            success: true,
            message: '채팅방이 삭제되었습니다.'
        });
    } catch (error) {
        logger.error('채팅방 삭제 실패:', error);
        res.status(500).json({
            success: false,
            error: '채팅방 삭제에 실패했습니다.'
        });
    }
}));

// 채팅방 참여
router.post('/rooms/:roomId/join', protect, asyncHandler(async (req, res) => {
    try {
        const { roomId } = req.params;
        const userId = req.user.id;

        const room = await ChatRoom.findOne({
            where: { id: roomId, is_active: true }
        });

        if (!room) {
            return res.status(404).json({
                success: false,
                error: '채팅방을 찾을 수 없습니다.'
            });
        }

        // 이미 참여 중인지 확인
        const existingMember = await ChatRoomMember.findOne({
            where: { room_id: roomId, user_id: userId }
        });

        if (existingMember) {
            if (existingMember.is_active) {
                return res.status(400).json({
                    success: false,
                    error: '이미 참여 중인 채팅방입니다.'
                });
            } else {
                // 재참여
                await existingMember.update({ is_active: true, joined_at: new Date() });
                return res.json({
                    success: true,
                    message: '채팅방에 재참여했습니다.'
                });
            }
        }

        // 최대 인원 확인
        if (room.max_members > 0) {
            const memberCount = await ChatRoomMember.count({
                where: { room_id: roomId, is_active: true }
            });
            if (memberCount >= room.max_members) {
                return res.status(400).json({
                    success: false,
                    error: '채팅방이 가득 찼습니다.'
                });
            }
        }

        await ChatRoomMember.create({
            room_id: roomId,
            user_id: userId,
            role: 'member',
            is_active: true
        });

        res.json({
            success: true,
            message: '채팅방에 참여했습니다.'
        });
    } catch (error) {
        logger.error('채팅방 참여 실패:', error);
        res.status(500).json({
            success: false,
            error: '채팅방 참여에 실패했습니다.'
        });
    }
}));

// 채팅방 나가기
router.post('/rooms/:roomId/leave', protect, asyncHandler(async (req, res) => {
    try {
        const { roomId } = req.params;
        const userId = req.user.id;

        const member = await ChatRoomMember.findOne({
            where: { room_id: roomId, user_id: userId, is_active: true }
        });

        if (!member) {
            return res.status(404).json({
                success: false,
                error: '참여 중인 채팅방이 아닙니다.'
            });
        }

        // 관리자는 나갈 수 없음 (방 삭제 필요)
        if (member.role === 'admin') {
            return res.status(400).json({
                success: false,
                error: '관리자는 채팅방을 나갈 수 없습니다. 방을 삭제하세요.'
            });
        }

        await member.update({ is_active: false });

        res.json({
            success: true,
            message: '채팅방을 나갔습니다.'
        });
    } catch (error) {
        logger.error('채팅방 나가기 실패:', error);
        res.status(500).json({
            success: false,
            error: '채팅방 나가기에 실패했습니다.'
        });
    }
}));

// 채팅방 멤버 목록 조회
router.get('/rooms/:roomId/members', protect, asyncHandler(async (req, res) => {
    try {
        const { roomId } = req.params;
        const userId = req.user.id;

        // 채팅방 참여 확인
        const member = await ChatRoomMember.findOne({
            where: { room_id: roomId, user_id: userId, is_active: true }
        });

        if (!member) {
            return res.status(403).json({
                success: false,
                error: '채팅방에 참여하지 않았습니다.'
            });
        }

        const members = await ChatRoomMember.findAll({
            where: { room_id: roomId, is_active: true },
            order: [['role', 'ASC'], ['joined_at', 'ASC']]
        });

        res.json({
            success: true,
            data: members
        });
    } catch (error) {
        logger.error('채팅방 멤버 목록 조회 실패:', error);
        res.status(500).json({
            success: false,
            error: '멤버 목록을 불러올 수 없습니다.'
        });
    }
}));

// 메시지 목록 조회
router.get('/rooms/:roomId/messages', protect, asyncHandler(async (req, res) => {
    try {
        const { roomId } = req.params;
        const { page = 1, limit = 50, before } = req.query;
        const userId = req.user.id;

        // 채팅방 참여 확인
        const member = await ChatRoomMember.findOne({
            where: { room_id: roomId, user_id: userId, is_active: true }
        });

        if (!member) {
            return res.status(403).json({
                success: false,
                error: '채팅방에 참여하지 않았습니다.'
            });
        }

        const whereClause = {
            room_id: roomId,
            is_deleted: false
        };

        if (before) {
            whereClause.created_at = {
                [sequelize.Op.lt]: new Date(before)
            };
        }

        const offset = (parseInt(page) - 1) * parseInt(limit);

        const { count, rows: messages } = await ChatMessage.findAndCountAll({
            where: whereClause,
            order: [['created_at', 'DESC']],
            limit: parseInt(limit),
            offset: offset
        });

        res.json({
            success: true,
            data: {
                messages: messages.reverse(), // 최신순으로 정렬
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(count / limit),
                    totalItems: count,
                    itemsPerPage: parseInt(limit)
                }
            }
        });
    } catch (error) {
        logger.error('메시지 목록 조회 실패:', error);
        res.status(500).json({
            success: false,
            error: '메시지 목록을 불러올 수 없습니다.'
        });
    }
}));

// 메시지 전송
router.post('/rooms/:roomId/messages', protect, asyncHandler(async (req, res) => {
    try {
        const { roomId } = req.params;
        const { content, message_type = 'text', file_url, file_name, file_size, mime_type, reply_to_id } = req.body;
        const userId = req.user.id;

        // 채팅방 참여 확인
        const member = await ChatRoomMember.findOne({
            where: { room_id: roomId, user_id: userId, is_active: true }
        });

        if (!member) {
            return res.status(403).json({
                success: false,
                error: '채팅방에 참여하지 않았습니다.'
            });
        }

        if (!content || content.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: '메시지 내용은 필수입니다.'
            });
        }

        const message = await ChatMessage.create({
            room_id: roomId,
            user_id: userId,
            content: content.trim(),
            message_type,
            file_url,
            file_name,
            file_size: file_size ? parseInt(file_size) : null,
            mime_type,
            reply_to_id: reply_to_id ? parseInt(reply_to_id) : null
        });

        res.status(201).json({
            success: true,
            data: message
        });
    } catch (error) {
        logger.error('메시지 전송 실패:', error);
        res.status(500).json({
            success: false,
            error: '메시지 전송에 실패했습니다.'
        });
    }
}));

// 메시지 수정
router.put('/messages/:messageId', protect, asyncHandler(async (req, res) => {
    try {
        const { messageId } = req.params;
        const { content } = req.body;
        const userId = req.user.id;

        const message = await ChatMessage.findOne({
            where: { id: messageId, user_id: userId, is_deleted: false }
        });

        if (!message) {
            return res.status(404).json({
                success: false,
                error: '메시지를 찾을 수 없습니다.'
            });
        }

        if (!content || content.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: '메시지 내용은 필수입니다.'
            });
        }

        await message.update({
            content: content.trim(),
            is_edited: true
        });

        res.json({
            success: true,
            data: message
        });
    } catch (error) {
        logger.error('메시지 수정 실패:', error);
        res.status(500).json({
            success: false,
            error: '메시지 수정에 실패했습니다.'
        });
    }
}));

// 메시지 삭제
router.delete('/messages/:messageId', protect, asyncHandler(async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user.id;

        const message = await ChatMessage.findOne({
            where: { id: messageId, user_id: userId, is_deleted: false }
        });

        if (!message) {
            return res.status(404).json({
                success: false,
                error: '메시지를 찾을 수 없습니다.'
            });
        }

        await message.update({ is_deleted: true });

        res.json({
            success: true,
            message: '메시지가 삭제되었습니다.'
        });
    } catch (error) {
        logger.error('메시지 삭제 실패:', error);
        res.status(500).json({
            success: false,
            error: '메시지 삭제에 실패했습니다.'
        });
    }
}));

// 메시지 읽음 처리
router.post('/rooms/:roomId/read', protect, asyncHandler(async (req, res) => {
    try {
        const { roomId } = req.params;
        const userId = req.user.id;

        const member = await ChatRoomMember.findOne({
            where: { room_id: roomId, user_id: userId, is_active: true }
        });

        if (!member) {
            return res.status(403).json({
                success: false,
                error: '채팅방에 참여하지 않았습니다.'
            });
        }

        await member.update({ last_read_at: new Date() });

        res.json({
            success: true,
            message: '읽음 처리되었습니다.'
        });
    } catch (error) {
        logger.error('읽음 처리 실패:', error);
        res.status(500).json({
            success: false,
            error: '읽음 처리에 실패했습니다.'
        });
    }
}));

module.exports = router;
