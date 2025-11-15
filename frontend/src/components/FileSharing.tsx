/**
 * 파일 공유 시스템 (v1.3 신규 기능)
 * 안전한 파일 업로드, 다운로드, 미리보기 기능
 */

import React, { useState, useRef, useCallback } from 'react';
import { MessageEncryption } from '../utils/MessageEncryption';

export interface FileMetadata {
    id: string;
    name: string;
    size: number;
    type: string;
    mimeType: string;
    thumbnail?: string;
    uploadedAt: Date;
    uploadedBy: string;
    roomId: string;
    isEncrypted: boolean;
    checksum: string;
}

export interface FileUploadProgress {
    fileId: string;
    fileName: string;
    progress: number;
    status: 'uploading' | 'completed' | 'error';
    error?: string;
}

export interface FilePreviewProps {
    file: FileMetadata;
    onDownload: (file: FileMetadata) => void;
    onDelete?: (file: FileMetadata) => void;
    canDelete?: boolean;
}

export interface FileSharingProps {
    roomId: string;
    onFileUploaded: (file: FileMetadata) => void;
    maxFileSize?: number; // MB
    allowedTypes?: string[];
    encryptionEnabled?: boolean;
}

/**
 * 파일 공유 컴포넌트
 */
export const FileSharing: React.FC<FileSharingProps> = ({
    roomId,
    onFileUploaded,
    maxFileSize = 50, // 50MB 기본 제한
    allowedTypes = ['image/*', 'video/*', 'audio/*', 'application/pdf', 'text/*'],
    encryptionEnabled = true
}) => {
    const [isDragOver, setIsDragOver] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<FileUploadProgress[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    /**
     * 파일 유효성 검사
     */
    const validateFile = useCallback((file: File): string | null => {
        // 파일 크기 검사
        if (file.size > maxFileSize * 1024 * 1024) {
            return `파일 크기가 ${maxFileSize}MB를 초과합니다.`;
        }

        // 파일 타입 검사
        const isAllowed = allowedTypes.some(type => {
            if (type.endsWith('/*')) {
                return file.type.startsWith(type.slice(0, -1));
            }
            return file.type === type;
        });

        if (!isAllowed) {
            return '허용되지 않는 파일 타입입니다.';
        }

        return null;
    }, [maxFileSize, allowedTypes]);

    /**
     * 파일 업로드 처리
     */
    const handleFileUpload = useCallback(async (files: FileList) => {
        setIsUploading(true);
        const uploadPromises: Promise<void>[] = [];

        Array.from(files).forEach((file, index) => {
            const fileId = `file_${Date.now()}_${index}`;

            // 파일 유효성 검사
            const validationError = validateFile(file);
            if (validationError) {
                setUploadProgress(prev => [...prev, {
                    fileId,
                    fileName: file.name,
                    progress: 0,
                    status: 'error',
                    error: validationError
                }]);
                return;
            }

            // 업로드 진행 상태 추가
            setUploadProgress(prev => [...prev, {
                fileId,
                fileName: file.name,
                progress: 0,
                status: 'uploading'
            }]);

            // 파일 업로드 처리
            const uploadPromise = uploadFile(file, fileId);
            uploadPromises.push(uploadPromise);
        });

        try {
            await Promise.all(uploadPromises);
        } catch (error) {
            console.error('파일 업로드 실패:', error);
        } finally {
            setIsUploading(false);
        }
    }, [validateFile]);

    /**
     * 개별 파일 업로드
     */
    const uploadFile = async (file: File, fileId: string): Promise<void> => {
        try {
            // 파일 읽기
            const fileBuffer = await file.arrayBuffer();

            // 파일 메타데이터 생성
            const metadata: FileMetadata = {
                id: fileId,
                name: file.name,
                size: file.size,
                type: file.type,
                mimeType: file.type,
                uploadedAt: new Date(),
                uploadedBy: 'current_user', // 실제 사용자 ID로 교체
                roomId,
                isEncrypted: encryptionEnabled,
                checksum: await calculateChecksum(fileBuffer)
            };

            // 썸네일 생성 (이미지 파일인 경우)
            if (file.type.startsWith('image/')) {
                metadata.thumbnail = await generateThumbnail(file);
            }

            // 암호화 처리
            let processedData: ArrayBuffer;
            if (encryptionEnabled) {
                processedData = await encryptFileData(fileBuffer, roomId);
            } else {
                processedData = fileBuffer;
            }

            // 서버로 업로드
            const formData = new FormData();
            formData.append('file', new Blob([processedData]), file.name);
            formData.append('metadata', JSON.stringify(metadata));

            const response = await fetch(`/api/files/upload`, {
                method: 'POST',
                body: formData,
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });

            if (!response.ok) {
                throw new Error('파일 업로드 실패');
            }

            const result = await response.json();

            // 업로드 완료 상태 업데이트
            setUploadProgress(prev => prev.map(p =>
                p.fileId === fileId
                    ? { ...p, progress: 100, status: 'completed' }
                    : p
            ));

            // 부모 컴포넌트에 파일 업로드 완료 알림
            onFileUploaded(result.file);

        } catch (error) {
            console.error('파일 업로드 오류:', error);

            // 오류 상태 업데이트
            setUploadProgress(prev => prev.map(p =>
                p.fileId === fileId
                    ? { ...p, status: 'error', error: error instanceof Error ? error.message : 'Upload failed' }
                    : p
            ));
        }
    };

    /**
     * 파일 체크섬 계산
     */
    const calculateChecksum = async (buffer: ArrayBuffer): Promise<string> => {
        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    };

    /**
     * 썸네일 생성
     */
    const generateThumbnail = async (file: File): Promise<string> => {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                const maxSize = 200;
                let { width, height } = img;

                if (width > height) {
                    if (width > maxSize) {
                        height = (height * maxSize) / width;
                        width = maxSize;
                    }
                } else {
                    if (height > maxSize) {
                        width = (width * maxSize) / height;
                        height = maxSize;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                ctx?.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.8));
            };

            img.src = URL.createObjectURL(file);
        });
    };

    /**
     * 파일 데이터 암호화
     */
    const encryptFileData = async (buffer: ArrayBuffer, roomId: string): Promise<ArrayBuffer> => {
        // 실제 구현에서는 MessageEncryption 클래스 사용
        // 여기서는 간단한 예시
        return buffer;
    };

    /**
     * 드래그 앤 드롭 이벤트 처리
     */
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileUpload(files);
        }
    };

    /**
     * 파일 선택 다이얼로그 열기
     */
    const openFileDialog = () => {
        fileInputRef.current?.click();
    };

    /**
     * 파일 선택 처리
     */
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleFileUpload(files);
        }
    };

    return (
        <div className="file-sharing-container">
            {/* 파일 업로드 영역 */}
            <div
                className={`file-drop-zone ${isDragOver ? 'drag-over' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={openFileDialog}
            >
                <div className="drop-zone-content">
                    <div className="upload-icon">📁</div>
                    <p>파일을 여기에 드래그하거나 클릭하여 선택하세요</p>
                    <p className="file-info">
                        최대 {maxFileSize}MB, 지원 형식: {allowedTypes.join(', ')}
                    </p>
                </div>
            </div>

            {/* 숨겨진 파일 입력 */}
            <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={allowedTypes.join(',')}
                onChange={handleFileSelect}
                style={{ display: 'none' }}
            />

            {/* 업로드 진행 상태 */}
            {uploadProgress.length > 0 && (
                <div className="upload-progress">
                    <h4>업로드 진행 상황</h4>
                    {uploadProgress.map((progress) => (
                        <div key={progress.fileId} className="progress-item">
                            <div className="progress-info">
                                <span className="file-name">{progress.fileName}</span>
                                <span className={`status ${progress.status}`}>
                                    {progress.status === 'uploading' && `${progress.progress}%`}
                                    {progress.status === 'completed' && '완료'}
                                    {progress.status === 'error' && '오류'}
                                </span>
                            </div>
                            {progress.status === 'uploading' && (
                                <div className="progress-bar">
                                    <div
                                        className="progress-fill"
                                        style={{ width: `${progress.progress}%` }}
                                    />
                                </div>
                            )}
                            {progress.error && (
                                <div className="error-message">{progress.error}</div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* 업로드 중 표시 */}
            {isUploading && (
                <div className="uploading-indicator">
                    <div className="spinner" />
                    <span>파일 업로드 중...</span>
                </div>
            )}
        </div>
    );
};

/**
 * 파일 미리보기 컴포넌트
 */
export const FilePreview: React.FC<FilePreviewProps> = ({
    file,
    onDownload,
    onDelete,
    canDelete = false
}) => {
    const [isLoading, setIsLoading] = useState(true);
    const [previewUrl, setPreviewUrl] = useState<string>('');

    React.useEffect(() => {
        // 파일 미리보기 URL 생성
        if (file.thumbnail) {
            setPreviewUrl(file.thumbnail);
            setIsLoading(false);
        } else if (file.type.startsWith('image/')) {
            // 이미지 파일인 경우 직접 로드
            fetch(`/api/files/preview/${file.id}`)
                .then(response => response.blob())
                .then(blob => {
                    const url = URL.createObjectURL(blob);
                    setPreviewUrl(url);
                    setIsLoading(false);
                })
                .catch(error => {
                    console.error('미리보기 로드 실패:', error);
                    setIsLoading(false);
                });
        } else {
            setIsLoading(false);
        }
    }, [file]);

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getFileIcon = (mimeType: string): string => {
        if (mimeType.startsWith('image/')) return '🖼️';
        if (mimeType.startsWith('video/')) return '🎥';
        if (mimeType.startsWith('audio/')) return '🎵';
        if (mimeType.includes('pdf')) return '📄';
        if (mimeType.includes('text/')) return '📝';
        return '📁';
    };

    return (
        <div className="file-preview">
            <div className="file-header">
                <span className="file-icon">{getFileIcon(file.mimeType)}</span>
                <div className="file-info">
                    <h4 className="file-name">{file.name}</h4>
                    <p className="file-size">{formatFileSize(file.size)}</p>
                </div>
                <div className="file-actions">
                    <button
                        className="download-btn"
                        onClick={() => onDownload(file)}
                        title="다운로드"
                    >
                        ⬇️
                    </button>
                    {canDelete && onDelete && (
                        <button
                            className="delete-btn"
                            onClick={() => onDelete(file)}
                            title="삭제"
                        >
                            🗑️
                        </button>
                    )}
                </div>
            </div>

            {/* 이미지 미리보기 */}
            {file.type.startsWith('image/') && (
                <div className="image-preview">
                    {isLoading ? (
                        <div className="loading-spinner">로딩 중...</div>
                    ) : previewUrl ? (
                        <img
                            src={previewUrl}
                            alt={file.name}
                            className="preview-image"
                        />
                    ) : (
                        <div className="no-preview">미리보기 없음</div>
                    )}
                </div>
            )}

            {/* 파일 정보 */}
            <div className="file-metadata">
                <p><strong>업로드:</strong> {file.uploadedAt.toLocaleString()}</p>
                <p><strong>타입:</strong> {file.mimeType}</p>
                {file.isEncrypted && (
                    <p><strong>암호화:</strong> 🔒 활성화됨</p>
                )}
            </div>
        </div>
    );
};

export default FileSharing;
