/**
 * Custom hook for file filtering functionality
 */

import { useState, useCallback, useRef } from 'react';

export interface FilterOptions {
    name?: string;
    type?: string[];
    extension?: string[];
    minSize?: number;
    maxSize?: number;
    dateRange?: { start: Date; end: Date };
    custom?: Record<string, any>;
    onProgress?: (progress: number) => void;
    onError?: (error: Error) => void;
    onSuccess?: (message: string) => void;
}

export interface FilterResult {
    originalFiles: File[];
    filteredFiles: File[];
    filterOptions: FilterOptions;
    filterTime: number;
    matchCount: number;
    totalCount: number;
}

export function useFileFiltering(
    options: FilterOptions = {}
): {
    isFiltering: boolean;
    error: Error | null;
    filterFiles: (files: File[], options?: FilterOptions) => Promise<FilterResult>;
    filterByName: (files: File[], name: string) => Promise<FilterResult>;
    filterByType: (files: File[], types: string[]) => Promise<FilterResult>;
    filterBySize: (files: File[], minSize: number, maxSize: number) => Promise<FilterResult>;
    filterByDate: (files: File[], startDate: Date, endDate: Date) => Promise<FilterResult>;
    getFilterStats: () => { totalFiltered: number; averageFilterTime: number; filterHistory: FilterResult[] };
    clear: () => void;
} {
    const {
        name,
        type = [],
        extension = [],
        minSize = 0,
        maxSize = Infinity,
        dateRange,
        custom = {},
        onProgress,
        onError,
        onSuccess
    } = options;

    const [isFiltering, setIsFiltering] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const filterHistory = useRef<FilterResult[]>([]);

    const matchesFilter = useCallback((file: File, filterOptions: FilterOptions): boolean => {
        const { name: n, type: t, extension: e, minSize: min, maxSize: max, dateRange: dr, custom: c } = filterOptions;

        // Filter by name
        if (n && !file.name.toLowerCase().includes(n.toLowerCase())) {
            return false;
        }

        // Filter by type
        if (t.length > 0 && !t.includes(file.type)) {
            return false;
        }

        // Filter by extension
        if (e.length > 0) {
            const fileExtension = file.name.split('.').pop()?.toLowerCase();
            if (!fileExtension || !e.includes(fileExtension)) {
                return false;
            }
        }

        // Filter by size
        if (file.size < min || file.size > max) {
            return false;
        }

        // Filter by date range
        if (dr) {
            const fileDate = new Date(file.lastModified);
            if (fileDate < dr.start || fileDate > dr.end) {
                return false;
            }
        }

        // Filter by custom properties
        if (Object.keys(c).length > 0) {
            for (const [key, value] of Object.entries(c)) {
                const fileValue = (file as any)[key];
                if (fileValue !== value) {
                    return false;
                }
            }
        }

        return true;
    }, []);

    const filterFiles = useCallback(async (files: File[], customOptions?: FilterOptions): Promise<FilterResult> => {
        setIsFiltering(true);
        setError(null);
        const startTime = Date.now();

        try {
            const opts = { ...options, ...customOptions };

            // Filter the files
            const filteredFiles = files.filter(file => matchesFilter(file, opts));

            const filterTime = Date.now() - startTime;

            const result: FilterResult = {
                originalFiles: files,
                filteredFiles,
                filterOptions: opts,
                filterTime,
                matchCount: filteredFiles.length,
                totalCount: files.length,
            };

            filterHistory.current.push(result);
            onProgress?.(100);
            onSuccess?.(`Filtered ${filteredFiles.length} of ${files.length} files`);

            return result;
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            setError(error);
            onError?.(error);
            throw error;
        } finally {
            setIsFiltering(false);
        }
    }, [options, matchesFilter, onProgress, onError, onSuccess]);

    const filterByName = useCallback(async (files: File[], name: string): Promise<FilterResult> => {
        return await filterFiles(files, { name });
    }, [filterFiles]);

    const filterByType = useCallback(async (files: File[], types: string[]): Promise<FilterResult> => {
        return await filterFiles(files, { type: types });
    }, [filterFiles]);

    const filterBySize = useCallback(async (files: File[], minSize: number, maxSize: number): Promise<FilterResult> => {
        return await filterFiles(files, { minSize, maxSize });
    }, [filterFiles]);

    const filterByDate = useCallback(async (files: File[], startDate: Date, endDate: Date): Promise<FilterResult> => {
        return await filterFiles(files, { dateRange: { start: startDate, end: endDate } });
    }, [filterFiles]);

    const getFilterStats = useCallback(() => {
        const totalFiltered = filterHistory.current.reduce((sum, result) => sum + result.filteredFiles.length, 0);
        const averageFilterTime = filterHistory.current.length > 0
            ? filterHistory.current.reduce((sum, result) => sum + result.filterTime, 0) / filterHistory.current.length
            : 0;

        return {
            totalFiltered,
            averageFilterTime,
            filterHistory: filterHistory.current,
        };
    }, []);

    const clear = useCallback(() => {
        filterHistory.current = [];
        setError(null);
        setIsFiltering(false);
    }, []);

    return {
        isFiltering,
        error,
        filterFiles,
        filterByName,
        filterByType,
        filterBySize,
        filterByDate,
        getFilterStats,
        clear,
    };
}

export default useFileFiltering;