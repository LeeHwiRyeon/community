/**
 * 🚀 향상된 컨텐츠 서비스
 * 
 * AI 기반 컨텐츠 분석, 개인화 추천, 실시간 처리를 제공하는
 * 차세대 컨텐츠 관리 서비스
 * 
 * @author AUTOAGENTS Manager
 * @version 2.0.0
 * @created 2025-10-02
 */

const EventEmitter = require('events');
const crypto = require('crypto');

class EnhancedContentService extends EventEmitter {
    constructor() {
        super();
        this.contentCache = new Map();
        this.userProfiles = new Map();
        this.realtimeConnections = new Map();
        this.contentAnalytics = new Map();
        this.trendingTopics = new Map();
        this.qualityThresholds = {
            minimum: 0.3,
            good: 0.6,
            excellent: 0.8
        };

        // AI 모델 시뮬레이션
        this.aiModels = {
            sentiment: this.initSentimentModel(),
            quality: this.initQualityModel(),
            recommendation: this.initRecommendationModel(),
            trending: this.initTrendingModel()
        };

        // 실시간 업데이트 간격 (30초)
        this.realtimeInterval = setInterval(() => {
            this.updateRealtimeMetrics();
        }, 30000);

        console.log('🚀 Enhanced Content Service 초기화 완료');
    }

    /**
     * 🧠 AI 모델 초기화
     */
    initSentimentModel() {
        return {
            analyze: (text) => {
                // 감정 분석 시뮬레이션
                const positiveWords = ['좋은', '훌륭한', '멋진', '최고', '완벽한', '사랑', '행복'];
                const negativeWords = ['나쁜', '최악', '싫은', '화나는', '실망', '슬픈'];

                let score = 0;
                const words = text.toLowerCase().split(/\s+/);

                words.forEach(word => {
                    if (positiveWords.some(pw => word.includes(pw))) score += 0.1;
                    if (negativeWords.some(nw => word.includes(nw))) score -= 0.1;
                });

                // -1 to 1 범위로 정규화
                score = Math.max(-1, Math.min(1, score));

                let sentiment = 'neutral';
                if (score > 0.2) sentiment = 'positive';
                else if (score < -0.2) sentiment = 'negative';

                return {
                    sentiment,
                    score,
                    confidence: Math.abs(score) + 0.5,
                    emotions: {
                        joy: Math.max(0, score * 0.8),
                        anger: Math.max(0, -score * 0.6),
                        fear: Math.random() * 0.2,
                        sadness: Math.max(0, -score * 0.4),
                        surprise: Math.random() * 0.3
                    }
                };
            }
        };
    }

    initQualityModel() {
        return {
            analyze: (content) => {
                const { title, text, multimedia } = content;

                // 품질 점수 계산 요소들
                const titleScore = this.calculateTitleQuality(title);
                const contentScore = this.calculateContentQuality(text);
                const multimediaScore = this.calculateMultimediaQuality(multimedia);
                const structureScore = this.calculateStructureQuality(text);

                const overallScore = (titleScore * 0.2 + contentScore * 0.4 +
                    multimediaScore * 0.2 + structureScore * 0.2);

                return {
                    overall_score: overallScore,
                    title_score: titleScore,
                    content_score: contentScore,
                    multimedia_score: multimediaScore,
                    structure_score: structureScore,
                    readability: this.calculateReadability(text),
                    engagement_potential: this.calculateEngagementPotential(content),
                    information_density: this.calculateInformationDensity(text),
                    originality: Math.random() * 0.3 + 0.7 // 시뮬레이션
                };
            }
        };
    }

    initRecommendationModel() {
        return {
            generateRecommendations: (userId, contentPool, userProfile) => {
                const recommendations = contentPool.map(content => {
                    const relevanceScore = this.calculateRelevanceScore(content, userProfile);
                    const qualityScore = content.quality_analysis?.overall_score || 0.5;
                    const freshnessScore = this.calculateFreshnessScore(content);
                    const socialProofScore = this.calculateSocialProofScore(content);
                    const diversityScore = this.calculateDiversityScore(content, userProfile);

                    const finalScore = (
                        relevanceScore * 0.3 +
                        qualityScore * 0.25 +
                        freshnessScore * 0.15 +
                        socialProofScore * 0.2 +
                        diversityScore * 0.1
                    );

                    return {
                        ...content,
                        recommendation_score: finalScore,
                        recommendation_reason: this.getRecommendationReason(relevanceScore, qualityScore, freshnessScore),
                        personalization: {
                            relevance_score: relevanceScore,
                            quality_score: qualityScore,
                            freshness_score: freshnessScore,
                            social_proof_score: socialProofScore,
                            diversity_score: diversityScore
                        }
                    };
                });

                return recommendations.sort((a, b) => b.recommendation_score - a.recommendation_score);
            }
        };
    }

