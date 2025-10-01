import React, { useEffect, useRef, useState } from 'react';
import { Box, BoxProps } from '@chakra-ui/react';

interface SlideInProps extends BoxProps {
    children: React.ReactNode;
    delay?: number;
    duration?: number;
    direction?: 'left' | 'right' | 'up' | 'down';
    distance?: number;
    threshold?: number;
    once?: boolean;
    type?: 'slide' | 'slide-fade';
}

export const SlideIn: React.FC<SlideInProps> = ({
    children,
    delay = 0,
    duration = 600,
    direction = 'left',
    distance = 100,
    threshold = 0.1,
    once = true,
    type = 'slide-fade',
    ...props
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [hasAnimated, setHasAnimated] = useState(false);
    const elementRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    if (!hasAnimated) {
                        setTimeout(() => {
                            setIsVisible(true);
                            if (once) {
                                setHasAnimated(true);
                            }
                        }, delay);
                    }
                } else if (!once) {
                    setIsVisible(false);
                }
            },
            { threshold }
        );

        if (elementRef.current) {
            observer.observe(elementRef.current);
        }

        return () => observer.disconnect();
    }, [delay, threshold, once, hasAnimated]);

    const getTransform = () => {
        if (!isVisible) {
            switch (direction) {
                case 'left':
                    return `translateX(-${distance}px)`;
                case 'right':
                    return `translateX(${distance}px)`;
                case 'up':
                    return `translateY(-${distance}px)`;
                case 'down':
                    return `translateY(${distance}px)`;
                default:
                    return 'translateX(0) translateY(0)';
            }
        }
        return 'translateX(0) translateY(0)';
    };

    const getOpacity = () => {
        if (type === 'slide-fade') {
            return isVisible ? 1 : 0;
        }
        return 1;
    };

    return (
        <Box
            ref={elementRef}
            opacity={getOpacity()}
            transform={getTransform()}
            transition={`opacity ${duration}ms ease-out, transform ${duration}ms ease-out`}
            {...props}
        >
            {children}
        </Box>
    );
};

export default SlideIn;
