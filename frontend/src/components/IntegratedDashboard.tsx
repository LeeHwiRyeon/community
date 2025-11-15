/**
 * Community Platform v1.3 - 통합 대시보드
 * 4개 핵심 모듈과 고도화된 관리 시스템의 통합 대시보드
 */

import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Button,
    Paper,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Divider,
    Chip,
    IconButton,
    Tooltip,
    Badge,
    Alert,
    CircularProgress,
    Drawer,
    ListItemButton,
    AppBar,
    Toolbar,
    Avatar,
    Menu,
    Grid,
    MenuItem
} from '@mui/material';

import {
    Dashboard,
    Newspaper,
    Groups,
    LiveTv,
    TheaterComedy,
    People,
    Star,
    Settings,
    Analytics,
    Notifications,
    Security,
    Speed,
    TrendingUp,
    Menu as MenuIcon,
    AccountCircle,
    Logout,
    Refresh,
    Warning,
    CheckCircle,
    Info
} from '@mui/icons-material';
import CoreModulesIntegration from './CoreModulesIntegration';
import AdvancedManagementSystem from './AdvancedManagementSystem';

interface DashboardStats {
    totalUsers: number;
    activeModules: number;
    totalRevenue: number;
    systemHealth: number;
    recentActivity: Activity[];
}

interface Activity {
    id: string;
    type: 'user' | 'content' | 'system' | 'security';
    message: string;
    timestamp: Date;
    severity: 'info' | 'warning' | 'error' | 'success';
}

