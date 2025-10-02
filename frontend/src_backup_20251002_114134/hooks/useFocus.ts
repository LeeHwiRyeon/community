/**
 * Custom hook for focus management
 */

import { useState, useCallback, useRef, useEffect } from 'react';

export interface UseFocusOptions {
    initialFocus?: boolean;
    onFocus?: () => void;
    onBlur?: () => void;
    onFocusChange?: (isFocused: boolean) => void;
}

export function useFocus(
    options: UseFocusOptions = {}
): {
    isFocused: boolean;
    focus: () => void;
    blur: () => void;
    toggle: () => void;
    ref: React.RefObject<HTMLElement>;
} {
    const { initialFocus = false, onFocus, onBlur, onFocusChange } = options;
    const [isFocused, setIsFocused] = useState(initialFocus);
    const ref = useRef<HTMLElement>(null);

    const focus = useCallback(() => {
        if (ref.current) {
            ref.current.focus();
        }
    }, []);

    const blur = useCallback(() => {
        if (ref.current) {
            ref.current.blur();
        }
    }, []);

    const toggle = useCallback(() => {
        if (isFocused) {
            blur();
        } else {
            focus();
        }
    }, [isFocused, focus, blur]);

    const handleFocus = useCallback(() => {
        setIsFocused(true);
        onFocus?.();
        onFocusChange?.(true);
    }, [onFocus, onFocusChange]);

    const handleBlur = useCallback(() => {
        setIsFocused(false);
        onBlur?.();
        onFocusChange?.(false);
    }, [onBlur, onFocusChange]);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        element.addEventListener('focus', handleFocus);
        element.addEventListener('blur', handleBlur);

        return () => {
            element.removeEventListener('focus', handleFocus);
            element.removeEventListener('blur', handleBlur);
        };
    }, [handleFocus, handleBlur]);

    return {
        isFocused,
        focus,
        blur,
        toggle,
        ref,
    };
}

export default useFocus;
