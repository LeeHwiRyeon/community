const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const logger = require('../utils/logger');

// JWT 토큰 생성
const generateToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET || 'fallback_secret', {
        expiresIn: process.env.JWT_EXPIRE || '7d'
    });
};

// 사용자 등록
const register = async (req, res) => {
    try {
        const { username, email, password, firstName, lastName } = req.body;

        // 이메일 중복 확인
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: '이미 등록된 이메일입니다.'
            });
        }

        // 사용자 생성
        const user = await User.create({
            username,
            email,
            password,
            first_name: firstName,
            last_name: lastName,
            role: 'user',
            status: 'pending'
        });

        const token = generateToken(user.id);

        res.status(201).json({
            success: true,
            message: '회원가입이 완료되었습니다.',
            data: {
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    status: user.status
                },
                token
            }
        });
    } catch (error) {
        logger.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
};

// 사용자 로그인
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 사용자 찾기
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: '이메일 또는 비밀번호가 올바르지 않습니다.'
            });
        }

        // 비밀번호 확인
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: '이메일 또는 비밀번호가 올바르지 않습니다.'
            });
        }

        // 로그인 시간 업데이트
        await user.update({
            last_login_at: new Date(),
            login_count: (user.login_count || 0) + 1
        });

        const token = generateToken(user.id);

        res.json({
            success: true,
            message: '로그인되었습니다.',
            data: {
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    status: user.status
                },
                token
            }
        });
    } catch (error) {
        logger.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
};

// 현재 사용자 정보 조회
const getMe = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
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
        logger.error('Get me error:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
};

module.exports = {
    register,
    login,
    getMe
};
