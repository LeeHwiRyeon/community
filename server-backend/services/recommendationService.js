const { logger } = require('../utils/logger');
const { cacheService } = require('./cacheService');

/**
 * AI 기반 추천 시스템
 * - 협업 필터링
 * - 콘텐츠 기반 필터링
 * - 하이브리드 추천
 * - 실시간 추천
 */

class RecommendationService {
    constructor() {
        this.userSimilarityCache = new Map();
        this.itemSimilarityCache = new Map();
        this.recommendationCache = new Map();
    }

    /**
     * 사용자 기반 추천 (협업 필터링)
     */
    async getUserBasedRecommendations(userId, limit = 10) {
        try {
            const cacheKey = `user_recommendations:${userId}:${limit}`;
            const cached = await cacheService.get(cacheKey);
            if (cached) {
                return cached;
            }

            // 사용자 행동 데이터 수집
            const userBehavior = await this.getUserBehavior(userId);
            if (!userBehavior || userBehavior.length === 0) {
                return [];
            }

            // 유사한 사용자 찾기
            const similarUsers = await this.findSimilarUsers(userId, userBehavior);

            // 추천 아이템 생성
            const recommendations = await this.generateRecommendationsFromSimilarUsers(
                userId,
                similarUsers,
                limit
            );

            // 캐시 저장 (30분)
            await cacheService.set(cacheKey, recommendations, 1800);

            logger.info(`사용자 기반 추천 생성: ${userId} - ${recommendations.length}개`);
            return recommendations;
        } catch (error) {
            logger.error('사용자 기반 추천 생성 실패:', error);
            return [];
        }
    }

    /**
     * 아이템 기반 추천 (콘텐츠 기반 필터링)
     */
    async getItemBasedRecommendations(itemId, limit = 10) {
        try {
            const cacheKey = `item_recommendations:${itemId}:${limit}`;
            const cached = await cacheService.get(cacheKey);
            if (cached) {
                return cached;
            }

            // 아이템 특성 분석
            const itemFeatures = await this.getItemFeatures(itemId);
            if (!itemFeatures) {
                return [];
            }

            // 유사한 아이템 찾기
            const similarItems = await this.findSimilarItems(itemId, itemFeatures, limit);

            // 캐시 저장 (1시간)
            await cacheService.set(cacheKey, similarItems, 3600);

            logger.info(`아이템 기반 추천 생성: ${itemId} - ${similarItems.length}개`);
            return similarItems;
        } catch (error) {
            logger.error('아이템 기반 추천 생성 실패:', error);
            return [];
        }
    }

    /**
     * 하이브리드 추천 (사용자 + 아이템 기반)
     */
    async getHybridRecommendations(userId, limit = 10) {
        try {
            const cacheKey = `hybrid_recommendations:${userId}:${limit}`;
            const cached = await cacheService.get(cacheKey);
            if (cached) {
                return cached;
            }

            // 사용자 기반 추천
            const userBased = await this.getUserBasedRecommendations(userId, limit * 2);

            // 아이템 기반 추천 (사용자가 최근 본 아이템들 기반)
            const recentItems = await this.getUserRecentItems(userId, 5);
            let itemBased = [];
            for (const item of recentItems) {
                const recommendations = await this.getItemBasedRecommendations(item.id, 3);
                itemBased.push(...recommendations);
            }

            // 추천 점수 계산 및 병합
            const hybridRecommendations = this.mergeRecommendations(
                userBased,
                itemBased,
                limit
            );

            // 캐시 저장 (20분)
            await cacheService.set(cacheKey, hybridRecommendations, 1200);

            logger.info(`하이브리드 추천 생성: ${userId} - ${hybridRecommendations.length}개`);
            return hybridRecommendations;
        } catch (error) {
            logger.error('하이브리드 추천 생성 실패:', error);
            return [];
        }
    }

