/**
 * Custom hook for sorting functionality
 */

import { useState, useCallback, useMemo } from 'react';

export type SortDirection = 'asc' | 'desc';

export interface UseSortOptions<T> {
    data: T[];
    initialSortField?: keyof T;
    initialSortDirection?: SortDirection;
    customSortFn?: (a: T, b: T, field: keyof T, direction: SortDirection) => number;
}

export function useSort<T>(
    options: UseSortOptions<T>
): {
    data: T[];
    sortField: keyof T | null;
    sortDirection: SortDirection;
    setSortField: (field: keyof T) => void;
    setSortDirection: (direction: SortDirection) => void;
    setSort: (field: keyof T, direction: SortDirection) => void;
    toggleSort: (field: keyof T) => void;
    clearSort: () => void;
    isSorted: boolean;
} {
    const {
        data,
        initialSortField,
        initialSortDirection = 'asc',
        customSortFn,
    } = options;

    const [sortField, setSortField] = useState<keyof T | null>(initialSortField || null);
    const [sortDirection, setSortDirection] = useState<SortDirection>(initialSortDirection);

    const sortedData = useMemo(() => {
        if (!sortField) return data;

        return [...data].sort((a, b) => {
            if (customSortFn) {
                return customSortFn(a, b, sortField, sortDirection);
            }

            const aValue = a[sortField];
            const bValue = b[sortField];

            if (aValue == null && bValue == null) return 0;
            if (aValue == null) return sortDirection === 'asc' ? -1 : 1;
            if (bValue == null) return sortDirection === 'asc' ? 1 : -1;

            if (typeof aValue === 'string' && typeof bValue === 'string') {
                const comparison = aValue.localeCompare(bValue);
                return sortDirection === 'asc' ? comparison : -comparison;
            }

            if (typeof aValue === 'number' && typeof bValue === 'number') {
                const comparison = aValue - bValue;
                return sortDirection === 'asc' ? comparison : -comparison;
            }

            if (aValue instanceof Date && bValue instanceof Date) {
                const comparison = aValue.getTime() - bValue.getTime();
                return sortDirection === 'asc' ? comparison : -comparison;
            }

            // Fallback to string comparison
            const aStr = String(aValue);
            const bStr = String(bValue);
            const comparison = aStr.localeCompare(bStr);
            return sortDirection === 'asc' ? comparison : -comparison;
        });
    }, [data, sortField, sortDirection, customSortFn]);

    const setSort = useCallback((field: keyof T, direction: SortDirection) => {
        setSortField(field);
        setSortDirection(direction);
    }, []);

    const toggleSort = useCallback((field: keyof T) => {
        if (sortField === field) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    }, [sortField]);

    const clearSort = useCallback(() => {
        setSortField(null);
        setSortDirection('asc');
    }, []);

    const isSorted = sortField !== null;

    return {
        data: sortedData,
        sortField,
        sortDirection,
        setSortField,
        setSortDirection,
        setSort,
        toggleSort,
        clearSort,
        isSorted,
    };
}

export default useSort;
