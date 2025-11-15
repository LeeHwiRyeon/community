const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const businessIntelligenceService = require('../services/businessIntelligenceService');

// 대시보드 데이터 조회
router.get('/dashboard', (req, res) => {
    try {
        const { period = '30d' } = req.query;
        const dashboardData = businessIntelligenceService.generateDashboardData(period);

        res.json({
            success: true,
            data: dashboardData
        });
    } catch (error) {
        logger.error('Get dashboard data error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get dashboard data',
            error: error.message
        });
    }
});

// KPI 조회
router.get('/kpis', (req, res) => {
    try {
        const { category, priority } = req.query;
        const kpis = businessIntelligenceService.getKPIs(category, priority);

        res.json({
            success: true,
            data: kpis
        });
    } catch (error) {
        logger.error('Get KPIs error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get KPIs',
            error: error.message
        });
    }
});

// 사용자 분석
router.get('/users/analysis', (req, res) => {
    try {
        const { segment = 'all' } = req.query;
        const analysis = businessIntelligenceService.analyzeUsers(segment);

        res.json({
            success: true,
            data: analysis
        });
    } catch (error) {
        logger.error('Get user analysis error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get user analysis',
            error: error.message
        });
    }
});

// 수익 분석
router.get('/revenue/analysis', (req, res) => {
    try {
        const analysis = businessIntelligenceService.analyzeRevenue();

        res.json({
            success: true,
            data: analysis
        });
    } catch (error) {
        logger.error('Get revenue analysis error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get revenue analysis',
            error: error.message
        });
    }
});

// 콘텐츠 분석
router.get('/content/analysis', (req, res) => {
    try {
        const analysis = businessIntelligenceService.analyzeContent();

        res.json({
            success: true,
            data: analysis
        });
    } catch (error) {
        logger.error('Get content analysis error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get content analysis',
            error: error.message
        });
    }
});

// 성능 분석
router.get('/performance/analysis', (req, res) => {
    try {
        const analysis = businessIntelligenceService.analyzePerformance();

        res.json({
            success: true,
            data: analysis
        });
    } catch (error) {
        logger.error('Get performance analysis error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get performance analysis',
            error: error.message
        });
    }
});

// 예측 분석
router.get('/predictions', (req, res) => {
    try {
        const predictions = businessIntelligenceService.generatePredictions();

        res.json({
            success: true,
            data: predictions
        });
    } catch (error) {
        logger.error('Get predictions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get predictions',
            error: error.message
        });
    }
});

// A/B 테스트 결과
router.get('/ab-tests', (req, res) => {
    try {
        const results = businessIntelligenceService.getABTestResults();

        res.json({
            success: true,
            data: results
        });
    } catch (error) {
        logger.error('Get A/B test results error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get A/B test results',
            error: error.message
        });
    }
});

// 경쟁사 분석
router.get('/competitive-analysis', (req, res) => {
    try {
        const analysis = businessIntelligenceService.getCompetitiveAnalysis();

        res.json({
            success: true,
            data: analysis
        });
    } catch (error) {
        logger.error('Get competitive analysis error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get competitive analysis',
            error: error.message
        });
    }
});

// 보고서 생성
router.post('/reports', (req, res) => {
    try {
        const { type, period } = req.body;

        if (!type || !period) {
            return res.status(400).json({
                success: false,
                message: 'Report type and period are required'
            });
        }

        const report = businessIntelligenceService.generateReport(type, period);

        res.json({
            success: true,
            message: 'Report generated successfully',
            data: report
        });
    } catch (error) {
        logger.error('Generate report error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate report',
            error: error.message
        });
    }
});

// 보고서 조회
router.get('/reports/:reportId', (req, res) => {
    try {
        const { reportId } = req.params;
        const report = businessIntelligenceService.reports.get(reportId);

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Report not found'
            });
        }

        res.json({
            success: true,
            data: report
        });
    } catch (error) {
        logger.error('Get report error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get report',
            error: error.message
        });
    }
});

// 모든 보고서 조회
router.get('/reports', (req, res) => {
    try {
        const reports = Array.from(businessIntelligenceService.reports.values());

        res.json({
            success: true,
            data: reports
        });
    } catch (error) {
        logger.error('Get all reports error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get reports',
            error: error.message
        });
    }
});

// 대시보드 저장
router.post('/dashboards', (req, res) => {
    try {
        const { dashboardId, dashboardData } = req.body;

        if (!dashboardId || !dashboardData) {
            return res.status(400).json({
                success: false,
                message: 'Dashboard ID and data are required'
            });
        }

        businessIntelligenceService.saveDashboard(dashboardId, dashboardData);

        res.json({
            success: true,
            message: 'Dashboard saved successfully'
        });
    } catch (error) {
        logger.error('Save dashboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save dashboard',
            error: error.message
        });
    }
});

// 대시보드 조회
router.get('/dashboards/:dashboardId', (req, res) => {
    try {
        const { dashboardId } = req.params;
        const dashboard = businessIntelligenceService.getDashboard(dashboardId);

        if (!dashboard) {
            return res.status(404).json({
                success: false,
                message: 'Dashboard not found'
            });
        }

        res.json({
            success: true,
            data: dashboard
        });
    } catch (error) {
        logger.error('Get dashboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get dashboard',
            error: error.message
        });
    }
});

