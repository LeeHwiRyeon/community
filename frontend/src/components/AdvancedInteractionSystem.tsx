/**
 * 🎯 Advanced Interaction System
 * 
 * Community Platform v2.0을 위한 고급 인터랙션 시스템
 * 제스처, 애니메이션, 피드백을 포함한 차세대 사용자 경험
 * 
 * @author AUTOAGENTS Manager
 * @version 2.0.0
 * @created 2025-10-02
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    Box,
    Typography,
    IconButton,
    Card,
    Chip,
    Avatar,
    Badge,
    Tooltip,
    Fade,
    Slide,
    Zoom,
    Grow,
    Collapse,
    Paper,
    Stack,
    Grid
} from '@mui/material';
import { styled, keyframes, alpha } from '@mui/material/styles';
import {
    TouchApp as TouchIcon,
    Gesture as GestureIcon,
    Animation as AnimationIcon,
    Feedback as FeedbackIcon,
    Swipe as SwipeIcon,
    ZoomIn as ZoomIcon,
    Refresh as RefreshIcon,
    Favorite as FavoriteIcon,
    Share as ShareIcon,
    Comment as CommentIcon
} from '@mui/icons-material';

// ============================================================================
// 고급 애니메이션 정의
// ============================================================================

const bounceIn = keyframes`
  0% { transform: scale(0.3); opacity: 0; }
  50% { transform: scale(1.05); }
  70% { transform: scale(0.9); }
  100% { transform: scale(1); opacity: 1; }
`;

const slideInFromLeft = keyframes`
  0% { transform: translateX(-100%); opacity: 0; }
  100% { transform: translateX(0); opacity: 1; }
`;

const slideInFromRight = keyframes`
  0% { transform: translateX(100%); opacity: 0; }
  100% { transform: translateX(0); opacity: 1; }
`;

const slideInFromTop = keyframes`
  0% { transform: translateY(-100%); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
`;

const slideInFromBottom = keyframes`
  0% { transform: translateY(100%); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
`;

const rotateIn = keyframes`
  0% { transform: rotate(-200deg); opacity: 0; }
  100% { transform: rotate(0deg); opacity: 1; }
`;

const flipIn = keyframes`
  0% { transform: perspective(400px) rotateY(90deg); opacity: 0; }
  40% { transform: perspective(400px) rotateY(-20deg); }
  60% { transform: perspective(400px) rotateY(10deg); }
  80% { transform: perspective(400px) rotateY(-5deg); }
  100% { transform: perspective(400px) rotateY(0deg); opacity: 1; }
`;

const shake = keyframes`
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
  20%, 40%, 60%, 80% { transform: translateX(10px); }
`;

const glow = keyframes`
  0%, 100% { box-shadow: 0 0 5px rgba(25, 118, 210, 0.5); }
  50% { box-shadow: 0 0 20px rgba(25, 118, 210, 0.8), 0 0 30px rgba(25, 118, 210, 0.6); }
`;

// ============================================================================
// 제스처 감지 훅
// ============================================================================

interface GestureState {
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    deltaX: number;
    deltaY: number;
    isDragging: boolean;
    direction: 'left' | 'right' | 'up' | 'down' | null;
}

const useGesture = (elementRef: React.RefObject<HTMLElement>) => {
    const [gestureState, setGestureState] = useState<GestureState>({
        startX: 0,
        startY: 0,
        currentX: 0,
        currentY: 0,
        deltaX: 0,
        deltaY: 0,
        isDragging: false,
        direction: null,
    });

    const handleStart = useCallback((e: TouchEvent | MouseEvent) => {
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

        setGestureState(prev => ({
            ...prev,
            startX: clientX,
            startY: clientY,
            currentX: clientX,
            currentY: clientY,
            isDragging: true,
        }));
    }, []);

    const handleMove = useCallback((e: TouchEvent | MouseEvent) => {
        if (!gestureState.isDragging) return;

        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

        const deltaX = clientX - gestureState.startX;
        const deltaY = clientY - gestureState.startY;

        let direction: GestureState['direction'] = null;
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            direction = deltaX > 0 ? 'right' : 'left';
        } else {
            direction = deltaY > 0 ? 'down' : 'up';
        }

        setGestureState(prev => ({
            ...prev,
            currentX: clientX,
            currentY: clientY,
            deltaX,
            deltaY,
            direction,
        }));
    }, [gestureState.isDragging, gestureState.startX, gestureState.startY]);

    const handleEnd = useCallback(() => {
        setGestureState(prev => ({
            ...prev,
            isDragging: false,
            direction: null,
        }));
    }, []);

    useEffect(() => {
        const element = elementRef.current;
        if (!element) return;

        element.addEventListener('touchstart', handleStart, { passive: false });
        element.addEventListener('touchmove', handleMove, { passive: false });
        element.addEventListener('touchend', handleEnd);
        element.addEventListener('mousedown', handleStart);
        element.addEventListener('mousemove', handleMove);
        element.addEventListener('mouseup', handleEnd);

        return () => {
            element.removeEventListener('touchstart', handleStart);
            element.removeEventListener('touchmove', handleMove);
            element.removeEventListener('touchend', handleEnd);
            element.removeEventListener('mousedown', handleStart);
            element.removeEventListener('mousemove', handleMove);
            element.removeEventListener('mouseup', handleEnd);
        };
    }, [elementRef, handleStart, handleMove, handleEnd]);

    return gestureState;
};

// ============================================================================
// 애니메이션 카드 컴포넌트
// ============================================================================

interface AnimatedCardProps {
    animation?: 'bounceIn' | 'slideInLeft' | 'slideInRight' | 'slideInTop' | 'slideInBottom' | 'rotateIn' | 'flipIn' | 'shake' | 'glow';
    delay?: number;
    duration?: number;
    children: React.ReactNode;
    onClick?: () => void;
}

const AnimatedCard = styled(Card)<AnimatedCardProps>(({ theme, animation = 'bounceIn', delay = 0, duration = 0.6 }) => {
    const getAnimation = () => {
        switch (animation) {
            case 'bounceIn':
                return bounceIn;
            case 'slideInLeft':
                return slideInFromLeft;
            case 'slideInRight':
                return slideInFromRight;
            case 'slideInTop':
                return slideInFromTop;
            case 'slideInBottom':
                return slideInFromBottom;
            case 'rotateIn':
                return rotateIn;
            case 'flipIn':
                return flipIn;
            case 'shake':
                return shake;
            case 'glow':
                return glow;
            default:
                return bounceIn;
        }
    };

    return {
        animation: `${getAnimation()} ${duration}s ease-out ${delay}s both`,
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: `0 8px 25px ${alpha(theme.palette.common.black, 0.15)}`,
        },
    };
});

// ============================================================================
// 인터랙티브 버튼 컴포넌트
// ============================================================================

interface InteractiveButtonProps {
    icon: React.ReactNode;
    label: string;
    onClick?: () => void;
    variant?: 'primary' | 'secondary' | 'success' | 'error';
    animation?: 'bounce' | 'pulse' | 'glow' | 'shake';
}

const InteractiveButton: React.FC<InteractiveButtonProps> = ({
    icon,
    label,
    onClick,
    variant = 'primary',
    animation = 'bounce'
}) => {
    const [isAnimating, setIsAnimating] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);

    const handleClick = useCallback(() => {
        setIsAnimating(true);
        setTimeout(() => setIsAnimating(false), 300);
        onClick?.();
    }, [onClick]);

    const getAnimationStyle = () => {
        if (!isAnimating) return {};

        switch (animation) {
            case 'bounce':
                return { animation: `${bounceIn} 0.6s ease` };
            case 'pulse':
                return { transform: 'scale(1.1)' };
            case 'glow':
                return { animation: `${glow} 0.5s ease` };
            case 'shake':
                return { animation: `${shake} 0.5s ease` };
            default:
                return {};
        }
    };

    return (
        <Tooltip title={label} arrow>
            <IconButton
                ref={buttonRef}
                onClick={handleClick}
                sx={{
                    position: 'relative',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    backgroundColor: `${variant}.main`,
                    color: `${variant}.contrastText`,
                    '&:hover': {
                        backgroundColor: `${variant}.dark`,
                        transform: 'scale(1.05)',
                    },
                    ...getAnimationStyle(),
                }}
            >
                {icon}
            </IconButton>
        </Tooltip>
    );
};

// ============================================================================
// 제스처 데모 컴포넌트
// ============================================================================

const GestureDemo: React.FC = () => {
    const cardRef = useRef<HTMLDivElement>(null);
    const gesture = useGesture(cardRef);
    const [gestureHistory, setGestureHistory] = useState<string[]>([]);

    useEffect(() => {
        if (gesture.direction && !gesture.isDragging) {
            const newGesture = `Swipe ${gesture.direction} (${Math.abs(gesture.deltaX)}, ${Math.abs(gesture.deltaY)})`;
            setGestureHistory(prev => [newGesture, ...prev.slice(0, 4)]);
        }
    }, [gesture.direction, gesture.deltaX, gesture.deltaY, gesture.isDragging]);

    return (
        <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
                🎯 Gesture Demo
            </Typography>
            <Card
                ref={cardRef}
                sx={{
                    p: 3,
                    mb: 2,
                    backgroundColor: gesture.isDragging ? 'action.hover' : 'background.paper',
                    transition: 'all 0.2s ease',
                    transform: gesture.isDragging ? 'scale(1.02)' : 'scale(1)',
                    border: gesture.isDragging ? '2px solid' : '1px solid',
                    borderColor: gesture.isDragging ? 'primary.main' : 'divider',
                }}
            >
                <Typography variant="body1" gutterBottom>
                    Try swiping or dragging this card!
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Delta: ({gesture.deltaX}, {gesture.deltaY})
                </Typography>
                {gesture.direction && (
                    <Chip
                        label={`Direction: ${gesture.direction}`}
                        color="primary"
                        size="small"
                        sx={{ mt: 1 }}
                    />
                )}
            </Card>

            {gestureHistory.length > 0 && (
                <Box>
                    <Typography variant="subtitle2" gutterBottom>
                        Recent Gestures:
                    </Typography>
                    {gestureHistory.map((gesture, index) => (
                        <Chip
                            key={index}
                            label={gesture}
                            size="small"
                            sx={{ mr: 1, mb: 1 }}
                        />
                    ))}
                </Box>
            )}
        </Box>
    );
};

// ============================================================================
// 메인 Advanced Interaction System 컴포넌트
// ============================================================================

const AdvancedInteractionSystem: React.FC = () => {
    const [activeAnimations, setActiveAnimations] = useState<string[]>([]);
    const [likes, setLikes] = useState(42);
    const [shares, setShares] = useState(8);
    const [comments, setComments] = useState(15);

    const handleAnimation = (animationName: string) => {
        setActiveAnimations(prev => [...prev, animationName]);
        setTimeout(() => {
            setActiveAnimations(prev => prev.filter(name => name !== animationName));
        }, 1000);
    };

    const handleLike = () => {
        setLikes(prev => prev + 1);
        handleAnimation('like');
    };

    const handleShare = () => {
        setShares(prev => prev + 1);
        handleAnimation('share');
    };

    const handleComment = () => {
        setComments(prev => prev + 1);
        handleAnimation('comment');
    };

    return (
        <Box sx={{ p: 4, maxWidth: 1200, mx: 'auto' }}>
            <Typography variant="h3" component="h1" gutterBottom sx={{
                background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: 'bold',
                mb: 4
            }}>
                🎯 Advanced Interaction System v2.0
            </Typography>

            {/* 애니메이션 카드 섹션 */}
            <Box sx={{ mb: 6 }}>
                <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
                    ✨ Animation Cards
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                    <Box sx={{ flex: '1 1 300px', minWidth: 300 }}>
                        <AnimatedCard animation="bounceIn" delay={0}>
                            <Box sx={{ p: 2, textAlign: 'center' }}>
                                <TouchIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                                <Typography variant="h6">Bounce In</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Smooth bounce animation
                                </Typography>
                            </Box>
                        </AnimatedCard>
                    </Box>
                    <Box sx={{ flex: '1 1 300px', minWidth: 300 }}>
                        <AnimatedCard animation="slideInLeft" delay={0.1}>
                            <Box sx={{ p: 2, textAlign: 'center' }}>
                                <SwipeIcon sx={{ fontSize: 40, color: 'secondary.main', mb: 1 }} />
                                <Typography variant="h6">Slide Left</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Slide from left animation
                                </Typography>
                            </Box>
                        </AnimatedCard>
                    </Box>
                    <Box sx={{ flex: '1 1 300px', minWidth: 300 }}>
                        <AnimatedCard animation="rotateIn" delay={0.2}>
                            <Box sx={{ p: 2, textAlign: 'center' }}>
                                <RefreshIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                                <Typography variant="h6">Rotate In</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Rotate entrance animation
                                </Typography>
                            </Box>
                        </AnimatedCard>
                    </Box>
                    <Box sx={{ flex: '1 1 300px', minWidth: 300 }}>
                        <AnimatedCard animation="flipIn" delay={0.3}>
                            <Box sx={{ p: 2, textAlign: 'center' }}>
                                <AnimationIcon sx={{ fontSize: 40, color: 'error.main', mb: 1 }} />
                                <Typography variant="h6">Flip In</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    3D flip animation
                                </Typography>
                            </Box>
                        </AnimatedCard>
                    </Box>
                </Box>
            </Box>

            {/* 제스처 데모 섹션 */}
            <GestureDemo />

            {/* 인터랙티브 액션 섹션 */}
            <Box sx={{ mb: 6 }}>
                <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
                    🎮 Interactive Actions
                </Typography>
                <Card sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>U</Avatar>
                        <Box>
                            <Typography variant="subtitle1" fontWeight="bold">
                                Interactive Post
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Try the interactive buttons below!
                            </Typography>
                        </Box>
                    </Box>

                    <Stack direction="row" spacing={2} alignItems="center">
                        <InteractiveButton
                            icon={<FavoriteIcon />}
                            label="Like"
                            onClick={handleLike}
                            variant="error"
                            animation="bounce"
                        />
                        <Badge badgeContent={likes} color="error">
                            <Typography variant="body2">Likes</Typography>
                        </Badge>

                        <InteractiveButton
                            icon={<ShareIcon />}
                            label="Share"
                            onClick={handleShare}
                            variant="primary"
                            animation="pulse"
                        />
                        <Badge badgeContent={shares} color="primary">
                            <Typography variant="body2">Shares</Typography>
                        </Badge>

                        <InteractiveButton
                            icon={<CommentIcon />}
                            label="Comment"
                            onClick={handleComment}
                            variant="secondary"
                            animation="glow"
                        />
                        <Badge badgeContent={comments} color="secondary">
                            <Typography variant="body2">Comments</Typography>
                        </Badge>
                    </Stack>
                </Card>
            </Box>

            {/* 애니메이션 트리거 섹션 */}
            <Box sx={{ mb: 6 }}>
                <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
                    🎬 Animation Triggers
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    <Box sx={{ flex: '1 1 200px', minWidth: 200 }}>
                        <Card
                            sx={{
                                p: 2,
                                textAlign: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                '&:hover': { transform: 'scale(1.05)' }
                            }}
                            onClick={() => handleAnimation('shake')}
                        >
                            <GestureIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                            <Typography variant="h6">Shake</Typography>
                        </Card>
                    </Box>
                    <Box sx={{ flex: '1 1 200px', minWidth: 200 }}>
                        <Card
                            sx={{
                                p: 2,
                                textAlign: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                '&:hover': { transform: 'scale(1.05)' }
                            }}
                            onClick={() => handleAnimation('glow')}
                        >
                            <ZoomIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
                            <Typography variant="h6">Glow</Typography>
                        </Card>
                    </Box>
                    <Box sx={{ flex: '1 1 200px', minWidth: 200 }}>
                        <Card
                            sx={{
                                p: 2,
                                textAlign: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                '&:hover': { transform: 'scale(1.05)' }
                            }}
                            onClick={() => handleAnimation('bounce')}
                        >
                            <FeedbackIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                            <Typography variant="h6">Bounce</Typography>
                        </Card>
                    </Box>
                    <Box sx={{ flex: '1 1 200px', minWidth: 200 }}>
                        <Card
                            sx={{
                                p: 2,
                                textAlign: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                '&:hover': { transform: 'scale(1.05)' }
                            }}
                            onClick={() => handleAnimation('pulse')}
                        >
                            <AnimationIcon sx={{ fontSize: 40, color: 'error.main', mb: 1 }} />
                            <Typography variant="h6">Pulse</Typography>
                        </Card>
                    </Box>
                </Box>
            </Box>

            {/* 활성 애니메이션 표시 */}
            {activeAnimations.length > 0 && (
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h6" gutterBottom>
                        🎭 Active Animations
                    </Typography>
                    <Stack direction="row" spacing={1}>
                        {activeAnimations.map((animation, index) => (
                            <Chip
                                key={index}
                                label={animation}
                                color="primary"
                                variant="outlined"
                            />
                        ))}
                    </Stack>
                </Box>
            )}
        </Box>
    );
};

export default AdvancedInteractionSystem;
