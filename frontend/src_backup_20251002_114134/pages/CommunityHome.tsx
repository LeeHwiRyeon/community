import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Container,
    Grid,
    Card,
    CardContent,
    Typography,
    Chip,
    Button,
    Avatar,
    Tabs,
    Tab,
    Badge,
    IconButton,
    Tooltip,
    Skeleton,
    Alert,
    Divider
} from '@mui/material';
import {
    Home as HomeIcon,
    Article as ArticleIcon,
    People as PeopleIcon,
    TrendingUp as TrendingIcon,
    Star as StarIcon,
    Chat as ChatIcon,
    Notifications as NotificationsIcon,
    Settings as SettingsIcon,
    Menu as MenuIcon,
    Search as SearchIcon,
    FilterList as FilterIcon,
    ViewModule as GridIcon,
    ViewList as ListIcon,
    Timeline as TimelineIcon
} from '@mui/icons-material';
import { CommunityType, CommunityCategory, COMMUNITY_TYPE_CONFIGS } from '../types/communityTypes';
import { styled } from '@mui/material/styles';

// 커뮤니티 타입별 스타일드 컴포넌트
const StyledCommunityContainer = styled(Container)<{ communityType: CommunityCategory }>(({ theme, communityType }) => {
    const config = COMMUNITY_TYPE_CONFIGS[communityType];
    return {
        backgroundColor: config?.theme?.backgroundColor || theme.palette.background.default,
        color: config?.theme?.textColor || theme.palette.text.primary,
        fontFamily: config?.theme?.fontFamily || theme.typography.fontFamily,
        minHeight: '100vh',
        '& .community-header': {
            background: `linear-gradient(135deg, ${config?.theme?.primaryColor || theme.palette.primary.main}, ${config?.theme?.secondaryColor || theme.palette.secondary.main})`,
            color: 'white',
            padding: theme.spacing(4),
            borderRadius: config?.theme?.borderRadius || theme.shape.borderRadius,
            marginBottom: theme.spacing(3),
            boxShadow: config?.theme?.shadow || theme.shadows[2]
        },
        '& .community-card': {
            borderRadius: config?.theme?.borderRadius || theme.shape.borderRadius,
            boxShadow: config?.theme?.shadow || theme.shadows[1],
            border: `1px solid ${config?.theme?.accentColor || theme.palette.divider}`,
            transition: 'all 0.3s ease',
            '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: theme.shadows[4]
            }
        },
        '& .feature-card': {
            background: config?.theme?.backgroundColor || theme.palette.background.paper,
            border: `2px solid ${config?.theme?.primaryColor || theme.palette.primary.main}`,
            borderRadius: config?.theme?.borderRadius || theme.shape.borderRadius
        }
    };
});

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`community-tabpanel-${index}`}
            aria-labelledby={`community-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
        </div>
    );
}

const CommunityHome: React.FC = () => {
    const { communityId } = useParams<{ communityId: string }>();
    const navigate = useNavigate();
    const [community, setCommunity] = useState<CommunityType | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState(0);
    const [viewMode, setViewMode] = useState<'grid' | 'list' | 'timeline'>('grid');

    useEffect(() => {
        loadCommunityData();
    }, [communityId]);

    const loadCommunityData = async () => {
        try {
            setLoading(true);
            // 실제 API 호출로 대체
            const response = await fetch(`/api/communities/${communityId}`);
            if (!response.ok) {
                throw new Error('커뮤니티를 찾을 수 없습니다.');
            }
            const data = await response.json();
            setCommunity(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
    };

    const handleViewModeChange = (mode: 'grid' | 'list' | 'timeline') => {
        setViewMode(mode);
    };

    if (loading) {
        return (
            <Container maxWidth="xl">
                <Skeleton variant="rectangular" height={200} sx={{ mb: 3 }} />
                <Grid container spacing={3}>
                    {[1, 2, 3, 4].map((item) => (
                        <Grid item xs={12} md={6} lg={3} key={item}>
                            <Skeleton variant="rectangular" height={150} />
                        </Grid>
                    ))}
                </Grid>
            </Container>
        );
    }

    if (error || !community) {
        return (
            <Container maxWidth="xl">
                <Alert severity="error" sx={{ mt: 3 }}>
                    {error || '커뮤니티를 찾을 수 없습니다.'}
                </Alert>
            </Container>
        );
    }

    const config = COMMUNITY_TYPE_CONFIGS[community.type];
    const features = config?.features || [];

    return (
        <StyledCommunityContainer
            maxWidth="xl"
            communityType={community.type}
            sx={{ py: 3 }}
        >
            {/* 커뮤니티 헤더 */}
            <Box className="community-header">
                <Grid container spacing={3} alignItems="center">
                    <Grid item xs={12} md={8}>
                        <Typography variant="h3" component="h1" gutterBottom>
                            {community.name}
                        </Typography>
                        <Typography variant="h6" sx={{ opacity: 0.9, mb: 2 }}>
                            {community.description}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            <Chip
                                label={community.type}
                                color="primary"
                                variant="outlined"
                                sx={{ color: 'white', borderColor: 'white' }}
                            />
                            <Chip
                                label={`${community.memberCount}명`}
                                color="secondary"
                                variant="outlined"
                                sx={{ color: 'white', borderColor: 'white' }}
                            />
                            <Chip
                                label={community.isActive ? '활성' : '비활성'}
                                color={community.isActive ? 'success' : 'default'}
                                variant="outlined"
                                sx={{ color: 'white', borderColor: 'white' }}
                            />
                        </Box>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                            <Tooltip title="검색">
                                <IconButton color="inherit">
                                    <SearchIcon />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="필터">
                                <IconButton color="inherit">
                                    <FilterIcon />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="알림">
                                <IconButton color="inherit">
                                    <Badge badgeContent={4} color="error">
                                        <NotificationsIcon />
                                    </Badge>
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="설정">
                                <IconButton color="inherit">
                                    <SettingsIcon />
                                </IconButton>
                            </Tooltip>
                        </Box>
                    </Grid>
                </Grid>
            </Box>

            {/* 네비게이션 탭 */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={activeTab} onChange={handleTabChange} aria-label="community tabs">
                    <Tab icon={<HomeIcon />} label="홈" />
                    <Tab icon={<ArticleIcon />} label="게시글" />
                    <Tab icon={<PeopleIcon />} label="멤버" />
                    <Tab icon={<TrendingIcon />} label="트렌딩" />
                    <Tab icon={<ChatIcon />} label="채팅" />
                </Tabs>
            </Box>

            {/* 뷰 모드 컨트롤 */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">
                    {activeTab === 0 ? '주요 기능' :
                        activeTab === 1 ? '최신 게시글' :
                            activeTab === 2 ? '멤버 목록' :
                                activeTab === 3 ? '인기 콘텐츠' : '채팅방'}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="그리드 뷰">
                        <IconButton
                            onClick={() => handleViewModeChange('grid')}
                            color={viewMode === 'grid' ? 'primary' : 'default'}
                        >
                            <GridIcon />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="리스트 뷰">
                        <IconButton
                            onClick={() => handleViewModeChange('list')}
                            color={viewMode === 'list' ? 'primary' : 'default'}
                        >
                            <ListIcon />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="타임라인 뷰">
                        <IconButton
                            onClick={() => handleViewModeChange('timeline')}
                            color={viewMode === 'timeline' ? 'primary' : 'default'}
                        >
                            <TimelineIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            {/* 탭 콘텐츠 */}
            <TabPanel value={activeTab} index={0}>
                {/* 홈 탭 - 커뮤니티 타입별 맞춤 기능 */}
                <Grid container spacing={3}>
                    {features.map((feature, index) => (
                        <Grid item xs={12} sm={6} md={4} key={feature.id}>
                            <Card className="feature-card" sx={{ height: '100%' }}>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        {feature.name}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                        {feature.name} 관련 콘텐츠를 확인하세요.
                                    </Typography>
                                    <Button
                                        variant="contained"
                                        fullWidth
                                        startIcon={<StarIcon />}
                                        sx={{
                                            backgroundColor: config?.theme?.primaryColor,
                                            '&:hover': {
                                                backgroundColor: config?.theme?.accentColor
                                            }
                                        }}
                                    >
                                        보러가기
                                    </Button>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>

                {/* 커뮤니티 통계 */}
                <Card sx={{ mt: 4 }}>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            커뮤니티 통계
                        </Typography>
                        <Grid container spacing={3}>
                            <Grid item xs={6} sm={3}>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h4" color="primary">
                                        {community.statistics.totalMembers}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        총 멤버
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={6} sm={3}>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h4" color="primary">
                                        {community.statistics.totalPosts}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        총 게시글
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={6} sm={3}>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h4" color="primary">
                                        {community.statistics.postsToday}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        오늘 게시글
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={6} sm={3}>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h4" color="primary">
                                        {community.statistics.commentsToday}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        오늘 댓글
                                    </Typography>
                                </Box>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>
            </TabPanel>

            <TabPanel value={activeTab} index={1}>
                {/* 게시글 탭 */}
                <Typography>게시글 목록이 여기에 표시됩니다.</Typography>
            </TabPanel>

            <TabPanel value={activeTab} index={2}>
                {/* 멤버 탭 */}
                <Typography>멤버 목록이 여기에 표시됩니다.</Typography>
            </TabPanel>

            <TabPanel value={activeTab} index={3}>
                {/* 트렌딩 탭 */}
                <Typography>인기 콘텐츠가 여기에 표시됩니다.</Typography>
            </TabPanel>

            <TabPanel value={activeTab} index={4}>
                {/* 채팅 탭 */}
                <Typography>채팅방 목록이 여기에 표시됩니다.</Typography>
            </TabPanel>
        </StyledCommunityContainer>
    );
};

export default CommunityHome;
