const mysql = require('mysql2/promise');
const { performance } = require('perf_hooks');

class SearchService {
    constructor(dbConnection) {
        this.db = dbConnection;
        this.searchIndex = new Map();
        this.lastIndexUpdate = null;
    }

    // 검색 인덱스 구축
    async buildSearchIndex() {
        console.log('🔍 검색 인덱스 구축 시작...');
        const startTime = performance.now();

        try {
            // 게시글 인덱스 구축
            const posts = await this.db.execute(`
        SELECT 
          p.id,
          p.title,
          p.content,
          p.tags,
          p.category,
          p.created_at,
          p.view_count,
          p.like_count,
          u.username as author,
          b.name as board_name
        FROM posts p
        LEFT JOIN users u ON p.author_id = u.id
        LEFT JOIN boards b ON p.board_id = b.id
        WHERE p.is_published = 1 AND p.deleted_at IS NULL
      `);

            // 댓글 인덱스 구축
            const comments = await this.db.execute(`
        SELECT 
          c.id,
          c.content,
          c.created_at,
          u.username as author,
          p.title as post_title,
          p.id as post_id
        FROM comments c
        LEFT JOIN users u ON c.author_id = u.id
        LEFT JOIN posts p ON c.post_id = p.id
        WHERE c.is_deleted = 0 AND p.is_published = 1
      `);

            // 사용자 인덱스 구축
            const users = await this.db.execute(`
        SELECT 
          id,
          username,
          email,
          bio,
          created_at
        FROM users
        WHERE status = 'active'
      `);

            // 인덱스 데이터 구조화
            const indexData = {
                posts: posts[0].map(post => ({
                    id: post.id,
                    type: 'post',
                    title: post.title,
                    content: post.content,
                    tags: post.tags ? post.tags.split(',').map(tag => tag.trim()) : [],
                    category: post.category,
                    author: post.author,
                    boardName: post.board_name,
                    createdAt: post.created_at,
                    viewCount: post.view_count,
                    likeCount: post.like_count,
                    searchText: `${post.title} ${post.content} ${post.tags || ''} ${post.author}`.toLowerCase(),
                })),
                comments: comments[0].map(comment => ({
                    id: comment.id,
                    type: 'comment',
                    content: comment.content,
                    author: comment.author,
                    postTitle: comment.post_title,
                    postId: comment.post_id,
                    createdAt: comment.created_at,
                    searchText: `${comment.content} ${comment.author}`.toLowerCase(),
                })),
                users: users[0].map(user => ({
                    id: user.id,
                    type: 'user',
                    username: user.username,
                    email: user.email,
                    bio: user.bio,
                    createdAt: user.created_at,
                    searchText: `${user.username} ${user.email} ${user.bio || ''}`.toLowerCase(),
                })),
            };

            this.searchIndex = indexData;
            this.lastIndexUpdate = new Date();

            const endTime = performance.now();
            console.log(`✅ 검색 인덱스 구축 완료 (${(endTime - startTime).toFixed(2)}ms)`);

            return {
                success: true,
                indexedItems: {
                    posts: indexData.posts.length,
                    comments: indexData.comments.length,
                    users: indexData.users.length,
                },
                buildTime: endTime - startTime,
            };
        } catch (error) {
            console.error('❌ 검색 인덱스 구축 실패:', error);
            throw error;
        }
    }

    // 텍스트 검색
    async search(query, options = {}) {
        const {
            type = 'all', // 'all', 'posts', 'comments', 'users'
            limit = 20,
            offset = 0,
            sortBy = 'relevance', // 'relevance', 'date', 'popularity'
            includeDeleted = false,
        } = options;

        if (!query || query.trim().length < 2) {
            return { results: [], total: 0, query };
        }

        const searchTerms = query.toLowerCase().trim().split(/\s+/);
        const results = [];

        // 인덱스가 없으면 구축
        if (!this.searchIndex || Object.keys(this.searchIndex).length === 0) {
            await this.buildSearchIndex();
        }

        // 검색 대상 결정
        const searchTargets = type === 'all'
            ? ['posts', 'comments', 'users']
            : [type];

        for (const target of searchTargets) {
            if (!this.searchIndex[target]) continue;

            for (const item of this.searchIndex[target]) {
                const score = this.calculateRelevanceScore(item, searchTerms);

                if (score > 0) {
                    results.push({
                        ...item,
                        relevanceScore: score,
                        matchedTerms: this.getMatchedTerms(item, searchTerms),
                    });
                }
            }
        }

        // 정렬
        results.sort((a, b) => {
            switch (sortBy) {
                case 'date':
                    return new Date(b.createdAt) - new Date(a.createdAt);
                case 'popularity':
                    return (b.viewCount || 0) - (a.viewCount || 0);
                case 'relevance':
                default:
                    return b.relevanceScore - a.relevanceScore;
            }
        });

        // 페이지네이션
        const total = results.length;
        const paginatedResults = results.slice(offset, offset + limit);

        return {
            results: paginatedResults,
            total,
            query,
            type,
            sortBy,
            pagination: {
                limit,
                offset,
                hasMore: offset + limit < total,
            },
        };
    }

