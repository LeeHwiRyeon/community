import React, { useState, useEffect } from 'react';
import {
    Box,
    Heading,
    Text,
    VStack,
    HStack,
    Badge,
    Spinner,
    Alert,
    AlertIcon,
    Button,
    useToast,
    Skeleton,
    Card,
    CardBody,
    CardHeader,
    Divider,
    Icon,
    Flex,
    useColorModeValue
} from '@chakra-ui/react';
import { FiTrendingUp, FiRefreshCw, FiEye, FiHeart, FiClock } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import axios from 'axios';

interface Post {
    post_id: number;
    title: string;
    score: number;
    category_id: number;
    likes_count: number;
    views_count: number;
    created_at: string;
}

interface RecommendedPostsProps {
    userId?: number;
    recommendationType?: 'hybrid' | 'collaborative' | 'content';
    limit?: number;
    showTrending?: boolean;
}

const RecommendedPosts: React.FC<RecommendedPostsProps> = ({
    userId,
    recommendationType = 'hybrid',
    limit = 10,
    showTrending = false
}) => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const toast = useToast();

    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.700');
    const hoverBg = useColorModeValue('gray.50', 'gray.700');

    const fetchRecommendations = async () => {
        setLoading(true);
        setError(null);

        try {
            let response;

            const API_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:5000';

            if (showTrending) {
                // 트렌딩 게시물
                response = await axios.post(
                    `${API_URL}/api/ml/recommend/trending`,
                    null,
                    {
                        params: { limit, days: 7 },
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }
                );
            } else if (userId) {
                // 사용자 맞춤 추천
                response = await axios.post(
                    `${API_URL}/api/ml/recommend/posts`,
                    {
                        user_id: userId,
                        limit,
                        recommendation_type: recommendationType
                    },
                    {
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }
                );
            } else {
                // 인기 게시물 (fallback)
                response = await axios.post(
                    `${API_URL}/api/ml/recommend/trending`,
                    null,
                    {
                        params: { limit, days: 7 },
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }
                );
            }

            setPosts(response.data);
        } catch (err: any) {
            console.error('Failed to fetch recommendations:', err);
            setError(err.response?.data?.message || 'Failed to load recommendations');

            toast({
                title: 'Error',
                description: 'Failed to load recommended posts',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRecommendations();
    }, [userId, recommendationType, limit, showTrending]);

    const handleRefresh = () => {
        fetchRecommendations();
        toast({
            title: 'Refreshed',
            description: 'Recommendations updated',
            status: 'success',
            duration: 2000,
            isClosable: true,
        });
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 60) return `${diffMins}분 전`;
        if (diffHours < 24) return `${diffHours}시간 전`;
        if (diffDays < 7) return `${diffDays}일 전`;
        return date.toLocaleDateString('ko-KR');
    };

    const getRecommendationTypeLabel = () => {
        switch (recommendationType) {
            case 'collaborative':
                return '협업 필터링';
            case 'content':
                return '콘텐츠 기반';
            case 'hybrid':
            default:
                return '하이브리드';
        }
    };

    if (loading) {
        return (
            <Card bg={bgColor} borderColor={borderColor} borderWidth="1px">
                <CardHeader>
                    <HStack justify="space-between">
                        <HStack>
                            <Icon as={FiTrendingUp} color="blue.500" />
                            <Heading size="md">
                                {showTrending ? '트렌딩 게시물' : '추천 게시물'}
                            </Heading>
                        </HStack>
                        <Skeleton height="30px" width="80px" />
                    </HStack>
                </CardHeader>
                <CardBody>
                    <VStack spacing={3} align="stretch">
                        {[...Array(5)].map((_, i) => (
                            <Skeleton key={i} height="80px" borderRadius="md" />
                        ))}
                    </VStack>
                </CardBody>
            </Card>
        );
    }

    if (error) {
        return (
            <Card bg={bgColor} borderColor={borderColor} borderWidth="1px">
                <CardBody>
                    <Alert status="error" borderRadius="md">
                        <AlertIcon />
                        <Box>
                            <Text fontWeight="bold">추천 불러오기 실패</Text>
                            <Text fontSize="sm">{error}</Text>
                        </Box>
                    </Alert>
                    <Button
                        mt={4}
                        leftIcon={<FiRefreshCw />}
                        onClick={handleRefresh}
                        colorScheme="blue"
                        size="sm"
                    >
                        다시 시도
                    </Button>
                </CardBody>
            </Card>
        );
    }

    if (posts.length === 0) {
        return (
            <Card bg={bgColor} borderColor={borderColor} borderWidth="1px">
                <CardBody>
                    <Alert status="info" borderRadius="md">
                        <AlertIcon />
                        추천할 게시물이 없습니다.
                    </Alert>
                </CardBody>
            </Card>
        );
    }

    return (
        <Card bg={bgColor} borderColor={borderColor} borderWidth="1px">
            <CardHeader>
                <HStack justify="space-between">
                    <HStack>
                        <Icon as={FiTrendingUp} color="blue.500" boxSize={5} />
                        <Heading size="md">
                            {showTrending ? '트렌딩 게시물' : '추천 게시물'}
                        </Heading>
                        {!showTrending && userId && (
                            <Badge colorScheme="purple" fontSize="xs">
                                {getRecommendationTypeLabel()}
                            </Badge>
                        )}
                    </HStack>
                    <Button
                        leftIcon={<FiRefreshCw />}
                        onClick={handleRefresh}
                        size="sm"
                        variant="ghost"
                        isLoading={loading}
                    >
                        새로고침
                    </Button>
                </HStack>
            </CardHeader>

            <Divider />

            <CardBody>
                <VStack spacing={3} align="stretch">
                    {posts.map((post, index) => (
                        <Link
                            key={post.post_id}
                            to={`/posts/${post.post_id}`}
                            style={{ textDecoration: 'none' }}
                        >
                            <Box
                                p={4}
                                borderRadius="md"
                                borderWidth="1px"
                                borderColor={borderColor}
                                _hover={{
                                    bg: hoverBg,
                                    transform: 'translateY(-2px)',
                                    shadow: 'md'
                                }}
                                transition="all 0.2s"
                                cursor="pointer"
                            >
                                <HStack justify="space-between" align="start" spacing={3}>
                                    <VStack align="start" spacing={2} flex={1}>
                                        <HStack spacing={2}>
                                            <Badge colorScheme="blue" fontSize="xs">
                                                #{index + 1}
                                            </Badge>
                                            <Text
                                                fontSize="md"
                                                fontWeight="semibold"
                                                noOfLines={2}
                                                color={useColorModeValue('gray.800', 'white')}
                                            >
                                                {post.title}
                                            </Text>
                                        </HStack>

                                        <HStack spacing={4} fontSize="sm" color="gray.500">
                                            <HStack spacing={1}>
                                                <Icon as={FiHeart} />
                                                <Text>{post.likes_count}</Text>
                                            </HStack>
                                            <HStack spacing={1}>
                                                <Icon as={FiEye} />
                                                <Text>{post.views_count}</Text>
                                            </HStack>
                                            <HStack spacing={1}>
                                                <Icon as={FiClock} />
                                                <Text>{formatDate(post.created_at)}</Text>
                                            </HStack>
                                        </HStack>
                                    </VStack>

                                    <Badge
                                        colorScheme={post.score > 0.7 ? 'green' : post.score > 0.5 ? 'yellow' : 'gray'}
                                        fontSize="xs"
                                        px={2}
                                        py={1}
                                    >
                                        {(post.score * 100).toFixed(0)}%
                                    </Badge>
                                </HStack>
                            </Box>
                        </Link>
                    ))}
                </VStack>
            </CardBody>
        </Card>
    );
};

export default RecommendedPosts;
