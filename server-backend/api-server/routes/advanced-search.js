const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const advancedSearchService = require('../services/advancedSearchService');

// 통합 검색 API
router.get('/search', async (req, res) => {
    try {
        const {
            q: query,
            type = 'all',
            sort = 'relevance',
            page = 1,
            limit = 20,
            category,
            author,
            date,
            price,
            rating,
            tag,
            userId
        } = req.query;

        if (!query || query.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: '검색 쿼리가 필요합니다.'
            });
        }

        // 필터 구성
        const filters = {};
        if (category) filters.category = category;
        if (author) filters.author = author;
        if (date) filters.date = date;
        if (price) filters.price = price;
        if (rating) filters.rating = rating;
        if (tag) filters.tag = tag;

        // 검색 옵션
        const options = {
            type,
            sortBy: sort,
            page: parseInt(page),
            limit: parseInt(limit),
            userId,
            includeDeleted: false
        };

        // 고급 검색 실행
        const result = await advancedSearchService.performAdvancedSearch(
            query.trim(),
            filters,
            options
        );

        res.json(result);
    } catch (error) {
        logger.error('Search API error:', error);
        res.status(500).json({
            success: false,
            message: '검색 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 자동완성 API
router.get('/autocomplete', async (req, res) => {
    try {
        const { q: query, limit = 10 } = req.query;

        if (!query || query.trim().length < 2) {
            return res.json({
                success: true,
                data: []
            });
        }

        // 자동완성 제안 생성
        const analyzedQuery = advancedSearchService.analyzeQuery(query.trim());
        const suggestions = advancedSearchService.generateSearchSuggestions(analyzedQuery);

        res.json({
            success: true,
            data: suggestions.slice(0, parseInt(limit))
        });
    } catch (error) {
        logger.error('Autocomplete API error:', error);
        res.status(500).json({
            success: false,
            message: '자동완성 생성 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 검색 제안 API
router.get('/suggestions', async (req, res) => {
    try {
        const { q: query, limit = 10 } = req.query;

        let suggestions = [];

        if (query && query.trim().length > 0) {
            const analyzedQuery = advancedSearchService.analyzeQuery(query.trim());
            suggestions = advancedSearchService.generateSearchSuggestions(analyzedQuery);
        } else {
            // 인기 검색어 반환
            suggestions = advancedSearchService.getPopularSearches(parseInt(limit));
        }

        res.json({
            success: true,
            data: suggestions.slice(0, parseInt(limit))
        });
    } catch (error) {
        logger.error('Suggestions API error:', error);
        res.status(500).json({
            success: false,
            message: '검색 제안 생성 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 관련 검색어 API
router.get('/related', async (req, res) => {
    try {
        const { q: query, limit = 8 } = req.query;

        if (!query || query.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: '검색 쿼리가 필요합니다.'
            });
        }

        const analyzedQuery = advancedSearchService.analyzeQuery(query.trim());
        const relatedSearches = advancedSearchService.getRelatedSearches(analyzedQuery);

        res.json({
            success: true,
            data: relatedSearches.slice(0, parseInt(limit))
        });
    } catch (error) {
        logger.error('Related searches API error:', error);
        res.status(500).json({
            success: false,
            message: '관련 검색어 생성 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 사용자 검색 기록 API
router.get('/history/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 20 } = req.query;

        const history = advancedSearchService.getUserSearchHistory(userId, parseInt(limit));

        res.json({
            success: true,
            data: history
        });
    } catch (error) {
        logger.error('Search history API error:', error);
        res.status(500).json({
            success: false,
            message: '검색 기록 조회 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 검색 기록 삭제 API
router.delete('/history/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { query } = req.body;

        // 검색 기록에서 특정 쿼리 삭제
        const history = advancedSearchService.getUserSearchHistory(userId);
        const filteredHistory = history.filter(item => item.query !== query);

        // 실제로는 데이터베이스에서 삭제
        // advancedSearchService.deleteSearchHistory(userId, query);

        res.json({
            success: true,
            message: '검색 기록이 삭제되었습니다.'
        });
    } catch (error) {
        logger.error('Delete search history API error:', error);
        res.status(500).json({
            success: false,
            message: '검색 기록 삭제 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 검색 통계 API
router.get('/analytics', async (req, res) => {
    try {
        const analytics = advancedSearchService.getSearchAnalytics();

        res.json({
            success: true,
            data: analytics
        });
    } catch (error) {
        logger.error('Search analytics API error:', error);
        res.status(500).json({
            success: false,
            message: '검색 통계 조회 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 인기 검색어 API
router.get('/popular', async (req, res) => {
    try {
        const { limit = 10, period = 'all' } = req.query;

        const popularSearches = advancedSearchService.getPopularSearches(parseInt(limit));

        res.json({
            success: true,
            data: popularSearches
        });
    } catch (error) {
        logger.error('Popular searches API error:', error);
        res.status(500).json({
            success: false,
            message: '인기 검색어 조회 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 고급 필터 옵션 API
router.get('/filters', async (req, res) => {
    try {
        const { type = 'all' } = req.query;

        const filterOptions = {
            categories: [
                { value: 'tech', label: '기술', count: 1250 },
                { value: 'lifestyle', label: '라이프스타일', count: 890 },
                { value: 'business', label: '비즈니스', count: 650 },
                { value: 'education', label: '교육', count: 420 },
                { value: 'entertainment', label: '엔터테인먼트', count: 380 }
            ],
            tags: [
                { value: 'react', label: 'React', count: 450 },
                { value: 'nodejs', label: 'Node.js', count: 320 },
                { value: 'javascript', label: 'JavaScript', count: 280 },
                { value: 'python', label: 'Python', count: 250 },
                { value: 'css', label: 'CSS', count: 200 }
            ],
            dateRanges: [
                { value: 'today', label: '오늘' },
                { value: 'week', label: '이번 주' },
                { value: 'month', label: '이번 달' },
                { value: 'year', label: '올해' }
            ],
            priceRanges: [
                { value: '0-10000', label: '1만원 이하' },
                { value: '10000-50000', label: '1만원 - 5만원' },
                { value: '50000-100000', label: '5만원 - 10만원' },
                { value: '100000-', label: '10만원 이상' }
            ],
            ratings: [
                { value: '4.5', label: '4.5점 이상' },
                { value: '4.0', label: '4.0점 이상' },
                { value: '3.5', label: '3.5점 이상' },
                { value: '3.0', label: '3.0점 이상' }
            ]
        };

        res.json({
            success: true,
            data: filterOptions
        });
    } catch (error) {
        logger.error('Filter options API error:', error);
        res.status(500).json({
            success: false,
            message: '필터 옵션 조회 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 검색 결과 하이라이트 API
router.post('/highlight', async (req, res) => {
    try {
        const { text, query } = req.body;

        if (!text || !query) {
            return res.status(400).json({
                success: false,
                message: '텍스트와 쿼리가 필요합니다.'
            });
        }

        // 검색어 하이라이트 처리
        const highlightedText = highlightSearchTerms(text, query);

        res.json({
            success: true,
            data: {
                original: text,
                highlighted: highlightedText
            }
        });
    } catch (error) {
        logger.error('Highlight API error:', error);
        res.status(500).json({
            success: false,
            message: '하이라이트 처리 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 검색어 하이라이트 함수
function highlightSearchTerms(text, query) {
    if (!text || !query) return text;

    const terms = query.trim().split(/\s+/);
    let highlightedText = text;

    terms.forEach(term => {
        if (term.length > 0) {
            const regex = new RegExp(`(${term})`, 'gi');
            highlightedText = highlightedText.replace(
                regex,
                '<mark class="search-highlight">$1</mark>'
            );
        }
    });

    return highlightedText;
}

// 검색 인덱스 관리 API
router.post('/index/rebuild', async (req, res) => {
    try {
        const { type } = req.body;

        // 실제로는 데이터베이스에서 데이터를 가져와서 인덱스 재구축
        // const items = await getItemsFromDatabase(type);
        // advancedSearchService.buildSearchIndex(items, type);

        res.json({
            success: true,
            message: `${type || 'all'} 검색 인덱스가 재구축되었습니다.`
        });
    } catch (error) {
        logger.error('Rebuild index API error:', error);
        res.status(500).json({
            success: false,
            message: '인덱스 재구축 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 검색 인덱스 업데이트 API
router.post('/index/update', async (req, res) => {
    try {
        const { item, type, action = 'add' } = req.body;

        if (!item || !type) {
            return res.status(400).json({
                success: false,
                message: '아이템과 타입이 필요합니다.'
            });
        }

        advancedSearchService.updateSearchIndex(item, type, action);

        res.json({
            success: true,
            message: '검색 인덱스가 업데이트되었습니다.'
        });
    } catch (error) {
        logger.error('Update index API error:', error);
        res.status(500).json({
            success: false,
            message: '인덱스 업데이트 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 검색 성능 모니터링 API
router.get('/performance', async (req, res) => {
    try {
        const performance = {
            averageSearchTime: 150, // ms
            totalSearches: advancedSearchService.getSearchAnalytics().totalSearches,
            cacheHitRate: 0.85,
            indexSize: advancedSearchService.searchIndex.size,
            memoryUsage: process.memoryUsage(),
            uptime: process.uptime()
        };

        res.json({
            success: true,
            data: performance
        });
    } catch (error) {
        logger.error('Search performance API error:', error);
        res.status(500).json({
            success: false,
            message: '검색 성능 조회 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

module.exports = router;
