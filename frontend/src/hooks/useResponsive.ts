import { useState, useEffect } from 'react';

interface BreakpointConfig {
    mobile: number;
    tablet: number;
    desktop: number;
}

interface ResponsiveState {
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
    screenWidth: number;
    screenHeight: number;
    orientation: 'portrait' | 'landscape';
    deviceType: 'mobile' | 'tablet' | 'desktop';
}

const defaultBreakpoints: BreakpointConfig = {
    mobile: 768,
    tablet: 1024,
    desktop: 1200
};

export const useResponsive = (breakpoints: BreakpointConfig = defaultBreakpoints): ResponsiveState => {
    const [screenWidth, setScreenWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 0);
    const [screenHeight, setScreenHeight] = useState(typeof window !== 'undefined' ? window.innerHeight : 0);

    useEffect(() => {
        const handleResize = () => {
            setScreenWidth(window.innerWidth);
            setScreenHeight(window.innerHeight);
        };

        // Add event listener
        window.addEventListener('resize', handleResize);

        // Call handler right away so state gets updated with initial window size
        handleResize();

        // Remove event listener on cleanup
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isMobile = screenWidth < breakpoints.mobile;
    const isTablet = screenWidth >= breakpoints.mobile && screenWidth < breakpoints.tablet;
    const isDesktop = screenWidth >= breakpoints.tablet;

    const orientation = screenHeight > screenWidth ? 'portrait' : 'landscape';

    const deviceType = isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop';

    return {
        isMobile,
        isTablet,
        isDesktop,
        screenWidth,
        screenHeight,
        orientation,
        deviceType
    };
};

// Hook for touch device detection
export const useTouchDevice = (): boolean => {
    const [isTouchDevice, setIsTouchDevice] = useState(false);

    useEffect(() => {
        const checkTouchDevice = () => {
            setIsTouchDevice(
                'ontouchstart' in window ||
                navigator.maxTouchPoints > 0 ||
                (navigator as any).msMaxTouchPoints > 0
            );
        };

        checkTouchDevice();
    }, []);

    return isTouchDevice;
};

// Hook for device capabilities
export const useDeviceCapabilities = () => {
    const [capabilities, setCapabilities] = useState({
        hasTouch: false,
        hasHover: false,
        hasKeyboard: false,
        hasMouse: false,
        isRetina: false,
        supportsWebGL: false,
        supportsWebP: false,
        supportsServiceWorker: false
    });

    useEffect(() => {
        const checkCapabilities = () => {
            setCapabilities({
                hasTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
                hasHover: window.matchMedia('(hover: hover)').matches,
                hasKeyboard: 'keyboard' in navigator || 'KeyboardEvent' in window,
                hasMouse: window.matchMedia('(pointer: fine)').matches,
                isRetina: window.devicePixelRatio > 1,
                supportsWebGL: !!document.createElement('canvas').getContext('webgl'),
                supportsWebP: (() => {
                    const canvas = document.createElement('canvas');
                    canvas.width = 1;
                    canvas.height = 1;
                    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
                })(),
                supportsServiceWorker: 'serviceWorker' in navigator
            });
        };

        checkCapabilities();
    }, []);

    return capabilities;
};

// Hook for viewport visibility
export const useViewportVisibility = (): boolean => {
    const [isVisible, setIsVisible] = useState(!document.hidden);

    useEffect(() => {
        const handleVisibilityChange = () => {
            setIsVisible(!document.hidden);
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    return isVisible;
};

// Hook for network status
export const useNetworkStatus = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [connectionType, setConnectionType] = useState<string>('unknown');

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Check connection type if available
        if ('connection' in navigator) {
            const connection = (navigator as any).connection;
            setConnectionType(connection.effectiveType || 'unknown');

            const handleConnectionChange = () => {
                setConnectionType(connection.effectiveType || 'unknown');
            };

            connection.addEventListener('change', handleConnectionChange);

            return () => {
                window.removeEventListener('online', handleOnline);
                window.removeEventListener('offline', handleOffline);
                connection.removeEventListener('change', handleConnectionChange);
            };
        }

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return { isOnline, connectionType };
};

// Hook for safe area insets (for mobile devices with notches)
export const useSafeAreaInsets = () => {
    const [insets, setInsets] = useState({
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
    });

    useEffect(() => {
        const updateInsets = () => {
            const computedStyle = getComputedStyle(document.documentElement);

            setInsets({
                top: parseInt(computedStyle.getPropertyValue('--safe-area-inset-top') || '0'),
                right: parseInt(computedStyle.getPropertyValue('--safe-area-inset-right') || '0'),
                bottom: parseInt(computedStyle.getPropertyValue('--safe-area-inset-bottom') || '0'),
                left: parseInt(computedStyle.getPropertyValue('--safe-area-inset-left') || '0')
            });
        };

        updateInsets();
        window.addEventListener('resize', updateInsets);

        return () => {
            window.removeEventListener('resize', updateInsets);
        };
    }, []);

    return insets;
};

// Hook for gesture detection
export const useGestures = (elementRef: React.RefObject<HTMLElement>) => {
    const [gestures, setGestures] = useState({
        swipeLeft: false,
        swipeRight: false,
        swipeUp: false,
        swipeDown: false,
        tap: false,
        longPress: false,
        pinch: false
    });

    useEffect(() => {
        const element = elementRef.current;
        if (!element) return;

        let startX = 0;
        let startY = 0;
        let startTime = 0;
        let longPressTimer: NodeJS.Timeout | null = null;

        const handleTouchStart = (e: TouchEvent) => {
            const touch = e.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;
            startTime = Date.now();

            // Long press detection
            longPressTimer = setTimeout(() => {
                setGestures(prev => ({ ...prev, longPress: true }));
            }, 500);
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (longPressTimer) {
                clearTimeout(longPressTimer);
                longPressTimer = null;
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
                    if (Math.abs(deltaX) > minSwipeDistance) {
                        if (deltaX > 0) {
                            setGestures(prev => ({ ...prev, swipeRight: true }));
                        } else {
                            setGestures(prev => ({ ...prev, swipeLeft: true }));
                        }
                    }
                } else {
                    if (Math.abs(deltaY) > minSwipeDistance) {
                        if (deltaY > 0) {
                            setGestures(prev => ({ ...prev, swipeDown: true }));
                        } else {
                            setGestures(prev => ({ ...prev, swipeUp: true }));
                        }
                    }
                }
            }

            // Tap detection
            if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10 && deltaTime < 200) {
                setGestures(prev => ({ ...prev, tap: true }));
            }

            // Reset gestures after a short delay
            setTimeout(() => {
                setGestures({
                    swipeLeft: false,
                    swipeRight: false,
                    swipeUp: false,
                    swipeDown: false,
                    tap: false,
                    longPress: false,
                    pinch: false
                });
            }, 100);
        };

        element.addEventListener('touchstart', handleTouchStart);
        element.addEventListener('touchmove', handleTouchMove);
        element.addEventListener('touchend', handleTouchEnd);

        return () => {
            element.removeEventListener('touchstart', handleTouchStart);
            element.removeEventListener('touchmove', handleTouchMove);
            element.removeEventListener('touchend', handleTouchEnd);
            if (longPressTimer) {
                clearTimeout(longPressTimer);
            }
        };
    }, [elementRef]);

    return gestures;
};

// Hook for responsive breakpoint utilities
export const useBreakpoint = (breakpoint: keyof BreakpointConfig) => {
    const { screenWidth } = useResponsive();
    const breakpoints = defaultBreakpoints;

    switch (breakpoint) {
        case 'mobile':
            return screenWidth < breakpoints.mobile;
        case 'tablet':
            return screenWidth >= breakpoints.mobile && screenWidth < breakpoints.tablet;
        case 'desktop':
            return screenWidth >= breakpoints.tablet;
        default:
            return false;
    }
};

// Hook for responsive values
export const useResponsiveValue = <T>(values: {
    mobile: T;
    tablet: T;
    desktop: T;
}): T => {
    const { isMobile, isTablet, isDesktop } = useResponsive();

    if (isMobile) return values.mobile;
    if (isTablet) return values.tablet;
    if (isDesktop) return values.desktop;

    return values.desktop; // fallback
};
