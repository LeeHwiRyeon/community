const express = require('express');
const { asyncHandler, AuthenticationError, AuthorizationError } = require('../middleware/errorHandler');
const User = require('../models/User');
const { cache } = require('../config/redis');
const { logger } = require('../utils/logger');

const router = express.Router();

// 인증 미들웨어
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new AuthenticationError('인증 토큰이 필요합니다');
    }

    const token = authHeader.substring(7);

    try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch (error) {
        throw new AuthenticationError('유효하지 않은 토큰입니다');
    }
};

// 권한 확인 미들웨어
const requireRole = (roles) => {
    return async (req, res, next) => {
        const user = await User.findByPk(req.userId);
        if (!user) {
            throw new AuthenticationError('사용자를 찾을 수 없습니다');
        }

        const userRoles = Array.isArray(roles) ? roles : [roles];
        if (!userRoles.includes(user.role)) {
            throw new AuthorizationError('접근 권한이 없습니다');
        }

        req.user = user;
        next();
    };
};

// 대시보드 개요 데이터 (테스트용 - 인증 없이)
router.get('/overview', asyncHandler(async (req, res) => {
    const cacheKey = 'dashboard:overview';

    // 캐시에서 데이터 확인
    let overviewData = await cache.get(cacheKey);

    if (!overviewData) {
        // 사용자 통계
        const totalUsers = await User.count();
        const activeUsers = await User.count({ where: { status: 'active' } });
        const newUsersToday = await User.count({
            where: {
                createdAt: {
                    [require('sequelize').Op.gte]: new Date(new Date().setHours(0, 0, 0, 0))
                }
            }
        });

        // 등급별 사용자 수
        const usersByRole = await User.findAll({
            attributes: [
                'role',
                [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
            ],
            group: ['role'],
            raw: true
        });

        // 상태별 사용자 수
        const usersByStatus = await User.findAll({
            attributes: [
                'status',
                [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
            ],
            group: ['status'],
            raw: true
        });

        overviewData = {
            stats: {
                totalUsers,
                activeUsers,
                newUsersToday,
                inactiveUsers: totalUsers - activeUsers
            },
            usersByRole: usersByRole.reduce((acc, item) => {
                acc[item.role] = parseInt(item.count);
                return acc;
            }, {}),
            usersByStatus: usersByStatus.reduce((acc, item) => {
                acc[item.status] = parseInt(item.count);
                return acc;
            }, {}),
            lastUpdated: new Date().toISOString()
        };

        // 캐시에 저장 (5분)
        await cache.set(cacheKey, overviewData, 300);
    }

    res.json({
        success: true,
        data: overviewData
    });
}));

// 사용자 관리 데이터
router.get('/users', authenticateToken, requireRole(['owner', 'admin']), asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, role, status, search } = req.query;
    const offset = (page - 1) * limit;

    // 검색 조건 구성
    const whereClause = {};
    if (role) whereClause.role = role;
    if (status) whereClause.status = status;
    if (search) {
        whereClause[require('sequelize').Op.or] = [
            { firstName: { [require('sequelize').Op.like]: `%${search}%` } },
            { lastName: { [require('sequelize').Op.like]: `%${search}%` } },
            { email: { [require('sequelize').Op.like]: `%${search}%` } },
            { username: { [require('sequelize').Op.like]: `%${search}%` } }
        ];
    }

    const { count, rows: users } = await User.findAndCountAll({
        where: whereClause,
        attributes: { exclude: ['password', 'twoFactorSecret', 'emailVerificationToken', 'passwordResetToken'] },
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
    });

    res.json({
        success: true,
        data: {
            users: users.map(user => user.getPublicProfile()),
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(count / limit),
                totalItems: count,
                itemsPerPage: parseInt(limit)
            }
        }
    });
}));

// 등급별 통계
router.get('/roles', authenticateToken, requireRole(['owner', 'admin']), asyncHandler(async (req, res) => {
    const cacheKey = 'dashboard:roles';

    let roleData = await cache.get(cacheKey);

    if (!roleData) {
        const roles = ['owner', 'admin', 'vip', 'streamer', 'cosplayer', 'manager', 'user'];
        const roleStats = [];

        for (const role of roles) {
            const count = await User.count({ where: { role } });
            const activeCount = await User.count({ where: { role, status: 'active' } });

            roleStats.push({
                role,
                totalUsers: count,
                activeUsers: activeCount,
                inactiveUsers: count - activeCount
            });
        }

        roleData = {
            roles: roleStats,
            lastUpdated: new Date().toISOString()
        };

        // 캐시에 저장 (10분)
        await cache.set(cacheKey, roleData, 600);
    }

    res.json({
        success: true,
        data: roleData
    });
}));

// 실시간 활동 데이터
router.get('/activity', authenticateToken, asyncHandler(async (req, res) => {
    const cacheKey = 'dashboard:activity';

    let activityData = await cache.get(cacheKey);

    if (!activityData) {
        // 최근 24시간 로그인한 사용자
        const recentLogins = await User.count({
            where: {
                lastLoginAt: {
                    [require('sequelize').Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000)
                }
            }
        });

        // 오늘 가입한 사용자
        const todayRegistrations = await User.count({
            where: {
                createdAt: {
                    [require('sequelize').Op.gte]: new Date(new Date().setHours(0, 0, 0, 0))
                }
            }
        });

        // 최근 7일간의 일별 가입자 수
        const dailyRegistrations = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const startOfDay = new Date(date.setHours(0, 0, 0, 0));
            const endOfDay = new Date(date.setHours(23, 59, 59, 999));

            const count = await User.count({
                where: {
                    createdAt: {
                        [require('sequelize').Op.between]: [startOfDay, endOfDay]
                    }
                }
            });

            dailyRegistrations.push({
                date: startOfDay.toISOString().split('T')[0],
                count
            });
        }

        activityData = {
            recentLogins,
            todayRegistrations,
            dailyRegistrations,
            lastUpdated: new Date().toISOString()
        };

        // 캐시에 저장 (1분)
        await cache.set(cacheKey, activityData, 60);
    }

    res.json({
        success: true,
        data: activityData
    });
}));

// 시스템 상태
router.get('/system-status', authenticateToken, requireRole(['owner', 'admin']), asyncHandler(async (req, res) => {
    const systemStatus = {
        database: 'connected',
        redis: 'connected',
        server: 'running',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString()
    };

    res.json({
        success: true,
        data: systemStatus
    });
}));

// 캐시 초기화
router.post('/clear-cache', authenticateToken, requireRole(['owner']), asyncHandler(async (req, res) => {
    const { pattern = '*' } = req.body;

    if (pattern === '*') {
        // 모든 캐시 삭제
        await cache.delPattern('dashboard:*');
        await cache.delPattern('user:*');
    } else {
        // 특정 패턴의 캐시만 삭제
        await cache.delPattern(pattern);
    }

    logger.info(`Cache cleared by user ${req.userId}: ${pattern}`);

    res.json({
        success: true,
        message: '캐시가 성공적으로 초기화되었습니다'
    });
}));

module.exports = router;
