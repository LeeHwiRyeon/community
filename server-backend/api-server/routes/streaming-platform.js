const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

// 스트리밍 플랫폼 관련 데이터 (실제로는 데이터베이스에서 가져옴)
let streamers = [];
let viewers = [];
let streams = [];
let products = [];
let recommendations = [];
let subscriptions = [];
let analytics = [];

// 스트리머 관리 API
router.get('/streamers', (req, res) => {
    try {
        const { search, category, status, page = 1, limit = 20 } = req.query;

        let filteredStreamers = [...streamers];

        // 검색 필터링
        if (search) {
            const searchTerm = search.toLowerCase();
            filteredStreamers = filteredStreamers.filter(s =>
                s.name.toLowerCase().includes(searchTerm) ||
                s.description.toLowerCase().includes(searchTerm) ||
                s.categories.some(cat => cat.toLowerCase().includes(searchTerm))
            );
        }

        // 카테고리 필터링
        if (category) {
            filteredStreamers = filteredStreamers.filter(s =>
                s.categories.includes(category)
            );
        }

        // 상태 필터링
        if (status) {
            filteredStreamers = filteredStreamers.filter(s => s.status === status);
        }

        // 페이지네이션
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + parseInt(limit);
        const paginatedStreamers = filteredStreamers.slice(startIndex, endIndex);

        res.json({
            success: true,
            data: {
                streamers: paginatedStreamers,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(filteredStreamers.length / limit),
                    totalItems: filteredStreamers.length,
                    itemsPerPage: parseInt(limit)
                }
            }
        });
    } catch (error) {
        logger.error('Error fetching streamers:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch streamers'
        });
    }
});

router.get('/streamers/:id', (req, res) => {
    try {
        const { id } = req.params;
        const streamer = streamers.find(s => s.id === id);

        if (!streamer) {
            return res.status(404).json({
                success: false,
                message: 'Streamer not found'
            });
        }

        res.json({
            success: true,
            data: streamer
        });
    } catch (error) {
        logger.error('Error fetching streamer:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch streamer'
        });
    }
});

// 스트림 관리 API
router.get('/streams', (req, res) => {
    try {
        const { streamerId, status, category, page = 1, limit = 20 } = req.query;

        let filteredStreams = [...streams];

        // 스트리머 필터링
        if (streamerId) {
            filteredStreams = filteredStreams.filter(s => s.streamerId === streamerId);
        }

        // 상태 필터링
        if (status) {
            filteredStreams = filteredStreams.filter(s => s.status === status);
        }

        // 카테고리 필터링
        if (category) {
            filteredStreams = filteredStreams.filter(s => s.category === category);
        }

        // 페이지네이션
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + parseInt(limit);
        const paginatedStreams = filteredStreams.slice(startIndex, endIndex);

        res.json({
            success: true,
            data: {
                streams: paginatedStreams,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(filteredStreams.length / limit),
                    totalItems: filteredStreams.length,
                    itemsPerPage: parseInt(limit)
                }
            }
        });
    } catch (error) {
        logger.error('Error fetching streams:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch streams'
        });
    }
});

