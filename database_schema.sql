-- Community Hub - 스트리머/코스플레이어-매니저 관리 시스템 데이터베이스 스키마

-- 스트리머/코스플레이어 테이블
CREATE TABLE streamers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    channel_name VARCHAR(100) NOT NULL,
    channel_url VARCHAR(255),
    stream_type ENUM('streamer', 'cosplayer') NOT NULL,
    bio TEXT,
    avatar_url VARCHAR(255),
    banner_url VARCHAR(255),
    is_live BOOLEAN DEFAULT FALSE,
    total_views INT DEFAULT 0,
    total_followers INT DEFAULT 0,
    revenue DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE KEY unique_channel_name (channel_name)
);

-- 매니저 테이블
CREATE TABLE managers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    streamer_id INT NOT NULL,
    role VARCHAR(50) NOT NULL, -- 'page_manager', 'content_approver', 'schedule_manager', 'communication_manager', 'revenue_manager', 'full_manager'
    permissions JSON, -- {"page_management": true, "content_approval": false, ...}
    is_active BOOLEAN DEFAULT TRUE,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (streamer_id) REFERENCES streamers(id),
    UNIQUE KEY unique_manager_streamer (user_id, streamer_id)
);

-- 콘텐츠 테이블
CREATE TABLE content (
    id INT PRIMARY KEY AUTO_INCREMENT,
    streamer_id INT NOT NULL,
    manager_id INT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    content_type ENUM('post', 'gallery', 'video', 'live_stream', 'cosplay_photo') NOT NULL,
    content_url VARCHAR(255),
    thumbnail_url VARCHAR(255),
    status ENUM('draft', 'pending_approval', 'approved', 'rejected', 'published') DEFAULT 'draft',
    rejection_reason TEXT NULL,
    scheduled_at TIMESTAMP NULL,
    published_at TIMESTAMP NULL,
    views INT DEFAULT 0,
    likes INT DEFAULT 0,
    comments INT DEFAULT 0,
    tags JSON, -- ["anime", "cosplay", "gaming"]
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (streamer_id) REFERENCES streamers(id),
    FOREIGN KEY (manager_id) REFERENCES managers(id)
);

-- 수익 테이블
CREATE TABLE revenue (
    id INT PRIMARY KEY AUTO_INCREMENT,
    streamer_id INT NOT NULL,
    manager_id INT NULL,
    source ENUM('subscription', 'donation', 'ad_revenue', 'merchandise', 'sponsorship', 'super_chat') NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'KRW',
    description TEXT,
    transaction_date DATE NOT NULL,
    status ENUM('pending', 'confirmed', 'paid') DEFAULT 'pending',
    platform VARCHAR(50), -- 'youtube', 'twitch', 'afreeca', 'custom'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (streamer_id) REFERENCES streamers(id),
    FOREIGN KEY (manager_id) REFERENCES managers(id)
);

-- 팬 테이블
CREATE TABLE fans (
    id INT PRIMARY KEY AUTO_INCREMENT,
    fan_user_id INT NOT NULL,
    streamer_id INT NOT NULL,
    subscription_type ENUM('free', 'basic', 'premium', 'vip') DEFAULT 'free',
    subscription_start DATE,
    subscription_end DATE,
    total_donations DECIMAL(10,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    last_interaction TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (fan_user_id) REFERENCES users(id),
    FOREIGN KEY (streamer_id) REFERENCES streamers(id),
    UNIQUE KEY unique_fan_streamer (fan_user_id, streamer_id)
);

-- 일정 테이블
CREATE TABLE schedules (
    id INT PRIMARY KEY AUTO_INCREMENT,
    streamer_id INT NOT NULL,
    manager_id INT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    event_type ENUM('stream', 'cosplay_photo', 'event', 'meeting', 'other') NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NULL,
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_pattern VARCHAR(50), -- 'daily', 'weekly', 'monthly'
    status ENUM('scheduled', 'live', 'completed', 'cancelled') DEFAULT 'scheduled',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (streamer_id) REFERENCES streamers(id),
    FOREIGN KEY (manager_id) REFERENCES managers(id)
);

-- 메시지 테이블 (매니저-스트리머 소통)
CREATE TABLE messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    streamer_id INT NOT NULL,
    message_type ENUM('text', 'image', 'file', 'system') DEFAULT 'text',
    content TEXT NOT NULL,
    attachment_url VARCHAR(255) NULL,
    is_read BOOLEAN DEFAULT FALSE,
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (receiver_id) REFERENCES users(id),
    FOREIGN KEY (streamer_id) REFERENCES streamers(id)
);

