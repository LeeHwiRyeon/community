/**
 * Custom hook for file download functionality
 */

import { useState, useCallback } from 'react';

export interface FileDownloadOptions {
    filename?: string;
    mimeType?: string;
    onStart?: () => void;
    onProgress?: (progress: number) => void;
    onComplete?: () => void;
    onError?: (error: Error) => void;
}

export function useFileDownload(
    options: FileDownloadOptions = {}
): {
    isDownloading: boolean;
    progress: number;
    error: Error | null;
    download: (data: string | Blob | File, filename?: string) => void;
    downloadUrl: (url: string, filename?: string) => void;
    downloadBlob: (blob: Blob, filename?: string) => void;
    downloadFile: (file: File) => void;
    downloadText: (text: string, filename?: string) => void;
    downloadJson: (data: any, filename?: string) => void;
    downloadCsv: (data: any[], filename?: string) => void;
    downloadImage: (imageData: string, filename?: string) => void;
    downloadPdf: (pdfData: string, filename?: string) => void;
    downloadZip: (files: { name: string; data: string | Blob }[], filename?: string) => void;
    clear: () => void;
} {
    const { onStart, onProgress, onComplete, onError } = options;
    const [isDownloading, setIsDownloading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<Error | null>(null);

    const download = useCallback((data: string | Blob | File, filename?: string) => {
        try {
            setIsDownloading(true);
            setProgress(0);
            setError(null);
            onStart?.();

            let blob: Blob;
            let downloadFilename = filename;

            if (data instanceof File) {
                blob = data;
                downloadFilename = downloadFilename || data.name;
            } else if (data instanceof Blob) {
                blob = data;
            } else {
                blob = new Blob([data], { type: 'text/plain' });
                downloadFilename = downloadFilename || 'download.txt';
            }

            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = downloadFilename || 'download';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            setProgress(100);
            onProgress?.(100);
            onComplete?.();
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            setError(error);
            onError?.(error);
        } finally {
            setIsDownloading(false);
        }
    }, [onStart, onProgress, onComplete, onError]);

    const downloadUrl = useCallback((url: string, filename?: string) => {
        try {
            setIsDownloading(true);
            setProgress(0);
            setError(null);
            onStart?.();

            const link = document.createElement('a');
            link.href = url;
            link.download = filename || 'download';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            setProgress(100);
            onProgress?.(100);
            onComplete?.();
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            setError(error);
            onError?.(error);
        } finally {
            setIsDownloading(false);
        }
    }, [onStart, onProgress, onComplete, onError]);

    const downloadBlob = useCallback((blob: Blob, filename?: string) => {
        download(blob, filename);
    }, [download]);

    const downloadFile = useCallback((file: File) => {
        download(file);
    }, [download]);

    const downloadText = useCallback((text: string, filename?: string) => {
        download(text, filename || 'download.txt');
    }, [download]);

    const downloadJson = useCallback((data: any, filename?: string) => {
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        download(blob, filename || 'download.json');
    }, [download]);

    const downloadCsv = useCallback((data: any[], filename?: string) => {
        if (data.length === 0) return;

        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        download(blob, filename || 'download.csv');
    }, [download]);

    const downloadImage = useCallback((imageData: string, filename?: string) => {
        const blob = new Blob([imageData], { type: 'image/png' });
        download(blob, filename || 'download.png');
    }, [download]);

    const downloadPdf = useCallback((pdfData: string, filename?: string) => {
        const blob = new Blob([pdfData], { type: 'application/pdf' });
        download(blob, filename || 'download.pdf');
    }, [download]);

    const downloadZip = useCallback((files: { name: string; data: string | Blob }[], filename?: string) => {
        // This is a simplified implementation
        // In a real application, you would use a library like JSZip
        const zipContent = files.map(file => `${file.name}: ${file.data}`).join('\n');
        const blob = new Blob([zipContent], { type: 'application/zip' });
        download(blob, filename || 'download.zip');
    }, [download]);

    const clear = useCallback(() => {
        setProgress(0);
        setError(null);
        setIsDownloading(false);
    }, []);

    return {
        isDownloading,
        progress,
        error,
        download,
        downloadUrl,
        downloadBlob,
        downloadFile,
        downloadText,
        downloadJson,
        downloadCsv,
        downloadImage,
        downloadPdf,
        downloadZip,
        clear,
    };
}

export default useFileDownload;
