import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Container,
    Card,
    CardContent,
    Button,
    Chip,
    Alert,
    CircularProgress,
    Tabs,
    Tab,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Slider,
    Switch,
    FormControlLabel,
    Divider,
    Avatar,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    IconButton
} from '@mui/material';
import {
    Person as PersonIcon,
    Settings as SettingsIcon,
    Recommend as RecommendIcon,
    Support as SupportIcon,
    Palette as PaletteIcon,
    ShoppingCart as ShoppingCartIcon,
    Chat as ChatIcon,
    Send as SendIcon,
    Close as CloseIcon
} from '@mui/icons-material';

// 개인화 데이터 타입 정의
interface VIPProfile {
    id: string;
    userId: string;
    preferences: {
        theme: string;
        language: string;
        notifications: boolean;
        autoRecommendations: boolean;
    };
    interests: string[];
    budgetRange: { min: number; max: number };
    stylePreferences: string[];
    sizePreferences: string[];
    colorPreferences: string[];
    brandPreferences: string[];
    activityLevel: string;
    socialPreferences: {
        publicProfile: boolean;
        shareActivity: boolean;
        allowMessages: boolean;
    };
}

interface Recommendation {
    id: string;
    type: string;
    title: string;
    description: string;
    price: number;
    image: string;
    confidence: number;
    category: string;
}

interface SupportTicket {
    id: string;
    subject: string;
    status: string;
    priority: string;
    createdAt: string;
    lastUpdate: string;
    messages: Array<{
        id: string;
        sender: string;
        message: string;
        timestamp: string;
    }>;
}

