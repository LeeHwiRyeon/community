/**
 * Custom hook for virtual scrolling functionality
 */

import { useState, useEffect, useCallback, useMemo } from 'react';

export interface UseVirtualScrollOptions<T> {
    data: T[];
    itemHeight: number;
    containerHeight: number;
    overscan?: number;
    scrollToIndex?: number;
    scrollToAlignment?: 'start' | 'center' | 'end' | 'auto';
}

export function useVirtualScroll<T>(
    options: UseVirtualScrollOptions<T>
): {
    data: T[];
    scrollTop: number;
    setScrollTop: (scrollTop: number) => void;
    scrollToIndex: (index: number, alignment?: 'start' | 'center' | 'end' | 'auto') => void;
    visibleRange: { start: number; end: number };
    totalHeight: number;
    offsetY: number;
    visibleData: T[];
    isScrolling: boolean;
    scrollDirection: 'up' | 'down' | null;
} {
    const {
        data,
        itemHeight,
        containerHeight,
        overscan = 5,
        scrollToIndex: initialScrollToIndex,
        scrollToAlignment = 'auto',
    } = options;

    const [scrollTop, setScrollTop] = useState(0);
    const [isScrolling, setIsScrolling] = useState(false);
    const [scrollDirection, setScrollDirection] = useState<'up' | 'down' | null>(null);
    const [lastScrollTop, setLastScrollTop] = useState(0);

    const totalHeight = data.length * itemHeight;
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(data.length - 1, startIndex + visibleCount + overscan * 2);
    const offsetY = startIndex * itemHeight;

    const visibleRange = { start: startIndex, end: endIndex };
    const visibleData = data.slice(startIndex, endIndex + 1);

    const scrollToIndex = useCallback((index: number, alignment: 'start' | 'center' | 'end' | 'auto' = scrollToAlignment) => {
        if (index < 0 || index >= data.length) return;

        let newScrollTop = index * itemHeight;

        switch (alignment) {
            case 'center':
                newScrollTop = newScrollTop - containerHeight / 2 + itemHeight / 2;
                break;
            case 'end':
                newScrollTop = newScrollTop - containerHeight + itemHeight;
                break;
            case 'start':
            case 'auto':
            default:
                // newScrollTop is already correct
                break;
        }

        setScrollTop(Math.max(0, newScrollTop));
    }, [data.length, itemHeight, containerHeight, scrollToAlignment]);

    const handleScroll = useCallback((newScrollTop: number) => {
        setScrollTop(newScrollTop);

        if (newScrollTop > lastScrollTop) {
            setScrollDirection('down');
        } else if (newScrollTop < lastScrollTop) {
            setScrollDirection('up');
        }

        setLastScrollTop(newScrollTop);
        setIsScrolling(true);
    }, [lastScrollTop]);

    // Scroll to initial index
    useEffect(() => {
        if (initialScrollToIndex !== undefined) {
            scrollToIndex(initialScrollToIndex);
        }
    }, [initialScrollToIndex, scrollToIndex]);

    // Reset scrolling state after scroll ends
    useEffect(() => {
        if (isScrolling) {
            const timer = setTimeout(() => {
                setIsScrolling(false);
                setScrollDirection(null);
            }, 150);

            return () => clearTimeout(timer);
        }
    }, [isScrolling]);

    return {
        data,
        scrollTop,
        setScrollTop: handleScroll,
        scrollToIndex,
        visibleRange,
        totalHeight,
        offsetY,
        visibleData,
        isScrolling,
        scrollDirection,
    };
}

export default useVirtualScroll;
