/**
 * Custom hook for fullscreen functionality
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export interface UseFullscreenOptions {
    onEnter?: () => void;
    onExit?: () => void;
    onError?: (error: Error) => void;
}

export function useFullscreen(
    options: UseFullscreenOptions = {}
): {
    isFullscreen: boolean;
    enter: () => Promise<void>;
    exit: () => Promise<void>;
    toggle: () => Promise<void>;
    ref: React.RefObject<HTMLElement>;
    isSupported: boolean;
} {
    const { onEnter, onExit, onError } = options;
    const [isFullscreen, setIsFullscreen] = useState(false);
    const ref = useRef<HTMLElement>(null);
    const isSupported = 'fullscreenEnabled' in document;

    const enter = useCallback(async () => {
        if (!isSupported) return;

        try {
            const element = ref.current || document.documentElement;

            if (element.requestFullscreen) {
                await element.requestFullscreen();
            } else if ((element as any).webkitRequestFullscreen) {
                await (element as any).webkitRequestFullscreen();
            } else if ((element as any).mozRequestFullScreen) {
                await (element as any).mozRequestFullScreen();
            } else if ((element as any).msRequestFullscreen) {
                await (element as any).msRequestFullscreen();
            }
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            onError?.(err);
        }
    }, [isSupported, onError]);

    const exit = useCallback(async () => {
        if (!isSupported) return;

        try {
            if (document.exitFullscreen) {
                await document.exitFullscreen();
            } else if ((document as any).webkitExitFullscreen) {
                await (document as any).webkitExitFullscreen();
            } else if ((document as any).mozCancelFullScreen) {
                await (document as any).mozCancelFullScreen();
            } else if ((document as any).msExitFullscreen) {
                await (document as any).msExitFullscreen();
            }
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            onError?.(err);
        }
    }, [isSupported, onError]);

    const toggle = useCallback(async () => {
        if (isFullscreen) {
            await exit();
        } else {
            await enter();
        }
    }, [isFullscreen, enter, exit]);

    const handleFullscreenChange = useCallback(() => {
        const isCurrentlyFullscreen = !!(
            document.fullscreenElement ||
            (document as any).webkitFullscreenElement ||
            (document as any).mozFullScreenElement ||
            (document as any).msFullscreenElement
        );

        setIsFullscreen(isCurrentlyFullscreen);

        if (isCurrentlyFullscreen) {
            onEnter?.();
        } else {
            onExit?.();
        }
    }, [onEnter, onExit]);

    useEffect(() => {
        if (!isSupported) return;

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('mozfullscreenchange', handleFullscreenChange);
        document.addEventListener('MSFullscreenChange', handleFullscreenChange);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
            document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
            document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
        };
    }, [isSupported, handleFullscreenChange]);

    return {
        isFullscreen,
        enter,
        exit,
        toggle,
        ref,
        isSupported,
    };
}

export default useFullscreen;
