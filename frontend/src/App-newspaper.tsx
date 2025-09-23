import React, { useState, useEffect } from 'react'

// 뉴스 데이터 타입
interface NewsItem {
    id: string
    title: string
    excerpt: string
    image: string
    author: string
    date: string
    category: string
    views: number
    comments: number
    isNew?: boolean
    isHot?: boolean
}

// 인기 게시글 타입
interface PopularItem {
    id: string
    title: string
    category: string
    views: number
    isRising?: boolean
}

// API 연결
const API_BASE_URL = 'http://localhost:50000/api'

// 백엔드에서 뉴스 데이터 가져오기
const fetchNews = async (): Promise<NewsItem[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/posts`)
        if (response.ok) {
            const posts = await response.json()
            return posts.map((post: any) => ({
                id: post.id,
                title: post.title,
                excerpt: post.content?.substring(0, 150) + '...' || 'No content available',
                image: post.image || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=200&fit=crop',
                author: post.author || 'Editorial Team',
                date: new Date(post.created_at || Date.now()).toLocaleDateString('ko-KR'),
                category: post.category || 'Gaming',
                views: post.views || Math.floor(Math.random() * 10000) + 1000,
                comments: post.comments_count || Math.floor(Math.random() * 100),
                isNew: post.is_featured || false,
                isHot: post.views > 5000
            }))
        }
    } catch (error) {
        console.error('API 연결 실패, 목 데이터 사용:', error)
    }

    // 목 데이터 (API 실패 시)
    return [
        {
            id: '1',
            title: 'League of Legends 2024 World Championship Finals',
            excerpt: 'T1 claimed the World Championship title after 4 years, delivering a historic performance. Faker\'s perfect gameplay and team coordination shined throughout the tournament.',
            image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=200&fit=crop',
            author: 'GameNews',
            date: '2024. 1. 15.',
            category: 'LOL',
            views: 12543,
            comments: 89,
            isHot: true
        },
        {
            id: '2',
            title: 'StarCraft II New Expansion Announced',
            excerpt: 'Blizzard officially announced a new expansion for StarCraft II. Following Protoss, Terran, and Zerg, a fourth race is expected to be introduced.',
            image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=200&fit=crop',
            author: 'Editorial Team',
            date: '2024. 1. 15.',
            category: 'StarCraft',
            views: 8234,
            comments: 156
        },
        {
            id: '3',
            title: 'Valorant New Map Screenshots Released',
            excerpt: 'Riot Games has released official screenshots of the new Valorant map. The map features a unique design combining urban and natural environments.',
            image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=200&fit=crop',
            author: 'News Team',
            date: '2024. 1. 15.',
            category: 'Valorant',
            views: 5678,
            comments: 78,
            isNew: true
        },
        {
            id: '4',
            title: 'Genshin Impact New Character Artwork',
            excerpt: 'miHoYo has revealed stunning character artwork for the upcoming Genshin Impact update, showcasing intricate details and beautiful design elements.',
            image: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=400&h=200&fit=crop',
            author: 'News Team',
            date: '2024. 1. 15.',
            category: 'Genshin',
            views: 9876,
            comments: 234,
            isHot: true
        }
    ]
}

// 인기 게시글 데이터 가져오기
const fetchPopular = async (): Promise<PopularItem[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/posts?sort=views&limit=5`)
        if (response.ok) {
            const posts = await response.json()
            return posts.map((post: any, index: number) => ({
                id: post.id,
                title: post.title,
                category: post.category || 'Gaming',
                views: post.views || Math.floor(Math.random() * 10000) + 1000,
                isRising: index < 3 // 상위 3개는 상승 중으로 표시
            }))
        }
    } catch (error) {
        console.error('API 연결 실패, 목 데이터 사용:', error)
    }

    // 목 데이터 (API 실패 시)
    return [
        { id: '1', title: 'T1 World Championship Victory', category: 'LOL', views: 15420, isRising: true },
        { id: '2', title: 'Valorant New Agent Details', category: 'Valorant', views: 12450, isRising: true },
        { id: '3', title: 'Overwatch 2 Season 4 Update', category: 'Overwatch', views: 8930, isRising: false },
        { id: '4', title: 'PC Cafe Rankings Change', category: 'Rankings', views: 7234, isRising: true },
        { id: '5', title: 'Genshin Impact New Character', category: 'Genshin', views: 6543, isRising: false }
    ]
}

