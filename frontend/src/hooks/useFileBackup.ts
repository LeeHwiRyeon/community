/**
 * Custom hook for file backup functionality
 */

import { useState, useCallback, useRef } from 'react';

export interface BackupOptions {
    backupLocation?: string;
    includeMetadata?: boolean;
    compression?: boolean;
    encryption?: boolean;
    encryptionKey?: string;
    onProgress?: (progress: number) => void;
    onError?: (error: Error) => void;
    onSuccess?: (message: string) => void;
}

export interface BackupResult {
    originalFiles: File[];
    backupFiles: File[];
    backupLocation: string;
    backupTime: number;
    success: boolean;
    error?: string;
    metadata?: Record<string, any>;
}

export function useFileBackup(
    options: BackupOptions = {}
): {
    isBackingUp: boolean;
    error: Error | null;
    backupFiles: (files: File[], options?: BackupOptions) => Promise<BackupResult>;
    restoreFiles: (backupFiles: File[], destination: string) => Promise<BackupResult>;
    getBackupStats: () => { totalBackups: number; successfulBackups: number; failedBackups: number; averageBackupTime: number };
    clear: () => void;
} {
    const {
        backupLocation = 'backup',
        includeMetadata = true,
        compression = false,
        encryption = false,
        encryptionKey,
        onProgress,
        onError,
        onSuccess
    } = options;

    const [isBackingUp, setIsBackingUp] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const backupHistory = useRef<BackupResult[]>([]);

    const createBackupFile = useCallback(async (file: File, backupLocation: string, includeMetadata: boolean, compression: boolean, encryption: boolean, encryptionKey?: string): Promise<File> => {
        try {
            let backupFile = file;

            // Add metadata if enabled
            if (includeMetadata) {
                const metadata = {
                    originalName: file.name,
                    originalSize: file.size,
                    originalType: file.type,
                    originalLastModified: file.lastModified,
                    backupTimestamp: Date.now(),
                    compression,
                    encryption,
                };

                // In a real application, you would store this metadata separately
                // This is a simplified implementation
                const metadataBlob = new Blob([JSON.stringify(metadata)], { type: 'application/json' });
                const metadataFile = new File([metadataBlob], `${file.name}.metadata`, { type: 'application/json' });

                // For this example, we'll just rename the file to include metadata
                backupFile = new File([file], `${file.name}.backup`, { type: file.type });
            }

            // Apply compression if enabled
            if (compression) {
                // In a real application, you would use a compression library
                // This is a simplified implementation
                const compressedBlob = new Blob([file], { type: file.type });
                backupFile = new File([compressedBlob], `${backupFile.name}.compressed`, { type: file.type });
            }

            // Apply encryption if enabled
            if (encryption && encryptionKey) {
                // In a real application, you would use an encryption library
                // This is a simplified implementation
                const encryptedBlob = new Blob([file], { type: file.type });
                backupFile = new File([encryptedBlob], `${backupFile.name}.encrypted`, { type: file.type });
            }

            return backupFile;
        } catch (err) {
            throw new Error(`Failed to create backup file: ${err}`);
        }
    }, []);

    const backupFiles = useCallback(async (files: File[], customOptions?: BackupOptions): Promise<BackupResult> => {
        setIsBackingUp(true);
        setError(null);
        const startTime = Date.now();

        try {
            const opts = { ...options, ...customOptions };
            const { backupLocation: bl, includeMetadata: im, compression: c, encryption: e, encryptionKey: ek } = opts;

            const backupFiles: File[] = [];

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                onProgress?.((i / files.length) * 100);

                try {
                    const backupFile = await createBackupFile(file, bl, im, c, e, ek);
                    backupFiles.push(backupFile);
                } catch (err) {
                    console.error(`Failed to backup file ${file.name}:`, err);
                    // Continue with other files
                }
            }

            const backupTime = Date.now() - startTime;

            const result: BackupResult = {
                originalFiles: files,
                backupFiles,
                backupLocation: bl,
                backupTime,
                success: true,
                metadata: {
                    totalFiles: files.length,
                    successfulBackups: backupFiles.length,
                    compression,
                    encryption,
                    timestamp: new Date().toISOString(),
                },
            };

            backupHistory.current.push(result);
            onProgress?.(100);
            onSuccess?.(`Backed up ${backupFiles.length} of ${files.length} files`);

            return result;
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            setError(error);
            onError?.(error);

            const result: BackupResult = {
                originalFiles: files,
                backupFiles: [],
                backupLocation: opts.backupLocation || backupLocation,
                backupTime: Date.now() - startTime,
                success: false,
                error: error.message,
            };

            backupHistory.current.push(result);
            throw error;
        } finally {
            setIsBackingUp(false);
        }
    }, [options, createBackupFile, onProgress, onError, onSuccess]);

    const restoreFiles = useCallback(async (backupFiles: File[], destination: string): Promise<BackupResult> => {
        setIsBackingUp(true);
        setError(null);
        const startTime = Date.now();

        try {
            const restoredFiles: File[] = [];

            for (let i = 0; i < backupFiles.length; i++) {
                const backupFile = backupFiles[i];
                onProgress?.((i / backupFiles.length) * 100);

                try {
                    // In a real application, you would restore the file from backup
                    // This is a simplified implementation
                    const restoredFile = new File([backupFile], backupFile.name.replace('.backup', ''), { type: backupFile.type });
                    restoredFiles.push(restoredFile);
                } catch (err) {
                    console.error(`Failed to restore file ${backupFile.name}:`, err);
                    // Continue with other files
                }
            }

            const backupTime = Date.now() - startTime;

            const result: BackupResult = {
                originalFiles: backupFiles,
                backupFiles: restoredFiles,
                backupLocation: destination,
                backupTime,
                success: true,
                metadata: {
                    totalFiles: backupFiles.length,
                    successfulRestores: restoredFiles.length,
                    destination,
                    timestamp: new Date().toISOString(),
                },
            };

            backupHistory.current.push(result);
            onProgress?.(100);
            onSuccess?.(`Restored ${restoredFiles.length} of ${backupFiles.length} files`);

            return result;
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            setError(error);
            onError?.(error);

            const result: BackupResult = {
                originalFiles: backupFiles,
                backupFiles: [],
                backupLocation: destination,
                backupTime: Date.now() - startTime,
                success: false,
                error: error.message,
            };

            backupHistory.current.push(result);
            throw error;
        } finally {
            setIsBackingUp(false);
        }
    }, [onProgress, onError, onSuccess]);

    const getBackupStats = useCallback(() => {
        const totalBackups = backupHistory.current.length;
        const successfulBackups = backupHistory.current.filter(result => result.success).length;
        const failedBackups = totalBackups - successfulBackups;
        const averageBackupTime = totalBackups > 0
            ? backupHistory.current.reduce((sum, result) => sum + result.backupTime, 0) / totalBackups
            : 0;

        return {
            totalBackups,
            successfulBackups,
            failedBackups,
            averageBackupTime,
        };
    }, []);

    const clear = useCallback(() => {
        backupHistory.current = [];
        setError(null);
        setIsBackingUp(false);
    }, []);

    return {
        isBackingUp,
        error,
        backupFiles,
        restoreFiles,
        getBackupStats,
        clear,
    };
}

export default useFileBackup;