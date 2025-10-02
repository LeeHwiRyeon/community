import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Grid, Card, CardContent, Button, CircularProgress, Alert,
    Tabs, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Chip, IconButton, LinearProgress, List, ListItem, ListItemText,
    ListItemIcon, Divider, Switch, FormControlLabel, Slider, TextField
} from '@mui/material';
import {
    Dashboard as DashboardIcon,
    Warning as WarningIcon,
    CheckCircle as CheckCircleIcon,
    Error as ErrorIcon,
    Info as InfoIcon,
    Refresh as RefreshIcon,
    Settings as SettingsIcon,
    Timeline as TimelineIcon,
    Memory as MemoryIcon,
    Storage as StorageIcon,
    NetworkCheck as NetworkIcon,
    Speed as SpeedIcon
} from '@mui/icons-material';

interface SystemMetrics {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    networkUsage: number;
}

interface ApplicationMetrics {
    httpRequests: number;
    activeConnections: number;
    errorRate: number;
}

interface Alert {
    id: string;
    type: string;
    severity: 'info' | 'warning' | 'error' | 'critical';
    message: string;
    value: number;
    threshold: number;
    timestamp: string;
    status: 'active' | 'resolved';
}

interface DashboardData {
    system: SystemMetrics;
    application: ApplicationMetrics;
    database: {
        connections: number;
        queryDuration: number;
    };
    business: {
        userSessions: number;
        contentCreated: number;
    };
    alerts: Alert[];
    notifications: any[];
}

