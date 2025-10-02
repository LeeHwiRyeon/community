/**
 * 🎨 향상된 테마 프로바이더
 * 
 * 다크 모드, 접근성, 개인화 테마를 지원하는
 * 고급 테마 시스템
 * 
 * @author AUTOAGENTS Manager
 * @version 3.0.0
 * @created 2025-10-02
 */

import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    useMemo,
    ReactNode
} from 'react';
import {
    ThemeProvider,
    createTheme,
    Theme,
    CssBaseline,
    useMediaQuery,
    PaletteMode
} from '@mui/material';
import { koKR } from '@mui/material/locale';

// 테마 타입 정의
export type ThemeMode = 'light' | 'dark' | 'auto';
export type ColorScheme = 'default' | 'blue' | 'green' | 'purple' | 'orange';
export type FontSize = 'small' | 'medium' | 'large' | 'extra-large';
export type Contrast = 'normal' | 'high';
export type MotionPreference = 'full' | 'reduced' | 'none';

export interface ThemeSettings {
    mode: ThemeMode;
    colorScheme: ColorScheme;
    fontSize: FontSize;
    contrast: Contrast;
    motionPreference: MotionPreference;
    compactMode: boolean;
    highContrast: boolean;
    reducedMotion: boolean;
}

export interface ThemeContextValue {
    settings: ThemeSettings;
    updateSettings: (newSettings: Partial<ThemeSettings>) => void;
    toggleDarkMode: () => void;
    resetToDefaults: () => void;
    theme: Theme;
}

// 기본 테마 설정
const DEFAULT_THEME_SETTINGS: ThemeSettings = {
    mode: 'auto',
    colorScheme: 'default',
    fontSize: 'medium',
    contrast: 'normal',
    motionPreference: 'full',
    compactMode: false,
    highContrast: false,
    reducedMotion: false
};

// 컬러 스킴 정의
const COLOR_SCHEMES = {
    default: {
        primary: '#2196F3',
        secondary: '#FF9800',
        accent: '#4CAF50'
    },
    blue: {
        primary: '#1976D2',
        secondary: '#03DAC6',
        accent: '#FF6B6B'
    },
    green: {
        primary: '#4CAF50',
        secondary: '#FF9800',
        accent: '#9C27B0'
    },
    purple: {
        primary: '#9C27B0',
        secondary: '#00BCD4',
        accent: '#FF5722'
    },
    orange: {
        primary: '#FF9800',
        secondary: '#3F51B5',
        accent: '#4CAF50'
    }
};

// 폰트 크기 설정
const FONT_SIZES = {
    small: {
        fontSize: 12,
        h1: 2.5,
        h2: 2.0,
        h3: 1.75,
        h4: 1.5,
        h5: 1.25,
        h6: 1.1,
        body1: 0.875,
        body2: 0.75,
        caption: 0.7
    },
    medium: {
        fontSize: 14,
        h1: 3.0,
        h2: 2.25,
        h3: 2.0,
        h4: 1.75,
        h5: 1.5,
        h6: 1.25,
        body1: 1.0,
        body2: 0.875,
        caption: 0.75
    },
    large: {
        fontSize: 16,
        h1: 3.5,
        h2: 2.75,
        h3: 2.25,
        h4: 2.0,
        h5: 1.75,
        h6: 1.5,
        body1: 1.125,
        body2: 1.0,
        caption: 0.875
    },
    'extra-large': {
        fontSize: 18,
        h1: 4.0,
        h2: 3.25,
        h3: 2.75,
        h4: 2.25,
        h5: 2.0,
        h6: 1.75,
        body1: 1.25,
        body2: 1.125,
        caption: 1.0
    }
};

// 테마 컨텍스트
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// 커스텀 훅
export const useEnhancedTheme = (): ThemeContextValue => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useEnhancedTheme must be used within EnhancedThemeProvider');
    }
    return context;
};

// 로컬 스토리지 키
const THEME_STORAGE_KEY = 'community-theme-settings';

// 테마 프로바이더 컴포넌트
interface EnhancedThemeProviderProps {
    children: ReactNode;
}

