const express = require('express');
const router = express.Router();
const { logger } = require('../utils/logger');

// VIP 시스템 데이터 (실제로는 데이터베이스 사용)
const vipUsers = new Map();
const partnerCompanies = new Map();
const newProducts = new Map();
const managerConnections = new Map();

// VIP 등급 정의
const VIP_LEVELS = {
    BRONZE: { name: 'Bronze', discount: 5, priority: 1 },
    SILVER: { name: 'Silver', discount: 10, priority: 2 },
    GOLD: { name: 'Gold', discount: 15, priority: 3 },
    PLATINUM: { name: 'Platinum', discount: 20, priority: 4 },
    DIAMOND: { name: 'Diamond', discount: 25, priority: 5 }
};

// 파트너 업체 등록
router.post('/partners', (req, res) => {
    const { companyId, name, category, apiEndpoint, managerId, description } = req.body;

    const partner = {
        id: companyId,
        name,
        category,
        apiEndpoint,
        managerId,
        description,
        status: 'active',
        createdAt: new Date().toISOString(),
        lastSync: null,
        productCount: 0
    };

    partnerCompanies.set(companyId, partner);
    logger.info(`새 파트너 업체 등록: ${name} (${companyId})`);

    res.json({ success: true, data: partner });
});

// VIP 사용자 등록
router.post('/vip-users', (req, res) => {
    const { userId, name, email, level, interests, managerId } = req.body;

    const vipUser = {
        id: userId,
        name,
        email,
        level: VIP_LEVELS[level] || VIP_LEVELS.BRONZE,
        interests: interests || [],
        managerId,
        joinedAt: new Date().toISOString(),
        totalPurchases: 0,
        totalSavings: 0,
        notifications: [],
        isActive: true
    };

    vipUsers.set(userId, vipUser);
    logger.info(`새 VIP 사용자 등록: ${name} (${userId}) - ${vipUser.level.name}`);

    res.json({ success: true, data: vipUser });
});

// 신상품 등록
router.post('/new-products', (req, res) => {
    const { productId, companyId, name, category, price, description, images, managerId } = req.body;

    const newProduct = {
        id: productId,
        companyId,
        name,
        category,
        price,
        originalPrice: price,
        description,
        images: images || [],
        managerId,
        createdAt: new Date().toISOString(),
        isNew: true,
        views: 0,
        likes: 0,
        purchases: 0
    };

    newProducts.set(productId, newProduct);

    // 파트너 업체의 상품 수 증가
    if (partnerCompanies.has(companyId)) {
        const partner = partnerCompanies.get(companyId);
        partner.productCount++;
        partner.lastSync = new Date().toISOString();
        partnerCompanies.set(companyId, partner);
    }

    // VIP 사용자들에게 알림 발송
    sendNewProductNotifications(newProduct);

    logger.info(`신상품 등록: ${name} (${productId}) from ${companyId}`);

    res.json({ success: true, data: newProduct });
});

// VIP 사용자별 신상품 알림 발송
const sendNewProductNotifications = (product) => {
    const notifications = [];

    vipUsers.forEach((user, userId) => {
        // 관심사 매칭 또는 모든 VIP에게 알림
        const shouldNotify = user.interests.length === 0 ||
            user.interests.includes(product.category) ||
            user.interests.includes('all');

        if (shouldNotify && user.isActive) {
            const discount = user.level.discount;
            const discountedPrice = product.price * (1 - discount / 100);

            const notification = {
                id: `notif_${Date.now()}_${userId}`,
                userId,
                type: 'new_product',
                title: `🎉 신상품 알림: ${product.name}`,
                message: `${product.description}\n할인가: ${discountedPrice.toLocaleString()}원 (${discount}% 할인)`,
                productId: product.id,
                companyId: product.companyId,
                discount,
                discountedPrice,
                createdAt: new Date().toISOString(),
                isRead: false
            };

            user.notifications.push(notification);
            notifications.push(notification);
        }
    });

    logger.info(`${notifications.length}명의 VIP 사용자에게 신상품 알림 발송: ${product.name}`);
    return notifications;
};

