/**
 * 🧠 지능형 컨텐츠 피드 컴포넌트
 * 
 * AI 기반 개인화 추천, 실시간 필터링, 무한 스크롤을 지원하는
 * 차세대 컨텐츠 피드 시스템
 * 
 * @author AUTOAGENTS Manager
 * @version 2.0.0
 * @created 2025-10-02
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
    Box,
    Container,
    Typography,
    Tabs,
    Tab,
    Chip,
    Button,
    IconButton,
    Menu,
    MenuItem,
    FormControl,
    InputLabel,
    Select,
    Switch,
    FormControlLabel,
    Skeleton,
    Alert,
    Snackbar,
    Fab,
    Tooltip,
    Badge,
    LinearProgress,
    Card,
    CardContent,
    Divider,
    Grid
} from '@mui/material';

import {
    FilterList as FilterIcon,
    Sort as SortIcon,
    Refresh as RefreshIcon,
    Settings as SettingsIcon,
    Psychology as AIIcon,
    TrendingUp as TrendingIcon,
    Schedule as ScheduleIcon,
    Person as PersonIcon,
    Group as GroupIcon,
    Star as StarIcon,
    Whatshot as HotIcon,
    NewReleases as NewIcon,
    Recommend as RecommendIcon,
    Analytics as AnalyticsIcon,
    Speed as SpeedIcon,
    Visibility as ViewIcon,
    KeyboardArrowUp as ScrollTopIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useInView } from 'react-intersection-observer';
import EnhancedPostCard from './EnhancedPostCard';

// 피드 설정 타입
interface FeedSettings {
    algorithm: 'chronological' | 'relevance' | 'trending' | 'personalized' | 'ai_curated';
    contentTypes: string[];
    categories: string[];
    languages: string[];
    minQualityScore: number;
    showAnalytics: boolean;
    enableRealtime: boolean;
    autoRefresh: boolean;
    refreshInterval: number;
    viewMode: 'card' | 'list' | 'grid' | 'magazine';
}

// 필터 옵션 타입
interface FilterOptions {
    timeRange: 'hour' | 'day' | 'week' | 'month' | 'year' | 'all';
    sortBy: 'newest' | 'oldest' | 'popular' | 'trending' | 'quality' | 'relevance';
    contentType: 'all' | 'text' | 'image' | 'video' | 'audio' | 'mixed';
    difficulty: 'all' | 'beginner' | 'intermediate' | 'advanced';
    engagement: 'all' | 'high' | 'medium' | 'low';
}

// 피드 통계 타입
interface FeedStats {
    totalPosts: number;
    filteredPosts: number;
    avgQualityScore: number;
    avgEngagement: number;
    topCategories: { name: string; count: number }[];
    trendingTopics: { name: string; score: number }[];
    personalizedScore: number;
}

const IntelligentContentFeed: React.FC = () => {
    const theme = useTheme();
    const [activeTab, setActiveTab] = useState(0);
    const [posts, setPosts] = useState<any[]>([]);
    const [filteredPosts, setFilteredPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(1);
    const [feedStats, setFeedStats] = useState<FeedStats | null>(null);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');

    // 설정 상태
    const [feedSettings, setFeedSettings] = useState<FeedSettings>({
        algorithm: 'personalized',
        contentTypes: ['all'],
        categories: ['all'],
        languages: ['ko'],
        minQualityScore: 0.5,
        showAnalytics: true,
        enableRealtime: true,
        autoRefresh: false,
        refreshInterval: 30000,
        viewMode: 'card'
    });

    // 필터 상태
    const [filters, setFilters] = useState<FilterOptions>({
        timeRange: 'week',
        sortBy: 'relevance',
        contentType: 'all',
        difficulty: 'all',
        engagement: 'all'
    });

    // 메뉴 상태
    const [filterMenuAnchor, setFilterMenuAnchor] = useState<null | HTMLElement>(null);
    const [sortMenuAnchor, setSortMenuAnchor] = useState<null | HTMLElement>(null);
    const [settingsMenuAnchor, setSettingsMenuAnchor] = useState<null | HTMLElement>(null);

    // 무한 스크롤 감지
    const { ref: loadMoreRef, inView } = useInView({
        threshold: 0.1,
        triggerOnce: false
    });

    // 스크롤 위치 감지
    const scrollRef = useRef<HTMLDivElement>(null);

    // 탭 옵션
    const feedTabs = [
        { label: '맞춤 추천', icon: <RecommendIcon />, algorithm: 'personalized' },
        { label: '트렌딩', icon: <TrendingIcon />, algorithm: 'trending' },
        { label: '최신', icon: <NewIcon />, algorithm: 'chronological' },
        { label: '인기', icon: <HotIcon />, algorithm: 'relevance' },
        { label: 'AI 큐레이션', icon: <AIIcon />, algorithm: 'ai_curated' }
    ];

    // 모의 데이터 생성
    const generateMockPosts = useCallback((count: number = 20) => {
        const mockPosts = [];
        for (let i = 0; i < count; i++) {
            mockPosts.push({
                id: `post_${Date.now()}_${i}`,
                title: `향상된 포스트 제목 ${i + 1} - AI 기반 컨텐츠 분석 결과`,
                content: `이것은 AI가 분석한 고품질 컨텐츠입니다. 사용자의 관심사와 ${Math.round(Math.random() * 100)}% 일치합니다.`,
                excerpt: `AI 기반 컨텐츠 분석을 통해 생성된 요약입니다. 이 포스트는 ${Math.round(Math.random() * 5) + 1}분 정도 읽는 시간이 소요됩니다.`,
                author: {
                    id: `user_${i}`,
                    name: `사용자 ${i + 1}`,
                    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`,
                    level: Math.floor(Math.random() * 10) + 1,
                    badges: ['활발한 참여자', '품질 기여자'].slice(0, Math.floor(Math.random() * 3)),
                    verified: Math.random() > 0.7,
                    reputation: Math.floor(Math.random() * 100)
                },
                metadata: {
                    createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
                    updatedAt: new Date().toISOString(),
                    publishedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
                    status: 'published' as const,
                    visibility: 'public' as const
                },
                engagement: {
                    views: Math.floor(Math.random() * 10000),
                    likes: Math.floor(Math.random() * 1000),
                    dislikes: Math.floor(Math.random() * 50),
                    comments: Math.floor(Math.random() * 200),
                    shares: Math.floor(Math.random() * 100),
                    bookmarks: Math.floor(Math.random() * 300),
                    reactions: {
                        like: Math.floor(Math.random() * 500),
                        love: Math.floor(Math.random() * 200),
                        laugh: Math.floor(Math.random() * 100),
                        wow: Math.floor(Math.random() * 50),
                        sad: Math.floor(Math.random() * 20),
                        angry: Math.floor(Math.random() * 10)
                    }
                },
                content_analysis: {
                    readingTime: Math.floor(Math.random() * 10) + 1,
                    sentiment: ['positive', 'neutral', 'negative'][Math.floor(Math.random() * 3)] as 'positive' | 'neutral' | 'negative',
                    sentimentScore: (Math.random() - 0.5) * 2,
                    topics: ['기술', '개발', 'AI', '커뮤니티', '리뷰'].slice(0, Math.floor(Math.random() * 3) + 1),
                    keywords: ['React', 'TypeScript', 'AI', '최적화', '사용자경험'].slice(0, Math.floor(Math.random() * 4) + 1),
                    difficulty: ['beginner', 'intermediate', 'advanced'][Math.floor(Math.random() * 3)] as 'beginner' | 'intermediate' | 'advanced',
                    quality_score: Math.random() * 0.4 + 0.6,
                    engagement_potential: Math.random() * 0.3 + 0.7
                },
                multimedia: {
                    thumbnail: Math.random() > 0.5 ? `https://picsum.photos/seed/${i}/400/200` : '',
                    images: Math.random() > 0.7 ? [`https://picsum.photos/seed/${i}/800/600`] : [],
                    videos: Math.random() > 0.9 ? ['sample_video.mp4'] : [],
                    audio: Math.random() > 0.95 ? ['sample_audio.mp3'] : [],
                    attachments: Math.random() > 0.8 ? ['document.pdf'] : []
                },
                categorization: {
                    board: ['tech', 'community', 'news', 'discussion'][Math.floor(Math.random() * 4)],
                    category: ['개발', '기술', '커뮤니티', '뉴스'][Math.floor(Math.random() * 4)],
                    subcategory: ['프론트엔드', '백엔드', 'AI/ML', 'DevOps'][Math.floor(Math.random() * 4)],
                    tags: ['React', 'TypeScript', 'AI', '최적화', '커뮤니티'].slice(0, Math.floor(Math.random() * 4) + 1),
                    priority: ['low', 'medium', 'high', 'urgent'][Math.floor(Math.random() * 4)] as 'low' | 'medium' | 'high' | 'urgent'
                },
                interaction: {
                    allowComments: true,
                    allowVoting: true,
                    allowSharing: true,
                    moderationRequired: false
                },
                personalization: {
                    relevance_score: Math.random() * 0.3 + 0.7,
                    recommendation_reason: ['관심사 일치', '유사 사용자 선호', '트렌딩 토픽', 'AI 추천'][Math.floor(Math.random() * 4)],
                    user_interest_match: Math.random() * 0.4 + 0.6,
                    trending_score: Math.random()
                },
                realtime: {
                    live_viewers: Math.floor(Math.random() * 50),
                    recent_activity: ['새 댓글', '좋아요 증가', '공유됨'].slice(0, Math.floor(Math.random() * 3)),
                    hot_comments: Math.floor(Math.random() * 10),
                    viral_potential: Math.random()
                }
            });
        }
        return mockPosts;
    }, []);

    // 초기 데이터 로드
    useEffect(() => {
        loadPosts(true);
    }, []);

    // 탭 변경 시 알고리즘 업데이트
    useEffect(() => {
        const selectedTab = feedTabs[activeTab];
        if (selectedTab) {
            setFeedSettings(prev => ({
                ...prev,
                algorithm: selectedTab.algorithm as any
            }));
        }
    }, [activeTab]);

    // 무한 스크롤
    useEffect(() => {
        if (inView && hasMore && !loading) {
            loadPosts(false);
        }
    }, [inView, hasMore, loading]);

    // 스크롤 위치 감지
    useEffect(() => {
        const handleScroll = () => {
            setShowScrollTop(window.scrollY > 500);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // 자동 새로고침
    useEffect(() => {
        if (!feedSettings.autoRefresh) return;

        const interval = setInterval(() => {
            loadPosts(true);
            setSnackbarMessage('피드가 자동으로 업데이트되었습니다.');
        }, feedSettings.refreshInterval);

        return () => clearInterval(interval);
    }, [feedSettings.autoRefresh, feedSettings.refreshInterval]);

    // 포스트 로드
    const loadPosts = useCallback(async (reset: boolean = false) => {
        setLoading(true);

        try {
            // API 호출 시뮬레이션
            await new Promise(resolve => setTimeout(resolve, 1000));

            const newPosts = generateMockPosts(20);

            if (reset) {
                setPosts(newPosts);
                setPage(1);
            } else {
                setPosts(prev => [...prev, ...newPosts]);
                setPage(prev => prev + 1);
            }

            // 더 로드할 데이터가 있는지 시뮬레이션
            setHasMore(page < 5);

        } catch (error) {
            console.error('포스트 로드 실패:', error);
            setSnackbarMessage('포스트를 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    }, [page, generateMockPosts]);

    // 포스트 필터링 및 정렬
    useEffect(() => {
        let filtered = [...posts];

        // 시간 범위 필터
        if (filters.timeRange !== 'all') {
            const now = new Date();
            const timeRanges = {
                hour: 60 * 60 * 1000,
                day: 24 * 60 * 60 * 1000,
                week: 7 * 24 * 60 * 60 * 1000,
                month: 30 * 24 * 60 * 60 * 1000,
                year: 365 * 24 * 60 * 60 * 1000
            };

            const cutoff = new Date(now.getTime() - timeRanges[filters.timeRange]);
            filtered = filtered.filter(post =>
                new Date(post.metadata.publishedAt) >= cutoff
            );
        }

        // 컨텐츠 타입 필터
        if (filters.contentType !== 'all') {
            filtered = filtered.filter(post => {
                switch (filters.contentType) {
                    case 'image':
                        return post.multimedia.images.length > 0;
                    case 'video':
                        return post.multimedia.videos.length > 0;
                    case 'audio':
                        return post.multimedia.audio.length > 0;
                    case 'text':
                        return post.multimedia.images.length === 0 &&
                            post.multimedia.videos.length === 0;
                    default:
                        return true;
                }
            });
        }

        // 난이도 필터
        if (filters.difficulty !== 'all') {
            filtered = filtered.filter(post =>
                post.content_analysis.difficulty === filters.difficulty
            );
        }

        // 참여도 필터
        if (filters.engagement !== 'all') {
            const engagementThresholds = {
                high: 0.8,
                medium: 0.5,
                low: 0
            };

            filtered = filtered.filter(post =>
                typeof post.content_analysis.engagement_potential === 'number' &&
                post.content_analysis.engagement_potential >= engagementThresholds[filters.engagement as 'high' | 'medium' | 'low']
            );
        }

        // 품질 점수 필터
        filtered = filtered.filter(post =>
            post.content_analysis.quality_score >= feedSettings.minQualityScore
        );

        // 정렬
        filtered.sort((a, b) => {
            switch (filters.sortBy) {
                case 'newest':
                    return new Date(b.metadata.publishedAt).getTime() -
                        new Date(a.metadata.publishedAt).getTime();
                case 'oldest':
                    return new Date(a.metadata.publishedAt).getTime() -
                        new Date(b.metadata.publishedAt).getTime();
                case 'popular':
                    return b.engagement.likes - a.engagement.likes;
                case 'trending':
                    return b.personalization.trending_score - a.personalization.trending_score;
                case 'quality':
                    return b.content_analysis.quality_score - a.content_analysis.quality_score;
                case 'relevance':
                    return b.personalization.relevance_score - a.personalization.relevance_score;
                default:
                    return 0;
            }
        });

        setFilteredPosts(filtered);

        // 통계 계산
        if (filtered.length > 0) {
            const stats: FeedStats = {
                totalPosts: posts.length,
                filteredPosts: filtered.length,
                avgQualityScore: filtered.reduce((sum, post) =>
                    sum + post.content_analysis.quality_score, 0) / filtered.length,
                avgEngagement: filtered.reduce((sum, post) =>
                    sum + post.content_analysis.engagement_potential, 0) / filtered.length,
                topCategories: [],
                trendingTopics: [],
                personalizedScore: filtered.reduce((sum, post) =>
                    sum + post.personalization.relevance_score, 0) / filtered.length
            };

            setFeedStats(stats);
        }
    }, [posts, filters, feedSettings.minQualityScore]);

    // 상호작용 핸들러
    const handleInteraction = useCallback((type: string, postId: string) => {
        console.log(`상호작용: ${type} - 포스트: ${postId}`);
        setSnackbarMessage(`${type} 완료!`);
    }, []);

    // 포스트 보기 핸들러
    const handleViewPost = useCallback((postId: string) => {
        console.log(`포스트 보기: ${postId}`);
    }, []);

    // 맨 위로 스크롤
    const scrollToTop = useCallback(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    // 피드 새로고침
    const refreshFeed = useCallback(() => {
        loadPosts(true);
        setSnackbarMessage('피드를 새로고침했습니다.');
    }, [loadPosts]);

    return (
        <Container maxWidth="lg" sx={{ py: 3 }}>
            {/* 헤더 */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    🧠 지능형 컨텐츠 피드
                </Typography>
                <Typography variant="subtitle1" color="text.secondary">
                    AI 기반 개인화 추천으로 맞춤형 컨텐츠를 발견하세요
                </Typography>
            </Box>

            {/* 피드 통계 */}
            {feedStats && (
                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <Grid container spacing={2}>
                            <Box sx={{ width: { xs: '100%', sm: '50%', md: '25%' }, p: 1 }}>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h6" color="primary">
                                        {feedStats.filteredPosts.toLocaleString()}
                                    </Typography>
                                    <Typography variant="caption">
                                        필터된 포스트
                                    </Typography>
                                </Box>
                            </Box>
                            <Box sx={{ width: { xs: '100%', sm: '50%', md: '25%' }, p: 1 }}>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h6" color="success.main">
                                        {Math.round(feedStats.avgQualityScore * 100)}%
                                    </Typography>
                                    <Typography variant="caption">
                                        평균 품질 점수
                                    </Typography>
                                </Box>
                            </Box>
                            <Box sx={{ width: { xs: '100%', sm: '50%', md: '25%' }, p: 1 }}>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h6" color="warning.main">
                                        {Math.round(feedStats.avgEngagement * 100)}%
                                    </Typography>
                                    <Typography variant="caption">
                                        평균 참여도
                                    </Typography>
                                </Box>
                            </Box>
                            <Box sx={{ width: { xs: '100%', sm: '50%', md: '25%' }, p: 1 }}>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h6" color="info.main">
                                        {Math.round(feedStats.personalizedScore * 100)}%
                                    </Typography>
                                    <Typography variant="caption">
                                        개인화 점수
                                    </Typography>
                                </Box>
                            </Box>
                        </Grid>
                    </CardContent>
                </Card>
            )}

            {/* 탭 및 컨트롤 */}
            <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Tabs
                        value={activeTab}
                        onChange={(_, newValue) => setActiveTab(newValue)}
                        variant="scrollable"
                        scrollButtons="auto"
                    >
                        {feedTabs.map((tab, index) => (
                            <Tab
                                key={index}
                                icon={tab.icon}
                                label={tab.label}
                                iconPosition="start"
                            />
                        ))}
                    </Tabs>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton onClick={refreshFeed} disabled={loading}>
                            <RefreshIcon />
                        </IconButton>

                        <IconButton onClick={(e) => setFilterMenuAnchor(e.currentTarget)}>
                            <Badge badgeContent={Object.values(filters).filter(v => v !== 'all').length} color="primary">
                                <FilterIcon />
                            </Badge>
                        </IconButton>

                        <IconButton onClick={(e) => setSortMenuAnchor(e.currentTarget)}>
                            <SortIcon />
                        </IconButton>

                        <IconButton onClick={(e) => setSettingsMenuAnchor(e.currentTarget)}>
                            <SettingsIcon />
                        </IconButton>
                    </Box>
                </Box>

                {/* 활성 필터 표시 */}
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {Object.entries(filters).map(([key, value]) => {
                        if (value === 'all') return null;
                        return (
                            <Chip
                                key={key}
                                size="small"
                                label={`${key}: ${value}`}
                                onDelete={() => setFilters(prev => ({ ...prev, [key]: 'all' }))}
                            />
                        );
                    })}
                </Box>
            </Box>

            {/* 로딩 표시 */}
            {loading && page === 1 && (
                <Box sx={{ mb: 2 }}>
                    <LinearProgress />
                </Box>
            )}

            {/* 포스트 목록 */}
            <Box ref={scrollRef}>
                {filteredPosts.map((post, index) => (
                    <EnhancedPostCard
                        key={post.id}
                        post={post}
                        index={index}
                        viewMode={feedSettings.viewMode}
                        showAnalytics={feedSettings.showAnalytics}
                        showPersonalization={feedSettings.algorithm === 'personalized'}
                        enableRealtime={feedSettings.enableRealtime}
                        onInteraction={handleInteraction}
                        onViewPost={handleViewPost}
                    />
                ))}

                {/* 로딩 스켈레톤 */}
                {loading && (
                    <>
                        {Array.from({ length: 3 }).map((_, index) => (
                            <Card key={index} sx={{ mb: 2 }}>
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                        <Skeleton variant="circular" width={40} height={40} sx={{ mr: 1 }} />
                                        <Box sx={{ flexGrow: 1 }}>
                                            <Skeleton variant="text" width="30%" />
                                            <Skeleton variant="text" width="20%" />
                                        </Box>
                                    </Box>
                                    <Skeleton variant="text" height={32} sx={{ mb: 1 }} />
                                    <Skeleton variant="text" height={20} sx={{ mb: 2 }} />
                                    <Skeleton variant="rectangular" height={200} />
                                </CardContent>
                            </Card>
                        ))}
                    </>
                )}

                {/* 무한 스크롤 트리거 */}
                {hasMore && !loading && (
                    <Box ref={loadMoreRef} sx={{ height: 20 }} />
                )}

                {/* 더 이상 로드할 데이터가 없을 때 */}
                {!hasMore && filteredPosts.length > 0 && (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                            모든 포스트를 불러왔습니다.
                        </Typography>
                    </Box>
                )}

                {/* 포스트가 없을 때 */}
                {!loading && filteredPosts.length === 0 && (
                    <Box sx={{ textAlign: 'center', py: 8 }}>
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                            조건에 맞는 포스트가 없습니다
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            필터 조건을 조정하거나 새로고침해 보세요.
                        </Typography>
                        <Button variant="outlined" onClick={refreshFeed}>
                            새로고침
                        </Button>
                    </Box>
                )}
            </Box>

            {/* 맨 위로 버튼 */}
            {showScrollTop && (
                <Fab
                    color="primary"
                    size="medium"
                    onClick={scrollToTop}
                    sx={{
                        position: 'fixed',
                        bottom: 16,
                        right: 16,
                        zIndex: 1000
                    }}
                >
                    <ScrollTopIcon />
                </Fab>
            )}

            {/* 필터 메뉴 */}
            <Menu
                anchorEl={filterMenuAnchor}
                open={Boolean(filterMenuAnchor)}
                onClose={() => setFilterMenuAnchor(null)}
            >
                <MenuItem onClick={() => setFilterMenuAnchor(null)}>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>시간 범위</InputLabel>
                        <Select
                            value={filters.timeRange}
                            onChange={(e) => setFilters(prev => ({ ...prev, timeRange: e.target.value as any }))}
                        >
                            <MenuItem value="hour">1시간</MenuItem>
                            <MenuItem value="day">1일</MenuItem>
                            <MenuItem value="week">1주일</MenuItem>
                            <MenuItem value="month">1개월</MenuItem>
                            <MenuItem value="year">1년</MenuItem>
                            <MenuItem value="all">전체</MenuItem>
                        </Select>
                    </FormControl>
                </MenuItem>
            </Menu>

            {/* 정렬 메뉴 */}
            <Menu
                anchorEl={sortMenuAnchor}
                open={Boolean(sortMenuAnchor)}
                onClose={() => setSortMenuAnchor(null)}
            >
                <MenuItem onClick={() => { setFilters(prev => ({ ...prev, sortBy: 'relevance' })); setSortMenuAnchor(null); }}>
                    관련성순
                </MenuItem>
                <MenuItem onClick={() => { setFilters(prev => ({ ...prev, sortBy: 'newest' })); setSortMenuAnchor(null); }}>
                    최신순
                </MenuItem>
                <MenuItem onClick={() => { setFilters(prev => ({ ...prev, sortBy: 'popular' })); setSortMenuAnchor(null); }}>
                    인기순
                </MenuItem>
                <MenuItem onClick={() => { setFilters(prev => ({ ...prev, sortBy: 'trending' })); setSortMenuAnchor(null); }}>
                    트렌딩순
                </MenuItem>
                <MenuItem onClick={() => { setFilters(prev => ({ ...prev, sortBy: 'quality' })); setSortMenuAnchor(null); }}>
                    품질순
                </MenuItem>
            </Menu>

            {/* 설정 메뉴 */}
            <Menu
                anchorEl={settingsMenuAnchor}
                open={Boolean(settingsMenuAnchor)}
                onClose={() => setSettingsMenuAnchor(null)}
            >
                <MenuItem>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={feedSettings.showAnalytics}
                                onChange={(e) => setFeedSettings(prev => ({ ...prev, showAnalytics: e.target.checked }))}
                            />
                        }
                        label="분석 정보 표시"
                    />
                </MenuItem>
                <MenuItem>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={feedSettings.enableRealtime}
                                onChange={(e) => setFeedSettings(prev => ({ ...prev, enableRealtime: e.target.checked }))}
                            />
                        }
                        label="실시간 업데이트"
                    />
                </MenuItem>
                <MenuItem>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={feedSettings.autoRefresh}
                                onChange={(e) => setFeedSettings(prev => ({ ...prev, autoRefresh: e.target.checked }))}
                            />
                        }
                        label="자동 새로고침"
                    />
                </MenuItem>
            </Menu>

            {/* 스낵바 */}
            <Snackbar
                open={Boolean(snackbarMessage)}
                autoHideDuration={3000}
                onClose={() => setSnackbarMessage('')}
                message={snackbarMessage}
            />
        </Container>
    );
};

export default IntelligentContentFeed;
