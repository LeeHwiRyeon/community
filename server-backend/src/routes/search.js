/**
 * 고급 검색 API 라우터
 * Elasticsearch 기반 전문 검색, 자동완성, 필터링
 */

import express from 'express';
import searchService from '../services/search-service.js';

const router = express.Router();

/**
 * POST /api/search/posts
 * 게시물 검색
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
        if (page < 1 || limit < 1 || limit > 100) {
            return res.status(400).json({
                success: false,
                message: '잘못된 페이지 또는 limit 값입니다'
            });
        }

        const result = await searchService.searchPosts({
            query,
            category,
            tags: Array.isArray(tags) ? tags : [],
            author,
            dateFrom,
            dateTo,
            sortBy,
            page: parseInt(page),
            limit: parseInt(limit)
        });

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('[Search API] 게시물 검색 실패:', error);
        res.status(500).json({
            success: false,
            message: '게시물 검색 중 오류가 발생했습니다'
        });
    }
});

/**
 * GET /api/search/users
 * 사용자 검색
 */
router.get('/users', async (req, res) => {
    try {
        const { q, limit = 10 } = req.query;

        if (!q || q.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: '검색어를 입력해주세요'
            });
        }

        const users = await searchService.searchUsers(q, parseInt(limit));

        res.json({
            success: true,
            data: users
        });
    } catch (error) {
        console.error('[Search API] 사용자 검색 실패:', error);
        res.status(500).json({
            success: false,
            message: '사용자 검색 중 오류가 발생했습니다'
        });
    }
});

/**
 * GET /api/search/autocomplete
 * 자동완성 검색
 */
router.get('/autocomplete', async (req, res) => {
    try {
        const { q, limit = 5 } = req.query;

        if (!q || q.trim().length === 0) {
            return res.json({
                success: true,
                data: []
            });
        }

        const suggestions = await searchService.autocomplete(q, parseInt(limit));

        res.json({
            success: true,
            data: suggestions
        });
    } catch (error) {
        console.error('[Search API] 자동완성 실패:', error);
        res.status(500).json({
            success: false,
            message: '자동완성 중 오류가 발생했습니다'
        });
    }
});

/**
 * GET /api/search/popular
 * 인기 검색어 조회
 */
router.get('/popular', async (req, res) => {
    try {
        const { limit = 10 } = req.query;

        const popularTerms = await searchService.getPopularSearchTerms(parseInt(limit));

        res.json({
            success: true,
            data: popularTerms
        });
    } catch (error) {
        console.error('[Search API] 인기 검색어 조회 실패:', error);
        res.status(500).json({
            success: false,
            message: '인기 검색어 조회 중 오류가 발생했습니다'
        });
    }
});

/**
 * POST /api/search/index/post/:postId
 * 게시물 인덱싱 (내부 사용)
 * 
 * 게시물 생성/수정 시 자동 호출
 */
router.post('/index/post/:postId', async (req, res) => {
    try {
        const { postId } = req.params;
        const postData = req.body;

        // 필수 필드 검증
        if (!postData.title || !postData.content) {
            return res.status(400).json({
                success: false,
                message: '제목과 내용은 필수입니다'
            });
        }

        await searchService.indexPost({
            id: parseInt(postId),
            ...postData
        });

        res.json({
            success: true,
            message: '게시물 인덱싱 완료'
        });
    } catch (error) {
        console.error('[Search API] 게시물 인덱싱 실패:', error);
        res.status(500).json({
            success: false,
            message: '게시물 인덱싱 중 오류가 발생했습니다'
        });
    }
});

/**
 * DELETE /api/search/index/post/:postId
 * 게시물 인덱스 삭제 (내부 사용)
 * 
 * 게시물 삭제 시 자동 호출
 */
router.delete('/index/post/:postId', async (req, res) => {
    try {
        const { postId } = req.params;

        await searchService.deletePost(parseInt(postId));

        res.json({
            success: true,
            message: '게시물 인덱스 삭제 완료'
        });
    } catch (error) {
        console.error('[Search API] 게시물 인덱스 삭제 실패:', error);
        res.status(500).json({
            success: false,
            message: '게시물 인덱스 삭제 중 오류가 발생했습니다'
        });
    }
});

/**
 * POST /api/search/bulk-index
 * 대량 게시물 인덱싱 (관리자 전용)
 * 
 * 초기 데이터 마이그레이션이나 재인덱싱 시 사용
 */
router.post('/bulk-index', async (req, res) => {
    try {
        const { posts } = req.body;

        if (!Array.isArray(posts) || posts.length === 0) {
            return res.status(400).json({
                success: false,
                message: '게시물 배열이 필요합니다'
            });
        }

        const result = await searchService.bulkIndexPosts(posts);

        res.json({
            success: true,
            message: `${posts.length}개 게시물 대량 인덱싱 완료`,
            data: {
                indexed: posts.length,
                errors: result.errors
            }
        });
    } catch (error) {
        console.error('[Search API] 대량 인덱싱 실패:', error);
        res.status(500).json({
            success: false,
            message: '대량 인덱싱 중 오류가 발생했습니다'
        });
    }
});

/**
 * POST /api/search/reindex
 * 인덱스 재구성 (관리자 전용)
 */
router.post('/reindex', async (req, res) => {
    try {
        await searchService.reindex();

        res.json({
            success: true,
            message: '인덱스 재구성 완료'
        });
    } catch (error) {
        console.error('[Search API] 인덱스 재구성 실패:', error);
        res.status(500).json({
            success: false,
            message: '인덱스 재구성 중 오류가 발생했습니다'
        });
    }
});

export default router;
