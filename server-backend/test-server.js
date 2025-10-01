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
        timestamp: new Date().toISOString()
    });
});

// 헬스체크
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: '2.0.0'
    });
});

// AI 최적화 테스트
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

// 고급 모니터링 테스트
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

// 릴리즈 노트 테스트
app.get('/api/release-notes/notes', (req, res) => {
    res.json({
        success: true,
        data: [
            {
                id: 'note_1',
                version: '2.0.0',
                title: 'Community Platform 2.0 Release Notes',
                content: '# Community Platform 2.0\n\n## 🎉 New Features\n- AI 기반 자동 최적화\n- 고급 모니터링 시스템\n- 실시간 스트리밍\n- 릴리즈 사이트 운영',
                status: 'published',
                createdAt: new Date()
            }
        ]
    });
});

// 사용자 피드백 테스트
app.get('/api/user-feedback/feedback', (req, res) => {
    res.json({
        success: true,
        data: [
            {
                id: 'feedback_1',
                type: 'feature',
                title: 'AI 최적화 기능 요청',
                description: 'AI 기반 자동 최적화 기능이 정말 유용합니다!',
                status: 'open',
                createdAt: new Date()
            }
        ]
    });
});

// 다운로드 관리 테스트
app.get('/api/download-management/files', (req, res) => {
    res.json({
        success: true,
        data: [
            {
                id: 'file_1',
                originalName: 'community-platform-2.0.zip',
                size: 1024 * 1024 * 50, // 50MB
                downloadCount: 1234,
                uploadDate: new Date()
            }
        ]
    });
});

// 컨텐츠 모니터링 테스트
app.get('/api/content-monitoring/dashboard', (req, res) => {
    res.json({
        success: true,
        data: {
            timestamp: new Date(),
            overview: {
                totalContent: 1500,
                activeUsers: 250,
                totalEvents: 5000,
                engagementRate: 85.5
            },
            realTimeActivity: {
                eventsPerMinute: 25,
                topContent: ['Post 1', 'Post 2', 'Post 3'],
                activeUsers: ['user1', 'user2', 'user3']
            }
        }
    });
});

// 서버 시작
app.listen(PORT, () => {
    console.log(`🚀 Community Platform 2.0 Play Test Server running on port ${PORT}`);
    console.log(`📊 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`🤖 AI Optimization: http://localhost:${PORT}/api/ai-optimization/metrics`);
    console.log(`📈 Advanced Monitoring: http://localhost:${PORT}/api/advanced-monitoring/metrics`);
    console.log(`📝 Release Notes: http://localhost:${PORT}/api/release-notes/notes`);
    console.log(`💬 User Feedback: http://localhost:${PORT}/api/user-feedback/feedback`);
    console.log(`📁 Download Management: http://localhost:${PORT}/api/download-management/files`);
    console.log(`📊 Content Monitoring: http://localhost:${PORT}/api/content-monitoring/dashboard`);
});
