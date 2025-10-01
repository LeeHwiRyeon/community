const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CommentHistory = sequelize.define('CommentHistory', {
    id: {
        type: DataTypes.STRING(64),
        primaryKey: true
    },
    commentId: {
        type: DataTypes.STRING(64),
        allowNull: false,
        field: 'comment_id',
        comment: '댓글 ID'
    },
    version: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        comment: '수정 버전 번호'
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment: '수정된 댓글 내용'
    },
    previousContent: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'previous_content',
        comment: '이전 댓글 내용'
    },
    changeType: {
        type: DataTypes.ENUM('create', 'edit', 'delete', 'restore'),
        allowNull: false,
        field: 'change_type',
        comment: '변경 타입'
    },
    changeReason: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'change_reason',
        comment: '변경 사유'
    },
    editedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'edited_by',
        comment: '수정한 사용자 ID'
    },
    editedByName: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: 'edited_by_name',
        comment: '수정한 사용자 이름'
    },
    ipAddress: {
        type: DataTypes.STRING(45),
        allowNull: true,
        field: 'ip_address',
        comment: 'IP 주소'
    },
    userAgent: {
        type: DataTypes.STRING(500),
        allowNull: true,
        field: 'user_agent',
        comment: '사용자 에이전트'
    },
    metadata: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: '추가 메타데이터 (변경된 필드, 변경량 등)'
    },
    isVisible: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'is_visible',
        comment: '사용자에게 표시 여부'
    }
}, {
    tableName: 'comment_history',
    timestamps: true,
    indexes: [
        {
            fields: ['commentId']
        },
        {
            fields: ['commentId', 'version']
        },
        {
            fields: ['editedBy']
        },
        {
            fields: ['changeType']
        },
        {
            fields: ['createdAt']
        }
    ]
});

// 댓글과의 관계 설정
CommentHistory.belongsTo(require('./Comment'), {
    foreignKey: 'commentId',
    as: 'comment'
});

// 댓글 수정 이력 생성
CommentHistory.createHistory = async function (commentId, content, previousContent, changeType, editedBy, editedByName, changeReason = null, ipAddress = null, userAgent = null, metadata = null) {
    try {
        // 현재 최대 버전 번호 조회
        const maxVersion = await CommentHistory.max('version', {
            where: { commentId }
        });

        const version = (maxVersion || 0) + 1;

        const historyId = `comment_history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const history = await CommentHistory.create({
            id: historyId,
            commentId,
            version,
            content,
            previousContent,
            changeType,
            changeReason,
            editedBy,
            editedByName,
            ipAddress,
            userAgent,
            metadata
        });

        return history;
    } catch (error) {
        console.error('Error creating comment history:', error);
        throw error;
    }
};

// 댓글의 수정 이력 조회
CommentHistory.getCommentHistory = async function (commentId, includeDeleted = false) {
    try {
        const whereClause = { commentId };
        if (!includeDeleted) {
            whereClause.isVisible = true;
        }

        const history = await CommentHistory.findAll({
            where: whereClause,
            order: [['version', 'DESC']]
        });

        return history;
    } catch (error) {
        console.error('Error getting comment history:', error);
        return [];
    }
};

// 특정 버전의 댓글 내용 조회
CommentHistory.getVersionContent = async function (commentId, version) {
    try {
        const history = await CommentHistory.findOne({
            where: { commentId, version }
        });

        return history;
    } catch (error) {
        console.error('Error getting version content:', error);
        return null;
    }
};

// 댓글 수정 통계 조회
CommentHistory.getEditStats = async function (commentId = null, editedBy = null) {
    try {
        const whereClause = {};
        if (commentId) whereClause.commentId = commentId;
        if (editedBy) whereClause.editedBy = editedBy;

        const stats = await CommentHistory.findAll({
            where: whereClause,
            attributes: [
                [sequelize.fn('COUNT', sequelize.col('id')), 'totalEdits'],
                [sequelize.fn('COUNT', sequelize.literal('CASE WHEN changeType = "edit" THEN 1 END')), 'editCount'],
                [sequelize.fn('COUNT', sequelize.literal('CASE WHEN changeType = "delete" THEN 1 END')), 'deleteCount'],
                [sequelize.fn('COUNT', sequelize.literal('CASE WHEN changeType = "restore" THEN 1 END')), 'restoreCount'],
                [sequelize.fn('MAX', sequelize.col('createdAt')), 'lastEditAt']
            ],
            raw: true
        });

        return stats[0] || {
            totalEdits: 0,
            editCount: 0,
            deleteCount: 0,
            restoreCount: 0,
            lastEditAt: null
        };
    } catch (error) {
        console.error('Error getting edit stats:', error);
        return {
            totalEdits: 0,
            editCount: 0,
            deleteCount: 0,
            restoreCount: 0,
            lastEditAt: null
        };
    }
};

// 댓글 내용 비교
CommentHistory.compareVersions = async function (commentId, version1, version2) {
    try {
        const [v1, v2] = await Promise.all([
            CommentHistory.findOne({ where: { commentId, version: version1 } }),
            CommentHistory.findOne({ where: { commentId, version: version2 } })
        ]);

        if (!v1 || !v2) {
            return null;
        }

        return {
            version1: {
                version: v1.version,
                content: v1.content,
                createdAt: v1.createdAt,
                editedBy: v1.editedByName
            },
            version2: {
                version: v2.version,
                content: v2.content,
                createdAt: v2.createdAt,
                editedBy: v2.editedByName
            },
            changes: {
                contentChanged: v1.content !== v2.content,
                contentLengthChange: v2.content.length - v1.content.length
            }
        };
    } catch (error) {
        console.error('Error comparing versions:', error);
        return null;
    }
};

// 댓글 수정 이력 삭제 (소프트 삭제)
CommentHistory.softDelete = async function (commentId, version = null) {
    try {
        const whereClause = { commentId };
        if (version) {
            whereClause.version = version;
        }

        await CommentHistory.update(
            { isVisible: false },
            { where: whereClause }
        );

        return true;
    } catch (error) {
        console.error('Error soft deleting comment history:', error);
        return false;
    }
};

module.exports = CommentHistory;
