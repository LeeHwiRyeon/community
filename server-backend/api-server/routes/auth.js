const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { asyncHandler, AuthenticationError, ValidationError, ConflictError } = require('../middleware/errorHandler');
const { User } = require('../models/User');
const { cache } = require('../config/redis');
const logger = require('../utils/logger');

const router = express.Router();

// JWT 토큰 생성
const generateToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '7d'
    });
};

// 리프레시 토큰 생성
const generateRefreshToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
        expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d'
    });
};

// 회원가입
router.post('/register', [
    body('username')
        .isLength({ min: 3, max: 50 })
        .withMessage('사용자명은 3-50자 사이여야 합니다')
        .isAlphanumeric()
        .withMessage('사용자명은 영문자와 숫자만 사용 가능합니다'),
    body('email')
        .isEmail()
        .withMessage('유효한 이메일 주소를 입력하세요')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 6 })
        .withMessage('비밀번호는 최소 6자 이상이어야 합니다')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('비밀번호는 대문자, 소문자, 숫자를 포함해야 합니다'),
    body('firstName')
        .isLength({ min: 1, max: 50 })
        .withMessage('이름은 1-50자 사이여야 합니다'),
    body('lastName')
        .isLength({ min: 1, max: 50 })
        .withMessage('성은 1-50자 사이여야 합니다')
], asyncHandler(async (req, res) => {
    // 유효성 검사
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw new ValidationError('입력 데이터가 유효하지 않습니다', errors.array());
    }

    const { username, email, password, firstName, lastName, role = 'user' } = req.body;

    // 이메일 중복 확인
    const existingUserByEmail = await User.findByEmail(email);
    if (existingUserByEmail) {
        throw new ConflictError('이미 사용 중인 이메일입니다');
    }

    // 사용자명 중복 확인
    const existingUserByUsername = await User.findByUsername(username);
    if (existingUserByUsername) {
        throw new ConflictError('이미 사용 중인 사용자명입니다');
    }

    // 사용자 생성
    const user = await User.create({
        username,
        email,
        password,
        firstName,
        lastName,
        role
    });

    // 토큰 생성
    const token = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // 리프레시 토큰을 Redis에 저장
    await cache.set(`refresh_token:${user.id}`, refreshToken, 30 * 24 * 60 * 60); // 30일

    logger.info(`New user registered: ${user.email}`);

    res.status(201).json({
        success: true,
        message: '회원가입이 완료되었습니다',
        data: {
            user: user.getPublicProfile(),
            token,
            refreshToken
        }
    });
}));

// 로그인
router.post('/login', [
    body('email')
        .isEmail()
        .withMessage('유효한 이메일 주소를 입력하세요')
        .normalizeEmail(),
    body('password')
        .notEmpty()
        .withMessage('비밀번호를 입력하세요')
], asyncHandler(async (req, res) => {
    // 유효성 검사
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw new ValidationError('입력 데이터가 유효하지 않습니다', errors.array());
    }

    const { email, password } = req.body;

    // 사용자 찾기
    const user = await User.findByEmail(email);
    if (!user) {
        throw new AuthenticationError('이메일 또는 비밀번호가 올바르지 않습니다');
    }

    // 비밀번호 확인
    const isPasswordValid = await user.validatePassword(password);
    if (!isPasswordValid) {
        throw new AuthenticationError('이메일 또는 비밀번호가 올바르지 않습니다');
    }

    // 계정 상태 확인
    if (!user.isActive()) {
        throw new AuthenticationError('계정이 비활성화되었습니다. 관리자에게 문의하세요');
    }

    // 로그인 정보 업데이트
    user.lastLoginAt = new Date();
    user.lastLoginIp = req.ip;
    user.loginCount += 1;
    await user.save();

    // 토큰 생성
    const token = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // 리프레시 토큰을 Redis에 저장
    await cache.set(`refresh_token:${user.id}`, refreshToken, 30 * 24 * 60 * 60); // 30일

    // 사용자 정보를 캐시에 저장
    await cache.set(`user:${user.id}`, user.getPublicProfile(), 3600); // 1시간

    logger.info(`User logged in: ${user.email}`);

    res.json({
        success: true,
        message: '로그인 성공',
        data: {
            user: user.getPublicProfile(),
            token,
            refreshToken
        }
    });
}));

