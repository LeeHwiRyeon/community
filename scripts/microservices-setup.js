#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 마이크로서비스 아키텍처 설정 시작...');

// 1. Dockerfile 생성
console.log('🐳 Dockerfile 생성...');

// 사용자 서비스 Dockerfile
const userServiceDockerfile = `FROM node:18-alpine

WORKDIR /app

# 패키지 파일 복사
COPY package*.json ./

# 의존성 설치
RUN npm ci --only=production

# 소스 코드 복사
COPY . .

# 로그 디렉토리 생성
RUN mkdir -p logs

# 포트 노출
EXPOSE 5003

# 헬스 체크
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD node -e "require('http').get('http://localhost:5003/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# 서버 시작
CMD ["node", "server.js"]
`;

fs.writeFileSync('microservices/user-service/Dockerfile', userServiceDockerfile);

// 채팅 서비스 Dockerfile
const chatServiceDockerfile = `FROM node:18-alpine

WORKDIR /app

# 패키지 파일 복사
COPY package*.json ./

# 의존성 설치
RUN npm ci --only=production

# 소스 코드 복사
COPY . .

# 로그 디렉토리 생성
RUN mkdir -p logs

# 포트 노출
EXPOSE 5001

# 헬스 체크
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD node -e "require('http').get('http://localhost:5001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# 서버 시작
CMD ["node", "server.js"]
`;

fs.writeFileSync('microservices/chat-service/Dockerfile', chatServiceDockerfile);

// 알림 서비스 Dockerfile
const notificationServiceDockerfile = `FROM node:18-alpine

WORKDIR /app

# 패키지 파일 복사
COPY package*.json ./

# 의존성 설치
RUN npm ci --only=production

# 소스 코드 복사
COPY . .

# 로그 디렉토리 생성
RUN mkdir -p logs

# 포트 노출
EXPOSE 5002

# 헬스 체크
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD node -e "require('http').get('http://localhost:5002/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# 서버 시작
CMD ["node", "server.js"]
`;

fs.writeFileSync('microservices/notification-service/Dockerfile', notificationServiceDockerfile);

console.log('✅ Dockerfile 생성 완료');

// 2. 알림 서비스 생성
console.log('📧 알림 서비스 생성...');

const notificationServicePackage = {
    "name": "community-notification-service",
    "version": "1.0.0",
    "description": "Community Notification Service",
    "main": "server.js",
    "scripts": {
        "start": "node server.js",
        "dev": "nodemon server.js",
        "test": "jest",
        "test:watch": "jest --watch",
        "test:coverage": "jest --coverage"
    },
    "dependencies": {
        "express": "^4.18.2",
        "cors": "^2.8.5",
        "helmet": "^7.0.0",
        "morgan": "^1.10.0",
        "compression": "^1.7.4",
        "express-rate-limit": "^6.7.0",
        "express-validator": "^6.15.0",
        "mysql2": "^3.6.0",
        "sequelize": "^6.32.1",
        "redis": "^4.6.7",
        "joi": "^17.9.1",
        "winston": "^3.9.0",
        "dotenv": "^16.3.1",
        "consul": "^0.40.0",
        "axios": "^1.4.0",
        "uuid": "^9.0.0",
        "jsonwebtoken": "^9.0.0",
        "nodemailer": "^6.9.1",
        "socket.io-client": "^4.7.2"
    },
    "devDependencies": {
        "nodemon": "^2.0.22",
        "jest": "^29.5.0",
        "supertest": "^6.3.3",
        "@types/jest": "^29.5.2"
    },
    "keywords": [
        "microservice",
        "notification",
        "email",
        "sms",
        "push",
        "community"
    ],
    "author": "Community Team",
    "license": "MIT"
};

fs.writeFileSync('microservices/notification-service/package.json', JSON.stringify(notificationServicePackage, null, 2));

