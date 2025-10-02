/**
 * 📺 스트리머 방송국 페이지
 * 
 * 실시간 방송, 채팅, 구독자 관리, 수익화 도구를 제공하는
 * 스트리머 전용 방송 플랫폼
 * 
 * @author AUTOAGENTS Manager
 * @version 1.0.0
 * @created 2025-10-02
 */

import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Container,
    Typography,
    Grid,
    Card,
    CardContent,
    Button,
    Chip,
    Avatar,
    TextField,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Tabs,
    Tab,
    Badge,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Fab,
    Tooltip,
    Alert,
    LinearProgress,
    Paper,
    Divider,
    Switch,
    FormControlLabel,
    Slider
} from '@mui/material';
import {
    PlayArrow as PlayIcon,
    Stop as StopIcon,
    Videocam as CameraIcon,
    Mic as MicIcon,
    MicOff as MicOffIcon,
    VideocamOff as CameraOffIcon,
    Chat as ChatIcon,
    People as PeopleIcon,
    MonetizationOn as MoneyIcon,
    Settings as SettingsIcon,
    Notifications as NotificationIcon,
    TrendingUp as TrendingIcon,
    Star as StarIcon,
    Send as SendIcon,
    VolumeUp as VolumeIcon,
    Fullscreen as FullscreenIcon,
    Share as ShareIcon,
    FiberManualRecord as RecordIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

// 타입 정의
interface StreamSettings {
    title: string;
    category: string;
    quality: '720p' | '1080p' | '4K';
    bitrate: number;
    isPrivate: boolean;
    allowChat: boolean;
    allowDonations: boolean;
    moderationLevel: 'low' | 'medium' | 'high';
}

interface ChatMessage {
    id: number;
    username: string;
    message: string;
    timestamp: Date;
    isSubscriber: boolean;
    isModerator: boolean;
    isVip: boolean;
    donationAmount?: number;
}

interface Subscriber {
    id: number;
    username: string;
    avatar: string;
    tier: 'basic' | 'premium' | 'vip' | 'diamond' | 'platinum';
    subscriptionDate: Date;
    totalDonated: number;
    isOnline: boolean;
}

interface StreamStats {
    viewers: number;
    peakViewers: number;
    duration: number;
    totalDonations: number;
    newSubscribers: number;
    chatMessages: number;
}

const StreamingStation: React.FC = () => {
    const theme = useTheme();
    const [isLive, setIsLive] = useState(false);
    const [activeTab, setActiveTab] = useState(0);
    const [chatMessage, setChatMessage] = useState('');
    const [streamSettings, setStreamSettings] = useState<StreamSettings>({
        title: '🎮 오늘의 게임 스트리밍',
        category: 'gaming',
        quality: '1080p',
        bitrate: 6000,
        isPrivate: false,
        allowChat: true,
        allowDonations: true,
        moderationLevel: 'medium'
    });

    // 모의 데이터
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
        {
            id: 1,
            username: 'GameMaster123',
            message: '안녕하세요! 오늘 방송 기대됩니다!',
            timestamp: new Date(),
            isSubscriber: true,
            isModerator: false,
            isVip: false
        },
        {
            id: 2,
            username: 'VIPViewer',
            message: '후원 감사합니다! 💖',
            timestamp: new Date(),
            isSubscriber: true,
            isModerator: false,
            isVip: true,
            donationAmount: 5000
        }
    ]);

    const [subscribers] = useState<Subscriber[]>([
        {
            id: 1,
            username: 'GameMaster123',
            avatar: '/api/placeholder/40/40',
            tier: 'premium',
            subscriptionDate: new Date('2024-01-15'),
            totalDonated: 50000,
            isOnline: true
        },
        {
            id: 2,
            username: 'VIPViewer',
            avatar: '/api/placeholder/40/40',
            tier: 'vip',
            subscriptionDate: new Date('2024-03-20'),
            totalDonated: 150000,
            isOnline: true
        }
    ]);

    const [streamStats, setStreamStats] = useState<StreamStats>({
        viewers: 1247,
        peakViewers: 1580,
        duration: 125,
        totalDonations: 87500,
        newSubscribers: 23,
        chatMessages: 456
    });

    const videoRef = useRef<HTMLVideoElement>(null);
    const [isCameraOn, setIsCameraOn] = useState(true);
    const [isMicOn, setIsMicOn] = useState(true);

    useEffect(() => {
        // 실시간 통계 업데이트 시뮬레이션
        const interval = setInterval(() => {
            if (isLive) {
                setStreamStats(prev => ({
                    ...prev,
                    viewers: prev.viewers + Math.floor(Math.random() * 10 - 5),
                    duration: prev.duration + 1,
                    chatMessages: prev.chatMessages + Math.floor(Math.random() * 3)
                }));
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [isLive]);

    const handleStartStream = async () => {
        try {
            // 카메라 및 마이크 권한 요청
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }

            setIsLive(true);
        } catch (error) {
            console.error('스트리밍 시작 실패:', error);
        }
    };

    const handleStopStream = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        setIsLive(false);
    };

    const handleSendMessage = () => {
        if (chatMessage.trim()) {
            const newMessage: ChatMessage = {
                id: Date.now(),
                username: 'Streamer',
                message: chatMessage,
                timestamp: new Date(),
                isSubscriber: true,
                isModerator: true,
                isVip: false
            };
            setChatMessages(prev => [...prev, newMessage]);
            setChatMessage('');
        }
    };

    const getTierColor = (tier: string) => {
        switch (tier) {
            case 'basic': return '#9e9e9e';
            case 'premium': return '#2196f3';
            case 'vip': return '#ff9800';
            case 'diamond': return '#e91e63';
            case 'platinum': return '#9c27b0';
            default: return '#9e9e9e';
        }
    };

    const getTierIcon = (tier: string) => {
        switch (tier) {
            case 'vip': return '👑';
            case 'diamond': return '💎';
            case 'platinum': return '⭐';
            default: return '🎖️';
        }
    };

    const formatDuration = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <Container maxWidth="xl" sx={{ py: 4 }}>
            {/* 헤더 */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h3" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    📺 스트리머 방송국
                    {isLive && <Chip label="🔴 LIVE" color="error" sx={{ ml: 2 }} />}
                </Typography>
                <Typography variant="h6" color="text.secondary">
                    프로페셔널 스트리밍 플랫폼
                </Typography>
            </Box>

            <Grid container spacing={3}>
                {/* 메인 스트리밍 영역 */}
                <Grid item xs={12} lg={8}>
                    <Card>
                        <CardContent>
                            {/* 비디오 영역 */}
                            <Box sx={{ position: 'relative', mb: 2 }}>
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    muted
                                    style={{
                                        width: '100%',
                                        height: '400px',
                                        backgroundColor: '#000',
                                        borderRadius: '8px'
                                    }}
                                />

                                {/* 스트리밍 오버레이 */}
                                {isLive && (
                                    <Box sx={{
                                        position: 'absolute',
                                        top: 16,
                                        left: 16,
                                        display: 'flex',
                                        gap: 1
                                    }}>
                                        <Chip label="🔴 LIVE" color="error" />
                                        <Chip label={`👥 ${streamStats.viewers}`} />
                                        <Chip label={formatDuration(streamStats.duration)} />
                                    </Box>
                                )}

                                {/* 컨트롤 버튼 */}
                                <Box sx={{
                                    position: 'absolute',
                                    bottom: 16,
                                    right: 16,
                                    display: 'flex',
                                    gap: 1
                                }}>
                                    <IconButton
                                        color={isCameraOn ? 'primary' : 'error'}
                                        onClick={() => setIsCameraOn(!isCameraOn)}
                                        sx={{ bgcolor: 'rgba(0,0,0,0.5)' }}
                                    >
                                        {isCameraOn ? <CameraIcon /> : <CameraOffIcon />}
                                    </IconButton>
                                    <IconButton
                                        color={isMicOn ? 'primary' : 'error'}
                                        onClick={() => setIsMicOn(!isMicOn)}
                                        sx={{ bgcolor: 'rgba(0,0,0,0.5)' }}
                                    >
                                        {isMicOn ? <MicIcon /> : <MicOffIcon />}
                                    </IconButton>
                                    <IconButton sx={{ bgcolor: 'rgba(0,0,0,0.5)' }}>
                                        <FullscreenIcon />
                                    </IconButton>
                                </Box>
                            </Box>

                            {/* 스트리밍 제어 */}
                            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                                {!isLive ? (
                                    <Button
                                        variant="contained"
                                        color="error"
                                        size="large"
                                        startIcon={<PlayIcon />}
                                        onClick={handleStartStream}
                                    >
                                        방송 시작
                                    </Button>
                                ) : (
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        size="large"
                                        startIcon={<StopIcon />}
                                        onClick={handleStopStream}
                                    >
                                        방송 종료
                                    </Button>
                                )}
                                <Button startIcon={<RecordIcon />} variant="outlined">
                                    녹화
                                </Button>
                                <Button startIcon={<ShareIcon />} variant="outlined">
                                    공유
                                </Button>
                                <Button startIcon={<SettingsIcon />} variant="outlined">
                                    설정
                                </Button>
                            </Box>

                            {/* 스트리밍 정보 */}
                            <Typography variant="h6" gutterBottom>
                                {streamSettings.title}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                                <Chip label={streamSettings.category} />
                                <Chip label={streamSettings.quality} />
                                <Chip label={`${streamSettings.bitrate}kbps`} />
                            </Box>
                        </CardContent>
                    </Card>

                    {/* 실시간 통계 */}
                    {isLive && (
                        <Card sx={{ mt: 2 }}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    📊 실시간 통계
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={6} sm={3}>
                                        <Box textAlign="center">
                                            <Typography variant="h4" color="primary">
                                                {streamStats.viewers}
                                            </Typography>
                                            <Typography variant="body2">현재 시청자</Typography>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={6} sm={3}>
                                        <Box textAlign="center">
                                            <Typography variant="h4" color="secondary">
                                                {streamStats.peakViewers}
                                            </Typography>
                                            <Typography variant="body2">최고 시청자</Typography>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={6} sm={3}>
                                        <Box textAlign="center">
                                            <Typography variant="h4" color="success.main">
                                                ₩{streamStats.totalDonations.toLocaleString()}
                                            </Typography>
                                            <Typography variant="body2">총 후원금</Typography>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={6} sm={3}>
                                        <Box textAlign="center">
                                            <Typography variant="h4" color="warning.main">
                                                {streamStats.newSubscribers}
                                            </Typography>
                                            <Typography variant="body2">신규 구독자</Typography>
                                        </Box>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    )}
                </Grid>

                {/* 사이드바 */}
                <Grid item xs={12} lg={4}>
                    {/* 탭 네비게이션 */}
                    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
                            <Tab label="채팅" icon={<ChatIcon />} />
                            <Tab label="구독자" icon={<PeopleIcon />} />
                            <Tab label="수익화" icon={<MoneyIcon />} />
                        </Tabs>
                    </Box>

                    {/* 채팅 */}
                    {activeTab === 0 && (
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    💬 실시간 채팅
                                </Typography>

                                <Box sx={{ height: 400, overflow: 'auto', mb: 2, border: 1, borderColor: 'divider', borderRadius: 1, p: 1 }}>
                                    <List dense>
                                        {chatMessages.map((msg) => (
                                            <ListItem key={msg.id} sx={{ px: 0 }}>
                                                <ListItemAvatar>
                                                    <Avatar sx={{ width: 24, height: 24 }}>
                                                        {msg.isVip ? '👑' : msg.isModerator ? '🛡️' : '👤'}
                                                    </Avatar>
                                                </ListItemAvatar>
                                                <ListItemText
                                                    primary={
                                                        <Box>
                                                            <Typography
                                                                component="span"
                                                                variant="body2"
                                                                fontWeight="bold"
                                                                color={msg.isModerator ? 'primary' : msg.isVip ? 'warning.main' : 'text.primary'}
                                                            >
                                                                {msg.username}
                                                            </Typography>
                                                            {msg.donationAmount && (
                                                                <Chip
                                                                    label={`₩${msg.donationAmount.toLocaleString()}`}
                                                                    size="small"
                                                                    color="success"
                                                                    sx={{ ml: 1 }}
                                                                />
                                                            )}
                                                        </Box>
                                                    }
                                                    secondary={msg.message}
                                                />
                                            </ListItem>
                                        ))}
                                    </List>
                                </Box>

                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        placeholder="채팅 메시지 입력..."
                                        value={chatMessage}
                                        onChange={(e) => setChatMessage(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                    />
                                    <IconButton onClick={handleSendMessage} color="primary">
                                        <SendIcon />
                                    </IconButton>
                                </Box>
                            </CardContent>
                        </Card>
                    )}

                    {/* 구독자 관리 */}
                    {activeTab === 1 && (
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    👥 구독자 관리
                                </Typography>

                                <List>
                                    {subscribers.map((subscriber) => (
                                        <ListItem key={subscriber.id}>
                                            <ListItemAvatar>
                                                <Badge
                                                    color={subscriber.isOnline ? 'success' : 'default'}
                                                    variant="dot"
                                                >
                                                    <Avatar src={subscriber.avatar} sx={{ bgcolor: '#f5f5f5' }} />
                                                </Badge>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Typography variant="body2">
                                                            {subscriber.username}
                                                        </Typography>
                                                        <Typography variant="body2">
                                                            {getTierIcon(subscriber.tier)}
                                                        </Typography>
                                                    </Box>
                                                }
                                                secondary={
                                                    <Box>
                                                        <Typography variant="caption" display="block">
                                                            총 후원: ₩{subscriber.totalDonated.toLocaleString()}
                                                        </Typography>
                                                        <Chip
                                                            label={subscriber.tier.toUpperCase()}
                                                            size="small"
                                                            sx={{
                                                                bgcolor: getTierColor(subscriber.tier),
                                                                color: 'white',
                                                                fontSize: '0.7rem'
                                                            }}
                                                        />
                                                    </Box>
                                                }
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            </CardContent>
                        </Card>
                    )}

                    {/* 수익화 */}
                    {activeTab === 2 && (
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    💰 수익화 도구
                                </Typography>

                                <Box sx={{ mb: 3 }}>
                                    <Typography variant="body2" gutterBottom>
                                        오늘의 수익
                                    </Typography>
                                    <Typography variant="h4" color="success.main">
                                        ₩{streamStats.totalDonations.toLocaleString()}
                                    </Typography>
                                </Box>

                                <Divider sx={{ my: 2 }} />

                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" gutterBottom>
                                        후원 목표 (₩100,000)
                                    </Typography>
                                    <LinearProgress
                                        variant="determinate"
                                        value={(streamStats.totalDonations / 100000) * 100}
                                        sx={{ height: 8, borderRadius: 4 }}
                                    />
                                    <Typography variant="caption" color="text.secondary">
                                        {Math.round((streamStats.totalDonations / 100000) * 100)}% 달성
                                    </Typography>
                                </Box>

                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    <Button variant="outlined" fullWidth startIcon={<MoneyIcon />}>
                                        후원 링크 생성
                                    </Button>
                                    <Button variant="outlined" fullWidth startIcon={<StarIcon />}>
                                        구독 혜택 설정
                                    </Button>
                                    <Button variant="outlined" fullWidth startIcon={<TrendingIcon />}>
                                        수익 분석
                                    </Button>
                                </Box>
                            </CardContent>
                        </Card>
                    )}
                </Grid>
            </Grid>

            {/* 알림 FAB */}
            <Tooltip title="알림">
                <Fab
                    color="secondary"
                    sx={{ position: 'fixed', bottom: 16, left: 16 }}
                >
                    <Badge badgeContent={5} color="error">
                        <NotificationIcon />
                    </Badge>
                </Fab>
            </Tooltip>
        </Container>
    );
};

export default StreamingStation;
