const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const securityAuditService = require('../services/securityAuditService');

// 보안 감사 실행
router.post('/scan', async (req, res) => {
    try {
        const {
            scanType = 'full',
            targetFiles = [],
            includeDependencies = true,
            includeConfigs = true,
            includeLogs = true
        } = req.body;

        const auditResult = await securityAuditService.performSecurityAudit({
            scanType,
            targetFiles,
            includeDependencies,
            includeConfigs,
            includeLogs
        });

        res.json({
            success: true,
            message: 'Security audit completed successfully',
            data: auditResult
        });
    } catch (error) {
        logger.error('Security audit error:', error);
        res.status(500).json({
            success: false,
            message: 'Security audit failed',
            error: error.message
        });
    }
});

// 감사 로그 조회
router.get('/logs', (req, res) => {
    try {
        const { limit = 10 } = req.query;
        const logs = securityAuditService.getAuditLogs(parseInt(limit));

        res.json({
            success: true,
            data: logs
        });
    } catch (error) {
        logger.error('Get audit logs error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get audit logs',
            error: error.message
        });
    }
});

// 특정 스캔 결과 조회
router.get('/scan/:scanId', (req, res) => {
    try {
        const { scanId } = req.params;
        const scanResult = securityAuditService.getScanResult(scanId);

        if (!scanResult) {
            return res.status(404).json({
                success: false,
                message: 'Scan result not found'
            });
        }

        res.json({
            success: true,
            data: scanResult
        });
    } catch (error) {
        logger.error('Get scan result error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get scan result',
            error: error.message
        });
    }
});

// 보안 메트릭 조회
router.get('/metrics', (req, res) => {
    try {
        const metrics = securityAuditService.getSecurityMetrics();

        res.json({
            success: true,
            data: metrics
        });
    } catch (error) {
        logger.error('Get security metrics error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get security metrics',
            error: error.message
        });
    }
});

// 취약점 보고서 생성
router.post('/report/:scanId', (req, res) => {
    try {
        const { scanId } = req.params;
        const report = securityAuditService.generateVulnerabilityReport(scanId);

        res.json({
            success: true,
            message: 'Vulnerability report generated successfully',
            data: report
        });
    } catch (error) {
        logger.error('Generate vulnerability report error:', error);
        res.status(400).json({
            success: false,
            message: error.message,
            error: error.message
        });
    }
});

// 취약점 보고서 조회
router.get('/report/:scanId', (req, res) => {
    try {
        const { scanId } = req.params;
        const report = securityAuditService.getVulnerabilityReport(scanId);

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Vulnerability report not found'
            });
        }

        res.json({
            success: true,
            data: report
        });
    } catch (error) {
        logger.error('Get vulnerability report error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get vulnerability report',
            error: error.message
        });
    }
});

// 모든 취약점 보고서 조회
router.get('/reports', (req, res) => {
    try {
        const reports = securityAuditService.getAllVulnerabilityReports();

        res.json({
            success: true,
            data: reports
        });
    } catch (error) {
        logger.error('Get all vulnerability reports error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get vulnerability reports',
            error: error.message
        });
    }
});

// 취약점 통계 조회
router.get('/statistics', (req, res) => {
    try {
        const { period = '30d' } = req.query;

        // 실제로는 기간별 통계를 계산
        const statistics = {
            totalScans: securityAuditService.securityMetrics.totalScans,
            totalVulnerabilities: securityAuditService.securityMetrics.vulnerabilitiesFound,
            criticalIssues: securityAuditService.securityMetrics.criticalIssues,
            highIssues: securityAuditService.securityMetrics.highIssues,
            mediumIssues: securityAuditService.securityMetrics.mediumIssues,
            lowIssues: securityAuditService.securityMetrics.lowIssues,
            averageScanDuration: securityAuditService.calculateAverageScanDuration(),
            vulnerabilityTrend: securityAuditService.calculateVulnerabilityTrend(),
            lastScanTime: securityAuditService.securityMetrics.lastScanTime,
            period
        };

        res.json({
            success: true,
            data: statistics
        });
    } catch (error) {
        logger.error('Get security statistics error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get security statistics',
            error: error.message
        });
    }
});

// 취약점 유형별 통계
router.get('/vulnerability-types', (req, res) => {
    try {
        const logs = securityAuditService.getAuditLogs(100);
        const typeStats = {};

        logs.forEach(log => {
            log.vulnerabilities.forEach(vuln => {
                if (!typeStats[vuln.type]) {
                    typeStats[vuln.type] = {
                        count: 0,
                        severity: vuln.severity,
                        description: vuln.description
                    };
                }
                typeStats[vuln.type].count++;
            });
        });

        const sortedTypes = Object.entries(typeStats)
            .map(([type, stats]) => ({ type, ...stats }))
            .sort((a, b) => b.count - a.count);

        res.json({
            success: true,
            data: sortedTypes
        });
    } catch (error) {
        logger.error('Get vulnerability types error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get vulnerability types',
            error: error.message
        });
    }
});

// 심각도별 통계
router.get('/severity-stats', (req, res) => {
    try {
        const logs = securityAuditService.getAuditLogs(100);
        const severityStats = {
            critical: 0,
            high: 0,
            medium: 0,
            low: 0
        };

        logs.forEach(log => {
            log.vulnerabilities.forEach(vuln => {
                if (severityStats.hasOwnProperty(vuln.severity)) {
                    severityStats[vuln.severity]++;
                }
            });
        });

        res.json({
            success: true,
            data: severityStats
        });
    } catch (error) {
        logger.error('Get severity stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get severity statistics',
            error: error.message
        });
    }
});

