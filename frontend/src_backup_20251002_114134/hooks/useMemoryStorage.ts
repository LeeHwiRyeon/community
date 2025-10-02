/**
 * Custom hook for managing memory storage with TypeScript support
 */

import { useState, useCallback } from 'react';
import { storageUtils } from '../utils/storage';

export function useMemoryStorage<T>(
    key: string,
    initialValue: T
): [T, (value: T | ((prevValue: T) => T)) => void, () => void] {
    // Get initial value from memory storage or use provided initial value
    const getStoredValue = useCallback((): T => {
        try {
            const storedValue = storageUtils.getMemory<T>(key);
            return storedValue !== null ? storedValue : initialValue;
        } catch (error) {
            console.error(`Error reading memory storage key "${key}":`, error);
            return initialValue;
        }
    }, [key, initialValue]);

    // State to store our value
    const [storedValue, setStoredValue] = useState<T>(getStoredValue);

    // Return a wrapped version of useState's setter function that persists the new value to memory storage
    const setValue = useCallback(
        (value: T | ((prevValue: T) => T)) => {
            try {
                // Allow value to be a function so we have the same API as useState
                const valueToStore = value instanceof Function ? value(storedValue) : value;

                // Save state
                setStoredValue(valueToStore);

                // Save to memory storage
                storageUtils.setMemory(key, valueToStore);
            } catch (error) {
                console.error(`Error setting memory storage key "${key}":`, error);
            }
        },
        [key, storedValue]
    );

    // Remove from memory storage
    const removeValue = useCallback(() => {
        try {
            setStoredValue(initialValue);
            storageUtils.removeMemory(key);
        } catch (error) {
            console.error(`Error removing memory storage key "${key}":`, error);
        }
    }, [key, initialValue]);

    return [storedValue, setValue, removeValue];
}

export default useMemoryStorage;
