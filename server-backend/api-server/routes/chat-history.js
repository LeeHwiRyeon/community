const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { sequelize } = require('../config/database');
const { DataTypes } = require('sequelize');
const { logger } = require('../utils/logger');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// 채팅 이력 모델 정의 (chat.js에서 이미 정의됨)
const ChatMessage = sequelize.define('ChatMessage', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    room_id: {
        type: DataTypes.INTEGER,
        allowNull: false
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

// 채팅 이력 검색
router.get('/search', protect, asyncHandler(async (req, res) => {
    try {
        const { q, room_id, user_id, message_type, start_date, end_date, page = 1, limit = 20 } = req.query;
        const currentUserId = req.user.id;

        const whereClause = {
            is_deleted: false
        };

        // 검색어가 있으면 내용에서 검색
        if (q) {
            whereClause.content = {
                [sequelize.Op.like]: `%${q}%`
            };
        }

        // 방 필터
        if (room_id) {
            whereClause.room_id = room_id;
        }

        // 사용자 필터
        if (user_id) {
            whereClause.user_id = user_id;
        }

        // 메시지 타입 필터
        if (message_type) {
            whereClause.message_type = message_type;
        }

        // 날짜 범위 필터
        if (start_date || end_date) {
            whereClause.created_at = {};
            if (start_date) {
                whereClause.created_at[sequelize.Op.gte] = new Date(start_date);
            }
            if (end_date) {
                whereClause.created_at[sequelize.Op.lte] = new Date(end_date);
            }
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
                messages,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(count / limit),
                    totalItems: count,
                    itemsPerPage: parseInt(limit)
                }
            }
        });
    } catch (error) {
        logger.error('채팅 이력 검색 실패:', error);
        res.status(500).json({
            success: false,
            error: '채팅 이력을 검색할 수 없습니다.'
        });
    }
}));

// 채팅 이력 내보내기
router.get('/export/:roomId', protect, asyncHandler(async (req, res) => {
    try {
        const { roomId } = req.params;
        const { format = 'json', start_date, end_date } = req.query;
        const userId = req.user.id;

        // 채팅방 참여 확인
        const ChatRoomMember = sequelize.define('ChatRoomMember', {
            id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
            room_id: { type: DataTypes.INTEGER, allowNull: false },
            user_id: { type: DataTypes.INTEGER, allowNull: false },
            role: { type: DataTypes.STRING(50), defaultValue: 'member' },
            is_active: { type: DataTypes.BOOLEAN, defaultValue: true }
        }, { tableName: 'chat_room_members' });

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

        if (start_date || end_date) {
            whereClause.created_at = {};
            if (start_date) {
                whereClause.created_at[sequelize.Op.gte] = new Date(start_date);
            }
            if (end_date) {
                whereClause.created_at[sequelize.Op.lte] = new Date(end_date);
            }
        }

        const messages = await ChatMessage.findAll({
            where: whereClause,
            order: [['created_at', 'ASC']]
        });

        if (format === 'csv') {
            // CSV 형식으로 내보내기
            const csvHeader = 'ID,User ID,Content,Message Type,File Name,File Size,Created At\n';
            const csvData = messages.map(msg =>
                `${msg.id},${msg.user_id},"${msg.content.replace(/"/g, '""')}",${msg.message_type},${msg.file_name || ''},${msg.file_size || ''},${msg.created_at}`
            ).join('\n');

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="chat_history_${roomId}_${new Date().toISOString().split('T')[0]}.csv"`);
            res.send(csvHeader + csvData);
        } else {
            // JSON 형식으로 내보내기
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename="chat_history_${roomId}_${new Date().toISOString().split('T')[0]}.json"`);
            res.json({
                roomId: parseInt(roomId),
                exportDate: new Date().toISOString(),
                messageCount: messages.length,
                messages: messages
            });
        }
    } catch (error) {
        logger.error('채팅 이력 내보내기 실패:', error);
        res.status(500).json({
            success: false,
            error: '채팅 이력을 내보낼 수 없습니다.'
        });
    }
}));

// 채팅 통계 조회
router.get('/stats/:roomId', protect, asyncHandler(async (req, res) => {
    try {
        const { roomId } = req.params;
        const { start_date, end_date } = req.query;
        const userId = req.user.id;

        // 채팅방 참여 확인
        const ChatRoomMember = sequelize.define('ChatRoomMember', {
            id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
            room_id: { type: DataTypes.INTEGER, allowNull: false },
            user_id: { type: DataTypes.INTEGER, allowNull: false },
            role: { type: DataTypes.STRING(50), defaultValue: 'member' },
            is_active: { type: DataTypes.BOOLEAN, defaultValue: true }
        }, { tableName: 'chat_room_members' });

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

        if (start_date || end_date) {
            whereClause.created_at = {};
            if (start_date) {
                whereClause.created_at[sequelize.Op.gte] = new Date(start_date);
            }
            if (end_date) {
                whereClause.created_at[sequelize.Op.lte] = new Date(end_date);
            }
        }

        // 전체 메시지 수
        const totalMessages = await ChatMessage.count({
            where: whereClause
        });

        // 사용자별 메시지 수
        const messagesByUser = await ChatMessage.findAll({
            where: whereClause,
            attributes: [
                'user_id',
                [sequelize.fn('COUNT', sequelize.col('id')), 'message_count']
            ],
            group: ['user_id'],
            order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']]
        });

        // 메시지 타입별 통계
        const messagesByType = await ChatMessage.findAll({
            where: whereClause,
            attributes: [
                'message_type',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            group: ['message_type']
        });

        // 일별 메시지 수
        const messagesByDay = await ChatMessage.findAll({
            where: whereClause,
            attributes: [
                [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            group: [sequelize.fn('DATE', sequelize.col('created_at'))],
            order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']]
        });

        res.json({
            success: true,
            data: {
                totalMessages,
                messagesByUser,
                messagesByType,
                messagesByDay,
                period: {
                    start: start_date || null,
                    end: end_date || null
                }
            }
        });
    } catch (error) {
        logger.error('채팅 통계 조회 실패:', error);
        res.status(500).json({
            success: false,
            error: '채팅 통계를 불러올 수 없습니다.'
        });
    }
}));

// 오래된 메시지 정리
router.delete('/cleanup', protect, asyncHandler(async (req, res) => {
    try {
        const { days = 30, room_id } = req.body;
        const userId = req.user.id;

        // 관리자 권한 확인 (실제 구현에서는 역할 기반 권한 확인)
        const isAdmin = req.user.role === 'admin';
        if (!isAdmin) {
            return res.status(403).json({
                success: false,
                error: '관리자 권한이 필요합니다.'
            });
        }

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        const whereClause = {
            created_at: {
                [sequelize.Op.lt]: cutoffDate
            },
            is_deleted: false
        };

        if (room_id) {
            whereClause.room_id = room_id;
        }

        const deletedCount = await ChatMessage.update(
            { is_deleted: true },
            { where: whereClause }
        );

        res.json({
            success: true,
            message: `${deletedCount[0]}개의 오래된 메시지가 정리되었습니다.`,
            deletedCount: deletedCount[0]
        });
    } catch (error) {
        logger.error('메시지 정리 실패:', error);
        res.status(500).json({
            success: false,
            error: '메시지 정리에 실패했습니다.'
        });
    }
}));

module.exports = router;
