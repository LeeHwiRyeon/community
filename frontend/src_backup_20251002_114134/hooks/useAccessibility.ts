import { useEffect, useRef, useState, useCallback } from 'react';

interface AccessibilityOptions {
    enableKeyboardNavigation?: boolean;
    enableScreenReader?: boolean;
    enableHighContrast?: boolean;
    enableFocusManagement?: boolean;
    enableAnnouncements?: boolean;
}

interface AccessibilityState {
    isHighContrast: boolean;
    isReducedMotion: boolean;
    isScreenReader: boolean;
    focusableElements: HTMLElement[];
    currentFocusIndex: number;
}

/**
 * 접근성 훅
 * 키보드 네비게이션, 스크린 리더 지원, 고대비 모드 등을 제공합니다.
 */
export const useAccessibility = (options: AccessibilityOptions = {}) => {
    const {
        enableKeyboardNavigation = true,
        enableScreenReader = true,
        enableHighContrast = true,
        enableFocusManagement = true,
        enableAnnouncements = true,
    } = options;

    const [state, setState] = useState<AccessibilityState>({
        isHighContrast: false,
        isReducedMotion: false,
        isScreenReader: false,
        focusableElements: [],
        currentFocusIndex: -1,
    });

    const containerRef = useRef<HTMLElement>(null);
    const announcementRef = useRef<HTMLDivElement>(null);

    // 접근성 설정 감지
    useEffect(() => {
        const detectAccessibilitySettings = () => {
            // 고대비 모드 감지
            const isHighContrast = window.matchMedia('(prefers-contrast: high)').matches;

            // 애니메이션 감소 설정 감지
            const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

            // 스크린 리더 감지 (근사치)
            const isScreenReader =
                'speechSynthesis' in window ||
                'speechRecognition' in window ||
                navigator.userAgent.includes('NVDA') ||
                navigator.userAgent.includes('JAWS') ||
                navigator.userAgent.includes('VoiceOver');

            setState(prev => ({
                ...prev,
                isHighContrast,
                isReducedMotion,
                isScreenReader,
            }));
        };

        detectAccessibilitySettings();

        // 미디어 쿼리 변경 감지
        const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
        const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

        const handleHighContrastChange = (e: MediaQueryListEvent) => {
            setState(prev => ({ ...prev, isHighContrast: e.matches }));
        };

        const handleReducedMotionChange = (e: MediaQueryListEvent) => {
            setState(prev => ({ ...prev, isReducedMotion: e.matches }));
        };

        highContrastQuery.addEventListener('change', handleHighContrastChange);
        reducedMotionQuery.addEventListener('change', handleReducedMotionChange);

        return () => {
            highContrastQuery.removeEventListener('change', handleHighContrastChange);
            reducedMotionQuery.removeEventListener('change', handleReducedMotionChange);
        };
    }, []);

    // 포커스 가능한 요소들 업데이트
    const updateFocusableElements = useCallback(() => {
        if (!containerRef.current) return;

        const focusableSelectors = [
            'button:not([disabled])',
            'input:not([disabled])',
            'select:not([disabled])',
            'textarea:not([disabled])',
            'a[href]',
            '[tabindex]:not([tabindex="-1"])',
            '[role="button"]:not([disabled])',
            '[role="link"]',
            '[role="menuitem"]',
            '[role="tab"]',
        ];

        const elements = Array.from(
            containerRef.current.querySelectorAll(focusableSelectors.join(', '))
        ) as HTMLElement[];

        setState(prev => ({
            ...prev,
            focusableElements: elements,
        }));
    }, []);

    // 키보드 네비게이션
    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        if (!enableKeyboardNavigation || state.focusableElements.length === 0) return;

        const { key } = event;
        let newIndex = state.currentFocusIndex;

        switch (key) {
            case 'Tab':
                event.preventDefault();
                newIndex = state.currentFocusIndex + 1;
                if (newIndex >= state.focusableElements.length) {
                    newIndex = 0;
                }
                break;
            case 'Shift+Tab':
                event.preventDefault();
                newIndex = state.currentFocusIndex - 1;
                if (newIndex < 0) {
                    newIndex = state.focusableElements.length - 1;
                }
                break;
            case 'ArrowDown':
                event.preventDefault();
                newIndex = Math.min(state.currentFocusIndex + 1, state.focusableElements.length - 1);
                break;
            case 'ArrowUp':
                event.preventDefault();
                newIndex = Math.max(state.currentFocusIndex - 1, 0);
                break;
            case 'Home':
                event.preventDefault();
                newIndex = 0;
                break;
            case 'End':
                event.preventDefault();
                newIndex = state.focusableElements.length - 1;
                break;
            case 'Enter':
            case ' ':
                event.preventDefault();
                if (state.focusableElements[state.currentFocusIndex]) {
                    state.focusableElements[state.currentFocusIndex].click();
                }
                return;
            case 'Escape':
                event.preventDefault();
                if (state.focusableElements[state.currentFocusIndex]) {
                    state.focusableElements[state.currentFocusIndex].blur();
                }
                return;
        }

        if (newIndex !== state.currentFocusIndex) {
            setState(prev => ({ ...prev, currentFocusIndex: newIndex }));
            state.focusableElements[newIndex]?.focus();
        }
    }, [enableKeyboardNavigation, state.focusableElements, state.currentFocusIndex]);

    // 포커스 관리
    useEffect(() => {
        if (!enableFocusManagement || !containerRef.current) return;

        updateFocusableElements();

        const container = containerRef.current;
        container.addEventListener('keydown', handleKeyDown);

        return () => {
            container.removeEventListener('keydown', handleKeyDown);
        };
    }, [enableFocusManagement, handleKeyDown, updateFocusableElements]);

    // 스크린 리더 공지
    const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
        if (!enableAnnouncements || !announcementRef.current) return;

        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', priority);
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = message;

        announcementRef.current.appendChild(announcement);

        // 공지 후 제거
        setTimeout(() => {
            if (announcement.parentNode) {
                announcement.parentNode.removeChild(announcement);
            }
        }, 1000);
    }, [enableAnnouncements]);

    // 포커스 트랩
    const trapFocus = useCallback((element: HTMLElement) => {
        const focusableElements = Array.from(
            element.querySelectorAll('button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])')
        ) as HTMLElement[];

        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        const handleTabKey = (e: KeyboardEvent) => {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstElement) {
                        e.preventDefault();
                        lastElement.focus();
                    }
                } else {
                    if (document.activeElement === lastElement) {
                        e.preventDefault();
                        firstElement.focus();
                    }
                }
            }
        };

        element.addEventListener('keydown', handleTabKey);
        firstElement.focus();

        return () => {
            element.removeEventListener('keydown', handleTabKey);
        };
    }, []);

    // ARIA 레이블 관리
    const setAriaLabel = useCallback((element: HTMLElement, label: string) => {
        element.setAttribute('aria-label', label);
    }, []);

    const setAriaDescribedBy = useCallback((element: HTMLElement, descriptionId: string) => {
        element.setAttribute('aria-describedby', descriptionId);
    }, []);

    const setAriaExpanded = useCallback((element: HTMLElement, expanded: boolean) => {
        element.setAttribute('aria-expanded', expanded.toString());
    }, []);

    const setAriaSelected = useCallback((element: HTMLElement, selected: boolean) => {
        element.setAttribute('aria-selected', selected.toString());
    }, []);

    // 고대비 모드 스타일 적용
    const applyHighContrastStyles = useCallback(() => {
        if (!state.isHighContrast) return;

        const style = document.createElement('style');
        style.textContent = `
      * {
        border-color: currentColor !important;
        outline: 2px solid currentColor !important;
        outline-offset: 2px !important;
      }
      
      button, input, select, textarea {
        background-color: white !important;
        color: black !important;
        border: 2px solid black !important;
      }
      
      button:hover, input:hover, select:hover, textarea:hover {
        background-color: black !important;
        color: white !important;
      }
    `;

        document.head.appendChild(style);

        return () => {
            document.head.removeChild(style);
        };
    }, [state.isHighContrast]);

    // 애니메이션 감소 설정 적용
    const applyReducedMotionStyles = useCallback(() => {
        if (!state.isReducedMotion) return;

        const style = document.createElement('style');
        style.textContent = `
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
      }
    `;

        document.head.appendChild(style);

        return () => {
            document.head.removeChild(style);
        };
    }, [state.isReducedMotion]);

    // 접근성 스타일 적용
    useEffect(() => {
        const cleanupHighContrast = applyHighContrastStyles();
        const cleanupReducedMotion = applyReducedMotionStyles();

        return () => {
            cleanupHighContrast?.();
            cleanupReducedMotion?.();
        };
    }, [applyHighContrastStyles, applyReducedMotionStyles]);

    return {
        ...state,
        containerRef,
        announcementRef,
        announce,
        trapFocus,
        setAriaLabel,
        setAriaDescribedBy,
        setAriaExpanded,
        setAriaSelected,
        updateFocusableElements,
    };
};

export default useAccessibility;
