-- ============================================================================
-- Post Drafts System Migration
-- 게시글 임시저장 시스템 데이터베이스 스키마
-- ============================================================================

-- 게시글 초안 테이블
CREATE TABLE IF NOT EXISTS post_drafts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    board_id INT,
    title VARCHAR(255),
    content TEXT,
    category VARCHAR(50),
    tags JSON,
    metadata JSON,
    version INT DEFAULT 1,
    last_saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP DEFAULT (DATE_ADD(NOW(), INTERVAL 30 DAY)),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE SET NULL,
    INDEX idx_user_drafts (user_id, created_at DESC),
    INDEX idx_expires (expires_at),
    INDEX idx_last_saved (last_saved_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 초안 통계 뷰
CREATE OR REPLACE VIEW draft_stats AS
SELECT 
    u.id AS user_id,
    u.username,
    COUNT(d.id) AS total_drafts,
    COUNT(CASE WHEN d.expires_at > NOW() THEN 1 END) AS active_drafts,
    COUNT(CASE WHEN d.expires_at <= NOW() THEN 1 END) AS expired_drafts,
    MAX(d.last_saved_at) AS last_draft_saved_at,
    MIN(d.created_at) AS oldest_draft_at
FROM users u
LEFT JOIN post_drafts d ON u.id = d.user_id
GROUP BY u.id, u.username;

-- 최근 초안 뷰 (만료되지 않은 초안만)
CREATE OR REPLACE VIEW recent_drafts AS
SELECT 
    d.id,
    d.user_id,
    u.username,
    d.board_id,
    b.name AS board_name,
    d.title,
    SUBSTRING(d.content, 1, 200) AS content_preview,
    d.category,
    d.tags,
    d.version,
    d.last_saved_at,
    d.created_at,
    d.expires_at,
    TIMESTAMPDIFF(DAY, NOW(), d.expires_at) AS days_until_expiry
FROM post_drafts d
INNER JOIN users u ON d.user_id = u.id
LEFT JOIN boards b ON d.board_id = b.id
WHERE d.expires_at > NOW()
ORDER BY d.last_saved_at DESC;

-- 만료된 초안 자동 삭제를 위한 이벤트 (선택사항)
-- MySQL 8.0 이상에서 사용 가능
-- DELIMITER $$
-- CREATE EVENT IF NOT EXISTS cleanup_expired_drafts
-- ON SCHEDULE EVERY 1 DAY
-- STARTS CURRENT_TIMESTAMP
-- DO
-- BEGIN
--     DELETE FROM post_drafts WHERE expires_at <= NOW();
-- END$$
-- DELIMITER ;

-- 초안 정보 메시지
SELECT 'Post drafts system migration completed successfully!' AS status;
SELECT 'Tables created: post_drafts' AS info;
SELECT 'Views created: draft_stats, recent_drafts' AS info;
SELECT 'Drafts will expire after 30 days by default' AS note;
