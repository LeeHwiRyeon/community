/**
 * 고급 검색 서비스
 * Elasticsearch를 사용한 전문 검색, 자동완성, 필터링
 */

import { Client } from '@elastic/elasticsearch';

class SearchService {
    constructor() {
        this.client = new Client({
            node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200'
        });
        this.postsIndex = 'community_posts';
        this.usersIndex = 'community_users';
        this.initialized = false;
    }

    /**
     * Elasticsearch 연결 및 인덱스 초기화
     */
    async initialize() {
        if (this.initialized) return;

        try {
            // 연결 테스트
            const health = await this.client.cluster.health();
            console.log('[SearchService] Elasticsearch 연결 성공:', health.status);

            // 게시물 인덱스 생성
            await this.createPostsIndex();

            // 사용자 인덱스 생성
            await this.createUsersIndex();

            this.initialized = true;
            console.log('[SearchService] 인덱스 초기화 완료');
        } catch (error) {
            console.error('[SearchService] 초기화 실패:', error.message);
            throw error;
        }
    }

    /**
     * 게시물 인덱스 생성
     */
    async createPostsIndex() {
        const indexExists = await this.client.indices.exists({
            index: this.postsIndex
        });

        if (!indexExists) {
            await this.client.indices.create({
                index: this.postsIndex,
                body: {
                    settings: {
                        analysis: {
                            analyzer: {
                                korean_analyzer: {
                                    type: 'custom',
                                    tokenizer: 'standard',
                                    filter: ['lowercase', 'trim']
                                }
                            }
                        },
                        max_result_window: 10000
                    },
                    mappings: {
                        properties: {
                            id: { type: 'integer' },
                            title: {
                                type: 'text',
                                analyzer: 'korean_analyzer',
                                fields: {
                                    keyword: { type: 'keyword' }
                                }
                            },
                            content: {
                                type: 'text',
                                analyzer: 'korean_analyzer'
                            },
                            category: { type: 'keyword' },
                            tags: { type: 'keyword' },
                            author_id: { type: 'integer' },
                            author_name: {
                                type: 'text',
                                fields: {
                                    keyword: { type: 'keyword' }
                                }
                            },
                            view_count: { type: 'integer' },
                            like_count: { type: 'integer' },
                            comment_count: { type: 'integer' },
                            created_at: { type: 'date' },
                            updated_at: { type: 'date' }
                        }
                    }
                }
            });
            console.log('[SearchService] 게시물 인덱스 생성 완료');
        }
    }

    /**
     * 사용자 인덱스 생성
     */
    async createUsersIndex() {
        const indexExists = await this.client.indices.exists({
            index: this.usersIndex
        });

        if (!indexExists) {
            await this.client.indices.create({
                index: this.usersIndex,
                body: {
                    settings: {
                        analysis: {
                            analyzer: {
                                korean_analyzer: {
                                    type: 'custom',
                                    tokenizer: 'standard',
                                    filter: ['lowercase', 'trim']
                                }
                            }
                        }
                    },
                    mappings: {
                        properties: {
                            id: { type: 'integer' },
                            username: {
                                type: 'text',
                                analyzer: 'korean_analyzer',
                                fields: {
                                    keyword: { type: 'keyword' }
                                }
                            },
                            email: { type: 'keyword' },
                            bio: {
                                type: 'text',
                                analyzer: 'korean_analyzer'
                            },
                            created_at: { type: 'date' }
                        }
                    }
                }
            });
            console.log('[SearchService] 사용자 인덱스 생성 완료');
        }
    }

    /**
     * 게시물 인덱싱
     * @param {Object} post - 게시물 데이터
     */
    async indexPost(post) {
        try {
            await this.client.index({
                index: this.postsIndex,
                id: post.id.toString(),
                document: {
                    id: post.id,
                    title: post.title,
                    content: post.content,
                    category: post.category,
                    tags: post.tags || [],
                    author_id: post.author_id,
                    author_name: post.author_name,
                    view_count: post.view_count || 0,
                    like_count: post.like_count || 0,
                    comment_count: post.comment_count || 0,
                    created_at: post.created_at,
                    updated_at: post.updated_at
                }
            });
            console.log(`[SearchService] 게시물 인덱싱 완료: ${post.id}`);
        } catch (error) {
            console.error('[SearchService] 게시물 인덱싱 실패:', error.message);
            throw error;
        }
    }

