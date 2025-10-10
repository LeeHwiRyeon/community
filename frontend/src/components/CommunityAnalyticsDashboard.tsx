/**
 * 📊 커뮤니티 분석 대시보드 컴포넌트
 * 
 * 사용자 행동 분석, 트렌드 분석, 성과 지표를 통합한 분석 대시보드
 * 
 * @author AUTOAGENTS Manager
 * @version 2.0.0
 * @created 2025-01-02
 */

import React, { useState, useEffect } from 'react';
import {
    Box,
    Grid,
    Card,
    CardContent,
    Typography,
    Button,
    Chip,
    LinearProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Tooltip,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Switch,
    FormControlLabel,
    Alert,
    CircularProgress
} from '@mui/material';
import {
    TrendingUp,
    TrendingDown,
    People,
    Message,
    ThumbUp,
    Visibility,
    Schedule,
    Refresh,
    Download,
    FilterList,
    Insights,
    Assessment,
    Timeline,
    BarChart,
    PieChart
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart as RechartsBarChart, Bar, PieChart as RechartsPieChart, Cell } from 'recharts';

// 타입 정의
interface AnalyticsData {
    totalUsers: number;
    activeUsers: number;
    totalPosts: number;
    totalComments: number;
    engagementRate: number;
    growthRate: number;
    topContent: ContentItem[];
    userActivity: ActivityData[];
    trends: TrendData[];
    demographics: DemographicsData;
    performance: PerformanceMetrics;
}

interface ContentItem {
    id: string;
    title: string;
    author: string;
    views: number;
    likes: number;
    comments: number;
    engagement: number;
    category: string;
    createdAt: string;
}

interface ActivityData {
    date: string;
    users: number;
    posts: number;
    comments: number;
    likes: number;
}

interface TrendData {
    period: string;
    value: number;
    change: number;
    category: string;
}

interface DemographicsData {
    ageGroups: { age: string; count: number; percentage: number }[];
    locations: { location: string; count: number; percentage: number }[];
    interests: { interest: string; count: number; percentage: number }[];
}

interface PerformanceMetrics {
    pageLoadTime: number;
    bounceRate: number;
    conversionRate: number;
    retentionRate: number;
    satisfactionScore: number;
}

