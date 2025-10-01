/**
 * Custom hook for file grouping functionality
 */

import { useState, useCallback, useRef } from 'react';

export type GroupField = 'type' | 'extension' | 'size' | 'date' | 'name' | 'custom';
export type GroupMethod = 'exact' | 'range' | 'prefix' | 'suffix' | 'regex';

export interface GroupOptions {
    field: GroupField;
    method: GroupMethod;
    customField?: string;
    rangeSize?: number; // for size grouping
    dateFormat?: 'day' | 'week' | 'month' | 'year'; // for date grouping
    nameLength?: number; // for name grouping
    onProgress?: (progress: number) => void;
    onError?: (error: Error) => void;
    onSuccess?: (message: string) => void;
}

export interface FileGroup {
    key: string;
    label: string;
    files: File[];
    count: number;
    totalSize: number;
    averageSize: number;
    oldestFile: Date;
    newestFile: Date;
}

export interface GroupResult {
    originalFiles: File[];
    groups: FileGroup[];
    groupOptions: GroupOptions;
    groupTime: number;
    totalGroups: number;
    ungroupedFiles: File[];
}

export function useFileGrouping(
    options: GroupOptions = { field: 'type', method: 'exact' }
): {
    isGrouping: boolean;
    error: Error | null;
    groupFiles: (files: File[], options?: GroupOptions) => Promise<GroupResult>;
    groupByField: (files: File[], field: GroupField, method?: GroupMethod) => Promise<GroupResult>;
    groupByCustomField: (files: File[], customField: string, method?: GroupMethod) => Promise<GroupResult>;
    getGroupStats: () => { totalGrouped: number; averageGroupTime: number; groupHistory: GroupResult[] };
    clear: () => void;
} {
    const {
        field = 'type',
        method = 'exact',
        customField,
        rangeSize = 1024 * 1024, // 1MB default
        dateFormat = 'day',
        nameLength = 1,
        onProgress,
        onError,
        onSuccess
    } = options;

    const [isGrouping, setIsGrouping] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const groupHistory = useRef<GroupResult[]>([]);

    const getGroupKey = useCallback((file: File, field: GroupField, method: GroupMethod, customField?: string): string => {
        switch (field) {
            case 'type':
                return file.type;
            case 'extension':
                return file.name.split('.').pop()?.toLowerCase() || 'no-extension';
            case 'size':
                if (method === 'range') {
                    const sizeInMB = Math.floor(file.size / rangeSize);
                    return `${sizeInMB * rangeSize}-${(sizeInMB + 1) * rangeSize - 1}`;
                }
                return file.size.toString();
            case 'date':
                const date = new Date(file.lastModified);
                switch (dateFormat) {
                    case 'day':
                        return date.toISOString().split('T')[0];
                    case 'week':
                        const weekStart = new Date(date);
                        weekStart.setDate(date.getDate() - date.getDay());
                        return weekStart.toISOString().split('T')[0];
                    case 'month':
                        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                    case 'year':
                        return date.getFullYear().toString();
                    default:
                        return date.toISOString().split('T')[0];
                }
            case 'name':
                if (method === 'prefix') {
                    return file.name.substring(0, nameLength).toLowerCase();
                } else if (method === 'suffix') {
                    return file.name.substring(file.name.length - nameLength).toLowerCase();
                } else if (method === 'regex') {
                    // Simple regex grouping by first character
                    return file.name.charAt(0).toLowerCase();
                }
                return file.name;
            case 'custom':
                if (customField) {
                    return (file as any)[customField] || 'unknown';
                }
                return 'unknown';
            default:
                return 'unknown';
        }
    }, [rangeSize, dateFormat, nameLength]);

    const createFileGroup = useCallback((key: string, files: File[]): FileGroup => {
        const totalSize = files.reduce((sum, file) => sum + file.size, 0);
        const averageSize = files.length > 0 ? totalSize / files.length : 0;
        const dates = files.map(file => new Date(file.lastModified));
        const oldestFile = new Date(Math.min(...dates.map(d => d.getTime())));
        const newestFile = new Date(Math.max(...dates.map(d => d.getTime())));

        return {
            key,
            label: key,
            files,
            count: files.length,
            totalSize,
            averageSize,
            oldestFile,
            newestFile,
        };
    }, []);

    const groupFiles = useCallback(async (files: File[], customOptions?: GroupOptions): Promise<GroupResult> => {
        setIsGrouping(true);
        setError(null);
        const startTime = Date.now();

        try {
            const opts = { ...options, ...customOptions };
            const { field: f, method: m, customField: cf } = opts;

            // Group files by the specified field
            const groupsMap = new Map<string, File[]>();

            files.forEach(file => {
                const key = getGroupKey(file, f, m, cf);
                if (!groupsMap.has(key)) {
                    groupsMap.set(key, []);
                }
                groupsMap.get(key)!.push(file);
            });

            // Create FileGroup objects
            const groups: FileGroup[] = Array.from(groupsMap.entries()).map(([key, groupFiles]) =>
                createFileGroup(key, groupFiles)
            );

            // Sort groups by key
            groups.sort((a, b) => a.key.localeCompare(b.key));

            const groupTime = Date.now() - startTime;

            const result: GroupResult = {
                originalFiles: files,
                groups,
                groupOptions: opts,
                groupTime,
                totalGroups: groups.length,
                ungroupedFiles: [], // All files are grouped in this implementation
            };

            groupHistory.current.push(result);
            onProgress?.(100);
            onSuccess?.(`Grouped ${files.length} files into ${groups.length} groups`);

            return result;
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            setError(error);
            onError?.(error);
            throw error;
        } finally {
            setIsGrouping(false);
        }
    }, [options, getGroupKey, createFileGroup, onProgress, onError, onSuccess]);

    const groupByField = useCallback(async (files: File[], field: GroupField, method: GroupMethod = 'exact'): Promise<GroupResult> => {
        return await groupFiles(files, { field, method });
    }, [groupFiles]);

    const groupByCustomField = useCallback(async (files: File[], customField: string, method: GroupMethod = 'exact'): Promise<GroupResult> => {
        return await groupFiles(files, { field: 'custom', method, customField });
    }, [groupFiles]);

    const getGroupStats = useCallback(() => {
        const totalGrouped = groupHistory.current.reduce((sum, result) => sum + result.originalFiles.length, 0);
        const averageGroupTime = groupHistory.current.length > 0
            ? groupHistory.current.reduce((sum, result) => sum + result.groupTime, 0) / groupHistory.current.length
            : 0;

        return {
            totalGrouped,
            averageGroupTime,
            groupHistory: groupHistory.current,
        };
    }, []);

    const clear = useCallback(() => {
        groupHistory.current = [];
        setError(null);
        setIsGrouping(false);
    }, []);

    return {
        isGrouping,
        error,
        groupFiles,
        groupByField,
        groupByCustomField,
        getGroupStats,
        clear,
    };
}

export default useFileGrouping;