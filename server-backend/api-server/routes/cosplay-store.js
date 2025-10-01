const express = require('express');
const router = express.Router();
const logger = require('../../utils/logger');

// 코스프레 상점 관련 데이터 (실제로는 데이터베이스에서 가져옴)
let products = [];
let cosplayers = [];
let manufacturers = [];
let orders = [];
let reviews = [];
let subscriptions = [];

// 제품 관리 API
router.get('/products', (req, res) => {
    try {
        const { category, search, sort, page = 1, limit = 20 } = req.query;

        let filteredProducts = [...products];

        // 카테고리 필터링
        if (category) {
            filteredProducts = filteredProducts.filter(p => p.category === category);
        }

        // 검색 필터링
        if (search) {
            const searchTerm = search.toLowerCase();
            filteredProducts = filteredProducts.filter(p =>
                p.name.toLowerCase().includes(searchTerm) ||
                p.description.toLowerCase().includes(searchTerm) ||
                p.tags.some(tag => tag.toLowerCase().includes(searchTerm))
            );
        }

        // 정렬
        if (sort) {
            switch (sort) {
                case 'price_asc':
                    filteredProducts.sort((a, b) => a.price - b.price);
                    break;
                case 'price_desc':
                    filteredProducts.sort((a, b) => b.price - a.price);
                    break;
                case 'popularity':
                    filteredProducts.sort((a, b) => b.views - a.views);
                    break;
                case 'newest':
                    filteredProducts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                    break;
            }
        }

        // 페이지네이션
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + parseInt(limit);
        const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

        res.json({
            success: true,
            data: {
                products: paginatedProducts,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(filteredProducts.length / limit),
                    totalItems: filteredProducts.length,
                    itemsPerPage: parseInt(limit)
                }
            }
        });
    } catch (error) {
        logger.error('Error fetching products:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch products'
        });
    }
});

router.get('/products/:id', (req, res) => {
    try {
        const { id } = req.params;
        const product = products.find(p => p.id === id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // 조회수 증가
        product.views = (product.views || 0) + 1;

        res.json({
            success: true,
            data: product
        });
    } catch (error) {
        logger.error('Error fetching product:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch product'
        });
    }
});

router.post('/products', (req, res) => {
    try {
        const productData = {
            id: `product_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            ...req.body,
            createdAt: new Date().toISOString(),
            views: 0,
            sales: 0,
            rating: 0,
            reviewCount: 0
        };

        products.push(productData);

        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            data: productData
        });
    } catch (error) {
        logger.error('Error creating product:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create product'
        });
    }
});

// 코스플레이어 관리 API
router.get('/cosplayers', (req, res) => {
    try {
        const { search, category, rating, page = 1, limit = 20 } = req.query;

        let filteredCosplayers = [...cosplayers];

        // 검색 필터링
        if (search) {
            const searchTerm = search.toLowerCase();
            filteredCosplayers = filteredCosplayers.filter(c =>
                c.name.toLowerCase().includes(searchTerm) ||
                c.specialties.some(s => s.toLowerCase().includes(searchTerm))
            );
        }

        // 카테고리 필터링
        if (category) {
            filteredCosplayers = filteredCosplayers.filter(c =>
                c.specialties.includes(category)
            );
        }

        // 평점 필터링
        if (rating) {
            filteredCosplayers = filteredCosplayers.filter(c => c.rating >= parseFloat(rating));
        }

        // 페이지네이션
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + parseInt(limit);
        const paginatedCosplayers = filteredCosplayers.slice(startIndex, endIndex);

        res.json({
            success: true,
            data: {
                cosplayers: paginatedCosplayers,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(filteredCosplayers.length / limit),
                    totalItems: filteredCosplayers.length,
                    itemsPerPage: parseInt(limit)
                }
            }
        });
    } catch (error) {
        logger.error('Error fetching cosplayers:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch cosplayers'
        });
    }
});

router.get('/cosplayers/:id', (req, res) => {
    try {
        const { id } = req.params;
        const cosplayer = cosplayers.find(c => c.id === id);

        if (!cosplayer) {
            return res.status(404).json({
                success: false,
                message: 'Cosplayer not found'
            });
        }

        res.json({
            success: true,
            data: cosplayer
        });
    } catch (error) {
        logger.error('Error fetching cosplayer:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch cosplayer'
        });
    }
});

// 제작사 관리 API
router.get('/manufacturers', (req, res) => {
    try {
        const { search, category, verified, page = 1, limit = 20 } = req.query;

        let filteredManufacturers = [...manufacturers];

        // 검색 필터링
        if (search) {
            const searchTerm = search.toLowerCase();
            filteredManufacturers = filteredManufacturers.filter(m =>
                m.name.toLowerCase().includes(searchTerm) ||
                m.description.toLowerCase().includes(searchTerm)
            );
        }

        // 카테고리 필터링
        if (category) {
            filteredManufacturers = filteredManufacturers.filter(m =>
                m.categories.includes(category)
            );
        }

        // 인증 필터링
        if (verified !== undefined) {
            filteredManufacturers = filteredManufacturers.filter(m => m.verified === (verified === 'true'));
        }

        // 페이지네이션
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + parseInt(limit);
        const paginatedManufacturers = filteredManufacturers.slice(startIndex, endIndex);

        res.json({
            success: true,
            data: {
                manufacturers: paginatedManufacturers,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(filteredManufacturers.length / limit),
                    totalItems: filteredManufacturers.length,
                    itemsPerPage: parseInt(limit)
                }
            }
        });
    } catch (error) {
        logger.error('Error fetching manufacturers:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch manufacturers'
        });
    }
});

// 주문 관리 API
router.post('/orders', (req, res) => {
    try {
        const orderData = {
            id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            ...req.body,
            status: 'pending',
            createdAt: new Date().toISOString(),
            totalAmount: req.body.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
        };

        orders.push(orderData);

        // 제품 판매 수 증가
        orderData.items.forEach(item => {
            const product = products.find(p => p.id === item.productId);
            if (product) {
                product.sales += item.quantity;
            }
        });

        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            data: orderData
        });
    } catch (error) {
        logger.error('Error creating order:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create order'
        });
    }
});

router.get('/orders/:userId', (req, res) => {
    try {
        const { userId } = req.params;
        const userOrders = orders.filter(o => o.userId === userId);

        res.json({
            success: true,
            data: userOrders
        });
    } catch (error) {
        logger.error('Error fetching user orders:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch orders'
        });
    }
});

// 리뷰 관리 API
router.post('/reviews', (req, res) => {
    try {
        const reviewData = {
            id: `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            ...req.body,
            createdAt: new Date().toISOString(),
            helpful: 0
        };

        reviews.push(reviewData);

        // 제품 평점 업데이트
        const product = products.find(p => p.id === req.body.productId);
        if (product) {
            const productReviews = reviews.filter(r => r.productId === req.body.productId);
            const averageRating = productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length;
            product.rating = Math.round(averageRating * 10) / 10;
            product.reviewCount = productReviews.length;
        }

        res.status(201).json({
            success: true,
            message: 'Review created successfully',
            data: reviewData
        });
    } catch (error) {
        logger.error('Error creating review:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create review'
        });
    }
});

