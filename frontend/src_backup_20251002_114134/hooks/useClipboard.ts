/**
 * Custom hook for clipboard functionality
 */

import { useState, useCallback } from 'react';

export interface UseClipboardOptions {
    timeout?: number;
    onSuccess?: (text: string) => void;
    onError?: (error: Error) => void;
}

export function useClipboard(
    options: UseClipboardOptions = {}
): {
    value: string | null;
    isCopied: boolean;
    copy: (text: string) => Promise<void>;
    clear: () => void;
    error: Error | null;
} {
    const { timeout = 2000, onSuccess, onError } = options;
    const [value, setValue] = useState<string | null>(null);
    const [isCopied, setIsCopied] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const copy = useCallback(async (text: string) => {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
            } else {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                textArea.style.top = '-999999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
            }

            setValue(text);
            setIsCopied(true);
            setError(null);
            onSuccess?.(text);

            // Reset copied state after timeout
            setTimeout(() => {
                setIsCopied(false);
            }, timeout);
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            setError(error);
            onError?.(error);
        }
    }, [timeout, onSuccess, onError]);

    const clear = useCallback(() => {
        setValue(null);
        setIsCopied(false);
        setError(null);
    }, []);

    return {
        value,
        isCopied,
        copy,
        clear,
        error,
    };
}

export default useClipboard;