// 모든 대시보드 조회
router.get('/dashboards', (req, res) => {
    try {
        const dashboards = businessIntelligenceService.getAllDashboards();

        res.json({
            success: true,
            data: dashboards
        });
    } catch (error) {
        logger.error('Get all dashboards error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get dashboards',
            error: error.message
        });
    }
});

// 메트릭 업데이트
router.put('/metrics', (req, res) => {
    try {
        const { metrics } = req.body;

        if (!metrics || typeof metrics !== 'object') {
            return res.status(400).json({
                success: false,
                message: 'Invalid metrics data'
            });
        }

        businessIntelligenceService.updateMetrics(metrics);

        res.json({
            success: true,
            message: 'Metrics updated successfully'
        });
    } catch (error) {
        logger.error('Update metrics error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update metrics',
            error: error.message
        });
    }
});

// KPI 업데이트
router.put('/kpis/:kpiId', (req, res) => {
    try {
        const { kpiId } = req.params;
        const { value } = req.body;

        if (value === undefined || value === null) {
            return res.status(400).json({
                success: false,
                message: 'KPI value is required'
            });
        }

        businessIntelligenceService.updateKPI(kpiId, value);

        res.json({
            success: true,
            message: 'KPI updated successfully'
        });
    } catch (error) {
        logger.error('Update KPI error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update KPI',
            error: error.message
        });
    }
});

// 인사이트 조회
router.get('/insights', (req, res) => {
    try {
        const insights = businessIntelligenceService.generateInsights();

        res.json({
            success: true,
            data: insights
        });
    } catch (error) {
        logger.error('Get insights error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get insights',
            error: error.message
        });
    }
});

// 알림 조회
router.get('/alerts', (req, res) => {
    try {
        const alerts = businessIntelligenceService.generateAlerts();

        res.json({
            success: true,
            data: alerts
        });
    } catch (error) {
        logger.error('Get alerts error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get alerts',
            error: error.message
        });
    }
});

// 권장사항 조회
router.get('/recommendations', (req, res) => {
    try {
        const recommendations = businessIntelligenceService.generateRecommendations();

        res.json({
            success: true,
            data: recommendations
        });
    } catch (error) {
        logger.error('Get recommendations error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get recommendations',
            error: error.message
        });
    }
});

// 트렌드 분석
router.get('/trends', (req, res) => {
    try {
        const { period = '30d' } = req.query;
        const trends = businessIntelligenceService.generateTrends(period);

        res.json({
            success: true,
            data: trends
        });
    } catch (error) {
        logger.error('Get trends error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get trends',
            error: error.message
        });
    }
});

// 차트 데이터 조회
router.get('/charts', (req, res) => {
    try {
        const { period = '30d' } = req.query;
        const chartData = businessIntelligenceService.generateChartData(period);

        res.json({
            success: true,
            data: chartData
        });
    } catch (error) {
        logger.error('Get chart data error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get chart data',
            error: error.message
        });
    }
});

// 실시간 메트릭
router.get('/realtime', (req, res) => {
    try {
        const realtimeData = {
            activeUsers: Math.floor(Math.random() * 100) + 8000,
            currentRevenue: Math.floor(Math.random() * 1000) + 3000,
            responseTime: Math.floor(Math.random() * 50) + 150,
            errorRate: Math.random() * 0.5,
            timestamp: new Date().toISOString()
        };

        res.json({
            success: true,
            data: realtimeData
        });
    } catch (error) {
        logger.error('Get realtime data error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get realtime data',
            error: error.message
        });
    }
});

// 데이터 내보내기
router.get('/export/:type', (req, res) => {
    try {
        const { type } = req.params;
        const { format = 'json' } = req.query;

        let data;
        switch (type) {
            case 'dashboard':
                data = businessIntelligenceService.generateDashboardData();
                break;
            case 'kpis':
                data = businessIntelligenceService.getKPIs();
                break;
            case 'users':
                data = businessIntelligenceService.analyzeUsers();
                break;
            case 'revenue':
                data = businessIntelligenceService.analyzeRevenue();
                break;
            default:
                return res.status(400).json({
                    success: false,
                    message: 'Invalid export type'
                });
        }

        if (format === 'csv') {
            // CSV 변환 로직 (간단한 예시)
            const csv = convertToCSV(data);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="${type}_export.csv"`);
            res.send(csv);
        } else {
            res.json({
                success: true,
                data: data
            });
        }
    } catch (error) {
        logger.error('Export data error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to export data',
            error: error.message
        });
    }
});

// CSV 변환 함수
function convertToCSV(data) {
    if (Array.isArray(data)) {
        if (data.length === 0) return '';

        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(header => row[header] || '').join(','))
        ].join('\n');

        return csvContent;
    } else {
        // 객체인 경우 키-값 쌍으로 변환
        const rows = Object.entries(data).map(([key, value]) => ({ key, value }));
        return convertToCSV(rows);
    }
}

module.exports = router;

