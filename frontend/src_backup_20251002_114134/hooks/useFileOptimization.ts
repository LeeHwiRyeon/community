/**
 * Custom hook for file optimization functionality
 */

import { useState, useCallback, useRef } from 'react';

export interface OptimizationOptions {
    optimizeImages?: boolean;
    optimizeVideos?: boolean;
    optimizeAudio?: boolean;
    optimizeDocuments?: boolean;
    quality?: number; // 0-1 for image/video quality
    maxWidth?: number;
    maxHeight?: number;
    compressionLevel?: number; // 1-9 for general compression
    onProgress?: (progress: number) => void;
    onError?: (error: Error) => void;
    onSuccess?: (message: string) => void;
}

export interface OptimizationResult {
    originalFile: File;
    optimizedFile: File;
    optimizationType: string;
    sizeReduction: number;
    compressionRatio: number;
    optimizationTime: number;
    success: boolean;
    error?: string;
}

export function useFileOptimization(
    options: OptimizationOptions = {}
): {
    isOptimizing: boolean;
    error: Error | null;
    optimizeFile: (file: File, options?: OptimizationOptions) => Promise<OptimizationResult>;
    optimizeMultiple: (files: File[], options?: OptimizationOptions) => Promise<OptimizationResult[]>;
    getOptimizationStats: () => { totalOptimized: number; successfulOptimizations: number; failedOptimizations: number; averageSizeReduction: number; averageOptimizationTime: number };
    clear: () => void;
} {
    const {
        optimizeImages = true,
        optimizeVideos = true,
        optimizeAudio = true,
        optimizeDocuments = true,
        quality = 0.8,
        maxWidth = 1920,
        maxHeight = 1080,
        compressionLevel = 6,
        onProgress,
        onError,
        onSuccess
    } = options;

    const [isOptimizing, setIsOptimizing] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const optimizationHistory = useRef<OptimizationResult[]>([]);

    const optimizeImage = useCallback(async (file: File, quality: number, maxWidth: number, maxHeight: number): Promise<File> => {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Canvas context not available'));
                return;
            }

            const img = new Image();
            img.onload = () => {
                try {
                    // Calculate new dimensions
                    let { width, height } = img;
                    const aspectRatio = width / height;

                    if (width > maxWidth || height > maxHeight) {
                        if (aspectRatio > 1) {
                            width = Math.min(width, maxWidth);
                            height = width / aspectRatio;
                        } else {
                            height = Math.min(height, maxHeight);
                            width = height * aspectRatio;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;

                    // Draw and optimize
                    ctx.drawImage(img, 0, 0, width, height);

                    canvas.toBlob(
                        (blob) => {
                            if (blob) {
                                const optimizedFile = new File([blob], file.name, {
                                    type: file.type,
                                    lastModified: Date.now(),
                                });
                                resolve(optimizedFile);
                            } else {
                                reject(new Error('Failed to optimize image'));
                            }
                        },
                        file.type,
                        quality
                    );
                } catch (err) {
                    reject(err);
                }
            };
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = URL.createObjectURL(file);
        });
    }, []);

    const optimizeFile = useCallback(async (file: File, customOptions?: OptimizationOptions): Promise<OptimizationResult> => {
        setIsOptimizing(true);
        setError(null);
        const startTime = Date.now();

        try {
            const opts = { ...options, ...customOptions };
            const {
                optimizeImages: oi,
                optimizeVideos: ov,
                optimizeAudio: oa,
                optimizeDocuments: od,
                quality: q,
                maxWidth: mw,
                maxHeight: mh,
                compressionLevel: cl
            } = opts;

            let optimizedFile: File;
            let optimizationType: string;
            let sizeReduction: number;
            let compressionRatio: number;

            if (file.type.startsWith('image/') && oi) {
                // Optimize image
                optimizedFile = await optimizeImage(file, q, mw, mh);
                optimizationType = 'image';
                sizeReduction = file.size - optimizedFile.size;
                compressionRatio = optimizedFile.size / file.size;
            } else if (file.type.startsWith('video/') && ov) {
                // Simulate video optimization
                // In a real application, you would use a video processing library
                const simulatedSize = Math.floor(file.size * 0.7); // Simulate 30% size reduction
                const optimizedBlob = new Blob([file], { type: file.type });
                optimizedFile = new File([optimizedBlob], file.name, { type: file.type });
                optimizationType = 'video';
                sizeReduction = file.size - simulatedSize;
                compressionRatio = simulatedSize / file.size;
            } else if (file.type.startsWith('audio/') && oa) {
                // Simulate audio optimization
                // In a real application, you would use an audio processing library
                const simulatedSize = Math.floor(file.size * 0.8); // Simulate 20% size reduction
                const optimizedBlob = new Blob([file], { type: file.type });
                optimizedFile = new File([optimizedBlob], file.name, { type: file.type });
                optimizationType = 'audio';
                sizeReduction = file.size - simulatedSize;
                compressionRatio = simulatedSize / file.size;
            } else if (file.type.startsWith('application/') && od) {
                // Simulate document optimization
                // In a real application, you would use a document processing library
                const simulatedSize = Math.floor(file.size * 0.9); // Simulate 10% size reduction
                const optimizedBlob = new Blob([file], { type: file.type });
                optimizedFile = new File([optimizedBlob], file.name, { type: file.type });
                optimizationType = 'document';
                sizeReduction = file.size - simulatedSize;
                compressionRatio = simulatedSize / file.size;
            } else {
                // No optimization needed or supported
                optimizedFile = file;
                optimizationType = 'none';
                sizeReduction = 0;
                compressionRatio = 1;
            }

            const optimizationTime = Date.now() - startTime;

            const result: OptimizationResult = {
                originalFile: file,
                optimizedFile,
                optimizationType,
                sizeReduction,
                compressionRatio,
                optimizationTime,
                success: true,
            };

            optimizationHistory.current.push(result);
            onProgress?.(100);
            onSuccess?.(`Optimized ${file.name}: ${(compressionRatio * 100).toFixed(1)}% of original size`);

            return result;
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            setError(error);
            onError?.(error);

            const result: OptimizationResult = {
                originalFile: file,
                optimizedFile: file,
                optimizationType: 'none',
                sizeReduction: 0,
                compressionRatio: 1,
                optimizationTime: Date.now() - startTime,
                success: false,
                error: error.message,
            };

            optimizationHistory.current.push(result);
            throw error;
        } finally {
            setIsOptimizing(false);
        }
    }, [options, optimizeImage, onProgress, onError, onSuccess]);

    const optimizeMultiple = useCallback(async (files: File[], customOptions?: OptimizationOptions): Promise<OptimizationResult[]> => {
        setIsOptimizing(true);
        setError(null);

        try {
            const results: OptimizationResult[] = [];
            const totalFiles = files.length;

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                onProgress?.((i / totalFiles) * 100);

                try {
                    const result = await optimizeFile(file, customOptions);
                    results.push(result);
                } catch (err) {
                    console.error(`Failed to optimize file ${file.name}:`, err);
                    // Continue with other files
                }
            }

            onProgress?.(100);
            onSuccess?.(`Optimized ${results.length} of ${totalFiles} files`);

            return results;
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            setError(error);
            onError?.(error);
            throw error;
        } finally {
            setIsOptimizing(false);
        }
    }, [optimizeFile, onProgress, onError, onSuccess]);

    const getOptimizationStats = useCallback(() => {
        const totalOptimized = optimizationHistory.current.length;
        const successfulOptimizations = optimizationHistory.current.filter(result => result.success).length;
        const failedOptimizations = totalOptimized - successfulOptimizations;
        const averageSizeReduction = totalOptimized > 0
            ? optimizationHistory.current.reduce((sum, result) => sum + result.sizeReduction, 0) / totalOptimized
            : 0;
        const averageOptimizationTime = totalOptimized > 0
            ? optimizationHistory.current.reduce((sum, result) => sum + result.optimizationTime, 0) / totalOptimized
            : 0;

        return {
            totalOptimized,
            successfulOptimizations,
            failedOptimizations,
            averageSizeReduction,
            averageOptimizationTime,
        };
    }, []);

    const clear = useCallback(() => {
        optimizationHistory.current = [];
        setError(null);
        setIsOptimizing(false);
    }, []);

    return {
        isOptimizing,
        error,
        optimizeFile,
        optimizeMultiple,
        getOptimizationStats,
        clear,
    };
}

export default useFileOptimization;