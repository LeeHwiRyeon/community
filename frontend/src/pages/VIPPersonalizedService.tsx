import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    Button,
    Tabs,
    Tab,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Alert,
    CircularProgress,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Rating,
    Avatar,
    Badge,
    IconButton,
    Tooltip,
    Slider,
    Switch,
    FormControlLabel
} from '@mui/material';
import {
    Person as PersonIcon,
    Recommend as RecommendIcon,
    Support as SupportIcon,
    Chat as ChatIcon,
    Star as StarIcon,
    ThumbUp as ThumbUpIcon,
    ThumbDown as ThumbDownIcon,
    Visibility as VisibilityIcon,
    ShoppingCart as ShoppingCartIcon,
    Add as AddIcon,
    Refresh as RefreshIcon,
    Settings as SettingsIcon,
    Analytics as AnalyticsIcon,
    Group as GroupIcon,
    Message as MessageIcon
} from '@mui/icons-material';

interface VIPProfile {
    id: string;
    userId: string;
    preferences: Record<string, any>;
    interests: string[];
    budgetRange: { min: number; max: number };
    stylePreferences: string[];
    sizePreferences: string[];
    colorPreferences: string[];
    brandPreferences: string[];
    activityLevel: string;
    socialPreferences: Record<string, any>;
    personalizationLevel: string;
    recommendationScore: number;
}

interface Recommendation {
    id: string;
    name: string;
    category: string;
    price: number;
    discount: number;
    reason: string;
    confidence: number;
}

interface SupportTicket {
    id: string;
    category: string;
    priority: string;
    subject: string;
    description: string;
    status: string;
    assignedTo: string;
    createdAt: string;
    firstResponseTime: string;
    resolutionTime: string;
}

interface ExclusiveChannel {
    id: string;
    channelName: string;
    description: string;
    accessLevel: string;
    maxMembers: number;
    features: string[];
    members: string[];
    moderators: string[];
    isActive: boolean;
}

