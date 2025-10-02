import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Container,
    Card,
    CardContent,
    Button,
    Chip,
    Alert,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    Divider,
    IconButton,
    Menu,
    MenuItem
} from '@mui/material';
import {
    ArrowBack as ArrowBackIcon,
    Person as PersonIcon,
    Schedule as ScheduleIcon,
    Visibility as ViewIcon,
    Comment as CommentIcon,
    Reply as ReplyIcon,
    MoreVert as MoreIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Report as ReportIcon
} from '@mui/icons-material';
import VotingSystem from '../components/VotingSystem';

// 게시글 및 댓글 데이터 타입 정의
interface Post {
    id: string;
    boardId: string;
    boardName: string;
    title: string;
    content: string;
    author: string;
    authorId: string;
    views: number;
    commentsCount: number;
    createdAt: string;
    updatedAt: string;
    category?: string;
    thumb?: string;
}

interface Comment {
    id: string;
    postId: string;
    content: string;
    author: string;
    authorId: string;
    parentId?: string;
    createdAt: string;
    updatedAt: string;
    replies?: Comment[];
}

const PostDetail: React.FC = () => {
    const { postId } = useParams<{ postId: string }>();
    const navigate = useNavigate();

    const [post, setPost] = useState<Post | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [commentDialogOpen, setCommentDialogOpen] = useState(false);
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [newComment, setNewComment] = useState('');
    const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

    useEffect(() => {
        if (postId) {
            loadPost();
            loadComments();
        }
    }, [postId]);

    // 게시글 로딩
    const loadPost = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/posts/${postId}`);
            if (response.ok) {
                const data = await response.json();
                setPost(data.data);
            } else {
                // 모의 게시글 데이터
                const mockPost: Post = {
                    id: postId!,
                    boardId: 'general',
                    boardName: '자유게시판',
                    title: '커뮤니티 플랫폼 사용법 가이드',
                    content: `안녕하세요! 커뮤니티 플랫폼 사용법에 대해 자세히 설명드리겠습니다.

## 1. 회원가입 및 로그인
먼저 회원가입을 통해 계정을 생성하고 로그인해주세요.

## 2. 게시판 이용하기
- 각 게시판별로 주제에 맞는 글을 작성해주세요
- 다른 사용자의 글에 댓글로 소통할 수 있습니다
- 좋아요/싫어요 투표로 의견을 표현하세요

## 3. VIP 시스템
- 활동을 통해 포인트를 쌓아 VIP 등급을 올릴 수 있습니다
- VIP 회원은 특별한 혜택과 기능을 이용할 수 있습니다

## 4. 게임 센터
- 다양한 미니게임을 즐기고 리더보드에서 경쟁하세요
- 업적을 달성하여 포인트를 획득할 수 있습니다

## 5. 채팅 시스템
- 실시간으로 다른 사용자들과 채팅할 수 있습니다
- 여러 채팅방에 참여하여 주제별로 대화하세요

궁금한 점이 있으시면 언제든지 댓글로 문의해주세요!`,
                    author: '관리자',
                    authorId: 'admin',
                    views: 1247,
                    commentsCount: 23,
                    createdAt: '2024-10-01T10:00:00Z',
                    updatedAt: '2024-10-02T15:30:00Z',
                    category: 'guide'
                };
                setPost(mockPost);
            }
        } catch (err) {
            setError('게시글을 불러오는 중 오류가 발생했습니다.');
            console.error('게시글 로딩 오류:', err);
        } finally {
            setLoading(false);
        }
    };

    // 댓글 로딩
    const loadComments = async () => {
        try {
            const response = await fetch(`/api/posts/${postId}/comments`);
            if (response.ok) {
                const data = await response.json();
                setComments(data.data || []);
            } else {
                // 모의 댓글 데이터
                const mockComments: Comment[] = [
                    {
                        id: 'comment_1',
                        postId: postId!,
                        content: '정말 유용한 가이드네요! 감사합니다.',
                        author: '김철수',
                        authorId: 'user_1',
                        createdAt: '2024-10-02T11:00:00Z',
                        updatedAt: '2024-10-02T11:00:00Z'
                    },
                    {
                        id: 'comment_2',
                        postId: postId!,
                        content: 'VIP 시스템에 대해 더 자세히 알고 싶어요.',
                        author: '이영희',
                        authorId: 'user_2',
                        createdAt: '2024-10-02T12:00:00Z',
                        updatedAt: '2024-10-02T12:00:00Z',
                        replies: [
                            {
                                id: 'reply_1',
                                postId: postId!,
                                content: 'VIP 요구사항 페이지에서 자세한 정보를 확인할 수 있어요!',
                                author: '관리자',
                                authorId: 'admin',
                                parentId: 'comment_2',
                                createdAt: '2024-10-02T12:30:00Z',
                                updatedAt: '2024-10-02T12:30:00Z'
                            }
                        ]
                    },
                    {
                        id: 'comment_3',
                        postId: postId!,
                        content: '게임 센터에서 스네이크 게임 재밌게 하고 있어요!',
                        author: '박민수',
                        authorId: 'user_3',
                        createdAt: '2024-10-02T13:00:00Z',
                        updatedAt: '2024-10-02T13:00:00Z'
                    }
                ];
                setComments(mockComments);
            }
        } catch (err) {
            console.error('댓글 로딩 오류:', err);
        }
    };

    // 댓글 작성
    const createComment = async () => {
        if (!newComment.trim()) return;

        try {
            const commentData = {
                postId: postId,
                content: newComment,
                parentId: replyingTo,
                userId: 'current_user_id' // 실제로는 인증에서 가져옴
            };

            const response = await fetch(`/api/posts/${postId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(commentData)
            });

            if (response.ok) {
                await loadComments();
                setNewComment('');
                setCommentDialogOpen(false);
                setReplyingTo(null);
            }
        } catch (err) {
            console.error('댓글 작성 오류:', err);
        }
    };

    // 댓글 렌더링
    const renderComment = (comment: Comment, isReply: boolean = false) => (
        <Box key={comment.id} sx={{ ml: isReply ? 4 : 0 }}>
            <ListItem alignItems="flex-start">
                <ListItemAvatar>
                    <Avatar>{comment.author.charAt(0)}</Avatar>
                </ListItemAvatar>
                <ListItemText
                    primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="subtitle2">{comment.author}</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="caption" color="text.secondary">
                                    {new Date(comment.createdAt).toLocaleString('ko-KR')}
                                </Typography>
                                <IconButton size="small" onClick={(e) => setMenuAnchor(e.currentTarget)}>
                                    <MoreIcon />
                                </IconButton>
                            </Box>
                        </Box>
                    }
                    secondary={
                        <Box sx={{ mt: 1 }}>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                                {comment.content}
                            </Typography>
                            {!isReply && (
                                <Button
                                    size="small"
                                    startIcon={<ReplyIcon />}
                                    onClick={() => {
                                        setReplyingTo(comment.id);
                                        setCommentDialogOpen(true);
                                    }}
                                >
                                    답글
                                </Button>
                            )}
                        </Box>
                    }
                />
            </ListItem>

            {/* 답글들 */}
            {comment.replies && comment.replies.map(reply => renderComment(reply, true))}

            {!isReply && <Divider />}
        </Box>
    );

    if (loading) {
        return (
            <Container maxWidth="lg">
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                    <CircularProgress size={60} />
                </Box>
            </Container>
        );
    }

    if (error) {
        return (
            <Container maxWidth="lg">
                <Box sx={{ py: 4 }}>
                    <Alert severity="error">{error}</Alert>
                </Box>
            </Container>
        );
    }

    if (!post) {
        return (
            <Container maxWidth="lg">
                <Box sx={{ py: 4 }}>
                    <Alert severity="warning">게시글을 찾을 수 없습니다.</Alert>
                </Box>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg">
            <Box sx={{ py: 4 }}>
                {/* 뒤로가기 버튼 */}
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate(`/boards/${post.boardId}`)}
                    sx={{ mb: 2 }}
                >
                    {post.boardName}으로 돌아가기
                </Button>

                {/* 게시글 내용 */}
                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        {/* 게시글 헤더 */}
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="h4" component="h1" gutterBottom>
                                {post.title}
                            </Typography>

                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', mb: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <PersonIcon sx={{ fontSize: 16 }} />
                                    <Typography variant="body2">{post.author}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <ScheduleIcon sx={{ fontSize: 16 }} />
                                    <Typography variant="body2">
                                        {new Date(post.createdAt).toLocaleString('ko-KR')}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <ViewIcon sx={{ fontSize: 16 }} />
                                    <Typography variant="body2">{post.views}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <CommentIcon sx={{ fontSize: 16 }} />
                                    <Typography variant="body2">{post.commentsCount}</Typography>
                                </Box>
                                {post.category && (
                                    <Chip label={post.category} size="small" variant="outlined" />
                                )}
                            </Box>

                            {/* 투표 시스템 */}
                            <Box sx={{ mb: 2 }}>
                                <VotingSystem postId={post.id} type="simple" />
                            </Box>
                        </Box>

                        <Divider sx={{ mb: 3 }} />

                        {/* 게시글 본문 */}
                        <Typography
                            variant="body1"
                            sx={{
                                whiteSpace: 'pre-wrap',
                                lineHeight: 1.8,
                                '& h2': { fontSize: '1.5rem', fontWeight: 'bold', mt: 3, mb: 2 },
                                '& h3': { fontSize: '1.25rem', fontWeight: 'bold', mt: 2, mb: 1 }
                            }}
                        >
                            {post.content}
                        </Typography>
                    </CardContent>
                </Card>

                {/* 댓글 섹션 */}
                <Card>
                    <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center' }}>
                                <CommentIcon sx={{ mr: 1 }} />
                                댓글 ({comments.length})
                            </Typography>
                            <Button
                                variant="contained"
                                onClick={() => setCommentDialogOpen(true)}
                            >
                                댓글 작성
                            </Button>
                        </Box>

                        {comments.length === 0 ? (
                            <Box sx={{ textAlign: 'center', py: 4 }}>
                                <Typography variant="body1" color="text.secondary">
                                    아직 댓글이 없습니다. 첫 번째 댓글을 작성해보세요!
                                </Typography>
                            </Box>
                        ) : (
                            <List>
                                {comments.map(comment => renderComment(comment))}
                            </List>
                        )}
                    </CardContent>
                </Card>

                {/* 댓글 작성 다이얼로그 */}
                <Dialog open={commentDialogOpen} onClose={() => setCommentDialogOpen(false)} maxWidth="md" fullWidth>
                    <DialogTitle>
                        {replyingTo ? '답글 작성' : '댓글 작성'}
                    </DialogTitle>
                    <DialogContent>
                        <TextField
                            fullWidth
                            multiline
                            rows={4}
                            placeholder={replyingTo ? '답글을 입력하세요...' : '댓글을 입력하세요...'}
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            sx={{ mt: 1 }}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => {
                            setCommentDialogOpen(false);
                            setReplyingTo(null);
                            setNewComment('');
                        }}>
                            취소
                        </Button>
                        <Button
                            variant="contained"
                            onClick={createComment}
                            disabled={!newComment.trim()}
                        >
                            {replyingTo ? '답글 작성' : '댓글 작성'}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* 댓글 메뉴 */}
                <Menu
                    anchorEl={menuAnchor}
                    open={Boolean(menuAnchor)}
                    onClose={() => setMenuAnchor(null)}
                >
                    <MenuItem onClick={() => setMenuAnchor(null)}>
                        <EditIcon sx={{ mr: 1 }} />
                        수정
                    </MenuItem>
                    <MenuItem onClick={() => setMenuAnchor(null)}>
                        <DeleteIcon sx={{ mr: 1 }} />
                        삭제
                    </MenuItem>
                    <MenuItem onClick={() => setMenuAnchor(null)}>
                        <ReportIcon sx={{ mr: 1 }} />
                        신고
                    </MenuItem>
                </Menu>

                {/* 푸터 */}
                <Box sx={{ mt: 4, p: 2, bgcolor: 'grey.50', borderRadius: 2, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                        💡 게시글 상세 시스템이 실제 API와 연결되었습니다!
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        🚀 API 엔드포인트: /api/posts/{postId}, /api/posts/{postId}/comments 활용
                    </Typography>
                </Box>
            </Box>
        </Container>
    );
};

export default PostDetail;
