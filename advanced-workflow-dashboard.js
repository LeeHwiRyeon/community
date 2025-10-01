const express = require('express');
const path = require('path');
const fs = require('fs');
const WorkflowDatabaseManager = require('./workflow-database-manager');

/**
 * 고급 워크플로우 대시보드
 * Chart.js를 사용한 고급 시각화 기능
 */
class AdvancedWorkflowDashboard {
    constructor() {
        this.app = express();
        this.port = 8081;
        this.workflowDb = new WorkflowDatabaseManager();
        this.setupMiddleware();
        this.setupRoutes();
    }

    setupMiddleware() {
        this.app.use(express.json());
        this.app.use(express.static('public'));
        this.app.use(express.urlencoded({ extended: true }));
    }

    setupRoutes() {
        // 메인 대시보드
        this.app.get('/', (req, res) => {
            res.send(this.getAdvancedDashboard());
        });

        // API 엔드포인트들
        this.app.get('/api/workflows', (req, res) => {
            try {
                const workflows = this.workflowDb.getAllWorkflows();
                res.json({ success: true, workflows });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        this.app.get('/api/stats', (req, res) => {
            try {
                const stats = this.workflowDb.getWorkflowStats();
                res.json({ success: true, stats });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        this.app.get('/api/analytics', (req, res) => {
            try {
                const analytics = this.getAnalytics();
                res.json({ success: true, analytics });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        this.app.put('/api/workflows/:workflowId/tasks/:taskId', (req, res) => {
            try {
                const { status } = req.body;
                const success = this.workflowDb.updateTaskStatus(req.params.workflowId, req.params.taskId, status);
                if (success) {
                    res.json({ success: true, message: '작업 상태가 업데이트되었습니다.' });
                } else {
                    res.status(400).json({ success: false, error: '작업 상태 업데이트에 실패했습니다.' });
                }
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        this.app.post('/api/workflows', (req, res) => {
            try {
                const { title, description, priority, category } = req.body;
                const workflow = this.workflowDb.createWorkflow(title, description, priority, category);
                res.json({ success: true, workflow });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });
    }

    getAnalytics() {
        const workflows = this.workflowDb.getAllWorkflows();

        // 우선순위별 분석
        const priorityStats = workflows.reduce((acc, workflow) => {
            acc[workflow.priority] = (acc[workflow.priority] || 0) + 1;
            return acc;
        }, {});

        // 카테고리별 분석
        const categoryStats = workflows.reduce((acc, workflow) => {
            acc[workflow.category] = (acc[workflow.category] || 0) + 1;
            return acc;
        }, {});

        // 시간별 생성 분석 (최근 7일)
        const timeStats = this.getTimeBasedStats(workflows);

        // 진행률 분포
        const progressDistribution = this.getProgressDistribution(workflows);

        return {
            priorityStats,
            categoryStats,
            timeStats,
            progressDistribution
        };
    }

    getTimeBasedStats(workflows) {
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            const count = workflows.filter(w =>
                w.createdAt.split('T')[0] === dateStr
            ).length;

            last7Days.push({
                date: dateStr,
                count: count
            });
        }
        return last7Days;
    }

    getProgressDistribution(workflows) {
        const ranges = [
            { range: '0-20%', min: 0, max: 20, count: 0 },
            { range: '21-40%', min: 21, max: 40, count: 0 },
            { range: '41-60%', min: 41, max: 60, count: 0 },
            { range: '61-80%', min: 61, max: 80, count: 0 },
            { range: '81-100%', min: 81, max: 100, count: 0 }
        ];

        workflows.forEach(workflow => {
            const progress = workflow.metadata.progress;
            const range = ranges.find(r => progress >= r.min && progress <= r.max);
            if (range) range.count++;
        });

        return ranges;
    }

    getAdvancedDashboard() {
        return `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>고급 워크플로우 대시보드</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/date-fns@2.29.3/index.min.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: #333;
        }

        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
        }

        .header {
            text-align: center;
            margin-bottom: 30px;
            color: white;
        }

        .header h1 {
            font-size: 3rem;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }

        .header p {
            font-size: 1.3rem;
            opacity: 0.9;
        }

        .dashboard-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
        }

        .full-width {
            grid-column: 1 / -1;
        }

        .card {
            background: white;
            border-radius: 20px;
            padding: 30px;
            box-shadow: 0 15px 35px rgba(0,0,0,0.2);
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }

        .card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #667eea, #764ba2);
        }

        .card:hover {
            transform: translateY(-8px);
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
        }

        .card h3 {
            color: #667eea;
            margin-bottom: 20px;
            font-size: 1.5rem;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }

        .stat-card {
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            padding: 25px;
            border-radius: 15px;
            text-align: center;
            position: relative;
            overflow: hidden;
        }

        .stat-card::before {
            content: '';
            position: absolute;
            top: -50%;
            right: -50%;
            width: 100%;
            height: 100%;
            background: rgba(255,255,255,0.1);
            border-radius: 50%;
            transform: rotate(45deg);
        }

        .stat-number {
            font-size: 2.5rem;
            font-weight: bold;
            margin-bottom: 5px;
            position: relative;
            z-index: 1;
        }

        .stat-label {
            font-size: 1rem;
            opacity: 0.9;
            position: relative;
            z-index: 1;
        }

        .chart-container {
            position: relative;
            height: 300px;
            margin: 20px 0;
        }

        .workflow-timeline {
            max-height: 400px;
            overflow-y: auto;
        }

        .timeline-item {
            display: flex;
            align-items: center;
            padding: 15px;
            margin-bottom: 10px;
            background: #f8f9fa;
            border-radius: 10px;
            border-left: 4px solid #667eea;
            transition: all 0.3s ease;
        }

        .timeline-item:hover {
            background: #e9ecef;
            transform: translateX(5px);
        }

        .timeline-content {
            flex: 1;
        }

        .timeline-title {
            font-weight: bold;
            margin-bottom: 5px;
        }

        .timeline-meta {
            font-size: 0.9rem;
            color: #666;
        }

        .progress-ring {
            width: 60px;
            height: 60px;
            margin-right: 15px;
        }

        .progress-ring circle {
            fill: none;
            stroke-width: 4;
        }

        .progress-ring-bg {
            stroke: #e9ecef;
        }

        .progress-ring-fill {
            stroke: #667eea;
            stroke-linecap: round;
            transition: stroke-dasharray 0.3s ease;
        }

        .workflow-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
            gap: 20px;
        }

        .workflow-card {
            background: white;
            border-radius: 15px;
            padding: 25px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }

        .workflow-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 35px rgba(0,0,0,0.2);
        }

        .workflow-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }

        .workflow-title {
            font-size: 1.2rem;
            font-weight: bold;
            color: #333;
        }

        .workflow-status {
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: bold;
        }

        .status-active {
            background: #d4edda;
            color: #155724;
        }

        .status-completed {
            background: #cce5ff;
            color: #004085;
        }

        .progress-container {
            margin: 15px 0;
        }

        .progress-bar {
            width: 100%;
            height: 10px;
            background: #e9ecef;
            border-radius: 5px;
            overflow: hidden;
        }

        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #667eea, #764ba2);
            transition: width 0.5s ease;
        }

        .workflow-details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-top: 15px;
            font-size: 0.9rem;
        }

        .detail-item {
            display: flex;
            justify-content: space-between;
            padding: 5px 0;
        }

        .detail-label {
            color: #666;
            font-weight: 500;
        }

        .detail-value {
            color: #333;
            font-weight: bold;
        }

        .task-mini-list {
            margin-top: 15px;
        }

        .task-mini-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px;
            background: #f8f9fa;
            border-radius: 6px;
            margin-bottom: 5px;
            font-size: 0.85rem;
        }

        .task-status {
            padding: 2px 8px;
            border-radius: 10px;
            font-size: 0.7rem;
            font-weight: bold;
        }

        .task-pending {
            background: #fff3cd;
            color: #856404;
        }

        .task-completed {
            background: #d4edda;
            color: #155724;
        }

        .btn {
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 25px;
            cursor: pointer;
            font-size: 0.9rem;
            font-weight: bold;
            transition: all 0.3s ease;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }

        .loading {
            text-align: center;
            padding: 50px;
            color: #666;
            font-size: 1.1rem;
        }

        .error {
            background: #f8d7da;
            color: #721c24;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
        }

        .pulse {
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }

        @media (max-width: 768px) {
            .dashboard-grid {
                grid-template-columns: 1fr;
            }
            
            .header h1 {
                font-size: 2rem;
            }
            
            .workflow-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 고급 워크플로우 대시보드</h1>
            <p>실시간 분석 및 고급 시각화</p>
        </div>

        <!-- 통계 카드 -->
        <div class="stats-grid" id="statsGrid">
            <div class="loading">로딩 중...</div>
        </div>

        <!-- 메인 대시보드 -->
        <div class="dashboard-grid">
            <!-- 진행률 분포 차트 -->
            <div class="card">
                <h3>📊 진행률 분포</h3>
                <div class="chart-container">
                    <canvas id="progressChart"></canvas>
                </div>
            </div>

            <!-- 우선순위별 분석 -->
            <div class="card">
                <h3>🎯 우선순위별 분석</h3>
                <div class="chart-container">
                    <canvas id="priorityChart"></canvas>
                </div>
            </div>

            <!-- 시간별 생성 추이 -->
            <div class="card full-width">
                <h3>📈 시간별 생성 추이 (최근 7일)</h3>
                <div class="chart-container">
                    <canvas id="timelineChart"></canvas>
                </div>
            </div>

            <!-- 카테고리별 분석 -->
            <div class="card">
                <h3>📂 카테고리별 분석</h3>
                <div class="chart-container">
                    <canvas id="categoryChart"></canvas>
                </div>
            </div>

            <!-- 워크플로우 타임라인 -->
            <div class="card">
                <h3>⏰ 최근 워크플로우</h3>
                <div class="workflow-timeline" id="workflowTimeline">
                    <div class="loading">로딩 중...</div>
                </div>
            </div>
        </div>

        <!-- 워크플로우 그리드 -->
        <div class="card full-width">
            <h3>📋 모든 워크플로우</h3>
            <div class="workflow-grid" id="workflowGrid">
                <div class="loading">로딩 중...</div>
            </div>
        </div>
    </div>

    <script>
        let charts = {};

        // 페이지 로드 시 초기화
        window.onload = function() {
            loadStats();
            loadWorkflows();
            loadAnalytics();
            
            // 10초마다 데이터 새로고침
            setInterval(() => {
                loadStats();
                loadWorkflows();
                loadAnalytics();
            }, 10000);
        };

        // 통계 로드
        async function loadStats() {
            try {
                const response = await fetch('/api/stats');
                const data = await response.json();
                
                if (data.success) {
                    const stats = data.stats;
                    document.getElementById('statsGrid').innerHTML = \`
                        <div class="stat-card">
                            <div class="stat-number">\${stats.totalWorkflows}</div>
                            <div class="stat-label">총 워크플로우</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">\${stats.activeWorkflows}</div>
                            <div class="stat-label">활성 워크플로우</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">\${stats.completedWorkflows}</div>
                            <div class="stat-label">완료된 워크플로우</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">\${stats.totalTasks}</div>
                            <div class="stat-label">총 작업</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">\${stats.completedTasks}</div>
                            <div class="stat-label">완료된 작업</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">\${stats.averageProgress.toFixed(1)}%</div>
                            <div class="stat-label">평균 진행률</div>
                        </div>
                    \`;
                }
            } catch (error) {
                document.getElementById('statsGrid').innerHTML = '<div class="error">통계 로드 실패</div>';
            }
        }

        // 워크플로우 로드
        async function loadWorkflows() {
            try {
                const response = await fetch('/api/workflows');
                const data = await response.json();
                
                if (data.success) {
                    const workflows = data.workflows;
                    
                    // 워크플로우 그리드
                    const workflowGridHtml = workflows.map(workflow => {
                        const completedTasks = workflow.tasks.filter(task => task.status === 'completed').length;
                        const totalTasks = workflow.tasks.length;
                        const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
                        
                        const tasksHtml = workflow.tasks.slice(0, 3).map(task => {
                            const statusClass = task.status === 'completed' ? 'task-completed' : 'task-pending';
                            return \`
                                <div class="task-mini-item">
                                    <span>\${task.title}</span>
                                    <span class="task-status \${statusClass}">\${task.status}</span>
                                </div>
                            \`;
                        }).join('');

                        return \`
                            <div class="workflow-card">
                                <div class="workflow-header">
                                    <div class="workflow-title">\${workflow.title || '제목 없음'}</div>
                                    <div class="workflow-status status-\${workflow.status}">\${workflow.status}</div>
                                </div>
                                <div class="progress-container">
                                    <div class="progress-bar">
                                        <div class="progress-fill" style="width: \${progress}%"></div>
                                    </div>
                                    <div style="text-align: center; margin-top: 5px; font-size: 0.9rem; color: #666;">
                                        \${progress.toFixed(1)}% (\${completedTasks}/\${totalTasks})
                                    </div>
                                </div>
                                <div class="workflow-details">
                                    <div class="detail-item">
                                        <span class="detail-label">우선순위:</span>
                                        <span class="detail-value">\${workflow.priority}</span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="detail-label">카테고리:</span>
                                        <span class="detail-value">\${workflow.category}</span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="detail-label">작업 수:</span>
                                        <span class="detail-value">\${totalTasks}개</span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="detail-label">생성일:</span>
                                        <span class="detail-value">\${new Date(workflow.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <div class="task-mini-list">
                                    \${tasksHtml}
                                    \${workflow.tasks.length > 3 ? '<div style="text-align: center; color: #666; font-size: 0.8rem;">+ ' + (workflow.tasks.length - 3) + '개 더</div>' : ''}
                                </div>
                            </div>
                        \`;
                    }).join('');

                    document.getElementById('workflowGrid').innerHTML = workflowGridHtml || '<div class="loading">워크플로우가 없습니다.</div>';

                    // 타임라인
                    const timelineHtml = workflows.slice(0, 5).map(workflow => {
                        const completedTasks = workflow.tasks.filter(task => task.status === 'completed').length;
                        const totalTasks = workflow.tasks.length;
                        const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
                        
                        return \`
                            <div class="timeline-item">
                                <div class="progress-ring">
                                    <svg width="60" height="60">
                                        <circle class="progress-ring-bg" cx="30" cy="30" r="26"></circle>
                                        <circle class="progress-ring-fill" cx="30" cy="30" r="26" 
                                                style="stroke-dasharray: \${2 * Math.PI * 26 * progress / 100} \${2 * Math.PI * 26};"></circle>
                                    </svg>
                                </div>
                                <div class="timeline-content">
                                    <div class="timeline-title">\${workflow.title || '제목 없음'}</div>
                                    <div class="timeline-meta">
                                        \${workflow.priority} • \${workflow.category} • \${progress.toFixed(1)}% 완료
                                    </div>
                                </div>
                            </div>
                        \`;
                    }).join('');

                    document.getElementById('workflowTimeline').innerHTML = timelineHtml || '<div class="loading">워크플로우가 없습니다.</div>';
                }
            } catch (error) {
                document.getElementById('workflowGrid').innerHTML = '<div class="error">워크플로우 로드 실패</div>';
            }
        }

        // 분석 데이터 로드 및 차트 생성
        async function loadAnalytics() {
            try {
                const response = await fetch('/api/analytics');
                const data = await response.json();
                
                if (data.success) {
                    const analytics = data.analytics;
                    
                    // 진행률 분포 차트
                    createProgressChart(analytics.progressDistribution);
                    
                    // 우선순위별 차트
                    createPriorityChart(analytics.priorityStats);
                    
                    // 카테고리별 차트
                    createCategoryChart(analytics.categoryStats);
                    
                    // 시간별 추이 차트
                    createTimelineChart(analytics.timeStats);
                }
            } catch (error) {
                console.error('분석 데이터 로드 실패:', error);
            }
        }

        // 진행률 분포 차트
        function createProgressChart(data) {
            const ctx = document.getElementById('progressChart').getContext('2d');
            
            if (charts.progress) charts.progress.destroy();
            
            charts.progress = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: data.map(d => d.range),
                    datasets: [{
                        data: data.map(d => d.count),
                        backgroundColor: [
                            '#ff6384',
                            '#36a2eb',
                            '#ffce56',
                            '#4bc0c0',
                            '#9966ff'
                        ],
                        borderWidth: 2,
                        borderColor: '#fff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        }

        // 우선순위별 차트
        function createPriorityChart(data) {
            const ctx = document.getElementById('priorityChart').getContext('2d');
            
            if (charts.priority) charts.priority.destroy();
            
            charts.priority = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: Object.keys(data),
                    datasets: [{
                        label: '워크플로우 수',
                        data: Object.values(data),
                        backgroundColor: [
                            '#ff6384',
                            '#36a2eb',
                            '#ffce56',
                            '#4bc0c0'
                        ],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }

        // 카테고리별 차트
        function createCategoryChart(data) {
            const ctx = document.getElementById('categoryChart').getContext('2d');
            
            if (charts.category) charts.category.destroy();
            
            charts.category = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: Object.keys(data),
                    datasets: [{
                        data: Object.values(data),
                        backgroundColor: [
                            '#667eea',
                            '#764ba2',
                            '#f093fb',
                            '#f5576c',
                            '#4facfe'
                        ],
                        borderWidth: 2,
                        borderColor: '#fff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        }

        // 시간별 추이 차트
        function createTimelineChart(data) {
            const ctx = document.getElementById('timelineChart').getContext('2d');
            
            if (charts.timeline) charts.timeline.destroy();
            
            charts.timeline = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: data.map(d => new Date(d.date).toLocaleDateString()),
                    datasets: [{
                        label: '생성된 워크플로우',
                        data: data.map(d => d.count),
                        borderColor: '#667eea',
                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }
    </script>
</body>
</html>
        `;
    }

    start() {
        this.app.listen(this.port, () => {
            console.log('🎨 고급 워크플로우 대시보드 시작됨!');
            console.log(`🌐 웹 브라우저에서 http://localhost:${this.port} 접속`);
            console.log('=====================================');
            console.log('🎯 고급 기능:');
            console.log('  - Chart.js 기반 고급 차트');
            console.log('  - 실시간 데이터 분석');
            console.log('  - 진행률 분포 시각화');
            console.log('  - 우선순위/카테고리별 분석');
            console.log('  - 시간별 생성 추이');
            console.log('  - 인터랙티브 워크플로우 카드');
            console.log('  - 자동 새로고침 (10초)');
            console.log('=====================================');
        });
    }
}

// 서버 시작
if (require.main === module) {
    const dashboard = new AdvancedWorkflowDashboard();
    dashboard.start();
}

module.exports = AdvancedWorkflowDashboard;
