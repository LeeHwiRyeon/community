// const logger = require('../utils/logger');

// 메모리 사용량 모니터링
const monitorMemory = () => {
    const used = process.memoryUsage();
    const formatBytes = (bytes) => {
        return (bytes / 1024 / 1024).toFixed(2) + ' MB';
    };

    console.log('Memory Usage:', {
        rss: formatBytes(used.rss),           // Resident Set Size
        heapTotal: formatBytes(used.heapTotal), // Total heap size
        heapUsed: formatBytes(used.heapUsed),   // Used heap size
        external: formatBytes(used.external),   // External memory
        arrayBuffers: formatBytes(used.arrayBuffers) // Array buffers
    });
};

// 가비지 컬렉션 강제 실행
const forceGarbageCollection = () => {
    if (global.gc) {
        global.gc();
        console.log('Garbage collection forced');
    } else {
        console.warn('Garbage collection not available. Run with --expose-gc flag');
    }
};

// 메모리 누수 감지
const detectMemoryLeaks = () => {
    const memUsage = process.memoryUsage();
    const heapUsed = memUsage.heapUsed;

    // 메모리 사용량이 500MB를 초과하면 경고
    if (heapUsed > 500 * 1024 * 1024) {
        console.warn('High memory usage detected:', {
            heapUsed: (heapUsed / 1024 / 1024).toFixed(2) + ' MB'
        });
        
        // 가비지 컬렉션 실행
        forceGarbageCollection();
    }
};

// 메모리 최적화 설정
const optimizeMemory = () => {
    // Node.js 메모리 제한 설정
    process.setMaxListeners(20);

    // 메모리 모니터링 간격 설정 (5분마다)
    setInterval(() => {
        monitorMemory();
        detectMemoryLeaks();
    }, 5 * 60 * 1000);

    // 프로세스 종료 시 정리
    process.on('SIGTERM', () => {
        console.log('Cleaning up memory before exit');
        forceGarbageCollection();
    });
    
    process.on('SIGINT', () => {
        console.log('Cleaning up memory before exit');
        forceGarbageCollection();
    });
};

// 캐시 크기 제한
const optimizeCache = () => {
    // 메모리 캐시 초기화
    if (!global.memoryCache) {
        global.memoryCache = new Map();
    }

    // 메모리 캐시 크기 제한 (100개 항목)
    const maxCacheSize = 100;
    let cacheSize = 0;

    return {
        set: (key, value) => {
            if (cacheSize >= maxCacheSize) {
                // 가장 오래된 항목 제거
                const firstKey = global.memoryCache.keys().next().value;
                global.memoryCache.delete(firstKey);
                cacheSize--;
            }

            global.memoryCache.set(key, {
                value,
                timestamp: Date.now()
            });
            cacheSize++;
        },

        get: (key) => {
            const item = global.memoryCache.get(key);
            if (item && (Date.now() - item.timestamp) < 300000) { // 5분 TTL
                return item.value;
            }
            return null;
        },

        clear: () => {
            global.memoryCache.clear();
            cacheSize = 0;
        }
    };
};

module.exports = {
    monitorMemory,
    forceGarbageCollection,
    detectMemoryLeaks,
    optimizeMemory,
    optimizeCache
};
