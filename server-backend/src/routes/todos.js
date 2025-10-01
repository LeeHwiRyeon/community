const express = require('express');
const Todo = require('../models/Todo');
const auth = require('../middleware/auth');
const { body, validationResult, query } = require('express-validator');

const router = express.Router();

// 모든 TODO 조회 (필터링, 정렬, 페이지네이션)
router.get('/', auth, [
    query('status').optional().isIn(['pending', 'in_progress', 'completed', 'cancelled', 'on_hold']),
    query('priority').optional().isInt({ min: 1, max: 5 }),
    query('category').optional().isIn(['feature', 'bug', 'improvement', 'documentation', 'testing', 'refactoring', 'deployment']),
    query('assignee').optional().isMongoId(),
    query('project').optional().isMongoId(),
    query('sprint').optional().isMongoId(),
    query('overdue').optional().isBoolean(),
    query('search').optional().isString(),
    query('sortBy').optional().isIn(['createdAt', 'dueDate', 'priority', 'status', 'lastActivityAt']),
    query('sortOrder').optional().isIn(['asc', 'desc']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const {
            status,
            priority,
            category,
            assignee,
            project,
            sprint,
            overdue,
            search,
            sortBy = 'lastActivityAt',
            sortOrder = 'desc',
            page = 1,
            limit = 20
        } = req.query;

        // 필터 구성
        const filter = { isArchived: false };

        if (status) filter.status = status;
        if (priority) filter.priority = parseInt(priority);
        if (category) filter.category = category;
        if (assignee) filter.assignee = assignee;
        if (project) filter.project = project;
        if (sprint) filter.sprint = sprint;

        if (overdue === 'true') {
            filter.dueDate = { $lt: new Date() };
            filter.status = { $nin: ['completed', 'cancelled'] };
        }

        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { tags: { $in: [new RegExp(search, 'i')] } }
            ];
        }

        // 정렬 구성
        const sort = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

        // 페이지네이션
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const todos = await Todo.find(filter)
            .populate('assignee', 'name email avatar')
            .populate('creator', 'name email avatar')
            .populate('project', 'name')
            .populate('sprint', 'name')
            .populate('comments.user', 'name avatar')
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Todo.countDocuments(filter);

        res.json({
            success: true,
            data: todos,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('TODO 조회 오류:', error);
        res.status(500).json({ error: 'TODO 조회 중 오류가 발생했습니다.' });
    }
});

// 특정 TODO 조회
router.get('/:id', auth, async (req, res) => {
    try {
        const todo = await Todo.findById(req.params.id)
            .populate('assignee', 'name email avatar')
            .populate('creator', 'name email avatar')
            .populate('project', 'name')
            .populate('sprint', 'name')
            .populate('comments.user', 'name avatar')
            .populate('dependencies', 'title status priority')
            .populate('watchers', 'name email avatar');

        if (!todo) {
            return res.status(404).json({ error: 'TODO를 찾을 수 없습니다.' });
        }

        res.json({ success: true, data: todo });
    } catch (error) {
        console.error('TODO 조회 오류:', error);
        res.status(500).json({ error: 'TODO 조회 중 오류가 발생했습니다.' });
    }
});

