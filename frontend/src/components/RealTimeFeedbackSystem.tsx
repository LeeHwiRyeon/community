/**
 * 🔔 실시간 피드백 시스템
 * 
 * 사용자 인터랙션에 대한 즉시 피드백, 알림, 상태 표시를 제공하는
 * 종합적인 피드백 시스템
 * 
 * @author AUTOAGENTS Manager
 * @version 3.0.0
 * @created 2025-10-02
 */

import React, {
    useState,
    useEffect,
    useCallback,
    useRef,
    createContext,
    useContext,
    ReactNode
} from 'react';
import {
    Snackbar,
    Alert,
    AlertTitle,
    Slide,
    Fade,
    Grow,
    Zoom,
    Box,
    Typography,
    LinearProgress,
    CircularProgress,
    Chip,
    Avatar,
    IconButton,
    Button,
    Card,
    CardContent,
    Badge,
    Tooltip,
    useTheme,
    useMediaQuery
} from '@mui/material';
import {
    CheckCircle as SuccessIcon,
    Error as ErrorIcon,
    Warning as WarningIcon,
    Info as InfoIcon,
    Close as CloseIcon,
    Notifications as NotificationIcon,
    NotificationsActive as NotificationActiveIcon,
    Vibration as VibrationIcon,
    VolumeUp as SoundIcon,
    Lightbulb as TipIcon,
    TrendingUp as ProgressIcon,
    Speed as PerformanceIcon,
    Favorite as LikeIcon,
    Share as ShareIcon,
    Bookmark as BookmarkIcon
} from '@mui/icons-material';
import { styled, keyframes } from '@mui/system';

// 피드백 타입 정의
export type FeedbackType = 'success' | 'error' | 'warning' | 'info' | 'loading' | 'progress';
export type NotificationType = 'system' | 'user' | 'achievement' | 'reminder' | 'social';
export type FeedbackPosition = 'top' | 'bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
export type AnimationType = 'slide' | 'fade' | 'grow' | 'zoom' | 'bounce' | 'shake' | 'pulse';

export interface FeedbackMessage {
    id: string;
    type: FeedbackType;
    title?: string;
    message: string;
    duration?: number;
    position?: FeedbackPosition;
    animation?: AnimationType;
    action?: {
        label: string;
        onClick: () => void;
    };
    persistent?: boolean;
    showProgress?: boolean;
    progress?: number;
    icon?: React.ReactNode;
    timestamp?: Date;
}

export interface NotificationMessage {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    avatar?: string;
    timestamp: Date;
    read: boolean;
    actions?: Array<{
        label: string;
        onClick: () => void;
        primary?: boolean;
    }>;
    metadata?: Record<string, any>;
}

export interface FeedbackSettings {
    enabled: boolean;
    soundEnabled: boolean;
    vibrationEnabled: boolean;
    animationsEnabled: boolean;
    showTimestamps: boolean;
    autoHide: boolean;
    defaultDuration: number;
    maxNotifications: number;
    groupSimilar: boolean;
}

interface FeedbackContextValue {
    showFeedback: (feedback: Omit<FeedbackMessage, 'id' | 'timestamp'>) => string;
    hideFeedback: (id: string) => void;
    showNotification: (notification: Omit<NotificationMessage, 'id' | 'timestamp' | 'read'>) => string;
    markNotificationRead: (id: string) => void;
    clearAllNotifications: () => void;
    showProgress: (message: string, progress: number) => string;
    showLoading: (message: string) => string;
    hideLoading: (id: string) => void;
    showQuickFeedback: (type: FeedbackType, message: string) => void;
    settings: FeedbackSettings;
    updateSettings: (newSettings: Partial<FeedbackSettings>) => void;
    notifications: NotificationMessage[];
    unreadCount: number;
}

// 기본 설정
const DEFAULT_FEEDBACK_SETTINGS: FeedbackSettings = {
    enabled: true,
    soundEnabled: true,
    vibrationEnabled: true,
    animationsEnabled: true,
    showTimestamps: true,
    autoHide: true,
    defaultDuration: 4000,
    maxNotifications: 50,
    groupSimilar: true
};

// 애니메이션 정의
const bounceAnimation = keyframes`
    0%, 20%, 53%, 80%, 100% {
        transform: translate3d(0, 0, 0);
    }
    40%, 43% {
        transform: translate3d(0, -30px, 0);
    }
    70% {
        transform: translate3d(0, -15px, 0);
    }
    90% {
        transform: translate3d(0, -4px, 0);
    }
`;

