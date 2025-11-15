import React, { useState, useEffect } from 'react';
import {
    Container,
    Typography,
    Box,
    Paper,
    Grid,
    Card,
    CardContent,
    Tabs,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    IconButton,
    Chip,
    TextField,
    MenuItem,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    CircularProgress,
    FormControl,
    InputLabel,
    Select,
    Tooltip,
} from '@mui/material';
import {
    People,
    Article,
    Comment,
    ThumbUp,
    Delete,
    Edit,
    Refresh,
    TrendingUp,
    Timeline,
    Flag,
    Psychology,
} from '@mui/icons-material';
import axios from 'axios';

// 새 컴포넌트 import
import RealTimeStats from '../components/admin/RealTimeStats';
import ActivityLogViewer from '../components/admin/ActivityLogViewer';
import ReportDashboard from '../components/admin/ReportDashboard';
import AIModeration from '../components/admin/AIModeration';

interface Stats {
    users: {
        total: number;
        online: number;
    };
    posts: {
        total: number;
        today: number;
    };
    comments: {
        total: number;
        today: number;
    };
    likes: {
        total: number;
    };
    recentActivity: Array<{
        date: string;
        count: number;
    }>;
    topPosts: Array<{
        id: number;
        title: string;
        view_count: number;
        username: string;
        display_name: string;
    }>;
    activeUsers: Array<{
        id: number;
        username: string;
        display_name: string;
        post_count: number;
    }>;
}

interface User {
    id: number;
    username: string;
    email: string;
    display_name: string;
    role: string;
    is_online: boolean;
    created_at: string;
    post_count: number;
    comment_count: number;
}

interface Post {
    id: number;
    title: string;
    content: string;
    view_count: number;
    created_at: string;
    author_username: string;
    author_display_name: string;
    comment_count: number;
    like_count: number;
}

interface CommentType {
    id: number;
    content: string;
    post_id: number;
    post_title: string;
    created_at: string;
    author_username: string;
    author_display_name: string;
    like_count: number;
}

interface Activity {
    type: 'post' | 'comment';
    id: number;
    content: string;
    created_at: string;
    username: string;
    display_name: string;
}

