-- =====================================================
-- Community Hub Database Migration to Microservices
-- =====================================================
-- This script migrates the monolithic database to microservices architecture
-- Each service will have its own dedicated database

-- =====================================================
-- 1. Create Service-Specific Databases
-- =====================================================

-- User Service Database
CREATE DATABASE IF NOT EXISTS `community_users` 
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Content Service Database  
CREATE DATABASE IF NOT EXISTS `community_content` 
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Chat Service Database
CREATE DATABASE IF NOT EXISTS `community_chat` 
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Notification Service Database
CREATE DATABASE IF NOT EXISTS `community_notifications` 
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- =====================================================
-- 2. User Service Database Schema
-- =====================================================

USE `community_users`;

-- Users table
CREATE TABLE IF NOT EXISTS `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `username` VARCHAR(50) NOT NULL UNIQUE,
    `email` VARCHAR(100) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `first_name` VARCHAR(100),
    `last_name` VARCHAR(100),
    `bio` TEXT,
    `avatar_url` VARCHAR(255),
    `role` VARCHAR(50) DEFAULT 'User',
    `is_active` BOOLEAN DEFAULT TRUE,
    `is_email_verified` BOOLEAN DEFAULT FALSE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `last_login_at` TIMESTAMP NULL,
    
    INDEX `idx_username` (`username`),
    INDEX `idx_email` (`email`),
    INDEX `idx_created_at` (`created_at`),
    INDEX `idx_is_active` (`is_active`)
);

-- User sessions table
CREATE TABLE IF NOT EXISTS `user_sessions` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `token` VARCHAR(500) NOT NULL,
    `ip_address` VARCHAR(45),
    `user_agent` VARCHAR(500),
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `expires_at` TIMESTAMP NOT NULL,
    `is_active` BOOLEAN DEFAULT TRUE,
    
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_expires_at` (`expires_at`),
    INDEX `idx_token` (`token`)
);

-- OAuth tokens table
CREATE TABLE IF NOT EXISTS `oauth_tokens` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `provider` VARCHAR(50) NOT NULL,
    `access_token` VARCHAR(500) NOT NULL,
    `refresh_token` VARCHAR(500),
    `expires_at` TIMESTAMP NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    UNIQUE KEY `uk_provider_access_token` (`provider`, `access_token`),
    INDEX `idx_user_id` (`user_id`)
);

-- =====================================================
-- 3. Content Service Database Schema
-- =====================================================

USE `community_content`;

-- Boards table
CREATE TABLE IF NOT EXISTS `boards` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL UNIQUE,
    `description` TEXT,
    `icon` VARCHAR(100),
    `color` VARCHAR(7),
    `is_active` BOOLEAN DEFAULT TRUE,
    `sort_order` INT DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX `idx_name` (`name`),
    INDEX `idx_is_active` (`is_active`),
    INDEX `idx_sort_order` (`sort_order`)
);

-- Categories table
CREATE TABLE IF NOT EXISTS `categories` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL UNIQUE,
    `description` TEXT,
    `color` VARCHAR(7),
    `is_active` BOOLEAN DEFAULT TRUE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX `idx_name` (`name`),
    INDEX `idx_is_active` (`is_active`)
);

-- Tags table
CREATE TABLE IF NOT EXISTS `tags` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(50) NOT NULL UNIQUE,
    `description` TEXT,
    `color` VARCHAR(7),
    `usage_count` INT DEFAULT 0,
    `is_active` BOOLEAN DEFAULT TRUE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX `idx_name` (`name`),
    INDEX `idx_usage_count` (`usage_count`),
    INDEX `idx_is_active` (`is_active`)
);

-- Posts table
CREATE TABLE IF NOT EXISTS `posts` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `title` VARCHAR(255) NOT NULL,
    `content` LONGTEXT NOT NULL,
    `summary` TEXT,
    `author_id` INT NOT NULL, -- Reference to User Service
    `board_id` INT NOT NULL,
    `category` VARCHAR(100),
    `tags` JSON,
    `featured_image_url` VARCHAR(500),
    `is_published` BOOLEAN DEFAULT TRUE,
    `is_pinned` BOOLEAN DEFAULT FALSE,
    `is_locked` BOOLEAN DEFAULT FALSE,
    `allow_comments` BOOLEAN DEFAULT TRUE,
    `view_count` INT DEFAULT 0,
    `like_count` INT DEFAULT 0,
    `dislike_count` INT DEFAULT 0,
    `comment_count` INT DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `published_at` TIMESTAMP NULL,
    `scheduled_at` TIMESTAMP NULL,
    
    FOREIGN KEY (`board_id`) REFERENCES `boards`(`id`) ON DELETE CASCADE,
    INDEX `idx_author_id` (`author_id`),
    INDEX `idx_board_id` (`board_id`),
    INDEX `idx_category` (`category`),
    INDEX `idx_is_published` (`is_published`),
    INDEX `idx_created_at` (`created_at`),
    INDEX `idx_published_at` (`published_at`),
    FULLTEXT `ft_title_content` (`title`, `content`, `summary`)
);

