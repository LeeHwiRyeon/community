const logger = require('../utils/logger');

class RecommendationEngine {
    constructor() {
        this.userProfiles = new Map();
        this.contentFeatures = new Map();
        this.interactionMatrix = new Map();
        this.modelWeights = {
            contentBased: 0.4,
            collaborative: 0.3,
            popularity: 0.2,
            recency: 0.1
        };
    }

    // 사용자 프로필 생성 및 업데이트
    async buildUserProfile(userId, interactions) {
        try {
            const profile = {
                userId,
                preferences: {},
                behaviorPatterns: {},
                demographics: {},
                activityLevel: 0,
                lastUpdated: new Date(),
                interests: new Set(),
                dislikes: new Set(),
                socialConnections: new Set(),
                contentHistory: [],
                engagementScore: 0
            };

            // 상호작용 분석
            for (const interaction of interactions) {
                await this.analyzeInteraction(profile, interaction);
            }

            // 관심사 추출
            profile.interests = this.extractInterests(profile);

            // 행동 패턴 분석
            profile.behaviorPatterns = this.analyzeBehaviorPatterns(profile);

            // 참여도 점수 계산
            profile.engagementScore = this.calculateEngagementScore(profile);

            this.userProfiles.set(userId, profile);
            logger.info(`사용자 프로필 생성 완료: ${userId}`);

            return profile;
        } catch (error) {
            logger.error('사용자 프로필 생성 오류:', error);
            throw error;
        }
    }

    // 상호작용 분석
    async analyzeInteraction(profile, interaction) {
        const { type, contentId, contentType, timestamp, duration, rating } = interaction;

        // 콘텐츠 히스토리에 추가
        profile.contentHistory.push({
            contentId,
            contentType,
            timestamp,
            duration,
            rating
        });

        // 선호도 업데이트
        if (rating) {
            if (!profile.preferences[contentType]) {
                profile.preferences[contentType] = { total: 0, count: 0, average: 0 };
            }

            const pref = profile.preferences[contentType];
            pref.total += rating;
            pref.count += 1;
            pref.average = pref.total / pref.count;
        }

        // 활동 수준 업데이트
        profile.activityLevel += this.getActivityWeight(type);

        // 관심사 업데이트
        if (type === 'like' || type === 'save' || rating >= 4) {
            profile.interests.add(contentType);
        } else if (type === 'dislike' || rating <= 2) {
            profile.dislikes.add(contentType);
        }
    }

    // 콘텐츠 기반 추천
    async getContentBasedRecommendations(userId, limit = 10) {
        try {
            const userProfile = this.userProfiles.get(userId);
            if (!userProfile) {
                return [];
            }

            const recommendations = [];
            const userInterests = Array.from(userProfile.interests);
            const userDislikes = Array.from(userProfile.dislikes);

            // 모든 콘텐츠에 대해 점수 계산
            for (const [contentId, content] of this.contentFeatures) {
                // 이미 상호작용한 콘텐츠 제외
                if (userProfile.contentHistory.some(h => h.contentId === contentId)) {
                    continue;
                }

                let score = 0;

                // 콘텐츠 특성과 사용자 관심사 매칭
                for (const interest of userInterests) {
                    if (content.tags && content.tags.includes(interest)) {
                        score += 0.3;
                    }
                    if (content.category === interest) {
                        score += 0.5;
                    }
                }

                // 사용자가 싫어하는 콘텐츠 제외
                for (const dislike of userDislikes) {
                    if (content.tags && content.tags.includes(dislike)) {
                        score -= 0.5;
                    }
                    if (content.category === dislike) {
                        score -= 0.8;
                    }
                }

                // 콘텐츠 품질 점수
                if (content.qualityScore) {
                    score += content.qualityScore * 0.2;
                }

                // 인기도 점수
                if (content.popularityScore) {
                    score += content.popularityScore * 0.1;
                }

                if (score > 0) {
                    recommendations.push({
                        contentId,
                        score,
                        reason: 'content_based',
                        confidence: Math.min(score, 1.0)
                    });
                }
            }

            return recommendations
                .sort((a, b) => b.score - a.score)
                .slice(0, limit);
        } catch (error) {
            logger.error('콘텐츠 기반 추천 오류:', error);
            return [];
        }
    }

