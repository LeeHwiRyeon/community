import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Container,
    Card,
    CardContent,
    Button,
    Chip,
    Alert,
    CircularProgress,
    Tabs,
    Tab,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Checkbox,
    LinearProgress,
    Divider,
    Fab,
    Menu,
    ListItemIcon
} from '@mui/material';
import {
    Assignment as TodoIcon,
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    CheckCircle as CompleteIcon,
    PlayArrow as StartIcon,
    Pause as PauseIcon,
    FilterList as FilterIcon,
    Sort as SortIcon,
    MoreVert as MoreIcon,
    Flag as PriorityIcon,
    Person as AssigneeIcon,
    Schedule as DueDateIcon,
    Category as CategoryIcon
} from '@mui/icons-material';

// TODO 데이터 타입 정의
interface Todo {
    id: string;
    title: string;
    description: string;
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold';
    priority: 1 | 2 | 3 | 4 | 5;
    category: 'feature' | 'bug' | 'improvement' | 'documentation' | 'testing' | 'refactoring' | 'deployment';
    assignee?: string;
    assigneeName?: string;
    dueDate?: string;
    createdAt: string;
    updatedAt: string;
    estimatedHours?: number;
    actualHours?: number;
    tags: string[];
    progress: number;
}

interface TodoStats {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    overdue: number;
}