    initTrendingModel() {
        return {
            analyzeTrends: (contentPool, timeWindow = 24) => {
                const trends = new Map();
                const now = Date.now();
                const windowMs = timeWindow * 60 * 60 * 1000;

                contentPool.forEach(content => {
                    const contentTime = new Date(content.created_at).getTime();
                    if (now - contentTime <= windowMs) {
                        // 트렌드 점수 계산
                        const engagementRate = this.calculateEngagementRate(content);
                        const velocityScore = this.calculateVelocityScore(content, timeWindow);
                        const viralityScore = this.calculateViralityScore(content);

                        const trendScore = engagementRate * 0.4 + velocityScore * 0.4 + viralityScore * 0.2;

                        content.categories?.forEach(category => {
                            if (!trends.has(category)) {
                                trends.set(category, { score: 0, count: 0, contents: [] });
                            }
                            const trend = trends.get(category);
                            trend.score += trendScore;
                            trend.count += 1;
                            trend.contents.push(content);
                        });
                    }
                });

                return Array.from(trends.entries())
                    .map(([category, data]) => ({
                        category,
                        score: data.score / data.count,
                        count: data.count,
                        growth_rate: this.calculateGrowthRate(category, timeWindow),
                        top_contents: data.contents
                            .sort((a, b) => b.engagement_rate - a.engagement_rate)
                            .slice(0, 5)
                    }))
                    .sort((a, b) => b.score - a.score);
            }
        };
    }

    /**
     * 📊 컨텐츠 분석 메서드들
     */
    async analyzeContent(content) {
        try {
            const startTime = Date.now();

            // 감정 분석
            const sentimentAnalysis = this.aiModels.sentiment.analyze(
                `${content.title} ${content.content}`
            );

            // 품질 분석
            const qualityAnalysis = this.aiModels.quality.analyze({
                title: content.title,
                text: content.content,
                multimedia: content.multimedia || {}
            });

            // 키워드 추출
            const keywords = this.extractKeywords(content.content);

            // 토픽 분류
            const topics = this.classifyTopics(content.content, keywords);

            // 난이도 분석
            const difficulty = this.analyzeDifficulty(content.content);

            // 읽기 시간 계산
            const readingTime = this.calculateReadingTime(content.content);

            const analysisResult = {
                id: content.id,
                sentiment_analysis: sentimentAnalysis,
                quality_analysis: qualityAnalysis,
                keywords: keywords,
                topics: topics,
                difficulty: difficulty,
                reading_time: readingTime,
                analysis_timestamp: new Date().toISOString(),
                processing_time: Date.now() - startTime
            };

            // 캐시에 저장
            this.contentCache.set(content.id, analysisResult);

            // 이벤트 발생
            this.emit('contentAnalyzed', analysisResult);

            return analysisResult;

        } catch (error) {
            console.error('컨텐츠 분석 실패:', error);
            throw new Error(`컨텐츠 분석 실패: ${error.message}`);
        }
    }

    /**
     * 🎯 개인화 추천 생성
     */
    async generatePersonalizedRecommendations(userId, options = {}) {
        try {
            const {
                limit = 20,
                categories = [],
                excludeViewed = true,
                minQualityScore = this.qualityThresholds.minimum
            } = options;

            // 사용자 프로필 가져오기
            const userProfile = await this.getUserProfile(userId);

            // 컨텐츠 풀 가져오기
            const contentPool = await this.getContentPool({
                categories,
                minQualityScore,
                excludeViewed: excludeViewed ? userProfile.viewed_content : []
            });

            // AI 추천 생성
            const recommendations = this.aiModels.recommendation.generateRecommendations(
                userId, contentPool, userProfile
            );

            // 다양성 보장
            const diversifiedRecommendations = this.ensureDiversity(recommendations, userProfile);

            // 결과 제한
            const finalRecommendations = diversifiedRecommendations.slice(0, limit);

            // 추천 로그 저장
            await this.logRecommendations(userId, finalRecommendations);

            return {
                user_id: userId,
                recommendations: finalRecommendations,
                total_analyzed: contentPool.length,
                personalization_score: userProfile.personalization_score,
                generated_at: new Date().toISOString()
            };

        } catch (error) {
            console.error('개인화 추천 생성 실패:', error);
            throw new Error(`추천 생성 실패: ${error.message}`);
        }
    }

