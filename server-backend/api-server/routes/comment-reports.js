const express = require('express');
const router = express.Router();
const { CommentReport } = require('../models/CommentReport');
const { Comment } = require('../models/Comment');
const { User } = require('../models/User');
const { logger } = require('../utils/logger');

// 댓글 신고 생성
router.post('/', async (req, res) => {
    try {
        const {
            commentId,
            reportType,
            reason,
            isAnonymous = false,
            reporterName
        } = req.body;

        const reporterId = req.user?.id || null;
        const ipAddress = req.ip || req.connection.remoteAddress;
        const userAgent = req.get('User-Agent');

        // 댓글 존재 확인
        const comment = await Comment.findByPk(commentId);
        if (!comment) {
            return res.status(404).json({
                success: false,
                error: { message: '댓글을 찾을 수 없습니다.' }
            });
        }

        // 중복 신고 확인 (같은 사용자가 같은 댓글을 신고한 경우)
        if (reporterId) {
            const existingReport = await CommentReport.findOne({
                where: {
                    commentId,
                    reporterId
                }
            });

            if (existingReport) {
                return res.status(400).json({
                    success: false,
                    error: { message: '이미 신고한 댓글입니다.' }
                });
            }
        }

        // 신고 생성
        const report = await CommentReport.create({
            id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            commentId,
            reporterId,
            reporterName: isAnonymous ? null : (reporterName || req.user?.username),
            reportType,
            reason,
            isAnonymous,
            ipAddress,
            userAgent,
            metadata: {
                commentContent: comment.content.substring(0, 200), // 댓글 내용 일부 저장
                commentAuthor: comment.authorName
            }
        });

        // 신고 통계 업데이트
        await updateReportStats(commentId);

        res.status(201).json({
            success: true,
            data: {
                reportId: report.id,
                message: '신고가 접수되었습니다.'
            }
        });

    } catch (error) {
        console.error('Error creating comment report:', error);
        res.status(500).json({
            success: false,
            error: { message: '신고 접수 중 오류가 발생했습니다.' }
        });
    }
});

// 신고 목록 조회 (관리자용)
router.get('/', async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            status = 'pending',
            reportType,
            priority,
            sortBy = 'created_at',
            sortOrder = 'DESC'
        } = req.query;

        const offset = (page - 1) * limit;
        const where = {};

        if (status) where.status = status;
        if (reportType) where.reportType = reportType;
        if (priority) where.priority = priority;

        const { count, rows: reports } = await CommentReport.findAndCountAll({
            where,
            include: [
                {
                    model: Comment,
                    as: 'comment',
                    attributes: ['id', 'content', 'authorName', 'createdAt']
                },
                {
                    model: User,
                    as: 'reporter',
                    attributes: ['id', 'username', 'email']
                },
                {
                    model: User,
                    as: 'resolver',
                    attributes: ['id', 'username']
                }
            ],
            order: [[sortBy, sortOrder]],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.json({
            success: true,
            data: {
                reports,
                pagination: {
                    total: count,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(count / limit)
                }
            }
        });

    } catch (error) {
        console.error('Error fetching comment reports:', error);
        res.status(500).json({
            success: false,
            error: { message: '신고 목록 조회 중 오류가 발생했습니다.' }
        });
    }
});

// 특정 신고 조회
router.get('/:reportId', async (req, res) => {
    try {
        const { reportId } = req.params;

        const report = await CommentReport.findByPk(reportId, {
            include: [
                {
                    model: Comment,
                    as: 'comment',
                    attributes: ['id', 'content', 'authorName', 'createdAt', 'postId']
                },
                {
                    model: User,
                    as: 'reporter',
                    attributes: ['id', 'username', 'email']
                },
                {
                    model: User,
                    as: 'resolver',
                    attributes: ['id', 'username']
                }
            ]
        });

        if (!report) {
            return res.status(404).json({
                success: false,
                error: { message: '신고를 찾을 수 없습니다.' }
            });
        }

        res.json({
            success: true,
            data: { report }
        });

    } catch (error) {
        console.error('Error fetching comment report:', error);
        res.status(500).json({
            success: false,
            error: { message: '신고 조회 중 오류가 발생했습니다.' }
        });
    }
});

