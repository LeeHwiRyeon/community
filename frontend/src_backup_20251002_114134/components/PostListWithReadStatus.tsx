import React, { useState, useEffect } from 'react';
import {
    Box,
    VStack,
    HStack,
    Text,
    Badge,
    Divider,
    useColorModeValue,
    Button,
    IconButton,
    Tooltip,
    Flex,
    Spinner
} from '@chakra-ui/react';
import {
    ViewIcon,
    TimeIcon,
    CheckIcon,
    StarIcon,
    ChevronDownIcon,
    ChevronUpIcon
} from '@chakra-ui/icons';
import ReadStatusIndicator from './ReadStatusIndicator';

export interface Post {
    id: string;
    title: string;
    content: string;
    author: string;
    views: number;
    createdAt: string;
    boardId: string;
    communityId?: string;
    category?: string;
    thumb?: string;
    preview?: string;
}

export interface ReadStatus {
    id: string;
    postId: string;
    boardId: string;
    communityId?: string;
    readAt: string;
    readDuration?: number;
    isFullyRead: boolean;
    deviceType?: 'desktop' | 'mobile' | 'tablet';
}

interface PostListWithReadStatusProps {
    posts: Post[];
    boardId: string;
    communityId?: string;
    userId?: number;
    showReadStatus?: boolean;
    sortBy?: 'newest' | 'oldest' | 'popular' | 'read' | 'unread';
    onPostClick?: (post: Post) => void;
    onReadStatusChange?: (postId: string, isRead: boolean) => void;
}

