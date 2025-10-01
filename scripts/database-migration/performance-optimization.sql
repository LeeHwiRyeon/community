-- =====================================================
-- Database Performance Optimization for Microservices
-- =====================================================
-- This script optimizes database performance for each microservice

-- =====================================================
-- 1. User Service Optimizations
-- =====================================================

USE `community_users`;

-- Optimize users table indexes
ALTER TABLE `users` ADD INDEX `idx_username_active` (`username`, `is_active`);
ALTER TABLE `users` ADD INDEX `idx_email_active` (`email`, `is_active`);
ALTER TABLE `users` ADD INDEX `idx_role_active` (`role`, `is_active`);
ALTER TABLE `users` ADD INDEX `idx_created_at_active` (`created_at`, `is_active`);

-- Optimize user_sessions table indexes
ALTER TABLE `user_sessions` ADD INDEX `idx_user_active_expires` (`user_id`, `is_active`, `expires_at`);
ALTER TABLE `user_sessions` ADD INDEX `idx_token_active` (`token`, `is_active`);

-- Optimize oauth_tokens table indexes
ALTER TABLE `oauth_tokens` ADD INDEX `idx_user_provider` (`user_id`, `provider`);
ALTER TABLE `oauth_tokens` ADD INDEX `idx_expires_at` (`expires_at`);

-- =====================================================
-- 2. Content Service Optimizations
-- =====================================================

USE `community_content`;

-- Optimize posts table indexes
ALTER TABLE `posts` ADD INDEX `idx_board_published_created` (`board_id`, `is_published`, `created_at`);
ALTER TABLE `posts` ADD INDEX `idx_author_published_created` (`author_id`, `is_published`, `created_at`);
ALTER TABLE `posts` ADD INDEX `idx_category_published_created` (`category`, `is_published`, `created_at`);
ALTER TABLE `posts` ADD INDEX `idx_pinned_created` (`is_pinned`, `created_at`);
ALTER TABLE `posts` ADD INDEX `idx_views_created` (`view_count`, `created_at`);
ALTER TABLE `posts` ADD INDEX `idx_likes_created` (`like_count`, `created_at`);
ALTER TABLE `posts` ADD INDEX `idx_comments_created` (`comment_count`, `created_at`);

-- Optimize comments table indexes
ALTER TABLE `comments` ADD INDEX `idx_post_created` (`post_id`, `created_at`);
ALTER TABLE `comments` ADD INDEX `idx_author_created` (`author_id`, `created_at`);
ALTER TABLE `comments` ADD INDEX `idx_parent_created` (`parent_id`, `created_at`);

-- Optimize post_tags table indexes
ALTER TABLE `post_tags` ADD INDEX `idx_tag_created` (`tag_id`, `created_at`);

-- Optimize post_likes table indexes
ALTER TABLE `post_likes` ADD INDEX `idx_user_created` (`user_id`, `created_at`);
ALTER TABLE `post_likes` ADD INDEX `idx_post_like` (`post_id`, `is_like`);

-- Optimize comment_likes table indexes
ALTER TABLE `comment_likes` ADD INDEX `idx_user_created` (`user_id`, `created_at`);
ALTER TABLE `comment_likes` ADD INDEX `idx_comment_like` (`comment_id`, `is_like`);

-- Optimize post_views table indexes
ALTER TABLE `post_views` ADD INDEX `idx_user_created` (`user_id`, `created_at`);
ALTER TABLE `post_views` ADD INDEX `idx_ip_created` (`ip_address`, `created_at`);

-- Optimize post_attachments table indexes
ALTER TABLE `post_attachments` ADD INDEX `idx_post_active` (`post_id`, `is_active`);
ALTER TABLE `post_attachments` ADD INDEX `idx_file_type_active` (`file_type`, `is_active`);

-- =====================================================
-- 3. Chat Service Optimizations
-- =====================================================

USE `community_chat`;

-- Optimize chat_rooms table indexes
ALTER TABLE `chat_rooms` ADD INDEX `idx_type_active` (`type`, `is_active`);
ALTER TABLE `chat_rooms` ADD INDEX `idx_created_by_active` (`created_by`, `is_active`);
ALTER TABLE `chat_rooms` ADD INDEX `idx_updated_at` (`updated_at`);

-- Optimize chat_messages table indexes
ALTER TABLE `chat_messages` ADD INDEX `idx_room_created` (`room_id`, `created_at`);
ALTER TABLE `chat_messages` ADD INDEX `idx_user_created` (`user_id`, `created_at`);
ALTER TABLE `chat_messages` ADD INDEX `idx_room_type_created` (`room_id`, `message_type`, `created_at`);
ALTER TABLE `chat_messages` ADD INDEX `idx_reply_to_created` (`reply_to_id`, `created_at`);

