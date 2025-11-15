import React, { useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    Avatar,
    IconButton,
    Button,
    TextField,
    Menu,
    MenuItem,
    Stack,
    Chip,
} from '@mui/material';
import {
    ThumbUp,
    ThumbUpOutlined,
    Reply as ReplyIcon,
    MoreVert,
    Edit,
    Delete,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

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

interface CommentItemProps {
    comment: Comment;
    currentUserId?: number;
    depth?: number;
    onReply: (commentId: number, content: string) => void;
    onEdit: (commentId: number, content: string) => void;
    onDelete: (commentId: number) => void;
    onLike: (commentId: number) => void;
}

const CommentItem: React.FC<CommentItemProps> = ({
    comment,
    currentUserId,
    depth = 0,
    onReply,
    onEdit,
    onDelete,
    onLike,
}) => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(comment.content);
    const [showReplyForm, setShowReplyForm] = useState(false);
    const [replyContent, setReplyContent] = useState('');

    const isOwner = currentUserId === comment.user_id;
    const isLiked = comment.is_liked === 1;
    const maxDepth = 3; // 최대 중첩 깊이

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleEditClick = () => {
        setIsEditing(true);
        handleMenuClose();
    };

    const handleEditCancel = () => {
        setIsEditing(false);
        setEditContent(comment.content);
    };

    const handleEditSubmit = () => {
        if (editContent.trim()) {
            onEdit(comment.id, editContent.trim());
            setIsEditing(false);
        }
    };

    const handleDeleteClick = () => {
        if (window.confirm('댓글을 삭제하시겠습니까?')) {
            onDelete(comment.id);
        }
        handleMenuClose();
    };

    const handleReplyClick = () => {
        setShowReplyForm(!showReplyForm);
    };

    const handleReplySubmit = () => {
        if (replyContent.trim()) {
            onReply(comment.id, replyContent.trim());
            setReplyContent('');
            setShowReplyForm(false);
        }
    };

    const handleLikeClick = () => {
        onLike(comment.id);
    };

    return (
        <Box
            sx={{
                ml: depth > 0 ? { xs: 2, sm: 4 } : 0,
                mb: 2,
            }}
        >
            <Paper
                elevation={depth > 0 ? 1 : 2}
                sx={{
                    p: 2,
                    backgroundColor: depth > 0 ? 'grey.50' : 'background.paper',
                }}
            >
                <Stack direction="row" spacing={2}>
                    {/* 아바타 */}
                    <Avatar
                        src={comment.avatar_url}
                        alt={comment.display_name || comment.username}
                        sx={{ width: 40, height: 40 }}
                    >
                        {(comment.display_name || comment.username).charAt(0).toUpperCase()}
                    </Avatar>

                    <Box sx={{ flex: 1 }}>
                        {/* 헤더: 사용자 정보 및 시간 */}
                        <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                            mb={1}
                        >
                            <Box>
                                <Typography variant="subtitle2" component="span" fontWeight="bold">
                                    {comment.display_name || comment.username}
                                </Typography>
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    component="span"
                                    sx={{ ml: 1 }}
                                >
                                    {formatDistanceToNow(new Date(comment.created_at), {
                                        addSuffix: true,
                                        locale: ko,
                                    })}
                                </Typography>
                                {comment.updated_at !== comment.created_at && (
                                    <Chip
                                        label="수정됨"
                                        size="small"
                                        sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                                    />
                                )}
                            </Box>

                            {/* 메뉴 버튼 (작성자만) */}
                            {isOwner && (
                                <>
                                    <IconButton size="small" onClick={handleMenuOpen}>
                                        <MoreVert fontSize="small" />
                                    </IconButton>
                                    <Menu
                                        anchorEl={anchorEl}
                                        open={Boolean(anchorEl)}
                                        onClose={handleMenuClose}
                                    >
                                        <MenuItem onClick={handleEditClick}>
                                            <Edit fontSize="small" sx={{ mr: 1 }} />
                                            수정
                                        </MenuItem>
                                        <MenuItem onClick={handleDeleteClick}>
                                            <Delete fontSize="small" sx={{ mr: 1 }} />
                                            삭제
                                        </MenuItem>
                                    </Menu>
                                </>
                            )}
                        </Stack>

                        {/* 댓글 내용 */}
                        {isEditing ? (
                            <Box>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={3}
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    variant="outlined"
                                    size="small"
                                    sx={{ mb: 1 }}
                                />
                                <Stack direction="row" spacing={1}>
                                    <Button size="small" variant="contained" onClick={handleEditSubmit}>
                                        저장
                                    </Button>
                                    <Button size="small" variant="outlined" onClick={handleEditCancel}>
                                        취소
                                    </Button>
                                </Stack>
                            </Box>
                        ) : (
                            <Typography variant="body2" sx={{ mb: 1, whiteSpace: 'pre-wrap' }}>
                                {comment.content}
                            </Typography>
                        )}

                        {/* 액션 버튼들 */}
                        {!isEditing && (
                            <Stack direction="row" spacing={2} alignItems="center">
                                {/* 좋아요 버튼 */}
                                <Button
                                    size="small"
                                    startIcon={isLiked ? <ThumbUp /> : <ThumbUpOutlined />}
                                    onClick={handleLikeClick}
                                    color={isLiked ? 'primary' : 'inherit'}
                                    sx={{ minWidth: 'auto' }}
                                >
                                    {comment.like_count > 0 && comment.like_count}
                                </Button>

                                {/* 답글 버튼 */}
                                {depth < maxDepth && currentUserId && (
                                    <Button
                                        size="small"
                                        startIcon={<ReplyIcon />}
                                        onClick={handleReplyClick}
                                        sx={{ minWidth: 'auto' }}
                                    >
                                        답글
                                    </Button>
                                )}
                            </Stack>
                        )}

                        {/* 답글 작성 폼 */}
                        {showReplyForm && (
                            <Box sx={{ mt: 2 }}>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={2}
                                    placeholder="답글을 입력하세요..."
                                    value={replyContent}
                                    onChange={(e) => setReplyContent(e.target.value)}
                                    variant="outlined"
                                    size="small"
                                    sx={{ mb: 1 }}
                                />
                                <Stack direction="row" spacing={1}>
                                    <Button
                                        size="small"
                                        variant="contained"
                                        onClick={handleReplySubmit}
                                        disabled={!replyContent.trim()}
                                    >
                                        답글 작성
                                    </Button>
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        onClick={() => setShowReplyForm(false)}
                                    >
                                        취소
                                    </Button>
                                </Stack>
                            </Box>
                        )}
                    </Box>
                </Stack>
            </Paper>

            {/* 대댓글 렌더링 */}
            {comment.replies && comment.replies.length > 0 && (
                <Box sx={{ mt: 1 }}>
                    {comment.replies.map((reply) => (
                        <CommentItem
                            key={reply.id}
                            comment={reply}
                            currentUserId={currentUserId}
                            depth={depth + 1}
                            onReply={onReply}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onLike={onLike}
                        />
                    ))}
                </Box>
            )}
        </Box>
    );
};

export default CommentItem;
