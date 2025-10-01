const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');
const chokidar = require('chokidar');

/**
 * Cursor 통합 자동 개발 시스템
 * 
 * 기능:
 * 1. 파일 변경 감지 및 자동 처리
 * 2. 실시간 Task 생성 및 관리
 * 3. 자동 버그 감지 및 수정
 * 4. Cursor와의 실시간 통신
 */
class CursorIntegration {
    constructor(options = {}) {
        this.port = options.port || 3001;
        this.watchPaths = options.watchPaths || ['frontend/src/**/*', 'server-backend/**/*'];
        this.ignoredPaths = options.ignoredPaths || ['**/node_modules/**', '**/dist/**', '**/coverage/**'];

        this.watcher = null;
        this.wss = null;
        this.clients = new Map();
        this.taskQueue = [];
        this.isRunning = false;

        // 통계
        this.stats = {
            filesChanged: 0,
            tasksCreated: 0,
            bugsFixed: 0,
            buildErrors: 0,
            startTime: null
        };
    }

    /**
     * 시스템 시작
     */
    async start() {
        console.log('🚀 Cursor 통합 자동 개발 시스템 시작...');

        try {
            // 1. WebSocket 서버 시작
            await this.startWebSocketServer();

            // 2. 파일 감시 시작
            await this.startFileWatcher();

            // 3. 자동 빌드 모니터링 시작
            await this.startBuildMonitor();

            // 4. Task 처리 루프 시작
            this.startTaskProcessor();

            this.isRunning = true;
            this.stats.startTime = new Date();

            console.log('✅ 시스템이 성공적으로 시작되었습니다!');
            console.log(`📡 WebSocket 서버: ws://localhost:${this.port}`);
            console.log(`👀 감시 경로: ${this.watchPaths.join(', ')}`);

        } catch (error) {
            console.error('❌ 시스템 시작 실패:', error);
            throw error;
        }
    }