-- Optimize chat_room_members table indexes
ALTER TABLE `chat_room_members` ADD INDEX `idx_room_active` (`room_id`, `is_active`);
ALTER TABLE `chat_room_members` ADD INDEX `idx_user_active` (`user_id`, `is_active`);
ALTER TABLE `chat_room_members` ADD INDEX `idx_room_role` (`room_id`, `role`);

-- Optimize chat_reactions table indexes
ALTER TABLE `chat_reactions` ADD INDEX `idx_message_emoji` (`message_id`, `emoji`);
ALTER TABLE `chat_reactions` ADD INDEX `idx_user_created` (`user_id`, `created_at`);

-- Optimize user_online_status table indexes
ALTER TABLE `user_online_status` ADD INDEX `idx_status_updated` (`status`, `updated_at`);
ALTER TABLE `user_online_status` ADD INDEX `idx_last_seen` (`last_seen_at`);

-- =====================================================
-- 4. Notification Service Optimizations
-- =====================================================

USE `community_notifications`;

-- Optimize notifications table indexes
ALTER TABLE `notifications` ADD INDEX `idx_user_read_created` (`user_id`, `is_read`, `created_at`);
ALTER TABLE `notifications` ADD INDEX `idx_user_type_created` (`user_id`, `type`, `created_at`);
ALTER TABLE `notifications` ADD INDEX `idx_type_created` (`type`, `created_at`);
ALTER TABLE `notifications` ADD INDEX `idx_priority_created` (`priority`, `created_at`);
ALTER TABLE `notifications` ADD INDEX `idx_related_created` (`related_type`, `related_id`, `created_at`);

-- Optimize notification_templates table indexes
ALTER TABLE `notification_templates` ADD INDEX `idx_type_active` (`type`, `is_active`);

-- Optimize notification_settings table indexes
ALTER TABLE `notification_settings` ADD INDEX `idx_user_type` (`user_id`, `type`);

-- Optimize push_tokens table indexes
ALTER TABLE `push_tokens` ADD INDEX `idx_user_platform` (`user_id`, `platform`);
ALTER TABLE `push_tokens` ADD INDEX `idx_platform_active` (`platform`, `is_active`);
ALTER TABLE `push_tokens` ADD INDEX `idx_last_used` (`last_used_at`);

-- =====================================================
-- 5. Database Configuration Optimizations
-- =====================================================

-- Optimize MySQL configuration for each database
-- Note: These settings should be applied to my.cnf or my.ini

-- For User Service Database
-- innodb_buffer_pool_size = 256M
-- innodb_log_file_size = 64M
-- innodb_flush_log_at_trx_commit = 2
-- query_cache_size = 32M
-- query_cache_type = 1

-- For Content Service Database (largest database)
-- innodb_buffer_pool_size = 512M
-- innodb_log_file_size = 128M
-- innodb_flush_log_at_trx_commit = 2
-- query_cache_size = 64M
-- query_cache_type = 1

-- For Chat Service Database
-- innodb_buffer_pool_size = 256M
-- innodb_log_file_size = 64M
-- innodb_flush_log_at_trx_commit = 2
-- query_cache_size = 32M
-- query_cache_type = 1

-- For Notification Service Database
-- innodb_buffer_pool_size = 128M
-- innodb_log_file_size = 32M
-- innodb_flush_log_at_trx_commit = 2
-- query_cache_size = 16M
-- query_cache_type = 1

-- =====================================================
-- 6. Partitioning for Large Tables
-- =====================================================

-- Partition posts table by creation date (monthly partitions)
USE `community_content`;

-- Note: Partitioning requires careful planning and testing
-- This is an example for posts table partitioning by month
-- ALTER TABLE `posts` PARTITION BY RANGE (YEAR(created_at) * 100 + MONTH(created_at)) (
--     PARTITION p202401 VALUES LESS THAN (202402),
--     PARTITION p202402 VALUES LESS THAN (202403),
--     PARTITION p202403 VALUES LESS THAN (202404),
--     PARTITION p202404 VALUES LESS THAN (202405),
--     PARTITION p202405 VALUES LESS THAN (202406),
--     PARTITION p202406 VALUES LESS THAN (202407),
--     PARTITION p202407 VALUES LESS THAN (202408),
--     PARTITION p202408 VALUES LESS THAN (202409),
--     PARTITION p202409 VALUES LESS THAN (202410),
--     PARTITION p202410 VALUES LESS THAN (202411),
--     PARTITION p202411 VALUES LESS THAN (202412),
--     PARTITION p202412 VALUES LESS THAN (202501),
--     PARTITION p_future VALUES LESS THAN MAXVALUE
-- );

-- =====================================================
-- 7. Create Views for Common Queries
-- =====================================================

-- User Service Views
USE `community_users`;

CREATE OR REPLACE VIEW `active_users` AS
SELECT 
    `id`, `username`, `email`, `first_name`, `last_name`, 
    `avatar_url`, `role`, `created_at`, `last_login_at`
FROM `users` 
WHERE `is_active` = TRUE;

-- Content Service Views
USE `community_content`;

