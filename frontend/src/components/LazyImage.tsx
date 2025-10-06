/**
 * 이미지 지연 로딩 컴포넌트 (v1.3 성능 최적화)
 * Intersection Observer API를 사용한 효율적인 이미지 로딩
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Box, CircularProgress, Typography, Skeleton } from '@mui/material';
import { Error as ErrorIcon, Image as ImageIcon } from '@mui/icons-material';

export interface LazyImageProps {
    src: string;
    alt: string;
    width?: number | string;
    height?: number | string;
    placeholder?: React.ReactNode;
    errorPlaceholder?: React.ReactNode;
    threshold?: number;
    rootMargin?: string;
    onLoad?: () => void;
    onError?: (error: Error) => void;
    className?: string;
    style?: React.CSSProperties;
    priority?: boolean; // 우선 로딩 여부
    sizes?: string; // 반응형 이미지 크기
    srcSet?: string; // 반응형 이미지 소스셋
}

export interface ImageLoadState {
    isLoading: boolean;
    isLoaded: boolean;
    isError: boolean;
    isInView: boolean;
}

/**
 * 지연 로딩 이미지 컴포넌트
 */
export const LazyImage: React.FC<LazyImageProps> = ({
    src,
    alt,
    width,
    height,
    placeholder,
    errorPlaceholder,
    threshold = 0.1,
    rootMargin = '50px',
    onLoad,
    onError,
    className,
    style,
    priority = false,
    sizes,
    srcSet
}) => {
    const [loadState, setLoadState] = useState<ImageLoadState>({
        isLoading: false,
        isLoaded: false,
        isError: false,
        isInView: priority // 우선 로딩인 경우 즉시 뷰포트에 있다고 간주
    });

    const imgRef = useRef<HTMLImageElement>(null);
    const observerRef = useRef<IntersectionObserver | null>(null);

    // 이미지 로드 처리
    const handleImageLoad = useCallback(() => {
        setLoadState(prev => ({
            ...prev,
            isLoading: false,
            isLoaded: true,
            isError: false
        }));
        onLoad?.();
    }, [onLoad]);

    const handleImageError = useCallback((error: Error) => {
        setLoadState(prev => ({
            ...prev,
            isLoading: false,
            isLoaded: false,
            isError: true
        }));
        onError?.(error);
    }, [onError]);

    // Intersection Observer 설정
    useEffect(() => {
        if (priority || loadState.isInView) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setLoadState(prev => ({ ...prev, isInView: true }));
                        observer.unobserve(entry.target);
                    }
                });
            },
            {
                threshold,
                rootMargin
            }
        );

        observerRef.current = observer;

        if (imgRef.current) {
            observer.observe(imgRef.current);
        }

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [threshold, rootMargin, priority, loadState.isInView]);

    // 이미지 로딩 시작
    useEffect(() => {
        if (!loadState.isInView || loadState.isLoading || loadState.isLoaded || loadState.isError) {
            return;
        }

        setLoadState(prev => ({ ...prev, isLoading: true }));

        const img = new Image();
        img.onload = handleImageLoad;
        img.onerror = () => handleImageError(new Error('이미지 로딩 실패'));
        img.src = src;

        // srcSet이 있는 경우 설정
        if (srcSet) {
            img.srcset = srcSet;
        }

        // sizes가 있는 경우 설정
        if (sizes) {
            img.sizes = sizes;
        }

    }, [loadState.isInView, loadState.isLoading, loadState.isLoaded, loadState.isError, src, srcSet, sizes, handleImageLoad, handleImageError]);

    // 기본 플레이스홀더
    const defaultPlaceholder = (
        <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            width={width || '100%'}
            height={height || 200}
            bgcolor="grey.100"
            className="lazy-image-placeholder"
        >
            <CircularProgress size={24} />
            <Typography variant="caption" sx={{ mt: 1 }}>
                이미지 로딩 중...
            </Typography>
        </Box>
    );

    // 기본 에러 플레이스홀더
    const defaultErrorPlaceholder = (
        <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            width={width || '100%'}
            height={height || 200}
            bgcolor="grey.100"
            className="lazy-image-error"
        >
            <ErrorIcon color="error" />
            <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                이미지 로딩 실패
            </Typography>
        </Box>
    );

    // 스켈레톤 플레이스홀더
    const skeletonPlaceholder = (
        <Skeleton
            variant="rectangular"
            width={width || '100%'}
            height={height || 200}
            animation="wave"
            className="lazy-image-skeleton"
        />
    );

    return (
        <Box
            ref={imgRef}
            className={`lazy-image-container ${className || ''}`}
            style={style}
            width={width}
            height={height}
        >
            {loadState.isError ? (
                errorPlaceholder || defaultErrorPlaceholder
            ) : loadState.isLoaded ? (
                <img
                    src={src}
                    alt={alt}
                    width={width}
                    height={height}
                    className="lazy-image-loaded"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
            ) : loadState.isLoading ? (
                placeholder || skeletonPlaceholder
            ) : (
                <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    width={width || '100%'}
                    height={height || 200}
                    bgcolor="grey.50"
                    className="lazy-image-waiting"
                >
                    <ImageIcon color="disabled" />
                </Box>
            )}
        </Box>
    );
};

