/**
 * Custom hook for drag and drop file functionality
 */

import { useState, useCallback, useRef, useEffect } from 'react';

export interface DragAndDropFilesOptions {
    accept?: string;
    multiple?: boolean;
    maxSize?: number;
    maxFiles?: number;
    onDrop?: (files: File[]) => void;
    onDragEnter?: () => void;
    onDragLeave?: () => void;
    onDragOver?: () => void;
    onError?: (error: Error) => void;
}

export function useDragAndDropFiles(
    options: DragAndDropFilesOptions = {}
): {
    isDragOver: boolean;
    files: File[];
    error: Error | null;
    ref: React.RefObject<HTMLElement>;
    dragProps: {
        onDragEnter: (e: React.DragEvent) => void;
        onDragLeave: (e: React.DragEvent) => void;
        onDragOver: (e: React.DragEvent) => void;
        onDrop: (e: React.DragEvent) => void;
    };
    clear: () => void;
    removeFile: (index: number) => void;
    setFiles: (files: File[]) => void;
    validateFile: (file: File) => boolean;
    validateFiles: (files: File[]) => boolean;
} {
    const {
        accept,
        multiple = true,
        maxSize,
        maxFiles,
        onDrop,
        onDragEnter,
        onDragLeave,
        onDragOver,
        onError,
    } = options;

    const [isDragOver, setIsDragOver] = useState(false);
    const [files, setFiles] = useState<File[]>([]);
    const [error, setError] = useState<Error | null>(null);
    const ref = useRef<HTMLElement>(null);

    const validateFile = useCallback((file: File): boolean => {
        if (maxSize && file.size > maxSize) {
            const error = new Error(`File ${file.name} is too large. Maximum size is ${maxSize} bytes.`);
            setError(error);
            onError?.(error);
            return false;
        }

        if (accept) {
            const acceptedTypes = accept.split(',').map(type => type.trim());
            const fileType = file.type;
            const fileName = file.name;
            const fileExtension = fileName.split('.').pop()?.toLowerCase();

            const isAccepted = acceptedTypes.some(type => {
                if (type.startsWith('.')) {
                    return fileExtension === type.substring(1);
                }
                if (type.includes('*')) {
                    const baseType = type.split('/')[0];
                    return fileType.startsWith(baseType + '/');
                }
                return fileType === type;
            });

            if (!isAccepted) {
                const error = new Error(`File ${file.name} is not an accepted type. Accepted types: ${accept}`);
                setError(error);
                onError?.(error);
                return false;
            }
        }

        return true;
    }, [accept, maxSize, onError]);

    const validateFiles = useCallback((filesToValidate: File[]): boolean => {
        if (maxFiles && filesToValidate.length > maxFiles) {
            const error = new Error(`Too many files. Maximum number of files is ${maxFiles}.`);
            setError(error);
            onError?.(error);
            return false;
        }

        return filesToValidate.every(validateFile);
    }, [maxFiles, validateFile, onError]);

    const handleDragEnter = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
        onDragEnter?.();
    }, [onDragEnter]);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        onDragLeave?.();
    }, [onDragLeave]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onDragOver?.();
    }, [onDragOver]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);

        const droppedFiles = Array.from(e.dataTransfer.files);

        if (validateFiles(droppedFiles)) {
            setFiles(droppedFiles);
            onDrop?.(droppedFiles);
        }
    }, [validateFiles, onDrop]);

    const clear = useCallback(() => {
        setFiles([]);
        setError(null);
    }, []);

    const removeFile = useCallback((index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    }, []);

    const setFilesCallback = useCallback((newFiles: File[]) => {
        setFiles(newFiles);
    }, []);

    const dragProps = {
        onDragEnter: handleDragEnter,
        onDragLeave: handleDragLeave,
        onDragOver: handleDragOver,
        onDrop: handleDrop,
    };

    return {
        isDragOver,
        files,
        error,
        ref,
        dragProps,
        clear,
        removeFile,
        setFiles: setFilesCallback,
        validateFile,
        validateFiles,
    };
}

export default useDragAndDropFiles;
