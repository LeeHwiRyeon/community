/**
 * 🛡️ 스팸 방지 시스템 컴포넌트
 * 
 * 실시간 스팸 감지, 필터링, 차단 기능을 제공하는 보안 시스템
 * 
 * @author AUTOAGENTS Manager
 * @version 2.0.0
 * @created 2025-01-02
 */

import React, { useState, useEffect } from 'react';
import {
    Box,
        Card,
    CardContent,
    Typography,
    Button,
    Chip,
    Alert,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Tooltip,
    Switch,
    FormControlLabel,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    LinearProgress,
    Badge,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Divider
} from '@mui/material';

import {
    Security,
    Block,
    Warning,
    CheckCircle,
    Error,
    Info,
    Refresh,
    Settings,
    FilterList,
    Shield,
    Report,
    Delete,
    Visibility,
    VisibilityOff,
    Add,
    Edit,
    Delete as DeleteIcon
} from '@mui/icons-material';

// 타입 정의
interface SpamRule {
    id: string;
    name: string;
    type: 'keyword' | 'pattern' | 'behavior' | 'frequency';
    pattern: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    action: 'warn' | 'block' | 'quarantine' | 'delete';
    enabled: boolean;
    createdAt: string;
    updatedAt: string;
    hitCount: number;
    description: string;
}

interface SpamDetection {
    id: string;
    userId: string;
    username: string;
    content: string;
    contentType: 'post' | 'comment' | 'message' | 'profile';
    detectedRules: string[];
    confidence: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
    status: 'pending' | 'reviewed' | 'approved' | 'blocked' | 'quarantined';
    timestamp: string;
    metadata: Record<string, any>;
}

interface SpamStats {
    totalDetections: number;
    blockedContent: number;
    falsePositives: number;
    accuracy: number;
    topSpamSources: Array<{
        source: string;
        count: number;
        percentage: number;
    }>;
    spamTrends: Array<{
        date: string;
        count: number;
        type: string;
    }>;
}

interface SpamPreventionConfig {
    autoModeration: boolean;
    realTimeScanning: boolean;
    machineLearning: boolean;
    userReporting: boolean;
    whitelistMode: boolean;
    sensitivity: 'low' | 'medium' | 'high';
    maxReportsPerUser: number;
    cooldownPeriod: number;
}