const MonitoringDashboard: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState(0);
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [systemStatus, setSystemStatus] = useState<any>(null);
    const [realTimeMode, setRealTimeMode] = useState(false);
    const [refreshInterval, setRefreshInterval] = useState(5);

    useEffect(() => {
        fetchDashboardData();

        if (realTimeMode) {
            const interval = setInterval(fetchDashboardData, refreshInterval * 1000);
            return () => clearInterval(interval);
        }
    }, [realTimeMode, refreshInterval]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            // 대시보드 데이터 조회
            const dashboardResponse = await fetch('http://localhost:5000/api/monitoring/dashboard');
            if (!dashboardResponse.ok) throw new Error(`Failed to fetch dashboard data: ${dashboardResponse.status}`);
            const dashboardResult = await dashboardResponse.json();
            setDashboardData(dashboardResult.data);

            // 시스템 상태 조회
            const statusResponse = await fetch('http://localhost:5000/api/monitoring/status');
            if (!statusResponse.ok) throw new Error(`Failed to fetch system status: ${statusResponse.status}`);
            const statusResult = await statusResponse.json();
            setSystemStatus(statusResult.data);

            setLoading(false);
        } catch (e: any) {
            setError(e.message);
            setLoading(false);
        }
    };

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
    };

    const handleResolveAlert = async (alertId: string) => {
        try {
            const response = await fetch(`http://localhost:5000/api/monitoring/alerts/${alertId}/resolve`, {
                method: 'PATCH'
            });

            if (!response.ok) throw new Error(`Failed to resolve alert: ${response.status}`);

            // 대시보드 데이터 새로고침
            await fetchDashboardData();
        } catch (e: any) {
            console.error('Error resolving alert:', e.message);
        }
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return 'error';
            case 'error': return 'error';
            case 'warning': return 'warning';
            case 'info': return 'info';
            default: return 'default';
        }
    };

    const getSeverityIcon = (severity: string) => {
        switch (severity) {
            case 'critical': return <ErrorIcon />;
            case 'error': return <ErrorIcon />;
            case 'warning': return <WarningIcon />;
            case 'info': return <InfoIcon />;
            default: return <InfoIcon />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'healthy': return 'success';
            case 'warning': return 'warning';
            case 'critical': return 'error';
            default: return 'default';
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">Error: {error}</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center' }}>
                    <DashboardIcon sx={{ mr: 1 }} /> 모니터링 대시보드
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={realTimeMode}
                                onChange={(e) => setRealTimeMode(e.target.checked)}
                            />
                        }
                        label="실시간 모드"
                    />
                    <TextField
                        size="small"
                        label="새로고침 간격(초)"
                        type="number"
                        value={refreshInterval}
                        onChange={(e) => setRefreshInterval(parseInt(e.target.value) || 5)}
                        disabled={!realTimeMode}
                        sx={{ width: 150 }}
                    />
                    <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={fetchDashboardData}
                    >
                        새로고침
                    </Button>
                </Box>
            </Box>

            {/* 시스템 상태 카드 */}
            {systemStatus && (
                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="h6">시스템 상태</Typography>
                            <Chip
                                label={systemStatus.status}
                                color={getStatusColor(systemStatus.status)}
                                icon={systemStatus.status === 'healthy' ? <CheckCircleIcon /> : <WarningIcon />}
                            />
                        </Box>
                        <Grid container spacing={2} sx={{ mt: 2 }}>
                            <Grid item xs={12} sm={3}>
                                <Typography variant="body2" color="text.secondary">CPU 사용률</Typography>
                                <Typography variant="h6">{systemStatus.cpuUsage}%</Typography>
                                <LinearProgress
                                    variant="determinate"
                                    value={systemStatus.cpuUsage}
                                    color={systemStatus.cpuUsage > 80 ? 'error' : systemStatus.cpuUsage > 60 ? 'warning' : 'success'}
                                />
                            </Grid>
                            <Grid item xs={12} sm={3}>
                                <Typography variant="body2" color="text.secondary">메모리 사용률</Typography>
                                <Typography variant="h6">{systemStatus.memoryUsage}%</Typography>
                                <LinearProgress
                                    variant="determinate"
                                    value={systemStatus.memoryUsage}
                                    color={systemStatus.memoryUsage > 80 ? 'error' : systemStatus.memoryUsage > 60 ? 'warning' : 'success'}
                                />
                            </Grid>
                            <Grid item xs={12} sm={3}>
                                <Typography variant="body2" color="text.secondary">에러율</Typography>
                                <Typography variant="h6">{systemStatus.errorRate}%</Typography>
                                <LinearProgress
                                    variant="determinate"
                                    value={systemStatus.errorRate}
                                    color={systemStatus.errorRate > 5 ? 'error' : systemStatus.errorRate > 2 ? 'warning' : 'success'}
                                />
                            </Grid>
                            <Grid item xs={12} sm={3}>
                                <Typography variant="body2" color="text.secondary">활성 알림</Typography>
                                <Typography variant="h6">{systemStatus.activeAlerts}</Typography>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>
            )}

            {/* 탭 메뉴 */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={activeTab} onChange={handleTabChange}>
                    <Tab label="개요" icon={<DashboardIcon />} />
                    <Tab label="시스템" icon={<MemoryIcon />} />
                    <Tab label="애플리케이션" icon={<SpeedIcon />} />
                    <Tab label="알림" icon={<WarningIcon />} />
                    <Tab label="로그" icon={<TimelineIcon />} />
                </Tabs>
            </Box>

            {/* 개요 탭 */}
            {activeTab === 0 && dashboardData && (
                <Grid container spacing={3}>
                    {/* 시스템 메트릭 */}
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                                    <MemoryIcon sx={{ mr: 1 }} /> 시스템 메트릭
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={6}>
                                        <Typography variant="body2" color="text.secondary">CPU 사용률</Typography>
                                        <Typography variant="h6">{dashboardData.system.cpuUsage}%</Typography>
                                        <LinearProgress
                                            variant="determinate"
                                            value={dashboardData.system.cpuUsage}
                                            color={dashboardData.system.cpuUsage > 80 ? 'error' : 'primary'}
                                        />
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="body2" color="text.secondary">메모리 사용률</Typography>
                                        <Typography variant="h6">{dashboardData.system.memoryUsage}%</Typography>
                                        <LinearProgress
                                            variant="determinate"
                                            value={dashboardData.system.memoryUsage}
                                            color={dashboardData.system.memoryUsage > 80 ? 'error' : 'primary'}
                                        />
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* 애플리케이션 메트릭 */}
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                                    <SpeedIcon sx={{ mr: 1 }} /> 애플리케이션 메트릭
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={6}>
                                        <Typography variant="body2" color="text.secondary">HTTP 요청</Typography>
                                        <Typography variant="h6">{dashboardData.application.httpRequests.toLocaleString()}</Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="body2" color="text.secondary">활성 연결</Typography>
                                        <Typography variant="h6">{dashboardData.application.activeConnections}</Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="body2" color="text.secondary">에러율</Typography>
                                        <Typography variant="h6">{dashboardData.application.errorRate}%</Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="body2" color="text.secondary">사용자 세션</Typography>
                                        <Typography variant="h6">{dashboardData.business.userSessions}</Typography>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* 데이터베이스 메트릭 */}
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                                    <StorageIcon sx={{ mr: 1 }} /> 데이터베이스 메트릭
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={6}>
                                        <Typography variant="body2" color="text.secondary">연결 수</Typography>
                                        <Typography variant="h6">{dashboardData.database.connections}</Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="body2" color="text.secondary">쿼리 시간</Typography>
                                        <Typography variant="h6">{dashboardData.database.queryDuration}ms</Typography>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* 비즈니스 메트릭 */}
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                                    <NetworkIcon sx={{ mr: 1 }} /> 비즈니스 메트릭
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={6}>
                                        <Typography variant="body2" color="text.secondary">콘텐츠 생성</Typography>
                                        <Typography variant="h6">{dashboardData.business.contentCreated.toLocaleString()}</Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="body2" color="text.secondary">사용자 세션</Typography>
                                        <Typography variant="h6">{dashboardData.business.userSessions}</Typography>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            {/* 알림 탭 */}
            {activeTab === 3 && dashboardData && (
                <Box>
                    <Typography variant="h6" gutterBottom>
                        활성 알림 ({dashboardData.alerts.length}개)
                    </Typography>

                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>심각도</TableCell>
                                    <TableCell>타입</TableCell>
                                    <TableCell>메시지</TableCell>
                                    <TableCell>값</TableCell>
                                    <TableCell>임계값</TableCell>
                                    <TableCell>시간</TableCell>
                                    <TableCell>액션</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {dashboardData.alerts.map((alert) => (
                                    <TableRow key={alert.id}>
                                        <TableCell>
                                            <Chip
                                                icon={getSeverityIcon(alert.severity)}
                                                label={alert.severity}
                                                color={getSeverityColor(alert.severity)}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>{alert.type}</TableCell>
                                        <TableCell>{alert.message}</TableCell>
                                        <TableCell>{alert.value}</TableCell>
                                        <TableCell>{alert.threshold}</TableCell>
                                        <TableCell>
                                            {new Date(alert.timestamp).toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                            {alert.status === 'active' && (
                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    onClick={() => handleResolveAlert(alert.id)}
                                                >
                                                    해결
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            )}

            {/* 로그 탭 */}
            {activeTab === 4 && (
                <Box>
                    <Typography variant="h6" gutterBottom>
                        시스템 로그
                    </Typography>

                    <Card>
                        <CardContent>
                            <Typography variant="body2" color="text.secondary">
                                로그 기능은 실제 구현에서 Elasticsearch와 연동됩니다.
                            </Typography>
                            <List>
                                <ListItem>
                                    <ListItemIcon><InfoIcon /></ListItemIcon>
                                    <ListItemText
                                        primary="INFO: User login successful"
                                        secondary="2024-01-15 10:30:45 - user123"
                                    />
                                </ListItem>
                                <ListItem>
                                    <ListItemIcon><WarningIcon /></ListItemIcon>
                                    <ListItemText
                                        primary="WARN: High memory usage detected"
                                        secondary="2024-01-15 10:25:30 - 85% memory usage"
                                    />
                                </ListItem>
                                <ListItem>
                                    <ListItemIcon><ErrorIcon /></ListItemIcon>
                                    <ListItemText
                                        primary="ERROR: Database connection failed"
                                        secondary="2024-01-15 10:20:15 - Connection timeout"
                                    />
                                </ListItem>
                            </List>
                        </CardContent>
                    </Card>
                </Box>
            )}
        </Box>
    );
};

export default MonitoringDashboard;
