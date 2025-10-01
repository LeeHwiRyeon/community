/**
 * Custom hook for file validation functionality
 */

import { useState, useCallback, useRef } from 'react';

export interface ValidationRule {
    name: string;
    test: (file: File) => boolean | Promise<boolean>;
    message: string;
    severity: 'error' | 'warning' | 'info';
}

export interface ValidationOptions {
    maxFileSize?: number; // in bytes
    allowedTypes?: string[];
    allowedExtensions?: string[];
    maxFileNameLength?: number;
    customRules?: ValidationRule[];
    onError?: (error: Error) => void;
    onSuccess?: (message: string) => void;
}

export interface ValidationResult {
    file: File;
    isValid: boolean;
    errors: string[];
    warnings: string[];
    info: string[];
    score: number; // 0-100
    passedRules: string[];
    failedRules: string[];
}

export function useFileValidation(
    options: ValidationOptions = {}
): {
    isValidating: boolean;
    error: Error | null;
    validateFile: (file: File, options?: ValidationOptions) => Promise<ValidationResult>;
    validateMultiple: (files: File[], options?: ValidationOptions) => Promise<ValidationResult[]>;
    getValidationStats: () => { totalValidated: number; totalValid: number; totalInvalid: number; averageScore: number };
    clear: () => void;
} {
    const {
        maxFileSize = 10 * 1024 * 1024, // 10MB default
        allowedTypes = [],
        allowedExtensions = [],
        maxFileNameLength = 255,
        customRules = [],
        onError,
        onSuccess
    } = options;

    const [isValidating, setIsValidating] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const validationHistory = useRef<ValidationResult[]>([]);

    const getDefaultRules = useCallback((): ValidationRule[] => {
        return [
            {
                name: 'fileSize',
                test: (file: File) => file.size <= maxFileSize,
                message: `File size must be less than ${(maxFileSize / 1024 / 1024).toFixed(1)}MB`,
                severity: 'error',
            },
            {
                name: 'fileNameLength',
                test: (file: File) => file.name.length <= maxFileNameLength,
                message: `File name must be less than ${maxFileNameLength} characters`,
                severity: 'error',
            },
            {
                name: 'fileType',
                test: (file: File) => allowedTypes.length === 0 || allowedTypes.includes(file.type),
                message: `File type must be one of: ${allowedTypes.join(', ')}`,
                severity: 'error',
            },
            {
                name: 'fileExtension',
                test: (file: File) => {
                    if (allowedExtensions.length === 0) return true;
                    const extension = file.name.split('.').pop()?.toLowerCase();
                    return extension ? allowedExtensions.includes(extension) : false;
                },
                message: `File extension must be one of: ${allowedExtensions.join(', ')}`,
                severity: 'error',
            },
            {
                name: 'fileNameCharacters',
                test: (file: File) => /^[a-zA-Z0-9._-]+$/.test(file.name),
                message: 'File name contains invalid characters',
                severity: 'warning',
            },
            {
                name: 'fileNotEmpty',
                test: (file: File) => file.size > 0,
                message: 'File is empty',
                severity: 'error',
            },
        ];
    }, [maxFileSize, maxFileNameLength, allowedTypes, allowedExtensions]);

    const validateFile = useCallback(async (file: File, customOptions?: ValidationOptions): Promise<ValidationResult> => {
        setIsValidating(true);
        setError(null);

        try {
            const opts = { ...options, ...customOptions };
            const rules = [...getDefaultRules(), ...(opts.customRules || [])];

            const errors: string[] = [];
            const warnings: string[] = [];
            const info: string[] = [];
            const passedRules: string[] = [];
            const failedRules: string[] = [];

            let score = 100;

            for (const rule of rules) {
                try {
                    const isValid = await rule.test(file);

                    if (isValid) {
                        passedRules.push(rule.name);
                    } else {
                        failedRules.push(rule.name);

                        switch (rule.severity) {
                            case 'error':
                                errors.push(rule.message);
                                score -= 20;
                                break;
                            case 'warning':
                                warnings.push(rule.message);
                                score -= 10;
                                break;
                            case 'info':
                                info.push(rule.message);
                                score -= 5;
                                break;
                        }
                    }
                } catch (err) {
                    console.error(`Error validating rule ${rule.name}:`, err);
                    failedRules.push(rule.name);
                    errors.push(`Validation error for ${rule.name}`);
                    score -= 15;
                }
            }

            const result: ValidationResult = {
                file,
                isValid: errors.length === 0,
                errors,
                warnings,
                info,
                score: Math.max(0, score),
                passedRules,
                failedRules,
            };

            validationHistory.current.push(result);
            onSuccess?.(`File validation completed: ${result.isValid ? 'Valid' : 'Invalid'}`);

            return result;
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            setError(error);
            onError?.(error);
            throw error;
        } finally {
            setIsValidating(false);
        }
    }, [options, getDefaultRules, onError, onSuccess]);

    const validateMultiple = useCallback(async (files: File[], customOptions?: ValidationOptions): Promise<ValidationResult[]> => {
        setIsValidating(true);
        setError(null);

        try {
            const results: ValidationResult[] = [];
            const totalFiles = files.length;

            for (let i = 0; i < files.length; i++) {
                const file = files[i];

                try {
                    const result = await validateFile(file, customOptions);
                    results.push(result);
                } catch (err) {
                    console.error(`Failed to validate file ${file.name}:`, err);
                    // Continue with other files
                }
            }

            onSuccess?.(`Validated ${results.length} of ${totalFiles} files`);

            return results;
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            setError(error);
            onError?.(error);
            throw error;
        } finally {
            setIsValidating(false);
        }
    }, [validateFile, onError, onSuccess]);

    const getValidationStats = useCallback(() => {
        const totalValidated = validationHistory.current.length;
        const totalValid = validationHistory.current.filter(result => result.isValid).length;
        const totalInvalid = totalValidated - totalValid;
        const averageScore = totalValidated > 0
            ? validationHistory.current.reduce((sum, result) => sum + result.score, 0) / totalValidated
            : 0;

        return {
            totalValidated,
            totalValid,
            totalInvalid,
            averageScore,
        };
    }, []);

    const clear = useCallback(() => {
        validationHistory.current = [];
        setError(null);
        setIsValidating(false);
    }, []);

    return {
        isValidating,
        error,
        validateFile,
        validateMultiple,
        getValidationStats,
        clear,
    };
}

export default useFileValidation;