const mysql = require('mysql2/promise');

class RecommendationService {
    constructor(dbConnection) {
        this.db = dbConnection;
        this.userPreferences = new Map();
        this.itemSimilarity = new Map();
    }

    // 사용자 기반 추천 (Collaborative Filtering)
    async getUserBasedRecommendations(userId, limit = 10) {
        try {
            // 사용자의 활동 패턴 분석
            const userActivity = await this.analyzeUserActivity(userId);

            // 유사한 사용자 찾기
            const similarUsers = await this.findSimilarUsers(userId, userActivity);

            // 추천 아이템 생성
            const recommendations = await this.generateRecommendationsFromUsers(
                userId,
                similarUsers,
                limit
            );

            return {
                type: 'user_based',
                recommendations,
                confidence: this.calculateConfidence(recommendations),
            };
        } catch (error) {
            console.error('사용자 기반 추천 실패:', error);
            throw error;
        }
    }

    // 콘텐츠 기반 추천 (Content-Based Filtering)
    async getContentBasedRecommendations(userId, limit = 10) {
        try {
            // 사용자가 좋아하는 콘텐츠 분석
            const userPreferences = await this.analyzeUserPreferences(userId);

            // 유사한 콘텐츠 찾기
            const similarContent = await this.findSimilarContent(userPreferences, limit);

            return {
                type: 'content_based',
                recommendations: similarContent,
                confidence: this.calculateConfidence(similarContent),
            };
        } catch (error) {
            console.error('콘텐츠 기반 추천 실패:', error);
            throw error;
        }
    }

    // 하이브리드 추천
    async getHybridRecommendations(userId, limit = 10) {
        try {
            const [userBased, contentBased] = await Promise.all([
                this.getUserBasedRecommendations(userId, limit),
                this.getContentBasedRecommendations(userId, limit),
            ]);

            // 가중 평균으로 결합
            const hybridRecommendations = this.combineRecommendations(
                userBased.recommendations,
                contentBased.recommendations,
                { userWeight: 0.6, contentWeight: 0.4 }
            );

            return {
                type: 'hybrid',
                recommendations: hybridRecommendations.slice(0, limit),
                confidence: this.calculateConfidence(hybridRecommendations),
                sources: {
                    userBased: userBased.confidence,
                    contentBased: contentBased.confidence,
                },
            };
        } catch (error) {
            console.error('하이브리드 추천 실패:', error);
            throw error;
        }
    }

    // 사용자 활동 분석
    async analyzeUserActivity(userId) {
        try {
            const [likes] = await this.db.execute(`
        SELECT 
          p.id,
          p.title,
          p.category,
          p.tags,
          p.created_at,
          pl.created_at as liked_at
        FROM posts p
        JOIN post_likes pl ON p.id = pl.post_id
        WHERE pl.user_id = ? AND p.is_published = 1
        ORDER BY pl.created_at DESC
        LIMIT 100
      `, [userId]);

            const [comments] = await this.db.execute(`
        SELECT 
          p.id,
          p.title,
          p.category,
          p.tags,
          p.created_at,
          c.created_at as commented_at
        FROM posts p
        JOIN comments c ON p.id = c.post_id
        WHERE c.author_id = ? AND c.is_deleted = 0 AND p.is_published = 1
        ORDER BY c.created_at DESC
        LIMIT 100
      `, [userId]);

            const [views] = await this.db.execute(`
        SELECT 
          p.id,
          p.title,
          p.category,
          p.tags,
          p.created_at,
          pv.created_at as viewed_at
        FROM posts p
        JOIN post_views pv ON p.id = pv.post_id
        WHERE pv.user_id = ? AND p.is_published = 1
        ORDER BY pv.created_at DESC
        LIMIT 100
      `, [userId]);

            return {
                likes: likes.map(like => ({
                    ...like,
                    tags: like.tags ? like.tags.split(',').map(tag => tag.trim()) : [],
                    weight: 3, // 좋아요는 높은 가중치
                })),
                comments: comments.map(comment => ({
                    ...comment,
                    tags: comment.tags ? comment.tags.split(',').map(tag => tag.trim()) : [],
                    weight: 2, // 댓글은 중간 가중치
                })),
                views: views.map(view => ({
                    ...view,
                    tags: view.tags ? view.tags.split(',').map(tag => tag.trim()) : [],
                    weight: 1, // 조회는 낮은 가중치
                })),
            };
        } catch (error) {
            console.error('사용자 활동 분석 실패:', error);
            throw error;
        }
    }

