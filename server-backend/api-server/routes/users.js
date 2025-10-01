const express = require('express');
const { body, validationResult } = require('express-validator');
const { asyncHandler, AuthenticationError, AuthorizationError, ValidationError, NotFoundError } = require('../middleware/errorHandler');
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

// 모든 사용자 조회
router.get('/', authenticateToken, requireRole(['owner', 'admin']), asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, role, status, search, sortBy = 'createdAt', sortOrder = 'DESC' } = req.query;
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
        order: [[sortBy, sortOrder.toUpperCase()]],
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

// 특정 사용자 조회
router.get('/:id', authenticateToken, asyncHandler(async (req, res) => {
    const { id } = req.params;
    const currentUser = await User.findByPk(req.userId);

    // 본인 정보이거나 관리자 권한이 있는 경우만 조회 가능
    if (id !== req.userId && !['owner', 'admin'].includes(currentUser.role)) {
        throw new AuthorizationError('접근 권한이 없습니다');
    }

    const user = await User.findByPk(id);
    if (!user) {
        throw new NotFoundError('사용자를 찾을 수 없습니다');
    }

    res.json({
        success: true,
        data: { user: user.getPublicProfile() }
    });
}));

// 사용자 정보 수정
router.put('/:id', authenticateToken, [
    body('firstName').optional().isLength({ min: 1, max: 50 }).withMessage('이름은 1-50자 사이여야 합니다'),
    body('lastName').optional().isLength({ min: 1, max: 50 }).withMessage('성은 1-50자 사이여야 합니다'),
    body('phone').optional().isMobilePhone('ko-KR').withMessage('유효한 전화번호를 입력하세요'),
    body('bio').optional().isLength({ max: 1000 }).withMessage('소개는 1000자 이하여야 합니다'),
    body('website').optional().isURL().withMessage('유효한 URL을 입력하세요')
], asyncHandler(async (req, res) => {
    const { id } = req.params;
    const currentUser = await User.findByPk(req.userId);

    // 본인 정보이거나 관리자 권한이 있는 경우만 수정 가능
    if (id !== req.userId && !['owner', 'admin'].includes(currentUser.role)) {
        throw new AuthorizationError('접근 권한이 없습니다');
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw new ValidationError('입력 데이터가 유효하지 않습니다', errors.array());
    }

    const user = await User.findByPk(id);
    if (!user) {
        throw new NotFoundError('사용자를 찾을 수 없습니다');
    }

    const allowedFields = ['firstName', 'lastName', 'phone', 'bio', 'website', 'socialLinks', 'preferences'];
    const updateData = {};

    allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
            updateData[field] = req.body[field];
        }
    });

    await user.update(updateData);

    // 사용자 캐시 삭제
    await cache.del(`user:${user.id}`);

    logger.info(`User profile updated: ${user.email}`);

    res.json({
        success: true,
        message: '사용자 정보가 성공적으로 업데이트되었습니다',
        data: { user: user.getPublicProfile() }
    });
}));

// 사용자 등급 변경
router.put('/:id/role', authenticateToken, requireRole(['owner', 'admin']), [
    body('role').isIn(['owner', 'admin', 'vip', 'streamer', 'cosplayer', 'manager', 'user']).withMessage('유효하지 않은 등급입니다')
], asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
        throw new NotFoundError('사용자를 찾을 수 없습니다');
    }

    // Owner 등급은 다른 Owner만 변경 가능
    if (role === 'owner' && req.user.role !== 'owner') {
        throw new AuthorizationError('Owner 등급은 Owner만 변경할 수 있습니다');
    }

    await user.update({ role });

    // 사용자 캐시 삭제
    await cache.del(`user:${user.id}`);

    logger.info(`User role changed: ${user.email} -> ${role}`);

    res.json({
        success: true,
        message: '사용자 등급이 성공적으로 변경되었습니다',
        data: { user: user.getPublicProfile() }
    });
}));

// 사용자 상태 변경
router.put('/:id/status', authenticateToken, requireRole(['owner', 'admin']), [
    body('status').isIn(['active', 'inactive', 'suspended', 'pending']).withMessage('유효하지 않은 상태입니다')
], asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
        throw new NotFoundError('사용자를 찾을 수 없습니다');
    }

    await user.update({ status });

    // 사용자 캐시 삭제
    await cache.del(`user:${user.id}`);

    logger.info(`User status changed: ${user.email} -> ${status}`);

    res.json({
        success: true,
        message: '사용자 상태가 성공적으로 변경되었습니다',
        data: { user: user.getPublicProfile() }
    });
}));

// 사용자 삭제 (소프트 삭제)
router.delete('/:id', authenticateToken, requireRole(['owner', 'admin']), asyncHandler(async (req, res) => {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
        throw new NotFoundError('사용자를 찾을 수 없습니다');
    }

    // Owner는 삭제할 수 없음
    if (user.role === 'owner') {
        throw new AuthorizationError('Owner는 삭제할 수 없습니다');
    }

    await user.update({ status: 'inactive' });

    // 사용자 캐시 삭제
    await cache.del(`user:${user.id}`);

    logger.info(`User deactivated: ${user.email}`);

    res.json({
        success: true,
        message: '사용자가 성공적으로 비활성화되었습니다'
    });
}));

module.exports = router;
