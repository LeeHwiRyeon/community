-- =====================================================
-- Data Migration Script from Monolithic to Microservices
-- =====================================================
-- This script migrates existing data from the monolithic database
-- to the new microservices databases

-- =====================================================
-- 1. Migrate Users Data
-- =====================================================

-- Migrate users from old database to User Service
INSERT INTO `community_users`.`users` (
    `id`, `username`, `email`, `password_hash`, `first_name`, `last_name`, 
    `bio`, `avatar_url`, `role`, `is_active`, `is_email_verified`, 
    `created_at`, `updated_at`, `last_login_at`
)
SELECT 
    `id`, `username`, `email`, `password_hash`, `first_name`, `last_name`,
    `bio`, `avatar_url`, `role`, `is_active`, `is_email_verified`,
    `created_at`, `updated_at`, `last_login_at`
FROM `community`.`users`
WHERE `id` NOT IN (SELECT `id` FROM `community_users`.`users`);

-- Migrate user sessions
INSERT INTO `community_users`.`user_sessions` (
    `user_id`, `token`, `ip_address`, `user_agent`, 
    `created_at`, `expires_at`, `is_active`
)
SELECT 
    `user_id`, `token`, `ip_address`, `user_agent`,
    `created_at`, `expires_at`, `is_active`
FROM `community`.`user_sessions`
WHERE `user_id` IN (SELECT `id` FROM `community_users`.`users`);

-- =====================================================
-- 2. Migrate Content Data
-- =====================================================

-- Migrate boards
INSERT INTO `community_content`.`boards` (
    `id`, `name`, `description`, `icon`, `color`, 
    `is_active`, `sort_order`, `created_at`, `updated_at`
)
SELECT 
    `id`, `name`, `description`, `icon`, `color`,
    `is_active`, `sort_order`, `created_at`, `updated_at`
FROM `community`.`boards`
WHERE `id` NOT IN (SELECT `id` FROM `community_content`.`boards`);

-- Migrate categories
INSERT INTO `community_content`.`categories` (
    `id`, `name`, `description`, `color`, 
    `is_active`, `created_at`, `updated_at`
)
SELECT 
    `id`, `name`, `description`, `color`,
    `is_active`, `created_at`, `updated_at`
FROM `community`.`categories`
WHERE `id` NOT IN (SELECT `id` FROM `community_content`.`categories`);

-- Migrate tags
INSERT INTO `community_content`.`tags` (
    `id`, `name`, `description`, `color`, 
    `usage_count`, `is_active`, `created_at`
)
SELECT 
    `id`, `name`, `description`, `color`,
    `usage_count`, `is_active`, `created_at`
FROM `community`.`tags`
WHERE `id` NOT IN (SELECT `id` FROM `community_content`.`tags`);

-- Migrate posts
INSERT INTO `community_content`.`posts` (
    `id`, `title`, `content`, `summary`, `author_id`, `board_id`, 
    `category`, `tags`, `featured_image_url`, `is_published`, 
    `is_pinned`, `is_locked`, `allow_comments`, `view_count`, 
    `like_count`, `dislike_count`, `comment_count`, `created_at`, 
    `updated_at`, `published_at`, `scheduled_at`
)
SELECT 
    `id`, `title`, `content`, `summary`, `author_id`, `board_id`,
    `category`, `tags`, `featured_image_url`, `is_published`,
    `is_pinned`, `is_locked`, `allow_comments`, `view_count`,
    `like_count`, `dislike_count`, `comment_count`, `created_at`,
    `updated_at`, `published_at`, `scheduled_at`
FROM `community`.`posts`
WHERE `id` NOT IN (SELECT `id` FROM `community_content`.`posts`);

-- Migrate comments
INSERT INTO `community_content`.`comments` (
    `id`, `content`, `post_id`, `author_id`, `parent_id`,
    `is_deleted`, `like_count`, `dislike_count`, `created_at`, `updated_at`
)
SELECT 
    `id`, `content`, `post_id`, `author_id`, `parent_id`,
    `is_deleted`, `like_count`, `dislike_count`, `created_at`, `updated_at`
FROM `community`.`comments`
WHERE `id` NOT IN (SELECT `id` FROM `community_content`.`comments`);

-- Migrate post tags
INSERT INTO `community_content`.`post_tags` (
    `post_id`, `tag_id`, `created_at`
)
SELECT 
    `post_id`, `tag_id`, `created_at`
FROM `community`.`post_tags`
WHERE `post_id` IN (SELECT `id` FROM `community_content`.`posts`)
  AND `tag_id` IN (SELECT `id` FROM `community_content`.`tags`);

-- Migrate post likes
INSERT INTO `community_content`.`post_likes` (
    `post_id`, `user_id`, `is_like`, `created_at`
)
SELECT 
    `post_id`, `user_id`, `is_like`, `created_at`
