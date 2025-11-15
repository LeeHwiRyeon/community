/**
 * 고급 성능 최적화 시스템 (v1.3)
 * AI 기반 성능 분석 및 자동 최적화 시스템
 */

import React, { useState, useEffect, useCallback } from 'react';
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
    Speed,
    Memory,
    NetworkCheck,
    Analytics,
    TrendingUp,
    TrendingDown,
    Warning,
    Error,
    CheckCircle,
    Info,
    Refresh,
    Settings,
    BarChart,
    PieChart,
    ExpandMore,
    Monitor,
    Smartphone,
    Tablet,
    Computer,
    Cloud,
    Storage,
    Wifi,
    SignalCellular4Bar,
    Battery6Bar,
    Thermostat,
    Security,
    Shield,
    BugReport,
    AutoAwesome,
    Rocket,
    Psychology,
    Science,
    Biotech,
    Engineering,
    Construction,
    Build,
    Handyman,
    Tune,
    Adjust,
    SettingsApplications,
    FlashOn,
    Bolt,
    Thunderstorm,
    EnergySavingsLeaf,
    Recycling,
    Compress,
    Expand,
    Minimize,
    Maximize,
    Fullscreen,
    FullscreenExit,
    ZoomIn,
    ZoomOut,
    Visibility,
    VisibilityOff,
    Download,
    Upload,
    Share,
    GetApp,
    Publish,
    Launch,
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
    ScheduleOutlined
} from '@mui/icons-material';

// 타입 정의
interface PerformanceIssue {
    id: string;
    type: 'bundle_size' | 'loading_time' | 'memory_usage' | 'api_latency' | 'rendering' | 'network';
    severity: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    impact: number; // 0-100
    effort: 'low' | 'medium' | 'high';
    status: 'identified' | 'analyzing' | 'optimizing' | 'completed' | 'failed';
    currentValue: number;
    targetValue: number;
    unit: string;
    category: 'frontend' | 'backend' | 'database' | 'network' | 'infrastructure';
    detectedAt: Date;
    resolvedAt?: Date;
    optimizationSteps: string[];
    metrics: {
        before: number;
        after?: number;
        improvement: number;
    };
    recommendations: string[];
    autoFixable: boolean;
}

interface OptimizationResult {
    id: string;
    issueId: string;
    optimizationType: 'automatic' | 'manual' | 'semi_automatic';
    status: 'pending' | 'running' | 'completed' | 'failed';
    startTime: Date;
    endTime?: Date;
    duration?: number;
    improvements: {
        metric: string;
        before: number;
        after: number;
        improvement: number;
        unit: string;
    }[];
    logs: string[];
    errors?: string[];
}

interface PerformanceMetrics {
    bundleSize: number;
    firstContentfulPaint: number;
    largestContentfulPaint: number;
    cumulativeLayoutShift: number;
    firstInputDelay: number;
    timeToInteractive: number;
    memoryUsage: number;
    cpuUsage: number;
    networkLatency: number;
    apiResponseTime: number;
    errorRate: number;
    cacheHitRate: number;
    compressionRatio: number;
    imageOptimization: number;
    codeSplitting: number;
    lazyLoading: number;
    timestamp: Date;
}

interface OptimizationProfile {
    id: string;
    name: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    category: 'performance' | 'security' | 'accessibility' | 'seo' | 'ux';
    enabled: boolean;
    autoApply: boolean;
    conditions: {
        metric: string;
        operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
        value: number;
    }[];
    actions: {
        type: string;
        parameters: any;
    }[];
    successRate: number;
    lastApplied: Date;
    appliedCount: number;
}

