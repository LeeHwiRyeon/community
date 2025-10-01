// 목업 데이터 시스템
class MockDataSystem {
    constructor() {
        this.data = {
            users: this.generateUsers(),
            news: this.generateNews(),
            posts: this.generatePosts(),
            comments: this.generateComments(),
            analytics: this.generateAnalytics(),
            aiAgents: this.generateAIAgents(),
            system: this.generateSystemData()
        };

        this.startRealTimeUpdates();
    }

    // 사용자 데이터 생성
    generateUsers() {
        const users = [];
        const names = ['김철수', '이영희', '박민수', '최지영', '정현우', '강서연', '윤태호', '임수진'];
        const roles = ['admin', 'editor', 'user', 'moderator'];
        const statuses = ['online', 'offline', 'away', 'busy'];

        for (let i = 1; i <= 1000; i++) {
            users.push({
                id: i,
                name: names[Math.floor(Math.random() * names.length)] + i,
                email: `user${i}@example.com`,
                role: roles[Math.floor(Math.random() * roles.length)],
                status: statuses[Math.floor(Math.random() * statuses.length)],
                joinDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
                lastActive: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
                sessionCount: Math.floor(Math.random() * 100),
                totalTimeSpent: Math.floor(Math.random() * 10000),
                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`,
                preferences: {
                    theme: Math.random() > 0.5 ? 'dark' : 'light',
                    language: 'ko',
                    notifications: Math.random() > 0.3
                }
            });
        }
        return users;
    }

    // 뉴스 데이터 생성
    generateNews() {
        const news = [];
        const categories = ['기술', '게임', '개발', '디자인', '비즈니스', '라이프스타일'];
        const titles = [
            'AI 기술 발전으로 커뮤니티 플랫폼 혁신',
            '게임 커뮤니티 활성화 방안 모색',
            '개발자 커뮤니티 성장세 지속',
            '크리에이터 지원 프로그램 확대',
            '모바일 앱 업데이트 안내',
            '새로운 기능 출시 예정',
            '커뮤니티 가이드라인 업데이트',
            '사용자 피드백 반영 결과'
        ];

        for (let i = 1; i <= 50; i++) {
            const publishDate = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
            news.push({
                id: i,
                title: titles[Math.floor(Math.random() * titles.length)],
                content: `뉴스 내용 ${i}입니다. 이는 목업 데이터로 생성된 샘플 뉴스입니다.`,
                category: categories[Math.floor(Math.random() * categories.length)],
                author: `작성자${i}`,
                publishDate: publishDate,
                views: Math.floor(Math.random() * 5000),
                likes: Math.floor(Math.random() * 500),
                comments: Math.floor(Math.random() * 100),
                status: Math.random() > 0.1 ? 'published' : 'draft',
                tags: ['커뮤니티', '기술', '업데이트'],
                thumbnail: `https://picsum.photos/300/200?random=${i}`,
                featured: Math.random() > 0.8
            });
        }
        return news;
    }

    // 게시글 데이터 생성
    generatePosts() {
        const posts = [];
        const types = ['discussion', 'question', 'announcement', 'showcase', 'tutorial'];
        const titles = [
            '새로운 프로젝트 시작했습니다',
            '질문이 있어서 글 올립니다',
            '공지사항입니다',
            '작품을 공유합니다',
            '튜토리얼을 작성했습니다'
        ];

        for (let i = 1; i <= 500; i++) {
            posts.push({
                id: i,
                title: titles[Math.floor(Math.random() * titles.length)] + ` ${i}`,
                content: `게시글 내용 ${i}입니다.`,
                type: types[Math.floor(Math.random() * types.length)],
                authorId: Math.floor(Math.random() * 1000) + 1,
                boardId: Math.floor(Math.random() * 10) + 1,
                createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
                updatedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
                views: Math.floor(Math.random() * 1000),
                likes: Math.floor(Math.random() * 100),
                comments: Math.floor(Math.random() * 50),
                status: Math.random() > 0.05 ? 'published' : 'deleted',
                tags: ['태그1', '태그2', '태그3'],
                featured: Math.random() > 0.9
            });
        }
        return posts;
    }

    // 댓글 데이터 생성
    generateComments() {
        const comments = [];

        for (let i = 1; i <= 2000; i++) {
            comments.push({
                id: i,
                content: `댓글 내용 ${i}입니다.`,
                postId: Math.floor(Math.random() * 500) + 1,
                authorId: Math.floor(Math.random() * 1000) + 1,
                parentId: Math.random() > 0.8 ? Math.floor(Math.random() * i) : null,
                createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
                likes: Math.floor(Math.random() * 20),
                status: Math.random() > 0.95 ? 'deleted' : 'published'
            });
        }
        return comments;
    }

