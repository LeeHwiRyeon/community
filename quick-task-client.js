const WebSocket = require('ws');

/**
 * 빠른 Task 클라이언트
 * 명령행에서 바로 Task 요청 가능
 */
class QuickTaskClient {
    constructor(serverUrl = 'ws://localhost:3002') {
        this.serverUrl = serverUrl;
        this.ws = null;
        this.isConnected = false;
        this.pendingTasks = new Map();
    }

    /**
     * 서버 연결
     */
    async connect() {
        return new Promise((resolve, reject) => {
            this.ws = new WebSocket(this.serverUrl);

            this.ws.on('open', () => {
                this.isConnected = true;
                resolve();
            });

            this.ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data);
                    this.handleMessage(message);
                } catch (error) {
                    console.error('❌ 메시지 파싱 오류:', error);
                }
            });

            this.ws.on('close', () => {
                this.isConnected = false;
            });

            this.ws.on('error', (error) => {
                this.isConnected = false;
                reject(error);
            });
        });
    }

    /**
     * 메시지 처리
     */
    handleMessage(message) {
        switch (message.type) {
            case 'connection':
                console.log(`✅ 서버 연결됨: ${message.message}`);
                break;

            case 'task_created':
                console.log(`📋 Task 생성됨: ${message.taskId}`);
                console.log(`📊 큐 위치: ${message.queuePosition}번째`);
                console.log(`⏱️  예상 대기 시간: ${message.estimatedWaitTime}초`);
                this.pendingTasks.set(message.taskId, {
                    status: 'created',
                    queuePosition: message.queuePosition,
                    estimatedWaitTime: message.estimatedWaitTime
                });
                break;

            case 'task_processing':
                console.log(`⚡ Task 처리 시작: ${message.taskId}`);
                if (this.pendingTasks.has(message.taskId)) {
                    this.pendingTasks.get(message.taskId).status = 'processing';
                }
                break;

            case 'task_completed':
                console.log(`✅ Task 완료: ${message.taskId}`);
                console.log(`⏱️  처리 시간: ${message.processingTime}ms`);
                if (this.pendingTasks.has(message.taskId)) {
                    this.pendingTasks.get(message.taskId).status = 'completed';
                    this.pendingTasks.get(message.taskId).processingTime = message.processingTime;
                }
                break;

            case 'task_error':
                console.log(`❌ Task 처리 실패: ${message.taskId}`);
                console.log(`💬 오류 메시지: ${message.message}`);
                if (this.pendingTasks.has(message.taskId)) {
                    this.pendingTasks.get(message.taskId).status = 'error';
                    this.pendingTasks.get(message.taskId).error = message.message;
                }
                break;

            case 'error':
                console.log(`❌ 서버 오류: ${message.message}`);
                break;
        }
    }

    /**
     * Task 요청
     */
    async requestTask(content, priority = 'medium', category = 'general') {
        if (!this.isConnected) {
            console.log('❌ 서버에 연결되지 않았습니다');
            return false;
        }

        const message = {
            type: 'task_request',
            content,
            priority,
            category,
            timestamp: Date.now()
        };

        this.ws.send(JSON.stringify(message));
        console.log(`📤 Task 요청 전송: ${content.substring(0, 50)}...`);
        return true;
    }

    /**
     * 연결 해제
     */
    disconnect() {
        if (this.ws) {
            this.ws.close();
        }
    }
}

// CLI 실행
if (require.main === module) {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.log('❌ Task 내용을 입력해주세요');
        console.log('사용법: node quick-task-client.js "요청 내용" [우선순위] [카테고리]');
        console.log('예시: node quick-task-client.js "로그인 테스트 케이스 작성" high testing');
        process.exit(1);
    }

    const content = args[0];
    const priority = args[1] || 'medium';
    const category = args[2] || 'general';

    const client = new QuickTaskClient();

    client.connect()
        .then(async () => {
            await client.requestTask(content, priority, category);

            // Task 완료까지 대기
            await new Promise(resolve => {
                const checkInterval = setInterval(() => {
                    const completed = Array.from(client.pendingTasks.values()).filter(t =>
                        t.status === 'completed' || t.status === 'error'
                    ).length;

                    if (completed > 0) {
                        clearInterval(checkInterval);
                        resolve();
                    }
                }, 1000);
            });

            client.disconnect();
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ 클라이언트 실행 실패:', error);
            process.exit(1);
        });
}

module.exports = QuickTaskClient;
