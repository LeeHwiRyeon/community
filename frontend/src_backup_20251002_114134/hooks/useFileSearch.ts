/**
 * Custom hook for file search functionality
 */

import { useState, useCallback, useRef } from 'react';

export interface SearchOptions {
    caseSensitive?: boolean;
    wholeWord?: boolean;
    regex?: boolean;
    includeContent?: boolean;
    includeMetadata?: boolean;
    fileTypes?: string[];
    minSize?: number;
    maxSize?: number;
    dateRange?: { start: Date; end: Date };
    onProgress?: (progress: number) => void;
    onError?: (error: Error) => void;
    onSuccess?: (message: string) => void;
}

export interface SearchResult {
    file: File;
    matches: {
        field: string;
        value: string;
        position: number;
        context: string;
    }[];
    score: number;
    relevance: number;
}

export function useFileSearch(
    options: SearchOptions = {}
): {
    isSearching: boolean;
    error: Error | null;
    searchFiles: (files: File[], query: string, options?: SearchOptions) => Promise<SearchResult[]>;
    searchInFile: (file: File, query: string, options?: SearchOptions) => Promise<SearchResult | null>;
    getSearchStats: () => { totalSearched: number; totalMatches: number; averageScore: number; queryHistory: string[] };
    clear: () => void;
} {
    const {
        caseSensitive = false,
        wholeWord = false,
        regex = false,
        includeContent = true,
        includeMetadata = true,
        fileTypes = [],
        minSize = 0,
        maxSize = Infinity,
        dateRange,
        onProgress,
        onError,
        onSuccess
    } = options;

    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const searchHistory = useRef<{ query: string; results: SearchResult[]; timestamp: Date }[]>([]);

    const createSearchPattern = useCallback((query: string): RegExp => {
        let pattern = query;

        if (!caseSensitive) {
            pattern = pattern.toLowerCase();
        }

        if (wholeWord) {
            pattern = `\\b${pattern}\\b`;
        }

        if (!regex) {
            pattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        }

        const flags = caseSensitive ? 'g' : 'gi';
        return new RegExp(pattern, flags);
    }, [caseSensitive, wholeWord, regex]);

    const searchInText = useCallback((text: string, pattern: RegExp, field: string): SearchResult['matches'] => {
        const matches: SearchResult['matches'] = [];
        let match;

        while ((match = pattern.exec(text)) !== null) {
            const start = Math.max(0, match.index - 50);
            const end = Math.min(text.length, match.index + match[0].length + 50);
            const context = text.substring(start, end);

            matches.push({
                field,
                value: match[0],
                position: match.index,
                context,
            });
        }

        return matches;
    }, []);

    const searchInFile = useCallback(async (file: File, query: string, customOptions?: SearchOptions): Promise<SearchResult | null> => {
        try {
            const opts = { ...options, ...customOptions };
            const { includeContent: ic, includeMetadata: im, fileTypes: ft, minSize: min, maxSize: max, dateRange: dr } = opts;

            // Check file type filter
            if (ft.length > 0 && !ft.includes(file.type)) {
                return null;
            }

            // Check file size filter
            if (file.size < min || file.size > max) {
                return null;
            }

            // Check date range filter
            if (dr && (file.lastModified < dr.start.getTime() || file.lastModified > dr.end.getTime())) {
                return null;
            }

            const pattern = createSearchPattern(query);
            const matches: SearchResult['matches'] = [];
            let score = 0;

            // Search in file name
            const nameMatches = searchInText(file.name, pattern, 'fileName');
            matches.push(...nameMatches);
            score += nameMatches.length * 10;

            // Search in file type
            const typeMatches = searchInText(file.type, pattern, 'fileType');
            matches.push(...typeMatches);
            score += typeMatches.length * 5;

            // Search in file content if enabled
            if (ic && file.type.startsWith('text/')) {
                try {
                    const content = await file.text();
                    const contentMatches = searchInText(content, pattern, 'content');
                    matches.push(...contentMatches);
                    score += contentMatches.length * 3;
                } catch (err) {
                    console.warn(`Failed to read file content for ${file.name}:`, err);
                }
            }

            // Search in metadata if enabled
            if (im) {
                const metadata = {
                    size: file.size.toString(),
                    lastModified: new Date(file.lastModified).toISOString(),
                    webkitRelativePath: (file as any).webkitRelativePath || '',
                };

                Object.entries(metadata).forEach(([key, value]) => {
                    const metadataMatches = searchInText(value, pattern, `metadata.${key}`);
                    matches.push(...metadataMatches);
                    score += metadataMatches.length * 2;
                });
            }

            if (matches.length === 0) {
                return null;
            }

            const relevance = Math.min(100, score);

            return {
                file,
                matches,
                score,
                relevance,
            };
        } catch (err) {
            console.error(`Error searching in file ${file.name}:`, err);
            return null;
        }
    }, [options, createSearchPattern, searchInText]);

    const searchFiles = useCallback(async (files: File[], query: string, customOptions?: SearchOptions): Promise<SearchResult[]> => {
        setIsSearching(true);
        setError(null);

        try {
            const results: SearchResult[] = [];
            const totalFiles = files.length;

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                onProgress?.((i / totalFiles) * 100);

                try {
                    const result = await searchInFile(file, query, customOptions);
                    if (result) {
                        results.push(result);
                    }
                } catch (err) {
                    console.error(`Failed to search in file ${file.name}:`, err);
                    // Continue with other files
                }
            }

            // Sort results by relevance
            results.sort((a, b) => b.relevance - a.relevance);

            searchHistory.current.push({
                query,
                results,
                timestamp: new Date(),
            });

            onProgress?.(100);
            onSuccess?.(`Found ${results.length} matches in ${files.length} files`);

            return results;
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            setError(error);
            onError?.(error);
            throw error;
        } finally {
            setIsSearching(false);
        }
    }, [searchInFile, onProgress, onError, onSuccess]);

    const getSearchStats = useCallback(() => {
        const totalSearched = searchHistory.current.reduce((sum, entry) => sum + entry.results.length, 0);
        const totalMatches = searchHistory.current.reduce((sum, entry) => sum + entry.results.length, 0);
        const averageScore = totalMatches > 0
            ? searchHistory.current.reduce((sum, entry) =>
                sum + entry.results.reduce((entrySum, result) => entrySum + result.score, 0), 0
            ) / totalMatches
            : 0;
        const queryHistory = searchHistory.current.map(entry => entry.query);

        return {
            totalSearched,
            totalMatches,
            averageScore,
            queryHistory,
        };
    }, []);

    const clear = useCallback(() => {
        searchHistory.current = [];
        setError(null);
        setIsSearching(false);
    }, []);

    return {
        isSearching,
        error,
        searchFiles,
        searchInFile,
        getSearchStats,
        clear,
    };
}

export default useFileSearch;