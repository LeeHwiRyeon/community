/**
 * 📢 신고 관리 시스템 컴포넌트
 * 
 * 사용자 신고, 신고 처리, 신고 통계를 관리하는 시스템
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
    Alert,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Tooltip,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    LinearProgress,
    Badge,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Divider,
    Tabs,
    Tab,
    Avatar,
    Rating,
    Accordion,
    AccordionSummary,
    AccordionDetails
} from '@mui/material';

import {
    Report,
    Warning,
    CheckCircle,
    Error,
    Info,
    Refresh,
    Visibility,
    Block,
    Person,
    Message,
    Flag,
    Timeline,
    Assessment,
    ExpandMore,
    ThumbUp,
    ThumbDown,
    Close,
    Send,
    FilterList,
    Search,
    Download,
    Print
} from '@mui/icons-material';

// 타입 정의
interface ReportData {
    id: string;
    reporterId: string;
    reporterName: string;
    reporterAvatar?: string;
    reportedUserId: string;
    reportedUserName: string;
    reportedUserAvatar?: string;
    contentType: 'post' | 'comment' | 'user' | 'message' | 'profile';
    contentId: string;
    contentPreview: string;
    reportType: 'spam' | 'harassment' | 'inappropriate' | 'copyright' | 'fake' | 'other';
    reportReason: string;
    description: string;
    evidence: EvidenceItem[];
    status: 'pending' | 'investigating' | 'resolved' | 'dismissed' | 'escalated';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    assignedModerator?: string;
    moderatorNotes?: string;
    resolution?: string;
    createdAt: string;
    updatedAt: string;
    resolvedAt?: string;
    severity: number; // 1-5
}

interface EvidenceItem {
    type: 'screenshot' | 'link' | 'text' | 'file';
    content: string;
    description: string;
    timestamp: string;
}

interface ReportStats {
    totalReports: number;
    pendingReports: number;
    resolvedReports: number;
    dismissedReports: number;
    averageResolutionTime: number; // hours
    reportTypes: Array<{
        type: string;
        count: number;
        percentage: number;
    }>;
    topReporters: Array<{
        userId: string;
        username: string;
        reportCount: number;
        accuracy: number;
    }>;
    resolutionTrends: Array<{
        date: string;
        resolved: number;
        dismissed: number;
    }>;
}

interface ReportFilter {
    status?: string;
    type?: string;
    priority?: string;
    dateRange?: string;
    assignedModerator?: string;
}

const ReportManagementSystem: React.FC = () => {
    const [reports, setReports] = useState<ReportData[]>([]);
    const [stats, setStats] = useState<ReportStats | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedReport, setSelectedReport] = useState<ReportData | null>(null);
    const [showReportDialog, setShowReportDialog] = useState(false);
    const [activeTab, setActiveTab] = useState(0);
    const [filters, setFilters] = useState<ReportFilter>({});
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchReportData();
    }, []);

    const fetchReportData = async () => {
        try {
            setLoading(true);
            setError(null);

            // 모의 데이터 생성
            const mockReports: ReportData[] = [
                {
                    id: '1',
                    reporterId: 'user123',
                    reporterName: '정의로운사용자',
                    reporterAvatar: '/avatars/user123.jpg',
                    reportedUserId: 'user456',
                    reportedUserName: '문제사용자',
                    reportedUserAvatar: '/avatars/user456.jpg',
                    contentType: 'post',
                    contentId: 'post789',
                    contentPreview: '스팸성 광고 게시물입니다. 무료 다운로드 링크가 포함되어 있습니다.',
                    reportType: 'spam',
                    reportReason: '상업적 광고',
                    description: '이 사용자가 계속해서 광고성 게시물을 올리고 있습니다. 커뮤니티 규칙을 위반하는 행위입니다.',
                    evidence: [
                        {
                            type: 'screenshot',
                            content: '/evidence/screenshot1.jpg',
                            description: '스팸 게시물 스크린샷',
                            timestamp: '2025-01-02T10:30:00Z'
                        },
                        {
                            type: 'link',
                            content: 'https://spam-site.com',
                            description: '스팸 사이트 링크',
                            timestamp: '2025-01-02T10:30:00Z'
                        }
                    ],
                    status: 'pending',
                    priority: 'medium',
                    createdAt: '2025-01-02T10:30:00Z',
                    updatedAt: '2025-01-02T10:30:00Z',
                    severity: 3
                },
                {
                    id: '2',
                    reporterId: 'user789',
                    reporterName: '커뮤니티관리자',
                    reporterAvatar: '/avatars/user789.jpg',
                    reportedUserId: 'user101',
                    reportedUserName: '괴롭히는사용자',
                    reportedUserAvatar: '/avatars/user101.jpg',
                    contentType: 'comment',
                    contentId: 'comment456',
                    contentPreview: '개인적인 공격과 비하 발언이 포함된 댓글입니다.',
                    reportType: 'harassment',
                    reportReason: '괴롭힘 및 비하',
                    description: '다른 사용자를 대상으로 한 지속적인 괴롭힘과 비하 발언을 하고 있습니다.',
                    evidence: [
                        {
                            type: 'text',
                            content: '너는 정말 바보야. 이런 것도 모르냐?',
                            description: '비하 발언 텍스트',
                            timestamp: '2025-01-02T11:15:00Z'
                        }
                    ],
                    status: 'investigating',
                    priority: 'high',
                    assignedModerator: 'moderator1',
                    moderatorNotes: '사용자 행동 패턴을 분석 중입니다.',
                    createdAt: '2025-01-02T11:15:00Z',
                    updatedAt: '2025-01-02T11:45:00Z',
                    severity: 4
                },
                {
                    id: '3',
                    reporterId: 'user202',
                    reporterName: '저작권보호자',
                    reporterAvatar: '/avatars/user202.jpg',
                    reportedUserId: 'user303',
                    reportedUserName: '불법복제자',
                    reportedUserAvatar: '/avatars/user303.jpg',
                    contentType: 'post',
                    contentId: 'post404',
                    contentPreview: '저작권이 있는 콘텐츠를 무단으로 복제하여 게시했습니다.',
                    reportType: 'copyright',
                    reportReason: '저작권 침해',
                    description: '제가 만든 작품을 허락 없이 복제하여 게시했습니다.',
                    evidence: [
                        {
                            type: 'screenshot',
                            content: '/evidence/copyright1.jpg',
                            description: '원본 작품 스크린샷',
                            timestamp: '2025-01-02T12:00:00Z'
                        },
                        {
                            type: 'screenshot',
                            content: '/evidence/copyright2.jpg',
                            description: '복제된 작품 스크린샷',
                            timestamp: '2025-01-02T12:00:00Z'
                        }
                    ],
                    status: 'resolved',
                    priority: 'urgent',
                    assignedModerator: 'moderator2',
                    moderatorNotes: '저작권 침해가 확인되어 게시물을 삭제했습니다.',
                    resolution: '게시물 삭제 및 경고 조치',
                    createdAt: '2025-01-02T12:00:00Z',
                    updatedAt: '2025-01-02T14:30:00Z',
                    resolvedAt: '2025-01-02T14:30:00Z',
                    severity: 5
                }
            ];

            const mockStats: ReportStats = {
                totalReports: 156,
                pendingReports: 23,
                resolvedReports: 98,
                dismissedReports: 35,
                averageResolutionTime: 4.2,
                reportTypes: [
                    { type: 'spam', count: 45, percentage: 28.8 },
                    { type: 'harassment', count: 32, percentage: 20.5 },
                    { type: 'inappropriate', count: 28, percentage: 17.9 },
                    { type: 'copyright', count: 25, percentage: 16.0 },
                    { type: 'fake', count: 18, percentage: 11.5 },
                    { type: 'other', count: 8, percentage: 5.1 }
                ],
                topReporters: [
                    { userId: 'user123', username: '정의로운사용자', reportCount: 12, accuracy: 95 },
                    { userId: 'user789', username: '커뮤니티관리자', reportCount: 8, accuracy: 100 },
                    { userId: 'user202', username: '저작권보호자', reportCount: 6, accuracy: 90 }
                ],
                resolutionTrends: [
                    { date: '2025-01-01', resolved: 15, dismissed: 5 },
                    { date: '2025-01-02', resolved: 18, dismissed: 7 },
                    { date: '2025-01-03', resolved: 12, dismissed: 4 },
                    { date: '2025-01-04', resolved: 20, dismissed: 6 },
                    { date: '2025-01-05', resolved: 16, dismissed: 8 }
                ]
            };

            // API 호출 시뮬레이션 지연
            await new Promise(resolve => setTimeout(resolve, 1000));

            setReports(mockReports);
            setStats(mockStats);
        } catch (err) {
            setError('신고 데이터를 불러오는 중 오류가 발생했습니다.');
            console.error('Report fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleReportAction = (reportId: string, action: 'resolve' | 'dismiss' | 'escalate') => {
        setReports(prev => prev.map(report => {
            if (report.id === reportId) {
                const updatedReport = { ...report };
                switch (action) {
                    case 'resolve':
                        updatedReport.status = 'resolved';
                        updatedReport.resolvedAt = new Date().toISOString();
                        break;
                    case 'dismiss':
                        updatedReport.status = 'dismissed';
                        break;
                    case 'escalate':
                        updatedReport.status = 'escalated';
                        updatedReport.priority = 'urgent';
                        break;
                }
                updatedReport.updatedAt = new Date().toISOString();
                return updatedReport;
            }
            return report;
        }));
    };

    const handleAssignModerator = (reportId: string, moderatorId: string) => {
        setReports(prev => prev.map(report =>
            report.id === reportId
                ? { ...report, assignedModerator: moderatorId, status: 'investigating' }
                : report
        ));
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'warning';
            case 'investigating': return 'info';
            case 'resolved': return 'success';
            case 'dismissed': return 'default';
            case 'escalated': return 'error';
            default: return 'default';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent': return 'error';
            case 'high': return 'warning';
            case 'medium': return 'info';
            case 'low': return 'success';
            default: return 'default';
        }
    };

    const getReportTypeIcon = (type: string) => {
        switch (type) {
            case 'spam': return <Block color="error" />;
            case 'harassment': return <Warning color="warning" />;
            case 'inappropriate': return <Error color="error" />;
            case 'copyright': return <Flag color="info" />;
            case 'fake': return <Person color="warning" />;
            default: return <Info />;
        }
    };

    const filteredReports = reports.filter(report => {
        const matchesSearch = report.reporterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            report.reportedUserName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            report.contentPreview.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = !filters.status || report.status === filters.status;
        const matchesType = !filters.type || report.reportType === filters.type;
        const matchesPriority = !filters.priority || report.priority === filters.priority;

        return matchesSearch && matchesStatus && matchesType && matchesPriority;
    });

    if (loading && !stats) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <Typography variant="h6">신고 관리 시스템을 불러오는 중...</Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Alert severity="error" sx={{ mb: 2 }}>
                {error}
                <Button onClick={fetchReportData} sx={{ ml: 2 }}>
                    다시 시도
                </Button>
            </Alert>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            {/* 헤더 */}
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
                    📢 신고 관리 시스템
                </Typography>

                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        variant="outlined"
                        startIcon={<Refresh />}
                        onClick={fetchReportData}
                        disabled={loading}
                    >
                        새로고침
                    </Button>

                    <Button
                        variant="contained"
                        startIcon={<Download />}
                        color="primary"
                    >
                        리포트 내보내기
                    </Button>
                </Box>
            </Box>

            {/* 통계 카드 */}
            {stats && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 3 }}>
                    <Box sx={{ flex: '1 1 250px', minWidth: 250 }}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Box>
                                        <Typography color="textSecondary" gutterBottom>
                                            총 신고 수
                                        </Typography>
                                        <Typography variant="h4" component="div">
                                            {stats.totalReports}
                                        </Typography>
                                    </Box>
                                    <Report sx={{ fontSize: 40, color: 'primary.main' }} />
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
                                            대기 중
                                        </Typography>
                                        <Typography variant="h4" component="div">
                                            {stats.pendingReports}
                                        </Typography>
                                    </Box>
                                    <Warning sx={{ fontSize: 40, color: 'warning.main' }} />
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
                                            해결됨
                                        </Typography>
                                        <Typography variant="h4" component="div">
                                            {stats.resolvedReports}
                                        </Typography>
                                    </Box>
                                    <CheckCircle sx={{ fontSize: 40, color: 'success.main' }} />
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
                                            평균 처리 시간
                                        </Typography>
                                        <Typography variant="h4" component="div">
                                            {stats.averageResolutionTime}시간
                                        </Typography>
                                    </Box>
                                    <Timeline sx={{ fontSize: 40, color: 'info.main' }} />
                                </Box>
                            </CardContent>
                        </Card>
                    </Box>
                </Box>
            )}

            {/* 필터 및 검색 */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
                        <TextField
                            size="small"
                            placeholder="신고자, 피신고자, 내용 검색..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            InputProps={{
                                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                            }}
                            sx={{ flexGrow: 1 }}
                        />

                        <FormControl size="small" sx={{ minWidth: 120 }}>
                            <InputLabel>상태</InputLabel>
                            <Select
                                value={filters.status || ''}
                                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value || undefined }))}
                                label="상태"
                            >
                                <MenuItem value="">전체</MenuItem>
                                <MenuItem value="pending">대기 중</MenuItem>
                                <MenuItem value="investigating">조사 중</MenuItem>
                                <MenuItem value="resolved">해결됨</MenuItem>
                                <MenuItem value="dismissed">기각됨</MenuItem>
                                <MenuItem value="escalated">에스컬레이션</MenuItem>
                            </Select>
                        </FormControl>

                        <FormControl size="small" sx={{ minWidth: 120 }}>
                            <InputLabel>유형</InputLabel>
                            <Select
                                value={filters.type || ''}
                                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value || undefined }))}
                                label="유형"
                            >
                                <MenuItem value="">전체</MenuItem>
                                <MenuItem value="spam">스팸</MenuItem>
                                <MenuItem value="harassment">괴롭힘</MenuItem>
                                <MenuItem value="inappropriate">부적절한 내용</MenuItem>
                                <MenuItem value="copyright">저작권 침해</MenuItem>
                                <MenuItem value="fake">가짜 정보</MenuItem>
                                <MenuItem value="other">기타</MenuItem>
                            </Select>
                        </FormControl>

                        <FormControl size="small" sx={{ minWidth: 120 }}>
                            <InputLabel>우선순위</InputLabel>
                            <Select
                                value={filters.priority || ''}
                                onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value || undefined }))}
                                label="우선순위"
                            >
                                <MenuItem value="">전체</MenuItem>
                                <MenuItem value="urgent">긴급</MenuItem>
                                <MenuItem value="high">높음</MenuItem>
                                <MenuItem value="medium">보통</MenuItem>
                                <MenuItem value="low">낮음</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                </CardContent>
            </Card>

            {/* 탭 */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
                    <Tab label="신고 목록" />
                    <Tab label="신고 통계" />
                    <Tab label="신고자 순위" />
                </Tabs>
            </Box>

            {/* 신고 목록 탭 */}
            {activeTab === 0 && (
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            📋 신고 목록 ({filteredReports.length}개)
                        </Typography>
                        <TableContainer component={Paper} variant="outlined">
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>신고자</TableCell>
                                        <TableCell>피신고자</TableCell>
                                        <TableCell>콘텐츠 미리보기</TableCell>
                                        <TableCell>신고 유형</TableCell>
                                        <TableCell>심각도</TableCell>
                                        <TableCell>우선순위</TableCell>
                                        <TableCell>상태</TableCell>
                                        <TableCell>담당자</TableCell>
                                        <TableCell>신고 시간</TableCell>
                                        <TableCell>작업</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredReports.map((report) => (
                                        <TableRow key={report.id}>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <Avatar sx={{ width: 32, height: 32, mr: 1 }}>
                                                        {report.reporterName.charAt(0)}
                                                    </Avatar>
                                                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                                        {report.reporterName}
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <Avatar sx={{ width: 32, height: 32, mr: 1 }}>
                                                        {report.reportedUserName.charAt(0)}
                                                    </Avatar>
                                                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                                        {report.reportedUserName}
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {report.contentPreview}
                                                </Typography>
                                                <Chip label={report.contentType} size="small" sx={{ mt: 0.5 }} />
                                            </TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    {getReportTypeIcon(report.reportType)}
                                                    <Typography variant="body2" sx={{ ml: 1 }}>
                                                        {report.reportType}
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Rating value={report.severity} readOnly size="small" />
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={report.priority}
                                                    size="small"
                                                    color={getPriorityColor(report.priority) as any}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={report.status}
                                                    size="small"
                                                    color={getStatusColor(report.status) as any}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" color="textSecondary">
                                                    {report.assignedModerator || '미할당'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" color="textSecondary">
                                                    {new Date(report.createdAt).toLocaleString()}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => setSelectedReport(report)}
                                                    color="info"
                                                >
                                                    <Visibility />
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleReportAction(report.id, 'resolve')}
                                                    color="success"
                                                >
                                                    <CheckCircle />
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleReportAction(report.id, 'dismiss')}
                                                    color="error"
                                                >
                                                    <Close />
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

            {/* 신고 통계 탭 */}
            {activeTab === 1 && stats && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                    <Box sx={{ flex: '1 1 400px', minWidth: 400 }}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    📊 신고 유형별 분포
                                </Typography>
                                <List>
                                    {stats.reportTypes.map((type, index) => (
                                        <ListItem key={index}>
                                            <ListItemText
                                                primary={type.type}
                                                secondary={`${type.count}건 (${type.percentage}%)`}
                                            />
                                            <LinearProgress
                                                variant="determinate"
                                                value={type.percentage}
                                                sx={{ width: 100, height: 8, borderRadius: 4 }}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            </CardContent>
                        </Card>
                    </Box>

                    <Box sx={{ flex: '1 1 400px', minWidth: 400 }}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    📈 처리 현황
                                </Typography>
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" color="textSecondary">
                                        해결된 신고
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <LinearProgress
                                            variant="determinate"
                                            value={(stats.resolvedReports / stats.totalReports) * 100}
                                            color="success"
                                            sx={{ flexGrow: 1, height: 8, borderRadius: 4, mr: 2 }}
                                        />
                                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                            {stats.resolvedReports}
                                        </Typography>
                                    </Box>
                                </Box>

                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" color="textSecondary">
                                        기각된 신고
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <LinearProgress
                                            variant="determinate"
                                            value={(stats.dismissedReports / stats.totalReports) * 100}
                                            color="info"
                                            sx={{ flexGrow: 1, height: 8, borderRadius: 4, mr: 2 }}
                                        />
                                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                            {stats.dismissedReports}
                                        </Typography>
                                    </Box>
                                </Box>

                                <Box>
                                    <Typography variant="body2" color="textSecondary">
                                        대기 중인 신고
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <LinearProgress
                                            variant="determinate"
                                            value={(stats.pendingReports / stats.totalReports) * 100}
                                            color="warning"
                                            sx={{ flexGrow: 1, height: 8, borderRadius: 4, mr: 2 }}
                                        />
                                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                            {stats.pendingReports}
                                        </Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Box>
                </Box>
            )}

            {/* 신고자 순위 탭 */}
            {activeTab === 2 && stats && (
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            🏆 신고자 순위
                        </Typography>
                        <TableContainer component={Paper} variant="outlined">
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>순위</TableCell>
                                        <TableCell>사용자명</TableCell>
                                        <TableCell>신고 수</TableCell>
                                        <TableCell>정확도</TableCell>
                                        <TableCell>신뢰도</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {stats.topReporters.map((reporter, index) => (
                                        <TableRow key={reporter.userId}>
                                            <TableCell>
                                                <Typography variant="h6" color="primary">
                                                    #{index + 1}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                                    {reporter.username}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Badge badgeContent={reporter.reportCount} color="primary">
                                                    <Typography variant="body2">
                                                        {reporter.reportCount}건
                                                    </Typography>
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <LinearProgress
                                                        variant="determinate"
                                                        value={reporter.accuracy}
                                                        color="success"
                                                        sx={{ width: 60, height: 6, borderRadius: 3, mr: 1 }}
                                                    />
                                                    <Typography variant="body2">
                                                        {reporter.accuracy}%
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Rating
                                                    value={reporter.accuracy / 20}
                                                    readOnly
                                                    size="small"
                                                    precision={0.1}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </CardContent>
                </Card>
            )}

            {/* 신고 상세 보기 다이얼로그 */}
            <Dialog open={!!selectedReport} onClose={() => setSelectedReport(null)} maxWidth="md" fullWidth>
                <DialogTitle>신고 상세 정보</DialogTitle>
                <DialogContent>
                    {selectedReport && (
                        <Box>
                            <Accordion>
                                <AccordionSummary expandIcon={<ExpandMore />}>
                                    <Typography variant="h6">신고 정보</Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                                        <Box sx={{ flex: '1 1 200px', minWidth: 200 }}>
                                            <Typography variant="body2" color="textSecondary">신고자</Typography>
                                            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                                {selectedReport.reporterName}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ flex: '1 1 200px', minWidth: 200 }}>
                                            <Typography variant="body2" color="textSecondary">피신고자</Typography>
                                            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                                {selectedReport.reportedUserName}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ flex: '1 1 200px', minWidth: 200 }}>
                                            <Typography variant="body2" color="textSecondary">신고 유형</Typography>
                                            <Typography variant="body1">{selectedReport.reportType}</Typography>
                                        </Box>
                                        <Box sx={{ flex: '1 1 200px', minWidth: 200 }}>
                                            <Typography variant="body2" color="textSecondary">우선순위</Typography>
                                            <Chip
                                                label={selectedReport.priority}
                                                size="small"
                                                color={getPriorityColor(selectedReport.priority) as any}
                                            />
                                        </Box>
                                    </Box>
                                </AccordionDetails>
                            </Accordion>

                            <Accordion>
                                <AccordionSummary expandIcon={<ExpandMore />}>
                                    <Typography variant="h6">신고 내용</Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <Typography variant="body2" color="textSecondary" gutterBottom>
                                        신고 사유
                                    </Typography>
                                    <Typography variant="body1" sx={{ mb: 2 }}>
                                        {selectedReport.reportReason}
                                    </Typography>

                                    <Typography variant="body2" color="textSecondary" gutterBottom>
                                        상세 설명
                                    </Typography>
                                    <Typography variant="body1" sx={{ mb: 2 }}>
                                        {selectedReport.description}
                                    </Typography>

                                    <Typography variant="body2" color="textSecondary" gutterBottom>
                                        콘텐츠 미리보기
                                    </Typography>
                                    <Typography variant="body1" sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                                        {selectedReport.contentPreview}
                                    </Typography>
                                </AccordionDetails>
                            </Accordion>

                            <Accordion>
                                <AccordionSummary expandIcon={<ExpandMore />}>
                                    <Typography variant="h6">증거 자료</Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                    {selectedReport.evidence.map((evidence, index) => (
                                        <Box key={index} sx={{ mb: 2, p: 2, border: 1, borderColor: 'grey.300', borderRadius: 1 }}>
                                            <Typography variant="body2" color="textSecondary">
                                                {evidence.type} - {evidence.description}
                                            </Typography>
                                            <Typography variant="body1" sx={{ mt: 1 }}>
                                                {evidence.content}
                                            </Typography>
                                            <Typography variant="caption" color="textSecondary">
                                                {new Date(evidence.timestamp).toLocaleString()}
                                            </Typography>
                                        </Box>
                                    ))}
                                </AccordionDetails>
                            </Accordion>

                            {selectedReport.moderatorNotes && (
                                <Accordion>
                                    <AccordionSummary expandIcon={<ExpandMore />}>
                                        <Typography variant="h6">모더레이터 메모</Typography>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        <Typography variant="body1">
                                            {selectedReport.moderatorNotes}
                                        </Typography>
                                    </AccordionDetails>
                                </Accordion>
                            )}

                            {selectedReport.resolution && (
                                <Accordion>
                                    <AccordionSummary expandIcon={<ExpandMore />}>
                                        <Typography variant="h6">해결 방안</Typography>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        <Typography variant="body1">
                                            {selectedReport.resolution}
                                        </Typography>
                                    </AccordionDetails>
                                </Accordion>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setSelectedReport(null)}>닫기</Button>
                    <Button
                        onClick={() => selectedReport && handleReportAction(selectedReport.id, 'resolve')}
                        color="success"
                        startIcon={<CheckCircle />}
                    >
                        해결
                    </Button>
                    <Button
                        onClick={() => selectedReport && handleReportAction(selectedReport.id, 'dismiss')}
                        color="error"
                        startIcon={<Close />}
                    >
                        기각
                    </Button>
                    <Button
                        onClick={() => selectedReport && handleReportAction(selectedReport.id, 'escalate')}
                        color="warning"
                        startIcon={<Warning />}
                    >
                        에스컬레이션
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ReportManagementSystem;
