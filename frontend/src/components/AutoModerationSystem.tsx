/**
 * 자동 모더레이션 시스템 (v1.3 보안 강화)
 * AI 기반 콘텐츠 자동 검토 및 승인 시스템
 */

import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Button,
    Switch,
    FormControlLabel,
    Alert,
    CircularProgress,
    Chip,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Slider,
    Divider,
    Paper,
    Tooltip,
    Badge,
    Grid
} from '@mui/material';
import {
    SmartToy,
    CheckCircle,
    Cancel,
    Warning,
    Speed,
    Security,
    Refresh,
    Add,
    Edit,
    Delete,
    Visibility,
    VisibilityOff,
    TrendingUp,
    TrendingDown,
    Assessment,
    Settings,
    Shield,
    BugReport,
    Analytics
} from '@mui/icons-material';

// 타입 정의
interface ModerationRule {
    id: string;
    name: string;
    type: 'spam' | 'inappropriate' | 'copyright' | 'hate_speech' | 'violence';
    severity: 'low' | 'medium' | 'high' | 'critical';
    enabled: boolean;
    threshold: number;
    action: 'auto_approve' | 'auto_reject' | 'flag_for_review';
    keywords?: string[];
    patterns?: string[];
    createdAt: Date;
    updatedAt: Date;
}

interface ModerationStats {
    totalProcessed: number;
    autoApproved: number;
    autoRejected: number;
    flaggedForReview: number;
    accuracy: number;
    falsePositives: number;
    falseNegatives: number;
    performanceMetrics: {
        processingSpeed: number;
        averageResponseTime: number;
        uptime: number;
    };
}

interface ModerationConfig {
    autoApproval: boolean;
    strictMode: boolean;
    realTimeProcessing: boolean;
    notificationEnabled: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    maxConcurrentJobs: number;
    cacheEnabled: boolean;
}

interface ModerationResult {
    id: string;
    contentId: string;
    contentType: 'post' | 'comment' | 'message' | 'file';
    status: 'approved' | 'rejected' | 'flagged' | 'pending';
    confidence: number;
    matchedRules: string[];
    processingTime: number;
    timestamp: Date;
    reviewer?: string;
    notes?: string;
}

