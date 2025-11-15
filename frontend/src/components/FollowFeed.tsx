import React, { useState, useEffect } from 'react';
import {
    Box,
    VStack,
    HStack,
    Text,
    Heading,
    Avatar,
    Badge,
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
    useColorModeValue,
    Spinner,
    Center,
    Button,
    Icon
} from '@chakra-ui/react';
import { FiUser, FiGrid, FiMessageSquare, FiEye, FiTrendingUp, FiTrendingDown } from 'react-icons/fi';
import { apiClient } from '../utils/apiClient';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface Post {
    id: number;
    title: string;
    content: string;
    author_id: number;
    author_username: string;
    author_display_name: string;
    author_avatar?: string;
    board_id: number;
    board_name: string;
    created_at: string;
    view_count: number;
    upvotes: number;
    downvotes: number;
    comment_count: number;
}

/**
 * 팔로우 피드 컴포넌트
 * 팔로우한 사용자 또는 게시판의 최근 게시물 표시
 */
const FollowFeed: React.FC = () => {
    const [userPosts, setUserPosts] = useState<Post[]>([]);
    const [boardPosts, setBoardPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(0);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const navigate = useNavigate();
    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.700');
    const hoverBg = useColorModeValue('gray.50', 'gray.700');

    // 사용자 팔로우 피드 조회
    const fetchUserFeed = async (pageNum: number = 1) => {
        try {
            setLoading(true);
            const response = await apiClient.get(`/api/follow/feed/users?page=${pageNum}&limit=20`);

            if (pageNum === 1) {
                setUserPosts(response.posts || []);
            } else {
                setUserPosts(prev => [...prev, ...(response.posts || [])]);
            }

            setHasMore(response.posts?.length === 20);
        } catch (error) {
            console.error('사용자 피드 조회 실패:', error);
        } finally {
            setLoading(false);
        }
    };

    // 게시판 팔로우 피드 조회
    const fetchBoardFeed = async (pageNum: number = 1) => {
        try {
            setLoading(true);
            const response = await apiClient.get(`/api/follow/feed/boards?page=${pageNum}&limit=20`);

            if (pageNum === 1) {
                setBoardPosts(response.posts || []);
            } else {
                setBoardPosts(prev => [...prev, ...(response.posts || [])]);
            }

            setHasMore(response.posts?.length === 20);
        } catch (error) {
            console.error('게시판 피드 조회 실패:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setPage(1);
        if (activeTab === 0) {
            fetchUserFeed(1);
        } else {
            fetchBoardFeed(1);
        }
    }, [activeTab]);

    // 더 보기
    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);

        if (activeTab === 0) {
            fetchUserFeed(nextPage);
        } else {
            fetchBoardFeed(nextPage);
        }
    };

    // 게시물 카드 렌더링
    const renderPostCard = (post: Post) => (
        <Box
            key={post.id}
            p={4}
            bg={bgColor}
            borderWidth="1px"
            borderColor={borderColor}
            borderRadius="md"
            _hover={{ bg: hoverBg, shadow: 'md' }}
            transition="all 0.2s"
            cursor="pointer"
            onClick={() => navigate(`/posts/${post.id}`)}
        >
            <VStack align="stretch" spacing={3}>
                {/* 작성자 & 게시판 정보 */}
                <HStack justify="space-between">
                    <HStack spacing={2}>
                        <Avatar
                            size="sm"
                            name={post.author_display_name || post.author_username}
                            src={post.author_avatar}
                        />
                        <VStack align="start" spacing={0}>
                            <Text fontWeight="bold" fontSize="sm">
                                {post.author_display_name || post.author_username}
                            </Text>
                            <HStack fontSize="xs" color="gray.500">
                                <Text>
                                    {format(new Date(post.created_at), 'PPp', { locale: ko })}
                                </Text>
                            </HStack>
                        </VStack>
                    </HStack>

                    <Badge colorScheme="blue" cursor="pointer" onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/board/${post.board_id}`);
                    }}>
                        {post.board_name}
                    </Badge>
                </HStack>

                {/* 제목 & 내용 미리보기 */}
                <VStack align="start" spacing={1}>
                    <Heading size="sm" noOfLines={2}>
                        {post.title}
                    </Heading>
                    <Text fontSize="sm" color="gray.600" noOfLines={3}>
                        {post.content.replace(/<[^>]*>/g, '')}
                    </Text>
                </VStack>

                {/* 통계 */}
                <HStack spacing={4} fontSize="sm" color="gray.500">
                    <HStack spacing={1}>
                        <Icon as={FiEye} />
                        <Text>{post.view_count}</Text>
                    </HStack>
                    <HStack spacing={1}>
                        <Icon as={FiTrendingUp} color="green.500" />
                        <Text>{post.upvotes}</Text>
                    </HStack>
                    {post.downvotes > 0 && (
                        <HStack spacing={1}>
                            <Icon as={FiTrendingDown} color="red.500" />
                            <Text>{post.downvotes}</Text>
                        </HStack>
                    )}
                    <HStack spacing={1}>
                        <Icon as={FiMessageSquare} />
                        <Text>{post.comment_count}</Text>
                    </HStack>
                </HStack>
            </VStack>
        </Box>
    );

    // 빈 상태
    const renderEmptyState = (type: 'user' | 'board') => (
        <Center py={10}>
            <VStack spacing={3}>
                <Icon
                    as={type === 'user' ? FiUser : FiGrid}
                    boxSize={12}
                    color="gray.400"
                />
                <Text color="gray.500" fontSize="lg">
                    {type === 'user'
                        ? '팔로우한 사용자가 없거나 게시물이 없습니다'
                        : '팔로우한 게시판이 없거나 게시물이 없습니다'
                    }
                </Text>
                <Text color="gray.400" fontSize="sm">
                    {type === 'user'
                        ? '관심 있는 사용자를 팔로우해보세요!'
                        : '관심 있는 게시판을 팔로우해보세요!'
                    }
                </Text>
            </VStack>
        </Center>
    );

    return (
        <Box>
            <Tabs
                index={activeTab}
                onChange={(index) => setActiveTab(index)}
                colorScheme="blue"
            >
                <TabList>
                    <Tab>
                        <HStack>
                            <Icon as={FiUser} />
                            <Text>팔로우 사용자</Text>
                        </HStack>
                    </Tab>
                    <Tab>
                        <HStack>
                            <Icon as={FiGrid} />
                            <Text>팔로우 게시판</Text>
                        </HStack>
                    </Tab>
                </TabList>

                <TabPanels>
                    {/* 사용자 피드 */}
                    <TabPanel px={0}>
                        <VStack spacing={4} align="stretch">
                            {loading && page === 1 ? (
                                <Center py={10}>
                                    <Spinner size="xl" />
                                </Center>
                            ) : userPosts.length === 0 ? (
                                renderEmptyState('user')
                            ) : (
                                <>
                                    {userPosts.map(renderPostCard)}

                                    {hasMore && (
                                        <Center>
                                            <Button
                                                onClick={handleLoadMore}
                                                isLoading={loading}
                                                variant="outline"
                                                colorScheme="blue"
                                            >
                                                더 보기
                                            </Button>
                                        </Center>
                                    )}
                                </>
                            )}
                        </VStack>
                    </TabPanel>

                    {/* 게시판 피드 */}
                    <TabPanel px={0}>
                        <VStack spacing={4} align="stretch">
                            {loading && page === 1 ? (
                                <Center py={10}>
                                    <Spinner size="xl" />
                                </Center>
                            ) : boardPosts.length === 0 ? (
                                renderEmptyState('board')
                            ) : (
                                <>
                                    {boardPosts.map(renderPostCard)}

                                    {hasMore && (
                                        <Center>
                                            <Button
                                                onClick={handleLoadMore}
                                                isLoading={loading}
                                                variant="outline"
                                                colorScheme="blue"
                                            >
                                                더 보기
                                            </Button>
                                        </Center>
                                    )}
                                </>
                            )}
                        </VStack>
                    </TabPanel>
                </TabPanels>
            </Tabs>
        </Box>
    );
};

export default FollowFeed;
