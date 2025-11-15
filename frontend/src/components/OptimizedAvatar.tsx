import React from 'react';
import { Avatar, AvatarProps } from '@chakra-ui/react';
import { LazyLoadComponent } from 'react-lazy-load-image-component';
import { getOptimizedImageUrl } from '../utils/imageOptimizer';

export interface OptimizedAvatarProps extends AvatarProps {
    /** 아바타 이미지 URL */
    src?: string;
    /** 대체 텍스트 */
    alt?: string;
    /** WebP 최적화 사용 여부 */
    useWebP?: boolean;
    /** Lazy loading 사용 여부 */
    lazy?: boolean;
}

/**
 * 최적화된 아바타 컴포넌트
 * - WebP 지원
 * - Lazy loading
 * - Chakra UI Avatar와 호환
 */
const OptimizedAvatar: React.FC<OptimizedAvatarProps> = ({
    src,
    alt,
    useWebP = true,
    lazy = true,
    ...avatarProps
}) => {
    // 최적화된 이미지 URL
    const optimizedSrc = src && useWebP ? getOptimizedImageUrl(src) : src;

    // Lazy loading이 활성화된 경우
    if (lazy) {
        return (
            <LazyLoadComponent threshold={100}>
                <Avatar src={optimizedSrc} alt={alt} {...avatarProps} />
            </LazyLoadComponent>
        );
    }

    // 일반 Avatar
    return <Avatar src={optimizedSrc} alt={alt} {...avatarProps} />;
};

export default OptimizedAvatar;

/**
 * 사용 예시:
 * 
 * <OptimizedAvatar
 *   src="/avatars/user123.jpg"
 *   alt="User Name"
 *   size="lg"
 *   useWebP={true}
 *   lazy={true}
 * />
 */
