const express = require('express');
const router = express.Router();
const RecommendationEngine = require('../../services/recommendationEngine');
const logger = require('../../utils/logger');

const recommendationEngine = new RecommendationEngine();

// 추천 엔진 초기화
let isInitialized = false;

const initializeEngine = async () => {
    if (isInitialized) return;

    try {
        // 샘플 데이터로 추천 엔진 초기화
        await loadSampleData();
        isInitialized = true;
        logger.info('추천 엔진 초기화 완료');
    } catch (error) {
        logger.error('추천 엔진 초기화 오류:', error);
    }
};

// 샘플 데이터 로드
const loadSampleData = async () => {
    // 샘플 콘텐츠 특성 데이터
    const sampleContent = [
        {
            contentId: 'content_1',
            title: 'React 고급 패턴',
            category: 'programming',
            tags: ['react', 'javascript', 'frontend'],
            qualityScore: 0.9,
            popularityScore: 0.8,
            createdAt: new Date('2024-01-15')
        },
        {
            contentId: 'content_2',
            title: 'Node.js 성능 최적화',
            category: 'programming',
            tags: ['nodejs', 'backend', 'performance'],
            qualityScore: 0.85,
            popularityScore: 0.7,
            createdAt: new Date('2024-01-20')
        },
        {
            contentId: 'content_3',
            title: 'UI/UX 디자인 원칙',
            category: 'design',
            tags: ['ui', 'ux', 'design'],
            qualityScore: 0.88,
            popularityScore: 0.9,
            createdAt: new Date('2024-01-25')
        },
        {
            contentId: 'content_4',
            title: '데이터베이스 설계',
            category: 'programming',
            tags: ['database', 'sql', 'backend'],
            qualityScore: 0.82,
            popularityScore: 0.6,
            createdAt: new Date('2024-01-30')
        },
        {
            contentId: 'content_5',
            title: '모바일 앱 개발',
            category: 'mobile',
            tags: ['mobile', 'app', 'development'],
            qualityScore: 0.87,
            popularityScore: 0.75,
            createdAt: new Date('2024-02-01')
        }
    ];

    // 콘텐츠 특성 업데이트
    for (const content of sampleContent) {
        await recommendationEngine.updateContentFeatures(content.contentId, content);
    }

    // 샘플 사용자 상호작용 데이터
    const sampleInteractions = [
        {
            userId: 'user_1',
            interactions: [
                { type: 'view', contentId: 'content_1', contentType: 'programming', timestamp: new Date('2024-01-16'), rating: 5 },
                { type: 'like', contentId: 'content_3', contentType: 'design', timestamp: new Date('2024-01-26'), rating: 4 },
                { type: 'save', contentId: 'content_5', contentType: 'mobile', timestamp: new Date('2024-02-02'), rating: 5 }
            ]
        },
        {
            userId: 'user_2',
            interactions: [
                { type: 'view', contentId: 'content_2', contentType: 'programming', timestamp: new Date('2024-01-21'), rating: 4 },
                { type: 'comment', contentId: 'content_4', contentType: 'programming', timestamp: new Date('2024-01-31'), rating: 3 },
                { type: 'share', contentId: 'content_1', contentType: 'programming', timestamp: new Date('2024-01-17'), rating: 5 }
            ]
        }
    ];

    // 사용자 프로필 생성
    for (const userData of sampleInteractions) {
        await recommendationEngine.buildUserProfile(userData.userId, userData.interactions);
    }
};

