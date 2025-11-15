-- ============================================
-- Social Features Migration
-- Phase 3 Task #6 - 소셜 기능 강화
-- 작성일: 2025년 11월 9일
-- ============================================

USE community_platform;

-- ============================================
-- 1. Follows Table (팔로우 관계)
-- ============================================

CREATE TABLE IF NOT EXISTS follows (
    id INT AUTO_INCREMENT PRIMARY KEY,
    follower_id INT NOT NULL COMMENT '팔로워 (following하는 사용자)',
    following_id INT NOT NULL COMMENT '팔로잉 (followed되는 사용자)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '팔로우 시작 시간',
    
    -- 제약 조건
    UNIQUE KEY unique_follow (follower_id, following_id),
    FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- 자기 자신 팔로우 방지
    CHECK (follower_id != following_id),
    
    -- 인덱스
    INDEX idx_follower (follower_id),
    INDEX idx_following (following_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='사용자 팔로우 관계';

-- ============================================
-- 2. Mentions Table (멘션 기록)
-- ============================================

CREATE TABLE IF NOT EXISTS mentions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NULL COMMENT '게시물 ID (게시물 멘션)',
    comment_id INT NULL COMMENT '댓글 ID (댓글 멘션)',
    mentioned_user_id INT NOT NULL COMMENT '멘션된 사용자 ID',
    mentioned_by_user_id INT NOT NULL COMMENT '멘션한 사용자 ID',
    content TEXT COMMENT '멘션 컨텍스트 (원본 텍스트 일부)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 제약 조건
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
    FOREIGN KEY (mentioned_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (mentioned_by_user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- 게시물 또는 댓글 중 하나만 존재
    CHECK ((post_id IS NOT NULL AND comment_id IS NULL) OR 
           (post_id IS NULL AND comment_id IS NOT NULL)),
    
    -- 인덱스
    INDEX idx_mentioned_user (mentioned_user_id, created_at),
    INDEX idx_post (post_id),
    INDEX idx_comment (comment_id),
    INDEX idx_mentioned_by (mentioned_by_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='사용자 멘션 기록';

-- ============================================
-- 3. Blocked Users Table (차단된 사용자)
-- ============================================

CREATE TABLE IF NOT EXISTS blocked_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    blocker_id INT NOT NULL COMMENT '차단한 사용자',
    blocked_id INT NOT NULL COMMENT '차단된 사용자',
    reason VARCHAR(255) NULL COMMENT '차단 사유 (선택적)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '차단 시간',
    
    -- 제약 조건
    UNIQUE KEY unique_block (blocker_id, blocked_id),
    FOREIGN KEY (blocker_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (blocked_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- 자기 자신 차단 방지
    CHECK (blocker_id != blocked_id),
    
    -- 인덱스
    INDEX idx_blocker (blocker_id),
    INDEX idx_blocked (blocked_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='사용자 차단 관계';

-- ============================================
-- 4. Shares Table (공유 통계)
-- ============================================

CREATE TABLE IF NOT EXISTS shares (
    id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NOT NULL COMMENT '공유된 게시물 ID',
    user_id INT NULL COMMENT '공유한 사용자 ID (로그인한 경우)',
    platform VARCHAR(50) NOT NULL COMMENT '공유 플랫폼 (twitter, facebook, linkedin, clipboard)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 제약 조건
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    
    -- 인덱스
    INDEX idx_post (post_id, created_at),
    INDEX idx_user (user_id),
    INDEX idx_platform (platform),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='게시물 공유 통계';

-- ============================================
-- 5. 트리거: 팔로우 시 알림 생성
-- ============================================

DELIMITER //

CREATE TRIGGER after_follow_insert
AFTER INSERT ON follows
FOR EACH ROW
BEGIN
    -- 팔로우 알림 생성
    INSERT INTO notifications (
        user_id,
        type,
        message,
        related_user_id,
        created_at
    ) VALUES (
        NEW.following_id,
        'follow',
        CONCAT((SELECT username FROM users WHERE id = NEW.follower_id), '님이 회원님을 팔로우하기 시작했습니다.'),
        NEW.follower_id,
        NOW()
    );
END//

DELIMITER ;

-- ============================================
-- 6. 트리거: 멘션 시 알림 생성
-- ============================================

DELIMITER //

CREATE TRIGGER after_mention_insert
AFTER INSERT ON mentions
FOR EACH ROW
BEGIN
    DECLARE content_preview VARCHAR(100);
    
    -- 멘션 컨텍스트 미리보기 (최대 100자)
    SET content_preview = LEFT(NEW.content, 100);
    
    -- 멘션 알림 생성
    INSERT INTO notifications (
        user_id,
        type,
        message,
        related_user_id,
        related_post_id,
        related_comment_id,
        created_at
    ) VALUES (
        NEW.mentioned_user_id,
        'mention',
        CONCAT((SELECT username FROM users WHERE id = NEW.mentioned_by_user_id), '님이 회원님을 멘션했습니다: ', content_preview),
        NEW.mentioned_by_user_id,
        NEW.post_id,
        NEW.comment_id,
        NOW()
    );
END//

DELIMITER ;

-- ============================================
-- 7. 통계 View: 팔로워/팔로잉 카운트
-- ============================================

CREATE OR REPLACE VIEW user_follow_stats AS
SELECT 
    u.id AS user_id,
    u.username,
    COALESCE(followers.count, 0) AS followers_count,
    COALESCE(following.count, 0) AS following_count
FROM users u
LEFT JOIN (
    SELECT following_id, COUNT(*) AS count
    FROM follows
    GROUP BY following_id
) followers ON u.id = followers.following_id
LEFT JOIN (
    SELECT follower_id, COUNT(*) AS count
    FROM follows
    GROUP BY follower_id
) following ON u.id = following.follower_id;

-- ============================================
-- 8. 통계 View: 게시물 공유 통계
-- ============================================

CREATE OR REPLACE VIEW post_share_stats AS
SELECT 
    p.id AS post_id,
    p.title,
    COUNT(s.id) AS total_shares,
    SUM(CASE WHEN s.platform = 'twitter' THEN 1 ELSE 0 END) AS twitter_shares,
    SUM(CASE WHEN s.platform = 'facebook' THEN 1 ELSE 0 END) AS facebook_shares,
    SUM(CASE WHEN s.platform = 'linkedin' THEN 1 ELSE 0 END) AS linkedin_shares,
    SUM(CASE WHEN s.platform = 'clipboard' THEN 1 ELSE 0 END) AS clipboard_shares,
    MAX(s.created_at) AS last_shared_at
FROM posts p
LEFT JOIN shares s ON p.id = s.post_id
GROUP BY p.id, p.title;

-- ============================================
-- 9. 기존 users 테이블에 팔로워/팔로잉 통계 추가 (선택적)
-- ============================================

-- 이미 user_profiles에 통계가 있을 수 있으므로 체크 후 추가
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS followers_count INT DEFAULT 0 COMMENT '팔로워 수',
ADD COLUMN IF NOT EXISTS following_count INT DEFAULT 0 COMMENT '팔로잉 수';

-- ============================================
-- 10. 이벤트: 팔로워/팔로잉 카운트 자동 업데이트 (매시간)
-- ============================================

DELIMITER //

CREATE EVENT IF NOT EXISTS update_follow_counts
ON SCHEDULE EVERY 1 HOUR
DO
BEGIN
    -- followers_count 업데이트
    UPDATE users u
    LEFT JOIN (
        SELECT following_id, COUNT(*) AS count
        FROM follows
        GROUP BY following_id
    ) f ON u.id = f.following_id
    SET u.followers_count = COALESCE(f.count, 0);
    
    -- following_count 업데이트
    UPDATE users u
    LEFT JOIN (
        SELECT follower_id, COUNT(*) AS count
        FROM follows
        GROUP BY follower_id
    ) f ON u.id = f.follower_id
    SET u.following_count = COALESCE(f.count, 0);
END//

DELIMITER ;

-- 이벤트 스케줄러 활성화
SET GLOBAL event_scheduler = ON;

-- ============================================
-- 11. 초기 데이터 검증 쿼리
-- ============================================

-- 팔로우 관계 확인
-- SELECT * FROM follows LIMIT 10;

-- 멘션 기록 확인
-- SELECT * FROM mentions LIMIT 10;

-- 차단된 사용자 확인
-- SELECT * FROM blocked_users LIMIT 10;

-- 공유 통계 확인
-- SELECT * FROM shares LIMIT 10;

-- 팔로우 통계 View
-- SELECT * FROM user_follow_stats LIMIT 10;

-- 공유 통계 View
-- SELECT * FROM post_share_stats ORDER BY total_shares DESC LIMIT 10;

-- ============================================
-- 마이그레이션 완료
-- ============================================

SELECT 'Social Features Migration Completed!' AS status;
