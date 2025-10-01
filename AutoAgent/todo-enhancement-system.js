const fs = require('fs');
const path = require('path');
const axios = require('axios');

class TodoEnhancementSystem {
    constructor() {
        this.cursorApiUrl = 'http://localhost:3000/api/cursor';
        this.todoFile = path.join(__dirname, 'app-todos.json');
        this.workflowFile = path.join(__dirname, 'app-workflows.json');
        this.enhancedTodosFile = path.join(__dirname, 'enhanced-todos.json');
        this.isRunning = false;
        this.enhancementLevel = 1;
    }

    async start() {
        console.log('🚀 TODO 고도화 시스템 시작...');
        console.log('=====================================');
        this.isRunning = true;

        while (this.isRunning) {
            try {
                // 1. 기존 TODO 리스트 읽기
                const todos = await this.readExistingTodos();

                if (todos.length === 0) {
                    console.log('📝 TODO가 없습니다. 새로 생성합니다.');
                    await this.generateNewTodos();
                    continue;
                }

                // 2. TODO 고도화 및 세부기획
                await this.enhanceTodos(todos);

                // 3. 순서대로 TODO 처리
                await this.processTodosInOrder();

                // 4. 남은 TODO 확인 및 반복
                await this.checkRemainingTodos();

                // 5. 다음 사이클 준비
                await this.prepareNextCycle();

            } catch (error) {
                console.error('❌ 작업 실행 오류:', error.message);
                break;
            }
        }
    }

    async readExistingTodos() {
        console.log('\n📋 기존 TODO 리스트 읽기 중...');

        if (!fs.existsSync(this.todoFile)) {
            console.log('⚠️ TODO 파일이 없습니다.');
            return [];
        }

        try {
            const fileContent = fs.readFileSync(this.todoFile, 'utf8');
            if (!fileContent.trim()) {
                console.log('⚠️ TODO 파일이 비어있습니다.');
                return [];
            }

            const todoData = JSON.parse(fileContent);
            const todos = todoData.todos || [];

            console.log(`📊 총 TODO: ${todos.length}개`);
            console.log(`⏳ 대기 중: ${todos.filter(t => t.status === 'pending').length}개`);
            console.log(`🔄 진행 중: ${todos.filter(t => t.status === 'in_progress').length}개`);
            console.log(`✅ 완료: ${todos.filter(t => t.status === 'completed').length}개`);

            return todos;
        } catch (error) {
            console.log(`❌ TODO 파일 읽기 오류: ${error.message}`);
            return [];
        }
    }

    async enhanceTodos(todos) {
        console.log('\n🔧 TODO 고도화 및 세부기획 중...');

        const pendingTodos = todos.filter(todo => todo.status === 'pending');

        if (pendingTodos.length === 0) {
            console.log('✅ 고도화할 TODO가 없습니다.');
            return;
        }

        console.log(`📊 고도화할 TODO: ${pendingTodos.length}개`);

        for (const todo of pendingTodos) {
            await this.enhanceSingleTodo(todo);
        }
    }

    async enhanceSingleTodo(todo) {
        console.log(`\n🔧 TODO 고도화 중: ${todo.title}`);

        try {
            // TODO 고도화 요청
            const enhancementPrompt = this.createEnhancementPrompt(todo);

            const response = await axios.post(`${this.cursorApiUrl}/request`, {
                message: enhancementPrompt,
                type: 'workflow',
                metadata: {
                    source: 'todo-enhancement-system',
                    todoId: todo.id,
                    enhancementLevel: this.enhancementLevel,
                    originalTodo: todo
                }
            });

            if (response.data.success) {
                console.log(`✅ TODO 고도화 성공: ${todo.title}`);

                // 고도화된 TODO 저장
                await this.saveEnhancedTodo(todo, response.data);

                // 원본 TODO 업데이트
                await this.updateTodoWithEnhancement(todo.id, response.data);

            } else {
                console.log(`❌ TODO 고도화 실패: ${todo.title} - ${response.data.error}`);
            }

        } catch (error) {
            console.error(`❌ TODO 고도화 오류: ${todo.title} - ${error.message}`);
        }
    }

    createEnhancementPrompt(todo) {
        return `TODO 고도화 및 세부기획 요청:

기존 TODO: ${todo.title}
설명: ${todo.description}
우선순위: ${todo.priority}
카테고리: ${todo.category}
예상 시간: ${todo.estimatedTime}
기능: ${todo.features.join(', ')}

고도화 요청사항:
1. 세부 작업 단계로 분해
2. 각 단계별 구체적인 구현 방법 제시
3. 필요한 기술 스택 및 도구 명시
4. 예상 소요 시간 재계산
5. 의존성 및 순서 관계 정의
6. 테스트 케이스 및 검증 방법 제시
7. 위험 요소 및 대응 방안 식별

고도화 레벨: ${this.enhancementLevel}
현재 앱: ${this.getCurrentAppName()}

위 요청사항에 따라 TODO를 고도화하고 세부기획을 제공해주세요.`;
    }

