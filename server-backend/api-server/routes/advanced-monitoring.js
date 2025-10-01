const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// 고급 모니터링 및 알림 시스템 클래스
class AdvancedMonitoringSystem {
    constructor() {
        this.metrics = new Map();
        this.alerts = new Map();
        this.dashboards = new Map();
        this.predictions = new Map();
        this.notifications = new Map();
        this.alertIdCounter = 1;
        this.initializeAlertRules();
        this.initializeDashboards();
    }

    // 알림 규칙 초기화
    initializeAlertRules() {
        const rules = [
            {
                id: 'cpu_high',
                name: 'High CPU Usage',
                description: 'CPU 사용률이 80%를 초과할 때',
                condition: 'cpu_usage > 80',
                severity: 'warning',
                enabled: true,
                cooldown: 300000, // 5분
                actions: ['email', 'slack', 'webhook']
            },
            {
                id: 'memory_critical',
                name: 'Critical Memory Usage',
                description: '메모리 사용률이 95%를 초과할 때',
                condition: 'memory_usage > 95',
                severity: 'critical',
                enabled: true,
                cooldown: 60000, // 1분
                actions: ['email', 'slack', 'webhook', 'sms']
            },
            {
                id: 'disk_space',
                name: 'Low Disk Space',
                description: '디스크 공간이 90% 이상 사용될 때',
                condition: 'disk_usage > 90',
                severity: 'warning',
                enabled: true,
                cooldown: 600000, // 10분
                actions: ['email', 'slack']
            },
            {
                id: 'error_rate',
                name: 'High Error Rate',
                description: '에러율이 5%를 초과할 때',
                condition: 'error_rate > 5',
                severity: 'critical',
                enabled: true,
                cooldown: 120000, // 2분
                actions: ['email', 'slack', 'webhook', 'sms']
            },
            {
                id: 'response_time',
                name: 'Slow Response Time',
                description: '응답 시간이 2초를 초과할 때',
                condition: 'response_time > 2000',
                severity: 'warning',
                enabled: true,
                cooldown: 300000, // 5분
                actions: ['email', 'slack']
            }
        ];

        this.alertRules = new Map();
        rules.forEach(rule => {
            this.alertRules.set(rule.id, rule);
        });
    }

    // 대시보드 초기화
    initializeDashboards() {
        const dashboards = [
            {
                id: 'overview',
                name: 'System Overview',
                description: '전체 시스템 개요',
                widgets: [
                    { type: 'metric', title: 'CPU Usage', metric: 'cpu_usage', format: 'percentage' },
                    { type: 'metric', title: 'Memory Usage', metric: 'memory_usage', format: 'percentage' },
                    { type: 'metric', title: 'Disk Usage', metric: 'disk_usage', format: 'percentage' },
                    { type: 'chart', title: 'Response Time', metric: 'response_time', chartType: 'line' },
                    { type: 'chart', title: 'Request Rate', metric: 'request_rate', chartType: 'area' },
                    { type: 'table', title: 'Top Errors', metric: 'top_errors', limit: 10 }
                ],
                refreshInterval: 5000,
                isPublic: true
            },
            {
                id: 'performance',
                name: 'Performance Monitoring',
                description: '성능 모니터링',
                widgets: [
                    { type: 'chart', title: 'CPU Trends', metric: 'cpu_usage', chartType: 'line', period: '1h' },
                    { type: 'chart', title: 'Memory Trends', metric: 'memory_usage', chartType: 'line', period: '1h' },
                    { type: 'chart', title: 'Network I/O', metric: 'network_io', chartType: 'area', period: '1h' },
                    { type: 'chart', title: 'Database Performance', metric: 'db_performance', chartType: 'line', period: '1h' },
                    { type: 'gauge', title: 'System Health', metric: 'system_health', min: 0, max: 100 },
                    { type: 'heatmap', title: 'Error Distribution', metric: 'error_heatmap', period: '24h' }
                ],
                refreshInterval: 10000,
                isPublic: false
            },
            {
                id: 'alerts',
                name: 'Alert Center',
                description: '알림 센터',
                widgets: [
                    { type: 'alert_list', title: 'Active Alerts', status: 'active' },
                    { type: 'alert_list', title: 'Recent Alerts', status: 'recent', limit: 20 },
                    { type: 'chart', title: 'Alert Trends', metric: 'alert_trends', chartType: 'bar', period: '24h' },
                    { type: 'metric', title: 'Alert Rate', metric: 'alert_rate', format: 'count' },
                    { type: 'table', title: 'Alert Rules', metric: 'alert_rules' }
                ],
                refreshInterval: 2000,
                isPublic: false
            }
        ];

        dashboards.forEach(dashboard => {
            this.dashboards.set(dashboard.id, dashboard);
        });
    }