    /**
     * 📈 실시간 트렌드 분석
     */
    async analyzeTrendingContent(timeWindow = 24) {
        try {
            const contentPool = await this.getRecentContent(timeWindow);
            const trends = this.aiModels.trending.analyzeTrends(contentPool, timeWindow);

            // 트렌딩 토픽 업데이트
            trends.forEach(trend => {
                this.trendingTopics.set(trend.category, {
                    ...trend,
                    last_updated: new Date().toISOString()
                });
            });

            // 실시간 클라이언트에게 브로드캐스트
            this.broadcastTrendingUpdate(trends);

            return {
                trends: trends,
                analysis_window: `${timeWindow}시간`,
                total_content_analyzed: contentPool.length,
                generated_at: new Date().toISOString()
            };

        } catch (error) {
            console.error('트렌드 분석 실패:', error);
            throw new Error(`트렌드 분석 실패: ${error.message}`);
        }
    }

    /**
     * ⚡ 실시간 컨텐츠 업데이트
     */
    async updateContentEngagement(contentId, engagementData) {
        try {
            const { type, userId, metadata = {} } = engagementData;

            // 기존 분석 데이터 가져오기
            let contentAnalytics = this.contentAnalytics.get(contentId) || {
                views: 0,
                likes: 0,
                comments: 0,
                shares: 0,
                bookmarks: 0,
                engagement_history: [],
                last_updated: new Date().toISOString()
            };

            // 참여도 업데이트
            switch (type) {
                case 'view':
                    contentAnalytics.views += 1;
                    break;
                case 'like':
                    contentAnalytics.likes += metadata.increment || 1;
                    break;
                case 'comment':
                    contentAnalytics.comments += 1;
                    break;
                case 'share':
                    contentAnalytics.shares += 1;
                    break;
                case 'bookmark':
                    contentAnalytics.bookmarks += metadata.increment || 1;
                    break;
            }

            // 참여 이력 추가
            contentAnalytics.engagement_history.push({
                type,
                user_id: userId,
                timestamp: new Date().toISOString(),
                metadata
            });

            // 최근 100개 이력만 유지
            if (contentAnalytics.engagement_history.length > 100) {
                contentAnalytics.engagement_history = contentAnalytics.engagement_history.slice(-100);
            }

            contentAnalytics.last_updated = new Date().toISOString();

            // 캐시 업데이트
            this.contentAnalytics.set(contentId, contentAnalytics);

            // 실시간 업데이트 브로드캐스트
            this.broadcastEngagementUpdate(contentId, contentAnalytics);

            // 사용자 프로필 업데이트
            await this.updateUserProfile(userId, { contentId, type, metadata });

            return contentAnalytics;

        } catch (error) {
            console.error('참여도 업데이트 실패:', error);
            throw new Error(`참여도 업데이트 실패: ${error.message}`);
        }
    }

    /**
     * 🔍 고급 컨텐츠 검색
     */
    async searchContent(query, options = {}) {
        try {
            const {
                filters = {},
                sortBy = 'relevance',
                limit = 20,
                offset = 0,
                userId = null
            } = options;

            // 검색 쿼리 분석
            const queryAnalysis = this.analyzeSearchQuery(query);

            // 컨텐츠 검색
            let results = await this.performContentSearch(queryAnalysis, filters);

            // 개인화 적용 (사용자가 있는 경우)
            if (userId) {
                const userProfile = await this.getUserProfile(userId);
                results = this.personalizeSearchResults(results, userProfile);
            }

            // 정렬
            results = this.sortSearchResults(results, sortBy);

            // 페이지네이션
            const paginatedResults = results.slice(offset, offset + limit);

            // 검색 로그 저장
            await this.logSearch(userId, query, queryAnalysis, results.length);

            return {
                query: query,
                query_analysis: queryAnalysis,
                results: paginatedResults,
                total_results: results.length,
                page_info: {
                    limit,
                    offset,
                    has_more: results.length > offset + limit
                },
                search_metadata: {
                    processing_time: queryAnalysis.processing_time,
                    personalized: Boolean(userId),
                    filters_applied: Object.keys(filters).length
                }
            };

        } catch (error) {
            console.error('컨텐츠 검색 실패:', error);
            throw new Error(`검색 실패: ${error.message}`);
        }
    }

