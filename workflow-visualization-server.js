const express = require('express');
const path = require('path');
const fs = require('fs');
const WorkflowDatabaseManager = require('./workflow-database-manager');

/**
 * 워크플로우 시각화 서버
 * 웹 브라우저에서 워크플로우를 시각적으로 관리할 수 있는 서버
 */
class WorkflowVisualizationServer {
    constructor() {
        this.app = express();
        this.port = 8080;
        this.workflowDb = new WorkflowDatabaseManager();
        this.setupMiddleware();
        this.setupRoutes();
    }

    /**
     * 미들웨어 설정
     */
    setupMiddleware() {
        this.app.use(express.json());
        this.app.use(express.static('public'));
        this.app.use(express.urlencoded({ extended: true }));
    }

    /**
     * 라우트 설정
     */
    setupRoutes() {
        // 메인 페이지
        this.app.get('/', (req, res) => {
            res.send(this.getMainPage());
        });

        // API: 워크플로우 목록
        this.app.get('/api/workflows', (req, res) => {
            try {
                const workflows = this.workflowDb.getAllWorkflows();
                res.json({ success: true, workflows });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        // API: 특정 워크플로우 조회
        this.app.get('/api/workflows/:id', (req, res) => {
            try {
                const workflow = this.workflowDb.getWorkflow(req.params.id);
                if (!workflow) {
                    return res.status(404).json({ success: false, error: '워크플로우를 찾을 수 없습니다.' });
                }
                res.json({ success: true, workflow });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        // API: 작업 상태 업데이트
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

        // API: 통계 정보
        this.app.get('/api/stats', (req, res) => {
            try {
                const stats = this.workflowDb.getWorkflowStats();
                res.json({ success: true, stats });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        // API: 새 워크플로우 생성
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

    /**
     * 메인 페이지 HTML 생성
     */
    getMainPage() {
        return `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>워크플로우 시각화 대시보드</title>
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
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }

        .header {
            text-align: center;
            margin-bottom: 30px;
            color: white;
        }

        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }

        .header p {
            font-size: 1.2rem;
            opacity: 0.9;
        }

        .dashboard {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
        }

        .card {
            background: white;
            border-radius: 15px;
            padding: 25px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            transition: transform 0.3s ease;
        }

        .card:hover {
            transform: translateY(-5px);
        }

        .card h3 {
            color: #667eea;
            margin-bottom: 15px;
            font-size: 1.3rem;
        }

        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
        }

        .stat-item {
            text-align: center;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 10px;
        }

        .stat-number {
            font-size: 2rem;
            font-weight: bold;
            color: #667eea;
        }

        .stat-label {
            font-size: 0.9rem;
            color: #666;
            margin-top: 5px;
        }

        .workflow-list {
            grid-column: 1 / -1;
        }

        .workflow-item {
            background: #f8f9fa;
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 15px;
            border-left: 4px solid #667eea;
            transition: all 0.3s ease;
        }

        .workflow-item:hover {
            background: #e9ecef;
            transform: translateX(5px);
        }

        .workflow-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }

        .workflow-title {
            font-size: 1.2rem;
            font-weight: bold;
            color: #333;
        }

        .workflow-status {
            padding: 5px 15px;
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

        .progress-bar {
            width: 100%;
            height: 8px;
            background: #e9ecef;
            border-radius: 4px;
            overflow: hidden;
            margin: 10px 0;
        }

        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #667eea, #764ba2);
            transition: width 0.3s ease;
        }

        .workflow-details {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-top: 15px;
        }

        .detail-item {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #dee2e6;
        }

        .detail-label {
            font-weight: bold;
            color: #666;
        }

        .detail-value {
            color: #333;
        }

        .task-list {
            margin-top: 15px;
        }

        .task-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px;
            background: white;
            border-radius: 8px;
            margin-bottom: 8px;
            border-left: 3px solid #667eea;
        }

        .task-title {
            font-weight: 500;
        }

        .task-status {
            padding: 3px 10px;
            border-radius: 15px;
            font-size: 0.8rem;
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
            background: #667eea;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 0.9rem;
            transition: background 0.3s ease;
        }

        .btn:hover {
            background: #5a6fd8;
        }

        .btn-complete {
            background: #28a745;
        }

        .btn-complete:hover {
            background: #218838;
        }

        .loading {
            text-align: center;
            padding: 50px;
            color: #666;
        }

        .error {
            background: #f8d7da;
            color: #721c24;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
        }

        @media (max-width: 768px) {
            .dashboard {
                grid-template-columns: 1fr;
            }
            
            .header h1 {
                font-size: 2rem;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 워크플로우 시각화 대시보드</h1>
            <p>실시간 작업 관리 및 진행 상황 모니터링</p>
        </div>

        <div class="dashboard">
            <div class="card">
                <h3>📊 시스템 통계</h3>
                <div id="stats" class="stats-grid">
                    <div class="loading">로딩 중...</div>
                </div>
            </div>

            <div class="card">
                <h3>🎯 빠른 작업</h3>
                <div style="margin-bottom: 15px;">
                    <input type="text" id="newWorkflowTitle" placeholder="워크플로우 제목" 
                           style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; margin-bottom: 10px;">
                    <input type="text" id="newWorkflowDesc" placeholder="설명" 
                           style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; margin-bottom: 10px;">
                    <select id="newWorkflowPriority" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; margin-bottom: 10px;">
                        <option value="low">낮음</option>
                        <option value="medium" selected>보통</option>
                        <option value="high">높음</option>
                        <option value="urgent">긴급</option>
                    </select>
                    <button class="btn" onclick="createWorkflow()">새 워크플로우 생성</button>
                </div>
            </div>

            <div class="card workflow-list">
                <h3>📋 워크플로우 목록</h3>
                <div id="workflows">
                    <div class="loading">로딩 중...</div>
                </div>
            </div>
        </div>
    </div>

    <script>
        // 페이지 로드 시 데이터 가져오기
        window.onload = function() {
            loadStats();
            loadWorkflows();
        };

        // 통계 로드
        async function loadStats() {
            try {
                const response = await fetch('/api/stats');
                const data = await response.json();
                
                if (data.success) {
                    const stats = data.stats;
                    document.getElementById('stats').innerHTML = \`
                        <div class="stat-item">
                            <div class="stat-number">\${stats.totalWorkflows}</div>
                            <div class="stat-label">총 워크플로우</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-number">\${stats.activeWorkflows}</div>
                            <div class="stat-label">활성 워크플로우</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-number">\${stats.completedWorkflows}</div>
                            <div class="stat-label">완료된 워크플로우</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-number">\${stats.totalTasks}</div>
                            <div class="stat-label">총 작업</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-number">\${stats.completedTasks}</div>
                            <div class="stat-label">완료된 작업</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-number">\${stats.averageProgress.toFixed(1)}%</div>
                            <div class="stat-label">평균 진행률</div>
                        </div>
                    \`;
                }
            } catch (error) {
                document.getElementById('stats').innerHTML = '<div class="error">통계 로드 실패</div>';
            }
        }

        // 워크플로우 목록 로드
        async function loadWorkflows() {
            try {
                const response = await fetch('/api/workflows');
                const data = await response.json();
                
                if (data.success) {
                    const workflows = data.workflows;
                    const workflowsHtml = workflows.map(workflow => {
                        const completedTasks = workflow.tasks.filter(task => task.status === 'completed').length;
                        const totalTasks = workflow.tasks.length;
                        const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
                        
                        const tasksHtml = workflow.tasks.map(task => {
                            const statusClass = task.status === 'completed' ? 'task-completed' : 'task-pending';
                            return \`
                                <div class="task-item">
                                    <div class="task-title">\${task.title}</div>
                                    <div class="task-status \${statusClass}">\${task.status}</div>
                                </div>
                            \`;
                        }).join('');

                        return \`
                            <div class="workflow-item">
                                <div class="workflow-header">
                                    <div class="workflow-title">\${workflow.title || '제목 없음'}</div>
                                    <div class="workflow-status status-\${workflow.status}">\${workflow.status}</div>
                                </div>
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: \${progress}%"></div>
                                </div>
                                <div class="workflow-details">
                                    <div class="detail-item">
                                        <span class="detail-label">진행률:</span>
                                        <span class="detail-value">\${progress.toFixed(1)}% (\${completedTasks}/\${totalTasks})</span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="detail-label">우선순위:</span>
                                        <span class="detail-value">\${workflow.priority}</span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="detail-label">카테고리:</span>
                                        <span class="detail-value">\${workflow.category}</span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="detail-label">생성일:</span>
                                        <span class="detail-value">\${new Date(workflow.createdAt).toLocaleString()}</span>
                                    </div>
                                </div>
                                <div class="task-list">
                                    \${tasksHtml}
                                </div>
                            </div>
                        \`;
                    }).join('');

                    document.getElementById('workflows').innerHTML = workflowsHtml || '<div class="loading">워크플로우가 없습니다.</div>';
                }
            } catch (error) {
                document.getElementById('workflows').innerHTML = '<div class="error">워크플로우 로드 실패</div>';
            }
        }

        // 새 워크플로우 생성
        async function createWorkflow() {
            const title = document.getElementById('newWorkflowTitle').value;
            const description = document.getElementById('newWorkflowDesc').value;
            const priority = document.getElementById('newWorkflowPriority').value;
            
            if (!title.trim()) {
                alert('워크플로우 제목을 입력해주세요.');
                return;
            }

            try {
                const response = await fetch('/api/workflows', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        title: title.trim(),
                        description: description.trim(),
                        priority: priority,
                        category: 'general'
                    })
                });

                const data = await response.json();
                
                if (data.success) {
                    alert('워크플로우가 생성되었습니다!');
                    document.getElementById('newWorkflowTitle').value = '';
                    document.getElementById('newWorkflowDesc').value = '';
                    loadStats();
                    loadWorkflows();
                } else {
                    alert('워크플로우 생성에 실패했습니다: ' + data.error);
                }
            } catch (error) {
                alert('워크플로우 생성 중 오류가 발생했습니다.');
            }
        }

        // 5초마다 데이터 새로고침
        setInterval(() => {
            loadStats();
            loadWorkflows();
        }, 5000);
    </script>
</body>
</html>
        `;
    }

    /**
     * 서버 시작
     */
    start() {
        this.app.listen(this.port, () => {
            console.log('🌐 워크플로우 시각화 서버 시작됨!');
            console.log(`📱 웹 브라우저에서 http://localhost:${this.port} 접속`);
            console.log('=====================================');
            console.log('🎯 기능:');
            console.log('  - 실시간 워크플로우 모니터링');
            console.log('  - 작업 진행 상황 시각화');
            console.log('  - 통계 대시보드');
            console.log('  - 새 워크플로우 생성');
            console.log('=====================================');
        });
    }
}

// 서버 시작
if (require.main === module) {
    const server = new WorkflowVisualizationServer();
    server.start();
}

module.exports = WorkflowVisualizationServer;
