/**
 * 📰 뉴스 관리자 컴포넌트
 * 
 * 뉴스 생성, 편집, 삭제, 카테고리 관리 기능
 * 
 * @author AUTOAGENTS Manager
 * @version 3.0.0
 * @created 2025-01-02
 */

import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    CardActions,
    Button,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Chip,
    Grid,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    CircularProgress,
    Tabs,
    Tab,
    Paper,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    Divider
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Visibility as ViewIcon,
    Category as CategoryIcon,
    TrendingUp as TrendingIcon,
    Schedule as ScheduleIcon,
    Public as PublicIcon
} from '@mui/icons-material';

interface NewsArticle {
    id: string;
    title: string;
    content: string;
    category: string;
    author: string;
    publishDate: string;
    status: 'draft' | 'published' | 'archived';
    tags: string[];
    views: number;
    likes: number;
    comments: number;
    featured: boolean;
    imageUrl?: string;
}

interface NewsCategory {
    id: string;
    name: string;
    description: string;
    color: string;
    articleCount: number;
}

const NewsManager: React.FC = () => {
    const [articles, setArticles] = useState<NewsArticle[]>([]);
    const [categories, setCategories] = useState<NewsCategory[]>([]);
    const [selectedTab, setSelectedTab] = useState(0);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingArticle, setEditingArticle] = useState<NewsArticle | null>(null);
    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // 폼 상태
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        category: '',
        tags: [] as string[],
        featured: false,
        imageUrl: ''
    });

    // 초기 데이터 로드
    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = () => {
        // 모의 데이터
        const mockCategories: NewsCategory[] = [
            { id: '1', name: '게임 뉴스', description: '최신 게임 소식', color: '#3b82f6', articleCount: 15 },
            { id: '2', name: '기술 뉴스', description: 'IT 기술 동향', color: '#10b981', articleCount: 8 },
            { id: '3', name: '커뮤니티', description: '커뮤니티 소식', color: '#f59e0b', articleCount: 12 },
            { id: '4', name: '이벤트', description: '특별 이벤트', color: '#ef4444', articleCount: 5 }
        ];

        const mockArticles: NewsArticle[] = [
            {
                id: '1',
                title: '새로운 게임 출시 소식',
                content: '최신 게임이 출시되었습니다...',
                category: '게임 뉴스',
                author: '관리자',
                publishDate: '2025-01-02',
                status: 'published',
                tags: ['게임', '출시', '신작'],
                views: 1250,
                likes: 89,
                comments: 23,
                featured: true,
                imageUrl: '/images/game-news.jpg'
            },
            {
                id: '2',
                title: '커뮤니티 업데이트 안내',
                content: '커뮤니티 기능이 업데이트되었습니다...',
                category: '커뮤니티',
                author: '관리자',
                publishDate: '2025-01-01',
                status: 'published',
                tags: ['업데이트', '커뮤니티'],
                views: 890,
                likes: 45,
                comments: 12,
                featured: false
            }
        ];

        setCategories(mockCategories);
        setArticles(mockArticles);
    };

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setSelectedTab(newValue);
    };

    const handleOpenDialog = (article?: NewsArticle) => {
        if (article) {
            setEditingArticle(article);
            setFormData({
                title: article.title,
                content: article.content,
                category: article.category,
                tags: article.tags,
                featured: article.featured,
                imageUrl: article.imageUrl || ''
            });
        } else {
            setEditingArticle(null);
            setFormData({
                title: '',
                content: '',
                category: '',
                tags: [],
                featured: false,
                imageUrl: ''
            });
        }
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
        setEditingArticle(null);
        setFormData({
            title: '',
            content: '',
            category: '',
            tags: [],
            featured: false,
            imageUrl: ''
        });
    };

    const handleSaveArticle = async () => {
        setLoading(true);
        try {
            // 실제 구현에서는 API 호출
            await new Promise(resolve => setTimeout(resolve, 1000));

            if (editingArticle) {
                // 편집
                setArticles(prev => prev.map(article =>
                    article.id === editingArticle.id
                        ? { ...article, ...formData, publishDate: new Date().toISOString().split('T')[0] }
                        : article
                ));
                setAlert({ type: 'success', message: '뉴스가 성공적으로 수정되었습니다.' });
            } else {
                // 새로 생성
                const newArticle: NewsArticle = {
                    id: Date.now().toString(),
                    ...formData,
                    author: '관리자',
                    publishDate: new Date().toISOString().split('T')[0],
                    status: 'published',
                    views: 0,
                    likes: 0,
                    comments: 0
                };
                setArticles(prev => [newArticle, ...prev]);
                setAlert({ type: 'success', message: '새 뉴스가 성공적으로 생성되었습니다.' });
            }

            handleCloseDialog();
        } catch (error) {
            setAlert({ type: 'error', message: '오류가 발생했습니다.' });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteArticle = async (id: string) => {
        if (window.confirm('정말로 이 뉴스를 삭제하시겠습니까?')) {
            setLoading(true);
            try {
                await new Promise(resolve => setTimeout(resolve, 500));
                setArticles(prev => prev.filter(article => article.id !== id));
                setAlert({ type: 'success', message: '뉴스가 삭제되었습니다.' });
            } catch (error) {
                setAlert({ type: 'error', message: '삭제 중 오류가 발생했습니다.' });
            } finally {
                setLoading(false);
            }
        }
    };

    const handleToggleFeatured = async (id: string) => {
        setLoading(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 300));
            setArticles(prev => prev.map(article =>
                article.id === id
                    ? { ...article, featured: !article.featured }
                    : article
            ));
            setAlert({ type: 'success', message: '추천 상태가 변경되었습니다.' });
        } catch (error) {
            setAlert({ type: 'error', message: '상태 변경 중 오류가 발생했습니다.' });
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'published': return '#10b981';
            case 'draft': return '#f59e0b';
            case 'archived': return '#6b7280';
            default: return '#6b7280';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'published': return '발행됨';
            case 'draft': return '초안';
            case 'archived': return '보관됨';
            default: return status;
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom sx={{ mb: 3, color: '#2d3748' }}>
                📰 뉴스 관리자
            </Typography>

            {alert && (
                <Alert
                    severity={alert.type}
                    onClose={() => setAlert(null)}
                    sx={{ mb: 2 }}
                >
                    {alert.message}
                </Alert>
            )}

            <Paper sx={{ mb: 3 }}>
                <Tabs value={selectedTab} onChange={handleTabChange}>
                    <Tab label="뉴스 목록" />
                    <Tab label="카테고리 관리" />
                    <Tab label="통계" />
                </Tabs>
            </Paper>

            {selectedTab === 0 && (
                <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h6">뉴스 기사 ({articles.length}개)</Typography>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => handleOpenDialog()}
                            sx={{
                                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                                '&:hover': {
                                    background: 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)'
                                }
                            }}
                        >
                            새 뉴스 작성
                        </Button>
                    </Box>

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                        {articles.map((article) => (
                            <Box sx={{ flex: '1 1 300px', minWidth: 300 }} key={article.id}>
                                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                    {article.imageUrl && (
                                        <Box
                                            sx={{
                                                height: 200,
                                                backgroundImage: `url(${article.imageUrl})`,
                                                backgroundSize: 'cover',
                                                backgroundPosition: 'center'
                                            }}
                                        />
                                    )}
                                    <CardContent sx={{ flexGrow: 1 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                            <Chip
                                                label={article.category}
                                                size="small"
                                                sx={{
                                                    mr: 1,
                                                    backgroundColor: categories.find(c => c.name === article.category)?.color || '#6b7280',
                                                    color: 'white'
                                                }}
                                            />
                                            {article.featured && (
                                                <Chip
                                                    label="추천"
                                                    size="small"
                                                    color="primary"
                                                    icon={<TrendingIcon />}
                                                />
                                            )}
                                        </Box>
                                        <Typography variant="h6" gutterBottom>
                                            {article.title}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                            {article.content.substring(0, 100)}...
                                        </Typography>
                                        <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                                            {article.tags.map((tag, index) => (
                                                <Chip key={index} label={tag} size="small" variant="outlined" />
                                            ))}
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: '0.875rem', color: 'text.secondary' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <ViewIcon fontSize="small" />
                                                {article.views}
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                👍 {article.likes}
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                💬 {article.comments}
                                            </Box>
                                        </Box>
                                    </CardContent>
                                    <CardActions>
                                        <Button size="small" startIcon={<ViewIcon />}>
                                            보기
                                        </Button>
                                        <Button size="small" startIcon={<EditIcon />} onClick={() => handleOpenDialog(article)}>
                                            편집
                                        </Button>
                                        <Button
                                            size="small"
                                            color={article.featured ? 'primary' : 'inherit'}
                                            onClick={() => handleToggleFeatured(article.id)}
                                        >
                                            {article.featured ? '추천 해제' : '추천'}
                                        </Button>
                                        <IconButton
                                            size="small"
                                            color="error"
                                            onClick={() => handleDeleteArticle(article.id)}
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </CardActions>
                                </Card>
                            </Box>
                        ))}
                    </Box>
                </Box>
            )}

            {selectedTab === 1 && (
                <Box>
                    <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                        카테고리 관리
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                        {categories.map((category) => (
                            <Box sx={{ flex: '1 1 250px', minWidth: 250 }} key={category.id}>
                                <Card>
                                    <CardContent>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                            <Box
                                                sx={{
                                                    width: 12,
                                                    height: 12,
                                                    borderRadius: '50%',
                                                    backgroundColor: category.color,
                                                    mr: 1
                                                }}
                                            />
                                            <Typography variant="h6">{category.name}</Typography>
                                        </Box>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                            {category.description}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            기사 수: {category.articleCount}개
                                        </Typography>
                                    </CardContent>
                                    <CardActions>
                                        <Button size="small" startIcon={<EditIcon />}>
                                            편집
                                        </Button>
                                        <IconButton size="small" color="error">
                                            <DeleteIcon />
                                        </IconButton>
                                    </CardActions>
                                </Card>
                            </Box>
                        ))}
                    </Box>
                </Box>
            )}

            {selectedTab === 2 && (
                <Box>
                    <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                        뉴스 통계
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                        <Box sx={{ flex: '1 1 250px', minWidth: 250 }}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h4" color="primary">
                                        {articles.length}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        총 뉴스 수
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Box>
                        <Box sx={{ flex: '1 1 250px', minWidth: 250 }}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h4" color="success.main">
                                        {articles.filter(a => a.status === 'published').length}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        발행된 뉴스
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Box>
                        <Box sx={{ flex: '1 1 250px', minWidth: 250 }}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h4" color="warning.main">
                                        {articles.filter(a => a.featured).length}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        추천 뉴스
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Box>
                        <Box sx={{ flex: '1 1 250px', minWidth: 250 }}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h4" color="info.main">
                                        {articles.reduce((sum, article) => sum + article.views, 0)}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        총 조회수
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Box>
                    </Box>
                </Box>
            )}

            {/* 뉴스 편집 다이얼로그 */}
            <Dialog open={isDialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                <DialogTitle>
                    {editingArticle ? '뉴스 편집' : '새 뉴스 작성'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2 }}>
                        <TextField
                            fullWidth
                            label="제목"
                            value={formData.title}
                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                            sx={{ mb: 2 }}
                        />
                        <FormControl fullWidth sx={{ mb: 2 }}>
                            <InputLabel>카테고리</InputLabel>
                            <Select
                                value={formData.category}
                                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                            >
                                {categories.map((category) => (
                                    <MenuItem key={category.id} value={category.name}>
                                        {category.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <TextField
                            fullWidth
                            label="내용"
                            multiline
                            rows={6}
                            value={formData.content}
                            onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                            sx={{ mb: 2 }}
                        />
                        <TextField
                            fullWidth
                            label="이미지 URL"
                            value={formData.imageUrl}
                            onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                            sx={{ mb: 2 }}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>취소</Button>
                    <Button
                        onClick={handleSaveArticle}
                        variant="contained"
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={20} /> : null}
                    >
                        {loading ? '저장 중...' : '저장'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default NewsManager;
