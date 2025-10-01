const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// 통합 TODO 관리 시스템
class UnifiedTodoManager {
    constructor() {
        this.todos = new Map();
        this.categories = new Map();
        this.priorities = ['urgent', 'high', 'medium', 'low'];
        this.statuses = ['pending', 'in_progress', 'completed', 'failed', 'cancelled'];
        this.todoIdCounter = 1;
    }

    // TODO 생성
    createTodo(todoData) {
        const todoId = `TODO_${this.todoIdCounter++}`;
        const todo = {
            id: todoId,
            content: todoData.content,
            description: todoData.description || '',
            category: todoData.category || 'general',
            priority: todoData.priority || 'medium',
            status: 'pending',
            estimatedTime: todoData.estimatedTime || '1-2시간',
            dependencies: todoData.dependencies || [],
            tags: todoData.tags || [],
            assignee: todoData.assignee || null,
            createdAt: new Date(),
            updatedAt: new Date(),
            startedAt: null,
            completedAt: null,
            progress: 0,
            notes: []
        };

        this.todos.set(todoId, todo);
        return todo;
    }

    // TODO 상태 업데이트
    updateTodoStatus(todoId, status, notes = '') {
        const todo = this.todos.get(todoId);
        if (!todo) return null;

        const oldStatus = todo.status;
        todo.status = status;
        todo.updatedAt = new Date();

        if (status === 'in_progress' && oldStatus === 'pending') {
            todo.startedAt = new Date();
        }

        if (status === 'completed' || status === 'failed') {
            todo.completedAt = new Date();
        }

        if (notes) {
            todo.notes.push({
                timestamp: new Date(),
                status: status,
                note: notes
            });
        }

        return todo;
    }

    // 다음 실행할 TODO 선택
    selectNextTodo() {
        // 1. 진행 중인 TODO가 있으면 그것을 우선 실행
        const inProgressTodo = Array.from(this.todos.values())
            .find(t => t.status === 'in_progress');
        if (inProgressTodo) {
            return inProgressTodo;
        }

        // 2. 대기 중인 TODO 중에서 우선순위가 높은 것 선택
        const pendingTodos = Array.from(this.todos.values())
            .filter(t => t.status === 'pending')
            .sort((a, b) => {
                const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
                return priorityOrder[b.priority] - priorityOrder[a.priority];
            });

        return pendingTodos[0] || null;
    }

    // TODO 자동 진행
    async autoProgressTodo() {
        const nextTodo = this.selectNextTodo();
        if (!nextTodo) {
            return { success: false, message: '실행할 TODO가 없습니다.' };
        }

        // TODO를 진행 중으로 변경
        this.updateTodoStatus(nextTodo.id, 'in_progress', '자동 진행 시작');

        // 작업 시뮬레이션 (실제로는 복잡한 로직 실행)
        await this.simulateWork(nextTodo);

        // 완료 처리
        this.updateTodoStatus(nextTodo.id, 'completed', '자동 진행 완료');

        return {
            success: true,
            message: `TODO '${nextTodo.content}' 자동 진행 완료`,
            todo: nextTodo
        };
    }

    // 작업 시뮬레이션
    async simulateWork(todo) {
        const workTime = this.getEstimatedWorkTime(todo.estimatedTime);
        await new Promise(resolve => setTimeout(resolve, workTime));
    }

    // 예상 작업 시간을 밀리초로 변환
    getEstimatedWorkTime(estimatedTime) {
        const timeMap = {
            '30분': 5000,      // 5초 (테스트용)
            '1시간': 10000,    // 10초 (테스트용)
            '1-2시간': 15000,  // 15초 (테스트용)
            '2-4시간': 20000,  // 20초 (테스트용)
            '4-8시간': 25000   // 25초 (테스트용)
        };
        return timeMap[estimatedTime] || 10000;
    }

    // TODO 목록 조회
    getTodos(filters = {}) {
        let todos = Array.from(this.todos.values());

        if (filters.status) {
            todos = todos.filter(t => t.status === filters.status);
        }

        if (filters.category) {
            todos = todos.filter(t => t.category === filters.category);
        }

        if (filters.priority) {
            todos = todos.filter(t => t.priority === filters.priority);
        }

        return todos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    // 통계 조회
    getStats() {
        const todos = Array.from(this.todos.values());
        const stats = {
            total: todos.length,
            pending: todos.filter(t => t.status === 'pending').length,
            inProgress: todos.filter(t => t.status === 'in_progress').length,
            completed: todos.filter(t => t.status === 'completed').length,
            failed: todos.filter(t => t.status === 'failed').length,
            cancelled: todos.filter(t => t.status === 'cancelled').length
        };

        stats.completionRate = stats.total > 0 ?
            (stats.completed / stats.total * 100).toFixed(1) : 0;

        return stats;
    }

    // TODO 생성 (간소화된 호명)
    createTodoFromSimpleRequest(request) {
        const todoData = {
            content: request,
            category: 'general',
            priority: 'medium',
            estimatedTime: '1-2시간'
        };

        return this.createTodo(todoData);
    }
}

// 전역 TODO 매니저 인스턴스
const todoManager = new UnifiedTodoManager();

// 미들웨어: 인증 확인
const authenticateUser = (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ success: false, message: '인증이 필요합니다.' });
    }
    req.user = { id: 'user1', role: 'admin' };
    next();
};

// 간소화된 TODO 진행 엔드포인트
router.post('/progress', authenticateUser, async (req, res) => {
    try {
        const result = await todoManager.autoProgressTodo();

        res.json({
            success: result.success,
            message: result.message,
            data: result.todo ? {
                todo: result.todo,
                stats: todoManager.getStats()
            } : null
        });
    } catch (error) {
        console.error('TODO 진행 오류:', error);
        res.status(500).json({
            success: false,
            message: 'TODO 진행 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// TODO 생성 (간소화된 호명)
router.post('/create', authenticateUser, async (req, res) => {
    try {
        const { request } = req.body;

        if (!request) {
            return res.status(400).json({
                success: false,
                message: '요청 내용이 필요합니다.'
            });
        }

        const todo = todoManager.createTodoFromSimpleRequest(request);

        res.json({
            success: true,
            message: 'TODO가 생성되었습니다.',
            data: todo
        });
    } catch (error) {
        console.error('TODO 생성 오류:', error);
        res.status(500).json({
            success: false,
            message: 'TODO 생성 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// TODO 목록 조회
router.get('/', authenticateUser, async (req, res) => {
    try {
        const { status, category, priority } = req.query;
        const todos = todoManager.getTodos({ status, category, priority });

        res.json({
            success: true,
            data: {
                todos,
                stats: todoManager.getStats()
            }
        });
    } catch (error) {
        console.error('TODO 목록 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: 'TODO 목록 조회 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// TODO 상태 업데이트
router.put('/:id/status', authenticateUser, async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes } = req.body;

        const todo = todoManager.updateTodoStatus(id, status, notes);

        if (!todo) {
            return res.status(404).json({
                success: false,
                message: 'TODO를 찾을 수 없습니다.'
            });
        }

        res.json({
            success: true,
            message: 'TODO 상태가 업데이트되었습니다.',
            data: todo
        });
    } catch (error) {
        console.error('TODO 상태 업데이트 오류:', error);
        res.status(500).json({
            success: false,
            message: 'TODO 상태 업데이트 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 통계 조회
router.get('/stats', authenticateUser, async (req, res) => {
    try {
        const stats = todoManager.getStats();

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('통계 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '통계 조회 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

module.exports = router;