const CommunityAnalyticsDashboard: React.FC = () => {
    const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [timeRange, setTimeRange] = useState('7d');
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [selectedMetric, setSelectedMetric] = useState('engagement');

    // 색상 팔레트
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

    useEffect(() => {
        fetchAnalyticsData();

        if (autoRefresh) {
            const interval = setInterval(fetchAnalyticsData, 30000); // 30초마다 새로고침
            return () => clearInterval(interval);
        }
    }, [timeRange, autoRefresh]);

    const fetchAnalyticsData = async () => {
        try {
            setLoading(true);
            setError(null);

            // 실제 API 호출 시뮬레이션
            const mockData: AnalyticsData = {
                totalUsers: 15420,
                activeUsers: 8930,
                totalPosts: 45670,
                totalComments: 234500,
                engagementRate: 78.5,
                growthRate: 12.3,
                topContent: [
                    {
                        id: '1',
                        title: '새로운 게임 업데이트 소식',
                        author: 'GameMaster',
                        views: 15420,
                        likes: 892,
                        comments: 234,
                        engagement: 95.2,
                        category: '게임',
                        createdAt: '2025-01-01'
                    },
                    {
                        id: '2',
                        title: '커뮤니티 이벤트 안내',
                        author: 'EventManager',
                        views: 12340,
                        likes: 756,
                        comments: 189,
                        engagement: 87.3,
                        category: '이벤트',
                        createdAt: '2025-01-01'
                    },
                    {
                        id: '3',
                        title: '개발자 Q&A 세션',
                        author: 'DevTeam',
                        views: 9870,
                        likes: 634,
                        comments: 156,
                        engagement: 82.1,
                        category: '개발',
                        createdAt: '2024-12-31'
                    }
                ],
                userActivity: [
                    { date: '2024-12-26', users: 1200, posts: 450, comments: 2100, likes: 3200 },
                    { date: '2024-12-27', users: 1350, posts: 520, comments: 2400, likes: 3800 },
                    { date: '2024-12-28', users: 1180, posts: 480, comments: 2200, likes: 3500 },
                    { date: '2024-12-29', users: 1420, posts: 580, comments: 2800, likes: 4200 },
                    { date: '2024-12-30', users: 1580, posts: 620, comments: 3100, likes: 4800 },
                    { date: '2024-12-31', users: 1650, posts: 680, comments: 3400, likes: 5200 },
                    { date: '2025-01-01', users: 1720, posts: 720, comments: 3600, likes: 5600 }
                ],
                trends: [
                    { period: '일간 활성 사용자', value: 8930, change: 12.3, category: '사용자' },
                    { period: '주간 게시물', value: 45670, change: 8.7, category: '콘텐츠' },
                    { period: '월간 참여율', value: 78.5, change: 5.2, category: '참여' },
                    { period: '평균 세션 시간', value: 24.5, change: -2.1, category: '시간' }
                ],
                demographics: {
                    ageGroups: [
                        { age: '18-24', count: 4200, percentage: 27.2 },
                        { age: '25-34', count: 5800, percentage: 37.6 },
                        { age: '35-44', count: 3200, percentage: 20.8 },
                        { age: '45-54', count: 1500, percentage: 9.7 },
                        { age: '55+', count: 720, percentage: 4.7 }
                    ],
                    locations: [
                        { location: '서울', count: 6200, percentage: 40.2 },
                        { location: '경기', count: 3200, percentage: 20.8 },
                        { location: '부산', count: 1800, percentage: 11.7 },
                        { location: '대구', count: 1200, percentage: 7.8 },
                        { location: '기타', count: 3020, percentage: 19.5 }
                    ],
                    interests: [
                        { interest: '게임', count: 8900, percentage: 57.7 },
                        { interest: '기술', count: 4200, percentage: 27.2 },
                        { interest: '엔터테인먼트', count: 3200, percentage: 20.8 },
                        { interest: '스포츠', count: 2100, percentage: 13.6 },
                        { interest: '뉴스', count: 1800, percentage: 11.7 }
                    ]
                },
                performance: {
                    pageLoadTime: 1.2,
                    bounceRate: 23.5,
                    conversionRate: 8.7,
                    retentionRate: 76.3,
                    satisfactionScore: 4.6
                }
            };

            // API 호출 시뮬레이션 지연
            await new Promise(resolve => setTimeout(resolve, 1000));

            setAnalyticsData(mockData);
        } catch (err) {
            setError('데이터를 불러오는 중 오류가 발생했습니다.');
            console.error('Analytics data fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleExportData = () => {
        if (!analyticsData) return;

        const dataStr = JSON.stringify(analyticsData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `community-analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const formatNumber = (num: number): string => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
    };

    const getTrendIcon = (change: number) => {
        return change >= 0 ? <TrendingUp color="success" /> : <TrendingDown color="error" />;
    };

    const getTrendColor = (change: number) => {
        return change >= 0 ? 'success' : 'error';
    };

    if (loading && !analyticsData) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress size={60} />
                <Typography variant="h6" sx={{ ml: 2 }}>
                    분석 데이터를 불러오는 중...
                </Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Alert severity="error" sx={{ mb: 2 }}>
                {error}
                <Button onClick={fetchAnalyticsData} sx={{ ml: 2 }}>
                    다시 시도
                </Button>
            </Alert>
        );
    }

    if (!analyticsData) return null;

    return (
        <Box sx={{ p: 3 }}>
            {/* 헤더 */}
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
                    📊 커뮤니티 분석 대시보드
                </Typography>

                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={autoRefresh}
                                onChange={(e) => setAutoRefresh(e.target.checked)}
                                color="primary"
                            />
                        }
                        label="자동 새로고침"
                    />

                    <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>기간</InputLabel>
                        <Select
                            value={timeRange}
                            onChange={(e) => setTimeRange(e.target.value)}
                            label="기간"
                        >
                            <MenuItem value="1d">1일</MenuItem>
                            <MenuItem value="7d">7일</MenuItem>
                            <MenuItem value="30d">30일</MenuItem>
                            <MenuItem value="90d">90일</MenuItem>
                        </Select>
                    </FormControl>

                    <Button
                        variant="outlined"
                        startIcon={<Refresh />}
                        onClick={fetchAnalyticsData}
                        disabled={loading}
                    >
                        새로고침
                    </Button>

                    <Button
                        variant="contained"
                        startIcon={<Download />}
                        onClick={handleExportData}
                        color="primary"
                    >
                        데이터 내보내기
                    </Button>
                </Box>
            </Box>

            {/* 주요 지표 카드 */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 3, mb: 3 }}>
                <Card>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box>
                                <Typography color="textSecondary" gutterBottom>
                                    총 사용자
                                </Typography>
                                <Typography variant="h4" component="div">
                                    {formatNumber(analyticsData.totalUsers)}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                    {getTrendIcon(analyticsData.growthRate)}
                                    <Typography variant="body2" color={`${getTrendColor(analyticsData.growthRate)}.main`} sx={{ ml: 1 }}>
                                        +{analyticsData.growthRate}%
                                    </Typography>
                                </Box>
                            </Box>
                            <People sx={{ fontSize: 40, color: 'primary.main' }} />
                        </Box>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box>
                                <Typography color="textSecondary" gutterBottom>
                                    활성 사용자
                                </Typography>
                                <Typography variant="h4" component="div">
                                    {formatNumber(analyticsData.activeUsers)}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                    <Typography variant="body2" color="textSecondary">
                                        {((analyticsData.activeUsers / analyticsData.totalUsers) * 100).toFixed(1)}% 활성률
                                    </Typography>
                                </Box>
                            </Box>
                            <Visibility sx={{ fontSize: 40, color: 'success.main' }} />
                        </Box>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box>
                                <Typography color="textSecondary" gutterBottom>
                                    총 게시물
                                </Typography>
                                <Typography variant="h4" component="div">
                                    {formatNumber(analyticsData.totalPosts)}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                    <Typography variant="body2" color="textSecondary">
                                        일평균 {formatNumber(Math.round(analyticsData.totalPosts / 30))}개
                                    </Typography>
                                </Box>
                            </Box>
                            <Message sx={{ fontSize: 40, color: 'info.main' }} />
                        </Box>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box>
                                <Typography color="textSecondary" gutterBottom>
                                    참여율
                                </Typography>
                                <Typography variant="h4" component="div">
                                    {analyticsData.engagementRate}%
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                    <LinearProgress
                                        variant="determinate"
                                        value={analyticsData.engagementRate}
                                        sx={{ width: 60, height: 6, borderRadius: 3 }}
                                    />
                                </Box>
                            </Box>
                            <ThumbUp sx={{ fontSize: 40, color: 'warning.main' }} />
                        </Box>
                    </CardContent>
                </Card>
            </Box>

            {/* 차트 섹션 */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                {/* 사용자 활동 트렌드 */}
                <Grid item xs={12} md={8}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                📈 사용자 활동 트렌드
                            </Typography>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={analyticsData.userActivity}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <RechartsTooltip />
                                    <Line type="monotone" dataKey="users" stroke="#8884d8" strokeWidth={2} />
                                    <Line type="monotone" dataKey="posts" stroke="#82ca9d" strokeWidth={2} />
                                    <Line type="monotone" dataKey="comments" stroke="#ffc658" strokeWidth={2} />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </Grid>

                {/* 인구통계 */}
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                👥 연령대별 분포
                            </Typography>
                            <ResponsiveContainer width="100%" height={300}>
                                <RechartsPieChart>
                                    <RechartsPie
                                        data={analyticsData.demographics.ageGroups}
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={80}
                                        dataKey="count"
                                        label={({ age, percentage }) => `${age}: ${percentage}%`}
                                    >
                                        {analyticsData.demographics.ageGroups.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </RechartsPie>
                                    <RechartsTooltip />
                                </RechartsPieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* 상세 분석 테이블 */}
            <Grid container spacing={3}>
                {/* 인기 콘텐츠 */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                🔥 인기 콘텐츠 TOP 10
                            </Typography>
                            <TableContainer component={Paper} variant="outlined">
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>제목</TableCell>
                                            <TableCell>작성자</TableCell>
                                            <TableCell>조회수</TableCell>
                                            <TableCell>참여도</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {analyticsData.topContent.map((content, index) => (
                                            <TableRow key={content.id}>
                                                <TableCell>
                                                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                                        {content.title}
                                                    </Typography>
                                                    <Chip label={content.category} size="small" color="primary" />
                                                </TableCell>
                                                <TableCell>{content.author}</TableCell>
                                                <TableCell>{formatNumber(content.views)}</TableCell>
                                                <TableCell>
                                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                        <LinearProgress
                                                            variant="determinate"
                                                            value={content.engagement}
                                                            sx={{ width: 60, height: 6, borderRadius: 3, mr: 1 }}
                                                        />
                                                        <Typography variant="body2">
                                                            {content.engagement}%
                                                        </Typography>
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </CardContent>
                    </Card>
                </Grid>

                {/* 성과 지표 */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                📊 성과 지표
                            </Typography>
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" color="textSecondary">
                                    페이지 로딩 시간
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <LinearProgress
                                        variant="determinate"
                                        value={(5 - analyticsData.performance.pageLoadTime) * 20}
                                        sx={{ flexGrow: 1, height: 8, borderRadius: 4, mr: 2 }}
                                    />
                                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                        {analyticsData.performance.pageLoadTime}초
                                    </Typography>
                                </Box>
                            </Box>

                            <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" color="textSecondary">
                                    이탈률
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <LinearProgress
                                        variant="determinate"
                                        value={analyticsData.performance.bounceRate}
                                        color="error"
                                        sx={{ flexGrow: 1, height: 8, borderRadius: 4, mr: 2 }}
                                    />
                                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                        {analyticsData.performance.bounceRate}%
                                    </Typography>
                                </Box>
                            </Box>

                            <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" color="textSecondary">
                                    전환율
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <LinearProgress
                                        variant="determinate"
                                        value={analyticsData.performance.conversionRate * 10}
                                        color="success"
                                        sx={{ flexGrow: 1, height: 8, borderRadius: 4, mr: 2 }}
                                    />
                                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                        {analyticsData.performance.conversionRate}%
                                    </Typography>
                                </Box>
                            </Box>

                            <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" color="textSecondary">
                                    재방문율
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <LinearProgress
                                        variant="determinate"
                                        value={analyticsData.performance.retentionRate}
                                        color="info"
                                        sx={{ flexGrow: 1, height: 8, borderRadius: 4, mr: 2 }}
                                    />
                                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                        {analyticsData.performance.retentionRate}%
                                    </Typography>
                                </Box>
                            </Box>

                            <Box>
                                <Typography variant="body2" color="textSecondary">
                                    만족도 점수
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <LinearProgress
                                        variant="determinate"
                                        value={analyticsData.performance.satisfactionScore * 20}
                                        color="warning"
                                        sx={{ flexGrow: 1, height: 8, borderRadius: 4, mr: 2 }}
                                    />
                                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                        {analyticsData.performance.satisfactionScore}/5.0
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default CommunityAnalyticsDashboard;
