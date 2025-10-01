import React, { useEffect, useRef, useState } from 'react';
import { Box, BoxProps } from '@chakra-ui/react';

interface ScaleInProps extends BoxProps {
    children: React.ReactNode;
    delay?: number;
    duration?: number;
    scale?: number;
    threshold?: number;
    once?: boolean;
    bounce?: boolean;
}

export const ScaleIn: React.FC<ScaleInProps> = ({
    children,
    delay = 0,
    duration = 500,
    scale = 0.8,
    threshold = 0.1,
    once = true,
    bounce = false,
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
            return `scale(${scale})`;
        }
        return 'scale(1)';
    };

    const getTransition = () => {
        if (bounce) {
            return `opacity ${duration}ms ease-out, transform ${duration}ms cubic-bezier(0.68, -0.55, 0.265, 1.55)`;
        }
        return `opacity ${duration}ms ease-out, transform ${duration}ms ease-out`;
    };

    return (
        <Box
            ref={elementRef}
            opacity={isVisible ? 1 : 0}
            transform={getTransform()}
            transition={getTransition()}
            {...props}
        >
            {children}
        </Box>
    );
};

export default ScaleIn;