const AdminDashboardPage: React.FC = () => {
    const [tabValue, setTabValue] = useState(0);
    const [stats, setStats] = useState<Stats | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [posts, setPosts] = useState<Post[]>([]);
    const [comments, setComments] = useState<CommentType[]>([]);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('created_at');
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: number; title?: string } | null>(null);
    const [roleDialogOpen, setRoleDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [newRole, setNewRole] = useState('user');

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

    useEffect(() => {
        fetchStats();
        if (tabValue === 1) {
            fetchUsers();
        } else if (tabValue === 2) {
            fetchPosts();
        } else if (tabValue === 3) {
            fetchComments();
        } else if (tabValue === 4) {
            fetchActivities();
        }
    }, [tabValue, searchTerm, sortBy]);

    const getAuthHeaders = () => {
        const token = localStorage.getItem('token');
        return token ? { Authorization: `Bearer ${token}` } : {};
    };

    const fetchStats = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_BASE_URL}/api/admin-simple/stats`, {
                headers: getAuthHeaders(),
            });
            if (response.data.success) {
                setStats(response.data.stats);
            }
            setError(null);
        } catch (err: any) {
            setError(err.response?.data?.message || '통계 로드 실패');
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_BASE_URL}/api/admin-simple/users`, {
                headers: getAuthHeaders(),
                params: {
                    search: searchTerm,
                    sortBy,
                    limit: 100,
                },
            });
            if (response.data.success) {
                setUsers(response.data.users);
            }
            setError(null);
        } catch (err: any) {
            setError(err.response?.data?.message || '사용자 로드 실패');
        } finally {
            setLoading(false);
        }
    };

    const fetchPosts = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_BASE_URL}/api/admin-simple/posts`, {
                headers: getAuthHeaders(),
                params: {
                    search: searchTerm,
                    sortBy,
                    limit: 100,
                },
            });
            if (response.data.success) {
                setPosts(response.data.posts);
            }
            setError(null);
        } catch (err: any) {
            setError(err.response?.data?.message || '게시글 로드 실패');
        } finally {
            setLoading(false);
        }
    };

    const fetchComments = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_BASE_URL}/api/admin-simple/comments`, {
                headers: getAuthHeaders(),
                params: {
                    search: searchTerm,
                    limit: 100,
                },
            });
            if (response.data.success) {
                setComments(response.data.comments);
            }
            setError(null);
        } catch (err: any) {
            setError(err.response?.data?.message || '댓글 로드 실패');
        } finally {
            setLoading(false);
        }
    };

    const fetchActivities = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_BASE_URL}/api/admin-simple/activity`, {
                headers: getAuthHeaders(),
            });
            if (response.data.success) {
                setActivities(response.data.activities);
            }
            setError(null);
        } catch (err: any) {
            setError(err.response?.data?.message || '활동 로그 로드 실패');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (userId: number) => {
        try {
            await axios.delete(`${API_BASE_URL}/api/admin-simple/users/${userId}`, {
                headers: getAuthHeaders(),
            });
            fetchUsers();
            setDeleteDialogOpen(false);
            setDeleteTarget(null);
        } catch (err: any) {
            setError(err.response?.data?.message || '사용자 삭제 실패');
        }
    };

    const handleDeletePost = async (postId: number) => {
        try {
            await axios.delete(`${API_BASE_URL}/api/admin-simple/posts/${postId}`, {
                headers: getAuthHeaders(),
            });
            fetchPosts();
            setDeleteDialogOpen(false);
            setDeleteTarget(null);
        } catch (err: any) {
            setError(err.response?.data?.message || '게시글 삭제 실패');
        }
    };

    const handleDeleteComment = async (commentId: number) => {
        try {
            await axios.delete(`${API_BASE_URL}/api/admin-simple/comments/${commentId}`, {
                headers: getAuthHeaders(),
            });
            fetchComments();
            setDeleteDialogOpen(false);
            setDeleteTarget(null);
        } catch (err: any) {
            setError(err.response?.data?.message || '댓글 삭제 실패');
        }
    };

    const handleChangeRole = async () => {
        if (!selectedUser) return;
        try {
            await axios.put(
                `${API_BASE_URL}/api/admin-simple/users/${selectedUser.id}/role`,
                { role: newRole },
                { headers: getAuthHeaders() }
            );
            fetchUsers();
            setRoleDialogOpen(false);
            setSelectedUser(null);
        } catch (err: any) {
            setError(err.response?.data?.message || '역할 변경 실패');
        }
    };

    const openDeleteDialog = (type: string, id: number, title?: string) => {
        setDeleteTarget({ type, id, title });
        setDeleteDialogOpen(true);
    };

    const openRoleDialog = (user: User) => {
        setSelectedUser(user);
        setNewRole(user.role);
        setRoleDialogOpen(true);
    };

    const handleConfirmDelete = () => {
        if (!deleteTarget) return;
        if (deleteTarget.type === 'user') {
            handleDeleteUser(deleteTarget.id);
        } else if (deleteTarget.type === 'post') {
            handleDeletePost(deleteTarget.id);
        } else if (deleteTarget.type === 'comment') {
            handleDeleteComment(deleteTarget.id);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('ko-KR');
    };

    const renderStats = () => {
        if (!stats) return null;

        return (
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mb: 4 }}>
                <Box sx={{ flex: '1 1 23%', minWidth: '250px' }}>
                    <Card>
                        <CardContent>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Box>
                                    <Typography color="textSecondary" gutterBottom>
                                        전체 사용자
                                    </Typography>
                                    <Typography variant="h4">{stats.users.total}</Typography>
                                    <Typography variant="caption" color="success.main">
                                        온라인: {stats.users.online}명
                                    </Typography>
                                </Box>
                                <People sx={{ fontSize: 48, color: 'primary.main', opacity: 0.3 }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Box>

                <Box sx={{ flex: '1 1 23%', minWidth: '250px' }}>
                    <Card>
                        <CardContent>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Box>
                                    <Typography color="textSecondary" gutterBottom>
                                        전체 게시글
                                    </Typography>
                                    <Typography variant="h4">{stats.posts.total}</Typography>
                                    <Typography variant="caption" color="info.main">
                                        오늘: {stats.posts.today}개
                                    </Typography>
                                </Box>
                                <Article sx={{ fontSize: 48, color: 'secondary.main', opacity: 0.3 }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Box>

                <Box sx={{ flex: '1 1 23%', minWidth: '250px' }}>
                    <Card>
                        <CardContent>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Box>
                                    <Typography color="textSecondary" gutterBottom>
                                        전체 댓글
                                    </Typography>
                                    <Typography variant="h4">{stats.comments.total}</Typography>
                                    <Typography variant="caption" color="info.main">
                                        오늘: {stats.comments.today}개
                                    </Typography>
                                </Box>
                                <Comment sx={{ fontSize: 48, color: 'success.main', opacity: 0.3 }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Box>

                <Box sx={{ flex: '1 1 23%', minWidth: '250px' }}>
                    <Card>
                        <CardContent>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Box>
                                    <Typography color="textSecondary" gutterBottom>
                                        전체 좋아요
                                    </Typography>
                                    <Typography variant="h4">{stats.likes.total}</Typography>
                                </Box>
                                <ThumbUp sx={{ fontSize: 48, color: 'error.main', opacity: 0.3 }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Box>

                {/* 인기 게시글 */}
                <Box sx={{ flex: '1 1 45%', minWidth: '400px' }}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            인기 게시글 Top 5
                        </Typography>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>제목</TableCell>
                                    <TableCell align="right">조회수</TableCell>
                                    <TableCell>작성자</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {stats.topPosts?.map((post) => (
                                    <TableRow key={post.id}>
                                        <TableCell>{post.title}</TableCell>
                                        <TableCell align="right">{post.view_count}</TableCell>
                                        <TableCell>{post.display_name || post.username}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Paper>
                </Box>

                {/* 활동적인 사용자 */}
                <Box sx={{ flex: '1 1 45%', minWidth: '400px' }}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            활동적인 사용자 Top 5
                        </Typography>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>사용자</TableCell>
                                    <TableCell align="right">게시글 수</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {stats.activeUsers?.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell>{user.display_name || user.username}</TableCell>
                                        <TableCell align="right">{user.post_count}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Paper>
                </Box>
            </Box>
        );
    };

    const renderUsers = () => {
        return (
            <Box>
                <Box display="flex" gap={2} mb={2}>
                    <TextField
                        size="small"
                        placeholder="사용자 검색..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        sx={{ flexGrow: 1 }}
                    />
                    <TextField
                        select
                        size="small"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        sx={{ minWidth: 150 }}
                    >
                        <MenuItem value="created_at">가입일순</MenuItem>
                        <MenuItem value="username">이름순</MenuItem>
                    </TextField>
                    <IconButton onClick={fetchUsers}>
                        <Refresh />
                    </IconButton>
                </Box>

                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>ID</TableCell>
                                <TableCell>사용자명</TableCell>
                                <TableCell>이메일</TableCell>
                                <TableCell>역할</TableCell>
                                <TableCell align="center">온라인</TableCell>
                                <TableCell align="right">게시글</TableCell>
                                <TableCell align="right">댓글</TableCell>
                                <TableCell>가입일</TableCell>
                                <TableCell align="center">작업</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell>{user.id}</TableCell>
                                    <TableCell>{user.display_name || user.username}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={user.role}
                                            size="small"
                                            color={user.role === 'admin' ? 'error' : 'default'}
                                        />
                                    </TableCell>
                                    <TableCell align="center">
                                        <Chip
                                            label={user.is_online ? '온라인' : '오프라인'}
                                            size="small"
                                            color={user.is_online ? 'success' : 'default'}
                                        />
                                    </TableCell>
                                    <TableCell align="right">{user.post_count}</TableCell>
                                    <TableCell align="right">{user.comment_count}</TableCell>
                                    <TableCell>{formatDate(user.created_at)}</TableCell>
                                    <TableCell align="center">
                                        <IconButton size="small" onClick={() => openRoleDialog(user)}>
                                            <Edit />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            color="error"
                                            onClick={() => openDeleteDialog('user', user.id, user.username)}
                                        >
                                            <Delete />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>
        );
    };

    const renderPosts = () => {
        return (
            <Box>
                <Box display="flex" gap={2} mb={2}>
                    <TextField
                        size="small"
                        placeholder="게시글 검색..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        sx={{ flexGrow: 1 }}
                    />
                    <TextField
                        select
                        size="small"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        sx={{ minWidth: 150 }}
                    >
                        <MenuItem value="created_at">최신순</MenuItem>
                        <MenuItem value="view_count">조회수순</MenuItem>
                    </TextField>
                    <IconButton onClick={fetchPosts}>
                        <Refresh />
                    </IconButton>
                </Box>

                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>ID</TableCell>
                                <TableCell>제목</TableCell>
                                <TableCell>작성자</TableCell>
                                <TableCell align="right">조회</TableCell>
                                <TableCell align="right">댓글</TableCell>
                                <TableCell align="right">좋아요</TableCell>
                                <TableCell>작성일</TableCell>
                                <TableCell align="center">작업</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {posts.map((post) => (
                                <TableRow key={post.id}>
                                    <TableCell>{post.id}</TableCell>
                                    <TableCell>{post.title}</TableCell>
                                    <TableCell>{post.author_display_name || post.author_username}</TableCell>
                                    <TableCell align="right">{post.view_count}</TableCell>
                                    <TableCell align="right">{post.comment_count}</TableCell>
                                    <TableCell align="right">{post.like_count}</TableCell>
                                    <TableCell>{formatDate(post.created_at)}</TableCell>
                                    <TableCell align="center">
                                        <IconButton
                                            size="small"
                                            color="error"
                                            onClick={() => openDeleteDialog('post', post.id, post.title)}
                                        >
                                            <Delete />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>
        );
    };

    const renderComments = () => {
        return (
            <Box>
                <Box display="flex" gap={2} mb={2}>
                    <TextField
                        size="small"
                        placeholder="댓글 검색..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        sx={{ flexGrow: 1 }}
                    />
                    <IconButton onClick={fetchComments}>
                        <Refresh />
                    </IconButton>
                </Box>

                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>ID</TableCell>
                                <TableCell>내용</TableCell>
                                <TableCell>작성자</TableCell>
                                <TableCell>게시글</TableCell>
                                <TableCell align="right">좋아요</TableCell>
                                <TableCell>작성일</TableCell>
                                <TableCell align="center">작업</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {comments.map((comment) => (
                                <TableRow key={comment.id}>
                                    <TableCell>{comment.id}</TableCell>
                                    <TableCell>{comment.content.substring(0, 50)}...</TableCell>
                                    <TableCell>
                                        {comment.author_display_name || comment.author_username}
                                    </TableCell>
                                    <TableCell>{comment.post_title}</TableCell>
                                    <TableCell align="right">{comment.like_count}</TableCell>
                                    <TableCell>{formatDate(comment.created_at)}</TableCell>
                                    <TableCell align="center">
                                        <IconButton
                                            size="small"
                                            color="error"
                                            onClick={() =>
                                                openDeleteDialog('comment', comment.id, comment.content)
                                            }
                                        >
                                            <Delete />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>
        );
    };

    const renderActivities = () => {
        return (
            <Box>
                <Box display="flex" justifyContent="space-between" mb={2}>
                    <Typography variant="h6">최근 활동</Typography>
                    <IconButton onClick={fetchActivities}>
                        <Refresh />
                    </IconButton>
                </Box>

                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>유형</TableCell>
                                <TableCell>내용</TableCell>
                                <TableCell>사용자</TableCell>
                                <TableCell>시간</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {activities.map((activity, index) => (
                                <TableRow key={`${activity.type}-${activity.id}-${index}`}>
                                    <TableCell>
                                        <Chip
                                            label={activity.type === 'post' ? '게시글' : '댓글'}
                                            size="small"
                                            color={activity.type === 'post' ? 'primary' : 'secondary'}
                                        />
                                    </TableCell>
                                    <TableCell>{activity.content?.substring(0, 80)}...</TableCell>
                                    <TableCell>{activity.display_name || activity.username}</TableCell>
                                    <TableCell>{formatDate(activity.created_at)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>
        );
    };

    if (loading && tabValue === 0) {
        return (
            <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress />
            </Container>
        );
    }

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" gutterBottom>
                관리자 대시보드
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
                    <Tab label="통계" icon={<Article />} />
                    <Tab label="사용자 관리" icon={<People />} />
                    <Tab label="게시글 관리" icon={<Article />} />
                    <Tab label="댓글 관리" icon={<Comment />} />
                    <Tab label="활동 로그" icon={<Timeline />} />
                    <Tab label="실시간 통계" icon={<TrendingUp />} />
                    <Tab label="신고 관리" icon={<Flag />} />
                    <Tab label="AI 모더레이션" icon={<Psychology />} />
                </Tabs>
            </Box>

            {tabValue === 0 && renderStats()}
            {tabValue === 1 && renderUsers()}
            {tabValue === 2 && renderPosts()}
            {tabValue === 3 && renderComments()}
            {tabValue === 4 && renderActivities()}
            {tabValue === 5 && <RealTimeStats />}
            {tabValue === 6 && <ReportDashboard />}
            {tabValue === 7 && <AIModeration />}

            {/* 삭제 확인 다이얼로그 */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle>삭제 확인</DialogTitle>
                <DialogContent>
                    {deleteTarget?.type === 'user' && (
                        <Typography>
                            사용자 "{deleteTarget.title}"를 삭제하시겠습니까?
                        </Typography>
                    )}
                    {deleteTarget?.type === 'post' && (
                        <Typography>게시글 "{deleteTarget.title}"를 삭제하시겠습니까?</Typography>
                    )}
                    {deleteTarget?.type === 'comment' && (
                        <Typography>댓글을 삭제하시겠습니까?</Typography>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>취소</Button>
                    <Button onClick={handleConfirmDelete} color="error" variant="contained">
                        삭제
                    </Button>
                </DialogActions>
            </Dialog>

            {/* 역할 변경 다이얼로그 */}
            <Dialog open={roleDialogOpen} onClose={() => setRoleDialogOpen(false)}>
                <DialogTitle>역할 변경</DialogTitle>
                <DialogContent>
                    <TextField
                        select
                        fullWidth
                        label="역할"
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value)}
                        sx={{ mt: 2 }}
                    >
                        <MenuItem value="user">일반 사용자</MenuItem>
                        <MenuItem value="moderator">모더레이터</MenuItem>
                        <MenuItem value="admin">관리자</MenuItem>
                    </TextField>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setRoleDialogOpen(false)}>취소</Button>
                    <Button onClick={handleChangeRole} color="primary" variant="contained">
                        변경
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default AdminDashboardPage;