    // 협업 필터링 추천
    async getCollaborativeRecommendations(userId, limit = 10) {
        try {
            const userProfile = this.userProfiles.get(userId);
            if (!userProfile) {
                return [];
            }

            const recommendations = [];
            const userInteractions = new Set(
                userProfile.contentHistory.map(h => h.contentId)
            );

            // 유사한 사용자 찾기
            const similarUsers = this.findSimilarUsers(userId, 50);

            for (const similarUser of similarUsers) {
                const similarUserProfile = this.userProfiles.get(similarUser.userId);
                if (!similarUserProfile) continue;

                // 유사한 사용자가 상호작용한 콘텐츠 중에서
                for (const content of similarUserProfile.contentHistory) {
                    if (userInteractions.has(content.contentId)) continue;

                    const score = similarUser.similarity * this.getInteractionWeight(content);

                    const existing = recommendations.find(r => r.contentId === content.contentId);
                    if (existing) {
                        existing.score += score;
                        existing.confidence = Math.min(existing.confidence + 0.1, 1.0);
                    } else {
                        recommendations.push({
                            contentId: content.contentId,
                            score,
                            reason: 'collaborative',
                            confidence: Math.min(similarUser.similarity, 1.0),
                            similarUser: similarUser.userId
                        });
                    }
                }
            }

            return recommendations
                .sort((a, b) => b.score - a.score)
                .slice(0, limit);
        } catch (error) {
            logger.error('협업 필터링 추천 오류:', error);
            return [];
        }
    }

    // 인기도 기반 추천
    async getPopularityRecommendations(userId, limit = 10) {
        try {
            const userProfile = this.userProfiles.get(userId);
            if (!userProfile) {
                return [];
            }

            const userInteractions = new Set(
                userProfile.contentHistory.map(h => h.contentId)
            );

            const recommendations = [];

            for (const [contentId, content] of this.contentFeatures) {
                if (userInteractions.has(contentId)) continue;

                const score = content.popularityScore || 0;
                if (score > 0) {
                    recommendations.push({
                        contentId,
                        score,
                        reason: 'popularity',
                        confidence: Math.min(score, 1.0)
                    });
                }
            }

            return recommendations
                .sort((a, b) => b.score - a.score)
                .slice(0, limit);
        } catch (error) {
            logger.error('인기도 기반 추천 오류:', error);
            return [];
        }
    }

    // 최신성 기반 추천
    async getRecencyRecommendations(userId, limit = 10) {
        try {
            const userProfile = this.userProfiles.get(userId);
            if (!userProfile) {
                return [];
            }

            const userInteractions = new Set(
                userProfile.contentHistory.map(h => h.contentId)
            );

            const now = Date.now();
            const recommendations = [];

            for (const [contentId, content] of this.contentFeatures) {
                if (userInteractions.has(contentId)) continue;

                const age = now - new Date(content.createdAt).getTime();
                const ageInDays = age / (1000 * 60 * 60 * 24);

                // 최근 7일 이내 콘텐츠에 높은 점수
                const score = Math.max(0, 1 - (ageInDays / 7));

                if (score > 0.1) {
                    recommendations.push({
                        contentId,
                        score,
                        reason: 'recency',
                        confidence: score
                    });
                }
            }

            return recommendations
                .sort((a, b) => b.score - a.score)
                .slice(0, limit);
        } catch (error) {
            logger.error('최신성 기반 추천 오류:', error);
            return [];
        }
    }

    // 통합 추천 시스템
    async getRecommendations(userId, options = {}) {
        try {
            const {
                limit = 20,
                includeContentBased = true,
                includeCollaborative = true,
                includePopularity = true,
                includeRecency = true,
                categories = [],
                excludeSeen = true
            } = options;

            const allRecommendations = [];

            // 각 추천 알고리즘 실행
            if (includeContentBased) {
                const contentBased = await this.getContentBasedRecommendations(userId, limit);
                allRecommendations.push(...contentBased);
            }

            if (includeCollaborative) {
                const collaborative = await this.getCollaborativeRecommendations(userId, limit);
                allRecommendations.push(...collaborative);
            }

            if (includePopularity) {
                const popularity = await this.getPopularityRecommendations(userId, limit);
                allRecommendations.push(...popularity);
            }

            if (includeRecency) {
                const recency = await this.getRecencyRecommendations(userId, limit);
                allRecommendations.push(...recency);
            }

            // 추천 결과 통합 및 정렬
            const mergedRecommendations = this.mergeRecommendations(allRecommendations);

            // 카테고리 필터링
            let filteredRecommendations = mergedRecommendations;
            if (categories.length > 0) {
                filteredRecommendations = mergedRecommendations.filter(rec => {
                    const content = this.contentFeatures.get(rec.contentId);
                    return content && categories.includes(content.category);
                });
            }

            // 중복 제거 및 점수 정규화
            const finalRecommendations = this.deduplicateAndNormalize(filteredRecommendations);

            return finalRecommendations.slice(0, limit);
        } catch (error) {
            logger.error('통합 추천 오류:', error);
            return [];
        }
    }

