import express from 'express';
import cors from 'cors';
const app = express();
const PORT = process.env.PORT || 5000;

// 미들웨어
app.use(cors());
app.use(express.json());

// 기본 라우트
app.get('/', (req, res) => {
    res.json({
        message: '🎉 Community Platform 2.0 - Play Test Server',
        version: '2.0.0',
        status: 'running',
        timestamp: new Date().toISOString(),
        features: [
            '🎮 게임 센터',
            '🎭 코스플레이어 대시보드',
            '📺 스트리머 대시보드',
            '🤝 커뮤니티 연동',
            '⚡ AI 최적화',
            '📊 고급 모니터링'
        ]
    });
});

// 헬스체크
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: '2.0.0',
        services: {
            'game-center': 'active',
            'cosplayer-dashboard': 'active',
            'streamer-dashboard': 'active',
            'community-integration': 'active',
            'ai-optimization': 'active',
            'advanced-monitoring': 'active'
        }
    });
});

// 게임 센터 API
app.get('/api/community-games/games', (req, res) => {
    res.json({
        success: true,
        data: [
            {
                id: 'snake',
                name: 'Snake Game',
                description: '클래식 스네이크 게임',
                category: 'arcade',
                difficulty: 'easy',
                maxPlayers: 1,
                estimatedTime: 300,
                thumbnail: '/games/snake-thumbnail.png',
                gameUrl: '/games/snake/index.html',
                isActive: true,
                stats: {
                    totalPlays: 1234,
                    highScore: 2450,
                    averageScore: 850,
                    completionRate: 0.85
                }
            },
            {
                id: 'tetris',
                name: 'Tetris',
                description: '테트리스 블록 게임',
                category: 'puzzle',
                difficulty: 'medium',
                maxPlayers: 1,
                estimatedTime: 600,
                thumbnail: '/games/tetris-thumbnail.png',
                gameUrl: '/games/tetris/index.html',
                isActive: true,
                stats: {
                    totalPlays: 856,
                    highScore: 15600,
                    averageScore: 3200,
                    completionRate: 0.72
                }
            }
        ]
    });
});

// 코스플레이어 대시보드 API
app.get('/api/cosplayer/dashboard', (req, res) => {
    res.json({
        success: true,
        data: {
            totalCosplays: 12,
            totalCost: 2500000,
            totalTime: 180,
            portfolioItems: 8,
            upcomingEvents: 3,
            recentCosplays: [
                {
                    id: '1',
                    name: 'Sailor Moon',
                    character: 'Usagi Tsukino',
                    series: 'Sailor Moon',
                    status: 'completed',
                    cost: 150000,
                    timeSpent: 40,
                    rating: 4.5
                }
            ]
        }
    });
});

// 스트리머 대시보드 API
app.get('/api/streamer/dashboard', (req, res) => {
    res.json({
        success: true,
        data: {
            totalRevenue: 1500000,
            totalViewers: 12500,
            totalSubscribers: 456,
            totalStreams: 25,
            currentViewers: 0,
            isLive: false,
            recentStreams: [
                {
                    id: '1',
                    title: '게임 스트리밍 - 오버워치 2',
                    category: 'Gaming',
                    viewers: 1250,
                    duration: 180,
                    revenue: 150000
                }
            ]
        }
    });
});

// 커뮤니티 연동 API
app.get('/api/community-integration/stats', (req, res) => {
    res.json({
        success: true,
        data: {
            totalMembers: 1250,
            activeCollaborations: 15,
            totalEvents: 8,
            fanClubs: 12,
            recentActivity: [
                {
                    type: 'collaboration',
                    title: '애니메이션 코스플레이 라이브 스트리밍',
                    participants: 15,
                    status: 'active'
                },
                {
                    type: 'event',
                    title: '서울 코스플레이 대회 2024',
                    participants: 150,
                    status: 'scheduled'
                }
            ]
        }
    });
});

// AI 최적화 API
app.get('/api/ai-optimization/metrics', (req, res) => {
    res.json({
        success: true,
        data: {
            timestamp: new Date(),
            system: {
                cpu: { usage: Math.random() * 100, cores: 8, load: Math.random() * 10 },
                memory: { total: 16 * 1024 * 1024 * 1024, used: Math.random() * 16 * 1024 * 1024 * 1024 },
                disk: { total: 500 * 1024 * 1024 * 1024, used: Math.random() * 500 * 1024 * 1024 * 1024 },
                network: { bytesIn: Math.random() * 1000000, bytesOut: Math.random() * 1000000 }
            },
            application: {
                requests: Math.floor(Math.random() * 10000),
                responseTime: Math.random() * 2000,
                errorRate: Math.random() * 10,
                activeUsers: Math.floor(Math.random() * 1000)
            }
        }
    });
});

// 고급 모니터링 API
app.get('/api/advanced-monitoring/metrics', (req, res) => {
    res.json({
        success: true,
        data: {
            timestamp: new Date(),
            system: {
                cpu: { usage: Math.random() * 100, cores: 8, load: Math.random() * 10 },
                memory: { total: 16 * 1024 * 1024 * 1024, used: Math.random() * 16 * 1024 * 1024 * 1024 },
                disk: { total: 500 * 1024 * 1024 * 1024, used: Math.random() * 500 * 1024 * 1024 * 1024 },
                network: { bytesIn: Math.random() * 1000000, bytesOut: Math.random() * 1000000 }
            },
            application: {
                requests: Math.floor(Math.random() * 10000),
                responseTime: Math.random() * 2000,
                errorRate: Math.random() * 10,
                activeUsers: Math.floor(Math.random() * 1000)
            }
        }
    });
});

// 서버 시작
app.listen(PORT, () => {
    console.log(`🚀 Community Platform 2.0 Play Test Server running on port ${PORT}`);
    console.log(`📊 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`🎮 Game Center: http://localhost:${PORT}/api/community-games/games`);
    console.log(`🎭 Cosplayer Dashboard: http://localhost:${PORT}/api/cosplayer/dashboard`);
    console.log(`📺 Streamer Dashboard: http://localhost:${PORT}/api/streamer/dashboard`);
    console.log(`🤝 Community Integration: http://localhost:${PORT}/api/community-integration/stats`);
    console.log(`🤖 AI Optimization: http://localhost:${PORT}/api/ai-optimization/metrics`);
    console.log(`📈 Advanced Monitoring: http://localhost:${PORT}/api/advanced-monitoring/metrics`);
    console.log(`\n🎉 모든 기능이 정상적으로 실행 중입니다!`);
});
