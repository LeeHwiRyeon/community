/**
 * Notifications Page
 * 알림 목록 및 설정 페이지
 * 
 * Phase 3 - Real-time Notification System
 * @author Phase 3 Development Team
 * @date 2025-11-12
 */

import React, { useEffect, useState } from 'react';
import {
    Box,
    Container,
    Heading,
    Text,
    VStack,
    HStack,
    Button,
    Badge,
    IconButton,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    Switch,
    FormControl,
    FormLabel,
    Divider,
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
    Alert,
    AlertIcon,
    useToast,
    Spinner,
    useColorModeValue,
    Card,
    CardBody,
    CardHeader,
    Avatar,
    Flex,
    Spacer,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    useDisclosure,
    Input,
    Select
} from '@chakra-ui/react';
import {
    BellIcon,
    SettingsIcon,
    CheckIcon,
    DeleteIcon,
    TimeIcon
} from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../contexts/NotificationContext';

interface NotificationSettings {
    new_follower: boolean;
    new_comment: boolean;
    comment_reply: boolean;
    post_like: boolean;
    comment_like: boolean;
    mention: boolean;
    moderator_warning: boolean;
    moderator_ban: boolean;
    moderator_action: boolean;
    system: boolean;
    board_follow: boolean;
    user_follow: boolean;
    bookmark: boolean;
    quiet_hours_enabled: boolean;
    quiet_hours_start: string;
    quiet_hours_end: string;
}

