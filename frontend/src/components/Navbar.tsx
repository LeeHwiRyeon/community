import React, { useState } from 'react';
import {
    AppBar,
    Toolbar,
    Typography,
    Button,
    IconButton,
    Menu,
    MenuItem,
    Box,
    Badge,
    Avatar,
    Drawer,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    useMediaQuery,
    useTheme
} from '@mui/material';
import {
    Menu as MenuIcon,
    Home,
    People,
    Dashboard,
    Person,
    Games,
    Notifications,
    Settings,
    Logout,
    Diamond
} from '@mui/icons-material';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const Navbar: React.FC = () => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [mobileOpen, setMobileOpen] = useState(false);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const navigate = useNavigate();
    const location = useLocation();

    const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
        handleMenuClose();
    };

    const isAuthenticated = !!localStorage.getItem('token');

    const menuItems = [
        { label: '홈', path: '/', icon: <Home /> },
        { label: '커뮤니티', path: '/communities', icon: <People /> },
        { label: '커뮤니티 허브', path: '/community-hub', icon: <People /> }, // Added for COMMUNITY_RELEASE_001
        { label: '게임 센터', path: '/games', icon: <Games /> },
        { label: 'VIP', path: '/vip', icon: <Diamond /> },
        { label: '대시보드', path: '/dashboard', icon: <Dashboard /> },
    ];

    const drawer = (
        <Box sx={{ width: 250 }}>
            <List>
                {menuItems.map((item) => (
                    <ListItem
                        button
                        key={item.label}
                        component={Link}
                        to={item.path}
                        selected={location.pathname === item.path}
                        onClick={handleDrawerToggle}
                    >
                        <ListItemIcon>{item.icon}</ListItemIcon>
                        <ListItemText primary={item.label} />
                    </ListItem>
                ))}
                {isAuthenticated && (
                    <>
                        <ListItem button component={Link} to="/profile" onClick={handleDrawerToggle}>
                            <ListItemIcon><Person /></ListItemIcon>
                            <ListItemText primary="프로필" />
                        </ListItem>
                        <ListItem button onClick={handleLogout}>
                            <ListItemIcon><Logout /></ListItemIcon>
                            <ListItemText primary="로그아웃" />
                        </ListItem>
                    </>
                )}
            </List>
        </Box>
    );

    return (
        <>
            <AppBar position="static" elevation={0} sx={{ bgcolor: 'white', color: 'text.primary' }}>
                <Toolbar>
                    {/* Mobile menu button */}
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

                    {/* Logo */}
                    <Typography
                        variant="h6"
                        component={Link}
                        to="/"
                        sx={{
                            flexGrow: isMobile ? 0 : 1,
                            textDecoration: 'none',
                            color: 'primary.main',
                            fontWeight: 'bold',
                            mr: isMobile ? 2 : 0
                        }}
                    >
                        🎮 Community Platform 2.0
                    </Typography>

                    {/* Desktop menu items */}
                    {!isMobile && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1 }}>
                            {menuItems.map((item) => (
                                <Button
                                    key={item.label}
                                    component={Link}
                                    to={item.path}
                                    startIcon={item.icon}
                                    color={location.pathname === item.path ? 'primary' : 'inherit'}
                                    sx={{
                                        textTransform: 'none',
                                        fontWeight: location.pathname === item.path ? 'bold' : 'normal'
                                    }}
                                >
                                    {item.label}
                                </Button>
                            ))}
                        </Box>
                    )}

                    {/* Right side items */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {/* Notifications */}
                        <IconButton color="inherit">
                            <Badge badgeContent={3} color="error">
                                <Notifications />
                            </Badge>
                        </IconButton>

                        {/* Profile menu */}
                        {isAuthenticated ? (
                            <>
                                <IconButton
                                    size="large"
                                    edge="end"
                                    aria-label="account of current user"
                                    aria-controls="primary-search-account-menu"
                                    aria-haspopup="true"
                                    onClick={handleProfileMenuOpen}
                                    color="inherit"
                                >
                                    <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                                        U
                                    </Avatar>
                                </IconButton>
                                <Menu
                                    anchorEl={anchorEl}
                                    anchorOrigin={{
                                        vertical: 'top',
                                        horizontal: 'right',
                                    }}
                                    keepMounted
                                    transformOrigin={{
                                        vertical: 'top',
                                        horizontal: 'right',
                                    }}
                                    open={Boolean(anchorEl)}
                                    onClose={handleMenuClose}
                                >
                                    <MenuItem onClick={() => { navigate('/profile'); handleMenuClose(); }}>
                                        <ListItemIcon>
                                            <Person fontSize="small" />
                                        </ListItemIcon>
                                        프로필
                                    </MenuItem>
                                    <MenuItem onClick={() => { navigate('/settings'); handleMenuClose(); }}>
                                        <ListItemIcon>
                                            <Settings fontSize="small" />
                                        </ListItemIcon>
                                        설정
                                    </MenuItem>
                                    <MenuItem onClick={handleLogout}>
                                        <ListItemIcon>
                                            <Logout fontSize="small" />
                                        </ListItemIcon>
                                        로그아웃
                                    </MenuItem>
                                </Menu>
                            </>
                        ) : (
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button
                                    component={Link}
                                    to="/login"
                                    color="inherit"
                                    sx={{ textTransform: 'none' }}
                                >
                                    로그인
                                </Button>
                                <Button
                                    component={Link}
                                    to="/register"
                                    variant="contained"
                                    sx={{ textTransform: 'none' }}
                                >
                                    회원가입
                                </Button>
                            </Box>
                        )}
                    </Box>
                </Toolbar>
            </AppBar>

            {/* Mobile drawer */}
            <Drawer
                variant="temporary"
                anchor="left"
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
