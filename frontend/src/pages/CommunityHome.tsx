import React, { useState, useEffect, useMemo } from 'react';
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
    useTheme
} from '@mui/material';
import {
    TrendingUp as TrendingIcon,
    Newspaper as NewsIcon,
    Forum as ForumIcon,
    AccessTime as TimeIcon,
    Visibility as ViewIcon,
    ThumbUp as LikeIcon
} from '@mui/icons-material';

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

interface PostItem {
    id: number;
    title: string;
    content: string;
    author: string;
    community: string;
    timestamp: string;
    views: number;
    likes: number;
    comments: number;
    type: 'discussion' | 'guide' | 'showcase' | 'question';
}

const CommunityHome: React.FC = () => {
    const theme = useTheme();
    const [loading, setLoading] = useState(true);
    const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
    const [communities, setCommunities] = useState<CommunityItem[]>([]);
    const [recentPosts, setRecentPosts] = useState<PostItem[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    // 모의 데이터 로딩
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);

            // 뉴스 데이터
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
                },
                {
                    id: 3,
                    title: "🌱 환경 보호 캠페인, 시민 참여 확산 중",
                    summary: "지속가능한 미래를 위한 환경 보호 활동과 시민들의 적극적인 참여 현황입니다.",
                    category: "환경",
                    readTime: 4,
                    views: 654,
                    likes: 45,
                    timestamp: "6시간 전",
                    priority: 'medium'
                }
            ];

            // 커뮤니티 데이터
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

            // 최신 글 데이터
            const mockPosts: PostItem[] = [
                {
                    id: 1,
                    title: "🎮 신작 게임 리뷰: 올해 최고의 RPG는?",
                    content: "최근 출시된 RPG 게임들을 비교 분석해보았습니다...",
                    author: "게임마스터",
                    community: "게임 커뮤니티",
                    timestamp: "30분 전",
                    views: 234,
                    likes: 18,
                    comments: 12,
                    type: 'guide'
                },
                {
                    id: 2,
                    title: "📺 스트리밍 장비 추천 가이드 2024",
                    content: "초보 스트리머를 위한 필수 장비와 설정 방법을 소개합니다...",
                    author: "스트림킹",
                    community: "스트리밍 & 방송",
                    timestamp: "1시간 전",
                    views: 456,
                    likes: 32,
                    comments: 8,
                    type: 'guide'
                },
                {
                    id: 3,
                    title: "🎭 엘사 코스프레 제작 후기",
                    content: "겨울왕국 엘사 의상을 직접 만들어본 경험을 공유합니다...",
                    author: "코스플레이어",
                    community: "코스프레 & 아트",
                    timestamp: "2시간 전",
                    views: 189,
                    likes: 25,
                    comments: 15,
                    type: 'showcase'
                },
                {
                    id: 4,
                    title: "📰 AI 윤리 문제, 어떻게 해결할까?",
                    content: "인공지능 기술 발전과 함께 제기되는 윤리적 문제들을 토론해봅시다...",
                    author: "뉴스분석가",
                    community: "뉴스 & 시사",
                    timestamp: "3시간 전",
                    views: 567,
                    likes: 43,
                    comments: 28,
                    type: 'discussion'
                }
            ];

            // 로딩 시뮬레이션
            await new Promise(resolve => setTimeout(resolve, 1000));

            setNewsItems(mockNews);
            setCommunities(mockCommunities);
            setRecentPosts(mockPosts);
            setLoading(false);
        };

        loadData();
    }, []);

    // 필터링된 포스트
    const filteredPosts = useMemo(() => {
        if (selectedCategory === 'all') return recentPosts;
        return recentPosts.filter(post =>
            communities.find(c => c.name === post.community)?.category === selectedCategory
        );
    }, [recentPosts, selectedCategory, communities]);

    // 뉴스 카드 컴포넌트
    const NewsCard: React.FC<{ news: NewsItem }> = ({ news }) => (
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
    );

    // 커뮤니티 카드 컴포넌트
    const CommunityCard: React.FC<{ community: CommunityItem }> = ({ community }) => (
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
    );

    // 포스트 카드 컴포넌트
    const PostCard: React.FC<{ post: PostItem }> = ({ post }) => {
        const community = communities.find(c => c.name === post.community);
        const typeColors = {
            discussion: '#2196f3',
            guide: '#4caf50',
            showcase: '#ff9800',
            question: '#9c27b0'
        };

        return (
            <Card sx={{
                mb: 2,
                '&:hover': { boxShadow: 3, transform: 'translateY(-1px)' },
                transition: 'all 0.2s ease'
            }}>
                <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Avatar sx={{
                            bgcolor: community?.color || '#gray',
                            mr: 1,
                            width: 24,
                            height: 24,
                            fontSize: '0.8rem'
                        }}>
                            {community?.icon}
                        </Avatar>
                        <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
                            {post.community}
                        </Typography>
                        <Chip
                            label={post.type}
                            size="small"
                            sx={{
                                bgcolor: typeColors[post.type],
                                color: 'white',
                                fontSize: '0.7rem',
                                height: 20
                            }}
                        />
                    </Box>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                        {post.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {post.content}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="caption" color="text.secondary">
                            by {post.author} • {post.timestamp}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <ViewIcon sx={{ fontSize: 14, mr: 0.5, color: 'text.secondary' }} />
                                <Typography variant="caption">{post.views}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <LikeIcon sx={{ fontSize: 14, mr: 0.5, color: 'text.secondary' }} />
                                <Typography variant="caption">{post.likes}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <ForumIcon sx={{ fontSize: 14, mr: 0.5, color: 'text.secondary' }} />
                                <Typography variant="caption">{post.comments}</Typography>
                            </Box>
                        </Box>
                    </Box>
                </CardContent>
            </Card>
        );
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
                                📝 최신 글 피드
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                <Button
                                    variant={selectedCategory === 'all' ? 'contained' : 'outlined'}
                                    size="small"
                                    onClick={() => setSelectedCategory('all')}
                                >
                                    전체
                                </Button>
                                <Button
                                    variant={selectedCategory === 'news' ? 'contained' : 'outlined'}
                                    size="small"
                                    onClick={() => setSelectedCategory('news')}
                                    sx={{ bgcolor: selectedCategory === 'news' ? '#1976d2' : 'transparent' }}
                                >
                                    📰 뉴스
                                </Button>
                                <Button
                                    variant={selectedCategory === 'game' ? 'contained' : 'outlined'}
                                    size="small"
                                    onClick={() => setSelectedCategory('game')}
                                    sx={{ bgcolor: selectedCategory === 'game' ? '#9c27b0' : 'transparent' }}
                                >
                                    🎮 게임
                                </Button>
                                <Button
                                    variant={selectedCategory === 'streaming' ? 'contained' : 'outlined'}
                                    size="small"
                                    onClick={() => setSelectedCategory('streaming')}
                                    sx={{ bgcolor: selectedCategory === 'streaming' ? '#f44336' : 'transparent' }}
                                >
                                    📺 스트리밍
                                </Button>
                                <Button
                                    variant={selectedCategory === 'cosplay' ? 'contained' : 'outlined'}
                                    size="small"
                                    onClick={() => setSelectedCategory('cosplay')}
                                    sx={{ bgcolor: selectedCategory === 'cosplay' ? '#e91e63' : 'transparent' }}
                                >
                                    🎭 코스프레
                                </Button>
                            </Box>
                        </Box>
                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                            {filteredPosts.map((post) => (
                                <PostCard key={post.id} post={post} />
                            ))}
                        </Box>

                        {/* 무한스크롤 로딩 표시 */}
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                            <Button variant="outlined" size="large">
                                더 많은 글 보기
                            </Button>
                        </Box>
                    </Box>
                </Fade>
            </Box>
        </Container>
    );
};

export default CommunityHome;