    getCurrentAppName() {
        if (fs.existsSync(this.todoFile)) {
            const todoData = JSON.parse(fs.readFileSync(this.todoFile, 'utf8'));
            return todoData.app?.name || '알 수 없는 앱';
        }
        return '알 수 없는 앱';
    }

    async saveEnhancedTodo(originalTodo, enhancementData) {
        const enhancedTodo = {
            ...originalTodo,
            enhanced: true,
            enhancementLevel: this.enhancementLevel,
            enhancedAt: new Date().toISOString(),
            subTasks: enhancementData.tasks || [],
            detailedPlan: enhancementData.analysis || {},
            estimatedTime: this.calculateEnhancedTime(originalTodo, enhancementData),
            dependencies: this.extractDependencies(enhancementData),
            testCases: this.extractTestCases(enhancementData),
            risks: this.extractRisks(enhancementData)
        };

        // 고도화된 TODO 저장
        let enhancedTodos = [];
        if (fs.existsSync(this.enhancedTodosFile)) {
            enhancedTodos = JSON.parse(fs.readFileSync(this.enhancedTodosFile, 'utf8'));
        }

        enhancedTodos.push(enhancedTodo);
        fs.writeFileSync(this.enhancedTodosFile, JSON.stringify(enhancedTodos, null, 2));
    }

    calculateEnhancedTime(originalTodo, enhancementData) {
        const baseTime = this.parseTime(originalTodo.estimatedTime);
        const taskCount = enhancementData.tasks?.length || 1;
        const complexity = this.enhancementLevel;

        // 고도화 레벨에 따른 시간 조정
        const multiplier = 1 + (complexity * 0.2);
        const enhancedTime = Math.ceil(baseTime * multiplier * taskCount);

        return `${enhancedTime}-${enhancedTime + 2}시간`;
    }

    parseTime(timeStr) {
        const match = timeStr.match(/(\d+)-(\d+)/);
        if (match) {
            return parseInt(match[1]);
        }
        return 4; // 기본값
    }

    extractDependencies(enhancementData) {
        // 의존성 추출 로직
        return enhancementData.tasks?.map((task, index) => ({
            taskId: task.id || `task_${index}`,
            dependsOn: task.dependencies || [],
            description: task.description
        })) || [];
    }

    extractTestCases(enhancementData) {
        // 테스트 케이스 추출 로직
        return enhancementData.todos?.map(todo => ({
            id: todo.taskId,
            title: todo.title,
            testType: 'unit',
            description: `테스트: ${todo.title}`
        })) || [];
    }

    extractRisks(enhancementData) {
        // 위험 요소 추출 로직
        return [
            {
                level: 'medium',
                description: '기술적 복잡성으로 인한 지연 가능성',
                mitigation: '단계별 검증 및 롤백 계획 수립'
            },
            {
                level: 'low',
                description: '외부 의존성 변경 가능성',
                mitigation: '버전 고정 및 대안 방안 준비'
            }
        ];
    }

    async updateTodoWithEnhancement(todoId, enhancementData) {
        if (!fs.existsSync(this.todoFile)) return;

        const todoData = JSON.parse(fs.readFileSync(this.todoFile, 'utf8'));
        const todoIndex = todoData.todos.findIndex(todo => todo.id === todoId);

        if (todoIndex !== -1) {
            todoData.todos[todoIndex] = {
                ...todoData.todos[todoIndex],
                enhanced: true,
                enhancementLevel: this.enhancementLevel,
                enhancedAt: new Date().toISOString(),
                subTasks: enhancementData.tasks || [],
                estimatedTime: this.calculateEnhancedTime(todoData.todos[todoIndex], enhancementData)
            };

            fs.writeFileSync(this.todoFile, JSON.stringify(todoData, null, 2));
        }
    }

    async processTodosInOrder() {
        console.log('\n🔄 순서대로 TODO 처리 중...');

        const todos = await this.readExistingTodos();
        const pendingTodos = todos.filter(todo => todo.status === 'pending');

        if (pendingTodos.length === 0) {
            console.log('✅ 처리할 TODO가 없습니다.');
            return;
        }

        // 우선순위 및 의존성에 따라 정렬
        const sortedTodos = this.sortTodosByPriorityAndDependency(pendingTodos);

        console.log(`📊 처리할 TODO 순서: ${sortedTodos.length}개`);

        for (const todo of sortedTodos) {
            await this.processSingleTodo(todo);
        }
    }

