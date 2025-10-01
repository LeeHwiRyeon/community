import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Grid, Card, CardContent, Button, CircularProgress, Alert,
    Tabs, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Chip, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Select, MenuItem, FormControl, InputLabel, LinearProgress,
    List, ListItem, ListItemText, ListItemIcon, Divider, Rating
} from '@mui/material';
import {
    BugReport as BugIcon,
    Lightbulb as SuggestionIcon,
    ThumbUp as PraiseIcon,
    Help as QuestionIcon,
    Warning as ComplaintIcon,
    Assessment as StatsIcon,
    People as PeopleIcon,
    Timeline as TimelineIcon,
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon,
    Edit as EditIcon,
    Visibility as ViewIcon
} from '@mui/icons-material';

interface Feedback {
    id: string;
    userId: string;
    type: 'bug' | 'suggestion' | 'complaint' | 'praise' | 'question';
    category: string;
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    userType: string;
    device: string;
    browser: string;
    url: string;
    status: 'open' | 'in_progress' | 'resolved' | 'closed';
    priority: number;
    createdAt: string;
    updatedAt: string;
    assignedTo: string | null;
    resolution: string | null;
    tags: string[];
}

interface UserTest {
    id: string;
    userId: string;
    testType: string;
    userType: string;
    testScenario: string;
    completionRate: number;
    satisfactionScore: number;
    difficultyScore: number;
    comments: string;
    issues: string[];
    suggestions: string[];
    device: string;
    browser: string;
    testDuration: number;
    createdAt: string;
    status: string;
}

interface Stats {
    totalFeedbacks: number;
    totalBugReports: number;
    totalUserTests: number;
    feedbacksByType: Record<string, number>;
    feedbacksBySeverity: Record<string, number>;
    feedbacksByStatus: Record<string, number>;
    feedbacksByUserType: Record<string, number>;
    averageSatisfactionScore: number;
    averageCompletionRate: number;
    recentFeedbacks: Feedback[];
}

