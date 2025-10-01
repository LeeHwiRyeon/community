const IntegratedConversationalManager = require('./integrated-conversational-manager');

/**
 * 작업 완료 시뮬레이션 테스트
 * 사용자가 작업을 완료했을 때 시스템이 어떻게 반응하는지 확인
 */
class TaskCompletionTest {
    constructor() {
        this.manager = new IntegratedConversationalManager();
    }

    /**
     * 작업 완료 테스트 실행
     */
    async runTest() {
        console.log('🎯 작업 완료 시뮬레이션 테스트');
        console.log('=====================================\n');

        // 1. 워크플로우 생성
        const workflow = await this.createTestWorkflow();

        // 2. 작업 완료 시뮬레이션
        await this.simulateTaskCompletion(workflow);

        // 3. 최종 상태 확인
        await this.checkFinalStatus(workflow);

        console.log('\n🎉 작업 완료 테스트 완료!');
    }

    /**
     * 테스트 워크플로우 생성
     */
    async createTestWorkflow() {
        console.log('📋 테스트 워크플로우 생성');
        console.log('----------------------------------------');

        const input = "웹사이트 성능 최적화 - 로딩 속도 개선, 이미지 압축, 캐싱 구현";
        console.log(`💬 사용자 입력: ${input}`);

        // 워크플로우 생성
        const workflow = this.manager.workflowDb.createWorkflow(
            "웹사이트 성능 최적화",
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

        console.log(`✅ 워크플로우 생성: ${workflow.title}`);
        console.log(`📋 생성된 작업: ${tasks.length}개`);
        console.log(`📝 생성된 TODO: ${todos.length}개`);
        console.log('');

        return workflow;
    }

    /**
     * 작업 완료 시뮬레이션
     */
    async simulateTaskCompletion(workflow) {
        console.log('🔄 작업 완료 시뮬레이션');
        console.log('----------------------------------------');

        const workflowData = this.manager.workflowDb.getWorkflow(workflow.id);
        const tasks = workflowData.tasks;

        console.log(`📋 총 ${tasks.length}개 작업 중 완료 시뮬레이션 시작`);

        // 첫 번째 작업 완료
        if (tasks.length > 0) {
            const firstTask = tasks[0];
            console.log(`\n✅ 작업 완료: ${firstTask.title}`);
            this.manager.workflowDb.updateTaskStatus(workflow.id, firstTask.id, 'completed');

            // TODO도 완료 처리
            const todos = this.manager.workflowDb.loadTodos();
            const relatedTodo = todos.todos.find(t => t.taskId === firstTask.id);
            if (relatedTodo) {
                this.manager.workflowDb.updateTodoStatus(relatedTodo.id, 'completed');
                console.log(`📝 TODO 완료: ${relatedTodo.title}`);
            }
        }

        // 두 번째 작업 완료
        if (tasks.length > 1) {
            const secondTask = tasks[1];
            console.log(`\n✅ 작업 완료: ${secondTask.title}`);
            this.manager.workflowDb.updateTaskStatus(workflow.id, secondTask.id, 'completed');

            // TODO도 완료 처리
            const todos = this.manager.workflowDb.loadTodos();
            const relatedTodo = todos.todos.find(t => t.taskId === secondTask.id);
            if (relatedTodo) {
                this.manager.workflowDb.updateTodoStatus(relatedTodo.id, 'completed');
                console.log(`📝 TODO 완료: ${relatedTodo.title}`);
            }
        }

        console.log('\n📊 중간 진행 상황:');
        const updatedWorkflow = this.manager.workflowDb.getWorkflow(workflow.id);
        const completedTasks = updatedWorkflow.tasks.filter(task => task.status === 'completed').length;
        const totalTasks = updatedWorkflow.tasks.length;
        const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

        console.log(`  📈 진행률: ${progress.toFixed(1)}% (${completedTasks}/${totalTasks})`);
        console.log(`  ✅ 완료된 작업: ${completedTasks}개`);
        console.log(`  ⏳ 남은 작업: ${totalTasks - completedTasks}개`);
        console.log('');
    }

    /**
     * 최종 상태 확인
     */
    async checkFinalStatus(workflow) {
        console.log('📊 최종 상태 확인');
        console.log('----------------------------------------');

        // 워크플로우 상태
        const workflowData = this.manager.workflowDb.getWorkflow(workflow.id);
        const completedTasks = workflowData.tasks.filter(task => task.status === 'completed').length;
        const totalTasks = workflowData.tasks.length;
        const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

        console.log(`📋 워크플로우: ${workflowData.title}`);
        console.log(`📈 최종 진행률: ${progress.toFixed(1)}% (${completedTasks}/${totalTasks})`);
        console.log(`📊 상태: ${workflowData.status}`);
        console.log(`🎯 우선순위: ${workflowData.priority}`);

        // 작업별 상태
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
    const test = new TaskCompletionTest();
    test.runTest().catch(console.error);
}

module.exports = TaskCompletionTest;
