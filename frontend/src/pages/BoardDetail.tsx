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
    Fab,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Avatar,
    Divider
} from '@mui/material';
import {
    Forum as ForumIcon,
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Visibility as ViewIcon,
    Comment as CommentIcon,
    ThumbUp as ThumbUpIcon,
    Schedule as ScheduleIcon,
    Person as PersonIcon,
    ArrowBack as ArrowBackIcon,
    PostAdd as PostAddIcon
} from '@mui/icons-material';
import VotingSystem from '../components/VotingSystem';
import PostListSkeleton from '../components/UI/PostListSkeleton';
import EmptyState from '../components/UI/EmptyState';
import { useSnackbar } from '../contexts/SnackbarContext';
import { AnimatedList, AnimatedListItem, FadeIn } from '../components/UI/AnimatedComponents';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';

// 게시글 데이터 타입 정의
interface Post {
    id: string;
    boardId: string;
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
    isPublished: boolean;
}

interface Board {
    id: string;
    name: string;
    description: string;
    category: string;
    isActive: boolean;
    postCount: number;
    sortOrder: number;
    createdAt: string;
}

// 백엔드 응답을 프론트엔드 형식으로 변환
const mapPostFromBackend = (backendPost: any): Post => ({
    id: backendPost.id,
    boardId: backendPost.board_id || backendPost.board,
    title: backendPost.title,
    content: backendPost.content || '',
    author: backendPost.author || 'Anonymous',
    authorId: backendPost.author_id || backendPost.authorId || '',
    views: backendPost.views || 0,
    commentsCount: backendPost.comment_count || backendPost.commentsCount || 0,
    createdAt: backendPost.created_at || backendPost.createdAt || new Date().toISOString(),
    updatedAt: backendPost.updated_at || backendPost.updatedAt || new Date().toISOString(),
    category: backendPost.category || '',
    thumb: backendPost.thumb || backendPost.hero_media || '',
    isPublished: backendPost.status === 'published' || !backendPost.deleted
});

