/**
 * Custom hook for file metadata functionality
 */

import { useState, useCallback, useRef } from 'react';

export interface FileMetadata {
    id: string;
    fileName: string;
    fileSize: number;
    fileType: string;
    lastModified: Date;
    created: Date;
    hash: string;
    dimensions?: { width: number; height: number };
    duration?: number; // for audio/video files
    bitrate?: number; // for audio/video files
    sampleRate?: number; // for audio files
    channels?: number; // for audio files
    fps?: number; // for video files
    codec?: string; // for audio/video files
    exif?: Record<string, any>; // for image files
    custom?: Record<string, any>; // custom metadata
}

export interface MetadataOptions {
    includeExif?: boolean;
    includeHash?: boolean;
    includeDimensions?: boolean;
    includeMediaInfo?: boolean;
    onProgress?: (progress: number) => void;
    onError?: (error: Error) => void;
    onSuccess?: (message: string) => void;
}

export function useFileMetadata(
    options: MetadataOptions = {}
): {
    isExtracting: boolean;
    error: Error | null;
    extractMetadata: (file: File, options?: MetadataOptions) => Promise<FileMetadata>;
    extractMultiple: (files: File[], options?: MetadataOptions) => Promise<FileMetadata[]>;
    getMetadataStats: () => { totalExtracted: number; averageFileSize: number; fileTypeDistribution: Record<string, number> };
    clear: () => void;
} {
    const {
        includeExif = true,
        includeHash = true,
        includeDimensions = true,
        includeMediaInfo = true,
        onProgress,
        onError,
        onSuccess
    } = options;

    const [isExtracting, setIsExtracting] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const metadataHistory = useRef<FileMetadata[]>([]);

    const generateFileHash = useCallback(async (file: File): Promise<string> => {
        const arrayBuffer = await file.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }, []);

    const extractImageMetadata = useCallback(async (file: File): Promise<Partial<FileMetadata>> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const metadata: Partial<FileMetadata> = {
                    dimensions: {
                        width: img.naturalWidth,
                        height: img.naturalHeight,
                    },
                };

                // Extract EXIF data if available
                if (includeExif) {
                    try {
                        // This is a simplified EXIF extraction
                        // In a real application, you'd use a library like exif-js
                        metadata.exif = {
                            width: img.naturalWidth,
                            height: img.naturalHeight,
                            // Add more EXIF data extraction here
                        };
                    } catch (err) {
                        console.warn('Failed to extract EXIF data:', err);
                    }
                }

                resolve(metadata);
            };
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = URL.createObjectURL(file);
        });
    }, [includeExif]);

    const extractVideoMetadata = useCallback(async (file: File): Promise<Partial<FileMetadata>> => {
        return new Promise((resolve, reject) => {
            const video = document.createElement('video');
            video.onloadedmetadata = () => {
                const metadata: Partial<FileMetadata> = {
                    dimensions: {
                        width: video.videoWidth,
                        height: video.videoHeight,
                    },
                    duration: video.duration,
                    // Add more video metadata extraction here
                };

                resolve(metadata);
            };
            video.onerror = () => reject(new Error('Failed to load video'));
            video.src = URL.createObjectURL(file);
        });
    }, []);

    const extractAudioMetadata = useCallback(async (file: File): Promise<Partial<FileMetadata>> => {
        return new Promise((resolve, reject) => {
            const audio = new Audio();
            audio.onloadedmetadata = () => {
                const metadata: Partial<FileMetadata> = {
                    duration: audio.duration,
                    // Add more audio metadata extraction here
                };

                resolve(metadata);
            };
            audio.onerror = () => reject(new Error('Failed to load audio'));
            audio.src = URL.createObjectURL(file);
        });
    }, []);

    const extractMetadata = useCallback(async (file: File, customOptions?: MetadataOptions): Promise<FileMetadata> => {
        setIsExtracting(true);
        setError(null);

        try {
            const opts = { ...options, ...customOptions };
            const { includeHash: ih, includeDimensions: id, includeMediaInfo: imi } = opts;

            const metadata: FileMetadata = {
                id: `metadata_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                fileName: file.name,
                fileSize: file.size,
                fileType: file.type,
                lastModified: new Date(file.lastModified),
                created: new Date(),
                hash: '',
                custom: {},
            };

            // Extract hash
            if (ih) {
                metadata.hash = await generateFileHash(file);
            }

            // Extract media-specific metadata
            if (imi) {
                if (file.type.startsWith('image/')) {
                    const imageMetadata = await extractImageMetadata(file);
                    Object.assign(metadata, imageMetadata);
                } else if (file.type.startsWith('video/')) {
                    const videoMetadata = await extractVideoMetadata(file);
                    Object.assign(metadata, videoMetadata);
                } else if (file.type.startsWith('audio/')) {
                    const audioMetadata = await extractAudioMetadata(file);
                    Object.assign(metadata, audioMetadata);
                }
            }

            // Extract basic file information
            metadata.custom = {
                name: file.name,
                size: file.size,
                type: file.type,
                lastModified: file.lastModified,
                webkitRelativePath: (file as any).webkitRelativePath || '',
            };

            metadataHistory.current.push(metadata);
            onProgress?.(100);
            onSuccess?.(`Metadata extracted: ${file.name}`);

            return metadata;
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            setError(error);
            onError?.(error);
            throw error;
        } finally {
            setIsExtracting(false);
        }
    }, [options, generateFileHash, extractImageMetadata, extractVideoMetadata, extractAudioMetadata, onProgress, onError, onSuccess]);

    const extractMultiple = useCallback(async (files: File[], customOptions?: MetadataOptions): Promise<FileMetadata[]> => {
        setIsExtracting(true);
        setError(null);

        try {
            const results: FileMetadata[] = [];
            const totalFiles = files.length;

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                onProgress?.((i / totalFiles) * 100);

                try {
                    const result = await extractMetadata(file, customOptions);
                    results.push(result);
                } catch (err) {
                    console.error(`Failed to extract metadata from file ${file.name}:`, err);
                    // Continue with other files
                }
            }

            onProgress?.(100);
            onSuccess?.(`Metadata extracted from ${results.length} of ${totalFiles} files`);

            return results;
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            setError(error);
            onError?.(error);
            throw error;
        } finally {
            setIsExtracting(false);
        }
    }, [extractMetadata, onProgress, onError, onSuccess]);

    const getMetadataStats = useCallback(() => {
        const totalExtracted = metadataHistory.current.length;
        const averageFileSize = totalExtracted > 0
            ? metadataHistory.current.reduce((sum, metadata) => sum + metadata.fileSize, 0) / totalExtracted
            : 0;

        const fileTypeDistribution: Record<string, number> = {};
        metadataHistory.current.forEach(metadata => {
            const type = metadata.fileType.split('/')[0];
            fileTypeDistribution[type] = (fileTypeDistribution[type] || 0) + 1;
        });

        return {
            totalExtracted,
            averageFileSize,
            fileTypeDistribution,
        };
    }, []);

    const clear = useCallback(() => {
        metadataHistory.current = [];
        setError(null);
        setIsExtracting(false);
    }, []);

    return {
        isExtracting,
        error,
        extractMetadata,
        extractMultiple,
        getMetadataStats,
        clear,
    };
}

export default useFileMetadata;