    // 유사한 사용자 찾기
    async findSimilarUsers(userId, userActivity) {
        try {
            const allUsers = await this.db.execute(`
        SELECT DISTINCT u.id, u.username
        FROM users u
        WHERE u.id != ? AND u.status = 'active'
      `, [userId]);

            const similarities = [];

            for (const user of allUsers[0]) {
                const similarity = await this.calculateUserSimilarity(userId, user.id, userActivity);
                if (similarity > 0.1) { // 임계값 설정
                    similarities.push({
                        userId: user.id,
                        username: user.username,
                        similarity,
                    });
                }
            }

            return similarities.sort((a, b) => b.similarity - a.similarity).slice(0, 20);
        } catch (error) {
            console.error('유사한 사용자 찾기 실패:', error);
            return [];
        }
    }

    // 사용자 유사도 계산 (코사인 유사도)
    async calculateUserSimilarity(userId1, userId2, userActivity1) {
        try {
            const userActivity2 = await this.analyzeUserActivity(userId2);

            // 공통 아이템 찾기
            const commonItems = this.findCommonItems(userActivity1, userActivity2);

            if (commonItems.length === 0) return 0;

            // 가중치 벡터 생성
            const vector1 = this.createUserVector(userActivity1, commonItems);
            const vector2 = this.createUserVector(userActivity2, commonItems);

            // 코사인 유사도 계산
            return this.cosineSimilarity(vector1, vector2);
        } catch (error) {
            console.error('사용자 유사도 계산 실패:', error);
            return 0;
        }
    }

    // 사용자 선호도 분석
    async analyzeUserPreferences(userId) {
        try {
            const activity = await this.analyzeUserActivity(userId);

            // 카테고리 선호도
            const categoryPreferences = {};
            const tagPreferences = {};

            const allItems = [...activity.likes, ...activity.comments, ...activity.views];

            allItems.forEach(item => {
                // 카테고리 가중치
                if (item.category) {
                    categoryPreferences[item.category] =
                        (categoryPreferences[item.category] || 0) + item.weight;
                }

                // 태그 가중치
                if (item.tags) {
                    item.tags.forEach(tag => {
                        tagPreferences[tag] = (tagPreferences[tag] || 0) + item.weight;
                    });
                }
            });

            return {
                categories: categoryPreferences,
                tags: tagPreferences,
                totalItems: allItems.length,
            };
        } catch (error) {
            console.error('사용자 선호도 분석 실패:', error);
            return { categories: {}, tags: {}, totalItems: 0 };
        }
    }

    // 유사한 콘텐츠 찾기
    async findSimilarContent(userPreferences, limit) {
        try {
            const { categories, tags } = userPreferences;

            if (Object.keys(categories).length === 0 && Object.keys(tags).length === 0) {
                // 선호도가 없으면 인기 콘텐츠 추천
                return await this.getPopularContent(limit);
            }

            // 선호도 기반 쿼리 생성
            let query = `
        SELECT 
          p.id,
          p.title,
          p.content,
          p.category,
          p.tags,
          p.view_count,
          p.like_count,
          p.created_at,
          u.username as author
        FROM posts p
        LEFT JOIN users u ON p.author_id = u.id
        WHERE p.is_published = 1 AND p.deleted_at IS NULL
      `;

            const params = [];
            const conditions = [];

            // 카테고리 조건
            if (Object.keys(categories).length > 0) {
                const topCategories = Object.entries(categories)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 3)
                    .map(([category]) => category);

                conditions.push(`p.category IN (${topCategories.map(() => '?').join(',')})`);
                params.push(...topCategories);
            }

            // 태그 조건
            if (Object.keys(tags).length > 0) {
                const topTags = Object.entries(tags)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5)
                    .map(([tag]) => tag);

                const tagConditions = topTags.map(() => `p.tags LIKE ?`);
                conditions.push(`(${tagConditions.join(' OR ')})`);
                params.push(...topTags.map(tag => `%${tag}%`));
            }

