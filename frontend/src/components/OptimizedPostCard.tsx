import React, { memo, useMemo, useCallback } from 'react';
import {
    Box,
    Card,
    CardBody,
    CardHeader,
    Heading,
    Text,
    Badge,
    HStack,
    VStack,
    Avatar,
    Button,
    IconButton,
    Tooltip,
    useColorModeValue
} from '@chakra-ui/react';
import { Link } from 'react-router-dom';
import { PostSummary, UserSummary } from '../types/api';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

interface OptimizedPostCardProps {
    post: PostSummary;
    onVote?: (postId: string, type: 'up' | 'down') => void;
    onBookmark?: (postId: string) => void;
    onShare?: (postId: string) => void;
    isBookmarked?: boolean;
    showBoard?: boolean;
    showCategory?: boolean;
}

/**
 * Optimized Post Card Component
 * Uses React.memo and useMemo for performance optimization
 */
const OptimizedPostCard = memo<OptimizedPostCardProps>(({
    post,
    onVote,
    onBookmark,
    onShare,
    isBookmarked = false,
    showBoard = true,
    showCategory = true
}) => {
    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.600');
    const hoverBgColor = useColorModeValue('gray.50', 'gray.700');

    // Memoize formatted date
    const formattedDate = useMemo(() => {
        if (!post.createdAt) return '';
        return formatDistanceToNow(new Date(post.createdAt), {
            addSuffix: true,
            locale: ko
        });
    }, [post.createdAt]);

    // Memoize vote handlers
    const handleUpvote = useCallback(() => {
        if (onVote) {
            onVote(post.id, 'up');
        }
    }, [onVote, post.id]);

    const handleDownvote = useCallback(() => {
        if (onVote) {
            onVote(post.id, 'down');
        }
    }, [onVote, post.id]);

    const handleBookmark = useCallback(() => {
        if (onBookmark) {
            onBookmark(post.id);
        }
    }, [onBookmark, post.id]);

    const handleShare = useCallback(() => {
        if (onShare) {
            onShare(post.id);
        }
    }, [onShare, post.id]);

    // Memoize vote display
    const voteDisplay = useMemo(() => {
        const { upvotes, downvotes, score } = post.votes;
        return {
            upvotes,
            downvotes,
            score,
            userVote: post.votes.userVote
        };
    }, [post.votes]);

    // Memoize tags display
    const tagsDisplay = useMemo(() => {
        return post.tags.slice(0, 3); // Show only first 3 tags
    }, [post.tags]);

    // Memoize excerpt
    const excerpt = useMemo(() => {
        if (post.excerpt.length > 150) {
            return post.excerpt.substring(0, 150) + '...';
        }
        return post.excerpt;
    }, [post.excerpt]);

    return (
        <Card
            bg={bgColor}
            borderColor={borderColor}
            _hover={{ bg: hoverBgColor }}
            transition="all 0.2s"
            h="full"
        >
            <CardHeader pb={2}>
                <VStack align="stretch" spacing={2}>
                    {/* Title and Meta */}
                    <HStack justify="space-between" align="start">
                        <VStack align="start" spacing={1} flex={1}>
                            <Heading
                                as={Link}
                                to={`/board/${post.board.id}/post/${post.id}`}
                                size="md"
                                color="blue.500"
                                _hover={{ color: 'blue.600' }}
                                noOfLines={2}
                            >
                                {post.title}
                            </Heading>

                            <HStack spacing={2} fontSize="sm" color="gray.500">
                                <Text>{formattedDate}</Text>
                                {post.isPinned && (
                                    <Badge colorScheme="red" size="sm">
                                        고정
                                    </Badge>
                                )}
                                {post.isRead && (
                                    <Badge colorScheme="gray" size="sm">
                                        읽음
                                    </Badge>
                                )}
                            </HStack>
                        </VStack>
                    </HStack>

                    {/* Board and Category */}
                    {(showBoard || showCategory) && (
                        <HStack spacing={2}>
                            {showBoard && (
                                <Badge colorScheme="blue" variant="subtle">
                                    {post.board.name}
                                </Badge>
                            )}
                            {showCategory && post.category && (
                                <Badge colorScheme="green" variant="subtle">
                                    {post.category.name}
                                </Badge>
                            )}
                        </HStack>
                    )}

                    {/* Tags */}
                    {tagsDisplay.length > 0 && (
                        <HStack spacing={1} flexWrap="wrap">
                            {tagsDisplay.map((tag) => (
                                <Badge
                                    key={tag.id}
                                    colorScheme="purple"
                                    variant="outline"
                                    size="sm"
                                >
                                    #{tag.name}
                                </Badge>
                            ))}
                            {post.tags.length > 3 && (
                                <Text fontSize="xs" color="gray.500">
                                    +{post.tags.length - 3}개 더
                                </Text>
                            )}
                        </HStack>
                    )}
                </VStack>
            </CardHeader>

            <CardBody pt={0}>
                <VStack align="stretch" spacing={3}>
                    {/* Content Excerpt */}
                    <Text color="gray.600" noOfLines={3}>
                        {excerpt}
                    </Text>

                    {/* Author and Stats */}
                    <HStack justify="space-between" align="center">
                        <HStack spacing={2}>
                            <Avatar
                                size="sm"
                                name={post.author.displayName}
                                src={post.author.avatar}
                            />
                            <VStack align="start" spacing={0}>
                                <Text fontSize="sm" fontWeight="medium">
                                    {post.author.displayName}
                                </Text>
                                <Text fontSize="xs" color="gray.500">
                                    Lv.{post.author.level}
                                </Text>
                            </VStack>
                        </HStack>

                        <HStack spacing={4}>
                            {/* Vote Stats */}
                            <HStack spacing={1}>
                                <Tooltip label="추천">
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        colorScheme={voteDisplay.userVote === 'up' ? 'green' : 'gray'}
                                        onClick={handleUpvote}
                                    >
                                        👍 {voteDisplay.upvotes}
                                    </Button>
                                </Tooltip>
                                <Tooltip label="비추천">
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        colorScheme={voteDisplay.userVote === 'down' ? 'red' : 'gray'}
                                        onClick={handleDownvote}
                                    >
                                        👎 {voteDisplay.downvotes}
                                    </Button>
                                </Tooltip>
                                <Text fontSize="sm" color="gray.500">
                                    {voteDisplay.score}
                                </Text>
                            </HStack>

                            {/* Comment Count */}
                            <Text fontSize="sm" color="gray.500">
                                💬 {post.comments.count}
                            </Text>

                            {/* View Count */}
                            <Text fontSize="sm" color="gray.500">
                                👁 {post.views}
                            </Text>
                        </HStack>
                    </HStack>

                    {/* Action Buttons */}
                    <HStack justify="end" spacing={2}>
                        <Tooltip label="북마크">
                            <IconButton
                                size="sm"
                                variant="ghost"
                                colorScheme={isBookmarked ? 'yellow' : 'gray'}
                                aria-label="북마크"
                                onClick={handleBookmark}
                            >
                                {isBookmarked ? '⭐' : '☆'}
                            </IconButton>
                        </Tooltip>

                        <Tooltip label="공유">
                            <IconButton
                                size="sm"
                                variant="ghost"
                                colorScheme="gray"
                                aria-label="공유"
                                onClick={handleShare}
                            >
                                📤
                            </IconButton>
                        </Tooltip>
                    </HStack>
                </VStack>
            </CardBody>
        </Card>
    );
});

OptimizedPostCard.displayName = 'OptimizedPostCard';

export default OptimizedPostCard;