// 신고 처리 (관리자용)
router.put('/:reportId/resolve', async (req, res) => {
    try {
        const { reportId } = req.params;
        const {
            status,
            actionTaken,
            adminNotes,
            priority
        } = req.body;

        const report = await CommentReport.findByPk(reportId);
        if (!report) {
            return res.status(404).json({
                success: false,
                error: { message: '신고를 찾을 수 없습니다.' }
            });
        }

        // 신고 처리
        await report.update({
            status: status || 'resolved',
            actionTaken,
            adminNotes,
            priority,
            resolvedBy: req.user?.id,
            resolvedAt: new Date()
        });

        // 조치에 따른 후속 처리
        if (actionTaken) {
            await handleReportAction(report, actionTaken);
        }

        res.json({
            success: true,
            data: {
                message: '신고가 처리되었습니다.',
                report
            }
        });

    } catch (error) {
        console.error('Error resolving comment report:', error);
        res.status(500).json({
            success: false,
            error: { message: '신고 처리 중 오류가 발생했습니다.' }
        });
    }
});

// 신고 통계 조회
router.get('/stats/overview', async (req, res) => {
    try {
        const stats = await CommentReport.findAll({
            attributes: [
                'status',
                'reportType',
                'priority',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            group: ['status', 'reportType', 'priority'],
            raw: true
        });

        const totalReports = await CommentReport.count();
        const pendingReports = await CommentReport.count({ where: { status: 'pending' } });
        const resolvedReports = await CommentReport.count({ where: { status: 'resolved' } });

        res.json({
            success: true,
            data: {
                totalReports,
                pendingReports,
                resolvedReports,
                stats
            }
        });

    } catch (error) {
        console.error('Error fetching report stats:', error);
        res.status(500).json({
            success: false,
            error: { message: '신고 통계 조회 중 오류가 발생했습니다.' }
        });
    }
});

// 댓글별 신고 조회
router.get('/comment/:commentId', async (req, res) => {
    try {
        const { commentId } = req.params;

        const reports = await CommentReport.findAll({
            where: { commentId },
            include: [
                {
                    model: User,
                    as: 'reporter',
                    attributes: ['id', 'username']
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.json({
            success: true,
            data: { reports }
        });

    } catch (error) {
        console.error('Error fetching comment reports:', error);
        res.status(500).json({
            success: false,
            error: { message: '댓글 신고 조회 중 오류가 발생했습니다.' }
        });
    }
});

// 신고 삭제 (관리자용)
router.delete('/:reportId', async (req, res) => {
    try {
        const { reportId } = req.params;

        const report = await CommentReport.findByPk(reportId);
        if (!report) {
            return res.status(404).json({
                success: false,
                error: { message: '신고를 찾을 수 없습니다.' }
            });
        }

        await report.destroy();

        res.json({
            success: true,
            data: { message: '신고가 삭제되었습니다.' }
        });

    } catch (error) {
        console.error('Error deleting comment report:', error);
        res.status(500).json({
            success: false,
            error: { message: '신고 삭제 중 오류가 발생했습니다.' }
        });
    }
});

// 신고 통계 업데이트 헬퍼 함수
async function updateReportStats(commentId) {
    try {
        const reportCount = await CommentReport.count({
            where: { commentId, status: 'pending' }
        });

        // 댓글에 신고 수 업데이트 (필요한 경우)
        // await Comment.update(
        //   { reportCount },
        //   { where: { id: commentId } }
        // );
    } catch (error) {
        console.error('Error updating report stats:', error);
    }
}

// 신고 조치 처리 헬퍼 함수
async function handleReportAction(report, actionTaken) {
    try {
        const { commentId } = report;

        switch (actionTaken) {
            case 'comment_hidden':
                await Comment.update(
                    { isHidden: true },
                    { where: { id: commentId } }
                );
                break;

            case 'comment_deleted':
                await Comment.update(
                    { isDeleted: true, deletedAt: new Date() },
                    { where: { id: commentId } }
                );
                break;

            case 'user_warned':
                // 사용자 경고 로직 (추후 구현)
                break;

            case 'user_suspended':
                // 사용자 정지 로직 (추후 구현)
                break;

            case 'user_banned':
                // 사용자 차단 로직 (추후 구현)
                break;
        }
    } catch (error) {
        console.error('Error handling report action:', error);
    }
}

module.exports = router;
