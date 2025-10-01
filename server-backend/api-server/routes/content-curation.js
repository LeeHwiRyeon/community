const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// 큐레이션 스키마
const curationSchema = {
    id: String,
    type: String, // 'trending', 'recommended', 'featured', 'personalized', 'category'
    title: String,
    description: String,
    contentIds: [String],
    criteria: {
        algorithm: String, // 'popularity', 'recency', 'engagement', 'collaborative', 'content_based'
        filters: Object,
        weights: Object,
        thresholds: Object
    },
    metadata: {
        totalItems: Number,
        lastUpdated: Date,
        accuracy: Number,
        userSatisfaction: Number
    },
    status: String, // 'active', 'inactive', 'testing'
    createdAt: Date,
    updatedAt: Date,
    createdBy: String
};

// 추천 알고리즘 클래스
class RecommendationEngine {
    constructor() {
        this.userProfiles = new Map();
        this.contentFeatures = new Map();
        this.interactionHistory = new Map();
    }

    // 협업 필터링 추천
    collaborativeFiltering(userId, limit = 10) {
        const userInteractions = this.interactionHistory.get(userId) || [];
        const similarUsers = this.findSimilarUsers(userId);

        const recommendations = [];
        for (const similarUser of similarUsers) {
            const similarUserInteractions = this.interactionHistory.get(similarUser.userId) || [];
            for (const interaction of similarUserInteractions) {
                if (!userInteractions.some(i => i.contentId === interaction.contentId)) {
                    recommendations.push({
                        contentId: interaction.contentId,
                        score: interaction.score * similarUser.similarity,
                        reason: 'similar_users'
                    });
                }
            }
        }

        return recommendations
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
    }

    // 콘텐츠 기반 추천
    contentBasedFiltering(userId, limit = 10) {
        const userProfile = this.userProfiles.get(userId);
        if (!userProfile) return [];

        const userPreferences = userProfile.preferences || {};
        const recommendations = [];

        for (const [contentId, features] of this.contentFeatures) {
            const score = this.calculateContentScore(features, userPreferences);
            if (score > 0.5) {
                recommendations.push({
                    contentId,
                    score,
                    reason: 'content_similarity'
                });
            }
        }

        return recommendations
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
    }

    // 하이브리드 추천
    hybridRecommendation(userId, limit = 10) {
        const collaborative = this.collaborativeFiltering(userId, limit);
        const contentBased = this.contentBasedFiltering(userId, limit);

        const combined = new Map();

        // 협업 필터링 결과 추가
        collaborative.forEach(rec => {
            combined.set(rec.contentId, {
                contentId: rec.contentId,
                collaborativeScore: rec.score,
                contentBasedScore: 0,
                reason: rec.reason
            });
        });

        // 콘텐츠 기반 결과 추가/업데이트
        contentBased.forEach(rec => {
            if (combined.has(rec.contentId)) {
                combined.get(rec.contentId).contentBasedScore = rec.score;
            } else {
                combined.set(rec.contentId, {
                    contentId: rec.contentId,
                    collaborativeScore: 0,
                    contentBasedScore: rec.score,
                    reason: rec.reason
                });
            }
        });

        // 가중 평균으로 최종 점수 계산
        const finalRecommendations = Array.from(combined.values()).map(rec => ({
            contentId: rec.contentId,
            score: (rec.collaborativeScore * 0.6) + (rec.contentBasedScore * 0.4),
            reason: 'hybrid'
        }));

        return finalRecommendations
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
    }

