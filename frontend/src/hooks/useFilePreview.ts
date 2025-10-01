/**
 * Custom hook for file preview functionality
 */

import { useState, useCallback, useEffect } from 'react';

export interface FilePreviewOptions {
    maxSize?: number;
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    onError?: (error: Error) => void;
}

export function useFilePreview(
    options: FilePreviewOptions = {}
): {
    preview: string | null;
    isGenerating: boolean;
    error: Error | null;
    generatePreview: (file: File) => void;
    clear: () => void;
    resizeImage: (file: File, maxWidth?: number, maxHeight?: number, quality?: number) => Promise<string>;
    getFileType: (file: File) => string;
    isImage: (file: File) => boolean;
    isVideo: (file: File) => boolean;
    isAudio: (file: File) => boolean;
    isPdf: (file: File) => boolean;
    isText: (file: File) => boolean;
} {
    const { maxSize, maxWidth, maxHeight, quality = 0.8, onError } = options;
    const [preview, setPreview] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const getFileType = useCallback((file: File): string => {
        return file.type || 'application/octet-stream';
    }, []);

    const isImage = useCallback((file: File): boolean => {
        return file.type.startsWith('image/');
    }, []);

    const isVideo = useCallback((file: File): boolean => {
        return file.type.startsWith('video/');
    }, []);

    const isAudio = useCallback((file: File): boolean => {
        return file.type.startsWith('audio/');
    }, []);

    const isPdf = useCallback((file: File): boolean => {
        return file.type === 'application/pdf';
    }, []);

    const isText = useCallback((file: File): boolean => {
        return file.type.startsWith('text/') || file.type === 'application/json' || file.type === 'application/xml';
    }, []);

    const resizeImage = useCallback(async (
        file: File,
        maxWidth?: number,
        maxHeight?: number,
        quality?: number
    ): Promise<string> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            if (!ctx) {
                reject(new Error('Could not get canvas context'));
                return;
            }

            img.onload = () => {
                let { width, height } = img;

                if (maxWidth && width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }

                if (maxHeight && height > maxHeight) {
                    width = (width * maxHeight) / height;
                    height = maxHeight;
                }

                canvas.width = width;
                canvas.height = height;

                ctx.drawImage(img, 0, 0, width, height);

                const resizedDataUrl = canvas.toDataURL('image/jpeg', quality);
                resolve(resizedDataUrl);
            };

            img.onerror = () => {
                reject(new Error('Could not load image'));
            };

            img.src = URL.createObjectURL(file);
        });
    }, []);

    const generatePreview = useCallback(async (file: File) => {
        if (maxSize && file.size > maxSize) {
            const error = new Error(`File size exceeds maximum allowed size of ${maxSize} bytes`);
            setError(error);
            onError?.(error);
            return;
        }

        setIsGenerating(true);
        setError(null);

        try {
            if (isImage(file)) {
                const preview = await resizeImage(file, maxWidth, maxHeight, quality);
                setPreview(preview);
            } else if (isVideo(file)) {
                const video = document.createElement('video');
                video.src = URL.createObjectURL(file);
                video.controls = true;
                video.style.maxWidth = '100%';
                video.style.maxHeight = '300px';

                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                if (ctx) {
                    video.onloadedmetadata = () => {
                        canvas.width = video.videoWidth;
                        canvas.height = video.videoHeight;
                        ctx.drawImage(video, 0, 0);
                        const dataUrl = canvas.toDataURL('image/png');
                        setPreview(dataUrl);
                    };
                }
            } else if (isAudio(file)) {
                const audio = document.createElement('audio');
                audio.src = URL.createObjectURL(file);
                audio.controls = true;
                audio.style.width = '100%';

                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                if (ctx) {
                    canvas.width = 400;
                    canvas.height = 100;
                    ctx.fillStyle = '#f0f0f0';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.fillStyle = '#333';
                    ctx.font = '14px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText('Audio File', canvas.width / 2, canvas.height / 2);

                    const dataUrl = canvas.toDataURL('image/png');
                    setPreview(dataUrl);
                }
            } else if (isPdf(file)) {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                if (ctx) {
                    canvas.width = 400;
                    canvas.height = 300;
                    ctx.fillStyle = '#f0f0f0';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.fillStyle = '#333';
                    ctx.font = '16px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText('PDF File', canvas.width / 2, canvas.height / 2);
                    ctx.font = '12px Arial';
                    ctx.fillText(file.name, canvas.width / 2, canvas.height / 2 + 20);

                    const dataUrl = canvas.toDataURL('image/png');
                    setPreview(dataUrl);
                }
            } else if (isText(file)) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const text = e.target?.result as string;
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');

                    if (ctx) {
                        canvas.width = 400;
                        canvas.height = 300;
                        ctx.fillStyle = '#f0f0f0';
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                        ctx.fillStyle = '#333';
                        ctx.font = '12px monospace';
                        ctx.textAlign = 'left';

                        const lines = text.split('\n');
                        const maxLines = Math.floor(canvas.height / 16);
                        const displayLines = lines.slice(0, maxLines);

                        displayLines.forEach((line, index) => {
                            ctx.fillText(line.substring(0, 50), 10, 20 + index * 16);
                        });

                        if (lines.length > maxLines) {
                            ctx.fillText('...', 10, 20 + maxLines * 16);
                        }

                        const dataUrl = canvas.toDataURL('image/png');
                        setPreview(dataUrl);
                    }
                };
                reader.readAsText(file);
            } else {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                if (ctx) {
                    canvas.width = 400;
                    canvas.height = 300;
                    ctx.fillStyle = '#f0f0f0';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.fillStyle = '#333';
                    ctx.font = '16px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText('File Preview', canvas.width / 2, canvas.height / 2);
                    ctx.font = '12px Arial';
                    ctx.fillText(file.name, canvas.width / 2, canvas.height / 2 + 20);

                    const dataUrl = canvas.toDataURL('image/png');
                    setPreview(dataUrl);
                }
            }
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            setError(error);
            onError?.(error);
        } finally {
            setIsGenerating(false);
        }
    }, [maxSize, maxWidth, maxHeight, quality, onError, isImage, isVideo, isAudio, isPdf, isText, resizeImage]);

    const clear = useCallback(() => {
        setPreview(null);
        setError(null);
        setIsGenerating(false);
    }, []);

    return {
        preview,
        isGenerating,
        error,
        generatePreview,
        clear,
        resizeImage,
        getFileType,
        isImage,
        isVideo,
        isAudio,
        isPdf,
        isText,
    };
}

export default useFilePreview;
