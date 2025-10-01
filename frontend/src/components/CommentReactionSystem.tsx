import React, { useState, useEffect } from 'react';
import {
    Box,
    HStack,
    VStack,
    Button,
    Text,
    Popover,
    PopoverTrigger,
    PopoverContent,
    PopoverBody,
    PopoverArrow,
    useColorModeValue,
    Badge,
    Tooltip,
    IconButton,
    useToast,
    Spinner,
    Wrap,
    WrapItem
} from '@chakra-ui/react';
import {
    ThumbsUpIcon,
    ThumbsDownIcon,
    AddIcon,
    ChevronDownIcon
} from '@chakra-ui/icons';

export interface CommentReaction {
    type: 'like' | 'dislike' | 'love' | 'laugh' | 'angry' | 'sad' | 'wow';
    emoji?: string;
    count: number;
    isActive?: boolean;
}

export interface CommentReactionStats {
    total: number;
    reactions: {
        [key: string]: number;
    };
}

interface CommentReactionSystemProps {
    commentId: string;
    initialStats?: CommentReactionStats;
    userReactions?: string[];
    onReactionToggle: (reactionType: string, emoji?: string) => Promise<void>;
    onReactionStatsUpdate?: (stats: CommentReactionStats) => void;
    isAnonymous?: boolean;
    disabled?: boolean;
}

