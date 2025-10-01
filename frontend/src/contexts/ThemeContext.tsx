import React, { createContext, useContext, useEffect, useState } from 'react';

interface ThemeContextType {
    theme: 'light' | 'dark' | 'auto';
    setTheme: (theme: 'light' | 'dark' | 'auto') => void;
    isDark: boolean;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

interface ThemeProviderProps {
    children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
    const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>('auto');
    const [isDark, setIsDark] = useState(false);

    // 시스템 테마 감지
    const getSystemTheme = () => {
        if (typeof window !== 'undefined') {
            return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        return 'light';
    };

    // 실제 적용될 테마 계산
    const getActualTheme = () => {
        if (theme === 'auto') {
            return getSystemTheme();
        }
        return theme;
    };

    // 테마 변경 처리
    useEffect(() => {
        const actualTheme = getActualTheme();
        const darkMode = actualTheme === 'dark';

        setIsDark(darkMode);

        // HTML 요소에 테마 클래스 적용
        if (typeof document !== 'undefined') {
            document.documentElement.classList.toggle('dark', darkMode);
            document.documentElement.setAttribute('data-theme', actualTheme);
        }

        // 로컬 스토리지에 저장
        localStorage.setItem('theme', theme);
    }, [theme]);

    // 시스템 테마 변경 감지
    useEffect(() => {
        if (theme === 'auto' && typeof window !== 'undefined') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

            const handleChange = () => {
                const actualTheme = getActualTheme();
                setIsDark(actualTheme === 'dark');
                document.documentElement.classList.toggle('dark', actualTheme === 'dark');
                document.documentElement.setAttribute('data-theme', actualTheme);
            };

            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        }
    }, [theme]);

    // 초기 테마 로드
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'auto' | null;
        if (savedTheme) {
            setTheme(savedTheme);
        }
    }, []);

    const toggleTheme = () => {
        setTheme(prev => {
            if (prev === 'light') return 'dark';
            if (prev === 'dark') return 'auto';
            return 'light';
        });
    };

    const value: ThemeContextType = {
        theme,
        setTheme,
        isDark,
        toggleTheme
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};