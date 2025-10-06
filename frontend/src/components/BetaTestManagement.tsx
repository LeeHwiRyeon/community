/**
 * 베타 테스트 및 성능 모니터링 시스템 (v1.3)
 * 사용자 피드백 수집 및 성능 추적 시스템
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
    Badge
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
    PieChart
} from '@mui/icons-material';

// 타입 정의
interface BetaTestUser {
    id: string;
    name: string;
    email: string;
    role: 'developer' | 'designer' | 'tester' | 'end_user';
    joinDate: Date;
    status: 'active' | 'inactive' | 'pending';
    feedbackCount: number;
    bugReports: number;
    featureRequests: number;
}

interface UserFeedback {
    id: string;
    userId: string;
    userName: string;
    type: 'bug_report' | 'feature_request' | 'general_feedback' | 'performance_issue';
    category: string;
    title: string;
    description: string;
    rating: number;
    priority: 'low' | 'medium' | 'high' | 'critical';
    status: 'new' | 'in_progress' | 'resolved' | 'closed';
    timestamp: Date;
    attachments?: string[];
    tags: string[];
    votes: number;
    assignedTo?: string;
    resolution?: string;
}

interface PerformanceMetrics {
    pageLoadTime: number;
    apiResponseTime: number;
    memoryUsage: number;
    cpuUsage: number;
    networkLatency: number;
    errorRate: number;
    userSatisfaction: number;
    uptime: number;
    timestamp: Date;
}

interface TestScenario {
    id: string;
    name: string;
    description: string;
    steps: string[];
    expectedResult: string;
    status: 'pending' | 'in_progress' | 'passed' | 'failed';
    assignedTo: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    createdAt: Date;
    completedAt?: Date;
}

// 메인 컴포넌트
const BetaTestManagement: React.FC = () => {
    // 상태 관리
    const [loading, setLoading] = useState(false);
    const [betaUsers, setBetaUsers] = useState<BetaTestUser[]>([]);
    const [feedbacks, setFeedbacks] = useState<UserFeedback[]>([]);
    const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics[]>([]);
    const [testScenarios, setTestScenarios] = useState<TestScenario[]>([]);

    const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
    const [showUserDialog, setShowUserDialog] = useState(false);
    const [selectedFeedback, setSelectedFeedback] = useState<UserFeedback | null>(null);
    const [filterType, setFilterType] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<string>('all');

    // 데이터 로드
    const loadBetaTestData = useCallback(async () => {
        setLoading(true);
        try {
            // 실제 구현에서는 API 호출
            await new Promise(resolve => setTimeout(resolve, 1000));

            // 모의 데이터
            setBetaUsers([
                {
                    id: '1',
                    name: '김개발',
                    email: 'dev@example.com',
                    role: 'developer',
                    joinDate: new Date('2024-09-01'),
                    status: 'active',
                    feedbackCount: 15,
                    bugReports: 3,
                    featureRequests: 8
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
                    featureRequests: 12
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
                    featureRequests: 5
                }
            ]);

            setFeedbacks([
                {
                    id: '1',
                    userId: '1',
                    userName: '김개발',
                    type: 'bug_report',
                    category: 'UI/UX',
                    title: '채팅 메시지가 깨져서 표시됨',
                    description: '특정 상황에서 채팅 메시지가 깨져서 표시되는 문제가 발생합니다.',
                    rating: 2,
                    priority: 'high',
                    status: 'in_progress',
                    timestamp: new Date(Date.now() - 1000 * 60 * 30),
                    tags: ['chat', 'ui', 'bug'],
                    votes: 5,
                    assignedTo: 'frontend-team'
                },
                {
                    id: '2',
                    userId: '2',
                    userName: '이디자인',
                    type: 'feature_request',
                    category: 'UI/UX',
                    title: '다크모드 개선 요청',
                    description: '다크모드에서 일부 요소의 가독성이 떨어집니다.',
                    rating: 4,
                    priority: 'medium',
                    status: 'new',
                    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
                    tags: ['dark-mode', 'ui', 'accessibility'],
                    votes: 12
                }
            ]);

            setPerformanceMetrics([
                {
                    pageLoadTime: 1.2,
                    apiResponseTime: 0.8,
                    memoryUsage: 245,
                    cpuUsage: 15,
                    networkLatency: 45,
                    errorRate: 0.1,
                    userSatisfaction: 4.2,
                    uptime: 99.8,
                    timestamp: new Date()
                }
            ]);

            setTestScenarios([
                {
                    id: '1',
                    name: '로그인 플로우 테스트',
                    description: '사용자 로그인 및 인증 프로세스 테스트',
                    steps: [
                        '로그인 페이지 접속',
                        '이메일/비밀번호 입력',
                        '로그인 버튼 클릭',
                        '대시보드 페이지 이동 확인'
                    ],
                    expectedResult: '성공적으로 로그인되어 대시보드가 표시됨',
                    status: 'passed',
                    assignedTo: '박테스터',
                    priority: 'high',
                    createdAt: new Date('2024-10-01'),
                    completedAt: new Date('2024-10-02')
                }
            ]);

        } catch (error) {
            console.error('Failed to load beta test data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    // 피드백 필터링
    const filteredFeedbacks = feedbacks.filter(feedback => {
        const typeMatch = filterType === 'all' || feedback.type === filterType;
        const statusMatch = filterStatus === 'all' || feedback.status === filterStatus;
        return typeMatch && statusMatch;
    });

    // 피드백 상태 변경
    const handleFeedbackStatusChange = (feedbackId: string, newStatus: UserFeedback['status']) => {
        setFeedbacks(prev => prev.map(feedback =>
            feedback.id === feedbackId
                ? { ...feedback, status: newStatus }
                : feedback
        ));
    };

    // 피드백 투표
    const handleFeedbackVote = (feedbackId: string) => {
        setFeedbacks(prev => prev.map(feedback =>
            feedback.id === feedbackId
                ? { ...feedback, votes: feedback.votes + 1 }
                : feedback
        ));
    };

    // 우선순위별 색상
    const getPriorityColor = (priority: UserFeedback['priority']) => {
        switch (priority) {
            case 'critical': return 'error';
            case 'high': return 'warning';
            case 'medium': return 'info';
            case 'low': return 'success';
            default: return 'default';
        }
    };

    // 상태별 색상
    const getStatusColor = (status: UserFeedback['status']) => {
        switch (status) {
            case 'new': return 'info';
            case 'in_progress': return 'warning';
            case 'resolved': return 'success';
            case 'closed': return 'default';
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
                    🧪 베타 테스트 관리 시스템 (v1.3)
                </Typography>

                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        variant="outlined"
                        startIcon={<Refresh />}
                        onClick={loadBetaTestData}
                        disabled={loading}
                    >
                        새로고침
                    </Button>

                    <Button
                        variant="contained"
                        startIcon={<Feedback />}
                        onClick={() => setShowFeedbackDialog(true)}
                        color="primary"
                    >
                        피드백 추가
                    </Button>
                </Box>
            </Box>

            {/* 통계 카드 */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box>
                                    <Typography color="textSecondary" gutterBottom>
                                        베타 테스터
                                    </Typography>
                                    <Typography variant="h4" component="div">
                                        {betaUsers.length}
                                    </Typography>
                                </Box>
                                <Assessment sx={{ fontSize: 40, color: 'primary.main' }} />
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
                                        총 피드백
                                    </Typography>
                                    <Typography variant="h4" component="div">
                                        {feedbacks.length}
                                    </Typography>
                                </Box>
                                <Feedback sx={{ fontSize: 40, color: 'info.main' }} />
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
                                        버그 리포트
                                    </Typography>
                                    <Typography variant="h4" component="div">
                                        {feedbacks.filter(f => f.type === 'bug_report').length}
                                    </Typography>
                                </Box>
                                <BugReport sx={{ fontSize: 40, color: 'error.main' }} />
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
                                        기능 요청
                                    </Typography>
                                    <Typography variant="h4" component="div">
                                        {feedbacks.filter(f => f.type === 'feature_request').length}
                                    </Typography>
                                </Box>
                                <Lightbulb sx={{ fontSize: 40, color: 'warning.main' }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* 성능 메트릭 */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        📊 실시간 성능 메트릭
                    </Typography>

                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" gutterBottom>
                                페이지 로딩 시간
                            </Typography>
                            <LinearProgress
                                variant="determinate"
                                value={(performanceMetrics[0]?.pageLoadTime || 0) * 50}
                                sx={{ mb: 1 }}
                            />
                            <Typography variant="body2" color="text.secondary">
                                {performanceMetrics[0]?.pageLoadTime || 0}초
                            </Typography>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" gutterBottom>
                                API 응답 시간
                            </Typography>
                            <LinearProgress
                                variant="determinate"
                                value={(performanceMetrics[0]?.apiResponseTime || 0) * 100}
                                sx={{ mb: 1 }}
                            />
                            <Typography variant="body2" color="text.secondary">
                                {performanceMetrics[0]?.apiResponseTime || 0}초
                            </Typography>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" gutterBottom>
                                메모리 사용량
                            </Typography>
                            <LinearProgress
                                variant="determinate"
                                value={(performanceMetrics[0]?.memoryUsage || 0) / 5}
                                sx={{ mb: 1 }}
                            />
                            <Typography variant="body2" color="text.secondary">
                                {performanceMetrics[0]?.memoryUsage || 0}MB
                            </Typography>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" gutterBottom>
                                사용자 만족도
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Rating
                                    value={performanceMetrics[0]?.userSatisfaction || 0}
                                    readOnly
                                    precision={0.1}
                                />
                                <Typography variant="body2" color="text.secondary">
                                    {performanceMetrics[0]?.userSatisfaction || 0}/5
                                </Typography>
                            </Box>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* 피드백 필터 */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        🔍 피드백 필터
                    </Typography>

                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                                <InputLabel>타입</InputLabel>
                                <Select
                                    value={filterType}
                                    label="타입"
                                    onChange={(e) => setFilterType(e.target.value)}
                                >
                                    <MenuItem value="all">전체</MenuItem>
                                    <MenuItem value="bug_report">버그 리포트</MenuItem>
                                    <MenuItem value="feature_request">기능 요청</MenuItem>
                                    <MenuItem value="general_feedback">일반 피드백</MenuItem>
                                    <MenuItem value="performance_issue">성능 이슈</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                                <InputLabel>상태</InputLabel>
                                <Select
                                    value={filterStatus}
                                    label="상태"
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                >
                                    <MenuItem value="all">전체</MenuItem>
                                    <MenuItem value="new">신규</MenuItem>
                                    <MenuItem value="in_progress">진행중</MenuItem>
                                    <MenuItem value="resolved">해결됨</MenuItem>
                                    <MenuItem value="closed">종료됨</MenuItem>
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
                        💬 사용자 피드백
                    </Typography>

                    <List>
                        {filteredFeedbacks.map((feedback) => (
                            <ListItem key={feedback.id} divider>
                                <ListItemIcon>
                                    {feedback.type === 'bug_report' && <BugReport color="error" />}
                                    {feedback.type === 'feature_request' && <Lightbulb color="warning" />}
                                    {feedback.type === 'general_feedback' && <Feedback color="info" />}
                                    {feedback.type === 'performance_issue' && <Speed color="error" />}
                                </ListItemIcon>

                                <ListItemText
                                    primary={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                            <Typography variant="subtitle1">
                                                {feedback.title}
                                            </Typography>
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
                                            <Chip
                                                label={`${feedback.votes} votes`}
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
                                                {feedback.userName} • {feedback.timestamp.toLocaleString()} • {feedback.category}
                                            </Typography>
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
                                            onClick={() => handleFeedbackVote(feedback.id)}
                                        >
                                            <ThumbUp />
                                        </IconButton>
                                    </Tooltip>

                                    {feedback.status === 'new' && (
                                        <Tooltip title="진행중으로 변경">
                                            <IconButton
                                                size="small"
                                                onClick={() => handleFeedbackStatusChange(feedback.id, 'in_progress')}
                                            >
                                                <CheckCircle />
                                            </IconButton>
                                        </Tooltip>
                                    )}
                                </Box>
                            </ListItem>
                        ))}
                    </List>
                </CardContent>
            </Card>

            {/* 피드백 상세 다이얼로그 */}
            <Dialog
                open={!!selectedFeedback}
                onClose={() => setSelectedFeedback(null)}
                maxWidth="md"
                fullWidth
            >
                {selectedFeedback && (
                    <>
                        <DialogTitle>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {selectedFeedback.type === 'bug_report' && <BugReport color="error" />}
                                {selectedFeedback.type === 'feature_request' && <Lightbulb color="warning" />}
                                {selectedFeedback.type === 'general_feedback' && <Feedback color="info" />}
                                {selectedFeedback.type === 'performance_issue' && <Speed color="error" />}
                                {selectedFeedback.title}
                            </Box>
                        </DialogTitle>
                        <DialogContent>
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="subtitle2">작성자</Typography>
                                    <Typography variant="body2">{selectedFeedback.userName}</Typography>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="subtitle2">카테고리</Typography>
                                    <Typography variant="body2">{selectedFeedback.category}</Typography>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="subtitle2">우선순위</Typography>
                                    <Chip
                                        label={selectedFeedback.priority}
                                        color={getPriorityColor(selectedFeedback.priority)}
                                        size="small"
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="subtitle2">상태</Typography>
                                    <Chip
                                        label={selectedFeedback.status}
                                        color={getStatusColor(selectedFeedback.status)}
                                        size="small"
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2">설명</Typography>
                                    <Typography variant="body2">{selectedFeedback.description}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2">평점</Typography>
                                    <Rating value={selectedFeedback.rating} readOnly />
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2">태그</Typography>
                                    <Box sx={{ mt: 1 }}>
                                        {selectedFeedback.tags.map((tag, index) => (
                                            <Chip
                                                key={index}
                                                label={tag}
                                                size="small"
                                                variant="outlined"
                                                sx={{ mr: 0.5, mb: 0.5 }}
                                            />
                                        ))}
                                    </Box>
                                </Grid>
                            </Grid>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setSelectedFeedback(null)}>
                                닫기
                            </Button>
                            <Button
                                variant="contained"
                                onClick={() => handleFeedbackVote(selectedFeedback.id)}
                            >
                                투표 ({selectedFeedback.votes})
                            </Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>
        </Box>
    );
};

export default BetaTestManagement;
