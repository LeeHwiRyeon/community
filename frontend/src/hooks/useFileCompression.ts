/**
 * Custom hook for file compression functionality
 */

import { useState, useCallback, useRef } from 'react';

export interface CompressionOptions {
    quality?: number; // 0-1 for image compression
    maxWidth?: number;
    maxHeight?: number;
    format?: 'jpeg' | 'png' | 'webp' | 'gif';
    level?: number; // 1-9 for general compression
    onProgress?: (progress: number) => void;
    onError?: (error: Error) => void;
    onSuccess?: (message: string) => void;
}

export interface CompressionResult {
    originalFile: File;
    compressedFile: File;
    compressionRatio: number;
    sizeReduction: number;
    compressionTime: number;
    method: string;
}

export function useFileCompression(
    options: CompressionOptions = {}
): {
    isCompressing: boolean;
    error: Error | null;
    compressImage: (file: File, options?: CompressionOptions) => Promise<CompressionResult>;
    compressFile: (file: File, options?: CompressionOptions) => Promise<CompressionResult>;
    compressMultiple: (files: File[], options?: CompressionOptions) => Promise<CompressionResult[]>;
    getCompressionStats: () => { totalCompressed: number; totalSizeReduction: number; averageRatio: number };
    clear: () => void;
} {
    const {
        quality = 0.8,
        maxWidth = 1920,
        maxHeight = 1080,
        format = 'jpeg',
        level = 6,
        onProgress,
        onError,
        onSuccess
    } = options;

    const [isCompressing, setIsCompressing] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const compressionHistory = useRef<CompressionResult[]>([]);

    const compressImage = useCallback(async (file: File, customOptions?: CompressionOptions): Promise<CompressionResult> => {
        setIsCompressing(true);
        setError(null);
        const startTime = Date.now();

        try {
            const opts = { ...options, ...customOptions };
            const { quality: q, maxWidth: mw, maxHeight: mh, format: f } = opts;

            // Create canvas for image compression
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                throw new Error('Canvas context not available');
            }

            // Load image
            const img = new Image();
            const imageLoadPromise = new Promise<void>((resolve, reject) => {
                img.onload = () => resolve();
                img.onerror = () => reject(new Error('Failed to load image'));
                img.src = URL.createObjectURL(file);
            });

            await imageLoadPromise;

            // Calculate new dimensions
            let { width, height } = img;
            const aspectRatio = width / height;

            if (width > mw || height > mh) {
                if (aspectRatio > 1) {
                    width = Math.min(width, mw);
                    height = width / aspectRatio;
                } else {
                    height = Math.min(height, mh);
                    width = height * aspectRatio;
                }
            }

            canvas.width = width;
            canvas.height = height;

            // Draw and compress
            ctx.drawImage(img, 0, 0, width, height);

            const compressedBlob = await new Promise<Blob>((resolve, reject) => {
                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            resolve(blob);
                        } else {
                            reject(new Error('Failed to compress image'));
                        }
                    },
                    `image/${f}`,
                    q
                );
            });

            const compressedFile = new File([compressedBlob], file.name.replace(/\.[^/.]+$/, `.${f}`), {
                type: `image/${f}`,
                lastModified: Date.now(),
            });

            const compressionTime = Date.now() - startTime;
            const compressionRatio = compressedFile.size / file.size;
            const sizeReduction = file.size - compressedFile.size;

            const result: CompressionResult = {
                originalFile: file,
                compressedFile,
                compressionRatio,
                sizeReduction,
                compressionTime,
                method: `image-${f}`,
            };

            compressionHistory.current.push(result);
            onProgress?.(100);
            onSuccess?.(`Image compressed: ${(compressionRatio * 100).toFixed(1)}% of original size`);

            // Clean up
            URL.revokeObjectURL(img.src);

            return result;
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            setError(error);
            onError?.(error);
            throw error;
        } finally {
            setIsCompressing(false);
        }
    }, [options, onProgress, onError, onSuccess]);

    const compressFile = useCallback(async (file: File, customOptions?: CompressionOptions): Promise<CompressionResult> => {
        setIsCompressing(true);
        setError(null);
        const startTime = Date.now();

        try {
            const opts = { ...options, ...customOptions };
            const { level: l } = opts;

            // Check if file is an image
            if (file.type.startsWith('image/')) {
                return await compressImage(file, customOptions);
            }

            // For non-image files, we'll use a simple compression simulation
            // In a real application, you might use libraries like pako for gzip compression
            const arrayBuffer = await file.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);

            // Simple compression simulation (in reality, you'd use actual compression)
            const compressedSize = Math.floor(arrayBuffer.byteLength * (0.5 + Math.random() * 0.3));
            const compressedArray = new Uint8Array(compressedSize);

            // Simulate compression by taking every other byte (simplified)
            for (let i = 0; i < compressedSize && i * 2 < uint8Array.length; i++) {
                compressedArray[i] = uint8Array[i * 2];
            }

            const compressedBlob = new Blob([compressedArray], { type: file.type });
            const compressedFile = new File([compressedBlob], file.name, {
                type: file.type,
                lastModified: Date.now(),
            });

            const compressionTime = Date.now() - startTime;
            const compressionRatio = compressedFile.size / file.size;
            const sizeReduction = file.size - compressedFile.size;

            const result: CompressionResult = {
                originalFile: file,
                compressedFile,
                compressionRatio,
                sizeReduction,
                compressionTime,
                method: 'general-compression',
            };

            compressionHistory.current.push(result);
            onProgress?.(100);
            onSuccess?.(`File compressed: ${(compressionRatio * 100).toFixed(1)}% of original size`);

            return result;
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            setError(error);
            onError?.(error);
            throw error;
        } finally {
            setIsCompressing(false);
        }
    }, [options, compressImage, onProgress, onError, onSuccess]);

    const compressMultiple = useCallback(async (files: File[], customOptions?: CompressionOptions): Promise<CompressionResult[]> => {
        setIsCompressing(true);
        setError(null);

        try {
            const results: CompressionResult[] = [];
            const totalFiles = files.length;

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                onProgress?.((i / totalFiles) * 100);

                try {
                    const result = await compressFile(file, customOptions);
                    results.push(result);
                } catch (err) {
                    console.error(`Failed to compress file ${file.name}:`, err);
                    // Continue with other files
                }
            }

            onProgress?.(100);
            onSuccess?.(`Compressed ${results.length} of ${totalFiles} files`);

            return results;
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            setError(error);
            onError?.(error);
            throw error;
        } finally {
            setIsCompressing(false);
        }
    }, [compressFile, onProgress, onError, onSuccess]);

    const getCompressionStats = useCallback(() => {
        const totalCompressed = compressionHistory.current.length;
        const totalSizeReduction = compressionHistory.current.reduce((sum, result) => sum + result.sizeReduction, 0);
        const averageRatio = totalCompressed > 0
            ? compressionHistory.current.reduce((sum, result) => sum + result.compressionRatio, 0) / totalCompressed
            : 0;

        return {
            totalCompressed,
            totalSizeReduction,
            averageRatio,
        };
    }, []);

    const clear = useCallback(() => {
        compressionHistory.current = [];
        setError(null);
        setIsCompressing(false);
    }, []);

    return {
        isCompressing,
        error,
        compressImage,
        compressFile,
        compressMultiple,
        getCompressionStats,
        clear,
    };
}

export default useFileCompression;