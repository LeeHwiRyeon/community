import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Container,
    Card,
    CardContent,
    CardMedia,
    Chip,
    Avatar,
        Button,
    IconButton,
    Paper,
    Divider
} from '@mui/material';

import {
    Article as NewsIcon,
    SportsEsports as GamesIcon,
    LiveTv as StreamingIcon,
    TheaterComedy as CosplayIcon,
    TrendingUp as TrendingIcon,
    People as PeopleIcon,
    Chat as ChatIcon,
    Schedule as ScheduleIcon
} from '@mui/icons-material';

const CommunityHub: React.FC = () => {
    const navigate = useNavigate();

    // 주요 4개 커뮤니티 (순서 고정)
    const mainCommunities = [
        {
            id: 'news',
            name: '뉴스 커뮤니티',
            description: '실시간 뉴스와 토론이 활발한 커뮤니티',
            icon: <NewsIcon />,
            color: '#2196F3',
            members: 15420,
            activeUsers: 3240,
            dailyPosts: 156,
            boards: ['공지사항', '실시간 뉴스', '뉴스 토론', '뉴스레터', '알림 설정'],
            trendingTopics: ['기술 뉴스', '게임 업데이트', '코스프레 이벤트', '스트리밍 소식']
        },
        {
            id: 'games',
            name: '게임 커뮤니티',
            description: '게임 토론, 리뷰, 공략, e스포츠',
            icon: <GamesIcon />,
            color: '#9C27B0',
            members: 12890,
            activeUsers: 2560,
            dailyPosts: 143,
            boards: ['게임 뉴스', '게임 리뷰', '공략 가이드', 'e스포츠', '자유 토론', '이벤트'],
            trendingTopics: ['새로운 게임 출시', 'e스포츠 경기', '게임 업데이트', '공략 팁']
        },
        {
            id: 'streaming',
            name: '방송국 커뮤니티',
            description: '실시간 방송, 채팅, 구독자 관리, 수익화',
            icon: <StreamingIcon />,
            color: '#FF5722',
            members: 8750,
            activeUsers: 1890,
            dailyPosts: 98,
            boards: ['라이브 방송', '방송 일정', '실시간 채팅', '구독자 관리', '수익화 도구', '방송 통계'],
            trendingTopics: ['라이브 방송', '스트리밍 팁', '구독자 이벤트', '수익화 방법']
        },
        {
            id: 'cosplay',
            name: '코스프레 커뮤니티',
            description: '코스프레 작품과 정보를 공유하는 커뮤니티',
            icon: <CosplayIcon />,
            color: '#E91E63',
            members: 12890,
            activeUsers: 2560,
            dailyPosts: 143,
            boards: ['포트폴리오 갤러리', '의상 관리', '이벤트 참가', '튜토리얼', '의상 상점', 'AI 추천'],
            trendingTopics: ['의상 제작', '포토샵', '이벤트 참가', '의상 리뷰']
        }
    ];

    const handleCommunityClick = (communityId: string) => {
        navigate(`/communities/${communityId}`);
    };

    const totalMembers = mainCommunities.reduce((sum, community) => sum + community.members, 0);
    const totalActiveUsers = mainCommunities.reduce((sum, community) => sum + community.activeUsers, 0);
    const totalDailyPosts = mainCommunities.reduce((sum, community) => sum + community.dailyPosts, 0);

    return (
        <Container maxWidth="xl" sx={{ py: 4 }}>
            {/* 헤더 */}
            <Box sx={{ mb: 6, textAlign: 'center' }}>
                <Typography variant="h3" gutterBottom sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontWeight: 'bold'
                }}>
                    🌳 커뮤니티 허브
                </Typography>
                <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
                    홈페이지 → 커뮤니티 허브 → 커뮤니티 → 게시판 → 게시글
                </Typography>

                {/* 전체 통계 */}
                <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                        <Box sx={{ flex: '1 1 200px', textAlign: 'center' }}>
                            <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
                                {totalMembers.toLocaleString()}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                총 멤버 수
                            </Typography>
                        </Box>
                        <Box sx={{ flex: '1 1 200px', textAlign: 'center' }}>
                            <Typography variant="h4" color="secondary" sx={{ fontWeight: 'bold' }}>
                                {totalActiveUsers.toLocaleString()}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                활성 사용자
                            </Typography>
                        </Box>
                        <Box sx={{ flex: '1 1 200px', textAlign: 'center' }}>
                            <Typography variant="h4" color="success.main" sx={{ fontWeight: 'bold' }}>
                                {totalDailyPosts}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                일일 게시물
                            </Typography>
                        </Box>
                    </Box>
                </Paper>
            </Box>

            {/* 주요 커뮤니티 그리드 */}
            <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
                🎯 주요 커뮤니티 (순서 고정)
            </Typography>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                {mainCommunities.map((community, index) => (
                    <Box key={community.id} sx={{ flex: '1 1 400px', maxWidth: '500px' }}>
                        <Card
                            sx={{
                                height: '100%',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    transform: 'translateY(-8px)',
                                    boxShadow: `0 8px 25px ${community.color}30`
                                }
                            }}
                            onClick={() => handleCommunityClick(community.id)}
                        >
                            <CardContent sx={{ p: 3 }}>
                                {/* 커뮤니티 헤더 */}
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <Avatar
                                        sx={{
                                            bgcolor: community.color,
                                            mr: 2,
                                            width: 48,
                                            height: 48
                                        }}
                                    >
                                        {community.icon}
                                    </Avatar>
                                    <Box>
                                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                            {index + 1}. {community.name}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {community.description}
                                        </Typography>
                                    </Box>
                                </Box>

                                <Divider sx={{ my: 2 }} />

                                {/* 통계 */}
                                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                                    <Box sx={{ flex: 1, textAlign: 'center' }}>
                                        <Typography variant="h6" color="primary">
                                            {community.members.toLocaleString()}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            멤버
                                        </Typography>
                                    </Box>
                                    <Box sx={{ flex: 1, textAlign: 'center' }}>
                                        <Typography variant="h6" color="secondary">
                                            {community.activeUsers.toLocaleString()}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            활성
                                        </Typography>
                                    </Box>
                                    <Box sx={{ flex: 1, textAlign: 'center' }}>
                                        <Typography variant="h6" color="success.main">
                                            {community.dailyPosts}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            일일 게시물
                                        </Typography>
                                    </Box>
                                </Box>

                                {/* 게시판 목록 */}
                                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                                    📋 게시판 구성:
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                                    {community.boards.map((board) => (
                                        <Chip
                                            key={board}
                                            label={board}
                                            size="small"
                                            variant="outlined"
                                            sx={{ fontSize: '0.7rem' }}
                                        />
                                    ))}
                                </Box>

                                {/* 트렌딩 토픽 */}
                                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                                    🔥 트렌딩 토픽:
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {community.trendingTopics.map((topic) => (
                                        <Chip
                                            key={topic}
                                            label={topic}
                                            size="small"
                                            sx={{
                                                bgcolor: `${community.color}20`,
                                                color: community.color,
                                                fontSize: '0.7rem'
                                            }}
                                        />
                                    ))}
                                </Box>

                                {/* 액션 버튼 */}
                                <Box sx={{ mt: 2, textAlign: 'right' }}>
                                    <Button
                                        variant="contained"
                                        sx={{
                                            bgcolor: community.color,
                                            '&:hover': { bgcolor: community.color, opacity: 0.9 }
                                        }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleCommunityClick(community.id);
                                        }}
                                    >
                                        커뮤니티 입장
                                    </Button>
                                </Box>
                            </CardContent>
                        </Card>
                    </Box>
                ))}
            </Box>

            {/* 네비게이션 가이드 */}
            <Paper elevation={1} sx={{ p: 3, mt: 4, bgcolor: 'grey.50' }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                    🧭 네비게이션 가이드
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                    <strong>홈페이지</strong> → <strong>커뮤니티 허브</strong> → <strong>커뮤니티</strong> → <strong>게시판</strong> → <strong>게시글</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    각 커뮤니티는 독립적인 게시판 구조를 가지고 있으며, 트리형 계층 구조로 구성되어 있습니다.
                </Typography>
            </Paper>
        </Container>
    );
};

export default CommunityHub;