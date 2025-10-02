/**
 * Storage utilities for localStorage, sessionStorage, and IndexedDB
 */

export interface StorageOptions {
    expires?: number; // TTL in milliseconds
    encrypt?: boolean;
    compress?: boolean;
}

export interface StorageItem<T = any> {
    value: T;
    timestamp: number;
    expires?: number;
}

/**
 * Local Storage wrapper with TTL and encryption support
 */
export class LocalStorage {
    private prefix: string;

    constructor(prefix: string = 'app_') {
        this.prefix = prefix;
    }

    private getKey(key: string): string {
        return `${this.prefix}${key}`;
    }

    private isExpired(item: StorageItem): boolean {
        if (!item.expires) return false;
        return Date.now() > item.timestamp + item.expires;
    }

    private serialize<T>(value: T, options: StorageOptions = {}): string {
        const item: StorageItem<T> = {
            value,
            timestamp: Date.now(),
            expires: options.expires,
        };

        let serialized = JSON.stringify(item);

        if (options.compress) {
            // Simple compression using base64 (in production, use a proper compression library)
            serialized = btoa(serialized);
        }

        if (options.encrypt) {
            // Simple encryption (in production, use a proper encryption library)
            serialized = btoa(serialized);
        }

        return serialized;
    }

    private deserialize<T>(serialized: string, options: StorageOptions = {}): T | null {
        try {
            let data = serialized;

            if (options.encrypt) {
                data = atob(data);
            }

            if (options.compress) {
                data = atob(data);
            }

            const item: StorageItem<T> = JSON.parse(data);

            if (this.isExpired(item)) {
                this.remove(item as any);
                return null;
            }

            return item.value;
        } catch {
            return null;
        }
    }

    set<T>(key: string, value: T, options: StorageOptions = {}): void {
        try {
            const serialized = this.serialize(value, options);
            localStorage.setItem(this.getKey(key), serialized);
        } catch (error) {
            console.error('Failed to set localStorage item:', error);
        }
    }

    get<T>(key: string, options: StorageOptions = {}): T | null {
        try {
            const serialized = localStorage.getItem(this.getKey(key));
            if (!serialized) return null;
            return this.deserialize<T>(serialized, options);
        } catch (error) {
            console.error('Failed to get localStorage item:', error);
            return null;
        }
    }

    remove(key: string): void {
        try {
            localStorage.removeItem(this.getKey(key));
        } catch (error) {
            console.error('Failed to remove localStorage item:', error);
        }
    }

    clear(): void {
        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(this.prefix)) {
                    localStorage.removeItem(key);
                }
            });
        } catch (error) {
            console.error('Failed to clear localStorage:', error);
        }
    }

    keys(): string[] {
        try {
            const keys = Object.keys(localStorage);
            return keys
                .filter(key => key.startsWith(this.prefix))
                .map(key => key.substring(this.prefix.length));
        } catch (error) {
            console.error('Failed to get localStorage keys:', error);
            return [];
        }
    }

    size(): number {
        try {
            return this.keys().length;
        } catch (error) {
            console.error('Failed to get localStorage size:', error);
            return 0;
        }
    }

    has(key: string): boolean {
        return this.get(key) !== null;
    }
}

/**
 * Session Storage wrapper
 */
export class SessionStorage {
    private prefix: string;

    constructor(prefix: string = 'app_') {
        this.prefix = prefix;
    }

    private getKey(key: string): string {
        return `${this.prefix}${key}`;
    }

    set<T>(key: string, value: T): void {
        try {
            sessionStorage.setItem(this.getKey(key), JSON.stringify(value));
        } catch (error) {
            console.error('Failed to set sessionStorage item:', error);
        }
    }

    get<T>(key: string): T | null {
        try {
            const item = sessionStorage.getItem(this.getKey(key));
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.error('Failed to get sessionStorage item:', error);
            return null;
        }
    }

    remove(key: string): void {
        try {
            sessionStorage.removeItem(this.getKey(key));
        } catch (error) {
            console.error('Failed to remove sessionStorage item:', error);
        }
    }

    clear(): void {
        try {
            const keys = Object.keys(sessionStorage);
            keys.forEach(key => {
                if (key.startsWith(this.prefix)) {
                    sessionStorage.removeItem(key);
                }
            });
        } catch (error) {
            console.error('Failed to clear sessionStorage:', error);
        }
    }

    keys(): string[] {
        try {
            const keys = Object.keys(sessionStorage);
            return keys
                .filter(key => key.startsWith(this.prefix))
                .map(key => key.substring(this.prefix.length));
        } catch (error) {
            console.error('Failed to get sessionStorage keys:', error);
            return [];
        }
    }

    has(key: string): boolean {
        return this.get(key) !== null;
    }
}

/**
 * IndexedDB wrapper
 */
export class IndexedDBStorage {
    private dbName: string;
    private version: number;
    private storeName: string;

    constructor(dbName: string = 'app_storage', version: number = 1, storeName: string = 'data') {
        this.dbName = dbName;
        this.version = version;
        this.storeName = storeName;
    }

