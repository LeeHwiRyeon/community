import { useEffect, useCallback } from 'react';

interface KeyboardNavigationOptions {
    onEnter?: () => void;
    onEscape?: () => void;
    onArrowUp?: () => void;
    onArrowDown?: () => void;
    onArrowLeft?: () => void;
    onArrowRight?: () => void;
    onHome?: () => void;
    onEnd?: () => void;
    onPageUp?: () => void;
    onPageDown?: () => void;
    onSpace?: () => void;
    onTab?: (event: KeyboardEvent) => void;
    enabled?: boolean;
}

export const useKeyboardNavigation = (options: KeyboardNavigationOptions = {}) => {
    const {
        onEnter,
        onEscape,
        onArrowUp,
        onArrowDown,
        onArrowLeft,
        onArrowRight,
        onHome,
        onEnd,
        onPageUp,
        onPageDown,
        onSpace,
        onTab,
        enabled = true
    } = options;

    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        if (!enabled) return;

        switch (event.key) {
            case 'Enter':
                if (onEnter) {
                    event.preventDefault();
                    onEnter();
                }
                break;
            case 'Escape':
                if (onEscape) {
                    event.preventDefault();
                    onEscape();
                }
                break;
            case 'ArrowUp':
                if (onArrowUp) {
                    event.preventDefault();
                    onArrowUp();
                }
                break;
            case 'ArrowDown':
                if (onArrowDown) {
                    event.preventDefault();
                    onArrowDown();
                }
                break;
            case 'ArrowLeft':
                if (onArrowLeft) {
                    event.preventDefault();
                    onArrowLeft();
                }
                break;
            case 'ArrowRight':
                if (onArrowRight) {
                    event.preventDefault();
                    onArrowRight();
                }
                break;
            case 'Home':
                if (onHome) {
                    event.preventDefault();
                    onHome();
                }
                break;
            case 'End':
                if (onEnd) {
                    event.preventDefault();
                    onEnd();
                }
                break;
            case 'PageUp':
                if (onPageUp) {
                    event.preventDefault();
                    onPageUp();
                }
                break;
            case 'PageDown':
                if (onPageDown) {
                    event.preventDefault();
                    onPageDown();
                }
                break;
            case ' ':
                if (onSpace) {
                    event.preventDefault();
                    onSpace();
                }
                break;
            case 'Tab':
                if (onTab) {
                    onTab(event);
                }
                break;
        }
    }, [
        enabled,
        onEnter,
        onEscape,
        onArrowUp,
        onArrowDown,
        onArrowLeft,
        onArrowRight,
        onHome,
        onEnd,
        onPageUp,
        onPageDown,
        onSpace,
        onTab
    ]);

    useEffect(() => {
        if (enabled) {
            document.addEventListener('keydown', handleKeyDown);
            return () => {
                document.removeEventListener('keydown', handleKeyDown);
            };
        }
    }, [enabled, handleKeyDown]);

    return { handleKeyDown };
};