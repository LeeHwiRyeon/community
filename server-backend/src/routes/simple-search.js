/**
 * Simple Search Routes (MySQL Full-Text Search)
 * Elasticsearch 없이 MySQL만으로 검색 기능 제공
 * 
 * @author AUTOAGENTS
 * @date 2025-11-11
 * @version 1.0
 */

import express from 'express';
import simpleSearchService from '../services/simple-search-service.js';
import logger from '../logger.js';

const router = express.Router();

/**
 * POST /api/simple-search/posts
 * 게시물 검색 (MySQL Full-Text Search)
 */
router.post('/posts', async (req, res) => {
    try {
        const {
            query = '',
            category = null,
            tags = [],
            author = null,
            dateFrom = null,
            dateTo = null,
            sortBy = 'relevance',
            page = 1,
            limit = 20
        } = req.body;

        // 입력 검증
        const validPage = Math.max(1, parseInt(page) || 1);
        const validLimit = Math.min(100, Math.max(1, parseInt(limit) || 20));

        if (!query && !category && !tags.length && !author && !dateFrom && !dateTo) {
            return res.status(400).json({
                error: 'At least one search parameter is required'
            });
        }

        const result = await simpleSearchService.searchPosts({
            query,
            category,
            tags,
            author,
            dateFrom,
            dateTo,
            sortBy,
            page: validPage,
            limit: validLimit
        });

        // 인기 검색어 증가
        if (query) {
            await simpleSearchService.incrementPopularTerm(query);
        }

        res.json(result);

    } catch (error) {
        logger.error('Error in POST /api/simple-search/posts:', error);
        res.status(500).json({
            error: 'Search failed',
            message: error.message
        });
    }
});

/**
 * GET /api/simple-search/autocomplete
 * 자동완성 검색
 */
router.get('/autocomplete', async (req, res) => {
    try {
        const { q: query, limit = 5 } = req.query;

        if (!query || query.trim().length === 0) {
            return res.status(400).json({
                error: 'Query parameter "q" is required'
            });
        }

        const validLimit = Math.min(20, Math.max(1, parseInt(limit) || 5));

        const suggestions = await simpleSearchService.autocomplete(
            query.trim(),
            validLimit
        );

        res.json({ suggestions });

    } catch (error) {
        logger.error('Error in GET /api/simple-search/autocomplete:', error);
        res.status(500).json({
            error: 'Autocomplete failed',
            message: error.message
        });
    }
});

/**
 * GET /api/simple-search/popular
 * 인기 검색어 조회
 */
router.get('/popular', async (req, res) => {
    try {
        const { limit = 10 } = req.query;

        const validLimit = Math.min(50, Math.max(1, parseInt(limit) || 10));

        const popularTerms = await simpleSearchService.getPopularSearchTerms(validLimit);

        res.json({ terms: popularTerms });

    } catch (error) {
        logger.error('Error in GET /api/simple-search/popular:', error);
        res.status(500).json({
            error: 'Failed to get popular search terms',
            message: error.message
        });
    }
});

/**
 * GET /api/simple-search/history
 * 검색 히스토리 조회
 */
router.get('/history', async (req, res) => {
    try {
        const { limit = 10 } = req.query;

        const validLimit = Math.min(50, Math.max(1, parseInt(limit) || 10));

        const history = await simpleSearchService.getSearchHistory(validLimit);

        res.json({ history });

    } catch (error) {
        logger.error('Error in GET /api/simple-search/history:', error);
        res.status(500).json({
            error: 'Failed to get search history',
            message: error.message
        });
    }
});

/**
 * GET /api/simple-search/users
 * 사용자 검색
 */
router.get('/users', async (req, res) => {
    try {
        const { q: query, limit = 10 } = req.query;

        if (!query || query.trim().length === 0) {
            return res.status(400).json({
                error: 'Query parameter "q" is required'
            });
        }

        const validLimit = Math.min(50, Math.max(1, parseInt(limit) || 10));

        const users = await simpleSearchService.searchUsers(
            query.trim(),
            validLimit
        );

        res.json({ users });

    } catch (error) {
        logger.error('Error in GET /api/simple-search/users:', error);
        res.status(500).json({
            error: 'User search failed',
            message: error.message
        });
    }
});

/**
 * POST /api/simple-search/cache/invalidate
 * 검색 캐시 무효화 (관리자용)
 */
router.post('/cache/invalidate', async (req, res) => {
    try {
        const { pattern = '*' } = req.body;

        await simpleSearchService.invalidateCache(pattern);

        res.json({
            message: 'Cache invalidated successfully',
            pattern
        });

    } catch (error) {
        logger.error('Error in POST /api/simple-search/cache/invalidate:', error);
        res.status(500).json({
            error: 'Failed to invalidate cache',
            message: error.message
        });
    }
});

export default router;