// 토큰 갱신
router.post('/refresh', [
    body('refreshToken')
        .notEmpty()
        .withMessage('리프레시 토큰이 필요합니다')
], asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    try {
        // 리프레시 토큰 검증
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const userId = decoded.userId;

        // Redis에서 리프레시 토큰 확인
        const storedRefreshToken = await cache.get(`refresh_token:${userId}`);
        if (!storedRefreshToken || storedRefreshToken !== refreshToken) {
            throw new AuthenticationError('유효하지 않은 리프레시 토큰입니다');
        }

        // 사용자 확인
        const user = await User.findByPk(userId);
        if (!user || !user.isActive()) {
            throw new AuthenticationError('사용자를 찾을 수 없습니다');
        }

        // 새 토큰 생성
        const newToken = generateToken(user.id);
        const newRefreshToken = generateRefreshToken(user.id);

        // 새 리프레시 토큰을 Redis에 저장
        await cache.set(`refresh_token:${userId}`, newRefreshToken, 30 * 24 * 60 * 60);

        res.json({
            success: true,
            message: '토큰이 갱신되었습니다',
            data: {
                token: newToken,
                refreshToken: newRefreshToken
            }
        });
    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            throw new AuthenticationError('유효하지 않은 리프레시 토큰입니다');
        }
        throw error;
    }
}));

// 로그아웃
router.post('/logout', asyncHandler(async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.json({
            success: true,
            message: '로그아웃되었습니다'
        });
    }

    const token = authHeader.substring(7);

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        // 리프레시 토큰 삭제
        await cache.del(`refresh_token:${userId}`);

        // 사용자 캐시 삭제
        await cache.del(`user:${userId}`);

        logger.info(`User logged out: ${userId}`);
    } catch (error) {
        // 토큰이 유효하지 않아도 로그아웃은 성공으로 처리
        logger.warn('Invalid token during logout:', error.message);
    }

    res.json({
        success: true,
        message: '로그아웃되었습니다'
    });
}));

// 현재 사용자 정보 조회
router.get('/me', asyncHandler(async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new AuthenticationError('인증 토큰이 필요합니다');
    }

    const token = authHeader.substring(7);

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        // 캐시에서 사용자 정보 확인
        let user = await cache.get(`user:${userId}`);

        if (!user) {
            // 캐시에 없으면 데이터베이스에서 조회
            const dbUser = await User.findByPk(userId);
            if (!dbUser || !dbUser.isActive()) {
                throw new AuthenticationError('사용자를 찾을 수 없습니다');
            }
            user = dbUser.getPublicProfile();

            // 캐시에 저장
            await cache.set(`user:${userId}`, user, 3600);
        }

        res.json({
            success: true,
            data: { user }
        });
    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            throw new AuthenticationError('유효하지 않은 토큰입니다');
        }
        throw error;
    }
}));

// 비밀번호 변경
router.put('/change-password', [
    body('currentPassword')
        .notEmpty()
        .withMessage('현재 비밀번호를 입력하세요'),
    body('newPassword')
        .isLength({ min: 6 })
        .withMessage('새 비밀번호는 최소 6자 이상이어야 합니다')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('새 비밀번호는 대문자, 소문자, 숫자를 포함해야 합니다')
], asyncHandler(async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new AuthenticationError('인증 토큰이 필요합니다');
    }

    const token = authHeader.substring(7);
    const { currentPassword, newPassword } = req.body;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const user = await User.findByPk(userId);
    if (!user) {
        throw new AuthenticationError('사용자를 찾을 수 없습니다');
    }

    // 현재 비밀번호 확인
    const isCurrentPasswordValid = await user.validatePassword(currentPassword);
    if (!isCurrentPasswordValid) {
        throw new AuthenticationError('현재 비밀번호가 올바르지 않습니다');
    }

    // 새 비밀번호로 업데이트
    user.password = newPassword;
    await user.save();

    // 사용자 캐시 삭제
    await cache.del(`user:${userId}`);

    logger.info(`Password changed for user: ${user.email}`);

    res.json({
        success: true,
        message: '비밀번호가 성공적으로 변경되었습니다'
    });
}));

module.exports = router;
