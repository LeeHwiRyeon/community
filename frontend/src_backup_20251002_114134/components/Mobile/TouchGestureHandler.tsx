import React, { useRef, useEffect, useState } from 'react';
import { Box, BoxProps } from '@chakra-ui/react';

interface TouchGestureHandlerProps extends BoxProps {
    onSwipeLeft?: () => void;
    onSwipeRight?: () => void;
    onSwipeUp?: () => void;
    onSwipeDown?: () => void;
    onPinch?: (scale: number) => void;
    onTap?: () => void;
    onDoubleTap?: () => void;
    onLongPress?: () => void;
    swipeThreshold?: number;
    pinchThreshold?: number;
    longPressDelay?: number;
    children: React.ReactNode;
}

const TouchGestureHandler: React.FC<TouchGestureHandlerProps> = ({
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onPinch,
    onTap,
    onDoubleTap,
    onLongPress,
    swipeThreshold = 50,
    pinchThreshold = 0.1,
    longPressDelay = 500,
    children,
    ...props
}) => {
    const boxRef = useRef<HTMLDivElement>(null);
    const [touchStart, setTouchStart] = useState<{ x: number; y: number; time: number } | null>(null);
    const [touchEnd, setTouchEnd] = useState<{ x: number; y: number; time: number } | null>(null);
    const [lastTap, setLastTap] = useState<number>(0);
    const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
    const [initialDistance, setInitialDistance] = useState<number>(0);

    const getDistance = (touch1: Touch, touch2: Touch): number => {
        const dx = touch1.clientX - touch2.clientX;
        const dy = touch1.clientY - touch2.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    };

    const handleTouchStart = (e: TouchEvent) => {
        const touch = e.touches[0];
        const startTime = Date.now();

        setTouchStart({ x: touch.clientX, y: touch.clientY, time: startTime });
        setTouchEnd(null);

        // Long press timer
        if (onLongPress) {
            const timer = setTimeout(() => {
                onLongPress();
            }, longPressDelay);
            setLongPressTimer(timer);
        }

        // Pinch gesture
        if (e.touches.length === 2 && onPinch) {
            const distance = getDistance(e.touches[0], e.touches[1]);
            setInitialDistance(distance);
        }
    };

    const handleTouchMove = (e: TouchEvent) => {
        const touch = e.touches[0];
        setTouchEnd({ x: touch.clientX, y: touch.clientY, time: Date.now() });

        // Cancel long press if moved
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            setLongPressTimer(null);
        }

        // Pinch gesture
        if (e.touches.length === 2 && onPinch && initialDistance > 0) {
            const currentDistance = getDistance(e.touches[0], e.touches[1]);
            const scale = currentDistance / initialDistance;

            if (Math.abs(scale - 1) > pinchThreshold) {
                onPinch(scale);
            }
        }
    };

    const handleTouchEnd = (e: TouchEvent) => {
        // Clear long press timer
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            setLongPressTimer(null);
        }

        if (!touchStart || !touchEnd) return;

        const deltaX = touchEnd.x - touchStart.x;
        const deltaY = touchEnd.y - touchStart.y;
        const deltaTime = touchEnd.time - touchStart.time;

        // Determine swipe direction
        const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY);
        const isVerticalSwipe = Math.abs(deltaY) > Math.abs(deltaX);

        if (isHorizontalSwipe && Math.abs(deltaX) > swipeThreshold) {
            if (deltaX > 0 && onSwipeRight) {
                onSwipeRight();
            } else if (deltaX < 0 && onSwipeLeft) {
                onSwipeLeft();
            }
        } else if (isVerticalSwipe && Math.abs(deltaY) > swipeThreshold) {
            if (deltaY > 0 && onSwipeDown) {
                onSwipeDown();
            } else if (deltaY < 0 && onSwipeUp) {
                onSwipeUp();
            }
        } else if (deltaTime < 300) {
            // Tap gesture
            const currentTime = Date.now();
            const tapLength = currentTime - lastTap;

            if (tapLength < 500 && tapLength > 0) {
                // Double tap
                if (onDoubleTap) {
                    onDoubleTap();
                }
            } else {
                // Single tap
                if (onTap) {
                    onTap();
                }
            }
            setLastTap(currentTime);
        }

        // Reset
        setTouchStart(null);
        setTouchEnd(null);
        setInitialDistance(0);
    };

    useEffect(() => {
        const box = boxRef.current;
        if (!box) return;

        box.addEventListener('touchstart', handleTouchStart, { passive: false });
        box.addEventListener('touchmove', handleTouchMove, { passive: false });
        box.addEventListener('touchend', handleTouchEnd, { passive: false });

        return () => {
            box.removeEventListener('touchstart', handleTouchStart);
            box.removeEventListener('touchmove', handleTouchMove);
            box.removeEventListener('touchend', handleTouchEnd);

            if (longPressTimer) {
                clearTimeout(longPressTimer);
            }
        };
    }, [touchStart, touchEnd, longPressTimer, initialDistance]);

    return (
        <Box ref={boxRef} {...props}>
            {children}
        </Box>
    );
};

export default TouchGestureHandler;
