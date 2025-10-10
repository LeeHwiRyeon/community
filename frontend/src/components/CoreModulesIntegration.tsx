/**
 * Community Platform v1.3 - 4개 핵심 모듈 통합 시스템
 * 뉴스, 커뮤니티, 방송, 코스프레 모듈의 통합 관리
 */

import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Button,
    Grid,
    Tabs,
    Tab,
    Chip,
    IconButton,
    Tooltip,
    Badge,
    Paper,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Divider,
    Alert,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel
} from '@mui/material';
import {
    Newspaper,
    Groups,
    LiveTv,
    TheaterComedy,
    Dashboard,
    Settings,
    Analytics,
    Notifications,
    Security,
    Speed,
    TrendingUp,
    People,
    Star,
    VideoLibrary,
    PhotoCamera,
    Chat,
    Share,
    Favorite,
    Visibility
} from '@mui/icons-material';

// 4개 핵심 모듈 타입 정의
interface CoreModule {
    id: string;
    name: string;
    icon: React.ReactNode;
    description: string;
    status: 'active' | 'inactive' | 'maintenance';
    stats: {
        users: number;
        content: number;
        engagement: number;
        growth: number;
    };
    features: string[];
    lastUpdate: Date;
}

interface ModuleIntegration {
    news: CoreModule;
    community: CoreModule;
    broadcast: CoreModule;
    cosplay: CoreModule;
}

