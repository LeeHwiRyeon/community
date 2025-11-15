/**
 * AI 모더레이션 패널
 * 콘텐츠 자동 분석 및 위험도 평가
 */

import React, { useState } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    TextField,
    Button,
    LinearProgress,
    Chip,
    Alert,
    Paper,
    CircularProgress,
} from '@mui/material';
import {
    Psychology,
    CheckCircle,
    Warning,
    Error,
    Send,
} from '@mui/icons-material';
import axios from 'axios';

interface ModerationResult {
    toxicityScore: number;
    categories: string[];
    shouldFlag: boolean;
    confidence: number;
    suggestedAction: string;
}

const AIModeration: React.FC = () => {
    const [content, setContent] = useState('');
    const [analyzing, setAnalyzing] = useState(false);
    const [result, setResult] = useState<ModerationResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

    const handleAnalyze = async () => {
        if (!content.trim()) {
            setError('분석할 콘텐츠를 입력하세요');
            return;
        }

        try {
            setAnalyzing(true);
            setError(null);
            const token = localStorage.getItem('token');

            const response = await axios.post(
                `${API_BASE_URL}/api/admin-simple/moderate`,
                {
                    content,
                    type: 'text',
                },
                {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                }
            );

            if (response.data.success) {
                setResult(response.data.analysis);
            }
        } catch (err: any) {
            console.error('AI 분석 실패:', err);
            setError(err.response?.data?.message || 'AI 분석 중 오류가 발생했습니다');
        } finally {
            setAnalyzing(false);
        }
    };

    const getToxicityColor = (score: number): 'success' | 'warning' | 'error' => {
        if (score < 0.3) return 'success';
        if (score < 0.7) return 'warning';
        return 'error';
    };

    const getToxicityLabel = (score: number) => {
        if (score < 0.3) return '안전';
        if (score < 0.5) return '주의';
        if (score < 0.7) return '경고';
        return '위험';
    };

    const getActionIcon = (action: string) => {
        switch (action) {
            case 'approve':
                return <CheckCircle color="success" />;
            case 'review':
                return <Warning color="warning" />;
            case 'remove':
                return <Error color="error" />;
            default:
                return <CheckCircle />;
        }
    };

    const getActionLabel = (action: string) => {
        const labels: Record<string, string> = {
            approve: '승인 권장',
            review: '검토 필요',
            remove: '삭제 권장',
        };
        return labels[action] || action;
    };

    const getCategoryLabel = (category: string) => {
        const labels: Record<string, string> = {
            spam: '스팸',
            toxic: '유해 콘텐츠',
            offensive: '공격적',
            hate: '혐오 발언',
            violence: '폭력적',
            sexual: '선정적',
        };
        return labels[category] || category;
    };

    return (
        <Box>
            <Typography variant="h6" display="flex" alignItems="center" gap={1} mb={2}>
                <Psychology color="primary" />
                AI 콘텐츠 모더레이션
            </Typography>

            <Card>
                <CardContent>
                    <Typography variant="subtitle2" gutterBottom>
                        분석할 콘텐츠
                    </Typography>
                    <TextField
                        fullWidth
                        multiline
                        rows={6}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="분석할 텍스트를 입력하세요..."
                        disabled={analyzing}
                        sx={{ mb: 2 }}
                    />

                    <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="caption" color="textSecondary">
                            AI가 콘텐츠의 유해성을 자동으로 분석합니다
                        </Typography>
                        <Button
                            variant="contained"
                            startIcon={analyzing ? <CircularProgress size={16} /> : <Send />}
                            onClick={handleAnalyze}
                            disabled={analyzing || !content.trim()}
                        >
                            {analyzing ? '분석 중...' : '분석 시작'}
                        </Button>
                    </Box>

                    {error && (
                        <Alert severity="error" sx={{ mt: 2 }}>
                            {error}
                        </Alert>
                    )}
                </CardContent>
            </Card>

            {result && (
                <Paper sx={{ p: 3, mt: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        분석 결과
                    </Typography>

                    <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(300px, 1fr))" gap={3}>
                        {/* 유해성 점수 */}
                        <Card variant="outlined">
                            <CardContent>
                                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                                    유해성 점수
                                </Typography>
                                <Box display="flex" alignItems="center" gap={2} mb={1}>
                                    <Typography variant="h3" color={getToxicityColor(result.toxicityScore)}>
                                        {(result.toxicityScore * 100).toFixed(0)}%
                                    </Typography>
                                    <Chip
                                        label={getToxicityLabel(result.toxicityScore)}
                                        color={getToxicityColor(result.toxicityScore)}
                                    />
                                </Box>
                                <LinearProgress
                                    variant="determinate"
                                    value={result.toxicityScore * 100}
                                    color={getToxicityColor(result.toxicityScore)}
                                    sx={{ height: 8, borderRadius: 4 }}
                                />
                            </CardContent>
                        </Card>

                        {/* 신뢰도 */}
                        <Card variant="outlined">
                            <CardContent>
                                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                                    분석 신뢰도
                                </Typography>
                                <Box display="flex" alignItems="center" gap={2} mb={1}>
                                    <Typography variant="h3" color="primary">
                                        {(result.confidence * 100).toFixed(0)}%
                                    </Typography>
                                    <Chip label="높음" color="primary" />
                                </Box>
                                <LinearProgress
                                    variant="determinate"
                                    value={result.confidence * 100}
                                    sx={{ height: 8, borderRadius: 4 }}
                                />
                            </CardContent>
                        </Card>

                        {/* 위반 카테고리 */}
                        <Card variant="outlined">
                            <CardContent>
                                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                                    감지된 카테고리
                                </Typography>
                                <Box display="flex" flexWrap="wrap" gap={1} mt={1}>
                                    {result.categories.length > 0 ? (
                                        result.categories.map((category) => (
                                            <Chip
                                                key={category}
                                                label={getCategoryLabel(category)}
                                                color="warning"
                                                size="small"
                                            />
                                        ))
                                    ) : (
                                        <Chip label="없음" color="success" size="small" />
                                    )}
                                </Box>
                            </CardContent>
                        </Card>

                        {/* 권장 조치 */}
                        <Card variant="outlined">
                            <CardContent>
                                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                                    권장 조치
                                </Typography>
                                <Box display="flex" alignItems="center" gap={1} mt={2}>
                                    {getActionIcon(result.suggestedAction)}
                                    <Typography variant="h6">
                                        {getActionLabel(result.suggestedAction)}
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Box>

                    {/* 경고 메시지 */}
                    {result.shouldFlag && (
                        <Alert severity="warning" sx={{ mt: 3 }}>
                            <Typography variant="subtitle2" gutterBottom>
                                ⚠️ 이 콘텐츠는 추가 검토가 필요합니다
                            </Typography>
                            <Typography variant="body2">
                                AI 분석 결과 부적절한 콘텐츠로 판단되었습니다.
                                관리자의 수동 검토를 권장합니다.
                            </Typography>
                        </Alert>
                    )}

                    <Box display="flex" gap={2} mt={3}>
                        <Button variant="contained" color="success" startIcon={<CheckCircle />}>
                            콘텐츠 승인
                        </Button>
                        <Button variant="outlined" color="warning" startIcon={<Warning />}>
                            검토 대기
                        </Button>
                        <Button variant="outlined" color="error" startIcon={<Error />}>
                            콘텐츠 삭제
                        </Button>
                    </Box>
                </Paper>
            )}
        </Box>
    );
};

export default AIModeration;
