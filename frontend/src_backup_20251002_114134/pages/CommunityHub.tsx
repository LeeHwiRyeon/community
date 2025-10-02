import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    CardMedia,
    Button,
    Chip,
    Avatar,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Tabs,
    Tab,
    Paper,
    LinearProgress,
    IconButton,
    Tooltip,
    Badge,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Switch,
    FormControlLabel,
    Divider
} from '@mui/material';
import {
    TrendingUp as TrendingUpIcon,
    People as PeopleIcon,
    Chat as ChatIcon,
    Visibility as VisibilityIcon,
    ThumbUp as ThumbUpIcon,
    Share as ShareIcon,
    Bookmark as BookmarkIcon,
    Notifications as NotificationsIcon,
    Settings as SettingsIcon,
    PlayArrow as PlayArrowIcon,
    PhotoCamera as PhotoCameraIcon,
    LiveTv as LiveTvIcon,
    Article as ArticleIcon,
    Games as GamesIcon,
    Palette as PaletteIcon,
    Analytics as AnalyticsIcon,
    Star as StarIcon,
    Group as GroupIcon,
    Schedule as ScheduleIcon,
    EmojiEvents as EmojiEventsIcon
} from '@mui/icons-material';

interface Community {
    id: string;
    name: string;
    description: string;
    category: string;
    memberCount: number;
    activeUsers: number;
    dailyPosts: number;
    trendingTopics: Array<{
        topic: string;
        posts: number;
        engagement: number;
    }>;
    popularTags: string[];
    recentActivity: Array<{
        type: string;
        title: string;
        author: string;
        time: string;
        views?: number;
        likes?: number;
    }>;
    features: string[];
    uiTheme: string;
    layout: string;
    customUI: {
        layout: any;
        theme: any;
        features: any;
        navigation: any;
        content: any;
        notifications: any;
    };
}

interface CommunityHubData {
    communities: Community[];
    userBehavior: any;
    recommendations: Array<{
        community: Community;
        score: number;
        reason: string;
    }>;
    statistics: {
        totalCommunities: number;
        totalMembers: number;
        totalActiveUsers: number;
        totalDailyPosts: number;
    };
}