// 메인 컴포넌트
const AutoModerationSystem: React.FC = () => {
    // 상태 관리
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [stats, setStats] = useState<ModerationStats>({
        totalProcessed: 0,
        autoApproved: 0,
        autoRejected: 0,
        flaggedForReview: 0,
        accuracy: 0,
        falsePositives: 0,
        falseNegatives: 0,
        performanceMetrics: {
            processingSpeed: 0,
            averageResponseTime: 0,
            uptime: 0
        }
    });

    const [rules, setRules] = useState<ModerationRule[]>([]);
    const [config, setConfig] = useState<ModerationConfig>({
        autoApproval: true,
        strictMode: false,
        realTimeProcessing: true,
        notificationEnabled: true,
        logLevel: 'info',
        maxConcurrentJobs: 10,
        cacheEnabled: true
    });

    const [recentResults, setRecentResults] = useState<ModerationResult[]>([]);
    const [showRuleDialog, setShowRuleDialog] = useState(false);
    const [editingRule, setEditingRule] = useState<ModerationRule | null>(null);

    // 데이터 로드
    const fetchModerationData = async () => {
        setLoading(true);
        setError(null);

        try {
            // 실제 구현에서는 API 호출
            await new Promise(resolve => setTimeout(resolve, 1000));

            // 모의 데이터
            setStats({
                totalProcessed: 15420,
                autoApproved: 12850,
                autoRejected: 1890,
                flaggedForReview: 680,
                accuracy: 94.2,
                falsePositives: 45,
                falseNegatives: 23,
                performanceMetrics: {
                    processingSpeed: 1250,
                    averageResponseTime: 0.8,
                    uptime: 99.8
                }
            });

            setRules([
                {
                    id: '1',
                    name: '스팸 감지',
                    type: 'spam',
                    severity: 'medium',
                    enabled: true,
                    threshold: 0.8,
                    action: 'auto_reject',
                    keywords: ['광고', '무료', '클릭', '링크'],
                    createdAt: new Date('2024-01-01'),
                    updatedAt: new Date('2024-10-01')
                },
                {
                    id: '2',
                    name: '부적절한 콘텐츠',
                    type: 'inappropriate',
                    severity: 'high',
                    enabled: true,
                    threshold: 0.9,
                    action: 'flag_for_review',
                    keywords: ['욕설', '비방'],
                    createdAt: new Date('2024-01-15'),
                    updatedAt: new Date('2024-10-01')
                }
            ]);

            setRecentResults([
                {
                    id: '1',
                    contentId: 'post_123',
                    contentType: 'post',
                    status: 'approved',
                    confidence: 0.95,
                    matchedRules: ['spam_detection'],
                    processingTime: 0.5,
                    timestamp: new Date(),
                    reviewer: 'AI_System'
                }
            ]);

        } catch (err) {
            setError('데이터 로드에 실패했습니다.');
            console.error('Moderation data fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    // 설정 변경
    const handleConfigChange = (key: keyof ModerationConfig, value: any) => {
        setConfig(prev => ({
            ...prev,
            [key]: value
        }));
    };

    // 규칙 추가/수정
    const handleRuleSubmit = (ruleData: Partial<ModerationRule>) => {
        if (editingRule) {
            // 규칙 수정
            setRules(prev => prev.map(rule =>
                rule.id === editingRule.id
                    ? { ...rule, ...ruleData, updatedAt: new Date() }
                    : rule
            ));
        } else {
            // 새 규칙 추가
            const newRule: ModerationRule = {
                id: Date.now().toString(),
                name: ruleData.name || '',
                type: ruleData.type || 'spam',
                severity: ruleData.severity || 'medium',
                enabled: ruleData.enabled ?? true,
                threshold: ruleData.threshold || 0.8,
                action: ruleData.action || 'flag_for_review',
                keywords: ruleData.keywords || [],
                patterns: ruleData.patterns || [],
                createdAt: new Date(),
                updatedAt: new Date()
            };
            setRules(prev => [...prev, newRule]);
        }

        setShowRuleDialog(false);
        setEditingRule(null);
    };

    // 규칙 삭제
    const handleRuleDelete = (ruleId: string) => {
        setRules(prev => prev.filter(rule => rule.id !== ruleId));
    };

    // 규칙 토글
    const handleRuleToggle = (ruleId: string) => {
        setRules(prev => prev.map(rule =>
            rule.id === ruleId
                ? { ...rule, enabled: !rule.enabled, updatedAt: new Date() }
                : rule
        ));
    };

    // 초기 로드
    useEffect(() => {
        fetchModerationData();
    }, []);

    // 로딩 상태
    if (loading && stats.totalProcessed === 0) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
                <CircularProgress size={60} />
                <Typography variant="h6" sx={{ ml: 2 }}>
                    자동 모더레이션 데이터 로딩 중...
                </Typography>
            </Box>
        );
    }

    // 에러 상태
    if (error) {
        return (
            <Alert
                severity="error"
                action={
                    <Button color="inherit" size="small" onClick={fetchModerationData}>
                        다시 시도
                    </Button>
                }
            >
                {error}
            </Alert>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            {/* 헤더 */}
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
                    🤖 자동 모더레이션 시스템 (v1.3)
                </Typography>

                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        variant="outlined"
                        startIcon={<Refresh />}
                        onClick={fetchModerationData}
                        disabled={loading}
                    >
                        새로고침
                    </Button>

                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => setShowRuleDialog(true)}
                        color="primary"
                    >
                        규칙 추가
                    </Button>
                </Box>
            </Box>

            {/* 통계 카드 */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 3, mb: 3 }}>
                <Card>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box>
                                <Typography color="textSecondary" gutterBottom>
                                    총 처리량
                                </Typography>
                                <Typography variant="h4" component="div">
                                    {stats.totalProcessed.toLocaleString()}
                                </Typography>
                            </Box>
                            <SmartToy sx={{ fontSize: 40, color: 'primary.main' }} />
                        </Box>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box>
                                <Typography color="textSecondary" gutterBottom>
                                    자동 승인
                                </Typography>
                                <Typography variant="h4" component="div">
                                    {stats.autoApproved.toLocaleString()}
                                </Typography>
                            </Box>
                            <CheckCircle sx={{ fontSize: 40, color: 'success.main' }} />
                        </Box>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box>
                                <Typography color="textSecondary" gutterBottom>
                                    정확도
                                </Typography>
                                <Typography variant="h4" component="div">
                                    {stats.accuracy}%
                                </Typography>
                            </Box>
                            <Assessment sx={{ fontSize: 40, color: 'info.main' }} />
                        </Box>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box>
                                <Typography color="textSecondary" gutterBottom>
                                    처리 속도
                                </Typography>
                                <Typography variant="h4" component="div">
                                    {stats.performanceMetrics.processingSpeed}/s
                                </Typography>
                            </Box>
                            <Speed sx={{ fontSize: 40, color: 'warning.main' }} />
                        </Box>
                    </CardContent>
                </Card>
            </Box>

            {/* 설정 패널 */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        ⚙️ 자동 모더레이션 설정
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
                        <Box>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={config.autoApproval}
                                        onChange={(e) => handleConfigChange('autoApproval', e.target.checked)}
                                        color="primary"
                                    />
                                }
                                label="자동 승인"
                            />
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={config.strictMode}
                                        onChange={(e) => handleConfigChange('strictMode', e.target.checked)}
                                        color="primary"
                                    />
                                }
                                label="엄격 모드"
                            />
                        </Box>
                        <Box>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={config.realTimeProcessing}
                                        onChange={(e) => handleConfigChange('realTimeProcessing', e.target.checked)}
                                        color="primary"
                                    />
                                }
                                label="실시간 처리"
                            />
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={config.notificationEnabled}
                                        onChange={(e) => handleConfigChange('notificationEnabled', e.target.checked)}
                                        color="primary"
                                    />
                                }
                                label="알림 활성화"
                            />
                        </Box>
                    </Box>
                </CardContent>
            </Card>

            {/* 규칙 목록 */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        📋 모더레이션 규칙
                    </Typography>
                    <List>
                        {rules.map((rule) => (
                            <ListItem key={rule.id} divider>
                                <ListItemText
                                    primary={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography variant="subtitle1">
                                                {rule.name}
                                            </Typography>
                                            <Chip
                                                label={rule.type}
                                                size="small"
                                                color={rule.severity === 'critical' ? 'error' :
                                                    rule.severity === 'high' ? 'warning' : 'default'}
                                            />
                                            <Chip
                                                label={rule.action}
                                                size="small"
                                                variant="outlined"
                                            />
                                        </Box>
                                    }
                                    secondary={
                                        <Box>
                                            <Typography variant="body2" color="text.secondary">
                                                임계값: {rule.threshold} |
                                                키워드: {rule.keywords?.join(', ') || '없음'}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                생성: {rule.createdAt.toLocaleDateString()} |
                                                수정: {rule.updatedAt.toLocaleDateString()}
                                            </Typography>
                                        </Box>
                                    }
                                />
                                <ListItemSecondaryAction>
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <Tooltip title={rule.enabled ? '비활성화' : '활성화'}>
                                            <IconButton
                                                onClick={() => handleRuleToggle(rule.id)}
                                                color={rule.enabled ? 'success' : 'default'}
                                            >
                                                {rule.enabled ? <Visibility /> : <VisibilityOff />}
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="수정">
                                            <IconButton
                                                onClick={() => {
                                                    setEditingRule(rule);
                                                    setShowRuleDialog(true);
                                                }}
                                            >
                                                <Edit />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="삭제">
                                            <IconButton
                                                onClick={() => handleRuleDelete(rule.id)}
                                                color="error"
                                            >
                                                <Delete />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                </ListItemSecondaryAction>
                            </ListItem>
                        ))}
                    </List>
                </CardContent>
            </Card>

            {/* 최근 결과 */}
            <Card>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        📊 최근 모더레이션 결과
                    </Typography>
                    <List>
                        {recentResults.map((result) => (
                            <ListItem key={result.id} divider>
                                <ListItemText
                                    primary={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography variant="subtitle1">
                                                {result.contentType} #{result.contentId}
                                            </Typography>
                                            <Chip
                                                label={result.status}
                                                size="small"
                                                color={result.status === 'approved' ? 'success' :
                                                    result.status === 'rejected' ? 'error' : 'warning'}
                                            />
                                            <Chip
                                                label={`${(result.confidence * 100).toFixed(1)}%`}
                                                size="small"
                                                variant="outlined"
                                            />
                                        </Box>
                                    }
                                    secondary={
                                        <Typography variant="body2" color="text.secondary">
                                            처리 시간: {result.processingTime}ms |
                                            검토자: {result.reviewer} |
                                            시간: {result.timestamp.toLocaleString()}
                                        </Typography>
                                    }
                                />
                            </ListItem>
                        ))}
                    </List>
                </CardContent>
            </Card>

            {/* 규칙 추가/수정 다이얼로그 */}
            <Dialog
                open={showRuleDialog}
                onClose={() => {
                    setShowRuleDialog(false);
                    setEditingRule(null);
                }}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    {editingRule ? '규칙 수정' : '새 규칙 추가'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 1 }}>
                        <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(50% - 8px)' } }}>
                            <TextField
                                fullWidth
                                label="규칙 이름"
                                defaultValue={editingRule?.name || ''}
                                variant="outlined"
                            />
                        </Box>
                        <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(50% - 8px)' } }}>
                            <FormControl fullWidth>
                                <InputLabel>타입</InputLabel>
                                <Select
                                    defaultValue={editingRule?.type || 'spam'}
                                    label="타입"
                                >
                                    <MenuItem value="spam">스팸</MenuItem>
                                    <MenuItem value="inappropriate">부적절한 콘텐츠</MenuItem>
                                    <MenuItem value="copyright">저작권 침해</MenuItem>
                                    <MenuItem value="hate_speech">혐오 발언</MenuItem>
                                    <MenuItem value="violence">폭력적 콘텐츠</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                        <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(50% - 8px)' } }}>
                            <FormControl fullWidth>
                                <InputLabel>심각도</InputLabel>
                                <Select
                                    defaultValue={editingRule?.severity || 'medium'}
                                    label="심각도"
                                >
                                    <MenuItem value="low">낮음</MenuItem>
                                    <MenuItem value="medium">보통</MenuItem>
                                    <MenuItem value="high">높음</MenuItem>
                                    <MenuItem value="critical">치명적</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                        <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(50% - 8px)' } }}>
                            <FormControl fullWidth>
                                <InputLabel>조치</InputLabel>
                                <Select
                                    defaultValue={editingRule?.action || 'flag_for_review'}
                                    label="조치"
                                >
                                    <MenuItem value="auto_approve">자동 승인</MenuItem>
                                    <MenuItem value="auto_reject">자동 거부</MenuItem>
                                    <MenuItem value="flag_for_review">검토 요청</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                        <Box sx={{ width: '100%' }}>
                            <Typography gutterBottom>
                                임계값: {editingRule?.threshold || 0.8}
                            </Typography>
                            <Slider
                                defaultValue={editingRule?.threshold || 0.8}
                                min={0}
                                max={1}
                                step={0.1}
                                marks={[
                                    { value: 0, label: '0' },
                                    { value: 0.5, label: '0.5' },
                                    { value: 1, label: '1' }
                                ]}
                            />
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => {
                        setShowRuleDialog(false);
                        setEditingRule(null);
                    }}>
                        취소
                    </Button>
                    <Button
                        onClick={() => handleRuleSubmit({})}
                        variant="contained"
                    >
                        {editingRule ? '수정' : '추가'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default AutoModerationSystem;