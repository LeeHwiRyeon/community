import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './RecommendedPosts.css';

/**
 * 추천 게시물 컴포넌트
 * 사용자 맞춤 게시물 추천 표시
 */
const RecommendedPosts = ({ limit = 10, recommendationType = 'hybrid' }) => {
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [retryCount, setRetryCount] = useState(0);

    useEffect(() => {
        fetchRecommendations();
    }, [limit, recommendationType, retryCount]);

    const fetchRecommendations = async () => {
        try {
            setLoading(true);
            setError(null);

            const token = localStorage.getItem('token');
            if (!token) {
                // 로그인하지 않은 경우 트렌딩 게시물 표시
                const response = await axios.post(
                    `${process.env.REACT_APP_API_URL}/api/recommendations/trending`,
                    null,
                    { params: { limit } }
                );
                setRecommendations(response.data.trending || []);
                setLoading(false);
                return;
            }

            // 로그인한 사용자: 맞춤 추천
            const response = await axios.get(
                `${process.env.REACT_APP_API_URL}/api/recommendations/posts`,
                {
                    params: { limit, type: recommendationType },
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            setRecommendations(response.data.recommendations || []);
            setLoading(false);
        } catch (err) {
            console.error('Failed to fetch recommendations:', err);
            setError(err.response?.data?.error || '추천 게시물을 불러올 수 없습니다.');
            setLoading(false);
        }
    };

    const handleRetry = () => {
        setRetryCount(prev => prev + 1);
    };

    const handlePostClick = (postId) => {
        window.location.href = `/posts/${postId}`;
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 60) return `${minutes}분 전`;
        if (hours < 24) return `${hours}시간 전`;
        if (days < 7) return `${days}일 전`;
        return date.toLocaleDateString('ko-KR');
    };

    if (loading) {
        return (
            <div className="recommended-posts">
                <h2 className="recommended-posts__title">
                    🎯 추천 게시물
                </h2>
                <div className="recommended-posts__loading">
                    <div className="spinner"></div>
                    <p>추천 게시물을 불러오는 중...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="recommended-posts">
                <h2 className="recommended-posts__title">
                    🎯 추천 게시물
                </h2>
                <div className="recommended-posts__error">
                    <p className="error-message">{error}</p>
                    <button onClick={handleRetry} className="retry-button">
                        다시 시도
                    </button>
                </div>
            </div>
        );
    }

    if (recommendations.length === 0) {
        return (
            <div className="recommended-posts">
                <h2 className="recommended-posts__title">
                    🎯 추천 게시물
                </h2>
                <div className="recommended-posts__empty">
                    <p>추천할 게시물이 없습니다.</p>
                    <p className="empty-subtitle">
                        게시물을 읽고 좋아요를 누르면 맞춤 추천을 받을 수 있습니다.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="recommended-posts">
            <div className="recommended-posts__header">
                <h2 className="recommended-posts__title">
                    🎯 추천 게시물
                </h2>
                <span className="recommended-posts__badge">
                    {recommendationType === 'hybrid' ? 'AI 추천' :
                        recommendationType === 'collaborative' ? '사용자 기반' : '콘텐츠 기반'}
                </span>
            </div>

            <div className="recommended-posts__grid">
                {recommendations.map((post, index) => (
                    <div
                        key={post.post_id}
                        className="recommendation-card"
                        onClick={() => handlePostClick(post.post_id)}
                    >
                        <div className="recommendation-card__rank">
                            #{index + 1}
                        </div>

                        <h3 className="recommendation-card__title">
                            {post.title}
                        </h3>

                        <div className="recommendation-card__meta">
                            <span className="meta-item">
                                👁️ {post.views_count || 0}
                            </span>
                            <span className="meta-item">
                                ❤️ {post.likes_count || 0}
                            </span>
                            <span className="meta-item">
                                📅 {formatDate(post.created_at)}
                            </span>
                        </div>

                        {post.score && (
                            <div className="recommendation-card__score">
                                <div
                                    className="score-bar"
                                    style={{ width: `${Math.min(post.score * 100, 100)}%` }}
                                ></div>
                                <span className="score-text">
                                    {(post.score * 100).toFixed(0)}% 일치
                                </span>
                            </div>
                        )}

                        {post.similarity_score && (
                            <div className="recommendation-card__similarity">
                                유사도: {(post.similarity_score * 100).toFixed(0)}%
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <button
                className="recommended-posts__refresh"
                onClick={handleRetry}
            >
                🔄 새로고침
            </button>
        </div>
    );
};

export default RecommendedPosts;
