/**
 * 🎨 Enhanced Design System
 * 
 * Community Platform v2.0을 위한 고도화된 디자인 시스템
 * 마이크로 인터랙션, 애니메이션, 접근성을 포함한 차세대 UI 컴포넌트
 * 
 * @author AUTOAGENTS Manager
 * @version 2.0.0
 * @created 2025-10-02
 */

import React, { useState, useCallback } from 'react';
import {
    Button,
    Card,
    TextField,
    Grid,
    Switch,
    FormControlLabel,
    Box,
    Typography,
    IconButton,
    Chip,
    Avatar,
    Badge,
    Tooltip,
    Fade,
    Slide,
    Zoom,
    CircularProgress,
    Skeleton
} from '@mui/material';
import { styled, keyframes, alpha } from '@mui/material/styles';
import {
    Favorite as FavoriteIcon,
    Share as ShareIcon,
    Comment as CommentIcon,
    Bookmark as BookmarkIcon,
    Search as SearchIcon,
    Notifications as NotificationsIcon,
    KeyboardArrowUp as ArrowUpIcon,
    Refresh as RefreshIcon
} from '@mui/icons-material';

// ============================================================================
// 애니메이션 정의
// ============================================================================

const pulseAnimation = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const shimmerAnimation = keyframes`
  0% { background-position: -200px 0; }
  100% { background-position: calc(200px + 100%) 0; }
`;

const floatAnimation = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
`;

const rippleAnimation = keyframes`
  0% { transform: scale(0); opacity: 1; }
  100% { transform: scale(4); opacity: 0; }
`;

// ============================================================================
// 고도화된 버튼 컴포넌트
// ============================================================================

interface EnhancedButtonProps {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    loading?: boolean;
    disabled?: boolean;
    icon?: React.ReactNode;
    children: React.ReactNode;
    onClick?: () => void;
    animation?: 'pulse' | 'float' | 'none';
    ripple?: boolean;
}

const EnhancedButton = styled(Button)<EnhancedButtonProps>(({ theme, variant = 'primary', size = 'md', animation = 'none', ripple = true }) => {
    const getVariantStyles = () => {
        switch (variant) {
            case 'primary':
                return {
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                    color: theme.palette.primary.contrastText,
                    boxShadow: `0 4px 15px ${alpha(theme.palette.primary.main, 0.3)}`,
                    '&:hover': {
                        background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                        boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
                        transform: 'translateY(-2px)',
                    },
                };
            case 'secondary':
                return {
                    background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`,
                    color: theme.palette.secondary.contrastText,
                    boxShadow: `0 4px 15px ${alpha(theme.palette.secondary.main, 0.3)}`,
                    '&:hover': {
                        background: `linear-gradient(135deg, ${theme.palette.secondary.dark} 0%, ${theme.palette.secondary.main} 100%)`,
                        boxShadow: `0 6px 20px ${alpha(theme.palette.secondary.main, 0.4)}`,
                        transform: 'translateY(-2px)',
                    },
                };
            case 'outline':
                return {
                    border: `2px solid ${theme.palette.primary.main}`,
                    color: theme.palette.primary.main,
                    background: 'transparent',
                    '&:hover': {
                        background: theme.palette.primary.main,
                        color: theme.palette.primary.contrastText,
                        transform: 'translateY(-2px)',
                    },
                };
            case 'ghost':
                return {
                    background: 'transparent',
                    color: theme.palette.text.primary,
                    '&:hover': {
                        background: alpha(theme.palette.primary.main, 0.1),
                        transform: 'translateY(-2px)',
                    },
                };
            case 'danger':
                return {
                    background: `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${theme.palette.error.dark} 100%)`,
                    color: theme.palette.error.contrastText,
                    boxShadow: `0 4px 15px ${alpha(theme.palette.error.main, 0.3)}`,
                    '&:hover': {
                        background: `linear-gradient(135deg, ${theme.palette.error.dark} 0%, ${theme.palette.error.main} 100%)`,
                        boxShadow: `0 6px 20px ${alpha(theme.palette.error.main, 0.4)}`,
                        transform: 'translateY(-2px)',
                    },
                };
            default:
                return {};
        }
    };

    const getSizeStyles = () => {
        switch (size) {
            case 'xs':
                return { padding: '4px 8px', fontSize: '0.75rem', minHeight: '24px' };
            case 'sm':
                return { padding: '6px 12px', fontSize: '0.875rem', minHeight: '32px' };
            case 'md':
                return { padding: '8px 16px', fontSize: '1rem', minHeight: '40px' };
            case 'lg':
                return { padding: '12px 24px', fontSize: '1.125rem', minHeight: '48px' };
            case 'xl':
                return { padding: '16px 32px', fontSize: '1.25rem', minHeight: '56px' };
            default:
                return {};
        }
    };

    const getAnimationStyles = () => {
        switch (animation) {
            case 'pulse':
                return {
                    animation: `${pulseAnimation} 2s infinite`,
                };
            case 'float':
                return {
                    animation: `${floatAnimation} 3s ease-in-out infinite`,
                };
            default:
                return {};
        }
    };

    return {
        borderRadius: '12px',
        fontWeight: 600,
        textTransform: 'none',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow: 'hidden',
        ...getVariantStyles(),
        ...getSizeStyles(),
        ...getAnimationStyles(),
        '&:active': {
            transform: 'translateY(0px)',
        },
        '&:focus': {
            outline: `2px solid ${theme.palette.primary.main}`,
            outlineOffset: '2px',
        },
        ...(ripple && {
            '&::before': {
                content: '""',
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: '0',
                height: '0',
                borderRadius: '50%',
                background: alpha(theme.palette.common.white, 0.3),
                transform: 'translate(-50%, -50%)',
                transition: 'width 0.6s, height 0.6s',
            },
            '&:active::before': {
                width: '300px',
                height: '300px',
            },
        }),
    };
});

