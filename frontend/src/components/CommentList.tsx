import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Typography,
    CircularProgress,
    Alert,
    Divider,
    Button,
    Stack,
} from '@mui/material';
import { Refresh } from '@mui/icons-material';
import CommentItem from './CommentItem';
import CommentForm from './CommentForm';
import axios from 'axios';

interface Comment {
    id: number;
    post_id: number;
    user_id: number;
    content: string;
    parent_id: number | null;
    created_at: string;
    updated_at: string;
    username: string;
    display_name: string;
    avatar_url: string;
    like_count: number;
    is_liked: number;
    replies?: Comment[];
}

interface CommentListProps {
    postId: number;
    currentUser?: {
        id: number;
        username: string;
        display_name?: string;
        avatar_url?: string;
    };
}

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const CommentList: React.FC<CommentListProps> = ({ postId, currentUser }) => {
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [total, setTotal] = useState(0);
    const [hasMore, setHasMore] = useState(false);

    // 댓글 목록 가져오기
    const fetchComments = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem('token');
            const config = token
                ? { headers: { Authorization: `Bearer ${token}` } }
                : {};

            const response = await axios.get(
                `${API_BASE_URL}/posts/${postId}/comments`,
                config
            );

            if (response.data.success) {
                setComments(response.data.comments);
                setTotal(response.data.total);
                setHasMore(response.data.hasMore);
            }
        } catch (err: any) {
            console.error('Failed to fetch comments:', err);
            setError(err.response?.data?.message || '댓글을 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    }, [postId]);

    useEffect(() => {
        fetchComments();
    }, [fetchComments]);

    // 댓글 작성
    const handleCommentSubmit = async (content: string, parentId?: number | null) => {
        if (!currentUser) {
            alert('로그인이 필요합니다.');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `${API_BASE_URL}/posts/${postId}/comments`,
                {
                    content,
                    parent_id: parentId || null,
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (response.data.success) {
                // 댓글 목록 새로고침
                await fetchComments();
            }
        } catch (err: any) {
            console.error('Failed to create comment:', err);
            throw new Error(err.response?.data?.message || '댓글 작성에 실패했습니다.');
        }
    };

    // 댓글 수정
    const handleCommentEdit = async (commentId: number, content: string) => {
        if (!currentUser) return;

        try {
            const token = localStorage.getItem('token');
            const response = await axios.put(
                `${API_BASE_URL}/comments/${commentId}`,
                { content },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (response.data.success) {
                // 댓글 목록 새로고침
                await fetchComments();
            }
        } catch (err: any) {
            console.error('Failed to update comment:', err);
            alert(err.response?.data?.message || '댓글 수정에 실패했습니다.');
        }
    };

    // 댓글 삭제
    const handleCommentDelete = async (commentId: number) => {
        if (!currentUser) return;

        try {
            const token = localStorage.getItem('token');
            const response = await axios.delete(
                `${API_BASE_URL}/comments/${commentId}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (response.data.success) {
                // 댓글 목록 새로고침
                await fetchComments();
            }
        } catch (err: any) {
            console.error('Failed to delete comment:', err);
            alert(err.response?.data?.message || '댓글 삭제에 실패했습니다.');
        }
    };

    // 댓글 좋아요/취소
    const handleCommentLike = async (commentId: number) => {
        if (!currentUser) {
            alert('로그인이 필요합니다.');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `${API_BASE_URL}/comments/${commentId}/like`,
                {},
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (response.data.success) {
                // 댓글 목록 새로고침
                await fetchComments();
            }
        } catch (err: any) {
            console.error('Failed to toggle like:', err);
            alert(err.response?.data?.message || '좋아요 처리에 실패했습니다.');
        }
    };

    // 답글 작성
    const handleReply = async (commentId: number, content: string) => {
        if (!currentUser) {
            alert('로그인이 필요합니다.');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `${API_BASE_URL}/posts/${postId}/comments`,
                {
                    content,
                    parent_id: commentId,
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (response.data.success) {
                // 댓글 목록 새로고침
                await fetchComments();
            }
        } catch (err: any) {
            console.error('Failed to create reply:', err);
            alert(err.response?.data?.message || '답글 작성에 실패했습니다.');
        }
    };

    if (loading && comments.length === 0) {
        return (
            <Box sx={{ textAlign: 'center', py: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            {/* 헤더 */}
            <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 2 }}
            >
                <Typography variant="h6">
                    댓글 {total > 0 && `(${total})`}
                </Typography>
                <Button
                    size="small"
                    startIcon={<Refresh />}
                    onClick={fetchComments}
                    disabled={loading}
                >
                    새로고침
                </Button>
            </Stack>

            {/* 에러 메시지 */}
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {/* 댓글 작성 폼 */}
            <Box sx={{ mb: 3 }}>
                <CommentForm
                    postId={postId}
                    currentUser={currentUser}
                    onSubmit={handleCommentSubmit}
                />
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* 댓글 목록 */}
            {comments.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                        첫 댓글을 작성해보세요!
                    </Typography>
                </Box>
            ) : (
                <Box>
                    {comments.map((comment) => (
                        <CommentItem
                            key={comment.id}
                            comment={comment}
                            currentUserId={currentUser?.id}
                            onReply={handleReply}
                            onEdit={handleCommentEdit}
                            onDelete={handleCommentDelete}
                            onLike={handleCommentLike}
                        />
                    ))}
                </Box>
            )}

            {/* 더 보기 버튼 (향후 페이지네이션용) */}
            {hasMore && (
                <Box sx={{ textAlign: 'center', mt: 3 }}>
                    <Button variant="outlined" onClick={fetchComments}>
                        더 보기
                    </Button>
                </Box>
            )}
        </Box>
    );
};

export default CommentList;
