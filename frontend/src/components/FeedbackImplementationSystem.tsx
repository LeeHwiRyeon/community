/**
 * 피드백 반영 시스템 (v1.3)
 * 사용자 피드백을 자동으로 분석하고 개발 작업에 반영하는 시스템
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
    Feedback,
    Star,
    ThumbUp,
    ThumbDown,
    BugReport,
    Lightbulb,
    Speed,
    Memory,
    NetworkCheck,
    Analytics,
    TrendingUp,
    TrendingDown,
    CheckCircle,
    Warning,
    Error,
    Info,
    Send,
    Close,
    Refresh,
    Download,
    Visibility,
    VisibilityOff,
    Settings,
    Assessment,
    BarChart,
    PieChart,
    ExpandMore,
    Person,
    Group,
    Security,
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
    FavoriteBorder,
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
    GetApp,
    Publish,
    Deploy,
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
    Directions,
    Flight,
    Train,
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
    TaskTwoTone
} from '@mui/icons-material';

// 타입 정의
interface FeedbackItem {
    id: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    type: 'bug_report' | 'feature_request' | 'general_feedback' | 'performance_issue' | 'ui_improvement' | 'accessibility';
    category: string;
    title: string;
    description: string;
    rating: number;
    sentiment: 'very_positive' | 'positive' | 'neutral' | 'negative' | 'very_negative';
    priority: 'low' | 'medium' | 'high' | 'critical';
    status: 'new' | 'analyzing' | 'in_progress' | 'resolved' | 'closed' | 'duplicate';
    timestamp: Date;
    attachments?: string[];
    tags: string[];
    votes: number;
    comments: number;
    assignedTo?: string;
    resolution?: string;
    estimatedEffort?: 'low' | 'medium' | 'high';
    impact?: 'low' | 'medium' | 'high';
    userAgent?: string;
    browserInfo?: string;
    deviceType?: 'desktop' | 'mobile' | 'tablet';
    location?: string;
    sessionId?: string;
    implementationPlan?: ImplementationPlan;
}

interface ImplementationPlan {
    id: string;
    feedbackId: string;
    status: 'draft' | 'approved' | 'in_progress' | 'completed' | 'cancelled';
    estimatedHours: number;
    actualHours?: number;
    assignedDeveloper: string;
    tasks: ImplementationTask[];
    dependencies: string[];
    milestones: Milestone[];
    createdAt: Date;
    updatedAt: Date;
    completedAt?: Date;
}

interface ImplementationTask {
    id: string;
    title: string;
    description: string;
    status: 'pending' | 'in_progress' | 'completed' | 'blocked';
    priority: 'low' | 'medium' | 'high' | 'critical';
    estimatedHours: number;
    actualHours?: number;
    assignedTo: string;
    dependencies: string[];
    createdAt: Date;
    completedAt?: Date;
    notes: string[];
}

interface Milestone {
    id: string;
    title: string;
    description: string;
    targetDate: Date;
    completedDate?: Date;
    status: 'pending' | 'completed' | 'overdue';
    tasks: string[];
}

interface FeedbackAnalytics {
    totalFeedbacks: number;
    averageRating: number;
    sentimentDistribution: {
        very_positive: number;
        positive: number;
        neutral: number;
        negative: number;
        very_negative: number;
    };
    categoryDistribution: { [key: string]: number };
    priorityDistribution: { [key: string]: number };
    statusDistribution: { [key: string]: number };
    trendData: Array<{
        date: string;
        count: number;
        sentiment: number;
    }>;
    topIssues: FeedbackItem[];
    responseTime: {
        average: number;
        median: number;
        p95: number;
    };
    implementationRate: number;
    userSatisfaction: number;
}

// 메인 컴포넌트
const FeedbackImplementationSystem: React.FC = () => {
    // 상태 관리
    const [loading, setLoading] = useState(false);
    const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
    const [analytics, setAnalytics] = useState<FeedbackAnalytics | null>(null);
    const [selectedTab, setSelectedTab] = useState(0);
    const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
    const [showAnalyticsDialog, setShowAnalyticsDialog] = useState(false);
    const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null);
    const [filters, setFilters] = useState({
        type: 'all',
        category: 'all',
        priority: 'all',
        status: 'all',
        sentiment: 'all',
        dateRange: 'all',
        assignedTo: 'all',
        tags: [] as string[]
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('timestamp');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [autoImplementation, setAutoImplementation] = useState(true);

    // 데이터 로드
    const loadFeedbackData = useCallback(async () => {
        setLoading(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));

            // 모의 피드백 데이터
            const mockFeedbacks: FeedbackItem[] = [
                {
                    id: '1',
                    userId: 'user1',
                    userName: '김사용자',
                    userAvatar: '/avatars/user1.jpg',
                    type: 'bug_report',
                    category: 'UI/UX',
                    title: '채팅 메시지가 깨져서 표시됨',
                    description: '특정 상황에서 채팅 메시지가 깨져서 표시되는 문제가 발생합니다. 특히 긴 메시지에서 자주 발생합니다.',
                    rating: 2,
                    sentiment: 'negative',
                    priority: 'high',
                    status: 'in_progress',
                    timestamp: new Date(Date.now() - 1000 * 60 * 30),
                    tags: ['chat', 'ui', 'bug', 'mobile'],
                    votes: 8,
                    comments: 3,
                    assignedTo: 'frontend-team',
                    estimatedEffort: 'medium',
                    impact: 'high',
                    deviceType: 'mobile',
                    browserInfo: 'Chrome 120.0',
                    location: 'Seoul, Korea',
                    implementationPlan: {
                        id: 'plan1',
                        feedbackId: '1',
                        status: 'in_progress',
                        estimatedHours: 16,
                        actualHours: 8,
                        assignedDeveloper: '김개발',
                        tasks: [
                            {
                                id: 'task1',
                                title: '채팅 메시지 렌더링 버그 수정',
                                description: '긴 메시지에서 발생하는 렌더링 문제를 수정합니다.',
                                status: 'in_progress',
                                priority: 'high',
                                estimatedHours: 8,
                                actualHours: 4,
                                assignedTo: '김개발',
                                dependencies: [],
                                createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
                                notes: ['CSS overflow 문제 확인됨', '텍스트 래핑 로직 수정 필요']
                            }
                        ],
                        dependencies: [],
                        milestones: [
                            {
                                id: 'milestone1',
                                title: '버그 수정 완료',
                                description: '채팅 메시지 렌더링 버그를 완전히 수정합니다.',
                                targetDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2),
                                status: 'pending',
                                tasks: ['task1']
                            }
                        ],
                        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
                        updatedAt: new Date(Date.now() - 1000 * 60 * 30)
                    }
                },
                {
                    id: '2',
                    userId: 'user2',
                    userName: '이디자이너',
                    userAvatar: '/avatars/user2.jpg',
                    type: 'feature_request',
                    category: 'UI/UX',
                    title: '다크모드 개선 요청',
                    description: '다크모드에서 일부 요소의 가독성이 떨어집니다. 색상 대비를 개선해주세요.',
                    rating: 4,
                    sentiment: 'positive',
                    priority: 'medium',
                    status: 'analyzing',
                    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
                    tags: ['dark-mode', 'ui', 'accessibility', 'design'],
                    votes: 15,
                    comments: 7,
                    estimatedEffort: 'low',
                    impact: 'medium',
                    deviceType: 'desktop',
                    browserInfo: 'Safari 17.0',
                    location: 'Tokyo, Japan',
                    implementationPlan: {
                        id: 'plan2',
                        feedbackId: '2',
                        status: 'draft',
                        estimatedHours: 8,
                        assignedDeveloper: '이디자인',
                        tasks: [
                            {
                                id: 'task2',
                                title: '다크모드 색상 대비 개선',
                                description: '다크모드에서 텍스트와 배경의 대비를 개선합니다.',
                                status: 'pending',
                                priority: 'medium',
                                estimatedHours: 8,
                                assignedTo: '이디자인',
                                dependencies: [],
                                createdAt: new Date(Date.now() - 1000 * 60 * 60 * 1),
                                notes: []
                            }
                        ],
                        dependencies: [],
                        milestones: [
                            {
                                id: 'milestone2',
                                title: '다크모드 개선 완료',
                                description: '다크모드 색상 대비를 개선하여 가독성을 향상시킵니다.',
                                targetDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5),
                                status: 'pending',
                                tasks: ['task2']
                            }
                        ],
                        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 1),
                        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 1)
                    }
                },
                {
                    id: '3',
                    userId: 'user3',
                    userName: '박개발자',
                    userAvatar: '/avatars/user3.jpg',
                    type: 'performance_issue',
                    category: 'Performance',
                    title: '페이지 로딩 속도가 느림',
                    description: '메인 페이지 로딩 시간이 너무 오래 걸립니다. 최적화가 필요합니다.',
                    rating: 1,
                    sentiment: 'very_negative',
                    priority: 'critical',
                    status: 'new',
                    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4),
                    tags: ['performance', 'loading', 'optimization'],
                    votes: 22,
                    comments: 12,
                    estimatedEffort: 'high',
                    impact: 'high',
                    deviceType: 'desktop',
                    browserInfo: 'Firefox 121.0',
                    location: 'New York, USA'
                }
            ];

            setFeedbacks(mockFeedbacks);

            // 분석 데이터
            const mockAnalytics: FeedbackAnalytics = {
                totalFeedbacks: mockFeedbacks.length,
                averageRating: 2.3,
                sentimentDistribution: {
                    very_positive: 5,
                    positive: 12,
                    neutral: 8,
                    negative: 15,
                    very_negative: 3
                },
                categoryDistribution: {
                    'UI/UX': 15,
                    'Performance': 8,
                    'Functionality': 12,
                    'Accessibility': 5
                },
                priorityDistribution: {
                    'critical': 3,
                    'high': 8,
                    'medium': 15,
                    'low': 7
                },
                statusDistribution: {
                    'new': 12,
                    'analyzing': 8,
                    'in_progress': 10,
                    'resolved': 5,
                    'closed': 3
                },
                trendData: [
                    { date: '2024-10-01', count: 5, sentiment: 3.2 },
                    { date: '2024-10-02', count: 8, sentiment: 2.8 },
                    { date: '2024-10-03', count: 12, sentiment: 2.5 },
                    { date: '2024-10-04', count: 7, sentiment: 3.1 },
                    { date: '2024-10-05', count: 15, sentiment: 2.2 }
                ],
                topIssues: mockFeedbacks.slice(0, 5),
                responseTime: {
                    average: 2.5,
                    median: 1.8,
                    p95: 5.2
                },
                implementationRate: 75,
                userSatisfaction: 4.2
            };

            setAnalytics(mockAnalytics);

        } catch (error) {
            console.error('Failed to load feedback data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    // 피드백 필터링 및 정렬
    const filteredFeedbacks = feedbacks
        .filter(feedback => {
            const typeMatch = filters.type === 'all' || feedback.type === filters.type;
            const categoryMatch = filters.category === 'all' || feedback.category === filters.category;
            const priorityMatch = filters.priority === 'all' || feedback.priority === filters.priority;
            const statusMatch = filters.status === 'all' || feedback.status === filters.status;
            const sentimentMatch = filters.sentiment === 'all' || feedback.sentiment === filters.sentiment;
            const searchMatch = searchQuery === '' ||
                feedback.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                feedback.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                feedback.userName.toLowerCase().includes(searchQuery.toLowerCase());

            return typeMatch && categoryMatch && priorityMatch && statusMatch && sentimentMatch && searchMatch;
        })
        .sort((a, b) => {
            let aValue: any, bValue: any;

            switch (sortBy) {
                case 'timestamp':
                    aValue = a.timestamp.getTime();
                    bValue = b.timestamp.getTime();
                    break;
                case 'rating':
                    aValue = a.rating;
                    bValue = b.rating;
                    break;
                case 'votes':
                    aValue = a.votes;
                    bValue = b.votes;
                    break;
                case 'priority':
                    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
                    aValue = priorityOrder[a.priority as keyof typeof priorityOrder];
                    bValue = priorityOrder[b.priority as keyof typeof priorityOrder];
                    break;
                default:
                    aValue = a.title;
                    bValue = b.title;
            }

            if (sortOrder === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });

    // 피드백 상태 변경
    const handleStatusChange = (feedbackId: string, newStatus: FeedbackItem['status']) => {
        setFeedbacks(prev => prev.map(feedback =>
            feedback.id === feedbackId
                ? { ...feedback, status: newStatus }
                : feedback
        ));
    };

    // 구현 계획 생성
    const createImplementationPlan = (feedbackId: string) => {
        const feedback = feedbacks.find(f => f.id === feedbackId);
        if (!feedback) return;

        const plan: ImplementationPlan = {
            id: `plan_${Date.now()}`,
            feedbackId,
            status: 'draft',
            estimatedHours: feedback.estimatedEffort === 'low' ? 8 : feedback.estimatedEffort === 'medium' ? 16 : 32,
            assignedDeveloper: '자동 할당',
            tasks: [
                {
                    id: `task_${Date.now()}`,
                    title: feedback.title,
                    description: feedback.description,
                    status: 'pending',
                    priority: feedback.priority,
                    estimatedHours: feedback.estimatedEffort === 'low' ? 8 : feedback.estimatedEffort === 'medium' ? 16 : 32,
                    assignedTo: '자동 할당',
                    dependencies: [],
                    createdAt: new Date(),
                    notes: []
                }
            ],
            dependencies: [],
            milestones: [
                {
                    id: `milestone_${Date.now()}`,
                    title: `${feedback.title} 구현 완료`,
                    description: feedback.description,
                    targetDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
                    status: 'pending',
                    tasks: [`task_${Date.now()}`]
                }
            ],
            createdAt: new Date(),
            updatedAt: new Date()
        };

        setFeedbacks(prev => prev.map(f =>
            f.id === feedbackId
                ? { ...f, implementationPlan: plan }
                : f
        ));
    };

    // 우선순위별 색상
    const getPriorityColor = (priority: FeedbackItem['priority']) => {
        switch (priority) {
            case 'critical': return 'error';
            case 'high': return 'warning';
            case 'medium': return 'info';
            case 'low': return 'success';
            default: return 'default';
        }
    };

    // 상태별 색상
    const getStatusColor = (status: FeedbackItem['status']) => {
        switch (status) {
            case 'new': return 'info';
            case 'analyzing': return 'warning';
            case 'in_progress': return 'primary';
            case 'resolved': return 'success';
            case 'closed': return 'default';
            case 'duplicate': return 'secondary';
            default: return 'default';
        }
    };

    // 감정별 아이콘
    const getSentimentIcon = (sentiment: FeedbackItem['sentiment']) => {
        switch (sentiment) {
            case 'very_positive': return <SentimentVerySatisfied color="success" />;
            case 'positive': return <SentimentSatisfied color="success" />;
            case 'neutral': return <SentimentNeutral color="info" />;
            case 'negative': return <SentimentDissatisfied color="warning" />;
            case 'very_negative': return <SentimentVeryDissatisfied color="error" />;
            default: return <SentimentNeutral color="info" />;
        }
    };

    // 초기 로드
    useEffect(() => {
        loadFeedbackData();
    }, [loadFeedbackData]);

    return (
        <Box sx={{ p: 3 }}>
            {/* 헤더 */}
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
                    💬 피드백 반영 시스템 (v1.3)
                </Typography>

                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={autoImplementation}
                                onChange={(e) => setAutoImplementation(e.target.checked)}
                            />
                        }
                        label="자동 구현"
                    />

                    <Button
                        variant="outlined"
                        startIcon={<Analytics />}
                        onClick={() => setShowAnalyticsDialog(true)}
                    >
                        분석 보기
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<Refresh />}
                        onClick={loadFeedbackData}
                        disabled={loading}
                    >
                        새로고침
                    </Button>
                </Box>
            </Box>

            {/* 자동 구현 상태 */}
            {autoImplementation && (
                <Alert severity="success" sx={{ mb: 3 }}>
                    <AlertTitle>자동 구현 활성화</AlertTitle>
                    시스템이 피드백을 자동으로 분석하고 구현 계획을 생성합니다.
                </Alert>
            )}

            {/* 통계 카드 */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box>
                                    <Typography color="textSecondary" gutterBottom>
                                        총 피드백
                                    </Typography>
                                    <Typography variant="h4" component="div">
                                        {analytics?.totalFeedbacks || 0}
                                    </Typography>
                                </Box>
                                <Feedback sx={{ fontSize: 40, color: 'primary.main' }} />
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
                                        구현률
                                    </Typography>
                                    <Typography variant="h4" component="div">
                                        {analytics?.implementationRate || 0}%
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
                                        사용자 만족도
                                    </Typography>
                                    <Typography variant="h4" component="div">
                                        {analytics?.userSatisfaction?.toFixed(1) || '0.0'}/5
                                    </Typography>
                                </Box>
                                <Star sx={{ fontSize: 40, color: 'warning.main' }} />
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
                                        평균 응답 시간
                                    </Typography>
                                    <Typography variant="h4" component="div">
                                        {analytics?.responseTime.average?.toFixed(1) || '0.0'}일
                                    </Typography>
                                </Box>
                                <Speed sx={{ fontSize: 40, color: 'info.main' }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* 탭 네비게이션 */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={selectedTab} onChange={(e, newValue) => setSelectedTab(newValue)}>
                    <Tab label="피드백 목록" />
                    <Tab label="구현 계획" />
                    <Tab label="진행 상황" />
                    <Tab label="완료된 작업" />
                </Tabs>
            </Box>

            {/* 피드백 목록 탭 */}
            {selectedTab === 0 && (
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            📝 피드백 목록 ({filteredFeedbacks.length}개)
                        </Typography>

                        <List>
                            {filteredFeedbacks.map((feedback) => (
                                <ListItem key={feedback.id} divider>
                                    <ListItemIcon>
                                        <Avatar src={feedback.userAvatar} sx={{ width: 40, height: 40 }}>
                                            {feedback.userName.charAt(0)}
                                        </Avatar>
                                    </ListItemIcon>

                                    <ListItemText
                                        primary={
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                <Typography variant="subtitle1">
                                                    {feedback.title}
                                                </Typography>
                                                <Chip
                                                    label={feedback.type.replace('_', ' ')}
                                                    size="small"
                                                    color="primary"
                                                    variant="outlined"
                                                />
                                                <Chip
                                                    label={feedback.priority}
                                                    size="small"
                                                    color={getPriorityColor(feedback.priority)}
                                                />
                                                <Chip
                                                    label={feedback.status}
                                                    size="small"
                                                    color={getStatusColor(feedback.status)}
                                                />
                                                {getSentimentIcon(feedback.sentiment)}
                                            </Box>
                                        }
                                        secondary={
                                            <Box>
                                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                                    {feedback.description}
                                                </Typography>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {feedback.userName} • {feedback.timestamp.toLocaleString()}
                                                    </Typography>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                        <Rating value={feedback.rating} size="small" readOnly />
                                                        <Typography variant="caption">
                                                            ({feedback.rating}/5)
                                                        </Typography>
                                                    </Box>
                                                    <Typography variant="caption">
                                                        💬 {feedback.comments} • 👍 {feedback.votes}
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ mt: 1 }}>
                                                    {feedback.tags.map((tag, index) => (
                                                        <Chip
                                                            key={index}
                                                            label={tag}
                                                            size="small"
                                                            variant="outlined"
                                                            sx={{ mr: 0.5, mb: 0.5 }}
                                                        />
                                                    ))}
                                                </Box>
                                            </Box>
                                        }
                                    />

                                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                                        <Tooltip title="상세 보기">
                                            <IconButton
                                                size="small"
                                                onClick={() => setSelectedFeedback(feedback)}
                                            >
                                                <Visibility />
                                            </IconButton>
                                        </Tooltip>

                                        <Tooltip title="구현 계획 생성">
                                            <IconButton
                                                size="small"
                                                onClick={() => createImplementationPlan(feedback.id)}
                                                disabled={!!feedback.implementationPlan}
                                            >
                                                <Rocket />
                                            </IconButton>
                                        </Tooltip>

                                        {feedback.status === 'new' && (
                                            <Tooltip title="분석 시작">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleStatusChange(feedback.id, 'analyzing')}
                                                >
                                                    <Analytics />
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

            {/* 구현 계획 탭 */}
            {selectedTab === 1 && (
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            📋 구현 계획 ({feedbacks.filter(f => f.implementationPlan).length}개)
                        </Typography>

                        <List>
                            {feedbacks.filter(f => f.implementationPlan).map((feedback) => (
                                <ListItem key={feedback.id} divider>
                                    <ListItemIcon>
                                        <Task color="primary" />
                                    </ListItemIcon>

                                    <ListItemText
                                        primary={
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                <Typography variant="subtitle1">
                                                    {feedback.title}
                                                </Typography>
                                                <Chip
                                                    label={feedback.implementationPlan?.status}
                                                    size="small"
                                                    color={feedback.implementationPlan?.status === 'completed' ? 'success' : 'primary'}
                                                />
                                                <Chip
                                                    label={`${feedback.implementationPlan?.estimatedHours}h`}
                                                    size="small"
                                                    variant="outlined"
                                                />
                                            </Box>
                                        }
                                        secondary={
                                            <Box>
                                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                                    담당자: {feedback.implementationPlan?.assignedDeveloper} •
                                                    작업 수: {feedback.implementationPlan?.tasks.length}개
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    생성: {feedback.implementationPlan?.createdAt.toLocaleString()} •
                                                    업데이트: {feedback.implementationPlan?.updatedAt.toLocaleString()}
                                                </Typography>
                                            </Box>
                                        }
                                    />

                                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                                        <Tooltip title="상세 보기">
                                            <IconButton size="small">
                                                <Visibility />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="편집">
                                            <IconButton size="small">
                                                <Edit />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                </ListItem>
                            ))}
                        </List>
                    </CardContent>
                </Card>
            )}

            {/* 진행 상황 탭 */}
            {selectedTab === 2 && (
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            🔄 진행 중인 작업
                        </Typography>

                        <Timeline>
                            {feedbacks.filter(f => f.implementationPlan && f.implementationPlan.status === 'in_progress').map((feedback) => (
                                <TimelineItem key={feedback.id}>
                                    <TimelineSeparator>
                                        <TimelineDot color="primary">
                                            <Assignment />
                                        </TimelineDot>
                                        <TimelineConnector />
                                    </TimelineSeparator>
                                    <TimelineContent>
                                        <Typography variant="h6" component="span">
                                            {feedback.title}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {feedback.description}
                                        </Typography>
                                        <Box sx={{ mt: 1 }}>
                                            <Chip
                                                label={`${feedback.implementationPlan?.actualHours || 0}/${feedback.implementationPlan?.estimatedHours}h`}
                                                size="small"
                                                color="info"
                                            />
                                            <Chip
                                                label={feedback.implementationPlan?.assignedDeveloper}
                                                size="small"
                                                variant="outlined"
                                                sx={{ ml: 1 }}
                                            />
                                        </Box>
                                    </TimelineContent>
                                </TimelineItem>
                            ))}
                        </Timeline>
                    </CardContent>
                </Card>
            )}

            {/* 완료된 작업 탭 */}
            {selectedTab === 3 && (
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            ✅ 완료된 작업
                        </Typography>

                        <List>
                            {feedbacks.filter(f => f.implementationPlan && f.implementationPlan.status === 'completed').map((feedback) => (
                                <ListItem key={feedback.id} divider>
                                    <ListItemIcon>
                                        <AssignmentTurnedIn color="success" />
                                    </ListItemIcon>

                                    <ListItemText
                                        primary={
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography variant="subtitle1">
                                                    {feedback.title}
                                                </Typography>
                                                <Chip
                                                    label="완료"
                                                    size="small"
                                                    color="success"
                                                />
                                                <Chip
                                                    label={`${feedback.implementationPlan?.actualHours}h`}
                                                    size="small"
                                                    variant="outlined"
                                                />
                                            </Box>
                                        }
                                        secondary={
                                            <Box>
                                                <Typography variant="body2" color="text.secondary">
                                                    {feedback.description}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    완료: {feedback.implementationPlan?.completedAt?.toLocaleString()} •
                                                    담당자: {feedback.implementationPlan?.assignedDeveloper}
                                                </Typography>
                                            </Box>
                                        }
                                    />

                                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                                        <Tooltip title="상세 보기">
                                            <IconButton size="small">
                                                <Visibility />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="결과 확인">
                                            <IconButton size="small">
                                                <CheckCircle />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                </ListItem>
                            ))}
                        </List>
                    </CardContent>
                </Card>
            )}
        </Box>
    );
};

export default FeedbackImplementationSystem;
