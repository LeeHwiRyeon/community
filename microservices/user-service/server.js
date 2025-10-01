const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Sequelize, DataTypes } = require('sequelize');
const Redis = require('redis');
const winston = require('winston');
const consul = require('consul');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// 로거 설정
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' }),
        new winston.transports.Console({
            format: winston.format.simple()
        })
    ]
});

// Express 앱 생성
const app = express();
const PORT = process.env.PORT || 5003;

// 미들웨어 설정
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15분
    max: 100, // 15분 동안 100개 요청
    message: '너무 많은 요청을 하셨습니다. 잠시 후 다시 시도해주세요.'
});
app.use('/api', limiter);

// Redis 연결
const redis = Redis.createClient({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || null
});

redis.on('error', (err) => {
    logger.error('Redis Client Error:', err);
});

redis.connect();

// 데이터베이스 연결
const sequelize = new Sequelize(
    process.env.DB_NAME || 'community_users',
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || '',
    {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        dialect: 'mysql',
        logging: false,
        pool: {
            max: 10,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    }
);

// User 모델 정의
const User = sequelize.define('User', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    username: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
    },
    email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true
    },
    password: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    firstName: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    lastName: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    avatar: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    role: {
        type: DataTypes.ENUM('user', 'moderator', 'admin'),
        defaultValue: 'user'
    },
    status: {
        type: DataTypes.ENUM('active', 'inactive', 'suspended', 'banned'),
        defaultValue: 'active'
    },
    lastLogin: {
        type: DataTypes.DATE,
        allowNull: true
    },
    emailVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    emailVerificationToken: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    passwordResetToken: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    passwordResetExpires: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'users',
    timestamps: true,
    indexes: [
        { fields: ['email'] },
        { fields: ['username'] },
        { fields: ['role'] },
        { fields: ['status'] }
    ]
});

// JWT 토큰 생성
const generateToken = (userId) => {
    return jwt.sign(
        { userId },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
};

// JWT 토큰 검증
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: '인증 토큰이 없습니다.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        req.userId = decoded.userId;
        next();
    } catch (error) {
        return res.status(403).json({ message: '유효하지 않은 토큰입니다.' });
    }
};

// 역할 기반 접근 제어
const requireRole = (roles) => {
    return async (req, res, next) => {
        try {
            const user = await User.findByPk(req.userId);
            if (!user || !roles.includes(user.role)) {
                return res.status(403).json({ message: '접근 권한이 없습니다.' });
            }
            req.user = user;
            next();
        } catch (error) {
            logger.error('Role check error:', error);
            return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
        }
    };
};

// API 라우트