    /**
     * 📊 컨텐츠 분석 유틸리티 메서드들
     */
    calculateTitleQuality(title) {
        if (!title) return 0;

        const length = title.length;
        const wordCount = title.split(/\s+/).length;

        // 제목 길이 점수 (30-60자가 이상적)
        let lengthScore = 0;
        if (length >= 30 && length <= 60) lengthScore = 1;
        else if (length >= 20 && length <= 80) lengthScore = 0.8;
        else if (length >= 10 && length <= 100) lengthScore = 0.6;
        else lengthScore = 0.3;

        // 단어 수 점수 (5-10개가 이상적)
        let wordScore = 0;
        if (wordCount >= 5 && wordCount <= 10) wordScore = 1;
        else if (wordCount >= 3 && wordCount <= 15) wordScore = 0.8;
        else wordScore = 0.5;

        // 특수문자 및 이모지 점수
        const hasEmoji = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/u.test(title);
        const emojiScore = hasEmoji ? 0.1 : 0;

        return (lengthScore * 0.5 + wordScore * 0.4 + emojiScore);
    }

    calculateContentQuality(text) {
        if (!text) return 0;

        const length = text.length;
        const wordCount = text.split(/\s+/).length;
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;

        // 길이 점수
        let lengthScore = 0;
        if (length >= 500 && length <= 3000) lengthScore = 1;
        else if (length >= 200 && length <= 5000) lengthScore = 0.8;
        else if (length >= 100) lengthScore = 0.6;
        else lengthScore = 0.3;

        // 구조 점수 (문장 수 대비 단어 수)
        const avgWordsPerSentence = sentences > 0 ? wordCount / sentences : 0;
        let structureScore = 0;
        if (avgWordsPerSentence >= 10 && avgWordsPerSentence <= 25) structureScore = 1;
        else if (avgWordsPerSentence >= 5 && avgWordsPerSentence <= 35) structureScore = 0.8;
        else structureScore = 0.5;

        return (lengthScore * 0.6 + structureScore * 0.4);
    }

    calculateMultimediaQuality(multimedia) {
        if (!multimedia) return 0.5;

        let score = 0.5; // 기본 점수

        if (multimedia.images && multimedia.images.length > 0) score += 0.2;
        if (multimedia.videos && multimedia.videos.length > 0) score += 0.2;
        if (multimedia.audio && multimedia.audio.length > 0) score += 0.1;
        if (multimedia.attachments && multimedia.attachments.length > 0) score += 0.1;

        return Math.min(1, score);
    }

    calculateStructureQuality(text) {
        if (!text) return 0;

        // 문단 구조 분석
        const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
        const hasList = /[-*•]\s/.test(text) || /\d+\.\s/.test(text);
        const hasHeaders = /^#{1,6}\s/.test(text) || /^[A-Z][^.!?]*:/.test(text);

        let score = 0.5;

        if (paragraphs.length >= 2) score += 0.2;
        if (hasList) score += 0.15;
        if (hasHeaders) score += 0.15;

        return Math.min(1, score);
    }

    calculateReadability(text) {
        if (!text) return 0;

        const words = text.split(/\s+/).length;
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
        const avgWordsPerSentence = sentences > 0 ? words / sentences : 0;

        // 간단한 가독성 점수 (낮을수록 읽기 쉬움)
        let readabilityScore = 1;
        if (avgWordsPerSentence <= 15) readabilityScore = 0.9;
        else if (avgWordsPerSentence <= 20) readabilityScore = 0.7;
        else if (avgWordsPerSentence <= 25) readabilityScore = 0.5;
        else readabilityScore = 0.3;

        return readabilityScore;
    }

    calculateEngagementPotential(content) {
        // 참여도 예측 (제목, 내용, 멀티미디어 기반)
        const titleScore = this.calculateTitleQuality(content.title);
        const hasMultimedia = content.multimedia &&
            (content.multimedia.images?.length > 0 || content.multimedia.videos?.length > 0);
        const multimediaBonus = hasMultimedia ? 0.2 : 0;

        return Math.min(1, titleScore * 0.6 + multimediaBonus + Math.random() * 0.3);
    }

