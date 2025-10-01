/**
 * Custom hook for file migration functionality
 */

import { useState, useCallback, useRef } from 'react';

export interface MigrationOptions {
    sourceFormat?: string;
    targetFormat?: string;
    preserveMetadata?: boolean;
    validateOutput?: boolean;
    onProgress?: (progress: number) => void;
    onError?: (error: Error) => void;
    onSuccess?: (message: string) => void;
}

export interface MigrationResult {
    originalFile: File;
    migratedFile: File;
    migrationType: string;
    migrationTime: number;
    success: boolean;
    error?: string;
    metadata?: Record<string, any>;
}

export function useFileMigration(
    options: MigrationOptions = {}
): {
    isMigrating: boolean;
    error: Error | null;
    migrateFile: (file: File, options?: MigrationOptions) => Promise<MigrationResult>;
    migrateMultiple: (files: File[], options?: MigrationOptions) => Promise<MigrationResult[]>;
    getMigrationStats: () => { totalMigrated: number; successfulMigrations: number; failedMigrations: number; averageMigrationTime: number };
    clear: () => void;
} {
    const {
        sourceFormat,
        targetFormat,
        preserveMetadata = true,
        validateOutput = true,
        onProgress,
        onError,
        onSuccess
    } = options;

    const [isMigrating, setIsMigrating] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const migrationHistory = useRef<MigrationResult[]>([]);

    const migrateFile = useCallback(async (file: File, customOptions?: MigrationOptions): Promise<MigrationResult> => {
        setIsMigrating(true);
        setError(null);
        const startTime = Date.now();

        try {
            const opts = { ...options, ...customOptions };
            const { sourceFormat: sf, targetFormat: tf, preserveMetadata: pm, validateOutput: vo } = opts;

            let migratedFile: File;
            let migrationType: string;
            let metadata: Record<string, any> = {};

            // Determine migration type based on file type
            if (file.type.startsWith('image/')) {
                migrationType = 'image-migration';
                // Simulate image format conversion
                // In a real application, you would use an image processing library
                const targetMimeType = tf || 'image/jpeg';
                const migratedBlob = new Blob([file], { type: targetMimeType });
                migratedFile = new File([migratedBlob], file.name.replace(/\.[^/.]+$/, `.${targetMimeType.split('/')[1]}`), { type: targetMimeType });
            } else if (file.type.startsWith('video/')) {
                migrationType = 'video-migration';
                // Simulate video format conversion
                // In a real application, you would use a video processing library
                const targetMimeType = tf || 'video/mp4';
                const migratedBlob = new Blob([file], { type: targetMimeType });
                migratedFile = new File([migratedBlob], file.name.replace(/\.[^/.]+$/, `.${targetMimeType.split('/')[1]}`), { type: targetMimeType });
            } else if (file.type.startsWith('audio/')) {
                migrationType = 'audio-migration';
                // Simulate audio format conversion
                // In a real application, you would use an audio processing library
                const targetMimeType = tf || 'audio/mp3';
                const migratedBlob = new Blob([file], { type: targetMimeType });
                migratedFile = new File([migratedBlob], file.name.replace(/\.[^/.]+$/, `.${targetMimeType.split('/')[1]}`), { type: targetMimeType });
            } else if (file.type.startsWith('application/')) {
                migrationType = 'document-migration';
                // Simulate document format conversion
                // In a real application, you would use a document processing library
                const targetMimeType = tf || 'application/pdf';
                const migratedBlob = new Blob([file], { type: targetMimeType });
                migratedFile = new File([migratedBlob], file.name.replace(/\.[^/.]+$/, `.${targetMimeType.split('/')[1]}`), { type: targetMimeType });
            } else {
                // No migration needed or supported
                migrationType = 'no-migration';
                migratedFile = file;
            }

            // Preserve metadata if enabled
            if (pm) {
                metadata = {
                    originalName: file.name,
                    originalSize: file.size,
                    originalType: file.type,
                    originalLastModified: file.lastModified,
                    migratedName: migratedFile.name,
                    migratedSize: migratedFile.size,
                    migratedType: migratedFile.type,
                    migrationTimestamp: new Date().toISOString(),
                    sourceFormat: sf,
                    targetFormat: tf,
                };
            }

            // Validate output if enabled
            if (vo && migratedFile.size === 0) {
                throw new Error('Migration resulted in empty file');
            }

            const migrationTime = Date.now() - startTime;

            const result: MigrationResult = {
                originalFile: file,
                migratedFile,
                migrationType,
                migrationTime,
                success: true,
                metadata,
            };

            migrationHistory.current.push(result);
            onProgress?.(100);
            onSuccess?.(`File migrated successfully: ${file.name} -> ${migratedFile.name}`);

            return result;
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            setError(error);
            onError?.(error);

            const result: MigrationResult = {
                originalFile: file,
                migratedFile: file,
                migrationType: 'failed',
                migrationTime: Date.now() - startTime,
                success: false,
                error: error.message,
            };

            migrationHistory.current.push(result);
            throw error;
        } finally {
            setIsMigrating(false);
        }
    }, [options, onProgress, onError, onSuccess]);

    const migrateMultiple = useCallback(async (files: File[], customOptions?: MigrationOptions): Promise<MigrationResult[]> => {
        setIsMigrating(true);
        setError(null);

        try {
            const results: MigrationResult[] = [];
            const totalFiles = files.length;

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                onProgress?.((i / totalFiles) * 100);

                try {
                    const result = await migrateFile(file, customOptions);
                    results.push(result);
                } catch (err) {
                    console.error(`Failed to migrate file ${file.name}:`, err);
                    // Continue with other files
                }
            }

            onProgress?.(100);
            onSuccess?.(`Migrated ${results.length} of ${totalFiles} files`);

            return results;
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            setError(error);
            onError?.(error);
            throw error;
        } finally {
            setIsMigrating(false);
        }
    }, [migrateFile, onProgress, onError, onSuccess]);

    const getMigrationStats = useCallback(() => {
        const totalMigrated = migrationHistory.current.length;
        const successfulMigrations = migrationHistory.current.filter(result => result.success).length;
        const failedMigrations = totalMigrated - successfulMigrations;
        const averageMigrationTime = totalMigrated > 0
            ? migrationHistory.current.reduce((sum, result) => sum + result.migrationTime, 0) / totalMigrated
            : 0;

        return {
            totalMigrated,
            successfulMigrations,
            failedMigrations,
            averageMigrationTime,
        };
    }, []);

    const clear = useCallback(() => {
        migrationHistory.current = [];
        setError(null);
        setIsMigrating(false);
    }, []);

    return {
        isMigrating,
        error,
        migrateFile,
        migrateMultiple,
        getMigrationStats,
        clear,
    };
}

export default useFileMigration;