const express = require('express');
const router = express.Router();
const { logger } = require('../../utils/logger');

// 피드백 데이터 저장소 (실제로는 데이터베이스 사용)
const feedbacks = [];
const bugReports = [];
const userTests = [];

// 피드백 타입 정의
const FEEDBACK_TYPES = {
    BUG: 'bug',
    SUGGESTION: 'suggestion',
    COMPLAINT: 'complaint',
    PRAISE: 'praise',
    QUESTION: 'question'
};

// 피드백 심각도 정의
const SEVERITY_LEVELS = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical'
};

// 피드백 제출
router.post('/', async (req, res) => {
    try {
        const {
            userId,
            type,
            category,
            title,
            description,
            severity = 'medium',
            userType,
            device,
            browser,
            url,
            screenshot,
            steps,
            expectedResult,
            actualResult
        } = req.body;

        // 필수 필드 검증
        if (!userId || !type || !title || !description) {
            return res.status(400).json({
                success: false,
                message: '필수 필드가 누락되었습니다.'
            });
        }

        // 피드백 ID 생성
        const feedbackId = `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // 피드백 객체 생성
        const feedback = {
            id: feedbackId,
            userId,
            type,
            category: category || 'general',
            title,
            description,
            severity,
            userType: userType || 'unknown',
            device: device || 'unknown',
            browser: browser || 'unknown',
            url: url || '',
            screenshot: screenshot || '',
            steps: steps || [],
            expectedResult: expectedResult || '',
            actualResult: actualResult || '',
            status: 'open',
            priority: getPriority(severity),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            assignedTo: null,
            resolution: null,
            tags: []
        };

        // 피드백 저장
        feedbacks.push(feedback);

        // 버그 리포트인 경우 별도 저장
        if (type === FEEDBACK_TYPES.BUG) {
            bugReports.push(feedback);
        }

        // 로그 기록
        logger.info(`새 피드백 제출: ${feedbackId}`, {
            userId,
            type,
            severity,
            userType
        });

        res.json({
            success: true,
            message: '피드백이 성공적으로 제출되었습니다.',
            data: {
                feedbackId,
                status: feedback.status,
                priority: feedback.priority
            }
        });

    } catch (error) {
        logger.error('피드백 제출 오류:', error);
        res.status(500).json({
            success: false,
            message: '피드백 제출 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 피드백 목록 조회
router.get('/', async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            type,
            severity,
            status,
            userType,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        let filteredFeedbacks = [...feedbacks];

        // 필터링
        if (type) {
            filteredFeedbacks = filteredFeedbacks.filter(f => f.type === type);
        }
        if (severity) {
            filteredFeedbacks = filteredFeedbacks.filter(f => f.severity === severity);
        }
        if (status) {
            filteredFeedbacks = filteredFeedbacks.filter(f => f.status === status);
        }
        if (userType) {
            filteredFeedbacks = filteredFeedbacks.filter(f => f.userType === userType);
        }

        // 정렬
        filteredFeedbacks.sort((a, b) => {
            const aValue = a[sortBy];
            const bValue = b[sortBy];

            if (sortOrder === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });

        // 페이지네이션
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedFeedbacks = filteredFeedbacks.slice(startIndex, endIndex);

        res.json({
            success: true,
            data: {
                feedbacks: paginatedFeedbacks,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: filteredFeedbacks.length,
                    totalPages: Math.ceil(filteredFeedbacks.length / limit)
                }
            }
        });

    } catch (error) {
        logger.error('피드백 목록 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '피드백 목록 조회 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 특정 피드백 조회
router.get('/:feedbackId', async (req, res) => {
    try {
        const { feedbackId } = req.params;
        const feedback = feedbacks.find(f => f.id === feedbackId);

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
        logger.error('피드백 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '피드백 조회 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 피드백 상태 업데이트
router.patch('/:feedbackId/status', async (req, res) => {
    try {
        const { feedbackId } = req.params;
        const { status, resolution, assignedTo } = req.body;

        const feedback = feedbacks.find(f => f.id === feedbackId);
        if (!feedback) {
            return res.status(404).json({
                success: false,
                message: '피드백을 찾을 수 없습니다.'
            });
        }

        // 상태 업데이트
        feedback.status = status || feedback.status;
        feedback.resolution = resolution || feedback.resolution;
        feedback.assignedTo = assignedTo || feedback.assignedTo;
        feedback.updatedAt = new Date().toISOString();

        logger.info(`피드백 상태 업데이트: ${feedbackId}`, {
            status,
            assignedTo
        });

        res.json({
            success: true,
            message: '피드백 상태가 업데이트되었습니다.',
            data: feedback
        });

    } catch (error) {
        logger.error('피드백 상태 업데이트 오류:', error);
        res.status(500).json({
            success: false,
            message: '피드백 상태 업데이트 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 사용자 테스트 결과 제출
router.post('/user-test', async (req, res) => {
    try {
        const {
            userId,
            testType,
            userType,
            testScenario,
            completionRate,
            satisfactionScore,
            difficultyScore,
            comments,
            issues,
            suggestions,
            device,
            browser,
            testDuration
        } = req.body;

        // 필수 필드 검증
        if (!userId || !testType || !userType || !testScenario) {
            return res.status(400).json({
                success: false,
                message: '필수 필드가 누락되었습니다.'
            });
        }

        // 테스트 결과 ID 생성
        const testId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // 테스트 결과 객체 생성
        const testResult = {
            id: testId,
            userId,
            testType,
            userType,
            testScenario,
            completionRate: completionRate || 0,
            satisfactionScore: satisfactionScore || 0,
            difficultyScore: difficultyScore || 0,
            comments: comments || '',
            issues: issues || [],
            suggestions: suggestions || [],
            device: device || 'unknown',
            browser: browser || 'unknown',
            testDuration: testDuration || 0,
            createdAt: new Date().toISOString(),
            status: 'completed'
        };

        // 테스트 결과 저장
        userTests.push(testResult);

        // 로그 기록
        logger.info(`사용자 테스트 결과 제출: ${testId}`, {
            userId,
            testType,
            userType,
            completionRate,
            satisfactionScore
        });

        res.json({
            success: true,
            message: '사용자 테스트 결과가 제출되었습니다.',
            data: {
                testId,
                status: testResult.status
            }
        });

    } catch (error) {
        logger.error('사용자 테스트 결과 제출 오류:', error);
        res.status(500).json({
            success: false,
            message: '사용자 테스트 결과 제출 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 사용자 테스트 결과 조회
router.get('/user-test/results', async (req, res) => {
    try {
        const {
            userType,
            testType,
            page = 1,
            limit = 20
        } = req.query;

        let filteredTests = [...userTests];

        // 필터링
        if (userType) {
            filteredTests = filteredTests.filter(t => t.userType === userType);
        }
        if (testType) {
            filteredTests = filteredTests.filter(t => t.testType === testType);
        }

        // 페이지네이션
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedTests = filteredTests.slice(startIndex, endIndex);

        // 통계 계산
        const stats = calculateTestStats(filteredTests);

        res.json({
            success: true,
            data: {
                tests: paginatedTests,
                stats,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: filteredTests.length,
                    totalPages: Math.ceil(filteredTests.length / limit)
                }
            }
        });

    } catch (error) {
        logger.error('사용자 테스트 결과 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '사용자 테스트 결과 조회 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 피드백 통계 조회
router.get('/stats/overview', async (req, res) => {
    try {
        const stats = {
            totalFeedbacks: feedbacks.length,
            totalBugReports: bugReports.length,
            totalUserTests: userTests.length,
            feedbacksByType: getFeedbacksByType(feedbacks),
            feedbacksBySeverity: getFeedbacksBySeverity(feedbacks),
            feedbacksByStatus: getFeedbacksByStatus(feedbacks),
            feedbacksByUserType: getFeedbacksByUserType(feedbacks),
            averageSatisfactionScore: calculateAverageSatisfactionScore(userTests),
            averageCompletionRate: calculateAverageCompletionRate(userTests),
            recentFeedbacks: feedbacks
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .slice(0, 10)
        };

        res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        logger.error('피드백 통계 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '피드백 통계 조회 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 헬퍼 함수들
function getPriority(severity) {
    const priorityMap = {
        [SEVERITY_LEVELS.CRITICAL]: 1,
        [SEVERITY_LEVELS.HIGH]: 2,
        [SEVERITY_LEVELS.MEDIUM]: 3,
        [SEVERITY_LEVELS.LOW]: 4
    };
    return priorityMap[severity] || 3;
}

function getFeedbacksByType(feedbacks) {
    const typeCount = {};
    feedbacks.forEach(feedback => {
        typeCount[feedback.type] = (typeCount[feedback.type] || 0) + 1;
    });
    return typeCount;
}

function getFeedbacksBySeverity(feedbacks) {
    const severityCount = {};
    feedbacks.forEach(feedback => {
        severityCount[feedback.severity] = (severityCount[feedback.severity] || 0) + 1;
    });
    return severityCount;
}

function getFeedbacksByStatus(feedbacks) {
    const statusCount = {};
    feedbacks.forEach(feedback => {
        statusCount[feedback.status] = (statusCount[feedback.status] || 0) + 1;
    });
    return statusCount;
}

function getFeedbacksByUserType(feedbacks) {
    const userTypeCount = {};
    feedbacks.forEach(feedback => {
        userTypeCount[feedback.userType] = (userTypeCount[feedback.userType] || 0) + 1;
    });
    return userTypeCount;
}

function calculateTestStats(tests) {
    if (tests.length === 0) {
        return {
            averageCompletionRate: 0,
            averageSatisfactionScore: 0,
            averageDifficultyScore: 0,
            totalTests: 0
        };
    }

    const totalCompletionRate = tests.reduce((sum, test) => sum + test.completionRate, 0);
    const totalSatisfactionScore = tests.reduce((sum, test) => sum + test.satisfactionScore, 0);
    const totalDifficultyScore = tests.reduce((sum, test) => sum + test.difficultyScore, 0);

    return {
        averageCompletionRate: Math.round(totalCompletionRate / tests.length),
        averageSatisfactionScore: Math.round(totalSatisfactionScore / tests.length),
        averageDifficultyScore: Math.round(totalDifficultyScore / tests.length),
        totalTests: tests.length
    };
}

function calculateAverageSatisfactionScore(tests) {
    if (tests.length === 0) return 0;
    const total = tests.reduce((sum, test) => sum + test.satisfactionScore, 0);
    return Math.round(total / tests.length);
}

function calculateAverageCompletionRate(tests) {
    if (tests.length === 0) return 0;
    const total = tests.reduce((sum, test) => sum + test.completionRate, 0);
    return Math.round(total / tests.length);
}

module.exports = router;
