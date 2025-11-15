const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { logger } = require('../utils/logger');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');
const os = require('os');
const fs = require('fs').promises;
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const router = express.Router();

// 시스템 상태 조회
router.get('/status', authenticateToken, requireRole('admin'), asyncHandler(async (req, res) => {
    try {
        const uptime = process.uptime();
        const memoryUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();

        // 시스템 메모리 정보
        const totalMemory = os.totalmem();
        const freeMemory = os.freemem();
        const usedMemory = totalMemory - freeMemory;

        // CPU 정보
        const cpus = os.cpus();
        const cpuModel = cpus[0].model;
        const cpuCores = cpus.length;

        // 로드 평균
        const loadAverage = os.loadavg();

        // 네트워크 인터페이스
        const networkInterfaces = os.networkInterfaces();

        res.json({
            success: true,
            data: {
                process: {
                    uptime: Math.floor(uptime),
                    pid: process.pid,
                    version: process.version,
                    platform: process.platform,
                    arch: process.arch
                },
                memory: {
                    process: {
                        rss: memoryUsage.rss,
                        heapTotal: memoryUsage.heapTotal,
                        heapUsed: memoryUsage.heapUsed,
                        external: memoryUsage.external,
                        arrayBuffers: memoryUsage.arrayBuffers
                    },
                    system: {
                        total: totalMemory,
                        free: freeMemory,
                        used: usedMemory,
                        usagePercent: ((usedMemory / totalMemory) * 100).toFixed(2)
                    }
                },
                cpu: {
                    model: cpuModel,
                    cores: cpuCores,
                    usage: {
                        user: cpuUsage.user,
                        system: cpuUsage.system
                    },
                    loadAverage: {
                        '1min': loadAverage[0],
                        '5min': loadAverage[1],
                        '15min': loadAverage[2]
                    }
                },
                network: {
                    interfaces: Object.keys(networkInterfaces).map(name => ({
                        name,
                        addresses: networkInterfaces[name].map(iface => ({
                            address: iface.address,
                            family: iface.family,
                            internal: iface.internal
                        }))
                    }))
                },
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        logger.error('시스템 상태 조회 실패:', error);
        res.status(500).json({
            success: false,
            error: '시스템 상태를 불러올 수 없습니다.'
        });
    }
}));

// 데이터베이스 상태 조회
router.get('/database', authenticateToken, requireRole('admin'), asyncHandler(async (req, res) => {
    try {
        const { sequelize } = require('../config/database');

        // 데이터베이스 연결 테스트
        const startTime = Date.now();
        await sequelize.authenticate();
        const responseTime = Date.now() - startTime;

        // 데이터베이스 정보
        const config = sequelize.config;
        const dialect = sequelize.getDialect();

        // 테이블 목록 조회
        const [tables] = await sequelize.query(
            dialect === 'mysql'
                ? "SHOW TABLES"
                : "SELECT name FROM sqlite_master WHERE type='table'"
        );

        // 연결 풀 상태
        const pool = sequelize.connectionManager.pool;
        const poolStatus = {
            total: pool.size,
            used: pool.used,
            waiting: pool.pending,
            available: pool.available
        };

        res.json({
            success: true,
            data: {
                connection: {
                    status: 'connected',
                    responseTime: `${responseTime}ms`,
                    dialect: dialect,
                    host: config.host,
                    port: config.port,
                    database: config.database
                },
                tables: tables.length,
                pool: poolStatus,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        logger.error('데이터베이스 상태 조회 실패:', error);
        res.status(500).json({
            success: false,
            data: {
                connection: {
                    status: 'disconnected',
                    error: error.message
                },
                timestamp: new Date().toISOString()
            }
        });
    }
}));

// Redis 상태 조회
router.get('/redis', authenticateToken, requireRole('admin'), asyncHandler(async (req, res) => {
    try {
        const { redis } = require('../config/redis');

        // Redis 연결 테스트
        const startTime = Date.now();
        await redis.ping();
        const responseTime = Date.now() - startTime;

        // Redis 정보
        const info = await redis.info();
        const memoryInfo = await redis.memory('usage');
        const dbSize = await redis.dbsize();

        res.json({
            success: true,
            data: {
                connection: {
                    status: 'connected',
                    responseTime: `${responseTime}ms`
                },
                memory: {
                    usage: memoryInfo
                },
                database: {
                    size: dbSize
                },
                info: info,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        logger.error('Redis 상태 조회 실패:', error);
        res.status(500).json({
            success: false,
            data: {
                connection: {
                    status: 'disconnected',
                    error: error.message
                },
                timestamp: new Date().toISOString()
            }
        });
    }
}));

// 로그 파일 조회
router.get('/logs', authenticateToken, requireRole('admin'), asyncHandler(async (req, res) => {
    try {
        const { lines = 100, level = 'all' } = req.query;
        const logPath = process.env.LOG_PATH || './logs/app.log';

        try {
            const logContent = await fs.readFile(logPath, 'utf8');
            const logLines = logContent.split('\n').filter(line => line.trim());

            // 레벨 필터링
            let filteredLines = logLines;
            if (level !== 'all') {
                filteredLines = logLines.filter(line =>
                    line.includes(`[${level.toUpperCase()}]`)
                );
            }

            // 최근 N줄만 반환
            const recentLines = filteredLines.slice(-parseInt(lines));

            res.json({
                success: true,
                data: {
                    lines: recentLines,
                    total: filteredLines.length,
                    level: level,
                    timestamp: new Date().toISOString()
                }
            });
        } catch (fileError) {
            res.json({
                success: true,
                data: {
                    lines: ['로그 파일을 찾을 수 없습니다.'],
                    total: 0,
                    level: level,
                    error: fileError.message,
                    timestamp: new Date().toISOString()
                }
            });
        }
    } catch (error) {
        logger.error('로그 조회 실패:', error);
        res.status(500).json({
            success: false,
            error: '로그를 불러올 수 없습니다.'
        });
    }
}));

// 서버 성능 메트릭
router.get('/performance', authenticateToken, requireRole('admin'), asyncHandler(async (req, res) => {
    try {
        const { period = '1h' } = req.query;

        // 메모리 사용량
        const memoryUsage = process.memoryUsage();
        const systemMemory = {
            total: os.totalmem(),
            free: os.freemem(),
            used: os.totalmem() - os.freemem()
        };

        // CPU 사용률 (Node.js 프로세스)
        const cpuUsage = process.cpuUsage();
        const systemLoad = os.loadavg();

        // 이벤트 루프 지연 측정
        const eventLoopDelay = await new Promise((resolve) => {
            const start = process.hrtime.bigint();
            setImmediate(() => {
                const delta = process.hrtime.bigint() - start;
                resolve(Number(delta) / 1000000); // ms로 변환
            });
        });

        // 가비지 컬렉션 정보
        const gcInfo = global.gc ? 'Available' : 'Not available';

        res.json({
            success: true,
            data: {
                memory: {
                    process: {
                        rss: memoryUsage.rss,
                        heapTotal: memoryUsage.heapTotal,
                        heapUsed: memoryUsage.heapUsed,
                        external: memoryUsage.external
                    },
                    system: {
                        total: systemMemory.total,
                        free: systemMemory.free,
                        used: systemMemory.used,
                        usagePercent: ((systemMemory.used / systemMemory.total) * 100).toFixed(2)
                    }
                },
                cpu: {
                    process: {
                        user: cpuUsage.user,
                        system: cpuUsage.system
                    },
                    system: {
                        loadAverage: systemLoad
                    }
                },
                performance: {
                    eventLoopDelay: `${eventLoopDelay.toFixed(2)}ms`,
                    garbageCollection: gcInfo,
                    uptime: process.uptime()
                },
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        logger.error('성능 메트릭 조회 실패:', error);
        res.status(500).json({
            success: false,
            error: '성능 메트릭을 불러올 수 없습니다.'
        });
    }
}));

// 디스크 사용량 조회
router.get('/disk', authenticateToken, requireRole('admin'), asyncHandler(async (req, res) => {
    try {
        const { stdout } = await execAsync('df -h');
        const lines = stdout.trim().split('\n');

        const diskInfo = lines.slice(1).map(line => {
            const parts = line.split(/\s+/);
            return {
                filesystem: parts[0],
                size: parts[1],
                used: parts[2],
                available: parts[3],
                usagePercent: parts[4],
                mounted: parts[5]
            };
        });

        res.json({
            success: true,
            data: {
                disks: diskInfo,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        logger.error('디스크 사용량 조회 실패:', error);
        res.status(500).json({
            success: false,
            error: '디스크 사용량을 불러올 수 없습니다.'
        });
    }
}));

// 네트워크 연결 상태
router.get('/network', authenticateToken, requireRole('admin'), asyncHandler(async (req, res) => {
    try {
        const { stdout } = await execAsync('netstat -an');
        const lines = stdout.trim().split('\n');

        const connections = lines.slice(2).map(line => {
            const parts = line.split(/\s+/);
            return {
                protocol: parts[0],
                localAddress: parts[3],
                foreignAddress: parts[4],
                state: parts[5] || 'N/A'
            };
        });

        // 연결 상태별 카운트
        const stateCounts = connections.reduce((acc, conn) => {
            acc[conn.state] = (acc[conn.state] || 0) + 1;
            return acc;
        }, {});

        res.json({
            success: true,
            data: {
                connections: connections.slice(0, 100), // 최대 100개만 반환
                stateCounts,
                total: connections.length,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        logger.error('네트워크 상태 조회 실패:', error);
        res.status(500).json({
            success: false,
            error: '네트워크 상태를 불러올 수 없습니다.'
        });
    }
}));

// 시스템 알림 설정
router.post('/alerts', authenticateToken, requireRole('admin'), asyncHandler(async (req, res) => {
    try {
        const { type, threshold, enabled, message } = req.body;

        // 알림 설정 저장 (실제로는 데이터베이스에 저장)
        const alertConfig = {
            id: Date.now(),
            type,
            threshold,
            enabled,
            message,
            createdAt: new Date().toISOString()
        };

        logger.info(`Alert configured: ${JSON.stringify(alertConfig)}`);

        res.json({
            success: true,
            data: alertConfig,
            message: '알림 설정이 저장되었습니다.'
        });
    } catch (error) {
        logger.error('알림 설정 실패:', error);
        res.status(500).json({
            success: false,
            error: '알림 설정에 실패했습니다.'
        });
    }
}));

// 시스템 상태 체크 (빠른 응답, 인증 없음)
router.get('/health-check', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

module.exports = router;
