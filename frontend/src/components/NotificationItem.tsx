/**
 * NotificationItem Component
 * 개별 알림 항목을 표시하는 컴포넌트
 * 
 * @author AUTOAGENTS
 * @date 2025-11-09
 */

import React from 'react';
import {
    Box,
    HStack,
    VStack,
    Text,
    IconButton,
    useColorModeValue,
    Avatar,
    Icon
} from '@chakra-ui/react';
import {
    DeleteIcon,
    ChatIcon,
    StarIcon,
    AtSignIcon,
    AddIcon,
    RepeatIcon,
    BellIcon
} from '@chakra-ui/icons';
import { useNotifications, Notification } from '../contexts/NotificationContext';

interface NotificationItemProps {
    notification: Notification;
    onClick?: () => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onClick }) => {
    const { markAsRead, deleteNotification } = useNotifications();

    // 색상 테마
    const bgColor = useColorModeValue(
        notification.is_read ? 'white' : 'blue.50',
        notification.is_read ? 'gray.800' : 'blue.900'
    );
    const hoverBg = useColorModeValue('gray.50', 'gray.700');
    const textColor = useColorModeValue('gray.800', 'white');
    const mutedColor = useColorModeValue('gray.600', 'gray.400');
    const iconBg = useColorModeValue('blue.100', 'blue.800');

    // 알림 타입별 아이콘
    const getIcon = () => {
        switch (notification.type) {
            case 'comment':
                return ChatIcon;
            case 'like':
                return StarIcon;
            case 'mention':
                return AtSignIcon;
            case 'follow':
                return AddIcon;
            case 'reply':
                return RepeatIcon;
            case 'system':
                return BellIcon;
            default:
                return BellIcon;
        }
    };

    // 알림 타입별 색상
    const getIconColor = () => {
        switch (notification.type) {
            case 'comment':
                return 'blue.500';
            case 'like':
                return 'red.500';
            case 'mention':
                return 'purple.500';
            case 'follow':
                return 'green.500';
            case 'reply':
                return 'orange.500';
            case 'system':
                return 'gray.500';
            default:
                return 'gray.500';
        }
    };

    // 시간 포맷팅
    const formatTime = (timestamp: string) => {
        const now = new Date();
        const time = new Date(timestamp);
        const diff = Math.floor((now.getTime() - time.getTime()) / 1000);

        if (diff < 60) return '방금 전';
        if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
        if (diff < 604800) return `${Math.floor(diff / 86400)}일 전`;

        return time.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // 알림 클릭 처리
    const handleClick = async () => {
        // 읽지 않은 알림이면 읽음 처리
        if (!notification.is_read) {
            await markAsRead(notification.id);
        }

        // 액션 URL이 있으면 해당 페이지로 이동
        if (notification.action_url) {
            window.location.href = notification.action_url;
        }

        // 부모 컴포넌트 닫기
        onClick?.();
    };

    // 알림 삭제 처리
    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation(); // 부모 클릭 이벤트 방지
        await deleteNotification(notification.id);
    };

    return (
        <Box
            bg={bgColor}
            p={4}
            cursor="pointer"
            _hover={{ bg: hoverBg }}
            transition="background 0.2s"
            onClick={handleClick}
            position="relative"
        >
            <HStack spacing={3} align="start">
                {/* 아이콘 또는 아바타 */}
                {notification.sender_avatar ? (
                    <Avatar
                        size="sm"
                        src={notification.sender_avatar}
                        name={notification.sender_name || undefined}
                    />
                ) : (
                    <Box
                        bg={iconBg}
                        p={2}
                        borderRadius="full"
                        flexShrink={0}
                    >
                        <Icon
                            as={getIcon()}
                            color={getIconColor()}
                            boxSize={4}
                        />
                    </Box>
                )}

                {/* 내용 */}
                <VStack flex={1} align="start" spacing={1}>
                    <Text
                        fontSize="sm"
                        fontWeight={notification.is_read ? 'normal' : 'bold'}
                        color={textColor}
                        noOfLines={2}
                    >
                        {notification.title}
                    </Text>
                    {notification.message && (
                        <Text
                            fontSize="xs"
                            color={mutedColor}
                            noOfLines={2}
                        >
                            {notification.message}
                        </Text>
                    )}
                    <Text fontSize="xs" color={mutedColor}>
                        {formatTime(notification.created_at)}
                    </Text>
                </VStack>

                {/* 삭제 버튼 */}
                <IconButton
                    aria-label="알림 삭제"
                    icon={<DeleteIcon />}
                    size="sm"
                    variant="ghost"
                    colorScheme="red"
                    onClick={handleDelete}
                    opacity={0.6}
                    _hover={{ opacity: 1 }}
                />
            </HStack>

            {/* 읽지 않음 표시 */}
            {!notification.is_read && (
                <Box
                    position="absolute"
                    left={2}
                    top="50%"
                    transform="translateY(-50%)"
                    width="6px"
                    height="6px"
                    borderRadius="full"
                    bg="blue.500"
                />
            )}
        </Box>
    );
};

export default NotificationItem;
