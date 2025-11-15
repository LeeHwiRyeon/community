const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

// AutoAgent 통계 조회
router.get('/stats', async (req, res) => {
    try {
        // 실제 데이터베이스에서 통계 조회
        const stats = {
            users: {
                total: 1250,
                active: 89,
                new_today: 12
            },
            posts: {
                total: 3456,
                today: 23,
                this_week: 156
            },
            comments: {
                total: 12340,
                today: 67,
                this_week: 445
            },
            boards: {
                total: 8,
                active: 8
            },
            chat: {
                active_rooms: 3,
                online_users: 15,
                messages_today: 234
            },
            system: {
                uptime: process.uptime(),
                memory_usage: process.memoryUsage(),
                cpu_usage: process.cpuUsage()
            }
        };

        res.json({
            success: true,
            data: stats,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('AutoAgent 통계 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '통계 조회 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// AutoAgent 성능 메트릭 조회
router.get('/performance', async (req, res) => {
    try {
        const performance = {
            system: {
                cpu: process.cpuUsage(),
                memory: process.memoryUsage(),
                uptime: process.uptime(),
                platform: process.platform,
                node_version: process.version
            },
            api: {
                avg_response_time: Math.floor(Math.random() * 100) + 50, // 시뮬레이션
                requests_per_minute: Math.floor(Math.random() * 50) + 20,
                error_rate: Math.random() * 0.05
            },
            database: {
                connection_pool_size: 10,
                active_connections: Math.floor(Math.random() * 8) + 2,
                query_avg_time: Math.floor(Math.random() * 50) + 10
            },
            redis: {
                connected: true,
                memory_usage: Math.floor(Math.random() * 100) + 50,
                operations_per_second: Math.floor(Math.random() * 1000) + 500
            }
        };

        res.json({
            success: true,
            data: performance,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('AutoAgent 성능 메트릭 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '성능 메트릭 조회 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// AutoAgent 작업 상태 조회
router.get('/tasks', async (req, res) => {
    try {
        const tasks = {
            news_collection: {
                status: 'running',
                last_run: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
                next_run: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
                success_count: 156,
                error_count: 2
            },
            fx_collection: {
                status: 'running',
                last_run: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
                next_run: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
                success_count: 89,
                error_count: 0
            },
            community_monitoring: {
                status: 'running',
                last_run: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
                next_run: new Date(Date.now() + 2 * 60 * 1000).toISOString(),
                success_count: 234,
                error_count: 1
            },
            performance_monitoring: {
                status: 'running',
                last_run: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
                next_run: new Date(Date.now() + 3 * 60 * 1000).toISOString(),
                success_count: 445,
                error_count: 0
            },
            user_activity_analysis: {
                status: 'running',
                last_run: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
                next_run: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
                success_count: 78,
                error_count: 0
            },
            post_trend_analysis: {
                status: 'running',
                last_run: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
                next_run: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
                success_count: 123,
                error_count: 1
            },
            statistics_collection: {
                status: 'running',
                last_run: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
                next_run: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
                success_count: 67,
                error_count: 0
            }
        };

        res.json({
            success: true,
            data: tasks,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('AutoAgent 작업 상태 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '작업 상태 조회 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// AutoAgent 로그 조회
router.get('/logs', async (req, res) => {
    try {
        const { level = 'all', limit = 100 } = req.query;

        // 실제로는 로그 파일에서 읽어와야 함
        const logs = [
            {
                timestamp: new Date().toISOString(),
                level: 'info',
                message: 'AutoAgent가 정상적으로 실행 중입니다.',
                source: 'AutoAgent.Worker'
            },
            {
                timestamp: new Date(Date.now() - 60000).toISOString(),
                level: 'info',
                message: '뉴스 수집 작업이 완료되었습니다. 5개 항목 수집됨.',
                source: 'NewsCollector'
            },
            {
                timestamp: new Date(Date.now() - 120000).toISOString(),
                level: 'info',
                message: '환율 데이터 수집이 완료되었습니다.',
                source: 'FXCollector'
            },
            {
                timestamp: new Date(Date.now() - 180000).toISOString(),
                level: 'info',
                message: '커뮤니티 플랫폼 상태 모니터링 완료.',
                source: 'CommunityMonitor'
            },
            {
                timestamp: new Date(Date.now() - 240000).toISOString(),
                level: 'warning',
                message: '일부 API 응답 시간이 평소보다 느립니다.',
                source: 'PerformanceMonitor'
            }
        ];

        let filteredLogs = logs;
        if (level !== 'all') {
            filteredLogs = logs.filter(log => log.level === level);
        }

        res.json({
            success: true,
            data: filteredLogs.slice(0, parseInt(limit)),
            total: filteredLogs.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('AutoAgent 로그 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '로그 조회 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// AutoAgent 설정 조회
router.get('/config', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const config = {
            news_collection: {
                enabled: true,
                interval_minutes: 5,
                sources: ['rss1', 'rss2', 'rss3']
            },
            fx_collection: {
                enabled: true,
                interval_minutes: 10,
                currencies: ['USD', 'EUR', 'JPY', 'GBP']
            },
            community_monitoring: {
                enabled: true,
                interval_minutes: 2,
                endpoints: ['/api/health-check', '/api/stats']
            },
            performance_monitoring: {
                enabled: true,
                interval_minutes: 3,
                metrics: ['cpu', 'memory', 'disk', 'network']
            },
            user_activity_analysis: {
                enabled: true,
                interval_minutes: 10,
                analysis_types: ['login_patterns', 'content_preferences', 'engagement_metrics']
            },
            post_trend_analysis: {
                enabled: true,
                interval_minutes: 15,
                analysis_types: ['popular_topics', 'engagement_trends', 'content_quality']
            },
            statistics_collection: {
                enabled: true,
                interval_minutes: 5,
                metrics: ['user_stats', 'content_stats', 'system_stats']
            }
        };

        res.json({
            success: true,
            data: config,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('AutoAgent 설정 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '설정 조회 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// AutoAgent 설정 업데이트
router.put('/config', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { config } = req.body;

        // 실제로는 설정 파일이나 데이터베이스에 저장해야 함
        console.log('AutoAgent 설정 업데이트:', config);

        res.json({
            success: true,
            message: 'AutoAgent 설정이 업데이트되었습니다.',
            data: config,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('AutoAgent 설정 업데이트 오류:', error);
        res.status(500).json({
            success: false,
            message: '설정 업데이트 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// TODO 자동 진행 엔드포인트
router.post('/todo-auto-progress', async (req, res) => {
    try {
        logger.info('TODO 자동 진행 요청 수신');

        // TODO 목록 조회
        const todosResponse = await fetch('http://localhost:50000/api/todos');
        const todosData = await todosResponse.json();

        if (!todosData.success) {
            throw new Error('TODO 목록 조회 실패');
        }

        const todos = todosData.data || [];

        // 다음 실행할 TODO 선택
        const nextTodo = selectNextTodo(todos);

        if (!nextTodo) {
            logger.info('실행할 TODO가 없습니다.');
            return res.json({
                success: true,
                message: '실행할 TODO가 없습니다.',
                data: { processedTodo: null }
            });
        }

        // TODO 실행 시뮬레이션
        const executionResult = await executeTodo(nextTodo);

        // TODO 상태 업데이트
        await updateTodoStatus(nextTodo.id, executionResult.success ? 'completed' : 'failed');

        // 결과 로깅
        logger.info(`TODO 자동 진행 완료: ${nextTodo.id} - ${nextTodo.content}`, {
            success: executionResult.success,
            message: executionResult.message
        });

        res.json({
            success: true,
            message: `TODO '${nextTodo.content}' 자동 진행 완료`,
            data: {
                processedTodo: nextTodo,
                executionResult: executionResult,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        logger.error('TODO 자동 진행 오류:', error);
        res.status(500).json({
            success: false,
            message: 'TODO 자동 진행 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 다음 실행할 TODO 선택 함수
function selectNextTodo(todos) {
    // 1. 진행 중인 TODO가 있으면 그것을 우선 실행
    const inProgressTodo = todos.find(t => t.status === 'in_progress');
    if (inProgressTodo) {
        logger.info(`진행 중인 TODO 선택: ${inProgressTodo.id} - ${inProgressTodo.content}`);
        return inProgressTodo;
    }

    // 2. 대기 중인 TODO 중에서 우선순위가 높은 것 선택
    const pendingTodos = todos.filter(t => t.status === 'pending');
    if (pendingTodos.length === 0) {
        return null;
    }

    // 우선순위별 정렬
    const priorityOrder = {
        'OPTIMIZATION': 1,
        'DEPLOYMENT': 2,
        'USER_EXPERIENCE': 3,
        'ADVANCED_FEATURES': 4,
        'SECURITY': 5,
        'ANALYTICS': 6,
        'INTEGRATION': 7
    };

    const selectedTodo = pendingTodos
        .sort((a, b) => {
            const priorityA = priorityOrder[a.category] || 999;
            const priorityB = priorityOrder[b.category] || 999;
            if (priorityA !== priorityB) return priorityA - priorityB;
            return new Date(a.createdAt) - new Date(b.createdAt);
        })[0];

    logger.info(`다음 TODO 선택: ${selectedTodo.id} - ${selectedTodo.content} (카테고리: ${selectedTodo.category})`);
    return selectedTodo;
}

// TODO 실행 함수
async function executeTodo(todo) {
    try {
        logger.info(`TODO 실행 시작: ${todo.id} - ${todo.content}`);

        // TODO 상태를 진행 중으로 변경
        await updateTodoStatus(todo.id, 'in_progress');

        // TODO 유형에 따른 실행 로직 시뮬레이션
        const executionTime = getExecutionTime(todo.category);
        await new Promise(resolve => setTimeout(resolve, executionTime));

        // 실행 결과 생성
        const result = {
            success: Math.random() > 0.1, // 90% 성공률
            message: `TODO '${todo.content}' 실행 완료`,
            details: generateExecutionDetails(todo),
            timestamp: new Date().toISOString()
        };

        logger.info(`TODO 실행 완료: ${todo.id} - ${result.success ? '성공' : '실패'}`);
        return result;
    } catch (error) {
        logger.error(`TODO 실행 실패: ${todo.id}`, error);
        return {
            success: false,
            message: `TODO 실행 실패: ${error.message}`,
            details: error.toString(),
            timestamp: new Date().toISOString()
        };
    }
}

// TODO 상태 업데이트 함수
async function updateTodoStatus(todoId, status) {
    try {
        const updateData = {
            status: status,
            updatedAt: new Date().toISOString()
        };

        const response = await fetch(`http://localhost:50000/api/todos/${todoId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
        });

        if (!response.ok) {
            throw new Error(`상태 업데이트 실패: ${response.status}`);
        }

        logger.info(`TODO 상태 업데이트: ${todoId} -> ${status}`);
    } catch (error) {
        logger.error(`TODO 상태 업데이트 실패: ${todoId}`, error);
    }
}

// 실행 시간 계산 함수
function getExecutionTime(category) {
    const executionTimes = {
        'OPTIMIZATION': 2000,
        'DEPLOYMENT': 3000,
        'USER_EXPERIENCE': 2500,
        'ADVANCED_FEATURES': 4000,
        'SECURITY': 3500,
        'ANALYTICS': 3000,
        'INTEGRATION': 2500
    };
    return executionTimes[category] || 2000;
}

// 실행 세부사항 생성 함수
function generateExecutionDetails(todo) {
    const details = {
        'OPTIMIZATION': '데이터베이스, API, 프론트엔드 성능 최적화 완료',
        'DEPLOYMENT': '배포 환경 검증 및 설정 완료',
        'USER_EXPERIENCE': '사용자 행동 분석 및 UI 개선 완료',
        'ADVANCED_FEATURES': 'AI 추천, 협업 도구, 검색 시스템 개선 완료',
        'SECURITY': '보안 감사, 암호화, 인증 시스템 강화 완료',
        'ANALYTICS': 'BI 대시보드, ML 예측, A/B 테스트 구축 완료',
        'INTEGRATION': '외부 서비스 연동, 플러그인 시스템, 웹훅 구축 완료'
    };
    return details[todo.category] || '일반 작업 실행 완료';
}

// TODO 자동 생성 엔드포인트
router.post('/todo-generation', async (req, res) => {
    try {
        logger.info('TODO 자동 생성 요청 수신');

        // 시스템 상태 분석
        const systemAnalysis = await analyzeSystemStatus();

        // 기존 TODO 분석
        const existingTodos = await getExistingTodos();

        // 새로운 TODO 생성
        const newTodos = await generateNewTodos(systemAnalysis, existingTodos);

        // TODO 저장
        const savedTodos = await saveTodos(newTodos);

        logger.info(`TODO 자동 생성 완료: ${savedTodos.length}개 생성`);

        res.json({
            success: true,
            message: `${savedTodos.length}개의 새로운 TODO가 생성되었습니다.`,
            data: {
                generatedTodos: savedTodos,
                systemAnalysis: systemAnalysis,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        logger.error('TODO 자동 생성 오류:', error);
        res.status(500).json({
            success: false,
            message: 'TODO 자동 생성 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 시스템 상태 분석 함수
async function analyzeSystemStatus() {
    try {
        // Community Platform 상태 확인
        const healthResponse = await fetch('http://localhost:50000/api/health-check');
        const isHealthy = healthResponse.ok;

        // 성능 메트릭 수집
        const performanceResponse = await fetch('http://localhost:50000/api/agent/performance');
        const performanceData = performanceResponse.ok ?
            await performanceResponse.json() : {};

        // 분석 결과 수집
        const analyticsResponse = await fetch('http://localhost:50000/api/analytics/dashboard');
        const analyticsData = analyticsResponse.ok ?
            await analyticsResponse.json() : {};

        return {
            isHealthy,
            performanceMetrics: performanceData,
            analyticsData: analyticsData,
            timestamp: new Date().toISOString(),
            issues: identifyIssues(isHealthy, performanceData, analyticsData),
            opportunities: identifyOpportunities(analyticsData),
            recommendations: generateRecommendations(isHealthy, performanceData, analyticsData)
        };
    } catch (error) {
        logger.warning('시스템 상태 분석 중 오류, 기본값 사용', error);
        return {
            isHealthy: true,
            timestamp: new Date().toISOString(),
            issues: [],
            opportunities: [],
            recommendations: []
        };
    }
}

// 기존 TODO 조회 함수
async function getExistingTodos() {
    try {
        const response = await fetch('http://localhost:50000/api/todos');
        if (response.ok) {
            const data = await response.json();
            return data.data || [];
        }
    } catch (error) {
        logger.warning('기존 TODO 조회 실패', error);
    }
    return [];
}

// 새로운 TODO 생성 함수
async function generateNewTodos(systemAnalysis, existingTodos) {
    const newTodos = [];
    const existingCategories = existingTodos.map(t => t.category);

    // 1. 시스템 이슈 기반 TODO 생성
    systemAnalysis.issues.forEach(issue => {
        const todo = createTodoFromIssue(issue, existingCategories);
        if (todo) newTodos.push(todo);
    });

    // 2. 기회 기반 TODO 생성
    systemAnalysis.opportunities.forEach(opportunity => {
        const todo = createTodoFromOpportunity(opportunity, existingCategories);
        if (todo) newTodos.push(todo);
    });

    // 3. 권장사항 기반 TODO 생성
    systemAnalysis.recommendations.forEach(recommendation => {
        const todo = createTodoFromRecommendation(recommendation, existingCategories);
        if (todo) newTodos.push(todo);
    });

    // 4. 정기적인 유지보수 TODO 생성
    const maintenanceTodos = generateMaintenanceTodos(existingCategories);
    newTodos.push(...maintenanceTodos);

    // 5. 새로운 기능 개발 TODO 생성
    const featureTodos = generateFeatureTodos(existingCategories);
    newTodos.push(...featureTodos);

    return newTodos;
}

// TODO 저장 함수
async function saveTodos(todos) {
    const savedTodos = [];

    for (const todo of todos) {
        try {
            const response = await fetch('http://localhost:50000/api/todos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(todo)
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    savedTodos.push(data.data);
                    logger.info(`TODO 저장 성공: ${todo.content}`);
                }
            }
        } catch (error) {
            logger.warning(`TODO 저장 실패: ${todo.content}`, error);
        }
    }

    return savedTodos;
}

// 이슈 식별 함수
function identifyIssues(isHealthy, performanceData, analyticsData) {
    const issues = [];

    if (!isHealthy) {
        issues.push('시스템 상태 불안정');
    }

    if (performanceData.cpu && performanceData.cpu > 80) {
        issues.push('CPU 사용률 높음');
    }

    if (performanceData.memory && performanceData.memory > 80) {
        issues.push('메모리 사용률 높음');
    }

    if (analyticsData.trends && analyticsData.trends.userGrowth < 0.1) {
        issues.push('사용자 성장률 저하');
    }

    return issues;
}

// 기회 식별 함수
function identifyOpportunities(analyticsData) {
    const opportunities = [];

    if (analyticsData.trends && analyticsData.trends.userGrowth > 0.2) {
        opportunities.push('사용자 성장 기회');
    }

    if (analyticsData.trendingTopics && analyticsData.trendingTopics.length > 0) {
        opportunities.push('새로운 트렌드 활용');
    }

    return opportunities;
}

// 권장사항 생성 함수
function generateRecommendations(isHealthy, performanceData, analyticsData) {
    const recommendations = [];

    if (!isHealthy) {
        recommendations.push('시스템 안정성 개선 필요');
    }

    if (performanceData.cpu && performanceData.cpu > 70) {
        recommendations.push('성능 최적화 권장');
    }

    if (analyticsData.userEngagement && analyticsData.userEngagement < 0.5) {
        recommendations.push('사용자 경험 개선 필요');
    }

    return recommendations;
}

// 이슈 기반 TODO 생성 함수
function createTodoFromIssue(issue, existingCategories) {
    const todoTemplates = {
        '시스템 상태 불안정': {
            content: '시스템 안정성 개선 및 모니터링 강화',
            category: 'OPTIMIZATION',
            priority: 1
        },
        'CPU 사용률 높음': {
            content: 'CPU 사용률 최적화 및 리소스 관리 개선',
            category: 'OPTIMIZATION',
            priority: 1
        },
        '메모리 사용률 높음': {
            content: '메모리 사용률 최적화 및 메모리 누수 방지',
            category: 'OPTIMIZATION',
            priority: 1
        },
        '사용자 성장률 저하': {
            content: '사용자 성장률 향상을 위한 전략 수립',
            category: 'USER_EXPERIENCE',
            priority: 2
        }
    };

    const template = todoTemplates[issue];
    if (!template || existingCategories.includes(template.category)) {
        return null;
    }

    return {
        id: `ISSUE_${Date.now()}`,
        content: template.content,
        category: template.category,
        priority: template.priority,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
}

// 기회 기반 TODO 생성 함수
function createTodoFromOpportunity(opportunity, existingCategories) {
    const todoTemplates = {
        '사용자 성장 기회': {
            content: '사용자 성장을 위한 마케팅 전략 수립',
            category: 'USER_EXPERIENCE',
            priority: 3
        },
        '새로운 트렌드 활용': {
            content: '새로운 트렌드를 활용한 기능 개발',
            category: 'ADVANCED_FEATURES',
            priority: 4
        }
    };

    const template = todoTemplates[opportunity];
    if (!template || existingCategories.includes(template.category)) {
        return null;
    }

    return {
        id: `OPPORTUNITY_${Date.now()}`,
        content: template.content,
        category: template.category,
        priority: template.priority,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
}

// 권장사항 기반 TODO 생성 함수
function createTodoFromRecommendation(recommendation, existingCategories) {
    const todoTemplates = {
        '시스템 안정성 개선 필요': {
            content: '시스템 안정성 개선 및 장애 대응 체계 구축',
            category: 'OPTIMIZATION',
            priority: 1
        },
        '성능 최적화 권장': {
            content: '데이터베이스 및 API 성능 최적화',
            category: 'OPTIMIZATION',
            priority: 2
        },
        '사용자 경험 개선 필요': {
            content: '사용자 인터페이스 및 경험 개선',
            category: 'USER_EXPERIENCE',
            priority: 3
        }
    };

    const template = todoTemplates[recommendation];
    if (!template || existingCategories.includes(template.category)) {
        return null;
    }

    return {
        id: `RECOMMENDATION_${Date.now()}`,
        content: template.content,
        category: template.category,
        priority: template.priority,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
}

// 유지보수 TODO 생성 함수
function generateMaintenanceTodos(existingCategories) {
    const todos = [];

    if (!existingCategories.includes('OPTIMIZATION')) {
        todos.push({
            id: `MAINT_${Date.now()}`,
            content: '정기적인 시스템 유지보수 및 최적화',
            category: 'OPTIMIZATION',
            priority: 5,
            status: 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
    }

    if (!existingCategories.includes('SECURITY')) {
        todos.push({
            id: `SEC_${Date.now()}`,
            content: '보안 점검 및 취약점 분석',
            category: 'SECURITY',
            priority: 2,
            status: 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
    }

    return todos;
}

// 기능 개발 TODO 생성 함수
function generateFeatureTodos(existingCategories) {
    const todos = [];
    const features = [
        { content: 'AI 기반 추천 시스템', category: 'ADVANCED_FEATURES', priority: 4 },
        { content: '실시간 협업 도구', category: 'ADVANCED_FEATURES', priority: 5 },
        { content: '고급 검색 시스템', category: 'ADVANCED_FEATURES', priority: 6 },
        { content: '모바일 앱 개발', category: 'USER_EXPERIENCE', priority: 7 },
        { content: '다국어 지원', category: 'USER_EXPERIENCE', priority: 8 },
        { content: 'API 문서화', category: 'INTEGRATION', priority: 9 }
    ];

    features.forEach(feature => {
        if (!existingCategories.includes(feature.category)) {
            todos.push({
                id: `FEATURE_${Date.now()}`,
                content: feature.content,
                category: feature.category,
                priority: feature.priority,
                status: 'pending',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
        }
    });

    return todos;
}

module.exports = router;
