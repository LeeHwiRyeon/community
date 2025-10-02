/**
 * Custom hook for keyboard shortcuts
 */

import { useEffect, useCallback } from 'react';

export interface UseKeyboardShortcutOptions {
    preventDefault?: boolean;
    stopPropagation?: boolean;
    target?: EventTarget | null;
}

export function useKeyboardShortcut(
    key: string,
    callback: (event: KeyboardEvent) => void,
    options: UseKeyboardShortcutOptions = {}
): void {
    const { preventDefault = true, stopPropagation = false, target = null } = options;

    const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
            if (event.key === key) {
                if (preventDefault) {
                    event.preventDefault();
                }
                if (stopPropagation) {
                    event.stopPropagation();
                }
                callback(event);
            }
        },
        [key, callback, preventDefault, stopPropagation]
    );

    useEffect(() => {
        const targetElement = target || document;
        targetElement.addEventListener('keydown', handleKeyDown);
        return () => {
            targetElement.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown, target]);
}

export default useKeyboardShortcut;