// 목 데이터
const newsData: NewsItem[] = [
    {
        id: '1',
        title: 'League of Legends 2024 World Championship Finals',
        excerpt: 'T1 claimed the World Championship title after 4 years, delivering a historic performance. Faker\'s perfect gameplay and team coordination shined throughout the tournament.',
        image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=200&fit=crop',
        author: 'GameNews',
        date: '2024. 1. 15.',
        category: 'LOL',
        views: 12543,
        comments: 89,
        isHot: true
    },
    {
        id: '2',
        title: 'StarCraft II New Expansion Announced, Legacy of the Void Updates',
        excerpt: 'Blizzard officially announced a new expansion for StarCraft II. Following Protoss, Terran, and Zerg, a fourth race is expected to be introduced.',
        image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=200&fit=crop',
        author: 'Editorial Team',
        date: '2024. 1. 15.',
        category: 'StarCraft',
        views: 8234,
        comments: 156
    },
    {
        id: '3',
        title: 'Valorant New Map Screenshots Released',
        excerpt: 'Riot Games has released official screenshots of the new Valorant map. The map features a unique design combining urban and natural environments.',
        image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=200&fit=crop',
        author: 'News Team',
        date: '2024. 1. 15.',
        category: 'Valorant',
        views: 5678,
        comments: 78,
        isNew: true
    },
    {
        id: '4',
        title: 'Genshin Impact New Character Artwork',
        excerpt: 'miHoYo has revealed stunning character artwork for the upcoming Genshin Impact update, showcasing intricate details and beautiful design elements.',
        image: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=400&h=200&fit=crop',
        author: 'News Team',
        date: '2024. 1. 15.',
        category: 'Genshin',
        views: 9876,
        comments: 234,
        isHot: true
    }
]

const popularData: PopularItem[] = [
    { id: '1', title: 'T1 World Championship Victory', category: 'LOL', views: 15420, isRising: true },
    { id: '2', title: 'Valorant New Agent Details', category: 'Valorant', views: 12450, isRising: true },
    { id: '3', title: 'Overwatch 2 Season 4 Update', category: 'Overwatch', views: 8930, isRising: false },
    { id: '4', title: 'PC Cafe Rankings Change', category: 'Rankings', views: 7234, isRising: true },
    { id: '5', title: 'Genshin Impact New Character', category: 'Genshin', views: 6543, isRising: false }
]

