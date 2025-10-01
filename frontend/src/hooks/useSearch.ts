/**
 * Custom hook for search functionality
 */

import { useState, useCallback, useMemo } from 'react';
import { useDebounce } from './useDebounce';

export interface UseSearchOptions<T> {
    data: T[];
    searchFields: (keyof T)[];
    initialQuery?: string;
    debounceDelay?: number;
    caseSensitive?: boolean;
    exactMatch?: boolean;
}

export function useSearch<T>(
    options: UseSearchOptions<T>
): {
    query: string;
    setQuery: (query: string) => void;
    results: T[];
    isSearching: boolean;
    hasResults: boolean;
    resultCount: number;
    clearSearch: () => void;
} {
    const {
        data,
        searchFields,
        initialQuery = '',
        debounceDelay = 300,
        caseSensitive = false,
        exactMatch = false,
    } = options;

    const [query, setQuery] = useState(initialQuery);
    const [isSearching, setIsSearching] = useState(false);
    const debouncedQuery = useDebounce(query, debounceDelay);

    const results = useMemo(() => {
        if (!debouncedQuery.trim()) {
            return data;
        }

        setIsSearching(true);

        const searchTerm = caseSensitive ? debouncedQuery : debouncedQuery.toLowerCase();
        const filtered = data.filter(item => {
            return searchFields.some(field => {
                const fieldValue = item[field];
                if (fieldValue == null) return false;

                const stringValue = String(fieldValue);
                const searchValue = caseSensitive ? stringValue : stringValue.toLowerCase();

                if (exactMatch) {
                    return searchValue === searchTerm;
                } else {
                    return searchValue.includes(searchTerm);
                }
            });
        });

        setIsSearching(false);
        return filtered;
    }, [data, searchFields, debouncedQuery, caseSensitive, exactMatch]);

    const hasResults = results.length > 0;
    const resultCount = results.length;

    const clearSearch = useCallback(() => {
        setQuery('');
    }, []);

    return {
        query,
        setQuery,
        results,
        isSearching,
        hasResults,
        resultCount,
        clearSearch,
    };
}

export default useSearch;