FROM `community`.`post_likes`
WHERE `post_id` IN (SELECT `id` FROM `community_content`.`posts`)
  AND `user_id` IN (SELECT `id` FROM `community_users`.`users`);

-- Migrate comment likes
INSERT INTO `community_content`.`comment_likes` (
    `comment_id`, `user_id`, `is_like`, `created_at`
)
SELECT 
    `comment_id`, `user_id`, `is_like`, `created_at`
FROM `community`.`comment_likes`
WHERE `comment_id` IN (SELECT `id` FROM `community_content`.`comments`)
  AND `user_id` IN (SELECT `id` FROM `community_users`.`users`);

-- Migrate post views
INSERT INTO `community_content`.`post_views` (
    `post_id`, `user_id`, `ip_address`, `created_at`
)
SELECT 
    `post_id`, `user_id`, `ip_address`, `created_at`
FROM `community`.`post_views`
WHERE `post_id` IN (SELECT `id` FROM `community_content`.`posts`);

-- Migrate post attachments
INSERT INTO `community_content`.`post_attachments` (
    `post_id`, `file_name`, `file_url`, `mime_type`, 
    `file_size`, `file_type`, `is_active`, `created_at`
)
SELECT 
    `post_id`, `file_name`, `file_url`, `mime_type`,
    `file_size`, `file_type`, `is_active`, `created_at`
FROM `community`.`post_attachments`
WHERE `post_id` IN (SELECT `id` FROM `community_content`.`posts`);

-- =====================================================
-- 3. Migrate Chat Data
-- =====================================================

-- Migrate chat rooms
INSERT INTO `community_chat`.`chat_rooms` (
    `id`, `name`, `description`, `type`, `color`, `avatar_url`,
    `created_by`, `is_active`, `max_members`, `created_at`, `updated_at`
)
SELECT 
    `id`, `name`, `description`, `type`, `color`, `avatar_url`,
    `created_by`, `is_active`, `max_members`, `created_at`, `updated_at`
FROM `community`.`chat_rooms`
WHERE `id` NOT IN (SELECT `id` FROM `community_chat`.`chat_rooms`);

-- Migrate chat messages
INSERT INTO `community_chat`.`chat_messages` (
    `id`, `room_id`, `user_id`, `content`, `message_type`,
    `file_url`, `file_name`, `file_size`, `mime_type`, `reply_to_id`,
    `is_edited`, `is_deleted`, `reaction_count`, `created_at`, `updated_at`
)
SELECT 
    `id`, `room_id`, `user_id`, `content`, `message_type`,
    `file_url`, `file_name`, `file_size`, `mime_type`, `reply_to_id`,
    `is_edited`, `is_deleted`, `reaction_count`, `created_at`, `updated_at`
FROM `community`.`chat_messages`
WHERE `id` NOT IN (SELECT `id` FROM `community_chat`.`chat_messages`);

-- Migrate chat room members
INSERT INTO `community_chat`.`chat_room_members` (
    `room_id`, `user_id`, `role`, `is_active`, `joined_at`, `last_read_at`
)
SELECT 
    `room_id`, `user_id`, `role`, `is_active`, `joined_at`, `last_read_at`
FROM `community`.`chat_room_members`
WHERE `room_id` IN (SELECT `id` FROM `community_chat`.`chat_rooms`)
  AND `user_id` IN (SELECT `id` FROM `community_users`.`users`);

-- Migrate chat reactions
INSERT INTO `community_chat`.`chat_reactions` (
    `message_id`, `user_id`, `emoji`, `created_at`
)
SELECT 
    `message_id`, `user_id`, `emoji`, `created_at`
FROM `community`.`chat_reactions`
WHERE `message_id` IN (SELECT `id` FROM `community_chat`.`chat_messages`)
  AND `user_id` IN (SELECT `id` FROM `community_users`.`users`);

-- Migrate user online status
INSERT INTO `community_chat`.`user_online_status` (
    `user_id`, `status`, `custom_status`, `last_seen_at`, `updated_at`
)
SELECT 
    `user_id`, `status`, `custom_status`, `last_seen_at`, `updated_at`
FROM `community`.`user_online_status`
WHERE `user_id` IN (SELECT `id` FROM `community_users`.`users`);

-- =====================================================
-- 4. Migrate Notification Data
-- =====================================================

-- Migrate notifications
INSERT INTO `community_notifications`.`notifications` (
    `id`, `user_id`, `type`, `title`, `message`, `action_url`,
    `image_url`, `related_id`, `related_type`, `is_read`, `is_deleted`,
    `priority`, `created_at`, `read_at`, `expires_at`
)
SELECT 
    `id`, `user_id`, `type`, `title`, `message`, `action_url`,
    `image_url`, `related_id`, `related_type`, `is_read`, `is_deleted`,
    `priority`, `created_at`, `read_at`, `expires_at`
