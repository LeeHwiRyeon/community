import React from 'react';
import { LazyLoadImage, LazyLoadImageProps } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';
import { Box, BoxProps } from '@chakra-ui/react';
import {
    getOptimizedImageUrl,
    generateSrcSet,
    generateSizes,
    defaultImageConfig,
    ImageOptimizationConfig,
} from '../utils/imageOptimizer';

export interface OptimizedImageProps extends Omit<LazyLoadImageProps, 'effect'> {
    /** 이미지 URL */
    src: string;
    /** 대체 텍스트 */
    alt: string;
    /** 이미지 너비 */
    width?: number | string;
    /** 이미지 높이 */
    height?: number | string;
    /** 최적화 설정 */
    config?: ImageOptimizationConfig;
    /** Chakra UI Box props */
    containerProps?: BoxProps;
    /** 로딩 효과 ('blur' | 'opacity' | 'black-and-white') */
    effect?: 'blur' | 'opacity' | 'black-and-white';
    /** 반응형 이미지 사용 여부 */
    responsive?: boolean;
    /** 이미지 위치 ('above-fold' | 'below-fold') */
    position?: 'above-fold' | 'below-fold';
    /** 추가 className */
    className?: string;
}

/**
 * 최적화된 이미지 컴포넌트
 * - Lazy loading (viewport에 들어올 때만 로드)
 * - WebP 지원 (브라우저가 지원하는 경우)
 * - 반응형 이미지 (srcset/sizes)
 * - Blur placeholder
 * - 성능 최적화
 */
const OptimizedImage: React.FC<OptimizedImageProps> = ({
    src,
    alt,
    width,
    height,
    config = {},
    containerProps = {},
    effect = 'blur',
    responsive = true,
    position = 'below-fold',
    className = '',
    ...restProps
}) => {
    // 최적화 설정 병합
    const finalConfig = { ...defaultImageConfig, ...config };

    // 최적화된 이미지 URL
    const optimizedSrc = finalConfig.useWebP
        ? getOptimizedImageUrl(src)
        : src;

    // 반응형 이미지 속성 생성
    const srcSet = responsive
        ? generateSrcSet(src, finalConfig.widths, finalConfig.quality)
        : undefined;

    const sizes = responsive ? generateSizes() : undefined;

    // 로딩 전략
    const loading = position === 'above-fold' ? 'eager' : finalConfig.loading;

    // Placeholder 이미지 (blur effect용)
    const placeholderSrc = finalConfig.useBlur
        ? `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${width || 400} ${height || 300}'%3E%3Crect fill='%23e0e0e0' width='${width || 400}' height='${height || 300}'/%3E%3C/svg%3E`
        : undefined;

    return (
        <Box
            position="relative"
            overflow="hidden"
            width={width}
            height={height}
            {...containerProps}
        >
            <LazyLoadImage
                src={optimizedSrc}
                alt={alt}
                width={width}
                height={height}
                effect={effect}
                placeholderSrc={placeholderSrc}
                srcSet={srcSet}
                sizes={sizes}
                loading={loading as 'lazy' | 'eager' | undefined}
                threshold={100}
                className={`optimized-image ${className}`}
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                }}
                {...restProps}
            />
        </Box>
    );
};

export default OptimizedImage;

/**
 * 간단한 사용 예시:
 * 
 * <OptimizedImage
 *   src="/images/hero.jpg"
 *   alt="Hero image"
 *   width="100%"
 *   height={400}
 *   position="above-fold"
 * />
 * 
 * 커스텀 설정:
 * 
 * <OptimizedImage
 *   src="/images/profile.jpg"
 *   alt="Profile"
 *   width={200}
 *   height={200}
 *   config={{
 *     quality: 90,
 *     widths: [200, 400, 600],
 *     useBlur: true
 *   }}
 *   effect="blur"
 *   responsive={true}
 * />
 */
