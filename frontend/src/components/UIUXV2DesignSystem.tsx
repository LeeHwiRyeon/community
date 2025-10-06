/**
 * 🎨 UI/UX 2.0 Design System
 * 
 * Community Platform v2.0을 위한 차세대 디자인 시스템
 * 동적 컬러, 적응형 타이포그래피, 스마트 스페이싱을 포함한 혁신적 UI
 * 
 * @author AUTOAGENTS Manager
 * @version 2.0.0
 * @created 2025-10-02
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Typography,
    Button,
    Card,
    TextField,
    Grid,
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
// 동적 버튼 컴포넌트
// ============================================================================

interface DynamicButtonProps {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'gradient';
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    loading?: boolean;
    disabled?: boolean;
    icon?: React.ReactNode;
    children: React.ReactNode;
    onClick?: () => void;
    animation?: 'morphing' | 'floating' | 'pulse' | 'none';
    gradient?: boolean;
    as?: React.ElementType;
}

const DynamicButton = styled(Button)(({ theme }) => ({
    borderRadius: '12px',
    fontWeight: 600,
    textTransform: 'none',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative',
    overflow: 'hidden',
    '&:active': {
        transform: 'translateY(0px)',
    },
    '&:focus': {
        outline: `2px solid ${theme.palette.primary.main}`,
        outlineOffset: '2px',
    },
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

                {/* 동적 버튼 섹션 */}
                <Box sx={{ mb: 6 }}>
                    <Typography variant="h3" gutterBottom sx={{ mb: 3 }}>
                        ✨ Dynamic Buttons
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                        <Box sx={{ flex: '1 1 400px', minWidth: 400 }}>
                            <Stack spacing={2}>
                                <DynamicButton variant="contained" size="large" onClick={() => { }}>
                                    Morphing Button
                                </DynamicButton>
                                <DynamicButton variant="contained" size="medium" onClick={() => { }}>
                                    Gradient Floating
                                </DynamicButton>
                                <DynamicButton variant="contained" size="small" onClick={() => { }}>
                                    Pulse Glow
                                </DynamicButton>
                                <DynamicButton variant="outlined" size="small" onClick={() => { }}>
                                    Outline Button
                                </DynamicButton>
                                <DynamicButton variant="contained" disabled={loading} onClick={simulateLoading}>
                                    {loading ? 'Loading...' : 'Loading Demo'}
                                </DynamicButton>
                            </Stack>
                        </Box>
                        <Box sx={{ flex: '1 1 400px', minWidth: 400 }}>
                            <Stack spacing={2}>
                                <DynamicButton variant="contained" startIcon={<SearchIcon />} onClick={() => { }}>
                                    With Icon
                                </DynamicButton>
                                <DynamicButton variant="contained" disabled onClick={() => { }}>
                                    Disabled Button
                                </DynamicButton>
                                <DynamicButton variant="contained" size="large" onClick={() => { }}>
                                    Extra Large Gradient
                                </DynamicButton>
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

                {/* 인터랙티브 액션 섹션 */}
                <Box sx={{ mb: 6 }}>
                    <Typography variant="h3" gutterBottom sx={{ mb: 3 }}>
                        🎯 Interactive Actions
                    </Typography>
                    <AdaptiveCard variant="outlined" padding="lg">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                            <Avatar sx={{ bgcolor: 'primary.main' }}>U</Avatar>
                            <Box>
                                <Typography variant="h6" fontWeight="bold">
                                    Interactive Post
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Try the interactive buttons below!
                                </Typography>
                            </Box>
                        </Box>

                        <Stack direction="row" spacing={2} alignItems="center">
                            <IconButton
                                onClick={handleLike}
                                sx={{
                                    color: 'error.main',
                                    '&:hover': { transform: 'scale(1.1)' },
                                    transition: 'all 0.2s ease',
                                }}
                            >
                                <Badge badgeContent={likes} color="error">
                                    <FavoriteIcon />
                                </Badge>
                            </IconButton>

                            <IconButton
                                onClick={handleShare}
                                sx={{
                                    color: 'primary.main',
                                    '&:hover': { transform: 'scale(1.1)' },
                                    transition: 'all 0.2s ease',
                                }}
                            >
                                <Badge badgeContent={shares} color="primary">
                                    <ShareIcon />
                                </Badge>
                            </IconButton>

                            <IconButton
                                onClick={handleComment}
                                sx={{
                                    color: 'secondary.main',
                                    '&:hover': { transform: 'scale(1.1)' },
                                    transition: 'all 0.2s ease',
                                }}
                            >
                                <Badge badgeContent={comments} color="secondary">
                                    <CommentIcon />
                                </Badge>
                            </IconButton>

                            <IconButton
                                onClick={handleBookmark}
                                sx={{
                                    color: 'success.main',
                                    '&:hover': { transform: 'scale(1.1)' },
                                    transition: 'all 0.2s ease',
                                }}
                            >
                                <Badge badgeContent={bookmarks} color="success">
                                    <BookmarkIcon />
                                </Badge>
                            </IconButton>
                        </Stack>
                    </AdaptiveCard>
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
