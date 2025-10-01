const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Comment = sequelize.define('Comment', {
    id: {
        type: DataTypes.STRING(64),
        primaryKey: true
    },
    postId: {
        type: DataTypes.STRING(64),
        allowNull: false,
        comment: '게시물 ID'
    },
    parentId: {
        type: DataTypes.STRING(64),
        allowNull: true,
        comment: '부모 댓글 ID (null이면 최상위 댓글)'
    },
    authorId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: '댓글 작성자 ID'
    },
    authorName: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: '댓글 작성자 이름'
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment: '댓글 내용'
    },
    depth: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: '댓글 깊이 (0: 최상위, 1: 1단계 답글, ...)'
    },
    path: {
        type: DataTypes.STRING(500),
        allowNull: true,
        comment: '댓글 경로 (예: "1/2/3" - 댓글 ID들의 경로)'
    },
    likes: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: '좋아요 수'
    },
    dislikes: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: '싫어요 수'
    },
    replies: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: '답글 수'
    },
    isEdited: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: '수정 여부'
    },
    editedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: '수정 시간'
    },
    isDeleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: '삭제 여부'
    },
    deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: '삭제 시간'
    },
    deletedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: '삭제한 사용자 ID'
    },
    ipAddress: {
        type: DataTypes.STRING(45),
        allowNull: true,
        comment: '작성자 IP 주소'
    },
    userAgent: {
        type: DataTypes.STRING(500),
        allowNull: true,
        comment: '사용자 에이전트'
    },
    metadata: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: '추가 메타데이터 (이미지, 링크 등)'
    }
}, {
    tableName: 'comments',
    timestamps: true,
    indexes: [
        {
            fields: ['postId', 'isDeleted', 'createdAt']
        },
        {
            fields: ['parentId', 'isDeleted']
        },
        {
            fields: ['authorId', 'isDeleted']
        },
        {
            fields: ['path']
        },
        {
            fields: ['depth']
        }
    ]
});

// 댓글 관계 설정
Comment.belongsTo(Comment, {
    as: 'parent',
    foreignKey: 'parentId'
});
Comment.hasMany(Comment, {
    as: 'children',
    foreignKey: 'parentId'
});

// 댓글 경로 업데이트 함수
Comment.prototype.updatePath = function () {
    if (this.parentId) {
        return Comment.findByPk(this.parentId).then(parent => {
            if (parent) {
                this.path = parent.path ? `${parent.path}/${this.id}` : this.id;
                return this.save();
            }
        });
    } else {
        this.path = this.id;
        return this.save();
    }
};

// 댓글 깊이 업데이트 함수
Comment.prototype.updateDepth = function () {
    if (this.parentId) {
        return Comment.findByPk(this.parentId).then(parent => {
            if (parent) {
                this.depth = parent.depth + 1;
                return this.save();
            }
        });
    } else {
        this.depth = 0;
        return this.save();
    }
};

// 댓글 트리 구조 생성 함수
Comment.buildCommentTree = async function (comments) {
    const commentMap = new Map();
    const rootComments = [];

    // 댓글을 Map에 저장
    comments.forEach(comment => {
        commentMap.set(comment.id, {
            ...comment.toJSON(),
            children: []
        });
    });

    // 부모-자식 관계 설정
    comments.forEach(comment => {
        const commentData = commentMap.get(comment.id);

        if (comment.parentId && commentMap.has(comment.parentId)) {
            const parent = commentMap.get(comment.parentId);
            parent.children.push(commentData);
        } else {
            rootComments.push(commentData);
        }
    });

    return rootComments;
};

// 댓글 통계 업데이트 함수
Comment.updateCommentStats = async function (commentId) {
    const comment = await Comment.findByPk(commentId);
    if (!comment) return;

    // 답글 수 업데이트
    const replyCount = await Comment.count({
        where: {
            parentId: commentId,
            isDeleted: false
        }
    });

    await comment.update({ replies: replyCount });

    // 부모 댓글의 답글 수도 업데이트
    if (comment.parentId) {
        await Comment.updateCommentStats(comment.parentId);
    }
};

module.exports = Comment;
