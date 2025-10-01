import { createTheme, ThemeOptions } from '@mui/material/styles';

// 뉴스 테마 (전문적이고 깔끔한 디자인)
export const newsTheme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#1976d2',
            light: '#42a5f5',
            dark: '#1565c0',
            contrastText: '#ffffff',
        },
        secondary: {
            main: '#424242',
            light: '#6d6d6d',
            dark: '#1b1b1b',
            contrastText: '#ffffff',
        },
        accent: {
            main: '#ff9800',
            light: '#ffb74d',
            dark: '#f57c00',
            contrastText: '#ffffff',
        },
        background: {
            default: '#ffffff',
            paper: '#fafafa',
        },
        text: {
            primary: '#212121',
            secondary: '#757575',
        },
    },
    typography: {
        fontFamily: '"Roboto", "Noto Sans KR", sans-serif',
        h1: {
            fontWeight: 600,
            fontSize: '2.5rem',
        },
        h2: {
            fontWeight: 600,
            fontSize: '2rem',
        },
        h3: {
            fontWeight: 500,
            fontSize: '1.75rem',
        },
        h4: {
            fontWeight: 500,
            fontSize: '1.5rem',
        },
        h5: {
            fontWeight: 500,
            fontSize: '1.25rem',
        },
        h6: {
            fontWeight: 500,
            fontSize: '1rem',
        },
        body1: {
            fontSize: '1rem',
            lineHeight: 1.6,
        },
        body2: {
            fontSize: '0.875rem',
            lineHeight: 1.6,
        },
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    textTransform: 'none',
                    fontWeight: 500,
                },
                contained: {
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    '&:hover': {
                        boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
                    },
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    border: '1px solid #e0e0e0',
                },
            },
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    borderRadius: 16,
                    fontWeight: 500,
                },
            },
        },
    },
} as ThemeOptions);

// 게임 테마 (다크 모드와 게이밍 요소)
export const gameTheme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#9c27b0',
            light: '#ba68c8',
            dark: '#7b1fa2',
            contrastText: '#ffffff',
        },
        secondary: {
            main: '#212121',
            light: '#484848',
            dark: '#000000',
            contrastText: '#ffffff',
        },
        accent: {
            main: '#00e676',
            light: '#4caf50',
            dark: '#00c853',
            contrastText: '#000000',
        },
        background: {
            default: '#121212',
            paper: '#1e1e1e',
        },
        text: {
            primary: '#ffffff',
            secondary: '#b0b0b0',
        },
    },
    typography: {
        fontFamily: '"Orbitron", "Noto Sans KR", sans-serif',
        h1: {
            fontWeight: 700,
            fontSize: '2.5rem',
        },
        h2: {
            fontWeight: 600,
            fontSize: '2rem',
        },
        h3: {
            fontWeight: 600,
            fontSize: '1.75rem',
        },
        h4: {
            fontWeight: 500,
            fontSize: '1.5rem',
        },
        h5: {
            fontWeight: 500,
            fontSize: '1.25rem',
        },
        h6: {
            fontWeight: 500,
            fontSize: '1rem',
        },
        body1: {
            fontSize: '1rem',
            lineHeight: 1.4,
        },
        body2: {
            fontSize: '0.875rem',
            lineHeight: 1.4,
        },
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    textTransform: 'none',
                    fontWeight: 600,
                },
                contained: {
                    boxShadow: '0 2px 8px rgba(156, 39, 176, 0.3)',
                    '&:hover': {
                        boxShadow: '0 4px 12px rgba(156, 39, 176, 0.4)',
                    },
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    border: '1px solid #9c27b0',
                },
            },
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    borderRadius: 16,
                    fontWeight: 600,
                },
            },
        },
    },
} as ThemeOptions);

// 스트리밍 테마 (생동감 있고 역동적인 디자인)
export const streamingTheme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#f44336',
            light: '#ef5350',
            dark: '#d32f2f',
            contrastText: '#ffffff',
        },
        secondary: {
            main: '#37474f',
            light: '#62727b',
            dark: '#263238',
            contrastText: '#ffffff',
        },
        accent: {
            main: '#2196f3',
            light: '#64b5f6',
            dark: '#1976d2',
            contrastText: '#ffffff',
        },
        background: {
            default: '#1a1a1a',
            paper: '#2a2a2a',
        },
        text: {
            primary: '#ffffff',
            secondary: '#b0b0b0',
        },
    },
    typography: {
        fontFamily: '"Open Sans", "Noto Sans KR", sans-serif',
        h1: {
            fontWeight: 700,
            fontSize: '2.5rem',
        },
        h2: {
            fontWeight: 600,
            fontSize: '2rem',
        },
        h3: {
            fontWeight: 600,
            fontSize: '1.75rem',
        },
        h4: {
            fontWeight: 500,
            fontSize: '1.5rem',
        },
        h5: {
            fontWeight: 500,
            fontSize: '1.25rem',
        },
        h6: {
            fontWeight: 500,
            fontSize: '1rem',
        },
        body1: {
            fontSize: '1rem',
            lineHeight: 1.5,
        },
        body2: {
            fontSize: '0.875rem',
            lineHeight: 1.5,
        },
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    textTransform: 'none',
                    fontWeight: 600,
                },
                contained: {
                    boxShadow: '0 2px 8px rgba(244, 67, 54, 0.3)',
                    '&:hover': {
                        boxShadow: '0 4px 12px rgba(244, 67, 54, 0.4)',
                    },
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    border: '1px solid #f44336',
                },
            },
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    borderRadius: 16,
                    fontWeight: 600,
                },
            },
        },
    },
} as ThemeOptions);

