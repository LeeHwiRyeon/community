/**
 * 🚀 향상된 컨텐츠 API 라우터
 * 
 * AI 기반 컨텐츠 분석, 개인화 추천, 실시간 기능을 제공하는
 * 차세대 컨텐츠 API 엔드포인트
 * 
 * @author AUTOAGENTS Manager
 * @version 2.0.0
 * @created 2025-10-02
 */

const express = require('express');
const router = express.Router();
const EnhancedContentService = require('../services/enhanced-content-service');

// 서비스 인스턴스 생성
const contentService = new EnhancedContentService();

// 미들웨어: 요청 로깅
router.use((req, res, next) => {
    console.log(`📡 Enhanced Content API: ${req.method} ${req.path}`, {
        timestamp: new Date().toISOString(),
        ip: req.ip,
        userAgent: req.get('User-Agent')
    });
    next();
});

// 미들웨어: 에러 핸들링
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// 미들웨어: 사용자 인증 (간단화)
const authenticateUser = (req, res, next) => {
    // 실제로는 JWT 토큰 검증
    const userId = req.headers['x-user-id'] || req.query.userId || 'anonymous';
    req.user = { id: userId };
    next();
};

/**
 * 📊 컨텐츠 분석 API
 */

// POST /api/enhanced-content/analyze
// 컨텐츠 AI 분석
router.post('/analyze', asyncHandler(async (req, res) => {
    const { content } = req.body;

    if (!content || !content.title || !content.content) {
        return res.status(400).json({
            success: false,
            error: '컨텐츠 제목과 내용이 필요합니다.',
            required_fields: ['title', 'content']
        });
    }

    try {
        const analysis = await contentService.analyzeContent(content);

        res.json({
            success: true,
            data: analysis,
            metadata: {
                analysis_version: '2.0.0',
                processing_time: analysis.processing_time,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: '컨텐츠 분석 중 오류가 발생했습니다.',
            details: error.message
        });
    }
}));

// GET /api/enhanced-content/analysis/:contentId
// 기존 분석 결과 조회
router.get('/analysis/:contentId', asyncHandler(async (req, res) => {
    const { contentId } = req.params;

    try {
        const analysis = contentService.contentCache.get(contentId);

        if (!analysis) {
            return res.status(404).json({
                success: false,
                error: '분석 결과를 찾을 수 없습니다.',
                content_id: contentId
            });
        }

        res.json({
            success: true,
            data: analysis,
            metadata: {
                cached: true,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: '분석 결과 조회 중 오류가 발생했습니다.',
            details: error.message
        });
    }
}));

/**
 * 🎯 개인화 추천 API
 */

// GET /api/enhanced-content/recommendations
// 개인화 추천 컨텐츠
router.get('/recommendations', authenticateUser, asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const {
        limit = 20,
        categories,
        excludeViewed = 'true',
        minQualityScore = 0.5
    } = req.query;

    try {
        const options = {
            limit: parseInt(limit),
            categories: categories ? categories.split(',') : [],
            excludeViewed: excludeViewed === 'true',
            minQualityScore: parseFloat(minQualityScore)
        };

        const recommendations = await contentService.generatePersonalizedRecommendations(userId, options);

        res.json({
            success: true,
            data: recommendations,
            metadata: {
                user_id: userId,
                algorithm: 'ai_personalized',
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: '개인화 추천 생성 중 오류가 발생했습니다.',
            details: error.message
        });
    }
}));

// POST /api/enhanced-content/recommendations/feedback
// 추천 피드백 수집
router.post('/recommendations/feedback', authenticateUser, asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { contentId, feedback, rating } = req.body;

    if (!contentId || !feedback) {
        return res.status(400).json({
            success: false,
            error: '컨텐츠 ID와 피드백이 필요합니다.',
            required_fields: ['contentId', 'feedback']
        });
    }

    try {
        // 피드백 저장 로직 (실제로는 데이터베이스에 저장)
        const feedbackData = {
            user_id: userId,
            content_id: contentId,
            feedback: feedback, // 'like', 'dislike', 'not_interested', 'inappropriate'
            rating: rating || null,
            timestamp: new Date().toISOString()
        };

        // 사용자 프로필 업데이트
        await contentService.updateUserProfile(userId, {
            type: 'feedback',
            contentId,
            feedback,
            rating
        });

        res.json({
            success: true,
            message: '피드백이 성공적으로 저장되었습니다.',
            data: feedbackData
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: '피드백 저장 중 오류가 발생했습니다.',
            details: error.message
        });
    }
}));

/**
 * 📈 트렌드 분석 API
 */

