/**
 * Custom hook for boolean operations
 */

import { useState, useCallback } from 'react';

export function useBoolean(
    initialValue: boolean = false
): {
    value: boolean;
    setTrue: () => void;
    setFalse: () => void;
    toggle: () => void;
    setValue: (value: boolean) => void;
} {
    const [value, setValue] = useState(initialValue);

    const setTrue = useCallback(() => {
        setValue(true);
    }, []);

    const setFalse = useCallback(() => {
        setValue(false);
    }, []);

    const toggle = useCallback(() => {
        setValue(prev => !prev);
    }, []);

    const setValueCallback = useCallback((value: boolean) => {
        setValue(value);
    }, []);

    return {
        value,
        setTrue,
        setFalse,
        toggle,
        setValue: setValueCallback,
    };
}

export default useBoolean;
