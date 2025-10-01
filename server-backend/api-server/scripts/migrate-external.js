const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');
const path = require('path');

// 외장하드용 데이터베이스 연결 설정
const sequelize = new Sequelize(
    process.env.DB_NAME || 'news_paper_vip',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASSWORD || 'postgres',
    {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        dialect: 'postgres',
        logging: (msg) => logger.debug(msg),
        dialectOptions: {
            ssl: process.env.NODE_ENV === 'production' ? {
                require: true,
                rejectUnauthorized: false
            } : false
        }
    }
);

// 외장하드 데이터베이스 마이그레이션 실행
async function runExternalMigrations() {
    try {
        logger.info('🔄 Starting external database migrations...');

        // 데이터베이스 연결 확인
        await sequelize.authenticate();
        logger.info('✅ External database connection established');

        // 외장하드 경로 확인
        const externalPaths = {
            data: 'D:/NewsPaperVIP/Database/PostgreSQL/data',
            logs: 'D:/NewsPaperVIP/Logs/API/logs',
            uploads: 'D:/NewsPaperVIP/Uploads/files',
            backups: 'D:/NewsPaperVIP/Backups'
        };

        // 디렉토리 존재 확인 및 생성
        const fs = require('fs');
        for (const [key, dirPath] of Object.entries(externalPaths)) {
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
                logger.info(`📁 Created external directory: ${dirPath}`);
            } else {
                logger.info(`📁 External directory exists: ${dirPath}`);
            }
        }

        // 테이블 생성
        await createExternalTables();

        // 초기 데이터 삽입
        await seedExternalData();

        // 백업 스크립트 생성
        await createBackupScript();

        logger.info('✅ External database migrations completed successfully');
        logger.info('📁 External storage paths:');
        logger.info(`   - Database: ${externalPaths.data}`);
        logger.info(`   - Logs: ${externalPaths.logs}`);
        logger.info(`   - Uploads: ${externalPaths.uploads}`);
        logger.info(`   - Backups: ${externalPaths.backups}`);

        process.exit(0);
    } catch (error) {
        logger.error('❌ External migration failed:', error);
        process.exit(1);
    }
}

// 외장하드용 테이블 생성
async function createExternalTables() {
    logger.info('📋 Creating external tables...');

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

    // 파일 업로드 테이블 (외장하드용)
    await sequelize.query(`
    CREATE TABLE IF NOT EXISTS file_uploads (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      original_name VARCHAR(255) NOT NULL,
      file_name VARCHAR(255) NOT NULL,
      file_path VARCHAR(500) NOT NULL,
      file_size BIGINT NOT NULL,
      mime_type VARCHAR(100) NOT NULL,
      file_hash VARCHAR(64),
      is_public BOOLEAN DEFAULT false,
      download_count INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

    // 파일 업로드 인덱스
    await sequelize.query(`
    CREATE INDEX IF NOT EXISTS idx_file_uploads_user_id ON file_uploads(user_id);
    CREATE INDEX IF NOT EXISTS idx_file_uploads_file_hash ON file_uploads(file_hash);
    CREATE INDEX IF NOT EXISTS idx_file_uploads_created_at ON file_uploads(created_at);
  `);

    logger.info('✅ External tables created successfully');
}

// 외장하드용 초기 데이터 삽입
async function seedExternalData() {
    logger.info('🌱 Seeding external data...');

    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('admin123!', 12);

    // 기본 Owner 사용자 생성
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

    // 시스템 로그 초기 데이터
    await sequelize.query(`
    INSERT INTO system_logs (user_id, action, resource_type, details) VALUES
    ('00000000-0000-0000-0000-000000000001', 'external_db_init', 'database', '{"message": "External database initialized successfully", "storage_path": "D:/NewsPaperVIP/"}'),
    ('00000000-0000-0000-0000-000000000001', 'user_created', 'user', '{"message": "Default admin user created"}');
  `);

    logger.info('✅ External data seeded successfully');
}

// 백업 스크립트 생성
async function createBackupScript() {
    logger.info('📦 Creating backup script...');

    const backupScript = `@echo off
echo Starting News Paper VIP Database Backup...

set BACKUP_DIR=D:\\NewsPaperVIP\\Backups
set DATE=%date:~0,4%%date:~5,2%%date:~8,2%
set TIME=%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%DATE%_%TIME%

if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

echo Creating backup: news_paper_vip_%TIMESTAMP%.sql
pg_dump -h localhost -U postgres -d news_paper_vip > "%BACKUP_DIR%\\news_paper_vip_%TIMESTAMP%.sql"

if %ERRORLEVEL% EQU 0 (
    echo Backup completed successfully!
    echo Backup file: %BACKUP_DIR%\\news_paper_vip_%TIMESTAMP%.sql
) else (
    echo Backup failed!
    exit /b 1
)

echo Cleaning old backups (older than 30 days)...
forfiles /p "%BACKUP_DIR%" /m *.sql /d -30 /c "cmd /c del @path"

echo Backup process completed.
pause`;

    const fs = require('fs');
    const backupPath = 'D:/NewsPaperVIP/Scripts/backup-database.bat';

    // 스크립트 디렉토리 생성
    if (!fs.existsSync('D:/NewsPaperVIP/Scripts')) {
        fs.mkdirSync('D:/NewsPaperVIP/Scripts', { recursive: true });
    }

    fs.writeFileSync(backupPath, backupScript);
    logger.info(`✅ Backup script created: ${backupPath}`);
}

// 외장하드 마이그레이션 실행
if (require.main === module) {
    runExternalMigrations();
}

module.exports = { runExternalMigrations };
