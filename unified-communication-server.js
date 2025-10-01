const WebSocket = require('ws');
const express = require('express');
const path = require('path');
const BinaryTaskManager = require('./binary-task-manager');

/**
 * 통합 통신 서버
 * 모든 통신을 하나의 서버로 통합하여 효율성 극대화
 */
class UnifiedCommunicationServer {
    constructor(port = 3000) {
        this.port = port;
        this.app = express();
        this.server = null;
        this.wss = null;
        this.clients = new Map();
        this.taskManager = new BinaryTaskManager();

        // 통신 상태 관리
        this.communicationStatus = {
            isConnected: false,
            lastHeartbeat: Date.now(),
            totalConnections: 0,
            activeConnections: 0,
            messageCount: 0,
            errorCount: 0,
            uptime: Date.now()
        };

        // 통계
        this.stats = {
            totalRequests: 0,
            processedRequests: 0,
            failedRequests: 0,
            averageProcessingTime: 0,
            startTime: Date.now(),
            utf8Errors: 0,
            binaryOperations: 0,
            communicationErrors: 0
        };

        this.setupExpress();
        this.setupWebSocket();
        this.startHealthCheck();
    }

    /**
     * Express 서버 설정
     */
    setupExpress() {
        // 정적 파일 서빙
        this.app.use(express.static('.'));

        // JSON 파싱 (UTF-8 안전)
        this.app.use(express.json({
            limit: '10mb'
        }));

        this.app.use(express.urlencoded({
            extended: true,
            limit: '10mb',
            parameterLimit: 1000
        }));

        // CORS 설정
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
            res.header('Access-Control-Max-Age', '86400');

            if (req.method === 'OPTIONS') {
                res.sendStatus(200);
                return;
            }
            next();
        });

        // API 라우트
        this.setupRoutes();
    }

    /**
     * API 라우트 설정
     */
    setupRoutes() {
        // 헬스 체크
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: Date.now() - this.stats.startTime,
                communication: this.communicationStatus,
                stats: this.stats
            });
        });

        // 통신 상태 조회
        this.app.get('/api/communication/status', (req, res) => {
            res.json({
                success: true,
                communication: this.communicationStatus,
                stats: this.stats,
                timestamp: new Date().toISOString()
            });
        });

        // 모든 Task 조회
        this.app.get('/api/tasks', (req, res) => {
            try {
                const tasks = this.taskManager.loadAllTasks();
                const status = this.taskManager.getSystemStatus();

                res.json({
                    success: true,
                    tasks: tasks,
                    status: status,
                    stats: this.stats,
                    communication: this.communicationStatus
                });
            } catch (error) {
                console.error('❌ Task 조회 오류:', error);
                this.stats.communicationErrors++;
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

                // WebSocket 클라이언트들에게 브로드캐스트
                this.broadcastMessage('task_created', {
                    task: task,
                    message: '새 Task가 생성되었습니다',
                    timestamp: new Date().toISOString()
                });

                res.json({
                    success: true,
                    task: task,
                    message: 'Task가 생성되었습니다',
                    communication: this.communicationStatus
                });

            } catch (error) {
                console.error('❌ Task 생성 오류:', error);
                this.stats.failedRequests++;
                this.stats.communicationErrors++;

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

                    // WebSocket 브로드캐스트
                    this.broadcastMessage('task_updated', {
                        taskId: id,
                        status: status,
                        additionalData: additionalData,
                        timestamp: new Date().toISOString()
                    });

                    res.json({
                        success: true,
                        message: 'Task 상태가 업데이트되었습니다',
                        communication: this.communicationStatus
                    });
                } else {
                    res.status(404).json({
                        success: false,
                        error: 'Task를 찾을 수 없습니다'
                    });
                }

            } catch (error) {
                console.error('❌ Task 업데이트 오류:', error);
                this.stats.communicationErrors++;
                res.status(500).json({
                    success: false,
                    error: 'Task 업데이트 실패',
                    message: error.message
                });
            }
        });

        // 통신 테스트
        this.app.post('/api/communication/test', (req, res) => {
            const { message } = req.body;

            // WebSocket으로 테스트 메시지 브로드캐스트
            this.broadcastMessage('communication_test', {
                message: message || '통신 테스트 메시지',
                timestamp: new Date().toISOString(),
                serverTime: new Date().toISOString()
            });

            res.json({
                success: true,
                message: '통신 테스트 메시지가 전송되었습니다',
                activeConnections: this.clients.size,
                communication: this.communicationStatus
            });
        });

        // GUI 서빙
        this.app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, 'unified-todo-gui.html'));
        });

        // 이진데이터 GUI
        this.app.get('/binary', (req, res) => {
            res.sendFile(path.join(__dirname, 'binary-todo-gui.html'));
        });

        // 기존 GUI
        this.app.get('/legacy', (req, res) => {
            res.sendFile(path.join(__dirname, 'todo-manager-gui.html'));
        });
    }

    /**
     * WebSocket 설정
     */
    setupWebSocket() {
        this.wss = new WebSocket.Server({
            port: this.port + 1,
            perMessageDeflate: false, // 압축 비활성화로 안정성 향상
            maxPayload: 1024 * 1024 // 1MB 최대 페이로드
        });

        this.wss.on('connection', (ws, req) => {
            const clientId = this.generateClientId();
            const clientInfo = {
                ws,
                id: clientId,
                connectedAt: Date.now(),
                lastActivity: Date.now(),
                ip: req.socket.remoteAddress,
                userAgent: req.headers['user-agent'] || 'Unknown'
            };

            this.clients.set(clientId, clientInfo);
            this.communicationStatus.totalConnections++;
            this.communicationStatus.activeConnections = this.clients.size;
            this.communicationStatus.isConnected = true;

            console.log(`🔌 클라이언트 연결: ${clientId} (${clientInfo.ip})`);

            // 클라이언트에게 연결 확인 메시지 전송
            this.sendToClient(clientId, {
                type: 'connection_established',
                message: '통합 통신 서버에 연결되었습니다',
                clientId: clientId,
                serverTime: new Date().toISOString(),
                communication: this.communicationStatus,
                utf8Safe: true
            });

            ws.on('message', (data) => {
                try {
                    clientInfo.lastActivity = Date.now();
                    this.communicationStatus.lastHeartbeat = Date.now();
                    this.communicationStatus.messageCount++;

                    const message = JSON.parse(data.toString('utf8'));
                    this.handleMessage(clientId, message);
                } catch (error) {
                    console.error('❌ 메시지 파싱 오류:', error);
                    this.stats.communicationErrors++;
                    this.communicationStatus.errorCount++;

                    this.sendToClient(clientId, {
                        type: 'error',
                        message: '잘못된 메시지 형식입니다',
                        error: error.message
                    });
                }
            });

            ws.on('close', (code, reason) => {
                console.log(`🔌 클라이언트 연결 해제: ${clientId} (코드: ${code})`);
                this.clients.delete(clientId);
                this.communicationStatus.activeConnections = this.clients.size;

                if (this.clients.size === 0) {
                    this.communicationStatus.isConnected = false;
                }
            });

            ws.on('error', (error) => {
                console.error(`❌ 클라이언트 오류 (${clientId}):`, error);
                this.stats.communicationErrors++;
                this.communicationStatus.errorCount++;
                this.clients.delete(clientId);
                this.communicationStatus.activeConnections = this.clients.size;
            });

            ws.on('pong', () => {
                clientInfo.lastActivity = Date.now();
                this.communicationStatus.lastHeartbeat = Date.now();
            });
        });

        // WebSocket 서버 오류 처리
        this.wss.on('error', (error) => {
            console.error('❌ WebSocket 서버 오류:', error);
            this.stats.communicationErrors++;
        });
    }

    /**
     * 메시지 처리
     */
    handleMessage(clientId, message) {
        const client = this.clients.get(clientId);
        if (!client) return;

        try {
            switch (message.type) {
                case 'task_request':
                    this.handleTaskRequest(clientId, message);
                    break;
                case 'status_request':
                    this.sendStatus(clientId);
                    break;
                case 'ping':
                    this.sendToClient(clientId, {
                        type: 'pong',
                        timestamp: Date.now(),
                        serverTime: new Date().toISOString()
                    });
                    break;
                case 'heartbeat':
                    this.handleHeartbeat(clientId, message);
                    break;
                case 'communication_test':
                    this.handleCommunicationTest(clientId, message);
                    break;
                default:
                    console.log(`📨 알 수 없는 메시지 타입: ${message.type}`);
                    this.sendToClient(clientId, {
                        type: 'error',
                        message: `알 수 없는 메시지 타입: ${message.type}`
                    });
            }
        } catch (error) {
            console.error(`❌ 메시지 처리 오류 (${clientId}):`, error);
            this.stats.communicationErrors++;
            this.sendToClient(clientId, {
                type: 'error',
                message: '메시지 처리 중 오류가 발생했습니다',
                error: error.message
            });
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

            const processingTime = Date.now() - startTime;
            this.updateAverageProcessingTime(processingTime);

            // 클라이언트에게 즉시 응답
            this.sendToClient(clientId, {
                type: 'task_created',
                task: task,
                message: 'Task가 생성되어 이진데이터에 저장되었습니다',
                processingTime: processingTime,
                timestamp: new Date().toISOString(),
                utf8Safe: true
            });

            // 모든 클라이언트에게 브로드캐스트
            this.broadcastMessage('task_created', {
                task: task,
                message: '새 Task가 생성되었습니다',
                timestamp: new Date().toISOString()
            });

            this.stats.processedRequests++;

        } catch (error) {
            console.error('❌ Task 요청 처리 오류:', error);
            this.stats.failedRequests++;
            this.stats.communicationErrors++;

            this.sendToClient(clientId, {
                type: 'error',
                message: `Task 생성 실패: ${error.message}`,
                error: error.message
            });
        }
    }

    /**
     * 하트비트 처리
     */
    handleHeartbeat(clientId, message) {
        const client = this.clients.get(clientId);
        if (client) {
            client.lastActivity = Date.now();
            this.communicationStatus.lastHeartbeat = Date.now();

            this.sendToClient(clientId, {
                type: 'heartbeat_response',
                timestamp: Date.now(),
                serverTime: new Date().toISOString(),
                communication: this.communicationStatus
            });
        }
    }

    /**
     * 통신 테스트 처리
     */
    handleCommunicationTest(clientId, message) {
        const { testMessage } = message;

        this.sendToClient(clientId, {
            type: 'communication_test_response',
            message: `테스트 메시지 수신: ${testMessage}`,
            timestamp: Date.now(),
            serverTime: new Date().toISOString(),
            communication: this.communicationStatus
        });
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
            communication: this.communicationStatus,
            connectedClients: this.clients.size,
            uptime: Date.now() - this.stats.startTime,
            utf8Safe: true
        };

        this.sendToClient(clientId, status);
    }

    /**
     * 메시지 브로드캐스트
     */
    broadcastMessage(type, data) {
        const message = {
            type: type,
            data: data,
            timestamp: Date.now(),
            serverTime: new Date().toISOString(),
            utf8Safe: true
        };

        let successCount = 0;
        let errorCount = 0;

        for (const [clientId, client] of this.clients) {
            try {
                if (client.ws.readyState === WebSocket.OPEN) {
                    client.ws.send(JSON.stringify(message));
                    successCount++;
                } else {
                    this.clients.delete(clientId);
                    errorCount++;
                }
            } catch (error) {
                console.error(`❌ 브로드캐스트 실패 (${clientId}):`, error);
                this.clients.delete(clientId);
                errorCount++;
            }
        }

        this.communicationStatus.activeConnections = this.clients.size;

        if (errorCount > 0) {
            console.log(`📡 브로드캐스트: 성공 ${successCount}개, 실패 ${errorCount}개`);
        }
    }

    /**
     * 클라이언트에게 메시지 전송
     */
    sendToClient(clientId, message) {
        const client = this.clients.get(clientId);
        if (client && client.ws.readyState === WebSocket.OPEN) {
            try {
                client.ws.send(JSON.stringify(message));
                return true;
            } catch (error) {
                console.error(`❌ 메시지 전송 실패 (${clientId}):`, error);
                this.stats.communicationErrors++;
                this.clients.delete(clientId);
                return false;
            }
        }
        return false;
    }

    /**
     * 헬스 체크 시작
     */
    startHealthCheck() {
        // 30초마다 하트비트 체크
        setInterval(() => {
            this.checkClientHealth();
        }, 30000);

        // 5초마다 상태 브로드캐스트
        setInterval(() => {
            this.broadcastStatus();
        }, 5000);

        // 1분마다 무결성 검사
        setInterval(() => {
            this.performIntegrityCheck();
        }, 60000);
    }

    /**
     * 클라이언트 헬스 체크
     */
    checkClientHealth() {
        const now = Date.now();
        const timeout = 60000; // 1분 타임아웃

        for (const [clientId, client] of this.clients) {
            if (now - client.lastActivity > timeout) {
                console.log(`🔌 비활성 클라이언트 제거: ${clientId}`);
                this.clients.delete(clientId);
            } else if (client.ws.readyState === WebSocket.OPEN) {
                // 핑 전송
                client.ws.ping();
            }
        }

        this.communicationStatus.activeConnections = this.clients.size;
        this.communicationStatus.isConnected = this.clients.size > 0;
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
            communication: this.communicationStatus,
            connectedClients: this.clients.size,
            uptime: Date.now() - this.stats.startTime,
            utf8Safe: true
        };

        this.broadcastMessage('status_update', status);
    }

    /**
     * 무결성 검사
     */
    performIntegrityCheck() {
        try {
            const integrity = this.taskManager.verifyDataIntegrity();
            if (integrity.invalid > 0) {
                console.warn(`⚠️ 손상된 데이터 발견: ${integrity.invalid}개`);
                this.broadcastMessage('integrity_warning', {
                    message: `손상된 데이터 ${integrity.invalid}개 발견`,
                    integrity: integrity
                });
            }
        } catch (error) {
            console.error('❌ 무결성 검사 오류:', error);
            this.stats.communicationErrors++;
        }
    }

    /**
     * 평균 처리 시간 업데이트
     */
    updateAverageProcessingTime(processingTime) {
        if (this.stats.processedRequests === 0) {
            this.stats.averageProcessingTime = processingTime;
        } else {
            this.stats.averageProcessingTime =
                (this.stats.averageProcessingTime * (this.stats.processedRequests - 1) + processingTime) / this.stats.processedRequests;
        }
    }

    /**
     * 서버 시작
     */
    start() {
        this.server = this.app.listen(this.port, () => {
            console.log(`🚀 통합 통신 서버 시작됨: 포트 ${this.port}`);
            console.log(`📡 WebSocket: ws://localhost:${this.port + 1}`);
            console.log(`🌐 HTTP API: http://localhost:${this.port}`);
            console.log(`🖥️  통합 GUI: http://localhost:${this.port}`);
            console.log(`💾 이진데이터 GUI: http://localhost:${this.port}/binary`);
            console.log(`📋 레거시 GUI: http://localhost:${this.port}/legacy`);
            console.log(`✅ UTF-8 안전 모드 활성화`);
            console.log(`🔄 통신 상태 모니터링 활성화`);
        });

        // 서버 오류 처리
        this.server.on('error', (error) => {
            console.error('❌ 서버 오류:', error);
            this.stats.communicationErrors++;
        });
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
        console.log('🛑 통합 통신 서버 종료됨');
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
    const server = new UnifiedCommunicationServer(3000);

    // Graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n🛑 서버 종료 중...');
        server.stop();
        process.exit(0);
    });

    server.start();
}

module.exports = UnifiedCommunicationServer;