const UserTestingDashboard: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState(0);
    const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
    const [userTests, setUserTests] = useState<UserTest[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
    const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
    const [filterType, setFilterType] = useState('');
    const [filterSeverity, setFilterSeverity] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);

            // 피드백 통계 조회
            const statsResponse = await fetch('http://localhost:5000/api/user-feedback/stats/overview');
            if (!statsResponse.ok) throw new Error(`Failed to fetch stats: ${statsResponse.status}`);
            const statsData = await statsResponse.json();
            setStats(statsData.data);

            // 피드백 목록 조회
            const feedbacksResponse = await fetch('http://localhost:5000/api/user-feedback');
            if (!feedbacksResponse.ok) throw new Error(`Failed to fetch feedbacks: ${feedbacksResponse.status}`);
            const feedbacksData = await feedbacksResponse.json();
            setFeedbacks(feedbacksData.data.feedbacks);

            // 사용자 테스트 결과 조회
            const testsResponse = await fetch('http://localhost:5000/api/user-feedback/user-test/results');
            if (!testsResponse.ok) throw new Error(`Failed to fetch user tests: ${testsResponse.status}`);
            const testsData = await testsResponse.json();
            setUserTests(testsData.data.tests);

            setLoading(false);
        } catch (e: any) {
            setError(e.message);
            setLoading(false);
        }
    };

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
    };

    const handleFeedbackClick = (feedback: Feedback) => {
        setSelectedFeedback(feedback);
        setFeedbackDialogOpen(true);
    };

    const handleStatusUpdate = async (feedbackId: string, status: string) => {
        try {
            const response = await fetch(`http://localhost:5000/api/user-feedback/${feedbackId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });

            if (!response.ok) throw new Error(`Failed to update status: ${response.status}`);

            // 피드백 목록 새로고침
            await fetchData();
            setFeedbackDialogOpen(false);
        } catch (e: any) {
            console.error('Error updating status:', e.message);
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'bug': return <BugIcon />;
            case 'suggestion': return <SuggestionIcon />;
            case 'praise': return <PraiseIcon />;
            case 'question': return <QuestionIcon />;
            case 'complaint': return <ComplaintIcon />;
            default: return <QuestionIcon />;
        }
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return 'error';
            case 'high': return 'warning';
            case 'medium': return 'info';
            case 'low': return 'success';
            default: return 'default';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'open': return 'error';
            case 'in_progress': return 'warning';
            case 'resolved': return 'success';
            case 'closed': return 'default';
            default: return 'default';
        }
    };

    const filteredFeedbacks = feedbacks.filter(feedback => {
        if (filterType && feedback.type !== filterType) return false;
        if (filterSeverity && feedback.severity !== filterSeverity) return false;
        if (filterStatus && feedback.status !== filterStatus) return false;
        return true;
    });

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
            <Typography variant="h4" component="h1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <AssessmentIcon sx={{ mr: 1 }} /> 사용자 테스트 대시보드
            </Typography>

            {/* 통계 카드 */}
            {stats && (
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" color="primary">
                                    {stats.totalFeedbacks}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    총 피드백
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" color="error">
                                    {stats.totalBugReports}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    버그 리포트
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" color="success">
                                    {stats.totalUserTests}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    사용자 테스트
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" color="info">
                                    {stats.averageSatisfactionScore}/5
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    평균 만족도
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            {/* 탭 메뉴 */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={activeTab} onChange={handleTabChange}>
                    <Tab label="피드백 관리" icon={<BugIcon />} />
                    <Tab label="사용자 테스트" icon={<PeopleIcon />} />
                    <Tab label="통계 분석" icon={<StatsIcon />} />
                </Tabs>
            </Box>

            {/* 피드백 관리 탭 */}
            {activeTab === 0 && (
                <Box>
                    {/* 필터 */}
                    <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <FormControl size="small" sx={{ minWidth: 120 }}>
                            <InputLabel>타입</InputLabel>
                            <Select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                                <MenuItem value="">전체</MenuItem>
                                <MenuItem value="bug">버그</MenuItem>
                                <MenuItem value="suggestion">제안</MenuItem>
                                <MenuItem value="complaint">불만</MenuItem>
                                <MenuItem value="praise">칭찬</MenuItem>
                                <MenuItem value="question">문의</MenuItem>
                            </Select>
                        </FormControl>
                        <FormControl size="small" sx={{ minWidth: 120 }}>
                            <InputLabel>심각도</InputLabel>
                            <Select value={filterSeverity} onChange={(e) => setFilterSeverity(e.target.value)}>
                                <MenuItem value="">전체</MenuItem>
                                <MenuItem value="critical">Critical</MenuItem>
                                <MenuItem value="high">High</MenuItem>
                                <MenuItem value="medium">Medium</MenuItem>
                                <MenuItem value="low">Low</MenuItem>
                            </Select>
                        </FormControl>
                        <FormControl size="small" sx={{ minWidth: 120 }}>
                            <InputLabel>상태</InputLabel>
                            <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                                <MenuItem value="">전체</MenuItem>
                                <MenuItem value="open">Open</MenuItem>
                                <MenuItem value="in_progress">In Progress</MenuItem>
                                <MenuItem value="resolved">Resolved</MenuItem>
                                <MenuItem value="closed">Closed</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>

                    {/* 피드백 테이블 */}
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>타입</TableCell>
                                    <TableCell>제목</TableCell>
                                    <TableCell>사용자 타입</TableCell>
                                    <TableCell>심각도</TableCell>
                                    <TableCell>상태</TableCell>
                                    <TableCell>생성일</TableCell>
                                    <TableCell>액션</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredFeedbacks.map((feedback) => (
                                    <TableRow key={feedback.id} hover>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                {getTypeIcon(feedback.type)}
                                                <Typography variant="body2" sx={{ ml: 1 }}>
                                                    {feedback.type}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                                {feedback.title}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>{feedback.userType}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={feedback.severity}
                                                color={getSeverityColor(feedback.severity)}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={feedback.status}
                                                color={getStatusColor(feedback.status)}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {new Date(feedback.createdAt).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleFeedbackClick(feedback)}
                                            >
                                                <ViewIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            )}

            {/* 사용자 테스트 탭 */}
            {activeTab === 1 && (
                <Box>
                    <Grid container spacing={3}>
                        {userTests.map((test) => (
                            <Grid item xs={12} md={6} lg={4} key={test.id}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom>
                                            {test.testType} - {test.userType}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                            {test.testScenario}
                                        </Typography>

                                        <Box sx={{ mb: 2 }}>
                                            <Typography variant="body2" gutterBottom>
                                                완료율: {test.completionRate}%
                                            </Typography>
                                            <LinearProgress
                                                variant="determinate"
                                                value={test.completionRate}
                                                sx={{ mb: 1 }}
                                            />
                                        </Box>

                                        <Box sx={{ mb: 2 }}>
                                            <Typography variant="body2" gutterBottom>
                                                만족도: {test.satisfactionScore}/5
                                            </Typography>
                                            <Rating value={test.satisfactionScore} readOnly size="small" />
                                        </Box>

                                        <Box sx={{ mb: 2 }}>
                                            <Typography variant="body2" gutterBottom>
                                                난이도: {test.difficultyScore}/5
                                            </Typography>
                                            <Rating value={test.difficultyScore} readOnly size="small" />
                                        </Box>

                                        <Typography variant="body2" color="text.secondary">
                                            기기: {test.device} | 브라우저: {test.browser}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            테스트 시간: {Math.round(test.testDuration / 60)}분
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            )}

            {/* 통계 분석 탭 */}
            {activeTab === 2 && stats && (
                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    피드백 타입별 분포
                                </Typography>
                                <List>
                                    {Object.entries(stats.feedbacksByType).map(([type, count]) => (
                                        <ListItem key={type}>
                                            <ListItemIcon>{getTypeIcon(type)}</ListItemIcon>
                                            <ListItemText
                                                primary={type}
                                                secondary={`${count}개`}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    심각도별 분포
                                </Typography>
                                <List>
                                    {Object.entries(stats.feedbacksBySeverity).map(([severity, count]) => (
                                        <ListItem key={severity}>
                                            <Chip
                                                label={severity}
                                                color={getSeverityColor(severity)}
                                                size="small"
                                                sx={{ mr: 2 }}
                                            />
                                            <ListItemText secondary={`${count}개`} />
                                        </ListItem>
                                    ))}
                                </List>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    사용자 타입별 분포
                                </Typography>
                                <List>
                                    {Object.entries(stats.feedbacksByUserType).map(([userType, count]) => (
                                        <ListItem key={userType}>
                                            <ListItemText
                                                primary={userType}
                                                secondary={`${count}개`}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    상태별 분포
                                </Typography>
                                <List>
                                    {Object.entries(stats.feedbacksByStatus).map(([status, count]) => (
                                        <ListItem key={status}>
                                            <Chip
                                                label={status}
                                                color={getStatusColor(status)}
                                                size="small"
                                                sx={{ mr: 2 }}
                                            />
                                            <ListItemText secondary={`${count}개`} />
                                        </ListItem>
                                    ))}
                                </List>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            {/* 피드백 상세 다이얼로그 */}
            <Dialog
                open={feedbackDialogOpen}
                onClose={() => setFeedbackDialogOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    피드백 상세 정보
                </DialogTitle>
                <DialogContent>
                    {selectedFeedback && (
                        <Box>
                            <Typography variant="h6" gutterBottom>
                                {selectedFeedback.title}
                            </Typography>
                            <Typography variant="body1" sx={{ mb: 2 }}>
                                {selectedFeedback.description}
                            </Typography>

                            <Grid container spacing={2} sx={{ mb: 2 }}>
                                <Grid item xs={6}>
                                    <Typography variant="body2" color="text.secondary">
                                        타입: {selectedFeedback.type}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2" color="text.secondary">
                                        심각도: {selectedFeedback.severity}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2" color="text.secondary">
                                        사용자 타입: {selectedFeedback.userType}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2" color="text.secondary">
                                        기기: {selectedFeedback.device}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2" color="text.secondary">
                                        브라우저: {selectedFeedback.browser}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2" color="text.secondary">
                                        생성일: {new Date(selectedFeedback.createdAt).toLocaleString()}
                                    </Typography>
                                </Grid>
                            </Grid>

                            {selectedFeedback.steps && selectedFeedback.steps.length > 0 && (
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="h6" gutterBottom>
                                        재현 단계
                                    </Typography>
                                    <List dense>
                                        {selectedFeedback.steps.map((step, index) => (
                                            <ListItem key={index}>
                                                <ListItemText primary={`${index + 1}. ${step}`} />
                                            </ListItem>
                                        ))}
                                    </List>
                                </Box>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setFeedbackDialogOpen(false)}>
                        닫기
                    </Button>
                    {selectedFeedback && selectedFeedback.status === 'open' && (
                        <Button
                            variant="contained"
                            onClick={() => handleStatusUpdate(selectedFeedback.id, 'in_progress')}
                        >
                            진행 중으로 변경
                        </Button>
                    )}
                    {selectedFeedback && selectedFeedback.status === 'in_progress' && (
                        <Button
                            variant="contained"
                            color="success"
                            onClick={() => handleStatusUpdate(selectedFeedback.id, 'resolved')}
                        >
                            해결됨으로 변경
                        </Button>
                    )}
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default UserTestingDashboard;