const shakeAnimation = keyframes`
    0%, 100% {
        transform: translateX(0);
    }
    10%, 30%, 50%, 70%, 90% {
        transform: translateX(-10px);
    }
    20%, 40%, 60%, 80% {
        transform: translateX(10px);
    }
`;

const pulseAnimation = keyframes`
    0% {
        transform: scale(1);
    }
    50% {
        transform: scale(1.05);
    }
    100% {
        transform: scale(1);
    }
`;

// 스타일드 컴포넌트
const FeedbackContainer = styled(Box)<{ position: FeedbackPosition }>(({ theme, position }) => {
    const getPositionStyles = () => {
        switch (position) {
            case 'top':
                return { top: theme.spacing(2), left: '50%', transform: 'translateX(-50%)' };
            case 'bottom':
                return { bottom: theme.spacing(2), left: '50%', transform: 'translateX(-50%)' };
            case 'top-left':
                return { top: theme.spacing(2), left: theme.spacing(2) };
            case 'top-right':
                return { top: theme.spacing(2), right: theme.spacing(2) };
            case 'bottom-left':
                return { bottom: theme.spacing(2), left: theme.spacing(2) };
            case 'bottom-right':
                return { bottom: theme.spacing(2), right: theme.spacing(2) };
            case 'center':
                return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
            default:
                return { top: theme.spacing(2), right: theme.spacing(2) };
        }
    };

    return {
        position: 'fixed',
        zIndex: 1400,
        maxWidth: 400,
        minWidth: 300,
        ...getPositionStyles()
    };
});

const AnimatedAlert = styled(Alert)<{ animationType: AnimationType }>(({ animationType }) => {
    let animation = '';
    if (animationType === 'bounce') {
        animation = `${bounceAnimation} 0.6s ease-in-out`;
    } else if (animationType === 'shake') {
        animation = `${shakeAnimation} 0.5s ease-in-out`;
    } else if (animationType === 'pulse') {
        animation = `${pulseAnimation} 0.3s ease-in-out`;
    }
    return {
        ...(animation && { animation })
    };
});

const NotificationPanel = styled(Card)(({ theme }) => ({
    position: 'fixed',
    top: theme.spacing(8),
    right: theme.spacing(2),
    width: 350,
    maxHeight: 500,
    overflow: 'auto',
    zIndex: 1300,
    boxShadow: '0px 8px 16px rgba(0,0,0,0.12)'
}));

const QuickFeedbackContainer = styled(Box)(({ theme }) => ({
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 1500,
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 200,
    minHeight: 100,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    color: 'white',
    borderRadius: typeof theme.shape.borderRadius === 'number' ? theme.shape.borderRadius * 2 : 8,
    padding: theme.spacing(3),
    backdropFilter: 'blur(10px)'
}));

// 피드백 컨텍스트
const FeedbackContext = createContext<FeedbackContextValue | undefined>(undefined);

// 커스텀 훅
export const useFeedback = (): FeedbackContextValue => {
    const context = useContext(FeedbackContext);
    if (!context) {
        throw new Error('useFeedback must be used within FeedbackProvider');
    }
    return context;
};

// 피드백 프로바이더
interface FeedbackProviderProps {
    children: ReactNode;
}

