/**
 * 베타 테스트 실행 시스템 (v1.3)
 * 실제 사용자 테스트 및 데이터 수집 시스템
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
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Tabs,
    Tab,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Badge,
    Avatar,
    Stack,
    Rating,
    Timeline,
    TimelineItem,
    TimelineSeparator,
    TimelineConnector,
    TimelineContent,
    TimelineDot,
    TimelineOppositeContent
} from '@mui/material';
import {
    PlayArrow,
    Pause,
    Stop,
    Refresh,
    Analytics,
    Assessment,
    BugReport,
    CheckCircle,
    Error,
    Warning,
    Info,
    Timeline,
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
    TrendingUp,
    TrendingDown,
    Visibility,
    VisibilityOff,
    Settings,
    Download,
    Upload,
    Send,
    Close,
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
    FavoriteBorder,
    EmojiEmotions,
    SentimentSatisfied,
    SentimentDissatisfied,
    SentimentVeryDissatisfied,
    SentimentNeutral,
    SentimentVerySatisfied,
    FilterList,
    Sort,
    Search,
    Monitor,
    Smartphone,
    Tablet,
    Computer,
    Cloud,
    Storage,
    Cpu,
    Wifi,
    SignalCellular4Bar,
    Battery6Bar,
    Thermostat,
    Performance,
    Optimization,
    AutoAwesome,
    Rocket,
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
    TuneIcon
} from '@mui/icons-material';

// 타입 정의
interface BetaTester {
    id: string;
    name: string;
    email: string;
    role: 'developer' | 'designer' | 'tester' | 'end_user' | 'product_manager';
    joinDate: Date;
    status: 'active' | 'inactive' | 'pending' | 'completed';
    feedbackCount: number;
    bugReports: number;
    featureRequests: number;
    testScenariosCompleted: number;
    satisfactionScore: number;
    deviceType: 'desktop' | 'mobile' | 'tablet';
    browserInfo: string;
    location: string;
    timezone: string;
    lastActive: Date;
    profile: {
        experience: 'beginner' | 'intermediate' | 'advanced' | 'expert';
        interests: string[];
        skills: string[];
    };
}

interface TestScenario {
    id: string;
    name: string;
    description: string;
    category: 'functionality' | 'ui_ux' | 'performance' | 'security' | 'accessibility';
    priority: 'low' | 'medium' | 'high' | 'critical';
    steps: string[];
    expectedResult: string;
    status: 'pending' | 'in_progress' | 'passed' | 'failed' | 'blocked';
    assignedTo: string[];
    createdAt: Date;
    completedAt?: Date;
    results: {
        testerId: string;
        status: 'passed' | 'failed' | 'blocked';
        notes: string;
        screenshots: string[];
        bugs: string[];
        suggestions: string[];
        rating: number;
        timestamp: Date;
    }[];
    successRate: number;
    averageRating: number;
}

interface TestSession {
    id: string;
    testerId: string;
    scenarioId: string;
    startTime: Date;
    endTime?: Date;
    duration?: number;
    status: 'active' | 'completed' | 'abandoned';
    progress: number;
    currentStep: number;
    notes: string;
    issues: string[];
    satisfaction: number;
}

interface TestMetrics {
    totalTesters: number;
    activeTesters: number;
    completedScenarios: number;
    totalScenarios: number;
    successRate: number;
    averageSatisfaction: number;
    averageCompletionTime: number;
    bugCount: number;
    featureRequestCount: number;
    criticalIssues: number;
    performanceIssues: number;
    securityIssues: number;
    accessibilityIssues: number;
}

// 메인 컴포넌트
const BetaTestExecution: React.FC = () => {
    // 상태 관리
    const [loading, setLoading] = useState(false);
    const [testers, setTesters] = useState<BetaTester[]>([]);
    const [scenarios, setScenarios] = useState<TestScenario[]>([]);
    const [sessions, setSessions] = useState<TestSession[]>([]);
    const [metrics, setMetrics] = useState<TestMetrics | null>(null);
    const [selectedTab, setSelectedTab] = useState(0);
    const [showTesterDialog, setShowTesterDialog] = useState(false);
    const [showScenarioDialog, setShowScenarioDialog] = useState(false);
    const [selectedTester, setSelectedTester] = useState<BetaTester | null>(null);
    const [selectedScenario, setSelectedScenario] = useState<TestScenario | null>(null);
    const [testRunning, setTestRunning] = useState(false);
    const [autoAssign, setAutoAssign] = useState(true);

    // 데이터 로드
    const loadBetaTestData = useCallback(async () => {
        setLoading(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));

            // 모의 베타 테스터 데이터
            const mockTesters: BetaTester[] = [
                {
                    id: '1',
                    name: '김개발',
                    email: 'dev@example.com',
                    role: 'developer',
                    joinDate: new Date('2024-09-01'),
                    status: 'active',
                    feedbackCount: 15,
                    bugReports: 3,
                    featureRequests: 8,
                    testScenariosCompleted: 12,
                    satisfactionScore: 4.2,
                    deviceType: 'desktop',
                    browserInfo: 'Chrome 120.0',
                    location: 'Seoul, Korea',
                    timezone: 'Asia/Seoul',
                    lastActive: new Date(),
                    profile: {
                        experience: 'expert',
                        interests: ['frontend', 'ui', 'performance'],
                        skills: ['React', 'TypeScript', 'CSS', 'Testing']
                    }
                },
                {
                    id: '2',
                    name: '이디자인',
                    email: 'design@example.com',
                    role: 'designer',
                    joinDate: new Date('2024-09-15'),
                    status: 'active',
                    feedbackCount: 22,
                    bugReports: 1,
                    featureRequests: 12,
                    testScenariosCompleted: 8,
                    satisfactionScore: 4.5,
                    deviceType: 'desktop',
                    browserInfo: 'Safari 17.0',
                    location: 'Tokyo, Japan',
                    timezone: 'Asia/Tokyo',
                    lastActive: new Date(Date.now() - 1000 * 60 * 30),
                    profile: {
                        experience: 'advanced',
                        interests: ['ui', 'ux', 'accessibility'],
                        skills: ['Figma', 'Sketch', 'Adobe XD', 'User Research']
                    }
                },
                {
                    id: '3',
                    name: '박테스터',
                    email: 'test@example.com',
                    role: 'tester',
                    joinDate: new Date('2024-10-01'),
                    status: 'active',
                    feedbackCount: 35,
                    bugReports: 8,
                    featureRequests: 5,
                    testScenariosCompleted: 20,
                    satisfactionScore: 3.8,
                    deviceType: 'mobile',
                    browserInfo: 'Chrome Mobile 120.0',
                    location: 'New York, USA',
                    timezone: 'America/New_York',
                    lastActive: new Date(Date.now() - 1000 * 60 * 60 * 2),
                    profile: {
                        experience: 'expert',
                        interests: ['testing', 'qa', 'automation'],
                        skills: ['Selenium', 'Jest', 'Cypress', 'Manual Testing']
                    }
                }
            ];

            setTesters(mockTesters);

            // 모의 테스트 시나리오
            const mockScenarios: TestScenario[] = [
                {
                    id: '1',
                    name: '사용자 로그인 플로우',
                    description: '사용자가 이메일과 비밀번호로 로그인하는 과정을 테스트합니다.',
                    category: 'functionality',
                    priority: 'high',
                    steps: [
                        '로그인 페이지 접속',
                        '이메일 입력',
                        '비밀번호 입력',
                        '로그인 버튼 클릭',
                        '대시보드 페이지 이동 확인'
                    ],
                    expectedResult: '성공적으로 로그인되어 대시보드가 표시됨',
                    status: 'in_progress',
                    assignedTo: ['1', '2'],
                    createdAt: new Date('2024-10-01'),
                    results: [
                        {
                            testerId: '1',
                            status: 'passed',
                            notes: '로그인 과정이 원활하게 작동함',
                            screenshots: [],
                            bugs: [],
                            suggestions: ['비밀번호 표시/숨김 기능 추가'],
                            rating: 4,
                            timestamp: new Date('2024-10-02')
                        }
                    ],
                    successRate: 100,
                    averageRating: 4.0
                },
                {
                    id: '2',
                    name: '채팅 메시지 전송',
                    description: '실시간 채팅에서 메시지를 전송하고 받는 기능을 테스트합니다.',
                    category: 'functionality',
                    priority: 'critical',
                    steps: [
                        '채팅방 입장',
                        '메시지 입력',
                        '전송 버튼 클릭',
                        '메시지 표시 확인',
                        '다른 사용자에게 전달 확인'
                    ],
                    expectedResult: '메시지가 즉시 전송되고 모든 사용자에게 표시됨',
                    status: 'pending',
                    assignedTo: ['2', '3'],
                    createdAt: new Date('2024-10-01'),
                    results: [],
                    successRate: 0,
                    averageRating: 0
                }
            ];

            setScenarios(mockScenarios);

            // 모의 테스트 세션
            const mockSessions: TestSession[] = [
                {
                    id: '1',
                    testerId: '1',
                    scenarioId: '1',
                    startTime: new Date(Date.now() - 1000 * 60 * 30),
                    status: 'active',
                    progress: 60,
                    currentStep: 3,
                    notes: '현재 로그인 단계 테스트 중',
                    issues: [],
                    satisfaction: 0
                }
            ];

            setSessions(mockSessions);

            // 모의 메트릭
            const mockMetrics: TestMetrics = {
                totalTesters: mockTesters.length,
                activeTesters: mockTesters.filter(t => t.status === 'active').length,
                completedScenarios: 1,
                totalScenarios: mockScenarios.length,
                successRate: 100,
                averageSatisfaction: 4.2,
                averageCompletionTime: 15,
                bugCount: 12,
                featureRequestCount: 25,
                criticalIssues: 2,
                performanceIssues: 3,
                securityIssues: 1,
                accessibilityIssues: 2
            };

            setMetrics(mockMetrics);

        } catch (error) {
            console.error('Failed to load beta test data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    // 테스트 시작
    const startTest = async () => {
        setTestRunning(true);
        setLoading(true);
        try {
            // 실제 구현에서는 테스트 시작 로직
            await new Promise(resolve => setTimeout(resolve, 2000));
            console.log('Beta test started');
        } catch (error) {
            console.error('Failed to start test:', error);
        } finally {
            setLoading(false);
        }
    };

    // 테스트 중지
    const stopTest = async () => {
        setTestRunning(false);
        setLoading(true);
        try {
            // 실제 구현에서는 테스트 중지 로직
            await new Promise(resolve => setTimeout(resolve, 1000));
            console.log('Beta test stopped');
        } catch (error) {
            console.error('Failed to stop test:', error);
        } finally {
            setLoading(false);
        }
    };

    // 시나리오 할당
    const assignScenario = (scenarioId: string, testerIds: string[]) => {
        setScenarios(prev => prev.map(scenario =>
            scenario.id === scenarioId
                ? { ...scenario, assignedTo: testerIds }
                : scenario
        ));
    };

    // 테스터 상태 변경
    const updateTesterStatus = (testerId: string, status: BetaTester['status']) => {
        setTesters(prev => prev.map(tester =>
            tester.id === testerId
                ? { ...tester, status }
                : tester
        ));
    };

    // 우선순위별 색상
    const getPriorityColor = (priority: TestScenario['priority']) => {
        switch (priority) {
            case 'critical': return 'error';
            case 'high': return 'warning';
            case 'medium': return 'info';
            case 'low': return 'success';
            default: return 'default';
        }
    };

    // 상태별 색상
    const getStatusColor = (status: TestScenario['status']) => {
        switch (status) {
            case 'pending': return 'info';
            case 'in_progress': return 'warning';
            case 'passed': return 'success';
            case 'failed': return 'error';
            case 'blocked': return 'secondary';
            default: return 'default';
        }
    };

    // 초기 로드
    useEffect(() => {
        loadBetaTestData();
    }, [loadBetaTestData]);

    return (
        <Box sx={{ p: 3 }}>
            {/* 헤더 */}
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
                    🧪 베타 테스트 실행 시스템 (v1.3)
                </Typography>

                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={autoAssign}
                                onChange={(e) => setAutoAssign(e.target.checked)}
                            />
                        }
                        label="자동 할당"
                    />

                    {!testRunning ? (
                        <Button
                            variant="contained"
                            startIcon={<PlayArrow />}
                            onClick={startTest}
                            disabled={loading}
                            color="success"
                        >
                            테스트 시작
                        </Button>
                    ) : (
                        <Button
                            variant="contained"
                            startIcon={<Stop />}
                            onClick={stopTest}
                            disabled={loading}
                            color="error"
                        >
                            테스트 중지
                        </Button>
                    )}

                    <Button
                        variant="outlined"
                        startIcon={<Refresh />}
                        onClick={loadBetaTestData}
                        disabled={loading}
                    >
                        새로고침
                    </Button>
                </Box>
            </Box>

            {/* 테스트 상태 표시 */}
            {testRunning && (
                <Alert severity="success" sx={{ mb: 3 }}>
                    <AlertTitle>베타 테스트 실행 중</AlertTitle>
                    현재 {sessions.filter(s => s.status === 'active').length}개의 활성 테스트 세션이 진행 중입니다.
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
                                        총 테스터
                                    </Typography>
                                    <Typography variant="h4" component="div">
                                        {metrics?.totalTesters || 0}
                                    </Typography>
                                </Box>
                                <Group sx={{ fontSize: 40, color: 'primary.main' }} />
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
                                        활성 테스터
                                    </Typography>
                                    <Typography variant="h4" component="div">
                                        {metrics?.activeTesters || 0}
                                    </Typography>
                                </Box>
                                <Person sx={{ fontSize: 40, color: 'success.main' }} />
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
                                        완료된 시나리오
                                    </Typography>
                                    <Typography variant="h4" component="div">
                                        {metrics?.completedScenarios || 0}/{metrics?.totalScenarios || 0}
                                    </Typography>
                                </Box>
                                <CheckCircle sx={{ fontSize: 40, color: 'info.main' }} />
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
                                        {metrics?.successRate || 0}%
                                    </Typography>
                                </Box>
                                <TrendingUp sx={{ fontSize: 40, color: 'warning.main' }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* 탭 네비게이션 */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={selectedTab} onChange={(e, newValue) => setSelectedTab(newValue)}>
                    <Tab label="테스터 관리" />
                    <Tab label="테스트 시나리오" />
                    <Tab label="실행 중인 테스트" />
                    <Tab label="결과 분석" />
                </Tabs>
            </Box>

            {/* 테스터 관리 탭 */}
            {selectedTab === 0 && (
                <Card>
                    <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6">
                                👥 베타 테스터 관리
                            </Typography>
                            <Button
                                variant="contained"
                                startIcon={<Add />}
                                onClick={() => setShowTesterDialog(true)}
                            >
                                테스터 추가
                            </Button>
                        </Box>

                        <TableContainer component={Paper}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>이름</TableCell>
                                        <TableCell>역할</TableCell>
                                        <TableCell>상태</TableCell>
                                        <TableCell>완료된 시나리오</TableCell>
                                        <TableCell>만족도</TableCell>
                                        <TableCell>마지막 활동</TableCell>
                                        <TableCell>액션</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {testers.map((tester) => (
                                        <TableRow key={tester.id}>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Avatar sx={{ width: 32, height: 32 }}>
                                                        {tester.name.charAt(0)}
                                                    </Avatar>
                                                    <Box>
                                                        <Typography variant="subtitle2">
                                                            {tester.name}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {tester.email}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={tester.role}
                                                    size="small"
                                                    color="primary"
                                                    variant="outlined"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={tester.status}
                                                    size="small"
                                                    color={tester.status === 'active' ? 'success' : 'default'}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2">
                                                    {tester.testScenariosCompleted}개
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <Rating value={tester.satisfactionScore} size="small" readOnly />
                                                    <Typography variant="caption">
                                                        ({tester.satisfactionScore.toFixed(1)})
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="caption" color="text.secondary">
                                                    {tester.lastActive.toLocaleString()}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                    <Tooltip title="상세 보기">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => setSelectedTester(tester)}
                                                        >
                                                            <Visibility />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="편집">
                                                        <IconButton size="small">
                                                            <Edit />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </CardContent>
                </Card>
            )}

            {/* 테스트 시나리오 탭 */}
            {selectedTab === 1 && (
                <Card>
                    <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6">
                                📋 테스트 시나리오
                            </Typography>
                            <Button
                                variant="contained"
                                startIcon={<Add />}
                                onClick={() => setShowScenarioDialog(true)}
                            >
                                시나리오 추가
                            </Button>
                        </Box>

                        <List>
                            {scenarios.map((scenario) => (
                                <ListItem key={scenario.id} divider>
                                    <ListItemIcon>
                                        {scenario.category === 'functionality' && <BugReport color="primary" />}
                                        {scenario.category === 'ui_ux' && <Assessment color="info" />}
                                        {scenario.category === 'performance' && <Speed color="warning" />}
                                        {scenario.category === 'security' && <Security color="error" />}
                                        {scenario.category === 'accessibility' && <Accessibility color="success" />}
                                    </ListItemIcon>

                                    <ListItemText
                                        primary={
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                <Typography variant="subtitle1">
                                                    {scenario.name}
                                                </Typography>
                                                <Chip
                                                    label={scenario.priority}
                                                    size="small"
                                                    color={getPriorityColor(scenario.priority)}
                                                />
                                                <Chip
                                                    label={scenario.status}
                                                    size="small"
                                                    color={getStatusColor(scenario.status)}
                                                />
                                                <Chip
                                                    label={`${scenario.successRate}% 성공`}
                                                    size="small"
                                                    variant="outlined"
                                                />
                                            </Box>
                                        }
                                        secondary={
                                            <Box>
                                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                                    {scenario.description}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    할당된 테스터: {scenario.assignedTo.length}명 •
                                                    평균 평점: {scenario.averageRating.toFixed(1)}/5
                                                </Typography>
                                            </Box>
                                        }
                                    />

                                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                                        <Tooltip title="상세 보기">
                                            <IconButton
                                                size="small"
                                                onClick={() => setSelectedScenario(scenario)}
                                            >
                                                <Visibility />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="편집">
                                            <IconButton size="small">
                                                <Edit />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="할당">
                                            <IconButton size="small">
                                                <Person />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                </ListItem>
                            ))}
                        </List>
                    </CardContent>
                </Card>
            )}

            {/* 실행 중인 테스트 탭 */}
            {selectedTab === 2 && (
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            🔄 실행 중인 테스트
                        </Typography>

                        {sessions.length === 0 ? (
                            <Alert severity="info">
                                <AlertTitle>실행 중인 테스트 없음</AlertTitle>
                                현재 실행 중인 테스트 세션이 없습니다.
                            </Alert>
                        ) : (
                            <List>
                                {sessions.map((session) => {
                                    const tester = testers.find(t => t.id === session.testerId);
                                    const scenario = scenarios.find(s => s.id === session.scenarioId);

                                    return (
                                        <ListItem key={session.id} divider>
                                            <ListItemIcon>
                                                <PlayArrow color="success" />
                                            </ListItemIcon>

                                            <ListItemText
                                                primary={
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Typography variant="subtitle1">
                                                            {scenario?.name}
                                                        </Typography>
                                                        <Chip
                                                            label={`${session.progress}% 완료`}
                                                            size="small"
                                                            color="info"
                                                        />
                                                    </Box>
                                                }
                                                secondary={
                                                    <Box>
                                                        <Typography variant="body2" color="text.secondary">
                                                            테스터: {tester?.name} •
                                                            시작: {session.startTime.toLocaleString()}
                                                        </Typography>
                                                        <LinearProgress
                                                            variant="determinate"
                                                            value={session.progress}
                                                            sx={{ mt: 1 }}
                                                        />
                                                    </Box>
                                                }
                                            />

                                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                <Tooltip title="상세 보기">
                                                    <IconButton size="small">
                                                        <Visibility />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="중지">
                                                    <IconButton size="small" color="error">
                                                        <Stop />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        </ListItem>
                                    );
                                })}
                            </List>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* 결과 분석 탭 */}
            {selectedTab === 3 && (
                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    📊 테스트 결과 요약
                                </Typography>

                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="body2">총 버그 리포트</Typography>
                                        <Typography variant="body2" fontWeight="bold">
                                            {metrics?.bugCount || 0}개
                                        </Typography>
                                    </Box>

                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="body2">기능 요청</Typography>
                                        <Typography variant="body2" fontWeight="bold">
                                            {metrics?.featureRequestCount || 0}개
                                        </Typography>
                                    </Box>

                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="body2">평균 만족도</Typography>
                                        <Typography variant="body2" fontWeight="bold">
                                            {metrics?.averageSatisfaction?.toFixed(1) || '0.0'}/5
                                        </Typography>
                                    </Box>

                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="body2">평균 완료 시간</Typography>
                                        <Typography variant="body2" fontWeight="bold">
                                            {metrics?.averageCompletionTime || 0}분
                                        </Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    🚨 이슈 분류
                                </Typography>

                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="body2">Critical 이슈</Typography>
                                        <Chip
                                            label={metrics?.criticalIssues || 0}
                                            size="small"
                                            color="error"
                                        />
                                    </Box>

                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="body2">성능 이슈</Typography>
                                        <Chip
                                            label={metrics?.performanceIssues || 0}
                                            size="small"
                                            color="warning"
                                        />
                                    </Box>

                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="body2">보안 이슈</Typography>
                                        <Chip
                                            label={metrics?.securityIssues || 0}
                                            size="small"
                                            color="error"
                                        />
                                    </Box>

                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="body2">접근성 이슈</Typography>
                                        <Chip
                                            label={metrics?.accessibilityIssues || 0}
                                            size="small"
                                            color="info"
                                        />
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}
        </Box>
    );
};

export default BetaTestExecution;
