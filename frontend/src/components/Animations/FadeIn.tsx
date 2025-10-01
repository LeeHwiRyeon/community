import React, { useEffect, useRef, useState } from 'react';
import { Box, BoxProps } from '@chakra-ui/react';

interface FadeInProps extends BoxProps {
    children: React.ReactNode;
    delay?: number;
    duration?: number;
    direction?: 'up' | 'down' | 'left' | 'right' | 'none';
    distance?: number;
    threshold?: number;
    once?: boolean;
}

export const FadeIn: React.FC<FadeInProps> = ({
    children,
    delay = 0,
    duration = 600,
    direction = 'up',
    distance = 20,
    threshold = 0.1,
    once = true,
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
                case 'up':
                    return `translateY(${distance}px)`;
                case 'down':
                    return `translateY(-${distance}px)`;
                case 'left':
                    return `translateX(${distance}px)`;
                case 'right':
                    return `translateX(-${distance}px)`;
                default:
                    return 'none';
            }
        }
        return 'translateY(0) translateX(0)';
    };

    return (
        <Box
            ref={elementRef}
            opacity={isVisible ? 1 : 0}
            transform={getTransform()}
            transition={`opacity ${duration}ms ease-out, transform ${duration}ms ease-out`}
            {...props}
        >
            {children}
        </Box>
    );
};

export default FadeIn;
