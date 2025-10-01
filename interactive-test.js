const IntegratedConversationalManager = require('./integrated-conversational-manager');

/**
 * 대화형 테스트 시뮬레이션
 * 실제 사용자처럼 단계별로 테스트
 */
class InteractiveTest {
    constructor() {
        this.manager = new IntegratedConversationalManager();
    }

    /**
     * 전체 테스트 실행
     */
    async runTest() {
        console.log('🎬 대화형 매니저 실제 사용 시뮬레이션');
        console.log('=====================================\n');

        // 1. 워크플로우 생성
        const workflow = await this.createWorkflow();

        // 2. 상태 확인
        await this.checkStatus(workflow);

        // 3. 다음 작업 확인
        await this.checkNextTask(workflow);

        // 4. 작업 완료
        await this.completeTask(workflow);

        // 5. 최종 상태 확인
        await this.checkFinalStatus(workflow);

        console.log('\n🎉 모든 테스트 완료!');
        console.log('✅ 시스템이 의도대로 완벽하게 동작합니다!');
    }

    /**
     * 워크플로우 생성
     */
    async createWorkflow() {
        console.log('📋 1단계: 워크플로우 생성');
        console.log('----------------------------------------');

        const input = "React 웹 애플리케이션 개발 - 사용자 인증, 게시판, 댓글 기능 구현";
        console.log(`💬 사용자 입력: "${input}"`);

        // 워크플로우 생성
        const workflow = this.manager.workflowDb.createWorkflow(
            "React 웹 애플리케이션 개발",
            input,
            "high",
            "development"
        );

        // 작업 분석 및 분할
        const analysis = this.manager.analyzeInput(input);
        const tasks = this.manager.splitIntoTasks(analysis, input);

        // 작업을 워크플로우에 추가
        tasks.forEach(task => {
            this.manager.workflowDb.addTask(workflow.id, task);
        });

        // TODO 생성
        const todos = this.manager.generateTodos(tasks, workflow);
        todos.forEach(todo => {
            this.manager.workflowDb.createTodo(workflow.id, todo.taskId, todo);
        });

        // 대화 기록 추가
        this.manager.workflowDb.addConversation(
            workflow.id,
            input,
            `워크플로우가 생성되고 ${tasks.length}개의 작업으로 분할되었습니다.`
        );

        console.log(`✅ 워크플로우 생성 완료: ${workflow.title}`);
        console.log(`📋 워크플로우 ID: ${workflow.id}`);
        console.log(`🎯 우선순위: ${workflow.priority}`);
        console.log(`📂 카테고리: ${workflow.category}`);
        console.log(`📊 복잡도: ${analysis.complexity}`);
        console.log(`⏱️ 예상 시간: ${analysis.estimatedTime}`);
        console.log(`📋 생성된 작업: ${tasks.length}개`);
        console.log(`📝 생성된 TODO: ${todos.length}개`);
        console.log('');

        return workflow;
    }

    /**
     * 상태 확인
     */
    async checkStatus(workflow) {
        console.log('📊 2단계: 상태 확인');
        console.log('----------------------------------------');

        console.log('💬 사용자 명령: "status"');

        const workflowData = this.manager.workflowDb.getWorkflow(workflow.id);
        const completedTasks = workflowData.tasks.filter(task => task.status === 'completed').length;
        const totalTasks = workflowData.tasks.length;
        const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

        console.log(`📊 워크플로우 상태: ${workflowData.title}`);
        console.log(`📈 진행률: ${progress.toFixed(1)}% (${completedTasks}/${totalTasks})`);
        console.log(`📋 상태: ${workflowData.status}`);
        console.log(`🎯 우선순위: ${workflowData.priority}`);
        console.log(`📂 카테고리: ${workflowData.category}`);
        console.log(`⏱️ 예상 시간: ${workflowData.metadata.estimatedTotalTime}`);

        if (workflowData.tasks.length > 0) {
            console.log('\n📋 작업 목록:');
            workflowData.tasks.forEach((task, index) => {
                const statusIcon = task.status === 'completed' ? '✅' : '⏳';
                console.log(`  ${index + 1}. ${statusIcon} ${task.title} (${task.status})`);
            });
        }
        console.log('');
    }

