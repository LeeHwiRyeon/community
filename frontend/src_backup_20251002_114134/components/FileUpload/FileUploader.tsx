import React, { useState, useRef, useCallback } from 'react';
import {
    Box,
    Button,
    VStack,
    HStack,
    Text,
    Progress,
    Image,
    IconButton,
    useToast,
    Alert,
    AlertIcon,
    AlertTitle,
    AlertDescription,
    useDisclosure,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    ModalFooter
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon, DownloadIcon, ViewIcon } from '@chakra-ui/icons';

interface FileUploaderProps {
    onFileUploaded?: (file: UploadedFile) => void;
    onFileDeleted?: (fileId: string) => void;
    maxFileSize?: number; // MB
    allowedTypes?: string[];
    multiple?: boolean;
    maxFiles?: number;
}

interface UploadedFile {
    id: string;
    name: string;
    size: number;
    type: string;
    url: string;
    thumbnail?: string;
    uploadedAt: Date;
    status: 'uploading' | 'completed' | 'error';
    progress?: number;
    error?: string;
}

const FileUploader: React.FC<FileUploaderProps> = ({
    onFileUploaded,
    onFileDeleted,
    maxFileSize = 10, // 10MB
    allowedTypes = ['image/*', 'application/pdf', 'text/*'],
    multiple = true,
    maxFiles = 5
}) => {
    const [files, setFiles] = useState<UploadedFile[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const toast = useToast();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);

    const validateFile = (file: File): string | null => {
        // 파일 크기 검증
        if (file.size > maxFileSize * 1024 * 1024) {
            return `파일 크기는 ${maxFileSize}MB를 초과할 수 없습니다.`;
        }

        // 파일 타입 검증
        const isValidType = allowedTypes.some(type => {
            if (type.endsWith('/*')) {
                return file.type.startsWith(type.slice(0, -1));
            }
            return file.type === type;
        });

        if (!isValidType) {
            return `지원되지 않는 파일 형식입니다. 허용된 형식: ${allowedTypes.join(', ')}`;
        }

        return null;
    };

    const uploadFile = async (file: File): Promise<UploadedFile> => {
        const fileId = Date.now().toString();
        const formData = new FormData();
        formData.append('file', file);
        formData.append('fileId', fileId);

        const uploadedFile: UploadedFile = {
            id: fileId,
            name: file.name,
            size: file.size,
            type: file.type,
            url: '',
            uploadedAt: new Date(),
            status: 'uploading',
            progress: 0
        };

        setFiles(prev => [...prev, uploadedFile]);

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error(`업로드 실패: ${response.statusText}`);
            }

            const result = await response.json();

            const completedFile: UploadedFile = {
                ...uploadedFile,
                url: result.url,
                thumbnail: result.thumbnail,
                status: 'completed',
                progress: 100
            };

            setFiles(prev => prev.map(f => f.id === fileId ? completedFile : f));
            onFileUploaded?.(completedFile);

            toast({
                title: '파일 업로드 완료',
                description: `${file.name}이 성공적으로 업로드되었습니다.`,
                status: 'success',
                duration: 3000,
                isClosable: true,
            });

            return completedFile;
        } catch (error) {
            const errorFile: UploadedFile = {
                ...uploadedFile,
                status: 'error',
                error: error instanceof Error ? error.message : '업로드 중 오류가 발생했습니다.'
            };

            setFiles(prev => prev.map(f => f.id === fileId ? errorFile : f));

            toast({
                title: '업로드 실패',
                description: errorFile.error,
                status: 'error',
                duration: 5000,
                isClosable: true,
            });

            throw error;
        }
    };

    const handleFileSelect = useCallback(async (selectedFiles: FileList) => {
        const fileArray = Array.from(selectedFiles);

        // 최대 파일 수 검증
        if (files.length + fileArray.length > maxFiles) {
            toast({
                title: '파일 수 초과',
                description: `최대 ${maxFiles}개의 파일만 업로드할 수 있습니다.`,
                status: 'warning',
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        setIsUploading(true);

        for (const file of fileArray) {
            const validationError = validateFile(file);
            if (validationError) {
                toast({
                    title: '파일 검증 실패',
                    description: validationError,
                    status: 'error',
                    duration: 5000,
                    isClosable: true,
                });
                continue;
            }

            try {
                await uploadFile(file);
            } catch (error) {
                console.error('파일 업로드 실패:', error);
            }
        }

        setIsUploading(false);
    }, [files.length, maxFiles, maxFileSize, allowedTypes, toast, onFileUploaded]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const droppedFiles = e.dataTransfer.files;
        if (droppedFiles.length > 0) {
            handleFileSelect(droppedFiles);
        }
    }, [handleFileSelect]);

    const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = e.target.files;
        if (selectedFiles && selectedFiles.length > 0) {
            handleFileSelect(selectedFiles);
        }
        // 파일 입력 초기화
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, [handleFileSelect]);

    const handleDeleteFile = useCallback(async (fileId: string) => {
        try {
            const response = await fetch(`/api/upload/${fileId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                setFiles(prev => prev.filter(f => f.id !== fileId));
                onFileDeleted?.(fileId);

                toast({
                    title: '파일 삭제 완료',
                    status: 'success',
                    duration: 3000,
                    isClosable: true,
                });
            } else {
                throw new Error('파일 삭제 실패');
            }
        } catch (error) {
            toast({
                title: '삭제 실패',
                description: '파일 삭제 중 오류가 발생했습니다.',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        }
    }, [onFileDeleted, toast]);

    const handleViewFile = useCallback((file: UploadedFile) => {
        setSelectedFile(file);
        onOpen();
    }, [onOpen]);

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getFileIcon = (type: string): string => {
        if (type.startsWith('image/')) return '🖼️';
        if (type.startsWith('video/')) return '🎥';
        if (type.startsWith('audio/')) return '🎵';
        if (type.includes('pdf')) return '📄';
        if (type.includes('text')) return '📝';
        return '📎';
    };

    return (
        <Box>
            {/* 드래그 앤 드롭 영역 */}
            <Box
                border="2px dashed"
                borderColor={isDragging ? 'blue.400' : 'gray.300'}
                borderRadius="lg"
                p={8}
                textAlign="center"
                bg={isDragging ? 'blue.50' : 'gray.50'}
                cursor="pointer"
                transition="all 0.2s"
                _hover={{ borderColor: 'blue.400', bg: 'blue.50' }}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
            >
                <VStack spacing={4}>
                    <AddIcon boxSize={8} color="gray.400" />
                    <Text fontSize="lg" fontWeight="medium" color="gray.600">
                        파일을 드래그하거나 클릭하여 업로드
                    </Text>
                    <Text fontSize="sm" color="gray.500">
                        최대 {maxFileSize}MB, {maxFiles}개 파일까지
                    </Text>
                    <Text fontSize="xs" color="gray.400">
                        지원 형식: {allowedTypes.join(', ')}
                    </Text>
                </VStack>
            </Box>

            {/* 파일 입력 */}
            <input
                ref={fileInputRef}
                type="file"
                multiple={multiple}
                accept={allowedTypes.join(',')}
                onChange={handleFileInputChange}
                style={{ display: 'none' }}
            />

            {/* 업로드 중 표시 */}
            {isUploading && (
                <Alert status="info" mt={4}>
                    <AlertIcon />
                    <AlertTitle>업로드 중...</AlertTitle>
                    <AlertDescription>파일을 업로드하고 있습니다.</AlertDescription>
                </Alert>
            )}

            {/* 업로드된 파일 목록 */}
            {files.length > 0 && (
                <VStack spacing={2} mt={4} align="stretch">
                    <Text fontWeight="medium">업로드된 파일 ({files.length}개)</Text>
                    {files.map(file => (
                        <Box
                            key={file.id}
                            p={3}
                            border="1px solid"
                            borderColor="gray.200"
                            borderRadius="md"
                            bg="white"
                        >
                            <HStack justify="space-between">
                                <HStack spacing={3}>
                                    <Text fontSize="lg">{getFileIcon(file.type)}</Text>
                                    <VStack align="start" spacing={1}>
                                        <Text fontWeight="medium" fontSize="sm">
                                            {file.name}
                                        </Text>
                                        <Text fontSize="xs" color="gray.500">
                                            {formatFileSize(file.size)}
                                        </Text>
                                        {file.status === 'uploading' && (
                                            <Progress
                                                value={file.progress}
                                                size="sm"
                                                colorScheme="blue"
                                                width="200px"
                                            />
                                        )}
                                        {file.status === 'error' && (
                                            <Text fontSize="xs" color="red.500">
                                                {file.error}
                                            </Text>
                                        )}
                                    </VStack>
                                </HStack>
                                <HStack spacing={2}>
                                    {file.status === 'completed' && (
                                        <>
                                            <IconButton
                                                aria-label="파일 보기"
                                                icon={<ViewIcon />}
                                                size="sm"
                                                onClick={() => handleViewFile(file)}
                                            />
                                            <IconButton
                                                aria-label="파일 다운로드"
                                                icon={<DownloadIcon />}
                                                size="sm"
                                                onClick={() => window.open(file.url, '_blank')}
                                            />
                                        </>
                                    )}
                                    <IconButton
                                        aria-label="파일 삭제"
                                        icon={<DeleteIcon />}
                                        size="sm"
                                        colorScheme="red"
                                        onClick={() => handleDeleteFile(file.id)}
                                    />
                                </HStack>
                            </HStack>
                        </Box>
                    ))}
                </VStack>
            )}

            {/* 파일 미리보기 모달 */}
            <Modal isOpen={isOpen} onClose={onClose} size="xl">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>{selectedFile?.name}</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        {selectedFile && (
                            <VStack spacing={4}>
                                {selectedFile.thumbnail && (
                                    <Image
                                        src={selectedFile.thumbnail}
                                        alt={selectedFile.name}
                                        maxH="400px"
                                        objectFit="contain"
                                    />
                                )}
                                <VStack spacing={2} align="start">
                                    <Text><strong>파일명:</strong> {selectedFile.name}</Text>
                                    <Text><strong>크기:</strong> {formatFileSize(selectedFile.size)}</Text>
                                    <Text><strong>타입:</strong> {selectedFile.type}</Text>
                                    <Text><strong>업로드 시간:</strong> {selectedFile.uploadedAt.toLocaleString()}</Text>
                                </VStack>
                            </VStack>
                        )}
                    </ModalBody>
                    <ModalFooter>
                        <Button colorScheme="blue" mr={3} onClick={() => selectedFile && window.open(selectedFile.url, '_blank')}>
                            다운로드
                        </Button>
                        <Button variant="ghost" onClick={onClose}>
                            닫기
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </Box>
    );
};

export default FileUploader;
