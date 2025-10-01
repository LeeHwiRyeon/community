-- 데이터베이스 성능 최적화 스크립트
-- 실행 전 백업을 권장합니다.

-- 1. 검색 성능 향상을 위한 인덱스
-- FULLTEXT 인덱스 (이미 존재할 수 있음)
CREATE INDEX IF NOT EXISTS ft_posts_title_content ON posts(title, content);

-- 게시판별 게시물 조회 최적화
CREATE INDEX IF NOT EXISTS idx_posts_board_deleted_created 
ON posts(board_id, deleted, created_at DESC);

-- 트렌딩 게시물 조회 최적화
CREATE INDEX IF NOT EXISTS idx_posts_views_created 
ON posts(views DESC, created_at DESC) 
WHERE deleted = 0;

-- 카테고리별 게시물 조회 최적화
CREATE INDEX IF NOT EXISTS idx_posts_category_deleted_created 
ON posts(category, deleted, created_at DESC);

-- 삭제된 게시물 제외 조회 최적화
CREATE INDEX IF NOT EXISTS idx_posts_deleted_created 
ON posts(deleted, created_at DESC);

-- 2. 조회수 관련 최적화
-- post_views 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_post_views_post_id ON post_views(post_id);

-- 조회수와 생성일 기준 정렬 최적화
CREATE INDEX IF NOT EXISTS idx_posts_deleted_views_created 
ON posts(deleted, views DESC, created_at DESC);

-- 3. 사용자 관련 최적화
-- 사용자명 검색 최적화
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- 이메일 검색 최적화
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 4. 댓글 관련 최적화
-- 게시물별 댓글 조회 최적화
CREATE INDEX IF NOT EXISTS idx_comments_post_deleted_created 
ON comments(post_id, deleted, created_at DESC);

-- 사용자별 댓글 조회 최적화
CREATE INDEX IF NOT EXISTS idx_comments_user_created 
ON comments(user_id, created_at DESC);

-- 5. 채팅 관련 최적화
-- 채팅방별 메시지 조회 최적화
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_created 
ON chat_messages(room_id, created_at DESC);

-- 사용자별 채팅 메시지 조회 최적화
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_created 
ON chat_messages(user_id, created_at DESC);

-- 6. 알림 관련 최적화
-- 사용자별 알림 조회 최적화
CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created 
ON notifications(user_id, read, created_at DESC);

-- 7. 태그 관련 최적화
-- 태그명 검색 최적화
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);

-- 게시물-태그 관계 최적화
CREATE INDEX IF NOT EXISTS idx_post_tags_post_id ON post_tags(post_id);
CREATE INDEX IF NOT EXISTS idx_post_tags_tag_id ON post_tags(tag_id);

-- 8. 투표 관련 최적화
-- 게시물별 투표 조회 최적화
CREATE INDEX IF NOT EXISTS idx_votes_post_user ON votes(post_id, user_id);

-- 사용자별 투표 조회 최적화
CREATE INDEX IF NOT EXISTS idx_votes_user_created ON votes(user_id, created_at DESC);

-- 9. 기존 인덱스 분석 및 최적화
-- 사용하지 않는 인덱스 확인 (수동으로 확인 필요)
-- SHOW INDEX FROM posts;
-- SHOW INDEX FROM users;
-- SHOW INDEX FROM comments;

-- 10. 테이블 통계 업데이트
-- MySQL 8.0 이상에서 통계 정보 업데이트
ANALYZE TABLE posts;
ANALYZE TABLE users;
ANALYZE TABLE comments;
ANALYZE TABLE chat_messages;
ANALYZE TABLE notifications;
ANALYZE TABLE votes;
ANALYZE TABLE tags;
ANALYZE TABLE post_tags;

-- 11. 쿼리 캐시 설정 (MySQL 5.7 이하)
-- SET GLOBAL query_cache_size = 268435456; -- 256MB
-- SET GLOBAL query_cache_type = ON;

-- 12. InnoDB 버퍼 풀 크기 확인 및 조정 권장사항
-- SHOW VARIABLES LIKE 'innodb_buffer_pool_size';
-- 권장: 시스템 메모리의 70-80%

-- 13. 연결 풀 설정 확인
-- SHOW VARIABLES LIKE 'max_connections';
-- 권장: 100-200 (서버 사양에 따라 조정)

-- 14. 슬로우 쿼리 로그 활성화
-- SET GLOBAL slow_query_log = 'ON';
-- SET GLOBAL long_query_time = 1; -- 1초 이상 쿼리 로그
-- SET GLOBAL log_queries_not_using_indexes = 'ON';

-- 15. 성능 모니터링을 위한 뷰 생성
CREATE OR REPLACE VIEW performance_stats AS
SELECT 
    'posts' as table_name,
    COUNT(*) as total_rows,
    COUNT(CASE WHEN deleted = 0 THEN 1 END) as active_rows,
    COUNT(CASE WHEN deleted = 1 THEN 1 END) as deleted_rows,
    MAX(created_at) as latest_created,
    MIN(created_at) as oldest_created
FROM posts
UNION ALL
SELECT 
    'users' as table_name,
    COUNT(*) as total_rows,
    COUNT(*) as active_rows,
    0 as deleted_rows,
    MAX(created_at) as latest_created,
    MIN(created_at) as oldest_created
FROM users
UNION ALL
SELECT 
    'comments' as table_name,
    COUNT(*) as total_rows,
    COUNT(CASE WHEN deleted = 0 THEN 1 END) as active_rows,
    COUNT(CASE WHEN deleted = 1 THEN 1 END) as deleted_rows,
    MAX(created_at) as latest_created,
    MIN(created_at) as oldest_created
FROM comments;

-- 16. 인덱스 사용률 확인 쿼리 (MySQL 8.0+)
-- SELECT 
--     object_schema,
--     object_name,
--     index_name,
--     count_read,
--     count_read / (count_read + count_insert + count_update + count_delete) as read_ratio
-- FROM performance_schema.table_io_waits_summary_by_index_usage
-- WHERE object_schema = DATABASE()
-- ORDER BY count_read DESC;

-- 17. 테이블 크기 확인
-- SELECT 
--     table_name,
--     ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'Size (MB)',
--     table_rows
-- FROM information_schema.tables
-- WHERE table_schema = DATABASE()
-- ORDER BY (data_length + index_length) DESC;

-- 18. 최적화 완료 후 성능 테스트 권장사항
-- 1. EXPLAIN ANALYZE로 쿼리 실행 계획 확인
-- 2. 슬로우 쿼리 로그 모니터링
-- 3. 인덱스 사용률 확인
-- 4. 메모리 사용량 모니터링
-- 5. 응답 시간 측정

-- 실행 완료 메시지
SELECT '데이터베이스 최적화 스크립트 실행 완료' as status;

