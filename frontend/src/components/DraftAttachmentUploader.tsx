import React, { useState, useCallback, useRef } from 'react';
import {
    Box,
    Paper,
    Typography,
    IconButton,
    LinearProgress,
    Chip,
    Alert,
    ImageList,
    ImageListItem,
    ImageListItemBar,
    Button,
} from '@mui/material';
import {
    CloudUpload as UploadIcon,
    Delete as DeleteIcon,
    Image as ImageIcon,
    AttachFile as FileIcon,
    Close as CloseIcon,
} from '@mui/icons-material';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

interface Attachment {
    id?: number;
    filename: string;
    originalFilename: string;
    url: string;
    thumbnailUrl?: string;
    fileType: 'image' | 'file';
    size: number;
    mimeType: string;
    width?: number;
    height?: number;
    uploadProgress?: number;
    uploading?: boolean;
    error?: string;
}

interface DraftAttachmentUploaderProps {
    draftId?: number;
    maxFiles?: number;
    maxFileSize?: number; // bytes
    allowedTypes?: string[];
    onAttachmentsChange?: (attachments: Attachment[]) => void;
}

const DraftAttachmentUploader: React.FC<DraftAttachmentUploaderProps> = ({
    draftId,
    maxFiles = 5,
    maxFileSize = 10 * 1024 * 1024, // 10MB
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    onAttachmentsChange,
}) => {
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 토큰 가져오기
    const getAuthToken = () => {
        return localStorage.getItem('token');
    };

    // 파일 크기 포맷팅
    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    // 파일 검증
    const validateFile = (file: File): string | null => {
        if (!allowedTypes.includes(file.type)) {
            return `지원하지 않는 파일 형식입니다: ${file.type}`;
        }

        if (file.size > maxFileSize) {
            return `파일 크기가 너무 큽니다: ${formatFileSize(file.size)} (최대: ${formatFileSize(maxFileSize)})`;
        }

        if (attachments.length >= maxFiles) {
            return `최대 ${maxFiles}개의 파일만 업로드할 수 있습니다.`;
        }

        return null;
    };

    // 파일 업로드
    const uploadFiles = useCallback(async (files: File[]) => {
        const token = getAuthToken();
        if (!token) {
            setError('로그인이 필요합니다.');
            return;
        }

        setError(null);

        // 파일 검증
        const validFiles: File[] = [];
        for (const file of files) {
            const validationError = validateFile(file);
            if (validationError) {
                setError(validationError);
                continue;
            }
            validFiles.push(file);
        }

        if (validFiles.length === 0) return;

        // FormData 생성
        const formData = new FormData();
        validFiles.forEach(file => {
            formData.append('files', file);
        });

        if (draftId) {
            formData.append('draftId', draftId.toString());
        }

        // 임시 첨부파일 추가 (진행률 표시용)
        const tempAttachments: Attachment[] = validFiles.map(file => ({
            filename: file.name,
            originalFilename: file.name,
            url: URL.createObjectURL(file),
            fileType: file.type.startsWith('image/') ? 'image' : 'file',
            size: file.size,
            mimeType: file.type,
            uploadProgress: 0,
            uploading: true,
        }));

        setAttachments(prev => [...prev, ...tempAttachments]);

        try {
            const response = await axios.post(
                `${API_BASE_URL}/api/posts/drafts/attachments`,
                formData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data',
                    },
                    onUploadProgress: (progressEvent) => {
                        const progress = progressEvent.total
                            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
                            : 0;

                        setAttachments(prev =>
                            prev.map((att, idx) =>
                                idx >= prev.length - tempAttachments.length
                                    ? { ...att, uploadProgress: progress }
                                    : att
                            )
                        );
                    },
                }
            );

            if (response.data.success) {
                // 임시 첨부파일을 실제 데이터로 교체
                setAttachments(prev => {
                    const newAttachments = [
                        ...prev.slice(0, -tempAttachments.length),
                        ...response.data.attachments.map((att: any) => ({
                            ...att,
                            uploading: false,
                            uploadProgress: 100,
                        })),
                    ];
                    onAttachmentsChange?.(newAttachments);
                    return newAttachments;
                });

                // URL 객체 해제
                tempAttachments.forEach(att => {
                    if (att.url.startsWith('blob:')) {
                        URL.revokeObjectURL(att.url);
                    }
                });
            }
        } catch (err: any) {
            console.error('Upload error:', err);
            setError(err.response?.data?.message || '파일 업로드에 실패했습니다.');

            // 실패한 임시 첨부파일 제거
            setAttachments(prev => prev.slice(0, -tempAttachments.length));

            // URL 객체 해제
            tempAttachments.forEach(att => {
                if (att.url.startsWith('blob:')) {
                    URL.revokeObjectURL(att.url);
                }
            });
        }
    }, [draftId, attachments.length, maxFiles, maxFileSize, allowedTypes, onAttachmentsChange]);

    // 첨부파일 삭제
    const deleteAttachment = useCallback(async (index: number) => {
        const attachment = attachments[index];

        if (attachment.id) {
            const token = getAuthToken();
            if (!token) return;

            try {
                await axios.delete(
                    `${API_BASE_URL}/api/posts/drafts/attachments/${attachment.id}`,
                    {
                        headers: { 'Authorization': `Bearer ${token}` }
                    }
                );
            } catch (err) {
                console.error('Delete attachment error:', err);
                setError('첨부파일 삭제에 실패했습니다.');
                return;
            }
        }

        // URL 객체 해제
        if (attachment.url.startsWith('blob:')) {
            URL.revokeObjectURL(attachment.url);
        }

        // 목록에서 제거
        setAttachments(prev => {
            const newAttachments = prev.filter((_, i) => i !== index);
            onAttachmentsChange?.(newAttachments);
            return newAttachments;
        });
    }, [attachments, onAttachmentsChange]);

    // 드래그 앤 드롭 핸들러
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

        const files = Array.from(e.dataTransfer.files);
        uploadFiles(files);
    };

    // 파일 선택 핸들러
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const files = Array.from(e.target.files);
            uploadFiles(files);
        }
    };

    return (
        <Box>
            {/* 드래그 앤 드롭 영역 */}
            <Paper
                variant="outlined"
                sx={{
                    p: 3,
                    textAlign: 'center',
                    bgcolor: isDragging ? 'action.hover' : 'background.paper',
                    border: '2px dashed',
                    borderColor: isDragging ? 'primary.main' : 'divider',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    '&:hover': {
                        borderColor: 'primary.main',
                        bgcolor: 'action.hover',
                    },
                }}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
            >
                <UploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                <Typography variant="h6" gutterBottom>
                    파일을 드래그하거나 클릭하여 업로드
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    {allowedTypes.map(type => type.split('/')[1]).join(', ')} 파일 지원
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                    최대 {maxFiles}개, 파일당 {formatFileSize(maxFileSize)}
                </Typography>

                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept={allowedTypes.join(',')}
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                />
            </Paper>

            {/* 에러 메시지 */}
            {error && (
                <Alert
                    severity="error"
                    sx={{ mt: 2 }}
                    onClose={() => setError(null)}
                >
                    {error}
                </Alert>
            )}

            {/* 첨부파일 목록 */}
            {attachments.length > 0 && (
                <Box mt={3}>
                    <Typography variant="subtitle2" gutterBottom>
                        첨부파일 ({attachments.length}/{maxFiles})
                    </Typography>

                    <ImageList cols={3} gap={8} sx={{ mt: 1 }}>
                        {attachments.map((attachment, index) => (
                            <ImageListItem key={index}>
                                {/* 이미지 미리보기 */}
                                {attachment.fileType === 'image' ? (
                                    <img
                                        src={attachment.thumbnailUrl || attachment.url}
                                        alt={attachment.originalFilename}
                                        loading="lazy"
                                        style={{
                                            width: '100%',
                                            height: 150,
                                            objectFit: 'cover',
                                            opacity: attachment.uploading ? 0.5 : 1,
                                        }}
                                    />
                                ) : (
                                    <Box
                                        sx={{
                                            width: '100%',
                                            height: 150,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            bgcolor: 'action.hover',
                                        }}
                                    >
                                        <FileIcon sx={{ fontSize: 64, color: 'text.secondary' }} />
                                    </Box>
                                )}

                                {/* 업로드 진행률 */}
                                {attachment.uploading && (
                                    <LinearProgress
                                        variant="determinate"
                                        value={attachment.uploadProgress || 0}
                                        sx={{
                                            position: 'absolute',
                                            bottom: 0,
                                            left: 0,
                                            right: 0,
                                        }}
                                    />
                                )}

                                {/* 파일 정보 */}
                                <ImageListItemBar
                                    title={
                                        <Typography variant="caption" noWrap>
                                            {attachment.originalFilename}
                                        </Typography>
                                    }
                                    subtitle={
                                        <Chip
                                            label={formatFileSize(attachment.size)}
                                            size="small"
                                            sx={{ mt: 0.5, height: 20, fontSize: '0.7rem' }}
                                        />
                                    }
                                    actionIcon={
                                        <IconButton
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteAttachment(index);
                                            }}
                                            disabled={attachment.uploading}
                                            sx={{ color: 'white' }}
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    }
                                />
                            </ImageListItem>
                        ))}
                    </ImageList>
                </Box>
            )}
        </Box>
    );
};

export default DraftAttachmentUploader;
