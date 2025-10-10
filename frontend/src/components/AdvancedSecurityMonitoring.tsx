/**
 * 고급 보안 모니터링 시스템 (v1.3 보안 강화)
 * 실시간 보안 위협 감지 및 자동 대응 시스템
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Alert,
    AlertTitle,
    Chip,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    IconButton,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    LinearProgress,
    Tooltip,
    Badge,
    Switch,
    FormControlLabel,
    Divider,
    CircularProgress
} from '@mui/material';
import {
    Security,
    Warning,
    Error,
    CheckCircle,
    Block,
    Visibility,
    VisibilityOff,
    Refresh,
    Settings,
    Analytics,
    Shield,
    BugReport,
    Lock,
    Public,
    VpnLock,
    Report,
    Notifications,
    NotificationsOff,
    TrendingUp,
    TrendingDown,
    Speed,
    Memory,
    Storage,
    NetworkCheck
} from '@mui/icons-material';

// 타입 정의
interface SecurityEvent {
    id: string;
    type: 'login_attempt' | 'suspicious_activity' | 'ddos_attack' | 'sql_injection' | 'xss_attack' | 'file_upload' | 'api_abuse';
    severity: 'low' | 'medium' | 'high' | 'critical';
    source: string;
    target: string;
    description: string;
    timestamp: Date;
    status: 'detected' | 'blocked' | 'investigating' | 'resolved';
    ipAddress: string;
    userAgent: string;
    location?: string;
    action?: string;
    confidence: number;
}

interface SecurityMetrics {
    totalEvents: number;
    blockedAttacks: number;
    activeThreats: number;
    systemHealth: number;
    responseTime: number;
    falsePositives: number;
    uptime: number;
    lastIncident: Date;
}

interface SecurityConfig {
    realTimeMonitoring: boolean;
    autoBlocking: boolean;
    notificationEnabled: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    threatDetectionThreshold: number;
    maxFailedAttempts: number;
    blockDuration: number; // minutes
    whitelistIps: string[];
    blacklistIps: string[];
}

interface ThreatIntelligence {
    maliciousIps: string[];
    suspiciousDomains: string[];
    knownAttackPatterns: string[];
    geoBlocking: boolean;
    countryRestrictions: string[];
}

// 메인 컴포넌트
const AdvancedSecurityMonitoring: React.FC = () => {
    // 상태 관리
    const [loading, setLoading] = useState(false);
    const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
    const [metrics, setMetrics] = useState<SecurityMetrics>({
        totalEvents: 0,
        blockedAttacks: 0,
        activeThreats: 0,
        systemHealth: 100,
        responseTime: 0,
        falsePositives: 0,
        uptime: 99.9,
        lastIncident: new Date()
    });

    const [config, setConfig] = useState<SecurityConfig>({
        realTimeMonitoring: true,
        autoBlocking: true,
        notificationEnabled: true,
        logLevel: 'info',
        threatDetectionThreshold: 0.8,
        maxFailedAttempts: 5,
        blockDuration: 30,
        whitelistIps: [],
        blacklistIps: []
    });

    const [threatIntelligence, setThreatIntelligence] = useState<ThreatIntelligence>({
        maliciousIps: [],
        suspiciousDomains: [],
        knownAttackPatterns: [],
        geoBlocking: false,
        countryRestrictions: []
    });

    const [showConfigDialog, setShowConfigDialog] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null);

    // 보안 이벤트 로드
    const loadSecurityEvents = useCallback(async () => {
        setLoading(true);
        try {
            // 실제 구현에서는 API 호출
            await new Promise(resolve => setTimeout(resolve, 1000));

            // 모의 데이터
            const mockEvents: SecurityEvent[] = [
                {
                    id: '1',
                    type: 'sql_injection',
                    severity: 'high',
                    source: '192.168.1.100',
                    target: '/api/users',
                    description: 'SQL injection attempt detected in user query parameter',
                    timestamp: new Date(Date.now() - 1000 * 60 * 5),
                    status: 'blocked',
                    ipAddress: '192.168.1.100',
                    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    location: 'Seoul, South Korea',
                    action: 'IP blocked for 30 minutes',
                    confidence: 0.95
                },
                {
                    id: '2',
                    type: 'ddos_attack',
                    severity: 'critical',
                    source: 'Multiple IPs',
                    target: '/api/chat',
                    description: 'Distributed denial of service attack detected',
                    timestamp: new Date(Date.now() - 1000 * 60 * 2),
                    status: 'investigating',
                    ipAddress: 'Multiple',
                    userAgent: 'Various',
                    location: 'Global',
                    action: 'Rate limiting activated',
                    confidence: 0.98
                },
                {
                    id: '3',
                    type: 'suspicious_activity',
                    severity: 'medium',
                    source: '10.0.0.50',
                    target: '/admin',
                    description: 'Unusual access pattern detected from admin panel',
                    timestamp: new Date(Date.now() - 1000 * 60 * 10),
                    status: 'detected',
                    ipAddress: '10.0.0.50',
                    userAgent: 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36',
                    location: 'Unknown',
                    action: 'Monitoring increased',
                    confidence: 0.75
                }
            ];

            setSecurityEvents(mockEvents);

            // 메트릭 업데이트
            setMetrics({
                totalEvents: mockEvents.length,
                blockedAttacks: mockEvents.filter(e => e.status === 'blocked').length,
                activeThreats: mockEvents.filter(e => e.status === 'detected' || e.status === 'investigating').length,
                systemHealth: 95,
                responseTime: 0.8,
                falsePositives: 2,
                uptime: 99.9,
                lastIncident: new Date()
            });

        } catch (error) {
            console.error('Failed to load security events:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    // 설정 변경
    const handleConfigChange = (key: keyof SecurityConfig, value: any) => {
        setConfig(prev => ({
            ...prev,
            [key]: value
        }));
    };

    // 이벤트 상태 변경
    const handleEventStatusChange = (eventId: string, newStatus: SecurityEvent['status']) => {
        setSecurityEvents(prev => prev.map(event =>
            event.id === eventId
                ? { ...event, status: newStatus }
                : event
        ));
    };

    // IP 차단/해제
    const handleIpAction = (ipAddress: string, action: 'block' | 'unblock') => {
        if (action === 'block') {
            setConfig(prev => ({
                ...prev,
                blacklistIps: [...prev.blacklistIps, ipAddress]
            }));
        } else {
            setConfig(prev => ({
                ...prev,
                blacklistIps: prev.blacklistIps.filter(ip => ip !== ipAddress)
            }));
        }
    };

    // 심각도별 색상
    const getSeverityColor = (severity: SecurityEvent['severity']) => {
        switch (severity) {
            case 'critical': return 'error';
            case 'high': return 'warning';
            case 'medium': return 'info';
            case 'low': return 'success';
            default: return 'default';
        }
    };

    // 상태별 색상
    const getStatusColor = (status: SecurityEvent['status']) => {
        switch (status) {
            case 'blocked': return 'success';
            case 'investigating': return 'warning';
            case 'detected': return 'info';
            case 'resolved': return 'default';
            default: return 'default';
        }
    };

    // 초기 로드
    useEffect(() => {
        loadSecurityEvents();

        // 실시간 업데이트 (실제 구현에서는 WebSocket 사용)
        const interval = setInterval(loadSecurityEvents, 30000);
        return () => clearInterval(interval);
    }, [loadSecurityEvents]);

    return (
        <Box sx={{ p: 3 }}>
            {/* 헤더 */}
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
                    🛡️ 고급 보안 모니터링 시스템 (v1.3)
                </Typography>

                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        variant="outlined"
                        startIcon={<Refresh />}
                        onClick={loadSecurityEvents}
                        disabled={loading}
                    >
                        새로고침
                    </Button>

                    <Button
                        variant="contained"
                        startIcon={<Settings />}
                        onClick={() => setShowConfigDialog(true)}
                        color="primary"
                    >
                        설정
                    </Button>
                </Box>
            </Box>

            {/* 보안 메트릭 */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 3, mb: 3 }}>
                <Card>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box>
                                <Typography color="textSecondary" gutterBottom>
                                    총 보안 이벤트
                                </Typography>
                                <Typography variant="h4" component="div">
                                    {metrics.totalEvents}
                                </Typography>
                            </Box>
                            <Security sx={{ fontSize: 40, color: 'primary.main' }} />
                        </Box>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box>
                                <Typography color="textSecondary" gutterBottom>
                                    차단된 공격
                                </Typography>
                                <Typography variant="h4" component="div">
                                    {metrics.blockedAttacks}
                                </Typography>
                            </Box>
                            <Block sx={{ fontSize: 40, color: 'success.main' }} />
                        </Box>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box>
                                <Typography color="textSecondary" gutterBottom>
                                    활성 위협
                                </Typography>
                                <Typography variant="h4" component="div">
                                    {metrics.activeThreats}
                                </Typography>
                            </Box>
                            <Warning sx={{ fontSize: 40, color: 'warning.main' }} />
                        </Box>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box>
                                <Typography color="textSecondary" gutterBottom>
                                    시스템 건강도
                                </Typography>
                                <Typography variant="h4" component="div">
                                    {metrics.systemHealth}%
                                </Typography>
                            </Box>
                            <CheckCircle sx={{ fontSize: 40, color: 'success.main' }} />
                        </Box>
                    </CardContent>
                </Card>
            </Box>

            {/* 보안 상태 알림 */}
            {metrics.activeThreats > 0 && (
                <Alert severity="warning" sx={{ mb: 3 }}>
                    <AlertTitle>활성 보안 위협 감지</AlertTitle>
                    현재 {metrics.activeThreats}개의 활성 위협이 감지되었습니다. 즉시 조치가 필요합니다.
                </Alert>
            )}

            {/* 보안 이벤트 테이블 */}
            <Card>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        📊 실시간 보안 이벤트
                    </Typography>

                    <TableContainer component={Paper} sx={{ mt: 2 }}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>시간</TableCell>
                                    <TableCell>타입</TableCell>
                                    <TableCell>심각도</TableCell>
                                    <TableCell>소스</TableCell>
                                    <TableCell>대상</TableCell>
                                    <TableCell>상태</TableCell>
                                    <TableCell>신뢰도</TableCell>
                                    <TableCell>조치</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {securityEvents.map((event) => (
                                    <TableRow key={event.id} hover>
                                        <TableCell>
                                            {event.timestamp.toLocaleTimeString()}
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={event.type.replace('_', ' ')}
                                                size="small"
                                                variant="outlined"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={event.severity}
                                                size="small"
                                                color={getSeverityColor(event.severity)}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {event.ipAddress}
                                            </Typography>
                                            {event.location && (
                                                <Typography variant="caption" color="text.secondary">
                                                    {event.location}
                                                </Typography>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {event.target}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={event.status}
                                                size="small"
                                                color={getStatusColor(event.status)}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <LinearProgress
                                                    variant="determinate"
                                                    value={event.confidence * 100}
                                                    sx={{ width: 60, mr: 1 }}
                                                />
                                                <Typography variant="body2">
                                                    {(event.confidence * 100).toFixed(0)}%
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                                <Tooltip title="상세 보기">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => setSelectedEvent(event)}
                                                    >
                                                        <Visibility />
                                                    </IconButton>
                                                </Tooltip>
                                                {event.status === 'detected' && (
                                                    <Tooltip title="차단">
                                                        <IconButton
                                                            size="small"
                                                            color="error"
                                                            onClick={() => handleEventStatusChange(event.id, 'blocked')}
                                                        >
                                                            <Block />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                                {event.status === 'blocked' && (
                                                    <Tooltip title="해제">
                                                        <IconButton
                                                            size="small"
                                                            color="success"
                                                            onClick={() => handleEventStatusChange(event.id, 'resolved')}
                                                        >
                                                            <CheckCircle />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CardContent>
            </Card>

            {/* 위협 인텔리전스 */}
            <Card sx={{ mt: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        🕵️ 위협 인텔리전스
                    </Typography>

                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
                        <Box>
                            <Typography variant="subtitle1" gutterBottom>
                                악성 IP 주소
                            </Typography>
                            <List dense>
                                {threatIntelligence.maliciousIps.map((ip, index) => (
                                    <ListItem key={index}>
                                        <ListItemIcon>
                                            <VpnLock color="error" />
                                        </ListItemIcon>
                                        <ListItemText primary={ip} />
                                        <ListItemIcon>
                                            <IconButton size="small" color="error">
                                                <Block />
                                            </IconButton>
                                        </ListItemIcon>
                                    </ListItem>
                                ))}
                            </List>
                        </Box>

                        <Box>
                            <Typography variant="subtitle1" gutterBottom>
                                의심스러운 도메인
                            </Typography>
                            <List dense>
                                {threatIntelligence.suspiciousDomains.map((domain, index) => (
                                    <ListItem key={index}>
                                        <ListItemIcon>
                                            <Public color="warning" />
                                        </ListItemIcon>
                                        <ListItemText primary={domain} />
                                        <ListItemIcon>
                                            <IconButton size="small" color="warning">
                                                <Block />
                                            </IconButton>
                                        </ListItemIcon>
                                    </ListItem>
                                ))}
                            </List>
                        </Box>
                    </Box>
                </CardContent>
            </Card>

            {/* 설정 다이얼로그 */}
            <Dialog
                open={showConfigDialog}
                onClose={() => setShowConfigDialog(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>보안 설정</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3, mt: 1 }}>
                        <Box>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={config.realTimeMonitoring}
                                        onChange={(e) => handleConfigChange('realTimeMonitoring', e.target.checked)}
                                        color="primary"
                                    />
                                }
                                label="실시간 모니터링"
                            />
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={config.autoBlocking}
                                        onChange={(e) => handleConfigChange('autoBlocking', e.target.checked)}
                                        color="primary"
                                    />
                                }
                                label="자동 차단"
                            />
                        </Box>
                        <Box>
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
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={threatIntelligence.geoBlocking}
                                        onChange={(e) => setThreatIntelligence(prev => ({ ...prev, geoBlocking: e.target.checked }))}
                                        color="primary"
                                    />
                                }
                                label="지역 차단"
                            />
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowConfigDialog(false)}>
                        취소
                    </Button>
                    <Button variant="contained">
                        저장
                    </Button>
                </DialogActions>
            </Dialog>

            {/* 이벤트 상세 다이얼로그 */}
            <Dialog
                open={!!selectedEvent}
                onClose={() => setSelectedEvent(null)}
                maxWidth="md"
                fullWidth
            >
                {selectedEvent && (
                    <>
                        <DialogTitle>보안 이벤트 상세 정보</DialogTitle>
                        <DialogContent>
                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>
                                <Box>
                                    <Typography variant="subtitle2">이벤트 ID</Typography>
                                    <Typography variant="body2">{selectedEvent.id}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="subtitle2">타입</Typography>
                                    <Typography variant="body2">{selectedEvent.type}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="subtitle2">심각도</Typography>
                                    <Chip
                                        label={selectedEvent.severity}
                                        color={getSeverityColor(selectedEvent.severity)}
                                        size="small"
                                    />
                                </Box>
                                <Box>
                                    <Typography variant="subtitle2">상태</Typography>
                                    <Chip
                                        label={selectedEvent.status}
                                        color={getStatusColor(selectedEvent.status)}
                                        size="small"
                                    />
                                </Box>
                                <Box sx={{ gridColumn: '1 / -1' }}>
                                    <Typography variant="subtitle2">설명</Typography>
                                    <Typography variant="body2">{selectedEvent.description}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="subtitle2">IP 주소</Typography>
                                    <Typography variant="body2">{selectedEvent.ipAddress}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="subtitle2">위치</Typography>
                                    <Typography variant="body2">{selectedEvent.location || 'Unknown'}</Typography>
                                </Box>
                                <Box sx={{ gridColumn: '1 / -1' }}>
                                    <Typography variant="subtitle2">User Agent</Typography>
                                    <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                                        {selectedEvent.userAgent}
                                    </Typography>
                                </Box>
                                {selectedEvent.action && (
                                    <Box sx={{ gridColumn: '1 / -1' }}>
                                        <Typography variant="subtitle2">조치</Typography>
                                        <Typography variant="body2">{selectedEvent.action}</Typography>
                                    </Box>
                                )}
                            </Box>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setSelectedEvent(null)}>
                                닫기
                            </Button>
                            {selectedEvent.status === 'detected' && (
                                <Button
                                    variant="contained"
                                    color="error"
                                    onClick={() => {
                                        handleEventStatusChange(selectedEvent.id, 'blocked');
                                        setSelectedEvent(null);
                                    }}
                                >
                                    차단
                                </Button>
                            )}
                        </DialogActions>
                    </>
                )}
            </Dialog>
        </Box>
    );
};

export default AdvancedSecurityMonitoring;
