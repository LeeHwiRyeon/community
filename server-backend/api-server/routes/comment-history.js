const express = require('express');
const CommentHistory = require('../models/CommentHistory');
const Comment = require('../models/Comment');

const router = express.Router();

// 댓글 수정 이력 생성
router.post('/', async (req, res) => {
    try {
        const {
            commentId,
            content,
            previousContent,
            changeType,
            editedBy,
            editedByName,
            changeReason,
            ipAddress,
            userAgent,
            metadata
        } = req.body;

        if (!commentId || !content || !changeType) {
            return res.status(400).json({
                success: false,
                message: 'commentId, content, and changeType are required'
            });
        }

        // 댓글 존재 확인
        const comment = await Comment.findOne({
            where: { id: commentId }
        });

        if (!comment) {
            return res.status(404).json({
                success: false,
                message: 'Comment not found'
            });
        }

        const history = await CommentHistory.createHistory(
            commentId,
            content,
            previousContent,
            changeType,
            editedBy,
            editedByName,
            changeReason,
            ipAddress || req.ip,
            userAgent || req.get('User-Agent'),
            metadata
        );

        res.json({
            success: true,
            data: history
        });
    } catch (error) {
        console.error('Error creating comment history:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create comment history',
            error: error.message
        });
    }
});

// 댓글의 수정 이력 조회
router.get('/comment/:commentId', async (req, res) => {
    try {
        const { commentId } = req.params;
        const { includeDeleted = false } = req.query;

        const history = await CommentHistory.getCommentHistory(
            commentId,
            includeDeleted === 'true'
        );

        res.json({
            success: true,
            data: history
        });
    } catch (error) {
        console.error('Error fetching comment history:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch comment history',
            error: error.message
        });
    }
});

// 특정 버전의 댓글 내용 조회
router.get('/comment/:commentId/version/:version', async (req, res) => {
    try {
        const { commentId, version } = req.params;

        const history = await CommentHistory.getVersionContent(commentId, parseInt(version));

        if (!history) {
            return res.status(404).json({
                success: false,
                message: 'Version not found'
            });
        }

        res.json({
            success: true,
            data: history
        });
    } catch (error) {
        console.error('Error fetching version content:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch version content',
            error: error.message
        });
    }
});

// 댓글 수정 통계 조회
router.get('/stats', async (req, res) => {
    try {
        const { commentId, editedBy } = req.query;

        const stats = await CommentHistory.getEditStats(commentId, editedBy);

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error fetching edit stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch edit stats',
            error: error.message
        });
    }
});

// 댓글 버전 비교
router.get('/compare/:commentId', async (req, res) => {
    try {
        const { commentId } = req.params;
        const { version1, version2 } = req.query;

        if (!version1 || !version2) {
            return res.status(400).json({
                success: false,
                message: 'version1 and version2 are required'
            });
        }

        const comparison = await CommentHistory.compareVersions(
            commentId,
            parseInt(version1),
            parseInt(version2)
        );

        if (!comparison) {
            return res.status(404).json({
                success: false,
                message: 'One or both versions not found'
            });
        }

        res.json({
            success: true,
            data: comparison
        });
    } catch (error) {
        console.error('Error comparing versions:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to compare versions',
            error: error.message
        });
    }
});

// 댓글 수정 이력 삭제 (소프트 삭제)
router.delete('/comment/:commentId', async (req, res) => {
    try {
        const { commentId } = req.params;
        const { version } = req.query;

        const result = await CommentHistory.softDelete(commentId, version ? parseInt(version) : null);

        if (result) {
            res.json({
                success: true,
                message: 'Comment history deleted successfully'
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to delete comment history'
            });
        }
    } catch (error) {
        console.error('Error deleting comment history:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete comment history',
            error: error.message
        });
    }
});

// 댓글 수정 이력 복원
router.post('/restore/:commentId/:version', async (req, res) => {
    try {
        const { commentId, version } = req.params;
        const { editedBy, editedByName, changeReason } = req.body;

        // 해당 버전의 이력 조회
        const history = await CommentHistory.findOne({
            where: { commentId, version: parseInt(version) }
        });

        if (!history) {
            return res.status(404).json({
                success: false,
                message: 'Version not found'
            });
        }

        // 현재 댓글 내용 조회
        const currentComment = await Comment.findOne({
            where: { id: commentId }
        });

        if (!currentComment) {
            return res.status(404).json({
                success: false,
                message: 'Comment not found'
            });
        }

        // 댓글 내용 복원
        await currentComment.update({
            content: history.content,
            isEdited: true,
            editedAt: new Date()
        });

        // 복원 이력 생성
        const restoreHistory = await CommentHistory.createHistory(
            commentId,
            history.content,
            currentComment.content,
            'restore',
            editedBy,
            editedByName,
            changeReason || 'Version restored',
            req.ip,
            req.get('User-Agent')
        );

        res.json({
            success: true,
            data: {
                comment: currentComment,
                history: restoreHistory
            }
        });
    } catch (error) {
        console.error('Error restoring comment version:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to restore comment version',
            error: error.message
        });
    }
});

// 댓글 수정 이력 검색
router.get('/search', async (req, res) => {
    try {
        const {
            commentId,
            editedBy,
            changeType,
            startDate,
            endDate,
            searchContent,
            page = 1,
            limit = 20
        } = req.query;

        const whereClause = {};

        if (commentId) whereClause.commentId = commentId;
        if (editedBy) whereClause.editedBy = editedBy;
        if (changeType) whereClause.changeType = changeType;
        if (searchContent) {
            whereClause.content = {
                [require('sequelize').Op.like]: `%${searchContent}%`
            };
        }
        if (startDate || endDate) {
            whereClause.createdAt = {};
            if (startDate) whereClause.createdAt[require('sequelize').Op.gte] = new Date(startDate);
            if (endDate) whereClause.createdAt[require('sequelize').Op.lte] = new Date(endDate);
        }

        const offset = (parseInt(page) - 1) * parseInt(limit);

        const { count, rows } = await CommentHistory.findAndCountAll({
            where: whereClause,
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: offset
        });

        res.json({
            success: true,
            data: {
                history: rows,
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(count / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error searching comment history:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to search comment history',
            error: error.message
        });
    }
});

module.exports = router;
