/**
 * 사용자 피드백 시스템 (v1.3)
 * 실시간 피드백 수집 및 분석 시스템
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Grid,
    Button,
    TextField,
    Rating,
    Chip,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    AlertTitle,
    LinearProgress,
    CircularProgress,
    Paper,
    Divider,
    Switch,
    FormControlLabel,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tooltip,
    Badge,
    Avatar,
    Stack,
    Tabs,
    Tab,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    RadioGroup,
    Radio,
    FormControlLabel as MuiFormControlLabel,
    Checkbox,
    Slider
} from '@mui/material';
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
    Timeline,
    BarChart,
    PieChart,
    ExpandMore,
    AttachFile,
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
    status: 'new' | 'in_progress' | 'resolved' | 'closed' | 'duplicate';
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
}

interface FeedbackFilter {
    type: string;
    category: string;
    priority: string;
    status: string;
    sentiment: string;
    dateRange: string;
    assignedTo: string;
    tags: string[];
}

// 메인 컴포넌트
const UserFeedbackSystem: React.FC = () => {
    // 상태 관리
    const [loading, setLoading] = useState(false);
    const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
    const [analytics, setAnalytics] = useState<FeedbackAnalytics | null>(null);
    const [selectedTab, setSelectedTab] = useState(0);
    const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
    const [showAnalyticsDialog, setShowAnalyticsDialog] = useState(false);
    const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null);
    const [filters, setFilters] = useState<FeedbackFilter>({
        type: 'all',
        category: 'all',
        priority: 'all',
        status: 'all',
        sentiment: 'all',
        dateRange: 'all',
        assignedTo: 'all',
        tags: []
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('timestamp');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    // 새 피드백 폼 상태
    const [newFeedback, setNewFeedback] = useState({
        type: 'general_feedback',
        category: '',
        title: '',
        description: '',
        rating: 5,
        priority: 'medium',
        tags: [] as string[],
        attachments: [] as string[]
    });

    // 데이터 로드
    const loadFeedbackData = useCallback(async () => {
        setLoading(true);
        try {
            // 실제 구현에서는 API 호출
            await new Promise(resolve => setTimeout(resolve, 1000));

            // 모의 데이터
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
                    location: 'Seoul, Korea'
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
                    status: 'new',
                    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
                    tags: ['dark-mode', 'ui', 'accessibility', 'design'],
                    votes: 15,
                    comments: 7,
                    estimatedEffort: 'low',
                    impact: 'medium',
                    deviceType: 'desktop',
                    browserInfo: 'Safari 17.0',
                    location: 'Tokyo, Japan'
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
                    'in_progress': 8,
                    'resolved': 10,
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
                }
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

    // 피드백 제출
    const handleSubmitFeedback = async () => {
        setLoading(true);
        try {
            const newFeedbackItem: FeedbackItem = {
                id: Date.now().toString(),
                userId: 'current-user',
                userName: '현재 사용자',
                type: newFeedback.type as any,
                category: newFeedback.category,
                title: newFeedback.title,
                description: newFeedback.description,
                rating: newFeedback.rating,
                sentiment: 'neutral',
                priority: newFeedback.priority as any,
                status: 'new',
                timestamp: new Date(),
                tags: newFeedback.tags,
                votes: 0,
                comments: 0,
                estimatedEffort: 'medium',
                impact: 'medium'
            };

            setFeedbacks(prev => [newFeedbackItem, ...prev]);
            setShowFeedbackDialog(false);
            setNewFeedback({
                type: 'general_feedback',
                category: '',
                title: '',
                description: '',
                rating: 5,
                priority: 'medium',
                tags: [],
                attachments: []
            });
        } catch (error) {
            console.error('Failed to submit feedback:', error);
        } finally {
            setLoading(false);
        }
    };

    // 피드백 투표
    const handleVote = (feedbackId: string) => {
        setFeedbacks(prev => prev.map(feedback =>
            feedback.id === feedbackId
                ? { ...feedback, votes: feedback.votes + 1 }
                : feedback
        ));
    };

    // 피드백 상태 변경
    const handleStatusChange = (feedbackId: string, newStatus: FeedbackItem['status']) => {
        setFeedbacks(prev => prev.map(feedback =>
            feedback.id === feedbackId
                ? { ...feedback, status: newStatus }
                : feedback
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
            case 'in_progress': return 'warning';
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
                    💬 사용자 피드백 시스템 (v1.3)
                </Typography>

                <Box sx={{ display: 'flex', gap: 2 }}>
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
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => setShowFeedbackDialog(true)}
                        color="primary"
                    >
                        피드백 작성
                    </Button>
                </Box>
            </Box>

            {/* 탭 네비게이션 */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={selectedTab} onChange={(e, newValue) => setSelectedTab(newValue)}>
                    <Tab label="전체 피드백" />
                    <Tab label="버그 리포트" />
                    <Tab label="기능 요청" />
                    <Tab label="성능 이슈" />
                    <Tab label="UI 개선" />
                </Tabs>
            </Box>

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
                                        평균 평점
                                    </Typography>
                                    <Typography variant="h4" component="div">
                                        {analytics?.averageRating.toFixed(1) || '0.0'}
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
                                        긍정적 피드백
                                    </Typography>
                                    <Typography variant="h4" component="div">
                                        {analytics ? analytics.sentimentDistribution.very_positive + analytics.sentimentDistribution.positive : 0}
                                    </Typography>
                                </Box>
                                <ThumbUp sx={{ fontSize: 40, color: 'success.main' }} />
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
                                        응답 시간
                                    </Typography>
                                    <Typography variant="h4" component="div">
                                        {analytics?.responseTime.average.toFixed(1) || '0.0'}일
                                    </Typography>
                                </Box>
                                <Speed sx={{ fontSize: 40, color: 'info.main' }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* 필터 및 검색 */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        🔍 필터 및 검색
                    </Typography>

                    <Grid container spacing={2}>
                        <Grid item xs={12} md={3}>
                            <TextField
                                fullWidth
                                placeholder="피드백 검색..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                InputProps={{
                                    startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                                }}
                            />
                        </Grid>

                        <Grid item xs={12} md={2}>
                            <FormControl fullWidth>
                                <InputLabel>타입</InputLabel>
                                <Select
                                    value={filters.type}
                                    label="타입"
                                    onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                                >
                                    <MenuItem value="all">전체</MenuItem>
                                    <MenuItem value="bug_report">버그 리포트</MenuItem>
                                    <MenuItem value="feature_request">기능 요청</MenuItem>
                                    <MenuItem value="general_feedback">일반 피드백</MenuItem>
                                    <MenuItem value="performance_issue">성능 이슈</MenuItem>
                                    <MenuItem value="ui_improvement">UI 개선</MenuItem>
                                    <MenuItem value="accessibility">접근성</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} md={2}>
                            <FormControl fullWidth>
                                <InputLabel>우선순위</InputLabel>
                                <Select
                                    value={filters.priority}
                                    label="우선순위"
                                    onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                                >
                                    <MenuItem value="all">전체</MenuItem>
                                    <MenuItem value="critical">Critical</MenuItem>
                                    <MenuItem value="high">High</MenuItem>
                                    <MenuItem value="medium">Medium</MenuItem>
                                    <MenuItem value="low">Low</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} md={2}>
                            <FormControl fullWidth>
                                <InputLabel>상태</InputLabel>
                                <Select
                                    value={filters.status}
                                    label="상태"
                                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                                >
                                    <MenuItem value="all">전체</MenuItem>
                                    <MenuItem value="new">신규</MenuItem>
                                    <MenuItem value="in_progress">진행중</MenuItem>
                                    <MenuItem value="resolved">해결됨</MenuItem>
                                    <MenuItem value="closed">종료됨</MenuItem>
                                    <MenuItem value="duplicate">중복</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} md={2}>
                            <FormControl fullWidth>
                                <InputLabel>감정</InputLabel>
                                <Select
                                    value={filters.sentiment}
                                    label="감정"
                                    onChange={(e) => setFilters(prev => ({ ...prev, sentiment: e.target.value }))}
                                >
                                    <MenuItem value="all">전체</MenuItem>
                                    <MenuItem value="very_positive">매우 긍정</MenuItem>
                                    <MenuItem value="positive">긍정</MenuItem>
                                    <MenuItem value="neutral">중립</MenuItem>
                                    <MenuItem value="negative">부정</MenuItem>
                                    <MenuItem value="very_negative">매우 부정</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} md={1}>
                            <FormControl fullWidth>
                                <InputLabel>정렬</InputLabel>
                                <Select
                                    value={sortBy}
                                    label="정렬"
                                    onChange={(e) => setSortBy(e.target.value)}
                                >
                                    <MenuItem value="timestamp">시간순</MenuItem>
                                    <MenuItem value="rating">평점순</MenuItem>
                                    <MenuItem value="votes">투표순</MenuItem>
                                    <MenuItem value="priority">우선순위순</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* 피드백 목록 */}
            <Card>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        📝 피드백 목록 ({filteredFeedbacks.length}개)
                    </Typography>

                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                            <CircularProgress />
                        </Box>
                    ) : (
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
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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

                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <Tooltip title="상세 보기">
                                            <IconButton
                                                size="small"
                                                onClick={() => setSelectedFeedback(feedback)}
                                            >
                                                <Visibility />
                                            </IconButton>
                                        </Tooltip>

                                        <Tooltip title="투표">
                                            <IconButton
                                                size="small"
                                                onClick={() => handleVote(feedback.id)}
                                            >
                                                <ThumbUp />
                                            </IconButton>
                                        </Tooltip>

                                        <Tooltip title="즐겨찾기">
                                            <IconButton size="small">
                                                <FavoriteBorder />
                                            </IconButton>
                                        </Tooltip>

                                        {feedback.status === 'new' && (
                                            <Tooltip title="진행중으로 변경">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleStatusChange(feedback.id, 'in_progress')}
                                                >
                                                    <CheckCircle />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                    </Box>
                                </ListItem>
                            ))}
                        </List>
                    )}
                </CardContent>
            </Card>

            {/* 피드백 작성 다이얼로그 */}
            <Dialog
                open={showFeedbackDialog}
                onClose={() => setShowFeedbackDialog(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>새 피드백 작성</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                                <InputLabel>타입</InputLabel>
                                <Select
                                    value={newFeedback.type}
                                    label="타입"
                                    onChange={(e) => setNewFeedback(prev => ({ ...prev, type: e.target.value }))}
                                >
                                    <MenuItem value="bug_report">버그 리포트</MenuItem>
                                    <MenuItem value="feature_request">기능 요청</MenuItem>
                                    <MenuItem value="general_feedback">일반 피드백</MenuItem>
                                    <MenuItem value="performance_issue">성능 이슈</MenuItem>
                                    <MenuItem value="ui_improvement">UI 개선</MenuItem>
                                    <MenuItem value="accessibility">접근성</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="카테고리"
                                value={newFeedback.category}
                                onChange={(e) => setNewFeedback(prev => ({ ...prev, category: e.target.value }))}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="제목"
                                value={newFeedback.title}
                                onChange={(e) => setNewFeedback(prev => ({ ...prev, title: e.target.value }))}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="설명"
                                multiline
                                rows={4}
                                value={newFeedback.description}
                                onChange={(e) => setNewFeedback(prev => ({ ...prev, description: e.target.value }))}
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" gutterBottom>
                                평점
                            </Typography>
                            <Rating
                                value={newFeedback.rating}
                                onChange={(e, newValue) => setNewFeedback(prev => ({ ...prev, rating: newValue || 5 }))}
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                                <InputLabel>우선순위</InputLabel>
                                <Select
                                    value={newFeedback.priority}
                                    label="우선순위"
                                    onChange={(e) => setNewFeedback(prev => ({ ...prev, priority: e.target.value }))}
                                >
                                    <MenuItem value="low">Low</MenuItem>
                                    <MenuItem value="medium">Medium</MenuItem>
                                    <MenuItem value="high">High</MenuItem>
                                    <MenuItem value="critical">Critical</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowFeedbackDialog(false)}>
                        취소
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleSubmitFeedback}
                        disabled={!newFeedback.title || !newFeedback.description}
                    >
                        제출
                    </Button>
                </DialogActions>
            </Dialog>

            {/* 분석 다이얼로그 */}
            <Dialog
                open={showAnalyticsDialog}
                onClose={() => setShowAnalyticsDialog(false)}
                maxWidth="lg"
                fullWidth
            >
                <DialogTitle>피드백 분석</DialogTitle>
                <DialogContent>
                    {analytics && (
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom>
                                            감정 분포
                                        </Typography>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                            {Object.entries(analytics.sentimentDistribution).map(([sentiment, count]) => (
                                                <Box key={sentiment} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    {getSentimentIcon(sentiment as any)}
                                                    <Typography variant="body2">
                                                        {sentiment.replace('_', ' ')}: {count}
                                                    </Typography>
                                                </Box>
                                            ))}
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom>
                                            카테고리 분포
                                        </Typography>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                            {Object.entries(analytics.categoryDistribution).map(([category, count]) => (
                                                <Box key={category} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Typography variant="body2">
                                                        {category}: {count}
                                                    </Typography>
                                                </Box>
                                            ))}
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowAnalyticsDialog(false)}>
                        닫기
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default UserFeedbackSystem;