-- Comments table
CREATE TABLE IF NOT EXISTS `comments` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `content` TEXT NOT NULL,
    `post_id` INT NOT NULL,
    `author_id` INT NOT NULL, -- Reference to User Service
    `parent_id` INT NULL,
    `is_deleted` BOOLEAN DEFAULT FALSE,
    `like_count` INT DEFAULT 0,
    `dislike_count` INT DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`parent_id`) REFERENCES `comments`(`id`) ON DELETE RESTRICT,
    INDEX `idx_post_id` (`post_id`),
    INDEX `idx_author_id` (`author_id`),
    INDEX `idx_parent_id` (`parent_id`),
    INDEX `idx_created_at` (`created_at`)
);

-- Post tags junction table
CREATE TABLE IF NOT EXISTS `post_tags` (
    `post_id` INT NOT NULL,
    `tag_id` INT NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (`post_id`, `tag_id`),
    FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON DELETE CASCADE,
    INDEX `idx_post_id` (`post_id`),
    INDEX `idx_tag_id` (`tag_id`)
);

-- Post likes table
CREATE TABLE IF NOT EXISTS `post_likes` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `post_id` INT NOT NULL,
    `user_id` INT NOT NULL, -- Reference to User Service
    `is_like` BOOLEAN NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON DELETE CASCADE,
    UNIQUE KEY `uk_post_user` (`post_id`, `user_id`),
    INDEX `idx_post_id` (`post_id`),
    INDEX `idx_user_id` (`user_id`)
);

-- Comment likes table
CREATE TABLE IF NOT EXISTS `comment_likes` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `comment_id` INT NOT NULL,
    `user_id` INT NOT NULL, -- Reference to User Service
    `is_like` BOOLEAN NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (`comment_id`) REFERENCES `comments`(`id`) ON DELETE CASCADE,
    UNIQUE KEY `uk_comment_user` (`comment_id`, `user_id`),
    INDEX `idx_comment_id` (`comment_id`),
    INDEX `idx_user_id` (`user_id`)
);

-- Post views table
CREATE TABLE IF NOT EXISTS `post_views` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `post_id` INT NOT NULL,
    `user_id` INT DEFAULT 0, -- Reference to User Service (0 for anonymous)
    `ip_address` VARCHAR(45),
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON DELETE CASCADE,
    INDEX `idx_post_id` (`post_id`),
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_created_at` (`created_at`)
);

-- Post attachments table
CREATE TABLE IF NOT EXISTS `post_attachments` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `post_id` INT NOT NULL,
    `file_name` VARCHAR(255) NOT NULL,
    `file_url` VARCHAR(500) NOT NULL,
    `mime_type` VARCHAR(100),
    `file_size` BIGINT DEFAULT 0,
    `file_type` VARCHAR(50),
    `is_active` BOOLEAN DEFAULT TRUE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON DELETE CASCADE,
    INDEX `idx_post_id` (`post_id`),
    INDEX `idx_file_type` (`file_type`),
    INDEX `idx_is_active` (`is_active`)
);

-- =====================================================
-- 4. Chat Service Database Schema
-- =====================================================

USE `community_chat`;

-- Chat rooms table
CREATE TABLE IF NOT EXISTS `chat_rooms` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `description` TEXT,
    `type` VARCHAR(50) DEFAULT 'public',
    `color` VARCHAR(7),
    `avatar_url` VARCHAR(255),
    `created_by` INT NOT NULL, -- Reference to User Service
    `is_active` BOOLEAN DEFAULT TRUE,
    `max_members` INT DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX `idx_type` (`type`),
    INDEX `idx_created_by` (`created_by`),
    INDEX `idx_is_active` (`is_active`)
);

-- Chat messages table
CREATE TABLE IF NOT EXISTS `chat_messages` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `room_id` INT NOT NULL,
    `user_id` INT NOT NULL, -- Reference to User Service
    `content` TEXT NOT NULL,
    `message_type` VARCHAR(50) DEFAULT 'text',
    `file_url` VARCHAR(500),
    `file_name` VARCHAR(100),
    `file_size` BIGINT,
    `mime_type` VARCHAR(100),
    `reply_to_id` INT NULL,
    `is_edited` BOOLEAN DEFAULT FALSE,
    `is_deleted` BOOLEAN DEFAULT FALSE,
    `reaction_count` INT DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (`room_id`) REFERENCES `chat_rooms`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`reply_to_id`) REFERENCES `chat_messages`(`id`) ON DELETE RESTRICT,
    INDEX `idx_room_id` (`room_id`),
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_created_at` (`created_at`),
    INDEX `idx_message_type` (`message_type`)
);

