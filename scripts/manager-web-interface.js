#!/usr/bin/env node

/**
 * 매니저 웹 인터페이스
 * 
 * 웹 브라우저를 통해 매니저가 자연어로 작업 요청을 입력할 수 있는 인터페이스
 */

const express = require('express')
const path = require('path')
const fs = require('fs').promises
const ManagerInputTaskGenerator = require('./manager-input-task-generator')

class ManagerWebInterface {
    constructor() {
        this.app = express()
        this.port = 3001
        this.generator = new ManagerInputTaskGenerator()
        this.setupMiddleware()
        this.setupRoutes()
    }

    setupMiddleware() {
        this.app.use(express.json())
        this.app.use(express.urlencoded({ extended: true }))
        this.app.use(express.static(path.join(__dirname, '../public')))
    }

    setupRoutes() {
        // 메인 페이지
        this.app.get('/', (req, res) => {
            res.send(this.getMainPageHTML())
        })

        // Task 생성 API
        this.app.post('/api/create-task', async (req, res) => {
            try {
                const { input } = req.body

                if (!input || input.trim() === '') {
                    return res.status(400).json({ error: '입력이 비어있습니다.' })
                }

                const task = await this.generator.analyzeInputAndCreateTask(input)

                if (task) {
                    await this.generator.saveTask(task)
                    res.json({ success: true, task })
                } else {
                    res.status(500).json({ error: 'Task 생성에 실패했습니다.' })
                }
            } catch (error) {
                console.error('Task 생성 오류:', error)
                res.status(500).json({ error: error.message })
            }
        })

        // Task 목록 API
        this.app.get('/api/tasks', async (req, res) => {
            try {
                const tasks = await this.getTasks()
                res.json({ success: true, tasks })
            } catch (error) {
                console.error('Task 목록 조회 오류:', error)
                res.status(500).json({ error: error.message })
            }
        })

        // Task 상태 업데이트 API
        this.app.put('/api/tasks/:id', async (req, res) => {
            try {
                const { id } = req.params
                const { status, assignee } = req.body

                await this.updateTask(id, { status, assignee })
                res.json({ success: true })
            } catch (error) {
                console.error('Task 업데이트 오류:', error)
                res.status(500).json({ error: error.message })
            }
        })

        // 통계 API
        this.app.get('/api/stats', async (req, res) => {
            try {
                const stats = await this.getStats()
                res.json({ success: true, stats })
            } catch (error) {
                console.error('통계 조회 오류:', error)
                res.status(500).json({ error: error.message })
            }
        })
    }

    async getTasks() {
        try {
            const content = await fs.readFile(this.generator.todoBacklog, 'utf8')
            const tasks = content.split('\n')
                .filter(line => line.includes('AUTO-'))
                .map(line => {
                    const parts = line.split('|').map(p => p.trim())
                    return {
                        id: parts[1],
                        status: parts[2],
                        title: parts[3],
                        priority: parts[4],
                        category: parts[5],
                        assignee: parts[6],
                        hours: parts[7],
                        date: parts[8]
                    }
                })
            return tasks
        } catch (error) {
            return []
        }
    }

    async updateTask(taskId, updates) {
        const content = await fs.readFile(this.generator.todoBacklog, 'utf8')
        let updatedContent = content

        if (updates.status) {
            updatedContent = updatedContent.replace(
                new RegExp(`(\\| ${taskId} \\|) [^|]+ (\\|)`),
                `$1 ${updates.status} $2`
            )
        }

        if (updates.assignee) {
            updatedContent = updatedContent.replace(
                new RegExp(`(\\| ${taskId} \\| [^|]+ \\| [^|]+ \\| [^|]+ \\| )[^|]+( \\|)`),
                `$1${updates.assignee}$2`
            )
        }

        await fs.writeFile(this.generator.todoBacklog, updatedContent, 'utf8')
    }

    async getStats() {
        const tasks = await this.getTasks()
        const total = tasks.length
        const pending = tasks.filter(t => t.status === '⬜').length
        const completed = tasks.filter(t => t.status === '✅').length

        return {
            total,
            pending,
            completed,
            completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
        }
    }