    // 관련성 점수 계산
    calculateRelevanceScore(item, searchTerms) {
        let score = 0;
        const searchText = item.searchText;

        for (const term of searchTerms) {
            // 정확한 일치 (높은 점수)
            if (searchText.includes(term)) {
                score += 10;
            }

            // 제목에서 일치 (더 높은 점수)
            if (item.title && item.title.toLowerCase().includes(term)) {
                score += 20;
            }

            // 태그에서 일치
            if (item.tags && item.tags.some(tag => tag.toLowerCase().includes(term))) {
                score += 15;
            }

            // 작성자에서 일치
            if (item.author && item.author.toLowerCase().includes(term)) {
                score += 12;
            }

            // 부분 일치 (낮은 점수)
            const words = searchText.split(/\s+/);
            for (const word of words) {
                if (word.startsWith(term)) {
                    score += 5;
                } else if (word.includes(term)) {
                    score += 2;
                }
            }
        }

        // 인기도 보너스
        if (item.viewCount) {
            score += Math.log(item.viewCount + 1) * 0.5;
        }

        if (item.likeCount) {
            score += Math.log(item.likeCount + 1) * 0.3;
        }

        return score;
    }

    // 매칭된 용어 추출
    getMatchedTerms(item, searchTerms) {
        const matchedTerms = [];
        const searchText = item.searchText;

        for (const term of searchTerms) {
            if (searchText.includes(term)) {
                matchedTerms.push(term);
            }
        }

        return matchedTerms;
    }

    // 자동완성 제안
    async getSuggestions(query, limit = 10) {
        if (!query || query.trim().length < 1) {
            return [];
        }

        const suggestions = new Set();
        const searchTerms = query.toLowerCase().trim();

        // 인덱스가 없으면 구축
        if (!this.searchIndex || Object.keys(this.searchIndex).length === 0) {
            await this.buildSearchIndex();
        }

        // 제목에서 제안 추출
        for (const post of this.searchIndex.posts || []) {
            if (post.title.toLowerCase().includes(searchTerms)) {
                suggestions.add(post.title);
            }
        }

        // 태그에서 제안 추출
        for (const post of this.searchIndex.posts || []) {
            if (post.tags) {
                for (const tag of post.tags) {
                    if (tag.toLowerCase().includes(searchTerms)) {
                        suggestions.add(tag);
                    }
                }
            }
        }

        // 사용자명에서 제안 추출
        for (const user of this.searchIndex.users || []) {
            if (user.username.toLowerCase().includes(searchTerms)) {
                suggestions.add(user.username);
            }
        }

        return Array.from(suggestions).slice(0, limit);
    }

    // 인기 검색어
    async getPopularSearches(limit = 10) {
        try {
            const [rows] = await this.db.execute(`
        SELECT 
          search_term,
          COUNT(*) as search_count,
          MAX(created_at) as last_searched
        FROM search_logs
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        GROUP BY search_term
        ORDER BY search_count DESC, last_searched DESC
        LIMIT ?
      `, [limit]);

            return rows;
        } catch (error) {
            console.error('인기 검색어 조회 실패:', error);
            return [];
        }
    }

    // 검색 로그 기록
    async logSearch(query, userId = null, resultsCount = 0) {
        try {
            await this.db.execute(`
        INSERT INTO search_logs (search_term, user_id, results_count, created_at)
        VALUES (?, ?, ?, NOW())
      `, [query, userId, resultsCount]);
        } catch (error) {
            console.error('검색 로그 기록 실패:', error);
        }
    }

    // 검색 통계
    async getSearchStats() {
        try {
            const [stats] = await this.db.execute(`
        SELECT 
          COUNT(*) as total_searches,
          COUNT(DISTINCT user_id) as unique_users,
          AVG(results_count) as avg_results,
          MAX(created_at) as last_search
        FROM search_logs
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      `);

            return stats[0];
        } catch (error) {
            console.error('검색 통계 조회 실패:', error);
            return null;
        }
    }

    // 인덱스 새로고침
    async refreshIndex() {
        console.log('🔄 검색 인덱스 새로고침...');
        return await this.buildSearchIndex();
    }

    // 인덱스 상태 확인
    getIndexStatus() {
        return {
            lastUpdate: this.lastIndexUpdate,
            indexedItems: {
                posts: this.searchIndex.posts?.length || 0,
                comments: this.searchIndex.comments?.length || 0,
                users: this.searchIndex.users?.length || 0,
            },
            isStale: this.lastIndexUpdate
                ? Date.now() - this.lastIndexUpdate.getTime() > 3600000 // 1시간
                : true,
        };
    }
}

module.exports = SearchService;
