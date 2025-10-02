import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    VStack,
    HStack,
    Text,
    Button,
    Input,
    Select,
    Badge,
    IconButton,
    useDisclosure,
    useToast,
    Spinner,
    Alert,
    AlertIcon,
    Flex,
    Spacer,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    MenuDivider,
    Tooltip,
    Wrap,
    WrapItem
} from '@chakra-ui/react';
import {
    AddIcon,
    SearchIcon,
    FilterIcon,
    ViewIcon,
    EditIcon,
    DeleteIcon,
    ChevronDownIcon,
    CalendarIcon,
    TimeIcon,
    StarIcon
} from '@chakra-ui/icons';
import TodoItem from './TodoItem';
import TodoModal from './TodoModal';
import TodoFilters from './TodoFilters';

interface Todo {
    _id: string;
    title: string;
    description?: string;
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold';
    priority: number;
    category: string;
    assignee: {
        _id: string;
        name: string;
        email: string;
        avatar?: string;
    };
    creator: {
        _id: string;
        name: string;
        email: string;
        avatar?: string;
    };
    dueDate?: string;
    estimatedHours?: number;
    actualHours?: number;
    tags: string[];
    subtasks: Array<{
        title: string;
        completed: boolean;
        completedAt?: string;
    }>;
    comments: Array<{
        _id: string;
        user: {
            _id: string;
            name: string;
            avatar?: string;
        };
        content: string;
        createdAt: string;
    }>;
    watchers: Array<{
        _id: string;
        name: string;
        email: string;
    }>;
    project?: {
        _id: string;
        name: string;
    };
    sprint?: {
        _id: string;
        name: string;
    };
    isOverdue: boolean;
    progress: number;
    timeRemaining: number;
    createdAt: string;
    updatedAt: string;
    lastActivityAt: string;
}

interface TodoListProps {
    projectId?: string;
    assigneeId?: string;
    sprintId?: string;
    onTodoUpdate?: (todo: Todo) => void;
    onTodoDelete?: (todoId: string) => void;
}

