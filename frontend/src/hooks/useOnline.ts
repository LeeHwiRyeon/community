/**
 * Custom hook for online status
 */

import { useState, useEffect, useCallback } from 'react';

export interface UseOnlineOptions {
    onOnline?: () => void;
    onOffline?: () => void;
    onStatusChange?: (isOnline: boolean) => void;
}

export function useOnline(
    options: UseOnlineOptions = {}
): {
    isOnline: boolean;
    isOffline: boolean;
    lastOnline: Date | null;
    lastOffline: Date | null;
    onlineCount: number;
    offlineCount: number;
} {
    const { onOnline, onOffline, onStatusChange } = options;
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [lastOnline, setLastOnline] = useState<Date | null>(null);
    const [lastOffline, setLastOffline] = useState<Date | null>(null);
    const [onlineCount, setOnlineCount] = useState(0);
    const [offlineCount, setOfflineCount] = useState(0);

    const handleOnline = useCallback(() => {
        setIsOnline(true);
        setLastOnline(new Date());
        setOnlineCount(prev => prev + 1);
        onOnline?.();
        onStatusChange?.(true);
    }, [onOnline, onStatusChange]);

    const handleOffline = useCallback(() => {
        setIsOnline(false);
        setLastOffline(new Date());
        setOfflineCount(prev => prev + 1);
        onOffline?.();
        onStatusChange?.(false);
    }, [onOffline, onStatusChange]);

    useEffect(() => {
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [handleOnline, handleOffline]);

    return {
        isOnline,
        isOffline: !isOnline,
        lastOnline,
        lastOffline,
        onlineCount,
        offlineCount,
    };
}

export default useOnline;
