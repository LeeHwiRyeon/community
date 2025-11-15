/**
 * 🎭 코스플레이어 아이템제작자 모델 관리 시스템
 * 
 * 코스플레이어를 위한 아이템제작자와 모델 관리 시스템
 * 의상 제작, 포트폴리오 관리, 모델 관리, 주문 관리
 * 
 * @author AUTOAGENTS Manager
 * @version 3.0.0
 * @created 2025-01-02
 */

import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    CardActions,
    Button,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Chip,
        IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    CircularProgress,
    Tabs,
    Tab,
    Paper,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    Avatar,
    Badge,
    Divider,
    Switch,
    FormControlLabel,
    LinearProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tooltip,
    Rating,
    ImageList,
    ImageListItem,
    ImageListItemBar
} from '@mui/material';

import {
    TheaterComedy as CosplayIcon,
    Build as BuildIcon,
    Person as PersonIcon,
    ShoppingCart as CartIcon,
    PhotoCamera as CameraIcon,
    CameraAlt,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Add as AddIcon,
    Visibility as ViewIcon,
    TrendingUp as TrendingIcon,
    Warning as WarningIcon,
    CheckCircle as CheckIcon,
    Cancel as CancelIcon,
    Settings as SettingsIcon,
    Notifications as NotificationIcon,
    Chat as ChatIcon,
    Share as ShareIcon,
    Download as DownloadIcon,
    Star as StarIcon,
    StarBorder as StarBorderIcon,
    Favorite as FavoriteIcon,
    Inventory as InventoryIcon,
    AttachMoney as MoneyIcon,
    Schedule as ScheduleIcon
} from '@mui/icons-material';

// 타입 정의
interface Cosplayer {
    id: string;
    name: string;
    username: string;
    avatar: string;
    specialty: string[];
    experience: number;
    rating: number;
    followerCount: number;
    portfolioCount: number;
    status: 'active' | 'inactive' | 'busy';
    bio: string;
    socialLinks: {
        instagram?: string;
        twitter?: string;
        tiktok?: string;
    };
    location: string;
    languages: string[];
    joinDate: string;
}

interface ItemCreator {
    id: string;
    name: string;
    username: string;
    avatar: string;
    specialty: string[];
    experience: number;
    rating: number;
    orderCount: number;
    status: 'available' | 'busy' | 'inactive';
    bio: string;
    portfolio: string[];
    priceRange: {
        min: number;
        max: number;
    };
    deliveryTime: number;
    location: string;
    joinDate: string;
}

interface Model {
    id: string;
    name: string;
    username: string;
    avatar: string;
    age: number;
    height: number;
    weight: number;
    specialty: string[];
    rating: number;
    bookingCount: number;
    status: 'available' | 'booked' | 'inactive';
    bio: string;
    portfolio: string[];
    hourlyRate: number;
    location: string;
    languages: string[];
    joinDate: string;
}

interface Order {
    id: string;
    customerId: string;
    creatorId: string;
    modelId?: string;
    type: 'costume' | 'photo' | 'event';
    title: string;
    description: string;
    budget: number;
    deadline: string;
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
    createdAt: string;
    updatedAt: string;
    requirements: string[];
    images: string[];
}

interface PortfolioItem {
    id: string;
    creatorId: string;
    modelId?: string;
    title: string;
    description: string;
    category: string;
    tags: string[];
    images: string[];
    likes: number;
    views: number;
    createdAt: string;
    featured: boolean;
}

