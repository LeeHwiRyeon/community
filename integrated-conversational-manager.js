const ConversationalManager = require('./conversational-manager');
const WorkflowDatabaseManager = require('./workflow-database-manager');
const readline = require('readline');

/**
 * 통합 대화형 매니저
 * 워크플로우 데이터베이스와 연동된 대화형 작업 관리 시스템
 */
class IntegratedConversationalManager {
    constructor() {
        this.conversationalManager = new ConversationalManager();
        this.workflowDb = new WorkflowDatabaseManager();
        this.currentWorkflow = null;
        this.isRunning = false;
    }

    /**
     * 시스템 시작
     */
    start() {
        console.log('\n🚀 통합 대화형 매니저 시스템');
        console.log('=====================================');
        console.log('💬 작업 요청을 입력하세요. (종료: "quit")');
        console.log('\n📋 명령어:');
        console.log('  - "status" : 현재 워크플로우 상태 확인');
        console.log('  - "next" : 다음 추천 작업 보기');
        console.log('  - "list" : 모든 워크플로우 목록');
        console.log('  - "complete [taskId]" : 작업 완료 처리');
        console.log('  - "report" : 전체 리포트 생성');
        console.log('  - "stats" : 통계 정보');
        console.log('  - "cleanup" : 데이터 정리');
        console.log('=====================================\n');

        this.isRunning = true;
        this.setupReadline();
    }

