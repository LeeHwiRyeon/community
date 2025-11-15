const logger = require('../utils/logger');

class StreamingRecommendationService {
    constructor() {
        this.userProfiles = new Map();
        this.streamerProfiles = new Map();
        this.productFeatures = new Map();
        this.interactionHistory = new Map();
        this.trendingData = new Map();
        this.viewingPatterns = new Map();
    }

    // 사용자 프로필 생성/업데이트
    updateUserProfile(userId, userData) {
        const profile = {
            userId,
            preferences: userData.preferences || [],
            viewingHistory: userData.viewingHistory || [],
            purchaseHistory: userData.purchaseHistory || [],
            interactionHistory: userData.interactionHistory || [],
            demographics: userData.demographics || {},
            behaviorPatterns: userData.behaviorPatterns || {},
            subscriptionTier: userData.subscriptionTier || 'free',
            lastUpdated: new Date().toISOString()
        };

        this.userProfiles.set(userId, profile);
        logger.info(`User profile updated for user ${userId}`);
    }

    // 스트리머 프로필 생성/업데이트
    updateStreamerProfile(streamerId, streamerData) {
        const profile = {
            streamerId,
            categories: streamerData.categories || [],
            contentStyle: streamerData.contentStyle || {},
            audienceDemographics: streamerData.audienceDemographics || {},
            performanceMetrics: streamerData.performanceMetrics || {},
            productAffinity: streamerData.productAffinity || [],
            lastUpdated: new Date().toISOString()
        };

        this.streamerProfiles.set(streamerId, profile);
        logger.info(`Streamer profile updated for streamer ${streamerId}`);
    }

    // 상품 특성 분석
    analyzeProductFeatures(product) {
        const features = {
            productId: product.id,
            category: product.category,
            price: product.price,
            tags: product.tags || [],
            popularity: this.calculateProductPopularity(product),
            targetAudience: this.analyzeTargetAudience(product),
            streamerAffinity: this.calculateStreamerAffinity(product),
            trendingScore: this.calculateTrendingScore(product),
            conversionRate: product.conversionRate || 0,
            lastUpdated: new Date().toISOString()
        };

        this.productFeatures.set(product.id, features);
        return features;
    }

    // 사용자 상호작용 기록
    recordInteraction(userId, streamId, productId, interactionType, metadata = {}) {
        if (!this.interactionHistory.has(userId)) {
            this.interactionHistory.set(userId, []);
        }

        const interaction = {
            userId,
            streamId,
            productId,
            type: interactionType, // 'view', 'like', 'share', 'comment', 'purchase', 'subscribe'
            timestamp: new Date().toISOString(),
            metadata
        };

        this.interactionHistory.get(userId).push(interaction);

        // 사용자 프로필 업데이트
        this.updateUserProfileFromInteraction(userId, interaction);

        logger.info(`Interaction recorded: ${userId} -> ${streamId}/${productId} (${interactionType})`);
    }

    // 개인화된 상품 추천
    getPersonalizedProductRecommendations(userId, limit = 10) {
        const userProfile = this.userProfiles.get(userId);
        if (!userProfile) {
            return this.getTrendingProducts(limit);
        }

        const recommendations = [];
        const userPreferences = this.extractUserPreferences(userProfile);

        // 모든 상품에 대해 유사도 계산
        for (const [productId, features] of this.productFeatures) {
            const similarity = this.calculateProductSimilarity(userPreferences, features);
            if (similarity > 0.3) {
                recommendations.push({
                    productId,
                    score: similarity,
                    method: 'personalized',
                    reasons: this.generateRecommendationReasons(userPreferences, features)
                });
            }
        }

        // 사용자가 이미 상호작용한 상품 제외
        const userInteractions = this.interactionHistory.get(userId) || [];
        const userProductIds = new Set(userInteractions.map(i => i.productId));

        return recommendations
            .filter(rec => !userProductIds.has(rec.productId))
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
    }

