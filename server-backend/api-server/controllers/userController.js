const { User } = require('../models');
const logger = require('../utils/logger');

// 모든 사용자 조회
const getUsers = async (req, res) => {
    try {
        const { page = 1, limit = 10, role, status } = req.query;
        const offset = (page - 1) * limit;

        const whereClause = {};
        if (role) whereClause.role = role;
        if (status) whereClause.status = status;

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
        logger.error('Get users error:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
};

// 특정 사용자 조회
const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findByPk(id, {
            attributes: { exclude: ['password'] }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: '사용자를 찾을 수 없습니다.'
            });
        }

        res.json({
            success: true,
            data: { user }
        });
    } catch (error) {
        logger.error('Get user by ID error:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
};

// 사용자 정보 수정
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // 비밀번호는 별도 처리
        if (updateData.password) {
            delete updateData.password;
        }

        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: '사용자를 찾을 수 없습니다.'
            });
        }

        await user.update(updateData);

        res.json({
            success: true,
            message: '사용자 정보가 수정되었습니다.',
            data: { user }
        });
    } catch (error) {
        logger.error('Update user error:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
};

// 사용자 역할 변경
const changeUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: '사용자를 찾을 수 없습니다.'
            });
        }

        await user.update({ role });

        res.json({
            success: true,
            message: '사용자 역할이 변경되었습니다.',
            data: { user }
        });
    } catch (error) {
        logger.error('Change user role error:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
};

// 사용자 상태 변경
const changeUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: '사용자를 찾을 수 없습니다.'
            });
        }

        await user.update({ status });

        res.json({
            success: true,
            message: '사용자 상태가 변경되었습니다.',
            data: { user }
        });
    } catch (error) {
        logger.error('Change user status error:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
};

// 사용자 삭제
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: '사용자를 찾을 수 없습니다.'
            });
        }

        await user.destroy();

        res.json({
            success: true,
            message: '사용자가 삭제되었습니다.'
        });
    } catch (error) {
        logger.error('Delete user error:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
};

module.exports = {
    getUsers,
    getUserById,
    updateUser,
    changeUserRole,
    changeUserStatus,
    deleteUser
};
