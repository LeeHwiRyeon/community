import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Box,
    Container,
    Typography,
    Card,
    CardContent,
    Button,
    Chip,
    Avatar,
    Divider,
    CircularProgress,
    Fade,
    useTheme,
    Alert
} from '@mui/material';
import {
    TrendingUp as TrendingIcon,
    Newspaper as NewsIcon,
    Forum as ForumIcon,
    AccessTime as TimeIcon,
    Visibility as ViewIcon,
    ThumbUp as LikeIcon,
    Refresh as RefreshIcon
} from '@mui/icons-material';

// 커스텀 훅 및 컴포넌트 import
import useOptimizedData from '../hooks/useOptimizedData';
import SimpleInfiniteScroll from '../components/SimpleInfiniteScroll';
import OptimizedPostCard, { PostData } from '../components/OptimizedPostCard';

// 타입 정의
interface NewsItem {
    id: number;
    title: string;
    summary: string;
    category: string;
    readTime: number;
    views: number;
    likes: number;
    timestamp: string;
    priority: 'high' | 'medium' | 'low';
}

interface CommunityItem {
    id: number;
    name: string;
    description: string;
    members: number;
    posts: number;
    category: 'news' | 'game' | 'streaming' | 'cosplay';
    color: string;
    icon: string;
}

