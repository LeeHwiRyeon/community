const axios = require('axios');
const readline = require('readline');

/**
 * 터미널 대시보드
 * 실시간 진행상황과 명령어를 보여주는 터미널 인터페이스
 */
class TerminalDashboard {
    constructor() {
        this.apiUrl = 'http://localhost:3000';
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        this.isRunning = false;
        this.refreshInterval = null;
    }

    async start() {
        console.clear();
        this.showHeader();
        this.setupCommandInterface();
        this.startRealTimeUpdates();
    }

    showHeader() {
        console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
        console.log('║                           🚀 CURSOR AUTO DASHBOARD                          ║');
        console.log('║                        실시간 워크플로우 관리 시스템                          ║');
        console.log('╚══════════════════════════════════════════════════════════════════════════════╝');
        console.log('');
    }

    async updateDashboard() {
        try {
            // 커서 위치 저장
            const cursor = this.rl.getCursorPos();

            // 대시보드 영역으로 이동
            process.stdout.write('\x1b[4;1H'); // 4번째 줄로 이동

            // 기존 대시보드 내용 지우기
            process.stdout.write('\x1b[0J');

            // 현재 상태 가져오기
            const [healthRes, statsRes, workflowsRes] = await Promise.all([
                axios.get(`${this.apiUrl}/health`),
                axios.get(`${this.apiUrl}/api/cursor/stats`),
                axios.get(`${this.apiUrl}/api/cursor/workflows`)
            ]);

            const health = healthRes.data;
            const stats = statsRes.data.stats;
            const workflows = workflowsRes.data.workflows;

            // 실시간 상태 표시
            console.log('┌─────────────────────────────────────────────────────────────────────────────┐');
            console.log('│ 📊 실시간 상태                                                              │');
            console.log('├─────────────────────────────────────────────────────────────────────────────┤');
            console.log(`│ 🟢 서버 상태: ${health.status.padEnd(10)} │ 📋 총 워크플로우: ${stats.totalWorkflows.toString().padEnd(3)}개 │ 🔄 활성: ${stats.activeWorkflows.toString().padEnd(3)}개 │`);
            console.log(`│ 📝 총 작업: ${stats.totalTasks.toString().padEnd(4)}개 │ ✅ 완료: ${stats.completedTasks.toString().padEnd(3)}개 │ 📈 진행률: ${stats.averageProgress.toFixed(1).padEnd(5)}% │`);
            console.log('├─────────────────────────────────────────────────────────────────────────────┤');
            console.log('│ 🔥 최근 워크플로우 (최대 5개)                                                │');
            console.log('├─────────────────────────────────────────────────────────────────────────────┤');

            // 최근 워크플로우 표시
            const recentWorkflows = workflows.slice(-5).reverse();
            recentWorkflows.forEach((workflow, index) => {
                const completedTasks = workflow.tasks ? workflow.tasks.filter(task => task.status === 'completed').length : 0;
                const totalTasks = workflow.tasks ? workflow.tasks.length : 0;
                const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

                const priorityIcon = workflow.priority === 'urgent' ? '🔴' :
                    workflow.priority === 'high' ? '🟠' :
                        workflow.priority === 'medium' ? '🟡' : '🟢';

                const categoryIcon = workflow.category === 'bug-fix' ? '🐛' :
                    workflow.category === 'development' ? '💻' :
                        workflow.category === 'design' ? '🎨' : '📝';

                const title = workflow.title ? workflow.title.substring(0, 40) : '제목 없음';
                const status = workflow.status === 'active' ? '🔄' :
                    workflow.status === 'completed' ? '✅' : '⏸️';

                console.log(`│ ${index + 1}. ${priorityIcon}${categoryIcon} ${status} ${title.padEnd(40)} │`);
                console.log(`│    📅 ${new Date(workflow.createdAt).toLocaleString().padEnd(20)} │ 📈 ${progress.toFixed(1).padEnd(5)}% │ 🎯 ${workflow.priority.padEnd(8)} │ 📂 ${workflow.category.padEnd(10)} │`);
                if (index < recentWorkflows.length - 1) {
                    console.log('│    ─────────────────────────────────────────────────────────────────────────────── │');
                }
            });

            console.log('└─────────────────────────────────────────────────────────────────────────────┘');

            // 커서 위치 복원
            process.stdout.write(`\x1b[${cursor.rows};${cursor.cols}H`);

        } catch (error) {
            console.log('❌ 대시보드 업데이트 오류:', error.message);
        }
    }

