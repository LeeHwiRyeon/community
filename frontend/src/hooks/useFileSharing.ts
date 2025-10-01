/**
 * Custom hook for file sharing functionality
 */

import { useState, useCallback, useRef } from 'react';

export interface SharingOptions {
    expirationTime?: number; // in milliseconds
    password?: string;
    allowDownload?: boolean;
    allowPreview?: boolean;
    maxDownloads?: number;
    onProgress?: (progress: number) => void;
    onError?: (error: Error) => void;
    onSuccess?: (message: string) => void;
}

export interface ShareResult {
    originalFiles: File[];
    shareUrl: string;
    shareId: string;
    expirationTime: Date;
    password?: string;
    downloadCount: number;
    maxDownloads?: number;
    shareTime: number;
    success: boolean;
    error?: string;
}

export function useFileSharing(
    options: SharingOptions = {}
): {
    isSharing: boolean;
    error: Error | null;
    shareFiles: (files: File[], options?: SharingOptions) => Promise<ShareResult>;
    getShareInfo: (shareId: string) => ShareResult | null;
    revokeShare: (shareId: string) => boolean;
    getSharingStats: () => { totalShares: number; activeShares: number; totalDownloads: number; averageShareTime: number };
    clear: () => void;
} {
    const {
        expirationTime = 24 * 60 * 60 * 1000, // 24 hours default
        password,
        allowDownload = true,
        allowPreview = true,
        maxDownloads,
        onProgress,
        onError,
        onSuccess
    } = options;

    const [isSharing, setIsSharing] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const shareHistory = useRef<ShareResult[]>([]);

    const generateShareId = useCallback((): string => {
        return `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }, []);

    const generateShareUrl = useCallback((shareId: string): string => {
        const baseUrl = window.location.origin;
        return `${baseUrl}/share/${shareId}`;
    }, []);

    const shareFiles = useCallback(async (files: File[], customOptions?: SharingOptions): Promise<ShareResult> => {
        setIsSharing(true);
        setError(null);
        const startTime = Date.now();

        try {
            const opts = { ...options, ...customOptions };
            const { expirationTime: et, password: pwd, maxDownloads: md } = opts;

            // Generate share ID and URL
            const shareId = generateShareId();
            const shareUrl = generateShareUrl(shareId);

            // Calculate expiration time
            const expiration = new Date(Date.now() + et);

            // In a real application, you would upload the files to a server
            // and store the share information in a database
            // This is a simplified implementation

            const shareTime = Date.now() - startTime;

            const result: ShareResult = {
                originalFiles: files,
                shareUrl,
                shareId,
                expirationTime: expiration,
                password: pwd,
                downloadCount: 0,
                maxDownloads: md,
                shareTime,
                success: true,
            };

            shareHistory.current.push(result);
            onProgress?.(100);
            onSuccess?.(`Shared ${files.length} files: ${shareUrl}`);

            return result;
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            setError(error);
            onError?.(error);

            const result: ShareResult = {
                originalFiles: files,
                shareUrl: '',
                shareId: '',
                expirationTime: new Date(),
                downloadCount: 0,
                shareTime: Date.now() - startTime,
                success: false,
                error: error.message,
            };

            shareHistory.current.push(result);
            throw error;
        } finally {
            setIsSharing(false);
        }
    }, [options, generateShareId, generateShareUrl, onProgress, onError, onSuccess]);

    const getShareInfo = useCallback((shareId: string): ShareResult | null => {
        return shareHistory.current.find(share => share.shareId === shareId) || null;
    }, []);

    const revokeShare = useCallback((shareId: string): boolean => {
        try {
            const shareIndex = shareHistory.current.findIndex(share => share.shareId === shareId);
            if (shareIndex !== -1) {
                shareHistory.current.splice(shareIndex, 1);
                onSuccess?.(`Revoked share: ${shareId}`);
                return true;
            }
            return false;
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            setError(error);
            onError?.(error);
            return false;
        }
    }, [onError, onSuccess]);

    const getSharingStats = useCallback(() => {
        const totalShares = shareHistory.current.length;
        const activeShares = shareHistory.current.filter(share =>
            share.success && new Date() < share.expirationTime
        ).length;
        const totalDownloads = shareHistory.current.reduce((sum, share) => sum + share.downloadCount, 0);
        const averageShareTime = totalShares > 0
            ? shareHistory.current.reduce((sum, share) => sum + share.shareTime, 0) / totalShares
            : 0;

        return {
            totalShares,
            activeShares,
            totalDownloads,
            averageShareTime,
        };
    }, []);

    const clear = useCallback(() => {
        shareHistory.current = [];
        setError(null);
        setIsSharing(false);
    }, []);

    return {
        isSharing,
        error,
        shareFiles,
        getShareInfo,
        revokeShare,
        getSharingStats,
        clear,
    };
}

export default useFileSharing;