    // 스트리머 기반 상품 추천
    getStreamerBasedRecommendations(streamerId, limit = 10) {
        const streamerProfile = this.streamerProfiles.get(streamerId);
        if (!streamerProfile) {
            return this.getTrendingProducts(limit);
        }

        const recommendations = [];

        // 스트리머의 콘텐츠 카테고리와 맞는 상품 추천
        for (const [productId, features] of this.productFeatures) {
            const categoryMatch = streamerProfile.categories.includes(features.category);
            const audienceMatch = this.calculateAudienceMatch(streamerProfile.audienceDemographics, features.targetAudience);

            if (categoryMatch || audienceMatch > 0.5) {
                recommendations.push({
                    productId,
                    score: (categoryMatch ? 0.6 : 0) + (audienceMatch * 0.4),
                    method: 'streamer-based',
                    reasons: [`${features.category} 카테고리`, '스트리머 관심사와 일치']
                });
            }
        }

        return recommendations
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
    }

    // 실시간 추천 (스트리밍 중)
    getRealTimeRecommendations(userId, streamId, limit = 5) {
        const userProfile = this.userProfiles.get(userId);
        const stream = this.getStreamData(streamId);

        if (!userProfile || !stream) {
            return this.getTrendingProducts(limit);
        }

        const recommendations = [];

        // 현재 스트림의 카테고리와 관련된 상품
        const streamCategory = stream.category;
        const streamerId = stream.streamerId;

        for (const [productId, features] of this.productFeatures) {
            let score = 0;
            const reasons = [];

            // 카테고리 매칭
            if (features.category === streamCategory) {
                score += 0.4;
                reasons.push('현재 스트림 카테고리와 일치');
            }

            // 스트리머 선호도
            if (streamerId && features.streamerAffinity[streamerId]) {
                score += features.streamerAffinity[streamerId] * 0.3;
                reasons.push('스트리머 선호 상품');
            }

            // 사용자 선호도
            const userSimilarity = this.calculateProductSimilarity(
                this.extractUserPreferences(userProfile),
                features
            );
            score += userSimilarity * 0.3;

            if (score > 0.3) {
                recommendations.push({
                    productId,
                    score,
                    method: 'real-time',
                    reasons
                });
            }
        }

        return recommendations
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
    }

    // 스트리머 추천
    getStreamerRecommendations(userId, limit = 10) {
        const userProfile = this.userProfiles.get(userId);
        if (!userProfile) {
            return this.getTrendingStreamers(limit);
        }

        const recommendations = [];
        const userPreferences = this.extractUserPreferences(userProfile);

        // 모든 스트리머에 대해 유사도 계산
        for (const [streamerId, profile] of this.streamerProfiles) {
            const similarity = this.calculateStreamerSimilarity(userPreferences, profile);
            if (similarity > 0.2) {
                recommendations.push({
                    streamerId,
                    score: similarity,
                    method: 'personalized',
                    reasons: this.generateStreamerRecommendationReasons(userPreferences, profile)
                });
            }
        }

        // 사용자가 이미 팔로우한 스트리머 제외
        const userInteractions = this.interactionHistory.get(userId) || [];
        const followedStreamers = new Set(
            userInteractions
                .filter(i => i.type === 'subscribe' || i.type === 'follow')
                .map(i => i.streamId)
        );

        return recommendations
            .filter(rec => !followedStreamers.has(rec.streamerId))
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
    }

    // 트렌딩 상품
    getTrendingProducts(limit = 10) {
        const trending = [];
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        // 최근 1주일간의 상호작용 분석
        for (const [userId, interactions] of this.interactionHistory) {
            interactions.forEach(interaction => {
                const interactionTime = new Date(interaction.timestamp);
                if (interactionTime >= oneWeekAgo && interaction.productId) {
                    const existing = trending.find(t => t.productId === interaction.productId);
                    if (existing) {
                        existing.score += this.getInteractionWeight(interaction.type);
                    } else {
                        trending.push({
                            productId: interaction.productId,
                            score: this.getInteractionWeight(interaction.type)
                        });
                    }
                }
            });
        }

        return trending
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
    }

