import React, { useState, useEffect } from 'react';
import {
    Box,
    Badge,
    HStack,
    Text,
    Icon,
    Tooltip,
    useColorModeValue,
    VStack,
    Progress,
    Divider
} from '@chakra-ui/react';
import {
    CheckIcon,
    TimeIcon,
    ViewIcon,
    StarIcon
} from '@chakra-ui/icons';

export interface ReadStatus {
    id: string;
    postId: string;
    boardId: string;
    communityId?: string;
    readAt: string;
    readDuration?: number;
    isFullyRead: boolean;
    scrollPosition?: number;
    deviceType?: 'desktop' | 'mobile' | 'tablet';
}

interface ReadStatusIndicatorProps {
    postId: string;
    boardId: string;
    communityId?: string;
    userId?: number;
    isRead?: boolean;
    readDuration?: number;
    isFullyRead?: boolean;
    readAt?: string;
    onReadStatusChange?: (isRead: boolean, readDuration?: number) => void;
    showDetails?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

const ReadStatusIndicator: React.FC<ReadStatusIndicatorProps> = ({
    postId,
    boardId,
    communityId,
    userId,
    isRead = false,
    readDuration = 0,
    isFullyRead = false,
    readAt,
    onReadStatusChange,
    showDetails = false,
    size = 'md'
}) => {
    const [readStatus, setReadStatus] = useState<ReadStatus | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.600');
    const readColor = useColorModeValue('green.500', 'green.400');
    const unreadColor = useColorModeValue('gray.400', 'gray.500');
    const partialReadColor = useColorModeValue('yellow.500', 'yellow.400');

    // 읽음 상태 업데이트
    const updateReadStatus = async (duration?: number) => {
        if (isLoading) return;

        setIsLoading(true);
        try {
            const response = await fetch('/api/read-status', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    postId,
                    boardId,
                    communityId,
                    userId,
                    readDuration: duration,
                    deviceType: window.innerWidth < 768 ? 'mobile' :
                        window.innerWidth < 1024 ? 'tablet' : 'desktop'
                }),
            });

            const data = await response.json();

            if (data.success) {
                setReadStatus(data.data);
                if (onReadStatusChange) {
                    onReadStatusChange(true, duration);
                }
            }
        } catch (error) {
            console.error('Error updating read status:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // 읽음 상태 조회
    const fetchReadStatus = async () => {
        try {
            const params = new URLSearchParams();
            if (userId) params.append('userId', userId.toString());
            else params.append('ipAddress', 'current');

            const response = await fetch(`/api/read-status/post/${postId}?${params}`);
            const data = await response.json();

            if (data.success && data.data) {
                setReadStatus(data.data);
            }
        } catch (error) {
            console.error('Error fetching read status:', error);
        }
    };

    // 컴포넌트 마운트 시 읽음 상태 조회
    useEffect(() => {
        fetchReadStatus();
    }, [postId, userId]);

    // 읽음 상태에 따른 색상 결정
    const getStatusColor = () => {
        if (isRead || readStatus) {
            if (isFullyRead || readStatus?.isFullyRead) {
                return readColor;
            } else {
                return partialReadColor;
            }
        }
        return unreadColor;
    };

    // 읽음 상태에 따른 아이콘 결정
    const getStatusIcon = () => {
        if (isRead || readStatus) {
            if (isFullyRead || readStatus?.isFullyRead) {
                return CheckIcon;
            } else {
                return TimeIcon;
            }
        }
        return ViewIcon;
    };

    // 읽음 상태에 따른 텍스트 결정
    const getStatusText = () => {
        if (isRead || readStatus) {
            if (isFullyRead || readStatus?.isFullyRead) {
                return '읽음';
            } else {
                return '부분 읽음';
            }
        }
        return '읽지 않음';
    };

    // 읽음 시간 포맷팅
    const formatReadDuration = (duration?: number) => {
        if (!duration) return '';

        if (duration < 60) {
            return `${Math.round(duration)}초`;
        } else if (duration < 3600) {
            return `${Math.round(duration / 60)}분`;
        } else {
            return `${Math.round(duration / 3600)}시간`;
        }
    };

    // 읽음 시간에 따른 진행률 계산
    const getReadProgress = () => {
        const duration = readDuration || readStatus?.readDuration || 0;
        if (duration < 30) return 0;
        if (duration < 60) return 25;
        if (duration < 120) return 50;
        if (duration < 300) return 75;
        return 100;
    };

    const statusColor = getStatusColor();
    const StatusIcon = getStatusIcon();
    const statusText = getStatusText();
    const readProgress = getReadProgress();

    return (
        <Box className="read-status-indicator">
            <HStack spacing={2} align="center">
                {/* 읽음 상태 아이콘 */}
                <Tooltip label={statusText} placement="top">
                    <Box
                        cursor="pointer"
                        onClick={() => updateReadStatus()}
                        opacity={isLoading ? 0.6 : 1}
                        transition="opacity 0.2s"
                    >
                        <Icon
                            as={StatusIcon}
                            color={statusColor}
                            boxSize={size === 'sm' ? 3 : size === 'lg' ? 6 : 4}
                        />
                    </Box>
                </Tooltip>

                {/* 읽음 상태 텍스트 */}
                <Text
                    fontSize={size === 'sm' ? 'xs' : size === 'lg' ? 'sm' : 'xs'}
                    color={statusColor}
                    fontWeight="medium"
                >
                    {statusText}
                </Text>

                {/* 읽음 시간 표시 */}
                {(readDuration || readStatus?.readDuration) && (
                    <Text
                        fontSize="xs"
                        color="gray.500"
                    >
                        {formatReadDuration(readDuration || readStatus?.readDuration)}
                    </Text>
                )}

                {/* 상세 정보 표시 */}
                {showDetails && (isRead || readStatus) && (
                    <VStack spacing={1} align="start">
                        {/* 읽음 진행률 */}
                        <Box width="100px">
                            <Progress
                                value={readProgress}
                                size="sm"
                                colorScheme={readProgress === 100 ? 'green' : 'yellow'}
                                borderRadius="md"
                            />
                        </Box>

                        {/* 읽은 시간 */}
                        {readAt && (
                            <Text fontSize="xs" color="gray.500">
                                {new Date(readAt).toLocaleString()}
                            </Text>
                        )}

                        {/* 디바이스 타입 */}
                        {readStatus?.deviceType && (
                            <Badge
                                size="sm"
                                colorScheme={readStatus.deviceType === 'mobile' ? 'blue' :
                                    readStatus.deviceType === 'tablet' ? 'purple' : 'gray'}
                            >
                                {readStatus.deviceType === 'mobile' ? '모바일' :
                                    readStatus.deviceType === 'tablet' ? '태블릿' : '데스크톱'}
                            </Badge>
                        )}
                    </VStack>
                )}
            </HStack>
        </Box>
    );
};

export default ReadStatusIndicator;

