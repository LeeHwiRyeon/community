const IntegratedConversationalManager = require('./integrated-conversational-manager');

/**
 * 워크플로우 데모 테스트
 * 사용자가 뒤에서 뭐하는지 몰라도 자동으로 동작하는지 확인
 */
class WorkflowDemo {
    constructor() {
        this.manager = new IntegratedConversationalManager();
    }

    /**
     * 데모 실행
     */
    async runDemo() {
        console.log('🎬 대화형 매니저 데모 시작');
        console.log('=====================================\n');

        // 데모 1: 개발 작업 요청
        await this.demoDevelopmentWork();

        // 데모 2: 버그 수정 요청
        await this.demoBugFixWork();

        // 데모 3: 일반 작업 요청
        await this.demoGeneralWork();

        // 데모 4: 상태 확인
        await this.demoStatusCheck();

        console.log('\n🎉 모든 데모 완료!');
        console.log('✅ 시스템이 의도대로 동작합니다!');
    }

    /**
     * 개발 작업 데모
     */
    async demoDevelopmentWork() {
        console.log('📱 데모 1: React 웹 애플리케이션 개발');
        console.log('----------------------------------------');

        const input = "React 웹 애플리케이션 개발 - 사용자 인증, 게시판, 댓글 기능 구현";
        console.log(`💬 사용자 입력: ${input}`);

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

        console.log(`✅ 워크플로우 생성: ${workflow.title}`);
        console.log(`📋 생성된 작업: ${tasks.length}개`);
        console.log(`📝 생성된 TODO: ${todos.length}개`);
        console.log(`🎯 우선순위: ${workflow.priority}`);
        console.log(`📂 카테고리: ${workflow.category}`);
        console.log('');

        return workflow;
    }

    /**
     * 버그 수정 데모
     */
    async demoBugFixWork() {
        console.log('🐛 데모 2: 로그인 버그 수정');
        console.log('----------------------------------------');

        const input = "로그인 버그 수정 - 사용자가 로그인할 때 오류가 발생하는 문제 해결";
        console.log(`💬 사용자 입력: ${input}`);

        // 워크플로우 생성
        const workflow = this.manager.workflowDb.createWorkflow(
            "로그인 버그 수정",
            input,
            "urgent",
            "bug-fix"
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

        console.log(`✅ 워크플로우 생성: ${workflow.title}`);
        console.log(`📋 생성된 작업: ${tasks.length}개`);
        console.log(`📝 생성된 TODO: ${todos.length}개`);
        console.log(`🎯 우선순위: ${workflow.priority}`);
        console.log(`📂 카테고리: ${workflow.category}`);
        console.log('');

        return workflow;
    }

    /**
     * 일반 작업 데모
     */
    async demoGeneralWork() {
        console.log('📋 데모 3: 문서 정리 작업');
        console.log('----------------------------------------');

        const input = "프로젝트 문서 정리 - README, API 문서, 사용자 가이드 업데이트";
        console.log(`💬 사용자 입력: ${input}`);

        // 워크플로우 생성
        const workflow = this.manager.workflowDb.createWorkflow(
            "프로젝트 문서 정리",
            input,
            "medium",
            "general"
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

        console.log(`✅ 워크플로우 생성: ${workflow.title}`);
        console.log(`📋 생성된 작업: ${tasks.length}개`);
        console.log(`📝 생성된 TODO: ${todos.length}개`);
        console.log(`🎯 우선순위: ${workflow.priority}`);
        console.log(`📂 카테고리: ${workflow.category}`);
        console.log('');

        return workflow;
    }

    /**
     * 상태 확인 데모
     */
    async demoStatusCheck() {
        console.log('📊 데모 4: 전체 상태 확인');
        console.log('----------------------------------------');

        // 전체 통계
        const stats = this.manager.workflowDb.getWorkflowStats();
        console.log('📈 전체 통계:');
        console.log(`  📋 총 워크플로우: ${stats.totalWorkflows}개`);
        console.log(`  🔄 활성 워크플로우: ${stats.activeWorkflows}개`);
        console.log(`  ✅ 완료된 워크플로우: ${stats.completedWorkflows}개`);
        console.log(`  📝 총 작업: ${stats.totalTasks}개`);
        console.log(`  ✅ 완료된 작업: ${stats.completedTasks}개`);
        console.log(`  📋 총 TODO: ${stats.totalTodos}개`);
        console.log(`  ✅ 완료된 TODO: ${stats.completedTodos}개`);
        console.log(`  💬 총 대화: ${stats.totalConversations}개`);
        console.log(`  📈 평균 진행률: ${stats.averageProgress.toFixed(1)}%`);

        // 워크플로우 목록
        const workflows = this.manager.workflowDb.getAllWorkflows();
        console.log('\n📋 워크플로우 목록:');
        workflows.forEach((workflow, index) => {
            console.log(`  ${index + 1}. ${workflow.title}`);
            console.log(`     ID: ${workflow.id}`);
            console.log(`     상태: ${workflow.status} (${workflow.metadata.progress}%)`);
            console.log(`     우선순위: ${workflow.priority}`);
            console.log(`     작업: ${workflow.tasks.length}개`);
            console.log(`     생성일: ${new Date(workflow.createdAt).toLocaleString()}`);
            console.log('');
        });
    }
}

// 데모 실행
if (require.main === module) {
    const demo = new WorkflowDemo();
    demo.runDemo().catch(console.error);
}

module.exports = WorkflowDemo;