router.post('/streams', (req, res) => {
    try {
        const streamData = {
            id: `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            ...req.body,
            status: 'live',
            startTime: new Date().toISOString(),
            viewers: 0,
            likes: 0,
            shares: 0,
            comments: 0
        };

        streams.push(streamData);

        res.status(201).json({
            success: true,
            message: 'Stream created successfully',
            data: streamData
        });
    } catch (error) {
        logger.error('Error creating stream:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create stream'
        });
    }
});

// 상품 추천 API
router.get('/recommendations/products/:userId', (req, res) => {
    try {
        const { userId } = req.params;
        const { type = 'personalized', limit = 10 } = req.query;

        let recommendations = [];

        if (type === 'personalized') {
            // 개인화된 추천 (실제로는 AI 모델 사용)
            recommendations = products
                .sort((a, b) => b.popularity - a.popularity)
                .slice(0, parseInt(limit));
        } else if (type === 'trending') {
            // 트렌딩 상품
            recommendations = products
                .sort((a, b) => b.trendingScore - a.trendingScore)
                .slice(0, parseInt(limit));
        } else if (type === 'streamer') {
            // 스트리머 기반 추천
            const streamerId = req.query.streamerId;
            if (streamerId) {
                recommendations = products
                    .filter(p => p.recommendedBy === streamerId)
                    .slice(0, parseInt(limit));
            }
        }

        res.json({
            success: true,
            data: recommendations
        });
    } catch (error) {
        logger.error('Error fetching product recommendations:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch recommendations'
        });
    }
});

// 스트리머 추천 API
router.get('/recommendations/streamers/:userId', (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 10 } = req.query;

        // 개인화된 스트리머 추천 (실제로는 AI 모델 사용)
        const recommendations = streamers
            .sort((a, b) => b.rating - a.rating)
            .slice(0, parseInt(limit));

        res.json({
            success: true,
            data: recommendations
        });
    } catch (error) {
        logger.error('Error fetching streamer recommendations:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch streamer recommendations'
        });
    }
});

// 모니터링 API
router.get('/monitoring/streams/:streamId', (req, res) => {
    try {
        const { streamId } = req.params;
        const stream = streams.find(s => s.id === streamId);

        if (!stream) {
            return res.status(404).json({
                success: false,
                message: 'Stream not found'
            });
        }

        const monitoringData = {
            streamId,
            viewers: stream.viewers,
            likes: stream.likes,
            shares: stream.shares,
            comments: stream.comments,
            quality: {
                bitrate: '1080p',
                bufferRate: 0.02,
                latency: 2.5
            },
            performance: {
                cpu: 45,
                memory: 60,
                network: 80
            },
            timestamp: new Date().toISOString()
        };

        res.json({
            success: true,
            data: monitoringData
        });
    } catch (error) {
        logger.error('Error fetching monitoring data:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch monitoring data'
        });
    }
});

// 구독자 관리 API
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

router.get('/subscriptions/:userId', (req, res) => {
    try {
        const { userId } = req.params;
        const userSubscriptions = subscriptions.filter(s => s.userId === userId);

        res.json({
            success: true,
            data: userSubscriptions
        });
    } catch (error) {
        logger.error('Error fetching user subscriptions:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch subscriptions'
        });
    }
});

// 분석 API
router.get('/analytics/streamer/:streamerId', (req, res) => {
    try {
        const { streamerId } = req.params;
        const { period = '7d' } = req.query;

        // 스트리머 분석 데이터 (실제로는 데이터베이스에서 조회)
        const analyticsData = {
            streamerId,
            period,
            metrics: {
                totalViews: 125000,
                averageViewers: 2500,
                totalHours: 120,
                totalRevenue: 5000,
                subscriberCount: 15000,
                followerCount: 45000,
                engagementRate: 0.15,
                conversionRate: 0.08
            },
            trends: {
                views: [1000, 1200, 1100, 1300, 1400, 1500, 1600],
                revenue: [500, 600, 550, 700, 750, 800, 850],
                subscribers: [100, 120, 110, 130, 140, 150, 160]
            },
            topProducts: [
                { id: 'prod1', name: 'Product 1', sales: 150, revenue: 3000 },
                { id: 'prod2', name: 'Product 2', sales: 120, revenue: 2400 },
                { id: 'prod3', name: 'Product 3', sales: 100, revenue: 2000 }
            ],
            timestamp: new Date().toISOString()
        };

        res.json({
            success: true,
            data: analyticsData
        });
    } catch (error) {
        logger.error('Error fetching analytics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch analytics'
        });
    }
});

// 실시간 상호작용 API
router.post('/interactions', (req, res) => {
    try {
        const { streamId, userId, type, data } = req.body;

        const interaction = {
            id: `interaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            streamId,
            userId,
            type, // 'view', 'like', 'share', 'comment', 'purchase'
            data,
            timestamp: new Date().toISOString()
        };

        // 스트림 통계 업데이트
        const stream = streams.find(s => s.id === streamId);
        if (stream) {
            switch (type) {
                case 'view':
                    stream.viewers = Math.max(stream.viewers, data.viewerCount || 0);
                    break;
                case 'like':
                    stream.likes += 1;
                    break;
                case 'share':
                    stream.shares += 1;
                    break;
                case 'comment':
                    stream.comments += 1;
                    break;
            }
        }

        res.status(201).json({
            success: true,
            message: 'Interaction recorded successfully',
            data: interaction
        });
    } catch (error) {
        logger.error('Error recording interaction:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to record interaction'
        });
    }
});

// 상품 관리 API
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
                p.description.toLowerCase().includes(searchTerm)
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
                    filteredProducts.sort((a, b) => b.popularity - a.popularity);
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

// 통계 API
router.get('/stats', (req, res) => {
    try {
        const stats = {
            totalStreamers: streamers.length,
            totalViewers: viewers.length,
            totalStreams: streams.length,
            totalProducts: products.length,
            totalSubscriptions: subscriptions.length,
            totalRevenue: subscriptions.reduce((sum, sub) => sum + (sub.amount || 0), 0),
            averageViewers: streams.length > 0 ?
                streams.reduce((sum, stream) => sum + stream.viewers, 0) / streams.length : 0,
            topCategories: ['gaming', 'music', 'talk', 'education', 'lifestyle'],
            monthlyGrowth: {
                streamers: 25.5,
                viewers: 40.2,
                revenue: 35.8
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

// 실시간 알림 API
router.post('/notifications', (req, res) => {
    try {
        const { userId, type, message, data } = req.body;

        const notification = {
            id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId,
            type, // 'stream_start', 'product_recommendation', 'subscription_expiry'
            message,
            data,
            read: false,
            timestamp: new Date().toISOString()
        };

        res.status(201).json({
            success: true,
            message: 'Notification sent successfully',
            data: notification
        });
    } catch (error) {
        logger.error('Error sending notification:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send notification'
        });
    }
});

module.exports = router;
