/**
 * 최종 배포 시스템 (v1.3)
 * 프로덕션 환경 배포 및 모니터링 시스템
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Grid,
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
    AccordionDetails,
    Badge,
    Avatar,
    Stack,
    Rating,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Checkbox,
    RadioGroup,
    Radio,
    FormControlLabel as MuiFormControlLabel
} from '@mui/material';
import {
    Timeline,
    TimelineItem,
    TimelineSeparator,
    TimelineConnector,
    TimelineContent,
    TimelineDot,
    TimelineOppositeContent
} from '@mui/lab';
import {
    Deploy,
    Launch,
    Rocket,
    CheckCircle,
    Error,
    Warning,
    Info,
    Refresh,
    Settings,
    BarChart,
    PieChart,
    ExpandMore,
    Person,
    Group,
    Speed,
    Memory,
    NetworkCheck,
    Security,
    Feedback,
    Star,
    ThumbUp,
    ThumbDown,
    BugReport,
    Lightbulb,
    Analytics,
    TrendingUp,
    TrendingDown,
    Send,
    Close,
    Download,
    Upload,
    Visibility,
    VisibilityOff,
    Assessment,
    AutoAwesome,
    Psychology,
    Science,
    Biotech,
    Engineering,
    Construction,
    Build,
    Handyman,
    Precision,
    Tune,
    Adjust,
    SettingsApplications,
    TuneIcon,
    FlashOn,
    Bolt,
    Zap,
    Thunderstorm,
    EnergySavingsLeaf,
    Eco,
    Recycling,
    Compress,
    Expand,
    Minimize,
    Maximize,
    Fullscreen,
    FullscreenExit,
    ZoomIn,
    ZoomOut,
    GetApp,
    Publish,
    PlayArrow,
    Pause,
    Stop,
    SkipNext,
    SkipPrevious,
    FastForward,
    FastRewind,
    Repeat,
    Shuffle,
    VolumeUp,
    VolumeDown,
    VolumeOff,
    Mic,
    MicOff,
    Videocam,
    VideocamOff,
    ScreenShare,
    StopScreenShare,
    Cast,
    CastConnected,
    CastForEducation,
    School,
    Work,
    Home,
    Business,
    Store,
    Storefront,
    ShoppingCart,
    ShoppingBag,
    LocalGroceryStore,
    Restaurant,
    Hotel,
    DirectionsCar,
    DirectionsBus,
    DirectionsSubway,
    DirectionsWalk,
    DirectionsBike,
    DirectionsRun,
    DirectionsTransit,
    DirectionsRailway,
    DirectionsBoat,
    Flight,
    Train,
    Directions,
    Map,
    LocationOn,
    MyLocation,
    Place,
    NearMe,
    Explore,
    TravelExplore,
    Hiking,
    Pool,
    BeachAccess,
    AcUnit,
    WbSunny,
    CloudQueue,
    CloudDone,
    CloudOff,
    CloudDownload,
    CloudUpload,
    CloudSync,
    CloudCircle,
    CloudDoneOutlined,
    CloudOffOutlined,
    CloudDownloadOutlined,
    CloudUploadOutlined,
    CloudSyncOutlined,
    CloudCircleOutlined,
    Schedule,
    Task,
    Assignment,
    AssignmentTurnedIn,
    AssignmentLate,
    AssignmentInd,
    AssignmentReturn,
    AssignmentReturned,
    AssignmentIndOutlined,
    AssignmentLateOutlined,
    AssignmentReturnOutlined,
    AssignmentReturnedOutlined,
    AssignmentTurnedInOutlined,
    AssignmentOutlined,
    TaskAlt,
    TaskAltOutlined,
    TaskOutlined,
    TaskAltRounded,
    TaskRounded,
    TaskAltSharp,
    TaskSharp,
    TaskAltTwoTone,
    TaskTwoTone,
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
    Shield,
    EmojiEmotions,
    SentimentSatisfied,
    SentimentDissatisfied,
    SentimentVeryDissatisfied,
    SentimentNeutral,
    SentimentVerySatisfied,
    FilterList,
    Sort,
    Search,
    Add,
    Edit,
    Delete,
    Share,
    Bookmark,
    Flag,
    Report,
    Support,
    Help,
    QuestionAnswer,
    Chat,
    Forum,
    Reviews,
    RateReview,
    Comment,
    Reply,
    Favorite,
    FavoriteBorder
} from '@mui/icons-material';

// 타입 정의
interface DeploymentStage {
    id: string;
    name: string;
    description: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
    startTime?: Date;
    endTime?: Date;
    duration?: number;
    logs: string[];
    errors?: string[];
    warnings?: string[];
    progress: number;
    dependencies: string[];
    rollbackAvailable: boolean;
}

interface DeploymentConfig {
    id: string;
    name: string;
    version: string;
    environment: 'development' | 'staging' | 'production';
    targetServers: string[];
    rollbackVersion?: string;
    healthChecks: HealthCheck[];
    monitoring: MonitoringConfig;
    notifications: NotificationConfig;
    createdAt: Date;
    createdBy: string;
}

interface HealthCheck {
    id: string;
    name: string;
    url: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    expectedStatus: number;
    timeout: number;
    retries: number;
    interval: number;
    status: 'passing' | 'failing' | 'unknown';
    lastCheck?: Date;
    responseTime?: number;
}

interface MonitoringConfig {
    enabled: boolean;
    metrics: string[];
    alerts: AlertConfig[];
    dashboards: string[];
}

interface AlertConfig {
    id: string;
    name: string;
    condition: string;
    threshold: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
    enabled: boolean;
    channels: string[];
}

interface NotificationConfig {
    enabled: boolean;
    channels: ('email' | 'slack' | 'webhook' | 'sms')[];
    recipients: string[];
    events: string[];
}

interface DeploymentMetrics {
    totalDeployments: number;
    successfulDeployments: number;
    failedDeployments: number;
    averageDeploymentTime: number;
    rollbackRate: number;
    uptime: number;
    errorRate: number;
    responseTime: number;
    userSatisfaction: number;
}

// 메인 컴포넌트
const FinalDeploymentSystem: React.FC = () => {
    // 상태 관리
    const [loading, setLoading] = useState(false);
    const [deploymentStages, setDeploymentStages] = useState<DeploymentStage[]>([]);
    const [deploymentConfig, setDeploymentConfig] = useState<DeploymentConfig | null>(null);
    const [metrics, setMetrics] = useState<DeploymentMetrics | null>(null);
    const [selectedTab, setSelectedTab] = useState(0);
    const [deploymentRunning, setDeploymentRunning] = useState(false);
    const [showDeploymentDialog, setShowDeploymentDialog] = useState(false);
    const [showConfigDialog, setShowConfigDialog] = useState(false);
    const [autoDeploy, setAutoDeploy] = useState(false);
    const [currentStage, setCurrentStage] = useState<string | null>(null);

    // 데이터 로드
    const loadDeploymentData = useCallback(async () => {
        setLoading(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));

            // 모의 배포 단계
            const mockStages: DeploymentStage[] = [
                {
                    id: '1',
                    name: '코드 빌드',
                    description: '소스 코드를 컴파일하고 빌드합니다.',
                    status: 'completed',
                    startTime: new Date(Date.now() - 1000 * 60 * 10),
                    endTime: new Date(Date.now() - 1000 * 60 * 8),
                    duration: 120,
                    logs: [
                        '소스 코드 체크아웃 완료',
                        '의존성 설치 완료',
                        'TypeScript 컴파일 완료',
                        '번들 빌드 완료',
                        '테스트 실행 완료'
                    ],
                    progress: 100,
                    dependencies: [],
                    rollbackAvailable: false
                },
                {
                    id: '2',
                    name: '테스트 실행',
                    description: '단위 테스트, 통합 테스트, E2E 테스트를 실행합니다.',
                    status: 'completed',
                    startTime: new Date(Date.now() - 1000 * 60 * 8),
                    endTime: new Date(Date.now() - 1000 * 60 * 6),
                    duration: 120,
                    logs: [
                        '단위 테스트 실행 중...',
                        '통합 테스트 실행 중...',
                        'E2E 테스트 실행 중...',
                        '모든 테스트 통과',
                        '코드 커버리지: 85%'
                    ],
                    progress: 100,
                    dependencies: ['1'],
                    rollbackAvailable: false
                },
                {
                    id: '3',
                    name: '보안 스캔',
                    description: '보안 취약점을 스캔하고 검사합니다.',
                    status: 'completed',
                    startTime: new Date(Date.now() - 1000 * 60 * 6),
                    endTime: new Date(Date.now() - 1000 * 60 * 4),
                    duration: 120,
                    logs: [
                        '의존성 취약점 스캔 완료',
                        '코드 보안 검사 완료',
                        'OWASP 검사 완료',
                        '보안 등급: A+',
                        '취약점: 0개'
                    ],
                    progress: 100,
                    dependencies: ['2'],
                    rollbackAvailable: false
                },
                {
                    id: '4',
                    name: '스테이징 배포',
                    description: '스테이징 환경에 배포합니다.',
                    status: 'running',
                    startTime: new Date(Date.now() - 1000 * 60 * 4),
                    progress: 60,
                    logs: [
                        '스테이징 서버 준비 완료',
                        '애플리케이션 배포 중...',
                        '데이터베이스 마이그레이션 완료',
                        '서비스 시작 중...'
                    ],
                    dependencies: ['3'],
                    rollbackAvailable: true
                },
                {
                    id: '5',
                    name: '헬스 체크',
                    description: '배포된 애플리케이션의 상태를 확인합니다.',
                    status: 'pending',
                    progress: 0,
                    logs: [],
                    dependencies: ['4'],
                    rollbackAvailable: true
                },
                {
                    id: '6',
                    name: '프로덕션 배포',
                    description: '프로덕션 환경에 배포합니다.',
                    status: 'pending',
                    progress: 0,
                    logs: [],
                    dependencies: ['5'],
                    rollbackAvailable: true
                },
                {
                    id: '7',
                    name: '모니터링 설정',
                    description: '배포 후 모니터링을 설정합니다.',
                    status: 'pending',
                    progress: 0,
                    logs: [],
                    dependencies: ['6'],
                    rollbackAvailable: false
                }
            ];

            setDeploymentStages(mockStages);

            // 모의 배포 설정
            const mockConfig: DeploymentConfig = {
                id: 'config1',
                name: 'Community Platform v1.3',
                version: '1.3.0',
                environment: 'production',
                targetServers: ['web-server-1', 'web-server-2', 'web-server-3'],
                rollbackVersion: '1.2.5',
                healthChecks: [
                    {
                        id: 'hc1',
                        name: 'API Health Check',
                        url: '/api/health',
                        method: 'GET',
                        expectedStatus: 200,
                        timeout: 5000,
                        retries: 3,
                        interval: 30,
                        status: 'passing',
                        lastCheck: new Date(),
                        responseTime: 150
                    },
                    {
                        id: 'hc2',
                        name: 'Database Health Check',
                        url: '/api/db/health',
                        method: 'GET',
                        expectedStatus: 200,
                        timeout: 5000,
                        retries: 3,
                        interval: 30,
                        status: 'passing',
                        lastCheck: new Date(),
                        responseTime: 200
                    }
                ],
                monitoring: {
                    enabled: true,
                    metrics: ['cpu', 'memory', 'disk', 'network', 'response_time', 'error_rate'],
                    alerts: [
                        {
                            id: 'alert1',
                            name: 'High CPU Usage',
                            condition: 'cpu_usage > 80',
                            threshold: 80,
                            severity: 'high',
                            enabled: true,
                            channels: ['email', 'slack']
                        }
                    ],
                    dashboards: ['main', 'performance', 'errors']
                },
                notifications: {
                    enabled: true,
                    channels: ['email', 'slack'],
                    recipients: ['dev-team@company.com', '#deployments'],
                    events: ['deployment_started', 'deployment_completed', 'deployment_failed']
                },
                createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
                createdBy: '김개발'
            };

            setDeploymentConfig(mockConfig);

            // 모의 메트릭
            const mockMetrics: DeploymentMetrics = {
                totalDeployments: 156,
                successfulDeployments: 148,
                failedDeployments: 8,
                averageDeploymentTime: 12.5,
                rollbackRate: 5.1,
                uptime: 99.8,
                errorRate: 0.1,
                responseTime: 245,
                userSatisfaction: 4.3
            };

            setMetrics(mockMetrics);

        } catch (error) {
            console.error('Failed to load deployment data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    // 배포 시작
    const startDeployment = async () => {
        setDeploymentRunning(true);
        setLoading(true);
        try {
            // 실제 구현에서는 배포 로직 실행
            await new Promise(resolve => setTimeout(resolve, 2000));
            console.log('Deployment started');
        } catch (error) {
            console.error('Failed to start deployment:', error);
        } finally {
            setLoading(false);
        }
    };

    // 배포 중지
    const stopDeployment = async () => {
        setDeploymentRunning(false);
        setLoading(true);
        try {
            // 실제 구현에서는 배포 중지 로직
            await new Promise(resolve => setTimeout(resolve, 1000));
            console.log('Deployment stopped');
        } catch (error) {
            console.error('Failed to stop deployment:', error);
        } finally {
            setLoading(false);
        }
    };

    // 롤백 실행
    const rollbackDeployment = async () => {
        setLoading(true);
        try {
            // 실제 구현에서는 롤백 로직
            await new Promise(resolve => setTimeout(resolve, 3000));
            console.log('Rollback completed');
        } catch (error) {
            console.error('Failed to rollback:', error);
        } finally {
            setLoading(false);
        }
    };

    // 상태별 색상
    const getStatusColor = (status: DeploymentStage['status']) => {
        switch (status) {
            case 'pending': return 'default';
            case 'running': return 'primary';
            case 'completed': return 'success';
            case 'failed': return 'error';
            case 'skipped': return 'secondary';
            default: return 'default';
        }
    };

    // 상태별 아이콘
    const getStatusIcon = (status: DeploymentStage['status']) => {
        switch (status) {
            case 'pending': return <Schedule color="info" />;
            case 'running': return <CircularProgress size={20} />;
            case 'completed': return <CheckCircle color="success" />;
            case 'failed': return <Error color="error" />;
            case 'skipped': return <SkipNext color="secondary" />;
            default: return <Schedule color="info" />;
        }
    };

    // 헬스 체크 상태별 색상
    const getHealthCheckColor = (status: HealthCheck['status']) => {
        switch (status) {
            case 'passing': return 'success';
            case 'failing': return 'error';
            case 'unknown': return 'warning';
            default: return 'default';
        }
    };

    // 초기 로드
    useEffect(() => {
        loadDeploymentData();
    }, [loadDeploymentData]);

    return (
        <Box sx={{ p: 3 }}>
            {/* 헤더 */}
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
                    🚀 최종 배포 시스템 (v1.3)
                </Typography>

                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={autoDeploy}
                                onChange={(e) => setAutoDeploy(e.target.checked)}
                            />
                        }
                        label="자동 배포"
                    />

                    {!deploymentRunning ? (
                        <Button
                            variant="contained"
                            startIcon={<Rocket />}
                            onClick={startDeployment}
                            disabled={loading}
                            color="success"
                        >
                            배포 시작
                        </Button>
                    ) : (
                        <Button
                            variant="contained"
                            startIcon={<Stop />}
                            onClick={stopDeployment}
                            disabled={loading}
                            color="error"
                        >
                            배포 중지
                        </Button>
                    )}

                    <Button
                        variant="outlined"
                        startIcon={<Settings />}
                        onClick={() => setShowConfigDialog(true)}
                    >
                        설정
                    </Button>

                    <Button
                        variant="outlined"
                        startIcon={<Refresh />}
                        onClick={loadDeploymentData}
                        disabled={loading}
                    >
                        새로고침
                    </Button>
                </Box>
            </Box>

            {/* 배포 상태 표시 */}
            {deploymentRunning && (
                <Alert severity="info" sx={{ mb: 3 }}>
                    <AlertTitle>배포 진행 중</AlertTitle>
                    현재 {deploymentStages.filter(s => s.status === 'running').length}개의 단계가 실행 중입니다.
                </Alert>
            )}

            {/* 메트릭 카드 */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box>
                                    <Typography color="textSecondary" gutterBottom>
                                        총 배포
                                    </Typography>
                                    <Typography variant="h4" component="div">
                                        {metrics?.totalDeployments || 0}
                                    </Typography>
                                </Box>
                                <Deploy sx={{ fontSize: 40, color: 'primary.main' }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box>
                                    <Typography color="textSecondary" gutterBottom>
                                        성공률
                                    </Typography>
                                    <Typography variant="h4" component="div">
                                        {metrics ? Math.round((metrics.successfulDeployments / metrics.totalDeployments) * 100) : 0}%
                                    </Typography>
                                </Box>
                                <CheckCircle sx={{ fontSize: 40, color: 'success.main' }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box>
                                    <Typography color="textSecondary" gutterBottom>
                                        평균 배포 시간
                                    </Typography>
                                    <Typography variant="h4" component="div">
                                        {metrics?.averageDeploymentTime || 0}분
                                    </Typography>
                                </Box>
                                <Speed sx={{ fontSize: 40, color: 'info.main' }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box>
                                    <Typography color="textSecondary" gutterBottom>
                                        가동률
                                    </Typography>
                                    <Typography variant="h4" component="div">
                                        {metrics?.uptime || 0}%
                                    </Typography>
                                </Box>
                                <NetworkCheck sx={{ fontSize: 40, color: 'warning.main' }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* 탭 네비게이션 */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={selectedTab} onChange={(e, newValue) => setSelectedTab(newValue)}>
                    <Tab label="배포 진행 상황" />
                    <Tab label="헬스 체크" />
                    <Tab label="모니터링" />
                    <Tab label="배포 이력" />
                </Tabs>
            </Box>

            {/* 배포 진행 상황 탭 */}
            {selectedTab === 0 && (
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            🔄 배포 진행 상황
                        </Typography>

                        <Timeline>
                            {deploymentStages.map((stage) => (
                                <TimelineItem key={stage.id}>
                                    <TimelineSeparator>
                                        <TimelineDot color={getStatusColor(stage.status)}>
                                            {getStatusIcon(stage.status)}
                                        </TimelineDot>
                                        <TimelineConnector />
                                    </TimelineSeparator>
                                    <TimelineContent>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                            <Typography variant="h6" component="span">
                                                {stage.name}
                                            </Typography>
                                            <Chip
                                                label={stage.status}
                                                size="small"
                                                color={getStatusColor(stage.status)}
                                            />
                                            {stage.duration && (
                                                <Chip
                                                    label={`${stage.duration}초`}
                                                    size="small"
                                                    variant="outlined"
                                                />
                                            )}
                                        </Box>

                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                            {stage.description}
                                        </Typography>

                                        {stage.status === 'running' && (
                                            <LinearProgress
                                                variant="determinate"
                                                value={stage.progress}
                                                sx={{ mb: 1 }}
                                            />
                                        )}

                                        {stage.logs.length > 0 && (
                                            <Accordion>
                                                <AccordionSummary expandIcon={<ExpandMore />}>
                                                    <Typography variant="subtitle2">
                                                        로그 보기 ({stage.logs.length}개)
                                                    </Typography>
                                                </AccordionSummary>
                                                <AccordionDetails>
                                                    <List dense>
                                                        {stage.logs.map((log, index) => (
                                                            <ListItem key={index}>
                                                                <ListItemText
                                                                    primary={log}
                                                                    primaryTypographyProps={{ variant: 'body2' }}
                                                                />
                                                            </ListItem>
                                                        ))}
                                                    </List>
                                                </AccordionDetails>
                                            </Accordion>
                                        )}

                                        {stage.rollbackAvailable && stage.status === 'failed' && (
                                            <Button
                                                size="small"
                                                color="error"
                                                startIcon={<Refresh />}
                                                onClick={rollbackDeployment}
                                                sx={{ mt: 1 }}
                                            >
                                                롤백
                                            </Button>
                                        )}
                                    </TimelineContent>
                                </TimelineItem>
                            ))}
                        </Timeline>
                    </CardContent>
                </Card>
            )}

            {/* 헬스 체크 탭 */}
            {selectedTab === 1 && (
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            🏥 헬스 체크 상태
                        </Typography>

                        <TableContainer component={Paper}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>이름</TableCell>
                                        <TableCell>URL</TableCell>
                                        <TableCell>상태</TableCell>
                                        <TableCell>응답 시간</TableCell>
                                        <TableCell>마지막 체크</TableCell>
                                        <TableCell>액션</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {deploymentConfig?.healthChecks.map((check) => (
                                        <TableRow key={check.id}>
                                            <TableCell>
                                                <Typography variant="subtitle2">
                                                    {check.name}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" color="text.secondary">
                                                    {check.method} {check.url}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={check.status}
                                                    size="small"
                                                    color={getHealthCheckColor(check.status)}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2">
                                                    {check.responseTime || 0}ms
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="caption" color="text.secondary">
                                                    {check.lastCheck?.toLocaleString() || 'N/A'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <IconButton size="small">
                                                    <Refresh />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </CardContent>
                </Card>
            )}

            {/* 모니터링 탭 */}
            {selectedTab === 2 && (
                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    📊 실시간 메트릭
                                </Typography>

                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <Box>
                                        <Typography variant="subtitle2">시스템 상태</Typography>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                                            <Typography variant="body2">가동률</Typography>
                                            <Typography variant="body2" fontWeight="bold">
                                                {metrics?.uptime}%
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Typography variant="body2">에러율</Typography>
                                            <Typography variant="body2" fontWeight="bold">
                                                {metrics?.errorRate}%
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Typography variant="body2">응답 시간</Typography>
                                            <Typography variant="body2" fontWeight="bold">
                                                {metrics?.responseTime}ms
                                            </Typography>
                                        </Box>
                                    </Box>

                                    <Divider />

                                    <Box>
                                        <Typography variant="subtitle2">사용자 만족도</Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                                            <Rating value={metrics?.userSatisfaction || 0} readOnly />
                                            <Typography variant="body2">
                                                {metrics?.userSatisfaction}/5
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    🚨 알림 설정
                                </Typography>

                                <List>
                                    {deploymentConfig?.monitoring.alerts.map((alert) => (
                                        <ListItem key={alert.id}>
                                            <ListItemIcon>
                                                {alert.severity === 'critical' && <Error color="error" />}
                                                {alert.severity === 'high' && <Warning color="warning" />}
                                                {alert.severity === 'medium' && <Info color="info" />}
                                                {alert.severity === 'low' && <CheckCircle color="success" />}
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={alert.name}
                                                secondary={
                                                    <Box>
                                                        <Typography variant="body2" color="text.secondary">
                                                            조건: {alert.condition}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            임계값: {alert.threshold} •
                                                            채널: {alert.channels.join(', ')}
                                                        </Typography>
                                                    </Box>
                                                }
                                            />
                                            <Switch
                                                checked={alert.enabled}
                                                size="small"
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            {/* 배포 이력 탭 */}
            {selectedTab === 3 && (
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            📋 최근 배포 이력
                        </Typography>

                        <TableContainer component={Paper}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>버전</TableCell>
                                        <TableCell>환경</TableCell>
                                        <TableCell>상태</TableCell>
                                        <TableCell>배포 시간</TableCell>
                                        <TableCell>소요 시간</TableCell>
                                        <TableCell>담당자</TableCell>
                                        <TableCell>액션</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    <TableRow>
                                        <TableCell>
                                            <Typography variant="subtitle2">
                                                {deploymentConfig?.version}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={deploymentConfig?.environment}
                                                size="small"
                                                color="primary"
                                                variant="outlined"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label="성공"
                                                size="small"
                                                color="success"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {new Date().toLocaleString()}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {metrics?.averageDeploymentTime}분
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {deploymentConfig?.createdBy}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                <Tooltip title="상세 보기">
                                                    <IconButton size="small">
                                                        <Visibility />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="롤백">
                                                    <IconButton size="small" color="error">
                                                        <Refresh />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </CardContent>
                </Card>
            )}
        </Box>
    );
};

export default FinalDeploymentSystem;