CREATE OR REPLACE VIEW `published_posts` AS
SELECT 
    `id`, `title`, `content`, `summary`, `author_id`, `board_id`, 
    `category`, `tags`, `featured_image_url`, `view_count`, 
    `like_count`, `comment_count`, `created_at`, `published_at`
FROM `posts` 
WHERE `is_published` = TRUE;

CREATE OR REPLACE VIEW `popular_posts` AS
SELECT 
    `id`, `title`, `summary`, `author_id`, `board_id`, 
    `view_count`, `like_count`, `comment_count`, `created_at`
FROM `posts` 
WHERE `is_published` = TRUE 
ORDER BY (`view_count` + `like_count` * 2 + `comment_count` * 3) DESC;

-- Chat Service Views
USE `community_chat`;

CREATE OR REPLACE VIEW `active_rooms` AS
SELECT 
    `id`, `name`, `description`, `type`, `color`, `avatar_url`,
    `created_by`, `max_members`, `created_at`, `updated_at`
FROM `chat_rooms` 
WHERE `is_active` = TRUE;

CREATE OR REPLACE VIEW `recent_messages` AS
SELECT 
    `id`, `room_id`, `user_id`, `content`, `message_type`,
    `created_at`
FROM `chat_messages` 
WHERE `is_deleted` = FALSE 
ORDER BY `created_at` DESC;

-- Notification Service Views
USE `community_notifications`;

CREATE OR REPLACE VIEW `unread_notifications` AS
SELECT 
    `id`, `user_id`, `type`, `title`, `message`, `action_url`,
    `priority`, `created_at`
FROM `notifications` 
WHERE `is_read` = FALSE AND `is_deleted` = FALSE;

-- =====================================================
-- 8. Create Stored Procedures for Common Operations
-- =====================================================

-- User Service Procedures
USE `community_users`;

DELIMITER //

CREATE PROCEDURE `GetUserStats`(IN user_id INT)
BEGIN
    SELECT 
        u.id,
        u.username,
        u.email,
        u.created_at,
        u.last_login_at,
        COUNT(DISTINCT us.id) as active_sessions,
        COUNT(DISTINCT ot.id) as oauth_connections
    FROM users u
    LEFT JOIN user_sessions us ON u.id = us.user_id AND us.is_active = TRUE
    LEFT JOIN oauth_tokens ot ON u.id = ot.user_id
    WHERE u.id = user_id
    GROUP BY u.id, u.username, u.email, u.created_at, u.last_login_at;
END //

-- Content Service Procedures
USE `community_content`;

CREATE PROCEDURE `GetPostStats`(IN post_id INT)
BEGIN
    SELECT 
        p.id,
        p.title,
        p.view_count,
        p.like_count,
        p.dislike_count,
        p.comment_count,
        COUNT(DISTINCT pt.tag_id) as tag_count,
        COUNT(DISTINCT pa.id) as attachment_count
    FROM posts p
    LEFT JOIN post_tags pt ON p.id = pt.post_id
    LEFT JOIN post_attachments pa ON p.id = pa.post_id AND pa.is_active = TRUE
    WHERE p.id = post_id
    GROUP BY p.id, p.title, p.view_count, p.like_count, p.dislike_count, p.comment_count;
END //

-- Chat Service Procedures
USE `community_chat`;

CREATE PROCEDURE `GetRoomStats`(IN room_id INT)
BEGIN
    SELECT 
        r.id,
        r.name,
        r.type,
        COUNT(DISTINCT rm.user_id) as member_count,
        COUNT(DISTINCT cm.id) as message_count,
        MAX(cm.created_at) as last_message_at
    FROM chat_rooms r
    LEFT JOIN chat_room_members rm ON r.id = rm.room_id AND rm.is_active = TRUE
    LEFT JOIN chat_messages cm ON r.id = cm.room_id AND cm.is_deleted = FALSE
    WHERE r.id = room_id
    GROUP BY r.id, r.name, r.type;
END //

-- Notification Service Procedures
USE `community_notifications`;

CREATE PROCEDURE `GetUserNotificationStats`(IN user_id INT)
BEGIN
    SELECT 
        u.id,
        u.username,
        COUNT(DISTINCT n.id) as total_notifications,
        COUNT(DISTINCT CASE WHEN n.is_read = FALSE THEN n.id END) as unread_notifications,
        COUNT(DISTINCT ns.id) as notification_settings,
        COUNT(DISTINCT pt.id) as push_tokens
    FROM users u
    LEFT JOIN notifications n ON u.id = n.user_id AND n.is_deleted = FALSE
    LEFT JOIN notification_settings ns ON u.id = ns.user_id
    LEFT JOIN push_tokens pt ON u.id = pt.user_id AND pt.is_active = TRUE
    WHERE u.id = user_id
    GROUP BY u.id, u.username;
END //

DELIMITER ;

-- =====================================================
-- Performance Optimization Complete
-- =====================================================

SELECT 'Database performance optimization completed successfully!' as status;