const TodoList: React.FC<TodoListProps> = ({
    projectId,
    assigneeId,
    sprintId,
    onTodoUpdate,
    onTodoDelete
}) => {
    const [todos, setTodos] = useState<Todo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [priorityFilter, setPriorityFilter] = useState<string>('all');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [sortBy, setSortBy] = useState<string>('lastActivityAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);

    const toast = useToast();

    // TODO 목록 조회
    const fetchTodos = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const params = new URLSearchParams({
                page: page.toString(),
                limit: '20',
                sortBy,
                sortOrder
            });

            if (searchTerm) params.append('search', searchTerm);
            if (statusFilter !== 'all') params.append('status', statusFilter);
            if (priorityFilter !== 'all') params.append('priority', priorityFilter);
            if (categoryFilter !== 'all') params.append('category', categoryFilter);
            if (projectId) params.append('project', projectId);
            if (assigneeId) params.append('assignee', assigneeId);
            if (sprintId) params.append('sprint', sprintId);

            const response = await fetch(`/api/todos?${params}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('TODO 목록을 불러오는데 실패했습니다.');
            }

            const data = await response.json();
            setTodos(data.data);
            setTotalPages(data.pagination.pages);
        } catch (err) {
            setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
            toast({
                title: '오류',
                description: error,
                status: 'error',
                duration: 5000,
                isClosable: true
            });
        } finally {
            setLoading(false);
        }
    }, [searchTerm, statusFilter, priorityFilter, categoryFilter, sortBy, sortOrder, page, projectId, assigneeId, sprintId, error, toast]);

    useEffect(() => {
        fetchTodos();
    }, [fetchTodos]);

    // TODO 상태 변경
    const handleStatusChange = async (todoId: string, newStatus: string) => {
        try {
            const response = await fetch(`/api/todos/${todoId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (!response.ok) {
                throw new Error('상태 변경에 실패했습니다.');
            }

            const data = await response.json();
            const updatedTodo = data.data;

            setTodos(prev => prev.map(todo =>
                todo._id === todoId ? updatedTodo : todo
            ));

            onTodoUpdate?.(updatedTodo);

            toast({
                title: '상태 변경 완료',
                description: `TODO가 ${getStatusText(newStatus)}로 변경되었습니다.`,
                status: 'success',
                duration: 3000,
                isClosable: true
            });
        } catch (err) {
            toast({
                title: '오류',
                description: err instanceof Error ? err.message : '상태 변경 중 오류가 발생했습니다.',
                status: 'error',
                duration: 5000,
                isClosable: true
            });
        }
    };

    // TODO 삭제
    const handleDelete = async (todoId: string) => {
        try {
            const response = await fetch(`/api/todos/${todoId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('삭제에 실패했습니다.');
            }

            setTodos(prev => prev.filter(todo => todo._id !== todoId));
            onTodoDelete?.(todoId);

            toast({
                title: '삭제 완료',
                description: 'TODO가 삭제되었습니다.',
                status: 'success',
                duration: 3000,
                isClosable: true
            });
        } catch (err) {
            toast({
                title: '오류',
                description: err instanceof Error ? err.message : '삭제 중 오류가 발생했습니다.',
                status: 'error',
                duration: 5000,
                isClosable: true
            });
        }
    };

    // TODO 편집
    const handleEdit = (todo: Todo) => {
        setSelectedTodo(todo);
        setIsModalOpen(true);
    };

    // 새 TODO 생성
    const handleCreate = () => {
        setSelectedTodo(null);
        setIsModalOpen(true);
    };

    // TODO 저장
    const handleSave = async (todoData: Partial<Todo>) => {
        try {
            const url = selectedTodo ? `/api/todos/${selectedTodo._id}` : '/api/todos';
            const method = selectedTodo ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(todoData)
            });

            if (!response.ok) {
                throw new Error(selectedTodo ? '수정에 실패했습니다.' : '생성에 실패했습니다.');
            }

            const data = await response.json();
            const savedTodo = data.data;

            if (selectedTodo) {
                setTodos(prev => prev.map(todo =>
                    todo._id === selectedTodo._id ? savedTodo : todo
                ));
                onTodoUpdate?.(savedTodo);
            } else {
                setTodos(prev => [savedTodo, ...prev]);
            }

            setIsModalOpen(false);
            setSelectedTodo(null);

            toast({
                title: selectedTodo ? '수정 완료' : '생성 완료',
                description: `TODO가 ${selectedTodo ? '수정' : '생성'}되었습니다.`,
                status: 'success',
                duration: 3000,
                isClosable: true
            });
        } catch (err) {
            toast({
                title: '오류',
                description: err instanceof Error ? err.message : '저장 중 오류가 발생했습니다.',
                status: 'error',
                duration: 5000,
                isClosable: true
            });
        }
    };

    // 필터 초기화
    const resetFilters = () => {
        setSearchTerm('');
        setStatusFilter('all');
        setPriorityFilter('all');
        setCategoryFilter('all');
        setSortBy('lastActivityAt');
        setSortOrder('desc');
        setPage(1);
    };

    // 상태 텍스트 변환
    const getStatusText = (status: string) => {
        const statusMap = {
            pending: '대기 중',
            in_progress: '진행 중',
            completed: '완료',
            cancelled: '취소',
            on_hold: '보류'
        };
        return statusMap[status as keyof typeof statusMap] || status;
    };

    // 우선순위 텍스트 변환
    const getPriorityText = (priority: number) => {
        const priorityMap = {
            1: '매우 낮음',
            2: '낮음',
            3: '보통',
            4: '높음',
            5: '매우 높음'
        };
        return priorityMap[priority as keyof typeof priorityMap] || '보통';
    };

    if (loading) {
        return (
            <Box textAlign="center" py={8}>
                <Spinner size="xl" />
                <Text mt={4}>TODO 목록을 불러오는 중...</Text>
            </Box>
        );
    }

    if (error) {
        return (
            <Alert status="error">
                <AlertIcon />
                <Box>
                    <Text fontWeight="bold">오류가 발생했습니다!</Text>
                    <Text>{error}</Text>
                </Box>
            </Alert>
        );
    }

    return (
        <Box>
            {/* 헤더 */}
            <Flex align="center" mb={6}>
                <Text fontSize="2xl" fontWeight="bold">
                    TODO 목록
                </Text>
                <Spacer />
                <HStack spacing={2}>
                    <Button
                        leftIcon={<FilterIcon />}
                        variant="outline"
                        onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                    >
                        필터
                    </Button>
                    <Button
                        leftIcon={<AddIcon />}
                        colorScheme="blue"
                        onClick={handleCreate}
                    >
                        새 TODO
                    </Button>
                </HStack>
            </Flex>

            {/* 검색 및 필터 */}
            <Box mb={6}>
                <HStack spacing={4} mb={4}>
                    <Input
                        placeholder="TODO 검색..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        leftIcon={<SearchIcon />}
                    />
                    <Select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        width="200px"
                    >
                        <option value="all">모든 상태</option>
                        <option value="pending">대기 중</option>
                        <option value="in_progress">진행 중</option>
                        <option value="completed">완료</option>
                        <option value="cancelled">취소</option>
                        <option value="on_hold">보류</option>
                    </Select>
                    <Select
                        value={priorityFilter}
                        onChange={(e) => setPriorityFilter(e.target.value)}
                        width="200px"
                    >
                        <option value="all">모든 우선순위</option>
                        <option value="5">매우 높음</option>
                        <option value="4">높음</option>
                        <option value="3">보통</option>
                        <option value="2">낮음</option>
                        <option value="1">매우 낮음</option>
                    </Select>
                    <Button onClick={resetFilters} variant="outline">
                        초기화
                    </Button>
                </HStack>

                {/* 고급 필터 */}
                {isFiltersOpen && (
                    <TodoFilters
                        categoryFilter={categoryFilter}
                        setCategoryFilter={setCategoryFilter}
                        sortBy={sortBy}
                        setSortBy={setSortBy}
                        sortOrder={sortOrder}
                        setSortOrder={setSortOrder}
                    />
                )}
            </Box>

            {/* TODO 목록 */}
            <VStack spacing={4} align="stretch">
                {todos.length === 0 ? (
                    <Box textAlign="center" py={8}>
                        <Text fontSize="lg" color="gray.500">
                            TODO가 없습니다.
                        </Text>
                        <Button
                            mt={4}
                            leftIcon={<AddIcon />}
                            colorScheme="blue"
                            onClick={handleCreate}
                        >
                            첫 번째 TODO 만들기
                        </Button>
                    </Box>
                ) : (
                    todos.map(todo => (
                        <TodoItem
                            key={todo._id}
                            todo={todo}
                            onStatusChange={handleStatusChange}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                        />
                    ))
                )}
            </VStack>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
                <HStack justify="center" mt={8}>
                    <Button
                        isDisabled={page === 1}
                        onClick={() => setPage(page - 1)}
                    >
                        이전
                    </Button>
                    <Text>
                        {page} / {totalPages}
                    </Text>
                    <Button
                        isDisabled={page === totalPages}
                        onClick={() => setPage(page + 1)}
                    >
                        다음
                    </Button>
                </HStack>
            )}

            {/* TODO 모달 */}
            <TodoModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedTodo(null);
                }}
                todo={selectedTodo}
                onSave={handleSave}
                projectId={projectId}
                assigneeId={assigneeId}
                sprintId={sprintId}
            />
        </Box>
    );
};

export default TodoList;
