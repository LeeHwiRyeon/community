import { EventEmitter } from 'events';

// 캐시 항목 인터페이스
export interface CacheItem<T = any> {
    key: string;
    value: T;
    ttl: number;
    createdAt: Date;
    lastAccessed: Date;
    accessCount: number;
    size: number;
    tags: string[];
    priority: 'low' | 'medium' | 'high' | 'critical';
    metadata: CacheMetadata;
}

// 캐시 메타데이터 인터페이스
export interface CacheMetadata {
    source: string;
    version: string;
    dependencies: string[];
    invalidationRules: InvalidationRule[];
    compression: boolean;
    encryption: boolean;
    checksum: string;
}

// 무효화 규칙 인터페이스
export interface InvalidationRule {
    type: 'time' | 'dependency' | 'tag' | 'pattern' | 'custom';
    value: any;
    action: 'invalidate' | 'refresh' | 'notify';
}

// 캐시 통계 인터페이스
export interface CacheStats {
    hits: number;
    misses: number;
    hitRate: number;
    totalItems: number;
    totalSize: number;
    memoryUsage: number;
    evictions: number;
    errors: number;
    averageAccessTime: number;
    topKeys: Array<{ key: string; accessCount: number }>;
}

// 캐시 설정 인터페이스
export interface CacheConfig {
    maxSize: number;
    maxItems: number;
    defaultTtl: number;
    cleanupInterval: number;
    compressionThreshold: number;
    encryptionKey?: string;
    persistence: boolean;
    persistencePath: string;
    clustering: boolean;
    clusterNodes: string[];
}

// 고급 캐시 시스템
export class AdvancedCacheSystem extends EventEmitter {
    private cache: Map<string, CacheItem> = new Map();
    private stats: CacheStats;
    private config: CacheConfig;
    private cleanupTimer: NodeJS.Timeout | null = null;
    private persistenceTimer: NodeJS.Timeout | null = null;
    private compression: any;
    private encryption: any;

    constructor(config: Partial<CacheConfig> = {}) {
        super();

        this.config = {
            maxSize: 100 * 1024 * 1024, // 100MB
            maxItems: 10000,
            defaultTtl: 3600000, // 1 hour
            cleanupInterval: 300000, // 5 minutes
            compressionThreshold: 1024, // 1KB
            persistence: true,
            persistencePath: './data/cache',
            clustering: false,
            clusterNodes: [],
            ...config
        };

        this.stats = {
            hits: 0,
            misses: 0,
            hitRate: 0,
            totalItems: 0,
            totalSize: 0,
            memoryUsage: 0,
            evictions: 0,
            errors: 0,
            averageAccessTime: 0,
            topKeys: []
        };

        this.initializeCompression();
        this.initializeEncryption();
        this.startCleanupTimer();
        this.startPersistenceTimer();
    }

    // 캐시 설정
    async set<T>(
        key: string,
        value: T,
        options: {
            ttl?: number;
            tags?: string[];
            priority?: 'low' | 'medium' | 'high' | 'critical';
            metadata?: Partial<CacheMetadata>;
            compression?: boolean;
            encryption?: boolean;
        } = {}
    ): Promise<boolean> {
        try {
            const startTime = Date.now();

            // 기존 항목 제거
            if (this.cache.has(key)) {
                this.remove(key);
            }

            // TTL 설정
            const ttl = options.ttl || this.config.defaultTtl;
            const createdAt = new Date();
            const lastAccessed = new Date();

            // 압축 처리
            let processedValue = value;
            let compression = false;
            if (options.compression !== false && this.shouldCompress(value)) {
                processedValue = await this.compress(value);
                compression = true;
            }

            // 암호화 처리
            if (options.encryption && this.encryption) {
                processedValue = await this.encrypt(processedValue);
            }

            // 크기 계산
            const size = this.calculateSize(processedValue);

            // 메모리 제한 확인
            if (this.wouldExceedMemoryLimit(size)) {
                await this.evictItems(size);
            }

            // 캐시 항목 생성
            const item: CacheItem<T> = {
                key,
                value: processedValue,
                ttl,
                createdAt,
                lastAccessed,
                accessCount: 0,
                size,
                tags: options.tags || [],
                priority: options.priority || 'medium',
                metadata: {
                    source: 'cache',
                    version: '1.0.0',
                    dependencies: [],
                    invalidationRules: [],
                    compression,
                    encryption: !!options.encryption,
                    checksum: this.calculateChecksum(processedValue),
                    ...options.metadata
                }
            };

            // 캐시에 저장
            this.cache.set(key, item);

            // 통계 업데이트
            this.updateStats('set', Date.now() - startTime);

            // 이벤트 발생
            this.emit('set', { key, value, item });

            return true;
        } catch (error) {
            this.stats.errors++;
            this.emit('error', { key, error });
            return false;
        }
    }

