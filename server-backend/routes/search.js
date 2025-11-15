/**
 * Search API Routes
 * 
 * Elasticsearch 검색 API 엔드포인트
 */

import express from 'express';
import elasticsearchService from '../services/elasticsearchService.js';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// ==================== 검색 API ====================

/**
 * POST /api/search/posts
 * 게시글 검색
 */
router.post('/posts', async (req, res) => {
    try {
        const { query, options } = req.body;

        const result = await elasticsearchService.searchPosts(query, options);

        res.json(result);
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({
            success: false,
            message: '검색에 실패했습니다',
            error: error.message
        });
    }
});

/**
 * POST /api/search/comments
 * 댓글 검색
 */
router.post('/comments', async (req, res) => {
    try {
        const { query, options } = req.body;

        const result = await elasticsearchService.searchComments(query, options);

        res.json(result);
    } catch (error) {
        console.error('Comment search error:', error);
        res.status(500).json({
            success: false,
            message: '댓글 검색에 실패했습니다',
            error: error.message
        });
    }
});

/**
 * GET /api/search/suggest
 * 자동완성 제안
 */
router.get('/suggest', async (req, res) => {
    try {
        const { q, field = 'title' } = req.query;

        if (!q || q.trim().length < 2) {
            return res.json({
                success: true,
                suggestions: []
            });
        }

        const result = await elasticsearchService.suggest(q, field);

        res.json(result);
    } catch (error) {
        console.error('Suggest error:', error);
        res.status(500).json({
            success: false,
            message: '자동완성에 실패했습니다',
            error: error.message
        });
    }
});

/**
 * GET /api/search/popular
 * 인기 검색어
 */
router.get('/popular', async (req, res) => {
    try {
        const { size = 10 } = req.query;

        const result = await elasticsearchService.getPopularSearchTerms(parseInt(size));

        res.json(result);
    } catch (error) {
        console.error('Popular terms error:', error);
        res.status(500).json({
            success: false,
            message: '인기 검색어 조회에 실패했습니다',
            error: error.message
        });
    }
});

/**
 * GET /api/search/similar/:postId
 * 유사 게시글 찾기
 */
router.get('/similar/:postId', async (req, res) => {
    try {
        const { postId } = req.params;
        const { size = 5 } = req.query;

        const result = await elasticsearchService.findSimilarPosts(postId, parseInt(size));

        res.json(result);
    } catch (error) {
        console.error('Similar posts error:', error);
        res.status(500).json({
            success: false,
            message: '유사 게시글 조회에 실패했습니다',
            error: error.message
        });
    }
});

// ==================== 인덱싱 API ====================

/**
 * POST /api/search/index/post/:id
 * 게시글 인덱싱
 */
router.post('/index/post/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const postData = req.body;

        const success = await elasticsearchService.indexPost({ id, ...postData });

        if (success) {
            res.json({
                success: true,
                message: '게시글이 인덱싱되었습니다'
            });
        } else {
            res.status(500).json({
                success: false,
                message: '게시글 인덱싱에 실패했습니다'
            });
        }
    } catch (error) {
        console.error('Index post error:', error);
        res.status(500).json({
            success: false,
            message: '게시글 인덱싱에 실패했습니다',
            error: error.message
        });
    }
});

/**
 * PUT /api/search/index/post/:id
 * 게시글 업데이트
 */
router.put('/index/post/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const success = await elasticsearchService.updatePost(id, updates);

        if (success) {
            res.json({
                success: true,
                message: '게시글이 업데이트되었습니다'
            });
        } else {
            res.status(500).json({
                success: false,
                message: '게시글 업데이트에 실패했습니다'
            });
        }
    } catch (error) {
        console.error('Update post error:', error);
        res.status(500).json({
            success: false,
            message: '게시글 업데이트에 실패했습니다',
            error: error.message
        });
    }
});

/**
 * DELETE /api/search/index/post/:id
 * 게시글 삭제
 */
router.delete('/index/post/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const success = await elasticsearchService.deletePost(id);

        if (success) {
            res.json({
                success: true,
                message: '게시글이 삭제되었습니다'
            });
        } else {
            res.status(500).json({
                success: false,
                message: '게시글 삭제에 실패했습니다'
            });
        }
    } catch (error) {
        console.error('Delete post error:', error);
        res.status(500).json({
            success: false,
            message: '게시글 삭제에 실패했습니다',
            error: error.message
        });
    }
});

/**
 * POST /api/search/index/post/bulk
 * 대량 게시글 인덱싱
 */
router.post('/index/post/bulk', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { posts } = req.body;

        if (!Array.isArray(posts)) {
            return res.status(400).json({
                success: false,
                message: 'posts 배열이 필요합니다'
            });
        }

        const success = await elasticsearchService.bulkIndexPosts(posts);

        if (success) {
            res.json({
                success: true,
                message: `${posts.length}개의 게시글이 인덱싱되었습니다`
            });
        } else {
            res.status(500).json({
                success: false,
                message: '대량 인덱싱에 실패했습니다'
            });
        }
    } catch (error) {
        console.error('Bulk index error:', error);
        res.status(500).json({
            success: false,
            message: '대량 인덱싱에 실패했습니다',
            error: error.message
        });
    }
});

/**
 * POST /api/search/index/comment/:id
 * 댓글 인덱싱
 */
router.post('/index/comment/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const commentData = req.body;

        const success = await elasticsearchService.indexComment({ id, ...commentData });

        if (success) {
            res.json({
                success: true,
                message: '댓글이 인덱싱되었습니다'
            });
        } else {
            res.status(500).json({
                success: false,
                message: '댓글 인덱싱에 실패했습니다'
            });
        }
    } catch (error) {
        console.error('Index comment error:', error);
        res.status(500).json({
            success: false,
            message: '댓글 인덱싱에 실패했습니다',
            error: error.message
        });
    }
});

/**
 * DELETE /api/search/index/comment/:id
 * 댓글 삭제
 */
router.delete('/index/comment/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const success = await elasticsearchService.deleteComment(id);

        if (success) {
            res.json({
                success: true,
                message: '댓글이 삭제되었습니다'
            });
        } else {
            res.status(500).json({
                success: false,
                message: '댓글 삭제에 실패했습니다'
            });
        }
    } catch (error) {
        console.error('Delete comment error:', error);
        res.status(500).json({
            success: false,
            message: '댓글 삭제에 실패했습니다',
            error: error.message
        });
    }
});

// ==================== 관리 API ====================

/**
 * GET /api/search/stats
 * 검색 통계
 */
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const stats = await elasticsearchService.getSearchStats();

        res.json(stats);
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({
            success: false,
            message: '통계 조회에 실패했습니다',
            error: error.message
        });
    }
});

/**
 * GET /api/search/health
 * 헬스체크
 */
router.get('/health', async (req, res) => {
    try {
        const health = await elasticsearchService.healthCheck();

        res.json(health);
    } catch (error) {
        console.error('Health check error:', error);
        res.status(500).json({
            status: 'unhealthy',
            error: error.message
        });
    }
});

export default router;