export const FeedbackProvider: React.FC<FeedbackProviderProps> = ({ children }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const [settings, setSettings] = useState<FeedbackSettings>(() => {
        try {
            const saved = localStorage.getItem('feedback-settings');
            return saved ? { ...DEFAULT_FEEDBACK_SETTINGS, ...JSON.parse(saved) } : DEFAULT_FEEDBACK_SETTINGS;
        } catch {
            return DEFAULT_FEEDBACK_SETTINGS;
        }
    });

    const [feedbacks, setFeedbacks] = useState<FeedbackMessage[]>([]);
    const [notifications, setNotifications] = useState<NotificationMessage[]>([]);
    const [quickFeedback, setQuickFeedback] = useState<{ type: FeedbackType; message: string } | null>(null);
    const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);

    const feedbackTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());
    const audioContext = useRef<AudioContext | null>(null);

    // 오디오 컨텍스트 초기화
    useEffect(() => {
        if (settings.soundEnabled && 'AudioContext' in window) {
            audioContext.current = new AudioContext();
        }

        return () => {
            if (audioContext.current) {
                audioContext.current.close();
            }
        };
    }, [settings.soundEnabled]);

    // 사운드 재생
    const playSound = useCallback((frequency: number, duration: number) => {
        if (!settings.soundEnabled || !audioContext.current) return;

        const oscillator = audioContext.current.createOscillator();
        const gainNode = audioContext.current.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.current.destination);

        oscillator.frequency.setValueAtTime(frequency, audioContext.current.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioContext.current.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.current.currentTime + duration);

        oscillator.start();
        oscillator.stop(audioContext.current.currentTime + duration);
    }, [settings.soundEnabled]);

    // 진동 재생
    const playVibration = useCallback((pattern: number | number[]) => {
        if (settings.vibrationEnabled && 'vibrate' in navigator) {
            navigator.vibrate(pattern);
        }
    }, [settings.vibrationEnabled]);

    // 피드백 표시
    const showFeedback = useCallback((feedback: Omit<FeedbackMessage, 'id' | 'timestamp'>) => {
        if (!settings.enabled) return '';

        const id = `feedback-${Date.now()}-${Math.random()}`;
        const newFeedback: FeedbackMessage = {
            ...feedback,
            id,
            timestamp: new Date(),
            duration: feedback.duration ?? settings.defaultDuration,
            position: feedback.position ?? 'top-right',
            animation: feedback.animation ?? 'slide'
        };

        setFeedbacks(prev => [...prev, newFeedback]);

        // 사운드 및 진동 피드백
        switch (feedback.type) {
            case 'success':
                playSound(800, 0.2);
                playVibration(100);
                break;
            case 'error':
                playSound(400, 0.3);
                playVibration([100, 50, 100]);
                break;
            case 'warning':
                playSound(600, 0.2);
                playVibration(150);
                break;
            case 'info':
                playSound(500, 0.1);
                playVibration(50);
                break;
        }

        // 자동 숨김
        if (settings.autoHide && !feedback.persistent && feedback.duration) {
            const timer = setTimeout(() => {
                hideFeedback(id);
            }, feedback.duration);

            feedbackTimers.current.set(id, timer);
        }

        return id;
    }, [settings, playSound, playVibration]);

    // 피드백 숨김
    const hideFeedback = useCallback((id: string) => {
        setFeedbacks(prev => prev.filter(f => f.id !== id));

        const timer = feedbackTimers.current.get(id);
        if (timer) {
            clearTimeout(timer);
            feedbackTimers.current.delete(id);
        }
    }, []);

    // 알림 표시
    const showNotification = useCallback((notification: Omit<NotificationMessage, 'id' | 'timestamp' | 'read'>) => {
        const id = `notification-${Date.now()}-${Math.random()}`;
        const newNotification: NotificationMessage = {
            ...notification,
            id,
            timestamp: new Date(),
            read: false
        };

        setNotifications(prev => {
            const updated = [newNotification, ...prev];

            // 최대 알림 수 제한
            if (updated.length > settings.maxNotifications) {
                return updated.slice(0, settings.maxNotifications);
            }

            return updated;
        });

        // 시스템 알림 표시 (권한이 있는 경우)
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(notification.title, {
                body: notification.message,
                icon: '/favicon.ico',
                tag: id
            });
        }

        playSound(700, 0.2);
        playVibration(100);

        return id;
    }, [settings.maxNotifications, playSound, playVibration]);

    // 알림 읽음 처리
    const markNotificationRead = useCallback((id: string) => {
        setNotifications(prev => prev.map(n =>
            n.id === id ? { ...n, read: true } : n
        ));
    }, []);

    // 모든 알림 삭제
    const clearAllNotifications = useCallback(() => {
        setNotifications([]);
    }, []);

    // 진행률 표시
    const showProgress = useCallback((message: string, progress: number) => {
        return showFeedback({
            type: 'progress',
            message,
            progress,
            showProgress: true,
            persistent: true,
            icon: <ProgressIcon />
        });
    }, [showFeedback]);

    // 로딩 표시
    const showLoading = useCallback((message: string) => {
        return showFeedback({
            type: 'loading',
            message,
            persistent: true,
            icon: <CircularProgress size={20} />
        });
    }, [showFeedback]);

    // 로딩 숨김
    const hideLoading = useCallback((id: string) => {
        hideFeedback(id);
    }, [hideFeedback]);

    // 빠른 피드백 (중앙 표시)
    const showQuickFeedback = useCallback((type: FeedbackType, message: string) => {
        setQuickFeedback({ type, message });

        // 사운드 및 진동
        switch (type) {
            case 'success':
                playSound(800, 0.2);
                playVibration(100);
                break;
            case 'error':
                playSound(400, 0.3);
                playVibration([100, 50, 100]);
                break;
        }

        setTimeout(() => setQuickFeedback(null), 1500);
    }, [playSound, playVibration]);

    // 설정 업데이트
    const updateSettings = useCallback((newSettings: Partial<FeedbackSettings>) => {
        setSettings(prev => {
            const updated = { ...prev, ...newSettings };
            localStorage.setItem('feedback-settings', JSON.stringify(updated));
            return updated;
        });
    }, []);

    // 읽지 않은 알림 수
    const unreadCount = notifications.filter(n => !n.read).length;

    // 알림 권한 요청
    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    const contextValue: FeedbackContextValue = {
        showFeedback,
        hideFeedback,
        showNotification,
        markNotificationRead,
        clearAllNotifications,
        showProgress,
        showLoading,
        hideLoading,
        showQuickFeedback,
        settings,
        updateSettings,
        notifications,
        unreadCount
    };

    // 애니메이션 컴포넌트 선택
    const getAnimationComponent = (animation: AnimationType) => {
        switch (animation) {
            case 'slide': return Slide;
            case 'fade': return Fade;
            case 'grow': return Grow;
            case 'zoom': return Zoom;
            default: return Fade;
        }
    };

    return (
        <FeedbackContext.Provider value={contextValue}>
            {children}

            {/* 피드백 메시지들 */}
            {feedbacks.map(feedback => {
                const AnimationComponent = getAnimationComponent(feedback.animation!);

                return (
                    <FeedbackContainer key={feedback.id} position={feedback.position!}>
                        <AnimationComponent in={true} timeout={300}>
                            <AnimatedAlert
                                severity={feedback.type === 'loading' || feedback.type === 'progress' ? 'info' : feedback.type}
                                animationType={feedback.animation!}
                                action={
                                    <Box display="flex" alignItems="center" gap={1}>
                                        {feedback.action && (
                                            <Button
                                                size="small"
                                                onClick={feedback.action.onClick}
                                                color="inherit"
                                            >
                                                {feedback.action.label}
                                            </Button>
                                        )}
                                        {!feedback.persistent && (
                                            <IconButton
                                                size="small"
                                                onClick={() => hideFeedback(feedback.id)}
                                                color="inherit"
                                            >
                                                <CloseIcon fontSize="small" />
                                            </IconButton>
                                        )}
                                    </Box>
                                }
                                icon={feedback.icon}
                            >
                                {feedback.title && <AlertTitle>{feedback.title}</AlertTitle>}
                                {feedback.message}

                                {feedback.showProgress && feedback.progress !== undefined && (
                                    <Box sx={{ mt: 1 }}>
                                        <LinearProgress
                                            variant="determinate"
                                            value={feedback.progress}
                                        />
                                        <Typography variant="caption" sx={{ mt: 0.5 }}>
                                            {Math.round(feedback.progress)}%
                                        </Typography>
                                    </Box>
                                )}

                                {settings.showTimestamps && feedback.timestamp && (
                                    <Typography variant="caption" display="block" sx={{ mt: 0.5, opacity: 0.7 }}>
                                        {feedback.timestamp.toLocaleTimeString()}
                                    </Typography>
                                )}
                            </AnimatedAlert>
                        </AnimationComponent>
                    </FeedbackContainer>
                );
            })}

            {/* 빠른 피드백 */}
            {quickFeedback && (
                <Zoom in={true} timeout={300}>
                    <QuickFeedbackContainer>
                        <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
                            {quickFeedback.type === 'success' && <SuccessIcon sx={{ fontSize: 48 }} />}
                            {quickFeedback.type === 'error' && <ErrorIcon sx={{ fontSize: 48 }} />}
                            {quickFeedback.type === 'warning' && <WarningIcon sx={{ fontSize: 48 }} />}
                            {quickFeedback.type === 'info' && <InfoIcon sx={{ fontSize: 48 }} />}

                            <Typography variant="h6" align="center">
                                {quickFeedback.message}
                            </Typography>
                        </Box>
                    </QuickFeedbackContainer>
                </Zoom>
            )}

            {/* 알림 패널 */}
            {notificationPanelOpen && (
                <NotificationPanel>
                    <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                            <Typography variant="h6">
                                알림 ({unreadCount}개 읽지 않음)
                            </Typography>
                            <Box>
                                <Button size="small" onClick={clearAllNotifications}>
                                    모두 삭제
                                </Button>
                                <IconButton onClick={() => setNotificationPanelOpen(false)}>
                                    <CloseIcon />
                                </IconButton>
                            </Box>
                        </Box>

                        {notifications.length === 0 ? (
                            <Typography color="text.secondary" align="center">
                                알림이 없습니다.
                            </Typography>
                        ) : (
                            <Box display="flex" flexDirection="column" gap={1}>
                                {notifications.map(notification => (
                                    <Card
                                        key={notification.id}
                                        variant={notification.read ? "outlined" : "elevation"}
                                        sx={{
                                            cursor: 'pointer',
                                            opacity: notification.read ? 0.7 : 1
                                        }}
                                        onClick={() => markNotificationRead(notification.id)}
                                    >
                                        <CardContent sx={{ py: 1 }}>
                                            <Box display="flex" alignItems="flex-start" gap={2}>
                                                {notification.avatar && (
                                                    <Avatar src={notification.avatar} sx={{ width: 32, height: 32 }} />
                                                )}

                                                <Box flex={1}>
                                                    <Typography variant="subtitle2" gutterBottom>
                                                        {notification.title}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {notification.message}
                                                    </Typography>

                                                    {settings.showTimestamps && (
                                                        <Typography variant="caption" color="text.disabled">
                                                            {notification.timestamp.toLocaleString()}
                                                        </Typography>
                                                    )}

                                                    {notification.actions && (
                                                        <Box mt={1} display="flex" gap={1}>
                                                            {notification.actions.map((action, index) => (
                                                                <Button
                                                                    key={index}
                                                                    size="small"
                                                                    variant={action.primary ? "contained" : "outlined"}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        action.onClick();
                                                                    }}
                                                                >
                                                                    {action.label}
                                                                </Button>
                                                            ))}
                                                        </Box>
                                                    )}
                                                </Box>

                                                <Chip
                                                    label={notification.type}
                                                    size="small"
                                                    variant="outlined"
                                                />
                                            </Box>
                                        </CardContent>
                                    </Card>
                                ))}
                            </Box>
                        )}
                    </CardContent>
                </NotificationPanel>
            )}

            {/* 알림 버튼 */}
            <Tooltip title="알림">
                <IconButton
                    onClick={() => setNotificationPanelOpen(!notificationPanelOpen)}
                    sx={{
                        position: 'fixed',
                        top: theme.spacing(2),
                        right: theme.spacing(2),
                        zIndex: 1200
                    }}
                >
                    <Badge badgeContent={unreadCount} color="error">
                        {unreadCount > 0 ? <NotificationActiveIcon /> : <NotificationIcon />}
                    </Badge>
                </IconButton>
            </Tooltip>
        </FeedbackContext.Provider>
    );
};

// 편의 훅들
export const useQuickActions = () => {
    const { showQuickFeedback } = useFeedback();

    return {
        showSuccess: (message: string) => showQuickFeedback('success', message),
        showError: (message: string) => showQuickFeedback('error', message),
        showWarning: (message: string) => showQuickFeedback('warning', message),
        showInfo: (message: string) => showQuickFeedback('info', message)
    };
};

export const useLoadingState = () => {
    const { showLoading, hideLoading } = useFeedback();
    const [loadingIds, setLoadingIds] = useState<string[]>([]);

    const startLoading = useCallback((message: string) => {
        const id = showLoading(message);
        setLoadingIds(prev => [...prev, id]);
        return id;
    }, [showLoading]);

    const stopLoading = useCallback((id: string) => {
        hideLoading(id);
        setLoadingIds(prev => prev.filter(loadingId => loadingId !== id));
    }, [hideLoading]);

    const stopAllLoading = useCallback(() => {
        loadingIds.forEach(id => hideLoading(id));
        setLoadingIds([]);
    }, [loadingIds, hideLoading]);

    return {
        startLoading,
        stopLoading,
        stopAllLoading,
        isLoading: loadingIds.length > 0
    };
};

export default FeedbackProvider;
