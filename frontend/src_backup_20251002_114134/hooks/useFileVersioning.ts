/**
 * Custom hook for file versioning functionality
 */

import { useState, useCallback, useRef } from 'react';

export interface FileVersion {
    id: string;
    fileId: string;
    fileName: string;
    version: string;
    fileSize: number;
    fileType: string;
    fileHash: string;
    isCurrent: boolean;
    isAutomatic: boolean;
    createdAt: Date;
    createdBy: string;
    description?: string;
    tags?: string[];
    metadata?: Record<string, any>;
}

export interface VersioningOptions {
    maxVersions?: number;
    autoVersioning?: boolean;
    versioningInterval?: number;
    onError?: (error: Error) => void;
    onSuccess?: (message: string) => void;
    onVersionCreated?: (version: FileVersion) => void;
    onVersionRestored?: (version: FileVersion) => void;
}

export function useFileVersioning(
    options: VersioningOptions = {}
): {
    versions: FileVersion[];
    isVersioning: boolean;
    error: Error | null;
    createVersion: (file: File, description?: string, tags?: string[]) => Promise<FileVersion>;
    restoreVersion: (versionId: string) => Promise<File>;
    deleteVersion: (versionId: string) => void;
    getFileVersions: (fileId: string) => FileVersion[];
    getCurrentVersion: (fileId: string) => FileVersion | null;
    getVersionHistory: (fileId: string) => FileVersion[];
    compareVersions: (versionId1: string, versionId2: string) => { differences: string[]; similarity: number };
    getVersionStats: () => { totalVersions: number; totalSpaceUsed: number; averageVersionsPerFile: number; oldestVersion: Date | null; newestVersion: Date | null };
    exportVersions: (format: 'json' | 'csv') => string;
    importVersions: (data: string, format: 'json' | 'csv') => void;
    clear: () => void;
} {
    const {
        maxVersions = 50,
        autoVersioning = false,
        versioningInterval = 300000,
        onError,
        onSuccess,
        onVersionCreated,
        onVersionRestored
    } = options;

    const [versions, setVersions] = useState<FileVersion[]>([]);
    const [isVersioning, setIsVersioning] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const idCounter = useRef(0);

    const generateFileHash = useCallback(async (file: File): Promise<string> => {
        const buffer = await file.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }, []);

    const generateVersionNumber = useCallback((fileId: string): string => {
        const fileVersions = versions.filter(v => v.fileId === fileId);
        const versionNumbers = fileVersions.map(v => {
            const parts = v.version.split('.');
            return parts.map(part => parseInt(part) || 0);
        });

        if (versionNumbers.length === 0) {
            return '1.0.0';
        }

        // Find the highest version number
        const maxVersion = versionNumbers.reduce((max, current) => {
            for (let i = 0; i < Math.max(max.length, current.length); i++) {
                const maxPart = max[i] || 0;
                const currentPart = current[i] || 0;
                if (currentPart > maxPart) return current;
                if (currentPart < maxPart) return max;
            }
            return max;
        });

        // Increment the patch version
        const newVersion = [...maxVersion];
        newVersion[2] = (newVersion[2] || 0) + 1;

        return newVersion.join('.');
    }, [versions]);

    const createVersion = useCallback(async (file: File, description?: string, tags?: string[]): Promise<FileVersion> => {
        setIsVersioning(true);
        setError(null);

        try {
            const fileHash = await generateFileHash(file);
            const versionNumber = generateVersionNumber(file.name);

            // Check if version already exists
            const existingVersion = versions.find(v =>
                v.fileId === file.name &&
                v.fileHash === fileHash
            );

            if (existingVersion) {
                onSuccess?.(`Version already exists for ${file.name}`);
                return existingVersion;
            }

            // Mark all existing versions as not current
            setVersions(prev => prev.map(v =>
                v.fileId === file.name ? { ...v, isCurrent: false } : v
            ));

            const version: FileVersion = {
                id: `version_${++idCounter.current}`,
                fileId: file.name,
                fileName: file.name,
                version: versionNumber,
                fileSize: file.size,
                fileType: file.type,
                fileHash,
                isCurrent: true,
                isAutomatic: false,
                createdAt: new Date(),
                createdBy: 'user', // In a real app, this would be the actual user
                description,
                tags,
                metadata: {
                    originalLastModified: file.lastModified,
                    originalSize: file.size,
                    originalType: file.type,
                },
            };

            setVersions(prev => {
                const newVersions = [version, ...prev];
                // Keep only the latest versions for each file
                const fileVersions = new Map<string, FileVersion[]>();
                newVersions.forEach(v => {
                    if (!fileVersions.has(v.fileId)) {
                        fileVersions.set(v.fileId, []);
                    }
                    fileVersions.get(v.fileId)!.push(v);
                });

                const filteredVersions: FileVersion[] = [];
                fileVersions.forEach(fileVersionList => {
                    const sortedVersions = fileVersionList.sort((a, b) =>
                        b.createdAt.getTime() - a.createdAt.getTime()
                    );
                    filteredVersions.push(...sortedVersions.slice(0, maxVersions));
                });

                return filteredVersions;
            });

            onSuccess?.(`Created version ${versionNumber} for ${file.name}`);
            onVersionCreated?.(version);
            return version;
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            setError(error);
            onError?.(error);
            throw error;
        } finally {
            setIsVersioning(false);
        }
    }, [versions, maxVersions, generateFileHash, generateVersionNumber, onError, onSuccess, onVersionCreated]);

    const restoreVersion = useCallback(async (versionId: string): Promise<File> => {
        setIsVersioning(true);
        setError(null);

        try {
            const version = versions.find(v => v.id === versionId);
            if (!version) {
                throw new Error('Version not found');
            }

            // Mark all versions of this file as not current
            setVersions(prev => prev.map(v =>
                v.fileId === version.fileId ? { ...v, isCurrent: false } : v
            ));

            // Mark the restored version as current
            setVersions(prev => prev.map(v =>
                v.id === versionId ? { ...v, isCurrent: true } : v
            ));

            // In a real application, you would restore the file from the version
            // This is a simplified implementation
            const restoredFile = new File([], version.fileName, {
                type: version.fileType,
                lastModified: Date.now(),
            });

            onSuccess?.(`Restored version ${version.version} of ${version.fileName}`);
            onVersionRestored?.(version);
            return restoredFile;
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            setError(error);
            onError?.(error);
            throw error;
        } finally {
            setIsVersioning(false);
        }
    }, [versions, onError, onSuccess, onVersionRestored]);

    const deleteVersion = useCallback((versionId: string) => {
        try {
            setVersions(prev => prev.filter(v => v.id !== versionId));
            onSuccess?.(`Deleted version ${versionId}`);
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            setError(error);
            onError?.(error);
        }
    }, [onError, onSuccess]);

    const getFileVersions = useCallback((fileId: string): FileVersion[] => {
        return versions.filter(v => v.fileId === fileId);
    }, [versions]);

    const getCurrentVersion = useCallback((fileId: string): FileVersion | null => {
        return versions.find(v => v.fileId === fileId && v.isCurrent) || null;
    }, [versions]);

    const getVersionHistory = useCallback((fileId: string): FileVersion[] => {
        return versions
            .filter(v => v.fileId === fileId)
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }, [versions]);

    const compareVersions = useCallback((versionId1: string, versionId2: string) => {
        const version1 = versions.find(v => v.id === versionId1);
        const version2 = versions.find(v => v.id === versionId2);

        if (!version1 || !version2) {
            return { differences: [], similarity: 0 };
        }

        const differences: string[] = [];
        let similarity = 100;

        if (version1.fileSize !== version2.fileSize) {
            differences.push(`File size: ${version1.fileSize} vs ${version2.fileSize}`);
            similarity -= 20;
        }

        if (version1.fileType !== version2.fileType) {
            differences.push(`File type: ${version1.fileType} vs ${version2.fileType}`);
            similarity -= 30;
        }

        if (version1.fileHash !== version2.fileHash) {
            differences.push('File content has changed');
            similarity -= 50;
        }

        if (version1.description !== version2.description) {
            differences.push('Description has changed');
            similarity -= 5;
        }

        if (JSON.stringify(version1.tags) !== JSON.stringify(version2.tags)) {
            differences.push('Tags have changed');
            similarity -= 5;
        }

        return { differences, similarity: Math.max(0, similarity) };
    }, [versions]);

    const getVersionStats = useCallback(() => {
        const totalVersions = versions.length;
        const totalSpaceUsed = versions.reduce((sum, version) => sum + version.fileSize, 0);
        const fileVersionCounts = new Map<string, number>();
        versions.forEach(version => {
            fileVersionCounts.set(version.fileId, (fileVersionCounts.get(version.fileId) || 0) + 1);
        });
        const averageVersionsPerFile = fileVersionCounts.size > 0
            ? Array.from(fileVersionCounts.values()).reduce((sum, count) => sum + count, 0) / fileVersionCounts.size
            : 0;
        const oldestVersion = versions.length > 0
            ? new Date(Math.min(...versions.map(v => v.createdAt.getTime())))
            : null;
        const newestVersion = versions.length > 0
            ? new Date(Math.max(...versions.map(v => v.createdAt.getTime())))
            : null;

        return {
            totalVersions,
            totalSpaceUsed,
            averageVersionsPerFile,
            oldestVersion,
            newestVersion,
        };
    }, [versions]);

    const exportVersions = useCallback((format: 'json' | 'csv'): string => {
        try {
            if (format === 'json') {
                return JSON.stringify(versions, null, 2);
            } else {
                const headers = ['id', 'fileId', 'fileName', 'version', 'fileSize', 'fileType', 'fileHash', 'isCurrent', 'isAutomatic', 'createdAt', 'createdBy', 'description', 'tags'];
                const csvContent = [
                    headers.join(','),
                    ...versions.map(version => [
                        version.id,
                        version.fileId,
                        version.fileName,
                        version.version,
                        version.fileSize,
                        version.fileType,
                        version.fileHash,
                        version.isCurrent,
                        version.isAutomatic,
                        version.createdAt.toISOString(),
                        version.createdBy,
                        version.description || '',
                        version.tags?.join(';') || '',
                    ].join(','))
                ].join('\n');
                return csvContent;
            }
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            setError(error);
            onError?.(error);
            return '';
        }
    }, [versions, onError]);

    const importVersions = useCallback((data: string, format: 'json' | 'csv') => {
        try {
            let importedVersions: FileVersion[] = [];

            if (format === 'json') {
                importedVersions = JSON.parse(data);
            } else {
                const lines = data.split('\n');
                const headers = lines[0].split(',');
                importedVersions = lines.slice(1).map(line => {
                    const values = line.split(',');
                    const version: any = {};
                    headers.forEach((header, index) => {
                        version[header] = values[index];
                    });
                    return {
                        ...version,
                        createdAt: new Date(version.createdAt),
                        isCurrent: version.isCurrent === 'true',
                        isAutomatic: version.isAutomatic === 'true',
                        tags: version.tags ? version.tags.split(';') : [],
                    };
                });
            }

            setVersions(prev => [...importedVersions, ...prev]);
            onSuccess?.(`Imported ${importedVersions.length} versions`);
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            setError(error);
            onError?.(error);
        }
    }, [onError, onSuccess]);

    const clear = useCallback(() => {
        setVersions([]);
        setError(null);
        setIsVersioning(false);
    }, []);

    return {
        versions,
        isVersioning,
        error,
        createVersion,
        restoreVersion,
        deleteVersion,
        getFileVersions,
        getCurrentVersion,
        getVersionHistory,
        compareVersions,
        getVersionStats,
        exportVersions,
        importVersions,
        clear,
    };
}

export default useFileVersioning;
