import React, { useState, useEffect } from 'react';
import {
    Box,
    VStack,
    HStack,
    Text,
    Button,
    Textarea,
    Avatar,
    Badge,
    Divider,
    useColorModeValue,
    Collapse,
    IconButton,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    useToast,
    Alert,
    AlertIcon,
    Spinner,
    Flex
} from '@chakra-ui/react';
import {
    ChevronDownIcon,
    ChevronRightIcon,
    EditIcon,
    DeleteIcon,
    ReplyIcon,
    ThumbsUpIcon,
    ThumbsDownIcon,
    WarningIcon
} from '@chakra-ui/icons';
import CommentReactionSystem from './CommentReactionSystem';

export interface Comment {
    id: string;
    postId: string;
    parentId?: string;
    authorId: number;
    authorName: string;
    content: string;
    depth: number;
    path: string;
    likes: number;
    dislikes: number;
    replies: number;
    isEdited: boolean;
    editedAt?: string;
    createdAt: string;
    children: Comment[];
    metadata?: any;
}

interface NestedCommentSystemProps {
    postId: string;
    comments: Comment[];
    onCommentSubmit: (content: string, parentId?: string) => Promise<void>;
    onCommentEdit: (commentId: string, content: string) => Promise<void>;
    onCommentDelete: (commentId: string) => Promise<void>;
    onCommentReact: (commentId: string, type: 'like' | 'dislike') => Promise<void>;
    onCommentReactionToggle: (commentId: string, reactionType: string, emoji?: string) => Promise<void>;
    onCommentReport: (commentId: string, reason: string) => Promise<void>;
    currentUserId?: number;
    isLoading?: boolean;
    maxDepth?: number;
}

