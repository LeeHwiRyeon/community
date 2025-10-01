const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ReadStatus = sequelize.define('ReadStatus', {
    id: {
        type: DataTypes.STRING(64),
        primaryKey: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: '사용자 ID (null이면 익명 사용자)'
    },
    postId: {
        type: DataTypes.STRING(64),
        allowNull: false,
        comment: '게시물 ID'
    },
    boardId: {
        type: DataTypes.STRING(64),
        allowNull: false,
        comment: '게시판 ID'
    },
    communityId: {
        type: DataTypes.STRING(64),
        allowNull: true,
        comment: '커뮤니티 ID'
    },
    readAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        comment: '읽은 시간'
    },
    readDuration: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'read_duration',
        comment: '읽은 시간 (초)'
    },
    isFullyRead: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_fully_read',
        comment: '완전히 읽었는지 여부'
    },
    scrollPosition: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'scroll_position',
        comment: '스크롤 위치 (픽셀)'
    },
    ipAddress: {
        type: DataTypes.STRING(45),
        allowNull: true,
        field: 'ip_address',
        comment: 'IP 주소 (익명 사용자용)'
    },
    userAgent: {
        type: DataTypes.STRING(500),
        allowNull: true,
        field: 'user_agent',
        comment: '사용자 에이전트'
    },
    deviceType: {
        type: DataTypes.ENUM('desktop', 'mobile', 'tablet'),
        allowNull: true,
        field: 'device_type',
        comment: '디바이스 타입'
    },
    isAnonymous: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_anonymous',
        comment: '익명 사용자 여부'
    }
}, {
    tableName: 'read_status',
    timestamps: true,
    indexes: [
        {
            fields: ['userId', 'postId']
        },
        {
            fields: ['ipAddress', 'postId']
        },
        {
            fields: ['boardId', 'readAt']
        },
        {
            fields: ['communityId', 'readAt']
        },
        {
            unique: true,
            fields: ['userId', 'postId'],
            name: 'unique_user_post_read'
        },
        {
            unique: true,
            fields: ['ipAddress', 'postId'],
            name: 'unique_ip_post_read'
        }
    ]
});

// 게시물과의 관계 설정
ReadStatus.belongsTo(require('./Post'), {
    foreignKey: 'postId',
    as: 'post'
});

// 사용자 읽음 상태 조회 함수
ReadStatus.getUserReadStatus = async function (userId = null, ipAddress = null) {
    try {
        const whereClause = {};

        if (userId) {
            whereClause.userId = userId;
        } else if (ipAddress) {
            whereClause.ipAddress = ipAddress;
            whereClause.isAnonymous = true;
        }

        const readStatuses = await ReadStatus.findAll({
            where: whereClause,
            order: [['readAt', 'DESC']]
        });

        return readStatuses;
    } catch (error) {
        console.error('Error getting user read status:', error);
        return [];
    }
};

// 특정 게시물의 읽음 상태 조회
ReadStatus.getPostReadStatus = async function (postId, userId = null, ipAddress = null) {
    try {
        const whereClause = { postId };

        if (userId) {
            whereClause.userId = userId;
        } else if (ipAddress) {
            whereClause.ipAddress = ipAddress;
            whereClause.isAnonymous = true;
        }

        const readStatus = await ReadStatus.findOne({
            where: whereClause
        });

        return readStatus;
    } catch (error) {
        console.error('Error getting post read status:', error);
        return null;
    }
};

// 읽음 상태 업데이트/생성
ReadStatus.updateReadStatus = async function (postId, boardId, communityId, userId, readDuration = null, scrollPosition = null, ipAddress = null, userAgent = null, deviceType = null) {
    try {
        const whereClause = { postId };

        if (userId) {
            whereClause.userId = userId;
        } else if (ipAddress) {
            whereClause.ipAddress = ipAddress;
            whereClause.isAnonymous = true;
        }

        const existingStatus = await ReadStatus.findOne({
            where: whereClause
        });

        const readStatusData = {
            postId,
            boardId,
            communityId: communityId || null,
            readDuration,
            scrollPosition,
            ipAddress: ipAddress || null,
            userAgent: userAgent || null,
            deviceType: deviceType || null,
            isAnonymous: !userId
        };

        if (existingStatus) {
            // 기존 읽음 상태 업데이트
            await existingStatus.update({
                ...readStatusData,
                readAt: new Date(),
                isFullyRead: readDuration && readDuration > 30 // 30초 이상 읽으면 완전히 읽은 것으로 간주
            });
            return existingStatus;
        } else {
            // 새 읽음 상태 생성
            const readStatusId = `read_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const newStatus = await ReadStatus.create({
                id: readStatusId,
                userId: userId || null,
                ...readStatusData
            });
            return newStatus;
        }
    } catch (error) {
        console.error('Error updating read status:', error);
        throw error;
    }
};

// 읽지 않은 게시물 조회
ReadStatus.getUnreadPosts = async function (boardId, communityId = null, userId = null, ipAddress = null) {
    try {
        const whereClause = { boardId };
        if (communityId) {
            whereClause.communityId = communityId;
        }

        // 읽은 게시물 ID 목록 조회
        const readClause = {};
        if (userId) {
            readClause.userId = userId;
        } else if (ipAddress) {
            readClause.ipAddress = ipAddress;
            readClause.isAnonymous = true;
        }

        const readPostIds = await ReadStatus.findAll({
            where: readClause,
            attributes: ['postId'],
            raw: true
        });

        const readIds = readPostIds.map(r => r.postId);

        // 읽지 않은 게시물 조회
        const Post = require('./Post');
        const unreadPosts = await Post.findAll({
            where: {
                ...whereClause,
                id: {
                    [require('sequelize').Op.notIn]: readIds
                },
                deleted: false
            },
            order: [['createdAt', 'DESC']]
        });

        return unreadPosts;
    } catch (error) {
        console.error('Error getting unread posts:', error);
        return [];
    }
};

// 읽음 통계 조회
ReadStatus.getReadStats = async function (boardId = null, communityId = null, userId = null) {
    try {
        const whereClause = {};
        if (boardId) whereClause.boardId = boardId;
        if (communityId) whereClause.communityId = communityId;
        if (userId) whereClause.userId = userId;

        const stats = await ReadStatus.findAll({
            where: whereClause,
            attributes: [
                [sequelize.fn('COUNT', sequelize.col('id')), 'totalRead'],
                [sequelize.fn('COUNT', sequelize.literal('CASE WHEN is_fully_read = 1 THEN 1 END')), 'fullyRead'],
                [sequelize.fn('AVG', sequelize.col('read_duration')), 'avgReadDuration'],
                [sequelize.fn('MAX', sequelize.col('read_at')), 'lastReadAt']
            ],
            raw: true
        });

        return stats[0] || {
            totalRead: 0,
            fullyRead: 0,
            avgReadDuration: 0,
            lastReadAt: null
        };
    } catch (error) {
        console.error('Error getting read stats:', error);
        return {
            totalRead: 0,
            fullyRead: 0,
            avgReadDuration: 0,
            lastReadAt: null
        };
    }
};

module.exports = ReadStatus;
