const { User } = require('../models/User');
const { sequelize } = require('../config/database');

// 모든 역할 조회
const getAllRoles = async (req, res) => {
    try {
        const roles = [
            { name: 'owner', displayName: '소유자', level: 1 },
            { name: 'admin', displayName: '관리자', level: 2 },
            { name: 'vip', displayName: 'VIP', level: 3 },
            { name: 'streamer', displayName: '스트리머', level: 4 },
            { name: 'cosplayer', displayName: '코스플레이어', level: 4 },
            { name: 'manager', displayName: '매니저', level: 5 },
            { name: 'user', displayName: '일반 사용자', level: 6 }
        ];

        res.json({
            success: true,
            data: { roles }
        });
    } catch (error) {
        console.error('Get all roles error:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
};

// 특정 역할 조회
const getRoleByName = async (req, res) => {
    try {
        const { roleName } = req.params;

        const roleMap = {
            'owner': { name: 'owner', displayName: '소유자', level: 1 },
            'admin': { name: 'admin', displayName: '관리자', level: 2 },
            'vip': { name: 'vip', displayName: 'VIP', level: 3 },
            'streamer': { name: 'streamer', displayName: '스트리머', level: 4 },
            'cosplayer': { name: 'cosplayer', displayName: '코스플레이어', level: 4 },
            'manager': { name: 'manager', displayName: '매니저', level: 5 },
            'user': { name: 'user', displayName: '일반 사용자', level: 6 }
        };

        const role = roleMap[roleName];
        if (!role) {
            return res.status(404).json({
                success: false,
                message: '역할을 찾을 수 없습니다.'
            });
        }

        res.json({
            success: true,
            data: { role }
        });
    } catch (error) {
        console.error('Get role by name error:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
};

// 역할별 사용자 조회
const getUsersByRole = async (req, res) => {
    try {
        const { roleName } = req.params;
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        const { count, rows: users } = await User.findAndCountAll({
            where: { role: roleName },
            attributes: { exclude: ['password'] },
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['created_at', 'DESC']]
        });

        res.json({
            success: true,
            data: {
                users,
                role: roleName,
                pagination: {
                    total: count,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    pages: Math.ceil(count / limit)
                }
            }
        });
    } catch (error) {
        console.error('Get users by role error:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
};

// 권한 매트릭스 조회
const getPermissionMatrix = async (req, res) => {
    try {
        const permissions = {
            'owner': {
                'user_management': true,
                'role_management': true,
                'system_settings': true,
                'content_management': true,
                'analytics': true,
                'billing': true
            },
            'admin': {
                'user_management': true,
                'role_management': false,
                'system_settings': false,
                'content_management': true,
                'analytics': true,
                'billing': false
            },
            'vip': {
                'user_management': false,
                'role_management': false,
                'system_settings': false,
                'content_management': true,
                'analytics': true,
                'billing': false
            },
            'streamer': {
                'user_management': false,
                'role_management': false,
                'system_settings': false,
                'content_management': true,
                'analytics': true,
                'billing': true
            },
            'cosplayer': {
                'user_management': false,
                'role_management': false,
                'system_settings': false,
                'content_management': true,
                'analytics': true,
                'billing': true
            },
            'manager': {
                'user_management': true,
                'role_management': false,
                'system_settings': false,
                'content_management': true,
                'analytics': false,
                'billing': false
            },
            'user': {
                'user_management': false,
                'role_management': false,
                'system_settings': false,
                'content_management': false,
                'analytics': false,
                'billing': false
            }
        };

        res.json({
            success: true,
            data: { permissions }
        });
    } catch (error) {
        console.error('Get permission matrix error:', error);
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

        const totalUsers = await User.count();

        res.json({
            success: true,
            data: {
                roleStats,
                totalUsers
            }
        });
    } catch (error) {
        console.error('Get role statistics error:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
};

module.exports = {
    getAllRoles,
    getRoleByName,
    getUsersByRole,
    getPermissionMatrix,
    getRoleStatistics
};
