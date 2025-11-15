-- 팔로우 시스템 데이터베이스 스키마
-- 사용자 팔로우 및 게시판 팔로우 기능

-- 사용자 팔로우 테이블
CREATE TABLE IF NOT EXISTS user_follows (
    id INT PRIMARY KEY AUTO_INCREMENT,
    follower_id INT NOT NULL COMMENT '팔로우하는 사용자',
    following_id INT NOT NULL COMMENT '팔로우 당하는 사용자',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_follow (follower_id, following_id),
    INDEX idx_follower (follower_id),
    INDEX idx_following (following_id),
    CHECK (follower_id != following_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='사용자 팔로우';

-- 게시판 팔로우 테이블
CREATE TABLE IF NOT EXISTS board_follows (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    board_id INT NOT NULL,
    notification_enabled BOOLEAN DEFAULT TRUE COMMENT '새 게시물 알림 활성화',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE,
    UNIQUE KEY unique_board_follow (user_id, board_id),
    INDEX idx_user (user_id),
    INDEX idx_board (board_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='게시판 팔로우';

-- 팔로우 통계 뷰 (사용자)
CREATE OR REPLACE VIEW user_follow_stats AS
SELECT 
    u.id as user_id,
    u.username,
    u.display_name,
    (SELECT COUNT(*) FROM user_follows WHERE following_id = u.id) as follower_count,
    (SELECT COUNT(*) FROM user_follows WHERE follower_id = u.id) as following_count
FROM users u;

-- 인기 게시판 뷰 (팔로워 수 기준)
CREATE OR REPLACE VIEW popular_boards AS
SELECT 
    b.id as board_id,
    b.name as board_name,
    b.description,
    COUNT(bf.id) as follower_count,
    (SELECT COUNT(*) FROM posts WHERE board_id = b.id AND deleted = 0) as post_count
FROM boards b
LEFT JOIN board_follows bf ON b.id = bf.board_id
GROUP BY b.id, b.name, b.description
ORDER BY follower_count DESC;

-- 팔로우 피드용 뷰 (사용자가 팔로우하는 사람들의 최근 게시물)
CREATE OR REPLACE VIEW user_follow_feed AS
SELECT 
    p.id as post_id,
    p.title,
    p.content,
    p.user_id as author_id,
    u.username as author_username,
    u.display_name as author_display_name,
    p.board_id,
    b.name as board_name,
    p.created_at,
    p.view_count,
    (SELECT COUNT(*) FROM post_votes WHERE post_id = p.id AND vote_type = 1) as upvotes,
    (SELECT COUNT(*) FROM comments WHERE post_id = p.id AND deleted = 0) as comment_count
FROM posts p
INNER JOIN users u ON p.user_id = u.id
INNER JOIN boards b ON p.board_id = b.id
WHERE p.deleted = 0
ORDER BY p.created_at DESC;

-- 사용자가 팔로우하는 게시판의 최근 게시물
CREATE OR REPLACE VIEW board_follow_feed AS
SELECT 
    p.id as post_id,
    p.title,
    p.content,
    p.user_id as author_id,
    u.username as author_username,
    u.display_name as author_display_name,
    p.board_id,
    b.name as board_name,
    p.created_at,
    p.view_count,
    (SELECT COUNT(*) FROM post_votes WHERE post_id = p.id AND vote_type = 1) as upvotes,
    (SELECT COUNT(*) FROM comments WHERE post_id = p.id AND deleted = 0) as comment_count
FROM posts p
INNER JOIN users u ON p.user_id = u.id
INNER JOIN boards b ON p.board_id = b.id
WHERE p.deleted = 0
ORDER BY p.created_at DESC;