// 사용자 등록
app.post('/api/users/register', [
    body('username').isLength({ min: 3, max: 50 }).trim().escape(),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
    body('firstName').optional().isLength({ max: 50 }).trim().escape(),
    body('lastName').optional().isLength({ max: 50 }).trim().escape()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { username, email, password, firstName, lastName } = req.body;

        // 이메일 중복 확인
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: '이미 등록된 이메일입니다.' });
        }

        // 사용자명 중복 확인
        const existingUsername = await User.findOne({ where: { username } });
        if (existingUsername) {
            return res.status(400).json({ message: '이미 사용 중인 사용자명입니다.' });
        }

        // 비밀번호 해시화
        const hashedPassword = await bcrypt.hash(password, 12);

        // 사용자 생성
        const user = await User.create({
            username,
            email,
            password: hashedPassword,
            firstName,
            lastName,
            emailVerificationToken: uuidv4()
        });

        // Redis에 사용자 정보 캐시
        await redis.setEx(`user:${user.id}`, 3600, JSON.stringify({
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            status: user.status
        }));

        // 이메일 인증 토큰 생성
        const emailVerificationToken = uuidv4();
        await user.update({ emailVerificationToken });

        logger.info(`User registered: ${user.id}`);

        res.status(201).json({
            message: '사용자가 성공적으로 등록되었습니다.',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                status: user.status
            }
        });
    } catch (error) {
        logger.error('User registration error:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

// 사용자 로그인
app.post('/api/users/login', [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        // 사용자 찾기
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(401).json({ message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
        }

        // 계정 상태 확인
        if (user.status !== 'active') {
            return res.status(401).json({ message: '비활성화된 계정입니다.' });
        }

        // 비밀번호 확인
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
        }

        // JWT 토큰 생성
        const token = generateToken(user.id);

        // 마지막 로그인 시간 업데이트
        await user.update({ lastLogin: new Date() });

        // Redis에 사용자 정보 캐시
        await redis.setEx(`user:${user.id}`, 3600, JSON.stringify({
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            status: user.status
        }));

        logger.info(`User logged in: ${user.id}`);

        res.json({
            message: '로그인에 성공했습니다.',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                status: user.status,
                lastLogin: user.lastLogin
            }
        });
    } catch (error) {
        logger.error('User login error:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

// 사용자 프로필 조회
app.get('/api/users/profile', verifyToken, async (req, res) => {
    try {
        // Redis에서 사용자 정보 조회
        const cachedUser = await redis.get(`user:${req.userId}`);
        if (cachedUser) {
            return res.json({ user: JSON.parse(cachedUser) });
        }

        // 데이터베이스에서 사용자 정보 조회
        const user = await User.findByPk(req.userId, {
            attributes: { exclude: ['password', 'emailVerificationToken', 'passwordResetToken'] }
        });

        if (!user) {
            return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
        }

        // Redis에 캐시
        await redis.setEx(`user:${user.id}`, 3600, JSON.stringify({
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            status: user.status
        }));

        res.json({ user });
    } catch (error) {
        logger.error('User profile error:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

// 사용자 프로필 업데이트
app.put('/api/users/profile', verifyToken, [
    body('firstName').optional().isLength({ max: 50 }).trim().escape(),
    body('lastName').optional().isLength({ max: 50 }).trim().escape(),
    body('avatar').optional().isURL()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { firstName, lastName, avatar } = req.body;

        const user = await User.findByPk(req.userId);
        if (!user) {
            return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
        }

        await user.update({ firstName, lastName, avatar });

        // Redis 캐시 업데이트
        await redis.del(`user:${user.id}`);

        logger.info(`User profile updated: ${user.id}`);

        res.json({
            message: '프로필이 성공적으로 업데이트되었습니다.',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                avatar: user.avatar,
                role: user.role,
                status: user.status
            }
        });
    } catch (error) {
        logger.error('User profile update error:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

// 사용자 목록 조회 (관리자만)
app.get('/api/users', verifyToken, requireRole(['admin', 'moderator']), async (req, res) => {
    try {
        const { page = 1, limit = 10, role, status, search } = req.query;
        const offset = (page - 1) * limit;

        const where = {};
        if (role) where.role = role;
        if (status) where.status = status;
        if (search) {
            where[Sequelize.Op.or] = [
                { username: { [Sequelize.Op.like]: `%${search}%` } },
                { email: { [Sequelize.Op.like]: `%${search}%` } }
            ];
        }

        const { count, rows: users } = await User.findAndCountAll({
            where,
            attributes: { exclude: ['password', 'emailVerificationToken', 'passwordResetToken'] },
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['createdAt', 'DESC']]
        });

        res.json({
            users,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count,
                pages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        logger.error('Users list error:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

// 사용자 상태 변경 (관리자만)
app.put('/api/users/:id/status', verifyToken, requireRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['active', 'inactive', 'suspended', 'banned'].includes(status)) {
            return res.status(400).json({ message: '유효하지 않은 상태입니다.' });
        }

        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
        }

        await user.update({ status });

        // Redis 캐시 삭제
        await redis.del(`user:${user.id}`);

        logger.info(`User status updated: ${user.id} -> ${status}`);

        res.json({
            message: '사용자 상태가 성공적으로 변경되었습니다.',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                status: user.status
            }
        });
    } catch (error) {
        logger.error('User status update error:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

// 헬스 체크
app.get('/health', async (req, res) => {
    try {
        // 데이터베이스 연결 확인
        await sequelize.authenticate();

        // Redis 연결 확인
        await redis.ping();

        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            services: {
                database: 'connected',
                redis: 'connected'
            }
        });
    } catch (error) {
        logger.error('Health check error:', error);
        res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
});

// 서버 시작
const startServer = async () => {
    try {
        // 데이터베이스 연결
        await sequelize.authenticate();
        logger.info('Database connected successfully');

        // 데이터베이스 동기화
        await sequelize.sync({ alter: true });
        logger.info('Database synchronized');

        // 서버 시작
        app.listen(PORT, () => {
            logger.info(`User service running on port ${PORT}`);
        });
    } catch (error) {
        logger.error('Server start error:', error);
        process.exit(1);
    }
};

startServer();

module.exports = app;