    // 추천 결과 통합
    mergeRecommendations(recommendations) {
        const merged = new Map();

        for (const rec of recommendations) {
            const key = rec.contentId;
            if (merged.has(key)) {
                const existing = merged.get(key);
                existing.score += rec.score * this.modelWeights[rec.reason] || 0.1;
                existing.confidence = Math.max(existing.confidence, rec.confidence);
                existing.reasons = existing.reasons || [existing.reason];
                if (!existing.reasons.includes(rec.reason)) {
                    existing.reasons.push(rec.reason);
                }
            } else {
                merged.set(key, {
                    ...rec,
                    score: rec.score * (this.modelWeights[rec.reason] || 0.1),
                    reasons: [rec.reason]
                });
            }
        }

        return Array.from(merged.values());
    }

    // 중복 제거 및 정규화
    deduplicateAndNormalize(recommendations) {
        // 점수 정규화 (0-1 범위)
        const maxScore = Math.max(...recommendations.map(r => r.score));
        const minScore = Math.min(...recommendations.map(r => r.score));
        const range = maxScore - minScore;

        return recommendations.map(rec => ({
            ...rec,
            score: range > 0 ? (rec.score - minScore) / range : rec.score,
            confidence: Math.min(rec.confidence, 1.0)
        })).sort((a, b) => b.score - a.score);
    }