    // 캐시 조회
    async get<T>(key: string): Promise<T | null> {
        try {
            const startTime = Date.now();

            const item = this.cache.get(key);
            if (!item) {
                this.stats.misses++;
                this.updateHitRate();
                return null;
            }

            // TTL 확인
            if (this.isExpired(item)) {
                this.remove(key);
                this.stats.misses++;
                this.updateHitRate();
                return null;
            }

            // 접근 정보 업데이트
            item.lastAccessed = new Date();
            item.accessCount++;
            this.cache.set(key, item);

            // 압축 해제
            let value = item.value;
            if (item.metadata.compression) {
                value = await this.decompress(value);
            }

            // 암호화 해제
            if (item.metadata.encryption) {
                value = await this.decrypt(value);
            }

            // 통계 업데이트
            this.stats.hits++;
            this.updateHitRate();
            this.updateStats('get', Date.now() - startTime);

            // 이벤트 발생
            this.emit('get', { key, value, item });

            return value as T;
        } catch (error) {
            this.stats.errors++;
            this.emit('error', { key, error });
            return null;
        }
    }

    // 캐시 제거
    remove(key: string): boolean {
        const item = this.cache.get(key);
        if (!item) return false;

        this.cache.delete(key);
        this.stats.totalItems--;
        this.stats.totalSize -= item.size;
        this.stats.evictions++;

        this.emit('remove', { key, item });
        return true;
    }

    // 태그별 무효화
    invalidateByTags(tags: string[]): number {
        let count = 0;
        const keysToRemove: string[] = [];

        for (const [key, item] of this.cache.entries()) {
            if (tags.some(tag => item.tags.includes(tag))) {
                keysToRemove.push(key);
            }
        }

        keysToRemove.forEach(key => {
            if (this.remove(key)) count++;
        });

        this.emit('invalidate', { tags, count });
        return count;
    }

    // 패턴별 무효화
    invalidateByPattern(pattern: RegExp): number {
        let count = 0;
        const keysToRemove: string[] = [];

        for (const key of this.cache.keys()) {
            if (pattern.test(key)) {
                keysToRemove.push(key);
            }
        }

        keysToRemove.forEach(key => {
            if (this.remove(key)) count++;
        });

        this.emit('invalidate', { pattern, count });
        return count;
    }

    // 캐시 정리
    clear(): void {
        const size = this.cache.size;
        this.cache.clear();
        this.stats.totalItems = 0;
        this.stats.totalSize = 0;
        this.stats.evictions += size;

        this.emit('clear', { size });
    }

    // 캐시 통계 조회
    getStats(): CacheStats {
        return { ...this.stats };
    }

    // 캐시 상태 조회
    getStatus(): any {
        return {
            isHealthy: this.stats.errors < 100,
            memoryUsage: this.stats.memoryUsage,
            hitRate: this.stats.hitRate,
            totalItems: this.stats.totalItems,
            totalSize: this.stats.totalSize,
            uptime: process.uptime(),
            config: this.config
        };
    }

    // 캐시 최적화
    async optimize(): Promise<any> {
        const startTime = Date.now();

        // 만료된 항목 제거
        const expiredKeys = this.getExpiredKeys();
        expiredKeys.forEach(key => this.remove(key));

        // LRU 기반 정리
        await this.performLRUCleanup();

        // 압축 최적화
        await this.optimizeCompression();

        // 통계 업데이트
        this.updateTopKeys();

        const duration = Date.now() - startTime;
        this.emit('optimize', { duration, removedItems: expiredKeys.length });

        return {
            duration,
            removedItems: expiredKeys.length,
            memorySaved: this.calculateMemorySaved(),
            hitRateImprovement: this.calculateHitRateImprovement()
        };
    }

