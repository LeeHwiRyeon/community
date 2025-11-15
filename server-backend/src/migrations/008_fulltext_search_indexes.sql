-- =====================================================
-- Full-Text Search Indexes Migration
-- 고급 검색 시스템을 위한 MySQL Full-Text 인덱스
-- 
-- @author AUTOAGENTS
-- @date 2025-11-11
-- @version 1.0
-- =====================================================

-- posts 테이블에 Full-Text 인덱스 추가
-- 제목과 내용에 대한 전문 검색 지원
ALTER TABLE posts
ADD FULLTEXT INDEX ft_posts_title_content (title, content) WITH PARSER ngram;

-- posts 테이블에 검색 최적화 인덱스 추가
-- 카테고리별 검색 성능 향상
CREATE INDEX idx_posts_category ON posts(category, created_at);

-- 태그별 검색 성능 향상
CREATE INDEX idx_posts_tag ON posts(tag(100), created_at);

-- 작성자별 검색 성능 향상
CREATE INDEX idx_posts_author ON posts(author(100), created_at);

-- 날짜 범위 검색 성능 향상
CREATE INDEX idx_posts_dates ON posts(created_at, updated_at);

-- 삭제된 게시물 필터링 성능 향상
CREATE INDEX idx_posts_deleted ON posts(deleted, created_at);

-- users 테이블에 Full-Text 인덱스 추가
-- 사용자 이름과 이메일에 대한 전문 검색 지원
ALTER TABLE users
ADD FULLTEXT INDEX ft_users_name_email (display_name, email) WITH PARSER ngram;

-- users 테이블에 검색 최적화 인덱스
CREATE INDEX idx_users_status ON users(status, created_at);

-- 검색 히스토리 테이블 생성 (선택적 - Redis 대안)
CREATE TABLE IF NOT EXISTS search_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    search_term VARCHAR(255) NOT NULL,
    result_count INT DEFAULT 0,
    search_type ENUM('post', 'user', 'autocomplete') DEFAULT 'post',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_searches (user_id, created_at DESC),
    INDEX idx_search_term (search_term(100), created_at DESC),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 인기 검색어 집계 테이블 (선택적 - Redis 대안)
CREATE TABLE IF NOT EXISTS popular_searches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    search_term VARCHAR(255) NOT NULL UNIQUE,
    search_count INT DEFAULT 1,
    last_searched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_search_count (search_count DESC, last_searched_at DESC),
    INDEX idx_last_searched (last_searched_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- MySQL Full-Text 검색 설정 확인
-- ngram_token_size: 2 (한글 검색에 최적)
-- ft_min_word_len: 1
-- innodb_ft_min_token_size: 1

-- 설정 확인 쿼리 (참고용)
-- SHOW VARIABLES LIKE 'ngram_token_size';
-- SHOW VARIABLES LIKE 'ft_min_word_len';
-- SHOW VARIABLES LIKE 'innodb_ft_min_token_size';
