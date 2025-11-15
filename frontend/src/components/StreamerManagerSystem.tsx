/**
 * 📺 스트리머 매니저 관리 시스템
 * 
 * 스트리머와 함께 일하는 매니저나 관리자를 위한 시스템
 * 방송 관리, 구독자 관리, 수익 관리, 일정 관리
 * 
 * @author AUTOAGENTS Manager
 * @version 3.0.0
 * @created 2025-01-02
 */

import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    CardActions,
    Button,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Chip,
        IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    CircularProgress,
    Tabs,
    Tab,
    Paper,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    Avatar,
    Badge,
    Divider,
    Switch,
    FormControlLabel,
    LinearProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tooltip
} from '@mui/material';

import {
    LiveTv as StreamIcon,
    People as PeopleIcon,
    MonetizationOn as MoneyIcon,
    Schedule as ScheduleIcon,
    Analytics as AnalyticsIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Add as AddIcon,
    Visibility as ViewIcon,
    TrendingUp as TrendingIcon,
    Warning as WarningIcon,
    CheckCircle as CheckIcon,
    Cancel as CancelIcon,
    Settings as SettingsIcon,
    Notifications as NotificationIcon,
    Chat as ChatIcon,
    VideoCall as VideoCallIcon,
    Share as ShareIcon,
    Download as DownloadIcon
} from '@mui/icons-material';

// 타입 정의
interface Streamer {
    id: string;
    name: string;
    username: string;
    avatar: string;
    platform: 'twitch' | 'youtube' | 'afreeca' | 'custom';
    category: string;
    subscriberCount: number;
    followerCount: number;
    totalViews: number;
    status: 'online' | 'offline' | 'scheduled';
    managerId: string;
    revenue: number;
    lastStream: string;
    nextStream?: string;
    tags: string[];
    bio: string;
    socialLinks: {
        twitter?: string;
        instagram?: string;
        discord?: string;
    };
}

interface Manager {
    id: string;
    name: string;
    email: string;
    role: 'manager' | 'admin' | 'assistant';
    permissions: string[];
    assignedStreamers: string[];
    joinDate: string;
    avatar: string;
}

interface StreamSchedule {
    id: string;
    streamerId: string;
    title: string;
    description: string;
    scheduledTime: string;
    duration: number;
    category: string;
    tags: string[];
    status: 'scheduled' | 'live' | 'completed' | 'cancelled';
    viewers: number;
    revenue: number;
}

interface RevenueData {
    id: string;
    streamerId: string;
    date: string;
    source: 'donations' | 'subscriptions' | 'ads' | 'sponsors' | 'merchandise';
    amount: number;
    currency: string;
    description: string;
    status: 'pending' | 'processed' | 'failed';
}