const NestedCommentSystem: React.FC<NestedCommentSystemProps> = ({
    postId,
    comments,
    onCommentSubmit,
    onCommentEdit,
    onCommentDelete,
    onCommentReact,
    onCommentReactionToggle,
    onCommentReport,
    currentUserId,
    isLoading = false,
    maxDepth = 3
}) => {
    const [newComment, setNewComment] = useState('');
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [editingComment, setEditingComment] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');
    const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
    const [showReplyForm, setShowReplyForm] = useState<string | null>(null);
    const toast = useToast();

    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.600');
    const hoverBgColor = useColorModeValue('gray.50', 'gray.700');

    // 댓글 제출
    const handleCommentSubmit = async () => {
        if (!newComment.trim()) return;

        try {
            await onCommentSubmit(newComment, replyingTo || undefined);
            setNewComment('');
            setReplyingTo(null);
            setShowReplyForm(null);
            toast({
                title: '댓글 작성 완료',
                status: 'success',
                duration: 2000,
                isClosable: true,
            });
        } catch (error) {
            toast({
                title: '댓글 작성 실패',
                description: '댓글 작성 중 오류가 발생했습니다.',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        }
    };

    // 댓글 수정
    const handleCommentEdit = async (commentId: string) => {
        if (!editContent.trim()) return;

        try {
            await onCommentEdit(commentId, editContent);
            setEditingComment(null);
            setEditContent('');
            toast({
                title: '댓글 수정 완료',
                status: 'success',
                duration: 2000,
                isClosable: true,
            });
        } catch (error) {
            toast({
                title: '댓글 수정 실패',
                description: '댓글 수정 중 오류가 발생했습니다.',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        }
    };

    // 댓글 삭제
    const handleCommentDelete = async (commentId: string) => {
        try {
            await onCommentDelete(commentId);
            toast({
                title: '댓글 삭제 완료',
                status: 'success',
                duration: 2000,
                isClosable: true,
            });
        } catch (error) {
            toast({
                title: '댓글 삭제 실패',
                description: '댓글 삭제 중 오류가 발생했습니다.',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        }
    };

    // 댓글 반응
    const handleCommentReact = async (commentId: string, type: 'like' | 'dislike') => {
        try {
            await onCommentReact(commentId, type);
        } catch (error) {
            toast({
                title: '반응 실패',
                description: '반응 처리 중 오류가 발생했습니다.',
                status: 'error',
                duration: 2000,
                isClosable: true,
            });
        }
    };

    // 댓글 신고
    const handleCommentReport = async (commentId: string, reason: string) => {
        try {
            await onCommentReport(commentId, reason);
            toast({
                title: '신고 완료',
                description: '댓글이 신고되었습니다.',
                status: 'success',
                duration: 2000,
                isClosable: true,
            });
        } catch (error) {
            toast({
                title: '신고 실패',
                description: '신고 처리 중 오류가 발생했습니다.',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        }
    };

    // 댓글 확장/축소
    const toggleCommentExpansion = (commentId: string) => {
        const newExpanded = new Set(expandedComments);
        if (newExpanded.has(commentId)) {
            newExpanded.delete(commentId);
        } else {
            newExpanded.add(commentId);
        }
        setExpandedComments(newExpanded);
    };

    // 답글 폼 표시
    const showReplyFormFor = (commentId: string) => {
        setShowReplyForm(commentId);
        setReplyingTo(commentId);
    };

    // 수정 폼 표시
    const showEditFormFor = (comment: Comment) => {
        setEditingComment(comment.id);
        setEditContent(comment.content);
    };

    // 댓글 렌더링
    const renderComment = (comment: Comment, level: number = 0) => {
        const isExpanded = expandedComments.has(comment.id);
        const canEdit = currentUserId === comment.authorId;
        const hasReplies = comment.children && comment.children.length > 0;
        const isMaxDepth = level >= maxDepth;

        return (
            <Box key={comment.id} className="comment-item">
                <Box
                    p={4}
                    bg={bgColor}
                    border="1px solid"
                    borderColor={borderColor}
                    borderRadius="md"
                    ml={level * 4}
                    _hover={{ bg: hoverBgColor }}
                    transition="background-color 0.2s"
                >
                    {/* 댓글 헤더 */}
                    <HStack justify="space-between" mb={2}>
                        <HStack spacing={2}>
                            <Avatar size="sm" name={comment.authorName} />
                            <VStack align="start" spacing={0}>
                                <Text fontWeight="semibold" fontSize="sm">
                                    {comment.authorName}
                                </Text>
                                <Text fontSize="xs" color="gray.500">
                                    {new Date(comment.createdAt).toLocaleString()}
                                    {comment.isEdited && (
                                        <Text as="span" color="gray.400" ml={1}>
                                            (수정됨)
                                        </Text>
                                    )}
                                </Text>
                            </VStack>
                        </HStack>

                        {/* 댓글 액션 메뉴 */}
                        <Menu>
                            <MenuButton as={IconButton} size="sm" variant="ghost">
                                <Text>⋯</Text>
                            </MenuButton>
                            <MenuList>
                                <MenuItem icon={<ReplyIcon />} onClick={() => showReplyFormFor(comment.id)}>
                                    답글
                                </MenuItem>
                                {canEdit && (
                                    <MenuItem icon={<EditIcon />} onClick={() => showEditFormFor(comment)}>
                                        수정
                                    </MenuItem>
                                )}
                                {canEdit && (
                                    <MenuItem icon={<DeleteIcon />} onClick={() => handleCommentDelete(comment.id)}>
                                        삭제
                                    </MenuItem>
                                )}
                                <MenuItem icon={<WarningIcon />} onClick={() => handleCommentReport(comment.id, 'spam')}>
                                    신고
                                </MenuItem>
                            </MenuList>
                        </Menu>
                    </HStack>

                    {/* 댓글 내용 */}
                    {editingComment === comment.id ? (
                        <VStack spacing={2} align="stretch">
                            <Textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                placeholder="댓글을 수정하세요..."
                                rows={3}
                            />
                            <HStack justify="end">
                                <Button size="sm" variant="outline" onClick={() => setEditingComment(null)}>
                                    취소
                                </Button>
                                <Button size="sm" colorScheme="blue" onClick={() => handleCommentEdit(comment.id)}>
                                    저장
                                </Button>
                            </HStack>
                        </VStack>
                    ) : (
                        <Text whiteSpace="pre-wrap" mb={3}>
                            {comment.content}
                        </Text>
                    )}

                    {/* 댓글 반응 시스템 */}
                    <Box mt={2}>
                        <CommentReactionSystem
                            commentId={comment.id}
                            onReactionToggle={(reactionType, emoji) =>
                                onCommentReactionToggle(comment.id, reactionType, emoji)
                            }
                            currentUserId={currentUserId}
                            isAnonymous={!currentUserId}
                        />
                    </Box>

                    {/* 댓글 액션 버튼들 */}
                    <HStack spacing={4} fontSize="sm" mt={2}>
                        {hasReplies && !isMaxDepth && (
                            <Button
                                size="sm"
                                variant="ghost"
                                leftIcon={isExpanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
                                onClick={() => toggleCommentExpansion(comment.id)}
                            >
                                {isExpanded ? '숨기기' : `${comment.replies}개 답글`}
                            </Button>
                        )}

                        {!isMaxDepth && (
                            <Button
                                size="sm"
                                variant="ghost"
                                leftIcon={<ReplyIcon />}
                                onClick={() => showReplyFormFor(comment.id)}
                            >
                                답글
                            </Button>
                        )}
                    </HStack>

                    {/* 답글 폼 */}
                    {showReplyForm === comment.id && (
                        <Box mt={3} p={3} bg="gray.50" borderRadius="md">
                            <VStack spacing={2} align="stretch">
                                <Text fontSize="sm" fontWeight="medium">
                                    {comment.authorName}님에게 답글
                                </Text>
                                <Textarea
                                    placeholder="답글을 작성하세요..."
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    rows={3}
                                />
                                <HStack justify="end">
                                    <Button size="sm" variant="outline" onClick={() => setShowReplyForm(null)}>
                                        취소
                                    </Button>
                                    <Button size="sm" colorScheme="blue" onClick={handleCommentSubmit}>
                                        답글 작성
                                    </Button>
                                </HStack>
                            </VStack>
                        </Box>
                    )}
                </Box>

                {/* 답글들 */}
                {hasReplies && isExpanded && !isMaxDepth && (
                    <Box mt={2}>
                        {comment.children.map((child) => renderComment(child, level + 1))}
                    </Box>
                )}

                {/* 최대 깊이 도달 시 답글 버튼만 표시 */}
                {hasReplies && isMaxDepth && (
                    <Box mt={2} ml={level * 4 + 4}>
                        <Button
                            size="sm"
                            variant="outline"
                            leftIcon={<ReplyIcon />}
                            onClick={() => showReplyFormFor(comment.id)}
                        >
                            {comment.replies}개 답글 더 보기
                        </Button>
                    </Box>
                )}
            </Box>
        );
    };

    if (isLoading) {
        return (
            <Box p={8} textAlign="center">
                <Spinner size="lg" />
                <Text mt={2}>댓글을 불러오는 중...</Text>
            </Box>
        );
    }

    return (
        <Box className="nested-comment-system">
            <VStack spacing={4} align="stretch">
                {/* 새 댓글 작성 폼 */}
                <Box p={4} bg={bgColor} border="1px solid" borderColor={borderColor} borderRadius="md">
                    <VStack spacing={3} align="stretch">
                        <Text fontWeight="semibold">댓글 작성</Text>
                        <Textarea
                            placeholder="댓글을 작성하세요..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            rows={3}
                        />
                        <HStack justify="end">
                            <Button
                                colorScheme="blue"
                                onClick={handleCommentSubmit}
                                isDisabled={!newComment.trim()}
                            >
                                댓글 작성
                            </Button>
                        </HStack>
                    </VStack>
                </Box>

                {/* 댓글 목록 */}
                {comments.length === 0 ? (
                    <Alert status="info" borderRadius="md">
                        <AlertIcon />
                        <Text>아직 댓글이 없습니다. 첫 번째 댓글을 작성해보세요!</Text>
                    </Alert>
                ) : (
                    <VStack spacing={2} align="stretch">
                        {comments.map((comment) => renderComment(comment))}
                    </VStack>
                )}
            </VStack>
        </Box>
    );
};

export default NestedCommentSystem;
