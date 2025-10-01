import React, { memo, useState, useRef, useEffect, useCallback } from 'react';
import { Box, Skeleton, Image, useColorModeValue } from '@chakra-ui/react';

interface LazyImageProps {
    src: string;
    alt: string;
    width?: string | number;
    height?: string | number;
    objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
    borderRadius?: string | number;
    fallbackSrc?: string;
    placeholder?: React.ReactNode;
    onLoad?: () => void;
    onError?: () => void;
    threshold?: number;
    rootMargin?: string;
    className?: string;
    style?: React.CSSProperties;
}

/**
 * Lazy Loading Image Component
 * Uses Intersection Observer API for efficient image loading
 */
const LazyImage = memo<LazyImageProps>(({
    src,
    alt,
    width = '100%',
    height = '200px',
    objectFit = 'cover',
    borderRadius = 'md',
    fallbackSrc = '/images/placeholder.png',
    placeholder,
    onLoad,
    onError,
    threshold = 0.1,
    rootMargin = '50px',
    className,
    style
}) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isInView, setIsInView] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [currentSrc, setCurrentSrc] = useState<string | null>(null);

    const imgRef = useRef<HTMLDivElement>(null);
    const observerRef = useRef<IntersectionObserver | null>(null);

    const bgColor = useColorModeValue('gray.100', 'gray.700');

    // Handle image load
    const handleLoad = useCallback(() => {
        setIsLoaded(true);
        onLoad?.();
    }, [onLoad]);

    // Handle image error
    const handleError = useCallback(() => {
        setHasError(true);
        if (fallbackSrc && currentSrc !== fallbackSrc) {
            setCurrentSrc(fallbackSrc);
        }
        onError?.();
    }, [onError, fallbackSrc, currentSrc]);

    // Set up intersection observer
    useEffect(() => {
        if (!imgRef.current) return;

        observerRef.current = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setIsInView(true);
                        setCurrentSrc(src);
                        observerRef.current?.disconnect();
                    }
                });
            },
            {
                threshold,
                rootMargin
            }
        );

        observerRef.current.observe(imgRef.current);

        return () => {
            observerRef.current?.disconnect();
        };
    }, [src, threshold, rootMargin]);

    // Reset state when src changes
    useEffect(() => {
        setIsLoaded(false);
        setHasError(false);
        setCurrentSrc(null);
    }, [src]);

    // Default placeholder
    const defaultPlaceholder = (
        <Skeleton
            width={width}
            height={height}
            borderRadius={borderRadius}
            startColor="gray.100"
            endColor="gray.200"
        />
    );

    return (
        <Box
            ref={imgRef}
            width={width}
            height={height}
            borderRadius={borderRadius}
            overflow="hidden"
            bg={bgColor}
            className={className}
            style={style}
            position="relative"
        >
            {!isInView ? (
                placeholder || defaultPlaceholder
            ) : currentSrc ? (
                <Image
                    src={currentSrc}
                    alt={alt}
                    width="100%"
                    height="100%"
                    objectFit={objectFit}
                    onLoad={handleLoad}
                    onError={handleError}
                    opacity={isLoaded ? 1 : 0}
                    transition="opacity 0.3s ease-in-out"
                />
            ) : (
                placeholder || defaultPlaceholder
            )}

            {/* Loading overlay */}
            {isInView && !isLoaded && !hasError && (
                <Box
                    position="absolute"
                    top={0}
                    left={0}
                    right={0}
                    bottom={0}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    bg="rgba(255, 255, 255, 0.8)"
                >
                    <Box
                        width="20px"
                        height="20px"
                        border="2px solid"
                        borderColor="gray.300"
                        borderTopColor="blue.500"
                        borderRadius="50%"
                        animation="spin 1s linear infinite"
                    />
                </Box>
            )}

            {/* Error state */}
            {hasError && (
                <Box
                    position="absolute"
                    top={0}
                    left={0}
                    right={0}
                    bottom={0}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    bg="gray.100"
                    color="gray.500"
                    fontSize="sm"
                >
                    이미지를 불러올 수 없습니다
                </Box>
            )}
        </Box>
    );
});

LazyImage.displayName = 'LazyImage';

export default LazyImage;