// GET /api/enhanced-content/trending
// 실시간 트렌딩 컨텐츠
router.get('/trending', asyncHandler(async (req, res) => {
    const { timeWindow = 24, category, limit = 10 } = req.query;

    try {
        const trendAnalysis = await contentService.analyzeTrendingContent(parseInt(timeWindow));

        let trends = trendAnalysis.trends;

        // 카테고리 필터링
        if (category) {
            trends = trends.filter(trend => trend.category === category);
        }

        // 결과 제한
        trends = trends.slice(0, parseInt(limit));

        res.json({
            success: true,
            data: {
                trends: trends,
                analysis_metadata: {
                    time_window: `${timeWindow}시간`,
                    total_categories: trendAnalysis.trends.length,
                    content_analyzed: trendAnalysis.total_content_analyzed,
                    generated_at: trendAnalysis.generated_at
                }
            },
            metadata: {
                algorithm: 'ai_trending',
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: '트렌드 분석 중 오류가 발생했습니다.',
            details: error.message
        });
    }
}));

// GET /api/enhanced-content/trending/topics
// 트렌딩 토픽 조회
router.get('/trending/topics', asyncHandler(async (req, res) => {
    try {
        const trendingTopics = Array.from(contentService.trendingTopics.entries())
            .map(([category, data]) => ({
                category,
                ...data
            }))
            .sort((a, b) => b.score - a.score);

        res.json({
            success: true,
            data: {
                topics: trendingTopics,
                total_topics: trendingTopics.length,
                last_updated: trendingTopics[0]?.last_updated || new Date().toISOString()
            },
            metadata: {
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: '트렌딩 토픽 조회 중 오류가 발생했습니다.',
            details: error.message
        });
    }
}));

/**
 * ⚡ 실시간 상호작용 API
 */

// POST /api/enhanced-content/engagement
// 컨텐츠 상호작용 기록
router.post('/engagement', authenticateUser, asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { contentId, type, metadata = {} } = req.body;

    if (!contentId || !type) {
        return res.status(400).json({
            success: false,
            error: '컨텐츠 ID와 상호작용 타입이 필요합니다.',
            required_fields: ['contentId', 'type'],
            valid_types: ['view', 'like', 'comment', 'share', 'bookmark']
        });
    }

    try {
        const engagementData = { type, userId, metadata };
        const updatedAnalytics = await contentService.updateContentEngagement(contentId, engagementData);

        res.json({
            success: true,
            message: '상호작용이 성공적으로 기록되었습니다.',
            data: {
                content_id: contentId,
                engagement_type: type,
                updated_analytics: {
                    views: updatedAnalytics.views,
                    likes: updatedAnalytics.likes,
                    comments: updatedAnalytics.comments,
                    shares: updatedAnalytics.shares,
                    bookmarks: updatedAnalytics.bookmarks
                },
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: '상호작용 기록 중 오류가 발생했습니다.',
            details: error.message
        });
    }
}));

// GET /api/enhanced-content/engagement/:contentId
// 컨텐츠 참여도 조회
router.get('/engagement/:contentId', asyncHandler(async (req, res) => {
    const { contentId } = req.params;
    const { includeHistory = 'false' } = req.query;

    try {
        const analytics = contentService.contentAnalytics.get(contentId);

        if (!analytics) {
            return res.status(404).json({
                success: false,
                error: '참여도 데이터를 찾을 수 없습니다.',
                content_id: contentId
            });
        }

        const responseData = {
            content_id: contentId,
            engagement_metrics: {
                views: analytics.views,
                likes: analytics.likes,
                comments: analytics.comments,
                shares: analytics.shares,
                bookmarks: analytics.bookmarks
            },
            realtime_metrics: {
                live_viewers: analytics.live_viewers || 0,
                viral_potential: analytics.viral_potential || 0
            },
            last_updated: analytics.last_updated
        };

        if (includeHistory === 'true') {
            responseData.engagement_history = analytics.engagement_history.slice(-20); // 최근 20개
        }

        res.json({
            success: true,
            data: responseData,
            metadata: {
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: '참여도 조회 중 오류가 발생했습니다.',
            details: error.message
        });
    }
}));

/**
 * 🔍 고급 검색 API
 */

// GET /api/enhanced-content/search
// AI 기반 컨텐츠 검색
router.get('/search', authenticateUser, asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const {
        q: query,
        sortBy = 'relevance',
        limit = 20,
        offset = 0,
        category,
        difficulty,
        minQualityScore,
        timeRange
    } = req.query;

    if (!query) {
        return res.status(400).json({
            success: false,
            error: '검색 쿼리가 필요합니다.',
            required_fields: ['q']
        });
    }

    try {
        const filters = {};
        if (category) filters.category = category;
        if (difficulty) filters.difficulty = difficulty;
        if (minQualityScore) filters.minQualityScore = parseFloat(minQualityScore);
        if (timeRange) filters.timeRange = timeRange;

        const options = {
            filters,
            sortBy,
            limit: parseInt(limit),
            offset: parseInt(offset),
            userId: userId !== 'anonymous' ? userId : null
        };

        const searchResults = await contentService.searchContent(query, options);

        res.json({
            success: true,
            data: searchResults,
            metadata: {
                algorithm: 'ai_search',
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: '검색 중 오류가 발생했습니다.',
            details: error.message
        });
    }
}));

// GET /api/enhanced-content/search/suggestions
// 검색 자동완성 및 제안
router.get('/search/suggestions', asyncHandler(async (req, res) => {
    const { q: query, limit = 10 } = req.query;

    if (!query || query.length < 2) {
        return res.json({
            success: true,
            data: {
                suggestions: [],
                trending_queries: ['AI', '개발', '커뮤니티', '리뷰', '게임']
            }
        });
    }

    try {
        // 간단한 자동완성 시뮬레이션
        const commonQueries = [
            'AI 개발', 'React 튜토리얼', '게임 리뷰', '커뮤니티 가이드',
            '프로그래밍 팁', '웹 개발', '모바일 앱', '데이터 분석',
            '머신러닝', '클라우드 서비스', 'UI/UX 디자인', '보안'
        ];

        const suggestions = commonQueries
            .filter(suggestion =>
                suggestion.toLowerCase().includes(query.toLowerCase())
            )
            .slice(0, parseInt(limit));

        res.json({
            success: true,
            data: {
                query: query,
                suggestions: suggestions,
                trending_queries: ['AI', '개발', '커뮤니티', '리뷰', '게임']
            },
            metadata: {
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: '검색 제안 생성 중 오류가 발생했습니다.',
            details: error.message
        });
    }
}));

/**
 * 📊 분석 및 통계 API
 */

// GET /api/enhanced-content/analytics/overview
// 전체 컨텐츠 분석 개요
router.get('/analytics/overview', asyncHandler(async (req, res) => {
    const { timeRange = 24 } = req.query;

    try {
        const analytics = {
            total_content: contentService.contentCache.size,
            total_analytics: contentService.contentAnalytics.size,
            active_users: contentService.userProfiles.size,
            trending_topics: contentService.trendingTopics.size,

            // 품질 분포
            quality_distribution: {
                excellent: 0,
                good: 0,
                average: 0,
                poor: 0
            },

            // 참여도 통계
            engagement_stats: {
                total_views: 0,
                total_likes: 0,
                total_comments: 0,
                total_shares: 0,
                avg_engagement_rate: 0
            },

            // 실시간 메트릭
            realtime_metrics: {
                active_viewers: 0,
                viral_content_count: 0,
                trending_score: 0
            }
        };

        // 통계 계산
        let totalEngagement = 0;
        let totalViews = 0;

        contentService.contentAnalytics.forEach(data => {
            analytics.engagement_stats.total_views += data.views || 0;
            analytics.engagement_stats.total_likes += data.likes || 0;
            analytics.engagement_stats.total_comments += data.comments || 0;
            analytics.engagement_stats.total_shares += data.shares || 0;

            analytics.realtime_metrics.active_viewers += data.live_viewers || 0;

            if (data.viral_potential > 0.7) {
                analytics.realtime_metrics.viral_content_count++;
            }

            totalViews += data.views || 0;
            totalEngagement += (data.likes || 0) + (data.comments || 0) + (data.shares || 0);
        });

        analytics.engagement_stats.avg_engagement_rate =
            totalViews > 0 ? (totalEngagement / totalViews) * 100 : 0;

        // 품질 분포 계산
        contentService.contentCache.forEach(analysis => {
            const score = analysis.quality_analysis?.overall_score || 0;
            if (score >= 0.8) analytics.quality_distribution.excellent++;
            else if (score >= 0.6) analytics.quality_distribution.good++;
            else if (score >= 0.4) analytics.quality_distribution.average++;
            else analytics.quality_distribution.poor++;
        });

        res.json({
            success: true,
            data: analytics,
            metadata: {
                time_range: `${timeRange}시간`,
                generated_at: new Date().toISOString(),
                cache_size: contentService.contentCache.size
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: '분석 개요 생성 중 오류가 발생했습니다.',
            details: error.message
        });
    }
}));

// GET /api/enhanced-content/analytics/user/:userId
// 사용자별 분석
router.get('/analytics/user/:userId', asyncHandler(async (req, res) => {
    const { userId } = req.params;

    try {
        const userProfile = await contentService.getUserProfile(userId);

        const userAnalytics = {
            user_id: userId,
            profile: {
                interests: userProfile.interests,
                personalization_score: userProfile.personalization_score,
                total_activities: userProfile.engagement_history?.length || 0
            },

            activity_summary: {
                views: 0,
                likes: 0,
                comments: 0,
                shares: 0,
                bookmarks: 0
            },

            content_preferences: {
                favorite_categories: [],
                preferred_difficulty: 'intermediate',
                avg_reading_time: 0
            },

            engagement_patterns: {
                most_active_time: '오후',
                preferred_content_types: ['기술', '개발'],
                interaction_frequency: 'high'
            }
        };

        // 활동 요약 계산
        if (userProfile.engagement_history) {
            userProfile.engagement_history.forEach(activity => {
                if (userAnalytics.activity_summary[activity.type] !== undefined) {
                    userAnalytics.activity_summary[activity.type]++;
                }
            });
        }

        res.json({
            success: true,
            data: userAnalytics,
            metadata: {
                generated_at: new Date().toISOString(),
                profile_last_updated: userProfile.last_updated || new Date().toISOString()
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: '사용자 분석 생성 중 오류가 발생했습니다.',
            details: error.message
        });
    }
}));

/**
 * 🛠️ 시스템 관리 API
 */

// GET /api/enhanced-content/health
// 서비스 상태 확인
router.get('/health', asyncHandler(async (req, res) => {
    const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '2.0.0',

        services: {
            content_analysis: 'operational',
            recommendation_engine: 'operational',
            trending_analysis: 'operational',
            realtime_updates: 'operational'
        },

        metrics: {
            cache_size: contentService.contentCache.size,
            analytics_size: contentService.contentAnalytics.size,
            user_profiles: contentService.userProfiles.size,
            trending_topics: contentService.trendingTopics.size
        },

        performance: {
            uptime: process.uptime(),
            memory_usage: process.memoryUsage(),
            cpu_usage: process.cpuUsage()
        }
    };

    res.json({
        success: true,
        data: health
    });
}));

// POST /api/enhanced-content/admin/cache/clear
// 캐시 초기화 (관리자 전용)
router.post('/admin/cache/clear', asyncHandler(async (req, res) => {
    const { type = 'all' } = req.body;

    try {
        let clearedItems = 0;

        switch (type) {
            case 'content':
                clearedItems = contentService.contentCache.size;
                contentService.contentCache.clear();
                break;
            case 'analytics':
                clearedItems = contentService.contentAnalytics.size;
                contentService.contentAnalytics.clear();
                break;
            case 'users':
                clearedItems = contentService.userProfiles.size;
                contentService.userProfiles.clear();
                break;
            case 'trending':
                clearedItems = contentService.trendingTopics.size;
                contentService.trendingTopics.clear();
                break;
            case 'all':
            default:
                clearedItems = contentService.contentCache.size +
                    contentService.contentAnalytics.size +
                    contentService.userProfiles.size +
                    contentService.trendingTopics.size;
                contentService.contentCache.clear();
                contentService.contentAnalytics.clear();
                contentService.userProfiles.clear();
                contentService.trendingTopics.clear();
                break;
        }

        res.json({
            success: true,
            message: `${type} 캐시가 성공적으로 초기화되었습니다.`,
            data: {
                cache_type: type,
                cleared_items: clearedItems,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: '캐시 초기화 중 오류가 발생했습니다.',
            details: error.message
        });
    }
}));

/**
 * 🚫 에러 핸들링 미들웨어
 */
router.use((error, req, res, next) => {
    console.error('Enhanced Content API Error:', error);

    res.status(500).json({
        success: false,
        error: '서버 내부 오류가 발생했습니다.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        timestamp: new Date().toISOString(),
        request_id: req.id || crypto.randomUUID()
    });
});

// 404 핸들러
router.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'API 엔드포인트를 찾을 수 없습니다.',
        path: req.originalUrl,
        method: req.method,
        available_endpoints: [
            'POST /analyze',
            'GET /analysis/:contentId',
            'GET /recommendations',
            'POST /recommendations/feedback',
            'GET /trending',
            'GET /trending/topics',
            'POST /engagement',
            'GET /engagement/:contentId',
            'GET /search',
            'GET /search/suggestions',
            'GET /analytics/overview',
            'GET /analytics/user/:userId',
            'GET /health'
        ]
    });
});

module.exports = router;