    setupCommandInterface() {
        console.log('');
        console.log('💬 사용 가능한 명령어:');
        console.log('  workflow [메시지] - 새 워크플로우 생성');
        console.log('  status           - 상세 상태 확인');
        console.log('  list             - 모든 워크플로우 목록');
        console.log('  complete [ID]    - 작업 완료 처리');
        console.log('  refresh          - 대시보드 새로고침');
        console.log('  help             - 도움말');
        console.log('  quit             - 종료');
        console.log('');
        console.log('─────────────────────────────────────────────────────────────────────────────');
        console.log('');

        this.rl.setPrompt('🚀 Cursor> ');
        this.rl.prompt();

        this.rl.on('line', async (input) => {
            const command = input.trim();
            await this.handleCommand(command);
            this.rl.prompt();
        });

        this.rl.on('close', () => {
            console.log('\n👋 터미널 대시보드를 종료합니다.');
            if (this.refreshInterval) {
                clearInterval(this.refreshInterval);
            }
        });
    }

    async handleCommand(command) {
        if (!command) return;

        const [cmd, ...args] = command.split(' ');

        switch (cmd) {
            case 'workflow':
                if (args.length === 0) {
                    console.log('❌ 워크플로우 메시지를 입력해주세요.');
                    return;
                }
                await this.createWorkflow(args.join(' '));
                break;

            case 'status':
                await this.showDetailedStatus();
                break;

            case 'list':
                await this.showAllWorkflows();
                break;

            case 'complete':
                if (args.length === 0) {
                    console.log('❌ 완료할 작업 ID를 입력해주세요.');
                    return;
                }
                await this.completeTask(args[0]);
                break;

            case 'refresh':
                await this.updateDashboard();
                break;

            case 'help':
                this.showHelp();
                break;

            case 'quit':
                this.rl.close();
                break;

            default:
                console.log('❌ 알 수 없는 명령어입니다. "help"를 입력하여 도움말을 확인하세요.');
        }
    }

    async createWorkflow(message) {
        try {
            console.log(`🎯 워크플로우 생성 중: ${message}`);

            const response = await axios.post(`${this.apiUrl}/api/cursor/request`, {
                message: message,
                type: 'workflow',
                metadata: {
                    source: 'terminal',
                    timestamp: new Date().toISOString()
                }
            });

            if (response.data.success) {
                const workflow = response.data.workflow;
                const tasks = response.data.tasks;
                const todos = response.data.todos;

                console.log('✅ 워크플로우 생성 완료!');
                console.log(`📋 ID: ${workflow.id}`);
                console.log(`🎯 우선순위: ${workflow.priority}`);
                console.log(`📂 카테고리: ${workflow.category}`);
                console.log(`📝 작업 수: ${tasks.length}개`);
                console.log(`📋 TODO 수: ${todos.length}개`);

                // 대시보드 새로고침
                setTimeout(() => this.updateDashboard(), 1000);
            } else {
                console.log('❌ 워크플로우 생성 실패:', response.data.error);
            }
        } catch (error) {
            console.log('❌ 워크플로우 생성 오류:', error.message);
        }
    }

    async showDetailedStatus() {
        try {
            const [healthRes, statsRes] = await Promise.all([
                axios.get(`${this.apiUrl}/health`),
                axios.get(`${this.apiUrl}/api/cursor/stats`)
            ]);

            const health = healthRes.data;
            const stats = statsRes.data.stats;

            console.log('\n📊 상세 상태 정보');
            console.log('═══════════════════════════════════════════════════════════════════════════════');
            console.log(`🟢 서버 상태: ${health.status}`);
            console.log(`⏰ 마지막 업데이트: ${health.timestamp}`);
            console.log(`🔌 Cursor 클라이언트: ${health.cursorClients}개 연결됨`);
            console.log(`🔄 처리 중: ${health.isProcessing ? '예' : '아니오'}`);
            console.log('');
            console.log('📈 워크플로우 통계:');
            console.log(`  📋 총 워크플로우: ${stats.totalWorkflows}개`);
            console.log(`  🔄 활성 워크플로우: ${stats.activeWorkflows}개`);
            console.log(`  ✅ 완료된 워크플로우: ${stats.completedWorkflows}개`);
            console.log(`  📝 총 작업: ${stats.totalTasks}개`);
            console.log(`  ✅ 완료된 작업: ${stats.completedTasks}개`);
            console.log(`  📋 총 TODO: ${stats.totalTodos}개`);
            console.log(`  ✅ 완료된 TODO: ${stats.completedTodos}개`);
            console.log(`  📈 평균 진행률: ${stats.averageProgress.toFixed(1)}%`);
            console.log(`  💬 총 대화 수: ${stats.totalConversations}개`);
            console.log('');

        } catch (error) {
            console.log('❌ 상태 조회 오류:', error.message);
        }
    }

