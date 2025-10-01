const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

/**
 * 대화형 매니저 시스템
 * 사용자와의 대화를 통한 작업 관리 및 TODO 생성
 */
class ConversationalManager {
    constructor() {
        this.workflowDb = path.join(__dirname, 'workflow-database.json');
        this.todoDb = path.join(__dirname, 'todo-database.json');
        this.conversationDb = path.join(__dirname, 'conversation-database.json');
        this.currentWorkflow = null;
        this.currentTodos = [];
        this.conversationHistory = [];

        this.initializeDatabases();
    }

    /**
     * 데이터베이스 초기화
     */
    initializeDatabases() {
        // 워크플로우 데이터베이스
        if (!fs.existsSync(this.workflowDb)) {
            fs.writeFileSync(this.workflowDb, JSON.stringify({
                workflows: [],
                lastUpdated: new Date().toISOString()
            }, null, 2));
        }

        // TODO 데이터베이스
        if (!fs.existsSync(this.todoDb)) {
            fs.writeFileSync(this.todoDb, JSON.stringify({
                todos: [],
                lastUpdated: new Date().toISOString()
            }, null, 2));
        }

        // 대화 기록 데이터베이스
        if (!fs.existsSync(this.conversationDb)) {
            fs.writeFileSync(this.conversationDb, JSON.stringify({
                conversations: [],
                lastUpdated: new Date().toISOString()
            }, null, 2));
        }

        this.loadData();
    }

    /**
     * 데이터 로드
     */
    loadData() {
        try {
            const workflowData = JSON.parse(fs.readFileSync(this.workflowDb, 'utf8'));
            const todoData = JSON.parse(fs.readFileSync(this.todoDb, 'utf8'));
            const conversationData = JSON.parse(fs.readFileSync(this.conversationDb, 'utf8'));

            this.workflows = workflowData.workflows || [];
            this.todos = todoData.todos || [];
            this.conversationHistory = conversationData.conversations || [];
        } catch (error) {
            console.error('데이터 로드 오류:', error);
            this.workflows = [];
            this.todos = [];
            this.conversationHistory = [];
        }
    }

    /**
     * 데이터 저장
     */
    saveData() {
        try {
            // 워크플로우 저장
            fs.writeFileSync(this.workflowDb, JSON.stringify({
                workflows: this.workflows,
                lastUpdated: new Date().toISOString()
            }, null, 2));

            // TODO 저장
            fs.writeFileSync(this.todoDb, JSON.stringify({
                todos: this.todos,
                lastUpdated: new Date().toISOString()
            }, null, 2));

            // 대화 기록 저장
            fs.writeFileSync(this.conversationDb, JSON.stringify({
                conversations: this.conversationHistory,
                lastUpdated: new Date().toISOString()
            }, null, 2));

            console.log('✅ 데이터 저장 완료');
        } catch (error) {
            console.error('❌ 데이터 저장 오류:', error);
        }
    }

    /**
     * 새로운 워크플로우 시작
     */
    startWorkflow(userInput) {
        const workflowId = uuidv4();
        const workflow = {
            id: workflowId,
            title: this.extractTitle(userInput),
            description: userInput,
            status: 'active',
            priority: this.analyzePriority(userInput),
            category: this.categorizeInput(userInput),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            tasks: [],
            todos: [],
            conversationLog: []
        };

        this.workflows.push(workflow);
        this.currentWorkflow = workflow;
        this.saveData();

        console.log(`🚀 새로운 워크플로우 시작: ${workflow.title}`);
        console.log(`📋 워크플로우 ID: ${workflowId}`);
        console.log(`🎯 우선순위: ${workflow.priority}`);
        console.log(`📂 카테고리: ${workflow.category}`);

        return workflow;
    }

