/**
 * Enhanced Bug Management API
 * 개선된 버그 관리 API
 * 
 * 기능:
 * - 중복 버그 방지
 * - 요청 루프 차단
 * - 지능형 버그 분류
 * - 자동 우선순위 설정
 */

const express = require('express');
const router = express.Router();
const { logger } = require('../utils/logger');
const BugDeduplicationService = require('../services/bug-deduplication-service');
const BugRequestLoopPreventionService = require('../services/bug-request-loop-prevention');

// 서비스 인스턴스 생성
const bugDeduplication = new BugDeduplicationService();
const loopPrevention = new BugRequestLoopPreventionService();

// 요청 ID 생성기
let requestIdCounter = 0;
function generateRequestId() {
    return `req_${Date.now()}_${++requestIdCounter}`;
}

/**
 * 버그 생성 (개선된 버전)
 * POST /api/bug-management/bugs
 */
router.post('/bugs', async (req, res) => {
    const requestId = generateRequestId();
    const startTime = Date.now();

    try {
        const { title, description, severity, category, reporterId, ...additionalData } = req.body;

        // 필수 필드 검증
        if (!title || !description || !reporterId) {
            return res.status(400).json({
                success: false,
                message: '필수 필드가 누락되었습니다: title, description, reporterId',
                requestId
            });
        }

        const bugData = {
            title: title.trim(),
            description: description.trim(),
            severity: severity || 'Medium',
            category: category || 'General',
            ...additionalData
        };

        // 1. 요청 루프 확인
        const loopCheck = await loopPrevention.checkRequestLoop(reporterId, bugData, requestId);
        if (!loopCheck.allowed) {
            return res.status(429).json({
                success: false,
                message: loopCheck.message,
                reason: loopCheck.reason,
                retryAfter: loopCheck.retryAfter,
                requestId
            });
        }

        // 2. 중복 버그 확인
        const duplicateCheck = await bugDeduplication.checkDuplicateBug(bugData, reporterId);
        if (duplicateCheck.isDuplicate) {
            return res.status(409).json({
                success: false,
                message: '중복 버그가 감지되었습니다.',
                reason: duplicateCheck.reason,
                duplicateBugId: duplicateCheck.duplicateBugId,
                confidence: duplicateCheck.confidence,
                requestId
            });
        }

        // 3. 버그 생성 (실제 구현에서는 데이터베이스에 저장)
        const bug = {
            id: `bug_${Date.now()}`,
            title: bugData.title,
            description: bugData.description,
            severity: bugData.severity,
            category: bugData.category,
            status: 'New',
            reporterId: reporterId,
            createdAt: new Date().toISOString(),
            priority: calculatePriority(bugData),
            estimatedHours: calculateEstimatedHours(bugData),
            tags: extractTags(bugData),
            ...additionalData
        };

        // 4. 성공 응답
        const processingTime = Date.now() - startTime;
        logger.info(`버그 생성 성공: ${bug.id} - ${processingTime}ms`);

        res.status(201).json({
            success: true,
            data: bug,
            message: '버그가 성공적으로 생성되었습니다.',
            requestId,
            processingTime
        });

    } catch (error) {
        logger.error(`버그 생성 실패: ${error.message}`, { requestId });
        res.status(500).json({
            success: false,
            message: '버그 생성 중 오류가 발생했습니다.',
            error: error.message,
            requestId
        });
    }
});

/**
 * 중복 버그 확인
 * POST /api/bug-management/check-duplicate
 */
