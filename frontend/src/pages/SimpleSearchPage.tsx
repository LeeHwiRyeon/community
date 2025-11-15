import React, { useState, useEffect, useCallback } from 'react';
import {
    Container,
    Box,
    TextField,
    InputAdornment,
    IconButton,
    Tabs,
    Tab,
    Paper,
    Typography,
    List,
    Card,
    CardContent,
    CardActionArea,
    Avatar,
    Chip,
    CircularProgress,
    Alert,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid,
    Divider,
    Stack,
    Autocomplete,
} from '@mui/material';
import {
    Search as SearchIcon,
    Clear as ClearIcon,
    Article as ArticleIcon,
    Comment as CommentIcon,
    Person as PersonIcon,
    TrendingUp as TrendingIcon,
    Visibility as ViewIcon,
    ThumbUp as LikeIcon,
    ChatBubble as ChatIcon,
} from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

interface SearchResult {
    query: string;
    type: string;
    total: number;
    posts: Post[];
    comments: Comment[];
    users: User[];
}

interface Post {
    id: number;
    title: string;
    content: string;
    author_username: string;
    author_display_name: string;
    author_avatar_url: string;
    view_count: number;
    like_count: number;
    comment_count: number;
    created_at: string;
}

interface Comment {
    id: number;
    content: string;
    post_id: number;
    post_title: string;
    author_username: string;
    author_display_name: string;
    author_avatar_url: string;
    like_count: number;
    created_at: string;
}

interface User {
    id: number;
    username: string;
    display_name: string;
    avatar_url: string;
    bio: string;
    post_count: number;
    comment_count: number;
    follower_count: number;
}

interface TrendingKeyword {
    keyword: string;
    score: number;
}

const SimpleSearchPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
    const [activeTab, setActiveTab] = useState(searchParams.get('type') || 'all');
    const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'relevance');
    const [results, setResults] = useState<SearchResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [trending, setTrending] = useState<TrendingKeyword[]>([]);
    const [suggestions, setSuggestions] = useState<string[]>([]);

    // 초기 검색 실행
    useEffect(() => {
        const q = searchParams.get('q');
        if (q) {
            setSearchQuery(q);
            handleSearch(q, activeTab, sortBy);
        }
        fetchTrending();
    }, []);

    // 인기 검색어 가져오기
    const fetchTrending = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/search-simple/trending?limit=10`);
            if (response.data.success) {
                setTrending(response.data.trending);
            }
        } catch (error) {
            console.error('Failed to fetch trending:', error);
        }
    };

    // 자동완성
    const fetchSuggestions = useCallback(
        async (query: string) => {
            if (!query || query.length < 2) {
                setSuggestions([]);
                return;
            }

            try {
                const response = await axios.get(
                    `${API_BASE_URL}/search-simple/autocomplete?q=${encodeURIComponent(query)}&limit=5`
                );
                if (response.data.success) {
                    setSuggestions(response.data.suggestions.map((s: any) => s.text));
                }
            } catch (error) {
                console.error('Failed to fetch suggestions:', error);
            }
        },
        []
    );

    // 검색 실행
    const handleSearch = async (query: string, type: string, sort: string) => {
        if (!query.trim()) {
            setError('검색어를 입력해주세요');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await axios.get(
                `${API_BASE_URL}/search-simple?q=${encodeURIComponent(query)}&type=${type}&sortBy=${sort}&limit=50`
            );

            if (response.data.success) {
                setResults(response.data.results);
                setSearchParams({ q: query, type, sort });
            }
        } catch (error: any) {
            console.error('Search error:', error);
            setError(error.response?.data?.message || '검색 중 오류가 발생했습니다');
        } finally {
            setLoading(false);
        }
    };

    // 검색 제출
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleSearch(searchQuery, activeTab, sortBy);
    };

    // 탭 변경
    const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
        setActiveTab(newValue);
        if (searchQuery) {
            handleSearch(searchQuery, newValue, sortBy);
        }
    };

    // 정렬 변경
    const handleSortChange = (event: any) => {
        const newSort = event.target.value;
        setSortBy(newSort);
        if (searchQuery) {
            handleSearch(searchQuery, activeTab, newSort);
        }
    };

    // 인기 검색어 클릭
    const handleTrendingClick = (keyword: string) => {
        setSearchQuery(keyword);
        handleSearch(keyword, activeTab, sortBy);
    };

    // 내용 하이라이트
    const highlightText = (text: string, query: string) => {
        if (!query) return text;
        const parts = text.split(new RegExp(`(${query})`, 'gi'));
        return parts.map((part, index) =>
            part.toLowerCase() === query.toLowerCase() ? (
                <mark key={index} style={{ backgroundColor: '#ffeb3b', padding: '2px' }}>
                    {part}
                </mark>
            ) : (
                part
            )
        );
    };

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            {/* 검색 입력 */}
            <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
                <form onSubmit={handleSubmit}>
                    <Autocomplete
                        freeSolo
                        options={suggestions}
                        value={searchQuery}
                        onInputChange={(event, newValue) => {
                            setSearchQuery(newValue);
                            fetchSuggestions(newValue);
                        }}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                fullWidth
                                placeholder="게시글, 댓글, 사용자 검색..."
                                variant="outlined"
                                InputProps={{
                                    ...params.InputProps,
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon />
                                        </InputAdornment>
                                    ),
                                    endAdornment: (
                                        <>
                                            {params.InputProps.endAdornment}
                                            {searchQuery && (
                                                <InputAdornment position="end">
                                                    <IconButton
                                                        onClick={() => {
                                                            setSearchQuery('');
                                                            setResults(null);
                                                        }}
                                                    >
                                                        <ClearIcon />
                                                    </IconButton>
                                                </InputAdornment>
                                            )}
                                        </>
                                    ),
                                }}
                            />
                        )}
                    />
                </form>

                {/* 탭 및 정렬 */}
                {results && (
                    <Box sx={{ mt: 2 }}>
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                            <Box sx={{ flex: '1 1 60%', minWidth: '300px' }}>
                                <Tabs value={activeTab} onChange={handleTabChange}>
                                    <Tab
                                        label={`전체 (${results.total})`}
                                        value="all"
                                        icon={<SearchIcon />}
                                        iconPosition="start"
                                    />
                                    <Tab
                                        label={`게시글 (${results.posts.length})`}
                                        value="posts"
                                        icon={<ArticleIcon />}
                                        iconPosition="start"
                                    />
                                    <Tab
                                        label={`댓글 (${results.comments.length})`}
                                        value="comments"
                                        icon={<CommentIcon />}
                                        iconPosition="start"
                                    />
                                    <Tab
                                        label={`사용자 (${results.users.length})`}
                                        value="users"
                                        icon={<PersonIcon />}
                                        iconPosition="start"
                                    />
                                </Tabs>
                            </Box>
                            <Box sx={{ flex: '1 1 30%', minWidth: '200px' }}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>정렬</InputLabel>
                                    <Select value={sortBy} label="정렬" onChange={handleSortChange}>
                                        <MenuItem value="relevance">관련성순</MenuItem>
                                        <MenuItem value="date">최신순</MenuItem>
                                        <MenuItem value="popularity">인기순</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>
                        </Box>
                    </Box>
                )}
            </Paper>

            {/* 에러 메시지 */}
            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {/* 로딩 */}
            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                </Box>
            )}

            {/* 검색 결과가 없을 때 - 인기 검색어 표시 */}
            {!loading && !results && trending.length > 0 && (
                <Paper elevation={2} sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                        <TrendingIcon sx={{ mr: 1 }} />
                        인기 검색어
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        {trending.map((item, index) => (
                            <Chip
                                key={index}
                                label={`${index + 1}. ${item.keyword}`}
                                onClick={() => handleTrendingClick(item.keyword)}
                                sx={{ mb: 1, cursor: 'pointer' }}
                            />
                        ))}
                    </Stack>
                </Paper>
            )}

            {/* 검색 결과 */}
            {!loading && results && (
                <>
                    {/* 게시글 결과 */}
                    {(activeTab === 'all' || activeTab === 'posts') && results.posts.length > 0 && (
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                게시글
                            </Typography>
                            <List>
                                {results.posts.map((post) => (
                                    <Card key={post.id} sx={{ mb: 2 }}>
                                        <CardActionArea onClick={() => navigate(`/posts/${post.id}`)}>
                                            <CardContent>
                                                <Typography variant="h6" gutterBottom>
                                                    {highlightText(post.title, searchQuery)}
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
                                                    {highlightText(post.content.slice(0, 200), searchQuery)}
                                                    {post.content.length > 200 && '...'}
                                                </Typography>
                                                <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                                                    <Stack direction="row" spacing={1} alignItems="center">
                                                        <Avatar
                                                            src={post.author_avatar_url}
                                                            alt={post.author_display_name}
                                                            sx={{ width: 24, height: 24 }}
                                                        />
                                                        <Typography variant="caption">
                                                            {post.author_display_name || post.author_username}
                                                        </Typography>
                                                    </Stack>
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
                            </List>
                        </Box>
                    )}

                    {/* 댓글 결과 */}
                    {(activeTab === 'all' || activeTab === 'comments') && results.comments.length > 0 && (
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                댓글
                            </Typography>
                            <List>
                                {results.comments.map((comment) => (
                                    <Card key={comment.id} sx={{ mb: 2 }}>
                                        <CardActionArea onClick={() => navigate(`/posts/${comment.post_id}`)}>
                                            <CardContent>
                                                <Stack direction="row" spacing={2} alignItems="flex-start">
                                                    <Avatar
                                                        src={comment.author_avatar_url}
                                                        alt={comment.author_display_name}
                                                    />
                                                    <Box flex={1}>
                                                        <Typography variant="body1" gutterBottom>
                                                            {highlightText(comment.content, searchQuery)}
                                                        </Typography>
                                                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                                                            <Typography variant="caption">
                                                                {comment.author_display_name || comment.author_username}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                •
                                                            </Typography>
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
                                                    </Box>
                                                </Stack>
                                            </CardContent>
                                        </CardActionArea>
                                    </Card>
                                ))}
                            </List>
                        </Box>
                    )}

                    {/* 사용자 결과 */}
                    {(activeTab === 'all' || activeTab === 'users') && results.users.length > 0 && (
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                사용자
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                {results.users.map((user) => (
                                    <Box key={user.id} sx={{ flex: '1 1 30%', minWidth: '280px' }}>
                                        <Card>
                                            <CardActionArea onClick={() => navigate(`/users/${user.id}`)}>
                                                <CardContent sx={{ textAlign: 'center' }}>
                                                    <Avatar
                                                        src={user.avatar_url}
                                                        alt={user.display_name}
                                                        sx={{ width: 64, height: 64, mx: 'auto', mb: 2 }}
                                                    />
                                                    <Typography variant="h6" gutterBottom>
                                                        {highlightText(user.display_name || user.username, searchQuery)}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                                        @{user.username}
                                                    </Typography>
                                                    {user.bio && (
                                                        <Typography
                                                            variant="caption"
                                                            color="text.secondary"
                                                            sx={{
                                                                display: '-webkit-box',
                                                                WebkitLineClamp: 2,
                                                                WebkitBoxOrient: 'vertical',
                                                                overflow: 'hidden',
                                                                mb: 1,
                                                            }}
                                                        >
                                                            {user.bio}
                                                        </Typography>
                                                    )}
                                                    <Divider sx={{ my: 1 }} />
                                                    <Stack direction="row" spacing={2} justifyContent="center">
                                                        <Box>
                                                            <Typography variant="caption" color="text.secondary">
                                                                게시글
                                                            </Typography>
                                                            <Typography variant="body2">{user.post_count}</Typography>
                                                        </Box>
                                                        <Box>
                                                            <Typography variant="caption" color="text.secondary">
                                                                댓글
                                                            </Typography>
                                                            <Typography variant="body2">{user.comment_count}</Typography>
                                                        </Box>
                                                        <Box>
                                                            <Typography variant="caption" color="text.secondary">
                                                                팔로워
                                                            </Typography>
                                                            <Typography variant="body2">{user.follower_count}</Typography>
                                                        </Box>
                                                    </Stack>
                                                </CardContent>
                                            </CardActionArea>
                                        </Card>
                                    </Box>
                                ))}
                            </Box>
                        </Box>
                    )}

                    {/* 결과 없음 */}
                    {results.posts.length === 0 &&
                        results.comments.length === 0 &&
                        results.users.length === 0 && (
                            <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
                                <Typography variant="h6" color="text.secondary">
                                    '{searchQuery}'에 대한 검색 결과가 없습니다
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                    다른 검색어를 입력해보세요
                                </Typography>
                            </Paper>
                        )}
                </>
            )}
        </Container>
    );
};

export default SimpleSearchPage;