    // 트렌딩 스트리머
    getTrendingStreamers(limit = 10) {
        const trending = [];
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        // 최근 1주일간의 상호작용 분석
        for (const [userId, interactions] of this.interactionHistory) {
            interactions.forEach(interaction => {
                const interactionTime = new Date(interaction.timestamp);
                if (interactionTime >= oneWeekAgo && interaction.streamId) {
                    const streamerId = this.getStreamerIdFromStream(interaction.streamId);
                    if (streamerId) {
                        const existing = trending.find(t => t.streamerId === streamerId);
                        if (existing) {
                            existing.score += this.getInteractionWeight(interaction.type);
                        } else {
                            trending.push({
                                streamerId,
                                score: this.getInteractionWeight(interaction.type)
                            });
                        }
                    }
                }
            });
        }

        return trending
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
    }

    // 상품 유사도 계산
    calculateProductSimilarity(userPreferences, productFeatures) {
        let similarity = 0;
        let totalWeight = 0;

        // 카테고리 매칭
        if (userPreferences.categories && productFeatures.category) {
            const categoryMatch = userPreferences.categories.includes(productFeatures.category);
            similarity += categoryMatch ? 0.3 : 0;
            totalWeight += 0.3;
        }

        // 태그 매칭
        if (userPreferences.tags && productFeatures.tags) {
            const userTags = new Set(userPreferences.tags);
            const productTags = new Set(productFeatures.tags);
            const tagIntersection = new Set([...userTags].filter(x => productTags.has(x)));
            const tagUnion = new Set([...userTags, ...productTags]);

            const tagSimilarity = tagUnion.size > 0 ? tagIntersection.size / tagUnion.size : 0;
            similarity += tagSimilarity * 0.4;
            totalWeight += 0.4;
        }

        // 가격 선호도
        if (userPreferences.priceRange && productFeatures.price) {
            const [minPrice, maxPrice] = userPreferences.priceRange;
            const priceMatch = productFeatures.price >= minPrice && productFeatures.price <= maxPrice;
            similarity += priceMatch ? 0.2 : 0;
            totalWeight += 0.2;
        }

        // 인기도
        if (productFeatures.popularity) {
            const popularityScore = Math.min(productFeatures.popularity / 100, 1);
            similarity += popularityScore * 0.1;
            totalWeight += 0.1;
        }

        return totalWeight > 0 ? similarity / totalWeight : 0;
    }

    // 스트리머 유사도 계산
    calculateStreamerSimilarity(userPreferences, streamerProfile) {
        let similarity = 0;
        let totalWeight = 0;

        // 카테고리 매칭
        if (userPreferences.categories && streamerProfile.categories) {
            const userCategories = new Set(userPreferences.categories);
            const streamerCategories = new Set(streamerProfile.categories);
            const categoryIntersection = new Set([...userCategories].filter(x => streamerCategories.has(x)));
            const categoryUnion = new Set([...userCategories, ...streamerCategories]);

            const categorySimilarity = categoryUnion.size > 0 ? categoryIntersection.size / categoryUnion.size : 0;
            similarity += categorySimilarity * 0.6;
            totalWeight += 0.6;
        }

        // 콘텐츠 스타일 매칭
        if (userPreferences.contentStyle && streamerProfile.contentStyle) {
            const styleSimilarity = this.calculateStyleSimilarity(userPreferences.contentStyle, streamerProfile.contentStyle);
            similarity += styleSimilarity * 0.4;
            totalWeight += 0.4;
        }

        return totalWeight > 0 ? similarity / totalWeight : 0;
    }

