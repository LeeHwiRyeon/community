/**
 * Custom hook for array operations
 */

import { useState, useCallback } from 'react';

export function useArray<T>(
    initialArray: T[] = []
): {
    array: T[];
    set: (newArray: T[]) => void;
    push: (item: T) => void;
    remove: (index: number) => void;
    insert: (index: number, item: T) => void;
    update: (index: number, item: T) => void;
    clear: () => void;
    reset: () => void;
    filter: (predicate: (item: T, index: number) => boolean) => void;
    sort: (compareFn?: (a: T, b: T) => number) => void;
    reverse: () => void;
} {
    const [array, setArray] = useState<T[]>(initialArray);

    const set = useCallback((newArray: T[]) => {
        setArray(newArray);
    }, []);

    const push = useCallback((item: T) => {
        setArray(prev => [...prev, item]);
    }, []);

    const remove = useCallback((index: number) => {
        setArray(prev => prev.filter((_, i) => i !== index));
    }, []);

    const insert = useCallback((index: number, item: T) => {
        setArray(prev => [
            ...prev.slice(0, index),
            item,
            ...prev.slice(index),
        ]);
    }, []);

    const update = useCallback((index: number, item: T) => {
        setArray(prev => prev.map((value, i) => (i === index ? item : value)));
    }, []);

    const clear = useCallback(() => {
        setArray([]);
    }, []);

    const reset = useCallback(() => {
        setArray(initialArray);
    }, [initialArray]);

    const filter = useCallback((predicate: (item: T, index: number) => boolean) => {
        setArray(prev => prev.filter(predicate));
    }, []);

    const sort = useCallback((compareFn?: (a: T, b: T) => number) => {
        setArray(prev => [...prev].sort(compareFn));
    }, []);

    const reverse = useCallback(() => {
        setArray(prev => [...prev].reverse());
    }, []);

    return {
        array,
        set,
        push,
        remove,
        insert,
        update,
        clear,
        reset,
        filter,
        sort,
        reverse,
    };
}

export default useArray;
