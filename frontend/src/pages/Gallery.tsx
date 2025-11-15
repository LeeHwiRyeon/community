/**
 * Gallery Page
 * 이미지 갤러리 페이지
 */

import React, { useState, useEffect } from 'react';
import {
    Container,
    Box,
    Typography,
    Button,
    Tabs,
    Tab,
    TextField,
    InputAdornment,
    CircularProgress,
    Alert,
    Snackbar
} from '@mui/material';
import {
    CloudUpload as UploadIcon,
    Search as SearchIcon,
    Refresh as RefreshIcon
} from '@mui/icons-material';
import ImageGallery, { GalleryImage } from '../components/gallery/ImageGallery';
import {
    getImages,
    uploadImage,
    likeImage,
    unlikeImage,
    getThumbnailUrl
} from '../api/gallery';
import './Gallery.css';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`gallery-tabpanel-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
        </div>
    );
}

const GalleryPage: React.FC = () => {
    const [tabValue, setTabValue] = useState(0);
    const [images, setImages] = useState<GalleryImage[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

    /**
     * 이미지 목록 로드
     */
    const loadImages = async () => {
        setLoading(true);
        try {
            const response = await getImages({ page: 1, limit: 50 });
            setImages(response.images);
        } catch (err) {
            console.error('Failed to load images:', err);
            setSnackbar({
                open: true,
                message: '이미지를 불러올 수 없습니다',
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    /**
     * 초기 로드
     */
    useEffect(() => {
        loadImages();
    }, []);

    /**
     * 탭 변경
     */
    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    /**
     * 이미지 업로드
     */
    const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        const file = files[0];

        // 파일 크기 체크 (10MB)
        if (file.size > 10 * 1024 * 1024) {
            setSnackbar({
                open: true,
                message: '파일 크기는 10MB 이하여야 합니다',
                severity: 'error'
            });
            return;
        }

        // 파일 형식 체크
        if (!file.type.startsWith('image/')) {
            setSnackbar({
                open: true,
                message: '이미지 파일만 업로드 가능합니다',
                severity: 'error'
            });
            return;
        }

        setLoading(true);
        try {
            const newImage = await uploadImage(file, {
                title: file.name,
                description: '',
                tags: []
            });

            setImages((prev) => [newImage, ...prev]);
            setSnackbar({
                open: true,
                message: '이미지가 업로드되었습니다',
                severity: 'success'
            });
        } catch (err) {
            console.error('Upload failed:', err);
            setSnackbar({
                open: true,
                message: '업로드에 실패했습니다',
                severity: 'error'
            });
        } finally {
            setLoading(false);
            // 파일 입력 초기화
            event.target.value = '';
        }
    };

    /**
     * 이미지 좋아요 토글
     */
    const handleLike = async (imageId: number) => {
        const image = images.find((img) => img.id === imageId);
        if (!image) return;

        try {
            if (image.isLiked) {
                await unlikeImage(imageId);
            } else {
                await likeImage(imageId);
            }

            // 로컬 상태 업데이트
            setImages((prev) =>
                prev.map((img) =>
                    img.id === imageId
                        ? {
                            ...img,
                            isLiked: !img.isLiked,
                            likes: (img.likes || 0) + (img.isLiked ? -1 : 1)
                        }
                        : img
                )
            );
        } catch (err) {
            console.error('Like failed:', err);
        }
    };

    /**
     * 이미지 다운로드
     */
    const handleDownload = (image: GalleryImage) => {
        const link = document.createElement('a');
        link.href = image.url;
        link.download = `image-${image.id}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setSnackbar({
            open: true,
            message: '다운로드가 시작되었습니다',
            severity: 'success'
        });
    };

    /**
     * 검색
     */
    const handleSearch = () => {
        if (!searchQuery.trim()) {
            loadImages();
            return;
        }

        // 검색 필터링
        const filtered = images.filter(
            (img) =>
                img.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                img.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                img.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
        );

        setImages(filtered);
    };

    /**
     * 스낵바 닫기
     */
    const handleCloseSnackbar = () => {
        setSnackbar((prev) => ({ ...prev, open: false }));
    };

    return (
        <Container maxWidth="xl" className="gallery-page">
            {/* 헤더 */}
            <Box className="gallery-header">
                <Typography variant="h4" component="h1" gutterBottom>
                    이미지 갤러리
                </Typography>

                <Box className="gallery-actions">
                    {/* 검색 */}
                    <TextField
                        placeholder="검색..."
                        size="small"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon />
                                </InputAdornment>
                            )
                        }}
                        sx={{ minWidth: 250 }}
                    />

                    {/* 새로고침 */}
                    <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={loadImages}
                        disabled={loading}
                    >
                        새로고침
                    </Button>

                    {/* 업로드 */}
                    <Button
                        variant="contained"
                        component="label"
                        startIcon={<UploadIcon />}
                        disabled={loading}
                    >
                        업로드
                        <input
                            type="file"
                            hidden
                            accept="image/*"
                            onChange={handleUpload}
                        />
                    </Button>
                </Box>
            </Box>

            {/* 탭 */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={tabValue} onChange={handleTabChange}>
                    <Tab label="전체" />
                    <Tab label="인기" />
                    <Tab label="최신" />
                </Tabs>
            </Box>

            {/* 탭 패널 */}
            <TabPanel value={tabValue} index={0}>
                <ImageGallery
                    images={images}
                    loading={loading}
                    onLike={handleLike}
                    onDownload={handleDownload}
                    enableLightbox={true}
                    enableLazyLoad={true}
                    showMetadata={true}
                />
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
                <ImageGallery
                    images={[...images].sort((a, b) => (b.likes || 0) - (a.likes || 0))}
                    loading={loading}
                    onLike={handleLike}
                    onDownload={handleDownload}
                    enableLightbox={true}
                />
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
                <ImageGallery
                    images={images}
                    loading={loading}
                    onLike={handleLike}
                    onDownload={handleDownload}
                    enableLightbox={true}
                />
            </TabPanel>

            {/* 스낵바 */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={handleCloseSnackbar}
                    severity={snackbar.severity}
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>

            {/* 로딩 오버레이 */}
            {loading && (
                <Box className="loading-overlay">
                    <CircularProgress />
                </Box>
            )}
        </Container>
    );
};

export default GalleryPage;
