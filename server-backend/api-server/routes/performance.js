const express = require('express');
const { monitorMemory, forceGarbageCollection } = require('../config/memory-optimization');
const { sequelize } = require('../config/database');
const logger = require('../utils/logger');
const router = express.Router();

// 성능 메트릭 조회
router.get('/metrics', async (req, res) => {
    try {
        const memoryUsage = process.memoryUsage();
        const uptime = process.uptime();

        // 데이터베이스 연결 상태
        let dbStatus = 'disconnected';
        try {
            await sequelize.authenticate();
            dbStatus = 'connected';
        } catch (error) {
            dbStatus = 'error';
        }

        // CPU 사용률 (Node.js 11.10.0+)
        const cpuUsage = process.cpuUsage();

        const metrics = {
            memory: {
                rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
                heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
                heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
                external: Math.round(memoryUsage.external / 1024 / 1024), // MB
                arrayBuffers: Math.round(memoryUsage.arrayBuffers / 1024 / 1024) // MB
            },
            process: {
                uptime: Math.round(uptime), // seconds
                pid: process.pid,
                platform: process.platform,
                nodeVersion: process.version,
                cpuUsage: {
                    user: cpuUsage.user / 1000, // microseconds to milliseconds
                    system: cpuUsage.system / 1000
                }
            },
            database: {
                status: dbStatus,
                dialect: sequelize.options.dialect
            },
            timestamp: new Date().toISOString()
        };

        res.json({
            success: true,
            data: metrics
        });
    } catch (error) {
        logger.error('Performance metrics error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get performance metrics'
        });
    }
});

// 가비지 컬렉션 실행
router.post('/gc', (req, res) => {
    try {
        forceGarbageCollection();
        res.json({
            success: true,
            message: 'Garbage collection executed'
        });
    } catch (error) {
        logger.error('GC execution error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to execute garbage collection'
        });
    }
});

// 메모리 사용량 히스토리
let memoryHistory = [];
const MAX_HISTORY = 100;

// 메모리 히스토리 수집 (5분마다)
setInterval(() => {
    const memoryUsage = process.memoryUsage();
    memoryHistory.push({
        timestamp: new Date().toISOString(),
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        rss: Math.round(memoryUsage.rss / 1024 / 1024)
    });

    // 히스토리 크기 제한
    if (memoryHistory.length > MAX_HISTORY) {
        memoryHistory = memoryHistory.slice(-MAX_HISTORY);
    }
}, 5 * 60 * 1000);

// 메모리 히스토리 조회
router.get('/memory-history', (req, res) => {
    res.json({
        success: true,
        data: memoryHistory
    });
});

// 데이터베이스 성능 통계
router.get('/db-stats', async (req, res) => {
    try {
        const stats = await sequelize.query(`
            SELECT 
                name,
                sql
            FROM sqlite_master 
            WHERE type='table' AND name NOT LIKE 'sqlite_%'
        `);

        // 테이블별 레코드 수
        const tableCounts = {};
        for (const table of stats[0]) {
            try {
                const count = await sequelize.query(`SELECT COUNT(*) as count FROM ${table.name}`);
                tableCounts[table.name] = count[0][0].count;
            } catch (error) {
                tableCounts[table.name] = 0;
            }
        }

        res.json({
            success: true,
            data: {
                tables: stats[0],
                counts: tableCounts
            }
        });
    } catch (error) {
        logger.error('Database stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get database statistics'
        });
    }
});

// 시스템 리소스 정리
router.post('/cleanup', async (req, res) => {
    try {
        // 가비지 컬렉션 실행
        forceGarbageCollection();

        // 메모리 히스토리 정리
        memoryHistory = memoryHistory.slice(-20); // 최근 20개만 유지

        res.json({
            success: true,
            message: 'System cleanup completed'
        });
    } catch (error) {
        logger.error('Cleanup error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to cleanup system'
        });
    }
});

module.exports = router;
