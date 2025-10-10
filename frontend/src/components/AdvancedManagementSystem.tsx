/**
 * Community Platform v1.3 - 고도화된 관리 시스템
 * 고객/커뮤니티/VIP/스트리머/코스플레이어 통합 관리
 */

import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Button,
    Tabs,
    Tab,
    Chip,
    IconButton,
    Tooltip,
    Badge,
    Paper,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    ListItemSecondaryAction,
    Divider,
    Alert,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Switch,
    Avatar,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Menu,
    MenuList,
    ListItemButton
} from '@mui/material';
import {
    People,
    Groups,
    Star,
    LiveTv,
    TheaterComedy,
    Settings,
    Analytics,
    Notifications,
    Security,
    Speed,
    TrendingUp,
    AdminPanelSettings,
    SupervisorAccount,
    PersonAdd,
    Edit,
    Delete,
    MoreVert,
    Search,
    FilterList,
    Download,
    Upload,
    Refresh,
    Visibility,
    Block,
    CheckCircle,
    Warning,
    Info
} from '@mui/icons-material';

// 사용자 타입 정의
interface User {
    id: string;
    name: string;
    email: string;
    type: 'customer' | 'community' | 'vip' | 'streamer' | 'cosplayer';
    status: 'active' | 'inactive' | 'suspended' | 'pending';
    joinDate: Date;
    lastActive: Date;
    stats: {
        posts: number;
        followers: number;
        engagement: number;
        revenue?: number;
    };
    permissions: string[];
    avatar?: string;
}

interface ManagementStats {
    totalUsers: number;
    activeUsers: number;
    newUsers: number;
    revenue: number;
    engagement: number;
}