    /**
     * 실시간 추천 (현재 세션 기반)
     */
    async getRealTimeRecommendations(userId, sessionData, limit = 5) {
        try {
            // 현재 세션의 행동 패턴 분석
            const sessionPattern = this.analyzeSessionPattern(sessionData);

            // 실시간 추천 생성
            const recommendations = await this.generateRealTimeRecommendations(
                userId,
                sessionPattern,
                limit
            );

            logger.info(`실시간 추천 생성: ${userId} - ${recommendations.length}개`);
            return recommendations;
        } catch (error) {
            logger.error('실시간 추천 생성 실패:', error);
            return [];
        }
    }

    /**
     * 사용자 행동 데이터 수집
     */
    async getUserBehavior(userId) {
        try {
            // 실제로는 데이터베이스에서 조회
            const behavior = [
                { itemId: 'post_1', action: 'view', timestamp: Date.now() - 3600000, score: 1 },
                { itemId: 'post_2', action: 'like', timestamp: Date.now() - 7200000, score: 3 },
                { itemId: 'post_3', action: 'comment', timestamp: Date.now() - 10800000, score: 5 },
                { itemId: 'post_4', action: 'share', timestamp: Date.now() - 14400000, score: 4 },
                { itemId: 'post_5', action: 'view', timestamp: Date.now() - 18000000, score: 1 }
            ];

            return behavior;
        } catch (error) {
            logger.error('사용자 행동 데이터 수집 실패:', error);
            return [];
        }
    }

    /**
     * 유사한 사용자 찾기
     */
    async findSimilarUsers(userId, userBehavior) {
        try {
            // 코사인 유사도 계산
            const similarities = [];

            // 실제로는 모든 사용자와 비교
            const allUsers = await this.getAllUsers();

            for (const otherUser of allUsers) {
                if (otherUser.id === userId) continue;

                const otherBehavior = await this.getUserBehavior(otherUser.id);
                const similarity = this.calculateCosineSimilarity(userBehavior, otherBehavior);

                if (similarity > 0.1) { // 임계값
                    similarities.push({
                        userId: otherUser.id,
                        similarity: similarity,
                        behavior: otherBehavior
                    });
                }
            }

            // 유사도 순으로 정렬
            return similarities.sort((a, b) => b.similarity - a.similarity).slice(0, 20);
        } catch (error) {
            logger.error('유사한 사용자 찾기 실패:', error);
            return [];
        }
    }

    /**
     * 아이템 특성 분석
     */
    async getItemFeatures(itemId) {
        try {
            // 실제로는 데이터베이스에서 아이템 정보 조회
            const item = {
                id: itemId,
                category: 'technology',
                tags: ['javascript', 'react', 'frontend'],
                author: 'user_123',
                createdAt: Date.now() - 86400000,
                views: 150,
                likes: 25,
                comments: 8,
                contentLength: 1200,
                hasImages: true,
                hasCode: true
            };

            return item;
        } catch (error) {
            logger.error('아이템 특성 분석 실패:', error);
            return null;
        }
    }

    /**
     * 유사한 아이템 찾기
     */
    async findSimilarItems(itemId, itemFeatures, limit) {
        try {
            const similarities = [];

            // 실제로는 모든 아이템과 비교
            const allItems = await this.getAllItems();

            for (const otherItem of allItems) {
                if (otherItem.id === itemId) continue;

                const otherFeatures = await this.getItemFeatures(otherItem.id);
                if (!otherFeatures) continue;

                const similarity = this.calculateItemSimilarity(itemFeatures, otherFeatures);

                if (similarity > 0.2) { // 임계값
                    similarities.push({
                        item: otherItem,
                        similarity: similarity
                    });
                }
            }

            // 유사도 순으로 정렬
            return similarities
                .sort((a, b) => b.similarity - a.similarity)
                .slice(0, limit)
                .map(s => s.item);
        } catch (error) {
            logger.error('유사한 아이템 찾기 실패:', error);
            return [];
        }
    }

    /**
     * 코사인 유사도 계산
     */
    calculateCosineSimilarity(behavior1, behavior2) {
        const items1 = new Set(behavior1.map(b => b.itemId));
        const items2 = new Set(behavior2.map(b => b.itemId));

        const intersection = new Set([...items1].filter(x => items2.has(x)));
        const union = new Set([...items1, ...items2]);

        if (union.size === 0) return 0;

        return intersection.size / union.size;
    }

