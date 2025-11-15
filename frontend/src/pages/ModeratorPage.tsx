import React from 'react';
import {
    Box,
    Container,
    Typography
} from '@mui/material';
import { FiShield } from 'react-icons/fi';
import ModeratorDashboard from '../components/ModeratorDashboard';

const ModeratorPage: React.FC = () => {
    return (
        <Container maxWidth="xl" sx={{ py: 4 }}>
            <Box sx={{ mb: 4 }}>
                <Typography
                    variant="h4"
                    component="h1"
                    gutterBottom
                    sx={{
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2
                    }}
                >
                    <FiShield size={32} />
                    모더레이터 대시보드
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    커뮤니티 관리 및 모더레이션 도구
                </Typography>
            </Box>

            <ModeratorDashboard />
        </Container>
    );
};

export default ModeratorPage;