export const EnhancedThemeProvider: React.FC<EnhancedThemeProviderProps> = ({ children }) => {
    // 시스템 다크 모드 감지
    const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
    const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
    const prefersHighContrast = useMediaQuery('(prefers-contrast: high)');

    // 테마 설정 상태
    const [settings, setSettings] = useState<ThemeSettings>(() => {
        // 로컬 스토리지에서 설정 로드
        try {
            const saved = localStorage.getItem(THEME_STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                return { ...DEFAULT_THEME_SETTINGS, ...parsed };
            }
        } catch (error) {
            console.warn('테마 설정 로드 실패:', error);
        }
        return DEFAULT_THEME_SETTINGS;
    });

    // 실제 테마 모드 계산
    const actualMode: PaletteMode = useMemo(() => {
        if (settings.mode === 'auto') {
            return prefersDarkMode ? 'dark' : 'light';
        }
        return settings.mode as PaletteMode;
    }, [settings.mode, prefersDarkMode]);

    // 시스템 설정 감지 및 반영
    useEffect(() => {
        setSettings(prev => ({
            ...prev,
            reducedMotion: prefersReducedMotion,
            highContrast: prefersHighContrast
        }));
    }, [prefersReducedMotion, prefersHighContrast]);

    // 테마 생성
    const theme = useMemo(() => {
        const colorScheme = COLOR_SCHEMES[settings.colorScheme];
        const fontSizes = FONT_SIZES[settings.fontSize];

        return createTheme({
            palette: {
                mode: actualMode,
                primary: {
                    main: colorScheme.primary,
                    ...(settings.highContrast && {
                        main: actualMode === 'dark' ? '#ffffff' : '#000000'
                    })
                },
                secondary: {
                    main: colorScheme.secondary
                },
                background: {
                    default: actualMode === 'dark'
                        ? (settings.highContrast ? '#000000' : '#121212')
                        : (settings.highContrast ? '#ffffff' : '#fafafa'),
                    paper: actualMode === 'dark'
                        ? (settings.highContrast ? '#1a1a1a' : '#1e1e1e')
                        : (settings.highContrast ? '#f5f5f5' : '#ffffff')
                },
                text: {
                    primary: actualMode === 'dark'
                        ? (settings.highContrast ? '#ffffff' : 'rgba(255, 255, 255, 0.87)')
                        : (settings.highContrast ? '#000000' : 'rgba(0, 0, 0, 0.87)'),
                    secondary: actualMode === 'dark'
                        ? (settings.highContrast ? '#cccccc' : 'rgba(255, 255, 255, 0.6)')
                        : (settings.highContrast ? '#333333' : 'rgba(0, 0, 0, 0.6)')
                }
            },
            typography: {
                fontSize: fontSizes.fontSize,
                h1: {
                    fontSize: `${fontSizes.h1}rem`,
                    fontWeight: 700,
                    lineHeight: 1.2
                },
                h2: {
                    fontSize: `${fontSizes.h2}rem`,
                    fontWeight: 600,
                    lineHeight: 1.3
                },
                h3: {
                    fontSize: `${fontSizes.h3}rem`,
                    fontWeight: 600,
                    lineHeight: 1.4
                },
                h4: {
                    fontSize: `${fontSizes.h4}rem`,
                    fontWeight: 500,
                    lineHeight: 1.4
                },
                h5: {
                    fontSize: `${fontSizes.h5}rem`,
                    fontWeight: 500,
                    lineHeight: 1.5
                },
                h6: {
                    fontSize: `${fontSizes.h6}rem`,
                    fontWeight: 500,
                    lineHeight: 1.5
                },
                body1: {
                    fontSize: `${fontSizes.body1}rem`,
                    lineHeight: 1.6
                },
                body2: {
                    fontSize: `${fontSizes.body2}rem`,
                    lineHeight: 1.5
                },
                caption: {
                    fontSize: `${fontSizes.caption}rem`,
                    lineHeight: 1.4
                },
                fontFamily: [
                    '-apple-system',
                    'BlinkMacSystemFont',
                    '"Segoe UI"',
                    'Roboto',
                    '"Noto Sans KR"',
                    'Arial',
                    'sans-serif'
                ].join(',')
            },
            shape: {
                borderRadius: settings.compactMode ? 4 : 8
            },
            spacing: settings.compactMode ? 6 : 8,
            components: {
                MuiCssBaseline: {
                    styleOverrides: {
                        '*': {
                            // 모션 설정
                            ...(settings.reducedMotion && {
                                animationDuration: '0.01ms !important',
                                animationIterationCount: '1 !important',
                                transitionDuration: '0.01ms !important'
                            })
                        },
                        body: {
                            // 스크롤바 스타일링
                            scrollbarWidth: 'thin',
                            scrollbarColor: actualMode === 'dark' ? '#555 #333' : '#ccc #f1f1f1',
                            '&::-webkit-scrollbar': {
                                width: '8px'
                            },
                            '&::-webkit-scrollbar-track': {
                                background: actualMode === 'dark' ? '#333' : '#f1f1f1'
                            },
                            '&::-webkit-scrollbar-thumb': {
                                background: actualMode === 'dark' ? '#555' : '#ccc',
                                borderRadius: '4px'
                            },
                            '&::-webkit-scrollbar-thumb:hover': {
                                background: actualMode === 'dark' ? '#777' : '#aaa'
                            }
                        }
                    }
                },
                MuiButton: {
                    styleOverrides: {
                        root: {
                            textTransform: 'none',
                            fontWeight: 500,
                            borderRadius: settings.compactMode ? 4 : 8,
                            padding: settings.compactMode ? '6px 12px' : '8px 16px',
                            minHeight: settings.compactMode ? 32 : 36,
                            // 접근성 향상
                            '&:focus-visible': {
                                outline: `2px solid ${colorScheme.primary}`,
                                outlineOffset: '2px'
                            }
                        }
                    }
                },
                MuiCard: {
                    styleOverrides: {
                        root: {
                            borderRadius: settings.compactMode ? 8 : 12,
                            boxShadow: actualMode === 'dark'
                                ? '0 2px 8px rgba(0,0,0,0.3)'
                                : '0 2px 8px rgba(0,0,0,0.1)',
                            ...(settings.highContrast && {
                                border: `1px solid ${actualMode === 'dark' ? '#555' : '#ddd'}`
                            })
                        }
                    }
                },
                MuiTextField: {
                    styleOverrides: {
                        root: {
                            '& .MuiOutlinedInput-root': {
                                borderRadius: settings.compactMode ? 4 : 8,
                                '&:focus-within': {
                                    outline: `2px solid ${colorScheme.primary}`,
                                    outlineOffset: '2px'
                                }
                            }
                        }
                    }
                },
                MuiChip: {
                    styleOverrides: {
                        root: {
                            borderRadius: settings.compactMode ? 12 : 16,
                            height: settings.compactMode ? 24 : 32
                        }
                    }
                },
                MuiFab: {
                    styleOverrides: {
                        root: {
                            '&:focus-visible': {
                                outline: `2px solid ${colorScheme.primary}`,
                                outlineOffset: '2px'
                            }
                        }
                    }
                }
            },
            transitions: {
                duration: {
                    shortest: settings.reducedMotion ? 0 : 150,
                    shorter: settings.reducedMotion ? 0 : 200,
                    short: settings.reducedMotion ? 0 : 250,
                    standard: settings.reducedMotion ? 0 : 300,
                    complex: settings.reducedMotion ? 0 : 375,
                    enteringScreen: settings.reducedMotion ? 0 : 225,
                    leavingScreen: settings.reducedMotion ? 0 : 195
                }
            }
        }, koKR);
    }, [actualMode, settings, prefersDarkMode]);

    // 설정 업데이트
    const updateSettings = useCallback((newSettings: Partial<ThemeSettings>) => {
        setSettings(prev => {
            const updated = { ...prev, ...newSettings };

            // 로컬 스토리지에 저장
            try {
                localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(updated));
            } catch (error) {
                console.warn('테마 설정 저장 실패:', error);
            }

            return updated;
        });
    }, []);

    // 다크 모드 토글
    const toggleDarkMode = useCallback(() => {
        updateSettings({
            mode: settings.mode === 'dark' ? 'light' : 'dark'
        });
    }, [settings.mode, updateSettings]);

    // 기본값으로 리셋
    const resetToDefaults = useCallback(() => {
        setSettings(DEFAULT_THEME_SETTINGS);
        try {
            localStorage.removeItem(THEME_STORAGE_KEY);
        } catch (error) {
            console.warn('테마 설정 리셋 실패:', error);
        }
    }, []);

    // 컨텍스트 값
    const contextValue: ThemeContextValue = useMemo(() => ({
        settings,
        updateSettings,
        toggleDarkMode,
        resetToDefaults,
        theme
    }), [settings, updateSettings, toggleDarkMode, resetToDefaults, theme]);

    // 메타 태그 업데이트 (다크 모드 상태바)
    useEffect(() => {
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            metaThemeColor.setAttribute(
                'content',
                actualMode === 'dark' ? '#121212' : '#ffffff'
            );
        }

        // 상태바 스타일 (모바일)
        const metaStatusBar = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
        if (metaStatusBar) {
            metaStatusBar.setAttribute(
                'content',
                actualMode === 'dark' ? 'black-translucent' : 'default'
            );
        }
    }, [actualMode]);

    // 시스템 테마 변경 감지
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const handleChange = (e: MediaQueryListEvent) => {
            if (settings.mode === 'auto') {
                // 자동 모드일 때만 시스템 변경사항 반영
                // 테마 재계산이 자동으로 이루어짐
            }
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [settings.mode]);

    return (
        <ThemeContext.Provider value={contextValue}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                {children}
            </ThemeProvider>
        </ThemeContext.Provider>
    );
};

export default EnhancedThemeProvider;
