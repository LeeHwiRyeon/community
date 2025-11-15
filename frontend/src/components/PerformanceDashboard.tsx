/**
 * 📊 성능 대시보드 컴포넌트
 * 
 * 실시간 성능 메트릭, Web Vitals, 최적화 상태를
 * 시각적으로 표시하는 대시보드
 * 
 * @author AUTOAGENTS Manager
 * @version 3.0.0
 * @created 2025-10-02
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    LinearProgress,
    Chip,
        IconButton,
    Tooltip,
    Alert,
    CircularProgress,
    Paper,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Divider,
    Switch,
    FormControlLabel,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';
import {
    Speed as SpeedIcon,
    Memory as MemoryIcon,
    NetworkCheck as NetworkIcon,
    Image as ImageIcon,
    Storage as StorageIcon,
    Refresh as RefreshIcon,
    Settings as SettingsIcon,
    TrendingUp as TrendingUpIcon,
    TrendingDown as TrendingDownIcon,
    CheckCircle as CheckCircleIcon,
    Warning as WarningIcon,
    Error as ErrorIcon,
    Info as InfoIcon,
    Dashboard as DashboardIcon,
    Timeline as TimelineIcon,
    BarChart as BarChartIcon,
    PieChart as PieChartIcon,
    ShowChart as ShowChartIcon,
    Assessment as AssessmentIcon,
    BugReport as BugReportIcon,
    Build as BuildIcon,
    FlashOn as FlashOnIcon,
    Timer as TimerIcon,
    Storage as CacheIcon,
    CloudDownload as DownloadIcon,
    CloudUpload as UploadIcon,
    WifiTethering as WifiIcon,
    SignalCellular4Bar as SignalIcon,
    BatteryFull as BatteryIcon,
    BrightnessHigh as BrightnessIcon,
    VolumeUp as VolumeIcon,
    TouchApp as TouchIcon,
    Keyboard as KeyboardIcon,
    Mouse as MouseIcon,
    Gesture as GestureIcon,
    Accessibility as AccessibilityIcon,
    Language as LanguageIcon,
    Translate as TranslateIcon,
    Public as PublicIcon,
    Security as SecurityIcon,
    Lock as LockIcon,
    VerifiedUser as VerifiedUserIcon,
    Shield as ShieldIcon,
    Gavel as GavelIcon,
    Policy as PolicyIcon,
    AccountBalance as AccountBalanceIcon,
    Work as WorkIcon,
    School as SchoolIcon,
    Home as HomeIcon,
    Forum as ForumIcon,
    Event as EventIcon,
    Announcement as AnnouncementIcon,
    Dashboard as DashboardAltIcon,
    BarChart as BarChartAltIcon,
    PieChart as PieChartAltIcon,
    ScatterPlot as ScatterPlotIcon,
    NetworkCell as NetworkCellIcon,
    ThreeDRotation as ThreeDIcon,
    ViewInAr as ArVrIcon,
    Mic as MicIcon,
    Translate as TranslateAltIcon,
    Adb as AiIcon,
    AccountBalanceWallet as WalletIcon,
    MonetizationOn as MonetizationIcon,
    ShoppingCart as ShoppingCartIcon,
    LiveTv as LiveTvIcon,
    Videocam as VideocamIcon,
    Chat as ChatIcon,
    People as PeopleIcon,
    Subscriptions as SubscriptionsIcon,
    AttachMoney as AttachMoneyIcon,
    Schedule as ScheduleIcon,
    Extension as ExtensionIcon,
    Palette as PaletteIcon,
    Accessibility as AccessibilityAltIcon,
    Brightness4 as DarkModeIcon,
    Brightness7 as LightModeIcon,
    Gesture as GestureAltIcon,
    Keyboard as KeyboardAltIcon,
    Notifications as NotificationsIcon,
    Feedback as FeedbackIcon,
    Edit as EditorIcon,
    GroupAdd as CollaborateIcon,
    History as HistoryIcon,
    Save as SaveIcon,
    CloudUpload as CloudUploadIcon,
    CloudDownload as CloudDownloadIcon,
    AutoFixHigh as AutoFixIcon,
    BugReport as BugFixIcon,
    Code as CodeGenerationIcon,
    Architecture as ArchitectureIcon,
    Dns as DbSchemaIcon,
    Description as DocGenerationIcon,
    FactCheck as QualityCheckIcon,
    Science as TestGenerationIcon,
    IntegrationInstructions as IntegrationTestIcon,
    Troubleshoot as E2ETestIcon,
    Speed as PerformanceTestIcon,
    Security as SecurityTestIcon,
    Analytics as AnalyticsIcon,
    Build as BuildAltIcon,
    CheckCircleOutline as CheckCircleOutlineIcon,
    CloudUpload as DeploymentIcon,
    Monitor as MonitorIcon,
    BugReport as BugDetectionIcon,
    AutoFixHigh as AutoFixHighIcon,
    Code as CodeQualityIcon
} from '@mui/icons-material';
import { styled, keyframes } from '@mui/material/styles';
import { performanceMonitor, imageOptimizer, cacheManager, bundleAnalyzer } from '../utils/performance-monitor';

// ============================================================================
// 애니메이션 정의
// ============================================================================

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const glow = keyframes`
  0% { box-shadow: 0 0 5px rgba(33, 150, 243, 0.5); }
  50% { box-shadow: 0 0 20px rgba(33, 150, 243, 0.8); }
  100% { box-shadow: 0 0 5px rgba(33, 150, 243, 0.5); }
`;

const slideIn = keyframes`
  from { transform: translateX(-100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
`;

// ============================================================================
// 스타일드 컴포넌트
// ============================================================================

const DashboardContainer = styled(Box)(({ theme }) => ({
    padding: theme.spacing(3),
    background: `linear-gradient(135deg, ${theme.palette.primary.light}10, ${theme.palette.secondary.light}10)`,
    minHeight: '100vh',
    animation: `${slideIn} 0.5s ease-out`
}));

const MetricCard = styled(Card)<{ status: 'good' | 'needs-improvement' | 'poor' }>(({ theme, status }) => ({
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
    transition: 'all 0.3s ease',
    border: `2px solid ${status === 'good' ? theme.palette.success.main :
        status === 'needs-improvement' ? theme.palette.warning.main :
            theme.palette.error.main}`,

    '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: theme.shadows[8],
        animation: status === 'good' ? `${glow} 2s infinite` : 'none'
    }
}));

const StatusChip = styled(Chip)<{ status: 'good' | 'needs-improvement' | 'poor' }>(({ theme, status }) => ({
    fontWeight: 'bold',
    animation: status === 'good' ? `${pulse} 2s infinite` : 'none'
}));

const ProgressBar = styled(LinearProgress)(({ theme }) => ({
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.palette.grey[200],
    '& .MuiLinearProgress-bar': {
        borderRadius: 4
    }
}));

// ============================================================================
// 메인 컴포넌트
// ============================================================================

interface PerformanceDashboardProps {
    onClose?: () => void;
}

const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({ onClose }) => {
    const [metrics, setMetrics] = useState<any>({});
    const [isMonitoring, setIsMonitoring] = useState(true);
    const [showDetails, setShowDetails] = useState(false);
    const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

    // 메트릭 업데이트
    const updateMetrics = useCallback(() => {
        const dashboardData = performanceMonitor.getDashboardData();
        setMetrics(dashboardData);
    }, []);

    // 모니터링 토글
    const toggleMonitoring = useCallback(() => {
        if (isMonitoring) {
            performanceMonitor.stopMonitoring();
            if (refreshInterval) {
                clearInterval(refreshInterval);
                setRefreshInterval(null);
            }
        } else {
            performanceMonitor.startMonitoring();
            const interval = setInterval(updateMetrics, 1000);
            setRefreshInterval(interval);
        }
        setIsMonitoring(!isMonitoring);
    }, [isMonitoring, refreshInterval, updateMetrics]);

    // 컴포넌트 마운트 시 초기화
    useEffect(() => {
        updateMetrics();
        const interval = setInterval(updateMetrics, 1000);
        setRefreshInterval(interval);

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [updateMetrics]);

    // 성능 상태 결정
    const getPerformanceStatus = (value: number, thresholds: { good: number; poor: number }) => {
        if (value <= thresholds.good) return 'good';
        if (value <= thresholds.poor) return 'needs-improvement';
        return 'poor';
    };

    // 상태별 색상
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'good': return 'success';
            case 'needs-improvement': return 'warning';
            case 'poor': return 'error';
            default: return 'default';
        }
    };

    // 상태별 아이콘
    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'good': return <CheckCircleIcon />;
            case 'needs-improvement': return <WarningIcon />;
            case 'poor': return <ErrorIcon />;
            default: return <InfoIcon />;
        }
    };

    return (
        <DashboardContainer>
            {/* 헤더 */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <DashboardIcon sx={{ fontSize: 32, color: 'primary.main' }} />
                    <Typography variant="h4" component="h1" fontWeight="bold">
                        성능 대시보드
                    </Typography>
                    <Chip
                        label={`점수: ${metrics.score || 0}/100`}
                        color={metrics.score >= 90 ? 'success' : metrics.score >= 70 ? 'warning' : 'error'}
                        icon={<AssessmentIcon />}
                    />
                </Box>

                <Box sx={{ display: 'flex', gap: 1 }}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={isMonitoring}
                                onChange={toggleMonitoring}
                                color="primary"
                            />
                        }
                        label="실시간 모니터링"
                    />
                    <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={updateMetrics}
                    >
                        새로고침
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<SettingsIcon />}
                        onClick={() => setShowDetails(true)}
                    >
                        상세 설정
                    </Button>
                    {onClose && (
                        <Button variant="outlined" onClick={onClose}>
                            닫기
                        </Button>
                    )}
                </Box>
            </Box>

            {/* Core Web Vitals */}
            <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4, mb: 2 }}>
                🎯 Core Web Vitals
            </Typography>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
                {/* LCP */}
                <Box sx={{ flex: '1 1 300px', minWidth: 300 }}>
                    <MetricCard status={getPerformanceStatus(metrics.metrics?.lcp || 0, { good: 2500, poor: 4000 })}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <SpeedIcon color="primary" />
                                    <Typography variant="h6" fontWeight="bold">LCP</Typography>
                                </Box>
                                <StatusChip
                                    status={getPerformanceStatus(metrics.metrics?.lcp || 0, { good: 2500, poor: 4000 })}
                                    label={metrics.metrics?.lcp ? `${metrics.metrics.lcp.toFixed(0)}ms` : '측정 중...'}
                                    color={getStatusColor(getPerformanceStatus(metrics.metrics?.lcp || 0, { good: 2500, poor: 4000 })) as any}
                                    icon={getStatusIcon(getPerformanceStatus(metrics.metrics?.lcp || 0, { good: 2500, poor: 4000 }))}
                                />
                            </Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Largest Contentful Paint
                            </Typography>
                            <ProgressBar
                                variant="determinate"
                                value={Math.min((metrics.metrics?.lcp || 0) / 4000 * 100, 100)}
                                color={getStatusColor(getPerformanceStatus(metrics.metrics?.lcp || 0, { good: 2500, poor: 4000 })) as any}
                            />
                        </CardContent>
                    </MetricCard>
                </Box>

                {/* FID */}
                <Box sx={{ flex: '1 1 300px', minWidth: 300 }}>
                    <MetricCard status={getPerformanceStatus(metrics.metrics?.fid || 0, { good: 100, poor: 300 })}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <TouchIcon color="primary" />
                                    <Typography variant="h6" fontWeight="bold">FID</Typography>
                                </Box>
                                <StatusChip
                                    status={getPerformanceStatus(metrics.metrics?.fid || 0, { good: 100, poor: 300 })}
                                    label={metrics.metrics?.fid ? `${metrics.metrics.fid.toFixed(0)}ms` : '측정 중...'}
                                    color={getStatusColor(getPerformanceStatus(metrics.metrics?.fid || 0, { good: 100, poor: 300 })) as any}
                                    icon={getStatusIcon(getPerformanceStatus(metrics.metrics?.fid || 0, { good: 100, poor: 300 }))}
                                />
                            </Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                First Input Delay
                            </Typography>
                            <ProgressBar
                                variant="determinate"
                                value={Math.min((metrics.metrics?.fid || 0) / 300 * 100, 100)}
                                color={getStatusColor(getPerformanceStatus(metrics.metrics?.fid || 0, { good: 100, poor: 300 })) as any}
                            />
                        </CardContent>
                    </MetricCard>
                </Box>

                {/* CLS */}
                <Box sx={{ flex: '1 1 300px', minWidth: 300 }}>
                    <MetricCard status={getPerformanceStatus(metrics.metrics?.cls || 0, { good: 0.1, poor: 0.25 })}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <TrendingUpIcon color="primary" />
                                    <Typography variant="h6" fontWeight="bold">CLS</Typography>
                                </Box>
                                <StatusChip
                                    status={getPerformanceStatus(metrics.metrics?.cls || 0, { good: 0.1, poor: 0.25 })}
                                    label={metrics.metrics?.cls ? metrics.metrics.cls.toFixed(3) : '측정 중...'}
                                    color={getStatusColor(getPerformanceStatus(metrics.metrics?.cls || 0, { good: 0.1, poor: 0.25 })) as any}
                                    icon={getStatusIcon(getPerformanceStatus(metrics.metrics?.cls || 0, { good: 0.1, poor: 0.25 }))}
                                />
                            </Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Cumulative Layout Shift
                            </Typography>
                            <ProgressBar
                                variant="determinate"
                                value={Math.min((metrics.metrics?.cls || 0) / 0.25 * 100, 100)}
                                color={getStatusColor(getPerformanceStatus(metrics.metrics?.cls || 0, { good: 0.1, poor: 0.25 })) as any}
                            />
                        </CardContent>
                    </MetricCard>
                </Box>
            </Box>

            {/* 추가 메트릭 */}
            <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4, mb: 2 }}>
                📈 추가 메트릭
            </Typography>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
                {/* FCP */}
                <Box sx={{ flex: '1 1 250px', minWidth: 250 }}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <FlashOnIcon color="primary" />
                                <Typography variant="h6">FCP</Typography>
                            </Box>
                            <Typography variant="h4" fontWeight="bold" color="primary">
                                {metrics.metrics?.fcp ? `${metrics.metrics.fcp.toFixed(0)}ms` : '--'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                First Contentful Paint
                            </Typography>
                        </CardContent>
                    </Card>
                </Box>

                {/* Load Time */}
                <Box sx={{ flex: '1 1 250px', minWidth: 250 }}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <TimerIcon color="primary" />
                                <Typography variant="h6">Load Time</Typography>
                            </Box>
                            <Typography variant="h4" fontWeight="bold" color="primary">
                                {metrics.metrics?.loadTime ? `${metrics.metrics.loadTime.toFixed(0)}ms` : '--'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Page Load Time
                            </Typography>
                        </CardContent>
                    </Card>
                </Box>

                {/* Render Time */}
                <Box sx={{ flex: '1 1 250px', minWidth: 250 }}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <BuildIcon color="primary" />
                                <Typography variant="h6">Render</Typography>
                            </Box>
                            <Typography variant="h4" fontWeight="bold" color="primary">
                                {metrics.metrics?.renderTime ? `${metrics.metrics.renderTime.toFixed(0)}ms` : '--'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Render Time
                            </Typography>
                        </CardContent>
                    </Card>
                </Box>

                {/* Memory Usage */}
                <Box sx={{ flex: '1 1 250px', minWidth: 250 }}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <MemoryIcon color="primary" />
                                <Typography variant="h6">Memory</Typography>
                            </Box>
                            <Typography variant="h4" fontWeight="bold" color="primary">
                                {metrics.metrics?.memoryUsage ? `${metrics.metrics.memoryUsage.toFixed(1)}MB` : '--'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Memory Usage
                            </Typography>
                        </CardContent>
                    </Card>
                </Box>
            </Box>

            {/* 최적화 상태 */}
            <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4, mb: 2 }}>
                ⚡ 최적화 상태
            </Typography>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                {/* 이미지 최적화 */}
                <Box sx={{ flex: '1 1 300px', minWidth: 300 }}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                <ImageIcon color="primary" />
                                <Typography variant="h6">이미지 최적화</Typography>
                            </Box>
                            <List dense>
                                <ListItem>
                                    <ListItemIcon><CheckCircleIcon color="success" /></ListItemIcon>
                                    <ListItemText primary="WebP 지원" />
                                </ListItem>
                                <ListItem>
                                    <ListItemIcon><CheckCircleIcon color="success" /></ListItemIcon>
                                    <ListItemText primary="지연 로딩" />
                                </ListItem>
                                <ListItem>
                                    <ListItemIcon><CheckCircleIcon color="success" /></ListItemIcon>
                                    <ListItemText primary="캐싱 전략" />
                                </ListItem>
                            </List>
                        </CardContent>
                    </Card>
                </Box>

                {/* 번들 최적화 */}
                <Box sx={{ flex: '1 1 300px', minWidth: 300 }}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                <StorageIcon color="primary" />
                                <Typography variant="h6">번들 최적화</Typography>
                            </Box>
                            <List dense>
                                <ListItem>
                                    <ListItemIcon><CheckCircleIcon color="success" /></ListItemIcon>
                                    <ListItemText primary="코드 분할" />
                                </ListItem>
                                <ListItem>
                                    <ListItemIcon><CheckCircleIcon color="success" /></ListItemIcon>
                                    <ListItemText primary="트리 셰이킹" />
                                </ListItem>
                                <ListItem>
                                    <ListItemIcon><CheckCircleIcon color="success" /></ListItemIcon>
                                    <ListItemText primary="압축 최적화" />
                                </ListItem>
                            </List>
                        </CardContent>
                    </Card>
                </Box>

                {/* 캐싱 전략 */}
                <Box sx={{ flex: '1 1 300px', minWidth: 300 }}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                <CacheIcon color="primary" />
                                <Typography variant="h6">캐싱 전략</Typography>
                            </Box>
                            <List dense>
                                <ListItem>
                                    <ListItemIcon><CheckCircleIcon color="success" /></ListItemIcon>
                                    <ListItemText primary="Service Worker" />
                                </ListItem>
                                <ListItem>
                                    <ListItemIcon><CheckCircleIcon color="success" /></ListItemIcon>
                                    <ListItemText primary="메모리 캐싱" />
                                </ListItem>
                                <ListItem>
                                    <ListItemIcon><CheckCircleIcon color="success" /></ListItemIcon>
                                    <ListItemText primary="API 캐싱" />
                                </ListItem>
                            </List>
                        </CardContent>
                    </Card>
                </Box>
            </Box>

            {/* 상세 설정 다이얼로그 */}
            <Dialog open={showDetails} onClose={() => setShowDetails(false)} maxWidth="md" fullWidth>
                <DialogTitle>성능 모니터링 상세 설정</DialogTitle>
                <DialogContent>
                    <Typography variant="body1" paragraph>
                        성능 모니터링 설정을 조정할 수 있습니다.
                    </Typography>
                    {/* 상세 설정 내용 */}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowDetails(false)}>닫기</Button>
                </DialogActions>
            </Dialog>
        </DashboardContainer>
    );
};

export default PerformanceDashboard;