-- 알림 테이블
CREATE TABLE notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    streamer_id INT NULL,
    type ENUM('manager_added', 'manager_removed', 'content_approved', 'content_rejected', 'revenue_updated', 'schedule_reminder') NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    action_url VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (streamer_id) REFERENCES streamers(id)
);

-- 인덱스 생성
CREATE INDEX idx_streamers_user_id ON streamers(user_id);
CREATE INDEX idx_streamers_stream_type ON streamers(stream_type);
CREATE INDEX idx_managers_streamer_id ON managers(streamer_id);
CREATE INDEX idx_managers_user_id ON managers(user_id);
CREATE INDEX idx_content_streamer_id ON content(streamer_id);
CREATE INDEX idx_content_status ON content(status);
CREATE INDEX idx_revenue_streamer_id ON revenue(streamer_id);
CREATE INDEX idx_revenue_date ON revenue(transaction_date);
CREATE INDEX idx_fans_streamer_id ON fans(streamer_id);
CREATE INDEX idx_schedules_streamer_id ON schedules(streamer_id);
CREATE INDEX idx_schedules_start_time ON schedules(start_time);
CREATE INDEX idx_messages_streamer_id ON messages(streamer_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);

-- 샘플 데이터 삽입
INSERT INTO streamers (user_id, channel_name, stream_type, bio, total_views, total_followers, revenue) VALUES
(3, 'KimStream', 'streamer', '게임 스트리머입니다. 다양한 게임을 플레이합니다.', 125000, 1250, 2500000.00),
(6, 'CosplayQueen', 'cosplayer', '애니메이션 캐릭터 코스프레 전문가입니다.', 89000, 890, 1800000.00);

INSERT INTO managers (user_id, streamer_id, role, permissions, is_active) VALUES
(4, 1, 'full_manager', '{"page_management": true, "content_approval": true, "schedule_management": true, "communication_management": true, "revenue_management": true}', TRUE),
(5, 1, 'content_approver', '{"page_management": false, "content_approval": true, "schedule_management": false, "communication_management": false, "revenue_management": false}', TRUE),
(7, 2, 'full_manager', '{"page_management": true, "content_approval": true, "schedule_management": true, "communication_management": true, "revenue_management": true}', TRUE);

INSERT INTO content (streamer_id, manager_id, title, description, content_type, status, views, likes, comments) VALUES
(1, 1, '새로운 게임 플레이 영상', '최신 출시 게임을 플레이하는 영상입니다.', 'video', 'published', 1500, 45, 12),
(1, 2, '게임 팁 포스트', '게임 초보자를 위한 팁을 정리한 포스트입니다.', 'post', 'pending_approval', 0, 0, 0),
(2, 3, '애니메이션 캐릭터 코스프레', '인기 애니메이션 캐릭터 코스프레 사진입니다.', 'cosplay_photo', 'published', 2300, 78, 25);

INSERT INTO revenue (streamer_id, manager_id, source, amount, description, transaction_date, status) VALUES
(1, 1, 'subscription', 50000.00, '월 구독료', '2024-09-01', 'paid'),
(1, 1, 'donation', 25000.00, '팬 기부금', '2024-09-15', 'confirmed'),
(2, 3, 'merchandise', 150000.00, '코스프레 굿즈 판매', '2024-09-20', 'paid');

