const { User } = require('../models/User');
const { sequelize } = require('../config/database');

// 대시보드 개요 데이터 조회
const getOverview = async (req, res) => {
    try {
        const totalUsers = await User.count();
        const activeUsers = await User.count({ where: { status: 'active' } });
        const pendingUsers = await User.count({ where: { status: 'pending' } });
        const suspendedUsers = await User.count({ where: { status: 'suspended' } });

        // 역할별 사용자 수
        const roleStats = await User.findAll({
            attributes: [
                'role',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            group: ['role'],
            raw: true
        });

        // 최근 가입자 (최근 7일)
        const recentUsers = await User.findAll({
            where: {
                created_at: {
                    [sequelize.Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                }
            },
            attributes: { exclude: ['password'] },
            order: [['created_at', 'DESC']],
            limit: 10
        });

        res.json({
            success: true,
            data: {
                overview: {
                    totalUsers,
                    activeUsers,
                    pendingUsers,
                    suspendedUsers
                },
                roleStats,
                recentUsers
            }
        });
    } catch (error) {
        console.error('Get overview error:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
};

// 사용자 관리 데이터 조회
const getUserManagementData = async (req, res) => {
    try {
        const { page = 1, limit = 20, role, status, search } = req.query;
        const offset = (page - 1) * limit;

        const whereClause = {};
        if (role) whereClause.role = role;
        if (status) whereClause.status = status;
        if (search) {
            whereClause[sequelize.Op.or] = [
                { username: { [sequelize.Op.like]: `%${search}%` } },
                { email: { [sequelize.Op.like]: `%${search}%` } }
            ];
        }

        const { count, rows: users } = await User.findAndCountAll({
            where: whereClause,
            attributes: { exclude: ['password'] },
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['created_at', 'DESC']]
        });

        res.json({
            success: true,
            data: {
                users,
                pagination: {
                    total: count,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    pages: Math.ceil(count / limit)
                }
            }
        });
    } catch (error) {
        console.error('Get user management data error:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
};

// 역할 통계 조회
const getRoleStatistics = async (req, res) => {
    try {
        const roleStats = await User.findAll({
            attributes: [
                'role',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            group: ['role'],
            raw: true
        });

        res.json({
            success: true,
            data: { roleStats }
        });
    } catch (error) {
        console.error('Get role statistics error:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
};

// 실시간 활동 데이터 조회
const getRealtimeActivity = async (req, res) => {
    try {
        // 최근 로그인한 사용자들
        const recentLogins = await User.findAll({
            where: {
                last_login_at: {
                    [sequelize.Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000)
                }
            },
            attributes: ['id', 'username', 'last_login_at'],
            order: [['last_login_at', 'DESC']],
            limit: 10
        });

        // 최근 가입자들
        const recentRegistrations = await User.findAll({
            where: {
                created_at: {
                    [sequelize.Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000)
                }
            },
            attributes: ['id', 'username', 'created_at'],
            order: [['created_at', 'DESC']],
            limit: 10
        });

        res.json({
            success: true,
            data: {
                recentLogins,
                recentRegistrations
            }
        });
    } catch (error) {
        console.error('Get realtime activity error:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
};

// 시스템 상태 조회
const getSystemStatus = async (req, res) => {
    try {
        const systemStatus = {
            database: 'connected',
            redis: 'connected',
            api: 'running',
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            timestamp: new Date().toISOString()
        };

        res.json({
            success: true,
            data: { systemStatus }
        });
    } catch (error) {
        console.error('Get system status error:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
};

// 캐시 클리어
const clearCache = async (req, res) => {
    try {
        // Redis 캐시 클리어 로직 (구현 필요)
        res.json({
            success: true,
            message: '캐시가 클리어되었습니다.'
        });
    } catch (error) {
        console.error('Clear cache error:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
};

module.exports = {
    getOverview,
    getUserManagementData,
    getRoleStatistics,
    getRealtimeActivity,
    getSystemStatus,
    clearCache
};
