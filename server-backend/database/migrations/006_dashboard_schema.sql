-- ============================================================
-- Dashboard Schema Migration
-- Version: 1.0
-- Created: 2025-11-09
-- Description: 활동 분석 대시보드 데이터베이스 스키마
-- ============================================================

-- 1. 일별 통계 테이블
CREATE TABLE IF NOT EXISTS daily_stats (
    id INT PRIMARY KEY AUTO_INCREMENT,
    stat_date DATE NOT NULL UNIQUE,
    total_users INT DEFAULT 0,
    active_users INT DEFAULT 0,
    new_users INT DEFAULT 0,
    total_posts INT DEFAULT 0,
    new_posts INT DEFAULT 0,
    total_comments INT DEFAULT 0,
    new_comments INT DEFAULT 0,
    total_likes INT DEFAULT 0,
    new_likes INT DEFAULT 0,
    total_views INT DEFAULT 0,
    new_views INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_stat_date (stat_date),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. 사용자 활동 로그 테이블
CREATE TABLE IF NOT EXISTS user_activity_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    activity_type ENUM('post_created', 'comment_created', 'like_added', 'post_viewed', 'login', 'logout') NOT NULL,
    target_type ENUM('post', 'comment', 'user', 'system') DEFAULT NULL,
    target_id INT DEFAULT NULL,
    metadata JSON DEFAULT NULL,
    ip_address VARCHAR(45) DEFAULT NULL,
    user_agent VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_activity_type (activity_type),
    INDEX idx_created_at (created_at),
    INDEX idx_user_activity (user_id, created_at),
    INDEX idx_target (target_type, target_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. 카테고리별 통계 테이블 (스킵 - categories 테이블 없음)
-- CREATE TABLE IF NOT EXISTS category_stats (
--     id INT PRIMARY KEY AUTO_INCREMENT,
--     category_id INT NOT NULL,
--     stat_date DATE NOT NULL,
--     post_count INT DEFAULT 0,
--     comment_count INT DEFAULT 0,
--     like_count INT DEFAULT 0,
--     view_count INT DEFAULT 0,
--     active_users INT DEFAULT 0,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
--     UNIQUE KEY uk_category_date (category_id, stat_date),
--     INDEX idx_category_id (category_id),
--     INDEX idx_stat_date (stat_date),
--     FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE CASCADE
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. 실시간 활동 피드 뷰 (자주 사용되는 쿼리 최적화)
CREATE OR REPLACE VIEW recent_activities AS
SELECT 
    ual.id,
    ual.user_id,
    u.username,
    u.email,
    ual.activity_type,
    ual.target_type,
    ual.target_id,
    CASE 
        WHEN ual.target_type = 'post' THEN p.title
        WHEN ual.target_type = 'comment' THEN c.content
        ELSE NULL
    END AS target_title,
    ual.created_at
FROM user_activity_logs ual
JOIN users u ON ual.user_id = u.user_id
LEFT JOIN posts p ON ual.target_type = 'post' AND ual.target_id = p.post_id
LEFT JOIN comments c ON ual.target_type = 'comment' AND ual.target_id = c.comment_id
WHERE ual.created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
ORDER BY ual.created_at DESC
LIMIT 100;

-- 5. 일별 통계 자동 업데이트 이벤트 (매일 자정 실행)
DELIMITER //

CREATE EVENT IF NOT EXISTS update_daily_stats
ON SCHEDULE EVERY 1 DAY
STARTS (TIMESTAMP(CURRENT_DATE) + INTERVAL 1 DAY)
DO
BEGIN
    -- 어제 날짜
    SET @yesterday = DATE_SUB(CURDATE(), INTERVAL 1 DAY);
    
    -- 일별 통계 삽입 또는 업데이트
    INSERT INTO daily_stats (
        stat_date,
        total_users,
        active_users,
        new_users,
        total_posts,
        new_posts,
        total_comments,
        new_comments,
        total_likes,
        new_likes,
        total_views,
        new_views
    )
    SELECT 
        @yesterday,
        (SELECT COUNT(*) FROM users WHERE created_at <= @yesterday),
        (SELECT COUNT(DISTINCT user_id) FROM user_activity_logs WHERE DATE(created_at) = @yesterday),
        (SELECT COUNT(*) FROM users WHERE DATE(created_at) = @yesterday),
        (SELECT COUNT(*) FROM posts WHERE created_at <= @yesterday),
        (SELECT COUNT(*) FROM posts WHERE DATE(created_at) = @yesterday),
        (SELECT COUNT(*) FROM comments WHERE created_at <= @yesterday),
        (SELECT COUNT(*) FROM comments WHERE DATE(created_at) = @yesterday),
        (SELECT COUNT(*) FROM likes WHERE created_at <= @yesterday),
        (SELECT COUNT(*) FROM likes WHERE DATE(created_at) = @yesterday),
        (SELECT COUNT(*) FROM post_views WHERE created_at <= @yesterday),
        (SELECT COUNT(*) FROM post_views WHERE DATE(created_at) = @yesterday)
    ON DUPLICATE KEY UPDATE
        total_users = VALUES(total_users),
        active_users = VALUES(active_users),
        new_users = VALUES(new_users),
        total_posts = VALUES(total_posts),
        new_posts = VALUES(new_posts),
        total_comments = VALUES(total_comments),
        new_comments = VALUES(new_comments),
        total_likes = VALUES(total_likes),
        new_likes = VALUES(new_likes),
        total_views = VALUES(total_views),
        new_views = VALUES(new_views),
        updated_at = CURRENT_TIMESTAMP;
    
    -- 카테고리별 통계 업데이트 (스킵 - category_stats 테이블 없음)
    -- INSERT INTO category_stats (
    --     category_id,
    --     stat_date,
    --     post_count,
    --     comment_count,
    --     like_count,
    --     view_count,
    --     active_users
    -- )
    -- SELECT 
    --     c.category_id,
    --     @yesterday,
    --     COUNT(DISTINCT p.post_id),
    --     COUNT(DISTINCT co.comment_id),
    --     COUNT(DISTINCT l.like_id),
    --     COUNT(DISTINCT pv.view_id),
    --     COUNT(DISTINCT p.user_id)
    -- FROM categories c
    -- LEFT JOIN posts p ON c.category_id = p.category_id AND DATE(p.created_at) = @yesterday
    -- LEFT JOIN comments co ON p.post_id = co.post_id AND DATE(co.created_at) = @yesterday
    -- LEFT JOIN likes l ON p.post_id = l.post_id AND DATE(l.created_at) = @yesterday
    -- LEFT JOIN post_views pv ON p.post_id = pv.post_id AND DATE(pv.created_at) = @yesterday
    -- GROUP BY c.category_id
    -- ON DUPLICATE KEY UPDATE
    --     post_count = VALUES(post_count),
    --     comment_count = VALUES(comment_count),
    --     like_count = VALUES(like_count),
    --     view_count = VALUES(view_count),
    --     active_users = VALUES(active_users),
    --     updated_at = CURRENT_TIMESTAMP;
END//

DELIMITER ;

-- 6. 활동 로그 자동 생성 트리거

-- 게시물 생성 시
DELIMITER //
CREATE TRIGGER IF NOT EXISTS after_post_insert
AFTER INSERT ON posts
FOR EACH ROW
BEGIN
    INSERT INTO user_activity_logs (user_id, activity_type, target_type, target_id)
    VALUES (NEW.user_id, 'post_created', 'post', NEW.post_id);
END//
DELIMITER ;

-- 댓글 생성 시
DELIMITER //
CREATE TRIGGER IF NOT EXISTS after_comment_insert
AFTER INSERT ON comments
FOR EACH ROW
BEGIN
    INSERT INTO user_activity_logs (user_id, activity_type, target_type, target_id)
    VALUES (NEW.user_id, 'comment_created', 'comment', NEW.comment_id);
END//
DELIMITER ;

-- 좋아요 추가 시
DELIMITER //
CREATE TRIGGER IF NOT EXISTS after_like_insert
AFTER INSERT ON likes
FOR EACH ROW
BEGIN
    INSERT INTO user_activity_logs (user_id, activity_type, target_type, target_id)
    VALUES (NEW.user_id, 'like_added', 'post', NEW.post_id);
END//
DELIMITER ;

-- 7. 초기 데이터 생성 (최근 30일)
DELIMITER //

CREATE PROCEDURE IF NOT EXISTS initialize_daily_stats()
BEGIN
    DECLARE i INT DEFAULT 0;
    DECLARE current_date DATE;
    
    WHILE i < 30 DO
        SET current_date = DATE_SUB(CURDATE(), INTERVAL i DAY);
        
        INSERT IGNORE INTO daily_stats (
            stat_date,
            total_users,
            active_users,
            new_users,
            total_posts,
            new_posts,
            total_comments,
            new_comments,
            total_likes,
            new_likes,
            total_views,
            new_views
        )
        SELECT 
            current_date,
            (SELECT COUNT(*) FROM users WHERE created_at <= current_date),
            (SELECT COUNT(DISTINCT user_id) FROM user_activity_logs WHERE DATE(created_at) = current_date),
            (SELECT COUNT(*) FROM users WHERE DATE(created_at) = current_date),
            (SELECT COUNT(*) FROM posts WHERE created_at <= current_date),
            (SELECT COUNT(*) FROM posts WHERE DATE(created_at) = current_date),
            (SELECT COUNT(*) FROM comments WHERE created_at <= current_date),
            (SELECT COUNT(*) FROM comments WHERE DATE(created_at) = current_date),
            (SELECT COUNT(*) FROM likes WHERE created_at <= current_date),
            (SELECT COUNT(*) FROM likes WHERE DATE(created_at) = current_date),
            (SELECT COUNT(*) FROM post_views WHERE created_at <= current_date),
            (SELECT COUNT(*) FROM post_views WHERE DATE(created_at) = current_date);
        
        SET i = i + 1;
    END WHILE;
END//

DELIMITER ;

-- 초기 데이터 생성 실행
CALL initialize_daily_stats();

-- 8. 유용한 인덱스 추가 (성능 최적화)
ALTER TABLE posts ADD INDEX idx_created_category (created_at, category_id);
ALTER TABLE comments ADD INDEX idx_created_post (created_at, post_id);
ALTER TABLE likes ADD INDEX idx_created_post (created_at, post_id);
ALTER TABLE post_views ADD INDEX idx_created_post (created_at, post_id);

-- ============================================================
-- 마이그레이션 완료
-- ============================================================
