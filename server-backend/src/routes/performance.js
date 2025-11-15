/**
 * 성능 모니터링 API 라우터
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
    getPerformanceStats,
    resetMetrics,
    getEndpointStats
} = require('../middleware/performance');

/**
 * GET /api/performance/stats
 * 전체 성능 통계 조회
 */
router.get('/stats', authenticateToken, (req, res) => {
    try {
        // 관리자만 접근 가능
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'ADMIN_ONLY' });
        }

        const stats = getPerformanceStats();
        res.json(stats);
    } catch (error) {
        console.error('성능 통계 조회 실패:', error);
        res.status(500).json({ error: 'STATS_FETCH_FAILED' });
    }
});

/**
 * GET /api/performance/endpoint
 * 특정 엔드포인트의 성능 통계
 */
router.get('/endpoint', authenticateToken, (req, res) => {
    try {
        // 관리자만 접근 가능
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'ADMIN_ONLY' });
        }

        const { method, path } = req.query;

        if (!method || !path) {
            return res.status(400).json({
                error: 'MISSING_PARAMETERS',
                message: 'method and path are required'
            });
        }

        const stats = getEndpointStats(method, path);

        if (!stats) {
            return res.status(404).json({
                error: 'NO_DATA',
                message: 'No performance data for this endpoint'
            });
        }

        res.json(stats);
    } catch (error) {
        console.error('엔드포인트 통계 조회 실패:', error);
        res.status(500).json({ error: 'STATS_FETCH_FAILED' });
    }
});

/**
 * POST /api/performance/reset
 * 성능 메트릭 초기화 (관리자 전용)
 */
router.post('/reset', authenticateToken, (req, res) => {
    try {
        // 관리자만 접근 가능
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'ADMIN_ONLY' });
        }

        resetMetrics();

        res.json({
            message: 'Performance metrics reset successfully',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('메트릭 초기화 실패:', error);
        res.status(500).json({ error: 'RESET_FAILED' });
    }
});

/**
 * GET /api/performance/health
 * 시스템 헬스 체크
 */
router.get('/health', (req, res) => {
    try {
        const memoryUsage = process.memoryUsage();
        const uptime = process.uptime();

        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: Math.round(uptime) + 's',
            memory: {
                heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + 'MB',
                heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + 'MB',
                external: Math.round(memoryUsage.external / 1024 / 1024) + 'MB',
                rss: Math.round(memoryUsage.rss / 1024 / 1024) + 'MB'
            },
            cpu: process.cpuUsage()
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            error: error.message
        });
    }
});

module.exports = router;
