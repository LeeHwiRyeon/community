/**
 * 🤖 AUTOAGENTS 컨텐츠 대시보드
 * 
 * AI 기반 컨텐츠 분석, 생성, 개인화 추천을 관리하는
 * 통합 대시보드 컴포넌트
 * 
 * @author AUTOAGENTS Manager
 * @version 3.0.0
 * @created 2025-10-02
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Box,
    Container,
    Typography,
        Card,
    CardContent,
    CardHeader,
    Button,
    ButtonGroup,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Chip,
    LinearProgress,
    CircularProgress,
    Alert,
    AlertTitle,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Tabs,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Tooltip,
    IconButton,
    Badge,
    Divider,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Switch,
    FormControlLabel
} from '@mui/material';
import {
    Analytics as AnalyticsIcon,
    AutoFixHigh as AutoFixIcon,
    Psychology as PsychologyIcon,
    TrendingUp as TrendingIcon,
    SmartToy as SmartToyIcon,
    Assessment as AssessmentIcon,
    Recommend as RecommendIcon,
    Speed as SpeedIcon,
    Security as SecurityIcon,
    Refresh as RefreshIcon,
    Settings as SettingsIcon,
    ExpandMore as ExpandMoreIcon,
    CheckCircle as CheckCircleIcon,
    Warning as WarningIcon,
    Error as ErrorIcon,
    Info as InfoIcon,
    ThumbUp as ThumbUpIcon,
    ThumbDown as ThumbDownIcon,
    Visibility as VisibilityIcon,
    Comment as CommentIcon,
    Share as ShareIcon,
    Star as StarIcon,
    Timeline as TimelineIcon,
    Dashboard as DashboardIcon,
    AutoAwesome as AutoAwesomeIcon
} from '@mui/icons-material';
import { styled } from '@mui/system';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';

// 스타일드 컴포넌트
const StyledCard = styled(Card)(({ theme }) => ({
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
    '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: (theme.shadows as any)?.[8] || '0px 8px 16px rgba(0,0,0,0.1)',
    },
}));

const MetricCard = styled(Card)(({ theme }) => ({
    background: `linear-gradient(135deg, ${theme.palette.primary.main}15, ${theme.palette.secondary.main}15)`,
    border: `1px solid ${theme.palette.primary.main}30`,
    '&:hover': {
        background: `linear-gradient(135deg, ${theme.palette.primary.main}25, ${theme.palette.secondary.main}25)`,
    },
}));

const StatusChip = styled(Chip)<{ status: string }>(({ theme, status }) => ({
    backgroundColor:
        status === 'excellent' ? theme.palette.success.main :
            status === 'good' ? theme.palette.info.main :
                status === 'fair' ? theme.palette.warning.main :
                    theme.palette.error.main,
    color: theme.palette.getContrastText(
        status === 'excellent' ? theme.palette.success.main :
            status === 'good' ? theme.palette.info.main :
                status === 'fair' ? theme.palette.warning.main :
                    theme.palette.error.main
    ),
    fontWeight: 'bold',
}));

// 인터페이스 정의
interface ContentAnalysis {
    id: string;
    timestamp: string;
    content_id: string;
    sentiment: {
        overall_sentiment: string;
        sentiment_score: number;
        confidence: number;
        emotions: Record<string, number>;
    };
    topics: {
        primary_topic: string;
        topic_scores: Record<string, number>;
        confidence: number;
    };
    quality: {
        overall_score: number;
        grade: string;
        metrics: Record<string, number>;
    };
    trend_prediction: {
        trend_score: number;
        viral_potential: number;
        predicted_engagement: Record<string, number>;
    };
    processing_time: number;
}

interface SystemMetrics {
    totalAnalyzed: number;
    totalGenerated: number;
    averageQualityScore: number;
    averageProcessingTime: number;
    successRate: number;
    systemHealth: string;
}

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`dashboard-tabpanel-${index}`}
            aria-labelledby={`dashboard-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
        </div>
    );
}

const AutoAgentsContentDashboard: React.FC = () => {
    // 상태 관리
    const [currentTab, setCurrentTab] = useState(0);
    const [loading, setLoading] = useState(false);
    const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>({
        totalAnalyzed: 1247,
        totalGenerated: 89,
        averageQualityScore: 0.87,
        averageProcessingTime: 1250,
        successRate: 0.94,
        systemHealth: 'excellent'
    });

    const [recentAnalyses, setRecentAnalyses] = useState<ContentAnalysis[]>([]);
    const [contentInput, setContentInput] = useState({ title: '', content: '' });
    const [analysisResult, setAnalysisResult] = useState<ContentAnalysis | null>(null);
    const [generationPrompt, setGenerationPrompt] = useState('');
    const [generationResult, setGenerationResult] = useState<any>(null);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [settingsOpen, setSettingsOpen] = useState(false);

    // 차트 데이터
    const performanceData = useMemo(() => [
        { time: '00:00', analysis: 45, generation: 12, quality: 0.85 },
        { time: '04:00', analysis: 32, generation: 8, quality: 0.88 },
        { time: '08:00', analysis: 78, generation: 23, quality: 0.91 },
        { time: '12:00', analysis: 156, generation: 45, quality: 0.87 },
        { time: '16:00', analysis: 134, generation: 38, quality: 0.89 },
        { time: '20:00', analysis: 98, generation: 29, quality: 0.86 },
    ], []);

    const sentimentDistribution = useMemo(() => [
        { name: '긍정적', value: 65, color: '#4CAF50' },
        { name: '중립적', value: 28, color: '#FF9800' },
        { name: '부정적', value: 7, color: '#F44336' },
    ], []);

    const topicDistribution = useMemo(() => [
        { topic: 'AI/기술', count: 234, percentage: 35 },
        { topic: '게임', count: 189, percentage: 28 },
        { topic: '스트리밍', count: 145, percentage: 22 },
        { topic: '커뮤니티', count: 98, percentage: 15 },
    ], []);

    // API 호출 함수들
    const analyzeContent = useCallback(async () => {
        if (!contentInput.title || !contentInput.content) {
            alert('제목과 내용을 모두 입력해주세요.');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('/api/autoagents-content/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: contentInput })
            });

            const result = await response.json();
            if (result.success) {
                setAnalysisResult(result.data);
                setRecentAnalyses(prev => [result.data, ...prev.slice(0, 9)]);
            }
        } catch (error) {
            console.error('분석 오류:', error);
        } finally {
            setLoading(false);
        }
    }, [contentInput]);

    const generateContent = useCallback(async () => {
        if (!generationPrompt) {
            alert('생성 프롬프트를 입력해주세요.');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('/api/autoagents-content/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: generationPrompt,
                    options: { type: 'article', quality: 'high' }
                })
            });

            const result = await response.json();
            if (result.success) {
                setGenerationResult(result.data);
            }
        } catch (error) {
            console.error('생성 오류:', error);
        } finally {
            setLoading(false);
        }
    }, [generationPrompt]);

    const refreshSystemStatus = useCallback(async () => {
        try {
            const response = await fetch('/api/autoagents-content/status');
            const result = await response.json();
            if (result.success) {
                setSystemMetrics(result.data.performance.metrics);
            }
        } catch (error) {
            console.error('상태 조회 오류:', error);
        }
    }, []);

    // 자동 새로고침
    useEffect(() => {
        if (autoRefresh) {
            const interval = setInterval(refreshSystemStatus, 30000); // 30초마다
            return () => clearInterval(interval);
        }
    }, [autoRefresh, refreshSystemStatus]);

    // 초기 데이터 로드
    useEffect(() => {
        refreshSystemStatus();
    }, [refreshSystemStatus]);

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            {/* 헤더 */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box>
                    <Typography variant="h3" component="h1" gutterBottom sx={{
                        fontWeight: 700,
                        background: 'linear-gradient(45deg, #2196F3, #21CBF3)',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>
                        🤖 AUTOAGENTS 컨텐츠 대시보드
                    </Typography>
                    <Typography variant="h6" color="text.secondary">
                        AI 기반 지능형 컨텐츠 관리 시스템
                    </Typography>
                </Box>
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
                    <IconButton onClick={refreshSystemStatus} color="primary">
                        <RefreshIcon />
                    </IconButton>
                    <IconButton onClick={() => setSettingsOpen(true)} color="primary">
                        <SettingsIcon />
                    </IconButton>
                </Box>
            </Box>

            {/* 시스템 상태 카드 */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
                <Box sx={{ flex: '1 1 200px', minWidth: 200 }}>
                    <MetricCard>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <AnalyticsIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                            <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                                {systemMetrics.totalAnalyzed.toLocaleString()}
                            </Typography>
                            <Typography color="text.secondary">
                                총 분석 건수
                            </Typography>
                        </CardContent>
                    </MetricCard>
                </Box>

                <Box sx={{ flex: '1 1 200px', minWidth: 200 }}>
                    <MetricCard>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <AutoAwesomeIcon sx={{ fontSize: 40, color: 'secondary.main', mb: 1 }} />
                            <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                                {systemMetrics.totalGenerated}
                            </Typography>
                            <Typography color="text.secondary">
                                생성된 컨텐츠
                            </Typography>
                        </CardContent>
                    </MetricCard>
                </Box>

                <Box sx={{ flex: '1 1 200px', minWidth: 200 }}>
                    <MetricCard>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <StarIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                            <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                                {(systemMetrics.averageQualityScore * 100).toFixed(1)}%
                            </Typography>
                            <Typography color="text.secondary">
                                평균 품질 점수
                            </Typography>
                        </CardContent>
                    </MetricCard>
                </Box>

                <Box sx={{ flex: '1 1 200px', minWidth: 200 }}>
                    <MetricCard>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <SpeedIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
                            <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                                {systemMetrics.averageProcessingTime}ms
                            </Typography>
                            <Typography color="text.secondary">
                                평균 처리 시간
                            </Typography>
                        </CardContent>
                    </MetricCard>
                </Box>

                <Box sx={{ flex: '1 1 200px', minWidth: 200 }}>
                    <MetricCard>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <CheckCircleIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                            <StatusChip
                                status={systemMetrics.systemHealth}
                                label={systemMetrics.systemHealth.toUpperCase()}
                                size="small"
                                sx={{ mb: 1 }}
                            />
                            <Typography color="text.secondary">
                                시스템 상태
                            </Typography>
                        </CardContent>
                    </MetricCard>
                </Box>
            </Box>

            {/* 메인 탭 */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)}>
                    <Tab icon={<DashboardIcon />} label="대시보드" />
                    <Tab icon={<AnalyticsIcon />} label="컨텐츠 분석" />
                    <Tab icon={<AutoFixIcon />} label="컨텐츠 생성" />
                    <Tab icon={<RecommendIcon />} label="개인화 추천" />
                    <Tab icon={<TrendingIcon />} label="트렌드 분석" />
                    <Tab icon={<AssessmentIcon />} label="성능 모니터링" />
                </Tabs>
            </Box>

            {/* 대시보드 탭 */}
            <TabPanel value={currentTab} index={0}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                    {/* 실시간 성능 차트 */}
                    <Box sx={{ flex: '1 1 600px', minWidth: 600 }}>
                        <StyledCard>
                            <CardHeader
                                title="실시간 성능 모니터링"
                                subheader="지난 24시간 동안의 시스템 활동"
                                action={
                                    <Chip
                                        icon={<TimelineIcon />}
                                        label="실시간"
                                        color="primary"
                                        variant="outlined"
                                    />
                                }
                            />
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={performanceData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="time" />
                                        <YAxis />
                                        <RechartsTooltip />
                                        <Legend />
                                        <Line
                                            type="monotone"
                                            dataKey="analysis"
                                            stroke="#2196F3"
                                            strokeWidth={2}
                                            name="분석 건수"
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="generation"
                                            stroke="#FF9800"
                                            strokeWidth={2}
                                            name="생성 건수"
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </StyledCard>
                    </Box>

                    {/* 감정 분포 */}
                    <Box sx={{ flex: '1 1 300px', minWidth: 300 }}>
                        <StyledCard>
                            <CardHeader title="감정 분석 분포" />
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={sentimentDistribution}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={100}
                                            dataKey="value"
                                        >
                                            {sentimentDistribution.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </StyledCard>
                    </Box>

                    {/* 토픽 분포 */}
                    <Box sx={{ flex: '1 1 100%', minWidth: 300 }}>
                        <StyledCard>
                            <CardHeader title="인기 토픽 분석" />
                            <CardContent>
                                <ResponsiveContainer width="100%" height={250}>
                                    <BarChart data={topicDistribution}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="topic" />
                                        <YAxis />
                                        <RechartsTooltip />
                                        <Bar dataKey="count" fill="#4CAF50" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </StyledCard>
                    </Box>
                </Box>
            </TabPanel>

            {/* 컨텐츠 분석 탭 */}
            <TabPanel value={currentTab} index={1}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                    <Box sx={{ flex: '1 1 400px', minWidth: 400 }}>
                        <StyledCard>
                            <CardHeader title="컨텐츠 분석" />
                            <CardContent>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <TextField
                                        label="제목"
                                        value={contentInput.title}
                                        onChange={(e) => setContentInput(prev => ({ ...prev, title: e.target.value }))}
                                        fullWidth
                                    />
                                    <TextField
                                        label="내용"
                                        value={contentInput.content}
                                        onChange={(e) => setContentInput(prev => ({ ...prev, content: e.target.value }))}
                                        multiline
                                        rows={6}
                                        fullWidth
                                    />
                                    <Button
                                        variant="contained"
                                        onClick={analyzeContent}
                                        disabled={loading}
                                        startIcon={loading ? <CircularProgress size={20} /> : <AnalyticsIcon />}
                                    >
                                        {loading ? '분석 중...' : 'AI 분석 시작'}
                                    </Button>
                                </Box>
                            </CardContent>
                        </StyledCard>
                    </Box>

                    <Box sx={{ flex: '1 1 400px', minWidth: 400 }}>
                        {analysisResult && (
                            <StyledCard>
                                <CardHeader title="분석 결과" />
                                <CardContent>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                        {/* 감정 분석 */}
                                        <Box>
                                            <Typography variant="subtitle2" gutterBottom>
                                                감정 분석
                                            </Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Chip
                                                    label={analysisResult.sentiment.overall_sentiment}
                                                    color={
                                                        analysisResult.sentiment.overall_sentiment === 'positive' ? 'success' :
                                                            analysisResult.sentiment.overall_sentiment === 'negative' ? 'error' : 'default'
                                                    }
                                                />
                                                <Typography variant="body2">
                                                    점수: {(analysisResult.sentiment.sentiment_score * 100).toFixed(1)}%
                                                </Typography>
                                            </Box>
                                        </Box>

                                        {/* 품질 평가 */}
                                        <Box>
                                            <Typography variant="subtitle2" gutterBottom>
                                                품질 평가
                                            </Typography>
                                            <LinearProgress
                                                variant="determinate"
                                                value={analysisResult.quality.overall_score * 100}
                                                sx={{ mb: 1 }}
                                            />
                                            <Typography variant="body2">
                                                등급: {analysisResult.quality.grade} ({(analysisResult.quality.overall_score * 100).toFixed(1)}%)
                                            </Typography>
                                        </Box>

                                        {/* 트렌드 예측 */}
                                        <Box>
                                            <Typography variant="subtitle2" gutterBottom>
                                                트렌드 예측
                                            </Typography>
                                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                                <Chip
                                                    size="small"
                                                    icon={<TrendingIcon />}
                                                    label={`트렌드: ${(analysisResult.trend_prediction.trend_score * 100).toFixed(0)}%`}
                                                />
                                                <Chip
                                                    size="small"
                                                    icon={<VisibilityIcon />}
                                                    label={`예상 조회: ${analysisResult.trend_prediction.predicted_engagement.views}`}
                                                />
                                            </Box>
                                        </Box>
                                    </Box>
                                </CardContent>
                            </StyledCard>
                        )}
                    </Box>
                </Box>
            </TabPanel>

            {/* 컨텐츠 생성 탭 */}
            <TabPanel value={currentTab} index={2}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                    <Box sx={{ flex: '1 1 400px', minWidth: 400 }}>
                        <StyledCard>
                            <CardHeader title="AI 컨텐츠 생성" />
                            <CardContent>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <TextField
                                        label="생성 프롬프트"
                                        value={generationPrompt}
                                        onChange={(e) => setGenerationPrompt(e.target.value)}
                                        multiline
                                        rows={4}
                                        fullWidth
                                        placeholder="예: AI 기반 컨텐츠 분석 시스템에 대한 블로그 글을 작성해주세요."
                                    />
                                    <Button
                                        variant="contained"
                                        onClick={generateContent}
                                        disabled={loading}
                                        startIcon={loading ? <CircularProgress size={20} /> : <AutoFixIcon />}
                                    >
                                        {loading ? '생성 중...' : 'AI 컨텐츠 생성'}
                                    </Button>
                                </Box>
                            </CardContent>
                        </StyledCard>
                    </Box>

                    <Box sx={{ flex: '1 1 400px', minWidth: 400 }}>
                        {generationResult && (
                            <StyledCard>
                                <CardHeader title="생성 결과" />
                                <CardContent>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                        <Alert severity={generationResult.approved ? 'success' : 'warning'}>
                                            <AlertTitle>
                                                {generationResult.approved ? '승인됨' : '검토 필요'}
                                            </AlertTitle>
                                            품질 점수: {(generationResult.quality_assessment.overall_score * 100).toFixed(1)}%
                                        </Alert>

                                        <Typography variant="subtitle2">
                                            생성된 제목:
                                        </Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                            {generationResult.generated_content.title}
                                        </Typography>

                                        <Typography variant="subtitle2">
                                            생성된 내용 (미리보기):
                                        </Typography>
                                        <Typography variant="body2" sx={{
                                            maxHeight: 200,
                                            overflow: 'auto',
                                            p: 2,
                                            bgcolor: 'grey.50',
                                            borderRadius: 1
                                        }}>
                                            {generationResult.generated_content.content.substring(0, 500)}...
                                        </Typography>
                                    </Box>
                                </CardContent>
                            </StyledCard>
                        )}
                    </Box>
                </Box>
            </TabPanel>

            {/* 개인화 추천 탭 */}
            <TabPanel value={currentTab} index={3}>
                <Alert severity="info" sx={{ mb: 3 }}>
                    <AlertTitle>개인화 추천 시스템</AlertTitle>
                    사용자별 맞춤 컨텐츠 추천 기능이 곧 제공될 예정입니다.
                </Alert>
            </TabPanel>

            {/* 트렌드 분석 탭 */}
            <TabPanel value={currentTab} index={4}>
                <Alert severity="info" sx={{ mb: 3 }}>
                    <AlertTitle>트렌드 분석</AlertTitle>
                    실시간 트렌드 분석 및 예측 기능이 곧 제공될 예정입니다.
                </Alert>
            </TabPanel>

            {/* 성능 모니터링 탭 */}
            <TabPanel value={currentTab} index={5}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                    <Box sx={{ flex: '1 1 100%', minWidth: 300 }}>
                        <StyledCard>
                            <CardHeader title="시스템 성능 지표" />
                            <CardContent>
                                <TableContainer>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>지표</TableCell>
                                                <TableCell align="right">현재값</TableCell>
                                                <TableCell align="right">목표값</TableCell>
                                                <TableCell align="right">상태</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            <TableRow>
                                                <TableCell>평균 응답 시간</TableCell>
                                                <TableCell align="right">{systemMetrics.averageProcessingTime}ms</TableCell>
                                                <TableCell align="right">1000ms</TableCell>
                                                <TableCell align="right">
                                                    <StatusChip
                                                        status={systemMetrics.averageProcessingTime < 1000 ? 'excellent' : 'fair'}
                                                        label={systemMetrics.averageProcessingTime < 1000 ? '우수' : '보통'}
                                                        size="small"
                                                    />
                                                </TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell>성공률</TableCell>
                                                <TableCell align="right">{(systemMetrics.successRate * 100).toFixed(1)}%</TableCell>
                                                <TableCell align="right">95%</TableCell>
                                                <TableCell align="right">
                                                    <StatusChip
                                                        status={systemMetrics.successRate > 0.95 ? 'excellent' : 'good'}
                                                        label={systemMetrics.successRate > 0.95 ? '우수' : '양호'}
                                                        size="small"
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </CardContent>
                        </StyledCard>
                    </Box>
                </Box>
            </TabPanel>

            {/* 설정 다이얼로그 */}
            <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>시스템 설정</DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2 }}>
                        <FormControlLabel
                            control={<Switch defaultChecked />}
                            label="실시간 분석 활성화"
                        />
                        <FormControlLabel
                            control={<Switch defaultChecked />}
                            label="자동 최적화"
                        />
                        <FormControlLabel
                            control={<Switch defaultChecked />}
                            label="개인화 추천"
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setSettingsOpen(false)}>취소</Button>
                    <Button variant="contained" onClick={() => setSettingsOpen(false)}>저장</Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default AutoAgentsContentDashboard;
