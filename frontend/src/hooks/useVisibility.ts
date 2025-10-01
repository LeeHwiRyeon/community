/**
 * Custom hook for page visibility
 */

import { useState, useEffect, useCallback } from 'react';

export interface UseVisibilityOptions {
    onVisible?: () => void;
    onHidden?: () => void;
    onVisibilityChange?: (isVisible: boolean) => void;
}

export function useVisibility(
    options: UseVisibilityOptions = {}
): {
    isVisible: boolean;
    isHidden: boolean;
    lastVisible: Date | null;
    lastHidden: Date | null;
    visibleCount: number;
    hiddenCount: number;
} {
    const { onVisible, onHidden, onVisibilityChange } = options;
    const [isVisible, setIsVisible] = useState(!document.hidden);
    const [lastVisible, setLastVisible] = useState<Date | null>(null);
    const [lastHidden, setLastHidden] = useState<Date | null>(null);
    const [visibleCount, setVisibleCount] = useState(0);
    const [hiddenCount, setHiddenCount] = useState(0);

    const handleVisibilityChange = useCallback(() => {
        const isPageVisible = !document.hidden;
        setIsVisible(isPageVisible);

        if (isPageVisible) {
            setLastVisible(new Date());
            setVisibleCount(prev => prev + 1);
            onVisible?.();
        } else {
            setLastHidden(new Date());
            setHiddenCount(prev => prev + 1);
            onHidden?.();
        }

        onVisibilityChange?.(isPageVisible);
    }, [onVisible, onHidden, onVisibilityChange]);

    useEffect(() => {
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [handleVisibilityChange]);

    return {
        isVisible,
        isHidden: !isVisible,
        lastVisible,
        lastHidden,
        visibleCount,
        hiddenCount,
    };
}

export default useVisibility;