    // 실시간 메트릭 수집
    collectRealTimeMetrics() {
        const timestamp = new Date();
        const metrics = {
            timestamp,
            system: {
                cpu: {
                    usage: Math.random() * 100,
                    cores: 8,
                    load: Math.random() * 10,
                    temperature: 45 + Math.random() * 20
                },
                memory: {
                    total: 16 * 1024 * 1024 * 1024, // 16GB
                    used: Math.random() * 16 * 1024 * 1024 * 1024,
                    free: 16 * 1024 * 1024 * 1024 - Math.random() * 16 * 1024 * 1024 * 1024,
                    swap: {
                        total: 4 * 1024 * 1024 * 1024, // 4GB
                        used: Math.random() * 4 * 1024 * 1024 * 1024
                    }
                },
                disk: {
                    total: 500 * 1024 * 1024 * 1024, // 500GB
                    used: Math.random() * 500 * 1024 * 1024 * 1024,
                    free: 500 * 1024 * 1024 * 1024 - Math.random() * 500 * 1024 * 1024 * 1024,
                    iops: Math.random() * 1000,
                    throughput: Math.random() * 1000
                },
                network: {
                    bytesIn: Math.random() * 1000000,
                    bytesOut: Math.random() * 1000000,
                    packetsIn: Math.random() * 10000,
                    packetsOut: Math.random() * 10000,
                    connections: Math.floor(Math.random() * 1000),
                    latency: Math.random() * 100
                }
            },
            application: {
                requests: Math.floor(Math.random() * 10000),
                responseTime: Math.random() * 2000,
                errorRate: Math.random() * 10,
                activeUsers: Math.floor(Math.random() * 1000),
                sessions: Math.floor(Math.random() * 5000),
                throughput: Math.random() * 1000
            },
            database: {
                connections: Math.floor(Math.random() * 100),
                queries: Math.floor(Math.random() * 1000),
                slowQueries: Math.floor(Math.random() * 10),
                cacheHitRate: Math.random() * 100,
                lockWaits: Math.floor(Math.random() * 50),
                responseTime: Math.random() * 500
            },
            business: {
                revenue: Math.random() * 100000,
                conversions: Math.floor(Math.random() * 100),
                userSatisfaction: Math.random() * 5,
                churnRate: Math.random() * 10,
                growthRate: Math.random() * 20
            }
        };

        this.metrics.set(timestamp.toISOString(), metrics);
        return metrics;
    }

    // 예측 분석
    performPredictiveAnalysis(metricName, timeRange = '24h') {
        const historicalData = this.getHistoricalData(metricName, timeRange);
        const predictions = this.generatePredictions(historicalData);

        const prediction = {
            id: uuidv4(),
            metricName,
            timeRange,
            timestamp: new Date(),
            predictions: predictions,
            confidence: this.calculateConfidence(historicalData),
            accuracy: this.calculateAccuracy(historicalData),
            trends: this.analyzeTrends(historicalData),
            anomalies: this.detectAnomalies(historicalData),
            recommendations: this.generateRecommendations(historicalData, predictions)
        };

        this.predictions.set(prediction.id, prediction);
        return prediction;
    }

    // 예측 생성
    generatePredictions(historicalData) {
        const predictions = [];
        const now = new Date();

        // 향후 24시간 예측 (1시간 간격)
        for (let i = 1; i <= 24; i++) {
            const futureTime = new Date(now.getTime() + i * 60 * 60 * 1000);
            const predictedValue = this.calculatePredictedValue(historicalData, i);

            predictions.push({
                timestamp: futureTime,
                value: predictedValue,
                confidence: Math.random() * 100,
                upperBound: predictedValue * 1.2,
                lowerBound: predictedValue * 0.8
            });
        }

        return predictions;
    }

    // 예측값 계산
    calculatePredictedValue(historicalData, hoursAhead) {
        if (historicalData.length === 0) return 0;

        // 간단한 선형 회귀 기반 예측
        const recentValues = historicalData.slice(-24); // 최근 24개 데이터
        const trend = this.calculateTrend(recentValues);
        const lastValue = recentData[recentValues.length - 1]?.value || 0;

        return lastValue + (trend * hoursAhead);
    }