-- Chat room members table
CREATE TABLE IF NOT EXISTS `chat_room_members` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `room_id` INT NOT NULL,
    `user_id` INT NOT NULL, -- Reference to User Service
    `role` VARCHAR(50) DEFAULT 'member',
    `is_active` BOOLEAN DEFAULT TRUE,
    `joined_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `last_read_at` TIMESTAMP NULL,
    
    FOREIGN KEY (`room_id`) REFERENCES `chat_rooms`(`id`) ON DELETE CASCADE,
    UNIQUE KEY `uk_room_user` (`room_id`, `user_id`),
    INDEX `idx_room_id` (`room_id`),
    INDEX `idx_user_id` (`user_id`)
);

-- Chat reactions table
CREATE TABLE IF NOT EXISTS `chat_reactions` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `message_id` INT NOT NULL,
    `user_id` INT NOT NULL, -- Reference to User Service
    `emoji` VARCHAR(10) NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (`message_id`) REFERENCES `chat_messages`(`id`) ON DELETE CASCADE,
    UNIQUE KEY `uk_message_user_emoji` (`message_id`, `user_id`, `emoji`),
    INDEX `idx_message_id` (`message_id`),
    INDEX `idx_user_id` (`user_id`)
);

-- User online status table
CREATE TABLE IF NOT EXISTS `user_online_status` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL, -- Reference to User Service
    `status` VARCHAR(20) DEFAULT 'online',
    `custom_status` VARCHAR(100),
    `last_seen_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY `uk_user_id` (`user_id`),
    INDEX `idx_status` (`status`)
);

-- =====================================================
-- 5. Notification Service Database Schema
-- =====================================================

USE `community_notifications`;

-- Notifications table
CREATE TABLE IF NOT EXISTS `notifications` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL, -- Reference to User Service
    `type` VARCHAR(100) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `message` TEXT NOT NULL,
    `action_url` VARCHAR(500),
    `image_url` VARCHAR(255),
    `related_id` INT,
    `related_type` VARCHAR(50),
    `is_read` BOOLEAN DEFAULT FALSE,
    `is_deleted` BOOLEAN DEFAULT FALSE,
    `priority` INT DEFAULT 1,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `read_at` TIMESTAMP NULL,
    `expires_at` TIMESTAMP NULL,
    
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_type` (`type`),
    INDEX `idx_is_read` (`is_read`),
    INDEX `idx_created_at` (`created_at`),
    INDEX `idx_priority` (`priority`)
);

-- Notification templates table
CREATE TABLE IF NOT EXISTS `notification_templates` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `type` VARCHAR(100) NOT NULL UNIQUE,
    `title_template` VARCHAR(255) NOT NULL,
    `message_template` TEXT NOT NULL,
    `action_url_template` VARCHAR(500),
    `is_active` BOOLEAN DEFAULT TRUE,
    `priority` INT DEFAULT 1,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX `idx_type` (`type`),
    INDEX `idx_is_active` (`is_active`)
);

-- Notification settings table
CREATE TABLE IF NOT EXISTS `notification_settings` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL, -- Reference to User Service
    `type` VARCHAR(100) NOT NULL,
    `email_enabled` BOOLEAN DEFAULT TRUE,
    `push_enabled` BOOLEAN DEFAULT TRUE,
    `in_app_enabled` BOOLEAN DEFAULT TRUE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY `uk_user_type` (`user_id`, `type`),
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_type` (`type`)
);

