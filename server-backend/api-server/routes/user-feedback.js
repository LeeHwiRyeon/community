const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// 사용자 피드백 시스템 클래스
class UserFeedbackSystem {
    constructor() {
        this.feedbacks = new Map();
        this.bugReports = new Map();
        this.featureRequests = new Map();
        this.reviews = new Map();
        this.ratings = new Map();
        this.categories = new Map();
        this.priorities = new Map();
        this.statuses = new Map();
        this.feedbackIdCounter = 1;
        this.initializeCategories();
        this.initializePriorities();
        this.initializeStatuses();
    }

    // 카테고리 초기화
    initializeCategories() {
        const categories = [
            { id: 'bug', name: 'Bug Report', description: '버그 리포트', color: '#e74c3c' },
            { id: 'feature', name: 'Feature Request', description: '기능 요청', color: '#3498db' },
            { id: 'improvement', name: 'Improvement', description: '개선사항', color: '#f39c12' },
            { id: 'question', name: 'Question', description: '질문', color: '#9b59b6' },
            { id: 'complaint', name: 'Complaint', description: '불만사항', color: '#e67e22' },
            { id: 'compliment', name: 'Compliment', description: '칭찬', color: '#27ae60' },
            { id: 'suggestion', name: 'Suggestion', description: '제안', color: '#16a085' },
            { id: 'other', name: 'Other', description: '기타', color: '#95a5a6' }
        ];

        categories.forEach(category => {
            this.categories.set(category.id, category);
        });
    }

    // 우선순위 초기화
    initializePriorities() {
        const priorities = [
            { id: 'critical', name: 'Critical', description: '긴급', level: 1, color: '#e74c3c' },
            { id: 'high', name: 'High', description: '높음', level: 2, color: '#f39c12' },
            { id: 'medium', name: 'Medium', description: '보통', level: 3, color: '#3498db' },
            { id: 'low', name: 'Low', description: '낮음', level: 4, color: '#95a5a6' }
        ];

        priorities.forEach(priority => {
            this.priorities.set(priority.id, priority);
        });
    }

    // 상태 초기화
    initializeStatuses() {
        const statuses = [
            { id: 'new', name: 'New', description: '신규', color: '#3498db' },
            { id: 'open', name: 'Open', description: '진행중', color: '#f39c12' },
            { id: 'in_progress', name: 'In Progress', description: '처리중', color: '#e67e22' },
            { id: 'resolved', name: 'Resolved', description: '해결됨', color: '#27ae60' },
            { id: 'closed', name: 'Closed', description: '종료', color: '#95a5a6' },
            { id: 'duplicate', name: 'Duplicate', description: '중복', color: '#9b59b6' },
            { id: 'invalid', name: 'Invalid', description: '무효', color: '#e74c3c' }
        ];

        statuses.forEach(status => {
            this.statuses.set(status.id, status);
        });
    }

    // 피드백 생성
    createFeedback(feedbackData) {
        const feedbackId = `feedback_${this.feedbackIdCounter++}`;
        const feedback = {
            id: feedbackId,
            type: feedbackData.type, // 'bug', 'feature', 'review', 'rating'
            category: feedbackData.category || 'other',
            priority: feedbackData.priority || 'medium',
            status: 'new',
            title: feedbackData.title,
            description: feedbackData.description,
            userId: feedbackData.userId,
            userEmail: feedbackData.userEmail,
            userName: feedbackData.userName,
            userRole: feedbackData.userRole || 'user',
            device: feedbackData.device || {},
            browser: feedbackData.browser || {},
            os: feedbackData.os || {},
            version: feedbackData.version || '1.0.0',
            url: feedbackData.url || '',
            screenshots: feedbackData.screenshots || [],
            attachments: feedbackData.attachments || [],
            tags: feedbackData.tags || [],
            isPublic: feedbackData.isPublic !== false,
            isAnonymous: feedbackData.isAnonymous || false,
            createdAt: new Date(),
            updatedAt: new Date(),
            resolvedAt: null,
            assignedTo: null,
            comments: [],
            votes: {
                up: 0,
                down: 0,
                users: new Set()
            },
            metadata: {
                wordCount: feedbackData.description?.split(/\s+/).length || 0,
                readingTime: Math.ceil((feedbackData.description?.split(/\s+/).length || 0) / 200),
                lastActivity: new Date(),
                viewCount: 0,
                shareCount: 0
            }
        };

        // 타입별 추가 처리
        if (feedbackData.type === 'bug') {
            this.processBugReport(feedback, feedbackData);
        } else if (feedbackData.type === 'feature') {
            this.processFeatureRequest(feedback, feedbackData);
        } else if (feedbackData.type === 'review') {
            this.processReview(feedback, feedbackData);
        } else if (feedbackData.type === 'rating') {
            this.processRating(feedback, feedbackData);
        }

        this.feedbacks.set(feedbackId, feedback);
        return feedback;
    }

