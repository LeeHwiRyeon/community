import React, { useState, useEffect, useRef } from 'react';
import { Box, Skeleton } from '@mui/material';

interface LazyImageProps {
    src: string;
    alt: string;
    width?: string | number;
    height?: string | number;
    className?: string;
    style?: React.CSSProperties;
    onLoad?: () => void;
    onError?: (error: Error) => void;
    placeholder?: string;
    blurDataURL?: string;
    objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
}

/**
 * 레이지 로딩을 지원하는 이미지 컴포넌트
 * 
 * Features:
 * - Intersection Observer를 사용한 지연 로딩
 * - Progressive loading (blur → sharp)
 * - 로딩 중 스켈레톤 표시
 * - 에러 처리 및 폴백
 * 
 * @example
 * ```tsx
 * <LazyImage
 *   src="/path/to/image.jpg"
 *   alt="Description"
 *   width="100%"
 *   height={200}
 *   objectFit="cover"
 * />
 * ```
 */
export const LazyImage: React.FC<LazyImageProps> = ({
    src,
    alt,
    width = '100%',
    height = 'auto',
    className,
    style,
    onLoad,
    onError,
    placeholder = '/placeholder.png',
    blurDataURL,
    objectFit = 'cover'
}) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isInView, setIsInView] = useState(false);
    const [hasError, setHasError] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setIsInView(true);
                        observer.disconnect();
                    }
                });
            },
            {
                rootMargin: '50px', // 50px 전에 미리 로드
                threshold: 0.01
            }
        );

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => {
            observer.disconnect();
        };
    }, []);

    const handleLoad = () => {
        setIsLoaded(true);
        onLoad?.();
    };

    const handleError = () => {
        setHasError(true);
        onError?.(new Error(`Failed to load image: ${src}`));
    };

    return (
        <Box
            ref={containerRef}
            sx={{
                position: 'relative',
                width,
                height,
                overflow: 'hidden',
                backgroundColor: 'grey.100',
                ...style
            }}
            className={className}
        >
            {/* 로딩 스켈레톤 */}
            {!isLoaded && !hasError && (
                <Skeleton
                    variant="rectangular"
                    width="100%"
                    height="100%"
                    animation="wave"
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0
                    }}
                />
            )}

            {/* Blur 플레이스홀더 */}
            {blurDataURL && !isLoaded && isInView && (
                <img
                    src={blurDataURL}
                    alt=""
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit,
                        filter: 'blur(10px)',
                        transform: 'scale(1.1)'
                    }}
                />
            )}

            {/* 실제 이미지 */}
            {isInView && !hasError && (
                <img
                    ref={imgRef}
                    src={src}
                    alt={alt}
                    onLoad={handleLoad}
                    onError={handleError}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit,
                        opacity: isLoaded ? 1 : 0,
                        transition: 'opacity 0.3s ease-in-out'
                    }}
                />
            )}

            {/* 에러 폴백 */}
            {hasError && placeholder && (
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100%',
                        height: '100%',
                        backgroundColor: 'grey.200'
                    }}
                >
                    <img
                        src={placeholder}
                        alt="Failed to load"
                        style={{
                            width: '50%',
                            height: '50%',
                            objectFit: 'contain',
                            opacity: 0.5
                        }}
                    />
                </Box>
            )}
        </Box>
    );
};

/**
 * 배경 이미지로 사용할 수 있는 레이지 로딩 컨테이너
 */
export const LazyBackgroundImage: React.FC<{
    src: string;
    children?: React.ReactNode;
    width?: string | number;
    height?: string | number;
    style?: React.CSSProperties;
    className?: string;
}> = ({ src, children, width = '100%', height = 300, style, className }) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isInView, setIsInView] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setIsInView(true);
                        observer.disconnect();
                    }
                });
            },
            {
                rootMargin: '50px',
                threshold: 0.01
            }
        );

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => {
            observer.disconnect();
        };
    }, []);

    useEffect(() => {
        if (isInView) {
            const img = new Image();
            img.src = src;
            img.onload = () => setIsLoaded(true);
        }
    }, [isInView, src]);

    return (
        <Box
            ref={containerRef}
            sx={{
                position: 'relative',
                width,
                height,
                backgroundImage: isLoaded ? `url(${src})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundColor: 'grey.200',
                transition: 'background-image 0.3s ease-in-out',
                ...style
            }}
            className={className}
        >
            {!isLoaded && (
                <Skeleton
                    variant="rectangular"
                    width="100%"
                    height="100%"
                    animation="wave"
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0
                    }}
                />
            )}
            {children}
        </Box>
    );
};

export default LazyImage;
