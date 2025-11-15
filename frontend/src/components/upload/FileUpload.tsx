/**
 * FileUpload Component
 * 파일 업로드 컴포넌트 (Drag & Drop 지원)
 * 
 * Phase 3 - File Upload System
 * @author Phase 3 Development Team
 * @date 2025-11-12
 */

import React, { useState, useRef, useCallback } from 'react';
import axios from 'axios';
import './FileUpload.css';

interface UploadedFile {
    filename: string;
    originalName: string;
    mimetype: string;
    size: number;
    path: string;
    error?: string;
}

interface FileUploadProps {
    onUploadComplete?: (files: UploadedFile[]) => void;
    accept?: string;
    maxFiles?: number;
    maxSize?: number; // in MB
    multiple?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({
    onUploadComplete,
    accept = '*',
    maxFiles = 5,
    maxSize = 10,
    multiple = true
}) => {
    const [files, setFiles] = useState<File[]>([]);
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 파일 크기 포맷팅
    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    // 파일 유효성 검사
    const validateFile = (file: File): string | null => {
        // 크기 체크
        if (file.size > maxSize * 1024 * 1024) {
            return `파일 크기가 ${maxSize}MB를 초과합니다`;
        }

        // 파일 개수 체크
        if (files.length >= maxFiles) {
            return `최대 ${maxFiles}개의 파일만 업로드할 수 있습니다`;
        }

        return null;
    };

    // 파일 선택 핸들러
    const handleFileSelect = useCallback((selectedFiles: FileList | null) => {
        if (!selectedFiles) return;

        const newFiles: File[] = [];
        let hasError = false;

        for (let i = 0; i < selectedFiles.length; i++) {
            const file = selectedFiles[i];
            const validationError = validateFile(file);

            if (validationError) {
                setError(validationError);
                hasError = true;
                break;
            }

            newFiles.push(file);
        }

        if (!hasError) {
            setFiles(prev => multiple ? [...prev, ...newFiles] : newFiles);
            setError(null);
        }
    }, [files, multiple, maxFiles, maxSize]);

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
        handleFileSelect(droppedFiles);
    };

    // 파일 제거
    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    // 파일 업로드
    const handleUpload = async () => {
        if (files.length === 0) {
            setError('업로드할 파일을 선택해주세요');
            return;
        }

        setUploading(true);
        setError(null);
        setUploadProgress(0);

        try {
            const formData = new FormData();
            files.forEach(file => {
                formData.append('files', file);
            });

            const token = localStorage.getItem('token');
            const response = await axios.post(
                'http://localhost:5000/api/upload/file',
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
                setUploadedFiles(response.data.data);
                setFiles([]);
                setUploadProgress(100);

                if (onUploadComplete) {
                    onUploadComplete(response.data.data);
                }
            } else {
                setError('파일 업로드에 실패했습니다');
            }
        } catch (err: any) {
            console.error('Upload error:', err);
            setError(err.response?.data?.error || '파일 업로드 중 오류가 발생했습니다');
        } finally {
            setUploading(false);
        }
    };

    // 파일 입력 클릭
    const handleClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="file-upload-container">
            <div
                className={`file-upload-dropzone ${isDragging ? 'dragging' : ''}`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={handleClick}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept={accept}
                    multiple={multiple}
                    onChange={(e) => handleFileSelect(e.target.files)}
                    style={{ display: 'none' }}
                />

                <div className="dropzone-content">
                    <svg className="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="dropzone-text">
                        {isDragging ? '파일을 여기에 놓으세요' : '파일을 드래그하거나 클릭하여 선택'}
                    </p>
                    <p className="dropzone-hint">
                        최대 {maxFiles}개 파일, 각 {maxSize}MB 이하
                    </p>
                </div>
            </div>

            {/* 선택된 파일 목록 */}
            {files.length > 0 && (
                <div className="file-list">
                    <h3>선택된 파일</h3>
                    {files.map((file, index) => (
                        <div key={index} className="file-item">
                            <div className="file-info">
                                <span className="file-name">{file.name}</span>
                                <span className="file-size">{formatFileSize(file.size)}</span>
                            </div>
                            <button
                                className="remove-button"
                                onClick={() => removeFile(index)}
                                disabled={uploading}
                            >
                                ✕
                            </button>
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
            {files.length > 0 && (
                <button
                    className="upload-button"
                    onClick={handleUpload}
                    disabled={uploading}
                >
                    {uploading ? '업로드 중...' : '파일 업로드'}
                </button>
            )}

            {/* 업로드 완료된 파일 */}
            {uploadedFiles.length > 0 && (
                <div className="uploaded-files">
                    <h3>업로드 완료</h3>
                    {uploadedFiles.map((file, index) => (
                        <div key={index} className="uploaded-file-item">
                            <span className="file-name">{file.originalName}</span>
                            <a
                                href={`http://localhost:5000${file.path}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="file-link"
                            >
                                다운로드
                            </a>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default FileUpload;