    // 트렌드 계산
    calculateTrend(data) {
        if (data.length < 2) return 0;

        const n = data.length;
        const sumX = (n * (n - 1)) / 2;
        const sumY = data.reduce((sum, point) => sum + point.value, 0);
        const sumXY = data.reduce((sum, point, index) => sum + (index * point.value), 0);
        const sumXX = (n * (n - 1) * (2 * n - 1)) / 6;

        return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    }

    // 신뢰도 계산
    calculateConfidence(historicalData) {
        if (historicalData.length < 10) return 50;

        const variance = this.calculateVariance(historicalData);
        const mean = historicalData.reduce((sum, point) => sum + point.value, 0) / historicalData.length;
        const coefficientOfVariation = Math.sqrt(variance) / mean;

        return Math.max(0, Math.min(100, 100 - coefficientOfVariation * 100));
    }

    // 정확도 계산
    calculateAccuracy(historicalData) {
        if (historicalData.length < 20) return 70;

        // 실제로는 과거 예측과 실제값 비교
        return 85 + Math.random() * 10;
    }

    // 트렌드 분석
    analyzeTrends(historicalData) {
        if (historicalData.length < 10) return { direction: 'stable', strength: 0 };

        const trend = this.calculateTrend(historicalData);
        const strength = Math.abs(trend);

        return {
            direction: trend > 0.1 ? 'increasing' : trend < -0.1 ? 'decreasing' : 'stable',
            strength: Math.min(100, strength * 100),
            slope: trend,
            rSquared: this.calculateRSquared(historicalData)
        };
    }

    // 이상치 탐지
    detectAnomalies(historicalData) {
        if (historicalData.length < 10) return [];

        const anomalies = [];
        const mean = historicalData.reduce((sum, point) => sum + point.value, 0) / historicalData.length;
        const stdDev = Math.sqrt(this.calculateVariance(historicalData));
        const threshold = 2 * stdDev; // 2 표준편차

        historicalData.forEach((point, index) => {
            if (Math.abs(point.value - mean) > threshold) {
                anomalies.push({
                    timestamp: point.timestamp,
                    value: point.value,
                    expectedValue: mean,
                    deviation: Math.abs(point.value - mean),
                    severity: Math.abs(point.value - mean) > 3 * stdDev ? 'high' : 'medium'
                });
            }
        });

        return anomalies;
    }

    // 추천사항 생성
    generateRecommendations(historicalData, predictions) {
        const recommendations = [];
        const trends = this.analyzeTrends(historicalData);

        if (trends.direction === 'increasing' && trends.strength > 70) {
            recommendations.push({
                type: 'scaling',
                priority: 'high',
                message: 'Consider scaling up resources due to increasing load',
                action: 'scale_up',
                estimatedImpact: 'high'
            });
        }

        if (trends.direction === 'decreasing' && trends.strength > 70) {
            recommendations.push({
                type: 'optimization',
                priority: 'medium',
                message: 'Consider optimizing resources due to decreasing load',
                action: 'scale_down',
                estimatedImpact: 'medium'
            });
        }

        const anomalies = this.detectAnomalies(historicalData);
        if (anomalies.length > 5) {
            recommendations.push({
                type: 'monitoring',
                priority: 'high',
                message: 'High number of anomalies detected, investigate system stability',
                action: 'investigate',
                estimatedImpact: 'high'
            });
        }

        return recommendations;
    }

    // 알림 생성
    createAlert(ruleId, metrics, severity = 'warning') {
        const rule = this.alertRules.get(ruleId);
        if (!rule || !rule.enabled) return null;

        const alertId = `alert_${this.alertIdCounter++}`;
        const alert = {
            id: alertId,
            ruleId,
            ruleName: rule.name,
            severity,
            message: rule.description,
            metrics,
            timestamp: new Date(),
            status: 'active',
            acknowledged: false,
            acknowledgedBy: null,
            acknowledgedAt: null,
            resolved: false,
            resolvedAt: null,
            actions: rule.actions,
            cooldownUntil: new Date(Date.now() + rule.cooldown)
        };

        this.alerts.set(alertId, alert);
        this.sendNotifications(alert);

        return alert;
    }

    // 알림 전송
    sendNotifications(alert) {
        alert.actions.forEach(action => {
            this.sendNotification(alert, action);
        });
    }

