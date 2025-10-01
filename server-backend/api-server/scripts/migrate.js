const { Sequelize } = require('sequelize');
const { logger } = require('../utils/logger');
const path = require('path');

// SQLite 데이터베이스 연결 설정
const dbPath = process.env.DB_PATH || 'D:/database/thenewspaper/thenewspaperdata.db';

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: (msg) => logger.debug(msg),
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// 데이터베이스 마이그레이션 실행
async function runMigrations() {
  try {
    logger.info('🔄 Starting database migrations...');

    // 데이터베이스 연결 확인
    await sequelize.authenticate();
    logger.info('✅ Database connection established');

    // 데이터베이스 생성 (존재하지 않는 경우)
    const databaseName = process.env.DB_NAME || 'news_paper_vip';
    const adminSequelize = new Sequelize('postgres', process.env.DB_USER || 'postgres', process.env.DB_PASSWORD || 'postgres', {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      dialect: 'postgres',
      logging: false
    });

    try {
      await adminSequelize.query(`CREATE DATABASE "${databaseName}"`);
      logger.info(`✅ Database '${databaseName}' created successfully`);
    } catch (error) {
      if (error.original && error.original.code === '42P04') {
        logger.info(`ℹ️  Database '${databaseName}' already exists`);
      } else {
        throw error;
      }
    } finally {
      await adminSequelize.close();
    }

    // 테이블 생성
    await createTables();

    // 초기 데이터 삽입
    await seedInitialData();

    logger.info('✅ Database migrations completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// 테이블 생성
async function createTables() {
  logger.info('📋 Creating tables...');

  // 사용자 테이블
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      first_name VARCHAR(50) NOT NULL,
      last_name VARCHAR(50) NOT NULL,
      role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('owner', 'admin', 'vip', 'streamer', 'cosplayer', 'manager', 'user')),
      status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'inactive', 'suspended', 'pending')),
      avatar VARCHAR(255),
      phone VARCHAR(20),
      birth_date DATE,
      gender VARCHAR(20) CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
      bio TEXT,
      website VARCHAR(255),
      social_links JSONB DEFAULT '{}',
      preferences JSONB DEFAULT '{
        "language": "ko",
        "timezone": "Asia/Seoul",
        "notifications": {
          "email": true,
          "push": true,
          "sms": false
        },
        "privacy": {
          "profileVisibility": "public",
          "showEmail": false,
          "showPhone": false
        }
      }',
      last_login_at TIMESTAMP,
      last_login_ip INET,
      login_count INTEGER DEFAULT 0,
      is_email_verified BOOLEAN DEFAULT false,
      email_verification_token VARCHAR(255),
      password_reset_token VARCHAR(255),
      password_reset_expires TIMESTAMP,
      two_factor_enabled BOOLEAN DEFAULT false,
      two_factor_secret VARCHAR(255),
      activity_score INTEGER DEFAULT 0,
      subscription_tier VARCHAR(20) DEFAULT 'free' CHECK (subscription_tier IN ('free', 'basic', 'premium', 'vip')),
      subscription_expires_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 인덱스 생성
  await sequelize.query(`
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
    CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
    CREATE INDEX IF NOT EXISTS idx_users_last_login_at ON users(last_login_at);
  `);

  // 알림 테이블
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      type VARCHAR(20) DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
      category VARCHAR(50) DEFAULT 'system',
      is_read BOOLEAN DEFAULT false,
      read_at TIMESTAMP,
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 알림 인덱스
  await sequelize.query(`
    CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
    CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
  `);

  // 사용자 세션 테이블
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS user_sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      refresh_token VARCHAR(255) NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      ip_address INET,
      user_agent TEXT,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 세션 인덱스
  await sequelize.query(`
    CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_sessions_refresh_token ON user_sessions(refresh_token);
    CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
  `);

  // 시스템 로그 테이블
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS system_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      action VARCHAR(100) NOT NULL,
      resource_type VARCHAR(50),
      resource_id VARCHAR(100),
      details JSONB DEFAULT '{}',
      ip_address INET,
      user_agent TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 로그 인덱스
  await sequelize.query(`
    CREATE INDEX IF NOT EXISTS idx_system_logs_user_id ON system_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_system_logs_action ON system_logs(action);
    CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at);
  `);

  logger.info('✅ Tables created successfully');
}

