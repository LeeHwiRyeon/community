/**
 * ImageGallery Component
 * 이미지 갤러리 - 그리드 레이아웃으로 이미지 목록 표시
 */

import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardMedia,
    CardContent,
    Typography,
    Skeleton,
    IconButton,
    Chip,
    Tooltip
} from '@mui/material';
import {
    ZoomIn as ZoomInIcon,
    Download as DownloadIcon,
    Favorite as FavoriteIcon,
    FavoriteBorder as FavoriteBorderIcon
} from '@mui/icons-material';
import ImageLightbox from './ImageLightbox';
import './ImageGallery.css';

export interface GalleryImage {
    id: number;
    url: string;
    thumbnail?: string;
    title?: string;
    description?: string;
    author?: string;
    tags?: string[];
    likes?: number;
    isLiked?: boolean;
    uploadedAt?: string;
}

interface ImageGalleryProps {
    images: GalleryImage[];
    loading?: boolean;
    columns?: { xs?: number; sm?: number; md?: number; lg?: number };
    showMetadata?: boolean;
    enableLightbox?: boolean;
    enableLazyLoad?: boolean;
    onImageClick?: (image: GalleryImage, index: number) => void;
    onLike?: (imageId: number) => void;
    onDownload?: (image: GalleryImage) => void;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({
    images,
    loading = false,
    columns = { xs: 12, sm: 6, md: 4, lg: 3 },
    showMetadata = true,
    enableLightbox = true,
    enableLazyLoad = true,
    onImageClick,
    onLike,
    onDownload
}) => {
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());

    /**
     * 이미지 클릭 핸들러
     */
    const handleImageClick = (image: GalleryImage, index: number) => {
        if (onImageClick) {
            onImageClick(image, index);
        }

        if (enableLightbox) {
            setSelectedIndex(index);
            setLightboxOpen(true);
        }
    };

    /**
     * 좋아요 토글
     */
    const handleLike = (e: React.MouseEvent, imageId: number) => {
        e.stopPropagation();
        if (onLike) {
            onLike(imageId);
        }
    };

    /**
     * 다운로드
     */
    const handleDownload = (e: React.MouseEvent, image: GalleryImage) => {
        e.stopPropagation();
        if (onDownload) {
            onDownload(image);
        } else {
            // 기본 다운로드 동작
            const link = document.createElement('a');
            link.href = image.url;
            link.download = `image-${image.id}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    /**
     * 이미지 로드 완료 핸들러
     */
    const handleImageLoad = (imageId: number) => {
        setLoadedImages(prev => new Set(prev).add(imageId));
    };

    /**
     * Lazy Loading 옵저버 설정
     */
    useEffect(() => {
        if (!enableLazyLoad) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const img = entry.target as HTMLImageElement;
                        const dataSrc = img.getAttribute('data-src');
                        if (dataSrc) {
                            img.src = dataSrc;
                            img.removeAttribute('data-src');
                            observer.unobserve(img);
                        }
                    }
                });
            },
            { rootMargin: '50px' }
        );

        const images = document.querySelectorAll('img[data-src]');
        images.forEach((img) => observer.observe(img));

        return () => observer.disconnect();
    }, [enableLazyLoad, images]);

    /**
     * 로딩 스켈레톤
     */
    if (loading) {
        return (
            <Box className="image-gallery">
                {Array.from({ length: 8 }).map((_, index) => (
                    <Card className="gallery-card" key={index}>
                        <Skeleton variant="rectangular" height={200} />
                        {showMetadata && (
                            <CardContent>
                                <Skeleton variant="text" width="80%" />
                                <Skeleton variant="text" width="60%" />
                            </CardContent>
                        )}
                    </Card>
                ))}
            </Box>
        );
    }

    /**
     * 빈 상태
     */
    if (!images || images.length === 0) {
        return (
            <Box className="gallery-empty">
                <Typography variant="h6" color="text.secondary">
                    이미지가 없습니다
                </Typography>
            </Box>
        );
    }

    return (
        <>
            <Box className="image-gallery">
                {images.map((image, index) => (
                    <Card
                        className="gallery-card"
                        onClick={() => handleImageClick(image, index)}
                        key={image.id}
                    >
                        <Card
                            className="gallery-card"
                            onClick={() => handleImageClick(image, index)}
                        >
                            <Box className="gallery-image-wrapper">
                                <CardMedia
                                    component="img"
                                    image={enableLazyLoad ? undefined : (image.thumbnail || image.url)}
                                    data-src={enableLazyLoad ? (image.thumbnail || image.url) : undefined}
                                    alt={image.title || `Image ${image.id}`}
                                    className="gallery-image"
                                    onLoad={() => handleImageLoad(image.id)}
                                    loading={enableLazyLoad ? 'lazy' : undefined}
                                />

                                {/* 오버레이 액션 */}
                                <Box className="gallery-overlay">
                                    <IconButton
                                        size="small"
                                        className="overlay-button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleImageClick(image, index);
                                        }}
                                    >
                                        <ZoomInIcon />
                                    </IconButton>

                                    {onDownload && (
                                        <IconButton
                                            size="small"
                                            className="overlay-button"
                                            onClick={(e) => handleDownload(e, image)}
                                        >
                                            <DownloadIcon />
                                        </IconButton>
                                    )}

                                    {onLike && (
                                        <IconButton
                                            size="small"
                                            className="overlay-button"
                                            onClick={(e) => handleLike(e, image.id)}
                                        >
                                            {image.isLiked ? (
                                                <FavoriteIcon color="error" />
                                            ) : (
                                                <FavoriteBorderIcon />
                                            )}
                                        </IconButton>
                                    )}
                                </Box>

                                {/* 로딩 상태 */}
                                {!loadedImages.has(image.id) && (
                                    <Box className="image-loading">
                                        <Skeleton variant="rectangular" height="100%" />
                                    </Box>
                                )}
                            </Box>

                            {/* 메타데이터 */}
                            {showMetadata && (
                                <CardContent className="gallery-metadata">
                                    {image.title && (
                                        <Typography
                                            variant="subtitle2"
                                            className="gallery-title"
                                            noWrap
                                        >
                                            {image.title}
                                        </Typography>
                                    )}

                                    {image.description && (
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            className="gallery-description"
                                        >
                                            {image.description}
                                        </Typography>
                                    )}

                                    <Box className="gallery-footer">
                                        {image.author && (
                                            <Typography variant="caption" color="text.secondary">
                                                by {image.author}
                                            </Typography>
                                        )}

                                        {image.likes !== undefined && (
                                            <Chip
                                                icon={<FavoriteIcon />}
                                                label={image.likes}
                                                size="small"
                                                className="likes-chip"
                                            />
                                        )}
                                    </Box>

                                    {image.tags && image.tags.length > 0 && (
                                        <Box className="gallery-tags">
                                            {image.tags.slice(0, 3).map((tag, idx) => (
                                                <Chip
                                                    key={idx}
                                                    label={tag}
                                                    size="small"
                                                    variant="outlined"
                                                    className="tag-chip"
                                                />
                                            ))}
                                        </Box>
                                    )}
                                </CardContent>
                            )}
                        </Card>
                    </Grid>
                ))}
            </Grid>

            )}
        </Box >
                        )}
                    </Card >
                ))}
            </Box >

    {/* Lightbox */ }
{
    enableLightbox && (
        <ImageLightbox
            images={images}
            open={lightboxOpen}
            initialIndex={selectedIndex}
            onClose={() => setLightboxOpen(false)}
            onLike={onLike}
            onDownload={onDownload}
        />
    )
}
        </>
    );
};

export default ImageGallery;
