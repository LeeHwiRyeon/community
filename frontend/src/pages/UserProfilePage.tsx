import React, { useState, useEffect } from 'react';
import {
    Container,
    Box,
    Paper,
    Typography,
    Avatar,
    Button,
    Tab,
    Tabs,
    Card,
    CardContent,
    CardActionArea,
    Chip,
    Stack,
    Divider,
    CircularProgress,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Grid,
} from '@mui/material';
import {
    Edit as EditIcon,
    Article as ArticleIcon,
    Comment as CommentIcon,
    Person as PersonIcon,
    Visibility as ViewIcon,
    ThumbUp as LikeIcon,
    ChatBubble as ChatIcon,
    Bookmark as BookmarkIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

interface Profile {
    user: {
        id: number;
        username: string;
        email?: string;
        display_name: string;
        bio: string;
        avatar_url: string;
        role: string;
        created_at: string;
        last_seen: string;
    };
    stats: {
        posts: number;
        comments: number;
        followers: number;
        following: number;
        totalLikes?: number;
        bookmarks?: number;
    };
}

interface Post {
    id: number;
    title: string;
    content: string;
    view_count: number;
    comment_count: number;
    like_count: number;
    created_at: string;
}

interface Comment {
    id: number;
    content: string;
    post_id: number;
    post_title: string;
    like_count: number;
    created_at: string;
}

const UserProfilePage: React.FC = () => {
    const { userId } = useParams<{ userId: string }>();
    const navigate = useNavigate();

    const [profile, setProfile] = useState<Profile | null>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [comments, setComments] = useState<Comment[]>([]);
    const [activeTab, setActiveTab] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editForm, setEditForm] = useState({
        display_name: '',
        bio: '',
    });

    const currentUserId = getCurrentUserId();
    const isOwnProfile = currentUserId === parseInt(userId || '0');

    useEffect(() => {
        fetchProfile();
        fetchPosts();
        fetchComments();
    }, [userId]);

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const endpoint = isOwnProfile
                ? `${API_BASE_URL}/profile-simple/me/profile`
                : `${API_BASE_URL}/profile-simple/${userId}`;

            const token = localStorage.getItem('token');
            const response = await axios.get(endpoint, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });

            if (response.data.success) {
                setProfile(response.data.profile);
                setEditForm({
                    display_name: response.data.profile.user.display_name || '',
                    bio: response.data.profile.user.bio || '',
                });
            }
        } catch (error: any) {
            console.error('Failed to fetch profile:', error);
            setError(error.response?.data?.message || '프로필을 불러올 수 없습니다');
        } finally {
            setLoading(false);
        }
    };

    const fetchPosts = async () => {
        try {
            const response = await axios.get(
                `${API_BASE_URL}/profile-simple/${userId}/posts?limit=10`
            );
            if (response.data.success) {
                setPosts(response.data.posts);
            }
        } catch (error) {
            console.error('Failed to fetch posts:', error);
        }
    };

    const fetchComments = async () => {
        try {
            const response = await axios.get(
                `${API_BASE_URL}/profile-simple/${userId}/comments?limit=10`
            );
            if (response.data.success) {
                setComments(response.data.comments);
            }
        } catch (error) {
            console.error('Failed to fetch comments:', error);
        }
    };

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
    };

    const handleEditProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.put(
                `${API_BASE_URL}/profile-simple`,
                editForm,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (response.data.success) {
                setEditDialogOpen(false);
                fetchProfile();
            }
        } catch (error: any) {
            console.error('Failed to update profile:', error);
            alert(error.response?.data?.message || '프로필 업데이트 중 오류가 발생했습니다');
        }
    };

    function getCurrentUserId(): number {
        const token = localStorage.getItem('token');
        if (!token) return 0;
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.id || payload.userId || 0;
        } catch {
            return 0;
        }
    }

    if (loading) {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                </Box>
            </Container>
        );
    }

    if (error || !profile) {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Alert severity="error">{error || '프로필을 찾을 수 없습니다'}</Alert>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            {/* 프로필 헤더 */}
            <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', flexWrap: 'wrap' }}>
                    <Box>
                        <Avatar
                            src={profile.user.avatar_url}
                            alt={profile.user.display_name}
                            sx={{ width: 120, height: 120 }}
                        />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: '300px' }}>
                        <Stack spacing={1}>
                            <Stack direction="row" spacing={2} alignItems="center">
                                <Typography variant="h4">
                                    {profile.user.display_name || profile.user.username}
                                </Typography>
                                {isOwnProfile && (
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        startIcon={<EditIcon />}
                                        onClick={() => setEditDialogOpen(true)}
                                    >
                                        프로필 편집
                                    </Button>
                                )}
                            </Stack>
                            <Typography variant="body2" color="text.secondary">
                                @{profile.user.username}
                            </Typography>
                            {profile.user.bio && (
                                <Typography variant="body1">{profile.user.bio}</Typography>
                            )}
                            <Typography variant="caption" color="text.secondary">
                                가입일:{' '}
                                {formatDistanceToNow(new Date(profile.user.created_at), {
                                    addSuffix: true,
                                    locale: ko,
                                })}
                            </Typography>
                        </Stack>
                    </Box>
                </Box>

                {/* 통계 */}
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
                    <Box sx={{ flex: '1 1 15%', minWidth: '120px', textAlign: 'center' }}>
                        <Box textAlign="center">
                            <Typography variant="h6">{profile.stats.posts}</Typography>
                            <Typography variant="caption" color="text.secondary">
                                게시글
                            </Typography>
                        </Box>
                    </Box>
                    <Box sx={{ flex: '1 1 15%', minWidth: '120px', textAlign: 'center' }}>
                        <Box textAlign="center">
                            <Typography variant="h6">{profile.stats.comments}</Typography>
                            <Typography variant="caption" color="text.secondary">
                                댓글
                            </Typography>
                        </Box>
                    </Box>
                    <Box sx={{ flex: '1 1 15%', minWidth: '120px', textAlign: 'center' }}>
                        <Box textAlign="center">
                            <Typography variant="h6">{profile.stats.followers}</Typography>
                            <Typography variant="caption" color="text.secondary">
                                팔로워
                            </Typography>
                        </Box>
                    </Box>
                    <Box sx={{ flex: '1 1 15%', minWidth: '120px', textAlign: 'center' }}>
                        <Box textAlign="center">
                            <Typography variant="h6">{profile.stats.following}</Typography>
                            <Typography variant="caption" color="text.secondary">
                                팔로잉
                            </Typography>
                        </Box>
                    </Box>
                    {profile.stats.totalLikes !== undefined && (
                        <Box sx={{ flex: '1 1 15%', minWidth: '120px', textAlign: 'center' }}>
                            <Box textAlign="center">
                                <Typography variant="h6">{profile.stats.totalLikes}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                    받은 좋아요
                                </Typography>
                            </Box>
                        </Box>
                    )}
                    {profile.stats.bookmarks !== undefined && (
                        <Box sx={{ flex: '1 1 15%', minWidth: '120px', textAlign: 'center' }}>
                            <Box textAlign="center">
                                <Typography variant="h6">{profile.stats.bookmarks}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                    북마크
                                </Typography>
                            </Box>
                        </Box>
                    )}
                </Box>
            </Paper>

            {/* 탭 */}
            <Paper elevation={2} sx={{ mb: 3 }}>
                <Tabs value={activeTab} onChange={handleTabChange}>
                    <Tab
                        label={`게시글 (${profile.stats.posts})`}
                        icon={<ArticleIcon />}
                        iconPosition="start"
                    />
                    <Tab
                        label={`댓글 (${profile.stats.comments})`}
                        icon={<CommentIcon />}
                        iconPosition="start"
                    />
                </Tabs>
            </Paper>

            {/* 게시글 탭 */}
            {activeTab === 0 && (
                <Box>
                    {posts.length === 0 ? (
                        <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
                            <Typography variant="body1" color="text.secondary">
                                작성한 게시글이 없습니다
                            </Typography>
                        </Paper>
                    ) : (
                        <Stack spacing={2}>
                            {posts.map((post) => (
                                <Card key={post.id}>
                                    <CardActionArea onClick={() => navigate(`/posts/${post.id}`)}>
                                        <CardContent>
                                            <Typography variant="h6" gutterBottom>
                                                {post.title}
                                            </Typography>
                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                                sx={{
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: 'vertical',
                                                    overflow: 'hidden',
                                                    mb: 1,
                                                }}
                                            >
                                                {post.content}
                                            </Typography>
                                            <Stack direction="row" spacing={2} alignItems="center">
                                                <Typography variant="caption" color="text.secondary">
                                                    {formatDistanceToNow(new Date(post.created_at), {
                                                        addSuffix: true,
                                                        locale: ko,
                                                    })}
                                                </Typography>
                                                <Chip
                                                    icon={<ViewIcon fontSize="small" />}
                                                    label={post.view_count}
                                                    size="small"
                                                    variant="outlined"
                                                />
                                                <Chip
                                                    icon={<LikeIcon fontSize="small" />}
                                                    label={post.like_count}
                                                    size="small"
                                                    variant="outlined"
                                                />
                                                <Chip
                                                    icon={<ChatIcon fontSize="small" />}
                                                    label={post.comment_count}
                                                    size="small"
                                                    variant="outlined"
                                                />
                                            </Stack>
                                        </CardContent>
                                    </CardActionArea>
                                </Card>
                            ))}
                        </Stack>
                    )}
                </Box>
            )}

            {/* 댓글 탭 */}
            {activeTab === 1 && (
                <Box>
                    {comments.length === 0 ? (
                        <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
                            <Typography variant="body1" color="text.secondary">
                                작성한 댓글이 없습니다
                            </Typography>
                        </Paper>
                    ) : (
                        <Stack spacing={2}>
                            {comments.map((comment) => (
                                <Card key={comment.id}>
                                    <CardActionArea onClick={() => navigate(`/posts/${comment.post_id}`)}>
                                        <CardContent>
                                            <Typography variant="body1" gutterBottom>
                                                {comment.content}
                                            </Typography>
                                            <Stack direction="row" spacing={1} alignItems="center">
                                                <Typography variant="caption" color="text.secondary">
                                                    게시글: {comment.post_title}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    •
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {formatDistanceToNow(new Date(comment.created_at), {
                                                        addSuffix: true,
                                                        locale: ko,
                                                    })}
                                                </Typography>
                                                <Chip
                                                    icon={<LikeIcon fontSize="small" />}
                                                    label={comment.like_count}
                                                    size="small"
                                                    variant="outlined"
                                                />
                                            </Stack>
                                        </CardContent>
                                    </CardActionArea>
                                </Card>
                            ))}
                        </Stack>
                    )}
                </Box>
            )}

            {/* 프로필 편집 다이얼로그 */}
            <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>프로필 편집</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField
                            label="표시 이름"
                            fullWidth
                            value={editForm.display_name}
                            onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
                            inputProps={{ maxLength: 50 }}
                            helperText={`${editForm.display_name.length}/50`}
                        />
                        <TextField
                            label="자기소개"
                            fullWidth
                            multiline
                            rows={4}
                            value={editForm.bio}
                            onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                            inputProps={{ maxLength: 500 }}
                            helperText={`${editForm.bio.length}/500`}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditDialogOpen(false)}>취소</Button>
                    <Button onClick={handleEditProfile} variant="contained">
                        저장
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default UserProfilePage;
