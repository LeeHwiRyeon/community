const express = require('express');
const { asyncHandler, AuthenticationError, AuthorizationError } = require('../middleware/errorHandler');
const { User } = require('../models/User');
const { cache } = require('../config/redis');
const logger = require('../utils/logger');

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

// 등급별 권한 정의
const rolePermissions = {
    owner: {
        name: 'Owner',
        description: '시스템 전체 관리',
        permissions: ['all'],
        level: 7
    },
    admin: {
        name: 'Admin',
        description: '관리자 권한',
        permissions: ['user_management', 'content_management', 'approval', 'statistics'],
        level: 6
    },
    vip: {
        name: 'VIP',
        description: '특별 회원',
        permissions: ['premium_features', 'priority_support', 'custom_ui'],
        level: 5
    },
    streamer: {
        name: 'Streamer',
        description: '스트리머',
        permissions: ['broadcast_management', 'fan_management', 'revenue_tracking', 'content_creation'],
        level: 4
    },
    cosplayer: {
        name: 'Cosplayer',
        description: '코스플레이어',
        permissions: ['costume_management', 'portfolio', 'shop_management', 'event_participation'],
        level: 3
    },
    manager: {
        name: 'Manager',
        description: '매니저',
        permissions: ['team_management', 'task_assignment', 'progress_tracking', 'reporting'],
        level: 2
    },
    user: {
        name: 'General User',
        description: '일반 사용자',
        permissions: ['basic_features', 'community_participation', 'content_consumption', 'feedback'],
        level: 1
    }
};

// 모든 등급 정보 조회
router.get('/', authenticateToken, asyncHandler(async (req, res) => {
    const cacheKey = 'roles:all';

    let rolesData = await cache.get(cacheKey);

    if (!rolesData) {
        // 각 등급별 사용자 수 조회
        const roleStats = [];

        for (const [roleKey, roleInfo] of Object.entries(rolePermissions)) {
            const totalUsers = await User.count({ where: { role: roleKey } });
            const activeUsers = await User.count({ where: { role: roleKey, status: 'active' } });

            roleStats.push({
                ...roleInfo,
                key: roleKey,
                totalUsers,
                activeUsers,
                inactiveUsers: totalUsers - activeUsers
            });
        }

        rolesData = {
            roles: roleStats,
            lastUpdated: new Date().toISOString()
        };

        // 캐시에 저장 (10분)
        await cache.set(cacheKey, rolesData, 600);
    }

    res.json({
        success: true,
        data: rolesData
    });
}));

// 특정 등급 정보 조회
router.get('/:role', authenticateToken, asyncHandler(async (req, res) => {
    const { role } = req.params;

    if (!rolePermissions[role]) {
        return res.status(404).json({
            success: false,
            error: { message: '등급을 찾을 수 없습니다' }
        });
    }

    const cacheKey = `roles:${role}`;

    let roleData = await cache.get(cacheKey);

    if (!roleData) {
        const totalUsers = await User.count({ where: { role } });
        const activeUsers = await User.count({ where: { role, status: 'active' } });

        roleData = {
            ...rolePermissions[role],
            key: role,
            totalUsers,
            activeUsers,
            inactiveUsers: totalUsers - activeUsers,
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

// 등급별 사용자 목록 조회
router.get('/:role/users', authenticateToken, requireRole(['owner', 'admin']), asyncHandler(async (req, res) => {
    const { role } = req.params;
    const { page = 1, limit = 10, status, search } = req.query;
    const offset = (page - 1) * limit;

    if (!rolePermissions[role]) {
        return res.status(404).json({
            success: false,
            error: { message: '등급을 찾을 수 없습니다' }
        });
    }

    // 검색 조건 구성
    const whereClause = { role };
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
            role: rolePermissions[role],
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

// 권한 매트릭스 조회
router.get('/permissions/matrix', authenticateToken, asyncHandler(async (req, res) => {
    const cacheKey = 'roles:permissions:matrix';

    let matrixData = await cache.get(cacheKey);

    if (!matrixData) {
        const permissions = [
            'system_settings',
            'user_management',
            'content_management',
            'revenue_management',
            'statistics_view',
            'community_participation',
            'premium_features',
            'priority_support',
            'custom_ui',
            'broadcast_management',
            'fan_management',
            'costume_management',
            'portfolio_management',
            'shop_management',
            'team_management',
            'task_assignment',
            'progress_tracking',
            'reporting'
        ];

        const matrix = [];

        for (const [roleKey, roleInfo] of Object.entries(rolePermissions)) {
            const rolePermissions = [];

            for (const permission of permissions) {
                let hasPermission = false;

                if (roleInfo.permissions.includes('all')) {
                    hasPermission = true;
                } else if (roleInfo.permissions.includes(permission)) {
                    hasPermission = true;
                } else if (permission === 'community_participation') {
                    // 모든 등급이 커뮤니티 참여 가능
                    hasPermission = true;
                }

                rolePermissions.push({
                    permission,
                    hasAccess: hasPermission
                });
            }

            matrix.push({
                role: roleKey,
                roleName: roleInfo.name,
                permissions: rolePermissions
            });
        }

        matrixData = {
            permissions,
            matrix,
            lastUpdated: new Date().toISOString()
        };

        // 캐시에 저장 (30분)
        await cache.set(cacheKey, matrixData, 1800);
    }

    res.json({
        success: true,
        data: matrixData
    });
}));

// 등급별 통계
router.get('/stats/summary', authenticateToken, requireRole(['owner', 'admin']), asyncHandler(async (req, res) => {
    const cacheKey = 'roles:stats:summary';

    let statsData = await cache.get(cacheKey);

    if (!statsData) {
        const roleStats = [];

        for (const [roleKey, roleInfo] of Object.entries(rolePermissions)) {
            const totalUsers = await User.count({ where: { role: roleKey } });
            const activeUsers = await User.count({ where: { role: roleKey, status: 'active' } });
            const newUsersThisMonth = await User.count({
                where: {
                    role: roleKey,
                    createdAt: {
                        [require('sequelize').Op.gte]: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                    }
                }
            });

            roleStats.push({
                role: roleKey,
                roleName: roleInfo.name,
                level: roleInfo.level,
                totalUsers,
                activeUsers,
                inactiveUsers: totalUsers - activeUsers,
                newUsersThisMonth,
                activityRate: totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0
            });
        }

        // 등급별로 정렬 (높은 등급부터)
        roleStats.sort((a, b) => b.level - a.level);

        statsData = {
            roleStats,
            totalUsers: roleStats.reduce((sum, role) => sum + role.totalUsers, 0),
            totalActiveUsers: roleStats.reduce((sum, role) => sum + role.activeUsers, 0),
            lastUpdated: new Date().toISOString()
        };

        // 캐시에 저장 (5분)
        await cache.set(cacheKey, statsData, 300);
    }

    res.json({
        success: true,
        data: statsData
    });
}));

module.exports = router;
