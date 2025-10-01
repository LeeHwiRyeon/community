const logger = require('../../utils/logger');

class CosplayRecommendationService {
    constructor() {
        this.userProfiles = new Map();
        this.productFeatures = new Map();
        this.interactionHistory = new Map();
        this.trendingData = new Map();
    }

    // 사용자 프로필 생성/업데이트
    updateUserProfile(userId, userData) {
        const profile = {
            userId,
            preferences: userData.preferences || [],
            purchaseHistory: userData.purchaseHistory || [],
            viewHistory: userData.viewHistory || [],
            searchHistory: userData.searchHistory || [],
            demographics: userData.demographics || {},
            behaviorPatterns: userData.behaviorPatterns || {},
            lastUpdated: new Date().toISOString()
        };

        this.userProfiles.set(userId, profile);
        logger.info(`User profile updated for user ${userId}`);
    }

    // 제품 특성 분석
    analyzeProductFeatures(product) {
        const features = {
            productId: product.id,
            category: product.category,
            price: product.price,
            tags: product.tags || [],
            rating: product.rating || 0,
            popularity: this.calculatePopularity(product),
            style: this.extractStyleFeatures(product),
            color: this.extractColorFeatures(product),
            size: product.size || 'M',
            brand: product.manufacturer || 'Unknown',
            season: this.determineSeason(product),
            occasion: this.determineOccasion(product),
            complexity: this.calculateComplexity(product),
            lastUpdated: new Date().toISOString()
        };

        this.productFeatures.set(product.id, features);
        return features;
    }

    // 사용자 상호작용 기록
    recordInteraction(userId, productId, interactionType, metadata = {}) {
        if (!this.interactionHistory.has(userId)) {
            this.interactionHistory.set(userId, []);
        }

        const interaction = {
            userId,
            productId,
            type: interactionType, // 'view', 'purchase', 'like', 'share', 'review'
            timestamp: new Date().toISOString(),
            metadata
        };

        this.interactionHistory.get(userId).push(interaction);

        // 사용자 프로필 업데이트
        this.updateUserProfileFromInteraction(userId, interaction);

        logger.info(`Interaction recorded: ${userId} -> ${productId} (${interactionType})`);
    }

    // 협업 필터링 기반 추천
    getCollaborativeRecommendations(userId, limit = 10) {
        const userProfile = this.userProfiles.get(userId);
        if (!userProfile) {
            return [];
        }

        // 유사한 사용자 찾기
        const similarUsers = this.findSimilarUsers(userId);

        // 유사한 사용자들이 좋아한 제품들 수집
        const recommendations = new Map();

        similarUsers.forEach(({ userId: similarUserId, similarity }) => {
            const interactions = this.interactionHistory.get(similarUserId) || [];
            interactions.forEach(interaction => {
                if (interaction.type === 'purchase' || interaction.type === 'like') {
                    const score = recommendations.get(interaction.productId) || 0;
                    recommendations.set(interaction.productId, score + similarity);
                }
            });
        });

        // 사용자가 이미 상호작용한 제품 제외
        const userInteractions = this.interactionHistory.get(userId) || [];
        const userProductIds = new Set(userInteractions.map(i => i.productId));

        const filteredRecommendations = Array.from(recommendations.entries())
            .filter(([productId]) => !userProductIds.has(productId))
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([productId, score]) => ({ productId, score, method: 'collaborative' }));

