import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Card, CardContent, Button, Chip, Avatar, useTheme } from '@mui/material';
import {
    Newspaper as NewsIcon,
    SportsEsports as GameIcon,
    LiveTv as StreamingIcon,
    Palette as CosplayIcon,
    TrendingUp as TrendingIcon,
    People as PeopleIcon,
    Star as StarIcon,
    Chat as ChatIcon
} from '@mui/icons-material';

// 사용자 타입 정의
type UserType = 'news' | 'game' | 'streaming' | 'cosplay';

// 메인 페이지 컴포넌트
const MainPage: React.FC = () => {
    const [userType, setUserType] = useState<UserType>('news');
    const theme = useTheme();

    // 사용자 타입별 테마 적용
    const getThemeClass = (type: UserType) => {
        return `${type}-theme`;
    };

    // 뉴스 메인 페이지
    const NewsMainPage = () => (
        <Box className={`main-page ${getThemeClass('news')}`}>
            <Container maxWidth="lg">
                <Typography variant="h3" component="h1" gutterBottom sx={{
                    color: '#1976d2',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    mb: 4
                }}>
                    📰 뉴스 커뮤니티
                </Typography>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                    {/* 실시간 뉴스 피드 */}
                    <Box sx={{ flex: '2 1 500px' }}>
                        <Card sx={{ mb: 3, border: '1px solid #e0e0e0' }}>
                            <CardContent>
                                <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                                    <TrendingIcon sx={{ mr: 1, color: '#1976d2' }} />
                                    실시간 뉴스 피드
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                                    <Chip label="AI 발전" color="primary" />
                                    <Chip label="경제 동향" color="primary" />
                                    <Chip label="환경 보호" color="primary" />
                                </Box>
                                <Typography variant="body1" sx={{ mb: 2 }}>
                                    최신 뉴스와 시사 이슈를 실시간으로 확인하고 토론하세요.
                                </Typography>
                                <Button variant="contained" sx={{ bgcolor: '#1976d2' }}>
                                    뉴스 센터로 이동
                                </Button>
                            </CardContent>
                        </Card>
                    </Box>

                    {/* 트렌딩 토픽 */}
                    <Box sx={{ flex: '1 1 300px' }}>
                        <Card sx={{ border: '1px solid #e0e0e0' }}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                                    <TrendingIcon sx={{ mr: 1, color: '#ff9800' }} />
                                    트렌딩 토픽
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    <Typography variant="body2">1. AI 기술, 일상에 스며들다</Typography>
                                    <Typography variant="body2">2. 글로벌 경제, 새로운 도전 직면</Typography>
                                    <Typography variant="body2">3. 환경 보호, 시민 참여 확산</Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Box>
                </Box>
            </Container>
        </Box>
    );

    // 게임 메인 페이지
    const GameMainPage = () => (
        <Box className={`main-page ${getThemeClass('game')}`} sx={{ bgcolor: '#121212', color: 'white', minHeight: '100vh' }}>
            <Container maxWidth="lg">
                <Typography variant="h3" component="h1" gutterBottom sx={{
                    color: '#9c27b0',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    mb: 4
                }}>
                    🎮 게임 커뮤니티
                </Typography>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                    {/* 게임 리더보드 */}
                    <Box sx={{ flex: '2 1 500px' }}>
                        <Card sx={{ mb: 3, bgcolor: '#1e1e1e', border: '1px solid #9c27b0' }}>
                            <CardContent>
                                <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', color: '#9c27b0' }}>
                                    <StarIcon sx={{ mr: 1 }} />
                                    게임 리더보드
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                                    <Chip label="Snake" sx={{ bgcolor: '#9c27b0', color: 'white' }} />
                                    <Chip label="Tetris" sx={{ bgcolor: '#9c27b0', color: 'white' }} />
                                    <Chip label="Pong" sx={{ bgcolor: '#9c27b0', color: 'white' }} />
                                </Box>
                                <Typography variant="body1" sx={{ mb: 2, color: 'white' }}>
                                    다양한 게임을 플레이하고 리더보드에서 순위를 경쟁하세요.
                                </Typography>
                                <Button variant="contained" sx={{ bgcolor: '#9c27b0' }}>
                                    게임 센터로 이동
                                </Button>
                            </CardContent>
                        </Card>
                    </Box>

                    {/* 커뮤니티 게시글 */}
                    <Box sx={{ flex: '1 1 300px' }}>
                        <Card sx={{ bgcolor: '#1e1e1e', border: '1px solid #00e676' }}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', color: '#00e676' }}>
                                    <ChatIcon sx={{ mr: 1 }} />
                                    커뮤니티 게시글
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    <Typography variant="body2" sx={{ color: 'white' }}>🎮 Snake 고득점 공략법</Typography>
                                    <Typography variant="body2" sx={{ color: 'white' }}>🏆 Tetris 마스터 되기</Typography>
                                    <Typography variant="body2" sx={{ color: 'white' }}>🎉 게임 이벤트 안내</Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Box>
                </Box>
            </Container>
        </Box>
    );

    // 스트리밍 메인 페이지
    const StreamingMainPage = () => (
        <Box className={`main-page ${getThemeClass('streaming')}`} sx={{ bgcolor: '#1a1a1a', color: 'white', minHeight: '100vh' }}>
            <Container maxWidth="lg">
                <Typography variant="h3" component="h1" gutterBottom sx={{
                    color: '#f44336',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    mb: 4
                }}>
                    📺 스트리밍 커뮤니티
                </Typography>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                    {/* 라이브 방송 */}
                    <Box sx={{ flex: '2 1 500px' }}>
                        <Card sx={{ mb: 3, bgcolor: '#2a2a2a', border: '1px solid #f44336' }}>
                            <CardContent>
                                <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', color: '#f44336' }}>
                                    <StreamingIcon sx={{ mr: 1 }} />
                                    라이브 방송
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                                    <Chip label="🔴 LIVE" sx={{ bgcolor: '#f44336', color: 'white' }} />
                                    <Chip label="게임 방송" sx={{ bgcolor: '#2196f3', color: 'white' }} />
                                    <Chip label="크리에이터" sx={{ bgcolor: '#ff9800', color: 'white' }} />
                                </Box>
                                <Typography variant="body1" sx={{ mb: 2, color: 'white' }}>
                                    실시간 라이브 방송을 시청하고 스트리머와 소통하세요.
                                </Typography>
                                <Button variant="contained" sx={{ bgcolor: '#f44336' }}>
                                    라이브 센터로 이동
                                </Button>
                            </CardContent>
                        </Card>
                    </Box>

                    {/* 연결된 팀 */}
                    <Box sx={{ flex: '1 1 300px' }}>
                        <Card sx={{ bgcolor: '#2a2a2a', border: '1px solid #2196f3' }}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', color: '#2196f3' }}>
                                    <PeopleIcon sx={{ mr: 1 }} />
                                    연결된 팀
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    <Typography variant="body2" sx={{ color: 'white' }}>🎮 게임 팀 (15명)</Typography>
                                    <Typography variant="body2" sx={{ color: 'white' }}>🎨 크리에이터 팀 (8명)</Typography>
                                    <Typography variant="body2" sx={{ color: 'white' }}>🎵 음악 팀 (12명)</Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Box>
                </Box>
            </Container>
        </Box>
    );

    // 코스프레 메인 페이지
    const CosplayMainPage = () => (
        <Box className={`main-page ${getThemeClass('cosplay')}`} sx={{ bgcolor: '#fafafa', minHeight: '100vh' }}>
            <Container maxWidth="lg">
                <Typography variant="h3" component="h1" gutterBottom sx={{
                    color: '#e91e63',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    mb: 4
                }}>
                    🎭 코스프레 커뮤니티
                </Typography>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                    {/* 포트폴리오 갤러리 */}
                    <Box sx={{ flex: '2 1 500px' }}>
                        <Card sx={{ mb: 3, border: '1px solid #e91e63' }}>
                            <CardContent>
                                <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', color: '#e91e63' }}>
                                    <CosplayIcon sx={{ mr: 1 }} />
                                    포트폴리오 갤러리
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                                    <Chip label="엘사" sx={{ bgcolor: '#e91e63', color: 'white' }} />
                                    <Chip label="아이언맨" sx={{ bgcolor: '#ff9800', color: 'white' }} />
                                    <Chip label="원피스" sx={{ bgcolor: '#4caf50', color: 'white' }} />
                                </Box>
                                <Typography variant="body1" sx={{ mb: 2 }}>
                                    아름다운 코스프레 작품을 공유하고 포트폴리오를 관리하세요.
                                </Typography>
                                <Button variant="contained" sx={{ bgcolor: '#e91e63' }}>
                                    포트폴리오로 이동
                                </Button>
                            </CardContent>
                        </Card>
                    </Box>

                    {/* 상점 연결 */}
                    <Box sx={{ flex: '1 1 300px' }}>
                        <Card sx={{ border: '1px solid #ff9800' }}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', color: '#ff9800' }}>
                                    <StarIcon sx={{ mr: 1 }} />
                                    상점 연결
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    <Typography variant="body2">👗 의상 상점 (신상품 15개)</Typography>
                                    <Typography variant="body2">🎭 소품 상점 (할인 30%)</Typography>
                                    <Typography variant="body2">💄 메이크업 상점 (추천)</Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Box>
                </Box>
            </Container>
        </Box>
    );

    // 사용자 타입별 메인 페이지 렌더링
    const renderMainPage = () => {
        switch (userType) {
            case 'news':
                return <NewsMainPage />;
            case 'game':
                return <GameMainPage />;
            case 'streaming':
                return <StreamingMainPage />;
            case 'cosplay':
                return <CosplayMainPage />;
            default:
                return <NewsMainPage />;
        }
    };

    return (
        <Box>
            {/* 사용자 타입 선택 버튼 */}
            <Box sx={{
                position: 'fixed',
                top: 20,
                right: 20,
                zIndex: 1000,
                display: 'flex',
                gap: 1,
                bgcolor: 'rgba(255, 255, 255, 0.9)',
                p: 1,
                borderRadius: 2,
                boxShadow: 2
            }}>
                <Button
                    variant={userType === 'news' ? 'contained' : 'outlined'}
                    size="small"
                    onClick={() => setUserType('news')}
                    sx={{ minWidth: 'auto', px: 1 }}
                >
                    📰
                </Button>
                <Button
                    variant={userType === 'game' ? 'contained' : 'outlined'}
                    size="small"
                    onClick={() => setUserType('game')}
                    sx={{ minWidth: 'auto', px: 1 }}
                >
                    🎮
                </Button>
                <Button
                    variant={userType === 'streaming' ? 'contained' : 'outlined'}
                    size="small"
                    onClick={() => setUserType('streaming')}
                    sx={{ minWidth: 'auto', px: 1 }}
                >
                    📺
                </Button>
                <Button
                    variant={userType === 'cosplay' ? 'contained' : 'outlined'}
                    size="small"
                    onClick={() => setUserType('cosplay')}
                    sx={{ minWidth: 'auto', px: 1 }}
                >
                    🎭
                </Button>
            </Box>

            {/* 메인 페이지 렌더링 */}
            {renderMainPage()}
        </Box>
    );
};

export default MainPage;