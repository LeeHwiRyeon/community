const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CommentReaction = sequelize.define('CommentReaction', {
    id: {
        type: DataTypes.STRING(64),
        primaryKey: true
    },
    commentId: {
        type: DataTypes.STRING(64),
        allowNull: false,
        comment: '댓글 ID'
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: '사용자 ID (null이면 익명 반응)'
    },
    reactionType: {
        type: DataTypes.ENUM('like', 'dislike', 'love', 'laugh', 'angry', 'sad', 'wow'),
        allowNull: false,
        comment: '반응 타입'
    },
    emoji: {
        type: DataTypes.STRING(10),
        allowNull: true,
        comment: '이모지 (사용자 정의 반응)'
    },
    ipAddress: {
        type: DataTypes.STRING(45),
        allowNull: true,
        comment: 'IP 주소 (익명 반응용)'
    },
    userAgent: {
        type: DataTypes.STRING(500),
        allowNull: true,
        comment: '사용자 에이전트'
    },
    isAnonymous: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: '익명 반응 여부'
    }
}, {
    tableName: 'comment_reactions',
    timestamps: true,
    indexes: [
        {
            fields: ['commentId', 'reactionType']
        },
        {
            fields: ['userId', 'commentId']
        },
        {
            fields: ['ipAddress', 'commentId']
        },
        {
            unique: true,
            fields: ['commentId', 'userId', 'reactionType'],
            name: 'unique_user_reaction'
        },
        {
            unique: true,
            fields: ['commentId', 'ipAddress', 'reactionType'],
            name: 'unique_ip_reaction'
        }
    ]
});

// 댓글과의 관계 설정
CommentReaction.belongsTo(require('./Comment'), {
    foreignKey: 'commentId',
    as: 'comment'
});

// 반응 통계 조회 함수
CommentReaction.getReactionStats = async function (commentId) {
    try {
        const stats = await CommentReaction.findAll({
            where: { commentId },
            attributes: [
                'reactionType',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            group: ['reactionType'],
            raw: true
        });

        const result = {
            total: 0,
            reactions: {}
        };

        stats.forEach(stat => {
            const count = parseInt(stat.count);
            result.reactions[stat.reactionType] = count;
            result.total += count;
        });

        return result;
    } catch (error) {
        console.error('Error getting reaction stats:', error);
        return { total: 0, reactions: {} };
    }
};

// 사용자 반응 조회 함수
CommentReaction.getUserReactions = async function (commentId, userId = null, ipAddress = null) {
    try {
        const whereClause = { commentId };

        if (userId) {
            whereClause.userId = userId;
        } else if (ipAddress) {
            whereClause.ipAddress = ipAddress;
            whereClause.isAnonymous = true;
        }

        const reactions = await CommentReaction.findAll({
            where: whereClause,
            attributes: ['reactionType', 'emoji']
        });

        return reactions.map(r => ({
            type: r.reactionType,
            emoji: r.emoji
        }));
    } catch (error) {
        console.error('Error getting user reactions:', error);
        return [];
    }
};

// 반응 추가/제거 함수
CommentReaction.toggleReaction = async function (commentId, userId, reactionType, emoji = null, ipAddress = null) {
    try {
        const whereClause = { commentId, reactionType };

        if (userId) {
            whereClause.userId = userId;
        } else if (ipAddress) {
            whereClause.ipAddress = ipAddress;
            whereClause.isAnonymous = true;
        }

        const existingReaction = await CommentReaction.findOne({
            where: whereClause
        });

        if (existingReaction) {
            // 기존 반응 제거
            await existingReaction.destroy();
            return { action: 'removed', reaction: null };
        } else {
            // 새 반응 추가
            const reactionId = `reaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const newReaction = await CommentReaction.create({
                id: reactionId,
                commentId,
                userId: userId || null,
                reactionType,
                emoji,
                ipAddress: ipAddress || null,
                isAnonymous: !userId
            });
            return { action: 'added', reaction: newReaction };
        }
    } catch (error) {
        console.error('Error toggling reaction:', error);
        throw error;
    }
};

module.exports = CommentReaction;