        return filteredRecommendations;
    }

    // 콘텐츠 기반 추천
    getContentBasedRecommendations(userId, limit = 10) {
        const userProfile = this.userProfiles.get(userId);
        if (!userProfile) {
            return [];
        }

        const userPreferences = this.extractUserPreferences(userProfile);
        const recommendations = [];

        // 모든 제품에 대해 유사도 계산
        for (const [productId, features] of this.productFeatures) {
            const similarity = this.calculateContentSimilarity(userPreferences, features);
            if (similarity > 0.3) { // 임계값 설정
                recommendations.push({
                    productId,
                    score: similarity,
                    method: 'content-based'
                });
            }
        }

        // 사용자가 이미 상호작용한 제품 제외
        const userInteractions = this.interactionHistory.get(userId) || [];
        const userProductIds = new Set(userInteractions.map(i => i.productId));

        return recommendations
            .filter(rec => !userProductIds.has(rec.productId))
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
    }

    // 하이브리드 추천 (협업 + 콘텐츠)
    getHybridRecommendations(userId, limit = 10) {
        const collaborativeRecs = this.getCollaborativeRecommendations(userId, limit * 2);
        const contentRecs = this.getContentBasedRecommendations(userId, limit * 2);

        // 가중치 적용
        const collaborativeWeight = 0.6;
        const contentWeight = 0.4;

        const combinedRecs = new Map();

        // 협업 필터링 결과 추가
        collaborativeRecs.forEach(rec => {
            combinedRecs.set(rec.productId, {
                productId: rec.productId,
                collaborativeScore: rec.score,
                contentScore: 0,
                totalScore: rec.score * collaborativeWeight
            });
        });

        // 콘텐츠 기반 결과 추가/업데이트
        contentRecs.forEach(rec => {
            const existing = combinedRecs.get(rec.productId);
            if (existing) {
                existing.contentScore = rec.score;
                existing.totalScore += rec.score * contentWeight;
            } else {
                combinedRecs.set(rec.productId, {
                    productId: rec.productId,
                    collaborativeScore: 0,
                    contentScore: rec.score,
                    totalScore: rec.score * contentWeight
                });
            }
        });

        return Array.from(combinedRecs.values())
            .sort((a, b) => b.totalScore - a.totalScore)
            .slice(0, limit);
    }

    // 트렌드 기반 추천
    getTrendingRecommendations(userId, limit = 10) {
        const trendingProducts = this.calculateTrendingProducts();
        const userProfile = this.userProfiles.get(userId);

        if (!userProfile) {
            return trendingProducts.slice(0, limit);
        }

        // 사용자 취향과 맞는 트렌드 제품만 필터링
        const userPreferences = this.extractUserPreferences(userProfile);
        const filteredTrending = trendingProducts.filter(product => {
            const features = this.productFeatures.get(product.productId);
            if (!features) return false;

            const similarity = this.calculateContentSimilarity(userPreferences, features);
            return similarity > 0.2;
        });

        return filteredTrending.slice(0, limit);
    }

    // 코스플레이어 추천
    getCosplayerRecommendations(userId, limit = 10) {
        const userProfile = this.userProfiles.get(userId);
        if (!userProfile) {
            return [];
        }

        // 사용자가 관심 있는 카테고리 기반으로 코스플레이어 추천
        const preferredCategories = userProfile.preferences || [];
        const recommendations = [];

        // 실제로는 코스플레이어 데이터베이스에서 조회
        const cosplayers = [
            { id: 'cosplayer1', name: 'Alice', specialties: ['anime', 'game'], rating: 4.8 },
            { id: 'cosplayer2', name: 'Bob', specialties: ['manga', 'drama'], rating: 4.6 },
            { id: 'cosplayer3', name: 'Carol', specialties: ['movie', 'anime'], rating: 4.9 }
        ];

        cosplayers.forEach(cosplayer => {
            const categoryMatch = cosplayer.specialties.some(specialty =>
                preferredCategories.includes(specialty)
            );

            if (categoryMatch) {
                recommendations.push({
                    cosplayerId: cosplayer.id,
                    name: cosplayer.name,
                    score: cosplayer.rating * (categoryMatch ? 1.2 : 1.0),
                    method: 'category-based'
                });
            }
        });

        return recommendations
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
    }

    // 제작사 추천
    getManufacturerRecommendations(userId, limit = 10) {
        const userProfile = this.userProfiles.get(userId);
        if (!userProfile) {
            return [];
        }

        // 사용자 구매 이력에서 선호하는 제작사 분석
        const purchaseHistory = userProfile.purchaseHistory || [];
        const manufacturerScores = new Map();

        purchaseHistory.forEach(purchase => {
            const manufacturer = purchase.manufacturer;
            if (manufacturer) {
                const currentScore = manufacturerScores.get(manufacturer) || 0;
                manufacturerScores.set(manufacturer, currentScore + 1);
            }
        });

        // 실제로는 제작사 데이터베이스에서 조회
        const manufacturers = [
            { id: 'mfg1', name: 'CosplayPro', categories: ['anime', 'game'], rating: 4.7 },
            { id: 'mfg2', name: 'CostumeKing', categories: ['manga', 'drama'], rating: 4.5 },
            { id: 'mfg3', name: 'FantasyWear', categories: ['movie', 'anime'], rating: 4.8 }
        ];

        const recommendations = manufacturers.map(manufacturer => ({
            manufacturerId: manufacturer.id,
            name: manufacturer.name,
            score: manufacturer.rating * (manufacturerScores.get(manufacturer.name) || 0.5),
            method: 'purchase-history'
        }));

        return recommendations
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
    }

    // 유사한 사용자 찾기
    findSimilarUsers(userId, limit = 10) {
        const userProfile = this.userProfiles.get(userId);
        if (!userProfile) {
            return [];
        }

        const similarities = [];

        for (const [otherUserId, otherProfile] of this.userProfiles) {
            if (otherUserId === userId) continue;

            const similarity = this.calculateUserSimilarity(userProfile, otherProfile);
            if (similarity > 0.1) {
                similarities.push({
                    userId: otherUserId,
                    similarity
                });
            }
        }

        return similarities
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, limit);
    }

    // 사용자 유사도 계산
    calculateUserSimilarity(profile1, profile2) {
        const preferences1 = new Set(profile1.preferences || []);
        const preferences2 = new Set(profile2.preferences || []);

        const intersection = new Set([...preferences1].filter(x => preferences2.has(x)));
        const union = new Set([...preferences1, ...preferences2]);

        const jaccardSimilarity = intersection.size / union.size;

        // 구매 이력 유사도
        const purchases1 = new Set((profile1.purchaseHistory || []).map(p => p.productId));
        const purchases2 = new Set((profile2.purchaseHistory || []).map(p => p.productId));

        const purchaseIntersection = new Set([...purchases1].filter(x => purchases2.has(x)));
        const purchaseUnion = new Set([...purchases1, ...purchases2]);

        const purchaseSimilarity = purchaseUnion.size > 0 ?
            purchaseIntersection.size / purchaseUnion.size : 0;

        // 가중 평균
        return jaccardSimilarity * 0.6 + purchaseSimilarity * 0.4;
    }

    // 콘텐츠 유사도 계산
    calculateContentSimilarity(userPreferences, productFeatures) {
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

        // 평점 선호도
        if (userPreferences.minRating && productFeatures.rating) {
            const ratingMatch = productFeatures.rating >= userPreferences.minRating;
            similarity += ratingMatch ? 0.1 : 0;
            totalWeight += 0.1;
        }

        return totalWeight > 0 ? similarity / totalWeight : 0;
    }

    // 사용자 선호도 추출
    extractUserPreferences(userProfile) {
        const preferences = {
            categories: [],
            tags: [],
            priceRange: [0, 1000],
            minRating: 0,
            brands: [],
            styles: []
        };

        // 구매 이력에서 선호도 분석
        const purchases = userProfile.purchaseHistory || [];
        const categories = new Map();
        const tags = new Map();
        const prices = [];
        const ratings = [];
        const brands = new Map();

        purchases.forEach(purchase => {
            if (purchase.category) {
                categories.set(purchase.category, (categories.get(purchase.category) || 0) + 1);
            }
            if (purchase.tags) {
                purchase.tags.forEach(tag => {
                    tags.set(tag, (tags.get(tag) || 0) + 1);
                });
            }
            if (purchase.price) {
                prices.push(purchase.price);
            }
            if (purchase.rating) {
                ratings.push(purchase.rating);
            }
            if (purchase.brand) {
                brands.set(purchase.brand, (brands.get(purchase.brand) || 0) + 1);
            }
        });

        // 가장 많이 구매한 카테고리들
        preferences.categories = Array.from(categories.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([category]) => category);

        // 가장 많이 구매한 태그들
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

        // 최소 평점 (평균 평점의 80%)
        if (ratings.length > 0) {
            const avgRating = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
            preferences.minRating = avgRating * 0.8;
        }

        // 선호 브랜드들
        preferences.brands = Array.from(brands.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([brand]) => brand);

        return preferences;
    }

    // 트렌딩 제품 계산
    calculateTrendingProducts() {
        const trending = [];
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        // 최근 1주일간의 상호작용 분석
        for (const [userId, interactions] of this.interactionHistory) {
            interactions.forEach(interaction => {
                const interactionTime = new Date(interaction.timestamp);
                if (interactionTime >= oneWeekAgo) {
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
            .slice(0, 20);
    }

    // 상호작용 가중치
    getInteractionWeight(interactionType) {
        const weights = {
            'purchase': 10,
            'like': 3,
            'share': 2,
            'view': 1,
            'review': 5
        };
        return weights[interactionType] || 1;
    }

    // 제품 인기도 계산
    calculatePopularity(product) {
        const views = product.views || 0;
        const sales = product.sales || 0;
        const rating = product.rating || 0;
        const reviewCount = product.reviewCount || 0;

        // 가중 평균으로 인기도 계산
        return (views * 0.1) + (sales * 10) + (rating * 2) + (reviewCount * 0.5);
    }

    // 스타일 특성 추출
    extractStyleFeatures(product) {
        // 제품명과 설명에서 스타일 키워드 추출
        const styleKeywords = ['cute', 'cool', 'elegant', 'casual', 'formal', 'sexy', 'innocent'];
        const text = `${product.name} ${product.description}`.toLowerCase();

        return styleKeywords.filter(keyword => text.includes(keyword));
    }

    // 색상 특성 추출
    extractColorFeatures(product) {
        const colorKeywords = ['red', 'blue', 'green', 'yellow', 'pink', 'purple', 'black', 'white'];
        const text = `${product.name} ${product.description}`.toLowerCase();

        return colorKeywords.filter(color => text.includes(color));
    }

    // 계절 결정
    determineSeason(product) {
        const seasonalKeywords = {
            spring: ['spring', 'cherry', 'blossom', 'pastel'],
            summer: ['summer', 'beach', 'swim', 'light'],
            autumn: ['autumn', 'fall', 'warm', 'brown'],
            winter: ['winter', 'snow', 'warm', 'dark']
        };

        const text = `${product.name} ${product.description}`.toLowerCase();

        for (const [season, keywords] of Object.entries(seasonalKeywords)) {
            if (keywords.some(keyword => text.includes(keyword))) {
                return season;
            }
        }

        return 'all-season';
    }

    // 용도 결정
    determineOccasion(product) {
        const occasionKeywords = {
            cosplay: ['cosplay', 'costume', 'character'],
            party: ['party', 'event', 'celebration'],
            daily: ['daily', 'casual', 'everyday'],
            performance: ['performance', 'stage', 'show']
        };

        const text = `${product.name} ${product.description}`.toLowerCase();

        for (const [occasion, keywords] of Object.entries(occasionKeywords)) {
            if (keywords.some(keyword => text.includes(keyword))) {
                return occasion;
            }
        }

        return 'general';
    }

    // 복잡도 계산
    calculateComplexity(product) {
        const complexityKeywords = {
            simple: ['simple', 'basic', 'easy'],
            medium: ['medium', 'moderate', 'standard'],
            complex: ['complex', 'detailed', 'intricate', 'advanced']
        };

        const text = `${product.name} ${product.description}`.toLowerCase();

        for (const [level, keywords] of Object.entries(complexityKeywords)) {
            if (keywords.some(keyword => text.includes(keyword))) {
                return level;
            }
        }

        return 'medium';
    }

    // 사용자 프로필을 상호작용으로부터 업데이트
    updateUserProfileFromInteraction(userId, interaction) {
        const profile = this.userProfiles.get(userId);
        if (!profile) return;

        switch (interaction.type) {
            case 'view':
                if (!profile.viewHistory) profile.viewHistory = [];
                profile.viewHistory.push(interaction.productId);
                break;
            case 'purchase':
                if (!profile.purchaseHistory) profile.purchaseHistory = [];
                profile.purchaseHistory.push({
                    productId: interaction.productId,
                    timestamp: interaction.timestamp,
                    ...interaction.metadata
                });
                break;
            case 'like':
                if (!profile.preferences) profile.preferences = [];
                // 제품의 카테고리나 태그를 선호도에 추가
                const productFeatures = this.productFeatures.get(interaction.productId);
                if (productFeatures) {
                    if (productFeatures.category && !profile.preferences.includes(productFeatures.category)) {
                        profile.preferences.push(productFeatures.category);
                    }
                }
                break;
        }

        profile.lastUpdated = new Date().toISOString();
        this.userProfiles.set(userId, profile);
    }
}

module.exports = new CosplayRecommendationService();