router.get('/reviews/:productId', (req, res) => {
    try {
        const { productId } = req.params;
        const productReviews = reviews.filter(r => r.productId === productId);

        res.json({
            success: true,
            data: productReviews
        });
    } catch (error) {
        logger.error('Error fetching reviews:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch reviews'
        });
    }
});

// 구독 관리 API
router.post('/subscriptions', (req, res) => {
    try {
        const subscriptionData = {
            id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            ...req.body,
            status: 'active',
            createdAt: new Date().toISOString(),
            nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        };

        subscriptions.push(subscriptionData);

        res.status(201).json({
            success: true,
            message: 'Subscription created successfully',
            data: subscriptionData
        });
    } catch (error) {
        logger.error('Error creating subscription:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create subscription'
        });
    }
});

// AI 추천 API
router.get('/recommendations/:userId', (req, res) => {
    try {
        const { userId } = req.params;
        const { type = 'products', limit = 10 } = req.query;

        // 간단한 추천 알고리즘 (실제로는 AI 모델 사용)
        let recommendations = [];

        if (type === 'products') {
            // 인기 제품 기반 추천
            recommendations = products
                .sort((a, b) => b.views - a.views)
                .slice(0, parseInt(limit));
        } else if (type === 'cosplayers') {
            // 인기 코스플레이어 기반 추천
            recommendations = cosplayers
                .sort((a, b) => b.rating - a.rating)
                .slice(0, parseInt(limit));
        }

        res.json({
            success: true,
            data: recommendations
        });
    } catch (error) {
        logger.error('Error fetching recommendations:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch recommendations'
        });
    }
});

// 트렌드 분석 API
router.get('/trends', (req, res) => {
    try {
        const { period = '7d' } = req.query;

        // 간단한 트렌드 분석 (실제로는 AI 모델 사용)
        const trends = {
            trendingProducts: products
                .sort((a, b) => b.views - a.views)
                .slice(0, 10),
            trendingCategories: ['anime', 'game', 'manga', 'movie', 'drama'],
            trendingHashtags: ['#cosplay', '#anime', '#kpop', '#game', '#manga'],
            popularCosplayers: cosplayers
                .sort((a, b) => b.rating - a.rating)
                .slice(0, 10)
        };

        res.json({
            success: true,
            data: trends
        });
    } catch (error) {
        logger.error('Error fetching trends:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch trends'
        });
    }
});

// 통계 API
router.get('/stats', (req, res) => {
    try {
        const stats = {
            totalProducts: products.length,
            totalCosplayers: cosplayers.length,
            totalManufacturers: manufacturers.length,
            totalOrders: orders.length,
            totalRevenue: orders.reduce((sum, order) => sum + order.totalAmount, 0),
            averageOrderValue: orders.length > 0 ?
                orders.reduce((sum, order) => sum + order.totalAmount, 0) / orders.length : 0,
            topCategories: ['anime', 'game', 'manga', 'movie', 'drama'],
            monthlyGrowth: {
                products: 15.2,
                orders: 23.8,
                revenue: 31.5
            }
        };

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        logger.error('Error fetching stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch stats'
        });
    }
});

module.exports = router;