    // 사용자 선호도 추출
    extractUserPreferences(userProfile) {
        const preferences = {
            categories: [],
            tags: [],
            priceRange: [0, 1000],
            contentStyle: {},
            brands: [],
            streamers: []
        };

        // 시청 이력에서 선호도 분석
        const viewingHistory = userProfile.viewingHistory || [];
        const categories = new Map();
        const tags = new Map();
        const prices = [];
        const streamers = new Map();

        viewingHistory.forEach(viewing => {
            if (viewing.category) {
                categories.set(viewing.category, (categories.get(viewing.category) || 0) + 1);
            }
            if (viewing.tags) {
                viewing.tags.forEach(tag => {
                    tags.set(tag, (tags.get(tag) || 0) + 1);
                });
            }
            if (viewing.streamerId) {
                streamers.set(viewing.streamerId, (streamers.get(viewing.streamerId) || 0) + 1);
            }
        });

        // 구매 이력에서 선호도 분석
        const purchases = userProfile.purchaseHistory || [];
        purchases.forEach(purchase => {
            if (purchase.price) {
                prices.push(purchase.price);
            }
        });

        // 가장 많이 시청한 카테고리들
        preferences.categories = Array.from(categories.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([category]) => category);

        // 가장 많이 시청한 태그들
        preferences.tags = Array.from(tags.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([tag]) => tag);

        // 가격 범위 (평균 ± 표준편차)
        if (prices.length > 0) {
            const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
            const variance = prices.reduce((sum, price) => sum + Math.pow(price - avgPrice, 2), 0) / prices.length;
            const stdDev = Math.sqrt(variance);
            preferences.priceRange = [
                Math.max(0, avgPrice - stdDev),
                avgPrice + stdDev
            ];
        }

        // 선호 스트리머들
        preferences.streamers = Array.from(streamers.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([streamerId]) => streamerId);

        return preferences;
    }

    // 상품 인기도 계산
    calculateProductPopularity(product) {
        const views = product.views || 0;
        const sales = product.sales || 0;
        const likes = product.likes || 0;
        const shares = product.shares || 0;

        // 가중 평균으로 인기도 계산
        return (views * 0.1) + (sales * 10) + (likes * 2) + (shares * 3);
    }

    // 타겟 오디언스 분석
    analyzeTargetAudience(product) {
        // 상품명과 설명에서 타겟 오디언스 키워드 추출
        const audienceKeywords = {
            'teen': ['teen', 'young', 'youth', 'student'],
            'adult': ['adult', 'mature', 'professional'],
            'gamer': ['gaming', 'game', 'gamer', 'esports'],
            'music': ['music', 'song', 'concert', 'album'],
            'fashion': ['fashion', 'style', 'clothing', 'outfit'],
            'tech': ['tech', 'technology', 'gadget', 'device']
        };

        const text = `${product.name} ${product.description}`.toLowerCase();
        const targetAudience = [];

        for (const [audience, keywords] of Object.entries(audienceKeywords)) {
            if (keywords.some(keyword => text.includes(keyword))) {
                targetAudience.push(audience);
            }
        }

        return targetAudience;
    }

    // 스트리머 선호도 계산
    calculateStreamerAffinity(product) {
        // 실제로는 스트리머의 상품 판매 이력과 성과를 기반으로 계산
        const affinity = {};

        // 예시: 랜덤 값 (실제로는 데이터 기반)
        for (const [streamerId] of this.streamerProfiles) {
            affinity[streamerId] = Math.random() * 0.8 + 0.2; // 0.2 ~ 1.0
        }

        return affinity;
    }

    // 트렌딩 점수 계산
    calculateTrendingScore(product) {
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        // 최근 1일간의 상호작용 기반 트렌딩 점수
        let score = 0;
        for (const [userId, interactions] of this.interactionHistory) {
            interactions.forEach(interaction => {
                if (interaction.productId === product.id) {
                    const interactionTime = new Date(interaction.timestamp);
                    if (interactionTime >= oneDayAgo) {
                        score += this.getInteractionWeight(interaction.type);
                    }
                }
            });
        }

        return score;
    }

