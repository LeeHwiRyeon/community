/**
 * Custom hook for file upload functionality
 */

import { useState, useCallback, useRef } from 'react';

export interface FileUploadOptions {
    accept?: string;
    multiple?: boolean;
    maxSize?: number;
    maxFiles?: number;
    onUpload?: (files: File[]) => void;
    onProgress?: (progress: number) => void;
    onError?: (error: Error) => void;
    onSuccess?: (result: any) => void;
}

export interface UseFileUploadOptions {
    onUpload?: (files: File[]) => void;
    onProgress?: (progress: number) => void;
    onError?: (error: Error) => void;
    onSuccess?: (result: any) => void;
}

export function useFileUpload(
    options: UseFileUploadOptions = {}
): {
    files: File[];
    isUploading: boolean;
    progress: number;
    error: Error | null;
    inputRef: React.RefObject<HTMLInputElement>;
    upload: (files: File[]) => void;
    clear: () => void;
    removeFile: (index: number) => void;
    setFiles: (files: File[]) => void;
    validateFile: (file: File) => boolean;
    validateFiles: (files: File[]) => boolean;
} {
    const { onUpload, onProgress, onError, onSuccess } = options;
    const [files, setFiles] = useState<File[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<Error | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const validateFile = useCallback((file: File): boolean => {
        // Add your validation logic here
        // For example, check file size, type, etc.
        return true;
    }, []);

    const validateFiles = useCallback((filesToValidate: File[]): boolean => {
        return filesToValidate.every(validateFile);
    }, [validateFile]);

    const upload = useCallback(async (filesToUpload: File[]) => {
        if (!validateFiles(filesToUpload)) {
            const error = new Error('One or more files failed validation');
            setError(error);
            onError?.(error);
            return;
        }

        setIsUploading(true);
        setProgress(0);
        setError(null);

        try {
            // Simulate upload progress
            for (let i = 0; i <= 100; i += 10) {
                setProgress(i);
                onProgress?.(i);
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            setFiles(filesToUpload);
            onUpload?.(filesToUpload);
            onSuccess?.(filesToUpload);
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            setError(error);
            onError?.(error);
        } finally {
            setIsUploading(false);
        }
    }, [validateFiles, onUpload, onProgress, onError, onSuccess]);

    const clear = useCallback(() => {
        setFiles([]);
        setProgress(0);
        setError(null);
        setIsUploading(false);
    }, []);

    const removeFile = useCallback((index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    }, []);

    const setFilesCallback = useCallback((newFiles: File[]) => {
        setFiles(newFiles);
    }, []);

    return {
        files,
        isUploading,
        progress,
        error,
        inputRef,
        upload,
        clear,
        removeFile,
        setFiles: setFilesCallback,
        validateFile,
        validateFiles,
    };
}

export default useFileUpload;
