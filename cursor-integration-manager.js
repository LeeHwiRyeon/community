const express = require('express');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const WorkflowDatabaseManager = require('./workflow-database-manager');
const IntegratedConversationalManager = require('./integrated-conversational-manager');

/**
 * Cursor 통합 관리자
 * Cursor와 실시간 통신하여 작업을 자동으로 처리
 */
class CursorIntegrationManager {
    constructor() {
        this.app = express();
        this.port = 3000;
        this.wsPort = 3001;
        this.workflowDb = new WorkflowDatabaseManager();
        this.conversationalManager = new IntegratedConversationalManager();
        this.wss = null;
        this.cursorClients = new Set();
        this.isProcessing = false;

        this.setupMiddleware();
        this.setupRoutes();
        this.setupWebSocket();
    }

    setupMiddleware() {
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
        this.app.use(express.static('public'));

        // UTF-8 인코딩 설정
        this.app.use((req, res, next) => {
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            next();
        });
    }

    setupRoutes() {
        // 헬스 체크
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                workflows: this.workflowDb.getWorkflowStats(),
                cursorClients: this.cursorClients.size,
                isProcessing: this.isProcessing
            });
        });

        // Cursor에서 작업 요청
        this.app.post('/api/cursor/request', async (req, res) => {
            try {
                console.log('📨 POST /api/cursor/request 요청 수신');
                console.log('📤 요청 본문:', JSON.stringify(req.body, null, 2));

                const { message, type = 'workflow', metadata = {} } = req.body;

                console.log(`🎯 Cursor 요청 수신: ${message}`);
                console.log(`📋 요청 타입: ${type}`);
                console.log(`📊 메타데이터:`, metadata);

                // 작업 처리 시작
                this.isProcessing = true;
                console.log('🔄 작업 처리 시작...');

                // 워크플로우 생성
                console.log('📋 워크플로우 생성 중...');
                const title = this.extractTitle(message);
                const priority = this.analyzePriority(message);
                const category = this.categorizeInput(message);

                console.log(`📝 제목: ${title}`);
                console.log(`🎯 우선순위: ${priority}`);
                console.log(`📂 카테고리: ${category}`);

                const workflow = this.workflowDb.createWorkflow(title, message, priority, category);
                console.log(`✅ 워크플로우 생성 완료: ${workflow.id}`);

                // 작업 분석 및 분할
                console.log('🔍 작업 분석 중...');
                const analysis = this.conversationalManager.analyzeInput(message);
                console.log('📊 분석 결과:', analysis);

                const tasks = this.conversationalManager.splitIntoTasks(analysis, message);
                console.log(`📝 생성된 작업 수: ${tasks.length}개`);

                // 작업을 워크플로우에 추가
                console.log('➕ 작업을 워크플로우에 추가 중...');
                tasks.forEach((task, index) => {
                    console.log(`  ${index + 1}. ${task.title}`);
                    this.workflowDb.addTask(workflow.id, task);
                });

                // TODO 생성
                console.log('📋 TODO 생성 중...');
                const todos = this.conversationalManager.generateTodos(tasks, workflow);
                console.log(`📋 생성된 TODO 수: ${todos.length}개`);

                todos.forEach((todo, index) => {
                    console.log(`  ${index + 1}. ${todo.title}`);
                    this.workflowDb.createTodo(workflow.id, todo.taskId, todo);
                });

                // 대화 기록 추가
                console.log('💬 대화 기록 추가 중...');
                this.workflowDb.addConversation(
                    workflow.id,
                    message,
                    `Cursor에서 요청된 작업이 ${tasks.length}개의 작업으로 분할되었습니다.`
                );

                // Cursor 클라이언트들에게 실시간 업데이트 전송
                this.broadcastToCursor({
                    type: 'workflow_created',
                    workflow: workflow,
                    tasks: tasks,
                    todos: todos,
                    analysis: analysis
                });

                // 작업 완료
                this.isProcessing = false;
                console.log('✅ 작업 처리 완료!');

                const responseData = {
                    success: true,
                    message: '작업이 성공적으로 생성되었습니다.',
                    workflow: workflow,
                    tasks: tasks,
                    todos: todos
                };

                console.log('📤 응답 데이터:', JSON.stringify(responseData, null, 2));
                res.json(responseData);

            } catch (error) {
                console.error('❌ Cursor 요청 처리 오류:', error);
                console.error('❌ 오류 스택:', error.stack);
                this.isProcessing = false;

                const errorResponse = {
                    success: false,
                    error: error.message
                };

                console.log('📤 오류 응답:', JSON.stringify(errorResponse, null, 2));
                res.status(500).json(errorResponse);
            }
        });

        // 작업 상태 업데이트
        this.app.put('/api/cursor/task/:taskId', async (req, res) => {
            try {
                const { taskId } = req.params;
                const { status, workflowId } = req.body;

                console.log(`🔄 작업 상태 업데이트: ${taskId} -> ${status}`);

                const success = this.workflowDb.updateTaskStatus(workflowId, taskId, status);

                if (success) {
                    // TODO 상태도 함께 업데이트
                    const todoUpdated = this.workflowDb.updateTodoStatus(workflowId, taskId, status);
                    console.log(`📋 TODO 상태 업데이트: ${todoUpdated ? '성공' : '실패'}`);

                    // 워크플로우 진행률 재계산
                    const workflow = this.workflowDb.getWorkflow(workflowId);
                    if (workflow) {
                        const completedTasks = workflow.tasks.filter(task => task.status === 'completed').length;
                        const totalTasks = workflow.tasks.length;
                        const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

                        // 워크플로우 진행률 업데이트
                        this.workflowDb.updateWorkflowProgress(workflowId, progress);
                        console.log(`📈 워크플로우 진행률 업데이트: ${progress.toFixed(1)}%`);
                    }

                    // Cursor 클라이언트들에게 업데이트 전송
                    this.broadcastToCursor({
                        type: 'task_updated',
                        taskId: taskId,
                        status: status,
                        workflowId: workflowId,
                        progress: workflow ? (workflow.tasks.filter(task => task.status === 'completed').length / workflow.tasks.length) * 100 : 0
                    });

                    res.json({
                        success: true,
                        message: '작업 상태가 업데이트되었습니다.',
                        progress: workflow ? (workflow.tasks.filter(task => task.status === 'completed').length / workflow.tasks.length) * 100 : 0
                    });
                } else {
                    res.status(400).json({ success: false, error: '작업 상태 업데이트에 실패했습니다.' });
                }
            } catch (error) {
                console.error('❌ 작업 상태 업데이트 오류:', error);
                res.status(500).json({ success: false, error: error.message });
            }
        });

        // 워크플로우 목록 조회
        this.app.get('/api/cursor/workflows', (req, res) => {
            try {
                const workflows = this.workflowDb.getAllWorkflows();
                res.json({ success: true, workflows });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        // 통계 조회
        this.app.get('/api/cursor/stats', (req, res) => {
            try {
                const stats = this.workflowDb.getWorkflowStats();
                res.json({ success: true, stats });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        // Cursor 클라이언트 등록
        this.app.post('/api/cursor/register', (req, res) => {
            const { clientId, clientType = 'cursor' } = req.body;
            console.log(`📱 Cursor 클라이언트 등록: ${clientId}`);
            res.json({ success: true, message: '클라이언트가 등록되었습니다.' });
        });
    }

    setupWebSocket() {
        this.wss = new WebSocket.Server({ port: this.wsPort });

        this.wss.on('connection', (ws, req) => {
            console.log('🔌 Cursor 클라이언트 연결됨');
            this.cursorClients.add(ws);

            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    console.log('📨 WebSocket 메시지 수신:', data.type);
                    this.handleWebSocketMessage(ws, data);
                } catch (error) {
                    console.error('❌ WebSocket 메시지 파싱 오류:', error);
                }
            });

            ws.on('close', () => {
                console.log('🔌 Cursor 클라이언트 연결 해제됨');
                this.cursorClients.delete(ws);
            });

            ws.on('error', (error) => {
                console.error('❌ WebSocket 오류:', error);
                this.cursorClients.delete(ws);
            });

            // 연결 확인 메시지 전송
            ws.send(JSON.stringify({
                type: 'connection_established',
                message: 'Cursor 통합 시스템에 연결되었습니다.',
                timestamp: new Date().toISOString()
            }));
        });

        console.log(`🔌 WebSocket 서버 시작됨: ws://localhost:${this.wsPort}`);
    }

    handleWebSocketMessage(ws, data) {
        const { type, payload } = data;

        switch (type) {
            case 'ping':
                ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
                break;

            case 'get_status':
                const stats = this.workflowDb.getWorkflowStats();
                ws.send(JSON.stringify({
                    type: 'status_update',
                    stats: stats,
                    isProcessing: this.isProcessing
                }));
                break;

            case 'request_workflow':
                // 실시간 워크플로우 요청 처리
                this.handleRealtimeWorkflowRequest(ws, payload);
                break;

            default:
                console.log(`📨 알 수 없는 메시지 타입: ${type}`);
        }
    }

    async handleRealtimeWorkflowRequest(ws, payload) {
        try {
            const { message } = payload;
            console.log(`🎯 실시간 워크플로우 요청: ${message}`);

            // 워크플로우 생성
            const workflow = this.workflowDb.createWorkflow(
                this.extractTitle(message),
                message,
                this.analyzePriority(message),
                this.categorizeInput(message)
            );

            // 작업 분석 및 분할
            const analysis = this.conversationalManager.analyzeInput(message);
            const tasks = this.conversationalManager.splitIntoTasks(analysis, message);

            // 작업 추가
            tasks.forEach(task => {
                this.workflowDb.addTask(workflow.id, task);
            });

            // TODO 생성
            const todos = this.conversationalManager.generateTodos(tasks, workflow);
            todos.forEach(todo => {
                this.workflowDb.createTodo(workflow.id, todo.taskId, todo);
            });

            // 실시간 응답 전송
            ws.send(JSON.stringify({
                type: 'workflow_created',
                workflow: workflow,
                tasks: tasks,
                todos: todos,
                analysis: analysis
            }));

        } catch (error) {
            console.error('❌ 실시간 워크플로우 요청 처리 오류:', error);
            ws.send(JSON.stringify({
                type: 'error',
                message: error.message
            }));
        }
    }

    broadcastToCursor(data) {
        const message = JSON.stringify(data);
        this.cursorClients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    }

    // 유틸리티 메서드들
    extractTitle(input) {
        const sentences = input.split(/[.!?]/);
        return sentences[0].trim().substring(0, 50) + (sentences[0].length > 50 ? '...' : '');
    }

    analyzePriority(input) {
        const urgentKeywords = ['긴급', '즉시', '빠르게', 'ASAP', 'urgent'];
        const highKeywords = ['중요', '우선', '먼저', 'priority'];

        if (urgentKeywords.some(keyword => input.includes(keyword))) return 'urgent';
        if (highKeywords.some(keyword => input.includes(keyword))) return 'high';
        return 'medium';
    }

    categorizeInput(input) {
        const devKeywords = ['개발', '구현', '코딩', '프로그래밍', '앱', '웹사이트'];
        const bugKeywords = ['버그', '오류', '에러', '수정', '해결'];
        const designKeywords = ['디자인', 'UI', 'UX', '화면', '인터페이스'];

        if (devKeywords.some(keyword => input.includes(keyword))) return 'development';
        if (bugKeywords.some(keyword => input.includes(keyword))) return 'bug-fix';
        if (designKeywords.some(keyword => input.includes(keyword))) return 'design';
        return 'general';
    }

    start() {
        this.app.listen(this.port, () => {
            console.log('🚀 Cursor 통합 관리자 시작됨!');
            console.log(`🌐 HTTP API: http://localhost:${this.port}`);
            console.log(`🔌 WebSocket: ws://localhost:${this.wsPort}`);
            console.log('=====================================');
            console.log('🎯 Cursor 통합 기능:');
            console.log('  - 실시간 작업 요청 처리');
            console.log('  - 자동 워크플로우 생성');
            console.log('  - WebSocket 실시간 통신');
            console.log('  - 작업 상태 실시간 업데이트');
            console.log('  - Cursor 클라이언트 관리');
            console.log('=====================================');
        });
    }
}

// 서버 시작
if (require.main === module) {
    const manager = new CursorIntegrationManager();
    manager.start();
}

module.exports = CursorIntegrationManager;