// TODO 생성
router.post('/', auth, [
    body('title').notEmpty().withMessage('제목은 필수입니다.').isLength({ max: 200 }),
    body('description').optional().isLength({ max: 1000 }),
    body('status').optional().isIn(['pending', 'in_progress', 'completed', 'cancelled', 'on_hold']),
    body('priority').optional().isInt({ min: 1, max: 5 }),
    body('category').optional().isIn(['feature', 'bug', 'improvement', 'documentation', 'testing', 'refactoring', 'deployment']),
    body('assignee').isMongoId().withMessage('담당자는 필수입니다.'),
    body('dueDate').optional().isISO8601(),
    body('estimatedHours').optional().isFloat({ min: 0 }),
    body('tags').optional().isArray(),
    body('dependencies').optional().isArray(),
    body('subtasks').optional().isArray()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const todoData = {
            ...req.body,
            creator: req.user.id
        };

        const todo = new Todo(todoData);
        await todo.save();

        await todo.populate([
            { path: 'assignee', select: 'name email avatar' },
            { path: 'creator', select: 'name email avatar' },
            { path: 'project', select: 'name' },
            { path: 'sprint', select: 'name' }
        ]);

        res.status(201).json({ success: true, data: todo });
    } catch (error) {
        console.error('TODO 생성 오류:', error);
        res.status(500).json({ error: 'TODO 생성 중 오류가 발생했습니다.' });
    }
});

// TODO 수정
router.put('/:id', auth, [
    body('title').optional().isLength({ max: 200 }),
    body('description').optional().isLength({ max: 1000 }),
    body('status').optional().isIn(['pending', 'in_progress', 'completed', 'cancelled', 'on_hold']),
    body('priority').optional().isInt({ min: 1, max: 5 }),
    body('category').optional().isIn(['feature', 'bug', 'improvement', 'documentation', 'testing', 'refactoring', 'deployment']),
    body('assignee').optional().isMongoId(),
    body('dueDate').optional().isISO8601(),
    body('estimatedHours').optional().isFloat({ min: 0 }),
    body('actualHours').optional().isFloat({ min: 0 }),
    body('tags').optional().isArray(),
    body('dependencies').optional().isArray(),
    body('subtasks').optional().isArray()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const todo = await Todo.findById(req.params.id);
        if (!todo) {
            return res.status(404).json({ error: 'TODO를 찾을 수 없습니다.' });
        }

        // 권한 확인 (담당자 또는 생성자만 수정 가능)
        if (!todo.assignee.equals(req.user.id) && !todo.creator.equals(req.user.id)) {
            return res.status(403).json({ error: 'TODO를 수정할 권한이 없습니다.' });
        }

        Object.assign(todo, req.body);
        await todo.save();

        await todo.populate([
            { path: 'assignee', select: 'name email avatar' },
            { path: 'creator', select: 'name email avatar' },
            { path: 'project', select: 'name' },
            { path: 'sprint', select: 'name' },
            { path: 'comments.user', select: 'name avatar' }
        ]);

        res.json({ success: true, data: todo });
    } catch (error) {
        console.error('TODO 수정 오류:', error);
        res.status(500).json({ error: 'TODO 수정 중 오류가 발생했습니다.' });
    }
});

// TODO 삭제
router.delete('/:id', auth, async (req, res) => {
    try {
        const todo = await Todo.findById(req.params.id);
        if (!todo) {
            return res.status(404).json({ error: 'TODO를 찾을 수 없습니다.' });
        }

        // 권한 확인 (생성자만 삭제 가능)
        if (!todo.creator.equals(req.user.id)) {
            return res.status(403).json({ error: 'TODO를 삭제할 권한이 없습니다.' });
        }

        await Todo.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'TODO가 삭제되었습니다.' });
    } catch (error) {
        console.error('TODO 삭제 오류:', error);
        res.status(500).json({ error: 'TODO 삭제 중 오류가 발생했습니다.' });
    }
});

// TODO 상태 변경
router.patch('/:id/status', auth, [
    body('status').isIn(['pending', 'in_progress', 'completed', 'cancelled', 'on_hold']).withMessage('유효하지 않은 상태입니다.')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const todo = await Todo.findById(req.params.id);
        if (!todo) {
            return res.status(404).json({ error: 'TODO를 찾을 수 없습니다.' });
        }

        // 권한 확인
        if (!todo.assignee.equals(req.user.id) && !todo.creator.equals(req.user.id)) {
            return res.status(403).json({ error: 'TODO 상태를 변경할 권한이 없습니다.' });
        }

        todo.status = req.body.status;
        await todo.save();

        await todo.populate([
            { path: 'assignee', select: 'name email avatar' },
            { path: 'creator', select: 'name email avatar' }
        ]);

        res.json({ success: true, data: todo });
    } catch (error) {
        console.error('TODO 상태 변경 오류:', error);
        res.status(500).json({ error: 'TODO 상태 변경 중 오류가 발생했습니다.' });
    }
});