// 파일별 취약점 통계
router.get('/file-stats', (req, res) => {
    try {
        const logs = securityAuditService.getAuditLogs(100);
        const fileStats = {};

        logs.forEach(log => {
            log.vulnerabilities.forEach(vuln => {
                if (vuln.file) {
                    if (!fileStats[vuln.file]) {
                        fileStats[vuln.file] = {
                            count: 0,
                            vulnerabilities: []
                        };
                    }
                    fileStats[vuln.file].count++;
                    fileStats[vuln.file].vulnerabilities.push({
                        type: vuln.type,
                        severity: vuln.severity,
                        line: vuln.line
                    });
                }
            });
        });

        const sortedFiles = Object.entries(fileStats)
            .map(([file, stats]) => ({ file, ...stats }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 20); // 상위 20개 파일만

        res.json({
            success: true,
            data: sortedFiles
        });
    } catch (error) {
        logger.error('Get file stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get file statistics',
            error: error.message
        });
    }
});

// 스캔 히스토리 조회
router.get('/history', (req, res) => {
    try {
        const { limit = 50 } = req.query;
        const history = securityAuditService.securityMetrics.scanHistory
            .slice(-parseInt(limit))
            .reverse();

        res.json({
            success: true,
            data: history
        });
    } catch (error) {
        logger.error('Get scan history error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get scan history',
            error: error.message
        });
    }
});

// 보안 규칙 조회
router.get('/rules', (req, res) => {
    try {
        const rules = securityAuditService.securityRules;

        res.json({
            success: true,
            data: rules
        });
    } catch (error) {
        logger.error('Get security rules error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get security rules',
            error: error.message
        });
    }
});

// 보안 규칙 업데이트
router.put('/rules', (req, res) => {
    try {
        const { rules } = req.body;

        if (!rules || typeof rules !== 'object') {
            return res.status(400).json({
                success: false,
                message: 'Invalid rules format'
            });
        }

        // 실제로는 규칙을 데이터베이스에 저장
        logger.info('Security rules updated');

        res.json({
            success: true,
            message: 'Security rules updated successfully'
        });
    } catch (error) {
        logger.error('Update security rules error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update security rules',
            error: error.message
        });
    }
});

// 취약점 수정 상태 업데이트
router.put('/vulnerability/:vulnId', (req, res) => {
    try {
        const { vulnId } = req.params;
        const { status, notes } = req.body;

        if (!status || !['open', 'in_progress', 'fixed', 'false_positive'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be one of: open, in_progress, fixed, false_positive'
            });
        }

        // 실제로는 데이터베이스에서 취약점 상태를 업데이트
        logger.info(`Vulnerability ${vulnId} status updated to ${status}`);

        res.json({
            success: true,
            message: 'Vulnerability status updated successfully',
            data: {
                vulnId,
                status,
                notes,
                updatedAt: new Date().toISOString()
            }
        });
    } catch (error) {
        logger.error('Update vulnerability status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update vulnerability status',
            error: error.message
        });
    }
});

// 보안 대시보드 데이터
router.get('/dashboard', (req, res) => {
    try {
        const metrics = securityAuditService.getSecurityMetrics();
        const recentLogs = securityAuditService.getAuditLogs(5);
        const reports = securityAuditService.getAllVulnerabilityReports();

        const dashboard = {
            metrics,
            recentScans: recentLogs,
            recentReports: reports.slice(-5),
            alerts: this.generateSecurityAlerts(metrics),
            recommendations: this.generateDashboardRecommendations(metrics)
        };

        res.json({
            success: true,
            data: dashboard
        });
    } catch (error) {
        logger.error('Get security dashboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get security dashboard',
            error: error.message
        });
    }
});

// 보안 알림 생성
function generateSecurityAlerts(metrics) {
    const alerts = [];

    if (metrics.criticalIssues > 0) {
        alerts.push({
            type: 'critical',
            title: '심각한 보안 취약점 발견',
            message: `${metrics.criticalIssues}개의 심각한 보안 취약점이 발견되었습니다.`,
            action: 'immediate_patch_required'
        });
    }

    if (metrics.highIssues > 10) {
        alerts.push({
            type: 'warning',
            title: '높은 우선순위 취약점 증가',
            message: `${metrics.highIssues}개의 높은 우선순위 취약점이 있습니다.`,
            action: 'schedule_patch'
        });
    }

    if (metrics.vulnerabilityTrend === 'increasing') {
        alerts.push({
            type: 'info',
            title: '취약점 트렌드 증가',
            message: '최근 스캔에서 취약점이 증가하는 추세입니다.',
            action: 'review_security_practices'
        });
    }

    return alerts;
}

// 대시보드 권장사항 생성
function generateDashboardRecommendations(metrics) {
    const recommendations = [];

    if (metrics.criticalIssues > 0) {
        recommendations.push({
            priority: 'high',
            title: '긴급 보안 패치',
            description: '심각한 취약점을 즉시 수정하세요.'
        });
    }

    if (metrics.totalScans < 5) {
        recommendations.push({
            priority: 'medium',
            title: '정기적인 보안 감사',
            description: '정기적인 보안 감사를 실시하세요.'
        });
    }

    if (metrics.averageScanDuration > 300000) { // 5분
        recommendations.push({
            priority: 'low',
            title: '스캔 성능 최적화',
            description: '보안 스캔 성능을 최적화하세요.'
        });
    }

    return recommendations;
}

module.exports = router;

