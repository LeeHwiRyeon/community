import React from 'react';
import {
    Box,
    Container,
    Typography
} from '@mui/material';
import { FiActivity } from 'react-icons/fi';
import OnlineUserList from '../components/OnlineUserList';

const OnlineUsersPage: React.FC = () => {
    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
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
                    <FiActivity size={32} />
                    온라인 사용자
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    현재 활동 중인 커뮤니티 멤버를 확인하세요
                </Typography>
            </Box>

            <OnlineUserList />
        </Container>
    );
};

export default OnlineUsersPage;