// 댓글 추가
router.post('/:id/comments', auth, [
    body('content').notEmpty().withMessage('댓글 내용은 필수입니다.').isLength({ max: 500 })
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const todo = await Todo.findById(req.params.id);
        if (!todo) {
            return res.status(404).json({ error: 'TODO를 찾을 수 없습니다.' });
        }

        await todo.addComment(req.user.id, req.body.content);

        await todo.populate([
            { path: 'comments.user', select: 'name avatar' }
        ]);

        res.json({ success: true, data: todo });
    } catch (error) {
        console.error('댓글 추가 오류:', error);
        res.status(500).json({ error: '댓글 추가 중 오류가 발생했습니다.' });
    }
});

// 서브태스크 추가
router.post('/:id/subtasks', auth, [
    body('title').notEmpty().withMessage('서브태스크 제목은 필수입니다.')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const todo = await Todo.findById(req.params.id);
        if (!todo) {
            return res.status(404).json({ error: 'TODO를 찾을 수 없습니다.' });
        }

        await todo.addSubtask(req.body.title);
        res.json({ success: true, data: todo });
    } catch (error) {
        console.error('서브태스크 추가 오류:', error);
        res.status(500).json({ error: '서브태스크 추가 중 오류가 발생했습니다.' });
    }
});

// 서브태스크 완료
router.patch('/:id/subtasks/:subtaskIndex', auth, async (req, res) => {
    try {
        const todo = await Todo.findById(req.params.id);
        if (!todo) {
            return res.status(404).json({ error: 'TODO를 찾을 수 없습니다.' });
        }

        const subtaskIndex = parseInt(req.params.subtaskIndex);
        if (subtaskIndex < 0 || subtaskIndex >= todo.subtasks.length) {
            return res.status(400).json({ error: '유효하지 않은 서브태스크 인덱스입니다.' });
        }

        await todo.completeSubtask(subtaskIndex);
        res.json({ success: true, data: todo });
    } catch (error) {
        console.error('서브태스크 완료 오류:', error);
        res.status(500).json({ error: '서브태스크 완료 중 오류가 발생했습니다.' });
    }
});

// TODO 통계 조회
router.get('/stats/overview', auth, async (req, res) => {
    try {
        const { project, assignee, sprint } = req.query;
        const filters = { isArchived: false };

        if (project) filters.project = project;
        if (assignee) filters.assignee = assignee;
        if (sprint) filters.sprint = sprint;

        const stats = await Todo.getStats(filters);

        // 카테고리별 통계
        const categoryStats = await Todo.aggregate([
            { $match: filters },
            { $group: { _id: '$category', count: { $sum: 1 } } }
        ]);

        // 우선순위별 통계
        const priorityStats = await Todo.aggregate([
            { $match: filters },
            { $group: { _id: '$priority', count: { $sum: 1 } } }
        ]);

        // 마감일 임박 (3일 이내)
        const upcomingDeadlines = await Todo.find({
            ...filters,
            dueDate: {
                $gte: new Date(),
                $lte: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
            },
            status: { $nin: ['completed', 'cancelled'] }
        }).populate('assignee', 'name email');

        res.json({
            success: true,
            data: {
                statusStats: stats,
                categoryStats,
                priorityStats,
                upcomingDeadlines
            }
        });
    } catch (error) {
        console.error('TODO 통계 조회 오류:', error);
        res.status(500).json({ error: 'TODO 통계 조회 중 오류가 발생했습니다.' });
    }
});

module.exports = router;