// 추천 요청
router.post('/', async (req, res) => {
    try {
        await initializeEngine();

        const {
            userId,
            limit = 10,
            categories = [],
            excludeSeen = true,
            includeContentBased = true,
            includeCollaborative = true,
            includePopularity = true,
            includeRecency = true
        } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: '사용자 ID가 필요합니다.'
            });
        }

        const recommendations = await recommendationEngine.getRecommendations(userId, {
            limit,
            categories,
            excludeSeen,
            includeContentBased,
            includeCollaborative,
            includePopularity,
            includeRecency
        });

        logger.info(`사용자 ${userId}에게 ${recommendations.length}개 추천 제공`);

        res.json({
            success: true,
            data: {
                recommendations,
                userId,
                timestamp: new Date().toISOString(),
                totalCount: recommendations.length
            }
        });
    } catch (error) {
        logger.error('추천 요청 오류:', error);
        res.status(500).json({
            success: false,
            message: '추천 생성 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 콘텐츠 기반 추천
router.post('/content-based', async (req, res) => {
    try {
        await initializeEngine();

        const { userId, limit = 10 } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: '사용자 ID가 필요합니다.'
            });
        }

        const recommendations = await recommendationEngine.getContentBasedRecommendations(userId, limit);

        res.json({
            success: true,
            data: {
                recommendations,
                type: 'content_based',
                userId,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        logger.error('콘텐츠 기반 추천 오류:', error);
        res.status(500).json({
            success: false,
            message: '콘텐츠 기반 추천 생성 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 협업 필터링 추천
router.post('/collaborative', async (req, res) => {
    try {
        await initializeEngine();

        const { userId, limit = 10 } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: '사용자 ID가 필요합니다.'
            });
        }

        const recommendations = await recommendationEngine.getCollaborativeRecommendations(userId, limit);

        res.json({
            success: true,
            data: {
                recommendations,
                type: 'collaborative',
                userId,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        logger.error('협업 필터링 추천 오류:', error);
        res.status(500).json({
            success: false,
            message: '협업 필터링 추천 생성 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 인기도 기반 추천
router.post('/popularity', async (req, res) => {
    try {
        await initializeEngine();

        const { userId, limit = 10 } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: '사용자 ID가 필요합니다.'
            });
        }

        const recommendations = await recommendationEngine.getPopularityRecommendations(userId, limit);

        res.json({
            success: true,
            data: {
                recommendations,
                type: 'popularity',
                userId,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        logger.error('인기도 기반 추천 오류:', error);
        res.status(500).json({
            success: false,
            message: '인기도 기반 추천 생성 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 사용자 상호작용 기록
router.post('/interaction', async (req, res) => {
    try {
        await initializeEngine();

        const {
            userId,
            type,
            contentId,
            contentType,
            rating,
            duration,
            metadata = {}
        } = req.body;

        if (!userId || !type || !contentId) {
            return res.status(400).json({
                success: false,
                message: '필수 필드가 누락되었습니다.'
            });
        }

        const interaction = {
            type,
            contentId,
            contentType,
            timestamp: new Date(),
            rating,
            duration,
            metadata
        };

        // 사용자 프로필 업데이트
        const userProfile = recommendationEngine.userProfiles.get(userId);
        if (userProfile) {
            await recommendationEngine.analyzeInteraction(userProfile, interaction);
        } else {
            // 새 사용자 프로필 생성
            await recommendationEngine.buildUserProfile(userId, [interaction]);
        }

        logger.info(`사용자 ${userId} 상호작용 기록: ${type} - ${contentId}`);

        res.json({
            success: true,
            message: '상호작용이 기록되었습니다.',
            data: {
                userId,
                interaction,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        logger.error('상호작용 기록 오류:', error);
        res.status(500).json({
            success: false,
            message: '상호작용 기록 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 사용자 프로필 조회
router.get('/profile/:userId', async (req, res) => {
    try {
        await initializeEngine();

        const { userId } = req.params;
        const userProfile = recommendationEngine.userProfiles.get(userId);

        if (!userProfile) {
            return res.status(404).json({
                success: false,
                message: '사용자 프로필을 찾을 수 없습니다.'
            });
        }

        res.json({
            success: true,
            data: {
                userId,
                profile: {
                    interests: Array.from(userProfile.interests),
                    preferences: userProfile.preferences,
                    behaviorPatterns: userProfile.behaviorPatterns,
                    activityLevel: userProfile.activityLevel,
                    engagementScore: userProfile.engagementScore,
                    lastUpdated: userProfile.lastUpdated
                }
            }
        });
    } catch (error) {
        logger.error('사용자 프로필 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '사용자 프로필 조회 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 콘텐츠 특성 업데이트
router.put('/content/:contentId', async (req, res) => {
    try {
        await initializeEngine();

        const { contentId } = req.params;
        const features = req.body;

        await recommendationEngine.updateContentFeatures(contentId, features);

        logger.info(`콘텐츠 ${contentId} 특성 업데이트 완료`);

        res.json({
            success: true,
            message: '콘텐츠 특성이 업데이트되었습니다.',
            data: {
                contentId,
                features,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        logger.error('콘텐츠 특성 업데이트 오류:', error);
        res.status(500).json({
            success: false,
            message: '콘텐츠 특성 업데이트 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 추천 성능 평가
router.post('/evaluate', async (req, res) => {
    try {
        await initializeEngine();

        const { userId, recommendations, actualInteractions } = req.body;

        if (!userId || !recommendations || !actualInteractions) {
            return res.status(400).json({
                success: false,
                message: '필수 필드가 누락되었습니다.'
            });
        }

        const metrics = await recommendationEngine.evaluateRecommendations(
            userId,
            recommendations,
            actualInteractions
        );

        res.json({
            success: true,
            data: {
                metrics,
                userId,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        logger.error('추천 성능 평가 오류:', error);
        res.status(500).json({
            success: false,
            message: '추천 성능 평가 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 추천 모델 가중치 업데이트
router.put('/weights', async (req, res) => {
    try {
        const { weights } = req.body;

        if (!weights) {
            return res.status(400).json({
                success: false,
                message: '가중치 데이터가 필요합니다.'
            });
        }

        recommendationEngine.updateModelWeights(weights);

        logger.info('추천 모델 가중치 업데이트 완료');

        res.json({
            success: true,
            message: '모델 가중치가 업데이트되었습니다.',
            data: {
                weights: recommendationEngine.modelWeights,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        logger.error('모델 가중치 업데이트 오류:', error);
        res.status(500).json({
            success: false,
            message: '모델 가중치 업데이트 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 추천 통계 조회
router.get('/stats', async (req, res) => {
    try {
        await initializeEngine();

        const stats = {
            totalUsers: recommendationEngine.userProfiles.size,
            totalContent: recommendationEngine.contentFeatures.size,
            modelWeights: recommendationEngine.modelWeights,
            lastUpdated: new Date().toISOString()
        };

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        logger.error('추천 통계 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '추천 통계 조회 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

module.exports = router;