const CosplayerItemCreatorSystem: React.FC = () => {
    const [activeTab, setActiveTab] = useState(0);
    const [cosplayers, setCosplayers] = useState<Cosplayer[]>([]);
    const [itemCreators, setItemCreators] = useState<ItemCreator[]>([]);
    const [models, setModels] = useState<Model[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogType, setDialogType] = useState<'cosplayer' | 'creator' | 'model' | 'order' | 'portfolio'>('cosplayer');

    // 모의 데이터 초기화
    useEffect(() => {
        const mockCosplayers: Cosplayer[] = [
            {
                id: '1',
                name: '코스프레퀸',
                username: 'cosplay_queen',
                avatar: '/api/placeholder/60/60',
                specialty: ['애니메이션', '게임', '영화'],
                experience: 5,
                rating: 4.8,
                followerCount: 12890,
                portfolioCount: 156,
                status: 'active',
                bio: '전문 코스플레이어, 다양한 캐릭터 연기 가능',
                socialLinks: {
                    instagram: '@cosplay_queen',
                    twitter: '@cosplay_queen'
                },
                location: '서울',
                languages: ['한국어', '영어', '일본어'],
                joinDate: '2023-01-15'
            }
        ];

        const mockItemCreators: ItemCreator[] = [
            {
                id: '1',
                name: '의상마스터',
                username: 'costume_master',
                avatar: '/api/placeholder/60/60',
                specialty: ['의상제작', '소품제작', '헤어스타일'],
                experience: 8,
                rating: 4.9,
                orderCount: 234,
                status: 'available',
                bio: '전문 의상 제작자, 고품질 의상 제작',
                portfolio: ['/api/placeholder/200/200', '/api/placeholder/200/200'],
                priceRange: { min: 100000, max: 500000 },
                deliveryTime: 14,
                location: '부산',
                joinDate: '2022-06-10'
            }
        ];

        const mockModels: Model[] = [
            {
                id: '1',
                name: '모델킹',
                username: 'model_king',
                avatar: '/api/placeholder/60/60',
                age: 25,
                height: 180,
                weight: 70,
                specialty: ['포토샵', '영상편집', '연기'],
                rating: 4.7,
                bookingCount: 89,
                status: 'available',
                bio: '전문 모델, 다양한 스타일 연기 가능',
                portfolio: ['/api/placeholder/200/200', '/api/placeholder/200/200'],
                hourlyRate: 50000,
                location: '서울',
                languages: ['한국어', '영어'],
                joinDate: '2023-03-20'
            }
        ];

        const mockOrders: Order[] = [
            {
                id: '1',
                customerId: 'customer1',
                creatorId: '1',
                modelId: '1',
                type: 'costume',
                title: '미쿠 코스프레 의상 제작',
                description: '하츠네 미쿠 코스프레 의상 제작 및 촬영',
                budget: 300000,
                deadline: '2025-01-15',
                status: 'in_progress',
                createdAt: '2025-01-01',
                updatedAt: '2025-01-02',
                requirements: ['정확한 색상', '고품질 소재', '포토샵 포함'],
                images: ['/api/placeholder/150/150']
            }
        ];

        const mockPortfolio: PortfolioItem[] = [
            {
                id: '1',
                creatorId: '1',
                modelId: '1',
                title: '미쿠 코스프레 작품',
                description: '하츠네 미쿠 코스프레 의상 제작 및 촬영',
                category: '애니메이션',
                tags: ['미쿠', '보컬로이드', '코스프레'],
                images: ['/api/placeholder/200/200', '/api/placeholder/200/200'],
                likes: 156,
                views: 2340,
                createdAt: '2025-01-01',
                featured: true
            }
        ];

        setCosplayers(mockCosplayers);
        setItemCreators(mockItemCreators);
        setModels(mockModels);
        setOrders(mockOrders);
        setPortfolio(mockPortfolio);
    }, []);

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
    };

    const handleOpenDialog = (type: 'cosplayer' | 'creator' | 'model' | 'order' | 'portfolio', item?: any) => {
        setDialogType(type);
        setSelectedItem(item || null);
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setSelectedItem(null);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active':
            case 'available': return 'success';
            case 'inactive': return 'default';
            case 'busy':
            case 'booked': return 'warning';
            case 'in_progress': return 'info';
            case 'completed': return 'success';
            case 'cancelled': return 'error';
            default: return 'default';
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('ko-KR', {
            style: 'currency',
            currency: 'KRW'
        }).format(amount);
    };

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat('ko-KR').format(num);
    };

    return (
        <Box sx={{ p: 4 }}>
            <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CosplayIcon />
                코스플레이어 아이템제작자 모델 관리 시스템
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
                코스플레이어를 위한 아이템제작자와 모델 관리 통합 시스템
            </Typography>

            <Paper sx={{ mb: 3 }}>
                <Tabs value={activeTab} onChange={handleTabChange} aria-label="cosplay management tabs">
                    <Tab label="코스플레이어" icon={<PersonIcon />} />
                    <Tab label="아이템제작자" icon={<BuildIcon />} />
                    <Tab label="모델 관리" icon={<CameraIcon />} />
                    <Tab label="주문 관리" icon={<CartIcon />} />
                    <Tab label="포트폴리오" icon={<CameraAlt />} />
                </Tabs>
            </Paper>

            {/* 코스플레이어 탭 */}
            {activeTab === 0 && (
                <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h6">코스플레이어 관리</Typography>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => handleOpenDialog('cosplayer')}
                        >
                            코스플레이어 추가
                        </Button>
                    </Box>

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                        {cosplayers.map((cosplayer) => (
                            <Box sx={{ flex: '1 1 300px', minWidth: 300 }} key={cosplayer.id}>
                                <Card sx={{ height: '100%' }}>
                                    <CardContent>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                            <Avatar
                                                src={cosplayer.avatar}
                                                sx={{ width: 60, height: 60, mr: 2 }}
                                            />
                                            <Box sx={{ flex: 1 }}>
                                                <Typography variant="h6" gutterBottom>
                                                    {cosplayer.name}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    @{cosplayer.username}
                                                </Typography>
                                                <Chip
                                                    label={cosplayer.status}
                                                    color={getStatusColor(cosplayer.status)}
                                                    size="small"
                                                    sx={{ mt: 1 }}
                                                />
                                            </Box>
                                        </Box>

                                        <Divider sx={{ my: 2 }} />

                                        <Box sx={{ mb: 2 }}>
                                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                                경력: {cosplayer.experience}년
                                            </Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Rating value={cosplayer.rating} precision={0.1} size="small" readOnly />
                                                <Typography variant="body2">
                                                    {cosplayer.rating}
                                                </Typography>
                                            </Box>
                                        </Box>

                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                                            <Box sx={{ flex: '1 1 120px', minWidth: 120 }}>
                                                <Typography variant="body2" color="text.secondary">
                                                    팔로워
                                                </Typography>
                                                <Typography variant="h6" color="primary">
                                                    {formatNumber(cosplayer.followerCount)}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ flex: '1 1 120px', minWidth: 120 }}>
                                                <Typography variant="body2" color="text.secondary">
                                                    포트폴리오
                                                </Typography>
                                                <Typography variant="h6" color="secondary">
                                                    {cosplayer.portfolioCount}개
                                                </Typography>
                                            </Box>
                                        </Box>

                                        <Box sx={{ mt: 2 }}>
                                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                                전문 분야:
                                            </Typography>
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                {cosplayer.specialty.map((specialty) => (
                                                    <Chip key={specialty} label={specialty} size="small" variant="outlined" />
                                                ))}
                                            </Box>
                                        </Box>
                                    </CardContent>
                                    <CardActions>
                                        <Button
                                            size="small"
                                            startIcon={<EditIcon />}
                                            onClick={() => handleOpenDialog('cosplayer', cosplayer)}
                                        >
                                            편집
                                        </Button>
                                        <Button
                                            size="small"
                                            startIcon={<ViewIcon />}
                                        >
                                            상세보기
                                        </Button>
                                    </CardActions>
                                </Card>
                            </Box>
                        ))}
                    </Box>
                </Box>
            )}

            {/* 아이템제작자 탭 */}
            {activeTab === 1 && (
                <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h6">아이템제작자 관리</Typography>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => handleOpenDialog('creator')}
                        >
                            제작자 추가
                        </Button>
                    </Box>

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                        {itemCreators.map((creator) => (
                            <Box sx={{ flex: '1 1 300px', minWidth: 300 }} key={creator.id}>
                                <Card sx={{ height: '100%' }}>
                                    <CardContent>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                            <Avatar
                                                src={creator.avatar}
                                                sx={{ width: 60, height: 60, mr: 2 }}
                                            />
                                            <Box sx={{ flex: 1 }}>
                                                <Typography variant="h6" gutterBottom>
                                                    {creator.name}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    @{creator.username}
                                                </Typography>
                                                <Chip
                                                    label={creator.status}
                                                    color={getStatusColor(creator.status)}
                                                    size="small"
                                                    sx={{ mt: 1 }}
                                                />
                                            </Box>
                                        </Box>

                                        <Divider sx={{ my: 2 }} />

                                        <Box sx={{ mb: 2 }}>
                                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                                경력: {creator.experience}년
                                            </Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Rating value={creator.rating} precision={0.1} size="small" readOnly />
                                                <Typography variant="body2">
                                                    {creator.rating}
                                                </Typography>
                                            </Box>
                                        </Box>

                                        <Box sx={{ mb: 2 }}>
                                            <Typography variant="body2" color="text.secondary">
                                                가격 범위
                                            </Typography>
                                            <Typography variant="h6" color="primary">
                                                {formatCurrency(creator.priceRange.min)} - {formatCurrency(creator.priceRange.max)}
                                            </Typography>
                                        </Box>

                                        <Box sx={{ mb: 2 }}>
                                            <Typography variant="body2" color="text.secondary">
                                                제작 기간: {creator.deliveryTime}일
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                완료 주문: {creator.orderCount}개
                                            </Typography>
                                        </Box>

                                        <Box sx={{ mt: 2 }}>
                                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                                전문 분야:
                                            </Typography>
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                {creator.specialty.map((specialty) => (
                                                    <Chip key={specialty} label={specialty} size="small" variant="outlined" />
                                                ))}
                                            </Box>
                                        </Box>
                                    </CardContent>
                                    <CardActions>
                                        <Button
                                            size="small"
                                            startIcon={<EditIcon />}
                                            onClick={() => handleOpenDialog('creator', creator)}
                                        >
                                            편집
                                        </Button>
                                        <Button
                                            size="small"
                                            startIcon={<ViewIcon />}
                                        >
                                            포트폴리오
                                        </Button>
                                    </CardActions>
                                </Card>
                            </Box>
                        ))}
                    </Box>
                </Box>
            )}

            {/* 모델 관리 탭 */}
            {activeTab === 2 && (
                <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h6">모델 관리</Typography>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => handleOpenDialog('model')}
                        >
                            모델 추가
                        </Button>
                    </Box>

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                        {models.map((model) => (
                            <Box sx={{ flex: '1 1 300px', minWidth: 300 }} key={model.id}>
                                <Card sx={{ height: '100%' }}>
                                    <CardContent>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                            <Avatar
                                                src={model.avatar}
                                                sx={{ width: 60, height: 60, mr: 2 }}
                                            />
                                            <Box sx={{ flex: 1 }}>
                                                <Typography variant="h6" gutterBottom>
                                                    {model.name}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    @{model.username}
                                                </Typography>
                                                <Chip
                                                    label={model.status}
                                                    color={getStatusColor(model.status)}
                                                    size="small"
                                                    sx={{ mt: 1 }}
                                                />
                                            </Box>
                                        </Box>

                                        <Divider sx={{ my: 2 }} />

                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                                            <Box sx={{ flex: '1 1 80px', minWidth: 80 }}>
                                                <Typography variant="body2" color="text.secondary">
                                                    나이
                                                </Typography>
                                                <Typography variant="h6">
                                                    {model.age}세
                                                </Typography>
                                            </Box>
                                            <Box sx={{ flex: '1 1 80px', minWidth: 80 }}>
                                                <Typography variant="body2" color="text.secondary">
                                                    키
                                                </Typography>
                                                <Typography variant="h6">
                                                    {model.height}cm
                                                </Typography>
                                            </Box>
                                            <Box sx={{ flex: '1 1 80px', minWidth: 80 }}>
                                                <Typography variant="body2" color="text.secondary">
                                                    몸무게
                                                </Typography>
                                                <Typography variant="h6">
                                                    {model.weight}kg
                                                </Typography>
                                            </Box>
                                        </Box>

                                        <Box sx={{ mb: 2 }}>
                                            <Typography variant="body2" color="text.secondary">
                                                시간당 요금: {formatCurrency(model.hourlyRate)}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                예약 횟수: {model.bookingCount}회
                                            </Typography>
                                        </Box>

                                        <Box sx={{ mb: 2 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Rating value={model.rating} precision={0.1} size="small" readOnly />
                                                <Typography variant="body2">
                                                    {model.rating}
                                                </Typography>
                                            </Box>
                                        </Box>

                                        <Box sx={{ mt: 2 }}>
                                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                                전문 분야:
                                            </Typography>
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                {model.specialty.map((specialty) => (
                                                    <Chip key={specialty} label={specialty} size="small" variant="outlined" />
                                                ))}
                                            </Box>
                                        </Box>
                                    </CardContent>
                                    <CardActions>
                                        <Button
                                            size="small"
                                            startIcon={<EditIcon />}
                                            onClick={() => handleOpenDialog('model', model)}
                                        >
                                            편집
                                        </Button>
                                        <Button
                                            size="small"
                                            startIcon={<ScheduleIcon />}
                                        >
                                            예약 관리
                                        </Button>
                                    </CardActions>
                                </Card>
                            </Box>
                        ))}
                    </Box>
                </Box>
            )}

            {/* 주문 관리 탭 */}
            {activeTab === 3 && (
                <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h6">주문 관리</Typography>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => handleOpenDialog('order')}
                        >
                            주문 추가
                        </Button>
                    </Box>

                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>주문 ID</TableCell>
                                    <TableCell>제목</TableCell>
                                    <TableCell>타입</TableCell>
                                    <TableCell>예산</TableCell>
                                    <TableCell>마감일</TableCell>
                                    <TableCell>상태</TableCell>
                                    <TableCell>액션</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {orders.map((order) => (
                                    <TableRow key={order.id}>
                                        <TableCell>{order.id}</TableCell>
                                        <TableCell>{order.title}</TableCell>
                                        <TableCell>
                                            <Chip label={order.type} size="small" />
                                        </TableCell>
                                        <TableCell>{formatCurrency(order.budget)}</TableCell>
                                        <TableCell>{order.deadline}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={order.status}
                                                color={getStatusColor(order.status)}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <IconButton size="small">
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton size="small">
                                                <ViewIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            )}

            {/* 포트폴리오 탭 */}
            {activeTab === 4 && (
                <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h6">포트폴리오 관리</Typography>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => handleOpenDialog('portfolio')}
                        >
                            작품 추가
                        </Button>
                    </Box>

                    <ImageList cols={3} gap={20}>
                        {portfolio.map((item) => (
                            <ImageListItem key={item.id}>
                                <img
                                    src={item.images[0]}
                                    alt={item.title}
                                    loading="lazy"
                                />
                                <ImageListItemBar
                                    title={item.title}
                                    subtitle={
                                        <Box>
                                            <Typography variant="body2">
                                                {item.category} • {item.likes} 좋아요 • {item.views} 조회
                                            </Typography>
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                                                {item.tags.slice(0, 3).map((tag) => (
                                                    <Chip key={tag} label={tag} size="small" />
                                                ))}
                                            </Box>
                                        </Box>
                                    }
                                    actionIcon={
                                        <Box>
                                            <IconButton size="small" sx={{ color: 'white' }}>
                                                <StarIcon />
                                            </IconButton>
                                            <IconButton size="small" sx={{ color: 'white' }}>
                                                <EditIcon />
                                            </IconButton>
                                        </Box>
                                    }
                                />
                            </ImageListItem>
                        ))}
                    </ImageList>
                </Box>
            )}

            {/* 다이얼로그 */}
            <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                <DialogTitle>
                    {dialogType === 'cosplayer' && '코스플레이어 관리'}
                    {dialogType === 'creator' && '아이템제작자 관리'}
                    {dialogType === 'model' && '모델 관리'}
                    {dialogType === 'order' && '주문 관리'}
                    {dialogType === 'portfolio' && '포트폴리오 관리'}
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary">
                        {dialogType === 'cosplayer' && '코스플레이어 정보를 편집하거나 새로운 코스플레이어를 추가할 수 있습니다.'}
                        {dialogType === 'creator' && '아이템제작자 정보를 편집하거나 새로운 제작자를 추가할 수 있습니다.'}
                        {dialogType === 'model' && '모델 정보를 편집하거나 새로운 모델을 추가할 수 있습니다.'}
                        {dialogType === 'order' && '주문을 관리하고 새로운 주문을 추가할 수 있습니다.'}
                        {dialogType === 'portfolio' && '포트폴리오 작품을 관리하고 새로운 작품을 추가할 수 있습니다.'}
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>닫기</Button>
                    <Button variant="contained">저장</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default CosplayerItemCreatorSystem;
