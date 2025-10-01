const WebSocket = require('ws');
const express = require('express');
const path = require('path');
const BinaryTaskManager = require('./binary-task-manager');

/**
 * 이진데이터 기반 Task 서버
 * UTF-8 안전 모드 및 영구 저장 지원
 */
class BinaryTaskServer {
    constructor(port = 3003) {
        this.port = port;
        this.app = express();
        this.server = null;
        this.wss = null;
        this.clients = new Map();
        this.taskManager = new BinaryTaskManager();

        // 통계
        this.stats = {
            totalRequests: 0,
            processedRequests: 0,
            failedRequests: 0,
            averageProcessingTime: 0,
            startTime: Date.now(),
            utf8Errors: 0,
            binaryOperations: 0
        };

        this.setupExpress();
        this.setupWebSocket();
    }

    /**
     * Express 서버 설정
     */
    setupExpress() {
        // 정적 파일 서빙
        this.app.use(express.static('.'));

        // JSON 파싱
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

        // CORS 설정
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
            next();
        });

        // API 라우트
        this.setupRoutes();
    }

    /**
     * API 라우트 설정
     */
    setupRoutes() {
        // 모든 Task 조회
        this.app.get('/api/tasks', (req, res) => {
            try {
                const tasks = this.taskManager.loadAllTasks();
                const status = this.taskManager.getSystemStatus();

                res.json({
                    success: true,
                    tasks: tasks,
                    status: status,
                    stats: this.stats
                });
            } catch (error) {
                console.error('❌ Task 조회 오류:', error);
                res.status(500).json({
                    success: false,
                    error: 'Task 조회 실패',
                    message: error.message
                });
            }
        });

        // Task 생성
        this.app.post('/api/tasks', (req, res) => {
            try {
                const { content, priority = 'medium', category = 'general' } = req.body;

                if (!content || content.trim().length === 0) {
                    return res.status(400).json({
                        success: false,
                        error: 'Task 내용이 비어있습니다'
                    });
                }

                // UTF-8 안전한 Task 생성
                const task = this.taskManager.createTask(content, priority, category);
                this.stats.totalRequests++;
                this.stats.binaryOperations++;

                // 클라이언트들에게 브로드캐스트
                this.broadcastTaskUpdate('task_created', task);

                res.json({
                    success: true,
                    task: task,
                    message: 'Task가 생성되었습니다'
                });

            } catch (error) {
                console.error('❌ Task 생성 오류:', error);
                this.stats.failedRequests++;
                this.stats.utf8Errors++;

                res.status(500).json({
                    success: false,
                    error: 'Task 생성 실패',
                    message: error.message
                });
            }
        });

        // Task 상태 업데이트
        this.app.put('/api/tasks/:id', (req, res) => {
            try {
                const { id } = req.params;
                const { status, additionalData = {} } = req.body;

                const success = this.taskManager.updateTaskStatus(id, status, additionalData);

                if (success) {
                    this.stats.binaryOperations++;
                    this.broadcastTaskUpdate('task_updated', { id, status, ...additionalData });

                    res.json({
                        success: true,
                        message: 'Task 상태가 업데이트되었습니다'
                    });
                } else {
                    res.status(404).json({
                        success: false,
                        error: 'Task를 찾을 수 없습니다'
                    });
                }

            } catch (error) {
                console.error('❌ Task 업데이트 오류:', error);
                res.status(500).json({
                    success: false,
                    error: 'Task 업데이트 실패',
                    message: error.message
                });
            }
        });

        // 시스템 상태 조회
        this.app.get('/api/status', (req, res) => {
            try {
                const systemStatus = this.taskManager.getSystemStatus();
                const integrity = this.taskManager.verifyDataIntegrity();

                res.json({
                    success: true,
                    system: systemStatus,
                    integrity: integrity,
                    stats: this.stats,
                    uptime: Date.now() - this.stats.startTime,
                    connectedClients: this.clients.size
                });
            } catch (error) {
                console.error('❌ 상태 조회 오류:', error);
                res.status(500).json({
                    success: false,
                    error: '상태 조회 실패',
                    message: error.message
                });
            }
        });

        // 데이터 무결성 검사
        this.app.post('/api/verify', (req, res) => {
            try {
                const integrity = this.taskManager.verifyDataIntegrity();

                res.json({
                    success: true,
                    integrity: integrity,
                    message: '무결성 검사가 완료되었습니다'
                });
            } catch (error) {
                console.error('❌ 무결성 검사 오류:', error);
                res.status(500).json({
                    success: false,
                    error: '무결성 검사 실패',
                    message: error.message
                });
            }
        });

        // 백업 생성
        this.app.post('/api/backup', (req, res) => {
            try {
                const backupFile = this.taskManager.createBackup();

                res.json({
                    success: true,
                    backupFile: backupFile,
                    message: '백업이 생성되었습니다'
                });
            } catch (error) {
                console.error('❌ 백업 생성 오류:', error);
                res.status(500).json({
                    success: false,
                    error: '백업 생성 실패',
                    message: error.message
                });
            }
        });

        // GUI 서빙
        this.app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, 'binary-todo-gui.html'));
        });
    }

    /**
     * WebSocket 설정
     */
    setupWebSocket() {
        this.wss = new WebSocket.Server({ port: this.port + 1 });

        this.wss.on('connection', (ws, req) => {
            const clientId = this.generateClientId();
            this.clients.set(clientId, {
                ws,
                id: clientId,
                connectedAt: Date.now(),
                lastActivity: Date.now()
            });

            console.log(`🔌 클라이언트 연결: ${clientId} (${req.socket.remoteAddress})`);

            // 클라이언트에게 연결 확인 메시지 전송
            this.sendToClient(clientId, {
                type: 'connection',
                message: '이진데이터 Task 서버에 연결되었습니다',
                clientId,
                serverTime: new Date().toISOString(),
                utf8Safe: true
            });

            ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data);
                    this.handleMessage(clientId, message);
                } catch (error) {
                    console.error('❌ 메시지 파싱 오류:', error);
                    this.stats.utf8Errors++;
                    this.sendToClient(clientId, {
                        type: 'error',
                        message: '잘못된 메시지 형식입니다'
                    });
                }
            });

            ws.on('close', () => {
                console.log(`🔌 클라이언트 연결 해제: ${clientId}`);
                this.clients.delete(clientId);
            });

            ws.on('error', (error) => {
                console.error(`❌ 클라이언트 오류 (${clientId}):`, error);
                this.clients.delete(clientId);
            });
        });
    }

    /**
     * 메시지 처리
     */
    handleMessage(clientId, message) {
        const client = this.clients.get(clientId);
        if (!client) return;

        client.lastActivity = Date.now();

        switch (message.type) {
            case 'task_request':
                this.handleTaskRequest(clientId, message);
                break;
            case 'status_request':
                this.sendStatus(clientId);
                break;
            case 'ping':
                this.sendToClient(clientId, { type: 'pong', timestamp: Date.now() });
                break;
            default:
                console.log(`📨 알 수 없는 메시지 타입: ${message.type}`);
        }
    }

    /**
     * Task 요청 처리
     */
    async handleTaskRequest(clientId, message) {
        const startTime = Date.now();
        this.stats.totalRequests++;

        try {
            const { content, priority = 'medium', category = 'general' } = message;

            if (!content || content.trim().length === 0) {
                throw new Error('요청 내용이 비어있습니다');
            }

            console.log(`📥 Task 요청 수신: ${content.substring(0, 50)}...`);

            // UTF-8 안전한 Task 생성
            const task = this.taskManager.createTask(content, priority, category);
            this.stats.binaryOperations++;

            // 클라이언트에게 즉시 응답
            this.sendToClient(clientId, {
                type: 'task_created',
                taskId: task.id,
                message: 'Task가 생성되어 이진데이터에 저장되었습니다',
                utf8Safe: true
            });

            // 모든 클라이언트에게 브로드캐스트
            this.broadcastTaskUpdate('task_created', task);

        } catch (error) {
            console.error('❌ Task 요청 처리 오류:', error);
            this.stats.failedRequests++;
            this.stats.utf8Errors++;

            this.sendToClient(clientId, {
                type: 'error',
                message: `Task 생성 실패: ${error.message}`
            });
        }
    }

    /**
     * Task 업데이트 브로드캐스트
     */
    broadcastTaskUpdate(type, data) {
        const message = {
            type: type,
            data: data,
            timestamp: Date.now(),
            utf8Safe: true
        };

        for (const [clientId, client] of this.clients) {
            this.sendToClient(clientId, message);
        }
    }

    /**
     * 상태 전송
     */
    sendStatus(clientId) {
        const systemStatus = this.taskManager.getSystemStatus();
        const integrity = this.taskManager.verifyDataIntegrity();

        const status = {
            type: 'status',
            timestamp: Date.now(),
            system: systemStatus,
            integrity: integrity,
            stats: this.stats,
            connectedClients: this.clients.size,
            uptime: Date.now() - this.stats.startTime,
            utf8Safe: true
        };

        this.sendToClient(clientId, status);
    }

    /**
     * 클라이언트에게 메시지 전송
     */
    sendToClient(clientId, message) {
        const client = this.clients.get(clientId);
        if (client && client.ws.readyState === WebSocket.OPEN) {
            try {
                client.ws.send(JSON.stringify(message));
            } catch (error) {
                console.error(`❌ 메시지 전송 실패 (${clientId}):`, error);
                this.clients.delete(clientId);
            }
        }
    }

    /**
     * 서버 시작
     */
    start() {
        this.server = this.app.listen(this.port, () => {
            console.log(`🚀 이진데이터 Task 서버 시작됨: 포트 ${this.port}`);
            console.log(`📡 WebSocket: ws://localhost:${this.port + 1}`);
            console.log(`🌐 HTTP API: http://localhost:${this.port}`);
            console.log(`🖥️  GUI: http://localhost:${this.port}`);
            console.log(`✅ UTF-8 안전 모드 활성화`);
            console.log(`💾 이진데이터 영구 저장 활성화`);
        });

        // 주기적 상태 업데이트
        this.startStatusUpdateLoop();

        // 주기적 데이터 무결성 검사
        this.startIntegrityCheckLoop();
    }

    /**
     * 상태 업데이트 루프
     */
    startStatusUpdateLoop() {
        setInterval(() => {
            this.broadcastStatus();
        }, 5000); // 5초마다 상태 브로드캐스트
    }

    /**
     * 무결성 검사 루프
     */
    startIntegrityCheckLoop() {
        setInterval(() => {
            try {
                const integrity = this.taskManager.verifyDataIntegrity();
                if (integrity.invalid > 0) {
                    console.warn(`⚠️ 손상된 데이터 발견: ${integrity.invalid}개`);
                }
            } catch (error) {
                console.error('❌ 무결성 검사 오류:', error);
            }
        }, 60000); // 1분마다 무결성 검사
    }

    /**
     * 상태 브로드캐스트
     */
    broadcastStatus() {
        const systemStatus = this.taskManager.getSystemStatus();
        const integrity = this.taskManager.verifyDataIntegrity();

        const status = {
            type: 'status_update',
            timestamp: Date.now(),
            system: systemStatus,
            integrity: integrity,
            stats: this.stats,
            connectedClients: this.clients.size,
            uptime: Date.now() - this.stats.startTime,
            utf8Safe: true
        };

        for (const [clientId, client] of this.clients) {
            this.sendToClient(clientId, status);
        }
    }

    /**
     * 서버 종료
     */
    stop() {
        if (this.server) {
            this.server.close();
        }
        if (this.wss) {
            this.wss.close();
        }
        console.log('🛑 이진데이터 Task 서버 종료됨');
    }

    /**
     * 유틸리티 메서드들
     */
    generateClientId() {
        return 'client_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    }
}

// CLI 실행
if (require.main === module) {
    const server = new BinaryTaskServer(3003);

    // Graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n🛑 서버 종료 중...');
        server.stop();
        process.exit(0);
    });

    server.start();
}

module.exports = BinaryTaskServer;