    /**
     * 입력 분석 및 작업 분할
     */
    analyzeAndSplitTasks(workflowId, userInput) {
        const workflow = this.workflows.find(w => w.id === workflowId);
        if (!workflow) {
            console.error('❌ 워크플로우를 찾을 수 없습니다.');
            return null;
        }

        // 작업 분석
        const analysis = this.analyzeInput(userInput);
        const tasks = this.splitIntoTasks(analysis, userInput);

        // 워크플로우에 작업 추가
        workflow.tasks = tasks;
        workflow.updatedAt = new Date().toISOString();

        // TODO 생성
        const todos = this.generateTodos(tasks, workflow);
        workflow.todos = todos;

        // 전체 TODO 목록에 추가
        this.todos.push(...todos);

        this.saveData();

        console.log(`\n📊 작업 분석 결과:`);
        console.log(`🔍 복잡도: ${analysis.complexity}`);
        console.log(`⏱️ 예상 시간: ${analysis.estimatedTime}`);
        console.log(`🔗 의존성: ${analysis.dependencies.length}개`);
        console.log(`\n📋 생성된 작업 (${tasks.length}개):`);
        tasks.forEach((task, index) => {
            console.log(`  ${index + 1}. ${task.title} (${task.priority})`);
        });

        console.log(`\n✅ TODO 생성 완료 (${todos.length}개)`);

        return { tasks, todos };
    }

    /**
     * 입력 분석
     */
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

    /**
     * 복잡도 계산
     */
    calculateComplexity(input) {
        const length = input.length;
        const keywords = ['설계', '구현', '테스트', '배포', '통합', '최적화', '리팩토링'];
        const keywordCount = keywords.filter(keyword => input.includes(keyword)).length;

        if (length < 50 && keywordCount <= 1) return 'low';
        if (length < 200 && keywordCount <= 3) return 'medium';
        if (length < 500 && keywordCount <= 5) return 'high';
        return 'very_high';
    }

    /**
     * 시간 추정
     */
    estimateTime(complexity) {
        const timeMap = {
            'low': '30분-1시간',
            'medium': '1-3시간',
            'high': '3-8시간',
            'very_high': '1-3일'
        };
        return timeMap[complexity] || '알 수 없음';
    }

    /**
     * 의존성 찾기
     */
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

    /**
     * 키워드 추출
     */
    extractKeywords(input) {
        const techKeywords = ['React', 'Node.js', 'Database', 'API', 'Frontend', 'Backend', 'UI', 'UX'];
        return techKeywords.filter(keyword => input.includes(keyword));
    }

    /**
     * 병렬 처리 가능 여부
     */
    canParallelize(input) {
        const parallelKeywords = ['동시에', '병렬로', '함께', '동시 진행'];
        return parallelKeywords.some(keyword => input.includes(keyword));
    }

    /**
     * 작업으로 분할
     */
    splitIntoTasks(analysis, input) {
        const tasks = [];
        const taskTemplates = this.getTaskTemplates(analysis.category);

        taskTemplates.forEach((template, index) => {
            const task = {
                id: uuidv4(),
                title: template.title,
                description: template.description,
                priority: template.priority,
                estimatedTime: template.estimatedTime,
                status: 'pending',
                dependencies: template.dependencies || [],
                canParallelize: template.canParallelize || false,
                createdAt: new Date().toISOString()
            };
            tasks.push(task);
        });

        return tasks;
    }

    /**
     * 작업 템플릿 가져오기
     */
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