router.post('/check-duplicate', async (req, res) => {
    try {
        const { bugData, reporterId } = req.body;

        if (!bugData || !reporterId) {
            return res.status(400).json({
                success: false,
                message: 'bugData와 reporterId가 필요합니다.'
            });
        }

        const duplicateCheck = await bugDeduplication.checkDuplicateBug(bugData, reporterId);

        res.json({
            success: true,
            data: duplicateCheck
        });

    } catch (error) {
        logger.error(`중복 확인 실패: ${error.message}`);
        res.status(500).json({
            success: false,
            message: '중복 확인 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

/**
 * 버그 통합
 * POST /api/bug-management/merge-bugs
 */
router.post('/merge-bugs', async (req, res) => {
    try {
        const { originalBugId, duplicateBugId } = req.body;

        if (!originalBugId || !duplicateBugId) {
            return res.status(400).json({
                success: false,
                message: 'originalBugId와 duplicateBugId가 필요합니다.'
            });
        }

        const mergeResult = await bugDeduplication.mergeDuplicateBugs(originalBugId, duplicateBugId);

        res.json({
            success: mergeResult.success,
            message: mergeResult.message
        });

    } catch (error) {
        logger.error(`버그 통합 실패: ${error.message}`);
        res.status(500).json({
            success: false,
            message: '버그 통합 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

/**
 * 사용자 상태 조회
 * GET /api/bug-management/user-status/:userId
 */
router.get('/user-status/:userId', (req, res) => {
    try {
        const { userId } = req.params;
        const userStatus = loopPrevention.getUserStatus(userId);

        res.json({
            success: true,
            data: userStatus
        });

    } catch (error) {
        logger.error(`사용자 상태 조회 실패: ${error.message}`);
        res.status(500).json({
            success: false,
            message: '사용자 상태 조회 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

/**
 * 사용자 차단 해제
 * POST /api/bug-management/unblock-user
 */
router.post('/unblock-user', (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'userId가 필요합니다.'
            });
        }

        loopPrevention.manualUnblockUser(userId);

        res.json({
            success: true,
            message: '사용자 차단이 해제되었습니다.'
        });

    } catch (error) {
        logger.error(`사용자 차단 해제 실패: ${error.message}`);
        res.status(500).json({
            success: false,
            message: '사용자 차단 해제 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

/**
 * 시스템 통계 조회
 * GET /api/bug-management/statistics
 */
router.get('/statistics', (req, res) => {
    try {
        const deduplicationStats = bugDeduplication.getStatistics();
        const loopPreventionStats = loopPrevention.getStatistics();

        res.json({
            success: true,
            data: {
                deduplication: deduplicationStats,
                loopPrevention: loopPreventionStats,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        logger.error(`통계 조회 실패: ${error.message}`);
        res.status(500).json({
            success: false,
            message: '통계 조회 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

/**
 * 버그 목록 조회 (필터링 지원)
 * GET /api/bug-management/bugs
 */
router.get('/bugs', (req, res) => {
    try {
        const {
            status,
            severity,
            category,
            reporterId,
            assigneeId,
            page = 1,
            limit = 20,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        // 실제 구현에서는 데이터베이스에서 조회
        const bugs = [
            {
                id: 'bug_1',
                title: '예시 버그 1',
                description: '예시 설명',
                severity: 'High',
                category: 'Frontend',
                status: 'New',
                reporterId: 'user_1',
                createdAt: new Date().toISOString()
            }
        ];

        res.json({
            success: true,
            data: {
                bugs,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: bugs.length,
                    pages: Math.ceil(bugs.length / limit)
                }
            }
        });

    } catch (error) {
        logger.error(`버그 목록 조회 실패: ${error.message}`);
        res.status(500).json({
            success: false,
            message: '버그 목록 조회 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

/**
 * 버그 상세 조회
 * GET /api/bug-management/bugs/:bugId
 */
router.get('/bugs/:bugId', (req, res) => {
    try {
        const { bugId } = req.params;

        // 실제 구현에서는 데이터베이스에서 조회
        const bug = {
            id: bugId,
            title: '예시 버그',
            description: '예시 설명',
            severity: 'High',
            category: 'Frontend',
            status: 'New',
            reporterId: 'user_1',
            assigneeId: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            priority: 1,
            estimatedHours: 4,
            actualHours: 0,
            tags: ['ui', 'bug'],
            comments: [],
            history: []
        };

        res.json({
            success: true,
            data: bug
        });

    } catch (error) {
        logger.error(`버그 상세 조회 실패: ${error.message}`);
        res.status(500).json({
            success: false,
            message: '버그 상세 조회 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

/**
 * 버그 상태 업데이트
 * PUT /api/bug-management/bugs/:bugId/status
 */
router.put('/bugs/:bugId/status', (req, res) => {
    try {
        const { bugId } = req.params;
        const { status, comment } = req.body;

        if (!status) {
            return res.status(400).json({
                success: false,
                message: 'status가 필요합니다.'
            });
        }

        // 실제 구현에서는 데이터베이스에서 업데이트
        logger.info(`버그 상태 업데이트: ${bugId} -> ${status}`);

        res.json({
            success: true,
            message: '버그 상태가 업데이트되었습니다.',
            data: {
                bugId,
                status,
                updatedAt: new Date().toISOString()
            }
        });

    } catch (error) {
        logger.error(`버그 상태 업데이트 실패: ${error.message}`);
        res.status(500).json({
            success: false,
            message: '버그 상태 업데이트 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 헬퍼 함수들

/**
 * 우선순위 계산
 */
function calculatePriority(bugData) {
    const severityWeights = {
        'Critical': 4,
        'High': 3,
        'Medium': 2,
        'Low': 1
    };

    const categoryWeights = {
        'Security': 4,
        'Backend': 3,
        'Frontend': 2,
        'Database': 3,
        'Performance': 2,
        'General': 1
    };

    const severityWeight = severityWeights[bugData.severity] || 1;
    const categoryWeight = categoryWeights[bugData.category] || 1;

    return Math.min(5, Math.max(1, Math.round((severityWeight + categoryWeight) / 2)));
}

/**
 * 예상 해결 시간 계산
 */
function calculateEstimatedHours(bugData) {
    const severityHours = {
        'Critical': 8,
        'High': 4,
        'Medium': 2,
        'Low': 1
    };

    const categoryMultiplier = {
        'Security': 1.5,
        'Backend': 1.2,
        'Frontend': 1.0,
        'Database': 1.3,
        'Performance': 1.1,
        'General': 1.0
    };

    const baseHours = severityHours[bugData.severity] || 1;
    const multiplier = categoryMultiplier[bugData.category] || 1.0;

    return Math.round(baseHours * multiplier * 10) / 10;
}

/**
 * 태그 추출
 */
function extractTags(bugData) {
    const tags = [];
    const text = `${bugData.title} ${bugData.description}`.toLowerCase();

    const tagPatterns = {
        'ui': ['ui', 'interface', '화면', '인터페이스'],
        'api': ['api', 'endpoint', '서버', '백엔드'],
        'database': ['database', 'db', 'sql', '데이터베이스'],
        'security': ['security', 'auth', 'login', '보안', '인증'],
        'performance': ['performance', 'slow', '느림', '성능'],
        'mobile': ['mobile', 'android', 'ios', '모바일'],
        'desktop': ['desktop', 'pc', '컴퓨터']
    };

    for (const [tag, patterns] of Object.entries(tagPatterns)) {
        if (patterns.some(pattern => text.includes(pattern))) {
            tags.push(tag);
        }
    }

    return tags;
}

// 에러 핸들러
router.use((error, req, res, next) => {
    logger.error(`API 오류: ${error.message}`, {
        path: req.path,
        method: req.method,
        body: req.body,
        stack: error.stack
    });

    res.status(500).json({
        success: false,
        message: '서버 내부 오류가 발생했습니다.',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal Server Error'
    });
});

module.exports = router;
