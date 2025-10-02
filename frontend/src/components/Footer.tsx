import React from 'react';
import { Box, Typography, Container } from '@mui/material';

const Footer: React.FC = () => {
    return (
        <Box
            component="footer"
            sx={{
                bgcolor: 'primary.main',
                color: 'white',
                py: 3,
                mt: 'auto'
            }}
        >
            <Container maxWidth="lg">
                <Typography variant="body1" align="center">
                    © 2025 TheNewsPaper Community. All rights reserved.
                </Typography>
                <Typography variant="body2" align="center" sx={{ mt: 1 }}>
                    Built with ❤️ by AUTOAGENTS
                </Typography>
            </Container>
        </Box>
    );
};

export default Footer;