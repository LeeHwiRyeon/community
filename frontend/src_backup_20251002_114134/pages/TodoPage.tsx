import React, { useState, useEffect } from 'react';
import {
    Box,
    VStack,
    HStack,
    Text,
    Button,
    Input,
    Select,
    Badge,
    Card,
    CardHeader,
    CardBody,
    CardFooter,
    Flex,
    Spacer,
    IconButton,
    useDisclosure,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    ModalCloseButton,
    FormControl,
    FormLabel,
    Textarea,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    NumberIncrementStepper,
    NumberDecrementStepper,
    useColorModeValue,
    Spinner,
    Alert,
    AlertIcon,
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    TableContainer,
    InputGroup,
    InputLeftElement,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    Divider,
    Progress,
    Tooltip,
    Wrap,
    WrapItem
} from '@chakra-ui/react';
import {
    SearchIcon,
    AddIcon,
    EditIcon,
    DeleteIcon,
    ViewIcon,
    CheckIcon,
    TimeIcon,
    StarIcon,
    ChatIcon,
    AttachmentIcon,
    CalendarIcon,
    UserIcon
} from '@chakra-ui/icons';

interface Todo {
    id: string;
    title: string;
    description: string;
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold';
    priority: number;
    category: string;
    assignee: {
        id: string;
        name: string;
        email: string;
        avatar?: string;
    };
    creator: {
        id: string;
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
        user: {
            id: string;
            name: string;
            avatar?: string;
        };
        content: string;
        createdAt: string;
    }>;
    createdAt: string;
    updatedAt: string;
    progress: number;
    isOverdue: boolean;
}

