import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Breadcrumbs,
  Link
} from '@mui/material';
import GameList from './components/GameList';
import GameBoard from './components/GameBoard';
import { GamePageService } from '../../services/gamepageService';
import PageLayout from '../../components/common/PageLayout';

interface GamePagePageProps {
  // 페이지별 props 정의
}

interface BreadcrumbItem {
  label: string;
  href?: string;
}

const GamePagePage: React.FC<GamePagePageProps> = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  const navigate = useNavigate();
  const params = useParams();

  // 브레드크럼 설정
  const breadcrumbs: BreadcrumbItem[] = [
    { label: '홈', href: '/' },
    { label: '게임 커뮤니티', href: '/gamepage' }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await GamePageService.getData();
      setData(result);
    } catch (err: any) {
      setError(err.message || '데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadData();
  };

  const handleAction = (action: string, item: any) => {
    console.log('Action:', action, item);
  };

  const handleSearch = (query: string) => {
    console.log('Search:', query);
  };

  const handlePageChange = (page: number) => {
    console.log('Page change:', page);
  };

  if (loading) {
    return (
      <PageLayout title="게임 커뮤니티" description="게임 정보와 커뮤니티를 만나보세요">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout title="게임 커뮤니티" description="게임 정보와 커뮤니티를 만나보세요">
        <Alert severity="error" action={
          <button onClick={handleRefresh}>다시 시도</button>
        }>
          {error}
        </Alert>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="게임 커뮤니티"
      description="게임 정보와 커뮤니티를 만나보세요"
      breadcrumbs={breadcrumbs}
    >
      <Container maxWidth="lg">
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            게임 커뮤니티
          </Typography>
          <Typography variant="body1" color="text.secondary">
            게임 정보와 커뮤니티를 만나보세요
          </Typography>
        </Box>

        {/* 페이지별 컨텐츠 */}

        <GameList
          data={data?.games}
          onAction={handleAction}
          loading={loading}
        />

        <GameBoard
          data={data?.boards}
          onAction={handleAction}
          loading={loading}
        />


        {/* 검색 기능 */}
        <Box sx={{ mt: 4 }}>
          <input
            type="text"
            placeholder="게임 커뮤니티 검색..."
            onChange={(e) => handleSearch(e.target.value)}
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
          />
        </Box>


        {/* 페이지네이션 */}
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={() => handlePageChange(1)}
            style={{ padding: '8px 16px', margin: '0 4px', border: '1px solid #ccc', borderRadius: '4px' }}
          >
            이전
          </button>
          <span style={{ padding: '8px 16px' }}>1 / 1</span>
          <button
            onClick={() => handlePageChange(2)}
            style={{ padding: '8px 16px', margin: '0 4px', border: '1px solid #ccc', borderRadius: '4px' }}
          >
            다음
          </button>
        </Box>
      </Container>
    </PageLayout>
  );
};

export default GamePagePage;