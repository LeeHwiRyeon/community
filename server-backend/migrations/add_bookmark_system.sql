-- ============================================================================
-- Bookmark System Migration
-- 북마크/저장 시스템 데이터베이스 스키마
-- ============================================================================

-- 북마크 테이블 (게시물 저장)
CREATE TABLE IF NOT EXISTS bookmarks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    post_id INT NOT NULL,
    folder VARCHAR(100) DEFAULT 'default',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    UNIQUE KEY unique_bookmark (user_id, post_id),
    INDEX idx_user_folder (user_id, folder),
    INDEX idx_post (post_id),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 북마크 폴더 테이블 (사용자가 생성한 폴더)
CREATE TABLE IF NOT EXISTS bookmark_folders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(20) DEFAULT '#3182CE',
    icon VARCHAR(50) DEFAULT 'bookmark',
    is_private BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_folder (user_id, name),
    INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 북마크 통계 뷰
CREATE OR REPLACE VIEW bookmark_stats AS
SELECT 
    u.id AS user_id,
    u.username,
    COUNT(DISTINCT b.id) AS total_bookmarks,
    COUNT(DISTINCT b.folder) AS folder_count,
    COUNT(DISTINCT CASE WHEN b.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN b.id END) AS bookmarks_last_week,
    MAX(b.created_at) AS last_bookmark_at
FROM users u
LEFT JOIN bookmarks b ON u.id = b.user_id
GROUP BY u.id, u.username;

-- 인기 북마크 게시물 뷰
CREATE OR REPLACE VIEW popular_bookmarked_posts AS
SELECT 
    p.id,
    p.title,
    p.board_id,
    b.name AS board_name,
    p.user_id AS author_id,
    u.username AS author_username,
    u.display_name AS author_display_name,
    p.created_at,
    COUNT(bm.id) AS bookmark_count,
    p.view_count,
    p.upvotes,
    (SELECT COUNT(*) FROM comments WHERE post_id = p.id) AS comment_count
FROM posts p
INNER JOIN boards b ON p.board_id = b.id
INNER JOIN users u ON p.user_id = u.id
LEFT JOIN bookmarks bm ON p.id = bm.post_id
WHERE p.deleted = 0
GROUP BY p.id, p.title, p.board_id, b.name, p.user_id, u.username, u.display_name, p.created_at, p.view_count, p.upvotes
HAVING bookmark_count > 0
ORDER BY bookmark_count DESC, p.created_at DESC;

-- 사용자 북마크 피드 뷰
CREATE OR REPLACE VIEW user_bookmarks_feed AS
SELECT 
    b.id AS bookmark_id,
    b.user_id,
    b.post_id,
    b.folder,
    b.notes,
    b.created_at AS bookmarked_at,
    p.title AS post_title,
    p.content AS post_content,
    p.user_id AS author_id,
    u.username AS author_username,
    u.display_name AS author_display_name,
    u.profile_image AS author_avatar,
    p.board_id,
    bd.name AS board_name,
    p.created_at AS post_created_at,
    p.view_count,
    p.upvotes,
    p.downvotes,
    (SELECT COUNT(*) FROM comments WHERE post_id = p.id) AS comment_count
FROM bookmarks b
INNER JOIN posts p ON b.post_id = p.id
INNER JOIN users u ON p.user_id = u.id
INNER JOIN boards bd ON p.board_id = bd.id
WHERE p.deleted = 0
ORDER BY b.created_at DESC;

-- 폴더별 북마크 수 뷰
CREATE OR REPLACE VIEW folder_bookmark_counts AS
SELECT 
    bf.id AS folder_id,
    bf.user_id,
    bf.name AS folder_name,
    bf.description,
    bf.color,
    bf.icon,
    bf.is_private,
    COUNT(b.id) AS bookmark_count,
    MAX(b.created_at) AS last_bookmark_at
FROM bookmark_folders bf
LEFT JOIN bookmarks b ON bf.user_id = b.user_id AND bf.name = b.folder
GROUP BY bf.id, bf.user_id, bf.name, bf.description, bf.color, bf.icon, bf.is_private;

-- 기본 폴더 데이터 삽입 (필요시 사용)
-- INSERT INTO bookmark_folders (user_id, name, description, color, icon)
-- SELECT id, 'default', '기본 폴더', '#3182CE', 'bookmark'
-- FROM users
-- WHERE NOT EXISTS (
--     SELECT 1 FROM bookmark_folders 
--     WHERE user_id = users.id AND name = 'default'
-- );

-- 인덱스 최적화 (이미 생성된 경우 건너뜀)
-- ALTER TABLE bookmarks ADD INDEX IF NOT EXISTS idx_user_folder (user_id, folder);
-- ALTER TABLE bookmarks ADD INDEX IF NOT EXISTS idx_post (post_id);
-- ALTER TABLE bookmarks ADD INDEX IF NOT EXISTS idx_created (created_at);
-- ALTER TABLE bookmark_folders ADD INDEX IF NOT EXISTS idx_user (user_id);

-- ============================================================================
-- Migration Complete
-- ============================================================================
