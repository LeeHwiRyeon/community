/**
 * Elasticsearch Service
 * 
 * Elasticsearch 검색 및 인덱싱 서비스
 * - 게시글/댓글 인덱싱
 * - 전문 검색 (Full-text search)
 * - 자동완성
 * - 필터링 및 정렬
 * - 하이라이팅
 */

import elasticsearchClient from '../config/elasticsearchClient.js';

class ElasticsearchService {
    constructor() {
        this.indices = elasticsearchClient.indices;
    }

    // ==================== 게시글 인덱싱 ====================

    /**
     * 게시글 인덱싱
     */
    async indexPost(postData) {
        try {
            const client = elasticsearchClient.getClient();

            const document = {
                id: postData.id,
                board_id: postData.board_id,
                user_id: postData.user_id,
                username: postData.username || '',
                title: postData.title,
                content: postData.content,
                tags: postData.tags || [],
                category: postData.category || '',
                is_published: postData.is_published !== false,
                is_pinned: postData.is_pinned || false,
                view_count: postData.view_count || 0,
                like_count: postData.like_count || 0,
                comment_count: postData.comment_count || 0,
                created_at: postData.created_at || new Date().toISOString(),
                updated_at: postData.updated_at || new Date().toISOString()
            };

            await client.index({
                index: this.indices.posts,
                id: postData.id,
                document
            });

            console.log(`✅ Indexed post: ${postData.id}`);
            return true;
        } catch (error) {
            console.error(`❌ Failed to index post ${postData.id}:`, error.message);
            return false;
        }
    }

    /**
     * 게시글 업데이트
     */
    async updatePost(postId, updates) {
        try {
            const client = elasticsearchClient.getClient();

            await client.update({
                index: this.indices.posts,
                id: postId,
                doc: {
                    ...updates,
                    updated_at: new Date().toISOString()
                }
            });

            console.log(`✅ Updated post: ${postId}`);
            return true;
        } catch (error) {
            console.error(`❌ Failed to update post ${postId}:`, error.message);
            return false;
        }
    }

    /**
     * 게시글 삭제
     */
    async deletePost(postId) {
        try {
            const client = elasticsearchClient.getClient();

            await client.delete({
                index: this.indices.posts,
                id: postId
            });

            console.log(`✅ Deleted post: ${postId}`);
            return true;
        } catch (error) {
            console.error(`❌ Failed to delete post ${postId}:`, error.message);
            return false;
        }
    }

    /**
     * 대량 게시글 인덱싱
     */
    async bulkIndexPosts(posts) {
        try {
            const client = elasticsearchClient.getClient();

            const operations = posts.flatMap(post => [
                { index: { _index: this.indices.posts, _id: post.id } },
                {
                    id: post.id,
                    board_id: post.board_id,
                    user_id: post.user_id,
                    username: post.username || '',
                    title: post.title,
                    content: post.content,
                    tags: post.tags || [],
                    category: post.category || '',
                    is_published: post.is_published !== false,
                    is_pinned: post.is_pinned || false,
                    view_count: post.view_count || 0,
                    like_count: post.like_count || 0,
                    comment_count: post.comment_count || 0,
                    created_at: post.created_at || new Date().toISOString(),
                    updated_at: post.updated_at || new Date().toISOString()
                }
            ]);

            const result = await client.bulk({ operations });

            if (result.errors) {
                console.error('❌ Bulk indexing had errors');
                return false;
            }

            console.log(`✅ Bulk indexed ${posts.length} posts`);
            return true;
        } catch (error) {
            console.error('❌ Bulk indexing failed:', error.message);
            return false;
        }
    }

    // ==================== 댓글 인덱싱 ====================

    /**
     * 댓글 인덱싱
     */
    async indexComment(commentData) {
        try {
            const client = elasticsearchClient.getClient();

            const document = {
                id: commentData.id,
                post_id: commentData.post_id,
                user_id: commentData.user_id,
                username: commentData.username || '',
                content: commentData.content,
                parent_id: commentData.parent_id || null,
                is_deleted: commentData.is_deleted || false,
                created_at: commentData.created_at || new Date().toISOString(),
                updated_at: commentData.updated_at || new Date().toISOString()
            };

            await client.index({
                index: this.indices.comments,
                id: commentData.id,
                document
            });

            console.log(`✅ Indexed comment: ${commentData.id}`);
            return true;
        } catch (error) {
            console.error(`❌ Failed to index comment ${commentData.id}:`, error.message);
            return false;
        }
    }

