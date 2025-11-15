-- ====================================================================
-- Migration: 011_add_user_profiles.sql
-- Description: 사용자 프로필 강화 시스템
-- Author: GitHub Copilot
-- Created: 2025-01-XX
-- Phase: 3 - Task 8
-- ====================================================================

-- 1. users 테이블 확장 (프로필 정보 추가)
-- ====================================================================

ALTER TABLE users
ADD COLUMN IF NOT EXISTS profile_image_url VARCHAR(500) DEFAULT NULL COMMENT '프로필 이미지 URL',
ADD COLUMN IF NOT EXISTS cover_image_url VARCHAR(500) DEFAULT NULL COMMENT '커버 이미지 URL',
ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT NULL COMMENT '자기소개',
ADD COLUMN IF NOT EXISTS location VARCHAR(100) DEFAULT NULL COMMENT '위치',
ADD COLUMN IF NOT EXISTS website VARCHAR(255) DEFAULT NULL COMMENT '웹사이트 URL',
ADD COLUMN IF NOT EXISTS twitter_handle VARCHAR(50) DEFAULT NULL COMMENT 'Twitter 핸들',
ADD COLUMN IF NOT EXISTS github_username VARCHAR(50) DEFAULT NULL COMMENT 'GitHub 사용자명',
ADD COLUMN IF NOT EXISTS linkedin_url VARCHAR(255) DEFAULT NULL COMMENT 'LinkedIn URL',
ADD COLUMN IF NOT EXISTS interests JSON DEFAULT NULL COMMENT '관심사 태그 배열',
ADD COLUMN IF NOT EXISTS is_profile_public BOOLEAN DEFAULT TRUE COMMENT '프로필 공개 여부',
ADD COLUMN IF NOT EXISTS badge_level ENUM('newbie', 'member', 'active', 'expert', 'admin') DEFAULT 'newbie' COMMENT '배지 레벨';

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_users_badge_level ON users(badge_level);
CREATE INDEX IF NOT EXISTS idx_users_is_public ON users(is_profile_public);

-- ====================================================================
-- 2. user_activity_stats 테이블 (활동 통계)
-- ====================================================================