    // 개별 알림 전송
    sendNotification(alert, channel) {
        const notification = {
            id: uuidv4(),
            alertId: alert.id,
            channel,
            status: 'sent',
            timestamp: new Date(),
            message: this.formatNotificationMessage(alert, channel),
            recipients: this.getRecipients(channel),
            retryCount: 0
        };

        this.notifications.set(notification.id, notification);

        // 실제로는 각 채널별로 알림 전송
        console.log(`Sending ${channel} notification:`, notification.message);
    }

    // 알림 메시지 포맷팅
    formatNotificationMessage(alert, channel) {
        const timestamp = alert.timestamp.toISOString();
        const severity = alert.severity.toUpperCase();

        switch (channel) {
            case 'email':
                return {
                    subject: `[${severity}] ${alert.ruleName}`,
                    body: `${alert.message}\n\nTime: ${timestamp}\nSeverity: ${severity}\nMetrics: ${JSON.stringify(alert.metrics, null, 2)}`
                };
            case 'slack':
                return {
                    text: `🚨 *${alert.ruleName}*\n${alert.message}\n\n*Time:* ${timestamp}\n*Severity:* ${severity}`,
                    attachments: [{
                        color: alert.severity === 'critical' ? 'danger' : 'warning',
                        fields: Object.entries(alert.metrics).map(([key, value]) => ({
                            title: key,
                            value: value.toString(),
                            short: true
                        }))
                    }]
                };
            case 'webhook':
                return {
                    url: process.env.WEBHOOK_URL || 'http://localhost:3000/webhook',
                    payload: {
                        alert: alert,
                        timestamp: timestamp,
                        source: 'monitoring-system'
                    }
                };
            case 'sms':
                return {
                    message: `[${severity}] ${alert.ruleName}: ${alert.message}`
                };
            default:
                return { message: alert.message };
        }
    }

    // 수신자 조회
    getRecipients(channel) {
        const recipients = {
            email: ['admin@example.com', 'ops@example.com'],
            slack: ['#alerts', '#ops'],
            webhook: [process.env.WEBHOOK_URL || 'http://localhost:3000/webhook'],
            sms: ['+1234567890']
        };

        return recipients[channel] || [];
    }

    // 실시간 대시보드 데이터
    getDashboardData(dashboardId) {
        const dashboard = this.dashboards.get(dashboardId);
        if (!dashboard) return null;

        const currentMetrics = this.collectRealTimeMetrics();
        const dashboardData = {
            id: dashboardId,
            name: dashboard.name,
            description: dashboard.description,
            timestamp: new Date(),
            widgets: dashboard.widgets.map(widget => this.renderWidget(widget, currentMetrics)),
            refreshInterval: dashboard.refreshInterval,
            isPublic: dashboard.isPublic
        };

        return dashboardData;
    }

    // 위젯 렌더링
    renderWidget(widget, metrics) {
        const widgetData = {
            type: widget.type,
            title: widget.title,
            data: this.getWidgetData(widget, metrics),
            timestamp: new Date()
        };

        return widgetData;
    }

    // 위젯 데이터 조회
    getWidgetData(widget, metrics) {
        switch (widget.type) {
            case 'metric':
                return this.getMetricData(widget, metrics);
            case 'chart':
                return this.getChartData(widget, metrics);
            case 'table':
                return this.getTableData(widget, metrics);
            case 'gauge':
                return this.getGaugeData(widget, metrics);
            case 'heatmap':
                return this.getHeatmapData(widget, metrics);
            case 'alert_list':
                return this.getAlertListData(widget, metrics);
            default:
                return null;
        }
    }

    // 메트릭 데이터 조회
    getMetricData(widget, metrics) {
        const value = this.getMetricValue(widget.metric, metrics);
        return {
            value,
            format: widget.format || 'number',
            trend: this.calculateTrend([{ value }]),
            change: Math.random() * 20 - 10 // 실제로는 이전 값과 비교
        };
    }

    // 차트 데이터 조회
    getChartData(widget, metrics) {
        const period = widget.period || '1h';
        const historicalData = this.getHistoricalData(widget.metric, period);

        return {
            series: [{
                name: widget.title,
                data: historicalData.map(point => ({
                    x: point.timestamp,
                    y: point.value
                }))
            }],
            chartType: widget.chartType || 'line',
            period
        };
    }

    // 테이블 데이터 조회
    getTableData(widget, metrics) {
        const limit = widget.limit || 10;
        const data = this.getTableDataByMetric(widget.metric, metrics);

        return {
            columns: this.getTableColumns(widget.metric),
            rows: data.slice(0, limit),
            total: data.length
        };
    }

