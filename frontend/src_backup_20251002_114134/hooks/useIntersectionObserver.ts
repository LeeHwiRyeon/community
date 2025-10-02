/**
 * Custom hook for intersection observer
 */

import { useEffect, useRef, useState } from 'react';

export interface UseIntersectionObserverOptions {
    threshold?: number | number[];
    root?: Element | null;
    rootMargin?: string;
    freezeOnceVisible?: boolean;
}

export function useIntersectionObserver(
    options: UseIntersectionObserverOptions = {}
): [React.RefObject<HTMLElement>, boolean] {
    const {
        threshold = 0,
        root = null,
        rootMargin = '0%',
        freezeOnceVisible = false,
    } = options;

    const [isIntersecting, setIsIntersecting] = useState(false);
    const [hasIntersected, setHasIntersected] = useState(false);
    const elementRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const node = elementRef.current;
        if (!node) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                const isElementIntersecting = entry.isIntersecting;
                setIsIntersecting(isElementIntersecting);

                if (isElementIntersecting && !hasIntersected) {
                    setHasIntersected(true);
                }
            },
            {
                threshold,
                root,
                rootMargin,
            }
        );

        observer.observe(node);

        return () => {
            observer.unobserve(node);
        };
    }, [threshold, root, rootMargin, hasIntersected]);

    return [elementRef, freezeOnceVisible ? hasIntersected : isIntersecting];
}

export default useIntersectionObserver;