const TodoPage: React.FC = () => {
    const [todos, setTodos] = useState<Todo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [priorityFilter, setPriorityFilter] = useState<string>('all');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [sortBy, setSortBy] = useState<string>('lastActivityAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure();
    const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
    const { isOpen: isViewOpen, onOpen: onViewOpen, onClose: onViewClose } = useDisclosure();

    const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);
    const [editingTodo, setEditingTodo] = useState<Partial<Todo>>({});

    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.600');

    // TODO 데이터 로드
    useEffect(() => {
        loadTodos();
    }, []);

    const loadTodos = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/todos', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('TODO 목록을 불러올 수 없습니다.');
            }

            const data = await response.json();
            setTodos(data.data || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    // 필터링된 TODO 목록
    const filteredTodos = todos.filter(todo => {
        const matchesSearch = todo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            todo.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            todo.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesStatus = statusFilter === 'all' || todo.status === statusFilter;
        const matchesPriority = priorityFilter === 'all' || todo.priority.toString() === priorityFilter;
        const matchesCategory = categoryFilter === 'all' || todo.category === categoryFilter;

        return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
    });

    // 정렬된 TODO 목록
    const sortedTodos = [...filteredTodos].sort((a, b) => {
        let aValue: any = a[sortBy as keyof Todo];
        let bValue: any = b[sortBy as keyof Todo];

        if (sortBy === 'dueDate') {
            aValue = a.dueDate ? new Date(a.dueDate).getTime() : 0;
            bValue = b.dueDate ? new Date(b.dueDate).getTime() : 0;
        }

        if (sortOrder === 'asc') {
            return aValue > bValue ? 1 : -1;
        } else {
            return aValue < bValue ? 1 : -1;
        }
    });

    // TODO 생성
    const handleCreateTodo = async () => {
        try {
            const response = await fetch('/api/todos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(editingTodo)
            });

            if (!response.ok) {
                throw new Error('TODO 생성에 실패했습니다.');
            }

            await loadTodos();
            onCreateClose();
            setEditingTodo({});
        } catch (err) {
            setError(err instanceof Error ? err.message : 'TODO 생성 중 오류가 발생했습니다.');
        }
    };

    // TODO 수정
    const handleUpdateTodo = async () => {
        if (!selectedTodo) return;

        try {
            const response = await fetch(`/api/todos/${selectedTodo.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(editingTodo)
            });

            if (!response.ok) {
                throw new Error('TODO 수정에 실패했습니다.');
            }

            await loadTodos();
            onEditClose();
            setSelectedTodo(null);
            setEditingTodo({});
        } catch (err) {
            setError(err instanceof Error ? err.message : 'TODO 수정 중 오류가 발생했습니다.');
        }
    };

    // TODO 삭제
    const handleDeleteTodo = async (id: string) => {
        if (!confirm('정말로 이 TODO를 삭제하시겠습니까?')) return;

        try {
            const response = await fetch(`/api/todos/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('TODO 삭제에 실패했습니다.');
            }

            await loadTodos();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'TODO 삭제 중 오류가 발생했습니다.');
        }
    };

    // 상태 변경
    const handleStatusChange = async (id: string, status: string) => {
        try {
            const response = await fetch(`/api/todos/${id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ status })
            });

            if (!response.ok) {
                throw new Error('상태 변경에 실패했습니다.');
            }

            await loadTodos();
        } catch (err) {
            setError(err instanceof Error ? err.message : '상태 변경 중 오류가 발생했습니다.');
        }
    };

    // 우선순위 색상
    const getPriorityColor = (priority: number) => {
        switch (priority) {
            case 1: return 'red';
            case 2: return 'orange';
            case 3: return 'yellow';
            case 4: return 'green';
            case 5: return 'blue';
            default: return 'gray';
        }
    };

    // 상태 색상
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'gray';
            case 'in_progress': return 'blue';
            case 'completed': return 'green';
            case 'cancelled': return 'red';
            case 'on_hold': return 'yellow';
            default: return 'gray';
        }
    };

    // 상태 라벨
    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'pending': return '대기';
            case 'in_progress': return '진행중';
            case 'completed': return '완료';
            case 'cancelled': return '취소';
            case 'on_hold': return '보류';
            default: return status;
        }
    };

    if (loading) {
        return (
            <Box p={8} textAlign="center">
                <Spinner size="xl" />
                <Text mt={4}>TODO 목록을 불러오는 중...</Text>
            </Box>
        );
    }

    return (
        <Box p={6} maxW="1200px" mx="auto">
            <VStack spacing={6} align="stretch">
                {/* 헤더 */}
                <Flex align="center" justify="space-between">
                    <Text fontSize="2xl" fontWeight="bold">📋 TODO 관리</Text>
                    <Button
                        leftIcon={<AddIcon />}
                        colorScheme="blue"
                        onClick={onCreateOpen}
                    >
                        새 TODO
                    </Button>
                </Flex>

                {/* 에러 메시지 */}
                {error && (
                    <Alert status="error">
                        <AlertIcon />
                        {error}
                    </Alert>
                )}

                {/* 필터 및 검색 */}
                <Card>
                    <CardBody>
                        <VStack spacing={4}>
                            {/* 검색 */}
                            <InputGroup>
                                <InputLeftElement>
                                    <SearchIcon color="gray.300" />
                                </InputLeftElement>
                                <Input
                                    placeholder="TODO 검색..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </InputGroup>

                            {/* 필터 */}
                            <HStack spacing={4} wrap="wrap">
                                <Select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    w="150px"
                                >
                                    <option value="all">모든 상태</option>
                                    <option value="pending">대기</option>
                                    <option value="in_progress">진행중</option>
                                    <option value="completed">완료</option>
                                    <option value="cancelled">취소</option>
                                    <option value="on_hold">보류</option>
                                </Select>

                                <Select
                                    value={priorityFilter}
                                    onChange={(e) => setPriorityFilter(e.target.value)}
                                    w="150px"
                                >
                                    <option value="all">모든 우선순위</option>
                                    <option value="1">긴급</option>
                                    <option value="2">높음</option>
                                    <option value="3">보통</option>
                                    <option value="4">낮음</option>
                                    <option value="5">최저</option>
                                </Select>

                                <Select
                                    value={categoryFilter}
                                    onChange={(e) => setCategoryFilter(e.target.value)}
                                    w="150px"
                                >
                                    <option value="all">모든 카테고리</option>
                                    <option value="feature">기능</option>
                                    <option value="bug">버그</option>
                                    <option value="improvement">개선</option>
                                    <option value="documentation">문서</option>
                                    <option value="testing">테스트</option>
                                    <option value="refactoring">리팩토링</option>
                                    <option value="deployment">배포</option>
                                </Select>

                                <Select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    w="150px"
                                >
                                    <option value="lastActivityAt">최근 활동</option>
                                    <option value="createdAt">생성일</option>
                                    <option value="dueDate">마감일</option>
                                    <option value="priority">우선순위</option>
                                    <option value="status">상태</option>
                                </Select>

                                <Select
                                    value={sortOrder}
                                    onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                                    w="100px"
                                >
                                    <option value="desc">내림차순</option>
                                    <option value="asc">오름차순</option>
                                </Select>
                            </HStack>
                        </VStack>
                    </CardBody>
                </Card>

                {/* TODO 목록 */}
                <VStack spacing={4} align="stretch">
                    {sortedTodos.length === 0 ? (
                        <Card>
                            <CardBody textAlign="center" py={12}>
                                <Text fontSize="lg" color="gray.500">
                                    {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' || categoryFilter !== 'all'
                                        ? '검색 조건에 맞는 TODO가 없습니다.'
                                        : '아직 TODO가 없습니다. 새 TODO를 만들어보세요!'}
                                </Text>
                            </CardBody>
                        </Card>
                    ) : (
                        sortedTodos.map((todo) => (
                            <Card key={todo.id} bg={bgColor} borderColor={borderColor}>
                                <CardBody>
                                    <VStack spacing={3} align="stretch">
                                        {/* 헤더 */}
                                        <Flex align="center" justify="space-between">
                                            <HStack spacing={3}>
                                                <Badge
                                                    colorScheme={getStatusColor(todo.status)}
                                                    variant="solid"
                                                >
                                                    {getStatusLabel(todo.status)}
                                                </Badge>
                                                <Badge
                                                    colorScheme={getPriorityColor(todo.priority)}
                                                    variant="outline"
                                                >
                                                    우선순위 {todo.priority}
                                                </Badge>
                                                <Badge colorScheme="purple" variant="outline">
                                                    {todo.category}
                                                </Badge>
                                            </HStack>
                                            <HStack>
                                                <IconButton
                                                    aria-label="상세보기"
                                                    icon={<ViewIcon />}
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => {
                                                        setSelectedTodo(todo);
                                                        onViewOpen();
                                                    }}
                                                />
                                                <IconButton
                                                    aria-label="수정"
                                                    icon={<EditIcon />}
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => {
                                                        setSelectedTodo(todo);
                                                        setEditingTodo(todo);
                                                        onEditOpen();
                                                    }}
                                                />
                                                <IconButton
                                                    aria-label="삭제"
                                                    icon={<DeleteIcon />}
                                                    size="sm"
                                                    variant="ghost"
                                                    colorScheme="red"
                                                    onClick={() => handleDeleteTodo(todo.id)}
                                                />
                                            </HStack>
                                        </Flex>

                                        {/* 제목 */}
                                        <Text fontSize="lg" fontWeight="bold">
                                            {todo.title}
                                        </Text>

                                        {/* 설명 */}
                                        {todo.description && (
                                            <Text color="gray.600" noOfLines={2}>
                                                {todo.description}
                                            </Text>
                                        )}

                                        {/* 진행률 */}
                                        {todo.subtasks.length > 0 && (
                                            <Box>
                                                <Flex justify="space-between" mb={2}>
                                                    <Text fontSize="sm" color="gray.600">
                                                        진행률
                                                    </Text>
                                                    <Text fontSize="sm" color="gray.600">
                                                        {todo.progress}%
                                                    </Text>
                                                </Flex>
                                                <Progress value={todo.progress} colorScheme="blue" size="sm" />
                                            </Box>
                                        )}

                                        {/* 태그 */}
                                        {todo.tags.length > 0 && (
                                            <Wrap>
                                                {todo.tags.map((tag, index) => (
                                                    <WrapItem key={index}>
                                                        <Badge colorScheme="gray" variant="subtle">
                                                            {tag}
                                                        </Badge>
                                                    </WrapItem>
                                                ))}
                                            </Wrap>
                                        )}

                                        {/* 하단 정보 */}
                                        <Flex align="center" justify="space-between" fontSize="sm" color="gray.500">
                                            <HStack spacing={4}>
                                                <HStack>
                                                    <UserIcon />
                                                    <Text>{todo.assignee.name}</Text>
                                                </HStack>
                                                {todo.dueDate && (
                                                    <HStack>
                                                        <CalendarIcon />
                                                        <Text>
                                                            {new Date(todo.dueDate).toLocaleDateString()}
                                                        </Text>
                                                    </HStack>
                                                )}
                                                {todo.estimatedHours && (
                                                    <HStack>
                                                        <TimeIcon />
                                                        <Text>{todo.estimatedHours}h</Text>
                                                    </HStack>
                                                )}
                                                {todo.comments.length > 0 && (
                                                    <HStack>
                                                        <ChatIcon />
                                                        <Text>{todo.comments.length}</Text>
                                                    </HStack>
                                                )}
                                            </HStack>
                                            <Text>
                                                {new Date(todo.updatedAt).toLocaleDateString()}
                                            </Text>
                                        </Flex>
                                    </VStack>
                                </CardBody>
                            </Card>
                        ))
                    )}
                </VStack>
            </VStack>

            {/* TODO 생성 모달 */}
            <Modal isOpen={isCreateOpen} onClose={onCreateClose} size="xl">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>새 TODO 생성</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack spacing={4}>
                            <FormControl isRequired>
                                <FormLabel>제목</FormLabel>
                                <Input
                                    value={editingTodo.title || ''}
                                    onChange={(e) => setEditingTodo({ ...editingTodo, title: e.target.value })}
                                    placeholder="TODO 제목을 입력하세요"
                                />
                            </FormControl>
                            <FormControl>
                                <FormLabel>설명</FormLabel>
                                <Textarea
                                    value={editingTodo.description || ''}
                                    onChange={(e) => setEditingTodo({ ...editingTodo, description: e.target.value })}
                                    placeholder="TODO 설명을 입력하세요"
                                    rows={3}
                                />
                            </FormControl>
                            <HStack spacing={4} w="full">
                                <FormControl>
                                    <FormLabel>우선순위</FormLabel>
                                    <NumberInput
                                        value={editingTodo.priority || 3}
                                        onChange={(value) => setEditingTodo({ ...editingTodo, priority: parseInt(value) })}
                                        min={1}
                                        max={5}
                                    >
                                        <NumberInputField />
                                        <NumberInputStepper>
                                            <NumberIncrementStepper />
                                            <NumberDecrementStepper />
                                        </NumberInputStepper>
                                    </NumberInput>
                                </FormControl>
                                <FormControl>
                                    <FormLabel>카테고리</FormLabel>
                                    <Select
                                        value={editingTodo.category || 'feature'}
                                        onChange={(e) => setEditingTodo({ ...editingTodo, category: e.target.value })}
                                    >
                                        <option value="feature">기능</option>
                                        <option value="bug">버그</option>
                                        <option value="improvement">개선</option>
                                        <option value="documentation">문서</option>
                                        <option value="testing">테스트</option>
                                        <option value="refactoring">리팩토링</option>
                                        <option value="deployment">배포</option>
                                    </Select>
                                </FormControl>
                            </HStack>
                            <HStack spacing={4} w="full">
                                <FormControl>
                                    <FormLabel>마감일</FormLabel>
                                    <Input
                                        type="datetime-local"
                                        value={editingTodo.dueDate || ''}
                                        onChange={(e) => setEditingTodo({ ...editingTodo, dueDate: e.target.value })}
                                    />
                                </FormControl>
                                <FormControl>
                                    <FormLabel>예상 시간 (시간)</FormLabel>
                                    <NumberInput
                                        value={editingTodo.estimatedHours || 0}
                                        onChange={(value) => setEditingTodo({ ...editingTodo, estimatedHours: parseInt(value) })}
                                        min={0}
                                    >
                                        <NumberInputField />
                                        <NumberInputStepper>
                                            <NumberIncrementStepper />
                                            <NumberDecrementStepper />
                                        </NumberInputStepper>
                                    </NumberInput>
                                </FormControl>
                            </HStack>
                        </VStack>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="ghost" mr={3} onClick={onCreateClose}>
                            취소
                        </Button>
                        <Button colorScheme="blue" onClick={handleCreateTodo}>
                            생성
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* TODO 수정 모달 */}
            <Modal isOpen={isEditOpen} onClose={onEditClose} size="xl">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>TODO 수정</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack spacing={4}>
                            <FormControl isRequired>
                                <FormLabel>제목</FormLabel>
                                <Input
                                    value={editingTodo.title || ''}
                                    onChange={(e) => setEditingTodo({ ...editingTodo, title: e.target.value })}
                                    placeholder="TODO 제목을 입력하세요"
                                />
                            </FormControl>
                            <FormControl>
                                <FormLabel>설명</FormLabel>
                                <Textarea
                                    value={editingTodo.description || ''}
                                    onChange={(e) => setEditingTodo({ ...editingTodo, description: e.target.value })}
                                    placeholder="TODO 설명을 입력하세요"
                                    rows={3}
                                />
                            </FormControl>
                            <HStack spacing={4} w="full">
                                <FormControl>
                                    <FormLabel>상태</FormLabel>
                                    <Select
                                        value={editingTodo.status || 'pending'}
                                        onChange={(e) => setEditingTodo({ ...editingTodo, status: e.target.value as any })}
                                    >
                                        <option value="pending">대기</option>
                                        <option value="in_progress">진행중</option>
                                        <option value="completed">완료</option>
                                        <option value="cancelled">취소</option>
                                        <option value="on_hold">보류</option>
                                    </Select>
                                </FormControl>
                                <FormControl>
                                    <FormLabel>우선순위</FormLabel>
                                    <NumberInput
                                        value={editingTodo.priority || 3}
                                        onChange={(value) => setEditingTodo({ ...editingTodo, priority: parseInt(value) })}
                                        min={1}
                                        max={5}
                                    >
                                        <NumberInputField />
                                        <NumberInputStepper>
                                            <NumberIncrementStepper />
                                            <NumberDecrementStepper />
                                        </NumberInputStepper>
                                    </NumberInput>
                                </FormControl>
                            </HStack>
                        </VStack>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="ghost" mr={3} onClick={onEditClose}>
                            취소
                        </Button>
                        <Button colorScheme="blue" onClick={handleUpdateTodo}>
                            수정
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* TODO 상세보기 모달 */}
            <Modal isOpen={isViewOpen} onClose={onViewClose} size="xl">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>TODO 상세보기</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        {selectedTodo && (
                            <VStack spacing={4} align="stretch">
                                <Flex align="center" justify="space-between">
                                    <HStack spacing={3}>
                                        <Badge
                                            colorScheme={getStatusColor(selectedTodo.status)}
                                            variant="solid"
                                        >
                                            {getStatusLabel(selectedTodo.status)}
                                        </Badge>
                                        <Badge
                                            colorScheme={getPriorityColor(selectedTodo.priority)}
                                            variant="outline"
                                        >
                                            우선순위 {selectedTodo.priority}
                                        </Badge>
                                        <Badge colorScheme="purple" variant="outline">
                                            {selectedTodo.category}
                                        </Badge>
                                    </HStack>
                                    <Select
                                        value={selectedTodo.status}
                                        onChange={(e) => handleStatusChange(selectedTodo.id, e.target.value)}
                                        w="150px"
                                    >
                                        <option value="pending">대기</option>
                                        <option value="in_progress">진행중</option>
                                        <option value="completed">완료</option>
                                        <option value="cancelled">취소</option>
                                        <option value="on_hold">보류</option>
                                    </Select>
                                </Flex>

                                <Text fontSize="xl" fontWeight="bold">
                                    {selectedTodo.title}
                                </Text>

                                {selectedTodo.description && (
                                    <Text color="gray.600">
                                        {selectedTodo.description}
                                    </Text>
                                )}

                                <Divider />

                                <HStack spacing={6}>
                                    <HStack>
                                        <UserIcon />
                                        <Text>담당자: {selectedTodo.assignee.name}</Text>
                                    </HStack>
                                    {selectedTodo.dueDate && (
                                        <HStack>
                                            <CalendarIcon />
                                            <Text>마감일: {new Date(selectedTodo.dueDate).toLocaleDateString()}</Text>
                                        </HStack>
                                    )}
                                    {selectedTodo.estimatedHours && (
                                        <HStack>
                                            <TimeIcon />
                                            <Text>예상 시간: {selectedTodo.estimatedHours}시간</Text>
                                        </HStack>
                                    )}
                                </HStack>

                                {selectedTodo.tags.length > 0 && (
                                    <Box>
                                        <Text fontWeight="bold" mb={2}>태그</Text>
                                        <Wrap>
                                            {selectedTodo.tags.map((tag, index) => (
                                                <WrapItem key={index}>
                                                    <Badge colorScheme="gray" variant="subtle">
                                                        {tag}
                                                    </Badge>
                                                </WrapItem>
                                            ))}
                                        </Wrap>
                                    </Box>
                                )}

                                {selectedTodo.subtasks.length > 0 && (
                                    <Box>
                                        <Text fontWeight="bold" mb={2}>서브태스크</Text>
                                        <VStack spacing={2} align="stretch">
                                            {selectedTodo.subtasks.map((subtask, index) => (
                                                <HStack key={index}>
                                                    <CheckIcon
                                                        color={subtask.completed ? 'green.500' : 'gray.300'}
                                                    />
                                                    <Text
                                                        textDecoration={subtask.completed ? 'line-through' : 'none'}
                                                        color={subtask.completed ? 'gray.500' : 'inherit'}
                                                    >
                                                        {subtask.title}
                                                    </Text>
                                                </HStack>
                                            ))}
                                        </VStack>
                                    </Box>
                                )}

                                {selectedTodo.comments.length > 0 && (
                                    <Box>
                                        <Text fontWeight="bold" mb={2}>댓글</Text>
                                        <VStack spacing={3} align="stretch">
                                            {selectedTodo.comments.map((comment, index) => (
                                                <Box key={index} p={3} bg="gray.50" borderRadius="md">
                                                    <HStack mb={2}>
                                                        <Text fontWeight="bold" fontSize="sm">
                                                            {comment.user.name}
                                                        </Text>
                                                        <Text fontSize="sm" color="gray.500">
                                                            {new Date(comment.createdAt).toLocaleString()}
                                                        </Text>
                                                    </HStack>
                                                    <Text fontSize="sm">{comment.content}</Text>
                                                </Box>
                                            ))}
                                        </VStack>
                                    </Box>
                                )}
                            </VStack>
                        )}
                    </ModalBody>
                    <ModalFooter>
                        <Button onClick={onViewClose}>닫기</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </Box>
    );
};

export default TodoPage;
