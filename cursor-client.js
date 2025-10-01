const WebSocket = require('ws');
const axios = require('axios');
const readline = require('readline');

/**
 * Cursor 클라이언트
 * Cursor와 통합 시스템 간의 통신을 담당
 */
class CursorClient {
    constructor() {
        this.wsUrl = 'ws://localhost:3001';
        this.apiUrl = 'http://localhost:3000';
        this.ws = null;
        this.isConnected = false;
        this.clientId = `cursor_${Date.now()}`;
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    /**
     * 연결 시작
     */
    async start() {
        console.log('🚀 Cursor 클라이언트 시작');
        console.log('=====================================');

        await this.connectWebSocket();
        await this.registerWithServer();

        this.setupCommandInterface();
    }

    /**
     * WebSocket 연결
     */
    async connectWebSocket() {
        return new Promise((resolve, reject) => {
            this.ws = new WebSocket(this.wsUrl);

            this.ws.on('open', () => {
                console.log('🔌 WebSocket 연결됨');
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
                console.log('🔌 WebSocket 연결 해제됨');
                this.isConnected = false;
            });

            this.ws.on('error', (error) => {
                console.error('❌ WebSocket 오류:', error);
                reject(error);
            });
        });
    }

    /**
     * 서버에 클라이언트 등록
     */
    async registerWithServer() {
        try {
            const response = await axios.post(`${this.apiUrl}/api/cursor/register`, {
                clientId: this.clientId,
                clientType: 'cursor'
            });
            console.log('📱 서버에 등록됨:', response.data.message);
        } catch (error) {
            console.error('❌ 서버 등록 실패:', error.message);
        }
    }

    /**
     * 메시지 처리
     */
    handleMessage(message) {
        console.log('📨 WebSocket 메시지 수신:', JSON.stringify(message, null, 2));

        const { type, payload } = message;

        switch (type) {
            case 'connection_established':
                console.log('✅ 서버 연결 확인됨');
                break;

            case 'workflow_created':
                console.log('\n🎉 새로운 워크플로우 생성됨!');
                if (payload && payload.workflow) {
                    console.log(`📋 제목: ${payload.workflow.title}`);
                    console.log(`🎯 우선순위: ${payload.workflow.priority}`);
                    console.log(`📂 카테고리: ${payload.workflow.category}`);
                    console.log(`📝 작업 수: ${payload.tasks ? payload.tasks.length : 0}개`);
                    console.log(`📋 TODO 수: ${payload.todos ? payload.todos.length : 0}개`);
                } else if (message.workflow) {
                    // 직접 워크플로우 정보가 있는 경우
                    console.log(`📋 제목: ${message.workflow.title}`);
                    console.log(`🎯 우선순위: ${message.workflow.priority}`);
                    console.log(`📂 카테고리: ${message.workflow.category}`);
                    console.log(`📝 작업 수: ${message.tasks ? message.tasks.length : 0}개`);
                    console.log(`📋 TODO 수: ${message.todos ? message.todos.length : 0}개`);
                } else {
                    console.log('📋 워크플로우 정보:', payload || message);
                }
                break;

            case 'task_updated':
                if (payload && payload.taskId) {
                    console.log(`\n✅ 작업 업데이트: ${payload.taskId} -> ${payload.status}`);
                } else if (message.taskId) {
                    console.log(`\n✅ 작업 업데이트: ${message.taskId} -> ${message.status}`);
                } else {
                    console.log(`\n✅ 작업 업데이트:`, payload || message);
                }
                break;

            case 'status_update':
                console.log('\n📊 상태 업데이트:');
                if (payload && payload.stats) {
                    console.log(`  📋 총 워크플로우: ${payload.stats.totalWorkflows}개`);
                    console.log(`  🔄 활성: ${payload.stats.activeWorkflows}개`);
                    console.log(`  ✅ 완료: ${payload.stats.completedWorkflows}개`);
                    console.log(`  📈 평균 진행률: ${payload.stats.averageProgress.toFixed(1)}%`);
                } else {
                    console.log('📊 상태 정보:', payload);
                }
                break;

            case 'error':
                console.error(`❌ 오류: ${payload ? payload.message : '알 수 없는 오류'}`);
                break;

            default:
                console.log(`📨 알 수 없는 메시지: ${type}`);
                console.log('📨 전체 메시지:', message);
        }
    }

    /**
     * 명령어 인터페이스 설정
     */
    setupCommandInterface() {
        console.log('\n💬 Cursor 통합 시스템 준비 완료!');
        console.log('=====================================');
        console.log('📋 사용 가능한 명령어:');
        console.log('  - "workflow [메시지]" : 워크플로우 생성');
        console.log('  - "status" : 상태 확인');
        console.log('  - "list" : 워크플로우 목록');
        console.log('  - "ping" : 연결 테스트');
        console.log('  - "quit" : 종료');
        console.log('=====================================\n');

        this.rl.setPrompt('💬 Cursor> ');
        this.rl.prompt();

        this.rl.on('line', async (input) => {
            const command = input.trim();
            await this.handleCommand(command);
            this.rl.prompt();
        });

        this.rl.on('close', () => {
            console.log('\n👋 Cursor 클라이언트를 종료합니다.');
            if (this.ws) {
                this.ws.close();
            }
        });
    }

    /**
     * 명령어 처리
     */
    async handleCommand(command) {
        if (!command) return;

        const [cmd, ...args] = command.split(' ');

        switch (cmd) {
            case 'workflow':
                if (args.length === 0) {
                    console.log('❌ 워크플로우 메시지를 입력해주세요.');
                    return;
                }
                console.log(`🎯 워크플로우 생성 요청: ${args.join(' ')}`);
                await this.createWorkflow(args.join(' '));
                break;

            case 'status':
                console.log('📊 상태 확인 중...');
                await this.getStatus();
                break;

            case 'list':
                console.log('📋 워크플로우 목록 조회 중...');
                await this.getWorkflows();
                break;

            case 'ping':
                console.log('🏓 연결 테스트 중...');
                await this.ping();
                break;

            case 'quit':
                console.log('👋 종료합니다.');
                this.rl.close();
                break;

            default:
                console.log('❌ 알 수 없는 명령어입니다. 사용 가능한 명령어: workflow, status, list, ping, quit');
        }
    }

    /**
     * 워크플로우 생성
     */
    async createWorkflow(message) {
        try {
            console.log(`🎯 워크플로우 생성 요청: ${message}`);
            console.log(`📡 API URL: ${this.apiUrl}/api/cursor/request`);

            const requestData = {
                message: message,
                type: 'workflow',
                metadata: {
                    source: 'cursor',
                    timestamp: new Date().toISOString()
                }
            };

            console.log('📤 요청 데이터:', JSON.stringify(requestData, null, 2));

            const response = await axios.post(`${this.apiUrl}/api/cursor/request`, requestData);

            console.log('📥 응답 상태:', response.status);
            console.log('📥 응답 데이터:', JSON.stringify(response.data, null, 2));

            if (response.data.success) {
                console.log('✅ 워크플로우가 성공적으로 생성되었습니다.');
                console.log(`📋 워크플로우 ID: ${response.data.workflow.id}`);
                console.log(`📝 생성된 작업 수: ${response.data.tasks.length}개`);
                console.log(`📋 생성된 TODO 수: ${response.data.todos.length}개`);
            } else {
                console.error('❌ 워크플로우 생성 실패:', response.data.error);
            }
        } catch (error) {
            console.error('❌ 워크플로우 생성 오류:', error.message);
            if (error.response) {
                console.error('❌ 응답 오류:', error.response.status, error.response.data);
            }
            if (error.request) {
                console.error('❌ 요청 오류:', error.request);
            }
        }
    }

    /**
     * 상태 확인
     */
    async getStatus() {
        try {
            const response = await axios.get(`${this.apiUrl}/api/cursor/stats`);

            if (response.data.success) {
                const stats = response.data.stats;
                console.log('\n📊 현재 상태:');
                console.log(`  📋 총 워크플로우: ${stats.totalWorkflows}개`);
                console.log(`  🔄 활성 워크플로우: ${stats.activeWorkflows}개`);
                console.log(`  ✅ 완료된 워크플로우: ${stats.completedWorkflows}개`);
                console.log(`  📝 총 작업: ${stats.totalTasks}개`);
                console.log(`  ✅ 완료된 작업: ${stats.completedTasks}개`);
                console.log(`  📋 총 TODO: ${stats.totalTodos}개`);
                console.log(`  ✅ 완료된 TODO: ${stats.completedTodos}개`);
                console.log(`  📈 평균 진행률: ${stats.averageProgress.toFixed(1)}%`);
            }
        } catch (error) {
            console.error('❌ 상태 조회 오류:', error.message);
        }
    }

    /**
     * 워크플로우 목록 조회
     */
    async getWorkflows() {
        try {
            const response = await axios.get(`${this.apiUrl}/api/cursor/workflows`);

            if (response.data.success) {
                const workflows = response.data.workflows;
                console.log('\n📋 워크플로우 목록:');

                workflows.forEach((workflow, index) => {
                    const completedTasks = workflow.tasks.filter(task => task.status === 'completed').length;
                    const totalTasks = workflow.tasks.length;
                    const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

                    console.log(`  ${index + 1}. ${workflow.title || '제목 없음'}`);
                    console.log(`     ID: ${workflow.id}`);
                    console.log(`     상태: ${workflow.status} (${progress.toFixed(1)}%)`);
                    console.log(`     우선순위: ${workflow.priority}`);
                    console.log(`     카테고리: ${workflow.category}`);
                    console.log(`     생성일: ${new Date(workflow.createdAt).toLocaleString()}`);
                    console.log('');
                });
            }
        } catch (error) {
            console.error('❌ 워크플로우 목록 조회 오류:', error.message);
        }
    }

    /**
     * 연결 테스트
     */
    async ping() {
        if (this.isConnected) {
            this.ws.send(JSON.stringify({ type: 'ping' }));
            console.log('🏓 Ping 전송됨');
        } else {
            console.log('❌ WebSocket 연결이 없습니다.');
        }
    }
}

// 클라이언트 시작
if (require.main === module) {
    const client = new CursorClient();
    client.start().catch(console.error);
}

module.exports = CursorClient;