    getMainPageHTML() {
        return `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>매니저 Task 생성 시스템</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
        }
        
        .header p {
            font-size: 1.1rem;
            opacity: 0.9;
        }
        
        .content {
            padding: 30px;
        }
        
        .input-section {
            background: #f8f9fa;
            border-radius: 15px;
            padding: 30px;
            margin-bottom: 30px;
        }
        
        .input-group {
            margin-bottom: 20px;
        }
        
        label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            color: #333;
        }
        
        input, textarea, select {
            width: 100%;
            padding: 15px;
            border: 2px solid #e9ecef;
            border-radius: 10px;
            font-size: 16px;
            transition: border-color 0.3s;
        }
        
        input:focus, textarea:focus, select:focus {
            outline: none;
            border-color: #667eea;
        }
        
        textarea {
            resize: vertical;
            min-height: 120px;
        }
        
        .btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 10px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s;
        }
        
        .btn:hover {
            transform: translateY(-2px);
        }
        
        .btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
        }
        
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .stat-card {
            background: white;
            border: 2px solid #e9ecef;
            border-radius: 15px;
            padding: 20px;
            text-align: center;
        }
        
        .stat-number {
            font-size: 2rem;
            font-weight: bold;
            color: #667eea;
        }
        
        .stat-label {
            color: #666;
            margin-top: 5px;
        }
        
        .tasks-section {
            background: #f8f9fa;
            border-radius: 15px;
            padding: 30px;
        }
        
        .task-item {
            background: white;
            border: 2px solid #e9ecef;
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 15px;
            transition: border-color 0.3s;
        }
        
        .task-item:hover {
            border-color: #667eea;
        }
        
        .task-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }
        
        .task-id {
            font-weight: bold;
            color: #667eea;
        }
        
        .task-status {
            padding: 5px 10px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
        }
        
        .status-pending {
            background: #fff3cd;
            color: #856404;
        }
        
        .status-completed {
            background: #d4edda;
            color: #155724;
        }
        
        .task-title {
            font-size: 1.1rem;
            margin-bottom: 10px;
        }
        
        .task-meta {
            display: flex;
            gap: 15px;
            font-size: 14px;
            color: #666;
        }
        
        .loading {
            text-align: center;
            padding: 20px;
            color: #666;
        }
        
        .error {
            background: #f8d7da;
            color: #721c24;
            padding: 15px;
            border-radius: 10px;
            margin: 10px 0;
        }
        
        .success {
            background: #d4edda;
            color: #155724;
            padding: 15px;
            border-radius: 10px;
            margin: 10px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎯 매니저 Task 생성 시스템</h1>
            <p>자연어로 작업 요청을 입력하면 자동으로 Task가 생성됩니다</p>
        </div>
        
        <div class="content">
            <div class="input-section">
                <h2>📝 새 Task 생성</h2>
                <form id="taskForm">
                    <div class="input-group">
                        <label for="taskInput">작업 요청 (자연어로 입력하세요)</label>
                        <textarea 
                            id="taskInput" 
                            placeholder="예: 로그인 버그 수정해줘&#10;예: 새로운 사용자 관리 기능 추가&#10;예: 성능 최적화 필요해"
                            required
                        ></textarea>
                    </div>
                    <button type="submit" class="btn" id="submitBtn">
                        🚀 Task 생성하기
                    </button>
                </form>
                <div id="message"></div>
            </div>
            
            <div class="stats" id="stats">
                <div class="stat-card">
                    <div class="stat-number" id="totalTasks">-</div>
                    <div class="stat-label">총 Task</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number" id="pendingTasks">-</div>
                    <div class="stat-label">대기 중</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number" id="completedTasks">-</div>
                    <div class="stat-label">완료</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number" id="completionRate">-</div>
                    <div class="stat-label">완료율</div>
                </div>
            </div>
            
            <div class="tasks-section">
                <h2>📋 Task 목록</h2>
                <div id="tasksList">
                    <div class="loading">로딩 중...</div>
                </div>
            </div>
        </div>
    </div>

    <script>
        // DOM 요소
        const taskForm = document.getElementById('taskForm')
        const taskInput = document.getElementById('taskInput')
        const submitBtn = document.getElementById('submitBtn')
        const message = document.getElementById('message')
        const tasksList = document.getElementById('tasksList')
        const stats = document.getElementById('stats')

        // Task 생성
        taskForm.addEventListener('submit', async (e) => {
            e.preventDefault()
            
            const input = taskInput.value.trim()
            if (!input) return
            
            submitBtn.disabled = true
            submitBtn.textContent = '생성 중...'
            message.innerHTML = ''
            
            try {
                const response = await fetch('/api/create-task', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ input })
                })
                
                const result = await response.json()
                
                if (result.success) {
                    message.innerHTML = '<div class="success">✅ Task가 성공적으로 생성되었습니다!</div>'
                    taskInput.value = ''
                    loadTasks()
                    loadStats()
                } else {
                    message.innerHTML = '<div class="error">❌ ' + result.error + '</div>'
                }
            } catch (error) {
                message.innerHTML = '<div class="error">❌ 오류가 발생했습니다: ' + error.message + '</div>'
            } finally {
                submitBtn.disabled = false
                submitBtn.textContent = '🚀 Task 생성하기'
            }
        })

        // Task 목록 로드
        async function loadTasks() {
            try {
                const response = await fetch('/api/tasks')
                const result = await response.json()
                
                if (result.success) {
                    displayTasks(result.tasks)
                } else {
                    tasksList.innerHTML = '<div class="error">❌ Task 목록을 불러올 수 없습니다.</div>'
                }
            } catch (error) {
                tasksList.innerHTML = '<div class="error">❌ 오류가 발생했습니다: ' + error.message + '</div>'
            }
        }

        // Task 표시
        function displayTasks(tasks) {
            if (tasks.length === 0) {
                tasksList.innerHTML = '<div class="loading">📝 생성된 Task가 없습니다.</div>'
                return
            }
            
            const html = tasks.map(task => {
                const statusClass = task.status === '✅' ? 'status-completed' : 'status-pending'
                return \`
                    <div class="task-item">
                        <div class="task-header">
                            <span class="task-id">\${task.id}</span>
                            <span class="task-status \${statusClass}">\${task.status}</span>
                        </div>
                        <div class="task-title">\${task.title}</div>
                        <div class="task-meta">
                            <span>🏷️ \${task.category}</span>
                            <span>⚡ \${task.priority}</span>
                            <span>👤 \${task.assignee}</span>
                            <span>⏱️ \${task.hours}h</span>
                            <span>📅 \${task.date}</span>
                        </div>
                    </div>
                \`
            }).join('')
            
            tasksList.innerHTML = html
        }

        // 통계 로드
        async function loadStats() {
            try {
                const response = await fetch('/api/stats')
                const result = await response.json()
                
                if (result.success) {
                    const stats = result.stats
                    document.getElementById('totalTasks').textContent = stats.total
                    document.getElementById('pendingTasks').textContent = stats.pending
                    document.getElementById('completedTasks').textContent = stats.completed
                    document.getElementById('completionRate').textContent = stats.completionRate + '%'
                }
            } catch (error) {
                console.error('통계 로드 오류:', error)
            }
        }

        // 초기 로드
        loadTasks()
        loadStats()
        
        // 30초마다 자동 새로고침
        setInterval(() => {
            loadTasks()
            loadStats()
        }, 30000)
    </script>
</body>
</html>
        `
    }

    start() {
        this.app.listen(this.port, () => {
            console.log('🎯 매니저 웹 인터페이스가 시작되었습니다!')
            console.log(`🌐 http://localhost:${this.port} 에서 접속하세요`)
            console.log('')
            console.log('💡 사용법:')
            console.log('  - 웹 브라우저에서 위 주소로 접속')
            console.log('  - 자연어로 작업 요청 입력')
            console.log('  - 자동으로 Task 생성 및 관리')
            console.log('')
            console.log('🛑 종료하려면 Ctrl+C를 누르세요')
        })
    }
}

// CLI 실행
if (require.main === module) {
    const interface = new ManagerWebInterface()
    interface.start()
}

module.exports = ManagerWebInterface