    /**
     * 사용자 인덱싱
     * @param {Object} user - 사용자 데이터
     */
    async indexUser(user) {
        try {
            await this.client.index({
                index: this.usersIndex,
                id: user.id.toString(),
                document: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    bio: user.bio || '',
                    created_at: user.created_at
                }
            });
            console.log(`[SearchService] 사용자 인덱싱 완료: ${user.id}`);
        } catch (error) {
            console.error('[SearchService] 사용자 인덱싱 실패:', error.message);
            throw error;
        }
    }

    /**
     * 게시물 삭제
     * @param {number} postId - 게시물 ID
     */
    async deletePost(postId) {
        try {
            await this.client.delete({
                index: this.postsIndex,
                id: postId.toString()
            });
            console.log(`[SearchService] 게시물 삭제 완료: ${postId}`);
        } catch (error) {
            if (error.meta?.body?.result !== 'not_found') {
                console.error('[SearchService] 게시물 삭제 실패:', error.message);
            }
        }
    }

    /**
     * 게시물 검색
     * @param {Object} options - 검색 옵션
     * @returns {Promise<Object>} 검색 결과
     */
    async searchPosts({
        query = '',
        category = null,
        tags = [],
        author = null,
        dateFrom = null,
        dateTo = null,
        sortBy = 'relevance', // relevance, date, views, likes
        page = 1,
        limit = 20
    }) {
        try {
            const must = [];
            const filter = [];

            // 전문 검색 (제목 + 내용)
            if (query) {
                must.push({
                    multi_match: {
                        query: query,
                        fields: ['title^3', 'content', 'author_name'],
                        type: 'best_fields',
                        fuzziness: 'AUTO'
                    }
                });
            }

            // 카테고리 필터
            if (category) {
                filter.push({ term: { category } });
            }

            // 태그 필터
            if (tags.length > 0) {
                filter.push({ terms: { tags } });
            }

            // 작성자 필터
            if (author) {
                filter.push({
                    match: {
                        'author_name.keyword': author
                    }
                });
            }

            // 날짜 필터
            if (dateFrom || dateTo) {
                const range = {};
                if (dateFrom) range.gte = dateFrom;
                if (dateTo) range.lte = dateTo;
                filter.push({
                    range: {
                        created_at: range
                    }
                });
            }

            // 정렬 옵션
            let sort = [];
            switch (sortBy) {
                case 'date':
                    sort = [{ created_at: 'desc' }];
                    break;
                case 'views':
                    sort = [{ view_count: 'desc' }];
                    break;
                case 'likes':
                    sort = [{ like_count: 'desc' }];
                    break;
                case 'relevance':
                default:
                    sort = ['_score', { created_at: 'desc' }];
            }

            const from = (page - 1) * limit;

            const result = await this.client.search({
                index: this.postsIndex,
                body: {
                    query: {
                        bool: {
                            must: must.length > 0 ? must : [{ match_all: {} }],
                            filter
                        }
                    },
                    sort,
                    from,
                    size: limit,
                    highlight: {
                        fields: {
                            title: {},
                            content: {}
                        },
                        pre_tags: ['<mark>'],
                        post_tags: ['</mark>']
                    }
                }
            });

            return {
                total: result.hits.total.value,
                posts: result.hits.hits.map(hit => ({
                    ...hit._source,
                    score: hit._score,
                    highlights: hit.highlight
                })),
                page,
                totalPages: Math.ceil(result.hits.total.value / limit)
            };
        } catch (error) {
            console.error('[SearchService] 게시물 검색 실패:', error.message);
            throw error;
        }
    }

    /**
     * 사용자 검색
     * @param {string} query - 검색어
     * @param {number} limit - 결과 수
     * @returns {Promise<Array>} 검색 결과
     */
    async searchUsers(query, limit = 10) {
        try {
            const result = await this.client.search({
                index: this.usersIndex,
                body: {
                    query: {
                        multi_match: {
                            query,
                            fields: ['username^2', 'bio'],
                            type: 'best_fields',
                            fuzziness: 'AUTO'
                        }
                    },
                    size: limit
                }
            });

            return result.hits.hits.map(hit => hit._source);
        } catch (error) {
            console.error('[SearchService] 사용자 검색 실패:', error.message);
            throw error;
        }
    }

    /**
     * 자동완성 검색
     * @param {string} query - 검색어
     * @param {number} limit - 결과 수
     * @returns {Promise<Array>} 자동완성 제안
     */
    async autocomplete(query, limit = 5) {
        try {
            const result = await this.client.search({
                index: this.postsIndex,
                body: {
                    query: {
                        multi_match: {
                            query,
                            fields: ['title^3', 'tags^2'],
                            type: 'bool_prefix'
                        }
                    },
                    size: limit,
                    _source: ['id', 'title', 'category']
                }
            });

            return result.hits.hits.map(hit => ({
                id: hit._source.id,
                title: hit._source.title,
                category: hit._source.category
            }));
        } catch (error) {
            console.error('[SearchService] 자동완성 실패:', error.message);
            throw error;
        }
    }

    /**
     * 인기 검색어 가져오기
     * @param {number} limit - 결과 수
     * @returns {Promise<Array>} 인기 검색어 목록
     */
    async getPopularSearchTerms(limit = 10) {
        try {
            // 실제로는 검색 로그를 별도로 저장하고 분석해야 함
            // 여기서는 인기 태그로 대체
            const result = await this.client.search({
                index: this.postsIndex,
                body: {
                    size: 0,
                    aggs: {
                        popular_tags: {
                            terms: {
                                field: 'tags',
                                size: limit
                            }
                        }
                    }
                }
            });

            return result.aggregations.popular_tags.buckets.map(bucket => ({
                term: bucket.key,
                count: bucket.doc_count
            }));
        } catch (error) {
            console.error('[SearchService] 인기 검색어 조회 실패:', error.message);
            return [];
        }
    }

    /**
     * 대량 게시물 인덱싱 (초기 데이터 마이그레이션용)
     * @param {Array} posts - 게시물 배열
     */
    async bulkIndexPosts(posts) {
        try {
            const body = posts.flatMap(post => [
                { index: { _index: this.postsIndex, _id: post.id.toString() } },
                {
                    id: post.id,
                    title: post.title,
                    content: post.content,
                    category: post.category,
                    tags: post.tags || [],
                    author_id: post.author_id,
                    author_name: post.author_name,
                    view_count: post.view_count || 0,
                    like_count: post.like_count || 0,
                    comment_count: post.comment_count || 0,
                    created_at: post.created_at,
                    updated_at: post.updated_at
                }
            ]);

            const result = await this.client.bulk({ body });

            if (result.errors) {
                console.error('[SearchService] 일부 게시물 인덱싱 실패');
            } else {
                console.log(`[SearchService] ${posts.length}개 게시물 대량 인덱싱 완료`);
            }

            return result;
        } catch (error) {
            console.error('[SearchService] 대량 인덱싱 실패:', error.message);
            throw error;
        }
    }

    /**
     * 인덱스 재구성
     */
    async reindex() {
        try {
            // 기존 인덱스 삭제
            await this.client.indices.delete({
                index: [this.postsIndex, this.usersIndex],
                ignore_unavailable: true
            });

            // 인덱스 재생성
            this.initialized = false;
            await this.initialize();

            console.log('[SearchService] 인덱스 재구성 완료');
        } catch (error) {
            console.error('[SearchService] 인덱스 재구성 실패:', error.message);
            throw error;
        }
    }
}

// 싱글톤 인스턴스
const searchService = new SearchService();

export default searchService;
