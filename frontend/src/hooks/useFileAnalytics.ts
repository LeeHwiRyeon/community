/**
 * Custom hook for file analytics functionality
 */

import { useState, useCallback, useRef } from 'react';

export interface AnalyticsOptions {
    trackViews?: boolean;
    trackDownloads?: boolean;
    trackShares?: boolean;
    trackComments?: boolean;
    trackVersions?: boolean;
    onProgress?: (progress: number) => void;
    onError?: (error: Error) => void;
    onSuccess?: (message: string) => void;
}

export interface AnalyticsData {
    fileId: string;
    fileName: string;
    views: number;
    downloads: number;
    shares: number;
    comments: number;
    versions: number;
    lastViewed: Date;
    lastDownloaded: Date;
    lastShared: Date;
    lastCommented: Date;
    lastVersioned: Date;
    totalSize: number;
    averageViewTime: number;
    uniqueViewers: string[];
    uniqueDownloaders: string[];
    uniqueSharers: string[];
    uniqueCommenters: string[];
    uniqueVersioners: string[];
}

export interface AnalyticsEvent {
    id: string;
    fileId: string;
    eventType: 'view' | 'download' | 'share' | 'comment' | 'version';
    userId: string;
    timestamp: Date;
    metadata?: Record<string, any>;
}

export function useFileAnalytics(
    options: AnalyticsOptions = {}
): {
    isTracking: boolean;
    error: Error | null;
    trackEvent: (file: File, eventType: 'view' | 'download' | 'share' | 'comment' | 'version', metadata?: Record<string, any>) => void;
    getAnalytics: (file: File) => AnalyticsData | null;
    getAllAnalytics: () => AnalyticsData[];
    getAnalyticsStats: () => { totalFiles: number; totalEvents: number; averageViews: number; averageDownloads: number; averageShares: number };
    clear: () => void;
} {
    const {
        trackViews = true,
        trackDownloads = true,
        trackShares = true,
        trackComments = true,
        trackVersions = true,
        onProgress,
        onError,
        onSuccess
    } = options;

    const [isTracking, setIsTracking] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const analyticsData = useRef<Map<string, AnalyticsData>>(new Map());
    const eventHistory = useRef<AnalyticsEvent[]>([]);

    const generateId = useCallback((): string => {
        return `analytics_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }, []);

    const getOrCreateAnalytics = useCallback((file: File): AnalyticsData => {
        const fileId = file.name;
        let analytics = analyticsData.current.get(fileId);

        if (!analytics) {
            analytics = {
                fileId,
                fileName: file.name,
                views: 0,
                downloads: 0,
                shares: 0,
                comments: 0,
                versions: 0,
                lastViewed: new Date(0),
                lastDownloaded: new Date(0),
                lastShared: new Date(0),
                lastCommented: new Date(0),
                lastVersioned: new Date(0),
                totalSize: file.size,
                averageViewTime: 0,
                uniqueViewers: [],
                uniqueDownloaders: [],
                uniqueSharers: [],
                uniqueCommenters: [],
                uniqueVersioners: [],
            };
            analyticsData.current.set(fileId, analytics);
        }

        return analytics;
    }, []);

    const trackEvent = useCallback((file: File, eventType: 'view' | 'download' | 'share' | 'comment' | 'version', metadata: Record<string, any> = {}) => {
        try {
            const analytics = getOrCreateAnalytics(file);
            const userId = 'user'; // In a real app, this would be the actual user ID
            const now = new Date();

            // Create event
            const event: AnalyticsEvent = {
                id: generateId(),
                fileId: file.name,
                eventType,
                userId,
                timestamp: now,
                metadata,
            };

            eventHistory.current.push(event);

            // Update analytics based on event type
            switch (eventType) {
                case 'view':
                    if (trackViews) {
                        analytics.views++;
                        analytics.lastViewed = now;
                        if (!analytics.uniqueViewers.includes(userId)) {
                            analytics.uniqueViewers.push(userId);
                        }
                    }
                    break;
                case 'download':
                    if (trackDownloads) {
                        analytics.downloads++;
                        analytics.lastDownloaded = now;
                        if (!analytics.uniqueDownloaders.includes(userId)) {
                            analytics.uniqueDownloaders.push(userId);
                        }
                    }
                    break;
                case 'share':
                    if (trackShares) {
                        analytics.shares++;
                        analytics.lastShared = now;
                        if (!analytics.uniqueSharers.includes(userId)) {
                            analytics.uniqueSharers.push(userId);
                        }
                    }
                    break;
                case 'comment':
                    if (trackComments) {
                        analytics.comments++;
                        analytics.lastCommented = now;
                        if (!analytics.uniqueCommenters.includes(userId)) {
                            analytics.uniqueCommenters.push(userId);
                        }
                    }
                    break;
                case 'version':
                    if (trackVersions) {
                        analytics.versions++;
                        analytics.lastVersioned = now;
                        if (!analytics.uniqueVersioners.includes(userId)) {
                            analytics.uniqueVersioners.push(userId);
                        }
                    }
                    break;
            }

            // Update average view time if it's a view event
            if (eventType === 'view' && metadata.viewTime) {
                analytics.averageViewTime = (analytics.averageViewTime + metadata.viewTime) / 2;
            }

            onSuccess?.(`Tracked ${eventType} event for ${file.name}`);
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            setError(error);
            onError?.(error);
        }
    }, [getOrCreateAnalytics, generateId, trackViews, trackDownloads, trackShares, trackComments, trackVersions, onError, onSuccess]);

    const getAnalytics = useCallback((file: File): AnalyticsData | null => {
        return analyticsData.current.get(file.name) || null;
    }, []);

    const getAllAnalytics = useCallback((): AnalyticsData[] => {
        return Array.from(analyticsData.current.values());
    }, []);

    const getAnalyticsStats = useCallback(() => {
        const totalFiles = analyticsData.current.size;
        const totalEvents = eventHistory.current.length;
        const allAnalytics = Array.from(analyticsData.current.values());

        const averageViews = allAnalytics.length > 0
            ? allAnalytics.reduce((sum, analytics) => sum + analytics.views, 0) / allAnalytics.length
            : 0;

        const averageDownloads = allAnalytics.length > 0
            ? allAnalytics.reduce((sum, analytics) => sum + analytics.downloads, 0) / allAnalytics.length
            : 0;

        const averageShares = allAnalytics.length > 0
            ? allAnalytics.reduce((sum, analytics) => sum + analytics.shares, 0) / allAnalytics.length
            : 0;

        return {
            totalFiles,
            totalEvents,
            averageViews,
            averageDownloads,
            averageShares,
        };
    }, []);

    const clear = useCallback(() => {
        analyticsData.current.clear();
        eventHistory.current = [];
        setError(null);
        setIsTracking(false);
    }, []);

    return {
        isTracking,
        error,
        trackEvent,
        getAnalytics,
        getAllAnalytics,
        getAnalyticsStats,
        clear,
    };
}

export default useFileAnalytics;