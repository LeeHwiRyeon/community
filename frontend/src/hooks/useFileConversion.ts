/**
 * Custom hook for file conversion functionality
 */

import { useState, useCallback, useRef } from 'react';

export interface ConversionOptions {
    quality?: number; // 0-1 for image conversion
    maxWidth?: number;
    maxHeight?: number;
    onProgress?: (progress: number) => void;
    onError?: (error: Error) => void;
    onSuccess?: (message: string) => void;
}

export interface ConversionResult {
    originalFile: File;
    convertedFile: File;
    conversionTime: number;
    method: string;
    success: boolean;
    error?: string;
}

export function useFileConversion(
    options: ConversionOptions = {}
): {
    isConverting: boolean;
    error: Error | null;
    convertImage: (file: File, targetFormat: string, options?: ConversionOptions) => Promise<ConversionResult>;
    convertFile: (file: File, targetFormat: string, options?: ConversionOptions) => Promise<ConversionResult>;
    convertMultiple: (files: File[], targetFormat: string, options?: ConversionOptions) => Promise<ConversionResult[]>;
    getConversionStats: () => { totalConverted: number; totalSuccessful: number; totalFailed: number; averageConversionTime: number };
    clear: () => void;
} {
    const {
        quality = 0.8,
        maxWidth = 1920,
        maxHeight = 1080,
        onProgress,
        onError,
        onSuccess
    } = options;

    const [isConverting, setIsConverting] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const conversionHistory = useRef<ConversionResult[]>([]);

    const convertImage = useCallback(async (file: File, targetFormat: string, customOptions?: ConversionOptions): Promise<ConversionResult> => {
        setIsConverting(true);
        setError(null);
        const startTime = Date.now();

        try {
            const opts = { ...options, ...customOptions };
            const { quality: q, maxWidth: mw, maxHeight: mh } = opts;

            // Validate input file
            if (!file.type.startsWith('image/')) {
                throw new Error('Input file must be an image');
            }

            // Create canvas for image conversion
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

            // Draw and convert
            ctx.drawImage(img, 0, 0, width, height);

            const convertedBlob = await new Promise<Blob>((resolve, reject) => {
                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            resolve(blob);
                        } else {
                            reject(new Error('Failed to convert image'));
                        }
                    },
                    `image/${targetFormat}`,
                    q
                );
            });

            const convertedFile = new File([convertedBlob], file.name.replace(/\.[^/.]+$/, `.${targetFormat}`), {
                type: `image/${targetFormat}`,
                lastModified: Date.now(),
            });

            const conversionTime = Date.now() - startTime;

            const result: ConversionResult = {
                originalFile: file,
                convertedFile,
                conversionTime,
                method: `image-to-${targetFormat}`,
                success: true,
            };

            conversionHistory.current.push(result);
            onProgress?.(100);
            onSuccess?.(`Image converted to ${targetFormat}: ${file.name}`);

            // Clean up
            URL.revokeObjectURL(img.src);

            return result;
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            setError(error);
            onError?.(error);

            const result: ConversionResult = {
                originalFile: file,
                convertedFile: new File([], ''),
                conversionTime: Date.now() - startTime,
                method: `image-to-${targetFormat}`,
                success: false,
                error: error.message,
            };

            conversionHistory.current.push(result);
            throw error;
        } finally {
            setIsConverting(false);
        }
    }, [options, onProgress, onError, onSuccess]);

    const convertFile = useCallback(async (file: File, targetFormat: string, customOptions?: ConversionOptions): Promise<ConversionResult> => {
        setIsConverting(true);
        setError(null);
        const startTime = Date.now();

        try {
            // Check if file is an image
            if (file.type.startsWith('image/')) {
                return await convertImage(file, targetFormat, customOptions);
            }

            // For non-image files, we'll simulate conversion
            // In a real application, you might use libraries for different file types
            const arrayBuffer = await file.arrayBuffer();

            // Simulate conversion by creating a new file with the target format
            const convertedBlob = new Blob([arrayBuffer], { type: `application/${targetFormat}` });
            const convertedFile = new File([convertedBlob], file.name.replace(/\.[^/.]+$/, `.${targetFormat}`), {
                type: `application/${targetFormat}`,
                lastModified: Date.now(),
            });

            const conversionTime = Date.now() - startTime;

            const result: ConversionResult = {
                originalFile: file,
                convertedFile,
                conversionTime,
                method: `file-to-${targetFormat}`,
                success: true,
            };

            conversionHistory.current.push(result);
            onProgress?.(100);
            onSuccess?.(`File converted to ${targetFormat}: ${file.name}`);

            return result;
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            setError(error);
            onError?.(error);

            const result: ConversionResult = {
                originalFile: file,
                convertedFile: new File([], ''),
                conversionTime: Date.now() - startTime,
                method: `file-to-${targetFormat}`,
                success: false,
                error: error.message,
            };

            conversionHistory.current.push(result);
            throw error;
        } finally {
            setIsConverting(false);
        }
    }, [options, convertImage, onProgress, onError, onSuccess]);

    const convertMultiple = useCallback(async (files: File[], targetFormat: string, customOptions?: ConversionOptions): Promise<ConversionResult[]> => {
        setIsConverting(true);
        setError(null);

        try {
            const results: ConversionResult[] = [];
            const totalFiles = files.length;

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                onProgress?.((i / totalFiles) * 100);

                try {
                    const result = await convertFile(file, targetFormat, customOptions);
                    results.push(result);
                } catch (err) {
                    console.error(`Failed to convert file ${file.name}:`, err);
                    // Continue with other files
                }
            }

            onProgress?.(100);
            onSuccess?.(`Converted ${results.length} of ${totalFiles} files`);

            return results;
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            setError(error);
            onError?.(error);
            throw error;
        } finally {
            setIsConverting(false);
        }
    }, [convertFile, onProgress, onError, onSuccess]);

    const getConversionStats = useCallback(() => {
        const totalConverted = conversionHistory.current.length;
        const totalSuccessful = conversionHistory.current.filter(result => result.success).length;
        const totalFailed = totalConverted - totalSuccessful;
        const averageConversionTime = totalConverted > 0
            ? conversionHistory.current.reduce((sum, result) => sum + result.conversionTime, 0) / totalConverted
            : 0;

        return {
            totalConverted,
            totalSuccessful,
            totalFailed,
            averageConversionTime,
        };
    }, []);

    const clear = useCallback(() => {
        conversionHistory.current = [];
        setError(null);
        setIsConverting(false);
    }, []);

    return {
        isConverting,
        error,
        convertImage,
        convertFile,
        convertMultiple,
        getConversionStats,
        clear,
    };
}

export default useFileConversion;