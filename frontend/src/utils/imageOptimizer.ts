/**
 * 이미지 최적화 유틸리티
 * WebP 지원, 반응형 이미지, 이미지 압축 등의 기능 제공
 */

/**
 * WebP 지원 여부를 확인합니다
 */
export const supportsWebP = (): boolean => {
    if (typeof window === 'undefined') return false;

    try {
        const canvas = document.createElement('canvas');
        if (canvas.getContext && canvas.getContext('2d')) {
            return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
        }
    } catch (err) {
        return false;
    }
    return false;
};

// WebP 지원 여부를 캐시
const webpSupported = supportsWebP();

/**
 * WebP 형식으로 최적화된 이미지 URL을 반환합니다
 * @param url 원본 이미지 URL
 * @param fallback WebP 미지원 시 대체 형식 (기본값: 원본 유지)
 */
export const getOptimizedImageUrl = (
    url: string,
    fallback: boolean = true
): string => {
    if (!url) return '';

    // 이미 WebP 형식이면 그대로 반환
    if (url.endsWith('.webp')) return url;

    // WebP 지원하는 경우 확장자 변경
    if (webpSupported) {
        return url.replace(/\.(jpg|jpeg|png)$/i, '.webp');
    }

    // WebP 미지원 시 원본 반환
    return url;
};

/**
 * 반응형 이미지 URL을 생성합니다 (srcset용)
 * @param url 원본 이미지 URL
 * @param width 이미지 너비
 * @param quality 이미지 품질 (1-100, 기본값: 80)
 */
export const getResponsiveImageUrl = (
    url: string,
    width: number,
    quality: number = 80
): string => {
    if (!url) return '';

    // URL에 쿼리 파라미터가 있는지 확인
    const separator = url.includes('?') ? '&' : '?';

    // 이미지 리사이징 파라미터 추가
    return `${url}${separator}w=${width}&q=${quality}`;
};

/**
 * srcSet 문자열을 생성합니다
 * @param url 원본 이미지 URL
 * @param widths 생성할 이미지 너비 배열 (기본값: [320, 640, 960, 1280, 1920])
 * @param quality 이미지 품질 (기본값: 80)
 */
export const generateSrcSet = (
    url: string,
    widths: number[] = [320, 640, 960, 1280, 1920],
    quality: number = 80
): string => {
    if (!url) return '';

    return widths
        .map((width) => `${getResponsiveImageUrl(url, width, quality)} ${width}w`)
        .join(', ');
};

/**
 * sizes 속성 문자열을 생성합니다
 * @param breakpoints 브레이크포인트 객체 { maxWidth: imageWidth }
 */
export const generateSizes = (
    breakpoints: Record<number, string> = {
        640: '100vw',
        1024: '50vw',
        1280: '33vw',
    }
): string => {
    const entries = Object.entries(breakpoints).sort(
        ([a], [b]) => Number(a) - Number(b)
    );

    const sizeStrings = entries.map(
        ([maxWidth, size]) => `(max-width: ${maxWidth}px) ${size}`
    );

    // 기본값 추가
    sizeStrings.push('33vw');

    return sizeStrings.join(', ');
};

/**
 * 이미지 로딩 우선순위 결정
 * @param position 이미지 위치 ('above-fold' | 'below-fold')
 */
export const getLoadingPriority = (
    position: 'above-fold' | 'below-fold'
): 'eager' | 'lazy' => {
    return position === 'above-fold' ? 'eager' : 'lazy';
};

/**
 * 이미지 최적화 설정 타입
 */
export interface ImageOptimizationConfig {
    /** WebP 사용 여부 */
    useWebP?: boolean;
    /** 이미지 품질 (1-100) */
    quality?: number;
    /** 반응형 이미지 너비 배열 */
    widths?: number[];
    /** 로딩 전략 */
    loading?: 'eager' | 'lazy';
    /** Blur placeholder 사용 여부 */
    useBlur?: boolean;
}

/**
 * 기본 이미지 최적화 설정
 */
export const defaultImageConfig: Required<ImageOptimizationConfig> = {
    useWebP: true,
    quality: 80,
    widths: [320, 640, 960, 1280, 1920],
    loading: 'lazy',
    useBlur: true,
};

/**
 * 이미지 URL에서 파일명을 추출합니다
 */
export const getImageFileName = (url: string): string => {
    try {
        const urlObj = new URL(url);
        const pathname = urlObj.pathname;
        return pathname.substring(pathname.lastIndexOf('/') + 1);
    } catch {
        // URL이 아닌 경우 그대로 반환
        return url.substring(url.lastIndexOf('/') + 1);
    }
};

/**
 * 이미지 크기를 추정합니다 (KB)
 * @param width 이미지 너비
 * @param height 이미지 높이
 * @param format 이미지 포맷
 */
export const estimateImageSize = (
    width: number,
    height: number,
    format: 'jpeg' | 'png' | 'webp' = 'jpeg'
): number => {
    const pixels = width * height;

    // 포맷별 압축 비율 (대략적인 추정치)
    const compressionRatio = {
        jpeg: 0.1, // 10:1 압축
        png: 0.3, // 3:1 압축
        webp: 0.08, // 12:1 압축
    };

    // 바이트 수 계산 (픽셀 * 3바이트 (RGB) * 압축비율)
    const bytes = pixels * 3 * compressionRatio[format];

    // KB로 변환
    return Math.round(bytes / 1024);
};

/**
 * 이미지 URL이 외부 URL인지 확인합니다
 */
export const isExternalImage = (url: string): boolean => {
    try {
        const urlObj = new URL(url);
        return urlObj.origin !== window.location.origin;
    } catch {
        return false;
    }
};

/**
 * Placeholder 이미지 생성 (base64 blur)
 */
export const generateBlurPlaceholder = (
    width: number = 10,
    height: number = 10,
    color: string = '#e0e0e0'
): string => {
    // SVG blur placeholder 생성
    const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${color}"/>
      <filter id="blur">
        <feGaussianBlur in="SourceGraphic" stdDeviation="5"/>
      </filter>
      <rect width="100%" height="100%" filter="url(#blur)"/>
    </svg>
  `;

    // base64 인코딩
    const base64 = btoa(svg);
    return `data:image/svg+xml;base64,${base64}`;
};
