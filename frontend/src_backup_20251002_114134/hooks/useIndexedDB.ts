/**
 * Custom hook for managing IndexedDB with TypeScript support
 */

import { useState, useEffect, useCallback } from 'react';
import { storageUtils } from '../utils/storage';

export interface UseIndexedDBOptions {
    syncAcrossTabs?: boolean;
}

export function useIndexedDB<T>(
    key: string,
    initialValue: T,
    options: UseIndexedDBOptions = {}
): [T, (value: T | ((prevValue: T) => T)) => void, () => void] {
    const { syncAcrossTabs = true } = options;

    // Get initial value from IndexedDB or use provided initial value
    const getStoredValue = useCallback(async (): Promise<T> => {
        try {
            const storedValue = await storageUtils.getIndexed<T>(key);
            return storedValue !== null ? storedValue : initialValue;
        } catch (error) {
            console.error(`Error reading IndexedDB key "${key}":`, error);
            return initialValue;
        }
    }, [key, initialValue]);

    // State to store our value
    const [storedValue, setStoredValue] = useState<T>(initialValue);
    const [isLoading, setIsLoading] = useState(true);

    // Load initial value from IndexedDB
    useEffect(() => {
        let isMounted = true;

        const loadValue = async () => {
            try {
                const value = await getStoredValue();
                if (isMounted) {
                    setStoredValue(value);
                    setIsLoading(false);
                }
            } catch (error) {
                console.error(`Error loading IndexedDB value for key "${key}":`, error);
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        loadValue();

        return () => {
            isMounted = false;
        };
    }, [getStoredValue, key]);

    // Return a wrapped version of useState's setter function that persists the new value to IndexedDB
    const setValue = useCallback(
        async (value: T | ((prevValue: T) => T)) => {
            try {
                // Allow value to be a function so we have the same API as useState
                const valueToStore = value instanceof Function ? value(storedValue) : value;

                // Save state
                setStoredValue(valueToStore);

                // Save to IndexedDB
                await storageUtils.setIndexed(key, valueToStore);
            } catch (error) {
                console.error(`Error setting IndexedDB key "${key}":`, error);
            }
        },
        [key, storedValue]
    );

    // Remove from IndexedDB
    const removeValue = useCallback(async () => {
        try {
            setStoredValue(initialValue);
            await storageUtils.removeIndexed(key);
        } catch (error) {
            console.error(`Error removing IndexedDB key "${key}":`, error);
        }
    }, [key, initialValue]);

    // Listen for changes to this IndexedDB key from other tabs
    useEffect(() => {
        if (!syncAcrossTabs) return;

        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === key && e.storageArea === localStorage) {
                try {
                    const newValue = e.newValue ? JSON.parse(e.newValue) : null;
                    setStoredValue(newValue !== null ? newValue : initialValue);
                } catch (error) {
                    console.error(`Error parsing IndexedDB value for key "${key}":`, error);
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [key, initialValue, syncAcrossTabs]);

    return [storedValue, setValue, removeValue, isLoading] as const;
}

export default useIndexedDB;