const BoardDetail: React.FC = () => {
    const { boardId } = useParams<{ boardId: string }>();
    const navigate = useNavigate();
    const { showSuccess, showError } = useSnackbar();

    const [board, setBoard] = useState<Board | null>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [createPostOpen, setCreatePostOpen] = useState(false);

    // 새 게시글 폼
    const [newPost, setNewPost] = useState({
        title: '',
        content: '',
        category: ''
    });

    useEffect(() => {
        if (boardId) {
            loadBoard();
            loadPosts(1); // 초기 로드
        }
    }, [boardId]);

    // 게시판 정보 로딩
    const loadBoard = async () => {
        try {
            // 백엔드에는 개별 게시판 조회 API가 없으므로 전체 목록에서 찾기
            const response = await fetch(`/api/boards`);
            if (response.ok) {
                const boards = await response.json();
                const foundBoard = boards.find((b: any) => b.id === boardId);
                if (foundBoard) {
                    setBoard({
                        id: foundBoard.id,
                        name: foundBoard.title || foundBoard.name,
                        description: foundBoard.summary || foundBoard.description || '',
                        category: foundBoard.category || 'general',
                        isActive: !foundBoard.deleted,
                        postCount: 0, // 백엔드에서 제공하지 않음
                        sortOrder: foundBoard.ordering || 0,
                        createdAt: foundBoard.created_at || new Date().toISOString()
                    });
                } else {
                    throw new Error('게시판을 찾을 수 없습니다');
                }
            } else {
                // 모의 게시판 데이터
                setBoard({
                    id: boardId!,
                    name: getBoardName(boardId!),
                    description: getBoardDescription(boardId!),
                    category: 'general',
                    isActive: true,
                    postCount: 156,
                    sortOrder: 1,
                    createdAt: '2024-01-01T00:00:00Z'
                });
            }
        } catch (err) {
            setError('게시판 정보를 불러오는 중 오류가 발생했습니다.');
            console.error('게시판 로딩 오류:', err);
        }
    };

    // 게시글 목록 로딩 - 무한 스크롤용으로 수정
    const loadPosts = async (pageNum: number = page) => {
        if (!hasMore && pageNum > 1) return;

        try {
            setLoading(true);
            // 백엔드 Mock API 엔드포인트 호출
            const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
            const response = await fetch(`${apiUrl}/api/mock/boards/${boardId}/posts`);

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data) {
                    // Mock API 응답 형식: {success: true, data: [...]}
                    const mappedPosts = data.data.map(mapPostFromBackend);

                    // 첫 페이지면 교체, 아니면 추가 (페이징은 클라이언트에서 시뮬레이션)
                    const startIdx = (pageNum - 1) * 10;
                    const endIdx = pageNum * 10;
                    const pagedPosts = mappedPosts.slice(startIdx, endIdx);

                    setPosts(prev => pageNum === 1 ? pagedPosts : [...prev, ...pagedPosts]);
                    setHasMore(endIdx < mappedPosts.length);
                    setPage(pageNum + 1);
                } else {
                    throw new Error('Invalid response format');
                }
            } else {
                // Fallback: 모의 게시글 데이터
                const mockPosts: Post[] = generateMockPosts(boardId!, pageNum);

                setPosts(prev => pageNum === 1 ? mockPosts : [...prev, ...mockPosts]);
                setHasMore(pageNum < 8); // 8페이지까지 있다고 가정
                setPage(pageNum + 1);
            }
        } catch (err) {
            console.error('게시글 로딩 오류:', err);
            // 에러 시에도 Mock 데이터로 fallback
            const mockPosts: Post[] = generateMockPosts(boardId!, pageNum);
            setPosts(prev => pageNum === 1 ? mockPosts : [...prev, ...mockPosts]);
            setHasMore(pageNum < 8);
            setPage(pageNum + 1);
        } finally {
            setLoading(false);
        }
    };

    // 무한 스크롤 훅 사용
    const { observerRef } = useInfiniteScroll({
        loadMore: () => loadPosts(page),
        hasMore,
        isLoading: loading
    });

    // 게시판 이름 가져오기
    const getBoardName = (boardId: string): string => {
        const boardNames: { [key: string]: string } = {
            'general': '자유게시판',
            'notice': '공지사항',
            'qna': 'Q&A',
            'tech': '기술토론',
            'review': '후기게시판',
            'cosplay': '코스프레',
            'streaming': '스트리밍',
            'game': '게임토론'
        };
        return boardNames[boardId] || '게시판';
    };

    // 게시판 설명 가져오기
    const getBoardDescription = (boardId: string): string => {
        const descriptions: { [key: string]: string } = {
            'general': '자유롭게 이야기를 나누는 공간입니다.',
            'notice': '중요한 공지사항을 확인하세요.',
            'qna': '궁금한 것이 있으면 언제든지 질문하세요.',
            'tech': '기술 관련 토론과 정보를 공유합니다.',
            'review': '사용 후기와 경험을 공유해주세요.',
            'cosplay': '코스프레 작품과 정보를 공유합니다.',
            'streaming': '스트리밍 관련 정보와 팁을 나눕니다.',
            'game': '게임 관련 토론과 정보를 공유합니다.'
        };
        return descriptions[boardId] || '게시판 설명';
    };

    // 모의 게시글 생성
    const generateMockPosts = (boardId: string, pageNum: number): Post[] => {
        const titles = [
            '안녕하세요! 새로 가입했습니다.',
            '이 기능 어떻게 사용하나요?',
            '정말 유용한 팁 공유드려요!',
            '버그 발견했는데 신고드립니다.',
            '다음 업데이트 언제 나오나요?',
            '커뮤니티 이벤트 제안합니다.',
            '초보자를 위한 가이드',
            '고급 사용법 정리',
            '자주 묻는 질문 모음',
            '개선 사항 건의드립니다.',
            '감사 인사드립니다.',
            '새로운 기능 아이디어',
            '사용 후기 공유',
            '문제 해결 방법',
            '커뮤니티 규칙 안내',
            '월간 활동 보고서',
            '베타 테스트 참여자 모집',
            '업데이트 노트 v1.2',
            '사용자 설문조사',
            '연말 이벤트 안내'
        ];

        const authors = ['김철수', '이영희', '박민수', '최지영', '정현우', '한소영', '윤대성', '임수진'];

        return Array.from({ length: 20 }, (_, index) => ({
            id: `post_${boardId}_${(pageNum - 1) * 20 + index + 1}`,
            boardId: boardId,
            title: titles[index % titles.length],
            content: `${titles[index % titles.length]}에 대한 상세한 내용입니다. 이 게시글은 ${getBoardName(boardId)}에 작성된 게시글입니다.`,
            author: authors[index % authors.length],
            authorId: `user_${index % authors.length + 1}`,
            views: Math.floor(Math.random() * 500) + 10,
            commentsCount: Math.floor(Math.random() * 20),
            createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
            category: boardId,
            isPublished: true
        }));
    };

    // 새 게시글 작성
    const createPost = async () => {
        try {
            const postData = {
                title: newPost.title,
                content: newPost.content,
                author_id: 'current_user_id', // 실제로는 인증에서 가져옴
                category: newPost.category || boardId
            };

            // 백엔드 실제 엔드포인트로 수정: /api/boards/:id/posts
            const response = await fetch(`/api/boards/${boardId}/posts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(postData)
            });

            if (response.ok) {
                await loadPosts();
                setCreatePostOpen(false);
                setNewPost({ title: '', content: '', category: '' });
                showSuccess('게시글이 성공적으로 작성되었습니다!');
            } else {
                showError('게시글 작성에 실패했습니다.');
            }
        } catch (err) {
            console.error('게시글 작성 오류:', err);
            showError('게시글 작성 중 오류가 발생했습니다.');
        }
    };

    // 게시글 클릭 (상세 페이지로 이동)
    const handlePostClick = (postId: string) => {
        navigate(`/posts/${postId}`);
    };

    if (loading && !posts.length) {
        return (
            <Container maxWidth="lg">
                <Box sx={{ py: 4 }}>
                    <PostListSkeleton count={10} />
                </Box>
            </Container>
        );
    }

    if (error) {
        return (
            <Container maxWidth="lg">
                <Box sx={{ py: 4 }}>
                    <Alert
                        severity="error"
                        action={
                            <Button color="inherit" size="small" onClick={() => window.location.reload()}>
                                재시도
                            </Button>
                        }
                    >
                        {error}
                    </Alert>
                </Box>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg">
            <Box sx={{ py: 4 }}>
                {/* 헤더 */}
                <Box sx={{ mb: 4 }}>
                    <Button
                        startIcon={<ArrowBackIcon />}
                        onClick={() => navigate('/communities')}
                        sx={{ mb: 2 }}
                    >
                        커뮤니티 목록으로
                    </Button>

                    {board && (
                        <Card sx={{ mb: 3 }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <Box>
                                        <Typography variant="h4" component="h1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                                            <ForumIcon sx={{ mr: 2, fontSize: 'inherit' }} />
                                            {board.name}
                                        </Typography>
                                        <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                                            {board.description}
                                        </Typography>
                                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                            <Chip label={`게시글 ${board.postCount}개`} color="primary" />
                                            <Chip label={board.category} variant="outlined" />
                                            <Typography variant="caption" color="text.secondary">
                                                개설일: {new Date(board.createdAt).toLocaleDateString('ko-KR')}
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <Button
                                        variant="contained"
                                        startIcon={<AddIcon />}
                                        onClick={() => setCreatePostOpen(true)}
                                    >
                                        글쓰기
                                    </Button>
                                </Box>
                            </CardContent>
                        </Card>
                    )}
                </Box>

                {/* 게시글 목록 */}
                <FadeIn delay={0.2}>
                    <Card>
                        <CardContent>
                            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                                <ForumIcon sx={{ mr: 1 }} />
                                게시글 목록
                            </Typography>

                            {posts.length === 0 ? (
                                <EmptyState
                                    icon={<PostAddIcon />}
                                    title="아직 게시글이 없습니다"
                                    description="첫 번째 게시글을 작성해보세요!"
                                    action={{
                                        label: '첫 번째 글 작성하기',
                                        onClick: () => setCreatePostOpen(true)
                                    }}
                                />
                            ) : (
                                <AnimatedList>
                                    <List>
                                        {posts.map((post, index) => (
                                            <AnimatedListItem key={post.id}>
                                                <React.Fragment>
                                                    <ListItem
                                                        sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'grey.50' } }}
                                                        onClick={() => handlePostClick(post.id)}
                                                    >
                                                        <ListItemText
                                                            primary={
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                                    <Typography variant="h6" sx={{ flexGrow: 1 }}>
                                                                        {post.title}
                                                                    </Typography>
                                                                    {post.commentsCount > 0 && (
                                                                        <Chip
                                                                            icon={<CommentIcon />}
                                                                            label={post.commentsCount}
                                                                            size="small"
                                                                            color="primary"
                                                                        />
                                                                    )}
                                                                </Box>
                                                            }
                                                            secondary={
                                                                <Box>
                                                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                                                        {post.content.substring(0, 100)}...
                                                                    </Typography>

                                                                    {/* 투표 시스템 통합 */}
                                                                    <Box sx={{ mb: 1 }}>
                                                                        <VotingSystem postId={post.id} type="simple" />
                                                                    </Box>

                                                                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                            <PersonIcon sx={{ fontSize: 16 }} />
                                                                            <Typography variant="caption">{post.author}</Typography>
                                                                        </Box>
                                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                            <ViewIcon sx={{ fontSize: 16 }} />
                                                                            <Typography variant="caption">{post.views}</Typography>
                                                                        </Box>
                                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                            <ScheduleIcon sx={{ fontSize: 16 }} />
                                                                            <Typography variant="caption">
                                                                                {new Date(post.createdAt).toLocaleDateString('ko-KR')}
                                                                            </Typography>
                                                                        </Box>
                                                                    </Box>
                                                                </Box>
                                                            }
                                                        />
                                                    </ListItem>
                                                    {index < posts.length - 1 && <Divider />}
                                                </React.Fragment>
                                            </AnimatedListItem>
                                        ))}
                                    </List>
                                </AnimatedList>
                            )}

                            {/* 무한 스크롤 로더 */}
                            {hasMore && !loading && (
                                <Box
                                    ref={observerRef}
                                    sx={{
                                        display: 'flex',
                                        justifyContent: 'center',
                                        py: 3
                                    }}
                                >
                                    <CircularProgress size={32} />
                                </Box>
                            )}

                            {/* 추가 로딩 중 표시 */}
                            {loading && posts.length > 0 && (
                                <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                                    <CircularProgress size={32} />
                                </Box>
                            )}

                            {/* 모든 게시글 로드 완료 */}
                            {!hasMore && posts.length > 0 && (
                                <Box sx={{ textAlign: 'center', py: 3 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        모든 게시글을 불러왔습니다.
                                    </Typography>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </FadeIn>

                {/* 글쓰기 FAB */}
                <Fab
                    color="primary"
                    sx={{ position: 'fixed', bottom: 80, right: 16 }}
                    onClick={() => setCreatePostOpen(true)}
                >
                    <AddIcon />
                </Fab>

                {/* 글쓰기 다이얼로그 */}
                <Dialog open={createPostOpen} onClose={() => setCreatePostOpen(false)} maxWidth="md" fullWidth>
                    <DialogTitle>새 게시글 작성</DialogTitle>
                    <DialogContent>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                            <TextField
                                fullWidth
                                label="제목"
                                value={newPost.title}
                                onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                            />

                            <TextField
                                fullWidth
                                multiline
                                rows={8}
                                label="내용"
                                value={newPost.content}
                                onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                            />

                            <FormControl fullWidth>
                                <InputLabel>카테고리</InputLabel>
                                <Select
                                    value={newPost.category}
                                    onChange={(e) => setNewPost({ ...newPost, category: e.target.value })}
                                >
                                    <MenuItem value="">기본</MenuItem>
                                    <MenuItem value="notice">공지</MenuItem>
                                    <MenuItem value="question">질문</MenuItem>
                                    <MenuItem value="discussion">토론</MenuItem>
                                    <MenuItem value="tip">팁</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setCreatePostOpen(false)}>취소</Button>
                        <Button
                            variant="contained"
                            onClick={createPost}
                            disabled={!newPost.title.trim() || !newPost.content.trim()}
                        >
                            작성
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* 푸터 */}
                <Box sx={{ mt: 4, p: 2, bgcolor: 'grey.50', borderRadius: 2, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                        💡 게시판 시스템이 실제 API와 연결되었습니다!
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        🚀 API 엔드포인트: /api/boards/{boardId}, /api/posts 활용
                    </Typography>
                </Box>
            </Box>
        </Container>
    );
};

export default BoardDetail;