const CommentReactionSystem: React.FC<CommentReactionSystemProps> = ({
    commentId,
    initialStats = { total: 0, reactions: {} },
    userReactions = [],
    onReactionToggle,
    onReactionStatsUpdate,
    isAnonymous = false,
    disabled = false
}) => {
    const [stats, setStats] = useState<CommentReactionStats>(initialStats);
    const [userReactionTypes, setUserReactionTypes] = useState<Set<string>>(new Set(userReactions));
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const toast = useToast();

    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.600');
    const hoverBgColor = useColorModeValue('gray.50', 'gray.700');

    // 기본 반응 타입들
    const defaultReactions: { [key: string]: { emoji: string; label: string; color: string } } = {
        like: { emoji: '👍', label: '좋아요', color: 'blue' },
        dislike: { emoji: '👎', label: '싫어요', color: 'red' },
        love: { emoji: '❤️', label: '사랑해요', color: 'pink' },
        laugh: { emoji: '😂', label: '웃겨요', color: 'yellow' },
        angry: { emoji: '😠', label: '화나요', color: 'orange' },
        sad: { emoji: '😢', label: '슬퍼요', color: 'purple' },
        wow: { emoji: '😮', label: '놀라워요', color: 'cyan' }
    };

    // 사용자 정의 이모지 반응
    const customEmojis = ['🔥', '💯', '👏', '🎉', '💪', '✨', '🌟', '💎'];

    // 반응 토글
    const handleReactionToggle = async (reactionType: string, emoji?: string) => {
        if (disabled || isLoading) return;

        setIsLoading(true);
        try {
            await onReactionToggle(reactionType, emoji);

            // 로컬 상태 업데이트
            const newUserReactions = new Set(userReactionTypes);
            if (newUserReactions.has(reactionType)) {
                newUserReactions.delete(reactionType);
            } else {
                newUserReactions.add(reactionType);
            }
            setUserReactionTypes(newUserReactions);

            // 통계 업데이트 (낙관적 업데이트)
            const newStats = { ...stats };
            const currentCount = newStats.reactions[reactionType] || 0;
            if (newUserReactions.has(reactionType)) {
                newStats.reactions[reactionType] = currentCount + 1;
                newStats.total += 1;
            } else {
                newStats.reactions[reactionType] = Math.max(0, currentCount - 1);
                newStats.total = Math.max(0, newStats.total - 1);
            }
            setStats(newStats);

            if (onReactionStatsUpdate) {
                onReactionStatsUpdate(newStats);
            }

        } catch (error) {
            toast({
                title: '반응 실패',
                description: '반응 처리 중 오류가 발생했습니다.',
                status: 'error',
                duration: 2000,
                isClosable: true,
            });
        } finally {
            setIsLoading(false);
        }
    };

    // 기본 반응 버튼 렌더링
    const renderDefaultReaction = (reactionType: string) => {
        const reaction = defaultReactions[reactionType];
        const count = stats.reactions[reactionType] || 0;
        const isActive = userReactionTypes.has(reactionType);

        return (
            <Tooltip key={reactionType} label={`${reaction.label} ${count}`}>
                <Button
                    size="sm"
                    variant={isActive ? 'solid' : 'ghost'}
                    colorScheme={isActive ? reaction.color : 'gray'}
                    leftIcon={<Text fontSize="sm">{reaction.emoji}</Text>}
                    onClick={() => handleReactionToggle(reactionType)}
                    isDisabled={disabled || isLoading}
                    isLoading={isLoading}
                >
                    {count > 0 && count}
                </Button>
            </Tooltip>
        );
    };

    // 사용자 정의 이모지 반응 렌더링
    const renderCustomEmoji = (emoji: string) => {
        return (
            <Tooltip key={emoji} label={`${emoji} 반응`}>
                <IconButton
                    size="sm"
                    variant="ghost"
                    aria-label={`${emoji} 반응`}
                    onClick={() => handleReactionToggle('custom', emoji)}
                    isDisabled={disabled || isLoading}
                    isLoading={isLoading}
                >
                    <Text fontSize="lg">{emoji}</Text>
                </IconButton>
            </Tooltip>
        );
    };

    // 인기 반응 표시
    const getPopularReactions = () => {
        return Object.entries(stats.reactions)
            .filter(([_, count]) => count > 0)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3);
    };

    const popularReactions = getPopularReactions();

    return (
        <Box className="comment-reaction-system">
            <HStack spacing={2} wrap="wrap">
                {/* 기본 반응 버튼들 */}
                {Object.keys(defaultReactions).map(renderDefaultReaction)}

                {/* 사용자 정의 이모지 팝오버 */}
                <Popover isOpen={isOpen} onClose={() => setIsOpen(false)}>
                    <PopoverTrigger>
                        <Button
                            size="sm"
                            variant="ghost"
                            leftIcon={<AddIcon />}
                            rightIcon={<ChevronDownIcon />}
                            isDisabled={disabled}
                        >
                            더보기
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent>
                        <PopoverArrow />
                        <PopoverBody>
                            <VStack spacing={2} align="stretch">
                                <Text fontSize="sm" fontWeight="semibold">
                                    이모지 반응
                                </Text>
                                <Wrap spacing={2}>
                                    {customEmojis.map(renderCustomEmoji)}
                                </Wrap>
                            </VStack>
                        </PopoverBody>
                    </PopoverContent>
                </Popover>

                {/* 인기 반응 표시 */}
                {popularReactions.length > 0 && (
                    <HStack spacing={1} ml={2}>
                        <Text fontSize="xs" color="gray.500">
                            인기:
                        </Text>
                        {popularReactions.map(([type, count]) => {
                            const reaction = defaultReactions[type];
                            return (
                                <Tooltip key={type} label={`${reaction.label} ${count}개`}>
                                    <Badge
                                        colorScheme={reaction.color}
                                        variant="subtle"
                                        fontSize="xs"
                                        px={2}
                                        py={1}
                                        borderRadius="full"
                                    >
                                        {reaction.emoji} {count}
                                    </Badge>
                                </Tooltip>
                            );
                        })}
                    </HStack>
                )}

                {/* 총 반응 수 */}
                {stats.total > 0 && (
                    <Text fontSize="xs" color="gray.500">
                        총 {stats.total}개 반응
                    </Text>
                )}
            </HStack>

            {/* 로딩 상태 */}
            {isLoading && (
                <HStack spacing={2} mt={2}>
                    <Spinner size="xs" />
                    <Text fontSize="xs" color="gray.500">
                        처리 중...
                    </Text>
                </HStack>
            )}

            {/* 익명 반응 안내 */}
            {isAnonymous && (
                <Text fontSize="xs" color="blue.500" mt={1}>
                    💡 익명으로 반응할 수 있습니다
                </Text>
            )}
        </Box>
    );
};

export default CommentReactionSystem;

