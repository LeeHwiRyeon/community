/**
 * Custom hook for file history functionality
 */

import { useState, useCallback, useRef } from 'react';

export interface FileHistoryEntry {
    id: string;
    file: File;
    action: string;
    timestamp: Date;
    details: Record<string, any>;
    userId?: string;
    sessionId?: string;
}

export interface HistoryOptions {
    maxEntries?: number;
    includeMetadata?: boolean;
    onProgress?: (progress: number) => void;
    onError?: (error: Error) => void;
    onSuccess?: (message: string) => void;
}

export function useFileHistory(
    options: HistoryOptions = {}
): {
    isRecording: boolean;
    error: Error | null;
    addEntry: (file: File, action: string, details?: Record<string, any>) => void;
    getHistory: (fileId?: string, action?: string, limit?: number) => FileHistoryEntry[];
    getFileHistory: (file: File) => FileHistoryEntry[];
    getActionHistory: (action: string) => FileHistoryEntry[];
    getRecentHistory: (limit?: number) => FileHistoryEntry[];
    getHistoryStats: () => { totalEntries: number; uniqueFiles: number; actionCounts: Record<string, number>; dateRange: { start: Date; end: Date } | null };
    clear: () => void;
    exportHistory: (format: 'json' | 'csv') => string;
    importHistory: (data: string, format: 'json' | 'csv') => void;
} {
    const {
        maxEntries = 1000,
        includeMetadata = true,
        onProgress,
        onError,
        onSuccess
    } = options;

    const [isRecording, setIsRecording] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const history = useRef<FileHistoryEntry[]>([]);

    const addEntry = useCallback((file: File, action: string, details: Record<string, any> = {}) => {
        try {
            const entry: FileHistoryEntry = {
                id: `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                file,
                action,
                timestamp: new Date(),
                details: {
                    ...details,
                    fileName: file.name,
                    fileSize: file.size,
                    fileType: file.type,
                    lastModified: file.lastModified,
                },
                userId: 'user', // In a real app, this would be the actual user ID
                sessionId: 'session', // In a real app, this would be the actual session ID
            };

            // Add metadata if enabled
            if (includeMetadata) {
                entry.details.metadata = {
                    webkitRelativePath: (file as any).webkitRelativePath || '',
                    // Add more metadata as needed
                };
            }

            // Add to history
            history.current.unshift(entry);

            // Limit history size
            if (history.current.length > maxEntries) {
                history.current = history.current.slice(0, maxEntries);
            }

            onSuccess?.(`Added history entry: ${action} for ${file.name}`);
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            setError(error);
            onError?.(error);
        }
    }, [maxEntries, includeMetadata, onError, onSuccess]);

    const getHistory = useCallback((fileId?: string, action?: string, limit?: number): FileHistoryEntry[] => {
        let filteredHistory = history.current;

        // Filter by file ID if provided
        if (fileId) {
            filteredHistory = filteredHistory.filter(entry => entry.file.name === fileId);
        }

        // Filter by action if provided
        if (action) {
            filteredHistory = filteredHistory.filter(entry => entry.action === action);
        }

        // Apply limit if provided
        if (limit) {
            filteredHistory = filteredHistory.slice(0, limit);
        }

        return filteredHistory;
    }, []);

    const getFileHistory = useCallback((file: File): FileHistoryEntry[] => {
        return history.current.filter(entry => entry.file.name === file.name);
    }, []);

    const getActionHistory = useCallback((action: string): FileHistoryEntry[] => {
        return history.current.filter(entry => entry.action === action);
    }, []);

    const getRecentHistory = useCallback((limit: number = 10): FileHistoryEntry[] => {
        return history.current.slice(0, limit);
    }, []);

    const getHistoryStats = useCallback(() => {
        const totalEntries = history.current.length;
        const uniqueFiles = new Set(history.current.map(entry => entry.file.name)).size;

        const actionCounts: Record<string, number> = {};
        history.current.forEach(entry => {
            actionCounts[entry.action] = (actionCounts[entry.action] || 0) + 1;
        });

        const dateRange = history.current.length > 0
            ? {
                start: new Date(Math.min(...history.current.map(entry => entry.timestamp.getTime()))),
                end: new Date(Math.max(...history.current.map(entry => entry.timestamp.getTime()))),
            }
            : null;

        return {
            totalEntries,
            uniqueFiles,
            actionCounts,
            dateRange,
        };
    }, []);

    const clear = useCallback(() => {
        history.current = [];
        setError(null);
        setIsRecording(false);
    }, []);

    const exportHistory = useCallback((format: 'json' | 'csv'): string => {
        try {
            if (format === 'json') {
                return JSON.stringify(history.current, null, 2);
            } else {
                const headers = ['id', 'fileName', 'action', 'timestamp', 'fileSize', 'fileType', 'lastModified', 'details'];
                const csvContent = [
                    headers.join(','),
                    ...history.current.map(entry => [
                        entry.id,
                        entry.file.name,
                        entry.action,
                        entry.timestamp.toISOString(),
                        entry.file.size,
                        entry.file.type,
                        entry.file.lastModified,
                        JSON.stringify(entry.details),
                    ].join(','))
                ].join('\n');
                return csvContent;
            }
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            setError(error);
            onError?.(error);
            return '';
        }
    }, [onError]);

    const importHistory = useCallback((data: string, format: 'json' | 'csv') => {
        try {
            let importedHistory: FileHistoryEntry[] = [];

            if (format === 'json') {
                importedHistory = JSON.parse(data);
            } else {
                const lines = data.split('\n');
                const headers = lines[0].split(',');
                importedHistory = lines.slice(1).map(line => {
                    const values = line.split(',');
                    const entry: any = {};
                    headers.forEach((header, index) => {
                        entry[header] = values[index];
                    });
                    return {
                        ...entry,
                        timestamp: new Date(entry.timestamp),
                        details: JSON.parse(entry.details || '{}'),
                    };
                });
            }

            history.current = [...importedHistory, ...history.current];
            onSuccess?.(`Imported ${importedHistory.length} history entries`);
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            setError(error);
            onError?.(error);
        }
    }, [onError, onSuccess]);

    return {
        isRecording,
        error,
        addEntry,
        getHistory,
        getFileHistory,
        getActionHistory,
        getRecentHistory,
        getHistoryStats,
        clear,
        exportHistory,
        importHistory,
    };
}

export default useFileHistory;