const CommunityHub: React.FC = () => {
    const [hubData, setHubData] = useState<CommunityHubData | null>(null);
    const [currentTab, setCurrentTab] = useState(0);
    const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
    const [openDetailDialog, setOpenDetailDialog] = useState(false);
    const [openSettingsDialog, setOpenSettingsDialog] = useState(false);
    const [userType, setUserType] = useState('news_user');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchCommunityHubData();
    }, [userType]);

    const fetchCommunityHubData = async () => {
        try {
            setLoading(true);
            const response = await fetch(`http://localhost:5000/api/community-hub?userType=${userType}`);
            if (!response.ok) throw new Error(`Failed to fetch community hub data: ${response.status}`);
            const data = await response.json();
            setHubData(data.data);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setCurrentTab(newValue);
    };

    const handleCommunityClick = (community: Community) => {
        setSelectedCommunity(community);
        setOpenDetailDialog(true);
    };

    const handleUserTypeChange = (newUserType: string) => {
        setUserType(newUserType);
    };

    const getCommunityIcon = (category: string) => {
        switch (category) {
            case 'news': return <ArticleIcon />;
            case 'games': return <GamesIcon />;
            case 'streaming': return <LiveTvIcon />;
            case 'cosplay': return <PaletteIcon />;
            default: return <GroupIcon />;
        }
    };

    const getCommunityColor = (category: string) => {
        switch (category) {
            case 'news': return '#1976d2';
            case 'games': return '#9c27b0';
            case 'streaming': return '#f44336';
            case 'cosplay': return '#e91e63';
            default: return '#424242';
        }
    };

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'post': return <ArticleIcon />;
            case 'comment': return <ChatIcon />;
            case 'like': return <ThumbUpIcon />;
            case 'share': return <ShareIcon />;
            default: return <VisibilityIcon />;
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <LinearProgress sx={{ width: '50%' }} />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 3 }}>
                <Typography color="error">Error: {error}</Typography>
            </Box>
        );
    }

    if (!hubData) {
        return (
            <Box sx={{ p: 3 }}>
                <Typography>데이터를 불러올 수 없습니다.</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            {/* 헤더 */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center' }}>
                    <GroupIcon sx={{ mr: 1 }} />
                    커뮤니티 허브
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <FormControl sx={{ minWidth: 120 }}>
                        <InputLabel>사용자 타입</InputLabel>
                        <Select
                            value={userType}
                            label="사용자 타입"
                            onChange={(e) => handleUserTypeChange(e.target.value)}
                        >
                            <MenuItem value="news_user">뉴스 사용자</MenuItem>
                            <MenuItem value="gaming_user">게임 사용자</MenuItem>
                            <MenuItem value="streaming_user">스트리밍 사용자</MenuItem>
                            <MenuItem value="cosplay_user">코스프레 사용자</MenuItem>
                        </Select>
                    </FormControl>
                    <IconButton onClick={() => setOpenSettingsDialog(true)}>
                        <SettingsIcon />
                    </IconButton>
                </Box>
            </Box>

            {/* 통계 카드 */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card raised>
                        <CardContent>
                            <Typography variant="h6" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                                <GroupIcon sx={{ mr: 1 }} /> 총 커뮤니티
                            </Typography>
                            <Typography variant="h3" color="primary">
                                {hubData.statistics.totalCommunities}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card raised>
                        <CardContent>
                            <Typography variant="h6" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                                <PeopleIcon sx={{ mr: 1 }} /> 총 멤버
                            </Typography>
                            <Typography variant="h3" color="success.main">
                                {hubData.statistics.totalMembers.toLocaleString()}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card raised>
                        <CardContent>
                            <Typography variant="h6" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                                <TrendingUpIcon sx={{ mr: 1 }} /> 활성 사용자
                            </Typography>
                            <Typography variant="h3" color="warning.main">
                                {hubData.statistics.totalActiveUsers.toLocaleString()}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card raised>
                        <CardContent>
                            <Typography variant="h6" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                                <ChatIcon sx={{ mr: 1 }} /> 일일 게시글
                            </Typography>
                            <Typography variant="h3" color="info.main">
                                {hubData.statistics.totalDailyPosts}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* 탭 네비게이션 */}
            <Tabs value={currentTab} onChange={handleTabChange} aria-label="community hub tabs" sx={{ mb: 3 }}>
                <Tab label="모든 커뮤니티" />
                <Tab label="추천 커뮤니티" />
                <Tab label="트렌딩" />
                <Tab label="분석" />
            </Tabs>

            {/* 모든 커뮤니티 탭 */}
            {currentTab === 0 && (
                <Grid container spacing={3}>
                    {hubData.communities.map((community) => (
                        <Grid item key={community.id} xs={12} sm={6} md={4} lg={3}>
                            <Card
                                raised
                                sx={{
                                    height: '100%',
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s',
                                    '&:hover': { transform: 'translateY(-4px)' }
                                }}
                                onClick={() => handleCommunityClick(community)}
                            >
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                        <Avatar sx={{ bgcolor: getCommunityColor(community.category), mr: 2 }}>
                                            {getCommunityIcon(community.category)}
                                        </Avatar>
                                        <Box>
                                            <Typography variant="h6" component="h3">
                                                {community.name}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {community.category}
                                            </Typography>
                                        </Box>
                                    </Box>

                                    <Typography variant="body2" sx={{ mb: 2 }}>
                                        {community.description}
                                    </Typography>

                                    <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                                        {community.popularTags.slice(0, 3).map((tag) => (
                                            <Chip key={tag} label={tag} size="small" variant="outlined" />
                                        ))}
                                    </Box>

                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography variant="body2" color="text.secondary">
                                            멤버: {community.memberCount.toLocaleString()}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            활성: {community.activeUsers.toLocaleString()}
                                        </Typography>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* 추천 커뮤니티 탭 */}
            {currentTab === 1 && (
                <Grid container spacing={3}>
                    {hubData.recommendations.map((recommendation) => (
                        <Grid item key={recommendation.community.id} xs={12} sm={6} md={4}>
                            <Card raised sx={{ height: '100%' }}>
                                <CardContent>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                        <Typography variant="h6" component="h3">
                                            {recommendation.community.name}
                                        </Typography>
                                        <Chip
                                            label={`${Math.round(recommendation.score * 100)}%`}
                                            color="success"
                                            size="small"
                                        />
                                    </Box>

                                    <Typography variant="body2" sx={{ mb: 2 }}>
                                        {recommendation.community.description}
                                    </Typography>

                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                        추천 이유: {recommendation.reason}
                                    </Typography>

                                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                                        {recommendation.community.features.slice(0, 2).map((feature) => (
                                            <Chip key={feature} label={feature} size="small" />
                                        ))}
                                    </Box>

                                    <Button
                                        variant="contained"
                                        fullWidth
                                        onClick={() => handleCommunityClick(recommendation.community)}
                                    >
                                        커뮤니티 참여
                                    </Button>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* 트렌딩 탭 */}
            {currentTab === 2 && (
                <Grid container spacing={3}>
                    {hubData.communities.map((community) => (
                        <Grid item key={community.id} xs={12} md={6}>
                            <Card raised>
                                <CardContent>
                                    <Typography variant="h6" component="h3" sx={{ mb: 2 }}>
                                        {community.name} 트렌딩
                                    </Typography>

                                    <List>
                                        {community.trendingTopics.map((topic, index) => (
                                            <ListItem key={index}>
                                                <ListItemAvatar>
                                                    <Avatar sx={{ bgcolor: getCommunityColor(community.category) }}>
                                                        <TrendingUpIcon />
                                                    </Avatar>
                                                </ListItemAvatar>
                                                <ListItemText
                                                    primary={topic.topic}
                                                    secondary={`${topic.posts}개 게시글 • ${topic.engagement}% 참여도`}
                                                />
                                            </ListItem>
                                        ))}
                                    </List>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* 분석 탭 */}
            {currentTab === 3 && (
                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <Card raised>
                            <CardContent>
                                <Typography variant="h6" component="h3" sx={{ mb: 2 }}>
                                    사용자 행동 분석
                                </Typography>

                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        관심사: {hubData.userBehavior.preferences.join(', ')}
                                    </Typography>
                                </Box>

                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        활동 패턴: {hubData.userBehavior.activityPattern}
                                    </Typography>
                                </Box>

                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        참여도: {hubData.userBehavior.engagementLevel}
                                    </Typography>
                                </Box>

                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        선호 기능: {hubData.userBehavior.favoriteFeatures.join(', ')}
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Card raised>
                            <CardContent>
                                <Typography variant="h6" component="h3" sx={{ mb: 2 }}>
                                    커뮤니티 성장률
                                </Typography>

                                {hubData.communities.map((community) => (
                                    <Box key={community.id} sx={{ mb: 2 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                            <Typography variant="body2">{community.name}</Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {community.memberCount.toLocaleString()}명
                                            </Typography>
                                        </Box>
                                        <LinearProgress
                                            variant="determinate"
                                            value={(community.memberCount / hubData.statistics.totalMembers) * 100}
                                            sx={{ height: 8, borderRadius: 4 }}
                                        />
                                    </Box>
                                ))}
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            {/* 커뮤니티 상세 다이얼로그 */}
            <Dialog open={openDetailDialog} onClose={() => setOpenDetailDialog(false)} maxWidth="md" fullWidth>
                <DialogTitle>
                    {selectedCommunity?.name}
                    <IconButton
                        aria-label="close"
                        onClick={() => setOpenDetailDialog(false)}
                        sx={{ position: 'absolute', right: 8, top: 8 }}
                    >
                        <SettingsIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    {selectedCommunity && (
                        <Box>
                            <Typography variant="body1" sx={{ mb: 3 }}>
                                {selectedCommunity.description}
                            </Typography>

                            <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="h6" gutterBottom>
                                        최근 활동
                                    </Typography>
                                    <List>
                                        {selectedCommunity.recentActivity.map((activity, index) => (
                                            <ListItem key={index}>
                                                <ListItemAvatar>
                                                    <Avatar>
                                                        {getActivityIcon(activity.type)}
                                                    </Avatar>
                                                </ListItemAvatar>
                                                <ListItemText
                                                    primary={activity.title}
                                                    secondary={`${activity.author} • ${activity.time}`}
                                                />
                                            </ListItem>
                                        ))}
                                    </List>
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <Typography variant="h6" gutterBottom>
                                        주요 기능
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                        {selectedCommunity.features.map((feature) => (
                                            <Chip key={feature} label={feature} />
                                        ))}
                                    </Box>

                                    <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                                        인기 태그
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                        {selectedCommunity.popularTags.map((tag) => (
                                            <Chip key={tag} label={tag} variant="outlined" />
                                        ))}
                                    </Box>
                                </Grid>
                            </Grid>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDetailDialog(false)}>닫기</Button>
                    <Button variant="contained">커뮤니티 참여</Button>
                </DialogActions>
            </Dialog>

            {/* 설정 다이얼로그 */}
            <Dialog open={openSettingsDialog} onClose={() => setOpenSettingsDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>커뮤니티 허브 설정</DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2 }}>
                        <FormControl fullWidth sx={{ mb: 2 }}>
                            <InputLabel>사용자 타입</InputLabel>
                            <Select
                                value={userType}
                                label="사용자 타입"
                                onChange={(e) => setUserType(e.target.value)}
                            >
                                <MenuItem value="news_user">뉴스 사용자</MenuItem>
                                <MenuItem value="gaming_user">게임 사용자</MenuItem>
                                <MenuItem value="streaming_user">스트리밍 사용자</MenuItem>
                                <MenuItem value="cosplay_user">코스프레 사용자</MenuItem>
                            </Select>
                        </FormControl>

                        <FormControlLabel
                            control={<Switch defaultChecked />}
                            label="개인화 추천 활성화"
                        />

                        <FormControlLabel
                            control={<Switch defaultChecked />}
                            label="알림 받기"
                        />

                        <FormControlLabel
                            control={<Switch />}
                            label="다크 모드"
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenSettingsDialog(false)}>취소</Button>
                    <Button variant="contained" onClick={() => setOpenSettingsDialog(false)}>
                        저장
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default CommunityHub;