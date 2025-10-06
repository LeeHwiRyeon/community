/**
 * AI 감정 분석 시스템 (v1.3)
 * 실시간 감정 분석 및 대응 시스템
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
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
  Badge
} from '@mui/material';
import {
  Psychology,
  SentimentSatisfied,
  SentimentDissatisfied,
  SentimentNeutral,
  TrendingUp,
  TrendingDown,
  Refresh,
  Settings,
  Visibility,
  Analytics,
  Warning,
  CheckCircle,
  Error
} from '@mui/icons-material';

// 감정 분석 데이터 타입
interface EmotionAnalysis {
  id: string;
  text: string;
  emotion: string;
  confidence: number;
  timestamp: Date;
  sentiment: 'positive' | 'negative' | 'neutral';
  intensity: number;
}

interface EmotionStats {
  totalAnalyzed: number;
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  averageConfidence: number;
  topEmotions: { emotion: string; count: number }[];
}

const AIEmotionAnalysisSystem: React.FC = () => {
  const [emotions, setEmotions] = useState<EmotionAnalysis[]>([]);
  const [stats, setStats] = useState<EmotionStats>({
    totalAnalyzed: 0,
    positiveCount: 0,
    negativeCount: 0,
    neutralCount: 0,
    averageConfidence: 0,
    topEmotions: []
  });
  const [loading, setLoading] = useState(false);
  const [inputText, setInputText] = useState('');

  useEffect(() => {
    loadEmotionData();
  }, []);

  const loadEmotionData = async () => {
    setLoading(true);
    try {
      // 모의 감정 분석 데이터
      const mockEmotions: EmotionAnalysis[] = [
        {
          id: '1',
          text: '오늘 정말 좋은 하루였어요!',
          emotion: 'joy',
          confidence: 0.95,
          timestamp: new Date(),
          sentiment: 'positive',
          intensity: 0.9
        },
        {
          id: '2',
          text: '이 상황이 너무 스트레스예요',
          emotion: 'stress',
          confidence: 0.87,
          timestamp: new Date(Date.now() - 300000),
          sentiment: 'negative',
          intensity: 0.7
        },
        {
          id: '3',
          text: '보통 정도의 기분이에요',
          emotion: 'neutral',
          confidence: 0.72,
          timestamp: new Date(Date.now() - 600000),
          sentiment: 'neutral',
          intensity: 0.5
        }
      ];
      setEmotions(mockEmotions);
      updateStats(mockEmotions);
    } catch (error) {
      console.error('감정 데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStats = (emotionData: EmotionAnalysis[]) => {
    const total = emotionData.length;
    const positive = emotionData.filter(e => e.sentiment === 'positive').length;
    const negative = emotionData.filter(e => e.sentiment === 'negative').length;
    const neutral = emotionData.filter(e => e.sentiment === 'neutral').length;
    const avgConfidence = emotionData.reduce((sum, e) => sum + e.confidence, 0) / total;

    const emotionCounts: { [key: string]: number } = {};
    emotionData.forEach(e => {
      emotionCounts[e.emotion] = (emotionCounts[e.emotion] || 0) + 1;
    });

    const topEmotions = Object.entries(emotionCounts)
      .map(([emotion, count]) => ({ emotion, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    setStats({
      totalAnalyzed: total,
      positiveCount: positive,
      negativeCount: negative,
      neutralCount: neutral,
      averageConfidence: avgConfidence,
      topEmotions
    });
  };

  const analyzeText = async () => {
    if (!inputText.trim()) return;

    setLoading(true);
    try {
      // 모의 감정 분석
      const mockAnalysis: EmotionAnalysis = {
        id: Date.now().toString(),
        text: inputText,
        emotion: 'joy',
        confidence: Math.random() * 0.3 + 0.7,
        timestamp: new Date(),
        sentiment: Math.random() > 0.5 ? 'positive' : 'negative',
        intensity: Math.random()
      };

      setEmotions(prev => [mockAnalysis, ...prev]);
      updateStats([mockAnalysis, ...emotions]);
      setInputText('');
    } catch (error) {
      console.error('감정 분석 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEmotionIcon = (emotion: string) => {
    switch (emotion) {
      case 'joy': return <SentimentSatisfied color="success" />;
      case 'sadness': return <SentimentDissatisfied color="error" />;
      case 'neutral': return <SentimentNeutral color="info" />;
      default: return <Psychology />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'success';
      case 'negative': return 'error';
      case 'neutral': return 'info';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        😊 AI 감정 분석 시스템
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        실시간 감정 분석 및 대응 시스템으로 사용자의 감정을 이해하고 적절한 응답을 제공합니다
      </Typography>

      {/* 감정 분석 입력 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            텍스트 감정 분석
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              fullWidth
              label="분석할 텍스트를 입력하세요"
              multiline
              rows={3}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            <Button
              variant="contained"
              onClick={analyzeText}
              disabled={loading || !inputText.trim()}
              sx={{ minWidth: 120 }}
            >
              {loading ? <CircularProgress size={24} /> : '분석'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* 감정 통계 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <SentimentSatisfied sx={{ mr: 1, color: 'success.main' }} />
                <Typography variant="h6">긍정적</Typography>
              </Box>
              <Typography variant="h4" color="success.main">
                {stats.positiveCount}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {stats.totalAnalyzed > 0 ? Math.round((stats.positiveCount / stats.totalAnalyzed) * 100) : 0}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <SentimentDissatisfied sx={{ mr: 1, color: 'error.main' }} />
                <Typography variant="h6">부정적</Typography>
              </Box>
              <Typography variant="h4" color="error.main">
                {stats.negativeCount}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {stats.totalAnalyzed > 0 ? Math.round((stats.negativeCount / stats.totalAnalyzed) * 100) : 0}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <SentimentNeutral sx={{ mr: 1, color: 'info.main' }} />
                <Typography variant="h6">중립적</Typography>
              </Box>
              <Typography variant="h4" color="info.main">
                {stats.neutralCount}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {stats.totalAnalyzed > 0 ? Math.round((stats.neutralCount / stats.totalAnalyzed) * 100) : 0}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Analytics sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">평균 신뢰도</Typography>
              </Box>
              <Typography variant="h4" color="primary.main">
                {Math.round(stats.averageConfidence * 100)}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                분석 정확도
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 감정 분석 결과 */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">감정 분석 결과</Typography>
            <IconButton onClick={loadEmotionData}>
              <Refresh />
            </IconButton>
          </Box>

          <List>
            {emotions.map((emotion, index) => (
              <React.Fragment key={emotion.id}>
                <ListItem>
                  <ListItemIcon>
                    {getEmotionIcon(emotion.emotion)}
                  </ListItemIcon>
                  <ListItemText
                    primary={emotion.text}
                    secondary={`${emotion.timestamp.toLocaleString()} • ${emotion.emotion}`}
                  />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                      label={emotion.sentiment}
                      color={getSentimentColor(emotion.sentiment)}
                      size="small"
                    />
                    <Typography variant="body2" color="text.secondary">
                      {Math.round(emotion.confidence * 100)}%
                    </Typography>
                  </Box>
                </ListItem>
                {index < emotions.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AIEmotionAnalysisSystem;