    /**
     * Readline 설정
     */
    setupReadline() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            prompt: '💬 '
        });

        this.rl.prompt();

        this.rl.on('line', async (input) => {
            const shouldContinue = await this.processUserInput(input.trim());
            if (!shouldContinue) {
                this.rl.close();
            } else {
                this.rl.prompt();
            }
        });

        this.rl.on('close', () => {
            console.log('\n👋 통합 대화형 매니저를 종료합니다.');
            this.isRunning = false;
        });
    }

    /**
     * 사용자 입력 처리
     */
    async processUserInput(input) {
        if (!input) {
            return true;
        }

        if (input === 'quit') {
            return false;
        }

        // 명령어 처리
        if (input === 'status') {
            this.showStatus();
            return true;
        }

        if (input === 'next') {
            this.showNextTask();
            return true;
        }

        if (input === 'list') {
            this.showWorkflowList();
            return true;
        }

        if (input === 'report') {
            this.showReport();
            return true;
        }

        if (input === 'stats') {
            this.showStats();
            return true;
        }

        if (input === 'cleanup') {
            this.cleanupData();
            return true;
        }

        if (input.startsWith('complete ')) {
            const taskId = input.split(' ')[1];
            this.completeTask(taskId);
            return true;
        }

        // 새로운 작업 요청 처리
        await this.handleNewWorkRequest(input);
        return true;
    }

    /**
     * 새로운 작업 요청 처리
     */
    async handleNewWorkRequest(input) {
        console.log('\n🔍 작업 요청 분석 중...');

        // 1. 워크플로우 생성
        const workflow = this.workflowDb.createWorkflow(
            this.extractTitle(input),
            input,
            this.analyzePriority(input),
            this.categorizeInput(input)
        );

        this.currentWorkflow = workflow;

        // 2. 작업 분석 및 분할
        console.log('📊 작업 분석 및 분할 중...');
        const analysis = this.analyzeInput(input);
        const tasks = this.splitIntoTasks(analysis, input);

        // 3. 작업을 워크플로우에 추가
        tasks.forEach(task => {
            this.workflowDb.addTask(workflow.id, task);
        });

        // 4. TODO 생성
        console.log('📋 TODO 생성 중...');
        const todos = this.generateTodos(tasks, workflow);
        todos.forEach(todo => {
            this.workflowDb.createTodo(workflow.id, todo.taskId, todo);
        });

        // 5. 대화 기록 추가
        this.workflowDb.addConversation(
            workflow.id,
            input,
            `워크플로우가 생성되고 ${tasks.length}개의 작업으로 분할되었습니다.`
        );

        // 6. 결과 출력
        this.showWorkflowResult(workflow, tasks, todos);

        console.log('\n💬 다음 단계를 알려주세요:');
        console.log('  - "status" : 현재 상태 확인');
        console.log('  - "next" : 다음 작업 보기');
        console.log('  - "complete [taskId]" : 작업 완료');
        console.log('  - 새로운 요청 입력');
    }

    /**
     * 워크플로우 결과 출력
     */
    showWorkflowResult(workflow, tasks, todos) {
        console.log(`\n✅ 워크플로우 생성 완료: ${workflow.title}`);
        console.log(`📋 워크플로우 ID: ${workflow.id}`);
        console.log(`🎯 우선순위: ${workflow.priority}`);
        console.log(`📂 카테고리: ${workflow.category}`);
        console.log(`📊 복잡도: ${workflow.metadata.complexity}`);
        console.log(`⏱️ 예상 시간: ${workflow.metadata.estimatedTotalTime}`);

        console.log(`\n📋 생성된 작업 (${tasks.length}개):`);
        tasks.forEach((task, index) => {
            console.log(`  ${index + 1}. ${task.title} (${task.priority})`);
            console.log(`     📝 ${task.description}`);
            console.log(`     ⏱️ ${task.estimatedTime}`);
            console.log(`     🔗 ID: ${task.id}`);
            console.log('');
        });

        console.log(`✅ TODO 생성 완료 (${todos.length}개)`);
    }

    /**
     * 상태 확인
     */
    showStatus() {
        if (!this.currentWorkflow) {
            console.log('❌ 활성 워크플로우가 없습니다.');
            return;
        }

        const workflow = this.workflowDb.getWorkflow(this.currentWorkflow.id);
        if (!workflow) {
            console.log('❌ 워크플로우를 찾을 수 없습니다.');
            return;
        }

        const completedTasks = workflow.tasks.filter(task => task.status === 'completed').length;
        const totalTasks = workflow.tasks.length;
        const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

        console.log(`\n📊 워크플로우 상태: ${workflow.title}`);
        console.log(`📈 진행률: ${progress.toFixed(1)}% (${completedTasks}/${totalTasks})`);
        console.log(`📋 상태: ${workflow.status}`);
        console.log(`🎯 우선순위: ${workflow.priority}`);
        console.log(`📂 카테고리: ${workflow.category}`);
        console.log(`⏱️ 예상 시간: ${workflow.metadata.estimatedTotalTime}`);

        if (workflow.tasks.length > 0) {
            console.log('\n📋 작업 목록:');
            workflow.tasks.forEach((task, index) => {
                const statusIcon = task.status === 'completed' ? '✅' : '⏳';
                console.log(`  ${index + 1}. ${statusIcon} ${task.title} (${task.status})`);
            });
        }
    }

    /**
     * 다음 작업 보기
     */
    showNextTask() {
        if (!this.currentWorkflow) {
            console.log('❌ 활성 워크플로우가 없습니다.');
            return;
        }

        const workflow = this.workflowDb.getWorkflow(this.currentWorkflow.id);
        if (!workflow) {
            console.log('❌ 워크플로우를 찾을 수 없습니다.');
            return;
        }

        const pendingTasks = workflow.tasks.filter(task => task.status === 'pending');
        if (pendingTasks.length === 0) {
            console.log('✅ 모든 작업이 완료되었습니다!');
            return;
        }

        // 우선순위 순으로 정렬
        const priorityOrder = { 'urgent': 1, 'high': 2, 'medium': 3, 'low': 4 };
        pendingTasks.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

        const nextTask = pendingTasks[0];
        console.log(`\n🎯 다음 추천 작업: ${nextTask.title}`);
        console.log(`📝 설명: ${nextTask.description}`);
        console.log(`🎯 우선순위: ${nextTask.priority}`);
        console.log(`⏱️ 예상 시간: ${nextTask.estimatedTime}`);
        console.log(`🔗 ID: ${nextTask.id}`);
        console.log(`\n💡 완료하려면: complete ${nextTask.id}`);
    }

    /**
     * 워크플로우 목록
     */
    showWorkflowList() {
        this.workflowDb.generateReport();
    }

    /**
     * 리포트 생성
     */
    showReport() {
        this.workflowDb.generateReport();
    }

    /**
     * 통계 정보
     */
    showStats() {
        const stats = this.workflowDb.getWorkflowStats();
        console.log('\n📊 통계 정보:');
        console.log('=====================================');
        console.log(`📋 총 워크플로우: ${stats.totalWorkflows}개`);
        console.log(`🔄 활성 워크플로우: ${stats.activeWorkflows}개`);
        console.log(`✅ 완료된 워크플로우: ${stats.completedWorkflows}개`);
        console.log(`📝 총 작업: ${stats.totalTasks}개`);
        console.log(`✅ 완료된 작업: ${stats.completedTasks}개`);
        console.log(`📋 총 TODO: ${stats.totalTodos}개`);
        console.log(`✅ 완료된 TODO: ${stats.completedTodos}개`);
        console.log(`💬 총 대화: ${stats.totalConversations}개`);
        console.log(`📈 평균 진행률: ${stats.averageProgress.toFixed(1)}%`);
    }

    /**
     * 데이터 정리
     */
    cleanupData() {
        console.log('🧹 데이터 정리 중...');
        const remaining = this.workflowDb.cleanupData();
        console.log(`✅ 데이터 정리 완료. ${remaining}개 워크플로우 유지`);
    }

    /**
     * 작업 완료 처리
     */
    completeTask(taskId) {
        if (!this.currentWorkflow) {
            console.log('❌ 활성 워크플로우가 없습니다.');
            return;
        }

        const success = this.workflowDb.updateTaskStatus(this.currentWorkflow.id, taskId, 'completed');
        if (success) {
            console.log('✅ 작업이 완료되었습니다.');
            this.showStatus();
        } else {
            console.log('❌ 작업을 찾을 수 없습니다.');
        }
    }

    // 유틸리티 메서드들 (ConversationalManager에서 가져옴)
    extractTitle(input) {
        const sentences = input.split(/[.!?]/);
        return sentences[0].trim().substring(0, 50) + (sentences[0].length > 50 ? '...' : '');
    }

    analyzePriority(input) {
        const urgentKeywords = ['긴급', '즉시', '빠르게', 'ASAP', 'urgent'];
        const highKeywords = ['중요', '우선', '먼저', 'priority'];

        if (urgentKeywords.some(keyword => input.includes(keyword))) return 'urgent';
        if (highKeywords.some(keyword => input.includes(keyword))) return 'high';
        return 'medium';
    }

    categorizeInput(input) {
        const devKeywords = ['개발', '구현', '코딩', '프로그래밍', '앱', '웹사이트'];
        const bugKeywords = ['버그', '오류', '에러', '수정', '해결'];
        const designKeywords = ['디자인', 'UI', 'UX', '화면', '인터페이스'];

        if (devKeywords.some(keyword => input.includes(keyword))) return 'development';
        if (bugKeywords.some(keyword => input.includes(keyword))) return 'bug-fix';
        if (designKeywords.some(keyword => input.includes(keyword))) return 'design';
        return 'general';
    }

    analyzeInput(input) {
        const complexity = this.calculateComplexity(input);
        const estimatedTime = this.estimateTime(complexity);
        const dependencies = this.findDependencies(input);
        const keywords = this.extractKeywords(input);

        return {
            complexity,
            estimatedTime,
            dependencies,
            keywords,
            canParallelize: this.canParallelize(input)
        };
    }

    calculateComplexity(input) {
        const length = input.length;
        const keywords = ['설계', '구현', '테스트', '배포', '통합', '최적화', '리팩토링'];
        const keywordCount = keywords.filter(keyword => input.includes(keyword)).length;

        if (length < 50 && keywordCount <= 1) return 'low';
        if (length < 200 && keywordCount <= 3) return 'medium';
        if (length < 500 && keywordCount <= 5) return 'high';
        return 'very_high';
    }

    estimateTime(complexity) {
        const timeMap = {
            'low': '30분-1시간',
            'medium': '1-3시간',
            'high': '3-8시간',
            'very_high': '1-3일'
        };
        return timeMap[complexity] || '알 수 없음';
    }

    findDependencies(input) {
        const dependencies = [];
        const depKeywords = ['먼저', '이후', '기반으로', '다음으로', '완료 후'];

        depKeywords.forEach(keyword => {
            if (input.includes(keyword)) {
                dependencies.push(keyword);
            }
        });

        return dependencies;
    }

    extractKeywords(input) {
        const techKeywords = ['React', 'Node.js', 'Database', 'API', 'Frontend', 'Backend', 'UI', 'UX'];
        return techKeywords.filter(keyword => input.includes(keyword));
    }

    canParallelize(input) {
        const parallelKeywords = ['동시에', '병렬로', '함께', '동시 진행'];
        return parallelKeywords.some(keyword => input.includes(keyword));
    }

    splitIntoTasks(analysis, input) {
        const tasks = [];
        const taskTemplates = this.getTaskTemplates(analysis.category || 'general');

        taskTemplates.forEach((template, index) => {
            const task = {
                title: template.title,
                description: template.description,
                priority: template.priority,
                estimatedTime: template.estimatedTime,
                canParallelize: template.canParallelize || false,
                dependencies: template.dependencies || []
            };
            tasks.push(task);
        });

        return tasks;
    }

    getTaskTemplates(category) {
        const templates = {
            'development': [
                { title: '요구사항 분석', description: '사용자 요구사항을 분석하고 명세서 작성', priority: 'high', estimatedTime: '1-2시간', canParallelize: false },
                { title: '기술 설계', description: '시스템 아키텍처 및 기술 스택 설계', priority: 'high', estimatedTime: '2-3시간', canParallelize: false },
                { title: '개발 환경 구축', description: '개발 환경 설정 및 의존성 설치', priority: 'medium', estimatedTime: '30분-1시간', canParallelize: true },
                { title: '핵심 기능 구현', description: '주요 기능 개발 및 구현', priority: 'high', estimatedTime: '4-8시간', canParallelize: true },
                { title: '테스트 작성', description: '단위 테스트 및 통합 테스트 작성', priority: 'medium', estimatedTime: '2-4시간', canParallelize: true },
                { title: '문서화', description: '코드 문서화 및 사용자 가이드 작성', priority: 'low', estimatedTime: '1-2시간', canParallelize: true }
            ],
            'bug-fix': [
                { title: '버그 재현', description: '버그 상황을 재현하고 원인 파악', priority: 'high', estimatedTime: '30분-1시간', canParallelize: false },
                { title: '원인 분석', description: '버그의 근본 원인 분석 및 영향도 평가', priority: 'high', estimatedTime: '1-2시간', canParallelize: false },
                { title: '수정 방안 설계', description: '버그 수정을 위한 구체적인 방안 설계', priority: 'medium', estimatedTime: '30분-1시간', canParallelize: false },
                { title: '코드 수정', description: '버그 수정 코드 구현', priority: 'high', estimatedTime: '1-3시간', canParallelize: true },
                { title: '테스트 및 검증', description: '수정 사항 테스트 및 검증', priority: 'high', estimatedTime: '1-2시간', canParallelize: true }
            ],
            'general': [
                { title: '분석 및 계획', description: '요청 사항 분석 및 실행 계획 수립', priority: 'high', estimatedTime: '30분-1시간', canParallelize: false },
                { title: '실행', description: '계획에 따른 작업 실행', priority: 'high', estimatedTime: '1-4시간', canParallelize: true },
                { title: '검토 및 완료', description: '작업 결과 검토 및 완료 처리', priority: 'medium', estimatedTime: '30분-1시간', canParallelize: false }
            ]
        };

        return templates[category] || templates['general'];
    }

    generateTodos(tasks, workflow) {
        const todos = [];

        tasks.forEach((task, index) => {
            const todo = {
                taskId: task.id || `task_${index}`,
                title: task.title,
                description: task.description,
                priority: task.priority,
                estimatedTime: task.estimatedTime,
                canParallelize: task.canParallelize,
                dependencies: task.dependencies
            };
            todos.push(todo);
        });

        return todos;
    }
}

// CLI 실행
if (require.main === module) {
    const manager = new IntegratedConversationalManager();
    manager.start();
}

module.exports = IntegratedConversationalManager;