    // 유사 사용자 찾기
    findSimilarUsers(userId, limit = 5) {
        const userInteractions = this.interactionHistory.get(userId) || [];
        const similarities = [];

        for (const [otherUserId, otherInteractions] of this.interactionHistory) {
            if (otherUserId === userId) continue;

            const similarity = this.calculateUserSimilarity(userInteractions, otherInteractions);
            if (similarity > 0.3) {
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

    // 사용자 유사도 계산 (코사인 유사도)
    calculateUserSimilarity(userInteractions, otherInteractions) {
        const userItems = new Set(userInteractions.map(i => i.contentId));
        const otherItems = new Set(otherInteractions.map(i => i.contentId));

        const intersection = new Set([...userItems].filter(x => otherItems.has(x)));
        const union = new Set([...userItems, ...otherItems]);

        return intersection.size / union.size;
    }

    // 콘텐츠 점수 계산
    calculateContentScore(contentFeatures, userPreferences) {
        let score = 0;
        let totalWeight = 0;

        for (const [feature, value] of Object.entries(contentFeatures)) {
            const weight = userPreferences[feature] || 0;
            score += value * weight;
            totalWeight += weight;
        }

        return totalWeight > 0 ? score / totalWeight : 0;
    }
}

// 트렌드 분석 클래스
class TrendAnalyzer {
    constructor() {
        this.trendData = new Map();
    }

    // 트렌드 분석
    analyzeTrends(timeframe = '7d') {
        const trends = {
            hashtags: this.analyzeHashtagTrends(timeframe),
            categories: this.analyzeCategoryTrends(timeframe),
            contentTypes: this.analyzeContentTypeTrends(timeframe),
            engagement: this.analyzeEngagementTrends(timeframe),
            users: this.analyzeUserTrends(timeframe)
        };

        return trends;
    }

    // 해시태그 트렌드 분석
    analyzeHashtagTrends(timeframe) {
        // 실제로는 데이터베이스에서 분석
        return [
            { tag: '#ai', count: 1250, growth: 15.2, trend: 'up' },
            { tag: '#blockchain', count: 980, growth: 8.7, trend: 'up' },
            { tag: '#web3', count: 750, growth: -2.1, trend: 'down' },
            { tag: '#machinelearning', count: 650, growth: 12.5, trend: 'up' },
            { tag: '#crypto', count: 580, growth: -5.3, trend: 'down' }
        ];
    }

    // 카테고리 트렌드 분석
    analyzeCategoryTrends(timeframe) {
        return [
            { category: 'technology', count: 3200, growth: 18.5, trend: 'up' },
            { category: 'business', count: 2800, growth: 12.3, trend: 'up' },
            { category: 'lifestyle', count: 2100, growth: 5.7, trend: 'up' },
            { category: 'entertainment', count: 1900, growth: -3.2, trend: 'down' },
            { category: 'education', count: 1500, growth: 8.9, trend: 'up' }
        ];
    }

    // 콘텐츠 타입 트렌드 분석
    analyzeContentTypeTrends(timeframe) {
        return [
            { type: 'video', count: 4500, growth: 25.3, trend: 'up' },
            { type: 'image', count: 3800, growth: 15.7, trend: 'up' },
            { type: 'text', count: 3200, growth: 8.2, trend: 'up' },
            { type: 'audio', count: 1200, growth: 22.1, trend: 'up' },
            { type: 'live', count: 800, growth: 35.6, trend: 'up' }
        ];
    }

    // 참여도 트렌드 분석
    analyzeEngagementTrends(timeframe) {
        return {
            averageLikes: 45.2,
            averageComments: 12.8,
            averageShares: 8.5,
            averageViews: 1250.3,
            engagementRate: 0.067,
            growth: 12.5
        };
    }

    // 사용자 트렌드 분석
    analyzeUserTrends(timeframe) {
        return {
            newUsers: 1250,
            activeUsers: 8500,
            returningUsers: 4200,
            userGrowth: 15.8,
            retentionRate: 0.68
        };
    }
}

// 임시 저장소
let curationStore = new Map();
let curationIdCounter = 1;
const recommendationEngine = new RecommendationEngine();
const trendAnalyzer = new TrendAnalyzer();

// 미들웨어: 인증 확인
const authenticateUser = (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ success: false, message: '인증이 필요합니다.' });
    }
    req.user = { id: 'user1', role: 'admin' };
    next();
};