    // 분석 데이터 생성
    generateAnalytics() {
        return {
            overview: {
                totalUsers: 12847,
                activeUsers: 3247,
                totalPosts: 3291,
                totalComments: 18456,
                pageViews: 89234,
                sessionDuration: 245, // seconds
                bounceRate: 0.32,
                conversionRate: 0.124
            },
            trends: {
                userGrowth: this.generateTrendData(30, 100, 200),
                postGrowth: this.generateTrendData(30, 50, 150),
                commentGrowth: this.generateTrendData(30, 200, 800),
                pageViewGrowth: this.generateTrendData(30, 1000, 5000)
            },
            demographics: {
                ageGroups: {
                    '18-24': 25,
                    '25-34': 35,
                    '35-44': 28,
                    '45-54': 12
                },
                gender: {
                    male: 60,
                    female: 40
                },
                location: {
                    '서울': 40,
                    '경기': 25,
                    '부산': 10,
                    '기타': 25
                }
            },
            engagement: {
                dailyActiveUsers: this.generateTrendData(30, 2000, 4000),
                weeklyActiveUsers: this.generateTrendData(12, 8000, 15000),
                monthlyActiveUsers: this.generateTrendData(12, 20000, 35000),
                averageSessionTime: this.generateTrendData(30, 180, 300)
            }
        };
    }

    // AI 에이전트 데이터 생성
    generateAIAgents() {
        return [
            {
                id: 'content-generator',
                name: 'Content Generator',
                type: 'content',
                status: 'active',
                successRate: 0.942,
                totalTasks: 1247,
                completedTasks: 1174,
                failedTasks: 73,
                averageExecutionTime: 2.3,
                lastActivity: new Date(Date.now() - Math.random() * 60 * 60 * 1000),
                capabilities: ['text-generation', 'content-optimization', 'seo-optimization'],
                performance: {
                    cpu: Math.random() * 30 + 20,
                    memory: Math.random() * 40 + 30,
                    responseTime: Math.random() * 1000 + 500
                }
            },
            {
                id: 'code-generator',
                name: 'Code Generator',
                type: 'code',
                status: 'idle',
                successRate: 0.918,
                totalTasks: 892,
                completedTasks: 819,
                failedTasks: 73,
                averageExecutionTime: 3.1,
                lastActivity: new Date(Date.now() - Math.random() * 120 * 60 * 1000),
                capabilities: ['code-generation', 'code-review', 'bug-fixing'],
                performance: {
                    cpu: Math.random() * 20 + 10,
                    memory: Math.random() * 30 + 20,
                    responseTime: Math.random() * 1500 + 800
                }
            },
            {
                id: 'analysis-agent',
                name: 'Analysis Agent',
                type: 'analysis',
                status: 'error',
                successRate: 0.873,
                totalTasks: 654,
                completedTasks: 571,
                failedTasks: 83,
                averageExecutionTime: 4.2,
                lastActivity: new Date(Date.now() - Math.random() * 30 * 60 * 1000),
                capabilities: ['data-analysis', 'pattern-recognition', 'insight-generation'],
                performance: {
                    cpu: Math.random() * 50 + 40,
                    memory: Math.random() * 60 + 50,
                    responseTime: Math.random() * 2000 + 1000
                }
            },
            {
                id: 'optimization-agent',
                name: 'Optimization Agent',
                type: 'optimization',
                status: 'disabled',
                successRate: 0.891,
                totalTasks: 423,
                completedTasks: 377,
                failedTasks: 46,
                averageExecutionTime: 5.8,
                lastActivity: new Date(Date.now() - Math.random() * 240 * 60 * 1000),
                capabilities: ['performance-optimization', 'resource-management', 'scaling'],
                performance: {
                    cpu: 0,
                    memory: 0,
                    responseTime: 0
                }
            }
        ];
    }

    // 시스템 데이터 생성
    generateSystemData() {
        return {
            server: {
                cpu: Math.random() * 30 + 20,
                memory: Math.random() * 40 + 30,
                disk: Math.random() * 20 + 10,
                network: {
                    latency: Math.random() * 20 + 10,
                    throughput: Math.random() * 100 + 50,
                    errors: Math.floor(Math.random() * 5)
                }
            },
            database: {
                connections: Math.floor(Math.random() * 50 + 20),
                queryTime: Math.random() * 100 + 50,
                cacheHitRate: Math.random() * 20 + 80,
                size: Math.random() * 1000 + 500
            },
            services: {
                api: {
                    status: 'healthy',
                    responseTime: Math.random() * 200 + 100,
                    uptime: 99.9
                },
                auth: {
                    status: 'healthy',
                    responseTime: Math.random() * 150 + 50,
                    uptime: 99.8
                },
                notification: {
                    status: 'healthy',
                    responseTime: Math.random() * 300 + 200,
                    uptime: 99.5
                }
            }
        };
    }

