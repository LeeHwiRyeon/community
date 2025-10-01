/**
 * Custom hook for file monitoring functionality
 */

import { useState, useCallback, useRef, useEffect } from 'react';

export interface MonitoringOptions {
    monitorInterval?: number;
    monitorSize?: boolean;
    monitorModification?: boolean;
    monitorAccess?: boolean;
    monitorPermissions?: boolean;
    onProgress?: (progress: number) => void;
    onError?: (error: Error) => void;
    onSuccess?: (message: string) => void;
}

export interface MonitoringResult {
    file: File;
    isMonitoring: boolean;
    lastChecked: Date;
    changes: FileChange[];
    monitoringTime: number;
    success: boolean;
    error?: string;
}

export interface FileChange {
    id: string;
    type: 'size' | 'modification' | 'access' | 'permissions' | 'content';
    oldValue: any;
    newValue: any;
    timestamp: Date;
    description: string;
}

export function useFileMonitoring(
    options: MonitoringOptions = {}
): {
    isMonitoring: boolean;
    error: Error | null;
    startMonitoring: (file: File, options?: MonitoringOptions) => Promise<MonitoringResult>;
    stopMonitoring: (file: File) => boolean;
    getMonitoringInfo: (file: File) => MonitoringResult | null;
    getMonitoringStats: () => { totalMonitored: number; activeMonitors: number; totalChanges: number; averageMonitoringTime: number };
    clear: () => void;
} {
    const {
        monitorInterval = 5000, // 5 seconds default
        monitorSize = true,
        monitorModification = true,
        monitorAccess = true,
        monitorPermissions = false,
        onProgress,
        onError,
        onSuccess
    } = options;

    const [isMonitoring, setIsMonitoring] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const monitoringHistory = useRef<MonitoringResult[]>([]);
    const monitoringIntervals = useRef<Map<string, NodeJS.Timeout>>(new Map());

    const generateChangeId = useCallback((): string => {
        return `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }, []);

    const detectChanges = useCallback((file: File, previousState: any, currentState: any): FileChange[] => {
        const changes: FileChange[] = [];

        // Check size changes
        if (monitorSize && previousState.size !== currentState.size) {
            changes.push({
                id: generateChangeId(),
                type: 'size',
                oldValue: previousState.size,
                newValue: currentState.size,
                timestamp: new Date(),
                description: `File size changed from ${previousState.size} to ${currentState.size} bytes`,
            });
        }

        // Check modification time changes
        if (monitorModification && previousState.lastModified !== currentState.lastModified) {
            changes.push({
                id: generateChangeId(),
                type: 'modification',
                oldValue: new Date(previousState.lastModified),
                newValue: new Date(currentState.lastModified),
                timestamp: new Date(),
                description: `File modification time changed from ${new Date(previousState.lastModified)} to ${new Date(currentState.lastModified)}`,
            });
        }

        // Check access time changes (simulated)
        if (monitorAccess && previousState.lastAccessed !== currentState.lastAccessed) {
            changes.push({
                id: generateChangeId(),
                type: 'access',
                oldValue: new Date(previousState.lastAccessed),
                newValue: new Date(currentState.lastAccessed),
                timestamp: new Date(),
                description: `File access time changed from ${new Date(previousState.lastAccessed)} to ${new Date(currentState.lastAccessed)}`,
            });
        }

        // Check permissions changes (simulated)
        if (monitorPermissions && previousState.permissions !== currentState.permissions) {
            changes.push({
                id: generateChangeId(),
                type: 'permissions',
                oldValue: previousState.permissions,
                newValue: currentState.permissions,
                timestamp: new Date(),
                description: `File permissions changed from ${previousState.permissions} to ${currentState.permissions}`,
            });
        }

        return changes;
    }, [monitorSize, monitorModification, monitorAccess, monitorPermissions, generateChangeId]);

    const startMonitoring = useCallback(async (file: File, customOptions?: MonitoringOptions): Promise<MonitoringResult> => {
        try {
            const opts = { ...options, ...customOptions };
            const { monitorInterval: mi } = opts;

            // Check if already monitoring
            const existingMonitor = monitoringHistory.current.find(monitor => monitor.file.name === file.name);
            if (existingMonitor && existingMonitor.isMonitoring) {
                onSuccess?.(`Already monitoring ${file.name}`);
                return existingMonitor;
            }

            const startTime = Date.now();
            let previousState = {
                size: file.size,
                lastModified: file.lastModified,
                lastAccessed: Date.now(),
                permissions: 'read-write', // Simulated
            };

            const monitoring: MonitoringResult = {
                file,
                isMonitoring: true,
                lastChecked: new Date(),
                changes: [],
                monitoringTime: 0,
                success: true,
            };

            // Start monitoring interval
            const interval = setInterval(() => {
                try {
                    const currentState = {
                        size: file.size,
                        lastModified: file.lastModified,
                        lastAccessed: Date.now(),
                        permissions: 'read-write', // Simulated
                    };

                    const changes = detectChanges(file, previousState, currentState);
                    if (changes.length > 0) {
                        monitoring.changes.push(...changes);
                        onSuccess?.(`Detected ${changes.length} changes in ${file.name}`);
                    }

                    monitoring.lastChecked = new Date();
                    previousState = currentState;
                } catch (err) {
                    console.error(`Error monitoring file ${file.name}:`, err);
                }
            }, mi);

            monitoringIntervals.current.set(file.name, interval);
            monitoringHistory.current.push(monitoring);

            onProgress?.(100);
            onSuccess?.(`Started monitoring ${file.name}`);

            return monitoring;
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            setError(error);
            onError?.(error);

            const monitoring: MonitoringResult = {
                file,
                isMonitoring: false,
                lastChecked: new Date(),
                changes: [],
                monitoringTime: 0,
                success: false,
                error: error.message,
            };

            monitoringHistory.current.push(monitoring);
            throw error;
        }
    }, [options, detectChanges, onProgress, onError, onSuccess]);

    const stopMonitoring = useCallback((file: File): boolean => {
        try {
            const interval = monitoringIntervals.current.get(file.name);
            if (interval) {
                clearInterval(interval);
                monitoringIntervals.current.delete(file.name);
            }

            const monitoring = monitoringHistory.current.find(monitor => monitor.file.name === file.name);
            if (monitoring) {
                monitoring.isMonitoring = false;
                monitoring.monitoringTime = Date.now() - monitoring.monitoringTime;
            }

            onSuccess?.(`Stopped monitoring ${file.name}`);
            return true;
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            setError(error);
            onError?.(error);
            return false;
        }
    }, [onError, onSuccess]);

    const getMonitoringInfo = useCallback((file: File): MonitoringResult | null => {
        return monitoringHistory.current.find(monitor => monitor.file.name === file.name) || null;
    }, []);

    const getMonitoringStats = useCallback(() => {
        const totalMonitored = monitoringHistory.current.length;
        const activeMonitors = monitoringHistory.current.filter(monitor => monitor.isMonitoring).length;
        const totalChanges = monitoringHistory.current.reduce((sum, monitor) => sum + monitor.changes.length, 0);
        const averageMonitoringTime = totalMonitored > 0
            ? monitoringHistory.current.reduce((sum, monitor) => sum + monitor.monitoringTime, 0) / totalMonitored
            : 0;

        return {
            totalMonitored,
            activeMonitors,
            totalChanges,
            averageMonitoringTime,
        };
    }, []);

    const clear = useCallback(() => {
        // Stop all monitoring intervals
        monitoringIntervals.current.forEach((interval) => {
            clearInterval(interval);
        });
        monitoringIntervals.current.clear();

        monitoringHistory.current = [];
        setError(null);
        setIsMonitoring(false);
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            monitoringIntervals.current.forEach((interval) => {
                clearInterval(interval);
            });
        };
    }, []);

    return {
        isMonitoring,
        error,
        startMonitoring,
        stopMonitoring,
        getMonitoringInfo,
        getMonitoringStats,
        clear,
    };
}

export default useFileMonitoring;