FROM `community`.`notifications`
WHERE `id` NOT IN (SELECT `id` FROM `community_notifications`.`notifications`);

-- Migrate notification settings
INSERT INTO `community_notifications`.`notification_settings` (
    `user_id`, `type`, `email_enabled`, `push_enabled`, 
    `in_app_enabled`, `created_at`, `updated_at`
)
SELECT 
    `user_id`, `type`, `email_enabled`, `push_enabled`,
    `in_app_enabled`, `created_at`, `updated_at`
FROM `community`.`notification_settings`
WHERE `user_id` IN (SELECT `id` FROM `community_users`.`users`);

-- Migrate push tokens
INSERT INTO `community_notifications`.`push_tokens` (
    `user_id`, `token`, `platform`, `device_id`, 
    `is_active`, `created_at`, `updated_at`, `last_used_at`
)
SELECT 
    `user_id`, `token`, `platform`, `device_id`,
    `is_active`, `created_at`, `updated_at`, `last_used_at`
FROM `community`.`push_tokens`
WHERE `user_id` IN (SELECT `id` FROM `community_users`.`users`);

-- =====================================================
-- 5. Update Auto-increment Values
-- =====================================================

-- Update User Service auto-increment values
SET @max_user_id = (SELECT COALESCE(MAX(`id`), 0) FROM `community_users`.`users`);
SET @sql = CONCAT('ALTER TABLE `community_users`.`users` AUTO_INCREMENT = ', @max_user_id + 1);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Update Content Service auto-increment values
SET @max_post_id = (SELECT COALESCE(MAX(`id`), 0) FROM `community_content`.`posts`);
SET @sql = CONCAT('ALTER TABLE `community_content`.`posts` AUTO_INCREMENT = ', @max_post_id + 1);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @max_comment_id = (SELECT COALESCE(MAX(`id`), 0) FROM `community_content`.`comments`);
SET @sql = CONCAT('ALTER TABLE `community_content`.`comments` AUTO_INCREMENT = ', @max_comment_id + 1);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Update Chat Service auto-increment values
SET @max_room_id = (SELECT COALESCE(MAX(`id`), 0) FROM `community_chat`.`chat_rooms`);
SET @sql = CONCAT('ALTER TABLE `community_chat`.`chat_rooms` AUTO_INCREMENT = ', @max_room_id + 1);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @max_message_id = (SELECT COALESCE(MAX(`id`), 0) FROM `community_chat`.`chat_messages`);
SET @sql = CONCAT('ALTER TABLE `community_chat`.`chat_messages` AUTO_INCREMENT = ', @max_message_id + 1);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Update Notification Service auto-increment values
SET @max_notification_id = (SELECT COALESCE(MAX(`id`), 0) FROM `community_notifications`.`notifications`);
SET @sql = CONCAT('ALTER TABLE `community_notifications`.`notifications` AUTO_INCREMENT = ', @max_notification_id + 1);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =====================================================
-- 6. Data Validation
-- =====================================================

-- Validate User Service data
SELECT 
    'User Service' as service,
    COUNT(*) as total_users,
    COUNT(CASE WHEN `is_active` = TRUE THEN 1 END) as active_users,
    COUNT(CASE WHEN `is_email_verified` = TRUE THEN 1 END) as verified_users
FROM `community_users`.`users`;

-- Validate Content Service data
SELECT 
    'Content Service' as service,
    (SELECT COUNT(*) FROM `community_content`.`posts`) as total_posts,
    (SELECT COUNT(*) FROM `community_content`.`comments`) as total_comments,
    (SELECT COUNT(*) FROM `community_content`.`boards`) as total_boards,
    (SELECT COUNT(*) FROM `community_content`.`tags`) as total_tags;

-- Validate Chat Service data
SELECT 
    'Chat Service' as service,
    (SELECT COUNT(*) FROM `community_chat`.`chat_rooms`) as total_rooms,
    (SELECT COUNT(*) FROM `community_chat`.`chat_messages`) as total_messages,
    (SELECT COUNT(*) FROM `community_chat`.`chat_room_members`) as total_members;

-- Validate Notification Service data
SELECT 
    'Notification Service' as service,
    (SELECT COUNT(*) FROM `community_notifications`.`notifications`) as total_notifications,
    (SELECT COUNT(*) FROM `community_notifications`.`notification_settings`) as total_settings,
    (SELECT COUNT(*) FROM `community_notifications`.`push_tokens`) as total_tokens;

-- =====================================================
-- Data Migration Complete
-- =====================================================

SELECT 'Data migration from monolithic to microservices completed successfully!' as status;
