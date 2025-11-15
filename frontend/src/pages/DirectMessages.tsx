import React, { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Grid,
    Paper,
    Typography,
    useTheme,
    useMediaQuery,
    IconButton,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DMInbox from '../components/DM/DMInbox';
import DMConversation from '../components/DM/DMConversation';
import { DMConversation as DMConversationType } from '../services/dmService';

const DirectMessages: React.FC = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [selectedConversation, setSelectedConversation] = useState<DMConversationType | null>(null);
    const [currentUserId, setCurrentUserId] = useState<number>(0);
    const [showConversation, setShowConversation] = useState(false);

    useEffect(() => {
        // 현재 사용자 ID 가져오기 (실제로는 AuthContext에서 가져와야 함)
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

    const handleSelectConversation = (conversation: DMConversationType) => {
        setSelectedConversation(conversation);
        if (isMobile) {
            setShowConversation(true);
        }
    };

    const handleBack = () => {
        setShowConversation(false);
        setSelectedConversation(null);
    };

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" gutterBottom>
                다이렉트 메시지
            </Typography>

            <Paper elevation={3} sx={{ height: 'calc(100vh - 200px)', overflow: 'hidden', display: 'flex' }}>
                {/* 대화 목록 (왼쪽) */}
                {(!isMobile || !showConversation) && (
                    <Box
                        sx={{
                            width: isMobile ? '100%' : '33.33%',
                            borderRight: isMobile ? 0 : 1,
                            borderColor: 'divider',
                            height: '100%',
                        }}
                    >
                        <DMInbox
                            onSelectConversation={handleSelectConversation}
                            selectedConversationId={selectedConversation?.id}
                        />
                    </Box>
                )}

                {/* 대화 내용 (오른쪽) */}
                {(!isMobile || showConversation) && (
                    <Box sx={{ flexGrow: 1, height: '100%' }}>
                        {selectedConversation && currentUserId ? (
                            <DMConversation
                                conversation={selectedConversation}
                                currentUserId={currentUserId}
                            />
                        ) : (
                            <Box
                                sx={{
                                    height: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: 'grey.50',
                                }}
                            >
                                <Typography variant="h6" color="textSecondary">
                                    대화를 선택하세요
                                </Typography>
                            </Box>
                        )}
                    </Box>
                )}
            </Paper>

            {/* 모바일 뒤로가기 버튼 */}
            {isMobile && showConversation && (
                <Box
                    sx={{
                        position: 'fixed',
                        bottom: 16,
                        left: 16,
                        zIndex: 1000,
                    }}
                >
                    <IconButton
                        onClick={handleBack}
                        sx={{
                            backgroundColor: 'primary.main',
                            color: 'white',
                            '&:hover': {
                                backgroundColor: 'primary.dark',
                            },
                        }}
                    >
                        <ArrowBackIcon />
                    </IconButton>
                </Box>
            )}
        </Container>
    );
};

export default DirectMessages;
