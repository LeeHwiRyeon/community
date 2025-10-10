import React, { useState, useEffect, useCallback } from 'react';
import { Grid } from '@mui/material';
import {
    Box,
    Typography,
    Card,
    CardContent,
    LinearProgress,
    Chip,
    IconButton,
    Tooltip,
    Alert,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Divider,
    Paper,
    Switch,
    FormControlLabel,
    Slider,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField
} from '@mui/material';
import {
    Monitor,
    Speed,
    Memory,
    Storage,
    NetworkCheck,
    Security,
    Warning,
    CheckCircle,
    Error,
    Refresh,
    Settings,
    TrendingUp,
    TrendingDown,
    TrendingFlat,
    Notifications,
    NotificationsOff
} from '@mui/icons-material';

interface SystemMetric {
    id: string;
    name: string;
    value: number;
    unit: string;
    status: 'good' | 'warning' | 'critical';
    trend: 'up' | 'down' | 'stable';
    threshold: {
        warning: number;
        critical: number;
    };
    lastUpdated: Date;
}

interface AlertItem {
    id: string;
    type: 'error' | 'warning' | 'info' | 'success';
    message: string;
    timestamp: Date;
    resolved: boolean;
}

const RealTimeMonitoringDashboard: React.FC = () => {
    const [metrics, setMetrics] = useState<SystemMetric[]>([]);
    const [alerts, setAlerts] = useState<AlertItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [refreshInterval, setRefreshInterval] = useState(5000);
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [selectedMetric, setSelectedMetric] = useState<SystemMetric | null>(null);
    const [openDialog, setOpenDialog] = useState(false);

    useEffect(() => {
        loadMetrics();
        loadAlerts();

        if (autoRefresh) {
            const interval = setInterval(() => {
                loadMetrics();
                loadAlerts();
            }, refreshInterval);

            return () => clearInterval(interval);
        }
    }, [autoRefresh, refreshInterval]);

    const loadMetrics = useCallback(async () => {
        try {
            // 시뮬레이션된 실시간 메트릭 데이터
            const mockMetrics: SystemMetric[] = [
                {
                    id: 'cpu-usage',
                    name: 'CPU 사용률',
                    value: Math.random() * 100,
                    unit: '%',
                    status: Math.random() > 0.8 ? 'critical' : Math.random() > 0.6 ? 'warning' : 'good',
                    trend: Math.random() > 0.5 ? 'up' : Math.random() > 0.3 ? 'down' : 'stable',
                    threshold: { warning: 70, critical: 90 },
                    lastUpdated: new Date()
                },
                {
                    id: 'memory-usage',
                    name: '메모리 사용률',
                    value: Math.random() * 100,
                    unit: '%',
                    status: Math.random() > 0.7 ? 'warning' : 'good',
                    trend: Math.random() > 0.5 ? 'up' : 'down',
                    threshold: { warning: 80, critical: 95 },
                    lastUpdated: new Date()
                },
                {
                    id: 'disk-usage',
                    name: '디스크 사용률',
                    value: Math.random() * 100,
                    unit: '%',
                    status: Math.random() > 0.9 ? 'critical' : Math.random() > 0.8 ? 'warning' : 'good',
                    trend: 'stable',
                    threshold: { warning: 85, critical: 95 },
                    lastUpdated: new Date()
                },
                {
                    id: 'network-latency',
                    name: '네트워크 지연시간',
                    value: Math.random() * 100,
                    unit: 'ms',
                    status: Math.random() > 0.8 ? 'warning' : 'good',
                    trend: Math.random() > 0.5 ? 'up' : 'down',
                    threshold: { warning: 50, critical: 100 },
                    lastUpdated: new Date()
                },
                {
                    id: 'active-connections',
                    name: '활성 연결수',
                    value: Math.floor(Math.random() * 1000),
                    unit: '개',
                    status: Math.random() > 0.9 ? 'warning' : 'good',
                    trend: Math.random() > 0.5 ? 'up' : 'down',
                    threshold: { warning: 800, critical: 950 },
                    lastUpdated: new Date()
                },
                {
                    id: 'response-time',
                    name: '응답 시간',
                    value: Math.random() * 500,
                    unit: 'ms',
                    status: Math.random() > 0.7 ? 'warning' : 'good',
                    trend: Math.random() > 0.5 ? 'up' : 'down',
                    threshold: { warning: 200, critical: 500 },
                    lastUpdated: new Date()
                }
            ];

            setMetrics(mockMetrics);
        } catch (error) {
            console.error('메트릭 로드 실패:', error);
        }
    }, []);

    const loadAlerts = useCallback(async () => {
        try {
            // 시뮬레이션된 알림 데이터
            const mockAlerts: AlertItem[] = [
                {
                    id: '1',
                    type: 'warning',
                    message: 'CPU 사용률이 80%를 초과했습니다.',
                    timestamp: new Date(Date.now() - 300000),
                    resolved: false
                },
                {
                    id: '2',
                    type: 'error',
                    message: '데이터베이스 연결 오류가 발생했습니다.',
                    timestamp: new Date(Date.now() - 600000),
                    resolved: true
                },
                {
                    id: '3',
                    type: 'info',
                    message: '시스템 업데이트가 완료되었습니다.',
                    timestamp: new Date(Date.now() - 900000),
                    resolved: true
                },
                {
                    id: '4',
                    type: 'success',
                    message: '백업이 성공적으로 완료되었습니다.',
                    timestamp: new Date(Date.now() - 1200000),
                    resolved: true
                }
            ];

            setAlerts(mockAlerts);
        } catch (error) {
            console.error('알림 로드 실패:', error);
        }
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'good': return 'success';
            case 'warning': return 'warning';
            case 'critical': return 'error';
            default: return 'default';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'good': return <CheckCircle color="success" />;
            case 'warning': return <Warning color="warning" />;
            case 'critical': return <Error color="error" />;
            default: return <Monitor />;
        }
    };

    const getTrendIcon = (trend: string) => {
        switch (trend) {
            case 'up': return <TrendingUp color="error" />;
            case 'down': return <TrendingDown color="success" />;
            case 'stable': return <TrendingFlat color="info" />;
            default: return <TrendingFlat />;
        }
    };

    const getAlertIcon = (type: string) => {
        switch (type) {
            case 'error': return <Error color="error" />;
            case 'warning': return <Warning color="warning" />;
            case 'info': return <Monitor color="info" />;
            case 'success': return <CheckCircle color="success" />;
            default: return <Monitor />;
        }
    };

    const handleRefresh = () => {
        setLoading(true);
        loadMetrics();
        loadAlerts();
        setTimeout(() => setLoading(false), 1000);
    };

    const handleMetricClick = (metric: SystemMetric) => {
        setSelectedMetric(metric);
        setOpenDialog(true);
    };

    const resolveAlert = (alertId: string) => {
        setAlerts(prev => prev.map(alert =>
            alert.id === alertId ? { ...alert, resolved: true } : alert
        ));
    };

    return (
        <Box sx={{ width: '100%' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4" component="h1">
                    📊 실시간 모니터링 대시보드
                </Typography>
                <Box display="flex" alignItems="center" gap={2}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={autoRefresh}
                                onChange={(e) => setAutoRefresh(e.target.checked)}
                            />
                        }
                        label="자동 새로고침"
                    />
                    <FormControlLabel
                        control={
                            <Switch
                                checked={notificationsEnabled}
                                onChange={(e) => setNotificationsEnabled(e.target.checked)}
                            />
                        }
                        label="알림"
                    />
                    <Tooltip title="새로고침">
                        <IconButton onClick={handleRefresh} disabled={loading}>
                            <Refresh />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                {/* 시스템 메트릭 */}
                <Box sx={{ width: '100%', p: 1 }}>
                    <Typography variant="h6" gutterBottom>
                        시스템 메트릭
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                        {metrics.map((metric) => (
                            <Box sx={{ width: { xs: '100%', sm: '50%', md: '33.33%', lg: '16.66%' }, p: 1 }} key={metric.id}>
                                <Card
                                    sx={{
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                        '&:hover': {
                                            transform: 'translateY(-2px)',
                                            boxShadow: 3
                                        }
                                    }}
                                    onClick={() => handleMetricClick(metric)}
                                >
                                    <CardContent sx={{ p: 2 }}>
                                        <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                                            <Typography variant="body2" color="text.secondary">
                                                {metric.name}
                                            </Typography>
                                            {getStatusIcon(metric.status)}
                                        </Box>

                                        <Typography variant="h4" component="div" gutterBottom>
                                            {metric.value.toFixed(1)}{metric.unit}
                                        </Typography>

                                        <Box display="flex" alignItems="center" justifyContent="space-between">
                                            <LinearProgress
                                                variant="determinate"
                                                value={metric.value}
                                                color={getStatusColor(metric.status) as any}
                                                sx={{ width: '100%', height: 6, borderRadius: 3 }}
                                            />
                                            {getTrendIcon(metric.trend)}
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Box>
                        ))}
                    </Box>
                </Box>

                {/* 알림 및 이벤트 */}
                <Box sx={{ width: { xs: '100%', md: '50%' }, p: 1 }}>
                    <Card>
                        <CardContent>
                            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                                <Typography variant="h6">
                                    알림 및 이벤트
                                </Typography>
                                <Chip
                                    label={`${alerts.filter(a => !a.resolved).length}개 미해결`}
                                    color="warning"
                                    size="small"
                                />
                            </Box>

                            <List dense>
                                {alerts.slice(0, 5).map((alert) => (
                                    <ListItem key={alert.id}>
                                        <ListItemIcon>
                                            {getAlertIcon(alert.type)}
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={alert.message}
                                            secondary={alert.timestamp.toLocaleString()}
                                        />
                                        {!alert.resolved && (
                                            <Button
                                                size="small"
                                                onClick={() => resolveAlert(alert.id)}
                                            >
                                                해결
                                            </Button>
                                        )}
                                    </ListItem>
                                ))}
                            </List>
                        </CardContent>
                    </Card>
                </Box>

                {/* 성능 요약 */}
                <Box sx={{ width: { xs: '100%', md: '50%' }, p: 1 }}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                성능 요약
                            </Typography>

                            <Box mb={2}>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    전체 시스템 상태
                                </Typography>
                                <Box display="flex" alignItems="center">
                                    <CheckCircle color="success" sx={{ mr: 1 }} />
                                    <Typography variant="body1">
                                        정상 ({metrics.filter(m => m.status === 'good').length}/{metrics.length})
                                    </Typography>
                                </Box>
                            </Box>

                            <Box mb={2}>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    평균 응답 시간
                                </Typography>
                                <Typography variant="h5">
                                    {metrics.find(m => m.id === 'response-time')?.value.toFixed(0)}ms
                                </Typography>
                            </Box>

                            <Box mb={2}>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    활성 연결
                                </Typography>
                                <Typography variant="h5">
                                    {metrics.find(m => m.id === 'active-connections')?.value.toFixed(0)}개
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Box>
            </Box>

            {/* 메트릭 상세 다이얼로그 */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {selectedMetric?.name} 상세 정보
                </DialogTitle>
                <DialogContent>
                    {selectedMetric && (
                        <Box>
                            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                                <Typography variant="h4">
                                    {selectedMetric.value.toFixed(1)}{selectedMetric.unit}
                                </Typography>
                                <Box display="flex" alignItems="center">
                                    {getStatusIcon(selectedMetric.status)}
                                    {getTrendIcon(selectedMetric.trend)}
                                </Box>
                            </Box>

                            <LinearProgress
                                variant="determinate"
                                value={selectedMetric.value}
                                color={getStatusColor(selectedMetric.status) as any}
                                sx={{ height: 10, borderRadius: 5, mb: 2 }}
                            />

                            <Box display="flex" justifyContent="space-between" mb={2}>
                                <Typography variant="body2" color="text.secondary">
                                    경고 임계값: {selectedMetric.threshold.warning}{selectedMetric.unit}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    위험 임계값: {selectedMetric.threshold.critical}{selectedMetric.unit}
                                </Typography>
                            </Box>

                            <Typography variant="body2" color="text.secondary">
                                마지막 업데이트: {selectedMetric.lastUpdated.toLocaleString()}
                            </Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)}>닫기</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default RealTimeMonitoringDashboard;
