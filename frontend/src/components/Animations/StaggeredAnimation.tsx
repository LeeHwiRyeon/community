import React, { useEffect, useRef, useState } from 'react';
import { Box, BoxProps } from '@chakra-ui/react';

interface StaggeredAnimationProps extends BoxProps {
    children: React.ReactNode[];
    delay?: number;
    staggerDelay?: number;
    duration?: number;
    threshold?: number;
    once?: boolean;
    animation?: 'fade' | 'scale' | 'slide';
    direction?: 'up' | 'down' | 'left' | 'right';
}

export const StaggeredAnimation: React.FC<StaggeredAnimationProps> = ({
    children,
    delay = 0,
    staggerDelay = 100,
    duration = 500,
    threshold = 0.1,
    once = true,
    animation = 'fade',
    direction = 'up',
    ...props
}) => {
    const [visibleItems, setVisibleItems] = useState<boolean[]>([]);
    const [hasAnimated, setHasAnimated] = useState(false);
    const elementRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !hasAnimated) {
                    const itemCount = children.length;
                    const newVisibleItems = new Array(itemCount).fill(false);

                    // 각 아이템을 순차적으로 표시
                    for (let i = 0; i < itemCount; i++) {
                        setTimeout(() => {
                            setVisibleItems(prev => {
                                const newState = [...prev];
                                newState[i] = true;
                                return newState;
                            });
                        }, delay + (i * staggerDelay));
                    }

                    if (once) {
                        setHasAnimated(true);
                    }
                } else if (!once && !entry.isIntersecting) {
                    setVisibleItems(new Array(children.length).fill(false));
                }
            },
            { threshold }
        );

        if (elementRef.current) {
            observer.observe(elementRef.current);
        }

        return () => observer.disconnect();
    }, [children.length, delay, staggerDelay, threshold, once, hasAnimated]);

    const getAnimationStyle = (index: number) => {
        const isVisible = visibleItems[index];

        switch (animation) {
            case 'fade':
                return {
                    opacity: isVisible ? 1 : 0,
                    transform: 'translateY(0)',
                };
            case 'scale':
                return {
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible ? 'scale(1)' : 'scale(0.8)',
                };
            case 'slide':
                const slideDistance = 30;
                let transform = 'translateY(0)';

                if (!isVisible) {
                    switch (direction) {
                        case 'up':
                            transform = `translateY(${slideDistance}px)`;
                            break;
                        case 'down':
                            transform = `translateY(-${slideDistance}px)`;
                            break;
                        case 'left':
                            transform = `translateX(${slideDistance}px)`;
                            break;
                        case 'right':
                            transform = `translateX(-${slideDistance}px)`;
                            break;
                    }
                }

                return {
                    opacity: isVisible ? 1 : 0,
                    transform,
                };
            default:
                return {
                    opacity: isVisible ? 1 : 0,
                    transform: 'translateY(0)',
                };
        }
    };

    return (
        <Box ref={elementRef} {...props}>
            {children.map((child, index) => (
                <Box
                    key={index}
                    style={{
                        ...getAnimationStyle(index),
                        transition: `opacity ${duration}ms ease-out, transform ${duration}ms ease-out`,
                    }}
                >
                    {child}
                </Box>
            ))}
        </Box>
    );
};

export default StaggeredAnimation;
