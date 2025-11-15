-- 온라인 상태 추적 테이블 생성
CREATE TABLE IF NOT EXISTS user_online_status (
    user_id INT PRIMARY KEY,
    is_online BOOLEAN DEFAULT FALSE,
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_heartbeat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'offline' COMMENT 'online, offline, away, busy',
    device_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_is_online (is_online),
    INDEX idx_last_seen (last_seen),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='사용자 온라인 상태 추적';

-- users 테이블에 온라인 상태 관련 컬럼 추가 (필요시)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS show_online_status BOOLEAN DEFAULT TRUE COMMENT '온라인 상태 공개 여부',
ADD COLUMN IF NOT EXISTS last_activity TIMESTAMP NULL COMMENT '마지막 활동 시간';

-- 온라인 사용자 통계를 위한 뷰 생성
CREATE OR REPLACE VIEW online_users_summary AS
SELECT 
    COUNT(*) as total_online,
    COUNT(CASE WHEN status = 'online' THEN 1 END) as actively_online,
    COUNT(CASE WHEN status = 'away' THEN 1 END) as away,
    COUNT(CASE WHEN status = 'busy' THEN 1 END) as busy,
    COUNT(CASE WHEN device_type = 'mobile' THEN 1 END) as mobile_users,
    COUNT(CASE WHEN device_type = 'desktop' THEN 1 END) as desktop_users
FROM user_online_status
WHERE is_online = TRUE 
AND last_heartbeat > DATE_SUB(NOW(), INTERVAL 5 MINUTE);

-- 오래된 오프라인 상태 정리를 위한 이벤트 (선택사항)
-- DELIMITER $$
-- CREATE EVENT IF NOT EXISTS cleanup_offline_users
-- ON SCHEDULE EVERY 5 MINUTE
-- DO BEGIN
--     UPDATE user_online_status 
--     SET is_online = FALSE, status = 'offline'
--     WHERE is_online = TRUE 
--     AND last_heartbeat < DATE_SUB(NOW(), INTERVAL 5 MINUTE);
-- END$$
-- DELIMITER ;
