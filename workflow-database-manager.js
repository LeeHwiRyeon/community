const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

/**
 * 워크플로우 데이터베이스 관리자
 * 전체 작업 흐름을 데이터베이스로 관리
 */
class WorkflowDatabaseManager {
    constructor() {
        this.dbPath = path.join(__dirname, 'workflow-database.json');
        this.todoPath = path.join(__dirname, 'todo-database.json');
        this.conversationPath = path.join(__dirname, 'conversation-database.json');
        this.dependencyPath = path.join(__dirname, 'dependency-database.json');

        this.initializeDatabases();
    }

    /**
     * 데이터베이스 초기화
     */
    initializeDatabases() {
        const databases = [
            { path: this.dbPath, default: { workflows: [], lastUpdated: new Date().toISOString() } },
            { path: this.todoPath, default: { todos: [], lastUpdated: new Date().toISOString() } },
            { path: this.conversationPath, default: { conversations: [], lastUpdated: new Date().toISOString() } },
            { path: this.dependencyPath, default: { dependencies: [], lastUpdated: new Date().toISOString() } }
        ];

        databases.forEach(({ path: dbPath, default: defaultData }) => {
            if (!fs.existsSync(dbPath)) {
                fs.writeFileSync(dbPath, JSON.stringify(defaultData, null, 2));
            }
        });
    }

    /**
     * 워크플로우 생성
     */
    createWorkflow(title, description, priority = 'medium', category = 'general') {
        const workflow = {
            id: uuidv4(),
            title,
            description,
            priority,
            category,
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            tasks: [],
            todos: [],
            conversationLog: [],
            dependencies: [],
            metadata: {
                estimatedTotalTime: '0시간',
                complexity: 'medium',
                canParallelize: false,
                progress: 0
            }
        };

        this.saveWorkflow(workflow);
        console.log(`✅ 워크플로우 생성: ${title} (${workflow.id})`);
        return workflow;
    }

    /**
     * 워크플로우 저장
     */
    saveWorkflow(workflow) {
        const data = this.loadWorkflows();

        // 안전하게 workflows 배열 확인
        if (!data.workflows) {
            data.workflows = [];
        }

        const existingIndex = data.workflows.findIndex(w => w.id === workflow.id);

        if (existingIndex >= 0) {
            data.workflows[existingIndex] = workflow;
        } else {
            data.workflows.push(workflow);
        }

        data.lastUpdated = new Date().toISOString();
        fs.writeFileSync(this.dbPath, JSON.stringify(data, null, 2));
    }

    /**
     * 워크플로우 로드
     */
    loadWorkflows() {
        try {
            const data = JSON.parse(fs.readFileSync(this.dbPath, 'utf8'));
            // 안전하게 데이터 구조 확인
            if (!data.workflows) {
                data.workflows = [];
            }
            return data;
        } catch (error) {
            console.error('워크플로우 로드 오류:', error);
            return { workflows: [], lastUpdated: new Date().toISOString() };
        }
    }

    /**
     * 워크플로우 조회
     */
    getWorkflow(workflowId) {
        const data = this.loadWorkflows();
        return data.workflows.find(w => w.id === workflowId);
    }

    /**
     * 모든 워크플로우 조회
     */
    getAllWorkflows() {
        const data = this.loadWorkflows();
        return data.workflows;
    }

    /**
     * 워크플로우 상태 업데이트
     */
    updateWorkflowStatus(workflowId, status) {
        const workflow = this.getWorkflow(workflowId);
        if (!workflow) return false;

        workflow.status = status;
        workflow.updatedAt = new Date().toISOString();
        this.saveWorkflow(workflow);
        return true;
    }

