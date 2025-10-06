/**
 * 🎨 현대적 디자인 시스템 v3.0
 * 
 * AUTOAGENTS 고도화 플랫폼을 위한 통합 디자인 시스템
 * 
 * @author AUTOAGENTS Manager
 * @version 3.0.0
 * @created 2025-01-02
 */

export const DesignSystem = {
    // 🎨 컬러 팔레트
    colors: {
        // Primary Colors
        primary: {
            50: '#f0f4ff',
            100: '#e0e7ff',
            200: '#c7d2fe',
            300: '#a5b4fc',
            400: '#818cf8',
            500: '#6366f1', // 메인 프라이머리
            600: '#4f46e5',
            700: '#4338ca',
            800: '#3730a3',
            900: '#312e81',
        },

        // Secondary Colors
        secondary: {
            50: '#fdf4ff',
            100: '#fae8ff',
            200: '#f5d0fe',
            300: '#f0abfc',
            400: '#e879f9',
            500: '#d946ef', // 메인 세컨더리
            600: '#c026d3',
            700: '#a21caf',
            800: '#86198f',
            900: '#701a75',
        },

        // Accent Colors
        accent: {
            success: '#10b981',
            warning: '#f59e0b',
            error: '#ef4444',
            info: '#3b82f6',
        },

        // Neutral Colors
        neutral: {
            0: '#ffffff',
            50: '#f9fafb',
            100: '#f3f4f6',
            200: '#e5e7eb',
            300: '#d1d5db',
            400: '#9ca3af',
            500: '#6b7280',
            600: '#4b5563',
            700: '#374151',
            800: '#1f2937',
            900: '#111827',
        },

        // Gradient Colors
        gradients: {
            primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            secondary: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            success: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            warning: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            error: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        },
    },

    // 📏 타이포그래피
    typography: {
        fontFamily: {
            sans: ['Inter', 'system-ui', 'sans-serif'],
            mono: ['JetBrains Mono', 'Monaco', 'monospace'],
            display: ['Poppins', 'system-ui', 'sans-serif'],
        },

        fontSize: {
            xs: '0.75rem',    // 12px
            sm: '0.875rem',    // 14px
            base: '1rem',      // 16px
            lg: '1.125rem',    // 18px
            xl: '1.25rem',     // 20px
            '2xl': '1.5rem',   // 24px
            '3xl': '1.875rem', // 30px
            '4xl': '2.25rem',  // 36px
            '5xl': '3rem',     // 48px
            '6xl': '3.75rem',  // 60px
        },

        fontWeight: {
            light: 300,
            normal: 400,
            medium: 500,
            semibold: 600,
            bold: 700,
            extrabold: 800,
        },

        lineHeight: {
            tight: 1.25,
            snug: 1.375,
            normal: 1.5,
            relaxed: 1.625,
            loose: 2,
        },
    },

    // 📐 스페이싱
    spacing: {
        0: '0',
        1: '0.25rem',   // 4px
        2: '0.5rem',    // 8px
        3: '0.75rem',   // 12px
        4: '1rem',      // 16px
        5: '1.25rem',   // 20px
        6: '1.5rem',    // 24px
        8: '2rem',      // 32px
        10: '2.5rem',   // 40px
        12: '3rem',     // 48px
        16: '4rem',     // 64px
        20: '5rem',     // 80px
        24: '6rem',     // 96px
        32: '8rem',     // 128px
    },

    // 🔲 보더 반경
    borderRadius: {
        none: '0',
        sm: '0.125rem',   // 2px
        base: '0.25rem',  // 4px
        md: '0.375rem',   // 6px
        lg: '0.5rem',     // 8px
        xl: '0.75rem',    // 12px
        '2xl': '1rem',    // 16px
        '3xl': '1.5rem',  // 24px
        full: '9999px',
    },

    // 🌟 그림자
    shadows: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
        glow: '0 0 20px rgba(99, 102, 241, 0.3)',
    },

    // 🎭 애니메이션
    animations: {
        duration: {
            fast: '150ms',
            normal: '300ms',
            slow: '500ms',
        },

        easing: {
            linear: 'linear',
            easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
            easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
            easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
            bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        },

        keyframes: {
            fadeIn: {
                '0%': { opacity: '0' },
                '100%': { opacity: '1' },
            },
            slideUp: {
                '0%': { transform: 'translateY(100%)' },
                '100%': { transform: 'translateY(0)' },
            },
            slideDown: {
                '0%': { transform: 'translateY(-100%)' },
                '100%': { transform: 'translateY(0)' },
            },
            scaleIn: {
                '0%': { transform: 'scale(0.9)', opacity: '0' },
                '100%': { transform: 'scale(1)', opacity: '1' },
            },
            pulse: {
                '0%, 100%': { opacity: '1' },
                '50%': { opacity: '0.5' },
            },
            spin: {
                '0%': { transform: 'rotate(0deg)' },
                '100%': { transform: 'rotate(360deg)' },
            },
        },
    },

    // 📱 브레이크포인트
    breakpoints: {
        xs: '0px',
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
    },

    // 🎯 컴포넌트 스타일
    components: {
        button: {
            base: {
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '0.5rem',
                fontWeight: '500',
                transition: 'all 0.2s ease-in-out',
                cursor: 'pointer',
                border: 'none',
                outline: 'none',
            },
            sizes: {
                sm: {
                    padding: '0.5rem 1rem',
                    fontSize: '0.875rem',
                },
                md: {
                    padding: '0.75rem 1.5rem',
                    fontSize: '1rem',
                },
                lg: {
                    padding: '1rem 2rem',
                    fontSize: '1.125rem',
                },
            },
            variants: {
                primary: {
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 10px 25px rgba(102, 126, 234, 0.3)',
                    },
                },
                secondary: {
                    background: 'white',
                    color: '#6366f1',
                    border: '2px solid #6366f1',
                    '&:hover': {
                        background: '#6366f1',
                        color: 'white',
                    },
                },
                ghost: {
                    background: 'transparent',
                    color: '#6366f1',
                    '&:hover': {
                        background: 'rgba(99, 102, 241, 0.1)',
                    },
                },
            },
        },

        card: {
            base: {
                background: 'white',
                borderRadius: '1rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.3s ease',
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                },
            },
            variants: {
                elevated: {
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                },
                outlined: {
                    border: '1px solid #e5e7eb',
                    boxShadow: 'none',
                },
                glass: {
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                },
            },
        },

        input: {
            base: {
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: '0.5rem',
                border: '2px solid #e5e7eb',
                fontSize: '1rem',
                transition: 'all 0.2s ease',
                '&:focus': {
                    outline: 'none',
                    borderColor: '#6366f1',
                    boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.1)',
                },
            },
            variants: {
                error: {
                    borderColor: '#ef4444',
                    '&:focus': {
                        borderColor: '#ef4444',
                        boxShadow: '0 0 0 3px rgba(239, 68, 68, 0.1)',
                    },
                },
                success: {
                    borderColor: '#10b981',
                    '&:focus': {
                        borderColor: '#10b981',
                        boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.1)',
                    },
                },
            },
        },
    },

    // 🎨 테마
    themes: {
        light: {
            background: '#ffffff',
            surface: '#f9fafb',
            text: '#111827',
            textSecondary: '#6b7280',
            border: '#e5e7eb',
        },
        dark: {
            background: '#111827',
            surface: '#1f2937',
            text: '#f9fafb',
            textSecondary: '#9ca3af',
            border: '#374151',
        },
    },
};

export default DesignSystem;
