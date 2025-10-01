const express = require('express');
const router = express.Router();
const SearchService = require('../services/searchService');
const { protect } = require('../middleware/authMiddleware');

// 검색 서비스 인스턴스 (실제 구현에서는 의존성 주입 사용)
let searchService;

// 검색 서비스 초기화
const initializeSearchService = async (dbConnection) => {
    if (!searchService) {
        searchService = new SearchService(dbConnection);
        await searchService.buildSearchIndex();
    }
    return searchService;
};

// 검색 API
router.get('/', protect, async (req, res) => {
    try {
        const {
            q: query,
            type = 'all',
            limit = 20,
            offset = 0,
            sort = 'relevance',
        } = req.query;

        if (!query || query.trim().length < 2) {
            return res.status(400).json({
                success: false,
                message: '검색어는 2글자 이상이어야 합니다.',
            });
        }

        const searchService = await initializeSearchService(req.db);

        const results = await searchService.search(query, {
            type,
            limit: parseInt(limit),
            offset: parseInt(offset),
            sortBy: sort,
        });

        // 검색 로그 기록
        await searchService.logSearch(query, req.user?.id, results.total);

        res.json({
            success: true,
            data: results,
        });
    } catch (error) {
        console.error('검색 오류:', error);
        res.status(500).json({
            success: false,
            message: '검색 중 오류가 발생했습니다.',
            error: error.message,
        });
    }
});

// 자동완성 API
router.get('/suggestions', protect, async (req, res) => {
    try {
        const { q: query, limit = 10 } = req.query;

        if (!query || query.trim().length < 1) {
            return res.json({
                success: true,
                data: [],
            });
        }

        const searchService = await initializeSearchService(req.db);
        const suggestions = await searchService.getSuggestions(query, parseInt(limit));

        res.json({
            success: true,
            data: suggestions,
        });
    } catch (error) {
        console.error('자동완성 오류:', error);
        res.status(500).json({
            success: false,
            message: '자동완성 중 오류가 발생했습니다.',
            error: error.message,
        });
    }
});

// 인기 검색어 API
router.get('/popular', protect, async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        const searchService = await initializeSearchService(req.db);
        const popularSearches = await searchService.getPopularSearches(parseInt(limit));

        res.json({
            success: true,
            data: popularSearches,
        });
    } catch (error) {
        console.error('인기 검색어 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '인기 검색어 조회 중 오류가 발생했습니다.',
            error: error.message,
        });
    }
});

// 검색 통계 API
router.get('/stats', protect, async (req, res) => {
    try {
        const searchService = await initializeSearchService(req.db);
        const stats = await searchService.getSearchStats();

        res.json({
            success: true,
            data: stats,
        });
    } catch (error) {
        console.error('검색 통계 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '검색 통계 조회 중 오류가 발생했습니다.',
            error: error.message,
        });
    }
});

// 검색 인덱스 새로고침 API (관리자만)
router.post('/refresh-index', protect, async (req, res) => {
    try {
        // 관리자 권한 확인
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: '관리자만 접근할 수 있습니다.',
            });
        }

        const searchService = await initializeSearchService(req.db);
        const result = await searchService.refreshIndex();

        res.json({
            success: true,
            message: '검색 인덱스가 새로고침되었습니다.',
            data: result,
        });
    } catch (error) {
        console.error('인덱스 새로고침 오류:', error);
        res.status(500).json({
            success: false,
            message: '인덱스 새로고침 중 오류가 발생했습니다.',
            error: error.message,
        });
    }
});

// 검색 인덱스 상태 API
router.get('/index-status', protect, async (req, res) => {
    try {
        const searchService = await initializeSearchService(req.db);
        const status = searchService.getIndexStatus();

        res.json({
            success: true,
            data: status,
        });
    } catch (error) {
        console.error('인덱스 상태 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '인덱스 상태 조회 중 오류가 발생했습니다.',
            error: error.message,
        });
    }
});

// 고급 검색 API
router.post('/advanced', protect, async (req, res) => {
    try {
        const {
            query,
            filters = {},
            options = {},
        } = req.body;

        if (!query || query.trim().length < 2) {
            return res.status(400).json({
                success: false,
                message: '검색어는 2글자 이상이어야 합니다.',
            });
        }

        const searchService = await initializeSearchService(req.db);

        // 고급 검색 옵션 적용
        const searchOptions = {
            type: filters.type || 'all',
            limit: options.limit || 20,
            offset: options.offset || 0,
            sortBy: options.sortBy || 'relevance',
            includeDeleted: filters.includeDeleted || false,
        };

        const results = await searchService.search(query, searchOptions);

        // 필터 적용
        let filteredResults = results.results;

        if (filters.dateRange) {
            const { start, end } = filters.dateRange;
            filteredResults = filteredResults.filter(item => {
                const itemDate = new Date(item.createdAt);
                return itemDate >= new Date(start) && itemDate <= new Date(end);
            });
        }

        if (filters.category) {
            filteredResults = filteredResults.filter(item =>
                item.category === filters.category
            );
        }

        if (filters.author) {
            filteredResults = filteredResults.filter(item =>
                item.author && item.author.includes(filters.author)
            );
        }

        if (filters.tags && filters.tags.length > 0) {
            filteredResults = filteredResults.filter(item =>
                item.tags && item.tags.some(tag =>
                    filters.tags.some(filterTag =>
                        tag.toLowerCase().includes(filterTag.toLowerCase())
                    )
                )
            );
        }

        // 검색 로그 기록
        await searchService.logSearch(query, req.user?.id, filteredResults.length);

        res.json({
            success: true,
            data: {
                ...results,
                results: filteredResults,
                total: filteredResults.length,
                appliedFilters: filters,
            },
        });
    } catch (error) {
        console.error('고급 검색 오류:', error);
        res.status(500).json({
            success: false,
            message: '고급 검색 중 오류가 발생했습니다.',
            error: error.message,
        });
    }
});

module.exports = router;