    // 캐시 백업
    async backup(): Promise<string> {
        const backupData = {
            items: Array.from(this.cache.entries()),
            stats: this.stats,
            config: this.config,
            timestamp: new Date().toISOString()
        };

        const fs = require('fs');
        const path = require('path');

        if (!fs.existsSync(this.config.persistencePath)) {
            fs.mkdirSync(this.config.persistencePath, { recursive: true });
        }

        const backupPath = path.join(this.config.persistencePath, `backup_${Date.now()}.json`);
        fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));

        this.emit('backup', { path: backupPath });
        return backupPath;
    }

    // 캐시 복원
    async restore(backupPath: string): Promise<boolean> {
        try {
            const fs = require('fs');
            const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));

            this.cache.clear();
            this.cache = new Map(backupData.items);
            this.stats = backupData.stats;

            this.emit('restore', { path: backupPath });
            return true;
        } catch (error) {
            this.emit('error', { operation: 'restore', error });
            return false;
        }
    }

    // 압축 초기화
    private initializeCompression(): void {
        try {
            this.compression = require('zlib');
        } catch (error) {
            console.warn('Compression not available:', error);
        }
    }

    // 암호화 초기화
    private initializeEncryption(): void {
        try {
            const crypto = require('crypto');
            this.encryption = {
                algorithm: 'aes-256-gcm',
                key: this.config.encryptionKey || crypto.randomBytes(32)
            };
        } catch (error) {
            console.warn('Encryption not available:', error);
        }
    }

    // 압축 여부 확인
    private shouldCompress(value: any): boolean {
        const size = this.calculateSize(value);
        return size > this.config.compressionThreshold;
    }

    // 압축
    private async compress(value: any): Promise<Buffer> {
        if (!this.compression) return value;

        const data = JSON.stringify(value);
        return this.compression.gzipSync(data);
    }

    // 압축 해제
    private async decompress(value: any): Promise<any> {
        if (!this.compression) return value;

        const decompressed = this.compression.gunzipSync(value);
        return JSON.parse(decompressed.toString());
    }

    // 암호화
    private async encrypt(value: any): Promise<string> {
        if (!this.encryption) return value;

        const crypto = require('crypto');
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipher(this.encryption.algorithm, this.encryption.key);

        let encrypted = cipher.update(JSON.stringify(value), 'utf8', 'hex');
        encrypted += cipher.final('hex');

        return iv.toString('hex') + ':' + encrypted;
    }

    // 암호화 해제
    private async decrypt(value: string): Promise<any> {
        if (!this.encryption) return value;

        const crypto = require('crypto');
        const [ivHex, encrypted] = value.split(':');
        const iv = Buffer.from(ivHex, 'hex');

        const decipher = crypto.createDecipher(this.encryption.algorithm, this.encryption.key);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return JSON.parse(decrypted);
    }

    // 크기 계산
    private calculateSize(value: any): number {
        return Buffer.byteLength(JSON.stringify(value), 'utf8');
    }

    // 체크섬 계산
    private calculateChecksum(value: any): string {
        const crypto = require('crypto');
        return crypto.createHash('md5').update(JSON.stringify(value)).digest('hex');
    }

    // 만료 확인
    private isExpired(item: CacheItem): boolean {
        const now = Date.now();
        const itemAge = now - item.createdAt.getTime();
        return itemAge > item.ttl;
    }

    // 만료된 키 조회
    private getExpiredKeys(): string[] {
        const expiredKeys: string[] = [];

        for (const [key, item] of this.cache.entries()) {
            if (this.isExpired(item)) {
                expiredKeys.push(key);
            }
        }

        return expiredKeys;
    }

    // 메모리 제한 확인
    private wouldExceedMemoryLimit(additionalSize: number): boolean {
        return this.stats.totalSize + additionalSize > this.config.maxSize;
    }

    // 항목 제거 (LRU)
    private async evictItems(requiredSpace: number): Promise<void> {
        const items = Array.from(this.cache.entries())
            .map(([key, item]) => ({ key, item, score: this.calculateEvictionScore(item) }))
            .sort((a, b) => a.score - b.score);

        let freedSpace = 0;
        const itemsToRemove: string[] = [];

        for (const { key, item } of items) {
            if (freedSpace >= requiredSpace) break;

            itemsToRemove.push(key);
            freedSpace += item.size;
        }

        itemsToRemove.forEach(key => this.remove(key));
    }

    // 제거 점수 계산
    private calculateEvictionScore(item: CacheItem): number {
        const age = Date.now() - item.createdAt.getTime();
        const lastAccess = Date.now() - item.lastAccessed.getTime();
        const priority = { low: 4, medium: 3, high: 2, critical: 1 }[item.priority];

        return (age / 1000) + (lastAccess / 1000) + priority - (item.accessCount * 0.1);
    }

    // LRU 정리
    private async performLRUCleanup(): Promise<void> {
        if (this.cache.size <= this.config.maxItems) return;

        const items = Array.from(this.cache.entries())
            .map(([key, item]) => ({ key, item, lastAccess: item.lastAccessed.getTime() }))
            .sort((a, b) => a.lastAccess - b.lastAccess);

        const itemsToRemove = items.slice(0, this.cache.size - this.config.maxItems);
        itemsToRemove.forEach(({ key }) => this.remove(key));
    }

    // 압축 최적화
    private async optimizeCompression(): Promise<void> {
        for (const [key, item] of this.cache.entries()) {
            if (!item.metadata.compression && this.shouldCompress(item.value)) {
                const compressed = await this.compress(item.value);
                item.value = compressed;
                item.metadata.compression = true;
                item.size = this.calculateSize(compressed);
                this.cache.set(key, item);
            }
        }
    }

    // 통계 업데이트
    private updateStats(operation: string, duration: number): void {
        this.stats.totalItems = this.cache.size;
        this.stats.totalSize = Array.from(this.cache.values()).reduce((sum, item) => sum + item.size, 0);
        this.stats.memoryUsage = process.memoryUsage().heapUsed;

        if (operation === 'get' || operation === 'set') {
            this.stats.averageAccessTime = (this.stats.averageAccessTime + duration) / 2;
        }
    }

    // 히트율 업데이트
    private updateHitRate(): void {
        const total = this.stats.hits + this.stats.misses;
        this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
    }

    // 상위 키 업데이트
    private updateTopKeys(): void {
        this.stats.topKeys = Array.from(this.cache.entries())
            .map(([key, item]) => ({ key, accessCount: item.accessCount }))
            .sort((a, b) => b.accessCount - a.accessCount)
            .slice(0, 10);
    }

    // 메모리 절약량 계산
    private calculateMemorySaved(): number {
        return this.stats.evictions * 1024; // 추정값
    }

    // 히트율 개선 계산
    private calculateHitRateImprovement(): number {
        return Math.max(0, this.stats.hitRate - 50); // 50% 기준
    }

    // 정리 타이머 시작
    private startCleanupTimer(): void {
        this.cleanupTimer = setInterval(() => {
            this.performCleanup();
        }, this.config.cleanupInterval);
    }

    // 지속성 타이머 시작
    private startPersistenceTimer(): void {
        if (!this.config.persistence) return;

        this.persistenceTimer = setInterval(() => {
            this.saveToDisk();
        }, 60000); // 1분마다
    }

    // 정리 수행
    private performCleanup(): void {
        const expiredKeys = this.getExpiredKeys();
        expiredKeys.forEach(key => this.remove(key));

        if (this.cache.size > this.config.maxItems) {
            this.performLRUCleanup();
        }
    }

    // 디스크 저장
    private saveToDisk(): void {
        try {
            const fs = require('fs');
            const path = require('path');

            if (!fs.existsSync(this.config.persistencePath)) {
                fs.mkdirSync(this.config.persistencePath, { recursive: true });
            }

            const data = {
                items: Array.from(this.cache.entries()),
                stats: this.stats,
                timestamp: new Date().toISOString()
            };

            const filePath = path.join(this.config.persistencePath, 'cache.json');
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        } catch (error) {
            this.emit('error', { operation: 'persistence', error });
        }
    }

    // 정리
    destroy(): void {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
        }
        if (this.persistenceTimer) {
            clearInterval(this.persistenceTimer);
        }

        this.saveToDisk();
        this.clear();
        this.removeAllListeners();
    }
}

// 싱글톤 인스턴스
export const advancedCacheSystem = new AdvancedCacheSystem({
    maxSize: 200 * 1024 * 1024, // 200MB
    maxItems: 20000,
    defaultTtl: 7200000, // 2 hours
    persistence: true,
    persistencePath: './data/cache'
});
