/**
 * 📊 성과 지표 대시보드 컴포넌트
 * 
 * 커뮤니티 성과 지표, KPI, ROI를 시각화하는 대시보드
 * 
 * @author AUTOAGENTS Manager
 * @version 2.0.0
 * @created 2025-01-02
 */

import React, { useState, useEffect } from 'react';
import {
    Box,
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
    CircularProgress,
    Divider
} from '@mui/material';

import {
    TrendingUp,
    TrendingDown,
    Speed,
    Security,
    People,
    AttachMoney,
    Assessment,
    Timeline,
    Refresh,
    Download,
    Warning,
    CheckCircle,
    Error,
    Info
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart as RechartsBarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

// 타입 정의
interface PerformanceMetrics {
    technical: TechnicalMetrics;
    business: BusinessMetrics;
    user: UserMetrics;
    content: ContentMetrics;
    engagement: EngagementMetrics;
    quality: QualityMetrics;
}

interface TechnicalMetrics {
    pageLoadTime: number;
    serverResponseTime: number;
    uptime: number;
    errorRate: number;
    throughput: number;
    scalability: number;
}

interface BusinessMetrics {
    revenue: number;
    cost: number;
    roi: number;
    conversionRate: number;
    customerAcquisitionCost: number;
    lifetimeValue: number;
    churnRate: number;
}

interface UserMetrics {
    totalUsers: number;
    activeUsers: number;
    newUsers: number;
    returningUsers: number;
    userGrowth: number;
    retentionRate: number;
    satisfactionScore: number;
}

interface ContentMetrics {
    totalContent: number;
    contentQuality: number;
    contentEngagement: number;
    contentGrowth: number;
    moderationEfficiency: number;
    contentDiversity: number;
}

interface EngagementMetrics {
    dailyActiveUsers: number;
    sessionDuration: number;
    pageViews: number;
    bounceRate: number;
    clickThroughRate: number;
    socialShares: number;
    comments: number;
}

interface QualityMetrics {
    codeQuality: number;
    testCoverage: number;
    securityScore: number;
    accessibilityScore: number;
    performanceScore: number;
    userExperienceScore: number;
}

interface MetricTrend {
    metric: string;
    current: number;
    previous: number;
    change: number;
    trend: 'up' | 'down' | 'stable';
    target: number;
    status: 'excellent' | 'good' | 'warning' | 'critical';
}

const PerformanceMetricsDashboard: React.FC = () => {
    const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
    const [trends, setTrends] = useState<MetricTrend[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [timeRange, setTimeRange] = useState('30d');
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('all');

    useEffect(() => {
        fetchMetrics();

        if (autoRefresh) {
            const interval = setInterval(fetchMetrics, 60000); // 1분마다 새로고침
            return () => clearInterval(interval);
        }
    }, [timeRange, autoRefresh]);

    const fetchMetrics = async () => {
        try {
            setLoading(true);
            setError(null);

            // 실제 API 호출 시뮬레이션
            const mockMetrics: PerformanceMetrics = {
                technical: {
                    pageLoadTime: 1.2,
                    serverResponseTime: 0.8,
                    uptime: 99.9,
                    errorRate: 0.1,
                    throughput: 1500,
                    scalability: 95
                },
                business: {
                    revenue: 125000,
                    cost: 85000,
                    roi: 47.1,
                    conversionRate: 8.7,
                    customerAcquisitionCost: 25.5,
                    lifetimeValue: 180.2,
                    churnRate: 5.2
                },
                user: {
                    totalUsers: 15420,
                    activeUsers: 8930,
                    newUsers: 1250,
                    returningUsers: 7680,
                    userGrowth: 12.3,
                    retentionRate: 76.3,
                    satisfactionScore: 4.6
                },
                content: {
                    totalContent: 45670,
                    contentQuality: 87.5,
                    contentEngagement: 78.9,
                    contentGrowth: 15.2,
                    moderationEfficiency: 92.1,
                    contentDiversity: 85.3
                },
                engagement: {
                    dailyActiveUsers: 8930,
                    sessionDuration: 24.5,
                    pageViews: 125000,
                    bounceRate: 23.5,
                    clickThroughRate: 12.8,
                    socialShares: 8900,
                    comments: 23400
                },
                quality: {
                    codeQuality: 94.2,
                    testCoverage: 87.5,
                    securityScore: 96.8,
                    accessibilityScore: 89.3,
                    performanceScore: 91.7,
                    userExperienceScore: 88.9
                }
            };

            const mockTrends: MetricTrend[] = [
                {
                    metric: '일간 활성 사용자',
                    current: 8930,
                    previous: 7850,
                    change: 13.8,
                    trend: 'up',
                    target: 10000,
                    status: 'good'
                },
                {
                    metric: '페이지 로딩 시간',
                    current: 1.2,
                    previous: 1.5,
                    change: -20.0,
                    trend: 'up',
                    target: 1.0,
                    status: 'good'
                },
                {
                    metric: '이탈률',
                    current: 23.5,
                    previous: 28.2,
                    change: -16.7,
                    trend: 'up',
                    target: 20.0,
                    status: 'warning'
                },
                {
                    metric: 'ROI',
                    current: 47.1,
                    previous: 42.3,
                    change: 11.3,
                    trend: 'up',
                    target: 50.0,
                    status: 'good'
                },
                {
                    metric: '사용자 만족도',
                    current: 4.6,
                    previous: 4.4,
                    change: 4.5,
                    trend: 'up',
                    target: 4.8,
                    status: 'good'
                },
                {
                    metric: '에러율',
                    current: 0.1,
                    previous: 0.2,
                    change: -50.0,
                    trend: 'up',
                    target: 0.05,
                    status: 'excellent'
                }
            ];

            // API 호출 시뮬레이션 지연
            await new Promise(resolve => setTimeout(resolve, 1000));

            setMetrics(mockMetrics);
            setTrends(mockTrends);
        } catch (err) {
            setError('성과 지표를 불러오는 중 오류가 발생했습니다.');
            console.error('Metrics fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleExportMetrics = () => {
        if (!metrics) return;

        const dataStr = JSON.stringify({ metrics, trends, timeRange }, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `performance-metrics-${timeRange}-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const formatNumber = (num: number): string => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
    };

    const formatCurrency = (amount: number): string => {
        return new Intl.NumberFormat('ko-KR', {
            style: 'currency',
            currency: 'KRW',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'excellent': return <CheckCircle color="success" />;
            case 'good': return <CheckCircle color="success" />;
            case 'warning': return <Warning color="warning" />;
            case 'critical': return <Error color="error" />;
            default: return <Info color="info" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'excellent': return 'success';
            case 'good': return 'success';
            case 'warning': return 'warning';
            case 'critical': return 'error';
            default: return 'info';
        }
    };

    const getTrendIcon = (trend: string) => {
        return trend === 'up' ? <TrendingUp color="success" /> : <TrendingDown color="error" />;
    };

    const getTrendColor = (trend: string) => {
        return trend === 'up' ? 'success' : 'error';
    };

    if (loading && !metrics) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress size={60} />
                <Typography variant="h6" sx={{ ml: 2 }}>
                    성과 지표를 불러오는 중...
                </Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Alert severity="error" sx={{ mb: 2 }}>
                {error}
                <Button onClick={fetchMetrics} sx={{ ml: 2 }}>
                    다시 시도
                </Button>
            </Alert>
        );
    }

    if (!metrics) return null;

    // 레이더 차트 데이터
    const radarData = [
        {
            subject: '성능',
            A: metrics.quality.performanceScore,
            B: 100
        },
        {
            subject: '보안',
            A: metrics.quality.securityScore,
            B: 100
        },
        {
            subject: '접근성',
            A: metrics.quality.accessibilityScore,
            B: 100
        },
        {
            subject: '코드품질',
            A: metrics.quality.codeQuality,
            B: 100
        },
        {
            subject: '사용자경험',
            A: metrics.quality.userExperienceScore,
            B: 100
        },
        {
            subject: '테스트커버리지',
            A: metrics.quality.testCoverage,
            B: 100
        }
    ];

    return (
        <Box sx={{ p: 3 }}>
            {/* 헤더 */}
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
                    📊 성과 지표 대시보드
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
                            <MenuItem value="7d">7일</MenuItem>
                            <MenuItem value="30d">30일</MenuItem>
                            <MenuItem value="90d">90일</MenuItem>
                        </Select>
                    </FormControl>

                    <Button
                        variant="outlined"
                        startIcon={<Refresh />}
                        onClick={fetchMetrics}
                        disabled={loading}
                    >
                        새로고침
                    </Button>

                    <Button
                        variant="contained"
                        startIcon={<Download />}
                        onClick={handleExportMetrics}
                        color="primary"
                    >
                        데이터 내보내기
                    </Button>
                </Box>
            </Box>

            {/* 주요 KPI 카드 */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 3 }}>
                <Box sx={{ flex: '1 1 250px', minWidth: 250 }}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box>
                                    <Typography color="textSecondary" gutterBottom>
                                        총 사용자
                                    </Typography>
                                    <Typography variant="h4" component="div">
                                        {formatNumber(metrics.user.totalUsers)}
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                        {getTrendIcon('up')}
                                        <Typography variant="body2" color="success.main" sx={{ ml: 1 }}>
                                            +{metrics.user.userGrowth}%
                                        </Typography>
                                    </Box>
                                </Box>
                                <People sx={{ fontSize: 40, color: 'primary.main' }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Box>

                <Box sx={{ flex: '1 1 250px', minWidth: 250 }}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box>
                                    <Typography color="textSecondary" gutterBottom>
                                        수익
                                    </Typography>
                                    <Typography variant="h4" component="div">
                                        {formatCurrency(metrics.business.revenue)}
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                        <Typography variant="body2" color="textSecondary">
                                            ROI: {metrics.business.roi}%
                                        </Typography>
                                    </Box>
                                </Box>
                                <AttachMoney sx={{ fontSize: 40, color: 'success.main' }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Box>

                <Box sx={{ flex: '1 1 250px', minWidth: 250 }}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box>
                                    <Typography color="textSecondary" gutterBottom>
                                        페이지 로딩 시간
                                    </Typography>
                                    <Typography variant="h4" component="div">
                                        {metrics.technical.pageLoadTime}초
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                        <Typography variant="body2" color="textSecondary">
                                            목표: 1.0초
                                        </Typography>
                                    </Box>
                                </Box>
                                <Speed sx={{ fontSize: 40, color: 'info.main' }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Box>

                <Box sx={{ flex: '1 1 250px', minWidth: 250 }}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box>
                                    <Typography color="textSecondary" gutterBottom>
                                        서버 가동률
                                    </Typography>
                                    <Typography variant="h4" component="div">
                                        {metrics.technical.uptime}%
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                        <Typography variant="body2" color="textSecondary">
                                            에러율: {metrics.technical.errorRate}%
                                        </Typography>
                                    </Box>
                                </Box>
                                <Security sx={{ fontSize: 40, color: 'warning.main' }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Box>
            </Box>

            {/* 성과 지표 트렌드 */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 3 }}>
                <Box sx={{ flex: '1 1 600px', minWidth: 600 }}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                📈 주요 지표 트렌드
                            </Typography>
                            <TableContainer component={Paper} variant="outlined">
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>지표</TableCell>
                                            <TableCell align="right">현재값</TableCell>
                                            <TableCell align="right">이전값</TableCell>
                                            <TableCell align="right">변화율</TableCell>
                                            <TableCell align="right">목표</TableCell>
                                            <TableCell align="center">상태</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {trends.map((trend, index) => (
                                            <TableRow key={index}>
                                                <TableCell>
                                                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                                        {trend.metric}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Typography variant="body2">
                                                        {typeof trend.current === 'number' && trend.current < 10
                                                            ? trend.current.toFixed(1)
                                                            : formatNumber(trend.current)}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Typography variant="body2" color="textSecondary">
                                                        {typeof trend.previous === 'number' && trend.previous < 10
                                                            ? trend.previous.toFixed(1)
                                                            : formatNumber(trend.previous)}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                                                        {getTrendIcon(trend.trend)}
                                                        <Typography
                                                            variant="body2"
                                                            color={`${getTrendColor(trend.trend)}.main`}
                                                            sx={{ ml: 1 }}
                                                        >
                                                            {trend.change > 0 ? '+' : ''}{trend.change}%
                                                        </Typography>
                                                    </Box>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Typography variant="body2" color="textSecondary">
                                                        {typeof trend.target === 'number' && trend.target < 10
                                                            ? trend.target.toFixed(1)
                                                            : formatNumber(trend.target)}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="center">
                                                    {getStatusIcon(trend.status)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </CardContent>
                    </Card>
                </Box>

                {/* 품질 지표 레이더 차트 */}
                <Box sx={{ flex: '1 1 300px', minWidth: 300 }}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                🎯 품질 지표
                            </Typography>
                            <ResponsiveContainer width="100%" height={300}>
                                <RadarChart data={radarData}>
                                    <PolarGrid />
                                    <PolarAngleAxis dataKey="subject" />
                                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                                    <Radar
                                        name="현재"
                                        dataKey="A"
                                        stroke="#8884d8"
                                        fill="#8884d8"
                                        fillOpacity={0.3}
                                    />
                                    <Radar
                                        name="목표"
                                        dataKey="B"
                                        stroke="#82ca9d"
                                        fill="#82ca9d"
                                        fillOpacity={0.1}
                                    />
                                    <RechartsTooltip />
                                </RadarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </Box>
            </Box>

            {/* 상세 지표 */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                {/* 비즈니스 지표 */}
                <Box sx={{ flex: '1 1 400px', minWidth: 400 }}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                💰 비즈니스 지표
                            </Typography>
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" color="textSecondary">
                                    수익
                                </Typography>
                                <Typography variant="h6" color="success.main">
                                    {formatCurrency(metrics.business.revenue)}
                                </Typography>
                            </Box>

                            <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" color="textSecondary">
                                    비용
                                </Typography>
                                <Typography variant="h6" color="error.main">
                                    {formatCurrency(metrics.business.cost)}
                                </Typography>
                            </Box>

                            <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" color="textSecondary">
                                    ROI
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <LinearProgress
                                        variant="determinate"
                                        value={metrics.business.roi}
                                        color="success"
                                        sx={{ flexGrow: 1, height: 8, borderRadius: 4, mr: 2 }}
                                    />
                                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                        {metrics.business.roi}%
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
                                        value={metrics.business.conversionRate * 10}
                                        color="info"
                                        sx={{ flexGrow: 1, height: 8, borderRadius: 4, mr: 2 }}
                                    />
                                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                        {metrics.business.conversionRate}%
                                    </Typography>
                                </Box>
                            </Box>

                            <Box>
                                <Typography variant="body2" color="textSecondary">
                                    고객 생애 가치
                                </Typography>
                                <Typography variant="h6">
                                    {formatCurrency(metrics.business.lifetimeValue)}
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Box>

                {/* 기술 지표 */}
                <Box sx={{ flex: '1 1 400px', minWidth: 400 }}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                ⚙️ 기술 지표
                            </Typography>
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" color="textSecondary">
                                    페이지 로딩 시간
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <LinearProgress
                                        variant="determinate"
                                        value={(5 - metrics.technical.pageLoadTime) * 20}
                                        color="success"
                                        sx={{ flexGrow: 1, height: 8, borderRadius: 4, mr: 2 }}
                                    />
                                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                        {metrics.technical.pageLoadTime}초
                                    </Typography>
                                </Box>
                            </Box>

                            <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" color="textSecondary">
                                    서버 응답 시간
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <LinearProgress
                                        variant="determinate"
                                        value={(2 - metrics.technical.serverResponseTime) * 50}
                                        color="info"
                                        sx={{ flexGrow: 1, height: 8, borderRadius: 4, mr: 2 }}
                                    />
                                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                        {metrics.technical.serverResponseTime}초
                                    </Typography>
                                </Box>
                            </Box>

                            <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" color="textSecondary">
                                    서버 가동률
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <LinearProgress
                                        variant="determinate"
                                        value={metrics.technical.uptime}
                                        color="success"
                                        sx={{ flexGrow: 1, height: 8, borderRadius: 4, mr: 2 }}
                                    />
                                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                        {metrics.technical.uptime}%
                                    </Typography>
                                </Box>
                            </Box>

                            <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" color="textSecondary">
                                    에러율
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <LinearProgress
                                        variant="determinate"
                                        value={metrics.technical.errorRate * 100}
                                        color="error"
                                        sx={{ flexGrow: 1, height: 8, borderRadius: 4, mr: 2 }}
                                    />
                                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                        {metrics.technical.errorRate}%
                                    </Typography>
                                </Box>
                            </Box>

                            <Box>
                                <Typography variant="body2" color="textSecondary">
                                    처리량
                                </Typography>
                                <Typography variant="h6">
                                    {formatNumber(metrics.technical.throughput)} req/s
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Box>
            </Box>
        </Box>
    );
};

export default PerformanceMetricsDashboard;
