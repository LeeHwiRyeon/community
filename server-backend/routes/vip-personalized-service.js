const express = require('express');
const router = express.Router();
const { logger } = require('../utils/logger');

// VIP 전용 맞춤형 서비스 시스템
const vipProfiles = new Map();
const personalizedRecommendations = new Map();
const vipSupportTickets = new Map();
const vipExclusiveChannels = new Map();

// VIP 프로필 관리
router.post('/profiles', (req, res) => {
    const {
        userId,
        preferences,
        interests,
        budgetRange,
        stylePreferences,
        sizePreferences,
        colorPreferences,
        brandPreferences,
        activityLevel,
        socialPreferences
    } = req.body;

    const profile = {
        id: `profile_${userId}`,
        userId,
        preferences: preferences || {},
        interests: interests || [],
        budgetRange: budgetRange || { min: 0, max: 1000000 },
        stylePreferences: stylePreferences || [],
        sizePreferences: sizePreferences || [],
        colorPreferences: colorPreferences || [],
        brandPreferences: brandPreferences || [],
        activityLevel: activityLevel || 'medium',
        socialPreferences: socialPreferences || {},
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        recommendationScore: 0,
        personalizationLevel: 'basic'
    };

    vipProfiles.set(userId, profile);

    // 초기 추천 생성
    generateInitialRecommendations(profile);

    logger.info(`VIP 프로필 생성: ${userId}`);

    res.json({ success: true, data: profile });
});

// 개인화된 추천 생성
const generateInitialRecommendations = (profile) => {
    const recommendations = {
        id: `rec_${profile.userId}`,
        userId: profile.userId,
        products: [],
        events: [],
        content: [],
        services: [],
        personalizedOffers: [],
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        accuracy: 0.75
    };

    // 관심사 기반 상품 추천
    if (profile.interests.includes('anime')) {
        recommendations.products.push({
            id: 'anime_cosplay_001',
            name: '애니메이션 코스플레이 의상',
            category: 'anime',
            price: 150000,
            discount: 20,
            reason: '애니메이션 관심사 기반 추천',
            confidence: 0.9
        });
    }

    if (profile.interests.includes('gaming')) {
        recommendations.products.push({
            id: 'gaming_gear_001',
            name: '게이밍 기어 세트',
            category: 'gaming',
            price: 200000,
            discount: 15,
            reason: '게이밍 관심사 기반 추천',
            confidence: 0.85
        });
    }

    // 예산 범위 기반 추천
    const budgetRecommendations = generateBudgetBasedRecommendations(profile.budgetRange);
    recommendations.products.push(...budgetRecommendations);

    // 스타일 선호도 기반 추천
    const styleRecommendations = generateStyleBasedRecommendations(profile.stylePreferences);
    recommendations.products.push(...styleRecommendations);

    // 브랜드 선호도 기반 추천
    const brandRecommendations = generateBrandBasedRecommendations(profile.brandPreferences);
    recommendations.products.push(...brandRecommendations);

    personalizedRecommendations.set(profile.userId, recommendations);

    logger.info(`개인화된 추천 생성: ${profile.userId} - ${recommendations.products.length}개 상품`);
};

// 예산 기반 추천 생성
const generateBudgetBasedRecommendations = (budgetRange) => {
    const recommendations = [];

    if (budgetRange.max >= 500000) {
        recommendations.push({
            id: 'premium_cosplay_001',
            name: '프리미엄 코스플레이 의상',
            category: 'premium',
            price: 450000,
            discount: 25,
            reason: '고예산 범위 프리미엄 추천',
            confidence: 0.8
        });
    } else if (budgetRange.max >= 200000) {
        recommendations.push({
            id: 'mid_range_cosplay_001',
            name: '중급 코스플레이 의상',
            category: 'mid-range',
            price: 180000,
            discount: 15,
            reason: '중간 예산 범위 추천',
            confidence: 0.85
        });
    } else {
        recommendations.push({
            id: 'budget_cosplay_001',
            name: '경제적 코스플레이 의상',
            category: 'budget',
            price: 120000,
            discount: 10,
            reason: '경제적 예산 범위 추천',
            confidence: 0.9
        });
    }

    return recommendations;
};

