import { useState, useEffect, useCallback } from 'react';
import { useBreakpointValue } from '@chakra-ui/react';

interface MobileOptimizationState {
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
    screenWidth: number;
    screenHeight: number;
    orientation: 'portrait' | 'landscape';
    touchDevice: boolean;
    reducedMotion: boolean;
    darkMode: boolean;
    highContrast: boolean;
    fontSize: number;
    safeAreaInsets: {
        top: number;
        right: number;
        bottom: number;
        left: number;
    };
}

export const useMobileOptimization = () => {
    const [state, setState] = useState<MobileOptimizationState>({
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight,
        orientation: window.innerHeight > window.innerWidth ? 'portrait' : 'landscape',
        touchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
        reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        darkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
        highContrast: window.matchMedia('(prefers-contrast: high)').matches,
        fontSize: 16,
        safeAreaInsets: {
            top: 0,
            right: 0,
            bottom: 0,
            left: 0
        }
    });

    // 브레이크포인트 기반 디바이스 감지
    const isMobile = useBreakpointValue({ base: true, md: false });
    const isTablet = useBreakpointValue({ base: false, md: true, lg: false });
    const isDesktop = useBreakpointValue({ base: false, lg: true });

    // 화면 크기 업데이트
    useEffect(() => {
        const handleResize = () => {
            setState(prev => ({
                ...prev,
                screenWidth: window.innerWidth,
                screenHeight: window.innerHeight,
                orientation: window.innerHeight > window.innerWidth ? 'portrait' : 'landscape',
                isMobile: isMobile || false,
                isTablet: isTablet || false,
                isDesktop: isDesktop || false
            }));
        };

        window.addEventListener('resize', handleResize);
        handleResize(); // 초기 설정

        return () => window.removeEventListener('resize', handleResize);
    }, [isMobile, isTablet, isDesktop]);

    // 접근성 설정 감지
    useEffect(() => {
        const mediaQueries = {
            reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)'),
            darkMode: window.matchMedia('(prefers-color-scheme: dark)'),
            highContrast: window.matchMedia('(prefers-contrast: high)')
        };

        const handleMediaChange = () => {
            setState(prev => ({
                ...prev,
                reducedMotion: mediaQueries.reducedMotion.matches,
                darkMode: mediaQueries.darkMode.matches,
                highContrast: mediaQueries.highContrast.matches
            }));
        };

        Object.values(mediaQueries).forEach(mq => {
            mq.addEventListener('change', handleMediaChange);
        });

        return () => {
            Object.values(mediaQueries).forEach(mq => {
                mq.removeEventListener('change', handleMediaChange);
            });
        };
    }, []);

    // Safe Area Insets 감지 (iOS)
    useEffect(() => {
        const updateSafeAreaInsets = () => {
            const computedStyle = getComputedStyle(document.documentElement);
            const safeAreaInsets = {
                top: parseInt(computedStyle.getPropertyValue('--safe-area-inset-top') || '0'),
                right: parseInt(computedStyle.getPropertyValue('--safe-area-inset-right') || '0'),
                bottom: parseInt(computedStyle.getPropertyValue('--safe-area-inset-bottom') || '0'),
                left: parseInt(computedStyle.getPropertyValue('--safe-area-inset-left') || '0')
            };

            setState(prev => ({
                ...prev,
                safeAreaInsets
            }));
        };

        updateSafeAreaInsets();
        window.addEventListener('resize', updateSafeAreaInsets);

        return () => window.removeEventListener('resize', updateSafeAreaInsets);
    }, []);

    // 폰트 크기 조정
    const adjustFontSize = useCallback((size: number) => {
        setState(prev => ({
            ...prev,
            fontSize: Math.max(12, Math.min(24, size))
        }));

        // CSS 변수 업데이트
        document.documentElement.style.setProperty('--mobile-font-size', `${size}px`);
    }, []);

    // 터치 제스처 감지
    const useTouchGesture = useCallback((
        onSwipeLeft?: () => void,
        onSwipeRight?: () => void,
        onSwipeUp?: () => void,
        onSwipeDown?: () => void,
        onTap?: () => void,
        onLongPress?: () => void
    ) => {
        let startX = 0;
        let startY = 0;
        let startTime = 0;
        let longPressTimer: NodeJS.Timeout | null = null;

        const handleTouchStart = (e: TouchEvent) => {
            const touch = e.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;
            startTime = Date.now();

            // 롱프레스 감지
            if (onLongPress) {
                longPressTimer = setTimeout(() => {
                    onLongPress();
                }, 500);
            }
        };

        const handleTouchEnd = (e: TouchEvent) => {
            if (longPressTimer) {
                clearTimeout(longPressTimer);
                longPressTimer = null;
            }

            const touch = e.changedTouches[0];
            const endX = touch.clientX;
            const endY = touch.clientY;
            const endTime = Date.now();

            const deltaX = endX - startX;
            const deltaY = endY - startY;
            const deltaTime = endTime - startTime;

            const minSwipeDistance = 50;
            const maxSwipeTime = 300;

            if (deltaTime < maxSwipeTime) {
                if (Math.abs(deltaX) > Math.abs(deltaY)) {
                    // 수평 스와이프
                    if (deltaX > minSwipeDistance && onSwipeRight) {
                        onSwipeRight();
                    } else if (deltaX < -minSwipeDistance && onSwipeLeft) {
                        onSwipeLeft();
                    }
                } else {
                    // 수직 스와이프
                    if (deltaY > minSwipeDistance && onSwipeDown) {
                        onSwipeDown();
                    } else if (deltaY < -minSwipeDistance && onSwipeUp) {
                        onSwipeUp();
                    }
                }
            }

            // 탭 감지
            if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10 && deltaTime < 200 && onTap) {
                onTap();
            }
        };

        return {
            onTouchStart: handleTouchStart,
            onTouchEnd: handleTouchEnd
        };
    }, []);

    // 가상 키보드 감지
    const useVirtualKeyboard = useCallback(() => {
        const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
        const [keyboardHeight, setKeyboardHeight] = useState(0);

        useEffect(() => {
            const initialHeight = window.innerHeight;

            const handleResize = () => {
                const currentHeight = window.innerHeight;
                const heightDifference = initialHeight - currentHeight;

                if (heightDifference > 150) {
                    setIsKeyboardOpen(true);
                    setKeyboardHeight(heightDifference);
                } else {
                    setIsKeyboardOpen(false);
                    setKeyboardHeight(0);
                }
            };

            window.addEventListener('resize', handleResize);
            return () => window.removeEventListener('resize', handleResize);
        }, []);

        return { isKeyboardOpen, keyboardHeight };
    }, []);

    // 성능 최적화 설정
    const optimizeForMobile = useCallback(() => {
        // 이미지 지연 로딩
        if ('IntersectionObserver' in window) {
            const images = document.querySelectorAll('img[data-src]');
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target as HTMLImageElement;
                        img.src = img.dataset.src || '';
                        img.classList.remove('lazy');
                        imageObserver.unobserve(img);
                    }
                });
            });

            images.forEach(img => imageObserver.observe(img));
        }

        // 스크롤 성능 최적화
        let ticking = false;
        const handleScroll = () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    // 스크롤 이벤트 처리
                    ticking = false;
                });
                ticking = true;
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // 모바일 특화 스타일 적용
    const applyMobileStyles = useCallback(() => {
        const root = document.documentElement;

        // 터치 액션 최적화
        root.style.setProperty('touch-action', 'manipulation');

        // 스크롤 바 숨기기 (iOS)
        root.style.setProperty('-webkit-overflow-scrolling', 'touch');

        // 선택 방지 (iOS)
        root.style.setProperty('-webkit-user-select', 'none');
        root.style.setProperty('-webkit-touch-callout', 'none');

        // 줌 방지
        root.style.setProperty('touch-action', 'pan-x pan-y');

        // Safe Area 지원
        root.style.setProperty('--safe-area-inset-top', 'env(safe-area-inset-top, 0px)');
        root.style.setProperty('--safe-area-inset-right', 'env(safe-area-inset-right, 0px)');
        root.style.setProperty('--safe-area-inset-bottom', 'env(safe-area-inset-bottom, 0px)');
        root.style.setProperty('--safe-area-inset-left', 'env(safe-area-inset-left, 0px)');
    }, []);

    // 접근성 개선
    const improveAccessibility = useCallback(() => {
        // 포커스 표시 개선
        const style = document.createElement('style');
        style.textContent = `
      *:focus {
        outline: 3px solid #4299e1 !important;
        outline-offset: 2px !important;
      }
      
      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      }
      
      @media (prefers-contrast: high) {
        * {
          border-color: currentColor !important;
        }
      }
    `;
        document.head.appendChild(style);

        return () => document.head.removeChild(style);
    }, []);

    return {
        ...state,
        adjustFontSize,
        useTouchGesture,
        useVirtualKeyboard,
        optimizeForMobile,
        applyMobileStyles,
        improveAccessibility
    };
};