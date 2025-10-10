/**
 * 성능 모니터링 대시보드 (v1.3)
 * 실시간 성능 추적 및 분석 시스템
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Grid } from '@mui/material';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Button,
    LinearProgress,
    CircularProgress,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Alert,
    AlertTitle,
    IconButton,
    Tooltip,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Divider,
    Switch,
    FormControlLabel,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Slider,
    Tabs,
    Tab,
    Accordion,
    AccordionSummary,
    AccordionDetails
} from '@mui/material';
import {
    Speed,
    Memory,
    NetworkCheck,
    Analytics,
    TrendingUp,
    TrendingDown,
    Warning,
    Error,
    CheckCircle,
    Refresh,
    Settings,
    Timeline,
    BarChart,
    PieChart,
    ExpandMore,
    Monitor,
    Smartphone,
    Tablet,
    Computer,
    Cloud,
    Storage,
    MonitorHeart,
    Wifi,
    SignalCellular4Bar,
    Battery6Bar,
    Thermostat,
    Security,
    Shield,
    BugReport,
} from '@mui/icons-material';

// 타입 정의
interface PerformanceMetric {
    id: string;
    name: string;
    value: number;
    unit: string;
    threshold: number;
    status: 'good' | 'warning' | 'critical';
    trend: 'up' | 'down' | 'stable';
    timestamp: Date;
    description: string;
}

interface SystemHealth {
    overall: 'healthy' | 'warning' | 'critical';
    cpu: number;
    memory: number;
    disk: number;
    network: number;
    uptime: number;
    lastUpdate: Date;
}

interface PerformanceAlert {
    id: string;
    type: 'performance' | 'error' | 'security' | 'capacity';
    severity: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    timestamp: Date;
    resolved: boolean;
    actionRequired: boolean;
}

// 메인 컴포넌트
const PerformanceMonitoringDashboard: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
    const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
    const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
    const [selectedTab, setSelectedTab] = useState(0);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [refreshInterval, setRefreshInterval] = useState(30);

    // 데이터 로드
    const loadPerformanceData = useCallback(async () => {
        setLoading(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));

            // 모의 성능 메트릭
            const mockMetrics: PerformanceMetric[] = [
                {
                    id: '1',
                    name: '페이지 로딩 시간',
                    value: 1.2,
                    unit: '초',
                    threshold: 2.0,
                    status: 'good',
                    trend: 'down',
                    timestamp: new Date(),
                    description: '평균 페이지 로딩 시간'
                },
                {
                    id: '2',
                    name: 'API 응답 시간',
                    value: 0.8,
                    unit: '초',
                    threshold: 1.5,
                    status: 'good',
                    trend: 'stable',
                    timestamp: new Date(),
                    description: '평균 API 응답 시간'
                },
                {
                    id: '3',
                    name: '메모리 사용량',
                    value: 245,
                    unit: 'MB',
                    threshold: 500,
                    status: 'good',
                    trend: 'up',
                    timestamp: new Date(),
                    description: '현재 메모리 사용량'
                },
                {
                    id: '4',
                    name: 'CPU 사용률',
                    value: 15,
                    unit: '%',
                    threshold: 80,
                    status: 'good',
                    trend: 'stable',
                    timestamp: new Date(),
                    description: '현재 CPU 사용률'
                },
                {
                    id: '5',
                    name: '네트워크 지연',
                    value: 45,
                    unit: 'ms',
                    threshold: 100,
                    status: 'good',
                    trend: 'down',
                    timestamp: new Date(),
                    description: '평균 네트워크 지연 시간'
                },
                {
                    id: '6',
                    name: '에러율',
                    value: 0.1,
                    unit: '%',
                    threshold: 1.0,
                    status: 'good',
                    trend: 'stable',
                    timestamp: new Date(),
                    description: '현재 에러 발생률'
                }
            ];

            setMetrics(mockMetrics);

            // 시스템 상태
            const mockSystemHealth: SystemHealth = {
                overall: 'healthy',
                cpu: 15,
                memory: 245,
                disk: 60,
                network: 45,
                uptime: 99.8,
                lastUpdate: new Date()
            };

            setSystemHealth(mockSystemHealth);

            // 알림
            const mockAlerts: PerformanceAlert[] = [
                {
                    id: '1',
                    type: 'performance',
                    severity: 'medium',
                    title: '메모리 사용량 증가',
                    description: '메모리 사용량이 지난 1시간 동안 20% 증가했습니다.',
                    timestamp: new Date(Date.now() - 1000 * 60 * 30),
                    resolved: false,
                    actionRequired: true
                },
                {
                    id: '2',
                    type: 'capacity',
                    severity: 'low',
                    title: '디스크 공간 부족',
                    description: '디스크 사용량이 80%에 도달했습니다.',
                    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
                    resolved: false,
                    actionRequired: false
                }
            ];

            setAlerts(mockAlerts);

        } catch (error) {
            console.error('Failed to load performance data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    // 상태별 색상
    const getStatusColor = (status: PerformanceMetric['status']) => {
        switch (status) {
            case 'good': return 'success';
            case 'warning': return 'warning';
            case 'critical': return 'error';
            default: return 'primary';
        }
    };

    // 트렌드 아이콘
    const getTrendIcon = (trend: PerformanceMetric['trend']) => {
        switch (trend) {
            case 'up': return <TrendingUp color="error" />;
            case 'down': return <TrendingDown color="success" />;
            case 'stable': return <Timeline color="info" />;
            default: return <Timeline color="info" />;
        }
    };

    // 심각도별 색상
    const getSeverityColor = (severity: PerformanceAlert['severity']) => {
        switch (severity) {
            case 'low': return 'info';
            case 'medium': return 'warning';
            case 'high': return 'error';
            case 'critical': return 'error';
            default: return 'default';
        }
    };

    // 자동 새로고침
    useEffect(() => {
        if (autoRefresh) {
            const interval = setInterval(loadPerformanceData, refreshInterval * 1000);
            return () => clearInterval(interval);
        }
    }, [autoRefresh, refreshInterval, loadPerformanceData]);

    // 초기 로드
    useEffect(() => {
        loadPerformanceData();
    }, [loadPerformanceData]);

    return (
        <Box sx={{ p: 3 }}>
            {/* 헤더 */}
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
                    📊 성능 모니터링 대시보드 (v1.3)
                </Typography>

                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={autoRefresh}
                                onChange={(e) => setAutoRefresh(e.target.checked)}
                            />
                        }
                        label="자동 새로고침"
                    />

                    <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>간격</InputLabel>
                        <Select
                            value={refreshInterval}
                            label="간격"
                            onChange={(e) => setRefreshInterval(e.target.value as number)}
                        >
                            <MenuItem value={10}>10초</MenuItem>
                            <MenuItem value={30}>30초</MenuItem>
                            <MenuItem value={60}>1분</MenuItem>
                            <MenuItem value={300}>5분</MenuItem>
                        </Select>
                    </FormControl>

                    <Button
                        variant="outlined"
                        startIcon={<Refresh />}
                        onClick={loadPerformanceData}
                        disabled={loading}
                    >
                        새로고침
                    </Button>
                </Box>
            </Box>

            {/* 시스템 상태 개요 */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        🖥️ 시스템 상태 개요
                    </Typography>

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                        <Box sx={{ width: { xs: '100%', md: '25%' }, p: 1 }}>
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="h3" color={systemHealth?.overall === 'healthy' ? 'success.main' : 'error.main'}>
                                    {systemHealth?.overall === 'healthy' ? '✅' : '⚠️'}
                                </Typography>
                                <Typography variant="h6">
                                    {systemHealth?.overall === 'healthy' ? '정상' : '주의'}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    전체 시스템 상태
                                </Typography>
                            </Box>
                        </Box>

                        <Box sx={{ width: { xs: '100%', md: '25%' }, p: 1 }}>
                            <Box sx={{ textAlign: 'center' }}>
                                <MonitorHeart sx={{ fontSize: 40, color: 'primary.main' }} />
                                <Typography variant="h6">
                                    {systemHealth?.cpu}%
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    CPU 사용률
                                </Typography>
                            </Box>
                        </Box>

                        <Box sx={{ width: { xs: '100%', md: '25%' }, p: 1 }}>
                            <Box sx={{ textAlign: 'center' }}>
                                <Memory sx={{ fontSize: 40, color: 'info.main' }} />
                                <Typography variant="h6">
                                    {systemHealth?.memory}MB
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    메모리 사용량
                                </Typography>
                            </Box>
                        </Box>

                        <Box sx={{ width: { xs: '100%', md: '25%' }, p: 1 }}>
                            <Box sx={{ textAlign: 'center' }}>
                                <NetworkCheck sx={{ fontSize: 40, color: 'success.main' }} />
                                <Typography variant="h6">
                                    {systemHealth?.uptime}%
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    가동률
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                </CardContent>
            </Card>

            {/* 성능 메트릭 */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        📈 실시간 성능 메트릭
                    </Typography>

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                        {metrics.map((metric) => (
                            <Box sx={{ width: { xs: '100%', sm: '50%', md: '33.33%' }, p: 1 }} key={metric.id}>
                                <Card variant="outlined">
                                    <CardContent>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                            <Typography variant="subtitle2">
                                                {metric.name}
                                            </Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                {getTrendIcon(metric.trend)}
                                                <Chip
                                                    label={metric.status}
                                                    size="small"
                                                    color={getStatusColor(metric.status)}
                                                />
                                            </Box>
                                        </Box>

                                        <Typography variant="h4" sx={{ mb: 1 }}>
                                            {metric.value}{metric.unit}
                                        </Typography>

                                        <LinearProgress
                                            variant="determinate"
                                            value={(metric.value / metric.threshold) * 100}
                                            color={getStatusColor(metric.status)}
                                            sx={{ mb: 1 }}
                                        />

                                        <Typography variant="caption" color="text.secondary">
                                            임계값: {metric.threshold}{metric.unit}
                                        </Typography>

                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                            {metric.description}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Box>
                        ))}
                    </Box>
                </CardContent>
            </Card>

            {/* 알림 및 경고 */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        🚨 알림 및 경고
                    </Typography>

                    {alerts.length === 0 ? (
                        <Alert severity="success">
                            <AlertTitle>모든 시스템 정상</AlertTitle>
                            현재 활성화된 알림이 없습니다.
                        </Alert>
                    ) : (
                        <List>
                            {alerts.map((alert) => (
                                <ListItem key={alert.id} divider>
                                    <ListItemIcon>
                                        {alert.type === 'performance' && <Speed color="warning" />}
                                        {alert.type === 'error' && <Error color="error" />}
                                        {alert.type === 'security' && <Security color="error" />}
                                        {alert.type === 'capacity' && <Storage color="warning" />}
                                    </ListItemIcon>

                                    <ListItemText
                                        primary={
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography variant="subtitle1">
                                                    {alert.title}
                                                </Typography>
                                                <Chip
                                                    label={alert.severity}
                                                    size="small"
                                                    color={getSeverityColor(alert.severity)}
                                                />
                                                {alert.actionRequired && (
                                                    <Chip
                                                        label="조치 필요"
                                                        size="small"
                                                        color="error"
                                                        variant="outlined"
                                                    />
                                                )}
                                            </Box>
                                        }
                                        secondary={
                                            <Box>
                                                <Typography variant="body2" color="text.secondary">
                                                    {alert.description}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {alert.timestamp.toLocaleString()}
                                                </Typography>
                                            </Box>
                                        }
                                    />
                                </ListItem>
                            ))}
                        </List>
                    )}
                </CardContent>
            </Card>

            {/* 성능 추천사항 */}
            <Card>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        💡 성능 최적화 추천사항
                    </Typography>

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                        <Box sx={{ width: { xs: '100%', md: '50%' }, p: 1 }}>
                            <Alert severity="info">
                                <AlertTitle>메모리 최적화</AlertTitle>
                                이미지 지연 로딩을 활성화하여 초기 로딩 시간을 단축할 수 있습니다.
                            </Alert>
                        </Box>

                        <Box sx={{ width: { xs: '100%', md: '50%' }, p: 1 }}>
                            <Alert severity="success">
                                <AlertTitle>캐싱 개선</AlertTitle>
                                API 응답 캐싱을 통해 네트워크 요청을 줄일 수 있습니다.
                            </Alert>
                        </Box>

                        <Box sx={{ width: { xs: '100%', md: '50%' }, p: 1 }}>
                            <Alert severity="warning">
                                <AlertTitle>번들 크기</AlertTitle>
                                코드 스플리팅을 적용하여 초기 번들 크기를 줄일 수 있습니다.
                            </Alert>
                        </Box>

                        <Box sx={{ width: { xs: '100%', md: '50%' }, p: 1 }}>
                            <Alert severity="info">
                                <AlertTitle>CDN 활용</AlertTitle>
                                정적 자원을 CDN에 배포하여 로딩 속도를 개선할 수 있습니다.
                            </Alert>
                        </Box>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
};

export default PerformanceMonitoringDashboard;
