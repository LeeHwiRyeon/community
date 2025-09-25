import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiService, Post } from '../api'

const HomePage: React.FC = () => {
    const [posts, setPosts] = useState<Post[]>([])
    const [featuredPost, setFeaturedPost] = useState<Post | null>(null)
    const [trendingPosts, setTrendingPosts] = useState<Post[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 모든 게시판에서 게시글 가져오기
                const boards = await apiService.getBoards()
                const allPosts: Post[] = []

                for (const board of boards) {
                    try {
                        const boardPosts = await apiService.getPosts(board.id)
                        allPosts.push(...boardPosts)
                    } catch (error) {
                        console.error(`Failed to fetch posts for ${board.id}:`, error)
                    }
                }

                // 조회수 기준 정렬
                const sortedPosts = allPosts.sort((a, b) => b.views - a.views)

                // 메인 피처 게시글 (조회수 가장 높은 것)
                if (sortedPosts.length > 0) {
                    setFeaturedPost(sortedPosts[0])
                }

                // 트렌딩 게시글 (상위 5개)
                setTrendingPosts(sortedPosts.slice(1, 6))

                // 전체 게시글
                setPosts(sortedPosts.slice(0, 12))

            } catch (error) {
                console.error('Failed to fetch data:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [])

    if (loading) {
        return <div className="loading">게임 뉴스를 불러오는 중...</div>
    }

    return (
        <div className="home-page">
            <div className="page-header">
                <div className="page-title">
                    <h1>Game News</h1>
                    <p>Latest gaming news and updates</p>
                </div>
                <div className="realtime-popular">
                    <h3>🔥 Real-time Popular</h3>
                    <div className="popular-number">10</div>
                    <div className="popular-list">
                        {trendingPosts.slice(0, 5).map((post, index) => (
                            <Link
                                key={post.id}
                                to={`/board/${post.board_id}/post/${post.id}`}
                                className="popular-item"
                            >
                                <span className="rank">{index + 1}</span>
                                <span className="title">{post.title}</span>
                                <div className="post-info">
                                    <span>{post.author || 'Anonymous'}</span>
                                    <div className="trending-icons">
                                        <span>↗</span>
                                        <span>↗</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                        <div className="popular-more">
                            <span>🔥 많은 순위 보기 →</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 메인 피처 뉴스 */}
            {featuredPost && (
                <div className="featured-news">
                    <div className="featured-image">
                        <div className="headline-badge">📈 Today's Headline</div>
                        <div className="featured-bg">
                            <div className="game-icons">
                                <div className="icon-1">🎮</div>
                                <div className="icon-2">🏆</div>
                                <div className="icon-3">⚔️</div>
                            </div>
                            <div className="bg-pattern"></div>
                        </div>
                    </div>
                    <div className="featured-content">
                        <h2>
                            <Link to={`/board/${featuredPost.board_id}/post/${featuredPost.id}`}>
                                {featuredPost.title}
                            </Link>
                        </h2>
                        <p>{featuredPost.content?.substring(0, 200) || 'League of Legends 2024 World Championship의 하이라이트! T1이 4년 만에 월드 챔피언십 타이틀을 되찾았습니다. Faker의 완벽한 플레이와 팀워크가 빛을 발했습니다...'}</p>
                        <div className="news-meta">
                            <span className="author">GameNews</span>
                            <span className="date">{new Date(featuredPost.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                            <span className="views">👁️ {featuredPost.views.toLocaleString()}</span>
                            <span className="comments">💬 {Math.floor(featuredPost.views / 100)}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* 뉴스 그리드 */}
            <div className="news-grid">
                {posts.slice(1, 4).map((post, index) => (
                    <div key={post.id} className="news-card">
                        {index === 0 && <div className="new-badge">NEW</div>}
                        {index === 1 && <div className="hot-badge">HOT</div>}
                        <div className="news-image">
                            <div className="news-bg" data-game={index}>
                                <div className="news-icon">
                                    {index === 0 ? '🎯' : index === 1 ? '🎪' : '🎨'}
                                </div>
                                <div className="news-pattern"></div>
                            </div>
                        </div>
                        <div className="news-info">
                            <h3>
                                <Link to={`/board/${post.board_id}/post/${post.id}`}>
                                    {post.title}
                                </Link>
                            </h3>
                            <div className="news-meta">
                                <span>News Team</span>
                                <span>{new Date(post.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default HomePage