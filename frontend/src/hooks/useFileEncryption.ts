/**
 * Custom hook for file encryption functionality
 */

import { useState, useCallback, useRef } from 'react';

export interface EncryptionOptions {
    algorithm?: 'AES-GCM' | 'AES-CBC' | 'AES-CTR';
    keyLength?: 128 | 192 | 256;
    ivLength?: number;
    onProgress?: (progress: number) => void;
    onError?: (error: Error) => void;
    onSuccess?: (message: string) => void;
}

export interface EncryptionResult {
    originalFile: File;
    encryptedFile: File;
    key: CryptoKey;
    iv: Uint8Array;
    algorithm: string;
    encryptionTime: number;
    fileSize: number;
}

export interface DecryptionResult {
    encryptedFile: File;
    decryptedFile: File;
    decryptionTime: number;
    success: boolean;
}

export function useFileEncryption(
    options: EncryptionOptions = {}
): {
    isEncrypting: boolean;
    isDecrypting: boolean;
    error: Error | null;
    encryptFile: (file: File, password?: string, options?: EncryptionOptions) => Promise<EncryptionResult>;
    decryptFile: (encryptedFile: File, key: CryptoKey, iv: Uint8Array, options?: EncryptionOptions) => Promise<DecryptionResult>;
    generateKey: (options?: EncryptionOptions) => Promise<CryptoKey>;
    deriveKeyFromPassword: (password: string, salt: Uint8Array, options?: EncryptionOptions) => Promise<CryptoKey>;
    encryptMultiple: (files: File[], password?: string, options?: EncryptionOptions) => Promise<EncryptionResult[]>;
    getEncryptionStats: () => { totalEncrypted: number; totalDecrypted: number; averageEncryptionTime: number; averageDecryptionTime: number };
    clear: () => void;
} {
    const {
        algorithm = 'AES-GCM',
        keyLength = 256,
        ivLength = 12,
        onProgress,
        onError,
        onSuccess
    } = options;

    const [isEncrypting, setIsEncrypting] = useState(false);
    const [isDecrypting, setIsDecrypting] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const encryptionHistory = useRef<{ encrypted: EncryptionResult[]; decrypted: DecryptionResult[] }>({
        encrypted: [],
        decrypted: [],
    });

    const generateKey = useCallback(async (customOptions?: EncryptionOptions): Promise<CryptoKey> => {
        try {
            const opts = { ...options, ...customOptions };
            const { algorithm: alg, keyLength: kl } = opts;

            const key = await crypto.subtle.generateKey(
                {
                    name: alg,
                    length: kl,
                },
                true,
                ['encrypt', 'decrypt']
            );

            return key;
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            setError(error);
            onError?.(error);
            throw error;
        }
    }, [options, onError]);

    const deriveKeyFromPassword = useCallback(async (password: string, salt: Uint8Array, customOptions?: EncryptionOptions): Promise<CryptoKey> => {
        try {
            const opts = { ...options, ...customOptions };
            const { keyLength: kl } = opts;

            const keyMaterial = await crypto.subtle.importKey(
                'raw',
                new TextEncoder().encode(password),
                'PBKDF2',
                false,
                ['deriveBits', 'deriveKey']
            );

            const key = await crypto.subtle.deriveKey(
                {
                    name: 'PBKDF2',
                    salt: salt,
                    iterations: 100000,
                    hash: 'SHA-256',
                },
                keyMaterial,
                { name: 'AES-GCM', length: kl },
                false,
                ['encrypt', 'decrypt']
            );

            return key;
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            setError(error);
            onError?.(error);
            throw error;
        }
    }, [options, onError]);

    const encryptFile = useCallback(async (file: File, password?: string, customOptions?: EncryptionOptions): Promise<EncryptionResult> => {
        setIsEncrypting(true);
        setError(null);
        const startTime = Date.now();

        try {
            const opts = { ...options, ...customOptions };
            const { algorithm: alg, ivLength: ivl } = opts;

            let key: CryptoKey;
            let iv: Uint8Array;

            if (password) {
                // Generate salt for password-based key derivation
                const salt = crypto.getRandomValues(new Uint8Array(16));
                key = await deriveKeyFromPassword(password, salt, customOptions);
                iv = crypto.getRandomValues(new Uint8Array(ivl));
            } else {
                key = await generateKey(customOptions);
                iv = crypto.getRandomValues(new Uint8Array(ivl));
            }

            // Read file content
            const arrayBuffer = await file.arrayBuffer();

            // Encrypt the file content
            const encryptedBuffer = await crypto.subtle.encrypt(
                {
                    name: alg,
                    iv: iv,
                },
                key,
                arrayBuffer
            );

            // Create encrypted file
            const encryptedBlob = new Blob([encryptedBuffer], { type: 'application/octet-stream' });
            const encryptedFile = new File([encryptedBlob], `${file.name}.encrypted`, {
                type: 'application/octet-stream',
                lastModified: Date.now(),
            });

            const encryptionTime = Date.now() - startTime;

            const result: EncryptionResult = {
                originalFile: file,
                encryptedFile,
                key,
                iv,
                algorithm: alg,
                encryptionTime,
                fileSize: encryptedFile.size,
            };

            encryptionHistory.current.encrypted.push(result);
            onProgress?.(100);
            onSuccess?.(`File encrypted: ${file.name}`);

            return result;
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            setError(error);
            onError?.(error);
            throw error;
        } finally {
            setIsEncrypting(false);
        }
    }, [options, generateKey, deriveKeyFromPassword, onProgress, onError, onSuccess]);

    const decryptFile = useCallback(async (encryptedFile: File, key: CryptoKey, iv: Uint8Array, customOptions?: EncryptionOptions): Promise<DecryptionResult> => {
        setIsDecrypting(true);
        setError(null);
        const startTime = Date.now();

        try {
            const opts = { ...options, ...customOptions };
            const { algorithm: alg } = opts;

            // Read encrypted file content
            const arrayBuffer = await encryptedFile.arrayBuffer();

            // Decrypt the file content
            const decryptedBuffer = await crypto.subtle.decrypt(
                {
                    name: alg,
                    iv: iv,
                },
                key,
                arrayBuffer
            );

            // Create decrypted file
            const decryptedBlob = new Blob([decryptedBuffer]);
            const originalName = encryptedFile.name.replace('.encrypted', '');
            const decryptedFile = new File([decryptedBlob], originalName, {
                type: 'application/octet-stream',
                lastModified: Date.now(),
            });

            const decryptionTime = Date.now() - startTime;

            const result: DecryptionResult = {
                encryptedFile,
                decryptedFile,
                decryptionTime,
                success: true,
            };

            encryptionHistory.current.decrypted.push(result);
            onProgress?.(100);
            onSuccess?.(`File decrypted: ${originalName}`);

            return result;
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            setError(error);
            onError?.(error);

            const result: DecryptionResult = {
                encryptedFile,
                decryptedFile: new File([], ''),
                decryptionTime: Date.now() - startTime,
                success: false,
            };

            encryptionHistory.current.decrypted.push(result);
            throw error;
        } finally {
            setIsDecrypting(false);
        }
    }, [options, onProgress, onError, onSuccess]);

    const encryptMultiple = useCallback(async (files: File[], password?: string, customOptions?: EncryptionOptions): Promise<EncryptionResult[]> => {
        setIsEncrypting(true);
        setError(null);

        try {
            const results: EncryptionResult[] = [];
            const totalFiles = files.length;

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                onProgress?.((i / totalFiles) * 100);

                try {
                    const result = await encryptFile(file, password, customOptions);
                    results.push(result);
                } catch (err) {
                    console.error(`Failed to encrypt file ${file.name}:`, err);
                    // Continue with other files
                }
            }

            onProgress?.(100);
            onSuccess?.(`Encrypted ${results.length} of ${totalFiles} files`);

            return results;
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            setError(error);
            onError?.(error);
            throw error;
        } finally {
            setIsEncrypting(false);
        }
    }, [encryptFile, onProgress, onError, onSuccess]);

    const getEncryptionStats = useCallback(() => {
        const totalEncrypted = encryptionHistory.current.encrypted.length;
        const totalDecrypted = encryptionHistory.current.decrypted.length;
        const averageEncryptionTime = totalEncrypted > 0
            ? encryptionHistory.current.encrypted.reduce((sum, result) => sum + result.encryptionTime, 0) / totalEncrypted
            : 0;
        const averageDecryptionTime = totalDecrypted > 0
            ? encryptionHistory.current.decrypted.reduce((sum, result) => sum + result.decryptionTime, 0) / totalDecrypted
            : 0;

        return {
            totalEncrypted,
            totalDecrypted,
            averageEncryptionTime,
            averageDecryptionTime,
        };
    }, []);

    const clear = useCallback(() => {
        encryptionHistory.current = { encrypted: [], decrypted: [] };
        setError(null);
        setIsEncrypting(false);
        setIsDecrypting(false);
    }, []);

    return {
        isEncrypting,
        isDecrypting,
        error,
        encryptFile,
        decryptFile,
        generateKey,
        deriveKeyFromPassword,
        encryptMultiple,
        getEncryptionStats,
        clear,
    };
}

export default useFileEncryption;