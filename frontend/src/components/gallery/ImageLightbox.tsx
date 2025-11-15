/**
 * ImageLightbox Component
 * 이미지 라이트박스 - 전체화면 이미지 뷰어
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    Dialog,
    IconButton,
    Box,
    Typography,
    Tooltip,
    CircularProgress,
    Chip,
    Slide
} from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';
import {
    Close as CloseIcon,
    NavigateBefore as PrevIcon,
    NavigateNext as NextIcon,
    ZoomIn as ZoomInIcon,
    ZoomOut as ZoomOutIcon,
    Download as DownloadIcon,
    Favorite as FavoriteIcon,
    FavoriteBorder as FavoriteBorderIcon,
    Share as ShareIcon,
    Info as InfoIcon
} from '@mui/icons-material';
import { GalleryImage } from './ImageGallery';
import './ImageLightbox.css';

interface ImageLightboxProps {
    images: GalleryImage[];
    open: boolean;
    initialIndex?: number;
    onClose: () => void;
    onLike?: (imageId: number) => void;
    onDownload?: (image: GalleryImage) => void;
    onShare?: (image: GalleryImage) => void;
}

const Transition = React.forwardRef(function Transition(
    props: TransitionProps & { children: React.ReactElement },
    ref: React.Ref<unknown>,
) {
    return <Slide direction="up" ref={ref} {...props} />;
});

const ImageLightbox: React.FC<ImageLightboxProps> = ({
    images,
    open,
    initialIndex = 0,
    onClose,
    onLike,
    onDownload,
    onShare
}) => {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [zoom, setZoom] = useState(1);
    const [showInfo, setShowInfo] = useState(false);
    const [loading, setLoading] = useState(false);
    const [imageError, setImageError] = useState(false);

    const currentImage = images[currentIndex];

    /**
     * 초기 인덱스 동기화
     */
    useEffect(() => {
        setCurrentIndex(initialIndex);
        setZoom(1);
        setImageError(false);
    }, [initialIndex, open]);

    /**
     * 다음 이미지
     */
    const handleNext = useCallback(() => {
        setCurrentIndex((prev) => (prev + 1) % images.length);
        setZoom(1);
        setImageError(false);
    }, [images.length]);

    /**
     * 이전 이미지
     */
    const handlePrev = useCallback(() => {
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
        setZoom(1);
        setImageError(false);
    }, [images.length]);

    /**
     * 키보드 네비게이션
     */
    useEffect(() => {
        if (!open) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.key) {
                case 'Escape':
                    onClose();
                    break;
                case 'ArrowRight':
                    handleNext();
                    break;
                case 'ArrowLeft':
                    handlePrev();
                    break;
                case '+':
                case '=':
                    setZoom((prev) => Math.min(prev + 0.25, 3));
                    break;
                case '-':
                    setZoom((prev) => Math.max(prev - 0.25, 0.5));
                    break;
                case '0':
                    setZoom(1);
                    break;
                case 'i':
                case 'I':
                    setShowInfo((prev) => !prev);
                    break;
                default:
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [open, handleNext, handlePrev, onClose]);

    /**
     * 휠 줌
     */
    const handleWheel = (e: React.WheelEvent) => {
        if (e.ctrlKey) {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.1 : 0.1;
            setZoom((prev) => Math.max(0.5, Math.min(3, prev + delta)));
        }
    };

    /**
     * 줌 인
     */
    const handleZoomIn = () => {
        setZoom((prev) => Math.min(prev + 0.25, 3));
    };

    /**
     * 줌 아웃
     */
    const handleZoomOut = () => {
        setZoom((prev) => Math.max(prev - 0.25, 0.5));
    };

    /**
     * 좋아요
     */
    const handleLike = () => {
        if (onLike && currentImage) {
            onLike(currentImage.id);
        }
    };

    /**
     * 다운로드
     */
    const handleDownload = () => {
        if (currentImage) {
            if (onDownload) {
                onDownload(currentImage);
            } else {
                const link = document.createElement('a');
                link.href = currentImage.url;
                link.download = `image-${currentImage.id}.jpg`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        }
    };

    /**
     * 공유
     */
    const handleShare = async () => {
        if (!currentImage) return;

        if (onShare) {
            onShare(currentImage);
        } else if (navigator.share) {
            try {
                await navigator.share({
                    title: currentImage.title || '이미지',
                    text: currentImage.description || '',
                    url: currentImage.url
                });
            } catch (err) {
                console.error('Share failed:', err);
            }
        }
    };

    /**
     * 이미지 로드 시작
     */
    const handleImageLoadStart = () => {
        setLoading(true);
        setImageError(false);
    };

    /**
     * 이미지 로드 완료
     */
    const handleImageLoad = () => {
        setLoading(false);
    };

    /**
     * 이미지 로드 실패
     */
    const handleImageError = () => {
        setLoading(false);
        setImageError(true);
    };

    if (!currentImage) return null;

    return (
        <Dialog
            fullScreen
            open={open}
            onClose={onClose}
            TransitionComponent={Transition}
            className="image-lightbox"
        >
            {/* 헤더 */}
            <Box className="lightbox-header">
                <Box className="lightbox-title">
                    <Typography variant="h6">
                        {currentImage.title || `Image ${currentIndex + 1}`}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {currentIndex + 1} / {images.length}
                    </Typography>
                </Box>

                <Box className="lightbox-actions">
                    <Tooltip title="정보 (I)">
                        <IconButton
                            color={showInfo ? 'primary' : 'default'}
                            onClick={() => setShowInfo(!showInfo)}
                        >
                            <InfoIcon />
                        </IconButton>
                    </Tooltip>

                    {onLike && (
                        <Tooltip title="좋아요">
                            <IconButton onClick={handleLike}>
                                {currentImage.isLiked ? (
                                    <FavoriteIcon color="error" />
                                ) : (
                                    <FavoriteBorderIcon />
                                )}
                            </IconButton>
                        </Tooltip>
                    )}

                    <Tooltip title="다운로드">
                        <IconButton onClick={handleDownload}>
                            <DownloadIcon />
                        </IconButton>
                    </Tooltip>

                    {(onShare || ('share' in navigator)) && (
                        <Tooltip title="공유">
                            <IconButton onClick={handleShare}>
                                <ShareIcon />
                            </IconButton>
                        </Tooltip>
                    )}

                    <Tooltip title="닫기 (ESC)">
                        <IconButton onClick={onClose}>
                            <CloseIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            {/* 이미지 컨테이너 */}
            <Box className="lightbox-content" onWheel={handleWheel}>
                {/* 이전 버튼 */}
                {images.length > 1 && (
                    <IconButton
                        className="lightbox-nav lightbox-nav-prev"
                        onClick={handlePrev}
                        disabled={loading}
                    >
                        <PrevIcon />
                    </IconButton>
                )}

                {/* 이미지 */}
                <Box className="lightbox-image-container">
                    {loading && (
                        <Box className="lightbox-loading">
                            <CircularProgress />
                        </Box>
                    )}

                    {imageError ? (
                        <Box className="lightbox-error">
                            <Typography variant="h6">이미지를 불러올 수 없습니다</Typography>
                        </Box>
                    ) : (
                        <img
                            src={currentImage.url}
                            alt={currentImage.title || `Image ${currentIndex + 1}`}
                            className="lightbox-image"
                            style={{ transform: `scale(${zoom})` }}
                            onLoadStart={handleImageLoadStart}
                            onLoad={handleImageLoad}
                            onError={handleImageError}
                        />
                    )}
                </Box>

                {/* 다음 버튼 */}
                {images.length > 1 && (
                    <IconButton
                        className="lightbox-nav lightbox-nav-next"
                        onClick={handleNext}
                        disabled={loading}
                    >
                        <NextIcon />
                    </IconButton>
                )}
            </Box>

            {/* 줌 컨트롤 */}
            <Box className="lightbox-zoom-controls">
                <Tooltip title="축소 (-)">
                    <IconButton onClick={handleZoomOut} disabled={zoom <= 0.5}>
                        <ZoomOutIcon />
                    </IconButton>
                </Tooltip>

                <Typography variant="body2" className="zoom-level">
                    {Math.round(zoom * 100)}%
                </Typography>

                <Tooltip title="확대 (+)">
                    <IconButton onClick={handleZoomIn} disabled={zoom >= 3}>
                        <ZoomInIcon />
                    </IconButton>
                </Tooltip>

                <Tooltip title="초기화 (0)">
                    <Typography
                        variant="caption"
                        className="zoom-reset"
                        onClick={() => setZoom(1)}
                    >
                        초기화
                    </Typography>
                </Tooltip>
            </Box>

            {/* 정보 패널 */}
            {showInfo && (
                <Box className="lightbox-info-panel">
                    <Typography variant="h6">{currentImage.title}</Typography>

                    {currentImage.description && (
                        <Typography variant="body2" color="text.secondary">
                            {currentImage.description}
                        </Typography>
                    )}

                    {currentImage.author && (
                        <Typography variant="caption">
                            작성자: {currentImage.author}
                        </Typography>
                    )}

                    {currentImage.uploadedAt && (
                        <Typography variant="caption">
                            업로드: {new Date(currentImage.uploadedAt).toLocaleString('ko-KR')}
                        </Typography>
                    )}

                    {currentImage.likes !== undefined && (
                        <Chip
                            icon={<FavoriteIcon />}
                            label={`${currentImage.likes} 좋아요`}
                            size="small"
                            className="info-likes"
                        />
                    )}

                    {currentImage.tags && currentImage.tags.length > 0 && (
                        <Box className="info-tags">
                            {currentImage.tags.map((tag, idx) => (
                                <Chip key={idx} label={tag} size="small" variant="outlined" />
                            ))}
                        </Box>
                    )}
                </Box>
            )}
        </Dialog>
    );
};

export default ImageLightbox;