    // 상호작용 가중치
    getInteractionWeight(interactionType) {
        const weights = {
            'purchase': 20,
            'subscribe': 10,
            'like': 3,
            'share': 5,
            'view': 1,
            'comment': 2
        };
        return weights[interactionType] || 1;
    }

    // 추천 이유 생성
    generateRecommendationReasons(userPreferences, productFeatures) {
        const reasons = [];

        if (userPreferences.categories.includes(productFeatures.category)) {
            reasons.push(`${productFeatures.category} 카테고리 선호`);
        }

        if (productFeatures.tags.some(tag => userPreferences.tags.includes(tag))) {
            reasons.push('관심 태그와 일치');
        }

        if (productFeatures.popularity > 50) {
            reasons.push('인기 상품');
        }

        if (productFeatures.trendingScore > 10) {
            reasons.push('트렌딩 상품');
        }

        return reasons;
    }

    // 스트리머 추천 이유 생성
    generateStreamerRecommendationReasons(userPreferences, streamerProfile) {
        const reasons = [];

        if (userPreferences.categories.some(cat => streamerProfile.categories.includes(cat))) {
            reasons.push('관심 카테고리 스트리머');
        }

        if (userPreferences.streamers.includes(streamerProfile.streamerId)) {
            reasons.push('이미 팔로우한 스트리머');
        }

        return reasons;
    }

    // 스트림 데이터 가져오기 (실제로는 데이터베이스에서 조회)
    getStreamData(streamId) {
        // 예시 데이터
        return {
            id: streamId,
            streamerId: 'streamer1',
            category: 'gaming',
            status: 'live'
        };
    }

    // 스트림 ID로부터 스트리머 ID 가져오기
    getStreamerIdFromStream(streamId) {
        const stream = this.getStreamData(streamId);
        return stream ? stream.streamerId : null;
    }

    // 스타일 유사도 계산
    calculateStyleSimilarity(userStyle, streamerStyle) {
        // 실제로는 더 복잡한 알고리즘 사용
        const commonStyles = Object.keys(userStyle).filter(style =>
            streamerStyle[style] && userStyle[style] === streamerStyle[style]
        );
        return commonStyles.length / Math.max(Object.keys(userStyle).length, 1);
    }

    // 오디언스 매칭 계산
    calculateAudienceMatch(streamerAudience, productAudience) {
        if (!streamerAudience || !productAudience) return 0;

        const streamerAudienceSet = new Set(streamerAudience);
        const productAudienceSet = new Set(productAudience);
        const intersection = new Set([...streamerAudienceSet].filter(x => productAudienceSet.has(x)));
        const union = new Set([...streamerAudienceSet, ...productAudienceSet]);

        return union.size > 0 ? intersection.size / union.size : 0;
    }

    // 사용자 프로필을 상호작용으로부터 업데이트
    updateUserProfileFromInteraction(userId, interaction) {
        const profile = this.userProfiles.get(userId);
        if (!profile) return;

        switch (interaction.type) {
            case 'view':
                if (!profile.viewingHistory) profile.viewingHistory = [];
                profile.viewingHistory.push({
                    streamId: interaction.streamId,
                    timestamp: interaction.timestamp,
                    ...interaction.metadata
                });
                break;
            case 'purchase':
                if (!profile.purchaseHistory) profile.purchaseHistory = [];
                profile.purchaseHistory.push({
                    productId: interaction.productId,
                    timestamp: interaction.timestamp,
                    ...interaction.metadata
                });
                break;
            case 'subscribe':
                if (!profile.preferences) profile.preferences = [];
                // 스트리머의 카테고리를 선호도에 추가
                const stream = this.getStreamData(interaction.streamId);
                if (stream && stream.category && !profile.preferences.includes(stream.category)) {
                    profile.preferences.push(stream.category);
                }
                break;
        }

        profile.lastUpdated = new Date().toISOString();
        this.userProfiles.set(userId, profile);
    }
}

module.exports = new StreamingRecommendationService();
