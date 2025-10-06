/**
 * 🛠️ 관리자 대시보드
 * 
 * 시스템 관리자를 위한 통합 관리 대시보드
 * 사용자 관리, 콘텐츠 관리, 시스템 모니터링, 통계 분석
 * 
 * @author AUTOAGENTS Manager
 * @version 1.0.0
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
    Grid,
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
    Tooltip,
    Chip,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel
} from '@mui/material';
import {
    Dashboard as DashboardIcon,
    People as PeopleIcon,
    Article as ArticleIcon,
    Analytics as AnalyticsIcon,
    Settings as SettingsIcon,
    Security as SecurityIcon,
    Notifications as NotificationIcon,
    TrendingUp as TrendingIcon,
    Warning as WarningIcon,
    CheckCircle as CheckIcon,
    Cancel as CancelIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Add as AddIcon,
    Visibility as ViewIcon,
    Block as BlockIcon,
    VerifiedUser as VerifiedIcon,
    AdminPanelSettings as AdminIcon,
    Gavel as ModerationIcon,
    Speed as SpeedIcon,
    Storage as StorageIcon,
    NetworkCheck as NetworkIcon
} from '@mui/icons-material';

// 타입 정의
interface User {
    id: string;
    username: string;
    email: string;
    role: 'admin' | 'moderator' | 'user' | 'vip';
    status: 'active' | 'suspended' | 'banned';
    joinDate: string;
    lastActive: string;
    postCount: number;
    commentCount: number;
    avatar: string;
    isVerified: boolean;
}

interface Content {
    id: string;
    title: string;
    author: string;
    type: 'post' | 'comment' | 'media';
    status: 'published' | 'pending' | 'rejected' | 'flagged';
    createdAt: string;
    views: number;
    likes: number;
    reports: number;
}

interface SystemStats {
    totalUsers: number;
    activeUsers: number;
    totalPosts: number;
    totalComments: number;
    systemLoad: number;
    storageUsed: number;
    networkLatency: number;
}

interface ModerationAction {
    id: string;
    type: 'approve' | 'reject' | 'delete' | 'suspend';
    target: string;
    moderator: string;
    reason: string;
    timestamp: string;
}

const AdminDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState(0);
    const [users, setUsers] = useState<User[]>([]);
    const [content, setContent] = useState<Content[]>([]);
    const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
    const [moderationActions, setModerationActions] = useState<ModerationAction[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogType, setDialogType] = useState<'user' | 'content' | 'system'>('user');

    // 모의 데이터 초기화
    useEffect(() => {
        const mockUsers: User[] = [
            {
                id: '1',
                username: 'admin_user',
                email: 'admin@example.com',
                role: 'admin',
                status: 'active',
                joinDate: '2024-01-15',
                lastActive: '2025-01-02',
                postCount: 45,
                commentCount: 156,
                avatar: '👑',
                isVerified: true
            },
            {
                id: '2',
                username: 'moderator_pro',
                email: 'mod@example.com',
                role: 'moderator',
                status: 'active',
                joinDate: '2024-02-20',
                lastActive: '2025-01-02',
                postCount: 23,
                commentCount: 89,
                avatar: '🛡️',
                isVerified: true
            },
            {
                id: '3',
                username: 'regular_user',
                email: 'user@example.com',
                role: 'user',
                status: 'active',
                joinDate: '2024-03-10',
                lastActive: '2025-01-01',
                postCount: 12,
                commentCount: 34,
                avatar: '👤',
                isVerified: false
            }
        ];

        const mockContent: Content[] = [
            {
                id: '1',
                title: '새로운 게임 리뷰',
                author: 'gamer_pro',
                type: 'post',
                status: 'published',
                createdAt: '2025-01-02',
                views: 1250,
                likes: 89,
                reports: 0
            },
            {
                id: '2',
                title: '부적절한 댓글',
                author: 'spam_user',
                type: 'comment',
                status: 'flagged',
                createdAt: '2025-01-02',
                views: 45,
                likes: 2,
                reports: 5
            }
        ];

        const mockSystemStats: SystemStats = {
            totalUsers: 15420,
            activeUsers: 3240,
            totalPosts: 45670,
            totalComments: 234560,
            systemLoad: 65,
            storageUsed: 78,
            networkLatency: 45
        };

        const mockModerationActions: ModerationAction[] = [
            {
                id: '1',
                type: 'approve',
                target: '새로운 게임 리뷰',
                moderator: 'admin_user',
                reason: '게임 관련 유용한 정보',
                timestamp: '2025-01-02T10:30:00Z'
            },
            {
                id: '2',
                type: 'reject',
                target: '부적절한 댓글',
                moderator: 'moderator_pro',
                reason: '스팸 및 부적절한 내용',
                timestamp: '2025-01-02T09:15:00Z'
            }
        ];

        setUsers(mockUsers);
        setContent(mockContent);
        setSystemStats(mockSystemStats);
        setModerationActions(mockModerationActions);
    }, []);

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
    };

    const handleOpenDialog = (type: 'user' | 'content' | 'system', item?: any) => {
        setDialogType(type);
        setSelectedItem(item || null);
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setSelectedItem(null);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active':
            case 'published': return 'success';
            case 'suspended':
            case 'pending': return 'warning';
            case 'banned':
            case 'rejected': return 'error';
            case 'flagged': return 'error';
            default: return 'default';
        }
    };

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'admin': return 'error';
            case 'moderator': return 'warning';
            case 'vip': return 'info';
            case 'user': return 'default';
            default: return 'default';
        }
    };

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat('ko-KR').format(num);
    };

    return (
        <Box sx={{ p: 4 }}>
            <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AdminIcon />
                관리자 대시보드
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
                시스템 관리 및 모니터링을 위한 통합 관리 대시보드
            </Typography>

            {/* 시스템 통계 카드 */}
            {systemStats && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 3 }}>
                    <Card sx={{ flex: '1 1 200px', minWidth: 200 }}>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <PeopleIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                            <Typography variant="h4" color="primary">
                                {formatNumber(systemStats.totalUsers)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                총 사용자
                            </Typography>
                            <Typography variant="caption" color="success.main">
                                활성: {formatNumber(systemStats.activeUsers)}
                            </Typography>
                        </CardContent>
                    </Card>
                    <Card sx={{ flex: '1 1 200px', minWidth: 200 }}>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <ArticleIcon sx={{ fontSize: 40, color: 'secondary.main', mb: 1 }} />
                            <Typography variant="h4" color="secondary">
                                {formatNumber(systemStats.totalPosts)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                총 게시물
                            </Typography>
                            <Typography variant="caption" color="info.main">
                                댓글: {formatNumber(systemStats.totalComments)}
                            </Typography>
                        </CardContent>
                    </Card>
                    <Card sx={{ flex: '1 1 200px', minWidth: 200 }}>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <SpeedIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                            <Typography variant="h4" color="warning.main">
                                {systemStats.systemLoad}%
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                시스템 로드
                            </Typography>
                            <LinearProgress
                                variant="determinate"
                                value={systemStats.systemLoad}
                                sx={{ mt: 1, height: 6, borderRadius: 3 }}
                            />
                        </CardContent>
                    </Card>
                    <Card sx={{ flex: '1 1 200px', minWidth: 200 }}>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <StorageIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
                            <Typography variant="h4" color="info.main">
                                {systemStats.storageUsed}%
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                저장소 사용률
                            </Typography>
                            <LinearProgress
                                variant="determinate"
                                value={systemStats.storageUsed}
                                color="info"
                                sx={{ mt: 1, height: 6, borderRadius: 3 }}
                            />
                        </CardContent>
                    </Card>
                </Box>
            )}

            <Paper sx={{ mb: 3 }}>
                <Tabs value={activeTab} onChange={handleTabChange} aria-label="admin tabs">
                    <Tab label="사용자 관리" icon={<PeopleIcon />} />
                    <Tab label="콘텐츠 관리" icon={<ArticleIcon />} />
                    <Tab label="시스템 모니터링" icon={<AnalyticsIcon />} />
                    <Tab label="관리 작업" icon={<ModerationIcon />} />
                </Tabs>
            </Paper>

            {/* 사용자 관리 탭 */}
            {activeTab === 0 && (
                <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h6">사용자 관리</Typography>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => handleOpenDialog('user')}
                        >
                            사용자 추가
                        </Button>
                    </Box>

                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>사용자</TableCell>
                                    <TableCell>역할</TableCell>
                                    <TableCell>상태</TableCell>
                                    <TableCell>활동</TableCell>
                                    <TableCell>가입일</TableCell>
                                    <TableCell>액션</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {users.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                                                    {user.avatar}
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="subtitle2">
                                                        {user.username}
                                                        {user.isVerified && (
                                                            <VerifiedIcon sx={{ ml: 1, fontSize: 16, color: 'primary.main' }} />
                                                        )}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {user.email}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={user.role}
                                                color={getRoleColor(user.role)}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={user.status}
                                                color={getStatusColor(user.status)}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                게시물: {user.postCount} | 댓글: {user.commentCount}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>{user.joinDate}</TableCell>
                                        <TableCell>
                                            <IconButton size="small" onClick={() => handleOpenDialog('user', user)}>
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton size="small">
                                                <BlockIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            )}

            {/* 콘텐츠 관리 탭 */}
            {activeTab === 1 && (
                <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h6">콘텐츠 관리</Typography>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => handleOpenDialog('content')}
                        >
                            콘텐츠 추가
                        </Button>
                    </Box>

                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>제목</TableCell>
                                    <TableCell>작성자</TableCell>
                                    <TableCell>타입</TableCell>
                                    <TableCell>상태</TableCell>
                                    <TableCell>통계</TableCell>
                                    <TableCell>생성일</TableCell>
                                    <TableCell>액션</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {content.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>
                                            <Typography variant="subtitle2">
                                                {item.title}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>{item.author}</TableCell>
                                        <TableCell>
                                            <Chip label={item.type} size="small" variant="outlined" />
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={item.status}
                                                color={getStatusColor(item.status)}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                조회: {item.views} | 좋아요: {item.likes}
                                                {item.reports > 0 && (
                                                    <Chip
                                                        label={`신고: ${item.reports}`}
                                                        size="small"
                                                        color="error"
                                                        sx={{ ml: 1 }}
                                                    />
                                                )}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>{item.createdAt}</TableCell>
                                        <TableCell>
                                            <IconButton size="small" onClick={() => handleOpenDialog('content', item)}>
                                                <ViewIcon />
                                            </IconButton>
                                            <IconButton size="small">
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton size="small">
                                                <DeleteIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            )}

            {/* 시스템 모니터링 탭 */}
            {activeTab === 2 && (
                <Box>
                    <Typography variant="h6" gutterBottom>시스템 모니터링</Typography>

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                        <Card sx={{ flex: '1 1 400px', minWidth: 400 }}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <SpeedIcon color="primary" />
                                    성능 지표
                                </Typography>
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        시스템 로드
                                    </Typography>
                                    <LinearProgress
                                        variant="determinate"
                                        value={systemStats?.systemLoad || 0}
                                        sx={{ height: 8, borderRadius: 4 }}
                                    />
                                    <Typography variant="body2" sx={{ mt: 1 }}>
                                        {systemStats?.systemLoad}% (정상 범위: 0-80%)
                                    </Typography>
                                </Box>
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        저장소 사용률
                                    </Typography>
                                    <LinearProgress
                                        variant="determinate"
                                        value={systemStats?.storageUsed || 0}
                                        color="warning"
                                        sx={{ height: 8, borderRadius: 4 }}
                                    />
                                    <Typography variant="body2" sx={{ mt: 1 }}>
                                        {systemStats?.storageUsed}% (경고 임계값: 85%)
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        네트워크 지연시간
                                    </Typography>
                                    <LinearProgress
                                        variant="determinate"
                                        value={systemStats?.networkLatency || 0}
                                        color="info"
                                        sx={{ height: 8, borderRadius: 4 }}
                                    />
                                    <Typography variant="body2" sx={{ mt: 1 }}>
                                        {systemStats?.networkLatency}ms (목표: &lt;50ms)
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>
                        <Card sx={{ flex: '1 1 400px', minWidth: 400 }}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <NotificationIcon color="primary" />
                                    시스템 알림
                                </Typography>
                                <List>
                                    <ListItem>
                                        <ListItemText
                                            primary="시스템 업데이트 완료"
                                            secondary="2시간 전"
                                        />
                                        <Chip label="정보" size="small" color="info" />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemText
                                            primary="저장소 사용률 경고"
                                            secondary="1일 전"
                                        />
                                        <Chip label="경고" size="small" color="warning" />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemText
                                            primary="백업 완료"
                                            secondary="3일 전"
                                        />
                                        <Chip label="성공" size="small" color="success" />
                                    </ListItem>
                                </List>
                            </CardContent>
                        </Card>
                    </Box>
                </Box>
            )}

            {/* 관리 작업 탭 */}
            {activeTab === 3 && (
                <Box>
                    <Typography variant="h6" gutterBottom>관리 작업 기록</Typography>

                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>작업 유형</TableCell>
                                    <TableCell>대상</TableCell>
                                    <TableCell>담당자</TableCell>
                                    <TableCell>사유</TableCell>
                                    <TableCell>시간</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {moderationActions.map((action) => (
                                    <TableRow key={action.id}>
                                        <TableCell>
                                            <Chip
                                                label={action.type}
                                                color={action.type === 'approve' ? 'success' : 'error'}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>{action.target}</TableCell>
                                        <TableCell>{action.moderator}</TableCell>
                                        <TableCell>{action.reason}</TableCell>
                                        <TableCell>
                                            {new Date(action.timestamp).toLocaleString('ko-KR')}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            )}

            {/* 다이얼로그 */}
            <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                <DialogTitle>
                    {dialogType === 'user' && '사용자 관리'}
                    {dialogType === 'content' && '콘텐츠 관리'}
                    {dialogType === 'system' && '시스템 설정'}
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary">
                        {dialogType === 'user' && '사용자 정보를 편집하거나 새로운 사용자를 추가할 수 있습니다.'}
                        {dialogType === 'content' && '콘텐츠를 관리하고 새로운 콘텐츠를 추가할 수 있습니다.'}
                        {dialogType === 'system' && '시스템 설정을 관리할 수 있습니다.'}
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

export default AdminDashboard;