const IntegratedDashboard: React.FC = () => {
    const [currentView, setCurrentView] = useState('overview');
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const menuItems = [
        { id: 'overview', label: '개요', icon: <Dashboard /> },
        { id: 'modules', label: '핵심 모듈', icon: <Newspaper /> },
        { id: 'management', label: '관리 시스템', icon: <People /> },
        { id: 'analytics', label: '분석', icon: <Analytics /> },
        { id: 'settings', label: '설정', icon: <Settings /> }
    ];

    useEffect(() => {
        initializeDashboard();
    }, []);

    const initializeDashboard = async () => {
        setLoading(true);
        try {
            // 모의 대시보드 데이터
            const mockStats: DashboardStats = {
                totalUsers: 4880,
                activeModules: 4,
                totalRevenue: 250000,
                systemHealth: 98.5,
                recentActivity: [
                    {
                        id: '1',
                        type: 'user',
                        message: '새로운 VIP 사용자가 가입했습니다',
                        timestamp: new Date(Date.now() - 300000),
                        severity: 'success'
                    },
                    {
                        id: '2',
                        type: 'content',
                        message: '뉴스 모듈에서 15개의 새 콘텐츠가 생성되었습니다',
                        timestamp: new Date(Date.now() - 600000),
                        severity: 'info'
                    },
                    {
                        id: '3',
                        type: 'system',
                        message: '시스템 성능이 최적화되었습니다',
                        timestamp: new Date(Date.now() - 900000),
                        severity: 'success'
                    },
                    {
                        id: '4',
                        type: 'security',
                        message: '보안 스캔이 완료되었습니다',
                        timestamp: new Date(Date.now() - 1200000),
                        severity: 'info'
                    }
                ]
            };

            setStats(mockStats);
        } catch (error) {
            console.error('대시보드 초기화 실패:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const getSeverityIcon = (severity: string) => {
        switch (severity) {
            case 'success': return <CheckCircle color="success" />;
            case 'warning': return <Warning color="warning" />;
            case 'error': return <Warning color="error" />;
            case 'info': return <Info color="info" />;
            default: return <Info />;
        }
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'success': return 'success';
            case 'warning': return 'warning';
            case 'error': return 'error';
            case 'info': return 'info';
            default: return 'default';
        }
    };

    const renderOverview = () => (
        <Box>
            <Typography variant="h5" gutterBottom>
                📊 시스템 개요
            </Typography>

            {stats && (
                <>
                    {/* 주요 통계 */}
                    <Grid container spacing={3} sx={{ mb: 3 }}>
                        <Box sx={{ width: { xs: '100%', sm: '50%', md: '25%' }, p: 1 }}>
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
                        </Box>

                        <Box sx={{ width: { xs: '100%', sm: '50%', md: '25%' }, p: 1 }}>
                            <Card>
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                        <Dashboard sx={{ mr: 1, color: 'success.main' }} />
                                        <Typography variant="h6">활성 모듈</Typography>
                                    </Box>
                                    <Typography variant="h4" color="success.main">
                                        {stats.activeModules}/4
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        핵심 모듈
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Box>

                        <Box sx={{ width: { xs: '100%', sm: '50%', md: '25%' }, p: 1 }}>
                            <Card>
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                        <TrendingUp sx={{ mr: 1, color: 'warning.main' }} />
                                        <Typography variant="h6">총 수익</Typography>
                                    </Box>
                                    <Typography variant="h4" color="warning.main">
                                        ₩{stats.totalRevenue.toLocaleString()}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        이번 달 수익
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Box>

                        <Box sx={{ width: { xs: '100%', sm: '50%', md: '25%' }, p: 1 }}>
                            <Card>
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                        <Speed sx={{ mr: 1, color: 'info.main' }} />
                                        <Typography variant="h6">시스템 건강도</Typography>
                                    </Box>
                                    <Typography variant="h4" color="info.main">
                                        {stats.systemHealth}%
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        전체 성능
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Box>
                    </Grid>

                    {/* 최근 활동 */}
                    <Grid container spacing={3}>
                        <Box sx={{ width: { xs: '100%', md: '66.66%' }, p: 1 }}>
                            <Card>
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                        <Typography variant="h6">최근 활동</Typography>
                                        <IconButton>
                                            <Refresh />
                                        </IconButton>
                                    </Box>
                                    <List>
                                        {stats.recentActivity.map((activity, index) => (
                                            <React.Fragment key={activity.id}>
                                                <ListItem>
                                                    <ListItemIcon>
                                                        {getSeverityIcon(activity.severity)}
                                                    </ListItemIcon>
                                                    <ListItemText
                                                        primary={activity.message}
                                                        secondary={activity.timestamp.toLocaleString()}
                                                    />
                                                    <Chip
                                                        label={activity.type}
                                                        color={getSeverityColor(activity.severity)}
                                                        size="small"
                                                    />
                                                </ListItem>
                                                {index < stats.recentActivity.length - 1 && <Divider />}
                                            </React.Fragment>
                                        ))}
                                    </List>
                                </CardContent>
                            </Card>
                        </Box>

                        <Box sx={{ width: { xs: '100%', md: '33.33%' }, p: 1 }}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        빠른 액션
                                    </Typography>
                                    <List>
                                        <ListItemButton onClick={() => setCurrentView('modules')}>
                                            <ListItemIcon>
                                                <Newspaper />
                                            </ListItemIcon>
                                            <ListItemText primary="모듈 관리" />
                                        </ListItemButton>
                                        <ListItemButton onClick={() => setCurrentView('management')}>
                                            <ListItemIcon>
                                                <People />
                                            </ListItemIcon>
                                            <ListItemText primary="사용자 관리" />
                                        </ListItemButton>
                                        <ListItemButton>
                                            <ListItemIcon>
                                                <Analytics />
                                            </ListItemIcon>
                                            <ListItemText primary="분석 보기" />
                                        </ListItemButton>
                                        <ListItemButton>
                                            <ListItemIcon>
                                                <Settings />
                                            </ListItemIcon>
                                            <ListItemText primary="설정" />
                                        </ListItemButton>
                                    </List>
                                </CardContent>
                            </Card>
                        </Box>
                    </Grid>
                </>
            )}
        </Box>
    );

    const renderCurrentView = () => {
        switch (currentView) {
            case 'overview':
                return renderOverview();
            case 'modules':
                return <CoreModulesIntegration />;
            case 'management':
                return <AdvancedManagementSystem />;
            case 'analytics':
                return (
                    <Box>
                        <Typography variant="h5" gutterBottom>
                            📈 분석 대시보드
                        </Typography>
                        <Alert severity="info">
                            분석 기능은 개발 중입니다. 곧 제공될 예정입니다.
                        </Alert>
                    </Box>
                );
            case 'settings':
                return (
                    <Box>
                        <Typography variant="h5" gutterBottom>
                            ⚙️ 시스템 설정
                        </Typography>
                        <Alert severity="info">
                            설정 기능은 개발 중입니다. 곧 제공될 예정입니다.
                        </Alert>
                    </Box>
                );
            default:
                return renderOverview();
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            {/* 사이드바 */}
            <Drawer
                variant="permanent"
                sx={{
                    width: 240,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: 240,
                        boxSizing: 'border-box',
                    },
                }}
            >
                <Toolbar>
                    <Typography variant="h6" noWrap component="div">
                        Community v1.3
                    </Typography>
                </Toolbar>
                <Divider />
                <List>
                    {menuItems.map((item) => (
                        <ListItem key={item.id} disablePadding>
                            <ListItemButton
                                selected={currentView === item.id}
                                onClick={() => setCurrentView(item.id)}
                            >
                                <ListItemIcon>
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText primary={item.label} />
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>
            </Drawer>

            {/* 메인 콘텐츠 */}
            <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
                {/* 상단 앱바 */}
                <AppBar position="static" elevation={0} sx={{ mb: 3 }}>
                    <Toolbar>
                        <IconButton
                            edge="start"
                            color="inherit"
                            aria-label="menu"
                            sx={{ mr: 2 }}
                        >
                            <MenuIcon />
                        </IconButton>
                        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                            {menuItems.find(item => item.id === currentView)?.label || '대시보드'}
                        </Typography>
                        <IconButton color="inherit">
                            <Badge badgeContent={4} color="error">
                                <Notifications />
                            </Badge>
                        </IconButton>
                        <IconButton
                            color="inherit"
                            onClick={handleMenuOpen}
                        >
                            <AccountCircle />
                        </IconButton>
                        <Menu
                            anchorEl={anchorEl}
                            open={Boolean(anchorEl)}
                            onClose={handleMenuClose}
                        >
                            <MenuItem onClick={handleMenuClose}>프로필</MenuItem>
                            <MenuItem onClick={handleMenuClose}>설정</MenuItem>
                            <Divider />
                            <MenuItem onClick={handleMenuClose}>로그아웃</MenuItem>
                        </Menu>
                    </Toolbar>
                </AppBar>

                {/* 현재 뷰 렌더링 */}
                {renderCurrentView()}
            </Box>
        </Box>
    );
};

export default IntegratedDashboard;