    // 버그 리포트 처리
    processBugReport(feedback, data) {
        feedback.bugReport = {
            severity: data.severity || 'medium',
            steps: data.steps || [],
            expectedResult: data.expectedResult || '',
            actualResult: data.actualResult || '',
            environment: data.environment || {},
            reproduction: data.reproduction || 'always',
            frequency: data.frequency || 'unknown',
            impact: data.impact || 'medium',
            workaround: data.workaround || '',
            relatedIssues: data.relatedIssues || []
        };

        this.bugReports.set(feedback.id, feedback.bugReport);
    }

    // 기능 요청 처리
    processFeatureRequest(feedback, data) {
        feedback.featureRequest = {
            useCase: data.useCase || '',
            benefits: data.benefits || [],
            alternatives: data.alternatives || [],
            complexity: data.complexity || 'medium',
            effort: data.effort || 'medium',
            timeline: data.timeline || 'unknown',
            targetUsers: data.targetUsers || 'all',
            businessValue: data.businessValue || 'medium',
            technicalFeasibility: data.technicalFeasibility || 'unknown'
        };

        this.featureRequests.set(feedback.id, feedback.featureRequest);
    }

    // 리뷰 처리
    processReview(feedback, data) {
        feedback.review = {
            rating: data.rating || 5,
            pros: data.pros || [],
            cons: data.cons || [],
            overall: data.overall || '',
            recommendation: data.recommendation || 'yes',
            helpful: data.helpful || 0,
            verified: data.verified || false,
            purchaseDate: data.purchaseDate || null,
            version: data.version || '1.0.0'
        };

        this.reviews.set(feedback.id, feedback.review);
    }

    // 평점 처리
    processRating(feedback, data) {
        feedback.rating = {
            score: data.score || 5,
            aspects: data.aspects || {},
            overall: data.overall || 5,
            wouldRecommend: data.wouldRecommend || true,
            reason: data.reason || '',
            improvements: data.improvements || []
        };

        this.ratings.set(feedback.id, feedback.rating);
    }

