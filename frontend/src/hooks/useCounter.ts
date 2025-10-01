/**
 * Custom hook for counter functionality
 */

import { useState, useCallback } from 'react';

export interface UseCounterOptions {
    initialValue?: number;
    min?: number;
    max?: number;
    step?: number;
}

export function useCounter(
    options: UseCounterOptions = {}
): {
    count: number;
    increment: () => void;
    decrement: () => void;
    reset: () => void;
    setCount: (value: number) => void;
} {
    const { initialValue = 0, min = -Infinity, max = Infinity, step = 1 } = options;
    const [count, setCount] = useState(initialValue);

    const increment = useCallback(() => {
        setCount(prev => Math.min(prev + step, max));
    }, [step, max]);

    const decrement = useCallback(() => {
        setCount(prev => Math.max(prev - step, min));
    }, [step, min]);

    const reset = useCallback(() => {
        setCount(initialValue);
    }, [initialValue]);

    const setCountValue = useCallback((value: number) => {
        setCount(Math.max(min, Math.min(value, max)));
    }, [min, max]);

    return {
        count,
        increment,
        decrement,
        reset,
        setCount: setCountValue,
    };
}

export default useCounter;
