const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CommentReport = sequelize.define('CommentReport', {
    id: {
        type: DataTypes.STRING(64),
        primaryKey: true,
        comment: '신고 고유 ID'
    },
    commentId: {
        type: DataTypes.STRING(64),
        allowNull: false,
        field: 'comment_id',
        comment: '신고된 댓글 ID'
    },
    reporterId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'reporter_id',
        comment: '신고자 ID (익명 신고 가능)'
    },
    reporterName: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: 'reporter_name',
        comment: '신고자 닉네임'
    },
    reportType: {
        type: DataTypes.ENUM(
            'spam',           // 스팸
            'harassment',     // 괴롭힘
            'hate_speech',    // 혐오 발언
            'inappropriate',  // 부적절한 내용
            'violence',       // 폭력
            'fake_news',      // 가짜 뉴스
            'copyright',      // 저작권 침해
            'privacy',        // 개인정보 침해
            'other'           // 기타
        ),
        allowNull: false,
        field: 'report_type',
        comment: '신고 유형'
    },
    reason: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '신고 사유 상세'
    },
    status: {
        type: DataTypes.ENUM('pending', 'reviewing', 'resolved', 'dismissed'),
        defaultValue: 'pending',
        comment: '신고 처리 상태'
    },
    adminNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'admin_notes',
        comment: '관리자 처리 메모'
    },
    resolvedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'resolved_by',
        comment: '처리한 관리자 ID'
    },
    resolvedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'resolved_at',
        comment: '처리 완료 시간'
    },
    actionTaken: {
        type: DataTypes.ENUM(
            'none',           // 조치 없음
            'warning',        // 경고
            'comment_hidden', // 댓글 숨김
            'comment_deleted', // 댓글 삭제
            'user_warned',    // 사용자 경고
            'user_suspended', // 사용자 정지
            'user_banned'     // 사용자 차단
        ),
        allowNull: true,
        field: 'action_taken',
        comment: '취해진 조치'
    },
    priority: {
        type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
        defaultValue: 'medium',
        comment: '신고 우선순위'
    },
    isAnonymous: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_anonymous',
        comment: '익명 신고 여부'
    },
    ipAddress: {
        type: DataTypes.STRING(45),
        allowNull: true,
        field: 'ip_address',
        comment: '신고자 IP 주소'
    },
    userAgent: {
        type: DataTypes.STRING(500),
        allowNull: true,
        field: 'user_agent',
        comment: '신고자 User Agent'
    },
    metadata: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: '추가 메타데이터'
    }
}, {
    tableName: 'comment_reports',
    timestamps: true,
    underscored: true,
    indexes: [
        { fields: ['comment_id'] },
        { fields: ['reporter_id'] },
        { fields: ['report_type'] },
        { fields: ['status'] },
        { fields: ['priority'] },
        { fields: ['created_at'] },
        { fields: ['resolved_at'] }
    ]
});

// Associations
CommentReport.belongsTo(require('./Comment'), {
    foreignKey: 'commentId',
    as: 'comment'
});

CommentReport.belongsTo(require('./User'), {
    foreignKey: 'reporterId',
    as: 'reporter'
});

CommentReport.belongsTo(require('./User'), {
    foreignKey: 'resolvedBy',
    as: 'resolver'
});

module.exports = CommentReport;
