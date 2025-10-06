import React, { useState } from 'react';
import {
    AppBar,
    Toolbar,
    Typography,
    Button,
    Box,
    Menu,
    MenuItem,
    IconButton,
    Drawer,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Divider,
    useTheme,
    useMediaQuery
} from '@mui/material';
import {
    Menu as MenuIcon,
    Home as HomeIcon,
    Groups as CommunitiesIcon,
    Article as NewsIcon,
    SportsEsports as GamesIcon,
    LiveTv as StreamingIcon,
    TheaterComedy as CosplayIcon,
    Chat as ChatIcon,
    AdminPanelSettings as AdminIcon,
    Login as LoginIcon,
    Person as PersonIcon,
    Edit as EditIcon,
    People as PeopleIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const Navbar: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const [mobileOpen, setMobileOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleNavigation = (path: string) => {
        navigate(path);
        setMobileOpen(false);
        handleMenuClose();
    };

    // 주요 4개 커뮤니티 (순서 고정)
    const mainCommunities = [
        { id: 'news', name: '뉴스', icon: <NewsIcon />, path: '/communities/news', color: '#2196F3' },
        { id: 'games', name: '게임', icon: <GamesIcon />, path: '/communities/games', color: '#9C27B0' },
        { id: 'streaming', name: '방송국', icon: <StreamingIcon />, path: '/communities/streaming', color: '#FF5722' },
        { id: 'cosplay', name: '코스프레', icon: <CosplayIcon />, path: '/communities/cosplay', color: '#E91E63' }
    ];

    const drawer = (
        <Box sx={{ width: 250 }}>
            <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h6" color="primary">
                    📰 TheNewsPaper
                </Typography>
            </Box>
            <Divider />
            <List>
                <ListItem onClick={() => handleNavigation('/')} sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'action.hover' } }}>
                    <ListItemIcon><HomeIcon /></ListItemIcon>
                    <ListItemText primary="홈페이지" />
                </ListItem>
                <ListItem onClick={() => handleNavigation('/communities')} sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'action.hover' } }}>
                    <ListItemIcon><CommunitiesIcon /></ListItemIcon>
                    <ListItemText primary="커뮤니티 허브" />
                </ListItem>
                <ListItem onClick={() => handleNavigation('/rpg-profile')} sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'action.hover' } }}>
                    <ListItemIcon><PersonIcon /></ListItemIcon>
                    <ListItemText primary="RPG 프로필" />
                </ListItem>
                <ListItem onClick={() => handleNavigation('/rich-editor')} sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'action.hover' } }}>
                    <ListItemIcon><EditIcon /></ListItemIcon>
                    <ListItemText primary="리치 에디터" />
                </ListItem>
                <ListItem onClick={() => handleNavigation('/follow-system')} sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'action.hover' } }}>
                    <ListItemIcon><PeopleIcon /></ListItemIcon>
                    <ListItemText primary="팔로우 시스템" />
                </ListItem>
                <ListItem onClick={() => handleNavigation('/admin-dashboard')} sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'action.hover' } }}>
                    <ListItemIcon><AdminIcon /></ListItemIcon>
                    <ListItemText primary="관리자 대시보드" />
                </ListItem>
            </List>
            <Divider />
            <List>
                <ListItem>
                    <ListItemText
                        primary="주요 커뮤니티"
                        primaryTypographyProps={{ variant: 'subtitle2', color: 'text.secondary' }}
                    />
                </ListItem>
                {mainCommunities.map((community) => (
                    <ListItem
                        key={community.id}
                        onClick={() => handleNavigation(community.path)}
                        sx={{
                            cursor: 'pointer',
                            backgroundColor: location.pathname === community.path ? 'action.selected' : 'transparent',
                            '&:hover': { backgroundColor: 'action.hover' }
                        }}
                    >
                        <ListItemIcon sx={{ color: community.color }}>
                            {community.icon}
                        </ListItemIcon>
                        <ListItemText primary={community.name} />
                    </ListItem>
                ))}
            </List>
        </Box>
    );

    return (
        <>
            <AppBar position="static" elevation={2}>
                <Toolbar>
                    {isMobile && (
                        <IconButton
                            color="inherit"
                            aria-label="open drawer"
                            edge="start"
                            onClick={handleDrawerToggle}
                            sx={{ mr: 2 }}
                        >
                            <MenuIcon />
                        </IconButton>
                    )}

                    <Typography
                        variant="h6"
                        component="div"
                        sx={{
                            flexGrow: 1,
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}
                        onClick={() => navigate('/')}
                    >
                        📰 TheNewsPaper Community
                    </Typography>

                    {!isMobile && (
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                                color="inherit"
                                onClick={() => navigate('/')}
                                startIcon={<HomeIcon />}
                            >
                                홈페이지
                            </Button>
                            <Button
                                color="inherit"
                                onClick={() => navigate('/communities')}
                                startIcon={<CommunitiesIcon />}
                            >
                                커뮤니티 허브
                            </Button>
                            <Button
                                color="inherit"
                                onClick={handleMenuOpen}
                                startIcon={<CommunitiesIcon />}
                            >
                                커뮤니티
                            </Button>
                            <Button
                                color="inherit"
                                onClick={() => navigate('/chat-community')}
                                startIcon={<ChatIcon />}
                            >
                                채팅 커뮤니티
                            </Button>
                            <Button
                                color="inherit"
                                onClick={handleMenuOpen}
                                startIcon={<AdminIcon />}
                            >
                                관리 시스템
                            </Button>
                            <Button
                                color="inherit"
                                onClick={() => navigate('/login')}
                                startIcon={<LoginIcon />}
                            >
                                로그인
                            </Button>
                        </Box>
                    )}
                </Toolbar>
            </AppBar>

            {/* 데스크톱 커뮤니티 메뉴 */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                PaperProps={{
                    sx: { width: 200 }
                }}
            >
                {mainCommunities.map((community) => (
                    <MenuItem
                        key={community.id}
                        onClick={() => handleNavigation(community.path)}
                        sx={{
                            color: community.color,
                            '&:hover': { backgroundColor: `${community.color}10` }
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {community.icon}
                            {community.name}
                        </Box>
                    </MenuItem>
                ))}
            </Menu>

            {/* 관리 시스템 메뉴 */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                PaperProps={{
                    sx: { width: 200 }
                }}
            >
                <MenuItem onClick={() => handleNavigation('/streamer-manager')}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <StreamingIcon />
                        스트리머 매니저
                    </Box>
                </MenuItem>
                <MenuItem onClick={() => handleNavigation('/cosplayer-manager')}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CosplayIcon />
                        코스플레이어 관리
                    </Box>
                </MenuItem>
                <MenuItem onClick={() => handleNavigation('/news-manager')}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <NewsIcon />
                        뉴스 관리
                    </Box>
                </MenuItem>
                <MenuItem onClick={() => handleNavigation('/community-manager')}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CommunitiesIcon />
                        커뮤니티 관리
                    </Box>
                </MenuItem>
            </Menu>

            {/* 모바일 드로어 */}
            <Drawer
                variant="temporary"
                open={mobileOpen}
                onClose={handleDrawerToggle}
                ModalProps={{
                    keepMounted: true, // Better open performance on mobile.
                }}
                sx={{
                    display: { xs: 'block', md: 'none' },
                    '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 250 },
                }}
            >
                {drawer}
            </Drawer>
        </>
    );
};

export default Navbar;