    /**
     * 아이템 유사도 계산
     */
    calculateItemSimilarity(features1, features2) {
        let similarity = 0;
        let weight = 0;

        // 카테고리 유사도
        if (features1.category === features2.category) {
            similarity += 0.3;
        }
        weight += 0.3;

        // 태그 유사도
        const tags1 = new Set(features1.tags);
        const tags2 = new Set(features2.tags);
        const tagIntersection = new Set([...tags1].filter(x => tags2.has(x)));
        const tagUnion = new Set([...tags1, ...tags2]);
        const tagSimilarity = tagUnion.size > 0 ? tagIntersection.size / tagUnion.size : 0;
        similarity += tagSimilarity * 0.4;
        weight += 0.4;

        // 작성자 유사도
        if (features1.author === features2.author) {
            similarity += 0.1;
        }
        weight += 0.1;

        // 콘텐츠 특성 유사도
        const contentSimilarity = this.calculateContentSimilarity(features1, features2);
        similarity += contentSimilarity * 0.2;
        weight += 0.2;

        return weight > 0 ? similarity / weight : 0;
    }

    /**
     * 콘텐츠 유사도 계산
     */
    calculateContentSimilarity(features1, features2) {
        let similarity = 0;
        let weight = 0;

        // 콘텐츠 길이 유사도
        const lengthDiff = Math.abs(features1.contentLength - features2.contentLength);
        const maxLength = Math.max(features1.contentLength, features2.contentLength);
        const lengthSimilarity = maxLength > 0 ? 1 - (lengthDiff / maxLength) : 0;
        similarity += lengthSimilarity * 0.3;
        weight += 0.3;

        // 미디어 유사도
        if (features1.hasImages === features2.hasImages) {
            similarity += 0.2;
        }
        if (features1.hasCode === features2.hasCode) {
            similarity += 0.2;
        }
        weight += 0.4;

        // 인기도 유사도
        const popularity1 = features1.views + features1.likes * 2 + features1.comments * 3;
        const popularity2 = features2.views + features2.likes * 2 + features2.comments * 3;
        const popularityDiff = Math.abs(popularity1 - popularity2);
        const maxPopularity = Math.max(popularity1, popularity2);
        const popularitySimilarity = maxPopularity > 0 ? 1 - (popularityDiff / maxPopularity) : 0;
        similarity += popularitySimilarity * 0.3;
        weight += 0.3;

        return weight > 0 ? similarity / weight : 0;
    }

    /**
     * 추천 점수 계산 및 병합
     */
    mergeRecommendations(userBased, itemBased, limit) {
        const itemScores = new Map();

        // 사용자 기반 추천 점수
        userBased.forEach((item, index) => {
            const score = (userBased.length - index) / userBased.length * 0.6; // 가중치 0.6
            itemScores.set(item.id, (itemScores.get(item.id) || 0) + score);
        });

        // 아이템 기반 추천 점수
        itemBased.forEach((item, index) => {
            const score = (itemBased.length - index) / itemBased.length * 0.4; // 가중치 0.4
            itemScores.set(item.id, (itemScores.get(item.id) || 0) + score);
        });

        // 점수 순으로 정렬
        const sortedItems = Array.from(itemScores.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([itemId, score]) => ({
                id: itemId,
                score: score,
                type: 'hybrid'
            }));

        return sortedItems;
    }

    /**
     * 세션 패턴 분석
     */
    analyzeSessionPattern(sessionData) {
        const pattern = {
            pageViews: sessionData.pageViews || [],
            searchQueries: sessionData.searchQueries || [],
            timeSpent: sessionData.timeSpent || 0,
            interactions: sessionData.interactions || [],
            deviceType: sessionData.deviceType || 'desktop',
            timeOfDay: new Date().getHours()
        };

        return pattern;
    }

