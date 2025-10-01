const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const { Sequelize, DataTypes } = require('sequelize');
const Redis = require('redis');
const winston = require('winston');
const consul = require('consul');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
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
const PORT = process.env.PORT || 5002;

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
  process.env.DB_NAME || 'community_notifications',
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

// 모델 정의
const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('email', 'sms', 'push', 'in_app'),
    allowNull: false
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'sent', 'failed', 'read'),
    defaultValue: 'pending'
  },
  sentAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  readAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true
  }
}, {
  tableName: 'notifications',
  timestamps: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['type'] },
    { fields: ['status'] },
    { fields: ['createdAt'] }
  ]
});

// 이메일 전송 설정
const emailTransporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST || 'localhost',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || ''
  }
});

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

// 사용자 정보 조회
const getUserInfo = async (userId) => {
  try {
    // Redis에서 사용자 정보 조회
    const cachedUser = await redis.get(`user:${userId}`);
    if (cachedUser) {
      return JSON.parse(cachedUser);
    }

    // 사용자 서비스에서 사용자 정보 조회
    const response = await axios.get(`${process.env.USER_SERVICE_URL || 'http://localhost:5003'}/api/users/profile`, {
      headers: {
        'Authorization': `Bearer ${jwt.sign({ userId }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '1h' })}`
      }
    });

    const user = response.data.user;
    
    // Redis에 캐시
    await redis.setEx(`user:${userId}`, 3600, JSON.stringify(user));
    
    return user;
  } catch (error) {
    logger.error('Get user info error:', error);
    return null;
  }
};

// 알림 전송
const sendNotification = async (notification) => {
  try {
    const user = await getUserInfo(notification.userId);
    if (!user) {
      throw new Error('사용자 정보를 찾을 수 없습니다.');
    }

    switch (notification.type) {
      case 'email':
        await sendEmail(user.email, notification.title, notification.message);
        break;
      case 'sms':
        await sendSMS(user.phone, notification.message);
        break;
      case 'push':
        await sendPushNotification(user.id, notification.title, notification.message);
        break;
      case 'in_app':
        await sendInAppNotification(user.id, notification.title, notification.message);
        break;
    }

    await notification.update({ 
      status: 'sent', 
      sentAt: new Date() 
    });

    logger.info(`Notification sent: ${notification.id} to ${user.username}`);
  } catch (error) {
    logger.error('Send notification error:', error);
    await notification.update({ status: 'failed' });
  }
};

// 이메일 전송
const sendEmail = async (to, subject, text) => {
  const mailOptions = {
    from: process.env.SMTP_FROM || 'noreply@community.com',
    to,
    subject,
    text,
    html: `<p>${text}</p>`
  };

  await emailTransporter.sendMail(mailOptions);
};

// SMS 전송 (예시)
const sendSMS = async (phone, message) => {
  // SMS 서비스 연동 (예: Twilio, AWS SNS 등)
  logger.info(`SMS sent to ${phone}: ${message}`);
};

// 푸시 알림 전송 (예시)
const sendPushNotification = async (userId, title, message) => {
  // 푸시 알림 서비스 연동 (예: FCM, APNS 등)
  logger.info(`Push notification sent to ${userId}: ${title} - ${message}`);
};

// 인앱 알림 전송
const sendInAppNotification = async (userId, title, message) => {
  // Redis에 인앱 알림 저장
  await redis.lpush(`notifications:${userId}`, JSON.stringify({
    id: uuidv4(),
    title,
    message,
    createdAt: new Date().toISOString()
  }));

  // 최근 알림 개수 제한 (100개)
  await redis.ltrim(`notifications:${userId}`, 0, 99);
};

// API 라우트

// 알림 생성
app.post('/api/notifications', verifyToken, [
  body('type').isIn(['email', 'sms', 'push', 'in_app']),
  body('title').isLength({ min: 1, max: 255 }).trim().escape(),
  body('message').isLength({ min: 1 }).trim().escape(),
  body('metadata').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { type, title, message, metadata } = req.body;

    const notification = await Notification.create({
      userId: req.userId,
      type,
      title,
      message,
      metadata
    });

    // 비동기로 알림 전송
    setImmediate(() => sendNotification(notification));

    res.status(201).json({
      message: '알림이 생성되었습니다.',
      notification: {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        status: notification.status,
        createdAt: notification.createdAt
      }
    });
  } catch (error) {
    logger.error('Create notification error:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 알림 목록 조회
app.get('/api/notifications', verifyToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, type, status } = req.query;
    const offset = (page - 1) * limit;

    const where = { userId: req.userId };
    if (type) where.type = type;
    if (status) where.status = status;

    const { count, rows: notifications } = await Notification.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    logger.error('Get notifications error:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 알림 읽음 처리
app.put('/api/notifications/:id/read', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOne({
      where: { id, userId: req.userId }
    });

    if (!notification) {
      return res.status(404).json({ message: '알림을 찾을 수 없습니다.' });
    }

    await notification.update({ 
      status: 'read', 
      readAt: new Date() 
    });

    res.json({ message: '알림이 읽음 처리되었습니다.' });
  } catch (error) {
    logger.error('Mark notification as read error:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 알림 삭제
app.delete('/api/notifications/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOne({
      where: { id, userId: req.userId }
    });

    if (!notification) {
      return res.status(404).json({ message: '알림을 찾을 수 없습니다.' });
    }

    await notification.destroy();

    res.json({ message: '알림이 삭제되었습니다.' });
  } catch (error) {
    logger.error('Delete notification error:', error);
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
      logger.info(`Notification service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Server start error:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
