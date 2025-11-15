import React, { useState, useEffect } from 'react';
import {
    Box,
    VStack,
    HStack,
    Text,
    Heading,
    Switch,
    Badge,
    useColorModeValue,
    Spinner,
    Center,
    IconButton,
    Tooltip,
    useToast
} from '@chakra-ui/react';
import { FiUserMinus, FiBell, FiBellOff } from 'react-icons/fi';
import { apiClient } from '../utils/apiClient';
import { useNavigate } from 'react-router-dom';

interface Board {
    id: number;
    name: string;
    description?: string;
    notification_enabled: boolean;
    followed_at: string;
    post_count: number;
    follower_count: number;
}

/**
 * 팔로우한 게시판 목록 컴포넌트
 */
const BoardFollowList: React.FC = () => {
    const [boards, setBoards] = useState<Board[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingBoard, setUpdatingBoard] = useState<number | null>(null);

    const navigate = useNavigate();
    const toast = useToast();
    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.700');

    // 팔로우한 게시판 목록 조회
    const fetchFollowedBoards = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get('/api/follow/boards?limit=100');
            setBoards(response.boards || []);
        } catch (error) {
            console.error('팔로우 게시판 목록 조회 실패:', error);
            toast({
                title: '오류 발생',
                description: '게시판 목록을 불러오지 못했습니다.',
                status: 'error',
                duration: 3000,
                isClosable: true
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFollowedBoards();
    }, []);

    // 알림 설정 변경
    const handleNotificationToggle = async (boardId: number, currentValue: boolean) => {
        try {
            setUpdatingBoard(boardId);

            await apiClient.put(`/api/follow/board/${boardId}/notification`, {
                enabled: !currentValue
            });

            // 로컬 상태 업데이트
            setBoards(boards.map(board =>
                board.id === boardId
                    ? { ...board, notification_enabled: !currentValue }
                    : board
            ));

            toast({
                title: '알림 설정 변경',
                description: `알림이 ${!currentValue ? '활성화' : '비활성화'}되었습니다.`,
                status: 'success',
                duration: 2000,
                isClosable: true
            });
        } catch (error) {
            console.error('알림 설정 변경 실패:', error);
            toast({
                title: '오류 발생',
                description: '알림 설정을 변경하지 못했습니다.',
                status: 'error',
                duration: 3000,
                isClosable: true
            });
        } finally {
            setUpdatingBoard(null);
        }
    };

    // 언팔로우
    const handleUnfollow = async (boardId: number, boardName: string) => {
        if (!window.confirm(`${boardName} 게시판을 언팔로우하시겠습니까?`)) {
            return;
        }

        try {
            setUpdatingBoard(boardId);

            await apiClient.delete(`/api/follow/board/${boardId}`);

            // 로컬 상태에서 제거
            setBoards(boards.filter(board => board.id !== boardId));

            toast({
                title: '언팔로우 완료',
                description: `${boardName} 게시판을 언팔로우했습니다.`,
                status: 'info',
                duration: 3000,
                isClosable: true
            });
        } catch (error) {
            console.error('언팔로우 실패:', error);
            toast({
                title: '오류 발생',
                description: '언팔로우 처리 중 오류가 발생했습니다.',
                status: 'error',
                duration: 3000,
                isClosable: true
            });
        } finally {
            setUpdatingBoard(null);
        }
    };

    if (loading) {
        return (
            <Center py={10}>
                <Spinner size="xl" />
            </Center>
        );
    }

    if (boards.length === 0) {
        return (
            <Center py={10}>
                <VStack spacing={3}>
                    <Text color="gray.500" fontSize="lg">
                        팔로우한 게시판이 없습니다
                    </Text>
                    <Text color="gray.400" fontSize="sm">
                        관심 있는 게시판을 팔로우해보세요!
                    </Text>
                </VStack>
            </Center>
        );
    }

    return (
        <VStack spacing={4} align="stretch">
            <Heading size="md">팔로우한 게시판 ({boards.length})</Heading>

            {boards.map(board => (
                <Box
                    key={board.id}
                    p={4}
                    bg={bgColor}
                    borderWidth="1px"
                    borderColor={borderColor}
                    borderRadius="md"
                    _hover={{ shadow: 'md' }}
                    transition="all 0.2s"
                >
                    <HStack justify="space-between" align="start">
                        <VStack flex={1} align="start" spacing={2}>
                            <HStack>
                                <Text
                                    fontWeight="bold"
                                    fontSize="lg"
                                    cursor="pointer"
                                    onClick={() => navigate(`/board/${board.id}`)}
                                    _hover={{ color: 'blue.500' }}
                                >
                                    {board.name}
                                </Text>
                                <Badge colorScheme="blue">
                                    팔로워 {board.follower_count}
                                </Badge>
                            </HStack>

                            {board.description && (
                                <Text fontSize="sm" color="gray.600" noOfLines={2}>
                                    {board.description}
                                </Text>
                            )}

                            <HStack fontSize="xs" color="gray.500" spacing={4}>
                                <Text>게시물 {board.post_count}</Text>
                                <Text>
                                    팔로우: {new Date(board.followed_at).toLocaleDateString()}
                                </Text>
                            </HStack>

                            {/* 알림 설정 */}
                            <HStack spacing={2}>
                                {board.notification_enabled ? (
                                    <FiBell color="green" />
                                ) : (
                                    <FiBellOff color="gray" />
                                )}
                                <Text fontSize="sm" fontWeight="medium">
                                    알림
                                </Text>
                                <Switch
                                    size="sm"
                                    isChecked={board.notification_enabled}
                                    onChange={() => handleNotificationToggle(board.id, board.notification_enabled)}
                                    isDisabled={updatingBoard === board.id}
                                />
                            </HStack>
                        </VStack>

                        {/* 언팔로우 버튼 */}
                        <Tooltip label="언팔로우">
                            <IconButton
                                aria-label="언팔로우"
                                icon={<FiUserMinus />}
                                size="sm"
                                colorScheme="red"
                                variant="ghost"
                                onClick={() => handleUnfollow(board.id, board.name)}
                                isLoading={updatingBoard === board.id}
                            />
                        </Tooltip>
                    </HStack>
                </Box>
            ))}
        </VStack>
    );
};

export default BoardFollowList;
