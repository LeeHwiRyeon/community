-- 알림 시스템 테이블 생성
-- 작성일: 2025년 11월 9일

-- notifications 테이블
CREATE TABLE IF NOT EXISTS notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    type ENUM('comment', 'like', 'mention', 'follow', 'reply', 'system') NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    link VARCHAR(500),
    is_read BOOLEAN DEFAULT FALSE,
    sender_id BIGINT NULL,
    sender_name VARCHAR(100) NULL,
    sender_avatar VARCHAR(500) NULL,
    related_type VARCHAR(50) NULL,
    related_id INT NULL,
    action_url VARCHAR(500) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_user_read (user_id, is_read),
    INDEX idx_created_at (created_at),
    INDEX idx_sender_id (sender_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- notification_settings 테이블
CREATE TABLE IF NOT EXISTS notification_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL UNIQUE,
    enable_comment BOOLEAN DEFAULT TRUE,
    enable_like BOOLEAN DEFAULT TRUE,
    enable_mention BOOLEAN DEFAULT TRUE,
    enable_follow BOOLEAN DEFAULT TRUE,
    enable_reply BOOLEAN DEFAULT TRUE,
    enable_system BOOLEAN DEFAULT TRUE,
    enable_push BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 알림 통계를 위한 뷰
CREATE OR REPLACE VIEW notification_stats AS
SELECT 
    user_id,
    COUNT(*) as total_count,
    SUM(CASE WHEN is_read = FALSE THEN 1 ELSE 0 END) as unread_count,
    MAX(created_at) as latest_notification
FROM notifications
GROUP BY user_id;
