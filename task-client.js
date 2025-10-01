const WebSocket = require('ws');
const readline = require('readline');

/**
 * Task 통신 클라이언트
 * 실시간 Task 요청 및 상태 모니터링
 */
class TaskClient {
    constructor(serverUrl = 'ws://localhost:3002') {
        this.serverUrl = serverUrl;
        this.ws = null;
        this.clientId = null;
        this.isConnected = false;
        this.pendingTasks = new Map();

        // CLI 인터페이스
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    /**
     * 서버 연결
     */
    connect() {
        return new Promise((resolve, reject) => {
            this.ws = new WebSocket(this.serverUrl);

            this.ws.on('open', () => {
                console.log('🔌 Task 통신 서버에 연결되었습니다');
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
                console.log('🔌 서버 연결이 끊어졌습니다');
                this.isConnected = false;
            });

            this.ws.on('error', (error) => {
                console.error('❌ 연결 오류:', error);
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
                this.clientId = message.clientId;
                console.log(`✅ 연결 확인: ${message.message}`);
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

            case 'status_update':
                this.displayStatus(message);
                break;

            case 'error':
                console.log(`❌ 서버 오류: ${message.message}`);
                break;

            case 'pong':
                console.log('🏓 Pong 수신');
                break;

            default:
                console.log(`📨 알 수 없는 메시지: ${message.type}`);
        }
    }

    /**
     * 상태 표시
     */
    displayStatus(status) {
        console.log('\n📊 서버 상태');
        console.log('============');
        console.log(`🕐 업타임: ${Math.floor(status.uptime / 1000)}초`);
        console.log(`📋 총 요청: ${status.stats.totalRequests}개`);
        console.log(`✅ 처리 완료: ${status.stats.processedRequests}개`);
        console.log(`❌ 처리 실패: ${status.stats.failedRequests}개`);
        console.log(`⏱️  평균 처리 시간: ${Math.round(status.stats.averageProcessingTime)}ms`);
        console.log(`📦 큐 길이: ${status.queueLength}개`);
        console.log(`🔄 처리 중: ${status.isProcessing ? '예' : '아니오'}`);
        console.log(`👥 연결된 클라이언트: ${status.connectedClients}명`);
        console.log('');
    }

    /**
     * Task 요청
     */
    requestTask(content, priority = 'medium', category = 'general') {
        if (!this.isConnected) {
            console.log('❌ 서버에 연결되지 않았습니다');
            return;
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
    }

    /**
     * 상태 요청
     */
    requestStatus() {
        if (!this.isConnected) {
            console.log('❌ 서버에 연결되지 않았습니다');
            return;
        }

        const message = {
            type: 'status_request',
            timestamp: Date.now()
        };

        this.ws.send(JSON.stringify(message));
    }

    /**
     * Ping 전송
     */
    ping() {
        if (!this.isConnected) {
            console.log('❌ 서버에 연결되지 않았습니다');
            return;
        }

        const message = {
            type: 'ping',
            timestamp: Date.now()
        };

        this.ws.send(JSON.stringify(message));
        console.log('🏓 Ping 전송');
    }

    /**
     * 대화형 모드 시작
     */
    startInteractiveMode() {
        console.log('\n🚀 Task 클라이언트 대화형 모드');
        console.log('===============================');
        console.log('명령어:');
        console.log('  task <내용> [우선순위] [카테고리] - Task 요청');
        console.log('  status - 서버 상태 확인');
        console.log('  ping - 서버 연결 확인');
        console.log('  list - 대기 중인 Task 목록');
        console.log('  help - 도움말');
        console.log('  quit - 종료');
        console.log('');

        this.rl.setPrompt('task> ');
        this.rl.prompt();

        this.rl.on('line', (input) => {
            const [command, ...args] = input.trim().split(' ');

            switch (command.toLowerCase()) {
                case 'task':
                    if (args.length === 0) {
                        console.log('❌ Task 내용을 입력해주세요');
                    } else {
                        const content = args.join(' ');
                        const priority = args.includes('urgent') ? 'urgent' :
                            args.includes('high') ? 'high' :
                                args.includes('low') ? 'low' : 'medium';
                        const category = args.includes('test') ? 'testing' :
                            args.includes('bug') ? 'bug-fix' :
                                args.includes('ui') ? 'ui' :
                                    args.includes('api') ? 'api' : 'general';

                        this.requestTask(content, priority, category);
                    }
                    break;

                case 'status':
                    this.requestStatus();
                    break;

                case 'ping':
                    this.ping();
                    break;

                case 'list':
                    this.listPendingTasks();
                    break;

                case 'help':
                    this.showHelp();
                    break;

                case 'quit':
                case 'exit':
                    console.log('👋 클라이언트를 종료합니다');
                    this.disconnect();
                    process.exit(0);
                    break;

                default:
                    console.log('❌ 알 수 없는 명령어입니다. "help"를 입력하세요');
            }

            this.rl.prompt();
        });

        this.rl.on('close', () => {
            console.log('\n👋 클라이언트를 종료합니다');
            this.disconnect();
            process.exit(0);
        });
    }

    /**
     * 대기 중인 Task 목록 표시
     */
    listPendingTasks() {
        if (this.pendingTasks.size === 0) {
            console.log('📋 대기 중인 Task가 없습니다');
            return;
        }

        console.log('\n📋 대기 중인 Task 목록');
        console.log('======================');

        for (const [taskId, task] of this.pendingTasks) {
            const status = task.status === 'created' ? '생성됨' :
                task.status === 'processing' ? '처리 중' :
                    task.status === 'completed' ? '완료' :
                        task.status === 'error' ? '오류' : '알 수 없음';

            console.log(`📋 ${taskId}: ${status}`);
            if (task.queuePosition) {
                console.log(`   큐 위치: ${task.queuePosition}번째`);
            }
            if (task.estimatedWaitTime) {
                console.log(`   예상 대기: ${task.estimatedWaitTime}초`);
            }
            if (task.processingTime) {
                console.log(`   처리 시간: ${task.processingTime}ms`);
            }
            if (task.error) {
                console.log(`   오류: ${task.error}`);
            }
            console.log('');
        }
    }

    /**
     * 도움말 표시
     */
    showHelp() {
        console.log('\n📖 도움말');
        console.log('==========');
        console.log('task <내용> [우선순위] [카테고리]');
        console.log('  - Task를 생성하고 서버에 전송합니다');
        console.log('  - 우선순위: urgent, high, medium, low (기본값: medium)');
        console.log('  - 카테고리: testing, bug-fix, feature, ui, database, api, general (기본값: general)');
        console.log('');
        console.log('status');
        console.log('  - 서버의 현재 상태를 확인합니다');
        console.log('');
        console.log('ping');
        console.log('  - 서버와의 연결을 확인합니다');
        console.log('');
        console.log('list');
        console.log('  - 대기 중인 Task 목록을 표시합니다');
        console.log('');
        console.log('quit/exit');
        console.log('  - 클라이언트를 종료합니다');
        console.log('');
    }

    /**
     * 연결 해제
     */
    disconnect() {
        if (this.ws) {
            this.ws.close();
        }
        if (this.rl) {
            this.rl.close();
        }
    }
}

// CLI 실행
if (require.main === module) {
    const client = new TaskClient();

    client.connect()
        .then(() => {
            client.startInteractiveMode();
        })
        .catch((error) => {
            console.error('❌ 서버 연결 실패:', error);
            process.exit(1);
        });
}

module.exports = TaskClient;
