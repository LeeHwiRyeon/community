-- Community Microservices Database Initialization

-- 사용자 서비스 데이터베이스
CREATE DATABASE IF NOT EXISTS community_users;
USE community_users;

-- 채팅 서비스 데이터베이스
CREATE DATABASE IF NOT EXISTS community_chat;
USE community_chat;

-- 알림 서비스 데이터베이스
CREATE DATABASE IF NOT EXISTS community_notifications;
USE community_notifications;

-- 메인 커뮤니티 데이터베이스
CREATE DATABASE IF NOT EXISTS community;
USE community;

-- 인덱스 최적화
-- 사용자 서비스 인덱스
USE community_users;
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);

-- 채팅 서비스 인덱스
USE community_chat;
CREATE INDEX idx_chat_rooms_type ON chat_rooms(type);
CREATE INDEX idx_chat_rooms_active ON chat_rooms(isActive);
CREATE INDEX idx_chat_messages_room ON chat_messages(roomId);
CREATE INDEX idx_chat_messages_user ON chat_messages(userId);
CREATE INDEX idx_chat_messages_created ON chat_messages(createdAt);
CREATE INDEX idx_chat_members_room_user ON chat_members(roomId, userId);
CREATE INDEX idx_chat_members_user ON chat_members(userId);

-- 알림 서비스 인덱스
USE community_notifications;
CREATE INDEX idx_notifications_user ON notifications(userId);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_created ON notifications(createdAt);

-- 성능 최적화 설정
SET GLOBAL innodb_buffer_pool_size = 1G;
SET GLOBAL max_connections = 1000;
SET GLOBAL query_cache_size = 256M;
SET GLOBAL query_cache_type = 1;

-- 연결 풀 설정
SET GLOBAL wait_timeout = 28800;
SET GLOBAL interactive_timeout = 28800;

-- 로그 설정
SET GLOBAL slow_query_log = 1;
SET GLOBAL long_query_time = 2;
SET GLOBAL log_queries_not_using_indexes = 1;

-- 완료 메시지
SELECT 'Database initialization completed successfully' as status;