const StreamerManagerSystem: React.FC = () => {
    const [activeTab, setActiveTab] = useState(0);
    const [streamers, setStreamers] = useState<Streamer[]>([]);
    const [managers, setManagers] = useState<Manager[]>([]);
    const [schedules, setSchedules] = useState<StreamSchedule[]>([]);
    const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedStreamer, setSelectedStreamer] = useState<Streamer | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogType, setDialogType] = useState<'streamer' | 'schedule' | 'revenue'>('streamer');

    // 모의 데이터 초기화
    useEffect(() => {
        const mockStreamers: Streamer[] = [
            {
                id: '1',
                name: '게임마스터',
                username: 'gamemaster_pro',
                avatar: '/api/placeholder/60/60',
                platform: 'twitch',
                category: '게임',
                subscriberCount: 15420,
                followerCount: 25680,
                totalViews: 1250000,
                status: 'online',
                managerId: 'mgr1',
                revenue: 8750000,
                lastStream: '2025-01-02T10:00:00Z',
                nextStream: '2025-01-02T20:00:00Z',
                tags: ['FPS', '멀티플레이어', '경쟁'],
                bio: '프로 게이머이자 스트리머',
                socialLinks: {
                    twitter: '@gamemaster_pro',
                    discord: 'gamemaster#1234'
                }
            },
            {
                id: '2',
                name: '코스프레퀸',
                username: 'cosplay_queen',
                avatar: '/api/placeholder/60/60',
                platform: 'youtube',
                category: '코스프레',
                subscriberCount: 12890,
                followerCount: 18900,
                totalViews: 890000,
                status: 'offline',
                managerId: 'mgr1',
                revenue: 6200000,
                lastStream: '2025-01-01T15:00:00Z',
                nextStream: '2025-01-03T14:00:00Z',
                tags: ['코스프레', '의상제작', '포토샵'],
                bio: '전문 코스플레이어',
                socialLinks: {
                    instagram: '@cosplay_queen',
                    twitter: '@cosplay_queen'
                }
            }
        ];

        const mockManagers: Manager[] = [
            {
                id: 'mgr1',
                name: '김매니저',
                email: 'manager@example.com',
                role: 'manager',
                permissions: ['stream_management', 'revenue_tracking', 'schedule_management'],
                assignedStreamers: ['1', '2'],
                joinDate: '2024-01-15',
                avatar: '/api/placeholder/40/40'
            }
        ];

        const mockSchedules: StreamSchedule[] = [
            {
                id: 'sched1',
                streamerId: '1',
                title: '오늘의 게임 스트리밍',
                description: '새로운 게임 플레이',
                scheduledTime: '2025-01-02T20:00:00Z',
                duration: 120,
                category: '게임',
                tags: ['FPS', '새게임'],
                status: 'scheduled',
                viewers: 0,
                revenue: 0
            }
        ];

        const mockRevenue: RevenueData[] = [
            {
                id: 'rev1',
                streamerId: '1',
                date: '2025-01-01',
                source: 'donations',
                amount: 50000,
                currency: 'KRW',
                description: '시청자 후원',
                status: 'processed'
            }
        ];

        setStreamers(mockStreamers);
        setManagers(mockManagers);
        setSchedules(mockSchedules);
        setRevenueData(mockRevenue);
    }, []);

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
    };

    const handleOpenDialog = (type: 'streamer' | 'schedule' | 'revenue', streamer?: Streamer) => {
        setDialogType(type);
        setSelectedStreamer(streamer || null);
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setSelectedStreamer(null);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'online': return 'success';
            case 'offline': return 'default';
            case 'scheduled': return 'warning';
            case 'live': return 'error';
            case 'completed': return 'success';
            case 'cancelled': return 'error';
            default: return 'default';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'online': return <StreamIcon />;
            case 'offline': return <CancelIcon />;
            case 'scheduled': return <ScheduleIcon />;
            case 'live': return <StreamIcon />;
            case 'completed': return <CheckIcon />;
            case 'cancelled': return <CancelIcon />;
            default: return <WarningIcon />;
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('ko-KR', {
            style: 'currency',
            currency: 'KRW'
        }).format(amount);
    };

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat('ko-KR').format(num);
    };

    return (
        <Box sx={{ p: 4 }}>
            <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <StreamIcon />
                스트리머 매니저 관리 시스템
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
                스트리머와 함께 일하는 매니저나 관리자를 위한 통합 관리 시스템
            </Typography>

            <Paper sx={{ mb: 3 }}>
                <Tabs value={activeTab} onChange={handleTabChange} aria-label="manager tabs">
                    <Tab label="스트리머 관리" icon={<PeopleIcon />} />
                    <Tab label="방송 일정" icon={<ScheduleIcon />} />
                    <Tab label="수익 관리" icon={<MoneyIcon />} />
                    <Tab label="분석 대시보드" icon={<AnalyticsIcon />} />
                </Tabs>
            </Paper>

            {/* 스트리머 관리 탭 */}
            {activeTab === 0 && (
                <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h6">관리 중인 스트리머</Typography>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => handleOpenDialog('streamer')}
                        >
                            스트리머 추가
                        </Button>
                    </Box>

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                        {streamers.map((streamer) => (
                            <Box sx={{ flex: '1 1 300px', minWidth: 300 }} key={streamer.id}>
                                <Card sx={{ height: '100%' }}>
                                    <CardContent>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                            <Avatar
                                                src={streamer.avatar}
                                                sx={{ width: 60, height: 60, mr: 2 }}
                                            />
                                            <Box sx={{ flex: 1 }}>
                                                <Typography variant="h6" gutterBottom>
                                                    {streamer.name}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    @{streamer.username}
                                                </Typography>
                                                <Chip
                                                    label={streamer.status}
                                                    color={getStatusColor(streamer.status)}
                                                    size="small"
                                                    icon={getStatusIcon(streamer.status)}
                                                    sx={{ mt: 1 }}
                                                />
                                            </Box>
                                        </Box>

                                        <Divider sx={{ my: 2 }} />

                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                                            <Box sx={{ flex: '1 1 120px', minWidth: 120 }}>
                                                <Typography variant="body2" color="text.secondary">
                                                    구독자
                                                </Typography>
                                                <Typography variant="h6" color="primary">
                                                    {formatNumber(streamer.subscriberCount)}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ flex: '1 1 120px', minWidth: 120 }}>
                                                <Typography variant="body2" color="text.secondary">
                                                    팔로워
                                                </Typography>
                                                <Typography variant="h6" color="secondary">
                                                    {formatNumber(streamer.followerCount)}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ flex: '1 1 120px', minWidth: 120 }}>
                                                <Typography variant="body2" color="text.secondary">
                                                    총 조회수
                                                </Typography>
                                                <Typography variant="h6" color="success.main">
                                                    {formatNumber(streamer.totalViews)}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ flex: '1 1 120px', minWidth: 120 }}>
                                                <Typography variant="body2" color="text.secondary">
                                                    수익
                                                </Typography>
                                                <Typography variant="h6" color="warning.main">
                                                    {formatCurrency(streamer.revenue)}
                                                </Typography>
                                            </Box>
                                        </Box>

                                        <Box sx={{ mt: 2 }}>
                                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                                태그:
                                            </Typography>
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                {streamer.tags.map((tag) => (
                                                    <Chip key={tag} label={tag} size="small" variant="outlined" />
                                                ))}
                                            </Box>
                                        </Box>
                                    </CardContent>
                                    <CardActions>
                                        <Button
                                            size="small"
                                            startIcon={<EditIcon />}
                                            onClick={() => handleOpenDialog('streamer', streamer)}
                                        >
                                            편집
                                        </Button>
                                        <Button
                                            size="small"
                                            startIcon={<ViewIcon />}
                                            onClick={() => handleOpenDialog('schedule', streamer)}
                                        >
                                            일정 관리
                                        </Button>
                                        <Button
                                            size="small"
                                            startIcon={<MoneyIcon />}
                                            onClick={() => handleOpenDialog('revenue', streamer)}
                                        >
                                            수익 관리
                                        </Button>
                                    </CardActions>
                                </Card>
                            </Box>
                        ))}
                    </Box>
                </Box>
            )}

            {/* 방송 일정 탭 */}
            {activeTab === 1 && (
                <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h6">방송 일정 관리</Typography>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => handleOpenDialog('schedule')}
                        >
                            일정 추가
                        </Button>
                    </Box>

                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>스트리머</TableCell>
                                    <TableCell>제목</TableCell>
                                    <TableCell>예정 시간</TableCell>
                                    <TableCell>지속 시간</TableCell>
                                    <TableCell>상태</TableCell>
                                    <TableCell>액션</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {schedules.map((schedule) => {
                                    const streamer = streamers.find(s => s.id === schedule.streamerId);
                                    return (
                                        <TableRow key={schedule.id}>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <Avatar
                                                        src={streamer?.avatar}
                                                        sx={{ width: 32, height: 32, mr: 1 }}
                                                    />
                                                    {streamer?.name}
                                                </Box>
                                            </TableCell>
                                            <TableCell>{schedule.title}</TableCell>
                                            <TableCell>
                                                {new Date(schedule.scheduledTime).toLocaleString('ko-KR')}
                                            </TableCell>
                                            <TableCell>{schedule.duration}분</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={schedule.status}
                                                    color={getStatusColor(schedule.status)}
                                                    size="small"
                                                    icon={getStatusIcon(schedule.status)}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <IconButton size="small">
                                                    <EditIcon />
                                                </IconButton>
                                                <IconButton size="small">
                                                    <DeleteIcon />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            )}

            {/* 수익 관리 탭 */}
            {activeTab === 2 && (
                <Box>
                    <Typography variant="h6" gutterBottom>수익 관리</Typography>

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 3 }}>
                        <Box sx={{ flex: '1 1 200px', minWidth: 200 }}>
                            <Card>
                                <CardContent>
                                    <Typography variant="body2" color="text.secondary">
                                        총 수익
                                    </Typography>
                                    <Typography variant="h4" color="primary">
                                        {formatCurrency(revenueData.reduce((sum, rev) => sum + rev.amount, 0))}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Box>
                        <Box sx={{ flex: '1 1 200px', minWidth: 200 }}>
                            <Card>
                                <CardContent>
                                    <Typography variant="body2" color="text.secondary">
                                        이번 달 수익
                                    </Typography>
                                    <Typography variant="h4" color="secondary">
                                        {formatCurrency(1250000)}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Box>
                        <Box sx={{ flex: '1 1 200px', minWidth: 200 }}>
                            <Card>
                                <CardContent>
                                    <Typography variant="body2" color="text.secondary">
                                        후원 수익
                                    </Typography>
                                    <Typography variant="h4" color="success.main">
                                        {formatCurrency(750000)}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Box>
                        <Box sx={{ flex: '1 1 200px', minWidth: 200 }}>
                            <Card>
                                <CardContent>
                                    <Typography variant="body2" color="text.secondary">
                                        구독 수익
                                    </Typography>
                                    <Typography variant="h4" color="warning.main">
                                        {formatCurrency(500000)}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Box>
                    </Box>

                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>스트리머</TableCell>
                                    <TableCell>날짜</TableCell>
                                    <TableCell>수익원</TableCell>
                                    <TableCell>금액</TableCell>
                                    <TableCell>상태</TableCell>
                                    <TableCell>액션</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {revenueData.map((revenue) => {
                                    const streamer = streamers.find(s => s.id === revenue.streamerId);
                                    return (
                                        <TableRow key={revenue.id}>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <Avatar
                                                        src={streamer?.avatar}
                                                        sx={{ width: 32, height: 32, mr: 1 }}
                                                    />
                                                    {streamer?.name}
                                                </Box>
                                            </TableCell>
                                            <TableCell>{revenue.date}</TableCell>
                                            <TableCell>
                                                <Chip label={revenue.source} size="small" />
                                            </TableCell>
                                            <TableCell>{formatCurrency(revenue.amount)}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={revenue.status}
                                                    color={revenue.status === 'processed' ? 'success' : 'warning'}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <IconButton size="small">
                                                    <ViewIcon />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            )}

            {/* 분석 대시보드 탭 */}
            {activeTab === 3 && (
                <Box>
                    <Typography variant="h6" gutterBottom>분석 대시보드</Typography>

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                        <Box sx={{ flex: '1 1 400px', minWidth: 400 }}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        스트리머 성과 분석
                                    </Typography>
                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            평균 시청자 수
                                        </Typography>
                                        <LinearProgress
                                            variant="determinate"
                                            value={75}
                                            sx={{ height: 8, borderRadius: 4 }}
                                        />
                                        <Typography variant="body2" sx={{ mt: 1 }}>
                                            1,250명 (목표: 1,500명)
                                        </Typography>
                                    </Box>
                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            수익 달성률
                                        </Typography>
                                        <LinearProgress
                                            variant="determinate"
                                            value={85}
                                            color="secondary"
                                            sx={{ height: 8, borderRadius: 4 }}
                                        />
                                        <Typography variant="body2" sx={{ mt: 1 }}>
                                            85% (목표: 100%)
                                        </Typography>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Box>
                        <Box sx={{ flex: '1 1 400px', minWidth: 400 }}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        최근 활동
                                    </Typography>
                                    <List>
                                        <ListItem>
                                            <ListItemText
                                                primary="게임마스터 방송 시작"
                                                secondary="2시간 전"
                                            />
                                        </ListItem>
                                        <ListItem>
                                            <ListItemText
                                                primary="코스프레퀸 수익 업데이트"
                                                secondary="4시간 전"
                                            />
                                        </ListItem>
                                        <ListItem>
                                            <ListItemText
                                                primary="새로운 일정 추가"
                                                secondary="1일 전"
                                            />
                                        </ListItem>
                                    </List>
                                </CardContent>
                            </Card>
                        </Box>
                    </Box>
                </Box>
            )}

            {/* 다이얼로그 */}
            <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                <DialogTitle>
                    {dialogType === 'streamer' && '스트리머 관리'}
                    {dialogType === 'schedule' && '방송 일정 관리'}
                    {dialogType === 'revenue' && '수익 관리'}
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary">
                        {dialogType === 'streamer' && '스트리머 정보를 편집하거나 새로운 스트리머를 추가할 수 있습니다.'}
                        {dialogType === 'schedule' && '방송 일정을 관리하고 새로운 방송을 예약할 수 있습니다.'}
                        {dialogType === 'revenue' && '수익 데이터를 확인하고 관리할 수 있습니다.'}
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>닫기</Button>
                    <Button variant="contained">저장</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default StreamerManagerSystem;
