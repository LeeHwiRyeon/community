import React, { useState } from 'react';
import {
    Box,
    Paper,
    TextField,
    Button,
    Avatar,
    Stack,
    Typography,
} from '@mui/material';
import { Send } from '@mui/icons-material';

interface CommentFormProps {
    postId: number;
    parentId?: number | null;
    currentUser?: {
        id: number;
        username: string;
        display_name?: string;
        avatar_url?: string;
    };
    onSubmit: (content: string, parentId?: number | null) => Promise<void>;
    placeholder?: string;
    autoFocus?: boolean;
}

const CommentForm: React.FC<CommentFormProps> = ({
    postId,
    parentId = null,
    currentUser,
    onSubmit,
    placeholder = '댓글을 입력하세요...',
    autoFocus = false,
}) => {
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!content.trim()) {
            setError('댓글 내용을 입력해주세요.');
            return;
        }

        if (content.length > 2000) {
            setError('댓글은 2000자를 초과할 수 없습니다.');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            await onSubmit(content.trim(), parentId);
            setContent('');
        } catch (err: any) {
            setError(err.message || '댓글 작성에 실패했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        // Ctrl/Cmd + Enter로 제출
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            handleSubmit(e);
        }
    };

    if (!currentUser) {
        return (
            <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                    댓글을 작성하려면 로그인이 필요합니다.
                </Typography>
            </Paper>
        );
    }

    return (
        <Paper sx={{ p: 2 }}>
            <form onSubmit={handleSubmit}>
                <Stack direction="row" spacing={2}>
                    {/* 사용자 아바타 */}
                    <Avatar
                        src={currentUser.avatar_url}
                        alt={currentUser.display_name || currentUser.username}
                        sx={{ width: 40, height: 40 }}
                    >
                        {(currentUser.display_name || currentUser.username).charAt(0).toUpperCase()}
                    </Avatar>

                    <Box sx={{ flex: 1 }}>
                        {/* 댓글 입력 필드 */}
                        <TextField
                            fullWidth
                            multiline
                            rows={3}
                            placeholder={placeholder}
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            onKeyDown={handleKeyDown}
                            variant="outlined"
                            size="small"
                            autoFocus={autoFocus}
                            disabled={isSubmitting}
                            error={Boolean(error)}
                            helperText={
                                error ||
                                `${content.length}/2000 (Ctrl+Enter로 제출)`
                            }
                            sx={{ mb: 1 }}
                        />

                        {/* 제출 버튼 */}
                        <Stack direction="row" justifyContent="flex-end" spacing={1}>
                            <Button
                                type="submit"
                                variant="contained"
                                endIcon={<Send />}
                                disabled={!content.trim() || isSubmitting}
                                size="small"
                            >
                                {isSubmitting ? '작성 중...' : parentId ? '답글 작성' : '댓글 작성'}
                            </Button>
                        </Stack>
                    </Box>
                </Stack>
            </form>
        </Paper>
    );
};

export default CommentForm;