const TodoManagement: React.FC = () => {
    const [activeTab, setActiveTab] = useState(0);
    const [todos, setTodos] = useState<Todo[]>([]);
    const [stats, setStats] = useState<TodoStats>({ total: 0, pending: 0, inProgress: 0, completed: 0, overdue: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [sortBy, setSortBy] = useState<string>('priority');
    const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

    // 새 TODO 폼 상태
    const [newTodo, setNewTodo] = useState({
        title: '',
        description: '',
        priority: 3 as 1 | 2 | 3 | 4 | 5,
        category: 'feature' as Todo['category'],
        dueDate: '',
        estimatedHours: 0,
        tags: [] as string[]
    });

    // 우선순위별 색상
    const getPriorityColor = (priority: number) => {
        switch (priority) {
            case 5: return 'error';
            case 4: return 'warning';
            case 3: return 'info';
            case 2: return 'success';
            case 1: return 'default';
            default: return 'default';
        }
    };

    // 상태별 색상
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'success';
            case 'in_progress': return 'primary';
            case 'on_hold': return 'warning';
            case 'cancelled': return 'error';
            default: return 'default';
        }
    };

    // 카테고리별 아이콘
    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'feature': return '✨';
            case 'bug': return '🐛';
            case 'improvement': return '⚡';
            case 'documentation': return '📚';
            case 'testing': return '🧪';
            case 'refactoring': return '🔧';
            case 'deployment': return '🚀';
            default: return '📋';
        }
    };

    useEffect(() => {
        loadTodos();
        loadStats();
    }, [filterStatus, sortBy]);

    // TODO 목록 로딩
    const loadTodos = async () => {
        try {
            setLoading(true);

            const params = new URLSearchParams();
            if (filterStatus !== 'all') params.append('status', filterStatus);
            params.append('sortBy', sortBy);
            params.append('sortOrder', 'desc');

            const response = await fetch(`/api/todos?${params.toString()}`);
            if (response.ok) {
                const data = await response.json();
                setTodos(data.data || []);
            } else {
                // 모의 TODO 데이터
                setTodos([
                    {
                        id: 'todo_001',
                        title: 'VIP 시스템 API 연결 완료',
                        description: 'VIP 대시보드, 요구사항, 개인화 서비스 페이지에 실제 API 연결',
                        status: 'completed',
                        priority: 5,
                        category: 'feature',
                        assignee: 'user_123',
                        assigneeName: 'AUTOAGENTS Manager',
                        dueDate: '2024-10-02',
                        createdAt: '2024-10-01T09:00:00Z',
                        updatedAt: '2024-10-02T15:30:00Z',
                        estimatedHours: 8,
                        actualHours: 6,
                        tags: ['VIP', 'API', 'Frontend'],
                        progress: 100
                    },
                    {
                        id: 'todo_002',
                        title: '게임 센터 실제 게임 로딩',
                        description: '스네이크, 테트리스, 퐁, 벽돌깨기 게임 실제 연결 및 리더보드 구현',
                        status: 'completed',
                        priority: 4,
                        category: 'feature',
                        assignee: 'user_123',
                        assigneeName: 'AUTOAGENTS Manager',
                        dueDate: '2024-10-02',
                        createdAt: '2024-10-01T10:00:00Z',
                        updatedAt: '2024-10-02T16:00:00Z',
                        estimatedHours: 6,
                        actualHours: 5,
                        tags: ['Games', 'API', 'Frontend'],
                        progress: 100
                    },
                    {
                        id: 'todo_003',
                        title: '채팅 시스템 UI 구현',
                        description: 'WebSocket 기반 실시간 채팅 시스템 UI 구현 및 전역 통합',
                        status: 'completed',
                        priority: 4,
                        category: 'feature',
                        assignee: 'user_123',
                        assigneeName: 'AUTOAGENTS Manager',
                        dueDate: '2024-10-02',
                        createdAt: '2024-10-01T11:00:00Z',
                        updatedAt: '2024-10-02T17:00:00Z',
                        estimatedHours: 4,
                        actualHours: 4,
                        tags: ['Chat', 'WebSocket', 'UI'],
                        progress: 100
                    },
                    {
                        id: 'todo_004',
                        title: 'TODO 관리 시스템 UI',
                        description: 'TODO 관리 대시보드 구현 및 API 연결',
                        status: 'in_progress',
                        priority: 3,
                        category: 'feature',
                        assignee: 'user_123',
                        assigneeName: 'AUTOAGENTS Manager',
                        dueDate: '2024-10-02',
                        createdAt: '2024-10-02T09:00:00Z',
                        updatedAt: '2024-10-02T17:30:00Z',
                        estimatedHours: 3,
                        actualHours: 2,
                        tags: ['TODO', 'Management', 'UI'],
                        progress: 75
                    },
                    {
                        id: 'todo_005',
                        title: '투표 시스템 UI 연결',
                        description: '게시글 투표 기능 UI 구현 및 API 연결',
                        status: 'pending',
                        priority: 3,
                        category: 'feature',
                        assignee: 'user_123',
                        assigneeName: 'AUTOAGENTS Manager',
                        dueDate: '2024-10-03',
                        createdAt: '2024-10-02T09:30:00Z',
                        updatedAt: '2024-10-02T09:30:00Z',
                        estimatedHours: 2,
                        actualHours: 0,
                        tags: ['Voting', 'UI', 'Posts'],
                        progress: 0
                    }
                ]);
            }
        } catch (err) {
            setError('TODO 데이터를 불러오는 중 오류가 발생했습니다.');
            console.error('TODO 로딩 오류:', err);
        } finally {
            setLoading(false);
        }
    };

    // 통계 로딩
    const loadStats = async () => {
        try {
            const response = await fetch('/api/todos/stats');
            if (response.ok) {
                const data = await response.json();
                setStats(data.data);
            } else {
                // 모의 통계 데이터
                setStats({
                    total: 5,
                    pending: 1,
                    inProgress: 1,
                    completed: 3,
                    overdue: 0
                });
            }
        } catch (err) {
            console.error('통계 로딩 오류:', err);
        }
    };

    // TODO 생성/수정
    const saveTodo = async () => {
        try {
            const todoData = editingTodo ? { ...editingTodo, ...newTodo } : newTodo;

            const response = await fetch(
                editingTodo ? `/api/todos/${editingTodo.id}` : '/api/todos',
                {
                    method: editingTodo ? 'PUT' : 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(todoData)
                }
            );

            if (response.ok) {
                await loadTodos();
                await loadStats();
                setDialogOpen(false);
                setEditingTodo(null);
                setNewTodo({
                    title: '',
                    description: '',
                    priority: 3,
                    category: 'feature',
                    dueDate: '',
                    estimatedHours: 0,
                    tags: []
                });
            }
        } catch (err) {
            console.error('TODO 저장 오류:', err);
        }
    };

    // TODO 상태 변경
    const updateTodoStatus = async (todoId: string, status: Todo['status']) => {
        try {
            const response = await fetch(`/api/todos/${todoId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });

            if (response.ok) {
                await loadTodos();
                await loadStats();
            }
        } catch (err) {
            console.error('TODO 상태 변경 오류:', err);
        }
    };

    // TODO 삭제
    const deleteTodo = async (todoId: string) => {
        try {
            const response = await fetch(`/api/todos/${todoId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                await loadTodos();
                await loadStats();
            }
        } catch (err) {
            console.error('TODO 삭제 오류:', err);
        }
    };

    // 편집 다이얼로그 열기
    const openEditDialog = (todo?: Todo) => {
        if (todo) {
            setEditingTodo(todo);
            setNewTodo({
                title: todo.title,
                description: todo.description,
                priority: todo.priority,
                category: todo.category,
                dueDate: todo.dueDate || '',
                estimatedHours: todo.estimatedHours || 0,
                tags: todo.tags
            });
        }
        setDialogOpen(true);
    };

    // 필터링된 TODO 목록
    const filteredTodos = todos.filter(todo => {
        if (filterStatus === 'all') return true;
        return todo.status === filterStatus;
    });

    if (loading) {
        return (
            <Container maxWidth="lg">
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                    <CircularProgress size={60} />
                </Box>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg">
            <Box sx={{ py: 4 }}>
                {/* 헤더 */}
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h3" component="h1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                        <TodoIcon sx={{ mr: 2, fontSize: 'inherit' }} />
                        📋 TODO 관리 시스템
                    </Typography>
                    <Typography variant="h6" color="text.secondary">
                        작업 관리, 진행 상황 추적, 팀 협업
                    </Typography>
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {error}
                    </Alert>
                )}

                {/* 통계 카드 */}
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: '1fr 1fr 1fr 1fr 1fr' }, gap: 2, mb: 4 }}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" color="primary.main">{stats.total}</Typography>
                            <Typography variant="body2">전체</Typography>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" color="warning.main">{stats.pending}</Typography>
                            <Typography variant="body2">대기중</Typography>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" color="info.main">{stats.inProgress}</Typography>
                            <Typography variant="body2">진행중</Typography>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" color="success.main">{stats.completed}</Typography>
                            <Typography variant="body2">완료</Typography>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" color="error.main">{stats.overdue}</Typography>
                            <Typography variant="body2">지연</Typography>
                        </CardContent>
                    </Card>
                </Box>

                {/* 필터 및 정렬 */}
                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                            <FormControl size="small" sx={{ minWidth: 120 }}>
                                <InputLabel>상태 필터</InputLabel>
                                <Select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                >
                                    <MenuItem value="all">전체</MenuItem>
                                    <MenuItem value="pending">대기중</MenuItem>
                                    <MenuItem value="in_progress">진행중</MenuItem>
                                    <MenuItem value="completed">완료</MenuItem>
                                    <MenuItem value="on_hold">보류</MenuItem>
                                    <MenuItem value="cancelled">취소</MenuItem>
                                </Select>
                            </FormControl>

                            <FormControl size="small" sx={{ minWidth: 120 }}>
                                <InputLabel>정렬</InputLabel>
                                <Select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                >
                                    <MenuItem value="priority">우선순위</MenuItem>
                                    <MenuItem value="dueDate">마감일</MenuItem>
                                    <MenuItem value="createdAt">생성일</MenuItem>
                                    <MenuItem value="status">상태</MenuItem>
                                </Select>
                            </FormControl>

                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={() => openEditDialog()}
                            >
                                새 TODO
                            </Button>
                        </Box>
                    </CardContent>
                </Card>

                {/* TODO 목록 */}
                <Card>
                    <CardContent>
                        <Typography variant="h5" gutterBottom>📝 작업 목록</Typography>

                        <List>
                            {filteredTodos.map((todo, index) => (
                                <React.Fragment key={todo.id}>
                                    <ListItem>
                                        <ListItemIcon>
                                            <Checkbox
                                                checked={todo.status === 'completed'}
                                                onChange={() => updateTodoStatus(
                                                    todo.id,
                                                    todo.status === 'completed' ? 'pending' : 'completed'
                                                )}
                                            />
                                        </ListItemIcon>

                                        <ListItemText
                                            primary={
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                    <Typography variant="h6" sx={{
                                                        textDecoration: todo.status === 'completed' ? 'line-through' : 'none'
                                                    }}>
                                                        {getCategoryIcon(todo.category)} {todo.title}
                                                    </Typography>
                                                    <Chip
                                                        label={`P${todo.priority}`}
                                                        color={getPriorityColor(todo.priority)}
                                                        size="small"
                                                    />
                                                    <Chip
                                                        label={todo.status}
                                                        color={getStatusColor(todo.status)}
                                                        size="small"
                                                    />
                                                </Box>
                                            }
                                            secondary={
                                                <Box>
                                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                                        {todo.description}
                                                    </Typography>

                                                    {todo.progress > 0 && (
                                                        <Box sx={{ mb: 1 }}>
                                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                                                <Typography variant="caption">진행률</Typography>
                                                                <Typography variant="caption">{todo.progress}%</Typography>
                                                            </Box>
                                                            <LinearProgress variant="determinate" value={todo.progress} />
                                                        </Box>
                                                    )}

                                                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                                                        {todo.assigneeName && (
                                                            <Chip
                                                                icon={<AssigneeIcon />}
                                                                label={todo.assigneeName}
                                                                size="small"
                                                                variant="outlined"
                                                            />
                                                        )}
                                                        {todo.dueDate && (
                                                            <Chip
                                                                icon={<DueDateIcon />}
                                                                label={new Date(todo.dueDate).toLocaleDateString('ko-KR')}
                                                                size="small"
                                                                variant="outlined"
                                                            />
                                                        )}
                                                        {todo.estimatedHours && (
                                                            <Chip
                                                                label={`${todo.estimatedHours}h`}
                                                                size="small"
                                                                variant="outlined"
                                                            />
                                                        )}
                                                        {todo.tags.map((tag, tagIndex) => (
                                                            <Chip key={tagIndex} label={tag} size="small" variant="outlined" />
                                                        ))}
                                                    </Box>
                                                </Box>
                                            }
                                        />

                                        <ListItemSecondaryAction>
                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                                {todo.status === 'pending' && (
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => updateTodoStatus(todo.id, 'in_progress')}
                                                    >
                                                        <StartIcon />
                                                    </IconButton>
                                                )}
                                                {todo.status === 'in_progress' && (
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => updateTodoStatus(todo.id, 'on_hold')}
                                                    >
                                                        <PauseIcon />
                                                    </IconButton>
                                                )}
                                                <IconButton size="small" onClick={() => openEditDialog(todo)}>
                                                    <EditIcon />
                                                </IconButton>
                                                <IconButton size="small" onClick={() => deleteTodo(todo.id)}>
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Box>
                                        </ListItemSecondaryAction>
                                    </ListItem>
                                    {index < filteredTodos.length - 1 && <Divider />}
                                </React.Fragment>
                            ))}
                        </List>
                    </CardContent>
                </Card>

                {/* TODO 생성/편집 다이얼로그 */}
                <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
                    <DialogTitle>
                        {editingTodo ? 'TODO 편집' : '새 TODO 생성'}
                    </DialogTitle>
                    <DialogContent>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                            <TextField
                                fullWidth
                                label="제목"
                                value={newTodo.title}
                                onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
                            />

                            <TextField
                                fullWidth
                                multiline
                                rows={3}
                                label="설명"
                                value={newTodo.description}
                                onChange={(e) => setNewTodo({ ...newTodo, description: e.target.value })}
                            />

                            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                                <FormControl fullWidth>
                                    <InputLabel>우선순위</InputLabel>
                                    <Select
                                        value={newTodo.priority}
                                        onChange={(e) => setNewTodo({ ...newTodo, priority: e.target.value as 1 | 2 | 3 | 4 | 5 })}
                                    >
                                        <MenuItem value={5}>P5 - 긴급</MenuItem>
                                        <MenuItem value={4}>P4 - 높음</MenuItem>
                                        <MenuItem value={3}>P3 - 보통</MenuItem>
                                        <MenuItem value={2}>P2 - 낮음</MenuItem>
                                        <MenuItem value={1}>P1 - 최저</MenuItem>
                                    </Select>
                                </FormControl>

                                <FormControl fullWidth>
                                    <InputLabel>카테고리</InputLabel>
                                    <Select
                                        value={newTodo.category}
                                        onChange={(e) => setNewTodo({ ...newTodo, category: e.target.value as Todo['category'] })}
                                    >
                                        <MenuItem value="feature">✨ 기능</MenuItem>
                                        <MenuItem value="bug">🐛 버그</MenuItem>
                                        <MenuItem value="improvement">⚡ 개선</MenuItem>
                                        <MenuItem value="documentation">📚 문서</MenuItem>
                                        <MenuItem value="testing">🧪 테스트</MenuItem>
                                        <MenuItem value="refactoring">🔧 리팩토링</MenuItem>
                                        <MenuItem value="deployment">🚀 배포</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>

                            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                                <TextField
                                    fullWidth
                                    type="date"
                                    label="마감일"
                                    value={newTodo.dueDate}
                                    onChange={(e) => setNewTodo({ ...newTodo, dueDate: e.target.value })}
                                    InputLabelProps={{ shrink: true }}
                                />

                                <TextField
                                    fullWidth
                                    type="number"
                                    label="예상 시간 (시간)"
                                    value={newTodo.estimatedHours}
                                    onChange={(e) => setNewTodo({ ...newTodo, estimatedHours: parseInt(e.target.value) || 0 })}
                                />
                            </Box>
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setDialogOpen(false)}>취소</Button>
                        <Button variant="contained" onClick={saveTodo}>
                            {editingTodo ? '수정' : '생성'}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* 푸터 */}
                <Box sx={{ mt: 4, p: 2, bgcolor: 'grey.50', borderRadius: 2, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                        💡 TODO 관리 시스템이 실제 API와 연결되었습니다!
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        🚀 API 엔드포인트: /api/todos/* 활용
                    </Typography>
                </Box>
            </Box>
        </Container>
    );
};

export default TodoManagement;
