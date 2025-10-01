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
    Avatar,
    Chip,
    Divider,
    Badge,
    IconButton,
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
    TableRow
} from '@mui/material';
import {
    Diamond as DiamondIcon,
    Notifications as NotificationsIcon,
    ShoppingBag as ShoppingBagIcon,
    TrendingUp as TrendingUpIcon,
    Star as StarIcon,
    Business as BusinessIcon,
    Person as PersonIcon,
    Add as AddIcon,
    Refresh as RefreshIcon,
    FilterList as FilterIcon
} from '@mui/icons-material';

interface VIPUser {
    id: string;
    name: string;
    email: string;
    level: {
        name: string;
        discount: number;
        priority: number;
    };
    interests: string[];
    totalPurchases: number;
    totalSavings: number;
    joinedAt: string;
}

interface NewProduct {
    id: string;
    companyId: string;
    name: string;
    category: string;
    price: number;
    discountedPrice: number;
    savings: number;
    description: string;
    images: string[];
    createdAt: string;
    views: number;
    likes: number;
    purchases: number;
}

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    productId: string;
    companyId: string;
    discount: number;
    discountedPrice: number;
    createdAt: string;
    isRead: boolean;
}

interface PartnerCompany {
    id: string;
    name: string;
    category: string;
    description: string;
    status: string;
    productCount: number;
    lastSync: string;
}