// 초기 데이터 삽입
async function seedInitialData() {
  logger.info('🌱 Seeding initial data...');

  // 기본 Owner 사용자 생성
  const bcrypt = require('bcryptjs');
  const hashedPassword = await bcrypt.hash('admin123!', 12);

  await sequelize.query(`
    INSERT INTO users (
      id, username, email, password, first_name, last_name, role, status,
      is_email_verified, activity_score, subscription_tier
    ) VALUES (
      '00000000-0000-0000-0000-000000000001',
      'admin',
      'admin@newspaper-vip.com',
      $1,
      'System',
      'Administrator',
      'owner',
      'active',
      true,
      10000,
      'vip'
    ) ON CONFLICT (email) DO NOTHING;
  `, {
    bind: [hashedPassword]
  });

  // 기본 VIP 사용자 생성
  const vipPassword = await bcrypt.hash('vip123!', 12);
  await sequelize.query(`
    INSERT INTO users (
      id, username, email, password, first_name, last_name, role, status,
      is_email_verified, activity_score, subscription_tier
    ) VALUES (
      '00000000-0000-0000-0000-000000000002',
      'vip_user',
      'vip@newspaper-vip.com',
      $1,
      'VIP',
      'User',
      'vip',
      'active',
      true,
      5000,
      'vip'
    ) ON CONFLICT (email) DO NOTHING;
  `, {
    bind: [vipPassword]
  });

  // 기본 스트리머 사용자 생성
  const streamerPassword = await bcrypt.hash('streamer123!', 12);
  await sequelize.query(`
    INSERT INTO users (
      id, username, email, password, first_name, last_name, role, status,
      is_email_verified, activity_score, subscription_tier
    ) VALUES (
      '00000000-0000-0000-0000-000000000003',
      'streamer_user',
      'streamer@newspaper-vip.com',
      $1,
      'Streamer',
      'User',
      'streamer',
      'active',
      true,
      3000,
      'premium'
    ) ON CONFLICT (email) DO NOTHING;
  `, {
    bind: [streamerPassword]
  });

  // 기본 코스플레이어 사용자 생성
  const cosplayerPassword = await bcrypt.hash('cosplayer123!', 12);
  await sequelize.query(`
    INSERT INTO users (
      id, username, email, password, first_name, last_name, role, status,
      is_email_verified, activity_score, subscription_tier
    ) VALUES (
      '00000000-0000-0000-0000-000000000004',
      'cosplayer_user',
      'cosplayer@newspaper-vip.com',
      $1,
      'Cosplayer',
      'User',
      'cosplayer',
      'active',
      true,
      2500,
      'premium'
    ) ON CONFLICT (email) DO NOTHING;
  `, {
    bind: [cosplayerPassword]
  });

  // 기본 매니저 사용자 생성
  const managerPassword = await bcrypt.hash('manager123!', 12);
  await sequelize.query(`
    INSERT INTO users (
      id, username, email, password, first_name, last_name, role, status,
      is_email_verified, activity_score, subscription_tier
    ) VALUES (
      '00000000-0000-0000-0000-000000000005',
      'manager_user',
      'manager@newspaper-vip.com',
      $1,
      'Manager',
      'User',
      'manager',
      'active',
      true,
      2000,
      'basic'
    ) ON CONFLICT (email) DO NOTHING;
  `, {
    bind: [managerPassword]
  });

  // 기본 일반 사용자 생성
  const userPassword = await bcrypt.hash('user123!', 12);
  await sequelize.query(`
    INSERT INTO users (
      id, username, email, password, first_name, last_name, role, status,
      is_email_verified, activity_score, subscription_tier
    ) VALUES (
      '00000000-0000-0000-0000-000000000006',
      'general_user',
      'user@newspaper-vip.com',
      $1,
      'General',
      'User',
      'user',
      'active',
      true,
      1000,
      'free'
    ) ON CONFLICT (email) DO NOTHING;
  `, {
    bind: [userPassword]
  });

  // 시스템 로그 초기 데이터
  await sequelize.query(`
    INSERT INTO system_logs (user_id, action, resource_type, details) VALUES
    ('00000000-0000-0000-0000-000000000001', 'system_init', 'database', '{"message": "Database initialized successfully"}'),
    ('00000000-0000-0000-0000-000000000001', 'user_created', 'user', '{"message": "Default users created"}');
  `);

  logger.info('✅ Initial data seeded successfully');
}

// 마이그레이션 실행
if (require.main === module) {
  runMigrations();
}

module.exports = { runMigrations };