    // 유사한 사용자 찾기
    findSimilarUsers(userId, limit = 50) {
        const userProfile = this.userProfiles.get(userId);
        if (!userProfile) return [];

        const similarities = [];

        for (const [otherUserId, otherProfile] of this.userProfiles) {
            if (otherUserId === userId) continue;

            const similarity = this.calculateUserSimilarity(userProfile, otherProfile);
            if (similarity > 0.1) {
                similarities.push({
                    userId: otherUserId,
                    similarity
                });
            }
        }

        return similarities
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, limit);
    }

    // 사용자 유사도 계산
    calculateUserSimilarity(profile1, profile2) {
        let similarity = 0;
        let weight = 0;

        // 관심사 유사도
        const interests1 = Array.from(profile1.interests);
        const interests2 = Array.from(profile2.interests);
        const commonInterests = interests1.filter(i => interests2.includes(i));
        const interestSimilarity = commonInterests.length / Math.max(interests1.length, interests2.length, 1);
        similarity += interestSimilarity * 0.4;
        weight += 0.4;

        // 선호도 유사도
        const prefSimilarity = this.calculatePreferenceSimilarity(profile1.preferences, profile2.preferences);
        similarity += prefSimilarity * 0.3;
        weight += 0.3;

        // 행동 패턴 유사도
        const behaviorSimilarity = this.calculateBehaviorSimilarity(profile1.behaviorPatterns, profile2.behaviorPatterns);
        similarity += behaviorSimilarity * 0.3;
        weight += 0.3;

        return weight > 0 ? similarity / weight : 0;
    }

    // 선호도 유사도 계산
    calculatePreferenceSimilarity(prefs1, prefs2) {
        const categories = new Set([...Object.keys(prefs1), ...Object.keys(prefs2)]);
        let totalSimilarity = 0;
        let count = 0;

        for (const category of categories) {
            const pref1 = prefs1[category] || { average: 0 };
            const pref2 = prefs2[category] || { average: 0 };

            const diff = Math.abs(pref1.average - pref2.average);
            const similarity = Math.max(0, 1 - diff / 5); // 5점 척도 기준

            totalSimilarity += similarity;
            count++;
        }

        return count > 0 ? totalSimilarity / count : 0;
    }

    // 행동 패턴 유사도 계산
    calculateBehaviorSimilarity(patterns1, patterns2) {
        // 시간대별 활동 패턴, 콘텐츠 소비 패턴 등
        // 간단한 구현으로 평균 유사도 반환
        return 0.5;
    }

    // 관심사 추출
    extractInterests(profile) {
        const interests = new Set();

        // 콘텐츠 히스토리에서 관심사 추출
        for (const content of profile.contentHistory) {
            if (content.rating >= 4) {
                interests.add(content.contentType);
            }
        }

        // 선호도가 높은 카테고리 추가
        for (const [category, pref] of Object.entries(profile.preferences)) {
            if (pref.average >= 3.5) {
                interests.add(category);
            }
        }

        return interests;
    }

    // 행동 패턴 분석
    analyzeBehaviorPatterns(profile) {
        const patterns = {
            activeHours: [],
            preferredContentTypes: [],
            averageSessionDuration: 0,
            interactionFrequency: 0
        };

        // 시간대별 활동 분석
        const hourCounts = new Array(24).fill(0);
        for (const content of profile.contentHistory) {
            const hour = new Date(content.timestamp).getHours();
            hourCounts[hour]++;
        }
        patterns.activeHours = hourCounts
            .map((count, hour) => ({ hour, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5)
            .map(h => h.hour);

        // 선호 콘텐츠 타입
        patterns.preferredContentTypes = Object.entries(profile.preferences)
            .sort((a, b) => b[1].average - a[1].average)
            .slice(0, 3)
            .map(([type]) => type);

        return patterns;
    }

    // 참여도 점수 계산
    calculateEngagementScore(profile) {
        let score = 0;

        // 활동 수준
        score += Math.min(profile.activityLevel / 100, 1) * 0.3;

        // 콘텐츠 다양성
        const uniqueTypes = new Set(profile.contentHistory.map(c => c.contentType)).size;
        score += Math.min(uniqueTypes / 10, 1) * 0.2;

        // 평균 평점
        const ratings = profile.contentHistory.filter(c => c.rating).map(c => c.rating);
        if (ratings.length > 0) {
            const avgRating = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
            score += (avgRating / 5) * 0.3;
        }

        // 최근 활동
        const recentActivity = profile.contentHistory.filter(
            c => Date.now() - new Date(c.timestamp).getTime() < 7 * 24 * 60 * 60 * 1000
        ).length;
        score += Math.min(recentActivity / 20, 1) * 0.2;

        return Math.min(score, 1);
    }

    // 활동 가중치
    getActivityWeight(type) {
        const weights = {
            view: 1,
            like: 3,
            share: 4,
            comment: 2,
            save: 3,
            dislike: -1,
            report: -2
        };
        return weights[type] || 0;
    }

    // 상호작용 가중치
    getInteractionWeight(interaction) {
        const weights = {
            view: 0.1,
            like: 0.3,
            share: 0.4,
            comment: 0.2,
            save: 0.3,
            rating: 0.5
        };
        return weights[interaction.type] || 0.1;
    }

    // 콘텐츠 특성 업데이트
    async updateContentFeatures(contentId, features) {
        this.contentFeatures.set(contentId, {
            ...features,
            lastUpdated: new Date()
        });
    }

    // 모델 가중치 업데이트
    updateModelWeights(weights) {
        this.modelWeights = { ...this.modelWeights, ...weights };
    }

    // 추천 성능 평가
    async evaluateRecommendations(userId, recommendations, actualInteractions) {
        const metrics = {
            precision: 0,
            recall: 0,
            f1Score: 0,
            hitRate: 0,
            averagePrecision: 0
        };

        if (recommendations.length === 0) return metrics;

        const recommendedIds = new Set(recommendations.map(r => r.contentId));
        const actualIds = new Set(actualInteractions.map(i => i.contentId));

        const truePositives = [...recommendedIds].filter(id => actualIds.has(id)).length;
        const falsePositives = recommendedIds.size - truePositives;
        const falseNegatives = actualIds.size - truePositives;

        metrics.precision = truePositives / (truePositives + falsePositives);
        metrics.recall = truePositives / (truePositives + falseNegatives);
        metrics.f1Score = 2 * (metrics.precision * metrics.recall) / (metrics.precision + metrics.recall);
        metrics.hitRate = truePositives > 0 ? 1 : 0;

        return metrics;
    }
}

module.exports = RecommendationEngine;
