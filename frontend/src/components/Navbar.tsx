import React, { useState, useEffect } from 'react';
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
    useMediaQuery,
    TextField,
    InputAdornment
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
    People as PeopleIcon,
    Search as SearchIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import NotificationBell from './NotificationBell';
import SimpleNotificationBell from './SimpleNotificationBell';
import DMNotification from './DM/DMNotification';
import ThemeToggleButton from './ThemeToggleButton';
import LanguageSwitcher from './i18n/LanguageSwitcher';

const Navbar: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const { t } = useTranslation();

    const [mobileOpen, setMobileOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [currentUserId, setCurrentUserId] = useState<number>(0);
    const [searchQuery, setSearchQuery] = useState<string>('');

    useEffect(() => {
        // 현재 사용자 ID 가져오기
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                setCurrentUserId(payload.id || payload.userId);
            } catch (error) {
                console.error('Failed to parse token:', error);
            }
        }
    }, []);

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

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    const handleSearchKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch(e as any);
        }
    };

    // 주요 4개 커뮤니티 (순서 고정)
    const mainCommunities = [
        { id: 'news', name: t('navbar.news'), icon: <NewsIcon />, path: '/communities/news', color: '#2196F3' },
        { id: 'games', name: t('navbar.games'), icon: <GamesIcon />, path: '/communities/games', color: '#9C27B0' },
        { id: 'streaming', name: t('navbar.streaming'), icon: <StreamingIcon />, path: '/communities/streaming', color: '#FF5722' },
        { id: 'cosplay', name: t('navbar.cosplay'), icon: <CosplayIcon />, path: '/communities/cosplay', color: '#E91E63' }
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
                    <ListItemText primary={t('common.home')} />
                </ListItem>
                <ListItem onClick={() => handleNavigation('/search')} sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'action.hover' } }}>
                    <ListItemIcon><SearchIcon /></ListItemIcon>
                    <ListItemText primary={t('common.search')} />
                </ListItem>
                <ListItem onClick={() => handleNavigation('/communities')} sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'action.hover' } }}>
                    <ListItemIcon><CommunitiesIcon /></ListItemIcon>
                    <ListItemText primary={t('navbar.communityHub')} />
                </ListItem>
                <ListItem onClick={() => handleNavigation('/rpg-profile')} sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'action.hover' } }}>
                    <ListItemIcon><PersonIcon /></ListItemIcon>
                    <ListItemText primary={t('navbar.rpgProfile')} />
                </ListItem>
                <ListItem onClick={() => handleNavigation('/rich-editor')} sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'action.hover' } }}>
                    <ListItemIcon><EditIcon /></ListItemIcon>
                    <ListItemText primary={t('navbar.richEditor')} />
                </ListItem>
                <ListItem onClick={() => handleNavigation('/follow-system')} sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'action.hover' } }}>
                    <ListItemIcon><PeopleIcon /></ListItemIcon>
                    <ListItemText primary={t('navbar.followSystem')} />
                </ListItem>
                <ListItem onClick={() => handleNavigation('/admin-dashboard')} sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'action.hover' } }}>
                    <ListItemIcon><AdminIcon /></ListItemIcon>
                    <ListItemText primary={t('navbar.adminDashboard')} />
                </ListItem>
            </List>
            <Divider />
            <List>
                <ListItem>
                    <ListItemText
                        primary={t('navbar.communities')}
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
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <TextField
                                size="small"
                                placeholder="검색..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyPress={handleSearchKeyPress}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon sx={{ fontSize: 20 }} />
                                        </InputAdornment>
                                    )
                                }}
                                inputProps={{
                                    'data-testid': 'search-bar'
                                }}
                                sx={{
                                    width: '250px',
                                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                                    borderRadius: 1,
                                    '& .MuiOutlinedInput-root': {
                                        color: 'white',
                                        '& fieldset': {
                                            borderColor: 'rgba(255, 255, 255, 0.3)',
                                        },
                                        '&:hover fieldset': {
                                            borderColor: 'rgba(255, 255, 255, 0.5)',
                                        },
                                        '&.Mui-focused fieldset': {
                                            borderColor: 'rgba(255, 255, 255, 0.7)',
                                        },
                                    },
                                    '& .MuiInputBase-input::placeholder': {
                                        color: 'rgba(255, 255, 255, 0.7)',
                                        opacity: 1,
                                    },
                                }}
                            />
                            <Button
                                color="inherit"
                                onClick={() => navigate('/')}
                                startIcon={<HomeIcon />}
                            >
                                {t('common.home')}
                            </Button>
                            <Button
                                color="inherit"
                                onClick={() => navigate('/communities')}
                                startIcon={<CommunitiesIcon />}
                            >
                                {t('navbar.communityHub')}
                            </Button>
                            <Button
                                color="inherit"
                                onClick={handleMenuOpen}
                                startIcon={<CommunitiesIcon />}
                            >
                                {t('navbar.communities')}
                            </Button>
                            <Button
                                color="inherit"
                                onClick={() => navigate('/chat-community')}
                                startIcon={<ChatIcon />}
                            >
                                {t('navbar.chatCommunity')}
                            </Button>
                            <Button
                                color="inherit"
                                onClick={() => navigate('/search')}
                                startIcon={<SearchIcon />}
                            >
                                {t('common.search')}
                            </Button>
                            <Button
                                color="inherit"
                                onClick={() => navigate('/bookmarks')}
                                startIcon={<SearchIcon />}
                            >
                                {t('navbar.bookmarks')}
                            </Button>
                            <Button
                                color="inherit"
                                onClick={() => navigate('/follow/feed')}
                                startIcon={<SearchIcon />}
                            >
                                {t('navbar.follow')}
                            </Button>
                            <Button
                                color="inherit"
                                onClick={handleMenuOpen}
                                startIcon={<AdminIcon />}
                            >
                                {t('navbar.management')}
                            </Button>
                            <LanguageSwitcher size="medium" />
                            <ThemeToggleButton size="medium" />
                            <SimpleNotificationBell />
                            {currentUserId > 0 && (
                                <>
                                    <DMNotification
                                        userId={currentUserId}
                                        onOpenInbox={() => navigate('/messages')}
                                    />
                                    <Button
                                        color="inherit"
                                        onClick={() => navigate('/group-chats')}
                                        startIcon={<ChatIcon />}
                                        sx={{ ml: 1 }}
                                    >
                                        {t('navbar.groupChats')}
                                    </Button>
                                </>
                            )}
                            <Button
                                color="inherit"
                                onClick={() => navigate('/login')}
                                startIcon={<LoginIcon />}
                            >
                                {t('common.login')}
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