    /**
     * 댓글 삭제
     */
    async deleteComment(commentId) {
        try {
            const client = elasticsearchClient.getClient();

            await client.delete({
                index: this.indices.comments,
                id: commentId
            });

            console.log(`✅ Deleted comment: ${commentId}`);
            return true;
        } catch (error) {
            console.error(`❌ Failed to delete comment ${commentId}:`, error.message);
            return false;
        }
    }

    // ==================== 검색 기능 ====================

    /**
     * 게시글 검색 (전문 검색)
     */
    async searchPosts(query, options = {}) {
        try {
            const client = elasticsearchClient.getClient();

            const {
                boardId = null,
                userId = null,
                tags = [],
                category = null,
                sortBy = 'relevance', // relevance, date, views, likes
                page = 1,
                limit = 20,
                highlightFields = ['title', 'content']
            } = options;

            // 검색 쿼리 구성
            const must = [];
            const filter = [];

            // 텍스트 검색
            if (query && query.trim()) {
                must.push({
                    multi_match: {
                        query: query,
                        fields: ['title^3', 'content'],
                        type: 'best_fields',
                        fuzziness: 'AUTO'
                    }
                });
            }

            // 필터 조건
            if (boardId) {
                filter.push({ term: { board_id: boardId } });
            }

            if (userId) {
                filter.push({ term: { user_id: userId } });
            }

            if (tags.length > 0) {
                filter.push({ terms: { tags: tags } });
            }

            if (category) {
                filter.push({ term: { category: category } });
            }

            // 발행된 게시글만
            filter.push({ term: { is_published: true } });

            // 정렬 기준
            let sort = [];
            switch (sortBy) {
                case 'date':
                    sort = [{ created_at: 'desc' }];
                    break;
                case 'views':
                    sort = [{ view_count: 'desc' }, { created_at: 'desc' }];
                    break;
                case 'likes':
                    sort = [{ like_count: 'desc' }, { created_at: 'desc' }];
                    break;
                case 'relevance':
                default:
                    sort = ['_score', { created_at: 'desc' }];
                    break;
            }

            // 검색 실행
            const result = await client.search({
                index: this.indices.posts,
                from: (page - 1) * limit,
                size: limit,
                query: {
                    bool: {
                        must: must.length > 0 ? must : [{ match_all: {} }],
                        filter: filter
                    }
                },
                sort: sort,
                highlight: {
                    fields: highlightFields.reduce((acc, field) => {
                        acc[field] = {
                            pre_tags: ['<mark>'],
                            post_tags: ['</mark>'],
                            fragment_size: 150,
                            number_of_fragments: 3
                        };
                        return acc;
                    }, {})
                },
                track_total_hits: true
            });

            // 결과 포맷팅
            const hits = result.hits.hits.map(hit => ({
                ...hit._source,
                score: hit._score,
                highlights: hit.highlight || {}
            }));

            return {
                success: true,
                total: result.hits.total.value,
                hits,
                page,
                limit,
                pages: Math.ceil(result.hits.total.value / limit)
            };
        } catch (error) {
            console.error('❌ Search failed:', error.message);
            return {
                success: false,
                error: error.message,
                total: 0,
                hits: [],
                page,
                limit,
                pages: 0
            };
        }
    }

    /**
     * 댓글 검색
     */
    async searchComments(query, options = {}) {
        try {
            const client = elasticsearchClient.getClient();

            const {
                postId = null,
                userId = null,
                page = 1,
                limit = 20
            } = options;

            const must = [];
            const filter = [];

            // 텍스트 검색
            if (query && query.trim()) {
                must.push({
                    match: {
                        content: {
                            query: query,
                            fuzziness: 'AUTO'
                        }
                    }
                });
            }

            // 필터
            if (postId) {
                filter.push({ term: { post_id: postId } });
            }

            if (userId) {
                filter.push({ term: { user_id: userId } });
            }

            filter.push({ term: { is_deleted: false } });

            const result = await client.search({
                index: this.indices.comments,
                from: (page - 1) * limit,
                size: limit,
                query: {
                    bool: {
                        must: must.length > 0 ? must : [{ match_all: {} }],
                        filter: filter
                    }
                },
                sort: [{ created_at: 'desc' }],
                highlight: {
                    fields: {
                        content: {
                            pre_tags: ['<mark>'],
                            post_tags: ['</mark>']
                        }
                    }
                }
            });

            const hits = result.hits.hits.map(hit => ({
                ...hit._source,
                score: hit._score,
                highlights: hit.highlight || {}
            }));

            return {
                success: true,
                total: result.hits.total.value,
                hits,
                page,
                limit,
                pages: Math.ceil(result.hits.total.value / limit)
            };
        } catch (error) {
            console.error('❌ Comment search failed:', error.message);
            return {
                success: false,
                error: error.message,
                total: 0,
                hits: [],
                page,
                limit,
                pages: 0
            };
        }
    }