    async showAllWorkflows() {
        try {
            const response = await axios.get(`${this.apiUrl}/api/cursor/workflows`);

            if (response.data.success) {
                const workflows = response.data.workflows;
                console.log(`\n📋 모든 워크플로우 (총 ${workflows.length}개)`);
                console.log('═══════════════════════════════════════════════════════════════════════════════');

                workflows.forEach((workflow, index) => {
                    const completedTasks = workflow.tasks ? workflow.tasks.filter(task => task.status === 'completed').length : 0;
                    const totalTasks = workflow.tasks ? workflow.tasks.length : 0;
                    const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

                    const priorityIcon = workflow.priority === 'urgent' ? '🔴' :
                        workflow.priority === 'high' ? '🟠' :
                            workflow.priority === 'medium' ? '🟡' : '🟢';

                    const categoryIcon = workflow.category === 'bug-fix' ? '🐛' :
                        workflow.category === 'development' ? '💻' :
                            workflow.category === 'design' ? '🎨' : '📝';

                    const status = workflow.status === 'active' ? '🔄' :
                        workflow.status === 'completed' ? '✅' : '⏸️';

                    console.log(`${index + 1}. ${priorityIcon}${categoryIcon} ${status} ${workflow.title || '제목 없음'}`);
                    console.log(`   📅 ${new Date(workflow.createdAt).toLocaleString()}`);
                    console.log(`   🎯 ${workflow.priority} | 📂 ${workflow.category} | 📈 ${progress.toFixed(1)}%`);
                    console.log(`   📝 작업: ${completedTasks}/${totalTasks}개 완료`);
                    console.log('');
                });
            }
        } catch (error) {
            console.log('❌ 워크플로우 목록 조회 오류:', error.message);
        }
    }

    async completeTask(taskId) {
        try {
            // 먼저 워크플로우 목록을 가져와서 작업이 있는 워크플로우 찾기
            const workflowsResponse = await axios.get(`${this.apiUrl}/api/cursor/workflows`);

            if (workflowsResponse.data.success) {
                const workflows = workflowsResponse.data.workflows;
                let foundWorkflow = null;
                let foundTask = null;

                for (const workflow of workflows) {
                    if (workflow.tasks) {
                        const task = workflow.tasks.find(t => t.id === taskId);
                        if (task) {
                            foundWorkflow = workflow;
                            foundTask = task;
                            break;
                        }
                    }
                }

                if (foundWorkflow && foundTask) {
                    const response = await axios.put(`${this.apiUrl}/api/cursor/task/${taskId}`, {
                        status: 'completed',
                        workflowId: foundWorkflow.id
                    });

                    if (response.data.success) {
                        console.log(`✅ 작업 완료 처리됨: ${foundTask.title}`);
                        console.log(`📋 워크플로우: ${foundWorkflow.title}`);

                        // 대시보드 새로고침
                        setTimeout(() => this.updateDashboard(), 1000);
                    } else {
                        console.log('❌ 작업 완료 처리 실패:', response.data.error);
                    }
                } else {
                    console.log(`❌ 작업 ID를 찾을 수 없습니다: ${taskId}`);
                }
            }
        } catch (error) {
            console.log('❌ 작업 완료 처리 오류:', error.message);
        }
    }

    showHelp() {
        console.log('\n📖 도움말');
        console.log('═══════════════════════════════════════════════════════════════════════════════');
        console.log('workflow [메시지]  - 새로운 워크플로우를 생성합니다');
        console.log('status             - 서버 상태와 상세 통계를 보여줍니다');
        console.log('list               - 모든 워크플로우 목록을 보여줍니다');
        console.log('complete [ID]      - 특정 작업을 완료 처리합니다');
        console.log('refresh            - 대시보드를 즉시 새로고침합니다');
        console.log('help               - 이 도움말을 보여줍니다');
        console.log('quit               - 터미널 대시보드를 종료합니다');
        console.log('');
        console.log('💡 팁: 대시보드는 5초마다 자동으로 업데이트됩니다.');
        console.log('');
    }

    startRealTimeUpdates() {
        this.isRunning = true;
        this.refreshInterval = setInterval(() => {
            if (this.isRunning) {
                this.updateDashboard();
            }
        }, 5000); // 5초마다 업데이트
    }
}

// 대시보드 시작
if (require.main === module) {
    const dashboard = new TerminalDashboard();
    dashboard.start().catch(console.error);
}

module.exports = TerminalDashboard;
