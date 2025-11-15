import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme, Theme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
    mode: ThemeMode;
    toggleTheme: () => void;
    setTheme: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider');
    }
    return context;
};

interface ThemeProviderProps {
    children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
    // Initialize theme from localStorage or system preference
    const [mode, setMode] = useState<ThemeMode>(() => {
        const savedTheme = localStorage.getItem('theme-mode');
        if (savedTheme === 'light' || savedTheme === 'dark') {
            return savedTheme;
        }
        // Check system preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    });

    // Update localStorage when theme changes
    useEffect(() => {
        localStorage.setItem('theme-mode', mode);
        // Update document root attribute for CSS variables
        document.documentElement.setAttribute('data-theme', mode);
    }, [mode]);

    // Listen for system theme changes
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e: MediaQueryListEvent) => {
            const savedTheme = localStorage.getItem('theme-mode');
            if (!savedTheme) {
                setMode(e.matches ? 'dark' : 'light');
            }
        };

        // Modern browsers
        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        }
        // Legacy browsers
        else if (mediaQuery.addListener) {
            mediaQuery.addListener(handleChange);
            return () => mediaQuery.removeListener(handleChange);
        }
    }, []);

    const toggleTheme = () => {
        setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
    };

    const setTheme = (newMode: ThemeMode) => {
        setMode(newMode);
    };

    // Create Material-UI theme based on mode
    const theme: Theme = createTheme({
        palette: {
            mode,
            primary: {
                main: mode === 'light' ? '#3b82f6' : '#60a5fa',
                light: mode === 'light' ? '#60a5fa' : '#93c5fd',
                dark: mode === 'light' ? '#2563eb' : '#3b82f6',
                contrastText: '#ffffff',
            },
            secondary: {
                main: mode === 'light' ? '#64748b' : '#94a3b8',
                light: mode === 'light' ? '#94a3b8' : '#cbd5e1',
                dark: mode === 'light' ? '#475569' : '#64748b',
            },
            background: {
                default: mode === 'light' ? '#f8fafc' : '#0f172a',
                paper: mode === 'light' ? '#ffffff' : '#1e293b',
            },
            text: {
                primary: mode === 'light' ? '#0f172a' : '#f1f5f9',
                secondary: mode === 'light' ? '#475569' : '#cbd5e1',
            },
            divider: mode === 'light' ? '#e2e8f0' : '#334155',
            error: {
                main: mode === 'light' ? '#ef4444' : '#f87171',
            },
            warning: {
                main: mode === 'light' ? '#f59e0b' : '#fbbf24',
            },
            info: {
                main: mode === 'light' ? '#3b82f6' : '#60a5fa',
            },
            success: {
                main: mode === 'light' ? '#10b981' : '#34d399',
            },
        },
        typography: {
            fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
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
            },
            body2: {
                fontSize: '0.875rem',
            },
            button: {
                textTransform: 'none',
                fontWeight: 500,
            },
        },
        shape: {
            borderRadius: 8,
        },
        shadows: [
            'none',
            mode === 'light'
                ? '0 1px 3px rgba(0, 0, 0, 0.1)'
                : '0 1px 3px rgba(0, 0, 0, 0.3)',
            mode === 'light'
                ? '0 4px 6px rgba(0, 0, 0, 0.1)'
                : '0 4px 6px rgba(0, 0, 0, 0.3)',
            mode === 'light'
                ? '0 10px 15px rgba(0, 0, 0, 0.1)'
                : '0 10px 15px rgba(0, 0, 0, 0.3)',
            mode === 'light'
                ? '0 20px 25px rgba(0, 0, 0, 0.1)'
                : '0 20px 25px rgba(0, 0, 0, 0.3)',
            // Add more shadow levels as needed
            ...Array(20).fill(
                mode === 'light'
                    ? '0 20px 25px rgba(0, 0, 0, 0.1)'
                    : '0 20px 25px rgba(0, 0, 0, 0.3)'
            ),
        ] as any,
        components: {
            MuiButton: {
                styleOverrides: {
                    root: {
                        borderRadius: 8,
                        textTransform: 'none',
                        fontWeight: 500,
                        padding: '8px 16px',
                    },
                    contained: {
                        boxShadow: 'none',
                        '&:hover': {
                            boxShadow: mode === 'light'
                                ? '0 4px 6px rgba(0, 0, 0, 0.1)'
                                : '0 4px 6px rgba(0, 0, 0, 0.3)',
                        },
                    },
                },
            },
            MuiCard: {
                styleOverrides: {
                    root: {
                        borderRadius: 12,
                        boxShadow: mode === 'light'
                            ? '0 1px 3px rgba(0, 0, 0, 0.1)'
                            : '0 1px 3px rgba(0, 0, 0, 0.3)',
                        backgroundImage: 'none',
                    },
                },
            },
            MuiPaper: {
                styleOverrides: {
                    root: {
                        backgroundImage: 'none',
                    },
                    elevation1: {
                        boxShadow: mode === 'light'
                            ? '0 1px 3px rgba(0, 0, 0, 0.1)'
                            : '0 1px 3px rgba(0, 0, 0, 0.3)',
                    },
                },
            },
            MuiChip: {
                styleOverrides: {
                    root: {
                        borderRadius: 6,
                    },
                },
            },
            MuiAppBar: {
                styleOverrides: {
                    root: {
                        backgroundImage: 'none',
                        boxShadow: mode === 'light'
                            ? '0 1px 3px rgba(0, 0, 0, 0.1)'
                            : '0 1px 3px rgba(0, 0, 0, 0.3)',
                    },
                },
            },
            MuiDrawer: {
                styleOverrides: {
                    paper: {
                        backgroundImage: 'none',
                    },
                },
            },
            MuiDialog: {
                styleOverrides: {
                    paper: {
                        backgroundImage: 'none',
                    },
                },
            },
            MuiTextField: {
                styleOverrides: {
                    root: {
                        '& .MuiOutlinedInput-root': {
                            '& fieldset': {
                                borderColor: mode === 'light' ? '#e2e8f0' : '#334155',
                            },
                        },
                    },
                },
            },
            MuiTableCell: {
                styleOverrides: {
                    root: {
                        borderBottom: `1px solid ${mode === 'light' ? '#e2e8f0' : '#334155'}`,
                    },
                },
            },
        },
    });

    const value: ThemeContextType = {
        mode,
        toggleTheme,
        setTheme,
    };

    return (
        <ThemeContext.Provider value={value}>
            <MuiThemeProvider theme={theme}>
                <CssBaseline />
                {children}
            </MuiThemeProvider>
        </ThemeContext.Provider>
    );
};
