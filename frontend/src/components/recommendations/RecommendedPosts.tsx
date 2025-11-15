/**
 * RecommendedPosts Component
 * Displays personalized post recommendations for the user
 */

import React, { useState, useEffect } from 'react';
import { getPostRecommendations } from '../../services/recommendationService';
import type { PostRecommendation } from '../../types/recommendation';
import { Link } from 'react-router-dom';
import './RecommendedPosts.css';

interface RecommendedPostsProps {
    userId: number;
    limit?: number;
    excludeViewed?: boolean;
}

export const RecommendedPosts: React.FC<RecommendedPostsProps> = ({
    userId,
    limit = 5,
    excludeViewed = true
}) => {
    const [recommendations, setRecommendations] = useState<PostRecommendation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadRecommendations();
    }, [userId, limit, excludeViewed]);

    const loadRecommendations = async () => {
        try {
            setLoading(true);
            setError(null);
            const recs = await getPostRecommendations(userId, limit, excludeViewed);
            setRecommendations(recs);
        } catch (err) {
            console.error('Failed to load post recommendations:', err);
            setError('추천 게시물을 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="recommended-posts">
                <h3 className="recommended-posts__title">추천 게시물</h3>
                <div className="recommended-posts__loading">
                    <div className="spinner"></div>
                    <p>추천 게시물을 로딩 중입니다...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="recommended-posts">
                <h3 className="recommended-posts__title">추천 게시물</h3>
                <div className="recommended-posts__error">
                    <p>{error}</p>
                    <button onClick={loadRecommendations} className="btn-retry">
                        다시 시도
                    </button>
                </div>
            </div>
        );
    }

    if (recommendations.length === 0) {
        return (
            <div className="recommended-posts">
                <h3 className="recommended-posts__title">추천 게시물</h3>
                <div className="recommended-posts__empty">
                    <p>추천할 게시물이 없습니다.</p>
                    <p className="text-muted">더 많은 활동을 하면 맞춤 추천을 받을 수 있습니다!</p>
                </div>
            </div>
        );
    }

    const formatDate = (dateString?: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) return `${diffMins}분 전`;
        if (diffHours < 24) return `${diffHours}시간 전`;
        if (diffDays < 7) return `${diffDays}일 전`;
        return date.toLocaleDateString('ko-KR');
    };

    const truncateContent = (content?: string, maxLength: number = 100) => {
        if (!content) return '';
        if (content.length <= maxLength) return content;
        return content.substring(0, maxLength) + '...';
    };

    const getScoreColor = (score: number) => {
        if (score >= 0.8) return 'high';
        if (score >= 0.5) return 'medium';
        return 'low';
    };

    return (
        <div className="recommended-posts">
            <div className="recommended-posts__header">
                <h3 className="recommended-posts__title">
                    ✨ 추천 게시물
                </h3>
                <button onClick={loadRecommendations} className="btn-refresh" title="새로고침">
                    🔄
                </button>
            </div>

            <div className="recommended-posts__list">
                {recommendations.map((rec) => (
                    <Link
                        key={rec.post_id}
                        to={`/posts/${rec.post_id}`}
                        className="recommended-post-card"
                    >
                        <div className="recommended-post-card__header">
                            <h4 className="recommended-post-card__title">
                                {rec.title || '제목 없음'}
                            </h4>
                            <span className={`score-badge score-badge--${getScoreColor(rec.score)}`}>
                                {(rec.score * 100).toFixed(0)}%
                            </span>
                        </div>

                        <p className="recommended-post-card__content">
                            {truncateContent(rec.content)}
                        </p>

                        <div className="recommended-post-card__meta">
                            <span className="meta-item">
                                👤 {rec.author_name || '익명'}
                            </span>
                            {rec.category && (
                                <span className="meta-item">
                                    📁 {rec.category}
                                </span>
                            )}
                            <span className="meta-item">
                                🕐 {formatDate(rec.created_at)}
                            </span>
                        </div>

                        <div className="recommended-post-card__stats">
                            <span className="stat-item">
                                👁️ {rec.view_count || 0}
                            </span>
                            <span className="stat-item">
                                ❤️ {rec.like_count || 0}
                            </span>
                            <span className="stat-item">
                                💬 {rec.comment_count || 0}
                            </span>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default RecommendedPosts;