// 추천 컨텐츠 조회
router.get('/recommendations/:userId', authenticateUser, async (req, res) => {
    try {
        const { userId } = req.params;
        const { type = 'hybrid', limit = 10, algorithm } = req.query;

        let recommendations = [];

        switch (type) {
            case 'collaborative':
                recommendations = recommendationEngine.collaborativeFiltering(userId, parseInt(limit));
                break;
            case 'content_based':
                recommendations = recommendationEngine.contentBasedFiltering(userId, parseInt(limit));
                break;
            case 'hybrid':
            default:
                recommendations = recommendationEngine.hybridRecommendation(userId, parseInt(limit));
                break;
        }

        res.json({
            success: true,
            data: {
                recommendations,
                algorithm: type,
                userId,
                generatedAt: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('추천 컨텐츠 조회 오류:', error);
        res.status(500).json({ success: false, message: '추천 컨텐츠 조회 중 오류가 발생했습니다.' });
    }
});

// 트렌드 분석 조회
router.get('/trends', authenticateUser, async (req, res) => {
    try {
        const { timeframe = '7d' } = req.query;

        const trends = trendAnalyzer.analyzeTrends(timeframe);

        res.json({
            success: true,
            data: {
                trends,
                timeframe,
                analyzedAt: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('트렌드 분석 조회 오류:', error);
        res.status(500).json({ success: false, message: '트렌드 분석 조회 중 오류가 발생했습니다.' });
    }
});

// 인기 컨텐츠 조회
router.get('/popular', authenticateUser, async (req, res) => {
    try {
        const {
            timeframe = '7d',
            category,
            contentType,
            limit = 20,
            sortBy = 'engagement'
        } = req.query;

        // 실제로는 데이터베이스에서 조회
        const popularContent = [
            {
                id: 'content_1',
                title: 'AI의 미래와 영향',
                type: 'article',
                category: 'technology',
                engagement: {
                    likes: 1250,
                    comments: 89,
                    shares: 156,
                    views: 12500
                },
                author: 'AI Expert',
                createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                trendingScore: 95.5
            },
            {
                id: 'content_2',
                title: '블록체인 기술의 실제 활용 사례',
                type: 'video',
                category: 'technology',
                engagement: {
                    likes: 980,
                    comments: 67,
                    shares: 134,
                    views: 8900
                },
                author: 'Blockchain Dev',
                createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
                trendingScore: 92.3
            }
        ];

        res.json({
            success: true,
            data: {
                content: popularContent,
                timeframe,
                total: popularContent.length,
                generatedAt: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('인기 컨텐츠 조회 오류:', error);
        res.status(500).json({ success: false, message: '인기 컨텐츠 조회 중 오류가 발생했습니다.' });
    }
});

// 큐레이션 생성
router.post('/curations', authenticateUser, async (req, res) => {
    try {
        const {
            type,
            title,
            description,
            criteria,
            contentIds = []
        } = req.body;

        if (!type || !title) {
            return res.status(400).json({
                success: false,
                message: '타입과 제목은 필수입니다.'
            });
        }

        const curation = {
            id: `curation_${curationIdCounter++}`,
            type,
            title,
            description,
            contentIds,
            criteria: {
                algorithm: 'popularity',
                filters: {},
                weights: {},
                thresholds: {},
                ...criteria
            },
            metadata: {
                totalItems: contentIds.length,
                lastUpdated: new Date(),
                accuracy: 0,
                userSatisfaction: 0
            },
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: req.user.id
        };

        curationStore.set(curation.id, curation);

        res.status(201).json({
            success: true,
            message: '큐레이션이 생성되었습니다.',
            data: curation
        });
    } catch (error) {
        console.error('큐레이션 생성 오류:', error);
        res.status(500).json({
            success: false,
            message: '큐레이션 생성 중 오류가 발생했습니다.'
        });
    }
});

// 큐레이션 목록 조회
router.get('/curations', authenticateUser, async (req, res) => {
    try {
        const { type, status = 'active', page = 1, limit = 20 } = req.query;

        let curations = Array.from(curationStore.values());

        if (type) curations = curations.filter(c => c.type === type);
        if (status) curations = curations.filter(c => c.status === status);

        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + parseInt(limit);
        const paginatedCurations = curations.slice(startIndex, endIndex);

        res.json({
            success: true,
            data: {
                curations: paginatedCurations,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: curations.length,
                    pages: Math.ceil(curations.length / limit)
                }
            }
        });
    } catch (error) {
        console.error('큐레이션 목록 조회 오류:', error);
        res.status(500).json({ success: false, message: '큐레이션 목록 조회 중 오류가 발생했습니다.' });
    }
});

// 큐레이션 업데이트
router.put('/curations/:id', authenticateUser, async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const curation = curationStore.get(id);
        if (!curation) {
            return res.status(404).json({ success: false, message: '큐레이션을 찾을 수 없습니다.' });
        }

        const updatedCuration = {
            ...curation,
            ...updates,
            id: curation.id,
            createdAt: curation.createdAt,
            updatedAt: new Date()
        };

        curationStore.set(id, updatedCuration);

        res.json({
            success: true,
            message: '큐레이션이 업데이트되었습니다.',
            data: updatedCuration
        });
    } catch (error) {
        console.error('큐레이션 업데이트 오류:', error);
        res.status(500).json({ success: false, message: '큐레이션 업데이트 중 오류가 발생했습니다.' });
    }
});

// 큐레이션 성능 분석
router.get('/curations/:id/analytics', authenticateUser, async (req, res) => {
    try {
        const { id } = req.params;
        const curation = curationStore.get(id);

        if (!curation) {
            return res.status(404).json({ success: false, message: '큐레이션을 찾을 수 없습니다.' });
        }

        const analytics = {
            performance: {
                clickThroughRate: 0.15,
                engagementRate: 0.23,
                conversionRate: 0.08,
                userSatisfaction: 4.2
            },
            demographics: {
                ageGroups: { '18-24': 25, '25-34': 35, '35-44': 28, '45+': 12 },
                genders: { male: 55, female: 42, other: 3 },
                locations: { 'US': 40, 'EU': 30, 'Asia': 25, 'Other': 5 }
            },
            content: {
                mostPopular: curation.contentIds.slice(0, 5),
                leastPopular: curation.contentIds.slice(-3),
                averageEngagement: 0.18
            },
            trends: {
                dailyViews: [120, 135, 98, 156, 189, 201, 178],
                weeklyGrowth: 12.5,
                monthlyGrowth: 45.2
            }
        };

        res.json({
            success: true,
            data: analytics
        });
    } catch (error) {
        console.error('큐레이션 분석 조회 오류:', error);
        res.status(500).json({ success: false, message: '큐레이션 분석 조회 중 오류가 발생했습니다.' });
    }
});

module.exports = router;
