import React from 'react';
import { Box, Typography, Container, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const NotFound: React.FC = () => {
    const navigate = useNavigate();

    return (
        <Container maxWidth="sm">
            <Box sx={{ py: 8, textAlign: 'center' }}>
                <Typography variant="h1" component="h1" gutterBottom sx={{ fontSize: '6rem' }}>
                    404
                </Typography>
                <Typography variant="h4" component="h2" gutterBottom>
                    🔍 Page Not Found
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                    The page you're looking for doesn't exist or has been moved.
                </Typography>
                <Button variant="contained" size="large" onClick={() => navigate('/')}>
                    🏠 Go Home
                </Button>
            </Box>
        </Container>
    );
};

export default NotFound;