    /**
     * TODO 생성
     */
    generateTodos(tasks, workflow) {
        const todos = [];

        tasks.forEach((task, index) => {
            const todo = {
                id: uuidv4(),
                workflowId: workflow.id,
                taskId: task.id,
                title: task.title,
                description: task.description,
                priority: task.priority,
                status: 'pending',
                estimatedTime: task.estimatedTime,
                canParallelize: task.canParallelize,
                dependencies: task.dependencies,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            todos.push(todo);
        });

        return todos;
    }

    /**
     * 제목 추출
     */
    extractTitle(input) {
        const sentences = input.split(/[.!?]/);
        return sentences[0].trim().substring(0, 50) + (sentences[0].length > 50 ? '...' : '');
    }

    /**
     * 우선순위 분석
     */
    analyzePriority(input) {
        const urgentKeywords = ['긴급', '즉시', '빠르게', 'ASAP', 'urgent'];
        const highKeywords = ['중요', '우선', '먼저', 'priority'];

        if (urgentKeywords.some(keyword => input.includes(keyword))) return 'urgent';
        if (highKeywords.some(keyword => input.includes(keyword))) return 'high';
        return 'medium';
    }

    /**
     * 카테고리 분류
     */
    categorizeInput(input) {
        const devKeywords = ['개발', '구현', '코딩', '프로그래밍', '앱', '웹사이트'];
        const bugKeywords = ['버그', '오류', '에러', '수정', '해결'];
        const designKeywords = ['디자인', 'UI', 'UX', '화면', '인터페이스'];

        if (devKeywords.some(keyword => input.includes(keyword))) return 'development';
        if (bugKeywords.some(keyword => input.includes(keyword))) return 'bug-fix';
        if (designKeywords.some(keyword => input.includes(keyword))) return 'design';
        return 'general';
    }

    /**
     * 대화 기록 추가
     */
    addConversation(workflowId, userMessage, systemResponse) {
        const conversation = {
            id: uuidv4(),
            workflowId,
            userMessage,
            systemResponse,
            timestamp: new Date().toISOString()
        };

        this.conversationHistory.push(conversation);

        // 워크플로우에 대화 추가
        const workflow = this.workflows.find(w => w.id === workflowId);
        if (workflow) {
            workflow.conversationLog.push(conversation);
        }

        this.saveData();
    }

    /**
     * 워크플로우 상태 확인
     */
    checkWorkflowStatus(workflowId) {
        const workflow = this.workflows.find(w => w.id === workflowId);
        if (!workflow) {
            console.error('❌ 워크플로우를 찾을 수 없습니다.');
            return null;
        }

        const completedTasks = workflow.tasks.filter(task => task.status === 'completed').length;
        const totalTasks = workflow.tasks.length;
        const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

        console.log(`\n📊 워크플로우 상태: ${workflow.title}`);
        console.log(`📈 진행률: ${progress.toFixed(1)}% (${completedTasks}/${totalTasks})`);
        console.log(`📋 상태: ${workflow.status}`);
        console.log(`🎯 우선순위: ${workflow.priority}`);

        return {
            workflow,
            progress,
            completedTasks,
            totalTasks
        };
    }

    /**
     * 다음 작업 추천
     */
    getNextRecommendedTask(workflowId) {
        const workflow = this.workflows.find(w => w.id === workflowId);
        if (!workflow) return null;

        const pendingTasks = workflow.tasks.filter(task => task.status === 'pending');
        if (pendingTasks.length === 0) return null;

        // 우선순위 순으로 정렬
        const priorityOrder = { 'urgent': 1, 'high': 2, 'medium': 3, 'low': 4 };
        pendingTasks.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

        return pendingTasks[0];
    }

    /**
     * 작업 완료 처리
     */
    completeTask(workflowId, taskId) {
        const workflow = this.workflows.find(w => w.id === workflowId);
        if (!workflow) return false;

        const task = workflow.tasks.find(t => t.id === taskId);
        if (!task) return false;

        task.status = 'completed';
        task.completedAt = new Date().toISOString();
        workflow.updatedAt = new Date().toISOString();

        // TODO도 업데이트
        const todo = this.todos.find(t => t.taskId === taskId);
        if (todo) {
            todo.status = 'completed';
            todo.updatedAt = new Date().toISOString();
        }

        this.saveData();
        console.log(`✅ 작업 완료: ${task.title}`);
        return true;
    }

    /**
     * 대화형 인터페이스 시작
     */
    startConversation() {
        console.log('\n🤖 대화형 매니저 시스템 시작');
        console.log('=====================================');
        console.log('💬 작업 요청을 입력하세요. (종료: "quit")');
        console.log('📋 명령어:');
        console.log('  - "status" : 현재 워크플로우 상태 확인');
        console.log('  - "next" : 다음 추천 작업 보기');
        console.log('  - "list" : 모든 워크플로우 목록');
        console.log('  - "complete [taskId]" : 작업 완료 처리');
        console.log('=====================================\n');
    }

    /**
     * 사용자 입력 처리
     */
    async processUserInput(input) {
        const trimmedInput = input.trim();

        if (trimmedInput === 'quit') {
            console.log('👋 대화형 매니저를 종료합니다.');
            return false;
        }

        if (trimmedInput === 'status') {
            if (this.currentWorkflow) {
                this.checkWorkflowStatus(this.currentWorkflow.id);
            } else {
                console.log('❌ 활성 워크플로우가 없습니다.');
            }
            return true;
        }

        if (trimmedInput === 'next') {
            if (this.currentWorkflow) {
                const nextTask = this.getNextRecommendedTask(this.currentWorkflow.id);
                if (nextTask) {
                    console.log(`\n🎯 다음 추천 작업: ${nextTask.title}`);
                    console.log(`📝 설명: ${nextTask.description}`);
                    console.log(`🎯 우선순위: ${nextTask.priority}`);
                    console.log(`⏱️ 예상 시간: ${nextTask.estimatedTime}`);
                } else {
                    console.log('✅ 모든 작업이 완료되었습니다!');
                }
            } else {
                console.log('❌ 활성 워크플로우가 없습니다.');
            }
            return true;
        }

        if (trimmedInput === 'list') {
            this.listWorkflows();
            return true;
        }

        if (trimmedInput.startsWith('complete ')) {
            const taskId = trimmedInput.split(' ')[1];
            if (this.currentWorkflow) {
                this.completeTask(this.currentWorkflow.id, taskId);
            } else {
                console.log('❌ 활성 워크플로우가 없습니다.');
            }
            return true;
        }

        // 새로운 워크플로우 시작
        if (trimmedInput.length > 0) {
            const workflow = this.startWorkflow(trimmedInput);
            const result = this.analyzeAndSplitTasks(workflow.id, trimmedInput);

            this.addConversation(workflow.id, trimmedInput, `워크플로우가 생성되고 ${result.tasks.length}개의 작업으로 분할되었습니다.`);

            console.log('\n💬 다음 단계를 알려주세요:');
            console.log('  - "status" : 현재 상태 확인');
            console.log('  - "next" : 다음 작업 보기');
            console.log('  - "complete [taskId]" : 작업 완료');
            console.log('  - 새로운 요청 입력');
        }

        return true;
    }

    /**
     * 워크플로우 목록 출력
     */
    listWorkflows() {
        console.log('\n📋 워크플로우 목록:');
        console.log('=====================================');

        if (this.workflows.length === 0) {
            console.log('❌ 워크플로우가 없습니다.');
            return;
        }

        this.workflows.forEach((workflow, index) => {
            const completedTasks = workflow.tasks.filter(task => task.status === 'completed').length;
            const totalTasks = workflow.tasks.length;
            const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

            console.log(`${index + 1}. ${workflow.title}`);
            console.log(`   ID: ${workflow.id}`);
            console.log(`   상태: ${workflow.status} (${progress.toFixed(1)}%)`);
            console.log(`   우선순위: ${workflow.priority}`);
            console.log(`   생성일: ${new Date(workflow.createdAt).toLocaleString()}`);
            console.log('');
        });
    }
}

// CLI 인터페이스
if (require.main === module) {
    const manager = new ConversationalManager();
    manager.startConversation();

    const readline = require('readline');
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.on('line', async (input) => {
        const shouldContinue = await manager.processUserInput(input);
        if (!shouldContinue) {
            rl.close();
        }
    });
}

module.exports = ConversationalManager;
