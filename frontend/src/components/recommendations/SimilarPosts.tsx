/**
 * SimilarPosts Component
 * Displays similar posts based on content similarity
 */

import React, { useState, useEffect } from 'react';
import { getSimilarPosts } from '../../services/recommendationService';
import type { PostRecommendation } from '../../types/recommendation';
import { Link } from 'react-router-dom';
import './SimilarPosts.css';

interface SimilarPostsProps {
    postId: number;
    limit?: number;
}

export const SimilarPosts: React.FC<SimilarPostsProps> = ({
    postId,
    limit = 5
}) => {
    const [recommendations, setRecommendations] = useState<PostRecommendation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadSimilarPosts();
    }, [postId, limit]);

    const loadSimilarPosts = async () => {
        try {
            setLoading(true);
            setError(null);
            const recs = await getSimilarPosts(postId, limit);
            setRecommendations(recs);
        } catch (err) {
            console.error('Failed to load similar posts:', err);
            setError('유사한 게시물을 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="similar-posts">
                <h3 className="similar-posts__title">유사한 게시물</h3>
                <div className="similar-posts__loading">
                    <div className="spinner"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="similar-posts">
                <h3 className="similar-posts__title">유사한 게시물</h3>
                <div className="similar-posts__error">
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    if (recommendations.length === 0) {
        return null; // Don't show if no similar posts found
    }

    const formatDate = (dateString?: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="similar-posts">
            <h3 className="similar-posts__title">
                🔗 유사한 게시물
            </h3>

            <div className="similar-posts__list">
                {recommendations.map((rec, index) => (
                    <Link
                        key={rec.post_id}
                        to={`/posts/${rec.post_id}`}
                        className="similar-post-item"
                    >
                        <div className="similar-post-item__number">
                            {index + 1}
                        </div>
                        <div className="similar-post-item__content">
                            <h4 className="similar-post-item__title">
                                {rec.title || '제목 없음'}
                            </h4>
                            <div className="similar-post-item__meta">
                                <span className="meta-author">
                                    {rec.author_name || '익명'}
                                </span>
                                <span className="meta-date">
                                    {formatDate(rec.created_at)}
                                </span>
                            </div>
                            <div className="similar-post-item__stats">
                                <span>❤️ {rec.like_count || 0}</span>
                                <span>💬 {rec.comment_count || 0}</span>
                            </div>
                        </div>
                        <div className="similar-post-item__score">
                            {(rec.score * 100).toFixed(0)}%
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default SimilarPosts;
