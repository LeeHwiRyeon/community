const express = require('express');
const router = express.Router();
const { performanceMonitor } = require('../utils/performance-monitor');
const { databaseOptimizer } = require('../utils/database-optimizer');
const { cacheService } = require('../utils/cache-service');

// 성능 통계 조회
router.get('/stats', async (req, res) => {
    try {
        const stats = performanceMonitor.getStats();
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '성능 통계 조회 실패',
            error: error.message
        });
    }
});

// 헬스 체크
router.get('/health', async (req, res) => {
    try {
        const health = performanceMonitor.getHealthStatus();
        res.json({
            success: true,
            data: health
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '헬스 체크 실패',
            error: error.message
        });
    }
});

// 메트릭 데이터 조회
router.get('/metrics', async (req, res) => {
    try {
        const metrics = await performanceMonitor.getMetrics();
        res.set('Content-Type', 'text/plain');
        res.send(metrics);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '메트릭 데이터 조회 실패',
            error: error.message
        });
    }
});

// 데이터베이스 최적화
router.post('/database/optimize', async (req, res) => {
    try {
        console.log('🔧 데이터베이스 최적화 시작...');

        // 인덱스 최적화
        await databaseOptimizer.optimizeIndexes();

        // 쿼리 성능 분석
        await databaseOptimizer.analyzeQueryPerformance();

        // 연결 풀 최적화
        await databaseOptimizer.optimizePool();

        res.json({
            success: true,
            message: '데이터베이스 최적화 완료'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '데이터베이스 최적화 실패',
            error: error.message
        });
    }
});

// 데이터베이스 상태 조회
router.get('/database/status', async (req, res) => {
    try {
        const status = await databaseOptimizer.getPoolStatus();
        const connectionTest = await databaseOptimizer.testConnection();

        res.json({
            success: true,
            data: {
                pool: status,
                connection: connectionTest
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '데이터베이스 상태 조회 실패',
            error: error.message
        });
    }
});

// 캐시 상태 조회
router.get('/cache/status', async (req, res) => {
    try {
        const status = cacheService.getStatus();
        const stats = cacheService.getStats();

        res.json({
            success: true,
            data: {
                status,
                stats
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '캐시 상태 조회 실패',
            error: error.message
        });
    }
});

// 캐시 정리
router.post('/cache/cleanup', async (req, res) => {
    try {
        const { pattern } = req.body;

        if (pattern) {
            await cacheService.delPattern(pattern);
        } else {
            await cacheService.cleanup();
        }

        res.json({
            success: true,
            message: pattern ? `패턴 "${pattern}" 캐시 정리 완료` : '전체 캐시 정리 완료'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '캐시 정리 실패',
            error: error.message
        });
    }
});

// 캐시 무효화
router.post('/cache/invalidate', async (req, res) => {
    try {
        const { key } = req.body;

        if (!key) {
            return res.status(400).json({
                success: false,
                message: '캐시 키가 필요합니다'
            });
        }

        await cacheService.invalidate(key);

        res.json({
            success: true,
            message: `캐시 "${key}" 무효화 완료`
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '캐시 무효화 실패',
            error: error.message
        });
    }
});

// 성능 테스트 실행
router.post('/test/load', async (req, res) => {
    try {
        const { duration = 60, users = 10, rate = 1 } = req.body;

        // 간단한 로드 테스트 시뮬레이션
        const startTime = Date.now();
        const endTime = startTime + (duration * 1000);
        let requestCount = 0;
        let errorCount = 0;

        const testInterval = setInterval(async () => {
            if (Date.now() >= endTime) {
                clearInterval(testInterval);

                res.json({
                    success: true,
                    data: {
                        duration,
                        users,
                        rate,
                        totalRequests: requestCount,
                        errors: errorCount,
                        errorRate: (errorCount / requestCount) * 100,
                        requestsPerSecond: requestCount / duration
                    }
                });
                return;
            }

            // 테스트 요청 실행
            for (let i = 0; i < rate; i++) {
                try {
                    // 간단한 API 호출 시뮬레이션
                    const testResponse = await fetch('http://localhost:5000/api/performance/stats');
                    if (testResponse.ok) {
                        requestCount++;
                    } else {
                        errorCount++;
                    }
                } catch (error) {
                    errorCount++;
                }
            }
        }, 1000);

    } catch (error) {
        res.status(500).json({
            success: false,
            message: '로드 테스트 실행 실패',
            error: error.message
        });
    }
});

// 메모리 사용량 조회
router.get('/memory', async (req, res) => {
    try {
        const memUsage = process.memoryUsage();
        const memUsageMB = {
            rss: Math.round(memUsage.rss / 1024 / 1024),
            heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
            heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
            external: Math.round(memUsage.external / 1024 / 1024),
            arrayBuffers: Math.round(memUsage.arrayBuffers / 1024 / 1024)
        };

        res.json({
            success: true,
            data: {
                memory: memUsageMB,
                uptime: process.uptime(),
                nodeVersion: process.version,
                platform: process.platform
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '메모리 사용량 조회 실패',
            error: error.message
        });
    }
});

// CPU 사용량 조회
router.get('/cpu', async (req, res) => {
    try {
        const cpuUsage = process.cpuUsage();
        const cpuUsageMS = {
            user: Math.round(cpuUsage.user / 1000), // 마이크로초를 밀리초로 변환
            system: Math.round(cpuUsage.system / 1000)
        };

        res.json({
            success: true,
            data: {
                cpu: cpuUsageMS,
                uptime: process.uptime(),
                loadAverage: require('os').loadavg()
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'CPU 사용량 조회 실패',
            error: error.message
        });
    }
});

// 시스템 정보 조회
router.get('/system', async (req, res) => {
    try {
        const os = require('os');

        res.json({
            success: true,
            data: {
                platform: os.platform(),
                arch: os.arch(),
                release: os.release(),
                totalMemory: Math.round(os.totalmem() / 1024 / 1024 / 1024), // GB
                freeMemory: Math.round(os.freemem() / 1024 / 1024 / 1024), // GB
                cpus: os.cpus().length,
                uptime: os.uptime(),
                loadAverage: os.loadavg()
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '시스템 정보 조회 실패',
            error: error.message
        });
    }
});

module.exports = router;
