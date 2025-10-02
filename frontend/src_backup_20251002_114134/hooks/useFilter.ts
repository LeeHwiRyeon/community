/**
 * Custom hook for filtering functionality
 */

import { useState, useCallback, useMemo } from 'react';

export interface FilterOption<T> {
    field: keyof T;
    operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'starts_with' | 'ends_with' | 'greater_than' | 'less_than' | 'greater_than_or_equal' | 'less_than_or_equal' | 'in' | 'not_in' | 'is_null' | 'is_not_null';
    value: any;
    caseSensitive?: boolean;
}

export interface UseFilterOptions<T> {
    data: T[];
    initialFilters?: FilterOption<T>[];
    customFilterFn?: (item: T, filters: FilterOption<T>[]) => boolean;
}

export function useFilter<T>(
    options: UseFilterOptions<T>
): {
    data: T[];
    filters: FilterOption<T>[];
    addFilter: (filter: FilterOption<T>) => void;
    removeFilter: (index: number) => void;
    updateFilter: (index: number, filter: FilterOption<T>) => void;
    clearFilters: () => void;
    setFilters: (filters: FilterOption<T>[]) => void;
    hasFilters: boolean;
    filterCount: number;
} {
    const {
        data,
        initialFilters = [],
        customFilterFn,
    } = options;

    const [filters, setFilters] = useState<FilterOption<T>[]>(initialFilters);

    const filteredData = useMemo(() => {
        if (filters.length === 0) return data;

        return data.filter(item => {
            if (customFilterFn) {
                return customFilterFn(item, filters);
            }

            return filters.every(filter => {
                const { field, operator, value, caseSensitive = false } = filter;
                const itemValue = item[field];

                if (itemValue == null) {
                    return operator === 'is_null';
                }

                if (operator === 'is_not_null') {
                    return true;
                }

                const itemStr = String(itemValue);
                const valueStr = String(value);
                const searchItem = caseSensitive ? itemStr : itemStr.toLowerCase();
                const searchValue = caseSensitive ? valueStr : valueStr.toLowerCase();

                switch (operator) {
                    case 'equals':
                        return itemValue === value;
                    case 'not_equals':
                        return itemValue !== value;
                    case 'contains':
                        return searchItem.includes(searchValue);
                    case 'not_contains':
                        return !searchItem.includes(searchValue);
                    case 'starts_with':
                        return searchItem.startsWith(searchValue);
                    case 'ends_with':
                        return searchItem.endsWith(searchValue);
                    case 'greater_than':
                        return Number(itemValue) > Number(value);
                    case 'less_than':
                        return Number(itemValue) < Number(value);
                    case 'greater_than_or_equal':
                        return Number(itemValue) >= Number(value);
                    case 'less_than_or_equal':
                        return Number(itemValue) <= Number(value);
                    case 'in':
                        return Array.isArray(value) && value.includes(itemValue);
                    case 'not_in':
                        return Array.isArray(value) && !value.includes(itemValue);
                    default:
                        return true;
                }
            });
        });
    }, [data, filters, customFilterFn]);

    const addFilter = useCallback((filter: FilterOption<T>) => {
        setFilters(prev => [...prev, filter]);
    }, []);

    const removeFilter = useCallback((index: number) => {
        setFilters(prev => prev.filter((_, i) => i !== index));
    }, []);

    const updateFilter = useCallback((index: number, filter: FilterOption<T>) => {
        setFilters(prev => prev.map((f, i) => i === index ? filter : f));
    }, []);

    const clearFilters = useCallback(() => {
        setFilters([]);
    }, []);

    const setFiltersCallback = useCallback((newFilters: FilterOption<T>[]) => {
        setFilters(newFilters);
    }, []);

    const hasFilters = filters.length > 0;
    const filterCount = filters.length;

    return {
        data: filteredData,
        filters,
        addFilter,
        removeFilter,
        updateFilter,
        clearFilters,
        setFilters: setFiltersCallback,
        hasFilters,
        filterCount,
    };
}

export default useFilter;
