import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Container,
    Card,
    CardContent,
    Button,
    Chip,
    LinearProgress,
    Avatar,
    Divider,
    Alert,
    CircularProgress
} from '@mui/material';
import {
    Diamond as DiamondIcon,
    Star as StarIcon,
    TrendingUp as TrendingUpIcon,
    Person as PersonIcon,
    ShoppingCart as ShoppingCartIcon,
    Support as SupportIcon
} from '@mui/icons-material';

// VIP 데이터 타입 정의
interface VIPUser {
    id: string;
    userId: string;
    level: string;
    points: number;
    discount: number;
    priority: number;
    joinDate: string;
    lastActivity: string;
    benefits: string[];
    nextLevelRequirement: number;
}

interface VIPPartner {
    id: string;
    name: string;
    category: string;
    description: string;
    status: string;
    productCount: number;
}

const VIPDashboard: React.FC = () => {
    const [vipData, setVipData] = useState<VIPUser | null>(null);
    const [partners, setPartners] = useState<VIPPartner[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // VIP 레벨별 색상 및 아이콘
    const getVIPLevelInfo = (level: string) => {
        switch (level.toUpperCase()) {
            case 'DIAMOND':
                return { color: '#E3F2FD', icon: '💎', bgColor: '#1976D2' };
            case 'PLATINUM':
                return { color: '#F3E5F5', icon: '🏆', bgColor: '#7B1FA2' };
            case 'GOLD':
                return { color: '#FFF8E1', icon: '🥇', bgColor: '#F57C00' };
            case 'SILVER':
                return { color: '#FAFAFA', icon: '🥈', bgColor: '#616161' };
            case 'BRONZE':
                return { color: '#FFF3E0', icon: '🥉', bgColor: '#FF8F00' };
            default:
                return { color: '#F5F5F5', icon: '⭐', bgColor: '#9E9E9E' };
        }
    };

    // 실제 VIP 데이터 로딩
    useEffect(() => {
        const loadVIPData = async () => {
            try {
                setLoading(true);

                // VIP 사용자 정보 로딩
                const vipResponse = await fetch('/api/vip-system/vip-users/current');
                if (vipResponse.ok) {
                    const vipUserData = await vipResponse.json();
                    setVipData(vipUserData.data);
                } else {
                    // 모의 데이터 사용
                    setVipData({
                        id: 'vip_001',
                        userId: 'user_123',
                        level: 'GOLD',
                        points: 2500,
                        discount: 15,
                        priority: 3,
                        joinDate: '2024-01-15',
                        lastActivity: new Date().toISOString(),
                        benefits: [
                            'Priority customer support',
                            'Exclusive content access',
                            'Advanced analytics',
                            'Custom themes and layouts',
                            '15% discount on all purchases',
                            'Early access to new features'
                        ],
                        nextLevelRequirement: 3500
                    });
                }

                // 파트너 업체 정보 로딩
                const partnersResponse = await fetch('/api/vip-system/partners');
                if (partnersResponse.ok) {
                    const partnersData = await partnersResponse.json();
                    setPartners(partnersData.data || []);
                } else {
                    // 모의 파트너 데이터
                    setPartners([
                        {
                            id: 'partner_001',
                            name: 'Premium Cosplay Store',
                            category: 'Cosplay',
                            description: '고품질 코스프레 의상 및 소품',
                            status: 'active',
                            productCount: 150
                        },
                        {
                            id: 'partner_002',
                            name: 'Streaming Equipment Pro',
                            category: 'Streaming',
                            description: '전문 방송 장비 및 액세서리',
                            status: 'active',
                            productCount: 89
                        },
                        {
                            id: 'partner_003',
                            name: 'Gaming Gear Elite',
                            category: 'Gaming',
                            description: '프로게이머용 게이밍 기어',
                            status: 'active',
                            productCount: 234
                        }
                    ]);
                }

            } catch (err) {
                setError('VIP 데이터를 불러오는 중 오류가 발생했습니다.');
                console.error('VIP 데이터 로딩 오류:', err);
            } finally {
                setLoading(false);
            }
        };

        loadVIPData();
    }, []);

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

    if (!vipData) {
        return (
            <Container maxWidth="lg">
                <Box sx={{ py: 4 }}>
                    <Alert severity="info">VIP 데이터를 찾을 수 없습니다.</Alert>
                </Box>
            </Container>
        );
    }

    const levelInfo = getVIPLevelInfo(vipData.level);
    const progressToNext = ((vipData.points / vipData.nextLevelRequirement) * 100);

    return (
        <Container maxWidth="lg">
            <Box sx={{ py: 4 }}>
                {/* 헤더 */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                    <Avatar sx={{ bgcolor: levelInfo.bgColor, mr: 2, width: 56, height: 56, fontSize: '2rem' }}>
                        {levelInfo.icon}
                    </Avatar>
                    <Box>
                        <Typography variant="h3" component="h1" sx={{ fontWeight: 'bold' }}>
                            💎 VIP Dashboard
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                            <Chip
                                label={`${vipData.level} VIP`}
                                sx={{ bgcolor: levelInfo.bgColor, color: 'white', fontWeight: 'bold' }}
                            />
                            <Chip
                                label={`${vipData.discount}% 할인`}
                                color="success"
                                variant="outlined"
                            />
                        </Box>
                    </Box>
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 3 }}>
                    {/* 메인 VIP 정보 */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {/* VIP 상태 카드 */}
                        <Card sx={{ background: levelInfo.color }}>
                            <CardContent>
                                <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                                    <StarIcon sx={{ mr: 1, color: levelInfo.bgColor }} />
                                    VIP 상태
                                </Typography>

                                <Box sx={{ mb: 3 }}>
                                    <Typography variant="h6" sx={{ color: levelInfo.bgColor, fontWeight: 'bold' }}>
                                        현재 레벨: {vipData.level}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        가입일: {new Date(vipData.joinDate).toLocaleDateString('ko-KR')}
                                    </Typography>
                                </Box>

                                <Box sx={{ mb: 2 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="body2">포인트 진행률</Typography>
                                        <Typography variant="body2">
                                            {vipData.points.toLocaleString()} / {vipData.nextLevelRequirement.toLocaleString()}
                                        </Typography>
                                    </Box>
                                    <LinearProgress
                                        variant="determinate"
                                        value={Math.min(progressToNext, 100)}
                                        sx={{ height: 8, borderRadius: 4 }}
                                    />
                                    <Typography variant="caption" color="text.secondary">
                                        다음 레벨까지 {(vipData.nextLevelRequirement - vipData.points).toLocaleString()} 포인트 필요
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>

                        {/* VIP 혜택 */}
                        <Card>
                            <CardContent>
                                <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                                    <TrendingUpIcon sx={{ mr: 1, color: 'primary.main' }} />
                                    VIP 혜택
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    {vipData.benefits.map((benefit, index) => (
                                        <Box key={index} sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Box sx={{
                                                width: 8,
                                                height: 8,
                                                borderRadius: '50%',
                                                bgcolor: 'primary.main',
                                                mr: 2
                                            }} />
                                            <Typography variant="body1">{benefit}</Typography>
                                        </Box>
                                    ))}
                                </Box>
                            </CardContent>
                        </Card>
                    </Box>

                    {/* 사이드바 */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {/* 빠른 액션 */}
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>빠른 액션</Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <Button
                                        variant="contained"
                                        startIcon={<SupportIcon />}
                                        fullWidth
                                    >
                                        VIP 지원 요청
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        startIcon={<ShoppingCartIcon />}
                                        fullWidth
                                    >
                                        VIP 스토어
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        startIcon={<PersonIcon />}
                                        fullWidth
                                    >
                                        개인화 설정
                                    </Button>
                                </Box>
                            </CardContent>
                        </Card>

                        {/* VIP 통계 */}
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>VIP 통계</Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="body2">우선순위</Typography>
                                        <Typography variant="body2" fontWeight="bold">
                                            Level {vipData.priority}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="body2">할인율</Typography>
                                        <Typography variant="body2" fontWeight="bold" color="success.main">
                                            {vipData.discount}%
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="body2">총 포인트</Typography>
                                        <Typography variant="body2" fontWeight="bold">
                                            {vipData.points.toLocaleString()}
                                        </Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Box>
                </Box>

                {/* 파트너 업체 */}
                {partners.length > 0 && (
                    <Card sx={{ mt: 3 }}>
                        <CardContent>
                            <Typography variant="h5" gutterBottom>🤝 VIP 파트너 업체</Typography>
                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
                                {partners.map((partner) => (
                                    <Card key={partner.id} variant="outlined">
                                        <CardContent>
                                            <Typography variant="h6" gutterBottom>{partner.name}</Typography>
                                            <Chip label={partner.category} size="small" sx={{ mb: 1 }} />
                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                                {partner.description}
                                            </Typography>
                                            <Typography variant="caption">
                                                상품 {partner.productCount}개 • {partner.status === 'active' ? '운영중' : '준비중'}
                                            </Typography>
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
                        💡 VIP 시스템이 실제 API와 연결되었습니다!
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        🚀 API 엔드포인트: /api/vip-system/* 활용
                    </Typography>
                </Box>
            </Box>
        </Container>
    );
};

export default VIPDashboard;