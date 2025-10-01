const IntegratedConversationalManager = require('./integrated-conversational-manager');

/**
 * 대화형 매니저 테스트
 */
class ConversationalManagerTest {
    constructor() {
        this.manager = new IntegratedConversationalManager();
    }

    /**
     * 테스트 실행
     */
    async runTests() {
        console.log('🧪 대화형 매니저 테스트 시작');
        console.log('=====================================\n');

        // 테스트 1: 워크플로우 생성
        await this.testWorkflowCreation();

        // 테스트 2: 작업 분석
        await this.testTaskAnalysis();

        // 테스트 3: TODO 생성
        await this.testTodoGeneration();

        // 테스트 4: 상태 확인
        await this.testStatusCheck();

        console.log('\n✅ 모든 테스트 완료!');
    }

    /**
     * 워크플로우 생성 테스트
     */
    async testWorkflowCreation() {
        console.log('📋 테스트 1: 워크플로우 생성');

        const testInput = "React 웹 애플리케이션 개발 - 사용자 인증, 게시판, 댓글 기능 구현";

        console.log(`입력: ${testInput}`);

        // 워크플로우 생성
        const workflow = this.manager.workflowDb.createWorkflow(
            "React 웹 애플리케이션 개발",
            testInput,
            "high",
            "development"
        );

        console.log(`✅ 워크플로우 생성 완료: ${workflow.id}`);
        console.log('');
    }

    /**
     * 작업 분석 테스트
     */
    async testTaskAnalysis() {
        console.log('📊 테스트 2: 작업 분석');

        const testInput = "React 웹 애플리케이션 개발 - 사용자 인증, 게시판, 댓글 기능 구현";

        const analysis = this.manager.analyzeInput(testInput);
        console.log('분석 결과:');
        console.log(`  복잡도: ${analysis.complexity}`);
        console.log(`  예상 시간: ${analysis.estimatedTime}`);
        console.log(`  의존성: ${analysis.dependencies.length}개`);
        console.log(`  키워드: ${analysis.keywords.join(', ')}`);
        console.log(`  병렬 처리 가능: ${analysis.canParallelize}`);
        console.log('');
    }

    /**
     * TODO 생성 테스트
     */
    async testTodoGeneration() {
        console.log('📋 테스트 3: TODO 생성');

        const testInput = "React 웹 애플리케이션 개발 - 사용자 인증, 게시판, 댓글 기능 구현";
        const analysis = this.manager.analyzeInput(testInput);
        const tasks = this.manager.splitIntoTasks(analysis, testInput);

        console.log(`생성된 작업 (${tasks.length}개):`);
        tasks.forEach((task, index) => {
            console.log(`  ${index + 1}. ${task.title}`);
            console.log(`     우선순위: ${task.priority}`);
            console.log(`     예상 시간: ${task.estimatedTime}`);
            console.log(`     병렬 처리: ${task.canParallelize ? '가능' : '불가능'}`);
        });
        console.log('');
    }

    /**
     * 상태 확인 테스트
     */
    async testStatusCheck() {
        console.log('📊 테스트 4: 상태 확인');

        const workflows = this.manager.workflowDb.getAllWorkflows();
        console.log(`총 워크플로우: ${workflows.length}개`);

        if (workflows.length > 0) {
            const workflow = workflows[0];
            console.log(`워크플로우: ${workflow.title}`);
            console.log(`상태: ${workflow.status}`);
            console.log(`진행률: ${workflow.metadata.progress}%`);
            console.log(`작업 수: ${workflow.tasks.length}개`);
        }
        console.log('');
    }
}

// 테스트 실행
if (require.main === module) {
    const test = new ConversationalManagerTest();
    test.runTests().catch(console.error);
}

module.exports = ConversationalManagerTest;
