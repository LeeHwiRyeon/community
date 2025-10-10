/**
 * AI 예측 분석 시스템 (v1.3)
 * AI 기반 사용자 행동 및 트렌드 예측
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
  Grid,
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
  TrendingUp,
  Analytics,
  Psychology,
  Timeline,
  Refresh,
  Settings,
  Visibility,
  Warning,
  CheckCircle,
  Error,
  Speed,
  Memory,
  NetworkCheck,
  Assessment
} from '@mui/icons-material';

// 예측 분석 데이터 타입
interface PredictionData {
  id: string;
  type: 'user_behavior' | 'trend' | 'performance' | 'security';
  title: string;
  description: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high' | 'critical';
  timeframe: string;
  status: 'active' | 'completed' | 'failed';
  createdAt: Date;
  predictions: PredictionItem[];
}

interface PredictionItem {
  metric: string;
  currentValue: number;
  predictedValue: number;
  change: number;
  changePercent: number;
}

interface AnalyticsStats {
  totalPredictions: number;
  activePredictions: number;
  averageConfidence: number;
  highImpactPredictions: number;
  accuracy: number;
}

const AIPredictiveAnalytics: React.FC = () => {
  const [predictions, setPredictions] = useState<PredictionData[]>([]);
  const [stats, setStats] = useState<AnalyticsStats>({
    totalPredictions: 0,
    activePredictions: 0,
    averageConfidence: 0,
    highImpactPredictions: 0,
    accuracy: 0
  });
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadPredictions();
  }, []);

  const loadPredictions = async () => {
    setLoading(true);
    try {
      // 모의 예측 분석 데이터
      const mockPredictions: PredictionData[] = [
        {
          id: '1',
          type: 'user_behavior',
          title: '사용자 참여도 증가 예측',
          description: '다음 주 사용자 참여도가 15% 증가할 것으로 예측됩니다',
          confidence: 0.87,
          impact: 'high',
          timeframe: '7일',
          status: 'active',
          createdAt: new Date(),
          predictions: [
            {
              metric: '일일 활성 사용자',
              currentValue: 1250,
              predictedValue: 1437,
              change: 187,
              changePercent: 15.0
            },
            {
              metric: '평균 세션 시간',
              currentValue: 8.5,
              predictedValue: 9.8,
              change: 1.3,
              changePercent: 15.3
            }
          ]
        },
        {
          id: '2',
          type: 'trend',
          title: '콘텐츠 트렌드 분석',
          description: 'AR/VR 콘텐츠에 대한 관심도가 급증할 것으로 예측됩니다',
          confidence: 0.92,
          impact: 'medium',
          timeframe: '30일',
          status: 'active',
          createdAt: new Date(Date.now() - 86400000),
          predictions: [
            {
              metric: 'AR 콘텐츠 조회수',
              currentValue: 890,
              predictedValue: 1200,
              change: 310,
              changePercent: 34.8
            },
            {
              metric: 'VR 콘텐츠 조회수',
              currentValue: 650,
              predictedValue: 950,
              change: 300,
              changePercent: 46.2
            }
          ]
        },
        {
          id: '3',
          type: 'performance',
          title: '시스템 성능 최적화 필요',
          description: '서버 부하가 증가하여 성능 최적화가 필요할 것으로 예측됩니다',
          confidence: 0.78,
          impact: 'critical',
          timeframe: '14일',
          status: 'active',
          createdAt: new Date(Date.now() - 172800000),
          predictions: [
            {
              metric: '서버 응답 시간',
              currentValue: 120,
              predictedValue: 180,
              change: 60,
              changePercent: 50.0
            },
            {
              metric: 'CPU 사용률',
              currentValue: 65,
              predictedValue: 85,
              change: 20,
              changePercent: 30.8
            }
          ]
        }
      ];
      setPredictions(mockPredictions);
      updateStats(mockPredictions);
    } catch (error) {
      console.error('예측 데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStats = (predictionData: PredictionData[]) => {
    const total = predictionData.length;
    const active = predictionData.filter(p => p.status === 'active').length;
    const avgConfidence = predictionData.reduce((sum, p) => sum + p.confidence, 0) / total;
    const highImpact = predictionData.filter(p => p.impact === 'high' || p.impact === 'critical').length;
    const accuracy = 0.85; // 모의 정확도

    setStats({
      totalPredictions: total,
      activePredictions: active,
      averageConfidence: avgConfidence,
      highImpactPredictions: highImpact,
      accuracy
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'user_behavior': return <Psychology color="primary" />;
      case 'trend': return <TrendingUp color="success" />;
      case 'performance': return <Speed color="warning" />;
      case 'security': return <Warning color="error" />;
      default: return <Analytics />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'primary';
      case 'completed': return 'success';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  const filteredPredictions = predictions.filter(prediction => {
    if (filter === 'all') return true;
    return prediction.type === filter;
  });

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        🔮 AI 예측 분석 시스템
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        AI 기반 사용자 행동 및 트렌드 예측으로 데이터 기반 의사결정을 지원합니다
      </Typography>

      {/* 통계 카드 */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 3, mb: 3 }}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Analytics sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">전체 예측</Typography>
            </Box>
            <Typography variant="h4" color="primary.main">
              {stats.totalPredictions}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              활성: {stats.activePredictions}
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Timeline sx={{ mr: 1, color: 'success.main' }} />
              <Typography variant="h6">평균 신뢰도</Typography>
            </Box>
            <Typography variant="h4" color="success.main">
              {Math.round(stats.averageConfidence * 100)}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              예측 정확도
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Warning sx={{ mr: 1, color: 'warning.main' }} />
              <Typography variant="h6">고위험 예측</Typography>
            </Box>
            <Typography variant="h4" color="warning.main">
              {stats.highImpactPredictions}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              주의 필요
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Assessment sx={{ mr: 1, color: 'info.main' }} />
              <Typography variant="h6">모델 정확도</Typography>
            </Box>
            <Typography variant="h4" color="info.main">
              {Math.round(stats.accuracy * 100)}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              AI 모델 성능
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* 필터 */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>예측 타입</InputLabel>
          <Select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            label="예측 타입"
          >
            <MenuItem value="all">전체</MenuItem>
            <MenuItem value="user_behavior">사용자 행동</MenuItem>
            <MenuItem value="trend">트렌드</MenuItem>
            <MenuItem value="performance">성능</MenuItem>
            <MenuItem value="security">보안</MenuItem>
          </Select>
        </FormControl>

        <IconButton onClick={loadPredictions} disabled={loading}>
          <Refresh />
        </IconButton>
      </Box>

      {/* 예측 목록 */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filteredPredictions.map((prediction) => (
            <Grid item xs={12} md={6} key={prediction.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    {getTypeIcon(prediction.type)}
                    <Typography variant="h6" sx={{ ml: 1, flexGrow: 1 }}>
                      {prediction.title}
                    </Typography>
                    <Chip
                      label={prediction.status}
                      color={getStatusColor(prediction.status)}
                      size="small"
                    />
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {prediction.description}
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <Chip
                      label={`신뢰도: ${Math.round(prediction.confidence * 100)}%`}
                      color="primary"
                      variant="outlined"
                      size="small"
                    />
                    <Chip
                      label={`영향도: ${prediction.impact}`}
                      color={getImpactColor(prediction.impact)}
                      variant="outlined"
                      size="small"
                    />
                    <Chip
                      label={`기간: ${prediction.timeframe}`}
                      color="info"
                      variant="outlined"
                      size="small"
                    />
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="subtitle2" gutterBottom>
                    예측 지표
                  </Typography>

                  {prediction.predictions.map((item, index) => (
                    <Box key={index} sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" fontWeight="medium">
                          {item.metric}
                        </Typography>
                        <Typography
                          variant="body2"
                          color={item.change >= 0 ? 'success.main' : 'error.main'}
                        >
                          {item.change >= 0 ? '+' : ''}{item.changePercent.toFixed(1)}%
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          현재: {item.currentValue}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          예측: {item.predictedValue}
                        </Typography>
                      </Box>

                      <LinearProgress
                        variant="determinate"
                        value={(item.predictedValue / (item.currentValue + item.predictedValue)) * 100}
                        sx={{ height: 6, borderRadius: 3 }}
                      />
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default AIPredictiveAnalytics;