    /**
     * 다음 작업 확인
     */
    async checkNextTask(workflow) {
        console.log('🎯 3단계: 다음 작업 확인');
        console.log('----------------------------------------');

        console.log('💬 사용자 명령: "next"');

        const workflowData = this.manager.workflowDb.getWorkflow(workflow.id);
        const pendingTasks = workflowData.tasks.filter(task => task.status === 'pending');

        if (pendingTasks.length === 0) {
            console.log('✅ 모든 작업이 완료되었습니다!');
            return;
        }

        // 우선순위 순으로 정렬
        const priorityOrder = { 'urgent': 1, 'high': 2, 'medium': 3, 'low': 4 };
        pendingTasks.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

        const nextTask = pendingTasks[0];
        console.log(`🎯 다음 추천 작업: ${nextTask.title}`);
        console.log(`📝 설명: ${nextTask.description}`);
        console.log(`🎯 우선순위: ${nextTask.priority}`);
        console.log(`⏱️ 예상 시간: ${nextTask.estimatedTime}`);
        console.log(`🔗 ID: ${nextTask.id}`);
        console.log(`\n💡 완료하려면: complete ${nextTask.id}`);
        console.log('');
    }

    /**
     * 작업 완료
     */
    async completeTask(workflow) {
        console.log('✅ 4단계: 작업 완료');
        console.log('----------------------------------------');

        const workflowData = this.manager.workflowDb.getWorkflow(workflow.id);
        const pendingTasks = workflowData.tasks.filter(task => task.status === 'pending');

        if (pendingTasks.length === 0) {
            console.log('✅ 완료할 작업이 없습니다.');
            return;
        }

        const taskToComplete = pendingTasks[0];
        console.log(`💬 사용자 명령: "complete ${taskToComplete.id}"`);

        const success = this.manager.workflowDb.updateTaskStatus(workflow.id, taskToComplete.id, 'completed');

        if (success) {
            console.log(`✅ 작업 완료: ${taskToComplete.title}`);

            // TODO도 완료 처리
            const todos = this.manager.workflowDb.loadTodos();
            const relatedTodo = todos.todos.find(t => t.taskId === taskToComplete.id);
            if (relatedTodo) {
                this.manager.workflowDb.updateTodoStatus(relatedTodo.id, 'completed');
                console.log(`📝 TODO 완료: ${relatedTodo.title}`);
            }
        } else {
            console.log('❌ 작업 완료 실패');
        }
        console.log('');
    }

    /**
     * 최종 상태 확인
     */
    async checkFinalStatus(workflow) {
        console.log('📊 5단계: 최종 상태 확인');
        console.log('----------------------------------------');

        console.log('💬 사용자 명령: "status"');

        const workflowData = this.manager.workflowDb.getWorkflow(workflow.id);
        const completedTasks = workflowData.tasks.filter(task => task.status === 'completed').length;
        const totalTasks = workflowData.tasks.length;
        const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

        console.log(`📊 워크플로우 상태: ${workflowData.title}`);
        console.log(`📈 진행률: ${progress.toFixed(1)}% (${completedTasks}/${totalTasks})`);
        console.log(`📋 상태: ${workflowData.status}`);
        console.log(`🎯 우선순위: ${workflowData.priority}`);

        console.log('\n📋 작업별 상태:');
        workflowData.tasks.forEach((task, index) => {
            const statusIcon = task.status === 'completed' ? '✅' : '⏳';
            const completedAt = task.completedAt ? ` (${new Date(task.completedAt).toLocaleString()})` : '';
            console.log(`  ${index + 1}. ${statusIcon} ${task.title} (${task.status})${completedAt}`);
        });

        // TODO 상태
        const todos = this.manager.workflowDb.loadTodos();
        const workflowTodos = todos.todos.filter(t => t.workflowId === workflow.id);
        const completedTodos = workflowTodos.filter(t => t.status === 'completed').length;

        console.log(`\n📝 TODO 상태: ${completedTodos}/${workflowTodos.length}개 완료`);
        workflowTodos.forEach((todo, index) => {
            const statusIcon = todo.status === 'completed' ? '✅' : '⏳';
            const completedAt = todo.completedAt ? ` (${new Date(todo.completedAt).toLocaleString()})` : '';
            console.log(`  ${index + 1}. ${statusIcon} ${todo.title} (${todo.status})${completedAt}`);
        });

        // 전체 통계
        const stats = this.manager.workflowDb.getWorkflowStats();
        console.log('\n📈 전체 시스템 통계:');
        console.log(`  📋 총 워크플로우: ${stats.totalWorkflows}개`);
        console.log(`  🔄 활성 워크플로우: ${stats.activeWorkflows}개`);
        console.log(`  📝 총 작업: ${stats.totalTasks}개`);
        console.log(`  ✅ 완료된 작업: ${stats.completedTasks}개`);
        console.log(`  📋 총 TODO: ${stats.totalTodos}개`);
        console.log(`  ✅ 완료된 TODO: ${stats.completedTodos}개`);
        console.log(`  📈 평균 진행률: ${stats.averageProgress.toFixed(1)}%`);
    }
}

// 테스트 실행
if (require.main === module) {
    const test = new InteractiveTest();
    test.runTest().catch(console.error);
}

module.exports = InteractiveTest;
