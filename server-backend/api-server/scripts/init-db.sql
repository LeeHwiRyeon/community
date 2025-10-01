-- 뉴스 페이퍼 VIP 관리 시스템 데이터베이스 초기화 스크립트

-- 데이터베이스 생성 (이미 docker-compose에서 생성됨)
-- CREATE DATABASE news_paper_vip;

-- 확장 기능 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 사용자 테이블 생성
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

-- 사용자 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_last_login_at ON users(last_login_at);
CREATE INDEX IF NOT EXISTS idx_users_activity_score ON users(activity_score);

-- 알림 테이블 생성
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

-- 알림 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_category ON notifications(category);

-- 사용자 세션 테이블 생성
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

-- 세션 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_refresh_token ON user_sessions(refresh_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON user_sessions(is_active);

-- 시스템 로그 테이블 생성
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

-- 로그 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_system_logs_user_id ON system_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_action ON system_logs(action);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_system_logs_resource_type ON system_logs(resource_type);

-- 사용자 활동 로그 테이블 생성
CREATE TABLE IF NOT EXISTS user_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL,
    activity_data JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 활동 로그 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_activity_type ON user_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activities_created_at ON user_activities(created_at);

-- 등급별 권한 테이블 생성
CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'admin', 'vip', 'streamer', 'cosplayer', 'manager', 'user')),
    permission VARCHAR(100) NOT NULL,
    is_granted BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role, permission)
);

-- 권한 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON role_permissions(permission);

-- 기본 권한 데이터 삽입
INSERT INTO role_permissions (role, permission, is_granted) VALUES
-- Owner 권한 (모든 권한)
('owner', 'system_settings', true),
('owner', 'user_management', true),
('owner', 'content_management', true),
('owner', 'revenue_management', true),
('owner', 'statistics_view', true),
('owner', 'community_participation', true),
('owner', 'premium_features', true),
('owner', 'priority_support', true),
('owner', 'custom_ui', true),
('owner', 'broadcast_management', true),
('owner', 'fan_management', true),
('owner', 'costume_management', true),
('owner', 'portfolio_management', true),
('owner', 'shop_management', true),
('owner', 'team_management', true),
('owner', 'task_assignment', true),
('owner', 'progress_tracking', true),
('owner', 'reporting', true),

-- Admin 권한
('admin', 'user_management', true),
('admin', 'content_management', true),
('admin', 'statistics_view', true),
('admin', 'community_participation', true),
('admin', 'premium_features', true),
('admin', 'priority_support', true),
('admin', 'custom_ui', true),
('admin', 'broadcast_management', true),
('admin', 'fan_management', true),
('admin', 'costume_management', true),
('admin', 'portfolio_management', true),
('admin', 'shop_management', true),
('admin', 'team_management', true),
('admin', 'task_assignment', true),
('admin', 'progress_tracking', true),
('admin', 'reporting', true),

-- VIP 권한
('vip', 'community_participation', true),
('vip', 'premium_features', true),
('vip', 'priority_support', true),
('vip', 'custom_ui', true),

-- Streamer 권한
('streamer', 'community_participation', true),
('streamer', 'broadcast_management', true),
('streamer', 'fan_management', true),
('streamer', 'revenue_management', true),
('streamer', 'content_management', true),

-- Cosplayer 권한
('cosplayer', 'community_participation', true),
('cosplayer', 'costume_management', true),
('cosplayer', 'portfolio_management', true),
('cosplayer', 'shop_management', true),
('cosplayer', 'revenue_management', true),

-- Manager 권한
('manager', 'community_participation', true),
('manager', 'team_management', true),
('manager', 'task_assignment', true),
('manager', 'progress_tracking', true),
('manager', 'reporting', true),

-- User 권한
('user', 'community_participation', true)
ON CONFLICT (role, permission) DO NOTHING;

-- 업데이트 트리거 함수 생성
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 업데이트 트리거 생성
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_sessions_updated_at BEFORE UPDATE ON user_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_role_permissions_updated_at BEFORE UPDATE ON role_permissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 뷰 생성: 사용자 통계
CREATE OR REPLACE VIEW user_stats AS
SELECT 
    role,
    status,
    COUNT(*) as user_count,
    AVG(activity_score) as avg_activity_score,
    MAX(last_login_at) as last_login,
    COUNT(CASE WHEN created_at >= CURRENT_DATE THEN 1 END) as new_today
FROM users
GROUP BY role, status;

-- 뷰 생성: 등급별 권한 매트릭스
CREATE OR REPLACE VIEW role_permission_matrix AS
SELECT 
    rp.role,
    rp.permission,
    rp.is_granted
FROM role_permissions rp
ORDER BY rp.role, rp.permission;

-- 함수 생성: 사용자 권한 확인
CREATE OR REPLACE FUNCTION check_user_permission(user_id UUID, permission_name VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
    user_role VARCHAR(20);
    has_permission BOOLEAN;
BEGIN
    -- 사용자 등급 조회
    SELECT role INTO user_role FROM users WHERE id = user_id;
    
    -- 권한 확인
    SELECT is_granted INTO has_permission 
    FROM role_permissions 
    WHERE role = user_role AND permission = permission_name;
    
    RETURN COALESCE(has_permission, false);
END;
$$ LANGUAGE plpgsql;

-- 함수 생성: 사용자 활동 점수 업데이트
CREATE OR REPLACE FUNCTION update_activity_score(user_id UUID, points INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE users 
    SET activity_score = activity_score + points,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- 초기 데이터 삽입을 위한 함수
CREATE OR REPLACE FUNCTION create_default_users()
RETURNS VOID AS $$
DECLARE
    hashed_password VARCHAR(255);
BEGIN
    -- 비밀번호 해시 생성 (bcrypt)
    hashed_password := crypt('admin123!', gen_salt('bf', 12));
    
    -- 기본 Owner 사용자 생성
    INSERT INTO users (
        id, username, email, password, first_name, last_name, role, status,
        is_email_verified, activity_score, subscription_tier
    ) VALUES (
        '00000000-0000-0000-0000-000000000001',
        'admin',
        'admin@newspaper-vip.com',
        hashed_password,
        'System',
        'Administrator',
        'owner',
        'active',
        true,
        10000,
        'vip'
    ) ON CONFLICT (email) DO NOTHING;
    
    -- 시스템 로그 초기 데이터
    INSERT INTO system_logs (user_id, action, resource_type, details) VALUES
    ('00000000-0000-0000-0000-000000000001', 'system_init', 'database', '{"message": "Database initialized successfully"}'),
    ('00000000-0000-0000-0000-000000000001', 'user_created', 'user', '{"message": "Default users created"}');
    
END;
$$ LANGUAGE plpgsql;

-- 초기 데이터 생성 실행
SELECT create_default_users();

-- 성공 메시지
DO $$
BEGIN
    RAISE NOTICE '뉴스 페이퍼 VIP 관리 시스템 데이터베이스가 성공적으로 초기화되었습니다!';
    RAISE NOTICE '기본 계정: admin@newspaper-vip.com / admin123!';
END $$;