    /**
     * 작업 추가
     */
    addTask(workflowId, task) {
        const workflow = this.getWorkflow(workflowId);
        if (!workflow) return false;

        const newTask = {
            id: uuidv4(),
            ...task,
            status: 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        if (!workflow.tasks) {
            workflow.tasks = [];
        }
        workflow.tasks.push(newTask);
        workflow.updatedAt = new Date().toISOString();
        this.saveWorkflow(workflow);

        console.log(`✅ 작업 추가: ${newTask.title} (${newTask.id})`);
        return newTask;
    }

    /**
     * 작업 상태 업데이트
     */
    updateTaskStatus(workflowId, taskId, status) {
        const workflow = this.getWorkflow(workflowId);
        if (!workflow) return false;

        const task = workflow.tasks.find(t => t.id === taskId);
        if (!task) return false;

        task.status = status;
        task.updatedAt = new Date().toISOString();

        if (status === 'completed') {
            task.completedAt = new Date().toISOString();
        }

        workflow.updatedAt = new Date().toISOString();
        this.saveWorkflow(workflow);

        // 진행률 업데이트
        this.updateWorkflowProgress(workflowId);

        console.log(`✅ 작업 상태 업데이트: ${task.title} -> ${status}`);
        return true;
    }

    /**
     * 워크플로우 진행률 업데이트
     */
    updateWorkflowProgress(workflowId) {
        const workflow = this.getWorkflow(workflowId);
        if (!workflow) return;

        const completedTasks = workflow.tasks.filter(task => task.status === 'completed').length;
        const totalTasks = workflow.tasks.length;
        const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

        workflow.metadata.progress = Math.round(progress);
        workflow.updatedAt = new Date().toISOString();
        this.saveWorkflow(workflow);

        // 모든 작업이 완료되면 워크플로우 완료
        if (progress === 100 && workflow.status === 'active') {
            this.updateWorkflowStatus(workflowId, 'completed');
            console.log(`🎉 워크플로우 완료: ${workflow.title}`);
        }
    }

    /**
     * TODO 생성
     */
    createTodo(workflowId, taskId, todo) {
        const newTodo = {
            id: uuidv4(),
            workflowId,
            taskId,
            ...todo,
            status: 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const data = this.loadTodos();
        if (!data.todos) {
            data.todos = [];
        }
        data.todos.push(newTodo);
        data.lastUpdated = new Date().toISOString();
        fs.writeFileSync(this.todoPath, JSON.stringify(data, null, 2));

        console.log(`✅ TODO 생성: ${newTodo.title} (${newTodo.id})`);
        return newTodo;
    }

    /**
     * TODO 로드
     */
    loadTodos() {
        try {
            return JSON.parse(fs.readFileSync(this.todoPath, 'utf8'));
        } catch (error) {
            console.error('TODO 로드 오류:', error);
            return { todos: [], lastUpdated: new Date().toISOString() };
        }
    }

    /**
     * TODO 상태 업데이트
     */
    updateTodoStatus(todoId, status) {
        const data = this.loadTodos();
        const todo = data.todos.find(t => t.id === todoId);
        if (!todo) return false;

        todo.status = status;
        todo.updatedAt = new Date().toISOString();

        if (status === 'completed') {
            todo.completedAt = new Date().toISOString();
        }

        data.lastUpdated = new Date().toISOString();
        fs.writeFileSync(this.todoPath, JSON.stringify(data, null, 2));

        console.log(`✅ TODO 상태 업데이트: ${todo.title} -> ${status}`);
        return true;
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

        const data = this.loadConversations();
        if (!data.conversations) {
            data.conversations = [];
        }
        data.conversations.push(conversation);
        data.lastUpdated = new Date().toISOString();
        fs.writeFileSync(this.conversationPath, JSON.stringify(data, null, 2));

        // 워크플로우에도 추가
        const workflow = this.getWorkflow(workflowId);
        if (workflow) {
            if (!workflow.conversationLog) {
                workflow.conversationLog = [];
            }
            workflow.conversationLog.push(conversation);
            this.saveWorkflow(workflow);
        }

        return conversation;
    }

    /**
     * 대화 기록 로드
     */
    loadConversations() {
        try {
            return JSON.parse(fs.readFileSync(this.conversationPath, 'utf8'));
        } catch (error) {
            console.error('대화 기록 로드 오류:', error);
            return { conversations: [], lastUpdated: new Date().toISOString() };
        }
    }

    /**
     * 의존성 추가
     */
    addDependency(workflowId, fromTaskId, toTaskId, dependencyType = 'blocks') {
        const dependency = {
            id: uuidv4(),
            workflowId,
            fromTaskId,
            toTaskId,
            dependencyType,
            createdAt: new Date().toISOString()
        };

        const data = this.loadDependencies();
        if (!data.dependencies) {
            data.dependencies = [];
        }
        data.dependencies.push(dependency);
        data.lastUpdated = new Date().toISOString();
        fs.writeFileSync(this.dependencyPath, JSON.stringify(data, null, 2));

        console.log(`✅ 의존성 추가: ${fromTaskId} -> ${toTaskId} (${dependencyType})`);
        return dependency;
    }

    /**
     * 의존성 로드
     */
    loadDependencies() {
        try {
            return JSON.parse(fs.readFileSync(this.dependencyPath, 'utf8'));
        } catch (error) {
            console.error('의존성 로드 오류:', error);
            return { dependencies: [], lastUpdated: new Date().toISOString() };
        }
    }

    /**
     * 워크플로우 통계
     */
    getWorkflowStats() {
        const workflows = this.getAllWorkflows();
        const todosData = this.loadTodos();
        const conversationsData = this.loadConversations();

        // 안전하게 데이터 접근
        const todos = todosData && todosData.todos ? todosData.todos : [];
        const conversations = conversationsData && conversationsData.conversations ? conversationsData.conversations : [];

        const stats = {
            totalWorkflows: workflows ? workflows.length : 0,
            activeWorkflows: workflows ? workflows.filter(w => w.status === 'active').length : 0,
            completedWorkflows: workflows ? workflows.filter(w => w.status === 'completed').length : 0,
            totalTasks: workflows ? workflows.reduce((sum, w) => sum + (w.tasks ? w.tasks.length : 0), 0) : 0,
            completedTasks: workflows ? workflows.reduce((sum, w) =>
                sum + (w.tasks ? w.tasks.filter(t => t.status === 'completed').length : 0), 0) : 0,
            totalTodos: todos ? todos.length : 0,
            completedTodos: todos ? todos.filter(t => t.status === 'completed').length : 0,
            totalConversations: conversations ? conversations.length : 0,
            averageProgress: workflows && workflows.length > 0 ?
                workflows.reduce((sum, w) => sum + (w.metadata ? w.metadata.progress : 0), 0) / workflows.length : 0
        };

        return stats;
    }

    /**
     * 워크플로우 리포트 생성
     */
    generateReport() {
        const stats = this.getWorkflowStats();
        const workflows = this.getAllWorkflows();

        console.log('\n📊 워크플로우 데이터베이스 리포트');
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

        console.log('\n📋 워크플로우 목록:');
        workflows.forEach((workflow, index) => {
            console.log(`${index + 1}. ${workflow.title}`);
            console.log(`   ID: ${workflow.id}`);
            console.log(`   상태: ${workflow.status} (${workflow.metadata.progress}%)`);
            console.log(`   우선순위: ${workflow.priority}`);
            console.log(`   작업: ${workflow.tasks.length}개`);
            console.log(`   생성일: ${new Date(workflow.createdAt).toLocaleString()}`);
            console.log('');
        });

        return stats;
    }

    /**
     * 데이터 정리
     */
    cleanupData() {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - 30); // 30일 이전 데이터

        // 완료된 워크플로우 아카이브
        const workflows = this.getAllWorkflows();
        const activeWorkflows = workflows.filter(w =>
            w.status === 'active' || new Date(w.updatedAt) > cutoffDate
        );

        if (activeWorkflows.length !== workflows.length) {
            const data = { workflows: activeWorkflows, lastUpdated: new Date().toISOString() };
            fs.writeFileSync(this.dbPath, JSON.stringify(data, null, 2));
            console.log(`🧹 데이터 정리 완료: ${workflows.length - activeWorkflows.length}개 워크플로우 아카이브`);
        }

        return activeWorkflows.length;
    }
}

// CLI 인터페이스
if (require.main === module) {
    const manager = new WorkflowDatabaseManager();
    const command = process.argv[2];
    const args = process.argv.slice(3);

    switch (command) {
        case 'create':
            if (args.length >= 2) {
                const [title, description, priority, category] = args;
                manager.createWorkflow(title, description, priority, category);
            } else {
                console.log('사용법: node workflow-database-manager.js create "제목" "설명" [우선순위] [카테고리]');
            }
            break;

        case 'list':
            manager.generateReport();
            break;

        case 'stats':
            const stats = manager.getWorkflowStats();
            console.log(JSON.stringify(stats, null, 2));
            break;

        case 'cleanup':
            manager.cleanupData();
            break;

        default:
            console.log('사용법:');
            console.log('  create "제목" "설명" [우선순위] [카테고리] - 워크플로우 생성');
            console.log('  list - 워크플로우 목록 및 리포트');
            console.log('  stats - 통계 정보');
            console.log('  cleanup - 데이터 정리');
            break;
    }
}

module.exports = WorkflowDatabaseManager;
