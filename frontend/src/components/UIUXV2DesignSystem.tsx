/**
 * 🎨 Unified Design System v2.1
 * 
 * Community Platform v2.0을 위한 통합 디자인 시스템
 * Enhanced + UIUX v2 완전 통합 버전
 * 
 * 주요 기능:
 * - 통합 버튼 (6 variants, 5 sizes, 3 animations, ripple)
 * - 적응형 카드 (5 variants, glassmorphism, loading)
 * - 액션 버튼 (Badge, Tooltip, Active state)
 * - 커스텀 로딩 스켈레톤 (Shimmer animation)
 * - 스마트 입력 필드 (자동완성, 로딩)
 * - 동적 테마 시스템 (실시간 컬러 변경, 다크 모드)
 * 
 * @author AUTOAGENTS Manager
 * @version 2.1.0
 * @updated 2025-11-10
 * @created 2025-10-02
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Typography,
    Button,
    Card,
    TextField,
    Switch,
    FormControlLabel,
    IconButton,
    Chip,
    Avatar,
    Badge,
    Tooltip,
    Fade,
    Slide,
    Zoom,
    CircularProgress,
    Skeleton,
    Paper,
    Stack,
    Divider,
    Slider,
    Select,
    MenuItem,
    FormControl,
    InputLabel
} from '@mui/material';
import { styled, keyframes, alpha, createTheme, ThemeProvider } from '@mui/material/styles';
import {
    Palette as PaletteIcon,
    TextFields as TypographyIcon,
    SpaceBar as SpaceIcon,
    Animation as AnimationIcon,
    TouchApp as TouchIcon,
    Accessibility as AccessibilityIcon,
    Speed as SpeedIcon,
    AutoAwesome as AutoAwesomeIcon,
    Language as LanguageIcon,
    DarkMode as DarkModeIcon,
    LightMode as LightModeIcon,
    Refresh as RefreshIcon,
    Favorite as FavoriteIcon,
    Share as ShareIcon,
    Comment as CommentIcon,
    Bookmark as BookmarkIcon,
    Search as SearchIcon,
    Notifications as NotificationsIcon,
    KeyboardArrowUp as ArrowUpIcon,
    Settings as SettingsIcon,
    ColorLens as ColorLensIcon,
    TextFields as TextFieldsIcon,
    FormatSize as FormatSizeIcon,
    ViewInAr as ViewInArIcon,
    Gesture as GestureIcon,
    Swipe as SwipeIcon,
    ZoomIn as ZoomIcon,
    Feedback as FeedbackIcon
} from '@mui/icons-material';

// ============================================================================
// 동적 컬러 시스템
// ============================================================================

const createDynamicTheme = (primaryColor: string, isDark: boolean) => {
    return createTheme({
        palette: {
            mode: isDark ? 'dark' : 'light',
            primary: {
                main: primaryColor,
                light: alpha(primaryColor, 0.7),
                dark: alpha(primaryColor, 0.9),
                contrastText: isDark ? '#ffffff' : '#000000',
            },
            secondary: {
                main: '#d946ef',
                light: alpha('#d946ef', 0.7),
                dark: alpha('#d946ef', 0.9),
                contrastText: isDark ? '#ffffff' : '#000000',
            },
            background: {
                default: isDark ? '#0f172a' : '#ffffff',
                paper: isDark ? '#1e293b' : '#f8fafc',
            },
            text: {
                primary: isDark ? '#f8fafc' : '#1f2937',
                secondary: isDark ? '#64748b' : '#6b7280',
            },
        },
        typography: {
            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            h1: {
                fontSize: 'clamp(2.25rem, 1.9rem + 1.75vw, 3rem)',
                fontWeight: 700,
                lineHeight: 1.2,
            },
            h2: {
                fontSize: 'clamp(1.875rem, 1.6rem + 1.375vw, 2.25rem)',
                fontWeight: 600,
                lineHeight: 1.3,
            },
            h3: {
                fontSize: 'clamp(1.5rem, 1.3rem + 1vw, 1.875rem)',
                fontWeight: 600,
                lineHeight: 1.4,
            },
            body1: {
                fontSize: 'clamp(1rem, 0.9rem + 0.5vw, 1.125rem)',
                lineHeight: 1.6,
            },
            body2: {
                fontSize: 'clamp(0.875rem, 0.8rem + 0.375vw, 1rem)',
                lineHeight: 1.5,
            },
        },
        spacing: 8,
        shape: {
            borderRadius: 12,
        },
    });
};

// ============================================================================
// 고급 애니메이션 정의
// ============================================================================

const morphingAnimation = keyframes`
  0% { border-radius: 12px; }
  25% { border-radius: 24px; }
  50% { border-radius: 12px; }
  75% { border-radius: 8px; }
  100% { border-radius: 12px; }
`;

const gradientShift = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const floatingAnimation = keyframes`
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  33% { transform: translateY(-10px) rotate(1deg); }
  66% { transform: translateY(5px) rotate(-1deg); }
`;

const pulseGlow = keyframes`
  0%, 100% { 
    box-shadow: 0 0 5px rgba(14, 165, 233, 0.5);
    transform: scale(1);
  }
  50% { 
    box-shadow: 0 0 20px rgba(14, 165, 233, 0.8), 0 0 30px rgba(14, 165, 233, 0.6);
    transform: scale(1.05);
  }
`;

const shimmerEffect = keyframes`
  0% { background-position: -200px 0; }
  100% { background-position: calc(200px + 100%) 0; }
`;

// ============================================================================
// 통합 버튼 컴포넌트 (Enhanced + UIUX v2)
// ============================================================================

interface UnifiedButtonProps {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'gradient';
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    loading?: boolean;
    disabled?: boolean;
    icon?: React.ReactNode;
    children: React.ReactNode;
    onClick?: () => void;
    animation?: 'pulse' | 'float' | 'morphing' | 'none';
    ripple?: boolean;
    gradient?: boolean;
    fullWidth?: boolean;
    as?: React.ElementType;
}

const UnifiedButton: React.FC<UnifiedButtonProps> = ({
    variant = 'primary',
    size = 'md',
    loading,
    disabled,
    icon,
    children,
    onClick,
    animation = 'none',
    ripple = true,
    fullWidth = false
}) => {
    return (
        <StyledUnifiedButton
            customVariant={variant}
            customSize={size}
            customAnimation={animation}
            customRipple={ripple}
            disabled={disabled || loading}
            onClick={onClick}
            fullWidth={fullWidth}
        >
            {icon && <Box component="span" sx={{ mr: 1, display: 'inline-flex' }}>{icon}</Box>}
            {children}
            {loading && <CircularProgress size={16} sx={{ ml: 1 }} />}
        </StyledUnifiedButton>
    );
};

interface StyledUnifiedButtonProps {
    customVariant: string;
    customSize: string;
    customAnimation: string;
    customRipple: boolean;
}

const pulseAnimation = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const floatAnimation = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
`;

const StyledUnifiedButton = styled(Button)<StyledUnifiedButtonProps>(({ theme, customVariant, customSize, customAnimation, customRipple }) => {
    const getVariantStyles = () => {
        switch (customVariant) {
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
            case 'gradient':
                return {
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: '#ffffff',
                    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                    '&:hover': {
                        background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                        boxShadow: '0 6px 20px rgba(102, 126, 234, 0.6)',
                        transform: 'translateY(-2px)',
                    },
                };
            default:
                return {};
        }
    };

    const getSizeStyles = () => {
        switch (customSize) {
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
        switch (customAnimation) {
            case 'pulse':
                return { animation: `${pulseAnimation} 2s infinite` };
            case 'float':
                return { animation: `${floatAnimation} 3s ease-in-out infinite` };
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
        ...(customRipple && {
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
// 인터랙티브 액션 버튼 (Enhanced에서 추가)
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
// 커스텀 로딩 스켈레톤 (Enhanced에서 추가)
// ============================================================================

const CustomLoadingSkeleton = styled(Skeleton)(({ theme }) => ({
    borderRadius: '8px',
    background: `linear-gradient(90deg, ${alpha(theme.palette.grey[300], 0.2)} 25%, ${alpha(theme.palette.grey[300], 0.4)} 50%, ${alpha(theme.palette.grey[300], 0.2)} 75%)`,
    backgroundSize: '200% 100%',
    animation: `${shimmerEffect} 1.5s infinite`,
}));

// ============================================================================
// 적응형 카드 컴포넌트
// ============================================================================

// AdaptiveCard variant 타입 확장
interface AdaptiveCardProps {
    variant?: 'default' | 'elevated' | 'outlined' | 'glass' | 'neon';
    padding?: 'none' | 'sm' | 'md' | 'lg';
    children: React.ReactNode;
    onClick?: () => void;
    hover?: boolean;
    loading?: boolean;
    glassmorphism?: boolean;
}

// MUI Card variant 타입 확장
declare module '@mui/material/Card' {
    interface CardPropsVariantOverrides {
        glass: true;
        neon: true;
        default: true;
        elevated: true;
    }
}

const AdaptiveCard = styled(Card)<AdaptiveCardProps>(({ theme, variant = 'default', padding = 'md', hover = true, loading = false, glassmorphism = false }) => {
    const getVariantStyles = () => {
        switch (variant) {
            case 'glass':
                return {
                    background: glassmorphism
                        ? `rgba(255, 255, 255, 0.1)`
                        : alpha(theme.palette.background.paper, 0.8),
                    backdropFilter: 'blur(10px)',
                    border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                    boxShadow: 'none',
                    '&:hover': hover ? {
                        background: glassmorphism
                            ? `rgba(255, 255, 255, 0.2)`
                            : alpha(theme.palette.background.paper, 0.9),
                        transform: 'translateY(-4px)',
                    } : {},
                };
            case 'neon':
                return {
                    background: 'transparent',
                    border: `2px solid ${theme.palette.primary.main}`,
                    boxShadow: `0 0 20px ${alpha(theme.palette.primary.main, 0.5)}`,
                    '&:hover': hover ? {
                        boxShadow: `0 0 30px ${alpha(theme.palette.primary.main, 0.8)}`,
                        transform: 'translateY(-4px)',
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
                animation: `${shimmerEffect} 1.5s infinite`,
            },
        }),
    };
});

// ============================================================================
// 스마트 입력 필드 컴포넌트
// ============================================================================

interface SmartInputProps {
    label?: string;
    placeholder?: string;
    value?: string;
    onChange?: (value: string) => void;
    error?: boolean;
    success?: boolean;
    loading?: boolean;
    icon?: React.ReactNode;
    suggestions?: string[];
    onSuggestionClick?: (suggestion: string) => void;
}

const SmartInput: React.FC<SmartInputProps> = ({
    label,
    placeholder,
    value,
    onChange,
    error = false,
    success = false,
    loading = false,
    icon,
    suggestions = [],
    onSuggestionClick
}) => {
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [focused, setFocused] = useState(false);

    const handleFocus = () => {
        setFocused(true);
        if (suggestions.length > 0) {
            setShowSuggestions(true);
        }
    };

    const handleBlur = () => {
        setFocused(false);
        setTimeout(() => setShowSuggestions(false), 200);
    };

    return (
        <Box sx={{ position: 'relative', width: '100%' }}>
            <TextField
                fullWidth
                label={label}
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange?.(e.target.value)}
                onFocus={handleFocus}
                onBlur={handleBlur}
                error={error}
                InputProps={{
                    startAdornment: icon,
                    endAdornment: loading ? <CircularProgress size={20} /> : null,
                }}
                sx={{
                    '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        transition: 'all 0.3s ease',
                        ...(focused && {
                            transform: 'scale(1.02)',
                            boxShadow: error
                                ? `0 0 0 3px ${alpha('#ef4444', 0.1)}`
                                : success
                                    ? `0 0 0 3px ${alpha('#10b981', 0.1)}`
                                    : `0 0 0 3px ${alpha('#0ea5e9', 0.1)}`,
                        }),
                        ...(success && {
                            borderColor: '#10b981',
                            '&:hover': { borderColor: '#10b981' },
                        }),
                        ...(error && {
                            borderColor: '#ef4444',
                            '&:hover': { borderColor: '#ef4444' },
                        }),
                    },
                }}
            />

            {showSuggestions && suggestions.length > 0 && (
                <Fade in={showSuggestions}>
                    <Paper
                        sx={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            zIndex: 1000,
                            mt: 1,
                            borderRadius: '12px',
                            boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                            overflow: 'hidden',
                        }}
                    >
                        {suggestions.map((suggestion, index) => (
                            <Box
                                key={index}
                                sx={{
                                    p: 2,
                                    cursor: 'pointer',
                                    '&:hover': {
                                        backgroundColor: 'action.hover',
                                    },
                                }}
                                onClick={() => {
                                    onSuggestionClick?.(suggestion);
                                    setShowSuggestions(false);
                                }}
                            >
                                <Typography variant="body2">{suggestion}</Typography>
                            </Box>
                        ))}
                    </Paper>
                </Fade>
            )}
        </Box>
    );
};

// ============================================================================
// 메인 UI/UX 2.0 Design System 컴포넌트
// ============================================================================

const UIUXV2DesignSystem: React.FC = () => {
    const [darkMode, setDarkMode] = useState(false);
    const [primaryColor, setPrimaryColor] = useState('#0ea5e9');
    const [loading, setLoading] = useState(false);
    const [likes, setLikes] = useState(42);
    const [shares, setShares] = useState(8);
    const [comments, setComments] = useState(15);
    const [bookmarks, setBookmarks] = useState(3);
    const [searchValue, setSearchValue] = useState('');
    const [fontSize, setFontSize] = useState(16);

    const theme = createDynamicTheme(primaryColor, darkMode);

    const colorOptions = [
        { name: 'Blue', value: '#0ea5e9' },
        { name: 'Purple', value: '#8b5cf6' },
        { name: 'Green', value: '#10b981' },
        { name: 'Red', value: '#ef4444' },
        { name: 'Orange', value: '#f59e0b' },
        { name: 'Pink', value: '#ec4899' },
    ];

    const suggestions = ['Community Platform', 'UI/UX Design', 'React Components', 'Material-UI', 'TypeScript'];

    const handleLike = () => setLikes(prev => prev + 1);
    const handleShare = () => setShares(prev => prev + 1);
    const handleComment = () => setComments(prev => prev + 1);
    const handleBookmark = () => setBookmarks(prev => prev + 1);

    const simulateLoading = () => {
        setLoading(true);
        setTimeout(() => setLoading(false), 2000);
    };

    return (
        <ThemeProvider theme={theme}>
            <Box sx={{ p: 4, maxWidth: 1400, mx: 'auto', minHeight: '100vh', backgroundColor: 'background.default' }}>
                <Typography variant="h1" component="h1" gutterBottom sx={{
                    background: `linear-gradient(45deg, ${primaryColor}, #d946ef)`,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontWeight: 'bold',
                    mb: 4,
                    textAlign: 'center'
                }}>
                    🎨 UI/UX 2.0 Design System
                </Typography>

                {/* 컨트롤 패널 */}
                <AdaptiveCard variant="outlined" padding="lg" sx={{ mb: 4 }}>
                    <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
                        ⚙️ Design Controls
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                        <Box sx={{ flex: '1 1 300px', minWidth: 300 }}>
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
                                label={darkMode ? <DarkModeIcon /> : <LightModeIcon />}
                            />
                        </Box>
                        <Box sx={{ flex: '1 1 300px', minWidth: 300 }}>
                            <FormControl fullWidth>
                                <InputLabel>Primary Color</InputLabel>
                                <Select
                                    value={primaryColor}
                                    onChange={(e) => setPrimaryColor(e.target.value)}
                                    label="Primary Color"
                                >
                                    {colorOptions.map((color) => (
                                        <MenuItem key={color.value} value={color.value}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Box
                                                    sx={{
                                                        width: 20,
                                                        height: 20,
                                                        borderRadius: '50%',
                                                        backgroundColor: color.value,
                                                        border: '1px solid #ccc'
                                                    }}
                                                />
                                                {color.name}
                                            </Box>
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>
                        <Box sx={{ flex: '1 1 300px', minWidth: 300 }}>
                            <Typography variant="body2" gutterBottom>
                                Font Size: {fontSize}px
                            </Typography>
                            <Slider
                                value={fontSize}
                                onChange={(_, value) => setFontSize(value as number)}
                                min={12}
                                max={24}
                                step={1}
                                marks
                                valueLabelDisplay="auto"
                            />
                        </Box>
                    </Box>
                </AdaptiveCard>

                {/* 통합 버튼 섹션 */}
                <Box sx={{ mb: 6 }}>
                    <Typography variant="h3" gutterBottom sx={{ mb: 3 }}>
                        ✨ Unified Buttons (Enhanced + UIUX v2)
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                        <Box sx={{ flex: '1 1 400px', minWidth: 400 }}>
                            <Stack spacing={2}>
                                <UnifiedButton variant="primary" size="lg" animation="pulse">
                                    Primary Pulse
                                </UnifiedButton>
                                <UnifiedButton variant="secondary" size="md" animation="float">
                                    Secondary Float
                                </UnifiedButton>
                                <UnifiedButton variant="outline" size="sm" ripple>
                                    Outline Ripple
                                </UnifiedButton>
                                <UnifiedButton variant="ghost" size="xs">
                                    Ghost Button
                                </UnifiedButton>
                                <UnifiedButton variant="danger" loading={loading} onClick={simulateLoading}>
                                    {loading ? 'Loading...' : 'Danger Button'}
                                </UnifiedButton>
                            </Stack>
                        </Box>
                        <Box sx={{ flex: '1 1 400px', minWidth: 400 }}>
                            <Stack spacing={2}>
                                <UnifiedButton variant="primary" icon={<SearchIcon />}>
                                    With Icon
                                </UnifiedButton>
                                <UnifiedButton variant="gradient" size="md">
                                    Gradient Button
                                </UnifiedButton>
                                <UnifiedButton variant="secondary" disabled>
                                    Disabled Button
                                </UnifiedButton>
                                <UnifiedButton variant="outline" size="xl">
                                    Extra Large
                                </UnifiedButton>
                            </Stack>
                        </Box>
                    </Box>
                </Box>

                {/* 적응형 카드 섹션 */}
                <Box sx={{ mb: 6 }}>
                    <Typography variant="h3" gutterBottom sx={{ mb: 3 }}>
                        🃏 Adaptive Cards
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                        <Box sx={{ flex: '1 1 250px', minWidth: 250 }}>
                            <AdaptiveCard variant="outlined" hover>
                                <Typography variant="h6" gutterBottom>
                                    Default Card
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Standard card with hover effects.
                                </Typography>
                            </AdaptiveCard>
                        </Box>
                        <Box sx={{ flex: '1 1 250px', minWidth: 250 }}>
                            <AdaptiveCard variant="outlined" glassmorphism hover>
                                <Typography variant="h6" gutterBottom>
                                    Glass Card
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Glassmorphism effect with blur.
                                </Typography>
                            </AdaptiveCard>
                        </Box>
                        <Box sx={{ flex: '1 1 250px', minWidth: 250 }}>
                            <AdaptiveCard variant="outlined" hover>
                                <Typography variant="h6" gutterBottom>
                                    Neon Card
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Neon glow effect.
                                </Typography>
                            </AdaptiveCard>
                        </Box>
                        <Box sx={{ flex: '1 1 250px', minWidth: 250 }}>
                            <AdaptiveCard variant="outlined" loading>
                                <Typography variant="h6" gutterBottom>
                                    Loading Card
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Shimmer loading effect.
                                </Typography>
                            </AdaptiveCard>
                        </Box>
                    </Box>
                </Box>

                {/* 스마트 입력 섹션 */}
                <Box sx={{ mb: 6 }}>
                    <Typography variant="h3" gutterBottom sx={{ mb: 3 }}>
                        🧠 Smart Input Fields
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                        <Box sx={{ flex: '1 1 400px', minWidth: 400 }}>
                            <SmartInput
                                label="Search with Suggestions"
                                placeholder="Type to see suggestions..."
                                value={searchValue}
                                onChange={setSearchValue}
                                icon={<SearchIcon />}
                                suggestions={suggestions}
                                onSuggestionClick={(suggestion) => setSearchValue(suggestion)}
                            />
                        </Box>
                        <Box sx={{ flex: '1 1 400px', minWidth: 400 }}>
                            <SmartInput
                                label="Loading Input"
                                placeholder="Loading state demo..."
                                loading={loading}
                                icon={<RefreshIcon />}
                            />
                        </Box>
                    </Box>
                </Box>

                {/* 인터랙티브 액션 섹션 (Enhanced ActionButton 사용) */}
                <Box sx={{ mb: 6 }}>
                    <Typography variant="h3" gutterBottom sx={{ mb: 3 }}>
                        🎯 Interactive Actions (Enhanced)
                    </Typography>
                    <AdaptiveCard variant="outlined" padding="lg">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                            <Avatar sx={{ bgcolor: 'primary.main' }}>U</Avatar>
                            <Box>
                                <Typography variant="h6" fontWeight="bold">
                                    Interactive Post with Enhanced ActionButtons
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Click the buttons below - they have Badge, Tooltip, and Active states!
                                </Typography>
                            </Box>
                        </Box>

                        <Stack direction="row" spacing={2} alignItems="center">
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
                        </Stack>
                    </AdaptiveCard>
                </Box>

                {/* 커스텀 로딩 스켈레톤 섹션 (Enhanced에서 추가) */}
                <Box sx={{ mb: 6 }}>
                    <Typography variant="h3" gutterBottom sx={{ mb: 3 }}>
                        ⏳ Custom Loading Skeletons
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                        <Box sx={{ flex: '1 1 400px', minWidth: 400 }}>
                            <AdaptiveCard variant="outlined" padding="md">
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                    <CustomLoadingSkeleton variant="circular" width={40} height={40} />
                                    <Box sx={{ flex: 1 }}>
                                        <CustomLoadingSkeleton variant="text" width="60%" height={20} />
                                        <CustomLoadingSkeleton variant="text" width="40%" height={16} />
                                    </Box>
                                </Box>
                                <CustomLoadingSkeleton variant="rectangular" height={200} sx={{ mb: 2 }} />
                                <CustomLoadingSkeleton variant="text" width="100%" height={16} />
                                <CustomLoadingSkeleton variant="text" width="80%" height={16} />
                            </AdaptiveCard>
                        </Box>
                        <Box sx={{ flex: '1 1 400px', minWidth: 400 }}>
                            <AdaptiveCard variant="outlined" padding="md">
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                    <CustomLoadingSkeleton variant="circular" width={40} height={40} />
                                    <Box sx={{ flex: 1 }}>
                                        <CustomLoadingSkeleton variant="text" width="60%" height={20} />
                                        <CustomLoadingSkeleton variant="text" width="40%" height={16} />
                                    </Box>
                                </Box>
                                <CustomLoadingSkeleton variant="rectangular" height={200} sx={{ mb: 2 }} />
                                <CustomLoadingSkeleton variant="text" width="100%" height={16} />
                                <CustomLoadingSkeleton variant="text" width="80%" height={16} />
                            </AdaptiveCard>
                        </Box>
                    </Box>
                </Box>

                {/* 기능 데모 섹션 */}
                <Box sx={{ mb: 6 }}>
                    <Typography variant="h3" gutterBottom sx={{ mb: 3 }}>
                        🎮 Feature Demos
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                        <Box sx={{ flex: '1 1 300px', minWidth: 300 }}>
                            <AdaptiveCard variant="outlined" padding="md">
                                <Box sx={{ textAlign: 'center' }}>
                                    <PaletteIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                                    <Typography variant="h6">Dynamic Colors</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Real-time color theme switching
                                    </Typography>
                                </Box>
                            </AdaptiveCard>
                        </Box>
                        <Box sx={{ flex: '1 1 300px', minWidth: 300 }}>
                            <AdaptiveCard variant="outlined" padding="md">
                                <Box sx={{ textAlign: 'center' }}>
                                    <TextFieldsIcon sx={{ fontSize: 40, color: 'secondary.main', mb: 1 }} />
                                    <Typography variant="h6">Adaptive Typography</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Responsive font scaling
                                    </Typography>
                                </Box>
                            </AdaptiveCard>
                        </Box>
                        <Box sx={{ flex: '1 1 300px', minWidth: 300 }}>
                            <AdaptiveCard variant="outlined" padding="md">
                                <Box sx={{ textAlign: 'center' }}>
                                    <AnimationIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                                    <Typography variant="h6">Advanced Animations</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Smooth micro-interactions
                                    </Typography>
                                </Box>
                            </AdaptiveCard>
                        </Box>
                    </Box>
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
        </ThemeProvider>
    );
};

export default UIUXV2DesignSystem;
