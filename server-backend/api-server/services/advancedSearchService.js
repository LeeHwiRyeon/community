const logger = require('../../utils/logger');

class AdvancedSearchService {
    constructor() {
        this.searchIndex = new Map();
        this.filterCache = new Map();
        this.searchHistory = new Map();
        this.searchAnalytics = {
            totalSearches: 0,
            popularQueries: new Map(),
            searchResults: new Map(),
            userSearches: new Map()
        };
    }

    // 통합 검색 엔진
    async performAdvancedSearch(query, filters = {}, options = {}) {
        try {
            const {
                type = 'all', // 'all', 'posts', 'users', 'communities', 'products', 'streams'
                sortBy = 'relevance',
                page = 1,
                limit = 20,
                userId = null,
                includeDeleted = false
            } = options;

            // 검색 쿼리 분석
            const analyzedQuery = this.analyzeQuery(query);

            // 검색 기록 저장
            if (userId) {
                this.recordSearchHistory(userId, query, analyzedQuery);
            }

            // 검색 결과 수집
            let results = [];

            if (type === 'all' || type === 'posts') {
                const postResults = await this.searchPosts(analyzedQuery, filters, options);
                results = results.concat(postResults.map(r => ({ ...r, type: 'post' })));
            }

            if (type === 'all' || type === 'users') {
                const userResults = await this.searchUsers(analyzedQuery, filters, options);
                results = results.concat(userResults.map(r => ({ ...r, type: 'user' })));
            }

            if (type === 'all' || type === 'communities') {
                const communityResults = await this.searchCommunities(analyzedQuery, filters, options);
                results = results.concat(communityResults.map(r => ({ ...r, type: 'community' })));
            }

            if (type === 'all' || type === 'products') {
                const productResults = await this.searchProducts(analyzedQuery, filters, options);
                results = results.concat(productResults.map(r => ({ ...r, type: 'product' })));
            }

            if (type === 'all' || type === 'streams') {
                const streamResults = await this.searchStreams(analyzedQuery, filters, options);
                results = results.concat(streamResults.map(r => ({ ...r, type: 'stream' })));
            }

            // 결과 정렬
            const sortedResults = this.sortResults(results, sortBy, analyzedQuery);

            // 페이지네이션
            const paginatedResults = this.paginateResults(sortedResults, page, limit);

            // 검색 분석 업데이트
            this.updateSearchAnalytics(query, results.length);

            return {
                success: true,
                data: {
                    results: paginatedResults,
                    pagination: {
                        currentPage: page,
                        totalPages: Math.ceil(sortedResults.length / limit),
                        totalItems: sortedResults.length,
                        itemsPerPage: limit
                    },
                    query: {
                        original: query,
                        analyzed: analyzedQuery,
                        filters,
                        sortBy
                    },
                    suggestions: this.generateSearchSuggestions(analyzedQuery),
                    relatedSearches: this.getRelatedSearches(analyzedQuery)
                }
            };
        } catch (error) {
            logger.error('Advanced search error:', error);
            return {
                success: false,
                message: 'Search failed',
                error: error.message
            };
        }
    }