    /**
     * 실시간 추천 생성
     */
    async generateRealTimeRecommendations(userId, sessionPattern, limit) {
        try {
            const recommendations = [];

            // 검색 쿼리 기반 추천
            if (sessionPattern.searchQueries.length > 0) {
                const searchRecommendations = await this.getSearchBasedRecommendations(
                    sessionPattern.searchQueries[sessionPattern.searchQueries.length - 1],
                    limit
                );
                recommendations.push(...searchRecommendations);
            }

            // 페이지 뷰 기반 추천
            if (sessionPattern.pageViews.length > 0) {
                const lastPage = sessionPattern.pageViews[sessionPattern.pageViews.length - 1];
                const pageRecommendations = await this.getItemBasedRecommendations(lastPage, 3);
                recommendations.push(...pageRecommendations);
            }

            // 시간대 기반 추천
            const timeBasedRecommendations = await this.getTimeBasedRecommendations(
                sessionPattern.timeOfDay,
                limit
            );
            recommendations.push(...timeBasedRecommendations);

            // 중복 제거 및 점수 계산
            const uniqueRecommendations = this.deduplicateRecommendations(recommendations);

            return uniqueRecommendations.slice(0, limit);
        } catch (error) {
            logger.error('실시간 추천 생성 실패:', error);
            return [];
        }
    }

    /**
     * 검색 기반 추천
     */
    async getSearchBasedRecommendations(query, limit) {
        try {
            // 실제로는 검색 인덱스에서 관련 아이템 조회
            const searchResults = [
                { id: 'search_1', score: 0.9, type: 'search' },
                { id: 'search_2', score: 0.8, type: 'search' },
                { id: 'search_3', score: 0.7, type: 'search' }
            ];

            return searchResults.slice(0, limit);
        } catch (error) {
            logger.error('검색 기반 추천 실패:', error);
            return [];
        }
    }

    /**
     * 시간대 기반 추천
     */
    async getTimeBasedRecommendations(hour, limit) {
        try {
            // 시간대별 인기 아이템 추천
            const timeBasedItems = {
                morning: ['morning_1', 'morning_2', 'morning_3'],
                afternoon: ['afternoon_1', 'afternoon_2', 'afternoon_3'],
                evening: ['evening_1', 'evening_2', 'evening_3'],
                night: ['night_1', 'night_2', 'night_3']
            };

            let timeSlot = 'morning';
            if (hour >= 6 && hour < 12) timeSlot = 'morning';
            else if (hour >= 12 && hour < 18) timeSlot = 'afternoon';
            else if (hour >= 18 && hour < 22) timeSlot = 'evening';
            else timeSlot = 'night';

            const items = timeBasedItems[timeSlot] || [];
            return items.slice(0, limit).map(id => ({
                id,
                score: 0.5,
                type: 'time_based'
            }));
        } catch (error) {
            logger.error('시간대 기반 추천 실패:', error);
            return [];
        }
    }

    /**
     * 중복 제거
     */
    deduplicateRecommendations(recommendations) {
        const seen = new Set();
        const unique = [];

        for (const rec of recommendations) {
            if (!seen.has(rec.id)) {
                seen.add(rec.id);
                unique.push(rec);
            }
        }

        return unique;
    }

    /**
     * 헬퍼 메서드들
     */
    async getAllUsers() {
        // 실제로는 데이터베이스에서 조회
        return [
            { id: 'user_1', name: 'User 1' },
            { id: 'user_2', name: 'User 2' },
            { id: 'user_3', name: 'User 3' }
        ];
    }

    async getAllItems() {
        // 실제로는 데이터베이스에서 조회
        return [
            { id: 'item_1', title: 'Item 1' },
            { id: 'item_2', title: 'Item 2' },
            { id: 'item_3', title: 'Item 3' }
        ];
    }

    async getUserRecentItems(userId, limit) {
        // 실제로는 데이터베이스에서 조회
        return [
            { id: 'recent_1', title: 'Recent Item 1' },
            { id: 'recent_2', title: 'Recent Item 2' }
        ];
    }

    async generateRecommendationsFromSimilarUsers(userId, similarUsers, limit) {
        const recommendations = [];

        for (const similarUser of similarUsers) {
            const userItems = similarUser.behavior.map(b => ({
                id: b.itemId,
                score: b.score * similarUser.similarity,
                type: 'user_based'
            }));
            recommendations.push(...userItems);
        }

        return recommendations
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
    }
}

module.exports = new RecommendationService();
