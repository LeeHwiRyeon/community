/**
 * Custom hook for file operations functionality
 */

import { useState, useCallback, useRef } from 'react';

export interface OperationOptions {
    onProgress?: (progress: number) => void;
    onError?: (error: Error) => void;
    onSuccess?: (message: string) => void;
}

export interface OperationResult {
    operation: string;
    files: File[];
    result: any;
    success: boolean;
    error?: string;
    operationTime: number;
}

export function useFileOperations(
    options: OperationOptions = {}
): {
    isOperating: boolean;
    error: Error | null;
    copyFiles: (files: File[], destination: string) => Promise<OperationResult>;
    moveFiles: (files: File[], destination: string) => Promise<OperationResult>;
    deleteFiles: (files: File[]) => Promise<OperationResult>;
    renameFiles: (files: File[], newNames: string[]) => Promise<OperationResult>;
    duplicateFiles: (files: File[]) => Promise<OperationResult>;
    getOperationStats: () => { totalOperations: number; successfulOperations: number; failedOperations: number; averageOperationTime: number };
    clear: () => void;
} {
    const {
        onProgress,
        onError,
        onSuccess
    } = options;

    const [isOperating, setIsOperating] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const operationHistory = useRef<OperationResult[]>([]);

    const copyFiles = useCallback(async (files: File[], destination: string): Promise<OperationResult> => {
        setIsOperating(true);
        setError(null);
        const startTime = Date.now();

        try {
            // In a real application, this would copy files to the specified destination
            // This is a simplified implementation that simulates the operation
            const result = {
                destination,
                copiedFiles: files.map(file => ({
                    originalName: file.name,
                    newPath: `${destination}/${file.name}`,
                    size: file.size,
                    type: file.type,
                })),
            };

            const operationTime = Date.now() - startTime;

            const operationResult: OperationResult = {
                operation: 'copy',
                files,
                result,
                success: true,
                operationTime,
            };

            operationHistory.current.push(operationResult);
            onProgress?.(100);
            onSuccess?.(`Copied ${files.length} files to ${destination}`);

            return operationResult;
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            setError(error);
            onError?.(error);

            const operationResult: OperationResult = {
                operation: 'copy',
                files,
                result: null,
                success: false,
                error: error.message,
                operationTime: Date.now() - startTime,
            };

            operationHistory.current.push(operationResult);
            throw error;
        } finally {
            setIsOperating(false);
        }
    }, [onProgress, onError, onSuccess]);

    const moveFiles = useCallback(async (files: File[], destination: string): Promise<OperationResult> => {
        setIsOperating(true);
        setError(null);
        const startTime = Date.now();

        try {
            // In a real application, this would move files to the specified destination
            // This is a simplified implementation that simulates the operation
            const result = {
                destination,
                movedFiles: files.map(file => ({
                    originalName: file.name,
                    newPath: `${destination}/${file.name}`,
                    size: file.size,
                    type: file.type,
                })),
            };

            const operationTime = Date.now() - startTime;

            const operationResult: OperationResult = {
                operation: 'move',
                files,
                result,
                success: true,
                operationTime,
            };

            operationHistory.current.push(operationResult);
            onProgress?.(100);
            onSuccess?.(`Moved ${files.length} files to ${destination}`);

            return operationResult;
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            setError(error);
            onError?.(error);

            const operationResult: OperationResult = {
                operation: 'move',
                files,
                result: null,
                success: false,
                error: error.message,
                operationTime: Date.now() - startTime,
            };

            operationHistory.current.push(operationResult);
            throw error;
        } finally {
            setIsOperating(false);
        }
    }, [onProgress, onError, onSuccess]);

    const deleteFiles = useCallback(async (files: File[]): Promise<OperationResult> => {
        setIsOperating(true);
        setError(null);
        const startTime = Date.now();

        try {
            // In a real application, this would delete the files
            // This is a simplified implementation that simulates the operation
            const result = {
                deletedFiles: files.map(file => ({
                    name: file.name,
                    size: file.size,
                    type: file.type,
                })),
            };

            const operationTime = Date.now() - startTime;

            const operationResult: OperationResult = {
                operation: 'delete',
                files,
                result,
                success: true,
                operationTime,
            };

            operationHistory.current.push(operationResult);
            onProgress?.(100);
            onSuccess?.(`Deleted ${files.length} files`);

            return operationResult;
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            setError(error);
            onError?.(error);

            const operationResult: OperationResult = {
                operation: 'delete',
                files,
                result: null,
                success: false,
                error: error.message,
                operationTime: Date.now() - startTime,
            };

            operationHistory.current.push(operationResult);
            throw error;
        } finally {
            setIsOperating(false);
        }
    }, [onProgress, onError, onSuccess]);

    const renameFiles = useCallback(async (files: File[], newNames: string[]): Promise<OperationResult> => {
        setIsOperating(true);
        setError(null);
        const startTime = Date.now();

        try {
            if (files.length !== newNames.length) {
                throw new Error('Number of files must match number of new names');
            }

            // In a real application, this would rename the files
            // This is a simplified implementation that simulates the operation
            const result = {
                renamedFiles: files.map((file, index) => ({
                    originalName: file.name,
                    newName: newNames[index],
                    size: file.size,
                    type: file.type,
                })),
            };

            const operationTime = Date.now() - startTime;

            const operationResult: OperationResult = {
                operation: 'rename',
                files,
                result,
                success: true,
                operationTime,
            };

            operationHistory.current.push(operationResult);
            onProgress?.(100);
            onSuccess?.(`Renamed ${files.length} files`);

            return operationResult;
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            setError(error);
            onError?.(error);

            const operationResult: OperationResult = {
                operation: 'rename',
                files,
                result: null,
                success: false,
                error: error.message,
                operationTime: Date.now() - startTime,
            };

            operationHistory.current.push(operationResult);
            throw error;
        } finally {
            setIsOperating(false);
        }
    }, [onProgress, onError, onSuccess]);

    const duplicateFiles = useCallback(async (files: File[]): Promise<OperationResult> => {
        setIsOperating(true);
        setError(null);
        const startTime = Date.now();

        try {
            // In a real application, this would duplicate the files
            // This is a simplified implementation that simulates the operation
            const result = {
                duplicatedFiles: files.map(file => ({
                    originalName: file.name,
                    duplicateName: `Copy of ${file.name}`,
                    size: file.size,
                    type: file.type,
                })),
            };

            const operationTime = Date.now() - startTime;

            const operationResult: OperationResult = {
                operation: 'duplicate',
                files,
                result,
                success: true,
                operationTime,
            };

            operationHistory.current.push(operationResult);
            onProgress?.(100);
            onSuccess?.(`Duplicated ${files.length} files`);

            return operationResult;
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            setError(error);
            onError?.(error);

            const operationResult: OperationResult = {
                operation: 'duplicate',
                files,
                result: null,
                success: false,
                error: error.message,
                operationTime: Date.now() - startTime,
            };

            operationHistory.current.push(operationResult);
            throw error;
        } finally {
            setIsOperating(false);
        }
    }, [onProgress, onError, onSuccess]);

    const getOperationStats = useCallback(() => {
        const totalOperations = operationHistory.current.length;
        const successfulOperations = operationHistory.current.filter(op => op.success).length;
        const failedOperations = totalOperations - successfulOperations;
        const averageOperationTime = totalOperations > 0
            ? operationHistory.current.reduce((sum, op) => sum + op.operationTime, 0) / totalOperations
            : 0;

        return {
            totalOperations,
            successfulOperations,
            failedOperations,
            averageOperationTime,
        };
    }, []);

    const clear = useCallback(() => {
        operationHistory.current = [];
        setError(null);
        setIsOperating(false);
    }, []);

    return {
        isOperating,
        error,
        copyFiles,
        moveFiles,
        deleteFiles,
        renameFiles,
        duplicateFiles,
        getOperationStats,
        clear,
    };
}

export default useFileOperations;