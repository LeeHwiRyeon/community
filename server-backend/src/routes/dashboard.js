/**
 * Dashboard Routes
 * 관리자 대시보드 API 엔드포인트
 */

import express from 'express';
import dashboardService from '../services/dashboard-service.js';
import { authenticateToken } from '../auth/jwt.js';

const router = express.Router();

/**
 * 관리자 권한 확인 미들웨어
 */
const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: '관리자 권한이 필요합니다'
        });
    }
    next();
};

// 모든 대시보드 라우트에 인증 및 관리자 권한 적용
router.use(authenticateToken, requireAdmin);

/**
 * GET /api/dashboard/overview
 * 대시보드 개요 조회
 */
router.get('/overview', async (req, res) => {
    try {
        const overview = await dashboardService.getOverview();

        res.json({
            success: true,
            data: overview
        });
    } catch (error) {
        console.error('대시보드 개요 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '대시보드 개요 조회 중 오류가 발생했습니다',
            error: error.message
        });
    }
});

/**
 * GET /api/dashboard/timeseries
 * 시계열 데이터 조회
 * Query Parameters:
 * - days: 조회 기간 (기본값: 30)
 * - metric: 조회할 메트릭 (users, posts, comments, likes, views, all)
 */
router.get('/timeseries', async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 30;
        const metric = req.query.metric || 'all';

        // 유효성 검사
        if (days < 1 || days > 365) {
            return res.status(400).json({
                success: false,
                message: '조회 기간은 1일에서 365일 사이여야 합니다'
            });
        }

        const validMetrics = ['users', 'posts', 'comments', 'likes', 'views', 'all'];
        if (!validMetrics.includes(metric)) {
            return res.status(400).json({
                success: false,
                message: '유효하지 않은 메트릭입니다',
                validMetrics
            });
        }

        const data = await dashboardService.getTimeSeriesData(days, metric);

        res.json({
            success: true,
            data: {
                days,
                metric,
                timeseries: data
            }
        });
    } catch (error) {
        console.error('시계열 데이터 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '시계열 데이터 조회 중 오류가 발생했습니다',
            error: error.message
        });
    }
});

/**
 * GET /api/dashboard/leaderboard
 * 리더보드 조회
 * Query Parameters:
 * - type: 리더보드 타입 (posts, comments, likes, reputation)
 * - limit: 조회할 사용자 수 (기본값: 10, 최대: 100)
 * - days: 기간 (일, 0이면 전체, 기본값: 0)
 */
router.get('/leaderboard', async (req, res) => {
    try {
        const type = req.query.type || 'posts';
        const limit = Math.min(parseInt(req.query.limit) || 10, 100);
        const days = parseInt(req.query.days) || 0;

        // 유효성 검사
        const validTypes = ['posts', 'comments', 'likes', 'reputation'];
        if (!validTypes.includes(type)) {
            return res.status(400).json({
                success: false,
                message: '유효하지 않은 리더보드 타입입니다',
                validTypes
            });
        }

        if (days < 0 || days > 365) {
            return res.status(400).json({
                success: false,
                message: '기간은 0일에서 365일 사이여야 합니다'
            });
        }

        const data = await dashboardService.getLeaderboard(type, limit, days);

        res.json({
            success: true,
            data: {
                type,
                limit,
                days,
                period: days === 0 ? '전체 기간' : `최근 ${days}일`,
                leaderboard: data
            }
        });
    } catch (error) {
        console.error('리더보드 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '리더보드 조회 중 오류가 발생했습니다',
            error: error.message
        });
    }
});

/**
 * GET /api/dashboard/categories
 * 카테고리별 통계 조회
 * Query Parameters:
 * - days: 조회 기간 (기본값: 30)
 */
router.get('/categories', async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 30;

        // 유효성 검사
        if (days < 1 || days > 365) {
            return res.status(400).json({
                success: false,
                message: '조회 기간은 1일에서 365일 사이여야 합니다'
            });
        }

        const data = await dashboardService.getCategoryStats(days);

        res.json({
            success: true,
            data: {
                days,
                period: `최근 ${days}일`,
                categories: data
            }
        });
    } catch (error) {
        console.error('카테고리 통계 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '카테고리 통계 조회 중 오류가 발생했습니다',
            error: error.message
        });
    }
});

/**
 * GET /api/dashboard/activity-feed
 * 실시간 활동 피드 조회
 * Query Parameters:
 * - limit: 조회할 활동 수 (기본값: 50, 최대: 200)
 * - hours: 조회 기간 (시간, 기본값: 24)
 */
router.get('/activity-feed', async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 50, 200);
        const hours = parseInt(req.query.hours) || 24;

        // 유효성 검사
        if (hours < 1 || hours > 168) { // 최대 7일
            return res.status(400).json({
                success: false,
                message: '조회 기간은 1시간에서 168시간(7일) 사이여야 합니다'
            });
        }

        const data = await dashboardService.getActivityFeed(limit, hours);

        res.json({
            success: true,
            data: {
                limit,
                hours,
                period: `최근 ${hours}시간`,
                activities: data
            }
        });
    } catch (error) {
        console.error('활동 피드 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '활동 피드 조회 중 오류가 발생했습니다',
            error: error.message
        });
    }
});

/**
 * POST /api/dashboard/refresh-stats
 * 일별 통계 수동 갱신
 * Body Parameters:
 * - date: 갱신할 날짜 (YYYY-MM-DD, 선택사항)
 */
router.post('/refresh-stats', async (req, res) => {
    try {
        let date = new Date();

        if (req.body.date) {
            date = new Date(req.body.date);
            if (isNaN(date.getTime())) {
                return res.status(400).json({
                    success: false,
                    message: '유효하지 않은 날짜 형식입니다 (YYYY-MM-DD)'
                });
            }
        }

        await dashboardService.updateDailyStats(date);

        res.json({
            success: true,
            message: '일별 통계가 성공적으로 갱신되었습니다',
            date: date.toISOString().split('T')[0]
        });
    } catch (error) {
        console.error('통계 갱신 오류:', error);
        res.status(500).json({
            success: false,
            message: '통계 갱신 중 오류가 발생했습니다',
            error: error.message
        });
    }
});

export default router;