    /**
     * 자동완성 제안
     */
    async suggest(query, field = 'title') {
        try {
            const client = elasticsearchClient.getClient();

            const result = await client.search({
                index: this.indices.posts,
                size: 10,
                query: {
                    bool: {
                        must: [
                            {
                                match_phrase_prefix: {
                                    [field]: {
                                        query: query,
                                        max_expansions: 10
                                    }
                                }
                            }
                        ],
                        filter: [
                            { term: { is_published: true } }
                        ]
                    }
                },
                _source: [field],
                sort: [
                    { view_count: 'desc' },
                    { like_count: 'desc' }
                ]
            });

            const suggestions = result.hits.hits.map(hit => hit._source[field]);

            return {
                success: true,
                suggestions: [...new Set(suggestions)] // 중복 제거
            };
        } catch (error) {
            console.error('❌ Suggestion failed:', error.message);
            return {
                success: false,
                suggestions: []
            };
        }
    }

    /**
     * 인기 검색어
     */
    async getPopularSearchTerms(size = 10) {
        try {
            const client = elasticsearchClient.getClient();

            const result = await client.search({
                index: this.indices.posts,
                size: 0,
                aggs: {
                    popular_tags: {
                        terms: {
                            field: 'tags',
                            size: size,
                            order: { _count: 'desc' }
                        }
                    }
                }
            });

            const terms = result.aggregations.popular_tags.buckets.map(bucket => ({
                term: bucket.key,
                count: bucket.doc_count
            }));

            return {
                success: true,
                terms
            };
        } catch (error) {
            console.error('❌ Popular terms failed:', error.message);
            return {
                success: false,
                terms: []
            };
        }
    }

    /**
     * 유사 게시글 찾기
     */
    async findSimilarPosts(postId, size = 5) {
        try {
            const client = elasticsearchClient.getClient();

            const result = await client.search({
                index: this.indices.posts,
                size: size,
                query: {
                    bool: {
                        must: [
                            {
                                more_like_this: {
                                    fields: ['title', 'content', 'tags'],
                                    like: [
                                        {
                                            _index: this.indices.posts,
                                            _id: postId
                                        }
                                    ],
                                    min_term_freq: 1,
                                    max_query_terms: 12
                                }
                            }
                        ],
                        filter: [
                            { term: { is_published: true } }
                        ],
                        must_not: [
                            { term: { id: postId } }
                        ]
                    }
                }
            });

            const similar = result.hits.hits.map(hit => ({
                ...hit._source,
                score: hit._score
            }));

            return {
                success: true,
                similar
            };
        } catch (error) {
            console.error('❌ Similar posts failed:', error.message);
            return {
                success: false,
                similar: []
            };
        }
    }

    // ==================== 통계 ====================

    /**
     * 검색 통계
     */
    async getSearchStats() {
        try {
            const client = elasticsearchClient.getClient();

            const postsCount = await client.count({
                index: this.indices.posts
            });

            const commentsCount = await client.count({
                index: this.indices.comments
            });

            return {
                success: true,
                posts: postsCount.count,
                comments: commentsCount.count
            };
        } catch (error) {
            console.error('❌ Search stats failed:', error.message);
            return {
                success: false,
                posts: 0,
                comments: 0
            };
        }
    }

    /**
     * 헬스체크
     */
    async healthCheck() {
        try {
            const health = await elasticsearchClient.getClusterHealth();

            return {
                status: 'healthy',
                cluster_status: health.status,
                indices: {
                    posts: this.indices.posts,
                    comments: this.indices.comments
                }
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                error: error.message
            };
        }
    }
}

// 싱글톤 인스턴스 생성
const elasticsearchService = new ElasticsearchService();

export default elasticsearchService;