    // 게이지 데이터 조회
    getGaugeData(widget, metrics) {
        const value = this.getMetricValue(widget.metric, metrics);
        return {
            value,
            min: widget.min || 0,
            max: widget.max || 100,
            thresholds: [
                { value: 80, color: 'red' },
                { value: 60, color: 'yellow' },
                { value: 40, color: 'green' }
            ]
        };
    }

    // 히트맵 데이터 조회
    getHeatmapData(widget, metrics) {
        const period = widget.period || '24h';
        const data = this.getHeatmapDataByMetric(widget.metric, period);

        return {
            data,
            period,
            colorScale: 'viridis'
        };
    }

    // 알림 목록 데이터 조회
    getAlertListData(widget, metrics) {
        const status = widget.status || 'active';
        const limit = widget.limit || 20;

        let alerts = Array.from(this.alerts.values());

        if (status === 'active') {
            alerts = alerts.filter(alert => alert.status === 'active');
        } else if (status === 'recent') {
            alerts = alerts.filter(alert =>
                new Date() - alert.timestamp < 24 * 60 * 60 * 1000
            );
        }

        return {
            alerts: alerts.slice(0, limit),
            total: alerts.length
        };
    }

    // 메트릭 값 조회
    getMetricValue(metricPath, metrics) {
        const parts = metricPath.split('.');
        let value = metrics;

        for (const part of parts) {
            value = value[part];
            if (value === undefined) return 0;
        }

        return value;
    }

    // 히스토리컬 데이터 조회
    getHistoricalData(metricPath, timeRange) {
        const data = [];
        const now = new Date();
        const hours = timeRange === '1h' ? 1 : timeRange === '24h' ? 24 : 168; // 1주일
        const interval = timeRange === '1h' ? 60000 : 300000; // 1분 또는 5분

        for (let i = hours * 60; i >= 0; i -= interval / 60000) {
            const timestamp = new Date(now.getTime() - i * 60000);
            const value = Math.random() * 100; // 실제로는 저장된 데이터 조회

            data.push({ timestamp, value });
        }

        return data;
    }

    // 헬퍼 메서드들
    calculateVariance(data) {
        if (data.length < 2) return 0;

        const mean = data.reduce((sum, point) => sum + point.value, 0) / data.length;
        const squaredDiffs = data.map(point => Math.pow(point.value - mean, 2));
        return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / data.length;
    }

    calculateRSquared(data) {
        if (data.length < 2) return 0;

        const trend = this.calculateTrend(data);
        const mean = data.reduce((sum, point) => sum + point.value, 0) / data.length;

        const ssRes = data.reduce((sum, point, index) => {
            const predicted = mean + trend * index;
            return sum + Math.pow(point.value - predicted, 2);
        }, 0);

        const ssTot = data.reduce((sum, point) => {
            return sum + Math.pow(point.value - mean, 2);
        }, 0);

        return 1 - (ssRes / ssTot);
    }

    getTableDataByMetric(metric, metrics) {
        // 실제로는 메트릭에 따른 테이블 데이터 조회
        return [
            { name: 'Error 1', count: 15, percentage: 45.5 },
            { name: 'Error 2', count: 8, percentage: 24.2 },
            { name: 'Error 3', count: 5, percentage: 15.2 },
            { name: 'Error 4', count: 3, percentage: 9.1 },
            { name: 'Error 5', count: 2, percentage: 6.1 }
        ];
    }

    getTableColumns(metric) {
        return [
            { key: 'name', title: 'Name' },
            { key: 'count', title: 'Count' },
            { key: 'percentage', title: 'Percentage' }
        ];
    }

    getHeatmapDataByMetric(metric, period) {
        // 실제로는 히트맵 데이터 조회
        const data = [];
        const hours = period === '24h' ? 24 : 168;

        for (let hour = 0; hour < hours; hour++) {
            for (let minute = 0; minute < 60; minute += 10) {
                data.push({
                    x: hour,
                    y: minute,
                    value: Math.random() * 100
                });
            }
        }

        return data;
    }
}

// 전역 고급 모니터링 시스템 인스턴스
const monitoringSystem = new AdvancedMonitoringSystem();

// 미들웨어: 인증 확인
const authenticateUser = (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ success: false, message: '인증이 필요합니다.' });
    }
    req.user = { id: 'user1', role: 'admin' };
    next();
};

