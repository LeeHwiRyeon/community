import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Card, CardContent, Chip, Button } from '@mui/material';
import VotingSystem from '../components/VotingSystem';

// 실제 데이터 타입 정의
interface Post {
    id: string;
    title: string;
    author: string;
    date: string;
    tag: string;
    category: string;
    thumb: string;
    board: string;
}

interface Board {
    id: string;
    title: string;
    order: number;
}

interface NewsItem {
    id: string;
    title: string;
    content: string;
    author: string;
    date: string;
    category: string;
}

const QuickContent: React.FC = () => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [boards, setBoards] = useState<Board[]>([]);
    const [news, setNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedBoard, setSelectedBoard] = useState<string>('all');

    // 실제 데이터 로딩
    useEffect(() => {
        const loadData = async () => {
            try {
                // 실제 데이터 파일들 로딩
                const [postsResponse, boardsResponse, newsResponse] = await Promise.all([
                    fetch('/data/posts.json'),
                    fetch('/data/boards.json'),
                    fetch('/data/news.json')
                ]);

                if (postsResponse.ok) {
                    const postsData = await postsResponse.json();
                    // posts.json 구조에 맞게 파싱
                    const allPosts: Post[] = [];
                    Object.keys(postsData).forEach(category => {
                        if (Array.isArray(postsData[category])) {
                            allPosts.push(...postsData[category]);
                        }
                    });
                    setPosts(allPosts);
                }

                if (boardsResponse.ok) {
                    const boardsData = await boardsResponse.json();
                    setBoards(boardsData);
                }

                if (newsResponse.ok) {
                    const newsData = await newsResponse.json();
                    setNews(Array.isArray(newsData) ? newsData : []);
                }

            } catch (error) {
                console.error('데이터 로딩 실패:', error);
                // 실패 시 모의 데이터 사용
                setPosts([
                    {
                        id: 'mock1',
                        title: '🚀 커뮤니티 플랫폼 v1.1 출시!',
                        author: 'AUTOAGENTS',
                        date: new Date().toISOString(),
                        tag: 'RELEASE',
                        category: 'announcement',
                        thumb: '',
                        board: 'news'
                    }
                ]);
                setBoards([
                    { id: 'news', title: '뉴스', order: 1 },
                    { id: 'free', title: '자유게시판', order: 2 }
                ]);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    // 게시판별 필터링
    const filteredPosts = selectedBoard === 'all'
        ? posts
        : posts.filter(post => post.board === selectedBoard);

    const handleBoardChange = (boardId: string) => {
        setSelectedBoard(boardId);
    };

    if (loading) {
        return (
            <Container maxWidth="lg">
                <Box sx={{ py: 4, textAlign: 'center' }}>
                    <Typography variant="h4">컨텐츠 로딩 중...</Typography>
                </Box>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg">
            <Box sx={{ py: 4 }}>
                {/* 헤더 */}
                <Box sx={{ mb: 4, textAlign: 'center' }}>
                    <Typography variant="h3" component="h1" gutterBottom>
                        🚀 빠른 컨텐츠 연결
                    </Typography>
                    <Typography variant="h6" color="text.secondary">
                        실제 데이터 연결 완료 - UI/UX보다 기능 우선!
                    </Typography>
                </Box>

                {/* 통계 */}
                <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
                    <Chip label={`총 게시글: ${posts.length}개`} color="primary" />
                    <Chip label={`게시판: ${boards.length}개`} color="secondary" />
                    <Chip label={`뉴스: ${news.length}개`} color="success" />
                </Box>

                {/* 게시판 필터 */}
                <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Button
                        variant={selectedBoard === 'all' ? 'contained' : 'outlined'}
                        onClick={() => handleBoardChange('all')}
                    >
                        전체 ({posts.length})
                    </Button>
                    {boards.map(board => (
                        <Button
                            key={board.id}
                            variant={selectedBoard === board.id ? 'contained' : 'outlined'}
                            onClick={() => handleBoardChange(board.id)}
                        >
                            {board.title} ({posts.filter(p => p.board === board.id).length})
                        </Button>
                    ))}
                </Box>

                {/* 컨텐츠 목록 */}
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 3 }}>
                    {filteredPosts.map((post) => (
                        <Card key={post.id} sx={{ height: '100%', cursor: 'pointer', '&:hover': { boxShadow: 4 } }}>
                            <CardContent>
                                <Box sx={{ mb: 2 }}>
                                    <Chip
                                        label={post.tag}
                                        size="small"
                                        color="primary"
                                        sx={{ mb: 1 }}
                                    />
                                    <Chip
                                        label={boards.find(b => b.id === post.board)?.title || post.board}
                                        size="small"
                                        variant="outlined"
                                        sx={{ mb: 1, ml: 1 }}
                                    />
                                </Box>

                                <Typography variant="h6" component="h3" gutterBottom>
                                    {post.title}
                                </Typography>

                                {/* 투표 시스템 통합 */}
                                <Box sx={{ my: 2 }}>
                                    <VotingSystem postId={post.id} type="simple" />
                                </Box>

                                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="body2" color="text.secondary">
                                        {post.author}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {new Date(post.date).toLocaleDateString('ko-KR')}
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    ))}
                </Box>

                {/* 빈 상태 */}
                {filteredPosts.length === 0 && (
                    <Box sx={{ textAlign: 'center', py: 8 }}>
                        <Typography variant="h5" color="text.secondary">
                            선택한 게시판에 게시글이 없습니다.
                        </Typography>
                    </Box>
                )}

                {/* 뉴스 섹션 */}
                {news.length > 0 && (
                    <Box sx={{ mt: 6 }}>
                        <Typography variant="h4" gutterBottom>
                            📰 최신 뉴스
                        </Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
                            {news.slice(0, 3).map((newsItem) => (
                                <Card key={newsItem.id}>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom>
                                            {newsItem.title}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {newsItem.content?.substring(0, 100)}...
                                        </Typography>
                                        <Box sx={{ mt: 2 }}>
                                            <Typography variant="caption">
                                                {newsItem.author} • {new Date(newsItem.date).toLocaleDateString('ko-KR')}
                                            </Typography>
                                        </Box>
                                    </CardContent>
                                </Card>
                            ))}
                        </Box>
                    </Box>
                )}

                {/* 푸터 */}
                <Box sx={{ mt: 6, p: 3, bgcolor: 'grey.100', borderRadius: 2, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                        💡 실제 데이터 연결 완료! data/posts.json, data/boards.json, data/news.json 사용
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        🚀 다음 단계: v1.1 패치 → 문서 정리 → 파일 정리 → 깔끔한 상태 유지
                    </Typography>
                </Box>
            </Box>
        </Container>
    );
};

export default QuickContent;