// 스타일 기반 추천 생성
const generateStyleBasedRecommendations = (stylePreferences) => {
    const recommendations = [];

    stylePreferences.forEach(style => {
        switch (style) {
            case 'cute':
                recommendations.push({
                    id: `cute_style_${Date.now()}`,
                    name: '귀여운 스타일 의상',
                    category: 'cute',
                    price: 160000,
                    discount: 18,
                    reason: '귀여운 스타일 선호도 기반',
                    confidence: 0.88
                });
                break;
            case 'cool':
                recommendations.push({
                    id: `cool_style_${Date.now()}`,
                    name: '쿨한 스타일 의상',
                    category: 'cool',
                    price: 190000,
                    discount: 20,
                    reason: '쿨한 스타일 선호도 기반',
                    confidence: 0.87
                });
                break;
            case 'elegant':
                recommendations.push({
                    id: `elegant_style_${Date.now()}`,
                    name: '우아한 스타일 의상',
                    category: 'elegant',
                    price: 250000,
                    discount: 22,
                    reason: '우아한 스타일 선호도 기반',
                    confidence: 0.85
                });
                break;
        }
    });

    return recommendations;
};

// 브랜드 기반 추천 생성
const generateBrandBasedRecommendations = (brandPreferences) => {
    const recommendations = [];

    brandPreferences.forEach(brand => {
        recommendations.push({
            id: `${brand}_product_${Date.now()}`,
            name: `${brand} 브랜드 상품`,
            category: 'brand',
            price: Math.floor(Math.random() * 200000) + 100000,
            discount: 15,
            reason: `${brand} 브랜드 선호도 기반`,
            confidence: 0.9
        });
    });

    return recommendations;
};

// VIP 전용 우선 지원 시스템
router.post('/support-tickets', (req, res) => {
    const {
        userId,
        category,
        priority,
        subject,
        description,
        attachments = [],
        preferredContactMethod,
        urgencyLevel
    } = req.body;

    const ticketId = `ticket_${Date.now()}_${userId}`;
    const ticket = {
        id: ticketId,
        userId,
        category,
        priority: priority || 'HIGH',
        subject,
        description,
        attachments,
        preferredContactMethod,
        urgencyLevel: urgencyLevel || 'medium',
        status: 'OPEN',
        assignedTo: null,
        createdAt: new Date().toISOString(),
        firstResponseTime: null,
        resolutionTime: null,
        satisfaction: null,
        escalationLevel: 0,
        notes: [],
        updates: []
    };

    // VIP 우선 할당
    assignVIPSupportAgent(ticket);

    vipSupportTickets.set(ticketId, ticket);

    logger.info(`VIP 지원 티켓 생성: ${ticketId} - ${subject}`);

    res.json({
        success: true,
        data: ticket,
        message: 'VIP 우선 지원이 시작되었습니다.'
    });
});

// VIP 지원 에이전트 할당
const assignVIPSupportAgent = (ticket) => {
    const vipAgents = {
        'technical': 'VIP_Technical_Specialist',
        'billing': 'VIP_Billing_Manager',
        'product': 'VIP_Product_Expert',
        'general': 'VIP_Concierge_Service'
    };

    ticket.assignedTo = vipAgents[ticket.category] || 'VIP_Concierge_Service';
    ticket.status = 'ASSIGNED';
    ticket.firstResponseTime = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15분 내 응답

    ticket.updates.push({
        timestamp: new Date().toISOString(),
        message: `VIP 전용 에이전트 ${ticket.assignedTo}가 할당되었습니다.`,
        agent: 'SYSTEM'
    });
};

// VIP 전용 채널 관리
router.post('/exclusive-channels', (req, res) => {
    const {
        userId,
        channelType,
        channelName,
        description,
        accessLevel,
        maxMembers,
        features = []
    } = req.body;

    const channelId = `channel_${Date.now()}_${userId}`;
    const channel = {
        id: channelId,
        userId,
        channelType,
        channelName,
        description,
        accessLevel: accessLevel || 'VIP_ONLY',
        maxMembers: maxMembers || 50,
        features: features || ['chat', 'voice', 'video', 'file_sharing'],
        createdAt: new Date().toISOString(),
        members: [userId],
        moderators: [userId],
        isActive: true,
        settings: {
            allowInvites: true,
            requireApproval: false,
            moderationLevel: 'auto',
            contentFiltering: true
        }
    };

    vipExclusiveChannels.set(channelId, channel);

    logger.info(`VIP 전용 채널 생성: ${channelName} (${channelId})`);

    res.json({ success: true, data: channel });
});

// 개인화된 추천 조회
router.get('/recommendations/:userId', (req, res) => {
    const { userId } = req.params;
    const { category, limit = 20 } = req.query;

    const recommendations = personalizedRecommendations.get(userId);
    if (!recommendations) {
        return res.status(404).json({ success: false, message: '추천 데이터를 찾을 수 없습니다.' });
    }

    let filteredRecommendations = recommendations;

    if (category) {
        filteredRecommendations = {
            ...recommendations,
            products: recommendations.products.filter(p => p.category === category)
        };
    }

    // 정확도 순으로 정렬
    filteredRecommendations.products.sort((a, b) => b.confidence - a.confidence);

    // 제한된 수만큼 반환
    filteredRecommendations.products = filteredRecommendations.products.slice(0, parseInt(limit));

    res.json({ success: true, data: filteredRecommendations });
});