// 코스프레 테마 (창의적이고 갤러리 중심 디자인)
export const cosplayTheme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#e91e63',
            light: '#f06292',
            dark: '#c2185b',
            contrastText: '#ffffff',
        },
        secondary: {
            main: '#5d4037',
            light: '#8d6e63',
            dark: '#3e2723',
            contrastText: '#ffffff',
        },
        accent: {
            main: '#ff9800',
            light: '#ffb74d',
            dark: '#f57c00',
            contrastText: '#ffffff',
        },
        background: {
            default: '#fafafa',
            paper: '#ffffff',
        },
        text: {
            primary: '#3e2723',
            secondary: '#8d6e63',
        },
    },
    typography: {
        fontFamily: '"Lato", "Noto Sans KR", sans-serif',
        h1: {
            fontWeight: 600,
            fontSize: '2.5rem',
        },
        h2: {
            fontWeight: 600,
            fontSize: '2rem',
        },
        h3: {
            fontWeight: 500,
            fontSize: '1.75rem',
        },
        h4: {
            fontWeight: 500,
            fontSize: '1.5rem',
        },
        h5: {
            fontWeight: 500,
            fontSize: '1.25rem',
        },
        h6: {
            fontWeight: 500,
            fontSize: '1rem',
        },
        body1: {
            fontSize: '1rem',
            lineHeight: 1.6,
        },
        body2: {
            fontSize: '0.875rem',
            lineHeight: 1.6,
        },
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    textTransform: 'none',
                    fontWeight: 500,
                },
                contained: {
                    boxShadow: '0 2px 4px rgba(233, 30, 99, 0.2)',
                    '&:hover': {
                        boxShadow: '0 4px 8px rgba(233, 30, 99, 0.3)',
                    },
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    border: '1px solid #e91e63',
                },
            },
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    borderRadius: 16,
                    fontWeight: 500,
                },
            },
        },
    },
} as ThemeOptions);

// 테마 타입 정의
export type ThemeType = 'news' | 'game' | 'streaming' | 'cosplay';

// 테마 매핑
export const themes = {
    news: newsTheme,
    game: gameTheme,
    streaming: streamingTheme,
    cosplay: cosplayTheme,
};

// 테마 가져오기 함수
export const getTheme = (themeType: ThemeType) => {
    return themes[themeType] || newsTheme;
};

// CSS 변수 생성 함수
export const generateCSSVariables = (themeType: ThemeType) => {
    const theme = getTheme(themeType);

    return {
        '--primary-color': theme.palette.primary.main,
        '--secondary-color': theme.palette.secondary.main,
        '--accent-color': theme.palette.accent?.main || theme.palette.primary.main,
        '--background-color': theme.palette.background.default,
        '--paper-color': theme.palette.background.paper,
        '--text-primary': theme.palette.text.primary,
        '--text-secondary': theme.palette.text.secondary,
        '--font-family': theme.typography.fontFamily,
    };
};

// 테마별 CSS 클래스 스타일
export const themeStyles = {
    'news-theme': {
        '--primary-color': '#1976d2',
        '--secondary-color': '#424242',
        '--accent-color': '#ff9800',
        '--background-color': '#ffffff',
        '--paper-color': '#fafafa',
        '--text-primary': '#212121',
        '--text-secondary': '#757575',
        '--font-family': '"Roboto", "Noto Sans KR", sans-serif',
    },
    'game-theme': {
        '--primary-color': '#9c27b0',
        '--secondary-color': '#212121',
        '--accent-color': '#00e676',
        '--background-color': '#121212',
        '--paper-color': '#1e1e1e',
        '--text-primary': '#ffffff',
        '--text-secondary': '#b0b0b0',
        '--font-family': '"Orbitron", "Noto Sans KR", sans-serif',
    },
    'streaming-theme': {
        '--primary-color': '#f44336',
        '--secondary-color': '#37474f',
        '--accent-color': '#2196f3',
        '--background-color': '#1a1a1a',
        '--paper-color': '#2a2a2a',
        '--text-primary': '#ffffff',
        '--text-secondary': '#b0b0b0',
        '--font-family': '"Open Sans", "Noto Sans KR", sans-serif',
    },
    'cosplay-theme': {
        '--primary-color': '#e91e63',
        '--secondary-color': '#5d4037',
        '--accent-color': '#ff9800',
        '--background-color': '#fafafa',
        '--paper-color': '#ffffff',
        '--text-primary': '#3e2723',
        '--text-secondary': '#8d6e63',
        '--font-family': '"Lato", "Noto Sans KR", sans-serif',
    },
};