const notificationServiceServer = `const express = require('express');
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
    const cachedUser = await redis.get(\`user:\${userId}\`);
    if (cachedUser) {
      return JSON.parse(cachedUser);
    }

    // 사용자 서비스에서 사용자 정보 조회
    const response = await axios.get(\`\${process.env.USER_SERVICE_URL || 'http://localhost:5003'}/api/users/profile\`, {
      headers: {
        'Authorization': \`Bearer \${jwt.sign({ userId }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '1h' })}\`
      }
    });

    const user = response.data.user;
    
    // Redis에 캐시
    await redis.setEx(\`user:\${userId}\`, 3600, JSON.stringify(user));
    
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

    logger.info(\`Notification sent: \${notification.id} to \${user.username}\`);
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
    html: \`<p>\${text}</p>\`
  };

  await emailTransporter.sendMail(mailOptions);
};

// SMS 전송 (예시)
const sendSMS = async (phone, message) => {
  // SMS 서비스 연동 (예: Twilio, AWS SNS 등)
  logger.info(\`SMS sent to \${phone}: \${message}\`);
};

// 푸시 알림 전송 (예시)
const sendPushNotification = async (userId, title, message) => {
  // 푸시 알림 서비스 연동 (예: FCM, APNS 등)
  logger.info(\`Push notification sent to \${userId}: \${title} - \${message}\`);
};

// 인앱 알림 전송
const sendInAppNotification = async (userId, title, message) => {
  // Redis에 인앱 알림 저장
  await redis.lpush(\`notifications:\${userId}\`, JSON.stringify({
    id: uuidv4(),
    title,
    message,
    createdAt: new Date().toISOString()
  }));

  // 최근 알림 개수 제한 (100개)
  await redis.ltrim(\`notifications:\${userId}\`, 0, 99);
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
      logger.info(\`Notification service running on port \${PORT}\`);
    });
  } catch (error) {
    logger.error('Server start error:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
`;

fs.writeFileSync('microservices/notification-service/server.js', notificationServiceServer);

console.log('✅ 알림 서비스 생성 완료');

// 3. 데이터베이스 초기화 스크립트
console.log('🗄️ 데이터베이스 초기화 스크립트 생성...');

const dbInitScript = `-- Community Microservices Database Initialization

-- 사용자 서비스 데이터베이스
CREATE DATABASE IF NOT EXISTS community_users;
USE community_users;

-- 채팅 서비스 데이터베이스
CREATE DATABASE IF NOT EXISTS community_chat;
USE community_chat;

-- 알림 서비스 데이터베이스
CREATE DATABASE IF NOT EXISTS community_notifications;
USE community_notifications;

-- 메인 커뮤니티 데이터베이스
CREATE DATABASE IF NOT EXISTS community;
USE community;

-- 인덱스 최적화
-- 사용자 서비스 인덱스
USE community_users;
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);

-- 채팅 서비스 인덱스
USE community_chat;
CREATE INDEX idx_chat_rooms_type ON chat_rooms(type);
CREATE INDEX idx_chat_rooms_active ON chat_rooms(isActive);
CREATE INDEX idx_chat_messages_room ON chat_messages(roomId);
CREATE INDEX idx_chat_messages_user ON chat_messages(userId);
CREATE INDEX idx_chat_messages_created ON chat_messages(createdAt);
CREATE INDEX idx_chat_members_room_user ON chat_members(roomId, userId);
CREATE INDEX idx_chat_members_user ON chat_members(userId);

-- 알림 서비스 인덱스
USE community_notifications;
CREATE INDEX idx_notifications_user ON notifications(userId);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_created ON notifications(createdAt);

-- 성능 최적화 설정
SET GLOBAL innodb_buffer_pool_size = 1G;
SET GLOBAL max_connections = 1000;
SET GLOBAL query_cache_size = 256M;
SET GLOBAL query_cache_type = 1;

-- 연결 풀 설정
SET GLOBAL wait_timeout = 28800;
SET GLOBAL interactive_timeout = 28800;

-- 로그 설정
SET GLOBAL slow_query_log = 1;
SET GLOBAL long_query_time = 2;
SET GLOBAL log_queries_not_using_indexes = 1;

-- 완료 메시지
SELECT 'Database initialization completed successfully' as status;
`;