    /**
     * WebSocket 서버 시작
     */
    async startWebSocketServer() {
        return new Promise((resolve, reject) => {
            try {
                this.wss = new WebSocket.Server({ port: this.port });

                this.wss.on('connection', (ws, req) => {
                    const clientId = this.generateClientId();
                    this.clients.set(clientId, {
                        ws,
                        id: clientId,
                        connectedAt: new Date(),
                        lastActivity: new Date()
                    });

                    console.log(`🔌 클라이언트 연결: ${clientId} (${req.socket.remoteAddress})`);

                    ws.on('message', (message) => {
                        this.handleClientMessage(clientId, message);
                    });

                    ws.on('close', () => {
                        console.log(`🔌 클라이언트 연결 해제: ${clientId}`);
                        this.clients.delete(clientId);
                    });

                    ws.on('error', (error) => {
                        console.error(`❌ 클라이언트 오류 (${clientId}):`, error);
                        this.clients.delete(clientId);
                    });

                    // 연결 확인 메시지 전송
                    this.sendToClient(clientId, {
                        type: 'CONNECTION_ESTABLISHED',
                        data: {
                            clientId,
                            serverTime: new Date().toISOString(),
                            systemStatus: 'running'
                        }
                    });
                });

                this.wss.on('error', (error) => {
                    console.error('❌ WebSocket 서버 오류:', error);
                    reject(error);
                });

                console.log(`📡 WebSocket 서버 시작됨: 포트 ${this.port}`);
                resolve();

            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * 파일 감시 시작
     */
    async startFileWatcher() {
        this.watcher = chokidar.watch(this.watchPaths, {
            ignored: this.ignoredPaths,
            persistent: true,
            ignoreInitial: true
        });

        this.watcher
            .on('change', (path) => this.handleFileChange(path, 'change'))
            .on('add', (path) => this.handleFileChange(path, 'add'))
            .on('unlink', (path) => this.handleFileChange(path, 'unlink'))
            .on('error', (error) => console.error('❌ 파일 감시 오류:', error));

        console.log('👀 파일 감시 시작됨');
    }

    /**
     * 자동 빌드 모니터링 시작
     */
    async startBuildMonitor() {
        // 5초마다 빌드 상태 확인
        setInterval(async () => {
            if (this.isRunning) {
                await this.checkBuildStatus();
            }
        }, 5000);

        console.log('🔨 자동 빌드 모니터링 시작됨');
    }

    /**
     * Task 처리 루프 시작
     */
    startTaskProcessor() {
        setInterval(async () => {
            if (this.taskQueue.length > 0 && this.isRunning) {
                const task = this.taskQueue.shift();
                await this.processTask(task);
            }
        }, 1000);

        console.log('⚙️ Task 처리 루프 시작됨');
    }

    /**
     * 파일 변경 처리
     */
    async handleFileChange(filePath, eventType) {
        this.stats.filesChanged++;

        console.log(`📝 파일 ${eventType}: ${filePath}`);

        // 모든 클라이언트에게 파일 변경 알림
        this.broadcastToClients({
            type: 'FILE_CHANGED',
            data: {
                path: filePath,
                eventType,
                timestamp: new Date().toISOString()
            }
        });

        // TypeScript 파일인 경우 자동 빌드 실행
        if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
            await this.triggerAutoBuild();
        }
    }

    /**
     * 자동 빌드 실행
     */
    async triggerAutoBuild() {
        console.log('🔨 자동 빌드 실행...');

        try {
            const { exec } = require('child_process');
            const util = require('util');
            const execAsync = util.promisify(exec);

            // frontend 빌드 실행
            const { stdout, stderr } = await execAsync('cd frontend && npm run build', {
                timeout: 30000
            });

            if (stderr && stderr.includes('error')) {
                await this.handleBuildErrors(stderr);
            } else {
                console.log('✅ 빌드 성공');
                this.broadcastToClients({
                    type: 'BUILD_SUCCESS',
                    data: {
                        timestamp: new Date().toISOString(),
                        output: stdout
                    }
                });
            }

        } catch (error) {
            console.error('❌ 빌드 실패:', error.message);
            await this.handleBuildErrors(error.message);
        }
    }

    /**
     * 빌드 오류 처리
     */
    async handleBuildErrors(errorOutput) {
        this.stats.buildErrors++;

        console.log('🐛 빌드 오류 감지, 자동 수정 시도...');

        // 자동 버그 수정 실행
        const fixResult = await this.runAutoBugFix();

        // Task 생성
        const task = {
            id: this.generateTaskId(),
            title: '빌드 오류 자동 수정',
            category: 'bug-fix',
            priority: 'high',
            status: 'in-progress',
            createdAt: new Date().toISOString(),
            details: {
                errorOutput,
                fixResult,
                filePath: 'frontend'
            }
        };

        this.taskQueue.push(task);
        this.stats.tasksCreated++;

        // 클라이언트에게 알림
        this.broadcastToClients({
            type: 'BUILD_ERROR',
            data: {
                task,
                errorOutput,
                fixResult,
                timestamp: new Date().toISOString()
            }
        });
    }

    /**
     * 자동 버그 수정 실행
     */
    async runAutoBugFix() {
        try {
            const { exec } = require('child_process');
            const util = require('util');
            const execAsync = util.promisify(exec);

            const { stdout } = await execAsync('node auto-bug-fix.js');

            this.stats.bugsFixed++;
            return {
                success: true,
                output: stdout,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            return {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Task 처리
     */
    async processTask(task) {
        console.log(`⚙️ Task 처리 중: ${task.title} (${task.id})`);

        try {
            // Task 실행 로직
            switch (task.category) {
                case 'bug-fix':
                    await this.processBugFixTask(task);
                    break;
                case 'feature':
                    await this.processFeatureTask(task);
                    break;
                case 'refactor':
                    await this.processRefactorTask(task);
                    break;
                default:
                    console.log(`⚠️ 알 수 없는 Task 카테고리: ${task.category}`);
            }

            // Task 완료 처리
            task.status = 'completed';
            task.completedAt = new Date().toISOString();

            // 클라이언트에게 완료 알림
            this.broadcastToClients({
                type: 'TASK_COMPLETED',
                data: {
                    task,
                    timestamp: new Date().toISOString()
                }
            });

            console.log(`✅ Task 완료: ${task.title}`);

        } catch (error) {
            console.error(`❌ Task 처리 실패 (${task.id}):`, error);

            task.status = 'failed';
            task.error = error.message;

            this.broadcastToClients({
                type: 'TASK_FAILED',
                data: {
                    task,
                    error: error.message,
                    timestamp: new Date().toISOString()
                }
            });
        }
    }

    /**
     * 클라이언트 메시지 처리
     */
    handleClientMessage(clientId, message) {
        try {
            const { type, data } = JSON.parse(message);

            switch (type) {
                case 'TASK_REQUEST':
                    this.handleTaskRequest(clientId, data);
                    break;
                case 'STATUS_REQUEST':
                    this.handleStatusRequest(clientId);
                    break;
                case 'PING':
                    this.handlePing(clientId);
                    break;
                default:
                    console.log(`⚠️ 알 수 없는 메시지 타입: ${type}`);
            }

        } catch (error) {
            console.error(`❌ 메시지 처리 오류 (${clientId}):`, error);
        }
    }

    /**
     * Task 요청 처리
     */
    handleTaskRequest(clientId, data) {
        const task = {
            id: this.generateTaskId(),
            title: data.title || '새로운 작업',
            category: data.category || 'general',
            priority: data.priority || 'medium',
            status: 'pending',
            createdAt: new Date().toISOString(),
            requestedBy: clientId,
            details: data
        };

        this.taskQueue.push(task);
        this.stats.tasksCreated++;

        console.log(`📋 새 Task 생성: ${task.title} (${task.id})`);

        this.sendToClient(clientId, {
            type: 'TASK_CREATED',
            data: { task }
        });
    }

    /**
     * 상태 요청 처리
     */
    handleStatusRequest(clientId) {
        const status = {
            isRunning: this.isRunning,
            stats: this.stats,
            taskQueue: this.taskQueue.length,
            connectedClients: this.clients.size,
            uptime: this.stats.startTime ? Date.now() - this.stats.startTime.getTime() : 0
        };

        this.sendToClient(clientId, {
            type: 'STATUS_RESPONSE',
            data: { status }
        });
    }

    /**
     * Ping 처리
     */
    handlePing(clientId) {
        const client = this.clients.get(clientId);
        if (client) {
            client.lastActivity = new Date();
        }

        this.sendToClient(clientId, {
            type: 'PONG',
            data: { timestamp: new Date().toISOString() }
        });
    }

    /**
     * 클라이언트에게 메시지 전송
     */
    sendToClient(clientId, message) {
        const client = this.clients.get(clientId);
        if (client && client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(JSON.stringify(message));
        }
    }

    /**
     * 모든 클라이언트에게 브로드캐스트
     */
    broadcastToClients(message) {
        this.clients.forEach((client, clientId) => {
            this.sendToClient(clientId, message);
        });
    }

    /**
     * 빌드 상태 확인
     */
    async checkBuildStatus() {
        // 빌드 상태 확인 로직
        // 현재는 간단히 파일 존재 여부만 확인
        const distPath = path.join(__dirname, 'frontend', 'dist');
        const distExists = fs.existsSync(distPath);

        if (!distExists) {
            console.log('⚠️ 빌드 결과 없음, 자동 빌드 실행...');
            await this.triggerAutoBuild();
        }
    }

    /**
     * 유틸리티 함수들
     */
    generateClientId() {
        return 'client_' + Math.random().toString(36).substr(2, 9);
    }

    generateTaskId() {
        return 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    }

    /**
     * 시스템 종료
     */
    async stop() {
        console.log('🛑 시스템 종료 중...');

        this.isRunning = false;

        if (this.watcher) {
            await this.watcher.close();
        }

        if (this.wss) {
            this.wss.close();
        }

        console.log('✅ 시스템이 종료되었습니다.');
    }
}

// CLI 실행
if (require.main === module) {
    const integration = new CursorIntegration({
        port: 3001,
        watchPaths: ['frontend/src/**/*', 'server-backend/**/*'],
        ignoredPaths: ['**/node_modules/**', '**/dist/**', '**/coverage/**']
    });

    integration.start().catch(console.error);

    // Graceful shutdown
    process.on('SIGINT', async () => {
        await integration.stop();
        process.exit(0);
    });
}

module.exports = CursorIntegration;