    // 피드백 검색
    searchFeedbacks(query, filters = {}) {
        let feedbacks = Array.from(this.feedbacks.values());

        // 텍스트 검색
        if (query) {
            const searchTerm = query.toLowerCase();
            feedbacks = feedbacks.filter(feedback =>
                feedback.title.toLowerCase().includes(searchTerm) ||
                feedback.description.toLowerCase().includes(searchTerm) ||
                feedback.tags.some(tag => tag.toLowerCase().includes(searchTerm))
            );
        }

        // 필터 적용
        if (filters.type) {
            feedbacks = feedbacks.filter(feedback => feedback.type === filters.type);
        }

        if (filters.category) {
            feedbacks = feedbacks.filter(feedback => feedback.category === filters.category);
        }

        if (filters.priority) {
            feedbacks = feedbacks.filter(feedback => feedback.priority === filters.priority);
        }

        if (filters.status) {
            feedbacks = feedbacks.filter(feedback => feedback.status === filters.status);
        }

        if (filters.userId) {
            feedbacks = feedbacks.filter(feedback => feedback.userId === filters.userId);
        }

        if (filters.dateFrom) {
            feedbacks = feedbacks.filter(feedback => feedback.createdAt >= new Date(filters.dateFrom));
        }

        if (filters.dateTo) {
            feedbacks = feedbacks.filter(feedback => feedback.createdAt <= new Date(filters.dateTo));
        }

        if (filters.isPublic !== undefined) {
            feedbacks = feedbacks.filter(feedback => feedback.isPublic === filters.isPublic);
        }

        return feedbacks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    // 피드백 통계
    getFeedbackStats() {
        const feedbacks = Array.from(this.feedbacks.values());

        const stats = {
            total: feedbacks.length,
            byType: {},
            byCategory: {},
            byPriority: {},
            byStatus: {},
            byUser: {},
            recent: feedbacks.slice(0, 10),
            topRated: feedbacks
                .filter(f => f.type === 'review' && f.review)
                .sort((a, b) => (b.review.rating || 0) - (a.review.rating || 0))
                .slice(0, 10),
            mostVoted: feedbacks
                .sort((a, b) => (b.votes.up - b.votes.down) - (a.votes.up - a.votes.down))
                .slice(0, 10)
        };

        // 타입별 통계
        feedbacks.forEach(feedback => {
            stats.byType[feedback.type] = (stats.byType[feedback.type] || 0) + 1;
            stats.byCategory[feedback.category] = (stats.byCategory[feedback.category] || 0) + 1;
            stats.byPriority[feedback.priority] = (stats.byPriority[feedback.priority] || 0) + 1;
            stats.byStatus[feedback.status] = (stats.byStatus[feedback.status] || 0) + 1;
            stats.byUser[feedback.userId] = (stats.byUser[feedback.userId] || 0) + 1;
        });

        return stats;
    }

    // 피드백 업데이트
    updateFeedback(feedbackId, updateData) {
        const feedback = this.feedbacks.get(feedbackId);
        if (!feedback) return null;

        Object.keys(updateData).forEach(key => {
            if (key !== 'id' && key !== 'createdAt') {
                feedback[key] = updateData[key];
            }
        });

        feedback.updatedAt = new Date();
        feedback.metadata.lastActivity = new Date();

        return feedback;
    }

    // 피드백 상태 변경
    changeStatus(feedbackId, newStatus, userId) {
        const feedback = this.feedbacks.get(feedbackId);
        if (!feedback) return null;

        const oldStatus = feedback.status;
        feedback.status = newStatus;
        feedback.updatedAt = new Date();

        if (newStatus === 'resolved') {
            feedback.resolvedAt = new Date();
        }

        // 상태 변경 로그 추가
        feedback.comments.push({
            id: uuidv4(),
            type: 'status_change',
            content: `Status changed from ${oldStatus} to ${newStatus}`,
            userId: userId,
            createdAt: new Date()
        });

        return feedback;
    }

    // 피드백 할당
    assignFeedback(feedbackId, assigneeId, userId) {
        const feedback = this.feedbacks.get(feedbackId);
        if (!feedback) return null;

        feedback.assignedTo = assigneeId;
        feedback.updatedAt = new Date();

        // 할당 로그 추가
        feedback.comments.push({
            id: uuidv4(),
            type: 'assignment',
            content: `Assigned to ${assigneeId}`,
            userId: userId,
            createdAt: new Date()
        });

        return feedback;
    }

    // 댓글 추가
    addComment(feedbackId, commentData) {
        const feedback = this.feedbacks.get(feedbackId);
        if (!feedback) return null;

        const comment = {
            id: uuidv4(),
            content: commentData.content,
            userId: commentData.userId,
            userName: commentData.userName,
            type: commentData.type || 'comment',
            isInternal: commentData.isInternal || false,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        feedback.comments.push(comment);
        feedback.updatedAt = new Date();
        feedback.metadata.lastActivity = new Date();

        return comment;
    }

    // 투표 처리
    voteFeedback(feedbackId, userId, voteType) {
        const feedback = this.feedbacks.get(feedbackId);
        if (!feedback) return null;

        const userVoteKey = `${userId}_${voteType}`;

        if (feedback.votes.users.has(userVoteKey)) {
            // 이미 투표한 경우 취소
            feedback.votes.users.delete(userVoteKey);
            feedback.votes[voteType]--;
        } else {
            // 새 투표
            feedback.votes.users.add(userVoteKey);
            feedback.votes[voteType]++;
        }

        feedback.updatedAt = new Date();
        return feedback;
    }

    // 피드백 닫기
    closeFeedback(feedbackId, reason, userId) {
        const feedback = this.feedbacks.get(feedbackId);
        if (!feedback) return null;

        feedback.status = 'closed';
        feedback.resolvedAt = new Date();
        feedback.updatedAt = new Date();

        // 닫기 로그 추가
        feedback.comments.push({
            id: uuidv4(),
            type: 'closure',
            content: `Closed: ${reason}`,
            userId: userId,
            createdAt: new Date()
        });

        return feedback;
    }

    // 피드백 복제
    duplicateFeedback(feedbackId, userId) {
        const originalFeedback = this.feedbacks.get(feedbackId);
        if (!originalFeedback) return null;

        const duplicateData = {
            ...originalFeedback,
            title: `Copy of ${originalFeedback.title}`,
            status: 'new',
            userId: userId,
            createdAt: new Date(),
            updatedAt: new Date(),
            resolvedAt: null,
            comments: [],
            votes: { up: 0, down: 0, users: new Set() }
        };

        delete duplicateData.id;
        return this.createFeedback(duplicateData);
    }

    // 피드백 병합
    mergeFeedbacks(sourceId, targetId, userId) {
        const sourceFeedback = this.feedbacks.get(sourceId);
        const targetFeedback = this.feedbacks.get(targetId);

        if (!sourceFeedback || !targetFeedback) return null;

        // 소스 피드백의 정보를 타겟 피드백에 병합
        targetFeedback.description += `\n\n--- Merged from #${sourceId} ---\n${sourceFeedback.description}`;
        targetFeedback.tags = [...new Set([...targetFeedback.tags, ...sourceFeedback.tags])];
        targetFeedback.attachments = [...targetFeedback.attachments, ...sourceFeedback.attachments];
        targetFeedback.screenshots = [...targetFeedback.screenshots, ...sourceFeedback.screenshots];

        // 소스 피드백을 중복으로 표시
        sourceFeedback.status = 'duplicate';
        sourceFeedback.updatedAt = new Date();

        // 병합 로그 추가
        targetFeedback.comments.push({
            id: uuidv4(),
            type: 'merge',
            content: `Merged with #${sourceId}`,
            userId: userId,
            createdAt: new Date()
        });

        return targetFeedback;
    }
}

// 전역 피드백 시스템 인스턴스
const feedbackSystem = new UserFeedbackSystem();

// 미들웨어: 인증 확인
const authenticateUser = (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ success: false, message: '인증이 필요합니다.' });
    }
    req.user = { id: 'user1', role: 'admin' };
    next();
};

