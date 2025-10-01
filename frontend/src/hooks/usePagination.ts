/**
 * Custom hook for pagination
 */

import { useState, useCallback, useMemo } from 'react';

export interface UsePaginationOptions {
    initialPage?: number;
    initialPageSize?: number;
    totalItems?: number;
    maxVisiblePages?: number;
}

export function usePagination(
    options: UsePaginationOptions = {}
): {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startIndex: number;
    endIndex: number;
    visiblePages: number[];
    setPage: (page: number) => void;
    setPageSize: (size: number) => void;
    setTotalItems: (total: number) => void;
    nextPage: () => void;
    previousPage: () => void;
    firstPage: () => void;
    lastPage: () => void;
    goToPage: (page: number) => void;
} {
    const {
        initialPage = 1,
        initialPageSize = 10,
        totalItems = 0,
        maxVisiblePages = 5,
    } = options;

    const [currentPage, setCurrentPage] = useState(initialPage);
    const [pageSize, setPageSize] = useState(initialPageSize);
    const [totalItemsState, setTotalItemsState] = useState(totalItems);

    const totalPages = Math.ceil(totalItemsState / pageSize);
    const hasNextPage = currentPage < totalPages;
    const hasPreviousPage = currentPage > 1;
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize - 1, totalItemsState - 1);

    const visiblePages = useMemo(() => {
        const pages: number[] = [];
        const halfVisible = Math.floor(maxVisiblePages / 2);
        let start = Math.max(1, currentPage - halfVisible);
        let end = Math.min(totalPages, start + maxVisiblePages - 1);

        if (end - start + 1 < maxVisiblePages) {
            start = Math.max(1, end - maxVisiblePages + 1);
        }

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }

        return pages;
    }, [currentPage, totalPages, maxVisiblePages]);

    const setPage = useCallback((page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    }, [totalPages]);

    const setPageSizeCallback = useCallback((size: number) => {
        if (size > 0) {
            setPageSize(size);
            setCurrentPage(1); // Reset to first page when page size changes
        }
    }, []);

    const setTotalItems = useCallback((total: number) => {
        if (total >= 0) {
            setTotalItemsState(total);
            // Reset to first page if current page is beyond total pages
            if (currentPage > Math.ceil(total / pageSize)) {
                setCurrentPage(1);
            }
        }
    }, [currentPage, pageSize]);

    const nextPage = useCallback(() => {
        if (hasNextPage) {
            setCurrentPage(prev => prev + 1);
        }
    }, [hasNextPage]);

    const previousPage = useCallback(() => {
        if (hasPreviousPage) {
            setCurrentPage(prev => prev - 1);
        }
    }, [hasPreviousPage]);

    const firstPage = useCallback(() => {
        setCurrentPage(1);
    }, []);

    const lastPage = useCallback(() => {
        setCurrentPage(totalPages);
    }, [totalPages]);

    const goToPage = useCallback((page: number) => {
        setPage(page);
    }, [setPage]);

    return {
        currentPage,
        pageSize,
        totalItems: totalItemsState,
        totalPages,
        hasNextPage,
        hasPreviousPage,
        startIndex,
        endIndex,
        visiblePages,
        setPage,
        setPageSize: setPageSizeCallback,
        setTotalItems,
        nextPage,
        previousPage,
        firstPage,
        lastPage,
        goToPage,
    };
}

export default usePagination;
