import React, { useState } from 'react';
import {
    Box,
    VStack,
    HStack,
    Text,
    Badge,
    IconButton,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    MenuDivider,
    Tooltip,
    Progress,
    Avatar,
    Wrap,
    WrapItem,
    useColorModeValue,
    Collapse,
    Button,
    Divider
} from '@chakra-ui/react';
import {
    ChevronDownIcon,
    ChevronRightIcon,
    EditIcon,
    DeleteIcon,
    ViewIcon,
    CalendarIcon,
    TimeIcon,
    StarIcon,
    ChatIcon,
    AttachmentIcon,
    UserIcon
} from '@chakra-ui/icons';

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

interface TodoItemProps {
    todo: Todo;
    onStatusChange: (todoId: string, newStatus: string) => void;
    onEdit: (todo: Todo) => void;
    onDelete: (todoId: string) => void;
}

const TodoItem: React.FC<TodoItemProps> = ({
    todo,
    onStatusChange,
    onEdit,
    onDelete
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.600');
    const hoverBgColor = useColorModeValue('gray.50', 'gray.700');

    // 상태별 색상
    const getStatusColor = (status: string) => {
        const statusColors = {
            pending: 'gray',
            in_progress: 'blue',
            completed: 'green',
            cancelled: 'red',
            on_hold: 'yellow'
        };
        return statusColors[status as keyof typeof statusColors] || 'gray';
    };

    // 우선순위별 색상
    const getPriorityColor = (priority: number) => {
        if (priority >= 5) return 'red';
        if (priority >= 4) return 'orange';
        if (priority >= 3) return 'yellow';
        if (priority >= 2) return 'blue';
        return 'gray';
    };

    // 상태 텍스트
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

    // 우선순위 텍스트
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

    // 카테고리 텍스트
    const getCategoryText = (category: string) => {
        const categoryMap = {
            feature: '기능',
            bug: '버그',
            improvement: '개선',
            documentation: '문서',
            testing: '테스트',
            refactoring: '리팩토링',
            deployment: '배포'
        };
        return categoryMap[category as keyof typeof categoryMap] || category;
    };

    // 날짜 포맷팅
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // 시간 포맷팅
    const formatTime = (hours: number) => {
        if (hours < 1) return `${Math.round(hours * 60)}분`;
        return `${hours}시간`;
    };

    // 서브태스크 완료율
    const subtaskProgress = todo.subtasks.length > 0
        ? Math.round((todo.subtasks.filter(st => st.completed).length / todo.subtasks.length) * 100)
        : 0;

    return (
        <Box
            bg={bgColor}
            border="1px solid"
            borderColor={borderColor}
            borderRadius="lg"
            p={4}
            transition="all 0.2s"
            _hover={{
                bg: hoverBgColor,
                shadow: 'md'
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* 메인 콘텐츠 */}
            <VStack align="stretch" spacing={3}>
                {/* 헤더 */}
                <HStack justify="space-between" align="flex-start">
                    <HStack spacing={3} flex={1}>
                        <IconButton
                            aria-label={isExpanded ? '접기' : '펼치기'}
                            icon={isExpanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
                            size="sm"
                            variant="ghost"
                            onClick={() => setIsExpanded(!isExpanded)}
                        />
                        <VStack align="flex-start" spacing={1} flex={1}>
                            <Text
                                fontSize="lg"
                                fontWeight="semibold"
                                color={todo.status === 'completed' ? 'gray.500' : 'inherit'}
                                textDecoration={todo.status === 'completed' ? 'line-through' : 'none'}
                            >
                                {todo.title}
                            </Text>
                            {todo.description && (
                                <Text
                                    fontSize="sm"
                                    color="gray.600"
                                    noOfLines={isExpanded ? undefined : 2}
                                >
                                    {todo.description}
                                </Text>
                            )}
                        </VStack>
                    </HStack>

                    {/* 액션 버튼들 */}
                    <HStack spacing={1} opacity={isHovered ? 1 : 0} transition="opacity 0.2s">
                        <Tooltip label="상세 보기">
                            <IconButton
                                aria-label="상세 보기"
                                icon={<ViewIcon />}
                                size="sm"
                                variant="ghost"
                            />
                        </Tooltip>
                        <Tooltip label="편집">
                            <IconButton
                                aria-label="편집"
                                icon={<EditIcon />}
                                size="sm"
                                variant="ghost"
                                onClick={() => onEdit(todo)}
                            />
                        </Tooltip>
                        <Menu>
                            <MenuButton
                                as={IconButton}
                                aria-label="더보기"
                                icon={<ChevronDownIcon />}
                                size="sm"
                                variant="ghost"
                            />
                            <MenuList>
                                <MenuItem onClick={() => onEdit(todo)}>
                                    <EditIcon mr={2} />
                                    편집
                                </MenuItem>
                                <MenuItem onClick={() => onDelete(todo._id)} color="red.500">
                                    <DeleteIcon mr={2} />
                                    삭제
                                </MenuItem>
                                <MenuDivider />
                                <MenuItem>
                                    <ViewIcon mr={2} />
                                    상세 보기
                                </MenuItem>
                            </MenuList>
                        </Menu>
                    </HStack>
                </HStack>

                {/* 태그 및 메타 정보 */}
                <HStack justify="space-between" wrap="wrap">
                    <Wrap spacing={2}>
                        <Badge colorScheme={getStatusColor(todo.status)}>
                            {getStatusText(todo.status)}
                        </Badge>
                        <Badge colorScheme={getPriorityColor(todo.priority)}>
                            {getPriorityText(todo.priority)}
                        </Badge>
                        <Badge variant="outline">
                            {getCategoryText(todo.category)}
                        </Badge>
                        {todo.tags.map((tag, index) => (
                            <Badge key={index} variant="subtle" colorScheme="blue">
                                {tag}
                            </Badge>
                        ))}
                    </Wrap>
                </HStack>

                {/* 진행률 */}
                {todo.subtasks.length > 0 && (
                    <Box>
                        <HStack justify="space-between" mb={1}>
                            <Text fontSize="sm" color="gray.600">
                                서브태스크 진행률
                            </Text>
                            <Text fontSize="sm" color="gray.600">
                                {subtaskProgress}%
                            </Text>
                        </HStack>
                        <Progress
                            value={subtaskProgress}
                            size="sm"
                            colorScheme={subtaskProgress === 100 ? 'green' : 'blue'}
                            borderRadius="md"
                        />
                    </Box>
                )}

                {/* 하단 정보 */}
                <HStack justify="space-between" fontSize="sm" color="gray.600">
                    <HStack spacing={4}>
                        {/* 담당자 */}
                        <HStack spacing={1}>
                            <UserIcon />
                            <Text>{todo.assignee.name}</Text>
                        </HStack>

                        {/* 마감일 */}
                        {todo.dueDate && (
                            <HStack spacing={1}>
                                <CalendarIcon />
                                <Text color={todo.isOverdue ? 'red.500' : 'inherit'}>
                                    {formatDate(todo.dueDate)}
                                </Text>
                            </HStack>
                        )}

                        {/* 예상 시간 */}
                        {todo.estimatedHours && (
                            <HStack spacing={1}>
                                <TimeIcon />
                                <Text>{formatTime(todo.estimatedHours)}</Text>
                            </HStack>
                        )}

                        {/* 댓글 수 */}
                        {todo.comments.length > 0 && (
                            <HStack spacing={1}>
                                <ChatIcon />
                                <Text>{todo.comments.length}</Text>
                            </HStack>
                        )}

                        {/* 첨부파일 수 */}
                        {todo.attachments && todo.attachments.length > 0 && (
                            <HStack spacing={1}>
                                <AttachmentIcon />
                                <Text>{todo.attachments.length}</Text>
                            </HStack>
                        )}
                    </HStack>

                    {/* 프로젝트/스프린트 */}
                    <HStack spacing={2}>
                        {todo.project && (
                            <Badge variant="outline" colorScheme="purple">
                                {todo.project.name}
                            </Badge>
                        )}
                        {todo.sprint && (
                            <Badge variant="outline" colorScheme="cyan">
                                {todo.sprint.name}
                            </Badge>
                        )}
                    </HStack>
                </HStack>

                {/* 확장된 콘텐츠 */}
                <Collapse in={isExpanded}>
                    <Divider my={3} />

                    {/* 서브태스크 */}
                    {todo.subtasks.length > 0 && (
                        <Box mb={4}>
                            <Text fontSize="sm" fontWeight="semibold" mb={2}>
                                서브태스크 ({todo.subtasks.filter(st => st.completed).length}/{todo.subtasks.length})
                            </Text>
                            <VStack align="stretch" spacing={2}>
                                {todo.subtasks.map((subtask, index) => (
                                    <HStack key={index} spacing={2}>
                                        <Text
                                            fontSize="sm"
                                            color={subtask.completed ? 'gray.500' : 'inherit'}
                                            textDecoration={subtask.completed ? 'line-through' : 'none'}
                                        >
                                            {subtask.title}
                                        </Text>
                                        {subtask.completed && (
                                            <Badge size="sm" colorScheme="green">
                                                완료
                                            </Badge>
                                        )}
                                    </HStack>
                                ))}
                            </VStack>
                        </Box>
                    )}

                    {/* 댓글 미리보기 */}
                    {todo.comments.length > 0 && (
                        <Box mb={4}>
                            <Text fontSize="sm" fontWeight="semibold" mb={2}>
                                최근 댓글
                            </Text>
                            <VStack align="stretch" spacing={2}>
                                {todo.comments.slice(0, 2).map((comment) => (
                                    <HStack key={comment._id} spacing={2} align="flex-start">
                                        <Avatar
                                            size="xs"
                                            name={comment.user.name}
                                            src={comment.user.avatar}
                                        />
                                        <VStack align="flex-start" spacing={1} flex={1}>
                                            <HStack spacing={2}>
                                                <Text fontSize="xs" fontWeight="semibold">
                                                    {comment.user.name}
                                                </Text>
                                                <Text fontSize="xs" color="gray.500">
                                                    {formatDate(comment.createdAt)}
                                                </Text>
                                            </HStack>
                                            <Text fontSize="sm" color="gray.600">
                                                {comment.content}
                                            </Text>
                                        </VStack>
                                    </HStack>
                                ))}
                                {todo.comments.length > 2 && (
                                    <Text fontSize="xs" color="gray.500">
                                        +{todo.comments.length - 2}개 더 보기
                                    </Text>
                                )}
                            </VStack>
                        </Box>
                    )}

                    {/* 상태 변경 버튼 */}
                    <HStack spacing={2}>
                        {todo.status !== 'completed' && (
                            <Button
                                size="sm"
                                colorScheme="green"
                                onClick={() => onStatusChange(todo._id, 'completed')}
                            >
                                완료로 표시
                            </Button>
                        )}
                        {todo.status === 'pending' && (
                            <Button
                                size="sm"
                                colorScheme="blue"
                                onClick={() => onStatusChange(todo._id, 'in_progress')}
                            >
                                진행 중으로 변경
                            </Button>
                        )}
                        {todo.status === 'in_progress' && (
                            <Button
                                size="sm"
                                colorScheme="yellow"
                                onClick={() => onStatusChange(todo._id, 'on_hold')}
                            >
                                보류로 변경
                            </Button>
                        )}
                    </HStack>
                </Collapse>
            </VStack>
        </Box>
    );
};

export default TodoItem;
