/**
 * Custom hook for network status
 */

import { useState, useEffect, useCallback } from 'react';

export interface NetworkStatus {
    isOnline: boolean;
    isOffline: boolean;
    connectionType: string;
    effectiveType: string;
    downlink: number;
    rtt: number;
    saveData: boolean;
    lastOnline: Date | null;
    lastOffline: Date | null;
    onlineCount: number;
    offlineCount: number;
}

export interface UseNetworkStatusOptions {
    onOnline?: () => void;
    onOffline?: () => void;
    onStatusChange?: (status: NetworkStatus) => void;
}

export function useNetworkStatus(
    options: UseNetworkStatusOptions = {}
): NetworkStatus & {
    refresh: () => void;
} {
    const { onOnline, onOffline, onStatusChange } = options;
    const [status, setStatus] = useState<NetworkStatus>({
        isOnline: navigator.onLine,
        isOffline: !navigator.onLine,
        connectionType: 'unknown',
        effectiveType: 'unknown',
        downlink: 0,
        rtt: 0,
        saveData: false,
        lastOnline: null,
        lastOffline: null,
        onlineCount: 0,
        offlineCount: 0,
    });

    const updateStatus = useCallback(() => {
        const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;

        const newStatus: NetworkStatus = {
            isOnline: navigator.onLine,
            isOffline: !navigator.onLine,
            connectionType: connection?.type || 'unknown',
            effectiveType: connection?.effectiveType || 'unknown',
            downlink: connection?.downlink || 0,
            rtt: connection?.rtt || 0,
            saveData: connection?.saveData || false,
            lastOnline: status.lastOnline,
            lastOffline: status.lastOffline,
            onlineCount: status.onlineCount,
            offlineCount: status.offlineCount,
        };

        if (newStatus.isOnline && !status.isOnline) {
            newStatus.lastOnline = new Date();
            newStatus.onlineCount = status.onlineCount + 1;
            onOnline?.();
        } else if (newStatus.isOffline && !status.isOffline) {
            newStatus.lastOffline = new Date();
            newStatus.offlineCount = status.offlineCount + 1;
            onOffline?.();
        }

        setStatus(newStatus);
        onStatusChange?.(newStatus);
    }, [status, onOnline, onOffline, onStatusChange]);

    const refresh = useCallback(() => {
        updateStatus();
    }, [updateStatus]);

    useEffect(() => {
        updateStatus();

        const handleOnline = () => updateStatus();
        const handleOffline = () => updateStatus();
        const handleConnectionChange = () => updateStatus();

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
        if (connection) {
            connection.addEventListener('change', handleConnectionChange);
        }

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            if (connection) {
                connection.removeEventListener('change', handleConnectionChange);
            }
        };
    }, [updateStatus]);

    return {
        ...status,
        refresh,
    };
}

export default useNetworkStatus;
