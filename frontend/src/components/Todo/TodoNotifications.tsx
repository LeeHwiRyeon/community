import React, { useState, useEffect } from 'react';
import {
    Box,
    VStack,
    HStack,
    Text,
    Badge,
    IconButton,
    useDisclosure,
    Drawer,
    DrawerBody,
    DrawerHeader,
    DrawerOverlay,
    DrawerContent,
    DrawerCloseButton,
    Button,
    Divider,
    Avatar,
    Tooltip,
    Alert,
    AlertIcon,
    AlertTitle,
    AlertDescription,
    useToast,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    MenuDivider
} from '@chakra-ui/react';
import {
    BellIcon,
    CloseIcon,
    CheckIcon,
    TimeIcon,
    WarningIcon,
    InfoIcon
} from '@chakra-ui/icons';

interface Notification {
    id: string;
    type: 'todo_assigned' | 'todo_due_soon' | 'todo_overdue' | 'todo_completed' | 'comment_added' | 'status_changed';
    title: string;
    message: string;
    todoId: string;
    todoTitle: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    createdAt: string;
    read: boolean;
    actionUrl?: string;
    user?: {
        name: string;
        avatar?: string;
    };
}

interface TodoNotificationsProps {
    onNotificationClick?: (notification: Notification) => void;
}

