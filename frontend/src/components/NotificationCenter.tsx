/**
 * NotificationCenter Component
 * 알림 목록을 표시하는 드롭다운 센터
 * 
 * @author AUTOAGENTS
 * @date 2025-11-09
 */

import React, { useEffect, useState } from 'react';
import {
    Box,
    VStack,
    HStack,
    Text,
    Button,
    Divider,
    Spinner,
    Center,
    IconButton,
    useColorModeValue,
    Flex
} from '@chakra-ui/react';
import { CloseIcon } from '@chakra-ui/icons';
import { useNotifications } from '../contexts/NotificationContext';
import NotificationItem from './NotificationItem';

interface NotificationCenterProps {
    /** 닫기 콜백 */
    onClose?: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ onClose }) => {
    const {
        notifications,
        unreadCount,
        fetchNotifications,
        markAllAsRead
    } = useNotifications();

    const [isLoading, setIsLoading] = useState(false);
    const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);

    // 색상 테마
    const bgColor = useColorModeValue('white', 'gray.800');
    const headerBg = useColorModeValue('gray.50', 'gray.700');
    const borderColor = useColorModeValue('gray.200', 'gray.600');
    const textColor = useColorModeValue('gray.800', 'white');
    const mutedColor = useColorModeValue('gray.600', 'gray.400');

    // 초기 로딩
    useEffect(() => {
        const loadNotifications = async () => {
            setIsLoading(true);
            await fetchNotifications();
            setIsLoading(false);
        };

        loadNotifications();
    }, [fetchNotifications]);

    // 모두 읽음 처리
    const handleMarkAllRead = async () => {
        setIsMarkingAllRead(true);
        await markAllAsRead();
        setIsMarkingAllRead(false);
    };

    return (
        <Box
            bg={bgColor}
            borderRadius="md"
            overflow="hidden"
            width="100%"
        >
            {/* 헤더 */}
            <Flex
                bg={headerBg}
                p={4}
                alignItems="center"
                justifyContent="space-between"
                borderBottom="1px"
                borderColor={borderColor}
            >
                <HStack spacing={3}>
                    <Text fontSize="lg" fontWeight="bold" color={textColor}>
                        알림
                    </Text>
                    {unreadCount > 0 && (
                        <Box
                            bg="red.500"
                            color="white"
                            fontSize="xs"
                            fontWeight="bold"
                            px={2}
                            py={0.5}
                            borderRadius="full"
                        >
                            {unreadCount}
                        </Box>
                    )}
                </HStack>

                <HStack spacing={2}>
                    {unreadCount > 0 && (
                        <Button
                            size="sm"
                            variant="ghost"
                            colorScheme="blue"
                            onClick={handleMarkAllRead}
                            isLoading={isMarkingAllRead}
                            loadingText="처리 중..."
                        >
                            모두 읽음
                        </Button>
                    )}
                    {onClose && (
                        <IconButton
                            aria-label="닫기"
                            icon={<CloseIcon />}
                            size="sm"
                            variant="ghost"
                            onClick={onClose}
                        />
                    )}
                </HStack>
            </Flex>

            {/* 알림 목록 */}
            <Box
                maxHeight="500px"
                overflowY="auto"
                css={{
                    '&::-webkit-scrollbar': {
                        width: '8px',
                    },
                    '&::-webkit-scrollbar-track': {
                        background: 'transparent',
                    },
                    '&::-webkit-scrollbar-thumb': {
                        background: useColorModeValue('#CBD5E0', '#4A5568'),
                        borderRadius: '4px',
                    },
                    '&::-webkit-scrollbar-thumb:hover': {
                        background: useColorModeValue('#A0AEC0', '#718096'),
                    },
                }}
            >
                {isLoading ? (
                    <Center py={8}>
                        <VStack spacing={3}>
                            <Spinner size="lg" color="blue.500" />
                            <Text color={mutedColor}>알림을 불러오는 중...</Text>
                        </VStack>
                    </Center>
                ) : notifications.length === 0 ? (
                    <Center py={8}>
                        <VStack spacing={2}>
                            <Text fontSize="3xl">🔔</Text>
                            <Text color={mutedColor}>알림이 없습니다</Text>
                        </VStack>
                    </Center>
                ) : (
                    <VStack spacing={0} divider={<Divider />} align="stretch">
                        {notifications.map((notification) => (
                            <NotificationItem
                                key={notification.id}
                                notification={notification}
                                onClick={onClose}
                            />
                        ))}
                    </VStack>
                )}
            </Box>

            {/* 푸터 */}
            {notifications.length > 0 && (
                <Box
                    borderTop="1px"
                    borderColor={borderColor}
                    p={3}
                    textAlign="center"
                >
                    <Button
                        size="sm"
                        variant="link"
                        colorScheme="blue"
                        onClick={() => {
                            // 알림 페이지로 이동 (추후 구현)
                            console.log('Navigate to notifications page');
                            onClose?.();
                        }}
                    >
                        모든 알림 보기
                    </Button>
                </Box>
            )}
        </Box>
    );
};

export default NotificationCenter;