-- Push tokens table
CREATE TABLE IF NOT EXISTS `push_tokens` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL, -- Reference to User Service
    `token` VARCHAR(500) NOT NULL,
    `platform` VARCHAR(50) NOT NULL,
    `device_id` VARCHAR(100),
    `is_active` BOOLEAN DEFAULT TRUE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `last_used_at` TIMESTAMP NULL,
    
    FOREIGN KEY (`user_id`) REFERENCES `notification_settings`(`user_id`) ON DELETE CASCADE,
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_platform` (`platform`),
    INDEX `idx_is_active` (`is_active`)
);

-- =====================================================
-- 6. Create Database Users for Each Service
-- =====================================================

-- User Service Database User
CREATE USER IF NOT EXISTS 'community_user_service'@'%' IDENTIFIED BY 'user_service_password';
GRANT SELECT, INSERT, UPDATE, DELETE ON `community_users`.* TO 'community_user_service'@'%';

-- Content Service Database User
CREATE USER IF NOT EXISTS 'community_content_service'@'%' IDENTIFIED BY 'content_service_password';
GRANT SELECT, INSERT, UPDATE, DELETE ON `community_content`.* TO 'community_content_service'@'%';

-- Chat Service Database User
CREATE USER IF NOT EXISTS 'community_chat_service'@'%' IDENTIFIED BY 'chat_service_password';
GRANT SELECT, INSERT, UPDATE, DELETE ON `community_chat`.* TO 'community_chat_service'@'%';

-- Notification Service Database User
CREATE USER IF NOT EXISTS 'community_notification_service'@'%' IDENTIFIED BY 'notification_service_password';
GRANT SELECT, INSERT, UPDATE, DELETE ON `community_notifications`.* TO 'community_notification_service'@'%';

-- API Gateway Database User (read-only access to all databases)
CREATE USER IF NOT EXISTS 'community_api_gateway'@'%' IDENTIFIED BY 'api_gateway_password';
GRANT SELECT ON `community_users`.* TO 'community_api_gateway'@'%';
GRANT SELECT ON `community_content`.* TO 'community_api_gateway'@'%';
GRANT SELECT ON `community_chat`.* TO 'community_api_gateway'@'%';
GRANT SELECT ON `community_notifications`.* TO 'community_api_gateway'@'%';

-- Flush privileges
FLUSH PRIVILEGES;

-- =====================================================
-- 7. Insert Initial Data
-- =====================================================

-- Insert default boards
USE `community_content`;
INSERT INTO `boards` (`name`, `description`, `icon`, `color`, `sort_order`) VALUES
('General', 'General discussion board', '💬', '#3B82F6', 1),
('Announcements', 'Important announcements', '📢', '#EF4444', 2),
('Help & Support', 'Get help and support', '❓', '#10B981', 3),
('Feature Requests', 'Suggest new features', '💡', '#F59E0B', 4),
('Bug Reports', 'Report bugs and issues', '🐛', '#DC2626', 5);

-- Insert default categories
INSERT INTO `categories` (`name`, `description`, `color`) VALUES
('Discussion', 'General discussion topics', '#3B82F6'),
('Question', 'Questions and help requests', '#10B981'),
('Announcement', 'Important announcements', '#EF4444'),
('Feature', 'Feature requests and suggestions', '#F59E0B'),
('Bug', 'Bug reports and issues', '#DC2626');

-- Insert default notification templates
USE `community_notifications`;
INSERT INTO `notification_templates` (`type`, `title_template`, `message_template`, `action_url_template`, `priority`) VALUES
('post_like', '{author_name} liked your post "{post_title}"', 'Your post "{post_title}" received a like from {author_name}.', '/posts/{post_id}', 2),
('comment_reply', '{author_name} replied to your comment', '{author_name} replied to your comment: "{comment_preview}"', '/posts/{post_id}#comment-{comment_id}', 2),
('mention', '{author_name} mentioned you', '{author_name} mentioned you in a post: "{post_title}"', '/posts/{post_id}', 3),
('system', 'System Notification', '{message}', '{action_url}', 1),
('chat_message', 'New message from {sender_name}', '{sender_name} sent you a message: "{message_preview}"', '/chat/{room_id}', 2);

-- =====================================================
-- Migration Complete
-- =====================================================

SELECT 'Database migration to microservices completed successfully!' as status;
