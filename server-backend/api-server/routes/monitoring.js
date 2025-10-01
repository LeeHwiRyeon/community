const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { sequelize } = require('../config/database');
const { cache } = require('../config/redis');
const { logger } = require('../utils/logger');

const router = express.Router();

// 시스템 성능 메트릭
router.get('/metrics', asyncHandler(async (req, res) => {
    try {
        const memoryUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();
        const uptime = process.uptime();

        // 데이터베이스 연결 상태 확인
        let dbStatus = 'disconnected';
        try {
            await sequelize.authenticate();
            dbStatus = 'connected';
        } catch (error) {
            dbStatus = 'error';
        }

        // Redis 연결 상태 확인
        let redisStatus = 'disconnected';
        try {
            await cache.ping();
            redisStatus = 'connected';
        } catch (error) {
            redisStatus = 'error';
        }

        const metrics = {
            system: {
                uptime: Math.floor(uptime),
                memory: {
                    rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
                    heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
                    heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
                    external: Math.round(memoryUsage.external / 1024 / 1024), // MB
                    arrayBuffers: Math.round(memoryUsage.arrayBuffers / 1024 / 1024) // MB
                },
                cpu: {
                    user: cpuUsage.user,
                    system: cpuUsage.system
                }
            },
            services: {
                database: dbStatus,
                redis: redisStatus,
                api: 'running'
            },
            timestamp: new Date().toISOString()
        };

        res.json({
            success: true,
            data: metrics
        });

    } catch (error) {
        logger.error('Error fetching metrics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch metrics'
        });
    }
}));

// 데이터베이스 성능 통계
router.get('/database-stats', asyncHandler(async (req, res) => {
    try {
        const User = require('../models/User');

        // 사용자 통계
        const totalUsers = await User.count();
        const activeUsers = await User.count({ where: { status: 'active' } });

        // 등급별 통계
        const usersByRole = await User.findAll({
            attributes: [
                'role',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            group: ['role'],
            raw: true
        });

        // 최근 7일간 가입자 수
        const dailyRegistrations = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const startOfDay = new Date(date.setHours(0, 0, 0, 0));
            const endOfDay = new Date(date.setHours(23, 59, 59, 999));

            const count = await User.count({
                where: {
                    createdAt: {
                        [sequelize.Op.between]: [startOfDay, endOfDay]
                    }
                }
            });

            dailyRegistrations.push({
                date: startOfDay.toISOString().split('T')[0],
                count
            });
        }

        const stats = {
            users: {
                total: totalUsers,
                active: activeUsers,
                inactive: totalUsers - activeUsers
            },
            roles: usersByRole.reduce((acc, item) => {
                acc[item.role] = parseInt(item.count);
                return acc;
            }, {}),
            dailyRegistrations,
            lastUpdated: new Date().toISOString()
        };

        res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        logger.error('Error fetching database stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch database statistics'
        });
    }
}));

// API 응답 시간 통계
router.get('/response-times', asyncHandler(async (req, res) => {
    try {
        // 간단한 응답 시간 측정
        const startTime = Date.now();

        // 데이터베이스 쿼리 시간 측정
        const dbStartTime = Date.now();
        await sequelize.query('SELECT 1');
        const dbQueryTime = Date.now() - dbStartTime;

        const totalTime = Date.now() - startTime;

        const responseTimes = {
            total: totalTime,
            database: dbQueryTime,
            processing: totalTime - dbQueryTime,
            timestamp: new Date().toISOString()
        };

        res.json({
            success: true,
            data: responseTimes
        });

    } catch (error) {
        logger.error('Error measuring response times:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to measure response times'
        });
    }
}));

// 캐시 통계
router.get('/cache-stats', asyncHandler(async (req, res) => {
    try {
        // Redis 정보 가져오기
        const info = await cache.info();

        const cacheStats = {
            info: info,
            timestamp: new Date().toISOString()
        };

        res.json({
            success: true,
            data: cacheStats
        });

    } catch (error) {
        logger.error('Error fetching cache stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch cache statistics'
        });
    }
}));

// 시스템 상태 요약
router.get('/health-summary', asyncHandler(async (req, res) => {
    try {
        const memoryUsage = process.memoryUsage();
        const uptime = process.uptime();

        // 데이터베이스 상태
        let dbHealthy = false;
        try {
            await sequelize.authenticate();
            dbHealthy = true;
        } catch (error) {
            dbHealthy = false;
        }

        // Redis 상태
        let redisHealthy = false;
        try {
            await cache.ping();
            redisHealthy = true;
        } catch (error) {
            redisHealthy = false;
        }

        const healthSummary = {
            status: dbHealthy && redisHealthy ? 'healthy' : 'unhealthy',
            uptime: Math.floor(uptime),
            memoryUsage: Math.round(memoryUsage.rss / 1024 / 1024), // MB
            services: {
                database: dbHealthy ? 'healthy' : 'unhealthy',
                redis: redisHealthy ? 'healthy' : 'unhealthy',
                api: 'healthy'
            },
            timestamp: new Date().toISOString()
        };

        res.json({
            success: true,
            data: healthSummary
        });

    } catch (error) {
        logger.error('Error fetching health summary:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch health summary'
        });
    }
}));

module.exports = router;
