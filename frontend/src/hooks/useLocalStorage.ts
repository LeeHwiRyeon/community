/**
 * Custom hook for managing localStorage with TypeScript support
 */

import { useState, useEffect, useCallback } from 'react';
import { storageUtils } from '../utils/storage';

export interface UseLocalStorageOptions {
    expires?: number; // TTL in milliseconds
    encrypt?: boolean;
    compress?: boolean;
    syncAcrossTabs?: boolean;
}

export function useLocalStorage<T>(
    key: string,
    initialValue: T,
    options: UseLocalStorageOptions = {}
): [T, (value: T | ((prevValue: T) => T)) => void, () => void] {
    const { expires, encrypt, compress, syncAcrossTabs = true } = options;

    // Get initial value from localStorage or use provided initial value
    const getStoredValue = useCallback((): T => {
        try {
            const storedValue = storageUtils.getLocal<T>(key, { expires, encrypt, compress });
            return storedValue !== null ? storedValue : initialValue;
        } catch (error) {
            console.error(`Error reading localStorage key "${key}":`, error);
            return initialValue;
        }
    }, [key, initialValue, expires, encrypt, compress]);

    // State to store our value
    const [storedValue, setStoredValue] = useState<T>(getStoredValue);

    // Return a wrapped version of useState's setter function that persists the new value to localStorage
    const setValue = useCallback(
        (value: T | ((prevValue: T) => T)) => {
            try {
                // Allow value to be a function so we have the same API as useState
                const valueToStore = value instanceof Function ? value(storedValue) : value;

                // Save state
                setStoredValue(valueToStore);

                // Save to localStorage
                storageUtils.setLocal(key, valueToStore, { expires, encrypt, compress });
            } catch (error) {
                console.error(`Error setting localStorage key "${key}":`, error);
            }
        },
        [key, storedValue, expires, encrypt, compress]
    );

    // Remove from localStorage
    const removeValue = useCallback(() => {
        try {
            setStoredValue(initialValue);
            storageUtils.removeLocal(key);
        } catch (error) {
            console.error(`Error removing localStorage key "${key}":`, error);
        }
    }, [key, initialValue]);

    // Listen for changes to this localStorage key from other tabs
    useEffect(() => {
        if (!syncAcrossTabs) return;

        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === key && e.storageArea === localStorage) {
                try {
                    const newValue = e.newValue ? JSON.parse(e.newValue) : null;
                    setStoredValue(newValue !== null ? newValue : initialValue);
                } catch (error) {
                    console.error(`Error parsing localStorage value for key "${key}":`, error);
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

export default useLocalStorage;
