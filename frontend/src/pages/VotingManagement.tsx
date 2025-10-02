import React from 'react';
import { Container, Typography, Box } from '@mui/material';
import VotingSystem from '../components/VotingSystem';

const VotingManagement: React.FC = () => {
    return (
        <Container maxWidth="lg">
            <Box sx={{ py: 4 }}>
                <Typography variant="h3" component="h1" gutterBottom align="center">
                    🗳️ 투표 관리 시스템
                </Typography>
                <Typography variant="h6" component="h2" gutterBottom align="center" color="text.secondary" sx={{ mb: 4 }}>
                    커뮤니티 투표 생성, 관리 및 결과 확인
                </Typography>

                <VotingSystem showCreatePoll={true} />

                {/* 푸터 */}
                <Box sx={{ mt: 4, p: 2, bgcolor: 'grey.50', borderRadius: 2, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                        💡 투표 시스템이 실제 API와 연결되었습니다!
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        🚀 API 엔드포인트: /api/voting/* 활용
                    </Typography>
                </Box>
            </Box>
        </Container>
    );
};

export default VotingManagement;
