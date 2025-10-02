/**
 * Custom hook for managing sessionStorage with TypeScript support
 */

import { useState, useEffect, useCallback } from 'react';
import { storageUtils } from '../utils/storage';

export interface UseSessionStorageOptions {
    syncAcrossTabs?: boolean;
}

export function useSessionStorage<T>(
    key: string,
    initialValue: T,
    options: UseSessionStorageOptions = {}
): [T, (value: T | ((prevValue: T) => T)) => void, () => void] {
    const { syncAcrossTabs = true } = options;

    // Get initial value from sessionStorage or use provided initial value
    const getStoredValue = useCallback((): T => {
        try {
            const storedValue = storageUtils.getSession<T>(key);
            return storedValue !== null ? storedValue : initialValue;
        } catch (error) {
            console.error(`Error reading sessionStorage key "${key}":`, error);
            return initialValue;
        }
    }, [key, initialValue]);

    // State to store our value
    const [storedValue, setStoredValue] = useState<T>(getStoredValue);

    // Return a wrapped version of useState's setter function that persists the new value to sessionStorage
    const setValue = useCallback(
        (value: T | ((prevValue: T) => T)) => {
            try {
                // Allow value to be a function so we have the same API as useState
                const valueToStore = value instanceof Function ? value(storedValue) : value;

                // Save state
                setStoredValue(valueToStore);

                // Save to sessionStorage
                storageUtils.setSession(key, valueToStore);
            } catch (error) {
                console.error(`Error setting sessionStorage key "${key}":`, error);
            }
        },
        [key, storedValue]
    );

    // Remove from sessionStorage
    const removeValue = useCallback(() => {
        try {
            setStoredValue(initialValue);
            storageUtils.removeSession(key);
        } catch (error) {
            console.error(`Error removing sessionStorage key "${key}":`, error);
        }
    }, [key, initialValue]);

    // Listen for changes to this sessionStorage key from other tabs
    useEffect(() => {
        if (!syncAcrossTabs) return;

        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === key && e.storageArea === sessionStorage) {
                try {
                    const newValue = e.newValue ? JSON.parse(e.newValue) : null;
                    setStoredValue(newValue !== null ? newValue : initialValue);
                } catch (error) {
                    console.error(`Error parsing sessionStorage value for key "${key}":`, error);
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [key, initialValue, syncAcrossTabs]);

    // Update stored value when key changes
    useEffect(() => {
        setStoredValue(getStoredValue());
    }, [getStoredValue]);

    return [storedValue, setValue, removeValue];
}

export default useSessionStorage;
