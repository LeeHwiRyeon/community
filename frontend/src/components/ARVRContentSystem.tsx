/**
 * AR/VR 콘텐츠 시스템 (v1.3)
 * WebXR 기반 몰입형 경험 제공
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  LinearProgress,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  ViewInAr,
  PlayArrow,
  Pause,
  Stop,
  Refresh,
  Settings,
  Visibility,
  Download,
  Share,
  Favorite,
  FavoriteBorder,
  VolumeUp,
  VolumeOff,
  Fullscreen,
  FullscreenExit
} from '@mui/icons-material';

// AR/VR 콘텐츠 데이터 타입
interface ARVRContent {
  id: string;
  title: string;
  description: string;
  type: 'ar' | 'vr' | 'mixed';
  thumbnail: string;
  duration: number;
  views: number;
  likes: number;
  isLiked: boolean;
  category: string;
  tags: string[];
  createdAt: Date;
  creator: string;
  status: 'active' | 'draft' | 'archived';
}

interface ARVRStats {
  totalContent: number;
  arContent: number;
  vrContent: number;
  mixedContent: number;
  totalViews: number;
  totalLikes: number;
  averageDuration: number;
}

const ARVRContentSystem: React.FC = () => {
  const [contents, setContents] = useState<ARVRContent[]>([]);
  const [stats, setStats] = useState<ARVRStats>({
    totalContent: 0,
    arContent: 0,
    vrContent: 0,
    mixedContent: 0,
    totalViews: 0,
    totalLikes: 0,
    averageDuration: 0
  });
  const [loading, setLoading] = useState(false);
  const [selectedContent, setSelectedContent] = useState<ARVRContent | null>(null);
  const [showPlayer, setShowPlayer] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadARVRContent();
  }, []);

  const loadARVRContent = async () => {
    setLoading(true);
    try {
      // 모의 AR/VR 콘텐츠 데이터
      const mockContents: ARVRContent[] = [
        {
          id: '1',
          title: '가상 갤러리 투어',
          description: '3D 가상 갤러리에서 작품을 감상하세요',
          type: 'vr',
          thumbnail: '/api/placeholder/300/200',
          duration: 300,
          views: 1250,
          likes: 89,
          isLiked: false,
          category: 'art',
          tags: ['gallery', 'art', 'culture'],
          createdAt: new Date(),
          creator: 'VR Artist',
          status: 'active'
        },
        {
          id: '2',
          title: 'AR 가구 배치',
          description: '실제 공간에 가구를 AR로 배치해보세요',
          type: 'ar',
          thumbnail: '/api/placeholder/300/200',
          duration: 180,
          views: 890,
          likes: 45,
          isLiked: true,
          category: 'design',
          tags: ['furniture', 'interior', 'design'],
          createdAt: new Date(Date.now() - 86400000),
          creator: 'AR Designer',
          status: 'active'
        },
        {
          id: '3',
          title: '혼합현실 미팅',
          description: 'AR과 VR을 결합한 혁신적인 미팅 공간',
          type: 'mixed',
          thumbnail: '/api/placeholder/300/200',
          duration: 600,
          views: 2100,
          likes: 156,
          isLiked: false,
          category: 'business',
          tags: ['meeting', 'collaboration', 'innovation'],
          createdAt: new Date(Date.now() - 172800000),
          creator: 'MR Developer',
          status: 'active'
        }
      ];
      setContents(mockContents);
      updateStats(mockContents);
    } catch (error) {
      console.error('AR/VR 콘텐츠 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStats = (contentData: ARVRContent[]) => {
    const total = contentData.length;
    const ar = contentData.filter(c => c.type === 'ar').length;
    const vr = contentData.filter(c => c.type === 'vr').length;
    const mixed = contentData.filter(c => c.type === 'mixed').length;
    const totalViews = contentData.reduce((sum, c) => sum + c.views, 0);
    const totalLikes = contentData.reduce((sum, c) => sum + c.likes, 0);
    const avgDuration = contentData.reduce((sum, c) => sum + c.duration, 0) / total;

    setStats({
      totalContent: total,
      arContent: ar,
      vrContent: vr,
      mixedContent: mixed,
      totalViews,
      totalLikes,
      averageDuration: avgDuration
    });
  };

  const handlePlayContent = (content: ARVRContent) => {
    setSelectedContent(content);
    setShowPlayer(true);
  };

  const handleLikeContent = (contentId: string) => {
    setContents(prev => prev.map(content =>
      content.id === contentId
        ? {
          ...content,
          isLiked: !content.isLiked,
          likes: content.isLiked ? content.likes - 1 : content.likes + 1
        }
        : content
    ));
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'ar': return <ViewInAr color="primary" />;
      case 'vr': return <ViewInAr color="secondary" />;
      case 'mixed': return <ViewInAr color="success" />;
      default: return <ViewInAr />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'ar': return 'primary';
      case 'vr': return 'secondary';
      case 'mixed': return 'success';
      default: return 'default';
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const filteredContents = contents.filter(content => {
    if (filter === 'all') return true;
    return content.type === filter;
  });

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        🥽 AR/VR 콘텐츠 시스템
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        WebXR 기반 몰입형 경험을 제공하는 AR/VR 콘텐츠 플랫폼
      </Typography>

      {/* 통계 카드 */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 3, mb: 3 }}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <ViewInAr sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">전체 콘텐츠</Typography>
            </Box>
            <Typography variant="h4" color="primary.main">
              {stats.totalContent}
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <ViewInAr sx={{ mr: 1, color: 'success.main' }} />
              <Typography variant="h6">AR 콘텐츠</Typography>
            </Box>
            <Typography variant="h4" color="success.main">
              {stats.arContent}
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <ViewInAr sx={{ mr: 1, color: 'secondary.main' }} />
              <Typography variant="h6">VR 콘텐츠</Typography>
            </Box>
            <Typography variant="h4" color="secondary.main">
              {stats.vrContent}
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <ViewInAr sx={{ mr: 1, color: 'warning.main' }} />
              <Typography variant="h6">혼합현실</Typography>
            </Box>
            <Typography variant="h4" color="warning.main">
              {stats.mixedContent}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* 필터 및 액션 */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>타입</InputLabel>
          <Select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            label="타입"
          >
            <MenuItem value="all">전체</MenuItem>
            <MenuItem value="ar">AR</MenuItem>
            <MenuItem value="vr">VR</MenuItem>
            <MenuItem value="mixed">혼합현실</MenuItem>
          </Select>
        </FormControl>

        <IconButton onClick={loadARVRContent} disabled={loading}>
          <Refresh />
        </IconButton>
      </Box>

      {/* 콘텐츠 그리드 */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 3 }}>
          {filteredContents.map((content) => (
            <Card
              key={content.id}
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 3
                }
              }}
            >
              <Box
                component="img"
                src={content.thumbnail}
                alt={content.title}
                sx={{
                  width: '100%',
                  height: 200,
                  objectFit: 'cover'
                }}
              />

              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  {getTypeIcon(content.type)}
                  <Typography variant="h6" component="h2" sx={{ ml: 1, flexGrow: 1 }}>
                    {content.title}
                  </Typography>
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {content.description}
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Chip
                    label={content.type.toUpperCase()}
                    color={getTypeColor(content.type)}
                    size="small"
                  />
                  <Chip
                    label={content.category}
                    size="small"
                    variant="outlined"
                  />
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    {formatDuration(content.duration)}
                  </Typography>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <IconButton
                      size="small"
                      onClick={() => handleLikeContent(content.id)}
                      color={content.isLiked ? 'error' : 'default'}
                    >
                      {content.isLiked ? <Favorite /> : <FavoriteBorder />}
                    </IconButton>
                    <Typography variant="body2">{content.likes}</Typography>
                  </Box>
                </Box>

                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<PlayArrow />}
                  onClick={() => handlePlayContent(content)}
                  sx={{ mt: 2 }}
                >
                  재생
                </Button>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* AR/VR 플레이어 다이얼로그 */}
      <Dialog
        open={showPlayer}
        onClose={() => setShowPlayer(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          {selectedContent?.title}
          <IconButton
            onClick={() => setShowPlayer(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <Stop />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedContent && (
            <Box sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="h6" gutterBottom>
                {selectedContent.type.toUpperCase()} 플레이어
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                WebXR 기반 몰입형 경험을 시작합니다
              </Typography>

              <Box sx={{
                width: '100%',
                height: 400,
                bgcolor: 'grey.100',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 2,
                mb: 2
              }}>
                <Typography variant="h6" color="text.secondary">
                  AR/VR 플레이어 영역
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button variant="contained" startIcon={<PlayArrow />}>
                  재생
                </Button>
                <Button variant="outlined" startIcon={<Pause />}>
                  일시정지
                </Button>
                <Button variant="outlined" startIcon={<Fullscreen />}>
                  전체화면
                </Button>
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default ARVRContentSystem;