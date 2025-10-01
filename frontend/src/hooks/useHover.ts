/**
 * Custom hook for hover functionality
 */

import { useState, useCallback, useRef, useEffect } from 'react';

export interface UseHoverOptions {
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
    onHoverChange?: (isHovered: boolean) => void;
}

export function useHover(
    options: UseHoverOptions = {}
): {
    isHovered: boolean;
    hoverProps: {
        onMouseEnter: () => void;
        onMouseLeave: () => void;
    };
    ref: React.RefObject<HTMLElement>;
} {
    const { onMouseEnter, onMouseLeave, onHoverChange } = options;
    const [isHovered, setIsHovered] = useState(false);
    const ref = useRef<HTMLElement>(null);

    const handleMouseEnter = useCallback(() => {
        setIsHovered(true);
        onMouseEnter?.();
        onHoverChange?.(true);
    }, [onMouseEnter, onHoverChange]);

    const handleMouseLeave = useCallback(() => {
        setIsHovered(false);
        onMouseLeave?.();
        onHoverChange?.(false);
    }, [onMouseLeave, onHoverChange]);

    const hoverProps = {
        onMouseEnter: handleMouseEnter,
        onMouseLeave: handleMouseLeave,
    };

    return {
        isHovered,
        hoverProps,
        ref,
    };
}

export default useHover;
