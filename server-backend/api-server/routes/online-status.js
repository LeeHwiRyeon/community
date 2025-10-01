const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { sequelize } = require('../config/database');
const { DataTypes } = require('sequelize');
const { logger } = require('../utils/logger');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// 온라인 상태 모델 정의
const UserOnlineStatus = sequelize.define('UserOnlineStatus', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true
    },
    status: {
        type: DataTypes.STRING(20),
        defaultValue: 'offline' // online, away, busy, offline
    },
    last_seen_at: {
        type: DataTypes.DATE,
        allowNull: false
    },
    is_typing: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    current_room_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
}, {
    tableName: 'user_online_statuses',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

// 사용자 온라인 상태 조회
router.get('/status/:userId', protect, asyncHandler(async (req, res) => {
    try {
        const { userId } = req.params;

        const status = await UserOnlineStatus.findOne({
            where: { user_id: userId }
        });

        if (!status) {
            return res.status(404).json({
                success: false,
                error: '사용자 상태를 찾을 수 없습니다.'
            });
        }

        res.json({
            success: true,
            data: status
        });
    } catch (error) {
        logger.error('온라인 상태 조회 실패:', error);
        res.status(500).json({
            success: false,
            error: '온라인 상태를 불러올 수 없습니다.'
        });
    }
}));

// 내 온라인 상태 조회
router.get('/my-status', protect, asyncHandler(async (req, res) => {
    try {
        const userId = req.user.id;

        let status = await UserOnlineStatus.findOne({
            where: { user_id: userId }
        });

        if (!status) {
            // 상태가 없으면 생성
            status = await UserOnlineStatus.create({
                user_id: userId,
                status: 'offline',
                last_seen_at: new Date()
            });
        }

        res.json({
            success: true,
            data: status
        });
    } catch (error) {
        logger.error('내 온라인 상태 조회 실패:', error);
        res.status(500).json({
            success: false,
            error: '온라인 상태를 불러올 수 없습니다.'
        });
    }
}));

// 온라인 상태 업데이트
router.put('/status', protect, asyncHandler(async (req, res) => {
    try {
        const { status, current_room_id } = req.body;
        const userId = req.user.id;

        const validStatuses = ['online', 'away', 'busy', 'offline'];
        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                error: '유효하지 않은 상태입니다.'
            });
        }

        let userStatus = await UserOnlineStatus.findOne({
            where: { user_id: userId }
        });

        if (!userStatus) {
            userStatus = await UserOnlineStatus.create({
                user_id: userId,
                status: status || 'online',
                last_seen_at: new Date(),
                current_room_id
            });
        } else {
            await userStatus.update({
                status: status || userStatus.status,
                last_seen_at: new Date(),
                current_room_id: current_room_id !== undefined ? current_room_id : userStatus.current_room_id
            });
        }

        res.json({
            success: true,
            data: userStatus
        });
    } catch (error) {
        logger.error('온라인 상태 업데이트 실패:', error);
        res.status(500).json({
            success: false,
            error: '온라인 상태 업데이트에 실패했습니다.'
        });
    }
}));

// 타이핑 상태 업데이트
router.put('/typing', protect, asyncHandler(async (req, res) => {
    try {
        const { is_typing, room_id } = req.body;
        const userId = req.user.id;

        let userStatus = await UserOnlineStatus.findOne({
            where: { user_id: userId }
        });

        if (!userStatus) {
            userStatus = await UserOnlineStatus.create({
                user_id: userId,
                status: 'online',
                last_seen_at: new Date(),
                is_typing: Boolean(is_typing),
                current_room_id: room_id
            });
        } else {
            await userStatus.update({
                is_typing: Boolean(is_typing),
                current_room_id: room_id || userStatus.current_room_id
            });
        }

        res.json({
            success: true,
            data: userStatus
        });
    } catch (error) {
        logger.error('타이핑 상태 업데이트 실패:', error);
        res.status(500).json({
            success: false,
            error: '타이핑 상태 업데이트에 실패했습니다.'
        });
    }
}));

// 온라인 사용자 목록 조회
router.get('/online-users', protect, asyncHandler(async (req, res) => {
    try {
        const { room_id } = req.query;

        const whereClause = {
            status: 'online'
        };

        if (room_id) {
            whereClause.current_room_id = room_id;
        }

        const onlineUsers = await UserOnlineStatus.findAll({
            where: whereClause,
            order: [['last_seen_at', 'DESC']]
        });

        res.json({
            success: true,
            data: onlineUsers
        });
    } catch (error) {
        logger.error('온라인 사용자 목록 조회 실패:', error);
        res.status(500).json({
            success: false,
            error: '온라인 사용자 목록을 불러올 수 없습니다.'
        });
    }
}));

// 마지막 접속 시간 업데이트
router.post('/heartbeat', protect, asyncHandler(async (req, res) => {
    try {
        const userId = req.user.id;

        let userStatus = await UserOnlineStatus.findOne({
            where: { user_id: userId }
        });

        if (!userStatus) {
            userStatus = await UserOnlineStatus.create({
                user_id: userId,
                status: 'online',
                last_seen_at: new Date()
            });
        } else {
            await userStatus.update({
                last_seen_at: new Date()
            });
        }

        res.json({
            success: true,
            data: userStatus
        });
    } catch (error) {
        logger.error('하트비트 업데이트 실패:', error);
        res.status(500).json({
            success: false,
            error: '하트비트 업데이트에 실패했습니다.'
        });
    }
}));

module.exports = router;