const VIPPersonalizedService: React.FC = () => {
    const [currentTab, setCurrentTab] = useState(0);
    const [profile, setProfile] = useState<VIPProfile | null>(null);
    const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
    const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
    const [exclusiveChannels, setExclusiveChannels] = useState<ExclusiveChannel[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 다이얼로그 상태
    const [openProfileDialog, setOpenProfileDialog] = useState(false);
    const [openSupportDialog, setOpenSupportDialog] = useState(false);
    const [openChannelDialog, setOpenChannelDialog] = useState(false);
    const [openRecommendationDialog, setOpenRecommendationDialog] = useState(false);

    // 폼 상태
    const [profileForm, setProfileForm] = useState({
        interests: [] as string[],
        budgetRange: { min: 0, max: 1000000 },
        stylePreferences: [] as string[],
        brandPreferences: [] as string[],
        activityLevel: 'medium'
    });

    const [supportForm, setSupportForm] = useState({
        category: '',
        priority: 'HIGH',
        subject: '',
        description: '',
        urgencyLevel: 'medium'
    });

    const [channelForm, setChannelForm] = useState({
        channelType: 'general',
        channelName: '',
        description: '',
        maxMembers: 50,
        features: [] as string[]
    });

    useEffect(() => {
        fetchVIPData();
    }, []);

    const fetchVIPData = async () => {
        try {
            setLoading(true);
            const userId = 'vip_user_001';

            // 프로필 데이터 가져오기
            const profileResponse = await fetch(`http://localhost:5000/api/vip-personalized-service/profiles/${userId}`);
            if (profileResponse.ok) {
                const profileData = await profileResponse.json();
                setProfile(profileData.data);
            }

            // 추천 데이터 가져오기
            const recommendationsResponse = await fetch(`http://localhost:5000/api/vip-personalized-service/recommendations/${userId}`);
            if (recommendationsResponse.ok) {
                const recommendationsData = await recommendationsResponse.json();
                setRecommendations(recommendationsData.data.products || []);
            }

            // 지원 티켓 가져오기
            const ticketsResponse = await fetch(`http://localhost:5000/api/vip-personalized-service/support-tickets/${userId}`);
            if (ticketsResponse.ok) {
                const ticketsData = await ticketsResponse.json();
                setSupportTickets(ticketsData.data || []);
            }

            // 전용 채널 가져오기
            const channelsResponse = await fetch(`http://localhost:5000/api/vip-personalized-service/exclusive-channels/${userId}`);
            if (channelsResponse.ok) {
                const channelsData = await channelsResponse.json();
                setExclusiveChannels(channelsData.data || []);
            }

        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setCurrentTab(newValue);
    };

    const handleRecommendationFeedback = async (productId: string, action: string, rating?: number) => {
        try {
            const response = await fetch(`http://localhost:5000/api/vip-personalized-service/recommendations/vip_user_001/feedback`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productId,
                    action,
                    rating: rating || 0
                })
            });

            if (response.ok) {
                // 추천 목록 새로고침
                fetchVIPData();
            }
        } catch (e) {
            console.error('피드백 처리 실패:', e);
        }
    };

    const handleCreateSupportTicket = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/vip-personalized-service/support-tickets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: 'vip_user_001',
                    ...supportForm
                })
            });

            if (response.ok) {
                const data = await response.json();
                setSupportTickets([data.data, ...supportTickets]);
                setOpenSupportDialog(false);
                setSupportForm({
                    category: '',
                    priority: 'HIGH',
                    subject: '',
                    description: '',
                    urgencyLevel: 'medium'
                });
            }
        } catch (e) {
            console.error('지원 티켓 생성 실패:', e);
        }
    };

    const handleCreateChannel = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/vip-personalized-service/exclusive-channels', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: 'vip_user_001',
                    ...channelForm
                })
            });

            if (response.ok) {
                const data = await response.json();
                setExclusiveChannels([data.data, ...exclusiveChannels]);
                setOpenChannelDialog(false);
                setChannelForm({
                    channelType: 'general',
                    channelName: '',
                    description: '',
                    maxMembers: 50,
                    features: []
                });
            }
        } catch (e) {
            console.error('채널 생성 실패:', e);
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'URGENT': return 'error';
            case 'HIGH': return 'warning';
            case 'MEDIUM': return 'info';
            case 'LOW': return 'success';
            default: return 'default';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'OPEN': return 'error';
            case 'ASSIGNED': return 'warning';
            case 'IN_PROGRESS': return 'info';
            case 'RESOLVED': return 'success';
            default: return 'default';
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">Error: {error}</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" component="h1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <PersonIcon sx={{ mr: 1 }} />
                VIP 전용 맞춤형 서비스
            </Typography>

            {/* 프로필 요약 카드 */}
            {profile && (
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card raised>
                            <CardContent>
                                <Typography variant="h6" component="h2" sx={{ display: 'flex', alignItems: 'center' }}>
                                    <StarIcon sx={{ mr: 1 }} /> 개인화 수준
                                </Typography>
                                <Typography variant="h4" color="primary.main">
                                    {profile.personalizationLevel.toUpperCase()}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card raised>
                            <CardContent>
                                <Typography variant="h6" component="h2" sx={{ display: 'flex', alignItems: 'center' }}>
                                    <RecommendIcon sx={{ mr: 1 }} /> 추천 점수
                                </Typography>
                                <Typography variant="h4" color="success.main">
                                    {Math.round(profile.recommendationScore * 100)}%
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card raised>
                            <CardContent>
                                <Typography variant="h6" component="h2" sx={{ display: 'flex', alignItems: 'center' }}>
                                    <SupportIcon sx={{ mr: 1 }} /> 활성 지원
                                </Typography>
                                <Typography variant="h4" color="warning.main">
                                    {supportTickets.filter(t => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card raised>
                            <CardContent>
                                <Typography variant="h6" component="h2" sx={{ display: 'flex', alignItems: 'center' }}>
                                    <ChatIcon sx={{ mr: 1 }} /> 전용 채널
                                </Typography>
                                <Typography variant="h4" color="info.main">
                                    {exclusiveChannels.length}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            <Tabs value={currentTab} onChange={handleTabChange} aria-label="VIP personalized service tabs" sx={{ mb: 3 }}>
                <Tab label="개인화 추천" />
                <Tab label="우선 지원" />
                <Tab label="전용 채널" />
                <Tab label="프로필 관리" />
            </Tabs>

            {/* 개인화 추천 탭 */}
            {currentTab === 0 && (
                <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h5">개인화된 추천</Typography>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={() => setOpenRecommendationDialog(true)}
                            >
                                추천 요청
                            </Button>
                            <IconButton onClick={fetchVIPData}>
                                <RefreshIcon />
                            </IconButton>
                        </Box>
                    </Box>

                    <Grid container spacing={3}>
                        {recommendations.map((recommendation) => (
                            <Grid item key={recommendation.id} xs={12} sm={6} md={4} lg={3}>
                                <Card raised sx={{ height: '100%' }}>
                                    <CardContent>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                            <Typography variant="h6" component="h3" sx={{ flexGrow: 1 }}>
                                                {recommendation.name}
                                            </Typography>
                                            <Chip
                                                label={`${Math.round(recommendation.confidence * 100)}%`}
                                                color="success"
                                                size="small"
                                            />
                                        </Box>

                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                            {recommendation.reason}
                                        </Typography>

                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                            <Typography variant="h6" color="primary">
                                                {recommendation.price.toLocaleString()}원
                                            </Typography>
                                            <Chip
                                                label={`${recommendation.discount}% 할인`}
                                                color="error"
                                                size="small"
                                            />
                                        </Box>

                                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                                            <Tooltip title="좋아요">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleRecommendationFeedback(recommendation.id, 'liked', 5)}
                                                >
                                                    <ThumbUpIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="보기">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleRecommendationFeedback(recommendation.id, 'viewed')}
                                                >
                                                    <VisibilityIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="구매">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleRecommendationFeedback(recommendation.id, 'purchased')}
                                                >
                                                    <ShoppingCartIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="싫어요">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleRecommendationFeedback(recommendation.id, 'dismissed', 1)}
                                                >
                                                    <ThumbDownIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            )}

            {/* 우선 지원 탭 */}
            {currentTab === 1 && (
                <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h5">VIP 우선 지원</Typography>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => setOpenSupportDialog(true)}
                        >
                            지원 요청
                        </Button>
                    </Box>

                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>제목</TableCell>
                                    <TableCell>카테고리</TableCell>
                                    <TableCell>우선순위</TableCell>
                                    <TableCell>상태</TableCell>
                                    <TableCell>담당자</TableCell>
                                    <TableCell>생성일</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {supportTickets.map((ticket) => (
                                    <TableRow key={ticket.id}>
                                        <TableCell>{ticket.subject}</TableCell>
                                        <TableCell>{ticket.category}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={ticket.priority}
                                                color={getPriorityColor(ticket.priority)}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={ticket.status}
                                                color={getStatusColor(ticket.status)}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>{ticket.assignedTo}</TableCell>
                                        <TableCell>
                                            {new Date(ticket.createdAt).toLocaleDateString()}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            )}

            {/* 전용 채널 탭 */}
            {currentTab === 2 && (
                <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h5">VIP 전용 채널</Typography>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => setOpenChannelDialog(true)}
                        >
                            채널 생성
                        </Button>
                    </Box>

                    <Grid container spacing={3}>
                        {exclusiveChannels.map((channel) => (
                            <Grid item key={channel.id} xs={12} sm={6} md={4}>
                                <Card raised>
                                    <CardContent>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                            <Typography variant="h6" component="h3">
                                                {channel.channelName}
                                            </Typography>
                                            <Chip
                                                label={channel.isActive ? '활성' : '비활성'}
                                                color={channel.isActive ? 'success' : 'default'}
                                                size="small"
                                            />
                                        </Box>

                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                            {channel.description}
                                        </Typography>

                                        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                                            <Chip
                                                icon={<GroupIcon />}
                                                label={`${channel.members.length}/${channel.maxMembers}`}
                                                size="small"
                                                variant="outlined"
                                            />
                                            <Chip
                                                icon={<MessageIcon />}
                                                label={channel.accessLevel}
                                                size="small"
                                                variant="outlined"
                                            />
                                        </Box>

                                        <Typography variant="body2" color="text.secondary">
                                            기능: {channel.features.join(', ')}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            )}

            {/* 프로필 관리 탭 */}
            {currentTab === 3 && (
                <Box>
                    <Typography variant="h5" gutterBottom>프로필 관리</Typography>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>현재 프로필</Typography>
                                    {profile && (
                                        <Box>
                                            <Typography variant="body1" gutterBottom>
                                                <strong>관심사:</strong> {profile.interests.join(', ')}
                                            </Typography>
                                            <Typography variant="body1" gutterBottom>
                                                <strong>예산 범위:</strong> {profile.budgetRange.min.toLocaleString()}원 - {profile.budgetRange.max.toLocaleString()}원
                                            </Typography>
                                            <Typography variant="body1" gutterBottom>
                                                <strong>스타일 선호도:</strong> {profile.stylePreferences.join(', ')}
                                            </Typography>
                                            <Typography variant="body1" gutterBottom>
                                                <strong>브랜드 선호도:</strong> {profile.brandPreferences.join(', ')}
                                            </Typography>
                                            <Typography variant="body1" gutterBottom>
                                                <strong>활동 수준:</strong> {profile.activityLevel}
                                            </Typography>
                                        </Box>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>프로필 설정</Typography>
                                    <Button
                                        variant="contained"
                                        startIcon={<SettingsIcon />}
                                        onClick={() => setOpenProfileDialog(true)}
                                        fullWidth
                                    >
                                        프로필 수정
                                    </Button>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </Box>
            )}

            {/* 지원 요청 다이얼로그 */}
            <Dialog open={openSupportDialog} onClose={() => setOpenSupportDialog(false)} maxWidth="md" fullWidth>
                <DialogTitle>VIP 지원 요청</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth>
                                <InputLabel>카테고리</InputLabel>
                                <Select
                                    value={supportForm.category}
                                    onChange={(e) => setSupportForm({ ...supportForm, category: e.target.value })}
                                    label="카테고리"
                                >
                                    <MenuItem value="technical">기술 지원</MenuItem>
                                    <MenuItem value="billing">결제 문의</MenuItem>
                                    <MenuItem value="product">상품 문의</MenuItem>
                                    <MenuItem value="general">일반 문의</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth>
                                <InputLabel>우선순위</InputLabel>
                                <Select
                                    value={supportForm.priority}
                                    onChange={(e) => setSupportForm({ ...supportForm, priority: e.target.value })}
                                    label="우선순위"
                                >
                                    <MenuItem value="URGENT">긴급</MenuItem>
                                    <MenuItem value="HIGH">높음</MenuItem>
                                    <MenuItem value="MEDIUM">보통</MenuItem>
                                    <MenuItem value="LOW">낮음</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="제목"
                                value={supportForm.subject}
                                onChange={(e) => setSupportForm({ ...supportForm, subject: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="설명"
                                multiline
                                rows={4}
                                value={supportForm.description}
                                onChange={(e) => setSupportForm({ ...supportForm, description: e.target.value })}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenSupportDialog(false)}>취소</Button>
                    <Button variant="contained" onClick={handleCreateSupportTicket}>
                        요청
                    </Button>
                </DialogActions>
            </Dialog>

            {/* 채널 생성 다이얼로그 */}
            <Dialog open={openChannelDialog} onClose={() => setOpenChannelDialog(false)} maxWidth="md" fullWidth>
                <DialogTitle>VIP 전용 채널 생성</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth>
                                <InputLabel>채널 타입</InputLabel>
                                <Select
                                    value={channelForm.channelType}
                                    onChange={(e) => setChannelForm({ ...channelForm, channelType: e.target.value })}
                                    label="채널 타입"
                                >
                                    <MenuItem value="general">일반</MenuItem>
                                    <MenuItem value="cosplay">코스플레이</MenuItem>
                                    <MenuItem value="streaming">스트리밍</MenuItem>
                                    <MenuItem value="gaming">게이밍</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="최대 멤버 수"
                                type="number"
                                value={channelForm.maxMembers}
                                onChange={(e) => setChannelForm({ ...channelForm, maxMembers: parseInt(e.target.value) })}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="채널명"
                                value={channelForm.channelName}
                                onChange={(e) => setChannelForm({ ...channelForm, channelName: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="설명"
                                multiline
                                rows={3}
                                value={channelForm.description}
                                onChange={(e) => setChannelForm({ ...channelForm, description: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Typography variant="subtitle1" gutterBottom>채널 기능</Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {['chat', 'voice', 'video', 'file_sharing', 'screen_sharing'].map((feature) => (
                                    <FormControlLabel
                                        key={feature}
                                        control={
                                            <Switch
                                                checked={channelForm.features.includes(feature)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setChannelForm({
                                                            ...channelForm,
                                                            features: [...channelForm.features, feature]
                                                        });
                                                    } else {
                                                        setChannelForm({
                                                            ...channelForm,
                                                            features: channelForm.features.filter(f => f !== feature)
                                                        });
                                                    }
                                                }}
                                            />
                                        }
                                        label={feature}
                                    />
                                ))}
                            </Box>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenChannelDialog(false)}>취소</Button>
                    <Button variant="contained" onClick={handleCreateChannel}>
                        생성
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default VIPPersonalizedService;