    // 쿼리 분석
    analyzeQuery(query) {
        const analyzed = {
            original: query,
            terms: [],
            keywords: [],
            phrases: [],
            operators: [],
            filters: {},
            intent: 'general',
            language: 'ko',
            sentiment: 'neutral'
        };

        // 기본 텍스트 처리
        const cleanQuery = query.trim().toLowerCase();

        // 키워드 추출
        analyzed.terms = cleanQuery.split(/\s+/).filter(term => term.length > 0);

        // 구문 추출 (따옴표로 둘러싸인 텍스트)
        const phraseMatches = query.match(/"([^"]+)"/g);
        if (phraseMatches) {
            analyzed.phrases = phraseMatches.map(phrase => phrase.replace(/"/g, ''));
        }

        // 연산자 추출
        const operators = ['AND', 'OR', 'NOT', '+', '-', '~'];
        analyzed.operators = analyzed.terms.filter(term => operators.includes(term.toUpperCase()));

        // 필터 추출
        const filterPatterns = [
            /category:(\w+)/gi,
            /author:(\w+)/gi,
            /date:(\d{4}-\d{2}-\d{2})/gi,
            /price:(\d+)/gi,
            /rating:(\d+)/gi,
            /tag:(\w+)/gi
        ];

        filterPatterns.forEach(pattern => {
            const matches = query.match(pattern);
            if (matches) {
                matches.forEach(match => {
                    const [key, value] = match.split(':');
                    analyzed.filters[key] = value;
                });
            }
        });

        // 의도 분석
        analyzed.intent = this.analyzeSearchIntent(analyzed.terms);

        // 언어 감지
        analyzed.language = this.detectLanguage(query);

        // 감정 분석
        analyzed.sentiment = this.analyzeSentiment(query);

        return analyzed;
    }

    // 게시물 검색
    async searchPosts(analyzedQuery, filters, options) {
        // 실제로는 데이터베이스에서 검색
        const mockPosts = [
            {
                id: 'post1',
                title: 'React 고급 패턴과 최적화 기법',
                content: 'React에서 성능을 최적화하는 다양한 패턴들을 소개합니다...',
                author: 'developer123',
                category: 'tech',
                tags: ['react', 'javascript', 'frontend'],
                createdAt: '2025-01-01T10:00:00Z',
                views: 1250,
                likes: 45,
                comments: 12,
                score: 0.95
            },
            {
                id: 'post2',
                title: 'Node.js 마이크로서비스 아키텍처',
                content: 'Node.js를 사용한 마이크로서비스 설계와 구현 방법...',
                author: 'backend_dev',
                category: 'tech',
                tags: ['nodejs', 'microservices', 'backend'],
                createdAt: '2025-01-02T14:30:00Z',
                views: 890,
                likes: 32,
                comments: 8,
                score: 0.87
            }
        ];

        return this.filterAndScoreResults(mockPosts, analyzedQuery, filters);
    }

    // 사용자 검색
    async searchUsers(analyzedQuery, filters, options) {
        const mockUsers = [
            {
                id: 'user1',
                username: 'developer123',
                displayName: '개발자123',
                email: 'dev@example.com',
                bio: '풀스택 개발자입니다. React와 Node.js를 주로 사용합니다.',
                skills: ['react', 'nodejs', 'javascript', 'typescript'],
                location: 'Seoul, Korea',
                followers: 1250,
                following: 340,
                posts: 45,
                score: 0.92
            },
            {
                id: 'user2',
                username: 'backend_dev',
                displayName: '백엔드 개발자',
                email: 'backend@example.com',
                bio: '백엔드 아키텍처 전문가입니다.',
                skills: ['nodejs', 'python', 'docker', 'kubernetes'],
                location: 'Busan, Korea',
                followers: 890,
                following: 120,
                posts: 23,
                score: 0.85
            }
        ];

        return this.filterAndScoreResults(mockUsers, analyzedQuery, filters);
    }

    // 커뮤니티 검색
    async searchCommunities(analyzedQuery, filters, options) {
        const mockCommunities = [
            {
                id: 'comm1',
                name: 'React 개발자 커뮤니티',
                description: 'React 관련 정보를 공유하는 커뮤니티입니다.',
                category: 'tech',
                tags: ['react', 'javascript', 'frontend'],
                members: 2500,
                posts: 1200,
                createdAt: '2024-01-01T00:00:00Z',
                score: 0.88
            },
            {
                id: 'comm2',
                name: 'Node.js 백엔드 개발',
                description: 'Node.js 백엔드 개발 정보 공유 커뮤니티',
                category: 'tech',
                tags: ['nodejs', 'backend', 'api'],
                members: 1800,
                posts: 890,
                createdAt: '2024-02-01T00:00:00Z',
                score: 0.82
            }
        ];

        return this.filterAndScoreResults(mockCommunities, analyzedQuery, filters);
    }

    // 상품 검색
    async searchProducts(analyzedQuery, filters, options) {
        const mockProducts = [
            {
                id: 'prod1',
                name: 'React 완벽 가이드',
                description: 'React를 처음부터 고급까지 배우는 완벽한 가이드북',
                category: 'book',
                price: 35000,
                rating: 4.8,
                sales: 1200,
                tags: ['react', 'javascript', 'frontend', 'book'],
                createdAt: '2024-12-01T00:00:00Z',
                score: 0.91
            },
            {
                id: 'prod2',
                name: 'Node.js 마스터 클래스',
                description: 'Node.js로 서버 개발을 마스터하는 온라인 강의',
                category: 'course',
                price: 89000,
                rating: 4.9,
                sales: 560,
                tags: ['nodejs', 'backend', 'course', 'online'],
                createdAt: '2024-11-15T00:00:00Z',
                score: 0.89
            }
        ];

        return this.filterAndScoreResults(mockProducts, analyzedQuery, filters);
    }

    // 스트림 검색
    async searchStreams(analyzedQuery, filters, options) {
        const mockStreams = [
            {
                id: 'stream1',
                title: 'React 실시간 코딩 세션',
                description: 'React 프로젝트를 실시간으로 개발하는 스트림',
                streamer: 'developer123',
                category: 'tech',
                tags: ['react', 'coding', 'live'],
                viewers: 150,
                likes: 25,
                status: 'live',
                createdAt: '2025-01-01T20:00:00Z',
                score: 0.93
            },
            {
                id: 'stream2',
                title: 'Node.js API 설계 강의',
                description: 'Node.js로 RESTful API를 설계하는 방법',
                streamer: 'backend_dev',
                category: 'tech',
                tags: ['nodejs', 'api', 'tutorial'],
                viewers: 89,
                likes: 15,
                status: 'live',
                createdAt: '2025-01-01T21:00:00Z',
                score: 0.87
            }
        ];

        return this.filterAndScoreResults(mockStreams, analyzedQuery, filters);
    }

    // 결과 필터링 및 스코어링
    filterAndScoreResults(items, analyzedQuery, filters) {
        return items
            .filter(item => this.matchesFilters(item, filters))
            .map(item => ({
                ...item,
                score: this.calculateRelevanceScore(item, analyzedQuery)
            }))
            .filter(item => item.score > 0.1); // 최소 관련성 임계값
    }

    // 필터 매칭
    matchesFilters(item, filters) {
        for (const [key, value] of Object.entries(filters)) {
            switch (key) {
                case 'category':
                    if (item.category !== value) return false;
                    break;
                case 'author':
                    if (item.author !== value) return false;
                    break;
                case 'date':
                    const itemDate = new Date(item.createdAt).toISOString().split('T')[0];
                    if (itemDate !== value) return false;
                    break;
                case 'price':
                    const price = parseInt(value);
                    if (item.price && (item.price < price * 0.9 || item.price > price * 1.1)) return false;
                    break;
                case 'rating':
                    const rating = parseFloat(value);
                    if (item.rating && item.rating < rating) return false;
                    break;
                case 'tag':
                    if (!item.tags || !item.tags.includes(value)) return false;
                    break;
            }
        }
        return true;
    }

    // 관련성 점수 계산
    calculateRelevanceScore(item, analyzedQuery) {
        let score = 0;
        const queryTerms = analyzedQuery.terms;

        // 제목 매칭 (가장 높은 가중치)
        if (item.title) {
            const titleScore = this.calculateTextMatchScore(item.title, queryTerms);
            score += titleScore * 0.4;
        }

        // 내용 매칭
        if (item.content || item.description) {
            const contentScore = this.calculateTextMatchScore(
                item.content || item.description,
                queryTerms
            );
            score += contentScore * 0.3;
        }

        // 태그 매칭
        if (item.tags) {
            const tagScore = this.calculateTagMatchScore(item.tags, queryTerms);
            score += tagScore * 0.2;
        }

        // 구문 매칭 (정확한 구문)
        if (analyzedQuery.phrases.length > 0) {
            const phraseScore = this.calculatePhraseMatchScore(item, analyzedQuery.phrases);
            score += phraseScore * 0.1;
        }

        // 인기도 보너스
        if (item.views) score += Math.log(item.views + 1) * 0.01;
        if (item.likes) score += Math.log(item.likes + 1) * 0.01;
        if (item.rating) score += item.rating * 0.05;

        return Math.min(score, 1.0); // 최대 1.0으로 제한
    }

    // 텍스트 매칭 점수 계산
    calculateTextMatchScore(text, queryTerms) {
        if (!text || !queryTerms.length) return 0;

        const lowerText = text.toLowerCase();
        let matchCount = 0;

        queryTerms.forEach(term => {
            if (lowerText.includes(term)) {
                matchCount++;
            }
        });

        return matchCount / queryTerms.length;
    }

    // 태그 매칭 점수 계산
    calculateTagMatchScore(tags, queryTerms) {
        if (!tags || !queryTerms.length) return 0;

        const lowerTags = tags.map(tag => tag.toLowerCase());
        let matchCount = 0;

        queryTerms.forEach(term => {
            if (lowerTags.includes(term)) {
                matchCount++;
            }
        });

        return matchCount / queryTerms.length;
    }

    // 구문 매칭 점수 계산
    calculatePhraseMatchScore(item, phrases) {
        let score = 0;
        const searchableText = [
            item.title,
            item.content,
            item.description,
            item.bio
        ].filter(Boolean).join(' ').toLowerCase();

        phrases.forEach(phrase => {
            if (searchableText.includes(phrase.toLowerCase())) {
                score += 1;
            }
        });

        return score / phrases.length;
    }

    // 결과 정렬
    sortResults(results, sortBy, analyzedQuery) {
        return results.sort((a, b) => {
            switch (sortBy) {
                case 'relevance':
                    return b.score - a.score;
                case 'date':
                    return new Date(b.createdAt) - new Date(a.createdAt);
                case 'popularity':
                    const aPopularity = (a.views || 0) + (a.likes || 0) + (a.comments || 0);
                    const bPopularity = (b.views || 0) + (b.likes || 0) + (b.comments || 0);
                    return bPopularity - aPopularity;
                case 'rating':
                    return (b.rating || 0) - (a.rating || 0);
                case 'price_low':
                    return (a.price || 0) - (b.price || 0);
                case 'price_high':
                    return (b.price || 0) - (a.price || 0);
                default:
                    return b.score - a.score;
            }
        });
    }

    // 페이지네이션
    paginateResults(results, page, limit) {
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        return results.slice(startIndex, endIndex);
    }

    // 검색 의도 분석
    analyzeSearchIntent(terms) {
        const questionWords = ['what', 'how', 'why', 'when', 'where', 'who', '어떻게', '왜', '언제', '어디서', '누가'];
        const tutorialWords = ['tutorial', 'guide', 'learn', '강의', '가이드', '배우기', '학습'];
        const problemWords = ['error', 'issue', 'problem', 'bug', 'fix', '오류', '문제', '해결', '수정'];

        if (terms.some(term => questionWords.includes(term))) {
            return 'question';
        } else if (terms.some(term => tutorialWords.includes(term))) {
            return 'tutorial';
        } else if (terms.some(term => problemWords.includes(term))) {
            return 'problem';
        }

        return 'general';
    }

    // 언어 감지
    detectLanguage(text) {
        const koreanPattern = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/;
        const englishPattern = /[a-zA-Z]/;

        if (koreanPattern.test(text)) {
            return 'ko';
        } else if (englishPattern.test(text)) {
            return 'en';
        }

        return 'ko'; // 기본값
    }

    // 감정 분석
    analyzeSentiment(text) {
        const positiveWords = ['좋다', '훌륭하다', '최고', '완벽', '추천', '좋은', 'great', 'awesome', 'excellent'];
        const negativeWords = ['나쁘다', '최악', '문제', '오류', '실패', 'bad', 'terrible', 'awful', 'error'];

        const lowerText = text.toLowerCase();
        const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
        const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;

        if (positiveCount > negativeCount) return 'positive';
        if (negativeCount > positiveCount) return 'negative';
        return 'neutral';
    }

    // 검색 제안 생성
    generateSearchSuggestions(analyzedQuery) {
        const suggestions = [];

        // 인기 검색어 기반 제안
        const popularQueries = Array.from(this.searchAnalytics.popularQueries.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([query]) => query);

        suggestions.push(...popularQueries);

        // 자동완성 제안
        const autocompleteSuggestions = this.generateAutocompleteSuggestions(analyzedQuery.terms);
        suggestions.push(...autocompleteSuggestions);

        return [...new Set(suggestions)].slice(0, 10);
    }

    // 자동완성 제안 생성
    generateAutocompleteSuggestions(terms) {
        // 실제로는 데이터베이스에서 자동완성 데이터를 가져옴
        const suggestions = [
            'react hooks',
            'react router',
            'react state management',
            'node.js express',
            'node.js authentication',
            'javascript es6',
            'typescript tutorial',
            'css flexbox',
            'css grid',
            'mongodb tutorial'
        ];

        if (terms.length === 0) return suggestions.slice(0, 5);

        const lastTerm = terms[terms.length - 1];
        return suggestions
            .filter(suggestion => suggestion.toLowerCase().includes(lastTerm))
            .slice(0, 5);
    }

    // 관련 검색어
    getRelatedSearches(analyzedQuery) {
        // 실제로는 검색 로그를 분석하여 관련 검색어를 찾음
        const relatedSearches = {
            'react': ['react hooks', 'react router', 'react state', 'react performance'],
            'nodejs': ['node.js express', 'node.js authentication', 'node.js database'],
            'javascript': ['javascript es6', 'javascript async', 'javascript promises'],
            'css': ['css flexbox', 'css grid', 'css animations', 'css responsive']
        };

        const terms = analyzedQuery.terms;
        const related = [];

        terms.forEach(term => {
            if (relatedSearches[term]) {
                related.push(...relatedSearches[term]);
            }
        });

        return [...new Set(related)].slice(0, 8);
    }

    // 검색 기록 저장
    recordSearchHistory(userId, query, analyzedQuery) {
        if (!this.searchHistory.has(userId)) {
            this.searchHistory.set(userId, []);
        }

        const history = this.searchHistory.get(userId);
        history.push({
            query,
            analyzedQuery,
            timestamp: new Date().toISOString()
        });

        // 최대 100개 검색 기록만 유지
        if (history.length > 100) {
            history.splice(0, history.length - 100);
        }
    }

    // 검색 분석 업데이트
    updateSearchAnalytics(query, resultCount) {
        this.searchAnalytics.totalSearches++;

        // 인기 검색어 업데이트
        const count = this.searchAnalytics.popularQueries.get(query) || 0;
        this.searchAnalytics.popularQueries.set(query, count + 1);

        // 검색 결과 수 저장
        this.searchAnalytics.searchResults.set(query, resultCount);
    }

    // 사용자 검색 기록 조회
    getUserSearchHistory(userId, limit = 20) {
        const history = this.searchHistory.get(userId) || [];
        return history.slice(-limit).reverse();
    }

    // 인기 검색어 조회
    getPopularSearches(limit = 10) {
        return Array.from(this.searchAnalytics.popularQueries.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([query, count]) => ({ query, count }));
    }

    // 검색 통계 조회
    getSearchAnalytics() {
        return {
            totalSearches: this.searchAnalytics.totalSearches,
            popularSearches: this.getPopularSearches(10),
            averageResultsPerSearch: this.calculateAverageResults(),
            searchTrends: this.calculateSearchTrends()
        };
    }

    // 평균 검색 결과 수 계산
    calculateAverageResults() {
        const results = Array.from(this.searchAnalytics.searchResults.values());
        if (results.length === 0) return 0;
        return results.reduce((sum, count) => sum + count, 0) / results.length;
    }

    // 검색 트렌드 계산
    calculateSearchTrends() {
        // 실제로는 시간대별 검색 데이터를 분석
        return {
            hourly: Array.from({ length: 24 }, (_, i) => ({
                hour: i,
                searches: Math.floor(Math.random() * 100)
            })),
            daily: Array.from({ length: 7 }, (_, i) => ({
                day: i,
                searches: Math.floor(Math.random() * 500)
            }))
        };
    }

    // 검색 인덱스 구축
    buildSearchIndex(items, type) {
        items.forEach(item => {
            const indexKey = `${type}_${item.id}`;
            const searchableText = [
                item.title,
                item.content,
                item.description,
                item.bio,
                ...(item.tags || [])
            ].filter(Boolean).join(' ').toLowerCase();

            this.searchIndex.set(indexKey, {
                id: item.id,
                type,
                text: searchableText,
                metadata: item
            });
        });
    }

    // 실시간 검색 인덱스 업데이트
    updateSearchIndex(item, type, action = 'add') {
        const indexKey = `${type}_${item.id}`;

        if (action === 'add' || action === 'update') {
            const searchableText = [
                item.title,
                item.content,
                item.description,
                item.bio,
                ...(item.tags || [])
            ].filter(Boolean).join(' ').toLowerCase();

            this.searchIndex.set(indexKey, {
                id: item.id,
                type,
                text: searchableText,
                metadata: item
            });
        } else if (action === 'delete') {
            this.searchIndex.delete(indexKey);
        }
    }
}

module.exports = new AdvancedSearchService();