const TodoNotifications: React.FC<TodoNotificationsProps> = ({
    onNotificationClick
}) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const { isOpen, onOpen, onClose } = useDisclosure();
    const toast = useToast();

    // 알림 조회
    const fetchNotifications = async () => {
        try {
            const response = await fetch('/api/notifications', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setNotifications(data.notifications || []);
                setUnreadCount(data.unreadCount || 0);
            }
        } catch (error) {
            console.error('알림 조회 오류:', error);
        }
    };

    // 알림 읽음 처리
    const markAsRead = async (notificationId: string) => {
        try {
            const response = await fetch(`/api/notifications/${notificationId}/read`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                setNotifications(prev =>
                    prev.map(notif =>
                        notif.id === notificationId ? { ...notif, read: true } : notif
                    )
                );
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error('알림 읽음 처리 오류:', error);
        }
    };

    // 모든 알림 읽음 처리
    const markAllAsRead = async () => {
        try {
            const response = await fetch('/api/notifications/read-all', {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
                setUnreadCount(0);
            }
        } catch (error) {
            console.error('모든 알림 읽음 처리 오류:', error);
        }
    };

    // 알림 삭제
    const deleteNotification = async (notificationId: string) => {
        try {
            const response = await fetch(`/api/notifications/${notificationId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error('알림 삭제 오류:', error);
        }
    };

    // 알림 클릭 처리
    const handleNotificationClick = (notification: Notification) => {
        if (!notification.read) {
            markAsRead(notification.id);
        }
        onNotificationClick?.(notification);
        onClose();
    };

    // 알림 타입별 아이콘
    const getNotificationIcon = (type: string) => {
        const iconMap = {
            todo_assigned: <InfoIcon />,
            todo_due_soon: <TimeIcon />,
            todo_overdue: <WarningIcon />,
            todo_completed: <CheckIcon />,
            comment_added: <InfoIcon />,
            status_changed: <InfoIcon />
        };
        return iconMap[type as keyof typeof iconMap] || <InfoIcon />;
    };

    // 우선순위별 색상
    const getPriorityColor = (priority: string) => {
        const colorMap = {
            low: 'gray',
            medium: 'blue',
            high: 'orange',
            urgent: 'red'
        };
        return colorMap[priority as keyof typeof colorMap] || 'gray';
    };

    // 날짜 포맷팅
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

        if (diffInMinutes < 1) return '방금 전';
        if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}시간 전`;
        if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}일 전`;

        return date.toLocaleDateString('ko-KR', {
            month: 'short',
            day: 'numeric'
        });
    };

    useEffect(() => {
        fetchNotifications();

        // 주기적으로 알림 새로고침 (5분마다)
        const interval = setInterval(fetchNotifications, 5 * 60 * 1000);

        return () => clearInterval(interval);
    }, []);

    // WebSocket을 통한 실시간 알림 수신
    useEffect(() => {
        const handleNewNotification = (notification: Notification) => {
            setNotifications(prev => [notification, ...prev]);
            setUnreadCount(prev => prev + 1);

            // 토스트 알림 표시
            toast({
                title: notification.title,
                description: notification.message,
                status: notification.priority === 'urgent' ? 'error' :
                    notification.priority === 'high' ? 'warning' : 'info',
                duration: 5000,
                isClosable: true,
                onClick: () => handleNotificationClick(notification)
            });
        };

        // WebSocket 이벤트 리스너 등록
        window.addEventListener('todo-notification', (event: any) => {
            handleNewNotification(event.detail);
        });

        return () => {
            window.removeEventListener('todo-notification', handleNewNotification);
        };
    }, [toast]);

    return (
        <>
            {/* 알림 버튼 */}
            <Menu>
                <MenuButton
                    as={IconButton}
                    aria-label="알림"
                    icon={<BellIcon />}
                    variant="ghost"
                    position="relative"
                >
                    {unreadCount > 0 && (
                        <Badge
                            position="absolute"
                            top="-1"
                            right="-1"
                            colorScheme="red"
                            borderRadius="full"
                            fontSize="xs"
                            minW="20px"
                            h="20px"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                        >
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </Badge>
                    )}
                </MenuButton>
                <MenuList maxW="400px" maxH="500px" overflowY="auto">
                    <Box p={3} borderBottom="1px solid" borderColor="gray.200">
                        <HStack justify="space-between">
                            <Text fontWeight="semibold">알림</Text>
                            {unreadCount > 0 && (
                                <Button
                                    size="xs"
                                    variant="ghost"
                                    onClick={markAllAsRead}
                                >
                                    모두 읽음
                                </Button>
                            )}
                        </HStack>
                    </Box>

                    {notifications.length === 0 ? (
                        <Box p={4} textAlign="center">
                            <Text color="gray.500">새로운 알림이 없습니다.</Text>
                        </Box>
                    ) : (
                        <VStack spacing={0} align="stretch">
                            {notifications.slice(0, 10).map((notification) => (
                                <MenuItem
                                    key={notification.id}
                                    onClick={() => handleNotificationClick(notification)}
                                    bg={notification.read ? 'transparent' : 'blue.50'}
                                    _hover={{ bg: notification.read ? 'gray.50' : 'blue.100' }}
                                >
                                    <HStack spacing={3} align="flex-start" w="full">
                                        <Box color={getPriorityColor(notification.priority)}>
                                            {getNotificationIcon(notification.type)}
                                        </Box>
                                        <VStack align="flex-start" spacing={1} flex={1}>
                                            <Text
                                                fontSize="sm"
                                                fontWeight={notification.read ? 'normal' : 'semibold'}
                                                noOfLines={2}
                                            >
                                                {notification.title}
                                            </Text>
                                            <Text fontSize="xs" color="gray.600" noOfLines={1}>
                                                {notification.message}
                                            </Text>
                                            <HStack spacing={2}>
                                                <Text fontSize="xs" color="gray.500">
                                                    {formatDate(notification.createdAt)}
                                                </Text>
                                                <Badge
                                                    size="sm"
                                                    colorScheme={getPriorityColor(notification.priority)}
                                                >
                                                    {notification.priority}
                                                </Badge>
                                            </HStack>
                                        </VStack>
                                        <IconButton
                                            aria-label="알림 삭제"
                                            icon={<CloseIcon />}
                                            size="xs"
                                            variant="ghost"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteNotification(notification.id);
                                            }}
                                        />
                                    </HStack>
                                </MenuItem>
                            ))}
                        </VStack>
                    )}
                </MenuList>
            </Menu>

            {/* 알림 상세 보기 드로어 */}
            <Drawer isOpen={isOpen} onClose={onClose} size="md">
                <DrawerOverlay />
                <DrawerContent>
                    <DrawerCloseButton />
                    <DrawerHeader>
                        <HStack justify="space-between">
                            <Text>모든 알림</Text>
                            {unreadCount > 0 && (
                                <Button size="sm" onClick={markAllAsRead}>
                                    모두 읽음
                                </Button>
                            )}
                        </HStack>
                    </DrawerHeader>
                    <DrawerBody>
                        <VStack spacing={4} align="stretch">
                            {notifications.length === 0 ? (
                                <Alert status="info">
                                    <AlertIcon />
                                    <AlertTitle>알림이 없습니다!</AlertTitle>
                                    <AlertDescription>
                                        새로운 TODO 관련 알림이 여기에 표시됩니다.
                                    </AlertDescription>
                                </Alert>
                            ) : (
                                notifications.map((notification) => (
                                    <Box
                                        key={notification.id}
                                        p={4}
                                        border="1px solid"
                                        borderColor="gray.200"
                                        borderRadius="md"
                                        bg={notification.read ? 'white' : 'blue.50'}
                                        cursor="pointer"
                                        onClick={() => handleNotificationClick(notification)}
                                        _hover={{ bg: notification.read ? 'gray.50' : 'blue.100' }}
                                    >
                                        <HStack spacing={3} align="flex-start">
                                            <Box color={getPriorityColor(notification.priority)}>
                                                {getNotificationIcon(notification.type)}
                                            </Box>
                                            <VStack align="flex-start" spacing={2} flex={1}>
                                                <Text
                                                    fontWeight={notification.read ? 'normal' : 'semibold'}
                                                    fontSize="md"
                                                >
                                                    {notification.title}
                                                </Text>
                                                <Text fontSize="sm" color="gray.600">
                                                    {notification.message}
                                                </Text>
                                                <HStack spacing={4} fontSize="xs" color="gray.500">
                                                    <Text>{formatDate(notification.createdAt)}</Text>
                                                    <Badge
                                                        colorScheme={getPriorityColor(notification.priority)}
                                                        size="sm"
                                                    >
                                                        {notification.priority}
                                                    </Badge>
                                                    {notification.user && (
                                                        <HStack spacing={1}>
                                                            <Avatar
                                                                size="xs"
                                                                name={notification.user.name}
                                                                src={notification.user.avatar}
                                                            />
                                                            <Text>{notification.user.name}</Text>
                                                        </HStack>
                                                    )}
                                                </HStack>
                                            </VStack>
                                            <IconButton
                                                aria-label="알림 삭제"
                                                icon={<CloseIcon />}
                                                size="sm"
                                                variant="ghost"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteNotification(notification.id);
                                                }}
                                            />
                                        </HStack>
                                    </Box>
                                ))
                            )}
                        </VStack>
                    </DrawerBody>
                </DrawerContent>
            </Drawer>
        </>
    );
};

export default TodoNotifications;