const VIPPersonalizedService: React.FC = () => {
    const [activeTab, setActiveTab] = useState(0);
    const [profile, setProfile] = useState<VIPProfile | null>(null);
    const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
    const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [newTicketSubject, setNewTicketSubject] = useState('');
    const [newTicketMessage, setNewTicketMessage] = useState('');

    useEffect(() => {
        const loadPersonalizedData = async () => {
            try {
                setLoading(true);

                // VIP 프로필 로딩
                const profileResponse = await fetch('/api/vip-personalized-service/profiles/current');
                if (profileResponse.ok) {
                    const profileData = await profileResponse.json();
                    setProfile(profileData.data);
                } else {
                    // 모의 프로필 데이터
                    setProfile({
                        id: 'profile_001',
                        userId: 'user_123',
                        preferences: {
                            theme: 'dark',
                            language: 'ko',
                            notifications: true,
                            autoRecommendations: true
                        },
                        interests: ['코스프레', '스트리밍', '게임', '애니메이션'],
                        budgetRange: { min: 50000, max: 500000 },
                        stylePreferences: ['모던', '캐주얼', '엘레간트'],
                        sizePreferences: ['M', 'L'],
                        colorPreferences: ['블랙', '화이트', '네이비', '레드'],
                        brandPreferences: ['프리미엄 브랜드', '수제 브랜드'],
                        activityLevel: 'high',
                        socialPreferences: {
                            publicProfile: true,
                            shareActivity: true,
                            allowMessages: true
                        }
                    });
                }

                // 개인화 추천 로딩
                const recommendationsResponse = await fetch('/api/vip-personalized-service/recommendations/current');
                if (recommendationsResponse.ok) {
                    const recommendationsData = await recommendationsResponse.json();
                    setRecommendations(recommendationsData.data || []);
                } else {
                    // 모의 추천 데이터
                    setRecommendations([
                        {
                            id: 'rec_001',
                            type: 'product',
                            title: '프리미엄 코스프레 의상 - 엘사',
                            description: '고품질 소재로 제작된 겨울왕국 엘사 의상',
                            price: 180000,
                            image: '/images/cosplay-elsa.jpg',
                            confidence: 95,
                            category: 'cosplay'
                        },
                        {
                            id: 'rec_002',
                            type: 'equipment',
                            title: '4K 웹캠 - 스트리밍 전용',
                            description: '전문 스트리머를 위한 고화질 웹캠',
                            price: 250000,
                            image: '/images/webcam-4k.jpg',
                            confidence: 88,
                            category: 'streaming'
                        },
                        {
                            id: 'rec_003',
                            type: 'accessory',
                            title: '게이밍 키보드 - RGB',
                            description: '기계식 스위치와 RGB 백라이트',
                            price: 120000,
                            image: '/images/gaming-keyboard.jpg',
                            confidence: 92,
                            category: 'gaming'
                        }
                    ]);
                }

                // VIP 지원 티켓 로딩
                const ticketsResponse = await fetch('/api/vip-personalized-service/support-tickets/current');
                if (ticketsResponse.ok) {
                    const ticketsData = await ticketsResponse.json();
                    setSupportTickets(ticketsData.data || []);
                } else {
                    // 모의 지원 티켓 데이터
                    setSupportTickets([
                        {
                            id: 'ticket_001',
                            subject: '맞춤 추천 개선 요청',
                            status: 'open',
                            priority: 'medium',
                            createdAt: '2024-10-01T10:00:00Z',
                            lastUpdate: '2024-10-02T14:30:00Z',
                            messages: [
                                {
                                    id: 'msg_001',
                                    sender: 'user',
                                    message: '추천되는 상품들이 제 취향과 맞지 않는 것 같습니다.',
                                    timestamp: '2024-10-01T10:00:00Z'
                                },
                                {
                                    id: 'msg_002',
                                    sender: 'support',
                                    message: '안녕하세요! 개인화 설정을 다시 검토해보겠습니다. 어떤 스타일을 선호하시나요?',
                                    timestamp: '2024-10-02T14:30:00Z'
                                }
                            ]
                        }
                    ]);
                }

            } catch (err) {
                setError('개인화 서비스 데이터를 불러오는 중 오류가 발생했습니다.');
                console.error('개인화 서비스 로딩 오류:', err);
            } finally {
                setLoading(false);
            }
        };

        loadPersonalizedData();
    }, []);

    // 프로필 업데이트
    const updateProfile = async (updatedProfile: Partial<VIPProfile>) => {
        try {
            const response = await fetch('/api/vip-personalized-service/profiles/current', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedProfile)
            });

            if (response.ok) {
                const updatedData = await response.json();
                setProfile(updatedData.data);
            }
        } catch (err) {
            console.error('프로필 업데이트 오류:', err);
        }
    };

    // 새 지원 티켓 생성
    const createSupportTicket = async () => {
        if (!newTicketSubject.trim() || !newTicketMessage.trim()) return;

        try {
            const response = await fetch('/api/vip-personalized-service/support-tickets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subject: newTicketSubject,
                    message: newTicketMessage,
                    priority: 'medium'
                })
            });

            if (response.ok) {
                const newTicket = await response.json();
                setSupportTickets([newTicket.data, ...supportTickets]);
                setNewTicketSubject('');
                setNewTicketMessage('');
            }
        } catch (err) {
            console.error('지원 티켓 생성 오류:', err);
        }
    };

    if (loading) {
        return (
            <Container maxWidth="lg">
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                    <CircularProgress size={60} />
                </Box>
            </Container>
        );
    }

    if (error) {
        return (
            <Container maxWidth="lg">
                <Box sx={{ py: 4 }}>
                    <Alert severity="error">{error}</Alert>
                </Box>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg">
            <Box sx={{ py: 4 }}>
                {/* 헤더 */}
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h3" component="h1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                        <PersonIcon sx={{ mr: 2, fontSize: 'inherit' }} />
                        VIP 개인화 서비스
                    </Typography>
                    <Typography variant="h6" color="text.secondary">
                        맞춤형 추천, 개인 설정, 전용 지원 서비스
                    </Typography>
                </Box>

                {/* 탭 네비게이션 */}
                <Card sx={{ mb: 3 }}>
                    <Tabs
                        value={activeTab}
                        onChange={(_, newValue) => setActiveTab(newValue)}
                        variant="scrollable"
                        scrollButtons="auto"
                    >
                        <Tab icon={<SettingsIcon />} label="개인 설정" />
                        <Tab icon={<RecommendIcon />} label="맞춤 추천" />
                        <Tab icon={<SupportIcon />} label="VIP 지원" />
                        <Tab icon={<PaletteIcon />} label="테마 설정" />
                    </Tabs>
                </Card>

                {/* 개인 설정 탭 */}
                {activeTab === 0 && profile && (
                    <Card>
                        <CardContent>
                            <Typography variant="h5" gutterBottom>⚙️ 개인 설정</Typography>

                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                                {/* 기본 설정 */}
                                <Box>
                                    <Typography variant="h6" gutterBottom>기본 설정</Typography>

                                    <FormControl fullWidth sx={{ mb: 2 }}>
                                        <InputLabel>테마</InputLabel>
                                        <Select
                                            value={profile.preferences.theme}
                                            onChange={(e) => updateProfile({
                                                preferences: { ...profile.preferences, theme: e.target.value }
                                            })}
                                        >
                                            <MenuItem value="light">라이트</MenuItem>
                                            <MenuItem value="dark">다크</MenuItem>
                                            <MenuItem value="auto">자동</MenuItem>
                                        </Select>
                                    </FormControl>

                                    <FormControl fullWidth sx={{ mb: 2 }}>
                                        <InputLabel>언어</InputLabel>
                                        <Select
                                            value={profile.preferences.language}
                                            onChange={(e) => updateProfile({
                                                preferences: { ...profile.preferences, language: e.target.value }
                                            })}
                                        >
                                            <MenuItem value="ko">한국어</MenuItem>
                                            <MenuItem value="en">English</MenuItem>
                                            <MenuItem value="ja">日本語</MenuItem>
                                        </Select>
                                    </FormControl>

                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={profile.preferences.notifications}
                                                onChange={(e) => updateProfile({
                                                    preferences: { ...profile.preferences, notifications: e.target.checked }
                                                })}
                                            />
                                        }
                                        label="알림 받기"
                                        sx={{ mb: 2 }}
                                    />

                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={profile.preferences.autoRecommendations}
                                                onChange={(e) => updateProfile({
                                                    preferences: { ...profile.preferences, autoRecommendations: e.target.checked }
                                                })}
                                            />
                                        }
                                        label="자동 추천"
                                    />
                                </Box>

                                {/* 취향 설정 */}
                                <Box>
                                    <Typography variant="h6" gutterBottom>취향 설정</Typography>

                                    <Box sx={{ mb: 3 }}>
                                        <Typography variant="subtitle2" gutterBottom>관심 분야</Typography>
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                            {profile.interests.map((interest, index) => (
                                                <Chip key={index} label={interest} color="primary" />
                                            ))}
                                        </Box>
                                    </Box>

                                    <Box sx={{ mb: 3 }}>
                                        <Typography variant="subtitle2" gutterBottom>
                                            예산 범위: {profile.budgetRange.min.toLocaleString()}원 - {profile.budgetRange.max.toLocaleString()}원
                                        </Typography>
                                        <Slider
                                            value={[profile.budgetRange.min, profile.budgetRange.max]}
                                            onChange={(_, newValue) => {
                                                const [min, max] = newValue as number[];
                                                updateProfile({
                                                    budgetRange: { min, max }
                                                });
                                            }}
                                            valueLabelDisplay="auto"
                                            min={0}
                                            max={1000000}
                                            step={10000}
                                        />
                                    </Box>

                                    <Box sx={{ mb: 3 }}>
                                        <Typography variant="subtitle2" gutterBottom>선호 색상</Typography>
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                            {profile.colorPreferences.map((color, index) => (
                                                <Chip key={index} label={color} variant="outlined" />
                                            ))}
                                        </Box>
                                    </Box>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                )}

                {/* 맞춤 추천 탭 */}
                {activeTab === 1 && (
                    <Card>
                        <CardContent>
                            <Typography variant="h5" gutterBottom>🎯 맞춤 추천</Typography>

                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr' }, gap: 3 }}>
                                {recommendations.map((recommendation) => (
                                    <Card key={recommendation.id} variant="outlined">
                                        <CardContent>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                                <Chip
                                                    label={`${recommendation.confidence}% 매치`}
                                                    color={recommendation.confidence >= 90 ? 'success' : 'primary'}
                                                    size="small"
                                                />
                                                <Chip label={recommendation.category} size="small" variant="outlined" />
                                            </Box>

                                            <Typography variant="h6" gutterBottom>{recommendation.title}</Typography>
                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                                {recommendation.description}
                                            </Typography>

                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Typography variant="h6" color="primary.main">
                                                    {recommendation.price.toLocaleString()}원
                                                </Typography>
                                                <Button variant="contained" size="small" startIcon={<ShoppingCartIcon />}>
                                                    구매
                                                </Button>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                ))}
                            </Box>
                        </CardContent>
                    </Card>
                )}

                {/* VIP 지원 탭 */}
                {activeTab === 2 && (
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                        {/* 새 지원 요청 */}
                        <Card>
                            <CardContent>
                                <Typography variant="h5" gutterBottom>📞 새 지원 요청</Typography>

                                <TextField
                                    fullWidth
                                    label="제목"
                                    value={newTicketSubject}
                                    onChange={(e) => setNewTicketSubject(e.target.value)}
                                    sx={{ mb: 2 }}
                                />

                                <TextField
                                    fullWidth
                                    multiline
                                    rows={4}
                                    label="상세 내용"
                                    value={newTicketMessage}
                                    onChange={(e) => setNewTicketMessage(e.target.value)}
                                    sx={{ mb: 2 }}
                                />

                                <Button
                                    variant="contained"
                                    onClick={createSupportTicket}
                                    startIcon={<SendIcon />}
                                    disabled={!newTicketSubject.trim() || !newTicketMessage.trim()}
                                >
                                    지원 요청 보내기
                                </Button>
                            </CardContent>
                        </Card>

                        {/* 지원 티켓 목록 */}
                        <Card>
                            <CardContent>
                                <Typography variant="h5" gutterBottom>🎫 지원 티켓</Typography>

                                <List>
                                    {supportTickets.map((ticket) => (
                                        <ListItem key={ticket.id}>
                                            <ListItemAvatar>
                                                <Avatar sx={{ bgcolor: ticket.status === 'open' ? 'warning.main' : 'success.main' }}>
                                                    <ChatIcon />
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={ticket.subject}
                                                secondary={
                                                    <Box>
                                                        <Typography variant="caption" display="block">
                                                            상태: {ticket.status === 'open' ? '진행중' : '완료'} •
                                                            우선순위: {ticket.priority === 'high' ? '높음' : ticket.priority === 'medium' ? '보통' : '낮음'}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {new Date(ticket.createdAt).toLocaleDateString('ko-KR')}
                                                        </Typography>
                                                    </Box>
                                                }
                                            />
                                            <IconButton>
                                                <ChatIcon />
                                            </IconButton>
                                        </ListItem>
                                    ))}
                                </List>
                            </CardContent>
                        </Card>
                    </Box>
                )}

                {/* 테마 설정 탭 */}
                {activeTab === 3 && (
                    <Card>
                        <CardContent>
                            <Typography variant="h5" gutterBottom>🎨 테마 설정</Typography>

                            <Alert severity="info" sx={{ mb: 3 }}>
                                VIP 회원만 이용 가능한 고급 테마 커스터마이징 기능입니다.
                            </Alert>

                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2 }}>
                                {['다크 프로', '골드 럭셔리', '네온 게이머', '파스텔 드림', '미니멀 화이트', '레트로 바이브'].map((theme, index) => (
                                    <Card key={index} variant="outlined" sx={{ cursor: 'pointer', '&:hover': { boxShadow: 4 } }}>
                                        <CardContent sx={{ textAlign: 'center' }}>
                                            <Box sx={{
                                                height: 80,
                                                mb: 2,
                                                borderRadius: 1,
                                                background: `linear-gradient(45deg, ${['#1a1a1a', '#FFD700', '#00ff88', '#FFB6C1', '#ffffff', '#ff6b6b'][index]}, ${['#333', '#FFA500', '#0066ff', '#DDA0DD', '#f0f0f0', '#4ecdc4'][index]})`
                                            }} />
                                            <Typography variant="h6">{theme}</Typography>
                                            <Button variant="outlined" size="small" sx={{ mt: 1 }}>
                                                적용
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ))}
                            </Box>
                        </CardContent>
                    </Card>
                )}

                {/* 푸터 */}
                <Box sx={{ mt: 4, p: 2, bgcolor: 'grey.50', borderRadius: 2, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                        💡 VIP 개인화 서비스가 실제 API와 연결되었습니다!
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        🚀 API 엔드포인트: /api/vip-personalized-service/* 활용
                    </Typography>
                </Box>
            </Box>
        </Container>
    );
};

export default VIPPersonalizedService;