// ============================================================================
// 고도화된 카드 컴포넌트
// ============================================================================

interface EnhancedCardProps {
    variant?: 'default' | 'elevated' | 'outlined' | 'filled';
    padding?: 'none' | 'sm' | 'md' | 'lg';
    children: React.ReactNode;
    onClick?: () => void;
    hover?: boolean;
    loading?: boolean;
}

const EnhancedCard = styled(Card)<EnhancedCardProps>(({ theme, variant = 'default', padding = 'md', hover = true, loading = false }) => {
    const getVariantStyles = () => {
        switch (variant) {
            case 'elevated':
                return {
                    boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.12)}`,
                    '&:hover': hover ? {
                        boxShadow: `0 12px 40px ${alpha(theme.palette.common.black, 0.16)}`,
                        transform: 'translateY(-4px)',
                    } : {},
                };
            case 'outlined':
                return {
                    border: `1px solid ${theme.palette.divider}`,
                    boxShadow: 'none',
                    '&:hover': hover ? {
                        borderColor: theme.palette.primary.main,
                        boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.1)}`,
                    } : {},
                };
            case 'filled':
                return {
                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                    '&:hover': hover ? {
                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    } : {},
                };
            default:
                return {
                    boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.08)}`,
                    '&:hover': hover ? {
                        boxShadow: `0 4px 16px ${alpha(theme.palette.common.black, 0.12)}`,
                        transform: 'translateY(-2px)',
                    } : {},
                };
        }
    };

    const getPaddingStyles = () => {
        switch (padding) {
            case 'none':
                return { padding: 0 };
            case 'sm':
                return { padding: theme.spacing(1) };
            case 'md':
                return { padding: theme.spacing(2) };
            case 'lg':
                return { padding: theme.spacing(3) };
            default:
                return { padding: theme.spacing(2) };
        }
    };

    return {
        borderRadius: '16px',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        ...getVariantStyles(),
        ...getPaddingStyles(),
        ...(loading && {
            '&::after': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: `linear-gradient(90deg, transparent, ${alpha(theme.palette.common.white, 0.4)}, transparent)`,
                animation: `${shimmerAnimation} 1.5s infinite`,
            },
        }),
    };
});

// ============================================================================
// 인터랙티브 액션 버튼들
// ============================================================================

interface ActionButtonProps {
    icon: React.ReactNode;
    count?: number;
    active?: boolean;
    onClick?: () => void;
    tooltip?: string;
    color?: 'primary' | 'secondary' | 'error' | 'success';
}

const ActionButton: React.FC<ActionButtonProps> = ({
    icon,
    count = 0,
    active = false,
    onClick,
    tooltip,
    color = 'primary'
}) => {
    const [isAnimating, setIsAnimating] = useState(false);

    const handleClick = useCallback(() => {
        setIsAnimating(true);
        setTimeout(() => setIsAnimating(false), 300);
        onClick?.();
    }, [onClick]);

    return (
        <Tooltip title={tooltip} arrow>
            <IconButton
                onClick={handleClick}
                sx={{
                    position: 'relative',
                    transition: 'all 0.2s ease',
                    transform: isAnimating ? 'scale(1.2)' : 'scale(1)',
                    color: active ? `${color}.main` : 'text.secondary',
                    '&:hover': {
                        backgroundColor: `${color}.light`,
                        color: `${color}.main`,
                        transform: 'scale(1.1)',
                    },
                }}
            >
                <Badge badgeContent={count} color={color as any} max={99}>
                    {icon}
                </Badge>
            </IconButton>
        </Tooltip>
    );
};

// ============================================================================
// 로딩 스켈레톤 컴포넌트
// ============================================================================

const LoadingSkeleton = styled(Skeleton)(({ theme }) => ({
    borderRadius: '8px',
    background: `linear-gradient(90deg, ${alpha(theme.palette.grey[300], 0.2)} 25%, ${alpha(theme.palette.grey[300], 0.4)} 50%, ${alpha(theme.palette.grey[300], 0.2)} 75%)`,
    backgroundSize: '200% 100%',
    animation: `${shimmerAnimation} 1.5s infinite`,
}));

// ============================================================================
// 메인 Enhanced Design System 컴포넌트
// ============================================================================

const EnhancedDesignSystem: React.FC = () => {
    const [darkMode, setDarkMode] = useState(false);
    const [loading, setLoading] = useState(false);
    const [likes, setLikes] = useState(42);
    const [shares, setShares] = useState(8);
    const [comments, setComments] = useState(15);
    const [bookmarks, setBookmarks] = useState(3);

    const handleLike = () => setLikes(prev => prev + 1);
    const handleShare = () => setShares(prev => prev + 1);
    const handleComment = () => setComments(prev => prev + 1);
    const handleBookmark = () => setBookmarks(prev => prev + 1);

    const simulateLoading = () => {
        setLoading(true);
        setTimeout(() => setLoading(false), 2000);
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
                🎨 Enhanced Design System v2.0
            </Typography>

            {/* 버튼 섹션 */}
            <Box sx={{ mb: 6 }}>
                <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
                    ✨ Enhanced Buttons
                </Typography>
                <Grid container spacing={3}>
                    <Box sx={{ width: { xs: '100%', md: '50%' }, p: 1 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <EnhancedButton variant="primary" size="lg" animation="pulse">
                                Primary Pulse
                            </EnhancedButton>
                            <EnhancedButton variant="secondary" size="md" animation="float">
                                Secondary Float
                            </EnhancedButton>
                            <EnhancedButton variant="outline" size="sm" ripple>
                                Outline Ripple
                            </EnhancedButton>
                            <EnhancedButton variant="ghost" size="xs">
                                Ghost Button
                            </EnhancedButton>
                            <EnhancedButton variant="danger" loading={loading} onClick={simulateLoading}>
                                {loading ? 'Loading...' : 'Danger Button'}
                            </EnhancedButton>
                        </Box>
                    </Box>
                    <Box sx={{ width: { xs: '100%', md: '50%' }, p: 1 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <EnhancedButton variant="primary" icon={<SearchIcon />}>
                                With Icon
                            </EnhancedButton>
                            <EnhancedButton variant="secondary" disabled>
                                Disabled Button
                            </EnhancedButton>
                            <EnhancedButton variant="outline" size="xl">
                                Extra Large
                            </EnhancedButton>
                        </Box>
                    </Box>
                </Grid>
            </Box>

            {/* 카드 섹션 */}
            <Box sx={{ mb: 6 }}>
                <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
                    🃏 Enhanced Cards
                </Typography>
                <Grid container spacing={3}>
                    <Box sx={{ width: { xs: '100%', md: '33.33%' }, p: 1 }}>
                        <EnhancedCard variant="elevated" hover>
                            <Typography variant="h6" gutterBottom>
                                Elevated Card
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                This card has enhanced elevation and hover effects.
                            </Typography>
                        </EnhancedCard>
                    </Box>
                    <Box sx={{ width: { xs: '100%', md: '33.33%' }, p: 1 }}>
                        <EnhancedCard variant="outlined" hover>
                            <Typography variant="h6" gutterBottom>
                                Outlined Card
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                This card has a subtle border and hover effects.
                            </Typography>
                        </EnhancedCard>
                    </Box>
                    <Box sx={{ width: { xs: '100%', md: '33.33%' }, p: 1 }}>
                        <EnhancedCard variant="filled" hover>
                            <Typography variant="h6" gutterBottom>
                                Filled Card
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                This card has a filled background with primary color.
                            </Typography>
                        </EnhancedCard>
                    </Box>
                </Grid>
            </Box>

            {/* 인터랙티브 액션 섹션 */}
            <Box sx={{ mb: 6 }}>
                <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
                    🎯 Interactive Actions
                </Typography>
                <EnhancedCard variant="elevated" padding="lg">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>U</Avatar>
                        <Box>
                            <Typography variant="subtitle1" fontWeight="bold">
                                Sample Post
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                This is a sample post with interactive action buttons.
                            </Typography>
                        </Box>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ActionButton
                            icon={<FavoriteIcon />}
                            count={likes}
                            active={likes > 42}
                            onClick={handleLike}
                            tooltip="Like this post"
                            color="error"
                        />
                        <ActionButton
                            icon={<ShareIcon />}
                            count={shares}
                            onClick={handleShare}
                            tooltip="Share this post"
                            color="primary"
                        />
                        <ActionButton
                            icon={<CommentIcon />}
                            count={comments}
                            onClick={handleComment}
                            tooltip="Comment on this post"
                            color="secondary"
                        />
                        <ActionButton
                            icon={<BookmarkIcon />}
                            count={bookmarks}
                            active={bookmarks > 3}
                            onClick={handleBookmark}
                            tooltip="Bookmark this post"
                            color="success"
                        />
                    </Box>
                </EnhancedCard>
            </Box>

            {/* 로딩 스켈레톤 섹션 */}
            <Box sx={{ mb: 6 }}>
                <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
                    ⏳ Loading Skeletons
                </Typography>
                <Grid container spacing={3}>
                    <Box sx={{ width: { xs: '100%', md: '50%' }, p: 1 }}>
                        <EnhancedCard variant="outlined" padding="md">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                <LoadingSkeleton variant="circular" width={40} height={40} />
                                <Box sx={{ flex: 1 }}>
                                    <LoadingSkeleton variant="text" width="60%" height={20} />
                                    <LoadingSkeleton variant="text" width="40%" height={16} />
                                </Box>
                            </Box>
                            <LoadingSkeleton variant="rectangular" height={200} sx={{ mb: 2 }} />
                            <LoadingSkeleton variant="text" width="100%" height={16} />
                            <LoadingSkeleton variant="text" width="80%" height={16} />
                        </EnhancedCard>
                    </Box>
                    <Box sx={{ width: { xs: '100%', md: '50%' }, p: 1 }}>
                        <EnhancedCard variant="filled" padding="md">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                <LoadingSkeleton variant="circular" width={40} height={40} />
                                <Box sx={{ flex: 1 }}>
                                    <LoadingSkeleton variant="text" width="60%" height={20} />
                                    <LoadingSkeleton variant="text" width="40%" height={16} />
                                </Box>
                            </Box>
                            <LoadingSkeleton variant="rectangular" height={200} sx={{ mb: 2 }} />
                            <LoadingSkeleton variant="text" width="100%" height={16} />
                            <LoadingSkeleton variant="text" width="80%" height={16} />
                        </EnhancedCard>
                    </Box>
                </Grid>
            </Box>

            {/* 설정 섹션 */}
            <Box sx={{ mb: 6 }}>
                <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
                    ⚙️ Settings
                </Typography>
                <EnhancedCard variant="elevated" padding="lg">
                    <FormControlLabel
                        control={
                            <Switch
                                checked={darkMode}
                                onChange={(e) => setDarkMode(e.target.checked)}
                                sx={{
                                    '& .MuiSwitch-switchBase.Mui-checked': {
                                        color: 'primary.main',
                                    },
                                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                        backgroundColor: 'primary.main',
                                    },
                                }}
                            />
                        }
                        label="Dark Mode"
                    />
                    <Box sx={{ mt: 2 }}>
                        <Chip label="Enhanced UI" color="primary" sx={{ mr: 1 }} />
                        <Chip label="Micro Interactions" color="secondary" sx={{ mr: 1 }} />
                        <Chip label="Accessibility" color="success" />
                    </Box>
                </EnhancedCard>
            </Box>

            {/* 스크롤 투 탑 버튼 */}
            <Fade in={true}>
                <IconButton
                    sx={{
                        position: 'fixed',
                        bottom: 24,
                        right: 24,
                        backgroundColor: 'primary.main',
                        color: 'white',
                        '&:hover': {
                            backgroundColor: 'primary.dark',
                            transform: 'scale(1.1)',
                        },
                        transition: 'all 0.3s ease',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    }}
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                    <ArrowUpIcon />
                </IconButton>
            </Fade>
        </Box>
    );
};

export default EnhancedDesignSystem;
