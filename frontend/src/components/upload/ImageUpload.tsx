/**
 * ImageUpload Component
 * 이미지 업로드 컴포넌트 (미리보기 및 썸네일 지원)
 * 
 * Phase 3 - File Upload System
 * @author Phase 3 Development Team
 * @date 2025-11-12
 */

import React, { useState, useRef, useCallback } from 'react';
import axios from 'axios';
import './ImageUpload.css';

interface UploadedImage {
    filename: string;
    originalName: string;
    mimetype: string;
    size: number;
    path: string;
    thumbnails: {
        small: string;
        medium: string;
        large: string;
    };
    metadata?: {
        width: number;
        height: number;
        format: string;
    };
    error?: string;
}

interface ImageUploadProps {
    onUploadComplete?: (images: UploadedImage[]) => void;
    maxImages?: number;
    maxSize?: number; // in MB
    multiple?: boolean;
    showThumbnails?: boolean;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
    onUploadComplete,
    maxImages = 10,
    maxSize = 5,
    multiple = true,
    showThumbnails = true
}) => {
    const [images, setImages] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 파일 크기 포맷팅
    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    // 이미지 유효성 검사
    const validateImage = (file: File): string | null => {
        // 이미지 파일 체크
        if (!file.type.startsWith('image/')) {
            return '이미지 파일만 업로드할 수 있습니다';
        }

        // 크기 체크
        if (file.size > maxSize * 1024 * 1024) {
            return `이미지 크기가 ${maxSize}MB를 초과합니다`;
        }

        // 이미지 개수 체크
        if (images.length >= maxImages) {
            return `최대 ${maxImages}개의 이미지만 업로드할 수 있습니다`;
        }

        return null;
    };

    // 이미지 미리보기 생성
    const createPreview = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    // 이미지 선택 핸들러
    const handleImageSelect = useCallback(async (selectedFiles: FileList | null) => {
        if (!selectedFiles) return;

        const newImages: File[] = [];
        const newPreviews: string[] = [];
        let hasError = false;

        for (let i = 0; i < selectedFiles.length; i++) {
            const file = selectedFiles[i];
            const validationError = validateImage(file);

            if (validationError) {
                setError(validationError);
                hasError = true;
                break;
            }

            newImages.push(file);

            try {
                const preview = await createPreview(file);
                newPreviews.push(preview);
            } catch (err) {
                console.error('Preview creation error:', err);
            }
        }

        if (!hasError) {
            setImages(prev => multiple ? [...prev, ...newImages] : newImages);
            setPreviewUrls(prev => multiple ? [...prev, ...newPreviews] : newPreviews);
            setError(null);
        }
    }, [images, multiple, maxImages, maxSize]);

    // Drag & Drop 핸들러
    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const droppedFiles = e.dataTransfer.files;
        handleImageSelect(droppedFiles);
    };

    // 이미지 제거
    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
        setPreviewUrls(prev => prev.filter((_, i) => i !== index));
    };

    // 이미지 업로드
    const handleUpload = async () => {
        if (images.length === 0) {
            setError('업로드할 이미지를 선택해주세요');
            return;
        }

        setUploading(true);
        setError(null);
        setUploadProgress(0);

        try {
            const formData = new FormData();
            images.forEach(image => {
                formData.append('images', image);
            });

            const token = localStorage.getItem('token');
            const response = await axios.post(
                'http://localhost:5000/api/upload/image',
                formData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    },
                    onUploadProgress: (progressEvent) => {
                        const progress = progressEvent.total
                            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
                            : 0;
                        setUploadProgress(progress);
                    }
                }
            );

            if (response.data.success) {
                setUploadedImages(response.data.data);
                setImages([]);
                setPreviewUrls([]);
                setUploadProgress(100);

                if (onUploadComplete) {
                    onUploadComplete(response.data.data);
                }
            } else {
                setError('이미지 업로드에 실패했습니다');
            }
        } catch (err: any) {
            console.error('Upload error:', err);
            setError(err.response?.data?.error || '이미지 업로드 중 오류가 발생했습니다');
        } finally {
            setUploading(false);
        }
    };

    // 파일 입력 클릭
    const handleClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="image-upload-container">
            <div
                className={`image-upload-dropzone ${isDragging ? 'dragging' : ''}`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={handleClick}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple={multiple}
                    onChange={(e) => handleImageSelect(e.target.files)}
                    style={{ display: 'none' }}
                />

                <div className="dropzone-content">
                    <svg className="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="dropzone-text">
                        {isDragging ? '이미지를 여기에 놓으세요' : '이미지를 드래그하거나 클릭하여 선택'}
                    </p>
                    <p className="dropzone-hint">
                        최대 {maxImages}개 이미지, 각 {maxSize}MB 이하
                    </p>
                </div>
            </div>

            {/* 이미지 미리보기 */}
            {previewUrls.length > 0 && (
                <div className="image-preview-grid">
                    {previewUrls.map((url, index) => (
                        <div key={index} className="image-preview-item">
                            <img src={url} alt={`Preview ${index + 1}`} />
                            <div className="preview-overlay">
                                <span className="image-name">{images[index].name}</span>
                                <span className="image-size">{formatFileSize(images[index].size)}</span>
                                <button
                                    className="remove-preview-button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removeImage(index);
                                    }}
                                    disabled={uploading}
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* 업로드 진행률 */}
            {uploading && (
                <div className="upload-progress">
                    <div className="progress-bar">
                        <div
                            className="progress-fill"
                            style={{ width: `${uploadProgress}%` }}
                        />
                    </div>
                    <span className="progress-text">{uploadProgress}%</span>
                </div>
            )}

            {/* 에러 메시지 */}
            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}

            {/* 업로드 버튼 */}
            {images.length > 0 && (
                <button
                    className="upload-button"
                    onClick={handleUpload}
                    disabled={uploading}
                >
                    {uploading ? '업로드 중...' : `${images.length}개 이미지 업로드`}
                </button>
            )}

            {/* 업로드 완료된 이미지 갤러리 */}
            {uploadedImages.length > 0 && (
                <div className="uploaded-images-gallery">
                    <h3>업로드 완료</h3>
                    <div className="gallery-grid">
                        {uploadedImages.map((image, index) => (
                            <div key={index} className="gallery-item">
                                <img
                                    src={`http://localhost:5000${showThumbnails ? image.thumbnails.medium : image.path}`}
                                    alt={image.originalName}
                                />
                                <div className="gallery-item-info">
                                    <span className="gallery-item-name">{image.originalName}</span>
                                    {image.metadata && (
                                        <span className="gallery-item-dimensions">
                                            {image.metadata.width} × {image.metadata.height}
                                        </span>
                                    )}
                                    <a
                                        href={`http://localhost:5000${image.path}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="gallery-item-link"
                                    >
                                        원본 보기
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ImageUpload;