const NotificationsPage: React.FC = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
    const { isOpen: isSettingsOpen, onOpen: onSettingsOpen, onClose: onSettingsClose } = useDisclosure();

    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');
    const [settings, setSettings] = useState<NotificationSettings>({
        new_follower: true,
        new_comment: true,
        comment_reply: true,
        post_like: true,
        comment_like: true,
        mention: true,
        moderator_warning: true,
        moderator_ban: true,
        moderator_action: true,
        system: true,
        board_follow: true,
        user_follow: true,
        bookmark: true,
        quiet_hours_enabled: false,
        quiet_hours_start: '22:00',
        quiet_hours_end: '08:00'
    });

    // 색상 테마
    const bgColor = useColorModeValue('gray.50', 'gray.900');
    const cardBgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.700');
    const hoverBgColor = useColorModeValue('gray.100', 'gray.700');
    const unreadBgColor = useColorModeValue('blue.50', 'blue.900');

    useEffect(() => {
        loadNotifications();
        loadSettings();
    }, []);

    const loadNotifications = async () => {
        setLoading(true);
        try {
            await fetchNotifications();
        } catch (error) {
            toast({
                title: '알림 로드 실패',
                description: '알림을 불러오는 중 오류가 발생했습니다.',
                status: 'error',
                duration: 3000,
                isClosable: true
            });
        } finally {
            setLoading(false);
        }
    };

    const loadSettings = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            if (!token) return;

            const API_URL = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:50000';
            const response = await fetch(`${API_URL}/api/notifications/settings`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data) {
                    setSettings(data.data);
                }
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
    };

    const handleMarkAsRead = async (notificationId: number) => {
        try {
            await markAsRead(notificationId);
            toast({
                title: '읽음 처리 완료',
                status: 'success',
                duration: 2000,
                isClosable: true
            });
        } catch (error) {
            toast({
                title: '읽음 처리 실패',
                status: 'error',
                duration: 3000,
                isClosable: true
            });
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await markAllAsRead();
            toast({
                title: '모든 알림을 읽음 처리했습니다',
                status: 'success',
                duration: 2000,
                isClosable: true
            });
        } catch (error) {
            toast({
                title: '읽음 처리 실패',
                status: 'error',
                duration: 3000,
                isClosable: true
            });
        }
    };

    const handleDelete = async (notificationId: number) => {
        try {
            await deleteNotification(notificationId);
            toast({
                title: '알림이 삭제되었습니다',
                status: 'success',
                duration: 2000,
                isClosable: true
            });
        } catch (error) {
            toast({
                title: '삭제 실패',
                status: 'error',
                duration: 3000,
                isClosable: true
            });
        }
    };

    const handleNotificationClick = (notification: any) => {
        if (!notification.is_read) {
            handleMarkAsRead(notification.id);
        }

        // 액션 URL로 이동
        if (notification.action_url) {
            navigate(notification.action_url);
        } else if (notification.link) {
            navigate(notification.link);
        }
    };

    const handleSaveSettings = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            if (!token) return;

            const API_URL = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:50000';
            const response = await fetch(`${API_URL}/api/notifications/settings`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(settings)
            });

            if (response.ok) {
                toast({
                    title: '설정이 저장되었습니다',
                    status: 'success',
                    duration: 2000,
                    isClosable: true
                });
                onSettingsClose();
            } else {
                throw new Error('Failed to save settings');
            }
        } catch (error) {
            toast({
                title: '설정 저장 실패',
                status: 'error',
                duration: 3000,
                isClosable: true
            });
        }
    };

    const filteredNotifications = filter === 'unread'
        ? notifications.filter(n => !n.is_read)
        : notifications;

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'follow':
            case 'new_follower':
                return '👤';
            case 'like':
            case 'post_like':
                return '❤️';
            case 'comment':
            case 'new_comment':
                return '💬';
            case 'reply':
            case 'comment_reply':
                return '↩️';
            case 'mention':
                return '@';
            case 'system':
                return '📢';
            default:
                return '🔔';
        }
    };

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return '방금 전';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}분 전`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}시간 전`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}일 전`;
        return date.toLocaleDateString('ko-KR');
    };

    return (
        <Container maxW="container.lg" py={8}>
            {/* 헤더 */}
            <VStack spacing={6} align="stretch">
                <Box>
                    <HStack justify="space-between" mb={4}>
                        <HStack>
                            <BellIcon boxSize={6} />
                            <Heading size="lg">알림</Heading>
                            {unreadCount > 0 && (
                                <Badge colorScheme="red" fontSize="md" borderRadius="full">
                                    {unreadCount}
                                </Badge>
                            )}
                        </HStack>

                        <HStack>
                            <Button
                                leftIcon={<CheckIcon />}
                                size="sm"
                                onClick={handleMarkAllAsRead}
                                isDisabled={unreadCount === 0}
                            >
                                모두 읽음
                            </Button>
                            <IconButton
                                aria-label="설정"
                                icon={<SettingsIcon />}
                                size="sm"
                                onClick={onSettingsOpen}
                            />
                        </HStack>
                    </HStack>

                    {/* 필터 탭 */}
                    <Tabs variant="soft-rounded" colorScheme="blue" onChange={(index) => setFilter(index === 0 ? 'all' : 'unread')}>
                        <TabList>
                            <Tab>전체 ({notifications.length})</Tab>
                            <Tab>읽지 않음 ({unreadCount})</Tab>
                        </TabList>
                    </Tabs>
                </Box>

                {/* 알림 목록 */}
                {loading ? (
                    <Box textAlign="center" py={10}>
                        <Spinner size="xl" />
                        <Text mt={4}>알림을 불러오는 중...</Text>
                    </Box>
                ) : filteredNotifications.length === 0 ? (
                    <Alert status="info" borderRadius="md">
                        <AlertIcon />
                        {filter === 'unread' ? '읽지 않은 알림이 없습니다.' : '알림이 없습니다.'}
                    </Alert>
                ) : (
                    <VStack spacing={2} align="stretch">
                        {filteredNotifications.map((notification) => (
                            <Card
                                key={notification.id}
                                bg={notification.is_read ? cardBgColor : unreadBgColor}
                                borderWidth="1px"
                                borderColor={borderColor}
                                _hover={{ bg: hoverBgColor, cursor: 'pointer' }}
                                onClick={() => handleNotificationClick(notification)}
                            >
                                <CardBody>
                                    <Flex align="start">
                                        <Box fontSize="2xl" mr={3}>
                                            {getNotificationIcon(notification.type)}
                                        </Box>

                                        <Box flex="1">
                                            <HStack mb={2}>
                                                {notification.sender_name && (
                                                    <Text fontWeight="bold" fontSize="sm">
                                                        {notification.sender_name}
                                                    </Text>
                                                )}
                                                <Text fontSize="xs" color="gray.500">
                                                    {formatTimeAgo(notification.created_at)}
                                                </Text>
                                                {!notification.is_read && (
                                                    <Badge colorScheme="blue" fontSize="xs">
                                                        NEW
                                                    </Badge>
                                                )}
                                            </HStack>

                                            <Text fontSize="sm" mb={1}>
                                                {notification.title}
                                            </Text>
                                            <Text fontSize="xs" color="gray.600">
                                                {notification.message}
                                            </Text>
                                        </Box>

                                        <HStack>
                                            {!notification.is_read && (
                                                <IconButton
                                                    aria-label="읽음 처리"
                                                    icon={<CheckIcon />}
                                                    size="xs"
                                                    variant="ghost"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleMarkAsRead(notification.id);
                                                    }}
                                                />
                                            )}
                                            <IconButton
                                                aria-label="삭제"
                                                icon={<DeleteIcon />}
                                                size="xs"
                                                variant="ghost"
                                                colorScheme="red"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(notification.id);
                                                }}
                                            />
                                        </HStack>
                                    </Flex>
                                </CardBody>
                            </Card>
                        ))}
                    </VStack>
                )}
            </VStack>

            {/* 설정 모달 */}
            <Modal isOpen={isSettingsOpen} onClose={onSettingsClose} size="lg">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>알림 설정</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack spacing={4} align="stretch">
                            <Text fontWeight="bold" fontSize="sm">
                                알림 유형별 설정
                            </Text>

                            {Object.entries({
                                new_follower: '새 팔로워',
                                new_comment: '새 댓글',
                                comment_reply: '댓글 답글',
                                post_like: '게시물 좋아요',
                                comment_like: '댓글 좋아요',
                                mention: '멘션',
                                moderator_warning: '모더레이터 경고',
                                moderator_ban: '차단 알림',
                                moderator_action: '모더레이터 조치',
                                system: '시스템 알림',
                                board_follow: '게시판 팔로우',
                                user_follow: '사용자 팔로우',
                                bookmark: '북마크'
                            }).map(([key, label]) => (
                                <FormControl key={key} display="flex" alignItems="center">
                                    <FormLabel htmlFor={key} mb="0" flex="1" fontSize="sm">
                                        {label}
                                    </FormLabel>
                                    <Switch
                                        id={key}
                                        isChecked={settings[key as keyof NotificationSettings] as boolean}
                                        onChange={(e) => setSettings({ ...settings, [key]: e.target.checked })}
                                    />
                                </FormControl>
                            ))}

                            <Divider />

                            <Text fontWeight="bold" fontSize="sm">
                                방해 금지 시간
                            </Text>

                            <FormControl display="flex" alignItems="center">
                                <FormLabel htmlFor="quiet_hours_enabled" mb="0" flex="1" fontSize="sm">
                                    방해 금지 시간 활성화
                                </FormLabel>
                                <Switch
                                    id="quiet_hours_enabled"
                                    isChecked={settings.quiet_hours_enabled}
                                    onChange={(e) => setSettings({ ...settings, quiet_hours_enabled: e.target.checked })}
                                />
                            </FormControl>

                            {settings.quiet_hours_enabled && (
                                <HStack>
                                    <FormControl>
                                        <FormLabel fontSize="sm">시작 시간</FormLabel>
                                        <Input
                                            type="time"
                                            value={settings.quiet_hours_start}
                                            onChange={(e) => setSettings({ ...settings, quiet_hours_start: e.target.value })}
                                        />
                                    </FormControl>
                                    <FormControl>
                                        <FormLabel fontSize="sm">종료 시간</FormLabel>
                                        <Input
                                            type="time"
                                            value={settings.quiet_hours_end}
                                            onChange={(e) => setSettings({ ...settings, quiet_hours_end: e.target.value })}
                                        />
                                    </FormControl>
                                </HStack>
                            )}
                        </VStack>
                    </ModalBody>

                    <ModalFooter>
                        <Button variant="ghost" mr={3} onClick={onSettingsClose}>
                            취소
                        </Button>
                        <Button colorScheme="blue" onClick={handleSaveSettings}>
                            저장
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </Container>
    );
};

export default NotificationsPage;