    private async openDB(): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName, { keyPath: 'key' });
                }
            };
        });
    }

    async set<T>(key: string, value: T): Promise<void> {
        try {
            const db = await this.openDB();
            const transaction = db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);

            await new Promise<void>((resolve, reject) => {
                const request = store.put({ key, value, timestamp: Date.now() });
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('Failed to set IndexedDB item:', error);
        }
    }

    async get<T>(key: string): Promise<T | null> {
        try {
            const db = await this.openDB();
            const transaction = db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);

            return new Promise<T | null>((resolve, reject) => {
                const request = store.get(key);
                request.onsuccess = () => {
                    const result = request.result;
                    resolve(result ? result.value : null);
                };
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('Failed to get IndexedDB item:', error);
            return null;
        }
    }

    async remove(key: string): Promise<void> {
        try {
            const db = await this.openDB();
            const transaction = db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);

            await new Promise<void>((resolve, reject) => {
                const request = store.delete(key);
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('Failed to remove IndexedDB item:', error);
        }
    }

    async clear(): Promise<void> {
        try {
            const db = await this.openDB();
            const transaction = db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);

            await new Promise<void>((resolve, reject) => {
                const request = store.clear();
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('Failed to clear IndexedDB:', error);
        }
    }

    async keys(): Promise<string[]> {
        try {
            const db = await this.openDB();
            const transaction = db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);

            return new Promise<string[]>((resolve, reject) => {
                const request = store.getAllKeys();
                request.onsuccess = () => {
                    const keys = request.result as string[];
                    resolve(keys);
                };
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('Failed to get IndexedDB keys:', error);
            return [];
        }
    }

    async has(key: string): Promise<boolean> {
        const value = await this.get(key);
        return value !== null;
    }
}

/**
 * Memory storage for testing or temporary data
 */
export class MemoryStorage {
    private data: Map<string, any> = new Map();

    set<T>(key: string, value: T): void {
        this.data.set(key, value);
    }

    get<T>(key: string): T | null {
        return this.data.get(key) || null;
    }

    remove(key: string): void {
        this.data.delete(key);
    }

    clear(): void {
        this.data.clear();
    }

    keys(): string[] {
        return Array.from(this.data.keys());
    }

    has(key: string): boolean {
        return this.data.has(key);
    }

    size(): number {
        return this.data.size;
    }
}

/**
 * Storage manager that can use different storage backends
 */
export class StorageManager {
    private backends: {
        local: LocalStorage;
        session: SessionStorage;
        indexed: IndexedDBStorage;
        memory: MemoryStorage;
    };

    constructor(prefix: string = 'app_') {
        this.backends = {
            local: new LocalStorage(prefix),
            session: new SessionStorage(prefix),
            indexed: new IndexedDBStorage(),
            memory: new MemoryStorage(),
        };
    }

    /**
     * Get storage backend
     */
    getBackend(type: 'local' | 'session' | 'indexed' | 'memory' = 'local') {
        return this.backends[type];
    }

    /**
     * Set item with automatic backend selection
     */
    set<T>(key: string, value: T, type: 'local' | 'session' | 'indexed' | 'memory' = 'local', options?: StorageOptions): void {
        if (type === 'local') {
            this.backends.local.set(key, value, options);
        } else if (type === 'session') {
            this.backends.session.set(key, value);
        } else if (type === 'indexed') {
            this.backends.indexed.set(key, value);
        } else {
            this.backends.memory.set(key, value);
        }
    }

    /**
     * Get item with automatic backend selection
     */
    get<T>(key: string, type: 'local' | 'session' | 'indexed' | 'memory' = 'local', options?: StorageOptions): T | null {
        if (type === 'local') {
            return this.backends.local.get<T>(key, options);
        } else if (type === 'session') {
            return this.backends.session.get<T>(key);
        } else if (type === 'indexed') {
            return this.backends.indexed.get<T>(key);
        } else {
            return this.backends.memory.get<T>(key);
        }
    }

    /**
     * Remove item from all backends
     */
    remove(key: string): void {
        this.backends.local.remove(key);
        this.backends.session.remove(key);
        this.backends.indexed.remove(key);
        this.backends.memory.remove(key);
    }

    /**
     * Clear all backends
     */
    clear(): void {
        this.backends.local.clear();
        this.backends.session.clear();
        this.backends.indexed.clear();
        this.backends.memory.clear();
    }
}

// Create singleton instances
export const localStorage = new LocalStorage();
export const sessionStorage = new SessionStorage();
export const indexedDBStorage = new IndexedDBStorage();
export const memoryStorage = new MemoryStorage();
export const storage = new StorageManager();

// Convenience functions
export const storageUtils = {
    // Local storage
    setLocal: <T>(key: string, value: T, options?: StorageOptions) =>
        localStorage.set(key, value, options),
    getLocal: <T>(key: string, options?: StorageOptions) =>
        localStorage.get<T>(key, options),
    removeLocal: (key: string) => localStorage.remove(key),
    clearLocal: () => localStorage.clear(),

    // Session storage
    setSession: <T>(key: string, value: T) => sessionStorage.set(key, value),
    getSession: <T>(key: string) => sessionStorage.get<T>(key),
    removeSession: (key: string) => sessionStorage.remove(key),
    clearSession: () => sessionStorage.clear(),

    // IndexedDB storage
    setIndexed: <T>(key: string, value: T) => indexedDBStorage.set(key, value),
    getIndexed: <T>(key: string) => indexedDBStorage.get<T>(key),
    removeIndexed: (key: string) => indexedDBStorage.remove(key),
    clearIndexed: () => indexedDBStorage.clear(),

    // Memory storage
    setMemory: <T>(key: string, value: T) => memoryStorage.set(key, value),
    getMemory: <T>(key: string) => memoryStorage.get<T>(key),
    removeMemory: (key: string) => memoryStorage.remove(key),
    clearMemory: () => memoryStorage.clear(),

    // Generic storage
    set: <T>(key: string, value: T, type: 'local' | 'session' | 'indexed' | 'memory' = 'local', options?: StorageOptions) =>
        storage.set(key, value, type, options),
    get: <T>(key: string, type: 'local' | 'session' | 'indexed' | 'memory' = 'local', options?: StorageOptions) =>
        storage.get<T>(key, type, options),
    remove: (key: string) => storage.remove(key),
    clear: () => storage.clear(),
};