const OptimizedCommunityHome: React.FC = () => {
    const theme = useTheme();
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
    const [communities, setCommunities] = useState<CommunityItem[]>([]);

    // 최적화된 포스트 데이터 관리
    const {
        data: posts,
        loading: postsLoading,
        hasMore: hasMorePosts,
        error: postsError,
        loadMore: loadMorePosts,
        refresh: refreshPosts,
        totalCount: totalPosts
    } = useOptimizedData<PostData>(
        useCallback(async (page: number, pageSize: number) => {
            // 실제 API 호출 시뮬레이션
            await new Promise(resolve => setTimeout(resolve, 500));

            const mockPosts: PostData[] = Array.from({ length: pageSize }, (_, index) => {
                const postId = (page - 1) * pageSize + index + 1;
                const categories = ['news', 'game', 'streaming', 'cosplay'] as const;
                const types = ['discussion', 'guide', 'showcase', 'question', 'live', 'review'] as const;
                const category = categories[postId % categories.length];

                return {
                    id: postId,
                    title: `${getPostTitle(category, postId)}`,
                    content: `${getPostContent(category)} 이것은 ${postId}번째 게시글의 내용입니다. 커뮤니티에서 활발한 토론이 이루어지고 있습니다.`,
                    author: {
                        name: `사용자${postId}`,
                        avatar: undefined
                    },
                    community: {
                        name: getCommunityName(category),
                        color: getCommunityColor(category),
                        icon: getCommunityIcon(category),
                        category: category
                    },
                    timestamp: getRandomTimestamp(),
                    stats: {
                        views: Math.floor(Math.random() * 1000) + 100,
                        likes: Math.floor(Math.random() * 100) + 10,
                        comments: Math.floor(Math.random() * 50) + 5
                    },
                    type: types[postId % types.length],
                    priority: postId % 10 === 0 ? 'high' : 'medium',
                    tags: getRandomTags(category)
                };
            });

            // 카테고리 필터링
            const filteredPosts = selectedCategory === 'all'
                ? mockPosts
                : mockPosts.filter(post => post.community.category === selectedCategory);

            return {
                data: filteredPosts,
                total: selectedCategory === 'all' ? 1000 : 250 // 모의 총 개수
            };
        }, [selectedCategory]),
        [selectedCategory],
        {
            pageSize: 15,
            cacheSize: 50,
            debounceMs: 200
        }
    );

    // 헬퍼 함수들
    const getPostTitle = (category: string, id: number): string => {
        const titles = {
            news: [`🔥 AI 혁신 소식 #${id}`, `📈 경제 동향 분석 #${id}`, `🌍 글로벌 이슈 #${id}`],
            game: [`🎮 신작 게임 리뷰 #${id}`, `🏆 리더보드 업데이트 #${id}`, `🎯 게임 공략 #${id}`],
            streaming: [`📺 라이브 방송 하이라이트 #${id}`, `🎬 VOD 추천 #${id}`, `🎤 스트리머 인터뷰 #${id}`],
            cosplay: [`🎭 코스프레 작품 #${id}`, `✨ 메이크업 튜토리얼 #${id}`, `👗 의상 제작기 #${id}`]
        };
        const categoryTitles = titles[category as keyof typeof titles] || titles.news;
        return categoryTitles[id % categoryTitles.length];
    };

    const getPostContent = (category: string): string => {
        const contents = {
            news: "최신 뉴스와 시사 이슈에 대한 깊이 있는 분석과 토론을 제공합니다.",
            game: "게임 리뷰, 공략, 이벤트 정보를 공유하고 게이머들과 소통합니다.",
            streaming: "라이브 방송과 크리에이터 콘텐츠를 통해 실시간 소통을 즐깁니다.",
            cosplay: "코스프레 작품과 창작 활동을 공유하며 아티스트들과 교류합니다."
        };
        return contents[category as keyof typeof contents] || contents.news;
    };

    const getCommunityName = (category: string): string => {
        const names = {
            news: "뉴스 & 시사",
            game: "게임 커뮤니티",
            streaming: "스트리밍 & 방송",
            cosplay: "코스프레 & 아트"
        };
        return names[category as keyof typeof names] || "일반";
    };

    const getCommunityColor = (category: string): string => {
        const colors = {
            news: "#1976d2",
            game: "#9c27b0",
            streaming: "#f44336",
            cosplay: "#e91e63"
        };
        return colors[category as keyof typeof colors] || "#gray";
    };

    const getCommunityIcon = (category: string): string => {
        const icons = {
            news: "📰",
            game: "🎮",
            streaming: "📺",
            cosplay: "🎭"
        };
        return icons[category as keyof typeof icons] || "📝";
    };

    const getRandomTimestamp = (): string => {
        const timestamps = ["방금 전", "5분 전", "30분 전", "1시간 전", "2시간 전", "오늘", "어제"];
        return timestamps[Math.floor(Math.random() * timestamps.length)];
    };

    const getRandomTags = (category: string): string[] => {
        const tagSets = {
            news: ["정치", "경제", "사회", "국제", "기술"],
            game: ["RPG", "액션", "전략", "스포츠", "인디"],
            streaming: ["게임방송", "토크쇼", "음악", "요리", "여행"],
            cosplay: ["애니메이션", "게임", "영화", "오리지널", "그룹"]
        };
        const tags = tagSets[category as keyof typeof tagSets] || tagSets.news;
        return tags.slice(0, Math.floor(Math.random() * 3) + 1);
    };

    // 초기 데이터 로딩
    useEffect(() => {
        const loadInitialData = async () => {
            // 뉴스 데이터 로딩
            const mockNews: NewsItem[] = [
                {
                    id: 1,
                    title: "🔥 AI 기술의 새로운 돌파구, 일상생활 혁신 예고",
                    summary: "최신 AI 기술이 우리 일상에 가져올 변화와 혁신적인 서비스들을 살펴봅니다.",
                    category: "기술",
                    readTime: 5,
                    views: 1250,
                    likes: 89,
                    timestamp: "2시간 전",
                    priority: 'high'
                },
                {
                    id: 2,
                    title: "📈 글로벌 경제 동향, 새로운 투자 기회 발견",
                    summary: "변화하는 경제 환경에서 주목해야 할 투자 포인트와 시장 전망을 분석합니다.",
                    category: "경제",
                    readTime: 7,
                    views: 890,
                    likes: 67,
                    timestamp: "4시간 전",
                    priority: 'medium'
                }
            ];

            // 커뮤니티 데이터 로딩
            const mockCommunities: CommunityItem[] = [
                {
                    id: 1,
                    name: "뉴스 & 시사",
                    description: "최신 뉴스와 시사 이슈를 토론하는 공간",
                    members: 15420,
                    posts: 2340,
                    category: 'news',
                    color: '#1976d2',
                    icon: '📰'
                },
                {
                    id: 2,
                    name: "게임 커뮤니티",
                    description: "게임 리뷰, 공략, 이벤트 정보 공유",
                    members: 28950,
                    posts: 5670,
                    category: 'game',
                    color: '#9c27b0',
                    icon: '🎮'
                },
                {
                    id: 3,
                    name: "스트리밍 & 방송",
                    description: "라이브 스트리밍과 크리에이터 소통",
                    members: 12340,
                    posts: 1890,
                    category: 'streaming',
                    color: '#f44336',
                    icon: '📺'
                },
                {
                    id: 4,
                    name: "코스프레 & 아트",
                    description: "코스프레 작품과 창작 활동 공유",
                    members: 8760,
                    posts: 1230,
                    category: 'cosplay',
                    color: '#e91e63',
                    icon: '🎭'
                }
            ];

            setNewsItems(mockNews);
            setCommunities(mockCommunities);
        };

        loadInitialData();
    }, []);

    // 포스트 카드 렌더러
    const renderPostCard = useCallback((post: PostData, index: number) => (
        <OptimizedPostCard
            key={post.id}
            post={post}
            index={index}
            onClick={(post) => console.log('Post clicked:', post.title)}
            onLike={(postId) => console.log('Post liked:', postId)}
            onBookmark={(postId) => console.log('Post bookmarked:', postId)}
            onShare={(post) => console.log('Post shared:', post.title)}
        />
    ), []);

    // 뉴스 카드 컴포넌트
    const NewsCard: React.FC<{ news: NewsItem }> = React.memo(({ news }) => (
        <Card sx={{
            mb: 2,
            border: news.priority === 'high' ? '2px solid #ff5722' : '1px solid #e0e0e0',
            '&:hover': { boxShadow: 4, transform: 'translateY(-2px)' },
            transition: 'all 0.3s ease'
        }}>
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <NewsIcon sx={{ mr: 1, color: '#1976d2' }} />
                    <Chip
                        label={news.category}
                        size="small"
                        sx={{ bgcolor: '#1976d2', color: 'white', mr: 1 }}
                    />
                    {news.priority === 'high' && (
                        <Chip label="🔥 HOT" size="small" color="error" />
                    )}
                </Box>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                    {news.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {news.summary}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <TimeIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                        <Typography variant="caption">{news.readTime}분 읽기</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <ViewIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                        <Typography variant="caption">{news.views.toLocaleString()}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <LikeIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                        <Typography variant="caption">{news.likes}</Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                        {news.timestamp}
                    </Typography>
                </Box>
            </CardContent>
        </Card>
    ));

    // 커뮤니티 카드 컴포넌트
    const CommunityCard: React.FC<{ community: CommunityItem }> = React.memo(({ community }) => (
        <Card sx={{
            height: '100%',
            cursor: 'pointer',
            border: `1px solid ${community.color}`,
            '&:hover': {
                boxShadow: `0 4px 20px ${community.color}40`,
                transform: 'translateY(-4px)'
            },
            transition: 'all 0.3s ease'
        }}>
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: community.color, mr: 2, fontSize: '1.5rem' }}>
                        {community.icon}
                    </Avatar>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                            {community.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {community.description}
                        </Typography>
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                    <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" sx={{ color: community.color, fontWeight: 'bold' }}>
                            {community.members.toLocaleString()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">멤버</Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" sx={{ color: community.color, fontWeight: 'bold' }}>
                            {community.posts.toLocaleString()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">게시글</Typography>
                    </Box>
                </Box>
            </CardContent>
        </Card>
    ));

    return (
        <Container maxWidth="lg">
            <Box sx={{ py: 4 }}>
                {/* 1. 뉴스 피드 섹션 */}
                <Fade in timeout={500}>
                    <Box sx={{ mb: 6 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                            <TrendingIcon sx={{ mr: 1, color: '#1976d2', fontSize: 32 }} />
                            <Typography variant="h4" component="h2" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                                📰 실시간 뉴스 피드
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {newsItems.map((news) => (
                                <NewsCard key={news.id} news={news} />
                            ))}
                        </Box>
                    </Box>
                </Fade>

                <Divider sx={{ my: 4 }} />

                {/* 2. 커뮤니티 목록 섹션 */}
                <Fade in timeout={700}>
                    <Box sx={{ mb: 6 }}>
                        <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
                            🏘️ 커뮤니티 둘러보기
                        </Typography>
                        <Box sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr 1fr' },
                            gap: 3
                        }}>
                            {communities.map((community) => (
                                <CommunityCard key={community.id} community={community} />
                            ))}
                        </Box>
                    </Box>
                </Fade>

                <Divider sx={{ my: 4 }} />

                {/* 3. 최신 글 피드 섹션 */}
                <Fade in timeout={900}>
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                            <Typography variant="h4" component="h2" sx={{ fontWeight: 'bold' }}>
                                📝 최신 글 피드 ({totalPosts.toLocaleString()}개)
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={<RefreshIcon />}
                                    onClick={refreshPosts}
                                    disabled={postsLoading}
                                >
                                    새로고침
                                </Button>
                            </Box>
                        </Box>

                        {/* 카테고리 필터 */}
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
                            <Button
                                variant={selectedCategory === 'all' ? 'contained' : 'outlined'}
                                size="small"
                                onClick={() => setSelectedCategory('all')}
                            >
                                전체 ({totalPosts.toLocaleString()})
                            </Button>
                            {communities.map((community) => (
                                <Button
                                    key={community.category}
                                    variant={selectedCategory === community.category ? 'contained' : 'outlined'}
                                    size="small"
                                    onClick={() => setSelectedCategory(community.category)}
                                    sx={{
                                        bgcolor: selectedCategory === community.category ? community.color : 'transparent',
                                        '&:hover': {
                                            bgcolor: selectedCategory === community.category ? community.color : `${community.color}20`
                                        }
                                    }}
                                >
                                    {community.icon} {community.name.split(' ')[0]}
                                </Button>
                            ))}
                        </Box>

                        {/* 에러 표시 */}
                        {postsError && (
                            <Alert severity="error" sx={{ mb: 3 }}>
                                데이터를 불러오는 중 오류가 발생했습니다: {postsError}
                            </Alert>
                        )}

                        {/* 최적화된 무한스크롤 포스트 목록 */}
                        <SimpleInfiniteScroll
                            items={posts}
                            hasNextPage={hasMorePosts}
                            isLoading={postsLoading}
                            loadNextPage={loadMorePosts}
                            renderItem={renderPostCard}
                            threshold={300}
                            loadingComponent={
                                <Box sx={{ display: 'flex', justifyContent: 'center', py: 3, gap: 2 }}>
                                    <CircularProgress size={24} />
                                    <Typography variant="body2" color="text.secondary">
                                        🚀 더 많은 콘텐츠를 불러오는 중... ({posts.length}/{totalPosts})
                                    </Typography>
                                </Box>
                            }
                            endMessage={
                                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                                    <Typography variant="body1" color="text.secondary">
                                        🎉 모든 게시글을 확인했습니다! ({posts.length}개)
                                    </Typography>
                                </Box>
                            }
                        />
                    </Box>
                </Fade>
            </Box>
        </Container>
    );
};

export default OptimizedCommunityHome;