// VIP 사용자 대시보드 데이터
router.get('/vip-dashboard/:userId', (req, res) => {
    const { userId } = req.params;
    const user = vipUsers.get(userId);

    if (!user) {
        return res.status(404).json({ success: false, message: 'VIP 사용자를 찾을 수 없습니다.' });
    }

    // 사용자의 알림 (최근 10개)
    const recentNotifications = user.notifications
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 10);

    // 사용자 관심사별 신상품
    const relevantProducts = Array.from(newProducts.values())
        .filter(product =>
            user.interests.length === 0 ||
            user.interests.includes(product.category) ||
            user.interests.includes('all')
        )
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 20);

    // 할인가 적용
    const productsWithDiscount = relevantProducts.map(product => ({
        ...product,
        discountedPrice: product.price * (1 - user.level.discount / 100),
        savings: product.price - (product.price * (1 - user.level.discount / 100))
    }));

    const dashboard = {
        user: {
            id: user.id,
            name: user.name,
            level: user.level,
            totalPurchases: user.totalPurchases,
            totalSavings: user.totalSavings,
            joinedAt: user.joinedAt
        },
        notifications: recentNotifications,
        newProducts: productsWithDiscount,
        stats: {
            totalNotifications: user.notifications.length,
            unreadNotifications: user.notifications.filter(n => !n.isRead).length,
            availableProducts: productsWithDiscount.length,
            partnerCompanies: partnerCompanies.size
        }
    };

    res.json({ success: true, data: dashboard });
});

// 매니저별 연동 업체 관리
router.get('/manager/:managerId/partners', (req, res) => {
    const { managerId } = req.params;

    const managerPartners = Array.from(partnerCompanies.values())
        .filter(partner => partner.managerId === managerId);

    const managerStats = {
        totalPartners: managerPartners.length,
        activePartners: managerPartners.filter(p => p.status === 'active').length,
        totalProducts: managerPartners.reduce((sum, p) => sum + p.productCount, 0),
        lastSync: managerPartners.reduce((latest, p) =>
            !latest || new Date(p.lastSync) > new Date(latest) ? p.lastSync : latest, null)
    };

    res.json({
        success: true,
        data: {
            partners: managerPartners,
            stats: managerStats
        }
    });
});

// 신상품 목록 (필터링 지원)
router.get('/new-products', (req, res) => {
    const { category, companyId, managerId, limit = 20, offset = 0 } = req.query;

    let products = Array.from(newProducts.values());

    // 필터링
    if (category) {
        products = products.filter(p => p.category === category);
    }
    if (companyId) {
        products = products.filter(p => p.companyId === companyId);
    }
    if (managerId) {
        products = products.filter(p => p.managerId === managerId);
    }

    // 정렬 (최신순)
    products = products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // 페이지네이션
    const paginatedProducts = products.slice(offset, offset + parseInt(limit));

    res.json({
        success: true,
        data: {
            products: paginatedProducts,
            pagination: {
                total: products.length,
                limit: parseInt(limit),
                offset: parseInt(offset),
                hasMore: offset + parseInt(limit) < products.length
            }
        }
    });
});

// 알림 읽음 처리
router.put('/notifications/:notificationId/read', (req, res) => {
    const { notificationId } = req.params;
    const { userId } = req.body;

    const user = vipUsers.get(userId);
    if (!user) {
        return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
    }

    const notification = user.notifications.find(n => n.id === notificationId);
    if (!notification) {
        return res.status(404).json({ success: false, message: '알림을 찾을 수 없습니다.' });
    }

    notification.isRead = true;
    logger.info(`알림 읽음 처리: ${notificationId} for user ${userId}`);

    res.json({ success: true, data: notification });
});

// VIP 시스템 통계
router.get('/stats', (req, res) => {
    const totalVipUsers = vipUsers.size;
    const activeVipUsers = Array.from(vipUsers.values()).filter(u => u.isActive).length;
    const totalPartners = partnerCompanies.size;
    const totalProducts = newProducts.size;
    const totalNotifications = Array.from(vipUsers.values())
        .reduce((sum, user) => sum + user.notifications.length, 0);

    // VIP 등급별 분포
    const levelDistribution = {};
    Object.keys(VIP_LEVELS).forEach(level => {
        levelDistribution[level] = Array.from(vipUsers.values())
            .filter(u => u.level.name === VIP_LEVELS[level].name).length;
    });

    // 카테고리별 상품 분포
    const categoryDistribution = {};
    Array.from(newProducts.values()).forEach(product => {
        categoryDistribution[product.category] = (categoryDistribution[product.category] || 0) + 1;
    });

    res.json({
        success: true,
        data: {
            users: {
                total: totalVipUsers,
                active: activeVipUsers,
                levelDistribution
            },
            partners: {
                total: totalPartners,
                active: Array.from(partnerCompanies.values()).filter(p => p.status === 'active').length
            },
            products: {
                total: totalProducts,
                categoryDistribution
            },
            notifications: {
                total: totalNotifications,
                unread: Array.from(vipUsers.values())
                    .reduce((sum, user) => sum + user.notifications.filter(n => !n.isRead).length, 0)
            }
        }
    });
});

module.exports = router;
