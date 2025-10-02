/**
 * Custom hook for file synchronization functionality
 */

import { useState, useCallback, useRef } from 'react';

export interface SyncOptions {
    autoSync?: boolean;
    syncInterval?: number;
    conflictResolution?: 'keepLocal' | 'keepRemote' | 'keepNewer' | 'keepLarger' | 'manual';
    onProgress?: (progress: number) => void;
    onError?: (error: Error) => void;
    onSuccess?: (message: string) => void;
}

export interface SyncResult {
    localFiles: File[];
    remoteFiles: File[];
    syncedFiles: File[];
    conflictedFiles: File[];
    syncTime: number;
    success: boolean;
    error?: string;
}

export function useFileSynchronization(
    options: SyncOptions = {}
): {
    isSyncing: boolean;
    error: Error | null;
    syncFiles: (localFiles: File[], remoteFiles: File[], options?: SyncOptions) => Promise<SyncResult>;
    resolveConflicts: (conflictedFiles: File[], resolution: 'keepLocal' | 'keepRemote' | 'keepNewer' | 'keepLarger') => File[];
    getSyncStats: () => { totalSyncs: number; successfulSyncs: number; failedSyncs: number; averageSyncTime: number };
    clear: () => void;
} {
    const {
        autoSync = false,
        syncInterval = 300000, // 5 minutes default
        conflictResolution = 'keepNewer',
        onProgress,
        onError,
        onSuccess
    } = options;

    const [isSyncing, setIsSyncing] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const syncHistory = useRef<SyncResult[]>([]);

    const compareFiles = useCallback((localFile: File, remoteFile: File): 'local' | 'remote' | 'same' | 'conflict' => {
        // Compare file names
        if (localFile.name !== remoteFile.name) {
            return 'conflict';
        }

        // Compare file sizes
        if (localFile.size !== remoteFile.size) {
            return 'conflict';
        }

        // Compare file types
        if (localFile.type !== remoteFile.type) {
            return 'conflict';
        }

        // Compare last modified dates
        const localTime = localFile.lastModified;
        const remoteTime = remoteFile.lastModified;

        if (localTime > remoteTime) {
            return 'local';
        } else if (remoteTime > localTime) {
            return 'remote';
        } else {
            return 'same';
        }
    }, []);

    const resolveConflicts = useCallback((conflictedFiles: File[], resolution: 'keepLocal' | 'keepRemote' | 'keepNewer' | 'keepLarger'): File[] => {
        // This is a simplified implementation
        // In a real application, you would have more sophisticated conflict resolution logic
        return conflictedFiles;
    }, []);

    const syncFiles = useCallback(async (localFiles: File[], remoteFiles: File[], customOptions?: SyncOptions): Promise<SyncResult> => {
        setIsSyncing(true);
        setError(null);
        const startTime = Date.now();

        try {
            const opts = { ...options, ...customOptions };
            const { conflictResolution: cr } = opts;

            const syncedFiles: File[] = [];
            const conflictedFiles: File[] = [];

            // Create maps for easier lookup
            const localMap = new Map<string, File>();
            const remoteMap = new Map<string, File>();

            localFiles.forEach(file => {
                localMap.set(file.name, file);
            });

            remoteFiles.forEach(file => {
                remoteMap.set(file.name, file);
            });

            // Process each local file
            for (const localFile of localFiles) {
                const remoteFile = remoteMap.get(localFile.name);

                if (!remoteFile) {
                    // File exists only locally
                    syncedFiles.push(localFile);
                } else {
                    // File exists in both local and remote
                    const comparison = compareFiles(localFile, remoteFile);

                    switch (comparison) {
                        case 'local':
                            syncedFiles.push(localFile);
                            break;
                        case 'remote':
                            syncedFiles.push(remoteFile);
                            break;
                        case 'same':
                            syncedFiles.push(localFile);
                            break;
                        case 'conflict':
                            conflictedFiles.push(localFile);
                            break;
                    }
                }
            }

            // Process remote files that don't exist locally
            for (const remoteFile of remoteFiles) {
                if (!localMap.has(remoteFile.name)) {
                    syncedFiles.push(remoteFile);
                }
            }

            // Resolve conflicts if any
            if (conflictedFiles.length > 0) {
                const resolvedFiles = resolveConflicts(conflictedFiles, cr);
                syncedFiles.push(...resolvedFiles);
            }

            const syncTime = Date.now() - startTime;

            const result: SyncResult = {
                localFiles,
                remoteFiles,
                syncedFiles,
                conflictedFiles,
                syncTime,
                success: true,
            };

            syncHistory.current.push(result);
            onProgress?.(100);
            onSuccess?.(`Synced ${syncedFiles.length} files, ${conflictedFiles.length} conflicts`);

            return result;
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            setError(error);
            onError?.(error);

            const result: SyncResult = {
                localFiles,
                remoteFiles,
                syncedFiles: [],
                conflictedFiles: [],
                syncTime: Date.now() - startTime,
                success: false,
                error: error.message,
            };

            syncHistory.current.push(result);
            throw error;
        } finally {
            setIsSyncing(false);
        }
    }, [options, compareFiles, resolveConflicts, onProgress, onError, onSuccess]);

    const getSyncStats = useCallback(() => {
        const totalSyncs = syncHistory.current.length;
        const successfulSyncs = syncHistory.current.filter(result => result.success).length;
        const failedSyncs = totalSyncs - successfulSyncs;
        const averageSyncTime = totalSyncs > 0
            ? syncHistory.current.reduce((sum, result) => sum + result.syncTime, 0) / totalSyncs
            : 0;

        return {
            totalSyncs,
            successfulSyncs,
            failedSyncs,
            averageSyncTime,
        };
    }, []);

    const clear = useCallback(() => {
        syncHistory.current = [];
        setError(null);
        setIsSyncing(false);
    }, []);

    return {
        isSyncing,
        error,
        syncFiles,
        resolveConflicts,
        getSyncStats,
        clear,
    };
}

export default useFileSynchronization;