import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Container, Card, CardContent, Chip, Avatar } from '@mui/material';

const CommunityHub: React.FC = () => {
    const navigate = useNavigate();

    const communities = [
        { id: 'general', name: '자유게시판', description: '자유롭게 이야기를 나누는 공간', members: 1250, category: 'General', color: '#2196F3' },
        { id: 'notice', name: '공지사항', description: '중요한 공지사항을 확인하세요', members: 890, category: 'Notice', color: '#FF5722' },
        { id: 'qna', name: 'Q&A', description: '궁금한 것이 있으면 언제든지 질문하세요', members: 2100, category: 'QnA', color: '#9C27B0' },
        { id: 'tech', name: '기술토론', description: '기술 관련 토론과 정보를 공유합니다', members: 650, category: 'Technology', color: '#4CAF50' },
        { id: 'cosplay', name: '코스프레', description: '코스프레 작품과 정보를 공유합니다', members: 450, category: 'Cosplay', color: '#E91E63' },
        { id: 'streaming', name: '스트리밍', description: '스트리밍 관련 정보와 팁을 나눕니다', members: 780, category: 'Streaming', color: '#FF9800' },
        { id: 'game', name: '게임토론', description: '게임 관련 토론과 정보를 공유합니다', members: 1560, category: 'Gaming', color: '#9C27B0' },
        { id: 'review', name: '후기게시판', description: '사용 후기와 경험을 공유해주세요', members: 320, category: 'Review', color: '#607D8B' }
    ];

    const handleCommunityClick = (communityId: string) => {
        navigate(`/boards/${communityId}`);
    };

    return (
        <Container maxWidth="lg">
            <Box sx={{ py: 4 }}>
                <Typography variant="h2" component="h1" gutterBottom align="center">
                    🌟 Community Hub
                </Typography>
                <Typography variant="h5" component="h2" gutterBottom align="center" color="text.secondary">
                    Discover and join amazing communities
                </Typography>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mt: 4 }}>
                    {communities.map((community) => (
                        <Box key={community.id} sx={{ flex: '1 1 400px', maxWidth: '500px' }}>
                            <Card
                                sx={{ height: '100%', cursor: 'pointer', '&:hover': { boxShadow: 4 } }}
                                onClick={() => handleCommunityClick(community.id)}
                            >
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                        <Avatar sx={{ bgcolor: community.color, mr: 2 }}>
                                            {community.name.charAt(0)}
                                        </Avatar>
                                        <Box>
                                            <Typography variant="h6" component="h3">
                                                {community.name}
                                            </Typography>
                                            <Chip label={community.category} size="small" sx={{ bgcolor: community.color, color: 'white' }} />
                                        </Box>
                                    </Box>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                        {community.description}
                                    </Typography>
                                    <Typography variant="body2" color="primary">
                                        👥 {community.members.toLocaleString()} members
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Box>
                    ))}
                </Box>
            </Box>
        </Container>
    );
};

export default CommunityHub;