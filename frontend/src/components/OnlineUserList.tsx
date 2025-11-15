import React, { useState, useEffect } from 'react';
import {
    Box,
    VStack,
    HStack,
    Avatar,
    Text,
    Badge,
    Heading,
    useColorModeValue,
    Skeleton,
    SkeletonCircle,
    Icon,
    Tooltip,
    Button,
    useToast
} from '@chakra-ui/react';
import { FiUsers, FiRefreshCw, FiMonitor, FiSmartphone } from 'react-icons/fi';
import OnlineStatusBadge from './OnlineStatusBadge';
import { apiClient } from '../utils/apiClient';

interface OnlineUser {
    userId: number;
    username: string;
    displayName: string;
    avatarUrl?: string;
    status: 'online' | 'away' | 'busy';
    lastHeartbeat: string;
    deviceType: string;
}

interface OnlineUserListProps {
    maxHeight?: string;
    showRefresh?: boolean;
    onUserClick?: (userId: number) => void;
}

/**
 * 온라인 사용자 목록 컴포넌트
 * 
 * @example
 * ```tsx
 * <OnlineUserList 
 *   maxHeight="400px"
 *   showRefresh
 *   onUserClick={(userId) => navigate(`/profile/${userId}`)}
 * />
 * ```
 */
const OnlineUserList: React.FC<OnlineUserListProps> = ({
    maxHeight = '500px',
    showRefresh = true,
    onUserClick
}) => {
    const [users, setUsers] = useState<OnlineUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [statistics, setStatistics] = useState({
        total_online: 0,
        actively_online: 0,
        away: 0,
        busy: 0,
        mobile_users: 0,
        desktop_users: 0
    });

    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.600');
    const hoverBg = useColorModeValue('gray.50', 'gray.700');
    const toast = useToast();

    const fetchOnlineUsers = async () => {
        try {
            const [usersResponse, statsResponse] = await Promise.all([
                apiClient.get('/api/online-status/online-users?limit=50'),
                apiClient.get('/api/online-status/statistics')
            ]);

            setUsers(usersResponse.data.users || []);
            setStatistics(statsResponse.data);
        } catch (error) {
            console.error('온라인 사용자 조회 실패:', error);
            toast({
                title: '오류',
                description: '온라인 사용자 목록을 불러올 수 없습니다.',
                status: 'error',
                duration: 3000,
                isClosable: true
            });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchOnlineUsers();

        // 30초마다 자동 새로고침
        const interval = setInterval(fetchOnlineUsers, 30000);

        return () => clearInterval(interval);
    }, []);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchOnlineUsers();
    };

    const handleUserClick = (userId: number) => {
        if (onUserClick) {
            onUserClick(userId);
        }
    };

    if (loading) {
        return (
            <Box
                bg={bgColor}
                borderRadius="lg"
                p={4}
                border="1px"
                borderColor={borderColor}
            >
                <VStack spacing={3} align="stretch">
                    {[...Array(5)].map((_, i) => (
                        <HStack key={i} spacing={3}>
                            <SkeletonCircle size="10" />
                            <VStack align="start" flex={1} spacing={1}>
                                <Skeleton height="16px" width="120px" />
                                <Skeleton height="12px" width="80px" />
                            </VStack>
                        </HStack>
                    ))}
                </VStack>
            </Box>
        );
    }

    return (
        <Box
            bg={bgColor}
            borderRadius="lg"
            border="1px"
            borderColor={borderColor}
            overflow="hidden"
        >
            {/* 헤더 */}
            <Box p={4} borderBottom="1px" borderColor={borderColor}>
                <HStack justify="space-between" mb={3}>
                    <HStack spacing={2}>
                        <Icon as={FiUsers} boxSize={5} color="blue.500" />
                        <Heading size="md">온라인 사용자</Heading>
                        <Badge colorScheme="green" fontSize="md" borderRadius="full" px={2}>
                            {statistics.total_online}명
                        </Badge>
                    </HStack>

                    {showRefresh && (
                        <Button
                            size="sm"
                            variant="ghost"
                            leftIcon={<FiRefreshCw />}
                            onClick={handleRefresh}
                            isLoading={refreshing}
                            loadingText="새로고침"
                        >
                            새로고침
                        </Button>
                    )}
                </HStack>

                {/* 통계 */}
                <HStack spacing={4} fontSize="sm" color="gray.600">
                    <HStack spacing={1}>
                        <Badge colorScheme="green" variant="subtle">활동 중</Badge>
                        <Text>{statistics.actively_online}</Text>
                    </HStack>
                    <HStack spacing={1}>
                        <Badge colorScheme="yellow" variant="subtle">자리 비움</Badge>
                        <Text>{statistics.away}</Text>
                    </HStack>
                    <HStack spacing={1}>
                        <Badge colorScheme="red" variant="subtle">다른 용무</Badge>
                        <Text>{statistics.busy}</Text>
                    </HStack>
                </HStack>

                <HStack spacing={4} fontSize="sm" color="gray.600" mt={2}>
                    <HStack spacing={1}>
                        <Icon as={FiMonitor} />
                        <Text>{statistics.desktop_users}명</Text>
                    </HStack>
                    <HStack spacing={1}>
                        <Icon as={FiSmartphone} />
                        <Text>{statistics.mobile_users}명</Text>
                    </HStack>
                </HStack>
            </Box>

            {/* 사용자 목록 */}
            <Box maxH={maxHeight} overflowY="auto">
                {users.length === 0 ? (
                    <Box p={8} textAlign="center" color="gray.500">
                        <Text>온라인 사용자가 없습니다</Text>
                    </Box>
                ) : (
                    <VStack spacing={0} align="stretch">
                        {users.map((user) => (
                            <HStack
                                key={user.userId}
                                p={3}
                                spacing={3}
                                _hover={{ bg: hoverBg }}
                                cursor="pointer"
                                onClick={() => handleUserClick(user.userId)}
                                transition="background 0.2s"
                            >
                                <Box position="relative">
                                    <Avatar
                                        size="md"
                                        src={user.avatarUrl}
                                        name={user.displayName || user.username}
                                    />
                                    <OnlineStatusBadge
                                        isOnline={true}
                                        status={user.status}
                                        size="sm"
                                    />
                                </Box>

                                <VStack align="start" spacing={0} flex={1}>
                                    <HStack spacing={2}>
                                        <Text fontWeight="semibold" fontSize="sm">
                                            {user.displayName || user.username}
                                        </Text>
                                        <Tooltip
                                            label={user.deviceType === 'mobile' ? '모바일' : '데스크톱'}
                                            placement="top"
                                        >
                                            <Box>
                                                <Icon
                                                    as={user.deviceType === 'mobile' ? FiSmartphone : FiMonitor}
                                                    boxSize={3}
                                                    color="gray.500"
                                                />
                                            </Box>
                                        </Tooltip>
                                    </HStack>
                                    <Text fontSize="xs" color="gray.500">
                                        @{user.username}
                                    </Text>
                                </VStack>

                                <Badge
                                    colorScheme={
                                        user.status === 'online' ? 'green' :
                                            user.status === 'away' ? 'yellow' : 'red'
                                    }
                                    fontSize="xs"
                                    borderRadius="full"
                                    px={2}
                                >
                                    {user.status === 'online' ? '활동 중' :
                                        user.status === 'away' ? '자리 비움' : '다른 용무 중'}
                                </Badge>
                            </HStack>
                        ))}
                    </VStack>
                )}
            </Box>
        </Box>
    );
};

export default OnlineUserList;