-- Notifications table
CREATE TABLE notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    type ENUM('todo_assigned', 'todo_completed', 'todo_updated', 'comment_added', 'mention', 'system') NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    related_id INT NULL, -- ID of related entity (todo, post, etc.)
    from_user_id INT NULL, -- User who triggered the notification
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (from_user_id) REFERENCES users(id),
    INDEX idx_user_notifications (user_id, created_at),
    INDEX idx_unread_notifications (user_id, is_read)
);

-- Todos table
CREATE TABLE todos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    status ENUM('pending', 'in_progress', 'completed', 'cancelled', 'on_hold') DEFAULT 'pending',
    priority INT DEFAULT 3 CHECK (priority >= 1 AND priority <= 5),
    category ENUM('feature', 'bug', 'improvement', 'documentation', 'testing', 'refactoring', 'deployment') DEFAULT 'feature',
    assignee_id INT NOT NULL,
    creator_id INT NOT NULL,
    due_date TIMESTAMP NULL,
    estimated_hours DECIMAL(5,2) NULL,
    actual_hours DECIMAL(5,2) DEFAULT 0,
    tags JSON,
    dependencies JSON, -- Array of todo IDs this todo depends on
    subtasks JSON, -- Array of subtask objects
    attachments JSON, -- Array of attachment objects
    comments JSON, -- Array of comment objects
    watchers JSON, -- Array of user IDs watching this todo
    project_id INT NULL,
    sprint_id INT NULL,
    is_overdue BOOLEAN GENERATED ALWAYS AS (
        CASE 
            WHEN due_date IS NULL THEN FALSE
            WHEN status IN ('completed', 'cancelled') THEN FALSE
            WHEN due_date < NOW() THEN TRUE
            ELSE FALSE
        END
    ) STORED,
    progress INT DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    time_remaining DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE 
            WHEN estimated_hours IS NULL THEN NULL
            WHEN actual_hours IS NULL THEN estimated_hours
            ELSE GREATEST(0, estimated_hours - actual_hours)
        END
    ) STORED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_archived BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (assignee_id) REFERENCES users(id),
    FOREIGN KEY (creator_id) REFERENCES users(id),
    INDEX idx_assignee_todos (assignee_id, status, created_at),
    INDEX idx_creator_todos (creator_id, created_at),
    INDEX idx_status_todos (status, created_at),
    INDEX idx_priority_todos (priority, created_at),
    INDEX idx_category_todos (category, created_at),
    INDEX idx_due_date_todos (due_date, status),
    INDEX idx_project_todos (project_id, status),
    INDEX idx_sprint_todos (sprint_id, status)
);

-- File uploads table
CREATE TABLE file_uploads (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_hash VARCHAR(64) NOT NULL, -- SHA-256 hash for deduplication
    upload_status ENUM('uploading', 'processing', 'completed', 'failed') DEFAULT 'uploading',
    processing_error TEXT NULL,
    metadata JSON, -- Additional file metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_user_uploads (user_id, created_at),
    INDEX idx_file_hash (file_hash),
    INDEX idx_upload_status (upload_status)
);

-- Languages table
CREATE TABLE languages (
    code VARCHAR(10) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    native_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Translation cache table
CREATE TABLE translation_cache (
    id INT PRIMARY KEY AUTO_INCREMENT,
    source_text TEXT NOT NULL,
    source_language VARCHAR(10) NOT NULL,
    target_language VARCHAR(10) NOT NULL,
    translated_text TEXT NOT NULL,
    confidence_score DECIMAL(3,2) DEFAULT 0.95,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    FOREIGN KEY (source_language) REFERENCES languages(code),
    FOREIGN KEY (target_language) REFERENCES languages(code),
    UNIQUE KEY unique_translation (source_text(500), source_language, target_language),
    INDEX idx_expires_at (expires_at)
);

-- Insert supported languages
INSERT INTO languages (code, name, native_name) VALUES
('en', 'English', 'English'),
('ko', 'Korean', '한국어');