const PostListWithReadStatus: React.FC<PostListWithReadStatusProps> = ({
    posts,
    boardId,
    communityId,
    userId,
    showReadStatus = true,
    sortBy = 'newest',
    onPostClick,
    onReadStatusChange
}) => {
    const [readStatuses, setReadStatuses] = useState<Map<string, ReadStatus>>(new Map());
    const [isLoading, setIsLoading] = useState(false);
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());

    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.600');
    const hoverBgColor = useColorModeValue('gray.50', 'gray.700');
    const readBgColor = useColorModeValue('green.50', 'green.900');
    const unreadBgColor = useColorModeValue('blue.50', 'blue.900');

    // 읽음 상태 조회
    const fetchReadStatuses = async () => {
        if (!showReadStatus) return;

        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            if (userId) params.append('userId', userId.toString());
            else params.append('ipAddress', 'current');

            const response = await fetch(`/api/read-status/user?${params}`);
            const data = await response.json();

            if (data.success) {
                const statusMap = new Map();
                data.data.forEach((status: ReadStatus) => {
                    statusMap.set(status.postId, status);
                });
                setReadStatuses(statusMap);
            }
        } catch (error) {
            console.error('Error fetching read statuses:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // 컴포넌트 마운트 시 읽음 상태 조회
    useEffect(() => {
        fetchReadStatuses();
    }, [userId, showReadStatus]);

    // 게시물 정렬
    const getSortedPosts = () => {
        const sortedPosts = [...posts];

        switch (sortBy) {
            case 'newest':
                return sortedPosts.sort((a, b) =>
                    sortOrder === 'desc'
                        ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                        : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                );

            case 'oldest':
                return sortedPosts.sort((a, b) =>
                    sortOrder === 'desc'
                        ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                        : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                );

            case 'popular':
                return sortedPosts.sort((a, b) =>
                    sortOrder === 'desc'
                        ? b.views - a.views
                        : a.views - b.views
                );

            case 'read':
                return sortedPosts.sort((a, b) => {
                    const aRead = readStatuses.has(a.id);
                    const bRead = readStatuses.has(b.id);
                    if (aRead === bRead) return 0;
                    return sortOrder === 'desc' ? (aRead ? -1 : 1) : (aRead ? 1 : -1);
                });

            case 'unread':
                return sortedPosts.sort((a, b) => {
                    const aRead = readStatuses.has(a.id);
                    const bRead = readStatuses.has(b.id);
                    if (aRead === bRead) return 0;
                    return sortOrder === 'desc' ? (aRead ? 1 : -1) : (aRead ? -1 : 1);
                });

            default:
                return sortedPosts;
        }
    };

    // 게시물 클릭 핸들러
    const handlePostClick = (post: Post) => {
        if (onPostClick) {
            onPostClick(post);
        }

        // 읽음 상태 업데이트
        if (showReadStatus) {
            updateReadStatus(post.id);
        }
    };

    // 읽음 상태 업데이트
    const updateReadStatus = async (postId: string) => {
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
                    deviceType: window.innerWidth < 768 ? 'mobile' :
                        window.innerWidth < 1024 ? 'tablet' : 'desktop'
                }),
            });

            const data = await response.json();

            if (data.success) {
                setReadStatuses(prev => {
                    const newMap = new Map(prev);
                    newMap.set(postId, data.data);
                    return newMap;
                });

                if (onReadStatusChange) {
                    onReadStatusChange(postId, true);
                }
            }
        } catch (error) {
            console.error('Error updating read status:', error);
        }
    };

    // 게시물 확장/축소
    const togglePostExpansion = (postId: string) => {
        setExpandedPosts(prev => {
            const newSet = new Set(prev);
            if (newSet.has(postId)) {
                newSet.delete(postId);
            } else {
                newSet.add(postId);
            }
            return newSet;
        });
    };

    // 읽음 상태에 따른 배경색 결정
    const getPostBgColor = (post: Post) => {
        const readStatus = readStatuses.get(post.id);
        if (!readStatus) return bgColor;

        if (readStatus.isFullyRead) {
            return readBgColor;
        } else {
            return unreadBgColor;
        }
    };

    // 읽음 상태에 따른 테두리 색상 결정
    const getPostBorderColor = (post: Post) => {
        const readStatus = readStatuses.get(post.id);
        if (!readStatus) return borderColor;

        if (readStatus.isFullyRead) {
            return 'green.300';
        } else {
            return 'blue.300';
        }
    };

    const sortedPosts = getSortedPosts();

    if (isLoading) {
        return (
            <Box p={8} textAlign="center">
                <Spinner size="lg" />
                <Text mt={2}>읽음 상태를 불러오는 중...</Text>
            </Box>
        );
    }

    return (
        <Box className="post-list-with-read-status">
            <VStack spacing={2} align="stretch">
                {sortedPosts.map((post) => {
                    const readStatus = readStatuses.get(post.id);
                    const isExpanded = expandedPosts.has(post.id);

                    return (
                        <Box
                            key={post.id}
                            p={4}
                            bg={getPostBgColor(post)}
                            border="1px solid"
                            borderColor={getPostBorderColor(post)}
                            borderRadius="md"
                            cursor="pointer"
                            _hover={{ bg: hoverBgColor }}
                            transition="all 0.2s"
                            onClick={() => handlePostClick(post)}
                        >
                            <VStack spacing={3} align="stretch">
                                {/* 게시물 헤더 */}
                                <HStack justify="space-between" align="start">
                                    <VStack align="start" spacing={1} flex={1}>
                                        <HStack spacing={2}>
                                            <Text
                                                fontWeight="semibold"
                                                fontSize="md"
                                                noOfLines={isExpanded ? 0 : 2}
                                            >
                                                {post.title}
                                            </Text>

                                            {/* 읽음 상태 표시 */}
                                            {showReadStatus && readStatus && (
                                                <Badge
                                                    colorScheme={readStatus.isFullyRead ? 'green' : 'blue'}
                                                    size="sm"
                                                >
                                                    {readStatus.isFullyRead ? '읽음' : '부분 읽음'}
                                                </Badge>
                                            )}
                                        </HStack>

                                        <HStack spacing={4} fontSize="sm" color="gray.500">
                                            <Text>작성자: {post.author}</Text>
                                            <Text>조회수: {post.views}</Text>
                                            <Text>{new Date(post.createdAt).toLocaleDateString()}</Text>
                                        </HStack>
                                    </VStack>

                                    {/* 확장/축소 버튼 */}
                                    <IconButton
                                        size="sm"
                                        variant="ghost"
                                        icon={isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            togglePostExpansion(post.id);
                                        }}
                                        aria-label={isExpanded ? '축소' : '확장'}
                                    />
                                </HStack>

                                {/* 게시물 내용 (확장 시에만 표시) */}
                                {isExpanded && (
                                    <Box>
                                        <Divider my={2} />
                                        <Text
                                            fontSize="sm"
                                            color="gray.600"
                                            whiteSpace="pre-wrap"
                                            noOfLines={10}
                                        >
                                            {post.content}
                                        </Text>
                                    </Box>
                                )}

                                {/* 게시물 미리보기 */}
                                {!isExpanded && post.preview && (
                                    <Text
                                        fontSize="sm"
                                        color="gray.600"
                                        noOfLines={2}
                                    >
                                        {post.preview}
                                    </Text>
                                )}

                                {/* 읽음 상태 상세 정보 */}
                                {showReadStatus && readStatus && isExpanded && (
                                    <Box>
                                        <Divider my={2} />
                                        <HStack spacing={4} fontSize="xs" color="gray.500">
                                            <Text>읽은 시간: {new Date(readStatus.readAt).toLocaleString()}</Text>
                                            {readStatus.readDuration && (
                                                <Text>읽은 시간: {Math.round(readStatus.readDuration)}초</Text>
                                            )}
                                            {readStatus.deviceType && (
                                                <Text>디바이스: {readStatus.deviceType}</Text>
                                            )}
                                        </HStack>
                                    </Box>
                                )}
                            </VStack>
                        </Box>
                    );
                })}
            </VStack>
        </Box>
    );
};

export default PostListWithReadStatus;