// VIP 지원 티켓 조회
router.get('/support-tickets/:userId', (req, res) => {
    const { userId } = req.params;
    const { status } = req.query;

    let userTickets = Array.from(vipSupportTickets.values())
        .filter(ticket => ticket.userId === userId);

    if (status) {
        userTickets = userTickets.filter(ticket => ticket.status === status);
    }

    // 최신순 정렬
    userTickets.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ success: true, data: userTickets });
});

// VIP 전용 채널 조회
router.get('/exclusive-channels/:userId', (req, res) => {
    const { userId } = req.params;

    const userChannels = Array.from(vipExclusiveChannels.values())
        .filter(channel =>
            channel.members.includes(userId) ||
            channel.moderators.includes(userId)
        );

    res.json({ success: true, data: userChannels });
});

// 추천 피드백 처리
router.post('/recommendations/:userId/feedback', (req, res) => {
    const { userId } = req.params;
    const { productId, rating, feedback, action } = req.body;

    const recommendations = personalizedRecommendations.get(userId);
    if (!recommendations) {
        return res.status(404).json({ success: false, message: '추천 데이터를 찾을 수 없습니다.' });
    }

    // 피드백 기록
    const feedbackData = {
        productId,
        rating,
        feedback,
        action, // 'viewed', 'clicked', 'purchased', 'dismissed'
        timestamp: new Date().toISOString()
    };

    if (!recommendations.feedback) {
        recommendations.feedback = [];
    }
    recommendations.feedback.push(feedbackData);

    // 추천 정확도 업데이트
    updateRecommendationAccuracy(recommendations);

    personalizedRecommendations.set(userId, recommendations);

    logger.info(`추천 피드백 처리: ${userId} - ${productId} (${action})`);

    res.json({ success: true, data: feedbackData });
});

// 추천 정확도 업데이트
const updateRecommendationAccuracy = (recommendations) => {
    if (!recommendations.feedback || recommendations.feedback.length === 0) {
        return;
    }

    const totalFeedback = recommendations.feedback.length;
    const positiveFeedback = recommendations.feedback.filter(f =>
        f.action === 'purchased' || f.rating >= 4
    ).length;

    recommendations.accuracy = positiveFeedback / totalFeedback;
    recommendations.lastUpdated = new Date().toISOString();
};

// VIP 맞춤형 서비스 통계
router.get('/stats/:userId', (req, res) => {
    const { userId } = req.params;

    const profile = vipProfiles.get(userId);
    const recommendations = personalizedRecommendations.get(userId);
    const tickets = Array.from(vipSupportTickets.values()).filter(t => t.userId === userId);
    const channels = Array.from(vipExclusiveChannels.values()).filter(c =>
        c.members.includes(userId) || c.moderators.includes(userId)
    );

    const stats = {
        profile: {
            personalizationLevel: profile?.personalizationLevel || 'basic',
            recommendationScore: profile?.recommendationScore || 0,
            interests: profile?.interests?.length || 0,
            preferences: Object.keys(profile?.preferences || {}).length
        },
        recommendations: {
            total: recommendations?.products?.length || 0,
            accuracy: recommendations?.accuracy || 0,
            lastUpdated: recommendations?.lastUpdated
        },
        support: {
            totalTickets: tickets.length,
            openTickets: tickets.filter(t => t.status === 'OPEN').length,
            resolvedTickets: tickets.filter(t => t.status === 'RESOLVED').length,
            averageResolutionTime: calculateAverageResolutionTime(tickets)
        },
        channels: {
            total: channels.length,
            active: channels.filter(c => c.isActive).length,
            moderating: channels.filter(c => c.moderators.includes(userId)).length
        }
    };

    res.json({ success: true, data: stats });
});

// 평균 해결 시간 계산
const calculateAverageResolutionTime = (tickets) => {
    const resolvedTickets = tickets.filter(t => t.resolutionTime);
    if (resolvedTickets.length === 0) return 0;

    const totalTime = resolvedTickets.reduce((sum, ticket) => {
        const resolutionTime = new Date(ticket.resolutionTime) - new Date(ticket.createdAt);
        return sum + resolutionTime;
    }, 0);

    return Math.round(totalTime / resolvedTickets.length / (1000 * 60)); // 분 단위
};

module.exports = router;