            if (conditions.length > 0) {
                query += ` AND ${conditions.join(' AND ')}`;
            }

            query += ` ORDER BY p.created_at DESC LIMIT ?`;
            params.push(limit * 2); // 더 많이 가져와서 필터링

            const [posts] = await this.db.execute(query, params);

            // 선호도 점수 계산
            const scoredPosts = posts.map(post => ({
                ...post,
                tags: post.tags ? post.tags.split(',').map(tag => tag.trim()) : [],
                score: this.calculateContentScore(post, userPreferences),
            }));

            return scoredPosts
                .sort((a, b) => b.score - a.score)
                .slice(0, limit);
        } catch (error) {
            console.error('유사한 콘텐츠 찾기 실패:', error);
            return [];
        }
    }

    // 콘텐츠 점수 계산
    calculateContentScore(post, userPreferences) {
        let score = 0;
        const { categories, tags } = userPreferences;

        // 카테고리 점수
        if (post.category && categories[post.category]) {
            score += categories[post.category] * 0.4;
        }

        // 태그 점수
        if (post.tags) {
            post.tags.forEach(tag => {
                if (tags[tag]) {
                    score += tags[tag] * 0.3;
                }
            });
        }

        // 인기도 점수
        score += Math.log(post.view_count + 1) * 0.2;
        score += Math.log(post.like_count + 1) * 0.1;

        return score;
    }

    // 인기 콘텐츠 조회
    async getPopularContent(limit) {
        try {
            const [posts] = await this.db.execute(`
        SELECT 
          p.id,
          p.title,
          p.content,
          p.category,
          p.tags,
          p.view_count,
          p.like_count,
          p.created_at,
          u.username as author
        FROM posts p
        LEFT JOIN users u ON p.author_id = u.id
        WHERE p.is_published = 1 AND p.deleted_at IS NULL
        ORDER BY (p.view_count * 0.7 + p.like_count * 0.3) DESC, p.created_at DESC
        LIMIT ?
      `, [limit]);

            return posts.map(post => ({
                ...post,
                tags: post.tags ? post.tags.split(',').map(tag => tag.trim()) : [],
                score: 1.0, // 기본 점수
            }));
        } catch (error) {
            console.error('인기 콘텐츠 조회 실패:', error);
            return [];
        }
    }

    // 추천 생성 (사용자 기반)
    async generateRecommendationsFromUsers(userId, similarUsers, limit) {
        try {
            if (similarUsers.length === 0) {
                return await this.getPopularContent(limit);
            }

            const similarUserIds = similarUsers.map(user => user.userId);
            const placeholders = similarUserIds.map(() => '?').join(',');

            const [posts] = await this.db.execute(`
        SELECT DISTINCT
          p.id,
          p.title,
          p.content,
          p.category,
          p.tags,
          p.view_count,
          p.like_count,
          p.created_at,
          u.username as author
        FROM posts p
        LEFT JOIN users u ON p.author_id = u.id
        LEFT JOIN post_likes pl ON p.id = pl.post_id
        WHERE p.is_published = 1 
          AND p.deleted_at IS NULL
          AND p.author_id IN (${placeholders})
          AND p.id NOT IN (
            SELECT DISTINCT post_id 
            FROM post_likes 
            WHERE user_id = ?
          )
        ORDER BY p.created_at DESC
        LIMIT ?
      `, [...similarUserIds, userId, limit * 2]);

            // 유사도 가중치 적용
            const scoredPosts = posts.map(post => {
                const userSimilarity = similarUsers.find(u => u.userId === post.author_id)?.similarity || 0;
                return {
                    ...post,
                    tags: post.tags ? post.tags.split(',').map(tag => tag.trim()) : [],
                    score: userSimilarity * 0.5 + Math.log(post.view_count + 1) * 0.3 + Math.log(post.like_count + 1) * 0.2,
                };
            });

            return scoredPosts
                .sort((a, b) => b.score - a.score)
                .slice(0, limit);
        } catch (error) {
            console.error('사용자 기반 추천 생성 실패:', error);
            return [];
        }
    }

    // 추천 결합
    combineRecommendations(userBased, contentBased, weights) {
        const combined = new Map();

        // 사용자 기반 추천 추가
        userBased.forEach(item => {
            combined.set(item.id, {
                ...item,
                score: item.score * weights.userWeight,
                sources: ['user'],
            });
        });

        // 콘텐츠 기반 추천 추가/업데이트
        contentBased.forEach(item => {
            if (combined.has(item.id)) {
                combined.get(item.id).score += item.score * weights.contentWeight;
                combined.get(item.id).sources.push('content');
            } else {
                combined.set(item.id, {
                    ...item,
                    score: item.score * weights.contentWeight,
                    sources: ['content'],
                });
            }
        });

        return Array.from(combined.values())
            .sort((a, b) => b.score - a.score);
    }

    // 공통 아이템 찾기
    findCommonItems(activity1, activity2) {
        const items1 = new Set([
            ...activity1.likes.map(item => item.id),
            ...activity1.comments.map(item => item.id),
            ...activity1.views.map(item => item.id),
        ]);

        const items2 = new Set([
            ...activity2.likes.map(item => item.id),
            ...activity2.comments.map(item => item.id),
            ...activity2.views.map(item => item.id),
        ]);

        return Array.from(items1).filter(id => items2.has(id));
    }

    // 사용자 벡터 생성
    createUserVector(activity, commonItems) {
        const vector = [];

        commonItems.forEach(itemId => {
            let weight = 0;

            // 좋아요 가중치
            const like = activity.likes.find(item => item.id === itemId);
            if (like) weight += like.weight;

            // 댓글 가중치
            const comment = activity.comments.find(item => item.id === itemId);
            if (comment) weight += comment.weight;

            // 조회 가중치
            const view = activity.views.find(item => item.id === itemId);
            if (view) weight += view.weight;

            vector.push(weight);
        });

        return vector;
    }

    // 코사인 유사도 계산
    cosineSimilarity(vector1, vector2) {
        if (vector1.length !== vector2.length) return 0;

        let dotProduct = 0;
        let norm1 = 0;
        let norm2 = 0;

        for (let i = 0; i < vector1.length; i++) {
            dotProduct += vector1[i] * vector2[i];
            norm1 += vector1[i] * vector1[i];
            norm2 += vector2[i] * vector2[i];
        }

        if (norm1 === 0 || norm2 === 0) return 0;

        return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
    }

    // 추천 신뢰도 계산
    calculateConfidence(recommendations) {
        if (recommendations.length === 0) return 0;

        const avgScore = recommendations.reduce((sum, item) => sum + item.score, 0) / recommendations.length;
        const maxScore = Math.max(...recommendations.map(item => item.score));

        return Math.min(avgScore / maxScore, 1);
    }

    // 추천 성능 평가
    async evaluateRecommendations(userId, recommendations) {
        try {
            // 사용자의 실제 활동과 비교
            const userActivity = await this.analyzeUserActivity(userId);
            const userItemIds = new Set([
                ...userActivity.likes.map(item => item.id),
                ...userActivity.comments.map(item => item.id),
                ...userActivity.views.map(item => item.id),
            ]);

            const recommendedIds = new Set(recommendations.map(item => item.id));
            const intersection = new Set([...userItemIds].filter(id => recommendedIds.has(id)));

            return {
                precision: intersection.size / recommendations.length,
                recall: intersection.size / userItemIds.size,
                f1Score: intersection.size > 0 ?
                    2 * (intersection.size / recommendations.length) * (intersection.size / userItemIds.size) /
                    ((intersection.size / recommendations.length) + (intersection.size / userItemIds.size)) : 0,
            };
        } catch (error) {
            console.error('추천 성능 평가 실패:', error);
            return { precision: 0, recall: 0, f1Score: 0 };
        }
    }
}

module.exports = RecommendationService;