const VIPDashboard: React.FC = () => {
    const [currentTab, setCurrentTab] = useState(0);
    const [user, setUser] = useState<VIPUser | null>(null);
    const [products, setProducts] = useState<NewProduct[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [partners, setPartners] = useState<PartnerCompany[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filterCategory, setFilterCategory] = useState('');
    const [openProductDialog, setOpenProductDialog] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<NewProduct | null>(null);

    // VIP 등급별 색상
    const getLevelColor = (level: string) => {
        switch (level) {
            case 'Bronze': return '#CD7F32';
            case 'Silver': return '#C0C0C0';
            case 'Gold': return '#FFD700';
            case 'Platinum': return '#E5E4E2';
            case 'Diamond': return '#B9F2FF';
            default: return '#666';
        }
    };

    useEffect(() => {
        fetchVIPData();
    }, []);

    const fetchVIPData = async () => {
        try {
            setLoading(true);
            // 실제로는 사용자 ID를 동적으로 가져와야 함
            const userId = 'vip_user_001';

            const response = await fetch(`http://localhost:5000/api/vip-system/vip-dashboard/${userId}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setUser(data.data.user);
            setProducts(data.data.newProducts);
            setNotifications(data.data.notifications);

            // 파트너 업체 데이터도 가져오기
            const partnersResponse = await fetch('http://localhost:5000/api/vip-system/partners');
            if (partnersResponse.ok) {
                const partnersData = await partnersResponse.json();
                setPartners(partnersData.data || []);
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

    const handleProductClick = (product: NewProduct) => {
        setSelectedProduct(product);
        setOpenProductDialog(true);
    };

    const handleCloseProductDialog = () => {
        setOpenProductDialog(false);
        setSelectedProduct(null);
    };

    const handleNotificationRead = async (notificationId: string) => {
        try {
            const response = await fetch(`http://localhost:5000/api/vip-system/notifications/${notificationId}/read`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user?.id })
            });

            if (response.ok) {
                setNotifications(notifications.map(n =>
                    n.id === notificationId ? { ...n, isRead: true } : n
                ));
            }
        } catch (e) {
            console.error('알림 읽음 처리 실패:', e);
        }
    };

    const filteredProducts = products.filter(product =>
        !filterCategory || product.category === filterCategory
    );

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
                <DiamondIcon sx={{ mr: 1, color: getLevelColor(user?.level.name || '') }} />
                VIP 대시보드
                {user && (
                    <Chip
                        label={user.level.name}
                        sx={{
                            ml: 2,
                            backgroundColor: getLevelColor(user.level.name),
                            color: 'white',
                            fontWeight: 'bold'
                        }}
                    />
                )}
            </Typography>

            {user && (
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card raised>
                            <CardContent>
                                <Typography variant="h6" component="h2" sx={{ display: 'flex', alignItems: 'center' }}>
                                    <ShoppingBagIcon sx={{ mr: 1 }} /> 총 구매
                                </Typography>
                                <Typography variant="h4">{user.totalPurchases.toLocaleString()}원</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card raised>
                            <CardContent>
                                <Typography variant="h6" component="h2" sx={{ display: 'flex', alignItems: 'center' }}>
                                    <TrendingUpIcon sx={{ mr: 1 }} /> 총 절약
                                </Typography>
                                <Typography variant="h4" color="success.main">{user.totalSavings.toLocaleString()}원</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card raised>
                            <CardContent>
                                <Typography variant="h6" component="h2" sx={{ display: 'flex', alignItems: 'center' }}>
                                    <NotificationsIcon sx={{ mr: 1 }} /> 알림
                                </Typography>
                                <Typography variant="h4">
                                    {notifications.filter(n => !n.isRead).length}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card raised>
                            <CardContent>
                                <Typography variant="h6" component="h2" sx={{ display: 'flex', alignItems: 'center' }}>
                                    <StarIcon sx={{ mr: 1 }} /> 할인율
                                </Typography>
                                <Typography variant="h4">{user.level.discount}%</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            <Tabs value={currentTab} onChange={handleTabChange} aria-label="VIP dashboard tabs" sx={{ mb: 3 }}>
                <Tab label="신상품" />
                <Tab label="알림" />
                <Tab label="파트너 업체" />
                <Tab label="통계" />
            </Tabs>

            {/* 신상품 탭 */}
            {currentTab === 0 && (
                <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h5">신상품</Typography>
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                            <FormControl size="small" sx={{ minWidth: 150 }}>
                                <InputLabel>카테고리</InputLabel>
                                <Select
                                    value={filterCategory}
                                    onChange={(e) => setFilterCategory(e.target.value)}
                                    label="카테고리"
                                >
                                    <MenuItem value="">전체</MenuItem>
                                    <MenuItem value="의상">의상</MenuItem>
                                    <MenuItem value="액세서리">액세서리</MenuItem>
                                    <MenuItem value="화장품">화장품</MenuItem>
                                    <MenuItem value="소품">소품</MenuItem>
                                </Select>
                            </FormControl>
                            <IconButton onClick={fetchVIPData}>
                                <RefreshIcon />
                            </IconButton>
                        </Box>
                    </Box>

                    <Grid container spacing={3}>
                        {filteredProducts.map((product) => (
                            <Grid item key={product.id} xs={12} sm={6} md={4} lg={3}>
                                <Card
                                    raised
                                    sx={{
                                        cursor: 'pointer',
                                        transition: 'transform 0.2s',
                                        '&:hover': { transform: 'translateY(-4px)' }
                                    }}
                                    onClick={() => handleProductClick(product)}
                                >
                                    <Box sx={{ position: 'relative' }}>
                                        <img
                                            src={product.images[0] || 'https://via.placeholder.com/300x200?text=Product'}
                                            alt={product.name}
                                            style={{ width: '100%', height: 200, objectFit: 'cover' }}
                                        />
                                        <Chip
                                            label="NEW"
                                            color="error"
                                            size="small"
                                            sx={{ position: 'absolute', top: 8, right: 8 }}
                                        />
                                    </Box>
                                    <CardContent>
                                        <Typography variant="h6" component="h3" gutterBottom>
                                            {product.name}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                            {product.description}
                                        </Typography>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Box>
                                                <Typography variant="h6" color="primary">
                                                    {product.discountedPrice.toLocaleString()}원
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
                                                    {product.price.toLocaleString()}원
                                                </Typography>
                                            </Box>
                                            <Chip
                                                label={`${user?.level.discount}% 할인`}
                                                color="success"
                                                size="small"
                                            />
                                        </Box>
                                        <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>
                                            {product.savings.toLocaleString()}원 절약
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            )}

            {/* 알림 탭 */}
            {currentTab === 1 && (
                <Box>
                    <Typography variant="h5" gutterBottom>알림</Typography>
                    <List>
                        {notifications.map((notification) => (
                            <ListItem
                                key={notification.id}
                                sx={{
                                    backgroundColor: notification.isRead ? 'transparent' : 'action.hover',
                                    borderRadius: 1,
                                    mb: 1
                                }}
                            >
                                <ListItemIcon>
                                    <Badge color="error" variant="dot" invisible={notification.isRead}>
                                        <NotificationsIcon />
                                    </Badge>
                                </ListItemIcon>
                                <ListItemText
                                    primary={notification.title}
                                    secondary={notification.message}
                                    onClick={() => !notification.isRead && handleNotificationRead(notification.id)}
                                    sx={{ cursor: notification.isRead ? 'default' : 'pointer' }}
                                />
                                <Typography variant="caption" color="text.secondary">
                                    {new Date(notification.createdAt).toLocaleDateString()}
                                </Typography>
                            </ListItem>
                        ))}
                    </List>
                </Box>
            )}

            {/* 파트너 업체 탭 */}
            {currentTab === 2 && (
                <Box>
                    <Typography variant="h5" gutterBottom>파트너 업체</Typography>
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>업체명</TableCell>
                                    <TableCell>카테고리</TableCell>
                                    <TableCell>상품 수</TableCell>
                                    <TableCell>상태</TableCell>
                                    <TableCell>최근 동기화</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {partners.map((partner) => (
                                    <TableRow key={partner.id}>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <BusinessIcon sx={{ mr: 1 }} />
                                                {partner.name}
                                            </Box>
                                        </TableCell>
                                        <TableCell>{partner.category}</TableCell>
                                        <TableCell>{partner.productCount}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={partner.status}
                                                color={partner.status === 'active' ? 'success' : 'default'}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {partner.lastSync ? new Date(partner.lastSync).toLocaleDateString() : '없음'}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            )}

            {/* 통계 탭 */}
            {currentTab === 3 && (
                <Box>
                    <Typography variant="h5" gutterBottom>통계</Typography>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>VIP 등급 분포</Typography>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                        {Object.entries({
                                            'Diamond': 5,
                                            'Platinum': 12,
                                            'Gold': 28,
                                            'Silver': 45,
                                            'Bronze': 60
                                        }).map(([level, count]) => (
                                            <Box key={level} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Typography>{level}</Typography>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Box sx={{ width: 200, height: 8, backgroundColor: 'grey.200', borderRadius: 1 }}>
                                                        <Box
                                                            sx={{
                                                                width: `${(count / 150) * 100}%`,
                                                                height: '100%',
                                                                backgroundColor: getLevelColor(level),
                                                                borderRadius: 1
                                                            }}
                                                        />
                                                    </Box>
                                                    <Typography variant="body2">{count}명</Typography>
                                                </Box>
                                            </Box>
                                        ))}
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>카테고리별 상품</Typography>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                        {Object.entries({
                                            '의상': 45,
                                            '액세서리': 32,
                                            '화장품': 28,
                                            '소품': 15
                                        }).map(([category, count]) => (
                                            <Box key={category} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography>{category}</Typography>
                                                <Typography variant="body2">{count}개</Typography>
                                            </Box>
                                        ))}
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </Box>
            )}

            {/* 상품 상세 다이얼로그 */}
            <Dialog open={openProductDialog} onClose={handleCloseProductDialog} maxWidth="md" fullWidth>
                <DialogTitle>{selectedProduct?.name}</DialogTitle>
                <DialogContent>
                    {selectedProduct && (
                        <Box>
                            <img
                                src={selectedProduct.images[0] || 'https://via.placeholder.com/500x300?text=Product'}
                                alt={selectedProduct.name}
                                style={{ width: '100%', height: 300, objectFit: 'cover', marginBottom: 16 }}
                            />
                            <Typography variant="body1" paragraph>
                                {selectedProduct.description}
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Box>
                                    <Typography variant="h5" color="primary">
                                        {selectedProduct.discountedPrice.toLocaleString()}원
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
                                        {selectedProduct.price.toLocaleString()}원
                                    </Typography>
                                </Box>
                                <Chip
                                    label={`${user?.level.discount}% 할인`}
                                    color="success"
                                />
                            </Box>
                            <Typography variant="body2" color="success.main">
                                {selectedProduct.savings.toLocaleString()}원 절약
                            </Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseProductDialog}>닫기</Button>
                    <Button variant="contained" color="primary">
                        구매하기
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default VIPDashboard;
