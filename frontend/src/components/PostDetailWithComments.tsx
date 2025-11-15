import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
    Container,
    Box,
    Paper,
    Typography,
    Divider,
    CircularProgress,
} from '@mui/material';
import CommentList from './CommentList';
import axios from 'axios';

interface Post {
    id: number;
    title: string;
    content: string;
    user_id: number;
    username: string;
    display_name?: string;
    avatar_url?: string;
    created_at: string;
    views: number;
}

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const PostDetailWithComments: React.FC = () => {
    const { postId } = useParams<{ postId: string }>();
    const [post, setPost] = useState<Post | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentUser, setCurrentUser] = useState<any>(null);

    // 현재 사용자 정보 가져오기
    useEffect(() => {
        const fetchCurrentUser = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;

                const response = await axios.get(`${API_BASE_URL}/auth/me`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (response.data.success) {
                    setCurrentUser(response.data.user);
                }
            } catch (err) {
                console.error('Failed to fetch current user:', err);
            }
        };

        fetchCurrentUser();
    }, []);

    // 게시글 정보 가져오기
    useEffect(() => {
        const fetchPost = async () => {
            if (!postId) return;

            setLoading(true);
            setError(null);

            try {
                const response = await axios.get(`${API_BASE_URL}/posts/${postId}`);

                if (response.data.success) {
                    setPost(response.data.post);
                }
            } catch (err: any) {
                console.error('Failed to fetch post:', err);
                setError(err.response?.data?.message || '게시글을 불러오는데 실패했습니다.');
            } finally {
                setLoading(false);
            }
        };

        fetchPost();
    }, [postId]);

    if (loading) {
        return (
            <Container maxWidth="md">
                <Box sx={{ textAlign: 'center', py: 8 }}>
                    <CircularProgress />
                </Box>
            </Container>
        );
    }

    if (error || !post) {
        return (
            <Container maxWidth="md">
                <Box sx={{ textAlign: 'center', py: 8 }}>
                    <Typography variant="h6" color="error">
                        {error || '게시글을 찾을 수 없습니다.'}
                    </Typography>
                </Box>
            </Container>
        );
    }

    return (
        <Container maxWidth="md">
            <Box sx={{ py: 4 }}>
                {/* 게시글 내용 */}
                <Paper sx={{ p: 3, mb: 4 }}>
                    <Typography variant="h4" component="h1" gutterBottom>
                        {post.title}
                    </Typography>

                    <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                            작성자: {post.display_name || post.username} |
                            작성일: {new Date(post.created_at).toLocaleDateString()} |
                            조회수: {post.views}
                        </Typography>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Typography
                        variant="body1"
                        component="div"
                        sx={{ whiteSpace: 'pre-wrap', minHeight: 200 }}
                    >
                        {post.content}
                    </Typography>
                </Paper>

                {/* 댓글 섹션 */}
                <Paper sx={{ p: 3 }}>
                    <CommentList
                        postId={Number(postId)}
                        currentUser={currentUser}
                    />
                </Paper>
            </Box>
        </Container>
    );
};

export default PostDetailWithComments;
