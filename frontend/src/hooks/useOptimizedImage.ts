import { useState, useEffect, useCallback } from 'react';
import {
    getOptimizedImageUrl,
    generateSrcSet,
    supportsWebP,
    ImageOptimizationConfig,
    defaultImageConfig,
} from '../utils/imageOptimizer';

interface UseOptimizedImageOptions extends ImageOptimizationConfig {
    /** 즉시 로드할지 여부 */
    immediate?: boolean;
    /** 에러 발생 시 대체 이미지 */
    fallbackSrc?: string;
}

interface UseOptimizedImageResult {
    /** 최적화된 이미지 URL */
    src: string;
    /** srcSet 문자열 */
    srcSet?: string;
    /** 로딩 상태 */
    loading: boolean;
    /** 에러 상태 */
    error: boolean;
    /** 이미지 로드 함수 */
    load: () => void;
    /** WebP 지원 여부 */
    webpSupported: boolean;
}

/**
 * 이미지 최적화 커스텀 훅
 * @param url 원본 이미지 URL
 * @param options 최적화 옵션
 */
export const useOptimizedImage = (
    url: string,
    options: UseOptimizedImageOptions = {}
): UseOptimizedImageResult => {
    const config = { ...defaultImageConfig, ...options };
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [imageSrc, setImageSrc] = useState<string>('');

    // 최적화된 URL 생성
    const optimizedUrl = config.useWebP ? getOptimizedImageUrl(url) : url;

    // srcSet 생성
    const srcSet = generateSrcSet(url, config.widths, config.quality);

    // 이미지 로드 함수
    const load = useCallback(() => {
        if (!url) return;

        setLoading(true);
        setError(false);

        const img = new Image();

        img.onload = () => {
            setImageSrc(optimizedUrl);
            setLoading(false);
        };

        img.onerror = () => {
            // 에러 발생 시 대체 이미지 사용
            if (options.fallbackSrc) {
                setImageSrc(options.fallbackSrc);
            } else {
                setImageSrc(url); // 원본 URL 시도
            }
            setError(true);
            setLoading(false);
        };

        img.src = optimizedUrl;
    }, [url, optimizedUrl, options.fallbackSrc]);

    // 즉시 로드 또는 수동 로드
    useEffect(() => {
        if (config.immediate !== false) {
            load();
        }
    }, [config.immediate, load]);

    return {
        src: imageSrc || optimizedUrl,
        srcSet,
        loading,
        error,
        load,
        webpSupported: supportsWebP(),
    };
};

/**
 * 여러 이미지를 프리로드하는 훅
 */
export const usePreloadImages = (urls: string[]): boolean => {
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        if (!urls.length) {
            setLoaded(true);
            return;
        }

        let loadedCount = 0;
        const totalImages = urls.length;

        urls.forEach((url) => {
            const img = new Image();
            img.onload = () => {
                loadedCount++;
                if (loadedCount === totalImages) {
                    setLoaded(true);
                }
            };
            img.onerror = () => {
                loadedCount++;
                if (loadedCount === totalImages) {
                    setLoaded(true);
                }
            };
            img.src = url;
        });
    }, [urls]);

    return loaded;
};

/**
 * 이미지 Intersection Observer 훅 (지연 로딩용)
 */
export const useImageIntersection = (
    ref: React.RefObject<HTMLElement>,
    options: IntersectionObserverInit = {}
): boolean => {
    const [isIntersecting, setIsIntersecting] = useState(false);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsIntersecting(true);
                    observer.disconnect();
                }
            },
            {
                threshold: 0.1,
                rootMargin: '50px',
                ...options,
            }
        );

        observer.observe(element);

        return () => {
            observer.disconnect();
        };
    }, [ref, options]);

    return isIntersecting;
};

/**
 * 사용 예시:
 * 
 * const { src, srcSet, loading, error } = useOptimizedImage('/images/hero.jpg', {
 *   quality: 85,
 *   widths: [320, 640, 1280],
 *   useWebP: true
 * });
 * 
 * if (loading) return <Spinner />;
 * if (error) return <Text>이미지 로드 실패</Text>;
 * 
 * return <img src={src} srcSet={srcSet} alt="Hero" />;
 */
