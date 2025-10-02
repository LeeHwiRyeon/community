/**
 * 🎭 코스프레 상점 페이지
 * 
 * 의상 관리, 이벤트, 포트폴리오, AI 추천 기능을 제공하는
 * 코스프레 전문 상점 시스템
 * 
 * @author AUTOAGENTS Manager
 * @version 1.0.0
 * @created 2025-10-02
 */

import React, { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Typography,
    Grid,
    Card,
    CardContent,
    CardMedia,
    Button,
    Chip,
    Rating,
    TextField,
    InputAdornment,
    Tabs,
    Tab,
    Badge,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Fab,
    Tooltip,
    Alert,
    LinearProgress
} from '@mui/material';
import {
    Search as SearchIcon,
    FilterList as FilterIcon,
    ShoppingCart as CartIcon,
    Favorite as FavoriteIcon,
    Star as StarIcon,
    Event as EventIcon,
    PhotoLibrary as GalleryIcon,
    Psychology as AIIcon,
    LocalOffer as OfferIcon,
    TrendingUp as TrendingIcon,
    Add as AddIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

// 타입 정의
interface CostumeItem {
    id: number;
    name: string;
    brand: string;
    price: number;
    originalPrice?: number;
    rating: number;
    reviews: number;
    image: string;
    category: string;
    tags: string[];
    inStock: boolean;
    isNew?: boolean;
    isHot?: boolean;
    discount?: number;
}

interface CosplayEvent {
    id: number;
    title: string;
    type: 'competition' | 'gathering' | 'workshop';
    date: string;
    location: string;
    participants: number;
    maxParticipants: number;
    image: string;
    description: string;
}

interface PortfolioItem {
    id: number;
    title: string;
    author: string;
    image: string;
    likes: number;
    views: number;
    tags: string[];
    category: string;
}

const CosplayShop: React.FC = () => {
    const theme = useTheme();
    const [activeTab, setActiveTab] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [cartItems, setCartItems] = useState<number[]>([]);
    const [favorites, setFavorites] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);

    // 모의 데이터
    const [costumes] = useState<CostumeItem[]>([
        {
            id: 1,
            name: "미쿠 하츠네 코스프레 의상 세트",
            brand: "CosplayMaster",
            price: 89000,
            originalPrice: 120000,
            rating: 4.8,
            reviews: 156,
            image: "/api/placeholder/300/400",
            category: "anime",
            tags: ["미쿠", "보컬로이드", "완전세트"],
            inStock: true,
            isNew: true,
            discount: 26
        },
        {
            id: 2,
            name: "원피스 루피 밀짚모자 해적단 의상",
            brand: "AnimeCos",
            price: 65000,
            rating: 4.6,
            reviews: 89,
            image: "/api/placeholder/300/400",
            category: "anime",
            tags: ["원피스", "루피", "해적"],
            inStock: true,
            isHot: true
        },
        {
            id: 3,
            name: "귀멸의 칼날 탄지로 코스프레",
            brand: "DemonSlayer",
            price: 75000,
            rating: 4.9,
            reviews: 234,
            image: "/api/placeholder/300/400",
            category: "anime",
            tags: ["귀멸의칼날", "탄지로", "검사"],
            inStock: false
        }
    ]);

    const [events] = useState<CosplayEvent[]>([
        {
            id: 1,
            title: "2025 코스프레 월드 챔피언십",
            type: "competition",
            date: "2025-11-15",
            location: "코엑스 컨벤션센터",
            participants: 156,
            maxParticipants: 200,
            image: "/api/placeholder/400/200",
            description: "세계 최대 규모의 코스프레 경연대회"
        },
        {
            id: 2,
            title: "애니메이션 코스프레 모임",
            type: "gathering",
            date: "2025-10-20",
            location: "홍대 공원",
            participants: 45,
            maxParticipants: 50,
            image: "/api/placeholder/400/200",
            description: "애니메이션 캐릭터 코스프레 모임"
        }
    ]);

    const [portfolio] = useState<PortfolioItem[]>([
        {
            id: 1,
            title: "완벽한 미쿠 코스프레",
            author: "CosplayQueen",
            image: "/api/placeholder/300/300",
            likes: 1234,
            views: 5678,
            tags: ["미쿠", "완성도높음", "추천"],
            category: "anime"
        },
        {
            id: 2,
            title: "귀멸의 칼날 단체 코스프레",
            author: "DemonCosTeam",
            image: "/api/placeholder/300/300",
            likes: 890,
            views: 3456,
            tags: ["귀멸의칼날", "단체", "퀄리티"],
            category: "anime"
        }
    ]);

    useEffect(() => {
        // 로딩 시뮬레이션
        setTimeout(() => setLoading(false), 1000);
    }, []);

    const handleAddToCart = (itemId: number) => {
        setCartItems(prev => [...prev, itemId]);
    };

    const handleToggleFavorite = (itemId: number) => {
        setFavorites(prev =>
            prev.includes(itemId)
                ? prev.filter(id => id !== itemId)
                : [...prev, itemId]
        );
    };

    const renderCostumeCard = (costume: CostumeItem) => (
        <Grid item xs={12} sm={6} md={4} key={costume.id}>
            <Card sx={{ height: '100%', position: 'relative' }}>
                {costume.isNew && (
                    <Chip
                        label="NEW"
                        color="primary"
                        size="small"
                        sx={{ position: 'absolute', top: 8, left: 8, zIndex: 1 }}
                    />
                )}
                {costume.isHot && (
                    <Chip
                        label="HOT"
                        color="error"
                        size="small"
                        sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}
                    />
                )}
                {costume.discount && (
                    <Chip
                        label={`-${costume.discount}%`}
                        color="success"
                        size="small"
                        sx={{ position: 'absolute', top: 40, left: 8, zIndex: 1 }}
                    />
                )}

                <CardMedia
                    component="img"
                    height="300"
                    image={costume.image}
                    alt={costume.name}
                    sx={{ bgcolor: '#f5f5f5' }}
                />

                <CardContent>
                    <Typography variant="h6" gutterBottom noWrap>
                        {costume.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                        {costume.brand}
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Rating value={costume.rating} precision={0.1} size="small" readOnly />
                        <Typography variant="body2" sx={{ ml: 1 }}>
                            ({costume.reviews})
                        </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6" color="primary">
                            ₩{costume.price.toLocaleString()}
                        </Typography>
                        {costume.originalPrice && (
                            <Typography
                                variant="body2"
                                sx={{ ml: 1, textDecoration: 'line-through', color: 'text.secondary' }}
                            >
                                ₩{costume.originalPrice.toLocaleString()}
                            </Typography>
                        )}
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                        {costume.tags.slice(0, 2).map(tag => (
                            <Chip key={tag} label={tag} size="small" variant="outlined" />
                        ))}
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                        <Button
                            variant="contained"
                            fullWidth
                            disabled={!costume.inStock}
                            onClick={() => handleAddToCart(costume.id)}
                            startIcon={<CartIcon />}
                        >
                            {costume.inStock ? '장바구니' : '품절'}
                        </Button>
                        <IconButton
                            color={favorites.includes(costume.id) ? 'error' : 'default'}
                            onClick={() => handleToggleFavorite(costume.id)}
                        >
                            <FavoriteIcon />
                        </IconButton>
                    </Box>
                </CardContent>
            </Card>
        </Grid>
    );

    const renderEventCard = (event: CosplayEvent) => (
        <Grid item xs={12} md={6} key={event.id}>
            <Card>
                <CardMedia
                    component="img"
                    height="200"
                    image={event.image}
                    alt={event.title}
                    sx={{ bgcolor: '#f5f5f5' }}
                />
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        {event.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                        {event.description}
                    </Typography>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="body2">
                            📅 {event.date}
                        </Typography>
                        <Typography variant="body2">
                            📍 {event.location}
                        </Typography>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" gutterBottom>
                            참가자: {event.participants}/{event.maxParticipants}
                        </Typography>
                        <LinearProgress
                            variant="determinate"
                            value={(event.participants / event.maxParticipants) * 100}
                            sx={{ height: 8, borderRadius: 4 }}
                        />
                    </Box>

                    <Button variant="contained" fullWidth>
                        참가 신청
                    </Button>
                </CardContent>
            </Card>
        </Grid>
    );

    const renderPortfolioCard = (item: PortfolioItem) => (
        <Grid item xs={12} sm={6} md={4} key={item.id}>
            <Card>
                <CardMedia
                    component="img"
                    height="250"
                    image={item.image}
                    alt={item.title}
                    sx={{ bgcolor: '#f5f5f5' }}
                />
                <CardContent>
                    <Typography variant="h6" gutterBottom noWrap>
                        {item.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                        by {item.author}
                    </Typography>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">
                            ❤️ {item.likes}
                        </Typography>
                        <Typography variant="body2">
                            👁️ {item.views}
                        </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {item.tags.slice(0, 3).map(tag => (
                            <Chip key={tag} label={tag} size="small" variant="outlined" />
                        ))}
                    </Box>
                </CardContent>
            </Card>
        </Grid>
    );

    if (loading) {
        return (
            <Container maxWidth="xl" sx={{ py: 4 }}>
                <LinearProgress />
                <Typography variant="h4" align="center" sx={{ mt: 4 }}>
                    🎭 코스프레 상점 로딩 중...
                </Typography>
            </Container>
        );
    }

    return (
        <Container maxWidth="xl" sx={{ py: 4 }}>
            {/* 헤더 */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h3" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    🎭 코스프레 상점
                    <Chip label="AI 추천" color="primary" sx={{ ml: 2 }} />
                </Typography>
                <Typography variant="h6" color="text.secondary">
                    완벽한 코스프레를 위한 모든 것
                </Typography>
            </Box>

            {/* 검색 및 필터 */}
            <Box sx={{ mb: 4 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            placeholder="코스프레 의상, 브랜드, 캐릭터 검색..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon />
                                    </InputAdornment>
                                )
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                            <Button startIcon={<FilterIcon />} variant="outlined">
                                필터
                            </Button>
                            <Button startIcon={<AIIcon />} variant="contained" color="secondary">
                                AI 추천
                            </Button>
                        </Box>
                    </Grid>
                </Grid>
            </Box>

            {/* 탭 네비게이션 */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
                    <Tab label="의상 상점" icon={<CartIcon />} />
                    <Tab label="이벤트" icon={<EventIcon />} />
                    <Tab label="포트폴리오" icon={<GalleryIcon />} />
                </Tabs>
            </Box>

            {/* 탭 컨텐츠 */}
            {activeTab === 0 && (
                <Box>
                    <Typography variant="h5" gutterBottom>
                        🛍️ 코스프레 의상
                    </Typography>
                    <Grid container spacing={3}>
                        {costumes.map(renderCostumeCard)}
                    </Grid>
                </Box>
            )}

            {activeTab === 1 && (
                <Box>
                    <Typography variant="h5" gutterBottom>
                        🎪 코스프레 이벤트
                    </Typography>
                    <Grid container spacing={3}>
                        {events.map(renderEventCard)}
                    </Grid>
                </Box>
            )}

            {activeTab === 2 && (
                <Box>
                    <Typography variant="h5" gutterBottom>
                        📸 포트폴리오 갤러리
                    </Typography>
                    <Grid container spacing={3}>
                        {portfolio.map(renderPortfolioCard)}
                    </Grid>
                </Box>
            )}

            {/* 장바구니 FAB */}
            <Tooltip title="장바구니">
                <Fab
                    color="primary"
                    sx={{ position: 'fixed', bottom: 16, right: 16 }}
                >
                    <Badge badgeContent={cartItems.length} color="error">
                        <CartIcon />
                    </Badge>
                </Fab>
            </Tooltip>

            {/* 성공 알림 */}
            {cartItems.length > 0 && (
                <Alert
                    severity="success"
                    sx={{ position: 'fixed', bottom: 80, right: 16, zIndex: 1000 }}
                >
                    장바구니에 {cartItems.length}개 상품이 담겼습니다!
                </Alert>
            )}
        </Container>
    );
};

export default CosplayShop;
