import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const Navbar: React.FC = () => {
    const navigate = useNavigate();

    return (
        <AppBar position="static">
            <Toolbar>
                <Typography
                    variant="h6"
                    component="div"
                    sx={{ flexGrow: 1, cursor: 'pointer' }}
                    onClick={() => navigate('/')}
                >
                    📰 TheNewsPaper Community
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button color="inherit" onClick={() => navigate('/home')}>
                        Home
                    </Button>
                    <Button color="inherit" onClick={() => navigate('/communities')}>
                        Communities
                    </Button>
                    <Button color="inherit" onClick={() => navigate('/games')}>
                        Games
                    </Button>
                    <Button color="inherit" onClick={() => navigate('/dashboard')}>
                        Dashboard
                    </Button>
                    <Button color="inherit" onClick={() => navigate('/cosplay')}>
                        코스프레
                    </Button>
                    <Button color="inherit" onClick={() => navigate('/streaming')}>
                        스트리밍
                    </Button>
                    <Button color="inherit" onClick={() => navigate('/design-system')}>
                        디자인
                    </Button>
                    <Button color="inherit" onClick={() => navigate('/interactions')}>
                        인터랙션
                    </Button>
                    <Button color="inherit" onClick={() => navigate('/uiux-v2')}>
                        UI/UX 2.0
                    </Button>
                    <Button color="inherit" onClick={() => navigate('/login')}>
                        Login
                    </Button>
                </Box>
            </Toolbar>
        </AppBar>
    );
};

export default Navbar;