// 메인 컴포넌트
const AdvancedPerformanceOptimization: React.FC = () => {
    // 상태 관리
    const [loading, setLoading] = useState(false);
    const [issues, setIssues] = useState<PerformanceIssue[]>([]);
    const [results, setResults] = useState<OptimizationResult[]>([]);
    const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
    const [profiles, setProfiles] = useState<OptimizationProfile[]>([]);
    const [selectedTab, setSelectedTab] = useState(0);
    const [autoOptimization, setAutoOptimization] = useState(true);
    const [showOptimizationDialog, setShowOptimizationDialog] = useState(false);
    const [selectedIssue, setSelectedIssue] = useState<PerformanceIssue | null>(null);
    const [optimizationRunning, setOptimizationRunning] = useState(false);

    // 데이터 로드
    const loadPerformanceData = useCallback(async () => {
        setLoading(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));

            // 모의 성능 이슈
            const mockIssues: PerformanceIssue[] = [
                {
                    id: '1',
                    type: 'bundle_size',
                    severity: 'high',
                    title: 'JavaScript 번들 크기 과다',
                    description: '메인 JavaScript 번들이 2.5MB로 권장 크기(1MB)를 초과합니다.',
                    impact: 85,
                    effort: 'medium',
                    status: 'identified',
                    currentValue: 2.5,
                    targetValue: 1.0,
                    unit: 'MB',
                    category: 'frontend',
                    detectedAt: new Date(Date.now() - 1000 * 60 * 30),
                    optimizationSteps: [
                        '코드 스플리팅 적용',
                        'Tree shaking 최적화',
                        '불필요한 의존성 제거',
                        'Dynamic imports 사용'
                    ],
                    metrics: {
                        before: 2.5,
                        improvement: 0
                    },
                    recommendations: [
                        'React.lazy()를 사용한 컴포넌트 지연 로딩',
                        'Webpack Bundle Analyzer로 번들 분석',
                        '중복 코드 제거'
                    ],
                    autoFixable: true
                },
                {
                    id: '2',
                    type: 'loading_time',
                    severity: 'critical',
                    title: '초기 로딩 시간 지연',
                    description: 'First Contentful Paint가 3.2초로 권장 시간(1.5초)을 초과합니다.',
                    impact: 95,
                    effort: 'high',
                    status: 'analyzing',
                    currentValue: 3.2,
                    targetValue: 1.5,
                    unit: '초',
                    category: 'frontend',
                    detectedAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
                    optimizationSteps: [
                        'Critical CSS 인라인화',
                        '이미지 최적화 및 지연 로딩',
                        '서버 사이드 렌더링 적용',
                        'CDN 활용'
                    ],
                    metrics: {
                        before: 3.2,
                        improvement: 0
                    },
                    recommendations: [
                        'Next.js SSR 도입 검토',
                        '이미지 WebP 포맷 사용',
                        'Critical Resource Hints 추가'
                    ],
                    autoFixable: false
                },
                {
                    id: '3',
                    type: 'memory_usage',
                    severity: 'medium',
                    title: '메모리 사용량 증가',
                    description: '메모리 사용량이 지속적으로 증가하여 성능에 영향을 미칩니다.',
                    impact: 60,
                    effort: 'low',
                    status: 'optimizing',
                    currentValue: 245,
                    targetValue: 150,
                    unit: 'MB',
                    category: 'frontend',
                    detectedAt: new Date(Date.now() - 1000 * 60 * 60 * 4),
                    optimizationSteps: [
                        '메모리 누수 확인',
                        '이벤트 리스너 정리',
                        '가비지 컬렉션 최적화',
                        'WeakMap/WeakSet 사용'
                    ],
                    metrics: {
                        before: 245,
                        after: 180,
                        improvement: 26.5
                    },
                    recommendations: [
                        'useEffect cleanup 함수 추가',
                        '메모리 프로파일링 도구 사용',
                        '컴포넌트 언마운트 시 정리'
                    ],
                    autoFixable: true
                }
            ];

            setIssues(mockIssues);

            // 모의 최적화 결과
            const mockResults: OptimizationResult[] = [
                {
                    id: '1',
                    issueId: '3',
                    optimizationType: 'automatic',
                    status: 'completed',
                    startTime: new Date(Date.now() - 1000 * 60 * 60 * 2),
                    endTime: new Date(Date.now() - 1000 * 60 * 60 * 1),
                    duration: 60,
                    improvements: [
                        {
                            metric: '메모리 사용량',
                            before: 245,
                            after: 180,
                            improvement: 26.5,
                            unit: 'MB'
                        }
                    ],
                    logs: [
                        '메모리 누수 감지 완료',
                        '이벤트 리스너 정리 시작',
                        '가비지 컬렉션 실행',
                        '최적화 완료'
                    ]
                }
            ];

            setResults(mockResults);

            // 모의 성능 메트릭
            const mockMetrics: PerformanceMetrics = {
                bundleSize: 2.5,
                firstContentfulPaint: 3.2,
                largestContentfulPaint: 4.1,
                cumulativeLayoutShift: 0.15,
                firstInputDelay: 120,
                timeToInteractive: 4.5,
                memoryUsage: 180,
                cpuUsage: 15,
                networkLatency: 45,
                apiResponseTime: 0.8,
                errorRate: 0.1,
                cacheHitRate: 85,
                compressionRatio: 70,
                imageOptimization: 60,
                codeSplitting: 40,
                lazyLoading: 80,
                timestamp: new Date()
            };

            setMetrics(mockMetrics);

            // 모의 최적화 프로필
            const mockProfiles: OptimizationProfile[] = [
                {
                    id: '1',
                    name: '번들 크기 최적화',
                    description: 'JavaScript 번들 크기를 자동으로 최적화합니다.',
                    priority: 'high',
                    category: 'performance',
                    enabled: true,
                    autoApply: true,
                    conditions: [
                        {
                            metric: 'bundleSize',
                            operator: 'gt',
                            value: 1.5
                        }
                    ],
                    actions: [
                        {
                            type: 'code_splitting',
                            parameters: { threshold: 100000 }
                        },
                        {
                            type: 'tree_shaking',
                            parameters: { enabled: true }
                        }
                    ],
                    successRate: 85,
                    lastApplied: new Date(Date.now() - 1000 * 60 * 30),
                    appliedCount: 12
                },
                {
                    id: '2',
                    name: '이미지 최적화',
                    description: '이미지를 자동으로 압축하고 최적화합니다.',
                    priority: 'medium',
                    category: 'performance',
                    enabled: true,
                    autoApply: true,
                    conditions: [
                        {
                            metric: 'imageOptimization',
                            operator: 'lt',
                            value: 80
                        }
                    ],
                    actions: [
                        {
                            type: 'image_compression',
                            parameters: { quality: 85, format: 'webp' }
                        },
                        {
                            type: 'lazy_loading',
                            parameters: { threshold: 0.1 }
                        }
                    ],
                    successRate: 92,
                    lastApplied: new Date(Date.now() - 1000 * 60 * 60 * 2),
                    appliedCount: 8
                }
            ];

            setProfiles(mockProfiles);

        } catch (error) {
            console.error('Failed to load performance data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    // 최적화 실행
    const runOptimization = async (issueId: string) => {
        setOptimizationRunning(true);
        setLoading(true);
        try {
            // 실제 구현에서는 최적화 로직 실행
            await new Promise(resolve => setTimeout(resolve, 3000));

            // 이슈 상태 업데이트
            setIssues(prev => prev.map(issue =>
                issue.id === issueId
                    ? { ...issue, status: 'optimizing' }
                    : issue
            ));

            // 최적화 결과 추가
            const newResult: OptimizationResult = {
                id: Date.now().toString(),
                issueId,
                optimizationType: 'automatic',
                status: 'running',
                startTime: new Date(),
                improvements: [],
                logs: ['최적화 시작...']
            };

            setResults(prev => [newResult, ...prev]);

        } catch (error) {
            console.error('Failed to run optimization:', error);
        } finally {
            setLoading(false);
            setOptimizationRunning(false);
        }
    };

    // 자동 최적화 실행
    const runAutoOptimization = async () => {
        setLoading(true);
        try {
            const autoFixableIssues = issues.filter(issue =>
                issue.autoFixable && issue.status === 'identified'
            );

            for (const issue of autoFixableIssues) {
                await runOptimization(issue.id);
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

        } catch (error) {
            console.error('Failed to run auto optimization:', error);
        } finally {
            setLoading(false);
        }
    };

    // 심각도별 색상
    const getSeverityColor = (severity: PerformanceIssue['severity']) => {
        switch (severity) {
            case 'critical': return 'error';
            case 'high': return 'warning';
            case 'medium': return 'info';
            case 'low': return 'success';
            default: return 'default';
        }
    };

    // 상태별 색상
    const getStatusColor = (status: PerformanceIssue['status']) => {
        switch (status) {
            case 'identified': return 'info';
            case 'analyzing': return 'warning';
            case 'optimizing': return 'primary';
            case 'completed': return 'success';
            case 'failed': return 'error';
            default: return 'default';
        }
    };

    // 타입별 아이콘
    const getTypeIcon = (type: PerformanceIssue['type']) => {
        switch (type) {
            case 'bundle_size': return <Storage color="warning" />;
            case 'loading_time': return <Speed color="error" />;
            case 'memory_usage': return <Memory color="info" />;
            case 'api_latency': return <NetworkCheck color="warning" />;
            case 'rendering': return <Monitor color="primary" />;
            case 'network': return <Wifi color="info" />;
            default: return <Tune color="inherit" />;
        }
    };

    // 초기 로드
    useEffect(() => {
        loadPerformanceData();
    }, [loadPerformanceData]);

    // 자동 최적화
    useEffect(() => {
        if (autoOptimization) {
            const interval = setInterval(() => {
                const autoFixableIssues = issues.filter(issue =>
                    issue.autoFixable && issue.status === 'identified'
                );
                if (autoFixableIssues.length > 0) {
                    runAutoOptimization();
                }
            }, 30000); // 30초마다 체크

            return () => clearInterval(interval);
        }
    }, [autoOptimization, issues]);

    return (
        <Box sx={{ p: 3 }}>
            {/* 헤더 */}
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
                    ⚡ 고급 성능 최적화 시스템 (v1.3)
                </Typography>

                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={autoOptimization}
                                onChange={(e) => setAutoOptimization(e.target.checked)}
                            />
                        }
                        label="자동 최적화"
                    />

                    <Button
                        variant="contained"
                        startIcon={<AutoAwesome />}
                        onClick={runAutoOptimization}
                        disabled={loading || optimizationRunning}
                        color="primary"
                    >
                        자동 최적화 실행
                    </Button>

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

            {/* 자동 최적화 상태 */}
            {autoOptimization && (
                <Alert severity="success" sx={{ mb: 3 }}>
                    <AlertTitle>자동 최적화 활성화</AlertTitle>
                    시스템이 자동으로 성능 이슈를 감지하고 최적화를 실행합니다.
                </Alert>
            )}

            {/* 성능 메트릭 개요 */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 3, mb: 3 }}>
                <Card>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box>
                                <Typography color="textSecondary" gutterBottom>
                                    번들 크기
                                </Typography>
                                <Typography variant="h4" component="div">
                                    {metrics?.bundleSize || 0}MB
                                </Typography>
                            </Box>
                            <Storage sx={{ fontSize: 40, color: 'warning.main' }} />
                        </Box>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box>
                                <Typography color="textSecondary" gutterBottom>
                                    로딩 시간
                                </Typography>
                                <Typography variant="h4" component="div">
                                    {metrics?.firstContentfulPaint || 0}초
                                </Typography>
                            </Box>
                            <Speed sx={{ fontSize: 40, color: 'error.main' }} />
                        </Box>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box>
                                <Typography color="textSecondary" gutterBottom>
                                    메모리 사용량
                                </Typography>
                                <Typography variant="h4" component="div">
                                    {metrics?.memoryUsage || 0}MB
                                </Typography>
                            </Box>
                            <Memory sx={{ fontSize: 40, color: 'info.main' }} />
                        </Box>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box>
                                <Typography color="textSecondary" gutterBottom>
                                    API 응답 시간
                                </Typography>
                                <Typography variant="h4" component="div">
                                    {metrics?.apiResponseTime || 0}초
                                </Typography>
                            </Box>
                            <NetworkCheck sx={{ fontSize: 40, color: 'success.main' }} />
                        </Box>
                    </CardContent>
                </Card>
            </Box>

            {/* 탭 네비게이션 */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={selectedTab} onChange={(e, newValue) => setSelectedTab(newValue)}>
                    <Tab label="성능 이슈" />
                    <Tab label="최적화 결과" />
                    <Tab label="최적화 프로필" />
                    <Tab label="성능 분석" />
                </Tabs>
            </Box>

            {/* 성능 이슈 탭 */}
            {selectedTab === 0 && (
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            🔍 감지된 성능 이슈 ({issues.length}개)
                        </Typography>

                        <List>
                            {issues.map((issue) => (
                                <ListItem key={issue.id} divider>
                                    <ListItemIcon>
                                        {getTypeIcon(issue.type)}
                                    </ListItemIcon>

                                    <ListItemText
                                        primary={
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                <Typography variant="subtitle1">
                                                    {issue.title}
                                                </Typography>
                                                <Chip
                                                    label={issue.severity}
                                                    size="small"
                                                    color={getSeverityColor(issue.severity)}
                                                />
                                                <Chip
                                                    label={issue.status}
                                                    size="small"
                                                    color={getStatusColor(issue.status)}
                                                />
                                                <Chip
                                                    label={`${issue.impact}% 영향`}
                                                    size="small"
                                                    variant="outlined"
                                                />
                                            </Box>
                                        }
                                        secondary={
                                            <Box>
                                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                                    {issue.description}
                                                </Typography>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                    <Typography variant="caption" color="text.secondary">
                                                        현재: {issue.currentValue}{issue.unit} → 목표: {issue.targetValue}{issue.unit}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        감지: {issue.detectedAt.toLocaleString()}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        카테고리: {issue.category}
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ mt: 1 }}>
                                                    {issue.autoFixable && (
                                                        <Chip
                                                            label="자동 수정 가능"
                                                            size="small"
                                                            color="success"
                                                            variant="outlined"
                                                        />
                                                    )}
                                                </Box>
                                            </Box>
                                        }
                                    />

                                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                                        <Tooltip title="상세 보기">
                                            <IconButton
                                                size="small"
                                                onClick={() => setSelectedIssue(issue)}
                                            >
                                                <Visibility />
                                            </IconButton>
                                        </Tooltip>

                                        {issue.autoFixable && issue.status === 'identified' && (
                                            <Tooltip title="최적화 실행">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => runOptimization(issue.id)}
                                                    disabled={optimizationRunning}
                                                >
                                                    <Rocket />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                    </Box>
                                </ListItem>
                            ))}
                        </List>
                    </CardContent>
                </Card>
            )}

            {/* 최적화 결과 탭 */}
            {selectedTab === 1 && (
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            📊 최적화 실행 결과 ({results.length}개)
                        </Typography>

                        {results.length === 0 ? (
                            <Alert severity="info">
                                <AlertTitle>최적화 결과 없음</AlertTitle>
                                아직 실행된 최적화가 없습니다.
                            </Alert>
                        ) : (
                            <List>
                                {results.map((result) => {
                                    const issue = issues.find(i => i.id === result.issueId);

                                    return (
                                        <ListItem key={result.id} divider>
                                            <ListItemIcon>
                                                {result.status === 'completed' && <CheckCircle color="success" />}
                                                {result.status === 'running' && <CircularProgress size={24} />}
                                                {result.status === 'failed' && <Error color="error" />}
                                                {result.status === 'pending' && <ScheduleOutlined color="info" />}
                                            </ListItemIcon>

                                            <ListItemText
                                                primary={
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Typography variant="subtitle1">
                                                            {issue?.title}
                                                        </Typography>
                                                        <Chip
                                                            label={result.status}
                                                            size="small"
                                                            color={result.status === 'completed' ? 'success' : 'info'}
                                                        />
                                                        <Chip
                                                            label={result.optimizationType}
                                                            size="small"
                                                            variant="outlined"
                                                        />
                                                    </Box>
                                                }
                                                secondary={
                                                    <Box>
                                                        <Typography variant="body2" color="text.secondary">
                                                            시작: {result.startTime.toLocaleString()}
                                                            {result.endTime && ` • 완료: ${result.endTime.toLocaleString()}`}
                                                            {result.duration && ` • 소요시간: ${result.duration}초`}
                                                        </Typography>

                                                        {result.improvements.length > 0 && (
                                                            <Box sx={{ mt: 1 }}>
                                                                {result.improvements.map((improvement, index) => (
                                                                    <Chip
                                                                        key={index}
                                                                        label={`${improvement.metric}: ${improvement.improvement.toFixed(1)}% 개선`}
                                                                        size="small"
                                                                        color="success"
                                                                        variant="outlined"
                                                                        sx={{ mr: 0.5, mb: 0.5 }}
                                                                    />
                                                                ))}
                                                            </Box>
                                                        )}
                                                    </Box>
                                                }
                                            />
                                        </ListItem>
                                    );
                                })}
                            </List>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* 최적화 프로필 탭 */}
            {selectedTab === 2 && (
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            ⚙️ 최적화 프로필 ({profiles.length}개)
                        </Typography>

                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
                            {profiles.map((profile) => (
                                <Card variant="outlined" key={profile.id}>
                                    <CardContent>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                            <Typography variant="subtitle1">
                                                {profile.name}
                                            </Typography>
                                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                <Chip
                                                    label={profile.priority}
                                                    size="small"
                                                    color={profile.priority === 'high' ? 'warning' : 'info'}
                                                />
                                                <Chip
                                                    label={profile.category}
                                                    size="small"
                                                    variant="outlined"
                                                />
                                            </Box>
                                        </Box>

                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                            {profile.description}
                                        </Typography>

                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Box>
                                                <Typography variant="caption" color="text.secondary">
                                                    성공률: {profile.successRate}%
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                                    적용 횟수: {profile.appliedCount}회
                                                </Typography>
                                            </Box>

                                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                <FormControlLabel
                                                    control={
                                                        <Switch
                                                            checked={profile.enabled}
                                                            size="small"
                                                        />
                                                    }
                                                    label="활성화"
                                                />
                                            </Box>
                                        </Box>
                                    </CardContent>
                                </Card>
                            ))}
                        </Box>
                    </CardContent>
                </Card>
            )}

            {/* 성능 분석 탭 */}
            {selectedTab === 3 && (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                📈 성능 지표
                            </Typography>

                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <Box>
                                    <Typography variant="subtitle2">Core Web Vitals</Typography>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                                        <Typography variant="body2">FCP</Typography>
                                        <Typography variant="body2">{metrics?.firstContentfulPaint}초</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="body2">LCP</Typography>
                                        <Typography variant="body2">{metrics?.largestContentfulPaint}초</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="body2">CLS</Typography>
                                        <Typography variant="body2">{metrics?.cumulativeLayoutShift}</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="body2">FID</Typography>
                                        <Typography variant="body2">{metrics?.firstInputDelay}ms</Typography>
                                    </Box>
                                </Box>

                                <Divider />

                                <Box>
                                    <Typography variant="subtitle2">최적화 지표</Typography>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                                        <Typography variant="body2">캐시 적중률</Typography>
                                        <Typography variant="body2">{metrics?.cacheHitRate}%</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="body2">압축률</Typography>
                                        <Typography variant="body2">{metrics?.compressionRatio}%</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="body2">이미지 최적화</Typography>
                                        <Typography variant="body2">{metrics?.imageOptimization}%</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="body2">코드 스플리팅</Typography>
                                        <Typography variant="body2">{metrics?.codeSplitting}%</Typography>
                                    </Box>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                💡 최적화 추천사항
                            </Typography>

                            <List>
                                <ListItem>
                                    <ListItemIcon>
                                        <AutoAwesome color="primary" />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary="번들 크기 최적화"
                                        secondary="코드 스플리팅과 Tree shaking을 적용하여 번들 크기를 줄이세요."
                                    />
                                </ListItem>

                                <ListItem>
                                    <ListItemIcon>
                                        <Speed color="warning" />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary="로딩 시간 개선"
                                        secondary="Critical CSS 인라인화와 이미지 지연 로딩을 적용하세요."
                                    />
                                </ListItem>

                                <ListItem>
                                    <ListItemIcon>
                                        <Memory color="info" />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary="메모리 사용량 최적화"
                                        secondary="메모리 누수를 방지하고 가비지 컬렉션을 최적화하세요."
                                    />
                                </ListItem>

                                <ListItem>
                                    <ListItemIcon>
                                        <NetworkCheck color="success" />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary="네트워크 최적화"
                                        secondary="CDN 활용과 압축을 통해 네트워크 성능을 개선하세요."
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

export default AdvancedPerformanceOptimization;
