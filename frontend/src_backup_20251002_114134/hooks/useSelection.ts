/**
 * Custom hook for selection functionality
 */

import { useState, useCallback, useMemo } from 'react';

export interface UseSelectionOptions<T> {
    data: T[];
    initialSelected?: T[];
    keyField?: keyof T;
    multiple?: boolean;
    selectable?: (item: T) => boolean;
}

export function useSelection<T>(
    options: UseSelectionOptions<T>
): {
    selected: T[];
    isSelected: (item: T) => boolean;
    isAllSelected: boolean;
    isPartiallySelected: boolean;
    select: (item: T) => void;
    deselect: (item: T) => void;
    toggle: (item: T) => void;
    selectAll: () => void;
    deselectAll: () => void;
    toggleAll: () => void;
    setSelected: (items: T[]) => void;
    clearSelection: () => void;
    selectedCount: number;
    selectableCount: number;
} {
    const {
        data,
        initialSelected = [],
        keyField,
        multiple = true,
        selectable = () => true,
    } = options;

    const [selected, setSelected] = useState<T[]>(initialSelected);

    const selectableItems = useMemo(() => {
        return data.filter(selectable);
    }, [data, selectable]);

    const isSelected = useCallback((item: T) => {
        if (keyField) {
            return selected.some(selectedItem => selectedItem[keyField] === item[keyField]);
        }
        return selected.includes(item);
    }, [selected, keyField]);

    const isAllSelected = useMemo(() => {
        return selectableItems.length > 0 && selectableItems.every(item => isSelected(item));
    }, [selectableItems, isSelected]);

    const isPartiallySelected = useMemo(() => {
        const selectedCount = selectableItems.filter(item => isSelected(item)).length;
        return selectedCount > 0 && selectedCount < selectableItems.length;
    }, [selectableItems, isSelected]);

    const select = useCallback((item: T) => {
        if (!selectable(item)) return;

        if (multiple) {
            setSelected(prev => {
                if (keyField) {
                    const exists = prev.some(selectedItem => selectedItem[keyField] === item[keyField]);
                    return exists ? prev : [...prev, item];
                }
                return prev.includes(item) ? prev : [...prev, item];
            });
        } else {
            setSelected([item]);
        }
    }, [multiple, keyField, selectable]);

    const deselect = useCallback((item: T) => {
        setSelected(prev => {
            if (keyField) {
                return prev.filter(selectedItem => selectedItem[keyField] !== item[keyField]);
            }
            return prev.filter(selectedItem => selectedItem !== item);
        });
    }, [keyField]);

    const toggle = useCallback((item: T) => {
        if (isSelected(item)) {
            deselect(item);
        } else {
            select(item);
        }
    }, [isSelected, deselect, select]);

    const selectAll = useCallback(() => {
        setSelected(selectableItems);
    }, [selectableItems]);

    const deselectAll = useCallback(() => {
        setSelected([]);
    }, []);

    const toggleAll = useCallback(() => {
        if (isAllSelected) {
            deselectAll();
        } else {
            selectAll();
        }
    }, [isAllSelected, deselectAll, selectAll]);

    const setSelectedCallback = useCallback((items: T[]) => {
        setSelected(items);
    }, []);

    const clearSelection = useCallback(() => {
        setSelected([]);
    }, []);

    const selectedCount = selected.length;
    const selectableCount = selectableItems.length;

    return {
        selected,
        isSelected,
        isAllSelected,
        isPartiallySelected,
        select,
        deselect,
        toggle,
        selectAll,
        deselectAll,
        toggleAll,
        setSelected: setSelectedCallback,
        clearSelection,
        selectedCount,
        selectableCount,
    };
}

export default useSelection;