    // 트렌드 데이터 생성
    generateTrendData(days, min, max) {
        const data = [];
        for (let i = 0; i < days; i++) {
            data.push({
                date: new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000),
                value: Math.floor(Math.random() * (max - min) + min)
            });
        }
        return data;
    }

    // 실시간 업데이트 시작
    startRealTimeUpdates() {
        setInterval(() => {
            this.updateRealTimeData();
        }, 5000); // 5초마다 업데이트
    }

    // 실시간 데이터 업데이트
    updateRealTimeData() {
        // 온라인 사용자 수 업데이트
        const onlineUsers = this.data.users.filter(user => user.status === 'online').length;
        const change = Math.floor(Math.random() * 20) - 10;
        const newCount = Math.max(0, onlineUsers + change);

        // 일부 사용자 상태 변경
        this.data.users.forEach(user => {
            if (Math.random() < 0.1) { // 10% 확률로 상태 변경
                const statuses = ['online', 'offline', 'away', 'busy'];
                user.status = statuses[Math.floor(Math.random() * statuses.length)];
                user.lastActive = new Date();
            }
        });

        // 뉴스 조회수 업데이트
        this.data.news.forEach(news => {
            if (Math.random() < 0.3) { // 30% 확률로 조회수 증가
                news.views += Math.floor(Math.random() * 10);
            }
        });

        // 게시글 조회수 업데이트
        this.data.posts.forEach(post => {
            if (Math.random() < 0.2) { // 20% 확률로 조회수 증가
                post.views += Math.floor(Math.random() * 5);
            }
        });

        // 시스템 메트릭 업데이트
        this.data.system.server.cpu = Math.max(0, Math.min(100, this.data.system.server.cpu + (Math.random() - 0.5) * 10));
        this.data.system.server.memory = Math.max(0, Math.min(100, this.data.system.server.memory + (Math.random() - 0.5) * 5));
    }

    // 데이터 조회 메서드들
    getUsers(limit = 100, offset = 0) {
        return this.data.users.slice(offset, offset + limit);
    }

    getNews(limit = 20, offset = 0) {
        return this.data.news.slice(offset, offset + limit);
    }

    getPosts(limit = 50, offset = 0) {
        return this.data.posts.slice(offset, offset + limit);
    }

    getComments(postId = null, limit = 50, offset = 0) {
        let comments = this.data.comments;
        if (postId) {
            comments = comments.filter(comment => comment.postId === postId);
        }
        return comments.slice(offset, offset + limit);
    }

    getAnalytics() {
        return this.data.analytics;
    }

    getAIAgents() {
        return this.data.aiAgents;
    }

    getSystemData() {
        return this.data.system;
    }

    // 통계 데이터 조회
    getStats() {
        const onlineUsers = this.data.users.filter(user => user.status === 'online').length;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayPosts = this.data.posts.filter(post =>
            new Date(post.createdAt) >= today
        ).length;

        const todayComments = this.data.comments.filter(comment =>
            new Date(comment.createdAt) >= today
        ).length;

        return {
            onlineUsers,
            todayVisits: Math.floor(Math.random() * 1000) + 3000,
            newPosts: todayPosts,
            newComments: todayComments,
            totalUsers: this.data.users.length,
            totalPosts: this.data.posts.length,
            totalComments: this.data.comments.length
        };
    }

    // 뉴스 관리 메서드들
    createNews(newsData) {
        const newNews = {
            id: this.data.news.length + 1,
            ...newsData,
            publishDate: new Date(),
            views: 0,
            likes: 0,
            comments: 0,
            status: 'draft',
            featured: false
        };
        this.data.news.unshift(newNews);
        return newNews;
    }

    updateNews(id, updates) {
        const index = this.data.news.findIndex(news => news.id === id);
        if (index !== -1) {
            this.data.news[index] = { ...this.data.news[index], ...updates };
            return this.data.news[index];
        }
        return null;
    }

    deleteNews(id) {
        const index = this.data.news.findIndex(news => news.id === id);
        if (index !== -1) {
            return this.data.news.splice(index, 1)[0];
        }
        return null;
    }

    publishNews(id) {
        return this.updateNews(id, {
            status: 'published',
            publishDate: new Date()
        });
    }
}

// 전역 인스턴스 생성
window.mockDataSystem = new MockDataSystem();

// 내보내기 (Node.js 환경에서 사용할 경우)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MockDataSystem;
}
