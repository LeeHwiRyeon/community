/**
 * Custom hook for file sorting functionality
 */

import { useState, useCallback, useRef } from 'react';

export type SortField = 'name' | 'size' | 'type' | 'lastModified' | 'created' | 'extension' | 'custom';
export type SortOrder = 'asc' | 'desc';

export interface SortOptions {
    field: SortField;
    order: SortOrder;
    customField?: string;
    onProgress?: (progress: number) => void;
    onError?: (error: Error) => void;
    onSuccess?: (message: string) => void;
}

export interface SortResult {
    originalFiles: File[];
    sortedFiles: File[];
    sortField: SortField;
    sortOrder: SortOrder;
    sortTime: number;
    customField?: string;
}

export function useFileSorting(
    options: SortOptions = { field: 'name', order: 'asc' }
): {
    isSorting: boolean;
    error: Error | null;
    sortFiles: (files: File[], options?: SortOptions) => Promise<SortResult>;
    sortByField: (files: File[], field: SortField, order?: SortOrder) => Promise<SortResult>;
    sortByCustomField: (files: File[], customField: string, order?: SortOrder) => Promise<SortResult>;
    getSortStats: () => { totalSorted: number; averageSortTime: number; sortHistory: SortResult[] };
    clear: () => void;
} {
    const {
        field = 'name',
        order = 'asc',
        customField,
        onProgress,
        onError,
        onSuccess
    } = options;

    const [isSorting, setIsSorting] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const sortHistory = useRef<SortResult[]>([]);

    const getFileValue = useCallback((file: File, field: SortField, customField?: string): any => {
        switch (field) {
            case 'name':
                return file.name.toLowerCase();
            case 'size':
                return file.size;
            case 'type':
                return file.type;
            case 'lastModified':
                return file.lastModified;
            case 'created':
                return file.lastModified; // Using lastModified as created date
            case 'extension':
                return file.name.split('.').pop()?.toLowerCase() || '';
            case 'custom':
                if (customField) {
                    return (file as any)[customField] || '';
                }
                return '';
            default:
                return '';
        }
    }, []);

    const compareFiles = useCallback((a: File, b: File, field: SortField, order: SortOrder, customField?: string): number => {
        const aValue = getFileValue(a, field, customField);
        const bValue = getFileValue(b, field, customField);

        let comparison = 0;

        if (typeof aValue === 'string' && typeof bValue === 'string') {
            comparison = aValue.localeCompare(bValue);
        } else if (typeof aValue === 'number' && typeof bValue === 'number') {
            comparison = aValue - bValue;
        } else if (aValue instanceof Date && bValue instanceof Date) {
            comparison = aValue.getTime() - bValue.getTime();
        } else {
            comparison = String(aValue).localeCompare(String(bValue));
        }

        return order === 'desc' ? -comparison : comparison;
    }, [getFileValue]);

    const sortFiles = useCallback(async (files: File[], customOptions?: SortOptions): Promise<SortResult> => {
        setIsSorting(true);
        setError(null);
        const startTime = Date.now();

        try {
            const opts = { ...options, ...customOptions };
            const { field: f, order: o, customField: cf } = opts;

            // Create a copy of the files array to avoid mutating the original
            const filesCopy = [...files];

            // Sort the files
            filesCopy.sort((a, b) => compareFiles(a, b, f, o, cf));

            const sortTime = Date.now() - startTime;

            const result: SortResult = {
                originalFiles: files,
                sortedFiles: filesCopy,
                sortField: f,
                sortOrder: o,
                sortTime,
                customField: cf,
            };

            sortHistory.current.push(result);
            onProgress?.(100);
            onSuccess?.(`Sorted ${files.length} files by ${f} in ${o} order`);

            return result;
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            setError(error);
            onError?.(error);
            throw error;
        } finally {
            setIsSorting(false);
        }
    }, [options, compareFiles, onProgress, onError, onSuccess]);

    const sortByField = useCallback(async (files: File[], field: SortField, order: SortOrder = 'asc'): Promise<SortResult> => {
        return await sortFiles(files, { field, order });
    }, [sortFiles]);

    const sortByCustomField = useCallback(async (files: File[], customField: string, order: SortOrder = 'asc'): Promise<SortResult> => {
        return await sortFiles(files, { field: 'custom', order, customField });
    }, [sortFiles]);

    const getSortStats = useCallback(() => {
        const totalSorted = sortHistory.current.reduce((sum, result) => sum + result.sortedFiles.length, 0);
        const averageSortTime = sortHistory.current.length > 0
            ? sortHistory.current.reduce((sum, result) => sum + result.sortTime, 0) / sortHistory.current.length
            : 0;

        return {
            totalSorted,
            averageSortTime,
            sortHistory: sortHistory.current,
        };
    }, []);

    const clear = useCallback(() => {
        sortHistory.current = [];
        setError(null);
        setIsSorting(false);
    }, []);

    return {
        isSorting,
        error,
        sortFiles,
        sortByField,
        sortByCustomField,
        getSortStats,
        clear,
    };
}

export default useFileSorting;