    sortTodosByPriorityAndDependency(todos) {
        const priorityOrder = { 'high': 1, 'medium': 2, 'low': 3 };

        return todos.sort((a, b) => {
            // 우선순위 비교
            if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            }

            // 카테고리 순서 (setup -> database -> backend -> frontend -> feature -> deployment)
            const categoryOrder = { 'setup': 1, 'database': 2, 'backend': 3, 'frontend': 4, 'feature': 5, 'deployment': 6 };
            if (categoryOrder[a.category] !== categoryOrder[b.category]) {
                return categoryOrder[a.category] - categoryOrder[b.category];
            }

            // 제목 알파벳 순
            return a.title.localeCompare(b.title);
        });
    }

    async processSingleTodo(todo) {
        console.log(`\n🔄 TODO 처리 중: ${todo.title}`);

        try {
            // TODO 처리 요청
            const response = await axios.post(`${this.cursorApiUrl}/request`, {
                message: `TODO 실행 요청: ${todo.title} - ${todo.description}`,
                type: 'workflow',
                metadata: {
                    source: 'todo-enhancement-system',
                    todoId: todo.id,
                    priority: todo.priority,
                    category: todo.category,
                    enhanced: todo.enhanced || false,
                    subTasks: todo.subTasks || []
                }
            });

            if (response.data.success) {
                console.log(`✅ TODO 처리 성공: ${todo.title}`);

                // TODO 상태를 진행 중으로 변경
                await this.updateTodoStatus(todo.id, 'in_progress');

                // 워크플로우 저장
                await this.saveWorkflow(response.data.workflow);

                // TODO 완료 처리 (시뮬레이션)
                await this.completeTodo(todo);

            } else {
                console.log(`❌ TODO 처리 실패: ${todo.title} - ${response.data.error}`);
            }

        } catch (error) {
            console.error(`❌ TODO 처리 오류: ${todo.title} - ${error.message}`);
        }
    }

    async completeTodo(todo) {
        console.log(`✅ TODO 완료: ${todo.title}`);

        // TODO 상태를 완료로 변경
        await this.updateTodoStatus(todo.id, 'completed');

        // 완료 로그 저장
        this.logTodoCompletion(todo);
    }

    async updateTodoStatus(todoId, status) {
        if (!fs.existsSync(this.todoFile)) return;

        const todoData = JSON.parse(fs.readFileSync(this.todoFile, 'utf8'));
        const todoIndex = todoData.todos.findIndex(todo => todo.id === todoId);

        if (todoIndex !== -1) {
            todoData.todos[todoIndex].status = status;
            todoData.todos[todoIndex].updatedAt = new Date().toISOString();

            if (status === 'completed') {
                todoData.todos[todoIndex].completedAt = new Date().toISOString();
            }

            fs.writeFileSync(this.todoFile, JSON.stringify(todoData, null, 2));
        }
    }

    async saveWorkflow(workflow) {
        let workflows = [];
        if (fs.existsSync(this.workflowFile)) {
            workflows = JSON.parse(fs.readFileSync(this.workflowFile, 'utf8'));
        }

        workflows.push({
            ...workflow,
            createdAt: new Date().toISOString()
        });

        fs.writeFileSync(this.workflowFile, JSON.stringify(workflows, null, 2));
    }

    logTodoCompletion(todo) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            todoId: todo.id,
            title: todo.title,
            category: todo.category,
            priority: todo.priority,
            enhanced: todo.enhanced || false,
            enhancementLevel: todo.enhancementLevel || 0
        };

        console.log(`📝 완료 로그: ${JSON.stringify(logEntry, null, 2)}`);
    }

    async checkRemainingTodos() {
        console.log('\n🔍 남은 TODO 확인 중...');

        const todos = await this.readExistingTodos();
        const pendingTodos = todos.filter(todo => todo.status === 'pending');

        if (pendingTodos.length === 0) {
            console.log('🎉 모든 TODO가 완료되었습니다!');
            console.log('📝 새로운 앱 TODO를 생성합니다.');

            // 고도화 레벨 증가
            this.enhancementLevel++;
            console.log(`🔧 고도화 레벨 증가: ${this.enhancementLevel}`);

            // 새로운 앱 TODO 생성
            await this.generateNewTodos();
        } else {
            console.log(`📊 남은 TODO: ${pendingTodos.length}개`);
            console.log('🔄 다음 사이클에서 계속 처리합니다.');
        }
    }

    async generateNewTodos() {
        console.log('\n📝 새로운 앱 TODO 생성 중...');

        try {
            // 앱 TODO 생성기 직접 실행
            const AppTodoGenerator = require('./app-todo-generator');
            const generator = new AppTodoGenerator();

            // 기본 TODO 생성만 실행
            await generator.generateAppTodos();
            console.log('✅ 새로운 앱 TODO 생성 완료');

        } catch (error) {
            console.log(`❌ 앱 TODO 생성 오류: ${error.message}`);
        }
    }

    async prepareNextCycle() {
        console.log('\n🔄 다음 사이클 준비 중...');

        // 3초 대기 후 다음 사이클
        console.log('⏳ 3초 후 다음 사이클 시작...');
        await new Promise(resolve => setTimeout(resolve, 3000));
    }

    stop() {
        this.isRunning = false;
        console.log('🛑 TODO 고도화 시스템 중지됨');
    }
}

if (require.main === module) {
    const system = new TodoEnhancementSystem();
    system.start().catch(console.error);

    // 프로세스 종료 시 정리
    process.on('SIGINT', () => {
        console.log('\nSIGINT 수신, TODO 고도화 시스템 중지...');
        system.stop();
        process.exit(0);
    });
}