    calculateInformationDensity(text) {
        if (!text) return 0;

        const words = text.split(/\s+/);
        const uniqueWords = new Set(words.map(w => w.toLowerCase())).size;
        const density = uniqueWords / words.length;

        return Math.min(1, density * 2); // 0.5 이상이면 1점
    }

    extractKeywords(text) {
        if (!text) return [];

        // 간단한 키워드 추출 (실제로는 더 정교한 NLP 필요)
        const words = text.toLowerCase()
            .replace(/[^\w\s가-힣]/g, '')
            .split(/\s+/)
            .filter(word => word.length >= 2);

        const wordFreq = {};
        words.forEach(word => {
            wordFreq[word] = (wordFreq[word] || 0) + 1;
        });

        return Object.entries(wordFreq)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([word, freq]) => ({ word, frequency: freq }));
    }

    classifyTopics(text, keywords) {
        // 토픽 분류 (실제로는 ML 모델 사용)
        const topicKeywords = {
            '기술': ['개발', '프로그래밍', '코딩', '소프트웨어', 'ai', '머신러닝'],
            '게임': ['게임', '플레이', '스트리밍', '리뷰', '공략'],
            '커뮤니티': ['소통', '대화', '의견', '토론', '공유'],
            '뉴스': ['뉴스', '소식', '발표', '업데이트', '출시'],
            '리뷰': ['리뷰', '평가', '후기', '추천', '비교']
        };

        const topics = [];
        const textLower = text.toLowerCase();

        Object.entries(topicKeywords).forEach(([topic, words]) => {
            const matches = words.filter(word => textLower.includes(word)).length;
            if (matches > 0) {
                topics.push({
                    name: topic,
                    confidence: Math.min(1, matches / words.length),
                    matches: matches
                });
            }
        });

        return topics.sort((a, b) => b.confidence - a.confidence).slice(0, 3);
    }

    analyzeDifficulty(text) {
        if (!text) return 'beginner';

        const words = text.split(/\s+/).length;
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
        const avgWordsPerSentence = sentences > 0 ? words / sentences : 0;

        // 전문 용어 체크 (간단한 휴리스틱)
        const technicalTerms = ['api', '프레임워크', '알고리즘', '데이터베이스', '아키텍처'];
        const technicalCount = technicalTerms.filter(term =>
            text.toLowerCase().includes(term)
        ).length;

        if (avgWordsPerSentence > 20 || technicalCount >= 3) return 'advanced';
        else if (avgWordsPerSentence > 15 || technicalCount >= 1) return 'intermediate';
        else return 'beginner';
    }

    calculateReadingTime(text) {
        if (!text) return 0;

        const wordsPerMinute = 200; // 한국어 평균 읽기 속도
        const words = text.split(/\s+/).length;
        return Math.ceil(words / wordsPerMinute);
    }

    /**
     * 🎯 추천 시스템 유틸리티
     */
    calculateRelevanceScore(content, userProfile) {
        if (!userProfile.interests) return 0.5;

        let score = 0;
        const contentText = `${content.title} ${content.content}`.toLowerCase();

        userProfile.interests.forEach(interest => {
            if (contentText.includes(interest.toLowerCase())) {
                score += interest.weight || 0.1;
            }
        });

        return Math.min(1, score);
    }

    calculateFreshnessScore(content) {
        const now = Date.now();
        const contentTime = new Date(content.created_at || content.publishedAt).getTime();
        const ageHours = (now - contentTime) / (1000 * 60 * 60);

        // 24시간 이내는 1점, 그 후 점진적 감소
        if (ageHours <= 24) return 1;
        else if (ageHours <= 168) return 0.8; // 1주일
        else if (ageHours <= 720) return 0.6; // 1개월
        else return 0.3;
    }

    calculateSocialProofScore(content) {
        const engagement = content.engagement || {};
        const totalEngagement = (engagement.likes || 0) +
            (engagement.comments || 0) +
            (engagement.shares || 0);

        // 로그 스케일로 정규화
        return Math.min(1, Math.log10(totalEngagement + 1) / 4);
    }

    calculateDiversityScore(content, userProfile) {
        // 사용자가 최근 본 컨텐츠와의 다양성 점수
        const recentCategories = userProfile.recent_categories || [];
        const contentCategories = content.categories || [];

        const overlap = contentCategories.filter(cat =>
            recentCategories.includes(cat)
        ).length;

        return Math.max(0.3, 1 - (overlap / Math.max(contentCategories.length, 1)));
    }

    getRecommendationReason(relevanceScore, qualityScore, freshnessScore) {
        if (relevanceScore > 0.8) return '관심사 완벽 일치';
        else if (qualityScore > 0.8) return '고품질 컨텐츠';
        else if (freshnessScore > 0.9) return '최신 트렌드';
        else if (relevanceScore > 0.6) return '관심사 일치';
        else return 'AI 추천';
    }

    /**
     * 📊 실시간 메트릭 업데이트
     */
    updateRealtimeMetrics() {
        // 모든 컨텐츠의 실시간 메트릭 업데이트
        this.contentAnalytics.forEach((analytics, contentId) => {
            // 실시간 조회자 수 시뮬레이션
            const currentViewers = Math.floor(Math.random() * 10);
            analytics.live_viewers = currentViewers;

            // 바이럴 잠재력 계산
            const recentEngagement = analytics.engagement_history
                .filter(e => Date.now() - new Date(e.timestamp).getTime() < 3600000) // 1시간
                .length;

            analytics.viral_potential = Math.min(1, recentEngagement / 50);

            this.contentAnalytics.set(contentId, analytics);
        });

        // 클라이언트에게 브로드캐스트
        this.emit('realtimeMetricsUpdated', {
            timestamp: new Date().toISOString(),
            active_content: this.contentAnalytics.size
        });
    }

    /**
     * 🔄 실시간 브로드캐스트
     */
    broadcastEngagementUpdate(contentId, analytics) {
        this.emit('engagementUpdate', {
            content_id: contentId,
            analytics: analytics,
            timestamp: new Date().toISOString()
        });
    }

    broadcastTrendingUpdate(trends) {
        this.emit('trendingUpdate', {
            trends: trends,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * 💾 데이터 관리 메서드들
     */
    async getUserProfile(userId) {
        // 실제로는 데이터베이스에서 가져옴
        return this.userProfiles.get(userId) || {
            id: userId,
            interests: ['기술', '개발', '커뮤니티'],
            viewed_content: [],
            recent_categories: [],
            personalization_score: 0.8,
            engagement_history: []
        };
    }

    async updateUserProfile(userId, activity) {
        const profile = await this.getUserProfile(userId);

        // 활동 기록 추가
        profile.engagement_history.push({
            ...activity,
            timestamp: new Date().toISOString()
        });

        // 최근 100개 활동만 유지
        if (profile.engagement_history.length > 100) {
            profile.engagement_history = profile.engagement_history.slice(-100);
        }

        // 관심사 업데이트 로직 (간단화)
        if (activity.type === 'view' || activity.type === 'like') {
            if (!profile.viewed_content.includes(activity.contentId)) {
                profile.viewed_content.push(activity.contentId);
            }
        }

        this.userProfiles.set(userId, profile);
        return profile;
    }

    async getContentPool(options = {}) {
        // 실제로는 데이터베이스 쿼리
        // 여기서는 모의 데이터 반환
        return Array.from({ length: 100 }, (_, i) => ({
            id: `content_${i}`,
            title: `샘플 컨텐츠 ${i}`,
            content: `이것은 샘플 컨텐츠 ${i}의 내용입니다.`,
            created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
            categories: ['기술', '개발', '커뮤니티'][Math.floor(Math.random() * 3)],
            engagement: {
                views: Math.floor(Math.random() * 1000),
                likes: Math.floor(Math.random() * 100),
                comments: Math.floor(Math.random() * 50)
            }
        }));
    }

    async getRecentContent(hours = 24) {
        const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
        const contentPool = await this.getContentPool();

        return contentPool.filter(content =>
            new Date(content.created_at) >= cutoff
        );
    }

    /**
     * 🧹 정리 메서드
     */
    cleanup() {
        if (this.realtimeInterval) {
            clearInterval(this.realtimeInterval);
        }

        this.contentCache.clear();
        this.userProfiles.clear();
        this.contentAnalytics.clear();
        this.trendingTopics.clear();

        console.log('🧹 Enhanced Content Service 정리 완료');
    }
}

module.exports = EnhancedContentService;