const SpamPreventionSystem: React.FC = () => {
    const [spamRules, setSpamRules] = useState<SpamRule[]>([]);
    const [detections, setDetections] = useState<SpamDetection[]>([]);
    const [stats, setStats] = useState<SpamStats | null>(null);
    const [config, setConfig] = useState<SpamPreventionConfig>({
        autoModeration: true,
        realTimeScanning: true,
        machineLearning: true,
        userReporting: true,
        whitelistMode: false,
        sensitivity: 'medium',
        maxReportsPerUser: 5,
        cooldownPeriod: 300
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedDetection, setSelectedDetection] = useState<SpamDetection | null>(null);
    const [showRuleDialog, setShowRuleDialog] = useState(false);
    const [editingRule, setEditingRule] = useState<SpamRule | null>(null);

    useEffect(() => {
        fetchSpamData();
    }, []);

    const fetchSpamData = async () => {
        try {
            setLoading(true);
            setError(null);

            // 모의 데이터 생성
            const mockRules: SpamRule[] = [
                {
                    id: '1',
                    name: '광고 키워드 감지',
                    type: 'keyword',
                    pattern: '(구매|판매|할인|무료|이벤트|광고)',
                    severity: 'medium',
                    action: 'block',
                    enabled: true,
                    createdAt: '2025-01-01T00:00:00Z',
                    updatedAt: '2025-01-01T00:00:00Z',
                    hitCount: 45,
                    description: '상업적 광고 키워드를 감지하여 차단합니다.'
                },
                {
                    id: '2',
                    name: '스팸 패턴 감지',
                    type: 'pattern',
                    pattern: '([!@#$%^&*()]{5,})',
                    severity: 'high',
                    action: 'quarantine',
                    enabled: true,
                    createdAt: '2025-01-01T00:00:00Z',
                    updatedAt: '2025-01-01T00:00:00Z',
                    hitCount: 23,
                    description: '특수문자 반복 패턴을 감지합니다.'
                },
                {
                    id: '3',
                    name: '빠른 연속 게시',
                    type: 'behavior',
                    pattern: 'posts_per_minute > 5',
                    severity: 'medium',
                    action: 'warn',
                    enabled: true,
                    createdAt: '2025-01-01T00:00:00Z',
                    updatedAt: '2025-01-01T00:00:00Z',
                    hitCount: 12,
                    description: '1분에 5개 이상의 게시물을 작성하는 행동을 감지합니다.'
                },
                {
                    id: '4',
                    name: '외부 링크 스팸',
                    type: 'pattern',
                    pattern: '(http[s]?://[^\\s]+)',
                    severity: 'low',
                    action: 'warn',
                    enabled: true,
                    createdAt: '2025-01-01T00:00:00Z',
                    updatedAt: '2025-01-01T00:00:00Z',
                    hitCount: 67,
                    description: '외부 링크가 포함된 콘텐츠를 감지합니다.'
                }
            ];

            const mockDetections: SpamDetection[] = [
                {
                    id: '1',
                    userId: 'user123',
                    username: 'spammer1',
                    content: '무료 다운로드! 지금 구매하세요! 할인 이벤트 진행중!',
                    contentType: 'post',
                    detectedRules: ['1'],
                    confidence: 95,
                    severity: 'medium',
                    status: 'blocked',
                    timestamp: '2025-01-02T10:30:00Z',
                    metadata: { ip: '192.168.1.100', userAgent: 'Mozilla/5.0...' }
                },
                {
                    id: '2',
                    userId: 'user456',
                    username: 'spammer2',
                    content: '!!!!!@@@@@#####$$$$$%%%%%',
                    contentType: 'comment',
                    detectedRules: ['2'],
                    confidence: 98,
                    severity: 'high',
                    status: 'quarantined',
                    timestamp: '2025-01-02T11:15:00Z',
                    metadata: { ip: '192.168.1.101', userAgent: 'Mozilla/5.0...' }
                },
                {
                    id: '3',
                    userId: 'user789',
                    username: 'normaluser',
                    content: '안녕하세요! 좋은 하루 되세요.',
                    contentType: 'post',
                    detectedRules: [],
                    confidence: 5,
                    severity: 'low',
                    status: 'approved',
                    timestamp: '2025-01-02T12:00:00Z',
                    metadata: { ip: '192.168.1.102', userAgent: 'Mozilla/5.0...' }
                }
            ];

            const mockStats: SpamStats = {
                totalDetections: 156,
                blockedContent: 89,
                falsePositives: 12,
                accuracy: 92.3,
                topSpamSources: [
                    { source: '광고 키워드', count: 45, percentage: 28.8 },
                    { source: '외부 링크', count: 32, percentage: 20.5 },
                    { source: '특수문자 패턴', count: 23, percentage: 14.7 },
                    { source: '빠른 연속 게시', count: 18, percentage: 11.5 },
                    { source: '기타', count: 38, percentage: 24.4 }
                ],
                spamTrends: [
                    { date: '2025-01-01', count: 23, type: 'post' },
                    { date: '2025-01-02', count: 31, type: 'comment' },
                    { date: '2025-01-03', count: 28, type: 'message' },
                    { date: '2025-01-04', count: 35, type: 'post' },
                    { date: '2025-01-05', count: 29, type: 'comment' }
                ]
            };

            // API 호출 시뮬레이션 지연
            await new Promise(resolve => setTimeout(resolve, 1000));

            setSpamRules(mockRules);
            setDetections(mockDetections);
            setStats(mockStats);
        } catch (err) {
            setError('스팸 방지 데이터를 불러오는 중 오류가 발생했습니다.');
            console.error('Spam prevention fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleRuleToggle = (ruleId: string) => {
        setSpamRules(prev => prev.map(rule =>
            rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
        ));
    };

    const handleDetectionAction = (detectionId: string, action: 'approve' | 'block' | 'quarantine') => {
        setDetections(prev => prev.map(detection =>
            detection.id === detectionId
                ? { ...detection, status: action === 'approve' ? 'approved' : action === 'block' ? 'blocked' : 'quarantined' }
                : detection
        ));
    };

    const handleConfigChange = (key: keyof SpamPreventionConfig, value: any) => {
        setConfig(prev => ({ ...prev, [key]: value }));
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return 'error';
            case 'high': return 'warning';
            case 'medium': return 'info';
            case 'low': return 'success';
            default: return 'default';
        }
    };

    const getSeverityIcon = (severity: string) => {
        switch (severity) {
            case 'critical': return <Error color="error" />;
            case 'high': return <Warning color="warning" />;
            case 'medium': return <Info color="info" />;
            case 'low': return <CheckCircle color="success" />;
            default: return <Info />;
        }
    };

    const getActionColor = (action: string) => {
        switch (action) {
            case 'block': return 'error';
            case 'quarantine': return 'warning';
            case 'warn': return 'info';
            case 'delete': return 'error';
            default: return 'default';
        }
    };

    if (loading && !stats) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <Typography variant="h6">스팸 방지 시스템을 불러오는 중...</Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Alert severity="error" sx={{ mb: 2 }}>
                {error}
                <Button onClick={fetchSpamData} sx={{ ml: 2 }}>
                    다시 시도
                </Button>
            </Alert>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            {/* 헤더 */}
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
                    🛡️ 스팸 방지 시스템
                </Typography>

                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        variant="outlined"
                        startIcon={<Refresh />}
                        onClick={fetchSpamData}
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
            {stats && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 3 }}>
                    <Box sx={{ flex: '1 1 250px', minWidth: 250 }}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Box>
                                        <Typography color="textSecondary" gutterBottom>
                                            총 감지 수
                                        </Typography>
                                        <Typography variant="h4" component="div">
                                            {stats.totalDetections}
                                        </Typography>
                                    </Box>
                                    <Security sx={{ fontSize: 40, color: 'primary.main' }} />
                                </Box>
                            </CardContent>
                        </Card>
                    </Box>

                    <Box sx={{ flex: '1 1 250px', minWidth: 250 }}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Box>
                                        <Typography color="textSecondary" gutterBottom>
                                            차단된 콘텐츠
                                        </Typography>
                                        <Typography variant="h4" component="div">
                                            {stats.blockedContent}
                                        </Typography>
                                    </Box>
                                    <Block sx={{ fontSize: 40, color: 'error.main' }} />
                                </Box>
                            </CardContent>
                        </Card>
                    </Box>

                    <Box sx={{ flex: '1 1 250px', minWidth: 250 }}>
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
                                    <Shield sx={{ fontSize: 40, color: 'success.main' }} />
                                </Box>
                            </CardContent>
                        </Card>
                    </Box>

                    <Box sx={{ flex: '1 1 250px', minWidth: 250 }}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Box>
                                        <Typography color="textSecondary" gutterBottom>
                                            오탐지
                                        </Typography>
                                        <Typography variant="h4" component="div">
                                            {stats.falsePositives}
                                        </Typography>
                                    </Box>
                                    <Warning sx={{ fontSize: 40, color: 'warning.main' }} />
                                </Box>
                            </CardContent>
                        </Card>
                    </Box>
                </Box>
            )}

            {/* 설정 패널 */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        ⚙️ 스팸 방지 설정
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                        <Box sx={{ flex: '1 1 400px', minWidth: 400 }}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={config.autoModeration}
                                        onChange={(e) => handleConfigChange('autoModeration', e.target.checked)}
                                        color="primary"
                                    />
                                }
                                label="자동 모더레이션"
                            />
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={config.realTimeScanning}
                                        onChange={(e) => handleConfigChange('realTimeScanning', e.target.checked)}
                                        color="primary"
                                    />
                                }
                                label="실시간 스캔"
                            />
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={config.machineLearning}
                                        onChange={(e) => handleConfigChange('machineLearning', e.target.checked)}
                                        color="primary"
                                    />
                                }
                                label="머신러닝 감지"
                            />
                        </Box>
                        <Box sx={{ flex: '1 1 400px', minWidth: 400 }}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={config.userReporting}
                                        onChange={(e) => handleConfigChange('userReporting', e.target.checked)}
                                        color="primary"
                                    />
                                }
                                label="사용자 신고 기능"
                            />
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={config.whitelistMode}
                                        onChange={(e) => handleConfigChange('whitelistMode', e.target.checked)}
                                        color="primary"
                                    />
                                }
                                label="화이트리스트 모드"
                            />
                            <FormControl size="small" sx={{ minWidth: 120, mt: 1 }}>
                                <InputLabel>감도</InputLabel>
                                <Select
                                    value={config.sensitivity}
                                    onChange={(e) => handleConfigChange('sensitivity', e.target.value)}
                                    label="감도"
                                >
                                    <MenuItem value="low">낮음</MenuItem>
                                    <MenuItem value="medium">보통</MenuItem>
                                    <MenuItem value="high">높음</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                    </Box>
                </CardContent>
            </Card>

            {/* 스팸 규칙 테이블 */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        📋 스팸 감지 규칙
                    </Typography>
                    <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>규칙명</TableCell>
                                    <TableCell>유형</TableCell>
                                    <TableCell>패턴</TableCell>
                                    <TableCell>심각도</TableCell>
                                    <TableCell>조치</TableCell>
                                    <TableCell>적중 수</TableCell>
                                    <TableCell>상태</TableCell>
                                    <TableCell>작업</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {spamRules.map((rule) => (
                                    <TableRow key={rule.id}>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                                {rule.name}
                                            </Typography>
                                            <Typography variant="caption" color="textSecondary">
                                                {rule.description}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip label={rule.type} size="small" color="primary" />
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                                {rule.pattern}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                {getSeverityIcon(rule.severity)}
                                                <Typography variant="body2" sx={{ ml: 1 }}>
                                                    {rule.severity}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={rule.action}
                                                size="small"
                                                color={getActionColor(rule.action) as any}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Badge badgeContent={rule.hitCount} color="primary">
                                                <Typography variant="body2">
                                                    {rule.hitCount}
                                                </Typography>
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Switch
                                                checked={rule.enabled}
                                                onChange={() => handleRuleToggle(rule.id)}
                                                color="primary"
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <IconButton size="small" onClick={() => setEditingRule(rule)}>
                                                <Edit />
                                            </IconButton>
                                            <IconButton size="small" color="error">
                                                <DeleteIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CardContent>
            </Card>

            {/* 최근 감지 내역 */}
            <Card>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        🔍 최근 스팸 감지 내역
                    </Typography>
                    <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>사용자</TableCell>
                                    <TableCell>콘텐츠</TableCell>
                                    <TableCell>유형</TableCell>
                                    <TableCell>신뢰도</TableCell>
                                    <TableCell>심각도</TableCell>
                                    <TableCell>상태</TableCell>
                                    <TableCell>시간</TableCell>
                                    <TableCell>작업</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {detections.map((detection) => (
                                    <TableRow key={detection.id}>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                                {detection.username}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {detection.content}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip label={detection.contentType} size="small" />
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <LinearProgress
                                                    variant="determinate"
                                                    value={detection.confidence}
                                                    sx={{ width: 60, height: 6, borderRadius: 3, mr: 1 }}
                                                />
                                                <Typography variant="body2">
                                                    {detection.confidence}%
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                {getSeverityIcon(detection.severity)}
                                                <Typography variant="body2" sx={{ ml: 1 }}>
                                                    {detection.severity}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={detection.status}
                                                size="small"
                                                color={detection.status === 'blocked' ? 'error' :
                                                    detection.status === 'quarantined' ? 'warning' :
                                                        detection.status === 'approved' ? 'success' : 'default'}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" color="textSecondary">
                                                {new Date(detection.timestamp).toLocaleString()}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleDetectionAction(detection.id, 'approve')}
                                                color="success"
                                            >
                                                <CheckCircle />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleDetectionAction(detection.id, 'block')}
                                                color="error"
                                            >
                                                <Block />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={() => setSelectedDetection(detection)}
                                                color="info"
                                            >
                                                <Visibility />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CardContent>
            </Card>

            {/* 상세 보기 다이얼로그 */}
            <Dialog open={!!selectedDetection} onClose={() => setSelectedDetection(null)} maxWidth="md" fullWidth>
                <DialogTitle>스팸 감지 상세 정보</DialogTitle>
                <DialogContent>
                    {selectedDetection && (
                        <Box>
                            <Typography variant="h6" gutterBottom>
                                콘텐츠 정보
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                                {selectedDetection.content}
                            </Typography>

                            <Typography variant="h6" gutterBottom>
                                감지 정보
                            </Typography>
                            <List>
                                <ListItem>
                                    <ListItemIcon>
                                        <Security />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary="감지된 규칙"
                                        secondary={selectedDetection.detectedRules.join(', ') || '없음'}
                                    />
                                </ListItem>
                                <ListItem>
                                    <ListItemIcon>
                                        <Info />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary="신뢰도"
                                        secondary={`${selectedDetection.confidence}%`}
                                    />
                                </ListItem>
                                <ListItem>
                                    <ListItemIcon>
                                        {getSeverityIcon(selectedDetection.severity)}
                                    </ListItemIcon>
                                    <ListItemText
                                        primary="심각도"
                                        secondary={selectedDetection.severity}
                                    />
                                </ListItem>
                            </List>

                            <Typography variant="h6" gutterBottom>
                                메타데이터
                            </Typography>
                            <Typography variant="body2" sx={{ fontFamily: 'monospace', bgcolor: 'grey.100', p: 2, borderRadius: 1 }}>
                                {JSON.stringify(selectedDetection.metadata, null, 2)}
                            </Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setSelectedDetection(null)}>닫기</Button>
                    <Button
                        onClick={() => selectedDetection && handleDetectionAction(selectedDetection.id, 'approve')}
                        color="success"
                    >
                        승인
                    </Button>
                    <Button
                        onClick={() => selectedDetection && handleDetectionAction(selectedDetection.id, 'block')}
                        color="error"
                    >
                        차단
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default SpamPreventionSystem;
