/**
 * Custom hook for file collaboration functionality
 */

import { useState, useCallback, useRef } from 'react';

export interface CollaborationOptions {
    allowComments?: boolean;
    allowAnnotations?: boolean;
    allowVersioning?: boolean;
    allowRealTimeSync?: boolean;
    onProgress?: (progress: number) => void;
    onError?: (error: Error) => void;
    onSuccess?: (message: string) => void;
}

export interface CollaborationResult {
    file: File;
    collaborators: string[];
    comments: Comment[];
    annotations: Annotation[];
    versions: FileVersion[];
    lastActivity: Date;
    success: boolean;
    error?: string;
}

export interface Comment {
    id: string;
    text: string;
    author: string;
    timestamp: Date;
    position?: { x: number; y: number };
    resolved: boolean;
}

export interface Annotation {
    id: string;
    type: 'highlight' | 'note' | 'arrow' | 'rectangle' | 'circle';
    content: string;
    author: string;
    timestamp: Date;
    position: { x: number; y: number; width: number; height: number };
    color: string;
}

export interface FileVersion {
    id: string;
    version: string;
    file: File;
    author: string;
    timestamp: Date;
    changes: string[];
}

export function useFileCollaboration(
    options: CollaborationOptions = {}
): {
    isCollaborating: boolean;
    error: Error | null;
    startCollaboration: (file: File, options?: CollaborationOptions) => Promise<CollaborationResult>;
    addComment: (file: File, comment: Omit<Comment, 'id' | 'timestamp'>) => Promise<Comment>;
    addAnnotation: (file: File, annotation: Omit<Annotation, 'id' | 'timestamp'>) => Promise<Annotation>;
    createVersion: (file: File, changes: string[]) => Promise<FileVersion>;
    getCollaborationInfo: (file: File) => CollaborationResult | null;
    getCollaborationStats: () => { totalCollaborations: number; activeCollaborations: number; totalComments: number; totalAnnotations: number; totalVersions: number };
    clear: () => void;
} {
    const {
        allowComments = true,
        allowAnnotations = true,
        allowVersioning = true,
        allowRealTimeSync = false,
        onProgress,
        onError,
        onSuccess
    } = options;

    const [isCollaborating, setIsCollaborating] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const collaborationHistory = useRef<CollaborationResult[]>([]);

    const generateId = useCallback((): string => {
        return `collab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }, []);

    const startCollaboration = useCallback(async (file: File, customOptions?: CollaborationOptions): Promise<CollaborationResult> => {
        setIsCollaborating(true);
        setError(null);

        try {
            const opts = { ...options, ...customOptions };

            // Check if collaboration already exists for this file
            const existingCollaboration = collaborationHistory.current.find(collab => collab.file.name === file.name);
            if (existingCollaboration) {
                onSuccess?.(`Collaboration already exists for ${file.name}`);
                return existingCollaboration;
            }

            const collaboration: CollaborationResult = {
                file,
                collaborators: ['user'], // In a real app, this would be the actual user
                comments: [],
                annotations: [],
                versions: [],
                lastActivity: new Date(),
                success: true,
            };

            collaborationHistory.current.push(collaboration);
            onProgress?.(100);
            onSuccess?.(`Started collaboration for ${file.name}`);

            return collaboration;
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            setError(error);
            onError?.(error);

            const collaboration: CollaborationResult = {
                file,
                collaborators: [],
                comments: [],
                annotations: [],
                versions: [],
                lastActivity: new Date(),
                success: false,
                error: error.message,
            };

            collaborationHistory.current.push(collaboration);
            throw error;
        } finally {
            setIsCollaborating(false);
        }
    }, [options, onError, onSuccess]);

    const addComment = useCallback(async (file: File, comment: Omit<Comment, 'id' | 'timestamp'>): Promise<Comment> => {
        try {
            const collaboration = collaborationHistory.current.find(collab => collab.file.name === file.name);
            if (!collaboration) {
                throw new Error('Collaboration not found for this file');
            }

            const newComment: Comment = {
                ...comment,
                id: generateId(),
                timestamp: new Date(),
            };

            collaboration.comments.push(newComment);
            collaboration.lastActivity = new Date();

            onSuccess?.(`Added comment to ${file.name}`);
            return newComment;
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            setError(error);
            onError?.(error);
            throw error;
        }
    }, [generateId, onError, onSuccess]);

    const addAnnotation = useCallback(async (file: File, annotation: Omit<Annotation, 'id' | 'timestamp'>): Promise<Annotation> => {
        try {
            const collaboration = collaborationHistory.current.find(collab => collab.file.name === file.name);
            if (!collaboration) {
                throw new Error('Collaboration not found for this file');
            }

            const newAnnotation: Annotation = {
                ...annotation,
                id: generateId(),
                timestamp: new Date(),
            };

            collaboration.annotations.push(newAnnotation);
            collaboration.lastActivity = new Date();

            onSuccess?.(`Added annotation to ${file.name}`);
            return newAnnotation;
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            setError(error);
            onError?.(error);
            throw error;
        }
    }, [generateId, onError, onSuccess]);

    const createVersion = useCallback(async (file: File, changes: string[]): Promise<FileVersion> => {
        try {
            const collaboration = collaborationHistory.current.find(collab => collab.file.name === file.name);
            if (!collaboration) {
                throw new Error('Collaboration not found for this file');
            }

            const versionNumber = `v${collaboration.versions.length + 1}`;
            const newVersion: FileVersion = {
                id: generateId(),
                version: versionNumber,
                file,
                author: 'user', // In a real app, this would be the actual user
                timestamp: new Date(),
                changes,
            };

            collaboration.versions.push(newVersion);
            collaboration.lastActivity = new Date();

            onSuccess?.(`Created version ${versionNumber} for ${file.name}`);
            return newVersion;
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            setError(error);
            onError?.(error);
            throw error;
        }
    }, [generateId, onError, onSuccess]);

    const getCollaborationInfo = useCallback((file: File): CollaborationResult | null => {
        return collaborationHistory.current.find(collab => collab.file.name === file.name) || null;
    }, []);

    const getCollaborationStats = useCallback(() => {
        const totalCollaborations = collaborationHistory.current.length;
        const activeCollaborations = collaborationHistory.current.filter(collab =>
            collab.success && new Date().getTime() - collab.lastActivity.getTime() < 24 * 60 * 60 * 1000 // Active in last 24 hours
        ).length;
        const totalComments = collaborationHistory.current.reduce((sum, collab) => sum + collab.comments.length, 0);
        const totalAnnotations = collaborationHistory.current.reduce((sum, collab) => sum + collab.annotations.length, 0);
        const totalVersions = collaborationHistory.current.reduce((sum, collab) => sum + collab.versions.length, 0);

        return {
            totalCollaborations,
            activeCollaborations,
            totalComments,
            totalAnnotations,
            totalVersions,
        };
    }, []);

    const clear = useCallback(() => {
        collaborationHistory.current = [];
        setError(null);
        setIsCollaborating(false);
    }, []);

    return {
        isCollaborating,
        error,
        startCollaboration,
        addComment,
        addAnnotation,
        createVersion,
        getCollaborationInfo,
        getCollaborationStats,
        clear,
    };
}

export default useFileCollaboration;