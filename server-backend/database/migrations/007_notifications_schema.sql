-- ============================================================
-- Notifications Schema Migration
-- Version: 1.0
-- Created: 2025-11-11
-- Description: 실시간 알림 시스템 데이터베이스 스키마
-- ============================================================

-- 1. 알림 테이블
CREATE TABLE IF NOT EXISTS notifications (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    type ENUM('comment', 'like', 'mention', 'follow', 'reply', 'system') NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    link VARCHAR(500) DEFAULT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id),
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at),
    INDEX idx_user_read (user_id, is_read),
    INDEX idx_user_created (user_id, created_at DESC),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='사용자 알림 저장 테이블';

-- 2. 알림 설정 테이블
CREATE TABLE IF NOT EXISTS notification_settings (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL UNIQUE,
    
    -- 알림 타입별 활성화 설정
    enable_comment BOOLEAN DEFAULT TRUE COMMENT '댓글 알림',
    enable_like BOOLEAN DEFAULT TRUE COMMENT '좋아요 알림',
    enable_mention BOOLEAN DEFAULT TRUE COMMENT '멘션 알림',
    enable_follow BOOLEAN DEFAULT TRUE COMMENT '팔로우 알림',
    enable_reply BOOLEAN DEFAULT TRUE COMMENT '답글 알림',
    enable_system BOOLEAN DEFAULT TRUE COMMENT '시스템 알림',
    
    -- 푸시 알림 설정
    enable_push BOOLEAN DEFAULT FALSE COMMENT '브라우저 푸시 알림',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='사용자별 알림 설정';

-- 3. 알림 통계 뷰 (자주 사용되는 쿼리 최적화)
CREATE OR REPLACE VIEW notification_stats AS
SELECT 
    user_id,
    COUNT(*) as total_notifications,
    SUM(CASE WHEN is_read = FALSE THEN 1 ELSE 0 END) as unread_count,
    SUM(CASE WHEN type = 'comment' THEN 1 ELSE 0 END) as comment_count,
    SUM(CASE WHEN type = 'like' THEN 1 ELSE 0 END) as like_count,
    SUM(CASE WHEN type = 'mention' THEN 1 ELSE 0 END) as mention_count,
    SUM(CASE WHEN type = 'follow' THEN 1 ELSE 0 END) as follow_count,
    SUM(CASE WHEN type = 'reply' THEN 1 ELSE 0 END) as reply_count,
    SUM(CASE WHEN type = 'system' THEN 1 ELSE 0 END) as system_count,
    MAX(created_at) as last_notification_at
FROM notifications
GROUP BY user_id;

-- 4. 오래된 알림 자동 삭제 이벤트 (90일 이상 된 읽은 알림 삭제)
DELIMITER //

CREATE EVENT IF NOT EXISTS cleanup_old_notifications
ON SCHEDULE EVERY 1 DAY
STARTS (TIMESTAMP(CURRENT_DATE) + INTERVAL 2 HOUR)
DO
BEGIN
    DELETE FROM notifications 
    WHERE is_read = TRUE 
    AND read_at < DATE_SUB(NOW(), INTERVAL 90 DAY);
    
    -- 로그 기록
    INSERT INTO system_logs (event_type, message, created_at)
    VALUES ('notification_cleanup', CONCAT('Cleaned up old notifications: ', ROW_COUNT(), ' rows deleted'), NOW())
    ON DUPLICATE KEY UPDATE message = VALUES(message), created_at = NOW();
END//

DELIMITER ;

-- 5. 시스템 로그 테이블 (이벤트 로그용)
CREATE TABLE IF NOT EXISTS system_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    event_type VARCHAR(64) NOT NULL,
    message TEXT,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_event_type (event_type),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. 샘플 데이터 (개발 환경용)
-- INSERT INTO notification_settings (user_id) 
-- SELECT id FROM users 
-- WHERE NOT EXISTS (SELECT 1 FROM notification_settings WHERE notification_settings.user_id = users.id);