fs.writeFileSync('microservices/database/init/01-init.sql', dbInitScript);

console.log('✅ 데이터베이스 초기화 스크립트 생성 완료');

// 4. 마이크로서비스 시작 스크립트
console.log('🚀 마이크로서비스 시작 스크립트 생성...');

const startScript = `#!/bin/bash

echo "🚀 마이크로서비스 아키텍처 시작..."

# Docker Compose로 마이크로서비스 스택 시작
cd microservices
docker-compose -f docker-compose.microservices.yml up -d

echo "⏳ 서비스 시작 대기 중..."
sleep 60

echo "📊 마이크로서비스 상태 확인..."
docker-compose -f docker-compose.microservices.yml ps

echo "🌐 마이크로서비스 접속 정보:"
echo "  - Kong API Gateway: http://localhost:8000"
echo "  - Kong Admin: http://localhost:8001"
echo "  - Consul UI: http://localhost:8500"
echo "  - Nginx Load Balancer: http://localhost:80"
echo "  - User Service: http://localhost:5003"
echo "  - Chat Service: http://localhost:5001"
echo "  - Notification Service: http://localhost:5002"

echo "✅ 마이크로서비스 아키텍처 시작 완료!"
`;

fs.writeFileSync('microservices/start-microservices.sh', startScript);
fs.chmodSync('microservices/start-microservices.sh', '755');

// 5. 마이크로서비스 중지 스크립트
console.log('🛑 마이크로서비스 중지 스크립트 생성...');

const stopScript = `#!/bin/bash

echo "🛑 마이크로서비스 아키텍처 중지..."

cd microservices
docker-compose -f docker-compose.microservices.yml down

echo "✅ 마이크로서비스 아키텍처 중지 완료!"
`;

fs.writeFileSync('microservices/stop-microservices.sh', stopScript);
fs.chmodSync('microservices/stop-microservices.sh', '755');

// 6. 마이크로서비스 상태 확인 스크립트
console.log('📋 마이크로서비스 상태 확인 스크립트 생성...');

const statusScript = `#!/bin/bash

echo "📊 마이크로서비스 아키텍처 상태 확인..."

cd microservices

echo "🐳 Docker 컨테이너 상태:"
docker-compose -f docker-compose.microservices.yml ps

echo ""
echo "🌐 서비스 접속 테스트:"
echo "  - Kong API Gateway: \$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000)"
echo "  - Kong Admin: \$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8001)"
echo "  - Consul UI: \$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8500)"
echo "  - Nginx Load Balancer: \$(curl -s -o /dev/null -w "%{http_code}" http://localhost:80)"
echo "  - User Service: \$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5003/health)"
echo "  - Chat Service: \$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5001/health)"
echo "  - Notification Service: \$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5002/health)"

echo ""
echo "📈 서비스 메트릭:"
echo "  - 사용자 서비스: \$(curl -s http://localhost:5003/health | jq -r '.status')"
echo "  - 채팅 서비스: \$(curl -s http://localhost:5001/health | jq -r '.status')"
echo "  - 알림 서비스: \$(curl -s http://localhost:5002/health | jq -r '.status')"

echo ""
echo "✅ 마이크로서비스 상태 확인 완료!"
`;

fs.writeFileSync('microservices/check-microservices.sh', statusScript);
fs.chmodSync('microservices/check-microservices.sh', '755');

console.log('🎉 마이크로서비스 아키텍처 설정 완료!');
console.log('');
console.log('📋 다음 단계:');
console.log('1. cd microservices');
console.log('2. ./start-microservices.sh');
console.log('3. 브라우저에서 http://localhost:8000 접속 (Kong API Gateway)');
console.log('4. http://localhost:8500 접속 (Consul UI)');
console.log('5. 서비스 상태 확인');
