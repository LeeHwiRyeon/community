const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');

/**
 * 고성능 Task 통신 서버
 * 실시간 프로세스간 통신 및 즉시 Task 처리
 */
class TaskCommunicationServer extends EventEmitter {
    constructor(port = 3002) {
        super();
        this.port = port;
        this.wss = null;
        this.clients = new Map();
        this.taskQueue = [];
        this.isProcessing = false;
        this.taskFile = 'work-results/owner-tasks.json';
        this.todoFile = 'work-results/owner-todos.md';
        this.documentFile = 'work-results/owner-requests.md';

        // 통계
        this.stats = {
            totalRequests: 0,
            processedRequests: 0,
            failedRequests: 0,
            averageProcessingTime: 0,
            startTime: Date.now()
        };
    }

    /**
     * 서버 시작
     */
    start() {
        this.wss = new WebSocket.Server({ port: this.port });

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
                message: 'Task 통신 서버에 연결되었습니다',
                clientId,
                serverTime: new Date().toISOString()
            });

            ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data);
                    this.handleMessage(clientId, message);
                } catch (error) {
                    console.error('❌ 메시지 파싱 오류:', error);
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

        // Task 처리 루프 시작
        this.startTaskProcessingLoop();

        // 주기적 상태 업데이트
        this.startStatusUpdateLoop();

        console.log(`🚀 Task 통신 서버 시작됨: 포트 ${this.port}`);
        console.log(`📡 WebSocket: ws://localhost:${this.port}`);
        console.log(`⚡ 실시간 Task 처리 활성화`);
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

            // Task 생성
            const task = await this.createTask(content, priority, category);

            // 큐에 추가
            this.taskQueue.push({
                task,
                clientId,
                requestTime: startTime,
                priority: this.getPriorityValue(priority)
            });

            // 우선순위별 정렬
            this.taskQueue.sort((a, b) => b.priority - a.priority);

            // 즉시 처리 시작
            this.processNextTask();

            // 클라이언트에게 즉시 응답
            this.sendToClient(clientId, {
                type: 'task_created',
                taskId: task.id,
                message: 'Task가 생성되어 큐에 추가되었습니다',
                queuePosition: this.taskQueue.length,
                estimatedWaitTime: this.estimateWaitTime()
            });

        } catch (error) {
            console.error('❌ Task 요청 처리 오류:', error);
            this.stats.failedRequests++;

            this.sendToClient(clientId, {
                type: 'error',
                message: `Task 생성 실패: ${error.message}`
            });
        }
    }

    /**
     * Task 생성
     */
    async createTask(content, priority, category) {
        const taskId = this.generateTaskId();
        const timestamp = new Date().toISOString();

        const task = {
            id: taskId,
            title: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
            description: content,
            category: this.analyzeCategory(content, category),
            priority: this.analyzePriority(content, priority),
            estimatedTime: this.estimateTime(content),
            status: 'pending',
            createdAt: timestamp,
            owner: '오너',
            assignedTo: '매니저',
            tags: this.extractTags(content),
            dependencies: [],
            subtasks: this.generateSubtasks(content),
            duplicates: []
        };

        // 파일에 저장
        await this.saveTaskToFile(task);
        await this.createTodo(task);
        await this.createDocument(task);

        return task;
    }

    /**
     * Task 처리 루프
     */
    startTaskProcessingLoop() {
        setInterval(() => {
            if (!this.isProcessing && this.taskQueue.length > 0) {
                this.processNextTask();
            }
        }, 100); // 100ms마다 체크
    }

    /**
     * 다음 Task 처리
     */
    async processNextTask() {
        if (this.isProcessing || this.taskQueue.length === 0) return;

        this.isProcessing = true;
        const startTime = Date.now();

        try {
            const { task, clientId } = this.taskQueue.shift();

            console.log(`⚡ Task 처리 시작: ${task.id}`);

            // Task 상태 업데이트
            task.status = 'in_progress';
            task.startedAt = new Date().toISOString();

            // 파일 업데이트
            await this.updateTaskInFile(task);

            // 클라이언트에게 처리 시작 알림
            this.sendToClient(clientId, {
                type: 'task_processing',
                taskId: task.id,
                message: 'Task 처리가 시작되었습니다'
            });

            // 실제 작업 시뮬레이션 (비동기)
            setTimeout(async () => {
                try {
                    // Task 완료 처리
                    task.status = 'completed';
                    task.completedAt = new Date().toISOString();
                    task.processingTime = Date.now() - startTime;

                    await this.updateTaskInFile(task);

                    this.stats.processedRequests++;
                    this.updateAverageProcessingTime(Date.now() - startTime);

                    console.log(`✅ Task 완료: ${task.id} (${task.processingTime}ms)`);

                    // 클라이언트에게 완료 알림
                    this.sendToClient(clientId, {
                        type: 'task_completed',
                        taskId: task.id,
                        message: 'Task 처리가 완료되었습니다',
                        processingTime: task.processingTime,
                        result: {
                            status: task.status,
                            completedAt: task.completedAt
                        }
                    });

                } catch (error) {
                    console.error('❌ Task 처리 중 오류:', error);
                    this.stats.failedRequests++;

                    this.sendToClient(clientId, {
                        type: 'task_error',
                        taskId: task.id,
                        message: `Task 처리 실패: ${error.message}`
                    });
                } finally {
                    this.isProcessing = false;
                }
            }, Math.random() * 2000 + 500); // 0.5-2.5초 랜덤 처리 시간

        } catch (error) {
            console.error('❌ Task 처리 루프 오류:', error);
            this.isProcessing = false;
        }
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
     * 상태 브로드캐스트
     */
    broadcastStatus() {
        const status = {
            type: 'status_update',
            timestamp: Date.now(),
            stats: this.stats,
            queueLength: this.taskQueue.length,
            isProcessing: this.isProcessing,
            connectedClients: this.clients.size,
            uptime: Date.now() - this.stats.startTime
        };

        this.broadcast(status);
    }

    /**
     * 상태 전송
     */
    sendStatus(clientId) {
        const status = {
            type: 'status',
            timestamp: Date.now(),
            stats: this.stats,
            queueLength: this.taskQueue.length,
            isProcessing: this.isProcessing,
            connectedClients: this.clients.size,
            uptime: Date.now() - this.stats.startTime
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
     * 모든 클라이언트에게 브로드캐스트
     */
    broadcast(message) {
        for (const [clientId, client] of this.clients) {
            this.sendToClient(clientId, message);
        }
    }

    /**
     * 파일 저장 및 업데이트 메서드들
     */
    async saveTaskToFile(task) {
        try {
            let taskData = { tasks: [], lastUpdated: new Date().toISOString(), totalCount: 0 };

            if (fs.existsSync(this.taskFile)) {
                const content = fs.readFileSync(this.taskFile, 'utf8');
                const cleanContent = content.replace(/^\uFEFF/, '');
                taskData = JSON.parse(cleanContent);
            }

            taskData.tasks.push(task);
            taskData.totalCount = taskData.tasks.length;
            taskData.lastUpdated = new Date().toISOString();

            fs.writeFileSync(this.taskFile, JSON.stringify(taskData, null, 2), 'utf8');
        } catch (error) {
            console.error('❌ Task 파일 저장 오류:', error);
        }
    }

    async updateTaskInFile(task) {
        try {
            if (fs.existsSync(this.taskFile)) {
                const content = fs.readFileSync(this.taskFile, 'utf8');
                const cleanContent = content.replace(/^\uFEFF/, '');
                const taskData = JSON.parse(cleanContent);

                const taskIndex = taskData.tasks.findIndex(t => t.id === task.id);
                if (taskIndex !== -1) {
                    taskData.tasks[taskIndex] = task;
                    taskData.lastUpdated = new Date().toISOString();

                    fs.writeFileSync(this.taskFile, JSON.stringify(taskData, null, 2), 'utf8');
                }
            }
        } catch (error) {
            console.error('❌ Task 파일 업데이트 오류:', error);
        }
    }

    async createTodo(task) {
        const timestamp = new Date().toLocaleString('ko-KR');
        const todoEntry = `
## ${task.category} - ${task.id}
- **우선순위**: ${task.priority}
- **예상 시간**: ${task.estimatedTime}
- **수신 시간**: ${timestamp}

### 작업 내용
${task.description}

### 진행 상황
- [x] 요청 분석 완료
- [x] Task 생성 완료
- [ ] 작업 계획 수립
- [ ] 실행 중
- [ ] 완료

### 하위 작업
${task.subtasks.map(subtask => `- [ ] ${subtask}`).join('\n')}

---

`;

        if (!fs.existsSync(this.todoFile)) {
            const bom = '\uFEFF';
            fs.writeFileSync(this.todoFile, bom + '# 오너 요청 TODO 목록\n\n> **생성일**: ' + new Date().toLocaleString('ko-KR') + '\n> **상태**: 활성\n\n## 📋 대기 중인 작업들\n\n', 'utf8');
        }

        fs.appendFileSync(this.todoFile, todoEntry, 'utf8');
    }

    async createDocument(task) {
        const timestamp = new Date().toLocaleString('ko-KR');
        const docEntry = `
### 요청 #${task.id}
- **수신 시간**: ${timestamp}
- **우선순위**: ${task.priority}
- **카테고리**: ${task.category}
- **예상 시간**: ${task.estimatedTime}
- **상태**: ${task.status}

**내용**:
${task.description}

**하위 작업**:
${task.subtasks.map(subtask => `- ${subtask}`).join('\n')}

---

`;

        if (!fs.existsSync(this.documentFile)) {
            const bom = '\uFEFF';
            fs.writeFileSync(this.documentFile, bom + '# 오너 요청 처리 내역\n\n', 'utf8');
        }

        fs.appendFileSync(this.documentFile, docEntry, 'utf8');
    }

    /**
     * 분석 및 유틸리티 메서드들
     */
    analyzePriority(content, defaultPriority) {
        const urgentKeywords = ['긴급', '즉시', '빨리', 'ASAP', 'urgent'];
        const highKeywords = ['중요', '우선', '먼저', 'priority'];

        const lowerContent = content.toLowerCase();

        if (urgentKeywords.some(keyword => lowerContent.includes(keyword))) {
            return 'urgent';
        } else if (highKeywords.some(keyword => lowerContent.includes(keyword))) {
            return 'high';
        } else {
            return defaultPriority;
        }
    }

    analyzeCategory(content, defaultCategory) {
        const categories = {
            'testing': ['테스트', '검증', 'test', 'verify', '케이스', 'case'],
            'bug-fix': ['버그', '오류', '에러', '수정', 'bug', 'error', 'fix'],
            'feature': ['기능', '추가', '새로운', '개발', 'feature', 'new'],
            'ui': ['UI', '인터페이스', '화면', '디자인', '버튼', '메뉴'],
            'database': ['데이터베이스', 'DB', '테이블', '쿼리'],
            'api': ['API', '엔드포인트', '서버', '통신']
        };

        const lowerContent = content.toLowerCase();

        for (const [category, keywords] of Object.entries(categories)) {
            if (keywords.some(keyword => lowerContent.includes(keyword))) {
                return category;
            }
        }

        return defaultCategory;
    }

    estimateTime(content) {
        const length = content.length;
        if (length < 50) return '1-2시간';
        if (length < 100) return '2-4시간';
        return '4-8시간';
    }

    extractTags(content) {
        const tags = [];
        const tagPatterns = [/#(\w+)/g, /@(\w+)/g, /\[(\w+)\]/g];

        tagPatterns.forEach(pattern => {
            const matches = content.match(pattern);
            if (matches) {
                tags.push(...matches.map(match => match.replace(/[#@\[\]]/g, '')));
            }
        });

        return [...new Set(tags)];
    }

    generateSubtasks(content) {
        const subtasks = [];

        if (content.includes('테스트') || content.includes('케이스')) {
            subtasks.push('테스트 케이스 작성', '테스트 실행', '결과 검증');
        } else if (content.includes('개발') || content.includes('코딩')) {
            subtasks.push('코드 작성', '테스트', '리뷰');
        } else if (content.includes('문서')) {
            subtasks.push('문서 작성', '검토');
        } else if (content.includes('배포')) {
            subtasks.push('빌드', '배포', '검증');
        } else {
            subtasks.push('분석', '계획', '실행', '검증');
        }

        return subtasks;
    }

    getPriorityValue(priority) {
        const priorityMap = {
            'urgent': 4,
            'high': 3,
            'medium': 2,
            'low': 1
        };
        return priorityMap[priority] || 2;
    }

    estimateWaitTime() {
        const avgProcessingTime = this.stats.averageProcessingTime || 1000;
        return Math.ceil((this.taskQueue.length * avgProcessingTime) / 1000);
    }

    updateAverageProcessingTime(processingTime) {
        if (this.stats.processedRequests === 0) {
            this.stats.averageProcessingTime = processingTime;
        } else {
            this.stats.averageProcessingTime =
                (this.stats.averageProcessingTime * (this.stats.processedRequests - 1) + processingTime) / this.stats.processedRequests;
        }
    }

    generateClientId() {
        return 'client_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    }

    generateTaskId() {
        return 'TASK_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    }

    /**
     * 서버 종료
     */
    stop() {
        if (this.wss) {
            this.wss.close();
            console.log('🛑 Task 통신 서버 종료됨');
        }
    }
}

// CLI 실행
if (require.main === module) {
    const server = new TaskCommunicationServer(3002);

    // Graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n🛑 서버 종료 중...');
        server.stop();
        process.exit(0);
    });

    server.start();
}

module.exports = TaskCommunicationServer;