CREATE TABLE IF NOT EXISTS user_activity_stats (
    user_id INT PRIMARY KEY,
    post_count INT DEFAULT 0 COMMENT '작성한 게시글 수',
    comment_count INT DEFAULT 0 COMMENT '작성한 댓글 수',
    received_likes INT DEFAULT 0 COMMENT '받은 좋아요 수',
    follower_count INT DEFAULT 0 COMMENT '팔로워 수',
    following_count INT DEFAULT 0 COMMENT '팔로잉 수',
    bookmark_count INT DEFAULT 0 COMMENT '북마크 수',
    reputation_score INT DEFAULT 0 COMMENT '평판 점수',
    last_post_at TIMESTAMP NULL COMMENT '마지막 게시글 작성 시각',
    last_comment_at TIMESTAMP NULL COMMENT '마지막 댓글 작성 시각',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_reputation (reputation_score DESC),
    INDEX idx_post_count (post_count DESC),
    INDEX idx_follower_count (follower_count DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='사용자 활동 통계';

-- ====================================================================
-- 3. user_badges 테이블 (배지 시스템)
-- ====================================================================

CREATE TABLE IF NOT EXISTS user_badges (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    badge_type ENUM(
        'new_member',
        'verified_email',
        'first_post',
        'active_contributor',
        'popular_author',
        'helpful_commenter',
        'super_user',
        'moderator',
        'admin'
    ) NOT NULL COMMENT '배지 타입',
    badge_name VARCHAR(100) NOT NULL COMMENT '배지 이름',
    description VARCHAR(255) DEFAULT NULL COMMENT '배지 설명',
    icon_url VARCHAR(500) DEFAULT NULL COMMENT '배지 아이콘 URL',
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '획득 시각',
    is_visible BOOLEAN DEFAULT TRUE COMMENT '프로필 표시 여부',
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_badge (user_id, badge_type),
    INDEX idx_user_id (user_id),
    INDEX idx_earned_at (earned_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='사용자 배지';

-- ====================================================================
-- 4. user_profile_views 테이블 (프로필 조회 기록)
-- ====================================================================

CREATE TABLE IF NOT EXISTS user_profile_views (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    profile_user_id INT NOT NULL COMMENT '프로필 주인',
    viewer_user_id INT DEFAULT NULL COMMENT '조회한 사용자 (NULL=비로그인)',
    viewer_ip VARCHAR(45) DEFAULT NULL COMMENT '조회자 IP',
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (profile_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (viewer_user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_profile_user (profile_user_id),
    INDEX idx_viewed_at (viewed_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='프로필 조회 기록';

-- ====================================================================
-- 5. 뷰: v_user_profiles (완전한 사용자 프로필)
-- ====================================================================

CREATE OR REPLACE VIEW v_user_profiles AS
SELECT 
    u.id,
    u.username,
    u.display_name,
    u.email,
    u.avatar_url,
    u.profile_image_url,
    u.cover_image_url,
    u.bio,
    u.location,
    u.website,
    u.twitter_handle,
    u.github_username,
    u.linkedin_url,
    u.interests,
    u.is_profile_public,
    u.badge_level,
    u.is_active,
    u.is_admin,
    u.created_at AS joined_at,
    
    -- 활동 통계
    COALESCE(stats.post_count, 0) AS post_count,
    COALESCE(stats.comment_count, 0) AS comment_count,
    COALESCE(stats.received_likes, 0) AS received_likes,
    COALESCE(stats.follower_count, 0) AS follower_count,
    COALESCE(stats.following_count, 0) AS following_count,
    COALESCE(stats.bookmark_count, 0) AS bookmark_count,
    COALESCE(stats.reputation_score, 0) AS reputation_score,
    stats.last_post_at,
    stats.last_comment_at,
    
    -- 온라인 상태
    COALESCE(os.status, 'offline') AS online_status,
    os.last_activity,
    
    -- 프로필 조회수 (최근 30일)
    (
        SELECT COUNT(DISTINCT viewer_ip)
        FROM user_profile_views
        WHERE profile_user_id = u.id
        AND viewed_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    ) AS profile_views_30d
    
FROM users u
LEFT JOIN user_activity_stats stats ON u.id = stats.user_id
LEFT JOIN user_online_status os ON u.id = os.user_id;

-- ====================================================================
-- 6. 뷰: v_user_badges_display (배지 표시용)
-- ====================================================================

CREATE OR REPLACE VIEW v_user_badges_display AS
SELECT 
    ub.user_id,
    u.username,
    ub.badge_type,
    ub.badge_name,
    ub.description,
    ub.icon_url,
    ub.earned_at,
    ub.is_visible
FROM user_badges ub
JOIN users u ON ub.user_id = u.id
WHERE ub.is_visible = TRUE
ORDER BY ub.earned_at DESC;

-- ====================================================================
-- 7. 뷰: v_top_contributors (상위 기여자)
-- ====================================================================

CREATE OR REPLACE VIEW v_top_contributors AS
SELECT 
    u.id,
    u.username,
    u.display_name,
    u.avatar_url,
    u.badge_level,
    stats.reputation_score,
    stats.post_count,
    stats.comment_count,
    stats.received_likes,
    stats.follower_count,
    -- 기여도 점수 계산
    (
        stats.post_count * 5 + 
        stats.comment_count * 2 + 
        stats.received_likes * 1 +
        stats.follower_count * 3
    ) AS contribution_score
FROM users u
JOIN user_activity_stats stats ON u.id = stats.user_id
WHERE u.is_active = TRUE
ORDER BY contribution_score DESC
LIMIT 100;

-- ====================================================================
-- 8. 트리거: 사용자 생성 시 통계 초기화
-- ====================================================================

DELIMITER $$

CREATE TRIGGER IF NOT EXISTS after_user_insert_init_stats
AFTER INSERT ON users
FOR EACH ROW
BEGIN
    -- 활동 통계 초기화
    INSERT INTO user_activity_stats (user_id)
    VALUES (NEW.id);
    
    -- 신규 회원 배지 자동 부여
    INSERT INTO user_badges (user_id, badge_type, badge_name, description)
    VALUES (
        NEW.id,
        'new_member',
        '신규 회원',
        '커뮤니티에 가입한 신규 회원입니다.'
    );
END$$

DELIMITER ;

-- ====================================================================
-- 9. 트리거: 게시글 작성 시 통계 업데이트
-- ====================================================================

DELIMITER $$

CREATE TRIGGER IF NOT EXISTS after_post_insert_update_stats
AFTER INSERT ON posts
FOR EACH ROW
BEGIN
    UPDATE user_activity_stats
    SET 
        post_count = post_count + 1,
        last_post_at = NOW(),
        updated_at = NOW()
    WHERE user_id = NEW.user_id;
    
    -- 첫 게시글 배지 부여
    IF NOT EXISTS (
        SELECT 1 FROM user_badges 
        WHERE user_id = NEW.user_id AND badge_type = 'first_post'
    ) THEN
        INSERT INTO user_badges (user_id, badge_type, badge_name, description)
        VALUES (
            NEW.user_id,
            'first_post',
            '첫 게시글',
            '첫 번째 게시글을 작성했습니다.'
        );
    END IF;
    
    -- 활동적인 기여자 배지 (게시글 10개 이상)
    IF (SELECT post_count FROM user_activity_stats WHERE user_id = NEW.user_id) >= 10
       AND NOT EXISTS (
           SELECT 1 FROM user_badges 
           WHERE user_id = NEW.user_id AND badge_type = 'active_contributor'
       ) THEN
        INSERT INTO user_badges (user_id, badge_type, badge_name, description)
        VALUES (
            NEW.user_id,
            'active_contributor',
            '활동적인 기여자',
            '10개 이상의 게시글을 작성했습니다.'
        );
    END IF;
END$$

DELIMITER ;

-- ====================================================================
-- 10. 트리거: 댓글 작성 시 통계 업데이트
-- ====================================================================

DELIMITER $$

CREATE TRIGGER IF NOT EXISTS after_comment_insert_update_stats
AFTER INSERT ON comments
FOR EACH ROW
BEGIN
    UPDATE user_activity_stats
    SET 
        comment_count = comment_count + 1,
        last_comment_at = NOW(),
        updated_at = NOW()
    WHERE user_id = NEW.user_id;
END$$

DELIMITER ;

-- ====================================================================
-- 11. 프로시저: 평판 점수 재계산
-- ====================================================================

DELIMITER $$

CREATE PROCEDURE IF NOT EXISTS sp_recalculate_reputation(IN target_user_id INT)
BEGIN
    DECLARE total_reputation INT DEFAULT 0;
    
    -- 게시글 좋아요 (각 5점)
    SET total_reputation = total_reputation + (
        SELECT COALESCE(SUM(like_count), 0) * 5
        FROM posts
        WHERE user_id = target_user_id
    );
    
    -- 댓글 좋아요 (각 2점)
    SET total_reputation = total_reputation + (
        SELECT COALESCE(COUNT(*), 0) * 2
        FROM comments c
        JOIN votes v ON c.id = v.comment_id
        WHERE c.user_id = target_user_id AND v.vote_type = 'upvote'
    );
    
    -- 팔로워 (각 3점)
    SET total_reputation = total_reputation + (
        SELECT COALESCE(COUNT(*), 0) * 3
        FROM user_follows
        WHERE following_id = target_user_id
    );
    
    -- 통계 업데이트
    UPDATE user_activity_stats
    SET 
        reputation_score = total_reputation,
        updated_at = NOW()
    WHERE user_id = target_user_id;
    
    -- 인기 작성자 배지 (평판 100 이상)
    IF total_reputation >= 100
       AND NOT EXISTS (
           SELECT 1 FROM user_badges 
           WHERE user_id = target_user_id AND badge_type = 'popular_author'
       ) THEN
        INSERT INTO user_badges (user_id, badge_type, badge_name, description)
        VALUES (
            target_user_id,
            'popular_author',
            '인기 작성자',
            '평판 점수 100점을 달성했습니다.'
        );
    END IF;
END$$

DELIMITER ;

-- ====================================================================
-- 12. 초기 데이터 설정
-- ====================================================================

-- 기존 사용자들에 대한 통계 초기화
INSERT INTO user_activity_stats (user_id)
SELECT id FROM users
WHERE id NOT IN (SELECT user_id FROM user_activity_stats);

-- 기존 사용자들의 통계 업데이트
UPDATE user_activity_stats stats
SET post_count = (
    SELECT COUNT(*) FROM posts WHERE user_id = stats.user_id
),
comment_count = (
    SELECT COUNT(*) FROM comments WHERE user_id = stats.user_id
),
received_likes = (
    SELECT COALESCE(SUM(like_count), 0) FROM posts WHERE user_id = stats.user_id
);

-- ====================================================================
-- Migration Complete
-- ====================================================================

SELECT '✅ Migration 011_add_user_profiles.sql completed successfully!' AS status;