const CoreModulesIntegration: React.FC = () => {
    const [activeTab, setActiveTab] = useState(0);
    const [modules, setModules] = useState<ModuleIntegration | null>(null);
    const [loading, setLoading] = useState(true);
    const [showSettings, setShowSettings] = useState(false);

    // 4개 핵심 모듈 데이터 초기화
    useEffect(() => {
        initializeModules();
    }, []);

    const initializeModules = async () => {
        setLoading(true);
        try {
            // 모의 데이터로 4개 핵심 모듈 초기화
            const mockModules: ModuleIntegration = {
                news: {
                    id: 'news',
                    name: '뉴스 시스템',
                    icon: <Newspaper />,
                    description: '실시간 뉴스 및 콘텐츠 관리 시스템',
                    status: 'active',
                    stats: {
                        users: 1250,
                        content: 342,
                        engagement: 89.5,
                        growth: 15.2
                    },
                    features: [
                        '실시간 뉴스 피드',
                        '카테고리별 분류',
                        'AI 콘텐츠 추천',
                        '댓글 및 반응 시스템',
                        '모바일 최적화'
                    ],
                    lastUpdate: new Date()
                },
                community: {
                    id: 'community',
                    name: '커뮤니티 시스템',
                    icon: <Groups />,
                    description: '실시간 채팅 및 게시판 커뮤니티',
                    status: 'active',
                    stats: {
                        users: 2100,
                        content: 1250,
                        engagement: 92.3,
                        growth: 22.1
                    },
                    features: [
                        '실시간 채팅',
                        '게시판 시스템',
                        '사용자 프로필',
                        '팔로우 시스템',
                        '알림 시스템'
                    ],
                    lastUpdate: new Date()
                },
                broadcast: {
                    id: 'broadcast',
                    name: '방송 시스템',
                    icon: <LiveTv />,
                    description: '실시간 스트리밍 및 방송 플랫폼',
                    status: 'active',
                    stats: {
                        users: 850,
                        content: 156,
                        engagement: 78.9,
                        growth: 8.7
                    },
                    features: [
                        '실시간 스트리밍',
                        '화상 채팅',
                        '시청자 관리',
                        '도네이션 시스템',
                        '녹화 기능'
                    ],
                    lastUpdate: new Date()
                },
                cosplay: {
                    id: 'cosplay',
                    name: '코스프레 시스템',
                    icon: <TheaterComedy />,
                    description: '코스프레 갤러리 및 이벤트 관리',
                    status: 'active',
                    stats: {
                        users: 680,
                        content: 890,
                        engagement: 85.4,
                        growth: 12.3
                    },
                    features: [
                        '갤러리 시스템',
                        '이벤트 관리',
                        '포트폴리오',
                        '쇼핑몰 연동',
                        '커뮤니티 기능'
                    ],
                    lastUpdate: new Date()
                }
            };

            setModules(mockModules);
        } catch (error) {
            console.error('모듈 초기화 실패:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'success';
            case 'inactive': return 'error';
            case 'maintenance': return 'warning';
            default: return 'default';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'active': return '활성';
            case 'inactive': return '비활성';
            case 'maintenance': return '점검중';
            default: return '알 수 없음';
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!modules) {
        return (
            <Alert severity="error">
                모듈을 로드할 수 없습니다. 페이지를 새로고침해주세요.
            </Alert>
        );
    }

    const moduleArray = Object.values(modules);

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" component="h1" gutterBottom>
                🚀 Community Platform v1.3 - 4개 핵심 모듈 통합
            </Typography>

            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                뉴스, 커뮤니티, 방송, 코스프레 모듈의 통합 관리 및 모니터링
            </Typography>

            {/* 전체 통계 카드 */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
                <Box sx={{ width: { xs: '100%', sm: '50%', md: '25%' }, p: 1 }}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <People sx={{ mr: 1, color: 'primary.main' }} />
                                <Typography variant="h6">총 사용자</Typography>
                            </Box>
                            <Typography variant="h4" color="primary.main">
                                {moduleArray.reduce((sum, module) => sum + module.stats.users, 0).toLocaleString()}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                활성 사용자 수
                            </Typography>
                        </CardContent>
                    </Card>
                </Box>

                <Box sx={{ width: { xs: '100%', sm: '50%', md: '25%' }, p: 1 }}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <VideoLibrary sx={{ mr: 1, color: 'success.main' }} />
                                <Typography variant="h6">총 콘텐츠</Typography>
                            </Box>
                            <Typography variant="h4" color="success.main">
                                {moduleArray.reduce((sum, module) => sum + module.stats.content, 0).toLocaleString()}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                생성된 콘텐츠
                            </Typography>
                        </CardContent>
                    </Card>
                </Box>

                <Box sx={{ width: { xs: '100%', sm: '50%', md: '25%' }, p: 1 }}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <TrendingUp sx={{ mr: 1, color: 'warning.main' }} />
                                <Typography variant="h6">평균 참여도</Typography>
                            </Box>
                            <Typography variant="h4" color="warning.main">
                                {Math.round(moduleArray.reduce((sum, module) => sum + module.stats.engagement, 0) / moduleArray.length)}%
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                사용자 참여율
                            </Typography>
                        </CardContent>
                    </Card>
                </Box>

                <Box sx={{ width: { xs: '100%', sm: '50%', md: '25%' }, p: 1 }}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <Speed sx={{ mr: 1, color: 'info.main' }} />
                                <Typography variant="h6">평균 성장률</Typography>
                            </Box>
                            <Typography variant="h4" color="info.main">
                                {Math.round(moduleArray.reduce((sum, module) => sum + module.stats.growth, 0) / moduleArray.length)}%
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                월간 성장률
                            </Typography>
                        </CardContent>
                    </Card>
                </Box>
            </Box>

            {/* 모듈 탭 */}
            <Paper sx={{ mb: 3 }}>
                <Tabs
                    value={activeTab}
                    onChange={handleTabChange}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{ borderBottom: 1, borderColor: 'divider' }}
                >
                    {moduleArray.map((module, index) => (
                        <Tab
                            key={module.id}
                            label={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    {module.icon}
                                    {module.name}
                                    <Chip
                                        label={getStatusText(module.status)}
                                        color={getStatusColor(module.status)}
                                        size="small"
                                    />
                                </Box>
                            }
                        />
                    ))}
                </Tabs>

                {/* 선택된 모듈 상세 정보 */}
                <Box sx={{ p: 3 }}>
                    {moduleArray[activeTab] && (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                            <Box sx={{ width: { xs: '100%', md: '66.66%' }, p: 1 }}>
                                <Typography variant="h5" gutterBottom>
                                    {moduleArray[activeTab].name}
                                </Typography>

                                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                                    {moduleArray[activeTab].description}
                                </Typography>

                                <Typography variant="h6" gutterBottom>
                                    주요 기능
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                                    {moduleArray[activeTab].features.map((feature, index) => (
                                        <Box sx={{ width: { xs: '100%', sm: '50%' }, p: 1 }} key={index}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', p: 1 }}>
                                                <Star sx={{ mr: 1, color: 'primary.main', fontSize: 20 }} />
                                                <Typography variant="body2">{feature}</Typography>
                                            </Box>
                                        </Box>
                                    ))}
                                </Box>
                            </Box>

                            <Box sx={{ width: { xs: '100%', md: '33.33%' }, p: 1 }}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom>
                                            모듈 통계
                                        </Typography>

                                        <Box sx={{ mb: 2 }}>
                                            <Typography variant="body2" color="text.secondary">
                                                사용자 수
                                            </Typography>
                                            <Typography variant="h6">
                                                {moduleArray[activeTab].stats.users.toLocaleString()}
                                            </Typography>
                                        </Box>

                                        <Box sx={{ mb: 2 }}>
                                            <Typography variant="body2" color="text.secondary">
                                                콘텐츠 수
                                            </Typography>
                                            <Typography variant="h6">
                                                {moduleArray[activeTab].stats.content.toLocaleString()}
                                            </Typography>
                                        </Box>

                                        <Box sx={{ mb: 2 }}>
                                            <Typography variant="body2" color="text.secondary">
                                                참여도
                                            </Typography>
                                            <Typography variant="h6" color="success.main">
                                                {moduleArray[activeTab].stats.engagement}%
                                            </Typography>
                                        </Box>

                                        <Box sx={{ mb: 2 }}>
                                            <Typography variant="body2" color="text.secondary">
                                                성장률
                                            </Typography>
                                            <Typography variant="h6" color="info.main">
                                                +{moduleArray[activeTab].stats.growth}%
                                            </Typography>
                                        </Box>

                                        <Divider sx={{ my: 2 }} />

                                        <Typography variant="body2" color="text.secondary">
                                            마지막 업데이트
                                        </Typography>
                                        <Typography variant="body2">
                                            {moduleArray[activeTab].lastUpdate.toLocaleString()}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Box>
                        </Box>
                    )}
                </Box>
            </Paper>

            {/* 통합 관리 도구 */}
            <Card>
                <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="h6">통합 관리 도구</Typography>
                        <Button
                            variant="outlined"
                            startIcon={<Settings />}
                            onClick={() => setShowSettings(true)}
                        >
                            설정
                        </Button>
                    </Box>

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                        <Box sx={{ width: { xs: '100%', sm: '50%', md: '25%' }, p: 1 }}>
                            <Button
                                fullWidth
                                variant="contained"
                                startIcon={<Analytics />}
                                sx={{ height: 60 }}
                            >
                                통합 분석
                            </Button>
                        </Box>
                        <Box sx={{ width: { xs: '100%', sm: '50%', md: '25%' }, p: 1 }}>
                            <Button
                                fullWidth
                                variant="outlined"
                                startIcon={<Notifications />}
                                sx={{ height: 60 }}
                            >
                                알림 관리
                            </Button>
                        </Box>
                        <Box sx={{ width: { xs: '100%', sm: '50%', md: '25%' }, p: 1 }}>
                            <Button
                                fullWidth
                                variant="outlined"
                                startIcon={<Security />}
                                sx={{ height: 60 }}
                            >
                                보안 설정
                            </Button>
                        </Box>
                        <Box sx={{ width: { xs: '100%', sm: '50%', md: '25%' }, p: 1 }}>
                            <Button
                                fullWidth
                                variant="outlined"
                                startIcon={<Dashboard />}
                                sx={{ height: 60 }}
                            >
                                대시보드
                            </Button>
                        </Box>
                    </Box>
                </CardContent>
            </Card>

            {/* 설정 다이얼로그 */}
            <Dialog
                open={showSettings}
                onClose={() => setShowSettings(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>통합 모듈 설정</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        4개 핵심 모듈의 통합 설정을 관리할 수 있습니다.
                    </Typography>

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                        <Box sx={{ width: { xs: '100%', md: '50%' }, p: 1 }}>
                            <FormControl fullWidth>
                                <InputLabel>기본 모듈</InputLabel>
                                <Select label="기본 모듈">
                                    <MenuItem value="news">뉴스 시스템</MenuItem>
                                    <MenuItem value="community">커뮤니티 시스템</MenuItem>
                                    <MenuItem value="broadcast">방송 시스템</MenuItem>
                                    <MenuItem value="cosplay">코스프레 시스템</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                        <Box sx={{ width: { xs: '100%', md: '50%' }, p: 1 }}>
                            <FormControl fullWidth>
                                <InputLabel>통합 레벨</InputLabel>
                                <Select label="통합 레벨">
                                    <MenuItem value="basic">기본</MenuItem>
                                    <MenuItem value="advanced">고급</MenuItem>
                                    <MenuItem value="premium">프리미엄</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowSettings(false)}>
                        취소
                    </Button>
                    <Button variant="contained" onClick={() => setShowSettings(false)}>
                        저장
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default CoreModulesIntegration;