// 실시간 메트릭 수집
router.get('/metrics', authenticateUser, async (req, res) => {
    try {
        const metrics = monitoringSystem.collectRealTimeMetrics();

        res.json({
            success: true,
            data: metrics
        });
    } catch (error) {
        console.error('메트릭 수집 오류:', error);
        res.status(500).json({
            success: false,
            message: '메트릭 수집 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 예측 분석
router.post('/predict', authenticateUser, async (req, res) => {
    try {
        const { metricName, timeRange } = req.body;
        const prediction = monitoringSystem.performPredictiveAnalysis(metricName, timeRange);

        res.json({
            success: true,
            message: '예측 분석이 완료되었습니다.',
            data: prediction
        });
    } catch (error) {
        console.error('예측 분석 오류:', error);
        res.status(500).json({
            success: false,
            message: '예측 분석 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 대시보드 데이터 조회
router.get('/dashboard/:id', authenticateUser, async (req, res) => {
    try {
        const { id } = req.params;
        const dashboardData = monitoringSystem.getDashboardData(id);

        if (!dashboardData) {
            return res.status(404).json({
                success: false,
                message: '대시보드를 찾을 수 없습니다.'
            });
        }

        res.json({
            success: true,
            data: dashboardData
        });
    } catch (error) {
        console.error('대시보드 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '대시보드 조회 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 알림 생성
router.post('/alerts', authenticateUser, async (req, res) => {
    try {
        const { ruleId, metrics, severity } = req.body;
        const alert = monitoringSystem.createAlert(ruleId, metrics, severity);

        if (!alert) {
            return res.status(400).json({
                success: false,
                message: '알림 규칙을 찾을 수 없거나 비활성화되어 있습니다.'
            });
        }

        res.status(201).json({
            success: true,
            message: '알림이 생성되었습니다.',
            data: alert
        });
    } catch (error) {
        console.error('알림 생성 오류:', error);
        res.status(500).json({
            success: false,
            message: '알림 생성 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 알림 목록 조회
router.get('/alerts', authenticateUser, async (req, res) => {
    try {
        const { status, severity, limit = 50 } = req.query;
        let alerts = Array.from(monitoringSystem.alerts.values());

        if (status) {
            alerts = alerts.filter(alert => alert.status === status);
        }

        if (severity) {
            alerts = alerts.filter(alert => alert.severity === severity);
        }

        alerts = alerts.slice(0, parseInt(limit));

        res.json({
            success: true,
            data: alerts
        });
    } catch (error) {
        console.error('알림 목록 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '알림 목록 조회 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 알림 확인
router.patch('/alerts/:id/acknowledge', authenticateUser, async (req, res) => {
    try {
        const { id } = req.params;
        const alert = monitoringSystem.alerts.get(id);

        if (!alert) {
            return res.status(404).json({
                success: false,
                message: '알림을 찾을 수 없습니다.'
            });
        }

        alert.acknowledged = true;
        alert.acknowledgedBy = req.user.id;
        alert.acknowledgedAt = new Date();

        res.json({
            success: true,
            message: '알림이 확인되었습니다.',
            data: alert
        });
    } catch (error) {
        console.error('알림 확인 오류:', error);
        res.status(500).json({
            success: false,
            message: '알림 확인 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 알림 해결
router.patch('/alerts/:id/resolve', authenticateUser, async (req, res) => {
    try {
        const { id } = req.params;
        const alert = monitoringSystem.alerts.get(id);

        if (!alert) {
            return res.status(404).json({
                success: false,
                message: '알림을 찾을 수 없습니다.'
            });
        }

        alert.resolved = true;
        alert.resolvedAt = new Date();
        alert.status = 'resolved';

        res.json({
            success: true,
            message: '알림이 해결되었습니다.',
            data: alert
        });
    } catch (error) {
        console.error('알림 해결 오류:', error);
        res.status(500).json({
            success: false,
            message: '알림 해결 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 알림 규칙 목록 조회
router.get('/alert-rules', authenticateUser, async (req, res) => {
    try {
        const rules = Array.from(monitoringSystem.alertRules.values());

        res.json({
            success: true,
            data: rules
        });
    } catch (error) {
        console.error('알림 규칙 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '알림 규칙 조회 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 대시보드 목록 조회
router.get('/dashboards', authenticateUser, async (req, res) => {
    try {
        const dashboards = Array.from(monitoringSystem.dashboards.values());

        res.json({
            success: true,
            data: dashboards
        });
    } catch (error) {
        console.error('대시보드 목록 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '대시보드 목록 조회 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

module.exports = router;