function App() {
    const [currentTime, setCurrentTime] = useState(new Date())
    const [newsData, setNewsData] = useState<NewsItem[]>([])
    const [popularData, setPopularData] = useState<PopularItem[]>([])
    const [loading, setLoading] = useState(true)
    const [backendStatus, setBackendStatus] = useState<'connecting' | 'connected' | 'failed'>('connecting')

    // 백엔드 연결 상태 확인
    const checkBackendConnection = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/health`)
            if (response.ok) {
                setBackendStatus('connected')
            } else {
                setBackendStatus('failed')
            }
        } catch (error) {
            setBackendStatus('failed')
        }
    }

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date())
        }, 1000)

        return () => clearInterval(timer)
    }, [])

    useEffect(() => {
        const loadData = async () => {
            setLoading(true)
            await checkBackendConnection()

            const [news, popular] = await Promise.all([
                fetchNews(),
                fetchPopular()
            ])

            setNewsData(news)
            setPopularData(popular)
            setLoading(false)
        }

        loadData()

        // 5분마다 데이터 새로고침
        const interval = setInterval(loadData, 5 * 60 * 1000)
        return () => clearInterval(interval)
    }, [])

    return (
        <div>
            {/* Header */}
            <header className="header">
                <div className="container">
                    <div className="header-content">
                        <a href="#" className="logo">
                            📄 The News Paper
                            <span style={{ fontSize: '12px', color: '#999', fontWeight: 'normal' }}>
                                GAMING NEWS & COMMUNITY
                            </span>
                        </a>

                        <nav className="nav">
                            <a href="#" className="nav-item">News ▼</a>
                            <a href="#" className={`nav-item ${backendStatus === 'connecting' ? 'loading' : ''}`}>
                                Community {backendStatus === 'connected' ? '🟢' : backendStatus === 'connecting' ? '🔵' : '🔴'}
                                {backendStatus === 'connected' ? 'Connected' : backendStatus === 'connecting' ? 'Loading' : 'Offline'}
                            </a>
                            <a href="#" className="nav-item">Rankings ▼</a>
                        </nav>

                        <div className="search-login">
                            <div className="search-box">
                                <span className="search-icon">🔍</span>
                                <input
                                    type="text"
                                    className="search-input"
                                    placeholder="Search games, news..."
                                />
                            </div>
                            <a href="#" className="login-btn">👤 Login</a>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="container">
                <div className="main-content">
                    {/* Game News Section */}
                    <main className="game-news">
                        <div className="section-header">
                            <h1 className="section-title">Game News</h1>
                            <p className="section-subtitle">
                                Latest gaming news and updates
                                {backendStatus === 'connected' && <span style={{ color: '#4caf50' }}>• Live Data</span>}
                                {backendStatus === 'failed' && <span style={{ color: '#ff5722' }}>• Demo Mode</span>}
                            </p>
                        </div>

                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                                <div style={{ fontSize: '24px', marginBottom: '10px' }}>⏳</div>
                                Loading latest news...
                            </div>
                        ) : (
                            <div className="news-grid">
                                {newsData.map((news) => (
                                    <article key={news.id} className="news-card">
                                        <img src={news.image} alt={news.title} className="news-image" />
                                        <div className="news-content">
                                            <div style={{ marginBottom: '8px' }}>
                                                {news.isNew && <span className="news-badge badge-new">NEW</span>}
                                                {news.isHot && <span className="news-badge badge-hot">HOT</span>}
                                                {news.isNew && <span style={{ marginLeft: '8px', fontSize: '12px', color: '#999' }}>📰 Today's Headline</span>}
                                            </div>
                                            <h2 className="news-title">{news.title}</h2>
                                            <p className="news-excerpt">{news.excerpt}</p>
                                            <div className="news-meta">
                                                <span style={{ color: '#007bff', fontWeight: '500' }}>{news.author}</span>
                                                <span>{news.date}</span>
                                                <span>👁 {news.views.toLocaleString()}</span>
                                                <span>💬 {news.comments}</span>
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </main>

                    {/* Sidebar */}
                    <aside className="sidebar">
                        <div className="popular-section">
                            <div className="popular-header">
                                <h2 className="popular-title">
                                    🔥 Real-time Popular
                                    <span style={{
                                        marginLeft: '8px',
                                        fontSize: '12px',
                                        fontWeight: 'normal',
                                        background: '#007bff',
                                        color: 'white',
                                        padding: '2px 6px',
                                        borderRadius: '10px'
                                    }}>
                                        {popularData.length}
                                    </span>
                                </h2>
                                <a href="#" className="view-all">모든 순위 보기 →</a>
                            </div>

                            <div className="popular-list">
                                {popularData.map((item, index) => (
                                    <div key={item.id} className="popular-item">
                                        <div className="popular-rank">{index + 1}</div>
                                        <div className="popular-content">
                                            <h3 className="popular-item-title">{item.title}</h3>
                                            <div className="popular-meta">
                                                <span className="popular-category">{item.category}</span>
                                                <span>👁 {item.views.toLocaleString()}</span>
                                                {item.isRising && (
                                                    <span className="popular-trend">📈 ↗</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </aside>
                </div>
            </div>

            {/* Status Footer */}
            <div style={{
                position: 'fixed',
                bottom: '10px',
                right: '10px',
                background: 'rgba(0,0,0,0.8)',
                color: 'white',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '12px'
            }}>
                <div>✅ {currentTime.toLocaleString('ko-KR')}</div>
                <div>
                    Backend: {backendStatus === 'connected' ? '🟢 Online' : backendStatus === 'connecting' ? '🔵 Connecting' : '🔴 Offline'}
                </div>
            </div>
        </div>
    )
}

export default App