/**
 * 반응형 지연 로딩 이미지 컴포넌트
 */
export const ResponsiveLazyImage: React.FC<Omit<LazyImageProps, 'srcSet' | 'sizes'> & {
    breakpoints?: { [key: string]: string };
    defaultSrc?: string;
}> = ({
    src,
    breakpoints = {
        mobile: '400w',
        tablet: '800w',
        desktop: '1200w'
    },
    defaultSrc,
    ...props
}) => {
        const [srcSet, setSrcSet] = useState<string>('');
        const [sizes, setSizes] = useState<string>('');

        useEffect(() => {
            // srcSet 생성
            const srcSetArray = Object.entries(breakpoints).map(([breakpoint, width]) => {
                const breakpointSrc = src.replace(/\.(jpg|jpeg|png|webp)$/, `_${breakpoint}.$1`);
                return `${breakpointSrc} ${width}`;
            });

            setSrcSet(srcSetArray.join(', '));

            // sizes 생성
            const sizesArray = Object.entries(breakpoints).map(([breakpoint, width]) => {
                const mediaQuery = breakpoint === 'mobile' ? '(max-width: 768px)' :
                    breakpoint === 'tablet' ? '(max-width: 1024px)' :
                        '(min-width: 1025px)';
                return `${mediaQuery} ${width}`;
            });

            setSizes(sizesArray.join(', '));
        }, [src, breakpoints]);

        return (
            <LazyImage
                src={defaultSrc || src}
                srcSet={srcSet}
                sizes={sizes}
                {...props}
            />
        );
    };

/**
 * 이미지 갤러리용 지연 로딩 컴포넌트
 */
export const LazyImageGallery: React.FC<{
    images: Array<{
        src: string;
        alt: string;
        thumbnail?: string;
        width?: number;
        height?: number;
    }>;
    columns?: number;
    gap?: number;
    onImageClick?: (index: number) => void;
}> = ({ images, columns = 3, gap = 16, onImageClick }) => {
    return (
        <Box
            display="grid"
            gridTemplateColumns={`repeat(${columns}, 1fr)`}
            gap={gap}
            className="lazy-image-gallery"
        >
            {images.map((image, index) => (
                <Box
                    key={index}
                    onClick={() => onImageClick?.(index)}
                    sx={{ cursor: 'pointer' }}
                    className="gallery-item"
                >
                    <LazyImage
                        src={image.thumbnail || image.src}
                        alt={image.alt}
                        width={image.width}
                        height={image.height}
                        className="gallery-image"
                    />
                </Box>
            ))}
        </Box>
    );
};

/**
 * 채팅 메시지용 이미지 컴포넌트
 */
export const ChatImage: React.FC<{
    src: string;
    alt: string;
    maxWidth?: number;
    maxHeight?: number;
    onLoad?: () => void;
    onError?: (error: Error) => void;
}> = ({ src, alt, maxWidth = 300, maxHeight = 300, onLoad, onError }) => {
    return (
        <LazyImage
            src={src}
            alt={alt}
            width={maxWidth}
            height={maxHeight}
            threshold={0.5}
            rootMargin="100px"
            placeholder={
                <Skeleton
                    variant="rectangular"
                    width={maxWidth}
                    height={maxHeight}
                    animation="wave"
                />
            }
            onLoad={onLoad}
            onError={onError}
            className="chat-image"
        />
    );
};

export default LazyImage;