const AdvancedManagementSystem: React.FC = () => {
    const [activeTab, setActiveTab] = useState(0);
    const [users, setUsers] = useState<User[]>([]);
    const [stats, setStats] = useState<ManagementStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [showUserDialog, setShowUserDialog] = useState(false);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');

    const userTypes = [
        { value: 'customer', label: '고객', icon: <People />, color: 'primary' },
        { value: 'community', label: '커뮤니티', icon: <Groups />, color: 'success' },
        { value: 'vip', label: 'VIP', icon: <Star />, color: 'warning' },
        { value: 'streamer', label: '스트리머', icon: <LiveTv />, color: 'info' },
        { value: 'cosplayer', label: '코스플레이어', icon: <TheaterComedy />, color: 'secondary' }
    ];

    useEffect(() => {
        initializeData();
    }, []);

    const initializeData = async () => {
        setLoading(true);
        try {
            // 모의 사용자 데이터
            const mockUsers: User[] = [
                {
                    id: '1',
                    name: '김고객',
                    email: 'customer@example.com',
                    type: 'customer',
                    status: 'active',
                    joinDate: new Date('2024-01-15'),
                    lastActive: new Date(),
                    stats: { posts: 25, followers: 120, engagement: 78.5 },
                    permissions: ['read', 'comment'],
                    avatar: '/api/placeholder/40/40'
                },
                {
                    id: '2',
                    name: '이커뮤니티',
                    email: 'community@example.com',
                    type: 'community',
                    status: 'active',
                    joinDate: new Date('2024-02-20'),
                    lastActive: new Date(),
                    stats: { posts: 150, followers: 500, engagement: 85.2 },
                    permissions: ['read', 'write', 'moderate'],
                    avatar: '/api/placeholder/40/40'
                },
                {
                    id: '3',
                    name: '박VIP',
                    email: 'vip@example.com',
                    type: 'vip',
                    status: 'active',
                    joinDate: new Date('2024-01-10'),
                    lastActive: new Date(),
                    stats: { posts: 300, followers: 1200, engagement: 92.1, revenue: 50000 },
                    permissions: ['read', 'write', 'moderate', 'admin'],
                    avatar: '/api/placeholder/40/40'
                },
                {
                    id: '4',
                    name: '최스트리머',
                    email: 'streamer@example.com',
                    type: 'streamer',
                    status: 'active',
                    joinDate: new Date('2024-03-05'),
                    lastActive: new Date(),
                    stats: { posts: 80, followers: 2000, engagement: 88.7, revenue: 120000 },
                    permissions: ['read', 'write', 'stream', 'monetize'],
                    avatar: '/api/placeholder/40/40'
                },
                {
                    id: '5',
                    name: '정코스플레이어',
                    email: 'cosplayer@example.com',
                    type: 'cosplayer',
                    status: 'active',
                    joinDate: new Date('2024-02-28'),
                    lastActive: new Date(),
                    stats: { posts: 200, followers: 800, engagement: 81.3, revenue: 30000 },
                    permissions: ['read', 'write', 'gallery', 'shop'],
                    avatar: '/api/placeholder/40/40'
                }
            ];

            const mockStats: ManagementStats = {
                totalUsers: mockUsers.length,
                activeUsers: mockUsers.filter(u => u.status === 'active').length,
                newUsers: 15,
                revenue: 200000,
                engagement: 85.2
            };

            setUsers(mockUsers);
            setStats(mockStats);
        } catch (error) {
            console.error('데이터 초기화 실패:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'success';
            case 'inactive': return 'default';
            case 'suspended': return 'error';
            case 'pending': return 'warning';
            default: return 'default';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'active': return '활성';
            case 'inactive': return '비활성';
            case 'suspended': return '정지';
            case 'pending': return '대기';
            default: return '알 수 없음';
        }
    };

    const getTypeInfo = (type: string) => {
        return userTypes.find(t => t.value === type) || userTypes[0];
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterType === 'all' || user.type === filterType;
        return matchesSearch && matchesFilter;
    });

    const handleChangePage = (event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" component="h1" gutterBottom>
                🛠️ 고도화된 관리 시스템
            </Typography>

            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                고객, 커뮤니티, VIP, 스트리머, 코스플레이어 통합 관리 시스템
            </Typography>

            {/* 통계 카드 */}
            {stats && (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 3, mb: 3 }}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <People sx={{ mr: 1, color: 'primary.main' }} />
                                <Typography variant="h6">총 사용자</Typography>
                            </Box>
                            <Typography variant="h4" color="primary.main">
                                {stats.totalUsers.toLocaleString()}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                등록된 사용자
                            </Typography>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <CheckCircle sx={{ mr: 1, color: 'success.main' }} />
                                <Typography variant="h6">활성 사용자</Typography>
                            </Box>
                            <Typography variant="h4" color="success.main">
                                {stats.activeUsers.toLocaleString()}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                현재 활성 상태
                            </Typography>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <TrendingUp sx={{ mr: 1, color: 'warning.main' }} />
                                <Typography variant="h6">신규 사용자</Typography>
                            </Box>
                            <Typography variant="h4" color="warning.main">
                                +{stats.newUsers}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                이번 주 신규
                            </Typography>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <Speed sx={{ mr: 1, color: 'info.main' }} />
                                <Typography variant="h6">평균 참여도</Typography>
                            </Box>
                            <Typography variant="h4" color="info.main">
                                {stats.engagement}%
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                사용자 참여율
                            </Typography>
                        </CardContent>
                    </Card>
                </Box>
            )}

            {/* 사용자 타입 탭 */}
            <Paper sx={{ mb: 3 }}>
                <Tabs
                    value={activeTab}
                    onChange={handleTabChange}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{ borderBottom: 1, borderColor: 'divider' }}
                >
                    <Tab
                        label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <People />
                                전체
                                <Badge badgeContent={users.length} color="primary" />
                            </Box>
                        }
                    />
                    {userTypes.map((type) => (
                        <Tab
                            key={type.value}
                            label={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    {type.icon}
                                    {type.label}
                                    <Badge
                                        badgeContent={users.filter(u => u.type === type.value).length}
                                        color={type.color as any}
                                    />
                                </Box>
                            }
                        />
                    ))}
                </Tabs>

                {/* 검색 및 필터 */}
                <Box sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
                    <TextField
                        placeholder="사용자 검색..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                            startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                        }}
                        sx={{ flexGrow: 1 }}
                    />
                    <FormControl sx={{ minWidth: 120 }}>
                        <InputLabel>타입</InputLabel>
                        <Select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            label="타입"
                        >
                            <MenuItem value="all">전체</MenuItem>
                            {userTypes.map((type) => (
                                <MenuItem key={type.value} value={type.value}>
                                    {type.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <IconButton>
                        <FilterList />
                    </IconButton>
                    <IconButton>
                        <Refresh />
                    </IconButton>
                </Box>

                {/* 사용자 테이블 */}
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>사용자</TableCell>
                                <TableCell>타입</TableCell>
                                <TableCell>상태</TableCell>
                                <TableCell>가입일</TableCell>
                                <TableCell>마지막 활동</TableCell>
                                <TableCell>통계</TableCell>
                                <TableCell>액션</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredUsers
                                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                .map((user) => {
                                    const typeInfo = getTypeInfo(user.type);
                                    return (
                                        <TableRow key={user.id} hover>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <Avatar
                                                        src={user.avatar}
                                                        sx={{ width: 40, height: 40, mr: 2 }}
                                                    >
                                                        {user.name[0]}
                                                    </Avatar>
                                                    <Box>
                                                        <Typography variant="subtitle2">
                                                            {user.name}
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            {user.email}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    icon={typeInfo.icon}
                                                    label={typeInfo.label}
                                                    color={typeInfo.color as any}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={getStatusText(user.status)}
                                                    color={getStatusColor(user.status)}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                {user.joinDate.toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                                {user.lastActive.toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                                <Box>
                                                    <Typography variant="body2">
                                                        게시물: {user.stats.posts}
                                                    </Typography>
                                                    <Typography variant="body2">
                                                        팔로워: {user.stats.followers}
                                                    </Typography>
                                                    <Typography variant="body2">
                                                        참여도: {user.stats.engagement}%
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <IconButton
                                                    onClick={() => {
                                                        setSelectedUser(user);
                                                        setShowUserDialog(true);
                                                    }}
                                                >
                                                    <Visibility />
                                                </IconButton>
                                                <IconButton>
                                                    <Edit />
                                                </IconButton>
                                                <IconButton>
                                                    <MoreVert />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                        </TableBody>
                    </Table>
                </TableContainer>

                <TablePagination
                    rowsPerPageOptions={[5, 10, 25]}
                    component="div"
                    count={filteredUsers.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                />
            </Paper>

            {/* 사용자 상세 다이얼로그 */}
            <Dialog
                open={showUserDialog}
                onClose={() => setShowUserDialog(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    사용자 상세 정보
                    {selectedUser && (
                        <Chip
                            label={getTypeInfo(selectedUser.type).label}
                            color={getTypeInfo(selectedUser.type).color as any}
                            sx={{ ml: 2 }}
                        />
                    )}
                </DialogTitle>
                <DialogContent>
                    {selectedUser && (
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 2fr' }, gap: 3 }}>
                            <Box sx={{ textAlign: 'center' }}>
                                <Avatar
                                    src={selectedUser.avatar}
                                    sx={{ width: 100, height: 100, mx: 'auto', mb: 2 }}
                                >
                                    {selectedUser.name[0]}
                                </Avatar>
                                <Typography variant="h6">{selectedUser.name}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {selectedUser.email}
                                </Typography>
                            </Box>
                            <Box>
                                <Typography variant="h6" gutterBottom>
                                    기본 정보
                                </Typography>
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        가입일: {selectedUser.joinDate.toLocaleDateString()}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        마지막 활동: {selectedUser.lastActive.toLocaleDateString()}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        상태: {getStatusText(selectedUser.status)}
                                    </Typography>
                                </Box>

                                <Typography variant="h6" gutterBottom>
                                    통계
                                </Typography>
                                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">
                                            게시물
                                        </Typography>
                                        <Typography variant="h6">
                                            {selectedUser.stats.posts}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">
                                            팔로워
                                        </Typography>
                                        <Typography variant="h6">
                                            {selectedUser.stats.followers}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">
                                            참여도
                                        </Typography>
                                        <Typography variant="h6">
                                            {selectedUser.stats.engagement}%
                                        </Typography>
                                    </Box>
                                    {selectedUser.stats.revenue && (
                                        <Box>
                                            <Typography variant="body2" color="text.secondary">
                                                수익
                                            </Typography>
                                            <Typography variant="h6">
                                                ₩{selectedUser.stats.revenue.toLocaleString()}
                                            </Typography>
                                        </Box>
                                    )}
                                </Box>

                                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                                    권한
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                    {selectedUser.permissions.map((permission, index) => (
                                        <Chip
                                            key={index}
                                            label={permission}
                                            size="small"
                                            color="primary"
                                            variant="outlined"
                                        />
                                    ))}
                                </Box>
                            </Box>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowUserDialog(false)}>
                        닫기
                    </Button>
                    <Button variant="contained" startIcon={<Edit />}>
                        편집
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default AdvancedManagementSystem;