// 피드백 생성
router.post('/feedback', async (req, res) => {
    try {
        const feedback = feedbackSystem.createFeedback(req.body);

        res.status(201).json({
            success: true,
            message: '피드백이 생성되었습니다.',
            data: feedback
        });
    } catch (error) {
        console.error('피드백 생성 오류:', error);
        res.status(500).json({
            success: false,
            message: '피드백 생성 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 피드백 목록 조회
router.get('/feedback', async (req, res) => {
    try {
        const { query, type, category, priority, status, userId, dateFrom, dateTo, isPublic } = req.query;
        const feedbacks = feedbackSystem.searchFeedbacks(query, {
            type, category, priority, status, userId, dateFrom, dateTo, isPublic
        });

        res.json({
            success: true,
            data: feedbacks
        });
    } catch (error) {
        console.error('피드백 목록 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '피드백 목록 조회 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 피드백 상세 조회
router.get('/feedback/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const feedback = feedbackSystem.feedbacks.get(id);

        if (!feedback) {
            return res.status(404).json({
                success: false,
                message: '피드백을 찾을 수 없습니다.'
            });
        }

        res.json({
            success: true,
            data: feedback
        });
    } catch (error) {
        console.error('피드백 상세 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '피드백 상세 조회 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 피드백 업데이트
router.put('/feedback/:id', authenticateUser, async (req, res) => {
    try {
        const { id } = req.params;
        const feedback = feedbackSystem.updateFeedback(id, req.body);

        if (!feedback) {
            return res.status(404).json({
                success: false,
                message: '피드백을 찾을 수 없습니다.'
            });
        }

        res.json({
            success: true,
            message: '피드백이 업데이트되었습니다.',
            data: feedback
        });
    } catch (error) {
        console.error('피드백 업데이트 오류:', error);
        res.status(500).json({
            success: false,
            message: '피드백 업데이트 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 피드백 상태 변경
router.patch('/feedback/:id/status', authenticateUser, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const feedback = feedbackSystem.changeStatus(id, status, req.user.id);

        if (!feedback) {
            return res.status(404).json({
                success: false,
                message: '피드백을 찾을 수 없습니다.'
            });
        }

        res.json({
            success: true,
            message: '피드백 상태가 변경되었습니다.',
            data: feedback
        });
    } catch (error) {
        console.error('피드백 상태 변경 오류:', error);
        res.status(500).json({
            success: false,
            message: '피드백 상태 변경 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 피드백 할당
router.patch('/feedback/:id/assign', authenticateUser, async (req, res) => {
    try {
        const { id } = req.params;
        const { assigneeId } = req.body;

        const feedback = feedbackSystem.assignFeedback(id, assigneeId, req.user.id);

        if (!feedback) {
            return res.status(404).json({
                success: false,
                message: '피드백을 찾을 수 없습니다.'
            });
        }

        res.json({
            success: true,
            message: '피드백이 할당되었습니다.',
            data: feedback
        });
    } catch (error) {
        console.error('피드백 할당 오류:', error);
        res.status(500).json({
            success: false,
            message: '피드백 할당 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 댓글 추가
router.post('/feedback/:id/comments', authenticateUser, async (req, res) => {
    try {
        const { id } = req.params;
        const comment = feedbackSystem.addComment(id, req.body);

        if (!comment) {
            return res.status(404).json({
                success: false,
                message: '피드백을 찾을 수 없습니다.'
            });
        }

        res.status(201).json({
            success: true,
            message: '댓글이 추가되었습니다.',
            data: comment
        });
    } catch (error) {
        console.error('댓글 추가 오류:', error);
        res.status(500).json({
            success: false,
            message: '댓글 추가 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 투표 처리
router.post('/feedback/:id/vote', async (req, res) => {
    try {
        const { id } = req.params;
        const { userId, voteType } = req.body;

        const feedback = feedbackSystem.voteFeedback(id, userId, voteType);

        if (!feedback) {
            return res.status(404).json({
                success: false,
                message: '피드백을 찾을 수 없습니다.'
            });
        }

        res.json({
            success: true,
            message: '투표가 처리되었습니다.',
            data: feedback
        });
    } catch (error) {
        console.error('투표 처리 오류:', error);
        res.status(500).json({
            success: false,
            message: '투표 처리 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 통계 조회
router.get('/stats', authenticateUser, async (req, res) => {
    try {
        const stats = feedbackSystem.getFeedbackStats();

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('통계 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '통계 조회 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 카테고리 목록 조회
router.get('/categories', async (req, res) => {
    try {
        const categories = Array.from(feedbackSystem.categories.values());

        res.json({
            success: true,
            data: categories
        });
    } catch (error) {
        console.error('카테고리 목록 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '카테고리 목록 조회 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 우선순위 목록 조회
router.get('/priorities', async (req, res) => {
    try {
        const priorities = Array.from(feedbackSystem.priorities.values());

        res.json({
            success: true,
            data: priorities
        });
    } catch (error) {
        console.error('우선순위 목록 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '우선순위 목록 조회 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 상태 목록 조회
router.get('/statuses', async (req, res) => {
    try {
        const statuses = Array.from(feedbackSystem.statuses.values());

        res.json({
            success: true,
            data: statuses
        });
    } catch (error) {
        console.error('상태 목록 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '상태 목록 조회 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

module.exports = router;
